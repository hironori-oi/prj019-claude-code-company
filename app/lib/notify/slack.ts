/**
 * PRJ-019 Clawbridge — Slack 3-channel notify library
 *
 * 出典: DEC-019-049 (Slack workspace `prj019-claude-code-company` 新規作成 +
 *       HITL / monitor / drill の 3 channel 独立運用)
 *       DEC-019-048 (1Password CLI 採択、env は op:// reference 経由で注入)
 *
 * 設計方針:
 *   - channel 引数 (`hitl' | 'monitor' | 'drill'`) で webhook URL を切替
 *   - メッセージは 3 block 構成: header / context / actions
 *   - 失敗時 retry 3 回 (指数バックオフ 200ms / 400ms / 800ms)
 *   - 最終失敗時は audit_log に sink するための return.failure を返却
 *     (sync 失敗で main flow を止めない)
 *   - TypeScript strict / Zod 検証
 *   - secret 直書き禁止 (env から取得、env は op run -- で注入)
 *
 * 連携:
 *   - audit_log への記録は呼び出し元 (HITL gate / monitor / drill SOP) が責任を持つ
 *     本 module は post 結果を返すのみ
 *   - hash chain との衝突なし (本 module は副作用 = HTTP のみ)
 */

import { z } from 'zod';

// =============================================================================
// Types
// =============================================================================

export type SlackChannel = 'hitl' | 'monitor' | 'drill';

const ENV_VAR_BY_CHANNEL: Record<SlackChannel, string> = {
  hitl: 'SLACK_WEBHOOK_HITL',
  monitor: 'SLACK_WEBHOOK_MONITOR',
  drill: 'SLACK_WEBHOOK_DRILL',
};

/** Slack block を制限的に表現 (header / context / actions の 3 block 固定) */
export const SlackActionSchema = z.object({
  type: z.literal('button'),
  text: z.string().min(1).max(75),
  url: z.string().url().optional(),
  value: z.string().max(2000).optional(),
  style: z.enum(['primary', 'danger']).optional(),
});
export type SlackAction = z.infer<typeof SlackActionSchema>;

export const SlackMessageSchema = z.object({
  /** header section (タイトル、80 文字以内) */
  header: z.string().min(1).max(150),
  /** context section (severity / source / link 等の補足、複数行可) */
  context: z.string().min(1).max(3000),
  /** actions section (button 群、最大 5 個) */
  actions: z.array(SlackActionSchema).max(5).default([]),
});
export type SlackMessage = z.infer<typeof SlackMessageSchema>;

export interface PostSlackOptions {
  /** retry 回数 (default 3) */
  maxRetries?: number;
  /** initial backoff ms (default 200) */
  initialBackoffMs?: number;
  /** dependency injection (test 用) */
  fetchImpl?: typeof fetch;
  /** dependency injection (test 用) */
  env?: NodeJS.ProcessEnv;
}

