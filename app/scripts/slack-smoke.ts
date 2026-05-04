/**
 * PRJ-019 Clawbridge — Slack 3-channel smoke test
 *
 * 出典: DEC-019-049 (Slack 新規 workspace `prj019-claude-code-company` + 3 channel 独立運用)
 *       DEC-019-048 (1Password CLI 採択)
 *       v2.1 訂正 (`dev-1password-slack-integration-v2-1.md`) Issue 1/2/3 解消版
 *
 * 設計方針 (v1/v2 Case 2 撤回理由):
 *   - v1/v2 が提示した `node --experimental-vm-modules -e "import('./lib/notify/slack.ts')"`
 *     は TS loader を経由しないため `.ts` を直接 import できない (=失敗の根本原因)。
 *   - 本 script は `pnpm tsx` 配下で実行され、tsx loader が `.ts` を on-the-fly transpile する。
 *
 * 実行 (cwd = app/, Windows PowerShell + Node 22+ + pnpm):
 *     # dry-run (RC-3 完了後でも実 post 不要、payload 構築のみ確認)
 *     op run --env-file=.env.local -- pnpm tsx scripts/slack-smoke.ts --dry-run
 *
 *     # live (RC-3 完了 + Vault に webhook 投入済みのとき)
 *     op run --env-file=.env.local -- pnpm tsx scripts/slack-smoke.ts
 *
 *     # 個別 channel のみ
 *     op run --env-file=.env.local -- pnpm tsx scripts/slack-smoke.ts --channels=hitl,monitor
 *
 * 制約:
 *   - TypeScript strict + verbatimModuleSyntax + exactOptionalPropertyTypes 互換。
 *   - 絵文字非使用 (CLAUDE.md `feedback_no_emoji`)。
 *   - secret 値の本体は表示しない (URL は postSlack 側で参照、本 script は env 名のみ言及)。
 *   - dry-run は network を一切叩かない。
 */

import {
  postSlack,
  buildSlackPayload,
  type SlackChannel,
  type SlackMessage,
  type PostSlackResult,
} from '../lib/notify/slack.ts';

const ALL_CHANNELS: readonly SlackChannel[] = ['hitl', 'monitor', 'drill'] as const;

interface CliOptions {
  channels: readonly SlackChannel[];
  dryRun: boolean;
}

function parseArgs(argv: ReadonlyArray<string>): CliOptions {
  let channels: readonly SlackChannel[] = ALL_CHANNELS;
  let dryRun = false;
  for (const a of argv) {
    if (a === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (a.startsWith('--channels=')) {
      const raw = a.slice('--channels='.length);
      const list = raw
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const invalid = list.filter((s) => !isSlackChannel(s));
      if (invalid.length > 0) {
        throw new Error(`invalid channel(s): ${invalid.join(', ')} (allowed: hitl|monitor|drill)`);
      }
      channels = list as SlackChannel[];
      continue;
    }
    if (a === '--help' || a === '-h') {
      printUsage();
      process.exit(0);
    }
  }
  return { channels, dryRun };
}

function isSlackChannel(s: string): s is SlackChannel {
  return s === 'hitl' || s === 'monitor' || s === 'drill';
}

function printUsage(): void {
  // eslint-disable-next-line no-console
  console.log(
    [
      'Usage: pnpm tsx scripts/slack-smoke.ts [--dry-run] [--channels=hitl,monitor,drill]',
      '',
      'Options:',
      '  --dry-run               payload 構築のみ、Slack 投稿は行わない',
      '  --channels=<list>       comma 区切り channel 指定 (default: hitl,monitor,drill)',
      '',
      'Note: 必ず `op run --env-file=.env.local --` 経由で実行してください (Tier 1 解決のため)。',
    ].join('\n'),
  );
}

function buildSmokeMessage(channel: SlackChannel): SlackMessage {
  const ts = new Date().toISOString();
  return {
    header: 'PRJ-019 smoke test',
    context: `channel=${channel} / DEC-019-048+049 verification / ts=${ts}`,
    actions: [{ type: 'button', text: 'OK', value: `ack_${channel}` }],
  };
}

function formatResult(channel: SlackChannel, result: PostSlackResult): string {
  if (result.ok) {
    return `  [${channel}] ok=true attempts=${result.attempts} status=${result.lastStatus ?? 'n/a'}`;
  }
  const reason = result.failure?.reason ?? 'unknown';
  const detail = result.failure?.detail ?? 'no detail';
  return `  [${channel}] ok=false attempts=${result.attempts} reason=${reason} detail=${detail}`;
}

async function runLive(channels: ReadonlyArray<SlackChannel>): Promise<number> {
  // eslint-disable-next-line no-console
  console.log(`Slack live smoke (cwd=${process.cwd()}, channels=[${channels.join(',')}])`);
  let exit = 0;
  for (const ch of channels) {
    const msg = buildSmokeMessage(ch);
    const res = await postSlack(ch, msg);
    // eslint-disable-next-line no-console
    console.log(formatResult(ch, res));
    if (!res.ok) exit = 1;
  }
  // eslint-disable-next-line no-console
  console.log(exit === 0 ? 'All channels posted successfully.' : 'Some channel(s) failed. See per-row failure detail above.');
  return exit;
}

function runDryRun(channels: ReadonlyArray<SlackChannel>): number {
  // eslint-disable-next-line no-console
  console.log(`Slack dry-run smoke (cwd=${process.cwd()}, channels=[${channels.join(',')}])`);
  for (const ch of channels) {
    const msg = buildSmokeMessage(ch);
    const payload = buildSlackPayload(msg, ch);
    const blockTypes = payload.blocks.map((b) => String(b.type ?? 'unknown')).join('+');
    const envVar = envVarOf(ch);
    const envState = classifyEnv(process.env[envVar]);
    // eslint-disable-next-line no-console
    console.log(
      `  [${ch}] payload.blocks=${blockTypes} text="${payload.text}" env=${envVar}:${envState}`,
    );
  }
  // eslint-disable-next-line no-console
  console.log('Dry-run complete. No HTTP request was made.');
  return 0;
}

function envVarOf(ch: SlackChannel): string {
  if (ch === 'hitl') return 'SLACK_WEBHOOK_HITL';
  if (ch === 'monitor') return 'SLACK_WEBHOOK_MONITOR';
  return 'SLACK_WEBHOOK_DRILL';
}

function classifyEnv(v: string | undefined): 'missing' | 'unresolved' | 'resolved' {
  if (v === undefined || v === '') return 'missing';
  if (v.startsWith('op://')) return 'unresolved';
  return 'resolved';
}

async function main(): Promise<number> {
  let opts: CliOptions;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`argument error: ${e instanceof Error ? e.message : String(e)}`);
    printUsage();
    return 2;
  }
  if (opts.dryRun) {
    return runDryRun(opts.channels);
  }
  return runLive(opts.channels);
}

main()
  .then((code) => {
    process.exit(code);
  })
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error('unexpected error:', err instanceof Error ? err.message : String(err));
    process.exit(99);
  });
