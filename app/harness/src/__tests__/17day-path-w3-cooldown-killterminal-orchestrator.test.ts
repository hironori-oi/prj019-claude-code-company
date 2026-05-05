/**
 * 17 day path W3 — P-UI-02 cooldown + P-UI-04 kill-terminal-sink
 * orchestrator 接続 (Round 20 Dev-DD 担当)
 *
 * 担当 2 control: P-UI-02 / P-UI-04 (W3 残 4 ctrl のうち 2 個)
 *
 * Spec scope (Round 20 W3 接続段階):
 *   Round 19 で確立した Dev-AA (3 ctrl orchestrator, 12 tests) + Dev-BB
 *   (4 ctrl orchestrator, 19 tests) = 31 tests / harness 674 PASS の baseline 上に、
 *   P-UI-02 cooldown state machine と P-UI-04 kill-terminal-sink を harness 側で
 *   実 ctrl 経由で end-to-end 駆動する port + adapter を追加検証する。
 *
 * 不可侵: P-UI-05 / HITL-10 の orchestrator 接続 (Dev-EE 担当) には触れない。
 *         ctrl 実装ファイル (p-ui-02-cooldown-modal.ts / p-ui-04-kill-switch-propagation.ts)
 *         は無改変。
 *
 * W3 拡張 invariants (本 file の 12 tests / 5 group):
 *   Group A — P-UI-02 cooldown active 抑止:
 *     A-1  active 内 → isActive=true / state='active' / remainingMs>0
 *     A-2  expired (>30s 経過) → isActive=false / state='expired' / remainingMs=0
 *     A-3  clock skew (now < abortedAt) → CooldownClockSkewError throw (fail-closed)
 *   Group B — P-UI-02 cooldown expiry 通過:
 *     B-1  computeExpiry returns abortedAt + 30s deterministic
 *     B-2  expired 状態でも computeExpiry は同じ expiry (abortedAt + 30s) を返す
 *   Group C — P-UI-02 override port reset:
 *     C-1  registry.markOverridden → 次回 evaluate で state='overridden'
 *     C-2  registry.reset → cooldown 復帰 (state='active')
 *   Group D — P-UI-04 graceful → forceful 段階遷移:
 *     D-1  pidTree=[201] / 全 SIGTERM 成功 → state='all_terminated' / latch active
 *     D-2  pidTree empty → 即 verified / latch active=true / status='all_terminated'
 *     D-3  SIGTERM 失敗残存 → SIGKILL fallback → terminate output に survivors=0
 *   Group E — P-UI-04 broadcaster cleanup:
 *     E-1  observeLatch → fired event 受信
 *     E-2  unsubscribe → 後続 terminate で observer に通知が届かない (cleanup)
 *
 * Public API 不変性 W3 確認:
 *   - p-ui-02-cooldown-modal.ts / p-ui-04-kill-switch-propagation.ts は無改変
 *   - 17day-path-w3-orchestrator.ts は append-only 拡張 (Round 19 既存 export 維持)
 */
import { describe, it, expect } from 'vitest'

// Round 23 Dev-MM: ARCH-01 Phase 1 dev/staging migrate (DEC-019-041 / Dev-JJ R22 案 A).
// 旧 `../../../openclaw-runtime/src/controls/...` (cross-rootDir relative imports) →
// 新 `@clawbridge/openclaw-runtime/controls/...` (tsconfig paths + vitest resolve.alias).
// Phase 1 段階 = test file 1-2 個のみ alias 化 (議決不要 / regression 0 維持).
import {
  CooldownClockSkewError,
  type CooldownClock,
  type CooldownInput,
} from '@clawbridge/openclaw-runtime/controls/p-ui-02-cooldown-modal.js'
import type { KillInput } from '@clawbridge/openclaw-runtime/controls/p-ui-04-kill-switch-propagation.js'

