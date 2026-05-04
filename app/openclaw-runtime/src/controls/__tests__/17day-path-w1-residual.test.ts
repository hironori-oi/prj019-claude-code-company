/**
 * 17 day path W1 残 4 control — Round 17 第 2 波 Dev-W 担当
 * P-UI-02 / P-UI-05 / HITL-10 / P-UI-09 の W1 完成版テスト集約。
 *
 * 注: 競合回避のため `17day-path-7ctrl.test.ts` (Dev-T 拡張) とは別ファイル。
 * Spec: ../../specs/17day-path-7ctrl.md
 */
import { describe, it, expect } from 'vitest'

import {
  evaluateCooldown,
  COOLDOWN_DURATION_MS,
  CooldownClockSkewError,
  type CooldownOverrideChecker,
} from '../p-ui-02-cooldown-modal.js'
import {
  detectAnomaly,
  evaluateAndAct,
  type AnomalyState,
  type RollbackExecutor,
  type KillSwitchTrigger,
} from '../p-ui-05-anomaly-rollback.js'
import {
  requestPermissionApproval,
  APPROVAL_SLA_MS,
  NOTIFY_RETRY_LIMIT,
  type OwnerNotifier,
  type PermissionApprover,
  type CeoFallbackNotifier,
} from '../hitl-10-permission-change.js'
import {
  runRlsChecklist,
  RLS_INCONCLUSIVE_ABORT_THRESHOLD,
  type RlsCase,
  type RlsExecutor,
  type ReviewSigner,
} from '../p-ui-09-rls-checklist.js'

// ---------------------------------------------------------------------------
// P-UI-02 cooldown modal — state machine + override + clock skew
// ---------------------------------------------------------------------------

describe('P-UI-02 W1 — cooldown state machine', () => {
  const ABORTED_AT = '2026-05-09T00:00:00.000Z'
  const ABORTED_AT_MS = Date.parse(ABORTED_AT)

  it('elapsed < 30s → active with positive remainingMs', () => {
    const out = evaluateCooldown(
      { triggerEvent: 'loop_abort', abortedAt: ABORTED_AT, loopId: 'L-A' },
      { now: () => ABORTED_AT_MS + 10_000 },
    )
    expect(out.cooldownState).toBe('active')
    expect(out.remainingMs).toBe(20_000)
  })

  it('elapsed >= 30s → expired with remainingMs=0', () => {
    const out = evaluateCooldown(
      { triggerEvent: 'kill_switch', abortedAt: ABORTED_AT, loopId: 'L-B' },
      { now: () => ABORTED_AT_MS + COOLDOWN_DURATION_MS },
    )
    expect(out.cooldownState).toBe('expired')
    expect(out.remainingMs).toBe(0)
  })

  it('HITL 第 12 種 override → overridden state regardless of remaining', () => {
    const override: CooldownOverrideChecker = { isOverridden: (id) => id === 'L-C' }
    const out = evaluateCooldown(
      { triggerEvent: 'manual_stop', abortedAt: ABORTED_AT, loopId: 'L-C' },
      { now: () => ABORTED_AT_MS + 5_000 },
      override,
    )
    expect(out.cooldownState).toBe('overridden')
    expect(out.remainingMs).toBe(0)
  })

  it('clock skew (now < abortedAt) → CooldownClockSkewError throws (fail-closed)', () => {
    expect(() =>
      evaluateCooldown(
        { triggerEvent: 'loop_abort', abortedAt: ABORTED_AT, loopId: 'L-D' },
        { now: () => ABORTED_AT_MS - 1 },
      ),
    ).toThrow(CooldownClockSkewError)
  })

  it('override checker not consulted after expiry (state=expired, not overridden)', () => {
    const override: CooldownOverrideChecker = { isOverridden: () => true }
    const out = evaluateCooldown(
      { triggerEvent: 'loop_abort', abortedAt: ABORTED_AT, loopId: 'L-E' },
      { now: () => ABORTED_AT_MS + COOLDOWN_DURATION_MS + 1_000 },
      override,
    )
    expect(out.cooldownState).toBe('expired')
  })
})

// ---------------------------------------------------------------------------
// P-UI-05 anomaly + rollback — consecutive 2-breach + executor + kill interlock
// ---------------------------------------------------------------------------

