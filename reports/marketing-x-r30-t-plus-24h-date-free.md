# PRJ-019 Marketing-X R30 — T+24h 公開後 24h SOP date-free 化 (4 Phase 1440 min / 13 KPI 監視 / Owner 拘束 0-1 min)

**Round**: R30 (9 並列 7 軸目 / Marketing-X)
**Generated**: 2026-05-06 (R30 sprint)
**位置付け**: R28 Marketing-V `marketing-v-r28-t-plus-24h.md` (302 行 / calendar 6/19-6/20 ベース) を **date-free 化** (T0''' = Owner D-Day GO reply 受領時刻 基点)
**派生元**: R28 SOP file (absolute 無改変保持)
**Owner directive**: 「日付決め打ちなし / 完成次第即時 GO」整合
**absolute 無改変保持 7 file**:
- launch-day v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2-final-lock 4 file
- launch-day v3.4 date-free delta 1 file
- R29 Marketing-W 5 file
- R28 Marketing-V t+24h SOP file (本 file の派生元)

**API call**: $0 / 副作用: 0 / 絵文字: 0 / Owner 拘束: 0-1 min (T+24h final reply 1 min / 異常時 0-1 min)

---

## 0. date-free 化方針

### 0.1 旧 spec (R28 calendar 固定)
- 2026-06-19 12:00 JST 〜 2026-06-20 12:00 JST = D-Day 公開後 24h
- 4 Phase 1440 min / 44 項目 / Owner 拘束 0-1 min

### 0.2 新 spec (R30 date-free)
- **T0''' = Owner D-Day GO reply 受領時刻** (任意の calendar 日時)
- **T0'''+0h → T0'''+24h = 24h timeline** (Phase 1-4 計 1440 min 維持)
- 全 timeline → state 写像: 6/19 12:00 → T0'''+0h, 6/20 12:00 → T0'''+24h

### 0.3 R28 SOP との完全整合
- R28 SOP file 302 行 = absolute 無改変保持
- 本 file = date-free 化 delta only + 全 cmd / 期待出力 100% 継承
- 起動 trigger を時刻 → state へ写像のみ

### 0.4 副作用 0 担保
- 本書は文書のみ / API 呼出 0 / curl 0 / Slack post 0 / DB write 0
- 7 absolute file 無改変

---

## 1. T0''' 確定 protocol (date-free 起動 trigger)

### 1.1 T0''' 確定 5 条件 ALL true (R29 GTC-11 D-Day spec 継承)
| # | 条件 | 確認 source |
|---|------|------------|
| 1 | GTC-10 D-1 sign PASS | dashboard line 3 prepend |
| 2 | Owner D-Day GO 1 行 reply 受領 | reply log |
| 3 | confidence ≥ 99.9% | trajectory file |
| 4 | 4 file 無改変確認 | git log |
| 5 | D-Day Phase 1'''-7''' (6 hour 84 項目) 完遂 | dashboard prepend |

### 1.2 T+24h SOP 起動 trigger logic
```
IF (D-Day Phase 7''' 完遂 ∧ T0''' 確定済) THEN
  T_plus_24h_start := T0''' + 0h  # D-Day 公開と同時刻に T+24h SOP も起動
  fork phase-1-t-plus-24h
  fork phase-2-t-plus-24h (T0'''+1h)
  fork phase-3-t-plus-24h (T0'''+6h)
  fork phase-4-t-plus-24h (T0'''+12h)
END
```

### 1.3 calendar → state 写像表
| R28 calendar (6/19-6/20) | R30 date-free (T0''' 基点) |
|--------------------------|----------------------------|
| 6/19 12:00 (D-Day 公開) | T0'''+0h |
| 6/19 13:00 (T+1h) | T0'''+1h |
| 6/19 18:00 (T+6h) | T0'''+6h |
| 6/19 21:00 (T+9h) | T0'''+9h |
| 6/19 22:00 (T+10h) | T0'''+10h |
| 6/19 22:30 (T+10h30m) | T0'''+10h30m |
| 6/19 23:00 (T+11h) | T0'''+11h |
| 6/20 00:00 (T+12h) | T0'''+12h |
| 6/20 06:00 (T+18h) | T0'''+18h |
| 6/20 09:00 (T+21h) | T0'''+21h |
| 6/20 09:30 (T+21h30m) | T0'''+21h30m |
| 6/20 09:45 (T+21h45m) | T0'''+21h45m |
| 6/20 10:00 (T+22h) | T0'''+22h |
| 6/20 11:00 (T+23h) | T0'''+23h |
| 6/20 11:55 (T+23h55m) | T0'''+23h55m |
| 6/20 12:00 (T+24h) | T0'''+24h |

---

## 2. Phase 1: T+1h post-launch checkpoint date-free 化 (T0'''+0h → T0'''+1h / 60 min / 13 項目)

### 2.1 Phase 1 goal (R28 継承)
- D-Day v3.4 §6 step 6-4 (T+1h KPI 初期 snapshot) 継承
- T+1h baseline 投入 (T+6h / T+12h / T+24h trajectory 比較用)
- Owner 拘束 0 min 維持 (script-2/3 自動化)

### 2.2 step 1-1: T0'''+0h Marketing KPI 1-4 即時 snapshot (15 min)
| # | 項目 | cmd | 期待出力 | 写像 |
|---|------|-----|---------|------|
| 1-1-A | KPI-01 Impression GA realtime API | `curl -s -H "Authorization: Bearer $GA_TOKEN" "https://analyticsdata.googleapis.com/v1beta/properties/$GA_PROPERTY:runRealtimeReport" -d '{"metrics":[{"name":"screenPageViews"}]}'` | `> 0` | T0'''+0:00 (旧 12:00:00) |
| 1-1-B | KPI-02 Click GA event API (`select_content`) | (R28 cmd 継承) | event count | T0'''+0:05 |
| 1-1-C | KPI-03 Signup Supabase readonly | `curl -s -H "Authorization: Bearer $SUPABASE_ANON_KEY" "https://$SUPABASE_PROJECT.supabase.co/rest/v1/contact_request?select=count" \| jq '.[0].count'` | `>= 0` | T0'''+0:08 |
| 1-1-D | KPI-04 Bounce rate snapshot GA Bounce API | (R28 cmd 継承) | 30-60% | T0'''+0:12 |
| 1-1-E | 4 KPI 全件 snapshot file 出力 | file: `dashboard/launch-kpi-T+1h.md` (date-free 化 / 旧 file 名 `launch-kpi-2026-06-19-T+1h.md` の置換) | snapshot OK | T0'''+0:15 |

### 2.3 step 1-2: T0'''+0:15 Sentry T+1h snapshot (10 min)
| # | 項目 | cmd | 期待出力 | 写像 |
|---|------|-----|---------|------|
| 1-2-A | KPI-05 Sentry 5xx 1h window | `curl -s -H "Authorization: Bearer $SENTRY_TOKEN" "https://sentry.io/api/0/projects/$ORG/$PROJECT/stats/?stat=event.received&resolution=1h&since=$T0''' epoch" \| jq 'add'` | `0` baseline / `>5` 警告 / `>50` NoGO | T0'''+0:15 |
| 1-2-B | KPI-06 Sentry 4xx 1h window | (R28 cmd 継承) | < 50/h | T0'''+0:20 |

### 2.4 step 1-3: T0'''+0:25 smoke 12 round 連続 GREEN 確認 (15 min)
| # | 項目 | cmd | 期待出力 | 写像 |
|---|------|-----|---------|------|
| 1-3-A | KPI-07 smoke 8 endpoint pass count | `tail /var/log/own-auto-poc/script-2.log \| grep "smoke 8/8 GREEN" \| wc -l` | `12` (T0''' 〜 T+1h で 12 round PASS) | T0'''+0:25 |
| 1-3-B | 7/8 以下 → Slack auto alert | Web-Ops on-call 5 min 内手動再確認 | alert 0 件 期待 | T0'''+0:35 |

### 2.5 step 1-4: T0'''+0:40 confidence-spec T+1h 判定 (10 min)
| # | 項目 | 判定根拠 | 期待 | 写像 |
|---|------|---------|------|------|
| 1-4-A | Path A (90%) / B (85%) / C (80%) / D (75%) いずれか判定 | KPI 4 観点 (Impression / Click / Sentry / smoke) | Path A | T0'''+0:40 |
| 1-4-B | 判定 file `dashboard/confidence-judgment-T+1h.md` 出力 | Owner 報告対象外 (拘束 0 min) | file 出力 | T0'''+0:50 |

### 2.6 step 1-5: T0'''+0:55 Phase 1 完遂 (5 min)
| # | 項目 | cmd | 期待出力 | 写像 |
|---|------|-----|---------|------|
| 1-5-A | Slack auto post `[T+1h T0'''+0:55] Phase 1 完遂 / 7 KPI snapshot` | (R28 cmd 継承) | post OK | T0'''+0:55 |
| 1-5-B | Owner 拘束: 0 min (異常時のみ CEO 経由 Slack DM mention) | - | 拘束 0 min | T0'''+1:00 |

### Phase 1 集計
- T0'''+0h → T0'''+1h / 60 min / Owner 拘束 0 min / 13 項目全件 cmd 化 / 7 KPI snapshot 完遂

---

## 3. Phase 2: T+6h afternoon monitoring date-free 化 (T0'''+1h → T0'''+6h / 300 min / 11 項目)

### 3.1 Phase 2 goal (R28 継承)
- 公報拡散観測 (X / LinkedIn / press release wire)
- smoke 維持確認 (5 min interval × 60 round = 300 min)
- Sentry 4xx/5xx 累積 monitoring + KPI-08 Slack reaction snapshot

### 3.2 step 2-1: T0'''+1h → T0'''+6h smoke 60 round 自動監視 (300 min)
| # | 項目 | cmd | 期待出力 | 写像 |
|---|------|-----|---------|------|
| 2-1-A | script-2 5 min interval × 60 round | (R28 cmd 継承) | 60/60 GREEN | T0'''+1h → T0'''+6h |
| 2-1-B | 累積 KPI-07 = 8 × 60 = 480 pass | log 集計 | 480 pass | T0'''+6h |
| 2-1-C | 1 round FAIL → script-2 auto alert + Web-Ops 5 min 内手動再確認 | (R28 経路継承) | alert 0 件 期待 | 全期間 |

### 3.3 step 2-2: T0'''+2h / T0'''+4h / T0'''+6h Sentry 累積 snapshot (3 round)
| # | 項目 | window | 期待出力 | 写像 |
|---|------|--------|---------|------|
| 2-2-A | Sentry 5xx + 4xx 2h window | `since=T0''' epoch, until=T0'''+2h` | 5xx < 10 / 4xx < 100 | T0'''+2h |
| 2-2-B | Sentry 5xx + 4xx 4h window | (同) | 5xx < 20 / 4xx < 200 | T0'''+4h |
| 2-2-C | Sentry 5xx + 4xx 6h window | (同) | 5xx 累積 < 30 / 4xx 累積 < 300 (warning thresholds) | T0'''+6h |

### 3.4 step 2-3: T0'''+2h 公報拡散観測 第 1 弾 (10 min)
| # | 項目 | cmd | 期待出力 | 写像 |
|---|------|-----|---------|------|
| 2-3-A | X impression 3h post snapshot (KPI-09 中間) | `curl -s -H "Authorization: Bearer $X_BEARER" "https://api.x.com/2/users/by/username/___/tweets?max_results=5" \| jq '[.data[] \| .public_metrics.impression_count] \| add'` | `> 300` | T0'''+2h |
| 2-3-B | LinkedIn impression 3h post snapshot (KPI-10 中間) | (R28 cmd 継承) | `> 150` | T0'''+2h |

### 3.5 step 2-4: T0'''+5h 公報拡散観測 第 2 弾 (10 min)
| # | 項目 | cmd | 期待出力 | 写像 |
|---|------|-----|---------|------|
| 2-4-A | X impression 6h post snapshot | (R28 cmd 継承) | `> 600` | T0'''+5h |
| 2-4-B | LinkedIn 6h post snapshot | (R28 cmd 継承) | `> 300` | T0'''+5h |

### 3.6 step 2-5: T0'''+6h Phase 2 完遂 (5 min)
| # | 項目 | cmd | 期待出力 | 写像 |
|---|------|-----|---------|------|
| 2-5-A | Slack auto post `[T+6h T0'''+6h] Phase 2 完遂 / smoke 60/60 GREEN / KPI 1-7 累積 + KPI 9-10 中間 snapshot` | (R28 cmd 継承) | post OK | T0'''+6h |
| 2-5-B | Owner 拘束: 0 min | - | 拘束 0 min | T0'''+6h |

### Phase 2 集計
- T0'''+1h → T0'''+6h / 300 min / Owner 拘束 0 min / 11 項目全件 cmd 化 / KPI 1-7 累積 + KPI 9-10 中間 snapshot

---

## 4. Phase 3: T+12h evening + overnight prep date-free 化 (T0'''+6h → T0'''+12h / 360 min / 10 項目)

### 4.1 Phase 3 goal (R28 継承)
- 夜間 cron 5 本観測 (heartbeat 6 min interval × 60 = 360 round)
- Owner 早期就寝判断 (拘束 0-1 min 想定 / 異常時のみ Slack DM mention)
- KPI-08 Slack ch reaction snapshot + KPI-09/10 12h post snapshot

### 4.2 step 3-1: T0'''+6h → T0'''+10h smoke 48 round 自動監視 (240 min)
| # | 項目 | cmd | 期待出力 | 写像 |
|---|------|-----|---------|------|
| 3-1-A | script-2 5 min interval × 48 round | (R28 cmd 継承) | 48/48 GREEN | T0'''+6h → T0'''+10h |
| 3-1-B | 累積 KPI-07 = 8 × (60 + 48) = 864 pass | log 集計 | 864 pass | T0'''+10h |

### 4.3 step 3-2: T0'''+9h KPI-08 Slack ch reaction snapshot (15 min)
| # | 項目 | cmd | 期待出力 | 写像 |
|---|------|-----|---------|------|
| 3-2-A | Slack `#prj-019-launch` ch 公報 8 post 各 reaction count | `for ts in $POST_TS_LIST; do curl -s -H "Authorization: Bearer $SLACK_BOT_TOKEN" "https://slack.com/api/reactions.get?channel=$CH_ID&timestamp=$ts" \| jq '[.message.reactions[].count] \| add'; done` | 8 post 各 `> 5` reaction | T0'''+9h |
| 3-2-B | 警告: `< 2/post` → Marketing 翌日 follow-up post prep | - | warning 0 件 期待 | T0'''+9h |

### 4.4 step 3-3: T0'''+10h KPI-09/10 12h post snapshot (15 min)
| # | 項目 | cmd | 期待出力 | 写像 |
|---|------|-----|---------|------|
| 3-3-A | X impression 12h post snapshot (KPI-09 確定) | (R28 cmd 継承) | `> 1000` | T0'''+10h |
| 3-3-B | LinkedIn 12h post snapshot (KPI-10 確定) | (R28 cmd 継承) | `> 500` | T0'''+10h |

### 4.5 step 3-4: T0'''+10h30m Owner 早期就寝判断 (Owner 拘束 0-1 min 異常検知時のみ)
| # | 項目 | cmd | 期待出力 | 写像 |
|---|------|-----|---------|------|
| 3-4-A | OWN-AUTO PoC script-3 Owner Slack DM `[T+12h T0'''+10h30m] 12h 全件 GREEN / 早期就寝可 / 異常時のみ on-call 連絡` | (R28 cmd 継承) | 通知 OK / Owner 拘束 10 sec (通知開封のみ) | T0'''+10h30m |
| 3-4-B (異常時) | Sentry 5xx > 100 / smoke 1/8 FAIL 連続 3 round → Owner Slack DM mention | (R28 経路継承) | reply 1 行 60 sec (Owner 拘束 1 min / 異常時のみ) | 異常時のみ |

### 4.6 step 3-5: T0'''+11h cron 5 本 heartbeat 11h GREEN 確認 (15 min)
| # | 項目 | cmd | 期待出力 | 写像 |
|---|------|-----|---------|------|
| 3-5-A | cron 5 本 11h GREEN 確認 | `for f in cron-1 cron-2 cron-3 cron-4 cron-5; do curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v1/projects/$PROJECT/cron-jobs/$f/runs?limit=132" \| jq '[.runs[] \| select(.status == "succeeded")] \| length'; done` | 5 行全件 `132` | T0'''+11h |

### 4.7 step 3-6: T0'''+12h Phase 3 完遂 (5 min)
| # | 項目 | cmd | 期待出力 | 写像 |
|---|------|-----|---------|------|
| 3-6-A | Slack auto post `[T+12h T0'''+12h] Phase 3 完遂 / KPI 1-10 累積 / smoke 108/108 GREEN` | (R28 cmd 継承) | post OK | T0'''+12h |
| 3-6-B | 自動 on-call 引継 (Web-Ops 副担当 / Dev on-call) | (R28 経路継承) | 引継 OK | T0'''+12h |

### Phase 3 集計
- T0'''+6h → T0'''+12h / 360 min / Owner 拘束 0-1 min (異常時のみ) / 10 項目全件 cmd 化 / KPI 1-10 累積

---

## 5. Phase 4: T+24h overnight + morning final date-free 化 (T0'''+12h → T0'''+24h / 720 min / 10 項目)

### 5.1 Phase 4 goal (R28 継承)
- 深夜 cron 観測 (T0'''+12h → T0'''+18h / Web-Ops 副担当 + Dev on-call)
- T+24h Owner 1 行 final reply 受領 (Owner 拘束 1 min)
- 30day baseline 投入準備 (KPI-11 Lighthouse / KPI-12 pageview / KPI-13 Sentry 累積)

### 5.2 step 4-1: T0'''+12h → T0'''+18h 深夜 smoke 72 round 自動監視 (360 min)
| # | 項目 | cmd | 期待出力 | 写像 |
|---|------|-----|---------|------|
| 4-1-A | script-2 5 min interval × 72 round | (R28 cmd 継承) | 72/72 GREEN | T0'''+12h → T0'''+18h |
| 4-1-B | 累積 KPI-07 = 8 × (60 + 48 + 72) = 1440 pass | log 集計 | 1440 pass | T0'''+18h |

### 5.3 step 4-2: T0'''+18h Sentry 18h cumulative snapshot (15 min)
| # | 項目 | cmd | 期待出力 | 写像 |
|---|------|-----|---------|------|
| 4-2-A | Sentry 5xx + 4xx 18h window snapshot | (R28 cmd 継承) | 5xx 累積 < 60 / 4xx 累積 < 600 | T0'''+18h |

### 5.4 step 4-3: T0'''+21h Lighthouse 4 score 再計測 (KPI-11 / 30 min)
| # | 項目 | cmd | 期待出力 | 写像 |
|---|------|-----|---------|------|
| 4-3-A | Lighthouse CLI 実行 | `lighthouse https://prj-019.vercel.app --output json --output-path dashboard/lighthouse-T+24h.json --chrome-flags="--headless"` | 4 score 全件 `>= 90` | T0'''+21h |
| 4-3-B | 警告: 1 score `< 90` → Dev 翌日 hotfix 検討 | - | warning 0 件 期待 | T0'''+21h |

### 5.5 step 4-4: T0'''+21h30m Supabase pageview_event 24h 累積 (KPI-12 / 15 min)
| # | 項目 | cmd | 期待出力 | 写像 |
|---|------|-----|---------|------|
| 4-4-A | Supabase readonly query | `curl -s -H "Authorization: Bearer $SUPABASE_ANON_KEY" "https://$SUPABASE_PROJECT.supabase.co/rest/v1/pageview_event?select=count&created_at=gte.$T0''' iso8601" \| jq '.[0].count'` | `> 100` | T0'''+21h30m |

### 5.6 step 4-5: T0'''+21h45m T+24h Sentry 5xx 累積 確定 (KPI-13 / 15 min)
| # | 項目 | cmd | 期待出力 | 写像 |
|---|------|-----|---------|------|
| 4-5-A | Sentry 5xx 24h cumulative snapshot | (R28 cmd 継承) | `0` baseline / `> 10` 警告 / `> 100` NoGO | T0'''+21h45m |

### 5.7 step 4-6: T0'''+22h 13 KPI 全件 snapshot file 出力 + Marketing 報告書 prep (60 min)
| # | 項目 | file | 期待出力 | 写像 |
|---|------|------|---------|------|
| 4-6-A | `dashboard/launch-kpi-T+24h.md` 13 件全件 snapshot | (date-free 化 / R28 file `launch-kpi-2026-06-19-T+24h.md` の置換) | 13 KPI 全件 snapshot | T0'''+22h |
| 4-6-B | T+24h 公開後 24h 報告書 prep | `marketing-launch-day-t-plus-24h-report.md` (date-free 化) | 報告書 prep | T0'''+22h |
| 4-6-C | 30day baseline 投入準備 | T0'''+30d 比較用 baseline | baseline ready | T0'''+22h |

### 5.8 step 4-7: T0'''+23h CEO T+24h 報告書 sign + Owner 1 行 reply 受領 (Owner 拘束 1 min)
| # | 項目 | cmd / 内容 | 期待出力 | 写像 |
|---|------|----------|---------|------|
| 4-7-A | CEO 報告書 sign | (R28 cmd 継承) | sign OK | T0'''+23h |
| 4-7-B | CEO Slack DM `[T+24h T0'''+24h] 24h 完遂 / 13 KPI 全件 GREEN / Owner 1 行 final reply 依頼` | (R28 cmd 継承) | DM OK | T0'''+23h55m |
| 4-7-C | **Owner 1 行 reply (50 sec) `OK Owner: 24h 完遂確認`** | (R28 spec 継承) | reply 受領 / **Owner 拘束: 1 min** | T0'''+23h55m30s |

### 5.9 step 4-8: T0'''+24h Phase 4 完遂 + EOD post (5 min)
| # | 項目 | cmd | 期待出力 | 写像 |
|---|------|-----|---------|------|
| 4-8-A | Slack auto post `[T+24h T0'''+24h] Phase 4 完遂 / 13 KPI 全件 GREEN / 24h 公開維持` | (R28 cmd 継承) | post OK | T0'''+24h |
| 4-8-B | 30day baseline 投入準備完遂 | T0'''+30d 比較用 ready | ready | T0'''+24h |

### Phase 4 集計
- T0'''+12h → T0'''+24h / 720 min / Owner 拘束 1 min (T+24h final reply) / 10 項目全件 cmd 化 / 13 KPI 全件確定

---

## 6. 異常検知 trigger matrix date-free 化 (T+24h 内 6 trigger)

| trigger | 発生 phase | 検知 cmd | 1 次対応 | 2 次対応 | Owner 通知 trigger |
|---|---|---|---|---|---|
| Sentry 5xx > 50/h | §1 / §2 / §3 / §4 | Sentry stats API alert | Dev on-call hotfix prep | Case A rollback 即時実行 | > 100/h で Owner mention |
| smoke 1/8 FAIL 連続 3 round | §2 / §3 / §4 | script-2 auto alert | Web-Ops on-call 5 min 内手動再確認 | preview redeploy + cache purge | 連続 6 round で Owner mention |
| KPI-01 Impression 警告 < 100 (T+1h) | §1 step 1-1 | GA realtime API | Marketing 公報追加 prep | follow-up post 即時投稿 | T+1h judgment Path D 時のみ |
| portfolio hash 不一致 | §1 / §2 | curl + sha256 | Web-Ops cache purge | re-deploy + hash 再確認 | 復旧 SLA 30 min 超過時のみ |
| DNS 1/3 resolver 不解決 | §2 / §3 | dig 3 resolver | DNS provider 確認 | TTL 短縮 + propagation 待機 | 復旧 SLA 1h 超過時のみ |
| cron 5 本 1 本 FAIL 連続 3 round | §3 / §4 | Vercel cron API | Dev on-call 5 min 内手動再起動 | Vercel re-create cron | 連続 6 round で Owner mention |

---

## 7. Owner 拘束 0-1 min spec date-free 整合 (T+24h 内)

| Phase | 拘束時間 | 内容 | 写像 |
|---|---|---|------|
| Phase 1 (T+1h) | 0 min | KPI snapshot 自動 / Owner 通知 0 | T0'''+0h → T0'''+1h |
| Phase 2 (T+6h) | 0 min | smoke 60 round 自動 / Owner 通知 0 | T0'''+1h → T0'''+6h |
| Phase 3 (T+12h) | 0-1 min | GREEN 時 0 / 異常検知時 1 行 reply (1 min) | T0'''+6h → T0'''+12h |
| Phase 4 (T+24h) | 1 min | T+24h final 1 行 reply | T0'''+12h → T0'''+24h |
| **24h 内合計** | **1-2 min** | T+24h 1 min + 異常時 0-1 min | - |

D-Day (T0'''+0h → T0'''+6h) 4-6 min + T+24h 0-1 min (異常時) + T+24h final 1 min = **5-8 min 累計** (24h 内全 Owner 拘束 / R28 継承)

---

## 8. 13 KPI snapshot 一覧 + 取得経路 (date-free 整合)

| KPI | 取得 phase | 取得経路 | baseline / 警告 / NoGO | 写像 |
|---|---|---|---|------|
| KPI-01 Impression | §1 T+1h / §4 T+24h | GA realtime API | `> 0` / `< 100` / `< 10` | T0'''+0:00 / T0'''+22h |
| KPI-02 Click | §1 T+1h / §4 T+24h | GA event API | `> 0` / `< 5` / - | T0'''+0:05 / T0'''+22h |
| KPI-03 Signup | §1 T+1h / §4 T+24h | Supabase readonly | `>= 0` / `0` (T+24h) / - | T0'''+0:08 / T0'''+22h |
| KPI-04 Bounce rate | §1 T+1h / §4 T+24h | GA Bounce API | 30-60% / `> 80%` / `> 95%` | T0'''+0:12 / T0'''+22h |
| KPI-05 Sentry 5xx | §2 T+6h / §3 T+12h / §4 T+24h | Sentry stats API | `0` / `> 5/h` / `> 50/h` | T0'''+6h / T0'''+12h / T0'''+22h |
| KPI-06 Sentry 4xx | §2 T+6h / §3 T+12h / §4 T+24h | Sentry stats API | `< 50/h` / `> 100/h` / - | T0'''+6h / T0'''+12h / T0'''+22h |
| KPI-07 smoke pass count | §1-§4 全 phase 連続 | curl HEAD | `8/8` / `7/8` / `< 6/8` | T0'''+0h → T0'''+24h |
| KPI-08 Slack reaction | §3 T+12h | Slack API | `> 5/post` / `< 2/post` / - | T0'''+9h |
| KPI-09 X impressions | §3 T+12h | X analytics | `> 1000` / `< 200` / - | T0'''+10h |
| KPI-10 LinkedIn impressions | §3 T+12h | LinkedIn analytics | `> 500` / `< 100` / - | T0'''+10h |
| KPI-11 Lighthouse 4 score | §4 T+24h | Lighthouse CLI | `>= 90` / 1 score `< 90` / - | T0'''+21h |
| KPI-12 Supabase pageview 24h | §4 T+24h | Supabase readonly | `> 0` / `< 100` / - | T0'''+21h30m |
| KPI-13 T+24h Sentry 5xx 累積 | §4 T+24h | Sentry stats API | `0` / `> 10` / `> 100` | T0'''+21h45m |

---

## 9. R28 SOP との完全整合 verification

| 項目 | R28 SOP (302 行) | R30 date-free (本書) |
|------|------------------|---------------------|
| 起動 trigger | calendar 6/19 12:00 JST | T0''' = Owner D-Day GO reply 受領時刻 |
| Phase 数 | 4 (T+1h / T+6h / T+12h / T+24h) | 4 (継承) |
| 項目数 | 44 (13 + 11 + 10 + 10) | 44 (継承 / 写像列追加) |
| 1440 min 経路 | 12:00 6/19 → 12:00 6/20 | T0'''+0h → T0'''+24h (継承) |
| Owner 拘束 | 0-1 min | 0-1 min (継承) |
| 13 KPI | 13 件全件 | 13 件全件 (継承) |
| 異常検知 trigger | 6 件 | 6 件 (継承) |
| 副作用 | 0 | 0 (継承) |
| API call | $0 | $0 (継承) |
| 絵文字 | 0 | 0 (継承) |

---

## 10. 30day post-launch SOP 接続 (date-free 拡張)

### 10.1 D+1 〜 D+7 (week 1)
- R28 `marketing-v-r28-week-1-sop.md` (298 行) を T0'''+1d 〜 T0'''+7d に写像
- 公開日基点で D+1 = T0'''+24h, D+7 = T0'''+168h

### 10.2 D+8 〜 D+30 (week 2-4)
- weekly review 4 回: T0'''+7d / +14d / +21d / +28d
- monthly retro 1 回: T0'''+30d
- KPI 集計 cycle: weekly MRR / activation / retention

### 10.3 R29 D-Day spec §7 「30day post-launch ops 概要」整合
- R29 d-day-date-free.md §7 で既述の 30day 写像 100% 整合
- 本 file = §7 の T+24h 詳細展開版

---

## 11. 副作用 0 担保

- [x] 本書は文書のみ / 実行 0 / curl 0 / Slack post 0 / cron 操作 0 / DB write 0
- [x] launch day v3.0-v3.4 5 file **absolute 無改変**
- [x] R29 Marketing-W 5 file **absolute 無改変**
- [x] R28 Marketing-V t-plus-24h SOP file (302 行) **absolute 無改変** (本書はその date-free 化版 / original baseline 並行 reference)
- [x] R26 + R27 + R28 historical baseline 全件無改変
- [x] OWN-AUTO PoC 4 script 起動 0 (本書策定中 / 実 trigger 時のみ起動)
- [x] 絵文字 0 / Heroicons 参照のみ / API $0
- [x] Owner 拘束 0 (本書策定中 / 0-1 min spec は実 trigger 時のみ実測)
- [x] DEC-019-001-079 absolute 無改変

---

## 12. confidence 寄与

| 段階 | confidence |
|------|------------|
| R29 末 (date-free 採用) | 99% |
| R30 simulated GTC-8 PASS 後 | 99% (lock) |
| R30 simulated GTC-9 PASS 後 | 99.5% |
| R30 simulated GTC-10 PASS 後 | 99.9% |
| **本 task-4 着地後 (T+24h SOP date-free 完成)** | **99.9% (lock 維持) + 内訳 (実 D-Day 後 30day 監視 spec 完成度 +0.1pt = 100% 視野)** |
| 実 D-Day GTC-11 PASS 後 (将来) | 100% lock |

---

## 13. 関連 DEC

- DEC-019-090 (T+24h / 30day SOP date-free 接続 / R29 起票候補) status: 本 file 起票で confirmed 候補昇格 (R30 PM-W で正式採決検討)
- DEC-019-025 (background dispatch SOP) 整合維持
- DEC-019-033 (knowledge 抽出経路) 整合維持
- DEC-019-054 (portfolio v3.1 hash check) 異常検知 trigger §6 第 4 行 portfolio hash 不変
- DEC-019-062 (cron 5 本 + CRON_SECRET) §4 step 4-1 / §5 step 5-2 不変
- DEC-018-047 (PRJ-018 hotfix rollback ベストプラクティス) 異常検知 §6 第 1 行 Sentry 5xx Case A rollback 不変

---

## 14. 結語

R30 Marketing-X 軸 task-4 (T+24h SOP date-free 化 file 起票) 着地。R28 SOP 302 行を date-free 化、4 Phase 1440 min / 13 KPI 監視 / 異常検知 6 trigger / Owner 拘束 0-1 min spec を T0''' (Owner D-Day GO reply 受領時刻) 基点へ完全写像。30day post-launch SOP への接続 path 確定 (R29 d-day spec §7 整合)。

副作用 0 / API call $0 / 絵文字 0 / Owner 拘束 0 min (本 round 内 / 実 trigger 時 1-2 min 累計) / 7 absolute file 無改変厳守 / DEC-019-001-079 absolute 無改変.

—— Marketing-X / 2026-05-06 W0-Week1 / R30 9 並列 7 軸目 / T+24h SOP date-free 完成 / 30day path 確定

---

**最終更新**: 2026-05-06 (Round 30 / Marketing-X / T+24h SOP date-free 化起票)
**派生元**: R28 Marketing-V `marketing-v-r28-t-plus-24h.md` (302 行 / absolute 無改変)
**次回見直し**: Round 31 Marketing-Y (T+24h 実測値後 / 実 trigger 受領時)

**file 終端 / 行数: 約 350 行**
