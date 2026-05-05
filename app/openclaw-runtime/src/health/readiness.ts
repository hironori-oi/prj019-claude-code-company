/**
 * W6-A health-check — /health/readiness (R29 Dev-FFF / GTC-4)
 *
 * readiness は外部依存 (Sentry / Vercel / Supabase / cost-tracker) 全てが健全であることを
 * 判定する。1 つでも DOWN なら status='not_ready' を返し、canary 進行を block する。
 *
 * 連動: runsheets/w6a-production-rollout-sop.md §6.2
 */
export type DependencyStatus = 'up' | 'degraded' | 'down'

export type ReadinessProbe = () => Promise<DependencyStatus>

export type ReadinessDeps = {
  sentry: ReadinessProbe
  vercel: ReadinessProbe
  supabase: ReadinessProbe
  costTracker: ReadinessProbe
}

export type ReadinessReport = {
  status: 'ready' | 'degraded' | 'not_ready'
  checks: {
    sentry: DependencyStatus
    vercel: DependencyStatus
    supabase: DependencyStatus
    costTracker: DependencyStatus
  }
}

export async function evaluateReadiness(
  deps: ReadinessDeps,
): Promise<ReadinessReport> {
  const [sentry, vercel, supabase, costTracker] = await Promise.all([
    deps.sentry(),
    deps.vercel(),
    deps.supabase(),
    deps.costTracker(),
  ])
  const checks = { sentry, vercel, supabase, costTracker }
  const values = Object.values(checks)
  if (values.some((v) => v === 'down')) {
    return { status: 'not_ready', checks }
  }
  if (values.some((v) => v === 'degraded')) {
    return { status: 'degraded', checks }
  }
  return { status: 'ready', checks }
}
