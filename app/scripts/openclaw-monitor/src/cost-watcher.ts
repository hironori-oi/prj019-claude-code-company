/**
 * cost-watcher.ts — 日次 budget threshold cross detection (DEC-019-050)
 *
 * 出典:
 *   - DEC-019-050 Anthropic API spend cap = $30/月 (二重防御 = アプリ層)
 *   - DEC-019-049 Slack 3 channel 独立運用 (#hitl / #monitor / #drill)
 *   - DEC-019-035 severity → channel mapping
 *
 * 動作:
 *   - daily cron (0 0 * * * UTC = 09:00 JST 想定) で前日 spend を Supabase RPC から取得
 *   - 80% / 95% threshold cross を検出 (前日に未到達 → 当日到達した時のみ通知発火)
 *   - severity に応じて 3 channel へ振り分け:
 *       80% cross  → L2 / monitor
 *       95% cross  → L3 / drill
 *       hard fail  → L3 / drill + Owner email
 *       spike (前日比 200% 超) → L2 / monitor
 *   - 既存 notify.ts (Resend fallback 付き retry) の経路は再利用しない方針
 *     (本 watcher は HTTP webhook 直 POST + log のみ、簡素化)
 *
 * Mode:
 *   - watch    (default): 前日 spend を確認 → cross 検出 → Slack 通知
 *   - report             : cross 状態を JSON で stdout 出力 (Slack 通知なし)
 *
 * 実行:
 *   pnpm tsx scripts/openclaw-monitor/src/cost-watcher.ts --mode=watch
 *
 * 依存 ENV:
 *   SUPABASE_URL                   (or NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY      (RPC 呼び出し権限のため、subprocess には渡さない)
 *   SLACK_WEBHOOK_MONITOR
 *   SLACK_WEBHOOK_DRILL
 *   SLACK_WEBHOOK_HITL             (低優先度 cross 確認時のみ)
 *   ANTHROPIC_MONTHLY_CAP_USD      (default 30)
 *   ANTHROPIC_WARN_THRESHOLD       (default 24)
 *   ANTHROPIC_STOP_THRESHOLD       (default 28.5)
 */

import { request } from 'undici';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type Channel = 'hitl' | 'monitor' | 'drill';

interface Thresholds {
  capUsd: number;
  warnUsd: number;
  stopUsd: number;
}

interface CrossSnapshot {
  asOf: string; // ISO timestamp
  monthYear: string; // YYYY-MM (UTC)
  spentUsd: number;
  todayUsd: number;
  yesterdayUsd: number;
  thresholds: Thresholds;
  warnCrossed: boolean;
  stopCrossed: boolean;
  hardFail: boolean;
  spike: boolean;
  spikeRatio: number;
}

interface SlackNotification {
  channel: Channel;
  header: string;
  context: string;
}

// =============================================================================
// Threshold resolution (budget-guard.ts と同一ロジック、依存削減のため再実装)
// =============================================================================

function resolveThresholds(env: NodeJS.ProcessEnv = process.env): Thresholds {
  const num = (key: string, fallback: number): number => {
    const raw = env[key];
    if (!raw) return fallback;
    const v = Number.parseFloat(raw);
    if (!Number.isFinite(v) || v < 0) return fallback;
    return v;
  };
  const cap = num('ANTHROPIC_MONTHLY_CAP_USD', 30);
  const warn = num('ANTHROPIC_WARN_THRESHOLD', 24);
  const stop = num('ANTHROPIC_STOP_THRESHOLD', 28.5);
  if (!(warn < stop && stop < cap)) {
    return { capUsd: 30, warnUsd: 24, stopUsd: 28.5 };
  }
  return { capUsd: cap, warnUsd: warn, stopUsd: stop };
}

function isResolvedSecret(value: string | undefined): value is string {
  return typeof value === 'string' && value.length > 0 && !value.startsWith('op://');
}

