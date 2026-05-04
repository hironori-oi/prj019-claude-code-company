/**
 * detector-functions — Round 13 Dev-B / Task B (DEC-019-057 連動).
 * Round 14 Dev-B Task B 拡張: z-score outlier filter を統合した detectOutlier API 追加。
 *
 * 目的:
 *   - tos-monitor.ts の 4 detector class (ContinuousRunDetector / CostCapDetector /
 *     RateSpikeDetector / heartbeat-gap) のうち、純関数化可能な「アルゴリズム本体」を
 *     副作用ゼロの top-level function として抽出する。
 *   - class 自体は API 互換性 (既存 61 tests) のため削減しない。内部実装を pure function
 *     に委譲することで再利用性とテスト容易性を上げる。
 *
 * 設計方針:
 *   - 入力は readonly primitive (number / 配列 / config struct), 出力は plain object.
 *   - state (gate / window / sleep accumulation) は呼び出し側が保持する。本 file は
 *     計算結果のみ返す。
 *   - suppression-primitives.ts の zScoreFilter を **detector 文脈に合わせた高位 API**
 *     (detectOutlier / evaluateRateSpikeWithZScore) に統合。caller が直接 zScoreFilter を
 *     呼ぶ代わりに、本 file の統一 interface (OutlierFilterInput / OutlierFilterOutput)
 *     を使うことで rate-spike / cost spike / latency spike 等の outlier 検出を
 *     一貫したシグネチャで扱える。
 *   - 数値挙動は既存 detector class および suppression-primitives.zScoreFilter と 8 桁一致
 *     (test で verify)。
 *
 * 含まれる pure function:
 *   1. evaluateContinuousRun  — 連続稼働 elapsed 計算 + breach 判定 (gate state は外で保持)
 *   2. evaluateCostCap        — cost cap effective cap 計算 + breach 判定
 *   3. computeBaselinePerWindow — rate-spike baseline 計算 (long/short window 正規化)
 *   4. evaluateRateSpike      — rate-spike multiplier breach 判定 (z-score / legit window はスキップ可)
 *   5. computeAccumulatedActiveElapsed — sleep を差し引いた active elapsed
 *   6. purgeOlderSamples / bucketTokensPerWindow — sample 配列の純関数 helper
 *   7. detectOutlier (R14 新規) — 統一 outlier filter (z-score 統合, 抑止判定の generic API)
 *   8. evaluateRateSpikeWithZScore (R14 新規) — rate-spike + z-score を 1 step で評価
 */

// ============================================================================
// 型
// ============================================================================

export interface ContinuousRunInput {
  /** boot 時刻 ms (null = 未起動) */
  bootAtMs: number | null
  /** 現在 ms */
  nowMs: number
  /** 累積 sleep ms */
  accumulatedSleepMs: number
  /** 連続稼働 cap ms */
  limitMs: number
}

export interface ContinuousRunOutput {
  /** boot 未起動なら null, 起動済なら active elapsed ms (sleep 控除済み) */
  elapsedMs: number | null
  /** elapsed >= limit なら true. confirmCount 連動は呼び出し側が処理。 */
  breachCandidate: boolean
}

export interface CostCapInput {
  /** apiUsdMonthly 現在値 */
  currentUsd: number
  /** base cap (USD) */
  capUsd: number
  /** 現在 effective multiplier (legit window 内なら >1) */
  effectiveMultiplier: number
  /** legit window 内か */
  inLegitWindow: boolean
}

export interface CostCapOutput {
  /** breach 候補 (effective cap >= currentUsd は false) */
  breachCandidate: boolean
  /** cap 超過だが legit window で抑止された */
  suppressedByLegitWindow: boolean
  /** 実効 cap (= capUsd * effectiveMultiplier) */
  effectiveCapUsd: number
  /** echo back */
  currentUsd: number
}

export interface RateSpikeSampleLite {
  ts: number
  tokens: number
}

