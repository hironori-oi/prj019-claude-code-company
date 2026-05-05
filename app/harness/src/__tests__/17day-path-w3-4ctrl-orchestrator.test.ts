/**
 * 17 day path W3 harness orchestrator integration — Round 19 第 2 弾, Dev-BB 担当
 *
 * 担当 4 control: P-UI-04 / P-UI-05 / P-UI-09 / HITL-10 (Dev-Y W2 scope を継承)
 *
 * W3 = harness orchestrator 接続段階。W2 で各 control 単体に sink / port を生やしたので、
 * 本ファイルでは harness 側 (本 package) で 4 control を end-to-end に駆動する
 * 「橋渡し orchestrator」を組み立て、cross-control invariants の shape 整合を検証する:
 *
 *   KillTerminalSink           (p-ui-04 fire)  → p-ui-05 evaluateAndAct.killQuery
 *   PermissionAuditSink        (hitl-10 終局)   → RlsAuditTrail へ flush
 *   PostRollbackNotifier       (p-ui-05 完遂)   → RlsAuditTrail.record + p-ui-09 postRollback verify
 *   RlsAuditTrail              (p-ui-09 ctx)   → cross-source (hitl-10 / p-ui-05) 集約
 *
 * 不可侵 (Dev-AA 領域 / 第 1 弾): C-OC-03 / C-OC-04 / P-UI-02 (本ファイルでは触らない)
 *
 * Public API 不変: 本テストは ctrl public API を呼ぶのみ。本 package には harness orchestrator
 * helper を新規追加するが、4 control 実装ファイルは無改変。
 *
 * Spec source: ../../../openclaw-runtime/src/controls/__tests__/17day-path-w2-4ctrl.test.ts
 *              + ../17day-path-w3-orchestrator.ts (本 W3 で新規追加する orchestrator helper)
 */
import { describe, it, expect } from 'vitest'

// Round 23 Dev-MM: ARCH-01 Phase 1 dev/staging migrate (DEC-019-041 / Dev-JJ R22 案 A).
// 旧 `../../../openclaw-runtime/src/controls/...` → 新 `@clawbridge/openclaw-runtime/controls/...`.
// Phase 1 段階 = test file 1-2 個のみ alias 化 (議決不要 / regression 0 維持).
import {
  propagateKill,
  createKillTerminalSink,
  type KillInput,
  type ProcessKiller,
  type KillTerminalSink,
} from '@clawbridge/openclaw-runtime/controls/p-ui-04-kill-switch-propagation.js'
import {
  evaluateAndAct,
  type RollbackExecutor,
  type KillSwitchTrigger,
  type PostRollbackNotifier,
} from '@clawbridge/openclaw-runtime/controls/p-ui-05-anomaly-rollback.js'
import {
  runRlsChecklist,
  createRlsAuditTrail,
  type RlsCase,
  type RlsExecutor,
  type RlsAuditTrail,
} from '@clawbridge/openclaw-runtime/controls/p-ui-09-rls-checklist.js'
import {
  requestPermissionApproval,
  type OwnerNotifier,
  type PermissionApprover,
  type PermissionAuditSink,
} from '@clawbridge/openclaw-runtime/controls/hitl-10-permission-change.js'

import {
  createW3OrchestratorContext,
  buildPermissionAuditSink,
  buildPostRollbackNotifier,
  type W3OrchestratorContext,
} from '../17day-path-w3-orchestrator.js'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const NOOP_KILL_SWITCH: KillSwitchTrigger = { fire: async () => {} }
const ALWAYS_OK_KILLER: ProcessKiller = { signal: async () => true }

const KILL_INPUT: KillInput = {
  killReason: 'orchestrator_panic',
  initiatedAt: '2026-05-26T00:00:00.000Z',
  pidTree: [201, 202, 203],
}

const PERMISSION_INPUT = {
  changeType: 'env' as const,
  before: 'A',
  after: 'B',
  requesterRole: 'dev',
  rationale: 'env extension for orchestrator',
}

const matrix3: RlsCase[] = [
  { role: 'admin', operation: 'select', tenant: 't1', expected: 'allow' },
  { role: 'guest', operation: 'delete', tenant: 't1', expected: 'deny' },
  { role: 'admin', operation: 'update', tenant: 't2', expected: 'allow' },
]
const allowAllExec: RlsExecutor = {
  execute: async (c) => ({ outcome: c.expected }),
}
const fixedNow = () => 1_700_000_000_000

