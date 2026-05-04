/**
 * suppression-primitives — Round 11 Dev-B (DEC-019-057 連動 / R10 Review-δ 残実装 6 件 #1).
 *
 * 関連:
 *   - DEC-019-007 / 008 / 050 / 051 / 053 / 054 / 055 / 056 / 057
 *   - Round 10 Dev-β 着地 (`tos-monitor.ts` 1,344 行) で実装した context-aware suppression
 *     を **detector 非依存の generic primitive** に再抽出し、別 detector / 別案件で
 *     再利用可能にする (Review-δ 50 控制再監査 §6 Round 11 引継 TODO #1)。
 *
 * 設計方針:
 *   - tos-monitor.ts 既存実装は **無改変** (file conflict 禁止 / 既存 161 tests regression 0).
 *   - 本ファイルは tos-monitor を **import しない** (逆方向 dependency 厳守).
 *   - 全 primitive は pure function or 軽量 class で side-effect 最小化、TimeSource を DI.
 *   - 4 primitive を export:
 *       1. heartbeatGapDetector  — OS suspend 検出 (continuous_run × sleep)
 *       2. legitWindowGuard      — 正当 spike window 抑止 (cost_cap × spike legit / rate_spike × spike legit)
 *       3. zScoreFilter          — 統計的 noise filter (rate_spike × boundary)
 *       4. clockSkewBoot         — 時刻巻き戻し時の再同期 (continuous_run × sleep の clock skew 隣接)
 *
 * 再利用例:
 *   - 別 detector (将来 G-V2-08 Gmail polling rate detector 等) で同じ抑止戦略を
 *     重複実装せず本 primitive を import.
 *   - 別案件 (PRJ-012 Sumi の rate guard / PRJ-018 cost watchdog) でも import 可能。
 *
 * 既存実装との関係:
 *   - tos-monitor.ts 内の RateSpikeDetector / CostCapDetector / ContinuousRunDetector の
 *     抑止ロジックは Round 10 Dev-β でクラス内に閉じている。
 *   - 本 primitive はその **本質的アルゴリズム** を一段抽象化し、計算結果のみ返す
 *     (副作用は呼び出し側責任)。
 *   - したがって既存 tos-monitor の評価結果と本 primitive の単体評価は **数値的に一致**
 *     することを test で検証する (regression セーフティネット)。
 */

// ============================================================================
// 共通型
// ============================================================================

/** ms 単位 timestamp 取得関数 (TimeSource.nowMs() 互換). */
export type NowMs = () => number

// ============================================================================
// 1. heartbeatGapDetector — OS suspend / wake event 検出
// ============================================================================

/**
 * heartbeat 1 サイクルの結果。
 *   - kind: 'normal'     通常稼働 (delta <= sleepGapMs)
 *   - kind: 'suspend'    OS suspend 判定 (delta > sleepGapMs); sleepMs に gap 値
 *   - kind: 'skew'       時刻巻き戻し (delta < 0); 呼び出し側で boot 再同期
 *   - kind: 'first'      初回 heartbeat (lastMs 不明)
 */
export type HeartbeatTickResult =
  | { kind: 'first'; tMs: number }
  | { kind: 'normal'; tMs: number; deltaMs: number }
  | { kind: 'suspend'; tMs: number; sleepMs: number }
  | { kind: 'skew'; tMs: number; backwardMs: number }

/**
 * heartbeatGapDetector — heartbeat 履歴から OS suspend / clock skew を判定する純関数。
 *
 * 用途: 連続稼働時間 detector が wall-clock elapsed から OS suspend duration を
 * 差し引いて active elapsed のみで breach 判定する際に使う。
 *
 * @param now           現在 ms
 * @param lastMs        前回 heartbeat ms (null = 初回)
 * @param sleepGapMs    suspend 判定閾値 (default 5min)
 * @returns             結果 (kind 別)
 */
export function heartbeatGapDetector(
  now: number,
  lastMs: number | null,
  sleepGapMs: number = 5 * 60 * 1000,
): HeartbeatTickResult {
  if (lastMs === null) {
    return { kind: 'first', tMs: now }
  }
  const delta = now - lastMs
  if (delta < 0) {
    return { kind: 'skew', tMs: now, backwardMs: -delta }
  }
  if (delta > sleepGapMs) {
    return { kind: 'suspend', tMs: now, sleepMs: delta }
  }
  return { kind: 'normal', tMs: now, deltaMs: delta }
}

// ============================================================================
// 2. legitWindowGuard — 正当 spike window 抑止
// ============================================================================

/**
 * legitWindowGuard — 「宣言した期間内は breach 抑止」戦略の generic state.
 *
 * 用途:
 *   - cost_cap × spike legit 抑止 (benchmark 連続実行の cap×N 一時許容)
 *   - rate_spike × spike legit 抑止 (大型 PR push の rate spike 一時許容)
 *   - 将来 G-V2-08 Gmail batch poll の rate 一時上限抑止 等
 *
 * 設計:
 *   - 純 class、TimeSource を DI、立て続けの宣言で延長可能 (max を採用しない、上書き)。
 *   - multiplier はオプション (cost-cap で使用、rate-spike では 1 で本抑止のみ).
 */
export interface LegitWindowState {
  /** 抑止有効中なら true */
  active: boolean
  /** 倍率 (multiplier=1 = 抑止のみ、>1 = cap 拡張) */
  multiplier: number
  /** 抑止終了時刻 ms (null = 未宣言 / 失効) */
  expiresAtMs: number | null
}

export class LegitWindowGuard {
  private expiresAtMs: number | null = null
  private multiplier = 1
  private declaredCount = 0

  constructor(private readonly now: NowMs) {}

