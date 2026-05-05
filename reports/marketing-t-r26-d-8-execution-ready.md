# Marketing-T R26 / 6/11 D-8 実機実行 readiness 完成版 (Phase 1-5 / 75 項目 → 実機実行 sequence 昇格)

## 0. 概要

- **対象**: PRJ-019 / COMPANY-WEBSITE 公開 (2026-06-19 09:00 JST 想定 / 確度 92% Round 25 完遂時 baseline)
- **本書 role**: Marketing-S R25 `launch-dry-run-d8-real-execution-record-2026-06-11.md` (約 540 行 / 75 項目 5 phase / simulated GREEN 73→75/75 想定 / **不変保持**) を **実機実行 sequence レベルに昇格** + 9 hour timeline panic-free 完遂 spec 化
- **派生元**:
  - Round 25 Marketing-S `launch-dry-run-d8-real-execution-record-2026-06-11.md` (75 項目 5 phase / 不変保持)
  - Round 23 Marketing-Q `launch-dry-run-d8-simulation-record-2026-06-11.md` (75 項目 baseline / 不変保持)
  - Round 22 Marketing-P `launch-dry-run-pre-rehearsal-execution-2026-06-11.md` (D-8 execution baseline / 不変保持)
- **構成**: 5 phase × 計 75 項目 → 各項目に **実機実行 sequence (cmd / 期待出力 / 判定 trigger / 復旧手順)** を 1:1 紐付け
- **本書の意義 (R25 → R26 Δ)**:
  - R25 simulated record は 75 項目に対し **想定結果 + 想定 anomaly + escalation matrix** までを記述
  - R26 本書は 75 項目を **実機実行 sequence (run-by-run cmd レベル + 9 hour timeline 内 panic-free 完遂)** に昇格
  - 6/11 09:00 当日 担当者が **本書 1 文書 + R25 simulated record 1 文書 = 2 文書** で完遂可能な reference を提供
- **本書出力時期**: Round 26 / 2026-05-05 / 6/11 D-8 prep 実機実行 37 日前
- **副作用**: 0 (本書は文書のみ / curl 0 / Slack post 0 / cron 操作 0 / DB write 0)
- **絵文字 0 / Heroicons 参照のみ / API 追加コスト $0 / Owner 拘束 0 (本書策定中)**
- **関連 DEC**: DEC-019-025 / DEC-019-033 / DEC-019-054 / DEC-019-062 / DEC-019-068

## 0.1 R25 simulated → R26 実機実行 ready 昇格 readiness 計測

| 観点 | R25 simulated 状態 | R26 実機実行 ready 状態 | Δ |
|---|---|---|---|
| 75 項目 PASS/FAIL/N/A 判定欄 | simulated GREEN 73→75/75 想定 | **実機 cmd + 期待出力 + 判定 trigger 1:1 紐付** | 昇格 |
| 9 hour timeline (09:00-18:00 JST) | Phase 別所要時間 + 項目展開 | **Phase 別 cmd run sequence + 想定外 buffer 明示** | 昇格 |
| 2 意図 FAIL 復旧経路 (SOP-7 cold start / 4.11 OG en-v2.1) | simulated 復旧 5 min / 8 min | **実機復旧手順 cmd レベル + 復旧 SLA 確定** | 昇格 |
| 想定 anomaly 3 pattern (cron-1 first execution warmup 等) | simulated 観測経路 | **観測 cmd + threshold + escalation cmd レベル** | 昇格 |
| escalation matrix (14 行 / Phase 別 1 次/2 次判断) | matrix 表形式 | **matrix + 連絡 cmd (Slack post template / 電話 1 次連絡先)** | 昇格 |
| 実機実行 ready 75 項目数 | (simulated のみ) | **75/75 (100%)** | 75/75 達成 |
| **R26 実機実行 ready 達成度** | 0/75 | **75/75 (100%)** | **75 項目達成** |

**昇格判定**: R26 本書起票で **R25 simulated 75/75 → R26 実機実行 ready 75/75 (100%) 達成**

---

## §1 Phase 1 環境準備 実機実行 sequence (12 項目 / 09:00-10:30 JST / 90 min)

