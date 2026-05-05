# Marketing-U R27 / 6/18 D-1 実機実行 readiness 完成版 (17:00 共同 sign 経路 + Owner 1 行 reply 1 min spec / v3.2 lock 確定 trial + 24h 連続稼働確認)

## 0. 概要

- **対象**: PRJ-019 / COMPANY-WEBSITE 公開 (2026-06-19 09:00 JST 想定 / 確度 94% Round 26 完遂時 baseline)
- **本書 role**: D-1 (6/18) 当日 17:00 JST CEO + Owner 共同 sign 経路 + v3.2 正式版 lock 確定 trial + 24h 連続稼働確認 final + Owner 1 行 reply 1 min spec を **実機実行 sequence レベル** で起票
- **派生元**:
  - Round 26 Marketing-T `marketing-t-r26-d-8-execution-ready.md` (75 項目 5 phase 9 hour cmd レベル / 不変保持)
  - Round 26 Marketing-T `marketing-t-r26-d-7-execution-ready.md` (50 項目 9 section 60 min cmd レベル / Owner 0-1 min 内 spec / 不変保持)
  - Round 27 Marketing-U `marketing-u-r27-d-3-execution-ready.md` (D-3 trial 40 項目 cmd レベル / Owner 0 min spec / 不変保持)
  - Round 25 Marketing-S `launch-day-timeline-2026-06-19-v3.2.md` (約 360 行 / Owner 拘束 4-6 min 確定 / 不変保持)
- **構成**: 7 section × 計 45 項目 → 各項目に **実機実行 sequence (cmd / 期待出力 / 判定 trigger / 復旧手順)** を 1:1 紐付け / **Owner 1 行 reply 1 min spec 確定 (D-1 17:00 共同 sign 経路)**
- **本書出力時期**: Round 27 / 2026-05-05 / 6/18 D-1 実機実行 44 日前
- **本書の意義 (R27 D-3 → R27 D-1 Δ)**:
  - R27 D-3 は Owner 拘束 0 min (CEO + 4 部門のみ)
  - R27 D-1 は **17:00 JST CEO + Owner 共同 sign 経路で Owner 1 行 reply 1 min 拘束** を初 spec 化
  - D-1 readiness 観点での Δ: 0 件 → **45/45 実機実行 ready (100%)** + Owner 1 min reply spec 確定
- **副作用**: 0 (本書は文書のみ / curl 0 / Slack post 0 / cron 操作 0 / DB write 0)
- **絵文字 0 / Heroicons 参照のみ / API 追加コスト $0 / Owner 拘束 1 min (17:00 共同 sign reply のみ)**
- **関連 DEC**: DEC-019-025 / DEC-019-033 / DEC-019-054 / DEC-019-062 / DEC-019-068

## 0.1 D-1 実機実行 ready readiness 計測 (45 項目 / 7 section)

| 観点 | R26 baseline 状態 | R27 D-1 ready 状態 | Δ |
|---|---|---|---|
| D-1 (6/18) 当日 17:00 共同 sign spec | 規定なし (R26 では D-7/D-8 のみ) | **45 項目 cmd + 期待出力 + 判定 trigger 1:1 紐付** | 起票 |
| **Owner 1 行 reply 1 min spec** | (D-7 では 0-1 min 有事のみ / D-Day 4-6 min) | **D-1 17:00 共同 sign 経路の Owner 必須 1 min reply 確定** | 1 min spec 化 |
| v3.2 正式版 lock 確定 trial | (R25 で 360 行版完遂 / R26 で final lock 引継) | **D-1 sign 後の v3.2 lock 確認 cmd レベル化** | trial 化 |
| 24h 連続稼働確認 final | (R23 PoC 4 script PRODUCTION-READY) | **D-1 → D-Day 24h 連続稼働 check cmd レベル化** | final 化 |
| sign 不在時 v3.1 経路 fallback | (R25 v3.2 正式版 task ② で想定) | **D-1 17:30 timeout 時 v3.1 経路 fallback cmd レベル化** | fallback 化 |
| Owner 拘束 spec | (D-7 0-1 min 内 / D-3 0 min) | **D-1 17:00 共同 sign reply 1 min 確定 + 17:30 timeout 経路** | 1 min spec 化 |
| **R27 D-1 実機実行 ready 達成度** | 0/45 | **45/45 (100%)** | **+45 項目達成** |

**昇格判定**: R27 本書起票で **D-1 (6/18) 当日 R27 実機実行 ready 45/45 (100%) 達成 + Owner 1 min reply spec 確定**

