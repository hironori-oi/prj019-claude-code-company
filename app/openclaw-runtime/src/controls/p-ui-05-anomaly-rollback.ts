/**
 * P-UI-05 — 異常検知 + rollback (Round 16 第 2 波 skeleton, W2 完遂予定)
 * cost burst / loop time / output 異常 → 連続 2 loop 越えで auto rollback。
 * Spec: ../../specs/17day-path-7ctrl.md#p-ui-05
 */
import { z } from 'zod'

export const AnomalyMetricSchema = z.enum(['cost_per_loop', 'loop_duration', 'output_anomaly'])
export type AnomalyMetric = z.infer<typeof AnomalyMetricSchema>

// 注: observedValue は NaN を許容する (NaN は detectAnomaly 側で metric_nan_skip 判定)。
// zod の z.number() は既定で NaN を reject するため、明示的に許容する。
const ObservedValueSchema = z.custom<number>(
  (v) => typeof v === 'number',
  { message: 'observedValue must be number (NaN allowed for skip path)' },
)
// threshold は positive finite を強制 (異常検知の比較対象として無効値を弾く)。
export const AnomalyInputSchema = z.object({
  metric: AnomalyMetricSchema,
  observedValue: ObservedValueSchema,
  threshold: z.number().finite().positive(),
  loopId: z.string().min(1),
})
export type AnomalyInput = z.infer<typeof AnomalyInputSchema>

export const AnomalyOutputSchema = z.object({
  anomalyDetected: z.boolean(),
  rollbackTriggered: z.boolean(),
  rollbackToCommit: z.string().optional(),
  reason: z.string(),
})
export type AnomalyOutput = z.infer<typeof AnomalyOutputSchema>

export interface AnomalyState {
  consecutiveBreaches: number
  lastLoopId: string | null
}

/** skeleton: 完成版は W2 で実装。NaN 除外 + 連続 2 越え判定のみ stub。 */
export function detectAnomaly(input: AnomalyInput, _state: AnomalyState): AnomalyOutput {
  AnomalyInputSchema.parse(input)
  if (!Number.isFinite(input.observedValue)) {
    return { anomalyDetected: false, rollbackTriggered: false, reason: 'metric_nan_skip' }
  }
  // TODO(W2): rollback execution + kill-switch interlock on rollback failure
  const breached = input.observedValue > input.threshold
  return {
    anomalyDetected: breached,
    rollbackTriggered: false,
    reason: breached ? 'threshold_exceeded_pending_confirm' : 'within_threshold',
  }
}
