# Web-Ops-R R31 GTC-11 Actual Exec Runsheet (D-Day)

**作成日**: 2026-05-06 (PRJ-019 Round 31, Web-Ops-R 軸)
**target trigger**: GTC-11 (Open Claw Clawbridge GA full production rollout)
**継承元**: web-ops-q-r30-stage-3-execution-runsheet.md (532 行) + Marketing-W v3.4 D-Day playbook
**date-free 化**: D-Day = `T0`、各 phase = `T0+Δ` で表記（実 GO reply 受領時に Owner が日付埋込）
**前提**: OWN-W5-PROD-ACK 完了 + canary writer + dispatcher 注入で 副作用 0 / 物理 deploy 0 / API call $0 継承

---

## 0. 全体サマリ (top-of-page)

| 項目 | 値 |
|------|-----|
| GO reply 受領 → GA 100% 完了 | 累計 285 min (4 段階 + buffer 含む) |
| 7 phase 84 項目 | Phase 1〜7 (各 12 項目想定 / 合計 84 cell) |
| canary 4 段階 | 5% (15 min) → 25% (30 min) → 50% (60 min) → 100% (180 min) |
| KPI dashboard 軸 | latency (p50/p95/p99) + error rate + availability + cost + custom |
| abort gate (auto rollback) | 4 種 (latency / error / availability / cost) |
| manual gate | 5 件 (Owner 立会 4-6 min) |
| Owner action 累計 | 7-10 min (OWN-W5 1 + D-7 0-1 + D-1 1 + D-Day GO 1 + 立会 4-6) |
| 副作用 | 0 (canary writer + dispatcher injected) |

---

## 1. Phase 1: Pre-flight (T0-15min 〜 T0)

| # | 項目 | actor | duration | output | gate |
|---|------|-------|----------|--------|------|
| P1-01 | secrets rotate verify | dispatcher | 1m | hash diff | auto |
| P1-02 | DNS TTL 60s 確認 | dispatcher | 1m | TTL value | auto |
| P1-03 | edge config snapshot | dispatcher | 2m | snapshot id | auto |
| P1-04 | KPI baseline capture | dispatcher | 2m | baseline JSON | auto |
| P1-05 | rollback runbook 4 階層 ready | dispatcher | 1m | runbook id | auto |
| P1-06 | Owner GO reply 受領確認 | Owner | 1m | reply text | manual |
| P1-07 | Sentry alert channel live | dispatcher | 1m | webhook 200 | auto |
| P1-08 | Vercel deploy URL 予約 | dispatcher | 1m | URL | auto |
| P1-09 | post-mortem template ready | dispatcher | 1m | template id | auto |
| P1-10 | stakeholder ping (内部) | dispatcher | 1m | ack count | auto |
| P1-11 | abort gate trigger 4 種 armed | dispatcher | 2m | armed status | auto |
| P1-12 | Phase 2 移行可否 sign | Owner立会 | 1m | sign | manual gate #1 |

**Phase 1 完了条件**: 12/12 PASS + manual gate #1 sign

---

## 2. Phase 2: Canary 5% (T0 〜 T0+15min)

| # | 項目 | actor | duration | gate |
|---|------|-------|----------|------|
| P2-01 | traffic shift 5% start | dispatcher | 1m | auto |
| P2-02 | latency p50 sample (5 min) | dispatcher | 5m | < 50ms |
| P2-03 | latency p95 sample | dispatcher | 5m | < 200ms |
| P2-04 | latency p99 sample | dispatcher | 5m | < 500ms |
| P2-05 | error rate (5 min window) | dispatcher | 5m | < 0.1% |
| P2-06 | availability sample | dispatcher | 5m | > 99.9% |
| P2-07 | cost burn rate | dispatcher | 5m | < budget |
| P2-08 | custom metric (CTA click) | dispatcher | 5m | baseline ±5% |
| P2-09 | abort gate trigger check | dispatcher | 1m | 4/4 green |
| P2-10 | KPI dashboard 5 軸 PASS sign | dispatcher | 1m | 5/5 PASS |
| P2-11 | Sentry error 0 件確認 | dispatcher | 1m | 0 |
| P2-12 | Phase 3 移行可否 sign | Owner立会 | 1m | manual gate #2 |

**Phase 2 完了条件**: 12/12 PASS + manual gate #2 sign / abort 発火 0

---

## 3. Phase 3: Canary 25% (T0+15min 〜 T0+45min)

| # | 項目 | actor | duration | gate |
|---|------|-------|----------|------|
| P3-01 | traffic shift 25% | dispatcher | 1m | auto |
| P3-02 | latency p50/p95/p99 sample (15 min) | dispatcher | 15m | thresholds |
| P3-03 | error rate (15 min) | dispatcher | 15m | < 0.1% |
| P3-04 | availability | dispatcher | 15m | > 99.9% |
| P3-05 | cost burn (extrapolated) | dispatcher | 15m | < budget |
| P3-06 | custom metric drift | dispatcher | 15m | ±5% |
| P3-07 | concurrent user load test | dispatcher | 5m | pass |
| P3-08 | DB connection pool | dispatcher | 5m | < 70% |
| P3-09 | CDN hit rate | dispatcher | 5m | > 90% |
| P3-10 | abort gate 4 種 green | dispatcher | 1m | 4/4 |
| P3-11 | KPI 5 軸 PASS sign | dispatcher | 1m | 5/5 |
| P3-12 | Phase 4 移行可否 sign | Owner立会 | 1m | manual gate #3 |

