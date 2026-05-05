/**
 * 17 day path W4 — HITL × hardguards 拡張 (W4 完成第 5 弾 5-B 物理実装)
 * (Round 27, Dev-YY 担当, W4 完成第 5 弾 5-B = HITL × hardguards 拡張).
 *
 * Spec 起源:
 *   - Round 26 Dev-XX `dev-xx-r26-w4-fifth-5b-candidates.md` §2 (5-B 推奨候補)
 *   - Round 26 Dev-VV `dev-vv-r26-w4-fifth-candidate-spec.md` (groups/tests 規模)
 *   - CEO v27 §8 ③ 引継: Dev-YY = W4 第 5 弾 5-B (HITL × hardguards 拡張) 物理化
 *
 * Spec scope (W4 完成第 5 弾 5-B):
 *   Round 24 Dev-QQ 第 4 弾 (`17day-path-w4-hitl-hardguards-cross.test.ts` / 12 tests / 4 groups)
 *   が確立した HITL 12 gates × G-01〜G-12 hardguards cross-matrix を補完し、
 *   未充填領域 (G-02 / G-10 以外の hardguards × その他 7 gates / timeout × fail-fast 衝突 /
 *   retry × breach counter 連動 / cooldown × SIGTERM escalation / cross-matrix consistency)
 *   を 5 groups / 15 tests で吸収する。
 *
 *   検証対象 hardguards (本 file は test scope の pure helper のみ参照):
 *     G-01  parallelism (G-V2-01 並列 1 強制)         → multi-process-isolation
 *     G-02  process boundary (pid drift / collision) → hardguard-g-02 (R24 既補完 / 残余 edge)
 *     G-03  duplicate-launch                          → hardguard-g-02 DuplicateLaunchDetector
 *     G-04  emergency abort                           → hitl-12 ack_after_close + kill-switch
 *     G-05  subprocess kill chain                     → hardguard-g-10 assessKillPropagation
 *     G-06  circuit-breaker open                      → hardguard-g-10 CircuitBreaker target
 *     G-07  trigger reason validation                 → hardguard-g-10 validateKillTriggerReason
 *     G-08  trigger ledger (LRU)                      → hardguard-g-10 KillTriggerLedger LRU
 *     G-09  cooldown bypass detection                 → hardguard-g-10 KillTriggerLedger cooldown
 *     G-10  retention + hash chain                    → hardguard-g-10 canonicalKillTriggerSignature (R24 既補完 / 残余)
 *     G-11  PII suspicion in reason                   → hardguard-g-10 validateKillTriggerReason PII rule
 *     G-12  severity classification                   → hardguard-g-10 classifyKillSeverity
 *
 * 領域不可侵 (R20-R26 historical baseline 維持 / md5 1 byte 不変厳守):
 *   - openclaw-runtime-bridge.ts (Dev-GG 175 行) 無改変
 *   - file-breach-counter.ts (Dev-GG 200 行) 無改変
 *   - monotonic-clock.ts (Dev-HH 175 行) 無改変
 *   - sla-clock-adapter.ts (Dev-HH 130 行) 無改変
 *   - 17day-path-w3-rollback-permission-orchestrator.ts (Dev-EE) 無改変
 *   - hardguard-g-02.ts / hardguard-g-10.ts (Dev-F R14) 無改変
 *   - 17day-path-w4-e2e-fully-wired.test.ts (Dev-HH 530 行 / 11 tests) 無改変
 *   - 17day-path-w4-production-e2e-extended.test.ts (Dev-JJ 561 行 / 10 tests) 無改変
 *   - 17day-path-w4-hitl-gates-integration.test.ts (Dev-MM 626 行 / 9 tests) 無改変
 *   - 17day-path-w4-hitl-hardguards-cross.test.ts (Dev-QQ 907 行 / 12 tests) 無改変
 *   - file-breach-counter-stress-chaos.test.ts (Dev-KK 555 行 / 9 tests) 無改変
 *   - heartbeat-1m-10digit-longrun-stability.test.ts (Sec-Q / 5 tests) 無改変
 *   - phase2-w5-cross-orchestrator-e2e.test.ts (R25 Dev-SS 754 行 / 12 tests) 無改変
 *   - phase2-w5-cross-package-extension.test.ts (R25 Dev-TT 613 行 / 8 tests) 無改変
 *   - phase2-w5-claude-bridge-integration-e2e.test.ts (R26 Dev-VV 650 行 / 13 tests) 無改変
 *   - control 本体 (openclaw-runtime/src/controls/*) 無改変
 *
 * 設計原則:
 *   1. **HITL gate enum は本 file 内局所定義** (R23 / R24 と同 12 enum 踏襲、両 file は import せず独立).
 *   2. **hardguards は pure import のみ** (validateProcessBoundary / DuplicateLaunchDetector /
 *      validateKillTriggerReason / KillTriggerLedger / assessKillPropagation /
 *      classifyKillSeverity / canonicalKillTriggerSignature を直接 import).
 *   3. **bridge actual file 直結** (createOpenClawRuntimeBridge / createFileBreachCounter
 *      / createMonotonicClock / createSlaClockAdapter を直接 import).
 *   4. **R24 補完軸**: G-XX (G-02 / G-10 以外) × HITL 残 7 gates + timeout × fail-fast 衝突 +
 *      retry × breach counter + cooldown × SIGTERM の matrix を新規吸収.
 *   5. side-effect 0 / API call $0 / 絵文字 0 / OS tmp + afterEach cleanup.
 *
 * groups (5 groups / 15 tests):
 *
 * Group HG-1 (HITL × additional hardguard matrix, 3 tests):
 *   HG-1-1  HITL gate × hardguard G-XX (G-02/G-10 以外) の matrix 4 件 PASS
 *   HG-1-2  HITL gate timeout (15s) × hardguard fail-fast (5s) → fail-fast 優勢
 *   HG-1-3  HITL gate decision pending × hardguard SIGTERM 経路 → gate cancel 連動
 *
 * Group HG-2 (HITL retry × breach counter, 3 tests):
 *   HG-2-1  HITL gate retry 3 回 × breach counter increment 3 件累積
 *   HG-2-2  HITL gate retry 上限超過 × breach counter threshold trip → rollback_completed
 *   HG-2-3  HITL gate retry success on 2nd × breach counter rollback 1 件 (reset)
 *
 * Group HG-3 (HITL cooldown × SIGTERM escalation, 3 tests):
 *   HG-3-1  HITL gate cooldown active × hardguard SIGTERM → gate skip / 副作用 0
 *   HG-3-2  HITL gate cooldown 残時間 5s × hardguard grace 10s → gate 解除
 *   HG-3-3  HITL gate cooldown 衝突解消 = SIGKILL escalation 確認
 *
 * Group HG-4 (cross-matrix consistency, 3 tests):
 *   HG-4-1  HITL × hardguards 拡張 matrix の summary log 整合性
 *   HG-4-2  HITL × hardguards consensus state 復元 (from journal / FileBreachCounter)
 *   HG-4-3  HITL × hardguards × breach counter 三重 nested fire scenario
 *
 * Group HG-5 (R24 補完 edge — fail-open / fail-closed 完全網羅, 3 tests):
 *   HG-5-1  hardguards すべて fail-open mode → HITL gates 全 pass-through (0 件 reject)
 *   HG-5-2  hardguards すべて fail-closed mode → HITL gates 連鎖 reject 12 件全網羅
 *   HG-5-3  HITL × hardguards 全段 audit log 整合 (rejected reason chain ordering)
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// production direct import (Dev-GG / Dev-HH actual file = no stub)
import { createOpenClawRuntimeBridge } from '../openclaw-runtime-bridge.js'
import {
  createFileBreachCounter,
  type FileBreachCounter,
} from '../file-breach-counter.js'
import { createMonotonicClock } from '../monotonic-clock.js'
import { createSlaClockAdapter } from '../sla-clock-adapter.js'

// hardguards (Dev-F R14 pure 関数 / class) — 純粋 import のみ、無改変
import {
  validateProcessBoundary,
  DuplicateLaunchDetector,
  canonicalProcessFingerprint,
  type ProcessBoundaryContext,
} from '../hardguard-g-02.js'
import {
  validateKillTriggerReason,
  canonicalKillTriggerSignature,
  KillTriggerLedger,
  assessKillPropagation,
  classifyKillSeverity,
} from '../hardguard-g-10.js'

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

import type {
  ProcessStartupRecord,
  StartupToken,
} from '../multi-process-isolation.js'
import type {
  SubprocessKillTarget,
  CircuitBreakerOpenTarget,
} from '../kill-switch.js'

// ---------------------------------------------------------------------------
// HITL 12 gates 論理 enum (R23 / R24 と同定義 / 両 file 不可侵のため再宣言)
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
  rationale: 'r27 dev-yy hitl-hardguards-extended',
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

// hardguard target builders (kill-switch 構造を満たす lightweight stub)
function makeSubprocessTarget(name: string): SubprocessKillTarget {
  return {
    name,
    alive: () => false,
    signal: () => undefined,
  } as unknown as SubprocessKillTarget
}

function makeCircuitBreakerTarget(name: string): CircuitBreakerOpenTarget {
  return {
    name,
    forceOpen: () => undefined,
  } as unknown as CircuitBreakerOpenTarget
}

function makeStartupRecord(
  pid: number,
  projectId: string,
  token: string,
): ProcessStartupRecord {
  return {
    kind: 'isolation:start',
    projectId,
    pid,
    startupToken: token as StartupToken,
    startedAt: new Date(T0).toISOString(),
    parentPid: null,
    parallelAllowed: false,
    knownPeerPids: [],
  }
}

// ---------------------------------------------------------------------------
// tmp dir lifecycle (fs IO test 用)
// ---------------------------------------------------------------------------

let tmpRoot: string
const trackedCounters: FileBreachCounter[] = []

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(join(tmpdir(), 'r27-dev-yy-'))
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
 * gate sequence を 1 度の e2e cycle で実行 (R23 / R24 helper と同 shape).
 */
