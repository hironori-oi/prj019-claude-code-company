/**
 * HITL-10 — 権限変更 Owner 承認 (Round 16 第 2 波 skeleton, W2 完遂予定)
 * env / sandbox / delegation 境界変更 → HITL 第 10 種で Owner 承認必須。
 * Spec: ../../specs/17day-path-7ctrl.md#hitl-10
 */
import { z } from 'zod'

export const APPROVAL_SLA_MS = 24 * 60 * 60 * 1000

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
})
export type PermissionChangeOutput = z.infer<typeof PermissionChangeOutputSchema>

export interface OwnerNotifier {
  notify(ticketId: string, payload: PermissionChangeInput): Promise<{ delivered: boolean }>
}

/** skeleton: 完成版は W2 で実装。ticketId 採番 + pending 返却のみ。 */
export async function requestPermissionApproval(
  input: PermissionChangeInput,
  _notifier: OwnerNotifier,
  now: () => number = () => Date.now(),
): Promise<PermissionChangeOutput> {
  PermissionChangeInputSchema.parse(input)
  const ts = now()
  // TODO(W2): retry × 3 + CEO fallback + 24h SLA enforcement
  return {
    approvalState: 'pending',
    expiresAt: new Date(ts + APPROVAL_SLA_MS).toISOString(),
    ticketId: `HITL10-${ts.toString(36)}`,
  }
}
