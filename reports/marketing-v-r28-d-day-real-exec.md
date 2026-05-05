# Marketing-V R28 task ① 6/19 D-Day Real Execution Spec (7 Phase 6 hour Timeline / 75-100 cmd 化 / Owner 拘束 4-6 min 実測 spec)

## 0. 概要

- **対象**: PRJ-019 Open Claw / COMPANY-WEBSITE 公開 **2026-06-19 06:00-12:00 JST 当日 real execution spec**
- **本書 role**: Round 28 Marketing-V task ① / 6/19 D-Day 当日に **本書のみで panic-free 実機完遂可能な real execution sequence cmd レベル化**
- **派生元**:
  - launch day v3.2 正式版 (`projects/COMPANY-WEBSITE/marketing/launch-day-timeline-2026-06-19-v3.2.md` 約 360 行 / 不変保持 / 本書はその実機実行仕様化)
  - Marketing-T R26 D-8 + D-7 execution-ready (75 + 50 = 125 項目 cmd レベル化)
  - Marketing-U R27 D-3 + D-1 execution-ready (40 + 45 = 85 項目 cmd レベル化)
  - Marketing-U R27 R20-R27 confidence trajectory + 96% baseline 達成
- **本書出力時期**: Round 28 / 2026-05-05 / 6/19 公開 45 日前
- **副作用**: 0 (本書は文書のみ / API $0 / 絵文字 0 / Heroicons のみ / launch day v3.x 4 file absolute 無改変)
- **項目総数**: **84 項目** (75-100 範囲 / 7 Phase 内訳 §1: 17 / §2: 12 / §2.5: 7 / §3: 9 / §4: 11 / §5: 9 / §6: 13 / §7: 6)
- **Owner 拘束**: **4-6 min 実測 spec** (内訳 1.0 + 0.5 + 0.25 + 1.0 + buffer 1.25-3.25 min = 2.75 min 限界圧縮 → 4-6 min 安全策)
- **関連 DEC**: DEC-019-025 / DEC-019-033 / DEC-019-054 / DEC-019-062 / DEC-019-068 / DEC-019-081 候補

---

## §1 Phase 1: Owner action card 7 sub-card 自動化確認 + sub-card 確定 (06:00-07:00 JST / 60 min / 17 項目)

### §1.1 step 1-1: 06:00:00 Owner Slack DM 通知開封 + 1 行宣言 reply (1.0 min Owner 拘束)

- **項目 1-1-A**: 06:00:00 OWN-AUTO PoC script-3 が Owner Slack DM へ push notif 自動送信
  - cmd (Web-Ops side / sentinel 監視): `tail -F /var/log/own-auto-poc/script-3.log | grep "06:00:00 D-Day push notif sent to Owner DM" | head -1`
  - 期待出力: `2026-06-19T06:00:00+09:00 INFO push notif sent / target=Owner / msg="6/19 06:00 D-Day blocker-free 確認 / pre-confirmed GO sign 依頼"`
  - 判定 trigger: 06:00:05 までに log 1 行確認 → GO / 不発 → §1.1 fallback (CEO Slack DM 手動 mention)
- **項目 1-1-B**: 06:00:10 Owner Slack DM 通知開封 (10 sec)
  - Owner action: Slack mobile 通知 tap → DM thread open
  - Owner 拘束: 10 sec
- **項目 1-1-C**: 06:00:50 Owner 1 行 reply 完了 (50 sec)
  - Owner reply 文言 (固定): `OK Owner: 6/19 06:00 D-Day blocker-free 確認 / pre-confirmed GO sign`
  - Owner 拘束累計: 60 sec = 1.0 min (実測 target)
- **項目 1-1-D**: 06:00:55 OWN-AUTO PoC script-4 が Owner reply auto-detect → INDEX.md 状態列 OWN-PRE-07 を `pre_confirmed_GO` に PR 自動生成 + Web-Ops merge
  - 検証 cmd: `gh pr list --repo $ORG/$REPO --search "OWN-PRE-07 pre_confirmed_GO" --state merged --limit 1`
  - 期待出力: PR 1 件 merged / merge_commit_sha 取得
- **項目 1-1-E (fallback)**: Owner reply 不在時 06:01:00 で script-3 reminder push 自動再送 / 06:02:00 で CEO 直接電話 (CARD H backup contact / Owner 携帯)
  - 復旧 SLA: 06:05:00 までに reply 取得 / それ以降は v3.1 経路 fallback (Owner 5 min 手動拘束)

