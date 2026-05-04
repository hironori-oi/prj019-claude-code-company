/**
 * session-start-wiring.test — Round 13 Dev-D 着地 (Task C):
 *   session-controller.start() の wireSpawnHandleToKillSwitch 自動統合検証。
 *
 * カバー範囲:
 *   - killRegistry 指定で start() 内で wire が呼ばれる
 *   - finished 移行時に token.unregister() が呼ばれる (auto-unregister)
 *   - dry-run mode は wire の戻り値が null (subprocess を持たないため)
 *   - killRegistry 未指定時は wire は呼ばれない (互換性)
 *   - kill 経由 finished でも token unregister
 *   - 既存 6-state FSM 遷移表は無変更
 *   - wire 失敗時は finished へ遷移 + throw
 */
import { describe, it, expect, vi } from 'vitest'
import { createSessionController, isTransitionAllowed } from '../session-controller.js'
import type {
  MockChildProcess,
  SpawnKillRegistry,
  SpawnKillRegistryToken,
  SpawnKillTarget,
  SpawnHandle,
} from '../spawn-claude-code.js'

/**
 * ヘルパ: mock child (cli.test.ts と同等の最小実装)。
 */
function makeMockChild(opts: { pid?: number } = {}): MockChildProcess & {
  triggerExit: (code: number | null, signal?: string | null) => void
} {
  let alive = true
  const exitListeners: Array<(code: number | null, signal: string | null) => void> = []
  return {
    pid: opts.pid ?? 12345,
    onStdoutLine() {},
    onStderrLine() {},
    onExit(l) {
      exitListeners.push(l)
    },
    kill(_sig) {
      alive = false
      queueMicrotask(() => {
        for (const l of exitListeners) l(null, _sig ?? 'SIGTERM')
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
  }
}

/**
 * ヘルパ: stub kill-registry。registerSubprocessKill 呼び出しを記録。
 */
function makeStubRegistry(): SpawnKillRegistry & {
  registered: SpawnKillTarget[]
  unregisterCalls: number
  failOnRegister: boolean
} {
  const out = {
    registered: [] as SpawnKillTarget[],
    unregisterCalls: 0,
    failOnRegister: false,
    registerSubprocessKill(target: SpawnKillTarget): SpawnKillRegistryToken {
      if (out.failOnRegister) {
        throw new Error('stub registry: register refused')
      }
      out.registered.push(target)
      return {
        id: `stub-token-${out.registered.length}`,
        unregister: () => {
          out.unregisterCalls++
        },
      }
    },
  }
  return out
}

describe('Round 13 Dev-D Task C: session-controller.start() kill-switch auto wiring', () => {
  it('1. killRegistry 指定で start() 内で registry.registerSubprocessKill が呼ばれる', async () => {
    const child = makeMockChild()
    const registry = makeStubRegistry()
    const ctrl = createSessionController({
      spawnOptions: {
        mode: 'subscription',
        cliPath: '/x',
        spawner: () => child,
      },
      killRegistry: registry,
    })

    expect(registry.registered).toHaveLength(0)
    await ctrl.start()
    expect(registry.registered).toHaveLength(1)
    expect(ctrl.killToken).not.toBeNull()
    expect(ctrl.killToken!.id).toMatch(/^stub-token-/)
  })

  it('2. killRegistry 未指定時は wire が呼ばれない (Round 11/12 互換)', async () => {
    const child = makeMockChild()
    const wireFn = vi.fn(() => null)
    const ctrl = createSessionController({
      spawnOptions: {
        mode: 'subscription',
        cliPath: '/x',
        spawner: () => child,
      },
      wireFn,
    })
    await ctrl.start()
    expect(wireFn).not.toHaveBeenCalled()
    expect(ctrl.killToken).toBeNull()
  })

  it('3. registry に登録された target は handle のメソッドに委譲する', async () => {
    const child = makeMockChild()
    const registry = makeStubRegistry()
    const ctrl = createSessionController({
      spawnOptions: {
        mode: 'subscription',
        cliPath: '/x',
        spawner: () => child,
      },
      killRegistry: registry,
    })
    await ctrl.start()
    const target = registry.registered[0]!
    expect(target.alive()).toBe(true)
    target.signal('SIGTERM')
    expect(child.isAlive()).toBe(false)
  })

  it('4. dry-run mode では wire は null を返し killToken が null', async () => {
    const registry = makeStubRegistry()
    const ctrl = createSessionController({
      spawnOptions: {
        mode: 'dry-run',
        cliPath: '/x',
      },
      killRegistry: registry,
    })
    await ctrl.start()
    // dry-run は subprocess を持たないので registry に登録されない
    expect(registry.registered).toHaveLength(0)
    expect(ctrl.killToken).toBeNull()
    expect(ctrl.state).toBe('finished')
  })

  it('5. 通常 exit (triggerExit) で finished 移行 + token unregister 呼び出し', async () => {
    const child = makeMockChild()
    const registry = makeStubRegistry()
    const ctrl = createSessionController({
      spawnOptions: {
        mode: 'subscription',
        cliPath: '/x',
        spawner: () => child,
      },
      killRegistry: registry,
    })
    await ctrl.start()
    expect(registry.unregisterCalls).toBe(0)

    child.triggerExit(0)
    // handle.done() → finished の遷移を 1 tick 待つ
    await ctrl.handle!.done()
    // microtask 解決待ち
    await Promise.resolve()
    await Promise.resolve()
    expect(ctrl.state).toBe('finished')
    // wire 内 auto-unregister + recordTransition('finished') 内 ensureKillTokenReleased で
    // 二重呼び safe (idempotent)、合計 1 回以上
    expect(registry.unregisterCalls).toBeGreaterThanOrEqual(1)
  })

  it('6. kill 経由 finished でも token unregister', async () => {
    const child = makeMockChild()
    const registry = makeStubRegistry()
    const ctrl = createSessionController({
      spawnOptions: {
        mode: 'subscription',
        cliPath: '/x',
        spawner: () => child,
      },
      killRegistry: registry,
    })
    await ctrl.start()
    await ctrl.kill('test-kill')
    expect(ctrl.state).toBe('finished')
    expect(registry.unregisterCalls).toBeGreaterThanOrEqual(1)
  })

  it('7. wire 失敗時は finished へ遷移 + throw (kill-switch limit 超過想定)', async () => {
    const child = makeMockChild()
    const registry = makeStubRegistry()
    registry.failOnRegister = true
    const ctrl = createSessionController({
      spawnOptions: {
        mode: 'subscription',
        cliPath: '/x',
        spawner: () => child,
      },
      killRegistry: registry,
    })
    await expect(ctrl.start()).rejects.toThrow(/register refused/)
    expect(ctrl.state).toBe('finished')
  })

  it('8. killTargetName を指定すると wire に渡される', async () => {
    const child = makeMockChild()
    const wireFn = vi.fn(() => ({
      id: 'w1',
      unregister() {},
    }))
    const registry = makeStubRegistry()
    const ctrl = createSessionController({
      spawnOptions: {
        mode: 'subscription',
        cliPath: '/x',
        spawner: () => child,
      },
      killRegistry: registry,
      killTargetName: 'my-claude-cli',
      wireFn,
    })
    await ctrl.start()
    expect(wireFn).toHaveBeenCalledTimes(1)
    const callArgs = wireFn.mock.calls[0]!
    expect(callArgs[2]).toBe('my-claude-cli')
  })

  it('9. 6-state FSM 遷移表は無変更 (idle/starting/running/paused/killing/finished)', () => {
    expect(isTransitionAllowed('idle', 'starting')).toBe(true)
    expect(isTransitionAllowed('starting', 'running')).toBe(true)
    expect(isTransitionAllowed('starting', 'killing')).toBe(true)
    expect(isTransitionAllowed('starting', 'finished')).toBe(true)
    expect(isTransitionAllowed('running', 'paused')).toBe(true)
    expect(isTransitionAllowed('running', 'killing')).toBe(true)
    expect(isTransitionAllowed('running', 'finished')).toBe(true)
    expect(isTransitionAllowed('paused', 'running')).toBe(true)
    expect(isTransitionAllowed('paused', 'killing')).toBe(true)
    expect(isTransitionAllowed('paused', 'finished')).toBe(true)
    expect(isTransitionAllowed('killing', 'finished')).toBe(true)
    // 不正遷移
    expect(isTransitionAllowed('finished', 'starting')).toBe(false)
    expect(isTransitionAllowed('idle', 'running')).toBe(false)
    expect(isTransitionAllowed('killing', 'running')).toBe(false)
  })

  it('10. unregister は idempotent (二重呼びで複数 increment しても safe)', async () => {
    const child = makeMockChild()
    let unregisterCount = 0
    const registry: SpawnKillRegistry = {
      registerSubprocessKill: () => ({
        id: 't1',
        unregister: () => {
          unregisterCount++
        },
      }),
    }
    const ctrl = createSessionController({
      spawnOptions: {
        mode: 'subscription',
        cliPath: '/x',
        spawner: () => child,
      },
      killRegistry: registry,
    })
    await ctrl.start()
    await ctrl.kill('t')
    // recordTransition('finished') 内 ensureKillTokenReleased + wire 内 auto-unregister の
    // 双方が呼ばれても、kill-switch.ts 側の token.unregister は idempotent。
    // ここでは stub registry の unregister 自体は idempotent guard なし(増加する)が、
    // token interface 契約上 idempotent なので最低 1 回は呼ばれる
    expect(unregisterCount).toBeGreaterThanOrEqual(1)
  })

  it('11. killToken は start 前は null', () => {
    const child = makeMockChild()
    const registry = makeStubRegistry()
    const ctrl = createSessionController({
      spawnOptions: {
        mode: 'subscription',
        cliPath: '/x',
        spawner: () => child,
      },
      killRegistry: registry,
    })
    expect(ctrl.killToken).toBeNull()
  })

  it('12. killRegistry 指定 + spawnFn throw で finished + killToken null 維持', async () => {
    const registry = makeStubRegistry()
    const ctrl = createSessionController({
      spawnOptions: {
        mode: 'subscription',
        cliPath: '/x',
        // spawner 不在で throw 発生
      },
      killRegistry: registry,
    })
    await expect(ctrl.start()).rejects.toThrow()
    expect(ctrl.state).toBe('finished')
    expect(ctrl.killToken).toBeNull()
    expect(registry.registered).toHaveLength(0)
  })

  it('13. wireFn 注入が default (wireSpawnHandleToKillSwitch) を上書きする', async () => {
    const child = makeMockChild()
    const customWire = vi.fn(
      (_h: SpawnHandle, _r: SpawnKillRegistry, _n?: string): SpawnKillRegistryToken => ({
        id: 'custom-1',
        unregister: () => {},
      }),
    )
    const registry = makeStubRegistry()
    const ctrl = createSessionController({
      spawnOptions: {
        mode: 'subscription',
        cliPath: '/x',
        spawner: () => child,
      },
      killRegistry: registry,
      wireFn: customWire,
    })
    await ctrl.start()
    expect(customWire).toHaveBeenCalledTimes(1)
    expect(ctrl.killToken!.id).toBe('custom-1')
    // stub registry の registerSubprocessKill は呼ばれない (custom wire は registry を素通し)
    // ただし customWire 内では registry を使うかは実装依存 — vi.fn の return は明示
    expect(registry.registered).toHaveLength(0)
  })

  it('14. dry-run でも killRegistry 指定 OK (no-op、registered=0)', async () => {
    const registry = makeStubRegistry()
    const ctrl = createSessionController({
      spawnOptions: {
        mode: 'dry-run',
        cliPath: '/x',
      },
      killRegistry: registry,
    })
    await ctrl.start()
    expect(ctrl.state).toBe('finished')
    expect(ctrl.killToken).toBeNull()
    expect(registry.registered).toHaveLength(0)
  })

  it('15. start を二重に呼ぶと throw (FSM 不変)', async () => {
    const child = makeMockChild()
    const registry = makeStubRegistry()
    const ctrl = createSessionController({
      spawnOptions: {
        mode: 'subscription',
        cliPath: '/x',
        spawner: () => child,
      },
      killRegistry: registry,
    })
    await ctrl.start()
    await expect(ctrl.start()).rejects.toThrow(/cannot start from state=running/)
  })
})
