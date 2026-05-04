/**
 * notify-bridge — Round 13 Dev-B / Task C (DEC-019-057 連動).
 * Round 14 Dev-B Task C 拡張: retry policy DI 化 (RetryPolicy 型 + caller 注入対応).
 *
 * 目的:
 *   - harness 側の event emitter (TosMonitor 等) が emit した event を
 *     @clawbridge/notify package の sendSlackQuickAction に橋渡しする bridge.
 *   - 依存方向を「harness → notify (一方向)」として正式化:
 *       * notify は harness を import 禁止 (循環依存ゼロ).
 *       * harness 側でも本 bridge は notify を直接 import せず、注入された transport
 *         関数 (= sendSlackQuickAction の呼出) を呼ぶことで疎結合を維持.
 *       * caller (e.g. orchestrator / wrapper) が import {sendSlackQuickAction} from
 *         '@clawbridge/notify/slack' して transport として渡す.
 *   - DI 化:
 *       * webhookUrl  : Slack incoming webhook URL (本番設定).
 *       * fetchFn     : test 用 mock fetch (default global fetch).
 *       * timeoutMs   : webhook POST timeout (default 5_000ms).
 *       * transport   : sendSlackQuickAction を注入 (test では mock).
 *       * retryPolicy : retry 戦略 (Round 14 新規, default は既存の 1 回 fixed 500ms と等価).
 *
 * 依存方向 ESLint 検証:
 *   - 本ファイル + 全 harness ファイルで `from '@clawbridge/notify'` import を禁止.
 *   - `eslint.config.mjs` の no-restricted-imports rule で 検証可能化 (本 Round で追加).
 *
 * 設計方針:
 *   - 純粋な bridge: emitter 受信 → transport 呼出 → 結果 callback (best-effort).
 *   - listener として TosMonitor.on(listener) に登録できる shape.
 *   - emit した event を Slack quick-action payload に変換する mapping は本 bridge が担当
 *     (eg. monitor:cost-cap-breach → kind='cost_cap', monitor:ng3-time-breach → kind='kill_switch').
 *   - failure 時は best-effort (例外を伝播させず onError コールバックに流す).
 *   - retry policy は caller の運用要件 (kill_switch は早く再送 / cost_cap は緩く再送 等) に
 *     応じて DI で切替可能。default は既存挙動維持 (= maxRetries=0 で 1 回のみ送信).
 */

import type { TosMonitorEvent, TosMonitorListener } from './tos-monitor.js'

// ============================================================================
// 型 — notify package の SlackSendResult / SlackQuickActionPayload を **再定義** する.
// (循環依存禁止のため import は実行時 caller が行う)
// ============================================================================

/** notify package の SlackQuickActionPayload と互換 (subset). */
export interface NotifyBridgePayload {
  kind: 'kill_switch' | 'cost_cap' | 'drill_start'
  metadata: {
    projectId: string
    channelId: string
    actorUserId: string
    nonce: string
    issuedAt: string
    expiresAt: string
  }
}

/** notify package の SlackWebhookBody と互換. */
export type NotifyBridgeBody = Record<string, unknown>

/** notify package の SlackSendResult と互換 (subset). */
export type NotifyBridgeSendResult =
  | { ok: true; statusCode: number; latencyMs: number; nonce: string }
  | {
      ok: false
      errorType:
        | 'network_failure'
        | 'non_2xx'
        | 'timeout'
        | 'invalid_payload'
        | 'duplicate_nonce'
      message: string
      statusCode?: number
      attempts?: number
      nonce?: string
    }

/**
 * sendSlackQuickAction 互換 transport function. caller が
 * `import { sendSlackQuickAction } from '@clawbridge/notify/slack'` を渡す.
 */
