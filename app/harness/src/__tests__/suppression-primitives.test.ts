/**
 * suppression-primitives.test — Round 11 Dev-B (DEC-019-057).
 *
 * 4 primitive × DoD 12+ tests:
 *   - heartbeatGapDetector  : 4 tests (first / normal / suspend / skew)
 *   - LegitWindowGuard      : 4 tests (declare / expiry / multiplier / reset)
 *   - zScoreFilter          : 5 tests (suppress / pass-through / 不足サンプル / threshold=0 / 全 0 std-dev)
 *   - clockSkewBoot         : 3 tests (no-skew / reset_to_now / preserve / shift_by_delta)
 *
 * 既存 tos-monitor.ts の RateSpikeDetector / CostCapDetector / ContinuousRunDetector
 * の挙動と数値的に一致することを別途 regression 確認する (3 tests).
 */
import { describe, it, expect } from 'vitest'
import {
  LegitWindowGuard,
  clockSkewBoot,
  heartbeatGapDetector,
  zScoreFilter,
} from '../suppression-primitives.js'

// ============================================================================
// heartbeatGapDetector
// ============================================================================

describe('heartbeatGapDetector', () => {
  it('first heartbeat: lastMs=null で kind=first を返す', () => {
    const r = heartbeatGapDetector(1_000_000, null)
    expect(r.kind).toBe('first')
    expect(r.tMs).toBe(1_000_000)
  })

  it('normal: delta <= sleepGapMs (default 5min) は kind=normal', () => {
    const r = heartbeatGapDetector(1_000_000 + 60_000, 1_000_000)
    expect(r.kind).toBe('normal')
    if (r.kind === 'normal') {
      expect(r.deltaMs).toBe(60_000)
    }
  })

  it('suspend: delta > sleepGapMs (default 5min) で kind=suspend, sleepMs に gap', () => {
    const lastMs = 1_000_000
    const now = lastMs + 6 * 60 * 1000 // 6min sleep
    const r = heartbeatGapDetector(now, lastMs)
    expect(r.kind).toBe('suspend')
    if (r.kind === 'suspend') {
      expect(r.sleepMs).toBe(6 * 60 * 1000)
    }
  })

  it('skew: now < lastMs (clock backward) で kind=skew, backwardMs 正値', () => {
    const lastMs = 1_000_000
    const now = lastMs - 1_000
    const r = heartbeatGapDetector(now, lastMs)
    expect(r.kind).toBe('skew')
    if (r.kind === 'skew') {
      expect(r.backwardMs).toBe(1_000)
    }
  })

  it('カスタム sleepGapMs: 1min 設定で 90s gap を suspend 判定', () => {
    const r = heartbeatGapDetector(1_000_000 + 90_000, 1_000_000, 60_000)
    expect(r.kind).toBe('suspend')
  })
})

// ============================================================================
// LegitWindowGuard
// ============================================================================

describe('LegitWindowGuard', () => {
  it('declare → 期間内は active=true, multiplier 反映', () => {
    const now = 1_000_000
    const g = new LegitWindowGuard(() => now)
    g.declare(60_000, 2)
    expect(g.isActive()).toBe(true)
    expect(g.state().active).toBe(true)
    expect(g.state().multiplier).toBe(2)
    expect(g.effectiveCap(100)).toBe(200)
  })

  it('expiry: 期間超過で active=false, effectiveCap は base に戻る', () => {
    let now = 1_000_000
    const g = new LegitWindowGuard(() => now)
    g.declare(60_000, 3)
    now += 60_001
    expect(g.isActive()).toBe(false)
    expect(g.effectiveCap(100)).toBe(100)
    expect(g.state().multiplier).toBe(1)
  })

  it('invalid input: durationMs<=0 / multiplier<1 は no-op', () => {
    const g = new LegitWindowGuard(() => 0)
    g.declare(0)
    expect(g.isActive()).toBe(false)
    g.declare(-10, 5)
    expect(g.isActive()).toBe(false)
    g.declare(10_000, 0.5)
    expect(g.isActive()).toBe(false)
    g.declare(10_000, Number.NaN)
    expect(g.isActive()).toBe(false)
    expect(g.declarations).toBe(0)
  })

  it('reset: 全状態クリア', () => {
    const now = 0
    const g = new LegitWindowGuard(() => now)
    g.declare(60_000, 2)
    g.reset()
    expect(g.isActive()).toBe(false)
    expect(g.declarations).toBe(0)
    expect(g.state().expiresAtMs).toBeNull()
  })

  it('上書き: 立て続けの declare は最新で上書き (max 採用しない)', () => {
    let now = 0
    const g = new LegitWindowGuard(() => now)
    g.declare(100_000, 5) // 大きい multi
    g.declare(10_000, 2) // 小さい multi で上書き
    expect(g.effectiveCap(100)).toBe(200)
    now = 11_000 // 10s 経過 → expired
    expect(g.isActive()).toBe(false)
  })
})

// ============================================================================
// zScoreFilter
// ============================================================================

