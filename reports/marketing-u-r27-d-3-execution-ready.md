# Marketing-U R27 / 6/16 D-3 実機実行 readiness 完成版 (OWN-AUTO PoC 4 script trial + dry-run / Owner 拘束 0 min spec)

## 0. 概要

- **対象**: PRJ-019 / COMPANY-WEBSITE 公開 (2026-06-19 09:00 JST 想定 / 確度 94% Round 26 完遂時 baseline)
- **本書 role**: D-3 (6/16) 当日 OWN-AUTO PoC 4 script trial + push notif dry-run + Slack thread auto-confirm dry-run + CEO online presence auto-reply dry-run を **実機実行 sequence レベル** で起票 / Owner 拘束 0 min spec 化
- **派生元**:
  - Round 26 Marketing-T `marketing-t-r26-d-7-execution-ready.md` (50 項目 9 section 60 min cmd レベル / 不変保持 / Owner 0-1 min spec)
  - Round 26 Marketing-T `marketing-t-r26-d-8-execution-ready.md` (75 項目 5 phase 9 hour cmd レベル / 不変保持 / Owner 0 min spec)
  - Round 25 Marketing-S `launch-dry-run-d8-real-execution-record-2026-06-11.md` (D-8 simulated baseline / 不変保持)
  - Round 23 Web-Ops-J `web-ops-j-r23-own-auto-poc-and-launch-day-v2-1.md` (OWN-AUTO PoC 4 script PRODUCTION-READY 状態 / 不変保持)
- **構成**: 6 section × 計 40 項目 → 各項目に **実機実行 sequence (cmd / 期待出力 / 判定 trigger / 復旧手順)** を 1:1 紐付け / Owner 拘束 0 min 確定 spec
- **本書出力時期**: Round 27 / 2026-05-05 / 6/16 D-3 実機実行 42 日前
- **本書の意義 (R26 → R27 Δ)**:
  - R26 Marketing-T は D-8 + D-7 2 件を cmd レベル化
  - R27 本書は **D-3 当日 (公開 3 日前) の OWN-AUTO PoC 4 script trial + dry-run** を 6 section 40 項目で cmd レベル化
  - D-3 readiness 観点での Δ: 0 件 → **40/40 実機実行 ready (100%)**
- **副作用**: 0 (本書は文書のみ / curl 0 / Slack post 0 / cron 操作 0 / DB write 0)
- **絵文字 0 / Heroicons 参照のみ / API 追加コスト $0 / Owner 拘束 0 min**
- **関連 DEC**: DEC-019-025 / DEC-019-033 / DEC-019-054 / DEC-019-062 / DEC-019-068

## 0.1 D-3 実機実行 ready readiness 計測 (40 項目 / 6 section)

| 観点 | R26 baseline 状態 | R27 D-3 ready 状態 | Δ |
|---|---|---|---|
| D-3 (6/16) 当日 OWN-AUTO PoC trial spec | 規定なし (R23 PRODUCTION-READY のみ) | **40 項目 cmd + 期待出力 + 判定 trigger 1:1 紐付** | 起票 |
| 4 script trial (script-1/2/3/4) | dry-run 個別実証 | **4 script 並列 dry-run + 統合 trial** | 統合化 |
| push notif dry-run | (D-Day Phase 7 のみ) | **D-3 当日 dry-run 専用 sequence 確立** | 起票 |
| Slack thread auto-confirm dry-run | (R23 PoC のみ) | **D-3 当日 dry-run sequence cmd レベル化** | 起票 |
| CEO online presence auto-reply dry-run | (R23 PoC のみ) | **D-3 当日 dry-run sequence cmd レベル化** | 起票 |
| Owner 拘束 spec | (D-3 規定なし) | **0 min 確定 (CEO + 4 部門のみ / Owner Slack DM 通知 0)** | 0 min spec 化 |
| **R27 D-3 実機実行 ready 達成度** | 0/40 | **40/40 (100%)** | **+40 項目達成** |

**昇格判定**: R27 本書起票で **D-3 (6/16) 当日 R27 実機実行 ready 40/40 (100%) 達成**

## 0.2 D-3 実機実行 ready 全体時間配分 (6 section / 90 min / 13:00-14:30 JST)

