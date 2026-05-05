/**
 * 17 day path W4 — OpenClaw runtime bridge (Round 21 Dev-GG)
 *
 * 担当: harness orchestrator 本番 wiring の lifecycle / port 検証 (W4 task ①)。
 *
 * 不可侵:
 *   - Round 19 Dev-BB createW3OrchestratorContext() 関数本体無改変
 *   - Round 19 Dev-AA / Round 20 Dev-EE / Dev-DD の既存 file 無改変
 *   - control 本体ファイル無改変
 *
 * test groups:
 *   Group A (bridge initialization, 3 tests):
 *     A-1  init() → phase='active' / context 構築
 *     A-2  init() 冪等 (再呼出で同 context)
 *     A-3  options.now 注入 → context.postRollbackNotifier 経由で反映
 *   Group B (lifecycle integration, 3 tests):
 *     B-1  dispose() → phase='idle' / getContext() throw
 *     B-2  dispose() idempotent (二重 dispose 安全)
 *     B-3  dispose 後の re-init で新規 context が生成される
 *   Group C (port wiring verification, 2 tests):
 *     C-1  bindBridgeToLifecycle helper で start/stop/getContext が連動
 *     C-2  onInit / onDispose hook が正しい順序で呼ばれる
 */
import { describe, it, expect } from 'vitest'

import {
  bindBridgeToLifecycle,
  createOpenClawRuntimeBridge,
  type OpenClawRuntimeBridge,
} from '../openclaw-runtime-bridge.js'

// ---------------------------------------------------------------------------
// Group A — bridge initialization
// ---------------------------------------------------------------------------

describe('W4 dev-gg group A — bridge initialization', () => {
  it('A-1: init() returns active context with all 4 ports', async () => {
    const bridge = createOpenClawRuntimeBridge()
    expect(bridge.phase()).toBe('idle')
    const ctx = await bridge.init()
    expect(bridge.phase()).toBe('active')
    expect(ctx.killTerminalSink).toBeDefined()
    expect(ctx.rlsAuditTrail).toBeDefined()
    expect(ctx.permissionAuditSink).toBeDefined()
    expect(ctx.postRollbackNotifier).toBeDefined()
    await bridge.dispose()
  })

  it('A-2: init() is idempotent — same context on re-call', async () => {
    const bridge = createOpenClawRuntimeBridge()
    const ctx1 = await bridge.init()
    const ctx2 = await bridge.init()
    expect(ctx1).toBe(ctx2)
    await bridge.dispose()
  })

  it('A-3: options.now is propagated to postRollbackNotifier', async () => {
    const fixedTime = '2026-05-05T12:34:56.000Z'
    const bridge = createOpenClawRuntimeBridge({ now: () => fixedTime })
    const ctx = await bridge.init()
    await ctx.postRollbackNotifier.onRollbackCompleted({
      loopId: 'L-1',
      targetCommit: 'abc123',
    })
    const trail = ctx.rlsAuditTrail.list()
    expect(trail.length).toBeGreaterThan(0)
    const last = trail[trail.length - 1]
    expect(last?.recordedAt).toBe(fixedTime)
    await bridge.dispose()
  })
})

// ---------------------------------------------------------------------------
// Group B — lifecycle integration
// ---------------------------------------------------------------------------

describe('W4 dev-gg group B — lifecycle integration', () => {
  it('B-1: dispose() transitions to idle / getContext throws afterwards', async () => {
    const bridge = createOpenClawRuntimeBridge()
    await bridge.init()
    expect(bridge.phase()).toBe('active')
    await bridge.dispose()
    expect(bridge.phase()).toBe('idle')
    expect(() => bridge.getContext()).toThrow(/active phase/)
  })

  it('B-2: dispose() is idempotent (double-dispose safe)', async () => {
    const bridge = createOpenClawRuntimeBridge()
    await bridge.init()
    await bridge.dispose()
    await bridge.dispose() // should not throw
    expect(bridge.phase()).toBe('idle')
  })

  it('B-3: re-init after dispose creates fresh context', async () => {
    const bridge = createOpenClawRuntimeBridge()
    const ctx1 = await bridge.init()
    await bridge.dispose()
    const ctx2 = await bridge.init()
    expect(ctx1).not.toBe(ctx2)
    expect(bridge.phase()).toBe('active')
    await bridge.dispose()
  })
})

// ---------------------------------------------------------------------------
// Group C — port wiring verification
// ---------------------------------------------------------------------------

describe('W4 dev-gg group C — port wiring verification', () => {
  it('C-1: bindBridgeToLifecycle exposes start/stop/getContext', async () => {
    const bridge = createOpenClawRuntimeBridge()
    const handle = bindBridgeToLifecycle(bridge)
    expect(handle.isActive()).toBe(false)
    const ctx = await handle.start()
    expect(handle.isActive()).toBe(true)
    expect(handle.getContext()).toBe(ctx)
    await handle.stop()
    expect(handle.isActive()).toBe(false)
  })

  it('C-2: onInit / onDispose hooks fire in correct order', async () => {
    const events: string[] = []
    const bridge: OpenClawRuntimeBridge = createOpenClawRuntimeBridge({
      onInit: () => {
        events.push('init')
      },
      onDispose: () => {
        events.push('dispose')
      },
    })
    await bridge.init()
    expect(events).toEqual(['init'])
    await bridge.dispose()
    expect(events).toEqual(['init', 'dispose'])
  })

  it('C-3: getContext throws when called before init', () => {
    const bridge = createOpenClawRuntimeBridge()
    expect(() => bridge.getContext()).toThrow(/active phase/)
  })

  it('C-4: cross-control wiring — postRollback record reaches rlsAuditTrail', async () => {
    const bridge = createOpenClawRuntimeBridge()
    const ctx = await bridge.init()
    // simulate p-ui-05 rollback completion
    await ctx.postRollbackNotifier.onRollbackCompleted({
      loopId: 'L-X',
      targetCommit: 'def456',
    })
    // simulate hitl-10 permission decision
    ctx.permissionAuditSink.recordDecision({
      ticketId: 'T-1',
      state: 'approved',
      detail: 'env change',
      recordedAt: '2026-05-05T12:00:00.000Z',
    })
    const trail = ctx.rlsAuditTrail.list()
    expect(trail.length).toBe(2)
    const sources = trail.map((e) => e.source)
    expect(sources).toContain('p-ui-05')
    expect(sources).toContain('hitl-10')
    await bridge.dispose()
  })
})
