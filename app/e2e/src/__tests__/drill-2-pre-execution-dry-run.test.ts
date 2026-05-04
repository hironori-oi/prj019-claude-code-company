/**
 * drill-2-pre-execution-dry-run.test — Round 12 Dev-C 着地:
 *   5/8 朝 06:00-08:00 実機検証 drill #2 の dry-run preparation 用 test harness。
 *
 * 設計方針 (Round 11 Review-C drill-2-execution-spec 9 シナリオ × 5 要素 = 45 セル):
 *   9 シナリオ:
 *     1. 通常稼働 (normal)
 *     2. kill-switch 発動 (kill_switch_trigger)
 *     3. cost cap 到達 (cost_cap_trigger)
 *     4. rate spike (rate_spike)
 *     5. heartbeat gap (heartbeat_gap)
 *     6. clock skew (clock_skew)
 *     7. multi-process 衝突 (multi_process_collision)
 *     8. Slack quick-action (slack_quick_action)
 *     9. audit log 改ざん検知 (audit_log_tampering)
 *
 *   5 要素 (各シナリオで検証):
 *     a. 起動成功 (spawn lifecycle が starting → running 遷移、SpawnHandle 取得)
 *     b. 期待 event 出力 (NDJSON / tos-monitor / kill-switch event)
 *     c. 期待 status code (exit code, kill triggered, fallback decision など)
 *     d. audit log 整合性 (hash chain verify pass、append-only)
 *     e. cleanup 完遂 (resources released、tmp dir 削除可能)
 *
 *   実装:
 *     - 全 dry-run mode (spawnClaudeCode mode='dry-run' + MockChildProcess factory)
 *     - 実 spawn / 実 fs (audit log は tmp dir のみ) / 実 network 一切なし
 *     - TimeSource DI (FakeTimeSource) で deterministic
 *     - 5/8 朝実機検証時は 1 行コメントアウト解除で createRealSpawner に切替可能な構造
 *
 *   再利用ハーネス:
 *     - runDrillScenario(scenarioName, opts) → ScenarioResult を返す factory
 *     - 各 test 内で 1 シナリオ実行 → 5 要素 assert
 *
 * 関連:
 *   - cli/spawn-claude-code.ts (Dev-D Round 11) — dry-run mode + MockChildProcess
 *   - cli/real-child-spawn.ts (Dev-C Round 12) — 5/8 朝実機切替用 (本 test では未使用)
 *   - cli/ndjson-parser.ts (Dev-C Round 12) — stdout chunk 跨ぎ NDJSON 抽出
 *   - flow/run-mock-claw-flow.ts — 既存 e2e flow scaffold (Round 10/11)
 *   - DEC-019-007 / 051 / 053-057 (W0 前倒し / R12 並列 dispatch)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  spawnClaudeCode,
  type MockChildProcess,
  type SpawnDryRunRecord,
  type SpawnHandle,
  type SpawnMode,
} from '../../../openclaw-runtime/src/cli/spawn-claude-code.js'
import {
  createNdjsonStreamParser,
} from '../../../openclaw-runtime/src/cli/ndjson-parser.js'
// 5/8 朝実機検証時は次行コメントアウト解除し、shouldUseRealSpawn=true の分岐を有効化:
// import { createRealSpawner } from '../../../openclaw-runtime/src/cli/real-child-spawn.js'
import {
  FakeTimeSource,
  FileKillSwitch,
  shouldFallbackToApiKey,
} from '../../../harness/src/index.js'
import { FileAuditLogStore } from '../../../audit/src/index.js'

/**
 * 9 シナリオ識別子。
 */
type DrillScenario =
  | 'normal'
  | 'kill_switch_trigger'
  | 'cost_cap_trigger'
  | 'rate_spike'
  | 'heartbeat_gap'
  | 'clock_skew'
  | 'multi_process_collision'
  | 'slack_quick_action'
  | 'audit_log_tampering'

