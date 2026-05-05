/**
 * 17 day path W4 — fully wired e2e (Round 21 第 2 波, Dev-HH 担当)
 *
 * Spec scope (W4 = Dev-EE Round 20 e2e の更なる本番統合):
 *   - Dev-EE が確立した 7 ctrl 通し sequence を踏襲しつつ、以下を追加検証する:
 *     (1) BreachCounter persistence factory (Dev-GG 担当) を adapter 経由で接続
 *     (2) MonotonicClock SLA adapter (本 Dev-HH 担当) を HITL-10 24h SLA に接続
 *     (3) bridge 初期化失敗の異常系 (本番 wiring の前段で起き得る)
 *     (4) full wired happy path で aggregator 集約が崩れないこと
 *
 * 領域不可侵:
 *   - Dev-EE 担当 17day-path-w3-rollback-permission-orchestrator.ts 無改変
 *   - Dev-EE 担当 17day-path-w3-e2e-7ctrl.test.ts 無改変
 *   - Dev-GG 担当 (BreachCounter persistence + openclaw-runtime-bridge.ts) 無改変
 *     → 本 file 内で「Dev-GG bridge / persistent BreachCounter と同 shape」の stub を作って
 *       interface 互換性のみ smoke check する。Round 22 で Dev-GG actual file を
 *       直接 import に差し替えるだけで本番 wiring に切替可能 (port shape 維持)。
 *
 * 設計原則:
 *   1. control-agnostic: 全 ctrl は Dev-EE 既存 orchestrator factory + Dev-AA 既存 factory
 *      経由で port-injection。本体 ctrl は import しない (依存方向制約遵守)。
 *   2. MonotonicClock の wall-clock skew を deterministic に再現するため、
 *      `monotonic-clock` factory に固定値配列の wallNowMs / monoNowMs を注入する。
 *   3. PersistentBreachCounter stub は Dev-GG が実装する file factory と同じ
 *      `BreachCounter` interface を満たす形で本 file 内に内包し、
 *      restart 時の counter 復元という挙動を memory-snapshot 形式で smoke check する。
 *
 * groups (4 groups / 11 tests):
 *
 * Group 1 (full wired happy path via bridge stub, 3 tests):
 *   W-1  bridge.create() OK → 7 ctrl 通し → aggregator に rollback_completed + permission_approved 集約
 *   W-2  bridge.create() OK → C-OC-03 soft-fail → escalation 不発火, downstream は独立軸で動作
 *   W-3  bridge.create() OK → invocation order が Dev-EE 推奨 sequence と一致
 *
 * Group 2 (bridge initialization failure, 2 tests):
 *   B-1  bridge.create() throw → e2e 起動拒否 / 全 ctrl 不発火
 *   B-2  bridge initialized but acquire() で fail → orchestrator 構築 reject (上位 catch 可能)
 *
 * Group 3 (e2e + persistent BreachCounter, 3 tests):
 *   P-1  PersistentBreachCounter stub に initial=0 → 1st breach 後 snapshot=1
 *   P-2  PersistentBreachCounter stub に restart 想定で initial=1 を inject → 1 回 breach で trip 即 rollback
 *   P-3  rollback ok 後 snapshot=0 (counter reset の永続化想定)
 *
 * Group 4 (e2e + MonotonicClock SLA, 3 tests):
 *   M-1  MonotonicClock 正常 → permission approved → audit 1 件 / skew 検出 0
 *   M-2  MonotonicClock NTP forward step 30s 検出 → fail_closed → permission timeout 丸め込み
 *   M-3  MonotonicClock NTP backward step → fail_closed → 同じく timeout 丸め込み
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
  type BreachCounter,
  type KillSwitchTriggerPort,
  type KillTerminalQueryPort,
  type PermissionApproverPort,
  type PermissionAuditSinkPort,
  type PermissionScope,
  type PostRollbackNotifierPort,
  type RollbackExecutorPort,
  type RollbackOutcome,
} from '../17day-path-w3-rollback-permission-orchestrator.js'

import { createMonotonicClock } from '../monotonic-clock.js'
import { createSlaClockAdapter } from '../sla-clock-adapter.js'

// ---------------------------------------------------------------------------
// Shared fixtures (Dev-EE 既存 e2e と同 shape, 値は W4 用に区別)
// ---------------------------------------------------------------------------

const CONTRACT_INPUT: OocContractInput = {
  runId: 'W4-E2E-1',
  upstreamRef: 'main',
  localFixturePath: '/tmp/w4.json',
}
const DETECTED_AT = '2026-05-26T00:00:00.000Z'
const T0 = 1_700_000_000_000

const COOLDOWN_IDLE: OocCooldownOutput = {
  cooldownState: 'idle',
  remainingMs: 0,
  nextAllowedAt: '2026-05-26T00:00:30.000Z',
}

const SCOPE: PermissionScope = {
  changeType: 'env',
  before: 'A',
  after: 'B',
  rationale: 'w4 e2e',
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

// ---------------------------------------------------------------------------
// AuditAggregator (Dev-EE 既存 e2e と同 shape, 本 file 内に再宣言 = 不可侵維持)
// ---------------------------------------------------------------------------

interface AuditEntry {
  source: 'hitl-10' | 'p-ui-05' | 'p-ui-04'
  kind:
    | 'permission_approved'
    | 'permission_denied'
    | 'rollback_completed'
    | 'kill_terminal'
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

function buildPermissionAuditSinkFromAggregator(
  agg: AuditAggregator,
): PermissionAuditSinkPort {
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
// Bridge stub (Dev-GG openclaw-runtime-bridge.ts と同 shape を本 file 内に内包)
//   Round 22 で Dev-GG actual file を直接 import に差し替え可能 (port-only 設計)。
// ---------------------------------------------------------------------------

interface BridgeContext {
  /** P-UI-05 rollback 完遂時に発火する notifier (W3 ctx 経由) */
  postRollback: PostRollbackNotifierPort
  /** HITL-10 終局判定を受ける audit sink (W3 ctx 経由) */
  permissionAudit: PermissionAuditSinkPort
  /** P-UI-04 kill terminal latch query (W3 ctx 経由) */
  killQuery: KillTerminalQueryPort
}

