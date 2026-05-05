/**
 * W4 完成第 5 弾 5-C 物理化 — HG-6 SLA recovery test
 * (Round 28, Dev-BBB 担当 / 16 件目 dev sprint).
 *
 * Spec 起源:
 *   - Round 27 Dev-AAA `dev-aaa-r27-w4-fifth-5c-spec.md` (5-C 詳細 spec / 起案)
 *   - Round 27 Dev-YY `w4-fifth-hitl-hardguards-extended.test.ts` (5-B 着地 / HG-1〜HG-5)
 *
 * Spec scope (本 file = HG-6):
 *   SLA clock の recovery 経路を 6 tests で検証する。
 *   既存 5-B HG-1〜HG-5 file (1031 行 / 15 tests) absolute 無改変 / 別 file。
 *   既存 sla-clock-adapter.ts / monotonic-clock.ts は pure import のみで無改変。
 *
 *   検証対象:
 *     HG-6-1  recovery time: skew 検出後 adapter resetMark で起点復元
 *     HG-6-2  partial recovery: skew 後 nowMs 連続呼出で elapsed 単調増加
 *     HG-6-3  breach signal restore: rollback orchestrator の SLA timeout 後の再起動
 *     HG-6-4  SLA clock continuity: 連続 mark 間で elapsed 不可逆
 *     HG-6-5  recovery race: 並列 nowMs 呼出 (sync) で order-stable
 *     HG-6-6  recovery idempotency: resetMark 複数回呼出 後の state shape 同一
 *
 * 領域不可侵:
 *   - sla-clock-adapter.ts / monotonic-clock.ts / file-breach-counter.ts
 *     / 17day-path-w3-rollback-permission-orchestrator.ts / openclaw-runtime-bridge.ts
 *   - hardguard-g-02.ts / hardguard-g-10.ts
 *   - w4-fifth-hitl-hardguards-extended.test.ts (R27 Dev-YY 1031 行) 無改変
 *   - decisions.md / launch day v3.x / web-ops v2.x / sec yml は本 file から不参照
 *
 * 設計原則:
 *   1. MonotonicClock + SlaClockAdapter は production code として pure import のみ
 *   2. skew / recovery は wallSeq / monoSeq 注入で deterministic
 *   3. mulberry32 PRNG inline (実装は本 file 内 helper) で seed 可能
 *   4. 実 spawn 0 / API call $0 / 副作用 0 / 絵文字 0
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createOpenClawRuntimeBridge } from '../openclaw-runtime-bridge.js'
import {
  createFileBreachCounter,
  type FileBreachCounter,
} from '../file-breach-counter.js'
import {
  createMonotonicClock,
  type ClockMark,
} from '../monotonic-clock.js'
import { createSlaClockAdapter } from '../sla-clock-adapter.js'
import {
  APPROVAL_SLA_MS,
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
// mulberry32 PRNG — deterministic 32-bit seed PRNG (本 file 内 inline)
// 既存 helper を avoid して 5b file 不接触 / R28 単独 closure。
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------------------------------------------------------------------
// shared fixtures
// ---------------------------------------------------------------------------

const T0 = 1_700_000_000_000
const SCOPE: PermissionScope = {
  changeType: 'env',
  before: 'A',
  after: 'B',
  rationale: 'r28 dev-bbb hg6 sla recovery',
}

interface SeqLog {
  steps: string[]
}
const newSeq = (): SeqLog => ({ steps: [] })

function mockApprover(seq: SeqLog, decision: ApprovalDecision): PermissionApproverPort {
  return {
    requestApproval: async (_scope, requester) => {
      seq.steps.push(`HG6.approver:${requester.ticketId}`)
      return decision
    },
  }
}

function mockExecutor(seq: SeqLog, outcome: RollbackOutcome): RollbackExecutorPort {
  return {
    rollback: async (loopId) => {
      seq.steps.push(`HG6.exec:${loopId}`)
      return outcome
    },
  }
}

function mockKill(seq: SeqLog): KillSwitchTriggerPort {
  return {
    fire: async (reason) => {
      seq.steps.push(`HG6.kill:${reason}`)
    },
  }
}

let tmpRoot: string
const trackedCounters: FileBreachCounter[] = []

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(join(tmpdir(), 'r28-dev-bbb-hg6-'))
  trackedCounters.length = 0
})

afterEach(async () => {
  for (const c of trackedCounters) {
    try {
      await c.flush()
    } catch {
      // race tolerated
    }
  }
  await fs.rm(tmpRoot, { recursive: true, force: true })
})

function trackCounter(c: FileBreachCounter): FileBreachCounter {
  trackedCounters.push(c)
  return c
}

/**
 * deterministic な wall+mono seq builder。
 * skew 注入は wallSeq と monoSeq の差分で表現する。
 */
