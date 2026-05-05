/**
 * monotonic-clock — system clock 異常 (NTP sync / DST / manual change) に耐える
 * 経過時間計測ソース (Round 21 W4, Dev-HH 担当)
 *
 * 背景:
 *   既存 HITL-10 24h SLA wall-clock 検証は `Date.now()` のみで実装されている (Dev-EE 担当)。
 *   Date.now() は system clock を反映するため、以下の事象で経過計算が破綻する:
 *     1. NTP sync による wall-clock の前後巻き戻り (数百ms 〜 数秒)
 *     2. DST 切替 / Owner 手動 timezone 変更 (1h 単位の jump)
 *     3. プロセス suspend / OS sleep 後の system clock skew
 *     4. VM clock drift (host VM の clock skew)
 *
 *   24h SLA は wall-clock 越境を「丁寧に」検出するため、これらの事象で
 *   早期/遅延 timeout 判定が起きないよう monotonic source を導入する。
 *
 * 設計原則:
 *   1. **二系統 cross-check**: Date.now() (wall-clock) と performance.now()
 *      (Node.js では process.hrtime に基づく monotonic) を独立して計測し、
 *      経過 ms の乖離 (skew) が閾値を超えたら system clock 異常と判定して
 *      fail-closed (= 上位は SLA timeout に丸める方向で安全側) する。
 *   2. **port 注入**: 既存 W3 orchestrator の `nowMs: () => number` を
 *      壊さないため、本 module は新 port `MonotonicClock` を提供し、
 *      既存 port を上から包む adapter を別 file で用意する (sla-clock-adapter.ts)。
 *      これにより Dev-EE / Dev-BB 既存 file 無改変で接続可能。
 *   3. **pure function + DI**: 全ての時刻取得は constructor に注入された
 *      `wallNowMs` / `monoNowMs` の 2 つの関数経由で行う。test では fixed clock
 *      を注入して deterministic に skew を再現できる。
 *   4. **ClockMark 値型**: mark/elapsed パターンで「ある時点からの経過」を
 *      取り出す。両系統の起点 ms を 1 つの不可変値にまとめ、後で elapsedMs
 *      呼出時に二系統で elapsed を計算する。
 *
 * Public API:
 *   - MonotonicClock interface (markNow / elapsedMs / detectSkew)
 *   - createMonotonicClock(options)
 *   - DEFAULT_SKEW_THRESHOLD_MS = 5_000 (5 秒) — 24h SLA に対し十分小さく、
 *     かつ NTP step による wall-clock 巻き戻りを安定検出できる目安
 *
 * 不可侵:
 *   - Dev-EE 担当 17day-path-w3-rollback-permission-orchestrator.ts には touch しない
 *   - Dev-GG 担当 BreachCounter 永続化 / runtime-bridge file には touch しない
 *   - control 本体 (openclaw-runtime/src/controls/*) 無改変
 */

// ============================================================================
// Public types
// ============================================================================

/**
 * 不可変の clock mark。markNow() の戻り値として 2 系統の ms を 1 つにまとめる。
 *
 * - wallMs: Date.now() 系 (system clock 反映, monotonic 保証なし)
 * - monoMs: performance.now() 系 (process 開始からの monotonic 単調増加)
 */
export interface ClockMark {
  readonly wallMs: number
  readonly monoMs: number
}

/**
 * 経過時間計算結果。両系統の elapsed と乖離 (skew) を保持する。
 *
 * skewMs = wallElapsedMs - monoElapsedMs
 *   - 0 近傍: system clock 正常
 *   - 正の大きな値: wall-clock が前進し過ぎ (NTP forward step / OS sleep 復帰時 jump)
 *   - 負の大きな値: wall-clock が巻き戻り (NTP backward step / 手動変更)
 */
export interface ElapsedReading {
  readonly wallElapsedMs: number
  readonly monoElapsedMs: number
  readonly skewMs: number
  /** |skewMs| が閾値超で系異常と判定された場合 true */
  readonly skewDetected: boolean
}

