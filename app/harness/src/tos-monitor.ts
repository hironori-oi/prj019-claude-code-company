/**
 * tos-monitor — BAN 防御コア (運用 MVP) / CB-D-W2-06 本実装。
 *
 * 関連必須コントロール / 決裁:
 *   - DEC-019-008  NG-3 暫定値 (12h/日 + $1,000/月相当 hard cap)
 *   - DEC-019-050  Anthropic API key spend cap $30/月 (Hard cap)
 *   - DEC-019-051  subscription 主軸運用方針 (95% subscription + 5% API ≤$30 = 月 ≤$430)
 *   - DEC-019-055/056  Round 8/9 完遂着地 + 5/22 朝公開前倒し
 *   - G-V2-08 警告メール監視 (interface stub のみ、Gmail 実装は W2 後半 CB-D-W2-09)
 *   - G-04   cost watchdog 3 段階閾値 (cost-tracker / usage-monitor 既存接続)
 *   - G-05/06  kill-switch SIGTERM→SIGKILL chain + circuit-breaker forceOpen 連動
 *
 * 責務 (4 detectors + 2 hooks):
 *   1. ContinuousRunDetector  — 連続稼働時間 (案 B 16h/$100/$500 既定、案 A 12h, 案 C 24h reject)
 *   2. CostCapDetector        — apiUsdMonthly が cap 超過 ($30 Hard / $100 案 B 想定)
 *   3. RateSpikeDetector      — 直近 1h token 消費が 24h 平均の 5x 超
 *   4. (Anthropic 警告メール) — interface stub + MockAnthropicWarningSource
 *   + shouldFallbackToApiKey hook (P-E フォールバック判断 / CB-D-W2-10)
 *   + Audit hook (audit/ append-only に monitor:* event を書込)
 *
 * 設計方針:
 *   - 既存 usage-monitor / cost-tracker を破壊せず補完 (G-04 / NG-3 12h は usage-monitor が継続所管)。
 *   - tos-monitor は NG-3 上限の **設定切替** + **rate spike 検知** + **警告メール検知** + **fallback 判断**
 *     を新たに統括する。
 *   - 各 detector は confirmCount (default 2) で連続検知必須化、false-positive を抑制。
 *     sliding window 1h / 24h は injectable な samplerWindowMs を持つ。
 *   - time-source.ts 注入で決定論的テスト。
 *
 * 案 B / 案 C 採用根拠 (Research Round 5 §3.4 / §6 推奨):
 *   - 案 B (16h/$100/$500) = CEO 推奨 / API 換算月 $500-870 中央値で NG-3 50% 安全側、Phase 1 月 45-75 ループ実装可。
 *   - 案 C (24/$300/$1,300) = REJECT / NG-3 BAN 12 ヶ月 60-80% で許容外、subscription $1,300 は DEC-019-051 上限 $430 抵触。
 *   - 設計は **案 B を default**、案 A 12h 既定 / 案 C 24h は config 切替可能 (運用判断逃さない柔軟性)。
 */

import type { CircuitBreakerOpenTarget, KillSwitch } from './kill-switch.js'
import type { CostTracker } from './cost-tracker.js'
import type { TimeSource } from './time-source.js'
import {
  LegitWindowGuard,
  clockSkewBoot,
  heartbeatGapDetector,
  zScoreFilter,
} from './suppression-primitives.js'
import {
  bucketTokensPerWindow as bucketTokensPerWindowFn,
  computeBaselinePerWindow,
  evaluateContinuousRun as evaluateContinuousRunFn,
  evaluateCostCap as evaluateCostCapFn,
  purgeOlderSamples,
  type RateSpikeSampleLite,
} from './detector-functions.js'

// ============================================================================
// 型定義
// ============================================================================

/**
 * tos-monitor が emit する event 種別。
 * audit/ には `monitor:*` 名前空間で append される。
 */
export type TosMonitorEventType =
  | 'monitor:ng3-time-breach'
  | 'monitor:cost-cap-breach'
  | 'monitor:rate-spike'
  | 'monitor:warning-email'
  | 'monitor:fallback-decision'

/** auto_stop / hard_fail の 2 段階 tier (cost-tracker watchdog の 3 段階より単純化)。 */
export type TosMonitorTier = 'auto_stop' | 'hard_fail'

export interface TosMonitorEvent {
  type: TosMonitorEventType
  ts: string
  tier: TosMonitorTier | null
  reason: string
  detail: Record<string, unknown>
}

/** event listener (audit hook 用). */
export type TosMonitorListener = (ev: TosMonitorEvent) => void | Promise<void>

/**
 * NG-3 採択案。Research Round 5 §3.2 比較表より。
 *   - plan_a_12h  = DEC-019-008 暫定 (現状)
 *   - plan_b_16h  = CEO 推奨 / 案 B (16h/$100/$500)
 *   - plan_c_24h  = reject / 24/7 BAN 60-80% 許容外
 */
export type Ng3Plan = 'plan_a_12h' | 'plan_b_16h' | 'plan_c_24h'

/**
 * NG-3 採択案ごとの設定。値は Research Round 5 §3.2 / §4 試算根拠より。
 */
export interface Ng3PlanConfig {
  /** 連続稼働時間上限 (ms) */
  continuousRunMs: number
  /** API 月次 cap (USD) — Hard cap (subscription 込み合算) */
  apiUsdMonthlyHardCap: number
  /** subscription + API 合算月予算 (USD、参考値) */
  combinedMonthlyCap: number
  /** 案コメント (リテラル) */
  description: string
}

export const NG3_PLANS: Readonly<Record<Ng3Plan, Ng3PlanConfig>> = Object.freeze({
  plan_a_12h: {
    continuousRunMs: 12 * 3600 * 1000,
    apiUsdMonthlyHardCap: 30, // DEC-019-050 Hard cap
    combinedMonthlyCap: 430, // DEC-019-051 subscription 95% + API 5%
    description:
      'Plan A 12h/日 + API $30 Hard cap (DEC-019-008 暫定 / Research Round 5 §3.2 案 A)',
  },
  plan_b_16h: {
    continuousRunMs: 16 * 3600 * 1000,
    apiUsdMonthlyHardCap: 100, // 案 B 漸進拡張 ($30 → $100)
    combinedMonthlyCap: 500, // 案 B subscription $400 + API $100
    description:
      'Plan B 16h/日 + API $100 (CEO 推奨 / Research Round 5 §3.2 案 B)',
  },
  plan_c_24h: {
    continuousRunMs: 24 * 3600 * 1000,
    apiUsdMonthlyHardCap: 300, // 案 C reject 上限
    combinedMonthlyCap: 1300, // 案 C subscription $1,000 + API $300
    description:
      'Plan C 24/7 + API $300 (REJECT / NG-3 BAN 60-80% / DEC-019-051 上限抵触 / Research Round 5 §3.2 案 C)',
  },
})

// ============================================================================
// Anthropic 警告メール監視 (CB-D-W2-09 stub)
// ============================================================================

/**
 * Anthropic 警告メール 1 件を表す event。
 * 本番 Gmail API 統合は W2 後半 (CB-D-W2-09) で MockAnthropicWarningSource を
 * GmailAnthropicWarningSource に差し替える。
 */
export interface WarningEvent {
  /** 受信時刻 ISO8601 */
  receivedAt: string
  /** Gmail message id (mock では UUID) */
  messageId: string
  /** メール件名 */
  subject: string
  /** 警告分類 (5 種類 fixture: rate / capacity / billing / tos_warning / final_warning) */
  category:
    | 'rate'
    | 'capacity'
    | 'billing'
    | 'tos_warning'
    | 'final_warning'
  /** P-E フォールバック判断のために重要度を 1〜5 で示す (5 = 即フォールバック) */
  severity: 1 | 2 | 3 | 4 | 5
  /** 抜粋本文 (PII redaction 済み) */
  excerpt: string
}

