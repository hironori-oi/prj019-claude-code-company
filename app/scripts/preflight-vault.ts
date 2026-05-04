/**
 * PRJ-019 Clawbridge — Pre-flight 1Password Vault inventory check (v2.2 hotfix)
 *
 * 出典: DEC-019-048 (1Password CLI 採択) / DEC-019-053 (2-tier 設計)
 *       v2.2 hotfix (`dev-1password-slack-integration-v2-2.md`)
 *
 * 目的:
 *   `op item list --vault=prj019 --format=json` で Vault 内の item 一覧を取得し、
 *   期待 5 items × 9 fields のうちどれが登録済かを可視化する。
 *   Vault 構築途中 (op run all-or-nothing で abort される段階) でも進捗確認できる。
 *
 * 実行 (cwd = app/, Windows PowerShell + Node 22+ + pnpm):
 *     pnpm tsx scripts/preflight-vault.ts
 *
 * 出力例 (Vault が空):
 *     Vault prj019 inventory check
 *       [x] supabase   not found in vault
 *       [x] slack      not found in vault
 *       [x] resend     not found in vault
 *       [x] notify     not found in vault
 *       [x] github     not found in vault
 *
 *     Summary: 0/5 items, 0/9 fields registered.
 *     Next action: 5 items を Vault `prj019` に作成してください (RC-2/3/6 計 9 fields)。
 *
 * 制約:
 *   - secret 値の本体は出力 **禁止** (field 名のみ表示)
 *   - op CLI 未導入 / signin 未済の場合は親切なエラーメッセージ
 *   - TypeScript strict + verbatimModuleSyntax + exactOptionalPropertyTypes 互換
 *   - 絵文字非使用 (CLAUDE.md `feedback_no_emoji`)
 */

import { spawnSync } from 'node:child_process';

interface ExpectedItem {
  /** Vault item name (op item の `title`) */
  itemName: string;
  /** その item に属する期待 field 名 */
  fields: readonly string[];
  /** 投入トリガとなる残課題 ID */
  rc: string;
}

const EXPECTED_ITEMS: readonly ExpectedItem[] = [
  { itemName: 'supabase', fields: ['service_role_key', 'db_url'],                   rc: 'RC-Vault-Supabase' },
  { itemName: 'slack',    fields: ['webhook_hitl', 'webhook_monitor', 'webhook_drill'], rc: 'RC-3' },
  { itemName: 'resend',   fields: ['api_key'],                                       rc: 'RC-Vault-Resend' },
  { itemName: 'notify',   fields: ['owner_email', 'dev_email'],                      rc: 'RC-6' },
  { itemName: 'github',   fields: ['pat_read_only'],                                 rc: 'RC-2' },
] as const;

const VAULT = 'prj019';

interface OpItemListEntry {
  id?: string;
  title?: string;
  vault?: { id?: string; name?: string };
}

interface OpItemFieldEntry {
  id?: string;
  label?: string;
  type?: string;
  /** value は取得しない (secret 本体保護) — 念のため型のみ宣言 */
  value?: string;
}

interface OpItemGetResult {
  id?: string;
  title?: string;
  fields?: ReadonlyArray<OpItemFieldEntry>;
}

interface ItemReport {
  itemName: string;
  exists: boolean;
  rc: string;
  /** field 名 → 存在するかどうか (item 不在なら全て false) */
  fieldStatus: Record<string, boolean>;
}

interface RunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  status: number | null;
}

function runOp(args: ReadonlyArray<string>): RunResult {
  const r = spawnSync('op', [...args], {
    encoding: 'utf8',
    shell: false,
  });
  if (r.error) {
    return { ok: false, stdout: '', stderr: String(r.error.message), status: null };
  }
  return {
    ok: r.status === 0,
    stdout: r.stdout ?? '',
    stderr: r.stderr ?? '',
    status: r.status,
  };
}