| Section | 時間帯 (JST) | 所要 | 項目数 | 実機実行 ready | Owner 拘束 |
|---|---|---|---|---|---|
| §1 D-7 結果継承 + 環境再確認 | 13:00-13:10 | 10 min | 6 | 6/6 | 0 |
| §2 OWN-AUTO PoC script-1 GitHub Actions webhook trial | 13:10-13:25 | 15 min | 7 | 7/7 | 0 |
| §3 OWN-AUTO PoC script-2 smoke wrapper trial | 13:25-13:40 | 15 min | 7 | 7/7 | 0 |
| §4 OWN-AUTO PoC script-3 Slack thread auto-confirm dry-run | 13:40-13:55 | 15 min | 7 | 7/7 | 0 |
| §5 OWN-AUTO PoC script-4 CEO online presence auto-reply dry-run | 13:55-14:10 | 15 min | 7 | 7/7 | 0 |
| §6 push notif dry-run + サインオフ + EOD | 14:10-14:30 | 20 min | 6 | 6/6 | 0 |
| **合計** | **13:00-14:30** | **90 min** | **40** | **40/40 (100%)** | **0** |

注: D-3 では Owner 拘束 0 min 確定 (R26 D-7 0-1 min spec / D-8 0 min spec / D-Day 4-6 min spec とは別軸)

---

## §1 D-7 結果継承 + 環境再確認 実機実行 sequence (6 項目 / 13:00-13:10 JST)

### Section 1 目標 (実機実行 ready)
- D-7 (6/12) GREEN 50/50 + 09:00 開始 GO 確定の継承確認
- D-3 (6/16) 当日 13:00 開始時点の env / access 維持確認

### sequence 1.1: 13:00:00-13:01:30 D-7 GREEN 50/50 達成確認 (実機実行)

- **担当**: CEO 小林
- **実機 cmd**: `slack:search "#launch-dry-2026-06-19 D-7 完遂" --since 6/12T08:50 --until 6/12T09:05`
- **期待出力**: `[D-7 09:00] D-7 prep 完遂 / Phase 1-6 (R21 detailed-procedure 44 step) 開始 GO`
- **判定 trigger**: post 検出 → PASS / 不在 → FAIL → escalation 1.1
- **復旧手順 (FAIL 時)**: D-7 担当者 (田中) 電話確認 → Slack post 状態確認
- **復旧 SLA**: 5 min 内

### sequence 1.2: 13:01:30-13:03:00 D-7 サインオフ 4 件確認 (実機実行)

- **担当**: CEO 小林
- **実機 cmd**: `slack:search "#launch-dry-2026-06-19 sign" --since 6/12T08:53 --until 6/12T08:55`
- **期待出力**: 田中 + 山田 + 佐藤 + 小林 4 件 sign 検出
- **判定 trigger**: 4 件 sign 検出 → PASS
- **復旧 SLA**: 5 min 内

### sequence 1.3: 13:03:00-13:04:30 D-3 当日 env 5 変数 source 維持確認 (実機実行)

- **担当**: Web-Ops 田中
- **実機 cmd**: `echo $PREVIEW_URL && echo $TARGET_URL && echo $VERCEL_TEAM && echo ${SENTRY_TOKEN:0:8} && echo ${SLACK_WEBHOOK_DRY:0:30}`
- **期待出力**: 5 変数 source 維持 (D-7 § 1.2-1.6 と一致)
- **判定 trigger**: 5/5 source 一致 → PASS
- **復旧 SLA**: 5 min 内

### sequence 1.4: 13:04:30-13:06:00 preview deploy state 維持確認 (実機実行)

- **担当**: Web-Ops 田中
- **実機 cmd**: `vercel ls --scope $VERCEL_TEAM | grep prj-019 | head -3`
- **期待出力**: Ready 3 件以上
- **判定 trigger**: Ready 3 件以上 → PASS
- **復旧 SLA**: 5 min 内

### sequence 1.5: 13:06:00-13:08:00 cron 5 本 preview enable 維持確認 (実機実行)

- **担当**: Web-Ops 田中
- **実機 cmd**: `vercel inspect --scope $VERCEL_TEAM <preview-deploy-id> | grep -i cron`
- **期待出力**: cron-1 〜 cron-5 全件 enabled
- **判定 trigger**: 5/5 enabled → PASS
- **復旧 SLA**: 5 min 内

### sequence 1.6: 13:08:00-13:10:00 OWN-AUTO PoC 4 script PRODUCTION-READY 状態確認 (実機実行)