export interface AnthropicWarningSource {
  /** 1 回 polling して未処理 event を返す。実装は冪等であること (重複 messageId 排除)。 */
  poll(): Promise<WarningEvent[]>
}

// ============================================================================
// P-E フォールバック判断 (CB-D-W2-10 統合)
// ============================================================================

/** subscription session 状態 (claude.ai OAuth セッション)。 */
export type SubscriptionSessionState = 'active' | 'rate_limited' | 'expired' | 'revoked'

/** P-E (API キー従量) フォールバック判断 input。 */
export interface FallbackDecisionInput {
  /** 現在の subscription session 状態 */
  subscription: SubscriptionSessionState
  /** Anthropic 警告メール検出件数 (直近 24h) */
  warningCount: number
  /** 警告メール最大重要度 (なし = 0) */
  maxWarningSeverity: 0 | 1 | 2 | 3 | 4 | 5
  /** 直近 cost watchdog tier */
  costTier: 'warn' | 'auto_stop' | 'hard_fail' | null
  /** NG-3 breach 履歴 (直近 7 日件数) */
  ng3BreachCount7d: number
  /** 手動オーバーライド (Owner からの強制 fallback) */
  manualOverride?: boolean
}

export type FallbackReason =
  | 'subscription_warning'
  | 'ng3_breach'
  | 'manual'
  | 'no_action'

export interface FallbackDecision {
  shouldFallback: boolean
  reason: FallbackReason
  /** Owner エスカレーション必須か (重大判定時 true) */
  escalateToOwner: boolean
  /** 判断根拠 (audit / runbook 用) */
  rationale: string
}

/**
 * P-E フォールバック判断 純関数。
 *
 * 判定優先度 (上から):
 *   1. manualOverride = true        → manual / escalateToOwner=true
 *   2. subscription = revoked       → subscription_warning / escalateToOwner=true
 *   3. maxWarningSeverity >= 4      → subscription_warning / escalateToOwner=true (final_warning / tos_warning)
 *   4. ng3BreachCount7d >= 1        → ng3_breach / escalateToOwner=true
 *   5. subscription = rate_limited && warningCount >= 2 → subscription_warning / escalateToOwner=false
 *   6. それ以外                      → no_action / escalateToOwner=false
 *
 * 既存 wrapper.ts factory pattern と互換: subprocess 切替 (Mock→Real) は
 * 本関数の出力を見て上位 orchestrator が決定するため、本関数は副作用ゼロ。
 */
export function shouldFallbackToApiKey(input: FallbackDecisionInput): FallbackDecision {
  if (input.manualOverride === true) {
    return {
      shouldFallback: true,
      reason: 'manual',
      escalateToOwner: true,
      rationale: 'Owner 手動オーバーライド (manualOverride=true)',
    }
  }
  if (input.subscription === 'revoked') {
    return {
      shouldFallback: true,
      reason: 'subscription_warning',
      escalateToOwner: true,
      rationale: 'subscription session = revoked (BAN 確定濃厚)',
    }
  }
  if (input.maxWarningSeverity >= 4) {
    return {
      shouldFallback: true,
      reason: 'subscription_warning',
      escalateToOwner: true,
      rationale: `Anthropic warning email severity=${input.maxWarningSeverity} (final/tos_warning 検知)`,
    }
  }
  if (input.ng3BreachCount7d >= 1) {
    return {
      shouldFallback: true,
      reason: 'ng3_breach',
      escalateToOwner: true,
      rationale: `NG-3 breach count 7d=${input.ng3BreachCount7d} (DEC-019-008 抵触)`,
    }
  }
  if (input.subscription === 'rate_limited' && input.warningCount >= 2) {
    return {
      shouldFallback: true,
      reason: 'subscription_warning',
      escalateToOwner: false,
      rationale: `subscription rate_limited + warning ${input.warningCount} 件 (一時 fallback)`,
    }
  }
  return {
    shouldFallback: false,
    reason: 'no_action',
    escalateToOwner: false,
    rationale: '通常稼働継続 (subscription active / 警告軽微)',
  }
}

// ============================================================================
// Detector 共通 — confirmCount (連続検知) sliding window
// ============================================================================

/**
 * 連続検知カウンタ (false-positive 抑制)。
 * detector が breach を検出するたびに increment、reset 条件で 0 に戻す。
 * confirmCount に達した時点で初めて event emit する。
 */
class ConfirmGate {
  private current = 0

  constructor(private readonly threshold: number) {
    if (threshold < 1) throw new Error(`ConfirmGate: threshold must be >= 1 (got ${threshold})`)
  }

  /** breach 検知時に呼ぶ。confirmCount に到達したら true を返す (1 度だけ)。 */
  hit(): boolean {
    this.current += 1
    return this.current >= this.threshold
  }

  /** 検知されなかった (clean tick) 時に呼ぶ。カウンタを 0 にリセット。 */
  miss(): void {
    this.current = 0
  }

  /** 1 度 fire 済の event を再 fire させたい時に呼ぶ (drill 用)。 */
  reset(): void {
    this.current = 0
  }

  get count(): number {
    return this.current
  }
}

// ============================================================================
// TosMonitor 本体
// ============================================================================

export interface TosMonitorOptions {
  /** NG-3 採択案 (default plan_b_16h = CEO 推奨) */
  ng3Plan?: Ng3Plan
  /**
   * NG-3 採択案を上書きする pinpoint 設定。指定時は ng3Plan より優先。
   *   - continuousRunMs: 連続稼働 ms 上限
   *   - apiUsdMonthlyHardCap: API 月次 hard cap
   */
  override?: {
    continuousRunMs?: number
    apiUsdMonthlyHardCap?: number
    combinedMonthlyCap?: number
  }
  /** 各 detector の連続検知 confirmCount (default 2) */
  confirmCount?: number
  /** rate spike 検知 sampler window (default 1h) */
  shortWindowMs?: number
  /** rate spike 検知 baseline window (default 24h) */
  longWindowMs?: number
  /** rate spike 倍率閾値 (default 5x) */
  rateSpikeMultiplier?: number
  /** Round 10: rate spike baseline 最小値 (default 10 tokens/window)。これ未満は breach 抑止。 */
  rateSpikeBaselineMinTokens?: number
  /** Round 10: rate spike z-score 閾値 (default 2σ)。0 で z-score filter 無効。 */
  rateSpikeZScoreThreshold?: number
  /** Round 10: continuous run sleep gap 検出閾値 (default 5min)。これを超える heartbeat 間隔は OS suspend。 */
  continuousRunSleepGapMs?: number
  /** time-source 注入 (libfaketime 代替) */
  timeSource?: TimeSource
  /** kill-switch 接続 (NG-3 / cost cap → SIGTERM→SIGKILL chain) */
  killSwitch?: KillSwitch
  /** circuit-breaker 接続 (forceOpen 同期発火 / G-06) */
  circuitBreaker?: CircuitBreakerOpenTarget
  /** cost-tracker 接続 (apiUsdMonthly 取得) */
  costTracker?: CostTracker
  /** Anthropic 警告メールソース (mock or 実 Gmail) */
  warningSource?: AnthropicWarningSource
  /** event listener (audit / Slack 通知接続用) */
  listeners?: TosMonitorListener[]
}