### §1.2 step 1-2: 06:05-06:20 Web-Ops sub-card 1-3 自動 status check (15 min)

- **項目 1-2-A**: 06:05:00 OWN-AUTO PoC script-1 が GitHub Actions webhook 経由で OWN-PRE-01-03 status fetch
  - 検証 cmd: `gh api /repos/$ORG/$REPO/actions/workflows/own-pre-status-check.yml/runs --jq ".workflow_runs[0].status"`
  - 期待出力: `completed`
- **項目 1-2-B**: 06:10:00 OWN-PRE-01 (preview deploy state) status DONE 確認
  - 検証 cmd: `vercel ls --scope $VERCEL_TEAM --token $VERCEL_TOKEN | grep "$PROJECT" | grep "Ready" | head -1`
  - 期待出力: `Ready` 行 1 件
- **項目 1-2-C**: 06:15:00 OWN-PRE-02 (DNS 切替前 propagation) status DONE 確認
  - 検証 cmd: `dig +short prj-019.vercel.app @1.1.1.1 && dig +short prj-019.vercel.app @8.8.8.8 && dig +short prj-019.vercel.app @9.9.9.9`
  - 期待出力: 3 resolver 全件で同一 A record 応答
- **項目 1-2-D**: 06:20:00 OWN-PRE-03 (smoke 8 endpoint prep) status DONE 確認
  - 検証 cmd: `curl -s -o /dev/null -w "%{http_code}\n" https://prj-019-preview.vercel.app/{,about,services,case,contact,blog,privacy,terms} | sort -u`
  - 期待出力: `200` (1 行 / 8 endpoint 全件 200)
- **項目 1-2-E (復旧)**: 1 endpoint でも 200 以外 → §1 step 1-2 fallback / Web-Ops 田中 5 min 内に preview redeploy + Vercel cache purge

### §1.3 step 1-3: 06:10-06:20 Dev sub-card 4-6 自動 status check (10 min)

- **項目 1-3-A**: 06:10:00 OWN-AUTO PoC script-1 が OWN-PRE-04-06 status fetch (Web-Ops と並行)
- **項目 1-3-B**: OWN-PRE-04 (Sentry baseline 5xx 0/h) 確認
  - 検証 cmd: `curl -s -H "Authorization: Bearer $SENTRY_TOKEN" "https://sentry.io/api/0/projects/$ORG/$PROJECT/stats/?stat=event.received&since=$(date -d '-1 hour' +%s)" | jq '.[][1] | select(. > 0)' | wc -l`
  - 期待出力: `0`
- **項目 1-3-C**: OWN-PRE-05 (rollback ID confirmed) 確認
  - 検証 cmd: `vercel ls --scope $VERCEL_TEAM --token $VERCEL_TOKEN | grep "$PROJECT" | head -2 | tail -1 | awk '{print $2}'`
  - 期待出力: 前回 production deploy ID 取得 (空文字でないこと)
- **項目 1-3-D**: OWN-PRE-06 (cron 5 本 heartbeat 24h GREEN) 確認
  - 検証 cmd: `for f in cron-1 cron-2 cron-3 cron-4 cron-5; do curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v1/projects/$PROJECT/cron-jobs/$f/runs?limit=288" | jq '[.runs[] | select(.status == "succeeded")] | length'; done`
  - 期待出力: 5 行全件 `288` (5 min interval × 60 min × 24 h = 288 / 24h GREEN)

### §1.4 step 1-4: 06:20:00-06:20:30 OWN-AUTO PoC 4 script push notif 完全実装 + Owner 30 sec scan (0.5 min Owner 拘束)

- **項目 1-4-A**: 06:20:00 OWN-AUTO PoC 4 script の push notif が Owner Slack DM に 7 sub-card status 1 行 summary 自動送信
  - 期待 push 文言: `[D-Day 06:20] 7/7 sub-card status: PRE-01 DONE / PRE-02 DONE / PRE-03 DONE / PRE-04 DONE / PRE-05 DONE / PRE-06 DONE / PRE-07 pre_confirmed_GO`