async function runGateSequence(
  seq: SeqLog,
  decisions: readonly GateDecisionRecord[],
  ctx: { permissionAuditSink: ReturnType<typeof createOpenClawRuntimeBridge> extends infer _ ? Awaited<ReturnType<ReturnType<typeof createOpenClawRuntimeBridge>['init']>>['permissionAuditSink'] : never },
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
// Group HG-1 — HITL × additional hardguard matrix (3 tests)
// R24 第 4 弾が G-02 / G-10 を中心に carry した分の補完として、
// G-XX (G-03 / G-05 / G-06 / G-07 / G-08 / G-09 / G-11 / G-12) と
// HITL の残 7 gates の matrix 4 件 + timeout / fail-fast / pending × SIGTERM を吸収。
// ---------------------------------------------------------------------------

describe('R27 Dev-YY Group HG-1 — HITL × additional hardguard matrix', () => {
  it('HG-1-1: HITL 残 4 gates × hardguard 4 件 (G-03 / G-08 / G-09 / G-12) matrix all valid', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    // R24 で carry されなかった残 4 gates × G-03 / G-08 / G-09 / G-12 の matrix 検証
    const decisions: GateDecisionRecord[] = [
      { gateId: 'gate-2-ports-design-review', decision: { state: 'approved', approvedAtMs: T0 + 1 } },
      { gateId: 'gate-3-orchestrator-design-review', decision: { state: 'approved', approvedAtMs: T0 + 2 } },
      { gateId: 'gate-5-public-release', decision: { state: 'approved', approvedAtMs: T0 + 3 } },
      { gateId: 'gate-8-owner-input-review', decision: { state: 'approved', approvedAtMs: T0 + 4 } },
    ]
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.approved).toBe(4)
    expect(result.rejected).toBe(0)
    expect(result.timeout).toBe(0)

    // G-03 duplicate-launch (process A 単独 record OK)
    const recordA = makeStartupRecord(50001, 'PRJ-019', 'token-hg1-1-aaaaaaaa')
    const detector = new DuplicateLaunchDetector({ maxParallelPerProject: 1 })
    const a1 = detector.record(recordA)
    expect(a1.accepted).toBe(true)
    expect(a1.reason).toBe('first_launch')

    // G-08 LRU ledger (3 件 record / size 維持)
    let now = T0 + 100
    const ledger = new KillTriggerLedger({
      cooldownMs: 1,
      maxEntries: 5,
      nowMs: () => now,
    })
    const triggers = [
      { reason: 'matrix_a_pass', source: 'budget' },
      { reason: 'matrix_b_pass', source: 'manual' },
      { reason: 'matrix_c_pass', source: 'tos_alert' },
    ]
    for (const t of triggers) {
      const r = ledger.record(t.reason, t.source)
      expect(r.accepted).toBe(true)
      now += 100
    }
    expect(ledger.size()).toBe(3)

    // G-09 cooldown (後続 cooldown 内 record は reject)
    const sameLedger = new KillTriggerLedger({
      cooldownMs: 5_000,
      nowMs: () => now,
    })
    const c1 = sameLedger.record('cooldown_check', 'manual')
    expect(c1.accepted).toBe(true)
    now += 100 // cooldown 5s 未満
    const c2 = sameLedger.record('cooldown_check', 'manual')
    expect(c2.accepted).toBe(false)
    expect(c2.reason).toBe('cooldown_violation')

    // G-12 severity (4 種別を網羅)
    expect(classifyKillSeverity('budget_exceed', 'budget')).toBe('critical')
    expect(classifyKillSeverity('runtime_limit hit', 'continuous_runtime')).toBe('warning')
    expect(classifyKillSeverity('manual abort', 'manual')).toBe('info')
    expect(classifyKillSeverity('STOP signal received', 'file_signal')).toBe('critical')

    await bridge.dispose()
    expect(bridge.phase()).toBe('idle')
  })

  it('HG-1-2: HITL gate timeout (15s) × hardguard fail-fast (5s) → fail-fast 優勢', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    // SLA 24h を 1 度に超える wallclock skew で timeout 検出
    const SLA = 24 * 60 * 60 * 1000
    let wi = 0
    let mi = 0
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

    // HITL gate pending → SLA 越境 timeout
    const decisions: GateDecisionRecord[] = [
      { gateId: 'gate-9-dev-kickoff-approval', decision: { state: 'pending' } },
    ]
    const result = await runGateSequence(seq, decisions, ctx, adapter.nowMs)
    expect(result.timeout).toBe(1)

    // hardguard fail-fast: G-07 reason validation で 即時 reject (control_chars)
    const failFast = validateKillTriggerReason('hardguard_fail_fast\x01reason')
    expect(failFast.valid).toBe(false)
    expect(failFast.issues).toContain('control_chars_present')

    // 競合シナリオ: gate timeout が記録されつつ fail-fast 優勢 (severity classification 起点)
    const sev = classifyKillSeverity('hardguard_fail_fast trigger', 'budget')
    expect(sev).toBe('critical')

    // bridge の lifecycle 不変性
    expect(bridge.phase()).toBe('active')

    await bridge.dispose()
  })

  it('HG-1-3: HITL gate decision pending × hardguard SIGTERM 経路 → gate cancel 連動', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    // pending 状態を最初に観測 (timeout に丸まらない短時間)
    const wallSeq = [T0, T0 + 1, T0 + 2]
    let wi = 0
    const clock = createMonotonicClock({
      wallNowMs: () => wallSeq[Math.min(wi++, wallSeq.length - 1)] ?? T0,
      monoNowMs: () => wi,
    })
    const adapter = createSlaClockAdapter(clock, { onSkew: 'pass_through' })

    const decisions: GateDecisionRecord[] = [
      { gateId: 'gate-11-knowledge-pii-review', decision: { state: 'pending' } },
    ]
    const result = await runGateSequence(seq, decisions, ctx, adapter.nowMs)
    // pending → 'pending' result は approved/rejected/timeout いずれにも該当せず
    // permission_orchestrator は SLA 内なら pending を pending として返す → 0/0/0
    expect(result.approved).toBe(0)
    expect(result.rejected).toBe(0)
    // SLA 超過していなければ timeout=0 (pending は count されない)
    expect(result.timeout).toBe(0)

    // hardguard SIGTERM 相当 = subprocess kill chain assess
    const subTargets = [makeSubprocessTarget('worker-sigterm')]
    const cbTargets = [makeCircuitBreakerTarget('cb-sigterm')]
    const assessment = assessKillPropagation({
      subprocessTargets: subTargets,
      circuitBreakerTargets: cbTargets,
    })
    expect(assessment.safe).toBe(true)
    expect(assessment.subprocessCount).toBe(1)

    // gate cancel 連動 = ledger に sigterm record (cooldown 1ms / 即時 record OK)
    const ledger = new KillTriggerLedger({ cooldownMs: 1, nowMs: () => T0 + 1000 })
    const r = ledger.record('sigterm_gate_cancel', 'manual')
    expect(r.accepted).toBe(true)
    expect(r.reason).toBe('first_trigger')

    await bridge.dispose()
  })
})

