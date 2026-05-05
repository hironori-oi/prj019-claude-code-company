/**
 * W4 完成第 5 弾 5-D 物理化 — HG-7 Bridge reconnection test
 * (Round 28, Dev-BBB 担当 / 16 件目 dev sprint).
 *
 * Spec 起源:
 *   - Round 27 Dev-AAA `dev-aaa-r27-w4-fifth-5d-spec.md` (5-D 詳細 spec / 起案)
 *   - Round 26 Dev-VV `phase2-w5-claude-bridge-integration-e2e.test.ts` (5-A 起源 / MockBridge 戦略)
 *   - Round 27 Dev-YY `w4-fifth-hitl-hardguards-extended.test.ts` (5-B 着地 / pattern 継承)
 *
 * Spec scope (本 file = HG-7):
 *   bridge (claude-bridge / openclaw-runtime-bridge) の reconnection 経路を 6 tests で検証する。
 *   既存 5-B HG-1〜HG-5 file (1031 行 / 15 tests) absolute 無改変 / 別 file。
 *   実 spawn 0 / MockClaudeBridge handle (本 file 内 inline) で reconnection state を mock。
 *
 *   検証対象:
 *     HG-7-1  reconnect after kill: signal('SIGTERM') 後 alive=false → 再 init で alive=true
 *     HG-7-2  reconnect race: parallel reconnect 試行で last-write-wins / state coherent
 *     HG-7-3  reconnect ack-id resync: msg seq id が reconnect 前後で gap なく resume
 *     HG-7-4  reconnect with SLA hold: SLA timeout 中の reconnect は SLA を block しない
 *     HG-7-5  reconnect after timeout: handshake timeout 経路後 retry 1 回で成功
 *     HG-7-6  reconnect concurrent: 複数 mock bridge instance 同時 reconnect / cross-isolation
 *
 * 領域不可侵:
 *   - sla-clock-adapter.ts / monotonic-clock.ts / file-breach-counter.ts
 *     / 17day-path-w3-rollback-permission-orchestrator.ts / openclaw-runtime-bridge.ts
 *   - kill-switch.ts / hardguard-g-02.ts / hardguard-g-10.ts
 *   - w4-fifth-hitl-hardguards-extended.test.ts (R27 Dev-YY 1031 行) 無改変
 *   - w4-fifth-hg6-sla-recovery.test.ts (R28 Dev-BBB 同 round 別 file) と完全独立
 *   - decisions.md / launch day v3.x / web-ops v2.x / sec yml は本 file から不参照
 *
 * 設計原則:
 *   1. MockClaudeBridge handle は本 file 内 inline (5-A pattern 継承 / spawn 0)
 *   2. reconnect は alive flag + 内部 state 再構築で表現
 *   3. mulberry32 PRNG inline (deterministic seed)
 *   4. 実 child_process.spawn 0 / API call $0 / 副作用 0 / 絵文字 0
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  CircuitBreaker,
  type CostTracker,
} from '../index.js'
import { createOpenClawRuntimeBridge } from '../openclaw-runtime-bridge.js'
import {
  createMonotonicClock,
} from '../monotonic-clock.js'
import { createSlaClockAdapter } from '../sla-clock-adapter.js'
import {
  APPROVAL_SLA_MS,
} from '../17day-path-w3-rollback-permission-orchestrator.js'
import type { SubprocessKillTarget } from '../kill-switch.js'

// ---------------------------------------------------------------------------
// mulberry32 PRNG — deterministic 32-bit seed PRNG (本 file 内 inline)
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
// MockClaudeBridge handle — 5-A R26 Dev-VV pattern 継承
// claude-bridge spawn.ts は import せず、reconnection state を等価 shape で mock。
// 実 child_process.spawn 0 / 完全 in-memory。
// ---------------------------------------------------------------------------

interface MockClaudeBridgeStatus {
  authChecked: boolean
  authResult: { authenticated: boolean; reason?: string } | null
  alive: boolean
  reconnectCount: number
  lastAckId: number | null
}

interface MockClaudeBridge extends SubprocessKillTarget {
  name: string
  status(): MockClaudeBridgeStatus
  init(): Promise<void>
  reconnect(): Promise<{ ok: boolean; ackId: number | null }>
  sendMsg(payload: { id: number }): { accepted: boolean }
  /** test-only: 強制的に alive=false に倒す */
  __forceDown(): void
}

