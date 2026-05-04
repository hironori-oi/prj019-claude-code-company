最終更新: 2026-05-03 (v2、DEC-019-048/049 反映) / 起案: 秘書部門 / 対象: Owner

# PRJ-019 / PRJ-020 — ローカル環境 + Supabase セットアップ手順

本書は Owner（あなた）が **Phase B (60 分) + Phase C (45 分)** で実施するローカル環境 + Supabase の構築手順をコマンド単位で示します。**Windows 11 + WSL2 (Ubuntu 22.04) 主想定**、macOS / Linux 補足ありです。

**v2 更新サマリ**:
- DEC-019-048 採択により env 注入は `op run --env-file=.env.local --` 経由必須
- `.env.local` 内は `op://prj019/...` reference 記法のみ
- GitHub Actions secrets は個別投入 or 1Password Service Account integration の選択肢を併記（placeholder）

参照: `00-owner-setup-master-checklist.md` §3 §4 / `01-saas-accounts-and-secrets.md` §2.7 / `app/README.md` §monorepo セットアップ手順 / `decisions.md` DEC-019-048

---

## §1 前提環境チェック

### 1.1 OS 環境

| OS | 推奨 | 備考 |
|---|---|---|
| Windows 11 + WSL2 (Ubuntu 22.04) | 主想定 | claude-bridge subprocess の Linux 経路で安定動作 |
| macOS 14+ (Apple Silicon) | 補足 | better-sqlite3 等 native modules は問題なくビルド |
| Linux (Ubuntu 22.04+ / Debian 12+) | 補足 | apt 系で `build-essential` 必須 |

WSL2 確認コマンド (PowerShell):

```powershell
wsl --list --verbose
# 期待: Ubuntu-22.04  Running  2
```

WSL2 未導入の場合: `wsl --install -d Ubuntu-22.04` （要再起動）。

### 1.2 Node.js 24.x インストール (nvm 推奨)

```bash
# WSL2 / Ubuntu / macOS
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc

nvm install 24.11.1
nvm use 24.11.1
nvm alias default 24.11.1

node -v   # v24.11.1
```

### 1.3 pnpm 9.x インストール

```bash
corepack enable
corepack prepare pnpm@9.12.0 --activate

pnpm -v   # 9.12.0
```

### 1.4 Claude Code CLI 最新版

```bash
npm install -g @anthropic-ai/claude-code

claude --version   # 最新版番号確認
```

初回起動時に本人 OAuth フロー: `claude` を実行 → ブラウザでログイン → token は CLI 内部に保存（env には保存されない、これが正しい挙動）。

---

## §2 リポジトリ確認 + 依存解決

### 2.1 リポジトリ確認 (既 clone 済み想定)

```bash
cd ~/Desktop/claude-code-company   # Windows なら /mnt/c/Users/hiron/Desktop/claude-code-company
git status                          # 現在 branch 確認

cd projects/PRJ-019/app
ls -la                              # README.md / package.json / supabase/ / policies/ 等が見える
```

### 2.2 `pnpm install` 実行

```bash
cd projects/PRJ-019/app
pnpm install
```

#### 想定エラーと対処 3 パターン

**パターン 1: `node-gyp` ビルド失敗（native modules）**

```bash
# 症状: bcrypt / better-sqlite3 等のビルド時に gyp ERR
# 対処 (Ubuntu/WSL2):
sudo apt update
sudo apt install -y build-essential python3 python3-pip
pnpm install --force
```

**パターン 2: `EACCES` permission denied**

```bash
# 症状: pnpm-store にアクセスできない
# 対処:
pnpm store path                # 現在 store 確認
sudo chown -R $(whoami) ~/.local/share/pnpm
pnpm install
```

**パターン 3: `ETIMEDOUT` / レジストリ接続失敗**

```bash
# 症状: npm registry timeout
# 対処:
pnpm config set registry https://registry.npmjs.org/
pnpm install --network-timeout=120000
```

### 2.3 動作確認 (Owner 実行は typecheck + test まで、DEC-019-048 で `op run --` 経由)

```bash
# 1Password CLI で sign-in 済み前提（未 sign-in なら op signin）
op run --env-file=.env.local -- pnpm typecheck      # TypeScript strict、エラー 0 件
op run --env-file=.env.local -- pnpm test           # Vitest 全件 (live integration test は default 除外)
op run --env-file=.env.local -- pnpm lint           # eslint flat config、warning 程度は許容
```

注: typecheck / lint は env を必要としないため `op run --` を省略可。test は Supabase 接続を伴うケースで必要。

ここで `pnpm test` が緑にならない場合、Owner では復旧困難なため **`/secretary` 経由で Dev に escalation** してください。

