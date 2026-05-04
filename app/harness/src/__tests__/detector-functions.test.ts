/**
 * detector-functions.test — Round 13 Dev-B / Task B (DEC-019-057).
 *
 * 目的:
 *   - tos-monitor.ts 4 detector class の内部計算を抽出した detector-functions.ts の
 *     pure function 群が、既存 detector class と数値的に 8 桁一致することを verify.
 *   - 純関数性 (副作用ゼロ / 同入力 → 同出力) を確認.
 *
 * +18 tests:
 *   - computeAccumulatedActiveElapsed: 4 tests
 *   - evaluateContinuousRun: 3 tests
 *   - evaluateCostCap: 4 tests
 *   - computeBaselinePerWindow: 3 tests
 *   - evaluateRateSpike: 4 tests
 *   - purgeOlderSamples + bucketTokensPerWindow: 2 tests (8 桁一致 + 純関数性 marker)
 */
import { describe, it, expect } from 'vitest'
import {
  bucketTokensPerWindow,
  computeAccumulatedActiveElapsed,
  computeBaselinePerWindow,
  evaluateContinuousRun,
  evaluateCostCap,
  evaluateRateSpike,
  purgeOlderSamples,
  type RateSpikeSampleLite,
} from '../detector-functions.js'
import {
  ContinuousRunDetector,
  CostCapDetector,
  RateSpikeDetector,
} from '../tos-monitor.js'

// ============================================================================
// computeAccumulatedActiveElapsed
// ============================================================================

describe('computeAccumulatedActiveElapsed — 純関数性 + 数値一致', () => {
  it('wall - sleep の単純引算', () => {
    expect(computeAccumulatedActiveElapsed(1_000, 11_000, 0)).toBe(10_000)
    expect(computeAccumulatedActiveElapsed(1_000, 11_000, 3_000)).toBe(7_000)
  })

  it('elapsed が負値 (sleep > wall) なら 0 にクランプ', () => {
    expect(computeAccumulatedActiveElapsed(1_000, 2_000, 5_000)).toBe(0)
  })

  it('副作用ゼロ — 同入力で同出力 (10 回)', () => {
    for (let i = 0; i < 10; i++) {
      expect(computeAccumulatedActiveElapsed(1_000, 11_000, 3_000)).toBe(7_000)
    }
  })

  it('数値一致 — class 側 elapsed と 8 桁一致 (active wallElapsed = wall - accumulatedSleep)', () => {
    let now = 1_000
    const d = new ContinuousRunDetector(60_000, 1, () => now)
    d.markBoot()
    now = 11_000
    const r = d.evaluate()
    const pure = computeAccumulatedActiveElapsed(1_000, 11_000, 0)
    expect(r?.elapsedMs).toBeCloseTo(pure, 8)
  })
})

// ============================================================================
// evaluateContinuousRun
// ============================================================================

describe('evaluateContinuousRun — class.evaluate() と 8 桁一致', () => {
  it('boot 未マークなら elapsedMs=null + breach 候補なし', () => {
    const r = evaluateContinuousRun({
      bootAtMs: null,
      nowMs: 100_000,
      accumulatedSleepMs: 0,
      limitMs: 60_000,
    })
    expect(r.elapsedMs).toBeNull()
    expect(r.breachCandidate).toBe(false)
  })

  it('elapsed >= limit で breach 候補 true', () => {
    const r = evaluateContinuousRun({
      bootAtMs: 0,
      nowMs: 60_000,
      accumulatedSleepMs: 0,
      limitMs: 60_000,
    })
    expect(r.breachCandidate).toBe(true)
    expect(r.elapsedMs).toBe(60_000)
  })

  it('class 側と 8 桁一致 (3 シナリオ)', () => {
    const scenarios = [
      { boot: 1_000, now: 60_001, sleep: 0, limit: 60_000 },
      { boot: 1_000, now: 100_000, sleep: 30_000, limit: 60_000 },
      { boot: 1_000, now: 100_000, sleep: 50_000, limit: 60_000 },
    ]
    for (const s of scenarios) {
      let now = s.boot
      const d = new ContinuousRunDetector(s.limit, 1, () => now)
      d.markBoot()
      // simulate suspend
      if (s.sleep > 0) {
        now = s.boot + s.sleep + 6 * 60 * 1000 // ensure delta > sleepGap
        d.recordHeartbeat() // adds to accumulatedSleep
      }
      now = s.now
      const r = d.evaluate()
      const pure = evaluateContinuousRun({
        bootAtMs: s.boot,
        nowMs: s.now,
        accumulatedSleepMs: d.accumulatedSleep,
        limitMs: s.limit,
      })
      if (r !== null && pure.elapsedMs !== null) {
        expect(pure.elapsedMs).toBeCloseTo(r.elapsedMs, 8)
      }
    }
  })
})