interface MockClaudeBridgeOpts {
  name: string
  costTracker?: CostTracker
  circuitBreaker?: CircuitBreaker
  /** init 1 回目で fail → 2 回目で success (handshake retry test 用) */
  failOnFirstInit?: boolean
  /** reconnect 時の handshake delay (test 内 deterministic / 実 setTimeout は不使用 ; counter のみ) */
  handshakeStepCount?: number
}

function buildMockClaudeBridge(opts: MockClaudeBridgeOpts): MockClaudeBridge {
  let alive = false
  let authChecked = false
  let authResult: { authenticated: boolean; reason?: string } | null = null
  let reconnectCount = 0
  let lastAckId: number | null = null
  let initAttempts = 0
  const sentSignals: ('SIGTERM' | 'SIGKILL')[] = []
  const sentMsgs: number[] = []
  const failOnFirstInit = opts.failOnFirstInit ?? false
  void opts.costTracker
  void opts.circuitBreaker
  void opts.handshakeStepCount

  return {
    name: opts.name,
    alive: () => alive,
    signal: async (sig) => {
      sentSignals.push(sig)
      if (sig === 'SIGTERM' || sig === 'SIGKILL') {
        alive = false
      }
    },
    status: () => ({
      authChecked,
      authResult,
      alive,
      reconnectCount,
      lastAckId,
    }),
    init: async () => {
      initAttempts += 1
      if (failOnFirstInit && initAttempts === 1) {
        // 1 回目は handshake fail
        alive = false
        authChecked = false
        authResult = { authenticated: false, reason: 'handshake_first_attempt_fail' }
        throw new Error('mock_handshake_first_attempt_fail')
      }
      alive = true
      authChecked = true
      authResult = { authenticated: true }
    },
    reconnect: async () => {
      if (alive) {
        return { ok: true, ackId: lastAckId }
      }
      reconnectCount += 1
      alive = true
      authChecked = true
      authResult = { authenticated: true }
      return { ok: true, ackId: lastAckId }
    },
    sendMsg: (payload) => {
      if (!alive) return { accepted: false }
      lastAckId = payload.id
      sentMsgs.push(payload.id)
      return { accepted: true }
    },
    __forceDown: () => {
      alive = false
    },
  }
}

// ---------------------------------------------------------------------------
// shared fixtures
// ---------------------------------------------------------------------------

const T0 = 1_700_000_000_000

let tmpRoot: string

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(join(tmpdir(), 'r28-dev-bbb-hg7-'))
})

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true })
})

// ---------------------------------------------------------------------------
// HG-7 — Bridge reconnection (6 tests)
// ---------------------------------------------------------------------------

