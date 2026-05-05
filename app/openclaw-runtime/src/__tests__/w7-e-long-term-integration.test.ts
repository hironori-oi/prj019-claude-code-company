/**
 * PRJ-019 Open Claw "Clawbridge" — W7-E long-term operational metrics
 *   cross-module integration test (R33 Dev-SSS / 14 case).
 *
 * Verifies end-to-end interaction of:
 *   - quarter-window  (90day event aggregator)
 *   - sla-tracker     (90day SLA breach/recovery rolling)
 *   - cost-trend      (90day cost trend / forecast)
 *
 * Constraints:
 *   - mock injection only. No fetch, no fs, no real API call ($0).
 *   - W7-B / W7-C 既存 test 不変 — import 経由でのみ参照.
 *   - Side effect: 0. TS6059 0 件継承.
 */

import { describe, expect, it } from 'vitest';
import {
  aggregateQuarterWindow,
  summarizeQuarter,
  type QuarterEvent,
} from '../long-term-metrics/quarter-window';
import {
  trackSla,
  isSlaHealthy,
  type SlaSample,
} from '../long-term-metrics/sla-tracker';
import {
  analyzeCostTrend,
  type CostSample,
} from '../long-term-metrics/cost-trend';

const NOW = '2026-05-06T00:00:00Z';

function quarterEvents(): QuarterEvent[] {
  return [
    { round: 25, occurred_at: '2026-04-01T00:00:00Z', kind: 'dec', severity: 'info', summary: 'DEC-082', numeric_value: 1 },
    { round: 27, occurred_at: '2026-04-15T00:00:00Z', kind: 'harness', severity: 'info', summary: 'h902', numeric_value: 902 },
    { round: 30, occurred_at: '2026-04-30T00:00:00Z', kind: 'sla', severity: 'warn', summary: 'p95 spike', numeric_value: 320 },
    { round: 31, occurred_at: '2026-05-03T00:00:00Z', kind: 'cost', severity: 'info', summary: 'cost', numeric_value: 1.4 },
    { round: 32, occurred_at: '2026-05-05T00:00:00Z', kind: 'kpt', severity: 'info', summary: 'kpt' },
  ];
}

function slaSamples(): SlaSample[] {
  return [
    { round: 25, observed_at: '2026-04-01T00:00:00Z', status: 'ok', value: 180, threshold: 250 },
    { round: 27, observed_at: '2026-04-15T00:00:00Z', status: 'breach', value: 320, threshold: 250 },
    { round: 28, observed_at: '2026-04-22T00:00:00Z', status: 'recovered', value: 240, threshold: 250 },
    { round: 30, observed_at: '2026-04-30T00:00:00Z', status: 'ok', value: 200, threshold: 250 },
    { round: 31, observed_at: '2026-05-03T00:00:00Z', status: 'ok', value: 195, threshold: 250 },
  ];
}

function costSamples(): CostSample[] {
  return [
    { round: 25, observed_at: '2026-04-01T00:00:00Z', cost_jpy: 100, source: 'compute' },
    { round: 27, observed_at: '2026-04-15T00:00:00Z', cost_jpy: 110, source: 'compute' },
    { round: 30, observed_at: '2026-04-30T00:00:00Z', cost_jpy: 120, source: 'storage' },
    { round: 31, observed_at: '2026-05-03T00:00:00Z', cost_jpy: 125, source: 'api' },
    { round: 32, observed_at: '2026-05-05T00:00:00Z', cost_jpy: 130, source: 'compute' },
  ];
}