## 0.2 D-1 実機実行 ready 全体時間配分 (7 section / 90 min / 16:30-18:00 JST)

| Section | 時間帯 (JST) | 所要 | 項目数 | 実機実行 ready | Owner 拘束 |
|---|---|---|---|---|---|
| §1 D-3 結果継承 + 24h 連続稼働 | 16:30-16:40 | 10 min | 6 | 6/6 | 0 |
| §2 v3.2 正式版 lock 前 final check | 16:40-16:50 | 10 min | 6 | 6/6 | 0 |
| §3 cron 5 本 D-Day 想定切替 dry-run | 16:50-17:00 | 10 min | 5 | 5/5 | 0 |
| §4 17:00 JST CEO + Owner 共同 sign 経路 | 17:00-17:05 | 5 min | 5 | 5/5 | **1 min (Owner reply)** |
| §5 v3.2 正式版 lock 確定 trial | 17:05-17:30 | 25 min | 8 | 8/8 | 0 |
| §6 24h 連続稼働確認 final + smoke 8 | 17:30-17:50 | 20 min | 8 | 8/8 | 0 |
| §7 D-Day 09:00 開始 GO 確定 + EOD | 17:50-18:00 | 10 min | 7 | 7/7 | 0 |
| **合計** | **16:30-18:00** | **90 min** | **45** | **45/45 (100%)** | **1 min** |

注: D-1 Owner 拘束 1 min は §4 17:00 共同 sign 経路の Owner 1 行 reply のみ (DM 開封 10 sec + v3.2 lock 1 行確認 20 sec + GO 1 行 reply 30 sec = 60 sec = 1 min)

---

## §1 D-3 結果継承 + 24h 連続稼働 実機実行 sequence (6 項目 / 16:30-16:40 JST)

### Section 1 目標 (実機実行 ready)
- D-3 (6/16) GREEN 40/40 + D-1 13:00 開始 GO 確定の継承確認
- D-3 → D-1 中 48 hour 連続稼働 (cron + OWN-AUTO PoC PRODUCTION-READY 維持)

### sequence 1.1: 16:30:00-16:31:30 D-3 GREEN 40/40 達成確認 (実機実行)

- **担当**: CEO 小林
- **実機 cmd**: `slack:search "#launch-dry-2026-06-19 D-3 14:30 EOD" --since 6/16T14:25 --until 6/16T14:35`
- **期待出力**: `[D-3 14:30] EOD GREEN 40/40 / D-1 (6/18) 13:00 開始 GO 確定`
- **判定 trigger**: post 検出 → PASS / 不在 → FAIL → escalation 1.1
- **復旧 SLA**: 5 min 内

### sequence 1.2: 16:31:30-16:33:00 D-3 4 部門 + CEO sign 確認 (実機実行)

- **担当**: CEO 小林
- **実機 cmd**: `slack:search "#launch-dry-2026-06-19 sign" --since 6/16T14:18 --until 6/16T14:27`
- **期待出力**: 田中 + 山田 + 佐藤 + 渡辺 + 小林 5 件 sign 検出
- **判定 trigger**: 5 件 sign 検出 → PASS
- **復旧 SLA**: 5 min 内

### sequence 1.3: 16:33:00-16:34:30 cron 5 本 48h 連続稼働確認 (実機実行)

- **担当**: Web-Ops 田中
- **実機 cmd**: `curl -s "$SUPABASE_URL/rest/v1/cron_heartbeat?select=cron,ts&order=ts.desc&limit=50" -H "apikey: $SUPABASE_ANON_KEY" | jq 'group_by(.cron) | map({cron: .[0].cron, count: length})'`
- **期待出力**: cron-1 〜 cron-5 全件 heartbeat 連続記録 (48h × interval 想定件数 一致)
- **判定 trigger**: 5 cron 全件 連続記録 → PASS / 1 件以上 中断 → FAIL → escalation 1.3
- **復旧 SLA**: 8 min 内 (cron 再 enable + heartbeat 再始動)

### sequence 1.4: 16:34:30-16:36:00 OWN-AUTO PoC 4 script 48h 状態維持確認 (実機実行)

- **担当**: Web-Ops 田中
- **実機 cmd**: `bash scripts/own-auto-poc/status.sh --48h-check`
- **期待出力**: `4/4 PRODUCTION-READY (48h continuous OK) / drift 0 / regression 0`
- **判定 trigger**: 4/4 → PASS
- **復旧 SLA**: 8 min 内

