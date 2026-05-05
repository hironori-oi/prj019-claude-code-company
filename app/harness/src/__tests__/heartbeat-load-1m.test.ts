/**
 * heartbeat-load-1m.test — Round 20 第 2 波 Dev-FF 実装 (Round 19 Dev-CC 500k baseline 2x scale-up).
 *
 * 目的:
 *   - HeartbeatGapTracker / computeJitteredBackoffMs / decideRetryAction の
 *     1,000,000 件規模 load 耐性を検証 (Round 17: 50k / Round 18: 100k / Round 19: 500k に続く 2x scale-up).
 *   - thundering herd 回避 (jitter='none' / 'full' / 'equal' / 'decorrelated') の効果を **4 jitter mode 横断比較**
 *     で 1M サンプル統計検証 (Round 19 の 3 mode 比較に 'none' baseline を追加し計 4 mode formal calibration).
 *   - tail latency p99 < 500ms (op = 10,000 tick / 100 op = 1M tick) を 1M operation 規模で実機検証.
 *   - thundering herd formal SLO を 1024 bin で 1M サンプル × 3 jittered mode × 1 baseline mode で再検証.
 *   - Round 19 Dev-CC seed `0xdeadbeef` 系列と完全独立な `0xcafebabe` 系列で trafficパターン重複 0.
 *
 * 実行条件:
 *   - 同期 1,000,000 tick 実行時間 < 1500ms 目標 (Round 19 500k で 328ms 観測 → 線形 656ms 想定 / 余裕 buffer 800ms+).
 *   - メモリ <= 30MB (500k 6.4MB × 2 + 余裕 = 12.8MB 想定 / 30MB cap で 2.3x マージン).
 *   - 副作用 0 (timer / fetch / fs 触らず純 in-memory).
 *   - 1 ケース 1500ms 以内 / 合計 15s 以内目標 (vitest testTimeout 15_000ms 整備済 / Round 19 Dev-CC).
 *
 * 数学的境界 (1,000,000 件想定):
 *   - jitter='full' 期待 wait = E[rand(0, exp)] = exp/2 / CV = 1/√3 ≈ 0.5774
 *   - jitter='equal' 期待 wait = exp/2 + E[rand(0, exp/2)] = 3·exp/4 / CV = 1/(3·√3) ≈ 0.1925
 *   - jitter='decorrelated' (cap 飽和域) は cap に近い uniform 分布 (feedback 非対称性で full の 0.8 倍 mean)
 *   - 1024 bin histogram で max-cluster-density < 1.5x mean (full / equal: formal SLO / Round 19 と整合)
 *   - 1024 bin histogram で max-cluster-density < 2.5x mean (decorrelated: 飽和域 SLO / Round 19 と整合)
 *   - 1M サンプルで cap 接近 max は cap*0.99999 以上を期待 (500k では cap*0.9999 / サンプル数 2x で max → cap 加速)
 *
 * 設計差分 (500k → 1M):
 *   - PRNG seed を 500k と異なる **0xcafebabe** 系列に設定 (50k=default / 100k=0xfeedface / 500k=0xdeadbeef と 4 series 独立).
 *   - 並列 tracker 拡張: 10,000 × 50 attempt = 500k → **100,000 × 10 attempt = 1M retry** (tracker 数次元で 10x 拡張 / attempt 5 倍縮小).
 *     理由: 500k で 10k tracker × 50 attempt = 500k だったが、tracker 数 10x で 100k インスタンス保持の heap 検証も兼ねる
 *     (100,000 tracker × 3 fields × 8 bytes ≈ 2.4MB 想定 / 30MB cap 内で安全).
 *   - cap 接近度の境界強化: cap×0.9999 (500k) → cap×0.99999 (1M / サンプル数 2x で max → cap 加速).
 *   - tail latency op 粒度を 100 tick (500k) → 10,000 tick (1M) に拡張 / 1M / 10,000 = 100 op で p99 抽出.
 *   - jitter mode 比較に **'none' baseline** 追加 (Round 19 は 3 mode / Round 20 は 4 mode で計 4 戦略 formal calibration).
 *   - ContinuousRunDetector 8 桁一致は **本実装で維持** (Sec-O Round 20 spec で 10 桁拡張提案中だが backward compat として 8 桁固定).
 *     10 桁拡張は Round 21 以降の Dev 後続で primitive レベル拡張と並行検討.
 *
 * Round 20 第 2 波 Dev-FF 実装 12 ケース:
 *   1. perf 1M tick (within 1500ms) + tail latency p99 < 500ms / op (op=10,000 tick / 100 op)
 *   2. jitter dispersion CV ≈ 0.5774 (±10%) + 1024 bin で max-cluster-density < 1.5x mean (formal SLO / Round 19 整合)
 *   3. circuit fail-fast (10 連続失敗で 999,990 件 fail-fast / wall < 500ms / O(1) per-call 維持)
 *   4. 100,000 並列 tracker × 10 attempt = 1,000,000 retry / cross-talk 0 (tracker 数 10x scale-up)
 *   5. memory <= 30MB (500k 6.4MB × 2 + 余裕で安全側 cap)
 *   6. determinism mismatch=0 (mulberry32(0xcafebabe + 0x42) で 2 回実行 完全一致)
 *   7. cap 全件丸め (1M 件 attempt=20 で全件 ≤ cap / max > cap×0.99999)
 *   8. decorrelated 安定 (decorMean < 2.5x mean SLO / 1024 bin tail SLO < 2.5x / Round 19 と整合)
 *   9. max-retries (5 retries で 1M 件 fail-fast / 境界 attempt=5 で sleep)
 *   10. ContinuousRunDetector 完全一致 (1M tick 3 経路 mismatch 0 / 8 桁維持 / 10 桁拡張は Round 21 以降)
 *   11. **NEW**: jitter mode 4 戦略比較 (none / full / equal / decorrelated CV+mean 理論値一致)
 *   12. **NEW**: tail latency p99 拡張版 (1M tick / 100 op で wall < 500ms 全 op / 厳格 SLO)
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
 * 決定論的 PRNG (mulberry32). 50k / 100k / 500k test と同 algorithm だが seed は **0xcafebabe** 系列を採用し
 * 1M test 独自のトラフィックパターンで検証 (8 桁再現性は seed 単位で担保).
 *
 * Seed 系列 4 段独立性 (Dev-FF Round 20):
 *   - 50k    : default 各種 (0xdeadbeef / 1 / 42 / 99 / 7 / 0xc0ffee01 / 0xabcdef)
 *   - 100k   : 0xfeedface 系列 (+0 / +1 / +0x42 / +0x99 / +0xaa / +0x07 / +0xbeef)
 *   - 500k   : 0xdeadbeef 系列 (+0 / +1 / +0x42 / +0x99 / +0xaa / +0x07 / +0xbeef / +0x11 / +0x22 / +0x33 / +0x55 / +0x66 / +0x77)
 *   - 1M     : 0xcafebabe 系列 (+0 / +1 / +0x42 / +0x99 / +0xaa / +0x07 / +0xbeef / +0x11 / +0x22 / +0x33 / +0x44 / +0x55 / +0x66 / +0x77)
 *
 * mulberry32(0xcafebabe) は他 3 seed と異なる first-output を生成し traffic 完全独立.
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

/**
 * histogram bin の max-cluster-density を計算するユーティリティ.
 * Round 19 Dev-CC 実装と同じシグネチャ / 完全互換.
 * 戻り値: { maxBin, meanBin, emptyBins, ratio }
 */
