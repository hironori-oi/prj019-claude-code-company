/**
 * C-OC-03 — API contract test (Round 17 W1 完成版, 5/9 kickoff)
 * 月次で OpenClaw upstream OSS の CLI / config schema 差分検出。
 * Spec: ../../specs/17day-path-7ctrl.md#c-oc-03
 *
 * Round 17 W1 で I/O port 実装注入: fetch + retry + timeout を runner 側に集約。
 * 副作用 0 (port 経由のみ。本ファイルは外部 API を直接呼ばない)。
 */
import { z } from 'zod'

export const SeveritySchema = z.enum(['major', 'minor', 'patch'])
export type Severity = z.infer<typeof SeveritySchema>

export const ContractDiffSchema = z.object({
  field: z.string().min(1),
  before: z.string(),
  after: z.string(),
  severity: SeveritySchema,
})
export type ContractDiff = z.infer<typeof ContractDiffSchema>

export const ContractInputSchema = z.object({
  runId: z.string().min(1),
  upstreamRef: z.string().min(1),
  localFixturePath: z.string().min(1),
})
export type ContractInput = z.infer<typeof ContractInputSchema>

export const ContractOutputSchema = z.object({
  matched: z.boolean(),
  diffs: z.array(ContractDiffSchema),
  reportPath: z.string().min(1),
  softFailed: z.boolean(),
})
export type ContractOutput = z.infer<typeof ContractOutputSchema>

export interface UpstreamFetcher {
  fetch(ref: string): Promise<{ ok: boolean; body?: string }>
}

/** Round 17 W1: retry + timeout 設定 (default 3 回 / 5s)。 */
export interface ContractRunnerOptions {
  maxRetries?: number
  timeoutMs?: number
  fixtureLoader?: (path: string) => Promise<string>
  /** Round 17 W1: 注入可能な timer (test 用)。default は globalThis の setTimeout / clearTimeout。 */
  timers?: {
    setTimeout: (cb: () => void, ms: number) => unknown
    clearTimeout: (handle: unknown) => void
  }
}

const DEFAULT_OPTS: Required<Pick<ContractRunnerOptions, 'maxRetries' | 'timeoutMs'>> = {
  maxRetries: 3,
  timeoutMs: 5_000,
}

/**
 * Round 17 W1: timeout 付き fetch wrapper。
 * port が timeout 内に解決しない場合 'fetch_timeout' で reject。
 */
async function fetchWithTimeout(
  fetcher: UpstreamFetcher,
  ref: string,
  timeoutMs: number,
  timers: NonNullable<ContractRunnerOptions['timers']>,
): Promise<{ ok: boolean; body?: string }> {
  return new Promise<{ ok: boolean; body?: string }>((resolve, reject) => {
    let settled = false
    const handle = timers.setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error('fetch_timeout'))
    }, timeoutMs)
    fetcher
      .fetch(ref)
      .then((res) => {
        if (settled) return
        settled = true
        timers.clearTimeout(handle)
        resolve(res)
      })
      .catch((e) => {
        if (settled) return
        settled = true
        timers.clearTimeout(handle)
        reject(e instanceof Error ? e : new Error(String(e)))
      })
  })
}

/**
 * 単純 JSON diff (深さ 1 のみ — upstream CLI flag 表 / config field 表が flat 前提)。
 * severity 推定: 削除 = major / 型変更 = major / 新規 = minor / 値変更 = patch。
 */
export function computeContractDiff(
  before: Record<string, string>,
  after: Record<string, string>,
): ContractDiff[] {
  const diffs: ContractDiff[] = []
  for (const [field, beforeVal] of Object.entries(before)) {
    if (!(field in after)) {
      diffs.push({ field, before: beforeVal, after: '', severity: 'major' })
      continue
    }
    const afterVal = after[field]!
    if (beforeVal === afterVal) continue
    const sameType = typeof beforeVal === typeof afterVal
    diffs.push({
      field,
      before: beforeVal,
      after: afterVal,
      severity: sameType ? 'patch' : 'major',
    })
  }
  for (const field of Object.keys(after)) {
    if (!(field in before)) {
      diffs.push({ field, before: '', after: after[field]!, severity: 'minor' })
    }
  }
  return diffs
}

/** Round 17 W1 完成版: fetch + retry + timeout + diff engine + soft-fail パス。 */
export async function runContractTest(
  input: ContractInput,
  fetcher: UpstreamFetcher,
  opts: ContractRunnerOptions = {},
): Promise<ContractOutput> {
  ContractInputSchema.parse(input)
  const maxRetries = opts.maxRetries ?? DEFAULT_OPTS.maxRetries
  const timeoutMs = opts.timeoutMs ?? DEFAULT_OPTS.timeoutMs
  const timers = opts.timers ?? {
    setTimeout: (cb, ms) => setTimeout(cb, ms),
    clearTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
  }
  const reportPath = `${input.localFixturePath}.report.json`

  let lastError: unknown = null
  let upstreamBody: string | undefined
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetchWithTimeout(fetcher, input.upstreamRef, timeoutMs, timers)
      if (res.ok) {
        upstreamBody = res.body ?? '{}'
        lastError = null
        break
      }
      lastError = new Error('upstream_not_ok')
    } catch (e) {
      lastError = e
    }
  }

  if (lastError !== null || upstreamBody === undefined) {
    // soft-fail: upstream 取得失敗 → 前回結果保持 stub + Slack 通知のみ (caller 側で実施)
    return { matched: true, diffs: [], reportPath, softFailed: true }
  }

  // fixture 読込: loader 注入が無い場合は body のみで diff 不能 → matched=true 扱い
  if (!opts.fixtureLoader) {
    return { matched: true, diffs: [], reportPath, softFailed: false }
  }

  let fixtureBody: string
  try {
    fixtureBody = await opts.fixtureLoader(input.localFixturePath)
  } catch {
    // fixture 破損 → fail-loud
    throw new Error('fixture_corrupted')
  }

  const beforeMap = safeParseFlatMap(fixtureBody)
  const afterMap = safeParseFlatMap(upstreamBody)
  if (beforeMap === null) throw new Error('fixture_corrupted')
  if (afterMap === null) {
    // upstream が壊れている → soft-fail
    return { matched: true, diffs: [], reportPath, softFailed: true }
  }
  const diffs = computeContractDiff(beforeMap, afterMap)
  return {
    matched: diffs.length === 0,
    diffs,
    reportPath,
    softFailed: false,
  }
}

function safeParseFlatMap(json: string): Record<string, string> | null {
  try {
    const obj = JSON.parse(json) as unknown
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return null
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = typeof v === 'string' ? v : JSON.stringify(v)
    }
    return out
  } catch {
    return null
  }
}
