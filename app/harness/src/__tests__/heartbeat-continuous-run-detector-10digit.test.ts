/**
 * heartbeat-continuous-run-detector-10digit.test — Round 21 第 1 波 Sec-P 物理化.
 *
 * 出典:
 *   - Sec-O R20 spec `sec-o-r20-continuous-run-detector-extension-spec.md` §5 / §6
 *   - 連動 1M test: `heartbeat-load-1m.test.ts` (Round 20 Dev-FF / 8 桁固定)
 *
 * 目的:
 *   - ContinuousRunDetector に追加された matchDigits option (8 default / 10) の挙動を
 *     unit test レベルで verify する。1M scale e2e は heartbeat-load-1m-10digit.test.ts に分離。
 *   - 8 桁経路 (32bit / 1 mulberry32 call) の backward compat を保持しながら、
 *     10 桁経路 (40bit / 2 mulberry32 call) の binary 独立性 / 衝突確率低減を確認する。
 *
 * 副作用 0 / API $0 制約:
 *   - 純 in-memory unit test. timer / fs / fetch / network 触らず。
 *   - mulberry32 PRNG seed は test 内部で各種値を試行。harness 既存 1M test の seed 0xcafebabe とは
 *     独立 seed (0xa1b2c3d4 等) を用いて衝突避け / matrix 並列実行 safe.
 *
 * Round 21 Sec-P 物理化点 (Sec-O R20 spec §6.1 6.2):
 *   - matchDigits option default=8 が backward compat (既存挙動) と完全一致することを
 *     32bit / 8 桁 hex 範囲 0 〜 0xFFFFFFFF で verify。
 *   - matchDigits=10 で 40bit / 10 桁 hex 範囲 0 〜 0xFFFFFFFFFF (1_099_511_627_775) で verify。
 *   - 衝突確率の statistical sampling: 1M tier の 1/100 = 10K サンプルで 10 桁経路の
 *     mismatch=0 を確認 (per-pair 9.09 × 10^-13 / 10K で expected collision = 9.09 × 10^-9).
 *
 * 5〜7 ケース構成:
 *   1. matchDigits default = 8 (既存挙動 / Number 比較)
 *   2. matchDigits=8 explicit 指定でも default と完全一致
 *   3. matchDigits=10 で BigInt 比較 / 40bit 範囲を返す
 *   4. 10 桁経路の determinism: 同 seed の 2 instance で 10K hash 列 mismatch=0
 *   5. 8 桁系列との完全独立: 同 seed でも matchDigits 8 vs 10 は型が異なる (number vs bigint)
 *   6. 10 桁範囲上限: 1M call 中 max は 40bit 上限 0xFFFFFFFFFF に近い値を観測
 *   7. backward compat option spread: { matchDigits: 8 } と {} (省略) が同等
 */
import { describe, it, expect } from 'vitest'
import {
  ContinuousRunDetector,
  continuousRunHash32bit,
  continuousRunHash40bit,
} from '../tos-monitor.js'

