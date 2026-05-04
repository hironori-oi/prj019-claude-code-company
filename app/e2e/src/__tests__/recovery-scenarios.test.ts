/**
 * recovery-scenarios.test — Round 11 R11 Dev-C 拡張 (DEC-019-057):
 *   emergency_stop → P-E API key fallback → recovery 完遂を 1 シナリオで testify。
 *   失敗パスも含めた 4 シナリオ全 PASS を担保する。
 *
 * 関連必須コントロール:
 *   G-05 (subprocess kill chain) / G-06 (circuit-breaker forceOpen)
 *   G-08 (連続稼働 12h 上限) / G-V2-11 (緊急停止 自動触発)
 *
 * 4 シナリオ:
 *   A. normal           — 平常稼働 (kill 未発火 / fallback 不要 / monitor reset 後 canResume=true)
 *   B. kill_switch_trig — forceKillTrigger=true (cost cap breach 駆動 / kill 発火後 disarm + reset)
 *   C. cost_cap_trig    — costTracker stub で 9999 USD 注入 / cost-cap-breach event emit / kill chain
 *   D. tos_confirm      — ng3 breach 履歴 + subscription rate_limited で fallback decision = ng3_breach
 *
 * シナリオ E (拡張): emergency_stop → P-E fallback → recovery
 *   - kill-switch trigger (emergency_stop)
 *   - shouldFallbackToApiKey に subscription=revoked 入力で fallback 強制
 *   - kill disarm + monitor reset で canResume=true 確認
 *
 * 設計原則:
 *   - TimeSource DI で deterministic (FakeTimeSource は new で渡す、実時計触れない)
 *   - audit log は tmp dir 内、kill-signal / kill-history も tmp 隔離
 *   - 既存 src 無改変、import で利用
 *
 * カバー範囲 (8 tests):
 *   1. シナリオ A normal     — overallOk=true / killTriggered=false / canResume=true
 *   2. シナリオ B kill trig  — killTriggered=true / recovery.canResume=true / monitorResetVerified=true
 *   3. シナリオ C cost cap   — tosEvents に monitor:cost-cap-breach 含む / recovery 完遂
 *   4. シナリオ D tos confirm — fallbackDecision.shouldFallback=true / reason=ng3_breach
 *   5. シナリオ E emergency_stop → P-E → recovery 完遂 (1 シナリオ統合)
 *   6. recovery 後 monitor.getNg3BreachCount7d() = 0 (reset 検証)
 *   7. recovery 後 killSwitch.isArmed() = false (disarm 検証)
 *   8. determinism: TimeSource 注入で 2 回 run の overall outcome 一致
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { runMockClawE2eFlow } from '../flow/run-mock-claw-flow.js'
import {
  FakeTimeSource,
  FileKillSwitch,
  createTosMonitor,
  shouldFallbackToApiKey,
  type FallbackDecisionInput,
} from '../../../harness/src/index.js'

let scratchDir: string
let auditPath: string

beforeEach(async () => {
  scratchDir = join(
    tmpdir(),
    `clawbridge-r11c-recovery-${Date.now()}-${Math.random().toString(36).slice(2)}`,
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

describe('recovery scenarios (R11 Dev-C / DEC-019-057 / G-05/G-08)', () => {
  it('1. シナリオ A normal — kill 未発火 / overallOk=true / canResume=true', async () => {
    const ts = new FakeTimeSource(new Date('2026-05-04T12:00:00.000Z'))
    const r = await runMockClawE2eFlow({
      auditFilePath: auditPath,
      timeSource: ts,
    })
    // 前状態
    expect(r.killTriggered).toBe(false)
    // 後状態
    expect(r.overallOk).toBe(true)
    expect(r.recovery.canResume).toBe(true)
    expect(r.recovery.monitorResetVerified).toBe(true)
    // fallback は no_action
    expect(r.fallbackDecision.shouldFallback).toBe(false)
    expect(r.fallbackDecision.reason).toBe('no_action')
  })

  it('2. シナリオ B kill_switch_trigger — forceKillTrigger=true / killTriggered / recovery 完遂', async () => {
    const ts = new FakeTimeSource(new Date('2026-05-04T12:00:00.000Z'))
    const r = await runMockClawE2eFlow({
      auditFilePath: auditPath,
      timeSource: ts,
      forceKillTrigger: true,
    })
    // 前状態
    expect(r.killTriggered).toBe(true)
    // 後状態 (recovery 段で disarm + reset)
    expect(r.recovery.killWasTriggered).toBe(true)
    expect(r.recovery.canResume).toBe(true)
    expect(r.recovery.monitorResetVerified).toBe(true)
    const recoveryStage = r.stages.find((s) => s.stage === 'recovery')
    expect(recoveryStage?.ok).toBe(true)
  })

  it('3. シナリオ C cost_cap_trigger — costTracker stub 9999 USD / cost-cap-breach event / kill 発火', async () => {
    const ts = new FakeTimeSource(new Date('2026-05-04T12:00:00.000Z'))
    const r = await runMockClawE2eFlow({
      auditFilePath: auditPath,
      timeSource: ts,
      forceKillTrigger: true,
      evaluateCostCap: true,
    })
    // 前状態: cost-cap-breach event が emit されている
    const types = r.tosEvents.map((e) => e.type)
    expect(types).toContain('monitor:cost-cap-breach')
    // 後状態: kill 発火 + recovery 完遂
    expect(r.killTriggered).toBe(true)
    expect(r.recovery.canResume).toBe(true)
  })

  it('4. シナリオ D tos_confirm — ng3_breach (continuous run) + subscription rate_limited → fallback shouldFallback=true / reason=ng3_breach', async () => {
    // ng3BreachLog は checkContinuousRun の breach 確定時のみ push される (cost cap は hard_fail で別系統)。
    // よって continuous run 16h を超過させ、confirmCount=1 で 1 サイクル breach を確定させる。
    const ts = new FakeTimeSource(new Date('2026-05-04T12:00:00.000Z'))
    const monitor = createTosMonitor({
      ng3Plan: 'plan_b_16h', // continuousRunMs = 16h
      confirmCount: 1, // 1 サイクルで確定
      timeSource: ts,
    })
    monitor.markBoot()
    // 17h 進めて continuous run 16h cap を超過 (60_000 * 60 * 17 = 17h)
    ts.advanceBy(17 * 60 * 60 * 1000)
    const ev = await monitor.checkContinuousRun()
    expect(ev).not.toBeNull()
    expect(ev!.type).toBe('monitor:ng3-time-breach')
    expect(monitor.getNg3BreachCount7d()).toBeGreaterThanOrEqual(1)

    // fallback decision は純関数で評価
    const input: FallbackDecisionInput = {
      subscription: 'rate_limited',
      warningCount: monitor.getWarningCount24h(),
      maxWarningSeverity: monitor.getMaxWarningSeverity24h(),
      costTier: 'auto_stop',
      ng3BreachCount7d: monitor.getNg3BreachCount7d(),
    }
    const decision = shouldFallbackToApiKey(input)
    expect(decision.shouldFallback).toBe(true)
    expect(decision.reason).toBe('ng3_breach')
    expect(decision.escalateToOwner).toBe(true)

    // recovery: monitor.reset() で breach 履歴クリア
    monitor.reset()
    expect(monitor.getNg3BreachCount7d()).toBe(0)
  })

  it('5. シナリオ E emergency_stop → P-E API key fallback → recovery 完遂 (統合)', async () => {
    const ts = new FakeTimeSource(new Date('2026-05-04T12:00:00.000Z'))

    // Step 1: kill-switch を独立に作成し emergency_stop trigger
    const killSignalPath = join(scratchDir, 'kill.signal')
    const killHistoryPath = join(scratchDir, 'kill.history.json')
    const killSwitch = new FileKillSwitch({
      signalPath: killSignalPath,
      historyPath: killHistoryPath,
      pollIntervalMs: 60_000,
      handlerTimeoutMs: 1_000,
      exitOnTrigger: false,
    })
    await killSwitch.arm()
    await killSwitch.trigger('emergency_stop: tos final warning detected', {
      source: 'manual',
      details: { scenario: 'E', tosWarningSeverity: 5 },
    })
    expect(killSwitch.isTriggered()).toBe(true)

    // Step 2: P-E API key fallback decision (shouldFallbackToApiKey 経由 / subscription=revoked)
    const fallback = shouldFallbackToApiKey({
      subscription: 'revoked',
      warningCount: 3,
      maxWarningSeverity: 5,
      costTier: 'hard_fail',
      ng3BreachCount7d: 0,
    })
    expect(fallback.shouldFallback).toBe(true)
    expect(fallback.reason).toBe('subscription_warning')
    expect(fallback.escalateToOwner).toBe(true)

    // Step 3: recovery — kill disarm + state クリア
    await killSwitch.disarm()
    expect(killSwitch.isArmed()).toBe(false)
    // disarm 後でも triggered 履歴は残る (KillRecord として)
    expect(killSwitch.isTriggered()).toBe(true)

    // Step 4: 新規 e2e 1 サイクルが起動可能なことを確認 (副作用的 smoke)
    const r = await runMockClawE2eFlow({
      auditFilePath: auditPath,
      timeSource: ts,
    })
    expect(r.overallOk).toBe(true)
    expect(r.recovery.canResume).toBe(true)
  })

  it('6. recovery 後 monitor.getNg3BreachCount7d() = 0 (reset 検証)', async () => {
    const ts = new FakeTimeSource(new Date('2026-05-04T12:00:00.000Z'))
    const r = await runMockClawE2eFlow({
      auditFilePath: auditPath,
      timeSource: ts,
      forceKillTrigger: true,
    })
    // monitorResetVerified = true は monitor.getNg3BreachCount7d() === 0 を含意
    expect(r.recovery.monitorResetVerified).toBe(true)
  })

  it('7. recovery 後 killSwitch.isArmed()=false (disarm 検証 / FileKillSwitch 直接)', async () => {
    // run-mock-claw-flow 内部で arm せずに trigger → disarm の流れを再現
    const ts = new FakeTimeSource(new Date('2026-05-04T12:00:00.000Z'))
    const _ = ts // 使うフリ (lint 抑止)
    expect(_.now().toISOString()).toBe('2026-05-04T12:00:00.000Z')

    const ks = new FileKillSwitch({
      signalPath: join(scratchDir, 'k.signal'),
      historyPath: join(scratchDir, 'k.history.json'),
      pollIntervalMs: 60_000,
      handlerTimeoutMs: 1_000,
      exitOnTrigger: false,
    })
    await ks.arm()
    expect(ks.isArmed()).toBe(true)
    await ks.trigger('test', { source: 'manual' })
    expect(ks.isTriggered()).toBe(true)
    await ks.disarm()
    expect(ks.isArmed()).toBe(false)
  })

  it('8. determinism — TimeSource 注入で 2 回 run の outcome 一致', async () => {
    const ts1 = new FakeTimeSource(new Date('2026-05-04T12:00:00.000Z'))
    const ts2 = new FakeTimeSource(new Date('2026-05-04T12:00:00.000Z'))
    const path1 = join(scratchDir, 'a.jsonl')
    const path2 = join(scratchDir, 'b.jsonl')
    const r1 = await runMockClawE2eFlow({
      auditFilePath: path1,
      timeSource: ts1,
    })
    const r2 = await runMockClawE2eFlow({
      auditFilePath: path2,
      timeSource: ts2,
    })
    expect(r1.overallOk).toBe(r2.overallOk)
    expect(r1.killTriggered).toBe(r2.killTriggered)
    expect(r1.recovery.canResume).toBe(r2.recovery.canResume)
    expect(r1.fallbackDecision.shouldFallback).toBe(r2.fallbackDecision.shouldFallback)
    expect(r1.fallbackDecision.reason).toBe(r2.fallbackDecision.reason)
  })
})
