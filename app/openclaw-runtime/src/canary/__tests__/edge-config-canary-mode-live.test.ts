/**
 * R31 Dev-KKK — edge-config-canary-vercel-wire mode='live' switch test
 * GTC-7 Owner ACK 連動 e2e (mock Owner ACK signal injection / live mode activation verify)
 *
 * 7 cases: env-gate downgrade (env-not-prod) / env-gate downgrade (owner-ack-pending) /
 *          full gate pass -> live / mock 通過 / dry-run 通過 / GTC-7 ACK e2e (dry-run -> live) /
 *          live 解決後 fetch 実発火 (mock fetcher injection)
 */
import { describe, it, expect, vi } from 'vitest'

import {
  createVercelEdgeConfigWriterWithEnvGate,
  resolveModeWithEnv,
  type ModeLiveEnv,
} from '../edge-config-canary-vercel-wire.js'

describe('R31 edge-config-canary mode=live env-gate', () => {
  it('env-not-prod -> downgrade to dry-run', () => {
    const r = resolveModeWithEnv('live', { VERCEL_PROD: 'false' })
    expect(r.effective).toBe('dry-run')
    expect(r.downgradeReason).toBe('env-not-prod')
  })

  it('owner-ack-pending -> downgrade to dry-run', () => {
    const r = resolveModeWithEnv('live', { VERCEL_PROD: 'true' })
    expect(r.effective).toBe('dry-run')
    expect(r.downgradeReason).toBe('owner-ack-pending')
  })

  it('full gate pass -> live retained', () => {
    const env: ModeLiveEnv = {
      VERCEL_PROD: 'true',
      OWN_W5_PROD_ACK: 'received',
    }
    const r = resolveModeWithEnv('live', env)
    expect(r.effective).toBe('live')
    expect(r.downgradeReason).toBeUndefined()
  })

  it('mock mode passes through env-gate untouched', () => {
    const r = resolveModeWithEnv('mock', {})
    expect(r.effective).toBe('mock')
  })

  it('dry-run mode passes through env-gate untouched', () => {
    const r = resolveModeWithEnv('dry-run', { VERCEL_PROD: 'true' })
    expect(r.effective).toBe('dry-run')
  })

  it('GTC-7 ACK e2e: missing ACK -> dry-run; ACK received -> live', () => {
    const before = resolveModeWithEnv('live', { VERCEL_PROD: 'true' })
    expect(before.effective).toBe('dry-run')
    const after = resolveModeWithEnv('live', {
      VERCEL_PROD: 'true',
      OWN_W5_PROD_ACK: 'received',
    })
    expect(after.effective).toBe('live')
  })

  it('factory wrapper resolves live + invokes injected fetcher with PATCH', async () => {
    const fetcher = vi.fn(
      async () => new Response(null, { status: 200 }),
    ) as unknown as typeof fetch
    const { writer, resolved } = createVercelEdgeConfigWriterWithEnvGate(
      {
        edgeConfigId: 'ec_r31',
        vercelToken: 't_r31',
        canaryKey: 'canary_pct',
        mode: 'live',
        fetcher,
      },
      { VERCEL_PROD: 'true', OWN_W5_PROD_ACK: 'received' },
    )
    expect(resolved.effective).toBe('live')
    await writer(50)
    expect(fetcher).toHaveBeenCalledTimes(1)
    const call = (fetcher as unknown as { mock: { calls: unknown[][] } }).mock
      .calls[0]
    expect(call[0]).toContain('/v1/edge-config/ec_r31/items')
    const init = call[1] as RequestInit
    expect(init.method).toBe('PATCH')
  })

  it('factory wrapper without ACK downgrades & does not call fetch', async () => {
    const fetcher = vi.fn() as unknown as typeof fetch
    const { writer, resolved } = createVercelEdgeConfigWriterWithEnvGate(
      {
        edgeConfigId: 'ec_r31',
        vercelToken: 't_r31',
        canaryKey: 'canary_pct',
        mode: 'live',
        fetcher,
      },
      { VERCEL_PROD: 'true' },
    )
    expect(resolved.effective).toBe('dry-run')
    expect(resolved.downgradeReason).toBe('owner-ack-pending')
    await writer(25)
    expect(
      (fetcher as unknown as { mock: { calls: unknown[][] } }).mock.calls
        .length,
    ).toBe(0)
  })
})
