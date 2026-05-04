import { describe, it, expect } from 'vitest'
import {
  MockOpenclawRuntime,
  RealOpenclawRuntime,
  type OpenclawConfig,
  type OpenclawRuntime,
} from '../index.js'

const baseConfig: OpenclawConfig = {
  provider: 'openai_codex',
  envAllowList: ['PATH', 'HOME', 'USERPROFILE'],
  loopTimeoutMs: 30_000,
  dryRun: true,
}

describe('MockOpenclawRuntime', () => {
  it('init / shutdown is idempotent', async () => {
    const rt = new MockOpenclawRuntime()
    expect(rt.getStatus().initialized).toBe(false)

    await rt.init(baseConfig)
    expect(rt.getStatus().initialized).toBe(true)
    // double init: no error
    await rt.init(baseConfig)
    expect(rt.getStatus().initialized).toBe(true)

    await rt.shutdown()
    expect(rt.getStatus().initialized).toBe(false)
    // double shutdown: no error
    await rt.shutdown()
    expect(rt.getStatus().initialized).toBe(false)
  })

  it('runLoop returns mock LoopResult with expected shape', async () => {
    const rt = new MockOpenclawRuntime()
    await rt.init(baseConfig)

    const out = await rt.runLoop('AI-powered networking app for solo devs')
    expect(out.status).toBe('completed')
    expect(out.actions).toHaveLength(1)
    expect(out.actions[0]?.kind).toBe('classify_need')
    expect(out.needs).toHaveLength(1)
    expect(out.needs[0]?.needId).toMatch(/^mock-need-/)
    expect(typeof out.startedAt).toBe('string')
    expect(typeof out.finishedAt).toBe('string')

    // empty needSummary → no_action
    const empty = await rt.runLoop('   ')
    expect(empty.status).toBe('no_action')
    expect(empty.needs).toHaveLength(0)
  })

  it('getStatus reflects initialized + totalLoops + lastStatus correctly', async () => {
    const rt = new MockOpenclawRuntime()

    // before init
    let status = rt.getStatus()
    expect(status.initialized).toBe(false)
    expect(status.totalLoops).toBe(0)
    expect(status.lastLoopFinishedAt).toBeNull()
    expect(status.lastStatus).toBeNull()

    await rt.init(baseConfig)
    await rt.runLoop('foo')
    await rt.runLoop('bar')

    status = rt.getStatus()
    expect(status.initialized).toBe(true)
    expect(status.running).toBe(false)
    expect(status.totalLoops).toBe(2)
    expect(status.lastStatus).toBe('completed')
    expect(typeof status.lastLoopFinishedAt).toBe('string')

    await rt.shutdown()
  })

  it('runLoop throws when not initialized', async () => {
    const rt = new MockOpenclawRuntime()
    await expect(rt.runLoop('x')).rejects.toThrow(/not initialized/)
  })
})

describe('RealOpenclawRuntime', () => {
  it('throws "not implemented" when instantiated in W0', () => {
    expect(() => new RealOpenclawRuntime()).toThrow(/not implemented/i)
  })
})

describe('OpenclawRuntime contract', () => {
  it('any implementing class must expose 4 required methods', () => {
    // 静的 type check は OpenclawRuntime 型注釈で確保。
    // 実行時には Mock の prototype に 4 メソッドが揃っていることを確認する。
    const rt: OpenclawRuntime = new MockOpenclawRuntime()
    expect(typeof rt.init).toBe('function')
    expect(typeof rt.runLoop).toBe('function')
    expect(typeof rt.shutdown).toBe('function')
    expect(typeof rt.getStatus).toBe('function')

    // Real は constructor で throw するため、prototype チェック側で 4 メソッドの存在を確認
    const realProto = RealOpenclawRuntime.prototype as Record<string, unknown>
    expect(typeof realProto['init']).toBe('function')
    expect(typeof realProto['runLoop']).toBe('function')
    expect(typeof realProto['shutdown']).toBe('function')
    expect(typeof realProto['getStatus']).toBe('function')
  })
})
