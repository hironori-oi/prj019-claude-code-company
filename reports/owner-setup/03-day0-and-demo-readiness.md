最終更新: 2026-05-03 (v2、DEC-019-048/049 反映) / 起案: 秘書部門 / 対象: Owner

# PRJ-019 / PRJ-020 — Day-0 (5/26) + 5/8 デモ readiness 手順

本書は Owner（あなた）が **Phase E (30 分)** で実施する 5/8 検収会議デモ前の最終確認、および Phase 1 着手日 5/26（Day-0）の readiness 手順を示します。**Owner が実際に操作する箇所のみ**抽出し、Dev 担当作業は除外しています。

**v2 更新サマリ**:
- DEC-019-048 採択により、デモ起動コマンドを `op run --env-file=.env.local -- pnpm dev` 前提に変更
- Slack channel 名を `#prj019-{hitl,monitor,drill}` に統一（DEC-019-049）

参照: `00-owner-setup-master-checklist.md` §6 / `secretary-58-dev-demo-script.md` / `pm-phase1-day0-readiness-checklist.md` / `decisions.md` DEC-019-048 / DEC-019-049

---

## §1 5/8 検収会議 9:35-9:45 / 18:35-18:45 デモ前 Owner 準備

注: 議題 v6 配布版で時刻は **18:35-18:45 JST（10 分厳守）** に確定済み。本書では 18:35 を基準とします。

### 1.1 5/8 朝 (07:00) 環境暖機 — 5 分

Owner ローカル環境の事前 warmup（Dev 担当作業ではない）。DEC-019-048 で `op run` 経由に統一。

```bash
cd ~/Desktop/claude-code-company/projects/PRJ-019/app
# WSL2 なら /mnt/c/Users/hiron/...

# 1Password CLI sign-in 確認（毎日朝の最初に必要）
op signin

# node_modules 存在確認、なければ pnpm install
ls node_modules > /dev/null 2>&1 || op run --env-file=.env.local -- pnpm install

# Supabase 接続確認
op run --env-file=.env.local -- supabase status   # API URL 表示
```

### 1.2 5/8 18:00 直前チェック — 10 分

| # | チェック項目 | コマンド / 確認方法 | 期待結果 |
|---|---|---|---|
| 1 | `pnpm dev` 起動可能 | `op run --env-file=.env.local -- pnpm --filter web dev`（demo 開始 5 分前に Dev が実行） | `http://localhost:3000` で placeholder 表示 |
| 2 | Supabase Dashboard アクセス可能 | ブラウザで `https://supabase.com/dashboard/project/<ref>` | ログイン状態維持 |
| 3 | Slack `#prj019-hitl` / `#prj019-monitor` / `#prj019-drill` 開いている | 新規 workspace `prj019-claude-code-company` | 3 channel 視認可能（DEC-019-049 完全分離） |
| 4 | Zoom / 会議ツールにログイン | 会議招待 URL | 18:00 開始前にスタンバイ |
| 5 | `decisions.md` DEC-019-033 全文読み返し | エディタで開く | §⑤ 4 層防御 / 13 prohibited domains を記憶想起 |

### 1.3 デモ進行中の Owner 操作 3 タイミング

`secretary-58-dev-demo-script.md` §3 進行台本に対応する Owner 操作箇所のみ抽出。

#### タイミング 1: 18:35 デモ開始時 — 開始確認

- **Owner 操作**: なし（Dev が画面共有開始、秘書がストップウォッチ開始）
- **Owner 心構え**: 質疑割り込みは §6 質疑応答にまとめて吸収（10 分は厳守）

#### タイミング 2: 18:42-18:43（7:00-8:30 経過時点）Permissions UI / kill switch 視認

- **Owner 操作**: 画面共有越しに Permissions UI と kill switch ボタンを視認
- **判断項目**: 7 カテゴリ細粒度設定（fs / command / network / hitl / cost / time / genre）が視認可能か
- **発言例（任意）**: 「kill switch の TOTP 省略許可と通常 policy 変更の三重ガードの差を明示してほしい」

#### タイミング 3: 18:43-18:44（8:30-9:30 経過時点）Open Issue 3 件確認

- **Owner 操作**: なし（Dev が口頭報告）
- **判断項目**: CB-D-W0-03 / CB-D-W0-06 / verify-zero-side-effect.sh が Pre-Phase Week (5/19) までに完遂可能か
- **発言タイミング**: §6 質疑応答（18:50-19:00）で気になる点を質問

#### タイミング 4: 18:45 デモ終了直後 — Phase 1 Go/NoGo 議決準備

- **Owner 操作**: 議題 v6 §3「Owner-in-the-loop Phase 1 Go/NoGo」議決 25 分が始まる
- **Owner 必読資料（事前）**: `pm-phase1-day0-readiness-checklist.md` / `review-pre-phase1-readiness-assessment.md` / `decisions.md` DEC-019-033

---

## §2 デモ readiness 動作確認 5 件 (Owner 自己チェック)

