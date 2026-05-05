# Dev-NNN R32 / Task 4: cost-tracker 月次推移 forecast

- Round: PRJ-019 Round 32 / 9 並列 5 軸目
- Owner 拘束: 0 分 / 副作用: 0 / 実 API call $0

## 1. 目的
日次コスト系列から月次予算消化を前倒し算出し、80% (warn) / 100% (critical) の severity を判定する。DEC-081 連動 / R29 で confirmed。

## 2. 仕様
- 入力: `series: DailyCostPoint[]`, `injection: { daysInMonth, budgetUsd, warnPct?, criticalPct? }`
- 出力: `CostForecast { elapsedDays, elapsedSpendUsd, projectedMonthlyUsd, budgetUsd, utilizationPct, severity, daysInMonth }`

## 3. 計算
- `dailyAvg = elapsedSpendUsd / elapsedDays`
- `projectedMonthlyUsd = dailyAvg * daysInMonth`
- `utilizationPct = projectedMonthlyUsd / budgetUsd * 100`
- severity: `>=100 → critical / >=80 → warn / else ok`（境界等号は警報側）

## 4. test 設計（+6 case）
1. projectMonthly 算出
2. classifySeverity ok
3. classifySeverity warn (80%)
4. classifySeverity critical (>=100%)
5. forecastCost 75% utilization → ok
6. forecastCost over-budget → critical

## 5. 出力 file
- 実装: `projects/PRJ-019/app/openclaw-runtime/src/health/probes/cost-forecast.ts` (≤130 行)
- test: `.../probes/__tests__/cost-forecast.test.ts` (6 case)

## 6. 連動
- 既存 `cost-tracker.ts` （probes 配下）と並列配置、wire は健康診断 aggregator 側で実施
- 実 API call $0 / mock 注入 / 副作用 0

## 7. fix forward-only / harness 影響
+6 case 加算（R32 合計 +39 case の一部）。