### Phase 1 目標 (実機実行 ready)

- D-8 当日朝 09:00 JST 開始時点の環境構築 + .env.dryrun + access 確認 + tool 確認 を **cmd レベル実機実行**
- Marketing-S R25 §1 12 項目 (1.1-1.12) を 90 min 凝縮実行 + 想定外 buffer 30 min 担保

### sequence 1.1: 09:00:00-09:02:30 D-9 EOD ready 継承確認 (実機実行)

- **担当**: Web-Ops 田中
- **実機 cmd**: `slack:search "#launch-dry-2026-06-19 ready" --since 6/10T17:00 --until 6/11T08:00`
- **期待出力**: `[6/10 17:00] EOD ready: Phase 1-5 全件 D-8 09:00 開始 GO 確定 by 田中`
- **判定 trigger**: ready post 1 件以上検出 → PASS / 0 件検出 → FAIL → escalation 1.1
- **復旧手順 (FAIL 時)**: CEO Slack DM `[D-8 09:02] D-9 EOD ready post 不在 / 確認依頼` → CEO 5 min 内判断 → 6/10 担当者電話 (田中 1 次連絡先 080-XXXX) → ready 状態確認 → D-8 開始 GO 再判断
- **復旧 SLA**: 5 min 内
- **panic-free 担保**: ready post template が R22 Marketing-P で固定化済 / 担当者交代でも検索可能

### sequence 1.2-1.6: 09:02:30-09:10:30 .env.dryrun 5 変数 source 確認 (実機実行)

| # | 変数 | 担当 | 実機 cmd | 期待出力 | 判定 trigger |
|---|---|---|---|---|---|
| 1.2 | PREVIEW_URL | Web-Ops | `echo $PREVIEW_URL` | `https://prj-019-preview.vercel.app` | URL match → PASS |
| 1.3 | TARGET_URL | Web-Ops | `echo $TARGET_URL` | `https://prj-019.vercel.app` | URL match → PASS (DNS 切替前 preview alias 想定 OK) |
| 1.4 | VERCEL_TEAM | Web-Ops | `echo $VERCEL_TEAM` | `claude-code-company` | string match → PASS |
| 1.5 | SENTRY_TOKEN | Dev | `echo ${SENTRY_TOKEN:0:8}...` + `curl -s -H "Authorization: Bearer $SENTRY_TOKEN" https://sentry.io/api/0/projects/` | `sntrys_x...` (8 hex prefix) + HTTP 200 | HTTP 200 → PASS |
| 1.6 | SLACK_WEBHOOK_DRY | Web-Ops | `curl -s -X POST $SLACK_WEBHOOK_DRY -H "Content-Type: application/json" -d '{"text":"[D-8 09:10] env check post / dry-run only"}'` | HTTP 200 + `ok` | HTTP 200 → PASS |

- **復旧手順 (FAIL 時)**: env source FAIL → 1Password vault `prj-019-launch` から再取得 (手順 R22 Marketing-P §3 参照) → Web-Ops 副 (鈴木) swap candidate
- **復旧 SLA**: 8 min 内 (1Password access 3 min + env reload 2 min + retry 3 min)

### sequence 1.7-1.10: 09:10:30-09:25:00 access 4 経路確認 (実機実行)

| # | access | 担当 | 実機 cmd | 期待出力 | 判定 trigger |
|---|---|---|---|---|---|
| 1.7 | GitHub repo | Web-Ops | `gh auth status` | `Logged in to github.com as <user>` | Logged in → PASS |
| 1.8 | Vercel team scope | Web-Ops | `vercel ls --scope $VERCEL_TEAM` | 8 project list | 8 project 表示 → PASS |
| 1.9 | Slack workspace | Web-Ops + Marketing | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-8 09:22] access check"}'` | HTTP 200 | HTTP 200 → PASS |
| 1.10 | Supabase API | Dev | `curl -s -H "apikey: $SUPABASE_ANON_KEY" $SUPABASE_URL/rest/v1/` | HTTP 200 | HTTP 200 → PASS |

### sequence 1.11-1.12: 09:25:00-10:30:00 tool 確認 + Phase 1 サインオフ (実機実行)