### sequence 1.5: 16:36:00-16:38:00 preview deploy 48h state 維持確認 (実機実行)

- **担当**: Web-Ops 田中
- **実機 cmd**: `vercel ls --scope $VERCEL_TEAM | grep prj-019 | head -3 && vercel inspect <preview-deploy-id> --scope $VERCEL_TEAM | grep gitCommitSha`
- **期待出力**: Ready 3 件 + hash 一致 (D-7 sequence 1.4 と同 hash 維持)
- **判定 trigger**: Ready 3 件 + hash 一致 → PASS
- **復旧 SLA**: 5 min 内

### sequence 1.6: 16:38:00-16:40:00 Sentry 48h baseline 確認 (実機実行)

- **担当**: Dev 山田
- **実機 cmd**: `curl -s -H "Authorization: Bearer $SENTRY_TOKEN" "https://sentry.io/api/0/organizations/prj-019/stats_v2/?statsPeriod=48h" | jq '.totals.total'`
- **期待出力**: 5xx baseline 値 < 300 / 48h (D-7 sequence 平均値の 2 倍以内)
- **判定 trigger**: < 300 → PASS
- **復旧 SLA**: 5 min 内

### Section 1 集計
- 16:30-16:40 10 min / Owner 拘束 0 / buffer 0 min
- 6/6 GREEN で Section 2 移行

---

## §2 v3.2 正式版 lock 前 final check 実機実行 sequence (6 項目 / 16:40-16:50 JST)

### Section 2 目標 (実機実行 ready)
- v3.2 正式版 lock 前 7 役割マトリクス + 7 Phase + Owner 拘束 4-6 min spec final check
- buffer 138 min 確定 maintainence

### sequence 2.1-2.6: 16:40:00-16:50:00 v3.2 正式版 final check 6 項目 (実機実行 / 各 1.5 min)

| # | 内容 | 担当 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 2.1 | v3.2 正式版 file 行数確認 | Marketing | `wc -l projects/COMPANY-WEBSITE/marketing/launch-day-timeline-2026-06-19-v3.2.md` | 約 360 行 (442 行 file 内) |
| 2.2 | 7 Phase 6 hour timeline 06:00-12:00 確認 | Marketing | `grep -E "Phase [1-7]" projects/COMPANY-WEBSITE/marketing/launch-day-timeline-2026-06-19-v3.2.md | wc -l` | 7 件以上 (Phase 1-7 + Phase 2.5) |
| 2.3 | Owner 拘束 4-6 min spec 確認 | Marketing | `grep -E "Owner.*4-6.min" projects/COMPANY-WEBSITE/marketing/launch-day-timeline-2026-06-19-v3.2.md | wc -l` | 1 件以上 |
| 2.4 | buffer 138 min 確認 | Marketing | `grep -E "buffer.*138.min" projects/COMPANY-WEBSITE/marketing/launch-day-timeline-2026-06-19-v3.2.md | wc -l` | 1 件以上 |
| 2.5 | 7 役割マトリクス確認 (Owner / CEO / Web-Ops 主・副 / Dev / Marketing / Review) | Marketing | `grep -E "Owner|CEO|Web-Ops|Dev|Marketing|Review" projects/COMPANY-WEBSITE/marketing/launch-day-timeline-2026-06-19-v3.2.md | wc -l` | 50 件以上 |
| 2.6 | v3.0 / v3.1-delta / v3.2-delta-candidate hash 不変確認 | Marketing | `sha256sum projects/PRJ-019/reports/marketing-p-r22-d8-prep-and-launch-day.md projects/PRJ-019/reports/marketing-q-r23-d8-simulation-and-launch-day-v3-1.md projects/PRJ-019/reports/marketing-r-r24-d7-real-and-launch-day-v3-2.md` | 3 hash 不変一致 |

### Section 2 集計
- 16:40-16:50 10 min / Owner 拘束 0 / buffer 0 min
- 6/6 GREEN で Section 3 移行

---

## §3 cron 5 本 D-Day 想定切替 dry-run 実機実行 sequence (5 項目 / 16:50-17:00 JST)

### Section 3 目標 (実機実行 ready)
- D-Day (6/19) 09:00 cron 5 本 production 切替 dry-run
- preview enable 維持しつつ production 切替 trial 確認

### sequence 3.1-3.5: 16:50:00-17:00:00 cron 切替 dry-run 5 項目 (実機実行 / 各 2 min)

