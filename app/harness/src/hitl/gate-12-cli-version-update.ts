/**
 * hitl/gate-12-cli-version-update — Round 14 Dev-D 着地 (Task A):
 *   HITL gate 第 12 種 `cli_version_update_approval` の harness 側 fire 経路。
 *
 * 関連:
 *   - openclaw-runtime/src/cli/auto-update-hitl.ts (Round 13 Dev-D 着地、payload builder)
 *   - hitl-gate.ts (FileHitlGate, HitlAction, HitlActionType — 既存無改変)
 *   - slack-quick-action.ts (gate-12 用 Slack interactive payload を gate-11 と同形式で発行)
 *   - DEC-019-007 (副作用ゼロ要件)
 *   - DEC-019-018 (HITL SOP — gate-12 は同 SOP に準拠、24h timeout default reject)
 *   - DEC-019-051 (subscription-driven 中核 / version 不一致時の dry-run fallback)
 *   - DEC-019-025 (append-only SOP — 既存 hitl-gate / slack-quick-action は無改変)
 *
 * 設計方針:
 *   - **既存 HitlActionType を拡張しない**: harness/hitl-gate.ts の HitlActionType に
 *     'cli_version_update_approval' を追加すると外部 caller の互換破壊 (Round 13 で議論未決定).
 *     代わりに本書では `tos_gray_review` 形式のラッパ (= meta payload + decision evaluator)
 *     を用意し、polling 機構は既存 FileHitlGate に委譲する。
 *   - **3 経路 (approve / reject / defer)**: gate-12 固有の意思決定セット (gate-11 で
 *     確立した形式と一貫):
 *       - approve : 開発者が指示する approveAction (continue_with_warning |
 *                   switch_to_dry_run | halt_for_manual_update) の 3 値.
 *       - reject  : 自動 fallback rejectAction (switch_to_dry_run | halt) の 2 値.
 *       - defer   : 24h 以内に再評価する (= timeout = reject 扱い).
 *   - **副作用 0 (純関数中心)**: HitlGate / SlackQuickActionBuilder は DI 経由、本 module
 *     は decision evaluator + payload converter + outcome interpretation を提供する.
 *   - **Slack quick-action 連携**: build/parse 両対応 (cost_cap / drill_start に倣い
 *     dedicated SlackQuickActionKind 不採用、metadata + body string 形式で柔軟性を担保).
 *
 * Round 15 引継ぎ予定:
 *   - HitlActionType に 'cli_version_update_approval' を追加するかは CEO 議決待ち.
 *   - 現状は本 module がアダプタ層として機能し、gate-11 (PII review) と同パターンで
 *     既存 hitl-gate を無改変のまま gate-12 を運用する.
 */
import { z } from 'zod'
import type {
  HitlAction,
  HitlApprovalResult,
  HitlGate,
  HitlRiskLevel,
} from '../hitl-gate.js'
import type {
  SlackQuickActionMetadata,
} from '../slack-quick-action.js'

// ============================================================================
// 型 (zod discriminated union)
// ============================================================================

/** 第 12 種 HITL gate 識別 ID (auto-update-hitl.ts と同期). */
export const GATE_12_TYPE = 'cli_version_update_approval' as const

/** 起動時 version-check の 5 outcome (cli-version-check.ts ミラー). */
export const Gate12CheckOutcomeSchema = z.enum([
  'ok',
  'out_of_range',
  'unparseable',
  'spawn_failed',
  'timeout',
])
export type Gate12CheckOutcome = z.infer<typeof Gate12CheckOutcomeSchema>

/** approve 時の caller の取り得るアクション. */
export const Gate12ApproveActionSchema = z.enum([
  'continue_with_warning',
  'switch_to_dry_run',
  'halt_for_manual_update',
])
export type Gate12ApproveAction = z.infer<typeof Gate12ApproveActionSchema>

/** reject 時の自動 fallback アクション. */
export const Gate12RejectActionSchema = z.enum([
  'switch_to_dry_run',
  'halt',
])
export type Gate12RejectAction = z.infer<typeof Gate12RejectActionSchema>

/** defer 時の自動アクション (再評価予約 = 24h 以内再起動 health-check 待ち). */
export const Gate12DeferActionSchema = z.enum([
  'recheck_in_next_boot',
  'continue_with_warning_temporarily',
])
export type Gate12DeferAction = z.infer<typeof Gate12DeferActionSchema>