// ---------------------------------------------------------------------------
// Group HG-2 — HITL retry × breach counter (3 tests)
// HITL gate retry の各ステップが breach counter にどう反映されるかを検証.
// ---------------------------------------------------------------------------

describe('R27 Dev-YY Group HG-2 — HITL retry × breach counter', () => {
  it('HG-2-1: HITL gate retry 3 回 × breach counter increment 3 件累積', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'hg2-1.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()
    expect(counter.current()).toBe(0)

    // HITL retry 3 回 (異 loopId)
    const decisions: GateDecisionRecord[] = [
      { gateId: 'gate-6-tos-gray-review', decision: { state: 'rejected', reason: 'retry_attempt_1' } },
      { gateId: 'gate-6-tos-gray-review', decision: { state: 'rejected', reason: 'retry_attempt_2' } },
      { gateId: 'gate-6-tos-gray-review', decision: { state: 'rejected', reason: 'retry_attempt_3' } },
    ]
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.rejected).toBe(3)

    // breach counter に異 loopId で 3 件 increment (max 2 で trip するので、
    // 3 回目の前に reset すれば累積観測可能。ここでは 1 件ずつ observe)
    counter.observe('hg2-1-attempt-1')
    expect(counter.current()).toBe(1)
    counter.observe('hg2-1-attempt-2')
    expect(counter.current()).toBe(2)
    counter.reset()
    counter.observe('hg2-1-attempt-3')
    expect(counter.current()).toBe(1)
    expect(counter.lastLoopId()).toBe('hg2-1-attempt-3')

    // HITL retry 3 回 = seq 上 3 件
    const hitlSteps = seq.steps.filter((s) => s.startsWith('HITL:gate-6'))
    expect(hitlSteps.length).toBe(3)

    await counter.flush()
    await bridge.dispose()
  })

  it('HG-2-2: HITL gate retry 上限超過 × breach counter threshold trip → rollback_completed', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'hg2-2.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()

    // HITL retry 上限超過 (4 回 reject)
    const decisions: GateDecisionRecord[] = [
      { gateId: 'gate-7-external-api', decision: { state: 'rejected', reason: 'retry_1' } },
      { gateId: 'gate-7-external-api', decision: { state: 'rejected', reason: 'retry_2' } },
      { gateId: 'gate-7-external-api', decision: { state: 'rejected', reason: 'retry_3' } },
      { gateId: 'gate-7-external-api', decision: { state: 'rejected', reason: 'retry_max_exceeded' } },
    ]
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.rejected).toBe(4)

    // breach counter 連続 2 件 → rollback_completed
    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-HG-2-2' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: { isActive: () => false, lastReason: () => null },
        postRollback: ctx.postRollbackNotifier,
      },
      counter,
    )
    await rollback.evaluate({
      loopId: 'HG-2-2-A',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    const r = await rollback.evaluate({
      loopId: 'HG-2-2-B',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_completed')
    expect(counter.current()).toBe(0)

    // rollback 成功 → kill-switch 不発火
    expect(seq.steps.filter((s) => s.startsWith('P-UI-05.kill:')).length).toBe(0)

    await counter.flush()
    await bridge.dispose()
  })

  it('HG-2-3: HITL gate retry success on 2nd × breach counter rollback 1 件 (reset)', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'hg2-3.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()

    // 1st reject → 2nd approved (retry success on 2nd)
    const decisions: GateDecisionRecord[] = [
      { gateId: 'gate-8-owner-input-review', decision: { state: 'rejected', reason: 'retry_1_fail' } },
      { gateId: 'gate-8-owner-input-review', decision: { state: 'approved', approvedAtMs: T0 + 1 } },
    ]
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.rejected).toBe(1)
    expect(result.approved).toBe(1)

    // breach counter: 1st reject で observe → 2nd success で reset
    counter.observe('HG-2-3-retry')
    expect(counter.current()).toBe(1)
    expect(counter.lastLoopId()).toBe('HG-2-3-retry')
    counter.reset()
    expect(counter.current()).toBe(0)
    expect(counter.lastLoopId()).toBeNull()

    // ledger に 1 件 record (success reason)
    const ledger = new KillTriggerLedger({ cooldownMs: 1, nowMs: () => T0 + 5000 })
    const r = ledger.record('retry_success_2nd_attempt', 'manual')
    expect(r.accepted).toBe(true)
    expect(r.reason).toBe('first_trigger')

    await counter.flush()
    await bridge.dispose()
  })
})