/**
 * 連続稼働時間 detector — 累積稼働 ms が ng3Plan.continuousRunMs を超えると breach。
 *
 * 既存 usage-monitor.ts は 12h fix の checkRuntime() を持つが、本 detector は
 * config で 12/16/24h を切替可能にし、運用 MVP の柔軟性を提供する。
 * 既存 12h 監視を破壊しないため、両者は補完関係 (どちらか先に発火した方が kill 連鎖)。
 *
 * Round 10 拡張 (Dev-β / DEC-019-056):
 *   - sleep / wake event 検出: heartbeat 間隔が sleepGapMs (default 5min) を超えた場合
 *     OS suspend と判定し、sleep duration を bootAt に加算して elapsed を再構築。
 *   - clock skew 検出: now() が前回値より逆行した場合 (negative delta) は 0 扱いで
 *     boot 時刻を再設定 (false-positive 抑止)。
 *   - 既存 evaluate() の API は不変。recordHeartbeat() は opt-in (呼ばなければ従来動作)。
 */
/**
 * Round 21 Sec-P 拡張 (Sec-O R20 spec `sec-o-r20-continuous-run-detector-extension-spec.md` §5).
 *
 * ContinuousRunDetector の verification hash 完全一致桁数を 8 / 10 桁切替で指定する option。
 *
 *   - 8 (default): 既存の 32bit / 8 桁 hex 一致 (50k/100k/500k baseline 維持 / backward compat).
 *   - 10        : 40bit / 10 桁 hex 一致 (1M scale で偽陽性確率 256x 低減 / per-pair 1/4M -> 1/1B).
 *
 * 本 option は **verification hash の桁拡張のみ** を制御し、detector の評価ロジック
 * (evaluate / recordHeartbeat / markBoot) は無改変。8 桁系列との binary compat を完全独立
 * させるため、10 桁経路は mulberry32 を **2 回 call** して 40bit hash を構築する設計
 * (Sec-O R20 spec §2 案 A 採用)。
 */
export type ContinuousRunMatchDigits = 8 | 10

/**
 * Round 21 Sec-P 拡張: ContinuousRunDetector option 拡張型。
 * 後方互換のため optional / default は既存挙動 (matchDigits=8) を維持する。
 */
export interface ContinuousRunDetectorOptions {
  /** verification hash 桁数 (default 8 = 既存 32bit). 10 で 40bit hash に拡張. */
  matchDigits?: ContinuousRunMatchDigits
}

/**
 * Round 21 Sec-P 拡張: 40bit hash 計算 helper (Sec-O R20 spec §2 案 A 採用).
 *
 * mulberry32 を 2 回 call して 40bit hash を構築する純関数。
 *   - 1 回目: 上位 8bit (0 〜 255 の整数として hi << 32 で配置)
 *   - 2 回目: 下位 32bit (0 〜 4_294_967_295 の整数として lo として配置)
 *   - 戻り値: hi | lo の bigint (40bit / 0 〜 1_099_511_627_775)
 *
 * 8 桁系列との binary compat 喪失は意図的設計 (差分 330M+ で完全独立)。
 * 1M 専用 seed (例: 0xcafebabe) で吸収する前提なので、既存 50k/100k/500k seed (0xdeadbeef 等)
 * とは別トラフィック系列で運用される。
 */
export function continuousRunHash40bit(rand: () => number): bigint {
  const hi = BigInt(Math.floor(rand() * 0x100)) << 32n
  const lo = BigInt(Math.floor(rand() * 0x100000000))
  return hi | lo
}

/**
 * Round 21 Sec-P 拡張: 32bit hash 計算 helper (8 桁 / 既存 backward compat path).
 *
 * mulberry32 を 1 回 call して 32bit hash を返す純関数 (= 既存挙動と等価)。
 * 戻り値は number (0 〜 4_294_967_295) で BigInt overhead を発生させない。
 */
export function continuousRunHash32bit(rand: () => number): number {
  return Math.floor(rand() * 0x100000000) >>> 0
}

export class ContinuousRunDetector {
  private bootAtMs: number | null = null
  private readonly gate: ConfirmGate
  private lastHeartbeatMs: number | null = null
  private accumulatedSleepMs = 0
  /** sleep gap 検出閾値 (ms)。これを超える heartbeat 間隔は OS suspend と判定。 */
  private readonly sleepGapMs: number
  /**
   * Round 21 Sec-P 拡張: verification hash 桁数 option (default 8 = 既存挙動).
   * 8: 32bit / 1 mulberry32 call / Number 比較 (backward compat 保証)
   * 10: 40bit / 2 mulberry32 call / BigInt 比較 (1M scale 偽陽性 256x 低減)
   */
  private readonly matchDigits: ContinuousRunMatchDigits

  constructor(
    private readonly limitMs: number,
    confirmCount: number,
    private readonly now: () => number,
    sleepGapMs: number = 5 * 60 * 1000,
    // Round 21 Sec-P 追加: option 化 (default 8 = 既存挙動 / 50k/100k/500k 既存 test 無改変保証).
    options: ContinuousRunDetectorOptions = {},
  ) {
    this.gate = new ConfirmGate(confirmCount)
    this.sleepGapMs = sleepGapMs
    // matchDigits 未指定時は既存挙動 (8 桁) と完全一致. 10 桁は明示指定時のみ有効.
    this.matchDigits = options.matchDigits ?? 8
  }

  /**
   * Round 21 Sec-P 追加: verification hash 桁数 getter (test / instrumentation 用).
   * production code は本 getter を参照しない (option 内部状態確認のみ).
   */
  get matchDigitsValue(): ContinuousRunMatchDigits {
    return this.matchDigits
  }

  /**
   * Round 21 Sec-P 追加: verification hash 計算 (test での 3 経路一致 verify 用).
   *
   *   - matchDigits=8  (default): mulberry32 1 回 call -> 32bit number 返却 (既存挙動).
   *   - matchDigits=10           : mulberry32 2 回 call -> 40bit bigint 返却 (Sec-O R20 §2 案 A).
   *
   * 戻り値の型は number | bigint で polymorphic. test 側で typeof 分岐 OR 比較演算子で
   * `===` 直接比較可能 (BigInt 同士 / number 同士の比較は exact match).
   *
   * 本 method は detector の状態を変えず (pure relative to detector state) rand DI のみ消費する.
   * recordHeartbeat / evaluate などの既存 method の挙動には一切影響しない (副作用 0).
   */
  computeVerificationHash(rand: () => number): number | bigint {
    if (this.matchDigits === 10) {
      return continuousRunHash40bit(rand)
    }
    return continuousRunHash32bit(rand)
  }

  /** boot 時刻を記録 (運用開始時に呼ぶ) */
  markBoot(): void {
    const t = this.now()
    this.bootAtMs = t
    this.lastHeartbeatMs = t
    this.accumulatedSleepMs = 0
  }