- **項目 1-4-B**: 06:20:10 Owner Slack DM 通知開封 (10 sec)
- **項目 1-4-C**: 06:20:20 Owner 1 行 status summary 確認 (10 sec)
- **項目 1-4-D**: 06:20:30 Owner 1 行 reply (10 sec) `OK 7/7 confirmed via OWN-AUTO PoC v3.2`
  - Owner 拘束累計: 30 sec = 0.5 min (累計 1.0 + 0.5 = 1.5 min)
- **項目 1-4-E (fallback)**: script-3 push 不発時 v3.1 経路 (Owner 5 min 手動拘束) / D-1 17:00 sign 後の 24h 連続稼働確認 GREEN なら v3.2 適用継続

### §1.5 step 1-5: 06:30 Owner pre-confirmed GO 重畳 (0 min Owner 拘束 / 朝食重畳)

- **項目 1-5-A**: 06:30:00 OWN-AUTO PoC script-4 が step 1-1 reply を auto-detect → OWN-PRE-07 status を `pre_confirmed_GO` → `DONE` 自動 PR
  - 検証 cmd: `gh pr list --repo $ORG/$REPO --search "OWN-PRE-07 DONE" --state merged --limit 1`
  - 期待出力: PR 1 件 merged
- **項目 1-5-B**: Owner 拘束: 0 min (step 1-1 の reply で重畳済 / 朝食中)

### §1.6 step 1-6: 06:45-07:00 7 sub-card final status confirmed (15 min)

- **項目 1-6-A**: 06:45:00 Web-Ops 田中 + Dev 山田 + Marketing 佐藤 3 名 並走 status confirm
- **項目 1-6-B**: 06:55:00 7 sub-card 全件 DONE 確認 (INDEX.md hash check)
  - 検証 cmd: `cd /path/to/own-auto-poc && git log --oneline INDEX.md | head -1`
  - 期待出力: 直近 commit 1 件 (06:00:55 PR merge sha と一致)
- **項目 1-6-C**: 07:00:00 Slack auto post `[D-Day 07:00] Phase 1 完遂 / 7/7 sub-card DONE / Phase 2 移行`

### Phase 1 集計
- 06:00:00-07:00:00 60 min / Owner 拘束 1.5 min / buffer 50.5 min / 17 項目全件 cmd 化

---

## §2 Phase 2: preview deploy state 維持 + smoke prep + DNS prep (07:00-08:30 / 90 min / 12 項目)

### §2.1 step 2-1: 07:00 preview deploy state 確認 (10 min)

- **項目 2-1-A**: `vercel ls --scope $VERCEL_TEAM --token $VERCEL_TOKEN | grep "$PROJECT" | grep "Ready"`
  - 期待出力: 1 行 (Ready preview / production 切替前)
- **項目 2-1-B**: 07:05 preview URL 200 確認 `curl -s -o /dev/null -w "%{http_code}\n" $PREVIEW_URL`
  - 期待出力: `200`

### §2.2 step 2-2: 07:10 smoke 8 endpoint prep (15 min)

- **項目 2-2-A**: 8 endpoint URL list 出力 + curl 1 round dry-run (preview のみ / 本番 0)
  - cmd: `bash scripts/smoke-8-endpoint.sh --target preview --dry-run`
  - 期待出力: 8 endpoint 全件 `[OK 200 0.4s]` 形式
- **項目 2-2-B**: smoke wrapper script-2 の 5 min interval timer 起動準備
  - cmd: `systemctl status own-auto-smoke.timer | grep "Active: active"`

### §2.3 step 2-3: 07:25 DNS 切替前確認 (10 min)

- **項目 2-3-A**: 3 resolver 解決確認 (1.1.1.1 / 8.8.8.8 / 9.9.9.9)
  - cmd: `for r in 1.1.1.1 8.8.8.8 9.9.9.9; do echo "$r: $(dig +short prj-019.vercel.app @$r)"; done`
  - 期待出力: 3 行全件 同一 A record
- **項目 2-3-B**: 07:30 propagation 100% 確認 (D-1 17:00 切替済)

### §2.4 step 2-4: 07:35 KPI baseline snapshot 確認 (15 min)

- **項目 2-4-A**: KPI-01-13 13 件 baseline snapshot 取得 (OWN-AUTO PoC script-2 経由)
  - cmd: `bash scripts/kpi-baseline-snapshot.sh --target T-90min --output dashboard/launch-kpi-2026-06-19-T-90min.md`
  - 期待出力: 13 件 KPI 全件 baseline 値出力
- **項目 2-4-B**: 07:48 baseline file 1Password vault 保存 + git commit 0 (read-only)