// ---------------------------------------------------------------------------
// Group 1: Orchestrator context construction (shape integrity)
// ---------------------------------------------------------------------------

describe('W3 group 1 — orchestrator context shape', () => {
  it('createW3OrchestratorContext returns 4 wired primitives', () => {
    const ctx = createW3OrchestratorContext()
    expect(ctx.killTerminalSink).toBeDefined()
    expect(ctx.rlsAuditTrail).toBeDefined()
    expect(ctx.permissionAuditSink).toBeDefined()
    expect(ctx.postRollbackNotifier).toBeDefined()
  })

  it('killTerminalSink starts inactive', () => {
    const ctx = createW3OrchestratorContext()
    expect(ctx.killTerminalSink.isActive()).toBe(false)
    expect(ctx.killTerminalSink.lastReason()).toBeNull()
  })

  it('rlsAuditTrail starts empty', () => {
    const ctx = createW3OrchestratorContext()
    expect(ctx.rlsAuditTrail.count()).toBe(0)
    expect(ctx.rlsAuditTrail.list()).toEqual([])
  })

  it('buildPermissionAuditSink wires hitl-10 → trail with correct kind mapping', () => {
    const trail = createRlsAuditTrail()
    const sink = buildPermissionAuditSink(trail)
    sink.recordDecision({
      ticketId: 'HITL10-T1',
      state: 'approved',
      detail: 'changeType=env',
      recordedAt: '2026-05-26T00:00:00.000Z',
    })
    sink.recordDecision({
      ticketId: 'HITL10-T2',
      state: 'rejected',
      detail: 'changeType=env',
      recordedAt: '2026-05-26T00:00:00.000Z',
    })
    sink.recordDecision({
      ticketId: 'HITL10-T3',
      state: 'timeout',
      detail: 'changeType=env',
      recordedAt: '2026-05-26T00:00:00.000Z',
    })
    const list = trail.list()
    expect(list).toHaveLength(3)
    expect(list[0].kind).toBe('permission_approved')
    expect(list[0].source).toBe('hitl-10')
    expect(list[1].kind).toBe('permission_denied')
    expect(list[2].kind).toBe('permission_denied')
  })

  it('buildPostRollbackNotifier wires p-ui-05 → trail with rollback_completed entry', async () => {
    const trail = createRlsAuditTrail()
    const notifier = buildPostRollbackNotifier(trail, () => '2026-05-26T00:00:00.000Z')
    await notifier.onRollbackCompleted({ loopId: 'L-9', targetCommit: 'rev-7' })
    expect(trail.count()).toBe(1)
    const entry = trail.list()[0]
    expect(entry.source).toBe('p-ui-05')
    expect(entry.kind).toBe('rollback_completed')
    expect(entry.detail).toContain('L-9')
    expect(entry.detail).toContain('rev-7')
  })
})

// ---------------------------------------------------------------------------
// Group 2: I1 invariant via orchestrator — kill terminal blocks rollback
// ---------------------------------------------------------------------------

