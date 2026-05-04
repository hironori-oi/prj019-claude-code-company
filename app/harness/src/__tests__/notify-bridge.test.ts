/**
 * notify-bridge.test — Round 13 Dev-B / Task C (DEC-019-057).
 *
 * +12 tests:
 *   - DI 経路 (transport / fetchFn / webhookUrl 注入)
 *   - emitter 連動 (TosMonitor.on(listener) で event → transport 呼出)
 *   - kind resolver (default / custom)
 *   - error propagation (onError / onSuccess callback)
 *   - configuration validation
 */
import { describe, it, expect, vi } from 'vitest'
import {
  createNotifyBridge,
  type NotifyBridgeTransport,
  type NotifyBridgeSendResult,
  type NotifyBridgePayload,
} from '../notify-bridge.js'
import type { TosMonitorEvent } from '../tos-monitor.js'

// ============================================================================
// helpers
// ============================================================================

function makeEvent(
  type: TosMonitorEvent['type'] = 'monitor:cost-cap-breach',
  partial: Partial<TosMonitorEvent> = {},
): TosMonitorEvent {
  return {
    type,
    ts: '2026-05-04T12:00:00.000Z',
    tier: 'hard_fail',
    reason: 'test event',
    detail: {},
    ...partial,
  }
}

function makeOkResult(nonce: string): NotifyBridgeSendResult {
  return { ok: true, statusCode: 200, latencyMs: 42, nonce }
}

function makeFailResult(): NotifyBridgeSendResult {
  return {
    ok: false,
    errorType: 'non_2xx',
    message: 'Slack returned 500',
    statusCode: 500,
    attempts: 2,
  }
}

// ============================================================================
// DI 経路
// ============================================================================

describe('createNotifyBridge — DI 経路', () => {
  it('webhookUrl 未指定で throw', () => {
    expect(() =>
      createNotifyBridge({
        webhookUrl: '',
        transport: vi.fn() as unknown as NotifyBridgeTransport,
        projectId: 'PRJ-019',
        channelId: 'C0',
        systemActorUserId: 'U0',
      }),
    ).toThrow(/webhookUrl required/)
  })

  it('transport 未指定で throw', () => {
    expect(() =>
      createNotifyBridge({
        webhookUrl: 'https://hooks.slack.com/services/x',
        transport: undefined as unknown as NotifyBridgeTransport,
        projectId: 'PRJ-019',
        channelId: 'C0',
        systemActorUserId: 'U0',
      }),
    ).toThrow(/transport required/)
  })

  it('projectId 未指定で throw', () => {
    expect(() =>
      createNotifyBridge({
        webhookUrl: 'https://hooks.slack.com/services/x',
        transport: vi.fn() as unknown as NotifyBridgeTransport,
        projectId: '',
        channelId: 'C0',
        systemActorUserId: 'U0',
      }),
    ).toThrow(/projectId required/)
  })

  it('transport 経由で webhookUrl + fetchFn が伝播 (caller 注入と一致)', async () => {
    const transport = vi.fn(async (): Promise<NotifyBridgeSendResult> => makeOkResult('n1'))
    const fetchFn = vi.fn() as unknown as typeof fetch
    const listener = createNotifyBridge({
      webhookUrl: 'https://hooks.slack.com/services/test',
      transport: transport as unknown as NotifyBridgeTransport,
      projectId: 'PRJ-019',
      channelId: 'C0',
      systemActorUserId: 'U-system',
      fetchFn,
      timeoutMs: 1234,
      generateNonce: () => 'static-nonce-12',
      nowIso: () => '2026-05-04T00:00:00.000Z',
    })
    await listener(makeEvent('monitor:cost-cap-breach'))
    expect(transport).toHaveBeenCalledTimes(1)
    const args = transport.mock.calls[0]!
    expect(args[2]).toBe('https://hooks.slack.com/services/test')
    expect(args[3]).toBe(fetchFn)
    expect(args[4]).toEqual({ timeoutMs: 1234 })
  })

  it('transport が受け取る payload.metadata.projectId / channelId / actorUserId が一致', async () => {
    let captured: NotifyBridgePayload | null = null
    const transport: NotifyBridgeTransport = async (_body, payload) => {
      captured = payload as NotifyBridgePayload
      return makeOkResult('n2')
    }
    const listener = createNotifyBridge({
      webhookUrl: 'https://x',
      transport,
      projectId: 'PRJ-019',
      channelId: 'C-claw',
      systemActorUserId: 'U-system',
      generateNonce: () => 'abcdefgh', // 8 chars min
    })
    await listener(makeEvent('monitor:cost-cap-breach'))
    expect(captured).not.toBeNull()
    expect(captured!.metadata.projectId).toBe('PRJ-019')
    expect(captured!.metadata.channelId).toBe('C-claw')
    expect(captured!.metadata.actorUserId).toBe('U-system')
    expect(captured!.metadata.nonce).toBe('abcdefgh')
  })
})

// ============================================================================
// emitter 連動
// ============================================================================

