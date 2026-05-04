/**
 * skill-adapter/subprocess.test — Round 11 案 A 着地 (CB-D-W3-04 完遂):
 *   subprocess wrap layer の単体 test。
 *
 * カバー範囲 (12+ tests):
 *   1. splitLinesFromChunk 純関数: 行分割 + remainder 累積
 *   2. detectInteractiveInLines: lines 中 1 件でも interactive で detected=true
 *   3. dry-run mode: 実 spawn 呼ばず recording のみ (reason='dry_run_blocked')
 *   4. signal 既 aborted: spawn せず reason='aborted'
 *   5. fixture 1 件 通過 (DoD): exit 0 + stdout JSON OK → parsed_from_stdout
 *   6. exit code != 0 → reason='subprocess_failed'
 *   7. JSON parse 失敗 → reason='unresolvable'
 *   8. interactive prompt 検出 → fail_safe + SIGTERM 送信 (kill chain G-05)
 *   9. interactive 検出後 alive→false なら SIGKILL 不要 (grace 内で die)
 *   10. interactive 検出後 SIGTERM 無視 → SIGKILL escalate
 *   11. AbortController.abort 後の kill 連鎖 (G-05 G-06 整合)
 *   12. stderr 経路でも interactive 検出される
 *   13. maxBufferBytes 上限で stdout truncated
 *   14. 純関数性 (splitLinesFromChunk + detectInteractiveInLines)
 *   15. dry-run recording の wrap call が実行される (audit trace)
 */
import { describe, it, expect } from 'vitest'
import { z } from 'zod'

import {
  detectInteractiveInLines,
  runSubprocessAdapter,
  splitLinesFromChunk,
  type SubprocessHandle,
  type SubprocessSpawnInput,
  type SubprocessSpawner,
  type DryRunGuardLike,
} from '../subprocess.js'

// ---------- Fake helpers ---------------------------------------------------

interface FakeOptions {
  /** lines を順に emit してから exit する */
  lines?: { line: string; stream: 'stdout' | 'stderr' }[]
  /** exit code */
  exitCode?: number | null
  /** SIGTERM 受信時に die するか */
  dieOnSigterm?: boolean
  /** SIGTERM を無視 (SIGKILL でのみ die) */
  ignoreSigterm?: boolean
  /** lines emit 前の delay (ms) */
  preEmitDelayMs?: number
  /** lines emit 後 exit までの delay (ms、interactive kill grace を await させる用) */
  postEmitHangMs?: number
}

class FakeHandle implements SubprocessHandle {
  private aliveFlag = true
  private lineCbs: ((line: string, stream: 'stdout' | 'stderr') => void)[] = []
  private exitResolvers: ((code: number | null) => void)[] = []
  signals: ('SIGTERM' | 'SIGKILL')[] = []
  private exitCodeValue: number | null
  private readonly opts: FakeOptions

  constructor(opts: FakeOptions) {
    this.opts = opts
    this.exitCodeValue = opts.exitCode ?? 0
    // micro-task で line emit + exit
    void this.runEmissionLoop()
  }

  private async runEmissionLoop(): Promise<void> {
    if (this.opts.preEmitDelayMs) {
      await new Promise((r) => setTimeout(r, this.opts.preEmitDelayMs))
    }
    // emit lines
    for (const l of this.opts.lines ?? []) {
      // tick 1 つ挟んで onLine 登録を待つ
      await new Promise((r) => setTimeout(r, 1))
      if (!this.aliveFlag) break
      for (const cb of this.lineCbs) cb(l.line, l.stream)
    }
    // post emit hang (interactive 検出 → kill chain await の余地)
    if (this.opts.postEmitHangMs && this.aliveFlag) {
      const start = Date.now()
      while (Date.now() - start < this.opts.postEmitHangMs && this.aliveFlag) {
        await new Promise((r) => setTimeout(r, 10))
      }
    }
    // signal 由来で die していなければここで natural exit
    if (this.aliveFlag) {
      this.aliveFlag = false
    }
    for (const r of this.exitResolvers) r(this.exitCodeValue)
    this.exitResolvers = []
  }

  alive(): boolean {
    return this.aliveFlag
  }

  signal(sig: 'SIGTERM' | 'SIGKILL'): void {
    this.signals.push(sig)
    if (sig === 'SIGKILL') {
      this.aliveFlag = false
      this.exitCodeValue = 137
      for (const r of this.exitResolvers) r(this.exitCodeValue)
      this.exitResolvers = []
      return
    }
    if (sig === 'SIGTERM') {
      const die =
        this.opts.dieOnSigterm === true
          ? true
          : this.opts.ignoreSigterm === true
            ? false
            : true
      if (die) {
        this.aliveFlag = false
        this.exitCodeValue = 143
        for (const r of this.exitResolvers) r(this.exitCodeValue)
        this.exitResolvers = []
      }
    }
  }