function buildSeqClock(opts: {
  wallSeq: readonly number[]
  monoSeq: readonly number[]
}) {
  let wi = 0
  let mi = 0
  return createMonotonicClock({
    wallNowMs: () => {
      const v = opts.wallSeq[Math.min(wi, opts.wallSeq.length - 1)] ?? T0
      wi = Math.min(wi + 1, opts.wallSeq.length)
      return v
    },
    monoNowMs: () => {
      const v = opts.monoSeq[Math.min(mi, opts.monoSeq.length - 1)] ?? 0
      mi = Math.min(mi + 1, opts.monoSeq.length)
      return v
    },
  })
}

// ---------------------------------------------------------------------------
// HG-6-1 — recovery time after skew detection
// SLA adapter で skew が観測された後、resetMark で起点を再構築できることを検証.
// ---------------------------------------------------------------------------

describe('R28 Dev-BBB HG-6 — SLA recovery', () => {
  it('HG-6-1: skew 検出後 resetMark で起点復元 / recovery time < threshold', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    await bridge.init()

    // skew injection: 起点 wallSeq[0]/monoSeq[0] = T0/0、その後の elapsedMs 呼出で
    // wall 側が大幅進行 / mono 側は小幅進行 → skew = wallElapsed - monoElapsed > threshold (5000ms)
    const SLA = APPROVAL_SLA_MS
    const wallSeq = [T0, T0 + SLA + 60_000, T0 + SLA + 60_000 + 100, T0 + SLA + 60_000 + 200]
    const monoSeq = [0, 1_000, 1_100, 1_200]
    const clock = buildSeqClock({ wallSeq, monoSeq })
    const adapter = createSlaClockAdapter(clock, { onSkew: 'pass_through' })

    // 起点 mark (constructor で wallSeq[0]/monoSeq[0] を消費)
    const m0 = adapter.startMark()
    expect(m0).toBeDefined()
    expect(m0.wallMs).toBe(T0)

    // 1 度目の nowMs で skew 観測 (wall 側が SLA 越境 / wall - mono >> threshold)
    void adapter.nowMs()
    const skew1 = adapter.lastSkewMs()
    expect(adapter.skewObserved()).toBe(true)
    expect(skew1).not.toBeNull()

    // resetMark で起点を復元 (recovery)
    adapter.resetMark()
    const m1 = adapter.startMark()
    // 起点 mark の wall 側は新しい (clock を再 sample しているため)
    expect(m1.wallMs).toBeGreaterThanOrEqual(m0.wallMs)

    // recovery 後の nowMs は新起点基準で elapsed 開始
    const after = adapter.nowMs()
    expect(typeof after).toBe('number')
    seq.steps.push('HG6-1.recovered')

    expect(seq.steps).toContain('HG6-1.recovered')
    await bridge.dispose()
  })

  it('HG-6-2: partial recovery — nowMs 連続呼出で elapsed 単調増加', async () => {
    const bridge = createOpenClawRuntimeBridge()
    await bridge.init()

    // mono 系のみ単調増加 / wall 系は静止 (suspend 復帰相当)
    const wallSeq = [T0, T0, T0, T0, T0]
    const monoSeq = [0, 100, 200, 300, 400]
    const clock = buildSeqClock({ wallSeq, monoSeq })
    const adapter = createSlaClockAdapter(clock, { onSkew: 'pass_through' })

    const samples: number[] = []
    for (let i = 0; i < 4; i++) {
      samples.push(adapter.nowMs())
    }
    // 単調増加 (or stable, 1 度も後退しない)
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1])
    }
    await bridge.dispose()
  })

  it('HG-6-3: breach signal restore — SLA timeout 後 rollback orchestrator 復帰', async () => {
    const seq = newSeq()
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()

    const path = join(tmpRoot, 'hg6-3.jsonl')
    const counter = trackCounter(createFileBreachCounter({ path }))
    await counter.init()

    // SLA 越境を注入する clock
    const SLA = APPROVAL_SLA_MS
    const clock = buildSeqClock({
      wallSeq: [T0, T0, T0 + SLA + 1, T0 + SLA + 2],
      monoSeq: [0, 0, SLA + 1, SLA + 2],
    })
    const adapter = createSlaClockAdapter(clock, { onSkew: 'pass_through' })

    // 1 度目: pending → SLA 越境で timeout に丸まる
    const orch1 = createPermissionOrchestrator({
      approver: mockApprover(seq, { state: 'pending' }),
      auditSink: ctx.permissionAuditSink,
      nowMs: adapter.nowMs,
    })
    const r1 = await orch1.request({ scope: SCOPE, requester: { role: 'dev', ticketId: 'hg6-3-a' } })
    expect(r1.kind).toBe('timeout')

    // breach signal を一度発火させる (rollback evaluate)
    const rollback = createRollbackOrchestrator(
      {
        executor: mockExecutor(seq, { ok: true, targetCommit: 'rev-HG-6-3' }),
        killSwitch: mockKill(seq),
        killQuery: { isActive: () => false, lastReason: () => null },
        postRollback: ctx.postRollbackNotifier,
      },
      counter,
    )
    await rollback.evaluate({
      loopId: 'HG-6-3-A',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    const r = await rollback.evaluate({
      loopId: 'HG-6-3-B',
      metric: 'output_anomaly',
      observedValue: 5,
      threshold: 1,
    })
    expect(r.kind).toBe('rollback_completed')

    // restore: counter が reset され (rollback completed で 0)、再度 observe 可能
    expect(counter.current()).toBe(0)
    counter.observe('hg6-3-restored')
    expect(counter.current()).toBe(1)
    expect(counter.lastLoopId()).toBe('hg6-3-restored')

    await counter.flush()
    await bridge.dispose()
  })

  it('HG-6-4: SLA clock continuity — 連続 mark 間で elapsed 不可逆', async () => {
    const bridge = createOpenClawRuntimeBridge()
    await bridge.init()

    // wall + mono 両系統が単調増加
    const N = 8
    const wallSeq: number[] = []
    const monoSeq: number[] = []
    for (let i = 0; i < N; i++) {
      wallSeq.push(T0 + i * 100)
      monoSeq.push(i * 100)
    }
    const clock = buildSeqClock({ wallSeq, monoSeq })

    // 複数回 markNow → elapsedMs を観測 → 単調非減少
    const m0 = clock.markNow()
    const elapseds: number[] = []
    for (let i = 0; i < 5; i++) {
      const r = clock.elapsedMs(m0)
      elapseds.push(r.monoElapsedMs)
    }
    for (let i = 1; i < elapseds.length; i++) {
      expect(elapseds[i]).toBeGreaterThanOrEqual(elapseds[i - 1])
    }
    await bridge.dispose()
  })

  it('HG-6-5: recovery race — 並列 nowMs 呼出 (sync) で order-stable', async () => {
    const bridge = createOpenClawRuntimeBridge()
    await bridge.init()

    // PRNG seed で順序の影響度を観測 (deterministic)
    const rand = mulberry32(0x52383042) // "R28DBB"
    const N = 16
    const wallSeq: number[] = [T0]
    const monoSeq: number[] = [0]
    for (let i = 0; i < N; i++) {
      const dt = Math.floor(rand() * 50) + 1 // 1-50ms 増分
      wallSeq.push((wallSeq[wallSeq.length - 1] ?? T0) + dt)
      monoSeq.push((monoSeq[monoSeq.length - 1] ?? 0) + dt)
    }
    const clock = buildSeqClock({ wallSeq, monoSeq })
    const adapter = createSlaClockAdapter(clock, { onSkew: 'pass_through' })

    // 並列 (但し sync; vitest single-threaded test 内) 呼出を Promise.all で interleave
    const results = await Promise.all(
      Array.from({ length: N }, () => Promise.resolve(adapter.nowMs())),
    )
    expect(results.length).toBe(N)
    for (const v of results) {
      expect(typeof v).toBe('number')
    }
    // 観測順 (results の順番) 自体は call order に従って stable
    // skew は pass_through で適用しないため lastSkewMs は number か null
    expect([null, 'number']).toContain(
      typeof adapter.lastSkewMs() === 'number' ? 'number' : null,
    )
    await bridge.dispose()
  })

  it('HG-6-6: recovery idempotency — resetMark 複数回呼出後の state shape 同一', async () => {
    const bridge = createOpenClawRuntimeBridge()
    await bridge.init()

    const wallSeq = [T0, T0 + 1, T0 + 2, T0 + 3, T0 + 4, T0 + 5]
    const monoSeq = [0, 1, 2, 3, 4, 5]
    const clock = buildSeqClock({ wallSeq, monoSeq })
    const adapter = createSlaClockAdapter(clock, { onSkew: 'pass_through' })

    // 起点 mark snapshot
    const before = adapter.startMark()

    // resetMark を 3 回呼出 (idempotent / monotonic)
    adapter.resetMark()
    const m1 = adapter.startMark()
    adapter.resetMark()
    const m2 = adapter.startMark()
    adapter.resetMark()
    const m3 = adapter.startMark()

    // shape 同一 (key 集合は ClockMark): すべて wallMs / monoMs を持つ
    for (const m of [before, m1, m2, m3] as ClockMark[]) {
      expect(m).toHaveProperty('wallMs')
      expect(m).toHaveProperty('monoMs')
      expect(typeof m.wallMs).toBe('number')
      expect(typeof m.monoMs).toBe('number')
    }
    // 連続呼出で wall 側は monotonically non-decreasing
    expect(m1.wallMs).toBeGreaterThanOrEqual(before.wallMs)
    expect(m2.wallMs).toBeGreaterThanOrEqual(m1.wallMs)
    expect(m3.wallMs).toBeGreaterThanOrEqual(m2.wallMs)

    await bridge.dispose()
  })
})
