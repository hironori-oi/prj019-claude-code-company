/**
 * W6-A health probes + route handlers — Vitest test (R30 Dev-HHH / GTC-7 prep)
 * 7 cases: sentry probe / vercel probe (3 indicator) / supabase probe / cost-tracker
 *          (up/degraded/down) / liveness route / readiness route 503
 */
import { describe, it, expect, vi } from 'vitest'

import { createSentryProbe } from '../probes/sentry.js'
import { createVercelProbe } from '../probes/vercel.js'
import { createSupabaseProbe } from '../probes/supabase.js'
import { createCostTrackerProbe } from '../probes/cost-tracker.js'
import {
  createLivenessRoute,
  createReadinessRoute,
  createStartupRoute,
  createCustomRoute,
} from '../route-handlers.js'

describe('W6-A probes + route-handlers', () => {
  it('sentry probe returns up on 200', async () => {
    const fetcher = vi.fn(async () =>
      new Response(null, { status: 200 }),
    ) as unknown as typeof fetch
    const probe = createSentryProbe({ fetcher })
    expect(await probe()).toBe('up')
  })

  it('vercel probe maps minor -> degraded', async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ status: { indicator: 'minor' } }), {
        status: 200,
      }),
    ) as unknown as typeof fetch
    const probe = createVercelProbe({ fetcher })
    expect(await probe()).toBe('degraded')
  })

  it('vercel probe maps major -> down', async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ status: { indicator: 'major' } }), {
        status: 200,
      }),
    ) as unknown as typeof fetch
    const probe = createVercelProbe({ fetcher })
    expect(await probe()).toBe('down')
  })

  it('supabase probe degraded on 401', async () => {
    const fetcher = vi.fn(async () =>
      new Response(null, { status: 401 }),
    ) as unknown as typeof fetch
    const probe = createSupabaseProbe({
      projectUrl: 'https://x.supabase.co',
      anonKey: 'k',
      fetcher,
    })
    expect(await probe()).toBe('degraded')
  })

  it('cost-tracker probe degraded at 0.96', async () => {
    const probe = createCostTrackerProbe({
      fetchUsageRatio: async () => 0.96,
    })
    expect(await probe()).toBe('degraded')
  })

  it('cost-tracker probe down at 1.05', async () => {
    const probe = createCostTrackerProbe({
      fetchUsageRatio: async () => 1.05,
    })
    expect(await probe()).toBe('down')
  })

  it('liveness route returns 200 with ok payload', async () => {
    const handler = createLivenessRoute({
      startedAt: 1000,
      now: () => 5000,
    })
    const res = await handler()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.uptimeMs).toBe(4000)
  })

  it('readiness route returns 503 when any probe down', async () => {
    const handler = createReadinessRoute({
      sentry: async () => 'up',
      vercel: async () => 'up',
      supabase: async () => 'down',
      costTracker: async () => 'up',
    })
    const res = await handler()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.status).toBe('not_ready')
  })

  it('startup route returns 503 when pending', async () => {
    const handler = createStartupRoute({
      fetchChecks: async () => ({
        configLoaded: true,
        migrationApplied: false,
        warmupCompleted: true,
      }),
    })
    const res = await handler()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.pendingItems).toContain('migration')
  })

  it('custom route returns 200 when all 5 triggers pass', async () => {
    const handler = createCustomRoute({
      fetchEvidence: async () => ({
        t1: true,
        t2: true,
        t3: true,
        t4: true,
        t5: true,
      }),
    })
    const res = await handler()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('pass')
    expect(body.satisfied).toBe(5)
  })
})
