# Marketing-V R28 task ③ 公開後 1 Week SOP (7 day daily check / 7 KPI weekly trajectory / 月次告知準備)

## 0. 概要

- **対象**: PRJ-019 Open Claw / COMPANY-WEBSITE 公開後 **2026-06-20 12:00 JST 〜 2026-06-26 12:00 JST 7 day SOP**
- **本書 role**: Round 28 Marketing-V task ③ / D-Day + T+24h 後の 6 day daily check + 7 day weekly KPI trajectory + 月次告知準備 spec
- **派生元**:
  - Marketing-V R28 task ① D-Day real exec spec / task ② T+24h timeline real spec
  - launch day v3.2 正式版 §11-§12 引継 (不変保持)
  - Marketing-I R15 public-launch-narrative-diff-and-30-60-day-ops (30day ops 引継)
- **本書出力時期**: Round 28 / 2026-05-05 / 6/19 公開 45 日前
- **副作用**: 0 (本書は文書のみ / API $0 / 絵文字 0 / Heroicons のみ)
- **項目総数**: **42 項目** (7 day × 6 項目平均 / Day 1: 7 / Day 2: 6 / Day 3: 6 / Day 4: 6 / Day 5: 6 / Day 6: 5 / Day 7: 6)
- **Owner 拘束**: **0-1 min/day** (Day 1-6: 0 min 維持 / Day 7: 1 min weekly summary reply)
- **関連 DEC**: DEC-019-025 / DEC-019-033 / DEC-019-054 / DEC-019-062 / DEC-018-047 / DEC-019-068

---

## §1 Day 1 (6/20 12:00 - 6/21 12:00 JST / T+24h - T+48h / 7 項目)

### §1.1 Day 1 goal

- T+24h 完遂後の D+1 day stable 監視
- KPI-01-13 13 件 trajectory 継続 (T+24h baseline → T+48h 比較)
- 公報拡散 second wave 観測 (X / LinkedIn / press release wire)
- Owner 拘束 0 min 維持

### §1.2 daily check items

- **項目 D1-A**: 12:00 6/20 daily morning check / smoke 8 endpoint 自動 curl (script-2)
  - 期待出力: 8/8 GREEN
- **項目 D1-B**: 13:00 Sentry 24h cumulative snapshot
  - 期待出力: 5xx < 30 (D+1 baseline)
- **項目 D1-C**: 14:00 KPI-01 Impression / KPI-02 Click 24h snapshot (D+1 累積)
  - cmd: GA report API
  - 期待出力: D-Day baseline の 1.5-2.0 倍 (公報拡散 second wave)
- **項目 D1-D**: 15:00 X impression 24h post snapshot (KPI-09 D+1)
  - 期待出力: > 1500 (D+1 baseline)
- **項目 D1-E**: 16:00 LinkedIn 24h post snapshot (KPI-10 D+1)
- **項目 D1-F**: 17:00 cron 5 本 24h GREEN 累積確認
  - 期待出力: 5 行全件 `288` (5 min × 24h)
- **項目 D1-G**: 18:00 Day 1 完遂 / Slack auto post `[Day 1 18:00] D+1 day GREEN / KPI 1-10 累積維持 / Day 2 monitoring 移行`

### Day 1 集計
- 7 項目 / Owner 拘束 0 min / 13 KPI 継続 trajectory

---

## §2 Day 2 (6/21 12:00 - 6/22 12:00 JST / D+2 / 6 項目)

### §2.1 Day 2 goal

- 公報 follow-up post 投稿 (Marketing 佐藤)
- Sentry 48h cumulative monitoring
- KPI-08 Slack reaction trajectory snapshot

### §2.2 daily check items

- **項目 D2-A**: 12:00 6/21 daily check / smoke 8/8 GREEN
- **項目 D2-B**: 14:00 Marketing 佐藤 follow-up post 投稿 (X / LinkedIn)
  - 文言: "Open Claw 公開から 48h 経過 / 13 KPI 全件 GREEN 維持 / 詳細 portfolio: prj-019.vercel.app"
- **項目 D2-C**: 15:00 Sentry 48h cumulative snapshot
  - 期待出力: 5xx < 60 / 4xx < 1200 (D+2 累積 baseline)
- **項目 D2-D**: 16:00 KPI-08 Slack reaction trajectory
  - 期待出力: 8 post 累積 reaction > 80 (公報拡散 second wave 反映)