---

## §3 Supabase CLI セットアップ

### 3.1 Supabase CLI v2 インストール

```bash
# WSL2 / Ubuntu / macOS
npm install -g supabase

supabase --version   # 1.200+ 期待
```

代替（推奨されない）: Homebrew, `scoop install supabase`。

### 3.2 Supabase login

```bash
supabase login
```

ブラウザで Supabase dashboard に遷移、access token 発行（dashboard → Account → Access Tokens → Generate new token、name は `clawbridge-cli`、scope はデフォルト）→ token を CLI に貼り付け。

---

## §4 Supabase プロジェクト link

### 4.1 既存 supabase/ ディレクトリ尊重

`projects/PRJ-019/app/supabase/` には既に `migrations/` と `policies/` が配置されており、`supabase init` は **不要**です。実行すると既存 config が上書きされる可能性があるため、以下手順をスキップしないでください。

確認コマンド:

```bash
cd projects/PRJ-019/app
ls supabase/
# 期待: migrations/ policies/  （他に config.toml があれば残す）
```

`supabase/config.toml` が存在しない場合のみ:

```bash
supabase init    # 既存ファイルを上書きしない確認プロンプト出る、 N で skip 可
```

### 4.2 project link

```bash
cd projects/PRJ-019/app
# 1Password CLI 経由で project_ref 解決
op run --env-file=.env.local -- bash -c 'supabase link --project-ref $SUPABASE_PROJECT_REF'
# password 入力プロンプト: Supabase project の DB password 入力
```

または手動:

```bash
supabase link --project-ref $(op read op://prj019/supabase/project_ref)
```

`<your-project-ref>` は `https://<ref>.supabase.co` の `<ref>` 部分。

成功すると `.supabase/config` に link 情報が保存されます（commit しない、`.gitignore` 済み）。

---

## §5 8 migration 適用 + RLS Policy 適用

### 5.1 migration 適用

```bash
cd projects/PRJ-019/app
op run --env-file=.env.local -- supabase db push
```

8 ファイル順次適用ログ確認:

```
Applying migration 20260503000001_hitl_requests.sql...
Applying migration 20260503000002_audit_log.sql...
Applying migration 20260503000003_policy_versions.sql...
Applying migration 20260503000004_policy_audit_log.sql...
Applying migration 20260503000005_proposals.sql...
Applying migration 20260503000006_cost_ledger.sql...
Applying migration 20260503000007_runtime_wrapper_state.sql...
Applying migration 20260503000008_knowledge_extraction_queue.sql...
Finished supabase db push.
```

エラー時は §8 トラブルシューティング参照。

### 5.2 RLS Policy 適用 (8 ファイル)

`supabase/policies/` 配下 8 ファイルは Supabase Dashboard → SQL Editor で順次実行してください。`supabase db push` には含まれない（policy SQL は migration と分離管理、DEC-019-033 §⑤ trigger）。

実行順序（必ずこの順）:

```
01_hitl_requests.sql
02_audit_log.sql
03_policy_versions.sql
04_policy_audit_log.sql
05_proposals.sql
06_cost_ledger.sql
07_runtime_wrapper_state.sql
08_knowledge_extraction_queue.sql
```

各ファイル内容を SQL Editor にコピペ → Run。エラー 0 で次のファイルへ。

代替（CLI 経由、psql 必要、`op run` で env 注入）:

```bash
op run --env-file=.env.local -- bash -c '
for f in supabase/policies/*.sql; do
  psql "$SUPABASE_DB_URL" -f "$f"
done
'
```

---

## §6 `open_claw_restricted` DB role 作成

DEC-019-033 §⑤ priviledge escalation 防止の物理実装として、Open Claw subprocess は `open_claw_restricted` role 経由でのみ DB アクセスします。Supabase Dashboard → SQL Editor で以下を実行:

```sql
-- open_claw_restricted role 作成
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'open_claw_restricted') then
    create role open_claw_restricted nologin;
  end if;
end $$;

-- 最小権限付与: SELECT は organization/knowledge/, projects/PRJ-*/app/ のみ想定
-- (実際の row-level 制限は RLS policy + Casbin で実施)
grant usage on schema public to open_claw_restricted;
grant select on public.proposals             to open_claw_restricted;
grant select on public.cost_ledger           to open_claw_restricted;
grant select on public.knowledge_extraction_queue to open_claw_restricted;
grant insert on public.hitl_requests         to open_claw_restricted;

-- service_role が持つ INSERT / UPDATE / DELETE は明示 revoke
revoke insert, update, delete on public.policy_versions    from open_claw_restricted;
revoke insert, update, delete on public.policy_audit_log   from open_claw_restricted;
revoke insert, update, delete on public.audit_log          from open_claw_restricted;
revoke insert, update, delete on public.runtime_wrapper_state from open_claw_restricted;

-- 確認
\du open_claw_restricted
```

