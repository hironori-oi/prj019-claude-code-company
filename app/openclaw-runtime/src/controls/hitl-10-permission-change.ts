/**
 * HITL-10 — 権限変更 Owner 承認 (Round 17 第 2 波 W1 完成版, Dev-W 担当)
 * env / sandbox / delegation 境界変更 → HITL 第 10 種で Owner 承認必須。
 * Spec: ../../specs/17day-path-7ctrl.md#hitl-10
 *
 * 完成範囲 (Round 17 W1):
 *  - approver port (Owner / CEO fallback) + notifier retry × 3
 *  - 24h SLA enforcement (timeout state 自動)
 *  - 通知失敗 → CEO fallback (但し最終承認は Owner 必須なので state は pending 維持)
 *  - 副作用 0: notifier / approver / clock 全て DI port
 */
import { z } from 'zod'

export const APPROVAL_SLA_MS = 24 * 60 * 60 * 1000
export const NOTIFY_RETRY_LIMIT = 3

export const ChangeTypeSchema = z.enum(['env', 'sandbox', 'delegation'])
export type ChangeType = z.infer<typeof ChangeTypeSchema>

export const PermissionChangeInputSchema = z.object({
  changeType: ChangeTypeSchema,
  before: z.string(),
  after: z.string(),
  requesterRole: z.string().min(1),
  rationale: z.string().min(1),
})
export type PermissionChangeInput = z.infer<typeof PermissionChangeInputSchema>

export const ApprovalStateSchema = z.enum(['pending', 'approved', 'rejected', 'timeout'])
export type ApprovalState = z.infer<typeof ApprovalStateSchema>

export const PermissionChangeOutputSchema = z.object({
  approvalState: ApprovalStateSchema,
  approvedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime(),
  ticketId: z.string().min(1),
  notifyAttempts: z.number().int().nonnegative().optional(),
  fallbackTo: z.enum(['owner', 'ceo']).optional(),
})
export type PermissionChangeOutput = z.infer<typeof PermissionChangeOutputSchema>

export interface OwnerNotifier {
  notify(ticketId: string, payload: PermissionChangeInput): Promise<{ delivered: boolean }>
}

export interface CeoFallbackNotifier {
  notify(ticketId: string, payload: PermissionChangeInput): Promise<{ delivered: boolean }>
}

export interface PermissionApprover {
  /** Owner 承認 port: 最終 state を返す (Owner only — CEO は通知 fallback のみ) */
  decide(ticketId: string, expiresAt: number, nowFn: () => number): Promise<{
    state: 'approved' | 'rejected' | 'pending' | 'timeout'
    approvedAt?: number
  }>
}

const NO_OP_CEO_FALLBACK: CeoFallbackNotifier = { notify: async () => ({ delivered: true }) }

/**
 * Round 18 W2 cross-control audit sink。
 * 権限変更承認の終局状態 (approved / rejected / timeout) を p-ui-09 RLS 検証
 * 実行コンテキストへ伝搬する。実装は p-ui-09 の RlsAuditTrail と互換 shape。
 *
 *   hitl-10 permission denied → p-ui-09 RLS checklist must include audit trail entry
 */
export interface PermissionAuditSink {
  /**
   * decision 終局時に呼出。kind は state→audit kind の素直なマッピング:
   *   approved → permission_approved
   *   rejected / timeout → permission_denied
   *   pending は記録しない (まだ終局でないため)。
   */
  recordDecision(payload: {
    ticketId: string
    state: 'approved' | 'rejected' | 'timeout'
    detail?: string
    recordedAt: string
  }): void
}

/**
 * Round 18 W2 拡張オプション。後方互換のため optional のまま。
 *  - auditSink: 終局判定 (approved / rejected / timeout) を cross-control audit に流す
 */
export interface PermissionApprovalOptions {
  auditSink?: PermissionAuditSink
}

/**
 * Owner 通知 retry × 3 → 全失敗時 CEO fallback。
 * approver が pending を返す場合は SLA 内なら pending、過ぎていれば timeout。
 */
export async function requestPermissionApproval(
  input: PermissionChangeInput,
  notifier: OwnerNotifier,
  now: () => number = () => Date.now(),
  approver?: PermissionApprover,
  ceoFallback: CeoFallbackNotifier = NO_OP_CEO_FALLBACK,
  opts: PermissionApprovalOptions = {},
): Promise<PermissionChangeOutput> {
  PermissionChangeInputSchema.parse(input)
  const ts = now()
  const ticketId = `HITL10-${ts.toString(36)}`
  const expiresAt = ts + APPROVAL_SLA_MS

  // Owner 通知 retry × 3
  let attempts = 0
  let delivered = false
  while (attempts < NOTIFY_RETRY_LIMIT) {
    attempts += 1
    const r = await notifier.notify(ticketId, input)
    if (r.delivered) {
      delivered = true
      break
    }
  }

  let fallbackTo: 'owner' | 'ceo' = 'owner'
  if (!delivered) {
    // CEO fallback (但し承認権限は Owner のみ)
    await ceoFallback.notify(ticketId, input)
    fallbackTo = 'ceo'
  }

  // approver 未指定なら旧 skeleton 互換で pending
  if (!approver) {
    return {
      approvalState: 'pending',
      expiresAt: new Date(expiresAt).toISOString(),
      ticketId,
      notifyAttempts: attempts,
      fallbackTo,
    }
  }

  const decision = await approver.decide(ticketId, expiresAt, now)
  const nowAfter = now()
  const recordedAt = new Date(nowAfter).toISOString()
  if (decision.state === 'pending' && nowAfter >= expiresAt) {
    opts.auditSink?.recordDecision({
      ticketId,
      state: 'timeout',
      detail: `changeType=${input.changeType}`,
      recordedAt,
    })
    return {
      approvalState: 'timeout',
      expiresAt: new Date(expiresAt).toISOString(),
      ticketId,
      notifyAttempts: attempts,
      fallbackTo,
    }
  }
  if (decision.state === 'approved') {
    opts.auditSink?.recordDecision({
      ticketId,
      state: 'approved',
      detail: `changeType=${input.changeType}`,
      recordedAt,
    })
    return {
      approvalState: 'approved',
      approvedAt: new Date(decision.approvedAt ?? nowAfter).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      ticketId,
      notifyAttempts: attempts,
      fallbackTo,
    }
  }
  if (decision.state === 'rejected') {
    opts.auditSink?.recordDecision({
      ticketId,
      state: 'rejected',
      detail: `changeType=${input.changeType}`,
      recordedAt,
    })
    return {
      approvalState: 'rejected',
      expiresAt: new Date(expiresAt).toISOString(),
      ticketId,
      notifyAttempts: attempts,
      fallbackTo,
    }
  }
  return {
    approvalState: decision.state, // pending or timeout
    expiresAt: new Date(expiresAt).toISOString(),
    ticketId,
    notifyAttempts: attempts,
    fallbackTo,
  }
}
