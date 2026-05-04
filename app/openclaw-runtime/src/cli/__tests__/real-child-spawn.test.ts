/**
 * cli/__tests__/real-child-spawn.test — Round 12 Dev-C 着地:
 *   real-child-spawn.ts 単体テスト (mock spawn factory 使用、実 spawn 0)。
 *
 * カバー範囲 (13 tests):
 *   1. validateSpawnInputs: cliPath empty / 相対 / cwd 相対 / args null / extraEnv invalid key
 *   2. buildAllowlistedEnv: allowlist mode / inheritEnv mode / extraEnv merge
 *   3. spawnRealChildProcess: shell:false / argv 配列固定 / env allowlist 適用
 *   4. emergency override で ANTHROPIC_API_KEY が allowlist に追加
 *   5. SIGTERM kill → grace タイマー登録 (mock spawn では timer 検証のみ)
 *   6. preFlightHook が resolved config 受け取る
 *   7. deriveRealSpawnOptions: SpawnClaudeCodeOptions → RealChildSpawnOptions 純変換
 *   8. createRealSpawner factory が spawnClaudeCode と互換
 */
import { describe, it, expect, vi } from 'vitest'
import type { SpawnOptions } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { Readable, Writable } from 'node:stream'

import {
  spawnRealChildProcess,
  validateSpawnInputs,
  buildAllowlistedEnv,
  deriveRealSpawnOptions,
  createRealSpawner,
  RealChildSpawnValidationError,
  DEFAULT_ENV_ALLOWLIST,
  EMERGENCY_API_ENV_ALLOWLIST,
  type RealChildSpawnOptions,
} from '../real-child-spawn.js'
import type { SpawnClaudeCodeOptions } from '../spawn-claude-code.js'

/**
 * mock spawn factory: ChildProcess 風の EventEmitter を返し、shell:false など
 * spawnOptions の正当性を spy で検証可能にする。
 */
function makeFakeChildProcess(): EventEmitter & {
  pid: number
  stdout: Readable
  stderr: Readable
  stdin: Writable
  kill: (sig?: NodeJS.Signals | number) => boolean
  killed: boolean
  emitExit: (code: number | null, signal: string | null) => void
} {
  const emitter = new EventEmitter() as EventEmitter & {
    pid: number
    stdout: Readable
    stderr: Readable
    stdin: Writable
    kill: (sig?: NodeJS.Signals | number) => boolean
    killed: boolean
    emitExit: (code: number | null, signal: string | null) => void
  }
  emitter.pid = 12345
  emitter.killed = false
  // Readable streams 偽装
  emitter.stdout = new Readable({ read() {} })
  emitter.stderr = new Readable({ read() {} })
  emitter.stdin = new Writable({ write(_c, _e, cb) { cb() } })
  emitter.kill = (_sig) => {
    emitter.killed = true
    return true
  }
  emitter.emitExit = (code, signal) => {
    emitter.emit('exit', code, signal)
  }
  return emitter
}

describe('real-child-spawn / validateSpawnInputs (R12 Dev-C)', () => {
  it('1. cliPath empty で throw', () => {
    expect(() => validateSpawnInputs({ cliPath: '' })).toThrow(
      RealChildSpawnValidationError,
    )
  })

  it('2. cliPath 相対パスで throw', () => {
    try {
      validateSpawnInputs({ cliPath: 'relative/claude' })
      throw new Error('should not reach')
    } catch (e) {
      expect(e).toBeInstanceOf(RealChildSpawnValidationError)
      expect((e as RealChildSpawnValidationError).code).toBe(
        'cliPath_not_absolute',
      )
    }
  })

  it('3. cwd 相対パスで throw', () => {
    expect(() =>
      validateSpawnInputs({
        cliPath: process.platform === 'win32' ? 'C:\\bin\\claude' : '/usr/bin/claude',
        cwd: 'relative',
      }),
    ).toThrow(RealChildSpawnValidationError)
  })

  it('4. args に null/undefined 含まれると throw', () => {
    const cliPath =
      process.platform === 'win32' ? 'C:\\bin\\claude' : '/usr/bin/claude'
    expect(() =>
      validateSpawnInputs({
        cliPath,
        args: ['ok', null as unknown as string, 'next'],
      }),
    ).toThrow(/args\[1\] is null/)
  })

  it('5. extraEnv key invalid (数字始まり) で throw', () => {
    const cliPath =
      process.platform === 'win32' ? 'C:\\bin\\claude' : '/usr/bin/claude'
    expect(() =>
      validateSpawnInputs({
        cliPath,
        extraEnv: { '1BAD': 'x' },
      }),
    ).toThrow(/extraEnv key invalid/)
  })
})