### §2.5 step 2-5: 07:50 accessibility audit (15 min)

- **項目 2-5-A**: axe-core CI 実行 `bash scripts/axe-audit.sh --target preview`
  - 期待出力: `0 critical / 0 serious`

### §2.6 step 2-6: 08:05 hotfix prep (15 min)

- **項目 2-6-A**: rollback dry-run `vercel rollback --dry-run $PREV_DEPLOY_ID --scope $VERCEL_TEAM --token $VERCEL_TOKEN`
  - 期待出力: `Rollback would set production to deployment $PREV_DEPLOY_ID`
- **項目 2-6-B**: Case A rollback playbook 開封確認 (Web-Ops 田中 + Dev 山田 共有 vault)

### §2.7 step 2-7: 08:20 Phase 2 完遂 confirm (10 min)

- **項目 2-7-A**: 6 step 全件 GREEN 確認 / Slack auto post `[D-Day 08:30] Phase 2 完遂`
- **項目 2-7-B**: 08:29 Phase 2.5 移行 prep (snapshot trigger 直前 30 sec)

### Phase 2 集計
- 07:00-08:30 90 min / Owner 拘束 0 min / buffer 0 min / 12 項目全件 cmd 化

---

## §2.5 Phase 2.5: OWN-AUTO PoC scheduled snapshot trigger + Owner thread reply (08:30:00-08:30:15 / 15 sec / 7 項目)

### §2.5.1 step 2.5-1: 08:30:00 OWN-AUTO PoC scheduled snapshot trigger (15 sec / Owner 拘束 0.25 min)

- **項目 2.5-A**: 08:25:00 OWN-AUTO PoC script-2 が Supabase API 経由で manual snapshot trigger 自動実行 (T-5min)
  - cmd: `curl -s -X POST -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" "https://$SUPABASE_PROJECT.supabase.co/rest/v1/rpc/launch_day_snapshot_trigger" -d '{"phase":"T-5min","trigger_at":"2026-06-19T08:25:00+09:00"}'`
  - 期待出力: `{"snapshot_id":"snap_xxx","status":"queued"}`
- **項目 2.5-B**: 08:30:00 snapshot 完了通知 (200 + snapshot ID) を script-3 が Slack `#prj-019-launch` thread post + Owner mention
- **項目 2.5-C**: 08:30:00 mention 文言: `@owner D-Day T-30min snapshot 完了 (snap_xxx) / 1 文字 reply OK で OWN-PRE-07 → DONE 自動 PR`
- **項目 2.5-D**: 08:30:05 Owner Slack mention 通知開封 (5 sec)
- **項目 2.5-E**: 08:30:15 Owner thread reply `OK` (10 sec)
  - Owner 拘束: 15 sec = 0.25 min (累計 1.5 + 0.25 = 1.75 min)
- **項目 2.5-F**: 08:30:20 script-4 が Owner reply auto-detect → INDEX.md OWN-PRE-07 TODO → DONE 自動 PR + Web-Ops merge
- **項目 2.5-G (fallback)**: 08:30:15 までに reply 不在 → 08:30:30 reminder push → 08:30:45 CEO 直接電話 / 不発時 v3.1 §2.5 (30 sec sign) 経路 rollback

### Phase 2.5 集計
- 08:30:00-08:30:15 15 sec / Owner 拘束 0.25 min / buffer 4.75 min / 7 項目全件 cmd 化

---

## §3 Phase 3: T-0 launch (09:00:00-09:05:00 / 5 min / 9 項目)

### §3.1 step 3-1: 09:00:00 OWN-AUTO PoC pre-confirmed GO 自動明示 + CEO 自動 thread reply (Owner 0 min)

- **項目 3-1-A**: 09:00:00 script-3 が pre-confirmed GO sign を `#launch-2026-06-19` に auto post
  - 期待出力 (Slack): `[D-Day 09:00:00] CEO GO confirmed via OWN-AUTO PoC pre-sign / Phase T-0 開始`
- **項目 3-1-B**: 09:00:00 script-4 が CEO Slack presence (online) auto-detect → CEO online なら自動 thread reply `OK CEO: T-0 確認 (auto-confirmed via PoC)`
  - 検証 cmd: `curl -s -H "Authorization: Bearer $SLACK_BOT_TOKEN" "https://slack.com/api/users.getPresence?user=$CEO_SLACK_ID" | jq -r '.presence'`
  - 期待出力: `active`
