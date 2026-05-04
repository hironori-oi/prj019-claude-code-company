/**
 * usage-monitor — 使用量モニタリング (C-A-04 対応)。
 *
 * 関連必須コントロール:
 *   C-A-04 (Sumi/Asagi/Clawbridge 3 重監視 + 5h ローリング)
 *   G-V2-02 (レート自主上限 70%)
 *   G-V2-08 (401/403/429 連続検知 → kill switch)
 *   G-04   (cost watchdog 3 段階閾値: warn / auto_stop / hard_fail) — Round 6 追加
 *   NG-3 予防 (連続稼働 12h)
 *
 * 機能:
 *   - recordCall(provider, meta) : 各 API/OAuth call を記録
 *   - 401/403/429 連続検知 → kill-switch トリガー
 *   - 12h 連続稼働超過 → kill-switch トリガー
 *   - 5h ローリング集計 (count / tokens / cost)
 *   - cost watchdog (Round 6): cost-tracker と連携し $24 / $28.5 / $30 の
 *     3 段階閾値で warn → auto_stop → hard_fail を発火。
 *     Slack #monitor 通知 hook (notifySlackMonitor) は injectable。
 *
 * 永続化: ~/.clawbridge/usage-ledger.json (JSON / atomic write)
 *
 * Anomaly thresholds (default):
 *   - 401/403/429 が 1 分窓で 5 件超 → kill 触発
 *   - 12h 連続稼働 → kill 触発
 *
 * Phase 1 では rate limit info ヘッダの解釈は claude-bridge 側で行い、
 * usage-monitor はメタとして cost_usd / tokens / status を受け取るのみ。
 */
import { USAGE_LEDGER_PATH, HARNESS_BOOT_PATH } from './paths.js'
import { loadJson, saveJson } from './fs-store.js'
import type { KillSwitch } from './kill-switch.js'
import type { TimeSource } from './time-source.js'
import {
  classifyWatchdogTier,
  computeWatchdogThresholds,
  DEFAULT_LIMITS,
  type BudgetLimits,
  type CostTracker,
  type WatchdogTier,
  type WatchdogThreshold,
} from './cost-tracker.js'

export type UsageProvider =
  | 'anthropic_oauth'
  | 'anthropic_api'
  | 'openai_oauth'
  | 'openai_api'
  | 'vercel'
  | 'supabase'

export interface UsageCallRecord {
  ts: string
  provider: UsageProvider
  status: number
  tokens?: number
  costUsd?: number
  durationMs?: number
  meta?: Record<string, unknown>
}

export interface UsageLedger {
  version: 1
  records: UsageCallRecord[]
}

export interface UsageAggregate {
  count: number
  tokens: number
  costUsd: number
  errors4xx: number
  errors5xx: number
  authErrors: number // 401/403
  rateErrors: number // 429
}

/**
 * Slack #monitor 通知 callback (Round 6 G-04)。
 * 副作用 (HTTP post) は呼び出し側で実装。テストでは noop / spy を渡す。
 */
export type SlackMonitorNotify = (payload: {
  tier: WatchdogTier
  thresholdUsd: number
  currentUsd: number
  ratio: number
  message: string
}) => Promise<void> | void

/**
 * cost watchdog 状態 (Round 6 G-04)。
 * - lastTier: 直近で発火した tier (重複通知抑止用)
 * - autoStopped: auto_stop 段階で自走停止フラグが立っているか
 */
export interface WatchdogState {
  lastTier: WatchdogTier | null
  autoStopped: boolean
  lastFiredAt: string | null
}

