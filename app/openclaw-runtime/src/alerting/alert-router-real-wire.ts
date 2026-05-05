/**
 * W6-B alert-router real wire — Slack + PagerDuty + SMTP wire (R30 Dev-HHH / GTC-7 prep)
 *
 * R29 Dev-FFF が物理化した `alert-router.ts` の `dispatchAlert(route, input, dispatcher)`
 * 第 3 引数 `ChannelDispatcher` 互換 implementation を提供する。
 *
 * channel mapping:
 *   slack     -> Incoming Webhook POST (chat.postMessage 互換 payload)
 *   pagerduty -> Events API v2 POST (routing_key + event_action=trigger)
 *   email     -> SMTP send (注入された transport 経由 / 本 wire は send 関数注入で抽象化)
 *
 * 設計方針:
 *   - 既存 `alert-router.ts` は absolute 無改変 (R29 Dev-FFF 物理化遵守)。
 *   - 各 channel は WireMode (live / dry-run / mock) を持ち、 GTC-7 Owner ACK 前は
 *     dry-run / mock のみ使用 (物理通知 0 件厳守)。
 *   - 本 module は dispatcher factory を export し、test では fetcher / smtpSender 注入で
 *     物理 HTTP 0 件で network path を検証可能。
 *
 * 連動: DEC-019-080 (Sentry 実発火必須化) / DEC-019-081 (月次予算 alert) /
 *       runsheets/w6b-production-ga-sop.md §4 / R29 Dev-FFF 引継 1
 */
import type {
  AlertInput,
  Channel,
  ChannelDispatcher,
} from './alert-router.js'

export type RealWireMode = 'live' | 'dry-run' | 'mock'

export type SlackWireOptions = {
  webhookUrl: string
  fetcher?: typeof fetch
}

export type PagerDutyWireOptions = {
  routingKey: string
  eventsUrl?: string
  fetcher?: typeof fetch
}

export type SmtpSendInput = {
  to: string
  subject: string
  textBody: string
}

export type SmtpWireOptions = {
  toAddresses: string[]
  fromAddress: string
  /** 注入された SMTP send 関数 (nodemailer / Resend / ses-client いずれにも対応) */
  send: (input: SmtpSendInput) => Promise<void>
}

export type RealWireOptions = {
  mode: RealWireMode
  slack?: SlackWireOptions
  pagerduty?: PagerDutyWireOptions
  smtp?: SmtpWireOptions
  logger?: (event: RealWireLogEvent) => void
}

export type RealWireLogEvent = {
  channel: Channel
  kind: 'invoke' | 'success' | 'skip' | 'error'
  mode: RealWireMode
  detail?: string
}

const MOCK_DELIVERIES: Array<{ channel: Channel; input: AlertInput }> = []

/** test inspect 用 — mock mode の delivery 履歴 */
export function readMockDeliveries(): ReadonlyArray<{
  channel: Channel
  input: AlertInput
}> {
  return MOCK_DELIVERIES.slice()
}

export function resetMockDeliveries(): void {
  MOCK_DELIVERIES.length = 0
}

/**
 * `dispatchAlert` 用 ChannelDispatcher factory。
 * 既存 `alert-router.ts` の dispatcher 引数互換 signature を返す。
 */
export function createRealChannelDispatcher(
  opts: RealWireOptions,
): ChannelDispatcher {
  const log = opts.logger ?? (() => {})
  return async (channel: Channel, input: AlertInput) => {
    log({ channel, kind: 'invoke', mode: opts.mode })

    if (opts.mode === 'mock') {
      MOCK_DELIVERIES.push({ channel, input })
      log({ channel, kind: 'success', mode: 'mock' })
      return
    }

    if (opts.mode === 'dry-run') {
      log({ channel, kind: 'skip', mode: 'dry-run', detail: 'no network' })
      return
    }

    try {
      if (channel === 'slack') {
        await sendSlack(opts.slack, input)
      } else if (channel === 'pagerduty') {
        await sendPagerDuty(opts.pagerduty, input)
      } else if (channel === 'email') {
        await sendEmail(opts.smtp, input)
      }
      log({ channel, kind: 'success', mode: 'live' })
    } catch (e) {
      log({
        channel,
        kind: 'error',
        mode: 'live',
        detail: e instanceof Error ? e.message : 'unknown',
      })
      throw e
    }
  }
}

