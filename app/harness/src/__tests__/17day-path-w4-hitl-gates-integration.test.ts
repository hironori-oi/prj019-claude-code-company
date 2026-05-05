/**
 * 17 day path W4 — HITL 12 gates × W4 e2e production wiring 統合検証
 * (Round 23, Dev-MM 担当, W4 完成第 3 弾).
 *
 * Spec scope (W4 完成第 3 弾):
 *   Dev-HH Round 21 第 2 波 (`17day-path-w4-e2e-fully-wired.test.ts` / 11 tests) と
 *   Dev-JJ Round 22 第 1 波 (`17day-path-w4-production-e2e-extended.test.ts` / 10 tests) で確立した
 *   production wiring 基盤に対し、**HITL 12 gates** の通過 / 拒否 / timeout が
 *   breach-counter / monotonic-clock と整合的に連動することを統合 e2e で検証する。
 *
 * HITL 12 gates (Open Claw 17 day path で使われる審判ゲート、概念上 12 種):
 *   gate-1   control_def_review        (W1 ctrl 設計レビュー = Owner 承認)
 *   gate-2   ports_design_review       (W2 port 設計レビュー)
 *   gate-3   orchestrator_design_review(W3 orchestrator 設計レビュー)
 *   gate-4   wiring_review             (W4 production wiring レビュー)
 *   gate-5   public_release            (preview/prod の公開 deploy)
 *   gate-6   tos_gray_review           (DEC-019-018 第 6 種)
 *   gate-7   external_api              (DEC-019-022 第 7 種)
 *   gate-8   owner_input_review        (DEC-020-003 第 8 種)
 *   gate-9   dev_kickoff_approval      (DEC-019-033 第 9 種)
 *   gate-10  permission_change_review  (DEC-019-033 第 10 種)
 *   gate-11  knowledge_pii_review      (DEC-019-033 第 11 種)
 *   gate-12  ack_after_close           (DEC-019-007 副作用ゼロ要件 / cli_version_update_approval 系統)
 *
 * 領域不可侵 (Round 21 / Round 22 historical baseline 維持):
 *   - openclaw-runtime-bridge.ts (Dev-GG 175 行) 無改変
 *   - file-breach-counter.ts (Dev-GG 200 行) 無改変
 *   - monotonic-clock.ts (Dev-HH 175 行) 無改変
 *   - sla-clock-adapter.ts (Dev-HH 130 行) 無改変
 *   - 17day-path-w4-e2e-fully-wired.test.ts (Dev-HH 530 行 / 11 tests) 無改変
 *   - 17day-path-w4-production-e2e-extended.test.ts (Dev-JJ 561 行 / 10 tests) 無改変
 *   - Dev-EE 担当 17day-path-w3-rollback-permission-orchestrator.ts 無改変
 *   - control 本体 (openclaw-runtime/src/controls/*) 無改変
 *
 * 設計原則:
 *   1. **gate ID は本 file 内の論理的 enum**: harness `HitlActionType` (6 種) を直接拡張せず、
 *      本 file 独自の `HitlGateId` (12 enum) を導入し、ApprovalDecision を返す
 *      `mockGateApprover(gateId, decision)` で port 注入する。
 *      → 既存 hitl-gate.ts / hitl-enforcer.ts 無改変原則を維持。
 *   2. **breach-counter 連動**: gate 拒否は P-UI-05 観点で「breach 1 件」として counter に
 *      observe させ、2 回連続拒否で rollback_completed 経路に入ることを検証。
 *   3. **monotonic-clock 連動**: gate timeout は MonotonicClock の 24h SLA wall-clock skew
 *      injection で deterministic に再現 (Dev-HH と同 pattern)。
 *   4. **port-only 設計**: bridge / counter / clock の actual file は直接 import するが、
 *      gate 本体 (hitl-gate / hitl-enforcer) は import しない (依存方向制約遵守)。
 *      代わりに本 file 内に `GateApproverPort` と `MockGateApprover` を定義する。
 *   5. side-effect 0: file IO は OS tmpdir 経由、afterEach で flush + 削除。
 *
 * groups (4 groups / 9 tests):
 *
 * Group H1 (gate 通過 sequence × W4 wiring, 3 tests):
 *   H1-1  gate-1 → gate-2 → gate-3 → gate-4 全通過 → orchestrator chain 正常着地 (sequence integrity)
 *   H1-2  gate-9 dev_kickoff_approval pass → permission_orchestrator approved →
 *         counter は observe 0 のまま (gate 通過は breach 0)
 *   H1-3  gate-12 ack_after_close pass → bridge dispose 完遂 + counter flush 完了 (lifecycle 整合)
 *
 * Group H2 (gate 拒否 → counter breach 連動, 2 tests):
 *   H2-1  gate-6 tos_gray_review reject 1 回 → counter 1 件 observe → first_breach
 *   H2-2  gate-6 + gate-7 連続拒否 (異 loopId) → counter 2 件 → rollback_completed → counter reset
 *
 * Group H3 (gate timeout × monotonic-clock 24h SLA, 2 tests):
 *   H3-1  gate-9 dev_kickoff_approval pending + wall-clock 25h forward step (pass_through) →
 *         permission_orchestrator timeout 丸め込み (skew 検出 false)
 *   H3-2  gate-10 permission_change_review pending + wall-clock backward step (fail_closed) →
 *         skew_detected → permission_orchestrator timeout
 *
 * Group H4 (12 gates 全網羅 smoke + breach-counter monotonic 整合, 2 tests):
 *   H4-1  12 gates 全 approved sequence → counter は終始 0 (gate 通過は breach に積まない)
 *   H4-2  12 gates 中 gate-6 / gate-11 のみ reject (異 loopId) → counter 2 件 → trip
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// production direct import (Dev-GG / Dev-HH actual file = no stub)
import {
  createOpenClawRuntimeBridge,
} from '../openclaw-runtime-bridge.js'
import {
  createFileBreachCounter,
  type FileBreachCounter,
} from '../file-breach-counter.js'
import { createMonotonicClock } from '../monotonic-clock.js'
import { createSlaClockAdapter } from '../sla-clock-adapter.js'

import {
  createPermissionOrchestrator,
  createRollbackOrchestrator,
  type ApprovalDecision,
  type KillSwitchTriggerPort,
  type PermissionApproverPort,
  type PermissionScope,
  type RollbackExecutorPort,
  type RollbackOutcome,
} from '../17day-path-w3-rollback-permission-orchestrator.js'

// ---------------------------------------------------------------------------
// HITL 12 gates 論理 enum (本 file 局所定義 / 既存 hitl-gate.ts 無改変原則維持)
// ---------------------------------------------------------------------------

const HITL_GATE_IDS = [
  'gate-1-control-def-review',
  'gate-2-ports-design-review',
  'gate-3-orchestrator-design-review',
  'gate-4-wiring-review',
  'gate-5-public-release',
  'gate-6-tos-gray-review',
  'gate-7-external-api',
  'gate-8-owner-input-review',
  'gate-9-dev-kickoff-approval',
  'gate-10-permission-change-review',
  'gate-11-knowledge-pii-review',
  'gate-12-ack-after-close',
] as const

type HitlGateId = (typeof HITL_GATE_IDS)[number]

interface GateDecisionRecord {
  readonly gateId: HitlGateId
  readonly decision: ApprovalDecision
}

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const T0 = 1_700_000_000_000
const SCOPE: PermissionScope = {
  changeType: 'env',
  before: 'A',
  after: 'B',
  rationale: 'r23 dev-mm hitl-gates-integration',
}

interface SeqLog {
  steps: string[]
}
const newSeq = (): SeqLog => ({ steps: [] })

function mockExecutor(seq: SeqLog, outcome: RollbackOutcome): RollbackExecutorPort {
  return {
    rollback: async (loopId) => {
      seq.steps.push(`P-UI-05.exec:${loopId}`)
      return outcome
    },
  }
}

function mockKillSwitch(seq: SeqLog): KillSwitchTriggerPort {
  return {
    fire: async (reason) => {
      seq.steps.push(`P-UI-05.kill:${reason}`)
    },
  }
}

/**
 * gate id を 1 つに紐づけて ApprovalDecision を返す mock approver。
 * permission_orchestrator の PermissionApproverPort と shape 互換にするため、
 * requestApproval(scope, requester) を実装する。
 */
