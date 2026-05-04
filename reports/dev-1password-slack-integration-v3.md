# Dev レポート v3 — Plan B (Personal plan 適応) 実行手順

- 案件: PRJ-019 Clawbridge
- Round: W0-Week1 RC-2 後段 (GitHub Actions Secrets 切替)
- 作成: 2026-05-04 (CEO 直轄)
- 関連 DEC: DEC-019-048 / 049 / 053 (v15.2 Plan B 補足)
- 前提: Owner 1Password Personal plan 確定 (Service Account 非対応)

---

## 1. 背景と判断

### 1.1 元の設計 (DEC-019-048)
- GitHub Actions に登録するのは `OP_SERVICE_ACCOUNT_TOKEN` 1 つだけ
- workflow 内で `1password/load-secrets-action@v2` が op:// reference を解決
- 利点: rotation 時は Vault 1 か所更新で全 workflow 自動同期

### 1.2 ブロッカー
- **1Password Service Account は Business / Teams plan 専用機能** ($7.99/user/月以上)
- Personal / Family plan は Service Account 発行不可 → `OP_SERVICE_ACCOUNT_TOKEN` 取得経路がない

### 1.3 Owner 決定 (5/4)
- Plan A (Business 昇格): rejected — 月額コスト発生
- **Plan B (GitHub Actions Secrets 直接展開): adopted**
- Plan C (workflow 凍結): rejected — Phase 1 W0-W1 で monitor 必須

---

## 2. 変更点サマリ

| 項目 | Before (元設計) | After (Plan B) |
| --- | --- | --- |
| GitHub Actions Secrets 登録数 | 1 (OP_SERVICE_ACCOUNT_TOKEN) | 7 (本 workflow 用 Tier 1) |
| workflow 内 secret 展開 | `1password/load-secrets-action` step | `${{ secrets.<NAME> }}` 直接 |
| ローカル開発 | `op run --env-file=.env.local` | 同左 (変更なし) |
| Vault `prj019` 利用 | local + CI 両方 | local のみ (CI は GitHub Secrets) |
| rotation 作業 | Vault 1 か所更新 | Vault + GitHub Secrets 両方 (7 か所) |
| 月額コスト | $0 | $0 |

---

## 3. workflow YAML 変更 (CEO 既に実装済み)

`projects/PRJ-019/app/scripts/openclaw-monitor/.github/workflows/openclaw-monitor.yml`

### 3.1 削除した step
```yaml
# 削除
- name: Load secrets from 1Password
  uses: 1password/load-secrets-action@v2
  with:
    export-env: true
  env:
    OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
    SLACK_WEBHOOK_HITL: op://prj019/slack/webhook_hitl
    ...
```

### 3.2 統合した Run check step
```yaml
- name: Run check
  env:
    # ---- Tier 1 真の secret (GitHub Actions Secrets から直接展開) ----
    SLACK_WEBHOOK_HITL: ${{ secrets.SLACK_WEBHOOK_HITL }}
    SLACK_WEBHOOK_MONITOR: ${{ secrets.SLACK_WEBHOOK_MONITOR }}
    SLACK_WEBHOOK_DRILL: ${{ secrets.SLACK_WEBHOOK_DRILL }}
    RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
    OWNER_NOTIFY_EMAIL: ${{ secrets.OWNER_NOTIFY_EMAIL }}
    DEV_NOTIFY_EMAIL: ${{ secrets.DEV_NOTIFY_EMAIL }}
    GITHUB_PAT_READ_ONLY: ${{ secrets.GITHUB_PAT_READ_ONLY }}
    # ---- Tier 2 平文 (workflow 内直接記述) ----
    NODE_ENV: production
    TZ: Asia/Tokyo
    SLACK_CHANNEL_HITL: '#hitl'
    SLACK_CHANNEL_MONITOR: '#monitor'
    SLACK_CHANNEL_DRILL: '#drill'
  run: pnpm run ${{ inputs.mode || 'check' }}
```

---

## 4. Owner 作業手順 (GitHub Actions Secrets 登録)

### 4.1 概要
**openclaw-monitor で実際に使うのは 7 fields**。残り 2 fields (Supabase service_role / db_url) は本 workflow 未使用なので **後回しで可** (Phase 1 W3 で DB 連携 workflow を追加するときに登録)。

### 4.2 登録対象 (7 fields, 全て必須)

| # | GitHub Secret 名 | Vault 元参照 (op://) | 用途 |
| --- | --- | --- | --- |
| 1 | `SLACK_WEBHOOK_HITL` | `op://prj019/slack/webhook_hitl` | HITL 質問 channel |
| 2 | `SLACK_WEBHOOK_MONITOR` | `op://prj019/slack/webhook_monitor` | monitor 通知 channel |
| 3 | `SLACK_WEBHOOK_DRILL` | `op://prj019/slack/webhook_drill` | drill (L3 高 severity) channel |
| 4 | `RESEND_API_KEY` | `op://prj019/resend/api_key` | メール fallback |
| 5 | `OWNER_NOTIFY_EMAIL` | `op://prj019/notify/owner_email` | Owner 通知先 |
| 6 | `DEV_NOTIFY_EMAIL` | `op://prj019/notify/dev_email` | Dev 通知先 |
| 7 | `GH_PAT_READ_ONLY` ⚠ | `op://prj019/github/pat_read_only` | GitHub API rate-limit 緩和 |