export type NotifyBridgeTransport = (
  body: NotifyBridgeBody,
  payload: NotifyBridgePayload,
  webhookUrl: string,
  fetchFn?: typeof fetch,
  opts?: { timeoutMs?: number; maxAttempts?: number; retryDelayMs?: number },
) => Promise<NotifyBridgeSendResult>

// ============================================================================
// retry policy (Round 14 Dev-B Task C 新規)
// ============================================================================

/**
 * Slack 送信 retry 戦略。caller が運用要件に応じて注入できる。
 *
 *   - maxRetries     : 失敗時の **追加** retry 回数 (0 で 1 回のみ送信)
 *   - backoffMs      : retry 間隔 ms (= linear の base / exponential の base)
 *   - backoffStrategy:
 *       'linear'      → wait = backoffMs * (attempt + 1)
 *       'exponential' → wait = backoffMs * 2^attempt
 *
 * 既存挙動との互換性:
 *   - default (= notify-bridge が caller から retryPolicy を受け取らない) は
 *     `{ maxRetries: 0, backoffMs: 0, backoffStrategy: 'linear' }` 相当 (= 1 回だけ送信)
 *     → 既存の transport (sendSlackQuickAction) の `maxAttempts` 既定値に委譲する形を維持.
 *   - retryPolicy 注入時は本 bridge が retry を制御し、transport は単発呼出とする
 *     (transport の opts.maxAttempts=1 を強制).
 */
export interface RetryPolicy {
  maxRetries: number
  backoffMs: number
  backoffStrategy: 'linear' | 'exponential'
}

/** retry policy 既定値 (= 既存挙動: bridge は retry せず transport に委譲). */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 0,
  backoffMs: 0,
  backoffStrategy: 'linear',
}

/** linear / exponential backoff を計算する純関数. */
export function computeBackoffMs(policy: RetryPolicy, attempt: number): number {
  if (policy.backoffMs <= 0) return 0
  if (attempt < 0) return 0
  switch (policy.backoffStrategy) {
    case 'linear':
      return policy.backoffMs * (attempt + 1)
    case 'exponential':
      return policy.backoffMs * Math.pow(2, attempt)
  }
}

/** retry 中の sleep 関数 (DI 可能, default は setTimeout). */
export type SleepFn = (ms: number) => Promise<void>
const defaultSleep: SleepFn = (ms: number) =>
  new Promise<void>((resolve) => {
    if (ms <= 0) resolve()
    else setTimeout(resolve, ms)
  })

// ============================================================================
// bridge 設定
// ============================================================================

export interface NotifyBridgeOptions {
  /** Slack incoming webhook URL (https://hooks.slack.com/services/...). */
  webhookUrl: string
  /** notify.sendSlackQuickAction (DI). caller が import & 注入. */
  transport: NotifyBridgeTransport
  /** 案件 ID (PRJ-XXX). payload.metadata.projectId に埋め込む. */
  projectId: string
  /** Slack channel id (post 先). */
  channelId: string
  /** Slack user id (system actor、kill-switch 自動 fire 時の actor). */
  systemActorUserId: string
  /** test 用 fetch DI (default global fetch). */
  fetchFn?: typeof fetch
  /** webhook POST timeout (default 5_000ms). */
  timeoutMs?: number
  /** 通知失敗時の callback (audit / log 用). */
  onError?: (
    err: NotifyBridgeSendResult & { ok: false },
    event: TosMonitorEvent,
  ) => void | Promise<void>
  /** 通知成功時の callback (instrumentation 用). */
  onSuccess?: (
    res: NotifyBridgeSendResult & { ok: true },
    event: TosMonitorEvent,
  ) => void | Promise<void>
  /** test 用 nonce 生成 (default crypto.randomUUID + 8 hex 切詰). */
  generateNonce?: () => string
  /** test 用 ISO datetime 取得 (default () => new Date().toISOString()). */
  nowIso?: () => string
  /** payload 有効期限 (default 5min). */
  expiresInMs?: number
  /** event → kind 変換のカスタム上書き (default mapping を override). */
  kindResolver?: (event: TosMonitorEvent) => NotifyBridgePayload['kind'] | null
  /**
   * retry policy (Round 14 Dev-B Task C 新規). default = DEFAULT_RETRY_POLICY (bridge は retry せず).
   * 注入時は transport の maxAttempts を 1 に強制し、bridge 側で再送制御する。
   */
  retryPolicy?: RetryPolicy
  /**
   * retry 間 sleep の DI (test 用 mock). default = setTimeout ベース.
   * retryPolicy 注入時のみ呼ばれる。
   */
  sleepFn?: SleepFn
}

