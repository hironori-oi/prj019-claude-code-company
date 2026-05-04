最終更新: 2026-05-03 (v2、DEC-019-048/049 反映) / 起案: 秘書部門 / 対象: Owner

# PRJ-019 / PRJ-020 — SaaS アカウント & Secret 整備手順

本書は Owner（あなた）が **Phase A (60 分想定、v2 で実質 50 分程度に短縮見込)** で実施する SaaS 6 件のアカウント取得・API key 発行・**1Password Vault 投入**の詳細手順を示します。**実値（API key / DSN / Webhook URL 等）は本書には絶対に記載しません**。Owner 自身で取得し、1Password Vault `prj019` に保存し、`.env.local`（gitignored）には `op://` reference 記法のみ記述してください。

参照: `00-owner-setup-master-checklist.md` §2 / `app/.env.example` / `decisions.md` DEC-019-033 §⑤ / DEC-019-048 / DEC-019-049

**v2 更新サマリ**:
- DEC-019-048 採択により secret 管理ツールを **1Password CLI** に固定（Doppler 関連手順削除）
- DEC-019-049 採択により Slack workspace は **新規作成必須**（既存業務 Slack 流用禁止、`prj019-claude-code-company` 推奨）
- 3 channel 名を `#prj019-hitl` / `#prj019-monitor` / `#prj019-drill` に統一

---

## §1 必要 SaaS 一覧

| # | サービス | 用途 | プラン | 月額コスト | 取得手順 URL |
|---|---|---|---|---|---|
| 1 | **Supabase** | DB / 認証 / Storage / Realtime（PRJ-019 + PRJ-020 共用 1 project） | Free tier | $0（500MB DB / 5GB 帯域 / 50k MAU） | https://supabase.com/dashboard/new |
| 2 | **Vercel** | ホスティング（PRJ-019 web 用 1 project + COMPANY-WEBSITE 1 project） | Hobby | $0（個人利用、商用不可だが本案件は社内ハーネスのため許容） | https://vercel.com/new |
| 3 | **GitHub** | リポジトリ + Actions（既保有 private repo + Actions 無料枠） | Free | $0（public 無制限 / private 2,000 min/月 Actions） | 既存利用継続 |
| 4 | **Anthropic API** | Claude Code CLI 経由のみ（API 直接利用禁止） | 既保有想定 | 月額 $20〜100 想定（subprocess 利用量による） | https://console.anthropic.com/settings/billing |
| 5 | **Slack（新規 workspace）** | HITL / Monitor / Drill 通知（3 channel + 3 webhook、DEC-019-049 で既存業務 Slack と完全分離） | Free | $0（90 日メッセージ保持制限あり、Phase 1 では問題なし） | https://slack.com/create |
| 6 | **Resend** | HITL 9/10/11 通知メール + changelog L3 通知 | Free tier | $0（100 mail/日、3,000/月） | https://resend.com/signup |
| 7 | **1Password CLI**（DEC-019-048 採択） | secret 管理 | 個人 plan 既保有想定 | $0（既保有）／$2.99/月（新規） | https://1password.com/downloads/command-line/ |

**月額合計見込: $20〜100**（Anthropic API 使用量のみ変動、他は $0）。DEC-019-031 月次予算 $300/月内に完全準拠。

---

## §2 各サービスで取得すべき値の一覧

### 2.1 Supabase (5 値)

| 取得項目 | 取得場所 | env key | 1Password reference |
|---|---|---|---|
| Project URL | Project Settings → API → URL | `NEXT_PUBLIC_SUPABASE_URL` | `op://prj019/supabase/url` |
| anon key | Project Settings → API → anon/public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `op://prj019/supabase/anon_key` |
| service_role key | Project Settings → API → service_role | `SUPABASE_SERVICE_ROLE_KEY` | `op://prj019/supabase/service_role_key` |
| DB connection string | Project Settings → Database → Connection string → URI | `SUPABASE_DB_URL` | `op://prj019/supabase/db_url` |
| Project ref | URL の `xxx.supabase.co` の `xxx` 部分 | （reference のみ、env 不要） | `op://prj019/supabase/project_ref` |

**重要**: `service_role key` は **Web 層（Next.js API route）でのみ参照**、claude-bridge / openclaw-runtime subprocess の env には絶対に注入しないでください（DEC-019-033 §⑤ priviledge escalation 物理防止）。

### 2.2 Vercel (1 値)

| 取得項目 | 取得場所 | env key |
|---|---|---|
| Project URL | Vercel project page → Settings → Domains | `VERCEL_ENV` (auto-injected) |

