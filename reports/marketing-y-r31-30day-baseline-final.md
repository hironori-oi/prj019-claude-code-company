# PRJ-019 Marketing-Y R31 — 30day baseline 維持 spec 統合最終版 (R28 v3.2 + R29 v3.4 + R31 v3.5)

**Round**: R31 (9 並列 7 軸目 / Marketing-Y)
**Generated**: 2026-05-06 (R31 sprint)
**位置付け**: T+24h 完遂 → T0'''+30d 期間 daily 7 KPI weekly aggregation 統合最終版
**派生元**: marketing-v-r28-week-1-sop.md + marketing-w-r29-launch-day-v3-4-date-free-delta.md + marketing-y-r31-launch-day-v3.5.md (本 round 起票)
**Owner directive**: 「日付決め打ちなし / 完成次第即時 GO」整合
**absolute 無改変保持 5 file**: v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2-final-lock / v3.4-date-free-delta
**API call**: $0 / 副作用: 0 / 絵文字: 0 / Owner 拘束: 0-9 min (任意 / 強制 0 min)

---

## 0. 統合方針

### 0.1 3 round spec 統合
| spec | round | 内容 |
|------|-------|------|
| R28 v3.2 final lock | R28 | calendar 6/19-7/19 ベース 30day SOP (302 行) |
| R29 v3.4 date-free delta | R29 | date-free 化 delta (T0''' 基点) |
| R31 v3.5 (本 round) | R31 | weekly aggregation + monthly retro + closeout 統合最終版 |

### 0.2 統合最終版 = 本 file
- R28 v3.2 absolute 無改変保持 (302 行)
- R29 v3.4 absolute 無改変保持 (date-free delta)
- 本 file = 3 spec を 0 改変で統合 reference + daily / weekly protocol 規定

---

## 1. 30day timeline 全体

### 1.1 4 weekly + 1 monthly 構成
| state | 区間 | weekly review | trigger |
|-------|------|--------------|---------|
| T0'''+1d → +7d | Week 1 | weekly review #1 | T0'''+7d |
| T0'''+8d → +14d | Week 2 | weekly review #2 | T0'''+14d |
| T0'''+15d → +21d | Week 3 | weekly review #3 | T0'''+21d |
| T0'''+22d → +28d | Week 4 | weekly review #4 | T0'''+28d |
| T0'''+29d → +30d | retro 準備 | monthly retro + closeout | T0'''+30d |

### 1.2 daily verify 期間
- T0'''+1d 〜 T0'''+30d 連続 30 日間 daily 7 KPI verify
- 1 day 1 verify cycle / 自動 / Owner 拘束 0 min (異常時のみ notification)

---

## 2. daily 7 KPI 規定

### 2.1 7 KPI 一覧 (T+24h 13 KPI から 30day 期間用に絞込)
| # | KPI | 期待 baseline | 30day 維持目標 |
|---|-----|--------------|---------------|
| 1 | latency p50 | < 50ms | 30day 平均 < 50ms |
| 2 | availability | > 99.9% | 30day 平均 > 99.9% |
| 3 | error rate | < 0.1% | 30day 平均 < 0.1% |
| 4 | unique visitors (daily) | 非 0 | 30day cumulative trend |
| 5 | session duration (daily avg) | baseline 維持 | 30day 平均 baseline ±10% |
| 6 | CTR (daily) | baseline 維持 | 30day 平均 baseline ±10% |
| 7 | signup conversion (daily) | baseline 維持 | 30day 平均 baseline ±10% |

### 2.2 daily verify protocol
- 24:00 (T0'''+Nd 24:00) 自動集計 → 7 KPI 値出力 → KPI dashboard 更新
- 異常検知時 (baseline 逸脱): Owner notification fork → manual ack request 0-1 min

### 2.3 副作用 0 担保
- daily 自動集計のみ / API 呼出 0 / DB read のみ
- Owner 拘束: 0 min (異常時 0-1 min)

---

## 3. weekly review #1-4 規定

### 3.1 weekly review 共通 protocol
| 項目 | 内容 |
|------|------|
| trigger | T0'''+7d / +14d / +21d / +28d 自動 fork |
| duration | 0-1 min (Owner 任意 ack) |
| 集約対象 | 7 KPI weekly aggregation (7 day 平均 / max / min / week-over-week diff) |
| 出力 | dashboard line 3 prepend "weekly-review-{N}-green" |
| 異常時 | rollback 0/1/2 fork (本 file §6) |

### 3.2 weekly review #1 (T0'''+7d) 規定
- Week 1 7 KPI aggregation
- T0'''+0h baseline と比較 (week-over-week diff)
- 期待: 7 KPI ALL GREEN (baseline ±10% 内)
- Owner 任意 ack (0-1 min) → dashboard prepend

### 3.3 weekly review #2 (T0'''+14d) 規定
- Week 2 7 KPI aggregation
- Week 1 と比較
- 期待: ALL GREEN