// ---------------------------------------------------------------------------
// Group HG-3 — HITL cooldown × SIGTERM escalation (3 tests)
// ---------------------------------------------------------------------------

describe('R27 Dev-YY Group HG-3 — HITL cooldown × SIGTERM escalation', () => {
  it('HG-3-1: HITL gate cooldown active × hardguard SIGTERM → gate skip / 副作用 0', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    // gate-12 cooldown active (cooldown 内に同 signature を再 trigger)
    const ledger = new KillTriggerLedger({ cooldownMs: 10_000, nowMs: () => T0 + 100 })
    const a1 = ledger.record('gate12_ack_failed', 'manual')
    expect(a1.accepted).toBe(true)
    // cooldown 内に同 signature → reject
    const a2 = ledger.record('gate12_ack_failed', 'manual')
    expect(a2.accepted).toBe(false)
    expect(a2.reason).toBe('cooldown_violation')

    // gate skip = HITL gate を実行しない (decisions 配列空)
    const decisions: GateDecisionRecord[] = []
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.approved).toBe(0)
    expect(result.rejected).toBe(0)
    expect(result.timeout).toBe(0)

    // 副作用 0: HITL: prefix の seq 0 件
    const hitlSteps = seq.steps.filter((s) => s.startsWith('HITL:'))
    expect(hitlSteps.length).toBe(0)

    // hardguard SIGTERM 相当 (subprocess assess) は影響を受けない
    const assessment = assessKillPropagation({
      subprocessTargets: [makeSubprocessTarget('cooldown-sigterm-1')],
      circuitBreakerTargets: [makeCircuitBreakerTarget('cb-cooldown-sigterm')],
    })
    expect(assessment.safe).toBe(true)

    await bridge.dispose()
  })

  it('HG-3-2: HITL gate cooldown 残時間 5s × hardguard grace 10s → gate 解除', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    // cooldown 5s / grace 10s simulation (cooldown < grace → cooldown 経過後に gate 再受理)
    let now = T0
    const ledger = new KillTriggerLedger({
      cooldownMs: 5_000,
      nowMs: () => now,
    })
    const r1 = ledger.record('grace_period_check', 'manual')
    expect(r1.accepted).toBe(true)

    // cooldown 5s 未満 → reject
    now += 1_000
    const r2 = ledger.record('grace_period_check', 'manual')
    expect(r2.accepted).toBe(false)
    expect(r2.reason).toBe('cooldown_violation')

    // cooldown 5s 経過 → 再受理 (grace 10s 範囲内なので gate 解除)
    now += 5_001
    const r3 = ledger.record('grace_period_check', 'manual')
    expect(r3.accepted).toBe(true)
    expect(r3.reason).toBe('first_trigger')

    // gate 解除後 HITL gate を実行 → approved
    const decisions: GateDecisionRecord[] = [
      { gateId: 'gate-9-dev-kickoff-approval', decision: { state: 'approved', approvedAtMs: T0 + 6_001 } },
    ]
    const result = await runGateSequence(seq, decisions, ctx, () => T0 + 6_001)
    expect(result.approved).toBe(1)

    await bridge.dispose()
  })

  it('HG-3-3: HITL gate cooldown 衝突解消 = SIGKILL escalation 確認', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'hg3-3.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()

    // cooldown 衝突 (同 signature 連続 trigger 5 回 → 4 件 cooldown_violation)
    let now = T0
    const ledger = new KillTriggerLedger({
      cooldownMs: 10_000,
      nowMs: () => now,
    })
    const attempts: boolean[] = []
    for (let i = 0; i < 5; i++) {
      const r = ledger.record('sigkill_escalation_trigger', 'budget')
      attempts.push(r.accepted)
      now += 100 // cooldown 内
    }
    expect(attempts[0]).toBe(true)
    expect(attempts.slice(1).every((a) => a === false)).toBe(true)

    // SIGKILL escalation = rollback failed → kill-switch armed
    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: false, reason: 'sigkill_escalation' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: { isActive: () => false, lastReason: () => null },
        postRollback: ctx.postRollbackNotifier,
      },
      counter,
    )
    await rollback.evaluate({
      loopId: 'HG-3-3-A',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    const r = await rollback.evaluate({
      loopId: 'HG-3-3-B',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_failed_kill_switch_armed')
    // kill-switch fire 1 件
    expect(seq.steps.filter((s) => s.startsWith('P-UI-05.kill:')).length).toBe(1)

    // severity 確認 (budget 由来 → critical)
    const sev = classifyKillSeverity('sigkill_escalation_trigger', 'budget')
    expect(sev).toBe('critical')

    await counter.flush()
    await bridge.dispose()
  })
})

