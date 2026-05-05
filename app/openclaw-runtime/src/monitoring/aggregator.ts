/**
 * aggregator.ts
 * PRJ-019 Round 32 / Dev-OOO Task 3 (W7-B physical)
 *
 * 3 aggregation period: daily / weekly / monthly
 * 副作用 0 / pure / mock injection 不要 (純算術)。
 *
 * 既存 longrun/post-launch-30day.ts (R32 Dev-NNN) の aggregate と機能境界を分離:
 *   - longrun: 30day 全体の e2e simulation orchestration
 *   - monitoring/aggregator: 任意期間の KPI 集計 + percentile + std dev
 */
import type { KpiId, KpiSnapshot } from "./kpi-collector.js";

export type AggregationPeriod = "daily" | "weekly" | "monthly";

export interface AggregationResult {
  readonly kpiId: KpiId | "all";
  readonly period: AggregationPeriod;
  readonly periodStartIso: string;
  readonly periodEndIso: string;
  readonly count: number;
  readonly mean: number;
  readonly p50: number;
  readonly p95: number;
  readonly p99: number;
  readonly min: number;
  readonly max: number;
  readonly stdDev: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

function percentile(sorted: ReadonlyArray<number>, p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.max(0, Math.ceil(sorted.length * p) - 1);
  return sorted[idx];
}

function stddev(values: ReadonlyArray<number>, mean: number): number {
  if (values.length === 0) return 0;
  const sq = values.reduce((a, v) => a + (v - mean) * (v - mean), 0);
  return Math.sqrt(sq / values.length);
}

function aggregateRange(
  kpiId: KpiId | "all",
  period: AggregationPeriod,
  periodStartIso: string,
  periodEndIso: string,
  samples: ReadonlyArray<KpiSnapshot>,
): AggregationResult {
  const values = samples.map((s) => s.value).sort((a, b) => a - b);
  const count = values.length;
  const mean = count === 0 ? 0 : values.reduce((a, b) => a + b, 0) / count;
  return {
    kpiId,
    period,
    periodStartIso,
    periodEndIso,
    count,
    mean,
    p50: percentile(values, 0.5),
    p95: percentile(values, 0.95),
    p99: percentile(values, 0.99),
    min: count === 0 ? 0 : values[0],
    max: count === 0 ? 0 : values[count - 1],
    stdDev: stddev(values, mean),
  };
}

function bucketByDay(
  samples: ReadonlyArray<KpiSnapshot>,
): Map<string, KpiSnapshot[]> {
  const m = new Map<string, KpiSnapshot[]>();
  for (const s of samples) {
    const day = s.timestampIso.slice(0, 10);
    const arr = m.get(day) ?? [];
    arr.push(s);
    m.set(day, arr);
  }
  return m;
}

export function aggregateDaily(
  samples: ReadonlyArray<KpiSnapshot>,
  kpiId: KpiId | "all" = "all",
): ReadonlyArray<AggregationResult> {
  const buckets = bucketByDay(samples);
  const out: AggregationResult[] = [];
  const keys = Array.from(buckets.keys()).sort();
  for (const day of keys) {
    const start = `${day}T00:00:00.000Z`;
    const endMs = new Date(start).getTime() + DAY_MS - 1;
    const end = new Date(endMs).toISOString();
    out.push(aggregateRange(kpiId, "daily", start, end, buckets.get(day) ?? []));
  }
  return out;
}

export function aggregateWeekly(
  samples: ReadonlyArray<KpiSnapshot>,
  weekStartIso: string,
  weeks: number,
  kpiId: KpiId | "all" = "all",
): ReadonlyArray<AggregationResult> {
  const start0 = new Date(weekStartIso).getTime();
  const out: AggregationResult[] = [];
  for (let w = 0; w < weeks; w += 1) {
    const wStart = start0 + w * WEEK_MS;
    const wEnd = wStart + WEEK_MS - 1;
    const startIso = new Date(wStart).toISOString();
    const endIso = new Date(wEnd).toISOString();
    const slice = samples.filter((s) => {
      const t = Date.parse(s.timestampIso);
      return t >= wStart && t <= wEnd;
    });
    out.push(aggregateRange(kpiId, "weekly", startIso, endIso, slice));
  }
  return out;
}

export function aggregateMonthly(
  samples: ReadonlyArray<KpiSnapshot>,
  monthStartIso: string,
  monthEndIso: string,
  kpiId: KpiId | "all" = "all",
): AggregationResult {
  const startMs = Date.parse(monthStartIso);
  const endMs = Date.parse(monthEndIso);
  const slice = samples.filter((s) => {
    const t = Date.parse(s.timestampIso);
    return t >= startMs && t <= endMs;
  });
  return aggregateRange(kpiId, "monthly", monthStartIso, monthEndIso, slice);
}

export interface MultiPeriodReport {
  readonly daily: ReadonlyArray<AggregationResult>;
  readonly weekly: ReadonlyArray<AggregationResult>;
  readonly monthly: AggregationResult;
}

export function buildMultiPeriodReport(
  samples: ReadonlyArray<KpiSnapshot>,
  monthStartIso: string,
  monthEndIso: string,
  weeks: number,
  kpiId: KpiId | "all" = "all",
): MultiPeriodReport {
  return {
    daily: aggregateDaily(samples, kpiId),
    weekly: aggregateWeekly(samples, monthStartIso, weeks, kpiId),
    monthly: aggregateMonthly(samples, monthStartIso, monthEndIso, kpiId),
  };
}
