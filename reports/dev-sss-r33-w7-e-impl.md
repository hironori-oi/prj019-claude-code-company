# Dev-SSS R33 — W7-E long-term operational metrics 物理化詳細

最終更新: PRJ-019 R33 W0-Week2 (date-free 第 5 round 目)
担当: Dev 部門 R33 Dev-SSS (9 並列 9 軸目)
位置付け: PRJ-019 Open Claw "Clawbridge" / 90day rolling window long-term metrics 物理化
副作用: 0 / API call: $0 / 物理 deploy: 0 件 / TS6059 0 件継承

---

## §0 サマリ

W7-E = post-launch 30day (Dev-NNN R32) と 60day (Dev-QQQ R33) を更に長期で観測する
「90day quarter-rolling window」観測層を 3 module で物理化した。
- `quarter-window.ts` (90day event aggregator / 137 LOC / 8 case)
- `sla-tracker.ts` (SLA breach/recovery 90day rolling / 123 LOC / 8 case)
- `cost-trend.ts` (90day cost trend + forecast / 122 LOC / 8 case)
- + integration test `w7-e-long-term-integration.test.ts` (14 case)

合計 382 行 + 38 case 全 PASS (vitest 実測確認)。

---

## §1 module 仕様

### §1.1 quarter-window.ts (137 LOC)

役割: 任意の time-stamped event 列を 90day rolling window へ集約する純関数モジュール。

主要 export:
```ts
type QuarterEventKind = 'dec' | 'harness' | 'sla' | 'cost' | 'kpt' | 'pitfall';
type QuarterEventSeverity = 'info' | 'warn' | 'critical';

interface QuarterEvent {
  round: number;
  occurred_at: string; // ISO-8601
  kind: QuarterEventKind;
  severity: QuarterEventSeverity;
  summary: string;
  numeric_value?: number;
}

function aggregateQuarterWindow(
  events: QuarterEvent[],
  options: { now: string; window_days?: number }
): QuarterWindowAggregate;

function summarizeQuarter(agg: QuarterWindowAggregate): string;
```

returns:
- `window_start` / `window_end` / `window_days`
- `total_events` / `unique_rounds`
- `severity` (info/warn/critical 内訳)
- `kind` (6 種 内訳)
- `events_in_window` (raw)
- `numeric_avg` (numeric_value 持ち event の平均)

### §1.2 sla-tracker.ts (123 LOC)

役割: 単一 SLO に対する 90day rolling breach/recovery 計測。

主要 export:
```ts
type SlaSampleStatus = 'ok' | 'breach' | 'recovered';
interface SlaSample {
  round: number;
  observed_at: string;
  status: SlaSampleStatus;
  value: number;
  threshold: number;
}

function trackSla(samples: SlaSample[], options: { now: string; window_days?: number }): SlaTrackerResult;
function isSlaHealthy(result: SlaTrackerResult, max_breach_rate?: number): boolean;
```

returns:
- `breach_count` / `recovery_count` / `ok_count` / `breach_rate`
- `mean_value` / `worst_value` / `worst_round`
- `consecutive_ok_streak` (window 内最長連続 ok)
- `current_status` (window 内最終 sample の status)

### §1.3 cost-trend.ts (122 LOC)

役割: 90day cost rolling 解析 (mean / median / linear slope / forecast)。

主要 export:
```ts
interface CostSample {
  round: number;
  observed_at: string;
  cost_jpy: number;
  source: 'compute' | 'storage' | 'egress' | 'api' | 'aggregate';
}

function analyzeCostTrend(samples: CostSample[], options: { now: string; window_days?: number }): CostTrendResult;
```

returns:
- `total_cost` / `mean_cost` / `median_cost`
- `slope_per_day` (single-variable linear regression)
- `forecast_30day` (mid-point projection 30 × (mean + slope × 15))
- `source_breakdown` (5 source 別 cost 累計)

---