5/8 朝 7:30 までに Owner 自身で以下 5 件を確認してください。所要 15 分。

### 2.1 `pnpm dev` 起動 + ブラウザ確認 (DEC-019-048: `op run` 経由)

```bash
cd projects/PRJ-019/app
op signin    # 未 sign-in の場合のみ
op run --env-file=.env.local -- pnpm --filter web dev
```

別ターミナルで:

```bash
curl -o /dev/null -s -w "%{http_code}\n" http://localhost:3000
# 期待: 200
```

ブラウザで `http://localhost:3000` 表示確認。Next.js placeholder ページが見えれば OK。

port 3000 競合時:

```bash
op run --env-file=.env.local -- pnpm --filter web dev -- --port 3001
```

### 2.2 Supabase Dashboard で 8 テーブル + RLS 目視

1. ブラウザで `https://supabase.com/dashboard/project/<ref>/editor`
2. Table Editor に 8 テーブル表示確認:
   - `audit_log`
   - `cost_ledger`
   - `hitl_requests`
   - `knowledge_extraction_queue`
   - `policy_audit_log`
   - `policy_versions`
   - `proposals`
   - `runtime_wrapper_state`
3. 各テーブルの **Authentication → RLS** タブで `RLS enabled` 緑バッジ確認

### 2.3 audit_log への手動 INSERT で hash chain 動作確認

Supabase Dashboard → SQL Editor で以下 1 行実行:

```sql
select public.append_audit_log(
  (select id::uuid from auth.users where email = '<your-email>')::uuid,
  'owner',
  (select id::text from auth.users where email = '<your-email>'),
  'demo_readiness_check',
  'projects/PRJ-019/app',
  '{"check":"5/8 demo prep"}'::jsonb
);
```

確認:

```sql
select id, ts, event_kind, prev_hash, curr_hash
from public.audit_log
order by id desc limit 3;
```

期待結果:
- 最新 1 行に `event_kind = 'demo_readiness_check'`
- `curr_hash` が 64 文字 hex
- 1 行目の `prev_hash` は `'0' × 64` （genesis）または前 row の `curr_hash`

### 2.4 Casbin policy.csv の Owner 自己 read で 7 カテゴリ permission 一覧表示

```bash
cd projects/PRJ-019/app
cat policies/casbin/policy.csv | grep -E '^p, super_role,' | head -10
# 期待: 7 行 (fs / command / network / hitl / cost / time / genre 各 *)
```

7 カテゴリすべてに `super_role` の `*, allow` が見えれば OK。`pnpm --filter harness test casbin` でも確認可能（Dev が実行）。

### 2.5 kill switch 動作確認 (UI placeholder OK)

5/8 時点で kill switch UI は placeholder のみ。動作確認は SQL で代替:

```sql
-- 仮想的な kill switch 押下シミュレーション
insert into public.runtime_wrapper_state (
  tenant_id, source, circuit_state, feature_flags, drift, cooldown_until
) values (
  '<your-tenant-id>'::uuid,
  'openclaw',
  'open',
  '{"FEATURE_TOOLS_SEARCH":false,"FEATURE_WEB_FETCH":false,"FEATURE_FILE_WRITE":false,"FEATURE_SHELL_EXEC":false}'::jsonb,
  null,
  now() + interval '1 hour'
);

-- 確認
select circuit_state, cooldown_until
from public.runtime_wrapper_state
where source = 'openclaw'
order by ts desc limit 1;
-- 期待: circuit_state = 'open', cooldown_until は 1 時間先
```

実際の UI 経由 kill switch は Phase 1 W2（5/26〜6/12 内）で実装、5/8 時点はテーブル動作のみ確認。

---

## §3 Realtime subscription 動作確認 (placeholder OK)

5/8 時点では Realtime subscription の本実装は Phase 1 W2 タスク。本タスクは **Supabase Realtime 機能の有効化のみ**確認。

### 3.1 Realtime 有効化確認

1. Supabase Dashboard → Database → Replication
2. `audit_log` / `hitl_requests` / `cost_ledger` の 3 テーブルに対し **Source** タブで以下確認:
   - `Send` チェックボックスが ON
   - もし OFF なら ON にして Save

### 3.2 Free tier 制限注意

| 制限 | 値 | 5/8 想定使用量 |
|---|---|---|
| 同時接続数 | 200 | 1 (Owner のみ) |
| メッセージ/月 | 2M | < 1k |

Free tier 内で十分動作。

---

## §4 Day-0 (5/26) Phase 1 W1 着手前 Owner readiness

5/8 検収会議で **Phase 1 Go 決裁が出た場合**、5/26 着手日までに以下を Owner が実施します。本セクションは 5/8 以降に再度参照してください。

### 4.1 5/9〜5/25 期間の Owner タスク

