/**
 * wrapper-contract.test — Round 5 W0-Week2 5 日前倒し:
 *   subprocess spawn contract と factory の型/挙動検証。
 *
 * 関連:
 *   - DEC-019-006 P-D 改 (subprocess spawn 経由)
 *   - DEC-019-051 施策-1 (mock-claude スタブ統合)
 *
 * 注意: W0 段階では Real は constructor 即 throw。本テストは shape 確認に留め、
 * 実 spawn は W1 (CB-D-W1-XX) で別テストファイル化する。
 */
import { describe, it, expect } from 'vitest'
import {
  MockOpenclawRuntime,
  RealOpenclawRuntime,
  createOpenclawRuntime,
  type OpenclawRuntime,
  type SubprocessSpawnContract,
  type OpenclawRuntimeContract,
} from '../index.js'

describe('SubprocessSpawnContract (DEC-019-006 P-D 改 整合)', () => {
  it('shape を満たすオブジェクトが型 assignable', () => {
    const spawn: SubprocessSpawnContract = {
      command: '/usr/local/bin/openclaw',
      args: ['agent', '--headless', '--config', '/tmp/openclaw.json'],
      env: { PATH: '/usr/bin:/bin', HOME: '/home/runner' },
      timeoutMs: 30_000,
      dryRun: true,
    }
    expect(spawn.command).toMatch(/openclaw$/)
    expect(spawn.args).toContain('--headless')
    expect(Object.keys(spawn.env).length).toBe(2)
    expect(spawn.dryRun).toBe(true)
  })

  it('OpenclawRuntimeContract が spawn と runtime を集約する', () => {
    const contract: OpenclawRuntimeContract = {
      spawn: {
        command: 'openclaw',
        args: [],
        env: {},
        timeoutMs: 1_000,
        dryRun: true,
      },
      runtime: new MockOpenclawRuntime(),
    }
    const _typecheck: OpenclawRuntime = contract.runtime
    expect(typeof contract.runtime.init).toBe('function')
    expect(_typecheck).toBeDefined()
  })
})

describe('createOpenclawRuntime factory (DEC-019-051 施策-1)', () => {
  it('既定で Mock を返す (W0)', () => {
    const rt = createOpenclawRuntime()
    expect(rt).toBeInstanceOf(MockOpenclawRuntime)
  })

  it("mode='mock' を明示しても Mock を返す", () => {
    const rt = createOpenclawRuntime('mock')
    expect(rt).toBeInstanceOf(MockOpenclawRuntime)
  })

  it("mode='real' は W0 では throw する (RealOpenclawRuntime ctor)", () => {
    expect(() => createOpenclawRuntime('real')).toThrow(/not implemented/i)
  })

  it("env CLAWBRIDGE_OPENCLAW_RUNTIME='real' は W0 で throw", () => {
    const original = process.env['CLAWBRIDGE_OPENCLAW_RUNTIME']
    try {
      process.env['CLAWBRIDGE_OPENCLAW_RUNTIME'] = 'real'
      expect(() => createOpenclawRuntime()).toThrow(/not implemented/i)
    } finally {
      if (original === undefined) delete process.env['CLAWBRIDGE_OPENCLAW_RUNTIME']
      else process.env['CLAWBRIDGE_OPENCLAW_RUNTIME'] = original
    }
  })

  it('Mock factory で生成したインスタンスが OpenclawRuntime contract 4 メソッド全て持つ', () => {
    const rt = createOpenclawRuntime('mock')
    expect(typeof rt.init).toBe('function')
    expect(typeof rt.runLoop).toBe('function')
    expect(typeof rt.shutdown).toBe('function')
    expect(typeof rt.getStatus).toBe('function')
  })

  it('Real prototype は contract 4 メソッドを保持 (instanceof は ctor で throw されるため不可)', () => {
    const proto = RealOpenclawRuntime.prototype as Record<string, unknown>
    expect(typeof proto['init']).toBe('function')
    expect(typeof proto['runLoop']).toBe('function')
    expect(typeof proto['shutdown']).toBe('function')
    expect(typeof proto['getStatus']).toBe('function')
  })
})
