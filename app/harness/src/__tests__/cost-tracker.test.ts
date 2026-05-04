import { describe, it, expect, beforeEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FileCostTracker, DEFAULT_LIMITS } from '../cost-tracker.js'

function tmpLedger(): string {
  return join(tmpdir(), `clawbridge-cost-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)
}

describe('FileCostTracker', () => {
  let ledgerPath: string

  beforeEach(() => {
    ledgerPath = tmpLedger()
  })

  it('records spend and returns daily/monthly totals', async () => {
    const t = new FileCostTracker({ ledgerPath })
    await t.recordSpend('anthropic_api', 1.25)
    await t.recordSpend('openai_api', 0.5)
    expect(await t.getDailyTotal()).toBeCloseTo(1.75)
    expect(await t.getMonthlyTotal()).toBeCloseTo(1.75)
    expect(await t.getDailyTotal('anthropic_api')).toBeCloseTo(1.25)
  })

  it('aggregates per session and per project', async () => {
    const t = new FileCostTracker({ ledgerPath })
    await t.recordSpend('anthropic_api', 0.5, { sessionId: 's1', projectId: 'PRJ-019' })
    await t.recordSpend('anthropic_api', 0.3, { sessionId: 's1', projectId: 'PRJ-019' })
    await t.recordSpend('anthropic_api', 0.1, { sessionId: 's2', projectId: 'PRJ-018' })
    expect(await t.getSessionTotal('s1')).toBeCloseTo(0.8)
    expect(await t.getSessionTotal('s2')).toBeCloseTo(0.1)
    expect(await t.getProjectTotal('PRJ-019')).toBeCloseTo(0.8)
  })

  it('checkBudget returns ok when below all caps', async () => {
    const t = new FileCostTracker({ ledgerPath })
    await t.recordSpend('anthropic_api', 1)
    const r = await t.checkBudget({ sessionId: 's1', projectId: 'PRJ-019' })
    expect(r.ok).toBe(true)
  })

  it('checkBudget rejects when monthly cap exceeded', async () => {
    const t = new FileCostTracker({ ledgerPath, limits: { ...DEFAULT_LIMITS, perMonthUsd: 5 } })
    await t.recordSpend('anthropic_api', 6)
    const r = await t.checkBudget()
    expect(r.ok).toBe(false)
    expect(r.layer).toBe('month')
  })

  it('checkBudget rejects when daily cap exceeded', async () => {
    const t = new FileCostTracker({
      ledgerPath,
      limits: { ...DEFAULT_LIMITS, perDayUsd: 2, perMonthUsd: 1000 },
    })
    await t.recordSpend('anthropic_api', 2.5)
    const r = await t.checkBudget()
    expect(r.ok).toBe(false)
    expect(r.layer).toBe('day')
  })

  it('checkBudget rejects when session cap exceeded', async () => {
    const t = new FileCostTracker({
      ledgerPath,
      limits: { ...DEFAULT_LIMITS, perSessionUsd: 1 },
    })
    await t.recordSpend('anthropic_api', 1.5, { sessionId: 's1' })
    const r = await t.checkBudget({ sessionId: 's1' })
    expect(r.ok).toBe(false)
    expect(r.layer).toBe('session')
  })

  it('checkBudget rejects when project cap exceeded', async () => {
    const t = new FileCostTracker({
      ledgerPath,
      limits: { ...DEFAULT_LIMITS, perProjectUsd: 2 },
    })
    await t.recordSpend('anthropic_api', 1.5, { projectId: 'PRJ-019' })
    await t.recordSpend('anthropic_api', 1.0, { projectId: 'PRJ-019' })
    const r = await t.checkBudget({ projectId: 'PRJ-019' })
    expect(r.ok).toBe(false)
    expect(r.layer).toBe('project')
  })

  it('throws on negative or NaN amount', async () => {
    const t = new FileCostTracker({ ledgerPath })
    await expect(t.recordSpend('anthropic_api', -1)).rejects.toThrow()
    await expect(t.recordSpend('anthropic_api', Number.NaN)).rejects.toThrow()
  })

  it('reset clears records', async () => {
    const t = new FileCostTracker({ ledgerPath })
    await t.recordSpend('anthropic_api', 1)
    await t.reset()
    expect(await t.getDailyTotal()).toBe(0)
  })

  it('persists across instances', async () => {
    const t1 = new FileCostTracker({ ledgerPath })
    await t1.recordSpend('anthropic_api', 1.23)
    const t2 = new FileCostTracker({ ledgerPath })
    expect(await t2.getDailyTotal()).toBeCloseTo(1.23)
  })

  it('returns 0 when ledger file does not exist', async () => {
    const t = new FileCostTracker({ ledgerPath })
    expect(await t.getDailyTotal()).toBe(0)
    expect(await t.getMonthlyTotal()).toBe(0)
    expect(await t.getSessionTotal('nope')).toBe(0)
  })

  it('cleanup', async () => {
    try {
      await fs.unlink(ledgerPath)
    } catch {
      // ignore
    }
  })
})