// ============================================================================
// helpers
// ============================================================================

const DEFAULT_TIMEOUT_MS = 5_000
const DEFAULT_EXPIRES_MS = 5 * 60 * 1000

/**
 * default kind resolver — TosMonitorEvent.type を SlackQuickAction.kind に変換.
 *   - monitor:cost-cap-breach → cost_cap
 *   - monitor:ng3-time-breach → kill_switch
 *   - monitor:rate-spike      → kill_switch
 *   - monitor:warning-email   → kill_switch (severity 4+ = final/tos_warning)
 *   - monitor:fallback-decision → null (Slack 通知不要、audit hook で十分)
 */
function defaultKindResolver(event: TosMonitorEvent): NotifyBridgePayload['kind'] | null {
  switch (event.type) {
    case 'monitor:cost-cap-breach':
      return 'cost_cap'
    case 'monitor:ng3-time-breach':
    case 'monitor:rate-spike':
      return 'kill_switch'
    case 'monitor:warning-email':
      return 'kill_switch'
    case 'monitor:fallback-decision':
      return null // 通常は Slack 通知不要
    default:
      return null
  }
}

function defaultGenerateNonce(): string {
  // 16 hex chars (8 bytes 相当) — schema は min 8 chars 要求.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  }
  let s = ''
  for (let i = 0; i < 16; i++) s += Math.floor(Math.random() * 16).toString(16)
  return s
}

function defaultNowIso(): string {
  return new Date().toISOString()
}

