/**
 * slack-webhook-sender — Round 12 Dev-B (DEC-019-057 連動 / Round 11 引継 #3 配線完遂).
 *
 * 関連:
 *   - DEC-019-007 / 008 / 015 / 049 / 050 / 051 / 053 v15.5 / 054 / 055 / 056 / 057
 *   - G-02 緊急停止スイッチ (Slack `/clawbridge stop`) の実通信 layer
 *   - Round 11 Dev-B `slack-quick-action.ts` (harness 内 builder) を直接 POST 可能にする
 *
 * 責務:
 *   - Slack incoming webhook URL に対する POST を pure(ish) function で提供
 *     (fetch を DI 化し test では mock fetch を注入可能).
 *   - retry policy: 1 回のみ (指数 backoff なし、500ms 固定 wait).
 *   - timeout: 5 秒 (AbortController 利用).
 *   - error 分類: network_failure / non_2xx / timeout / invalid_payload.
 *   - nonce ベースの client-side de-duplication (同一 nonce 30 秒以内再送 skip).
 *
 * 設計方針:
 *   - 依存ゼロ (zod のみ). harness / audit を import しない (逆方向 dependency).
 *   - SlackQuickActionPayload の構造を最小限に self-validate (harness 型を import せず、
 *     metadata.nonce を抽出して dedup 用 key に使う). buildSlackQuickActionButton の
 *     出力 (= SlackButtonBlock JSON) は本 sender に渡されないことに注意:
 *     渡されるのは webhook POST body 全体 (Slack Block Kit blocks 配列を含むメッセージ).
 *
 * 使い方:
 * ```ts
 * import { sendSlackQuickAction, type SlackQuickActionPayload } from '@clawbridge/notify/slack'
 * import { buildSlackQuickActionButton } from '@clawbridge/harness/...'
 * const button = buildSlackQuickActionButton(payload)
 * const body = { text: 'Owner action required', blocks: [{ type: 'actions', elements: [button] }] }
 * const result = await sendSlackQuickAction(body, payload, webhookUrl)
 * ```
 */

import { z } from 'zod'

// ============================================================================
// 型定義
// ============================================================================

/** SlackQuickActionPayload 構造の最小 self-validation. harness 側 schema と互換. */
export const SlackQuickActionMinimalSchema = z.object({
  kind: z.enum(['kill_switch', 'cost_cap', 'drill_start']),
  metadata: z.object({
    projectId: z.string().min(1),
    channelId: z.string().min(1),
    actorUserId: z.string().min(1),
    nonce: z.string().min(8),
    issuedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
  }),
})
export type SlackQuickActionPayload = z.infer<
  typeof SlackQuickActionMinimalSchema
>

/** webhook POST body の自由形式 (Slack Block Kit message). */
export type SlackWebhookBody = Record<string, unknown>

/** error 分類. */
export type SlackSendErrorType =
  | 'network_failure'
  | 'non_2xx'
  | 'timeout'
  | 'invalid_payload'

/** 送信結果 discriminated union. */
export type SlackSendResult =
  | { ok: true; statusCode: number; latencyMs: number; nonce: string }
  | {
      ok: false
      errorType: SlackSendErrorType
      message: string
      statusCode?: number
      attempts: number
    }
  | { ok: false; errorType: 'duplicate_nonce'; message: string; nonce: string }

/** fetch 関数 type (DI). */
export type FetchFn = typeof fetch

/** 送信オプション (test で時刻と sleep を DI 化可能). */
export interface SendSlackQuickActionOptions {
  /** 1 リトライまでの待機 ms (default 500). */
  retryDelayMs?: number
  /** 全体 timeout ms (default 5000). */
  timeoutMs?: number
  /** 最大 attempts (default 2 = 初回 + retry 1). */
  maxAttempts?: number
  /** test 用 sleep injection. */
  sleep?: (ms: number) => Promise<void>
  /** test 用 ms 取得 injection. */
  now?: () => number
  /** dedup TTL ms (default 30_000). */
  dedupTtlMs?: number
}

// ============================================================================
// nonce dedup store (module-singleton)
// ============================================================================

/**
 * nonce ベース de-duplication. 同一 nonce が dedupTtlMs 以内に再送されたら skip.
 * test では resetSlackDedupStore() で手動 reset 可能.
 */
const dedupStore = new Map<string, number>()

/** test 用: dedup state を全 clear. */
export function resetSlackDedupStore(): void {
  dedupStore.clear()
}

/** module 外から dedup 状態を覗く (instrumentation). */
export function peekSlackDedupStore(): ReadonlyMap<string, number> {
  return dedupStore
}

function pruneExpiredNonces(now: number, ttlMs: number): void {
  for (const [k, ts] of dedupStore) {
    if (now - ts > ttlMs) dedupStore.delete(k)
  }
}

// ============================================================================
// helpers
// ============================================================================

const DEFAULT_RETRY_DELAY_MS = 500
const DEFAULT_TIMEOUT_MS = 5_000
const DEFAULT_MAX_ATTEMPTS = 2
const DEFAULT_DEDUP_TTL_MS = 30_000

function sleepDefault(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 1 回 POST を試みる. timeout / network / non-2xx を分類.
 * 例外は throw せず errorType を返す.
 */
async function attemptPostOnce(
  url: string,
  body: SlackWebhookBody,
  fetchFn: FetchFn,
  timeoutMs: number,
  now: () => number,
): Promise<
  | { ok: true; statusCode: number; latencyMs: number }
  | { ok: false; errorType: SlackSendErrorType; message: string; statusCode?: number }
> {
  const startedAt = now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetchFn(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const latencyMs = now() - startedAt
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, statusCode: res.status, latencyMs }
    }
    return {
      ok: false,
      errorType: 'non_2xx',
      message: `Slack webhook returned status ${res.status}`,
      statusCode: res.status,
    }
  } catch (err) {
    const e = err as Error & { name?: string }
    if (e?.name === 'AbortError') {
      return { ok: false, errorType: 'timeout', message: `timeout after ${timeoutMs}ms` }
    }
    return {
      ok: false,
      errorType: 'network_failure',
      message: e?.message ?? String(err),
    }
  } finally {
    clearTimeout(timer)
  }
}

