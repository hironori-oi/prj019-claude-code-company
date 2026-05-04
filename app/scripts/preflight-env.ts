/**
 * PRJ-019 Clawbridge — Pre-flight environment resolution check (v2.2 hotfix)
 *
 * 出典: DEC-019-048 (1Password CLI 採択) / DEC-019-053 (2-tier 設計)
 *       v2.1 訂正 (`dev-1password-slack-integration-v2-1.md`) Issue 2/3 解消
 *       v2.2 hotfix (`dev-1password-slack-integration-v2-2.md`) — op run all-or-nothing 仕様への dotenv fallback
 *
 * 目的:
 *   Tier 1 / 9 fields の op:// 解決状態を **post せずに** 検証する。
 *   v2.1 では `op run --env-file=.env.local --` 前置を必須としていたが、
 *   v2.2 で **2 mode** に拡張: op run 経由 (resolved) でも、直接起動 (.env.local 直読) でも動作する。
 *
 * 起動 mode:
 *   - **op-run resolved**: env に既に値が入っている (= `op run --env-file=.env.local --` 経由で起動された)
 *     → そのまま classify。Vault 投入済 field は `[resolved]`、未投入は op:// literal が渡るので `[unresolved]`。
 *   - **direct (.env.local loaded via internal parser)**: `.env.local` を自前パーサで読み込む (= op run なし)
 *     → env value は literal `op://...` 文字列のまま → `[unresolved]` として正しく扱われる。
 *     → Vault が空でも abort しない (= op run all-or-nothing 仕様の回避)。
 *
 * 出力:
 *   各 Tier 1 field を以下 3 状態で表示:
 *     [resolved]   実値が入っている (https:// または Vault 解決済み literal)。length のみ表示し本体は出さない。
 *     [unresolved] op://... のまま (= `op run --` を経由していない or Vault 未登録)。op:// path は secret ではないので表示 OK。
 *     [missing]    env / .env.local いずれにも未定義。
 *
 * 実行 (cwd = app/, Windows PowerShell + Node 22+ + pnpm):
 *     # mode env (推奨初期 / Vault 状態に依存しない / op run なし):
 *     pnpm tsx scripts/preflight-env.ts
 *     # mode resolved (Vault 完成後の確認):
 *     op run --env-file=.env.local -- pnpm tsx scripts/preflight-env.ts
 *
 * 備考:
 *   - Slack post は **行わない** (Vault 未投入時の安全性確保)。
 *   - secret 値の本体は出力しない (length 表示のみ)。
 *   - TypeScript strict + verbatimModuleSyntax + exactOptionalPropertyTypes 互換。
 *   - 絵文字非使用 (CLAUDE.md `feedback_no_emoji`)。
 *   - dotenv 依存なし (自前パーサ、`pnpm install` 不要で動作)。
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

type Tier1Field = {
  /** env var 名 (process.env のキー) */
  envVar: string;
  /** Vault item / field の path (op:// 形式の正規 path、文書化用) */
  vaultPath: string;
  /** Vault 投入トリガとなる残課題 ID (RC-2/3/6 等) */
  rc: string;
};

const TIER1_FIELDS: readonly Tier1Field[] = [
  { envVar: 'SUPABASE_SERVICE_ROLE_KEY', vaultPath: 'op://prj019/supabase/service_role_key', rc: 'RC-Vault-Supabase' },
  { envVar: 'SUPABASE_DB_URL',           vaultPath: 'op://prj019/supabase/db_url',           rc: 'RC-Vault-Supabase' },
  { envVar: 'SLACK_WEBHOOK_HITL',        vaultPath: 'op://prj019/slack/webhook_hitl',        rc: 'RC-3' },
  { envVar: 'SLACK_WEBHOOK_MONITOR',     vaultPath: 'op://prj019/slack/webhook_monitor',     rc: 'RC-3' },
  { envVar: 'SLACK_WEBHOOK_DRILL',       vaultPath: 'op://prj019/slack/webhook_drill',       rc: 'RC-3' },
  { envVar: 'RESEND_API_KEY',            vaultPath: 'op://prj019/resend/api_key',            rc: 'RC-Vault-Resend' },
  { envVar: 'OWNER_NOTIFY_EMAIL',        vaultPath: 'op://prj019/notify/owner_email',        rc: 'RC-6' },
  { envVar: 'DEV_NOTIFY_EMAIL',          vaultPath: 'op://prj019/notify/dev_email',          rc: 'RC-6' },
  { envVar: 'GITHUB_PAT_READ_ONLY',      vaultPath: 'op://prj019/github/pat_read_only',      rc: 'RC-2' },
] as const;

