/**
 * ban-drill — Round 7 W0-Week1 prefetch (G-07):
 *   BAN drill 実行ハーネス。Round 6 Research 388 行 deliverable
 *   (review-ban-drill-1-scenario.md / -3-scenario.md / -2-procedure.md
 *    + research-w0-week2-round5-ng3-baseline.md) の仕様起点。
 *
 * カバーする 3 シナリオ:
 *   #1 NG-3 cap 突破 (90min) — Anthropic NG-3 上限超過の検知 → kill-switch → 通知 SLA
 *   #2 subscription 急速消費 (60min) — Codex Pro subscription burn rate 検証
 *   #3 mock 70% 化 (45min) — mock-claude スタブ動作率 70% 化での副作用ゼロ確認
 *
 * 設計方針:
 *   - 各シナリオは `BanDrillScenario` interface (id / name / durationMs / steps[])。
 *     Step は `name + run(ctx)` の連結。run は boolean / DrillStepOutcome を返す。
 *   - `executeScenario` は steps を順次実行、各 step の duration / outcome / error を
 *     計測して `BanDrillRun` を返す。失敗時も後続 step は best-effort で実行する
 *     (drill 性質: 1 step の失敗で全体 fail と判定しない、後続 SLA も計測する)。
 *   - audit log (任意) に 'ban_drill' event として 1 シナリオ 1 entry を記録する。
 *   - 実行は dryRun を default true (側副作用ゼロで scenario 実行確認のみ)。
 */
import type { AuditLogStore } from '@clawbridge/audit'

export interface BanDrillContext {
  /** drill 実行 ID (UUID 風)。audit log での追跡用。 */
  runId: string
  /** drill が dryRun か (default true) */
  dryRun: boolean
  /** 注入された AbortSignal (test 用、tear-down 時の中断) */
  abortSignal?: AbortSignal
  /** 任意の scenario 固有データ (シナリオ間で受け渡し) */
  state: Record<string, unknown>
}

export interface DrillStepOutcome {
  ok: boolean
  /** 観測したメトリクス (例: { detectMs: 42, notifyMs: 230 }) */
  metrics?: Record<string, number>
  message?: string
}

export interface BanDrillStep {
  name: string
  /** Step 単位の SLA (ms)。指定すると run の elapsed と比較して slaViolated を判定。 */
  slaMs?: number
  run(ctx: BanDrillContext): Promise<DrillStepOutcome | boolean | void>
}

export interface BanDrillScenario {
  id: 'ban-drill-1' | 'ban-drill-2' | 'ban-drill-3'
  name: string
  /** scenario 全体の上限時間 (ms)。 */
  durationMs: number
  steps: BanDrillStep[]
}

export interface BanDrillStepRun {
  name: string
  ok: boolean
  elapsedMs: number
  slaMs?: number
  slaViolated?: boolean
  metrics?: Record<string, number>
  message?: string
  error?: string
}

export interface BanDrillRun {
  scenarioId: BanDrillScenario['id']
  scenarioName: string
  runId: string
  startedAt: string
  finishedAt: string
  totalMs: number
  steps: BanDrillStepRun[]
  /** 全 step の ok=true かつ scenario 全体時間が durationMs 以内 */
  passed: boolean
}

export interface ExecuteScenarioOptions {
  /** 注入用 ID (default: ランダム) */
  runId?: string
  dryRun?: boolean
  audit?: AuditLogStore
  abortSignal?: AbortSignal
  /** 注入用 now (test) */
  now?: () => Date
}

export async function executeScenario(
  scenario: BanDrillScenario,
  opts: ExecuteScenarioOptions = {},
): Promise<BanDrillRun> {
  const now = opts.now ?? (() => new Date())
  const runId = opts.runId ?? generateRunId()
  const dryRun = opts.dryRun ?? true
  const ctx: BanDrillContext = {
    runId,
    dryRun,
    state: {},
    ...(opts.abortSignal !== undefined && { abortSignal: opts.abortSignal }),
  }
  const startedAt = now().toISOString()
  const startMs = now().getTime()
  const steps: BanDrillStepRun[] = []
  for (const s of scenario.steps) {
    const stepStart = now().getTime()
    let ok = false
    let metrics: Record<string, number> | undefined
    let message: string | undefined
    let error: string | undefined
    try {
      const r = await s.run(ctx)
      if (typeof r === 'boolean') ok = r
      else if (r && typeof r === 'object') {
        ok = r.ok
        if (r.metrics !== undefined) metrics = r.metrics
        if (r.message !== undefined) message = r.message
      } else {
        ok = true
      }
    } catch (err) {
      ok = false
      error = (err as Error).message
    }
    const elapsedMs = now().getTime() - stepStart
    const stepRun: BanDrillStepRun = {
      name: s.name,
      ok,
      elapsedMs,
      ...(s.slaMs !== undefined && {
        slaMs: s.slaMs,
        slaViolated: elapsedMs > s.slaMs,
      }),
      ...(metrics !== undefined && { metrics }),
      ...(message !== undefined && { message }),
      ...(error !== undefined && { error }),
    }
    steps.push(stepRun)
    if (ctx.abortSignal?.aborted) break
  }
  const finishedAt = now().toISOString()
  const totalMs = now().getTime() - startMs
  const allOk = steps.every((s) => s.ok && s.slaViolated !== true)
  const withinDuration = totalMs <= scenario.durationMs
  const passed = allOk && withinDuration
  const run: BanDrillRun = {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    runId,
    startedAt,
    finishedAt,
    totalMs,
    steps,
    passed,
  }
  if (opts.audit) {
    try {
      await opts.audit.append({
        type: 'ban_drill',
        source: 'harness',
        payload: {
          runId,
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          dryRun,
          passed,
          stepCount: steps.length,
          totalMs,
        },
      })
    } catch {
      // best effort
    }
  }
  return run
}

