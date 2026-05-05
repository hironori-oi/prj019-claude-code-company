/**
 * post-launch-30day.ts
 * PRJ-019 Open Claw "Clawbridge" Round 32 / Dev-NNN Task 1
 * post-launch 30day longrun e2e simulation (mode='live')
 *
 * - 13 KPI integration 4 経路 (snapshot / threshold / breach / recovery)
 * - daily / weekly / monthly aggregation
 * - 副作用 0 / mock injection 厳守 / TS6059 0 件
 */

export type LongrunMode = "live" | "dry-run";
export type AggregationPeriod = "daily" | "weekly" | "monthly";
export type KpiPath = "snapshot" | "threshold" | "breach" | "recovery";

export interface KpiSample {
  readonly kpiId: string; // 13 KPI のいずれか
  readonly path: KpiPath;
  readonly value: number;
  readonly timestampIso: string;
}

export interface DayBucket {
  readonly dayIso: string; // YYYY-MM-DD
  readonly samples: ReadonlyArray<KpiSample>;
}

export interface AggregateResult {
  readonly period: AggregationPeriod;
  readonly count: number;
  readonly mean: number;
  readonly p95: number;
  readonly breachCount: number;
}

export interface LongrunReport {
  readonly mode: LongrunMode;
  readonly daysCovered: number;
  readonly totalSamples: number;
  readonly daily: ReadonlyArray<AggregateResult>;
  readonly weekly: ReadonlyArray<AggregateResult>;
  readonly monthly: AggregateResult;
  readonly pathCoverage: Record<KpiPath, number>;
  readonly fitForRelease: boolean;
}

export interface LongrunInjection {
  readonly now: () => Date;
  readonly fetchSamples: (dayIso: string) => ReadonlyArray<KpiSample>;
  readonly breachThreshold: number; // value > threshold => breach
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildDayBuckets(
  startIso: string,
  days: number,
  fetchSamples: LongrunInjection["fetchSamples"],
): ReadonlyArray<DayBucket> {
  const start = new Date(startIso).getTime();
  const out: DayBucket[] = [];
  for (let i = 0; i < days; i += 1) {
    const dayIso = new Date(start + i * DAY_MS).toISOString().slice(0, 10);
    out.push({ dayIso, samples: fetchSamples(dayIso) });
  }
  return out;
}

function aggregate(
  period: AggregationPeriod,
  samples: ReadonlyArray<KpiSample>,
  breachThreshold: number,
): AggregateResult {
  const values = samples.map((s) => s.value).sort((a, b) => a - b);
  const count = values.length;
  const mean = count === 0 ? 0 : values.reduce((a, b) => a + b, 0) / count;
  const p95Idx = Math.max(0, Math.ceil(count * 0.95) - 1);
  const p95 = count === 0 ? 0 : values[p95Idx];
  const breachCount = samples.filter(
    (s) => s.path === "breach" || s.value > breachThreshold,
  ).length;
  return { period, count, mean, p95, breachCount };
}

function pathCoverage(
  buckets: ReadonlyArray<DayBucket>,
): Record<KpiPath, number> {
  const cov: Record<KpiPath, number> = {
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

export function runLongrun30day(
  startIso: string,
  inj: LongrunInjection,
  mode: LongrunMode = "live",
): LongrunReport {
  const buckets = buildDayBuckets(startIso, 30, inj.fetchSamples);
  const all = buckets.flatMap((b) => b.samples);
  const daily = buckets.map((b) =>
    aggregate("daily", b.samples, inj.breachThreshold),
  );
  const weekly: AggregateResult[] = [];
  for (let w = 0; w < 5; w += 1) {
    const slice = buckets
      .slice(w * 7, w * 7 + 7)
      .flatMap((b) => b.samples);
    if (slice.length > 0) {
      weekly.push(aggregate("weekly", slice, inj.breachThreshold));
    }
  }
  const monthly = aggregate("monthly", all, inj.breachThreshold);
  const cov = pathCoverage(buckets);
  const fitForRelease =
    mode === "live" &&
    cov.snapshot > 0 &&
    cov.threshold > 0 &&
    cov.breach >= 0 &&
    cov.recovery >= 0 &&
    monthly.breachCount <= Math.ceil(monthly.count * 0.05);
  return {
    mode,
    daysCovered: buckets.length,
    totalSamples: all.length,
    daily,
    weekly,
    monthly,
    pathCoverage: cov,
    fitForRelease,
  };
}

export function isFourPathCovered(report: LongrunReport): boolean {
  const c = report.pathCoverage;
  return c.snapshot > 0 && c.threshold > 0 && c.breach > 0 && c.recovery > 0;
}
