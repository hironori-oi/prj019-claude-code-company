/**
 * 17 day path W3 — rollback + permission orchestrator (Round 20 第 2 波, Dev-EE 担当)
 *
 * 担当 2 control: P-UI-05 (rollback executor) + HITL-10 (permission auditor)
 *
 * 不可侵 (Dev-AA / Dev-BB / Dev-DD 領域):
 *   - C-OC-03 / C-OC-04 / P-UI-02 / P-UI-04 / P-UI-09 (本 file では port-only injection 経由でも触らない)
 *   - 既存 17day-path-w3-3ctrl-orchestrator.test.ts / 17day-path-w3-4ctrl-orchestrator.test.ts に変更を加えない
 *
 * 設計原則:
 *   - control-agnostic: orchestrator は ctrl 関数を port として受け取り、test では mock 注入で
 *     control 単独挙動を W2 invariants の sub-set として再現する (本体 file には絶対に手を入れない)。
 *   - clock 注入: 24h SLA wall-clock を実時間検証可能化 (Owner formal「丁寧に」directive)。
 *   - in-memory breach counter は invocation ごとに fresh で isolation を保つ。
 *
 * W3 invariants (本 file の 13 tests / 4 groups):
 *
 * Group 1 (BreachCounter pure logic, 3 tests):
 *   B-1  最初の breach → consecutive=1
 *   B-2  異なる loopId 連続 → consecutive=2 で trip 可能ライン
 *   B-3  同一 loopId 重複 → max(count, 1) clamp / reset で 0 に戻る
 *
 * Group 2 (Rollback orchestrator, 5 tests):
 *   R-1  within_threshold → counter 不変 / executor 0 回
 *   R-2  metric_nan_skip → counter 不変 / executor 0 回
 *   R-3  first_breach → executor 0 回 / counter=1
 *   R-4  2nd breach + kill latch active → rollback_skipped_kill_terminal / executor 0 回 / postRollback 0 回
 *   R-5  2nd breach + ok rollback → postRollback 1 回 / counter reset
 *   R-6  2nd breach + failed rollback → killSwitch.fire 1 回 / counter は reset しない
 *
 * Group 3 (Permission orchestrator, 4 tests):
 *   P-1  approved → audit recordDecision({state:'approved'}) 1 回 / kind=approved
 *   P-2  rejected → audit recordDecision({state:'rejected'}) 1 回 / kind=rejected
 *   P-3  timeout (approver 直返し) → audit recordDecision({state:'timeout'}) 1 回 / kind=timeout
 *   P-4  pending + 24h 越境 wall-clock → timeout に丸め / audit recordDecision({state:'timeout'})
 *
 * Group 4 (combined chain, 1 test):
 *   C-1  rollback success + permission rejected を順次実行 → 同 audit sink に 2 entry 集約
 */
import { describe, it, expect } from 'vitest'

import {
  APPROVAL_SLA_MS,
  adaptW3ContextToPermissionPorts,
  adaptW3ContextToRollbackPorts,
  createBreachCounter,
  createPermissionOrchestrator,
  createRollbackOrchestrator,
  type ApprovalDecision,
  type KillSwitchTriggerPort,
  type KillTerminalQueryPort,
  type PermissionApproverPort,
  type PermissionAuditSinkPort,
  type PermissionScope,
  type PostRollbackNotifierPort,
  type RollbackExecutorPort,
  type RollbackOutcome,
} from '../17day-path-w3-rollback-permission-orchestrator.js'

// ---------------------------------------------------------------------------
// Helpers — port factories (test 用 mock — control 単独挙動の sub-set)
// ---------------------------------------------------------------------------

interface RollbackInvocations {
  rollbackCalls: string[]
  killFireCalls: string[]
  postRollbackCalls: { loopId: string; targetCommit?: string }[]
  killQueryCalls: number
}

function makeRollbackInvocations(): RollbackInvocations {
  return {
    rollbackCalls: [],
    killFireCalls: [],
    postRollbackCalls: [],
    killQueryCalls: 0,
  }
}

function mockExecutor(
  log: RollbackInvocations,
  outcome: RollbackOutcome,
): RollbackExecutorPort {
  return {
    rollback: async (loopId) => {
      log.rollbackCalls.push(loopId)
      return outcome
    },
  }
}

function mockKillSwitch(log: RollbackInvocations): KillSwitchTriggerPort {
  return {
    fire: async (reason) => {
      log.killFireCalls.push(reason)
    },
  }
}

function mockPostRollback(log: RollbackInvocations): PostRollbackNotifierPort {
  return {
    onRollbackCompleted: (payload) => {
      log.postRollbackCalls.push({
        loopId: payload.loopId,
        ...(payload.targetCommit !== undefined ? { targetCommit: payload.targetCommit } : {}),
      })
    },
  }
}