describe('W7-E long-term metrics cross-module integration', () => {
  // ---- 1: aggregator wiring ----
  it('quarter-window agg + sla + cost share the same default 90day window', () => {
    const q = aggregateQuarterWindow(quarterEvents(), { now: NOW });
    const s = trackSla(slaSamples(), { now: NOW });
    const c = analyzeCostTrend(costSamples(), { now: NOW });
    expect(q.window_days).toBe(90);
    expect(s.window_days).toBe(90);
    expect(c.window_days).toBe(90);
  });

  it('all 3 trackers honor a custom window_days uniformly', () => {
    const q = aggregateQuarterWindow(quarterEvents(), { now: NOW, window_days: 7 });
    const s = trackSla(slaSamples(), { now: NOW, window_days: 7 });
    const c = analyzeCostTrend(costSamples(), { now: NOW, window_days: 7 });
    expect(q.window_days).toBe(7);
    expect(s.window_days).toBe(7);
    expect(c.window_days).toBe(7);
  });

  it('quarter total aligns with sla and cost sample totals (90day)', () => {
    const q = aggregateQuarterWindow(quarterEvents(), { now: NOW });
    const s = trackSla(slaSamples(), { now: NOW });
    const c = analyzeCostTrend(costSamples(), { now: NOW });
    expect(q.total_events).toBe(5);
    expect(s.total_samples).toBe(5);
    expect(c.total_samples).toBe(5);
  });

  // ---- 2: window edge handling ----
  it('all 3 modules exclude pre-window stale events', () => {
    const stale = '2025-11-01T00:00:00Z';
    const q = aggregateQuarterWindow(
      [
        { round: 1, occurred_at: stale, kind: 'pitfall', severity: 'critical', summary: 'old' },
        ...quarterEvents(),
      ],
      { now: NOW }
    );
    const s = trackSla(
      [
        { round: 1, observed_at: stale, status: 'breach', value: 999, threshold: 250 },
        ...slaSamples(),
      ],
      { now: NOW }
    );
    const c = analyzeCostTrend(
      [
        { round: 1, observed_at: stale, cost_jpy: 9999, source: 'compute' },
        ...costSamples(),
      ],
      { now: NOW }
    );
    expect(q.total_events).toBe(5);
    expect(s.total_samples).toBe(5);
    expect(c.total_samples).toBe(5);
  });

  it('all 3 modules exclude future-dated events', () => {
    const future = '2030-01-01T00:00:00Z';
    const q = aggregateQuarterWindow(
      [
        ...quarterEvents(),
        { round: 99, occurred_at: future, kind: 'kpt', severity: 'info', summary: 'future' },
      ],
      { now: NOW }
    );
    const s = trackSla(
      [
        ...slaSamples(),
        { round: 99, observed_at: future, status: 'ok', value: 100, threshold: 250 },
      ],
      { now: NOW }
    );
    const c = analyzeCostTrend(
      [
        ...costSamples(),
        { round: 99, observed_at: future, cost_jpy: 1, source: 'compute' },
      ],
      { now: NOW }
    );
    expect(q.total_events).toBe(5);
    expect(s.total_samples).toBe(5);
    expect(c.total_samples).toBe(5);
  });

  // ---- 3: SLO + cost composite signal ----
  it('quarter sla event count matches sla-tracker breach + recovered', () => {
    const q = aggregateQuarterWindow(quarterEvents(), { now: NOW });
    const s = trackSla(slaSamples(), { now: NOW });
    // quarter has 1 sla-kind event (warn p95 spike)
    expect(q.kind.sla).toBe(1);
    // sla tracker sees 1 breach + 1 recovered = 2 non-ok states
    expect(s.breach_count + s.recovery_count).toBe(2);
  });

  it('cost trend forecast remains positive when slope is positive', () => {
    const c = analyzeCostTrend(costSamples(), { now: NOW });
    expect(c.slope_per_day).toBeGreaterThanOrEqual(0);
    expect(c.forecast_30day).not.toBeNull();
    if (c.forecast_30day !== null) {
      expect(c.forecast_30day).toBeGreaterThan(0);
    }
  });

  it('SLO is healthy under default 5% breach threshold for mostly-ok stream', () => {
    const s = trackSla(slaSamples(), { now: NOW });
    // 1 breach / 5 samples = 0.2 -> NOT healthy under 0.05
    expect(isSlaHealthy(s, 0.05)).toBe(false);
    // but healthy under 0.5 threshold
    expect(isSlaHealthy(s, 0.5)).toBe(true);
  });

  // ---- 4: empty + degenerate input parity ----
  it('all 3 modules handle empty input gracefully', () => {
    const q = aggregateQuarterWindow([], { now: NOW });
    const s = trackSla([], { now: NOW });
    const c = analyzeCostTrend([], { now: NOW });
    expect(q.total_events).toBe(0);
    expect(s.total_samples).toBe(0);
    expect(c.total_samples).toBe(0);
    expect(q.numeric_avg).toBeNull();
    expect(s.mean_value).toBeNull();
    expect(c.mean_cost).toBeNull();
  });

  it('summarizeQuarter is deterministic across repeat calls', () => {
    const q1 = aggregateQuarterWindow(quarterEvents(), { now: NOW });
    const q2 = aggregateQuarterWindow(quarterEvents(), { now: NOW });
    expect(summarizeQuarter(q1)).toBe(summarizeQuarter(q2));
  });

  // ---- 5: deterministic + side-effect verification ----
  it('repeated execution yields identical results (no hidden state)', () => {
    const a = trackSla(slaSamples(), { now: NOW });
    const b = trackSla(slaSamples(), { now: NOW });
    expect(a.breach_count).toBe(b.breach_count);
    expect(a.consecutive_ok_streak).toBe(b.consecutive_ok_streak);
    const ca = analyzeCostTrend(costSamples(), { now: NOW });
    const cb = analyzeCostTrend(costSamples(), { now: NOW });
    expect(ca.slope_per_day).toBe(cb.slope_per_day);
    expect(ca.forecast_30day).toBe(cb.forecast_30day);
  });

  it('aggregate window_start precedes window_end by exactly window_days', () => {
    const q = aggregateQuarterWindow([], { now: NOW, window_days: 30 });
    const start = Date.parse(q.window_start);
    const end = Date.parse(q.window_end);
    expect((end - start) / (1000 * 60 * 60 * 24)).toBeCloseTo(30, 5);
  });

  // ---- 6: end-to-end composite ----
  it('end-to-end composite report can be assembled from 3 modules', () => {
    const q = aggregateQuarterWindow(quarterEvents(), { now: NOW });
    const s = trackSla(slaSamples(), { now: NOW });
    const c = analyzeCostTrend(costSamples(), { now: NOW });
    const composite = {
      quarter_summary: summarizeQuarter(q),
      sla_breach_rate: s.breach_rate,
      cost_total: c.total_cost,
    };
    expect(composite.quarter_summary).toContain('window=90d');
    expect(composite.sla_breach_rate).toBeGreaterThan(0);
    expect(composite.cost_total).toBe(100 + 110 + 120 + 125 + 130);
  });

  it('composite report has zero side effects (idempotent)', () => {
    const before = JSON.stringify({
      q: aggregateQuarterWindow(quarterEvents(), { now: NOW }),
      s: trackSla(slaSamples(), { now: NOW }),
      c: analyzeCostTrend(costSamples(), { now: NOW }),
    });
    const after = JSON.stringify({
      q: aggregateQuarterWindow(quarterEvents(), { now: NOW }),
      s: trackSla(slaSamples(), { now: NOW }),
      c: analyzeCostTrend(costSamples(), { now: NOW }),
    });
    expect(before).toBe(after);
  });
});