- **担当**: Web-Ops 田中
- **実機 cmd**: `bash scripts/own-auto-poc/status.sh`
- **期待出力**: `4/4 PRODUCTION-READY (script-1 / script-2 / script-3 / script-4)`
- **判定 trigger**: 4/4 → PASS
- **復旧 SLA**: 8 min 内

### Section 1 集計
- 13:00-13:10 10 min / Owner 拘束 0 / buffer 0 min
- 6/6 GREEN で Section 2 移行

---

## §2 OWN-AUTO PoC script-1 GitHub Actions webhook trial 実機実行 sequence (7 項目 / 13:10-13:25 JST)

### Section 2 目標 (実機実行 ready)
- script-1 (GitHub Actions webhook 経由 PR auto-comment) を D-3 当日 dry-run trial
- D-Day Phase 1 step 1-4 (5 min → 0.5 min 圧縮) の経路 final 確認

### sequence 2.1: 13:10:00-13:12:00 script-1 dry-run 実行 (実機実行)

- **担当**: Web-Ops 田中
- **実機 cmd**: `bash scripts/own-auto-poc/script-1-gh-webhook-comment.sh --dry-run`
- **期待出力**: `dry-run OK / webhook payload prepared / 0 side-effect`
- **判定 trigger**: exit 0 + `dry-run OK` 検出 → PASS
- **復旧 SLA**: 5 min 内

### sequence 2.2: 13:12:00-13:14:00 webhook payload schema 確認 (実機実行)

- **担当**: Dev 山田
- **実機 cmd**: `cat scripts/own-auto-poc/payloads/script-1-payload.json | jq '.event_type'`
- **期待出力**: `pull_request_comment`
- **判定 trigger**: schema match → PASS
- **復旧 SLA**: 3 min 内

### sequence 2.3: 13:14:00-13:16:00 GitHub repo webhook active 確認 (実機実行)

- **担当**: Dev 山田
- **実機 cmd**: `gh api /repos/<org>/<repo>/hooks | jq '.[] | select(.active==true) | .config.url'`
- **期待出力**: webhook URL 1 件以上 active
- **判定 trigger**: active 1 件以上 → PASS
- **復旧 SLA**: 5 min 内

### sequence 2.4: 13:16:00-13:18:00 GITHUB_TOKEN 期限確認 (実機実行)

- **担当**: Dev 山田
- **実機 cmd**: `gh auth status --show-token | grep -i "expires"`
- **期待出力**: expires_at が 6/19 09:00 JST 以降
- **判定 trigger**: 期限内 → PASS / 期限切れ → FAIL → escalation 2.4
- **復旧 SLA**: 5 min 内

### sequence 2.5: 13:18:00-13:20:00 script-1 retry 経路確認 (実機実行)

- **担当**: Dev 山田
- **実機 cmd**: `bash scripts/own-auto-poc/script-1-gh-webhook-comment.sh --dry-run --retry-test`
- **期待出力**: retry 3 回想定 / exit 0
- **判定 trigger**: exit 0 → PASS
- **復旧 SLA**: 5 min 内

### sequence 2.6: 13:20:00-13:23:00 D-Day step 1-4 圧縮効果 trial (実機実行 / dry-run)

- **担当**: Web-Ops 田中
- **実機 cmd**: `time bash scripts/own-auto-poc/script-1-gh-webhook-comment.sh --dry-run --simulate-d-day`
- **期待出力**: real time < 30 sec (D-Day step 1-4 の 0.5 min 内 完遂目処)
- **判定 trigger**: 30 sec 内 → PASS / 30 sec 超 → FAIL → escalation 2.6
- **復旧 SLA**: 8 min 内 (script tuning / parallel化)

### sequence 2.7: 13:23:00-13:25:00 script-1 trial 完遂 Slack post (実機実行)

- **担当**: Web-Ops 田中
- **実機 cmd**: `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-3 13:25] script-1 trial 完遂 7/7 GREEN / D-Day step 1-4 0.5 min 内目処確定"}'`
- **期待出力**: HTTP 200
- **判定 trigger**: HTTP 200 → PASS
- **復旧 SLA**: 3 min 内

### Section 2 集計
- 13:10-13:25 15 min / Owner 拘束 0 / buffer 0 min
- 7/7 GREEN で Section 3 移行

---

## §3 OWN-AUTO PoC script-2 smoke wrapper trial 実機実行 sequence (7 項目 / 13:25-13:40 JST)

