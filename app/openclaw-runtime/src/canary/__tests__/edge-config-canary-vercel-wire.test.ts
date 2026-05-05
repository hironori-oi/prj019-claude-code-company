/**
 * W6-A canary Vercel wire — Vitest test (R30 Dev-HHH / GTC-7 prep)
 * 6 cases: mock store / dry-run / live PATCH success / live PATCH fail /
 *          team scoped URL / logger event sequence
 */
import { describe, it, expect, vi } from 'vitest'

import { applyCanary, decideCanary } from '../edge-config-canary.js'
import {
  createVercelEdgeConfigWriter,
  readMockStore,
  resetMockStore,
  type VercelWireLogEvent,
} from '../edge-config-canary-vercel-wire.js'

describe('W6-A edge-config-canary-vercel-wire', () => {
  it('mock mode writes to in-memory store', async () => {
    resetMockStore()
    const writer = createVercelEdgeConfigWriter({
      edgeConfigId: 'ec_test',
      vercelToken: 't',
      canaryKey: 'canary_pct',
      mode: 'mock',
    })
    const decision = decideCanary({
      currentStage: 1,
      targetStage: 2,
      abortRequested: false,
      triggerEvidenceOk: true,
    })
    const r = await applyCanary(decision, writer)
    expect(r.applied).toBe(true)
    expect(r.percent).toBe(25)
    expect(readMockStore('canary_pct')).toBe(25)
  })

  it('dry-run mode does not call fetch', async () => {
    const fetcher = vi.fn()
    const writer = createVercelEdgeConfigWriter({
      edgeConfigId: 'ec_test',
      vercelToken: 't',
      canaryKey: 'k',
      mode: 'dry-run',
      fetcher: fetcher as unknown as typeof fetch,
    })
    await writer(50)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('live mode issues PATCH with bearer + json body', async () => {
    const fetcher = vi.fn(async () =>
      new Response(null, { status: 200 }),
    ) as unknown as typeof fetch
    const writer = createVercelEdgeConfigWriter({
      edgeConfigId: 'ec_42',
      vercelToken: 'tok_secret',
      canaryKey: 'canary_pct',
      mode: 'live',
      fetcher,
    })
    await writer(5)
    const call = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(call[0]).toBe('https://api.vercel.com/v1/edge-config/ec_42/items')
    expect(call[1].method).toBe('PATCH')
    expect(call[1].headers.Authorization).toBe('Bearer tok_secret')
    const body = JSON.parse(call[1].body as string)
    expect(body.items[0].value).toBe(5)
    expect(body.items[0].key).toBe('canary_pct')
  })

  it('live mode throws on non-2xx', async () => {
    const fetcher = vi.fn(async () =>
      new Response('forbidden', { status: 403 }),
    ) as unknown as typeof fetch
    const writer = createVercelEdgeConfigWriter({
      edgeConfigId: 'ec_42',
      vercelToken: 't',
      canaryKey: 'k',
      mode: 'live',
      fetcher,
    })
    await expect(writer(25)).rejects.toThrow(/PATCH failed/)
  })

  it('team scoped URL appends teamId query', async () => {
    const fetcher = vi.fn(async () =>
      new Response(null, { status: 200 }),
    ) as unknown as typeof fetch
    const writer = createVercelEdgeConfigWriter({
      edgeConfigId: 'ec_t',
      vercelTeamId: 'team_99',
      vercelToken: 't',
      canaryKey: 'k',
      mode: 'live',
      fetcher,
    })
    await writer(100)
    const call = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(call[0]).toContain('teamId=team_99')
  })

  it('logger receives invoke + success in success path', async () => {
    const events: VercelWireLogEvent[] = []
    const writer = createVercelEdgeConfigWriter({
      edgeConfigId: 'ec',
      vercelToken: 't',
      canaryKey: 'k',
      mode: 'mock',
      logger: (e) => events.push(e),
    })
    await writer(5)
    expect(events.map((e) => e.kind)).toEqual(['invoke', 'success'])
    expect(events[1].percent).toBe(5)
  })
})