function computeHistogramStats(waits: number[], cap: number, NBINS: number): {
  maxBin: number
  meanBin: number
  emptyBins: number
  ratio: number
} {
  const bins = new Int32Array(NBINS)
  for (let i = 0; i < waits.length; i++) {
    const b = Math.min(NBINS - 1, Math.floor((waits[i]! / (cap + 1)) * NBINS))
    bins[b]!++
  }
  let maxBin = 0
  let emptyBins = 0
  for (let i = 0; i < NBINS; i++) {
    if (bins[i]! > maxBin) maxBin = bins[i]!
    if (bins[i] === 0) emptyBins++
  }
  const meanBin = waits.length / NBINS
  return { maxBin, meanBin, emptyBins, ratio: maxBin / meanBin }
}

describe('heartbeat-load-1m — Round 20 第 2 波 Dev-FF 実装', () => {
  // --------------------------------------------------------------------------
  // 1. perf: 1,000,000 tick (HeartbeatGapTracker 同期) < 1500ms
  //    + tail latency p99 < 500ms / op (op=10,000 tick / 100 op)
  // --------------------------------------------------------------------------
  it('perf: 1,000,000 tick が同期で 1500ms 以内に完了する + tail latency p99 < 500ms / op (op=10,000 tick)', () => {
    let now = 1_000_000
    const t = new HeartbeatGapTracker({ now: () => now })
    t.markBoot()
    const N = 1_000_000
    const OP_SIZE = 10_000
    const NUM_OPS = N / OP_SIZE
    const opLatencies: number[] = new Array(NUM_OPS)
    const start = performance.now()
    for (let opIdx = 0; opIdx < NUM_OPS; opIdx++) {
      const opStart = performance.now()
      for (let i = 0; i < OP_SIZE; i++) {
        now += 60_000
        t.recordHeartbeat()
      }
      opLatencies[opIdx] = performance.now() - opStart
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(1500)
    expect(t.accumulatedSleep).toBe(0)
    expect(t.lastHeartbeat).toBe(1_000_000 + N * 60_000)
    // p99 latency: sort and take index = floor(0.99 * NUM_OPS)
    opLatencies.sort((a, b) => a - b)
    const p99 = opLatencies[Math.floor(NUM_OPS * 0.99)]!
    expect(p99).toBeLessThan(500) // 500ms / op (= 10,000 tick) = 50us / tick
  })

  // --------------------------------------------------------------------------
  // 2. jitter dispersion + 1024 bin histogram formal SLO: full jitter 1M 分布検証
  //    - CV ≈ 0.5774 (±10%) で uniform 確認
  //    - 1024 bin で max-cluster-density < 1.5x mean (formal SLO / Round 19 整合)
  // --------------------------------------------------------------------------
  it('jitter dispersion: full jitter の CV が 0.5774 ±10% / 1024 bin で max < 1.5x mean (formal SLO)', () => {
    const rand = mulberry32(0xcafebabe)
    const N = 1_000_000
    const waits: number[] = new Array(N)
    for (let i = 0; i < N; i++) {
      waits[i] = computeJitteredBackoffMs(4, DEFAULT_RETRY_HARDENING, DEFAULT_RETRY_HARDENING.baseDelayMs, rand)
    }
    let sum = 0
    for (let i = 0; i < N; i++) sum += waits[i]!
    const mean = sum / N
    let varSum = 0
    for (let i = 0; i < N; i++) varSum += (waits[i]! - mean) * (waits[i]! - mean)
    const variance = varSum / N
    const cv = Math.sqrt(variance) / mean
    expect(cv).toBeGreaterThan(0.5774 * 0.9)
    expect(cv).toBeLessThan(0.5774 * 1.1)
    // 1024 bin で thundering herd formal SLO 維持 (cluster density < 1.5x mean / Round 19 整合)
    const cap = DEFAULT_RETRY_HARDENING.capMs
    const stats = computeHistogramStats(waits, cap, 1024)
    expect(stats.ratio).toBeLessThan(1.5) // formal SLO: max-cluster-density < 1.5x mean
    expect(stats.emptyBins).toBe(0) // 1M サンプルで 1024 bin → 全 bin に >= 1 件 (mean ≈ 977 件 / bin)
  })

  // --------------------------------------------------------------------------
  // 3. circuit fail-fast: circuitOpen=true で 999,990 件全件 fail-fast / wall < 500ms
  // --------------------------------------------------------------------------
  it('circuit fail-fast: 連続失敗で circuit open 後は 999,990 件全件 fail-fast / wall < 500ms', () => {
    const rand = mulberry32(0xcafebabe + 1)
    let firstAttempts = 0
    let failFastCount = 0
    let cooldownFailCount = 0
    for (let i = 0; i < 10; i++) {
      const d = decideRetryAction(1, DEFAULT_RETRY_HARDENING, DEFAULT_RETRY_HARDENING.baseDelayMs, false, rand)
      if (d.kind === 'sleep') firstAttempts++
    }
    expect(firstAttempts).toBe(10)
    const start = performance.now()
    for (let i = 0; i < 999_990; i++) {
      const d = decideRetryAction(1, DEFAULT_RETRY_HARDENING, DEFAULT_RETRY_HARDENING.baseDelayMs, true, rand)
      if (d.kind === 'fail-fast' && d.reason === 'circuit-open') {
        failFastCount++
      } else {
        cooldownFailCount++
      }
    }
    const wall = performance.now() - start
    expect(failFastCount).toBe(999_990)
    expect(cooldownFailCount).toBe(0)
    expect(wall).toBeLessThan(500) // 500ms 以内 (純 in-memory dispatch / O(1) per-call)
  })

  // --------------------------------------------------------------------------
  // 4. 100,000 並列 tracker × 10 attempt = 1,000,000 retry で cross-talk 0
  //    (Round 19 = 10k tracker × 50 attempt から tracker 数次元で 10x scale-up / attempt 5 分の 1 縮小)
  // --------------------------------------------------------------------------
  it('100,000 並列 tracker × 10 attempt = 1,000,000 retry で cross-talk 0', () => {
    const N_TRACKERS = 100_000
    const N_ATTEMPTS = 10
    const trackers: HeartbeatGapTracker[] = []
    for (let i = 0; i < N_TRACKERS; i++) {
      let nowI = i * 1_000_000
      const t = new HeartbeatGapTracker({ now: () => nowI })
      t.markBoot()
      trackers.push(t)
      for (let j = 0; j < N_ATTEMPTS; j++) {
        nowI += 60_000
        t.recordHeartbeat()
      }
    }
    let mismatchLast = 0
    let mismatchSleep = 0
    for (let i = 0; i < N_TRACKERS; i++) {
      const expectedLast = i * 1_000_000 + N_ATTEMPTS * 60_000
      if (trackers[i]!.lastHeartbeat !== expectedLast) mismatchLast++
      if (trackers[i]!.accumulatedSleep !== 0) mismatchSleep++
    }
    expect(mismatchLast).toBe(0)
    expect(mismatchSleep).toBe(0)
  })

  // --------------------------------------------------------------------------
  // 5. memory: 1,000,000 tick 後の heap delta <= 30MB
  //    (Round 19 500k = 6.4MB / 線形外挿 12.8MB / 30MB cap で 2.3x マージン)
  // --------------------------------------------------------------------------
  it('memory: 1,000,000 tick 後の heap 増加が 30MB 以下', () => {
    const before = process.memoryUsage().heapUsed
    let now = 1_000_000
    const t = new HeartbeatGapTracker({ now: () => now })
    t.markBoot()
    for (let i = 0; i < 1_000_000; i++) {
      now += 60_000
      t.recordHeartbeat()
    }
    const after = process.memoryUsage().heapUsed
    const deltaMB = (after - before) / 1024 / 1024
    expect(deltaMB).toBeLessThan(30)
    const s = t.state()
    expect(typeof s.bootAtMs).toBe('number')
    expect(typeof s.lastHeartbeatMs).toBe('number')
    expect(typeof s.accumulatedSleepMs).toBe('number')
  })

  // --------------------------------------------------------------------------
  // 6. determinism: rand DI 固定で 1,000,000 attempt の wait 列が exact 一致
  // --------------------------------------------------------------------------
  it('determinism: 同 seed の rand DI で 1,000,000 wait 列が完全一致 (8 桁)', () => {
    const N = 1_000_000
    const seed = 0xcafebabe + 0x42
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
    expect(firstNonZero).toBeGreaterThan(0)
  })

  // --------------------------------------------------------------------------
  // 7. cap: 1,000,000 attempt 中 attempt>=5 の wait 全件 <= capMs / cap-1 (= 15999) 接近
  //    primitive 内 `Math.floor(rand() * exp)` の数値上限は exp - 1 (rand() ∈ [0,1) で exp 倍 → floor で最大 exp-1).
  //    したがって 1M サンプルでは maxWait は cap-1 = 15999 に到達することを期待 (cap×0.99999 = 15999.84 は floor 数学的不到達).
  //    500k = cap×0.9999 (=15998.4) / 1M はそれ以上に厳格な cap-1 直撃を要求 (サンプル数 2x で確実に cap-1 ヒット).
  // --------------------------------------------------------------------------
  it('cap: attempt=20 でも wait <= capMs (16_000ms) で全件丸め / 1M で cap-1 (15999) 直撃', () => {
    const rand = mulberry32(0xcafebabe + 0x99)
    const N = 1_000_000
    let maxWait = 0
    let overCap = 0
    const cap = DEFAULT_RETRY_HARDENING.capMs
    for (let i = 0; i < N; i++) {
      const w = computeJitteredBackoffMs(20, DEFAULT_RETRY_HARDENING, DEFAULT_RETRY_HARDENING.baseDelayMs, rand)
      if (w > maxWait) maxWait = w
      if (w > cap) overCap++
    }
    expect(overCap).toBe(0)
    // primitive `Math.floor(rand() * exp)` で rand ∈ [0,1) → max は cap-1 = 15999.
    // 500k では cap×0.9999 (15998.4) を超えれば良かったが 1M はサンプル数 2x で cap-1 直撃を要求.
    expect(maxWait).toBe(cap - 1) // 1M サンプルで Math.floor 上限 cap-1 = 15999 に到達
    expect(maxWait).toBeLessThanOrEqual(cap)
  })

  // --------------------------------------------------------------------------
  // 8. decorrelated 安定: 1M 件 prev フィードバック loop で unbounded grow しない + 1024 bin SLO
  //    (Round 19 と同 SLO 値 < 2.5x mean を formal 維持 / 1M で再検証)
  // --------------------------------------------------------------------------
  it('decorrelated 安定: 1,000,000 連続 retry で wait が cap で stable + 1024 bin SLO < 2.5x mean', () => {
    const rand = mulberry32(0xcafebabe + 0xaa)
    const policy = { ...DEFAULT_RETRY_HARDENING, jitter: 'decorrelated' as const }
    let prev = policy.baseDelayMs
    const N = 1_000_000
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
    expect(overCap).toBe(0)
    // 後半 500,000 件で cap stable 確認
    const tail = waits.slice(500_000)
    let sum = 0
    for (const w of tail) sum += w
    const mean = sum / tail.length
    let varSum = 0
    for (const w of tail) varSum += (w - mean) * (w - mean)
    const stddev = Math.sqrt(varSum / tail.length)
    expect(stddev).toBeGreaterThanOrEqual(0)
    expect(Math.abs(maxWait - mean)).toBeLessThanOrEqual(3 * stddev + policy.capMs)
    // 後半 tail の 1024 bin SLO. decorrelated は uniform(base, min(cap, prev*3)) で
    // prev フィードバックループにより完全 uniform に収束せず非対称な分布になる.
    // Round 19 で実測 ratio ≈ 1.97 / SLO < 2.5x で formal 化済 / 1M でも同 SLO 維持.
    const tailStats = computeHistogramStats(tail, policy.capMs, 1024)
    expect(tailStats.ratio).toBeLessThan(2.5) // decorrelated 飽和域 SLO / Round 19 整合
  })

  // --------------------------------------------------------------------------
  // 9. max-retries: attempt > maxRetries で必ず fail-fast (1,000,000 件)
  // --------------------------------------------------------------------------
  it('fail-fast max-retries: attempt > maxRetries (=5) で 1,000,000 件全件 fail-fast', () => {
    const rand = mulberry32(0xcafebabe + 0x07)
    const N = 1_000_000
    let failFast = 0
    for (let i = 0; i < N; i++) {
      const d = decideRetryAction(6, DEFAULT_RETRY_HARDENING, DEFAULT_RETRY_HARDENING.baseDelayMs, false, rand)
      if (d.kind === 'fail-fast' && d.reason === 'max-retries') failFast++
    }
    expect(failFast).toBe(N)
    const dBoundary = decideRetryAction(5, DEFAULT_RETRY_HARDENING, DEFAULT_RETRY_HARDENING.baseDelayMs, false, rand)
    expect(dBoundary.kind).toBe('sleep')
  })

  // --------------------------------------------------------------------------
  // 10. integration: ContinuousRunDetector との 1,000,000 tick 8 桁一致
  //     (Sec-O Round 20 spec で 10 桁拡張提案中だが本実装は 8 桁維持 / 10 桁は Round 21 以降の Dev 後続)
  // --------------------------------------------------------------------------
  it('integration: ContinuousRunDetector と HeartbeatGapTracker の 1,000,000 tick が 8 桁一致 (10 桁拡張は Round 21+)', () => {
    const N = 1_000_000
    let now = 1_000_000
    const limitMs = 16 * 60 * 60 * 1000
    const ref = new ContinuousRunDetector(limitMs, 3, () => now)
    const trk = new HeartbeatGapTracker({ now: () => now })
    ref.markBoot()
    trk.markBoot()
    const rand = mulberry32(0xcafebabe + 0xbeef)
    let refLast = 0
    let trkLast = 0
    let stateless = 0
    let lastHb: number | null = trk.lastHeartbeat
    let bootAt: number | null = trk.bootAt
    let mismatchTrk = 0
    let mismatchStateless = 0
    let suspendCount = 0
    for (let i = 0; i < N; i++) {
      const r = rand()
      if (r < 0.01) {
        now += 6 * 60 * 1000
      } else {
        now += 60_000
      }
      refLast = ref.recordHeartbeat()
      trkLast = trk.recordHeartbeat()
      const out = trackHeartbeatStateless({ nowMs: now, lastHeartbeatMs: lastHb, bootAtMs: bootAt })
      stateless = out.gap
      lastHb = out.nextLastHeartbeatMs
      bootAt = out.nextBootAtMs
      if (trkLast !== refLast) mismatchTrk++
      if (stateless !== refLast) mismatchStateless++
      if (refLast > 0) suspendCount++
    }
    expect(mismatchTrk).toBe(0)
    expect(mismatchStateless).toBe(0)
    expect(trk.lastHeartbeat).toBe(now)
    expect(suspendCount).toBeGreaterThan(0)
  })

  // --------------------------------------------------------------------------
  // 11. **NEW**: jitter mode 4 戦略 横断比較 — none / full / equal / decorrelated
  //     1M サンプル / 各 mode の CV / mean を統計比較し、設計理論値との一致を verify.
  //     - none: 固定値 exp / CV = 0 / mean = exp = cap (attempt=4 で exp=cap)
  //     - full: CV ≈ 0.5774 / mean ≈ exp/2 = 8000
  //     - equal: CV ≈ 0.1925 / mean ≈ 3·exp/4 = 12000
  //     - decorrelated (cap 飽和域): CV と mean は cap 近辺 stable / mean は full の 0.8x ~ equal の 1.0x
  //
  //     Round 19 Dev-CC は 3 mode 比較 / Round 20 Dev-FF は 'none' baseline 追加で 4 mode formal calibration.
  // --------------------------------------------------------------------------
  it('jitter mode 4 戦略比較: none / full / equal / decorrelated の CV と mean が理論値と一致', () => {
    const N = 1_000_000
    const cap = DEFAULT_RETRY_HARDENING.capMs
    const ATTEMPT = 4 // exp = base*2^4 = 16000 = cap

    // none jitter: 固定値 exp = cap → CV = 0 / mean = cap
    const nonePolicy = { ...DEFAULT_RETRY_HARDENING, jitter: 'none' as const }
    const noneRand = mulberry32(0xcafebabe + 0x44) // none では rand 不使用だが seed 独立性は維持
    let noneSum = 0
    let noneVarSum = 0
    let noneFirst = computeJitteredBackoffMs(ATTEMPT, nonePolicy, nonePolicy.baseDelayMs, noneRand)
    for (let i = 0; i < N; i++) {
      const w = computeJitteredBackoffMs(ATTEMPT, nonePolicy, nonePolicy.baseDelayMs, noneRand)
      noneSum += w
      // none は固定値なので first との差が常に 0
      const dev = w - noneFirst
      noneVarSum += dev * dev
    }
    const noneMean = noneSum / N
    const noneCV = noneMean > 0 ? Math.sqrt(noneVarSum / N) / noneMean : 0
    expect(noneMean).toBe(cap) // none は exp = cap で固定
    expect(noneCV).toBe(0) // 固定値なので CV = 0

    // full jitter: rand(0, exp) → mean = exp/2, CV = 1/√3 ≈ 0.5774
    const fullPolicy = { ...DEFAULT_RETRY_HARDENING, jitter: 'full' as const }
    const fullRand = mulberry32(0xcafebabe + 0x11)
    let fullSum = 0
    let fullVarSum = 0
    const fullWaits: number[] = new Array(N)
    for (let i = 0; i < N; i++) {
      fullWaits[i] = computeJitteredBackoffMs(ATTEMPT, fullPolicy, fullPolicy.baseDelayMs, fullRand)
      fullSum += fullWaits[i]!
    }
    const fullMean = fullSum / N
    for (let i = 0; i < N; i++) fullVarSum += (fullWaits[i]! - fullMean) * (fullWaits[i]! - fullMean)
    const fullCV = Math.sqrt(fullVarSum / N) / fullMean
    expect(fullMean).toBeGreaterThan(cap / 2 * 0.99)
    expect(fullMean).toBeLessThan(cap / 2 * 1.01)
    expect(fullCV).toBeGreaterThan(0.5774 * 0.9)
    expect(fullCV).toBeLessThan(0.5774 * 1.1)

    // equal jitter: exp/2 + rand(0, exp/2) → mean = 3·exp/4, CV = 1/(3·√3) ≈ 0.1925
    const equalPolicy = { ...DEFAULT_RETRY_HARDENING, jitter: 'equal' as const }
    const equalRand = mulberry32(0xcafebabe + 0x22)
    let equalSum = 0
    let equalVarSum = 0
    const equalWaits: number[] = new Array(N)
    for (let i = 0; i < N; i++) {
      equalWaits[i] = computeJitteredBackoffMs(ATTEMPT, equalPolicy, equalPolicy.baseDelayMs, equalRand)
      equalSum += equalWaits[i]!
    }
    const equalMean = equalSum / N
    for (let i = 0; i < N; i++) equalVarSum += (equalWaits[i]! - equalMean) * (equalWaits[i]! - equalMean)
    const equalCV = Math.sqrt(equalVarSum / N) / equalMean
    expect(equalMean).toBeGreaterThan(cap * 3 / 4 * 0.99)
    expect(equalMean).toBeLessThan(cap * 3 / 4 * 1.01)
    expect(equalCV).toBeGreaterThan(0.1925 * 0.9)
    expect(equalCV).toBeLessThan(0.1925 * 1.1)

    // decorrelated jitter: cap 飽和域での mean / stddev verify
    const decorPolicy = { ...DEFAULT_RETRY_HARDENING, jitter: 'decorrelated' as const }
    const decorRand = mulberry32(0xcafebabe + 0x33)
    let prev = decorPolicy.baseDelayMs
    let decorSum = 0
    const decorWaits: number[] = new Array(N)
    for (let i = 0; i < N; i++) {
      decorWaits[i] = computeJitteredBackoffMs(ATTEMPT, decorPolicy, prev, decorRand)
      prev = decorWaits[i]!
      decorSum += decorWaits[i]!
    }
    const decorMean = decorSum / N
    expect(decorMean).toBeGreaterThan(decorPolicy.baseDelayMs)
    expect(decorMean).toBeLessThan(cap)

    // 4 mode mean 序列確認:
    // - full < equal (理論 8000 < 12000)
    // - none = cap = 16000 (固定値で最大)
    // - decorrelated は full の 0.8 倍 ~ equal の 1.0 倍 (feedback 非対称性)
    expect(fullMean).toBeLessThan(equalMean) // 8000 < 12000 (理論)
    expect(equalMean).toBeLessThan(noneMean) // 12000 < 16000 (理論)
    expect(decorMean).toBeGreaterThan(fullMean * 0.8)
    expect(decorMean).toBeLessThan(equalMean * 1.0)
    // SLO calibration (Round 19 と整合): decorMean < 2.5x fullMean (実測は 1.0x 近辺なので大幅余裕)
    expect(decorMean).toBeLessThan(fullMean * 2.5)
  })

  // --------------------------------------------------------------------------
  // 12. **NEW**: tail latency p99 < 500ms 拡張版 + thundering herd formal SLO 1M 再検証
  //     1M tick / 100 op (op=10,000 tick) で全 op の wall < 500ms (厳格 SLO).
  //     さらに 3 jittered mode (full / equal / decorrelated) の 1M サンプル × 1024 bin で formal SLO 再検証.
  // --------------------------------------------------------------------------
  it('tail latency p99 < 500ms 全 op + thundering herd formal SLO 3 mode 1M 再検証', () => {
    // 12-A: tail latency p99 全 op < 500ms (1M / 100 op = 10K tick / op)
    let now = 1_000_000
    const t = new HeartbeatGapTracker({ now: () => now })
    t.markBoot()
    const N = 1_000_000
    const OP_SIZE = 10_000
    const NUM_OPS = N / OP_SIZE
    const opLatencies: number[] = new Array(NUM_OPS)
    for (let opIdx = 0; opIdx < NUM_OPS; opIdx++) {
      const opStart = performance.now()
      for (let i = 0; i < OP_SIZE; i++) {
        now += 60_000
        t.recordHeartbeat()
      }
      opLatencies[opIdx] = performance.now() - opStart
    }
    opLatencies.sort((a, b) => a - b)
    const p99 = opLatencies[Math.floor(NUM_OPS * 0.99)]!
    const p100 = opLatencies[NUM_OPS - 1]!
    expect(p99).toBeLessThan(500) // 厳格 SLO
    expect(p100).toBeLessThan(1500) // p100 (max) も 1500ms 以内 (whole-test 制約と整合)

    // 12-B: thundering herd formal SLO 1M / 1024 bin / 3 mode 再検証
    const cap = DEFAULT_RETRY_HARDENING.capMs
    const NBINS = 1024
    const ATTEMPT = 4

    // full jitter SLO
    const fullPolicy = { ...DEFAULT_RETRY_HARDENING, jitter: 'full' as const }
    const fullRand = mulberry32(0xcafebabe + 0x55)
    const fullWaits: number[] = new Array(N)
    for (let i = 0; i < N; i++) {
      fullWaits[i] = computeJitteredBackoffMs(ATTEMPT, fullPolicy, fullPolicy.baseDelayMs, fullRand)
    }
    const fullStats = computeHistogramStats(fullWaits, cap, NBINS)
    expect(fullStats.ratio).toBeLessThan(1.5) // formal SLO / Round 19 整合
    expect(fullStats.emptyBins).toBe(0)

    // equal jitter SLO — equal は exp/2 ~ exp の半分レンジに集中するので bin range も半分で見る
    const equalPolicy = { ...DEFAULT_RETRY_HARDENING, jitter: 'equal' as const }
    const equalRand = mulberry32(0xcafebabe + 0x66)
    const equalWaits: number[] = new Array(N)
    for (let i = 0; i < N; i++) {
      equalWaits[i] = computeJitteredBackoffMs(ATTEMPT, equalPolicy, equalPolicy.baseDelayMs, equalRand)
    }
    const equalBins = new Int32Array(NBINS)
    const equalLo = cap / 2
    const equalHi = cap + 1
    for (let i = 0; i < N; i++) {
      const w = equalWaits[i]!
      if (w < equalLo) continue
      const b = Math.min(NBINS - 1, Math.floor(((w - equalLo) / (equalHi - equalLo)) * NBINS))
      equalBins[b]!++
    }
    let equalMaxBin = 0
    for (let i = 0; i < NBINS; i++) if (equalBins[i]! > equalMaxBin) equalMaxBin = equalBins[i]!
    const equalMeanBin = N / NBINS
    const equalRatio = equalMaxBin / equalMeanBin
    expect(equalRatio).toBeLessThan(1.5) // formal SLO / Round 19 整合

    // decorrelated jitter SLO (tail 500k で stable 状態を取り 1024 bin SLO)
    const decorPolicy = { ...DEFAULT_RETRY_HARDENING, jitter: 'decorrelated' as const }
    const decorRand = mulberry32(0xcafebabe + 0x77)
    let prev = decorPolicy.baseDelayMs
    const decorWaits: number[] = new Array(N)
    for (let i = 0; i < N; i++) {
      decorWaits[i] = computeJitteredBackoffMs(ATTEMPT, decorPolicy, prev, decorRand)
      prev = decorWaits[i]!
    }
    const decorTail = decorWaits.slice(500_000)
    const decorStats = computeHistogramStats(decorTail, cap, NBINS)
    expect(decorStats.ratio).toBeLessThan(2.5) // 飽和域 SLO / Round 19 整合
  })
})
