/**
 * 17 day path W2 cross-control invariants — Round 18 Dev-Y 担当 (4 ctrl)
 * p-ui-04 / p-ui-05 / p-ui-09 / hitl-10 の 統合 / cross-control invariants。
 *
 * Cross-control invariants:
 *   I1. p-ui-04 kill-switch fired  →  p-ui-05 rollback NOT triggered (kill is terminal)
 *   I2. hitl-10 permission denied  →  p-ui-09 RLS checklist must include audit trail entry
 *   I3. p-ui-05 rollback completed →  p-ui-09 RLS verify post-rollback state
 *
 * 注: Dev-X 領域 (c-oc-03 / c-oc-04 / p-ui-02) には触れない。
 * Spec: ../../specs/17day-path-7ctrl.md
 */
import { describe, it, expect } from 'vitest'

import {
  propagateKill,
  createKillTerminalSink,
  type KillInput,
  type ProcessKiller,
} from '../p-ui-04-kill-switch-propagation.js'
import {
  evaluateAndAct,
  type AnomalyState,
  type RollbackExecutor,
  type KillSwitchTrigger,
  type PostRollbackNotifier,
} from '../p-ui-05-anomaly-rollback.js'
import {
  runRlsChecklist,
  createRlsAuditTrail,
  type RlsCase,
  type RlsExecutor,
  type RlsAuditEntry,
} from '../p-ui-09-rls-checklist.js'
import {
  requestPermissionApproval,
  type OwnerNotifier,
  type PermissionApprover,
  type PermissionAuditSink,
} from '../hitl-10-permission-change.js'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const NOOP_KILL_SWITCH: KillSwitchTrigger = { fire: async () => {} }
const ALWAYS_OK_KILLER: ProcessKiller = { signal: async () => true }

const KILL_INPUT: KillInput = {
  killReason: 'manual_panic',
  initiatedAt: '2026-05-20T00:00:00.000Z',
  pidTree: [101, 102, 103],
}

const PERMISSION_INPUT = {
  changeType: 'env' as const,
  before: 'A',
  after: 'B',
  requesterRole: 'dev',
  rationale: 'env extension for build',
}

const matrix3: RlsCase[] = [
  { role: 'admin', operation: 'select', tenant: 't1', expected: 'allow' },
  { role: 'guest', operation: 'delete', tenant: 't1', expected: 'deny' },
  { role: 'admin', operation: 'update', tenant: 't2', expected: 'allow' },
]
const allowAllExec: RlsExecutor = {
  execute: async (c) => ({ outcome: c.expected }),
}

// ---------------------------------------------------------------------------
// Invariant I1: kill terminal latch → p-ui-05 rollback NOT triggered
// ---------------------------------------------------------------------------

describe('W2 invariant I1 — kill terminal blocks p-ui-05 rollback', () => {
  it('p-ui-04 fired → terminal sink isActive=true', async () => {
    const sink = createKillTerminalSink()
    const out = await propagateKill(KILL_INPUT, ALWAYS_OK_KILLER, {
      killTerminalSink: sink,
      sleep: async () => {},
    })
    expect(out.status).toBe('all_terminated')
    expect(sink.isActive()).toBe(true)
    expect(sink.lastReason()).toBe('manual_panic')
  })

  it('killTerminalSink isActive → evaluateAndAct skips rollback (kill terminal)', async () => {
    const sink = createKillTerminalSink()
    sink.markFired('panic_test')
    let executorCalled = false
    const exec: RollbackExecutor = {
      rollback: async () => {
        executorCalled = true
        return { ok: true, targetCommit: 'abc' }
      },
    }
    const out = await evaluateAndAct(
      { metric: 'cost_per_loop', observedValue: 9, threshold: 1, loopId: 'L-2' },
      { consecutiveBreaches: 1, lastLoopId: 'L-1' },
      exec,
      NOOP_KILL_SWITCH,
      { killQuery: sink },
    )
    expect(executorCalled).toBe(false)
    expect(out.rollbackTriggered).toBe(false)
    expect(out.reason).toBe('rollback_skipped_kill_terminal:panic_test')
  })

  it('end-to-end: propagateKill fires latch → subsequent evaluateAndAct skipped', async () => {
    const sink = createKillTerminalSink()
    await propagateKill(KILL_INPUT, ALWAYS_OK_KILLER, {
      killTerminalSink: sink,
      sleep: async () => {},
    })
    const exec: RollbackExecutor = {
      rollback: async () => ({ ok: true, targetCommit: 'xyz' }),
    }
    const out = await evaluateAndAct(
      { metric: 'output_anomaly', observedValue: 9, threshold: 1, loopId: 'L-2' },
      { consecutiveBreaches: 1, lastLoopId: 'L-1' },
      exec,
      NOOP_KILL_SWITCH,
      { killQuery: sink },
    )
    expect(out.rollbackTriggered).toBe(false)
    expect(out.reason).toMatch(/^rollback_skipped_kill_terminal:/)
  })

  it('without killQuery wired → W1 behavior preserved (rollback proceeds)', async () => {
    let executorCalled = false
    const exec: RollbackExecutor = {
      rollback: async () => {
        executorCalled = true
        return { ok: true, targetCommit: 'abc' }
      },
    }
    const out = await evaluateAndAct(
      { metric: 'cost_per_loop', observedValue: 9, threshold: 1, loopId: 'L-2' },
      { consecutiveBreaches: 1, lastLoopId: 'L-1' },
      exec,
      NOOP_KILL_SWITCH,
      // no opts → W1 path
    )
    expect(executorCalled).toBe(true)
    expect(out.rollbackTriggered).toBe(true)
  })

  it('kill latch is monotonic: markVerified after markFired keeps active=true', () => {
    const sink = createKillTerminalSink()
    sink.markFired('first')
    sink.markVerified('second')
    expect(sink.isActive()).toBe(true)
    expect(sink.lastReason()).toBe('second')
  })
})