  /**
   * sleep / wake 検出のための heartbeat 記録。
   * - 1 サイクル ≦ sleepGapMs: 通常稼働として lastHeartbeat 更新
   * - 1 サイクル > sleepGapMs: OS suspend 判定 → sleep duration を accumulatedSleep に加算
   * - 時刻巻き戻し (negative delta): clock skew として lastHeartbeat 再同期 (false-positive 抑止)
   *
   * 戻り値: 検出した sleep gap ms (通常稼働時は 0、巻き戻し時は -1)。
   *
   * Round 12 Dev-B: suppression-primitives.heartbeatGapDetector に判定処理を委譲。
   *   - kind='first'   → primitive 内部で lastMs=null を扱うが本 wrapper は別途分岐
   *   - kind='normal'  → return 0
   *   - kind='suspend' → accumulatedSleep += sleepMs, return sleepMs
   *   - kind='skew'    → bootAtMs を t に再同期, return -1
   * 数値挙動は既存と完全一致 (primitive の境界 delta==sleepGapMs を normal とする仕様も同一)。
   */
  recordHeartbeat(): number {
    const t = this.now()
    const result = heartbeatGapDetector(t, this.lastHeartbeatMs, this.sleepGapMs)
    switch (result.kind) {
      case 'first':
        this.lastHeartbeatMs = t
        return 0
      case 'skew': {
        // Round 13 Dev-B: clockSkewBoot('reset_to_now') primitive に委譲。
        //   - bootAtMs / lastHeartbeatMs を t に再同期する戦略は reset_to_now と完全等価
        //     (`clock-skew-boot-evaluation.test.ts` で 8 桁一致を verify).
        //   - lastHeartbeat は skew 後の heartbeat 評価基準として t に reset。
        //   - bootAtMs が既に null の場合は markBoot() 未実行 → boot 不変 (primitive 結果は破棄).
        //   - 戻り値 -1 は wrapper 側 contract (gap=-1 = skew indicator) を維持。
        this.lastHeartbeatMs = t
        if (this.bootAtMs !== null) {
          const skew = clockSkewBoot(
            t,
            // lastMs は heartbeatGapDetector が skew 判定した時点の前回値 (t より大きい).
            // result.tMs は now (= t) なので、skew が起きた事は確定。bootAtMs を再同期する。
            this.bootAtMs,
            this.bootAtMs,
            'reset_to_now',
          )
          this.bootAtMs = skew.bootAtMs
        }
        return -1
      }
      case 'suspend':
        this.accumulatedSleepMs += result.sleepMs
        this.lastHeartbeatMs = t
        return result.sleepMs
      case 'normal':
        this.lastHeartbeatMs = t
        return 0
    }
  }

  /**
   * boot 未マークなら null、breach 確定で elapsedMs を返す。confirmCount 未到達は null。
   * Round 10 拡張: accumulatedSleep を差し引いた "active elapsed" で判定。
   *
   * Round 13 Dev-B: 計算本体を detector-functions.evaluateContinuousRun に委譲。
   *   - elapsed 計算式 (wall - accumulatedSleep) は pure function 側と 8 桁一致。
   *   - confirmCount gate は class 内 state として保持 (純関数化対象外)。
   */
  evaluate(): { breached: boolean; elapsedMs: number } | null {
    const r = evaluateContinuousRunFn({
      bootAtMs: this.bootAtMs,
      nowMs: this.now(),
      accumulatedSleepMs: this.accumulatedSleepMs,
      limitMs: this.limitMs,
    })
    if (r.elapsedMs === null) return null
    if (r.breachCandidate) {
      const fired = this.gate.hit()
      return { breached: fired, elapsedMs: r.elapsedMs }
    }
    this.gate.miss()
    return { breached: false, elapsedMs: r.elapsedMs }
  }

  reset(): void {
    this.bootAtMs = null
    this.gate.reset()
    this.lastHeartbeatMs = null
    this.accumulatedSleepMs = 0
  }

  get hasBoot(): boolean {
    return this.bootAtMs !== null
  }

  /** Round 10 instrumentation: 累積 sleep ms を取得 (drill #2 検証用)。 */
  get accumulatedSleep(): number {
    return this.accumulatedSleepMs
  }
}

/**
 * Cost cap detector — costTracker.getMonthlyTotal() が apiUsdMonthlyHardCap を
 * 超過した瞬間に breach。breach 検知時は hard_fail tier (kill-switch + CB).
 *
 * Round 10 拡張 (Dev-β / DEC-019-056):
 *   - legit spike window: declareLegitSpikeWindow(durationMs) で宣言された期間内は
 *     breach を抑止 (warn 段階に留める)。benchmark 連続実行や大型 PR 連続 push 等の
 *     正当な spike 用途で偽陽性を抑止。
 *   - extendedCap: 宣言期間内のみ通常 cap × multiplier (default 2x) まで許容。
 *   - 既存 evaluate() の API は不変。declareLegitSpikeWindow() は opt-in。
 */
export class CostCapDetector {
  private readonly gate: ConfirmGate
  private readonly legitWindow: LegitWindowGuard
  private suppressedCount = 0

  constructor(
    private readonly capUsd: number,
    confirmCount: number,
    private readonly now: () => number = () => Date.now(),
  ) {
    this.gate = new ConfirmGate(confirmCount)
    this.legitWindow = new LegitWindowGuard(this.now)
  }

  /**
   * 正当 spike window を宣言。期間内は cap × multiplier まで breach 抑止。
   * 例: declareLegitSpikeWindow(60 * 60 * 1000, 2) → 1h の間 cap×2 まで OK。
   *
   * Round 12 Dev-B: suppression-primitives.LegitWindowGuard に委譲。
   *   - durationMs <= 0 / multiplier < 1 は guard 内部で no-op 化される (既存挙動と同一)。
   */
  declareLegitSpikeWindow(durationMs: number, multiplier: number = 2): void {
    this.legitWindow.declare(durationMs, multiplier)
  }

  /** legit spike window 状態を確認。 */
  isInLegitSpikeWindow(): boolean {
    return this.legitWindow.isActive()
  }

  /**
   * apiUsdMonthly を渡し、breach 確定なら true。
   *
   * Round 12 Dev-B: effectiveCap 計算を LegitWindowGuard に委譲。
   *   - inactive 時は guard.effectiveCap(capUsd) === capUsd
   *   - active 時は guard.effectiveCap(capUsd) === capUsd * multiplier
   * 数値挙動は既存と完全一致。
   */
  evaluate(currentUsd: number): {
    breached: boolean
    currentUsd: number
    capUsd: number
    suppressedByLegitSpike?: boolean
  } {
    // Round 13 Dev-B: 計算本体を detector-functions.evaluateCostCap に委譲。
    //   - effective cap = capUsd * multiplier (LegitWindowGuard.effectiveCap と同一式)
    //   - breach / suppress 判定の boolean を純関数で算出, gate / counter 更新は class 側
    const inWindow = this.legitWindow.isActive()
    const state = this.legitWindow.state()
    const r = evaluateCostCapFn({
      currentUsd,
      capUsd: this.capUsd,
      effectiveMultiplier: state.multiplier,
      inLegitWindow: inWindow,
    })
    if (r.breachCandidate) {
      const fired = this.gate.hit()
      return { breached: fired, currentUsd: r.currentUsd, capUsd: this.capUsd }
    }
    if (r.suppressedByLegitWindow) {
      this.suppressedCount += 1
      this.gate.miss()
      return {
        breached: false,
        currentUsd: r.currentUsd,
        capUsd: this.capUsd,
        suppressedByLegitSpike: true,
      }
    }
    this.gate.miss()
    return { breached: false, currentUsd: r.currentUsd, capUsd: this.capUsd }
  }

  reset(): void {
    this.gate.reset()
    this.legitWindow.reset()
    this.suppressedCount = 0
  }

  /** Round 10 instrumentation: 抑止カウント (drill #2 検証用)。 */
  get suppressedByLegitSpikeCount(): number {
    return this.suppressedCount
  }
}

/** rate spike sampler 用 token sample. */
export interface RateSpikeSample {
  ts: number // ms
  tokens: number
}

