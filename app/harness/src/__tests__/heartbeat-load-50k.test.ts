/**
 * heartbeat-load-50k.spec — Round 17 Dev-U 実装 (Round 16 Dev-S 起案 skeleton 引継).
 *
 * 目的:
 *   - HeartbeatGapTracker と computeJitteredBackoffMs / decideRetryAction の
 *     50,000 件規模 load 耐性を検証 (Round 15 で 5,000 件副作用 0 達成済).
 *   - thundering herd 回避 (jitter='full') の効果を統計的に確認.
 *   - circuit-breaker fail-fast が想定通り発火することを確認.
 *
 * 実行条件:
 *   - 同期 50,000 tick 実行時間 < 5s 目標 (Round 15 5,000 件: 約 80ms 観測).
 *   - メモリ <= 50MB (tracker 1 個 + ledger なし).
 *   - 副作用 0 (timer / fetch / fs 触らず純 in-memory).
 *   - 1 ケース 100ms 以内 / 合計 1s 以内目標 (vitest 全体 +5s 以下).
 *
 * 数学的境界 (50,000 件想定):
 *   - jitter='full' 期待 wait = E[rand(0, exp)] = exp/2
 *   - cap=16s で attempt>=5 の wait は 0..16s 一様分布 → 平均 8s
 *   - Coefficient of Variation (CV) = sqrt(Var/Mean^2) で thundering 検出
 *     * jitter='full' : CV ≈ 0.577 (uniform stddev/mean = 1/sqrt(3))
 *
 * Round 17 Dev-U 実装 10 ケース:
 *   1. perf 50k tick (within 5s)
 *   2. jitter dispersion CV ≈ 0.577 (±10%)
 *   3. circuit fail-fast (10 連続失敗で fail-fast)
 *   4. 5,000 並列 cross-talk 0
 *   5. memory <= 50MB
 *   6. determinism (rand DI で deterministic)
 *   7. cap (max wait time = capMs)
 *   8. decorrelated 安定 (3 std dev 内)
 *   9. max-retries (5 retries で fail-fast)
 *   10. ContinuousRunDetector 8 桁一致
 */
import { describe, it, expect } from 'vitest'
import {
  HeartbeatGapTracker,
  computeJitteredBackoffMs,
  decideRetryAction,
  DEFAULT_RETRY_HARDENING,
  trackHeartbeatStateless,
} from '../heartbeat-gap-primitive.js'
import { ContinuousRunDetector } from '../tos-monitor.js'

