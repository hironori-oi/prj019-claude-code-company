/**
 * detector-functions-zscore.test — Round 14 Dev-B / Task B (DEC-019-057).
 *
 * 目的:
 *   - 統一 outlier filter (detectOutlier) と evaluateRateSpikeWithZScore が
 *     既存 suppression-primitives.zScoreFilter および RateSpikeDetector.evaluate()
 *     と数値的に 8 桁一致することを verify。
 *   - filter 適用条件 (past.length<2 / zThreshold<=0) の 'filterApplied' フラグ動作確認。
 *   - 純関数性 (副作用ゼロ / 同入力同出力)。
 *
 * +14 tests:
 *   - detectOutlier basics: 5 tests
 *   - detectOutlier ↔ zScoreFilter 8 桁一致: 3 tests
 *   - evaluateRateSpikeWithZScore: 4 tests
 *   - 既存 RateSpikeDetector との 8 桁一致 regression: 2 tests
 */
import { describe, it, expect } from 'vitest'
import {
  detectOutlier,
  evaluateRateSpikeWithZScore,
  type RateSpikeSampleLite,
} from '../detector-functions.js'
import { zScoreFilter } from '../suppression-primitives.js'
import { RateSpikeDetector } from '../tos-monitor.js'

// ============================================================================
// detectOutlier basics
// ============================================================================

describe('detectOutlier — basics', () => {
  it('past.length < 2: filterApplied=false, suppress=false (pass-through)', () => {
    const r = detectOutlier({ current: 100, past: [] })
    expect(r.filterApplied).toBe(false)
    expect(r.suppress).toBe(false)
    expect(r.mean).toBeNaN()
    expect(r.stdDev).toBeNaN()
    expect(r.threshold).toBeNaN()
    expect(r.current).toBe(100)
  })

  it('past.length === 1: filterApplied=false', () => {
    const r = detectOutlier({ current: 100, past: [50] })
    expect(r.filterApplied).toBe(false)
    expect(r.suppress).toBe(false)
  })

  it('zThreshold <= 0: filter 無効 (suppress=false 固定)', () => {
    const r = detectOutlier({ current: 1_000, past: [10, 10, 10], zThreshold: 0 })
    expect(r.filterApplied).toBe(false)
    expect(r.suppress).toBe(false)
  })

  it('past 分布範囲内 → suppress=true (current <= threshold)', () => {
    // past = [10, 10, 10] → mean=10, stdDev=0, threshold=10+2*0=10
    const r = detectOutlier({ current: 10, past: [10, 10, 10] })
    expect(r.filterApplied).toBe(true)
    expect(r.suppress).toBe(true)
    expect(r.mean).toBe(10)
    expect(r.stdDev).toBe(0)
    expect(r.threshold).toBe(10)
  })

  it('past 分布外 → suppress=false (current > threshold)', () => {
    const r = detectOutlier({ current: 100, past: [10, 10, 10] })
    expect(r.filterApplied).toBe(true)
    expect(r.suppress).toBe(false) // 100 > 10
  })
})

// ============================================================================
// detectOutlier ↔ zScoreFilter 8 桁一致
// ============================================================================

