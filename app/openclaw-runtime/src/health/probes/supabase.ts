/**
 * W6-A health probe — Supabase probe (R30 Dev-HHH / GTC-7 prep)
 *
 * Supabase REST endpoint (/rest/v1/) に anon key 付きで GET し、
 * 200 系 = up, 5xx = down, それ以外 = degraded。auth/REST 両系統を probe する。
 *
 * 連動: readiness.ts §6.2 / DEC-019-049 (Supabase 連携)
 */
import type { DependencyStatus, ReadinessProbe } from '../readiness.js'

export type SupabaseProbeOptions = {
  projectUrl: string
  anonKey: string
  timeoutMs?: number
  fetcher?: typeof fetch
}

export function createSupabaseProbe(opts: SupabaseProbeOptions): ReadinessProbe {
  const timeoutMs = opts.timeoutMs ?? 3000
  const fetcher = opts.fetcher ?? fetch

  return async (): Promise<DependencyStatus> => {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const res = await fetcher(`${opts.projectUrl}/rest/v1/`, {
        signal: ctrl.signal,
        headers: {
          apikey: opts.anonKey,
          Authorization: `Bearer ${opts.anonKey}`,
        },
      })
      if (res.status >= 200 && res.status < 300) return 'up'
      if (res.status >= 500) return 'down'
      // 401/404 は anon key 設定問題等 / live としては degraded 扱い
      return 'degraded'
    } catch {
      return 'down'
    } finally {
      clearTimeout(t)
    }
  }
}
