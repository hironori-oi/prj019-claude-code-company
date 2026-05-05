/**
 * monotonic-clock tests (Round 21 W4, Dev-HH 担当)
 *
 * 4 groups / 9 tests:
 *
 * Group 1 (mark/elapsed correctness, 2 tests):
 *   M-1  正常系: wall + mono が同じ rate で進む → skewDetected=false / 両 elapsed 一致
 *   M-2  markNow → elapsedMs → 経過が累積されていく (異なる時点で elapsed 計算)
 *
 * Group 2 (dual-source consistency, 2 tests):
 *   D-1  wall slightly ahead (1s) → skew=+1000, threshold=5000 で skewDetected=false
 *   D-2  wall slightly behind (-1s) → skew=-1000, threshold=5000 で skewDetected=false
 *
 * Group 3 (system clock skew detection, 3 tests):
 *   S-1  NTP forward step (wall +30s, mono +1s) → skewDetected=true, skewMs > 0 が大
 *   S-2  NTP backward step (wall -10s, mono +1s) → skewDetected=true, skewMs < 0
 *   S-3  DST 1h jump (wall +3_600_000ms, mono +500ms) → skewDetected=true / 閾値遥か超え
 *
 * Group 4 (fail-closed extreme skew + detectSkew shortcut + custom threshold, 2 tests):
 *   F-1  detectSkew shortcut で skew だけ判定可能 (markNow + elapsedMs と整合)
 *   F-2  custom skewThresholdMs (100ms) で 200ms skew が検出される (default 5000 では検出されない)
 */
import { describe, it, expect } from 'vitest'

import {
  createMonotonicClock,
  DEFAULT_SKEW_THRESHOLD_MS,
  type ClockMark,
} from '../monotonic-clock.js'

// ---------------------------------------------------------------------------
// Helper: 配列 / シーケンス based の time mock
// ---------------------------------------------------------------------------

/**
 * 呼ばれるたびに次の値を返す mock。test 内で「mark 時点 / elapsed 時点」の
 * 2 系統 ms を deterministic に制御するために使う。
 */
function makeSeqClock(values: readonly number[]): () => number {
  let i = 0
  return () => {
    const v = values[i] ?? values[values.length - 1] ?? 0
    i = Math.min(i + 1, values.length)
    return v
  }
}

// ---------------------------------------------------------------------------
// Group 1 — mark/elapsed correctness (2 tests)
// ---------------------------------------------------------------------------

