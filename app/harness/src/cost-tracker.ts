/**
 * cost-tracker — 4 層ハードキャップ コスト追跡器。
 *
 * 関連必須コントロール:
 *   G-01 (コスト上限ハードキャップ) / G-V2-09 (Boris Cherny 線 $1,000 自主上限)
 *   G-04 (usage monitor watchdog 3 段階閾値: warn / auto_stop / hard_fail)
 *
 * 4 層キャップ:
 *   - per session   : $5
 *   - per project   : $50
 *   - per day       : $30
 *   - per month     : $300 (Phase 1 月次予算)
 *   - 加えて Boris Cherny 線 $1,000/月 を超えそうな兆候は usage-monitor で kill-switch トリガー
 *
 * Round 6 拡張 (G-04 watchdog 3 段階閾値):
 *   - $24    (warn)      : 80% — Slack #monitor に warning 通知のみ (kill しない)
 *   - $28.5  (auto_stop) : 95% — Open Claw 自走を停止 (新規 loop 受付停止)
 *   - $30    (hard_fail) : 100% — kill-switch トリガー (即時停止)
 *   - 比率は perDayUsd を基準にした既定値で、limits を変更すれば自動追従する。
 *
 * 永続化: ~/.clawbridge/cost-ledger.json (JSON / atomic write)。
 * W0 段階では Supabase 化せず単純 JSON。Phase 1 W2 で audit/ から append-only 化検討。
 *
 * 実装方針:
 *   - 単純な append-only ledger (records[]) を保持
 *   - 各 query は records をフィルタ + 合算
 *   - 同時書込を避けるため getLedgerLock で読込→書込を逐次化 (W0 は process 1 並列前提なので実質不要)
 */
import { COST_LEDGER_PATH } from './paths.js'
import { loadJson, saveJson } from './fs-store.js'
import type { TimeSource } from './time-source.js'

export type CostCategory =
  | 'anthropic_api'
  | 'anthropic_subscription' // Claude Max OAuth 由来 (推定値)
  | 'openai_api'
  | 'openai_subscription' // ChatGPT Pro / Codex OAuth 由来 (推定値)
  | 'vercel_sandbox'
  | 'vercel_other'
  | 'supabase'
  | 'other'

export interface CostRecord {
  ts: string // ISO timestamp
  category: CostCategory
  amountUsd: number
  sessionId?: string
  projectId?: string // PRJ-XXX
  meta?: Record<string, unknown>
}

export interface CostLedger {
  version: 1
  records: CostRecord[]
}

export interface BudgetLimits {
  perSessionUsd: number
  perProjectUsd: number
  perDayUsd: number
  perMonthUsd: number
}

export interface BudgetCheckResult {
  ok: boolean
  reason?: string
  limit?: number
  current?: number
  layer?: 'session' | 'project' | 'day' | 'month'
}

export const DEFAULT_LIMITS: BudgetLimits = {
  perSessionUsd: 5,
  perProjectUsd: 50,
  perDayUsd: 30,
  perMonthUsd: 300,
}

/**
 * G-04 watchdog 3 段階閾値 (Round 6 / 議決-25 採択前提 前倒し)。
 *
 * - warn      : 80% — Slack #monitor に notice (継続稼働可)
 * - auto_stop : 95% — Open Claw 自走停止 (新規 loop 拒否、kill はしない)
 * - hard_fail : 100% — kill-switch トリガー
 *
 * 既定値は perDayUsd を基準にした $24 / $28.5 / $30 (= 30 * 0.8 / 0.95 / 1.0)。
 * limits を変更すれば本関数経由で自動追従する。
 */
export type WatchdogTier = 'warn' | 'auto_stop' | 'hard_fail'

export interface WatchdogThreshold {
  tier: WatchdogTier
  thresholdUsd: number
  /** 比率 (0〜1)。perDayUsd に対するパーセンテージ。 */
  ratio: number
}

export const DEFAULT_WATCHDOG_RATIOS: Readonly<Record<WatchdogTier, number>> = Object.freeze({
  warn: 0.8,
  auto_stop: 0.95,
  hard_fail: 1.0,
})

/**
 * BudgetLimits.perDayUsd を基準に 3 段階閾値を計算する純関数。
 * 既定値だと $30 → ($24, $28.5, $30) を返す。
 */
export function computeWatchdogThresholds(
  limits: BudgetLimits = DEFAULT_LIMITS,
  ratios: Readonly<Record<WatchdogTier, number>> = DEFAULT_WATCHDOG_RATIOS,
): readonly WatchdogThreshold[] {
  return Object.freeze([
    { tier: 'warn', thresholdUsd: limits.perDayUsd * ratios.warn, ratio: ratios.warn },
    { tier: 'auto_stop', thresholdUsd: limits.perDayUsd * ratios.auto_stop, ratio: ratios.auto_stop },
    { tier: 'hard_fail', thresholdUsd: limits.perDayUsd * ratios.hard_fail, ratio: ratios.hard_fail },
  ])
}

/**
 * 現在 spend を 3 段階閾値に照らして tier を返す純関数。
 * `null` を返す場合はまだ warn にも到達していない。
 */
export function classifyWatchdogTier(
  currentUsd: number,
  thresholds: readonly WatchdogThreshold[],
): WatchdogTier | null {
  // hard_fail から逆順に比較 (高い tier が優先)
  const sorted = [...thresholds].sort((a, b) => b.thresholdUsd - a.thresholdUsd)
  for (const t of sorted) {
    if (currentUsd >= t.thresholdUsd) return t.tier
  }
  return null
}