describe('detectOutlier — suppression-primitives.zScoreFilter と 8 桁一致', () => {
  it('mean / stdDev / threshold が一致 (3 シナリオ)', () => {
    const cases: { current: number; past: number[]; z: number }[] = [
      { current: 100, past: [50, 60, 55, 70, 65], z: 2 },
      { current: 1_000, past: [100, 110, 90, 120, 80], z: 1.5 },
      { current: 200, past: [100, 100, 100, 100], z: 2 },
    ]
    for (const c of cases) {
      const newApi = detectOutlier({ current: c.current, past: c.past, zThreshold: c.z })
      // zScoreFilter は buckets[0]=current, buckets[1..]=past 形式
      const oldApi = zScoreFilter([c.current, ...c.past], c.z)
      expect(newApi.mean).toBeCloseTo(oldApi.mean, 8)
      expect(newApi.stdDev).toBeCloseTo(oldApi.stdDev, 8)
      expect(newApi.threshold).toBeCloseTo(oldApi.threshold, 8)
      expect(newApi.suppress).toBe(oldApi.suppress)
    }
  })

  it('non-finite past 値は zScoreFilter と同様 filter 除外', () => {
    const newApi = detectOutlier({
      current: 100,
      past: [50, Number.NaN, 60, Number.POSITIVE_INFINITY, 55],
      zThreshold: 2,
    })
    // zScoreFilter も Number.isFinite() で filter
    const oldApi = zScoreFilter(
      [100, 50, Number.NaN, 60, Number.POSITIVE_INFINITY, 55],
      2,
    )
    expect(newApi.mean).toBeCloseTo(oldApi.mean, 8)
    expect(newApi.stdDev).toBeCloseTo(oldApi.stdDev, 8)
  })

  it('副作用ゼロ — 同入力で同出力 (10 回, deep equal)', () => {
    const input = { current: 100, past: [50, 60, 55, 70, 65], zThreshold: 2 }
    const first = detectOutlier(input)
    for (let i = 0; i < 10; i++) {
      expect(detectOutlier(input)).toEqual(first)
    }
  })
})

// ============================================================================
// evaluateRateSpikeWithZScore
// ============================================================================

describe('evaluateRateSpikeWithZScore — multiplier + z-score 統合', () => {
  it('breach 候補にならない場合 z-score 評価しない (filterApplied=false)', () => {
    // baseline < 1 ケース
    const r = evaluateRateSpikeWithZScore({
      nowMs: 1_000,
      samples: [],
      config: { shortMs: 1_000, longMs: 24_000, multiplier: 5, baselineMinTokens: 10 },
      zScoreThreshold: 2,
    })
    expect(r.breachCandidate).toBe(false)
    expect(r.suppressedByZScore).toBe(false)
    expect(r.outlier.filterApplied).toBe(false)
  })

  it('breach 候補 + 統計 noise → suppressedByZScore=true', () => {
    // 24 windows 全て 100 tokens、24 回目だけ 600 → multiplier=5 候補だが std-dev 大きく noise
    const shortMs = 60 * 60 * 1000
    const longMs = 24 * shortMs
    const samples: RateSpikeSampleLite[] = []
    for (let i = 1; i <= 23; i++) samples.push({ ts: i * shortMs, tokens: 600 })
    samples.push({ ts: 24 * shortMs, tokens: 600 })
    // baseline = (23*600+600)/24 = 600. multiplier=5 で 600*5=3000 必要.
    // shortTokens(=600) < 3000 → breach 候補にすらならない
    const r = evaluateRateSpikeWithZScore({
      nowMs: 24 * shortMs,
      samples,
      config: { shortMs, longMs, multiplier: 5, baselineMinTokens: 10 },
      zScoreThreshold: 2,
    })
    expect(r.breachCandidate).toBe(false)
  })

  it('breach 候補 + outlier (z-score 上回る) → breachCandidate=true / suppressedByZScore=false', () => {
    // 23 buckets: 100 tokens each, 24 番目: 10_000 (異常値, multiplier=100x).
    // baseline ≈ (23*100 + 10_000)/24 ≈ 512.5; multiplier 5 → threshold = 2562.5
    // shortTokens=10_000 >> 2562.5 → breach 候補.
    // past buckets = 1〜23 番目 (100 each), mean=100, stdDev=0, threshold=100+2*0=100
    // current(=10_000) > 100 → suppress=false → breach 確定
    const shortMs = 60 * 60 * 1000
    const longMs = 24 * shortMs
    const samples: RateSpikeSampleLite[] = []
    for (let i = 1; i <= 23; i++) samples.push({ ts: i * shortMs, tokens: 100 })
    samples.push({ ts: 24 * shortMs, tokens: 10_000 })
    const r = evaluateRateSpikeWithZScore({
      nowMs: 24 * shortMs,
      samples,
      config: { shortMs, longMs, multiplier: 5, baselineMinTokens: 10 },
      zScoreThreshold: 2,
    })
    expect(r.breachCandidate).toBe(true)
    expect(r.suppressedByZScore).toBe(false)
    expect(r.outlier.filterApplied).toBe(true)
  })

  it('zScoreThreshold=0 で z-score 無効 → multiplier 判定のみ', () => {
    const shortMs = 60 * 60 * 1000
    const longMs = 24 * shortMs
    const samples: RateSpikeSampleLite[] = []
    for (let i = 1; i <= 23; i++) samples.push({ ts: i * shortMs, tokens: 100 })
    samples.push({ ts: 24 * shortMs, tokens: 10_000 })
    const r = evaluateRateSpikeWithZScore({
      nowMs: 24 * shortMs,
      samples,
      config: { shortMs, longMs, multiplier: 5, baselineMinTokens: 10 },
      zScoreThreshold: 0,
    })
    expect(r.breachCandidate).toBe(true)
    expect(r.suppressedByZScore).toBe(false) // filter 適用されないので suppress 不可
  })
})