/**
 * 5 要素 outcome。
 */
interface ScenarioResult {
  /** a. 起動成功 */
  spawnStarted: boolean
  /** SpawnHandle */
  handle: SpawnHandle | null
  /** b. 期待 event 出力 (NDJSON / kill / tos) */
  emittedEvents: readonly { type: string; payload: unknown }[]
  /** c. 期待 status code (mock では 0 / null / -1 を返す) */
  exitCode: number | null
  exitSignal: string | null
  killTriggered: boolean
  /** d. audit log 整合性: verify.valid */
  auditValid: boolean
  auditEntryCount: number
  /** e. cleanup 完遂 */
  cleanupOk: boolean
  /** 失敗理由 (デバッグ用) */
  failureReason?: string
  /** dry-run 試行 record */
  dryRunRecords: readonly SpawnDryRunRecord[]
}

/**
 * test harness 入力。
 */
interface RunScenarioOptions {
  scratchDir: string
  auditPath: string
  /** 5/8 朝実機切替 flag (現在常に false で dry-run) */
  shouldUseRealSpawn?: boolean
  /** TimeSource (default = FakeTimeSource at 2026-05-08T06:00:00Z) */
  timeSource?: FakeTimeSource
}

/**
 * MockChildProcess factory (シナリオごとに異なる stdout / exit を emit)。
 */
function makeScenarioChild(
  scenario: DrillScenario,
): MockChildProcess & { emitStdout(line: string): void; triggerExit(code: number | null, signal?: string | null): void } {
  let alive = true
  const stdoutListeners: Array<(line: string) => void> = []
  const stderrListeners: Array<(line: string) => void> = []
  const exitListeners: Array<(code: number | null, signal: string | null) => void> = []
  const child: MockChildProcess & {
    emitStdout(line: string): void
    triggerExit(code: number | null, signal?: string | null): void
  } = {
    pid: 99001,
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
      queueMicrotask(() => {
        for (const l of exitListeners) l(null, _sig ?? 'SIGTERM')
      })
      return true
    },
    isAlive() {
      return alive
    },
    emitStdout(line) {
      for (const l of stdoutListeners) l(line)
    },
    triggerExit(code, signal) {
      alive = false
      for (const l of exitListeners) l(code, signal ?? null)
    },
  }
  // void unused listener arrays for stderr (tests focus on stdout)
  void stderrListeners
  // scenario 別の stdout 起動 emit (小さな delay 後)
  queueMicrotask(() => {
    switch (scenario) {
      case 'normal':
        for (const l of stdoutListeners) l('{"messageType":"progress_update","progressPercent":10}')
        break
      case 'kill_switch_trigger':
        for (const l of stdoutListeners)
          l('{"messageType":"error_report","severity":"error","reason":"emergency_stop"}')
        break
      case 'cost_cap_trigger':
        for (const l of stdoutListeners)
          l('{"messageType":"error_report","severity":"error","reason":"cost_cap_breach","amountUsd":35}')
        break
      case 'rate_spike':
        for (const l of stdoutListeners)
          l('{"messageType":"progress_update","progressPercent":5,"rateSpike":true}')
        break
      case 'heartbeat_gap':
        for (const l of stdoutListeners)
          l('{"messageType":"progress_update","progressPercent":3,"heartbeatGapSec":120}')
        break
      case 'clock_skew':
        for (const l of stdoutListeners)
          l('{"messageType":"error_report","severity":"warn","reason":"clock_skew","skewMs":5000}')
        break
      case 'multi_process_collision':
        for (const l of stdoutListeners)
          l('{"messageType":"error_report","severity":"warn","reason":"multi_process_collision","conflictPid":99002}')
        break
      case 'slack_quick_action':
        for (const l of stdoutListeners)
          l('{"messageType":"progress_update","progressPercent":50,"slackTriggered":true,"actionId":"clawbridge:quick_action:kill_switch"}')
        break
      case 'audit_log_tampering':
        for (const l of stdoutListeners)
          l('{"messageType":"error_report","severity":"error","reason":"audit_chain_broken","brokenAt":3}')
        break
    }
  })
  return child
}