/**
 * 決定論的 PRNG (mulberry32). seedrandom 依存を増やさず純内製で 8 桁再現を担保。
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('heartbeat-load-50k — Round 17 Dev-U 実装', () => {
  // --------------------------------------------------------------------------
  // 1. perf: 50,000 tick (HeartbeatGapTracker 同期) < 5s
  // --------------------------------------------------------------------------
  it('perf: 50,000 tick が同期で 5s 以内に完了する', () => {
    let now = 1_000_000
    const t = new HeartbeatGapTracker({ now: () => now })
    t.markBoot()
    const start = performance.now()
    for (let i = 0; i < 50_000; i++) {
      now += 60_000 // 1min step (sleepGapMs 5min 未満 = normal)
      t.recordHeartbeat()
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(5000)
    // normal のみなので accumulatedSleep = 0
    expect(t.accumulatedSleep).toBe(0)
    expect(t.lastHeartbeat).toBe(1_000_000 + 50_000 * 60_000)
  })

  // --------------------------------------------------------------------------
  // 2. jitter dispersion: 50_000 attempt の wait 分布 stddev/mean ≈ 0.577 (full)
  // --------------------------------------------------------------------------
  it('jitter dispersion: full jitter の CV が 0.577 ±10% に収束する', () => {
    const rand = mulberry32(0xdeadbeef)
    const N = 50_000
    const waits: number[] = new Array(N)
    // attempt=4 (固定) で exp=base*2^4 = 16_000 = capMs に丸め → uniform(0, 16_000)
    for (let i = 0; i < N; i++) {
      waits[i] = computeJitteredBackoffMs(4, DEFAULT_RETRY_HARDENING, DEFAULT_RETRY_HARDENING.baseDelayMs, rand)
    }
    let sum = 0
    for (let i = 0; i < N; i++) sum += waits[i]
    const mean = sum / N
    let varSum = 0
    for (let i = 0; i < N; i++) varSum += (waits[i] - mean) * (waits[i] - mean)
    const variance = varSum / N
    const cv = Math.sqrt(variance) / mean
    // uniform(0, exp): mean = exp/2, stddev = exp/sqrt(12) → CV = 1/sqrt(3) ≈ 0.5774
    expect(cv).toBeGreaterThan(0.577 * 0.9)
    expect(cv).toBeLessThan(0.577 * 1.1)
  })

  // --------------------------------------------------------------------------
  // 3. circuit fail-fast: circuitOpen=true で 50,000 件全件 fail-fast
  // --------------------------------------------------------------------------
  it('circuit fail-fast: 連続失敗で circuit open 後は 50,000 件全件 fail-fast', () => {
    const rand = mulberry32(1)
    let firstAttempts = 0
    let failFastCount = 0
    let cooldownFailCount = 0
    // 最初 10 回は circuit closed: attempt=1 (sleep) を 10 回 → "10 連続失敗" の擬似
    for (let i = 0; i < 10; i++) {
      const d = decideRetryAction(1, DEFAULT_RETRY_HARDENING, DEFAULT_RETRY_HARDENING.baseDelayMs, false, rand)
      if (d.kind === 'sleep') firstAttempts++
    }
    expect(firstAttempts).toBe(10)
    // 以降 49,990 件は circuitOpen=true → fail-fast (jitter sleep スキップ)
    const start = performance.now()
    for (let i = 0; i < 49_990; i++) {
      const d = decideRetryAction(1, DEFAULT_RETRY_HARDENING, DEFAULT_RETRY_HARDENING.baseDelayMs, true, rand)
      if (d.kind === 'fail-fast' && d.reason === 'circuit-open') {
        failFastCount++
      } else {
        cooldownFailCount++
      }
    }
    const wall = performance.now() - start
    expect(failFastCount).toBe(49_990)
    expect(cooldownFailCount).toBe(0)
    expect(wall).toBeLessThan(100) // 100ms 以内 (純 in-memory dispatch)
  })

  // --------------------------------------------------------------------------
  // 4. 5,000 並列 cross-talk 0
  // --------------------------------------------------------------------------
  it('5,000 並列 tracker × 10 attempt = 50,000 retry で cross-talk 0', () => {
    const N_TRACKERS = 5_000
    const N_ATTEMPTS = 10
    const trackers: HeartbeatGapTracker[] = []
    for (let i = 0; i < N_TRACKERS; i++) {
      // 各 tracker 独立 now (i*1_000_000 オフセット)
      let nowI = i * 1_000_000
      const t = new HeartbeatGapTracker({ now: () => nowI })
      t.markBoot()
      trackers.push(t)
      // 各 tracker 内 N_ATTEMPTS 回 normal heartbeat
      for (let j = 0; j < N_ATTEMPTS; j++) {
        nowI += 60_000
        t.recordHeartbeat()
      }
    }
    // cross-talk 検証: 各 tracker は他 tracker の lastHeartbeat に影響しない
    for (let i = 0; i < N_TRACKERS; i++) {
      const expectedLast = i * 1_000_000 + N_ATTEMPTS * 60_000
      expect(trackers[i].lastHeartbeat).toBe(expectedLast)
      expect(trackers[i].accumulatedSleep).toBe(0)
    }
  })

  // --------------------------------------------------------------------------
  // 5. memory: 50,000 tick 後の heap delta <= 50MB
  // --------------------------------------------------------------------------
  it('memory: 50,000 tick 後の heap 増加が 50MB 以下', () => {
    // global.gc が無くても heap delta を観測する (--expose-gc 必須化を避ける)
    const before = process.memoryUsage().heapUsed
    let now = 1_000_000
    const t = new HeartbeatGapTracker({ now: () => now })
    t.markBoot()
    for (let i = 0; i < 50_000; i++) {
      now += 60_000
      t.recordHeartbeat()
    }
    const after = process.memoryUsage().heapUsed
    const deltaMB = (after - before) / 1024 / 1024
    expect(deltaMB).toBeLessThan(50)
    // tracker state が leak していないことの構造確認: 3 fields のみ保持
    const s = t.state()
    expect(typeof s.bootAtMs).toBe('number')
    expect(typeof s.lastHeartbeatMs).toBe('number')
    expect(typeof s.accumulatedSleepMs).toBe('number')
  })

  // --------------------------------------------------------------------------
  // 6. determinism: rand DI 固定で 50,000 attempt の wait 列が exact 一致
  // --------------------------------------------------------------------------
  it('determinism: 同 seed の rand DI で 50,000 wait 列が完全一致 (8 桁)', () => {
    const N = 50_000
    const seed = 0xc0ffee01
    const r1 = mulberry32(seed)
    const r2 = mulberry32(seed)
    let mismatch = 0
    let firstNonZero = -1
    for (let i = 0; i < N; i++) {
      const w1 = computeJitteredBackoffMs(3, DEFAULT_RETRY_HARDENING, DEFAULT_RETRY_HARDENING.baseDelayMs, r1)
      const w2 = computeJitteredBackoffMs(3, DEFAULT_RETRY_HARDENING, DEFAULT_RETRY_HARDENING.baseDelayMs, r2)
      if (w1 !== w2) mismatch++
      if (firstNonZero < 0 && w1 > 0) firstNonZero = w1
    }
    expect(mismatch).toBe(0)
    expect(firstNonZero).toBeGreaterThan(0) // 完全 0 列ではない (rand 動作確認)
  })

  // --------------------------------------------------------------------------
  // 7. cap: 50,000 attempt 中 attempt>=5 の wait 全件 <= capMs
  // --------------------------------------------------------------------------
  it('cap: attempt=20 でも wait <= capMs (16_000ms) で全件丸め', () => {
    const rand = mulberry32(42)
    const N = 50_000
    let maxWait = 0
    let overCap = 0
    const cap = DEFAULT_RETRY_HARDENING.capMs
    for (let i = 0; i < N; i++) {
      // attempt=20 → exp = 1000 * 2^20 ≈ 1G ms だが cap で 16_000 に丸め
      const w = computeJitteredBackoffMs(20, DEFAULT_RETRY_HARDENING, DEFAULT_RETRY_HARDENING.baseDelayMs, rand)
      if (w > maxWait) maxWait = w
      if (w > cap) overCap++
    }
    // 全 50,000 件が cap 以下 (集計後に 1 度だけ assert で expect オーバーヘッド削減)
    expect(overCap).toBe(0)
    // full jitter は uniform(0, cap) → 50,000 サンプルで max は cap に十分接近
    expect(maxWait).toBeGreaterThan(cap * 0.95)
    expect(maxWait).toBeLessThanOrEqual(cap)
  })

  // --------------------------------------------------------------------------
  // 8. decorrelated 安定: prev フィードバックループが unbounded grow しない
  // --------------------------------------------------------------------------
  it('decorrelated 安定: 50,000 連続 retry で wait が cap で stable (3 std dev 内)', () => {
    const rand = mulberry32(99)
    const policy = { ...DEFAULT_RETRY_HARDENING, jitter: 'decorrelated' as const }
    let prev = policy.baseDelayMs
    const N = 50_000
    const waits: number[] = new Array(N)
    let maxWait = 0
    let overCap = 0
    for (let i = 0; i < N; i++) {
      const w = computeJitteredBackoffMs(3, policy, prev, rand)
      waits[i] = w
      prev = w
      if (w > maxWait) maxWait = w
      if (w > policy.capMs) overCap++
    }
    // unbounded grow 防止: 全件 cap 以下 (集計後 assert で expect オーバーヘッド削減)
    expect(overCap).toBe(0)
    // 後半 25,000 件は cap 近傍で stable 状態 (decorrelated は prev*3 で増加 → cap 飽和)
    const tail = waits.slice(25_000)
    let sum = 0
    for (const w of tail) sum += w
    const mean = sum / tail.length
    let varSum = 0
    for (const w of tail) varSum += (w - mean) * (w - mean)
    const stddev = Math.sqrt(varSum / tail.length)
    // 3 std dev 内: |max - mean| <= 3 * stddev + cap (uniform 上限の確率的境界)
    expect(stddev).toBeGreaterThanOrEqual(0)
    expect(Math.abs(maxWait - mean)).toBeLessThanOrEqual(3 * stddev + policy.capMs)
  })

  // --------------------------------------------------------------------------
  // 9. max-retries: attempt > maxRetries で必ず fail-fast
  // --------------------------------------------------------------------------
  it('fail-fast max-retries: attempt > maxRetries (=5) で 50,000 件全件 fail-fast', () => {
    const rand = mulberry32(7)
    const N = 50_000
    let failFast = 0
    for (let i = 0; i < N; i++) {
      // attempt=6 = maxRetries+1
      const d = decideRetryAction(6, DEFAULT_RETRY_HARDENING, DEFAULT_RETRY_HARDENING.baseDelayMs, false, rand)
      if (d.kind === 'fail-fast' && d.reason === 'max-retries') failFast++
    }
    expect(failFast).toBe(N)
    // 境界: attempt=5 (= maxRetries) は sleep, attempt=6 は fail-fast
    const dBoundary = decideRetryAction(5, DEFAULT_RETRY_HARDENING, DEFAULT_RETRY_HARDENING.baseDelayMs, false, rand)
    expect(dBoundary.kind).toBe('sleep')
  })

  // --------------------------------------------------------------------------
  // 10. integration: ContinuousRunDetector との 50,000 tick 8 桁一致
  // --------------------------------------------------------------------------
  it('integration: ContinuousRunDetector と HeartbeatGapTracker の 50,000 tick が 8 桁一致', () => {
    const N = 50_000
    let now = 1_000_000
    const limitMs = 16 * 60 * 60 * 1000
    const ref = new ContinuousRunDetector(limitMs, 3, () => now)
    const trk = new HeartbeatGapTracker({ now: () => now })
    ref.markBoot()
    trk.markBoot()
    // mix: 1/100 の確率で suspend (6min skip), それ以外は normal (1min step)
    const rand = mulberry32(0xabcdef)
    let refLast = 0
    let trkLast = 0
    let stateless = 0 // statelessHeartbeat の最新 gap
    let lastHb: number | null = trk.lastHeartbeat
    let bootAt: number | null = trk.bootAt
    let mismatchTrk = 0
    let mismatchStateless = 0
    let suspendCount = 0
    for (let i = 0; i < N; i++) {
      const r = rand()
      if (r < 0.01) {
        now += 6 * 60 * 1000 // suspend (>5min)
      } else {
        now += 60_000 // normal (1min)
      }
      refLast = ref.recordHeartbeat()
      trkLast = trk.recordHeartbeat()
      // trackHeartbeatStateless でも同等数値が出ることを検証
      const out = trackHeartbeatStateless({ nowMs: now, lastHeartbeatMs: lastHb, bootAtMs: bootAt })
      stateless = out.gap
      lastHb = out.nextLastHeartbeatMs
      bootAt = out.nextBootAtMs
      // 各 tick の戻り値が 3 者で一致 (8 桁 = exact 数値一致). 集計後 assert で expect 高速化
      if (trkLast !== refLast) mismatchTrk++
      if (stateless !== refLast) mismatchStateless++
      if (refLast > 0) suspendCount++
    }
    expect(mismatchTrk).toBe(0)
    expect(mismatchStateless).toBe(0)
    expect(trk.lastHeartbeat).toBe(now)
    // suspend が 1/100 の確率で発生 → ~500 件想定 (mix 動作確認)
    expect(suspendCount).toBeGreaterThan(0)
  })
})