| # | タスク | 期限 | 所要 |
|---|---|---|---|
| 1 | Phase 1 W1 W2 W3 W4 のタスクボード確認 (`tasks.md`) | 5/12 | 30 分 |
| 2 | HITL 9 dev_kickoff_approval の SLA 72h を Owner カレンダーに設定 | 5/19 | 10 分 |
| 3 | Slack `#prj019-hitl` の通知設定 (mobile push 含む) | 5/19 | 5 分 |
| 4 | Resend → Owner email の到達確認 | 5/19 | 5 分 |
| 5 | 1Password Vault `prj019` の Phase 1 用 secret 増分（Open Claw binary path 等）投入 | 5/22 | 15 分 |
| 6 | BAN drill #1（5/13 立会）で得られた知見を Pre-Phase Week (5/19-25) review に反映 | 5/25 | 30 分 |

### 4.2 5/26 朝 Day-0 readiness チェック (15 分)

```bash
cd projects/PRJ-019/app

# 0. 1Password CLI sign-in
op signin

# 1. 環境最新化
git pull origin main
op run --env-file=.env.local -- pnpm install
op run --env-file=.env.local -- supabase db push   # Phase 1 W1 で追加 migration があれば適用

# 2. health check
op run --env-file=.env.local -- pnpm typecheck \
  && op run --env-file=.env.local -- pnpm test \
  && op run --env-file=.env.local -- pnpm lint

# 3. dev 起動
op run --env-file=.env.local -- pnpm --filter web dev
# ブラウザで http://localhost:3000 表示確認

# 4. Slack 通知テスト (DEC-019-049 新 workspace 3 channel)
op run --env-file=.env.local -- bash -c '
curl -X POST -H "Content-type: application/json" \
  --data "{\"text\":\"PRJ-019 Day-0 readiness check OK\"}" \
  "$SLACK_CHANNEL_HITL"
'
```

`#prj019-hitl` に通知が届けば readiness OK。

### 4.3 Phase 1 W1 着手宣言

```bash
# /secretary 経由で CEO に報告
/secretary "PRJ-019 Phase 1 Day-0 readiness 完了、W1 着手します"
```

---

## §5 トラブルシューティング (5/8 デモ直前向け)

| 症状 | 原因 | Owner の対処 |
|---|---|---|
| `op run` で `not signed in` | session expired | `op signin` を再実行、デモ前 30 分以内に必ず実施 |
| `pnpm dev` で port 3000 競合 | 別 process 使用中 | `lsof -i :3000` → `kill <pid>`、または `--port 3001` で起動 |
| Supabase Dashboard ログインできない | session 切れ | パスワード再入力、2FA 設定済みなら 2FA コード |
| `audit_log` INSERT で `permission denied` | service_role でない context | SQL Editor で `set role service_role;` を冒頭に追加 |
| ブラウザで Next.js placeholder が真っ白 | hydration error | Console エラー確認、`/secretary` 経由 Dev escalation |
| Slack webhook 通知届かない | URL 失効 / channel 削除 | webhook 再発行、`op item edit slack webhook_hitl="<new>"` で 1Password 更新 |
| `op://` reference 解決失敗 | Vault 名 / item 名 mismatch | `op item list --vault=prj019` で確認、`.env.local` の reference を訂正 |

緊急時（環境壊滅）は **デモ前 30 分まで** に `/ceo` 直接 escalation してください。30 分以内なら録画動画にフォールバック可能（`secretary-58-dev-demo-script.md` §5 SOP L2 / L3）。

---

## §6 完了確認チェックリスト (5/8 朝 8:30 締切)

- [ ] §1.1 5/8 朝 7:00 環境暖機完了
- [ ] §1.2 5/8 18:00 直前 5 件チェック完了
- [ ] §2.1 `pnpm dev` 起動 + ブラウザ確認
- [ ] §2.2 Supabase Dashboard 8 テーブル + RLS 目視
- [ ] §2.3 audit_log hash chain 動作確認 (1 INSERT)
- [ ] §2.4 Casbin policy 7 カテゴリ確認
- [ ] §2.5 kill switch 動作確認 (SQL 代替)
- [ ] §3.1 Realtime 有効化確認
- [ ] §1.3 デモ進行中の Owner 操作 3 タイミングを把握

完了したら `/secretary Phase E 完了報告 — M3 マイルストーン到達、5/8 デモ readiness OK` で報告してください。

---

## §7 escalation

5/8 デモ直前のトラブルは **`/secretary {問い合わせ内容}`** で escalation してください。秘書部門が即座に Dev / Review に routing します。

緊急時（録画動画フォールバック判断 / デモ中止判断）は `/ceo` 直接でも可。デモ進行中は秘書（`/secretary`）が議事進行を担当しているため、デモ中の質疑は §6 質疑応答（18:50-19:00）まで待機してください。

---

**v1**: 2026-05-03 起案 (秘書部門、Owner 並行作業整備)
**v2**: 2026-05-03 更新 (DEC-019-048 採択により全起動コマンドを `op run --env-file=.env.local --` 経由に変更、DEC-019-049 採択により Slack channel 名を `#prj019-{hitl,monitor,drill}` に統一)