Vercel は連携時に Supabase env を自動同期する。

### 2.3 GitHub (1 値)

| 取得項目 | 取得場所 | env key |
|---|---|---|
| PAT (read:public_repo) | Settings → Developer settings → Personal access tokens → Fine-grained | `GITHUB_PAT_READ_ONLY` |

PAT は Fine-grained を推奨、有効期限 90 日、scope は最小限（`Contents: Read-only` + `Metadata: Read-only`）。

### 2.4 Anthropic API (確認のみ、API key 利用禁止)

本案件では Claude Code CLI（subprocess）が本人 OAuth で auth を解決するため、API key は env に保存しないでください。billing 確認のみ実施（`https://console.anthropic.com/settings/billing`）。

### 2.5 Slack (新規 workspace + 3 webhook、DEC-019-049 採択)

#### 2.5.1 新規 workspace 作成手順

1. https://slack.com/create で新規 workspace を作成
2. Workspace 名: `prj019-claude-code-company` または `<owner-handle>-prj019` 推奨
3. 既存業務 Slack と **完全分離**（Owner が誤投稿しない設計、DEC-019-049）
4. Free tier の制約: メッセージ保持 90 日、ただし Phase 1 (5/26〜6/20) 期間内では問題なし
5. Slack Connect は Phase 2 で外部連携時に検討、Phase 1 では使用しない

#### 2.5.2 3 channel 構成

| Channel | webhook URL の env key | 用途 | 1Password reference |
|---|---|---|---|
| `#prj019-hitl` | `SLACK_CHANNEL_HITL` | HITL 11 種承認依頼通知（第1〜11 種 Gate） | `op://prj019/slack/webhook_hitl` |
| `#prj019-monitor` | `SLACK_CHANNEL_MONITOR` | OpenClaw 上流変更通知 / GitHub Actions / cost meter | `op://prj019/slack/webhook_monitor` |
| `#prj019-drill` | `SLACK_CHANNEL_DRILL` | BAN drill #1 / #3 通知 + Phase 1 中断時 emergency | `op://prj019/slack/webhook_drill` |

#### 2.5.3 各 channel の Incoming Webhook URL 取得手順

1. 新規 workspace で `Apps` → `Browse Apps` → `Incoming Webhooks` をインストール
2. `Add to Slack` → Channel 選択（例: `#prj019-hitl`）→ `Add Incoming Webhooks integration`
3. 表示された Webhook URL をコピー
4. `op item edit slack webhook_hitl="<url>"` で 1Password に保存
5. 残り 2 channel についても同様に発行・保存（合計 3 webhook）

注: Webhook URL は channel 単位で異なるため、混同注意。混同した場合は Slack 設定画面から revoke して再発行。

### 2.6 Resend (1 値)

| 取得項目 | 取得場所 | env key |
|---|---|---|
| API key | Resend dashboard → API Keys → Create | `RESEND_API_KEY` |

ドメイン認証なしの場合、送信元は `onresend.dev` で OK（HITL 通知用途は十分）。本番で `from: noreply@improver.jp` にする場合は DNS 設定後実施（Phase 1 W2 以降）。

### 2.7 1Password CLI (secret 管理、DEC-019-048 採択)

#### 2.7.1 インストール手順 (OS 別)

**macOS**:

```bash
brew install --cask 1password-cli
op --version    # 2.x 確認
```

**Windows (PowerShell 管理者)**:

```powershell
winget install AgileBits.1Password.CLI
op --version
```

**WSL2 / Ubuntu / Debian**:

```bash
curl -sSf https://downloads.1password.com/linux/keys/1password.asc \
  | sudo gpg --dearmor --output /usr/share/keyrings/1password-archive-keyring.gpg \
  && echo 'deb [arch=amd64 signed-by=/usr/share/keyrings/1password-archive-keyring.gpg] https://downloads.1password.com/linux/debian/amd64 stable main' \
  | sudo tee /etc/apt/sources.list.d/1password.list \
  && sudo apt update && sudo apt install 1password-cli

op --version
```

#### 2.7.2 sign-in 方式の選択

| 方式 | 用途 | Phase | 推奨度 |
|---|---|---|---|
| `op signin` (personal account) | Owner 個人 sign-in、対話的 unlock | Phase 1 (5/26〜6/20) | 推奨 |
| Service Account (token-based) | CI / GitHub Actions / 自動化 | Phase 2 で移行検討 | placeholder |

