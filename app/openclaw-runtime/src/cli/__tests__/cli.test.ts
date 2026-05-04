/**
 * cli/__tests__/cli.test — Round 11 Dev-D 前倒し (W3 → W0):
 *   spawn-claude-code / session-controller / subscription-router の単体テスト。
 *
 * カバー範囲 (24+ tests):
 *   1-7   : spawnClaudeCode lifecycle (mock spawner / dry-run / abort / json events)
 *   8-15  : SessionController FSM (start / pause / resume / kill / 不正遷移 throw)
 *   16-22 : subscription-router strategy (5 分岐 + edge cases)
 *   23+   : 純関数性 + token 連番 + 型 helper
 */
import { describe, it, expect, vi } from 'vitest'

import {
  spawnClaudeCode,
  extractJsonEvents,
  type MockChildProcess,
  type SpawnClaudeCodeOptions,
  type SpawnHandle,
} from '../spawn-claude-code.js'
import {
  createSessionController,
  isTransitionAllowed,
  awaitSessionFinish,
} from '../session-controller.js'
import {
  selectSpawnMode,
  isSubscriptionEligible,
  projectRequiredBudgetUsd,
  decisionToMode,
} from '../subscription-router.js'

/**
 * ヘルパ: テスト用 MockChildProcess factory。
 */
function makeMockChild(
  overrides: Partial<{
    pid: number
    autoExitCode: number | null
    autoExitSignal: string | null
    emitStdoutLines: readonly string[]
    emitStderrLines: readonly string[]
  }> = {},
): MockChildProcess & {
  triggerExit: (code: number | null, signal?: string | null) => void
  emitStdoutLine: (line: string) => void
} {
  let alive = true
  const stdoutListeners: Array<(line: string) => void> = []
  const stderrListeners: Array<(line: string) => void> = []
  const exitListeners: Array<(code: number | null, signal: string | null) => void> = []
  const child: MockChildProcess & {
    triggerExit: (code: number | null, signal?: string | null) => void
    emitStdoutLine: (line: string) => void
  } = {
    pid: overrides.pid ?? 12345,
    onStdoutLine(listener) {
      stdoutListeners.push(listener)
    },
    onStderrLine(listener) {
      stderrListeners.push(listener)
    },
    onExit(listener) {
      exitListeners.push(listener)
    },
    kill(_signal) {
      alive = false
      // SIGTERM / SIGKILL の挙動を区別せず、即時 exit
      queueMicrotask(() => {
        for (const l of exitListeners) l(null, _signal ?? 'SIGTERM')
      })
      return true
    },
    isAlive() {
      return alive
    },
    triggerExit(code, signal) {
      alive = false
      for (const l of exitListeners) l(code, signal ?? null)
    },
    emitStdoutLine(line) {
      for (const l of stdoutListeners) l(line)
    },
  }
  // 初期 emit
  if (overrides.emitStdoutLines) {
    queueMicrotask(() => {
      for (const line of overrides.emitStdoutLines!) {
        for (const l of stdoutListeners) l(line)
      }
    })
  }
  if (overrides.emitStderrLines) {
    queueMicrotask(() => {
      for (const line of overrides.emitStderrLines!) {
        for (const l of stderrListeners) l(line)
      }
    })
  }
  if (overrides.autoExitCode !== undefined || overrides.autoExitSignal !== undefined) {
    queueMicrotask(() => {
      alive = false
      for (const l of exitListeners) {
        l(overrides.autoExitCode ?? 0, overrides.autoExitSignal ?? null)
      }
    })
  }
  return child
}

