import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { detectClaudeAuth } from '../auth-detector.js'

/**
 * auth-detector tests
 *
 * Strategy:
 *   - tmp に小さな .mjs スクリプトを書き出し、auth-detector の `command` に
 *     `node /path/to/fake.mjs` を注入する (蹄末に --version が付くがスクリプト側で無視)
 *   - 注入 `configDir` を tmp ディレクトリにして ~/.claude を擬似化
 *   - shell:true on Windows なので コマンドラインは shell-safe にしておく
 */

const NODE = process.execPath

let scriptDir: string

async function writeFakeScript(name: string, body: string): Promise<string> {
  const path = join(scriptDir, name)
  await writeFile(path, body, 'utf-8')
  return path
}

function quoteIfWin(s: string): string {
  // shell:true on Windows ではパスにスペースが含まれる可能性があるので二重クォートで囲む
  return process.platform === 'win32' ? `"${s}"` : s
}

function fakeClaudeCmdFromScript(scriptPath: string): string {
  // 注: auth-detector は内部で args=['--version'] を渡す。
  // fake script 側で argv[2] === '--version' を見て stdout に応答する。
  return `${quoteIfWin(NODE)} ${quoteIfWin(scriptPath)}`
}

function fakeClaudeFailingCmd(): string {
  // 存在しないコマンド名 → shell:true でも shell が non-zero を返す
  return 'this-command-definitely-does-not-exist-zzz123'
}

describe('detectClaudeAuth', () => {
  let configDir: string

  beforeEach(async () => {
    configDir = await mkdtemp(join(tmpdir(), 'clawbridge-auth-'))
    scriptDir = await mkdtemp(join(tmpdir(), 'clawbridge-fake-'))
  })

  afterEach(async () => {
    await rm(configDir, { recursive: true, force: true }).catch(() => undefined)
    await rm(scriptDir, { recursive: true, force: true }).catch(() => undefined)
  })

  it('reports authenticated when CLI succeeds and configDir exists', async () => {
    const script = await writeFakeScript(
      'ok.mjs',
      `process.stdout.write('1.0.99'); process.exit(0);`,
    )
    const r = await detectClaudeAuth({
      command: fakeClaudeCmdFromScript(script),
      configDir,
      timeoutMs: 5000,
    })
    expect(r.cliFound).toBe(true)
    expect(r.configDirExists).toBe(true)
    expect(r.authenticated).toBe(true)
    expect(r.version).toBe('1.0.99')
  })

  it('reports unauthenticated when configDir is missing', async () => {
    await rm(configDir, { recursive: true, force: true })
    const script = await writeFakeScript(
      'ok.mjs',
      `process.stdout.write('1.0.0'); process.exit(0);`,
    )
    const r = await detectClaudeAuth({
      command: fakeClaudeCmdFromScript(script),
      configDir,
      timeoutMs: 5000,
    })
    expect(r.cliFound).toBe(true)
    expect(r.configDirExists).toBe(false)
    expect(r.authenticated).toBe(false)
    expect(r.reason).toMatch(/\.claude\/?/)
  })

  it('reports unauthenticated when CLI exits non-zero', async () => {
    const script = await writeFakeScript('fail.mjs', `process.exit(2);`)
    const r = await detectClaudeAuth({
      command: fakeClaudeCmdFromScript(script),
      configDir,
      timeoutMs: 5000,
    })
    // 非 0 exit は cliFound=false 扱い (auth-detector v0.1 仕様)
    expect(r.cliFound).toBe(false)
    expect(r.authenticated).toBe(false)
    expect(r.reason).toMatch(/exited with 2/)
  })

  it('reports unauthenticated when CLI is not found', async () => {
    const r = await detectClaudeAuth({
      command: fakeClaudeFailingCmd(),
      configDir,
      timeoutMs: 5000,
    })
    // shell:true on Windows: shell が起動するので cliFound は true (close で code!=0)
    // shell:false on POSIX: spawn が ENOENT で error event → cliFound=false
    expect(r.authenticated).toBe(false)
    expect(r.reason).toBeDefined()
  })

  it('does not throw and returns a structured result on any failure', async () => {
    const r = await detectClaudeAuth({
      command: fakeClaudeFailingCmd(),
      configDir,
      timeoutMs: 1000,
    })
    expect(r).toMatchObject({
      authenticated: false,
    })
  })

  it('honors a pre-existing nested directory inside configDir as configDirExists', async () => {
    // configDir 自体ではなく、auth-detector は stat().isDirectory() を見るだけ
    await fs.mkdir(join(configDir, 'projects'), { recursive: true })
    const script = await writeFakeScript(
      'ok.mjs',
      `process.stdout.write('2.0.0'); process.exit(0);`,
    )
    const r = await detectClaudeAuth({
      command: fakeClaudeCmdFromScript(script),
      configDir,
      timeoutMs: 5000,
    })
    expect(r.configDirExists).toBe(true)
    expect(r.authenticated).toBe(true)
  })
})
