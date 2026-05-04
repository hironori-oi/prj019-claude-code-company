/**
 * spawn-isolation.test — Round 6 W0-Week2 4 日前倒し:
 *   G-01 (subprocess spawn 副作用ゼロ) の SpawnIsolation 純関数群テスト。
 *
 * 関連:
 *   - DEC-019-007 (副作用ゼロ要件)
 *   - DEC-019-006 P-D 改 (subprocess spawn 経由)
 *   - 議決-25 採択前提 Phase 1 W1 ハードガード前倒し
 *
 * カバー範囲:
 *   1. buildAllowedEnv: env allow-list が厳密 (未許可キー混入なし、undefined/空文字 skip)
 *   2. defaultIsolatedCwd: OS tmp を返し、親 monorepo の path は絶対に返さない
 *   3. buildSpawnContract: 全 whitelist 引数を一元的にまとめ、未指定時は厳格な
 *      デフォルト (env={}, cwd=tmp, argv=[]) で固める
 *   4. createOpenclawRuntime に options を渡せる (互換確保)
 *   5. Real は constructor で throw のため SpawnIsolation 経路は型契約のみ確認
 */
import { describe, it, expect } from 'vitest'
import { tmpdir } from 'node:os'
import {
  buildAllowedEnv,
  buildSpawnContract,
  createOpenclawRuntime,
  defaultIsolatedCwd,
  MockOpenclawRuntime,
  type SubprocessSpawnContract,
} from '../index.js'

describe('G-01: buildAllowedEnv (env allow-list 純関数)', () => {
  it('allow-list の key だけを抽出し、未許可 key は混入しない', () => {
    const source = {
      PATH: '/usr/bin:/bin',
      HOME: '/home/runner',
      ANTHROPIC_API_KEY: 'sk-test-leak-xxxx',
      OPENAI_API_KEY: 'sk-test-leak-yyyy',
    }
    const allowed = buildAllowedEnv(['PATH', 'HOME'], source as NodeJS.ProcessEnv)
    expect(Object.keys(allowed).sort()).toEqual(['HOME', 'PATH'])
    // secret key が混入していないこと
    expect((allowed as Record<string, string>)['ANTHROPIC_API_KEY']).toBeUndefined()
    expect((allowed as Record<string, string>)['OPENAI_API_KEY']).toBeUndefined()
  })

  it('allow-list が空配列なら空オブジェクトを返す (subprocess は env 0 個で起動)', () => {
    const allowed = buildAllowedEnv([], { PATH: '/usr/bin' })
    expect(Object.keys(allowed).length).toBe(0)
  })

  it('source 側に未定義 / 空文字の key は静かに skip する', () => {
    const source = {
      PATH: '/usr/bin',
      EMPTY_VAR: '',
      // MISSING_VAR は意図的に未定義
    }
    const allowed = buildAllowedEnv(
      ['PATH', 'EMPTY_VAR', 'MISSING_VAR'],
      source as NodeJS.ProcessEnv,
    )
    expect(Object.keys(allowed)).toEqual(['PATH'])
  })
})

describe('G-01: defaultIsolatedCwd (副作用ゼロ既定 cwd)', () => {
  it('OS tmpdir() と一致する', () => {
    expect(defaultIsolatedCwd()).toBe(tmpdir())
  })

  it('親 monorepo の path 文字列を含まない (副作用ゼロ要件)', () => {
    const cwd = defaultIsolatedCwd()
    // monorepo 名 / 親プロジェクト名が cwd に紛れ込んでいない
    expect(cwd.toLowerCase()).not.toContain('claude-code-company')
    expect(cwd.toLowerCase()).not.toContain('prj-019')
  })
})

describe('G-01: buildSpawnContract (whitelist 一元構築)', () => {
  it('未指定時は env={}, cwd=tmp, argv=[] で固める', () => {
    const contract = buildSpawnContract({
      command: '/bin/openclaw',
      envAllowList: [],
      timeoutMs: 1_000,
      envSource: {},
    })
    expect(Object.keys(contract.env).length).toBe(0)
    expect(contract.cwd).toBe(tmpdir())
    expect(contract.argvWhitelist).toEqual([])
    expect(contract.dryRun).toBe(true) // 既定は dryRun=true で安全側
  })

  it('全 whitelist 引数を尊重する', () => {
    const contract: SubprocessSpawnContract = buildSpawnContract({
      command: '/bin/openclaw',
      args: ['agent', '--headless'],
      envAllowList: ['PATH'],
      envSource: { PATH: '/usr/bin' },
      timeoutMs: 30_000,
      dryRun: false,
      cwd: '/explicitly/safe/cwd',
      argvWhitelist: ['--no-color'],
    })
    expect(contract.command).toBe('/bin/openclaw')
    expect(contract.args).toEqual(['agent', '--headless'])
    expect(contract.env).toEqual({ PATH: '/usr/bin' })
    expect(contract.timeoutMs).toBe(30_000)
    expect(contract.dryRun).toBe(false)
    expect(contract.cwd).toBe('/explicitly/safe/cwd')
    expect(contract.argvWhitelist).toEqual(['--no-color'])
  })

  it('返却 contract は frozen (再代入で変更できない)', () => {
    const contract = buildSpawnContract({
      command: '/bin/x',
      envAllowList: [],
      timeoutMs: 1,
      envSource: {},
    })
    expect(Object.isFrozen(contract)).toBe(true)
    expect(Object.isFrozen(contract.env)).toBe(true)
    expect(Object.isFrozen(contract.args)).toBe(true)
    expect(Object.isFrozen(contract.argvWhitelist)).toBe(true)
  })
})

describe('G-01: createOpenclawRuntime (options 互換性)', () => {
  it('options を渡しても Mock を返す (W0)', () => {
    const rt = createOpenclawRuntime('mock', {
      cwd: '/tmp/explicit',
      envSource: { PATH: '/usr/bin' },
      argvWhitelist: ['--no-color'],
    })
    expect(rt).toBeInstanceOf(MockOpenclawRuntime)
  })

  it('options 未指定でも Mock を返す (後方互換)', () => {
    const rt = createOpenclawRuntime('mock')
    expect(rt).toBeInstanceOf(MockOpenclawRuntime)
  })
})
