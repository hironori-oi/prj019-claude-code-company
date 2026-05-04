import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ClaudeBridge } from '../spawn.js'
import {
  CircuitBreaker,
  FileCostTracker,
  FileUsageMonitor,
  FileKillSwitch,
} from '@clawbridge/harness'

/**
 * spawn.ts (ClaudeBridge) tests
 *
 * Strategy:
 *   - 実際の Claude Code CLI は呼ばない (NG-W0-01 / 課金回避)
 *   - 代わりに tmp に小さな .mjs スクリプトを書き出し、`node /tmp/fake.mjs` を command に注入
 *   - ClaudeBridge は内部で `args = ['-p', prompt, '--output-format', 'stream-json', '--verbose', ...]`
 *     を渡してくるが、fake script 側ではそれを無視して既定の NDJSON を stdout に書く
 */

const NODE = process.execPath

function quoteIfWin(s: string): string {
  return process.platform === 'win32' ? `"${s}"` : s
}

let scriptDir: string

async function writeScript(name: string, body: string): Promise<string> {
  const path = join(scriptDir, name)
  await writeFile(path, body, 'utf-8')
  return path
}

async function makeFakeCommand(opts: {
  ndjsonLines?: string[]
  exitCode?: number
  stderr?: string
  delayMs?: number
}): Promise<string> {
  const lines = opts.ndjsonLines ?? [
    '{"type":"system","subtype":"init","session_id":"test-session"}',
    '{"type":"assistant","message":{"role":"assistant"},"usage":{"input_tokens":10,"output_tokens":5}}',
    '{"type":"result","total_cost_usd":0.0042,"is_error":false}',
  ]
  const exitCode = opts.exitCode ?? 0
  const stderr = opts.stderr ?? ''
  const delayMs = opts.delayMs ?? 0

  const body = `
const lines = ${JSON.stringify(lines)};
const stderr = ${JSON.stringify(stderr)};
const delay = ${delayMs};
const exitCode = ${exitCode};
if (stderr) process.stderr.write(stderr);
setTimeout(() => {
  for (const l of lines) process.stdout.write(l + '\\n');
  process.exit(exitCode);
}, delay);
`
  const script = await writeScript(`fake-${Math.random().toString(36).slice(2)}.mjs`, body)
  return `${quoteIfWin(NODE)} ${quoteIfWin(script)}`
}

async function makeHangingCommand(): Promise<string> {
  const body = `
setInterval(() => {}, 1000);
process.stdout.write('\\n');
`
  const script = await writeScript(`hang-${Math.random().toString(36).slice(2)}.mjs`, body)
  return `${quoteIfWin(NODE)} ${quoteIfWin(script)}`
}

async function makeEnvDumpCommand(): Promise<string> {
  const body = `
const want = ['ANTHROPIC_API_KEY','OPENAI_API_KEY','MY_SECRET'];
const seen = {};
for (const k of want) seen[k] = process.env[k] ?? null;
process.stdout.write('{"type":"system","subtype":"env_dump","seen":' + JSON.stringify(seen) + '}\\n');
process.stdout.write('{"type":"result","total_cost_usd":0}\\n');
process.exit(0);
`
  const script = await writeScript(`envdump-${Math.random().toString(36).slice(2)}.mjs`, body)
  return `${quoteIfWin(NODE)} ${quoteIfWin(script)}`
}

