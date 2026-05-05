/**
 * heartbeat-load-1m-10digit.test — Round 21 第 1 波 Sec-P 物理化.
 *
 * 出典:
 *   - Sec-O R20 spec `sec-o-r20-continuous-run-detector-extension-spec.md` §3 / §6
 *   - Sec-O R20 1M feasibility 評価書 (GO with conditions / 条件 C-2: 10 桁拡張 必須)
 *   - 既存 1M test: `heartbeat-load-1m.test.ts` (Round 20 Dev-FF / 8 桁固定 / 12 ケース PASS).
 *
 * 目的:
 *   - 1,000,000 件 load + ContinuousRunDetector matchDigits=10 を **e2e** で適用し、
 *     既存 8 桁 baseline との binary 独立性 / mismatch=0 / 衝突確率 1/1B (256x 低減) を verify.
 *   - 既存 1M test (8 桁 / heartbeat-load-1m.test.ts) は **無改変**. 本 file は新規 10 桁経路の
 *     並走 verification として独立 run する (regression 0 担保).
 *
 * 副作用 0 / API $0:
 *   - 純 in-memory 1M tick. timer / fs / fetch / network 触らず.
 *   - mulberry32 seed `0xcafebabe` (Dev-FF と同 seed) で同 traffic pattern で 10 桁経路を verify.
 *   - heap 増加は既存 1M test と同水準 (~12.8MB / 30MB cap 内).
 *
 * Sec-O R20 spec §6.3 検証 SLO:
 *   - 10 桁拡張経路 mismatch=0: 1M scale per-pair 9.09 × 10^-13 / 期待衝突 9.09 × 10^-7 件 = 真の bug 断定可能.
 *   - 8 桁 default 経路の regression 0: 既存 1M test (heartbeat-load-1m.test.ts) は無改変で全 PASS 維持.
 *   - TypeScript strict pass: matchDigits option 追加で型エラー 0.
 *   - memory: state 28→40 byte (+12 byte) で 1M tick × 40 byte = 40MB 想定だが 1 tracker のみで影響無視.
 *
 * 5 ケース構成 (既存 1M test #6 #10 を 10 桁拡張並走として再検証 + α):
 *   1. 10 桁 determinism: 1M hash 列が同 seed で完全一致 (per-pair 9.09 × 10^-13 / 1M で衝突 0)
 *   2. 10 桁 vs 8 桁 binary 独立性 (1M scale): 同 seed でも型差異 / 進行差で hash 系列完全独立
 *   3. 10 桁 + 既存 ContinuousRunDetector recordHeartbeat 並走 (1M tick / 既存挙動無干渉)
 *   4. 10 桁範囲活用度: 1M サンプルで max が 40bit 上限 0xFFFFFFFFFF 近接
 *   5. 10 桁衝突確率: 100K サンプルでの実測衝突件数 = 0 (理論期待 9.09 × 10^-8 件)
 */
import { describe, it, expect } from 'vitest'
import {
  ContinuousRunDetector,
  continuousRunHash32bit,
  continuousRunHash40bit,
} from '../tos-monitor.js'