// ============================================================================
// main API
// ============================================================================

/**
 * Slack incoming webhook に POST する pure(ish) function.
 *
 * @param body         Slack message body (text + blocks 等).
 * @param payload      対応する SlackQuickActionPayload (nonce 抽出 / dedup 用).
 * @param webhookUrl   送信先 URL (https://hooks.slack.com/services/...).
 * @param fetchFn      DI fetch (test では mock 注入).
 * @param opts         retry / timeout / dedup の上書き.
 * @returns            SlackSendResult (discriminated union).
 */
export async function sendSlackQuickAction(
  body: SlackWebhookBody,
  payload: unknown,
  webhookUrl: string,
  fetchFn?: FetchFn,
  opts: SendSlackQuickActionOptions = {},
): Promise<SlackSendResult> {
  // 引数が明示的に undefined の場合のみ global fetch を使う。null/false 等を
  // 明示的に渡された場合は invalid_payload で reject (test 互換)。
  const effectiveFetch: FetchFn | undefined =
    arguments.length >= 4
      ? (fetchFn as FetchFn | undefined)
      : (typeof fetch !== 'undefined' ? fetch : undefined)
  // ---- 入力 validation ----
  if (typeof webhookUrl !== 'string' || webhookUrl.length === 0) {
    return {
      ok: false,
      errorType: 'invalid_payload',
      message: 'webhookUrl is empty or invalid',
      attempts: 0,
    }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      ok: false,
      errorType: 'invalid_payload',
      message: 'body must be a non-array object',
      attempts: 0,
    }
  }
  let parsed: SlackQuickActionPayload
  try {
    parsed = SlackQuickActionMinimalSchema.parse(payload)
  } catch (err) {
    return {
      ok: false,
      errorType: 'invalid_payload',
      message: `payload schema invalid: ${(err as Error).message}`,
      attempts: 0,
    }
  }
  if (typeof effectiveFetch !== 'function') {
    return {
      ok: false,
      errorType: 'invalid_payload',
      message: 'fetch is not available (provide fetchFn)',
      attempts: 0,
    }
  }

  const retryDelayMs = opts.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxAttempts = opts.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  const sleep = opts.sleep ?? sleepDefault
  const now = opts.now ?? (() => Date.now())
  const dedupTtlMs = opts.dedupTtlMs ?? DEFAULT_DEDUP_TTL_MS

  const nonce = parsed.metadata.nonce

  // ---- nonce dedup ----
  pruneExpiredNonces(now(), dedupTtlMs)
  const existed = dedupStore.get(nonce)
  if (existed !== undefined && now() - existed <= dedupTtlMs) {
    return {
      ok: false,
      errorType: 'duplicate_nonce',
      message: `nonce ${nonce} already sent ${now() - existed}ms ago (dedup window ${dedupTtlMs}ms)`,
      nonce,
    }
  }

  // ---- attempt loop ----
  let attempts = 0
  let lastErr: { errorType: SlackSendErrorType; message: string; statusCode?: number } | null = null
  while (attempts < maxAttempts) {
    attempts += 1
    const r = await attemptPostOnce(webhookUrl, body, effectiveFetch, timeoutMs, now)
    if (r.ok) {
      // dedup store 更新 (success only).
      dedupStore.set(nonce, now())
      return { ok: true, statusCode: r.statusCode, latencyMs: r.latencyMs, nonce }
    }
    lastErr = { errorType: r.errorType, message: r.message }
    if (typeof r.statusCode === 'number') {
      lastErr.statusCode = r.statusCode
    }
    // 4xx (non_2xx の中で 400-499) は retry しても無駄なので即終了
    if (r.errorType === 'non_2xx' && typeof r.statusCode === 'number' && r.statusCode >= 400 && r.statusCode < 500) {
      break
    }
    if (attempts < maxAttempts) {
      await sleep(retryDelayMs)
    }
  }
  if (lastErr === null) {
    // 理論上ここには来ない (maxAttempts >= 1 のため)
    return {
      ok: false,
      errorType: 'invalid_payload',
      message: 'no attempts made',
      attempts,
    }
  }
  const out: SlackSendResult = {
    ok: false,
    errorType: lastErr.errorType,
    message: lastErr.message,
    attempts,
  }
  if (typeof lastErr.statusCode === 'number') {
    ;(out as { statusCode?: number }).statusCode = lastErr.statusCode
  }
  return out
}

// ============================================================================
// helper — webhook body builder (Slack Block Kit を組立てる軽量 wrapper)
// ============================================================================

/**
 * SlackButtonBlock (harness/slack-quick-action 由来) を 1 つ含む actions block を
 * top-level に配置した webhook body を構築する純関数。
 *
 * harness の型を import せず unknown で受ける (循環依存禁止)。
 */
export function buildSlackWebhookBodyWithButton(
  topLevelText: string,
  buttonBlock: unknown,
): SlackWebhookBody {
  if (!buttonBlock || typeof buttonBlock !== 'object') {
    throw new Error('buildSlackWebhookBodyWithButton: buttonBlock must be an object')
  }
  return {
    text: topLevelText,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: topLevelText } },
      { type: 'actions', elements: [buttonBlock] },
    ],
  }
}
