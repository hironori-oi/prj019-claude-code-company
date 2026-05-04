最終更新: 2026-05-03 (v2、DEC-019-048/049 反映) / 起案: 秘書部門 / 対象: Owner

# PRJ-019 Clawbridge + PRJ-020 ClawDialog — Owner セットアップ完全手順書 (マスター)

本書は Owner（あなた）が **5/3〜5/8 期間内** に並行作業として進めるべき、Open Claw + PRJ-019/PRJ-020 共通基盤のセットアップ手順を時系列で示す統括チェックリストです。Dev / Research / PM の作業と並走する独立タスク群で、推定総工数は **4〜6 時間**（休憩込み、Phase A〜E に分割可、v2 で 1Password CLI 採択により実質 -10 分程度短縮見込）です。

各 Phase は単独完了可能で、途中で中断しても次回 Phase 先頭から再開できます。Owner 操作必須の項目のみ抽出済みで、Dev 担当作業（テスト実行 / Casbin 詳細設計 等）は含みません。

参照: `decisions.md` DEC-019-033 / DEC-019-048 / DEC-019-049 / `app/README.md` / `app/.env.example` / `secretary-58-dev-demo-script.md` / `04-decision-updates-2026-05-03.md`

**v2 更新サマリ (2026-05-03)**:
- DEC-019-048: secret 管理ツールに **1Password CLI** を採択（Doppler 撤回）
- DEC-019-049: **Slack workspace 新規作成必須**（`prj019-claude-code-company` 相当、既存業務 Slack 流用不可）
- DEC-019-050（保留）: Anthropic API spend cap $300/月設定後、Owner が `/ceo` 経由でスクリーンショット共有 → 正式決裁起票

---

## §1 全体マップ (5 Phase / 推定 30+ タスク)

```
Phase A: SaaS アカウント整備      (60 分) — 5/3〜5/4
   ↓
Phase B: ローカル環境構築          (60 分) — 5/4〜5/5
   ↓
Phase C: Supabase 設定 + migration (45 分) — 5/5〜5/6
   ↓
Phase D: secret 設定 + GH Actions  (30 分) — 5/6〜5/7
   ↓
Phase E: 動作確認 + 5/8 デモ準備   (30 分) — 5/7〜5/8 朝
```

### マイルストーン通知 (CEO 報告)

完了時に `/secretary` 経由で 1 行報告してください。CEO は議題 v6 §2 報告に組み込みます。

| Milestone | 完了基準 | 想定到達日 | 通知文例 |
|---|---|---|---|
| **M1: Phase A 完了** | 6 SaaS アカウント全て発行完了、API key 取得済み | 5/4 18:00 | 「Owner setup M1 完了 — SaaS 6 件取得済み」 |
| **M2: Phase C 完了** | 8 migration 適用 + RLS 8 policy 適用 + テストクエリ 5/5 緑 | 5/6 18:00 | 「Owner setup M2 完了 — Supabase 全 schema 適用済み」 |
| **M3: Phase E 完了** | `pnpm dev` 起動 + Dashboard 表示 + audit_log hash chain 動作確認 | 5/8 08:30 | 「Owner setup M3 完了 — 5/8 デモ readiness OK」 |

---

## §2 Phase A: SaaS アカウント整備 (60 分想定)

詳細手順は `01-saas-accounts-and-secrets.md` 参照。