describe('cli/spawn-claude-code — Round 11 Dev-D (subscription-driven CLI spawn)', () => {
  it('1. dry-run mode は実 spawn せず即時 exit code 0 を返す', async () => {
    const records: Array<{ spawnToken: string; modeRequested: string }> = []
    const handle = spawnClaudeCode({
      mode: 'dry-run',
      cliPath: '/usr/local/bin/claude',
      args: ['-p', 'test'],
      env: { PATH: '/usr/bin' },
      cwd: '/tmp',
      dryRunRecorder: (r) => records.push({ spawnToken: r.spawnToken, modeRequested: r.modeRequested }),
      nowIso: () => '2026-05-04T00:00:00.000Z',
    })
    expect(handle.mode).toBe('dry-run')
    expect(handle.pid).toBe(-1)
    expect(records).toHaveLength(1)
    expect(records[0]!.modeRequested).toBe('dry-run')
    const info = await handle.done()
    expect(info.code).toBe(0)
    expect(info.signal).toBeNull()
    expect(info.aborted).toBe(false)
  })

  it('2. subscription mode で spawner が呼ばれ、stdout/stderr 行が集約される', async () => {
    const child = makeMockChild({ pid: 99, emitStdoutLines: ['line A', 'line B'] })
    const handle = spawnClaudeCode({
      mode: 'subscription',
      cliPath: '/usr/local/bin/claude',
      spawner: () => child,
    })
    // emit は queueMicrotask 経由のため await tick 必要
    await Promise.resolve()
    await Promise.resolve()
    expect(handle.pid).toBe(99)
    expect(handle.stdoutLines).toEqual(['line A', 'line B'])
    expect(handle.mode).toBe('subscription')
    child.triggerExit(0)
    const info = await handle.done()
    expect(info.code).toBe(0)
  })

  it('3. stdout NDJSON ライン が jsonEvents に抽出される (JSON IF 整合)', async () => {
    const child = makeMockChild()
    const handle = spawnClaudeCode({
      mode: 'subscription',
      cliPath: '/x',
      spawner: () => child,
    })
    child.emitStdoutLine('{"messageType":"progress_update","progressPercent":42}')
    child.emitStdoutLine('plain log line, not JSON')
    child.emitStdoutLine('{"messageType":"error_report","severity":"warn"}')
    expect(handle.jsonEvents).toHaveLength(2)
    expect((handle.jsonEvents[0] as Record<string, unknown>).messageType).toBe(
      'progress_update',
    )
    expect((handle.jsonEvents[1] as Record<string, unknown>).messageType).toBe(
      'error_report',
    )
    expect(handle.stdoutLines).toHaveLength(3)
  })

  it('4. AbortController.abort() が SIGTERM 送信 + aborted=true を反映', async () => {
    const child = makeMockChild()
    const ac = new AbortController()
    const handle = spawnClaudeCode({
      mode: 'subscription',
      cliPath: '/x',
      spawner: () => child,
      abortSignal: ac.signal,
    })
    expect(child.isAlive()).toBe(true)
    ac.abort()
    const info = await handle.done()
    expect(info.aborted).toBe(true)
    expect(info.abortReason).toBe('AbortController.abort()')
    expect(child.isAlive()).toBe(false)
  })

  it('5. handle.abort(reason) が SIGTERM + abortReason 記録', async () => {
    const child = makeMockChild()
    const handle = spawnClaudeCode({
      mode: 'subscription',
      cliPath: '/x',
      spawner: () => child,
    })
    handle.abort('test-reason')
    const info = await handle.done()
    expect(info.aborted).toBe(true)
    expect(info.abortReason).toBe('test-reason')
  })

  it('6. spawner 未指定 + non-dry-run mode は throw', () => {
    expect(() =>
      spawnClaudeCode({ mode: 'subscription', cliPath: '/x' }),
    ).toThrowError(/spawner is required/)
    expect(() => spawnClaudeCode({ mode: 'api', cliPath: '/x' })).toThrowError(
      /spawner is required/,
    )
  })

  it('7. spawnToken は明示指定 OR 自動採番される', async () => {
    const child1 = makeMockChild({ autoExitCode: 0 })
    const child2 = makeMockChild({ autoExitCode: 0 })
    const h1 = spawnClaudeCode({
      mode: 'subscription',
      cliPath: '/x',
      spawner: () => child1,
      spawnToken: 'explicit-token-1',
    })
    const h2 = spawnClaudeCode({
      mode: 'subscription',
      cliPath: '/x',
      spawner: () => child2,
    })
    expect(h1.spawnToken).toBe('explicit-token-1')
    expect(h2.spawnToken).toMatch(/^spawn-/)
    expect(h2.spawnToken).not.toBe(h1.spawnToken)
  })

  it('8. extractJsonEvents 純関数で NDJSON parse', () => {
    const events = extractJsonEvents([
      '{"a":1}',
      '   ',
      'plain',
      '[1,2,3]',
      '{"b":2}',
      'not-json-{',
    ])
    expect(events).toHaveLength(3)
    expect(events[0]).toEqual({ a: 1 })
    expect(events[1]).toEqual([1, 2, 3])
    expect(events[2]).toEqual({ b: 2 })
  })
})

