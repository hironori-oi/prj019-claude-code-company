/**
 * slack-webhook-sender.test — Round 12 Dev-B (DEC-019-057).
 *
 * 4 error type × 各 2-3 + ok 経路 + nonce dedup = 15-20 tests:
 *   - ok 経路 (200/201/204): 3 tests
 *   - non_2xx (4xx, 5xx): 3 tests + 5xx retry
 *   - timeout: 2 tests
 *   - network_failure: 2 tests
 *   - invalid_payload: 4 tests (empty url / non-object body / schema invalid / fetch missing)
 *   - nonce dedup (30s window 内 / TTL 過ぎ後): 3 tests
 *   - retry policy (1 回のみ, 500ms 固定): 2 tests
 *   - integration with harness slack-quick-action.buildSlackQuickActionButton: 1 test
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  sendSlackQuickAction,
  buildSlackWebhookBodyWithButton,
  resetSlackDedupStore,
  peekSlackDedupStore,
  SlackQuickActionMinimalSchema,
} from '../slack-webhook-sender.js'

// =============================================================================
// helper — minimal valid payload
// =============================================================================
function buildPayload(overrides: Partial<{ kind: string; nonce: string; expiresAt: string; issuedAt: string }> = {}) {
  const issuedAt = overrides.issuedAt ?? new Date(Date.now()).toISOString()
  const expiresAt = overrides.expiresAt ?? new Date(Date.now() + 5 * 60 * 1000).toISOString()
  return {
    kind: overrides.kind ?? 'kill_switch',
    metadata: {
      projectId: 'PRJ-019',
      channelId: 'C123',
      actorUserId: 'U456',
      nonce: overrides.nonce ?? `nonce-${Math.random().toString(36).slice(2, 14)}`,
      issuedAt,
      expiresAt,
    },
    reason: 'test',
    graceSeconds: 30,
  }
}

function mockFetchOk(status: number): typeof fetch {
  return (async () =>
    new Response(null, { status })) as unknown as typeof fetch
}

function mockFetchSequence(statuses: Array<number | 'timeout' | 'network'>) {
  let i = 0
  const fn = (async (_url: string, init?: RequestInit) => {
    const idx = i
    i += 1
    const cur = statuses[idx]
    if (cur === 'timeout') {
      // emulate: do not resolve until aborted.
      return new Promise<Response>((_resolve, reject) => {
        const sig = init?.signal
        if (sig) {
          const handler = () => {
            const err = new Error('AbortError') as Error & { name: string }
            err.name = 'AbortError'
            reject(err)
          }
          if (sig.aborted) handler()
          else sig.addEventListener('abort', handler)
        }
      })
    }
    if (cur === 'network') {
      throw new Error('ECONNREFUSED')
    }
    return new Response(null, { status: cur as number })
  }) as unknown as typeof fetch
  return { fn, calls: () => i }
}

// =============================================================================
beforeEach(() => {
  resetSlackDedupStore()
})

describe('sendSlackQuickAction — ok 経路', () => {
  it('200: success, statusCode/latencyMs/nonce 返す', async () => {
    const payload = buildPayload()
    const r = await sendSlackQuickAction(
      { text: 'hi' },
      payload,
      'https://hooks.slack.test/aaa',
      mockFetchOk(200),
      { sleep: async () => {} },
    )
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.statusCode).toBe(200)
      expect(typeof r.latencyMs).toBe('number')
      expect(r.nonce).toBe(payload.metadata.nonce)
    }
  })

  it('201: success', async () => {
    const r = await sendSlackQuickAction(
      { text: 'hi' },
      buildPayload(),
      'https://hooks.slack.test/aaa',
      mockFetchOk(201),
      { sleep: async () => {} },
    )
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.statusCode).toBe(201)
  })

  it('204: success (No Content)', async () => {
    const r = await sendSlackQuickAction(
      { text: 'hi' },
      buildPayload(),
      'https://hooks.slack.test/aaa',
      mockFetchOk(204),
      { sleep: async () => {} },
    )
    expect(r.ok).toBe(true)
  })
})

describe('sendSlackQuickAction — non_2xx', () => {
  it('400: invalid_payload 由来の non_2xx は retry しない (attempts=1)', async () => {
    const m = mockFetchSequence([400, 200])
    const r = await sendSlackQuickAction(
      { text: 'hi' },
      buildPayload(),
      'https://hooks.slack.test/aaa',
      m.fn,
      { sleep: async () => {} },
    )
    expect(r.ok).toBe(false)
    if (!r.ok && r.errorType === 'non_2xx') {
      expect(r.statusCode).toBe(400)
      expect(r.attempts).toBe(1) // 4xx は retry skip
    }
  })

  it('500: retry 1 回 → 最終 non_2xx (attempts=2)', async () => {
    const m = mockFetchSequence([500, 500])
    const r = await sendSlackQuickAction(
      { text: 'hi' },
      buildPayload(),
      'https://hooks.slack.test/aaa',
      m.fn,
      { sleep: async () => {} },
    )
    expect(r.ok).toBe(false)
    if (!r.ok && r.errorType === 'non_2xx') {
      expect(r.statusCode).toBe(500)
      expect(r.attempts).toBe(2)
    }
  })

  it('500 → 200: retry で success (attempts=1 effectively, ok=true)', async () => {
    const m = mockFetchSequence([500, 200])
    const r = await sendSlackQuickAction(
      { text: 'hi' },
      buildPayload(),
      'https://hooks.slack.test/aaa',
      m.fn,
      { sleep: async () => {} },
    )
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.statusCode).toBe(200)
    expect(m.calls()).toBe(2)
  })
})

describe('sendSlackQuickAction — timeout', () => {
  it('AbortController で timeout 発火', async () => {
    const m = mockFetchSequence(['timeout', 'timeout'])
    const r = await sendSlackQuickAction(
      { text: 'hi' },
      buildPayload(),
      'https://hooks.slack.test/aaa',
      m.fn,
      { timeoutMs: 50, sleep: async () => {} },
    )
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.errorType).toBe('timeout')
    }
  })

  it('timeout は retry する (attempts=2)', async () => {
    const m = mockFetchSequence(['timeout', 'timeout'])
    const r = await sendSlackQuickAction(
      { text: 'hi' },
      buildPayload(),
      'https://hooks.slack.test/aaa',
      m.fn,
      { timeoutMs: 30, sleep: async () => {} },
    )
    expect(r.ok).toBe(false)
    if (!r.ok && r.errorType === 'timeout') {
      expect(r.attempts).toBe(2)
    }
  })
})

describe('sendSlackQuickAction — network_failure', () => {
  it('fetch throw: network_failure', async () => {
    const m = mockFetchSequence(['network', 'network'])
    const r = await sendSlackQuickAction(
      { text: 'hi' },
      buildPayload(),
      'https://hooks.slack.test/aaa',
      m.fn,
      { sleep: async () => {} },
    )
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.errorType).toBe('network_failure')
    }
  })

  it('network → 200 で recover', async () => {
    const m = mockFetchSequence(['network', 200])
    const r = await sendSlackQuickAction(
      { text: 'hi' },
      buildPayload(),
      'https://hooks.slack.test/aaa',
      m.fn,
      { sleep: async () => {} },
    )
    expect(r.ok).toBe(true)
  })
})

describe('sendSlackQuickAction — invalid_payload', () => {
  it('webhookUrl が空文字: invalid_payload', async () => {
    const r = await sendSlackQuickAction(
      { text: 'hi' },
      buildPayload(),
      '',
      mockFetchOk(200),
      { sleep: async () => {} },
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errorType).toBe('invalid_payload')
  })

  it('body が array: invalid_payload', async () => {
    const r = await sendSlackQuickAction(
      [] as unknown as Record<string, unknown>,
      buildPayload(),
      'https://hooks.slack.test/aaa',
      mockFetchOk(200),
      { sleep: async () => {} },
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errorType).toBe('invalid_payload')
  })

  it('payload schema 不正: invalid_payload', async () => {
    const r = await sendSlackQuickAction(
      { text: 'hi' },
      { kind: 'unknown' },
      'https://hooks.slack.test/aaa',
      mockFetchOk(200),
      { sleep: async () => {} },
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errorType).toBe('invalid_payload')
  })

  it('fetch が undefined: invalid_payload', async () => {
    const r = await sendSlackQuickAction(
      { text: 'hi' },
      buildPayload(),
      'https://hooks.slack.test/aaa',
      undefined as unknown as typeof fetch,
      { sleep: async () => {} },
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errorType).toBe('invalid_payload')
  })
})

describe('sendSlackQuickAction — nonce dedup (30s window)', () => {
  it('同 nonce 30s 以内再送は duplicate_nonce で skip', async () => {
    const payload = buildPayload({ nonce: 'fixed-nonce-12345678' })
    let now = 1_700_000_000_000
    const r1 = await sendSlackQuickAction(
      { text: 'hi' },
      payload,
      'https://hooks.slack.test/aaa',
      mockFetchOk(200),
      { now: () => now, sleep: async () => {} },
    )
    expect(r1.ok).toBe(true)

    now += 10_000 // 10s later
    const r2 = await sendSlackQuickAction(
      { text: 'hi' },
      payload,
      'https://hooks.slack.test/aaa',
      mockFetchOk(200),
      { now: () => now, sleep: async () => {} },
    )
    expect(r2.ok).toBe(false)
    if (!r2.ok) expect(r2.errorType).toBe('duplicate_nonce')
  })

  it('30s 経過後の同 nonce は通る', async () => {
    const payload = buildPayload({ nonce: 'expiry-nonce-12345678' })
    let now = 1_700_000_000_000
    const r1 = await sendSlackQuickAction(
      { text: 'hi' },
      payload,
      'https://hooks.slack.test/aaa',
      mockFetchOk(200),
      { now: () => now, sleep: async () => {} },
    )
    expect(r1.ok).toBe(true)

    now += 31_000 // > 30s
    const r2 = await sendSlackQuickAction(
      { text: 'hi' },
      payload,
      'https://hooks.slack.test/aaa',
      mockFetchOk(200),
      { now: () => now, sleep: async () => {} },
    )
    expect(r2.ok).toBe(true)
  })

  it('別 nonce は dedup されない', async () => {
    const r1 = await sendSlackQuickAction(
      { text: 'hi' },
      buildPayload({ nonce: 'aaaa1234' }),
      'https://hooks.slack.test/aaa',
      mockFetchOk(200),
      { sleep: async () => {} },
    )
    const r2 = await sendSlackQuickAction(
      { text: 'hi' },
      buildPayload({ nonce: 'bbbb5678' }),
      'https://hooks.slack.test/aaa',
      mockFetchOk(200),
      { sleep: async () => {} },
    )
    expect(r1.ok).toBe(true)
    expect(r2.ok).toBe(true)
    expect(peekSlackDedupStore().size).toBe(2)
  })
})

describe('sendSlackQuickAction — retry policy', () => {
  it('500ms 固定 wait (sleep DI で count を確認)', async () => {
    let sleepCount = 0
    let lastDelay = 0
    const m = mockFetchSequence([500, 200])
    const r = await sendSlackQuickAction(
      { text: 'hi' },
      buildPayload(),
      'https://hooks.slack.test/aaa',
      m.fn,
      {
        sleep: async (ms: number) => {
          sleepCount += 1
          lastDelay = ms
        },
      },
    )
    expect(r.ok).toBe(true)
    expect(sleepCount).toBe(1)
    expect(lastDelay).toBe(500)
  })

  it('maxAttempts=1 で retry なし', async () => {
    let sleepCount = 0
    const m = mockFetchSequence([500, 200])
    const r = await sendSlackQuickAction(
      { text: 'hi' },
      buildPayload(),
      'https://hooks.slack.test/aaa',
      m.fn,
      {
        maxAttempts: 1,
        sleep: async () => {
          sleepCount += 1
        },
      },
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect((r as { attempts?: number }).attempts).toBe(1)
    expect(sleepCount).toBe(0)
  })
})

describe('buildSlackWebhookBodyWithButton — integration helper', () => {
  it('SlackButtonBlock 構造を含む body を生成', () => {
    const buttonBlock = {
      type: 'button',
      text: { type: 'plain_text', text: 'Stop', emoji: false },
      action_id: 'kill_switch',
      value: '{}',
    }
    const body = buildSlackWebhookBodyWithButton('Owner action required', buttonBlock)
    expect(body['text']).toBe('Owner action required')
    const blocks = body['blocks'] as unknown[]
    expect(blocks).toHaveLength(2)
    const actions = blocks[1] as { type: string; elements: unknown[] }
    expect(actions.type).toBe('actions')
    expect(actions.elements[0]).toBe(buttonBlock)
  })

  it('buttonBlock が object 以外: throw', () => {
    expect(() =>
      buildSlackWebhookBodyWithButton('hi', null as unknown),
    ).toThrowError(/must be an object/)
  })
})

describe('SlackQuickActionMinimalSchema — harness slack-quick-action 型整合', () => {
  it('kill_switch / cost_cap / drill_start を accept', () => {
    expect(SlackQuickActionMinimalSchema.parse(buildPayload({ kind: 'kill_switch' })).kind).toBe('kill_switch')
    expect(SlackQuickActionMinimalSchema.parse(buildPayload({ kind: 'cost_cap' })).kind).toBe('cost_cap')
    expect(SlackQuickActionMinimalSchema.parse(buildPayload({ kind: 'drill_start' })).kind).toBe('drill_start')
  })

  it('nonce が 8 文字未満: reject', () => {
    expect(() =>
      SlackQuickActionMinimalSchema.parse(buildPayload({ nonce: 'short' })),
    ).toThrow()
  })
})
