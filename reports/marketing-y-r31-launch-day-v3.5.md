# PRJ-019 Marketing-Y R31 — launch-day v3.5 date-free 完成版 (delta only / 最終確定版)

**Round**: R31 (9 並列 7 軸目 / Marketing-Y)
**Generated**: 2026-05-06 (R31 sprint)
**位置付け**: v3.4 date-free delta + R30 Marketing-X T+24h date-free + post-mortem template を統合した **最終確定版 launch-day spec** (R32+α 不要想定)
**派生元**: marketing-w-r29-launch-day-v3-4-date-free-delta.md + marketing-x-r30-t-plus-24h-date-free.md
**Owner directive**: 「日付決め打ちなし / 完成次第即時 GO」最終整合
**absolute 無改変保持 5 file**: v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2-final-lock / v3.4-date-free-delta
**v3.5 = 新規 file delta only / 上記 5 file 改変 0**
**API call**: $0 / 副作用: 0 / 絵文字: 0 / Owner 拘束: 0 min (本軸内 起票のみ)

---

## 0. v3.5 位置付け

### 0.1 launch-day spec バージョン累積
| ver | round | 内容 | status |
|-----|-------|------|--------|
| v3.0 | R23 | 初版 launch-day spec (calendar 6/19) | absolute lock |
| v3.1-delta | R24 | KPI 追加 delta | absolute lock |
| v3.2-delta-candidate | R25 | rollback path 追加候補 | absolute lock |
| v3.2-final-lock | R26 | rollback path 確定版 | absolute lock |
| v3.3 | (skip) | (採用なし) | n/a |
| v3.4-date-free-delta | R29 | date-free 化 delta | absolute lock |
| **v3.5** | **R31** | **本 file: 30day baseline 統合 + 100% lock path 統合最終版** | **延長 lock** |