describe('cli/session-controller — Round 11 Dev-D (lifecycle FSM)', () => {
  it('9. start → running → kill → finished の通常 flow', async () => {
    const child = makeMockChild()
    const ctrl = createSessionController({
      spawnOptions: {
        mode: 'subscription',
        cliPath: '/x',
        spawner: () => child,
      },
    })
    expect(ctrl.state).toBe('idle')
    expect(ctrl.spawnToken).toBeNull()
    expect(ctrl.pid).toBeNull()

    await ctrl.start()
    expect(ctrl.state).toBe('running')
    expect(ctrl.spawnToken).not.toBeNull()
    expect(ctrl.pid).toBe(12345)
    expect(ctrl.transitions.map((t) => t.state)).toEqual(['starting', 'running'])

    const info = await ctrl.kill('test-kill')
    expect(ctrl.state).toBe('finished')
    expect(info?.aborted).toBe(true)
    const states = ctrl.transitions.map((t) => t.state)
    expect(states).toContain('killing')
    expect(states[states.length - 1]).toBe('finished')
  })

  it('10. dry-run mode は start() 直後に finished へ遷移', async () => {
    const ctrl = createSessionController({
      spawnOptions: { mode: 'dry-run', cliPath: '/x' },
    })
    await ctrl.start()
    expect(ctrl.state).toBe('finished')
    expect(ctrl.transitions.map((t) => t.state)).toEqual(['starting', 'finished'])
    expect(ctrl.mode).toBe('dry-run')
  })

  it('11. pause / resume が running ↔ paused を遷移', async () => {
    const child = makeMockChild()
    const ctrl = createSessionController({
      spawnOptions: { mode: 'subscription', cliPath: '/x', spawner: () => child },
    })
    await ctrl.start()
    await ctrl.pause('test-pause')
    expect(ctrl.state).toBe('paused')
    await ctrl.resume('test-resume')
    expect(ctrl.state).toBe('running')
    const states = ctrl.transitions.map((t) => t.state)
    expect(states).toEqual(['starting', 'running', 'paused', 'running'])
  })

  it('12. 不正遷移 (idle から pause) は throw', async () => {
    const ctrl = createSessionController({
      spawnOptions: { mode: 'subscription', cliPath: '/x', spawner: () => makeMockChild() },
    })
    await expect(ctrl.pause()).rejects.toThrowError(/cannot pause from state=idle/)
  })

  it('13. 二重 start は throw', async () => {
    const ctrl = createSessionController({
      spawnOptions: { mode: 'dry-run', cliPath: '/x' },
    })
    await ctrl.start()
    await expect(ctrl.start()).rejects.toThrowError(/cannot start from state=finished/)
  })

  it('14. isTransitionAllowed が遷移表通り', () => {
    expect(isTransitionAllowed('idle', 'starting')).toBe(true)
    expect(isTransitionAllowed('idle', 'running')).toBe(false)
    expect(isTransitionAllowed('starting', 'running')).toBe(true)
    expect(isTransitionAllowed('running', 'paused')).toBe(true)
    expect(isTransitionAllowed('paused', 'running')).toBe(true)
    expect(isTransitionAllowed('running', 'finished')).toBe(true)
    expect(isTransitionAllowed('finished', 'idle')).toBe(false)
    expect(isTransitionAllowed('finished', 'running')).toBe(false)
  })

  it('15. spawn 失敗で finished に直行 + throw', async () => {
    const ctrl = createSessionController({
      spawnOptions: {
        mode: 'subscription',
        cliPath: '/x',
        // spawner 不在のため spawnClaudeCode が throw する
      },
    })
    await expect(ctrl.start()).rejects.toThrowError(/spawner is required/)
    expect(ctrl.state).toBe('finished')
    const states = ctrl.transitions.map((t) => t.state)
    expect(states[states.length - 1]).toBe('finished')
  })

  it('16. kill before start は idle → starting → finished', async () => {
    const ctrl = createSessionController({
      spawnOptions: { mode: 'subscription', cliPath: '/x', spawner: () => makeMockChild() },
    })
    const info = await ctrl.kill('pre-start-kill')
    expect(info).toBeNull()
    expect(ctrl.state).toBe('finished')
  })

  it('17. awaitSessionFinish helper が exit info を返す', async () => {
    const child = makeMockChild()
    const ctrl = createSessionController({
      spawnOptions: { mode: 'subscription', cliPath: '/x', spawner: () => child },
    })
    await ctrl.start()
    const finishPromise = awaitSessionFinish(ctrl)
    child.triggerExit(0)
    const info = await finishPromise
    expect(info?.code).toBe(0)
  })
})