/**
 * Round 6 G-08 hotfix (CEO 2026-05-04): DEC-019-053 v15.2 整合スコープ。
 *
 * openclaw-monitor.yml workflow が実際に使う 7 fields のみを検証する scope。
 * Supabase 2 fields は Phase 1 W3 DB 連携 workflow 追加時に登録予定 (RC-7) で、
 * それまでは GitHub Actions Secrets 未登録 = 空文字 = missing で workflow が落ちる。
 * `--scope=workflow` 指定時は Supabase 2 を除外して 7 fields のみ検証する。
 */
const WORKFLOW_SCOPE_FIELDS: ReadonlySet<string> = new Set([
  'SLACK_WEBHOOK_HITL',
  'SLACK_WEBHOOK_MONITOR',
  'SLACK_WEBHOOK_DRILL',
  'RESEND_API_KEY',
  'OWNER_NOTIFY_EMAIL',
  'DEV_NOTIFY_EMAIL',
  'GITHUB_PAT_READ_ONLY',
]);

type Scope = 'all' | 'workflow';

function parseScope(argv: readonly string[]): Scope {
  for (const arg of argv) {
    if (arg === '--scope=workflow') return 'workflow';
    if (arg === '--scope=all') return 'all';
  }
  return 'all';
}

function fieldsForScope(scope: Scope): readonly Tier1Field[] {
  if (scope === 'workflow') {
    return TIER1_FIELDS.filter((f) => WORKFLOW_SCOPE_FIELDS.has(f.envVar));
  }
  return TIER1_FIELDS;
}

type Status = 'resolved' | 'unresolved' | 'missing';
type LoadMode = 'op-run-resolved' | 'direct-dotfile' | 'direct-no-dotfile';

interface CheckResult {
  envVar: string;
  status: Status;
  /** unresolved 時の op:// path (display 用、secret ではない) */
  unresolvedPath?: string;
  /** resolved 時の文字列長 (本体は出さない) */
  length?: number;
  /** 投入トリガ ID */
  rc: string;
}

/**
 * 簡易 .env パーサ (dotenv 依存回避)。
 * - `KEY=VALUE` 形式
 * - `#` 行頭コメント / 末尾 inline コメントは未対応 (op://reference は # を含まないので問題なし)
 * - クォート (`"..."`, `'...'`) は除去
 * - 空行 / コメント行 / `=` を含まない行は無視
 * - export prefix は除去
 */
function parseDotEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = content.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) continue;
    const stripped = line.startsWith('export ') ? line.slice('export '.length).trim() : line;
    const eq = stripped.indexOf('=');
    if (eq < 0) continue;
    const key = stripped.slice(0, eq).trim();
    if (key === '') continue;
    let value = stripped.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

interface LoadOutcome {
  mode: LoadMode;
  /** classify に使う最終 env (process.env と .env.local merged) */
  effectiveEnv: Record<string, string | undefined>;
  /** mode 表示用 detail (path 等) */
  detail: string;
}

function isResolvedAlready(env: NodeJS.ProcessEnv): boolean {
  // op-run 経由なら少なくとも 1 つ以上の Tier 1 field が op:// 以外の literal で渡ってきているはず
  // (Vault 投入済 field のみ resolved になる、未投入は op:// のまま literal が渡る — その場合は direct と区別不能)
  // → 「process.env に Tier 1 field の **どれか 1 つでも非 op:// 値** があれば op-run 由来と判定」
  for (const f of TIER1_FIELDS) {
    const v = env[f.envVar];
    if (v !== undefined && v !== '' && !v.startsWith('op://')) {
      return true;
    }
  }
  return false;
}

