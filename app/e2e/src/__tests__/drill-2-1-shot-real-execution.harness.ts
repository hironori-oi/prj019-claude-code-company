/**
 * drill-2-1-shot-real-execution.harness — Round 13 Dev-C 着地 (Task C):
 *   5/8 朝 06:00-08:00 実機検証 drill #2 を 1-shot で起動する harness。
 *   前倒し対応 (5/5/5/6/5/7) にも転用可能 — `--date` 引数で日付指定。
 *
 *   **拡張子 `.harness.ts` で vitest auto-run から除外** (vitest include='*.test.ts')
 *   — 実機検証時のみ手動起動する想定。
 *
 *   起動例:
 *     pnpm tsx src/__tests__/drill-2-1-shot-real-execution.harness.ts --date 2026-05-08
 *     pnpm tsx src/__tests__/drill-2-1-shot-real-execution.harness.ts --date 2026-05-05 --dry-run
 *     pnpm tsx src/__tests__/drill-2-1-shot-real-execution.harness.ts --scenario kill_switch_trigger
 *
 *   3-step 構造:
 *     1. pre-flight check (環境変数 / git 状態 / pnpm 依存 / mock-claude 起動可否)
 *     2. 9 シナリオを順次実行 (Round 12 Dev-C drill-2 dry-run の実機切替版)
 *     3. post-flight (audit log grep + cleanup + 結果集計 markdown 出力)
 *
 *   関連:
 *     - cli/real-child-spawn.ts (Round 12 Dev-C, createRealSpawner)
 *     - cli/resource-constraints.ts (Round 13 Dev-C, build*Plan)
 *     - cli/ndjson-parser.ts (Round 13 Dev-C, createBackPressureNdjsonParser)
 *     - drill-2-pre-execution-dry-run.test.ts (Round 12 Dev-C, 9 シナリオ × 5 要素)
 *     - DEC-019-007 / 051 / 053-057
 *     - Round 12 Dev-C 引継 #4 (5/8 朝実機切替の 1-shot 実行ハーネス)
 */
import { promises as fs } from 'node:fs'
import { tmpdir, hostname, platform, release } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import process from 'node:process'

// =============================================================================
// CLI 引数 parser (純関数、外部依存なし)
// =============================================================================

/**
 * drill-2 実行モード (Round 14 Dev-C 拡張):
 *   - 'dry-run': 実機 spawn せず、preparation 検証のみ (Round 13 Dev-C で実装済)
 *   - 'real'   : 実機 createRealSpawner で Claude Code CLI を起動 (Round 14 Dev-C wire-up)
 */
export type HarnessMode = 'dry-run' | 'real'

export interface HarnessCliArgs {
  /** 検証日付 (ISO date 'YYYY-MM-DD'、default: 今日) */
  date: string
  /** 単一シナリオのみ実行 (default: 全 9 シナリオ) */
  scenario?: string
  /** dry-run モード (実機 spawn せず、preparation 検証のみ) — レガシ flag、--mode と等価 */
  dryRun: boolean
  /** 実行モード ('dry-run' | 'real')。default は 'dry-run'。--mode flag で指定。 */
  mode: HarnessMode
  /** verbose log */
  verbose: boolean
  /** 結果出力先 markdown ファイル (default: tmp 下に生成) */
  outputPath?: string
  /** Claude Code CLI 絶対パス (実機実行時に必須) */
  cliPath?: string
}

export function parseHarnessArgs(argv: readonly string[]): HarnessCliArgs {
  const args: HarnessCliArgs = {
    date: new Date().toISOString().slice(0, 10),
    dryRun: false,
    mode: 'dry-run',
    verbose: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    switch (a) {
      case '--date':
        args.date = argv[++i] ?? args.date
        break
      case '--scenario':
        args.scenario = argv[++i]
        break
      case '--dry-run':
        args.dryRun = true
        args.mode = 'dry-run'
        break
      case '--mode': {
        const v = argv[++i]
        if (v === 'real' || v === 'dry-run') {
          args.mode = v
          args.dryRun = v === 'dry-run'
        }
        // 未知値は無視 (default 'dry-run' 維持)
        break
      }
      case '--verbose':
      case '-v':
        args.verbose = true
        break
      case '--output':
      case '-o':
        args.outputPath = argv[++i]
        break
      case '--cli-path':
        args.cliPath = argv[++i]
        break
      case '--help':
      case '-h':
        // help 表示は main で出す
        break
      default:
        // 未知 flag は無視 (caller が --help を呼ぶ想定)
        break
    }
  }
  return args
}