describe('P-UI-05 W1 — anomaly detect + rollback executor + kill interlock', () => {
  it('within threshold → no rollback', () => {
    const out = detectAnomaly(
      { metric: 'cost_per_loop', observedValue: 0.5, threshold: 1, loopId: 'L-1' },
      { consecutiveBreaches: 0, lastLoopId: null },
    )
    expect(out.anomalyDetected).toBe(false)
    expect(out.reason).toBe('within_threshold')
  })

  it('first breach (no prior) → first_breach_observation, rollback not yet', () => {
    const out = detectAnomaly(
      { metric: 'loop_duration', observedValue: 100, threshold: 50, loopId: 'L-1' },
      { consecutiveBreaches: 0, lastLoopId: null },
    )
    expect(out.anomalyDetected).toBe(true)
    expect(out.rollbackTriggered).toBe(false)
    expect(out.reason).toBe('first_breach_observation')
  })

  it('consecutive 2 different loop breaches → confirmed pending rollback', () => {
    const out = detectAnomaly(
      { metric: 'cost_per_loop', observedValue: 5, threshold: 1, loopId: 'L-2' },
      { consecutiveBreaches: 1, lastLoopId: 'L-1' },
    )
    expect(out.reason).toBe('confirmed_consecutive_breach_pending_rollback')
  })

  it('evaluateAndAct: confirmed → executor success → rollback_completed', async () => {
    const exec: RollbackExecutor = {
      rollback: async () => ({ ok: true, targetCommit: 'abc123' }),
    }
    const state: AnomalyState = { consecutiveBreaches: 1, lastLoopId: 'L-1' }
    const out = await evaluateAndAct(
      { metric: 'output_anomaly', observedValue: 9, threshold: 1, loopId: 'L-2' },
      state,
      exec,
    )
    expect(out.rollbackTriggered).toBe(true)
    expect(out.rollbackToCommit).toBe('abc123')
    expect(out.reason).toBe('rollback_completed')
  })

  it('evaluateAndAct: rollback fails → kill switch fires + reason carries rollback_failed', async () => {
    const exec: RollbackExecutor = {
      rollback: async () => ({ ok: false, reason: 'git_lock' }),
    }
    let killFired: string | null = null
    const kill: KillSwitchTrigger = {
      fire: async (r) => {
        killFired = r
      },
    }
    const out = await evaluateAndAct(
      { metric: 'cost_per_loop', observedValue: 9, threshold: 1, loopId: 'L-2' },
      { consecutiveBreaches: 1, lastLoopId: 'L-1' },
      exec,
      kill,
    )
    expect(out.rollbackTriggered).toBe(false)
    expect(out.reason).toBe('rollback_failed_kill_switch_armed:git_lock')
    expect(killFired).toBe('rollback_failed:git_lock')
  })
})

// ---------------------------------------------------------------------------
// HITL-10 permission change — retry × 3 + CEO fallback + 24h SLA
// ---------------------------------------------------------------------------

describe('HITL-10 W1 — Owner approval + retry + CEO fallback + SLA', () => {
  const INPUT = {
    changeType: 'env' as const,
    before: 'A',
    after: 'B',
    requesterRole: 'dev',
    rationale: 'env extension for build',
  }

  it('first notify success → attempts=1, fallbackTo=owner', async () => {
    const notifier: OwnerNotifier = { notify: async () => ({ delivered: true }) }
    const out = await requestPermissionApproval(INPUT, notifier, () => 1_700_000_000_000)
    expect(out.approvalState).toBe('pending')
    expect(out.notifyAttempts).toBe(1)
    expect(out.fallbackTo).toBe('owner')
  })

  it('all 3 retries fail → CEO fallback notified, attempts=NOTIFY_RETRY_LIMIT', async () => {
    let calls = 0
    const notifier: OwnerNotifier = {
      notify: async () => {
        calls += 1
        return { delivered: false }
      },
    }
    let ceoCalled = false
    const ceo: CeoFallbackNotifier = {
      notify: async () => {
        ceoCalled = true
        return { delivered: true }
      },
    }
    const out = await requestPermissionApproval(
      INPUT,
      notifier,
      () => 1_700_000_000_000,
      undefined,
      ceo,
    )
    expect(calls).toBe(NOTIFY_RETRY_LIMIT)
    expect(out.notifyAttempts).toBe(NOTIFY_RETRY_LIMIT)
    expect(out.fallbackTo).toBe('ceo')
    expect(ceoCalled).toBe(true)
  })

  it('approver returns approved → approvalState=approved + approvedAt set', async () => {
    const notifier: OwnerNotifier = { notify: async () => ({ delivered: true }) }
    const approver: PermissionApprover = {
      decide: async (_t, _e, n) => ({ state: 'approved', approvedAt: n() + 100 }),
    }
    const out = await requestPermissionApproval(
      INPUT,
      notifier,
      () => 1_700_000_000_000,
      approver,
    )
    expect(out.approvalState).toBe('approved')
    expect(out.approvedAt).toBeDefined()
  })

  it('approver returns rejected → approvalState=rejected, no approvedAt', async () => {
    const notifier: OwnerNotifier = { notify: async () => ({ delivered: true }) }
    const approver: PermissionApprover = { decide: async () => ({ state: 'rejected' }) }
    const out = await requestPermissionApproval(
      INPUT,
      notifier,
      () => 1_700_000_000_000,
      approver,
    )
    expect(out.approvalState).toBe('rejected')
    expect(out.approvedAt).toBeUndefined()
  })

  it('approver still pending after SLA → approvalState=timeout', async () => {
    const notifier: OwnerNotifier = { notify: async () => ({ delivered: true }) }
    let calls = 0
    const nowFn = () => {
      calls += 1
      // 1: ts (request issuance), 2: nowAfter (post-decide check)
      return calls === 1 ? 1_700_000_000_000 : 1_700_000_000_000 + APPROVAL_SLA_MS + 1
    }
    const approver: PermissionApprover = { decide: async () => ({ state: 'pending' }) }
    const out = await requestPermissionApproval(INPUT, notifier, nowFn, approver)
    expect(out.approvalState).toBe('timeout')
  })

  it('expiresAt = now + APPROVAL_SLA_MS as ISO datetime', async () => {
    const notifier: OwnerNotifier = { notify: async () => ({ delivered: true }) }
    const ts = 1_700_000_000_000
    const out = await requestPermissionApproval(INPUT, notifier, () => ts)
    expect(out.expiresAt).toBe(new Date(ts + APPROVAL_SLA_MS).toISOString())
  })
})