**Phase 3 完了条件**: 12/12 PASS + manual gate #3 sign

---

## 4. Phase 4: Canary 50% (T0+45min 〜 T0+105min)

| # | 項目 | actor | duration | gate |
|---|------|-------|----------|------|
| P4-01 | traffic shift 50% | dispatcher | 1m | auto |
| P4-02 | latency 3 軸 (30 min sustained) | dispatcher | 30m | thresholds |
| P4-03 | error rate sustained | dispatcher | 30m | < 0.1% |
| P4-04 | availability sustained | dispatcher | 30m | > 99.9% |
| P4-05 | cost projection (1h, 24h) | dispatcher | 30m | < budget |
| P4-06 | custom metric stability | dispatcher | 30m | ±5% |
| P4-07 | edge cache warmup verify | dispatcher | 10m | pass |
| P4-08 | DB write contention | dispatcher | 10m | none |
| P4-09 | external API rate limit | dispatcher | 10m | < 80% |
| P4-10 | log aggregation healthy | dispatcher | 5m | pass |
| P4-11 | KPI 5 軸 PASS sign | dispatcher | 1m | 5/5 |
| P4-12 | Phase 5 移行可否 sign | Owner立会 | 1m | manual gate #4 |

**Phase 4 完了条件**: 12/12 PASS + manual gate #4 sign

---

## 5. Phase 5: GA 100% (T0+105min 〜 T0+285min)

| # | 項目 | actor | duration | gate |
|---|------|-------|----------|------|
| P5-01 | traffic shift 100% | dispatcher | 1m | auto |
| P5-02 | latency 3 軸 (180 min sustained) | dispatcher | 180m | thresholds |
| P5-03 | error rate sustained | dispatcher | 180m | < 0.1% |
| P5-04 | availability sustained | dispatcher | 180m | > 99.9% |
| P5-05 | cost final 24h projection | dispatcher | 60m | < budget |
| P5-06 | custom metric final | dispatcher | 60m | ±5% |
| P5-07 | full traffic load profile | dispatcher | 30m | profile match |
| P5-08 | DB final integrity check | dispatcher | 30m | pass |
| P5-09 | external integrations smoke | dispatcher | 15m | 100% |
| P5-10 | abort gate 4 種 green sustained | dispatcher | 180m | 4/4 |
| P5-11 | KPI dashboard 5 軸 final | dispatcher | 1m | 5/5 PASS |
| P5-12 | GA 100% 完了 sign | Owner立会 | 1m | manual gate #5 |

**Phase 5 完了条件**: 12/12 PASS + manual gate #5 sign + abort 発火 0

---

## 6. Phase 6: Post-GA hand-off (T0+285min 〜 T0+330min)

| # | 項目 | actor | duration | gate |
|---|------|-------|----------|------|
| P6-01 | rollback stage 4 (post-GA) armed | dispatcher | 5m | armed |
| P6-02 | 24h monitoring window 開始 | dispatcher | 1m | started |
| P6-03 | post-mortem hook 起動 | dispatcher | 2m | hooked |
| P6-04 | Sentry alert threshold 切替 | dispatcher | 2m | switched |
| P6-05 | KPI dashboard public mode | dispatcher | 2m | public |
| P6-06 | INDEX 関連 artifact 32→38 件想定 | dispatcher | 1m | logged |
| P6-07 | W7-B SOP 連動確認 | dispatcher | 2m | linked |
| P6-08 | Marketing post-mortem template hand-off | dispatcher | 2m | handed |
| P6-09 | Sec/QA/Dev sign-off 集約 | dispatcher | 2m | 集約 |
| P6-10 | CEO 報告 trigger | dispatcher | 1m | triggered |
| P6-11 | dashboard 【最新】marker 更新 | dispatcher | 1m | updated |
| P6-12 | Phase 7 (closure) 移行 sign | dispatcher | 1m | auto |

---

## 7. Phase 7: Closure (T0+330min)

| # | 項目 | actor | duration |
|---|------|-------|----------|
| P7-01 | GTC-11 trigger ALL 達成宣言 | dispatcher | 1m |
| P7-02 | GA progression actual record finalize | dispatcher | 2m |
| P7-03 | deviation 7 軸 7/7 PASS finalize | dispatcher | 1m |
| P7-04 | rollback stage 4 spec finalize | dispatcher | 1m |
| P7-05 | Owner action 累計 7-10 min 範囲 confirm | dispatcher | 1m |
| P7-06 | post-launch SOP (W7-B) 連動 active | dispatcher | 1m |
| P7-07 | INDEX-v17 想定 + 168→200+ entries | dispatcher | 2m |
| P7-08 | Round 32 引継 spec 適用 | dispatcher | 2m |
| P7-09 | dashboard 5 軸 final lock | dispatcher | 1m |
| P7-10 | Owner 拘束 0 分 confirm | dispatcher | 1m |
| P7-11 | 副作用 0 / API $0 / 物理 deploy 0 confirm | dispatcher | 1m |
| P7-12 | GTC-11 完遂着地 sign | dispatcher | 1m |