/**
 * Rate spike detector — 直近 shortWindow の token 消費が longWindow 平均の
 * multiplier 倍を超えると breach。
 *
 * baseline 平均は longWindow / shortWindow で正規化し、両期間の単位を揃える。
 * 例: short=1h / long=24h → baseline = (24h 合計 tokens) / 24
 *
 * Round 10 拡張 (Dev-β / DEC-019-056):
 *   - baseline guard: baseline per window が baselineMinTokens (default 10) 未満では
 *     breach 抑止 (rate_spike × boundary 偽陽性対策)。既存の < 1 ガードを強化。
 *   - z-score 2σ filter: window 別 token 数の std-dev を計算し、shortWindow が
 *     baseline + 2σ 以下なら breach 抑止 (統計的に有意な spike のみ通す)。
 *   - legit spike window: declareLegitSpikeWindow(durationMs) で宣言された期間内は
 *     breach を抑止 (rate_spike × spike legit 偽陽性対策)。
 *   - 既存 evaluate() の戻り値は extended (suppressedByZScore / suppressedByLegitSpike 追加)、
 *     既存フィールドは不変なので後方互換。
 */
export class RateSpikeDetector {
  private samples: RateSpikeSample[] = []
  private readonly gate: ConfirmGate
  private readonly baselineMinTokens: number
  /** z-score 閾値 (default 2σ)。低くすると抑止が緩む。0 で z-score filter 無効。 */
  private readonly zScoreThreshold: number
  private readonly legitWindow: LegitWindowGuard
  private suppressedZScore = 0
  private suppressedLegitSpike = 0

  constructor(
    private readonly shortMs: number,
    private readonly longMs: number,
    private readonly multiplier: number,
    confirmCount: number,
    private readonly now: () => number,
    options: { baselineMinTokens?: number; zScoreThreshold?: number } = {},
  ) {
    this.gate = new ConfirmGate(confirmCount)
    if (shortMs <= 0 || longMs <= 0) throw new Error('windows must be positive')
    if (longMs <= shortMs) throw new Error('longMs must be > shortMs')
    if (multiplier <= 1) throw new Error('multiplier must be > 1')
    this.baselineMinTokens = options.baselineMinTokens ?? 10
    this.zScoreThreshold = options.zScoreThreshold ?? 2
    // Round 12 Dev-B: rate-spike では multiplier=1 (cap 拡張なし、抑止のみ)。
    this.legitWindow = new LegitWindowGuard(this.now)
  }

  recordTokens(tokens: number): void {
    if (!Number.isFinite(tokens) || tokens < 0) return
    this.samples.push({ ts: this.now(), tokens })
    this.purgeOlder()
  }

  /**
   * 正当 spike window を宣言。期間内は breach を強制抑止 (suppressedByLegitSpike)。
   *
   * Round 12 Dev-B: suppression-primitives.LegitWindowGuard に委譲。
   *   - rate-spike は cap 拡張せず breach 抑止のみなので multiplier=1。
   */
  declareLegitSpikeWindow(durationMs: number): void {
    this.legitWindow.declare(durationMs, 1)
  }

  isInLegitSpikeWindow(): boolean {
    return this.legitWindow.isActive()
  }

  /**
   * Round 13 Dev-B: 内部 helper を detector-functions.purgeOlderSamples に委譲。
   *   - 副作用 (this.samples 上書き) は class 側で保持、計算は pure function。
   */
  private purgeOlder(): void {
    this.samples = purgeOlderSamples(this.now(), this.samples, this.longMs)
  }

  /**
   * shortMs ごとに samples を bucket 化して per-window token 数の配列を返す。
   * std-dev / z-score 計算に使う。
   *
   * Round 13 Dev-B: detector-functions.bucketTokensPerWindow に委譲 (pure function)。
   */
  private bucketTokensPerWindow(): number[] {
    return bucketTokensPerWindowFn(this.now(), this.samples, this.shortMs, this.longMs)
  }

  evaluate(): {
    breached: boolean
    shortTokens: number
    baselinePerWindow: number
    multiplierActual: number
    suppressedByZScore?: boolean
    suppressedByLegitSpike?: boolean
  } {
    this.purgeOlder()
    // Round 13 Dev-B: baseline / shortTokens 計算を detector-functions.computeBaselinePerWindow
    // に委譲。numWindows / totalTokens の数値挙動は既存と 8 桁一致。
    const baseline = computeBaselinePerWindow(
      this.now(),
      this.samples as ReadonlyArray<RateSpikeSampleLite>,
      this.shortMs,
      this.longMs,
    )
    const shortTokens = baseline.shortTokens
    const baselinePerWindow = baseline.baselinePerWindow
    const multiplierActual = baselinePerWindow > 0 ? shortTokens / baselinePerWindow : 0

    // 既存ガード: baseline < 1 (ゼロ近傍) では breach しない
    if (baselinePerWindow < 1) {
      this.gate.miss()
      return { breached: false, shortTokens, baselinePerWindow, multiplierActual }
    }
    // Round 10 強化: baseline < baselineMinTokens でも breach 抑止 (rate_spike × boundary)
    if (baselinePerWindow < this.baselineMinTokens) {
      this.gate.miss()
      return { breached: false, shortTokens, baselinePerWindow, multiplierActual }
    }
    // multiplier 未到達は通常 miss
    if (shortTokens < baselinePerWindow * this.multiplier) {
      this.gate.miss()
      return { breached: false, shortTokens, baselinePerWindow, multiplierActual }
    }
    // legit spike window 抑止 (rate_spike × spike legit)
    if (this.legitWindow.isActive()) {
      this.suppressedLegitSpike += 1
      this.gate.miss()
      return {
        breached: false,
        shortTokens,
        baselinePerWindow,
        multiplierActual,
        suppressedByLegitSpike: true,
      }
    }
    // z-score filter (Round 12 Dev-B: suppression-primitives.zScoreFilter に委譲)。
    //   buckets[0] = 直近 shortWindow、残り = 過去 baseline 用。
    //   primitive は past.length<2 で suppress=false (フィルタ無効) を返すので
    //   既存の "past.length >= 2 必要" ガードと一致。
    //   threshold 計算式 (mean + z*std-dev) も既存と完全一致。
    if (this.zScoreThreshold > 0) {
      const buckets = this.bucketTokensPerWindow()
      // bucket[0] (= 直近) を shortTokens で上書きして primitive に渡す。
      // 既存実装は shortTokens vs threshold を比較していたため、current=shortTokens で同等。
      const filterInput = [shortTokens, ...buckets.slice(1)]
      const filterResult = zScoreFilter(filterInput, this.zScoreThreshold)
      if (filterResult.suppress) {
        this.suppressedZScore += 1
        this.gate.miss()
        return {
          breached: false,
          shortTokens,
          baselinePerWindow,
          multiplierActual,
          suppressedByZScore: true,
        }
      }
    }
    const fired = this.gate.hit()
    return { breached: fired, shortTokens, baselinePerWindow, multiplierActual }
  }

  reset(): void {
    this.samples = []
    this.gate.reset()
    this.legitWindow.reset()
    this.suppressedZScore = 0
    this.suppressedLegitSpike = 0
  }

  /** Round 10 instrumentation: z-score / legit-spike 抑止カウント (drill #2 検証用)。 */
  get suppressedZScoreCount(): number {
    return this.suppressedZScore
  }
  get suppressedLegitSpikeCount(): number {
    return this.suppressedLegitSpike
  }
}

/**
 * Mock 警告メールソース — テスト fixture 用。
 * pollResults を queue で消費する FIFO。
 */
