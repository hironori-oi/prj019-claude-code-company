# Dev-MMM R31 — W7-B Post-Launch Monitoring 30day Spec 詳細

最終更新: 2026-05-06 W0-Week2 R31
担当: Dev 部門 R31 Dev-MMM (9 並列 9 軸目)
位置付け: PRJ-019 Open Claw "Clawbridge" / W7-B post-launch monitoring 30day spec / 13 KPI × 4 統合経路 × 3 severity routing × 3 aggregation
副作用: 0 / API call: $0 / 物理 deploy: 0 件 / mock injection 厳守

---

## §0 サマリ

- 13 KPI × integration 4 経路 (snapshot / threshold / breach / recovery)
- alert routing 3 severity (Slack info / PagerDuty warn / SMTP critical)
- aggregation 3 種 (daily / weekly / monthly)
- 期間: post-launch D+0 〜 D+30 (30 day)
- spec 行数想定: ≤280 行 (本書)

---

## §1 13 KPI 一覧

| # | KPI | 単位 | 閾値 (warn) | 閾値 (crit) | 計測元 |
|---|-----|------|-------------|-------------|--------|
| 1 | error_rate | % | >0.5 | >2.0 | runtime log |
| 2 | p95_latency | ms | >800 | >2000 | health route |
| 3 | p99_latency | ms | >1500 | >5000 | health route |
| 4 | uptime_pct | % | <99.5 | <99.0 | canary |
| 5 | canary_fail_count | 件/h | >2 | >5 | canary helper |
| 6 | rollback_invoked | bool | true | (n/a) | rollback handler |
| 7 | session_count | 件/d | <baseline*0.5 | <baseline*0.2 | runtime metrics |
| 8 | api_cost_usd | $/d | >50 | >200 | mock budget |
| 9 | dec_breach_count | 件/d | >0 | >2 | DEC monitor |
| 10 | sec_yml_drift | bool | true | (n/a) | md5 verify |
| 11 | gtc_trigger_count | 件/d | >0 (info) | >3 (crit) | GTC monitor |
| 12 | hitl_consent_pending | 件 | >5 | >20 | HITL queue |
| 13 | knowledge_pii_redaction_fail | 件/d | >0 | >2 | redaction guard |

---

## §2 integration 4 経路

### §2.1 snapshot 経路
- 周期: 5 min interval
- 対象: 全 13 KPI 値の現在値スナップショット
- 出力: `monitoring/snapshots/{yyyy-mm-dd}/{HHmm}.json`
- 副作用: 0 (mock storage)

### §2.2 threshold 経路
- 周期: snapshot ごとに評価
- 対象: 13 KPI × (warn / crit) 閾値判定
- 出力: threshold-event log
- 連動: §3 alert routing

### §2.3 breach 経路
- 発火条件: threshold crit 越え + 連続 2 snapshot 持続
- 出力: breach-event log + alert routing trigger
- de-bounce: 5 min (重複抑止)

### §2.4 recovery 経路
- 発火条件: breach 後、threshold 内に 3 snapshot 連続復帰
- 出力: recovery-event log + alert close
- post-mortem trigger: marketing-x post-mortem template 自動生成

---

## §3 alert routing 3 severity

### §3.1 Slack info (severity = info)
- 対象 event: snapshot 異常傾向 (warn 未達 だが直前比 +30%)
- 経路: Slack #monitoring-info channel (mock webhook)
- 通知頻度上限: 1 件 / 30 min
- on-call 拘束: なし (best-effort)

### §3.2 PagerDuty warn (severity = warn)
- 対象 event: threshold warn 越え
- 経路: PagerDuty service P-OPENCLAW-WARN (mock service key)
- 通知頻度上限: 1 件 / 15 min
- on-call 拘束: 1 次対応 (15 min 以内 ack)

### §3.3 SMTP critical (severity = critical)
- 対象 event: breach event (crit 閾値 + 持続)
- 経路: SMTP → on-call@example.com (mock SMTP)
- 通知頻度上限: 即時 (de-bounce 5 min 内)
- on-call 拘束: 5 min 以内 ack 必須 (DEC-019-068 連動)
- escalation: 5 min ack 不在 → CEO + Owner 通知

---

## §4 aggregation 3 種

### §4.1 daily aggregation
- 周期: 毎日 00:05 UTC
- 対象: 当日 0:00-23:59 の全 KPI snapshot 集約
- 統計: count / mean / median / p95 / p99 / min / max
- 出力: `monitoring/daily/{yyyy-mm-dd}.json`
- 連動: D-1 / D-7 / T+24h marketing 連動 evidence

### §4.2 weekly aggregation
- 周期: 月曜 00:10 UTC
- 対象: 直近 7 日 daily aggregate を週単位で再集約
- 統計: WoW (Week-over-Week) % 変動 + trend
- 出力: `monitoring/weekly/{yyyy-www}.json`
- 連動: PM Phase 移行判定 (W5 → W6 → W7)

### §4.3 monthly aggregation
- 周期: 1 日 00:30 UTC
- 対象: 直近 30 日 daily aggregate
- 統計: 30 day SLA 達成率 / breach 件数 / recovery time 平均
- 出力: `monitoring/monthly/{yyyy-mm}.json`
- 連動: post-launch 30day 完遂判定 (β 終了判定)

---

## §5 D+0 〜 D+30 timeline

| 期間 | 主観点 | KPI 重点 | aggregation |
|------|--------|----------|-------------|
| D+0 | launch | error_rate / uptime / p95 | daily |
| D+1 | 初日振り返り | session_count / canary_fail | daily |
| D+7 | 1 週間 | WoW trend / breach count | weekly |
| D+14 | 中盤 | api_cost / hitl_pending | weekly |
| D+21 | 後半 | dec_breach / sec_yml_drift | weekly |
| D+30 | 完遂判定 | SLA 達成率 / 30 day total | monthly |

---

## §6 mock injection 厳守 / 副作用 0

- 全 alert routing は mock webhook / mock service key / mock SMTP
- 物理 fetch / 物理 SMTP send / 物理 PagerDuty trigger: **0 件**
- 全 snapshot は memory store + 想定 file path のみ (実 write 0 件)
- API call $0 厳守

---

## §7 harness 連動 case 内訳 (W7-B verification 18 case)

| # | 観点 | case 数 |
|---|------|---------|
| 1 | 13 KPI × snapshot 経路 | 4 (代表 KPI) |
| 2 | threshold 経路 (warn/crit) | 4 |
| 3 | breach 経路 (de-bounce 含む) | 3 |
| 4 | recovery 経路 (post-mortem trigger) | 2 |
| 5 | Slack info routing | 1 |
| 6 | PagerDuty warn routing | 1 |
| 7 | SMTP critical routing + 5 min ack | 1 |
| 8 | daily / weekly / monthly aggregation | 2 |
| **計** | | **18** |

---

## §8 R30 着地状態継承

- W7 3 波 spec 計 2505 行継承 (R30 dev-jjj)
- W6 完遂宣言 PASS 継承 (R28)
- DEC-019-068 5 trigger ALL 達成継承 (R28)

---

## §9 結論

- W7-B post-launch monitoring 30day spec 完成
- 13 KPI × 4 経路 × 3 severity × 3 aggregation 網羅
- 副作用 0 / API call $0 / 物理 deploy 0 件
- harness 18 case 連動 ready
- R31 Round 完遂条件達成

---

(End of dev-mmm-r31-w7-b-monitoring-30day-spec.md)
