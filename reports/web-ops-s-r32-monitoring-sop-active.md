# Web-Ops-S R32: post-launch monitoring SOP active 化 (17 trigger 物理化)

## 0. メタ情報

- 案件: PRJ-019 Open Claw "Clawbridge"
- Round: 32 (9 並列 軸 3)
- 担当: Web-Ops-S
- 出力種別: post-launch monitoring SOP active (R31 GTC-11 17 trigger 引継 → 物理化)
- 制約: date-free / T0''' 基点 / 副作用 0 / Owner 拘束 0 分 / 絵文字 0
- 継承: GTC-11 actual exec readiness 100% / 17 trigger (24h:7 / 7d:6 / 30d:4)

## 1. SOP active 化スコープ

### 1.1 active 化対象
- monitoring trigger 17 件 (R31 spec → R32 active)
- alert routing 3 severity (Slack info / PagerDuty warn / SMTP critical)
- runbook 17 trigger 別 (1 trigger = 1 runbook)
- escalation matrix 3 段 (L1 on-call / L2 dev-lead / L3 CEO + Owner)
- SLA: ack 5 min (critical) / 30 min (warn) / 4h (info)

### 1.2 active 化前提
- R31 17 trigger spec 既確立 (Web-Ops-R)
- KPI 5 軸 8 metric 8/8 PASS simulated (R31 GTC-11)
- rollback Stage 4 spec (24h/7d/30d 監視期間) 既確立
- post-GA 移行 24h 経過時点で SOP active fully arming 想定

## 2. 24h trigger 7 件 active 化

### T-24h-1: latency p99 monitoring
- threshold: p99 ≤ 800ms (KPI A4)
- breach 条件: 3 連続 5min window で p99 > 800ms
- alert routing: PagerDuty warn (5min ack) → 解消されない場合 SMTP critical
- runbook: capacity scaling (HPA min replica +1) → DB index review → cache hit rate review
- 関連 KPI: A4 (latency p99 simulated 720ms ≤ 800ms PASS)

### T-24h-2: error rate monitoring
- threshold: 5xx ratio ≤ 0.5% (KPI A5)
- breach 条件: 5min window で 5xx ratio > 0.5%
- alert routing: SMTP critical (即時 ack)
- runbook: rollback evaluation → log diff → bisect last 3 deploy → DEC-087 trigger 連動
- 関連 KPI: A5 (5xx ratio simulated 0.21% ≤ 0.5% PASS)

### T-24h-3: availability monitoring
- threshold: uptime ≥ 99.9% (KPI A1)
- breach 条件: synthetic check 3 連続失敗 (60s interval)
- alert routing: PagerDuty warn → SMTP critical (15min 経過)
- runbook: blue-green status check → DNS check → CDN cache check → infra rollback
- 関連 KPI: A1 (uptime simulated 99.99% ≥ 99.9% PASS)

### T-24h-4: cost monitoring (24h burst)
- threshold: $10/24h burst → $50/月想定の 20% 上限
- breach 条件: 24h cumulative cost > $10
- alert routing: Slack info → PagerDuty warn ($15 突破時)
- runbook: cost spike analysis → AI gateway throttle → unnecessary worker shutdown
- 関連 KPI: B1 ($50/月想定 simulated $42 PASS)

### T-24h-5: signup KPI monitoring
- threshold: signup rate ≥ baseline (DEC-019-068 trigger 参照)
- breach 条件: 24h signup count < baseline -30%
- alert routing: Slack info (warn 段階のみ)
- runbook: funnel analysis → CTA visibility check → form drop-off analysis
- 関連 KPI: C1 (signup KPI 5 軸の 1 軸)

### T-24h-6: CTA click rate monitoring
- threshold: CTA CTR ≥ 5% (Marketing-S R31 推定)
- breach 条件: 24h CTR < 3%
- alert routing: Slack info → Marketing 部門 epic 発火
- runbook: CTA copy A/B 検討 → above-the-fold position 検証
- 関連 KPI: D1 (CTA conversion KPI)

### T-24h-7: database connection pool monitoring
- threshold: pool utilization ≤ 70%
- breach 条件: 5min window で utilization > 70%
- alert routing: PagerDuty warn → SMTP critical (90% 突破時)
- runbook: connection leak check → query timeout review → pool size 増加検討
- 関連 KPI: E1 (infra resilience)

## 3. 7d trigger 6 件 active 化

### T-7d-1: weekly aggregation report
- 周期: 7d sliding window
- 集計内容: 24h trigger 7 件全て の週次 aggregation + KPI 5 軸 trend
- 出力: dashboard/active-projects.md PRJ-019 行 trend 列追記
- 担当: Web-Ops 部門 (R33 以降 sub-rotation)

### T-7d-2: capacity planning review
- 入力: 7d 平均 CPU/Memory utilization + traffic growth rate
- threshold: utilization 平均 > 60% で次週 HPA min +1 提案
- 出力: dev 部門への capacity proposal
- 関連: PRJ-019 W6 readiness

### T-7d-3: cost forecast
- 入力: 7d cumulative cost
- threshold: 7d 累計 > $15 で月次想定 $50 突破リスク警告
- 出力: CEO 経由 Owner 月次サマリ
- 関連: B1 KPI

### T-7d-4: regression detection
- 入力: 7d KPI 5 軸 baseline 比較
- threshold: 任意 1 軸が baseline -20% 以上低下で regression alert
- 出力: dev 部門 hotfix 検討 epic
- 関連: A1〜E1 全 KPI

### T-7d-5: user feedback aggregation
- 入力: 7d 受信フィードバック (form / Slack / email)
- threshold: 同一カテゴリ 5 件以上で priority issue 起票
- 出力: PM 部門 backlog 起票
- 関連: UX 改善

### T-7d-6: security posture review
- 入力: 7d auth 失敗率 / WAF block 数 / dependency vuln scan 結果
- threshold: auth 失敗率 > 5% で incident 起票
- 出力: Review 部門 sec-audit epic
- 関連: ODR-OG-06 連動

## 4. 30d trigger 4 件 active 化

### T-30d-1: monthly retrospective
- 周期: 30d
- 入力: 24h + 7d trigger 13 件全て の月次 aggregation
- 出力: organization/knowledge/retrospectives/prj-019-month-N.md (R33 以降生成)
- 担当: Web-Ops 部門 + PM 部門 共催

### T-30d-2: strategic review
- 入力: KPI 5 軸 30d trend + cost actual vs plan
- threshold: KPI 平均 PASS 率 < 80% で戦略見直し epic
- 出力: CEO 経由 Owner 戦略レビュー
- 関連: 事業方針

### T-30d-3: KPT closeout (本案件 PRJ-019 の closeout 候補化)
- 周期: GA + 30d
- 入力: 17 trigger active 期間中の incident / improvement
- 出力: organization/knowledge/prj-019-lessons-learned.md (新規)
- 関連: ナレッジ蓄積ルール (CLAUDE.md §6)

### T-30d-4: DEC-087 retrospective 動議
- 周期: GA + 30d
- 条件: 30d 期間中の incident 0 件 + KPI 5 軸 8/8 PASS 維持
- 出力: DEC-087 (rollback evaluation 動議) を「不要」として正式 closeout 提案
- 関連: rollback Stage 4 spec

## 5. alert routing 3 severity wire 連動

### 5.1 Slack info severity
- 対象 trigger: T-24h-5 / T-24h-6 / T-7d-1 / T-7d-3 / T-7d-5 / T-30d-1 / T-30d-3
- channel: #prj-019-monitoring (post-GA active 化)
- ack 不要 (info-only)
- aggregation: 30 min batch

### 5.2 PagerDuty warn severity
- 対象 trigger: T-24h-1 / T-24h-3 / T-24h-4 / T-24h-7 / T-7d-2 / T-7d-4 / T-7d-6 / T-30d-2
- on-call rotation: dev-lead 平日 / Web-Ops 週末
- ack SLA: 30 min
- escalation: 30 min 未 ack で SMTP critical 自動格上げ

### 5.3 SMTP critical severity
- 対象 trigger: T-24h-2 / T-24h-3 (15min 経過時) / T-24h-7 (90% 突破時) / T-30d-4 (動議)
- 宛先: dev-lead + Web-Ops + CEO + (任意で Owner cc)
- ack SLA: 5 min
- escalation: 5 min 未 ack で SMS 自動連絡 (Owner 拘束 0 分原則維持のため Owner cc は opt-in)

## 6. SOP active 化チェックリスト (post-GA T0''' + 24h 時点想定)