---

## 8. KPI Dashboard 5 軸 (running spec)

| 軸 | metric | sample window | PASS threshold |
|---|--------|---------------|----------------|
| latency | p50 / p95 / p99 | 5min rolling | < 50 / 200 / 500 ms |
| error rate | 5xx + uncaught | 5min rolling | < 0.1% |
| availability | uptime | 5min rolling | > 99.9% |
| cost | $/hr burn | 1h rolling | < budget (TBD) |
| custom | CTA click rate / signup conv | 15min rolling | baseline ±5% |

---

## 9. Abort Gate Trigger 4 種 (auto rollback)

| # | trigger | threshold | action |
|---|---------|-----------|--------|
| AG-1 | latency p95 急増 | > 200ms × 3 連続 | 自動 rollback stage N → N-1 |
| AG-2 | error rate spike | > 1% × 1 sample | 自動 rollback (即時 stage N → 0) |
| AG-3 | availability dip | < 99.5% × 1 sample | 自動 rollback (即時 stage N → 0) |
| AG-4 | cost burn 急増 | > 2× projected × 5 min | 自動 rollback + budget alert |

---

## 10. Manual Gate 5 件

| # | gate | timing | Owner duration |
|---|------|--------|----------------|
| MG-1 | Phase 1 → Phase 2 | T0 | 1 min |
| MG-2 | Phase 2 → Phase 3 | T0+15m | 1 min |
| MG-3 | Phase 3 → Phase 4 | T0+45m | 1 min |
| MG-4 | Phase 4 → Phase 5 | T0+105m | 1 min |
| MG-5 | Phase 5 → Phase 6 (GA 完了) | T0+285m | 1 min |

合計: 5 min Owner 立会（連続でない / 各回 1 min ピンポイント）

---

## 11. Owner Action 累計 (7-10 min 範囲)

| action | 必須/任意 | duration |
|--------|-----------|----------|
| OWN-W5-PROD-ACK | 必須 | 1 min |
| D-7 readiness 任意 | 任意 | 0-1 min |
| D-1 共同 sign | 必須 | 1 min |
| D-Day GO reply | 必須 | 1 min |
| 立会 manual gate × 5 | 必須 | 5 min (= MG-1〜5 合計) |
| 余裕 buffer | - | 0-1 min |

**累計**: 7 min (最小) 〜 10 min (上限)

---

## 12. 7 hour 6 phase mapping (date-free)

| 時間 (T0+) | Phase | duration | Owner action |
|------------|-------|----------|--------------|
| -15m 〜 0 | Phase 1: Pre-flight | 15 min | GO reply 1m + MG-1 1m |
| 0 〜 15m | Phase 2: Canary 5% | 15 min | MG-2 1m |
| 15m 〜 45m | Phase 3: Canary 25% | 30 min | MG-3 1m |
| 45m 〜 105m | Phase 4: Canary 50% | 60 min | MG-4 1m |
| 105m 〜 285m | Phase 5: GA 100% | 180 min | MG-5 1m |
| 285m 〜 330m | Phase 6: hand-off | 45 min | (任意立会) |
| 330m | Phase 7: Closure | sign-off | (sign のみ) |

合計: ~5h30m（buffer 込み 7h 想定）

---

## 13. 副作用 0 / 実 deploy 0 確認

- canary writer + dispatcher 注入により全項目 dry-run / simulated 実行
- 実 deploy は GTC-11 D-Day Owner GO reply 受領後のみ発火
- 本 runsheet 自体は spec / 物理 deploy 0 件
- API call $0 継承（mock + recording 利用）

---

## 14. 継承マトリクス (R30 → R31)

| 項目 | R30 (web-ops-q) | R31 (web-ops-r) |
|------|------------------|------------------|
| 観点 cell | 25/25 stage 3 | 84/84 7-phase |
| canary 段階 | 1 段階 (stage 3) | 4 段階 (5/25/50/100) |
| KPI 軸 | 3 (latency/error/availability) | 5 (+ cost + custom) |
| abort gate | 3 種 | 4 種 |
| manual gate | 1 件 | 5 件 |
| Owner 拘束 | 0 分 | 0 分 (立会 5 min は累計内) |

---

## 15. 出力 confirm

- 本 file: `web-ops-r-r31-gtc-11-exec-runsheet.md` (≤550 行)
- ペア file: `web-ops-r-r31-ga-progression-actual.md` (simulated record)
- ペア file: `web-ops-r-r31-rollback-stage-4-spec.md` (post-GA)
- Owner card: `gtc-11-immediate-trigger.md`
- 引継 spec: `web-ops-r-r31-r32-handover-spec.md`
- summary: `web-ops-r-r31-summary.md`

---

(終端)