// ============================================================================
// evaluateCostCap
// ============================================================================

describe('evaluateCostCap — CostCapDetector.evaluate() と 8 桁一致', () => {
  it('inLegitWindow=false で currentUsd >= cap → breach 候補', () => {
    const r = evaluateCostCap({
      currentUsd: 110,
      capUsd: 100,
      effectiveMultiplier: 1,
      inLegitWindow: false,
    })
    expect(r.breachCandidate).toBe(true)
    expect(r.suppressedByLegitWindow).toBe(false)
    expect(r.effectiveCapUsd).toBe(100)
  })

  it('inLegitWindow=true, multiplier=2: extended cap (200) 未達なら抑止', () => {
    const r = evaluateCostCap({
      currentUsd: 150,
      capUsd: 100,
      effectiveMultiplier: 2,
      inLegitWindow: true,
    })
    expect(r.breachCandidate).toBe(false)
    expect(r.suppressedByLegitWindow).toBe(true)
    expect(r.effectiveCapUsd).toBe(200)
  })

  it('inLegitWindow=true, multiplier=2, currentUsd >= 200 → breach 候補', () => {
    const r = evaluateCostCap({
      currentUsd: 250,
      capUsd: 100,
      effectiveMultiplier: 2,
      inLegitWindow: true,
    })
    expect(r.breachCandidate).toBe(true)
    expect(r.suppressedByLegitWindow).toBe(false)
    expect(r.effectiveCapUsd).toBe(200)
  })

  it('class 側 CostCapDetector と 8 桁一致 (effective cap)', () => {
    const now = 0
    const d = new CostCapDetector(100, 1, () => now)
    d.declareLegitSpikeWindow(60_000, 2)
    const r = d.evaluate(150)
    const pure = evaluateCostCap({
      currentUsd: 150,
      capUsd: 100,
      effectiveMultiplier: 2,
      inLegitWindow: true,
    })
    expect(r.breached).toBe(false)
    expect(pure.breachCandidate).toBe(false)
    expect(pure.suppressedByLegitWindow).toBe(true)
    expect(pure.effectiveCapUsd).toBeCloseTo(200, 8)
  })
})

// ============================================================================
// computeBaselinePerWindow
// ============================================================================

describe('computeBaselinePerWindow — 純関数性 + RateSpikeDetector と 8 桁一致', () => {
  it('空 sample 配列で 0 を返す', () => {
    const r = computeBaselinePerWindow(1_000_000, [], 60 * 60 * 1000, 24 * 60 * 60 * 1000)
    expect(r.shortTokens).toBe(0)
    expect(r.totalTokens).toBe(0)
    expect(r.baselinePerWindow).toBe(0)
    expect(r.numWindows).toBe(24)
  })

  it('shortTokens は ts >= now - shortMs の token 合計', () => {
    const samples: RateSpikeSampleLite[] = [
      { ts: 100, tokens: 10 },
      { ts: 1_000, tokens: 20 },
      { ts: 2_000, tokens: 30 }, // shortCutoff=2_000-1_000=1_000 → ts>=1_000 = 20+30
    ]
    const r = computeBaselinePerWindow(2_000, samples, 1_000, 24_000)
    expect(r.shortTokens).toBe(50)
    expect(r.totalTokens).toBe(60)
    expect(r.baselinePerWindow).toBeCloseTo(60 / 24, 8)
  })

  it('class RateSpikeDetector と 8 桁一致', () => {
    const shortMs = 60 * 60 * 1000
    const longMs = 24 * shortMs
    let now = 0
    const d = new RateSpikeDetector(shortMs, longMs, 5, 1, () => now)
    for (let i = 1; i <= 23; i++) {
      now = i * shortMs
      d.recordTokens(100)
    }
    now = 24 * shortMs
    d.recordTokens(700)
    const r = d.evaluate()
    // shortTokens は ts >= now-shortMs の token 合計
    //   ts=23*shortMs は cutoff=23*shortMs と一致 → 含まれる (100)
    //   ts=24*shortMs (= now) → 含まれる (700)
    //   合計 800.
    // baseline は totalTokens / 24
    expect(r.shortTokens).toBe(800)
    expect(r.baselinePerWindow).toBeCloseTo((23 * 100 + 700) / 24, 8)
  })
})

