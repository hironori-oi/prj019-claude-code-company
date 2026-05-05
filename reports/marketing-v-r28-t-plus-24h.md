# Marketing-V R28 task ② T+24h 公開後 24 時間 Timeline (4 Phase 1440 min / 13 KPI 監視 / 異常検知 trigger / Owner 拘束 0-1 min)

## 0. 概要

- **対象**: PRJ-019 Open Claw / COMPANY-WEBSITE 公開後 **2026-06-19 12:00 JST 〜 2026-06-20 12:00 JST 24h timeline real spec**
- **本書 role**: Round 28 Marketing-V task ② / D-Day 公開後 24h を 4 Phase に分割 / 13 KPI trajectory 監視 / 異常検知 trigger 自動化 / Owner 拘束 0-1 min spec
- **派生元**:
  - launch day T+24h timeline (`projects/COMPANY-WEBSITE/marketing/launch-day-t-plus-24h-timeline-2026-06-19.md` / 不変保持 / 本書はその実機実行 spec 化)
  - launch day v3.2 正式版 §11-§12 T+24h 引継 (不変保持)
  - Marketing-T R26 D-8 + D-7 execution-ready / Marketing-U R27 D-3 + D-1 execution-ready (cmd 化基盤)
- **本書出力時期**: Round 28 / 2026-05-05 / 6/19 公開 45 日前
- **副作用**: 0 (本書は文書のみ / API $0 / 絵文字 0 / Heroicons のみ)
- **項目総数**: **44 項目** (4 Phase × 11 項目平均 / §1: 13 / §2: 11 / §3: 10 / §4: 10)
- **Owner 拘束**: **0-1 min** (T+1h: 0 min / T+6h: 0 min / T+12h: 0-1 min 異常検知時のみ / T+24h: 1 min Owner final reply)
- **関連 DEC**: DEC-019-025 / DEC-019-033 / DEC-019-054 / DEC-019-062 / DEC-018-047

---

## §1 T+1h post-launch checkpoint (12:00-13:00 6/19 JST / 60 min / 13 項目)

### §1.1 Phase 1 goal

- D-Day v3.2 正式版 §6 step 6-4 (T+1h KPI 初期 snapshot) を継承し T+1h 時点で即時 4 KPI snapshot
- T+1h 時点 baseline 投入 (T+6h / T+12h / T+24h trajectory 比較用)
- Owner 拘束 0 min 維持 (script-2/3 自動化)

### §1.2 step 1-1: 12:00 Marketing KPI 1-4 即時 snapshot (15 min)

- **項目 1-1-A**: 12:00:00 OWN-AUTO PoC script-2 が GA realtime API で KPI-01 Impression 取得
  - cmd: `curl -s -H "Authorization: Bearer $GA_TOKEN" "https://analyticsdata.googleapis.com/v1beta/properties/$GA_PROPERTY:runRealtimeReport" -d '{"metrics":[{"name":"screenPageViews"}]}'`
  - 期待出力: `> 0` (T-0 baseline 上回り)
- **項目 1-1-B**: 12:05:00 KPI-02 Click 取得 (GA event API / `select_content` event count)
- **項目 1-1-C**: 12:08:00 KPI-03 Signup (Supabase readonly `contact_request` count)
  - cmd: `curl -s -H "Authorization: Bearer $SUPABASE_ANON_KEY" "https://$SUPABASE_PROJECT.supabase.co/rest/v1/contact_request?select=count" | jq '.[0].count'`
- **項目 1-1-D**: 12:12:00 KPI-04 Bounce rate snapshot (GA Bounce API)
- **項目 1-1-E**: 12:15:00 4 KPI 全件 snapshot file 出力
  - file: `dashboard/launch-kpi-2026-06-19-T+1h.md`
  - script-3 が Slack auto post `[T+1h 12:15] 4 KPI snapshot 完遂 / Impression $X / Click $Y / Signup $Z / Bounce $W`

### §1.3 step 1-2: 12:15 Sentry T+1h snapshot (10 min)

