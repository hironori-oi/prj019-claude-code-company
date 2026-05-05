/**
 * W6-A health probe — cost-tracker probe (R30 Dev-HHH / GTC-7 prep)
 *
 * 月次予算消化率を取得し、threshold (default 95%) 未満なら up / 95-100% で degraded /
 * 100%超過で down を返す。実値 fetcher は注入し、test 化可能。
 *
 * 連動: DEC-019-081 (月次予算 alert) / readiness.ts §6.2
 */
import type { DependencyStatus, ReadinessProbe } from '../readiness.js'

export type CostTrackerProbeOptions = {
  /** 月次予算消化率 (0.0-1.0+) を返す関数 */
  fetchUsageRatio: () => Promise<number>
  /** degraded 開始 threshold (default 0.95) */
  degradedAt?: number
  /** down 開始 threshold (default 1.0) */
  downAt?: number
  timeoutMs?: number
}

export function createCostTrackerProbe(
  opts: CostTrackerProbeOptions,
): ReadinessProbe {
  const degradedAt = opts.degradedAt ?? 0.95
  const downAt = opts.downAt ?? 1.0
  const timeoutMs = opts.timeoutMs ?? 3000

  return async (): Promise<DependencyStatus> => {
    try {
      const ratio = await withTimeout(opts.fetchUsageRatio(), timeoutMs)
      if (ratio >= downAt) return 'down'
      if (ratio >= degradedAt) return 'degraded'
      return 'up'
    } catch {
      return 'down'
    }
  }
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) =>
      setTimeout(() => rej(new Error('cost-tracker timeout')), ms),
    ),
  ])
}