### 3.4 weekly review #3 (T0'''+21d) 規定
- Week 3 7 KPI aggregation
- Week 2 と比較
- 期待: ALL GREEN

### 3.5 weekly review #4 (T0'''+28d) 規定
- Week 4 7 KPI aggregation
- Week 3 と比較 + monthly trend 予測
- 期待: ALL GREEN
- monthly retro 起動 trigger fork (T0'''+29d)

---

## 4. monthly retro (T0'''+29d → +30d) 規定

### 4.1 retro 構成
| section | 内容 | 行数 |
|---------|------|------|
| 1. summary | 30day baseline 維持 verify | 50 |
| 2. 7 KPI monthly aggregation | 30day 平均 + max + min + trend | 80 |
| 3. weekly review #1-4 集約 | 4 回 ack 集約 | 50 |
| 4. KPT (Keep / Problem / Try) | 3 種 × 5 件 | 100 |
| 5. Dev W6-B post-mortem merge | 90 行 (R29 Dev-FFF 継承) | 90 |
| 6. 議決 lock 状況 | DEC-019-082-093 集約 | 30 |
| 7. PRJ-020 引継 | 次案件向け knowledge transfer | 50 |
| 8. closeout 宣言 | PRJ-019 Phase 1 W4-W6 完遂 | 50 |
| **合計** | | **約 500 行** |

### 4.2 closeout report 起票 (T0'''+30d)
- R32 Marketing-Z 軸が起票
- Marketing template (8 section) + Dev W6-B (90 行) merge
- CEO 確認 → Owner 任意 0-5 min ack

### 4.3 Owner 拘束
- monthly retro: 任意 0-5 min
- closeout 確認: 任意 0-5 min
- 合計: 0-10 min (任意)

---

## 5. confidence 100% lock 維持 verify (30day 期間)

### 5.1 lock 維持条件 daily verify
| 条件 | 確認 source |
|------|------------|
| 7 KPI ALL GREEN | KPI dashboard daily |
| anomaly count = 0 | sec yml 12 file alert log |
| 5 file 無改変 | git log daily |
| Owner manual rollback request 0 件 | reply log |

### 5.2 lock 降下 trigger
- 上記 1 件でも欠 → lock 一時解除 → rollback fork
- rollback 完遂 + post-mortem 起票後 → lock 復帰

### 5.3 30day 期間 lock 降下 0 件 想定
- baseline 健全運用前提
- 万が一発火時: post-mortem template fill-in 経路完備

---

## 6. rollback path 30day 期間 規定

### 6.1 5 rollback trigger 条件 (T+24h 継承)
| # | 条件 | rollback level |
|---|------|---------------|
| 1 | latency p95 > 500ms 連続 5 min | rollback 1 |
| 2 | availability < 99.5% 連続 5 min | rollback 1 |
| 3 | error rate > 1% 連続 5 min | rollback 1 |
| 4 | anomaly count > 3 連続 1h | rollback 2 |
| 5 | Owner manual rollback request | rollback 0 |

### 6.2 rollback level 内訳
- rollback 0: 即時 (Owner request) / 手動 / Owner 拘束 1-3 min
- rollback 1: 自動 / KPI baseline 逸脱 / Owner notification 0-1 min
- rollback 2: 自動 / sec alert / Owner notification 0-1 min + post-mortem

### 6.3 rollback 0 件 想定
- 30day 期間中 rollback 発火 0 件 想定
- 健全運用継続前提

---

## 7. 7 KPI baseline 維持 spec 詳細