実行後 `\du` で role 存在確認。

---

## §7 Auth provider 設定 (Owner 専用、Email + Magic Link)

### 7.1 Supabase Dashboard 設定

1. Project → Authentication → Providers → Email を有効化
2. **Magic Link を ON、Email/Password は OFF**（Owner 1 人運用のため）
3. **Redirect URLs** に追加:
   - `http://localhost:3000/auth/callback`（ローカル開発）
   - `https://<your-vercel-domain>.vercel.app/auth/callback`（preview / production）
4. **Email Templates** → Magic Link template を確認（デフォルトでも OK）

### 7.2 Owner 自身を auth user として登録

```sql
-- Supabase Dashboard → Authentication → Users → Add user → Email で Owner email 登録
-- もしくは SQL Editor で:
-- 注: 通常は dashboard UI 経由を推奨
```

登録後、Owner email に magic link が届くことを確認 → クリック → ログイン成功。

### 7.3 Owner の auth.users.id を取得し `.env.local` に投入

```sql
select id from auth.users where email = '<your-email>';
-- 結果の uuid を CLAWBRIDGE_OWNER_USER_ID に投入
```

### 7.4 tenant_id 生成 (single-tenant)

```sql
select gen_random_uuid();
-- 結果の uuid を CLAWBRIDGE_TENANT_ID に投入
```

両 uuid を `projects/PRJ-019/app/.env.local` に記入。

---

## §8 Test query 5 件 (Phase E 動作確認用)

Supabase Dashboard → SQL Editor で以下を順次実行し、期待結果と一致することを確認してください。

### Test 1: 8 テーブル存在確認

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'hitl_requests', 'audit_log', 'policy_versions', 'policy_audit_log',
    'proposals', 'cost_ledger', 'runtime_wrapper_state', 'knowledge_extraction_queue'
  )
order by table_name;
-- 期待: 8 行
```

### Test 2: RLS Enabled 確認

```sql
select schemaname, tablename, rowsecurity, forcerowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'hitl_requests', 'audit_log', 'policy_versions', 'policy_audit_log',
    'proposals', 'cost_ledger', 'runtime_wrapper_state', 'knowledge_extraction_queue'
  );
-- 期待: 全 8 行で rowsecurity = true, forcerowsecurity = true
```

### Test 3: audit_log SHA-256 hash chain 動作確認

```sql
-- append_audit_log 経由で 1 件投入
select public.append_audit_log(
  '<your-tenant-id>'::uuid,
  'owner',
  '<your-owner-user-id>',
  'setup_test',
  'test',
  '{"msg":"hello chain"}'::jsonb
);

-- chain 確認
select id, prev_hash, curr_hash from public.audit_log order by id desc limit 1;
-- 期待: prev_hash = '0' x 64 (genesis), curr_hash = 64 hex chars
```

### Test 4: hitl_requests CHECK constraint 動作確認

```sql
-- gate_kind の不正値で reject される
insert into public.hitl_requests (tenant_id, gate_kind, payload, default_action, sla_deadline)
values ('<tenant-id>'::uuid, 'invalid_gate', '{}'::jsonb, 'reject', now() + interval '1 hour');
-- 期待: ERROR: new row for relation "hitl_requests" violates check constraint "hitl_gate_kind_chk"
```

### Test 5: policy_versions Owner-only INSERT 確認

```sql
-- service_role 経由（dashboard SQL Editor）
insert into public.policy_versions (tenant_id, version_no, category, policy_doc, created_by)
values ('<tenant-id>'::uuid, 1, 'fs', '{"allow":["fs:projects/PRJ-*/app/**"]}'::jsonb, '<owner-user-id>'::uuid);

select count(*) from public.policy_versions where tenant_id = '<tenant-id>'::uuid;
-- 期待: 1
```

---

## §9 失敗時の rollback / re-run 手順

### 9.1 migration 失敗時の rollback

```bash
# 全テーブル drop (注意: データ消失)
psql "$SUPABASE_DB_URL" -c "
drop table if exists public.knowledge_extraction_queue cascade;
drop table if exists public.runtime_wrapper_state cascade;
drop table if exists public.cost_ledger cascade;
drop table if exists public.proposals cascade;
drop table if exists public.policy_audit_log cascade;
drop table if exists public.policy_versions cascade;
drop table if exists public.audit_log cascade;
drop table if exists public.hitl_requests cascade;
drop function if exists public.audit_log_compute_hash() cascade;
drop function if exists public.append_audit_log(uuid, text, text, text, text, jsonb) cascade;
"

