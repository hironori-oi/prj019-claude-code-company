/**
 * R31 Dev-KKK — health probes actual-exec path test (env-gated mock injection)
 * 4 probe (sentry / vercel / supabase / cost-tracker) の実 API 呼出 path を
 * mock fetcher 注入で検証 (timeout 5s / fallback unhealthy / metric emit invariant)。
 *
 * 厳守: 実 API 発火 0 件 (全 fetcher は vi.fn 注入 / network 0 件)。
 *
 * 6 cases: sentry actual-exec 200/timeout / vercel actual-exec critical /
 *          supabase actual-exec 5xx -> down / cost-tracker actual-exec ratio /
 *          cost-tracker timeout fallback / probes 並列実行不變
 */
import { describe, it, expect, vi } from 'vitest'

import { createSentryProbe } from '../probes/sentry.js'
import { createVercelProbe } from '../probes/vercel.js'
import { createSupabaseProbe } from '../probes/supabase.js'
import { createCostTrackerProbe } from '../probes/cost-tracker.js'

describe('R31 probes actual-exec path (env-gated mock injection)', () => {
  it('sentry actual-exec: 200 -> up via injected fetcher', async () => {
    const fetcher = vi.fn(
      async () => new Response(null, { status: 200 }),
    ) as unknown as typeof fetch
    const probe = createSentryProbe({
      fetcher,
      authToken: 'r31-token',
      timeoutMs: 5000,
    })
    expect(await probe()).toBe('up')
    expect(
      (fetcher as unknown as { mock: { calls: unknown[][] } }).mock.calls
        .length,
    ).toBe(1)
  })

  it('sentry actual-exec: aborted/throw -> down (fallback unhealthy)', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('aborted')
    }) as unknown as typeof fetch
    const probe = createSentryProbe({ fetcher, timeoutMs: 5000 })
    expect(await probe()).toBe('down')
  })

  it('vercel actual-exec: critical indicator -> down', async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: { indicator: 'critical' } }), {
          status: 200,
        }),
    ) as unknown as typeof fetch
    const probe = createVercelProbe({ fetcher, timeoutMs: 5000 })
    expect(await probe()).toBe('down')
  })

  it('supabase actual-exec: 5xx -> down', async () => {
    const fetcher = vi.fn(
      async () => new Response(null, { status: 503 }),
    ) as unknown as typeof fetch
    const probe = createSupabaseProbe({
      projectUrl: 'https://r31.supabase.co',
      anonKey: 'anon-r31',
      fetcher,
      timeoutMs: 5000,
    })
    expect(await probe()).toBe('down')
  })

  it('cost-tracker actual-exec: ratio 0.97 -> degraded', async () => {
    const probe = createCostTrackerProbe({
      fetchUsageRatio: async () => 0.97,
      timeoutMs: 5000,
    })
    expect(await probe()).toBe('degraded')
  })

  it('cost-tracker actual-exec: throw -> down (fallback unhealthy)', async () => {
    const probe = createCostTrackerProbe({
      fetchUsageRatio: async () => {
        throw new Error('cost-source unavailable')
      },
      timeoutMs: 5000,
    })
    expect(await probe()).toBe('down')
  })

  it('all 4 probes parallel actual-exec preserves invariants (no API call leak)', async () => {
    const fetcher = vi.fn(
      async () => new Response('{}', { status: 200 }),
    ) as unknown as typeof fetch
    const sentry = createSentryProbe({ fetcher, timeoutMs: 5000 })
    const vercel = createVercelProbe({
      fetcher: vi.fn(
        async () =>
          new Response(JSON.stringify({ status: { indicator: 'none' } }), {
            status: 200,
          }),
      ) as unknown as typeof fetch,
      timeoutMs: 5000,
    })
    const supabase = createSupabaseProbe({
      projectUrl: 'https://r31.supabase.co',
      anonKey: 'anon',
      fetcher,
      timeoutMs: 5000,
    })
    const cost = createCostTrackerProbe({
      fetchUsageRatio: async () => 0.5,
      timeoutMs: 5000,
    })
    const results = await Promise.all([sentry(), vercel(), supabase(), cost()])
    expect(results).toEqual(['up', 'up', 'up', 'up'])
  })
})