export interface UsageMonitorConfig {
  ledgerPath?: string
  bootPath?: string
  killSwitch?: KillSwitch
  /** 連続稼働上限 (ms)。default 12h */
  maxRuntimeMs?: number
  /** 401/403/429 を anomaly と判定する 1 分窓内の閾値 */
  authAnomalyThreshold?: number
  /** anomaly 判定窓 (ms)。default 60s */
  anomalyWindowMs?: number
  /**
   * 時刻取得 callback。後方互換用。新規利用は timeSource を推奨。
   * 両方指定された場合は timeSource が優先される。
   */
  now?: () => Date
  /**
   * TimeSource 注入 (G-08 / G-V2-08 のテスト用)。
   * libfaketime 代替: 12h ルーフタイムや 60s 窓の決定論的テストを可能にする。
   */
  timeSource?: TimeSource
  // ---- Round 6 G-04 cost watchdog ----
  /**
   * cost-tracker 注入 (Round 6 G-04)。指定時は cost watchdog 機能が有効化される。
   * polling は startRuntimeWatch で interval 駆動。
   */
  costTracker?: CostTracker
  /** watchdog 用 budget 上限 (default DEFAULT_LIMITS) */
  watchdogLimits?: BudgetLimits
  /** Slack #monitor 通知 callback (default: noop) */
  notifySlackMonitor?: SlackMonitorNotify
  /**
   * runtime watch / cost watchdog の polling interval (ms)。
   * Round 6: テスト時間短縮のため injectable に。
   * default 60_000 (= 60s)。
   */
  watchIntervalMs?: number
}

export interface UsageMonitor {
  recordCall(
    provider: UsageProvider,
    meta: { status: number; tokens?: number; costUsd?: number; durationMs?: number; [k: string]: unknown },
  ): Promise<void>
  getDailyAggregate(provider?: UsageProvider): Promise<UsageAggregate>
  getRollingAggregate(windowMs: number, provider?: UsageProvider): Promise<UsageAggregate>
  /** 連続稼働 12h 監視を開始 (boot 時刻を記録) */
  startRuntimeWatch(): Promise<void>
  /** 連続稼働 watch を停止 */
  stopRuntimeWatch(): Promise<void>
  reset(): Promise<void>
  // ---- Round 6 G-04 cost watchdog ----
  /**
   * 現在の cost watchdog 状態を取得 (Round 6 G-04)。
   * `autoStopped=true` なら Open Claw 側は新規 loop 受付を止めるべき。
   */
  getWatchdogState(): WatchdogState
  /**
   * cost watchdog を 1 サイクル評価 (Round 6 G-04)。
   * polling は startRuntimeWatch 内部で interval 駆動するが、テスト用に手動 step 可能。
   * - cost-tracker 未注入 / costTracker 未指定の場合は no-op
   */
  checkWatchdog(): Promise<WatchdogTier | null>
}

export class FileUsageMonitor implements UsageMonitor {
  private readonly ledgerPath: string
  private readonly bootPath: string
  private readonly killSwitch?: KillSwitch
  private readonly maxRuntimeMs: number
  private readonly authAnomalyThreshold: number
  private readonly anomalyWindowMs: number
  private readonly now: () => Date

  // Round 6 G-04 cost watchdog
  private readonly costTracker: CostTracker | undefined
  private readonly watchdogThresholds: readonly WatchdogThreshold[]
  private readonly notifySlackMonitor: SlackMonitorNotify
  private readonly watchIntervalMs: number
  private watchdogState: WatchdogState = {
    lastTier: null,
    autoStopped: false,
    lastFiredAt: null,
  }

  private runtimeTimer: NodeJS.Timeout | null = null

  constructor(opts: UsageMonitorConfig = {}) {
    this.ledgerPath = opts.ledgerPath ?? USAGE_LEDGER_PATH
    this.bootPath = opts.bootPath ?? HARNESS_BOOT_PATH
    if (opts.killSwitch !== undefined) {
      this.killSwitch = opts.killSwitch
    }
    this.maxRuntimeMs = opts.maxRuntimeMs ?? 12 * 60 * 60 * 1000
    this.authAnomalyThreshold = opts.authAnomalyThreshold ?? 5
    this.anomalyWindowMs = opts.anomalyWindowMs ?? 60_000
    if (opts.timeSource) {
      const ts = opts.timeSource
      this.now = () => ts.now()
    } else {
      this.now = opts.now ?? (() => new Date())
    }
    // Round 6 G-04 cost watchdog
    this.costTracker = opts.costTracker
    this.watchdogThresholds = computeWatchdogThresholds(
      opts.watchdogLimits ?? DEFAULT_LIMITS,
    )
    this.notifySlackMonitor = opts.notifySlackMonitor ?? (() => undefined)
    this.watchIntervalMs = opts.watchIntervalMs ?? 60_000
  }

