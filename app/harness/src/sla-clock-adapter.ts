/**
 * sla-clock-adapter — MonotonicClock を HITL-10 24h SLA orchestrator に注入する adapter
 * (Round 21 W4, Dev-HH 担当)
 *
 * 背景:
 *   Dev-EE が Round 20 で実装した `createPermissionOrchestrator` は port `nowMs: () => number`
 *   を 1 系統 wall-clock で要求している (17day-path-w3-rollback-permission-orchestrator.ts)。
 *   Dev-EE file は不可侵 (Round 21 領域制約) のため、本 adapter で MonotonicClock の
 *   2 系統 cross-check 結果を nowMs port に「橋渡し」する。
 *
 * 動作 (fail-closed 設計):
 *   - request 開始時の mark を保持
 *   - nowMs() 呼出のたびに monotonic 系の elapsed を Date 系起点に加算した値を返す
 *   - skew 検出時は wall-clock 起点 + monotonic elapsed の合成で「実時間進行は monotonic に従う」
 *     という保証を上位に提供する。これにより wall-clock 巻き戻りで SLA 判定が
 *     早期 timeout / 遅延 timeout に流れることを防ぐ。
 *   - skew 検出かつ explicit fail-closed mode 有効時、即座に SLA 越境とみなす ms を返し
 *     上位 orchestrator が timeout に丸めるように促す
 *
 * 不可侵:
 *   - Dev-EE 担当 17day-path-w3-rollback-permission-orchestrator.ts には touch しない
 *   - 本 adapter は外側で組み立てるだけ。orchestrator factory には変更を加えない。
 *
 * 設計原則:
 *   1. 既存 nowMs port shape を保つ → 上位 createPermissionOrchestrator はそのまま使える
 *   2. 単一 instance は 1 つの permission request lifecycle に対応する
 *      (mark 起点が固定されるため、再利用するなら resetMark() を呼ぶ)
 *   3. pure DI: MonotonicClock を注入することで test では FakeWall + FakeMono で
 *      NTP step / DST / process suspend 復帰を deterministic に再現可能
 */

import type { ClockMark, MonotonicClock } from './monotonic-clock.js'
import { APPROVAL_SLA_MS } from './17day-path-w3-rollback-permission-orchestrator.js'

// ============================================================================
// Public types
// ============================================================================

export interface SlaClockAdapterOptions {
  /**
   * skew 検出時の挙動。
   *   - 'fail_closed' (default): SLA 越境扱いの ms を返し、上位 orchestrator が timeout に丸める
   *   - 'pass_through': skew があっても monotonic elapsed を信じて nowMs を返す (audit のみ)
   */
  readonly onSkew?: 'fail_closed' | 'pass_through'
  /**
   * 上位 orchestrator が SLA を判定する基準値 ms。
   * 既定は HITL-10 の APPROVAL_SLA_MS (24h)。
   *
   * fail_closed mode 時、この値 + 1 を即座に返すことで上位の `tNow >= t0 + APPROVAL_SLA_MS`
   * 判定を確実に triggered にする。
   */
  readonly slaWindowMs?: number
}

export interface SlaClockAdapter {
  /**
   * createPermissionOrchestrator の `nowMs` port にそのまま渡せる関数。
   * 内部で markNow + elapsedMs + skew check を実行する。
   */
  readonly nowMs: () => number
  /**
   * permission request を再利用する場合の起点 mark リセット。
   * 通常は adapter 1 つにつき 1 lifecycle なので使用しないが、
   * 同一 adapter で複数 request を回す test では呼出可能。
   */
  resetMark(): void
  /**
   * 直近の skew 観測結果。fail_closed 発動有無の根拠として上位から参照可能。
   * 未呼出時は null。
   */
  lastSkewMs(): number | null
  /** skew が一度でも閾値超を観測したか。audit 用 read-only。 */
  skewObserved(): boolean
  /** 現在の起点 mark を read-only で返す (test 用)。 */
  startMark(): ClockMark
}

// ============================================================================
// Factory
// ============================================================================

/**
 * MonotonicClock を HITL-10 24h SLA に注入する adapter を組み立てる。
 *
 * 使い方 (本番):
 * ```ts
 *   const clock = createMonotonicClock()
 *   const adapter = createSlaClockAdapter(clock)
 *   const permission = createPermissionOrchestrator({
 *     approver,
 *     auditSink,
 *     nowMs: adapter.nowMs,  // 既存 port shape を満たす
 *   })
 * ```
 *
 * 動作:
 *   - 起点 t0 (wall-clock ms) は constructor 呼出時の mark.wallMs
 *   - nowMs() 呼出時:
 *       elapsed = clock.elapsedMs(startMark)
 *       wall-clock として上位に返す値 = startMark.wallMs + elapsed.monoElapsedMs
 *       (= 起点 + monotonic な経過。NTP backward step が起きても巻き戻らない)
 *       skew 検出 + onSkew='fail_closed' なら 起点 + slaWindowMs + 1 を返し、
 *       上位 orchestrator が timeout に丸める方向に倒す。
 */
export function createSlaClockAdapter(
  clock: MonotonicClock,
  options: SlaClockAdapterOptions = {},
): SlaClockAdapter {
  const onSkew = options.onSkew ?? 'fail_closed'
  const slaWindowMs = options.slaWindowMs ?? APPROVAL_SLA_MS

  let mark = clock.markNow()
  let lastSkew: number | null = null
  let everSkewed = false

  function computeNow(): number {
    const reading = clock.elapsedMs(mark)
    lastSkew = reading.skewMs
    if (reading.skewDetected) {
      everSkewed = true
      if (onSkew === 'fail_closed') {
        // 上位 createPermissionOrchestrator: tNow >= t0 + APPROVAL_SLA_MS で timeout
        // → 起点 + slaWindowMs + 1 を返せば必ず timeout 側に倒れる
        return mark.wallMs + slaWindowMs + 1
      }
    }
    // pass_through: monotonic elapsed を真とみなし wall-clock 起点に加算した値を返す
    // (NTP backward step 等の wall-clock 巻き戻りを上位に伝播させない)
    return mark.wallMs + reading.monoElapsedMs
  }

  return {
    nowMs: computeNow,
    resetMark() {
      mark = clock.markNow()
      lastSkew = null
      everSkewed = false
    },
    lastSkewMs: () => lastSkew,
    skewObserved: () => everSkewed,
    startMark: () => mark,
  }
}