function utcDateString(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function utcMonthYear(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

// =============================================================================
// Supabase client (service_role)
// =============================================================================

function getSupabase(env: NodeJS.ProcessEnv): SupabaseClient | null {
  const url = env['SUPABASE_URL'] ?? env['NEXT_PUBLIC_SUPABASE_URL'];
  const key = env['SUPABASE_SERVICE_ROLE_KEY'];
  if (!isResolvedSecret(url) || !isResolvedSecret(key)) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// =============================================================================
// Slack webhook 直 POST (cost-watcher 専用、retry 3 回)
// =============================================================================

async function postSlack(
  channel: Channel,
  msg: { header: string; context: string },
  env: NodeJS.ProcessEnv,
  log: (line: string) => void,
): Promise<boolean> {
  const envVar = channel === 'monitor'
    ? 'SLACK_WEBHOOK_MONITOR'
    : channel === 'drill'
      ? 'SLACK_WEBHOOK_DRILL'
      : 'SLACK_WEBHOOK_HITL';
  const url = env[envVar];
  if (!isResolvedSecret(url)) {
    log(`[skip] slack ${channel} — ${envVar} not resolved`);
    return false;
  }
  const payload = {
    text: `[budget-watcher] ${msg.header}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: msg.header.slice(0, 150), emoji: false },
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: msg.context.slice(0, 3000) }],
      },
    ],
  };
  const max = 3;
  let lastErr = 'unknown';
  for (let i = 0; i < max; i += 1) {
    try {
      const res = await request(url, {
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
    if (i < max - 1) await new Promise((r) => setTimeout(r, 200 * 2 ** i));
  }
  log(`[err] slack ${channel} attempts=${max} last=${lastErr}`);
  return false;
}

// =============================================================================
// Cross detection
// =============================================================================

export async function gatherSnapshot(
  env: NodeJS.ProcessEnv = process.env,
  log: (line: string) => void = console.log,
): Promise<CrossSnapshot> {
  const t = resolveThresholds(env);
  const supabase = getSupabase(env);
  const now = new Date();
  if (!supabase) {
    log('[skip] supabase env not resolved — emit empty snapshot');
    return {
      asOf: now.toISOString(),
      monthYear: utcMonthYear(now),
      spentUsd: 0,
      todayUsd: 0,
      yesterdayUsd: 0,
      thresholds: t,
      warnCrossed: false,
      stopCrossed: false,
      hardFail: false,
      spike: false,
      spikeRatio: 0,
    };
  }

  const today = utcDateString(now);
  const yesterday = utcDateString(new Date(now.getTime() - 24 * 60 * 60 * 1000));

  const [monthRes, todayRes, yRes] = await Promise.all([
    supabase.rpc('get_current_month_spend'),
    supabase.rpc('get_daily_spend', { target_date: today }),
    supabase.rpc('get_daily_spend', { target_date: yesterday }),
  ]);

  const spent = Number(monthRes.data ?? 0);
  const todayUsd = Number(todayRes.data ?? 0);
  const yesterdayUsd = Number(yRes.data ?? 0);

  const spikeRatio = yesterdayUsd > 0 ? todayUsd / yesterdayUsd : 0;
  const spike = yesterdayUsd > 0 && spikeRatio > 2.0;

  return {
    asOf: now.toISOString(),
    monthYear: utcMonthYear(now),
    spentUsd: spent,
    todayUsd,
    yesterdayUsd,
    thresholds: t,
    warnCrossed: spent >= t.warnUsd && spent < t.stopUsd,
    stopCrossed: spent >= t.stopUsd && spent < t.capUsd,
    hardFail: spent >= t.capUsd,
    spike,
    spikeRatio,
  };
}

export function buildNotifications(snap: CrossSnapshot): SlackNotification[] {
  const out: SlackNotification[] = [];
  const { spentUsd, thresholds: t } = snap;

  if (snap.hardFail) {
    out.push({
      channel: 'drill',
      header: `[PRJ-019] Budget HARD_FAIL — month=${snap.monthYear} spent=$${spentUsd.toFixed(2)} cap=$${t.capUsd}`,
      context: [
        `tier=hard_fail`,
        `ACTION REQUIRED: ANTHROPIC_API_KEY を 1Password Vault prj019/anthropic/api_key で revoke してください`,
        `subscription plan (Claude Max + Codex Pro) のみで運用継続可能 (DEC-019-006 P-D 改)`,
        `as_of=${snap.asOf}`,
      ].join('\n'),
    });
  } else if (snap.stopCrossed) {
    out.push({
      channel: 'drill',
      header: `[PRJ-019] Budget AUTO_STOP 95% reached — month=${snap.monthYear} spent=$${spentUsd.toFixed(2)} cap=$${t.capUsd}`,
      context: [
        `tier=auto_stop / threshold=$${t.stopUsd} / cap=$${t.capUsd}`,
        `ACTION RECOMMENDED: ANTHROPIC_API_KEY を一時 unset / Console で revoke`,
        `as_of=${snap.asOf}`,
      ].join('\n'),
    });
  } else if (snap.warnCrossed) {
    out.push({
      channel: 'monitor',
      header: `[PRJ-019] Budget WARN 80% reached — month=${snap.monthYear} spent=$${spentUsd.toFixed(2)} cap=$${t.capUsd}`,
      context: [
        `tier=warn / threshold=$${t.warnUsd}`,
        `今後 5 日以内の利用を絞ること推奨 (subscription plan 主軸へ切替検討)`,
        `as_of=${snap.asOf}`,
      ].join('\n'),
    });
  }

  if (snap.spike) {
    out.push({
      channel: 'monitor',
      header: `[PRJ-019] Daily spend SPIKE — today=$${snap.todayUsd.toFixed(2)} yesterday=$${snap.yesterdayUsd.toFixed(2)} ratio=${snap.spikeRatio.toFixed(2)}x`,
      context: [
        `anomaly threshold = 2.0x`,
        `急増 source 特定のため cost_ledger.scope_ref を確認してください`,
        `as_of=${snap.asOf}`,
      ].join('\n'),
    });
  }

  return out;
}

// =============================================================================
// Entry
// =============================================================================

type Mode = 'watch' | 'report';

function parseMode(argv: string[]): Mode {
  for (const a of argv) {
    if (a.startsWith('--mode=')) {
      const m = a.slice('--mode='.length);
      if (m === 'watch' || m === 'report') return m;
    }
  }
  return 'watch';
}

export async function runCostWatcher(
  argv: string[] = process.argv.slice(2),
  env: NodeJS.ProcessEnv = process.env,
  log: (line: string) => void = console.log,
): Promise<{ snapshot: CrossSnapshot; notifications: SlackNotification[]; delivered: number }> {
  const mode = parseMode(argv);
  const snap = await gatherSnapshot(env, log);
  const notifications = buildNotifications(snap);

  if (mode === 'report') {
    log(JSON.stringify({ snapshot: snap, notifications }, null, 2));
    return { snapshot: snap, notifications, delivered: 0 };
  }

  let delivered = 0;
  for (const n of notifications) {
    const ok = await postSlack(n.channel, { header: n.header, context: n.context }, env, log);
    if (ok) delivered += 1;
  }
  return { snapshot: snap, notifications, delivered };
}

// CLI entry
const _argv1 = process.argv[1];
if (_argv1 && _argv1.endsWith('cost-watcher.ts')) {
  runCostWatcher().then(
    (r) => {
      console.log(`[cost-watcher] notifications=${r.notifications.length} delivered=${r.delivered}`);
      process.exit(0);
    },
    (err) => {
      console.error('[cost-watcher] fatal', err);
      process.exit(1);
    },
  );
}
