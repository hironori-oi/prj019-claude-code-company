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
  type KillSwitch,
  type KillTriggerHandler,
  type KillTriggerMeta,
  type KillRecord,
  type SubprocessKillTarget,
  type CircuitBreakerOpenTarget,
  type KillProcessTreeDeps,
  type KillProcessTreeResult,
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