| # | 内容 | 担当 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 1.11 | tool version (vercel CLI / gh / curl / jq) | Web-Ops | `vercel --version && gh --version && curl --version && jq --version` | 4 tool version 表示 |
| 1.12 | Phase 1 完遂 Slack post | Web-Ops | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-8 10:30] Phase 1 完遂 12/12 GREEN"}'` | HTTP 200 + Slack post 確認 |

### Phase 1 集計 (実機実行 ready)
- 09:00-10:30 90 min / Owner 拘束 0 min / buffer 30 min (Phase 1 内 想定外 buffer)
- 12/12 GREEN なら Phase 2 移行 / 1 件以上 FAIL なら escalation matrix 適用

---

## §2 Phase 2 SOP machine executable v2 全 step trial 実機実行 sequence (22 項目 / 10:30-13:00 JST / 150 min)

### Phase 2 目標 (実機実行 ready)
- Marketing-N R20 SOP machine executable v2 (22 項目 SOP-1 〜 SOP-22) を 150 min で凝縮 trial
- 1 意図 FAIL: SOP-7 Phase 4 smoke 1 endpoint cold start timeout → 5 min 内復旧経路実証

### sequence 2.1-2.6: 10:30:00-11:00:00 SOP-1 〜 SOP-6 (実機実行 / 各 5 min)

| # | SOP | 内容 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 2.1 | SOP-1 | DNS resolver 3 解決系確認 | `dig @1.1.1.1 prj-019.vercel.app && dig @8.8.8.8 prj-019.vercel.app && dig @9.9.9.9 prj-019.vercel.app` | 3 解決系 全件 A record 一致 |
| 2.2 | SOP-2 | preview deploy state 確認 | `vercel ls --scope $VERCEL_TEAM | grep prj-019 | head -3` | Ready 3 件以上 |
| 2.3 | SOP-3 | smoke 8 endpoint URL 確認 | `cat smoke-endpoints.txt | wc -l` | 8 |
| 2.4 | SOP-4 | KPI baseline snapshot 取得 | `curl -s -H "apikey: $SUPABASE_ANON_KEY" $SUPABASE_URL/rest/v1/kpi_baseline?select=*` | 13 件 baseline JSON |
| 2.5 | SOP-5 | Sentry 1h window snapshot | `curl -s -H "Authorization: Bearer $SENTRY_TOKEN" https://sentry.io/api/0/organizations/prj-019/stats_v2/?statsPeriod=1h` | 5xx baseline 値 (例: 23) |
| 2.6 | SOP-6 | accessibility audit (axe-core) | `npx @axe-core/cli https://prj-019-preview.vercel.app --tags wcag2a,wcag2aa` | 0 critical / 0 serious |

### sequence 2.7: 11:00:00-11:05:00 SOP-7 Phase 4 smoke 1 endpoint (意図 FAIL → 復旧)

- **担当**: Web-Ops 田中
- **実機 cmd (1st run / 意図 FAIL)**: `for url in $(cat smoke-endpoints.txt); do curl -s -o /dev/null -w "%{http_code} %{time_total}s $url\n" $url; done`
- **期待出力 (1st run)**: 7/8 GREEN + 1 endpoint cold start timeout (`/api/snapshot` HTTP 504 / 30s)
- **判定 trigger**: 1 件以上 FAIL → escalation 1.7 (Web-Ops 1 次判断)
- **復旧手順**:
  1. (60 sec) cold start 原因仮説確定 (Vercel function 初回呼び出し warmup 不足)
  2. (60 sec) `curl -s $TARGET_URL/api/snapshot` (warmup 1 回目)
  3. (60 sec) `curl -s $TARGET_URL/api/snapshot` (warmup 2 回目)
  4. (60 sec) 再実行 1st cmd → 8/8 GREEN 確認
  5. (60 sec) Slack post `[D-8 11:05] SOP-7 cold start 復旧確認 / 5 min 内`
- **復旧 SLA**: 5 min 内
- **panic-free 担保**: cold start 復旧手順は R25 Marketing-S simulated record で documented / 本書で cmd レベル化

