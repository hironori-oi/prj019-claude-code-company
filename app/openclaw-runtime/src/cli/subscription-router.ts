/**
 * cli/subscription-router — Round 11 Dev-D 前倒し (W3 → W0):
 *   起動 mode = "subscription" 時の経路選択 (claude-code-cli vs anthropic-api) 純関数。
 *
 * 設計方針 (DEC-019-051 整合):
 *   - **subscription-driven 中核手段**: 月総額 ≤$430 cap を遵守するため、subscription 経路
 *     (Claude Code CLI 経由) を最優先とし、API 直接コールは fallback / 緊急時のみ。
 *   - **strategy pattern (純関数 decision)**: 入力 (subscriptionAvailable / costBudgetUsd /
 *     emergencyOverride) → 出力 (selected mode + reason + warnings)。
 *   - **副作用 0**: 環境変数 / fs / network 読み取り 0、caller が事前に値を集めて渡す契約。
 *   - **既存無改変**: skill-adapter / wrapper.ts / protocol/ 完全無 touch。
 *
 * 関連:
 *   - DEC-019-051 月総額 ≤$430 cap (CB-D-W0-09)
 *   - DEC-019-007 副作用ゼロ要件
 *   - cli/spawn-claude-code.ts SpawnMode と整合
 */
import type { SpawnMode } from './spawn-claude-code.js'

/**
 * router 入力 (caller が予め集めて渡す事実関係)。
 */
export interface SubscriptionRouterInput {
  /** Claude Code CLI subscription が現在利用可能か (auth ok / quota 残あり) */
  subscriptionAvailable: boolean
  /** 当月の API 残予算 (USD)、undefined = 不明 (= 0 扱い) */
  remainingBudgetUsd?: number
  /** API 経由を強制する緊急 override (DEC-019-051 緊急脱出経路) */
  emergencyApiOverride?: boolean
  /** dry-run mode を強制 (DryRunGuard 連携) */
  forceDryRun?: boolean
  /** ToS / BAN 等で subscription 経路に乗せられない要因 (Round 9/10 tos-monitor 連携) */
  subscriptionBlockedReason?: string
  /** 想定 単発呼び出し cost (USD) — budget ≦ 想定 cost なら API 不可 */
  estimatedCallCostUsd?: number
}

/**
 * router 出力。
 */
export interface SubscriptionRouterDecision {
  /** 選択された mode */
  selected: SpawnMode
  /** 選択 理由 (audit + 透明性 dashboard 用) */
  reason: string
  /** 警告 (非致命だが caller が考慮すべき情報) */
  warnings: readonly string[]
  /** 選択順位 (subscription > api > dry-run の優先評価結果列) */
  evaluationTrace: readonly EvaluationStep[]
}

/**
 * 個別評価 step (decision の rationale 透明化)。
 */
export interface EvaluationStep {
  /** 評価対象 mode */
  candidate: SpawnMode
  /** 採用 / 棄却 / 保留 */
  outcome: 'selected' | 'rejected' | 'deferred'
  /** outcome の理由 */
  detail: string
}

/**
 * 純関数 decision (副作用 0、同入力で同出力)。
 *
 * 評価順序 (strategy pattern):
 *   1. forceDryRun=true        → dry-run を採用 (最優先)
 *   2. emergencyApiOverride=true → api を採用 (subscription があっても緊急退避)
 *   3. subscriptionAvailable=true && !subscriptionBlockedReason → subscription 採用
 *   4. remainingBudgetUsd >= estimatedCallCostUsd → api 採用 (subscription 不可時の fallback)
 *   5. 上記いずれも満たさない → dry-run 強制 (副作用ゼロ + cost 0、caller に escalation 委譲)
 *
 * @param input router 入力
 * @returns 選択 mode + reason + 評価 trace
 */
