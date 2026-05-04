/**
 * heartbeat-gap-primitive — Round 14 Dev-B / Task A (DEC-019-057 連動).
 *
 * 目的:
 *   - tos-monitor.ts ContinuousRunDetector.recordHeartbeat() の **stateful** な
 *     heartbeat tracking ロジック (accumulatedSleep 累積 + clock skew → boot 再同期 +
 *     lastHeartbeatMs 更新) を **detector class 非依存の primitive** に再抽出する。
 *   - suppression-primitives.ts の heartbeatGapDetector (純判定) +
 *     clockSkewBoot (boot 再同期) を合成した **stateful 高位 primitive** として、
 *     別 detector / 別案件で同じ heartbeat tracking パターンを再実装させない。
 *
 * 設計方針:
 *   - tos-monitor.ts は無改変 (file conflict 禁止 / 既存 61 tests 数値 8 桁一致維持)。
 *   - 本ファイルは tos-monitor を **import しない** (逆方向 dependency 厳守、
 *     suppression-primitives.ts と同方針)。
 *   - state は class (HeartbeatGapTracker) で保持、計算は純関数 (heartbeatGapDetector +
 *     clockSkewBoot) に委譲。class 自体は thin wrapper。
 *   - 既存 ContinuousRunDetector.recordHeartbeat() と数値挙動 8 桁完全一致を test で verify。
 *   - 戻り値 contract: 0 (normal/first) / sleepMs (suspend) / -1 (skew) — 既存 wrapper と同一。
 *
 * 既存 tos-monitor との関係:
 *   - ContinuousRunDetector は Round 12-13 で既に primitive 委譲済 (heartbeatGapDetector +
 *     clockSkewBoot 個別呼出)。本 primitive は **両者を 1 つの API に統合** することで
 *     呼び出し側のボイラープレート (state 保持 + 分岐 switch) を圧縮する。
 *   - 既存 detector は本 primitive を採用する **採否評価** を Round 15 引継 (regression 0 が
 *     最優先のため、本 Round では primitive 化のみ)。
 *
 * 再利用例:
 *   - 将来 G-V2-08 Gmail polling rate detector で同一の heartbeat → suspend 検出パターン。
 *   - PRJ-018 cost watchdog の wake-up 検出。
 *   - PRJ-012 Sumi の rate guard。
 */

import {
  clockSkewBoot,
  heartbeatGapDetector,
  type ClockSkewPolicy,
} from './suppression-primitives.js'

// ============================================================================
// 型
// ============================================================================

/** ms 単位 timestamp 取得関数 (TimeSource.nowMs() 互換). */
export type NowMs = () => number

/** heartbeat tick 結果。ContinuousRunDetector.recordHeartbeat() 戻り値と同 contract。 */
export type HeartbeatTrackResult =
  | { kind: 'first'; gap: 0; tMs: number }
  | { kind: 'normal'; gap: 0; tMs: number; deltaMs: number }
  | { kind: 'suspend'; gap: number; tMs: number; sleepMs: number }
  | { kind: 'skew'; gap: -1; tMs: number; backwardMs: number; bootAtMs: number | null }

/** HeartbeatGapTracker 設定 (DI). */
export interface HeartbeatGapTrackerOptions {
  /** 現在時刻取得関数 (TimeSource.nowMs() 互換). */
  now: NowMs
  /** suspend 判定閾値 ms (default 5min)。delta > これで suspend. */
  sleepGapMs?: number
  /** clock skew 検出時の boot 再同期 policy (default 'reset_to_now'). */
  skewPolicy?: ClockSkewPolicy
}

/** tracker 内部状態の read-only snapshot (instrumentation 用). */
export interface HeartbeatGapTrackerState {
  bootAtMs: number | null
  lastHeartbeatMs: number | null
  accumulatedSleepMs: number
}

// ============================================================================
// HeartbeatGapTracker — stateful primitive
// ============================================================================