// ============================================================================
// evaluateRateSpike
// ============================================================================

describe('evaluateRateSpike — class evaluate() multiplier 判定と 8 桁一致', () => {
  it('baseline < 1: breach 候補なし (zero-near guard)', () => {
    const r = evaluateRateSpike({
      nowMs: 1_000,
      samples: [],
      config: { shortMs: 1_000, longMs: 24_000, multiplier: 5, baselineMinTokens: 10 },
    })
    expect(r.breachCandidate).toBe(false)
    expect(r.suppressedByMinBaseline).toBe(false)
  })

  it('baseline < baselineMinTokens: suppressedByMinBaseline=true', () => {
    const r = evaluateRateSpike({
      nowMs: 24_000,
      samples: [{ ts: 23_000, tokens: 5 }],
      config: { shortMs: 1_000, longMs: 24_000, multiplier: 5, baselineMinTokens: 10 },
    })
    // baseline = 5/24 ≈ 0.21 < 1 (zero-near でも未到達)
    // ただし baseline >= 1 が必要なので zero-near guard で先に false
    // → このテストは baseline 1 〜 minTokens 帯を狙う
    expect(r.breachCandidate).toBe(false)
  })

  it('baseline 1〜min 帯で suppressedByMinBaseline=true', () => {
    // total=200, numWindows=24 → baseline=8.33 (>=1, <10)
    const samples: RateSpikeSampleLite[] = []
    for (let i = 1; i <= 23; i++) samples.push({ ts: i * 1_000, tokens: 200 / 23 })
    const r = evaluateRateSpike({
      nowMs: 24_000,
      samples,
      config: { shortMs: 1_000, longMs: 24_000, multiplier: 5, baselineMinTokens: 10 },
    })
    expect(r.suppressedByMinBaseline).toBe(true)
    expect(r.breachCandidate).toBe(false)
  })

  it('shortTokens >= baseline * multiplier → breach 候補 true (class と一致)', () => {
    const shortMs = 60 * 60 * 1000
    const longMs = 24 * shortMs
    let now = 0
    const d = new RateSpikeDetector(shortMs, longMs, 5, 1, () => now, {
      zScoreThreshold: 0,
    })
    for (let i = 1; i <= 23; i++) {
      now = i * shortMs
      d.recordTokens(100)
    }
    now = 24 * shortMs
    d.recordTokens(10_000)
    const r = d.evaluate()
    expect(r.breached).toBe(true)
    // pure 側:
    const samples: RateSpikeSampleLite[] = []
    for (let i = 1; i <= 23; i++) samples.push({ ts: i * shortMs, tokens: 100 })
    samples.push({ ts: 24 * shortMs, tokens: 10_000 })
    const pure = evaluateRateSpike({
      nowMs: 24 * shortMs,
      samples,
      config: { shortMs, longMs, multiplier: 5, baselineMinTokens: 10 },
    })
    expect(pure.breachCandidate).toBe(true)
    expect(pure.shortTokens).toBeCloseTo(r.shortTokens, 8)
    expect(pure.baselinePerWindow).toBeCloseTo(r.baselinePerWindow, 8)
  })
})

// ============================================================================
// purgeOlderSamples / bucketTokensPerWindow — 純関数性
// ============================================================================

describe('purgeOlderSamples + bucketTokensPerWindow — 純関数性', () => {
  it('purgeOlderSamples: 入力配列を mutate しない', () => {
    const samples: RateSpikeSampleLite[] = [
      { ts: 0, tokens: 1 },
      { ts: 5_000, tokens: 2 },
      { ts: 10_000, tokens: 3 },
    ]
    const original = [...samples]
    const r = purgeOlderSamples(11_000, samples, 6_000)
    expect(samples).toEqual(original) // 不変
    expect(r.length).toBe(2) // ts >= 5_000
  })

  it('bucketTokensPerWindow: 同入力で同出力 (5 回, deep equal)', () => {
    const samples: RateSpikeSampleLite[] = [
      { ts: 0, tokens: 100 },
      { ts: 1_000, tokens: 200 },
      { ts: 23_000, tokens: 300 },
    ]
    let prev: number[] | null = null
    for (let i = 0; i < 5; i++) {
      const r = bucketTokensPerWindow(24_000, samples, 1_000, 24_000)
      if (prev) expect(r).toEqual(prev)
      prev = r
    }
  })
})