// ---------------------------------------------------------------------------
// P-UI-09 RLS checklist — matrix run + inconclusive abort + Review sign hook
// ---------------------------------------------------------------------------

describe('P-UI-09 W1 — RLS matrix + abort + review sign', () => {
  const matrixOf = (n: number): RlsCase[] =>
    Array.from({ length: n }, (_, i) => ({
      role: `role-${i % 3}`,
      operation: (['select', 'insert', 'update', 'delete'] as const)[i % 4],
      tenant: `t-${i % 5}`,
      expected: i % 2 === 0 ? ('allow' as const) : ('deny' as const),
    }))

  it('all expectations match → passed=N, failed=0, signer invoked', async () => {
    const matrix = matrixOf(10)
    const exec: RlsExecutor = {
      execute: async (c) => ({ outcome: c.expected }),
    }
    let signed = false
    const signer: ReviewSigner = {
      sign: async () => {
        signed = true
        return { signed: true }
      },
    }
    const out = await runRlsChecklist({ matrix }, exec, signer)
    expect(out.totalCases).toBe(10)
    expect(out.passed).toBe(10)
    expect(out.failed).toBe(0)
    expect(out.failures).toEqual([])
    expect(out.aborted).toBe(false)
    expect(out.reviewSigned).toBe(true)
    expect(signed).toBe(true)
  })

  it('1 mismatched case → failures captures actual vs expected, signer NOT invoked', async () => {
    const matrix: RlsCase[] = [
      { role: 'admin', operation: 'select', tenant: 't1', expected: 'allow' },
      { role: 'guest', operation: 'delete', tenant: 't1', expected: 'deny' },
    ]
    const exec: RlsExecutor = {
      execute: async (c) =>
        c.role === 'guest' ? { outcome: 'allow' } : { outcome: c.expected },
    }
    let signCalled = false
    const signer: ReviewSigner = {
      sign: async () => {
        signCalled = true
        return { signed: true }
      },
    }
    const out = await runRlsChecklist({ matrix }, exec, signer)
    expect(out.passed).toBe(1)
    expect(out.failed).toBe(1)
    expect(out.failures).toHaveLength(1)
    expect(out.failures[0]).toMatchObject({
      role: 'guest',
      operation: 'delete',
      actual: 'allow',
      expected: 'deny',
    })
    expect(out.reviewSigned).toBe(false)
    expect(signCalled).toBe(false)
  })

  it('inconclusive count >= threshold → aborted=true, remaining cases skipped', async () => {
    const matrix = matrixOf(20)
    let executed = 0
    const exec: RlsExecutor = {
      execute: async () => {
        executed += 1
        return { outcome: 'inconclusive' }
      },
    }
    const out = await runRlsChecklist({ matrix }, exec)
    expect(out.aborted).toBe(true)
    expect(out.inconclusiveCount).toBe(RLS_INCONCLUSIVE_ABORT_THRESHOLD)
    expect(executed).toBe(RLS_INCONCLUSIVE_ABORT_THRESHOLD) // 5 件目で abort
    expect(out.reviewSigned).toBe(false)
  })

  it('inconclusive < threshold → not aborted, signer skipped (still has inconclusive)', async () => {
    const matrix: RlsCase[] = [
      { role: 'admin', operation: 'select', tenant: 't1', expected: 'allow' },
      { role: 'admin', operation: 'select', tenant: 't2', expected: 'allow' },
      { role: 'admin', operation: 'select', tenant: 't3', expected: 'allow' },
    ]
    let i = 0
    const exec: RlsExecutor = {
      execute: async () => {
        i += 1
        return i === 2 ? { outcome: 'inconclusive' } : { outcome: 'allow' }
      },
    }
    const out = await runRlsChecklist({ matrix }, exec)
    expect(out.aborted).toBe(false)
    expect(out.inconclusiveCount).toBe(1)
    expect(out.passed).toBe(2)
    expect(out.reviewSigned).toBe(false) // inconclusive あれば sign しない
  })

  it('105 case full matrix all pass → reviewSigned=true', async () => {
    const matrix = matrixOf(105)
    const exec: RlsExecutor = {
      execute: async (c) => ({ outcome: c.expected }),
    }
    const signer: ReviewSigner = { sign: async () => ({ signed: true }) }
    const out = await runRlsChecklist({ matrix }, exec, signer)
    expect(out.totalCases).toBe(105)
    expect(out.passed).toBe(105)
    expect(out.failed).toBe(0)
    expect(out.reviewSigned).toBe(true)
  })
})