### Section 3 目標 (実機実行 ready)
- script-2 (smoke 8 endpoint 自動 wrapper + Slack post) を D-3 当日 dry-run trial
- D-Day Phase 4 step 4-1 + Phase 6 step 6-1 の経路 final 確認

### sequence 3.1-3.7: 13:25:00-13:40:00 script-2 trial 7 項目 (実機実行 / 各 2 min)

| # | 内容 | 担当 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 3.1 | script-2 dry-run 実行 | Web-Ops | `bash scripts/own-auto-poc/script-2-smoke-wrapper.sh --dry-run` | dry-run OK + 8/8 GREEN simulate |
| 3.2 | smoke 8 endpoint URL 確認 | Web-Ops | `cat smoke-endpoints.txt | wc -l` | 8 |
| 3.3 | endpoint 各 timeout 設定確認 | Web-Ops | `grep -i timeout scripts/own-auto-poc/script-2-smoke-wrapper.sh` | 30 sec timeout |
| 3.4 | retry 経路確認 (cold start 想定) | Web-Ops | `bash scripts/own-auto-poc/script-2-smoke-wrapper.sh --dry-run --retry-test` | retry 1 回想定 / exit 0 |
| 3.5 | Slack post template 確認 | Web-Ops | `grep -i SLACK_WEBHOOK scripts/own-auto-poc/script-2-smoke-wrapper.sh` | $SLACK_WEBHOOK_DRY 参照 |
| 3.6 | D-Day step 4-1 圧縮効果 trial | Web-Ops | `time bash scripts/own-auto-poc/script-2-smoke-wrapper.sh --dry-run --simulate-d-day` | real time < 60 sec |
| 3.7 | script-2 trial 完遂 post | Web-Ops | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-3 13:40] script-2 trial 完遂 7/7 GREEN / smoke 8 endpoint 自動化 final 確認"}'` | HTTP 200 |

### Section 3 集計
- 13:25-13:40 15 min / Owner 拘束 0 / buffer 0 min
- 7/7 GREEN で Section 4 移行

---

## §4 OWN-AUTO PoC script-3 Slack thread auto-confirm dry-run 実機実行 sequence (7 項目 / 13:40-13:55 JST)

### Section 4 目標 (実機実行 ready)
- script-3 (Slack thread 内 reaction auto-confirm + thread 自動連鎖) を D-3 当日 dry-run trial
- D-Day Phase 2.5 step 2.5-1 (30 sec → 15 sec 圧縮) の経路 final 確認

### sequence 4.1-4.7: 13:40:00-13:55:00 script-3 trial 7 項目 (実機実行 / 各 2 min)

| # | 内容 | 担当 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 4.1 | script-3 dry-run 実行 | Web-Ops | `bash scripts/own-auto-poc/script-3-slack-auto-confirm.sh --dry-run` | dry-run OK + reaction simulate |
| 4.2 | Slack thread parent ts source 確認 | Web-Ops | `grep -i SLACK_THREAD_TS scripts/own-auto-poc/script-3-slack-auto-confirm.sh` | $SLACK_THREAD_TS 参照 |
| 4.3 | reaction trigger condition 確認 | Web-Ops | `grep -i 'reaction\|thumbsup\|white_check_mark' scripts/own-auto-poc/script-3-slack-auto-confirm.sh` | reaction 3 種 ($\:thumbsup:\:$ / $\:white_check_mark:\:$ / $\:eyes:\:$) |
| 4.4 | auto-confirm idempotency 確認 | Web-Ops | `bash scripts/own-auto-poc/script-3-slack-auto-confirm.sh --dry-run --replay 3` | 重複 confirm 0 / exit 0 |
| 4.5 | retry 経路確認 (Slack rate limit 想定) | Web-Ops | `bash scripts/own-auto-poc/script-3-slack-auto-confirm.sh --dry-run --retry-test` | retry 2 回想定 / exit 0 |
| 4.6 | D-Day step 2.5-1 圧縮効果 trial | Web-Ops | `time bash scripts/own-auto-poc/script-3-slack-auto-confirm.sh --dry-run --simulate-d-day` | real time < 15 sec |
| 4.7 | script-3 trial 完遂 post | Web-Ops | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-3 13:55] script-3 trial 完遂 7/7 GREEN / Slack thread auto-confirm final 確認"}'` | HTTP 200 |

### Section 4 集計
- 13:40-13:55 15 min / Owner 拘束 0 / buffer 0 min
- 7/7 GREEN で Section 5 移行