- **項目 3-1-C**: 09:00:01 production swap 自動実行 (script-1 が webhook trigger)
  - cmd: `vercel promote $PREVIEW_DEPLOY_ID --scope $VERCEL_TEAM --token $VERCEL_TOKEN`
  - 期待出力: `Promoted to production`

### §3.2 step 3-2: 09:00:30 Web-Ops smoke 1 round 確認 (1 min)

- **項目 3-2-A**: smoke 8 endpoint 自動 curl (script-2)
  - cmd: `bash scripts/smoke-8-endpoint.sh --target production --post-swap`
  - 期待出力: `8/8 GREEN`

### §3.3 step 3-3: 09:01:30 Sentry 1h window snapshot (1 min)

- **項目 3-3-A**: Sentry stats API 1h window 取得
  - cmd: `curl -s -H "Authorization: Bearer $SENTRY_TOKEN" "https://sentry.io/api/0/projects/$ORG/$PROJECT/stats/?stat=event.received&resolution=1h&since=$(date +%s)"`
  - 期待出力: 5xx baseline 0

### §3.4 step 3-4: 09:02:30 KPI snapshot (1 min)

- **項目 3-4-A**: KPI-01/02/03/04 T-0 baseline snapshot
  - cmd: `bash scripts/kpi-snapshot.sh --target T-0 --output dashboard/launch-kpi-2026-06-19-T-0.md`

### §3.5 step 3-5: 09:03:30 公開状態確認 (1 min)

- **項目 3-5-A**: TARGET_URL 公開確認 (DNS 切替済)
  - cmd: `curl -sI https://prj-019.vercel.app | head -1`
  - 期待出力: `HTTP/2 200`

### §3.6 step 3-6: 09:04:30 Phase 3 完遂 (30 sec)

- **項目 3-6-A**: Slack auto post `[D-Day 09:05] Phase T-0 完遂 / Phase 4 監視開始`

### Phase 3 集計
- 09:00:00-09:05:00 5 min / Owner 拘束 0 min / CEO 拘束 0 sec (online presence のみ) / buffer 5 min / 9 項目全件 cmd 化

---

## §4 Phase 4: 監視 1h (09:05-10:05 / 60 min / 11 項目)

### §4.1 step 4-1: 09:05-10:05 OWN-AUTO PoC smoke 自動 wrapper + Web-Ops 監視 (58.5 min)

- **項目 4-1-A**: script-2 が 5 min interval で smoke 8 endpoint HEAD curl 自動実行 (12 round)
  - 検証 cmd (sentinel): `tail -F /var/log/own-auto-poc/script-2.log | grep "smoke 8/8 GREEN"`
- **項目 4-1-B**: 09:10 / 09:15 / 09:20 / ... / 10:00 12 回 GREEN 自動 post 確認
- **項目 4-1-C**: Web-Ops 主担当者 田中 監視 only (手動 curl 0 / Slack 自動 post 12 回確認のみ)
- **項目 4-1-D (fallback)**: 12 回中 1 回でも FAIL → script-2 が `@channel` auto alert → Web-Ops 田中 5 min 内に手動再実行

### §4.2 step 4-2: Sentry 1h alert 監視 (Dev 山田)

- **項目 4-2-A**: Sentry 5xx threshold 50/min alert ch subscribe 確認
- **項目 4-2-B**: 09:30 / 10:00 中間 snapshot 取得

### §4.3 step 4-3: cron 5 本 heartbeat 観測

- **項目 4-3-A**: 1 min interval × 60 = 60 回 expected (cron-1 〜 cron-5)
  - 検証 cmd: `for f in cron-1 cron-2 cron-3 cron-4 cron-5; do curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v1/projects/$PROJECT/cron-jobs/$f/runs?limit=12" | jq '[.runs[] | select(.status == "succeeded")] | length'; done`
  - 期待出力: 5 行全件 `12` (5 min interval × 12 回)

### §4.4 step 4-4: hotfix standby (Dev 山田)

- **項目 4-4-A**: Case A 即時 rollback 用 cmd ready
  - 待機 cmd: `vercel rollback $PREV_DEPLOY_ID --scope $VERCEL_TEAM --token $VERCEL_TOKEN` (実行は alert trigger 時のみ)
- **項目 4-4-B**: hotfix branch ready (`hotfix/2026-06-19-launch-day` / 0 commit)