- **項目 1-2-A**: 12:15:00 KPI-05 Sentry 5xx 1h window snapshot
  - cmd: `curl -s -H "Authorization: Bearer $SENTRY_TOKEN" "https://sentry.io/api/0/projects/$ORG/$PROJECT/stats/?stat=event.received&resolution=1h&since=$(date -d '12:00 today' +%s)" | jq 'add'`
  - 期待出力: `0` (baseline 維持) / 警告 `> 5` / NoGO `> 50`
- **項目 1-2-B**: 12:20:00 KPI-06 Sentry 4xx 1h window snapshot

### §1.4 step 1-3: 12:25 smoke 12 回 連続 GREEN 確認 (15 min)

- **項目 1-3-A**: 12:25:00 KPI-07 smoke 8 endpoint pass count (T-0 〜 T+1h 12 round 集計)
  - 検証 cmd: `tail /var/log/own-auto-poc/script-2.log | grep "smoke 8/8 GREEN" | wc -l`
  - 期待出力: `12` (T-0 〜 T+1h で 12 round 全件 GREEN)
- **項目 1-3-B**: 12:35:00 7/8 以下なら Slack auto alert + Web-Ops 田中 5 min 内に手動再確認

### §1.5 step 1-4: 12:40 confidence-spec T+1h 判定 (10 min)

- **項目 1-4-A**: Path A (90%) / B (85%) / C (80%) / D (75%) のいずれか判定
  - 判定根拠 KPI 4 観点 (Impression / Click / Sentry / smoke)
- **項目 1-4-B**: 12:50:00 判定 file `dashboard/confidence-judgment-T+1h.md` 出力 (Owner 報告対象外 / Owner 拘束 0 min)

### §1.6 step 1-5: 12:55 Phase 1 完遂 (5 min)

- **項目 1-5-A**: Slack auto post `[T+1h 12:55] Phase 1 完遂 / 7 KPI snapshot 完遂 / Phase 2 監視継続`
- **項目 1-5-B**: Owner 拘束: 0 min (異常時のみ CEO 経由 Slack DM mention)

### Phase 1 集計
- 12:00-13:00 60 min / Owner 拘束 0 min / 13 項目全件 cmd 化 / 7 KPI snapshot 完遂

---

## §2 T+6h afternoon monitoring (13:00-18:00 6/19 JST / 300 min / 11 項目)

### §2.1 Phase 2 goal

- 公報拡散観測 (X / LinkedIn / press release wire)
- smoke 維持確認 (5 min interval × 60 round = 300 min)
- Sentry 4xx/5xx 累積 monitoring + KPI-08 Slack reaction snapshot

### §2.2 step 2-1: 13:00-18:00 smoke 60 round 自動監視 (300 min)

- **項目 2-1-A**: script-2 が 5 min interval で smoke 8 endpoint HEAD curl 自動実行
- **項目 2-1-B**: 60 round 連続 GREEN 期待 (累積 KPI-07 = 8 × 60 = 480 pass)
- **項目 2-1-C**: 1 round でも FAIL → script-2 auto alert + Web-Ops on-call 田中 5 min 内に手動再確認

### §2.3 step 2-2: 14:00 / 16:00 / 18:00 Sentry 累積 snapshot (3 round)

- **項目 2-2-A**: 14:00 Sentry 5xx + 4xx 2h window snapshot
- **項目 2-2-B**: 16:00 Sentry 5xx + 4xx 4h window snapshot
- **項目 2-2-C**: 18:00 Sentry 5xx + 4xx 6h window snapshot
  - 期待出力: 5xx 累積 < 30 / 4xx 累積 < 300 (warning thresholds)

### §2.4 step 2-3: 14:00 公報拡散観測 第 1 弾 (10 min)

- **項目 2-3-A**: X impression 3h post snapshot (KPI-09 中間)
  - cmd: `curl -s -H "Authorization: Bearer $X_BEARER" "https://api.x.com/2/users/by/username/___/tweets?max_results=5" | jq '[.data[] | .public_metrics.impression_count] | add'`
  - 期待出力: `> 300` (3h post baseline)
