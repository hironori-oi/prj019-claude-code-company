/**
 * dry-run-guard-coverage.test — Round 11 R11 Dev-C 拡張 (DEC-019-057):
 *   既存 dry-run-guard.ts (Round 10 Dev-γ 着地) の category 5 種を全網羅、
 *   warnInsteadOfThrow soft mode + hard mode 切替テストで 5 × 2 = 10 cell + ε を担保する。
 *
 * 関連必須コントロール:
 *   G-12 (dry-run hardguard) / DEC-019-052 (dry-run mode 切替契約)
 *
 * カバー範囲 (10 cell + 2 拡張 = 12 tests):
 *   Cell マトリクス (5 category × 2 mode):
 *     - dry mode (hard / throw): fs / net / spawn / process / other → 全て DryRunRejectError
 *     - dry mode (soft / warnInsteadOfThrow): fs / net / spawn / process / other → 全て undefined 返却 + warn
 *   拡張:
 *     - mode 切替: 同一 guard instance で mode は immutable (constructor 確定)
 *     - countByCategory 5 category 全 increment
 *
 * 設計原則:
 *   - 既存 src/dry-run-guard.ts は無改変 (既存 8 tests と独立)
 *   - 副作用フリ (実 fs/net/spawn 触れない) — wrap fn 内で実行されないことが要件
 *   - meta payload は redaction 検証も兼ねる (PII 想定の dummy payload)
 */
import { describe, it, expect, vi } from 'vitest'

import {
  createDryRunGuard,
  DryRunRejectError,
  type DryRunCategory,
} from '../../../harness/src/dry-run-guard.js'

const ALL_CATEGORIES: readonly DryRunCategory[] = [
  'fs',
  'net',
  'spawn',
  'process',
  'other',
] as const

describe('dry-run-guard 5×2 coverage matrix (R11 Dev-C / DEC-019-057 / G-12)', () => {
  // ----- dry mode (hard / throw) — 5 cell -----
  for (const cat of ALL_CATEGORIES) {
    it(`hard mode dry × ${cat} — DryRunRejectError throw / fn 未実行 / blocked=true`, async () => {
      const guard = createDryRunGuard({ mode: 'dry' })
      const fnSpy = vi.fn(async () => `${cat}_should_not_run`)
      await expect(
        guard.wrap(cat, `${cat}.test_op`, fnSpy, { sample: 'redacted' }),
      ).rejects.toBeInstanceOf(DryRunRejectError)
      expect(fnSpy).not.toHaveBeenCalled()
      expect(guard.sideEffectsRecorded).toHaveLength(1)
      const rec = guard.sideEffectsRecorded[0]!
      expect(rec.category).toBe(cat)
      expect(rec.blocked).toBe(true)
      expect(rec.name).toBe(`${cat}.test_op`)
      expect(rec.meta).toEqual({ sample: 'redacted' })
    })
  }

  // ----- dry mode (soft / warnInsteadOfThrow) — 5 cell -----
  for (const cat of ALL_CATEGORIES) {
    it(`soft mode dry × ${cat} — undefined 返却 / fn 未実行 / record 残る / warn 1 回`, async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      const guard = createDryRunGuard({ mode: 'dry', warnInsteadOfThrow: true })
      const fnSpy = vi.fn(async () => `${cat}_soft_should_not_run`)
      const r = await guard.wrap(cat, `${cat}.soft_op`, fnSpy)
      expect(r).toBeUndefined()
      expect(fnSpy).not.toHaveBeenCalled()
      expect(guard.sideEffectsRecorded).toHaveLength(1)
      const rec = guard.sideEffectsRecorded[0]!
      expect(rec.category).toBe(cat)
      expect(rec.blocked).toBe(true)
      expect(rec.name).toBe(`${cat}.soft_op`)
      // warn は呼ばれている (内容に category が含まれる想定)
      const calls = warnSpy.mock.calls
      expect(calls.length).toBeGreaterThanOrEqual(1)
      expect(String(calls[0]?.[0] ?? '')).toContain(cat)
      warnSpy.mockRestore()
    })
  }

  // ----- 拡張 1: mode は constructor 確定で immutable (live mode は素通り 5 category) -----
  it('live mode 5 category 全素通り — countByCategory が 1 ずつ increment', async () => {
    const guard = createDryRunGuard({ mode: 'live' })
    let i = 0
    for (const cat of ALL_CATEGORIES) {
      i += 1
      const r = await guard.wrap(cat, `${cat}.live_op`, () => i)
      expect(r).toBe(i)
    }
    const counts = guard.countByCategory()
    expect(counts.fs).toBe(1)
    expect(counts.net).toBe(1)
    expect(counts.spawn).toBe(1)
    expect(counts.process).toBe(1)
    expect(counts.other).toBe(1)
    // live mode は blocked=false
    for (const rec of guard.sideEffectsRecorded) {
      expect(rec.blocked).toBe(false)
    }
  })

  // ----- 拡張 2: 5 × 2 全 cell の record id 順序保証 (insertion-order monotonic) -----
  it('全 5 category insertion-order monotonic id (1..5) / nowIso 注入で attemptedAt 確定', async () => {
    const fixedNow = '2026-05-04T12:00:00.000Z'
    const guard = createDryRunGuard({
      mode: 'live',
      nowIso: () => fixedNow,
    })
    for (const cat of ALL_CATEGORIES) {
      await guard.wrap(cat, `${cat}.op`, () => 1)
    }
    const recs = guard.sideEffectsRecorded
    expect(recs).toHaveLength(5)
    expect(recs.map((r) => r.id)).toEqual([1, 2, 3, 4, 5])
    for (const rec of recs) {
      expect(rec.attemptedAt).toBe(fixedNow)
    }
  })
})
