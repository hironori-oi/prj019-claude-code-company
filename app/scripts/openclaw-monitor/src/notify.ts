/**
 * notify.ts — severity に応じた通知ルート切替。
 *
 * 出典: SOP §4 通知ルート設計 + DEC-019-049 (Slack 3 channel 独立運用)
 *  - L3 critical (HIGH)   → Slack `#drill` channel + Resend Owner mail (即時)
 *  - L2 warn    (MEDIUM)  → Slack `#monitor` channel + Resend Dev mail
 *  - L1 info    (LOW)     → log のみ (stdout / GitHub Actions summary)
 *
 *  fallback (DEC-019-049 連動):
 *    Slack post 失敗 (retry 3 回後も NG) 時は Resend メール経由でフォールバック通知。
 *    fallback も失敗した場合は log + skipped 配列に記録 (sync 失敗で main flow を止めない)。
 *
 * Secret 参照は ${VAR} 形式 (env 経由)、直書き禁止。
 *  - SLACK_WEBHOOK_HITL     : DEC-019-049 #hitl channel
 *  - SLACK_WEBHOOK_MONITOR  : DEC-019-049 #monitor channel
 *  - SLACK_WEBHOOK_DRILL    : DEC-019-049 #drill channel
 *  - RESEND_API_KEY         : Resend API Key (Slack 失敗時 fallback)
 *  - OWNER_NOTIFY_EMAIL     : Owner 通知先 (CEO 中継 mailbox)
 *  - DEV_NOTIFY_EMAIL       : Dev 通知先 (任意)
 *
 * DEC-019-048 (1Password CLI):
 *   env は GitHub Actions の `1password/load-secrets-action@v2` で注入される。
 *   op:// のまま渡ってきた場合は env_missing 扱いとして skip。
 */

import { request } from 'undici';
import type { ClassifiedEvent, NotifyTarget } from './types.ts';

/** severity → channel 名 (DEC-019-049 mapping) */
export type SlackChannelName = 'hitl' | 'monitor' | 'drill';

const WEBHOOK_ENV_BY_CHANNEL: Record<SlackChannelName, string> = {
  hitl: 'SLACK_WEBHOOK_HITL',
  monitor: 'SLACK_WEBHOOK_MONITOR',
  drill: 'SLACK_WEBHOOK_DRILL',
};

/** severity → Slack channel mapping (DEC-019-049) */
export function channelForSeverity(severity: ClassifiedEvent['severity']): SlackChannelName | null {
  switch (severity) {
    case 'L3':
      return 'drill';
    case 'L2':
      return 'monitor';
    case 'L1':
      return null; // log only, no Slack post (HITL channel は HITL gate 専用)
  }
}

export function routesFor(severity: ClassifiedEvent['severity']): NotifyTarget[] {
  switch (severity) {
    case 'L3':
      return [
        { channel: 'owner', transport: 'slack', envVar: 'SLACK_WEBHOOK_DRILL' },
        { channel: 'owner', transport: 'email', envVar: 'OWNER_NOTIFY_EMAIL' },
      ];
    case 'L2':
      return [
        { channel: 'dev', transport: 'slack', envVar: 'SLACK_WEBHOOK_MONITOR' },
        { channel: 'dev', transport: 'email', envVar: 'DEV_NOTIFY_EMAIL' },
      ];
    case 'L1':
      return [{ channel: 'log', transport: 'log' }];
  }
}

export interface NotifyDeps {
  /** for tests */
  fetchImpl?: typeof request;
  log?: (line: string) => void;
  env?: NodeJS.ProcessEnv;
}

/** 1Password reference (`op://...`) を実値とみなさない (DEC-019-048) */
function isResolvedSecret(value: string | undefined): value is string {
  if (!value) return false;
  if (value.startsWith('op://')) return false;
  return true;
}

export async function notify(
  event: ClassifiedEvent,
  deps: NotifyDeps = {},
): Promise<{ delivered: NotifyTarget[]; skipped: NotifyTarget[] }> {
  const env = deps.env ?? process.env;
  const log = deps.log ?? ((line: string): void => console.log(line));
  const fetchImpl = deps.fetchImpl ?? request;

  const targets = routesFor(event.severity);
  const delivered: NotifyTarget[] = [];
  const skipped: NotifyTarget[] = [];

  const subject = buildSubject(event);
  const body = buildBody(event);
  const slackChannel = channelForSeverity(event.severity);

  for (const target of targets) {
    if (target.transport === 'log') {
      log(`[${event.severity}] ${subject} :: ${event.snapshot.url}`);
      delivered.push(target);
      continue;
    }

    const secret = target.envVar ? env[target.envVar] : undefined;
    if (!isResolvedSecret(secret)) {
      log(
        `[skip] ${target.channel}/${target.transport} — env ${target.envVar ?? '(none)'} not resolved (op:// or unset)`,
      );
      skipped.push(target);
      // Slack 失敗扱いで Resend fallback を試みる
      if (target.transport === 'slack') {
        const fallbackOk = await tryResendFallback({
          env,
          fetchImpl,
          log,
          subject,
          body,
          severity: event.severity,
        });
        if (fallbackOk) {
          delivered.push({
            channel: target.channel,
            transport: 'email',
            envVar: target.channel === 'owner' ? 'OWNER_NOTIFY_EMAIL' : 'DEV_NOTIFY_EMAIL',
          });
        }
      }
      continue;
    }

    if (target.transport === 'slack') {
      const slackOk = await postSlackWithRetry({
        webhookUrl: secret,
        subject,
        body,
        severity: event.severity,
        channel: slackChannel,
        fetchImpl,
        log,
      });
      if (slackOk) {
        delivered.push(target);
      } else {
        skipped.push(target);
        // Resend fallback
        const fallbackOk = await tryResendFallback({
          env,
          fetchImpl,
          log,
          subject,
          body,
          severity: event.severity,
        });
        if (fallbackOk) {
          delivered.push({
            channel: target.channel,
            transport: 'email',
            envVar: target.channel === 'owner' ? 'OWNER_NOTIFY_EMAIL' : 'DEV_NOTIFY_EMAIL',
          });
        }
      }
    } else if (target.transport === 'email') {
      const resendKey = env['RESEND_API_KEY'];
      if (!isResolvedSecret(resendKey)) {
        log('[skip] email — RESEND_API_KEY not resolved (op:// or unset)');
        skipped.push(target);
        continue;
      }
      const ok = await postResend({
        apiKey: resendKey,
        to: secret,
        subject,
        body,
        fetchImpl,
        log,
      });
      if (ok) {
        delivered.push(target);
      } else {
        skipped.push(target);
      }
    }
  }

  return { delivered, skipped };
}

