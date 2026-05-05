/**
 * PRJ-019 Open Claw "Clawbridge" — W7-E long-term operational metrics
 *   cost-trend unit test (R33 Dev-SSS / 8 case)
 *
 * Constraints:
 *   - Pure function tests. No fetch, no fs, no real API call ($0).
 *   - Strict typing. TS6059 0 件継承.
 *   - Side effect: 0.
 */

import { describe, expect, it } from 'vitest';
import {
  analyzeCostTrend,
  type CostSample,
} from '../cost-trend';

const NOW = '2026-05-06T00:00:00Z';

function flatSample(): CostSample[] {
  return [
    { round: 25, observed_at: '2026-04-01T00:00:00Z', cost_jpy: 100, source: 'compute' },
    { round: 26, observed_at: '2026-04-08T00:00:00Z', cost_jpy: 100, source: 'compute' },
    { round: 27, observed_at: '2026-04-15T00:00:00Z', cost_jpy: 100, source: 'compute' },
    { round: 28, observed_at: '2026-04-22T00:00:00Z', cost_jpy: 100, source: 'compute' },
    { round: 29, observed_at: '2026-04-29T00:00:00Z', cost_jpy: 100, source: 'compute' },
  ];
}

function mixedSample(): CostSample[] {
  return [
    { round: 25, observed_at: '2026-04-01T00:00:00Z', cost_jpy: 80, source: 'compute' },
    { round: 26, observed_at: '2026-04-08T00:00:00Z', cost_jpy: 90, source: 'storage' },
    { round: 27, observed_at: '2026-04-15T00:00:00Z', cost_jpy: 100, source: 'egress' },
    { round: 28, observed_at: '2026-04-22T00:00:00Z', cost_jpy: 110, source: 'api' },
    { round: 29, observed_at: '2026-04-29T00:00:00Z', cost_jpy: 120, source: 'compute' },
    { round: 30, observed_at: '2026-05-02T00:00:00Z', cost_jpy: 130, source: 'aggregate' },
    // out of window
    { round: 5, observed_at: '2025-11-01T00:00:00Z', cost_jpy: 999, source: 'compute' },
  ];
}

describe('analyzeCostTrend (W7-E cost-trend)', () => {
  it('aggregates cost samples within default 90day window', () => {
    const r = analyzeCostTrend(mixedSample(), { now: NOW });
    expect(r.window_days).toBe(90);
    expect(r.total_samples).toBe(6);
  });

  it('computes total and mean cost', () => {
    const r = analyzeCostTrend(mixedSample(), { now: NOW });
    // 80+90+100+110+120+130 = 630
    expect(r.total_cost).toBe(630);
    expect(r.mean_cost).toBeCloseTo(105, 5);
  });

  it('computes median cost', () => {
    const r = analyzeCostTrend(mixedSample(), { now: NOW });
    // sorted: 80,90,100,110,120,130 -> median (100+110)/2 = 105
    expect(r.median_cost).toBeCloseTo(105, 5);
  });

  it('computes near-zero slope for flat input', () => {
    const r = analyzeCostTrend(flatSample(), { now: NOW });
    expect(Math.abs(r.slope_per_day)).toBeLessThan(0.0001);
  });

  it('computes positive slope for monotonically rising cost', () => {
    const r = analyzeCostTrend(mixedSample(), { now: NOW });
    expect(r.slope_per_day).toBeGreaterThan(0);
  });

  it('produces non-null forecast when samples exist', () => {
    const r = analyzeCostTrend(mixedSample(), { now: NOW });
    expect(r.forecast_30day).not.toBeNull();
    if (r.forecast_30day !== null) {
      expect(r.forecast_30day).toBeGreaterThan(0);
    }
  });

  it('breaks down cost by source category', () => {
    const r = analyzeCostTrend(mixedSample(), { now: NOW });
    expect(r.source_breakdown.compute).toBe(80 + 120);
    expect(r.source_breakdown.storage).toBe(90);
    expect(r.source_breakdown.egress).toBe(100);
    expect(r.source_breakdown.api).toBe(110);
    expect(r.source_breakdown.aggregate).toBe(130);
  });

  it('returns null mean and median for empty window', () => {
    const r = analyzeCostTrend([], { now: NOW });
    expect(r.total_samples).toBe(0);
    expect(r.total_cost).toBe(0);
    expect(r.mean_cost).toBeNull();
    expect(r.median_cost).toBeNull();
    expect(r.forecast_30day).toBeNull();
    expect(r.slope_per_day).toBe(0);
  });
});