/**
 * CostTracker インターフェース。
 */
export interface CostTracker {
  recordSpend(
    category: CostCategory,
    amountUsd: number,
    meta?: { sessionId?: string; projectId?: string; [k: string]: unknown },
  ): Promise<void>
  getMonthlyTotal(category?: CostCategory): Promise<number>
  getDailyTotal(category?: CostCategory): Promise<number>
  getSessionTotal(sessionId: string): Promise<number>
  getProjectTotal(projectId: string): Promise<number>
  checkBudget(opts?: { sessionId?: string; projectId?: string }): Promise<BudgetCheckResult>
  /** ledger 全消去 (テスト用) */
  reset(): Promise<void>
}

interface CostTrackerOptions {
  ledgerPath?: string
  limits?: BudgetLimits
  /**
   * 現在時刻取得関数 (テスト時注入用)。後方互換。
   */
  now?: () => Date
  /**
   * TimeSource 注入 (libfaketime 代替)。指定時は now より優先。
   */
  timeSource?: TimeSource
}

export class FileCostTracker implements CostTracker {
  private readonly ledgerPath: string
  private readonly limits: BudgetLimits
  private readonly now: () => Date

  constructor(opts: CostTrackerOptions = {}) {
    this.ledgerPath = opts.ledgerPath ?? COST_LEDGER_PATH
    this.limits = opts.limits ?? DEFAULT_LIMITS
    if (opts.timeSource) {
      const ts = opts.timeSource
      this.now = () => ts.now()
    } else {
      this.now = opts.now ?? (() => new Date())
    }
  }

  private async load(): Promise<CostLedger> {
    return loadJson<CostLedger>(this.ledgerPath, { version: 1, records: [] })
  }

  private async save(ledger: CostLedger): Promise<void> {
    await saveJson(this.ledgerPath, ledger)
  }

  async recordSpend(
    category: CostCategory,
    amountUsd: number,
    meta: { sessionId?: string; projectId?: string; [k: string]: unknown } = {},
  ): Promise<void> {
    if (!Number.isFinite(amountUsd) || amountUsd < 0) {
      throw new Error(`cost-tracker: invalid amountUsd ${amountUsd}`)
    }
    const ledger = await this.load()
    const { sessionId, projectId, ...rest } = meta
    const record: CostRecord = {
      ts: this.now().toISOString(),
      category,
      amountUsd,
      ...(sessionId !== undefined && { sessionId }),
      ...(projectId !== undefined && { projectId }),
      ...(Object.keys(rest).length > 0 && { meta: rest }),
    }
    ledger.records.push(record)
    await this.save(ledger)
  }

  async getMonthlyTotal(category?: CostCategory): Promise<number> {
    const ledger = await this.load()
    const cutoff = startOfMonth(this.now())
    return ledger.records
      .filter((r) => new Date(r.ts) >= cutoff && (!category || r.category === category))
      .reduce((sum, r) => sum + r.amountUsd, 0)
  }

  async getDailyTotal(category?: CostCategory): Promise<number> {
    const ledger = await this.load()
    const cutoff = startOfDay(this.now())
    return ledger.records
      .filter((r) => new Date(r.ts) >= cutoff && (!category || r.category === category))
      .reduce((sum, r) => sum + r.amountUsd, 0)
  }

  async getSessionTotal(sessionId: string): Promise<number> {
    const ledger = await this.load()
    return ledger.records
      .filter((r) => r.sessionId === sessionId)
      .reduce((sum, r) => sum + r.amountUsd, 0)
  }

  async getProjectTotal(projectId: string): Promise<number> {
    const ledger = await this.load()
    return ledger.records
      .filter((r) => r.projectId === projectId)
      .reduce((sum, r) => sum + r.amountUsd, 0)
  }

  async checkBudget(opts: { sessionId?: string; projectId?: string } = {}): Promise<BudgetCheckResult> {
    const month = await this.getMonthlyTotal()
    if (month >= this.limits.perMonthUsd) {
      return {
        ok: false,
        reason: `monthly budget exceeded: $${month.toFixed(2)} >= $${this.limits.perMonthUsd}`,
        limit: this.limits.perMonthUsd,
        current: month,
        layer: 'month',
      }
    }

    const day = await this.getDailyTotal()
    if (day >= this.limits.perDayUsd) {
      return {
        ok: false,
        reason: `daily budget exceeded: $${day.toFixed(2)} >= $${this.limits.perDayUsd}`,
        limit: this.limits.perDayUsd,
        current: day,
        layer: 'day',
      }
    }

    if (opts.projectId) {
      const proj = await this.getProjectTotal(opts.projectId)
      if (proj >= this.limits.perProjectUsd) {
        return {
          ok: false,
          reason: `project budget exceeded for ${opts.projectId}: $${proj.toFixed(2)} >= $${this.limits.perProjectUsd}`,
          limit: this.limits.perProjectUsd,
          current: proj,
          layer: 'project',
        }
      }
    }

    if (opts.sessionId) {
      const sess = await this.getSessionTotal(opts.sessionId)
      if (sess >= this.limits.perSessionUsd) {
        return {
          ok: false,
          reason: `session budget exceeded for ${opts.sessionId}: $${sess.toFixed(2)} >= $${this.limits.perSessionUsd}`,
          limit: this.limits.perSessionUsd,
          current: sess,
          layer: 'session',
        }
      }
    }

    return { ok: true }
  }

  async reset(): Promise<void> {
    await this.save({ version: 1, records: [] })
  }
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfMonth(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), 1)
  return x
}