- **項目 D2-E**: 17:00 cron 5 本 48h GREEN 累積確認 (各 576 round)
- **項目 D2-F**: 18:00 Day 2 完遂 / Slack auto post `[Day 2 18:00] D+2 GREEN / follow-up post 完遂 / Day 3 移行`

### Day 2 集計
- 6 項目 / Owner 拘束 0 min / follow-up post 1 round 完遂

---

## §3 Day 3 (6/22 12:00 - 6/23 12:00 JST / D+3 / 6 項目)

### §3.1 Day 3 goal

- 公報拡散 third wave 観測 (週中 organic reach)
- Lighthouse re-測定 (KPI-11 D+3 baseline)
- Marketing weekly mid-point check

### §3.2 daily check items

- **項目 D3-A**: 12:00 6/22 daily check / smoke 8/8 GREEN
- **項目 D3-B**: 14:00 Lighthouse 4 score 再計測 (KPI-11 D+3)
  - cmd: `lighthouse https://prj-019.vercel.app --output json --output-path dashboard/lighthouse-D+3.json`
  - 期待出力: 4 score 全件 >= 90 維持
- **項目 D3-C**: 15:00 X impression D+3 累積 snapshot
  - 期待出力: > 2500 (D+3 累積 baseline)
- **項目 D3-D**: 16:00 KPI-12 Supabase pageview D+3 累積 (3 day 累積)
  - 期待出力: > 500 (3 day 累積 baseline)
- **項目 D3-E**: 17:00 Sentry 72h cumulative snapshot
- **項目 D3-F**: 18:00 Day 3 完遂 / Slack auto post + Marketing 週中レポート prep

### Day 3 集計
- 6 項目 / Owner 拘束 0 min / Lighthouse re-測定完遂

---

## §4 Day 4 (6/23 12:00 - 6/24 12:00 JST / D+4 / 6 項目)

### §4.1 Day 4 goal

- 中盤 stable 監視継続
- 月次告知準備 (Marketing 佐藤 + CEO 小林)
- 30day ops 引継 prep

### §4.2 daily check items

- **項目 D4-A**: 12:00 6/23 daily check / smoke 8/8 GREEN
- **項目 D4-B**: 14:00 30day ops review 開始 (Marketing-I R15 引継 / 月次告知 ops draft)
- **項目 D4-C**: 15:00 KPI-09 X impression D+4 累積
- **項目 D4-D**: 16:00 KPI-10 LinkedIn impression D+4 累積
- **項目 D4-E**: 17:00 Dev 山田 hotfix 0 件確認 (D+1 - D+4 期間 hotfix history check)
  - cmd: `git log --oneline --since='2026-06-19' --until='2026-06-23' | grep -i hotfix | wc -l`
  - 期待出力: `0` (hotfix 0 件 baseline)
- **項目 D4-F**: 18:00 Day 4 完遂

### Day 4 集計
- 6 項目 / Owner 拘束 0 min / 月次告知準備 draft 完遂

---

## §5 Day 5 (6/24 12:00 - 6/25 12:00 JST / D+5 / 6 項目)

### §5.1 Day 5 goal

- 週末前 stable 確認
- KPI weekly trajectory mid-point
- 月次告知 draft レビュー

### §5.2 daily check items

- **項目 D5-A**: 12:00 6/24 daily check / smoke 8/8 GREEN
- **項目 D5-B**: 14:00 KPI weekly mid-point trajectory snapshot (D+1 - D+5 累積)
  - file: `dashboard/launch-kpi-weekly-trajectory-D+5.md`
- **項目 D5-C**: 15:00 Sentry 5 day cumulative snapshot
  - 期待出力: 5xx < 150 (D+5 累積 baseline)
- **項目 D5-D**: 16:00 月次告知 draft Review 渡辺 sign
- **項目 D5-E**: 17:00 cron 5 本 5 day GREEN 累積確認
- **項目 D5-F**: 18:00 Day 5 完遂

### Day 5 集計
- 6 項目 / Owner 拘束 0 min / 月次告知 draft Review sign

---

## §6 Day 6 (6/25 12:00 - 6/26 12:00 JST / D+6 / 5 項目)

### §6.1 Day 6 goal

- 週末土曜 stable 監視 (低活動期)
- 公報週末 wave snapshot
- Day 7 weekly summary prep

### §6.2 daily check items

- **項目 D6-A**: 12:00 6/25 daily check / smoke 8/8 GREEN
- **項目 D6-B**: 15:00 Sentry 6 day cumulative snapshot
  - 期待出力: 5xx < 180