| # | cron | 内容 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 3.1 | cron-1 | KPI snapshot 切替 dry-run | `vercel env add CRON_SECRET <value> --scope $VERCEL_TEAM --target production --dry-run` | dry-run OK / 0 side-effect |
| 3.2 | cron-2 | Sentry 5xx alert 切替 dry-run | (3.1 と同経路 / cron-2) | dry-run OK |
| 3.3 | cron-3 | smoke 8 endpoint 切替 dry-run | (3.1 と同経路 / cron-3) | dry-run OK |
| 3.4 | cron-4 | portfolio hash check 切替 dry-run | (3.1 と同経路 / cron-4) | dry-run OK |
| 3.5 | cron-5 | T+1h checkpoint 切替 dry-run | (3.1 と同経路 / cron-5) | dry-run OK |

### Section 3 集計
- 16:50-17:00 10 min / Owner 拘束 0 / buffer 0 min
- 5/5 GREEN で Section 4 移行

---

## §4 17:00 JST CEO + Owner 共同 sign 経路 実機実行 sequence (5 項目 / 17:00-17:05 JST / Owner 拘束 1 min spec 確定)

### Section 4 目標 (実機実行 ready / Owner 1 min reply spec 確定)
- 17:00 JST CEO + Owner 共同 sign 経路で v3.2 正式版 final lock 受領
- **Owner 1 行 reply 1 min spec 確定** (DM 開封 10 sec + 内容確認 20 sec + GO 1 行 reply 30 sec = 60 sec)

### sequence 4.1: 17:00:00-17:00:30 CEO 共同 sign post (実機実行 / 30 sec)

- **担当**: CEO 小林
- **実機 cmd**: `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-1 17:00] CEO sign 共同要請: 小林 / v3.2 正式版 final lock 確定 / Owner 1 行 GO/NoGO reply 依頼 (1 min 内 / 17:01 timeout)"}'`
- **期待出力**: HTTP 200 + post 確認
- **判定 trigger**: HTTP 200 → PASS
- **復旧 SLA**: 1 min 内

### sequence 4.2: 17:00:30-17:01:30 Owner Slack DM 通知 + 1 行 reply 受領 (実機実行 / Owner 拘束 1 min spec)

- **担当**: Owner (主) + CEO 小林 (補)
- **Owner DM template (CEO → Owner DM)**: `[D-1 17:00] D-Day (6/19) 09:00 公開 final 判断要請 / v3.2 正式版 lock OK / smoke 8 GREEN / cron 48h 連続稼働 OK / 1 行 GO/NoGO reply 依頼 (60 sec 内)`
- **Owner 拘束 内訳 (1 min spec 詳細)**:
  - DM 通知開封 (10 sec)
  - DM 内容 1 行確認 (20 sec) — `D-Day 09:00 公開 lock OK / 1 行 reply 依頼` 認識
  - GO/NoGO 1 行 reply (30 sec) — `GO` または `NoGO` 1 単語 reply
  - 合計 60 sec = **1 min 内 完遂**
- **判定 trigger (CEO 側 detection)**: Owner reply `GO` 検出 → Section 5 移行 / `NoGO` 検出 → escalation 4.2 (D-Day 延期判断) / 60 sec 経過 reply 不在 → §4.5 17:30 timeout 経路 (v3.1 fallback)
- **panic-free 担保 (1 min reply spec)**:
  - **OWN-AUTO PoC script-4** (CEO online presence auto-reply detect) で Owner reply 自動検出 (D-3 で trial 完遂)
  - Owner 60 sec 内 reply 不可時 → §4.5 timeout 経路 + R26 D-7 0-1 min 内 spec と整合
- **復旧 SLA**: 1 min 内 (Owner reply) / timeout 時 30 min 内 fallback

### sequence 4.3: 17:01:30-17:02:30 Owner GO reply 受領 + CEO 認識 confirmation (実機実行)

- **担当**: CEO 小林
- **実機 cmd**: `bash scripts/own-auto-poc/script-4-auto-detect.sh --live --threshold-window 60`
- **期待出力**: `Owner reply GO detected at <ts> / within 60 sec / detect_window OK`
- **判定 trigger**: GO detected → PASS / NoGO detected → FAIL → escalation 4.3 (D-Day 延期判断)
- **復旧 SLA**: 1 min 内

### sequence 4.4: 17:02:30-17:04:00 共同 sign 完遂 Slack post (実機実行)

