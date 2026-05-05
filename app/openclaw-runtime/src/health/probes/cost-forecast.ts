/**
 * cost-forecast.ts
 * PRJ-019 Open Claw Round 32 / Dev-NNN Task 4
 *
 * cost-tracker 月次推移 forecast 算出と alert rule 判定。
 * - 80% warn / 100% critical 閾値（DEC-081 連動 / R29 confirmed）
 * - 副作用 0 / mock injection 厳守
 */

export type CostSeverity = "ok" | "warn" | "critical";

export interface DailyCostPoint {
  readonly dayIso: string;
  readonly amountUsd: number;
}

export interface CostForecast {
  readonly elapsedDays: number;
  readonly elapsedSpendUsd: number;
  readonly projectedMonthlyUsd: number;
  readonly budgetUsd: number;
  readonly utilizationPct: number;
  readonly severity: CostSeverity;
  readonly daysInMonth: number;
}

export interface CostForecastInjection {
  readonly daysInMonth: number; // e.g., 30
  readonly budgetUsd: number; // 月次予算
  readonly warnPct?: number; // default 80
  readonly criticalPct?: number; // default 100
}

export function projectMonthly(
  elapsedSpendUsd: number,
  elapsedDays: number,
  daysInMonth: number,
): number {
  if (elapsedDays <= 0) return 0;
  const dailyAvg = elapsedSpendUsd / elapsedDays;
  return dailyAvg * daysInMonth;
}

export function classifySeverity(
  utilizationPct: number,
  warnPct = 80,
  criticalPct = 100,
): CostSeverity {
  if (utilizationPct >= criticalPct) return "critical";
  if (utilizationPct >= warnPct) return "warn";
  return "ok";
}

export function forecastCost(
  series: ReadonlyArray<DailyCostPoint>,
  inj: CostForecastInjection,
): CostForecast {
  const elapsedDays = series.length;
  const elapsedSpendUsd = series.reduce((a, b) => a + b.amountUsd, 0);
  const projectedMonthlyUsd = projectMonthly(
    elapsedSpendUsd,
    elapsedDays,
    inj.daysInMonth,
  );
  const utilizationPct =
    inj.budgetUsd <= 0 ? 0 : (projectedMonthlyUsd / inj.budgetUsd) * 100;
  const severity = classifySeverity(
    utilizationPct,
    inj.warnPct ?? 80,
    inj.criticalPct ?? 100,
  );
  return {
    elapsedDays,
    elapsedSpendUsd,
    projectedMonthlyUsd,
    budgetUsd: inj.budgetUsd,
    utilizationPct,
    severity,
    daysInMonth: inj.daysInMonth,
  };
}