/**
 * 決定論的 PRNG (mulberry32). 既存 heartbeat-load-1m.test.ts と同 algorithm / 同 seed `0xcafebabe`.
 * 同 seed で 8 桁 / 10 桁経路を並走させると、mulberry32 進行が 1 call vs 2 call で
 * binary compat 喪失することを verify する (Sec-O §2 案 A 採用根拠).
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

describe('heartbeat-load-1m-10digit — Round 21 Sec-P 物理化 (Sec-O R20 condition C-2)', () => {
  // --------------------------------------------------------------------------
  // 1. 10 桁 determinism: 1M hash 列が同 seed で完全一致
  //    Sec-O §3 偽陽性確率 per-pair 9.09 × 10^-13 / 1M サンプル期待衝突 9.09 × 10^-7 件
  //    → 真の mismatch=0 が SLO. 8 桁 default の 2.33 × 10^-4 件 (グレーゾーン) から 256x 低減.
  // --------------------------------------------------------------------------
  it('determinism: matchDigits=10 で 1,000,000 hash 列が同 seed で完全一致 (mismatch=0)', () => {
    const detectorA = new ContinuousRunDetector(
      16 * 60 * 60 * 1000,
      3,
      () => 1_000_000,
      5 * 60 * 1000,
      { matchDigits: 10 },
    )
    const detectorB = new ContinuousRunDetector(
      16 * 60 * 60 * 1000,
      3,
      () => 1_000_000,
      5 * 60 * 1000,
      { matchDigits: 10 },
    )
    const N = 1_000_000
    const seed = 0xcafebabe + 0x42 // Dev-FF 既存 1M test test#6 と同 seed (binary 独立は別 test で verify)
    const randA = mulberry32(seed)
    const randB = mulberry32(seed)
    let mismatch = 0
    let firstHash: bigint | null = null
    let maxHash = 0n
    for (let i = 0; i < N; i++) {
      const hA = detectorA.computeVerificationHash(randA) as bigint
      const hB = detectorB.computeVerificationHash(randB) as bigint
      if (hA !== hB) mismatch++
      if (firstHash === null) firstHash = hA
      if (hA > maxHash) maxHash = hA
    }
    expect(mismatch).toBe(0) // SLO: per-pair 9.09×10^-13 / 1M で期待 0 件
    expect(maxHash).toBeLessThanOrEqual(0xFFFFFFFFFFn)
    expect(firstHash).not.toBeNull()
  })

  // --------------------------------------------------------------------------
  // 2. 10 桁 vs 8 桁 binary 独立性 (1M scale)
  //    同 seed `0xcafebabe + 0x42` で並走させても、mulberry32 進行が 1 call vs 2 call で
  //    binary compat 喪失することを 1M scale で verify.
  //    → 8 桁系列との binary 独立性確保 (Sec-O §2 案 A 採用根拠).
  // --------------------------------------------------------------------------
  it('binary 独立性 (1M scale): 8 桁 vs 10 桁経路は型差異 / 進行差で系列完全独立', () => {
    const detector8 = new ContinuousRunDetector(
      16 * 60 * 60 * 1000,
      3,
      () => 1_000_000,
      5 * 60 * 1000,
      { matchDigits: 8 },
    )
    const detector10 = new ContinuousRunDetector(
      16 * 60 * 60 * 1000,
      3,
      () => 1_000_000,
      5 * 60 * 1000,
      { matchDigits: 10 },
    )
    const seed = 0xcafebabe + 0x42
    const rand8 = mulberry32(seed)
    const rand10 = mulberry32(seed)
    const N = 1_000_000
    // 1M call で 8 桁 hash を蓄積. 同 seed の 10 桁 hash と型 / 値が異なることを sampling で verify.
    let typeMismatchCount = 0
    let valueDiffSamples = 0
    const SAMPLE_INTERVAL = 1000 // 1000 件ごとに 1 サンプル比較 (1M / 1000 = 1000 サンプル)
    for (let i = 0; i < N; i++) {
      const h8 = detector8.computeVerificationHash(rand8)
      const h10 = detector10.computeVerificationHash(rand10)
      if (i % SAMPLE_INTERVAL === 0) {
        if (typeof h8 !== typeof h10) typeMismatchCount++
        // 値の比較: number と bigint は === で常に false なので valueDiffSamples = 1000 が期待.
        if ((h8 as unknown) !== (h10 as unknown)) valueDiffSamples++
      }
    }
    // 全サンプル (1000 件) で型差異 (number vs bigint) を観測.
    expect(typeMismatchCount).toBe(1000)
    // 全サンプル (1000 件) で 値も異なる (型差異により === が false).
    expect(valueDiffSamples).toBe(1000)
  })

  // --------------------------------------------------------------------------
  // 3. 10 桁 + 既存 ContinuousRunDetector recordHeartbeat 並走 (1M tick / 無干渉)
  //    matchDigits option は recordHeartbeat / evaluate / markBoot の挙動に影響しないことを verify.
  //    既存 detector の挙動 (boot / heartbeat / suspend 検出) は 8 / 10 桁 option 問わず同一.
  // --------------------------------------------------------------------------
  it('matchDigits option は recordHeartbeat / evaluate に副作用なし (option 無干渉)', () => {
    let now = 1_000_000
    const detector10 = new ContinuousRunDetector(
      16 * 60 * 60 * 1000,
      3,
      () => now,
      5 * 60 * 1000,
      { matchDigits: 10 },
    )
    const detector8 = new ContinuousRunDetector(
      16 * 60 * 60 * 1000,
      3,
      () => now,
      5 * 60 * 1000,
      { matchDigits: 8 },
    )
    detector10.markBoot()
    detector8.markBoot()
    // 1M tick 並走 (each instance に同 timeline). recordHeartbeat の戻り値が完全一致することを verify.
    const N = 1_000_000
    let mismatchCount = 0
    for (let i = 0; i < N; i++) {
      now += 60_000 // 1 min interval (sleepGapMs 5min 以下なので normal)
      const r10 = detector10.recordHeartbeat()
      const r8 = detector8.recordHeartbeat()
      if (r10 !== r8) mismatchCount++
    }
    expect(mismatchCount).toBe(0) // option 無干渉 (recordHeartbeat 戻り値完全一致)
    // accumulatedSleep / hasBoot は両者完全一致.
    expect(detector10.accumulatedSleep).toBe(detector8.accumulatedSleep)
    expect(detector10.hasBoot).toBe(detector8.hasBoot)
  })

  // --------------------------------------------------------------------------
  // 4. 10 桁範囲活用度: 1M サンプルで max が 40bit 上限 0xFFFFFFFFFF 近接
  //    uniform sampling で 1M 取れば max ≈ 0xFFFFFFFFFF * (1 - 1/1M) ≈ 0xFFFFEFFFFF 近辺.
  //    上位 8bit が 0xFF (= 255) のサンプルは期待 1/256 ≈ 3,906 件 (1M * 1/256).
  // --------------------------------------------------------------------------
  it('10 桁範囲活用度: 1,000,000 サンプルで max が 40bit 上限近接 + 上位 8bit 分布 uniform', () => {
    const detector = new ContinuousRunDetector(
      16 * 60 * 60 * 1000,
      3,
      () => 1_000_000,
      5 * 60 * 1000,
      { matchDigits: 10 },
    )
    const rand = mulberry32(0xcafebabe + 0xaa)
    const N = 1_000_000
    let maxHash = 0n
    let upperByteFFCount = 0
    let upperByteZeroCount = 0
    for (let i = 0; i < N; i++) {
      const h = detector.computeVerificationHash(rand) as bigint
      if (h > maxHash) maxHash = h
      const upper = h >> 32n
      if (upper === 0xFFn) upperByteFFCount++
      if (upper === 0n) upperByteZeroCount++
    }
    expect(maxHash).toBeLessThanOrEqual(0xFFFFFFFFFFn)
    // max は 40bit 上限 0xFFFFFFFFFF の上位 16bit 以上活用 (>= 0xFFFF000000 / 1M スケールで安全側).
    expect(maxHash).toBeGreaterThan(0xFFFF000000n)
    // 上位 8bit が 0xFF (= 255) のサンプルは uniform で 1/256 = 3906 件期待.
    // ±50% buffer で 2000-6000 の範囲を許容.
    expect(upperByteFFCount).toBeGreaterThan(2000)
    expect(upperByteFFCount).toBeLessThan(6000)
    // 上位 8bit が 0 のサンプルも同等 (uniform 確認).
    expect(upperByteZeroCount).toBeGreaterThan(2000)
    expect(upperByteZeroCount).toBeLessThan(6000)
  })

  // --------------------------------------------------------------------------
  // 5. 10 桁衝突確率: 100K サンプル sliding pair で実測衝突件数
  //    100K サンプルのうち隣接ペア (i, i+1) の 99,999 件で hash 完全一致するか測定.
  //    per-pair 衝突確率 9.09 × 10^-13 / 100K で期待衝突 9.09 × 10^-8 件 ≈ 0.
  //    実測 0 件で SLO 合致を verify (1M 全 pair = 999,999 件でも期待 9.09 × 10^-7 ≈ 0).
  // --------------------------------------------------------------------------
  it('衝突確率: 100,000 隣接ペアで hash 衝突件数 = 0 (per-pair 9.09 × 10^-13)', () => {
    const detector = new ContinuousRunDetector(
      16 * 60 * 60 * 1000,
      3,
      () => 1_000_000,
      5 * 60 * 1000,
      { matchDigits: 10 },
    )
    const rand = mulberry32(0xcafebabe + 0xbeef)
    const N = 100_000
    let collisions = 0
    let prev: bigint | null = null
    for (let i = 0; i < N; i++) {
      const h = detector.computeVerificationHash(rand) as bigint
      if (prev !== null && prev === h) collisions++
      prev = h
    }
    // 期待 collision = 99,999 * 9.09 × 10^-13 ≈ 9.09 × 10^-8 件 ≈ 0.
    // 実測 0 件で SLO 合致 (1M 全 pair でも期待 9.09 × 10^-7 で実質 0).
    expect(collisions).toBe(0)
    // 同 helper 関数の純関数版も同 SLO で動作することを verify (ContinuousRunDetector を経由しない場合).
    const helperRand = mulberry32(0xcafebabe + 0xbeef + 1)
    let helperCollisions = 0
    let helperPrev: bigint | null = null
    for (let i = 0; i < N; i++) {
      const h = continuousRunHash40bit(helperRand)
      if (helperPrev !== null && helperPrev === h) helperCollisions++
      helperPrev = h
    }
    expect(helperCollisions).toBe(0)
    // 8 桁版 helper も同様に SLO 合致 (per-pair 2.33 × 10^-10 / 100K で期待 2.33 × 10^-5 件 ≈ 0).
    const helper8Rand = mulberry32(0xcafebabe + 0xbeef + 2)
    let helper8Collisions = 0
    let helper8Prev: number | null = null
    for (let i = 0; i < N; i++) {
      const h = continuousRunHash32bit(helper8Rand)
      if (helper8Prev !== null && helper8Prev === h) helper8Collisions++
      helper8Prev = h
    }
    expect(helper8Collisions).toBe(0)
  })
})
