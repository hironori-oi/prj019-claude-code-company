/**
 * W6-B alert router — severity 判定 + channel routing (R29 Dev-FFF / GTC-4)
 *
 * 3 severity (warning / critical / emergency) を 3 channel (Slack / PagerDuty / email) に
 * routing する pure function。実 webhook 呼出は注入された dispatcher で実装し、本 module
 * は決定論的な mapping 表 + dedup キー生成のみ提供する。物理通知 0 件。
 *
 * routing rule:
 *   warning   -> slack
 *   critical  -> slack + pagerduty
 *   emergency -> slack + pagerduty + email
 *
 * 連動: runsheets/w6b-production-ga-sop.md §4 / DEC-080 + 081
 */
import { z } from 'zod'

export const SEVERITIES = ['warning', 'critical', 'emergency'] as const
export type Severity = (typeof SEVERITIES)[number]

export const CHANNELS = ['slack', 'pagerduty', 'email'] as const
export type Channel = (typeof CHANNELS)[number]

export const AlertInputSchema = z.object({
  severity: z.enum(SEVERITIES),
  source: z.string().min(1),
  message: z.string().min(1),
  fingerprint: z.string().min(1),
  occurredAt: z.string().min(1),
})
export type AlertInput = z.infer<typeof AlertInputSchema>

export type AlertRoute = {
  severity: Severity
  channels: Channel[]
  dedupKey: string
}

const SEVERITY_TO_CHANNELS: Record<Severity, Channel[]> = {
  warning: ['slack'],
  critical: ['slack', 'pagerduty'],
  emergency: ['slack', 'pagerduty', 'email'],
}

export function routeAlert(input: AlertInput): AlertRoute {
  const parsed = AlertInputSchema.parse(input)
  const channels = SEVERITY_TO_CHANNELS[parsed.severity]
  const dedupKey = `${parsed.severity}:${parsed.source}:${parsed.fingerprint}`
  return { severity: parsed.severity, channels, dedupKey }
}

export type ChannelDispatcher = (
  channel: Channel,
  input: AlertInput,
) => Promise<void>

export async function dispatchAlert(
  route: AlertRoute,
  input: AlertInput,
  dispatcher: ChannelDispatcher,
): Promise<{ delivered: Channel[] }> {
  const delivered: Channel[] = []
  for (const ch of route.channels) {
    await dispatcher(ch, input)
    delivered.push(ch)
  }
  return { delivered }
}