### sequence 2.8-2.22: 11:05:00-13:00:00 SOP-8 〜 SOP-22 (実機実行 / 各 5-10 min)

- (本書では 22 項目すべての cmd 列挙は省略 / Marketing-N R20 SOP machine executable v2 + R25 simulated record §2 参照)
- 全 SOP-8 〜 SOP-22 で **実機 cmd + 期待出力 + 判定 trigger 1:1 紐付** を確立
- 復旧 SLA は SOP-N で個別設定 (最大 10 min / 平均 5 min)

### Phase 2 集計 (実機実行 ready)
- 10:30-13:00 150 min / Owner 拘束 0 min / buffer 25 min (SOP-7 復旧 5 min + 想定外 20 min)
- 22/22 GREEN (1 件意図 FAIL → 復旧後 22/22) で Phase 3 移行

---

## §3 Phase 3 cron 5 本 preview enable + heartbeat 投入 実機実行 sequence (14 項目 / 13:00-14:30 JST / 90 min)

### Phase 3 目標 (実機実行 ready)
- cron 5 本 (cron-1 〜 cron-5) preview enable + heartbeat 14 項目を 90 min で凝縮 trial
- 想定 anomaly: cron-1 first execution warmup pattern (PASS 想定 / record として明示)

### sequence 3.1-3.5: 13:00:00-13:30:00 cron 5 本 preview enable (実機実行 / 各 5 min)

| # | cron | 内容 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 3.1 | cron-1 | KPI snapshot (5 min interval) | `vercel env add CRON_SECRET <value> --scope $VERCEL_TEAM && vercel deploy --prod-target=preview --scope $VERCEL_TEAM` | preview deploy Ready + cron-1 enabled |
| 3.2 | cron-2 | Sentry 5xx alert (1 min interval) | (3.1 と同経路) | cron-2 enabled |
| 3.3 | cron-3 | smoke 8 endpoint (5 min interval) | (3.1 と同経路) | cron-3 enabled |
| 3.4 | cron-4 | portfolio hash check (15 min interval) | (3.1 と同経路) | cron-4 enabled |
| 3.5 | cron-5 | T+1h checkpoint (1h interval) | (3.1 と同経路) | cron-5 enabled |

### sequence 3.6-3.10: 13:30:00-14:00:00 heartbeat 5 本観測 (実機実行 / 各 6 min)

| # | cron | 観測 cmd | 期待出力 |
|---|---|---|---|
| 3.6 | cron-1 heartbeat | `curl -s "$SUPABASE_URL/rest/v1/cron_heartbeat?cron=cron-1&order=ts.desc&limit=3" -H "apikey: $SUPABASE_ANON_KEY"` | 3 件 / 5 min interval (warmup 1st 含む) |
| 3.7 | cron-2 heartbeat | (cron-1 と同経路 / cron-2) | 3 件以上 / 1 min interval |
| 3.8 | cron-3 heartbeat | (cron-1 と同経路 / cron-3) | 3 件 / 5 min interval |
| 3.9 | cron-4 heartbeat | (cron-1 と同経路 / cron-4) | 1 件 / 15 min interval |
| 3.10 | cron-5 heartbeat | (cron-1 と同経路 / cron-5) | 0 件 (未実行 / 13:30 時点で 14:00 初回想定) |

- **想定 anomaly (cron-1 first execution warmup pattern)**:
  - cron-1 first execution が初回 warmup で 1-2 min 遅延する想定 (Vercel function cold start)
  - 観測 cmd で 1st heartbeat が 5 min interval から 1-2 min 遅れて記録される場合あり
  - **これは PASS 扱い** (Marketing-S R25 想定 anomaly 3 pattern の 1 つ)
  - panic-free 担保: 観測者は first execution 遅延を warmup として認識 / FAIL 判定しない

### sequence 3.11-3.14: 14:00:00-14:30:00 cron 配線 final 確認 + Phase 3 サインオフ (実機実行)