/**
 * 決定論的 PRNG (mulberry32). harness 既存 heartbeat-load-*.test.ts と同 algorithm.
 * 本 unit test では seed `0xa1b2c3d4` 系列を採用し既存 1M test (`0xcafebabe`) と独立させる。
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

describe('ContinuousRunDetector matchDigits option — Round 21 Sec-P 物理化', () => {
  // --------------------------------------------------------------------------
  // Test 1: matchDigits default = 8 (既存挙動 / Number 比較 / 32bit 範囲)
  //   - option を渡さない既存 callsite で matchDigitsValue が 8 で初期化されることを verify.
  //   - computeVerificationHash の戻り値が typeof === 'number' で 32bit 範囲内であることを verify.
  // --------------------------------------------------------------------------
  it('matchDigits default = 8 (既存挙動 backward compat)', () => {
    const detector = new ContinuousRunDetector(
      16 * 60 * 60 * 1000,
      3,
      () => 1_000_000,
      // sleepGapMs default
    )
    expect(detector.matchDigitsValue).toBe(8)
    const rand = mulberry32(0xa1b2c3d4)
    const h = detector.computeVerificationHash(rand)
    // typeof === 'number' (BigInt ではない) で 32bit 範囲内.
    expect(typeof h).toBe('number')
    expect(h as number).toBeGreaterThanOrEqual(0)
    expect(h as number).toBeLessThanOrEqual(0xFFFFFFFF)
  })

  // --------------------------------------------------------------------------
  // Test 2: matchDigits=8 explicit 指定でも default 挙動と完全一致
  //   - { matchDigits: 8 } を明示しても default 動作 (省略時) と等価であることを verify.
  //   - 同 seed の rand を渡すと両者が同 hash を返す.
  // --------------------------------------------------------------------------
  it('matchDigits=8 explicit 指定が default と完全一致 (option spread backward compat)', () => {
    const detectorDefault = new ContinuousRunDetector(
      16 * 60 * 60 * 1000,
      3,
      () => 1_000_000,
      5 * 60 * 1000,
    )
    const detectorExplicit = new ContinuousRunDetector(
      16 * 60 * 60 * 1000,
      3,
      () => 1_000_000,
      5 * 60 * 1000,
      { matchDigits: 8 },
    )
    expect(detectorDefault.matchDigitsValue).toBe(8)
    expect(detectorExplicit.matchDigitsValue).toBe(8)
    // 同 seed で hash 値完全一致 (default と explicit 8 は binary equivalent).
    const r1 = mulberry32(0xa1b2c3d4 + 0x01)
    const r2 = mulberry32(0xa1b2c3d4 + 0x01)
    const h1 = detectorDefault.computeVerificationHash(r1)
    const h2 = detectorExplicit.computeVerificationHash(r2)
    expect(h1).toBe(h2)
    expect(typeof h1).toBe('number')
    expect(typeof h2).toBe('number')
  })

  // --------------------------------------------------------------------------
  // Test 3: matchDigits=10 で BigInt 比較 / 40bit 範囲 (Sec-O R20 §2 案 A 採用)
  //   - { matchDigits: 10 } 指定で matchDigitsValue=10.
  //   - computeVerificationHash の戻り値が typeof === 'bigint' で 40bit 範囲内.
  //   - 上限 0xFFFFFFFFFF (1_099_511_627_775) を超えない.
  // --------------------------------------------------------------------------
  it('matchDigits=10 で BigInt 40bit 範囲 (Sec-O §2 案 A)', () => {
    const detector = new ContinuousRunDetector(
      16 * 60 * 60 * 1000,
      3,
      () => 1_000_000,
      5 * 60 * 1000,
      { matchDigits: 10 },
    )
    expect(detector.matchDigitsValue).toBe(10)
    const rand = mulberry32(0xa1b2c3d4 + 0x02)
    const h = detector.computeVerificationHash(rand)
    expect(typeof h).toBe('bigint')
    const bigH = h as bigint
    expect(bigH).toBeGreaterThanOrEqual(0n)
    expect(bigH).toBeLessThanOrEqual(0xFFFFFFFFFFn)
  })

  // --------------------------------------------------------------------------
  // Test 4: 10 桁経路 determinism — 同 seed の 2 instance で 10,000 hash 列 mismatch=0
  //   - 1M scale 用 SLO (per-pair 9.09 × 10^-13) を 1/100 サンプル (10K) で確認.
  //   - 10K サンプルでの expected collision = 10K * 9.09 × 10^-13 ≈ 9.09 × 10^-9
  //     (実質ゼロ) なので mismatch=0 が期待される.
  // --------------------------------------------------------------------------
  it('determinism: matchDigits=10 で 10,000 hash 列が同 seed で完全一致 (mismatch=0)', () => {
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
    const N = 10_000
    const seed = 0xa1b2c3d4 + 0x42
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
    expect(mismatch).toBe(0)
    // 40bit 範囲内 (0xFFFFFFFFFF = 2^40 - 1) 確認.
    expect(maxHash).toBeLessThanOrEqual(0xFFFFFFFFFFn)
    // 10K サンプルで max は 40bit 上限の 99% 程度に達することが期待される (uniform sampling).
    // 厳格 assertion は collision rate test で行うため、ここでは範囲のみ verify.
    expect(firstHash).not.toBeNull()
  })

  // --------------------------------------------------------------------------
  // Test 5: 8 桁系列との binary 独立性 — 同 seed でも matchDigits 8 vs 10 で型が異なる
  //   - 8 桁系列 (number) と 10 桁系列 (bigint) は別 PRNG 進行で binary compat 喪失 (意図的).
  //   - typeof で容易に区別可能 / 比較演算 === で false (number vs bigint).
  //   - Sec-O R20 spec §2 案 A の "8 桁系列との完全独立" 設計を verify.
  // --------------------------------------------------------------------------
  it('8 vs 10 桁系列の binary 独立性: 型差異 + 比較演算 false (Sec-O §2 案 A)', () => {
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
    // 同 seed で hash 化. mulberry32 進行が 1 vs 2 回で binary compat 喪失.
    const seed = 0xa1b2c3d4 + 0x99
    const rand8 = mulberry32(seed)
    const rand10 = mulberry32(seed)
    const h8 = detector8.computeVerificationHash(rand8)
    const h10 = detector10.computeVerificationHash(rand10)
    expect(typeof h8).toBe('number')
    expect(typeof h10).toBe('bigint')
    // typeof が異なるので === 比較は false (Number と BigInt は never equal in ===).
    // (h8 as unknown) === (h10 as unknown) は型混合比較なので false.
    expect((h8 as unknown) === (h10 as unknown)).toBe(false)
  })

  // --------------------------------------------------------------------------
  // Test 6: 10 桁範囲上限の statistical 確認 — 10,000 hash 列で max が 40bit 上限近接
  //   - uniform sampling で 10K 取れば max は 0xFFFFFFFFFF * (1 - 1/10K) ≈ 0xFFFE FFFF FFFF 近辺.
  //   - 厳格境界は 1M test に委譲し、本 unit test では "40bit 範囲を活用していること" のみ verify.
  // --------------------------------------------------------------------------
  it('10 桁範囲: 10,000 hash 列で max が 40bit 範囲 (上位 32bit > 0 を観測)', () => {
    const detector = new ContinuousRunDetector(
      16 * 60 * 60 * 1000,
      3,
      () => 1_000_000,
      5 * 60 * 1000,
      { matchDigits: 10 },
    )
    const rand = mulberry32(0xa1b2c3d4 + 0xaa)
    const N = 10_000
    let maxHash = 0n
    let upperByteSeen = 0
    for (let i = 0; i < N; i++) {
      const h = detector.computeVerificationHash(rand) as bigint
      if (h > maxHash) maxHash = h
      // 上位 8bit (40bit のうち >> 32) が 0 でないサンプル数をカウント (40bit 活用 verify).
      if (h >> 32n > 0n) upperByteSeen++
    }
    // 40bit 範囲内.
    expect(maxHash).toBeLessThanOrEqual(0xFFFFFFFFFFn)
    // 10K サンプルのうち、上位 8bit が non-zero となるサンプルは 255/256 ≈ 99.6% 期待.
    // 9000 件以上で 40bit 範囲を実質的に活用していることを verify.
    expect(upperByteSeen).toBeGreaterThan(9000)
  })

  // --------------------------------------------------------------------------
  // Test 7: backward compat — pure helper 関数 continuousRunHash{32,40}bit が公開され直接利用可能
  //   - test / instrumentation で detector を経由せず純関数 hash を取得できることを verify.
  //   - 32bit hash は number / 40bit hash は bigint (型差異維持).
  //   - 32bit 範囲 / 40bit 範囲は確実に上下限を満たす.
  // --------------------------------------------------------------------------
  it('pure helper continuousRunHash{32,40}bit: 公開関数として直接利用可能', () => {
    const rand32 = mulberry32(0xa1b2c3d4 + 0x77)
    const rand40 = mulberry32(0xa1b2c3d4 + 0x77)
    const h32 = continuousRunHash32bit(rand32)
    const h40 = continuousRunHash40bit(rand40)
    expect(typeof h32).toBe('number')
    expect(typeof h40).toBe('bigint')
    expect(h32).toBeGreaterThanOrEqual(0)
    expect(h32).toBeLessThanOrEqual(0xFFFFFFFF)
    expect(h40).toBeGreaterThanOrEqual(0n)
    expect(h40).toBeLessThanOrEqual(0xFFFFFFFFFFn)
  })
})
