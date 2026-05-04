/**
 * notify-bridge-retry.test — Round 14 Dev-B / Task C (DEC-019-057).
 *
 * 目的:
 *   - notify-bridge の retry policy DI が想定通り動作することを verify.
 *   - default (= retryPolicy 未注入) は既存挙動 (bridge は retry せず transport に委譲).
 *   - linear / exponential backoff の wait 計算が想定値と一致.
 *   - retry 中に成功した場合 onSuccess が 1 回だけ呼ばれる.
 *   - 全 attempt 失敗で onError が呼ばれる.
 *
 * +12 tests:
 *   - computeBackoffMs: 4 tests (linear / exponential / 0 / negative)
 *   - default 挙動互換: 2 tests
 *   - retry 成功シナリオ: 3 tests
 *   - retry 失敗シナリオ: 3 tests
 */
import { describe, it, expect, vi } from 'vitest'
import {
  createNotifyBridge,
  computeBackoffMs,
  DEFAULT_RETRY_POLICY,
  type NotifyBridgeTransport,
  type NotifyBridgeSendResult,
  type RetryPolicy,
  type SleepFn,
} from '../notify-bridge.js'
import type { TosMonitorEvent } from '../tos-monitor.js'

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

function makeOk(nonce: string): NotifyBridgeSendResult {
  return { ok: true, statusCode: 200, latencyMs: 42, nonce }
}

function makeFail(): NotifyBridgeSendResult {
  return {
    ok: false,
    errorType: 'network_failure',
    message: 'temporary network error',
  }
}

// ============================================================================
// computeBackoffMs
// ============================================================================

describe('computeBackoffMs — backoff 計算', () => {
  it('linear: backoffMs * (attempt + 1)', () => {
    const p: RetryPolicy = { maxRetries: 3, backoffMs: 100, backoffStrategy: 'linear' }
    expect(computeBackoffMs(p, 0)).toBe(100)
    expect(computeBackoffMs(p, 1)).toBe(200)
    expect(computeBackoffMs(p, 2)).toBe(300)
  })

  it('exponential: backoffMs * 2^attempt', () => {
    const p: RetryPolicy = { maxRetries: 3, backoffMs: 100, backoffStrategy: 'exponential' }
    expect(computeBackoffMs(p, 0)).toBe(100)
    expect(computeBackoffMs(p, 1)).toBe(200)
    expect(computeBackoffMs(p, 2)).toBe(400)
    expect(computeBackoffMs(p, 3)).toBe(800)
  })

  it('backoffMs <= 0 で 0 を返す', () => {
    const p: RetryPolicy = { maxRetries: 3, backoffMs: 0, backoffStrategy: 'linear' }
    expect(computeBackoffMs(p, 0)).toBe(0)
    expect(computeBackoffMs(p, 5)).toBe(0)
  })

  it('attempt < 0 で 0 を返す (defensive)', () => {
    const p: RetryPolicy = { maxRetries: 3, backoffMs: 100, backoffStrategy: 'linear' }
    expect(computeBackoffMs(p, -1)).toBe(0)
  })
})

// ============================================================================
// default 挙動互換 (retryPolicy 未注入)
// ============================================================================