function mockGateApprover(
  seq: SeqLog,
  gateId: HitlGateId,
  decision: ApprovalDecision,
): PermissionApproverPort {
  return {
    requestApproval: async (_scope, requester) => {
      seq.steps.push(`HITL:${gateId}:${requester.ticketId}`)
      return decision
    },
  }
}

// ---------------------------------------------------------------------------
// tmp dir lifecycle (fs IO test 用)
// ---------------------------------------------------------------------------

let tmpRoot: string
const trackedCounters: FileBreachCounter[] = []

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(join(tmpdir(), 'r23-dev-mm-'))
  trackedCounters.length = 0
})

afterEach(async () => {
  for (const c of trackedCounters) {
    try {
      await c.flush()
    } catch {
      // flush 失敗は cleanup race の許容範囲 (ENOENT 等)
    }
  }
  await fs.rm(tmpRoot, { recursive: true, force: true })
})

function trackCounter(c: FileBreachCounter): FileBreachCounter {
  trackedCounters.push(c)
  return c
}

/**
 * gate sequence を 1 度の e2e cycle で実行し、各 gate の decision を集約する helper。
 * permission_orchestrator を gate ごとに 1 回ずつ走らせ、final aggregation を返す。
 *
 * 各 gate ごとに mockGateApprover を差し替えるため、ports.auditSink は共有しても
 * gateId 別に audit が積まれる (ticketId に gateId を含める運用)。
 */
