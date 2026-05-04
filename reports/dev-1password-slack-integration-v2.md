# PRJ-019 Dev 部門報告 — 1Password CLI / Slack 3-channel 統合反映 v2 (DEC-019-053)

**作成**: 2026-05-04
**起案部門**: Dev
**対象決裁**: DEC-019-048 (1Password CLI 採択) / DEC-019-049 (Slack 新規 workspace) / **DEC-019-053 (2-tier 設計、新規)**
**Phase**: Phase 1 W0-Week2 着手前 (5/9 朝期限)
**前版**: `dev-1password-slack-integration-v1.md` (Owner 検証済 5/4 / 凍結)
**ステータス**: 実装完了、Owner Vault 登録 (Tier 1 / 9 fields) 待ち

---

## §1. 反映決裁

### DEC-019-048 (Owner 直接決裁 2026-05-03 / 維持)

> secret 管理ツールに 1Password CLI を採択。Doppler との比較で Owner が判断、既存 1Password 利用想定 + チーム拡張時のシームレス連携優位。
>
> **影響**: `.env.local` は `op://` references で記述、CI は `op run --` で env 注入、Doppler 関連手順は手順書から削除。

### DEC-019-049 (Owner 直接決裁 2026-05-03 / 維持)

> Slack workspace を新規作成方針で確定。既存 workspace 流用ではなく PRJ-019 専用 workspace「prj019-claude-code-company」相当を新規作成。
>
> **影響**: 既存業務 Slack と完全分離、HITL 通知 / monitor アラート / drill 通知の 3 channel 構成を独立運用、メンバー追加時の権限管理が明確化。

### DEC-019-053 (Owner 即決 2026-05-04 / 新規)