async function sendSlack(
  opts: SlackWireOptions | undefined,
  input: AlertInput,
): Promise<void> {
  if (!opts) throw new Error('slack wire not configured')
  const fetcher = opts.fetcher ?? fetch
  const res = await fetcher(opts.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `[${input.severity.toUpperCase()}] ${input.source}: ${input.message}`,
      attachments: [
        {
          fingerprint: input.fingerprint,
          occurredAt: input.occurredAt,
        },
      ],
    }),
  })
  if (!res.ok) throw new Error(`slack POST failed: ${res.status}`)
}

async function sendPagerDuty(
  opts: PagerDutyWireOptions | undefined,
  input: AlertInput,
): Promise<void> {
  if (!opts) throw new Error('pagerduty wire not configured')
  const fetcher = opts.fetcher ?? fetch
  const url = opts.eventsUrl ?? 'https://events.pagerduty.com/v2/enqueue'
  const res = await fetcher(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      routing_key: opts.routingKey,
      event_action: 'trigger',
      dedup_key: `${input.severity}:${input.source}:${input.fingerprint}`,
      payload: {
        summary: input.message,
        source: input.source,
        severity: mapPagerDutySeverity(input.severity),
        timestamp: input.occurredAt,
      },
    }),
  })
  if (!res.ok) throw new Error(`pagerduty POST failed: ${res.status}`)
}

async function sendEmail(
  opts: SmtpWireOptions | undefined,
  input: AlertInput,
): Promise<void> {
  if (!opts) throw new Error('smtp wire not configured')
  for (const to of opts.toAddresses) {
    await opts.send({
      to,
      subject: `[${input.severity.toUpperCase()}] ${input.source}`,
      textBody: `${input.message}\n\nfingerprint: ${input.fingerprint}\noccurredAt: ${input.occurredAt}`,
    })
  }
}

function mapPagerDutySeverity(s: AlertInput['severity']): string {
  if (s === 'emergency') return 'critical'
  if (s === 'critical') return 'error'
  return 'warning'
}

/* -------------------------------------------------------------------------- */
/* R31 Dev-KKK append-only — mode='live' switch + GTC-7 Owner ACK env-gate    */
/* -------------------------------------------------------------------------- */

/**
 * R31 mode-live switch for alert dispatcher — env-gated guard for live mode.
 *
 * 設計:
 *   - 既存 `createRealChannelDispatcher` の振る舞いは absolute 不変 (R30 維持)。
 *   - 本 helper は `mode='live'` 要求時に `env.VERCEL_PROD === 'true'` AND
 *     `env.OWN_W5_PROD_ACK === 'received'` の二重 gate を強制し、満たさない場合は
 *     dry-run に自動 downgrade する (実 通知発火 0 件厳守継承)。
 *   - GTC-7 Owner ACK 連動。
 */
export type DispatcherEnv = {
  VERCEL_PROD?: string
  OWN_W5_PROD_ACK?: string
}

export type ResolvedDispatcherMode = {
  effective: RealWireMode
  downgradeReason?: 'env-not-prod' | 'owner-ack-pending'
}

export function resolveDispatcherModeWithEnv(
  requested: RealWireMode,
  env: DispatcherEnv,
): ResolvedDispatcherMode {
  if (requested !== 'live') return { effective: requested }
  if (env.VERCEL_PROD !== 'true') {
    return { effective: 'dry-run', downgradeReason: 'env-not-prod' }
  }
  if (env.OWN_W5_PROD_ACK !== 'received') {
    return { effective: 'dry-run', downgradeReason: 'owner-ack-pending' }
  }
  return { effective: 'live' }
}

export function createRealChannelDispatcherWithEnvGate(
  opts: RealWireOptions,
  env: DispatcherEnv,
): { dispatcher: ChannelDispatcher; resolved: ResolvedDispatcherMode } {
  const resolved = resolveDispatcherModeWithEnv(opts.mode, env)
  const dispatcher = createRealChannelDispatcher({
    ...opts,
    mode: resolved.effective,
  })
  return { dispatcher, resolved }
}