- **項目 2-3-B**: LinkedIn impression 3h post snapshot (KPI-10 中間)

### §2.5 step 2-4: 17:00 公報拡散観測 第 2 弾 (10 min)

- **項目 2-4-A**: X impression 6h post snapshot
  - 期待出力: `> 600` (6h post baseline)
- **項目 2-4-B**: LinkedIn 6h post snapshot

### §2.6 step 2-5: 18:00 Phase 2 完遂 (5 min)

- **項目 2-5-A**: Slack auto post `[T+6h 18:00] Phase 2 完遂 / smoke 60/60 GREEN / KPI 1-7 累積 7 件 + KPI 9-10 中間 snapshot`
- **項目 2-5-B**: Owner 拘束: 0 min (script-3 auto post / Owner Slack DM mention 0)

### Phase 2 集計
- 13:00-18:00 300 min / Owner 拘束 0 min / 11 項目全件 cmd 化 / KPI 1-7 累積 + KPI 9-10 中間 snapshot

---

## §3 T+12h evening + overnight prep (18:00 6/19 - 00:00 6/20 JST / 360 min / 10 項目)

### §3.1 Phase 3 goal

- 夜間 cron 5 本観測 (heartbeat 6 min interval × 60 = 360 round)
- Owner 早期就寝判断 (拘束 0-1 min 想定 / 異常時のみ Slack DM mention)
- KPI-08 Slack ch reaction snapshot + KPI-09/10 12h post snapshot

### §3.2 step 3-1: 18:00-22:00 smoke 48 round 自動監視 (240 min)

- **項目 3-1-A**: script-2 5 min interval × 48 round (240 min)
- **項目 3-1-B**: 48 round 連続 GREEN 期待 (累積 KPI-07 = 8 × (60 + 48) = 864 pass)

### §3.3 step 3-2: 21:00 KPI-08 Slack ch reaction snapshot (15 min)

- **項目 3-2-A**: Slack `#prj-019-launch` ch 公報 8 post 各 reaction count
  - cmd: `for ts in $POST_TS_LIST; do curl -s -H "Authorization: Bearer $SLACK_BOT_TOKEN" "https://slack.com/api/reactions.get?channel=$CH_ID&timestamp=$ts" | jq '[.message.reactions[].count] | add'; done`
  - 期待出力: 8 post 各 `> 5` reaction (baseline)
- **項目 3-2-B**: 警告: `< 2/post` → Marketing 佐藤 翌日 follow-up post prep

### §3.4 step 3-3: 22:00 KPI-09/10 12h post snapshot (15 min)

- **項目 3-3-A**: X impression 12h post snapshot (KPI-09 確定)
  - 期待出力: `> 1000` (T+12h baseline)
- **項目 3-3-B**: LinkedIn 12h post snapshot (KPI-10 確定)
  - 期待出力: `> 500` (T+12h baseline)

### §3.5 step 3-4: 22:30 Owner 早期就寝判断 (Owner 拘束 0-1 min 異常検知時のみ)

- **項目 3-4-A**: 22:30:00 OWN-AUTO PoC script-3 が Owner Slack DM `[T+12h 22:30] 12h 全件 GREEN / 早期就寝可 / 異常時のみ on-call CEO 連絡`
  - Owner action: 通知開封 (10 sec) のみ / reply 不要 (0 min Owner 拘束 / GREEN 時)
- **項目 3-4-B (異常時)**: Sentry 5xx > 100 / smoke 1/8 FAIL 連続 3 round 等の異常検知時 → Owner Slack DM mention `[T+12h 異常検知] $type / on-call 起動可否 1 行 reply 依頼`
  - Owner reply 1 行 (60 sec): `OK on-call 起動` または `OK 監視継続` (Owner 拘束: 1 min / 異常時のみ)