// ---------------------------------------------------------------------------
// Slack post with 3-attempt retry (DEC-019-049 alignment with app/lib/notify/slack.ts)
// ---------------------------------------------------------------------------
interface PostSlackArgs {
  webhookUrl: string;
  subject: string;
  body: string;
  severity: ClassifiedEvent['severity'];
  channel: SlackChannelName | null;
  fetchImpl: typeof request;
  log: (line: string) => void;
}

async function postSlackWithRetry(args: PostSlackArgs): Promise<boolean> {
  const { webhookUrl, subject, body, severity, channel, fetchImpl, log } = args;
  const payload = {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `[${severity}] ${subject}`.slice(0, 150), emoji: false },
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: body.slice(0, 3000) }],
      },
    ],
    text: `[${severity}] ${subject}`,
  };
  const max = 3;
  let lastErr = 'unknown';
  for (let i = 0; i < max; i += 1) {
    try {
      const res = await fetchImpl(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.statusCode < 300) return true;
      lastErr = `HTTP ${res.statusCode}`;
      if (res.statusCode >= 400 && res.statusCode < 500) break;
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
    }
    if (i < max - 1) await sleep(200 * 2 ** i);
  }
  log(`[err] slack channel=${channel ?? '?'} attempts=${max} last=${lastErr}`);
  return false;
}

// ---------------------------------------------------------------------------
// Resend fallback (Slack 失敗時の email 経路、DEC-019-049 連動)
// ---------------------------------------------------------------------------
interface ResendFallbackArgs {
  env: NodeJS.ProcessEnv;
  fetchImpl: typeof request;
  log: (line: string) => void;
  subject: string;
  body: string;
  severity: ClassifiedEvent['severity'];
}

async function tryResendFallback(args: ResendFallbackArgs): Promise<boolean> {
  const { env, fetchImpl, log, subject, body, severity } = args;
  const apiKey = env['RESEND_API_KEY'];
  if (!isResolvedSecret(apiKey)) {
    log('[fallback-skip] RESEND_API_KEY not resolved');
    return false;
  }
  const to = severity === 'L3' ? env['OWNER_NOTIFY_EMAIL'] : env['DEV_NOTIFY_EMAIL'];
  if (!isResolvedSecret(to)) {
    log(`[fallback-skip] target email env not resolved (severity=${severity})`);
    return false;
  }
  return postResend({
    apiKey,
    to,
    subject: `[FALLBACK] ${subject}`,
    body: `Slack post failed; fallback via Resend.\n\n${body}`,
    fetchImpl,
    log,
  });
}

interface PostResendArgs {
  apiKey: string;
  to: string;
  subject: string;
  body: string;
  fetchImpl: typeof request;
  log: (line: string) => void;
}

async function postResend(args: PostResendArgs): Promise<boolean> {
  const { apiKey, to, subject, body, fetchImpl, log } = args;
  try {
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: 'openclaw-monitor@notifications.invalid',
        to: [to],
        subject,
        text: body,
      }),
    });
    if (res.statusCode < 300) return true;
    log(`[err] resend HTTP ${res.statusCode}`);
    return false;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`[err] resend ${msg}`);
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildSubject(event: ClassifiedEvent): string {
  return `[PRJ-019 Changelog ${event.severity}] ${event.source} ${event.snapshot.versionOrTag}`;
}

export function buildBody(event: ClassifiedEvent): string {
  const lines = [
    `severity: ${event.severity}`,
    `source: ${event.source}`,
    `tag: ${event.snapshot.versionOrTag}`,
    `url: ${event.snapshot.url}`,
    `signals: ${event.signalCount}`,
    ...event.signals.map((s) => `  - ${s.pattern} (matched: ${s.matched})`),
    '',
    `summary: ${event.snapshot.summary.slice(0, 1000)}`,
  ];
  return lines.join('\n');
}