# migration history clear
psql "$SUPABASE_DB_URL" -c "delete from supabase_migrations.schema_migrations;"

# 再実行
supabase db push
```

### 9.2 RLS policy 適用失敗時の re-run

```bash
# 8 policy ファイルは drop policy if exists が冒頭にあるため、何度実行しても安全
psql "$SUPABASE_DB_URL" -f supabase/policies/01_hitl_requests.sql
# ... 以下 8 ファイル
```

### 9.3 `open_claw_restricted` role 削除

```sql
drop owned by open_claw_restricted;
drop role open_claw_restricted;
```

---

## §9.5 GitHub Actions secrets 設定 (Phase D 補足、DEC-019-048 v2)

GitHub Actions で 1Password Vault `prj019` を参照する方法は 2 つ。**Phase 1 では選択肢 A を採択、Phase 2 W2 で B 移行検討**。

### 選択肢 A: 個別 secret 投入（Phase 1 default）

GitHub repo → Settings → Secrets and variables → Actions で以下 5 件を登録:

| GH secret name | 値の取得元 | 用途 |
|---|---|---|
| `SLACK_CHANGELOG_WEBHOOK_URL` | `op read op://prj019/slack/webhook_monitor` | openclaw-monitor 通知 |
| `RESEND_API_KEY` | `op read op://prj019/resend/api_key` | HITL メール |
| `OWNER_NOTIFY_EMAIL` | Owner email（直接） | 通知先 |
| `DEV_NOTIFY_EMAIL` | Dev email（直接） | 通知先 |
| `GITHUB_PAT_READ_ONLY` | `op read op://prj019/github/pat_read_only` | OpenClaw repo 監視 |

メリット: シンプル、追加設定不要。デメリット: rotation 時に GitHub secrets も手動更新が必要。

### 選択肢 B: 1Password Service Account integration（Phase 2 placeholder）

1. 1Password で Service Account を発行（`OP_SERVICE_ACCOUNT_TOKEN` 取得）
2. GitHub Actions secrets に `OP_SERVICE_ACCOUNT_TOKEN` 1 本のみ投入
3. workflow で `1password/load-secrets-action@v2` を使用:

```yaml
# .github/workflows/openclaw-monitor.yml (placeholder)
- uses: 1password/load-secrets-action@v2
  with:
    export-env: true
  env:
    OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
    SLACK_CHANGELOG_WEBHOOK_URL: op://prj019/slack/webhook_monitor
    RESEND_API_KEY: op://prj019/resend/api_key
    GITHUB_PAT_READ_ONLY: op://prj019/github/pat_read_only
```

メリット: Vault rotate のみで全 CI に反映、GitHub secrets は 1 本のみ。デメリット: Service Account の管理が必要、Phase 2 W2 の検討事項。

**Phase 1 着手時点では選択肢 A、移行判断は Phase 2 開始前のレビューで実施**。

---

## §10 完了確認チェックリスト

- [ ] Node 24.11.1 / pnpm 9.12.0 / Claude Code CLI 最新 動作確認
- [ ] 1Password CLI sign-in 完了 (`op signin`)
- [ ] `.env.local` に `op://` reference 記述完了
- [ ] `op run --env-file=.env.local -- pnpm install` 完了
- [ ] `pnpm typecheck` エラー 0
- [ ] `op run -- supabase link` 成功、project_ref 一致
- [ ] `op run -- supabase db push` で 8 migration 適用完了
- [ ] SQL Editor で 8 RLS policy 適用完了
- [ ] `open_claw_restricted` role 作成 + 権限付与
- [ ] Auth Email/Magic Link 有効化、Owner 自身ログイン成功
- [ ] tenant_id / owner_user_id を `.env.local` に記入（実値、uuid）
- [ ] Test 1〜5 全件期待結果一致
- [ ] (Phase D) GitHub Actions secrets 5 件投入（選択肢 A、Phase 1 default）

完了したら `/secretary Phase C 完了報告 — M2 マイルストーン到達` で報告してください。

---

## §11 escalation

ローカル / Supabase 操作で困ったら **`/secretary {問い合わせ内容}`** で escalation してください。技術的内容は Dev 部門に自動 routing されます。

緊急時（DB 接続不能 / migration 全失敗 / 環境壊滅）は `/ceo` 直接でも可。

---

**v1**: 2026-05-03 起案 (秘書部門、Owner 並行作業整備)
**v2**: 2026-05-03 更新 (DEC-019-048 採択により全コマンドを `op run --env-file=.env.local --` 経由に統一、§9.5 GitHub Actions secrets 設定追記、Doppler 関連削除)