**Phase 1 = personal account** で開始し、CI 連携が必要になった段階（Phase 2 W2 想定）で Service Account へ移行します。Service Account 採択時は `OP_SERVICE_ACCOUNT_TOKEN` を GitHub Actions secrets に投入。

#### 2.7.3 sign-in 実行

```bash
op signin
# Email + Secret Key + Master Password を入力（初回のみ）
# 以降は biometric または short master password で unlock
```

#### 2.7.4 Vault `prj019` 構成 (5 item)

```bash
# Vault 作成
op vault create prj019

# Item 構成（5 件）
op item create --category=apicredential --vault=prj019 --title=supabase \
  url="<project-url>" \
  anon_key="<anon-key>" \
  service_role_key="<service-role-key>" \
  db_url="<db-connection-string>" \
  project_ref="<ref>"

op item create --category=apicredential --vault=prj019 --title=anthropic \
  api_key="<not-stored-but-placeholder-for-future-use>"
# 注: 本案件では Anthropic API key は env に保存しない (DEC-019-033 §⑤)
# Vault 上の placeholder は将来 PRJ-020 等で使用する場合の予約

op item create --category=apicredential --vault=prj019 --title=slack \
  webhook_hitl="<#prj019-hitl webhook>" \
  webhook_monitor="<#prj019-monitor webhook>" \
  webhook_drill="<#prj019-drill webhook>"

op item create --category=apicredential --vault=prj019 --title=resend \
  api_key="<resend-api-key>"

op item create --category=apicredential --vault=prj019 --title=github \
  pat_read_only="<github-fine-grained-pat>"
```

| # | Item title | Vault | 主要 field 数 | 備考 |
|---|---|---|---|---|
| 1 | `supabase` | `prj019` | 5 (url / anon_key / service_role_key / db_url / project_ref) | service_role_key は subprocess に渡さない |
| 2 | `anthropic` | `prj019` | 1 (api_key、placeholder) | env 注入禁止 |
| 3 | `slack` | `prj019` | 3 (webhook_hitl / webhook_monitor / webhook_drill) | DEC-019-049 新 workspace |
| 4 | `resend` | `prj019` | 1 (api_key) | Free tier |
| 5 | `github` | `prj019` | 1 (pat_read_only) | fine-grained、90 日有効期限 |

#### 2.7.5 `.env.local` を `op://` reference 記法で記述

```bash
# projects/PRJ-019/app/.env.local
NEXT_PUBLIC_SUPABASE_URL=op://prj019/supabase/url
NEXT_PUBLIC_SUPABASE_ANON_KEY=op://prj019/supabase/anon_key
SUPABASE_SERVICE_ROLE_KEY=op://prj019/supabase/service_role_key
SUPABASE_DB_URL=op://prj019/supabase/db_url
SUPABASE_PROJECT_REF=op://prj019/supabase/project_ref

ANTHROPIC_API_KEY=op://prj019/anthropic/api_key   # 注: subprocess には注入しない、CLI 委譲

SLACK_CHANNEL_HITL=op://prj019/slack/webhook_hitl
SLACK_CHANNEL_MONITOR=op://prj019/slack/webhook_monitor
SLACK_CHANNEL_DRILL=op://prj019/slack/webhook_drill
SLACK_WEBHOOK_URL=op://prj019/slack/webhook_hitl   # default = HITL

RESEND_API_KEY=op://prj019/resend/api_key

GITHUB_PAT_READ_ONLY=op://prj019/github/pat_read_only
```

#### 2.7.6 起動時の env 注入 (`op run`)

```bash
# 開発サーバ起動時
op run --env-file=.env.local -- pnpm --filter web dev

# テスト実行時
op run --env-file=.env.local -- pnpm test

# Supabase migration 適用時
op run --env-file=.env.local -- supabase db push
```

`op run --` は `.env.local` 内の `op://` reference を実値に解決し、子プロセスにのみ環境変数として注入します。`.env.local` 自体は実値を含まず、commit しても安全（ただし `.gitignore` 維持）。

#### 2.7.7 Secret rotation SOP

| Secret | rotate 周期 | 手順 |
|---|---|---|
| Supabase service_role | 90 日 | Supabase dashboard で rotate → `op item edit supabase service_role_key="<new>"` |
| Resend API key | 180 日 | Resend dashboard で rotate → `op item edit resend api_key="<new>"` |
| Slack webhook | 365 日 | Slack admin で revoke → 再発行 → `op item edit slack webhook_hitl="<new>"` |
| GitHub PAT | 90 日（fine-grained 強制） | GitHub Settings で再発行 → `op item edit github pat_read_only="<new>"` |
| 1Password Master Password | 365 日 | 1Password app で変更 |