  private async load(): Promise<UsageLedger> {
    return loadJson<UsageLedger>(this.ledgerPath, { version: 1, records: [] })
  }

  private async save(ledger: UsageLedger): Promise<void> {
    await saveJson(this.ledgerPath, ledger)
  }

  async recordCall(
    provider: UsageProvider,
    meta: { status: number; tokens?: number; costUsd?: number; durationMs?: number; [k: string]: unknown },
  ): Promise<void> {
    const { status, tokens, costUsd, durationMs, ...rest } = meta
    const record: UsageCallRecord = {
      ts: this.now().toISOString(),
      provider,
      status,
      ...(tokens !== undefined && { tokens }),
      ...(costUsd !== undefined && { costUsd }),
      ...(durationMs !== undefined && { durationMs }),
      ...(Object.keys(rest).length > 0 && { meta: rest }),
    }
    const ledger = await this.load()
    ledger.records.push(record)
    await this.save(ledger)

    // anomaly 検知
    if (status === 401 || status === 403 || status === 429) {
      await this.checkAuthAnomaly()
    }
  }

  private async checkAuthAnomaly(): Promise<void> {
    if (!this.killSwitch) return
    const ledger = await this.load()
    const cutoff = this.now().getTime() - this.anomalyWindowMs
    const recent = ledger.records.filter((r) => {
      const t = new Date(r.ts).getTime()
      return t >= cutoff && (r.status === 401 || r.status === 403 || r.status === 429)
    })
    if (recent.length >= this.authAnomalyThreshold) {
      await this.killSwitch.trigger(
        `auth/rate anomaly: ${recent.length} of {401,403,429} within ${this.anomalyWindowMs}ms`,
        {
          source: 'rate_anomaly',
          details: {
            count: recent.length,
            windowMs: this.anomalyWindowMs,
            threshold: this.authAnomalyThreshold,
          },
        },
      )
    }
  }

  async getDailyAggregate(provider?: UsageProvider): Promise<UsageAggregate> {
    const ledger = await this.load()
    const cutoff = startOfDay(this.now())
    return aggregate(
      ledger.records.filter(
        (r) => new Date(r.ts) >= cutoff && (!provider || r.provider === provider),
      ),
    )
  }

  async getRollingAggregate(windowMs: number, provider?: UsageProvider): Promise<UsageAggregate> {
    const ledger = await this.load()
    const cutoff = this.now().getTime() - windowMs
    return aggregate(
      ledger.records.filter(
        (r) => new Date(r.ts).getTime() >= cutoff && (!provider || r.provider === provider),
      ),
    )
  }

  async startRuntimeWatch(): Promise<void> {
    await saveJson(this.bootPath, { bootAt: this.now().toISOString() })
    if (this.runtimeTimer) clearInterval(this.runtimeTimer)
    this.runtimeTimer = setInterval(() => {
      void this.checkRuntime()
      // Round 6 G-04: cost watchdog も同 interval で評価
      void this.checkWatchdog()
    }, this.watchIntervalMs)
    this.runtimeTimer.unref?.()
  }

  async stopRuntimeWatch(): Promise<void> {
    if (this.runtimeTimer) {
      clearInterval(this.runtimeTimer)
      this.runtimeTimer = null
    }
  }