| # | タスク | 想定時間 | 前提条件 | 完了条件 | つまずきやすいポイント | サポート連絡先 |
|---|---|---|---|---|---|---|
| A-1 | Supabase Free tier プロジェクト作成 (`clawbridge` 命名) | 8 分 | GitHub アカウント | Project URL / anon key / service_role key 取得 | リージョンは Tokyo (ap-northeast-1) 必須、後変更不可 | `/secretary` |
| A-2 | Supabase project ref をメモ (URL の `xxx.supabase.co` 部分) | 1 分 | A-1 | `SUPABASE_PROJECT_REF` を 1Password Vault `prj019` に保存 | リージョン違いで遅延発生 | `/secretary` |
| A-3 | Vercel Hobby プロジェクト作成 (PRJ-019 用) | 5 分 | GitHub 連携 | Vercel project URL 取得、deploy 不要 | GitHub repo 未作成だと連携待ち | `/secretary` |
| A-4 | GitHub private repo 確認 (claude-code-company 既存) | 2 分 | 既存 | repo 確認のみ | Branch protection は Phase D で | `/secretary` |
| A-5 | Anthropic API 月額確認 (既保有想定) | 5 分 | 既保有 | `https://console.anthropic.com/settings/billing` で当月使用量確認 | ※注: 本案件は CLI subprocess 経由のみ、API 直接利用禁止 | `/secretary` |
| A-6 | **Slack workspace を新規作成** (`prj019-claude-code-company` 推奨) + `#prj019-hitl` / `#prj019-monitor` / `#prj019-drill` 3 channel 作成 | 12 分 | Slack アカウント | 新規 workspace 作成、3 channel 作成、incoming webhook 3 本発行 | DEC-019-049 により既存業務 Slack 流用は禁止、誤投稿防止のため完全分離 | `/secretary` |
| A-7 | Resend Free tier アカウント作成 + API key 発行 | 8 分 | メール認証 | API key 取得、send-from は `onresend.dev` で OK | ドメイン認証は後回し可 | `/secretary` |
| A-8 | **1Password CLI 導入** (secret 管理、DEC-019-048 採択) | 10 分 | 1Password アカウント | `op signin` 完了、Vault `prj019` 作成 | Phase 1 = personal account、Phase 2 で service account 移行検討 | `/secretary` |
| A-9 | 取得値一覧を 1Password Vault `prj019` に投入 (5 item: Supabase / Anthropic / Slack / Resend / GitHub) | 6 分 | A-1〜A-8 | 全 key を `op item create` または UI で登録 | service_role を誤って commit しない、`op://` reference で参照 | `/secretary` |

**Phase A 完了チェックリスト**:
- [ ] A-1 Supabase project 起動
- [ ] A-2 project ref 取得
- [ ] A-3 Vercel project 作成
- [ ] A-4 GitHub repo 確認
- [ ] A-5 Anthropic billing 確認 + spend cap $300/月設定（DEC-019-050 保留、設定後 `/ceo` 経由でスクリーンショット共有）
- [ ] A-6 Slack 新規 workspace + 3 channel + 3 webhook（DEC-019-049）
- [ ] A-7 Resend API key
- [ ] A-8 1Password CLI 導入（DEC-019-048）
- [ ] A-9 全 secret を 1Password Vault `prj019` 投入（5 item）

→ **M1 通知**: `/secretary Phase A 完了報告`

---

## §3 Phase B: ローカル環境構築 (60 分想定)

詳細手順は `02-local-env-and-supabase-setup.md` 参照。Windows 11 + WSL2 (Ubuntu 22.04) を主想定。

| # | タスク | 想定時間 | 前提条件 | 完了条件 | つまずきやすいポイント | サポート連絡先 |
|---|---|---|---|---|---|---|
| B-1 | Node.js 20+ (推奨 24.11.1) を WSL2 で確認 | 5 分 | WSL2 導入済み | `node -v` で v24.x 表示 | nvm 経由推奨、system Node は権限問題あり | `/secretary` → Dev |
| B-2 | pnpm 9.x インストール | 3 分 | B-1 | `pnpm -v` で 9.x 表示 | `corepack enable` を先行 | `/secretary` → Dev |
| B-3 | Claude Code CLI 最新版インストール | 5 分 | B-2 | `claude --version` で最新確認 | `npm install -g @anthropic-ai/claude-code` | `/secretary` → Dev |
| B-4 | リポジトリ確認 (既存 clone 済) | 2 分 | 既存 | `cd projects/PRJ-019/app && ls` で構造確認 | 追加 clone 不要 | `/secretary` |
| B-5 | `pnpm install` 実行 (workspace 依存解決) | 15 分 | B-2, B-4 | エラーなし完了 | bcrypt / better-sqlite3 等の native modules ビルド失敗 → `apt install build-essential` | `/secretary` → Dev |
| B-6 | Supabase CLI v2 インストール | 5 分 | B-2 | `supabase --version` 表示 | `npm install -g supabase@latest` | `/secretary` |
| B-7 | Supabase CLI で login | 3 分 | B-6, A-1 | `supabase login` で OK | アクセストークン発行が必要 (dashboard) | `/secretary` |
| B-8 | `.env.local` を `.env.example` から雛形作成 (空欄のまま) | 5 分 | B-4 | `projects/PRJ-019/app/.env.local` 存在 | service_role を含むため `.gitignore` 確認必須 | `/secretary` |
| B-9 | `pnpm typecheck` 動作確認 (Owner は実行のみ) | 10 分 | B-5 | エラー 0 件で完了 | TS strict で警告多数出る可能性、Dev に escalation 可 | `/secretary` → Dev |
| B-10 | `pnpm test` 動作確認 (95 cases 緑予定) | 7 分 | B-5 | 全件緑 | live integration test は default 除外、緑が出ない場合 Dev へ | `/secretary` → Dev |

**Phase B 完了チェックリスト**:
- [ ] B-1〜B-10 全項目

