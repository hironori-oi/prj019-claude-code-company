/**
 * cli-version-check-exec.test — Round 14 Dev-D 着地 (Task B):
 *   actual `claude-code --version` spawn 経路の wrapper 検証.
 *
 * カバー範囲:
 *   - buildVersionSpawnOptions: SpawnClaudeCodeOptions 組立て
 *   - shouldRecommendFallback: outcome 別判定
 *   - interpretSpawnOutcome: timeout / spawn_failed / success の純関数判定
 *   - runActualClaudeCodeVersion: spawnerOverride 経由 mock 起動
 *   - 5 秒 timeout default の固定化
 *   - validation error 時 outcome='spawn_failed' fallback
 */
import { describe, it, expect } from 'vitest'
import {
  buildVersionSpawnOptions,
  interpretSpawnOutcome,
  shouldRecommendFallback,
  runActualClaudeCodeVersion,
  DEFAULT_VERSION_EXEC_TIMEOUT_MS,
} from '../cli-version-check-exec.js'
import type {
  MockChildProcess,
  SpawnClaudeCodeOptions,
} from '../spawn-claude-code.js'
import type { AcceptedRange } from '../cli-version-check.js'

const ACCEPTED: AcceptedRange = Object.freeze({
  minMajor: 1,
  minMinor: 0,
  maxMajorExclusive: 2,
})

/**
 * fake spawner: 指定の stdout / exit code を即時 emit する MockChildProcess を返す.
 */
function fakeSpawner(args: {
  stdout?: string
  stderr?: string
  exitCode?: number | null
  exitDelayMs?: number
  throwOnSpawn?: boolean
}): (opts: SpawnClaudeCodeOptions) => MockChildProcess {
  return () => {
    if (args.throwOnSpawn) {
      throw new Error('fake spawner refused')
    }
    let alive = true
    const stdoutListeners: Array<(line: string) => void> = []
    const stderrListeners: Array<(line: string) => void> = []
    const exitListeners: Array<(code: number | null, signal: string | null) => void> = []
    const child: MockChildProcess = {
      pid: 99999,
      onStdoutLine(l) {
        stdoutListeners.push(l)
      },
      onStderrLine(l) {
        stderrListeners.push(l)
      },
      onExit(l) {
        exitListeners.push(l)
      },
      kill(_sig) {
        alive = false
        return true
      },
      isAlive() {
        return alive
      },
    }
    setTimeout(
      () => {
        if (args.stdout) {
          for (const line of args.stdout.split(/\r?\n/)) {
            for (const l of stdoutListeners) l(line)
          }
        }
        if (args.stderr) {
          for (const line of args.stderr.split(/\r?\n/)) {
            for (const l of stderrListeners) l(line)
          }
        }
        alive = false
        const code = args.exitCode === undefined ? 0 : args.exitCode
        for (const l of exitListeners) l(code, null)
      },
      args.exitDelayMs ?? 0,
    )
    return child
  }
}

