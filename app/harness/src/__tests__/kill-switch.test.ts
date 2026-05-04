import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FileKillSwitch } from '../kill-switch.js'

function tmpDir(): string {
  return join(tmpdir(), `clawbridge-kill-${Date.now()}-${Math.random().toString(36).slice(2)}`)
}

describe('FileKillSwitch', () => {
  let dir: string
  let signalPath: string
  let historyPath: string
  let ks: FileKillSwitch

  beforeEach(async () => {
    dir = tmpDir()
    await fs.mkdir(dir, { recursive: true })
    signalPath = join(dir, 'STOP')
    historyPath = join(dir, 'kill-history.json')
    ks = new FileKillSwitch({
      signalPath,
      historyPath,
      pollIntervalMs: 100,
      handlerTimeoutMs: 1000,
      exitOnTrigger: false,
    })
  })

  afterEach(async () => {
    await ks.disarm()
    try {
      await fs.rm(dir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  })

  it('arm and disarm', async () => {
    expect(ks.isArmed()).toBe(false)
    await ks.arm()
    expect(ks.isArmed()).toBe(true)
    await ks.disarm()
    expect(ks.isArmed()).toBe(false)
  })

  it('trigger calls onTrigger handlers in order', async () => {
    const order: string[] = []
    ks.onTrigger(async () => {
      order.push('h1')
    })
    ks.onTrigger(async () => {
      order.push('h2')
    })
    await ks.arm()
    await ks.trigger('test reason', { source: 'manual' })
    expect(order).toEqual(['h1', 'h2'])
    expect(ks.isTriggered()).toBe(true)
  })

  it('trigger is idempotent', async () => {
    let count = 0
    ks.onTrigger(() => {
      count += 1
    })
    await ks.arm()
    await ks.trigger('first', { source: 'manual' })
    await ks.trigger('second', { source: 'manual' })
    expect(count).toBe(1)
  })

  it('handler timeout does not block other handlers', async () => {
    const ks2 = new FileKillSwitch({
      signalPath,
      historyPath,
      handlerTimeoutMs: 50,
      exitOnTrigger: false,
    })
    let secondCalled = false
    ks2.onTrigger(async () => {
      await new Promise((r) => setTimeout(r, 1000)) // 1s, exceeds 50ms
    })
    ks2.onTrigger(() => {
      secondCalled = true
    })
    await ks2.arm()
    await ks2.trigger('test', { source: 'manual' })
    expect(secondCalled).toBe(true)
    await ks2.disarm()
  })

  it('detects STOP signal file via polling', async () => {
    let triggered = false
    ks.onTrigger(() => {
      triggered = true
    })
    await ks.arm()
    // Touch STOP file
    await fs.writeFile(signalPath, '')
    // Wait for polling
    await new Promise((r) => setTimeout(r, 300))
    expect(triggered).toBe(true)
    expect(ks.isTriggered()).toBe(true)
  })

  it('startup with existing STOP file triggers immediately', async () => {
    await fs.writeFile(signalPath, '')
    let triggered = false
    ks.onTrigger(() => {
      triggered = true
    })
    await ks.arm()
    // Give the await a moment
    await new Promise((r) => setTimeout(r, 50))
    expect(triggered).toBe(true)
  })

  it('writes kill history record on trigger', async () => {
    await ks.arm()
    await ks.trigger('history test', { source: 'budget', details: { foo: 'bar' } })
    const content = await fs.readFile(historyPath, 'utf-8')
    const parsed = JSON.parse(content) as { records: Array<{ reason: string }> }
    expect(parsed.records).toHaveLength(1)
    expect(parsed.records[0]?.reason).toBe('history test')
  })

  it('clearSignal removes STOP file and resets triggered', async () => {
    await ks.arm()
    await fs.writeFile(signalPath, '')
    await ks.trigger('test', { source: 'file_signal' })
    await ks.clearSignal()
    expect(ks.isTriggered()).toBe(false)
    await expect(fs.access(signalPath)).rejects.toThrow()
  })
})
