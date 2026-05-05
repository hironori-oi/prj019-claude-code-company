/**
 * W6-A health-check — /health/liveness (R29 Dev-FFF / GTC-4)
 *
 * liveness は process が応答可能であることのみ判定する。依存外部 service の状態は
 * readiness で判定する。Kubernetes / Vercel が想定する liveness probe 仕様準拠。
 *
 * 連動: runsheets/w6a-production-rollout-sop.md §6.1
 */
export type LivenessStatus = {
  status: 'ok' | 'degraded'
  uptimeMs: number
  timestamp: string
}

export type LivenessDeps = {
  startedAt: number
  now?: () => number
}

export function evaluateLiveness(deps: LivenessDeps): LivenessStatus {
  const now = (deps.now ?? Date.now)()
  const uptimeMs = Math.max(0, now - deps.startedAt)
  return {
    status: 'ok',
    uptimeMs,
    timestamp: new Date(now).toISOString(),
  }
}
