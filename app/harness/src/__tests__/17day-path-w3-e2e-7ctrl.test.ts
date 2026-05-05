/**
 * 17 day path W3 — fully wired e2e 7 ctrl (Round 20 第 2 波, Dev-EE 担当)
 *
 * Spec scope (W3 fully wired):
 *   全 7 ctrl (C-OC-03 / C-OC-04 / P-UI-02 / P-UI-04 / P-UI-05 / HITL-10 / P-UI-09) を
 *   harness orchestrator が e2e で連結する経路を確立し、推奨 sequence で 1 通しシナリオを駆動する。
 *
 * 推奨 sequence:
 *   (1) C-OC-03 (subscription contract test)
 *       → (2) C-OC-04 (cli-version breaking change escalation)
 *       → (3) P-UI-02 (cooldown evaluation, phase gate と独立軸)
 *       → (4) P-UI-04 (kill terminal latch fire)  [異常分岐のみ]
 *       → (5) P-UI-05 (rollback executor)
 *       → (6) HITL-10 (permission auditor)
 *       → (7) P-UI-09 (RLS audit trail aggregation)
 *
 * 不可侵:
 *   - control 本体ファイル無改変
 *   - Dev-AA / Dev-BB / Dev-DD の harness orchestrator file には touch しない
 *   - 既存 31 tests + Dev-DD tests に変更を加えない
 *
 * 設計原則:
 *   - control-agnostic: 全 ctrl を port 注入 (mock) で駆動。本体への依存方向制約を尊重。
 *   - Dev-EE 担当 P-UI-05 + HITL-10 は 17day-path-w3-rollback-permission-orchestrator.ts 経由。
 *   - Dev-AA 担当 C-OC-03 + C-OC-04 + P-UI-02 は openclaw-orchestrator.ts 経由。
 *   - Dev-BB / Dev-DD 担当 P-UI-04 + P-UI-09 は port (KillTerminalQuery / RlsAuditTrail-shape) のみ
 *     test 内で stub 注入 (本体 ctrl を import しない)。
 *
 * 本 file の 7 tests / 2 groups:
 *
 * Group 1 (full chain happy path, 4 tests):
 *   E-1  全 7 ctrl 通しで escalation_fired + rollback ok + permission approved + RLS green
 *   E-2  C-OC-03 soft-fail で chain 短絡 (escalation 不発火, P-UI-02 / P-UI-05 / HITL-10 は別軸独立)
 *   E-3  P-UI-04 kill latch fired before rollback → P-UI-05 rollback skipped + HITL-10 audit 維持
 *   E-4  invocation order 検証 — 推奨 sequence 通りに副作用が観測される
 *
 * Group 2 (anomaly branches, 3 tests):
 *   A-1  C-OC-03 fixture_corrupted throw → cycle aborted, downstream ctrl 不発火
 *   A-2  HITL-10 rejected + P-UI-05 rollback success が同 audit aggregator に集約される
 *   A-3  P-UI-05 failed rollback → killSwitch.fire 1 回 / audit に rollback_completed 不記録
 */
import { describe, it, expect } from 'vitest'

import {
  createOpenClawOrchestrator,
  isCycleAborted,
  type OocContractInput,
  type OocContractOutput,
  type OocCooldownOutput,
  type OocEscalationOutput,
  type OpenClawOrchestratorPorts,
} from '../openclaw-orchestrator.js'