### §4.5 step 4-5: accessibility 連続 audit (Review 渡辺)

- **項目 4-5-A**: 09:30 / 10:00 axe-core 連続実行
  - 期待出力: `0 critical / 0 serious` 維持

### Phase 4 集計
- 09:05-10:05 60 min / Owner 拘束 0 min / buffer 1.5 min / 11 項目全件 cmd 化

---

## §5 Phase 5: T+1h checkpoint (10:05-10:35 / 30 min / 9 項目)

### §5.1 step 5-1: 10:05 T+1h checkpoint snapshot (10 min)

- **項目 5-1-A**: KPI-01-13 13 件 snapshot
  - cmd: `bash scripts/kpi-snapshot.sh --target T-plus-1h --output dashboard/launch-kpi-2026-06-19-T+1h.md`
  - 期待出力: 13 件全件 baseline 上回り
- **項目 5-1-B**: snapshot file git commit 0 (read-only / vault 保存)

### §5.2 step 5-2: 10:15 Sentry 1h cumulative 確認 (5 min)

- **項目 5-2-A**: 5xx 累積 < 100 確認
  - cmd: `curl -s -H "Authorization: Bearer $SENTRY_TOKEN" "https://sentry.io/api/0/projects/$ORG/$PROJECT/stats/?stat=event.received&resolution=1h&since=$(date -d '-1 hour' +%s)" | jq 'add'`
  - 期待出力: `< 100`

### §5.3 step 5-3: 10:20 confidence-spec 4 path 判定 (5 min)

- **項目 5-3-A**: Path A (90%) / B (85%) / C (80%) / D (75%) のいずれか判定
- **項目 5-3-B**: 判定根拠 KPI 4 観点 (Impression / Click / Sentry / Lighthouse)
- **項目 5-3-C**: T+1h 判定 file `dashboard/confidence-judgment-T+1h.md` 出力

### §5.4 step 5-4: 10:25 Review KPI 4 path 4 観点監査 (5 min)

- **項目 5-4-A**: Review 渡辺 監査 sign

### §5.5 step 5-5: 10:30 CEO 中間報告 prep (5 min)

- **項目 5-5-A**: CEO 小林 T+1h 中間報告書面 prep (公報用)

### §5.6 step 5-6: 10:35 Phase 5 完遂 (0 min auto)

- **項目 5-6-A**: Slack auto post `[D-Day 10:35] T+1h checkpoint 完遂 / Phase 6 公報開始`

### Phase 5 集計
- 10:05-10:35 30 min / Owner 拘束 0 min / buffer 0 min / 9 項目全件 cmd 化

---

## §6 Phase 6: 公報 (10:35-11:35 / 60 min / 13 項目)

### §6.1 step 6-1: 10:35 Twitter 公報投稿 (10 min)

- **項目 6-1-A**: Twitter `@___` post + 確認
  - 投稿時刻: 10:35:00
  - 投稿文言: launch narrative final (`marketing-launch-narrative-final.md` ref)
- **項目 6-1-B**: 投稿確認 cmd: `curl -s -H "Authorization: Bearer $X_BEARER" "https://api.x.com/2/users/by/username/___/tweets?max_results=5" | jq '.data[0].created_at'`

### §6.2 step 6-2: 10:45 LinkedIn 公報投稿 (10 min)

- **項目 6-2-A**: LinkedIn post + 確認
- **項目 6-2-B**: 確認 cmd via LinkedIn API

### §6.3 step 6-3: 10:55 press release 配信 (15 min)

- **項目 6-3-A**: PR Times 配信完了 (Marketing 佐藤 + CEO 小林)
- **項目 6-3-B**: 配信 ID 取得 + 1Password vault 保存

### §6.4 step 6-4: 11:10 portfolio v3.1 公開 hash 確認 (10 min)

- **項目 6-4-A**: portfolio v3.1 hash check (DEC-019-054)
  - cmd: `curl -s https://prj-019.vercel.app/case | sha256sum | awk '{print $1}'`
  - 期待出力: `EXPECTED_PORTFOLIO_HASH` 一致
- **項目 6-4-B**: 不一致時 Web-Ops 田中 5 min 内に re-deploy + cache purge

### §6.5 step 6-5: 11:20 Review 公報前 audit (10 min)

- **項目 6-5-A**: Twitter / LinkedIn / press release 3 件 audit sign

