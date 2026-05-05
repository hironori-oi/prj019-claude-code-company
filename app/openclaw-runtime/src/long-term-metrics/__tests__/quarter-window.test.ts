/**
 * PRJ-019 Open Claw "Clawbridge" — W7-E long-term operational metrics
 *   quarter-window unit test (R33 Dev-SSS / 8 case)
 *
 * Constraints:
 *   - Pure function tests. No fetch, no fs, no real API call ($0).
 *   - Strict typing. TS6059 0 件継承.
 *   - Side effect: 0.
 */

import { describe, expect, it } from 'vitest';
import {
  aggregateQuarterWindow,
  summarizeQuarter,
  type QuarterEvent,
} from '../quarter-window';

const NOW = '2026-05-06T00:00:00Z';

function sample(): QuarterEvent[] {
  return [
    {
      round: 25,
      occurred_at: '2026-04-01T00:00:00Z',
      kind: 'dec',
      severity: 'info',
      summary: 'DEC-082 confirmed',
      numeric_value: 1,
    },
    {
      round: 27,
      occurred_at: '2026-04-15T00:00:00Z',
      kind: 'harness',
      severity: 'info',
      summary: 'harness 902 PASS',
      numeric_value: 902,
    },
    {
      round: 30,
      occurred_at: '2026-04-30T00:00:00Z',
      kind: 'sla',
      severity: 'warn',
      summary: 'p95 spike',
      numeric_value: 320,
    },
    {
      round: 31,
      occurred_at: '2026-05-03T00:00:00Z',
      kind: 'cost',
      severity: 'info',
      summary: 'cost 1.4 usd',
      numeric_value: 1.4,
    },
    {
      round: 32,
      occurred_at: '2026-05-05T00:00:00Z',
      kind: 'kpt',
      severity: 'info',
      summary: 'KPT keep',
    },
    // out of window (> 90 days before NOW)
    {
      round: 5,
      occurred_at: '2025-11-01T00:00:00Z',
      kind: 'pitfall',
      severity: 'critical',
      summary: 'old pitfall',
      numeric_value: 9,
    },
  ];
}

describe('aggregateQuarterWindow (W7-E quarter-window)', () => {
  it('aggregates events within default 90day window', () => {
    const agg = aggregateQuarterWindow(sample(), { now: NOW });
    expect(agg.window_days).toBe(90);
    expect(agg.total_events).toBe(5);
    expect(agg.unique_rounds).toBe(5);
  });

  it('excludes events older than the window', () => {
    const agg = aggregateQuarterWindow(sample(), { now: NOW });
    const rounds = agg.events_in_window.map((e) => e.round);
    expect(rounds).not.toContain(5);
    expect(agg.kind.pitfall).toBe(0);
  });

  it('excludes events occurring after now', () => {
    const future: QuarterEvent[] = [
      {
        round: 99,
        occurred_at: '2030-01-01T00:00:00Z',
        kind: 'kpt',
        severity: 'info',
        summary: 'future',
      },
      ...sample(),
    ];
    const agg = aggregateQuarterWindow(future, { now: NOW });
    expect(agg.events_in_window.find((e) => e.round === 99)).toBeUndefined();
  });

  it('breaks down severity correctly', () => {
    const agg = aggregateQuarterWindow(sample(), { now: NOW });
    expect(agg.severity.info).toBe(4);
    expect(agg.severity.warn).toBe(1);
    expect(agg.severity.critical).toBe(0);
  });

  it('breaks down kind correctly', () => {
    const agg = aggregateQuarterWindow(sample(), { now: NOW });
    expect(agg.kind.dec).toBe(1);
    expect(agg.kind.harness).toBe(1);
    expect(agg.kind.sla).toBe(1);
    expect(agg.kind.cost).toBe(1);
    expect(agg.kind.kpt).toBe(1);
  });

  it('computes numeric_avg only over numeric events', () => {
    const agg = aggregateQuarterWindow(sample(), { now: NOW });
    // 1 + 902 + 320 + 1.4 = 1224.4 / 4 numeric samples
    expect(agg.numeric_avg).not.toBeNull();
    if (agg.numeric_avg !== null) {
      expect(agg.numeric_avg).toBeCloseTo(1224.4 / 4, 5);
    }
  });

  it('respects custom window_days', () => {
    const agg = aggregateQuarterWindow(sample(), { now: NOW, window_days: 7 });
    // only 2026-04-30 onward should be in window
    expect(agg.window_days).toBe(7);
    expect(agg.total_events).toBe(3);
  });

  it('summarizeQuarter produces deterministic compact string', () => {
    const agg = aggregateQuarterWindow(sample(), { now: NOW });
    const s = summarizeQuarter(agg);
    expect(s).toContain('window=90d');
    expect(s).toContain('total=5');
    expect(s).toContain('rounds=5');
    expect(s).toContain('sev=info:4/warn:1/crit:0');
  });
});