interface Bridge {
  acquire(): Promise<BridgeContext>
}

interface BridgeStubOptions {
  initThrows?: boolean
  acquireThrows?: boolean
  agg: AuditAggregator
  killActive?: boolean
  killReason?: string
}

function createBridgeStub(opts: BridgeStubOptions): Bridge {
  if (opts.initThrows) {
    throw new Error('bridge_init_failed')
  }
  return {
    acquire: async () => {
      if (opts.acquireThrows) {
        throw new Error('bridge_acquire_failed')
      }
      return {
        postRollback: buildPostRollbackFromAggregator(opts.agg, () => DETECTED_AT),
        permissionAudit: buildPermissionAuditSinkFromAggregator(opts.agg),
        killQuery: {
          isActive: () => opts.killActive === true,
          lastReason: () => opts.killReason ?? null,
        },
      }
    },
  }
}

// ---------------------------------------------------------------------------
// PersistentBreachCounter stub (Dev-GG file persistence factory と同 shape)
//   - in-memory snapshot を test 内で参照可能にする
//   - initial を constructor で受け取り restart 復元シナリオを再現
// ---------------------------------------------------------------------------

interface PersistentBreachCounterStub extends BreachCounter {
  snapshot(): { count: number; lastLoopId: string | null }
}

function createPersistentBreachCounterStub(
  initial: { count: number; lastLoopId: string | null } = {
    count: 0,
    lastLoopId: null,
  },
): PersistentBreachCounterStub {
  let count = initial.count
  let lastId: string | null = initial.lastLoopId
  return {
    observe(loopId) {
      if (lastId !== null && lastId !== loopId) {
        count += 1
      } else {
        count = Math.max(count, 1)
      }
      lastId = loopId
      return count
    },
    current: () => count,
    lastLoopId: () => lastId,
    reset() {
      count = 0
      lastId = null
    },
    snapshot: () => ({ count, lastLoopId: lastId }),
  }
}

