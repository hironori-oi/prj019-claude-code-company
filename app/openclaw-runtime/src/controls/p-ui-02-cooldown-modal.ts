/**
 * P-UI-02 — cool-down モーダル (Round 16 第 2 波 skeleton, W2 完遂予定)
 * 30s cool-down 中の next loop 起動抑止 + Owner 警告モーダル発火。
 * Spec: ../../specs/17day-path-7ctrl.md#p-ui-02
 */
import { z } from 'zod'

export const COOLDOWN_DURATION_MS = 30_000

export const CooldownTriggerEventSchema = z.enum(['loop_abort', 'manual_stop', 'kill_switch'])
export type CooldownTriggerEvent = z.infer<typeof CooldownTriggerEventSchema>

export const CooldownInputSchema = z.object({
  triggerEvent: CooldownTriggerEventSchema,
  abortedAt: z.string().datetime(),
  loopId: z.string().min(1),
})
export type CooldownInput = z.infer<typeof CooldownInputSchema>

export const CooldownStateSchema = z.enum(['idle', 'active', 'expired', 'overridden'])
export type CooldownState = z.infer<typeof CooldownStateSchema>

export const CooldownOutputSchema = z.object({
  cooldownState: CooldownStateSchema,
  remainingMs: z.number().int().nonnegative(),
  nextAllowedAt: z.string().datetime(),
})
export type CooldownOutput = z.infer<typeof CooldownOutputSchema>

export interface CooldownClock {
  now(): number
}

/** skeleton: 完成版は W2 で実装。現状 idle 固定返却で副作用 0。 */
export function evaluateCooldown(input: CooldownInput, _clock: CooldownClock): CooldownOutput {
  CooldownInputSchema.parse(input)
  // TODO(W2): state machine + override path + clock skew detection
  return {
    cooldownState: 'idle',
    remainingMs: 0,
    nextAllowedAt: input.abortedAt,
  }
}