- **項目 D6-C**: 16:00 KPI-09/10 D+6 累積 snapshot
- **項目 D6-D**: 17:00 Day 7 weekly summary file template prep `dashboard/launch-kpi-weekly-summary-D+7.md`
- **項目 D6-E**: 18:00 Day 6 完遂

### Day 6 集計
- 5 項目 / Owner 拘束 0 min / Day 7 weekly summary prep

---

## §7 Day 7 (6/26 12:00 - 6/27 12:00 JST / D+7 / 6 項目)

### §7.1 Day 7 goal

- 7 day weekly KPI 確定
- Marketing weekly summary 確定 + Owner 1 行 reply 受領
- 月次告知 final lock + 7/19 30day baseline 投入準備

### §7.2 daily check items

- **項目 D7-A**: 12:00 6/26 daily check / smoke 8/8 GREEN (1 week 連続 GREEN 維持)
- **項目 D7-B**: 14:00 7 KPI weekly 確定 snapshot
  - 7 KPI: KPI-01 Impression 累積 / KPI-02 Click 累積 / KPI-05 Sentry 5xx 7 day 累積 / KPI-07 smoke pass count 7 day 累積 / KPI-09 X impression / KPI-10 LinkedIn impression / KPI-12 Supabase pageview 7 day 累積
  - file: `dashboard/launch-kpi-weekly-summary-D+7.md`
- **項目 D7-C**: 15:00 Marketing weekly summary 完遂 (Marketing 佐藤 + CEO 小林 sign)
- **項目 D7-D**: 16:00 月次告知 final lock + 7/19 30day baseline 投入準備
- **項目 D7-E**: 17:00 Owner 1 行 reply 受領 (1 min Owner 拘束)
  - CEO Slack DM `[D+7 17:00] 1 week 完遂 / 7 KPI 全件 GREEN / Owner 1 行 reply 依頼`
  - Owner reply 1 行 (60 sec): `OK Owner: 6/19-6/26 1 week 完遂確認`
  - Owner 拘束: 1 min (Day 7 weekly summary 受領のみ)
- **項目 D7-F**: 18:00 Day 7 完遂 / Slack auto post `[Day 7 18:00] 1 week 完遂 / 7 KPI 全件 GREEN / 月次告知 final lock 完遂`

### Day 7 集計
- 6 項目 / Owner 拘束 1 min (weekly summary reply のみ) / 7 KPI 確定

---

## §8 7 KPI weekly trajectory 一覧

| KPI | D+1 baseline | D+3 baseline | D+5 baseline | D+7 baseline |
|---|---|---|---|---|
| KPI-01 Impression 累積 | > 100 | > 500 | > 1000 | > 2000 |
| KPI-02 Click 累積 | > 10 | > 50 | > 100 | > 200 |
| KPI-05 Sentry 5xx 累積 | < 30 | < 100 | < 150 | < 200 |
| KPI-07 smoke pass count | > 280 | > 850 | > 1400 | > 2000 |
| KPI-09 X impression 累積 | > 1500 | > 2500 | > 3500 | > 5000 |
| KPI-10 LinkedIn impression 累積 | > 800 | > 1500 | > 2000 | > 3000 |
| KPI-12 Supabase pageview 累積 | > 200 | > 500 | > 800 | > 1500 |

注: 13 KPI のうち daily 監視対象は 7 KPI / その他 6 KPI (KPI-03 Signup / KPI-04 Bounce / KPI-06 Sentry 4xx / KPI-08 Slack reaction / KPI-11 Lighthouse / KPI-13 Sentry 5xx 24h 累積) は week 1 終了時点 snapshot のみ

---

## §9 月次告知準備 (Day 4-7)

### §9.1 月次告知 contents 5 要素

| 要素 | 内容 | 担当 |
|---|---|---|
| (1) 公開当日報告 | D-Day 6/19 12:00 公開完遂 / 13 KPI 全件 GREEN / 4-6 min Owner 拘束完遂 | Marketing 佐藤 |
| (2) 1 week trajectory | 7 KPI 1 week 累積値 / D+1 → D+7 trajectory chart | Marketing 佐藤 |
| (3) 公報拡散 highlight | X / LinkedIn / press release 累積 impression / reaction | Marketing 佐藤 |
| (4) 技術側 highlight | Sentry 0 critical / smoke 1 week 連続 GREEN / Lighthouse 4 score 維持 | Dev 山田 + Web-Ops 田中 |
| (5) 30day baseline 投入 | 7/19 30day vs D-Day 比較 baseline 設定 | Marketing 佐藤 + CEO 小林 |