/**
 * 第 12 種 gate の最終決定. approve / reject / defer の 3 経路.
 *
 * `tos_gray_review` (Round 13 既存) と同じ discriminated union 形式.
 */
export const Gate12DecisionSchema = z.discriminatedUnion('decision', [
  z.object({
    decision: z.literal('approve'),
    approveAction: Gate12ApproveActionSchema,
    decidedAt: z.string(),
    approver: z.string().optional(),
    comment: z.string().optional(),
  }),
  z.object({
    decision: z.literal('reject'),
    rejectAction: Gate12RejectActionSchema,
    decidedAt: z.string(),
    approver: z.string().optional(),
    comment: z.string().optional(),
  }),
  z.object({
    decision: z.literal('defer'),
    deferAction: Gate12DeferActionSchema,
    decidedAt: z.string(),
    approver: z.string().optional(),
    comment: z.string().optional(),
  }),
])
export type Gate12Decision = z.infer<typeof Gate12DecisionSchema>

/**
 * gate-12 fire 入口 input. auto-update-hitl.ts の builder 結果を素材化.
 */
export const Gate12RequestSchema = z
  .object({
    type: z.literal(GATE_12_TYPE),
    title: z.string().min(1).max(200),
    message: z.string().min(1).max(2000),
    risk: z.enum(['low', 'medium', 'high']),
    /** outcome 識別 (defer 経路のみ ok を許可するが本 gate は ok 発火対象外) */
    outcome: Gate12CheckOutcomeSchema,
    /** 開発者が approve した場合の希望アクション (UI 上のラジオ選択肢) */
    suggestedApproveAction: Gate12ApproveActionSchema,
    /** reject 時の fallback アクション */
    rejectAction: Gate12RejectActionSchema,
    /** 任意の audit metadata (cliPath / version / stdoutPreview 等) */
    payload: z.record(z.unknown()).optional(),
  })
  .strict()
export type Gate12Request = z.infer<typeof Gate12RequestSchema>

/**
 * Slack quick-action 用 button payload (gate-12 専用).
 *
 * gate-11 (PII review) と一貫した形式: metadata + 3-decision (approve / reject / defer).
 * 既存 SlackQuickActionPayloadSchema は kill_switch / cost_cap / drill_start の 3 種のみで、
 * gate-12 はそれらと並列の独立 button group なので別 schema を用意する.
 */
export const Gate12SlackQuickActionSchema = z
  .object({
    /** 'gate12' 固定 (slack-quick-action.ts の SlackQuickActionKind とは別 namespace) */
    kind: z.literal('gate12_cli_version_update'),
    /** Slack channel / actor 情報 (slack-quick-action.ts と互換 metadata) */
    metadata: z.object({
      projectId: z.string().min(1),
      channelId: z.string().min(1),
      actorUserId: z.string().min(1),
      nonce: z.string().min(8),
      issuedAt: z.string(),
      expiresAt: z.string(),
    }),
    /** どの decision を実行するか */
    decision: z.enum(['approve', 'reject', 'defer']),
    /** decision に応じた action enum (approveAction / rejectAction / deferAction) */
    action: z.string().min(1).max(80),
    /** 元 outcome (audit / verification 用) */
    outcome: Gate12CheckOutcomeSchema,
    /** human readable reason (button label 経由で audit) */
    reason: z.string().min(1).max(500),
  })
  .strict()
export type Gate12SlackQuickAction = z.infer<typeof Gate12SlackQuickActionSchema>

// ============================================================================
// 純関数: HITL request 変換
// ============================================================================

/**
 * `Gate12Request` から既存 `HitlAction` (FileHitlGate.requestApproval 入力) を生成する.
 *
 * - HitlActionType は 'paid_api_call' を流用 (gate-12 は API 呼び出し相当の risk 構造).
 * - meta に gate-12 固有 payload を埋め込む (caller 側で再 validate).
 *
 * 注意:
 *   - HitlActionType への正式追加は CEO 議決待ち. 本書は append-only SOP 準拠で
 *     既存 enum を流用し、meta.kind === 'cli_version_update_approval' で識別する.
 *   - description は title + (head 200 chars of message) の合成.
 */
