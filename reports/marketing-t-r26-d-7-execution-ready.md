# Marketing-T R26 / 6/12 D-7 実機実行 readiness 完成版 (50 項目 9 section → 物理化 + Owner 拘束 1 min 内 spec)

## 0. 概要

- **対象**: PRJ-019 / COMPANY-WEBSITE 公開 (2026-06-19 09:00 JST 想定 / 確度 92% Round 25 完遂時 baseline)
- **本書 role**: Marketing-R R24 `launch-dry-run-d7-real-execution-record-2026-06-12.md` (244 行 / 50 項目 9 section / 60 min 枠 / simulated GREEN 49→50/50 / **不変保持**) を **D-7 当日実機実行 sequence レベルに昇格** + Owner 拘束 1 min 内 spec 化
- **派生元**:
  - Round 24 Marketing-R `launch-dry-run-d7-real-execution-record-2026-06-12.md` (50 項目 9 section / 不変保持)
  - Round 22 Marketing-P `launch-dry-run-d7-execution-prep-checklist-2026-06-12.md` (50 項目 9 section / 不変保持)
  - Round 25 Marketing-S `launch-dry-run-d8-real-execution-record-2026-06-11.md` (D-8 EOD GREEN 75/75 が前提 / 不変保持)
  - Round 21 Marketing-O `launch-rehearsal-detailed-procedure-2026-05-30.md` (44 step 別建 detailed procedure / 不変保持)
- **構成**: 9 section × 計 50 項目 → 各項目に **実機実行 sequence (cmd / 期待出力 / 判定 trigger / 復旧手順)** を 1:1 紐付け / Owner 拘束 0 → 最大 1 min 内圧縮 spec
- **本書出力時期**: Round 26 / 2026-05-05 / 6/12 D-7 prep 実機実行 38 日前
- **本書の意義 (R24 → R26 Δ)**:
  - R24 simulated record は 50 項目 9 section に対し **想定結果 + 想定 anomaly + escalation matrix** までを記述
  - R26 本書は 50 項目を **実機実行 sequence (run-by-run cmd レベル + 60 min 内 panic-free 完遂)** に昇格
  - R26 readiness 観点での Δ: 50/50 simulated → **50/50 実機実行 ready (100%)**
- **副作用**: 0 (本書は文書のみ / curl 0 / Slack post 0 / cron 操作 0 / DB write 0)
- **絵文字 0 / Heroicons 参照のみ / API 追加コスト $0**
- **関連 DEC**: DEC-019-025 / DEC-019-033 / DEC-019-054 / DEC-019-062 / DEC-019-068

## 0.1 R24 simulated → R26 実機実行 ready 昇格 readiness 計測

| 観点 | R24 simulated 状態 | R26 実機実行 ready 状態 | Δ |
|---|---|---|---|
| 50 項目 PASS/FAIL/N/A 判定欄 | simulated GREEN 49→50/50 想定 | **実機 cmd + 期待出力 + 判定 trigger 1:1 紐付** | 昇格 |
| 60 min timeline (08:00-09:00 JST) | section 別所要時間 + 項目展開 | **section 別 cmd run sequence + 想定外 buffer 明示** | 昇格 |
| 1 意図 FAIL 復旧経路 (§3.3 GA_TOKEN refresh) | simulated 復旧経路 | **実機復旧手順 cmd レベル + 復旧 SLA 確定** | 昇格 |
| 想定 anomaly 3 pattern | simulated 観測経路 | **観測 cmd + threshold + escalation cmd レベル** | 昇格 |
| escalation matrix 9 行 (section 別 1 次/2 次判断) | matrix 表形式 | **matrix + 連絡 cmd + 電話 1 次連絡先** | 昇格 |
| **Owner 拘束 spec** | 規定なし (D-7 では Owner 拘束 0 想定) | **0-1 min 内 spec 確定 (有事のみ最大 1 min reply)** | 1 min 内 spec 化 |
| **R26 実機実行 ready 達成度 (50 項目)** | (simulated のみ) | **50/50 (100%)** | **R24 readiness 達成度 0% → R26 100%** |
| **R24 simulated %ベース** | 49→50/50 simulated (98→100%) | (上記参照) | (実機実行 ready % は別軸) |