function mockKillQuery(active: boolean, reason: string | null = null): KillTerminalQueryPort {
  return {
    isActive: () => active,
    lastReason: () => reason,
  }
}

interface AuditInvocations {
  decisions: { ticketId: string; state: string; detail?: string; recordedAt: string }[]
}

function makeAuditInvocations(): AuditInvocations {
  return { decisions: [] }
}

function mockAuditSink(log: AuditInvocations): PermissionAuditSinkPort {
  return {
    recordDecision: (payload) => {
      log.decisions.push({
        ticketId: payload.ticketId,
        state: payload.state,
        ...(payload.detail !== undefined ? { detail: payload.detail } : {}),
        recordedAt: payload.recordedAt,
      })
    },
  }
}

function mockApprover(decision: ApprovalDecision): PermissionApproverPort {
  return {
    requestApproval: async () => decision,
  }
}

const SCOPE: PermissionScope = {
  changeType: 'env',
  before: 'A',
  after: 'B',
  rationale: 'orchestrator dev-ee',
}

// ---------------------------------------------------------------------------
// Group 1 — BreachCounter pure logic (3 tests)
// ---------------------------------------------------------------------------

describe('W3 dev-ee group 1 — BreachCounter pure logic', () => {
  it('B-1: first observe → consecutive=1 / lastLoopId=L-1', () => {
    const c = createBreachCounter()
    const n = c.observe('L-1')
    expect(n).toBe(1)
    expect(c.current()).toBe(1)
    expect(c.lastLoopId()).toBe('L-1')
  })

  it('B-2: 異なる loopId 連続 → consecutive=2 (rollback trip line)', () => {
    const c = createBreachCounter()
    expect(c.observe('L-1')).toBe(1)
    expect(c.observe('L-2')).toBe(2)
    expect(c.observe('L-3')).toBe(3)
    expect(c.lastLoopId()).toBe('L-3')
  })

  it('B-3: 同一 loopId 重複 → max(count,1) clamp / reset で 0', () => {
    const c = createBreachCounter()
    c.observe('L-X')
    c.observe('L-X')
    c.observe('L-X')
    expect(c.current()).toBe(1) // clamped at 1 since same loopId
    c.reset()
    expect(c.current()).toBe(0)
    expect(c.lastLoopId()).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Group 2 — Rollback orchestrator (P-UI-05 接続, 5 tests)
// ---------------------------------------------------------------------------

describe('W3 dev-ee group 2 — Rollback orchestrator (P-UI-05 接続)', () => {
  it('R-1: within_threshold → executor 0 回 / counter 不変', async () => {
    const log = makeRollbackInvocations()
    const orch = createRollbackOrchestrator({
      executor: mockExecutor(log, { ok: true }),
      killSwitch: mockKillSwitch(log),
      postRollback: mockPostRollback(log),
    })
    const r = await orch.evaluate({
      loopId: 'L-1',
      metric: 'cost_per_loop',
      observedValue: 0.5,
      threshold: 1,
    })
    expect(r.kind).toBe('within_threshold')
    expect(log.rollbackCalls).toHaveLength(0)
    expect(orch.counter.current()).toBe(0)
  })

  it('R-2: metric_nan_skip → executor 0 回 / counter 不変', async () => {
    const log = makeRollbackInvocations()
    const orch = createRollbackOrchestrator({
      executor: mockExecutor(log, { ok: true }),
      killSwitch: mockKillSwitch(log),
    })
    const r = await orch.evaluate({
      loopId: 'L-NaN',
      metric: 'output_anomaly',
      observedValue: Number.NaN,
      threshold: 1,
    })
    expect(r.kind).toBe('metric_nan_skip')
    expect(log.rollbackCalls).toHaveLength(0)
    expect(orch.counter.current()).toBe(0)
  })

  it('R-3: first_breach → executor 0 回 / counter=1', async () => {
    const log = makeRollbackInvocations()
    const orch = createRollbackOrchestrator({
      executor: mockExecutor(log, { ok: true }),
      killSwitch: mockKillSwitch(log),
    })
    const r = await orch.evaluate({
      loopId: 'L-A',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('first_breach')
    if (r.kind === 'first_breach') {
      expect(r.consecutiveBreaches).toBe(1)
    }
    expect(log.rollbackCalls).toHaveLength(0)
    expect(orch.counter.current()).toBe(1)
  })

  it('R-4: 2nd breach + kill latch active → rollback skipped + postRollback 0 回', async () => {
    const log = makeRollbackInvocations()
    const orch = createRollbackOrchestrator({
      executor: mockExecutor(log, { ok: true }),
      killSwitch: mockKillSwitch(log),
      killQuery: mockKillQuery(true, 'orchestrator_panic'),
      postRollback: mockPostRollback(log),
    })
    await orch.evaluate({ loopId: 'L-A', metric: 'cost_per_loop', observedValue: 5, threshold: 1 })
    const r = await orch.evaluate({
      loopId: 'L-B',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_skipped_kill_terminal')
    if (r.kind === 'rollback_skipped_kill_terminal') {
      expect(r.killReason).toBe('orchestrator_panic')
    }
    expect(log.rollbackCalls).toHaveLength(0)
    expect(log.postRollbackCalls).toHaveLength(0)
    expect(log.killFireCalls).toHaveLength(0)
  })

  it('R-5: 2nd breach + ok rollback → postRollback 1 回 / counter reset', async () => {
    const log = makeRollbackInvocations()
    const orch = createRollbackOrchestrator({
      executor: mockExecutor(log, { ok: true, targetCommit: 'rev-EE' }),
      killSwitch: mockKillSwitch(log),
      postRollback: mockPostRollback(log),
    })
    await orch.evaluate({ loopId: 'L-A', metric: 'cost_per_loop', observedValue: 5, threshold: 1 })
    const r = await orch.evaluate({
      loopId: 'L-B',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_completed')
    if (r.kind === 'rollback_completed') {
      expect(r.targetCommit).toBe('rev-EE')
    }
    expect(log.rollbackCalls).toEqual(['L-B'])
    expect(log.postRollbackCalls).toHaveLength(1)
    expect(log.postRollbackCalls[0]).toEqual({ loopId: 'L-B', targetCommit: 'rev-EE' })
    expect(log.killFireCalls).toHaveLength(0)
    expect(orch.counter.current()).toBe(0) // reset after rollback ok
  })

  it('R-6: 2nd breach + failed rollback → killSwitch.fire 1 回 / counter not reset', async () => {
    const log = makeRollbackInvocations()
    const orch = createRollbackOrchestrator({
      executor: mockExecutor(log, { ok: false, reason: 'git_lock' }),
      killSwitch: mockKillSwitch(log),
      postRollback: mockPostRollback(log),
    })
    await orch.evaluate({ loopId: 'L-A', metric: 'cost_per_loop', observedValue: 5, threshold: 1 })
    const r = await orch.evaluate({
      loopId: 'L-B',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_failed_kill_switch_armed')
    if (r.kind === 'rollback_failed_kill_switch_armed') {
      expect(r.reason).toBe('git_lock')
    }
    expect(log.rollbackCalls).toEqual(['L-B'])
    expect(log.postRollbackCalls).toHaveLength(0)
    expect(log.killFireCalls).toEqual(['rollback_failed:git_lock'])
    expect(orch.counter.current()).toBe(2) // counter は failed では reset されない
  })
})

// ---------------------------------------------------------------------------
// Group 3 — Permission orchestrator (HITL-10 接続, 4 tests)
// ---------------------------------------------------------------------------

describe('W3 dev-ee group 3 — Permission orchestrator (HITL-10 接続)', () => {
  it('P-1: approved → audit recordDecision (state=approved) 1 回 / kind=approved', async () => {
    const audit = makeAuditInvocations()
    const t0 = 1_700_000_000_000
    const orch = createPermissionOrchestrator({
      approver: mockApprover({ state: 'approved', approvedAtMs: t0 + 5_000 }),
      auditSink: mockAuditSink(audit),
      nowMs: () => t0,
    })
    const r = await orch.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'HITL10-EE-1' },
    })
    expect(r.kind).toBe('approved')
    if (r.kind === 'approved') {
      expect(r.ticketId).toBe('HITL10-EE-1')
      expect(r.expiresAtMs).toBe(t0 + APPROVAL_SLA_MS)
    }
    expect(audit.decisions).toHaveLength(1)
    expect(audit.decisions[0].state).toBe('approved')
    expect(audit.decisions[0].detail).toBe('changeType=env')
  })

  it('P-2: rejected → audit recordDecision (state=rejected) 1 回 / kind=rejected', async () => {
    const audit = makeAuditInvocations()
    const orch = createPermissionOrchestrator({
      approver: mockApprover({ state: 'rejected', reason: 'policy_breach' }),
      auditSink: mockAuditSink(audit),
      nowMs: () => 1_700_000_000_000,
    })
    const r = await orch.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'HITL10-EE-2' },
    })
    expect(r.kind).toBe('rejected')
    if (r.kind === 'rejected') {
      expect(r.reason).toBe('policy_breach')
    }
    expect(audit.decisions).toHaveLength(1)
    expect(audit.decisions[0].state).toBe('rejected')
  })

  it('P-3: approver returns timeout directly → audit (state=timeout) / kind=timeout', async () => {
    const audit = makeAuditInvocations()
    const orch = createPermissionOrchestrator({
      approver: mockApprover({ state: 'timeout' }),
      auditSink: mockAuditSink(audit),
      nowMs: () => 1_700_000_000_000,
    })
    const r = await orch.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'HITL10-EE-3' },
    })
    expect(r.kind).toBe('timeout')
    expect(audit.decisions).toHaveLength(1)
    expect(audit.decisions[0].state).toBe('timeout')
  })

  it('P-4: pending + nowMs progressed past 24h → timeout に丸め / audit (state=timeout)', async () => {
    const audit = makeAuditInvocations()
    const t0 = 1_700_000_000_000
    let calls = 0
    const orch = createPermissionOrchestrator({
      approver: mockApprover({ state: 'pending' }),
      auditSink: mockAuditSink(audit),
      nowMs: () => {
        calls += 1
        // 1st call (request 開始) は t0 / 2nd call (decision 後判定) は t0 + 24h + 1ms
        return calls === 1 ? t0 : t0 + APPROVAL_SLA_MS + 1
      },
    })
    const r = await orch.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'HITL10-EE-4' },
    })
    expect(r.kind).toBe('timeout')
    if (r.kind === 'timeout') {
      expect(r.expiredAtMs).toBe(t0 + APPROVAL_SLA_MS + 1)
    }
    expect(audit.decisions).toHaveLength(1)
    expect(audit.decisions[0].state).toBe('timeout')
  })
})