### §3.6 step 3-5: 23:00 cron 5 本 heartbeat 11h GREEN 確認 (15 min)

- **項目 3-5-A**: cron 5 本 11h GREEN 確認
  - cmd: `for f in cron-1 cron-2 cron-3 cron-4 cron-5; do curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v1/projects/$PROJECT/cron-jobs/$f/runs?limit=132" | jq '[.runs[] | select(.status == "succeeded")] | length'; done`
  - 期待出力: 5 行全件 `132` (5 min interval × 11h)

### §3.7 step 3-6: 00:00 6/20 Phase 3 完遂 (5 min)

- **項目 3-6-A**: Slack auto post `[T+12h 00:00 6/20] Phase 3 完遂 / KPI 1-10 累積 10 件 / smoke 108/108 GREEN`
- **項目 3-6-B**: 自動 on-call 引継 (Web-Ops 鈴木 副担当者 / Dev on-call)

### Phase 3 集計
- 18:00 6/19 - 00:00 6/20 360 min / Owner 拘束 0-1 min (異常時のみ) / 10 項目全件 cmd 化 / KPI 1-10 累積

---

## §4 T+24h overnight + morning final (00:00-12:00 6/20 JST / 720 min / 10 項目)

### §4.1 Phase 4 goal

- 深夜 cron 観測 (00:00-06:00 / Web-Ops 鈴木 + Dev on-call)
- T+24h Owner 1 行 final reply 受領 (Owner 拘束 1 min)
- 30day baseline 投入準備 (KPI-11 Lighthouse / KPI-12 pageview / KPI-13 Sentry 累積)

### §4.2 step 4-1: 00:00-06:00 深夜 smoke 72 round 自動監視 (360 min)

- **項目 4-1-A**: script-2 5 min interval × 72 round (360 min)
- **項目 4-1-B**: 72 round 連続 GREEN 期待 (累積 KPI-07 = 8 × (60 + 48 + 72) = 1440 pass)

### §4.3 step 4-2: 06:00 6/20 朝 Sentry 18h cumulative snapshot (15 min)

- **項目 4-2-A**: Sentry 5xx + 4xx 18h window snapshot
  - 期待出力: 5xx 累積 < 60 / 4xx 累積 < 600 (T+18h baseline)

### §4.4 step 4-3: 09:00 Lighthouse 4 score 再計測 (KPI-11 / 30 min)

- **項目 4-3-A**: Lighthouse CLI 実行 (Performance / Accessibility / Best Practices / SEO)
  - cmd: `lighthouse https://prj-019.vercel.app --output json --output-path dashboard/lighthouse-T+24h.json --chrome-flags="--headless"`
  - 期待出力: 4 score 全件 `>= 90`
- **項目 4-3-B**: 警告: 1 score `< 90` → Dev 山田 翌日 hotfix 検討

### §4.5 step 4-4: 09:30 Supabase pageview_event 24h 累積 (KPI-12 / 15 min)

- **項目 4-4-A**: Supabase readonly query
  - cmd: `curl -s -H "Authorization: Bearer $SUPABASE_ANON_KEY" "https://$SUPABASE_PROJECT.supabase.co/rest/v1/pageview_event?select=count&created_at=gte.2026-06-19T09:00:00Z" | jq '.[0].count'`
  - 期待出力: `> 100` (T+24h baseline) / 警告 `< 100`

### §4.6 step 4-5: 09:45 T+24h Sentry 5xx 累積 確定 (KPI-13 / 15 min)

- **項目 4-5-A**: Sentry 5xx 24h cumulative snapshot
  - 期待出力: `0` (baseline 維持) / 警告 `> 10` / NoGO `> 100`

### §4.7 step 4-6: 10:00 13 KPI 全件 snapshot file 出力 + Marketing 報告書 prep (60 min)

- **項目 4-6-A**: `dashboard/launch-kpi-2026-06-19-T+24h.md` 13 件全件 snapshot
- **項目 4-6-B**: T+24h 公開後 24h 報告書 `marketing-launch-day-2026-06-19-t+24h-report.md` prep
- **項目 4-6-C**: 7/19 30day baseline 投入準備 (T+30day → 7/19 比較用 baseline)

