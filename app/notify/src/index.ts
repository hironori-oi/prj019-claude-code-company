/**
 * @clawbridge/notify — Slack webhook / Telegram / Email 通知 dispatch layer.
 *
 * Round 12 Dev-B (DEC-019-057): Slack webhook POST 配線完遂。
 *   - sendSlackQuickAction: pure(ish) function with DI fetch, retry=1, timeout=5s,
 *     nonce-based de-duplication (30s window), 4 error type classification.
 *   - buildSlackWebhookBodyWithButton: SlackButtonBlock を含む webhook body 構築 helper.
 *
 * G-V2-08 Anthropic 警告メール監視 / Telegram bot / Resend Email は後続 Round で追加。
 */
export {
  sendSlackQuickAction,
  buildSlackWebhookBodyWithButton,
  resetSlackDedupStore,
  peekSlackDedupStore,
  SlackQuickActionMinimalSchema,
  type SlackQuickActionPayload,
  type SlackWebhookBody,
  type SlackSendErrorType,
  type SlackSendResult,
  type SendSlackQuickActionOptions,
  type FetchFn,
} from './slack-webhook-sender.js'