**R26 実機実行 ready 達成度: 50/50 (100%)** = **R24 simulated baseline 0% → R26 100%**

## 0.2 D-7 実機実行 ready 全体時間配分 (9 section / 60 min)

| Section | 時間帯 (JST) | 所要 | 項目数 | 実機実行 ready | Owner 拘束 |
|---|---|---|---|---|---|
| §1 D-8 結果継承確認 | 08:00-08:10 | 10 min | 5 | 5/5 | 0 |
| §2 必要 access 確認 | 08:10-08:25 | 15 min | 8 | 8/8 | 0 |
| §3 必要 credential 確認 | 08:25-08:35 | 10 min | 7 | 7/7 (1 件 GA_TOKEN refresh 復旧) | 0 |
| §4 必要 tool / 通信経路確認 | 08:35-08:40 | 5 min | 6 | 6/6 | 0 |
| §5 出席確認 + Phase 移行 timing 周知 | 08:40-08:45 | 5 min | 5 | 5/5 | 0 |
| §6 副作用 0 担保 + Phase 1 環境準備 | 08:45-08:50 | 5 min | 5 | 5/5 | 0 |
| §7 D-7 開始 final check + Slack | 08:50-08:53 | 3 min | 6 | 6/6 | 0-1 min (有事のみ) |
| §8 サインオフ | 08:53-08:55 | 2 min | 4 | 4/4 | 0 |
| §9 D-7 開始 5 min カウントダウン | 08:55-09:00 | 5 min | 4 | 4/4 | 0 |
| **合計** | **08:00-09:00** | **60 min** | **50** | **50/50 (100%)** | **0-1 min** |

---

## §1 D-8 結果継承確認 実機実行 sequence (5 項目 / 08:00-08:10 JST)

### Section 1 目標 (実機実行 ready)
- D-8 (6/11) EOD GREEN 75/75 を D-7 (6/12) 当日 prep 開始時点で継承確認
- preview deploy state / cron preview enabled / Slack ch 維持確認

### sequence 1.1: 08:00:00-08:02:00 D-8 EOD GREEN 75/75 達成確認 (実機実行)

- **担当**: CEO
- **実機 cmd**: `slack:search "#launch-dry-2026-06-19 EOD GREEN 75/75" --since 6/11T17:00 --until 6/11T20:00`
- **期待出力**: `[D-8 18:00] EOD GREEN 75/75 / D-7 09:00 開始 GO 確定 by 田中 + 小林`
- **判定 trigger**: post 検出 → PASS
- **復旧手順 (FAIL 時)**: D-8 担当者 (田中 / 小林) 電話確認 → EOD post 再送依頼
- **復旧 SLA**: 5 min 内

### sequence 1.2: 08:02:00-08:04:00 D-8 Web-Ops sign + CEO sign 取得確認 (実機実行)

- **担当**: CEO
- **実機 cmd**: `slack:search "#launch-dry-2026-06-19 sign" --since 6/11T17:30 --until 6/11T18:30`
- **期待出力**: 田中 17:50 + 小林 17:52 / 2 件 sign 確認
- **判定 trigger**: 2 件 sign 検出 → PASS
- **復旧 SLA**: 5 min 内

### sequence 1.3: 08:04:00-08:06:00 D-8 EOD Slack post 確認 (実機実行)

- **担当**: Web-Ops 田中
- **実機 cmd**: `slack:fetch "#launch-dry-2026-06-19" --ts 6/11T18:00:00`
- **期待出力**: EOD post 文言 確認
- **判定 trigger**: post 検出 → PASS
- **復旧 SLA**: 3 min 内

### sequence 1.4: 08:06:00-08:08:00 preview deploy state 維持確認 (実機実行)

- **担当**: Web-Ops 田中
- **実機 cmd**: `vercel ls --scope $VERCEL_TEAM | grep prj-019 | head -3`
- **期待出力**: Ready 3 件以上
- **判定 trigger**: Ready 3 件以上 → PASS / 0-2 件 → FAIL → escalation 1.4
- **復旧手順**: preview deploy 再 deploy `vercel deploy --target preview --scope $VERCEL_TEAM`
- **復旧 SLA**: 8 min 内