export interface RateSpikeWindowConfig {
  /** short window ms (default 1h) */
  shortMs: number
  /** long window ms (default 24h) */
  longMs: number
  /** breach 倍率 (default 5x) */
  multiplier: number
  /** baseline 最小値 (default 10) */
  baselineMinTokens: number
}

export interface RateSpikeInput {
  /** 現在 ms */
  nowMs: number
  /** sample 配列 (long window 内に絞られている前提、purge は外で実施) */
  samples: readonly RateSpikeSampleLite[]
  /** window config */
  config: RateSpikeWindowConfig
}

export interface RateSpikeOutput {
  /** breach 候補 (multiplier 超 + baseline >= min) */
  breachCandidate: boolean
  /** baseline が min 未満で抑止された */
  suppressedByMinBaseline: boolean
  /** 直近 short window token 数 */
  shortTokens: number
  /** baseline per window (long / short で正規化) */
  baselinePerWindow: number
  /** actual multiplier */
  multiplierActual: number
}

// ============================================================================
// 1. computeAccumulatedActiveElapsed — sleep を差し引いた active elapsed
// ============================================================================

/**
 * wall-clock elapsed から OS suspend / sleep duration を差し引いた active elapsed を計算。
 *
 * @param bootAtMs            boot 時刻 ms
 * @param nowMs               現在 ms
 * @param accumulatedSleepMs  累積 sleep ms
 * @returns                   active elapsed ms (>= 0 を保証, 負なら 0 にクランプ)
 */
export function computeAccumulatedActiveElapsed(
  bootAtMs: number,
  nowMs: number,
  accumulatedSleepMs: number,
): number {
  const wall = nowMs - bootAtMs
  const elapsed = wall - accumulatedSleepMs
  return elapsed < 0 ? 0 : elapsed
}

// ============================================================================
// 2. evaluateContinuousRun — 連続稼働 evaluate の純関数版
// ============================================================================

/**
 * 連続稼働 detector の evaluate に対応する純関数。breach 候補を判定するのみで、
 * confirmCount gate / event emission / kill chain は呼び出し側責務。
 *
 * 既存 ContinuousRunDetector.evaluate() の数値挙動と 8 桁一致 (negative elapsed の 0 クランプ
 * までは class 側でしていなかったが、本関数では負値を 0 とする / wallElapsed 自体は class 側
 * と同一計算式)。
 */
export function evaluateContinuousRun(input: ContinuousRunInput): ContinuousRunOutput {
  if (input.bootAtMs === null) {
    return { elapsedMs: null, breachCandidate: false }
  }
  const wall = input.nowMs - input.bootAtMs
  const elapsed = wall - input.accumulatedSleepMs
  // 既存 class は負値も elapsed として返すが breach 判定は >= limit のみ。
  // 純関数としては elapsed をそのまま返し、breach 候補のみ判定する。
  const breachCandidate = elapsed >= input.limitMs
  return { elapsedMs: elapsed, breachCandidate }
}

// ============================================================================
// 3. evaluateCostCap — cost cap evaluate の純関数版
// ============================================================================

/**
 * cost cap detector の evaluate に対応する純関数。effective cap (= base * multiplier) を
 * 計算し、breach 候補と legit-window 抑止を分類する。
 *
 * 既存 CostCapDetector.evaluate() の数値挙動と 8 桁一致:
 *   - effectiveCap = capUsd * multiplier (LegitWindowGuard.effectiveCap と同じ式)
 *   - currentUsd >= effectiveCap → breach 候補
 *   - inLegitWindow && currentUsd >= capUsd && currentUsd < effectiveCap → 抑止
 */
