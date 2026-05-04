/**
 * slack-quick-action — Round 11 Dev-B (DEC-019-057 連動 / R10 Review-δ 残実装 6 件 #5).
 *
 * 関連:
 *   - DEC-019-007 / 008 / 015 / 022 / 050 / 051 / 053 v15.5 / 054 / 055 / 056 / 057
 *   - G-02 緊急停止スイッチ (Slack `/clawbridge stop` 30s SIGKILL chain)
 *   - G-04 公開前人間承認ゲート + cost cap quick action
 *   - DEC-019-007 BAN drill quick-launch button
 *
 * 責務 (純関数 + zod schema):
 *   - kill-switch / cost cap / drill 起動の 3 button payload 生成
 *   - 実 Slack API 通信は別 layer (notify package or webhook layer) の責務
 *   - 本ファイルは payload schema + builder + parser のみ
 *
 * 設計方針:
 *   - 既存 `notify` package と疎結合 (本ファイルは zod 以外の依存なし)
 *   - 全 payload は JSON serialize 可能 (Slack Block Kit `blocks` 配列に組込前提)
 *   - action_id は固定 enum で型安全、value はサーバ側 verify する payload
 *   - Slack の Interactive Component 仕様 v2 準拠 (interactivity_pointer 経由 OAuth verify は
 *     別 layer 責務、本ファイルは生成側のみ)
 *
 * 再利用:
 *   - notify/src/slack.ts から本ファイルを import し、Slack post webhook ペイロードに組込む
 *   - audit hook で button click を verify する際は parseSlackQuickAction を import
 */

import { z } from 'zod'

// ============================================================================
// schema (zod)
// ============================================================================

/**
 * 3 button quick-action 種別。
 *   - kill_switch : G-02 緊急停止 (SIGTERM→SIGKILL 30s chain).
 *   - cost_cap    : 月次 cap を **その場で** 30 USD → 100 USD or 100→500 等切替.
 *                   confirmation flow 必須 (DEC-019-050 Hard cap 守備.
 *   - drill_start : BAN drill #1〜#3 を即時起動.
 */
export const SlackQuickActionKindSchema = z.enum([
  'kill_switch',
  'cost_cap',
  'drill_start',
])
export type SlackQuickActionKind = z.infer<typeof SlackQuickActionKindSchema>

/** 各 action 共通 metadata. */
export const SlackQuickActionMetadataSchema = z.object({
  /** 案件 ID. e.g. PRJ-019 */
  projectId: z.string().min(1),
  /** Slack channel id (post された channel). */
  channelId: z.string().min(1),
  /** Slack user id (button 実行者). */
  actorUserId: z.string().min(1),
  /** Server 側 nonce (replay 攻撃防止 / audit trace). */
  nonce: z.string().min(8),
  /** 発行時刻 ISO8601. */
  issuedAt: z.string().datetime(),
  /** 有効期限 ISO8601 (default 5min 後). 過ぎた payload は parseSlackQuickAction で reject. */
  expiresAt: z.string().datetime(),
})
export type SlackQuickActionMetadata = z.infer<
  typeof SlackQuickActionMetadataSchema
>

// ----- kind 別 payload -----

export const KillSwitchPayloadSchema = z.object({
  kind: z.literal('kill_switch'),
  metadata: SlackQuickActionMetadataSchema,
  /** 緊急停止 reason (audit に記録). */
  reason: z.string().min(1).max(500),
  /** SIGTERM→SIGKILL 待機 秒 (default 30s, G-02 規定). */
  graceSeconds: z.number().int().min(1).max(120).default(30),
})
export type KillSwitchPayload = z.infer<typeof KillSwitchPayloadSchema>