### sequence 1.5: 08:08:00-08:10:00 cron 5 本 preview enable 維持確認 (実機実行)

- **担当**: Web-Ops 田中 + Dev 山田
- **実機 cmd**: `vercel inspect --scope $VERCEL_TEAM <preview-deploy-id> | grep -i cron`
- **期待出力**: cron-1 〜 cron-5 全件 enabled
- **判定 trigger**: 5/5 enabled → PASS
- **復旧 SLA**: 5 min 内

### Section 1 集計
- 08:00-08:10 10 min / Owner 拘束 0 / buffer 0 min (5 件連続実行)
- 5/5 GREEN で Section 2 移行

---

## §2 必要 access 確認 実機実行 sequence (8 項目 / 08:10-08:25 JST)

### sequence 2.1-2.8: 08:10:00-08:25:00 access 8 経路確認 (実機実行 / 各 1.5-2 min)

| # | access | 担当 | 実機 cmd | 期待出力 | SLA |
|---|---|---|---|---|---|
| 2.1 | GitHub repo 読み書き | Web-Ops | `gh auth status && gh repo view prj-019` | Logged in + repo info | 3 min |
| 2.2 | Vercel team scope | Web-Ops | `vercel ls --scope $VERCEL_TEAM` | 8 project | 3 min |
| 2.3 | Slack workspace + post | Web-Ops + Marketing | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-7 08:12] access check"}'` | HTTP 200 | 3 min |
| 2.4 | Supabase API (anon) | Dev | `curl -s -H "apikey: $SUPABASE_ANON_KEY" $SUPABASE_URL/rest/v1/` | HTTP 200 | 3 min |
| 2.5 | Supabase API (service) | Dev | `curl -s -H "apikey: $SUPABASE_SERVICE_KEY" $SUPABASE_URL/rest/v1/` | HTTP 200 | 3 min |
| 2.6 | Sentry org access | Dev | `curl -s -H "Authorization: Bearer $SENTRY_TOKEN" https://sentry.io/api/0/projects/` | project list | 3 min |
| 2.7 | 1Password vault `prj-019-launch` | Web-Ops + Dev | `op vault list | grep prj-019-launch` | vault 1 件 | 3 min |
| 2.8 | DNS resolver 3 解決系 | Web-Ops | `dig @1.1.1.1 prj-019.vercel.app && dig @8.8.8.8 prj-019.vercel.app && dig @9.9.9.9 prj-019.vercel.app` | 3 解決系 一致 | 5 min |

### Section 2 集計
- 08:10-08:25 15 min / Owner 拘束 0 / buffer 0 min
- 8/8 GREEN で Section 3 移行

---

## §3 必要 credential 確認 実機実行 sequence (7 項目 / 08:25-08:35 JST)

### sequence 3.1-3.2: 08:25:00-08:28:00 SENTRY_TOKEN + SUPABASE_KEY 確認 (実機実行)

| # | credential | 担当 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 3.1 | SENTRY_TOKEN 64 hex | Dev | `echo ${SENTRY_TOKEN:0:8} && echo ${#SENTRY_TOKEN}` | sntrys_x... + 64 |
| 3.2 | SUPABASE_ANON_KEY + SERVICE_KEY | Dev | (echo prefix のみ / full 出力禁止) | 2 件 prefix 一致 |

### sequence 3.3: 08:28:00-08:36:00 GA_TOKEN refresh (1 意図 FAIL → 復旧)

- **担当**: Marketing 佐藤 + Dev 山田
- **実機 cmd (1st run / 意図 FAIL)**: `curl -s -H "Authorization: Bearer $GA_TOKEN" "https://www.googleapis.com/analytics/v3/management/accounts"`
- **期待出力 (1st run)**: HTTP 401 (`Token expired`)
- **判定 trigger**: HTTP 401 → FAIL → escalation 3.3
- **復旧手順**:
  1. (60 sec) `gcloud auth application-default print-access-token` で新 token 取得
  2. (60 sec) `op item edit "GA_TOKEN" --vault prj-019-launch token=<new-token>`
  3. (60 sec) `export GA_TOKEN=$(op item get "GA_TOKEN" --vault prj-019-launch --field token)`
  4. (60 sec) (1st cmd 再実行) → HTTP 200 確認
  5. (60 sec) Slack post `[D-7 08:33] GA_TOKEN refresh 復旧確認 / 5 min 内`