export function evaluateCostCap(input: CostCapInput): CostCapOutput {
  const effectiveCapUsd = input.capUsd * input.effectiveMultiplier
  if (input.currentUsd >= effectiveCapUsd) {
    return {
      breachCandidate: true,
      suppressedByLegitWindow: false,
      effectiveCapUsd,
      currentUsd: input.currentUsd,
    }
  }
  if (input.inLegitWindow && input.currentUsd >= input.capUsd) {
    return {
      breachCandidate: false,
      suppressedByLegitWindow: true,
      effectiveCapUsd,
      currentUsd: input.currentUsd,
    }
  }
  return {
    breachCandidate: false,
    suppressedByLegitWindow: false,
    effectiveCapUsd,
    currentUsd: input.currentUsd,
  }
}

// ============================================================================
// 4. computeBaselinePerWindow — rate-spike baseline 計算
// ============================================================================

/**
 * sample 配列から baseline (long / short で正規化した per-window token 数) と
 * 直近 short window token 数を計算する純関数。
 *
 * 既存 RateSpikeDetector.evaluate() の同等コードと 8 桁一致:
 *   - baseline = totalTokens / numWindows where numWindows = longMs / shortMs
 *   - shortTokens = ts >= cur - shortMs の token 合計
 */
export interface BaselineComputation {
  shortTokens: number
  totalTokens: number
  baselinePerWindow: number
  numWindows: number
}

export function computeBaselinePerWindow(
  nowMs: number,
  samples: readonly RateSpikeSampleLite[],
  shortMs: number,
  longMs: number,
): BaselineComputation {
  const shortCutoff = nowMs - shortMs
  let shortTokens = 0
  let totalTokens = 0
  for (const s of samples) {
    totalTokens += s.tokens
    if (s.ts >= shortCutoff) shortTokens += s.tokens
  }
  const numWindows = longMs / shortMs
  const baselinePerWindow = totalTokens / numWindows
  return { shortTokens, totalTokens, baselinePerWindow, numWindows }
}

// ============================================================================
// 5. evaluateRateSpike — rate-spike multiplier breach 判定
// ============================================================================

/**
 * rate-spike detector の multiplier breach 候補判定。z-score / legit window 抑止は
 * 別途 (suppression-primitives.zScoreFilter / LegitWindowGuard) で処理する。
 *
 * 既存 RateSpikeDetector.evaluate() の数値挙動と 8 桁一致:
 *   - baseline < 1 (zero-near guard) → false
 *   - baseline < baselineMinTokens → suppressedByMinBaseline = true
 *   - shortTokens < baseline * multiplier → false
 *   - else → breach 候補 true
 */
export function evaluateRateSpike(input: RateSpikeInput): RateSpikeOutput {
  const { shortTokens, baselinePerWindow } = computeBaselinePerWindow(
    input.nowMs,
    input.samples,
    input.config.shortMs,
    input.config.longMs,
  )
  const multiplierActual = baselinePerWindow > 0 ? shortTokens / baselinePerWindow : 0

  // 既存 class と同じガード順序:
  if (baselinePerWindow < 1) {
    return {
      breachCandidate: false,
      suppressedByMinBaseline: false,
      shortTokens,
      baselinePerWindow,
      multiplierActual,
    }
  }
  if (baselinePerWindow < input.config.baselineMinTokens) {
    return {
      breachCandidate: false,
      suppressedByMinBaseline: true,
      shortTokens,
      baselinePerWindow,
      multiplierActual,
    }
  }
  if (shortTokens < baselinePerWindow * input.config.multiplier) {
    return {
      breachCandidate: false,
      suppressedByMinBaseline: false,
      shortTokens,
      baselinePerWindow,
      multiplierActual,
    }
  }
  return {
    breachCandidate: true,
    suppressedByMinBaseline: false,
    shortTokens,
    baselinePerWindow,
    multiplierActual,
  }
}

// ============================================================================
// 6. purgeOlderSamples — long window 外の sample を除去 (純関数 / 新配列を返す)
// ============================================================================