/**
 * HeartbeatGapTracker — heartbeat 履歴と boot 状態を保持する stateful primitive。
 *
 * 内部状態:
 *   - bootAtMs           : markBoot() で設定された boot 時刻 (clock skew で再同期される)
 *   - lastHeartbeatMs    : 直前 heartbeat (suspend / normal で更新, skew で再同期)
 *   - accumulatedSleepMs : suspend 検出時に加算される総 sleep 時間
 *
 * API:
 *   - markBoot()          : boot 時刻を now() に設定 (再呼出で再起動扱い)
 *   - recordHeartbeat()   : heartbeat tick. heartbeatGapDetector + clockSkewBoot 委譲
 *   - state()             : read-only snapshot (instrumentation 用)
 *   - reset()             : 全状態クリア
 *   - hasBoot             : markBoot() 後 true
 *   - accumulatedSleep    : 累積 sleep ms (drill #2 検証用)
 */
export class HeartbeatGapTracker {
  private bootAtMs: number | null = null
  private lastHeartbeatMs: number | null = null
  private accumulatedSleepMs = 0
  private readonly now: NowMs
  private readonly sleepGapMs: number
  private readonly skewPolicy: ClockSkewPolicy

  constructor(opts: HeartbeatGapTrackerOptions) {
    if (typeof opts.now !== 'function') {
      throw new Error('HeartbeatGapTracker: now (NowMs) required')
    }
    this.now = opts.now
    this.sleepGapMs = opts.sleepGapMs ?? 5 * 60 * 1000
    this.skewPolicy = opts.skewPolicy ?? 'reset_to_now'
  }

  /** boot 時刻を now() に再同期 (運用開始時 / 再起動時に呼ぶ). */
  markBoot(): void {
    const t = this.now()
    this.bootAtMs = t
    this.lastHeartbeatMs = t
    this.accumulatedSleepMs = 0
  }

  /**
   * heartbeat tick — heartbeatGapDetector + clockSkewBoot 委譲。
   *
   * 戻り値 contract (既存 ContinuousRunDetector.recordHeartbeat() と同一):
   *   - 0  : 通常 / 初回
   *   - >0 : suspend 検出 (戻り値 = sleep duration ms)
   *   - -1 : clock skew 検出 (boot 再同期済)
   *
   * 構造化結果 (kind 別) も同時に返したい場合は recordHeartbeatDetailed() を使う。
   */
  recordHeartbeat(): number {
    return this.recordHeartbeatDetailed().gap
  }

  /**
   * heartbeat tick — 構造化結果版 (kind 別 detail を返す)。
   *
   * recordHeartbeat() と同じ state 更新を行うが、戻り値が discriminated union 形式。
   */
  recordHeartbeatDetailed(): HeartbeatTrackResult {
    const t = this.now()
    const result = heartbeatGapDetector(t, this.lastHeartbeatMs, this.sleepGapMs)
    switch (result.kind) {
      case 'first':
        this.lastHeartbeatMs = t
        return { kind: 'first', gap: 0, tMs: t }
      case 'normal':
        this.lastHeartbeatMs = t
        return { kind: 'normal', gap: 0, tMs: t, deltaMs: result.deltaMs }
      case 'suspend':
        this.accumulatedSleepMs += result.sleepMs
        this.lastHeartbeatMs = t
        return { kind: 'suspend', gap: result.sleepMs, tMs: t, sleepMs: result.sleepMs }
      case 'skew': {
        // clockSkewBoot に委譲して bootAtMs を再同期。bootAtMs=null (markBoot 未実行)
        // の場合は boot 不変 (primitive 結果は破棄)。
        this.lastHeartbeatMs = t
        if (this.bootAtMs !== null) {
          const skew = clockSkewBoot(t, this.bootAtMs, this.bootAtMs, this.skewPolicy)
          this.bootAtMs = skew.bootAtMs
        }
        return {
          kind: 'skew',
          gap: -1,
          tMs: t,
          backwardMs: result.backwardMs,
          bootAtMs: this.bootAtMs,
        }
      }
    }
  }

  /** read-only snapshot. */
  state(): HeartbeatGapTrackerState {
    return {
      bootAtMs: this.bootAtMs,
      lastHeartbeatMs: this.lastHeartbeatMs,
      accumulatedSleepMs: this.accumulatedSleepMs,
    }
  }