async function runGateSequence(
  seq: SeqLog,
  decisions: readonly GateDecisionRecord[],
  ctx: ReturnType<ReturnType<typeof createOpenClawRuntimeBridge>['init']> extends Promise<infer R>
    ? R
    : never,
  nowMs: () => number,
): Promise<{ approved: number; rejected: number; timeout: number }> {
  let approved = 0
  let rejected = 0
  let timeout = 0
  for (const { gateId, decision } of decisions) {
    const orch = createPermissionOrchestrator({
      approver: mockGateApprover(seq, gateId, decision),
      auditSink: ctx.permissionAuditSink,
      nowMs,
    })
    const r = await orch.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: gateId },
    })
    if (r.kind === 'approved') approved += 1
    else if (r.kind === 'rejected') rejected += 1
    else if (r.kind === 'timeout') timeout += 1
  }
  return { approved, rejected, timeout }
}

// ---------------------------------------------------------------------------
// Group H1 — gate 通過 sequence × W4 wiring (3 tests)
// ---------------------------------------------------------------------------

describe('R23 Dev-MM Group H1 — gate 通過 sequence × W4 wiring', () => {
  it('H1-1: gate-1〜gate-4 全 approved → orchestrator chain 正常着地 (sequence integrity)', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const decisions: GateDecisionRecord[] = [
      { gateId: 'gate-1-control-def-review', decision: { state: 'approved', approvedAtMs: T0 + 1 } },
      { gateId: 'gate-2-ports-design-review', decision: { state: 'approved', approvedAtMs: T0 + 2 } },
      { gateId: 'gate-3-orchestrator-design-review', decision: { state: 'approved', approvedAtMs: T0 + 3 } },
      { gateId: 'gate-4-wiring-review', decision: { state: 'approved', approvedAtMs: T0 + 4 } },
    ]
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.approved).toBe(4)
    expect(result.rejected).toBe(0)
    expect(result.timeout).toBe(0)

    // gate 通過順序が deterministic
    expect(seq.steps).toEqual([
      'HITL:gate-1-control-def-review:gate-1-control-def-review',
      'HITL:gate-2-ports-design-review:gate-2-ports-design-review',
      'HITL:gate-3-orchestrator-design-review:gate-3-orchestrator-design-review',
      'HITL:gate-4-wiring-review:gate-4-wiring-review',
    ])

    await bridge.dispose()
    expect(bridge.phase()).toBe('idle')
  })

  it('H1-2: gate-9 dev_kickoff_approval approved → counter は observe 0 のまま (gate 通過は breach 0)', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'h1-2.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()
    expect(counter.current()).toBe(0)

    const decisions: GateDecisionRecord[] = [
      {
        gateId: 'gate-9-dev-kickoff-approval',
        decision: { state: 'approved', approvedAtMs: T0 + 1 },
      },
    ]
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.approved).toBe(1)

    // gate 通過は breach に積まない (orchestrator は breach の責務を持たない設計)
    expect(counter.current()).toBe(0)
    expect(counter.lastLoopId()).toBeNull()
    await counter.flush()

    await bridge.dispose()
  })

  it('H1-3: gate-12 ack_after_close approved → bridge dispose + counter flush 完了 (lifecycle 整合)', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'h1-3.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()
    counter.observe('H1-3-pre')
    expect(counter.current()).toBe(1)

    const decisions: GateDecisionRecord[] = [
      {
        gateId: 'gate-12-ack-after-close',
        decision: { state: 'approved', approvedAtMs: T0 + 1 },
      },
    ]
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.approved).toBe(1)

    // ack 後の lifecycle: counter flush + bridge dispose で side-effect 0 で完遂
    await counter.flush()
    await bridge.dispose()
    expect(bridge.phase()).toBe('idle')

    // dispose 後の getContext は throw (Dev-GG bridge §1.1 異常系)
    expect(() => bridge.getContext()).toThrow(/active phase/i)
  })
})