import {
  buildCooldownPolicy,
  buildKillTerminalAdapter,
  createCooldownOverrideRegistry,
  createW3OrchestratorContext,
  type KillLatchObserver,
} from '../17day-path-w3-orchestrator.js'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const ABORTED_AT = '2026-05-26T00:00:00.000Z'
const ABORTED_AT_MS = Date.parse(ABORTED_AT)

function fixedClock(nowMs: number): CooldownClock {
  return { now: () => nowMs }
}

const COOLDOWN_INPUT: CooldownInput = {
  triggerEvent: 'loop_abort',
  abortedAt: ABORTED_AT,
  loopId: 'L-DD-1',
}

const KILL_INPUT_BASE: KillInput = {
  killReason: 'orchestrator_panic',
  initiatedAt: '2026-05-26T00:00:00.000Z',
  pidTree: [201],
}

// ---------------------------------------------------------------------------
// Group A — P-UI-02 cooldown active 抑止
// ---------------------------------------------------------------------------

describe('W3 group A — P-UI-02 cooldown active 抑止 (orchestrator policy)', () => {
  it('A-1: active 内 (経過 5s) → isActive=true / state=active / remainingMs=25_000', () => {
    const clock = fixedClock(ABORTED_AT_MS + 5_000)
    const policy = buildCooldownPolicy(clock)
    expect(policy.isActive(COOLDOWN_INPUT)).toBe(true)
    const out = policy.evaluate(COOLDOWN_INPUT)
    expect(out.cooldownState).toBe('active')
    expect(out.remainingMs).toBe(25_000)
  })

  it('A-2: expired (経過 31s) → isActive=false / state=expired / remainingMs=0', () => {
    const clock = fixedClock(ABORTED_AT_MS + 31_000)
    const policy = buildCooldownPolicy(clock)
    expect(policy.isActive(COOLDOWN_INPUT)).toBe(false)
    const out = policy.evaluate(COOLDOWN_INPUT)
    expect(out.cooldownState).toBe('expired')
    expect(out.remainingMs).toBe(0)
  })

  it('A-3: clock skew (now < abortedAt) → CooldownClockSkewError throw (fail-closed)', () => {
    const clock = fixedClock(ABORTED_AT_MS - 1_000)
    const policy = buildCooldownPolicy(clock)
    expect(() => policy.evaluate(COOLDOWN_INPUT)).toThrow(CooldownClockSkewError)
    expect(() => policy.isActive(COOLDOWN_INPUT)).toThrow(CooldownClockSkewError)
  })
})

// ---------------------------------------------------------------------------
// Group B — P-UI-02 cooldown expiry 通過
// ---------------------------------------------------------------------------

describe('W3 group B — P-UI-02 cooldown expiry 計算 (deterministic)', () => {
  it('B-1: computeExpiry returns abortedAt + 30s exactly', () => {
    const clock = fixedClock(ABORTED_AT_MS + 5_000)
    const policy = buildCooldownPolicy(clock)
    const expiry = policy.computeExpiry(COOLDOWN_INPUT)
    expect(expiry.toISOString()).toBe(new Date(ABORTED_AT_MS + 30_000).toISOString())
  })

  it('B-2: expired 状態でも computeExpiry は abortedAt + 30s で不変 (timeline 確定性)', () => {
    const clock = fixedClock(ABORTED_AT_MS + 60_000)
    const policy = buildCooldownPolicy(clock)
    const expiry = policy.computeExpiry(COOLDOWN_INPUT)
    expect(expiry.toISOString()).toBe(new Date(ABORTED_AT_MS + 30_000).toISOString())
    // active 中に呼んだ場合と同じ値
    const activePolicy = buildCooldownPolicy(fixedClock(ABORTED_AT_MS + 5_000))
    expect(activePolicy.computeExpiry(COOLDOWN_INPUT).toISOString()).toBe(expiry.toISOString())
  })
})

// ---------------------------------------------------------------------------
// Group C — P-UI-02 override port reset
// ---------------------------------------------------------------------------