  reset(): void {
    this.bootAtMs = null
    this.lastHeartbeatMs = null
    this.accumulatedSleepMs = 0
  }

  /** markBoot() 後 true. */
  get hasBoot(): boolean {
    return this.bootAtMs !== null
  }

  /** 累積 sleep ms (drill #2 検証用 instrumentation). */
  get accumulatedSleep(): number {
    return this.accumulatedSleepMs
  }

  /** 直前 heartbeat ms (instrumentation 用). null = 未記録. */
  get lastHeartbeat(): number | null {
    return this.lastHeartbeatMs
  }

  /** boot 時刻 (instrumentation 用). null = markBoot 未実行 or skew 'preserve' policy. */
  get bootAt(): number | null {
    return this.bootAtMs
  }
}

// ============================================================================
// pure helper: trackHeartbeatStateless — stateless 版 (state を caller が保持)
// ============================================================================

/** stateless tick の入力 (caller が state を持つ場合の純関数 API). */
export interface StatelessHeartbeatInput {
  /** 現在 ms */
  nowMs: number
  /** 直前 heartbeat ms (null = 初回) */
  lastHeartbeatMs: number | null
  /** boot 時刻 (null = 未起動). skew 時に再同期される. */
  bootAtMs: number | null
  /** suspend 判定閾値 ms */
  sleepGapMs?: number
  /** skew policy */
  skewPolicy?: ClockSkewPolicy
}

/** stateless tick の出力 (caller が次回入力に使う). */
export interface StatelessHeartbeatOutput {
  /** 既存 contract と同一: 0 (normal/first) / sleepMs (suspend) / -1 (skew) */
  gap: number
  /** kind discriminator */
  kind: 'first' | 'normal' | 'suspend' | 'skew'
  /** 次回呼出に渡すべき lastHeartbeatMs (= nowMs) */
  nextLastHeartbeatMs: number
  /** 次回呼出に渡すべき bootAtMs (skew 時のみ更新, それ以外は echo back) */
  nextBootAtMs: number | null
  /** suspend 時に加算すべき sleep ms (それ以外 0) */
  suspendDeltaMs: number
}

/**
 * heartbeatGapDetector + clockSkewBoot を合成した **純関数版**。
 * caller が state (lastHeartbeatMs / bootAtMs / accumulatedSleep) を保持する場合に使う。
 *
 * HeartbeatGapTracker と数値挙動 8 桁一致 (test で verify)。
 */
export function trackHeartbeatStateless(input: StatelessHeartbeatInput): StatelessHeartbeatOutput {
  const sleepGapMs = input.sleepGapMs ?? 5 * 60 * 1000
  const skewPolicy = input.skewPolicy ?? 'reset_to_now'
  const result = heartbeatGapDetector(input.nowMs, input.lastHeartbeatMs, sleepGapMs)
  switch (result.kind) {
    case 'first':
      return {
        gap: 0,
        kind: 'first',
        nextLastHeartbeatMs: input.nowMs,
        nextBootAtMs: input.bootAtMs,
        suspendDeltaMs: 0,
      }
    case 'normal':
      return {
        gap: 0,
        kind: 'normal',
        nextLastHeartbeatMs: input.nowMs,
        nextBootAtMs: input.bootAtMs,
        suspendDeltaMs: 0,
      }
    case 'suspend':
      return {
        gap: result.sleepMs,
        kind: 'suspend',
        nextLastHeartbeatMs: input.nowMs,
        nextBootAtMs: input.bootAtMs,
        suspendDeltaMs: result.sleepMs,
      }
    case 'skew': {
      let nextBootAtMs: number | null = input.bootAtMs
      if (input.bootAtMs !== null) {
        const skew = clockSkewBoot(input.nowMs, input.bootAtMs, input.bootAtMs, skewPolicy)
        nextBootAtMs = skew.bootAtMs
      }
      return {
        gap: -1,
        kind: 'skew',
        nextLastHeartbeatMs: input.nowMs,
        nextBootAtMs,
        suspendDeltaMs: 0,
      }
    }
  }
}
