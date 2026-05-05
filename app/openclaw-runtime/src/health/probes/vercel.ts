/**
 * W6-A health probe — Vercel probe (R30 Dev-HHH / GTC-7 prep)
 *
 * Vercel の status.vercel-status.com summary.json を polling し、
 * page.status (none / minor / major / critical) を DependencyStatus に mapping。
 *
 * mapping:
 *   none / partial -> up
 *   minor          -> degraded
 *   major / critical -> down
 *
 * 連動: readiness.ts §6.2 / runsheets/w6a-production-rollout-sop.md §6
 */
import type { DependencyStatus, ReadinessProbe } from '../readiness.js'

export type VercelProbeOptions = {
  statusUrl?: string
  timeoutMs?: number
  fetcher?: typeof fetch
}

type VercelStatusSummary = {
  status?: { indicator?: string }
}

export function createVercelProbe(opts: VercelProbeOptions = {}): ReadinessProbe {
  const url =
    opts.statusUrl ?? 'https://www.vercel-status.com/api/v2/status.json'
  const timeoutMs = opts.timeoutMs ?? 3000
  const fetcher = opts.fetcher ?? fetch

  return async (): Promise<DependencyStatus> => {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const res = await fetcher(url, { signal: ctrl.signal })
      if (!res.ok) return 'down'
      const data = (await res.json()) as VercelStatusSummary
      const indicator = data.status?.indicator ?? 'none'
      if (indicator === 'none' || indicator === 'partial') return 'up'
      if (indicator === 'minor') return 'degraded'
      return 'down'
    } catch {
      return 'down'
    } finally {
      clearTimeout(t)
    }
  }
}
