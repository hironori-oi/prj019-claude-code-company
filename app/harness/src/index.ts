/**
 * @clawbridge/harness — ハーネス制御層公開エントリ。
 *
 * 各モジュールを再エクスポートし、Harness クラスでライフサイクル管理を提供する。
 */
export {
  FileCostTracker,
  DEFAULT_LIMITS,
  DEFAULT_WATCHDOG_RATIOS,
  computeWatchdogThresholds,
  classifyWatchdogTier,
  type CostTracker,
  type CostCategory,
  type CostRecord,
  type CostLedger,
  type BudgetLimits,
  type BudgetCheckResult,
  type WatchdogTier,
  type WatchdogThreshold,
} from './cost-tracker.js'

export {
  FileKillSwitch,
  killProcessTree,
  realKillProcessTreeDeps,
  KillSwitchError,
  SUBPROCESS_KILL_LIMIT,
  // Round 13 Dev-D Task A: graceful shutdown 設定
  KillSwitchOptionsSchema,
  DEFAULT_KILL_SWITCH_GRACEFUL,
  KILL_SWITCH_ENV_GRACE_KEY,
  KILL_SWITCH_ENV_SIGTERM_KEY,
  KILL_SWITCH_ENV_SIGKILL_KEY,
  resolveKillSwitchOptionsFromEnv,
  mergeKillSwitchGracefulConfig,
  type KillSwitch,
  type KillTriggerHandler,
  type KillTriggerMeta,
  type KillRecord,
  type SubprocessKillTarget,
  type CircuitBreakerOpenTarget,
  type KillProcessTreeDeps,
  type KillProcessTreeResult,
  type KillToken,
  type KillSwitchErrorCode,
  type KillSwitchOptionsType,
  type ResolvedKillSwitchGracefulConfig,
} from './kill-switch.js'

export {
  FileHitlGate,
  TosGrayReviewPayload,
  type HitlGate,
  type HitlAction,
  type HitlActionType,
  type HitlActionKind,
  type HitlRiskLevel,
  type HitlApprovalResult,
  type HitlRejectionReason,
  type TosGrayReviewPayloadType,
} from './hitl-gate.js'

export {
  createHitlEnforcer,
  type HitlEnforcer,
  type HitlEnforcerOptions,
  type EnforceBeforeSpawnInput,
  type EnforceBeforeSpawnResult,
} from './hitl-enforcer.js'

export {
  createKickoffGate,
  buildKickoffHitlAction,
  DevKickoffProposalSchema,
  DEV_KICKOFF_ACTION_TYPE,
  KICKOFF_SLA_MS,
  type CostRollbackHook,
  type DevKickoffActionType,
  type DevKickoffProposal,
  type KickoffApprovalResult,
  type KickoffGate,
  type KickoffGateOptions,
  type KickoffHitlGate,
  type KickoffStatus,
} from './hitl-kickoff-gate.js'

export {
  executeScenario,
  banDrillScenario1,
  banDrillScenario2,
  banDrillScenario3,
  banDrillScenarios,
  type BanDrillScenario,
  type BanDrillStep,
  type BanDrillContext,
  type BanDrillRun,
  type BanDrillStepRun,
  type DrillStepOutcome,
  type ExecuteScenarioOptions,
} from './ban-drill.js'

export {
  CircuitBreaker,
  CircuitOpenError,
  type CircuitState,
  type CircuitStatus,
  type CircuitBreakerConfig,
} from './circuit-breaker.js'

export {
  FileTosMonitor,
  createTosMonitor,
  createAuditHook,
  shouldFallbackToApiKey,
  ContinuousRunDetector,
  CostCapDetector,
  RateSpikeDetector,
  MockAnthropicWarningSource,
  ANTHROPIC_WARNING_FIXTURES,
  NG3_PLANS,
  type TosMonitor,
  type TosMonitorOptions,
  type TosMonitorEvent,
  type TosMonitorEventType,
  type TosMonitorTier,
  type TosMonitorListener,
  type Ng3Plan,
  type Ng3PlanConfig,
  type WarningEvent,
  type AnthropicWarningSource,
  type FallbackDecision,
  type FallbackDecisionInput,
  type FallbackReason,
  type SubscriptionSessionState,
  type AuditAppender,
  type RateSpikeSample,
} from './tos-monitor.js'

export {
  FileUsageMonitor,
  type UsageMonitor,
  type UsageProvider,
  type UsageCallRecord,
  type UsageAggregate,
  type UsageMonitorConfig,
  type SlackMonitorNotify,
  type WatchdogState,
} from './usage-monitor.js'

export * from './paths.js'

// Round 13 Dev-E 前倒し: KE 系 5 件 (KE-01〜04 + HITL-11) を W4→W2 push.
export * from './knowledge/index.js'