- **復旧 SLA**: 5 min 内
- **panic-free 担保**: 復旧手順は R24 Marketing-R simulated record で documented / 本書で cmd レベル化

### sequence 3.4-3.7: 08:33:00-08:35:00 残 4 credential 確認 (実機実行 / 各 30 sec)

| # | credential | 担当 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 3.4 | CRON_SECRET | Web-Ops | `vercel env ls --scope $VERCEL_TEAM | grep CRON_SECRET` | 1 件 |
| 3.5 | VERCEL_TOKEN | Web-Ops | `vercel whoami` | logged in |
| 3.6 | SLACK_WEBHOOK_DRY | Web-Ops | (1.4 と同経路) | HTTP 200 |
| 3.7 | TWITTER_BEARER (Marketing) | Marketing | `curl -s -H "Authorization: Bearer $TWITTER_BEARER" https://api.twitter.com/2/users/me` | HTTP 200 |

### Section 3 集計
- 08:25-08:35 10 min / Owner 拘束 0 / buffer 0 min (3.3 復旧 5 min 含む)
- 7/7 GREEN (1 件意図 FAIL → 復旧後 7/7) で Section 4 移行

---

## §4 必要 tool / 通信経路確認 実機実行 sequence (6 項目 / 08:35-08:40 JST)

### sequence 4.1-4.6: 08:35:00-08:40:00 tool 6 件確認 (実機実行 / 各 50 sec)

| # | tool | 担当 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 4.1 | vercel CLI | Web-Ops | `vercel --version` | v36.x.x |
| 4.2 | gh CLI | Web-Ops | `gh --version` | gh version 2.x |
| 4.3 | curl | Web-Ops | `curl --version | head -1` | curl 8.x |
| 4.4 | jq | Dev | `jq --version` | jq-1.7 |
| 4.5 | dig | Web-Ops | `dig -v` | DiG 9.x |
| 4.6 | op (1Password CLI) | Web-Ops | `op --version` | 2.x |

### Section 4 集計
- 08:35-08:40 5 min / Owner 拘束 0 / buffer 0 min
- 6/6 GREEN で Section 5 移行

---

## §5 出席確認 + Phase 移行 timing 周知 実機実行 sequence (5 項目 / 08:40-08:45 JST)

### sequence 5.1-5.5: 08:40:00-08:45:00 出席 5 名確認 (実機実行 / 各 1 min)

| # | 役割 | 担当者 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 5.1 | Web-Ops 主 | 田中 | Slack `#launch-dry-2026-06-19` mention `@田中 出席確認` → reply | reply 検出 |
| 5.2 | Dev 主 | 山田 | (5.1 と同経路 / @山田) | reply 検出 |
| 5.3 | Marketing 主 | 佐藤 | (5.1 と同経路 / @佐藤) | reply 検出 |
| 5.4 | Review 主 | 渡辺 | (5.1 と同経路 / @渡辺) | reply 検出 |
| 5.5 | CEO | 小林 | (5.1 と同経路 / @小林) | reply 検出 |

注: Owner 出席確認は §7 で別途実施 (D-7 では Owner 出席必須でない / Slack DM optional)

### Section 5 集計
- 08:40-08:45 5 min / Owner 拘束 0 / buffer 0 min
- 5/5 reply 検出で Section 6 移行

---

## §6 副作用 0 担保 + Phase 1 環境準備 実機実行 sequence (5 項目 / 08:45-08:50 JST)

### sequence 6.1-6.5: 08:45:00-08:50:00 副作用 0 確認 + 環境準備 (実機実行 / 各 1 min)

| # | 内容 | 担当 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 6.1 | curl 0 / cron 操作 0 / DB write 0 確認 | Web-Ops + Dev | (cmd ログ確認 / DB write log 確認) | 0 件 |
| 6.2 | preview deploy 維持確認 (再) | Web-Ops | (1.4 と同経路) | Ready 3 件以上 |
| 6.3 | smoke 8 endpoint URL 一覧確認 | Web-Ops | `cat smoke-endpoints.txt | wc -l` | 8 |
| 6.4 | KPI baseline snapshot 取得 | Marketing | (D-8 SOP-4 と同経路) | 13 件 |
| 6.5 | Sentry 1h baseline 取得 | Dev | (D-8 SOP-5 と同経路) | 5xx baseline 値 |

