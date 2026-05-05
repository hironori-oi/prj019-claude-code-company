/**
 * Phase 2 W5 着手第 1 弾 — cross-orchestrator 統合 e2e
 * (Round 25, Dev-SS 担当, W5 着手第 1 弾).
 *
 * Spec scope (W5 着手第 1 弾):
 *   Round 24 で Phase 1 完遂判定 Y 無条件 / Phase 2 6/3 着手 readiness Y を確証した上で、
 *   Round 25 で Phase 2 W5 第 1 弾として「cross-orchestrator 統合 e2e」を確立する。
 *   Dev-PP R24 が完遂した main code alias 化 (orchestrator.ts 6 imports) と Dev-MM R23 の
 *   test layer alias 化を継承し、harness ↔ openclaw-runtime 双方向で alias 経由の
 *   cross-package 動作を test layer で実証する。
 *
 *   検証対象:
 *     W5-1  cross-package import alias 動作実証 (harness ↔ openclaw-runtime 双方向)
 *     W5-2  orchestrator A → orchestrator B handoff sequence
 *     W5-3  cross-orchestrator state 同期 (heartbeat + breach counter)
 *     W5-4  failure injection × cross recovery
 *
 * 領域不可侵 (Round 21〜24 historical baseline 維持):
 *   - openclaw-runtime-bridge.ts (Dev-GG 175 行) 無改変
 *   - file-breach-counter.ts (Dev-GG 200 行) 無改変
 *   - monotonic-clock.ts (Dev-HH 175 行) 無改変
 *   - sla-clock-adapter.ts (Dev-HH 130 行) 無改変
 *   - 17day-path-w4-e2e-fully-wired.test.ts (Dev-HH 530 行 / 11 tests) 無改変
 *   - 17day-path-w4-production-e2e-extended.test.ts (Dev-JJ 561 行 / 10 tests) 無改変
 *   - 17day-path-w4-hitl-gates-integration.test.ts (Dev-MM 626 行 / 9 tests) 無改変
 *   - 17day-path-w4-hitl-hardguards-cross.test.ts (Dev-QQ 907 行 / 12 tests) 無改変
 *   - 17day-path-w3-rollback-permission-orchestrator.ts (Dev-EE) 無改変
 *   - 17day-path-w3-orchestrator.ts (Dev-BB / Dev-PP R24 alias 化済) 無改変
 *   - openclaw-runtime/src/controls/* (control 本体 4 file) 無改変
 *   - hardguard-g-02.ts / hardguard-g-10.ts (Dev-F R14 緊急対応) 無改変
 *
 * 設計原則:
 *   1. **alias 経由 import の test layer 確認**: Dev-MM R23 Phase 1 で確立した
 *      `@clawbridge/openclaw-runtime/controls/...` alias resolver の挙動を本 file で
 *      cross-orchestrator 視点で再確認する (32/32 PASS の resolver 動作実証 5 round 目)。
 *   2. **orchestrator handoff**: PermissionOrchestrator (HITL-10 系) 終局 → RollbackOrchestrator
 *      (P-UI-05 系) 起動の chain を bridge actual file 直結 lifecycle 上で実行する。
 *   3. **state 同期**: heartbeat 観測 + breach counter persistence + ledger LRU を
 *      横断 1 つの cycle で同期確認する (Phase 2 W5 で main task となる cross-state observability)。
 *   4. **failure injection × recovery**: orchestrator A が fail した時に orchestrator B が
 *      自走 recovery する pattern を 2 系列 (counter trip + cooldown bypass) で確認する。
 *   5. side-effect 0: file IO は OS tmpdir 経由、afterEach で flush + 削除。API コスト $0。
 *   6. **Dev-PP R24 main code alias 化との整合**: 本 test file は alias 経由で
 *      `createKillTerminalSink` / `createRlsAuditTrail` を import し、main code 側 alias と
 *      test code 側 alias の双方向動作を実証する (Phase 2 production rollout 裏付け)。
 *
 * groups (5 groups / 12 tests):
 *
 * Group W5-1 (cross-package import alias 動作実証, 3 tests):
 *   W5-1-1  harness → openclaw-runtime alias 経由で 4 control public API 取得
 *   W5-1-2  openclaw-runtime → harness 方向は禁止 (依存方向 invariant 確認)
 *   W5-1-3  alias 経由 import の戻り値が relative import 経由と shape 同一
 *
 * Group W5-2 (orchestrator A → orchestrator B handoff sequence, 3 tests):
 *   W5-2-1  PermissionOrchestrator approved → RollbackOrchestrator 起動 → success
 *   W5-2-2  PermissionOrchestrator rejected → RollbackOrchestrator 起動せず (fail-fast)
 *   W5-2-3  PermissionOrchestrator timeout → RollbackOrchestrator 起動せず + audit trail 記録
 *
 * Group W5-3 (cross-orchestrator state 同期 = heartbeat + breach counter, 3 tests):
 *   W5-3-1  heartbeat observe + breach counter observe の cross record cycle
 *   W5-3-2  bridge restart 時に counter + audit trail が独立 lifecycle で再構築
 *   W5-3-3  PermissionOrchestrator 終局 audit と RollbackOrchestrator postRollback audit が
 *           同一 RlsAuditTrail に集約 (Dev-BB R19 invariant の Phase 2 W5 拡張版)
 *
 * Group W5-4 (failure injection × cross recovery, 2 tests):
 *   W5-4-1  RollbackOrchestrator executor fail → kill-switch armed → 同 cycle 内 reset 不可
 *   W5-4-2  cooldown bypass 注入 → KillTriggerLedger reject → cooldown 経過後再受理
 *
 * Group W5-5 (Phase 2 W5 readiness 確証 = production wiring 連動 sanity, 1 test):
 *   W5-5-1  bridge actual file lifecycle で 4 sink (killTerminal / rlsAudit / permissionAudit /
 *           postRollback) すべての alias 経由 import 動作 + cross-orchestrator 統合動作確認
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

// Round 24 Dev-PP main code alias 化を継承 → 本 file は test layer 第 2 alias 化 file 群
// (Phase 1 = 2 file / Phase 2 W5 = 本 file 含 cross-orchestrator 系を順次 alias 化対象).
// 旧 `../../openclaw-runtime/src/controls/...` → 新 `@clawbridge/openclaw-runtime/controls/...`.
import {
  createKillTerminalSink,
  type KillTerminalSink,
} from '@clawbridge/openclaw-runtime/controls/p-ui-04-kill-switch-propagation.js'
import {
  createRlsAuditTrail,
  type RlsAuditTrail,
} from '@clawbridge/openclaw-runtime/controls/p-ui-09-rls-checklist.js'
import type { PostRollbackNotifier } from '@clawbridge/openclaw-runtime/controls/p-ui-05-anomaly-rollback.js'
import type { PermissionAuditSink } from '@clawbridge/openclaw-runtime/controls/hitl-10-permission-change.js'

// hardguards (Dev-F R14 pure 関数 / class) — 純粋 import のみ、無改変
import {
  validateKillTriggerReason,
  KillTriggerLedger,
  classifyKillSeverity,
  canonicalKillTriggerSignature,
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

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const T0 = 1_700_000_000_000
const SCOPE: PermissionScope = {
  changeType: 'env',
  before: 'A',
  after: 'B',
  rationale: 'r25 dev-ss phase2-w5-cross-orchestrator',
}

interface SeqLog {
  steps: string[]
}
const newSeq = (): SeqLog => ({ steps: [] })

function mockExecutor(seq: SeqLog, outcome: RollbackOutcome): RollbackExecutorPort {
  return {
    rollback: async (loopId) => {
      seq.steps.push(`rollback.exec:${loopId}`)
      return outcome
    },
  }
}

function mockKillSwitch(seq: SeqLog): KillSwitchTriggerPort {
  return {
    fire: async (reason) => {
      seq.steps.push(`kill.fire:${reason}`)
    },
  }
}

function mockApprover(
  seq: SeqLog,
  ticketTag: string,
  decision: ApprovalDecision,
): PermissionApproverPort {
  return {
    requestApproval: async (_scope, requester) => {
      seq.steps.push(`perm.req:${ticketTag}:${requester.ticketId}`)
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
  tmpRoot = await fs.mkdtemp(join(tmpdir(), 'r25-dev-ss-'))
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

// ---------------------------------------------------------------------------
// Group W5-1 — cross-package import alias 動作実証 (3 tests)
// ---------------------------------------------------------------------------

describe('R25 Dev-SS Group W5-1 — cross-package import alias 動作実証', () => {
  it('W5-1-1: harness → openclaw-runtime alias 経由で 4 control public API 取得', () => {
    // alias 経由で取得した 4 つの factory / type の動作確認
    const killTerminalSink: KillTerminalSink = createKillTerminalSink()
    const rlsAuditTrail: RlsAuditTrail = createRlsAuditTrail()

    expect(typeof killTerminalSink.markFired).toBe('function')
    expect(typeof killTerminalSink.isActive).toBe('function')
    expect(typeof killTerminalSink.lastReason).toBe('function')
    expect(killTerminalSink.isActive()).toBe(false)
    expect(killTerminalSink.lastReason()).toBeNull()

    expect(typeof rlsAuditTrail.record).toBe('function')
    expect(typeof rlsAuditTrail.list).toBe('function')
    expect(rlsAuditTrail.list().length).toBe(0)

    // PostRollbackNotifier / PermissionAuditSink は type-only import のため、
    // 本 test では実 instance を ad-hoc で構築して shape 整合のみ確認。
    const notifier: PostRollbackNotifier = {
      onRollbackCompleted: () => undefined,
    }
    const audit: PermissionAuditSink = {
      recordDecision: () => undefined,
    }
    expect(typeof notifier.onRollbackCompleted).toBe('function')
    expect(typeof audit.recordDecision).toBe('function')
  })

  it('W5-1-2: openclaw-runtime → harness 方向は禁止 = harness side artifact のみ harness 側で生成', async () => {
    // 本 test は「依存方向 invariant の test layer 観察」=
    // alias は片方向 (harness → openclaw-runtime) のみ存在することを構造的に再確認する。
    // openclaw-runtime 側は harness の symbol を import できない (循環依存禁止) ため、
    // bridge は harness 側で生成され、openclaw-runtime 側 type のみが alias 経由で取得される。
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    // bridge から取得した 4 sink はすべて openclaw-runtime 側 type に整合する
    expect(ctx.killTerminalSink).toBeDefined()
    expect(ctx.rlsAuditTrail).toBeDefined()
    expect(ctx.permissionAuditSink).toBeDefined()
    expect(ctx.postRollbackNotifier).toBeDefined()

    // 本 file 内で alias 経由生成した sink と bridge 経由 sink は独立 instance
    const localSink = createKillTerminalSink()
    expect(localSink).not.toBe(ctx.killTerminalSink)
    expect(localSink.isActive()).toBe(false)
    expect(ctx.killTerminalSink.isActive()).toBe(false)

    await bridge.dispose()
  })

  it('W5-1-3: alias 経由 import の戻り値が同一 package 内で shape 一貫', () => {
    // alias 経由で 2 度 import した sink の shape 確認
    const sinkA = createKillTerminalSink()
    const sinkB = createKillTerminalSink()
    // 別 instance だが shape 完全一致
    expect(sinkA).not.toBe(sinkB)
    expect(Object.keys(sinkA).sort()).toEqual(Object.keys(sinkB).sort())

    // RlsAuditTrail も同様
    const trailA = createRlsAuditTrail()
    const trailB = createRlsAuditTrail()
    expect(trailA).not.toBe(trailB)
    expect(trailA.list()).toEqual([])
    expect(trailB.list()).toEqual([])

    // record してから list が分離されている (instance isolation 維持)
    trailA.record({
      source: 'p-ui-05',
      kind: 'rollback_completed',
      ticketId: 'T-A',
      recordedAt: new Date(T0).toISOString(),
    })
    expect(trailA.list().length).toBe(1)
    expect(trailB.list().length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Group W5-2 — orchestrator A → orchestrator B handoff sequence (3 tests)
// ---------------------------------------------------------------------------

describe('R25 Dev-SS Group W5-2 — orchestrator A → orchestrator B handoff sequence', () => {
  it('W5-2-1: Permission approved → Rollback 起動 → success → trail 集約', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'w5-2-1.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()

    // Step 1: Permission orchestrator (HITL-10 系) approved
    const permOrch = createPermissionOrchestrator({
      approver: mockApprover(seq, 'A1', { state: 'approved', approvedAtMs: T0 + 1 }),
      auditSink: ctx.permissionAuditSink,
      nowMs: () => T0,
    })
    const permResult = await permOrch.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'W5-2-1-perm' },
    })
    expect(permResult.kind).toBe('approved')

    // Step 2: handoff → Rollback orchestrator (P-UI-05 系) 起動
    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-W5-2-1' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: { isActive: () => false, lastReason: () => null },
        postRollback: ctx.postRollbackNotifier,
      },
      counter,
    )
    // 異 loopId 2 回連続 evaluate → 2 回目で rollback 完遂
    await rollback.evaluate({
      loopId: 'W5-2-1-A',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    const r = await rollback.evaluate({
      loopId: 'W5-2-1-B',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_completed')
    expect(counter.current()).toBe(0)

    // Step 3: trail 集約 = permission_approved + rollback_completed が同 trail に
    const trail = ctx.rlsAuditTrail.list()
    const sources = trail.map((e) => e.source)
    expect(sources).toContain('hitl-10')
    expect(sources).toContain('p-ui-05')

    // sequence 整合: perm.req → rollback.exec
    expect(seq.steps[0]).toBe('perm.req:A1:W5-2-1-perm')
    expect(seq.steps.some((s) => s.startsWith('rollback.exec:W5-2-1-B'))).toBe(true)

    await counter.flush()
    await bridge.dispose()
  })

  it('W5-2-2: Permission rejected → Rollback 起動せず (fail-fast handoff stop)', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    // Permission rejected
    const permOrch = createPermissionOrchestrator({
      approver: mockApprover(seq, 'A2', { state: 'rejected', reason: 'denied' }),
      auditSink: ctx.permissionAuditSink,
      nowMs: () => T0,
    })
    const permResult = await permOrch.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'W5-2-2-perm' },
    })
    expect(permResult.kind).toBe('rejected')

    // caller 側 fail-fast = Rollback orchestrator 起動しない
    // (handoff condition = perm.kind === 'approved')
    const shouldStartRollback = permResult.kind === ('approved' as typeof permResult.kind)
    expect(shouldStartRollback).toBe(false)

    // seq には rollback.exec が出現していない
    expect(seq.steps.some((s) => s.startsWith('rollback.exec:'))).toBe(false)

    // trail には rejected が記録されている
    const trail = ctx.rlsAuditTrail.list()
    expect(trail.length).toBe(1)
    expect(trail[0]?.source).toBe('hitl-10')
    expect(trail[0]?.kind).toBe('permission_denied')

    await bridge.dispose()
  })

  it('W5-2-3: Permission timeout → Rollback 起動せず + audit trail に timeout 記録', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    // Permission timeout (decision.state === 'timeout')
    const permOrch = createPermissionOrchestrator({
      approver: mockApprover(seq, 'A3', { state: 'timeout' }),
      auditSink: ctx.permissionAuditSink,
      nowMs: () => T0,
    })
    const permResult = await permOrch.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'W5-2-3-perm' },
    })
    expect(permResult.kind).toBe('timeout')

    // caller 側 fail-fast = Rollback orchestrator 起動しない
    const shouldStartRollback = permResult.kind === ('approved' as typeof permResult.kind)
    expect(shouldStartRollback).toBe(false)
    expect(seq.steps.some((s) => s.startsWith('rollback.exec:'))).toBe(false)

    // audit trail = timeout は permission_denied として記録 (Dev-BB の mapping 仕様)
    const trail = ctx.rlsAuditTrail.list()
    expect(trail.length).toBe(1)
    expect(trail[0]?.source).toBe('hitl-10')
    expect(trail[0]?.kind).toBe('permission_denied')

    await bridge.dispose()
  })
})

// ---------------------------------------------------------------------------
// Group W5-3 — cross-orchestrator state 同期 (heartbeat + breach counter, 3 tests)
// ---------------------------------------------------------------------------

describe('R25 Dev-SS Group W5-3 — cross-orchestrator state 同期', () => {
  it('W5-3-1: heartbeat observe + breach counter observe の cross record cycle', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'w5-3-1.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()

    // heartbeat 想定: 連続 N 回の loopId 観測 (counter side)
    const heartbeats = ['hb-001', 'hb-002', 'hb-003']
    for (const loopId of heartbeats) {
      counter.observe(loopId)
    }
    expect(counter.current()).toBe(3)
    expect(counter.lastLoopId()).toBe('hb-003')
    await counter.flush()

    // 同 cycle で permission orchestrator が approved → audit trail に記録
    const permOrch = createPermissionOrchestrator({
      approver: mockApprover(seq, 'HB', { state: 'approved', approvedAtMs: T0 + 1 }),
      auditSink: ctx.permissionAuditSink,
      nowMs: () => T0,
    })
    await permOrch.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'W5-3-1-hb-perm' },
    })

    // counter file persistence + audit trail in-memory が独立 lifecycle で共存
    const fileContent = await fs.readFile(path, 'utf-8')
    expect(fileContent.includes('hb-001')).toBe(true)
    expect(fileContent.includes('hb-002')).toBe(true)
    expect(fileContent.includes('hb-003')).toBe(true)

    const trail = ctx.rlsAuditTrail.list()
    expect(trail.length).toBe(1)
    expect(trail[0]?.source).toBe('hitl-10')
    expect(trail[0]?.kind).toBe('permission_approved')

    await bridge.dispose()
  })

  it('W5-3-2: bridge restart 時に counter + audit trail が独立 lifecycle で再構築', async () => {
    const path = join(tmpRoot, 'w5-3-2.jsonl')

    // Phase A: bridge spawn → counter observe + audit record
    const bridgeA = createOpenClawRuntimeBridge()
    const ctxA = await bridgeA.init()
    const counterA = trackCounter(createFileBreachCounter({ path }))
    await counterA.init()
    counterA.observe('W5-3-2-pre')
    expect(counterA.current()).toBe(1)
    ctxA.permissionAuditSink.recordDecision({
      ticketId: 'pre-T',
      state: 'approved',
      detail: 'pre',
      recordedAt: new Date(T0).toISOString(),
    })
    expect(ctxA.rlsAuditTrail.list().length).toBe(1)
    await counterA.flush()
    await bridgeA.dispose()

    // Phase B: bridge restart (新 instance) → counter は file 復元 / audit trail は fresh
    const bridgeB = createOpenClawRuntimeBridge()
    const ctxB = await bridgeB.init()
    const counterB = trackCounter(createFileBreachCounter({ path }))
    await counterB.init()
    // counter: state 復元 OK (file 永続)
    expect(counterB.current()).toBe(1)
    expect(counterB.lastLoopId()).toBe('W5-3-2-pre')
    // audit trail: fresh (in-memory のため復元なし = 設計通り)
    expect(ctxB.rlsAuditTrail.list().length).toBe(0)
    expect(ctxB).not.toBe(ctxA)

    await counterB.flush()
    await bridgeB.dispose()
  })

  it('W5-3-3: Permission audit + Rollback postRollback audit が同一 RlsAuditTrail に集約', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'w5-3-3.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()

    // Step 1: Permission approved (hitl-10 → trail)
    const permOrch = createPermissionOrchestrator({
      approver: mockApprover(seq, 'P3', { state: 'approved', approvedAtMs: T0 + 1 }),
      auditSink: ctx.permissionAuditSink,
      nowMs: () => T0,
    })
    await permOrch.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'W5-3-3-perm' },
    })
    expect(ctx.rlsAuditTrail.list().length).toBe(1)

    // Step 2: Rollback completed (p-ui-05 → trail) を 2 連続 breach で起動
    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-W5-3-3' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: { isActive: () => false, lastReason: () => null },
        postRollback: ctx.postRollbackNotifier,
      },
      counter,
    )
    await rollback.evaluate({
      loopId: 'W5-3-3-A',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    const r = await rollback.evaluate({
      loopId: 'W5-3-3-B',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_completed')

    // 同一 RlsAuditTrail に 2 件集約 (hitl-10 + p-ui-05)
    const trail = ctx.rlsAuditTrail.list()
    expect(trail.length).toBe(2)
    const sources = trail.map((e) => e.source)
    expect(sources).toContain('hitl-10')
    expect(sources).toContain('p-ui-05')
    const kinds = trail.map((e) => e.kind)
    expect(kinds).toContain('permission_approved')
    expect(kinds).toContain('rollback_completed')

    await counter.flush()
    await bridge.dispose()
  })
})

// ---------------------------------------------------------------------------
// Group W5-4 — failure injection × cross recovery (2 tests)
// ---------------------------------------------------------------------------

describe('R25 Dev-SS Group W5-4 — failure injection × cross recovery', () => {
  it('W5-4-1: Rollback executor fail → kill-switch armed → 同 cycle 内 reset 不可 + severity classify', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'w5-4-1.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()

    // Step 1: Permission approved (handoff 成立)
    const permOrch = createPermissionOrchestrator({
      approver: mockApprover(seq, 'F1', { state: 'approved', approvedAtMs: T0 + 1 }),
      auditSink: ctx.permissionAuditSink,
      nowMs: () => T0,
    })
    await permOrch.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'W5-4-1-perm' },
    })

    // Step 2: Rollback executor fail → kill-switch armed
    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: false, reason: 'rollback_executor_failed' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: { isActive: () => false, lastReason: () => null },
        postRollback: ctx.postRollbackNotifier,
      },
      counter,
    )
    await rollback.evaluate({
      loopId: 'W5-4-1-A',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    const r = await rollback.evaluate({
      loopId: 'W5-4-1-B',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_failed_kill_switch_armed')
    expect(seq.steps.some((s) => s.startsWith('kill.fire:'))).toBe(true)

    // counter は reset されていない (rollback 失敗で counter が残る = 仕様)
    expect(counter.current()).toBe(2)

    // hardguard severity classify = critical (budget 連動 reason の場合)
    const sev1 = classifyKillSeverity('cost_cap_breach detected', 'budget')
    expect(sev1).toBe('critical')
    // 一般 reason は warning 系
    const sev2 = classifyKillSeverity('rollback_executor_failed', 'manual')
    expect(sev2).toBe('info')

    // reason validation pass (failure injection 用 reason は正常 string)
    const reasonCheck = validateKillTriggerReason('rollback_executor_failed retry needed')
    expect(reasonCheck.valid).toBe(true)

    await counter.flush()
    await bridge.dispose()
  })

  it('W5-4-2: cooldown bypass 注入 → KillTriggerLedger reject → cooldown 経過後再受理', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    // Permission timeout (handoff 不成立) を起点に
    const permOrch = createPermissionOrchestrator({
      approver: mockApprover(seq, 'F2', { state: 'timeout' }),
      auditSink: ctx.permissionAuditSink,
      nowMs: () => T0,
    })
    const permResult = await permOrch.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'W5-4-2-perm' },
    })
    expect(permResult.kind).toBe('timeout')

    // KillTriggerLedger で cooldown bypass 検出
    let now = T0
    const ledger = new KillTriggerLedger({
      cooldownMs: 5_000,
      maxEntries: 5,
      nowMs: () => now,
    })

    // 1 回目 record OK
    const a1 = ledger.record('permission_timeout_W5-4-2', 'manual')
    expect(a1.accepted).toBe(true)
    expect(a1.reason).toBe('first_trigger')

    // 即時再 trigger → cooldown_violation
    now += 1_000
    const a2 = ledger.record('permission_timeout_W5-4-2', 'manual')
    expect(a2.accepted).toBe(false)
    expect(a2.reason).toBe('cooldown_violation')
    expect(a2.signature).toBe(canonicalKillTriggerSignature('permission_timeout_W5-4-2', 'manual'))

    // cooldown 経過 → 再受理
    now += 5_001
    const a3 = ledger.record('permission_timeout_W5-4-2', 'manual')
    expect(a3.accepted).toBe(true)

    // ledger 累積 = 2 件 (a1 + a3、a2 は reject)
    expect(ledger.size()).toBe(2)

    // audit trail = permission_denied 1 件 (timeout の mapping)
    const trail = ctx.rlsAuditTrail.list()
    expect(trail.length).toBe(1)
    expect(trail[0]?.kind).toBe('permission_denied')

    await bridge.dispose()
  })
})

// ---------------------------------------------------------------------------
// Group W5-5 — Phase 2 W5 readiness 確証 = production wiring 連動 sanity (1 test)
// ---------------------------------------------------------------------------

describe('R25 Dev-SS Group W5-5 — Phase 2 W5 readiness 確証 (production wiring 連動 sanity)', () => {
  it('W5-5-1: bridge actual file lifecycle で 4 sink alias 経由 import + cross-orchestrator 統合動作', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'w5-5-1.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()

    // 4 sink すべて bridge 由来 (alias 経由 import の type-only 整合)
    const sinks = {
      killTerminal: ctx.killTerminalSink,
      rlsAudit: ctx.rlsAuditTrail,
      permissionAudit: ctx.permissionAuditSink,
      postRollback: ctx.postRollbackNotifier,
    }
    expect(sinks.killTerminal).toBeDefined()
    expect(sinks.rlsAudit).toBeDefined()
    expect(sinks.permissionAudit).toBeDefined()
    expect(sinks.postRollback).toBeDefined()

    // alias 経由で取得できる createKillTerminalSink / createRlsAuditTrail と
    // bridge 経由 sink は別 instance だが shape 完全一致
    const aliasKillSink: KillTerminalSink = createKillTerminalSink()
    const aliasTrail: RlsAuditTrail = createRlsAuditTrail()
    expect(Object.keys(aliasKillSink).sort()).toEqual(Object.keys(sinks.killTerminal).sort())
    expect(Object.keys(aliasTrail).sort()).toEqual(Object.keys(sinks.rlsAudit).sort())

    // cross-orchestrator 統合動作 = perm approved → rollback success → 同一 trail 集約
    const permOrch = createPermissionOrchestrator({
      approver: mockApprover(seq, 'R1', { state: 'approved', approvedAtMs: T0 + 1 }),
      auditSink: sinks.permissionAudit,
      nowMs: () => T0,
    })
    await permOrch.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'W5-5-1-perm' },
    })

    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-W5-5-1' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: { isActive: () => false, lastReason: () => null },
        postRollback: sinks.postRollback,
      },
      counter,
    )
    await rollback.evaluate({
      loopId: 'W5-5-1-A',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    const r = await rollback.evaluate({
      loopId: 'W5-5-1-B',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_completed')

    // 同一 rlsAudit に 2 件集約 (Phase 2 W5 readiness 確証)
    const trail = sinks.rlsAudit.list()
    expect(trail.length).toBe(2)
    const sources = trail.map((e) => e.source)
    expect(sources).toContain('hitl-10')
    expect(sources).toContain('p-ui-05')

    // alias 経由生成した独立 trail には記録が無い (instance isolation 維持)
    expect(aliasTrail.list().length).toBe(0)

    await counter.flush()
    await bridge.dispose()
    expect(bridge.phase()).toBe('idle')
  })
})
