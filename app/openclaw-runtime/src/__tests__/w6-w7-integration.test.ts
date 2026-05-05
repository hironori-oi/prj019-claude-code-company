/**
 * PRJ-019 Dev-PPP R32 — W6 wire + W7-A dashboard + W7-B monitoring +
 * W7-C retrospective cross-module integration test (12 case).
 *
 * Constraints:
 *   - mock injection only — no fetch, no fs, no real API call ($0).
 *   - W6 helper / R30/R31 wire mtime 不変 — import 経由でのみ参照.
 *   - 既存 dashboard/page.tsx line 1-113 不変 (R32 append-only API のみ使用).
 */

import { describe, expect, it } from 'vitest';
import {
  extractKpt,
  type RetroEvent,
} from '../retrospective/kpt-extractor';
import {
  generateDecMotion,
  renderMotionMarkdown,
} from '../retrospective/dec-motion-generator';
import {
  aggregateWindow,
  type TimedRetroEvent,
} from '../retrospective/window-aggregator';

const NOW = '2026-05-06T00:00:00Z';

// Synthetic stand-in for W6 wire output (R30/R31 frozen — we only consume
// the shape, never mutate the source files).
interface W6WireSignal {
  round: number;
  go_no_go: 'GO' | 'NO_GO';
  at: string;
}

// Synthetic stand-in for W7-B monitoring (Dev-OOO R32) output shape.
interface W7BMetrics {
  round: number;
  latency_p95_ms: number;
  error_rate_pct: number;
  cost_usd_24h: number;
  at: string;
}

function w6Sample(): W6WireSignal[] {
  return [
    { round: 28, go_no_go: 'GO', at: '2026-04-25T00:00:00Z' },
    { round: 30, go_no_go: 'GO', at: '2026-04-30T00:00:00Z' },
    { round: 31, go_no_go: 'GO', at: '2026-05-03T00:00:00Z' },
  ];
}

function w7bSample(): W7BMetrics[] {
  return [
    { round: 30, latency_p95_ms: 187, error_rate_pct: 0.2, cost_usd_24h: 1.4, at: '2026-04-30T00:00:00Z' },
    { round: 31, latency_p95_ms: 195, error_rate_pct: 0.18, cost_usd_24h: 1.42, at: '2026-05-03T00:00:00Z' },
  ];
}

function asTimedEvents(
  w6: W6WireSignal[],
  w7b: W7BMetrics[]
): TimedRetroEvent[] {
  const out: TimedRetroEvent[] = [];
  for (const s of w6) {
    out.push({
      round: s.round,
      kind: 'canary',
      severity: s.go_no_go === 'GO' ? 'info' : 'critical',
      summary: `W6 ${s.go_no_go}`,
      occurred_at: s.at,
    });
  }
  for (const m of w7b) {
    const sev = m.error_rate_pct > 1 ? 'critical' : m.error_rate_pct > 0.5 ? 'warn' : 'info';
    out.push({
      round: m.round,
      kind: 'harness',
      severity: sev,
      summary: `W7-B p95=${m.latency_p95_ms}ms err=${m.error_rate_pct}%`,
      occurred_at: m.at,
    });
  }
  return out;
}

