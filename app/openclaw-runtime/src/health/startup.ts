/**
 * W6-A health-check — /health/startup (R29 Dev-FFF / GTC-4)
 *
 * startup は初期化完了 (config 読込 / migration 完了 / warmup 完了) を判定する。
 * Kubernetes startup probe / Vercel cold start 完了確認に対応。
 *
 * 連動: runsheets/w6a-production-rollout-sop.md §6.3
 */
export type StartupChecks = {
  configLoaded: boolean
  migrationApplied: boolean
  warmupCompleted: boolean
}

export type StartupReport = {
  status: 'started' | 'pending' | 'failed'
  checks: StartupChecks
  pendingItems: string[]
}

export function evaluateStartup(checks: StartupChecks): StartupReport {
  const pendingItems: string[] = []
  if (!checks.configLoaded) pendingItems.push('config')
  if (!checks.migrationApplied) pendingItems.push('migration')
  if (!checks.warmupCompleted) pendingItems.push('warmup')

  if (pendingItems.length === 0) {
    return { status: 'started', checks, pendingItems }
  }
  return { status: 'pending', checks, pendingItems }
}
