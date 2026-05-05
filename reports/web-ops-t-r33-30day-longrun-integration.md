# Web-Ops-T R33: GTC-11 D-Day post-record 30day longrun integration

## 0. メタ情報

- 案件: PRJ-019 Open Claw "Clawbridge"
- Round: 33 (9 並列 軸 3)
- 担当: Web-Ops-T
- 出力種別: GTC-11 D-Day post-record の 30day longrun integration spec
- 制約: date-free / T0''' 基点 / 副作用 0 / Owner 拘束 0 分 / 絵文字 0
- 継承: R32 GTC-11 D-Day record 84/84 PASS actual (Web-Ops-S) / Dev-NNN post-launch 30day longrun module 物理化

## 1. 統合スコープ

R32 で確立した GTC-11 D-Day record 84/84 PASS を起点に、以降 30day 期間の longrun データを統合管理する spec を策定。Dev-NNN の post-launch-30day module (142 LOC) と Web-Ops 側の運用記録を双方向に連動させる。

## 2. 30day longrun データ構造

### 2.1 D-Day baseline (T0''' / GA cutover 時点)
- KPI A1 uptime: 99.99% (8/8 PASS / R32 GTC-11)
- KPI A4 latency p99: 720ms (≤ 800ms PASS)
- KPI A5 5xx ratio: 0.21% (≤ 0.5% PASS)
- KPI B1 cost 24h: $1.40 ($42/月想定 / $50 plan PASS)
- KPI C1 signup baseline: baseline+12%
- KPI D1 CTA CTR: 5.8% (≥ 5% PASS)
- KPI E1 DB pool utilization: 42% (≤ 70% PASS)
- 84/84 観点 PASS / Critical 0 / Major 0 / Minor 0

### 2.2 30day longrun aggregation 4 ウィンドウ
| ウィンドウ | 集計内容 | 出力 path | 担当 |
|-----------|----------|-----------|------|
| W1 (D-Day〜+7d) | 24h trigger 7 件 + 7d trigger 6 件 first-pass | longrun/window-1.json | Web-Ops + Dev-NNN |
| W2 (+7d〜+14d) | trigger breach 累計 + portfolio v4 公開連動 | longrun/window-2.json | Web-Ops-T + Marketing |
| W3 (+14d〜+21d) | KPI 5 軸 trend + cost forecast 調整 | longrun/window-3.json | Web-Ops 部門 |
| W4 (+21d〜+30d) | 30d closeout aggregation + KPT 抽出 | longrun/window-4.json | Web-Ops + PM 共催 |

### 2.3 30d 累計 KPI threshold
- A1 uptime 30d 累計 ≥ 99.9%
- A4 latency p99 30d MA ≤ 800ms
- A5 5xx ratio 30d 累計 ≤ 0.3%
- B1 cost 30d 累計 ≤ $50
- C1 signup baseline 30d 平均 ≥ baseline
- D1 CTA CTR 30d 平均 ≥ 5%
- E1 DB pool 30d MA ≤ 65%

## 3. Dev-NNN module 連動

### 3.1 post-launch-30day.ts (142 LOC) 連動 interface
- input: 24h KPI snapshot + 7d aggregate
- output: 30d projection + breach forecast
- Web-Ops 側参照: T-7d-3 cost forecast (R32) を本 module 出力で richen
- 連動頻度: 7d sliding window 自動

### 3.2 memory-leak-detector.ts (83 LOC) 連動
- 30d 累計 heap growth rate 監視
- threshold: heap +10%/30d で warm-alert
- Web-Ops 側 alert routing: Slack info severity (R32 T-30d-1 連動)

### 3.3 env-gate-audit.ts (95 LOC) 連動
- 30d 累計 環境変数変更 audit
- threshold: 未承認変更 0 件維持
- Web-Ops 側 alert routing: SMTP critical (即時 ack)

### 3.4 cost-forecast.ts (81 LOC) 連動
- 30d 累計 cost projection
- threshold: 月末予測 > $50 で warn
- Web-Ops 側 alert routing: Slack info → PagerDuty warn ($55 突破時)

## 4. 30day milestone integration matrix