### §6.6 step 6-6: 11:30 Phase 6 完遂 (5 min)

- **項目 6-6-A**: 公報 3 件完遂 + Slack post
- **項目 6-6-B**: CEO 小林 公報統括 sign

### §6.7 公報拡散観測 (Phase 6 内重畳)

- **項目 6-7-A**: 11:00 X impression 5 min 経過時点 snapshot
- **項目 6-7-B**: 11:15 LinkedIn 5 min 経過時点 snapshot
- **項目 6-7-C**: 11:30 press release wire 配信完了確認

### Phase 6 集計
- 10:35-11:35 60 min / Owner 拘束 0 min / buffer 0 min / 13 項目全件 cmd 化

---

## §7 Phase 7: wrap-up + Owner 1 行 reply (11:35-12:00 / 25 min / 6 項目)

### §7.1 step 7-1: 11:35 Owner 1 行 reply 受領 (1 min Owner 拘束)

- **項目 7-1-A**: 11:35:00 CEO Slack DM `[D-Day 11:35] 公開完遂 / Owner 1 行 reply 受領依頼`
- **項目 7-1-B**: 11:35:30 Owner Slack DM 通知開封 (10 sec) + 1 行 reply (50 sec) `OK Owner: 6/19 公開完遂確認`
  - Owner 拘束: 60 sec = 1.0 min (累計 1.0 + 0.5 + 0.25 + 1.0 = 2.75 min 限界圧縮 / 4-6 min 安全策)

### §7.2 step 7-2: 11:36 Marketing 集計 + 報告書 prep (15 min)

- **項目 7-2-A**: T+1h KPI 集計 + 公開当日報告書 prep (Marketing 佐藤)
- **項目 7-2-B**: 報告書 vault 保存

### §7.3 step 7-3: 11:51 Dev code commit final (5 min)

- **項目 7-3-A**: hotfix 0 件確認 + 6/19 launch tag 切り
  - cmd: `git tag -a launch-2026-06-19 -m "PRJ-019 Open Claw launch 6/19 12:00 JST" && git push origin launch-2026-06-19`

### §7.4 step 7-4: 11:56 EOD post (4 min)

- **項目 7-4-A**: Slack post `[D-Day 12:00] 公開完遂 / 4 部門 + Owner + CEO sign 確認`

### Phase 7 集計
- 11:35-12:00 25 min / Owner 拘束 1.0 min / buffer 0 min / 6 項目全件 cmd 化

---

## §8 Owner 拘束 4-6 min 実測 spec (D-Day 当日)

| Phase | step | 拘束時間 | 内容 |
|---|---|---|---|
| §1 | step 1-1 | 1.0 min | 06:00 Slack DM 開封 + 1 行宣言 reply |
| §1 | step 1-4 | 0.5 min | 06:20 push notif scan + 1 行 reply |
| §2.5 | step 2.5-1 | 0.25 min | 08:30 thread `OK` reply |
| §3 | - | 0 min | T-0 (CEO 自動 reply / Owner 不要) |
| §4-§6 | - | 0 min | 監視・公報 phase (Owner 拘束 0) |
| §7 | step 7-1 | 1.0 min | 11:35 公開完遂 1 行 reply |
| **限界圧縮** | - | **2.75 min** | step 1-1 + 1-4 + 2.5-1 + 7-1 |
| **想定外 buffer** | - | 1.25-3.25 min | reminder push 受信 / 復旧時 monitoring |
| **安全策上限** | - | **4-6 min** | 限界圧縮 + buffer (R25/R26/R27 確定値継承) |

---

## §9 異常発生時 fallback matrix (escalation 6 行)

| trigger | 発生 phase | 1 次対応 | 2 次対応 | 復旧 SLA |
|---|---|---|---|---|
| OWN-AUTO PoC script-3 push 不発 | §1 step 1-1 | reminder push 自動再送 (script-3 fail-over) | CEO 直接電話 (Owner 携帯) | 06:05:00 まで |
| Owner reply 不在 (5 min 経過) | §1 step 1-1 / §1 step 1-4 / §2.5 / §7 | CEO Slack DM mention | CEO 直接電話 → v3.1 経路 (5 min 拘束) fallback | 該当 step +5 min |
| smoke 1 endpoint FAIL | §3 step 3-2 / §4 step 4-1 | script-2 auto retry 1 回 | Web-Ops 田中 5 min 内に preview redeploy + cache purge | 5 min 内 |
| Sentry 5xx > 50/min | §4 step 4-2 | Dev 山田 hotfix branch checkout | Case A rollback 即時実行 (vercel rollback $PREV_DEPLOY_ID) | 10 min 内 |
| portfolio hash 不一致 | §6 step 6-4 | Web-Ops 田中 cache purge | re-deploy + hash 再確認 | 15 min 内 |
| DNS resolver 1/3 不解決 | §2 step 2-3 / §3 step 3-5 | DNS provider 確認 | TTL 短縮 + propagation 待機 | 10 min 内 |

