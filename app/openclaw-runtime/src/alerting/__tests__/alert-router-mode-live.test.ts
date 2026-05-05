/**
 * R31 Dev-KKK — alert-router-real-wire mode='live' switch test
 * GTC-7 Owner ACK 連動 e2e (dispatcher mode 解決 + 実通知 0 件厳守 mock injection)
 *
 * 7 cases: env-gate downgrade (env-not-prod) / env-gate downgrade (owner-ack-pending) /
 *          full gate pass -> live / mock pass-through / dry-run pass-through /
 *          GTC-7 ACK e2e / factory wrapper invokes slack POST after gate pass
 */
import { describe, it, expect, vi } from 'vitest'

import {
  createRealChannelDispatcherWithEnvGate,
  resolveDispatcherModeWithEnv,
  type DispatcherEnv,
} from '../alert-router-real-wire.js'

describe('R31 alert-router-real-wire mode=live env-gate', () => {
  it('env-not-prod -> downgrade to dry-run', () => {
    const r = resolveDispatcherModeWithEnv('live', { VERCEL_PROD: 'false' })
    expect(r.effective).toBe('dry-run')
    expect(r.downgradeReason).toBe('env-not-prod')
  })

  it('owner-ack-pending -> downgrade to dry-run', () => {
    const r = resolveDispatcherModeWithEnv('live', { VERCEL_PROD: 'true' })
    expect(r.effective).toBe('dry-run')
    expect(r.downgradeReason).toBe('owner-ack-pending')
  })

  it('full gate pass -> live retained', () => {
    const env: DispatcherEnv = {
      VERCEL_PROD: 'true',
      OWN_W5_PROD_ACK: 'received',
    }
    const r = resolveDispatcherModeWithEnv('live', env)
    expect(r.effective).toBe('live')
  })

  it('mock pass-through', () => {
    expect(resolveDispatcherModeWithEnv('mock', {}).effective).toBe('mock')
  })

  it('dry-run pass-through', () => {
    expect(
      resolveDispatcherModeWithEnv('dry-run', { VERCEL_PROD: 'true' })
        .effective,
    ).toBe('dry-run')
  })

  it('GTC-7 ACK e2e: pre-ACK dry-run, post-ACK live', () => {
    const pre = resolveDispatcherModeWithEnv('live', { VERCEL_PROD: 'true' })
    const post = resolveDispatcherModeWithEnv('live', {
      VERCEL_PROD: 'true',
      OWN_W5_PROD_ACK: 'received',
    })
    expect(pre.effective).toBe('dry-run')
    expect(post.effective).toBe('live')
  })

  it('factory wrapper post-ACK invokes slack POST via injected fetcher', async () => {
    const fetcher = vi.fn(
      async () => new Response(null, { status: 200 }),
    ) as unknown as typeof fetch
    const { dispatcher, resolved } = createRealChannelDispatcherWithEnvGate(
      {
        mode: 'live',
        slack: { webhookUrl: 'https://hooks.slack.test/r31', fetcher },
      },
      { VERCEL_PROD: 'true', OWN_W5_PROD_ACK: 'received' },
    )
    expect(resolved.effective).toBe('live')
    await dispatcher('slack', {
      severity: 'critical',
      source: 'r31-test',
      message: 'gtc-7 e2e',
      fingerprint: 'fp-r31',
      occurredAt: '2026-05-06T00:00:00Z',
    })
    expect(
      (fetcher as unknown as { mock: { calls: unknown[][] } }).mock.calls
        .length,
    ).toBe(1)
  })

  it('factory wrapper pre-ACK does not call fetch (live -> dry-run downgrade)', async () => {
    const fetcher = vi.fn() as unknown as typeof fetch
    const { dispatcher, resolved } = createRealChannelDispatcherWithEnvGate(
      {
        mode: 'live',
        slack: { webhookUrl: 'https://hooks.slack.test/r31', fetcher },
      },
      { VERCEL_PROD: 'true' },
    )
    expect(resolved.effective).toBe('dry-run')
    expect(resolved.downgradeReason).toBe('owner-ack-pending')
    await dispatcher('slack', {
      severity: 'warn',
      source: 'r31-test',
      message: 'pre-ACK',
      fingerprint: 'fp-r31-pre',
      occurredAt: '2026-05-06T00:00:00Z',
    })
    expect(
      (fetcher as unknown as { mock: { calls: unknown[][] } }).mock.calls
        .length,
    ).toBe(0)
  })
})
