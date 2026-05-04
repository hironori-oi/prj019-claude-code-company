import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FileUsageMonitor } from '../usage-monitor.js'
import { FileKillSwitch } from '../kill-switch.js'

function tmpDir(): string {
  return join(tmpdir(), `clawbridge-usage-${Date.now()}-${Math.random().toString(36).slice(2)}`)
}

describe('FileUsageMonitor', () => {
  let dir: string
  let ledgerPath: string
  let bootPath: string
  let signalPath: string
  let historyPath: string

  beforeEach(async () => {
    dir = tmpDir()
    await fs.mkdir(dir, { recursive: true })
    ledgerPath = join(dir, 'usage.json')
    bootPath = join(dir, 'boot.json')
    signalPath = join(dir, 'STOP')
    historyPath = join(dir, 'kill-history.json')
  })

  afterEach(async () => {
    try {
      await fs.rm(dir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  })

  it('records call and returns daily aggregate', async () => {
    const m = new FileUsageMonitor({ ledgerPath, bootPath })
    await m.recordCall('anthropic_oauth', { status: 200, tokens: 100, costUsd: 0.01 })
    await m.recordCall('anthropic_oauth', { status: 200, tokens: 200, costUsd: 0.02 })
    const agg = await m.getDailyAggregate('anthropic_oauth')
    expect(agg.count).toBe(2)
    expect(agg.tokens).toBe(300)
    expect(agg.costUsd).toBeCloseTo(0.03)
  })

  it('aggregates errors into 4xx/5xx/auth/rate buckets', async () => {
    const m = new FileUsageMonitor({ ledgerPath, bootPath })
    await m.recordCall('anthropic_api', { status: 401 })
    await m.recordCall('anthropic_api', { status: 403 })
    await m.recordCall('anthropic_api', { status: 429 })
    await m.recordCall('anthropic_api', { status: 500 })
    const agg = await m.getDailyAggregate()
    expect(agg.authErrors).toBe(2)
    expect(agg.rateErrors).toBe(1)
    expect(agg.errors4xx).toBe(3)
    expect(agg.errors5xx).toBe(1)
  })

  it('triggers kill-switch on consecutive 401/403/429', async () => {
    const ks = new FileKillSwitch({
      signalPath,
      historyPath,
      pollIntervalMs: 5000,
      handlerTimeoutMs: 1000,
      exitOnTrigger: false,
    })
    let triggered = false
    let triggeredReason = ''
    ks.onTrigger((reason) => {
      triggered = true
      triggeredReason = reason
    })
    await ks.arm()

    const m = new FileUsageMonitor({
      ledgerPath,
      bootPath,
      killSwitch: ks,
      authAnomalyThreshold: 3,
      anomalyWindowMs: 60_000,
    })
    await m.recordCall('anthropic_oauth', { status: 401 })
    await m.recordCall('anthropic_oauth', { status: 403 })
    expect(triggered).toBe(false)
    await m.recordCall('anthropic_oauth', { status: 429 })
    expect(triggered).toBe(true)
    expect(triggeredReason).toContain('anomaly')
    await ks.disarm()
  })

  it('rolling aggregate respects window', async () => {
    let now = new Date('2026-05-03T10:00:00Z')
    const m = new FileUsageMonitor({
      ledgerPath,
      bootPath,
      now: () => now,
    })
    await m.recordCall('anthropic_api', { status: 200, tokens: 100 })
    now = new Date('2026-05-03T11:00:00Z')
    await m.recordCall('anthropic_api', { status: 200, tokens: 200 })
    now = new Date('2026-05-03T12:00:00Z')
    // 1h window only counts the second
    const agg = await m.getRollingAggregate(60 * 60 * 1000, 'anthropic_api')
    expect(agg.tokens).toBe(200)
  })

  it('startRuntimeWatch records boot time', async () => {
    const m = new FileUsageMonitor({ ledgerPath, bootPath })
    await m.startRuntimeWatch()
    const content = await fs.readFile(bootPath, 'utf-8')
    const parsed = JSON.parse(content) as { bootAt?: string }
    expect(parsed.bootAt).toBeDefined()
    await m.stopRuntimeWatch()
  })
})