function generateRunId(): string {
  return `drill-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/* -------------------------------------------------------------------------- *
 * 3 シナリオ skeleton 定義 (Round 6 Research deliverable 起点)
 *
 * 注: W0-Week1 段階では実 BAN を起こさず、scenario 構造のみ提供する。
 * 各 step の `run` は dryRun=true 時にメトリクス mock を返し、
 * dryRun=false 時には実 SLA 検証 hook (researcher / reviewer 提供) と接続する。
 * -------------------------------------------------------------------------- */

/** #1 NG-3 cap 突破 (90 分): NG-3 = $30/day cap を超えた際の 5 SLA 検証 */
export const banDrillScenario1: BanDrillScenario = {
  id: 'ban-drill-1',
  name: 'NG-3 cap 突破 90min — 5 SLA 検証',
  durationMs: 90 * 60 * 1000,
  steps: [
    {
      name: 'detect: 401/403 連続 5 回 in 60s で kill-switch 自動発火',
      slaMs: 60 * 1000,
      run: async (ctx) =>
        ctx.dryRun
          ? { ok: true, metrics: { detectMs: 42 } }
          : { ok: false, message: 'live mode not implemented' },
    },
    {
      name: 'notify: Slack #emergency + Owner email 着信',
      slaMs: 5 * 60 * 1000,
      run: async (ctx) =>
        ctx.dryRun ? { ok: true, metrics: { notifyMs: 230 } } : { ok: false },
    },
    {
      name: 'evac: Sumi/Asagi 作業 push + session export',
      slaMs: 30 * 60 * 1000,
      run: async (ctx) =>
        ctx.dryRun ? { ok: true, metrics: { evacMs: 1200 } } : { ok: false },
    },
    {
      name: 'rotate: dummy secret rotate confirmation',
      slaMs: 60 * 60 * 1000,
      run: async (ctx) =>
        ctx.dryRun ? { ok: true, metrics: { rotateMs: 800 } } : { ok: false },
    },
    {
      name: 'fallback: P-E env 切替 起動確認',
      slaMs: 4 * 60 * 60 * 1000,
      run: async (ctx) =>
        ctx.dryRun ? { ok: true, metrics: { fallbackMs: 1500 } } : { ok: false },
    },
  ],
}

/** #2 subscription 急速消費 (60 分): Codex Pro 残量 burn rate 検証 */
export const banDrillScenario2: BanDrillScenario = {
  id: 'ban-drill-2',
  name: 'subscription 急速消費 60min — burn rate 検証',
  durationMs: 60 * 60 * 1000,
  steps: [
    {
      name: 'baseline: subscription 残量取得 + burn rate 算出',
      slaMs: 60 * 1000,
      run: async (ctx) =>
        ctx.dryRun ? { ok: true, metrics: { burnRateUsdPerHour: 0.85 } } : { ok: false },
    },
    {
      name: 'load: 60 分 simulated load で残量推移計測',
      slaMs: 60 * 60 * 1000 - 5 * 60 * 1000,
      run: async (ctx) =>
        ctx.dryRun ? { ok: true, metrics: { drainPercent: 12 } } : { ok: false },
    },
    {
      name: 'guard: $24 watchdog warn が発火し Slack 通知が届く',
      slaMs: 5 * 60 * 1000,
      run: async (ctx) =>
        ctx.dryRun ? { ok: true, metrics: { warnMs: 180 } } : { ok: false },
    },
  ],
}

/** #3 mock 70% 化 (45 分): mock-claude 動作率 70% 化での副作用ゼロ確認 */
export const banDrillScenario3: BanDrillScenario = {
  id: 'ban-drill-3',
  name: 'mock 70% 化 45min — 副作用ゼロ確認',
  durationMs: 45 * 60 * 1000,
  steps: [
    {
      name: 'switch: 70% trace を mock-claude へ rewrite',
      slaMs: 5 * 60 * 1000,
      run: async (ctx) =>
        ctx.dryRun
          ? { ok: true, metrics: { mockedFraction: 0.7 } }
          : { ok: false, message: 'mock-claude wiring required' },
    },
    {
      name: 'verify: PRJ-001-018 git diff 0 行 (副作用ゼロ)',
      slaMs: 5 * 60 * 1000,
      run: async (ctx) =>
        ctx.dryRun ? { ok: true, metrics: { diffLines: 0 } } : { ok: false },
    },
    {
      name: 'replay: audit log を再生し chain integrity を検証',
      slaMs: 5 * 60 * 1000,
      run: async (ctx) =>
        ctx.dryRun ? { ok: true, metrics: { chainOk: 1 } } : { ok: false },
    },
  ],
}

/** 全 3 シナリオの index (test / runner 用) */
export const banDrillScenarios: readonly BanDrillScenario[] = Object.freeze([
  banDrillScenario1,
  banDrillScenario2,
  banDrillScenario3,
])