// ---------------------------------------------------------------------------
// Group 4 — Combined chain via shared audit sink (1 test)
// ---------------------------------------------------------------------------

describe('W3 dev-ee group 4 — combined rollback + permission via shared audit sink', () => {
  it('C-1: rollback ok + permission rejected → 同 audit sink に 1 entry (rejected) 集約', async () => {
    // shared audit sink (HITL-10 用)
    const audit = makeAuditInvocations()
    const sharedAuditSink = mockAuditSink(audit)

    // Phase 1: rollback orchestrator (P-UI-05) — postRollback は audit sink とは独立
    const rollbackLog = makeRollbackInvocations()
    const rollback = createRollbackOrchestrator({
      executor: mockExecutor(rollbackLog, { ok: true, targetCommit: 'rev-CHAIN' }),
      killSwitch: mockKillSwitch(rollbackLog),
      postRollback: mockPostRollback(rollbackLog),
    })
    await rollback.evaluate({
      loopId: 'L-CHAIN-A',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    const rb = await rollback.evaluate({
      loopId: 'L-CHAIN-B',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    expect(rb.kind).toBe('rollback_completed')
    expect(rollbackLog.postRollbackCalls).toHaveLength(1)

    // Phase 2: permission orchestrator (HITL-10) — shared audit sink
    const permission = createPermissionOrchestrator({
      approver: mockApprover({ state: 'rejected', reason: 'audit_chain_test' }),
      auditSink: sharedAuditSink,
      nowMs: () => 1_700_000_000_000,
    })
    const pr = await permission.request({
      scope: SCOPE,
      requester: { role: 'ops', ticketId: 'HITL10-CHAIN' },
    })
    expect(pr.kind).toBe('rejected')

    // 検証: shared audit sink に rejected 1 件記録 (rollback は別 sink へ流す責務)
    expect(audit.decisions).toHaveLength(1)
    expect(audit.decisions[0]).toMatchObject({
      ticketId: 'HITL10-CHAIN',
      state: 'rejected',
      detail: 'changeType=env',
    })

    // adapter 経由で Dev-BB W3 ctx と接続できる shape 整合性 smoke check (型エラーなし =
    // 構造的部分型が機能している)
    const fakeCtx = {
      killTerminalSink: { isActive: () => false, lastReason: () => null },
      postRollbackNotifier: { onRollbackCompleted: () => {} },
      permissionAuditSink: sharedAuditSink,
    }
    const adapted1 = adaptW3ContextToRollbackPorts(fakeCtx, mockExecutor(rollbackLog, { ok: true }), mockKillSwitch(rollbackLog))
    expect(adapted1.killQuery).toBe(fakeCtx.killTerminalSink)
    expect(adapted1.postRollback).toBe(fakeCtx.postRollbackNotifier)
    const adapted2 = adaptW3ContextToPermissionPorts(fakeCtx, mockApprover({ state: 'pending' }), () => 0)
    expect(adapted2.auditSink).toBe(fakeCtx.permissionAuditSink)
  })
})