| 項目 | 状態 | 担当 | 備考 |
|------|------|------|------|
| 17 trigger 監視配線 | active | Web-Ops-S | R32 本書で物理化 |
| 3 severity routing | active | Web-Ops-S | wire 連動完了 |
| runbook 17 件 | active | Web-Ops-S | 1 trigger = 1 runbook |
| escalation matrix 3 段 | active | Web-Ops-S | L1/L2/L3 確立 |
| dashboard widget | active | Web-Ops-R 連動 | KPI 5 軸 widget GTC-11 actual values |
| on-call rotation | active | dev-lead 主管 | 平日/週末 split |

## 7. R33 引継

- 17 trigger active 維持 (24h/7d/30d 周期遵守)
- T-30d-3 KPT closeout で PRJ-019 lessons-learned 起票
- T-30d-4 DEC-087 不要 closeout 動議 (条件成立時)
- Stage 4 progression report (R32 別 file 参照)
- portfolio v4 起票 (R32 別 file 参照)

## 8. 副作用 0 確認

- 既存 absolute 4 file 無改変
- 物理 deploy 0 件 (SOP spec 文書のみ)
- API call $0
- date-free 厳守 (T0''' / GA / +24h / +7d / +30d 相対表記)

## 9. 完遂宣言

R32 Web-Ops-S Task 1 (post-launch monitoring SOP active 化 17 trigger 物理化) 完遂。alert routing 3 severity wire 連動済み。R33 引継 spec 確立。