export const CostCapPayloadSchema = z.object({
  kind: z.literal('cost_cap'),
  metadata: SlackQuickActionMetadataSchema,
  /** 切替先 cap USD (DEC-019-050 hard cap = 30、案 B 100、案 C 300). */
  newCapUsd: z.number().positive().max(1300),
  /** 切替理由 (audit). */
  reason: z.string().min(1).max(500),
  /** confirmation 必須 (Owner/CEO 二重承認). */
  requiresConfirmation: z.boolean().default(true),
})
export type CostCapPayload = z.infer<typeof CostCapPayloadSchema>

export const DrillStartPayloadSchema = z.object({
  kind: z.literal('drill_start'),
  metadata: SlackQuickActionMetadataSchema,
  /** BAN drill scenario id. drill #1=NG-3 突発、#2=Sumi/Asagi 巻添、#3=連鎖障害 */
  scenarioId: z.enum(['drill-1', 'drill-2', 'drill-3']),
  /** dry_run (default true, false で実 spawn). */
  dryRun: z.boolean().default(true),
})
export type DrillStartPayload = z.infer<typeof DrillStartPayloadSchema>

/** 3 種類の判別 union. */
export const SlackQuickActionPayloadSchema = z.discriminatedUnion('kind', [
  KillSwitchPayloadSchema,
  CostCapPayloadSchema,
  DrillStartPayloadSchema,
])
export type SlackQuickActionPayload = z.infer<
  typeof SlackQuickActionPayloadSchema
>

// ============================================================================
// Slack Block Kit 1 button block 表現 (subset、JSON serialize 専用)
// ============================================================================

export interface SlackButtonBlock {
  type: 'button'
  text: { type: 'plain_text'; text: string; emoji: boolean }
  /** UI styling (Slack Button Element). */
  style?: 'primary' | 'danger'
  /** 一意 action_id (server で routing). */
  action_id: string
  /** 25KB まで JSON 文字列 (server が parse). */
  value: string
  /** confirm dialog (cost-cap 切替で必須). */
  confirm?: {
    title: { type: 'plain_text'; text: string }
    text: { type: 'plain_text'; text: string }
    confirm: { type: 'plain_text'; text: string }
    deny: { type: 'plain_text'; text: string }
  }
}

/**
 * action_id mapping. server 側 routing key として 1:1 で固定。
 */
export const ACTION_ID_KILL_SWITCH = 'clawbridge:quick_action:kill_switch' as const
export const ACTION_ID_COST_CAP = 'clawbridge:quick_action:cost_cap' as const
export const ACTION_ID_DRILL_START =
  'clawbridge:quick_action:drill_start' as const

const ACTION_ID_BY_KIND: Readonly<Record<SlackQuickActionKind, string>> =
  Object.freeze({
    kill_switch: ACTION_ID_KILL_SWITCH,
    cost_cap: ACTION_ID_COST_CAP,
    drill_start: ACTION_ID_DRILL_START,
  })

// ============================================================================
// builder — payload → SlackButtonBlock JSON
// ============================================================================

/**
 * SlackButtonBlock を生成する純関数。
 * 戻り値は JSON.stringify 可能で、Slack Block Kit `blocks` 配列にそのまま入る。
 *
 * @throws z parse error if payload schema invalid.
 */