describe('real-child-spawn / buildAllowlistedEnv (R12 Dev-C)', () => {
  it('6. allowlist mode で他 env 変数は遮断', () => {
    const src = { PATH: '/p', SECRET: 'leak', HOME: '/h', RANDOM_X: 'y' }
    const env = buildAllowlistedEnv(src, ['PATH', 'HOME'])
    expect(env).toEqual({ PATH: '/p', HOME: '/h' })
    expect(env.SECRET).toBeUndefined()
  })

  it('7. inheritEnv=true で全 env を渡す + extraEnv は overlay', () => {
    const src = { PATH: '/p', RANDOM: 'r' }
    const env = buildAllowlistedEnv(src, ['PATH'], { EXTRA: 'e' }, true)
    expect(env.PATH).toBe('/p')
    expect(env.RANDOM).toBe('r')
    expect(env.EXTRA).toBe('e')
  })

  it('8. extraEnv merge は allowlist mode でも適用', () => {
    const env = buildAllowlistedEnv(
      { PATH: '/p' },
      ['PATH'],
      { ANTHROPIC_API_KEY: 'sk-test' },
      false,
    )
    expect(env.ANTHROPIC_API_KEY).toBe('sk-test')
    expect(env.PATH).toBe('/p')
  })
})

describe('real-child-spawn / spawnRealChildProcess (R12 Dev-C, mock spawn)', () => {
  it('9. shell:false / argv 配列が spawnFn に渡る', () => {
    const fakeChild = makeFakeChildProcess()
    const spawnSpy = vi.fn().mockReturnValue(fakeChild)
    const cliPath =
      process.platform === 'win32' ? 'C:\\bin\\claude.exe' : '/usr/bin/claude'

    spawnRealChildProcess({
      cliPath,
      args: ['-p', 'hello'],
      cwd: process.platform === 'win32' ? 'C:\\tmp' : '/tmp',
      spawnFn: spawnSpy as unknown as RealChildSpawnOptions['spawnFn'],
    })

    expect(spawnSpy).toHaveBeenCalledTimes(1)
    const [cmd, args, options] = spawnSpy.mock.calls[0]!
    expect(cmd).toBe(cliPath)
    expect(args).toEqual(['-p', 'hello'])
    const opts = options as SpawnOptions
    expect(opts.shell).toBe(false)
    expect(opts.windowsHide).toBe(true)
    expect(opts.detached).toBe(false)
  })

  it('10. allowlist 既定 (PATH/HOME/LANG) のみ env に渡る', () => {
    const fakeChild = makeFakeChildProcess()
    const spawnSpy = vi.fn().mockReturnValue(fakeChild)
    const cliPath =
      process.platform === 'win32' ? 'C:\\bin\\claude.exe' : '/usr/bin/claude'
    // process.env を一時 mutate して制御
    const orig = { ...process.env }
    process.env.PATH = '/test/p'
    process.env.HOME = '/test/h'
    process.env.LANG = 'en_US.UTF-8'
    process.env.SHOULD_NOT_LEAK = 'leak-me'
    try {
      spawnRealChildProcess({
        cliPath,
        spawnFn: spawnSpy as unknown as RealChildSpawnOptions['spawnFn'],
      })
      const opts = spawnSpy.mock.calls[0]![2] as SpawnOptions
      const env = opts.env as Record<string, string>
      expect(env.PATH).toBe('/test/p')
      expect(env.HOME).toBe('/test/h')
      expect(env.LANG).toBe('en_US.UTF-8')
      expect(env.SHOULD_NOT_LEAK).toBeUndefined()
    } finally {
      process.env = orig
    }
  })

  it('11. emergencyApiOverride=true で ANTHROPIC_API_KEY が allowlist に追加される', () => {
    const fakeChild = makeFakeChildProcess()
    const spawnSpy = vi.fn().mockReturnValue(fakeChild)
    const cliPath =
      process.platform === 'win32' ? 'C:\\bin\\claude.exe' : '/usr/bin/claude'
    const orig = { ...process.env }
    process.env.ANTHROPIC_API_KEY = 'sk-emergency'
    try {
      spawnRealChildProcess({
        cliPath,
        emergencyApiOverride: true,
        spawnFn: spawnSpy as unknown as RealChildSpawnOptions['spawnFn'],
      })
      const opts = spawnSpy.mock.calls[0]![2] as SpawnOptions
      const env = opts.env as Record<string, string>
      expect(env.ANTHROPIC_API_KEY).toBe('sk-emergency')
    } finally {
      process.env = orig
    }
    expect(EMERGENCY_API_ENV_ALLOWLIST).toContain('ANTHROPIC_API_KEY')
  })

  it('12. preFlightHook が resolved config を受け取る (frozen)', () => {
    const fakeChild = makeFakeChildProcess()
    const spawnSpy = vi.fn().mockReturnValue(fakeChild)
    const cliPath =
      process.platform === 'win32' ? 'C:\\bin\\claude.exe' : '/usr/bin/claude'
    const cwd = process.platform === 'win32' ? 'C:\\tmp' : '/tmp'
    const hook = vi.fn()
    spawnRealChildProcess({
      cliPath,
      args: ['-p', 'q'],
      cwd,
      preFlightHook: hook,
      spawnFn: spawnSpy as unknown as RealChildSpawnOptions['spawnFn'],
    })
    expect(hook).toHaveBeenCalledTimes(1)
    const arg = hook.mock.calls[0]![0]
    expect(arg.command).toBe(cliPath)
    expect(arg.args).toEqual(['-p', 'q'])
    expect(arg.cwd).toBe(cwd)
    expect(Object.isFrozen(arg)).toBe(true)
    expect(Object.isFrozen(arg.args)).toBe(true)
    expect(Object.isFrozen(arg.env)).toBe(true)
  })

  it('13. SIGTERM kill 後 grace タイマー登録 (mock では即時 alive=false で SIGKILL fall-through 無し)', async () => {
    const fakeChild = makeFakeChildProcess()
    const spawnSpy = vi.fn().mockReturnValue(fakeChild)
    const cliPath =
      process.platform === 'win32' ? 'C:\\bin\\claude.exe' : '/usr/bin/claude'
    const handle = spawnRealChildProcess({
      cliPath,
      killGraceMs: 50,
      spawnFn: spawnSpy as unknown as RealChildSpawnOptions['spawnFn'],
    })
    expect(handle.isAlive()).toBe(true)
    handle.kill('SIGTERM')
    expect(fakeChild.killed).toBe(true)
    // exit を発火させて isAlive=false に
    fakeChild.emitExit(null, 'SIGTERM')
    // grace タイマー満了を待つ
    await new Promise((r) => setTimeout(r, 80))
    expect(handle.isAlive()).toBe(false)
  })
})

