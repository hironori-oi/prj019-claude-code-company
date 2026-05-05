/**
 * PRJ-019 Dev-PPP R32 — window-aggregator.ts unit tests
 * 7 case (R32 W7-C harness contribution).
 */

import { describe, expect, it } from 'vitest';
import {
  aggregateWindow,
  summarizeAggregate,
  type TimedRetroEvent,
} from '../window-aggregator';

const NOW = '2026-05-06T00:00:00Z';

function ev(
  round: number,
  occurred_at: string,
  overrides: Partial<TimedRetroEvent> = {}
): TimedRetroEvent {
  return {
    round,
    occurred_at,
    kind: 'dec',
    severity: 'info',
    summary: `r${round}`,
    ...overrides,
  };
}

describe('window-aggregator', () => {
  it('includes events within default 30day window', () => {
    const events = [ev(30, '2026-04-20T00:00:00Z'), ev(31, '2026-05-01T00:00:00Z')];
    const out = aggregateWindow(events, { now: NOW });
    expect(out.total_events).toBe(2);
    expect(out.window_days).toBe(30);
  });

  it('excludes events older than window', () => {
    const events = [ev(1, '2026-01-01T00:00:00Z'), ev(31, '2026-05-01T00:00:00Z')];
    const out = aggregateWindow(events, { now: NOW });
    expect(out.total_events).toBe(1);
  });

  it('excludes future events past now', () => {
    const events = [ev(31, '2026-05-01T00:00:00Z'), ev(99, '2099-01-01T00:00:00Z')];
    const out = aggregateWindow(events, { now: NOW });
    expect(out.total_events).toBe(1);
  });

  it('counts severity and kind breakdown', () => {
    const events = [
      ev(30, '2026-05-01T00:00:00Z', { severity: 'critical', kind: 'pitfall' }),
      ev(31, '2026-05-02T00:00:00Z', { severity: 'warn', kind: 'alert' }),
      ev(32, '2026-05-03T00:00:00Z', { severity: 'info', kind: 'dec' }),
    ];
    const out = aggregateWindow(events, { now: NOW });
    expect(out.severity).toEqual({ info: 1, warn: 1, critical: 1 });
    expect(out.kind.pitfall).toBe(1);
    expect(out.kind.alert).toBe(1);
    expect(out.kind.dec).toBe(1);
  });

  it('counts unique rounds correctly', () => {
    const events = [
      ev(30, '2026-05-01T00:00:00Z'),
      ev(30, '2026-05-02T00:00:00Z'),
      ev(31, '2026-05-03T00:00:00Z'),
    ];
    const out = aggregateWindow(events, { now: NOW });
    expect(out.unique_rounds).toBe(2);
  });

  it('counts recurring events', () => {
    const events = [
      ev(30, '2026-05-01T00:00:00Z', { recurring: true }),
      ev(31, '2026-05-02T00:00:00Z'),
    ];
    const out = aggregateWindow(events, { now: NOW });
    expect(out.recurring_count).toBe(1);
  });

  it('throws on invalid ISO and zero window', () => {
    expect(() => aggregateWindow([], { now: 'not-a-date' })).toThrow();
    expect(() => aggregateWindow([], { now: NOW, window_days: 0 })).toThrow();
    const out = aggregateWindow([ev(30, '2026-05-01T00:00:00Z')], { now: NOW });
    expect(summarizeAggregate(out)).toContain('window=30d');
  });
});