describe('cli/subscription-router — Round 11 Dev-D (strategy pattern)', () => {
  it('18. forceDryRun=true は最優先で dry-run を返す', () => {
    const d = selectSpawnMode({
      subscriptionAvailable: true,
      forceDryRun: true,
    })
    expect(d.selected).toBe('dry-run')
    expect(d.reason).toMatch(/forceDryRun/)
    expect(d.evaluationTrace).toHaveLength(1)
  })

  it('19. emergencyApiOverride=true は subscription を skip して api 採用', () => {
    const d = selectSpawnMode({
      subscriptionAvailable: true,
      emergencyApiOverride: true,
    })
    expect(d.selected).toBe('api')
    expect(d.reason).toMatch(/emergency/)
    expect(d.warnings.some((w) => w.includes('DEC-019-051'))).toBe(true)
  })

  it('20. subscription 利用可で blocked なし → subscription 採用', () => {
    const d = selectSpawnMode({ subscriptionAvailable: true })
    expect(d.selected).toBe('subscription')
    expect(d.evaluationTrace[0]!.outcome).toBe('selected')
  })

  it('21. subscription 不可 + budget 十分 → api fallback', () => {
    const d = selectSpawnMode({
      subscriptionAvailable: false,
      remainingBudgetUsd: 10,
      estimatedCallCostUsd: 0.5,
    })
    expect(d.selected).toBe('api')
    expect(d.warnings.length).toBeGreaterThan(0)
  })

  it('22. subscription 不可 + budget 不足 → 強制 dry-run', () => {
    const d = selectSpawnMode({
      subscriptionAvailable: false,
      remainingBudgetUsd: 0.1,
      estimatedCallCostUsd: 1.0,
    })
    expect(d.selected).toBe('dry-run')
    expect(d.warnings.some((w) => w.includes('escalate to HITL'))).toBe(true)
  })

  it('23. subscription blocked (ToS) → api fallback or dry-run', () => {
    const d1 = selectSpawnMode({
      subscriptionAvailable: true,
      subscriptionBlockedReason: 'tos-monitor: rate-limit-warning',
      remainingBudgetUsd: 5,
      estimatedCallCostUsd: 0.5,
    })
    expect(d1.selected).toBe('api')
    expect(d1.warnings.some((w) => w.includes('rate-limit-warning'))).toBe(true)

    const d2 = selectSpawnMode({
      subscriptionAvailable: true,
      subscriptionBlockedReason: 'ban-drill-active',
      // budget 不指定 = 0
    })
    expect(d2.selected).toBe('dry-run')
  })

  it('24. isSubscriptionEligible 純関数 precondition check', () => {
    expect(isSubscriptionEligible({ subscriptionAvailable: true })).toBe(true)
    expect(isSubscriptionEligible({ subscriptionAvailable: false })).toBe(false)
    expect(
      isSubscriptionEligible({ subscriptionAvailable: true, forceDryRun: true }),
    ).toBe(false)
    expect(
      isSubscriptionEligible({ subscriptionAvailable: true, emergencyApiOverride: true }),
    ).toBe(false)
    expect(
      isSubscriptionEligible({
        subscriptionAvailable: true,
        subscriptionBlockedReason: 'x',
      }),
    ).toBe(false)
  })

  it('25. projectRequiredBudgetUsd 純関数 cost projection', () => {
    expect(projectRequiredBudgetUsd(0.1, 100)).toBe(10)
    expect(projectRequiredBudgetUsd(0.001, 1000)).toBe(1)
    expect(projectRequiredBudgetUsd(-1, 10)).toBe(0)
    expect(projectRequiredBudgetUsd(1, -5)).toBe(0)
    expect(projectRequiredBudgetUsd(0, 100)).toBe(0)
  })

  it('26. decisionToMode helper + evaluationTrace は frozen', () => {
    const d = selectSpawnMode({ subscriptionAvailable: true })
    expect(decisionToMode(d)).toBe('subscription')
    expect(Object.isFrozen(d)).toBe(true)
    expect(Object.isFrozen(d.evaluationTrace)).toBe(true)
    expect(Object.isFrozen(d.warnings)).toBe(true)
  })

  it('27. 純関数性 - 同入力で同出力', () => {
    const input = {
      subscriptionAvailable: false,
      remainingBudgetUsd: 5,
      estimatedCallCostUsd: 0.5,
    }
    const a = selectSpawnMode(input)
    const b = selectSpawnMode(input)
    expect(a.selected).toBe(b.selected)
    expect(a.reason).toBe(b.reason)
    expect(a.evaluationTrace.length).toBe(b.evaluationTrace.length)
  })
})