**重要**: 1Password CLI 採択により、rotation 時に `.env.local` の修正は不要（`op://` reference が変わらないため）。`op item edit` だけで全消費者（dev / test / CI）に新 secret が反映されます。これが Doppler ではなく 1Password CLI を選んだ最大の利点（DEC-019-048 採択理由）。

---

## §3 `.env.local` 雛形（v2: `op://` reference 記法）

`projects/PRJ-019/app/.env.example` を `.env.local` にコピーし、以下の placeholder を `op://` reference に置換してください。**本書に実値を書かないでください**。実値は 1Password Vault `prj019` にのみ保存します。

```bash
# ---------- Supabase ----------
NEXT_PUBLIC_SUPABASE_URL=op://prj019/supabase/url
NEXT_PUBLIC_SUPABASE_ANON_KEY=op://prj019/supabase/anon_key
SUPABASE_SERVICE_ROLE_KEY=op://prj019/supabase/service_role_key   # 絶対に subprocess に渡さない
SUPABASE_DB_URL=op://prj019/supabase/db_url

# ---------- Tenant binding (実値、uuid なので秘匿不要) ----------
CLAWBRIDGE_TENANT_ID=<gen_random_uuid()>
CLAWBRIDGE_OWNER_USER_ID=<your-supabase-auth-user-id>

# ---------- Claude Code CLI (P-D 改) ----------
CLAUDE_CODE_CLI_PATH=/home/<user>/.npm-global/bin/claude
CLAUDE_CODE_PINNED_VERSION=                            # Phase 1 W1 で確定

# ---------- Open Claw OSS ----------
OPENCLAW_BINARY_PATH=                                  # Phase 1 W1 で確定
OPENCLAW_PINNED_VERSION=

# ---------- Cost / Spend Cap (DEC-019-031) ----------
SPEND_CAP_MONTHLY_USD=300
SPEND_CAP_PROPOSAL_USD=20
SPEND_CAP_TASK_USD=2

# ---------- Notifications (DEC-019-049 新 workspace 3 channel) ----------
SLACK_WEBHOOK_URL=op://prj019/slack/webhook_hitl
SLACK_CHANNEL_HITL=op://prj019/slack/webhook_hitl
SLACK_CHANNEL_MONITOR=op://prj019/slack/webhook_monitor
SLACK_CHANNEL_DRILL=op://prj019/slack/webhook_drill
RESEND_API_KEY=op://prj019/resend/api_key

# ---------- GitHub (Phase D で使用) ----------
GITHUB_PAT_READ_ONLY=op://prj019/github/pat_read_only

# ---------- Anthropic (placeholder、env 注入は subprocess にしない) ----------
ANTHROPIC_API_KEY=op://prj019/anthropic/api_key

# ---------- Vercel (auto-injected on deploy) ----------
VERCEL_ENV=
VERCEL_GIT_COMMIT_SHA=

# ---------- Casbin policy ----------
CASBIN_MODEL_PATH=./policies/casbin/model.conf
CASBIN_POLICY_PATH=./policies/casbin/policy.csv

# ---------- Feature flags (initial defaults, fail-closed) ----------
FEATURE_TOOLS_SEARCH=false
FEATURE_WEB_FETCH=false
FEATURE_FILE_WRITE=false
FEATURE_SHELL_EXEC=false

# ---------- Audit verify ----------
AUDIT_VERIFY_BATCH_SIZE=1000

# ---------- Timezone ----------
TZ=Asia/Tokyo
```

起動時:

```bash
op run --env-file=.env.local -- pnpm --filter web dev
```

---

## §4 Secret 取り扱い 5 大ルール (Owner 周知用)

組織ルール `organization/rules/` 準拠。**いかなる例外も認められません**。

### Rule 1: secret はソース / テスト / log / commit / PR にも含めない

- `.env.local` は `.gitignore` 済み（commit されない）
- ログ出力時は `***REDACTED***` で置換
- テスト fixture には dummy 値（`.test` TLD ルール）のみ使用
- PR 説明や issue にも実値を貼らない

### Rule 2: service_role key は Web 層のみ参照、subprocess に渡さない

- Next.js API route (`web/src/app/api/**/*.ts`) でのみ `process.env.SUPABASE_SERVICE_ROLE_KEY` 参照可
- claude-bridge / openclaw-runtime / orchestrator subprocess の `spawn()` 引数 `env` には絶対に含めない
- 物理防止のため harness 層で env whitelist 適用済み