import {
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
// Shared test fixtures
// ---------------------------------------------------------------------------

const CONTRACT_INPUT: OocContractInput = {
  runId: 'E2E-1',
  upstreamRef: 'main',
  localFixturePath: '/tmp/e2e.json',
}
const DETECTED_AT = '2026-05-26T00:00:00.000Z'
const T0 = 1_700_000_000_000

const COOLDOWN_IDLE: OocCooldownOutput = {
  cooldownState: 'idle',
  remainingMs: 0,
  nextAllowedAt: '2026-05-26T00:00:30.000Z',
}

function majorContractOutput(): OocContractOutput {
  return {
    matched: false,
    diffs: [{ field: '--required', before: 's', after: '', severity: 'major' }],
    reportPath: '/tmp/r.json',
    softFailed: false,
  }
}
function softFailContractOutput(): OocContractOutput {
  return {
    matched: true,
    diffs: [],
    reportPath: '/tmp/r.json',
    softFailed: true,
  }
}
function escalationOk(runId: string): OocEscalationOutput {
  return {
    escalationId: `COC04-${runId}`,
    notifiedChannels: ['#drill'],
    failedChannels: [],
    phaseGateBlocked: true,
    ackDeadline: '2026-05-26T01:00:00.000Z',
    criticalLogged: false,
    reArmRequested: false,
  }
}

const SCOPE: PermissionScope = {
  changeType: 'env',
  before: 'A',
  after: 'B',
  rationale: 'e2e chain',
}

// ---------------------------------------------------------------------------
// Cross-control aggregator — P-UI-09 RlsAuditTrail に相当する shape を test 内で
// stub 実装する (本体 ctrl 非 import: 依存方向制約遵守)。
// ---------------------------------------------------------------------------

interface AuditEntry {
  source: 'hitl-10' | 'p-ui-05' | 'p-ui-04'
  kind: 'permission_approved' | 'permission_denied' | 'rollback_completed' | 'kill_terminal'
  ticketId?: string
  detail?: string
  recordedAt: string
}

interface AuditAggregator {
  record(e: AuditEntry): void
  list(): readonly AuditEntry[]
  count(): number
}

function createAuditAggregator(): AuditAggregator {
  const entries: AuditEntry[] = []
  return {
    record: (e) => entries.push(e),
    list: () => entries.slice(),
    count: () => entries.length,
  }
}

function buildPermissionAuditSinkFromAggregator(agg: AuditAggregator): PermissionAuditSinkPort {
  return {
    recordDecision: (payload) => {
      agg.record({
        source: 'hitl-10',
        kind: payload.state === 'approved' ? 'permission_approved' : 'permission_denied',
        ...(payload.ticketId !== undefined ? { ticketId: payload.ticketId } : {}),
        ...(payload.detail !== undefined ? { detail: payload.detail } : {}),
        recordedAt: payload.recordedAt,
      })
    },
  }
}

function buildPostRollbackFromAggregator(
  agg: AuditAggregator,
  now: () => string,
): PostRollbackNotifierPort {
  return {
    onRollbackCompleted: (payload) => {
      agg.record({
        source: 'p-ui-05',
        kind: 'rollback_completed',
        detail: `loopId=${payload.loopId};targetCommit=${payload.targetCommit ?? ''}`,
        recordedAt: now(),
      })
    },
  }
}

// ---------------------------------------------------------------------------
// Mock port factories
// ---------------------------------------------------------------------------

interface SequenceLog {
  steps: string[]
}

function makeSeqLog(): SequenceLog {
  return { steps: [] }
}

function mockOpenClawPorts(
  seq: SequenceLog,
  cfg: {
    contract: { kind: 'success'; output: OocContractOutput } | { kind: 'throw'; error: Error }
    escalation: OocEscalationOutput | null
    cooldown: OocCooldownOutput
  },
): OpenClawOrchestratorPorts {
  return {
    runContractTest: async (i) => {
      seq.steps.push(`C-OC-03:${i.runId}`)
      if (cfg.contract.kind === 'throw') throw cfg.contract.error
      return cfg.contract.output
    },
    escalateBreakingChange: async (i) => {
      seq.steps.push(`C-OC-04:${i.contractRunId}`)
      if (cfg.escalation === null) {
        throw new Error('escalation should not be called')
      }
      return cfg.escalation
    },
    evaluateCooldown: (i) => {
      seq.steps.push(`P-UI-02:${i.loopId}`)
      return cfg.cooldown
    },
  }
}

function mockExecutor(seq: SequenceLog, outcome: RollbackOutcome): RollbackExecutorPort {
  return {
    rollback: async (loopId) => {
      seq.steps.push(`P-UI-05.exec:${loopId}`)
      return outcome
    },
  }
}

function mockKillSwitch(seq: SequenceLog): KillSwitchTriggerPort {
  return {
    fire: async (reason) => {
      seq.steps.push(`P-UI-05.kill:${reason}`)
    },
  }
}

function mockKillQuery(active: boolean, reason: string | null = null): KillTerminalQueryPort {
  return {
    isActive: () => active,
    lastReason: () => reason,
  }
}

function mockApprover(seq: SequenceLog, decision: ApprovalDecision): PermissionApproverPort {
  return {
    requestApproval: async (_s, r) => {
      seq.steps.push(`HITL-10:${r.ticketId}`)
      return decision
    },
  }
}

// ---------------------------------------------------------------------------
// Group 1 — full chain happy path (4 tests)
// ---------------------------------------------------------------------------

describe('W3 dev-ee group 1 — fully wired 7 ctrl happy path', () => {
  it('E-1: full 7 ctrl run → escalation_fired + rollback ok + permission approved + RLS green', async () => {
    const seq = makeSeqLog()
    const agg = createAuditAggregator()
    // (1) (2) (3) C-OC-03 / C-OC-04 / P-UI-02
    const openClaw = createOpenClawOrchestrator(
      mockOpenClawPorts(seq, {
        contract: { kind: 'success', output: majorContractOutput() },
        escalation: escalationOk('E2E-1'),
        cooldown: COOLDOWN_IDLE,
      }),
    )
    const cycle = await openClaw.runOpenClawCycle({
      contract: CONTRACT_INPUT,
      detectedAt: DETECTED_AT,
    })
    if (isCycleAborted(cycle)) throw new Error('unexpected abort')
    expect(cycle.phaseGateBlocked).toBe(true)
    const cooldown = openClaw.evaluateCooldownGate({
      triggerEvent: 'kill_switch',
      abortedAt: DETECTED_AT,
      loopId: 'E2E-1',
    })
    expect(cooldown.cooldownState).toBe('idle')

    // (4) P-UI-04: kill latch は inactive (happy path)
    const killQuery = mockKillQuery(false)

    // (5) P-UI-05 rollback (executor ok)
    const rollback = createRollbackOrchestrator({
      executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-E2E' }),
      killSwitch: mockKillSwitch(seq),
      killQuery,
      postRollback: buildPostRollbackFromAggregator(agg, () => DETECTED_AT),
    })
    await rollback.evaluate({
      loopId: 'L-E2E-A',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    const r = await rollback.evaluate({
      loopId: 'L-E2E-B',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_completed')

    // (6) HITL-10 permission approved
    const permAudit = buildPermissionAuditSinkFromAggregator(agg)
    const permission = createPermissionOrchestrator({
      approver: mockApprover(seq, { state: 'approved', approvedAtMs: T0 + 5_000 }),
      auditSink: permAudit,
      nowMs: () => T0,
    })
    const pr = await permission.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'HITL10-E2E' },
    })
    expect(pr.kind).toBe('approved')

    // (7) P-UI-09 RLS verify (aggregator stub の集約状態を検証)
    const all = agg.list()
    expect(agg.count()).toBe(2)
    expect(all.some((e) => e.source === 'p-ui-05' && e.kind === 'rollback_completed')).toBe(true)
    expect(all.some((e) => e.source === 'hitl-10' && e.kind === 'permission_approved')).toBe(true)
  })

  it('E-2: C-OC-03 soft-fail → escalation 不発火, downstream は独立軸で動作可能', async () => {
    const seq = makeSeqLog()
    const agg = createAuditAggregator()
    const openClaw = createOpenClawOrchestrator(
      mockOpenClawPorts(seq, {
        contract: { kind: 'success', output: softFailContractOutput() },
        escalation: null, // never_called
        cooldown: COOLDOWN_IDLE,
      }),
    )
    const cycle = await openClaw.runOpenClawCycle({
      contract: CONTRACT_INPUT,
      detectedAt: DETECTED_AT,
    })
    if (isCycleAborted(cycle)) throw new Error('unexpected abort')
    expect(cycle.chainOutcome.kind).toBe('no_escalation_soft_fail')

    // P-UI-05 / HITL-10 は phase gate 結果と独立 (W2 I-5 / I-11 反映)
    const rollback = createRollbackOrchestrator({
      executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-soft' }),
      killSwitch: mockKillSwitch(seq),
      postRollback: buildPostRollbackFromAggregator(agg, () => DETECTED_AT),
    })
    await rollback.evaluate({
      loopId: 'L-S-A',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    const r = await rollback.evaluate({
      loopId: 'L-S-B',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_completed')
    expect(agg.count()).toBe(1)
  })

  it('E-3: P-UI-04 kill latch fired before rollback → P-UI-05 skipped, HITL-10 audit 維持', async () => {
    const seq = makeSeqLog()
    const agg = createAuditAggregator()
    // P-UI-04 latch を active で stub (本体 ctrl を import しない)
    const killQuery = mockKillQuery(true, 'orchestrator_panic')

    const rollback = createRollbackOrchestrator({
      executor: mockExecutor(seq, { ok: true, targetCommit: 'should_not_reach' }),
      killSwitch: mockKillSwitch(seq),
      killQuery,
      postRollback: buildPostRollbackFromAggregator(agg, () => DETECTED_AT),
    })
    await rollback.evaluate({
      loopId: 'L-K-A',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    const r = await rollback.evaluate({
      loopId: 'L-K-B',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_skipped_kill_terminal')
    if (r.kind === 'rollback_skipped_kill_terminal') {
      expect(r.killReason).toBe('orchestrator_panic')
    }

    // HITL-10 は kill latch と独立に audit 可能
    const permission = createPermissionOrchestrator({
      approver: mockApprover(seq, { state: 'rejected', reason: 'kill_phase' }),
      auditSink: buildPermissionAuditSinkFromAggregator(agg),
      nowMs: () => T0,
    })
    const pr = await permission.request({
      scope: SCOPE,
      requester: { role: 'ops', ticketId: 'HITL10-K' },
    })
    expect(pr.kind).toBe('rejected')

    // aggregator: rollback_completed は 0 件 / permission_denied 1 件のみ
    const all = agg.list()
    expect(all.some((e) => e.kind === 'rollback_completed')).toBe(false)
    expect(all.filter((e) => e.kind === 'permission_denied')).toHaveLength(1)
  })

  it('E-4: invocation order — 推奨 sequence 通りに副作用が観測される', async () => {
    const seq = makeSeqLog()
    const agg = createAuditAggregator()

    // (1)(2)(3)
    const openClaw = createOpenClawOrchestrator(
      mockOpenClawPorts(seq, {
        contract: { kind: 'success', output: majorContractOutput() },
        escalation: escalationOk('ORDER-1'),
        cooldown: COOLDOWN_IDLE,
      }),
    )
    await openClaw.runOpenClawCycle({
      contract: { ...CONTRACT_INPUT, runId: 'ORDER-1' },
      detectedAt: DETECTED_AT,
    })
    openClaw.evaluateCooldownGate({
      triggerEvent: 'kill_switch',
      abortedAt: DETECTED_AT,
      loopId: 'ORDER-1',
    })

    // (5) P-UI-05 rollback ok (P-UI-04 inactive)
    const rollback = createRollbackOrchestrator({
      executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-ORD' }),
      killSwitch: mockKillSwitch(seq),
      killQuery: mockKillQuery(false),
      postRollback: buildPostRollbackFromAggregator(agg, () => DETECTED_AT),
    })
    await rollback.evaluate({
      loopId: 'ORD-A',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    await rollback.evaluate({
      loopId: 'ORD-B',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })

    // (6) HITL-10
    const permission = createPermissionOrchestrator({
      approver: mockApprover(seq, { state: 'approved', approvedAtMs: T0 + 1 }),
      auditSink: buildPermissionAuditSinkFromAggregator(agg),
      nowMs: () => T0,
    })
    await permission.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'HITL10-ORD' },
    })

    // 期待 sequence (P-UI-04 latch は本 test では fire しない = step に出ない)
    expect(seq.steps).toEqual([
      'C-OC-03:ORDER-1',
      'C-OC-04:ORDER-1',
      'P-UI-02:ORDER-1',
      'P-UI-05.exec:ORD-B',
      'HITL-10:HITL10-ORD',
    ])

    // aggregator (P-UI-09 stub) — 2 entry 集約
    expect(agg.count()).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Group 2 — anomaly branches (3 tests)
// ---------------------------------------------------------------------------

describe('W3 dev-ee group 2 — anomaly branches', () => {
  it('A-1: C-OC-03 fixture_corrupted throw → cycle aborted, downstream ctrl 不発火', async () => {
    const seq = makeSeqLog()
    const openClaw = createOpenClawOrchestrator(
      mockOpenClawPorts(seq, {
        contract: { kind: 'throw', error: new Error('fixture_corrupted') },
        escalation: null,
        cooldown: COOLDOWN_IDLE,
      }),
    )
    const cycle = await openClaw.runOpenClawCycle({
      contract: CONTRACT_INPUT,
      detectedAt: DETECTED_AT,
    })
    expect(isCycleAborted(cycle)).toBe(true)
    if (!isCycleAborted(cycle)) return
    expect(cycle.abortReason).toBe('fixture_corrupted')
    // C-OC-04 / P-UI-02 / P-UI-05 / HITL-10 は呼ばれていないはず
    expect(seq.steps).toEqual(['C-OC-03:E2E-1'])
  })

  it('A-2: HITL-10 rejected + P-UI-05 rollback ok → 同 audit aggregator に 2 entry 集約', async () => {
    const seq = makeSeqLog()
    const agg = createAuditAggregator()
    // P-UI-05 ok
    const rollback = createRollbackOrchestrator({
      executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-AA2' }),
      killSwitch: mockKillSwitch(seq),
      postRollback: buildPostRollbackFromAggregator(agg, () => DETECTED_AT),
    })
    await rollback.evaluate({
      loopId: 'AA2-A',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    await rollback.evaluate({
      loopId: 'AA2-B',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    // HITL-10 rejected
    const permission = createPermissionOrchestrator({
      approver: mockApprover(seq, { state: 'rejected', reason: 'aa2' }),
      auditSink: buildPermissionAuditSinkFromAggregator(agg),
      nowMs: () => T0,
    })
    await permission.request({
      scope: SCOPE,
      requester: { role: 'ops', ticketId: 'HITL10-AA2' },
    })
    const all = agg.list()
    expect(all).toHaveLength(2)
    expect(all.some((e) => e.kind === 'rollback_completed')).toBe(true)
    expect(all.some((e) => e.kind === 'permission_denied')).toBe(true)
  })

  it('A-3: P-UI-05 failed rollback → killSwitch.fire 1 回 / aggregator に rollback_completed 不記録', async () => {
    const seq = makeSeqLog()
    const agg = createAuditAggregator()
    const rollback = createRollbackOrchestrator({
      executor: mockExecutor(seq, { ok: false, reason: 'git_lock_e2e' }),
      killSwitch: mockKillSwitch(seq),
      postRollback: buildPostRollbackFromAggregator(agg, () => DETECTED_AT),
    })
    await rollback.evaluate({
      loopId: 'A3-A',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    const r = await rollback.evaluate({
      loopId: 'A3-B',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_failed_kill_switch_armed')
    expect(seq.steps).toEqual([
      'P-UI-05.exec:A3-B',
      'P-UI-05.kill:rollback_failed:git_lock_e2e',
    ])
    // aggregator は rollback_completed エントリを持たない (rollback 失敗時 postRollback 不発火)
    expect(agg.list().some((e) => e.kind === 'rollback_completed')).toBe(false)
  })
})