function loadEnv(): LoadOutcome {
  // __dirname 相当 (ESM)
  const here = dirname(fileURLToPath(import.meta.url));
  const dotenvPath = resolve(here, '../.env.local');

  // 1. 既に op run 等で env が解決済みかを先に判定
  if (isResolvedAlready(process.env)) {
    return {
      mode: 'op-run-resolved',
      effectiveEnv: process.env,
      detail: 'env from upstream (op run resolved values detected)',
    };
  }

  // 2. .env.local が読めるなら fallback
  if (existsSync(dotenvPath)) {
    const content = readFileSync(dotenvPath, 'utf8');
    const parsed = parseDotEnv(content);
    // process.env を base に、parsed で **未定義のキーのみ** 補完 (process.env 優先)
    const merged: Record<string, string | undefined> = { ...process.env };
    for (const [k, v] of Object.entries(parsed)) {
      if (merged[k] === undefined || merged[k] === '') {
        merged[k] = v;
      }
    }
    return {
      mode: 'direct-dotfile',
      effectiveEnv: merged,
      detail: `loaded ${dotenvPath} via internal parser`,
    };
  }

  // 3. .env.local も無い
  return {
    mode: 'direct-no-dotfile',
    effectiveEnv: process.env,
    detail: `.env.local not found at ${dotenvPath}`,
  };
}

function classify(value: string | undefined): { status: Status; length?: number; unresolvedPath?: string } {
  if (value === undefined || value === '') {
    return { status: 'missing' };
  }
  if (value.startsWith('op://')) {
    return { status: 'unresolved', unresolvedPath: value };
  }
  return { status: 'resolved', length: value.length };
}

function pad(s: string, width: number): string {
  if (s.length >= width) return s;
  return s + ' '.repeat(width - s.length);
}

function checkTier1(
  env: Record<string, string | undefined>,
  scope: Scope = 'all',
): CheckResult[] {
  return fieldsForScope(scope).map((f) => {
    const c = classify(env[f.envVar]);
    const r: CheckResult = { envVar: f.envVar, status: c.status, rc: f.rc };
    if (c.length !== undefined) r.length = c.length;
    if (c.unresolvedPath !== undefined) r.unresolvedPath = c.unresolvedPath;
    return r;
  });
}

function formatRow(r: CheckResult): string {
  const name = pad(r.envVar, 30);
  const tag = pad(`[${r.status}]`, 13);
  if (r.status === 'resolved') {
    return `  ${name} ${tag} length=${r.length ?? 0}`;
  }
  if (r.status === 'unresolved') {
    return `  ${name} ${tag} ${r.unresolvedPath ?? ''}`;
  }
  return `  ${name} ${tag}`;
}

function buildSummary(results: ReadonlyArray<CheckResult>): {
  resolved: number;
  unresolved: number;
  missing: number;
  pendingRcs: string[];
} {
  let resolved = 0;
  let unresolved = 0;
  let missing = 0;
  const pendingSet = new Set<string>();
  for (const r of results) {
    if (r.status === 'resolved') resolved += 1;
    else if (r.status === 'unresolved') {
      unresolved += 1;
      pendingSet.add(r.rc);
    } else {
      missing += 1;
      pendingSet.add(r.rc);
    }
  }
  return { resolved, unresolved, missing, pendingRcs: [...pendingSet].sort() };
}

function nextActionMessage(results: ReadonlyArray<CheckResult>): string | undefined {
  const blockers = results.filter((r) => r.status !== 'resolved');
  if (blockers.length === 0) return undefined;
  const items = blockers
    .map((r) => {
      if (r.status === 'unresolved') return r.unresolvedPath ?? r.envVar;
      return `${r.envVar} (env 未定義)`;
    })
    .join(', ');
  return `Vault に下記を投入してください: ${items}`;
}

function modeBanner(outcome: LoadOutcome): string {
  if (outcome.mode === 'op-run-resolved') {
    return `[mode] op-run resolved — ${outcome.detail}`;
  }
  if (outcome.mode === 'direct-dotfile') {
    return `[mode] direct (.env.local loaded via internal parser) — ${outcome.detail}`;
  }
  return `[mode] direct (no .env.local) — ${outcome.detail}`;
}