- **担当**: CEO 小林
- **実機 cmd**: `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-1 17:03] CEO + Owner 共同 sign 完遂: 小林 + Owner GO 受領 / v3.2 正式版 final lock 確定 / D-Day (6/19) 09:00 開始 GO 確定"}'`
- **期待出力**: HTTP 200
- **判定 trigger**: HTTP 200 → PASS
- **復旧 SLA**: 3 min 内

### sequence 4.5: 17:04:00-17:05:00 sign 不在時 v3.1 経路 fallback 確認 (実機実行 / 通常経路では 0 sec)

- **担当**: CEO 小林
- **実機 cmd (Owner reply 受領済の通常経路)**: `echo "fallback skip / Owner GO received within 1 min"`
- **期待出力**: skip 確認
- **fallback 経路 (Owner 60 sec timeout 時)**:
  1. (5 min) CEO 17:05 fallback DM `[D-1 17:05] Owner reply timeout / v3.1 fallback 経路移行 / 17:30 timeout で D-Day 延期判断`
  2. (10 min) CEO 17:15 retry Owner DM (Slack DM + email + SMS 3 経路)
  3. (10 min) CEO 17:25 final retry / 17:30 timeout
  4. (timeout 時) D-Day 延期判断 + Web-Ops sign単独 + v3.1 経路 fallback (R23 v3.1-delta) 適用
- **panic-free 担保**: Owner reply 受領済の通常経路では §4.5 は skip (0 sec) / timeout 時のみ最大 30 min fallback
- **判定 trigger**: 通常経路 → skip / timeout 経路 → fallback 完遂 → PASS

### Section 4 集計
- 17:00-17:05 5 min / Owner 拘束 1 min (sequence 4.2 のみ) / buffer 0 min
- 5/5 GREEN で Section 5 移行
- **Owner 1 行 reply 1 min spec 確定** (本 Section が R27 D-1 の核心)

---

## §5 v3.2 正式版 lock 確定 trial 実機実行 sequence (8 項目 / 17:05-17:30 JST)

### Section 5 目標 (実機実行 ready)
- 17:00 共同 sign 後の v3.2 正式版 final lock 確定 trial
- v3.2 正式版 file hash lock + v3.0 / v3.1-delta / v3.2-delta-candidate hash 不変保持確認

### sequence 5.1-5.8: 17:05:00-17:30:00 v3.2 lock 確定 trial 8 項目 (実機実行 / 各 3 min)

| # | 内容 | 担当 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 5.1 | v3.2 正式版 final hash 確定 | Marketing | `sha256sum projects/COMPANY-WEBSITE/marketing/launch-day-timeline-2026-06-19-v3.2.md > v3.2-final-hash.txt && cat v3.2-final-hash.txt` | hash 1 件記録 |
| 5.2 | v3.2 hash を 1Password vault に保存 | Marketing | `op item create --category=secure-note --title="v3.2-final-hash" --vault=prj-019-launch <v3.2-final-hash.txt content>` | item created |
| 5.3 | v3.0 hash 不変確認 (v3.2 と独立) | Marketing | `sha256sum projects/PRJ-019/reports/marketing-p-r22-d8-prep-and-launch-day.md` | R22 起票時 hash と一致 |
| 5.4 | v3.1-delta hash 不変確認 | Marketing | `sha256sum projects/PRJ-019/reports/marketing-q-r23-d8-simulation-and-launch-day-v3-1.md` | R23 起票時 hash と一致 |
| 5.5 | v3.2-delta-candidate hash 不変確認 | Marketing | `sha256sum projects/PRJ-019/reports/marketing-r-r24-d7-real-and-launch-day-v3-2.md` | R24 起票時 hash と一致 |
| 5.6 | v3.2 正式版 final lock 宣言 post | Marketing | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-1 17:15] v3.2 正式版 final lock 確定 / hash <v3.2-final-hash 8 char prefix> / 6/19 09:00 当日まで absolute 無改変保持"}'` | HTTP 200 |
| 5.7 | v3.2 lock 後の絶対無改変宣言 confirmation | Web-Ops | `git log --since="6/18T17:00" -- projects/COMPANY-WEBSITE/marketing/launch-day-timeline-2026-06-19-v3.2.md` | commit 0 件 (lock 後 改変 0) |
| 5.8 | Marketing + Web-Ops + Review 3 部門 sign | Marketing + Web-Ops + Review | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-1 17:28] v3.2 lock 3 部門 sign: 佐藤 + 田中 + 渡辺 / lock 確定"}'` | HTTP 200 |