> **⚠ 7 番目の Secret 名注意**: GitHub Actions は `GITHUB_` prefix の Secret 登録を禁止 (HTTP 422 エラー)。Secret 名は `GH_PAT_READ_ONLY` を使用し、workflow YAML の `env:` 側で `GITHUB_PAT_READ_ONLY: ${{ secrets.GH_PAT_READ_ONLY }}` と橋渡しする。コード側 (`sources.ts` / `preflight-env.ts`) は `GITHUB_PAT_READ_ONLY` の env 名のまま動作。

### 4.3 Step-by-step (PowerShell + 1Password CLI)

#### 手順 A: 推奨ルート (op CLI で値を取り出す)

PowerShell を開き、PRJ-019 ルートで実行:

```powershell
cd C:\Users\hiron\Desktop\claude-code-company\projects\PRJ-019\app

# 1Password に signin 済みでない場合
op signin

# 7 値を順番に表示 (画面に出るので copy → GitHub に貼付)
op read "op://prj019/slack/webhook_hitl"
op read "op://prj019/slack/webhook_monitor"
op read "op://prj019/slack/webhook_drill"
op read "op://prj019/resend/api_key"
op read "op://prj019/notify/owner_email"
op read "op://prj019/notify/dev_email"
op read "op://prj019/github/pat_read_only"
```

各コマンドが値を 1 行で出力する。**copy & paste** で次の Step に渡す。

> **セキュリティ注意**: PowerShell 履歴に値は残らない (出力のみ)。ただし terminal scrollback に残るので、**完了後はターミナル closing 推奨**。

#### 手順 B: GitHub GUI で 1 つずつ登録

1. ブラウザで GitHub repo を開く
   - URL: `https://github.com/<your-org>/<repo>` (claude-code-company を public push した repo)
2. 上部 tab → **Settings**
3. 左 sidebar → **Secrets and variables** → **Actions**
4. 緑ボタン **New repository secret** をクリック
5. **Name** に `SLACK_WEBHOOK_HITL` を入力
6. **Secret** に手順 A で copy した値を貼付
7. **Add secret** をクリック
8. 上記 4-7 を残り 6 fields について繰り返す

#### 手順 C: gh CLI で一括登録 (上級者向け、任意)

PowerShell で:

```powershell
# gh CLI 認証済みなら 1 行ずつ登録可能
$env:GH_REPO = "<owner>/<repo>"  # 自分のリポジトリ

op read "op://prj019/slack/webhook_hitl"      | gh secret set SLACK_WEBHOOK_HITL
op read "op://prj019/slack/webhook_monitor"   | gh secret set SLACK_WEBHOOK_MONITOR
op read "op://prj019/slack/webhook_drill"     | gh secret set SLACK_WEBHOOK_DRILL
op read "op://prj019/resend/api_key"          | gh secret set RESEND_API_KEY
op read "op://prj019/notify/owner_email"      | gh secret set OWNER_NOTIFY_EMAIL
op read "op://prj019/notify/dev_email"        | gh secret set DEV_NOTIFY_EMAIL
op read "op://prj019/github/pat_read_only"    | gh secret set GH_PAT_READ_ONLY
```

> ◎ 利点: 値を画面に表示せず Secret 登録できる (最も安全)。
> △ 前提: `gh auth login` 済み + 該当 repo に push 権限。

### 4.4 登録確認

GitHub GUI: Settings → Secrets and variables → Actions に **Repository secrets** が 7 件並べば完了。

または PowerShell で:

```powershell
gh secret list --repo <owner>/<repo>
```

期待出力:
```
DEV_NOTIFY_EMAIL          Updated 2026-05-04
GITHUB_PAT_READ_ONLY      Updated 2026-05-04
OWNER_NOTIFY_EMAIL        Updated 2026-05-04
RESEND_API_KEY            Updated 2026-05-04
SLACK_WEBHOOK_DRILL       Updated 2026-05-04
SLACK_WEBHOOK_HITL        Updated 2026-05-04
SLACK_WEBHOOK_MONITOR     Updated 2026-05-04
GH_PAT_READ_ONLY          Updated 2026-05-04
```

> **注**: 当初命名予定の `GITHUB_PAT_READ_ONLY` は GitHub 予約語制約により登録不可 (HTTP 422)、`GH_PAT_READ_ONLY` で代替。詳細は §4.2 注記参照。

---

## 5. workflow 動作確認

