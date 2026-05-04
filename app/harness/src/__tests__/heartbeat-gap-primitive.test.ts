/**
 * heartbeat-gap-primitive.test — Round 14 Dev-B / Task A (DEC-019-057).
 *
 * 目的:
 *   - HeartbeatGapTracker (stateful) と trackHeartbeatStateless (純関数) の
 *     数値挙動が 既存 ContinuousRunDetector.recordHeartbeat() と 8 桁一致することを verify。
 *   - state 管理の正確性 (markBoot / accumulatedSleep / bootAt 再同期) を確認。
 *   - skewPolicy / sleepGapMs DI が想定通り動作することを確認。
 *
 * +18 tests:
 *   - HeartbeatGapTracker basics: 6 tests
 *   - HeartbeatGapTracker state transitions: 5 tests
 *   - trackHeartbeatStateless 純関数性: 4 tests
 *   - 既存 ContinuousRunDetector との 8 桁一致 regression: 3 tests
 */
import { describe, it, expect } from 'vitest'
import {
  HeartbeatGapTracker,
  trackHeartbeatStateless,
} from '../heartbeat-gap-primitive.js'
import { ContinuousRunDetector } from '../tos-monitor.js'

// ============================================================================
// HeartbeatGapTracker basics
// ============================================================================

describe('HeartbeatGapTracker — basics', () => {
  it('constructor: now が無い場合 throw', () => {
    expect(() =>
      new HeartbeatGapTracker({ now: undefined as unknown as () => number }),
    ).toThrow(/now \(NowMs\) required/)
  })

  it('markBoot 前: hasBoot=false / accumulatedSleep=0 / lastHeartbeat=null', () => {
    const t = new HeartbeatGapTracker({ now: () => 1_000_000 })
    expect(t.hasBoot).toBe(false)
    expect(t.accumulatedSleep).toBe(0)
    expect(t.lastHeartbeat).toBeNull()
    expect(t.bootAt).toBeNull()
  })

  it('markBoot: bootAt / lastHeartbeat=t, accumulatedSleep=0', () => {
    let now = 1_000_000
    const t = new HeartbeatGapTracker({ now: () => now })
    t.markBoot()
    expect(t.hasBoot).toBe(true)
    expect(t.bootAt).toBe(1_000_000)
    expect(t.lastHeartbeat).toBe(1_000_000)
    expect(t.accumulatedSleep).toBe(0)
    // markBoot 再呼出で再同期
    now = 2_000_000
    t.markBoot()
    expect(t.bootAt).toBe(2_000_000)
    expect(t.lastHeartbeat).toBe(2_000_000)
  })

  it('first heartbeat: markBoot なしで recordHeartbeat → kind=first, gap=0', () => {
    const t = new HeartbeatGapTracker({ now: () => 1_000_000 })
    expect(t.recordHeartbeat()).toBe(0)
    expect(t.lastHeartbeat).toBe(1_000_000)
  })

  it('normal heartbeat: delta <= sleepGapMs で gap=0', () => {
    let now = 1_000_000
    const t = new HeartbeatGapTracker({ now: () => now })
    t.markBoot()
    now += 60_000 // 1min
    expect(t.recordHeartbeat()).toBe(0)
    expect(t.accumulatedSleep).toBe(0)
    expect(t.lastHeartbeat).toBe(1_060_000)
  })

  it('suspend heartbeat: delta > sleepGapMs で gap=sleepMs, accumulatedSleep += sleepMs', () => {
    let now = 1_000_000
    const t = new HeartbeatGapTracker({ now: () => now })
    t.markBoot()
    now += 6 * 60 * 1000 // 6min (default 5min を超過)
    const gap = t.recordHeartbeat()
    expect(gap).toBe(6 * 60 * 1000)
    expect(t.accumulatedSleep).toBe(6 * 60 * 1000)
  })
})

// ============================================================================
// HeartbeatGapTracker state transitions
// ============================================================================