### Section 5 集計
- 17:05-17:30 25 min / Owner 拘束 0 / buffer 0 min
- 8/8 GREEN で Section 6 移行

---

## §6 24h 連続稼働確認 final + smoke 8 実機実行 sequence (8 項目 / 17:30-17:50 JST)

### Section 6 目標 (実機実行 ready)
- D-Day 09:00 公開まで 16h 連続稼働確定 (D-1 17:30 → 6/19 09:00)
- smoke 8 endpoint final + KPI baseline final + Sentry baseline final

### sequence 6.1-6.8: 17:30:00-17:50:00 24h 連続稼働 + smoke final 8 項目 (実機実行 / 各 2.5 min)

| # | 内容 | 担当 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 6.1 | smoke 8 endpoint 全件 確認 | Web-Ops | `bash scripts/own-auto-poc/script-2-smoke-wrapper.sh --live` | 8/8 GREEN + Slack post |
| 6.2 | KPI baseline final snapshot | Marketing | `curl -s -H "apikey: $SUPABASE_ANON_KEY" $SUPABASE_URL/rest/v1/kpi_baseline?select=*` | 13 件 baseline JSON |
| 6.3 | Sentry 1h baseline final | Dev | `curl -s -H "Authorization: Bearer $SENTRY_TOKEN" "https://sentry.io/api/0/organizations/prj-019/stats_v2/?statsPeriod=1h" | jq '.totals.total'` | 5xx < 50 / 1h |
| 6.4 | DNS resolver 3 解決系 final | Web-Ops | `dig @1.1.1.1 prj-019.vercel.app && dig @8.8.8.8 prj-019.vercel.app && dig @9.9.9.9 prj-019.vercel.app` | 3 解決系 一致 |
| 6.5 | preview deploy hash 16h 維持確認 | Web-Ops | `vercel inspect <preview-deploy-id> --scope $VERCEL_TEAM | grep gitCommitSha` | hash 一致 (D-7 sequence 4.2 と一致) |
| 6.6 | cron 5 本 16h 想定 heartbeat 投影 | Web-Ops | `curl -s "$SUPABASE_URL/rest/v1/cron_heartbeat?select=cron,ts&order=ts.desc&limit=10" -H "apikey: $SUPABASE_ANON_KEY"` | 5 cron 全件 直近 heartbeat |
| 6.7 | OWN-AUTO PoC 4 script 24h 連続稼働判定 | Web-Ops | `bash scripts/own-auto-poc/status.sh --24h-continuous` | 4/4 PRODUCTION-READY (24h continuous OK) |
| 6.8 | 24h 連続稼働 final 完遂 post | Web-Ops | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-1 17:50] 24h 連続稼働 final OK / smoke 8 GREEN / KPI baseline 13 件 / Sentry 5xx < 50 / D-Day 09:00 開始 GO 確定 final"}'` | HTTP 200 |

### Section 6 集計
- 17:30-17:50 20 min / Owner 拘束 0 / buffer 0 min
- 8/8 GREEN で Section 7 移行

---

## §7 D-Day 09:00 開始 GO 確定 + EOD 実機実行 sequence (7 項目 / 17:50-18:00 JST)

### Section 7 目標 (実機実行 ready)
- D-Day (6/19) 09:00 開始 GO 確定 final
- 5 部門 + CEO サインオフ + EOD post + D-Day 09:00 接続経路確定

### sequence 7.1-7.7: 17:50:00-18:00:00 D-Day GO + EOD 7 項目 (実機実行 / 各 1.5 min)

| # | 内容 | 担当 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 7.1 | Web-Ops 主 sign | 田中 | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-1 17:51] Web-Ops sign: 田中 / D-Day 09:00 開始 GO 確定 final"}'` | HTTP 200 |
| 7.2 | Dev 主 sign | 山田 | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-1 17:52] Dev sign: 山田 / hotfix prep ready"}'` | HTTP 200 |
| 7.3 | Marketing 主 sign | 佐藤 | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-1 17:53] Marketing sign: 佐藤 / 公報 3 件文言 final lock"}'` | HTTP 200 |
| 7.4 | Review 主 sign | 渡辺 | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-1 17:54] Review sign: 渡辺 / accessibility audit final OK"}'` | HTTP 200 |
| 7.5 | CEO sign final | 小林 | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-1 17:55] CEO sign final: 小林 / Owner GO 受領済 / D-Day (6/19) 09:00 開始 GO 確定 final"}'` | HTTP 200 |
| 7.6 | D-Day 09:00 接続経路確認 (Phase 1 step 1-1 想定) | CEO | `cat projects/COMPANY-WEBSITE/marketing/launch-day-timeline-2026-06-19-v3.2.md | grep -A 3 "Phase 1 step 1-1"` | step 1-1 spec 表示 |
| 7.7 | D-1 完遂 EOD post | Web-Ops | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-1 18:00] D-1 完遂 EOD GREEN 45/45 / Owner reply 1 min spec 確定 / v3.2 lock 確定 / 24h 連続稼働 final / D-Day (6/19) 09:00 開始 GO 確定 final"}'` | HTTP 200 |

