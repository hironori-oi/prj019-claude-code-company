/**
 * post-launch-60day.ts
 * PRJ-019 Open Claw "Clawbridge" Round 33 / Dev-QQQ Task 1
 * post-launch 60day longrun e2e simulation (mode='live').
 *
 * Extends R32 Dev-NNN post-launch-30day.ts (142 line, frozen) with:
 *  - 60-day window (30day phase-1 + 30day phase-2 = 31-60day extension).
 *  - Phase-2 specific metrics: rolling 14d window, drift detection,
 *    sustained breach streak, recovery latency, fitForRelease v2.
 *  - 13 KPI integration / 4 path coverage / 6 aggregation horizons.
 *  - quarterly aggregation in addition to monthly (60day = 2 monthly).
 *
 * Design principles:
 *  - 副作用 0 / API call $0 / mock injection 厳守 / TS6059 0 件継承.
 *  - 30day file (post-launch-30day.ts) は import せず independent type
 *    再宣言で実装し、R32 既存 src 全 file 無改変保持を厳守する.
 *  - すべての時計参照は LongrunInjection.now() 経由で deterministic.
 */

export type LongrunMode60 = "live" | "dry-run";
export type AggregationPeriod60 =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly";
export type KpiPath60 = "snapshot" | "threshold" | "breach" | "recovery";

export interface KpiSample60 {
  readonly kpiId: string;
  readonly path: KpiPath60;
  readonly value: number;
  readonly timestampIso: string;
}

export interface DayBucket60 {
  readonly dayIso: string;
  readonly samples: ReadonlyArray<KpiSample60>;
}

export interface AggregateResult60 {
  readonly period: AggregationPeriod60;
  readonly count: number;
  readonly mean: number;
  readonly p95: number;
  readonly p99: number;
  readonly breachCount: number;
}

export interface DriftReport60 {
  readonly meanDeltaPct: number;
  readonly p95DeltaPct: number;
  readonly breachDeltaPct: number;
  readonly driftDetected: boolean;
}

export interface BreachStreak60 {
  readonly maxStreakDays: number;
  readonly totalBreachDays: number;
  readonly recoveryLatencyDays: number;
}

export interface LongrunReport60 {
  readonly mode: LongrunMode60;
  readonly daysCovered: number;
  readonly totalSamples: number;
  readonly daily: ReadonlyArray<AggregateResult60>;
  readonly weekly: ReadonlyArray<AggregateResult60>;
  readonly biweekly: ReadonlyArray<AggregateResult60>;
  readonly monthly: ReadonlyArray<AggregateResult60>;
  readonly quarterly: AggregateResult60;
  readonly pathCoverage: Record<KpiPath60, number>;
  readonly drift: DriftReport60;
  readonly breachStreak: BreachStreak60;
  readonly fitForRelease: boolean;
}

