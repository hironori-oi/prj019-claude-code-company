/**
 * W6-A canary helper — Vitest test (R29 Dev-FFF / GTC-4)
 * 6 cases: forward / hold / rollback / abort / invalid_jump / writer apply
 */
import { describe, it, expect, vi } from 'vitest'

import {
  decideCanary,
  applyCanary,
  STAGE_PERCENT,
  CanaryInputSchema,
} from '../edge-config-canary.js'

describe('W6-A edge-config-canary', () => {
  it('forward S1 -> S2 allowed when trigger evidence ok', () => {
    const out = decideCanary({
      currentStage: 1,
      targetStage: 2,
      abortRequested: false,
      triggerEvidenceOk: true,
    })
    expect(out.allowed).toBe(true)
    expect(out.nextStage).toBe(2)
    expect(out.nextPercent).toBe(25)
    expect(out.reason).toBe('forward')
  })

  it('hold when target == current', () => {
    const out = decideCanary({
      currentStage: 2,
      targetStage: 2,
      abortRequested: false,
      triggerEvidenceOk: true,
    })
    expect(out.reason).toBe('hold')
    expect(out.nextPercent).toBe(STAGE_PERCENT[2])
  })

  it('rollback when target < current', () => {
    const out = decideCanary({
      currentStage: 3,
      targetStage: 0,
      abortRequested: false,
      triggerEvidenceOk: true,
    })
    expect(out.reason).toBe('rollback')
    expect(out.nextStage).toBe(0)
    expect(out.nextPercent).toBe(0)
  })

  it('abort overrides target and forces stage 0', () => {
    const out = decideCanary({
      currentStage: 4,
      targetStage: 4,
      abortRequested: true,
      triggerEvidenceOk: true,
    })
    expect(out.reason).toBe('abort')
    expect(out.nextStage).toBe(0)
    expect(out.nextPercent).toBe(0)
  })

  it('invalid_jump when target skips a stage forward', () => {
    const out = decideCanary({
      currentStage: 1,
      targetStage: 3,
      abortRequested: false,
      triggerEvidenceOk: true,
    })
    expect(out.allowed).toBe(false)
    expect(out.reason).toBe('invalid_jump')
    expect(out.nextStage).toBe(1)
  })

  it('applyCanary calls writer only when allowed', async () => {
    const writer = vi.fn().mockResolvedValue(undefined)
    const decision = decideCanary({
      currentStage: 0,
      targetStage: 1,
      abortRequested: false,
      triggerEvidenceOk: true,
    })
    const r = await applyCanary(decision, writer)
    expect(writer).toHaveBeenCalledWith(5)
    expect(r.applied).toBe(true)
    expect(r.percent).toBe(5)
  })

  it('hold when trigger evidence missing', () => {
    const out = decideCanary({
      currentStage: 1,
      targetStage: 2,
      abortRequested: false,
      triggerEvidenceOk: false,
    })
    expect(out.allowed).toBe(false)
    expect(out.reason).toBe('hold')
  })

  it('schema rejects out-of-range stage', () => {
    expect(() =>
      CanaryInputSchema.parse({
        currentStage: 5,
        targetStage: 0,
        abortRequested: false,
        triggerEvidenceOk: true,
      }),
    ).toThrow()
  })
})