export function buildSlackQuickActionButton(
  rawPayload: unknown,
): SlackButtonBlock {
  const payload = SlackQuickActionPayloadSchema.parse(rawPayload)
  switch (payload.kind) {
    case 'kill_switch':
      return {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Stop Now (Kill Switch)',
          emoji: false,
        },
        style: 'danger',
        action_id: ACTION_ID_KILL_SWITCH,
        value: JSON.stringify(payload),
        confirm: {
          title: { type: 'plain_text', text: 'Confirm Emergency Stop' },
          text: {
            type: 'plain_text',
            text: `This will SIGTERM→SIGKILL the harness in ${payload.graceSeconds}s. Reason: ${payload.reason}`,
          },
          confirm: { type: 'plain_text', text: 'Stop now' },
          deny: { type: 'plain_text', text: 'Cancel' },
        },
      }
    case 'cost_cap':
      return {
        type: 'button',
        text: {
          type: 'plain_text',
          text: `Switch Cost Cap to $${payload.newCapUsd}`,
          emoji: false,
        },
        style: 'primary',
        action_id: ACTION_ID_COST_CAP,
        value: JSON.stringify(payload),
        ...(payload.requiresConfirmation
          ? {
              confirm: {
                title: { type: 'plain_text', text: 'Confirm Cap Change' },
                text: {
                  type: 'plain_text',
                  text: `New monthly hard cap = $${payload.newCapUsd}. Reason: ${payload.reason}`,
                },
                confirm: { type: 'plain_text', text: 'Apply' },
                deny: { type: 'plain_text', text: 'Cancel' },
              },
            }
          : {}),
      }
    case 'drill_start':
      return {
        type: 'button',
        text: {
          type: 'plain_text',
          text: `Start ${payload.scenarioId}${payload.dryRun ? ' (dry-run)' : ''}`,
          emoji: false,
        },
        style: 'primary',
        action_id: ACTION_ID_DRILL_START,
        value: JSON.stringify(payload),
      }
  }
}

// ============================================================================
// parser — Slack action callback `value` → typed payload
// ============================================================================

/**
 * Slack interactive payload (action.value JSON 文字列) を parse + 検証。
 *
 * 検証項目:
 *   - JSON parse OK
 *   - schema valid
 *   - action_id と kind が一致
 *   - expiresAt > now (期限切れ拒否)
 *
 * @returns 検証済 payload (失敗時 throw)
 */
export function parseSlackQuickAction(
  rawValue: string,
  actionId: string,
  nowMs: number = Date.now(),
): SlackQuickActionPayload {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawValue)
  } catch (e) {
    throw new Error(`slack quick action: invalid JSON: ${(e as Error).message}`)
  }
  const payload = SlackQuickActionPayloadSchema.parse(parsed)
  const expectedActionId = ACTION_ID_BY_KIND[payload.kind]
  if (actionId !== expectedActionId) {
    throw new Error(
      `slack quick action: action_id mismatch (expected ${expectedActionId}, got ${actionId})`,
    )
  }
  const expiresAt = Date.parse(payload.metadata.expiresAt)
  if (!Number.isFinite(expiresAt)) {
    throw new Error('slack quick action: invalid expiresAt timestamp')
  }
  if (expiresAt <= nowMs) {
    throw new Error('slack quick action: payload expired')
  }
  return payload
}

// ============================================================================
// helper — metadata 構築 (default expiresAt = 5min, default nonce 16-byte hex)
// ============================================================================

export interface BuildMetadataOptions {
  projectId: string
  channelId: string
  actorUserId: string
  /** ms 単位 issuedAt (default Date.now()). */
  nowMs?: number
  /** ms 単位 TTL (default 5min). */
  ttlMs?: number
  /** 明示 nonce (test 用、未指定で 16-byte hex 自動生成). */
  nonce?: string
}

export function buildSlackQuickActionMetadata(
  opts: BuildMetadataOptions,
): SlackQuickActionMetadata {
  const now = opts.nowMs ?? Date.now()
  const ttl = opts.ttlMs ?? 5 * 60 * 1000
  const nonce = opts.nonce ?? generateNonceHex(16)
  return {
    projectId: opts.projectId,
    channelId: opts.channelId,
    actorUserId: opts.actorUserId,
    nonce,
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttl).toISOString(),
  }
}

/**
 * 16 進 nonce 生成 (Math.random フォールバック付き、本番は crypto.randomBytes 推奨だが
 * 軽量化のため Node.js 依存ゼロで実装).
 */
function generateNonceHex(byteLen: number): string {
  let s = ''
  for (let i = 0; i < byteLen * 2; i++) {
    s += Math.floor(Math.random() * 16).toString(16)
  }
  // 衝突に弱い実装は呼び出し側で crypto.randomBytes を渡すこと
  return s
}