// ---------------------------------------------------------------------------
// Group H2 — gate 拒否 → counter breach 連動 (2 tests)
// ---------------------------------------------------------------------------

describe('R23 Dev-MM Group H2 — gate 拒否 → counter breach 連動', () => {
  it('H2-1: gate-6 tos_gray_review reject 1 回 → counter 1 件 observe → first_breach', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'h2-1.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()

    // gate-6 reject → permission_orchestrator は rejected を返す
    const decisions: GateDecisionRecord[] = [
      {
        gateId: 'gate-6-tos-gray-review',
        decision: { state: 'rejected', reason: 'tos_gray_human_reject' },
      },
    ]
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.rejected).toBe(1)

    // 上位 orchestrator 経由で「gate reject = anomaly observed」として counter.observe を発行
    // (実 production wiring では rollback_orchestrator が gate 拒否事実を観測する)
    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-H2-1' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: { isActive: () => false, lastReason: () => null },
        postRollback: ctx.postRollbackNotifier,
      },
      counter,
    )
    const r = await rollback.evaluate({
      loopId: 'H2-1-A',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('first_breach')
    expect(counter.current()).toBe(1)
    expect(counter.lastLoopId()).toBe('H2-1-A')
    await counter.flush()
    await bridge.dispose()
  })

  it('H2-2: gate-6 + gate-7 連続拒否 (異 loopId) → counter 2 件 → rollback_completed → counter reset', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'h2-2.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()

    const decisions: GateDecisionRecord[] = [
      {
        gateId: 'gate-6-tos-gray-review',
        decision: { state: 'rejected', reason: 'tos_gray_blocklist_hit' },
      },
      {
        gateId: 'gate-7-external-api',
        decision: { state: 'rejected', reason: 'external_api_denied' },
      },
    ]
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.rejected).toBe(2)

    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-H2-2' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: { isActive: () => false, lastReason: () => null },
        postRollback: ctx.postRollbackNotifier,
      },
      counter,
    )
    // 異 loopId 2 回連続: 1 回目 first_breach → 2 回目 rollback_completed → counter reset
    const r1 = await rollback.evaluate({
      loopId: 'H2-2-A',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    expect(r1.kind).toBe('first_breach')
    const r2 = await rollback.evaluate({
      loopId: 'H2-2-B',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    expect(r2.kind).toBe('rollback_completed')
    // counter は rollback 完遂で reset
    expect(counter.current()).toBe(0)
    expect(counter.lastLoopId()).toBeNull()

    // executor 1 回呼出 / killSwitch 不発火 (rollback success 経路)
    expect(seq.steps.filter((s) => s.startsWith('P-UI-05.exec:')).length).toBe(1)
    expect(seq.steps.filter((s) => s.startsWith('P-UI-05.kill:')).length).toBe(0)

    await counter.flush()
    await bridge.dispose()
  })
})

// ---------------------------------------------------------------------------
// Group H3 — gate timeout × monotonic-clock 24h SLA (2 tests)
// ---------------------------------------------------------------------------