describe('ClaudeBridge.executeTask', () => {
  let tmp: string
  let costLedgerPath: string
  let usageLedgerPath: string
  let killSignalPath: string

  beforeEach(async () => {
    tmp = await mkdtemp(join(tmpdir(), 'clawbridge-spawn-'))
    scriptDir = await mkdtemp(join(tmpdir(), 'clawbridge-fake-'))
    costLedgerPath = join(tmp, 'cost.json')
    usageLedgerPath = join(tmp, 'usage.json')
    killSignalPath = join(tmp, 'STOP')
  })

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true }).catch(() => undefined)
    await rm(scriptDir, { recursive: true, force: true }).catch(() => undefined)
  })

  it('returns success and parses stream-json output', async () => {
    const bridge = new ClaudeBridge({
      command: await makeFakeCommand({}),
      skipAuthCheck: true,
    })
    const result = await bridge.executeTask('hello world')
    expect(result.success).toBe(true)
    expect(result.exitCode).toBe(0)
    expect(result.messages).toHaveLength(3)
    expect(result.messages[0]?.type).toBe('system')
    expect(result.messages[2]?.type).toBe('result')
    expect(result.tokenUsage.input).toBe(10)
    expect(result.tokenUsage.output).toBe(5)
    expect(result.costEstimate).toBeCloseTo(0.0042)
    expect(result.error).toBeUndefined()
  })

  it('records cost and usage when harness components are wired', async () => {
    const cost = new FileCostTracker({ ledgerPath: costLedgerPath })
    const kill = new FileKillSwitch({ signalPath: killSignalPath, exitOnTrigger: false })
    const usage = new FileUsageMonitor({ ledgerPath: usageLedgerPath, killSwitch: kill })

    const bridge = new ClaudeBridge({
      command: await makeFakeCommand({}),
      skipAuthCheck: true,
      costTracker: cost,
      usageMonitor: usage,
    })
    const r = await bridge.executeTask('hi', { sessionId: 'sess-1', projectId: 'PRJ-019' })
    expect(r.success).toBe(true)

    const monthly = await cost.getMonthlyTotal('anthropic_subscription')
    expect(monthly).toBeCloseTo(0.0042)
    const sessTotal = await cost.getSessionTotal('sess-1')
    expect(sessTotal).toBeCloseTo(0.0042)
  })

  it('returns auth_failed when auth check fails (skipAuthCheck=false)', async () => {
    const bridge = new ClaudeBridge({
      // 存在しないコマンドで auth-detector を失敗させる。
      command: 'this-command-does-not-exist-xyz999',
      skipAuthCheck: false,
    })
    const r = await bridge.executeTask('test')
    expect(r.success).toBe(false)
    expect(r.error?.type).toBe('auth_failed')
  })

  it('classifies non-zero exit with 429 stderr as rate_limited', async () => {
    const bridge = new ClaudeBridge({
      command: await makeFakeCommand({
        ndjsonLines: [],
        exitCode: 1,
        stderr: '429 too many requests',
      }),
      skipAuthCheck: true,
      circuitBreaker: new CircuitBreaker({ name: 'test', failureThreshold: 10 }),
    })
    const r = await bridge.executeTask('test')
    expect(r.success).toBe(false)
    expect(r.error?.type).toBe('rate_limited')
  })

  it('detects 401 stderr as auth_failed', async () => {
    const bridge = new ClaudeBridge({
      command: await makeFakeCommand({
        ndjsonLines: [],
        exitCode: 1,
        stderr: '401 Unauthorized: please log in',
      }),
      skipAuthCheck: true,
      circuitBreaker: new CircuitBreaker({ name: 'test', failureThreshold: 10 }),
    })
    const r = await bridge.executeTask('test')
    expect(r.error?.type).toBe('auth_failed')
  })

  it('returns circuit_open when circuit-breaker is already open', async () => {
    const cb = new CircuitBreaker({ name: 'test', failureThreshold: 1, cooldownMs: 60_000 })
    await expect(cb.fire(async () => Promise.reject(new Error('x')))).rejects.toThrow()
    expect(cb.status().state).toBe('open')

    const bridge = new ClaudeBridge({
      command: await makeFakeCommand({}),
      skipAuthCheck: true,
      circuitBreaker: cb,
    })
    const r = await bridge.executeTask('hi')
    expect(r.success).toBe(false)
    expect(r.error?.type).toBe('circuit_open')
  })

  it('handles timeout and returns error', async () => {
    const bridge = new ClaudeBridge({
      command: await makeHangingCommand(),
      skipAuthCheck: true,
      circuitBreaker: new CircuitBreaker({ name: 'test', failureThreshold: 10 }),
    })
    const r = await bridge.executeTask('test', { timeoutMs: 500 })
    expect(r.success).toBe(false)
    // timeout 後 SIGTERM/SIGKILL されるので、error.type は 'timeout' か OS により signal で 'unknown'
    expect(['timeout', 'unknown', 'spawn_failed']).toContain(r.error?.type)
  }, 30_000)

  it('status() reflects skipAuthCheck behaviour', async () => {
    const bridge = new ClaudeBridge({
      command: await makeFakeCommand({}),
      skipAuthCheck: true,
    })
    expect(bridge.status().authChecked).toBe(false)
    await bridge.executeTask('hi')
    // skipAuthCheck:true なので authChecked は false のまま
    expect(bridge.status().authChecked).toBe(false)
    expect(bridge.status().circuit.state).toBe('closed')
  })

  it('does not leak ANTHROPIC_API_KEY into spawned process env (G-V2-11)', async () => {
    process.env['ANTHROPIC_API_KEY'] = 'sk-ant-leak-test-XXXX'
    process.env['MY_SECRET'] = 'should-not-appear'
    try {
      const bridge = new ClaudeBridge({
        command: await makeEnvDumpCommand(),
        skipAuthCheck: true,
        circuitBreaker: new CircuitBreaker({ name: 'test', failureThreshold: 10 }),
      })
      const r = await bridge.executeTask('hi', { extraEnv: { MY_SECRET: 'still-no' } })
      expect(r.success).toBe(true)
      const dumpMsg = r.messages.find((m) => m.type === 'system' && m.subtype === 'env_dump')
      expect(dumpMsg).toBeDefined()
      const seen = (dumpMsg as unknown as { seen: Record<string, string | null> }).seen
      expect(seen['ANTHROPIC_API_KEY']).toBeNull()
      expect(seen['OPENAI_API_KEY']).toBeNull()
      expect(seen['MY_SECRET']).toBeNull() // extraEnv の secret 名もブロックされる
    } finally {
      delete process.env['ANTHROPIC_API_KEY']
      delete process.env['MY_SECRET']
    }
  })

  it('passes options through (smoke test for permissionMode/sessionId/etc.)', async () => {
    const bridge = new ClaudeBridge({
      command: await makeFakeCommand({}),
      skipAuthCheck: true,
    })
    const r = await bridge.executeTask('explain monorepo setup', {
      allowedTools: ['Read', 'Grep'],
      permissionMode: 'plan',
      sessionId: 's1',
      appendSystemPrompt: 'be terse',
      projectId: 'PRJ-019',
    })
    expect(r.success).toBe(true)
  })
})