export function gate12RequestToHitlAction(req: Gate12Request): HitlAction {
  const validated = Gate12RequestSchema.parse(req)
  const description = truncateDescription(`${validated.title}: ${validated.message}`)
  const risk: HitlRiskLevel = validated.risk
  return {
    // HitlActionType 'paid_api_call' を一時的に流用 (Round 14 暫定).
    // CEO 議決後 'cli_version_update_approval' 追加で置換予定.
    type: 'paid_api_call',
    description,
    risk,
    meta: {
      kind: GATE_12_TYPE,
      outcome: validated.outcome,
      suggestedApproveAction: validated.suggestedApproveAction,
      rejectAction: validated.rejectAction,
      title: validated.title,
      message: validated.message,
      payload: validated.payload ?? {},
    },
  }
}

/** description 生成 helper (既存 HitlAction.description は max 制約なしだが UI 用に切る). */
function truncateDescription(s: string, max = 500): string {
  if (s.length <= max) return s
  return s.slice(0, max - '...'.length) + '...'
}

// ============================================================================
// 純関数: 結果解釈 (HitlApprovalResult → Gate12Decision)
// ============================================================================

/**
 * FileHitlGate の polling 結果 (HitlApprovalResult) を Gate12Decision に変換する.
 *
 * 規則:
 *   - approved=true → decision='approve' + req.suggestedApproveAction を採用
 *     (caller が override 可能だが、本 helper は default として suggested を返す).
 *   - approved=false + reason='timeout' → decision='defer' + 'recheck_in_next_boot'
 *     (24h timeout 経過 = caller が見送った扱い、次回起動で再評価).
 *   - approved=false + reason='rejected' → decision='reject' + req.rejectAction.
 *
 * - 既存 HitlApprovalResult.reason には gate-12 専用値を持たせない (互換維持).
 */
export function interpretHitlResult(
  req: Gate12Request,
  result: HitlApprovalResult,
): Gate12Decision {
  const validated = Gate12RequestSchema.parse(req)
  const decidedAt = result.decidedAt
  if (result.approved) {
    return Gate12DecisionSchema.parse({
      decision: 'approve',
      approveAction: validated.suggestedApproveAction,
      decidedAt,
      ...(result.approver !== undefined && { approver: result.approver }),
      ...(result.comment !== undefined && { comment: result.comment }),
    })
  }
  // timeout = defer (24h SLA 内に決まらず、再評価へ送る)
  if (result.reason === 'timeout') {
    return Gate12DecisionSchema.parse({
      decision: 'defer',
      deferAction: 'recheck_in_next_boot',
      decidedAt,
      ...(result.approver !== undefined && { approver: result.approver }),
      ...(result.comment !== undefined && { comment: result.comment }),
    })
  }
  // それ以外 (rejected) は reject
  return Gate12DecisionSchema.parse({
    decision: 'reject',
    rejectAction: validated.rejectAction,
    decidedAt,
    ...(result.approver !== undefined && { approver: result.approver }),
    ...(result.comment !== undefined && { comment: result.comment }),
  })
}

// ============================================================================
// 純関数: Slack quick-action payload builder / parser
// ============================================================================

/**
 * gate-12 Slack interactive button payload を 1 つ生成する純関数.
 *
 * 既存 buildSlackQuickActionButton と排他関係 (kind が独立 namespace なので衝突なし).
 * Slack Block Kit の `button` block と互換な subset 構造を返す.
 */
export interface Gate12SlackButton {
  type: 'button'
  text: { type: 'plain_text'; text: string; emoji: boolean }
  style?: 'primary' | 'danger'
  action_id: string
  value: string
}

export const ACTION_ID_GATE12_APPROVE =
  'clawbridge:gate12:approve' as const
export const ACTION_ID_GATE12_REJECT =
  'clawbridge:gate12:reject' as const
export const ACTION_ID_GATE12_DEFER =
  'clawbridge:gate12:defer' as const

const GATE12_ACTION_ID_BY_DECISION: Readonly<Record<'approve' | 'reject' | 'defer', string>> =
  Object.freeze({
    approve: ACTION_ID_GATE12_APPROVE,
    reject: ACTION_ID_GATE12_REJECT,
    defer: ACTION_ID_GATE12_DEFER,
  })

export interface BuildGate12SlackButtonsOptions {
  request: Gate12Request
  metadata: SlackQuickActionMetadata
}

/**
 * gate-12 quick-action 3 button (approve / reject / defer) を一括生成する.
 *
 * Slack Block Kit `actions` block に 3 button を並べる前提.
 */