function diagnoseOpFailure(result: RunResult): string {
  const stderr = result.stderr.toLowerCase();
  if (stderr.includes('enoent') || stderr.includes('not found')) {
    return [
      '1Password CLI (op) が見つかりません。',
      '  Windows: winget install AgileBits.1Password.CLI',
      '  macOS:   brew install --cask 1password-cli',
      'インストール後、`op signin` を実行してください。',
    ].join('\n');
  }
  if (stderr.includes('not currently signed in') || stderr.includes('session') || stderr.includes('signin')) {
    return '1Password CLI が signin 状態ではありません。`op signin` を実行してください。';
  }
  if (stderr.includes(`vault "${VAULT}"`) || stderr.includes('isn\'t a vault') || stderr.includes('vault not found')) {
    return `Vault \`${VAULT}\` が存在しないか、現在のアカウントから見えません。1Password GUI で Vault を作成し、CLI セッションのアカウントから aksesss できるか確認してください。`;
  }
  return `op コマンドが失敗しました (exit=${result.status ?? 'n/a'}):\n${result.stderr.trim()}`;
}

function listVaultItems(): { ok: true; items: ReadonlyArray<OpItemListEntry> } | { ok: false; message: string } {
  const r = runOp(['item', 'list', `--vault=${VAULT}`, '--format=json']);
  if (!r.ok) {
    return { ok: false, message: diagnoseOpFailure(r) };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(r.stdout);
  } catch (e) {
    return { ok: false, message: `op item list の JSON parse に失敗: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (!Array.isArray(parsed)) {
    return { ok: false, message: `op item list が配列を返しませんでした (got: ${typeof parsed})` };
  }
  return { ok: true, items: parsed as ReadonlyArray<OpItemListEntry> };
}

function getItemFields(itemName: string): { ok: true; fields: ReadonlyArray<string> } | { ok: false; message: string } {
  const r = runOp(['item', 'get', itemName, `--vault=${VAULT}`, '--format=json']);
  if (!r.ok) {
    return { ok: false, message: diagnoseOpFailure(r) };
  }
  let parsed: OpItemGetResult;
  try {
    parsed = JSON.parse(r.stdout) as OpItemGetResult;
  } catch (e) {
    return { ok: false, message: `op item get ${itemName} の JSON parse に失敗: ${e instanceof Error ? e.message : String(e)}` };
  }
  const labels: string[] = [];
  for (const f of parsed.fields ?? []) {
    const label = f.label;
    if (typeof label === 'string' && label.length > 0) {
      labels.push(label);
    }
  }
  return { ok: true, fields: labels };
}

function buildReports(itemTitles: ReadonlySet<string>): ItemReport[] {
  const reports: ItemReport[] = [];
  for (const expected of EXPECTED_ITEMS) {
    const exists = itemTitles.has(expected.itemName);
    const fieldStatus: Record<string, boolean> = {};
    if (!exists) {
      for (const f of expected.fields) fieldStatus[f] = false;
      reports.push({ itemName: expected.itemName, exists, rc: expected.rc, fieldStatus });
      continue;
    }
    const detail = getItemFields(expected.itemName);
    if (!detail.ok) {
      // 取得失敗 → field は不明扱い (false)
      for (const f of expected.fields) fieldStatus[f] = false;
      reports.push({ itemName: expected.itemName, exists, rc: expected.rc, fieldStatus });
      continue;
    }
    const labelSet = new Set(detail.fields);
    for (const f of expected.fields) {
      fieldStatus[f] = labelSet.has(f);
    }
    reports.push({ itemName: expected.itemName, exists, rc: expected.rc, fieldStatus });
  }
  return reports;
}

function pad(s: string, width: number): string {
  if (s.length >= width) return s;
  return s + ' '.repeat(width - s.length);
}

function formatItemRow(r: ItemReport): string {
  const name = pad(r.itemName, 10);
  const expected = EXPECTED_ITEMS.find((e) => e.itemName === r.itemName);
  if (!r.exists) {
    return `  [x] ${name} not found in vault`;
  }
  const parts = (expected?.fields ?? []).map((f) => `${f} (${r.fieldStatus[f] ? 'o' : 'x'})`);
  return `  [o] ${name} fields: ${parts.join(', ')}`;
}

function summarize(reports: ReadonlyArray<ItemReport>): {
  itemsRegistered: number;
  fieldsRegistered: number;
  totalItems: number;
  totalFields: number;
  pendingRcs: string[];
} {
  let itemsRegistered = 0;
  let fieldsRegistered = 0;
  let totalFields = 0;
  const pending = new Set<string>();
  for (const r of reports) {
    const expected = EXPECTED_ITEMS.find((e) => e.itemName === r.itemName);
    const expectedFields = expected?.fields.length ?? 0;
    totalFields += expectedFields;
    if (r.exists) itemsRegistered += 1;
    let allFieldsOk = true;
    for (const f of Object.keys(r.fieldStatus)) {
      if (r.fieldStatus[f]) fieldsRegistered += 1;
      else allFieldsOk = false;
    }
    if (!r.exists || !allFieldsOk) pending.add(r.rc);
  }
  return {
    itemsRegistered,
    fieldsRegistered,
    totalItems: EXPECTED_ITEMS.length,
    totalFields,
    pendingRcs: [...pending].sort(),
  };
}

function nextAction(reports: ReadonlyArray<ItemReport>): string | undefined {
  const missingItems = reports.filter((r) => !r.exists).map((r) => r.itemName);
  const incompleteItems = reports
    .filter((r) => r.exists)
    .map((r) => {
      const missing = Object.entries(r.fieldStatus)
        .filter(([, ok]) => !ok)
        .map(([k]) => k);
      return missing.length > 0 ? { item: r.itemName, fields: missing } : null;
    })
    .filter((x): x is { item: string; fields: string[] } => x !== null);
  const parts: string[] = [];
  if (missingItems.length > 0) {
    parts.push(`未作成 items: ${missingItems.join(', ')}`);
  }
  if (incompleteItems.length > 0) {
    const detail = incompleteItems.map((x) => `${x.item}{${x.fields.join(',')}}`).join(', ');
    parts.push(`field 不足: ${detail}`);
  }
  if (parts.length === 0) return undefined;
  return parts.join(' / ');
}

function main(): number {
  // eslint-disable-next-line no-console
  console.log(`Vault ${VAULT} inventory check`);
  const list = listVaultItems();
  if (!list.ok) {
    // eslint-disable-next-line no-console
    console.error(list.message);
    return 2;
  }
  const titles = new Set<string>();
  for (const it of list.items) {
    if (typeof it.title === 'string' && it.title.length > 0) {
      titles.add(it.title);
    }
  }
  const reports = buildReports(titles);
  for (const r of reports) {
    // eslint-disable-next-line no-console
    console.log(formatItemRow(r));
  }
  const s = summarize(reports);
  // eslint-disable-next-line no-console
  console.log('');
  // eslint-disable-next-line no-console
  console.log(`Summary: ${s.itemsRegistered}/${s.totalItems} items, ${s.fieldsRegistered}/${s.totalFields} fields registered.`);
  const next = nextAction(reports);
  if (next !== undefined) {
    // eslint-disable-next-line no-console
    console.log(`Next action: ${next}`);
    // eslint-disable-next-line no-console
    console.log(`Pending RCs: ${s.pendingRcs.join(', ')}`);
    return 1;
  }
  // eslint-disable-next-line no-console
  console.log('All expected items/fields registered. `pnpm preflight:resolved` で resolved 検証に進めます。');
  return 0;
}

const exit = main();
process.exit(exit);

// テスト容易性のため named export
export {
  EXPECTED_ITEMS,
  buildReports,
  formatItemRow,
  summarize,
  nextAction,
  diagnoseOpFailure,
};
export type { ExpectedItem, ItemReport, OpItemListEntry, OpItemGetResult };
