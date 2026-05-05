/**
 * W6-A health-check — /health/custom (R29 Dev-FFF / GTC-4)
 *
 * DEC-019-068 5 trigger evidence 検査用 custom endpoint。 trigger 1-5 の evidence が
 * 全て収集されているかを判定し、canary forward の gate として利用する。
 *
 * 5 trigger:
 *   t1: latency p95 < SLA
 *   t2: error rate < 1%
 *   t3: cost burn rate < budget
 *   t4: sentry issue rate stable
 *   t5: kill switch responsive (< 5s)
 *
 * 連動: runsheets/w6a-production-rollout-sop.md §6.4 / DEC-019-068
 */
export type TriggerId = 't1' | 't2' | 't3' | 't4' | 't5'

export type TriggerEvidence = Record<TriggerId, boolean>

export type CustomHealthReport = {
  status: 'pass' | 'fail'
  satisfied: number
  total: 5
  failingTriggers: TriggerId[]
}

export function evaluateCustomHealth(
  evidence: TriggerEvidence,
): CustomHealthReport {
  const ids: TriggerId[] = ['t1', 't2', 't3', 't4', 't5']
  const failing = ids.filter((id) => !evidence[id])
  const satisfied = 5 - failing.length
  return {
    status: failing.length === 0 ? 'pass' : 'fail',
    satisfied,
    total: 5,
    failingTriggers: failing,
  }
}