describe('Round 14 Dev-D Task B: cli-version-check-exec (actual spawn wrapper)', () => {
  describe('純関数 helpers', () => {
    it('1. DEFAULT_VERSION_EXEC_TIMEOUT_MS = 5000', () => {
      expect(DEFAULT_VERSION_EXEC_TIMEOUT_MS).toBe(5_000)
    })

    it('2. buildVersionSpawnOptions: mode/cliPath/args 固定化', () => {
      const opts = buildVersionSpawnOptions({
        cliPath: '/usr/local/bin/claude',
      })
      expect(opts.mode).toBe('subscription')
      expect(opts.cliPath).toBe('/usr/local/bin/claude')
      expect(opts.args).toEqual(['--version'])
    })

    it('3. buildVersionSpawnOptions: cwd / nowIso forwarded', () => {
      const fixedNow = '2026-05-04T12:00:00.000Z'
      const opts = buildVersionSpawnOptions({
        cliPath: '/usr/local/bin/claude',
        cwd: '/tmp',
        nowIso: () => fixedNow,
      })
      expect(opts.cwd).toBe('/tmp')
      expect(opts.nowIso?.()).toBe(fixedNow)
    })

    it('4. shouldRecommendFallback: ok + fallbackToDryRun=false → false', () => {
      expect(
        shouldRecommendFallback({
          outcome: 'ok',
          version: { major: 1, minor: 5, patch: 0 },
          rawStdout: '',
          rawStderr: '',
          warning: null,
          fallbackToDryRun: false,
        }),
      ).toBe(false)
    })

    it('5. shouldRecommendFallback: その他全 outcome → true', () => {
      const outcomes = [
        'out_of_range',
        'unparseable',
        'spawn_failed',
        'timeout',
      ] as const
      for (const o of outcomes) {
        expect(
          shouldRecommendFallback({
            outcome: o,
            version: null,
            rawStdout: '',
            rawStderr: '',
            warning: 'x',
            fallbackToDryRun: true,
          }),
        ).toBe(true)
      }
    })

    it('6. interpretSpawnOutcome: timeout=true → outcome=timeout', () => {
      const r = interpretSpawnOutcome({
        stdout: '',
        stderr: '',
        exitCode: null,
        exitSignal: 'SIGTERM',
        timedOut: true,
        timeoutMs: 5000,
        acceptedRange: ACCEPTED,
      })
      expect(r.outcome).toBe('timeout')
      expect(r.fallbackToDryRun).toBe(true)
      expect(r.warning).toContain('5000ms')
    })

    it('7. interpretSpawnOutcome: exitCode!=0 → outcome=spawn_failed', () => {
      const r = interpretSpawnOutcome({
        stdout: '',
        stderr: 'oops',
        exitCode: 1,
        exitSignal: null,
        timedOut: false,
        timeoutMs: 5000,
        acceptedRange: ACCEPTED,
      })
      expect(r.outcome).toBe('spawn_failed')
      expect(r.fallbackToDryRun).toBe(true)
    })
  })

  describe('runActualClaudeCodeVersion (spawner injection)', () => {
    it('8. spawnerOverride 経由で valid version stdout → outcome=ok', async () => {
      const out = await runActualClaudeCodeVersion({
        cliPath: '/usr/local/bin/claude',
        spawnerOverride: fakeSpawner({
          stdout: 'claude-code 1.5.0',
          exitCode: 0,
        }),
      })
      expect(out.result.outcome).toBe('ok')
      expect(out.result.version).toEqual({ major: 1, minor: 5, patch: 0 })
      expect(out.fallbackRecommended).toBe(false)
    })

    it('9. spawnerOverride: out_of_range → fallbackRecommended=true', async () => {
      const out = await runActualClaudeCodeVersion({
        cliPath: '/usr/local/bin/claude',
        spawnerOverride: fakeSpawner({
          stdout: 'claude-code 2.0.0',
          exitCode: 0,
        }),
      })
      expect(out.result.outcome).toBe('out_of_range')
      expect(out.fallbackRecommended).toBe(true)
    })

    it('10. spawnerOverride: garbage stdout → outcome=unparseable', async () => {
      const out = await runActualClaudeCodeVersion({
        cliPath: '/usr/local/bin/claude',
        spawnerOverride: fakeSpawner({
          stdout: 'garbage no version',
          exitCode: 0,
        }),
      })
      expect(out.result.outcome).toBe('unparseable')
      expect(out.fallbackRecommended).toBe(true)
    })

    it('11. spawnerOverride throws → outcome=spawn_failed (validation fallback)', async () => {
      const out = await runActualClaudeCodeVersion({
        cliPath: '/usr/local/bin/claude',
        spawnerOverride: fakeSpawner({ throwOnSpawn: true }),
      })
      expect(out.result.outcome).toBe('spawn_failed')
      expect(out.fallbackRecommended).toBe(true)
    })

    it('12. spawnerOverride: exitCode=1 → outcome=spawn_failed', async () => {
      const out = await runActualClaudeCodeVersion({
        cliPath: '/usr/local/bin/claude',
        spawnerOverride: fakeSpawner({
          stdout: '',
          stderr: 'cannot start',
          exitCode: 1,
        }),
      })
      expect(out.result.outcome).toBe('spawn_failed')
    })

    it('13. timeoutMs 短縮で timeout 経路を発火', async () => {
      const out = await runActualClaudeCodeVersion({
        cliPath: '/usr/local/bin/claude',
        timeoutMs: 50,
        spawnerOverride: fakeSpawner({
          stdout: 'claude-code 1.5.0',
          exitCode: 0,
          exitDelayMs: 500, // 50ms timeout の前に exit しない
        }),
      })
      expect(out.result.outcome).toBe('timeout')
      expect(out.fallbackRecommended).toBe(true)
    })

    it('14. invalid cliPath (空文字) で実 path に入っても spawn_failed fallback', async () => {
      // spawnerOverride 未指定 + 空 cliPath → real-child-spawn の validation で throw
      // → catch して outcome='spawn_failed' に変換される.
      const out = await runActualClaudeCodeVersion({
        cliPath: '',
      })
      expect(out.result.outcome).toBe('spawn_failed')
      expect(out.fallbackRecommended).toBe(true)
      expect(out.result.warning).toContain('起動失敗')
    })

    it('15. relative cliPath は real-child-spawn validation で reject → spawn_failed', async () => {
      const out = await runActualClaudeCodeVersion({
        cliPath: 'claude-code', // 相対パス
      })
      expect(out.result.outcome).toBe('spawn_failed')
      expect(out.fallbackRecommended).toBe(true)
    })

    it('16. acceptedRange 外で out_of_range', async () => {
      const out = await runActualClaudeCodeVersion({
        cliPath: '/usr/local/bin/claude',
        acceptedRange: { minMajor: 1, minMinor: 5, maxMajorExclusive: 2 },
        spawnerOverride: fakeSpawner({
          stdout: 'claude-code 1.4.0', // minMinor=5 未満
          exitCode: 0,
        }),
      })
      expect(out.result.outcome).toBe('out_of_range')
    })
  })
})
