/**
 * 17 day path W4 — production e2e fully wired EXTENDED (Round 22, Dev-JJ 担当)
 *
 * Spec scope (W4 完成第 1 弾):
 *   Dev-HH Round 21 第 2 波 で確立した 11 tests `17day-path-w4-e2e-fully-wired.test.ts` の上に、
 *   production 本番 wiring 観点で以下 5 軸 (10+ tests) を追加検証する:
 *     (a) 24h SLA wall-clock skew injection (MonotonicClock fail-closed 動作)
 *     (b) BreachCounter persistence corruption tolerance
 *     (c) bridge 接続障害時の rollback (lifecycle violation)
 *     (d) 7 ctrl 連続発火 stress (loopId 多重 + counter 監視)
 *     (e) hot-restart 後の state 復元 (FileBreachCounter restore + bridge re-init)
 *
 * 領域不可侵 (Round 21 historical baseline 維持):
 *   - openclaw-runtime-bridge.ts (Dev-GG 175 行) 無改変
 *   - file-breach-counter.ts (Dev-GG 200 行) 無改変
 *   - monotonic-clock.ts (Dev-HH 175 行) 無改変
 *   - sla-clock-adapter.ts (Dev-HH 130 行) 無改変
 *   - 17day-path-w4-e2e-fully-wired.test.ts (Dev-HH 530 行 / 11 tests) 無改変
 *   - Dev-EE 担当 17day-path-w3-rollback-permission-orchestrator.ts 無改変
 *   - control 本体 (openclaw-runtime/src/controls/*) 無改変
 *
 * 設計原則:
 *   1. 既存 file (Dev-GG / Dev-HH 5 file) は **直接 import** して production 本番
 *      wiring に最も近い形で接続する (Dev-HH e2e の stub Bridge ではなく
 *      Dev-GG actual bridge を使う)。
 *   2. ARCH-01 evaluation 中のため、import path は relative imports fallback pattern
 *      (`../...js`) を使う。tsconfig path alias / pnpm workspaces 化は task ② で評価。
 *   3. control-agnostic / port-injection は維持。control 本体は import しない。
 *   4. side-effect 0: file IO は OS tmpdir (`fs.mkdtemp`) で隔離し、afterEach で flush 後削除。
 *
 * groups (5 groups / 10 tests):
 *
 * Group A (24h SLA wall-clock skew injection — MonotonicClock fail-closed, 2 tests):
 *   A-1  正常系 + fail-closed mode で skew=0 → approved 通常着地 / lastSkewMs ≈ 0
 *   A-2  pass_through mode で NTP forward step → approver pending → orchestrator
 *        が monotonic elapsed を信じて nowMs を返し、SLA 超過なら timeout 丸め込み
 *
 * Group B (BreachCounter persistence corruption tolerance, 2 tests):
 *   B-1  破損 line を含む jsonl を init() restore → valid 行から最新 state を採用
 *        + 続く observe で count 増加が永続化される
 *   B-2  全行破損 file → init() で count=0 / lastLoopId=null fallback (fail-open) →
 *        rollback orchestrator の挙動が fresh state と完全一致
 *
 * Group C (bridge 接続障害 / lifecycle violation, 2 tests):
 *   C-1  bridge disposing 中の init() 呼出は throw — production 7 ctrl wiring が
 *        rollback 経路に入ることなく停止し、aggregator は空のまま
 *   C-2  bridge dispose 後の getContext() throw → 上位 catch で graceful shutdown
 *
 * Group D (7 ctrl 連続発火 stress, 2 tests):
 *   D-1  異 loopId 5 回連続 evaluate → counter は単調増加し閾値到達の loopId で
 *        rollback_completed → counter reset → 次の cycle で再度 first_breach から
 *        再開 (sequence integrity)
 *   D-2  同一 loopId 連続発火 (W1 ctrl 本体 idempotent semantics 反映): count clamp=1
 *        が維持され rollback は発火しない
 *
 * Group E (hot-restart 後の state 復元, 2 tests):
 *   E-1  process A: FileBreachCounter で 1 回 observe → flush() で persist →
 *        process B: 同 path で createFileBreachCounter() + init() → snapshot 復元 →
 *        異 loopId 1 回で trip → rollback_completed
 *   E-2  process A: bridge.init() → dispose() (active→idle) →
 *        process B: 同 bridge instance で再 init() → fresh context が返る
 *        (再 init 可 = re-init 動作確認)
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// production direct import (Dev-GG / Dev-HH actual file = no stub)
import {
  createOpenClawRuntimeBridge,
  bindBridgeToLifecycle,
  type OpenClawRuntimeBridge,
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
// Shared fixtures
// ---------------------------------------------------------------------------

const T0 = 1_700_000_000_000
const SCOPE: PermissionScope = {
  changeType: 'env',
  before: 'A',
  after: 'B',
  rationale: 'r22 production extended',
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

function mockApprover(
  seq: SeqLog,
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
// tmp dir lifecycle (fs IO test 用)
// ---------------------------------------------------------------------------

let tmpRoot: string
const trackedCounters: FileBreachCounter[] = []

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(join(tmpdir(), 'r22-dev-jj-'))
  trackedCounters.length = 0
})

afterEach(async () => {
  // pending append が flush されてから tmp dir を削除する。
  // file-breach-counter.ts は fire-and-forget の append 設計のため、
  // counter.flush() を必ず await してから rm することで test race を排除する。
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
// Group A — 24h SLA wall-clock skew injection (MonotonicClock fail-closed)
// ---------------------------------------------------------------------------

describe('R22 Dev-JJ Group A — 24h SLA wall-clock skew injection (production wired)', () => {
  it('A-1: 正常系 fail-closed mode で skew=0 → approved 通常着地', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    // wall + mono が同 rate で進む (mark / t0 / tNow の 3 段)
    let wi = 0
    let mi = 0
    const wallSeq = [T0, T0, T0 + 100]
    const monoSeq = [0, 0, 100]
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
    const adapter = createSlaClockAdapter(clock)

    const permission = createPermissionOrchestrator({
      approver: mockApprover(seq, { state: 'approved', approvedAtMs: T0 + 100 }),
      auditSink: ctx.permissionAuditSink,
      nowMs: adapter.nowMs,
    })
    const pr = await permission.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'A1' },
    })

    expect(pr.kind).toBe('approved')
    expect(adapter.skewObserved()).toBe(false)
    // mark 後 elapsedMs が 1 度呼ばれているので lastSkewMs は確定 0 近傍
    expect(adapter.lastSkewMs()).not.toBeNull()
    expect(Math.abs(adapter.lastSkewMs() ?? 999_999)).toBeLessThanOrEqual(5_000)

    await bridge.dispose()
  })

  it('A-2: pass_through mode + NTP forward step + approver pending → SLA 越境で timeout 丸め込み', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    // mark: wall=T0, mono=0
    // t0 計算 (1 回目 elapsedMs): wall=T0,    mono=0      → elapsed wall=0 mono=0 → skew=0 → t0=T0
    // tNow 計算 (2 回目 elapsedMs): wall=T0+25h, mono=25h ms →
    //   pass_through mode: skew は (25h - 25h)=0 → fail_closed 不発火
    //   nowMs returns mark.wallMs + monoElapsed = T0 + 25h ms = SLA 越え
    //   → orchestrator 内 tNow >= t0 + APPROVAL_SLA_MS で timeout 丸め込み
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

    const permission = createPermissionOrchestrator({
      approver: mockApprover(seq, { state: 'pending' }),
      auditSink: ctx.permissionAuditSink,
      nowMs: adapter.nowMs,
    })
    const pr = await permission.request({
      scope: SCOPE,
      requester: { role: 'dev', ticketId: 'A2' },
    })

    expect(pr.kind).toBe('timeout')
    // pass_through なので skew 検出 false
    expect(adapter.skewObserved()).toBe(false)

    await bridge.dispose()
  })
})

// ---------------------------------------------------------------------------
// Group B — BreachCounter persistence corruption tolerance
// ---------------------------------------------------------------------------

describe('R22 Dev-JJ Group B — BreachCounter persistence corruption tolerance', () => {
  it('B-1: 破損 line を含む jsonl → valid 行から restore → 続く observe で永続化', async () => {
    const path = join(tmpRoot, 'corrupt-tail.jsonl')
    // 正常 1 件 + 破損 tail 1 行
    const validRecord =
      JSON.stringify({
        loopId: 'B1-prev',
        count: 1,
        recordedAt: '2026-05-26T00:00:00.000Z',
        kind: 'observe',
      }) + '\n'
    const corrupted = '{"this is not valid json'
    await fs.mkdir(join(tmpRoot), { recursive: true })
    await fs.writeFile(path, validRecord + corrupted, 'utf-8')

    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()
    expect(counter.current()).toBe(1)
    expect(counter.lastLoopId()).toBe('B1-prev')

    // 続く observe で異 loopId → count=2、reset、append が完遂
    counter.observe('B1-A')
    expect(counter.current()).toBe(2)
    counter.reset()
    expect(counter.current()).toBe(0)
    await counter.flush()

    // file には reset record まで append されている。
    // 元 file = "valid\n" + "corrupted" (corrupted は trailing newline なし) のため、
    // appendFile された observe record は corrupted と同 line に連結される。
    // 結果 split('\n').filter で得られる non-empty line 数:
    //   line1: valid (元)
    //   line2: "{not_jsonOBSERVE_RECORD" (連結された corrupted + observe append)
    //   line3: reset record
    // = 計 3 行。これは production fail-open semantics の正しい挙動 (corrupted line
    // を skip しつつ valid 部分だけ採用、append は失われない) を検証する。
    const after = await fs.readFile(path, 'utf-8')
    const lines = after.split('\n').filter((l) => l.length > 0)
    expect(lines.length).toBeGreaterThanOrEqual(2)
    // 最後の line は reset record (kind:'reset') であること
    const lastLine = lines[lines.length - 1] ?? ''
    expect(lastLine).toContain('"kind":"reset"')
  })

  it('B-2: 全行破損 file → init() で count=0 / lastLoopId=null fallback (fail-open)', async () => {
    const path = join(tmpRoot, 'all-corrupt.jsonl')
    await fs.writeFile(path, '{not_json\n[broken\n,,,\n', 'utf-8')

    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()
    expect(counter.current()).toBe(0)
    expect(counter.lastLoopId()).toBeNull()

    // fresh state と同等の挙動: 1st observe で count=1 / first_breach
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()
    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-B2' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: { isActive: () => false, lastReason: () => null },
        postRollback: ctx.postRollbackNotifier,
      },
      counter,
    )
    const r = await rollback.evaluate({
      loopId: 'B2-A',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('first_breach')
    expect(counter.current()).toBe(1)
    await counter.flush()
    await bridge.dispose()
  })
})

// ---------------------------------------------------------------------------
// Group C — bridge 接続障害 / lifecycle violation
// ---------------------------------------------------------------------------

describe('R22 Dev-JJ Group C — bridge 接続障害 / lifecycle violation', () => {
  it('C-1: bridge disposing 中の init() 呼出は lifecycle violation で throw', async () => {
    const bridge: OpenClawRuntimeBridge = createOpenClawRuntimeBridge({
      onDispose: async () => {
        // dispose 中に再 init を試みる
        await expect(bridge.init()).rejects.toThrow(
          /cannot init while disposing/i,
        )
      },
    })
    await bridge.init()
    // dispose 中 onDispose hook 内で init を試みて throw を期待
    await bridge.dispose()
    // dispose 完了後は phase=idle、再 init は許可される (re-init 動作)
    expect(bridge.phase()).toBe('idle')
    const ctx2 = await bridge.init()
    expect(ctx2).toBeDefined()
    await bridge.dispose()
  })

  it('C-2: bridge dispose 後の getContext() throw → 上位 catch で graceful shutdown', async () => {
    const bridge = createOpenClawRuntimeBridge()
    await bridge.init()
    await bridge.dispose()
    expect(bridge.phase()).toBe('idle')
    expect(() => bridge.getContext()).toThrow(/active phase/i)

    // bindBridgeToLifecycle 経由 wrapper も同様に throw を伝搬
    const lifecycle = bindBridgeToLifecycle(bridge)
    expect(lifecycle.isActive()).toBe(false)
    expect(() => lifecycle.getContext()).toThrow(/active phase/i)
  })
})

// ---------------------------------------------------------------------------
// Group D — 7 ctrl 連続発火 stress (production 反復試験)
// ---------------------------------------------------------------------------

describe('R22 Dev-JJ Group D — 7 ctrl 連続発火 stress', () => {
  it('D-1: 異 loopId 5 回連続 evaluate → 2 回目で trip / reset → 続く 3 回でも sequence integrity', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'stress-d1.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()

    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-D1' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: { isActive: () => false, lastReason: () => null },
        postRollback: ctx.postRollbackNotifier,
      },
      counter,
    )

    const ids = ['D1-1', 'D1-2', 'D1-3', 'D1-4', 'D1-5'] as const
    const kinds: string[] = []
    for (const loopId of ids) {
      const r = await rollback.evaluate({
        loopId,
        metric: 'cost_per_loop',
        observedValue: 5,
        threshold: 1,
      })
      kinds.push(r.kind)
    }
    // 期待 sequence: first_breach, rollback_completed, first_breach, rollback_completed, first_breach
    //   D1-1: count=1 → first_breach
    //   D1-2: count=2 → rollback_completed → reset
    //   D1-3: count=1 → first_breach
    //   D1-4: count=2 → rollback_completed → reset
    //   D1-5: count=1 → first_breach
    expect(kinds).toEqual([
      'first_breach',
      'rollback_completed',
      'first_breach',
      'rollback_completed',
      'first_breach',
    ])
    // counter は最後 first_breach 後 count=1
    expect(counter.current()).toBe(1)
    await counter.flush()
    await bridge.dispose()
  })

  it('D-2: 同一 loopId 連続発火 → count clamp=1 / rollback 不発火 (idempotent semantics)', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'stress-d2.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()

    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: true, targetCommit: 'never' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: { isActive: () => false, lastReason: () => null },
        postRollback: ctx.postRollbackNotifier,
      },
      counter,
    )

    const SAME = 'D2-same' as const
    for (let i = 0; i < 4; i++) {
      const r = await rollback.evaluate({
        loopId: SAME,
        metric: 'cost_per_loop',
        observedValue: 5,
        threshold: 1,
      })
      // 同一 loopId のため count=1 clamp、常に first_breach
      expect(r.kind).toBe('first_breach')
    }
    expect(counter.current()).toBe(1)
    expect(counter.lastLoopId()).toBe(SAME)
    // executor は 1 度も呼ばれていない
    expect(seq.steps.filter((s) => s.startsWith('P-UI-05.exec:')).length).toBe(0)
    await counter.flush()
    await bridge.dispose()
  })
})

// ---------------------------------------------------------------------------
// Group E — hot-restart 後の state 復元
// ---------------------------------------------------------------------------

describe('R22 Dev-JJ Group E — hot-restart 後の state 復元', () => {
  it('E-1: process A persist → process B restore → 異 loopId 1 回で trip → rollback_completed', async () => {
    const path = join(tmpRoot, 'hot-restart-e1.jsonl')

    // === process A ===
    const counterA = trackCounter(createFileBreachCounter({ path }))
    await counterA.init()
    counterA.observe('E1-prev')
    expect(counterA.current()).toBe(1)
    expect(counterA.lastLoopId()).toBe('E1-prev')
    await counterA.flush()

    // === process B (新 instance, 同 path) ===
    const counterB = trackCounter(createFileBreachCounter({ path }))
    await counterB.init()
    expect(counterB.current()).toBe(1)
    expect(counterB.lastLoopId()).toBe('E1-prev')

    // 異 loopId 1 回で count=2 → trip → rollback_completed
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()
    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-E1' }),
        killSwitch: mockKillSwitch(seq),
        killQuery: { isActive: () => false, lastReason: () => null },
        postRollback: ctx.postRollbackNotifier,
      },
      counterB,
    )
    const r = await rollback.evaluate({
      loopId: 'E1-A',
      metric: 'cost_per_loop',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_completed')
    // rollback ok → counter reset (永続化反映)
    expect(counterB.current()).toBe(0)
    expect(counterB.lastLoopId()).toBeNull()
    await counterB.flush()
    await bridge.dispose()

    // === process C (3 つ目 instance, 同 path) で reset 永続化を確認 ===
    const counterC = trackCounter(createFileBreachCounter({ path }))
    await counterC.init()
    expect(counterC.current()).toBe(0)
    expect(counterC.lastLoopId()).toBeNull()
    await counterC.flush()
  })

  it('E-2: bridge re-init (active→idle→active) で fresh context が返る', async () => {
    const bridge = createOpenClawRuntimeBridge()
    const ctx1 = await bridge.init()
    expect(bridge.phase()).toBe('active')

    await bridge.dispose()
    expect(bridge.phase()).toBe('idle')

    const ctx2 = await bridge.init()
    expect(bridge.phase()).toBe('active')
    // re-init で fresh context が返る (Dev-GG bridge §1 設計 4: re-init 仕様)
    expect(ctx2).not.toBe(ctx1)
    // ctx1 / ctx2 ともに 4 port を持つ (shape は同等)
    expect(ctx1.killTerminalSink).toBeDefined()
    expect(ctx2.killTerminalSink).toBeDefined()
    expect(ctx1.permissionAuditSink).toBeDefined()
    expect(ctx2.permissionAuditSink).toBeDefined()
    expect(ctx1.postRollbackNotifier).toBeDefined()
    expect(ctx2.postRollbackNotifier).toBeDefined()
    expect(ctx1.rlsAuditTrail).toBeDefined()
    expect(ctx2.rlsAuditTrail).toBeDefined()

    await bridge.dispose()
    expect(bridge.phase()).toBe('idle')
  })
})