function buildBody(event: TosMonitorEvent): NotifyBridgeBody {
  return {
    text: `tos-monitor: ${event.type} (${event.tier ?? 'info'})`,
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*${event.type}*\n${event.reason}` },
      },
    ],
  }
}

// ============================================================================
// 主 API — createNotifyBridge
// ============================================================================

/**
 * harness の TosMonitorListener として登録できる listener を返す.
 *
 * 使い方:
 * ```ts
 * import { sendSlackQuickAction } from '@clawbridge/notify/slack'
 * import { createNotifyBridge } from '@clawbridge/harness/notify-bridge'
 *
 * const listener = createNotifyBridge({
 *   webhookUrl: process.env.SLACK_WEBHOOK_URL!,
 *   transport: sendSlackQuickAction,
 *   projectId: 'PRJ-019',
 *   channelId: 'C0123456',
 *   systemActorUserId: 'U-system',
 * })
 * monitor.on(listener)
 * ```
 */
export function createNotifyBridge(opts: NotifyBridgeOptions): TosMonitorListener {
  if (typeof opts.webhookUrl !== 'string' || opts.webhookUrl.length === 0) {
    throw new Error('createNotifyBridge: webhookUrl required')
  }
  if (typeof opts.transport !== 'function') {
    throw new Error('createNotifyBridge: transport required (inject sendSlackQuickAction)')
  }
  if (typeof opts.projectId !== 'string' || opts.projectId.length === 0) {
    throw new Error('createNotifyBridge: projectId required')
  }
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const expiresInMs = opts.expiresInMs ?? DEFAULT_EXPIRES_MS
  const generateNonce = opts.generateNonce ?? defaultGenerateNonce
  const nowIso = opts.nowIso ?? defaultNowIso
  const kindResolver = opts.kindResolver ?? defaultKindResolver
  const retryPolicy = opts.retryPolicy
  const sleepFn = opts.sleepFn ?? defaultSleep
  // retry 注入時のみ bridge 側で再送制御 (= transport は単発呼出に強制).
  const retryEnabled =
    retryPolicy !== undefined && retryPolicy.maxRetries > 0

  return async (event: TosMonitorEvent): Promise<void> => {
    const kind = kindResolver(event)
    if (kind === null) {
      // skip — listener は他の hook (audit) に処理を任せる
      return
    }
    const issuedAt = nowIso()
    const expiresAt = new Date(Date.parse(issuedAt) + expiresInMs).toISOString()
    const payload: NotifyBridgePayload = {
      kind,
      metadata: {
        projectId: opts.projectId,
        channelId: opts.channelId,
        actorUserId: opts.systemActorUserId,
        nonce: generateNonce(),
        issuedAt,
        expiresAt,
      },
    }
    const body = buildBody(event)

    // bridge 側 retry loop. retryEnabled=false なら 1 回だけ呼出し (既存挙動).
    const maxAttempts = retryEnabled ? retryPolicy!.maxRetries + 1 : 1
    let lastResult: NotifyBridgeSendResult | null = null
    let lastThrown: unknown = null

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // retry 注入時は transport の retry を無効化 (maxAttempts=1)、
        // bridge が呼出 1 回ずつ制御する。retry 未注入時は transport の既定 retry に委譲。
        const transportOpts = retryEnabled
          ? { timeoutMs, maxAttempts: 1 }
          : { timeoutMs }
        lastResult = await opts.transport(
          body,
          payload,
          opts.webhookUrl,
          opts.fetchFn,
          transportOpts,
        )
        lastThrown = null
        if (lastResult.ok) {
          break // 成功で retry 終了
        }
        // 失敗だが retry 余地あり → backoff 後に次 attempt へ
        if (retryEnabled && attempt < maxAttempts - 1) {
          await sleepFn(computeBackoffMs(retryPolicy!, attempt))
          continue
        }
        break // retry 余地なし
      } catch (err) {
        lastThrown = err
        lastResult = null
        if (retryEnabled && attempt < maxAttempts - 1) {
          await sleepFn(computeBackoffMs(retryPolicy!, attempt))
          continue
        }
        break
      }
    }

    if (lastThrown !== null) {
      // 最終 attempt が throw した場合
      if (opts.onError) {
        await opts.onError(
          {
            ok: false,
            errorType: 'network_failure',
            message: (lastThrown as Error)?.message ?? String(lastThrown),
          },
          event,
        )
      }
      return
    }
    if (lastResult === null) {
      // 理論上来ない (maxAttempts >= 1)
      return
    }
    if (lastResult.ok) {
      if (opts.onSuccess) await opts.onSuccess(lastResult, event)
    } else {
      if (opts.onError) await opts.onError(lastResult, event)
    }
  }
}

// ============================================================================
// 検証 helper — 依存方向 (harness → notify) を正式化する import 制約を export.
// ESLint の no-restricted-imports rule で参照される const.
// ============================================================================

/**
 * 依存方向 ESLint rule で禁止する pattern (notify package の harness 直接 import).
 * `eslint.config.mjs` の no-restricted-imports.patterns に登録される.
 */
export const NOTIFY_TO_HARNESS_FORBIDDEN_PATTERNS = [
  '@clawbridge/harness',
  '@clawbridge/harness/*',
] as const

/**
 * harness は notify を直接 import せず本 bridge 経由で transport 注入のみ許可.
 * harness 側 ESLint (このファイル + 全 harness/src/**) では notify import を禁止する.
 */
export const HARNESS_TO_NOTIFY_DIRECT_FORBIDDEN_PATTERNS = [
  '@clawbridge/notify',
  '@clawbridge/notify/*',
] as const