describe('createNotifyBridge — emitter 連動', () => {
  it('TosMonitorListener として戻り値が呼出可能 (signature 互換)', async () => {
    const transport: NotifyBridgeTransport = async () => makeOkResult('n3')
    const listener = createNotifyBridge({
      webhookUrl: 'https://x',
      transport,
      projectId: 'PRJ-019',
      channelId: 'C0',
      systemActorUserId: 'U0',
    })
    // listener は (ev: TosMonitorEvent) => Promise<void> 形式
    const result = listener(makeEvent('monitor:cost-cap-breach'))
    await expect(result).resolves.toBeUndefined()
  })

  it('複数 event 連続発火で transport が複数回呼ばれる', async () => {
    const transport = vi.fn(async (): Promise<NotifyBridgeSendResult> => makeOkResult('n4'))
    const listener = createNotifyBridge({
      webhookUrl: 'https://x',
      transport: transport as unknown as NotifyBridgeTransport,
      projectId: 'PRJ-019',
      channelId: 'C0',
      systemActorUserId: 'U0',
      generateNonce: () => 'nonce0123',
    })
    await listener(makeEvent('monitor:cost-cap-breach'))
    await listener(makeEvent('monitor:ng3-time-breach'))
    await listener(makeEvent('monitor:rate-spike'))
    expect(transport).toHaveBeenCalledTimes(3)
  })
})

// ============================================================================
// kind resolver
// ============================================================================

describe('createNotifyBridge — kind resolver', () => {
  it('default mapping: cost-cap → cost_cap, ng3 → kill_switch, rate-spike → kill_switch, warning-email → kill_switch', async () => {
    const seen: NotifyBridgePayload['kind'][] = []
    const transport: NotifyBridgeTransport = async (_body, payload) => {
      seen.push((payload as NotifyBridgePayload).kind)
      return makeOkResult('n5')
    }
    const listener = createNotifyBridge({
      webhookUrl: 'https://x',
      transport,
      projectId: 'PRJ-019',
      channelId: 'C0',
      systemActorUserId: 'U0',
      generateNonce: () => 'nonce0123',
    })
    await listener(makeEvent('monitor:cost-cap-breach'))
    await listener(makeEvent('monitor:ng3-time-breach'))
    await listener(makeEvent('monitor:rate-spike'))
    await listener(makeEvent('monitor:warning-email'))
    expect(seen).toEqual(['cost_cap', 'kill_switch', 'kill_switch', 'kill_switch'])
  })

  it('default mapping: fallback-decision は通知 skip (transport 呼ばれない)', async () => {
    const transport = vi.fn(async (): Promise<NotifyBridgeSendResult> => makeOkResult('n6'))
    const listener = createNotifyBridge({
      webhookUrl: 'https://x',
      transport: transport as unknown as NotifyBridgeTransport,
      projectId: 'PRJ-019',
      channelId: 'C0',
      systemActorUserId: 'U0',
    })
    await listener(makeEvent('monitor:fallback-decision', { tier: null }))
    expect(transport).not.toHaveBeenCalled()
  })

  it('custom kindResolver で全イベントを drill_start に変換', async () => {
    const seen: NotifyBridgePayload['kind'][] = []
    const transport: NotifyBridgeTransport = async (_body, payload) => {
      seen.push((payload as NotifyBridgePayload).kind)
      return makeOkResult('n7')
    }
    const listener = createNotifyBridge({
      webhookUrl: 'https://x',
      transport,
      projectId: 'PRJ-019',
      channelId: 'C0',
      systemActorUserId: 'U0',
      generateNonce: () => 'nonce0123',
      kindResolver: () => 'drill_start',
    })
    await listener(makeEvent('monitor:cost-cap-breach'))
    expect(seen).toEqual(['drill_start'])
  })
})

// ============================================================================
// error / success callback
// ============================================================================

describe('createNotifyBridge — error / success callback', () => {
  it('onSuccess が ok=true で呼ばれる', async () => {
    const onSuccess = vi.fn()
    const transport: NotifyBridgeTransport = async () => makeOkResult('ok-nonce')
    const listener = createNotifyBridge({
      webhookUrl: 'https://x',
      transport,
      projectId: 'PRJ-019',
      channelId: 'C0',
      systemActorUserId: 'U0',
      onSuccess,
    })
    const ev = makeEvent('monitor:cost-cap-breach')
    await listener(ev)
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess.mock.calls[0]![0]).toMatchObject({ ok: true, statusCode: 200 })
    expect(onSuccess.mock.calls[0]![1]).toBe(ev)
  })

  it('onError が ok=false で呼ばれる (errorType / message が伝搬)', async () => {
    const onError = vi.fn()
    const transport: NotifyBridgeTransport = async () => makeFailResult()
    const listener = createNotifyBridge({
      webhookUrl: 'https://x',
      transport,
      projectId: 'PRJ-019',
      channelId: 'C0',
      systemActorUserId: 'U0',
      onError,
    })
    await listener(makeEvent('monitor:cost-cap-breach'))
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0]![0]).toMatchObject({
      ok: false,
      errorType: 'non_2xx',
      statusCode: 500,
    })
  })

  it('transport が throw しても listener 自体は throw せず onError で捕捉', async () => {
    const onError = vi.fn()
    const transport: NotifyBridgeTransport = async () => {
      throw new Error('boom')
    }
    const listener = createNotifyBridge({
      webhookUrl: 'https://x',
      transport,
      projectId: 'PRJ-019',
      channelId: 'C0',
      systemActorUserId: 'U0',
      onError,
    })
    await expect(listener(makeEvent('monitor:cost-cap-breach'))).resolves.toBeUndefined()
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0]![0]).toMatchObject({
      ok: false,
      errorType: 'network_failure',
      message: 'boom',
    })
  })
})