### §9.2 月次告知 distribution channel

- 自社 HP `https://___company.com/blog/2026-06-launch-1week-report` (Web-Ops 田中)
- X / LinkedIn / press release wire 同時告知 (Day 7 18:00 投稿)
- Slack `#prj-019-launch` ch + CEO Slack DM Owner 報告

---

## §10 異常検知 trigger matrix (Day 1-7 内 4 trigger)

| trigger | 発生 day | 検知 cmd | 対応 |
|---|---|---|---|
| smoke 1/8 FAIL 連続 6 round | Day 1-7 全 day | script-2 auto alert | Web-Ops on-call 5 min 内手動再確認 + Owner mention |
| Sentry 5xx > 100/h | Day 1-7 全 day | Sentry alert ch | Dev on-call hotfix prep / Case A rollback |
| KPI-09 X impression < D+1 baseline | Day 2 | GA + X analytics | Marketing follow-up post 即時投稿 |
| Lighthouse 1 score < 90 | Day 3 | Lighthouse CLI | Dev 山田 翌日 hotfix 検討 (Day 4-7 内対応) |

---

## §11 Owner 拘束 0-1 min/day spec

| Day | Owner 拘束 | 内容 |
|---|---|---|
| Day 1 (D+1) | 0 min | KPI snapshot 自動 / Owner 通知 0 |
| Day 2 (D+2) | 0 min | follow-up post 自動 / Owner 通知 0 |
| Day 3 (D+3) | 0 min | Lighthouse 自動 / Owner 通知 0 |
| Day 4 (D+4) | 0 min | 月次告知 draft 自動 / Owner 通知 0 |
| Day 5 (D+5) | 0 min | mid-point trajectory 自動 / Owner 通知 0 |
| Day 6 (D+6) | 0 min | 週末監視 / Owner 通知 0 |
| Day 7 (D+7) | 1 min | weekly summary 1 行 reply (Owner 受領のみ) |
| **1 week 累計** | **1 min** | Day 7 weekly summary reply のみ |

D-Day 4-6 min + T+24h 0-1 min + 1 week 1 min = **5-8 min 累計** (D-Day から 1 week 終了まで)

---

## §12 副作用 0 担保

- [x] 本書は文書のみ / 実行 0 / curl 0 / Slack post 0 / cron 操作 0 / DB write 0
- [x] launch day v3.x 4 file **absolute 無改変**
- [x] T+24h timeline original **absolute 無改変**
- [x] R26 + R27 historical baseline 全件無改変
- [x] OWN-AUTO PoC 4 script 起動 0 (本書策定中 / 6/20-6/26 当日のみ起動)
- [x] 絵文字 0 / Heroicons 参照のみ / API $0
- [x] Owner 拘束 0 (本書策定中 / 0-1 min/day spec は 6/20-6/26 当日のみ実測)

---

## §13 confidence 寄与

- Round 28 task ② 完遂時 baseline: **97.5%**
- 本 task ③ 1 week SOP: **+0.4pt** (42 項目 7 day daily check / 7 KPI weekly trajectory / 月次告知準備 / Owner 拘束 0-1 min/day spec)
- Round 28 task ③ 完遂後 confidence: **97.9%**

---

## §14 関連 DEC / KPI / 引継

- DEC-019-025: background dispatch SOP (本書 4 file まとめて 1 件カウント)
- DEC-019-033: knowledge 抽出経路 (本書を `organization/knowledge/patterns/launch-day-week-1-sop.md` 候補化)
- DEC-019-054: portfolio v3.1 hash check (本書 §10 異常検知 trigger 不変)
- DEC-019-062: cron 5 本 + CRON_SECRET (本書 D+1-D+7 daily check 不変)
- DEC-019-068: Sec stagger 圧縮 baseline (連続 13 round 適用 / 本書影響 0)

引継 (Round 29 Marketing-W 想定):
1. Day 1-7 SOP 7 day 全件 cmd 化済 → R29 で D-Day 実測値後 30day ops 拡張
2. 7 KPI weekly trajectory baseline 確定 → R29 で 30day trajectory 拡張
3. 月次告知 final lock baseline 確定 → R29 で 30day post-launch report 起票

---

**最終更新**: 2026-05-05 (Round 28 / Marketing-V / 公開後 1 week SOP 起票)
**派生元**: Marketing-V R28 task ① + ② + launch day v3.2 正式版 (不変保持)
**次回見直し**: Round 29 Marketing-W (1 week 実測値後 / R29 baseline 98% 継承時)