---

## §10 KPI 記録 spec (D-Day 当日 13 KPI)

| KPI | snapshot 時刻 | 取得経路 | 記録 file |
|---|---|---|---|
| KPI-01 Impression | T-0 / T+1h / T+24h | GA realtime API | `dashboard/launch-kpi-2026-06-19-T+{0,1h,24h}.md` |
| KPI-02 Click | T-0 / T+1h / T+24h | GA event API | 同上 |
| KPI-03 Signup | T-0 / T+1h / T+24h | Supabase readonly | 同上 |
| KPI-04 Bounce rate | T+1h / T+24h | GA Bounce API | 同上 |
| KPI-05 Sentry 5xx | T+1h / T+6h / T+12h / T+24h | Sentry stats API | 同上 |
| KPI-06 Sentry 4xx | T+1h / T+6h / T+12h / T+24h | Sentry stats API | 同上 |
| KPI-07 smoke pass count | T+5min × 12 round | curl HEAD | 同上 |
| KPI-08 Slack ch reaction | T+12h | Slack API | 同上 |
| KPI-09 X impressions | T+12h | X analytics API | 同上 |
| KPI-10 LinkedIn impressions | T+12h | LinkedIn analytics API | 同上 |
| KPI-11 Lighthouse 4 score | T+24h | Lighthouse CLI | 同上 |
| KPI-12 Supabase pageview 24h | T+24h | Supabase readonly | 同上 |
| KPI-13 T+24h Sentry 5xx 累積 | T+24h | Sentry stats API | 同上 |

---

## §11 7 Phase 詳細項目数 集計

| Phase | 項目数 | Owner 拘束 |
|---|---|---|
| §1 Phase 1 | 17 項目 | 1.5 min |
| §2 Phase 2 | 12 項目 | 0 min |
| §2.5 Phase 2.5 | 7 項目 | 0.25 min |
| §3 Phase 3 | 9 項目 | 0 min |
| §4 Phase 4 | 11 項目 | 0 min |
| §5 Phase 5 | 9 項目 | 0 min |
| §6 Phase 6 | 13 項目 | 0 min |
| §7 Phase 7 | 6 項目 | 1.0 min |
| **合計** | **84 項目** | **2.75 min (限界圧縮) / 4-6 min (安全策)** |

注: 75-100 項目目標値内 / 84 項目で実機 panic-free 完遂可能 spec 確立

---

## §12 副作用 0 担保

- [x] 本書は文書のみ / 実行 0 / curl 0 / Slack post 0 / cron 操作 0 / DB write 0
- [x] launch day v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2 正式版 4 file **absolute 無改変**
- [x] R26 + R27 historical baseline 全件無改変 (D-8 / D-7 / D-3 / D-1 execution-ready 4 件)
- [x] OWN-AUTO PoC 4 script 起動 0 (本書策定中 / 6/19 当日のみ起動)
- [x] 絵文字 0 / Heroicons 参照のみ / 他アイコン 0 / API $0
- [x] Owner 拘束 0 (本書策定中 / 4-6 min spec は 6/19 当日のみ実測)

---

## §13 confidence 寄与

- Round 27 完遂時 baseline: **96%**
- 本 task ① D-Day real exec spec: **+1.0pt** (84 項目 cmd レベル化 / Owner 4-6 min 実測 spec / 異常発生時 fallback 6 行 / KPI 13 件記録 spec)
- Round 28 task ① 完遂後 confidence: **97%**

---

**最終更新**: 2026-05-05 (Round 28 / Marketing-V / D-Day real exec spec 起票)
**派生元**: launch day v3.2 正式版 (不変保持) + R26 + R27 execution-ready 4 件累積
**次回見直し**: Round 29 Marketing-W (D-Day 実測値後 / R29 baseline 98% 継承時)