/**
 * MonotonicClock port — markNow + elapsedMs + detectSkew を提供する。
 *
 * 上位 (sla-clock-adapter) はこれを使って HITL-10 の 24h SLA 計算を
 * monotonic 系で行い、wall-clock 異常時は fail-closed (timeout 側) に倒す。
 */
export interface MonotonicClock {
  /** 現在時刻を 2 系統で取得し ClockMark にする (副作用なし)。 */
  markNow(): ClockMark
  /** ある起点 mark からの経過を 2 系統で計算する。 */
  elapsedMs(start: ClockMark): ElapsedReading
  /** 単純に skew だけ知りたい場合の short-cut (内部で markNow + elapsedMs)。 */
  detectSkew(start: ClockMark): boolean
  /** skew 判定閾値 (ms)。fail-closed の運用判断材料として上位から参照可能。 */
  readonly skewThresholdMs: number
}

// ============================================================================
// 定数
// ============================================================================

/**
 * skew 判定の既定閾値 (ms)。
 *
 * 5_000 ms (= 5 秒) を採用する理由:
 *   - 24h SLA = 86_400_000 ms に対し 0.0058% で、SLA 判定の精度を損なわない
 *   - 一般的な NTP sync の 1 step 補正 (128ms 〜 数秒) より大きく、
 *     正常 NTP では誤検出しない
 *   - 一方 NTP step による秒単位の jump (典型 1〜30s) は確実に検出できる
 *   - DST 切替 (1h jump = 3_600_000ms) や手動 timezone 変更は確実に超える
 *   - process suspend (OS sleep) 復帰時の数十秒 jump も確実に検出
 */
export const DEFAULT_SKEW_THRESHOLD_MS = 5_000

// ============================================================================
// Factory
// ============================================================================

export interface MonotonicClockOptions {
  /** wall-clock 取得関数 (Date.now() 等)。test では固定値 / 配列を返す mock を注入可能。 */
  readonly wallNowMs?: () => number
  /** monotonic 取得関数 (performance.now() 等)。Node では > 0 の単調増加 number。 */
  readonly monoNowMs?: () => number
  /** skew 判定閾値 (ms)。デフォルト DEFAULT_SKEW_THRESHOLD_MS。 */
  readonly skewThresholdMs?: number
}

/**
 * MonotonicClock factory。
 *
 * @param options.wallNowMs   wall-clock 取得関数 (省略時 Date.now)
 * @param options.monoNowMs   monotonic 取得関数 (省略時 performance.now)
 * @param options.skewThresholdMs  skew 判定閾値 ms (省略時 5000)
 *
 * test では `wallNowMs` を制御して NTP step / DST / manual change を
 * deterministic に再現できる。本番では省略して default を使う。
 */
export function createMonotonicClock(
  options: MonotonicClockOptions = {},
): MonotonicClock {
  const wallNowMs = options.wallNowMs ?? Date.now
  // performance は Node 16+ で global。test 注入で完全代替可能。
  const monoNowMs =
    options.monoNowMs ??
    (typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? () => performance.now()
      : () => Date.now())
  const skewThresholdMs = options.skewThresholdMs ?? DEFAULT_SKEW_THRESHOLD_MS

  return {
    skewThresholdMs,
    markNow() {
      // 2 系統の取得は限りなく同時に行う (関数呼出の間で実時間が経過しないことを期待)
      const wallMs = wallNowMs()
      const monoMs = monoNowMs()
      return { wallMs, monoMs }
    },
    elapsedMs(start) {
      const wallElapsedMs = wallNowMs() - start.wallMs
      const monoElapsedMs = monoNowMs() - start.monoMs
      const skewMs = wallElapsedMs - monoElapsedMs
      const skewDetected = Math.abs(skewMs) > skewThresholdMs
      return { wallElapsedMs, monoElapsedMs, skewMs, skewDetected }
    },
    detectSkew(start) {
      const wallElapsedMs = wallNowMs() - start.wallMs
      const monoElapsedMs = monoNowMs() - start.monoMs
      const skewMs = wallElapsedMs - monoElapsedMs
      return Math.abs(skewMs) > skewThresholdMs
    },
  }
}