  private async checkRuntime(): Promise<void> {
    if (!this.killSwitch) return
    const boot = await loadJson<{ bootAt?: string }>(this.bootPath, {})
    if (!boot.bootAt) return
    const elapsed = this.now().getTime() - new Date(boot.bootAt).getTime()
    if (elapsed >= this.maxRuntimeMs) {
      await this.killSwitch.trigger(
        `continuous runtime exceeded ${this.maxRuntimeMs}ms (NG-3 予防 12h 上限)`,
        {
          source: 'continuous_runtime',
          details: { elapsedMs: elapsed, limitMs: this.maxRuntimeMs },
        },
      )
    }
  }

  // ---- Round 6 G-04 cost watchdog ----

  getWatchdogState(): WatchdogState {
    return { ...this.watchdogState }
  }

  async checkWatchdog(): Promise<WatchdogTier | null> {
    if (!this.costTracker) return null
    const currentUsd = await this.costTracker.getDailyTotal()
    const tier = classifyWatchdogTier(currentUsd, this.watchdogThresholds)
    if (tier === null) return null

    const tierOrder: Record<WatchdogTier, number> = {
      warn: 1,
      auto_stop: 2,
      hard_fail: 3,
    }
    const lastOrder = this.watchdogState.lastTier ? tierOrder[this.watchdogState.lastTier] : 0
    const currentOrder = tierOrder[tier]
    // 既に同じ or より高い tier で発火済なら冪等 (重複通知抑止)
    if (currentOrder <= lastOrder) {
      return tier
    }

    const matched = this.watchdogThresholds.find((t) => t.tier === tier)
    const thresholdUsd = matched?.thresholdUsd ?? 0
    const ratio = matched?.ratio ?? 0
    const message =
      tier === 'warn'
        ? `cost watchdog: warn tier reached $${currentUsd.toFixed(2)} >= $${thresholdUsd.toFixed(2)} (${(ratio * 100).toFixed(0)}%)`
        : tier === 'auto_stop'
          ? `cost watchdog: auto_stop tier reached $${currentUsd.toFixed(2)} >= $${thresholdUsd.toFixed(2)} (${(ratio * 100).toFixed(0)}%) — Open Claw 自走停止`
          : `cost watchdog: hard_fail tier reached $${currentUsd.toFixed(2)} >= $${thresholdUsd.toFixed(2)} (${(ratio * 100).toFixed(0)}%) — kill-switch トリガー`

    // Slack #monitor 通知 (best effort)
    try {
      await this.notifySlackMonitor({
        tier,
        thresholdUsd,
        currentUsd,
        ratio,
        message,
      })
    } catch {
      // 通知失敗は kill / auto_stop 動作を阻害しない
    }

    // tier 別アクション
    if (tier === 'auto_stop') {
      this.watchdogState.autoStopped = true
    }
    if (tier === 'hard_fail' && this.killSwitch) {
      await this.killSwitch.trigger(message, {
        source: 'budget',
        details: {
          watchdogTier: tier,
          currentUsd,
          thresholdUsd,
          ratio,
        },
      })
    }

    this.watchdogState = {
      lastTier: tier,
      autoStopped: this.watchdogState.autoStopped || tier === 'auto_stop' || tier === 'hard_fail',
      lastFiredAt: this.now().toISOString(),
    }
    return tier
  }

  async reset(): Promise<void> {
    await this.save({ version: 1, records: [] })
    this.watchdogState = { lastTier: null, autoStopped: false, lastFiredAt: null }
  }
}

function aggregate(records: UsageCallRecord[]): UsageAggregate {
  const agg: UsageAggregate = {
    count: 0,
    tokens: 0,
    costUsd: 0,
    errors4xx: 0,
    errors5xx: 0,
    authErrors: 0,
    rateErrors: 0,
  }
  for (const r of records) {
    agg.count += 1
    agg.tokens += r.tokens ?? 0
    agg.costUsd += r.costUsd ?? 0
    if (r.status === 401 || r.status === 403) agg.authErrors += 1
    if (r.status === 429) agg.rateErrors += 1
    if (r.status >= 400 && r.status < 500) agg.errors4xx += 1
    if (r.status >= 500 && r.status < 600) agg.errors5xx += 1
  }
  return agg
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