describe('zScoreFilter', () => {
  it('suppress: current が mean+2σ 以下なら suppress=true', () => {
    // past = [10, 10, 10, 10]: mean=10, std=0 → threshold=10
    // current=10 で suppress (= 統計的 noise 範囲内).
    // ただし std=0 では threshold=mean なので current<=mean で suppress.
    const r = zScoreFilter([10, 10, 10, 10, 10], 2)
    expect(r.mean).toBe(10)
    expect(r.stdDev).toBe(0)
    expect(r.threshold).toBe(10)
    expect(r.suppress).toBe(true)
  })

  it('pass-through: current が mean+2σ 超なら suppress=false', () => {
    // past = [10, 10, 10, 10] mean=10 std=0
    // current=20 > threshold(10) → 通す
    const r = zScoreFilter([20, 10, 10, 10, 10], 2)
    expect(r.suppress).toBe(false)
    expect(r.threshold).toBe(10)
  })

  it('past 不足: past.length < 2 で suppress=false (フィルタ無効化)', () => {
    expect(zScoreFilter([100], 2).suppress).toBe(false)
    expect(zScoreFilter([100, 50], 2).suppress).toBe(false) // past 1 件
  })

  it('zThreshold=0 で filter 無効化', () => {
    const r = zScoreFilter([10, 10, 10, 10], 0)
    expect(r.suppress).toBe(false)
  })

  it('正規分布的 past + spike: suppress 判定が直観整合 (mean=100, std≈14, current=200 → 通す)', () => {
    const past = [80, 90, 100, 110, 120]
    const buckets = [200, ...past]
    const r = zScoreFilter(buckets, 2)
    expect(r.mean).toBeCloseTo(100, 5)
    // std ≈ 14.14 → threshold ≈ 128 → current 200 > threshold で通す
    expect(r.threshold).toBeGreaterThan(120)
    expect(r.threshold).toBeLessThan(140)
    expect(r.suppress).toBe(false)
  })
})

// ============================================================================
// clockSkewBoot
// ============================================================================

describe('clockSkewBoot', () => {
  it('skew なし (lastSeenMs <= now): bootAt 不変', () => {
    const r = clockSkewBoot(1_000_000, 999_000, 800_000, 'reset_to_now')
    expect(r.bootAtMs).toBe(800_000)
    expect(r.backwardMs).toBe(0)
  })

  it('reset_to_now: skew 検出時 bootAt を now に再同期', () => {
    const now = 999_000
    const lastSeen = 1_000_000
    const r = clockSkewBoot(now, lastSeen, 800_000, 'reset_to_now')
    expect(r.bootAtMs).toBe(now)
    expect(r.backwardMs).toBe(1_000)
  })

  it('preserve: skew 検出でも bootAt 不変', () => {
    const r = clockSkewBoot(999_000, 1_000_000, 800_000, 'preserve')
    expect(r.bootAtMs).toBe(800_000)
    expect(r.backwardMs).toBe(1_000)
  })

  it('shift_by_delta: bootAt から backward 引く', () => {
    const r = clockSkewBoot(999_000, 1_000_000, 800_000, 'shift_by_delta')
    expect(r.bootAtMs).toBe(800_000 - 1_000)
    expect(r.backwardMs).toBe(1_000)
  })
})

// ============================================================================
// regression — tos-monitor 既存 detector との数値的一致 (PRJ-019 既存無改変確認)
// ============================================================================

describe('regression — 既存 tos-monitor 抑止計算との整合', () => {
  it('zScoreFilter は既存 RateSpikeDetector の z-score 計算と同じ式', () => {
    // 既存 RateSpikeDetector.evaluate() 内 z-score:
    //   mean = past.reduce((a, b) => a + b, 0) / past.length
    //   variance = past.reduce((a, b) => a + (b - mean) ** 2, 0) / past.length
    //   stdDev = Math.sqrt(variance)
    //   threshold = mean + zThreshold * stdDev
    const past = [50, 60, 70, 80, 90]
    const mean = past.reduce((a, b) => a + b, 0) / past.length
    const variance = past.reduce((a, b) => a + (b - mean) ** 2, 0) / past.length
    const stdDev = Math.sqrt(variance)
    const threshold = mean + 2 * stdDev

    const r = zScoreFilter([55, ...past], 2)
    expect(r.mean).toBeCloseTo(mean, 8)
    expect(r.stdDev).toBeCloseTo(stdDev, 8)
    expect(r.threshold).toBeCloseTo(threshold, 8)
  })

  it('LegitWindowGuard.effectiveCap は既存 CostCapDetector の effectiveCap 計算と同じ', () => {
    let now = 1_000_000
    const g = new LegitWindowGuard(() => now)
    g.declare(60_000, 2)
    // CostCapDetector の式: inWindow ? capUsd * multiplier : capUsd
    expect(g.effectiveCap(30)).toBe(60)
    expect(g.effectiveCap(100)).toBe(200)
    now += 60_001
    expect(g.effectiveCap(30)).toBe(30)
  })

  it('heartbeatGapDetector の suspend 閾値 5min は既存 ContinuousRunDetector default と一致', () => {
    // 既存 ContinuousRunDetector default sleepGapMs = 5 * 60 * 1000
    const r = heartbeatGapDetector(0 + 5 * 60 * 1000 + 1, 0)
    expect(r.kind).toBe('suspend')
    const r2 = heartbeatGapDetector(0 + 5 * 60 * 1000, 0)
    expect(r2.kind).toBe('normal') // 境界 (== sleepGapMs) は normal
  })
})