/**
 * sample 配列から long window 外 (cur - longMs より古い) を除いた新配列を返す純関数。
 * 既存 RateSpikeDetector.purgeOlder() と等価だが副作用なし。
 */
export function purgeOlderSamples(
  nowMs: number,
  samples: readonly RateSpikeSampleLite[],
  longMs: number,
): RateSpikeSampleLite[] {
  const cutoff = nowMs - longMs
  return samples.filter((s) => s.ts >= cutoff)
}

// ============================================================================
// 7. bucketTokensPerWindow — short window 単位で sample を bucket 化
// ============================================================================

/**
 * sample を short window 単位で bucket 化した token 配列を返す純関数。
 * idx=0 は最新 (= cur - shortMs 〜 cur), idx 増加で過去。
 *
 * 既存 RateSpikeDetector.bucketTokensPerWindow() と等価。
 */
export function bucketTokensPerWindow(
  nowMs: number,
  samples: readonly RateSpikeSampleLite[],
  shortMs: number,
  longMs: number,
): number[] {
  if (samples.length === 0) return []
  const numBuckets = Math.max(1, Math.floor(longMs / shortMs))
  const buckets: number[] = new Array<number>(numBuckets).fill(0)
  for (const s of samples) {
    const ageMs = nowMs - s.ts
    const idx = Math.min(numBuckets - 1, Math.max(0, Math.floor(ageMs / shortMs)))
    const cur = buckets[idx] ?? 0
    buckets[idx] = cur + s.tokens
  }
  return buckets
}

// ============================================================================
// 8. detectOutlier — 統一 outlier filter (Round 14 Dev-B Task B 新規)
// ============================================================================

/**
 * 統一 outlier filter input. detector 文脈に依存しない generic 形式で、
 * 「直近値 (current) が past 分布の z*σ 内なら抑止」判定を行う。
 *
 * suppression-primitives.zScoreFilter の薄いラッパだが、detector class が直接 zScoreFilter
 * を呼ぶ代わりに本 API を使うことで:
 *   - rate-spike / cost spike / latency spike を **同一シグネチャ** で扱える
 *   - 出力に detector 文脈の意味付け (suppress 理由 / 統計値) を付与できる
 *   - z-score=0 で filter 無効化 (常に通す) する慣用を統一
 */
export interface OutlierFilterInput {
  /** 評価対象の直近値 (= 直近 short-window の合計など) */
  current: number
  /** past サンプル配列 (length<2 で filter 無効, 自動 pass-through) */
  past: readonly number[]
  /** z-score 閾値 (default 2σ). 0 以下で filter 無効 (suppress=false 固定) */
  zThreshold?: number
}

export interface OutlierFilterOutput {
  /** true: filter 内 (= 統計的 noise) → 抑止すべき / false: outlier (= 通すべき) */
  suppress: boolean
  /** past 配列の平均 (past.length<2 で NaN) */
  mean: number
  /** past 配列の std-dev (past.length<2 で NaN) */
  stdDev: number
  /** 抑止閾値 (= mean + zThreshold * stdDev). past.length<2 で NaN */
  threshold: number
  /** echo back */
  current: number
  /** filter 適用条件: past.length>=2 かつ zThreshold>0 で true */
  filterApplied: boolean
}

/**
 * detectOutlier — past サンプル分布から current が outlier (= z*σ を超える)か判定する純関数。
 *
 * 用途:
 *   - rate_spike × boundary 偽陽性抑止 (multiplier 5x 到達でも統計 noise なら抑止)
 *   - cost spike 偽陽性抑止 (cap 倍率超過でも noise なら抑止)
 *   - 将来 latency / queue depth など別 detector でも再利用可能
 *
 * 数値挙動:
 *   - suppression-primitives.zScoreFilter と 8 桁一致 (test で verify)
 *   - past.length<2 / zThreshold<=0 で filterApplied=false, suppress=false (常に通す)
 *   - filterApplied=true 時: suppress = (current <= mean + z*stdDev)
 */