---

## §4 Phase C: Supabase 設定 + migration 適用 (45 分想定)

詳細手順は `02-local-env-and-supabase-setup.md` 後半参照。

| # | タスク | 想定時間 | 前提条件 | 完了条件 | つまずきやすいポイント | サポート連絡先 |
|---|---|---|---|---|---|---|
| C-1 | `.env.local` に Supabase URL / anon / service_role / DB_URL 投入 | 5 分 | A-1, B-8 | 4 行記入完了 | service_role を間違えて anon に入れない | `/secretary` |
| C-2 | `supabase link --project-ref <ref>` 実行 | 3 分 | A-2, B-6 | link 成功 | ref が project ID と異なる、URL 末尾の subdomain | `/secretary` |
| C-3 | `supabase db push` で 8 migration 適用 | 8 分 | C-2 | 8 ファイル適用ログ確認 | 既存 schema があると衝突、初回は空 DB 必須 | `/secretary` → Dev |
| C-4 | `supabase/policies/` の RLS 8 ファイルを SQL Editor で順次実行 | 10 分 | C-3 | 8 file 実行完了、エラー 0 | 順序通り `01_` から `08_` へ実行 | `/secretary` → Dev |
| C-5 | `open_claw_restricted` DB role 作成 (SQL) | 5 分 | C-3 | role 存在確認 (`\du`) | password 不要、`NOLOGIN` で OK | `/secretary` → Dev |
| C-6 | Supabase Auth provider 設定 (Email + Magic Link) | 5 分 | A-1 | Owner email でログインテスト成功 | redirect URL を `localhost:3000/auth/callback` に追加 | `/secretary` |
| C-7 | Test query 5 件を SQL Editor で実行 | 5 分 | C-4 | 全件期待結果 | RLS で SELECT 0 件は role 未設定、JWT claims 不足が原因 | `/secretary` → Dev |
| C-8 | tenant_id / owner_user_id を生成 (`gen_random_uuid()`) して `.env.local` に投入 | 4 分 | C-3 | `CLAWBRIDGE_TENANT_ID` / `CLAWBRIDGE_OWNER_USER_ID` 記入完了 | uuid v4 形式必須 | `/secretary` |

**Phase C 完了チェックリスト**:
- [ ] C-1〜C-8 全項目
- [ ] 8 テーブル + 8 RLS policy + 1 DB role + Auth + tenant binding 完了

→ **M2 通知**: `/secretary Phase C 完了報告`

---

## §5 Phase D: secret 設定 + GitHub Actions 設定 (30 分想定)

| # | タスク | 想定時間 | 前提条件 | 完了条件 | つまずきやすいポイント | サポート連絡先 |
|---|---|---|---|---|---|---|
| D-1 | 1Password Vault `prj019` に Slack Webhook 3 本投入 (`#prj019-hitl` / `#prj019-monitor` / `#prj019-drill`) | 5 分 | A-6 | item `slack` の field として `webhook_hitl` / `webhook_monitor` / `webhook_drill` 設定 | channel と webhook の対応関係 | `/secretary` |
| D-2 | 1Password Vault `prj019` に Resend API key 投入 | 2 分 | A-7 | item `resend.api_key` 設定 | dummy 値で commit しない | `/secretary` |
| D-3 | GitHub Actions secrets を 5 件登録 (openclaw-monitor 用) | 8 分 | A-6, A-7 | Actions secrets タブで 5 件登録: `SLACK_CHANGELOG_WEBHOOK_URL` / `RESEND_API_KEY` / `OWNER_NOTIFY_EMAIL` / `DEV_NOTIFY_EMAIL` / `GITHUB_PAT_READ_ONLY`（あるいは 1Password Service Account integration を選択して `OP_SERVICE_ACCOUNT_TOKEN` 1 本注入、placeholder） | `repo:secret` scope 必須、Service Account 採択は Phase 2 で検討 | `/secretary` |
| D-4 | GitHub PAT (read:public_repo) 発行 + GH secret 登録 | 5 分 | A-4 | `GITHUB_PAT_READ_ONLY` 登録完了 | fine-grained PAT 推奨、有効期限 90 日 | `/secretary` |
| D-5 | Vercel project の environment variable 設定 (Production / Preview) | 8 分 | A-3 | Supabase URL / anon / service_role / TZ=Asia/Tokyo | service_role は Sensitive flag 必須 | `/secretary` → Dev |
| D-6 | `.env.local` を最終確認、`.gitignore` 反映確認 | 2 分 | C-1 | `git status` で `.env.local` が untracked 表示されない | 既に gitignore 済 | `/secretary` |