describe('cli/integration — DryRunGuard 整合 + spawn token 巻き添えゼロ', () => {
  it('28. dry-run mode の spawn token は recording に必須記録される (Sumi/Asagi 巻き添えゼロ)', () => {
    const records: Array<{ spawnToken: string; envKeys: readonly string[] }> = []
    spawnClaudeCode({
      mode: 'dry-run',
      cliPath: '/usr/local/bin/claude',
      env: { PATH: '/usr/bin', NODE_ENV: 'test' },
      dryRunRecorder: (r) => records.push({ spawnToken: r.spawnToken, envKeys: r.envKeys }),
    })
    expect(records[0]!.spawnToken).toMatch(/^spawn-/)
    expect(records[0]!.envKeys).toEqual(['PATH', 'NODE_ENV'])
  })

  it('29. router decision → spawn mode 選択 → SessionController 起動 の連携', async () => {
    const decision = selectSpawnMode({ forceDryRun: true })
    expect(decision.selected).toBe('dry-run')
    const ctrl = createSessionController({
      spawnOptions: {
        mode: decisionToMode(decision),
        cliPath: '/x',
      },
    })
    await ctrl.start()
    expect(ctrl.state).toBe('finished')
    expect(ctrl.mode).toBe('dry-run')
  })

  it('30. nowIso DI: TimeSource 注入で audit 時刻を制御可能', async () => {
    const fakeNow = vi.fn(() => '2026-05-04T12:00:00.000Z')
    const child = makeMockChild()
    const ctrl = createSessionController({
      spawnOptions: { mode: 'subscription', cliPath: '/x', spawner: () => child },
      nowIso: fakeNow,
    })
    await ctrl.start()
    const transitions = ctrl.transitions
    for (const t of transitions) {
      expect(t.at).toBe('2026-05-04T12:00:00.000Z')
    }
    expect(fakeNow).toHaveBeenCalled()
  })
})