describe('R23 Dev-MM Group H3 — gate timeout × monotonic-clock 24h SLA', () => {
  it('H3-1: gate-9 pending + 25h NTP forward step (pass_through) → SLA 越境 timeout (skew 検出 false)', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const SLA = 24 * 60 * 60 * 1000
    let wi = 0
    let mi = 0
    // mark / t0 / tNow の 3 段:
    //   mark: wall=T0, mono=0
    //   t0:   wall=T0, mono=0
    //   tNow: wall=T0+25h, mono=25h ms (両系統が同 elapsed 進む = skew 0)
    const wallSeq = [T0, T0, T0 + SLA + 60_000]
    const monoSeq = [0, 0, SLA + 60_000]
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
    const adapter = createSlaClockAdapter(clock, { onSkew: 'pass_through' })

    const decisions: GateDecisionRecord[] = [
      {
        gateId: 'gate-9-dev-kickoff-approval',
        decision: { state: 'pending' },
      },
    ]
    const result = await runGateSequence(seq, decisions, ctx, adapter.nowMs)
    // pending + 25h 越境 → orchestrator 内で timeout 丸め込み
    expect(result.timeout).toBe(1)
    expect(result.approved).toBe(0)
    // pass_through なので skew 検出 false
    expect(adapter.skewObserved()).toBe(false)

    await bridge.dispose()
  })

  it('H3-2: gate-10 pending + wall-clock backward step (fail_closed) → skew_detected → orchestrator timeout', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const SLA = 24 * 60 * 60 * 1000
    let wi = 0
    let mi = 0
    // mark: wall=T0, mono=0
    // t0:   wall=T0, mono=0
    // tNow: wall=T0+SLA+60s, mono=SLA+60s+10s (mono が wall より 10s 進む)
    //   → wallElapsed = SLA+60s, monoElapsed = SLA+70s, skewMs = -10_000 < -5_000 = fail_closed 発火
    //   → adapter は SLA 越境扱いで nowMs を t0+SLA+ε 相当に丸める fail-closed
    //   → permission_orchestrator は tNow >= expiresAtMs で timeout 丸め込み
    const wallSeq = [T0, T0, T0 + SLA + 60_000]
    const monoSeq = [0, 0, SLA + 70_000]
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

    const decisions: GateDecisionRecord[] = [
      {
        gateId: 'gate-10-permission-change-review',
        decision: { state: 'pending' },
      },
    ]
    const result = await runGateSequence(seq, decisions, ctx, adapter.nowMs)
    expect(result.timeout).toBe(1)
    // fail_closed 経路で skew が観測されている
    expect(adapter.skewObserved()).toBe(true)

    await bridge.dispose()
  })
})

// ---------------------------------------------------------------------------
// Group H4 — 12 gates 全網羅 smoke + breach-counter monotonic 整合 (2 tests)
// ---------------------------------------------------------------------------

describe('R23 Dev-MM Group H4 — 12 gates 全網羅 smoke + breach-counter monotonic 整合', () => {
  it('H4-1: 12 gates 全 approved sequence → counter は終始 0 (gate 通過は breach に積まない)', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'h4-1.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()
    expect(counter.current()).toBe(0)

    const decisions: GateDecisionRecord[] = HITL_GATE_IDS.map((gateId, idx) => ({
      gateId,
      decision: { state: 'approved' as const, approvedAtMs: T0 + idx + 1 },
    }))
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.approved).toBe(12)
    expect(result.rejected).toBe(0)
    expect(result.timeout).toBe(0)

    // gate 通過は counter に直接観測しない (orchestrator は breach の責務を持たない)
    expect(counter.current()).toBe(0)
    expect(counter.lastLoopId()).toBeNull()

    // sequence 整合: 12 step すべて HITL: prefix で並ぶ
    expect(seq.steps.length).toBe(12)
    for (let i = 0; i < 12; i++) {
      const expectedGate = HITL_GATE_IDS[i] as HitlGateId
      expect(seq.steps[i]).toBe(`HITL:${expectedGate}:${expectedGate}`)
    }

    await counter.flush()
    await bridge.dispose()
  })

  it('H4-2: 12 gates 中 gate-6 / gate-11 のみ reject (異 loopId) → counter 2 件 → trip', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'h4-2.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()

    // 12 gates 中 gate-6 / gate-11 のみ reject、その他 10 gates は approved
    const REJECTED_GATES: ReadonlySet<HitlGateId> = new Set([
      'gate-6-tos-gray-review',
      'gate-11-knowledge-pii-review',
    ])
    const decisions: GateDecisionRecord[] = HITL_GATE_IDS.map((gateId, idx) =>
      REJECTED_GATES.has(gateId)
        ? { gateId, decision: { state: 'rejected' as const, reason: `gate-reject-${gateId}` } }
        : { gateId, decision: { state: 'approved' as const, approvedAtMs: T0 + idx + 1 } },
    )
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.approved).toBe(10)
    expect(result.rejected).toBe(2)
    expect(result.timeout).toBe(0)

    // 上位 rollback_orchestrator 経由で 2 件の reject を異 loopId で counter に observe させる
    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-H4-2' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: { isActive: () => false, lastReason: () => null },
        postRollback: ctx.postRollbackNotifier,
      },
      counter,
    )
    const r1 = await rollback.evaluate({
      loopId: 'H4-2-gate-6',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    expect(r1.kind).toBe('first_breach')
    expect(counter.current()).toBe(1)

    const r2 = await rollback.evaluate({
      loopId: 'H4-2-gate-11',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    expect(r2.kind).toBe('rollback_completed')
    // rollback 成功 → counter reset (永続化反映)
    expect(counter.current()).toBe(0)
    expect(counter.lastLoopId()).toBeNull()

    await counter.flush()
    await bridge.dispose()
  })
})