export function buildGate12SlackButtons(
  opts: BuildGate12SlackButtonsOptions,
): readonly Gate12SlackButton[] {
  const req = Gate12RequestSchema.parse(opts.request)
  const meta = opts.metadata
  const approve: Gate12SlackQuickAction = {
    kind: 'gate12_cli_version_update',
    metadata: meta,
    decision: 'approve',
    action: req.suggestedApproveAction,
    outcome: req.outcome,
    reason: `Approve ${req.suggestedApproveAction}`,
  }
  const reject: Gate12SlackQuickAction = {
    kind: 'gate12_cli_version_update',
    metadata: meta,
    decision: 'reject',
    action: req.rejectAction,
    outcome: req.outcome,
    reason: `Reject (fallback ${req.rejectAction})`,
  }
  const defer: Gate12SlackQuickAction = {
    kind: 'gate12_cli_version_update',
    metadata: meta,
    decision: 'defer',
    action: 'recheck_in_next_boot',
    outcome: req.outcome,
    reason: 'Defer (recheck on next boot)',
  }
  return [
    {
      type: 'button',
      text: {
        type: 'plain_text',
        text: `Approve: ${humanLabelForApprove(req.suggestedApproveAction)}`,
        emoji: false,
      },
      style: req.risk === 'high' ? 'danger' : 'primary',
      action_id: ACTION_ID_GATE12_APPROVE,
      value: JSON.stringify(approve),
    },
    {
      type: 'button',
      text: {
        type: 'plain_text',
        text: `Reject: ${humanLabelForReject(req.rejectAction)}`,
        emoji: false,
      },
      action_id: ACTION_ID_GATE12_REJECT,
      value: JSON.stringify(reject),
    },
    {
      type: 'button',
      text: { type: 'plain_text', text: 'Defer (24h)', emoji: false },
      action_id: ACTION_ID_GATE12_DEFER,
      value: JSON.stringify(defer),
    },
  ]
}

function humanLabelForApprove(a: Gate12ApproveAction): string {
  switch (a) {
    case 'continue_with_warning':
      return 'Continue with warning'
    case 'switch_to_dry_run':
      return 'Switch to dry-run'
    case 'halt_for_manual_update':
      return 'Halt for manual update'
  }
}

function humanLabelForReject(a: Gate12RejectAction): string {
  switch (a) {
    case 'switch_to_dry_run':
      return 'Switch to dry-run'
    case 'halt':
      return 'Halt'
  }
}

/**
 * Slack interactive callback の `value` 文字列を gate-12 用に parse + 検証.
 *
 * - JSON parse OK
 * - schema valid (Gate12SlackQuickActionSchema)
 * - action_id と decision が一致 (ACTION_ID_GATE12_BY_DECISION)
 * - expiresAt > now (期限切れ拒否)
 */
export function parseGate12SlackQuickAction(
  rawValue: string,
  actionId: string,
  nowMs: number = Date.now(),
): Gate12SlackQuickAction {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawValue)
  } catch (e) {
    throw new Error(
      `gate-12 slack quick action: invalid JSON: ${(e as Error).message}`,
    )
  }
  const payload = Gate12SlackQuickActionSchema.parse(parsed)
  const expectedActionId = GATE12_ACTION_ID_BY_DECISION[payload.decision]
  if (actionId !== expectedActionId) {
    throw new Error(
      `gate-12 slack quick action: action_id mismatch (expected ${expectedActionId}, got ${actionId})`,
    )
  }
  const expiresAt = Date.parse(payload.metadata.expiresAt)
  if (!Number.isFinite(expiresAt)) {
    throw new Error('gate-12 slack quick action: invalid expiresAt timestamp')
  }
  if (expiresAt <= nowMs) {
    throw new Error('gate-12 slack quick action: payload expired')
  }
  return payload
}

// ============================================================================
// fire 経路: HitlGate に submit して Gate12Decision を返す async helper
// ============================================================================

export interface FireGate12Options {
  /** harness の HitlGate 実装 (FileHitlGate を渡す想定、test では mock 可) */
  hitl: HitlGate
  /** version-check builder の出力 (auto-update-hitl.buildCliVersionUpdateHitlRequest) */
  request: Gate12Request
}

/**
 * gate-12 を harness 経由で発火させ、Owner / CEO の判断を待ち、Gate12Decision を返す.
 *
 * 実装は既存 FileHitlGate.requestApproval を流用するシンプルな adapter.
 * timeout = 24h (FileHitlGate default) で defer 扱い.
 */
export async function fireGate12HitlGate(
  opts: FireGate12Options,
): Promise<Gate12Decision> {
  const action = gate12RequestToHitlAction(opts.request)
  const result = await opts.hitl.requestApproval(action)
  return interpretHitlResult(opts.request, result)
}