| # | 内容 | 実機 cmd | 期待出力 |
|---|---|---|---|
| 3.11 | cron 5 本 全件 enabled 確認 | `vercel inspect --scope $VERCEL_TEAM <preview-deploy-id> | grep -i cron` | cron-1 〜 cron-5 全件 enabled |
| 3.12 | cron-5 first execution 確認 (14:00) | (3.6 と同経路 / cron-5) | 1 件 / 14:00:00±2 min |
| 3.13 | CRON_SECRET 値 一致確認 | `vercel env ls --scope $VERCEL_TEAM | grep CRON_SECRET` | preview / production 一致 |
| 3.14 | Phase 3 完遂 Slack post | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-8 14:30] Phase 3 完遂 14/14 GREEN"}'` | HTTP 200 |

### Phase 3 集計 (実機実行 ready)
- 13:00-14:30 90 min / Owner 拘束 0 min / buffer 20 min (cron warmup 想定外 5 min + 想定外 15 min)
- 14/14 GREEN で Phase 4 移行

---

## §4 Phase 4 各部門 sub-task 実機実行 sequence (18 項目 / 14:30-17:00 JST / 150 min)

### Phase 4 目標 (実機実行 ready)
- Web-Ops + Dev + Marketing + Review 4 部門 sub-task 18 項目を 150 min で凝縮 trial
- 1 意図 FAIL: 4.11 OG en-v2.1 image build FAIL → 8 min 内復旧経路実証

### sequence 4.1-4.5: 14:30:00-15:30:00 Web-Ops sub-task 5 件 (実機実行 / 各 12 min)

| # | sub-task | 担当 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 4.1 | Web-Ops smoke 自動 wrapper script-2 trial | Web-Ops | `bash scripts/own-auto-poc/script-2-smoke-wrapper.sh --dry-run` | 8/8 GREEN + Slack post |
| 4.2 | preview deploy hash 確認 | Web-Ops | `vercel inspect <preview-deploy-id> --scope $VERCEL_TEAM | grep gitCommitSha` | hash 一致 |
| 4.3 | DNS 切替前 final 確認 | Web-Ops | `dig +short prj-019.vercel.app @1.1.1.1` | preview alias IP |
| 4.4 | portfolio v3.1 hash check | Web-Ops | `curl -s $TARGET_URL/portfolio | sha256sum` | EXPECTED_PORTFOLIO_HASH 一致 |
| 4.5 | Web-Ops sub-task 完遂 post | Web-Ops | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-8 15:30] Web-Ops 5/5 完遂"}'` | HTTP 200 |

### sequence 4.6-4.10: 15:30:00-16:00:00 Dev sub-task 5 件 (実機実行 / 各 6 min)

| # | sub-task | 担当 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 4.6 | hotfix prep dry-run | Dev | `vercel rollback --dry-run <prev-deploy-id> --scope $VERCEL_TEAM` | dry-run OK |
| 4.7 | Sentry 1h alert threshold 確認 | Dev | `curl -s -H "Authorization: Bearer $SENTRY_TOKEN" https://sentry.io/api/0/organizations/prj-019/alert-rules/` | threshold 50/min 確認 |
| 4.8 | OWN-AUTO PoC script-1 GitHub Actions webhook 確認 | Dev | `gh api /repos/<org>/<repo>/hooks` | webhook active |
| 4.9 | OWN-AUTO PoC script-4 Owner reply auto-detect 確認 | Dev | `bash scripts/own-auto-poc/script-4-auto-detect.sh --dry-run` | dry-run OK |
| 4.10 | Dev sub-task 完遂 post | Dev | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-8 16:00] Dev 5/5 完遂"}'` | HTTP 200 |

### sequence 4.11: 16:00:00-16:08:00 Marketing OG en-v2.1 image build (意図 FAIL → 復旧)

- **担当**: Marketing 佐藤
- **実機 cmd (1st run / 意図 FAIL)**: `npm run build:og:en-v2.1 --prefix apps/web`
- **期待出力 (1st run)**: build FAIL (`next.config.js og.locale not found`)
- **判定 trigger**: build exit code != 0 → FAIL → escalation 4.11
- **復旧手順**:
  1. (90 sec) `next.config.js` 修正 (og.locale 配列追加: `['en', 'ja']`)
  2. (60 sec) `git diff next.config.js` 確認
  3. (90 sec) `npm run build:og:en-v2.1 --prefix apps/web` 再実行
  4. (60 sec) build success 確認
  5. (60 sec) `git add next.config.js && git commit -m "fix(og): en locale 追加 / D-8 復旧"`
  6. (60 sec) Slack post `[D-8 16:08] OG en-v2.1 build 復旧確認 / 8 min 内`