describe('W3 group 2 — I1 kill terminal blocks rollback (orchestrator wiring)', () => {
  it('end-to-end: propagateKill via orchestrator latch → evaluateAndAct skips rollback', async () => {
    const ctx: W3OrchestratorContext = createW3OrchestratorContext()
    await propagateKill(KILL_INPUT, ALWAYS_OK_KILLER, {
      killTerminalSink: ctx.killTerminalSink,
      sleep: async () => {},
    })
    expect(ctx.killTerminalSink.isActive()).toBe(true)
    let executorCalled = false
    const exec: RollbackExecutor = {
      rollback: async () => {
        executorCalled = true
        return { ok: true, targetCommit: 'should_not_reach' }
      },
    }
    const out = await evaluateAndAct(
      { metric: 'cost_per_loop', observedValue: 9, threshold: 1, loopId: 'L-W3-A' },
      { consecutiveBreaches: 1, lastLoopId: 'L-W3-PREV' },
      exec,
      NOOP_KILL_SWITCH,
      {
        killQuery: ctx.killTerminalSink,
        postRollback: ctx.postRollbackNotifier,
      },
    )
    expect(executorCalled).toBe(false)
    expect(out.rollbackTriggered).toBe(false)
    expect(out.reason).toBe('rollback_skipped_kill_terminal:orchestrator_panic')
  })

  it('killTerminalSink active also prevents postRollbackNotifier firing', async () => {
    const ctx = createW3OrchestratorContext()
    ctx.killTerminalSink.markFired('preempt_rollback')
    const exec: RollbackExecutor = {
      rollback: async () => ({ ok: true, targetCommit: 'unreached' }),
    }
    await evaluateAndAct(
      { metric: 'cost_per_loop', observedValue: 9, threshold: 1, loopId: 'L-W3-B' },
      { consecutiveBreaches: 1, lastLoopId: 'L-W3-PREV' },
      exec,
      NOOP_KILL_SWITCH,
      {
        killQuery: ctx.killTerminalSink,
        postRollback: ctx.postRollbackNotifier,
      },
    )
    // postRollbackNotifier must not have written to audit trail
    const rollbackEntries = ctx.rlsAuditTrail
      .list()
      .filter((e) => e.kind === 'rollback_completed')
    expect(rollbackEntries).toHaveLength(0)
  })

  it('without orchestrator latch wired → W1 behavior preserved (rollback proceeds)', async () => {
    let executorCalled = false
    const exec: RollbackExecutor = {
      rollback: async () => {
        executorCalled = true
        return { ok: true, targetCommit: 'w1' }
      },
    }
    const out = await evaluateAndAct(
      { metric: 'cost_per_loop', observedValue: 9, threshold: 1, loopId: 'L-W3-C' },
      { consecutiveBreaches: 1, lastLoopId: 'L-W3-PREV' },
      exec,
      NOOP_KILL_SWITCH,
    )
    expect(executorCalled).toBe(true)
    expect(out.rollbackTriggered).toBe(true)
  })

  it('latch monotonicity holds across orchestrator usage', async () => {
    const ctx = createW3OrchestratorContext()
    await propagateKill(KILL_INPUT, ALWAYS_OK_KILLER, {
      killTerminalSink: ctx.killTerminalSink,
      sleep: async () => {},
    })
    expect(ctx.killTerminalSink.isActive()).toBe(true)
    // explicit subsequent markVerified must not flip active=false
    ctx.killTerminalSink.markVerified('post_check')
    expect(ctx.killTerminalSink.isActive()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Group 3: I2 invariant via orchestrator — hitl-10 denied → audit trail entry
// ---------------------------------------------------------------------------

describe('W3 group 3 — I2 hitl-10 denial flows to RLS audit trail (orchestrator wiring)', () => {
  it('end-to-end: rejected approval via orchestrator → audit kind=permission_denied', async () => {
    const ctx = createW3OrchestratorContext()
    const notifier: OwnerNotifier = { notify: async () => ({ delivered: true }) }
    const approver: PermissionApprover = { decide: async () => ({ state: 'rejected' }) }
    await requestPermissionApproval(
      PERMISSION_INPUT,
      notifier,
      fixedNow,
      approver,
      undefined,
      { auditSink: ctx.permissionAuditSink },
    )
    expect(ctx.rlsAuditTrail.count()).toBe(1)
    const entry = ctx.rlsAuditTrail.list()[0]
    expect(entry.kind).toBe('permission_denied')
    expect(entry.source).toBe('hitl-10')
  })

  it('approved approval via orchestrator → audit kind=permission_approved', async () => {
    const ctx = createW3OrchestratorContext()
    const notifier: OwnerNotifier = { notify: async () => ({ delivered: true }) }
    const approver: PermissionApprover = {
      decide: async (_t, _e, n) => ({ state: 'approved', approvedAt: n() + 100 }),
    }
    await requestPermissionApproval(
      PERMISSION_INPUT,
      notifier,
      fixedNow,
      approver,
      undefined,
      { auditSink: ctx.permissionAuditSink },
    )
    expect(ctx.rlsAuditTrail.count()).toBe(1)
    expect(ctx.rlsAuditTrail.list()[0].kind).toBe('permission_approved')
  })

  it('orchestrator audit then runRlsChecklist surfaces auditTrailCount=1', async () => {
    const ctx = createW3OrchestratorContext()
    const notifier: OwnerNotifier = { notify: async () => ({ delivered: true }) }
    const approver: PermissionApprover = { decide: async () => ({ state: 'rejected' }) }
    await requestPermissionApproval(
      PERMISSION_INPUT,
      notifier,
      fixedNow,
      approver,
      undefined,
      { auditSink: ctx.permissionAuditSink },
    )
    const out = await runRlsChecklist({ matrix: matrix3 }, allowAllExec, undefined, {
      auditTrail: ctx.rlsAuditTrail,
    })
    expect(out.auditTrailCount).toBe(1)
    expect(out.failed).toBe(0)
  })

  it('multiple hitl-10 denials accumulate in shared trail', async () => {
    const ctx = createW3OrchestratorContext()
    const notifier: OwnerNotifier = { notify: async () => ({ delivered: true }) }
    const reject: PermissionApprover = { decide: async () => ({ state: 'rejected' }) }
    let nowCounter = 1_700_000_000_000
    const advancingNow = () => {
      nowCounter += 1
      return nowCounter
    }
    await requestPermissionApproval(
      PERMISSION_INPUT,
      notifier,
      advancingNow,
      reject,
      undefined,
      { auditSink: ctx.permissionAuditSink },
    )
    await requestPermissionApproval(
      PERMISSION_INPUT,
      notifier,
      advancingNow,
      reject,
      undefined,
      { auditSink: ctx.permissionAuditSink },
    )
    expect(ctx.rlsAuditTrail.count()).toBe(2)
    const denied = ctx.rlsAuditTrail
      .list()
      .filter((e) => e.kind === 'permission_denied')
    expect(denied).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Group 4: I3 invariant via orchestrator — rollback completed → post-rollback verify
// ---------------------------------------------------------------------------

describe('W3 group 4 — I3 rollback success → post-rollback RLS verify (orchestrator wiring)', () => {
  it('end-to-end: rollback success via orchestrator notifier → audit + verify postRollback=true', async () => {
    const ctx = createW3OrchestratorContext()
    const exec: RollbackExecutor = {
      rollback: async () => ({ ok: true, targetCommit: 'rev-orch-1' }),
    }
    const aOut = await evaluateAndAct(
      { metric: 'output_anomaly', observedValue: 5, threshold: 1, loopId: 'L-W3-R1' },
      { consecutiveBreaches: 1, lastLoopId: 'L-W3-PREV' },
      exec,
      NOOP_KILL_SWITCH,
      { postRollback: ctx.postRollbackNotifier },
    )
    expect(aOut.rollbackTriggered).toBe(true)
    expect(ctx.rlsAuditTrail.count()).toBe(1)
    const rls = await runRlsChecklist({ matrix: matrix3 }, allowAllExec, undefined, {
      auditTrail: ctx.rlsAuditTrail,
      postRollback: true,
    })
    expect(rls.postRollback).toBe(true)
    expect(rls.auditTrailCount).toBe(1)
    expect(rls.failed).toBe(0)
  })

  it('rollback failure does NOT add audit entry via orchestrator notifier', async () => {
    const ctx = createW3OrchestratorContext()
    const exec: RollbackExecutor = {
      rollback: async () => ({ ok: false, reason: 'git_lock_orchestrator' }),
    }
    const out = await evaluateAndAct(
      { metric: 'cost_per_loop', observedValue: 5, threshold: 1, loopId: 'L-W3-R2' },
      { consecutiveBreaches: 1, lastLoopId: 'L-W3-PREV' },
      exec,
      NOOP_KILL_SWITCH,
      { postRollback: ctx.postRollbackNotifier },
    )
    expect(out.rollbackTriggered).toBe(false)
    expect(ctx.rlsAuditTrail.count()).toBe(0)
  })

  it('orchestrator audit entry detail includes loopId + targetCommit', async () => {
    const ctx = createW3OrchestratorContext()
    const exec: RollbackExecutor = {
      rollback: async () => ({ ok: true, targetCommit: 'rev-detail' }),
    }
    await evaluateAndAct(
      { metric: 'output_anomaly', observedValue: 5, threshold: 1, loopId: 'L-W3-DETAIL' },
      { consecutiveBreaches: 1, lastLoopId: 'L-W3-PREV' },
      exec,
      NOOP_KILL_SWITCH,
      { postRollback: ctx.postRollbackNotifier },
    )
    const entry = ctx.rlsAuditTrail.list()[0]
    expect(entry.detail).toContain('L-W3-DETAIL')
    expect(entry.detail).toContain('rev-detail')
  })
})

// ---------------------------------------------------------------------------
// Group 5: 4-control end-to-end orchestration (full chain)
// ---------------------------------------------------------------------------

describe('W3 group 5 — full 4-control end-to-end orchestration', () => {
  it('hitl-10 reject + p-ui-05 rollback + p-ui-09 verify all share the same audit trail', async () => {
    const ctx = createW3OrchestratorContext()
    // (1) hitl-10 reject
    const ownerNotifier: OwnerNotifier = { notify: async () => ({ delivered: true }) }
    const reject: PermissionApprover = { decide: async () => ({ state: 'rejected' }) }
    await requestPermissionApproval(
      PERMISSION_INPUT,
      ownerNotifier,
      fixedNow,
      reject,
      undefined,
      { auditSink: ctx.permissionAuditSink },
    )
    // (2) p-ui-05 rollback success
    const exec: RollbackExecutor = {
      rollback: async () => ({ ok: true, targetCommit: 'rev-final' }),
    }
    await evaluateAndAct(
      { metric: 'output_anomaly', observedValue: 5, threshold: 1, loopId: 'L-FINAL' },
      { consecutiveBreaches: 1, lastLoopId: 'L-PREV' },
      exec,
      NOOP_KILL_SWITCH,
      { postRollback: ctx.postRollbackNotifier },
    )
    // (3) p-ui-09 verify post-rollback
    const out = await runRlsChecklist({ matrix: matrix3 }, allowAllExec, undefined, {
      auditTrail: ctx.rlsAuditTrail,
      postRollback: true,
    })
    expect(out.auditTrailCount).toBe(2)
    expect(out.postRollback).toBe(true)
    const entries = ctx.rlsAuditTrail.list()
    expect(entries.some((e) => e.kind === 'permission_denied')).toBe(true)
    expect(entries.some((e) => e.kind === 'rollback_completed')).toBe(true)
  })

  it('kill fired before rollback ⇒ no rollback entry, but later hitl-10 still records', async () => {
    const ctx = createW3OrchestratorContext()
    // (a) fire kill
    await propagateKill(KILL_INPUT, ALWAYS_OK_KILLER, {
      killTerminalSink: ctx.killTerminalSink,
      sleep: async () => {},
    })
    // (b) anomaly check is suppressed by kill latch
    const exec: RollbackExecutor = {
      rollback: async () => ({ ok: true, targetCommit: 'should_not_run' }),
    }
    const aOut = await evaluateAndAct(
      { metric: 'cost_per_loop', observedValue: 9, threshold: 1, loopId: 'L-K' },
      { consecutiveBreaches: 1, lastLoopId: 'L-PREV' },
      exec,
      NOOP_KILL_SWITCH,
      {
        killQuery: ctx.killTerminalSink,
        postRollback: ctx.postRollbackNotifier,
      },
    )
    expect(aOut.rollbackTriggered).toBe(false)
    // (c) hitl-10 denial still records cleanly
    const ownerNotifier: OwnerNotifier = { notify: async () => ({ delivered: true }) }
    const reject: PermissionApprover = { decide: async () => ({ state: 'rejected' }) }
    await requestPermissionApproval(
      PERMISSION_INPUT,
      ownerNotifier,
      fixedNow,
      reject,
      undefined,
      { auditSink: ctx.permissionAuditSink },
    )
    const entries = ctx.rlsAuditTrail.list()
    expect(entries).toHaveLength(1)
    expect(entries[0].kind).toBe('permission_denied')
    // no rollback_completed entries since kill latch blocked rollback
    expect(entries.some((e) => e.kind === 'rollback_completed')).toBe(false)
  })

  it('orchestrator preserves Public API: ctrl impl files unchanged (port-only injection)', async () => {
    // shape regression smoke: 4 ctrl public symbols still callable with W2-shape opts
    const sink: KillTerminalSink = createKillTerminalSink()
    expect(sink.isActive()).toBe(false)
    const trail: RlsAuditTrail = createRlsAuditTrail()
    expect(trail.count()).toBe(0)
    const permSink: PermissionAuditSink = buildPermissionAuditSink(trail)
    permSink.recordDecision({
      ticketId: 'API-CHECK',
      state: 'approved',
      recordedAt: '2026-05-26T00:00:00.000Z',
    })
    const post: PostRollbackNotifier = buildPostRollbackNotifier(trail)
    await post.onRollbackCompleted({ loopId: 'L-API', targetCommit: 'rev-api' })
    expect(trail.count()).toBe(2)
  })
})