export class MockAnthropicWarningSource implements AnthropicWarningSource {
  private queue: WarningEvent[][]

  constructor(pollResults: WarningEvent[][] = []) {
    this.queue = [...pollResults]
  }

  async poll(): Promise<WarningEvent[]> {
    const next = this.queue.shift()
    return next ?? []
  }

  /** queue に push (テストで動的に追加するため) */
  enqueue(events: WarningEvent[]): void {
    this.queue.push(events)
  }
}

/**
 * 5 種類 fixture (rate / capacity / billing / tos_warning / final_warning)。
 * テストで MockAnthropicWarningSource に渡す default fixture。
 */
export const ANTHROPIC_WARNING_FIXTURES: ReadonlyArray<WarningEvent> = Object.freeze([
  {
    receivedAt: '2026-05-04T01:00:00Z',
    messageId: 'fix-rate-001',
    subject: '[Anthropic] Rate limit warning',
    category: 'rate',
    severity: 2,
    excerpt: 'Your account approached the rate limit on claude-sonnet-4.6 endpoint.',
  },
  {
    receivedAt: '2026-05-04T02:00:00Z',
    messageId: 'fix-capacity-001',
    subject: '[Anthropic] Capacity throttling notice',
    category: 'capacity',
    severity: 3,
    excerpt: 'High demand window detected for your subscription tier (Max 20x).',
  },
  {
    receivedAt: '2026-05-04T03:00:00Z',
    messageId: 'fix-billing-001',
    subject: '[Anthropic] Billing notice',
    category: 'billing',
    severity: 2,
    excerpt: 'Subscription auto-renewal scheduled for next month.',
  },
  {
    receivedAt: '2026-05-04T04:00:00Z',
    messageId: 'fix-tos-001',
    subject: '[Anthropic] Terms of Service review request',
    category: 'tos_warning',
    severity: 4,
    excerpt:
      'We detected usage patterns inconsistent with ordinary individual usage. Please review.',
  },
  {
    receivedAt: '2026-05-04T05:00:00Z',
    messageId: 'fix-final-001',
    subject: '[Anthropic] Final warning — account suspension imminent',
    category: 'final_warning',
    severity: 5,
    excerpt: 'This is a final warning prior to account suspension under our Acceptable Use Policy.',
  },
])

// ============================================================================
// TosMonitor — 4 detector + warning poll を統括
// ============================================================================

export interface TosMonitor {
  /** 連続稼働開始 (boot 時刻記録) */
  markBoot(): void
  /** 連続稼働を 1 サイクル評価。breach 確定で event emit + kill chain */
  checkContinuousRun(): Promise<TosMonitorEvent | null>
  /** apiUsdMonthly を渡して 1 サイクル評価。breach 確定で event emit + kill chain */
  checkCostCap(): Promise<TosMonitorEvent | null>
  /** token 消費 sample 記録 */
  recordTokens(tokens: number): void
  /** rate spike 1 サイクル評価 */
  checkRateSpike(): Promise<TosMonitorEvent | null>
  /** Anthropic 警告メール 1 回 polling */
  pollWarnings(): Promise<TosMonitorEvent[]>
  /** 警告履歴 24h 件数 */
  getWarningCount24h(): number
  /** 警告最大 severity (24h) */
  getMaxWarningSeverity24h(): 0 | 1 | 2 | 3 | 4 | 5
  /** 直近 NG-3 breach 7d 件数 */
  getNg3BreachCount7d(): number
  /** P-E fallback decision 評価 (event emit はしない、純関数 hook) */
  evaluateFallback(input: FallbackDecisionInput): FallbackDecision
  /** event listener 追加 */
  on(listener: TosMonitorListener): void
  /** 設定済 NG-3 plan の config を取得 */
  getPlanConfig(): Ng3PlanConfig
  /** detector / 履歴を全リセット (drill / test 用) */
  reset(): void
  /** Round 10: continuous run heartbeat (sleep / wake event 検出)。 */
  recordHeartbeat(): number
  /** Round 10: cost cap legit spike window 宣言 (cap × multiplier まで一時許容)。 */
  declareLegitSpikeWindow(durationMs: number, multiplier?: number): void
}

export class FileTosMonitor implements TosMonitor {
  private readonly continuous: ContinuousRunDetector
  private readonly costCap: CostCapDetector
  private readonly rateSpike: RateSpikeDetector
  private readonly warningSource: AnthropicWarningSource | undefined
  private readonly costTracker: CostTracker | undefined
  private readonly killSwitch: KillSwitch | undefined
  private readonly circuitBreaker: CircuitBreakerOpenTarget | undefined
  private readonly listeners: TosMonitorListener[] = []
  private readonly now: () => number
  private readonly nowDate: () => Date
  private readonly planConfig: Ng3PlanConfig
  private readonly seenWarnings = new Map<string, WarningEvent>() // messageId → event
  private readonly ng3BreachLog: number[] = [] // breach ts (ms)
  private chained = false // kill chain は冪等 (1 案件で 1 度だけ発火)

  constructor(opts: TosMonitorOptions = {}) {
    const plan = opts.ng3Plan ?? 'plan_b_16h'
    const base = NG3_PLANS[plan]
    this.planConfig = {
      continuousRunMs: opts.override?.continuousRunMs ?? base.continuousRunMs,
      apiUsdMonthlyHardCap: opts.override?.apiUsdMonthlyHardCap ?? base.apiUsdMonthlyHardCap,
      combinedMonthlyCap: opts.override?.combinedMonthlyCap ?? base.combinedMonthlyCap,
      description: base.description,
    }
    const confirmCount = opts.confirmCount ?? 2
    const shortMs = opts.shortWindowMs ?? 60 * 60 * 1000 // 1h
    const longMs = opts.longWindowMs ?? 24 * 60 * 60 * 1000 // 24h
    const multiplier = opts.rateSpikeMultiplier ?? 5

    if (opts.timeSource) {
      const ts = opts.timeSource
      this.now = () => ts.nowMs()
      this.nowDate = () => ts.now()
    } else {
      this.now = () => Date.now()
      this.nowDate = () => new Date()
    }

    this.continuous = new ContinuousRunDetector(
      this.planConfig.continuousRunMs,
      confirmCount,
      this.now,
      opts.continuousRunSleepGapMs,
    )
    this.costCap = new CostCapDetector(
      this.planConfig.apiUsdMonthlyHardCap,
      confirmCount,
      this.now,
    )
    this.rateSpike = new RateSpikeDetector(
      shortMs,
      longMs,
      multiplier,
      confirmCount,
      this.now,
      {
        baselineMinTokens: opts.rateSpikeBaselineMinTokens,
        zScoreThreshold: opts.rateSpikeZScoreThreshold,
      },
    )
    if (opts.warningSource) this.warningSource = opts.warningSource
    if (opts.costTracker) this.costTracker = opts.costTracker
    if (opts.killSwitch) this.killSwitch = opts.killSwitch
    if (opts.circuitBreaker) this.circuitBreaker = opts.circuitBreaker
    if (opts.listeners) this.listeners.push(...opts.listeners)
  }

  markBoot(): void {
    this.continuous.markBoot()
  }

  async checkContinuousRun(): Promise<TosMonitorEvent | null> {
    const r = this.continuous.evaluate()
    if (r === null) return null
    if (!r.breached) return null
    const ev: TosMonitorEvent = {
      type: 'monitor:ng3-time-breach',
      ts: this.nowDate().toISOString(),
      tier: 'auto_stop',
      reason: `continuous run ${r.elapsedMs}ms >= cap ${this.planConfig.continuousRunMs}ms (${this.planConfig.description})`,
      detail: {
        elapsedMs: r.elapsedMs,
        capMs: this.planConfig.continuousRunMs,
        plan: this.planConfig.description,
      },
    }
    this.ng3BreachLog.push(this.now())
    await this.emit(ev)
    await this.fireKillChain(ev.reason, 'auto_stop')
    return ev
  }

