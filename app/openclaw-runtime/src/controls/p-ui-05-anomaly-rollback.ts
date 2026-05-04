/**
 * P-UI-05 — 異常検知 + rollback (Round 17 第 2 波 W1 完成版, Dev-W 担当)
 * cost burst / loop time / output 異常 → 連続 2 loop 越えで auto rollback。
 * Spec: ../../specs/17day-path-7ctrl.md#p-ui-05
 *
 * 完成範囲 (Round 17 W1):
 *  - 連続 2 loop breach 確定 → rollback 起動
 *  - rollback executor port (DI) 経由で副作用は外部委譲
 *  - rollback 失敗 → kill switch interlock signal (kill port DI)
 *  - NaN observed → metric_nan_skip (Review escalate は呼出側責務)
 *  - state は呼出側保持 (関数は pure: state を読み新 state は返却値で示す)
 */
import { z } from 'zod'

export const AnomalyMetricSchema = z.enum(['cost_per_loop', 'loop_duration', 'output_anomaly'])
export type AnomalyMetric = z.infer<typeof AnomalyMetricSchema>

// observedValue は NaN を許容する (NaN は detectAnomaly 側で metric_nan_skip 判定)。
const ObservedValueSchema = z.custom<number>(
  (v) => typeof v === 'number',
  { message: 'observedValue must be number (NaN allowed for skip path)' },
)

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

export interface RollbackExecutor {
  /** rollback 実行: ok=true で成功、失敗時は ok=false を返す (throw しない) */
  rollback(loopId: string): Promise<{ ok: boolean; targetCommit?: string; reason?: string }>
}

export interface KillSwitchTrigger {
  /** rollback 失敗時の interlock 発火 (副作用は呼出先) */
  fire(reason: string): Promise<void>
}

const NO_OP_KILL: KillSwitchTrigger = { fire: async () => {} }

/**
 * Round 18 W2 cross-control: p-ui-04 kill switch terminal latch を問い合わせる port。
 * isActive() が true の時、p-ui-05 は rollback を起動しない (kill = terminal)。
 */
export interface KillTerminalQuery {
  isActive(): boolean
  lastReason(): string | null
}

/**
 * Round 18 W2 cross-control: rollback 完遂時 p-ui-09 が post-rollback verify を回す
 * ための notifier port。RLS verify は呼出側が runRlsChecklist を別途実行する。
 */
export interface PostRollbackNotifier {
  onRollbackCompleted(payload: { loopId: string; targetCommit?: string }): Promise<void> | void
}

/**
 * detectAnomaly — pure な breach 判定のみ。rollback 起動は evaluateAndAct 側で。
 * 後方互換のため signature 維持 (旧テスト + skeleton barrel export 用)。
 */
export function detectAnomaly(input: AnomalyInput, state: AnomalyState): AnomalyOutput {
  AnomalyInputSchema.parse(input)
  if (!Number.isFinite(input.observedValue)) {
    return { anomalyDetected: false, rollbackTriggered: false, reason: 'metric_nan_skip' }
  }
  const breached = input.observedValue > input.threshold
  if (!breached) {
    return { anomalyDetected: false, rollbackTriggered: false, reason: 'within_threshold' }
  }
  const isConsecutive = state.lastLoopId !== null && state.lastLoopId !== input.loopId
  const breaches = isConsecutive ? state.consecutiveBreaches + 1 : Math.max(state.consecutiveBreaches, 1)
  if (breaches >= 2) {
    return {
      anomalyDetected: true,
      rollbackTriggered: false, // executor 連動は evaluateAndAct で
      reason: 'confirmed_consecutive_breach_pending_rollback',
    }
  }
  return {
    anomalyDetected: true,
    rollbackTriggered: false,
    reason: 'first_breach_observation',
  }
}

/**
 * Round 18 W2 拡張オプション。後方互換のため optional のまま。
 *  - killQuery: kill switch が terminal latch なら rollback 起動を抑止
 *  - postRollback: rollback 完遂後の post-rollback verify を呼出側に通知
 */
export interface EvaluateAndActOptions {
  killQuery?: KillTerminalQuery
  postRollback?: PostRollbackNotifier
}

/** 連動 path: 確定時 rollback 起動 + 失敗時 kill switch interlock */
export async function evaluateAndAct(
  input: AnomalyInput,
  state: AnomalyState,
  executor: RollbackExecutor,
  kill: KillSwitchTrigger = NO_OP_KILL,
  opts: EvaluateAndActOptions = {},
): Promise<AnomalyOutput> {
  const verdict = detectAnomaly(input, state)
  if (verdict.reason !== 'confirmed_consecutive_breach_pending_rollback') {
    return verdict
  }
  // Round 18 W2 cross-control invariant:
  //   p-ui-04 kill switch fired → p-ui-05 rollback NOT triggered (kill is terminal)
  if (opts.killQuery?.isActive()) {
    return {
      anomalyDetected: true,
      rollbackTriggered: false,
      reason: `rollback_skipped_kill_terminal:${opts.killQuery.lastReason() ?? 'unknown'}`,
    }
  }
  const result = await executor.rollback(input.loopId)
  if (result.ok) {
    if (opts.postRollback) {
      await opts.postRollback.onRollbackCompleted({
        loopId: input.loopId,
        targetCommit: result.targetCommit,
      })
    }
    return {
      anomalyDetected: true,
      rollbackTriggered: true,
      rollbackToCommit: result.targetCommit,
      reason: 'rollback_completed',
    }
  }
  await kill.fire(`rollback_failed:${result.reason ?? 'unknown'}`)
  return {
    anomalyDetected: true,
    rollbackTriggered: false,
    reason: `rollback_failed_kill_switch_armed:${result.reason ?? 'unknown'}`,
  }
}