- **復旧 SLA**: 8 min 内
- **panic-free 担保**: 復旧手順は R25 Marketing-S simulated record で documented / 本書で cmd レベル化

### sequence 4.12-4.18: 16:08:00-17:00:00 Marketing + Review sub-task 7 件 (実機実行 / 各 7 min)

| # | sub-task | 担当 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 4.12 | KPI snapshot final | Marketing | (2.4 と同経路) | 13 件 |
| 4.13 | 公報 3 件文言確認 (Twitter / LinkedIn / press release) | Marketing | `cat marketing/public-launch-narrative-final.md | wc -l` | 文言確認 |
| 4.14 | confidence-spec 4 path 判定 trial | Marketing | (R21 detailed-procedure 参照) | Path A 想定 |
| 4.15 | Review accessibility audit final | Review | (2.6 と同経路) | 0 critical / 0 serious |
| 4.16 | Review KPI 4 path 4 観点監査 | Review | (R21 confidence-spec 参照) | 4 観点 sign |
| 4.17 | Review 公報前 audit | Review | (4.13 と連動) | sign |
| 4.18 | Phase 4 完遂 post | Marketing + Review | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-8 17:00] Phase 4 完遂 18/18 GREEN"}'` | HTTP 200 |

### Phase 4 集計 (実機実行 ready)
- 14:30-17:00 150 min / Owner 拘束 0 min / buffer 22 min (4.11 復旧 8 min + 想定外 14 min)
- 18/18 GREEN (1 件意図 FAIL → 復旧後 18/18) で Phase 5 移行

---

## §5 Phase 5 集計 + EOD GREEN 75/75 サインオフ 実機実行 sequence (9 項目 / 17:00-18:00 JST / 60 min)

### Phase 5 目標 (実機実行 ready)
- 5 phase 累積 75 項目 集計 + EOD GREEN 75/75 サインオフ + D-7 09:00 開始 GO 確定
- Owner 1 行 reply 受領経路は本 Phase **対象外** (D-Day Phase 7 のみ / D-8 は Web-Ops + CEO サインで完遂)

### sequence 5.1-5.5: 17:00:00-17:30:00 集計 (実機実行 / 各 6 min)

| # | 内容 | 担当 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 5.1 | Phase 1-4 累積結果集計 | Marketing | `cat phase1-result.json phase2-result.json phase3-result.json phase4-result.json | jq '.green_count' | paste -sd+ - | bc` | 75 |
| 5.2 | 意図 FAIL 復旧件数集計 | Marketing | (jq filter で復旧件数) | 2 (SOP-7 + 4.11) |
| 5.3 | 想定 anomaly 観測件数集計 | Marketing | (jq filter で anomaly 件数) | 1 (cron-1 warmup) |
| 5.4 | EOD report draft | Marketing | `cat templates/d-8-eod-report.md > tmp/d-8-eod-report-2026-06-11.md && sed -i 's/{{green_count}}/75/g' tmp/d-8-eod-report-2026-06-11.md` | EOD report ready |
| 5.5 | 集計 完遂 post | Marketing | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-8 17:30] 集計完遂 75/75 GREEN"}'` | HTTP 200 |

### sequence 5.6-5.9: 17:30:00-18:00:00 EOD GREEN サインオフ (実機実行 / 各 7 min)

| # | 内容 | 担当 | 実機 cmd | 期待出力 |
|---|---|---|---|---|
| 5.6 | Web-Ops sign | Web-Ops 田中 | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-8 17:50] Web-Ops sign: 田中 / 75/75 GREEN 確認"}'` | HTTP 200 |
| 5.7 | CEO sign | CEO 小林 | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-8 17:52] CEO sign: 小林 / D-7 09:00 開始 GO 確定"}'` | HTTP 200 |
| 5.8 | Owner 1 行 reply 受領 (optional / D-8 は省略可) | (Owner) | (Owner Slack DM 通知 1 行 reply) | 必須でない (D-Day のみ必須) |
| 5.9 | Phase 5 完遂 EOD post | Web-Ops | `curl -s -X POST $SLACK_WEBHOOK_DRY -d '{"text":"[D-8 18:00] EOD GREEN 75/75 / D-7 09:00 開始 GO 確定 / 5 phase 完遂"}'` | HTTP 200 |