## §2 test 仕様 (38 case)

### §2.1 quarter-window.test.ts (8 case)
1. default 90day window aggregation
2. pre-window 排除
3. future-dated 排除
4. severity breakdown
5. kind breakdown
6. numeric_avg 計算 (numeric 不在 event を除外)
7. custom window_days 尊重
8. summarizeQuarter 決定論的出力

### §2.2 sla-tracker.test.ts (8 case)
1. ok-only sample カウント
2. breach_rate=0 / isSlaHealthy=true
3. mixed status カウント (breach/recovered/ok)
4. breach_rate 計算 (breach/total)
5. worst_value / worst_round 検出
6. consecutive_ok_streak 計算
7. window 外 sample 排除
8. 空 window 例外なし

### §2.3 cost-trend.test.ts (8 case)
1. 90day default aggregation
2. total + mean
3. median
4. flat 入力 → slope ≒ 0
5. monotonic 上昇 → slope > 0
6. forecast 非 null
7. source_breakdown 5 source 集約
8. 空入力 → mean/median/forecast = null

### §2.4 w7-e-long-term-integration.test.ts (14 case)
1. 3 module の 90day window 統一
2. custom window_days 統一適用
3. quarter total = sla total = cost total
4. 全 module pre-window 排除
5. 全 module future-dated 排除
6. quarter sla-kind = sla-tracker breach+recovered
7. cost forecast 正値性
8. SLO healthy 判定 (default 5% / loose 50%)
9. 全 module 空入力 graceful
10. summarizeQuarter 決定論
11. repeat 実行同一性 (隠れ state なし)
12. window_start ↔ window_end 厳密差
13. composite report 組立可能
14. composite report 副作用 0 (idempotent)

---

## §3 制約遵守 verification

| 項目 | status | 根拠 |
|------|:------:|------|
| 副作用 0 | PASS | 全 module 純関数 / fs/fetch/network 0 |
| API call $0 | PASS | DI/import のみ / 外部 SDK 不使用 |
| TS6059 0 件継承 | PASS | 新規 4 file 0 件 / `tsc --noEmit` で long-term-metrics 系 0 行 hit |
| openclaw-runtime 394 PASS 維持 | PASS | 既存 test 不変 / 新規 38 case 追加のみ |
| R31 v2 matrix file 不変 | PASS | matrix v3 は別 file (`dev-sss-r33-cross-domain-matrix-v3.md`) |
| 物理化は新規 file 作成のみ | PASS | 既存 file mutation 0 件 |
| 絵文字 | 0 | 全 file 絵文字無 |
| Owner 拘束 | 0 分 | 自動進行 |

---

## §4 出力ファイル絶対パス一覧 (7 file)

1. `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/openclaw-runtime/src/long-term-metrics/quarter-window.ts`
2. `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/openclaw-runtime/src/long-term-metrics/sla-tracker.ts`
3. `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/openclaw-runtime/src/long-term-metrics/cost-trend.ts`
4. `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/openclaw-runtime/src/long-term-metrics/__tests__/quarter-window.test.ts`
5. `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/openclaw-runtime/src/long-term-metrics/__tests__/sla-tracker.test.ts`
6. `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/openclaw-runtime/src/long-term-metrics/__tests__/cost-trend.test.ts`
7. `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/openclaw-runtime/src/__tests__/w7-e-long-term-integration.test.ts`

---

## §5 結語

W7-E long-term operational metrics 3 module + 4 test 物理化を完遂。
38 case 全 PASS / 副作用 0 / API call $0 / TS6059 0 件継承 / R31 v2 matrix 不変保持。
post-launch 30day (Dev-NNN) → 60day (Dev-QQQ) → 90day (Dev-SSS) の
3 段 rolling window 観測層が完成し、quarter-level KPT/SLO/cost trajectory
観測の物理基盤が整った。

---

(End of dev-sss-r33-w7-e-impl.md / 物理化完遂)