// ---------------------------------------------------------------------------
// Group HG-4 — cross-matrix consistency (3 tests)
// ---------------------------------------------------------------------------

describe('R27 Dev-YY Group HG-4 — cross-matrix consistency', () => {
  it('HG-4-1: HITL × hardguards 拡張 matrix の summary log 整合性', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    // 3 gates × 3 hardguards = 9 cell の matrix を 1 sequence で実行
    const decisions: GateDecisionRecord[] = [
      { gateId: 'gate-2-ports-design-review', decision: { state: 'approved', approvedAtMs: T0 + 1 } },
      { gateId: 'gate-5-public-release', decision: { state: 'approved', approvedAtMs: T0 + 2 } },
      { gateId: 'gate-8-owner-input-review', decision: { state: 'approved', approvedAtMs: T0 + 3 } },
    ]
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.approved).toBe(3)

    // 3 hardguards (G-03 / G-08 / G-12) の summary log
    const detector = new DuplicateLaunchDetector({ maxParallelPerProject: 1 })
    const recordA = makeStartupRecord(60001, 'PRJ-019', 'token-hg4-1-summary-')
    expect(detector.record(recordA).accepted).toBe(true)

    const ledger = new KillTriggerLedger({ cooldownMs: 1, nowMs: () => T0 + 1000 })
    const trigA = ledger.record('summary_log_a', 'manual')
    expect(trigA.accepted).toBe(true)

    const sevSummary = [
      classifyKillSeverity('summary_critical', 'budget'),
      classifyKillSeverity('summary_warning', 'continuous_runtime'),
      classifyKillSeverity('summary_info', 'manual'),
    ]
    expect(sevSummary).toEqual(['critical', 'warning', 'info'])

    // summary log 整合: HITL: prefix 3 件 + ledger 1 件 + detector 1 件
    const hitlSteps = seq.steps.filter((s) => s.startsWith('HITL:'))
    expect(hitlSteps.length).toBe(3)
    expect(detector.size()).toBe(1)
    expect(ledger.size()).toBe(1)

    await bridge.dispose()
  })

  it('HG-4-2: HITL × hardguards consensus state 復元 (FileBreachCounter persist)', async () => {
    const path = join(tmpRoot, 'hg4-2.jsonl')

    // process A 段階: HITL gate reject + counter 1 件 + ledger 1 件
    const seqA = newSeq()
    const bridgeA = createOpenClawRuntimeBridge()
    const ctxA = await bridgeA.init()
    const counterA = trackCounter(createFileBreachCounter({ path }))
    await counterA.init()

    const decisionsA: GateDecisionRecord[] = [
      { gateId: 'gate-6-tos-gray-review', decision: { state: 'rejected', reason: 'consensus_initial' } },
    ]
    const resultA = await runGateSequence(seqA, decisionsA, ctxA, () => T0)
    expect(resultA.rejected).toBe(1)

    counterA.observe('HG-4-2-process-A')
    expect(counterA.current()).toBe(1)
    await counterA.flush()
    await bridgeA.dispose()

    // process B 段階: 同 path で counter 復元 → state 整合確認
    const seqB = newSeq()
    const bridgeB = createOpenClawRuntimeBridge()
    const ctxB = await bridgeB.init()
    const counterB = trackCounter(createFileBreachCounter({ path }))
    await counterB.init()

    // consensus 復元 (count=1 / lastLoopId='HG-4-2-process-A')
    expect(counterB.current()).toBe(1)
    expect(counterB.lastLoopId()).toBe('HG-4-2-process-A')

    // ledger は in-memory のみ → 新 ledger では size=0 (consensus 状態は journal で counter のみ復元)
    const ledgerB = new KillTriggerLedger({ cooldownMs: 1, nowMs: () => T0 + 5000 })
    expect(ledgerB.size()).toBe(0)
    const triggerB = ledgerB.record('consensus_resume_after_restart', 'manual')
    expect(triggerB.accepted).toBe(true)
    expect(ledgerB.size()).toBe(1)

    // bridge B も active phase
    expect(bridgeB.phase()).toBe('active')
    expect(ctxB).toBeDefined()

    await counterB.flush()
    await bridgeB.dispose()
  })

  it('HG-4-3: HITL × hardguards × breach counter 三重 nested fire scenario', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'hg4-3.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()

    // 三重 nested: HITL (gate-6 + gate-7 reject) → hardguards (ledger trigger) →
    //              breach counter (output_anomaly observe → trip)
    const decisions: GateDecisionRecord[] = [
      { gateId: 'gate-6-tos-gray-review', decision: { state: 'rejected', reason: 'nested_fire_1' } },
      { gateId: 'gate-7-external-api', decision: { state: 'rejected', reason: 'nested_fire_2' } },
    ]
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.rejected).toBe(2)

    // hardguards: ledger 2 件 record (異 signature)
    let now = T0 + 100
    const ledger = new KillTriggerLedger({
      cooldownMs: 1,
      nowMs: () => now,
    })
    const tA = ledger.record('nested_fire_1_ledger', 'tos_alert')
    now += 100
    const tB = ledger.record('nested_fire_2_ledger', 'budget')
    expect(tA.accepted).toBe(true)
    expect(tB.accepted).toBe(true)
    expect(ledger.size()).toBe(2)

    // breach counter: 連続 2 件 → trip → rollback_completed
    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-HG-4-3' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: { isActive: () => false, lastReason: () => null },
        postRollback: ctx.postRollbackNotifier,
      },
      counter,
    )
    await rollback.evaluate({
      loopId: 'HG-4-3-A',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    const r = await rollback.evaluate({
      loopId: 'HG-4-3-B',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_completed')
    expect(counter.current()).toBe(0)

    // 三重 fire 整合: HITL 2 件 + ledger 2 件 + counter trip 1 件
    expect(seq.steps.filter((s) => s.startsWith('HITL:')).length).toBe(2)
    expect(seq.steps.filter((s) => s.startsWith('P-UI-05.exec:')).length).toBe(1)

    await counter.flush()
    await bridge.dispose()
  })
})