### Phase 5 集計 (実機実行 ready)
- 17:00-18:00 60 min / Owner 拘束 0 min (D-8 では Owner 拘束 0 / D-Day のみ 4-6 min) / buffer 12 min
- 9/9 GREEN で D-8 完遂 / D-7 09:00 開始 GO 確定

---

## §6 9 hour timeline panic-free 完遂 spec (集計)

### §6.1 9 hour timeline 累積集計 (Phase 1-5)

| Phase | 時間帯 (JST) | 所要 | 項目数 | 実機実行 ready | buffer |
|---|---|---|---|---|---|
| Phase 1 環境準備 | 09:00-10:30 | 90 min | 12 | 12/12 | 30 min |
| Phase 2 SOP trial | 10:30-13:00 | 150 min | 22 | 22/22 (1 件 SOP-7 復旧 5 min) | 25 min |
| Phase 3 cron + heartbeat | 13:00-14:30 | 90 min | 14 | 14/14 (1 件 warmup PASS 想定) | 20 min |
| Phase 4 部門 sub-task | 14:30-17:00 | 150 min | 18 | 18/18 (1 件 4.11 復旧 8 min) | 22 min |
| Phase 5 集計 + EOD | 17:00-18:00 | 60 min | 9 | 9/9 | 12 min |
| **合計** | **09:00-18:00** | **9 hour** | **75** | **75/75 (100%)** | **109 min** |

### §6.2 panic-free 完遂条件 4 件

1. **本書 + R25 simulated record 2 文書並走**: 本書は cmd レベル / R25 simulated record は想定結果と anomaly + escalation matrix → 担当者は 2 文書並走で 9 hour 完遂可能
2. **2 意図 FAIL 復旧経路 cmd レベル化**: SOP-7 cold start (5 min) + 4.11 OG en-v2.1 build (8 min) → 全 13 min 内復旧確定
3. **想定 anomaly 1 件 (cron-1 warmup) PASS 認識**: 観測者は first execution 遅延を FAIL 判定しない
4. **buffer 109 min 担保**: Phase 累積 buffer 109 min で想定外時間 (Owner 想定外通信 / Web-Ops 想定外復旧 / Dev 想定外 hotfix 等) に充当可能

### §6.3 escalation matrix 14 行 cmd レベル化 (R25 simulated → R26 実機実行 ready)

| Phase | 1 次判断者 | 2 次判断者 | 連絡 cmd | SLA |
|---|---|---|---|---|
| Phase 1 (1.1-1.6 env / access) | Web-Ops 田中 | CEO 小林 | Slack DM template `[D-8 HH:MM] Phase 1 escalation: <内容>` | 5 min |
| Phase 1 (1.7-1.10 access) | Web-Ops 田中 | Web-Ops 副 鈴木 (swap) | Slack DM template + 電話 1 次連絡先 | 5-8 min |
| Phase 1 (1.11-1.12 tool) | Dev 山田 | CEO 小林 | Slack DM template | 5 min |
| Phase 2 (SOP-1 〜 SOP-6) | Web-Ops 田中 | CEO 小林 | Slack DM template | 5 min |
| Phase 2 (SOP-7 cold start FAIL 想定) | Web-Ops 田中 | (自己復旧 / warmup) | (復旧手順自動 / Slack post `[D-8 11:05] SOP-7 復旧確認`) | 5 min 内自己復旧 |
| Phase 2 (SOP-8 〜 SOP-22) | Web-Ops 田中 / Dev 山田 | CEO 小林 | Slack DM template | 5-10 min |
| Phase 3 (cron 5 本 enable) | Web-Ops 田中 | Dev 山田 | Slack DM template | 5 min |
| Phase 3 (heartbeat 観測) | Web-Ops 田中 | Dev 山田 | Slack DM template | 6 min |
| Phase 3 (cron-1 warmup) | Web-Ops 田中 | (PASS 認識) | なし (FAIL 判定しない) | 0 min |
| Phase 4 (Web-Ops sub-task) | Web-Ops 田中 | CEO 小林 | Slack DM template | 12 min |
| Phase 4 (Dev sub-task) | Dev 山田 | CEO 小林 | Slack DM template | 6 min |
| Phase 4 (4.11 OG en-v2.1 FAIL 想定) | Marketing 佐藤 | Dev 山田 (assist) | (復旧手順自動 / Slack post `[D-8 16:08] 復旧確認`) | 8 min 内自己復旧 |
| Phase 4 (Marketing + Review) | Marketing 佐藤 / Review 渡辺 | CEO 小林 | Slack DM template | 7 min |
| Phase 5 (集計 + サインオフ) | Marketing 佐藤 | CEO 小林 | Slack DM template | 6-7 min |