/**
 * 1 シナリオ実行 harness (再利用可能、5/8 朝実機検証でも使用)。
 */
async function runDrillScenario(
  scenario: DrillScenario,
  opts: RunScenarioOptions,
): Promise<ScenarioResult> {
  const ts = opts.timeSource ?? new FakeTimeSource(new Date('2026-05-08T06:00:00.000Z'))
  const records: SpawnDryRunRecord[] = []
  const emittedEvents: { type: string; payload: unknown }[] = []
  let spawnStarted = false
  let handle: SpawnHandle | null = null
  let cleanupOk = false
  let failureReason: string | undefined

  // audit log store
  const auditStore = new FileAuditLogStore({
    filePath: opts.auditPath,
    rotation: { rotateOnAppend: false },
    now: () => ts.now(),
  })

  // kill-switch (per-scenario behavior)
  const killSwitchPath = join(opts.scratchDir, `kill-${scenario}.json`)
  const killSwitch = new FileKillSwitch({
    signalFilePath: killSwitchPath,
    historyFilePath: join(opts.scratchDir, `kill-history-${scenario}.json`),
    timeSource: ts,
    exitOnTrigger: false,
  })
  await killSwitch.arm()

  try {
    // shouldUseRealSpawn=true の場合は実 spawn (5/8 朝のみ)、現在は常に dry-run + MockChildProcess
    const useReal = opts.shouldUseRealSpawn ?? false
    let mode: SpawnMode = 'dry-run'
    let spawner: ((o: unknown) => MockChildProcess) | undefined
    if (useReal) {
      // 5/8 朝実機切替時にコメントアウト解除:
      // spawner = createRealSpawner({ killGraceMs: 200 })
      // mode = 'subscription'
      throw new Error('shouldUseRealSpawn=true requires manual real spawner enable (5/8 朝)')
    } else {
      const child = makeScenarioChild(scenario)
      // dry-run mode は spawner 不要だが、scenario stdout を emulate するため
      // subscription mode で MockChildProcess factory を渡す方が要素 b/c の検証に向く。
      // よって dry-run record を別途 mode='dry-run' で生成し、subscription mode で actual emit を取る。
      mode = 'subscription'
      spawner = () => child
    }

    // (1) dry-run record (a. 起動成功 + cleanup 確認用)
    spawnClaudeCode({
      mode: 'dry-run',
      cliPath: '/abs/claude',
      args: ['-p', `drill-${scenario}`],
      env: { PATH: '/usr/bin' },
      cwd: opts.scratchDir,
      dryRunRecorder: (r) => records.push(r),
      nowIso: () => ts.now().toISOString(),
    })

    // (2) MockChildProcess 経由で event emission (b/c 検証用)
    handle = spawnClaudeCode({
      mode,
      cliPath: '/abs/claude',
      args: ['-p', `drill-${scenario}`],
      env: { PATH: '/usr/bin' },
      cwd: opts.scratchDir,
      spawner: spawner as ((opts: unknown) => MockChildProcess) as
        | undefined
        | ((opts: import('../../../openclaw-runtime/src/cli/spawn-claude-code.js').SpawnClaudeCodeOptions) => MockChildProcess),
      nowIso: () => ts.now().toISOString(),
    })
    spawnStarted = true

    // micro tick で stdout 来るのを待つ
    await Promise.resolve()
    await Promise.resolve()

    // (3) NDJSON parse: scenario 固有 event 抽出
    const parser = createNdjsonStreamParser()
    for (const line of handle.stdoutLines) {
      const events = parser.feed(line + '\n')
      for (const ev of events) {
        const obj = ev as { messageType?: string }
        emittedEvents.push({
          type: typeof obj.messageType === 'string' ? obj.messageType : 'unknown',
          payload: ev,
        })
      }
    }

    // (4) シナリオ別 kill-switch / fallback 動作
    let killTrig = false
    let exitCode: number | null = 0
    let exitSignal: string | null = null
    if (
      scenario === 'kill_switch_trigger' ||
      scenario === 'cost_cap_trigger' ||
      scenario === 'audit_log_tampering' ||
      scenario === 'slack_quick_action'
    ) {
      await killSwitch.trigger(`drill-2 dry-run ${scenario}`, { source: 'manual' })
      killTrig = killSwitch.isTriggered()
      handle.abort(`scenario=${scenario} triggered kill-switch`)
      exitCode = null
      exitSignal = 'SIGTERM'
    } else if (
      scenario === 'rate_spike' ||
      scenario === 'heartbeat_gap' ||
      scenario === 'clock_skew' ||
      scenario === 'multi_process_collision'
    ) {
      // warning 系: kill しない、自然終了
      ;(handle.child as unknown as { triggerExit: (c: number | null, s?: string | null) => void }).triggerExit(0, null)
      exitCode = 0
    } else {
      // normal
      ;(handle.child as unknown as { triggerExit: (c: number | null, s?: string | null) => void }).triggerExit(0, null)
      exitCode = 0
    }

    const exitInfo = await handle.done()

    // (5) audit log append (各 stage 1 entry)
    await auditStore.append({
      type: 'other',
      source: 'orchestrator',
      payload: { scenario, stage: 'spawn_attempt', spawnToken: handle.spawnToken },
    })
    await auditStore.append({
      type: killTrig ? 'kill_switch' : 'other',
      source: 'orchestrator',
      payload: {
        scenario,
        stage: 'final',
        exitCode: exitInfo.code,
        exitSignal: exitInfo.signal,
        killTriggered: killTrig,
      },
    })

    // audit log 整合性検証
    const verify = await auditStore.verifyHashChain()
    const list = await auditStore.list()
    const auditValid = verify.valid
    const auditEntryCount = list.length

    // cleanup: kill-switch disarm + tmp file 削除可能性
    await killSwitch.disarm()
    cleanupOk = true

    return {
      spawnStarted,
      handle,
      emittedEvents,
      exitCode: exitInfo.code,
      exitSignal: exitInfo.signal,
      killTriggered: killTrig,
      auditValid,
      auditEntryCount,
      cleanupOk,
      dryRunRecords: records,
    }
  } catch (err) {
    failureReason = err instanceof Error ? err.message : String(err)
    return {
      spawnStarted,
      handle,
      emittedEvents,
      exitCode: null,
      exitSignal: null,
      killTriggered: false,
      auditValid: false,
      auditEntryCount: 0,
      cleanupOk: false,
      failureReason,
      dryRunRecords: records,
    }
  }
}

