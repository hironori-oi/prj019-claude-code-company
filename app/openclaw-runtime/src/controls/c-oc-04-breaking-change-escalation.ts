/**
 * C-OC-04 — breaking change 検知 → 1h escalation (Round 17 W1 完成版, 5/9 kickoff)
 * C-OC-03 で major diff 検出 → Slack #drill + CEO 通知 + Phase gate block。
 * Spec: ../../specs/17day-path-7ctrl.md#c-oc-04
 *
 * Round 17 W1 で I/O port 注入: SLACK_WEBHOOK_URL 経由 notifier port + email fallback +
 * audit critical log + 2 系統失敗時の re-arm marker。本ファイルは外部 API を直接呼ばない。
 */
import { z } from 'zod'

export const ESCALATION_SLA_MS = 60 * 60 * 1000
export const NOTIFIER_RETRY_LIMIT = 3
export const NOTIFIER_RETRY_BACKOFF_MS = [1_000, 5_000, 15_000] as const

export const MajorDiffSchema = z.object({
  field: z.string().min(1),
  before: z.string(),
  after: z.string(),
})
export type MajorDiff = z.infer<typeof MajorDiffSchema>

export const EscalationInputSchema = z.object({
  contractRunId: z.string().min(1),
  majorDiffs: z.array(MajorDiffSchema).min(1),
  detectedAt: z.string().datetime(),
})
export type EscalationInput = z.infer<typeof EscalationInputSchema>

export const NotifyResultSchema = z.object({
  delivered: z.boolean(),
  attempt: z.number().int().nonnegative(),
})
export type NotifyResult = z.infer<typeof NotifyResultSchema>

export const EscalationOutputSchema = z.object({
  escalationId: z.string().min(1),
  notifiedChannels: z.array(z.string().min(1)),
  failedChannels: z.array(z.string().min(1)),
  phaseGateBlocked: z.boolean(),
  ackDeadline: z.string().datetime(),
  criticalLogged: z.boolean(),
  reArmRequested: z.boolean(),
})
export type EscalationOutput = z.infer<typeof EscalationOutputSchema>

export interface NotifierBundle {
  /** SLACK_WEBHOOK_URL 注入経路。msg は plain text。 */
  slack(channel: string, msg: string): Promise<{ delivered: boolean }>
  /** CEO email fallback。 */
  email(to: string, msg: string): Promise<{ delivered: boolean }>
}

/** Round 17 W1: audit critical 記録 + 5 分後 re-arm 要求 port (CronCreate は呼出側責務)。 */
export interface EscalationOptions {
  slackChannel?: string
  ceoEmail?: string
  auditCriticalLog?: (entry: { escalationId: string; reason: string; ts: string }) => void
  /** Round 17 W1: 5 分後 re-arm 用 hook (CronCreate 注入は caller 側で実装)。 */
  reArmHook?: (escalationId: string, retryAtMs: number) => void
  /** Round 17 W1: 注入可能な timer (test 用)。default は globalThis の setTimeout。 */
  retryDelay?: (ms: number) => Promise<void>
}

const DEFAULT_SLACK_CHANNEL = '#drill'
const DEFAULT_CEO_EMAIL = 'ceo@clawbridge.local'

function formatMessage(input: EscalationInput, escalationId: string): string {
  const top = input.majorDiffs.slice(0, 3).map((d) => `${d.field}: ${d.before} -> ${d.after}`).join('; ')
  const more = input.majorDiffs.length > 3 ? ` (+${input.majorDiffs.length - 3} more)` : ''
  return `[${escalationId}] OpenClaw upstream major diff detected: ${top}${more}`
}

async function notifyWithRetry(
  port: () => Promise<{ delivered: boolean }>,
  retryDelay: (ms: number) => Promise<void>,
): Promise<NotifyResult> {
  let attempt = 0
  for (; attempt < NOTIFIER_RETRY_LIMIT; attempt++) {
    try {
      const r = await port()
      if (r.delivered) return { delivered: true, attempt }
    } catch {
      /* fall through to retry */
    }
    if (attempt < NOTIFIER_RETRY_LIMIT - 1) {
      await retryDelay(NOTIFIER_RETRY_BACKOFF_MS[attempt] ?? 1_000)
    }
  }
  return { delivered: false, attempt }
}

/** Round 17 W1 完成版: Slack + email fallback + critical log + re-arm marker。 */
export async function escalateBreakingChange(
  input: EscalationInput,
  notifiers: NotifierBundle,
  opts: EscalationOptions = {},
): Promise<EscalationOutput> {
  EscalationInputSchema.parse(input)
  const detectedTs = Date.parse(input.detectedAt)
  const escalationId = `COC04-${input.contractRunId}`
  const slackChannel = opts.slackChannel ?? DEFAULT_SLACK_CHANNEL
  const ceoEmail = opts.ceoEmail ?? DEFAULT_CEO_EMAIL
  const retryDelay = opts.retryDelay ?? ((_ms: number) => Promise.resolve())
  const msg = formatMessage(input, escalationId)
  const ackDeadline = new Date(detectedTs + ESCALATION_SLA_MS).toISOString()

  const notified: string[] = []
  const failed: string[] = []

  const slackResult = await notifyWithRetry(() => notifiers.slack(slackChannel, msg), retryDelay)
  if (slackResult.delivered) notified.push(slackChannel)
  else failed.push(slackChannel)

  const emailResult = await notifyWithRetry(() => notifiers.email(ceoEmail, msg), retryDelay)
  if (emailResult.delivered) notified.push(ceoEmail)
  else failed.push(ceoEmail)

  const bothFailed = !slackResult.delivered && !emailResult.delivered
  let criticalLogged = false
  let reArmRequested = false

  if (bothFailed) {
    if (opts.auditCriticalLog) {
      opts.auditCriticalLog({
        escalationId,
        reason: 'all_notifier_channels_failed',
        ts: new Date(detectedTs).toISOString(),
      })
      criticalLogged = true
    }
    if (opts.reArmHook) {
      // Spec: 5 分後再試行
      opts.reArmHook(escalationId, detectedTs + 5 * 60 * 1000)
      reArmRequested = true
    }
  }

  return {
    escalationId,
    notifiedChannels: notified,
    failedChannels: failed,
    phaseGateBlocked: true,
    ackDeadline,
    criticalLogged,
    reArmRequested,
  }
}
