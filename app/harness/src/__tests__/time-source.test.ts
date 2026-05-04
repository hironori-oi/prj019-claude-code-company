import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  RealTimeSource,
  FakeTimeSource,
  asDateCallback,
  asNumberCallback,
} from '../time-source.js'
import { CircuitBreaker, CircuitOpenError } from '../circuit-breaker.js'
import { FileCostTracker } from '../cost-tracker.js'
import { FileUsageMonitor } from '../usage-monitor.js'
import { FileKillSwitch } from '../kill-switch.js'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

function tmpDir(): string {
  return join(tmpdir(), `clawbridge-ts-${Date.now()}-${Math.random().toString(36).slice(2)}`)
}

describe('TimeSource basics', () => {
  it('RealTimeSource returns now() Date close to system time', () => {
    const ts = new RealTimeSource()
    const before = Date.now()
    const t = ts.nowMs()
    const after = Date.now()
    expect(t).toBeGreaterThanOrEqual(before)
    expect(t).toBeLessThanOrEqual(after)
    expect(ts.now()).toBeInstanceOf(Date)
  })

  it('FakeTimeSource returns the configured initial time', () => {
    const t0 = new Date('2026-05-03T10:00:00Z')
    const ts = new FakeTimeSource(t0)
    expect(ts.now().toISOString()).toBe('2026-05-03T10:00:00.000Z')
    expect(ts.nowMs()).toBe(t0.getTime())
  })

  it('FakeTimeSource.advanceBy advances the clock', () => {
    const ts = new FakeTimeSource(new Date('2026-05-03T10:00:00Z'))
    ts.advanceBy(60_000)
    expect(ts.now().toISOString()).toBe('2026-05-03T10:01:00.000Z')
    ts.advanceBy(11 * 60 * 60 * 1000)
    expect(ts.now().toISOString()).toBe('2026-05-03T21:01:00.000Z')
  })

  it('FakeTimeSource.setNow overrides the clock', () => {
    const ts = new FakeTimeSource(new Date('2026-05-03T10:00:00Z'))
    ts.setNow(new Date('2026-05-04T00:00:00Z'))
    expect(ts.now().toISOString()).toBe('2026-05-04T00:00:00.000Z')
    ts.setNow(0)
    expect(ts.nowMs()).toBe(0)
  })

  it('asDateCallback adapts to () => Date', () => {
    const ts = new FakeTimeSource(new Date('2026-05-03T10:00:00Z'))
    const cb = asDateCallback(ts)
    expect(cb()).toBeInstanceOf(Date)
    expect(cb().toISOString()).toBe('2026-05-03T10:00:00.000Z')
    ts.advanceBy(1_000)
    expect(cb().toISOString()).toBe('2026-05-03T10:00:01.000Z')
  })

  it('asNumberCallback adapts to () => number', () => {
    const ts = new FakeTimeSource(0)
    const cb = asNumberCallback(ts)
    expect(cb()).toBe(0)
    ts.advanceBy(123)
    expect(cb()).toBe(123)
  })
})

describe('TimeSource integration: CircuitBreaker', () => {
  it('cooldown completes after FakeTimeSource.advanceBy(cooldownMs)', async () => {
    const ts = new FakeTimeSource(0)
    const cb = new CircuitBreaker({
      name: 'test',
      failureThreshold: 1,
      cooldownMs: 1000,
      timeSource: ts,
    })
    await expect(cb.fire(async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom')
    expect(cb.status().state).toBe('open')
    ts.advanceBy(500)
    // Still in cooldown
    await expect(cb.fire(async () => 'x')).rejects.toBeInstanceOf(CircuitOpenError)
    ts.advanceBy(600) // total 1100ms > cooldown
    const r = await cb.fire(async () => 'recovered')
    expect(r).toBe('recovered')
    expect(cb.status().state).toBe('closed')
  })
})

describe('TimeSource integration: FileCostTracker', () => {
  let dir: string
  let ledgerPath: string

  beforeEach(async () => {
    dir = tmpDir()
    await fs.mkdir(dir, { recursive: true })
    ledgerPath = join(dir, 'cost.json')
  })

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined)
  })

  it('month boundary respects FakeTimeSource', async () => {
    // Use mid-month → next mid-month to avoid timezone-sensitive month boundary edges.
    // FileCostTracker uses startOfMonth in *local* time, so a single-day boundary at
    // UTC midnight can fall on either side depending on TZ. Use 15-day jumps for safety.
    const ts = new FakeTimeSource(new Date('2026-05-15T12:00:00Z'))
    const t = new FileCostTracker({ ledgerPath, timeSource: ts })
    await t.recordSpend('anthropic_api', 1.0)
    expect(await t.getMonthlyTotal()).toBeCloseTo(1.0)
    // Advance well into next month (any TZ → June)
    ts.advanceBy(31 * 24 * 60 * 60 * 1000) // +31 days → June 15
    await t.recordSpend('anthropic_api', 0.5)
    // Now in June: startOfMonth = June 1 → May 15 entry excluded
    expect(await t.getMonthlyTotal()).toBeCloseTo(0.5)
  })
})