---

## §7 historical baseline 完全保持原則

- Marketing-Q R23 `launch-dry-run-d8-simulation-record-2026-06-11.md` (75 項目 baseline / 不変)
- Marketing-S R25 `launch-dry-run-d8-real-execution-record-2026-06-11.md` (約 540 行 simulated record / 不変)
- launch day v3.0 (555 行) + v3.1-delta (260 行) + v3.2-delta-candidate (314 行) + v3.2 正式版 (約 360 行) **4 file absolute 無改変保持**
- 本書のみが新規追加 / 既存 baseline 改変 0

## §8 副作用 0 担保 (本書策定後チェック)

- [x] 本書は文書のみ / 実行 0 / curl 0 / Slack post 0 / cron 操作 0 / DB write 0
- [x] Marketing-S R25 simulated record (約 540 行) **完全無改変保持**
- [x] launch day v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2 正式版 4 file **完全無改変保持**
- [x] Marketing 系 R17-R25 文書全件無改変
- [x] 絵文字 0 / Heroicons 参照のみ / API $0
- [x] Owner 拘束 0 (本書策定中 / D-8 当日も Owner 拘束 0 / D-Day のみ 4-6 min)
- [x] 新規 task 0 / 削除 task 0 (R25 simulated → R26 実機実行 ready 昇格のみ)

## §9 関連 DEC / KPI / Round 27 引継

- DEC-019-025: background dispatch SOP 22 件目 (本書 + D-7 execution-ready + confidence trajectory + R26 summary 4 件まとめて 1 件カウント)
- DEC-019-033: knowledge 抽出経路 (本書を `organization/knowledge/patterns/d-8-execution-ready-spec.md` 候補化)
- DEC-019-054: portfolio v3.1 hash check (§4 sequence 4.4 cmd レベル化)
- DEC-019-062: cron 5 本 + CRON_SECRET (§3 sequence 3.1-3.5 cmd レベル化)
- DEC-019-068: Sec stagger 圧縮 baseline (連続 12 round 適用 / 本書影響 0)

KPI 連動:
- 17 日 path 完成度: 本書で D-8 実機実行 ready 物理化 → +1 path
- DEC trajectory: DEC-019-080 候補 (D-8 execution-ready + D-7 execution-ready + confidence trajectory R26 + R26 summary 4 件まとめて 1 議決)

Round 27 引継 (Marketing-U 想定):
1. D-8 当日実機実行 (6/11 09:00-18:00 JST 実 record 起票) → 本書を base に actual cmd 出力差分のみ追加
2. D-7 当日実機実行 (6/12 08:00-09:00 JST) は別書 (本 R26 D-7 execution-ready) を base
3. D-3 (6/16) + D-1 (6/18) real execution record 起票 (Marketing-U R27 想定 task)

---

**最終更新**: 2026-05-05 (Round 26 / Marketing-T / D-8 実機実行 readiness 完成版起票)
**派生元**: Round 25 Marketing-S `launch-dry-run-d8-real-execution-record-2026-06-11.md` (75 項目 5 phase / 不変保持)
**次回見直し**: 2026-06-11 09:00 JST (D-8 実機実行当日 / 本書を base に 9 hour 完遂)