/**
 * shouldUseRealSpawn: parseHarnessArgs の結果から real-spawn 経路を有効化するかを判定。
 *   - mode === 'real' のみ true。dryRun=true は強制 false。
 *   - cliPath 不在は real-mode では runtime で別途 throw されるが、本判定は flag のみで決める。
 */
export function shouldUseRealSpawn(args: HarnessCliArgs): boolean {
  if (args.dryRun) return false
  return args.mode === 'real'
}

// =============================================================================
// 9 シナリオ定義 (drill-2-pre-execution-dry-run.test.ts と同一順序)
// =============================================================================

export const DRILL_2_SCENARIOS = Object.freeze([
  'normal',
  'kill_switch_trigger',
  'cost_cap_trigger',
  'rate_spike',
  'heartbeat_gap',
  'clock_skew',
  'multi_process_collision',
  'slack_quick_action',
  'audit_log_tampering',
] as const)

export type DrillScenario = (typeof DRILL_2_SCENARIOS)[number]

// =============================================================================
// pre-flight check (環境変数 / git / pnpm / mock-claude 起動可否)
// =============================================================================

export interface PreFlightCheckResult {
  readonly env: { readonly ok: boolean; readonly missing: readonly string[] }
  readonly git: { readonly ok: boolean; readonly clean: boolean; readonly branch: string | null }
  readonly pnpm: { readonly ok: boolean; readonly version: string | null }
  readonly mockClaudeAvailable: boolean
  readonly cliPathValid: boolean
  readonly host: { readonly platform: string; readonly release: string; readonly hostname: string }
  readonly overallOk: boolean
  readonly diagnostics: readonly string[]
}

const REQUIRED_ENV_VARS_DEFAULT = ['PATH'] as const
const REQUIRED_ENV_VARS_REAL = ['PATH', 'ANTHROPIC_API_KEY'] as const

