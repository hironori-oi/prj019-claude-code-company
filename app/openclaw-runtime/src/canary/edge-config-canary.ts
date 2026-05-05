/**
 * W6-A canary stage helper — Edge Config canary 切替 helper (PRJ-019 GTC-4 / R29 Dev-FFF)
 *
 * Vercel Edge Config を想定した canary rollout stage 0-4 の段階制御を提供する。
 * 実 Vercel Edge Config API は本 module 外で注入（依存 inversion）し、本 module は
 * stage 計算 / 遷移ガード / read-only mock を提供する。物理 deploy なし。
 *
 * stage 定義:
 *   0 = pre-canary (0%)   — 切替前
 *   1 = canary S1 (5%)    — 限定 internal traffic
 *   2 = canary S2 (25%)   — 拡張 internal traffic
 *   3 = canary S3 (50%)   — beta cohort
 *   4 = GA (100%)         — production GA
 *
 * 連動: runsheets/w6a-production-rollout-sop.md §3 canary 4 段階
 */
import { z } from 'zod'

export const CANARY_STAGES = [0, 1, 2, 3, 4] as const
export type CanaryStage = (typeof CANARY_STAGES)[number]

export const STAGE_PERCENT: Record<CanaryStage, number> = {
  0: 0,
  1: 5,
  2: 25,
  3: 50,
  4: 100,
}

export const CanaryInputSchema = z.object({
  currentStage: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
  ]),
  targetStage: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
  ]),
  abortRequested: z.boolean().default(false),
  triggerEvidenceOk: z.boolean().default(true),
})
export type CanaryInput = z.infer<typeof CanaryInputSchema>

export type CanaryDecision = {
  allowed: boolean
  nextStage: CanaryStage
  nextPercent: number
  reason: 'forward' | 'rollback' | 'hold' | 'abort' | 'invalid_jump'
}

/**
 * stage 遷移判定。abort 要求 / trigger evidence 不足 / stage skip を弾く。
 * forward は currentStage+1 のみ許可（skip は invalid_jump）。
 * rollback は target=0 に強制 fallback。
 */
export function decideCanary(input: CanaryInput): CanaryDecision {
  const parsed = CanaryInputSchema.parse(input)
  const { currentStage, targetStage, abortRequested, triggerEvidenceOk } = parsed

  if (abortRequested) {
    return { allowed: true, nextStage: 0, nextPercent: 0, reason: 'abort' }
  }

  if (targetStage < currentStage) {
    return {
      allowed: true,
      nextStage: targetStage as CanaryStage,
      nextPercent: STAGE_PERCENT[targetStage as CanaryStage],
      reason: 'rollback',
    }
  }

  if (targetStage === currentStage) {
    return {
      allowed: true,
      nextStage: currentStage,
      nextPercent: STAGE_PERCENT[currentStage],
      reason: 'hold',
    }
  }

  if (targetStage - currentStage > 1) {
    return {
      allowed: false,
      nextStage: currentStage,
      nextPercent: STAGE_PERCENT[currentStage],
      reason: 'invalid_jump',
    }
  }

  if (!triggerEvidenceOk) {
    return {
      allowed: false,
      nextStage: currentStage,
      nextPercent: STAGE_PERCENT[currentStage],
      reason: 'hold',
    }
  }

  return {
    allowed: true,
    nextStage: targetStage as CanaryStage,
    nextPercent: STAGE_PERCENT[targetStage as CanaryStage],
    reason: 'forward',
  }
}

/**
 * Edge Config 書込 mock（実 Vercel Edge Config API 想定 / 物理 deploy 0 件）。
 * 戻り値は { written: percent } で、実 API 呼出は writer 注入で実装する。
 */
export type EdgeConfigWriter = (percent: number) => Promise<void>

export async function applyCanary(
  decision: CanaryDecision,
  writer: EdgeConfigWriter,
): Promise<{ applied: boolean; percent: number }> {
  if (!decision.allowed) {
    return { applied: false, percent: decision.nextPercent }
  }
  await writer(decision.nextPercent)
  return { applied: true, percent: decision.nextPercent }
}