  /**
   * 抑止 window を宣言。durationMs <= 0 や multiplier < 1 は no-op。
   * 既存宣言は上書き (延長 or 短縮 どちらも明示制御に従う)。
   */
  declare(durationMs: number, multiplier = 1): void {
    if (!Number.isFinite(durationMs) || durationMs <= 0) return
    if (!Number.isFinite(multiplier) || multiplier < 1) return
    this.expiresAtMs = this.now() + durationMs
    this.multiplier = multiplier
    this.declaredCount += 1
  }

  /** 現時点で抑止有効か。 */
  isActive(): boolean {
    return this.expiresAtMs !== null && this.now() < this.expiresAtMs
  }

  /** 現状を取得 (read-only snapshot). */
  state(): LegitWindowState {
    const active = this.isActive()
    return {
      active,
      multiplier: active ? this.multiplier : 1,
      expiresAtMs: this.expiresAtMs,
    }
  }

  /**
   * cap × multiplier の effective cap を計算。inactive 時は base cap をそのまま返す。
   */
  effectiveCap(baseCap: number): number {
    return this.isActive() ? baseCap * this.multiplier : baseCap
  }

  /** 宣言回数 (instrumentation 用) */
  get declarations(): number {
    return this.declaredCount
  }

  reset(): void {
    this.expiresAtMs = null
    this.multiplier = 1
    this.declaredCount = 0
  }
}

// ============================================================================
// 3. zScoreFilter — 統計的 noise filter
// ============================================================================

/**
 * zScoreFilter — bucket 配列から「直近値が過去分布の z 倍 std-dev 内なら抑止」判定する純関数。
 *
 * 用途:
 *   - rate_spike × boundary 偽陽性抑止 (multiplier 5x 到達でも統計的 noise 範囲内なら抑止)
 *   - 将来別 detector (cost spike / latency spike) でも再利用可能
 *
 * @param buckets       時系列 bucket (idx=0 が直近 shortWindow、残りが過去 baseline 用)
 * @param zThreshold    z-score 閾値 (default 2σ)。0 で filter 無効 (常に false=通す).
 * @returns             { suppress: boolean; mean; stdDev; threshold } — past サンプル数 < 2 なら suppress=false
 */
export interface ZScoreFilterResult {
  suppress: boolean
  /** past 配列の平均 (past.length < 2 では NaN) */
  mean: number
  /** past 配列の std-dev (past.length < 2 では NaN) */
  stdDev: number
  /** mean + zThreshold * stdDev (past.length < 2 では NaN) */
  threshold: number
  /** 評価対象 (buckets[0] = 直近 short window) */
  current: number
}

export function zScoreFilter(
  buckets: readonly number[],
  zThreshold = 2,
): ZScoreFilterResult {
  if (buckets.length === 0 || zThreshold <= 0) {
    return {
      suppress: false,
      mean: Number.NaN,
      stdDev: Number.NaN,
      threshold: Number.NaN,
      current: buckets[0] ?? 0,
    }
  }
  const current = buckets[0] ?? 0
  const past = buckets.slice(1).filter((v) => Number.isFinite(v))
  if (past.length < 2) {
    return {
      suppress: false,
      mean: Number.NaN,
      stdDev: Number.NaN,
      threshold: Number.NaN,
      current,
    }
  }
  const mean = past.reduce((a, b) => a + b, 0) / past.length
  const variance =
    past.reduce((a, b) => a + (b - mean) ** 2, 0) / past.length
  const stdDev = Math.sqrt(variance)
  const threshold = mean + zThreshold * stdDev
  return {
    suppress: current <= threshold,
    mean,
    stdDev,
    threshold,
    current,
  }
}

// ============================================================================
// 4. clockSkewBoot — 時刻巻き戻し時の boot 再同期戦略
// ============================================================================

/**
 * clockSkewBoot — 時刻が巻き戻った時に boot 時刻を再同期する純関数。
 *
 * 用途:
 *   - continuous_run × sleep / clock skew 偽陽性対策 (NTP 同期で時刻が逆行した瞬間に
 *     elapsed = now - bootAt が一気に減って正常値になるが、再同期ポリシーによっては
 *     bootAt も逆行値で更新する必要がある).
 *   - 将来 audit timestamp / SLA 計測でも再利用可能.
 *
 * 戦略:
 *   - 'reset_to_now'   : bootAt = now (新規スタート扱い、最も保守的)
 *   - 'preserve'       : bootAt 不変 (skew は無視、now 側で時刻補正される前提)
 *   - 'shift_by_delta' : bootAt += delta (delta < 0、相対関係を保つ)
 */
export type ClockSkewPolicy = 'reset_to_now' | 'preserve' | 'shift_by_delta'

export interface ClockSkewBootResult {
  /** 再同期後の bootAt ms */
  bootAtMs: number
  /** 巻き戻し量 ms (正の値) */
  backwardMs: number
  /** 採用ポリシー */
  policy: ClockSkewPolicy
}

export function clockSkewBoot(
  now: number,
  lastSeenMs: number,
  bootAtMs: number,
  policy: ClockSkewPolicy = 'reset_to_now',
): ClockSkewBootResult {
  const backward = lastSeenMs - now
  if (backward <= 0) {
    // skew 検出なし、現状維持
    return { bootAtMs, backwardMs: 0, policy }
  }
  switch (policy) {
    case 'reset_to_now':
      return { bootAtMs: now, backwardMs: backward, policy }
    case 'preserve':
      return { bootAtMs, backwardMs: backward, policy }
    case 'shift_by_delta':
      return { bootAtMs: bootAtMs - backward, backwardMs: backward, policy }
  }
}