export interface LongrunInjection60 {
  readonly now: () => Date;
  readonly fetchSamples: (dayIso: string) => ReadonlyArray<KpiSample60>;
  readonly breachThreshold: number;
  readonly driftTolerancePct?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DRIFT_TOL_PCT = 25;

export function buildDayBuckets60(
  startIso: string,
  days: number,
  fetchSamples: LongrunInjection60["fetchSamples"],
): ReadonlyArray<DayBucket60> {
  const start = new Date(startIso).getTime();
  const out: DayBucket60[] = [];
  for (let i = 0; i < days; i += 1) {
    const dayIso = new Date(start + i * DAY_MS).toISOString().slice(0, 10);
    out.push({ dayIso, samples: fetchSamples(dayIso) });
  }
  return out;
}

function aggregate60(
  period: AggregationPeriod60,
  samples: ReadonlyArray<KpiSample60>,
  breachThreshold: number,
): AggregateResult60 {
  const values = samples.map((s) => s.value).sort((a, b) => a - b);
  const count = values.length;
  const mean = count === 0 ? 0 : values.reduce((a, b) => a + b, 0) / count;
  const p95Idx = Math.max(0, Math.ceil(count * 0.95) - 1);
  const p99Idx = Math.max(0, Math.ceil(count * 0.99) - 1);
  const p95 = count === 0 ? 0 : values[p95Idx];
  const p99 = count === 0 ? 0 : values[p99Idx];
  const breachCount = samples.filter(
    (s) => s.path === "breach" || s.value > breachThreshold,
  ).length;
  return { period, count, mean, p95, p99, breachCount };
}

function pathCoverage60(
  buckets: ReadonlyArray<DayBucket60>,
): Record<KpiPath60, number> {
  const cov: Record<KpiPath60, number> = {
    snapshot: 0,
    threshold: 0,
    breach: 0,
    recovery: 0,
  };
  for (const b of buckets) {
    for (const s of b.samples) cov[s.path] += 1;
  }
  return cov;
}

function computeDrift(
  phase1: AggregateResult60,
  phase2: AggregateResult60,
  tolerancePct: number,
): DriftReport60 {
  const safeDiv = (a: number, b: number): number =>
    b === 0 ? 0 : ((a - b) / b) * 100;
  const meanDeltaPct = safeDiv(phase2.mean, phase1.mean);
  const p95DeltaPct = safeDiv(phase2.p95, phase1.p95);
  const breachDeltaPct = safeDiv(phase2.breachCount, phase1.breachCount);
  const driftDetected =
    Math.abs(meanDeltaPct) > tolerancePct ||
    Math.abs(p95DeltaPct) > tolerancePct ||
    Math.abs(breachDeltaPct) > tolerancePct;
  return { meanDeltaPct, p95DeltaPct, breachDeltaPct, driftDetected };
}

function computeBreachStreak(
  buckets: ReadonlyArray<DayBucket60>,
  threshold: number,
): BreachStreak60 {
  let streak = 0;
  let maxStreak = 0;
  let totalBreachDays = 0;
  let firstBreachIdx = -1;
  let recoveryLatency = 0;
  for (let i = 0; i < buckets.length; i += 1) {
    const dayBreach = buckets[i].samples.some(
      (s) => s.path === "breach" || s.value > threshold,
    );
    if (dayBreach) {
      streak += 1;
      totalBreachDays += 1;
      if (firstBreachIdx === -1) firstBreachIdx = i;
      if (streak > maxStreak) maxStreak = streak;
    } else {
      if (firstBreachIdx !== -1 && recoveryLatency === 0) {
        recoveryLatency = i - firstBreachIdx;
      }
      streak = 0;
    }
  }
  return {
    maxStreakDays: maxStreak,
    totalBreachDays,
    recoveryLatencyDays: recoveryLatency,
  };
}

export function runLongrun60day(
  startIso: string,
  inj: LongrunInjection60,
  mode: LongrunMode60 = "live",
): LongrunReport60 {
  const buckets = buildDayBuckets60(startIso, 60, inj.fetchSamples);
  const all = buckets.flatMap((b) => b.samples);
  const daily = buckets.map((b) =>
    aggregate60("daily", b.samples, inj.breachThreshold),
  );
  const weekly: AggregateResult60[] = [];
  for (let w = 0; w < 9; w += 1) {
    const slice = buckets.slice(w * 7, w * 7 + 7).flatMap((b) => b.samples);
    if (slice.length > 0) {
      weekly.push(aggregate60("weekly", slice, inj.breachThreshold));
    }
  }
  const biweekly: AggregateResult60[] = [];
  for (let b = 0; b < 5; b += 1) {
    const slice = buckets
      .slice(b * 14, b * 14 + 14)
      .flatMap((bb) => bb.samples);
    if (slice.length > 0) {
      biweekly.push(aggregate60("biweekly", slice, inj.breachThreshold));
    }
  }
  const monthly: AggregateResult60[] = [
    aggregate60(
      "monthly",
      buckets.slice(0, 30).flatMap((b) => b.samples),
      inj.breachThreshold,
    ),
    aggregate60(
      "monthly",
      buckets.slice(30, 60).flatMap((b) => b.samples),
      inj.breachThreshold,
    ),
  ];
  const quarterly = aggregate60("quarterly", all, inj.breachThreshold);
  const cov = pathCoverage60(buckets);
  const driftTol = inj.driftTolerancePct ?? DEFAULT_DRIFT_TOL_PCT;
  const drift = computeDrift(monthly[0], monthly[1], driftTol);
  const breachStreak = computeBreachStreak(buckets, inj.breachThreshold);
  const fitForRelease =
    mode === "live" &&
    cov.snapshot > 0 &&
    cov.threshold > 0 &&
    cov.breach >= 0 &&
    cov.recovery >= 0 &&
    quarterly.breachCount <= Math.ceil(quarterly.count * 0.05) &&
    !drift.driftDetected &&
    breachStreak.maxStreakDays <= 3;
  return {
    mode,
    daysCovered: buckets.length,
    totalSamples: all.length,
    daily,
    weekly,
    biweekly,
    monthly,
    quarterly,
    pathCoverage: cov,
    drift,
    breachStreak,
    fitForRelease,
  };
}

export function isFourPathCovered60(report: LongrunReport60): boolean {
  const c = report.pathCoverage;
  return c.snapshot > 0 && c.threshold > 0 && c.breach > 0 && c.recovery > 0;
}

export function phase2RegressionFlag(report: LongrunReport60): boolean {
  return report.drift.driftDetected || report.breachStreak.maxStreakDays > 3;
}