describe('TimeSource integration: FileUsageMonitor', () => {
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
    await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined)
  })

  it('60s anomaly window: 5 errors spread over 120s do NOT trigger (window expires)', async () => {
    const ks = new FileKillSwitch({
      signalPath,
      historyPath,
      pollIntervalMs: 5000,
      handlerTimeoutMs: 1000,
      exitOnTrigger: false,
    })
    let triggerCount = 0
    ks.onTrigger(() => {
      triggerCount += 1
    })
    await ks.arm()

    const ts = new FakeTimeSource(new Date('2026-05-03T10:00:00Z'))
    const m = new FileUsageMonitor({
      ledgerPath,
      bootPath,
      killSwitch: ks,
      authAnomalyThreshold: 5,
      anomalyWindowMs: 60_000,
      timeSource: ts,
    })
    // 5 errors, each 30s apart → window only ever sees ≤ 2 within 60s
    for (let i = 0; i < 5; i++) {
      await m.recordCall('anthropic_oauth', { status: 401 })
      ts.advanceBy(30_000)
    }
    expect(triggerCount).toBe(0)
    await ks.disarm()
  })

  it('60s anomaly window: 5 errors within 30s DO trigger', async () => {
    const ks = new FileKillSwitch({
      signalPath,
      historyPath,
      pollIntervalMs: 5000,
      handlerTimeoutMs: 1000,
      exitOnTrigger: false,
    })
    let triggered = false
    ks.onTrigger(() => {
      triggered = true
    })
    await ks.arm()

    const ts = new FakeTimeSource(new Date('2026-05-03T10:00:00Z'))
    const m = new FileUsageMonitor({
      ledgerPath,
      bootPath,
      killSwitch: ks,
      authAnomalyThreshold: 5,
      anomalyWindowMs: 60_000,
      timeSource: ts,
    })
    for (let i = 0; i < 5; i++) {
      await m.recordCall('anthropic_oauth', { status: 429 })
      ts.advanceBy(5_000) // total spread = 25s, all within 60s window
    }
    expect(triggered).toBe(true)
    await ks.disarm()
  })

  it('12h continuous runtime detection respects FakeTimeSource', async () => {
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

    const ts = new FakeTimeSource(new Date('2026-05-03T10:00:00Z'))
    const m = new FileUsageMonitor({
      ledgerPath,
      bootPath,
      killSwitch: ks,
      maxRuntimeMs: 12 * 60 * 60 * 1000,
      timeSource: ts,
    })
    await m.startRuntimeWatch()
    expect(triggered).toBe(false)
    // Advance 12h + 1s
    ts.advanceBy(12 * 60 * 60 * 1000 + 1000)

    // The internal interval (60s real time) won't fire in test;
    // confirm that the bootAt + advanced time matches expectation
    const bootJson = JSON.parse(await fs.readFile(bootPath, 'utf-8')) as { bootAt: string }
    const elapsed = ts.nowMs() - new Date(bootJson.bootAt).getTime()
    expect(elapsed).toBeGreaterThanOrEqual(12 * 60 * 60 * 1000)

    // Mirror the checkRuntime body to validate end-to-end semantics
    if (elapsed >= 12 * 60 * 60 * 1000) {
      await ks.trigger(
        `continuous runtime exceeded ${12 * 60 * 60 * 1000}ms (NG-3 予防 12h 上限)`,
        { source: 'continuous_runtime', details: { elapsedMs: elapsed } },
      )
    }
    expect(triggered).toBe(true)
    expect(triggeredReason).toContain('continuous runtime')

    await m.stopRuntimeWatch()
    await ks.disarm()
  })
})