---

## §5 OWN-AUTO PoC script-4 CEO online presence auto-reply dry-run 実機実行 sequence (7 項目 / 13:55-14:10 JST)

### Section 5 目標 (実機実行 ready)
- script-4 (CEO Slack online presence 検出 → Owner 1 行 reply auto-detect) を D-3 当日 dry-run trial
- D-Day Phase 7 step 7-1 (1 min) の Owner reply detection final 確認

### sequence 5.1-5.7: 13:55:00-14:10:00 script-4 trial 7 項目 (実機実行 / 各 2 min)

| # | 内容 | 担当 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 5.1 | script-4 dry-run 実行 | Dev | `bash scripts/own-auto-poc/script-4-auto-detect.sh --dry-run` | dry-run OK + presence simulate |
| 5.2 | Slack presence API access 確認 | Dev | `curl -s -X POST https://slack.com/api/users.getPresence -H "Authorization: Bearer $SLACK_BOT_TOKEN" -d "user=$CEO_SLACK_UID"` | `{"ok":true,"presence":"active"}` |
| 5.3 | Owner UID source 確認 | Dev | `grep -i OWNER_SLACK_UID scripts/own-auto-poc/script-4-auto-detect.sh` | $OWNER_SLACK_UID 参照 |
| 5.4 | auto-detect threshold 確認 | Dev | `grep -i 'detect_window\|reply_pattern' scripts/own-auto-poc/script-4-auto-detect.sh` | detect_window 60 sec / reply_pattern: GO/NoGO/OK |
| 5.5 | retry 経路確認 (Slack API 5xx 想定) | Dev | `bash scripts/own-auto-poc/script-4-auto-detect.sh --dry-run --retry-test` | retry 3 回想定 / exit 0 |
| 5.6 | D-Day step 7-1 timing trial | Dev | `time bash scripts/own-auto-poc/script-4-auto-detect.sh --dry-run --simulate-d-day` | real time < 60 sec (Owner reply detection 60 sec 内) |
| 5.7 | script-4 trial 完遂 post | Dev | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-3 14:10] script-4 trial 完遂 7/7 GREEN / CEO online presence auto-reply final 確認"}'` | HTTP 200 |

### Section 5 集計
- 13:55-14:10 15 min / Owner 拘束 0 / buffer 0 min
- 7/7 GREEN で Section 6 移行

---

## §6 push notif dry-run + サインオフ + EOD 実機実行 sequence (6 項目 / 14:10-14:30 JST)

### Section 6 目標 (実機実行 ready)
- push notif dry-run (D-Day step 1-1 の Owner Slack DM 通知 dry-run)
- D-3 当日 4 部門サインオフ + EOD post + D-1 (6/18) 13:00 開始 GO 確定

### sequence 6.1: 14:10:00-14:14:00 push notif dry-run (実機実行)

- **担当**: Web-Ops 田中
- **実機 cmd**: `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-3 14:14] push notif dry-run: D-Day Phase 1 step 1-1 想定 Owner Slack DM 1 行通知 dry-run / 0 side-effect"}'`
- **期待出力**: HTTP 200 + post 確認 (Owner DM ではなく test ch post)
- **判定 trigger**: HTTP 200 → PASS / Owner DM への誤送信なし確認 → PASS
- **復旧 SLA**: 3 min 内
- **panic-free 担保**: dry-run のみ / Owner 実 DM 送信 0 / D-Day Phase 1 当日のみ実 DM 送信

### sequence 6.2: 14:14:00-14:18:00 4 script 並列 trial 集計確認 (実機実行)

- **担当**: Dev 山田
- **実機 cmd**: `cat trial-result/script-1.json trial-result/script-2.json trial-result/script-3.json trial-result/script-4.json | jq '.green_count' | paste -sd+ - | bc`
- **期待出力**: 28 (7 + 7 + 7 + 7)
- **判定 trigger**: 28/28 → PASS
- **復旧 SLA**: 5 min 内

### sequence 6.3: 14:18:00-14:21:00 Web-Ops + Dev sign (実機実行)

- **担当**: Web-Ops 田中 + Dev 山田
- **実機 cmd**: `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-3 14:20] Web-Ops sign: 田中 / Dev sign: 山田 / OWN-AUTO PoC 4 script trial 28/28 GREEN"}'`
- **期待出力**: HTTP 200
- **判定 trigger**: HTTP 200 → PASS
- **復旧 SLA**: 3 min 内