  async checkCostCap(): Promise<TosMonitorEvent | null> {
    if (!this.costTracker) return null
    const monthly = await this.costTracker.getMonthlyTotal()
    const r = this.costCap.evaluate(monthly)
    if (!r.breached) return null
    const ev: TosMonitorEvent = {
      type: 'monitor:cost-cap-breach',
      ts: this.nowDate().toISOString(),
      tier: 'hard_fail',
      reason: `apiUsdMonthly $${r.currentUsd.toFixed(2)} >= cap $${r.capUsd.toFixed(2)} (${this.planConfig.description})`,
      detail: {
        currentUsd: r.currentUsd,
        capUsd: r.capUsd,
        plan: this.planConfig.description,
      },
    }
    await this.emit(ev)
    await this.fireKillChain(ev.reason, 'hard_fail')
    return ev
  }

  recordTokens(tokens: number): void {
    this.rateSpike.recordTokens(tokens)
  }

  async checkRateSpike(): Promise<TosMonitorEvent | null> {
    const r = this.rateSpike.evaluate()
    if (!r.breached) return null
    const ev: TosMonitorEvent = {
      type: 'monitor:rate-spike',
      ts: this.nowDate().toISOString(),
      tier: 'auto_stop',
      reason: `rate spike: short=${r.shortTokens} tokens >= ${r.multiplierActual.toFixed(2)}x baseline=${r.baselinePerWindow.toFixed(2)}/window`,
      detail: {
        shortTokens: r.shortTokens,
        baselinePerWindow: r.baselinePerWindow,
        multiplierActual: r.multiplierActual,
      },
    }
    await this.emit(ev)
    // rate spike は auto_stop 相当 (kill chain は cost-cap / ng3-time に任せる) — listener と CB のみ
    if (this.circuitBreaker) {
      try {
        this.circuitBreaker.forceOpen(`rate-spike: ${ev.reason}`)
      } catch {
        // best effort
      }
    }
    return ev
  }

  async pollWarnings(): Promise<TosMonitorEvent[]> {
    if (!this.warningSource) return []
    const events = await this.warningSource.poll()
    const out: TosMonitorEvent[] = []
    for (const w of events) {
      if (this.seenWarnings.has(w.messageId)) continue
      this.seenWarnings.set(w.messageId, w)
      const ev: TosMonitorEvent = {
        type: 'monitor:warning-email',
        ts: this.nowDate().toISOString(),
        tier: w.severity >= 4 ? 'hard_fail' : 'auto_stop',
        reason: `Anthropic warning email category=${w.category} severity=${w.severity}: ${w.subject}`,
        detail: {
          messageId: w.messageId,
          category: w.category,
          severity: w.severity,
          excerpt: w.excerpt,
        },
      }
      await this.emit(ev)
      out.push(ev)
    }
    return out
  }

  getWarningCount24h(): number {
    const cutoff = this.now() - 24 * 60 * 60 * 1000
    let count = 0
    for (const w of this.seenWarnings.values()) {
      if (Date.parse(w.receivedAt) >= cutoff) count += 1
    }
    return count
  }

  getMaxWarningSeverity24h(): 0 | 1 | 2 | 3 | 4 | 5 {
    const cutoff = this.now() - 24 * 60 * 60 * 1000
    let max = 0
    for (const w of this.seenWarnings.values()) {
      if (Date.parse(w.receivedAt) >= cutoff && w.severity > max) max = w.severity
    }
    return max as 0 | 1 | 2 | 3 | 4 | 5
  }

  getNg3BreachCount7d(): number {
    const cutoff = this.now() - 7 * 24 * 60 * 60 * 1000
    return this.ng3BreachLog.filter((t) => t >= cutoff).length
  }

  evaluateFallback(input: FallbackDecisionInput): FallbackDecision {
    const decision = shouldFallbackToApiKey(input)
    // listener 通知 (fire-and-forget; audit hook 接続用)
    void this.emit({
      type: 'monitor:fallback-decision',
      ts: this.nowDate().toISOString(),
      tier: null,
      reason: decision.rationale,
      detail: {
        input: { ...input },
        decision: { ...decision },
      },
    })
    return decision
  }

  on(listener: TosMonitorListener): void {
    this.listeners.push(listener)
  }

  getPlanConfig(): Ng3PlanConfig {
    return { ...this.planConfig }
  }

  reset(): void {
    this.continuous.reset()
    this.costCap.reset()
    this.rateSpike.reset()
    this.seenWarnings.clear()
    this.ng3BreachLog.length = 0
    this.chained = false
  }

  /**
   * Round 10: continuous run heartbeat 記録 (sleep / wake event 検出)。
   * 戻り値: 検出 sleep gap ms (通常稼働時 0、巻き戻し時 -1)。
   */
  recordHeartbeat(): number {
    return this.continuous.recordHeartbeat()
  }

  /**
   * Round 10: cost-cap + rate-spike 双方に legit spike window を宣言。
   * benchmark 連続実行 / 大型 PR push など正当な spike 用途で偽陽性を抑止する。
   */
  declareLegitSpikeWindow(durationMs: number, multiplier: number = 2): void {
    this.costCap.declareLegitSpikeWindow(durationMs, multiplier)
    this.rateSpike.declareLegitSpikeWindow(durationMs)
  }

  // ----- 内部 -----

  private async emit(ev: TosMonitorEvent): Promise<void> {
    for (const l of this.listeners) {
      try {
        await l(ev)
      } catch {
        // best effort: listener 失敗で他 listener / kill chain を阻害しない
      }
    }
  }

  /**
   * NG-3 / cost-cap breach 時の kill chain。
   *   1. circuit-breaker.forceOpen
   *   2. kill-switch.trigger (SIGTERM→SIGKILL chain は kill-switch 内部 G-05)
   * 既に発火済の場合 (chained=true) は重複発火を抑制。
   */
  private async fireKillChain(reason: string, tier: TosMonitorTier): Promise<void> {
    if (this.chained) return
    this.chained = true
    if (this.circuitBreaker) {
      try {
        this.circuitBreaker.forceOpen(`tos-monitor[${tier}]: ${reason}`)
      } catch {
        // best effort
      }
    }
    if (this.killSwitch && tier === 'hard_fail') {
      try {
        await this.killSwitch.trigger(reason, {
          source: 'budget',
          details: { tosMonitorTier: tier },
        })
      } catch {
        // best effort
      }
    }
    if (this.killSwitch && tier === 'auto_stop') {
      // auto_stop は新規 fire 拒否のみ。kill-switch.trigger は呼ばない (cost-cap hard_fail 時に責任を委譲)。
      // ただし NG-3 time breach は重大なので kill chain も同期発火する (DEC-019-008 自動停止要件)。
      try {
        await this.killSwitch.trigger(reason, {
          source: 'continuous_runtime',
          details: { tosMonitorTier: tier },
        })
      } catch {
        // best effort
      }
    }
  }
}

/**
 * Factory — opts を受けて TosMonitor を返す。 既存 wrapper.ts factory pattern と整合。
 */
export function createTosMonitor(opts: TosMonitorOptions = {}): TosMonitor {
  return new FileTosMonitor(opts)
}

// ============================================================================
// audit hook helper
// ============================================================================

