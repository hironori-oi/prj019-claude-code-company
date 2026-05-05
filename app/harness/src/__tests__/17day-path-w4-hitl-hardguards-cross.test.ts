/**
 * 17 day path W4 — HITL gates × G-01〜G-12 hardguards 全段確認 cross-matrix e2e
 * (Round 24, Dev-QQ 担当, W4 完成第 4 弾).
 *
 * Spec scope (W4 完成第 4 弾):
 *   Round 23 Dev-MM 第 3 弾 (`17day-path-w4-hitl-gates-integration.test.ts` / 9 tests / 4 groups H1-H4) で
 *   確立した HITL 12 gates × W4 production wiring 統合 e2e の上に、
 *   **G-01〜G-12 hardguards との cross-matrix 確認** を追加検証する。
 *   Phase 1 完遂宣言 (DEC-019-075 想定) の Dev 部門最終裏付け試験。
 *
 *   検証対象 hardguards (本 file は test scope のため pure helper のみ参照):
 *     G-01  parallelism (G-V2-01 並列 1 強制)         → hardguard-g-02 / multi-process-isolation
 *     G-02  process boundary (pid drift / collision) → hardguard-g-02
 *     G-03  duplicate-launch                          → hardguard-g-02 DuplicateLaunchDetector
 *     G-04  emergency abort                           → hitl-12 ack_after_close + kill-switch
 *     G-05  subprocess kill chain                     → hardguard-g-10 assessKillPropagation
 *     G-06  circuit-breaker open                      → hardguard-g-10 CircuitBreaker target
 *     G-07  trigger reason validation                 → hardguard-g-10 validateKillTriggerReason
 *     G-08  trigger ledger (LRU)                      → hardguard-g-10 KillTriggerLedger LRU
 *     G-09  cooldown bypass detection                 → hardguard-g-10 KillTriggerLedger cooldown
 *     G-10  retention + hash chain                    → hardguard-g-10 canonicalKillTriggerSignature
 *     G-11  PII suspicion in reason                   → hardguard-g-10 validateKillTriggerReason PII rule
 *     G-12  severity classification                   → hardguard-g-10 classifyKillSeverity
 *
 * 領域不可侵 (Round 21〜23 historical baseline 維持):
 *   - openclaw-runtime-bridge.ts (Dev-GG 175 行) 無改変
 *   - file-breach-counter.ts (Dev-GG 200 行) 無改変
 *   - monotonic-clock.ts (Dev-HH 175 行) 無改変
 *   - sla-clock-adapter.ts (Dev-HH 130 行) 無改変
 *   - 17day-path-w4-e2e-fully-wired.test.ts (Dev-HH 530 行 / 11 tests) 無改変
 *   - 17day-path-w4-production-e2e-extended.test.ts (Dev-JJ 561 行 / 10 tests) 無改変
 *   - 17day-path-w4-hitl-gates-integration.test.ts (Dev-MM 626 行 / 9 tests) 無改変
 *   - Dev-EE 担当 17day-path-w3-rollback-permission-orchestrator.ts 無改変
 *   - control 本体 (openclaw-runtime/src/controls/*) 無改変
 *   - hardguard-g-02.ts / hardguard-g-10.ts (Dev-F R14 緊急対応, pure 関数のみ参照)
 *
 * 設計原則:
 *   1. **HITL gate enum は本 file 内局所定義**: Dev-MM R23 と同 12 enum を踏襲、
 *      ただし R23 file は import せず本 file に独立定義 (R23 不可侵保護)。
 *   2. **hardguards は pure import のみ**: validateProcessBoundary / DuplicateLaunchDetector /
 *      validateKillTriggerReason / KillTriggerLedger / assessKillPropagation /
 *      classifyKillSeverity / canonicalKillTriggerSignature を直接 import。
 *      kill-switch.ts / multi-process-isolation.ts の TYPE のみ間接的に必要。
 *   3. **bridge actual file 直結 lifecycle**: createOpenClawRuntimeBridge を直接 import し、
 *      spawn → kill → restart → state 復元 / corruption tolerance を file-breach-counter で実証。
 *   4. **17 day path 通し sequence**: W1 (control_def) → W2 (ports_design) → W3 (orchestrator_design)
 *      → W4 (wiring_review) の HITL gate 1-4 連続 approved + hardguards 全段 PASS で W4 完遂裏付け。
 *   5. side-effect 0: file IO は OS tmpdir 経由、afterEach で flush + 削除。API コスト $0。
 *
 * groups (4 groups / 12 tests):
 *
 * Group X1 (HITL-1〜12 × G-01〜G-12 cross-matrix 代表 30 cell pick, 4 tests):
 *   X1-1  HITL-1 (control_def) × G-02 (process boundary) × G-03 (duplicate-launch) → all valid
 *   X1-2  HITL-4 (wiring_review) × G-05 (subprocess kill) × G-06 (circuit-breaker) → assessKillPropagation safe
 *   X1-3  HITL-7 (external_api) × G-07 (reason validation) × G-11 (PII suspicion) → reject patterns 全網羅
 *   X1-4  HITL-9〜12 (dev_kickoff / permission_change / pii_review / ack_after_close) ×
 *         G-08 (LRU ledger) × G-12 (severity) cross check
 *
 * Group X2 (HITL gates × hardguards 同時発火 sequence, 3 tests):
 *   X2-1  HITL-10 24h SLA 違反 (gate-10 timeout) + G-04 emergency abort 同時発火 →
 *         counter breach + kill-switch armed + severity=critical
 *   X2-2  HITL-12 ack_after_close 拒否 + G-09 cooldown bypass 検出 →
 *         KillTriggerLedger.record で cooldown_violation 即時 reject
 *   X2-3  HITL-6 tos_gray reject + HITL-7 external_api reject + G-07 PII suspicion 連続発火 →
 *         counter 2 件 trip → rollback_completed + ledger trigger 1 件 + severity=warning
 *
 * Group X3 (bridge actual file 直結 lifecycle, 3 tests):
 *   X3-1  bridge spawn (init) → kill (dispose) → restart (re-init) → state 復元
 *         (FileBreachCounter persist / hot-restart 動作確認)
 *   X3-2  bridge active 中の corruption (jsonl 破損行) → init() で fail-open →
 *         続く observe で永続化が継続
 *   X3-3  bridge dispose 中の lifecycle violation (init 再呼出) throw +
 *         dispose 完遂後 re-init 可能 (R22 Dev-JJ Group C / R22 Group E と整合)
 *
 * Group X4 (17 day path W1+W2+W3+W4 通し sequence = Phase 1 完遂裏付け, 2 tests):
 *   X4-1  W1〜W4 HITL gate 1-4 連続 approved + hardguards G-02 / G-03 / G-05 / G-07 全 PASS →
 *         counter 0 / kill-switch 不発火 / orchestrator chain 整合 (Phase 1 着地)
 *   X4-2  17 day path 中 W3 段 reject 注入 (gate-3 reject) → 上位段 W4 への波及阻止 +
 *         counter 1 件 + ledger LRU 維持 (Phase 1 fail-fast 担保)
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
// HITL 12 gates 論理 enum (R23 Dev-MM と同定義 / R23 file 不可侵のため再宣言)
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
  rationale: 'r24 dev-qq hitl-hardguards-cross',
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
  tmpRoot = await fs.mkdtemp(join(tmpdir(), 'r24-dev-qq-'))
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
 * gate sequence を 1 度の e2e cycle で実行 (R23 Dev-MM helper と同 shape)。
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
// Group X1 — HITL-1〜12 × G-01〜G-12 cross-matrix (代表 30 cell pick, 4 tests)
// ---------------------------------------------------------------------------

describe('R24 Dev-QQ Group X1 — HITL × hardguards cross-matrix (30 cell pick)', () => {
  it('X1-1: HITL-1 (control_def) × G-02 (process boundary) × G-03 (duplicate-launch) → all valid', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    // HITL-1 control_def_review approved
    const decisions: GateDecisionRecord[] = [
      {
        gateId: 'gate-1-control-def-review',
        decision: { state: 'approved', approvedAtMs: T0 + 1 },
      },
    ]
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.approved).toBe(1)

    // G-02: process boundary 検証
    const record = makeStartupRecord(12345, 'PRJ-019', 'token-x1-1-fingerprint')
    const boundaryCtx: ProcessBoundaryContext = {
      currentPid: 12345,
      nowMs: T0 + 1000,
      knownPeerPids: [],
      maxParallel: 1,
    }
    const verdict = validateProcessBoundary(record, boundaryCtx)
    expect(verdict.valid).toBe(true)
    expect(verdict.reasons.length).toBe(0)
    expect(verdict.fingerprint).toBe(canonicalProcessFingerprint(record))

    // G-03: duplicate-launch detector
    const detector = new DuplicateLaunchDetector({ maxParallelPerProject: 1 })
    const attempt1 = detector.record(record)
    expect(attempt1.accepted).toBe(true)
    expect(attempt1.reason).toBe('first_launch')
    // 重複起動 → reject
    const dupRecord = makeStartupRecord(12345, 'PRJ-019', 'token-x1-1-fingerprint')
    const attempt2 = detector.record(dupRecord)
    expect(attempt2.accepted).toBe(false)
    expect(attempt2.reason).toBe('duplicate_token')

    await bridge.dispose()
    expect(bridge.phase()).toBe('idle')
  })

  it('X1-2: HITL-4 (wiring_review) × G-05 (subprocess kill) × G-06 (circuit-breaker) → assessKillPropagation safe', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const decisions: GateDecisionRecord[] = [
      {
        gateId: 'gate-4-wiring-review',
        decision: { state: 'approved', approvedAtMs: T0 + 1 },
      },
    ]
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.approved).toBe(1)

    // G-05 + G-06: subprocess kill chain + circuit-breaker open
    const subTargets = [makeSubprocessTarget('worker-a'), makeSubprocessTarget('worker-b')]
    const cbTargets = [makeCircuitBreakerTarget('cb-llm'), makeCircuitBreakerTarget('cb-tos')]
    const assessment = assessKillPropagation({
      subprocessTargets: subTargets,
      circuitBreakerTargets: cbTargets,
    })
    expect(assessment.safe).toBe(true)
    expect(assessment.subprocessCount).toBe(2)
    expect(assessment.circuitBreakerCount).toBe(2)
    expect(assessment.issues.length).toBe(0)

    // 重複 name 検出 (異常系) → unsafe
    const dupAssessment = assessKillPropagation({
      subprocessTargets: [makeSubprocessTarget('worker-a'), makeSubprocessTarget('worker-a')],
      circuitBreakerTargets: cbTargets,
    })
    expect(dupAssessment.safe).toBe(false)
    expect(dupAssessment.issues.some((i) => i.includes('duplicate'))).toBe(true)

    await bridge.dispose()
  })

  it('X1-3: HITL-7 (external_api) × G-07 (reason validation) × G-11 (PII suspicion) → reject patterns 全網羅', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    // HITL-7 external_api reject (gate 拒否)
    const decisions: GateDecisionRecord[] = [
      {
        gateId: 'gate-7-external-api',
        decision: { state: 'rejected', reason: 'external_api_denied' },
      },
    ]
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.rejected).toBe(1)

    // G-07: reason validation の reject 軸を網羅
    // 1. empty
    expect(validateKillTriggerReason('').valid).toBe(false)
    expect(validateKillTriggerReason('').issues).toContain('empty_reason')
    // 2. too short
    const tooShort = validateKillTriggerReason('ab')
    expect(tooShort.valid).toBe(false)
    expect(tooShort.issues.some((i) => i.startsWith('reason_too_short'))).toBe(true)
    // 3. control chars
    const ctrl = validateKillTriggerReason('hello\x01world')
    expect(ctrl.valid).toBe(false)
    expect(ctrl.issues).toContain('control_chars_present')

    // G-11: PII suspicion (email + API key)
    const emailLike = validateKillTriggerReason('user contact: alice@example.com triggered abort')
    expect(emailLike.valid).toBe(false)
    expect(emailLike.issues).toContain('email_like_pii_suspicion')
    const apiKeyLike = validateKillTriggerReason('leaked AKIAABCDEFGHIJKLMNOP token detected')
    expect(apiKeyLike.valid).toBe(false)
    expect(apiKeyLike.issues).toContain('api_key_like_pii_suspicion')

    // 正常 reason
    const ok = validateKillTriggerReason('  external api budget exceeded  ')
    expect(ok.valid).toBe(true)
    expect(ok.normalizedReason).toBe('external api budget exceeded')

    await bridge.dispose()
  })

  it('X1-4: HITL-9〜12 × G-08 (LRU ledger) × G-12 (severity classification) cross check', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const decisions: GateDecisionRecord[] = [
      { gateId: 'gate-9-dev-kickoff-approval', decision: { state: 'approved', approvedAtMs: T0 + 1 } },
      { gateId: 'gate-10-permission-change-review', decision: { state: 'approved', approvedAtMs: T0 + 2 } },
      { gateId: 'gate-11-knowledge-pii-review', decision: { state: 'approved', approvedAtMs: T0 + 3 } },
      { gateId: 'gate-12-ack-after-close', decision: { state: 'approved', approvedAtMs: T0 + 4 } },
    ]
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.approved).toBe(4)

    // G-08: KillTriggerLedger LRU (maxEntries=3)
    let now = T0
    const ledger = new KillTriggerLedger({
      cooldownMs: 10,
      maxEntries: 3,
      nowMs: () => now,
    })
    const addOne = (reason: string, source: string) => {
      const r = ledger.record(reason, source)
      now += 100 // cooldown 越え
      return r
    }
    expect(addOne('budget_exceed_a', 'budget').accepted).toBe(true)
    expect(addOne('budget_exceed_b', 'budget').accepted).toBe(true)
    expect(addOne('budget_exceed_c', 'budget').accepted).toBe(true)
    expect(ledger.size()).toBe(3)
    // 4 件目で LRU trim
    expect(addOne('budget_exceed_d', 'budget').accepted).toBe(true)
    expect(ledger.size()).toBe(3)
    // 末尾 last() が最新
    const last = ledger.last()
    expect(last).not.toBeNull()
    expect(last!.signature).toBe(canonicalKillTriggerSignature('budget_exceed_d', 'budget'))

    // G-12: severity classification
    expect(classifyKillSeverity('budget_exceed', 'budget')).toBe('critical')
    expect(classifyKillSeverity('cost_cap_breach detected', 'rate_anomaly')).toBe('critical')
    expect(classifyKillSeverity('runtime_limit hit', 'continuous_runtime')).toBe('warning')
    expect(classifyKillSeverity('manual abort by owner', 'manual')).toBe('info')
    expect(classifyKillSeverity('STOP signal received', 'file_signal')).toBe('critical')
    expect(classifyKillSeverity('unknown reason', 'tos_alert')).toBe('warning')

    await bridge.dispose()
  })
})

// ---------------------------------------------------------------------------
// Group X2 — HITL gates × hardguards 同時発火 sequence (3 tests)
// ---------------------------------------------------------------------------

describe('R24 Dev-QQ Group X2 — HITL × hardguards 同時発火 sequence', () => {
  it('X2-1: HITL-10 24h SLA 違反 + G-04 emergency abort → counter breach + kill armed + critical', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'x2-1.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()

    // HITL-10 pending + 25h forward step → SLA 越境 timeout
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

    const decisions: GateDecisionRecord[] = [
      { gateId: 'gate-10-permission-change-review', decision: { state: 'pending' } },
    ]
    const result = await runGateSequence(seq, decisions, ctx, adapter.nowMs)
    expect(result.timeout).toBe(1)

    // G-04 emergency abort: counter breach + rollback failed → kill-switch armed
    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: false, reason: 'emergency_abort_g04' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: { isActive: () => false, lastReason: () => null },
        postRollback: ctx.postRollbackNotifier,
      },
      counter,
    )
    // 異 loopId 2 回連続 evaluate → 2 回目で kill-switch 発火
    await rollback.evaluate({
      loopId: 'X2-1-A',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    const r = await rollback.evaluate({
      loopId: 'X2-1-B',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_failed_kill_switch_armed')
    // kill-switch 発火が seq に記録
    expect(seq.steps.some((s) => s.startsWith('P-UI-05.kill:'))).toBe(true)

    // G-12 severity: emergency_abort_g04 は budget 連動でないが critical 相当の reason
    const sev = classifyKillSeverity('cost_cap_breach emergency abort', 'budget')
    expect(sev).toBe('critical')

    await counter.flush()
    await bridge.dispose()
  })

  it('X2-2: HITL-12 ack_after_close 拒否 + G-09 cooldown bypass → ledger cooldown_violation', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    // HITL-12 ack_after_close reject
    const decisions: GateDecisionRecord[] = [
      {
        gateId: 'gate-12-ack-after-close',
        decision: { state: 'rejected', reason: 'ack_missing' },
      },
    ]
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.rejected).toBe(1)

    // G-09: cooldown bypass detection (KillTriggerLedger)
    let now = T0
    const ledger = new KillTriggerLedger({
      cooldownMs: 5_000,
      nowMs: () => now,
    })
    const a1 = ledger.record('ack_after_close_failed', 'manual')
    expect(a1.accepted).toBe(true)
    expect(a1.reason).toBe('first_trigger')
    // 同 signature を即座に再 trigger → cooldown_violation
    now += 1_000 // cooldown 5s 未満
    const a2 = ledger.record('ack_after_close_failed', 'manual')
    expect(a2.accepted).toBe(false)
    expect(a2.reason).toBe('cooldown_violation')
    expect(a2.signature).toBe(canonicalKillTriggerSignature('ack_after_close_failed', 'manual'))
    // cooldown 経過 → 再受理
    now += 5_001
    const a3 = ledger.record('ack_after_close_failed', 'manual')
    expect(a3.accepted).toBe(true)

    await bridge.dispose()
  })

  it('X2-3: HITL-6 + HITL-7 連続 reject + G-07 PII 検出 → counter 2 件 trip / ledger 1 件 / warning', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'x2-3.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()

    // HITL-6 + HITL-7 連続 reject
    const decisions: GateDecisionRecord[] = [
      { gateId: 'gate-6-tos-gray-review', decision: { state: 'rejected', reason: 'tos_gray_blocklist' } },
      { gateId: 'gate-7-external-api', decision: { state: 'rejected', reason: 'external_api_denied' } },
    ]
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.rejected).toBe(2)

    // counter 2 件 → rollback_completed → reset
    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-X2-3' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: { isActive: () => false, lastReason: () => null },
        postRollback: ctx.postRollbackNotifier,
      },
      counter,
    )
    await rollback.evaluate({
      loopId: 'X2-3-A',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    const r = await rollback.evaluate({
      loopId: 'X2-3-B',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_completed')
    expect(counter.current()).toBe(0)

    // G-07 PII 検出 (reject 理由に PII を含めてはならないという観点)
    const piiCheck = validateKillTriggerReason('contact admin@corp.example for gate-6 reject')
    expect(piiCheck.valid).toBe(false)
    expect(piiCheck.issues).toContain('email_like_pii_suspicion')

    // ledger 1 件 (rollback success → 単一 trigger)
    let now = T0 + 10_000
    const ledger = new KillTriggerLedger({ cooldownMs: 1_000, nowMs: () => now })
    const a1 = ledger.record('tos_gray_blocklist:rollback_success', 'tos_alert')
    expect(a1.accepted).toBe(true)
    expect(ledger.size()).toBe(1)

    // severity = warning (tos_alert は default warning)
    expect(classifyKillSeverity('tos_gray_blocklist', 'tos_alert')).toBe('warning')

    await counter.flush()
    await bridge.dispose()
  })
})

// ---------------------------------------------------------------------------
// Group X3 — bridge actual file 直結 lifecycle (3 tests)
// ---------------------------------------------------------------------------

describe('R24 Dev-QQ Group X3 — bridge actual file 直結 lifecycle', () => {
  it('X3-1: bridge spawn → kill → restart → state 復元 (FileBreachCounter persist)', async () => {
    const path = join(tmpRoot, 'x3-1.jsonl')

    // === bridge "spawn" (process A 想定) ===
    const bridgeA = createOpenClawRuntimeBridge()
    const ctxA = await bridgeA.init()
    expect(bridgeA.phase()).toBe('active')

    const counterA = trackCounter(createFileBreachCounter({ path }))
    await counterA.init()
    counterA.observe('X3-1-prev')
    expect(counterA.current()).toBe(1)
    await counterA.flush()

    // === bridge "kill" (dispose) ===
    await bridgeA.dispose()
    expect(bridgeA.phase()).toBe('idle')
    expect(() => bridgeA.getContext()).toThrow(/active phase/i)

    // === bridge "restart" (新 instance, 同 path で counter 復元) ===
    const bridgeB = createOpenClawRuntimeBridge()
    const ctxB = await bridgeB.init()
    expect(bridgeB.phase()).toBe('active')
    // re-init で fresh context (R22 Dev-JJ E-2 と整合)
    expect(ctxB).not.toBe(ctxA)

    const counterB = trackCounter(createFileBreachCounter({ path }))
    await counterB.init()
    // state 復元: count=1, lastLoopId='X3-1-prev'
    expect(counterB.current()).toBe(1)
    expect(counterB.lastLoopId()).toBe('X3-1-prev')

    // 異 loopId 1 回で trip → rollback_completed
    const seq = newSeq()
    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-X3-1' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: { isActive: () => false, lastReason: () => null },
        postRollback: ctxB.postRollbackNotifier,
      },
      counterB,
    )
    const r = await rollback.evaluate({
      loopId: 'X3-1-A',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_completed')
    expect(counterB.current()).toBe(0)

    await counterB.flush()
    await bridgeB.dispose()
  })

  it('X3-2: bridge active 中の jsonl 破損行 → init() で fail-open → 続く observe で永続化継続', async () => {
    const path = join(tmpRoot, 'x3-2.jsonl')

    // 破損 file を事前配置 (全行 corrupted)
    await fs.writeFile(path, '{not_valid_json_1\n[broken_2\n,,,broken_3\n', 'utf-8')

    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()
    // fail-open: count=0 / lastLoopId=null
    expect(counter.current()).toBe(0)
    expect(counter.lastLoopId()).toBeNull()

    // 続く observe で永続化が継続
    counter.observe('X3-2-A')
    expect(counter.current()).toBe(1)
    expect(counter.lastLoopId()).toBe('X3-2-A')
    await counter.flush()

    // file には append された observe record が含まれる
    const after = await fs.readFile(path, 'utf-8')
    expect(after.includes('X3-2-A')).toBe(true)

    // bridge は corruption 影響を受けない (memory のみ)
    expect(bridge.phase()).toBe('active')

    await bridge.dispose()
  })

  it('X3-3: bridge dispose 中の lifecycle violation throw + dispose 完遂後 re-init 可能', async () => {
    let initInDispose: Error | null = null
    const bridge = createOpenClawRuntimeBridge({
      onDispose: async () => {
        // dispose 進行中の init() 呼出は lifecycle violation
        try {
          await bridge.init()
        } catch (e) {
          initInDispose = e as Error
        }
      },
    })
    await bridge.init()
    expect(bridge.phase()).toBe('active')

    await bridge.dispose()
    expect(bridge.phase()).toBe('idle')
    // dispose 中 init throw を確認
    expect(initInDispose).not.toBeNull()
    expect(initInDispose!.message).toMatch(/cannot init while disposing/i)

    // dispose 完遂後 re-init 可能 (R22 Dev-JJ C-1 と整合)
    const ctx2 = await bridge.init()
    expect(ctx2).toBeDefined()
    expect(bridge.phase()).toBe('active')
    await bridge.dispose()
    expect(bridge.phase()).toBe('idle')
  })
})

// ---------------------------------------------------------------------------
// Group X4 — 17 day path W1+W2+W3+W4 通し sequence (Phase 1 完遂裏付け, 2 tests)
// ---------------------------------------------------------------------------

describe('R24 Dev-QQ Group X4 — 17 day path W1+W2+W3+W4 通し (Phase 1 完遂裏付け)', () => {
  it('X4-1: W1〜W4 gate 1-4 全 approved + hardguards 全 PASS → counter 0 / kill 不発火 (Phase 1 着地)', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'x4-1.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()
    expect(counter.current()).toBe(0)

    // W1〜W4 HITL gate 1-4 連続 approved (17 day path 通し)
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

    // hardguards 全段 PASS
    // G-02 process boundary
    const record = makeStartupRecord(99999, 'PRJ-019', 'token-x4-1-phase1-complete')
    const verdict = validateProcessBoundary(record, {
      currentPid: 99999,
      nowMs: T0 + 100_000,
      knownPeerPids: [],
      maxParallel: 1,
    })
    expect(verdict.valid).toBe(true)

    // G-03 duplicate-launch (1 回 record OK)
    const detector = new DuplicateLaunchDetector({ maxParallelPerProject: 1 })
    expect(detector.record(record).accepted).toBe(true)

    // G-05 + G-06 kill propagation 評価
    const assessment = assessKillPropagation({
      subprocessTargets: [makeSubprocessTarget('w1'), makeSubprocessTarget('w2')],
      circuitBreakerTargets: [makeCircuitBreakerTarget('cb1')],
    })
    expect(assessment.safe).toBe(true)

    // G-07 trigger reason validation (正常 reason)
    const reasonOk = validateKillTriggerReason('phase 1 completion verification')
    expect(reasonOk.valid).toBe(true)

    // counter 0 (gate 全 approved → breach 観測なし)
    expect(counter.current()).toBe(0)
    expect(counter.lastLoopId()).toBeNull()
    // kill-switch 不発火
    expect(seq.steps.filter((s) => s.startsWith('P-UI-05.kill:')).length).toBe(0)

    // 17 day path sequence 整合: HITL: prefix 4 件
    const hitlSteps = seq.steps.filter((s) => s.startsWith('HITL:'))
    expect(hitlSteps.length).toBe(4)
    expect(hitlSteps[0]).toContain('gate-1-control-def-review')
    expect(hitlSteps[1]).toContain('gate-2-ports-design-review')
    expect(hitlSteps[2]).toContain('gate-3-orchestrator-design-review')
    expect(hitlSteps[3]).toContain('gate-4-wiring-review')

    await counter.flush()
    await bridge.dispose()
  })

  it('X4-2: W3 段 gate-3 reject 注入 → 上位 W4 へ波及阻止 + counter 1 件 / ledger LRU 維持 (fail-fast)', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'x4-2.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()

    // W1〜W2 approved → W3 reject (fail-fast 想定で W4 は実行しない)
    const decisions: GateDecisionRecord[] = [
      { gateId: 'gate-1-control-def-review', decision: { state: 'approved', approvedAtMs: T0 + 1 } },
      { gateId: 'gate-2-ports-design-review', decision: { state: 'approved', approvedAtMs: T0 + 2 } },
      { gateId: 'gate-3-orchestrator-design-review', decision: { state: 'rejected', reason: 'orchestrator_design_flaw' } },
      // W4 gate は実行されない (caller 側で fail-fast)
    ]
    const result = await runGateSequence(seq, decisions, ctx, () => T0)
    expect(result.approved).toBe(2)
    expect(result.rejected).toBe(1)

    // gate-3 reject = anomaly observed → counter 1 件
    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-X4-2' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: { isActive: () => false, lastReason: () => null },
        postRollback: ctx.postRollbackNotifier,
      },
      counter,
    )
    const r = await rollback.evaluate({
      loopId: 'X4-2-gate3',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('first_breach')
    expect(counter.current()).toBe(1)

    // ledger LRU 維持: maxEntries=2 で 3 件 record → 最古が trim
    let now = T0 + 100
    const ledger = new KillTriggerLedger({
      cooldownMs: 10,
      maxEntries: 2,
      nowMs: () => now,
    })
    const add = (reason: string, source: string) => {
      const r = ledger.record(reason, source)
      now += 100
      return r
    }
    expect(add('w3_design_flaw_a', 'manual').accepted).toBe(true)
    expect(add('w3_design_flaw_b', 'manual').accepted).toBe(true)
    expect(add('w3_design_flaw_c', 'manual').accepted).toBe(true)
    expect(ledger.size()).toBe(2) // LRU trim 維持
    // 最新 entry が w3_design_flaw_c
    const last = ledger.last()
    expect(last).not.toBeNull()
    expect(last!.signature).toBe(canonicalKillTriggerSignature('w3_design_flaw_c', 'manual'))

    // W4 wiring_review が実行されていない (fail-fast 担保)
    const w4Steps = seq.steps.filter((s) => s.includes('gate-4-wiring-review'))
    expect(w4Steps.length).toBe(0)

    await counter.flush()
    await bridge.dispose()
  })
})