describe('W3 group C — P-UI-02 HITL 第 12 種 override port', () => {
  it('C-1: registry.markOverridden → state=overridden / remainingMs=0', () => {
    const registry = createCooldownOverrideRegistry()
    const clock = fixedClock(ABORTED_AT_MS + 5_000)
    const policy = buildCooldownPolicy(clock, registry)
    // 通常は active
    expect(policy.evaluate(COOLDOWN_INPUT).cooldownState).toBe('active')
    // override 後
    registry.markOverridden(COOLDOWN_INPUT.loopId)
    const overridden = policy.evaluate(COOLDOWN_INPUT)
    expect(overridden.cooldownState).toBe('overridden')
    expect(overridden.remainingMs).toBe(0)
    expect(policy.isActive(COOLDOWN_INPUT)).toBe(false)
  })

  it('C-2: registry.reset → override 解除 → cooldown 復帰 (state=active)', () => {
    const registry = createCooldownOverrideRegistry()
    const clock = fixedClock(ABORTED_AT_MS + 5_000)
    const policy = buildCooldownPolicy(clock, registry)
    registry.markOverridden(COOLDOWN_INPUT.loopId)
    expect(policy.evaluate(COOLDOWN_INPUT).cooldownState).toBe('overridden')
    registry.reset(COOLDOWN_INPUT.loopId)
    expect(policy.evaluate(COOLDOWN_INPUT).cooldownState).toBe('active')
    // resetAll 動作確認
    registry.markOverridden('L-DD-1')
    registry.markOverridden('L-DD-2')
    registry.resetAll()
    expect(registry.isOverridden('L-DD-1')).toBe(false)
    expect(registry.isOverridden('L-DD-2')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Group D — P-UI-04 graceful → forceful 段階遷移
// ---------------------------------------------------------------------------

describe('W3 group D — P-UI-04 kill-terminal adapter graceful → forceful', () => {
  it('D-1: pidTree=[201] / SIGTERM 成功 → status=all_terminated / latch active=true', async () => {
    const ctx = createW3OrchestratorContext()
    const adapter = buildKillTerminalAdapter(ctx)
    const state = await adapter.terminate(KILL_INPUT_BASE)
    expect(state.killOutput.status).toBe('all_terminated')
    expect(state.killOutput.totalKilled).toBe(1)
    expect(state.killOutput.survivors).toEqual([])
    expect(state.latchActive).toBe(true)
    expect(state.latchReason).toBe('orchestrator_panic')
    // sink (cross-control) も active
    expect(ctx.killTerminalSink.isActive()).toBe(true)
  })

  it('D-2: pidTree empty → 即 verified / status=all_terminated / latch active=true', async () => {
    const ctx = createW3OrchestratorContext()
    const adapter = buildKillTerminalAdapter(ctx)
    const state = await adapter.terminate({ ...KILL_INPUT_BASE, pidTree: [] })
    expect(state.killOutput.status).toBe('all_terminated')
    expect(state.killOutput.totalKilled).toBe(0)
    expect(state.latchActive).toBe(true)
    expect(state.latchReason).toBe('orchestrator_panic')
  })

  it('D-3: SIGTERM 失敗 → SIGKILL fallback で全終了 → survivors=0', async () => {
    const ctx = createW3OrchestratorContext()
    const adapter = buildKillTerminalAdapter(ctx)
    const sigCalls: Array<{ pid: number; sig: 'SIGTERM' | 'SIGKILL' }> = []
    const state = await adapter.terminate(
      { ...KILL_INPUT_BASE, pidTree: [301, 302] },
      {
        processKiller: {
          signal: async (pid, sig) => {
            sigCalls.push({ pid, sig })
            // SIGTERM は失敗 / SIGKILL は成功
            return sig === 'SIGKILL'
          },
        },
        // verifySurvivors default = [] (forceful 後の最終確認で生存 0 とみなす)
      },
    )
    // SIGTERM 2 回 + SIGKILL 2 回 = 計 4 回
    const sigterms = sigCalls.filter((c) => c.sig === 'SIGTERM')
    const sigkills = sigCalls.filter((c) => c.sig === 'SIGKILL')
    expect(sigterms).toHaveLength(2)
    expect(sigkills).toHaveLength(2)
    expect(state.killOutput.survivors).toEqual([])
    expect(state.killOutput.status).toBe('all_terminated')
    expect(state.latchActive).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Group E — P-UI-04 broadcaster cleanup (observe / unsubscribe)
// ---------------------------------------------------------------------------

describe('W3 group E — P-UI-04 broadcaster lifecycle (observe / cleanup)', () => {
  it('E-1: observeLatch → fired event を受信 (broadcaster 配線確認)', async () => {
    const ctx = createW3OrchestratorContext()
    const adapter = buildKillTerminalAdapter(ctx)
    const events: Array<{ event: string; reason: string }> = []
    const observer: KillLatchObserver = (event, reason) => {
      events.push({ event, reason })
    }
    adapter.observeLatch(observer)
    await adapter.terminate(KILL_INPUT_BASE)
    expect(events.length).toBeGreaterThanOrEqual(1)
    // 'fired' を含む (graceful 開始時)
    expect(events.some((e) => e.event === 'fired' && e.reason === 'orchestrator_panic')).toBe(true)
    // 全終了したので 'verified' も来る
    expect(events.some((e) => e.event === 'verified')).toBe(true)
  })

  it('E-2: unsubscribe 後の terminate では observer に通知が届かない (cleanup)', async () => {
    const ctx = createW3OrchestratorContext()
    const adapter = buildKillTerminalAdapter(ctx)
    const events1: Array<{ event: string; reason: string }> = []
    const events2: Array<{ event: string; reason: string }> = []
    const o1: KillLatchObserver = (e, r) => events1.push({ event: e, reason: r })
    const o2: KillLatchObserver = (e, r) => events2.push({ event: e, reason: r })
    const unsub1 = adapter.observeLatch(o1)
    adapter.observeLatch(o2)
    await adapter.terminate(KILL_INPUT_BASE)
    const eventsBefore1 = events1.length
    const eventsBefore2 = events2.length
    expect(eventsBefore1).toBeGreaterThan(0)
    expect(eventsBefore2).toBeGreaterThan(0)
    // o1 を解除
    unsub1()
    // 新しい context で再 terminate (sink を fresh にする)
    const ctx2 = createW3OrchestratorContext()
    const adapter2 = buildKillTerminalAdapter(ctx2)
    // 残っている o2 を adapter2 にも登録 (adapter1 の observer set とは独立)
    adapter2.observeLatch(o2)
    await adapter2.terminate({ ...KILL_INPUT_BASE, pidTree: [501] })
    // o1 は adapter1 で unsub 済 → adapter1 で再 terminate しても o1 は受信しない
    await adapter.terminate({ ...KILL_INPUT_BASE, pidTree: [502] })
    expect(events1.length).toBe(eventsBefore1) // 増えていない (cleanup 確認)
    expect(events2.length).toBeGreaterThan(eventsBefore2) // adapter2 経由で受信継続
  })

  it('E-3: observer が throw しても他 observer / lifecycle が止まらない (isolation)', async () => {
    const ctx = createW3OrchestratorContext()
    const adapter = buildKillTerminalAdapter(ctx)
    const sane: Array<{ event: string }> = []
    adapter.observeLatch(() => {
      throw new Error('observer-throw')
    })
    adapter.observeLatch((event) => {
      sane.push({ event })
    })
    const state = await adapter.terminate(KILL_INPUT_BASE)
    expect(sane.length).toBeGreaterThan(0)
    expect(state.killOutput.status).toBe('all_terminated')
    expect(state.latchActive).toBe(true)
  })
})