// ---------------------------------------------------------------------------
// Invariant I2: hitl-10 denied → p-ui-09 audit trail must include entry
// ---------------------------------------------------------------------------

describe('W2 invariant I2 — hitl-10 denial → p-ui-09 audit trail entry', () => {
  it('rejected decision flushes audit entry with state=rejected', async () => {
    const audit = createRlsAuditTrail()
    const sink: PermissionAuditSink = {
      recordDecision: (p) => {
        audit.record({
          source: 'hitl-10',
          kind: p.state === 'approved' ? 'permission_approved' : 'permission_denied',
          ticketId: p.ticketId,
          detail: p.detail,
          recordedAt: p.recordedAt,
        } satisfies RlsAuditEntry)
      },
    }
    const notifier: OwnerNotifier = { notify: async () => ({ delivered: true }) }
    const approver: PermissionApprover = { decide: async () => ({ state: 'rejected' }) }
    const out = await requestPermissionApproval(
      PERMISSION_INPUT,
      notifier,
      () => 1_700_000_000_000,
      approver,
      undefined,
      { auditSink: sink },
    )
    expect(out.approvalState).toBe('rejected')
    expect(audit.count()).toBe(1)
    expect(audit.list()[0].kind).toBe('permission_denied')
    expect(audit.list()[0].source).toBe('hitl-10')
    expect(audit.list()[0].ticketId).toBe(out.ticketId)
  })

  it('timeout flushes audit entry as permission_denied', async () => {
    const audit = createRlsAuditTrail()
    const sink: PermissionAuditSink = {
      recordDecision: (p) => {
        audit.record({
          source: 'hitl-10',
          kind: p.state === 'approved' ? 'permission_approved' : 'permission_denied',
          ticketId: p.ticketId,
          detail: p.detail,
          recordedAt: p.recordedAt,
        })
      },
    }
    const notifier: OwnerNotifier = { notify: async () => ({ delivered: true }) }
    let calls = 0
    const nowFn = () => {
      calls += 1
      return calls === 1 ? 1_700_000_000_000 : 1_700_000_000_000 + 24 * 60 * 60 * 1000 + 1
    }
    const approver: PermissionApprover = { decide: async () => ({ state: 'pending' }) }
    const out = await requestPermissionApproval(
      PERMISSION_INPUT,
      notifier,
      nowFn,
      approver,
      undefined,
      { auditSink: sink },
    )
    expect(out.approvalState).toBe('timeout')
    expect(audit.count()).toBe(1)
    expect(audit.list()[0].kind).toBe('permission_denied')
  })

  it('approved → audit entry kind=permission_approved (not denied)', async () => {
    const audit = createRlsAuditTrail()
    const sink: PermissionAuditSink = {
      recordDecision: (p) => {
        audit.record({
          source: 'hitl-10',
          kind: p.state === 'approved' ? 'permission_approved' : 'permission_denied',
          ticketId: p.ticketId,
          recordedAt: p.recordedAt,
        })
      },
    }
    const notifier: OwnerNotifier = { notify: async () => ({ delivered: true }) }
    const approver: PermissionApprover = {
      decide: async (_t, _e, n) => ({ state: 'approved', approvedAt: n() + 100 }),
    }
    const out = await requestPermissionApproval(
      PERMISSION_INPUT,
      notifier,
      () => 1_700_000_000_000,
      approver,
      undefined,
      { auditSink: sink },
    )
    expect(out.approvalState).toBe('approved')
    expect(audit.count()).toBe(1)
    expect(audit.list()[0].kind).toBe('permission_approved')
  })

  it('p-ui-09 runRlsChecklist surfaces audit count when audit present', async () => {
    const audit = createRlsAuditTrail()
    audit.record({
      source: 'hitl-10',
      kind: 'permission_denied',
      ticketId: 'HITL10-X',
      recordedAt: '2026-05-20T00:00:00.000Z',
    })
    const out = await runRlsChecklist({ matrix: matrix3 }, allowAllExec, undefined, {
      auditTrail: audit,
    })
    expect(out.auditTrailCount).toBe(1)
    expect(out.failed).toBe(0)
  })

  it('end-to-end: hitl-10 denied → audit propagates to p-ui-09 verify run', async () => {
    const audit = createRlsAuditTrail()
    const sink: PermissionAuditSink = {
      recordDecision: (p) => {
        audit.record({
          source: 'hitl-10',
          kind: p.state === 'approved' ? 'permission_approved' : 'permission_denied',
          ticketId: p.ticketId,
          recordedAt: p.recordedAt,
        })
      },
    }
    const notifier: OwnerNotifier = { notify: async () => ({ delivered: true }) }
    const approver: PermissionApprover = { decide: async () => ({ state: 'rejected' }) }
    await requestPermissionApproval(
      PERMISSION_INPUT,
      notifier,
      () => 1_700_000_000_000,
      approver,
      undefined,
      { auditSink: sink },
    )
    const rlsOut = await runRlsChecklist({ matrix: matrix3 }, allowAllExec, undefined, {
      auditTrail: audit,
    })
    expect(rlsOut.auditTrailCount).toBe(1)
    const denialEntries = audit.list().filter((e) => e.kind === 'permission_denied')
    expect(denialEntries).toHaveLength(1)
  })

  it('without auditSink wired → W1 behavior preserved (no audit recorded)', async () => {
    const audit = createRlsAuditTrail()
    const notifier: OwnerNotifier = { notify: async () => ({ delivered: true }) }
    const approver: PermissionApprover = { decide: async () => ({ state: 'rejected' }) }
    const out = await requestPermissionApproval(
      PERMISSION_INPUT,
      notifier,
      () => 1_700_000_000_000,
      approver,
      // no opts → W1
    )
    expect(out.approvalState).toBe('rejected')
    expect(audit.count()).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Invariant I3: p-ui-05 rollback completed → p-ui-09 verify post-rollback state
// ---------------------------------------------------------------------------

describe('W2 invariant I3 — rollback completed → post-rollback RLS verify', () => {
  it('rollback success fires PostRollbackNotifier with loopId + targetCommit', async () => {
    const notifs: Array<{ loopId: string; targetCommit?: string }> = []
    const post: PostRollbackNotifier = {
      onRollbackCompleted: (p) => {
        notifs.push(p)
      },
    }
    const exec: RollbackExecutor = {
      rollback: async () => ({ ok: true, targetCommit: 'rev-9999' }),
    }
    const out = await evaluateAndAct(
      { metric: 'cost_per_loop', observedValue: 5, threshold: 1, loopId: 'L-2' },
      { consecutiveBreaches: 1, lastLoopId: 'L-1' },
      exec,
      NOOP_KILL_SWITCH,
      { postRollback: post },
    )
    expect(out.rollbackTriggered).toBe(true)
    expect(notifs).toHaveLength(1)
    expect(notifs[0]).toMatchObject({ loopId: 'L-2', targetCommit: 'rev-9999' })
  })

  it('rollback failure does NOT fire PostRollbackNotifier', async () => {
    const notifs: unknown[] = []
    const post: PostRollbackNotifier = {
      onRollbackCompleted: () => {
        notifs.push(1)
      },
    }
    const exec: RollbackExecutor = {
      rollback: async () => ({ ok: false, reason: 'git_lock' }),
    }
    const out = await evaluateAndAct(
      { metric: 'cost_per_loop', observedValue: 5, threshold: 1, loopId: 'L-2' },
      { consecutiveBreaches: 1, lastLoopId: 'L-1' },
      exec,
      NOOP_KILL_SWITCH,
      { postRollback: post },
    )
    expect(out.rollbackTriggered).toBe(false)
    expect(notifs).toHaveLength(0)
  })

  it('p-ui-09 receives postRollback=true context flag in output', async () => {
    const audit = createRlsAuditTrail()
    audit.record({
      source: 'p-ui-05',
      kind: 'rollback_completed',
      detail: 'targetCommit=rev-9999',
      recordedAt: '2026-05-20T00:01:00.000Z',
    })
    const out = await runRlsChecklist({ matrix: matrix3 }, allowAllExec, undefined, {
      auditTrail: audit,
      postRollback: true,
    })
    expect(out.postRollback).toBe(true)
    expect(out.auditTrailCount).toBe(1)
    expect(out.failed).toBe(0)
  })

  it('end-to-end: rollback notifier triggers RLS audit + post-rollback verify', async () => {
    const audit = createRlsAuditTrail()
    let rlsRunResult: Awaited<ReturnType<typeof runRlsChecklist>> | null = null
    const post: PostRollbackNotifier = {
      onRollbackCompleted: async (p) => {
        audit.record({
          source: 'p-ui-05',
          kind: 'rollback_completed',
          detail: `loopId=${p.loopId};targetCommit=${p.targetCommit ?? ''}`,
          recordedAt: '2026-05-20T00:01:00.000Z',
        })
        rlsRunResult = await runRlsChecklist({ matrix: matrix3 }, allowAllExec, undefined, {
          auditTrail: audit,
          postRollback: true,
        })
      },
    }
    const exec: RollbackExecutor = {
      rollback: async () => ({ ok: true, targetCommit: 'rev-7777' }),
    }
    const aOut = await evaluateAndAct(
      { metric: 'output_anomaly', observedValue: 5, threshold: 1, loopId: 'L-9' },
      { consecutiveBreaches: 1, lastLoopId: 'L-8' },
      exec,
      NOOP_KILL_SWITCH,
      { postRollback: post },
    )
    expect(aOut.rollbackTriggered).toBe(true)
    expect(rlsRunResult).not.toBeNull()
    expect(rlsRunResult!.postRollback).toBe(true)
    expect(rlsRunResult!.auditTrailCount).toBe(1)
    expect(rlsRunResult!.failed).toBe(0)
  })

  it('without postRollback wired → W1 behavior preserved (no notifier fired)', async () => {
    const exec: RollbackExecutor = {
      rollback: async () => ({ ok: true, targetCommit: 'abc' }),
    }
    const out = await evaluateAndAct(
      { metric: 'cost_per_loop', observedValue: 5, threshold: 1, loopId: 'L-2' },
      { consecutiveBreaches: 1, lastLoopId: 'L-1' },
      exec,
      NOOP_KILL_SWITCH,
      // no opts → W1
    )
    expect(out.rollbackTriggered).toBe(true)
    expect(out.reason).toBe('rollback_completed')
  })
})

// ---------------------------------------------------------------------------
// Cross-invariant interaction: kill terminal trumps post-rollback notify
// ---------------------------------------------------------------------------

describe('W2 cross-invariant — kill terminal precedence over rollback notify', () => {
  it('kill latch active blocks rollback AND prevents postRollback notify', async () => {
    const sink = createKillTerminalSink()
    sink.markFired('precedence_test')
    const notifs: unknown[] = []
    const post: PostRollbackNotifier = {
      onRollbackCompleted: () => {
        notifs.push(1)
      },
    }
    const exec: RollbackExecutor = {
      rollback: async () => ({ ok: true, targetCommit: 'should_not_reach' }),
    }
    const out = await evaluateAndAct(
      { metric: 'cost_per_loop', observedValue: 9, threshold: 1, loopId: 'L-Z' },
      { consecutiveBreaches: 1, lastLoopId: 'L-Y' },
      exec,
      NOOP_KILL_SWITCH,
      { killQuery: sink, postRollback: post },
    )
    expect(out.rollbackTriggered).toBe(false)
    expect(out.reason).toMatch(/^rollback_skipped_kill_terminal:/)
    expect(notifs).toHaveLength(0)
  })
})