export interface PostSlackResult {
  ok: boolean;
  channel: SlackChannel;
  attempts: number;
  /** 最後の HTTP status (取得できた場合) */
  lastStatus?: number;
  /** 失敗時の sink 用 message (audit_log に記録するため呼び出し元が利用) */
  failure?: {
    reason: 'env_missing' | 'http_error' | 'network_error' | 'invalid_message';
    detail: string;
  };
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Slack 3 block message を指定 channel に投稿する。
 *
 * @param channel - 'hitl' | 'monitor' | 'drill' (DEC-019-049 の独立運用 channel)
 * @param message - header / context / actions の 3 block 構成
 * @param options - retry / DI 設定
 * @returns 投稿結果。失敗時も throw せず failure を返す (sync 失敗で main flow 止めない方針)
 */
export async function postSlack(
  channel: SlackChannel,
  message: SlackMessage,
  options: PostSlackOptions = {},
): Promise<PostSlackResult> {
  // ---- input validation ----
  const parsed = SlackMessageSchema.safeParse(message);
  if (!parsed.success) {
    return {
      ok: false,
      channel,
      attempts: 0,
      failure: {
        reason: 'invalid_message',
        detail: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      },
    };
  }

  // ---- env resolution ----
  const env = options.env ?? process.env;
  const envVar = ENV_VAR_BY_CHANNEL[channel];
  const webhookUrl = env[envVar];
  if (!webhookUrl || webhookUrl.startsWith('op://')) {
    // op:// のまま渡ってきている = `op run --` を経由していない (DEC-019-048 違反)
    return {
      ok: false,
      channel,
      attempts: 0,
      failure: {
        reason: 'env_missing',
        detail: `${envVar} not resolved (need 'op run --env-file=.env.local --' wrapper, see DEC-019-048)`,
      },
    };
  }

  // ---- payload build ----
  const payload = buildSlackPayload(parsed.data, channel);

  // ---- retry loop ----
  const maxRetries = options.maxRetries ?? 3;
  const initialBackoff = options.initialBackoffMs ?? 200;
  const fetchImpl = options.fetchImpl ?? fetch;

  let attempts = 0;
  let lastStatus: number | undefined;
  let lastErr: string | undefined;

  for (let i = 0; i < maxRetries; i += 1) {
    attempts += 1;
    try {
      const res = await fetchImpl(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      lastStatus = res.status;
      if (res.status >= 200 && res.status < 300) {
        return { ok: true, channel, attempts, lastStatus };
      }
      // 4xx は retry 無意味 → 即終了 (5xx だけ retry)
      if (res.status >= 400 && res.status < 500) {
        lastErr = `HTTP ${res.status} (client error, no retry)`;
        break;
      }
      lastErr = `HTTP ${res.status}`;
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
    }

    if (i < maxRetries - 1) {
      const backoff = initialBackoff * 2 ** i;
      await sleep(backoff);
    }
  }

  return {
    ok: false,
    channel,
    attempts,
    lastStatus,
    failure: {
      reason: lastStatus !== undefined ? 'http_error' : 'network_error',
      detail: lastErr ?? 'unknown',
    },
  };
}

// =============================================================================
// Internal helpers
// =============================================================================

interface SlackBlockKitPayload {
  channel?: string;
  blocks: Array<Record<string, unknown>>;
  text: string; // fallback for notifications
}

export function buildSlackPayload(
  message: SlackMessage,
  channel: SlackChannel,
): SlackBlockKitPayload {
  const blocks: Array<Record<string, unknown>> = [
    {
      type: 'header',
      text: { type: 'plain_text', text: truncate(message.header, 150), emoji: false },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: truncate(message.context, 3000),
        },
      ],
    },
  ];

  if (message.actions.length > 0) {
    blocks.push({
      type: 'actions',
      elements: message.actions.map((a) => {
        const btn: Record<string, unknown> = {
          type: 'button',
          text: { type: 'plain_text', text: truncate(a.text, 75), emoji: false },
        };
        if (a.url) btn.url = a.url;
        if (a.value) btn.value = a.value;
        if (a.style) btn.style = a.style;
        return btn;
      }),
    });
  }

  return {
    blocks,
    text: `[${channel}] ${truncate(message.header, 150)}`,
  };
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// Severity → channel mapping helper (DEC-019-049 + DEC-019-035)
// =============================================================================

/**
 * Severity 名から channel を解決する純粋関数。
 *  - HIGH / L3 / critical    → 'drill'
 *  - MEDIUM / L2 / warn      → 'monitor'
 *  - LOW / L1 / info         → 'hitl' (HITL ゲート低優先度通知用)
 */
export function severityToChannel(severity: string): SlackChannel {
  const s = severity.toUpperCase();
  if (s === 'HIGH' || s === 'L3' || s === 'CRITICAL') return 'drill';
  if (s === 'MEDIUM' || s === 'L2' || s === 'WARN' || s === 'WARNING') return 'monitor';
  return 'hitl';
}
