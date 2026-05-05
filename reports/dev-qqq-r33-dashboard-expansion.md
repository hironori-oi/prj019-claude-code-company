# Dev-QQQ R33 Task 2/4 — dashboard expansion + W6+W7+W8 integration

PRJ-019 Open Claw "Clawbridge" / Round 33 / Dev-QQQ
位置付け: R32 Dev-PPP dashboard mode='live' 拡張 (line 1-186) の 60day rolling window + alert escalation 拡張、および W8 layer 統合 test 物理化
版: v1.0
連動 file:
- dashboard: `app/dashboard/page.tsx` (R32 line 1-186 absolute 不変保持 + R33 line 188- append-only)
- integration test: `app/openclaw-runtime/src/__tests__/w6-w7-w8-integration.test.ts` (18 case)

---

## §0 サマリ (200 字以内)

dashboard/page.tsx R31 line 1-115 + R32 line 117-186 を absolute 不変保持し、R33 line 188- に 60day rolling window 7 KPI 軸 + alert escalation routing visualization を append-only で追加。w6-w7-w8-integration.test.ts (18 case) を新規作成し W6 wire / W7 (A/B/C/D) / W8 (E long-term-metrics) cross-layer end-to-end を verify。

---

## §1 dashboard 拡張 7 KPI 軸 (60day rolling)

| # | KPI | 単位 | severity 判定 |
|---|---|---|---|
| 1 | rolling_p95_latency_ms | ms | (Dev-OOO threshold-detector 連動想定) |
| 2 | drift_pct | % | <10 ok / 10-25 warn / >25 critical |
| 3 | sustained_breach_streak_days | day | 0 ok / 2-3 warn / >3 critical |
| 4 | recovery_latency_days | day | (R29 DEC-082 仕様継承) |
| 5 | sla_breach_rate_90d_pct | % | (W7-E sla-tracker 連動想定) |
| 6 | cost_slope_jpy_per_day | JPY/day | (W7-E cost-trend 連動想定) |
| 7 | routing_p1_open_count | count | (W7-D auto-routing 連動想定) |

severity 派生関数 (純関数):
- `deriveSeverityForDrift(pct)` → ok/warn/critical
- `deriveSeverityForBreachStreak(days)` → ok/warn/critical

---

## §2 alert escalation routing visualization

3 lane (P1/P2/P3) を `EscalationRow` component で描画:

| priority | queue | sla_hours | hitl_required |
|---|---|---|---|
| P1 | ceo_ack_flow | 4 | true |
| P2 | pm_ratification_queue | 24 | true |
| P3 | knowledge_backlog | 168 | false |

→ R33 Dev-RRR auto-routing.ts の `QUEUE_BY_PRIORITY` / `SLA_HOURS_BY_PRIORITY` 仕様と完全整合。

---

## §3 不変保持確認 (line 1-186 absolute)

| 区間 | 由来 | LOC | status |
|---|---|---|---|
| 1-115 | R31 Dev-LLL initial | 115 | 不変 (md5 verified) |
| 117-186 | R32 Dev-PPP append-only | 70 | 不変 (md5 verified) |
| 188- | R33 Dev-QQQ append-only | 約 130 | new |

`__r32_internal__` export は不変、`__r33_internal__` を新規追加 (mock data + severity 派生関数 export)。

---

## §4 w6-w7-w8-integration.test.ts (18 case)

| # | 層 | 検証内容 |
|---|---|---|
| 1 | W6+W7-B | aggregateWindow 30day total events |
| 2 | W7-D chain | 健康ストリーム → P3 dispatch / next R34 |
| 3 | W7-D chain | critical events → P1 escalation |
| 4 | W7-D routing | P1 → ceo_ack_flow / 4h SLA / hitl=true |
| 5 | W7-D routing | P3 → knowledge_backlog / hitl=false |
| 6 | W7-D summary | summarizeChain priority/next 含有 |
| 7 | W7-D summary | summarizeRouting queue/sla 含有 |
| 8 | W8 sla-tracker | 90day window breach=1 / recovery=1 |
| 9 | W8 sla-tracker | isSlaHealthy true |
| 10 | W8 cost-trend | mean / forecast non-null |
| 11 | W8 cost-trend | slope ≥ 0 (rising) |
| 12 | W8 quarter-window | kind 4 軸分類 |
| 13 | W8 quarter-window | severity warn=1 |
| 14 | W8 quarter-window | summarizeQuarter window/total 含有 |
| 15 | cross-layer | motion_id flow chain → routing |
| 16 | cross-layer | SLA breach → quarter severity warn |
| 17 | retrospective | KPT keep weight ≥ 1 |
| 18 | end-to-end | chain + routing + sla + cost + quarter 5 layer 統合 |

---

## §5 制約遵守

| 項目 | status |
|---|---|
| 副作用 | 0 (pure function / mock data only) |
| API call | $0 |
| TS6059 | 0 件継承 |
| R31 line 1-115 不変 | verified |
| R32 line 117-186 不変 | verified |
| 既存 src 無改変 (W6 wire / W7-A/B/C / W7-D / W8) | import only |
| 絵文字 | 0 |
| 物理化方式 | dashboard append-only + 新規 test file |
| harness +18 想定 | integration 18 case |

---

## §6 後続接続点

- mock data (`MOCK_60D_KPI` / `MOCK_ESCALATION_LANES`) → R34+ で `getKpiSnapshotLive` 同様 collector injection で live 化想定 (env-gate `OPENCLAW_KPI_LIVE=2` 等の段階追加候補).
- W7-E sla-tracker / cost-trend の 90day window 値を 60day rolling と並べて表示する R34 dashboard v3 想定.
- DEC-088 (R34 議決候補): "60day rolling KPI 7 軸 + escalation lane" を正式 KPI baseline として固定する motion 起案候補.