/**
 * Round 6 G-08: CI mode (--ci flag)。
 *
 * GitHub Actions workflow openclaw-monitor.yml の Run check step 直前に preflight ステップとして
 * 走らせる用途。env validation で 9 fields 全て resolved を確認し、いずれか未解決なら fail-fast。
 *
 * 通常モード (--ci 無し) は dev mode として、Vault 未投入でも動作するよう exit 1 で
 * unresolved/missing を許容するが、CI mode では unresolved/missing は exit 2 で fail-fast。
 *
 * exit codes:
 *   0  : all resolved (CI / dev 共通)
 *   1  : unresolved/missing あり (dev mode のみ — workflow 続行可)
 *   2  : CI mode で unresolved/missing 検出 → fail-fast
 */
function isCiMode(argv: readonly string[]): boolean {
  return argv.includes('--ci');
}

function main(argv: readonly string[] = process.argv.slice(2)): number {
  const cwd = process.cwd();
  const ci = isCiMode(argv);
  const scope = parseScope(argv);
  const fieldCount = fieldsForScope(scope).length;
  const outcome = loadEnv();
  // eslint-disable-next-line no-console
  console.error(modeBanner(outcome));
  if (ci) {
    // eslint-disable-next-line no-console
    console.error(
      `[mode] --ci enabled (G-08 / Round 6 fail-fast on unresolved) scope=${scope} fields=${fieldCount}`,
    );
  }
  // eslint-disable-next-line no-console
  console.log(`Tier 1 resolution check (cwd=${cwd}, scope=${scope})`);
  const results = checkTier1(outcome.effectiveEnv, scope);
  for (const r of results) {
    // eslint-disable-next-line no-console
    console.log(formatRow(r));
  }
  const s = buildSummary(results);
  // eslint-disable-next-line no-console
  console.log('');
  // eslint-disable-next-line no-console
  console.log(`Summary: ${s.resolved} resolved, ${s.unresolved} unresolved, ${s.missing} missing.`);
  const next = nextActionMessage(results);
  if (next !== undefined) {
    // eslint-disable-next-line no-console
    console.log(`Next action: ${next}`);
    // eslint-disable-next-line no-console
    console.log(`Pending RCs: ${s.pendingRcs.join(', ')}`);
    if (ci) {
      // eslint-disable-next-line no-console
      console.error(`[ci] FAIL: ${s.unresolved + s.missing} field(s) not resolved. CI fail-fast.`);
      return 2;
    }
    return 1;
  }
  // eslint-disable-next-line no-console
  console.log(`All Tier 1 fields resolved (scope=${scope}, ${fieldCount} fields). Live smoke is now safe to run.`);
  if (ci) {
    // eslint-disable-next-line no-console
    console.log(`[ci] PASS: ${fieldCount} fields all resolved (scope=${scope}). Proceeding to Run check.`);
  }
  return 0;
}

// Round 6 G-08: import 時に process.exit が走るのを防ぐ。
// 直接 `tsx scripts/preflight-env.ts` で起動された時のみ exit する。
function isDirectInvocation(): boolean {
  try {
    const here = fileURLToPath(import.meta.url);
    const argv1 = process.argv[1];
    if (argv1 === undefined) return false;
    // path 比較は OS 依存 (Windows は case insensitive のため lower-case 比較)
    return here.toLowerCase() === argv1.toLowerCase();
  } catch {
    return false;
  }
}

if (isDirectInvocation()) {
  const exitCode = main();
  process.exit(exitCode);
}

// 内部 helpers をテスト容易性のため named export
export {
  TIER1_FIELDS,
  WORKFLOW_SCOPE_FIELDS,
  classify,
  checkTier1,
  formatRow,
  buildSummary,
  nextActionMessage,
  parseDotEnv,
  isResolvedAlready,
  modeBanner,
  isCiMode,
  parseScope,
  fieldsForScope,
};
export type { Tier1Field, Status, CheckResult, LoadMode, LoadOutcome, Scope };