/**
 * 監査ログ append-only chain に書き込む TosMonitorListener を生成。
 * audit/ パッケージ (FileAuditLogStore) を直接 import せず、
 * 軽量 contract で疎結合化 (循環依存を避ける)。
 *
 * 使い方:
 * ```ts
 * import { FileAuditLogStore } from '@clawbridge/audit'
 * const audit = new FileAuditLogStore()
 * const monitor = createTosMonitor({ listeners: [createAuditHook(audit)] })
 * ```
 */
export interface AuditAppender {
  append(event: {
    type: string
    source: string
    payload: Record<string, unknown>
    ts?: string
  }): Promise<unknown>
}

export function createAuditHook(audit: AuditAppender): TosMonitorListener {
  return async (ev) => {
    try {
      await audit.append({
        type: 'other', // audit-store の AuditEventType に合わせて 'other' を使用
        source: 'harness',
        payload: {
          tosMonitor: ev.type,
          tier: ev.tier,
          reason: ev.reason,
          detail: ev.detail,
        },
        ts: ev.ts,
      })
    } catch {
      // audit 書込失敗は monitor 動作を阻害しない
    }
  }
}

// ============================================================================
// Round 10 drill #2 instrumentation (recording / replay)
// ============================================================================

/**
 * drill #2 用 instrumentation event。
 * tos-monitor の event 全件 + token sample / heartbeat / legit-spike-window 宣言を
 * timeseries 化し、後で deterministic に replay できる形式。
 */
export type DrillInstrumentEntry =
  | { kind: 'event'; t: number; event: TosMonitorEvent }
  | { kind: 'tokens'; t: number; tokens: number }
  | { kind: 'heartbeat'; t: number; sleepGapMs: number }
  | { kind: 'legitSpikeWindow'; t: number; durationMs: number; multiplier: number }
  | { kind: 'note'; t: number; message: string }

/**
 * recording hook — 全 instrumentation entry を timeseries に追記する。
 * drill #2 (5/17) で実機運用中の挙動を完全 replay 可能な fixture として保存する用途。
 */
export interface DrillRecorder {
  record(entry: DrillInstrumentEntry): void
  /** 記録済 entries (immutable copy)。 */
  entries(): ReadonlyArray<DrillInstrumentEntry>
  /** 記録をクリア。 */
  clear(): void
}

/**
 * In-memory DrillRecorder。 drill 実行中は本実装で記録、終了後 entries() を JSON 化して
 * fixture に保存する。replay 時は readEntries() で読み込み createReplayHook で reconstruct。
 */
export class InMemoryDrillRecorder implements DrillRecorder {
  private buf: DrillInstrumentEntry[] = []
  record(entry: DrillInstrumentEntry): void {
    this.buf.push(entry)
  }
  entries(): ReadonlyArray<DrillInstrumentEntry> {
    return [...this.buf]
  }
  clear(): void {
    this.buf = []
  }
}

/**
 * tos-monitor を recorder で wrap し、event を全件 record する listener を返す。
 * 既存の listeners 配列に push して使う。
 */
export function createDrillRecordingHook(
  recorder: DrillRecorder,
  now: () => number = () => Date.now(),
): TosMonitorListener {
  return (ev) => {
    recorder.record({ kind: 'event', t: now(), event: ev })
  }
}

/**
 * Recording 用の薄い TosMonitor wrapper。
 * recordTokens / recordHeartbeat / declareLegitSpikeWindow を recorder にも転送する。
 * 既存の TosMonitor を渡して使う decorator pattern。
 *
 * 使い方:
 *   const monitor = createTosMonitor({ listeners: [createDrillRecordingHook(recorder)] })
 *   const wrapped = wrapWithDrillRecording(monitor, recorder, now)
 *   wrapped.recordTokens(100)  // monitor.recordTokens + recorder.record({kind:'tokens'})
 */
export function wrapWithDrillRecording(
  inner: TosMonitor,
  recorder: DrillRecorder,
  now: () => number = () => Date.now(),
): TosMonitor {
  return {
    markBoot: () => inner.markBoot(),
    checkContinuousRun: () => inner.checkContinuousRun(),
    checkCostCap: () => inner.checkCostCap(),
    recordTokens: (tokens: number) => {
      recorder.record({ kind: 'tokens', t: now(), tokens })
      inner.recordTokens(tokens)
    },
    checkRateSpike: () => inner.checkRateSpike(),
    pollWarnings: () => inner.pollWarnings(),
    getWarningCount24h: () => inner.getWarningCount24h(),
    getMaxWarningSeverity24h: () => inner.getMaxWarningSeverity24h(),
    getNg3BreachCount7d: () => inner.getNg3BreachCount7d(),
    evaluateFallback: (input) => inner.evaluateFallback(input),
    on: (listener) => inner.on(listener),
    getPlanConfig: () => inner.getPlanConfig(),
    reset: () => inner.reset(),
    recordHeartbeat: () => {
      const gap = inner.recordHeartbeat()
      recorder.record({ kind: 'heartbeat', t: now(), sleepGapMs: gap })
      return gap
    },
    declareLegitSpikeWindow: (durationMs: number, multiplier: number = 2) => {
      recorder.record({ kind: 'legitSpikeWindow', t: now(), durationMs, multiplier })
      inner.declareLegitSpikeWindow(durationMs, multiplier)
    },
  }
}

/**
 * replay hook — recorded entries を入力に、deterministic に既存 monitor を再現する。
 *
 * 用途: drill #2 で記録した fixture を test 環境で再現し、suppression rule の
 * regression / 偽陽性 4 セルの再発検証に使う。
 *
 * timeSource: FakeTimeSource を渡すこと。entry.t に setNow して各 action を順次再現する。
 *
 * 制約:
 *   - replay は recordTokens / recordHeartbeat / declareLegitSpikeWindow のみ再現
 *   - check* / pollWarnings は明示的に呼び出す側で trigger する (event 発火点を制御するため)
 *   - 'event' entry は再生せず、verification 用に caller で参照する
 */
export interface ReplayController {
  /** 現在の cursor position */
  cursor: number
  /** 次の entry まで進めて action 実行。entry.t を超える entry がなければ false。 */
  step(): boolean
  /** 全 entry を 1 度に再生。 */
  runAll(): void
  /** 残 entry 数。 */
  remaining(): number
}

export function createReplayHook(
  monitor: TosMonitor,
  entries: ReadonlyArray<DrillInstrumentEntry>,
  timeSource: { setNow(ms: Date | number): void },
): ReplayController {
  const sorted = [...entries].sort((a, b) => a.t - b.t)
  let i = 0
  function applyOne(entry: DrillInstrumentEntry): void {
    timeSource.setNow(entry.t)
    switch (entry.kind) {
      case 'tokens':
        monitor.recordTokens(entry.tokens)
        break
      case 'heartbeat':
        monitor.recordHeartbeat()
        break
      case 'legitSpikeWindow':
        monitor.declareLegitSpikeWindow(entry.durationMs, entry.multiplier)
        break
      case 'event':
      case 'note':
        // event / note は副作用なし (verification 用)
        break
    }
  }
  return {
    get cursor() {
      return i
    },
    set cursor(v: number) {
      i = v
    },
    step(): boolean {
      if (i >= sorted.length) return false
      applyOne(sorted[i]!)
      i += 1
      return true
    },
    runAll(): void {
      while (i < sorted.length) {
        applyOne(sorted[i]!)
        i += 1
      }
    },
    remaining(): number {
      return Math.max(0, sorted.length - i)
    },
  }
}
