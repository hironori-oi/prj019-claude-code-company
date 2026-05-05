/**
 * W6-A health-check API endpoints — Vitest test (R29 Dev-FFF / GTC-4)
 * 12 cases: liveness 3 / readiness 3 / startup 3 / custom 3
 */
import { describe, it, expect, vi } from 'vitest'

import { evaluateLiveness } from '../liveness.js'
import { evaluateReadiness } from '../readiness.js'
import { evaluateStartup } from '../startup.js'
import { evaluateCustomHealth } from '../custom.js'

describe('W6-A /health/liveness', () => {
  it('returns ok status with positive uptime', () => {
    const r = evaluateLiveness({ startedAt: 1000, now: () => 5000 })
    expect(r.status).toBe('ok')
    expect(r.uptimeMs).toBe(4000)
  })

  it('clamps uptime to >=0 when clock skew occurs', () => {
    const r = evaluateLiveness({ startedAt: 5000, now: () => 1000 })
    expect(r.uptimeMs).toBe(0)
  })

  it('returns ISO timestamp', () => {
    const r = evaluateLiveness({ startedAt: 0, now: () => 0 })
    expect(r.timestamp).toBe('1970-01-01T00:00:00.000Z')
  })
})

describe('W6-A /health/readiness', () => {
  it('returns ready when all 4 deps are up', async () => {
    const r = await evaluateReadiness({
      sentry: vi.fn().mockResolvedValue('up'),
      vercel: vi.fn().mockResolvedValue('up'),
      supabase: vi.fn().mockResolvedValue('up'),
      costTracker: vi.fn().mockResolvedValue('up'),
    })
    expect(r.status).toBe('ready')
  })

  it('returns not_ready when any dep is down', async () => {
    const r = await evaluateReadiness({
      sentry: vi.fn().mockResolvedValue('up'),
      vercel: vi.fn().mockResolvedValue('down'),
      supabase: vi.fn().mockResolvedValue('up'),
      costTracker: vi.fn().mockResolvedValue('up'),
    })
    expect(r.status).toBe('not_ready')
    expect(r.checks.vercel).toBe('down')
  })

  it('returns degraded when any dep is degraded but none down', async () => {
    const r = await evaluateReadiness({
      sentry: vi.fn().mockResolvedValue('degraded'),
      vercel: vi.fn().mockResolvedValue('up'),
      supabase: vi.fn().mockResolvedValue('up'),
      costTracker: vi.fn().mockResolvedValue('up'),
    })
    expect(r.status).toBe('degraded')
  })
})

describe('W6-A /health/startup', () => {
  it('returns started when all checks pass', () => {
    const r = evaluateStartup({
      configLoaded: true,
      migrationApplied: true,
      warmupCompleted: true,
    })
    expect(r.status).toBe('started')
    expect(r.pendingItems).toEqual([])
  })

  it('lists pending items when checks incomplete', () => {
    const r = evaluateStartup({
      configLoaded: true,
      migrationApplied: false,
      warmupCompleted: false,
    })
    expect(r.status).toBe('pending')
    expect(r.pendingItems).toEqual(['migration', 'warmup'])
  })

  it('returns pending with config item when config not loaded', () => {
    const r = evaluateStartup({
      configLoaded: false,
      migrationApplied: true,
      warmupCompleted: true,
    })
    expect(r.pendingItems).toContain('config')
  })
})

describe('W6-A /health/custom (DEC-068 5 trigger)', () => {
  it('returns pass when all 5 triggers satisfied', () => {
    const r = evaluateCustomHealth({
      t1: true,
      t2: true,
      t3: true,
      t4: true,
      t5: true,
    })
    expect(r.status).toBe('pass')
    expect(r.satisfied).toBe(5)
    expect(r.failingTriggers).toEqual([])
  })

  it('returns fail when any trigger missing', () => {
    const r = evaluateCustomHealth({
      t1: true,
      t2: true,
      t3: false,
      t4: true,
      t5: true,
    })
    expect(r.status).toBe('fail')
    expect(r.satisfied).toBe(4)
    expect(r.failingTriggers).toEqual(['t3'])
  })

  it('reports all failing triggers when none satisfied', () => {
    const r = evaluateCustomHealth({
      t1: false,
      t2: false,
      t3: false,
      t4: false,
      t5: false,
    })
    expect(r.satisfied).toBe(0)
    expect(r.failingTriggers).toEqual(['t1', 't2', 't3', 't4', 't5'])
  })
})