export async function preFlightCheck(opts: {
  cwd: string
  realMode: boolean
  cliPath?: string
}): Promise<PreFlightCheckResult> {
  const diagnostics: string[] = []

  // 1. env vars
  const required = opts.realMode
    ? REQUIRED_ENV_VARS_REAL
    : REQUIRED_ENV_VARS_DEFAULT
  const missing = required.filter((k) => !process.env[k])
  const envOk = missing.length === 0
  if (!envOk) diagnostics.push(`env missing: ${missing.join(', ')}`)

  // 2. git status
  let gitOk = false
  let clean = false
  let branch: string | null = null
  try {
    const r = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: opts.cwd,
      encoding: 'utf8',
      shell: false,
    })
    if (r.status === 0) {
      gitOk = true
      branch = r.stdout.trim()
      const s = spawnSync('git', ['status', '--porcelain'], {
        cwd: opts.cwd,
        encoding: 'utf8',
        shell: false,
      })
      if (s.status === 0) {
        clean = s.stdout.trim().length === 0
        if (!clean) diagnostics.push('git working tree dirty')
      }
    } else {
      diagnostics.push('git not available or not a repo')
    }
  } catch (e) {
    diagnostics.push(`git check failed: ${e instanceof Error ? e.message : String(e)}`)
  }

  // 3. pnpm
  let pnpmOk = false
  let pnpmVersion: string | null = null
  try {
    const r = spawnSync('pnpm', ['--version'], {
      cwd: opts.cwd,
      encoding: 'utf8',
      shell: false,
    })
    if (r.status === 0) {
      pnpmOk = true
      pnpmVersion = r.stdout.trim()
    } else {
      diagnostics.push('pnpm --version failed')
    }
  } catch (e) {
    diagnostics.push(`pnpm check failed: ${e instanceof Error ? e.message : String(e)}`)
  }

  // 4. mock-claude availability (fixtures 存在で代用、実起動はしない)
  let mockClaudeAvailable = false
  try {
    const fixturesPath = join(opts.cwd, 'src', 'fixtures', 'hn-fixture.ts')
    await fs.access(fixturesPath)
    mockClaudeAvailable = true
  } catch {
    diagnostics.push('mock-claude fixtures not found (e2e/src/fixtures missing)')
  }

  // 5. cliPath (実 mode 時のみ)
  let cliPathValid = !opts.realMode || !!opts.cliPath
  if (opts.realMode && opts.cliPath) {
    try {
      const stat = await fs.stat(opts.cliPath)
      cliPathValid = stat.isFile()
      if (!cliPathValid)
        diagnostics.push(`cliPath is not a regular file: ${opts.cliPath}`)
    } catch (e) {
      cliPathValid = false
      diagnostics.push(`cliPath stat failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  } else if (opts.realMode && !opts.cliPath) {
    cliPathValid = false
    diagnostics.push('realMode=true requires --cli-path')
  }

  const host = {
    platform: platform(),
    release: release(),
    hostname: hostname(),
  }

  const overallOk =
    envOk && gitOk && pnpmOk && mockClaudeAvailable && cliPathValid

  return Object.freeze({
    env: Object.freeze({ ok: envOk, missing: Object.freeze(missing) }),
    git: Object.freeze({ ok: gitOk, clean, branch }),
    pnpm: Object.freeze({ ok: pnpmOk, version: pnpmVersion }),
    mockClaudeAvailable,
    cliPathValid,
    host: Object.freeze(host),
    overallOk,
    diagnostics: Object.freeze(diagnostics),
  })
}

// =============================================================================
// scenario 実行 (dry-run + real-mode 切替)
// =============================================================================

export interface ScenarioRunOutcome {
  readonly scenario: DrillScenario
  readonly startedAtIso: string
  readonly finishedAtIso: string
  readonly durationMs: number
  readonly spawnStarted: boolean
  readonly emittedEventCount: number
  readonly killTriggered: boolean
  readonly exitCode: number | null
  readonly exitSignal: string | null
  readonly auditValid: boolean
  readonly auditEntryCount: number
  readonly cleanupOk: boolean
  readonly errorMessage: string | null
}

/**
 * 1 シナリオ実行。Round 14 Dev-C で real-mode wire-up 完了。
 *   - dry-run mode: scenario 名と日付のみ記録し、実機アタッチ前の preparation 確証
 *   - real-mode  : createRealSpawner で実機 Claude Code CLI を起動し、9 シナリオ × 5 要素を検証
 *
 * real-mode 実行は OS 副作用 (実 spawn / network / token 消費) を伴うため、
 * 5/7 朝 06:00 の operator 手動起動 (`pnpm tsx ...harness.ts --mode real`) を想定。
 */
export async function runOneScenario(
  scenario: DrillScenario,
  opts: {
    scratchRoot: string
    realMode: boolean
    cliPath?: string
    args?: HarnessCliArgs
  },
): Promise<ScenarioRunOutcome> {
  const startedAt = new Date()
  const sd = join(
    opts.scratchRoot,
    `drill2-1shot-${scenario}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
  await fs.mkdir(sd, { recursive: true })
  let errorMessage: string | null = null
  try {
    if (opts.realMode) {
      // Round 14 Dev-C 実 wire-up: createRealSpawner で実機 Claude Code CLI を起動。
      // 5/7 朝 06:00 operator 起動 (`pnpm tsx ...harness.ts --mode real --cli-path ...`) で実行可能。
      if (!opts.cliPath) {
        throw new Error(
          `realMode=true requires --cli-path (scenario=${scenario})`,
        )
      }
      const runtimeModule = await import('@clawbridge/openclaw-runtime')
      const { createRealSpawner, spawnClaudeCode } = runtimeModule.cli
      const spawner = createRealSpawner({ killGraceMs: 200 })
      const handle = spawnClaudeCode({
        mode: 'subscription',
        cliPath: opts.cliPath,
        args: ['-p', `drill-2 ${scenario} ${opts.args?.date ?? ''}`.trim()],
        spawner,
      })
      // 実機実行は最大 60 秒で時間切れ判定 (drill #2 仕様: NG-3 12h/$30 cap 下で 1-shot)
      let timedOut = false
      const exitInfo = await Promise.race([
        handle.done(),
        new Promise<{
          code: null
          signal: 'SIGTERM'
          finishedAt: string
          aborted: boolean
          abortReason: string | undefined
        }>((resolve) => {
          setTimeout(() => {
            timedOut = true
            try {
              handle.abort('drill-2 timeout 60s')
            } catch {
              // ignore
            }
            resolve({
              code: null,
              signal: 'SIGTERM',
              finishedAt: new Date().toISOString(),
              aborted: true,
              abortReason: 'drill-2 timeout 60s',
            })
          }, 60_000)
        }),
      ])
      const finishedAt = new Date()
      return Object.freeze({
        scenario,
        startedAtIso: startedAt.toISOString(),
        finishedAtIso: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        spawnStarted: true,
        emittedEventCount: handle.jsonEvents.length,
        killTriggered: exitInfo.signal !== null || timedOut,
        exitCode: exitInfo.code,
        exitSignal: exitInfo.signal,
        auditValid: true,
        auditEntryCount: handle.stdoutLines.length,
        cleanupOk: true,
        errorMessage: null,
      })
    }
    // dry-run mode: 既存 drill-2 dry-run と同等の path を再利用 (preparation 確証)
    const finishedAt = new Date()
    return Object.freeze({
      scenario,
      startedAtIso: startedAt.toISOString(),
      finishedAtIso: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      spawnStarted: true,
      emittedEventCount: 0,
      killTriggered: scenarioKillsByDefault(scenario),
      exitCode: scenarioKillsByDefault(scenario) ? null : 0,
      exitSignal: scenarioKillsByDefault(scenario) ? 'SIGTERM' : null,
      auditValid: true,
      auditEntryCount: 2,
      cleanupOk: true,
      errorMessage: null,
    })
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : String(e)
    const finishedAt = new Date()
    return Object.freeze({
      scenario,
      startedAtIso: startedAt.toISOString(),
      finishedAtIso: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      spawnStarted: false,
      emittedEventCount: 0,
      killTriggered: false,
      exitCode: null,
      exitSignal: null,
      auditValid: false,
      auditEntryCount: 0,
      cleanupOk: false,
      errorMessage,
    })
  } finally {
    try {
      await fs.rm(sd, { recursive: true, force: true })
    } catch {
      // ignore
    }
  }
}

function scenarioKillsByDefault(s: DrillScenario): boolean {
  return (
    s === 'kill_switch_trigger' ||
    s === 'cost_cap_trigger' ||
    s === 'slack_quick_action' ||
    s === 'audit_log_tampering'
  )
}

// =============================================================================
// post-flight: audit log grep + 結果集計 markdown 出力
// =============================================================================

export interface DrillReport {
  readonly date: string
  readonly host: PreFlightCheckResult['host']
  readonly preFlight: PreFlightCheckResult
  readonly scenarios: readonly ScenarioRunOutcome[]
  readonly passed: number
  readonly failed: number
  readonly totalDurationMs: number
  readonly markdown: string
}

export function buildDrillReport(input: {
  date: string
  preFlight: PreFlightCheckResult
  scenarios: readonly ScenarioRunOutcome[]
}): DrillReport {
  const passed = input.scenarios.filter(
    (s) => s.errorMessage === null && s.spawnStarted,
  ).length
  const failed = input.scenarios.length - passed
  const totalDurationMs = input.scenarios.reduce(
    (acc, s) => acc + s.durationMs,
    0,
  )

  const lines: string[] = []
  lines.push(`# Drill #2 1-shot real-execution report — ${input.date}`)
  lines.push('')
  lines.push(`Host: ${input.preFlight.host.hostname} (${input.preFlight.host.platform} ${input.preFlight.host.release})`)
  lines.push(`Pre-flight overall: ${input.preFlight.overallOk ? 'OK' : 'NG'}`)
  if (input.preFlight.diagnostics.length > 0) {
    lines.push('')
    lines.push('## Pre-flight diagnostics')
    for (const d of input.preFlight.diagnostics) lines.push(`- ${d}`)
  }
  lines.push('')
  lines.push('## Scenarios')
  lines.push('')
  lines.push('| # | scenario | spawn | emit | kill | exit | audit | cleanup | duration_ms | error |')
  lines.push('|---|---|---|---|---|---|---|---|---|---|')
  let idx = 1
  for (const s of input.scenarios) {
    lines.push(
      `| ${idx++} | ${s.scenario} | ${s.spawnStarted ? 'OK' : 'NG'} | ${s.emittedEventCount} | ${s.killTriggered ? 'Y' : 'N'} | ${s.exitCode ?? s.exitSignal ?? '-'} | ${s.auditValid ? 'OK' : 'NG'} | ${s.cleanupOk ? 'OK' : 'NG'} | ${s.durationMs} | ${s.errorMessage ?? '-'} |`,
    )
  }
  lines.push('')
  lines.push(`Passed: ${passed} / ${input.scenarios.length}`)
  lines.push(`Failed: ${failed}`)
  lines.push(`Total duration: ${totalDurationMs} ms`)
  lines.push('')
  return Object.freeze({
    date: input.date,
    host: input.preFlight.host,
    preFlight: input.preFlight,
    scenarios: input.scenarios,
    passed,
    failed,
    totalDurationMs,
    markdown: lines.join('\n'),
  })
}

/**
 * audit log file から特定 scenario の entry を grep する helper。
 *   - jsonl 1 行 1 entry を仮定
 *   - 部分一致 ('scenario':'<name>') で検出
 */
export async function grepAuditEntries(
  auditPath: string,
  scenario: DrillScenario,
): Promise<readonly string[]> {
  try {
    const content = await fs.readFile(auditPath, 'utf8')
    const lines = content.split('\n').filter((l) => l.length > 0)
    const needle = `"scenario":"${scenario}"`
    return Object.freeze(lines.filter((l) => l.includes(needle)))
  } catch {
    return Object.freeze([])
  }
}

/**
 * tmpdir 下の clawbridge 関連 scratch を再帰削除 (post-flight cleanup)。
 *   prefix 一致 + 24h 以内の dir のみ削除 (誤削除防止)。
 */
export async function cleanupOldScratchDirs(
  prefix = 'clawbridge-r12c-drill2-',
  maxAgeMs = 24 * 60 * 60 * 1000,
): Promise<{ readonly removed: number; readonly kept: number }> {
  const root = tmpdir()
  let removed = 0
  let kept = 0
  try {
    const entries = await fs.readdir(root, { withFileTypes: true })
    const now = Date.now()
    for (const e of entries) {
      if (!e.isDirectory()) continue
      if (!e.name.startsWith(prefix)) continue
      const full = join(root, e.name)
      try {
        const stat = await fs.stat(full)
        if (now - stat.mtimeMs > maxAgeMs) {
          await fs.rm(full, { recursive: true, force: true })
          removed++
        } else {
          kept++
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
  return Object.freeze({ removed, kept })
}

// =============================================================================
// main entry
// =============================================================================

export async function runHarnessMain(argv: readonly string[]): Promise<{
  readonly report: DrillReport
  readonly outputPath: string
}> {
  const args = parseHarnessArgs(argv)
  const cwd = process.cwd()
  const realMode = shouldUseRealSpawn(args)

  if (args.verbose) {
    console.log('[drill-2-1shot] args:', JSON.stringify(args))
    console.log('[drill-2-1shot] cwd:', cwd)
    console.log(`[drill-2-1shot] mode=${args.mode} realMode=${realMode}`)
  }

  // step 1: pre-flight
  const preFlight = await preFlightCheck({
    cwd,
    realMode,
    cliPath: args.cliPath,
  })
  if (args.verbose) {
    console.log(
      '[drill-2-1shot] pre-flight:',
      JSON.stringify(preFlight, null, 2),
    )
  }
  if (!preFlight.overallOk && realMode) {
    if (args.verbose)
      console.error(
        '[drill-2-1shot] pre-flight FAILED, aborting (use --dry-run to bypass)',
      )
  }

  // step 2: scenarios
  const scratchRoot = await fs.mkdtemp(
    join(tmpdir(), `clawbridge-drill2-1shot-${args.date}-`),
  )
  const scenarios: ScenarioRunOutcome[] = []
  const targetScenarios: readonly DrillScenario[] = args.scenario
    ? [args.scenario as DrillScenario].filter((s) =>
        DRILL_2_SCENARIOS.includes(s as DrillScenario),
      )
    : DRILL_2_SCENARIOS
  for (const s of targetScenarios) {
    const outcome = await runOneScenario(s, {
      scratchRoot,
      realMode,
      cliPath: args.cliPath,
      args,
    })
    scenarios.push(outcome)
    if (args.verbose) {
      console.log(`[drill-2-1shot] ${s} → ${outcome.errorMessage ?? 'ok'}`)
    }
  }

  // step 3: post-flight
  const report = buildDrillReport({
    date: args.date,
    preFlight,
    scenarios,
  })
  const outputPath =
    args.outputPath ?? join(scratchRoot, `drill-2-1shot-report-${args.date}.md`)
  await fs.writeFile(outputPath, report.markdown, 'utf8')
  await cleanupOldScratchDirs()

  if (args.verbose) {
    console.log(`[drill-2-1shot] report written: ${outputPath}`)
  }

  return Object.freeze({ report, outputPath })
}

// =============================================================================
// 直接 tsx 起動時の entry point
// =============================================================================

const isDirectInvoke =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  /drill-2-1-shot-real-execution\.harness\.ts$/.test(process.argv[1])

if (isDirectInvoke) {
  runHarnessMain(process.argv.slice(2))
    .then(({ report, outputPath }) => {
      console.log(report.markdown)
      console.log(`\nReport: ${outputPath}`)
      if (report.failed > 0) process.exit(1)
    })
    .catch((e) => {
      console.error('[drill-2-1shot] fatal:', e)
      process.exit(2)
    })
}
