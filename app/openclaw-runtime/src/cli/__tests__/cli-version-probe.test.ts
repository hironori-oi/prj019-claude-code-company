/**
 * cli-version-probe.test — Round 15 Dev-M (M-2):
 *   actual subprocess exec で version probe を行う Result 型 helper の検証.
 *
 * カバー範囲:
 *   - normalizeTimeoutMs: 5 sec default + invalid 値の正規化
 *   - buildProbeResult (純関数): ok / err 分岐 + gate-12 request 自動 build
 *   - probeClaudeCodeVersion: spawnerOverride (high-level mock) 経由 success / fail
 *   - probeClaudeCodeVersion: spawnFn (raw subprocess mock) 経由 success / timeout
 *   - timeout 5 sec default + override
 *   - 異常終了 (exit code 1) + stdout garbage の fallback
 */
import { describe, it, expect, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import {
  probeClaudeCodeVersion,
  buildProbeResult,
  normalizeTimeoutMs,
  DEFAULT_VERSION_EXEC_TIMEOUT_MS,
} from '../index.js'
import type {
  MockChildProcess,
  SpawnClaudeCodeOptions,
} from '../spawn-claude-code.js'
import type {
  AcceptedRange,
  CliVersionCheckResult,
} from '../cli-version-check.js'

const ACCEPTED: AcceptedRange = Object.freeze({
  minMajor: 1,
  minMinor: 0,
  maxMajorExclusive: 2,
})

/**
 * 高層 fake spawner: cli-version-check-exec.test と同パターンで
 * MockChildProcess を即時 emit する.
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

/**
 * 低層 fake spawnFn: node:child_process.spawn の代替.
 * EventEmitter ベースで stdout/stderr/exit を emit する fake ChildProcess を返す.
 */
function makeFakeSpawnFn(args: {
  stdout?: string
  stderr?: string
  exitCode?: number | null
  exitDelayMs?: number
}): (...spawnArgs: unknown[]) => unknown {
  return () => {
    const ee = new EventEmitter()
    const stdout = new EventEmitter()
    const stderr = new EventEmitter()
    const child = Object.assign(ee, {
      pid: 12345,
      stdout,
      stderr,
      stdin: null,
      kill(_signal?: NodeJS.Signals | number) {
        return true
      },
    })
    setTimeout(
      () => {
        if (args.stdout) {
          stdout.emit('data', Buffer.from(args.stdout, 'utf-8'))
        }
        if (args.stderr) {
          stderr.emit('data', Buffer.from(args.stderr, 'utf-8'))
        }
        const code = args.exitCode === undefined ? 0 : args.exitCode
        ee.emit('exit', code, null)
        ee.emit('close', code, null)
      },
      args.exitDelayMs ?? 0,
    )
    return child
  }
}

describe('Round 15 Dev-M M-2: cli-version-probe (actual exec + Result type)', () => {
  describe('normalizeTimeoutMs (純関数)', () => {
    it('1. undefined → DEFAULT_VERSION_EXEC_TIMEOUT_MS (5000)', () => {
      expect(normalizeTimeoutMs(undefined)).toBe(DEFAULT_VERSION_EXEC_TIMEOUT_MS)
      expect(DEFAULT_VERSION_EXEC_TIMEOUT_MS).toBe(5000)
    })

    it('2. NaN / 0 / 負数 / Infinity → 5000', () => {
      expect(normalizeTimeoutMs(NaN)).toBe(5000)
      expect(normalizeTimeoutMs(0)).toBe(5000)
      expect(normalizeTimeoutMs(-100)).toBe(5000)
      expect(normalizeTimeoutMs(Infinity)).toBe(5000)
    })

    it('3. 正常値はそのまま (整数化)', () => {
      expect(normalizeTimeoutMs(3000)).toBe(3000)
      expect(normalizeTimeoutMs(123.7)).toBe(123)
    })
  })

  describe('buildProbeResult (純関数)', () => {
    it('4. outcome=ok → CliVersionProbeOk + gateRequest=null', () => {
      const result: CliVersionCheckResult = {
        outcome: 'ok',
        version: { major: 1, minor: 5, patch: 0 },
        rawStdout: 'claude-code 1.5.0',
        rawStderr: '',
        warning: null,
        fallbackToDryRun: false,
      }
      const probe = buildProbeResult({
        result,
        cliPath: '/usr/local/bin/claude',
        acceptedRange: ACCEPTED,
        timeoutMs: 5000,
      })
      expect(probe.ok).toBe(true)
      expect(probe.gateRequest).toBeNull()
    })

    it('5. outcome=out_of_range → CliVersionProbeErr + gate-12 request 自動 build', () => {
      const result: CliVersionCheckResult = {
        outcome: 'out_of_range',
        version: { major: 2, minor: 0, patch: 0 },
        rawStdout: 'claude-code 2.0.0',
        rawStderr: '',
        warning: 'out of range',
        fallbackToDryRun: true,
      }
      const probe = buildProbeResult({
        result,
        cliPath: '/usr/local/bin/claude',
        acceptedRange: ACCEPTED,
        timeoutMs: 5000,
      })
      expect(probe.ok).toBe(false)
      if (!probe.ok) {
        expect(probe.outcome).toBe('out_of_range')
        expect(probe.gateRequest).not.toBeNull()
        expect(probe.gateRequest.type).toBe('cli_version_update_approval')
        expect(probe.gateRequest.risk).toBe('high')
        expect(probe.fallbackRecommended).toBe(true)
      }
    })

    it('6. outcome=timeout → gate-12 request の payload に timeoutMs 反映', () => {
      const result: CliVersionCheckResult = {
        outcome: 'timeout',
        version: null,
        rawStdout: '',
        rawStderr: '',
        warning: 'timeout 5000ms',
        fallbackToDryRun: true,
      }
      const probe = buildProbeResult({
        result,
        cliPath: '/usr/local/bin/claude',
        acceptedRange: ACCEPTED,
        timeoutMs: 5000,
      })
      if (!probe.ok) {
        expect(probe.outcome).toBe('timeout')
        // payload.timeoutMs が含まれることを検証
        const payload = probe.gateRequest.payload as Record<string, unknown>
        expect(payload['outcome']).toBe('timeout')
        expect(payload['timeoutMs']).toBe(5000)
      }
    })
  })

  describe('probeClaudeCodeVersion (spawnerOverride 経由 high-level mock)', () => {
    it('7. valid stdout → ok=true', async () => {
      const probe = await probeClaudeCodeVersion({
        cliPath: '/usr/local/bin/claude',
        spawnerOverride: fakeSpawner({
          stdout: 'claude-code 1.5.0',
          exitCode: 0,
        }),
      })
      expect(probe.ok).toBe(true)
      expect(probe.outcome).toBe('ok')
      expect(probe.result.version).toEqual({ major: 1, minor: 5, patch: 0 })
      expect(probe.gateRequest).toBeNull()
    })

    it('8. out_of_range → ok=false + gate-12 request 自動 build', async () => {
      const probe = await probeClaudeCodeVersion({
        cliPath: '/usr/local/bin/claude',
        spawnerOverride: fakeSpawner({
          stdout: 'claude-code 2.0.0',
          exitCode: 0,
        }),
      })
      expect(probe.ok).toBe(false)
      if (!probe.ok) {
        expect(probe.outcome).toBe('out_of_range')
        expect(probe.gateRequest.type).toBe('cli_version_update_approval')
      }
    })

    it('9. exit code=1 → ok=false + outcome=spawn_failed', async () => {
      const probe = await probeClaudeCodeVersion({
        cliPath: '/usr/local/bin/claude',
        spawnerOverride: fakeSpawner({
          stdout: '',
          stderr: 'cannot start',
          exitCode: 1,
        }),
      })
      expect(probe.ok).toBe(false)
      if (!probe.ok) {
        expect(probe.outcome).toBe('spawn_failed')
        expect(probe.gateRequest.risk).toBe('medium')
      }
    })

    it('10. timeout 短縮で outcome=timeout', async () => {
      const probe = await probeClaudeCodeVersion({
        cliPath: '/usr/local/bin/claude',
        timeoutMs: 50,
        spawnerOverride: fakeSpawner({
          stdout: 'claude-code 1.5.0',
          exitCode: 0,
          exitDelayMs: 500,
        }),
      })
      expect(probe.ok).toBe(false)
      if (!probe.ok) {
        expect(probe.outcome).toBe('timeout')
      }
    })

    it('11. cliPath 空文字 → outcome=spawn_failed (real-child-spawn validation)', async () => {
      const probe = await probeClaudeCodeVersion({
        cliPath: '',
      })
      expect(probe.ok).toBe(false)
      if (!probe.ok) {
        expect(probe.outcome).toBe('spawn_failed')
      }
    })

    it('12. timeout 異常値 (NaN / 負数) は 5000 に正規化される', async () => {
      const probe = await probeClaudeCodeVersion({
        cliPath: '/usr/local/bin/claude',
        timeoutMs: NaN,
        spawnerOverride: fakeSpawner({
          stdout: 'claude-code 1.5.0',
          exitCode: 0,
        }),
      })
      // 正規化されたので ok 経路に到達
      expect(probe.ok).toBe(true)
    })
  })

  describe('probeClaudeCodeVersion (spawnFn 経由 raw subprocess mock)', () => {
    it('13. spawnFn 注入 + 正常出力 → ok=true (actual subprocess code path 検証)', async () => {
      const fakeSpawn = makeFakeSpawnFn({
        stdout: 'claude-code 1.7.2\n',
        exitCode: 0,
      })
      const probe = await probeClaudeCodeVersion({
        cliPath: '/usr/local/bin/claude',
        spawnFn: fakeSpawn as never,
      })
      expect(probe.ok).toBe(true)
      expect(probe.result.version).toEqual({ major: 1, minor: 7, patch: 2 })
    })

    it('14. spawnFn 注入 + garbage stdout → outcome=unparseable', async () => {
      const fakeSpawn = makeFakeSpawnFn({
        stdout: 'no version info here\n',
        exitCode: 0,
      })
      const probe = await probeClaudeCodeVersion({
        cliPath: '/usr/local/bin/claude',
        spawnFn: fakeSpawn as never,
      })
      expect(probe.ok).toBe(false)
      if (!probe.ok) {
        expect(probe.outcome).toBe('unparseable')
        expect(probe.gateRequest.risk).toBe('low')
      }
    })
  })
})