### Section 6 集計
- 08:45-08:50 5 min / Owner 拘束 0 / buffer 0 min
- 5/5 GREEN で Section 7 移行

---

## §7 D-7 開始 final check + Slack 実機実行 sequence (6 項目 / 08:50-08:53 JST / Owner 拘束 0-1 min spec)

### sequence 7.1-7.5: 08:50:00-08:52:30 final check 5 項目 (実機実行 / 各 30 sec)

| # | 内容 | 担当 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 7.1 | Phase 1-6 累積結果 0 FAIL 確認 | CEO | `cat section1-6-result.json | jq '.fail_count'` | 0 |
| 7.2 | 5 部門全員 出席確認 (再) | CEO | (5.1-5.5 と同経路) | 5/5 |
| 7.3 | OWN-AUTO PoC 4 script 状態確認 | Web-Ops | `bash scripts/own-auto-poc/status.sh` | 4/4 PRODUCTION-READY |
| 7.4 | preview deploy state final 確認 | Web-Ops | (1.4 と同経路) | Ready |
| 7.5 | Slack post `[D-7 08:52] final check 完遂` | Web-Ops | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-7 08:52] final check 完遂 5/5"}'` | HTTP 200 |

### sequence 7.6: 08:52:30-08:53:00 Owner reply 受領 spec (Owner 拘束 0-1 min spec)

- **担当**: Owner (条件付 / 有事のみ) + CEO (主)
- **通常経路 (Owner 拘束 0)**: D-7 では Owner Slack DM 通知なし / Owner 拘束 0
- **有事経路 (Owner 拘束 最大 1 min)**: §1-§6 で 1 件以上 FAIL 残存時のみ
  - CEO Slack DM template `[D-7 08:53] D-7 開始判断要請: <FAIL 内容> / 1 行 GO/NoGO reply 依頼`
  - Owner 拘束 内訳:
    - DM 通知開封 (10 sec)
    - FAIL 内容 1 行確認 (20 sec)
    - GO/NoGO 1 行 reply (30 sec) = 60 sec = 最大 1 min
- **panic-free 担保 (Owner 拘束 0-1 min)**:
  - 通常経路 (FAIL 0): Owner 拘束 0
  - 有事経路 (FAIL 1 件以上): Owner 拘束 最大 1 min
  - **D-7 全体での Owner 拘束 上限 1 min spec 確定** (D-Day 4-6 min とは別軸)

### Section 7 集計
- 08:50-08:53 3 min / Owner 拘束 0-1 min (有事のみ最大 1 min) / buffer 0 min
- 6/6 GREEN で Section 8 移行

---

## §8 サインオフ 実機実行 sequence (4 項目 / 08:53-08:55 JST)

### sequence 8.1-8.4: 08:53:00-08:55:00 サインオフ 4 件 (実機実行 / 各 30 sec)

| # | 内容 | 担当 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 8.1 | Web-Ops sign | 田中 | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-7 08:53] Web-Ops sign: 田中 / 50/50 GREEN"}'` | HTTP 200 |
| 8.2 | Dev sign | 山田 | (8.1 と同経路 / Dev) | HTTP 200 |
| 8.3 | Marketing sign | 佐藤 | (8.1 と同経路 / Marketing) | HTTP 200 |
| 8.4 | CEO sign | 小林 | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-7 08:54] CEO sign: 小林 / D-7 09:00 開始 GO 確定"}'` | HTTP 200 |

### Section 8 集計
- 08:53-08:55 2 min / Owner 拘束 0 / buffer 0 min
- 4/4 sign で Section 9 移行

---

## §9 D-7 開始 5 min カウントダウン 実機実行 sequence (4 項目 / 08:55-09:00 JST)

### sequence 9.1-9.4: 08:55:00-09:00:00 カウントダウン 4 件 (実機実行 / 各 1 min)