export function selectSpawnMode(
  input: SubscriptionRouterInput,
): SubscriptionRouterDecision {
  const trace: EvaluationStep[] = []
  const warnings: string[] = []

  // 1. forceDryRun=true → 最優先
  if (input.forceDryRun) {
    trace.push({
      candidate: 'dry-run',
      outcome: 'selected',
      detail: 'forceDryRun=true (caller explicit override)',
    })
    return Object.freeze({
      selected: 'dry-run' as const,
      reason: 'forceDryRun explicitly requested by caller',
      warnings: Object.freeze(warnings),
      evaluationTrace: Object.freeze(trace),
    })
  }

  // 2. emergencyApiOverride=true → api 採用 (緊急退避)
  if (input.emergencyApiOverride) {
    trace.push({
      candidate: 'subscription',
      outcome: 'rejected',
      detail: 'emergencyApiOverride=true bypasses subscription path',
    })
    trace.push({
      candidate: 'api',
      outcome: 'selected',
      detail: 'emergency API override (DEC-019-051 緊急脱出経路)',
    })
    warnings.push(
      'emergency API override active — DEC-019-051 月総額 ≤$430 cap への影響を監視せよ',
    )
    return Object.freeze({
      selected: 'api' as const,
      reason: 'emergency API override bypasses subscription',
      warnings: Object.freeze(warnings),
      evaluationTrace: Object.freeze(trace),
    })
  }

  // 3. subscription available & not blocked → subscription
  if (input.subscriptionAvailable && !input.subscriptionBlockedReason) {
    trace.push({
      candidate: 'subscription',
      outcome: 'selected',
      detail: 'subscription available, not blocked',
    })
    return Object.freeze({
      selected: 'subscription' as const,
      reason: 'subscription path available (default per DEC-019-051)',
      warnings: Object.freeze(warnings),
      evaluationTrace: Object.freeze(trace),
    })
  }

  // 3b. subscription blocked → trace に記録
  if (input.subscriptionBlockedReason) {
    trace.push({
      candidate: 'subscription',
      outcome: 'rejected',
      detail: `subscription blocked: ${input.subscriptionBlockedReason}`,
    })
    warnings.push(
      `subscription blocked (${input.subscriptionBlockedReason}); falling back to API or dry-run`,
    )
  } else {
    trace.push({
      candidate: 'subscription',
      outcome: 'rejected',
      detail: 'subscription unavailable (subscriptionAvailable=false)',
    })
  }

  // 4. budget が estimatedCallCost 以上なら api fallback
  const budget = input.remainingBudgetUsd ?? 0
  const estCost = input.estimatedCallCostUsd ?? 0
  if (budget >= estCost && budget > 0) {
    trace.push({
      candidate: 'api',
      outcome: 'selected',
      detail: `api fallback (remainingBudgetUsd=${budget} >= estimatedCallCostUsd=${estCost})`,
    })
    warnings.push(
      'subscription unavailable; using API fallback — DEC-019-051 cap への寄与を監視',
    )
    return Object.freeze({
      selected: 'api' as const,
      reason: 'subscription unavailable; api fallback within budget',
      warnings: Object.freeze(warnings),
      evaluationTrace: Object.freeze(trace),
    })
  }

  // 4b. budget 不足
  trace.push({
    candidate: 'api',
    outcome: 'rejected',
    detail: `api fallback rejected: remainingBudgetUsd=${budget} < estimatedCallCostUsd=${estCost}`,
  })

  // 5. すべて不可 → dry-run 強制
  trace.push({
    candidate: 'dry-run',
    outcome: 'selected',
    detail: 'no path available; forced dry-run for safety (caller must escalate)',
  })
  warnings.push(
    'all paths blocked (subscription unavailable + api budget insufficient); forced dry-run, caller must escalate to HITL',
  )
  return Object.freeze({
    selected: 'dry-run' as const,
    reason: 'forced dry-run: subscription unavailable + api budget insufficient',
    warnings: Object.freeze(warnings),
    evaluationTrace: Object.freeze(trace),
  })
}

/**
 * 純関数 helper: SubscriptionRouterDecision から SpawnMode のみ取り出す。
 */
export function decisionToMode(decision: SubscriptionRouterDecision): SpawnMode {
  return decision.selected
}

/**
 * cost-projection helper (純関数): 想定 single-call cost と call 数で必要 budget を返す。
 * caller が selectSpawnMode に渡す前の事前評価に使う。
 *
 * @returns USD で表現された必要 budget (estimatedCallCostUsd * estimatedCallCount)
 */
export function projectRequiredBudgetUsd(
  estimatedCallCostUsd: number,
  estimatedCallCount: number,
): number {
  if (estimatedCallCostUsd < 0 || estimatedCallCount < 0) return 0
  return Math.round(estimatedCallCostUsd * estimatedCallCount * 1_000_000) / 1_000_000
}

/**
 * 純関数: subscription 経路を試行できるかの最低限 precondition (副作用 0)。
 */
export function isSubscriptionEligible(input: SubscriptionRouterInput): boolean {
  if (input.forceDryRun) return false
  if (input.emergencyApiOverride) return false
  if (!input.subscriptionAvailable) return false
  if (input.subscriptionBlockedReason) return false
  return true
}

// ============================================================================
// Round 12 Dev-D 追補 (Task A wiring): kill-switch 自動 register / unregister
// ============================================================================

import type {
  SpawnClaudeCodeOptions,
  SpawnHandle,
  SpawnKillRegistry,
  SpawnKillRegistryToken,
} from './spawn-claude-code.js'
import { spawnClaudeCode, wireSpawnHandleToKillSwitch } from './spawn-claude-code.js'

/**
 * subscription-router の decision に基づき spawnClaudeCode を起動し、
 * 同時に kill-switch.registerSubprocessKill で kill chain (G-05/G-06) と
 * 自動連携する orchestration helper。
 *
 * 動作:
 *   1. decision.selected を spawnOptions.mode に焼き込む (caller の指定を上書き)
 *   2. spawnClaudeCode を呼ぶ
 *   3. registry が渡されていれば wireSpawnHandleToKillSwitch で
 *      auto register/unregister 配線を行う (handle.done() で自動 unregister)
 *
 * 戻り値:
 *   - handle  : SpawnHandle (lifecycle 操作用)
 *   - killToken: KillSwitch 登録 token (caller が任意で先行 unregister 可能、null = dry-run)
 *
 * 注意:
 *   - 本 helper は副作用ありの上位 layer 用。pure decision のみ欲しい場合は
 *     `selectSpawnMode` を直接使う (Round 11 までの API 完全互換)。
 *   - registry 未指定の場合、kill-switch 配線は行わず単純に spawn のみ実行。
 *
 * @param decision selectSpawnMode の戻り値
 * @param spawnOptions spawnClaudeCode に渡す options (mode は decision で上書き)
 * @param registry 任意: harness の KillSwitch (registerSubprocessKill を持つ object)
 * @returns handle + killToken
 */
export function spawnFromDecision(
  decision: SubscriptionRouterDecision,
  spawnOptions: Omit<SpawnClaudeCodeOptions, 'mode'>,
  registry?: SpawnKillRegistry,
): { handle: SpawnHandle; killToken: SpawnKillRegistryToken | null } {
  const handle = spawnClaudeCode({
    ...spawnOptions,
    mode: decision.selected,
  })
  const killToken = registry ? wireSpawnHandleToKillSwitch(handle, registry) : null
  return { handle, killToken }
}
