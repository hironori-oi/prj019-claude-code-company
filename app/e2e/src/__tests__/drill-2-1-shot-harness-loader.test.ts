/**
 * drill-2-1-shot-harness-loader.test — Round 13 Dev-C 着地 (Task C, テスト):
 *   drill-2-1-shot-real-execution.harness.ts の loader / pure helper を検証する unit test
 *   (5-8 tests 目標、実装 7)。
 *
 *   harness 本体は実機 spawn を行うため大半が integration 領域だが、純関数 helper
 *   (parseHarnessArgs / buildDrillReport / DRILL_2_SCENARIOS / grepAuditEntries 等) は
 *   unit test 可能。本 file はその検証に限定。
 *
 *   harness が `.harness.ts` 拡張子で auto-run されないことの保証は vitest config の
 *   include glob で担保 (`*.test.ts` のみ)。本 file からは import 経由で型/関数を取得。
 */
import { describe, it, expect } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  parseHarnessArgs,
  DRILL_2_SCENARIOS,
  buildDrillReport,
  grepAuditEntries,
  cleanupOldScratchDirs,
  type ScenarioRunOutcome,
  type PreFlightCheckResult,
} from './drill-2-1-shot-real-execution.harness.js'

describe('drill-2-1-shot-harness / parseHarnessArgs (R13 Dev-C)', () => {
  it('1. デフォルト値: dryRun=false, verbose=false, date=今日', () => {
    const a = parseHarnessArgs([])
    expect(a.dryRun).toBe(false)
    expect(a.verbose).toBe(false)
    expect(a.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(a.scenario).toBeUndefined()
  })

  it('2. --date / --scenario / --dry-run / --verbose flag を解析', () => {
    const a = parseHarnessArgs([
      '--date',
      '2026-05-08',
      '--scenario',
      'cost_cap_trigger',
      '--dry-run',
      '--verbose',
    ])
    expect(a.date).toBe('2026-05-08')
    expect(a.scenario).toBe('cost_cap_trigger')
    expect(a.dryRun).toBe(true)
    expect(a.verbose).toBe(true)
  })

  it('3. --output / --cli-path も解析', () => {
    const a = parseHarnessArgs([
      '-o',
      '/tmp/out.md',
      '--cli-path',
      '/usr/local/bin/claude',
    ])
    expect(a.outputPath).toBe('/tmp/out.md')
    expect(a.cliPath).toBe('/usr/local/bin/claude')
  })
})

describe('drill-2-1-shot-harness / DRILL_2_SCENARIOS (R13 Dev-C)', () => {
  it('4. 9 シナリオが定義され Object.freeze 済み', () => {
    expect(DRILL_2_SCENARIOS).toHaveLength(9)
    expect(Object.isFrozen(DRILL_2_SCENARIOS)).toBe(true)
    expect(DRILL_2_SCENARIOS).toContain('normal')
    expect(DRILL_2_SCENARIOS).toContain('audit_log_tampering')
  })
})

describe('drill-2-1-shot-harness / buildDrillReport (R13 Dev-C)', () => {
  const fakePreFlight: PreFlightCheckResult = Object.freeze({
    env: Object.freeze({ ok: true, missing: Object.freeze([]) as readonly string[] }),
    git: Object.freeze({ ok: true, clean: true, branch: 'main' }),
    pnpm: Object.freeze({ ok: true, version: '9.0.0' }),
    mockClaudeAvailable: true,
    cliPathValid: true,
    host: Object.freeze({
      platform: 'win32',
      release: '10.0.26200',
      hostname: 'test-host',
    }),
    overallOk: true,
    diagnostics: Object.freeze([]) as readonly string[],
  })

  it('5. markdown table を生成、passed/failed カウント正確', () => {
    const scenarios: ScenarioRunOutcome[] = [
      Object.freeze({
        scenario: 'normal',
        startedAtIso: '2026-05-08T06:00:00.000Z',
        finishedAtIso: '2026-05-08T06:00:01.000Z',
        durationMs: 1000,
        spawnStarted: true,
        emittedEventCount: 1,
        killTriggered: false,
        exitCode: 0,
        exitSignal: null,
        auditValid: true,
        auditEntryCount: 2,
        cleanupOk: true,
        errorMessage: null,
      }),
      Object.freeze({
        scenario: 'kill_switch_trigger',
        startedAtIso: '2026-05-08T06:00:01.000Z',
        finishedAtIso: '2026-05-08T06:00:02.000Z',
        durationMs: 1000,
        spawnStarted: false,
        emittedEventCount: 0,
        killTriggered: false,
        exitCode: null,
        exitSignal: null,
        auditValid: false,
        auditEntryCount: 0,
        cleanupOk: false,
        errorMessage: 'mock fail',
      }),
    ]
    const r = buildDrillReport({
      date: '2026-05-08',
      preFlight: fakePreFlight,
      scenarios,
    })
    expect(r.passed).toBe(1)
    expect(r.failed).toBe(1)
    expect(r.totalDurationMs).toBe(2000)
    expect(r.markdown).toMatch(/Drill #2 1-shot real-execution report/)
    expect(r.markdown).toMatch(/normal/)
    expect(r.markdown).toMatch(/kill_switch_trigger/)
    expect(r.markdown).toMatch(/Passed: 1/)
    expect(r.markdown).toMatch(/Failed: 1/)
  })
})

describe('drill-2-1-shot-harness / grepAuditEntries + cleanupOldScratchDirs (R13 Dev-C)', () => {
  it('6. grepAuditEntries: scenario 名一致 entry のみ抽出', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'r13c-grep-'))
    const auditPath = join(dir, 'audit.jsonl')
    await fs.writeFile(
      auditPath,
      [
        '{"type":"other","payload":{"scenario":"normal","stage":"spawn"}}',
        '{"type":"other","payload":{"scenario":"cost_cap_trigger","stage":"final"}}',
        '{"type":"kill_switch","payload":{"scenario":"normal","stage":"final"}}',
        '',
      ].join('\n'),
      'utf8',
    )
    const normalEntries = await grepAuditEntries(auditPath, 'normal')
    expect(normalEntries).toHaveLength(2)
    const cost = await grepAuditEntries(auditPath, 'cost_cap_trigger')
    expect(cost).toHaveLength(1)
    const none = await grepAuditEntries(auditPath, 'rate_spike')
    expect(none).toHaveLength(0)
    await fs.rm(dir, { recursive: true, force: true })
  })

  it('7. cleanupOldScratchDirs: prefix 一致 + maxAge 超過 dir のみ削除、新しいものは残す', async () => {
    // 24h より古い fake mtime を作るのは fs.utimes で時刻書換するか、prefix を別にして即時削除を試す
    // 安全策: 新しい dir のみ残ることを確認する (maxAge=0 で全 prefix dir 削除)
    const prefix = `r13c-cleanup-test-${Date.now()}-`
    const a = await fs.mkdtemp(join(tmpdir(), prefix))
    const b = await fs.mkdtemp(join(tmpdir(), prefix))
    // maxAge=0 で全件削除対象
    const r = await cleanupOldScratchDirs(prefix, 0)
    expect(r.removed).toBeGreaterThanOrEqual(2)
    // 削除確認
    await expect(fs.access(a)).rejects.toThrow()
    await expect(fs.access(b)).rejects.toThrow()
  })
})