describe('HeartbeatGapTracker — state transitions', () => {
  it('skew heartbeat: now < lastHeartbeat で gap=-1, bootAt 再同期 (reset_to_now default)', () => {
    let now = 1_000_000
    const t = new HeartbeatGapTracker({ now: () => now })
    t.markBoot()
    now = 999_500 // 500ms 巻き戻し
    const gap = t.recordHeartbeat()
    expect(gap).toBe(-1)
    expect(t.bootAt).toBe(999_500) // reset_to_now で再同期
    expect(t.lastHeartbeat).toBe(999_500)
  })

  it('skew policy: preserve で bootAt 不変', () => {
    let now = 1_000_000
    const t = new HeartbeatGapTracker({ now: () => now, skewPolicy: 'preserve' })
    t.markBoot()
    now = 999_500
    const gap = t.recordHeartbeat()
    expect(gap).toBe(-1)
    expect(t.bootAt).toBe(1_000_000) // preserve で不変
  })

  it('skew policy: shift_by_delta で bootAt -= backward', () => {
    let now = 1_000_000
    const t = new HeartbeatGapTracker({ now: () => now, skewPolicy: 'shift_by_delta' })
    t.markBoot()
    now = 999_500
    const gap = t.recordHeartbeat()
    expect(gap).toBe(-1)
    expect(t.bootAt).toBe(999_500) // 1_000_000 - 500
  })

  it('skew without markBoot: bootAt は null のまま (primitive 結果破棄)', () => {
    let now = 1_000_000
    const t = new HeartbeatGapTracker({ now: () => now })
    // markBoot 呼ばずにいきなり 2 回 heartbeat (1 回目で lastHeartbeat 設定)
    t.recordHeartbeat() // first
    now = 999_500
    const gap = t.recordHeartbeat() // skew
    expect(gap).toBe(-1)
    expect(t.bootAt).toBeNull()
  })

  it('reset: 全状態クリア', () => {
    let now = 1_000_000
    const t = new HeartbeatGapTracker({ now: () => now })
    t.markBoot()
    now += 6 * 60 * 1000
    t.recordHeartbeat() // suspend → accumulatedSleep > 0
    expect(t.accumulatedSleep).toBeGreaterThan(0)
    t.reset()
    expect(t.bootAt).toBeNull()
    expect(t.lastHeartbeat).toBeNull()
    expect(t.accumulatedSleep).toBe(0)
    expect(t.hasBoot).toBe(false)
  })
})

// ============================================================================
// recordHeartbeatDetailed — 構造化結果
// ============================================================================

describe('HeartbeatGapTracker — recordHeartbeatDetailed', () => {
  it('first / normal / suspend / skew の kind discriminator が一致', () => {
    let now = 1_000_000
    const t = new HeartbeatGapTracker({ now: () => now })
    expect(t.recordHeartbeatDetailed().kind).toBe('first')
    now += 60_000
    const r2 = t.recordHeartbeatDetailed()
    expect(r2.kind).toBe('normal')
    if (r2.kind === 'normal') expect(r2.deltaMs).toBe(60_000)
    now += 6 * 60 * 1000
    const r3 = t.recordHeartbeatDetailed()
    expect(r3.kind).toBe('suspend')
    if (r3.kind === 'suspend') expect(r3.sleepMs).toBe(6 * 60 * 1000)
    now -= 1_000
    const r4 = t.recordHeartbeatDetailed()
    expect(r4.kind).toBe('skew')
    if (r4.kind === 'skew') expect(r4.backwardMs).toBe(1_000)
  })
})

// ============================================================================
// trackHeartbeatStateless — 純関数性
// ============================================================================

