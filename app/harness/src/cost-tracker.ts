/**
 * cost-tracker — 4 層ハードキャップ コスト追跡器。
 *
 * 関連必須コントロール:
 *   G-01 (コスト上限ハードキャップ) / G-V2-09 (Boris Cherny 線 $1,000 自主上限)
 *
 * 4 層キャップ:
 *   - per session   : $5
 *   - per project   : $50
 *   - per day       : $30
 *   - per month     : $300 (Phase 1 月次予算)
 *   - 加えて Boris Cherny 線 $1,000/月 を超えそうな兆候は usage-monitor で kill-switch トリガー
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