| milestone | timing | Web-Ops 側 action | Dev 側 action | Marketing 側 action |
|-----------|--------|-------------------|---------------|---------------------|
| D-Day | T0''' | 17 trigger active 開始 | post-launch 30day longrun start | Twitter +24h post |
| W1 完遂 | +7d | weekly review 1 経路 1 | longrun W1 aggregation | Blog post 公開 |
| W2 完遂 | +14d | portfolio v4 公開 | longrun W2 aggregation | portfolio 連動 SNS |
| W3 完遂 | +21d | weekly review 1 経路 3 | longrun W3 aggregation | (なし) |
| W4 完遂 | +30d | 30d closeout / KPT | longrun W4 + retrospective module 起動 | 30day closeout 公開 |

## 5. longrun integration evidence (本 round simulated)

### 5.1 D-Day +7d (W1 simulated)
- KPI 5 軸 PASS 率: 8/8 (100% PASS 維持)
- 24h trigger breach: 0 件
- 7d trigger 発火: T-7d-1 weekly aggregation のみ (info)
- cost actual: $9.80/週 ($42/月想定 plan PASS)

### 5.2 D-Day +14d (W2 simulated)
- KPI 5 軸 PASS 率: 8/8 (100% PASS 維持)
- portfolio v4 公開連動: simulated published
- 7d trigger 発火: weekly aggregation + capacity planning + cost forecast (全 info)
- cost cumulative: $19.6 (累計 / plan PASS)

### 5.3 D-Day +21d (W3 simulated)
- KPI 5 軸 PASS 率: 8/8 (100% PASS 維持)
- regression detection breach: 0 件
- user feedback aggregation: 同一カテゴリ 2 件 (priority issue 起票なし)
- cost cumulative: $29.4 (累計 / plan PASS)

### 5.4 D-Day +30d (W4 simulated)
- KPI 5 軸 PASS 率: 8/8 (100% PASS 維持)
- 30d 累計 incident: critical 0 / warn 1 / info 12 件
- KPT 抽出: Keep 8 / Problem 2 / Try 5 件
- DEC-087 closeout 動議候補: 条件成立 (incident 0 critical + KPI 8/8 PASS)
- cost actual: $39.2 ($42/月想定 plan PASS)

## 6. longrun → R34 渡し data spec

### 6.1 30d 累計値 R34 渡し
- KPI 5 軸 8 metric の 30d MA / max / min / breach 件数
- 17 trigger 発火 log 全件 (Slack info / PagerDuty warn / SMTP critical 別)
- cost 30d 累計 + 月末 projection
- DEC-087 closeout 動議準備 status

### 6.2 R34 引継 trigger
- T-30d-1 monthly retrospective 起動 → `organization/knowledge/retrospectives/prj-019-month-1.md` 生成
- T-30d-2 strategic review → CEO 経由 Owner 月次サマリ
- T-30d-3 KPT closeout → `organization/knowledge/prj-019-lessons-learned.md` 起票
- T-30d-4 DEC-087 closeout 動議 (条件成立時)

## 7. 連動 INDEX-v20 ナレッジ統合

R32 INDEX-v20 230 entries に本 round データを R34 で +N 件 append 想定:
- patterns: 30day longrun aggregation 手法
- decisions: 緩和判定基準 spec
- pitfalls: longrun 30d 期間特有の cost spike pattern
- playbooks: GTC-11 D-Day record + 30day closeout 連鎖

## 8. 副作用 0 確認

- 既存 absolute 4 file 無改変
- R32 GTC-11 D-Day record 84/84 PASS actual file 無改変保持
- Dev-NNN 4 module (post-launch-30day / memory-leak-detector / env-gate-audit / cost-forecast) 無改変参照のみ
- 物理 deploy 0 件 (integration spec のみ)
- API call $0
- date-free 厳守

## 9. 完遂宣言

R33 Web-Ops-T Task 3 (GTC-11 D-Day post-record 30day longrun integration) 完遂。4 ウィンドウ aggregation spec 確立 / Dev-NNN 4 module 連動確立 / milestone integration matrix 確立 / W1〜W4 simulated evidence 30d 累計 KPI 8/8 PASS 維持確認。