### Rule 3: Anthropic API key は env に保存しない（CLI 委譲）

- Claude Code CLI が subprocess 起動時に本人 OAuth で auth を解決
- `ANTHROPIC_API_KEY` を env に置くと auth 経路が二重化、CLI 動作不安定の原因
- メイン業務用アカウントとは分離した別アカウントで PoC（review v2 §5、CB-D-W0-05）

### Rule 4: 1Password CLI で集中管理 (DEC-019-048)

- 個別の `.env` ファイル直編集は最小限、`.env.local` は `op://` reference のみ
- secret 更新は `op item edit` 経由、ローカル `.env.local` の修正は不要
- secret 漏洩疑い時は `op item edit` で **rotate** + Slack `#prj019-monitor` に投稿
- Phase 1 = personal account、Phase 2 で Service Account へ移行検討

### Rule 5: rotate 周期

| Secret | rotate 周期 | トリガー |
|---|---|---|
| Supabase service_role | 90 日 | 定期 + 漏洩疑い |
| Resend API key | 180 日 | 定期 |
| Slack webhook | 365 日 | 定期 |
| GitHub PAT | 90 日（fine-grained 強制） | 自動失効 |
| 1Password Master Password | 365 日 | 定期 |

---

## §5 13 Prohibited Domains 一覧 (DEC-019-033 §⑤)

以下 13 ドメインは Casbin policy.csv の deny envelope に **永遠 deny** としてハードコードされており、Owner UI でも解除不可です（priviledge escalation 物理防止）。Owner として把握しておいてください。

| # | category | description |
|---|---|---|
| 1 | `genre:adult` | 成人向けコンテンツ |
| 2 | `genre:gambling` | 賭博 |
| 3 | `genre:weapons` | 武器・兵器（民生規制対象） |
| 4 | `genre:drugs` | 違法薬物 |
| 5 | `genre:hate_speech` | ヘイトスピーチ |
| 6 | `genre:self_harm` | 自傷行為助長 |
| 7 | `genre:csam` | 児童性的虐待コンテンツ |
| 8 | `genre:malware` | マルウェア生成 |
| 9 | `genre:phishing` | フィッシング |
| 10 | `genre:bioweapon` | 生物兵器 |
| 11 | `genre:election_interference` | 選挙介入 |
| 12 | `genre:dox` | 個人情報暴露 |
| 13 | `genre:non_consensual` | 非同意コンテンツ |

実装位置: `projects/PRJ-019/app/policies/casbin/policy.csv` 行 53-66。

加えて以下のクリティカル resources も deny envelope:

- `fs:.env*` （秘密情報ファイル全般）
- `fs:**/secrets/**`
- `fs:organization/**` （write のみ deny、read 可）
- `command:rm` / `command:sudo` / `command:curl?(http://*)` （http は HTTPS 強制）
- `network:169.254.169.254` / `network:metadata.google.internal` （クラウド metadata service 全般）

---

## §6 トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| Supabase project 作成時 region 選択肢に Tokyo がない | 地域制限 | アカウント国設定確認、別アカウントで再作成 |
| Vercel が GitHub repo を認識しない | OAuth scope 不足 | Vercel → Settings → Git → Configure → re-authorize |
| Slack webhook が 404 | URL を間違えてコピー | Webhook 一覧から再発行、古い URL は revoke |
| Slack 新規 workspace 作成時にメール認証ループ | 既存業務 Slack と同一メール | 別アドレス（gmail+prj019@... 等）で作成、または既存メールを別 workspace から削除 |
| Resend のメールが spam に入る | DKIM 未設定 | `onresend.dev` 利用継続、本番ドメイン認証は Phase 1 W2 |
| `op run` で `not signed in` | session expired | `op signin` を再実行、もしくは `eval $(op signin)` |
| `op://` reference が解決されない | Vault 名 / item 名 mismatch | `op item list --vault=prj019` で確認、`op item get supabase --vault=prj019` で field 確認 |

---

## §7 escalation

困ったら **`/secretary {問い合わせ内容}`** で escalation してください。秘書部門が技術内容を Dev / Research に自動 routing します。

---

**v1**: 2026-05-03 起案 (秘書部門、Owner 並行作業整備)
**v2**: 2026-05-03 更新 (DEC-019-048 1Password CLI 採択 + DEC-019-049 Slack 新規 workspace 反映、Doppler 関連削除、`op://` reference 記法導入、Vault `prj019` 5 item 構成、3 channel `#prj019-{hitl,monitor,drill}` 統一)
