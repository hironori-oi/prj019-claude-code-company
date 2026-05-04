/**
 * cli-version-check.test — Round 12 Dev-D 着地 (Task C):
 *   parseClaudeCodeVersion 純関数 + checkClaudeCodeVersion 統合 (DI 経由) の検証。
 */
import { describe, it, expect } from 'vitest'
import {
  parseClaudeCodeVersion,
  isVersionInRange,
  checkClaudeCodeVersion,
  DEFAULT_ACCEPTED_RANGE,
} from '../cli-version-check.js'
import type { MockChildProcess } from '../spawn-claude-code.js'

/**
 * fake spawner: 指定の stdout / exit code を即時 emit する MockChildProcess を返す。
 */
function fakeSpawner(args: {
  stdout?: string
  stderr?: string
  exitCode?: number | null
  exitDelayMs?: number
  throwOnSpawn?: boolean
}): (opts: unknown) => MockChildProcess {
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
    // schedule emit
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

describe('Round 12 Dev-D Task C: cli-version-check', () => {
  describe('parseClaudeCodeVersion (純関数)', () => {
    it('1. "claude-code 1.2.3" → {1, 2, 3}', () => {
      expect(parseClaudeCodeVersion('claude-code 1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 })
    })

    it('2. "Claude Code CLI v1.5.0" → {1, 5, 0}', () => {
      expect(parseClaudeCodeVersion('Claude Code CLI v1.5.0')).toEqual({ major: 1, minor: 5, patch: 0 })
    })

    it('3. prerelease/build 付き "1.2.3-beta.1+build.5" は major.minor.patch のみ抽出', () => {
      expect(parseClaudeCodeVersion('1.2.3-beta.1+build.5')).toEqual({ major: 1, minor: 2, patch: 3 })
    })

    it('4. fallback: 不正 input ("foo bar") は null', () => {
      expect(parseClaudeCodeVersion('foo bar')).toBeNull()
      expect(parseClaudeCodeVersion('')).toBeNull()
    })
  })

  describe('isVersionInRange (純関数)', () => {
    it('5. default range [1.0, 2.0): 1.0.0 / 1.5.3 / 1.99.99 は true', () => {
      expect(isVersionInRange({ major: 1, minor: 0, patch: 0 })).toBe(true)
      expect(isVersionInRange({ major: 1, minor: 5, patch: 3 })).toBe(true)
      expect(isVersionInRange({ major: 1, minor: 99, patch: 99 })).toBe(true)
    })

    it('6. default range 範囲外: 0.9.0 / 2.0.0 / 3.5.0 は false', () => {
      expect(isVersionInRange({ major: 0, minor: 9, patch: 0 })).toBe(false)
      expect(isVersionInRange({ major: 2, minor: 0, patch: 0 })).toBe(false)
      expect(isVersionInRange({ major: 3, minor: 5, patch: 0 })).toBe(false)
    })
  })

  describe('checkClaudeCodeVersion (DI 経由統合)', () => {
    it('7. 範囲内 v1.2.3 → outcome=ok / fallbackToDryRun=false', async () => {
      const result = await checkClaudeCodeVersion({
        spawner: fakeSpawner({ stdout: 'claude-code 1.2.3', exitCode: 0 }),
      })
      expect(result.outcome).toBe('ok')
      expect(result.version).toEqual({ major: 1, minor: 2, patch: 3 })
      expect(result.warning).toBeNull()
      expect(result.fallbackToDryRun).toBe(false)
    })

    it('8. 範囲外 v2.0.0 → outcome=out_of_range + warning + fallbackToDryRun=true', async () => {
      const result = await checkClaudeCodeVersion({
        spawner: fakeSpawner({ stdout: 'claude-code 2.0.0', exitCode: 0 }),
      })
      expect(result.outcome).toBe('out_of_range')
      expect(result.version).toEqual({ major: 2, minor: 0, patch: 0 })
      expect(result.warning).toContain('outside accepted range')
      expect(result.fallbackToDryRun).toBe(true)
    })

    it('9. parse 失敗 stdout="garbage" → outcome=unparseable + fallback', async () => {
      const result = await checkClaudeCodeVersion({
        spawner: fakeSpawner({ stdout: 'garbage no version here', exitCode: 0 }),
      })
      expect(result.outcome).toBe('unparseable')
      expect(result.version).toBeNull()
      expect(result.fallbackToDryRun).toBe(true)
    })

    it('10. exit code != 0 → outcome=spawn_failed + fallback', async () => {
      const result = await checkClaudeCodeVersion({
        spawner: fakeSpawner({ stdout: '', stderr: 'cli not found', exitCode: 127 }),
      })
      expect(result.outcome).toBe('spawn_failed')
      expect(result.fallbackToDryRun).toBe(true)
    })

    it('11. spawner throw → outcome=spawn_failed + fallback', async () => {
      const result = await checkClaudeCodeVersion({
        spawner: fakeSpawner({ throwOnSpawn: true }),
      })
      expect(result.outcome).toBe('spawn_failed')
      expect(result.fallbackToDryRun).toBe(true)
      expect(result.warning).toContain('起動失敗')
    })

    it('12. timeout (exitDelayMs > timeoutMs) → outcome=timeout + fallback', async () => {
      const result = await checkClaudeCodeVersion({
        spawner: fakeSpawner({ stdout: '1.2.3', exitCode: 0, exitDelayMs: 100 }),
        timeoutMs: 30,
      })
      expect(result.outcome).toBe('timeout')
      expect(result.fallbackToDryRun).toBe(true)
    })

    it('13. acceptedRange 上書き: [0.5, 1.0) で v0.9.0 → ok / v0.3.0 → out_of_range', async () => {
      const okRes = await checkClaudeCodeVersion({
        spawner: fakeSpawner({ stdout: 'claude-code 0.9.0', exitCode: 0 }),
        acceptedRange: { minMajor: 0, minMinor: 5, maxMajorExclusive: 1 },
      })
      expect(okRes.outcome).toBe('ok')
      expect(okRes.version).toEqual({ major: 0, minor: 9, patch: 0 })

      const oorRes = await checkClaudeCodeVersion({
        spawner: fakeSpawner({ stdout: 'claude-code 0.3.0', exitCode: 0 }),
        acceptedRange: { minMajor: 0, minMinor: 5, maxMajorExclusive: 1 },
      })
      expect(oorRes.outcome).toBe('out_of_range')
    })

    it('14. DEFAULT_ACCEPTED_RANGE は [1.0, 2.0)', () => {
      expect(DEFAULT_ACCEPTED_RANGE.minMajor).toBe(1)
      expect(DEFAULT_ACCEPTED_RANGE.minMinor).toBe(0)
      expect(DEFAULT_ACCEPTED_RANGE.maxMajorExclusive).toBe(2)
    })
  })
})