describe('W6+W7 cross-module integration', () => {
  it('aggregates W6+W7-B events into 30day window', () => {
    const events = asTimedEvents(w6Sample(), w7bSample());
    const agg = aggregateWindow(events, { now: NOW });
    expect(agg.total_events).toBe(5);
  });

  it('classifies all GO canary signals as keep', () => {
    const events = asTimedEvents(w6Sample(), w7bSample());
    const agg = aggregateWindow(events, { now: NOW });
    const buckets = extractKpt(agg.events_in_window as RetroEvent[], {
      round_min: 25,
      round_max: 32,
      generated_at: NOW,
    });
    const canaryKeep = buckets.keep.filter((i) => i.source_event.kind === 'canary');
    expect(canaryKeep.length).toBeGreaterThanOrEqual(3);
  });

  it('respects round window when filtering', () => {
    const events = asTimedEvents(w6Sample(), w7bSample());
    const agg = aggregateWindow(events, { now: NOW });
    const buckets = extractKpt(agg.events_in_window as RetroEvent[], {
      round_min: 31,
      round_max: 32,
      generated_at: NOW,
    });
    const allRounds = [...buckets.keep, ...buckets.problem, ...buckets.try].map(
      (i) => i.source_event.round
    );
    expect(allRounds.every((r) => r >= 31 && r <= 32)).toBe(true);
  });

  it('generates DEC motion with pending_hitl gate', () => {
    const events = asTimedEvents(w6Sample(), w7bSample());
    const agg = aggregateWindow(events, { now: NOW });
    const buckets = extractKpt(agg.events_in_window as RetroEvent[], {
      round_min: 25,
      round_max: 32,
      generated_at: NOW,
    });
    const draft = generateDecMotion(buckets, {
      motion_id: 'DEC-087',
      generated_at: NOW,
    });
    expect(draft.approval_gate).toBe('pending_hitl');
  });

  it('produces renderable markdown for the motion', () => {
    const events = asTimedEvents(w6Sample(), w7bSample());
    const agg = aggregateWindow(events, { now: NOW });
    const buckets = extractKpt(agg.events_in_window as RetroEvent[], {
      round_min: 25,
      round_max: 32,
      generated_at: NOW,
    });
    const draft = generateDecMotion(buckets, {
      motion_id: 'DEC-087',
      generated_at: NOW,
    });
    const md = renderMotionMarkdown(draft);
    expect(md.split('\n').length).toBeGreaterThan(10);
    expect(md).toContain('DEC-087');
  });

  it('handles empty W6 stream gracefully', () => {
    const events = asTimedEvents([], w7bSample());
    const agg = aggregateWindow(events, { now: NOW });
    expect(agg.kind.canary).toBe(0);
    expect(agg.kind.harness).toBe(2);
  });

  it('handles empty W7-B stream gracefully', () => {
    const events = asTimedEvents(w6Sample(), []);
    const agg = aggregateWindow(events, { now: NOW });
    expect(agg.kind.canary).toBe(3);
    expect(agg.kind.harness).toBe(0);
  });

  it('flags critical W7-B errors as problems in KPT', () => {
    const w7bBad: W7BMetrics[] = [
      { round: 32, latency_p95_ms: 800, error_rate_pct: 2.5, cost_usd_24h: 5, at: '2026-05-04T00:00:00Z' },
    ];
    const events = asTimedEvents([], w7bBad);
    const agg = aggregateWindow(events, { now: NOW });
    const buckets = extractKpt(agg.events_in_window as RetroEvent[], {
      round_min: 25,
      round_max: 32,
      generated_at: NOW,
    });
    expect(buckets.problem.length).toBeGreaterThanOrEqual(1);
  });

  it('respects custom window_days', () => {
    const events = asTimedEvents(w6Sample(), w7bSample());
    const agg = aggregateWindow(events, { now: NOW, window_days: 3 });
    expect(agg.total_events).toBeLessThan(5);
  });

  it('window_start is window_days earlier than window_end', () => {
    const agg = aggregateWindow([], { now: NOW, window_days: 7 });
    const start = Date.parse(agg.window_start);
    const end = Date.parse(agg.window_end);
    expect((end - start) / (1000 * 60 * 60 * 24)).toBeCloseTo(7, 5);
  });

  it('preserves deterministic ordering across runs', () => {
    const events = asTimedEvents(w6Sample(), w7bSample());
    const agg1 = aggregateWindow(events, { now: NOW });
    const agg2 = aggregateWindow(events, { now: NOW });
    expect(agg1.events_in_window.map((e) => e.round)).toEqual(
      agg2.events_in_window.map((e) => e.round)
    );
  });

  it('motion title encodes the bucket window range', () => {
    const events = asTimedEvents(w6Sample(), w7bSample());
    const agg = aggregateWindow(events, { now: NOW });
    const buckets = extractKpt(agg.events_in_window as RetroEvent[], {
      round_min: 28,
      round_max: 31,
      generated_at: NOW,
    });
    const draft = generateDecMotion(buckets, {
      motion_id: 'DEC-087',
      generated_at: NOW,
    });
    expect(draft.title).toContain('R28-R31');
  });
});