// Round 14 Dev-D Task A: HITL gate 第 12 種 (cli_version_update_approval) harness adapter.
// - 既存 hitl-gate.ts / slack-quick-action.ts は無改変、本 adapter 経由で gate-12 を運用.
// - HitlActionType への正式追加は CEO 議決待ち、現状は 'paid_api_call' 流用.
export {
  GATE_12_TYPE,
  Gate12CheckOutcomeSchema,
  Gate12ApproveActionSchema,
  Gate12RejectActionSchema,
  Gate12DeferActionSchema,
  Gate12DecisionSchema,
  Gate12RequestSchema,
  Gate12SlackQuickActionSchema,
  ACTION_ID_GATE12_APPROVE,
  ACTION_ID_GATE12_REJECT,
  ACTION_ID_GATE12_DEFER,
  gate12RequestToHitlAction,
  interpretHitlResult as interpretGate12HitlResult,
  buildGate12SlackButtons,
  parseGate12SlackQuickAction,
  fireGate12HitlGate,
  type Gate12CheckOutcome,
  type Gate12ApproveAction,
  type Gate12RejectAction,
  type Gate12DeferAction,
  type Gate12Decision,
  type Gate12Request,
  type Gate12SlackQuickAction,
  type Gate12SlackButton,
  type BuildGate12SlackButtonsOptions,
  type FireGate12Options,
} from './hitl/gate-12-cli-version-update.js'

// Round 15 Dev-M (M-1): gate-12 + audit-store SHA-256 chain 統合 fire helper.
// - 既存 gate-12-cli-version-update.ts / hitl-gate.ts / audit-store.ts は無改変.
// - request 発火 + decision 確定の 2 entry を 'hitl_decision' type で append.
export {
  buildGate12FireAuditPayload,
  buildGate12DecisionAuditPayload,
  fireGate12WithAudit,
  Gate12ChainIntegrityError,
  type Gate12FirePhase,
  type Gate12AuditFireOptions,
  type Gate12AuditFireResult,
} from './hitl/gate-12-audit-fire.js'

export {
  RealTimeSource,
  FakeTimeSource,
  asDateCallback,
  asNumberCallback,
  type TimeSource,
} from './time-source.js'

import { FileCostTracker, type CostTracker, type BudgetLimits } from './cost-tracker.js'
import { FileKillSwitch, type KillSwitch } from './kill-switch.js'
import { FileHitlGate, type HitlGate } from './hitl-gate.js'
import { FileUsageMonitor, type UsageMonitor } from './usage-monitor.js'

/**
 * ハーネス全体のライフサイクル管理。
 *
 * 使い方:
 * ```ts
 * const h = new Harness()
 * await h.init()
 * // ... orchestrator / claude-bridge から h.cost / h.kill / h.hitl / h.usage を使用
 * await h.shutdown()
 * ```
 */
export interface HarnessOptions {
  costLimits?: BudgetLimits
  /** kill 触発時に process.exit() を呼ぶか (本番 true / test false) */
  exitOnKill?: boolean
  /** 連続稼働 12h 監視を有効化するか */
  enableRuntimeWatch?: boolean
}

export class Harness {
  readonly cost: CostTracker
  readonly kill: KillSwitch
  readonly hitl: HitlGate
  readonly usage: UsageMonitor

  private initialized = false

  constructor(opts: HarnessOptions = {}) {
    this.cost = new FileCostTracker(
      opts.costLimits !== undefined ? { limits: opts.costLimits } : {},
    )
    this.kill = new FileKillSwitch({ exitOnTrigger: opts.exitOnKill ?? false })
    this.hitl = new FileHitlGate()
    this.usage = new FileUsageMonitor({ killSwitch: this.kill })

    // 予算超過 → kill switch 連携
    this.kill.onTrigger(async (reason) => {
      // best effort logging
      // eslint-disable-next-line no-console
      console.error(`[harness] kill triggered: ${reason}`)
    })

    if (opts.enableRuntimeWatch !== false) {
      // default true
    }
  }

  async init(): Promise<void> {
    if (this.initialized) return
    await this.kill.arm()
    await this.usage.startRuntimeWatch()
    this.initialized = true
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) return
    await this.kill.disarm()
    await this.usage.stopRuntimeWatch()
    this.initialized = false
  }

  /**
   * 任意操作の前に予算 + kill 状態をチェックし、問題なければ fn を実行。
   * 予算超過時は kill-switch を発動する。
   */
  async guardedRun<T>(
    opts: { sessionId?: string; projectId?: string },
    fn: () => Promise<T>,
  ): Promise<T> {
    if (this.kill.isTriggered()) {
      throw new Error('harness: kill-switch already triggered')
    }
    const budget = await this.cost.checkBudget(opts)
    if (!budget.ok) {
      await this.kill.trigger(budget.reason ?? 'budget exceeded', {
        source: 'budget',
        details: { ...budget } as Record<string, unknown>,
      })
      throw new Error(`harness: budget guard failed: ${budget.reason}`)
    }
    return fn()
  }

  status(): {
    initialized: boolean
    killArmed: boolean
    killTriggered: boolean
  } {
    return {
      initialized: this.initialized,
      killArmed: this.kill.isArmed(),
      killTriggered: this.kill.isTriggered(),
    }
  }
}