  onLine(cb: (line: string, stream: 'stdout' | 'stderr') => void): void {
    this.lineCbs.push(cb)
  }

  waitForExit(): Promise<number | null> {
    if (!this.aliveFlag) return Promise.resolve(this.exitCodeValue)
    return new Promise((resolve) => {
      this.exitResolvers.push(resolve)
    })
  }
}

class FakeSpawner implements SubprocessSpawner {
  spawnedInputs: SubprocessSpawnInput[] = []
  constructor(private readonly handleOpts: FakeOptions) {}

  spawn(input: SubprocessSpawnInput): SubprocessHandle {
    this.spawnedInputs.push(input)
    return new FakeHandle(this.handleOpts)
  }
}

class RecordingDryRunGuard implements DryRunGuardLike {
  readonly isDryRun = true
  records: { category: string; opName: string; meta: unknown }[] = []
  async wrap<T>(
    category: 'fs' | 'net' | 'spawn' | 'process' | 'other',
    opName: string,
    _fn: () => Promise<T> | T,
    meta?: Record<string, unknown>,
  ): Promise<T> {
    this.records.push({ category, opName, meta })
    // dry-run mode: throw DryRunRejectError 同等
    throw new Error(`dry-run rejected ${category}:${opName}`)
  }
}

class LiveDryRunGuard implements DryRunGuardLike {
  readonly isDryRun = false
  async wrap<T>(
    _category: 'fs' | 'net' | 'spawn' | 'process' | 'other',
    _opName: string,
    fn: () => Promise<T> | T,
    _meta?: Record<string, unknown>,
  ): Promise<T> {
    return await fn()
  }
}

const baseSpawnInput: SubprocessSpawnInput = {
  command: '/bin/echo',
  args: [],
  env: Object.freeze({}),
  cwd: '/tmp',
}

const proposalSchema = z.object({
  proposalId: z.string().min(1),
  estimatedCostUsd: z.number().min(0),
})

// ---------- 1: splitLinesFromChunk ---------------------------------------

