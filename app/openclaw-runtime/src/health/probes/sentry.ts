/**
 * W6-A health probe — Sentry probe (R30 Dev-HHH / GTC-7 prep)
 *
 * R29 Dev-FFF が物理化した `readiness.ts` の `ReadinessProbe` 型 (() => Promise<DependencyStatus>)
 * 互換 implementation。 Sentry の health endpoint (/api/0/health/) を probe し、
 * up / degraded / down を返す。実 HTTP 呼出は fetcher 注入で test 化可能。
 *
 * 連動: DEC-019-080 (Sentry 実発火必須化) / readiness.ts §6.2
 */
import type { DependencyStatus, ReadinessProbe } from '../readiness.js'

export type SentryProbeOptions = {
  baseUrl?: string
  authToken?: string
  timeoutMs?: number
  fetcher?: typeof fetch
}

export function createSentryProbe(opts: SentryProbeOptions = {}): ReadinessProbe {
  const baseUrl = opts.baseUrl ?? 'https://sentry.io'
  const timeoutMs = opts.timeoutMs ?? 3000
  const fetcher = opts.fetcher ?? fetch

  return async (): Promise<DependencyStatus> => {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const headers: Record<string, string> = {}
      if (opts.authToken) headers.Authorization = `Bearer ${opts.authToken}`
      const res = await fetcher(`${baseUrl}/api/0/health/`, {
        signal: ctrl.signal,
        headers,
      })
      if (res.status >= 200 && res.status < 300) return 'up'
      if (res.status >= 500) return 'down'
      return 'degraded'
    } catch {
      return 'down'
    } finally {
      clearTimeout(t)
    }
  }
}