describe('monotonic-clock group 1 — mark/elapsed correctness', () => {
  it('M-1: 正常系 wall + mono が同 rate で進む → skewDetected=false / 両 elapsed 一致', () => {
    // markNow: wall=1000, mono=10  /  elapsedMs: wall=2500, mono=1510
    // → elapsed: wall=1500, mono=1500, skew=0
    const clock = createMonotonicClock({
      wallNowMs: makeSeqClock([1000, 2500]),
      monoNowMs: makeSeqClock([10, 1510]),
    })
    const start = clock.markNow()
    expect(start.wallMs).toBe(1000)
    expect(start.monoMs).toBe(10)
    const elapsed = clock.elapsedMs(start)
    expect(elapsed.wallElapsedMs).toBe(1500)
    expect(elapsed.monoElapsedMs).toBe(1500)
    expect(elapsed.skewMs).toBe(0)
    expect(elapsed.skewDetected).toBe(false)
  })

  it('M-2: markNow → elapsedMs を 2 度呼ぶと累積経過が観測できる', () => {
    // wall: 1000 (mark) / 2000 (1st elapsed) / 5000 (2nd elapsed)
    // mono:   10 (mark) /   1010           /  4010
    const clock = createMonotonicClock({
      wallNowMs: makeSeqClock([1000, 2000, 5000]),
      monoNowMs: makeSeqClock([10, 1010, 4010]),
    })
    const start = clock.markNow()
    const r1 = clock.elapsedMs(start)
    const r2 = clock.elapsedMs(start)
    expect(r1.wallElapsedMs).toBe(1000)
    expect(r1.monoElapsedMs).toBe(1000)
    expect(r2.wallElapsedMs).toBe(4000)
    expect(r2.monoElapsedMs).toBe(4000)
    expect(r1.skewDetected).toBe(false)
    expect(r2.skewDetected).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Group 2 — dual-source consistency (2 tests)
// ---------------------------------------------------------------------------

describe('monotonic-clock group 2 — dual-source consistency within threshold', () => {
  it('D-1: wall slightly ahead (+1s) → skew=+1000, default threshold 5000 で正常範囲', () => {
    const clock = createMonotonicClock({
      wallNowMs: makeSeqClock([0, 11_000]),
      monoNowMs: makeSeqClock([0, 10_000]),
    })
    const start = clock.markNow()
    const r = clock.elapsedMs(start)
    expect(r.wallElapsedMs).toBe(11_000)
    expect(r.monoElapsedMs).toBe(10_000)
    expect(r.skewMs).toBe(1_000)
    expect(r.skewDetected).toBe(false)
  })

  it('D-2: wall slightly behind (-1s) → skew=-1000, default threshold 5000 で正常範囲', () => {
    const clock = createMonotonicClock({
      wallNowMs: makeSeqClock([0, 9_000]),
      monoNowMs: makeSeqClock([0, 10_000]),
    })
    const start = clock.markNow()
    const r = clock.elapsedMs(start)
    expect(r.wallElapsedMs).toBe(9_000)
    expect(r.monoElapsedMs).toBe(10_000)
    expect(r.skewMs).toBe(-1_000)
    expect(r.skewDetected).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Group 3 — system clock skew detection (3 tests)
// ---------------------------------------------------------------------------

describe('monotonic-clock group 3 — system clock skew detection', () => {
  it('S-1: NTP forward step (wall +30s, mono +1s) → skewDetected=true / skewMs 大きく正', () => {
    // mark: wall=1_700_000_000_000, mono=100
    // step: wall=1_700_000_031_000 (30s 後), mono=1_100 (1s 後)
    // elapsed: wall=31_000, mono=1_000, skew=30_000 > threshold 5_000
    const clock = createMonotonicClock({
      wallNowMs: makeSeqClock([1_700_000_000_000, 1_700_000_031_000]),
      monoNowMs: makeSeqClock([100, 1_100]),
    })
    const start = clock.markNow()
    const r = clock.elapsedMs(start)
    expect(r.skewMs).toBe(30_000)
    expect(r.skewDetected).toBe(true)
  })

  it('S-2: NTP backward step (wall -10s, mono +1s) → skewDetected=true / skewMs 負', () => {
    // wall は巻き戻り (1_700_000_001_000 - 10_000 = 1_699_999_991_000)
    // mono は単調増加 (1100)
    // elapsed: wall=-9_000, mono=1_000, skew=-10_000 / |skew|=10_000 > threshold
    const clock = createMonotonicClock({
      wallNowMs: makeSeqClock([1_700_000_000_000, 1_699_999_991_000]),
      monoNowMs: makeSeqClock([100, 1_100]),
    })
    const start = clock.markNow()
    const r = clock.elapsedMs(start)
    expect(r.wallElapsedMs).toBe(-9_000)
    expect(r.monoElapsedMs).toBe(1_000)
    expect(r.skewMs).toBe(-10_000)
    expect(r.skewDetected).toBe(true)
  })

  it('S-3: DST 1h jump (wall +3_600_000ms, mono +500ms) → skewDetected=true / 閾値遥か超え', () => {
    const clock = createMonotonicClock({
      wallNowMs: makeSeqClock([0, 3_600_000]),
      monoNowMs: makeSeqClock([0, 500]),
    })
    const start = clock.markNow()
    const r = clock.elapsedMs(start)
    expect(r.skewMs).toBe(3_599_500)
    expect(r.skewDetected).toBe(true)
    expect(Math.abs(r.skewMs)).toBeGreaterThan(DEFAULT_SKEW_THRESHOLD_MS)
  })
})

// ---------------------------------------------------------------------------
// Group 4 — detectSkew shortcut + custom threshold (2 tests)
// ---------------------------------------------------------------------------

describe('monotonic-clock group 4 — detectSkew shortcut + custom threshold', () => {
  it('F-1: detectSkew(start) は markNow+elapsedMs と整合した bool を返す', () => {
    // 正常 (skew 0) → false
    const clockOk = createMonotonicClock({
      wallNowMs: makeSeqClock([0, 1_000]),
      monoNowMs: makeSeqClock([0, 1_000]),
    })
    const startOk: ClockMark = clockOk.markNow()
    expect(clockOk.detectSkew(startOk)).toBe(false)

    // 異常 (skew 30s) → true
    const clockSkew = createMonotonicClock({
      wallNowMs: makeSeqClock([0, 31_000]),
      monoNowMs: makeSeqClock([0, 1_000]),
    })
    const startSkew = clockSkew.markNow()
    expect(clockSkew.detectSkew(startSkew)).toBe(true)
  })

  it('F-2: custom skewThresholdMs (100ms) で 200ms skew が検出される (default 5000 では非検出)', () => {
    // skew = wall=1200 - mono=1000 = +200ms
    // default threshold 5000 → 検出されない
    const clockDefault = createMonotonicClock({
      wallNowMs: makeSeqClock([0, 1_200]),
      monoNowMs: makeSeqClock([0, 1_000]),
    })
    const sd = clockDefault.markNow()
    expect(clockDefault.elapsedMs(sd).skewDetected).toBe(false)
    expect(clockDefault.skewThresholdMs).toBe(DEFAULT_SKEW_THRESHOLD_MS)

    // custom 100ms threshold → 200ms skew は検出される
    const clockCustom = createMonotonicClock({
      wallNowMs: makeSeqClock([0, 1_200]),
      monoNowMs: makeSeqClock([0, 1_000]),
      skewThresholdMs: 100,
    })
    const sc = clockCustom.markNow()
    const r = clockCustom.elapsedMs(sc)
    expect(r.skewMs).toBe(200)
    expect(r.skewDetected).toBe(true)
    expect(clockCustom.skewThresholdMs).toBe(100)
  })
})