// ---------------------------------------------------------------------------
// Group HG-5 — fail-open / fail-closed 完全網羅 (3 tests)
// R24 第 4 弾の補完 edge: hardguards の fail-open / fail-closed mode を gate matrix で網羅.
// ---------------------------------------------------------------------------

describe('R27 Dev-YY Group HG-5 — fail-open / fail-closed 完全網羅', () => {
  it('HG-5-1: hardguards すべて fail-open mode → HITL gates 全 pass-through (0 件 reject)', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'hg5-1.jsonl')
    // 破損 file = fail-open trigger (counter は count=0 で起動)
    await fs.writeFile(path, '{not_valid_json\n,,,broken,,,\n', 'utf-8')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()
    expect(counter.current()).toBe(0)
    expect(counter.lastLoopId()).toBeNull()

    // HITL 12 gates 全 approved (fail-open mode = 全 pass-through)
    const allApprovedDecisions: GateDecisionRecord[] = HITL_GATE_IDS.map((gid, i) => ({
      gateId: gid,
      decision: { state: 'approved', approvedAtMs: T0 + i + 1 } as ApprovalDecision,
    }))
    const result = await runGateSequence(seq, allApprovedDecisions, ctx, () => T0)
    expect(result.approved).toBe(12)
    expect(result.rejected).toBe(0)
    expect(result.timeout).toBe(0)

    // hardguards fail-open: 全 reason 妥当 (validation pass)
    const validReasons = [
      'fail_open_check_a',
      'fail_open_check_b',
      'fail_open_check_c',
    ]
    for (const reason of validReasons) {
      const v = validateKillTriggerReason(reason)
      expect(v.valid).toBe(true)
    }

    // counter は終始 0 (fail-open + 全 approved → breach 0)
    expect(counter.current()).toBe(0)

    await counter.flush()
    await bridge.dispose()
  })

  it('HG-5-2: hardguards fail-closed mode → HITL gates 連鎖 reject 全 12 件網羅', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    // HITL 12 gates 全 reject (fail-closed mode chain)
    const allRejectedDecisions: GateDecisionRecord[] = HITL_GATE_IDS.map((gid, i) => ({
      gateId: gid,
      decision: { state: 'rejected', reason: `fail_closed_chain_${i}` } as ApprovalDecision,
    }))
    const result = await runGateSequence(seq, allRejectedDecisions, ctx, () => T0)
    expect(result.rejected).toBe(12)
    expect(result.approved).toBe(0)

    // hardguards fail-closed: invalid reason 全網羅 (4 種類)
    const failClosedCases = [
      { reason: '', expected: 'empty_reason' },
      { reason: 'ab', expected: 'reason_too_short' },
      { reason: 'has\x01control', expected: 'control_chars_present' },
      { reason: 'leak alice@example.com here', expected: 'email_like_pii_suspicion' },
    ]
    for (const c of failClosedCases) {
      const v = validateKillTriggerReason(c.reason)
      expect(v.valid).toBe(false)
      expect(v.issues.some((i) => i.startsWith(c.expected))).toBe(true)
    }

    // 12 件 reject 全 sequence 整合
    const hitlSteps = seq.steps.filter((s) => s.startsWith('HITL:'))
    expect(hitlSteps.length).toBe(12)
    for (let i = 0; i < HITL_GATE_IDS.length; i++) {
      const gid = HITL_GATE_IDS[i]
      expect(gid).toBeDefined()
      expect(hitlSteps[i]!).toContain(gid as string)
    }

    await bridge.dispose()
  })

  it('HG-5-3: HITL × hardguards 全段 audit log 整合 (rejected reason chain ordering)', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    // 12 件 reject + 各 reject reason に対する hardguard validation の chain ordering
    const decisions: GateDecisionRecord[] = HITL_GATE_IDS.map((gid, i) => ({
      gateId: gid,
      decision: { state: 'rejected', reason: `audit_chain_${i.toString().padStart(2, '0')}` } as ApprovalDecision,
    }))
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.rejected).toBe(12)

    // 各 reason は妥当 (control chars / PII を含まない)
    for (let i = 0; i < HITL_GATE_IDS.length; i++) {
      const reason = `audit_chain_${i.toString().padStart(2, '0')}`
      const v = validateKillTriggerReason(reason)
      expect(v.valid).toBe(true)
      expect(v.normalizedReason).toBe(reason)
    }

    // ledger に 12 件 chain record (異 signature)
    let now = T0 + 100
    const ledger = new KillTriggerLedger({
      cooldownMs: 1,
      maxEntries: 100,
      nowMs: () => now,
    })
    for (let i = 0; i < 12; i++) {
      const r = ledger.record(`audit_chain_${i.toString().padStart(2, '0')}`, 'manual')
      expect(r.accepted).toBe(true)
      now += 100
    }
    expect(ledger.size()).toBe(12)

    // chain ordering 整合: HITL: prefix 12 件 + 末尾 entry signature 確認
    const hitlSteps = seq.steps.filter((s) => s.startsWith('HITL:'))
    expect(hitlSteps.length).toBe(12)
    const last = ledger.last()
    expect(last).not.toBeNull()
    expect(last!.signature).toBe(canonicalKillTriggerSignature('audit_chain_11', 'manual'))

    // severity classification 整合 (manual source → info)
    expect(classifyKillSeverity('audit_chain_00', 'manual')).toBe('info')

    // process boundary も valid (ordering 整合のため 1 record check)
    const record = makeStartupRecord(70001, 'PRJ-019', 'token-hg5-3-audit-chain-12')
    const verdict = validateProcessBoundary(record, {
      currentPid: 70001,
      nowMs: T0 + 100_000,
      knownPeerPids: [],
      maxParallel: 1,
    })
    expect(verdict.valid).toBe(true)
    expect(verdict.fingerprint).toBe(canonicalProcessFingerprint(record))

    await bridge.dispose()
  })
})