### §4.8 step 4-7: 11:00 CEO T+24h 報告書 sign + Owner 1 行 reply 受領 (Owner 拘束 1 min)

- **項目 4-7-A**: 11:00:00 CEO 小林 報告書 sign
- **項目 4-7-B**: 11:55:00 CEO Slack DM `[T+24h 12:00] 24h 完遂 / 13 KPI 全件 GREEN / Owner 1 行 final reply 依頼`
- **項目 4-7-C**: 11:55:30 Owner 通知開封 (10 sec) + 1 行 reply (50 sec) `OK Owner: 6/19-6/20 24h 完遂確認`
  - Owner 拘束: 60 sec = 1 min (T+24h Owner final reply / 累積 4-6 min D-Day + 1 min T+24h = 5-7 min 24h 内合計)

### §4.9 step 4-8: 12:00 Phase 4 完遂 + EOD post (5 min)

- **項目 4-8-A**: Slack auto post `[T+24h 12:00 6/20] Phase 4 完遂 / 13 KPI 全件 GREEN / 24h 公開維持`
- **項目 4-8-B**: 7/19 30day baseline 投入準備完遂

### Phase 4 集計
- 00:00-12:00 6/20 720 min / Owner 拘束 1 min (T+24h final reply) / 10 項目全件 cmd 化 / 13 KPI 全件確定

---

## §5 異常検知 trigger matrix (T+24h 内 6 trigger)

| trigger | 発生 phase | 検知 cmd | 1 次対応 | 2 次対応 | Owner 通知 trigger |
|---|---|---|---|---|---|
| Sentry 5xx > 50/h | §1 / §2 / §3 / §4 | Sentry stats API alert | Dev on-call hotfix prep | Case A rollback 即時実行 | > 100/h で Owner mention |
| smoke 1/8 FAIL 連続 3 round | §2 / §3 / §4 | script-2 auto alert | Web-Ops on-call 5 min 内手動再確認 | preview redeploy + cache purge | 連続 6 round で Owner mention |
| KPI-01 Impression 警告 < 100 (T+1h) | §1 step 1-1 | GA realtime API | Marketing 佐藤 公報追加 prep | follow-up post 即時投稿 | T+1h judgment Path D 時のみ |
| portfolio hash 不一致 | §1 / §2 | curl + sha256 | Web-Ops cache purge | re-deploy + hash 再確認 | 復旧 SLA 30 min 超過時のみ |
| DNS 1/3 resolver 不解決 | §2 / §3 | dig 3 resolver | DNS provider 確認 | TTL 短縮 + propagation 待機 | 復旧 SLA 1h 超過時のみ |
| cron 5 本 1 本 FAIL 連続 3 round | §3 / §4 | Vercel cron API | Dev on-call 5 min 内手動再起動 | Vercel re-create cron | 連続 6 round で Owner mention |

---

## §6 Owner 拘束 0-1 min spec 整合 (T+24h 内)

| Phase | 拘束時間 | 内容 |
|---|---|---|
| §1 T+1h | 0 min | KPI snapshot 自動 / Owner 通知 0 |
| §2 T+6h | 0 min | smoke 60 round 自動 / Owner 通知 0 |
| §3 T+12h | 0-1 min | GREEN 時 0 / 異常検知時 1 行 reply (1 min) |
| §4 T+24h | 1 min | T+24h final 1 行 reply (Owner 公開完遂確認) |
| **24h 内合計** | **1-2 min** | T+24h 1 min + 異常時 0-1 min |

D-Day (6/19 06:00-12:00) 4-6 min + T+24h 0-1 min (異常時) + T+24h final 1 min = **5-8 min 累計** (24h 内全 Owner 拘束)

---

## §7 13 KPI snapshot 一覧 + 取得経路

