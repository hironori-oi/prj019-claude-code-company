/**
 * W6-B alert-router real wire — Vitest test (R30 Dev-HHH / GTC-7 prep)
 * 6 cases: mock store / dry-run skip / slack live / pagerduty live /
 *          email live (multi recipient) / live error propagation
 */
import { describe, it, expect, vi } from 'vitest'

import { dispatchAlert, routeAlert } from '../alert-router.js'
import {
  createRealChannelDispatcher,
  readMockDeliveries,
  resetMockDeliveries,
  type RealWireLogEvent,
} from '../alert-router-real-wire.js'

const baseInput = {
  severity: 'critical' as const,
  source: 'sentry',
  message: 'error rate spike 3%',
  fingerprint: 'fp-99',
  occurredAt: '2026-05-06T00:00:00.000Z',
}

describe('W6-B alert-router-real-wire', () => {
  it('mock mode records deliveries per channel', async () => {
    resetMockDeliveries()
    const dispatcher = createRealChannelDispatcher({ mode: 'mock' })
    const route = routeAlert(baseInput)
    const r = await dispatchAlert(route, baseInput, dispatcher)
    expect(r.delivered).toEqual(['slack', 'pagerduty'])
    expect(readMockDeliveries().map((d) => d.channel)).toEqual([
      'slack',
      'pagerduty',
    ])
  })

  it('dry-run mode skips network for all channels', async () => {
    const events: RealWireLogEvent[] = []
    const slackFetcher = vi.fn() as unknown as typeof fetch
    const dispatcher = createRealChannelDispatcher({
      mode: 'dry-run',
      slack: { webhookUrl: 'https://hooks.slack.com/x', fetcher: slackFetcher },
      logger: (e) => events.push(e),
    })
    const route = routeAlert(baseInput)
    await dispatchAlert(route, baseInput, dispatcher)
    expect(slackFetcher).not.toHaveBeenCalled()
    const skipEvents = events.filter((e) => e.kind === 'skip')
    expect(skipEvents.length).toBeGreaterThanOrEqual(2)
  })

  it('live slack POST issues webhook with severity in text', async () => {
    const fetcher = vi.fn(async () =>
      new Response(null, { status: 200 }),
    ) as unknown as typeof fetch
    const dispatcher = createRealChannelDispatcher({
      mode: 'live',
      slack: { webhookUrl: 'https://hooks.slack.com/x', fetcher },
      pagerduty: { routingKey: 'pd', fetcher: fetcher },
    })
    const route = routeAlert(baseInput)
    await dispatchAlert(route, baseInput, dispatcher)
    const slackCall = (fetcher as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0]
    expect(slackCall[0]).toBe('https://hooks.slack.com/x')
    const body = JSON.parse(slackCall[1].body as string)
    expect(body.text).toContain('CRITICAL')
    expect(body.text).toContain('error rate spike')
  })

  it('live pagerduty POST sends routing_key + dedup_key', async () => {
    const fetcher = vi.fn(async () =>
      new Response(null, { status: 202 }),
    ) as unknown as typeof fetch
    const dispatcher = createRealChannelDispatcher({
      mode: 'live',
      slack: { webhookUrl: 'https://hooks.slack.com/x', fetcher: fetcher },
      pagerduty: { routingKey: 'pd_route_42', fetcher },
    })
    const route = routeAlert(baseInput)
    await dispatchAlert(route, baseInput, dispatcher)
    const calls = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls
    const pdCall = calls.find((c) =>
      String(c[0]).includes('pagerduty'),
    )
    expect(pdCall).toBeDefined()
    const body = JSON.parse(pdCall![1].body as string)
    expect(body.routing_key).toBe('pd_route_42')
    expect(body.event_action).toBe('trigger')
    expect(body.dedup_key).toContain('fp-99')
    expect(body.payload.severity).toBe('error')
  })

  it('live email mode invokes send for each recipient', async () => {
    const send = vi.fn(async () => undefined)
    const fetcher = vi.fn(async () =>
      new Response(null, { status: 200 }),
    ) as unknown as typeof fetch
    const emergencyInput = { ...baseInput, severity: 'emergency' as const }
    const dispatcher = createRealChannelDispatcher({
      mode: 'live',
      slack: { webhookUrl: 'https://hooks.slack.com/x', fetcher },
      pagerduty: { routingKey: 'pd', fetcher },
      smtp: {
        toAddresses: ['oncall@example.com', 'lead@example.com'],
        fromAddress: 'alerts@example.com',
        send,
      },
    })
    const route = routeAlert(emergencyInput)
    await dispatchAlert(route, emergencyInput, dispatcher)
    expect(send).toHaveBeenCalledTimes(2)
    const firstCall = send.mock.calls[0][0]
    expect(firstCall.subject).toContain('EMERGENCY')
  })

  it('live mode propagates error when slack fails', async () => {
    const fetcher = vi.fn(async () =>
      new Response('forbidden', { status: 403 }),
    ) as unknown as typeof fetch
    const dispatcher = createRealChannelDispatcher({
      mode: 'live',
      slack: { webhookUrl: 'https://hooks.slack.com/x', fetcher },
      pagerduty: { routingKey: 'pd', fetcher },
    })
    const route = routeAlert(baseInput)
    await expect(
      dispatchAlert(route, baseInput, dispatcher),
    ).rejects.toThrow(/slack POST failed/)
  })
})