describe('trackHeartbeatStateless — 純関数性', () => {
  it('first: lastHeartbeatMs=null で kind=first, gap=0', () => {
    const r = trackHeartbeatStateless({
      nowMs: 1_000_000,
      lastHeartbeatMs: null,
      bootAtMs: null,
    })
    expect(r.kind).toBe('first')
    expect(r.gap).toBe(0)
    expect(r.nextLastHeartbeatMs).toBe(1_000_000)
    expect(r.suspendDeltaMs).toBe(0)
  })

  it('副作用ゼロ — 同入力で同出力 (10 回)', () => {
    const input = {
      nowMs: 1_060_000,
      lastHeartbeatMs: 1_000_000,
      bootAtMs: 1_000_000,
    }
    const first = trackHeartbeatStateless(input)
    for (let i = 0; i < 10; i++) {
      const r = trackHeartbeatStateless(input)
      expect(r).toEqual(first)
    }
  })

  it('skew: nextBootAtMs が reset_to_now で更新', () => {
    const r = trackHeartbeatStateless({
      nowMs: 999_500,
      lastHeartbeatMs: 1_000_000,
      bootAtMs: 1_000_000,
    })
    expect(r.kind).toBe('skew')
    expect(r.gap).toBe(-1)
    expect(r.nextBootAtMs).toBe(999_500)
  })

  it('suspend: suspendDeltaMs に sleep gap', () => {
    const r = trackHeartbeatStateless({
      nowMs: 1_360_000, // 6min later
      lastHeartbeatMs: 1_000_000,
      bootAtMs: 1_000_000,
    })
    expect(r.kind).toBe('suspend')
    expect(r.gap).toBe(360_000)
    expect(r.suspendDeltaMs).toBe(360_000)
  })
})

// ============================================================================
// 既存 ContinuousRunDetector との 8 桁一致 regression
// ============================================================================

describe('HeartbeatGapTracker — 既存 ContinuousRunDetector と数値 8 桁一致', () => {
  it('normal sequence: gap=0 が両者一致', () => {
    let now = 1_000_000
    const ref = new ContinuousRunDetector(60 * 60 * 1000, 1, () => now)
    const tracker = new HeartbeatGapTracker({ now: () => now })
    ref.markBoot()
    tracker.markBoot()
    now += 60_000
    expect(ref.recordHeartbeat()).toBe(tracker.recordHeartbeat())
    now += 60_000
    expect(ref.recordHeartbeat()).toBe(tracker.recordHeartbeat())
    expect(ref.accumulatedSleep).toBe(tracker.accumulatedSleep)
  })

  it('suspend sequence: gap=sleepMs が両者一致 + accumulatedSleep 一致', () => {
    let now = 1_000_000
    const ref = new ContinuousRunDetector(60 * 60 * 1000, 1, () => now)
    const tracker = new HeartbeatGapTracker({ now: () => now })
    ref.markBoot()
    tracker.markBoot()
    now += 6 * 60 * 1000 // suspend
    const refGap = ref.recordHeartbeat()
    const trackerGap = tracker.recordHeartbeat()
    expect(trackerGap).toBeCloseTo(refGap, 8)
    expect(ref.accumulatedSleep).toBeCloseTo(tracker.accumulatedSleep, 8)
    now += 60_000 // normal
    expect(ref.recordHeartbeat()).toBe(tracker.recordHeartbeat())
    now += 7 * 60 * 1000 // suspend 2
    expect(ref.recordHeartbeat()).toBeCloseTo(tracker.recordHeartbeat(), 8)
    expect(ref.accumulatedSleep).toBeCloseTo(tracker.accumulatedSleep, 8)
  })

  it('skew sequence: gap=-1 + bootAt 再同期 (reset_to_now) が両者一致', () => {
    let now = 1_000_000
    const ref = new ContinuousRunDetector(60 * 60 * 1000, 1, () => now)
    const tracker = new HeartbeatGapTracker({ now: () => now, skewPolicy: 'reset_to_now' })
    ref.markBoot()
    tracker.markBoot()
    now = 999_500 // 500ms 巻き戻し
    expect(ref.recordHeartbeat()).toBe(-1)
    expect(tracker.recordHeartbeat()).toBe(-1)
    // bootAt が両者で 999_500 に再同期
    expect(tracker.bootAt).toBe(999_500)
    // ref.evaluate() で elapsed=0 (boot 再同期後)
    const r = ref.evaluate()
    expect(r?.elapsedMs).toBeCloseTo(0, 8)
  })
})