**Phase D 完了チェックリスト**:
- [ ] D-1〜D-6 全項目

---

## §6 Phase E: 動作確認 + 5/8 デモ準備 (30 分想定)

詳細手順は `03-day0-and-demo-readiness.md` 参照。

| # | タスク | 想定時間 | 前提条件 | 完了条件 | つまずきやすいポイント | サポート連絡先 |
|---|---|---|---|---|---|---|
| E-1 | `op run --env-file=.env.local -- pnpm --filter web dev` で起動、`http://localhost:3000` アクセス | 5 分 | C-1, D-6 | placeholder ページ表示 | DEC-019-048 により env 注入は `op run --` 経由必須、port 3000 競合 → `--port 3001` で回避 | `/secretary` → Dev |
| E-2 | Supabase Dashboard で 8 table 目視 | 3 分 | C-3 | Table editor で 8 件確認 | テーブル数違い → migration 失敗 | `/secretary` |
| E-3 | Supabase Dashboard で 8 RLS policy が Enabled 表示 | 3 分 | C-4 | 各 table の Policy タブで 1+ policy 確認 | RLS 無効状態は危険、必ず Enabled 確認 | `/secretary` → Dev |
| E-4 | audit_log への手動 INSERT で hash chain 動作確認 (1 SQL 行) | 4 分 | C-3 | `curr_hash` が 64 hex で生成、prev_hash = "0" × 64 | `append_audit_log()` 経由で実行、直接 INSERT は revoke 済み | `/secretary` → Dev |
| E-5 | Casbin policy.csv の Owner 自己 read 確認 (7 category 一覧表示) | 3 分 | B-5 | `pnpm --filter harness test casbin` 緑、7 category × `super_role` allow 確認 | Owner role mapping ミス | `/secretary` → Dev |
| E-6 | kill switch 動作確認 (UI placeholder で OK) | 3 分 | E-1 | Dashboard → Permissions タブ → kill switch ボタン押下、確認モーダル表示 | UI 未実装の場合は SQL で `runtime_wrapper_state.circuit_state = 'open'` 投入で代替 | `/secretary` → Dev |
| E-7 | Realtime subscription 動作確認 (placeholder OK) | 2 分 | E-1 | 本実装は Phase 1 W2、本タスクは Supabase Realtime 有効化のみ | Free tier の同時接続数 200 制限 | `/secretary` |
| E-8 | 5/8 デモ進行中の Owner 操作 3 タイミングを確認 (進行台本との連動) | 4 分 | secretary-58-dev-demo-script.md 既読 | 3 タイミング把握: ①§3 開始時の Go/NoGo 表明、②kill switch UI 視認、③§5(d') 透明性 Dashboard 視認 | デモ中の操作は最小限 | `/secretary` |
| E-9 | 5/8 朝 7:00 までに `pnpm install` cache 暖機 | 3 分 | B-5 | node_modules 存在確認 | `pnpm store prune` してしまわない | `/secretary` |

**Phase E 完了チェックリスト**:
- [ ] E-1〜E-9 全項目

→ **M3 通知**: `/secretary Phase E 完了報告 (5/8 デモ readiness OK)`

---

## §7 escalation ルール

困ったときの問い合わせは **`/secretary {問い合わせ内容}`** で escalation してください。秘書部門が判断し、技術的内容は Dev / Research / Review 部門へ自動 routing します。

緊急（kill switch 想定 / secret 漏洩 / 環境壊滅）は `/ceo` 直接でも可。

---

## §8 関連ファイル

- `01-saas-accounts-and-secrets.md`: SaaS 6 件詳細手順 + 1Password Vault 構成 + 13 prohibited domains 一覧
- `02-local-env-and-supabase-setup.md`: ローカル + Supabase コマンド手順 (`op run` 経由起動)
- `03-day0-and-demo-readiness.md`: 5/8 デモ readiness + Day-0 (5/26) 手順
- `04-decision-updates-2026-05-03.md`: DEC-019-048/049/050 反映サマリ + Owner 確認用 diff 一覧
- `secretary-58-dev-demo-script.md`: 5/8 デモ進行台本（Owner 操作 3 タイミング）
- `app/README.md`: 案件全体構造
- `app/.env.example`: 環境変数 template
- `decisions.md` DEC-019-033 / DEC-019-048 / DEC-019-049: 5 点統合決裁 + Owner 直接決裁本文

---

**v1**: 2026-05-03 起案 (秘書部門、Owner 並行作業整備)
**v2**: 2026-05-03 更新 (DEC-019-048 1Password CLI 採択 + DEC-019-049 Slack 新規 workspace 反映、Doppler 関連削除)