### sequence 6.4: 14:21:00-14:24:00 Marketing + Review sign (実機実行)

- **担当**: Marketing 佐藤 + Review 渡辺
- **実機 cmd**: `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-3 14:23] Marketing sign: 佐藤 / Review sign: 渡辺 / D-3 trial 完遂確認"}'`
- **期待出力**: HTTP 200
- **判定 trigger**: HTTP 200 → PASS
- **復旧 SLA**: 3 min 内

### sequence 6.5: 14:24:00-14:27:00 CEO sign + D-1 開始 GO 確定 (実機実行)

- **担当**: CEO 小林
- **実機 cmd**: `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-3 14:26] CEO sign: 小林 / D-1 (6/18) 13:00 開始 GO 確定 / OWN-AUTO PoC 4 script PRODUCTION-READY 維持"}'`
- **期待出力**: HTTP 200
- **判定 trigger**: HTTP 200 → PASS
- **復旧 SLA**: 3 min 内

### sequence 6.6: 14:27:00-14:30:00 EOD post (実機実行)

- **担当**: Web-Ops 田中
- **実機 cmd**: `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-3 14:30] EOD GREEN 40/40 / D-1 (6/18) 13:00 開始 GO 確定 / 6 section 完遂 / Owner 拘束 0 min 確定"}'`
- **期待出力**: HTTP 200
- **判定 trigger**: HTTP 200 → PASS
- **復旧 SLA**: 3 min 内

### Section 6 集計
- 14:10-14:30 20 min / Owner 拘束 0 min / buffer 0 min
- 6/6 GREEN で D-3 完遂 / D-1 (6/18) 13:00 開始 GO 確定

---

## §7 D-3 panic-free 完遂 spec (集計)

### §7.1 90 min timeline 累積集計 (Section 1-6)

| Section | 時間帯 | 所要 | 項目数 | 実機実行 ready | Owner 拘束 |
|---|---|---|---|---|---|
| §1 D-7 結果継承 + env | 13:00-13:10 | 10 min | 6 | 6/6 | 0 |
| §2 script-1 webhook trial | 13:10-13:25 | 15 min | 7 | 7/7 | 0 |
| §3 script-2 smoke wrapper | 13:25-13:40 | 15 min | 7 | 7/7 | 0 |
| §4 script-3 thread auto-confirm | 13:40-13:55 | 15 min | 7 | 7/7 | 0 |
| §5 script-4 presence auto-reply | 13:55-14:10 | 15 min | 7 | 7/7 | 0 |
| §6 push notif + sign + EOD | 14:10-14:30 | 20 min | 6 | 6/6 | 0 |
| **合計** | **13:00-14:30** | **90 min** | **40** | **40/40 (100%)** | **0** |

### §7.2 Owner 拘束 0 min spec の根拠 4 件

1. **D-3 では Owner Slack DM 通知 0**: §6.1 push notif dry-run も test ch post / Owner 実 DM 送信 0
2. **D-3 サインオフは CEO + 4 部門のみ**: Owner サイン 経路なし (D-Day Phase 7 + D-1 17:00 共同 sign のみ Owner 関与)
3. **想定外 FAIL でも Owner DM 不要**: §1-§5 で 1 件以上 FAIL 残存時は CEO 1 次判断で復旧 / Owner reply 不要
4. **D-Day 4-6 min / D-7 0-1 min との spec 軸別保持**: D-3 は OWN-AUTO PoC trial day / Owner 拘束軸からは 完全分離

### §7.3 panic-free 完遂条件 5 件

1. **本書 1 文書で完遂可能** (R26 D-7/D-8 execution-ready 2 文書を base に拡張)
2. **想定 anomaly 0 件 (D-3 は dry-run のみ / 副作用 0)**
3. **4 script 並列 dry-run idempotency 確立** (§4.4 replay 3 回 / 重複 confirm 0)
4. **Owner 拘束 0 min 確定** (CEO + 4 部門のみ / 想定外 FAIL でも Owner DM 不要)
5. **D-1 (6/18) 13:00 開始 GO 確定**: §6.5 で D-1 開始 GO 受領 → D-1 への切れ目なし接続

### §7.4 escalation matrix 6 行 cmd レベル化