### 7.1 latency p50 < 50ms 維持
- daily 平均 < 50ms 30day 連続維持
- 異常時: Vercel function cold start 排除 / cache hit ratio 改善

### 7.2 availability > 99.9% 維持
- daily 平均 > 99.9% 30day 連続維持 (downtime < 86s/day)
- 異常時: incident response (Vercel status / Supabase status verify)

### 7.3 cost < budget 維持
- 30day cumulative cost < $750 (daily $25 × 30)
- 異常時: rate limit 発動 / RR (rate-limit) alert

### 7.4 unique visitors trend
- daily baseline 計測 / 30day cumulative 期待 50,000-150,000 visitors (任意 trend)

### 7.5 session duration baseline ±10%
- baseline 4:30 ± 10% = 4:03 〜 4:57 daily avg

### 7.6 CTR baseline ±10%
- baseline 18% ± 10% = 16.2% 〜 19.8% daily

### 7.7 signup conversion baseline ±10%
- baseline 6% ± 10% = 5.4% 〜 6.6% daily

---

## 8. R28 v3.2 + R29 v3.4 + R31 v3.5 統合 verify

### 8.1 統合 element 一覧
| element | R28 v3.2 | R29 v3.4 | R31 v3.5 | 本 file 統合 |
|---------|---------|---------|---------|------------|
| timeline | calendar 6/19-7/19 | date-free T0''' | date-free T0''' | T0'''+0h → +30d |
| weekly review | 4 回 (固定日付) | 4 回 (date-free) | 4 回 (date-free) | 4 回 (T0'''+7d/+14d/+21d/+28d) |
| monthly retro | 1 回 (7/19) | 1 回 (date-free) | 1 回 (date-free) | 1 回 (T0'''+30d) |
| 7 KPI | 13 KPI | 13 KPI | 13 KPI | 7 KPI (絞込) |
| Owner 拘束 | 0-9 min (任意) | 0-9 min (任意) | 0-9 min (任意) | 0-9 min (任意) |
| 副作用 | 0 | 0 | 0 | 0 |

### 8.2 absolute 無改変 verify
- R28 v3.2 (302 行) = 無改変保持
- R29 v3.4 (date-free delta) = 無改変保持
- R31 v3.5 = 本 round 起票後 absolute 無改変
- 本 file = reference のみ / back-edit 0

---

## 9. 制約遵守 verification

| 制約 | 結果 |
|------|------|
| v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2 / v3.4 5 file 無改変 | PASS |
| R28 v3.2 final lock SOP 無改変 | PASS |
| R29 v3.4 date-free delta 無改変 | PASS |
| R31 v3.5 (本 round 起票) 無改変 | PASS |
| date-free 厳守 (T0''' 基点) | PASS |
| 固定日付 0 件 | PASS |
| API call $0 | PASS |
| 副作用 0 (新規 file 1 件のみ) | PASS |
| 絵文字 0 | PASS |
| Owner 拘束 0 min 強制 (任意 0-9 min) | PASS |
| fix forward-only | PASS |

---

## 10. R31 → R32 引継

- 引継 #1: 本 file の 30day timeline + 7 KPI を 0 改変で実機実行
- 引継 #2: weekly review #1-4 → monthly retro 連動 actual record (R32 Marketing-Z)
- 引継 #3: closeout report 起票 (T0'''+30d) → 推定 400-600 行
- 引継 #4: PRJ-020 引継 knowledge transfer (organization/knowledge/ 反映)

---

## 11. 結語

30day baseline 維持 spec 統合最終版起票完遂. R28 v3.2 + R29 v3.4 + R31 v3.5 3 spec 統合 / daily 7 KPI weekly 4 回 aggregation + monthly retro 1 回 / 30day 期間 confidence 100% lock 維持 verify protocol / Owner 拘束 0 min 強制 (任意 0-9 min) / rollback path 5 条件 + 3 level / 7 KPI baseline 維持 spec 詳細.

副作用 0 / API call $0 / 絵文字 0 / 5 absolute file + R28 v3.2 + R29 v3.4 + R31 v3.5 無改変厳守 / fix forward-only / date-free 完全準拠.

—— Marketing-Y / 2026-05-06 / R31 9 並列 7 軸目 / 30day baseline 統合最終版 / 100% lock 30day 維持 spec 確立
