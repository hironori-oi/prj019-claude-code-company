/**
 * C-OC-04 — breaking change 検知 → 1h escalation (Round 16 第 2 波 skeleton, W1 完遂予定)
 * C-OC-03 で major diff 検出 → Slack #drill + CEO 通知 + Phase gate block。
 * Spec: ../../specs/17day-path-7ctrl.md#c-oc-04
 */
import { z } from 'zod'

export const ESCALATION_SLA_MS = 60 * 60 * 1000

export const MajorDiffSchema = z.object({
  field: z.string().min(1),
  before: z.string(),
  after: z.string(),
})
export type MajorDiff = z.infer<typeof MajorDiffSchema>

export const EscalationInputSchema = z.object({
  contractRunId: z.string().min(1),
  majorDiffs: z.array(MajorDiffSchema).min(1),
  detectedAt: z.string().datetime(),
})
export type EscalationInput = z.infer<typeof EscalationInputSchema>

export const EscalationOutputSchema = z.object({
  escalationId: z.string().min(1),
  notifiedChannels: z.array(z.string().min(1)),
  phaseGateBlocked: z.boolean(),
  ackDeadline: z.string().datetime(),
})
export type EscalationOutput = z.infer<typeof EscalationOutputSchema>

export interface NotifierBundle {
  slack(channel: string, msg: string): Promise<{ delivered: boolean }>
  email(to: string, msg: string): Promise<{ delivered: boolean }>
}

/** skeleton: 完成版は W1 で実装。escalationId 採番 + gate block 宣言のみ。 */
export async function escalateBreakingChange(
  input: EscalationInput,
  _notifiers: NotifierBundle,
): Promise<EscalationOutput> {
  EscalationInputSchema.parse(input)
  const detectedTs = Date.parse(input.detectedAt)
  // TODO(W1): Slack #drill / CEO email / fallback retry / audit critical log
  return {
    escalationId: `COC04-${input.contractRunId}`,
    notifiedChannels: [],
    phaseGateBlocked: true,
    ackDeadline: new Date(detectedTs + ESCALATION_SLA_MS).toISOString(),
  }
}