describe('skill-adapter/subprocess — Round 11 案 A 着地 (CB-D-W3-04)', () => {
  it('1. splitLinesFromChunk - 純関数: 行分割 + remainder 累積', () => {
    const a = splitLinesFromChunk('', 'foo\nbar\n')
    expect(a.lines).toEqual(['foo', 'bar'])
    expect(a.remainder).toBe('')

    // 不完全行
    const b = splitLinesFromChunk('', 'foo\nbar')
    expect(b.lines).toEqual(['foo'])
    expect(b.remainder).toBe('bar')

    // accumulator 経由で繋がる
    const c = splitLinesFromChunk(b.remainder, '\nbaz\n')
    expect(c.lines).toEqual(['bar', 'baz'])
    expect(c.remainder).toBe('')

    // \r\n 対応
    const d = splitLinesFromChunk('', 'a\r\nb\r\n')
    expect(d.lines).toEqual(['a', 'b'])
  })

  it('2. detectInteractiveInLines - lines 中 1 件でも interactive で detected=true', () => {
    const a = detectInteractiveInLines([
      'normal log line',
      'Do you want to continue?',
      'another log',
    ])
    expect(a.detected).toBe(true)
    expect(a.matched).toContain('Do you want to')

    const b = detectInteractiveInLines(['just normal', 'output here'])
    expect(b.detected).toBe(false)
  })

  it('3. dry-run mode: 実 spawn 呼ばず recording のみ (reason=dry_run_blocked)', async () => {
    const guard = new RecordingDryRunGuard()
    const spawner = new FakeSpawner({ exitCode: 0 })
    const result = await runSubprocessAdapter({
      spawnInput: baseSpawnInput,
      spawner,
      resolve: {
        schema: proposalSchema,
        failSafeDefault: { proposalId: 'fallback', estimatedCostUsd: 0 },
      },
      dryRunGuard: guard,
    })
    expect(result.reason).toBe('dry_run_blocked')
    expect(result.dryRunRecorded).toBe(true)
    expect(spawner.spawnedInputs).toHaveLength(0)
    expect(guard.records).toHaveLength(1)
    expect(guard.records[0]!.category).toBe('spawn')
    expect(guard.records[0]!.opName).toContain('subprocess:')
  })

  it('4. signal 既 aborted: spawn せず reason=aborted', async () => {
    const ac = new AbortController()
    ac.abort()
    const spawner = new FakeSpawner({ exitCode: 0 })
    const result = await runSubprocessAdapter({
      spawnInput: { ...baseSpawnInput, signal: ac.signal },
      spawner,
      resolve: {
        schema: proposalSchema,
        failSafeDefault: { proposalId: 'fallback', estimatedCostUsd: 0 },
      },
    })
    expect(result.reason).toBe('aborted')
    expect(spawner.spawnedInputs).toHaveLength(0)
  })

  it('5. fixture 1 件通過 (DoD): exit 0 + stdout JSON OK → parsed_from_stdout', async () => {
    const fixture = { proposalId: 'kickoff-r11-001', estimatedCostUsd: 0 }
    const json = JSON.stringify(fixture)
    const spawner = new FakeSpawner({
      exitCode: 0,
      lines: [{ line: json, stream: 'stdout' }],
    })
    const result = await runSubprocessAdapter({
      spawnInput: baseSpawnInput,
      spawner,
      resolve: {
        schema: proposalSchema,
        failSafeDefault: { proposalId: 'fallback', estimatedCostUsd: 0 },
      },
    })
    expect(result.reason).toBe('parsed_from_stdout')
    expect(result.value).toEqual(fixture)
    expect(result.exitCode).toBe(0)
    expect(result.killTriggered).toBe(false)
  })

  it('6. exit code != 0 → reason=subprocess_failed', async () => {
    const spawner = new FakeSpawner({
      exitCode: 1,
      lines: [{ line: 'some output', stream: 'stdout' }],
    })
    const result = await runSubprocessAdapter({
      spawnInput: baseSpawnInput,
      spawner,
      resolve: {
        schema: proposalSchema,
        failSafeDefault: { proposalId: 'fallback', estimatedCostUsd: 0 },
      },
    })
    expect(result.reason).toBe('subprocess_failed')
    expect(result.exitCode).toBe(1)
  })

  it('7. JSON parse 失敗 → reason=unresolvable', async () => {
    const spawner = new FakeSpawner({
      exitCode: 0,
      lines: [{ line: 'not json output', stream: 'stdout' }],
    })
    const result = await runSubprocessAdapter({
      spawnInput: baseSpawnInput,
      spawner,
      resolve: {
        schema: proposalSchema,
        failSafeDefault: { proposalId: 'fallback', estimatedCostUsd: 0 },
      },
    })
    expect(result.reason).toBe('unresolvable')
    expect(result.exitCode).toBe(0)
  })

  it('8. interactive prompt 検出 → fail_safe + SIGTERM 送信 (kill chain G-05)', async () => {
    const spawner = new FakeSpawner({
      exitCode: 0,
      dieOnSigterm: true,
      lines: [
        { line: 'hello world', stream: 'stdout' },
        { line: 'Do you want to continue?', stream: 'stdout' },
      ],
      postEmitHangMs: 200,
    })
    const result = await runSubprocessAdapter({
      spawnInput: baseSpawnInput,
      spawner,
      resolve: {
        schema: proposalSchema,
        failSafeDefault: { proposalId: 'fallback', estimatedCostUsd: 0 },
      },
      killGraceMs: 50,
    })
    expect(result.reason).toBe('fail_safe_interactive_detected')
    expect(result.matchedInteractivePrompt).toContain('Do you want to')
    expect(result.value).toEqual({ proposalId: 'fallback', estimatedCostUsd: 0 })
    expect(result.killTriggered).toBe(true)
  })

  it('9. interactive 検出後 SIGTERM で die すれば SIGKILL 不要', async () => {
    const spawner = new FakeSpawner({
      exitCode: 0,
      dieOnSigterm: true,
      lines: [{ line: 'continue? (y/n)', stream: 'stdout' }],
      postEmitHangMs: 200,
    })
    let capturedHandle: FakeHandle | undefined
    const wrappedSpawner: SubprocessSpawner = {
      spawn: (i) => {
        const h = spawner.spawn(i) as FakeHandle
        capturedHandle = h
        return h
      },
    }
    const result = await runSubprocessAdapter({
      spawnInput: baseSpawnInput,
      spawner: wrappedSpawner,
      resolve: {
        schema: proposalSchema,
        failSafeDefault: { proposalId: 'fallback', estimatedCostUsd: 0 },
      },
      killGraceMs: 100,
    })
    expect(result.reason).toBe('fail_safe_interactive_detected')
    expect(capturedHandle?.signals).toContain('SIGTERM')
    expect(capturedHandle?.signals).not.toContain('SIGKILL')
  })

  it('10. interactive 検出後 SIGTERM 無視 → SIGKILL escalate', async () => {
    const spawner = new FakeSpawner({
      exitCode: 0,
      ignoreSigterm: true,
      lines: [{ line: 'are you sure you want to delete?', stream: 'stdout' }],
      postEmitHangMs: 500,
    })
    let capturedHandle: FakeHandle | undefined
    const wrappedSpawner: SubprocessSpawner = {
      spawn: (i) => {
        const h = spawner.spawn(i) as FakeHandle
        capturedHandle = h
        return h
      },
    }
    const result = await runSubprocessAdapter({
      spawnInput: baseSpawnInput,
      spawner: wrappedSpawner,
      resolve: {
        schema: proposalSchema,
        failSafeDefault: { proposalId: 'fallback', estimatedCostUsd: 0 },
      },
      killGraceMs: 30,
    })
    expect(result.reason).toBe('fail_safe_interactive_detected')
    expect(capturedHandle?.signals[0]).toBe('SIGTERM')
    expect(capturedHandle?.signals).toContain('SIGKILL')
  })

  it('11. AbortController.abort 後の kill 連鎖 (G-05/G-06 整合)', async () => {
    const ac = new AbortController()
    const spawner = new FakeSpawner({
      exitCode: 0,
      dieOnSigterm: true,
      // ゆっくり emit して abort のタイミングを取る
      preEmitDelayMs: 30,
      lines: [{ line: 'normal log line', stream: 'stdout' }],
      postEmitHangMs: 500,
    })
    let capturedHandle: FakeHandle | undefined
    const wrappedSpawner: SubprocessSpawner = {
      spawn: (i) => {
        const h = spawner.spawn(i) as FakeHandle
        capturedHandle = h
        return h
      },
    }
    // 50ms 後 abort 発火
    setTimeout(() => ac.abort(), 50)
    const result = await runSubprocessAdapter({
      spawnInput: { ...baseSpawnInput, signal: ac.signal },
      spawner: wrappedSpawner,
      resolve: {
        schema: proposalSchema,
        failSafeDefault: { proposalId: 'fallback', estimatedCostUsd: 0 },
      },
      killGraceMs: 100,
    })
    expect(result.reason).toBe('aborted')
    expect(capturedHandle?.signals).toContain('SIGTERM')
  })

  it('12. stderr 経路でも interactive 検出される', async () => {
    const spawner = new FakeSpawner({
      exitCode: 0,
      dieOnSigterm: true,
      lines: [{ line: 'enter your password:', stream: 'stderr' }],
      postEmitHangMs: 200,
    })
    const result = await runSubprocessAdapter({
      spawnInput: baseSpawnInput,
      spawner,
      resolve: {
        schema: proposalSchema,
        failSafeDefault: { proposalId: 'fallback', estimatedCostUsd: 0 },
      },
      killGraceMs: 50,
    })
    expect(result.reason).toBe('fail_safe_interactive_detected')
    expect(result.matchedInteractivePrompt?.toLowerCase()).toContain('password')
    expect(result.stderrBuffer).toContain('password')
  })

  it('13. maxBufferBytes 上限で stdout truncated', async () => {
    const big = 'x'.repeat(2048)
    const spawner = new FakeSpawner({
      exitCode: 0,
      lines: [
        { line: big, stream: 'stdout' },
        { line: '{"proposalId":"x","estimatedCostUsd":0}', stream: 'stdout' },
      ],
    })
    const result = await runSubprocessAdapter({
      spawnInput: baseSpawnInput,
      spawner,
      resolve: {
        schema: proposalSchema,
        failSafeDefault: { proposalId: 'fallback', estimatedCostUsd: 0 },
      },
      maxBufferBytes: 512,
    })
    // 大量データで json 末尾が読み取れていない / parse 失敗 / unresolvable 期待
    expect(result.reason).toBe('unresolvable')
    expect(result.stdoutBuffer.length).toBeLessThanOrEqual(512 + 1024) // 上限 + 行 1 件分の overage 許容
  })

  it('14. 純関数性: splitLinesFromChunk + detectInteractiveInLines 同一入力で同一出力', () => {
    const s1 = splitLinesFromChunk('', 'a\nb\nc')
    const s2 = splitLinesFromChunk('', 'a\nb\nc')
    expect(s1).toEqual(s2)
    const d1 = detectInteractiveInLines(['x', 'are you sure y/n', 'z'])
    const d2 = detectInteractiveInLines(['x', 'are you sure y/n', 'z'])
    expect(d1).toEqual(d2)
  })

  it('15. live mode (DryRunGuardLike isDryRun=false) は spawn を呼ぶ', async () => {
    const liveGuard = new LiveDryRunGuard()
    const spawner = new FakeSpawner({
      exitCode: 0,
      lines: [
        {
          line: JSON.stringify({ proposalId: 'live-1', estimatedCostUsd: 0 }),
          stream: 'stdout',
        },
      ],
    })
    const result = await runSubprocessAdapter({
      spawnInput: baseSpawnInput,
      spawner,
      resolve: {
        schema: proposalSchema,
        failSafeDefault: { proposalId: 'fallback', estimatedCostUsd: 0 },
      },
      dryRunGuard: liveGuard,
    })
    expect(result.reason).toBe('parsed_from_stdout')
    expect(result.value?.proposalId).toBe('live-1')
    expect(spawner.spawnedInputs).toHaveLength(1)
  })
})