### Section 7 集計
- 17:50-18:00 10 min / Owner 拘束 0 / buffer 0 min
- 7/7 GREEN で D-1 完遂 / D-Day (6/19) 09:00 開始 GO 確定 final

---

## §8 D-1 panic-free 完遂 spec (集計)

### §8.1 90 min timeline 累積集計 (Section 1-7)

| Section | 時間帯 | 所要 | 項目数 | 実機実行 ready | Owner 拘束 |
|---|---|---|---|---|---|
| §1 D-3 継承 + 24h 連続稼働 | 16:30-16:40 | 10 min | 6 | 6/6 | 0 |
| §2 v3.2 lock 前 final check | 16:40-16:50 | 10 min | 6 | 6/6 | 0 |
| §3 cron 切替 dry-run | 16:50-17:00 | 10 min | 5 | 5/5 | 0 |
| §4 17:00 共同 sign | 17:00-17:05 | 5 min | 5 | 5/5 | **1 min** |
| §5 v3.2 lock 確定 trial | 17:05-17:30 | 25 min | 8 | 8/8 | 0 |
| §6 24h 連続稼働 + smoke | 17:30-17:50 | 20 min | 8 | 8/8 | 0 |
| §7 D-Day GO + EOD | 17:50-18:00 | 10 min | 7 | 7/7 | 0 |
| **合計** | **16:30-18:00** | **90 min** | **45** | **45/45 (100%)** | **1 min** |

### §8.2 Owner 1 行 reply 1 min spec の根拠 5 件

1. **17:00 JST CEO 共同 sign post 連動**: §4.1 で CEO post → §4.2 Owner DM 通知 (10 sec)
2. **DM 内容 1 行確認 20 sec**: D-Day 09:00 公開 final 判断 + v3.2 lock OK + smoke 8 GREEN + cron 48h OK の 4 件サマリ 1 行
3. **GO/NoGO 1 行 reply 30 sec**: 1 単語 reply (`GO` / `NoGO`)
4. **OWN-AUTO PoC script-4 自動検出**: D-3 で trial 完遂 / 60 sec 内 detect 確証
5. **timeout 30 min fallback 担保**: §4.5 で 17:30 timeout 経路 + v3.1 fallback (R23 v3.1-delta) 適用

### §8.3 panic-free 完遂条件 6 件

1. **本書 1 文書で完遂可能** (R26 D-7/D-8 + R27 D-3 を base に拡張)
2. **D-3 → D-1 中 48h 連続稼働確認 (sequence 1.3-1.6)**: 中断 0 / regression 0
3. **v3.2 正式版 lock 後 absolute 無改変保持 (sequence 5.1-5.8)**: hash lock + git commit 0 件
4. **Owner 1 min reply spec 確定 (§4)**: D-7 0-1 min spec / D-Day 4-6 min spec と整合
5. **timeout fallback 30 min 担保 (§4.5)**: Owner reply 不在時の v3.1 経路 fallback
6. **D-Day 09:00 接続経路確認 (sequence 7.6)**: v3.2 正式版 Phase 1 step 1-1 spec 確認

### §8.4 escalation matrix 7 行 cmd レベル化

| Section | 1 次判断者 | 2 次判断者 | 連絡 cmd | SLA |
|---|---|---|---|---|
| §1 継承 + 24h 連続稼働 | CEO 小林 | Web-Ops 田中 | Slack DM template | 5-8 min |
| §2 v3.2 lock 前 check | Marketing 佐藤 | CEO 小林 | Slack DM template | 5 min |
| §3 cron 切替 dry-run | Web-Ops 田中 | Dev 山田 | Slack DM template | 5 min |
| §4 17:00 共同 sign (Owner 1 min reply) | CEO 小林 | (Owner 直接 reply) | Slack DM template + 17:30 timeout fallback | 1 min (通常) / 30 min (timeout) |
| §5 v3.2 lock 確定 trial | Marketing 佐藤 | Web-Ops 田中 (assist) | Slack DM template | 3 min |
| §6 24h 連続稼働 + smoke | Web-Ops 田中 | Dev 山田 | Slack DM template | 2.5 min |
| §7 D-Day GO + EOD | CEO 小林 | (4 部門代行 sign) | Slack DM template | 1.5 min |

