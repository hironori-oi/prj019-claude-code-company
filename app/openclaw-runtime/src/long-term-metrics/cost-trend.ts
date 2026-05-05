/**
 * PRJ-019 Open Claw "Clawbridge" — W7-E long-term operational metrics
 *   90day cost trend analyzer
 *
 * R33 Dev-SSS physical implementation (~100 行).
 * Computes 90day cost rolling trend (mean / linear slope / forecast) for
 * monthly run-rate observation. Companion to Dev-NNN R32 cost-forecast
 * 30day module but extended to 90day quarter horizon.
 *
 * Constraints (R33 Dev-SSS):
 *   - Pure function. No fetch, no fs, no external API call ($0).
 *   - Strict typing. TS6059 0 件継承.
 *   - Side effect: 0.
 */

export interface CostSample {
  round: number;
  observed_at: string; // ISO-8601
  cost_jpy: number; // daily / round-level cost in JPY
  source: 'compute' | 'storage' | 'egress' | 'api' | 'aggregate';
}

export interface CostTrendOptions {
  now: string; // ISO-8601 anchor
  window_days?: number; // default 90
}

export interface CostTrendResult {
  window_start: string;
  window_end: string;
  window_days: number;
  total_samples: number;
  total_cost: number;
  mean_cost: number | null;
  median_cost: number | null;
  slope_per_day: number; // simple linear regression slope (JPY/day)
  forecast_30day: number | null; // projected total over next 30day at slope
  source_breakdown: Record<CostSample['source'], number>;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

function linearSlope(points: { x: number; y: number }[]): number {
  const n = points.length;
  if (n < 2) return 0;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

export function analyzeCostTrend(
  samples: CostSample[],
  options: CostTrendOptions
): CostTrendResult {
  const window_days = options.window_days ?? 90;
  const nowMs = Date.parse(options.now);
  const startMs = nowMs - window_days * MS_PER_DAY;

  const inWindow: CostSample[] = [];
  for (const s of samples) {
    const t = Date.parse(s.observed_at);
    if (Number.isNaN(t)) continue;
    if (t < startMs || t > nowMs) continue;
    inWindow.push(s);
  }

  const breakdown: Record<CostSample['source'], number> = {
    compute: 0,
    storage: 0,
    egress: 0,
    api: 0,
    aggregate: 0,
  };

  const values: number[] = [];
  const points: { x: number; y: number }[] = [];
  let total = 0;

  for (const s of inWindow) {
    breakdown[s.source] += s.cost_jpy;
    values.push(s.cost_jpy);
    total += s.cost_jpy;
    const dayIdx = (Date.parse(s.observed_at) - startMs) / MS_PER_DAY;
    points.push({ x: dayIdx, y: s.cost_jpy });
  }

  const slope = linearSlope(points);
  const mean = values.length === 0 ? null : total / values.length;
  const forecast = mean === null ? null : 30 * (mean + slope * 15); // mid-point projection

  return {
    window_start: new Date(startMs).toISOString(),
    window_end: new Date(nowMs).toISOString(),
    window_days,
    total_samples: inWindow.length,
    total_cost: total,
    mean_cost: mean,
    median_cost: median(values),
    slope_per_day: slope,
    forecast_30day: forecast,
    source_breakdown: breakdown,
  };
}