describe('createNotifyBridge — retry 未注入時は既存挙動 (1 回送信)', () => {
  it('retryPolicy 未注入: 失敗しても 1 回しか transport を呼ばない', async () => {
    const transport = vi.fn(async (): Promise<NotifyBridgeSendResult> => makeFail())
    const onError = vi.fn()
    const listener = createNotifyBridge({
      webhookUrl: 'https://x',
      transport: transport as unknown as NotifyBridgeTransport,
      projectId: 'PRJ-019',
      channelId: 'C0',
      systemActorUserId: 'U0',
      onError,
    })
    await listener(makeEvent())
    expect(transport).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('DEFAULT_RETRY_POLICY: maxRetries=0 / backoffMs=0 / linear', () => {
    expect(DEFAULT_RETRY_POLICY).toEqual({
      maxRetries: 0,
      backoffMs: 0,
      backoffStrategy: 'linear',
    })
  })
})

// ============================================================================
// retry 成功シナリオ
// ============================================================================

describe('createNotifyBridge — retry 成功', () => {
  it('1 回失敗 → 2 回目成功で onSuccess (transport 2 回, onError 0 回)', async () => {
    let callCount = 0
    const transport: NotifyBridgeTransport = vi.fn(async (): Promise<NotifyBridgeSendResult> => {
      callCount += 1
      return callCount === 1 ? makeFail() : makeOk('n1')
    })
    const onSuccess = vi.fn()
    const onError = vi.fn()
    const sleepFn: SleepFn = vi.fn(async () => {})
    const listener = createNotifyBridge({
      webhookUrl: 'https://x',
      transport,
      projectId: 'PRJ-019',
      channelId: 'C0',
      systemActorUserId: 'U0',
      onSuccess,
      onError,
      retryPolicy: { maxRetries: 2, backoffMs: 50, backoffStrategy: 'linear' },
      sleepFn,
    })
    await listener(makeEvent())
    expect(transport).toHaveBeenCalledTimes(2)
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledTimes(0)
    expect(sleepFn).toHaveBeenCalledTimes(1)
    expect(sleepFn).toHaveBeenCalledWith(50) // linear, attempt=0 → 50*(0+1)
  })

  it('2 回失敗 → 3 回目成功 (maxRetries=3 / linear backoff 100ms)', async () => {
    let callCount = 0
    const transport = vi.fn(async (): Promise<NotifyBridgeSendResult> => {
      callCount += 1
      return callCount < 3 ? makeFail() : makeOk('n2')
    })
    const sleepFn = vi.fn(async () => {})
    const onSuccess = vi.fn()
    const listener = createNotifyBridge({
      webhookUrl: 'https://x',
      transport: transport as unknown as NotifyBridgeTransport,
      projectId: 'PRJ-019',
      channelId: 'C0',
      systemActorUserId: 'U0',
      onSuccess,
      retryPolicy: { maxRetries: 3, backoffMs: 100, backoffStrategy: 'linear' },
      sleepFn,
    })
    await listener(makeEvent())
    expect(transport).toHaveBeenCalledTimes(3)
    expect(onSuccess).toHaveBeenCalledTimes(1)
    // sleep は attempt=0 (100*1), attempt=1 (100*2) の 2 回
    expect(sleepFn).toHaveBeenNthCalledWith(1, 100)
    expect(sleepFn).toHaveBeenNthCalledWith(2, 200)
  })

  it('exponential backoff: sleep 100, 200, 400 で呼ばれる', async () => {
    const transport = vi.fn(async (): Promise<NotifyBridgeSendResult> => makeFail())
    const sleepFn = vi.fn(async () => {})
    const listener = createNotifyBridge({
      webhookUrl: 'https://x',
      transport: transport as unknown as NotifyBridgeTransport,
      projectId: 'PRJ-019',
      channelId: 'C0',
      systemActorUserId: 'U0',
      retryPolicy: { maxRetries: 3, backoffMs: 100, backoffStrategy: 'exponential' },
      sleepFn,
    })
    await listener(makeEvent())
    // maxRetries=3 → 4 回 attempt, sleep 3 回 (attempt 0/1/2 後)
    expect(transport).toHaveBeenCalledTimes(4)
    expect(sleepFn).toHaveBeenCalledTimes(3)
    expect(sleepFn).toHaveBeenNthCalledWith(1, 100) // 100*2^0
    expect(sleepFn).toHaveBeenNthCalledWith(2, 200) // 100*2^1
    expect(sleepFn).toHaveBeenNthCalledWith(3, 400) // 100*2^2
  })
})

// ============================================================================
// retry 失敗シナリオ
// ============================================================================

describe('createNotifyBridge — retry 失敗', () => {
  it('全 attempt 失敗で onError 1 回呼ばれる (maxRetries+1 回 transport 呼出)', async () => {
    const transport = vi.fn(async (): Promise<NotifyBridgeSendResult> => makeFail())
    const onSuccess = vi.fn()
    const onError = vi.fn()
    const sleepFn = vi.fn(async () => {})
    const listener = createNotifyBridge({
      webhookUrl: 'https://x',
      transport: transport as unknown as NotifyBridgeTransport,
      projectId: 'PRJ-019',
      channelId: 'C0',
      systemActorUserId: 'U0',
      onSuccess,
      onError,
      retryPolicy: { maxRetries: 2, backoffMs: 10, backoffStrategy: 'linear' },
      sleepFn,
    })
    await listener(makeEvent())
    expect(transport).toHaveBeenCalledTimes(3) // 1 + 2 retries
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledTimes(0)
    expect(sleepFn).toHaveBeenCalledTimes(2)
  })

  it('transport が throw した場合も retry 対象 (network_failure)', async () => {
    let count = 0
    const transport: NotifyBridgeTransport = async () => {
      count += 1
      if (count < 3) throw new Error(`boom-${count}`)
      return makeOk('after-throw')
    }
    const sleepFn = vi.fn(async () => {})
    const onSuccess = vi.fn()
    const onError = vi.fn()
    const listener = createNotifyBridge({
      webhookUrl: 'https://x',
      transport,
      projectId: 'PRJ-019',
      channelId: 'C0',
      systemActorUserId: 'U0',
      onSuccess,
      onError,
      retryPolicy: { maxRetries: 3, backoffMs: 5, backoffStrategy: 'linear' },
      sleepFn,
    })
    await listener(makeEvent())
    expect(count).toBe(3)
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledTimes(0)
    expect(sleepFn).toHaveBeenCalledTimes(2)
  })

  it('retry 注入時は transport の opts.maxAttempts=1 が強制される', async () => {
    const transport = vi.fn(async (): Promise<NotifyBridgeSendResult> => makeOk('n5'))
    const sleepFn = vi.fn(async () => {})
    const listener = createNotifyBridge({
      webhookUrl: 'https://x',
      transport: transport as unknown as NotifyBridgeTransport,
      projectId: 'PRJ-019',
      channelId: 'C0',
      systemActorUserId: 'U0',
      retryPolicy: { maxRetries: 2, backoffMs: 10, backoffStrategy: 'linear' },
      sleepFn,
    })
    await listener(makeEvent())
    expect(transport).toHaveBeenCalledTimes(1) // 成功なので 1 回のみ
    const args = transport.mock.calls[0]!
    // 5 番目の引数 (opts) で maxAttempts: 1 が含まれる
    expect(args[4]).toEqual({ timeoutMs: 5_000, maxAttempts: 1 })
  })
})