---

## §9 historical baseline 完全保持原則

- Round 26 Marketing-T 4 file (D-8 + D-7 cmd レベル / R20-R26 trajectory / R26 summary) **absolute 無改変**
- Round 27 Marketing-U `marketing-u-r27-d-3-execution-ready.md` (40 項目 cmd レベル / 不変)
- Round 25 Marketing-S 4 file (D-8 real / v3.2 正式版 / R25 trajectory / R25 summary) **absolute 無改変**
- Round 24 Marketing-R 4 file (D-7 real / v3.2-delta-candidate / contingency v2 / R24 summary) **absolute 無改変**
- Round 23 Web-Ops-J OWN-AUTO PoC 4 script PRODUCTION-READY 状態 **absolute 無改変**
- launch day v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2 正式版 4 file **absolute 無改変保持**
- 本書のみが新規追加 / 既存 baseline 改変 0

## §10 副作用 0 担保 (本書策定後チェック)

- [x] 本書は文書のみ / 実行 0 / curl 0 / Slack post 0 / cron 操作 0 / DB write 0
- [x] Round 26 Marketing-T 4 file **完全無改変保持**
- [x] Round 27 Marketing-U D-3 execution-ready **完全無改変保持** (本書とは別 file / 並行存在)
- [x] Round 25 Marketing-S 4 file **完全無改変保持**
- [x] Round 23 Web-Ops-J OWN-AUTO PoC 4 script **完全無改変保持**
- [x] launch day v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2 正式版 4 file **完全無改変保持**
- [x] 絵文字 0 / Heroicons 参照のみ / API $0
- [x] Owner 拘束 0 (本書策定中 / D-1 当日 1 min spec / D-3 0 min spec / D-7 0-1 min spec / D-8 0 min spec / D-Day 4-6 min spec)
- [x] 新規 task 0 / 削除 task 0 (R27 Marketing-U D-1 起票のみ)

## §11 関連 DEC / KPI / Round 28 引継

- DEC-019-025: background dispatch SOP 22 件目 (本書含む R27 4 件まとめて 1 件カウント)
- DEC-019-033: knowledge 抽出経路 (本書を `organization/knowledge/patterns/d-1-execution-ready-spec.md` 候補化)
- DEC-019-054: portfolio v3.1 hash check (D-Day Phase 6 step 6-4 不変)
- DEC-019-062: cron 5 本 + CRON_SECRET (§3 sequence 3.1-3.5 dry-run cmd レベル化)
- DEC-019-068: Sec stagger 圧縮 baseline (連続 13 round 適用 / 本書影響 0)
- **DEC-019-081 候補**: D-3 + D-1 execution-ready + R27 confidence trajectory + R27 summary 4 件まとめて 1 議決 (CEO 提案)

KPI 連動:
- 17 日 path 完成度: 本書で D-1 実機実行 ready 物理化 → +1 path
- DEC trajectory: DEC-019-081 候補

Round 28 引継 (Marketing-V 想定):
1. D-1 当日実機実行 (6/18 16:30-18:00 JST 実 record 起票) → 本書を base に actual cmd 出力差分のみ追加
2. D-Day (6/19) 09:00 公開当日 real execution record 起票 (Marketing-V R28 想定)
3. T+24h timeline (6/20) 公開後 24h record 起票 (Marketing-V R28 想定)
4. v3.2 正式版 final lock confirmation post-公開 (Marketing-V R28 想定)
5. 6/19 confidence 96 → 98% 達成 (R28 公開当日 GREEN 完遂時)

---

**最終更新**: 2026-05-05 (Round 27 / Marketing-U / D-1 実機実行 readiness 完成版起票 + Owner 1 min reply spec 確定)
**派生元**: Round 26 Marketing-T `marketing-t-r26-d-7-execution-ready.md` (Owner 0-1 min spec / 不変保持) + Round 27 Marketing-U `marketing-u-r27-d-3-execution-ready.md` (Owner 0 min spec / 不変保持)
**次回見直し**: 2026-06-18 16:30 JST (D-1 実機実行当日 / 本書を base に 90 min 完遂)
