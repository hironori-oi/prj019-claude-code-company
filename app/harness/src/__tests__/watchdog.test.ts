/**
 * watchdog.test — Round 6 W0-Week2 4 日前倒し:
 *   G-04 (cost watchdog 3 段階閾値) のテスト。
 *
 * 関連:
 *   - G-V2-09 (Boris Cherny 線 $1,000 自主上限の前段)
 *   - 議決-25 採択前提 Phase 1 W1 ハードガード前倒し
 *
 * カバー範囲:
 *   1. computeWatchdogThresholds: $30 day cap → ($24, $28.5, $30) を返す
 *   2. classifyWatchdogTier: 各境界での tier 判定
 *   3. checkWatchdog: cost-tracker と連携して warn / auto_stop / hard_fail を発火
 *   4. Slack #monitor 通知 hook が tier ごとに 1 回呼ばれる (冪等性)
 *   5. hard_fail 時に kill-switch.trigger が呼ばれる
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  classifyWatchdogTier,
  computeWatchdogThresholds,
  DEFAULT_LIMITS,
  FileCostTracker,
  FileKillSwitch,
  FileUsageMonitor,
  type SlackMonitorNotify,
  type WatchdogTier,
} from '../index.js'

function tmpDir(): string {
  return join(tmpdir(), `clawbridge-watchdog-${Date.now()}-${Math.random().toString(36).slice(2)}`)
}

describe('computeWatchdogThresholds (G-04 純関数)', () => {
  it('default $30 day cap で $24 / $28.5 / $30 を返す', () => {
    const t = computeWatchdogThresholds()
    expect(t).toHaveLength(3)
    const warn = t.find((x) => x.tier === 'warn')
    const autoStop = t.find((x) => x.tier === 'auto_stop')
    const hardFail = t.find((x) => x.tier === 'hard_fail')
    expect(warn?.thresholdUsd).toBeCloseTo(24)
    expect(autoStop?.thresholdUsd).toBeCloseTo(28.5)
    expect(hardFail?.thresholdUsd).toBeCloseTo(30)
  })

  it('limits.perDayUsd を変更すると比率に応じて自動追従する', () => {
    const t = computeWatchdogThresholds({ ...DEFAULT_LIMITS, perDayUsd: 100 })
    const warn = t.find((x) => x.tier === 'warn')
    const hardFail = t.find((x) => x.tier === 'hard_fail')
    expect(warn?.thresholdUsd).toBeCloseTo(80)
    expect(hardFail?.thresholdUsd).toBeCloseTo(100)
  })
})

describe('classifyWatchdogTier (G-04 純関数)', () => {
  const thresholds = computeWatchdogThresholds()

  it('閾値未満は null を返す', () => {
    expect(classifyWatchdogTier(0, thresholds)).toBeNull()
    expect(classifyWatchdogTier(23.99, thresholds)).toBeNull()
  })

  it('warn 境界を返す', () => {
    expect(classifyWatchdogTier(24, thresholds)).toBe('warn')
    expect(classifyWatchdogTier(28.4, thresholds)).toBe('warn')
  })

  it('auto_stop 境界を返す', () => {
    expect(classifyWatchdogTier(28.5, thresholds)).toBe('auto_stop')
    expect(classifyWatchdogTier(29.99, thresholds)).toBe('auto_stop')
  })

  it('hard_fail 境界を返す ($30 以上)', () => {
    expect(classifyWatchdogTier(30, thresholds)).toBe('hard_fail')
    expect(classifyWatchdogTier(100, thresholds)).toBe('hard_fail')
  })
})

describe('FileUsageMonitor cost watchdog (G-04 統合)', () => {
  let dir: string
  let ledgerPath: string
  let bootPath: string
  let signalPath: string
  let historyPath: string
  let costLedgerPath: string

  beforeEach(async () => {
    dir = tmpDir()
    await fs.mkdir(dir, { recursive: true })
    ledgerPath = join(dir, 'usage.json')
    bootPath = join(dir, 'boot.json')
    signalPath = join(dir, 'STOP')
    historyPath = join(dir, 'kill-history.json')
    costLedgerPath = join(dir, 'cost.json')
  })

  afterEach(async () => {
    try {
      await fs.rm(dir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  })

  it('warn tier: Slack #monitor に 1 回通知される (kill しない)', async () => {
    const cost = new FileCostTracker({ ledgerPath: costLedgerPath })
    await cost.recordSpend('anthropic_api', 24.5)

    const calls: WatchdogTier[] = []
    const notify: SlackMonitorNotify = async (p) => {
      calls.push(p.tier)
    }

    const ks = new FileKillSwitch({
      signalPath,
      historyPath,
      pollIntervalMs: 5000,
      handlerTimeoutMs: 1000,
      exitOnTrigger: false,
    })
    const m = new FileUsageMonitor({
      ledgerPath,
      bootPath,
      killSwitch: ks,
      costTracker: cost,
      notifySlackMonitor: notify,
    })

    const tier = await m.checkWatchdog()
    expect(tier).toBe('warn')
    expect(calls).toEqual(['warn'])
    expect(m.getWatchdogState().autoStopped).toBe(false)
    expect(ks.isTriggered()).toBe(false)
  })

  it('auto_stop tier: autoStopped フラグが立つが kill はしない', async () => {
    const cost = new FileCostTracker({ ledgerPath: costLedgerPath })
    await cost.recordSpend('anthropic_api', 28.7)

    const calls: WatchdogTier[] = []
    const notify: SlackMonitorNotify = async (p) => {
      calls.push(p.tier)
    }

    const ks = new FileKillSwitch({
      signalPath,
      historyPath,
      pollIntervalMs: 5000,
      handlerTimeoutMs: 1000,
      exitOnTrigger: false,
    })
    const m = new FileUsageMonitor({
      ledgerPath,
      bootPath,
      killSwitch: ks,
      costTracker: cost,
      notifySlackMonitor: notify,
    })

    const tier = await m.checkWatchdog()
    expect(tier).toBe('auto_stop')
    expect(calls).toEqual(['auto_stop'])
    expect(m.getWatchdogState().autoStopped).toBe(true)
    expect(ks.isTriggered()).toBe(false)
  })

  it('hard_fail tier: kill-switch がトリガーされる', async () => {
    const cost = new FileCostTracker({ ledgerPath: costLedgerPath })
    await cost.recordSpend('anthropic_api', 35.0)

    const calls: WatchdogTier[] = []
    const notify: SlackMonitorNotify = async (p) => {
      calls.push(p.tier)
    }

    const ks = new FileKillSwitch({
      signalPath,
      historyPath,
      pollIntervalMs: 5000,
      handlerTimeoutMs: 1000,
      exitOnTrigger: false,
    })
    let killReason = ''
    ks.onTrigger((reason) => {
      killReason = reason
    })
    await ks.arm()

    const m = new FileUsageMonitor({
      ledgerPath,
      bootPath,
      killSwitch: ks,
      costTracker: cost,
      notifySlackMonitor: notify,
    })

    const tier = await m.checkWatchdog()
    expect(tier).toBe('hard_fail')
    expect(calls).toEqual(['hard_fail'])
    expect(ks.isTriggered()).toBe(true)
    expect(killReason).toContain('hard_fail')
    await ks.disarm()
  })

  it('同一 tier 連続呼び出しでは Slack 重複通知なし (冪等)', async () => {
    const cost = new FileCostTracker({ ledgerPath: costLedgerPath })
    await cost.recordSpend('anthropic_api', 25.0)

    const calls: WatchdogTier[] = []
    const notify: SlackMonitorNotify = async (p) => {
      calls.push(p.tier)
    }

    const m = new FileUsageMonitor({
      ledgerPath,
      bootPath,
      costTracker: cost,
      notifySlackMonitor: notify,
    })

    await m.checkWatchdog()
    await m.checkWatchdog()
    await m.checkWatchdog()
    expect(calls).toEqual(['warn'])
  })

  it('warn → auto_stop → hard_fail の段階昇格で各 tier 1 回ずつ通知', async () => {
    const cost = new FileCostTracker({ ledgerPath: costLedgerPath })

    const calls: WatchdogTier[] = []
    const notify: SlackMonitorNotify = async (p) => {
      calls.push(p.tier)
    }

    const ks = new FileKillSwitch({
      signalPath,
      historyPath,
      pollIntervalMs: 5000,
      handlerTimeoutMs: 1000,
      exitOnTrigger: false,
    })
    await ks.arm()

    const m = new FileUsageMonitor({
      ledgerPath,
      bootPath,
      killSwitch: ks,
      costTracker: cost,
      notifySlackMonitor: notify,
    })

    // warn 段階
    await cost.recordSpend('anthropic_api', 24.5)
    expect(await m.checkWatchdog()).toBe('warn')

    // auto_stop 段階に進める (24.5 + 4.5 = 29.0)
    await cost.recordSpend('anthropic_api', 4.5)
    expect(await m.checkWatchdog()).toBe('auto_stop')

    // hard_fail 段階に進める (29.0 + 2 = 31.0)
    await cost.recordSpend('anthropic_api', 2)
    expect(await m.checkWatchdog()).toBe('hard_fail')

    expect(calls).toEqual(['warn', 'auto_stop', 'hard_fail'])
    expect(ks.isTriggered()).toBe(true)
    await ks.disarm()
  })

  it('cost-tracker 未注入の場合は no-op (null を返す)', async () => {
    const m = new FileUsageMonitor({ ledgerPath, bootPath })
    expect(await m.checkWatchdog()).toBeNull()
    expect(m.getWatchdogState().lastTier).toBeNull()
  })

  it('watchIntervalMs が injectable で短縮できる (時間短縮)', async () => {
    const m = new FileUsageMonitor({
      ledgerPath,
      bootPath,
      watchIntervalMs: 50, // 50ms — テスト用最短
    })
    await m.startRuntimeWatch()
    // 50ms interval が動作すれば即停止しても残骸ハンドルが残らない
    await new Promise((r) => setTimeout(r, 60))
    await m.stopRuntimeWatch()
    // bootPath が書かれていれば成功
    const content = await fs.readFile(bootPath, 'utf-8')
    expect(content.length).toBeGreaterThan(0)
  })
})