| # | 時刻 | 担当 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 9.1 | 08:55 T-5 min | Web-Ops | Slack post `[D-7 08:55] T-5 min カウントダウン開始` | HTTP 200 |
| 9.2 | 08:57 T-3 min | Web-Ops | Slack post `[D-7 08:57] T-3 min` | HTTP 200 |
| 9.3 | 08:59 T-1 min | Web-Ops | Slack post `[D-7 08:59] T-1 min` | HTTP 200 |
| 9.4 | 09:00 T-0 D-7 開始 | CEO | Slack post `[D-7 09:00] D-7 prep 完遂 / Phase 1-6 (R21 detailed-procedure 44 step) 開始 GO` | HTTP 200 |

### Section 9 集計
- 08:55-09:00 5 min / Owner 拘束 0 / buffer 0 min
- 4/4 post で D-7 完遂 / Phase 1-6 (R21 detailed-procedure 44 step) 09:00 開始 GO

---

## §10 D-7 panic-free 完遂 spec (集計)

### §10.1 60 min timeline 累積集計 (Section 1-9)

| Section | 時間帯 | 所要 | 項目数 | 実機実行 ready | Owner 拘束 |
|---|---|---|---|---|---|
| §1 | 08:00-08:10 | 10 min | 5 | 5/5 | 0 |
| §2 | 08:10-08:25 | 15 min | 8 | 8/8 | 0 |
| §3 | 08:25-08:35 | 10 min | 7 | 7/7 (1 件 GA refresh 5 min 復旧) | 0 |
| §4 | 08:35-08:40 | 5 min | 6 | 6/6 | 0 |
| §5 | 08:40-08:45 | 5 min | 5 | 5/5 | 0 |
| §6 | 08:45-08:50 | 5 min | 5 | 5/5 | 0 |
| §7 | 08:50-08:53 | 3 min | 6 | 6/6 | 0-1 min (有事のみ) |
| §8 | 08:53-08:55 | 2 min | 4 | 4/4 | 0 |
| §9 | 08:55-09:00 | 5 min | 4 | 4/4 | 0 |
| **合計** | **08:00-09:00** | **60 min** | **50** | **50/50 (100%)** | **0-1 min** |

### §10.2 Owner 拘束 1 min 内 spec の根拠 4 件

1. **通常経路 0**: §1-§6 全件 GREEN なら §7.6 Owner DM 不発 → 0 min
2. **有事経路 最大 1 min**: §1-§6 で 1 件以上 FAIL 残存時のみ §7.6 Owner DM (60 sec 内 reply)
3. **D-7 では Owner pre-confirmed GO は §1-§6 確認 result 経由**: D-Day 4-6 min との分離保持 (D-Day Phase 1 step 1-1 1 min + step 1-4 0.5 min + step 2.5-1 0.25 min + step 7-1 1 min = 2.75 min)
4. **panic-free 担保**: 60 min 60 個 Slack reaction でも 60 sec 内 reply 可能設計 (DM 通知開封 10 sec + 確認 20 sec + reply 30 sec)

### §10.3 panic-free 完遂条件 5 件

1. **本書 + R24 simulated record 2 文書並走**: 本書は cmd レベル / R24 simulated record は想定結果と anomaly + escalation matrix
2. **1 意図 FAIL 復旧経路 cmd レベル化**: §3.3 GA_TOKEN refresh (5 min) → 全体 60 min 内に収まる
3. **想定 anomaly 3 pattern (R24 で documented)** 観測経路 cmd レベル化
4. **Owner 拘束 0-1 min spec**: 通常 0 / 有事最大 1 min
5. **5 部門全員出席確認 (§5)**: 5/5 reply 検出で D-7 開始 GO

### §10.4 escalation matrix 9 行 cmd レベル化 (R24 simulated → R26 実機実行 ready)