// ---------------------------------------------------------------------------
// Mock port factories (Dev-EE 既存 e2e と同形式)
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
    contract:
      | { kind: 'success'; output: OocContractOutput }
      | { kind: 'throw'; error: Error }
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

function mockApprover(
  seq: SequenceLog,
  decision: ApprovalDecision,
): PermissionApproverPort {
  return {
    requestApproval: async (_s, r) => {
      seq.steps.push(`HITL-10:${r.ticketId}`)
      return decision
    },
  }
}

// ---------------------------------------------------------------------------
// Group 1 — full wired happy path via bridge stub (3 tests)
// ---------------------------------------------------------------------------

describe('W4 dev-hh group 1 — fully wired via bridge stub', () => {
  it('W-1: bridge ok → 7 ctrl 通し → aggregator に rollback_completed + permission_approved 集約', async () => {
    const seq = makeSeqLog()
    const agg = createAuditAggregator()
    const bridge = createBridgeStub({ agg, killActive: false })
    const ctx = await bridge.acquire()

    // (1)(2)(3)
    const openClaw = createOpenClawOrchestrator(
      mockOpenClawPorts(seq, {
        contract: { kind: 'success', output: majorContractOutput() },
        escalation: escalationOk('W4-E2E-1'),
        cooldown: COOLDOWN_IDLE,
      }),
    )
    const cycle = await openClaw.runOpenClawCycle({
      contract: CONTRACT_INPUT,
      detectedAt: DETECTED_AT,
    })
    if (isCycleAborted(cycle)) throw new Error('unexpected abort')
    expect(cycle.phaseGateBlocked).toBe(true)
    openClaw.evaluateCooldownGate({
      triggerEvent: 'kill_switch',
      abortedAt: DETECTED_AT,
      loopId: 'W4-E2E-1',
    })

    // (5) P-UI-05 rollback (bridge ctx 経由)
    const rollback = createRollbackOrchestrator({
      executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-W4' }),
      killSwitch: mockKillSwitch(seq),
      killQuery: ctx.killQuery,
      postRollback: ctx.postRollback,
    })
    await rollback.evaluate({
      loopId: 'W4-A',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    const r = await rollback.evaluate({
      loopId: 'W4-B',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_completed')

    // (6) HITL-10 (bridge ctx 経由 + 単純 nowMs 注入)
    const permission = createPermissionOrchestrator({
      approver: mockApprover(seq, { state: 'approved', approvedAtMs: T0 + 1 }),
      auditSink: ctx.permissionAudit,
      nowMs: () => T0,
    })
    const pr = await permission.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'HITL10-W4' },
    })
    expect(pr.kind).toBe('approved')

    expect(agg.count()).toBe(2)
    const all = agg.list()
    expect(all.some((e) => e.kind === 'rollback_completed')).toBe(true)
    expect(all.some((e) => e.kind === 'permission_approved')).toBe(true)
  })

  it('W-2: C-OC-03 soft-fail via bridge → escalation 不発火, downstream は独立で動作', async () => {
    const seq = makeSeqLog()
    const agg = createAuditAggregator()
    const bridge = createBridgeStub({ agg })
    const ctx = await bridge.acquire()

    const openClaw = createOpenClawOrchestrator(
      mockOpenClawPorts(seq, {
        contract: { kind: 'success', output: softFailContractOutput() },
        escalation: null,
        cooldown: COOLDOWN_IDLE,
      }),
    )
    const cycle = await openClaw.runOpenClawCycle({
      contract: CONTRACT_INPUT,
      detectedAt: DETECTED_AT,
    })
    if (isCycleAborted(cycle)) throw new Error('unexpected abort')
    expect(cycle.chainOutcome.kind).toBe('no_escalation_soft_fail')

    const rollback = createRollbackOrchestrator({
      executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-soft' }),
      killSwitch: mockKillSwitch(seq),
      killQuery: ctx.killQuery,
      postRollback: ctx.postRollback,
    })
    await rollback.evaluate({
      loopId: 'WS-A',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    const r = await rollback.evaluate({
      loopId: 'WS-B',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_completed')
    expect(agg.count()).toBe(1)
  })

  it('W-3: invocation order が Dev-EE 推奨 sequence と一致 (bridge 経由)', async () => {
    const seq = makeSeqLog()
    const agg = createAuditAggregator()
    const bridge = createBridgeStub({ agg })
    const ctx = await bridge.acquire()

    const openClaw = createOpenClawOrchestrator(
      mockOpenClawPorts(seq, {
        contract: { kind: 'success', output: majorContractOutput() },
        escalation: escalationOk('ORD-W4'),
        cooldown: COOLDOWN_IDLE,
      }),
    )
    await openClaw.runOpenClawCycle({
      contract: { ...CONTRACT_INPUT, runId: 'ORD-W4' },
      detectedAt: DETECTED_AT,
    })
    openClaw.evaluateCooldownGate({
      triggerEvent: 'kill_switch',
      abortedAt: DETECTED_AT,
      loopId: 'ORD-W4',
    })

    const rollback = createRollbackOrchestrator({
      executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-ORD-W4' }),
      killSwitch: mockKillSwitch(seq),
      killQuery: ctx.killQuery,
      postRollback: ctx.postRollback,
    })
    await rollback.evaluate({
      loopId: 'ORDW-A',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    await rollback.evaluate({
      loopId: 'ORDW-B',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })

    const permission = createPermissionOrchestrator({
      approver: mockApprover(seq, { state: 'approved', approvedAtMs: T0 + 1 }),
      auditSink: ctx.permissionAudit,
      nowMs: () => T0,
    })
    await permission.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'HITL10-ORDW' },
    })

    expect(seq.steps).toEqual([
      'C-OC-03:ORD-W4',
      'C-OC-04:ORD-W4',
      'P-UI-02:ORD-W4',
      'P-UI-05.exec:ORDW-B',
      'HITL-10:HITL10-ORDW',
    ])
  })
})

// ---------------------------------------------------------------------------
// Group 2 — bridge initialization failure (2 tests)
// ---------------------------------------------------------------------------

describe('W4 dev-hh group 2 — bridge initialization failure', () => {
  it('B-1: bridge.create() throw → e2e 起動拒否 / 全 ctrl 不発火', () => {
    const agg = createAuditAggregator()
    expect(() => createBridgeStub({ agg, initThrows: true })).toThrow(
      'bridge_init_failed',
    )
    // ctrl 側は呼ばれていないので aggregator は空
    expect(agg.count()).toBe(0)
  })

  it('B-2: bridge.acquire() で fail → orchestrator 構築 reject (上位 catch 可能)', async () => {
    const agg = createAuditAggregator()
    const bridge = createBridgeStub({ agg, acquireThrows: true })
    await expect(bridge.acquire()).rejects.toThrow('bridge_acquire_failed')
    // ctrl 不発火
    expect(agg.count()).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Group 3 — e2e + persistent BreachCounter stub (3 tests)
// ---------------------------------------------------------------------------

describe('W4 dev-hh group 3 — e2e + persistent BreachCounter (Dev-GG file factory shape)', () => {
  it('P-1: PersistentBreachCounter initial=0 → 1st breach 後 snapshot.count=1', async () => {
    const seq = makeSeqLog()
    const agg = createAuditAggregator()
    const bridge = createBridgeStub({ agg })
    const ctx = await bridge.acquire()
    const counter = createPersistentBreachCounterStub({ count: 0, lastLoopId: null })

    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-P1' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: ctx.killQuery,
        postRollback: ctx.postRollback,
      },
      counter,
    )
    const r = await rollback.evaluate({
      loopId: 'P1-A',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('first_breach')
    expect(counter.snapshot().count).toBe(1)
    expect(counter.snapshot().lastLoopId).toBe('P1-A')
  })

  it('P-2: restart 復元想定 (initial=1) → 1 回 breach で trip → rollback 即起動', async () => {
    const seq = makeSeqLog()
    const agg = createAuditAggregator()
    const bridge = createBridgeStub({ agg })
    const ctx = await bridge.acquire()
    // 想定: 前 process で 1 breach 観測済 → file から復元
    const counter = createPersistentBreachCounterStub({
      count: 1,
      lastLoopId: 'P2-prev',
    })

    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-P2' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: ctx.killQuery,
        postRollback: ctx.postRollback,
      },
      counter,
    )
    // 異 loopId で 1 度 observe → count 2 で trip → rollback 起動
    const r = await rollback.evaluate({
      loopId: 'P2-A',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_completed')
    expect(seq.steps).toContain('P-UI-05.exec:P2-A')
    // rollback ok 後 reset
    expect(counter.snapshot().count).toBe(0)
    expect(counter.snapshot().lastLoopId).toBeNull()
  })

  it('P-3: rollback ok 後 snapshot=0 (永続化 counter reset 反映)', async () => {
    const seq = makeSeqLog()
    const agg = createAuditAggregator()
    const bridge = createBridgeStub({ agg })
    const ctx = await bridge.acquire()
    const counter = createPersistentBreachCounterStub({ count: 0, lastLoopId: null })

    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-P3' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: ctx.killQuery,
        postRollback: ctx.postRollback,
      },
      counter,
    )
    await rollback.evaluate({
      loopId: 'P3-A',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    expect(counter.snapshot().count).toBe(1)
    const r = await rollback.evaluate({
      loopId: 'P3-B',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_completed')
    expect(counter.snapshot().count).toBe(0)
    expect(counter.snapshot().lastLoopId).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Group 4 — e2e + MonotonicClock SLA adapter (3 tests)
// ---------------------------------------------------------------------------

describe('W4 dev-hh group 4 — e2e + MonotonicClock SLA adapter (HITL-10 24h SLA)', () => {
  it('M-1: MonotonicClock 正常 → permission approved → audit 1 件 / skew 検出 0', async () => {
    const seq = makeSeqLog()
    const agg = createAuditAggregator()
    const bridge = createBridgeStub({ agg })
    const ctx = await bridge.acquire()

    // 正常: wall + mono が同 rate で進む
    let i = 0
    const wallSeq = [T0, T0 + 100, T0 + 200, T0 + 300]
    const monoSeq = [0, 100, 200, 300]
    const clock = createMonotonicClock({
      wallNowMs: () => wallSeq[Math.min(i, wallSeq.length - 1)] ?? T0,
      monoNowMs: () => {
        const v = monoSeq[Math.min(i, monoSeq.length - 1)] ?? 0
        i = Math.min(i + 1, wallSeq.length - 1)
        return v
      },
    })
    const adapter = createSlaClockAdapter(clock)
    const permission = createPermissionOrchestrator({
      approver: mockApprover(seq, { state: 'approved', approvedAtMs: T0 + 100 }),
      auditSink: ctx.permissionAudit,
      nowMs: adapter.nowMs,
    })
    const pr = await permission.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'HITL10-M1' },
    })
    expect(pr.kind).toBe('approved')
    expect(agg.count()).toBe(1)
    expect(adapter.skewObserved()).toBe(false)
  })

  it('M-2: MonotonicClock NTP forward step 30s 検出 → fail_closed → permission timeout 丸め込み', async () => {
    const seq = makeSeqLog()
    const agg = createAuditAggregator()
    const bridge = createBridgeStub({ agg })
    const ctx = await bridge.acquire()

    // mark 時点: wall=T0, mono=0
    // nowMs 1 回目 (orchestrator 内 t0 取得) ※後述
    // 実際 createPermissionOrchestrator は request 内で nowMs を 2 回呼ぶ:
    //   - t0 = ports.nowMs()    (request 開始)
    //   - tNow = ports.nowMs() (approver 戻り後)
    // adapter constructor 時点で markNow 1 回呼ばれるため、
    // 配列インデックスは: [mark wall, mark mono] [t0 wall, t0 mono] [tNow wall, tNow mono]
    //   wallSeq = [T0,        T0,        T0 + 30_000]
    //   monoSeq = [0,         0,         1_000]
    //   t0 計算時: wall=0 elapsed, mono=0 elapsed, skew=0 → false
    //   tNow 計算時: wall=30_000, mono=1_000, skew=29_000 > 5_000 → fail_closed
    let wi = 0
    let mi = 0
    const wallSeq = [T0, T0, T0 + 30_000]
    const monoSeq = [0, 0, 1_000]
    const clock = createMonotonicClock({
      wallNowMs: () => {
        const v = wallSeq[Math.min(wi, wallSeq.length - 1)] ?? T0
        wi = Math.min(wi + 1, wallSeq.length)
        return v
      },
      monoNowMs: () => {
        const v = monoSeq[Math.min(mi, monoSeq.length - 1)] ?? 0
        mi = Math.min(mi + 1, monoSeq.length)
        return v
      },
    })
    const adapter = createSlaClockAdapter(clock, { onSkew: 'fail_closed' })

    // approver は pending を返すので orchestrator 側で SLA 越境判定する余地が出る
    const permission = createPermissionOrchestrator({
      approver: mockApprover(seq, { state: 'pending' }),
      auditSink: ctx.permissionAudit,
      nowMs: adapter.nowMs,
    })
    const pr = await permission.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'HITL10-M2' },
    })
    // fail_closed で adapter が SLA 越境扱いの ms を返したため timeout に丸め込まれる
    expect(pr.kind).toBe('timeout')
    expect(adapter.skewObserved()).toBe(true)
    // audit には timeout 1 件
    expect(agg.list().some((e) => e.kind === 'permission_denied')).toBe(true)
  })

  it('M-3: MonotonicClock NTP backward step → fail_closed → 同じく timeout 丸め込み', async () => {
    const seq = makeSeqLog()
    const agg = createAuditAggregator()
    const bridge = createBridgeStub({ agg })
    const ctx = await bridge.acquire()

    // wall 巻き戻り (-10s)、mono は単調増加
    let wi = 0
    let mi = 0
    const wallSeq = [T0, T0, T0 - 10_000]
    const monoSeq = [0, 0, 1_000]
    const clock = createMonotonicClock({
      wallNowMs: () => {
        const v = wallSeq[Math.min(wi, wallSeq.length - 1)] ?? T0
        wi = Math.min(wi + 1, wallSeq.length)
        return v
      },
      monoNowMs: () => {
        const v = monoSeq[Math.min(mi, monoSeq.length - 1)] ?? 0
        mi = Math.min(mi + 1, monoSeq.length)
        return v
      },
    })
    const adapter = createSlaClockAdapter(clock, { onSkew: 'fail_closed' })
    const permission = createPermissionOrchestrator({
      approver: mockApprover(seq, { state: 'pending' }),
      auditSink: ctx.permissionAudit,
      nowMs: adapter.nowMs,
    })
    const pr = await permission.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'HITL10-M3' },
    })
    expect(pr.kind).toBe('timeout')
    expect(adapter.skewObserved()).toBe(true)
    expect(adapter.lastSkewMs()).not.toBeNull()
    expect(adapter.lastSkewMs()! < 0).toBe(true)
  })
})