describe('real-child-spawn / deriveRealSpawnOptions (R12 Dev-C)', () => {
  it('14. SpawnClaudeCodeOptions から RealChildSpawnOptions へ純変換', () => {
    const src: SpawnClaudeCodeOptions = {
      mode: 'subscription',
      cliPath: '/abs/claude',
      args: ['-p', 'x'],
      cwd: '/abs/cwd',
      env: { PATH: '/p' },
    }
    const out = deriveRealSpawnOptions(src)
    expect(out.cliPath).toBe('/abs/claude')
    expect(out.args).toEqual(['-p', 'x'])
    expect(out.cwd).toBe('/abs/cwd')
    expect(out.extraEnv).toEqual({ PATH: '/p' })
    expect(out.inheritEnv).toBe(false)
    expect(out.envAllowlist).toBe(DEFAULT_ENV_ALLOWLIST)
    expect(out.emergencyApiOverride).toBe(false)
  })

  it('15. mode=api の場合 emergencyApiOverride=true (auto)', () => {
    const out = deriveRealSpawnOptions({
      mode: 'api',
      cliPath: '/abs/claude',
    })
    expect(out.emergencyApiOverride).toBe(true)
  })

  it('16. createRealSpawner factory が SpawnClaudeCodeOptions を受けて MockChildProcess を返す', () => {
    const fakeChild = makeFakeChildProcess()
    const spawnSpy = vi.fn().mockReturnValue(fakeChild)
    const cliPath =
      process.platform === 'win32' ? 'C:\\bin\\claude.exe' : '/usr/bin/claude'
    const spawner = createRealSpawner({
      spawnFn: spawnSpy as unknown as RealChildSpawnOptions['spawnFn'],
    })
    const child = spawner({
      mode: 'subscription',
      cliPath,
      args: ['--ver'],
    })
    expect(spawnSpy).toHaveBeenCalledTimes(1)
    expect(child.pid).toBe(12345)
    expect(typeof child.kill).toBe('function')
  })
})