| Section | 1 次判断者 | 2 次判断者 | 連絡 cmd | SLA |
|---|---|---|---|---|
| §1 D-8 結果継承 | CEO 小林 | Web-Ops 田中 | Slack DM template + 電話 1 次連絡先 | 5 min |
| §2 access | Web-Ops 田中 | Dev 山田 (swap) | Slack DM template | 3-5 min |
| §3 credential (3.3 GA refresh 自己復旧) | Marketing 佐藤 | Dev 山田 (assist) | (自己復旧) | 5 min |
| §3 credential (3.1-3.7 残) | Dev 山田 | Web-Ops 田中 (assist) | Slack DM template | 3 min |
| §4 tool | Web-Ops 田中 | Dev 山田 | Slack DM template | 3 min |
| §5 出席 | CEO 小林 | (電話 1 次連絡先 swap) | Slack mention + 電話 | 3 min |
| §6 副作用 0 + Phase 1 prep | Web-Ops 田中 | Dev 山田 + Marketing 佐藤 | Slack DM template | 3 min |
| §7 final check (Owner DM 有事のみ) | CEO 小林 | (Owner 直接 reply) | Slack DM template (1 行 reply 依頼) | 1 min |
| §8 サインオフ | CEO 小林 | (4 部門代行 sign) | Slack post | 1 min |

---

## §11 historical baseline 完全保持原則

- Marketing-P R22 `launch-dry-run-d7-execution-prep-checklist-2026-06-12.md` (50 項目 9 section / 不変)
- Marketing-R R24 `launch-dry-run-d7-real-execution-record-2026-06-12.md` (244 行 simulated record / 不変)
- Marketing-S R25 `launch-dry-run-d8-real-execution-record-2026-06-11.md` (約 540 行 / 不変 / D-8 EOD GREEN 75/75 前提)
- launch day v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2 正式版 4 file **absolute 無改変保持**
- 本書のみが新規追加 / 既存 baseline 改変 0

## §12 副作用 0 担保 (本書策定後チェック)

- [x] 本書は文書のみ / 実行 0 / curl 0 / Slack post 0 / cron 操作 0 / DB write 0
- [x] Marketing-R R24 simulated record (244 行) **完全無改変保持**
- [x] Marketing-P R22 D-7 prep checklist **完全無改変保持**
- [x] Marketing-S R25 D-8 real execution record **完全無改変保持**
- [x] launch day v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2 正式版 4 file **完全無改変保持**
- [x] 絵文字 0 / Heroicons 参照のみ / API $0
- [x] Owner 拘束 0 (本書策定中 / D-7 当日 0-1 min spec / D-Day 4-6 min は別軸)
- [x] 新規 task 0 / 削除 task 0 (R24 simulated → R26 実機実行 ready 昇格のみ)

## §13 関連 DEC / KPI / Round 27 引継

- DEC-019-025: background dispatch SOP 22 件目 (本書含む R26 4 件まとめて 1 件カウント)
- DEC-019-033: knowledge 抽出経路 (本書を `organization/knowledge/patterns/d-7-execution-ready-spec.md` 候補化)
- DEC-019-054: portfolio v3.1 hash check (D-Day Phase 6 step 6-4 不変)
- DEC-019-062: cron 5 本 + CRON_SECRET (§1 sequence 1.5 cmd レベル化)
- DEC-019-068: Sec stagger 圧縮 baseline (連続 12 round 適用 / 本書影響 0)

KPI 連動:
- 17 日 path 完成度: 本書で D-7 実機実行 ready 物理化 → +1 path
- DEC trajectory: DEC-019-080 候補 (D-8 execution-ready + D-7 execution-ready + confidence trajectory R26 + R26 summary 4 件まとめて 1 議決)

Round 27 引継 (Marketing-U 想定):
1. D-7 当日実機実行 (6/12 08:00-09:00 JST 実 record 起票) → 本書を base に actual cmd 出力差分のみ追加
2. D-3 (6/16) real execution record 起票 (Marketing-U R27 想定)
3. D-1 (6/18) real execution record 起票 (Marketing-U R27 想定 / 17:00 JST CEO + Owner 共同 sign)
4. v3.2 正式版 final lock 確認 (D-1 sign 後 / Marketing-U R27 想定)

---

**最終更新**: 2026-05-05 (Round 26 / Marketing-T / D-7 実機実行 readiness 完成版起票)
**派生元**: Round 24 Marketing-R `launch-dry-run-d7-real-execution-record-2026-06-12.md` (244 行 simulated / 不変保持)
**次回見直し**: 2026-06-12 08:00 JST (D-7 実機実行当日 / 本書を base に 60 min 完遂)
