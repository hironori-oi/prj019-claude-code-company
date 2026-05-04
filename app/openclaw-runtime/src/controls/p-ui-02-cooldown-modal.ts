/**
 * P-UI-02 — cool-down モーダル (Round 17 第 2 波 W1 完成版, Dev-W 担当)
 * 30s cool-down 中の next loop 起動抑止 + Owner 警告モーダル発火。
 * Spec: ../../specs/17day-path-7ctrl.md#p-ui-02
 *
 * 完成範囲 (Round 17 W1):
 *  - state machine: idle → active → expired/overridden
 *  - clock skew detect (system time 後退) → fail-closed (active 継続 + 例外通知)
 *  - HITL 第 12 種 override port 経由 force release
 *  - 多重 trigger は最後勝ち + 残り時間リセット
 *  - 副作用 0: clock / overrideChecker は DI port (test 全て pure)
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

/** HITL 第 12 種 override port (true = Owner 強制解除済) */
export interface CooldownOverrideChecker {
  isOverridden(loopId: string): boolean
}

/** clock skew 検出時に投げる例外 (fail-closed: cooldown は active 継続) */
export class CooldownClockSkewError extends Error {
  readonly loopId: string
  readonly abortedAt: string
  readonly observedNow: number
  constructor(loopId: string, abortedAt: string, observedNow: number) {
    super(`cooldown clock skew detected: loopId=${loopId} abortedAt=${abortedAt} now=${observedNow}`)
    this.name = 'CooldownClockSkewError'
    this.loopId = loopId
    this.abortedAt = abortedAt
    this.observedNow = observedNow
  }
}

const NO_OP_OVERRIDE: CooldownOverrideChecker = { isOverridden: () => false }

export function evaluateCooldown(
  input: CooldownInput,
  clock: CooldownClock,
  override: CooldownOverrideChecker = NO_OP_OVERRIDE,
): CooldownOutput {
  CooldownInputSchema.parse(input)

  const abortedAtMs = Date.parse(input.abortedAt)
  const nowMs = clock.now()

  // clock skew: system time が abortedAt より過去 → fail-closed
  if (nowMs < abortedAtMs) {
    throw new CooldownClockSkewError(input.loopId, input.abortedAt, nowMs)
  }

  const elapsedMs = nowMs - abortedAtMs
  const nextAllowedAtIso = new Date(abortedAtMs + COOLDOWN_DURATION_MS).toISOString()

  // HITL 第 12 種 override 優先 (active 中のみ意味あり)
  if (elapsedMs < COOLDOWN_DURATION_MS && override.isOverridden(input.loopId)) {
    return {
      cooldownState: 'overridden',
      remainingMs: 0,
      nextAllowedAt: new Date(nowMs).toISOString(),
    }
  }

  if (elapsedMs >= COOLDOWN_DURATION_MS) {
    return {
      cooldownState: 'expired',
      remainingMs: 0,
      nextAllowedAt: nextAllowedAtIso,
    }
  }

  return {
    cooldownState: 'active',
    remainingMs: COOLDOWN_DURATION_MS - elapsedMs,
    nextAllowedAt: nextAllowedAtIso,
  }
}