| KPI | 取得 phase | 取得経路 | baseline / 警告 / NoGO |
|---|---|---|---|
| KPI-01 Impression | §1 T+1h / §4 T+24h | GA realtime API | > 0 / < 100 / < 10 |
| KPI-02 Click | §1 T+1h / §4 T+24h | GA event API | > 0 / < 5 / - |
| KPI-03 Signup | §1 T+1h / §4 T+24h | Supabase readonly | >= 0 / 0 (T+24h) / - |
| KPI-04 Bounce rate | §1 T+1h / §4 T+24h | GA Bounce API | 30-60% / > 80% / > 95% |
| KPI-05 Sentry 5xx | §2 T+6h / §3 T+12h / §4 T+24h | Sentry stats API | 0 / > 5/h / > 50/h |
| KPI-06 Sentry 4xx | §2 T+6h / §3 T+12h / §4 T+24h | Sentry stats API | < 50/h / > 100/h / - |
| KPI-07 smoke pass count | §1-§4 全 phase 連続 | curl HEAD | 8/8 / 7/8 / < 6/8 |
| KPI-08 Slack reaction | §3 T+12h | Slack API | > 5/post / < 2/post / - |
| KPI-09 X impressions | §3 T+12h | X analytics | > 1000 / < 200 / - |
| KPI-10 LinkedIn impressions | §3 T+12h | LinkedIn analytics | > 500 / < 100 / - |
| KPI-11 Lighthouse 4 score | §4 T+24h | Lighthouse CLI | >= 90 / 1 score < 90 / - |
| KPI-12 Supabase pageview 24h | §4 T+24h | Supabase readonly | > 0 / < 100 / - |
| KPI-13 T+24h Sentry 5xx 累積 | §4 T+24h | Sentry stats API | 0 / > 10 / > 100 |

---

## §8 副作用 0 担保

- [x] 本書は文書のみ / 実行 0 / curl 0 / Slack post 0 / cron 操作 0 / DB write 0
- [x] launch day v3.x 4 file **absolute 無改変**
- [x] T+24h timeline original (`launch-day-t-plus-24h-timeline-2026-06-19.md`) **absolute 無改変** (本書は実機 spec 化 / original baseline 並行 reference)
- [x] R26 + R27 historical baseline 全件無改変
- [x] OWN-AUTO PoC 4 script 起動 0 (本書策定中 / 6/19-6/20 当日のみ起動)
- [x] 絵文字 0 / Heroicons 参照のみ / API $0
- [x] Owner 拘束 0 (本書策定中 / 0-1 min spec は 6/19-6/20 当日のみ実測)

---

## §9 confidence 寄与

- Round 28 task ① 完遂時 baseline: **97%**
- 本 task ② T+24h timeline real spec: **+0.5pt** (44 項目 cmd レベル化 / 13 KPI 監視 / 異常検知 6 trigger / Owner 拘束 0-1 min spec 確定)
- Round 28 task ② 完遂後 confidence: **97.5%**

---

## §10 関連 DEC / KPI

- DEC-019-025: background dispatch SOP (本書 4 file まとめて 1 件カウント)
- DEC-019-033: knowledge 抽出経路 (本書を `organization/knowledge/patterns/launch-day-t-plus-24h-timeline.md` 候補化)
- DEC-019-054: portfolio v3.1 hash check (異常検知 trigger §5 第 4 行 portfolio hash 不変)
- DEC-019-062: cron 5 本 + CRON_SECRET (§3 step 3-5 / §4 step 4-1 不変)
- DEC-018-047: PRJ-018 hotfix rollback ベストプラクティス継承 (異常検知 §5 第 1 行 Sentry 5xx Case A rollback 不変)

---

**最終更新**: 2026-05-05 (Round 28 / Marketing-V / T+24h timeline real spec 起票)
**派生元**: launch day T+24h timeline (不変保持) + R26 + R27 execution-ready 4 件累積
**次回見直し**: Round 29 Marketing-W (T+24h 実測値後 / R29 baseline 98% 継承時)