> v1 検証中に Owner が「8 service × 21 fields の Vault 登録は過剰」と判断。**真の secret = 4 item × 9 fields のみ Vault 登録**、それ以外 (NEXT_PUBLIC / paths / version / 定数 = 12 fields) は平文に分離する。
>
> **採択理由**:
> - NEXT_PUBLIC_* は browser 公開前提 = secret ではない (RLS で行レベル保護)
> - UUID 識別子 / path / version は環境固有定数 = 漏洩しても権限昇格に直結しない
> - 数値定数 (Spend Cap / Anthropic threshold) は仕様の一部 = リポジトリ正本で OK
> - **Owner Vault 登録を 30 分相当に圧縮** (21 fields → 9 fields = 57% 削減)
>
> **影響**:
> - `.env.example` を 4-block 構造に再構成 (Tier 1 op:// + Tier 2/3/4 平文 dummy)
> - `dev:noop` を **公式 unblock path** として正規化 (Owner 5/4 検証済 = op 未 signin で localhost:3000 表示)
> - 初回 boot は `dev:noop`、Vault 登録完了後に `dev` (op run --) に切替
> - GitHub Actions workflow は Tier 1 (Slack 3 + Resend + 2 emails + GitHub PAT = 7 fields) のみ Vault 注入、Tier 2 は workflow 内 env で直接記述

---

## §2. 変更ファイル一覧

| 区分 | ファイル | 差分行数 (概算) | 変更趣旨 |
|---|---|---|---|
| 編集 | `projects/PRJ-019/app/.env.example` | +90 / -38 | 4-block 構造に全面再構成。Tier 1 (9 fields, op://) + Tier 2 NEXT_PUBLIC (2 fields, 平文) + Tier 3 paths/version (4 fields, 平文 dummy) + Tier 4 定数 (16+ fields, 既に平文)。各 block 冒頭に Vault 影響有無 1 行明示 |
| 編集 | `projects/PRJ-019/app/web/package.json` | +3 / -2 | `_comment_secrets` を 2-tier 説明に更新、`_comment_dev_recommend` 新設 (Vault 登録前は dev:noop 推奨)、`dev:noop` のメッセージを WARN → INFO に変更 (公式 unblock path 化) |
| 編集 | `projects/PRJ-019/app/README.md` | +60 / -30 | §Setup を 2-tier 構造に書き換え (Tier 1 9 fields 表 + Tier 2 12 fields 列挙)、§Run を Path A (dev:noop / 公式 unblock) と Path B (op run --) に二分、§Secrets Management に Tier 1/Tier 2 の rotation cycle / 影響範囲表を追加、採択履歴に DEC-019-053 追記、v5 footer 追加 |
| 編集 | `projects/PRJ-019/app/scripts/openclaw-monitor/.github/workflows/openclaw-monitor.yml` | +9 / -1 | ヘッダコメントに DEC-019-053 反映条項追加、`Run check` step に Tier 2 (SLACK_CHANNEL_*) の env 直記述を追加、Tier 1 のみが secrets 注入対象であることを明示 |
| 編集 | `projects/PRJ-019/reports/dev-1password-slack-integration-v1.md` | +5 / -2 | §header に Update 注記、RC-7 追加 (DEC-019-053 で再設計 → v2 移行)、v1.1 footer 追記 |
| 新規 | `projects/PRJ-019/reports/dev-1password-slack-integration-v2.md` | +約 200 行 | 本報告書 |

合計: **新規 1 / 編集 5 = 6 ファイル**。

---

## §3. 動作確認手順 (Owner 検証用、3 ケース)

### Case 1: `dev:noop` boot (Tier 1 未解決でも localhost:3000 表示)

**目的**: Vault 登録完了前 / 1Password CLI 未導入の状態でも開発が継続できることの確認。Owner 5/4 検証済の挙動維持。

```bash
cd projects/PRJ-019/app
cp .env.example .env.local
# .env.local の Tier 1 (op://) は未解決のまま、Tier 2 (12 fields) は dummy 値が入る
pnpm install
pnpm --filter @clawbridge/web dev:noop
```

**期待**:
- `INFO: dev:noop = DEC-019-053 公式 unblock path` メッセージが表示される
- `next dev` が起動し http://localhost:3000 がブラウザで開ける
- Tier 1 を要求する API route (Supabase service_role を使う endpoint 等) は env_missing で fail-fast (これは想定通り)

### Case 2: `op run` boot (Tier 1 解決込みで全機能起動)

**目的**: Owner Vault 登録完了後、`op run --env-file=.env.local --` 経由で Tier 1 が実値解決され、全機能が起動できること。

```bash
cd projects/PRJ-019/app
op signin
pnpm --filter @clawbridge/web dev   # = op run --env-file=../.env.local -- next dev
```

**期待**:
- Next.js dev server が起動、http://localhost:3000 が表示される
- Tier 1 を要求する API route が 200 を返す (op:// が実値に解決済み)
- console に `op://...` の literal が残らない

**重要**: `.env.local` の正規配置場所は `app/.env.local`。`app/web/package.json` の `dev` script は cwd = `app/web/` から `--env-file=../.env.local` で **`app/.env.local`** を参照する。

### Case 3: GitHub Actions workflow dry run (Tier 1 のみ Vault 注入)

**目的**: `OP_SERVICE_ACCOUNT_TOKEN` のみ登録した状態で workflow が走り、Tier 1 (7 fields) が解決され、Tier 2 (SLACK_CHANNEL_*) は workflow 内 env で直接渡ることを確認。

```
1. Owner が GitHub Actions Secrets に `OP_SERVICE_ACCOUNT_TOKEN` を登録
2. Actions タブで `openclaw-monitor` workflow を `workflow_dispatch` 起動 (mode: report)
3. Run log の `Load secrets from 1Password` step が success → 7 fields が masked で展開
4. `Run check` step で SLACK_CHANNEL_HITL=#hitl 等が env に渡る (Vault 経由なし)
5. severity 検知時に Slack post が走る
```

**期待**: `Load secrets from 1Password` step が green。`SLACK_WEBHOOK_*` / `RESEND_API_KEY` / `*_NOTIFY_EMAIL` / `GITHUB_PAT_READ_ONLY` が masked、`SLACK_CHANNEL_*` は平文で env に展開。

---

## §4. Tier 1 一覧 (9 fields × 4 items, Vault 登録必須)

| # | item | field | Vault path | rotation cycle | 影響範囲 |
|---|---|---|---|---|---|
| 1 | `supabase` | `service_role_key` | `op://prj019/supabase/service_role_key` | 90 日 / 漏洩疑い時 | Web API route のみ (subprocess 注入禁止 / DEC-019-033 §⑤) |
| 2 | `supabase` | `db_url` | `op://prj019/supabase/db_url` | 90 日 / 漏洩疑い時 | CLI migrate のみ |
| 3 | `slack` | `webhook_hitl` | `op://prj019/slack/webhook_hitl` | 漏洩疑い時 / member 離脱時 | notify 層 (`#hitl` channel) |
| 4 | `slack` | `webhook_monitor` | `op://prj019/slack/webhook_monitor` | 漏洩疑い時 / member 離脱時 | notify 層 (`#monitor` channel) + GitHub Actions |
| 5 | `slack` | `webhook_drill` | `op://prj019/slack/webhook_drill` | 漏洩疑い時 / member 離脱時 | notify 層 (`#drill` channel) + GitHub Actions |
| 6 | `resend` | `api_key` | `op://prj019/resend/api_key` | 90 日 | notify 層 (Slack fallback) + GitHub Actions |
| 7 | `notify` | `owner_email` | `op://prj019/notify/owner_email` | PII 変更時 | notify 層 |
| 8 | `notify` | `dev_email` | `op://prj019/notify/dev_email` | PII 変更時 | notify 層 |
| 9 | `github` | `pat_read_only` | `op://prj019/github/pat_read_only` | 90 日 | scripts/openclaw-monitor |

**Vault item 数**: 4 (`supabase` / `slack` / `resend` + `notify` / `github`)
**field 数**: 9
**v1 比削減**: 21 fields → 9 fields (57% 削減)

---

## §5. Tier 2 一覧 (12 fields, 平文 dummy)

| 区分 | field | dummy 値 | 上書き先 |
|---|---|---|---|
| NEXT_PUBLIC | `NEXT_PUBLIC_SUPABASE_URL` | `https://example-project.supabase.co` | Vercel 環境変数 |
| NEXT_PUBLIC | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dummy JWT | Vercel 環境変数 |
| Tenant 識別子 | `CLAWBRIDGE_TENANT_ID` | `00000000-...-000` UUID | `.env.local` |
| Tenant 識別子 | `CLAWBRIDGE_OWNER_USER_ID` | `00000000-...-001` UUID | `.env.local` |
| Path | `CLAUDE_CODE_CLI_PATH` | `/usr/local/bin/claude` | `.env.local` (Windows は別 path) |
| Path | `OPENCLAW_BINARY_PATH` | `/usr/local/bin/openclaw` | `.env.local` |
| Version | `CLAUDE_CODE_PINNED_VERSION` | `2.0.0` | `.env.local` |
| Version | `OPENCLAW_PINNED_VERSION` | `0.1.0` | `.env.local` |
| 定数 (Spend) | `SPEND_CAP_MONTHLY_USD` | `300` | リポジトリ正本 |
| 定数 (Anthropic) | `ANTHROPIC_MONTHLY_CAP_USD` | `30` | リポジトリ正本 |
| 定数 (Anthropic) | `ANTHROPIC_WARN_THRESHOLD` | `24` | リポジトリ正本 |
| 定数 (Anthropic) | `ANTHROPIC_STOP_THRESHOLD` | `28.5` | リポジトリ正本 |

**注**: 上記 12 fields に加え、v1 から既に平文だった定数 (`SPEND_CAP_PROPOSAL_USD` / `SPEND_CAP_TASK_USD` / `SLACK_CHANNEL_*` / `VERCEL_*` / `CASBIN_*` / `FEATURE_*` / `AUDIT_*` / `TZ` / `NODE_ENV`) は引き続き平文維持。

---

## §6. Owner Vault 登録手順 (30 分目標、9 fields コピペ template)

### 前提

- 1Password Vault `prj019` を作成済み (Phase 1 W0-Week2 末予定 → DEC-019-053 で前倒し)
- Owner が 1Password Desktop / Web に signin 済み

### 登録手順 (4 item / 9 fields)

#### Item 1: `supabase` (2 fields)

```
Vault: prj019
Item type: API Credential (or Login)
Item name: supabase
Fields:
  service_role_key = <Supabase Dashboard > Settings > API > service_role secret key>
  db_url           = postgresql://postgres:<password>@<host>:5432/postgres
```

#### Item 2: `slack` (3 fields)

```
Vault: prj019
Item type: API Credential
Item name: slack
Fields:
  webhook_hitl    = https://hooks.slack.com/services/.../#hitl
  webhook_monitor = https://hooks.slack.com/services/.../#monitor
  webhook_drill   = https://hooks.slack.com/services/.../#drill
```

3 webhook は Slack workspace `prj019-claude-code-company` の各 channel から発行 (DEC-019-049)。

#### Item 3: `resend` + `notify` (3 fields, 同一 item で OK)

```
Vault: prj019
Item type: API Credential
Item name: resend  (notify entry の owner_email / dev_email も同一 item 内に追加可)
Fields:
  api_key     = <Resend Dashboard > API Keys から発行>
  owner_email = ai-lab@improver.jp        (CLAUDE.md userEmail と整合)
  dev_email   = <Dev 担当 email>
```

別 item に分割する場合は `notify` という item を別途作成して `owner_email` / `dev_email` を格納し、`.env.example` の op:// path (`op://prj019/notify/owner_email` / `op://prj019/notify/dev_email`) と整合させる。

#### Item 4: `github` (1 field)

```
Vault: prj019
Item type: API Credential
Item name: github
Fields:
  pat_read_only = ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

GitHub > Settings > Developer settings > Personal access tokens (classic) で `public_repo: read` のみ付与した read-only PAT を発行。

### 検証 (登録後 5 分)

```bash
cd projects/PRJ-019/app
op signin
op read op://prj019/supabase/service_role_key   # 実値が echo されること
op read op://prj019/slack/webhook_hitl
op read op://prj019/resend/api_key
op read op://prj019/github/pat_read_only
```

全て echo されたら登録成功。9 fields 全件繰り返して確認。

### 切替

```bash
# Vault 登録完了後、dev:noop → dev (op run --) に切替
pnpm --filter @clawbridge/web dev   # localhost:3000 で全機能起動
```

---

## §7. 残課題

| # | 課題 | 対応期限 | 担当 |
|---|---|---|---|
| RC-1 | **Vercel 環境変数の 1Password integration 連動** — 現状 Vercel ダッシュボードで手動入力。Tier 1 (9 fields) のみ Vercel 環境変数に反映する想定。1Password Vercel marketplace integration もしくは `vercel env pull` を `op run` でラップする方式を選定 | Phase 1 W1 (5/26〜5/30) | Dev |
| RC-2 | `OP_SERVICE_ACCOUNT_TOKEN` の発行と GitHub Actions Secrets 登録 (Owner 操作) | W0-Week2 末 | Owner |
| RC-3 | Slack workspace `prj019-claude-code-company` の作成と 3 channel + webhook 発行 (Owner 操作) | W0-Week2 末 | Owner |
| RC-4 | `app/lib/notify/slack.ts` に対する Vitest ユニットテスト追加 (retry / channel mapping / Zod validation 各 case) | Phase 1 W1 | Dev |
| RC-5 | `openclaw-monitor/src/notify.ts` の既存 vitest が新 mapping (drill / monitor) でも green 維持か再確認 | Phase 1 W1 | Dev |
| RC-6 | Vault `prj019/notify/owner_email` / `dev_email` の登録 — Phase 1 W1 で Owner 確定 | Phase 1 W1 | Owner |
| **RC-7** | **【新規 / DEC-019-053】Vercel 環境変数 9 fields 同期** — Tier 1 の 9 fields のみ Vercel project settings に登録 (Tier 2 は dummy / 既存定数で OK)。1Password Vercel integration 連動 (RC-1) と統合運用する | Phase 1 W1 | Dev + Owner |

---

## §8. dev:noop 互換確認結果

- Owner 5/4 検証済挙動 (`op` 未 signin で localhost:3000 表示) は維持
- v2 で変更した点:
  - `dev:noop` の echo メッセージを `WARN: ... troubleshooting only, NEVER use in production` から `INFO: dev:noop = DEC-019-053 公式 unblock path (Tier 2 のみ、op 未要求)。Vault 登録前 / 1Password CLI 未導入時に使用。` に変更
  - 本番禁止条項を撤回 (公式 unblock path 化)
  - `package.json` の `_comment_secrets` を 2-tier 説明に書き換え、`_comment_dev_recommend` 新設
- 動作テスト (静的検証):
  - `pnpm --filter @clawbridge/web dev:noop` の resolved コマンドは `next dev` のみ (op 経由なし)
  - `next dev` は Next.js 15 App Router 標準起動 = TS strict mode (verbatimModuleSyntax / exactOptionalPropertyTypes) 維持
  - Tier 2 (12 fields) は `.env.example` で dummy 値が入っているため、`.env.local` を cp しただけで起動可能
  - Tier 1 (9 fields) は op:// のまま env に渡るため、それを参照する API route は env_missing で fail-fast (期待挙動)

---

**v2**: 2026-05-04 起案 (DEC-019-053 反映、A〜G 全項目完了、Owner Vault 登録 (Tier 1 / 9 fields) 待ち)

---

**Errata 2026-05-04**: §3.2 Case 2 のコマンド (`node --experimental-vm-modules -e "import('./lib/notify/slack.ts')"` 系) は (1) `--env-file=web/.env.local` の path 不整合 (cwd=`app/` から正規 path は `app/.env.local`)、(2) RC-3 未完了で webhook 未解決時の pre-flight 経路欠落、(3) `node --experimental-vm-modules` は TS loader ではないため `.ts` 直接 import 不可、の 3 層で動作不能。v2.1 (`dev-1password-slack-integration-v2-1.md`) で 3 段階 (pre-flight / dry-run / live) + `pnpm tsx` 経由に訂正。当該コマンドは撤回。