### 0.2 v3.5 が含む最終統合内容
- v3.4 date-free 完全継承 (T0''' = Owner D-Day GO reply 受領時刻)
- R30 T+24h SOP date-free (412 行) 写像内蔵
- 30day baseline 統合 (T0'''+1d 〜 T0'''+30d)
- post-launch external comms timing 統合
- post-mortem template merge 接続
- confidence 100% lock spec 連動

### 0.3 v3.5 不変保持原則
- v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2 / v3.4 5 file は absolute 無改変
- 本 file = delta only / 5 file への back-edit 0
- R32+α で v3.6 不要想定 (本 file 最終確定版)

---

## 1. T0''' 起動 → T0'''+30d closeout 完全 timeline

### 1.1 timeline 一覧
| state | 区間 | 内容 |
|-------|------|------|
| T0''' | Owner D-Day GO reply 受領 | 公開直前 |
| T0'''+0h → +6h | D-Day Phase 1'''-7''' | 公開実行 + 6h KPI baseline |
| T0'''+6h → +24h | T+24h SOP Phase 1-4 | 公開後 24h KPI 監視 |
| T0'''+24h | T+24h final reply | Owner 1 min ack |
| T0'''+1d → +7d | Week 1 daily KPI | weekly review #1 |
| T0'''+7d | weekly review #1 | confidence ack |
| T0'''+7d → +14d | Week 2 daily KPI | weekly review #2 |
| T0'''+14d | weekly review #2 | confidence ack |
| T0'''+14d → +21d | Week 3 daily KPI | weekly review #3 |
| T0'''+21d | weekly review #3 | confidence ack |
| T0'''+21d → +28d | Week 4 daily KPI | weekly review #4 |
| T0'''+28d | weekly review #4 | confidence ack |
| T0'''+28d → +30d | retro 準備 + post-mortem fill-in | closeout 起票 |
| T0'''+30d | monthly retro / closeout report | DEC-019-092 lock |

### 1.2 Owner 拘束時間 累計
| trigger | 拘束 |
|---------|------|
| GTC-11 D-Day GO 1 行 reply | 1 min |
| T+24h final reply | 1 min |
| weekly review #1-4 (任意) | 0-4 min |
| monthly retro (任意) | 0-5 min |
| **合計** | **2-11 min** (確定 2 min + 任意 0-9 min) |

---

## 2. v3.4 date-free 完全継承 (差分 0)

### 2.1 v3.4 spec 全 element 継承
- T0''' 確定 5 条件 (継承)
- D-Day Phase 1'''-7''' (84 項目 / 6 hour) (継承)
- 13 KPI baseline (継承)
- rollback path 5 条件 (継承)
- Owner 拘束 1 min (D-Day GO 1 行 reply) (継承)

### 2.2 v3.4 → v3.5 追加 element (delta only)
| 追加 | 内容 |
|------|------|
| T+24h SOP 写像内蔵 | R30 file 412 行を写像 reference 化 |
| 30day baseline 統合 | weekly KPI 4 回 + monthly retro 1 回 timeline |
| post-launch external comms | twitter/blog/portfolio v4 timing |
| post-mortem template merge | T0'''+30d closeout 接続 |
| confidence 100% lock spec | GTC-11 actual PASS 後 lock public 化 |

---

## 3. T+24h SOP 写像 (R30 412 行 → v3.5 内蔵 reference)

### 3.1 4 Phase 1440 min 維持
| Phase | 区間 (date-free) | 項目数 | 13 KPI |
|-------|----------------|--------|--------|
| Phase 1 | T0'''+0h → +1h | 11 | KPI 1-13 baseline 確立 |
| Phase 2 | T0'''+1h → +6h | 11 | KPI 1-13 5h trend |
| Phase 3 | T0'''+6h → +12h | 11 | KPI 1-13 6h trend |
| Phase 4 | T0'''+12h → +24h | 11 | KPI 1-13 12h trend + final reply 1 min |
| **合計** | **24h** | **44** | **13 KPI 全件** |

### 3.2 13 KPI 一覧 (T+24h baseline)
1. latency p50 (< 50ms)
2. latency p95 (< 200ms)
3. availability (> 99.9%)
4. error rate (< 0.1%)
5. unique visitors (baseline 計測)
6. session duration (baseline 計測)
7. CTR (baseline 計測)
8. signup conversion (baseline 計測)
9. 1Password latency (< 100ms)
10. Slack notification latency (< 5s)
11. cost per request (< budget)
12. concurrent sessions (baseline 計測)
13. anomaly count (= 0)

### 3.3 異常時 rollback 5 条件 (継承)
| # | 条件 | 対応 |
|---|------|------|
| 1 | latency p95 > 500ms 連続 5 min | rollback 1 |
| 2 | availability < 99.5% 連続 5 min | rollback 1 |
| 3 | error rate > 1% 連続 5 min | rollback 1 |
| 4 | anomaly count > 3 連続 1h | rollback 2 |
| 5 | Owner manual rollback request | rollback 0 (即時) |

---

## 4. 30day baseline 統合 (T0'''+1d 〜 T0'''+30d)

### 4.1 weekly KPI aggregation (7 KPI / 4 回)
| weekly review | 区間 | 7 KPI 集約 |
|---------------|------|------------|
| #1 | T0'''+1d → +7d | latency / availability / error rate / unique / session / CTR / signup |
| #2 | T0'''+7d → +14d | 同上 (week-over-week diff) |
| #3 | T0'''+14d → +21d | 同上 (W3 trend) |
| #4 | T0'''+21d → +28d | 同上 (W4 trend) |

### 4.2 monthly retro (T0'''+28d → +30d)
- post-mortem template fill-in (R30 401 行 base)
- 7 KPI monthly aggregation
- DEC-019-092 lock 候補昇格
- closeout report 起票 (Marketing template + Dev W6-B post-mortem template merge / 推定 400-600 行)

### 4.3 Owner 拘束 (30day 期間)
- weekly review #1-4: 任意 0-1 min × 4 = 0-4 min
- monthly retro: 任意 0-5 min
- 合計 0-9 min (任意のみ / 強制 0 min)

---

## 5. post-launch external comms timing (新規 / v3.5 delta)

### 5.1 公開後 external comms スケジュール
| timing | media | content | confidence 連動 |
|--------|-------|---------|----------------|
| T0'''+0h | (内部のみ) | dashboard line 3 prepend | 99.9 → 100% lock |
| T0'''+1h | (内部のみ) | Slack #prj-019 通知 | 100% lock 確認 |
| T0'''+24h | twitter | thread (公開判定 / 5 min 草稿は別 file) | 100% lock public 化 |
| T0'''+7d | blog | week 1 retrospective | 100% lock 維持 |
| T0'''+14d | portfolio v4 | 実績反映 (Web-Ops 連動) | 100% lock 維持 |
| T0'''+30d | blog | 30day report (closeout) | 100% lock final |

### 5.2 5 min CEO ack 連動
- twitter thread / blog post 公開前: 5 min CEO ack 必須
- Review-W r31-5min-ceo-ack-spec.md と連動 (本 round 起票)
- ack 形式: dashboard line 3 prepend "twitter-thread-published" / "blog-post-published"

### 5.3 Owner 拘束 (external comms)
- 0 min (CEO ack で完遂 / Owner ack 不要)

---

## 6. post-mortem template merge 接続 (T0'''+30d)

### 6.1 template merge 対象
| template | 行数 | 由来 |
|----------|------|------|
| Marketing post-mortem template | 401 行 | R30 marketing-x-r30-post-mortem-template.md |
| Dev W6-B post-mortem template | 90 行 | R29 Dev-FFF |
| **merge 後 closeout report** | **推定 400-600 行** | **R32 Marketing-Z 起票** |

### 6.2 merge protocol
- Marketing template 8 section (継承)
- Dev W6-B 90 行 を section 4-5 (技術 retrospective) に挿入
- 7 KPI monthly aggregation を section 6 に追加
- DEC-019-092 lock を section 8 に追加

### 6.3 closeout report 起票 trigger
- T0'''+30d 完遂 → R32 Marketing-Z が起票
- CEO 確認 → Owner 公開 (任意 0-5 min)

---

## 7. confidence 100% lock spec 連動

### 7.1 100% lock 確定 trigger
- GTC-11 D-Day GO actual PASS = 84/84 PASS verify
- T0''' 確定 5 条件 ALL true
- 5 file 無改変 confirm

### 7.2 100% lock public 化 timeline
| state | 内容 |
|-------|------|
| T0'''+0h (D-Day GO) | confidence 99.9% → 100% lock 内部確定 |
| T0'''+24h (T+24h GREEN) | 100% lock 維持 verify |
| T0'''+24h+α (twitter) | 100% lock public 化 (CEO ack 後) |
| T0'''+30d (closeout) | 100% lock final 確定 |

### 7.3 別 file 連動
- `marketing-y-r31-confidence-100-lock-spec.md` (本 round 起票) と連動
- `review-w-r31-5min-ceo-ack-spec.md` と連動

---

## 8. 制約遵守 verification

| 制約 | 結果 |
|------|------|
| v3.0 / v3.1-delta / v3.2-delta-candidate / v3.2 / v3.4 5 file 無改変 | PASS |
| v3.5 = 新規 file delta only | PASS |
| date-free 厳守 (T0''' = Owner D-Day GO reply 受領時刻) | PASS |
| 固定日付 0 件 | PASS |
| API call $0 | PASS |
| 副作用 0 (新規 file 1 件のみ) | PASS |
| 絵文字 0 | PASS |
| Owner 拘束 0 min (本軸内) | PASS |
| fix forward-only | PASS |
| Heroicons 参照のみ (UI 実装変更なし) | PASS |
| 報告書 Markdown のみ / コード変更ゼロ | PASS |

---

## 9. R31 → R32 引継

### 9.1 引継 #1: T0''' 受領後 v3.5 即時実行
- 本 file の D-Day Phase 1'''-7''' + T+24h SOP + 30day timeline を 0 改変で実機実行
- R32 Marketing-Z が actual record + 議決 confirmed lock

### 9.2 引継 #2: closeout report 起票 trigger (T0'''+30d)
- 本 file の post-mortem merge protocol を 0 改変で起票
- R32 Marketing-Z が 400-600 行 起票

### 9.3 引継 #3: v3.6 不要 verify
- 本 file = 最終確定版 → R32 で v3.6 起票不要
- delta only 維持 / fix forward-only

---

## 10. 結語

launch-day v3.5 date-free 完成版起票完遂. v3.4 date-free + R30 T+24h SOP + 30day baseline + external comms + post-mortem merge + 100% lock spec 統合最終版確立. 5 file absolute 無改変 / delta only / fix forward-only / R32+α 不要想定.

副作用 0 / API call $0 / 絵文字 0 / Owner 拘束 0 min (本軸内) / 固定日付 0 件 / date-free 厳守.

—— Marketing-Y / 2026-05-06 / R31 9 並列 7 軸目 / v3.5 最終確定版 / 100% lock path 確立