export function detectOutlier(input: OutlierFilterInput): OutlierFilterOutput {
  const zThreshold = input.zThreshold ?? 2
  const past = input.past.filter((v) => Number.isFinite(v))
  if (zThreshold <= 0 || past.length < 2) {
    return {
      suppress: false,
      mean: Number.NaN,
      stdDev: Number.NaN,
      threshold: Number.NaN,
      current: input.current,
      filterApplied: false,
    }
  }
  const mean = past.reduce((a, b) => a + b, 0) / past.length
  const variance = past.reduce((a, b) => a + (b - mean) ** 2, 0) / past.length
  const stdDev = Math.sqrt(variance)
  const threshold = mean + zThreshold * stdDev
  return {
    suppress: input.current <= threshold,
    mean,
    stdDev,
    threshold,
    current: input.current,
    filterApplied: true,
  }
}

// ============================================================================
// 9. evaluateRateSpikeWithZScore — rate-spike + z-score 統合 (Round 14 Dev-B Task B 新規)
// ============================================================================

/** evaluateRateSpikeWithZScore の追加入力 (RateSpikeInput 拡張). */
export interface RateSpikeWithZScoreInput extends RateSpikeInput {
  /** z-score 閾値 (default 2σ). 0 以下で z-score filter 無効. */
  zScoreThreshold?: number
}

/** evaluateRateSpikeWithZScore の出力 (RateSpikeOutput 拡張). */
export interface RateSpikeWithZScoreOutput extends RateSpikeOutput {
  /** z-score filter で抑止された (rate spike 候補だが統計 noise) */
  suppressedByZScore: boolean
  /** z-score 評価結果 (filterApplied=false なら全 NaN) */
  outlier: OutlierFilterOutput
}

/**
 * evaluateRateSpikeWithZScore — rate-spike multiplier 判定 + z-score outlier filter を 1 step で実行。
 *
 * 既存 RateSpikeDetector.evaluate() の「multiplier 判定 → z-score filter 適用」順序と等価:
 *   1. baseline < 1 / baseline < min → breachCandidate=false (z-score 評価しない)
 *   2. shortTokens < baseline*multiplier → breachCandidate=false (z-score 評価しない)
 *   3. shortTokens >= baseline*multiplier → z-score filter 適用、suppress=true で
 *      breachCandidate=false / suppressedByZScore=true、suppress=false で breachCandidate=true
 *
 * 数値挙動は既存 RateSpikeDetector.evaluate() と 8 桁一致 (legit-window 抑止は除外、
 * caller 側で別途 LegitWindowGuard を使う)。
 */
export function evaluateRateSpikeWithZScore(
  input: RateSpikeWithZScoreInput,
): RateSpikeWithZScoreOutput {
  const base = evaluateRateSpike(input)
  // breach 候補にならない場合は z-score 評価しない (既存 class と同順序)
  if (!base.breachCandidate) {
    return {
      ...base,
      suppressedByZScore: false,
      outlier: {
        suppress: false,
        mean: Number.NaN,
        stdDev: Number.NaN,
        threshold: Number.NaN,
        current: base.shortTokens,
        filterApplied: false,
      },
    }
  }
  // z-score 評価: bucket[0]=直近を shortTokens で上書きして past[1..]=過去 buckets
  const buckets = bucketTokensPerWindow(
    input.nowMs,
    input.samples,
    input.config.shortMs,
    input.config.longMs,
  )
  const past = buckets.slice(1)
  const outlier = detectOutlier({
    current: base.shortTokens,
    past,
    zThreshold: input.zScoreThreshold ?? 2,
  })
  if (outlier.suppress) {
    return {
      ...base,
      breachCandidate: false,
      suppressedByZScore: true,
      outlier,
    }
  }
  return {
    ...base,
    suppressedByZScore: false,
    outlier,
  }
}