| Section | 1 次判断者 | 2 次判断者 | 連絡 cmd | SLA |
|---|---|---|---|---|
| §1 継承 + env | CEO 小林 | Web-Ops 田中 | Slack DM template | 5 min |
| §2 script-1 | Web-Ops 田中 | Dev 山田 | Slack DM template | 5-8 min |
| §3 script-2 | Web-Ops 田中 | Dev 山田 (assist) | Slack DM template | 5 min |
| §4 script-3 | Web-Ops 田中 | Dev 山田 (assist) | Slack DM template | 5 min |
| §5 script-4 | Dev 山田 | Web-Ops 田中 (assist) | Slack DM template | 5 min |
| §6 push notif + sign + EOD | Web-Ops 田中 | CEO 小林 | Slack DM template | 3-5 min |

---

## §8 historical baseline 完全保持原則

- Round 26 Marketing-T `marketing-t-r26-d-8-execution-ready.md` (約 290 行 / 不変)
- Round 26 Marketing-T `marketing-t-r26-d-7-execution-ready.md` (約 290 行 / 不変)
- Round 26 Marketing-T `marketing-t-r26-confidence-trajectory-r20-r26.md` (約 270 行 / 不変)
- Round 26 Marketing-T `marketing-t-r26-summary.md` (約 230 行 / 不変)
- Round 25 Marketing-S 4 file (D-8 real / v3.2 正式版 / R25 trajectory / R25 summary) **absolute 無改変保持**
- Round 23 Web-Ops-J OWN-AUTO PoC 4 script PRODUCTION-READY 状態 **absolute 無改変保持**
- launch day v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2 正式版 4 file **absolute 無改変保持**
- 本書のみが新規追加 / 既存 baseline 改変 0

## §9 副作用 0 担保 (本書策定後チェック)

- [x] 本書は文書のみ / 実行 0 / curl 0 / Slack post 0 / cron 操作 0 / DB write 0
- [x] Round 26 Marketing-T 4 file **完全無改変保持**
- [x] Round 25 Marketing-S 4 file **完全無改変保持**
- [x] Round 23 Web-Ops-J OWN-AUTO PoC 4 script **完全無改変保持**
- [x] launch day v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2 正式版 4 file **完全無改変保持**
- [x] 絵文字 0 / Heroicons 参照のみ / API $0
- [x] Owner 拘束 0 (本書策定中 / D-3 当日 0 min spec / D-Day 4-6 min は別軸)
- [x] 新規 task 0 / 削除 task 0 (R27 Marketing-U D-3 起票のみ)

## §10 関連 DEC / KPI / Round 28 引継

- DEC-019-025: background dispatch SOP 22 件目 (本書含む R27 4 件まとめて 1 件カウント)
- DEC-019-033: knowledge 抽出経路 (本書を `organization/knowledge/patterns/d-3-execution-ready-spec.md` 候補化)
- DEC-019-054: portfolio v3.1 hash check (D-Day Phase 6 step 6-4 不変)
- DEC-019-062: cron 5 本 + CRON_SECRET (§1 sequence 1.5 cmd レベル化)
- DEC-019-068: Sec stagger 圧縮 baseline (連続 13 round 適用 / 本書影響 0)
- **DEC-019-081 候補**: D-3 execution-ready + D-1 execution-ready + R27 confidence trajectory + R27 summary 4 件まとめて 1 議決 として CEO 提案

KPI 連動:
- 17 日 path 完成度: 本書で D-3 実機実行 ready 物理化 → +1 path
- DEC trajectory: DEC-019-081 候補

Round 28 引継 (Marketing-V 想定):
1. D-3 当日実機実行 (6/16 13:00-14:30 JST 実 record 起票) → 本書を base に actual cmd 出力差分のみ追加
2. D-Day (6/19) 09:00 公開当日 real execution record 起票 (Marketing-V R28 想定)
3. T+24h timeline (6/20) 公開後 24h record 起票 (Marketing-V R28 想定)
4. v3.2 正式版 final lock confirmation post-公開 (Marketing-V R28 想定)

---

**最終更新**: 2026-05-05 (Round 27 / Marketing-U / D-3 実機実行 readiness 完成版起票)
**派生元**: Round 26 Marketing-T `marketing-t-r26-d-8-execution-ready.md` + `marketing-t-r26-d-7-execution-ready.md` (cmd レベル化 baseline / 不変保持)
**次回見直し**: 2026-06-16 13:00 JST (D-3 実機実行当日 / 本書を base に 90 min 完遂)