### 5.1 manual dispatch (推奨初回検証)

GitHub repo:
1. **Actions** tab を開く
2. 左 sidebar **openclaw-monitor** をクリック
3. 右上 **Run workflow** ▼ ボタン
4. mode: `check` のまま **Run workflow** を押す

数十秒で run が完了 (ubuntu runner は数秒で起動)。緑 ✓ なら成功。

### 5.2 失敗時の見方

run を開いて Run check step の log を見る。

| 症状 | 原因候補 | 対処 |
| --- | --- | --- |
| `slack-webhook-hitl is empty` | Secret 未登録 or 名前 typo | 4.4 で `gh secret list` 確認、不足分を再登録 |
| `Slack webhook 400 Bad Request` | webhook URL の値が不正 (改行混入など) | op read 出力を再確認、再登録 |
| `Resend 401` | RESEND_API_KEY 失効 | Resend dashboard で regenerate → Vault と Secrets 両方更新 |
| `npm ERR! Cannot find module` | dependencies install 失敗 | pnpm-lock.yaml の整合性を確認 |

### 5.3 daily schedule 確認

workflow 自動実行は **18:00 UTC = 03:00 JST**。
翌朝の Actions tab に scheduled run が出ていれば cron 動作 OK。

---

## 6. rotation SOP (90 日サイクル)

### 6.1 元設計 (Service Account 経路) との差分

| 項目 | Service Account 経路 | Plan B (現行) |
| --- | --- | --- |
| Vault 値更新 | 1 回 (Vault のみ) | 1 回 (Vault) |
| GitHub Secrets 更新 | 不要 (op:// 経由なので自動同期) | **7 回必須 (各 Secret 個別更新)** |
| 工数 | ~5 分 | ~20 分 |

### 6.2 推奨 rotation 手順 (90 日に 1 回)

1. Vault `prj019` で対象 item を更新 (1Password GUI で edit)
2. 上記 4.3 手順 C (gh CLI) を再実行 → 7 Secrets を一括上書き
3. **manual dispatch** で workflow が新値で動くことを確認
4. `decisions.md` に rotation log を追記

### 6.3 rotation 簡略化 script (将来 Phase 1 W2 で実装予定)

`projects/PRJ-019/app/scripts/rotate-secrets.ts` を作成し、上記 7 Secrets を一括 sync する想定。Owner が `pnpm rotate-secrets` 1 発で済むようにする。

---

## 7. 残タスク (Owner 担当)

- [ ] **Owner**: 4.3 手順 A or C で 7 Secrets を GitHub Actions に登録
- [ ] **Owner**: 4.4 で 7 件登録を確認
- [ ] **Owner**: 5.1 で manual dispatch 実行、緑 ✓ を確認
- [ ] **Owner**: CEO に「Plan B 完了」を報告
- [ ] **CEO/Dev**: Plan B 完了報告を受けて DEC-019-053 v15.2 を最終化、進捗 45% → 50% 更新
- [ ] **Phase 1 W2 で**: Supabase service_role / db_url を 8-9 番目として登録 (DB 連携 workflow 追加時)

---

## 8. 補足: なぜ 7 fields だけで十分か

`projects/PRJ-019/app/.env.example` Tier 1 は 9 fields だが、**openclaw-monitor.yml が実際に使うのは 7**:

- ✅ Slack 3 webhook (severity classifier の出力 channel)
- ✅ Resend api_key + 2 通知 email (Slack fallback)
- ✅ GitHub PAT (rate-limit 緩和)
- ⏸ Supabase service_role_key — 本 workflow 未使用 (DB 書込みなし)
- ⏸ Supabase db_url — 本 workflow 未使用 (DB 接続なし)

Supabase 2 fields は Phase 1 W3 で DB 連携 workflow を追加するタイミングで Secrets に登録すれば良い。**今回は 7 で十分**。

---

## 9. 完了基準 (RC-2 後段)

- [x] workflow YAML 修正 (CEO 実装済み)
- [ ] 7 GitHub Actions Secrets 登録 (Owner 作業)
- [ ] manual dispatch で緑 ✓ 確認 (Owner 作業)

3 つ全部 ✓ になれば **RC-2 完了**、W0-Week2 (5/9 朝 sync) に進める。

---

## 10. ESCALATE 条件 (Plan B → Plan A 再検討)

下記のいずれかが Phase 1 中に発生したら Plan A (Business 昇格) を再評価:

- rotation を 3 サイクル経験して工数が予想より増大 (>1 時間/回)
- workflow が 5 個以上に増えて Secrets 数が 30+ になる
- secret 漏洩インシデントが発生し audit log が必要になる

それまでは **Plan B 継続で OK**。

---

> 出典: DEC-019-053 v15.2 補足 (2026-05-04 Owner 5/4 確定)
> 関連: dev-1password-slack-integration-v2-2.md (op run all-or-nothing 解決の前段)