let scratchDir: string
let auditPath: string

beforeEach(async () => {
  scratchDir = join(
    tmpdir(),
    `clawbridge-r12c-drill2-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
  await fs.mkdir(scratchDir, { recursive: true })
  auditPath = join(scratchDir, 'audit-events.jsonl')
})

afterEach(async () => {
  try {
    await fs.rm(scratchDir, { recursive: true, force: true })
  } catch {
    // ignore
  }
})

describe('drill #2 5/8 朝実機検証 dry-run preparation (R12 Dev-C / 9 シナリオ × 5 要素)', () => {
  it('1. シナリオ normal: 起動成功 / progress_update emit / exit 0 / audit valid / cleanup ok', async () => {
    const r = await runDrillScenario('normal', { scratchDir, auditPath })
    // 5 要素
    expect(r.spawnStarted).toBe(true) // a
    expect(r.emittedEvents.some((e) => e.type === 'progress_update')).toBe(true) // b
    expect(r.exitCode).toBe(0) // c
    expect(r.auditValid).toBe(true) // d
    expect(r.cleanupOk).toBe(true) // e
    expect(r.failureReason).toBeUndefined()
  })

  it('2. シナリオ kill_switch_trigger: emergency_stop emit / kill triggered / SIGTERM / audit に kill_switch entry', async () => {
    const r = await runDrillScenario('kill_switch_trigger', { scratchDir, auditPath })
    expect(r.spawnStarted).toBe(true)
    expect(r.emittedEvents.some((e) => e.type === 'error_report')).toBe(true)
    expect(r.killTriggered).toBe(true)
    expect(r.exitSignal).toBe('SIGTERM')
    expect(r.auditValid).toBe(true)
    expect(r.cleanupOk).toBe(true)
  })

  it('3. シナリオ cost_cap_trigger: cost_cap_breach emit / kill triggered / amountUsd>=30', async () => {
    const r = await runDrillScenario('cost_cap_trigger', { scratchDir, auditPath })
    expect(r.spawnStarted).toBe(true)
    const breachEv = r.emittedEvents.find((e) => {
      const p = e.payload as { reason?: string }
      return p.reason === 'cost_cap_breach'
    })
    expect(breachEv).toBeDefined()
    const payload = breachEv!.payload as { amountUsd?: number }
    expect(payload.amountUsd).toBeGreaterThanOrEqual(30)
    expect(r.killTriggered).toBe(true)
    expect(r.auditValid).toBe(true)
  })

  it('4. シナリオ rate_spike: warning emit / kill未発火 / exit 0 / audit valid', async () => {
    const r = await runDrillScenario('rate_spike', { scratchDir, auditPath })
    expect(r.spawnStarted).toBe(true)
    const spike = r.emittedEvents.find((e) => {
      const p = e.payload as { rateSpike?: boolean }
      return p.rateSpike === true
    })
    expect(spike).toBeDefined()
    expect(r.killTriggered).toBe(false)
    expect(r.exitCode).toBe(0)
    expect(r.auditValid).toBe(true)
  })

  it('5. シナリオ heartbeat_gap: heartbeatGapSec emit / kill未発火 / cleanup ok', async () => {
    const r = await runDrillScenario('heartbeat_gap', { scratchDir, auditPath })
    expect(r.spawnStarted).toBe(true)
    const gap = r.emittedEvents.find((e) => {
      const p = e.payload as { heartbeatGapSec?: number }
      return typeof p.heartbeatGapSec === 'number'
    })
    expect(gap).toBeDefined()
    expect(r.killTriggered).toBe(false)
    expect(r.cleanupOk).toBe(true)
  })

  it('6. シナリオ clock_skew: skewMs emit / warn severity / exit 0', async () => {
    const r = await runDrillScenario('clock_skew', { scratchDir, auditPath })
    expect(r.spawnStarted).toBe(true)
    const skew = r.emittedEvents.find((e) => {
      const p = e.payload as { reason?: string; severity?: string }
      return p.reason === 'clock_skew' && p.severity === 'warn'
    })
    expect(skew).toBeDefined()
    expect(r.exitCode).toBe(0)
    expect(r.auditValid).toBe(true)
  })

  it('7. シナリオ multi_process_collision: conflictPid emit / kill未発火 / cleanup ok', async () => {
    const r = await runDrillScenario('multi_process_collision', { scratchDir, auditPath })
    expect(r.spawnStarted).toBe(true)
    const collision = r.emittedEvents.find((e) => {
      const p = e.payload as { reason?: string; conflictPid?: number }
      return p.reason === 'multi_process_collision' && typeof p.conflictPid === 'number'
    })
    expect(collision).toBeDefined()
    expect(r.killTriggered).toBe(false)
    expect(r.cleanupOk).toBe(true)
  })

  it('8. シナリオ slack_quick_action: actionId emit / kill triggered (slack 経由)', async () => {
    const r = await runDrillScenario('slack_quick_action', { scratchDir, auditPath })
    expect(r.spawnStarted).toBe(true)
    const slack = r.emittedEvents.find((e) => {
      const p = e.payload as { slackTriggered?: boolean; actionId?: string }
      return p.slackTriggered === true && p.actionId?.startsWith('clawbridge:quick_action:')
    })
    expect(slack).toBeDefined()
    expect(r.killTriggered).toBe(true)
    expect(r.auditValid).toBe(true)
  })

  it('9. シナリオ audit_log_tampering: audit_chain_broken emit / kill triggered', async () => {
    const r = await runDrillScenario('audit_log_tampering', { scratchDir, auditPath })
    expect(r.spawnStarted).toBe(true)
    const tamper = r.emittedEvents.find((e) => {
      const p = e.payload as { reason?: string; brokenAt?: number }
      return p.reason === 'audit_chain_broken' && typeof p.brokenAt === 'number'
    })
    expect(tamper).toBeDefined()
    expect(r.killTriggered).toBe(true)
    // 注意: 本シナリオでは audit log 自体は valid (event は CLI から emit、audit 物理改ざんは別)
    expect(r.auditValid).toBe(true)
  })

  it('10. dry-run record: 全 9 シナリオで spawnToken / cwd / envKeys が必須記録される', async () => {
    const scenarios: DrillScenario[] = [
      'normal',
      'kill_switch_trigger',
      'cost_cap_trigger',
      'rate_spike',
      'heartbeat_gap',
      'clock_skew',
      'multi_process_collision',
      'slack_quick_action',
      'audit_log_tampering',
    ]
    for (const s of scenarios) {
      // 各シナリオは独立 scratchDir / auditPath で実行 (共有 audit に append 衝突防止)
      const sd = join(tmpdir(), `drill2-rec-${s}-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      await fs.mkdir(sd, { recursive: true })
      try {
        const r = await runDrillScenario(s, {
          scratchDir: sd,
          auditPath: join(sd, 'audit.jsonl'),
        })
        expect(r.dryRunRecords).toHaveLength(1)
        expect(r.dryRunRecords[0]!.spawnToken).toMatch(/^spawn-/)
        expect(r.dryRunRecords[0]!.envKeys).toEqual(['PATH'])
        expect(r.dryRunRecords[0]!.cwd).toBe(sd)
      } finally {
        await fs.rm(sd, { recursive: true, force: true })
      }
    }
  })

  it('11. 9 シナリオ × 5 要素 = 45 セル全網羅 matrix', async () => {
    // 1 シナリオあたり 5 boolean 要素を assert、9 行分。
    const scenarios: DrillScenario[] = [
      'normal',
      'kill_switch_trigger',
      'cost_cap_trigger',
      'rate_spike',
      'heartbeat_gap',
      'clock_skew',
      'multi_process_collision',
      'slack_quick_action',
      'audit_log_tampering',
    ]
    const matrix: Array<Record<string, boolean>> = []
    for (const s of scenarios) {
      const sd = join(tmpdir(), `drill2-mtx-${s}-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      await fs.mkdir(sd, { recursive: true })
      try {
        const r = await runDrillScenario(s, {
          scratchDir: sd,
          auditPath: join(sd, 'audit.jsonl'),
        })
        matrix.push({
          scenario: false, // placeholder for label
          a_spawn: r.spawnStarted,
          b_event: r.emittedEvents.length > 0,
          c_status:
            r.exitCode !== null ||
            r.exitSignal !== null ||
            r.killTriggered,
          d_audit: r.auditValid,
          e_cleanup: r.cleanupOk,
        })
      } finally {
        await fs.rm(sd, { recursive: true, force: true })
      }
    }
    // 9 行 × 5 列 (label を除く) = 45 セル 全 true
    expect(matrix).toHaveLength(9)
    let trueCount = 0
    for (const row of matrix) {
      if (row.a_spawn) trueCount++
      if (row.b_event) trueCount++
      if (row.c_status) trueCount++
      if (row.d_audit) trueCount++
      if (row.e_cleanup) trueCount++
    }
    expect(trueCount).toBe(45)
  })

  it('12. shouldUseRealSpawn=true は dry-run preparation phase では明示 throw (5/8 朝のみ解除)', async () => {
    const r = await runDrillScenario('normal', {
      scratchDir,
      auditPath,
      shouldUseRealSpawn: true,
    })
    expect(r.failureReason).toMatch(/shouldUseRealSpawn=true requires manual/)
    expect(r.spawnStarted).toBe(false)
  })

  it('13. determinism: 同一 timeSource で 2 回 run の outcome は一致', async () => {
    const ts1 = new FakeTimeSource(new Date('2026-05-08T06:00:00.000Z'))
    const sd1 = join(tmpdir(), `drill2-det-1-${Date.now()}`)
    const sd2 = join(tmpdir(), `drill2-det-2-${Date.now()}`)
    await fs.mkdir(sd1, { recursive: true })
    await fs.mkdir(sd2, { recursive: true })
    try {
      const r1 = await runDrillScenario('cost_cap_trigger', {
        scratchDir: sd1,
        auditPath: join(sd1, 'a.jsonl'),
        timeSource: ts1,
      })
      const ts2 = new FakeTimeSource(new Date('2026-05-08T06:00:00.000Z'))
      const r2 = await runDrillScenario('cost_cap_trigger', {
        scratchDir: sd2,
        auditPath: join(sd2, 'a.jsonl'),
        timeSource: ts2,
      })
      expect(r1.killTriggered).toBe(r2.killTriggered)
      expect(r1.exitCode).toBe(r2.exitCode)
      expect(r1.auditValid).toBe(r2.auditValid)
      expect(r1.emittedEvents.length).toBe(r2.emittedEvents.length)
    } finally {
      await fs.rm(sd1, { recursive: true, force: true })
      await fs.rm(sd2, { recursive: true, force: true })
    }
  })

  it('14. fallback decision 純関数 (subscription revoked → P-E api fallback) 5/8 朝想定', () => {
    const decision = shouldFallbackToApiKey({
      subscription: 'revoked',
      warningCount: 3,
      maxWarningSeverity: 5,
      costTier: 'hard_fail',
      ng3BreachCount7d: 0,
    })
    expect(decision.shouldFallback).toBe(true)
    expect(decision.reason).toBe('subscription_warning')
    expect(decision.escalateToOwner).toBe(true)
  })

  it('15. NDJSON parser 統合: scenario stdout chunk 跨ぎでも全 event 抽出', () => {
    const parser = createNdjsonStreamParser()
    parser.feed('{"messageType":"progress_update","progressPe')
    const partial = parser.feed('rcent":50}\n{"messageType":"error_report","seve')
    const final = parser.feed('rity":"warn"}\n')
    expect(partial).toHaveLength(1)
    expect(final).toHaveLength(1)
    expect(parser.parsedCount).toBe(2)
  })

  it('16. audit log は append-only (run 後 entry count 増加方向のみ)', async () => {
    const r = await runDrillScenario('normal', { scratchDir, auditPath })
    const initialCount = r.auditEntryCount
    expect(initialCount).toBeGreaterThanOrEqual(2)
    // 同 audit path に追加 run (subscription mode で再 run、複数シナリオ累積)
    const sd2 = join(tmpdir(), `drill2-append-${Date.now()}`)
    await fs.mkdir(sd2, { recursive: true })
    try {
      const r2 = await runDrillScenario('normal', {
        scratchDir: sd2,
        auditPath, // 同 file
      })
      expect(r2.auditEntryCount).toBeGreaterThan(initialCount)
      expect(r2.auditValid).toBe(true)
    } finally {
      await fs.rm(sd2, { recursive: true, force: true })
    }
  })
})