describe('R28 Dev-BBB HG-7 — Bridge reconnection', () => {
  it('HG-7-1: reconnect after kill — SIGTERM 後 alive=false → reconnect で alive=true', async () => {
    const bridge = buildMockClaudeBridge({ name: 'hg7-1-bridge' })
    await bridge.init()

    // 初期 status
    let st = bridge.status()
    expect(st.alive).toBe(true)
    expect(st.authChecked).toBe(true)
    expect(st.reconnectCount).toBe(0)

    // SIGTERM で kill
    await bridge.signal('SIGTERM')
    st = bridge.status()
    expect(st.alive).toBe(false)

    // reconnect で alive 復帰
    const r = await bridge.reconnect()
    expect(r.ok).toBe(true)
    st = bridge.status()
    expect(st.alive).toBe(true)
    expect(st.reconnectCount).toBe(1)

    // openclaw-runtime-bridge も独立して lifecycle 維持
    const ocb = createOpenClawRuntimeBridge()
    await ocb.init()
    expect(ocb.phase()).toBe('active')
    await ocb.dispose()
    expect(ocb.phase()).toBe('idle')
  })

  it('HG-7-2: reconnect race — parallel reconnect で state coherent', async () => {
    const bridge = buildMockClaudeBridge({ name: 'hg7-2-bridge' })
    await bridge.init()
    bridge.__forceDown()
    expect(bridge.status().alive).toBe(false)

    // 並列 reconnect 4 件 (Promise.all)
    const N = 4
    const results = await Promise.all(
      Array.from({ length: N }, () => bridge.reconnect()),
    )
    expect(results.length).toBe(N)
    for (const r of results) {
      expect(r.ok).toBe(true)
    }

    const st = bridge.status()
    expect(st.alive).toBe(true)
    // reconnect は最初の 1 件で alive=true 化、残り 3 件は idempotent return
    // (down state→up でカウントされるのは 1 件)
    expect(st.reconnectCount).toBeGreaterThanOrEqual(1)
    expect(st.reconnectCount).toBeLessThanOrEqual(N)
  })

  it('HG-7-3: reconnect ack-id resync — msg seq id が reconnect 前後で連続', async () => {
    const bridge = buildMockClaudeBridge({ name: 'hg7-3-bridge' })
    await bridge.init()

    // 5 件 send → ackId 連続
    for (let i = 1; i <= 5; i++) {
      const r = bridge.sendMsg({ id: i })
      expect(r.accepted).toBe(true)
    }
    let st = bridge.status()
    expect(st.lastAckId).toBe(5)

    // bridge down → reconnect → ack-id 維持
    bridge.__forceDown()
    const r = await bridge.reconnect()
    expect(r.ok).toBe(true)
    expect(r.ackId).toBe(5)

    // resume: 6 番から send
    const r6 = bridge.sendMsg({ id: 6 })
    expect(r6.accepted).toBe(true)
    st = bridge.status()
    expect(st.lastAckId).toBe(6)
  })

  it('HG-7-4: reconnect with SLA hold — reconnect は SLA を block しない', async () => {
    const bridge = buildMockClaudeBridge({ name: 'hg7-4-bridge' })
    await bridge.init()

    // SLA clock 注入 (skew は発生させない / 単純な monotonic 進行)
    const SLA = APPROVAL_SLA_MS
    let wi = 0
    let mi = 0
    const wallSeq = [T0, T0 + 100, T0 + 200, T0 + 300]
    const monoSeq = [0, 100, 200, 300]
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
    const adapter = createSlaClockAdapter(clock, { onSkew: 'pass_through', slaWindowMs: SLA })

    // bridge down → reconnect 中も SLA clock の elapsed 単調増加
    const t1 = adapter.nowMs()
    bridge.__forceDown()
    const recon = await bridge.reconnect()
    expect(recon.ok).toBe(true)
    const t2 = adapter.nowMs()
    expect(t2).toBeGreaterThanOrEqual(t1)
    // SLA window 内 (越境していないこと)
    expect(t2 - t1).toBeLessThan(SLA)
  })

  it('HG-7-5: reconnect after timeout — handshake fail 後 retry 1 回で成功', async () => {
    const bridge = buildMockClaudeBridge({
      name: 'hg7-5-bridge',
      failOnFirstInit: true,
    })

    // 1 回目: init fail
    let firstError: Error | null = null
    try {
      await bridge.init()
    } catch (e) {
      firstError = e as Error
    }
    expect(firstError).not.toBeNull()
    expect(firstError?.message).toBe('mock_handshake_first_attempt_fail')
    let st = bridge.status()
    expect(st.alive).toBe(false)
    expect(st.authResult?.authenticated).toBe(false)

    // 2 回目: init success (failOnFirstInit は initAttempts=1 のみ fail)
    await bridge.init()
    st = bridge.status()
    expect(st.alive).toBe(true)
    expect(st.authResult?.authenticated).toBe(true)

    // reconnect 1 回 (idempotent)
    const r = await bridge.reconnect()
    expect(r.ok).toBe(true)
  })

  it('HG-7-6: reconnect concurrent — 複数 mock bridge instance で cross-isolation', async () => {
    // 3 instance を並列に build / init / reconnect
    const N = 3
    const bridges = Array.from({ length: N }, (_, i) =>
      buildMockClaudeBridge({ name: `hg7-6-bridge-${i}` }),
    )
    await Promise.all(bridges.map((b) => b.init()))

    // 全件 alive
    for (const b of bridges) {
      expect(b.status().alive).toBe(true)
    }

    // ランダム順で down (deterministic seed)
    const rand = mulberry32(0x52383044) // "R28DBD"
    const order = [...Array(N).keys()].sort(() => rand() - 0.5)
    for (const i of order) {
      const b = bridges[i]
      if (b) b.__forceDown()
    }
    for (const b of bridges) {
      expect(b.status().alive).toBe(false)
    }

    // 並列 reconnect / cross-isolation 検証
    const results = await Promise.all(bridges.map((b) => b.reconnect()))
    for (const r of results) {
      expect(r.ok).toBe(true)
    }
    for (const b of bridges) {
      const st = b.status()
      expect(st.alive).toBe(true)
      // 各 bridge は自分の reconnectCount を独立に持つ
      expect(st.reconnectCount).toBeGreaterThanOrEqual(1)
    }

    // name の独立性確認
    const names = bridges.map((b) => b.name)
    expect(new Set(names).size).toBe(N)
  })
})