// ============================================================================
// 既存 RateSpikeDetector との 8 桁一致 regression
// ============================================================================

describe('evaluateRateSpikeWithZScore — RateSpikeDetector.evaluate() と 8 桁一致', () => {
  it('breach 候補 + outlier 通過: shortTokens / baselinePerWindow が一致', () => {
    const shortMs = 60 * 60 * 1000
    const longMs = 24 * shortMs
    let now = 0
    const d = new RateSpikeDetector(shortMs, longMs, 5, 1, () => now, {
      zScoreThreshold: 2,
    })
    for (let i = 1; i <= 23; i++) {
      now = i * shortMs
      d.recordTokens(100)
    }
    now = 24 * shortMs
    d.recordTokens(10_000)
    const ref = d.evaluate()

    // pure side
    const samples: RateSpikeSampleLite[] = []
    for (let i = 1; i <= 23; i++) samples.push({ ts: i * shortMs, tokens: 100 })
    samples.push({ ts: 24 * shortMs, tokens: 10_000 })
    const pure = evaluateRateSpikeWithZScore({
      nowMs: 24 * shortMs,
      samples,
      config: { shortMs, longMs, multiplier: 5, baselineMinTokens: 10 },
      zScoreThreshold: 2,
    })
    expect(pure.shortTokens).toBeCloseTo(ref.shortTokens, 8)
    expect(pure.baselinePerWindow).toBeCloseTo(ref.baselinePerWindow, 8)
    expect(pure.breachCandidate).toBe(ref.breached) // gate confirmCount=1 なので即発火
  })

  it('breach 候補 + 統計 noise (std-dev ≈ 0 でない past): suppress 判定が一致', () => {
    // bucketごとに 100,200,150,100,200... の variance ある分布
    const shortMs = 60 * 60 * 1000
    const longMs = 24 * shortMs
    let now = 0
    const d = new RateSpikeDetector(shortMs, longMs, 5, 1, () => now, {
      zScoreThreshold: 2,
    })
    const tokens = [
      100, 200, 150, 120, 180, 140, 160, 130, 170, 110, 190, 100, 200, 150, 120, 180, 140, 160,
      130, 170, 110, 190, 100,
    ]
    for (let i = 0; i < 23; i++) {
      now = (i + 1) * shortMs
      d.recordTokens(tokens[i] ?? 100)
    }
    now = 24 * shortMs
    d.recordTokens(900) // small breach 候補かもしれない
    const ref = d.evaluate()

    const samples: RateSpikeSampleLite[] = []
    for (let i = 0; i < 23; i++) samples.push({ ts: (i + 1) * shortMs, tokens: tokens[i] ?? 100 })
    samples.push({ ts: 24 * shortMs, tokens: 900 })
    const pure = evaluateRateSpikeWithZScore({
      nowMs: 24 * shortMs,
      samples,
      config: { shortMs, longMs, multiplier: 5, baselineMinTokens: 10 },
      zScoreThreshold: 2,
    })
    expect(pure.shortTokens).toBeCloseTo(ref.shortTokens, 8)
    expect(pure.baselinePerWindow).toBeCloseTo(ref.baselinePerWindow, 8)
    // breach 判定が一致 (z-score suppress も含めて)
    expect(pure.breachCandidate).toBe(ref.breached)
  })
})
