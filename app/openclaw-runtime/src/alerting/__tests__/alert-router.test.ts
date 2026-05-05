/**
 * W6-B alert router — Vitest test (R29 Dev-FFF / GTC-4)
 * 6 cases: severity routing 3 + dedup key + dispatcher + schema reject
 */
import { describe, it, expect, vi } from 'vitest'

import {
  routeAlert,
  dispatchAlert,
  AlertInputSchema,
} from '../alert-router.js'

describe('W6-B alert-router', () => {
  it('warning routes to slack only', () => {
    const r = routeAlert({
      severity: 'warning',
      source: 'cost-tracker',
      message: 'budget 80% reached',
      fingerprint: 'fp-1',
      occurredAt: '2026-05-06T00:00:00.000Z',
    })
    expect(r.channels).toEqual(['slack'])
  })

  it('critical routes to slack + pagerduty', () => {
    const r = routeAlert({
      severity: 'critical',
      source: 'sentry',
      message: 'error rate 2%',
      fingerprint: 'fp-2',
      occurredAt: '2026-05-06T00:00:00.000Z',
    })
    expect(r.channels).toEqual(['slack', 'pagerduty'])
  })

  it('emergency routes to slack + pagerduty + email', () => {
    const r = routeAlert({
      severity: 'emergency',
      source: 'kill-switch',
      message: 'kill switch deadline missed',
      fingerprint: 'fp-3',
      occurredAt: '2026-05-06T00:00:00.000Z',
    })
    expect(r.channels).toEqual(['slack', 'pagerduty', 'email'])
  })

  it('dedup key combines severity + source + fingerprint', () => {
    const r = routeAlert({
      severity: 'critical',
      source: 'vercel',
      message: 'deploy failed',
      fingerprint: 'fp-deploy-x',
      occurredAt: '2026-05-06T00:00:00.000Z',
    })
    expect(r.dedupKey).toBe('critical:vercel:fp-deploy-x')
  })

  it('dispatchAlert calls dispatcher per channel', async () => {
    const dispatcher = vi.fn().mockResolvedValue(undefined)
    const input = {
      severity: 'critical' as const,
      source: 'sentry',
      message: 'm',
      fingerprint: 'f',
      occurredAt: '2026-05-06T00:00:00.000Z',
    }
    const route = routeAlert(input)
    const out = await dispatchAlert(route, input, dispatcher)
    expect(dispatcher).toHaveBeenCalledTimes(2)
    expect(out.delivered).toEqual(['slack', 'pagerduty'])
  })

  it('schema rejects empty message', () => {
    expect(() =>
      AlertInputSchema.parse({
        severity: 'warning',
        source: 'x',
        message: '',
        fingerprint: 'f',
        occurredAt: '2026-05-06T00:00:00.000Z',
      }),
    ).toThrow()
  })
})
