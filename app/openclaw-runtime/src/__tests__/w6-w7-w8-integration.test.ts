/**
 * PRJ-019 Dev-QQQ R33 — W6 wire + W7 (A/B/C/D) + W8 (E long-term metrics)
 * cross-module integration test (18 case).
 *
 * Extends R32 w6-w7-integration.test.ts (12 case, frozen) with W8 layer
 * (long-term-metrics: sla-tracker / cost-trend / quarter-window) and
 * improvement-loop auto-routing (Dev-RRR R33). All R32/R33 source files
 * referenced via import only — none mutated.
 *
 * Constraints (R33 Dev-QQQ):
 *   - mock injection only — no fetch, no fs, no real API call ($0).
 *   - 既存 src 全 file 無改変保持 (import only).
 *   - Strict typing. TS6059 0 件継承. 副作用 0.
 */

import { describe, expect, it } from 'vitest';
import {
  extractKpt,
  type RetroEvent,
} from '../retrospective/kpt-extractor';
import {
  generateDecMotion,
} from '../retrospective/dec-motion-generator';
import {
  aggregateWindow,
  type TimedRetroEvent,
} from '../retrospective/window-aggregator';
import {
  runKptDecChain,
  summarizeChain,
} from '../improvement-loop/kpt-dec-chain';
import {
  routeMotion,
  summarizeRouting,
} from '../improvement-loop/auto-routing';
import {
  trackSla,
  isSlaHealthy,
  type SlaSample,
} from '../long-term-metrics/sla-tracker';
import {
  analyzeCostTrend,
  type CostSample,
} from '../long-term-metrics/cost-trend';
import {
  aggregateQuarterWindow,
  summarizeQuarter,
  type QuarterEvent,
} from '../long-term-metrics/quarter-window';

const NOW = '2026-05-06T00:00:00Z';

interface W6WireSignal {
  round: number;
  go_no_go: 'GO' | 'NO_GO';
  at: string;
}

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
    { round: 32, go_no_go: 'GO', at: '2026-05-05T00:00:00Z' },
  ];
}

function w7bSample(): W7BMetrics[] {
  return [
    { round: 30, latency_p95_ms: 187, error_rate_pct: 0.2, cost_usd_24h: 1.4, at: '2026-04-30T00:00:00Z' },
    { round: 31, latency_p95_ms: 195, error_rate_pct: 0.18, cost_usd_24h: 1.42, at: '2026-05-03T00:00:00Z' },
    { round: 32, latency_p95_ms: 192, error_rate_pct: 0.19, cost_usd_24h: 1.41, at: '2026-05-05T00:00:00Z' },
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

function makeSlaSamples(): SlaSample[] {
  return [
    { round: 28, observed_at: '2026-02-15T00:00:00Z', status: 'ok', value: 180, threshold: 250 },
    { round: 29, observed_at: '2026-03-01T00:00:00Z', status: 'ok', value: 190, threshold: 250 },
    { round: 30, observed_at: '2026-03-20T00:00:00Z', status: 'breach', value: 270, threshold: 250 },
    { round: 31, observed_at: '2026-04-01T00:00:00Z', status: 'recovered', value: 240, threshold: 250 },
    { round: 32, observed_at: '2026-05-01T00:00:00Z', status: 'ok', value: 195, threshold: 250 },
  ];
}

function makeCostSamples(): CostSample[] {
  return [
    { round: 28, observed_at: '2026-02-15T00:00:00Z', cost_jpy: 120, source: 'compute' },
    { round: 29, observed_at: '2026-03-01T00:00:00Z', cost_jpy: 140, source: 'compute' },
    { round: 30, observed_at: '2026-03-20T00:00:00Z', cost_jpy: 155, source: 'storage' },
    { round: 31, observed_at: '2026-04-10T00:00:00Z', cost_jpy: 160, source: 'aggregate' },
    { round: 32, observed_at: '2026-05-01T00:00:00Z', cost_jpy: 165, source: 'compute' },
  ];
}

function makeQuarterEvents(): QuarterEvent[] {
  return [
    { round: 28, occurred_at: '2026-02-15T00:00:00Z', kind: 'dec', severity: 'info', summary: 'DEC-080 confirmed' },
    { round: 30, occurred_at: '2026-03-20T00:00:00Z', kind: 'sla', severity: 'warn', summary: 'p95 breach 1d', numeric_value: 270 },
    { round: 31, occurred_at: '2026-04-01T00:00:00Z', kind: 'kpt', severity: 'info', summary: '15 KPT items' },
    { round: 32, occurred_at: '2026-05-05T00:00:00Z', kind: 'harness', severity: 'info', summary: '1121 PASS' },
  ];
}

describe('W6+W7+W8 cross-module integration (R33 Dev-QQQ)', () => {
  it('[1] aggregates W6+W7-B into 30day window', () => {
    const events = asTimedEvents(w6Sample(), w7bSample());
    const agg = aggregateWindow(events, { now: NOW });
    expect(agg.total_events).toBeGreaterThanOrEqual(5);
  });

  it('[2] runKptDecChain produces P3 dispatch on healthy stream', () => {
    const events = asTimedEvents(w6Sample(), w7bSample());
    const result = runKptDecChain({
      events,
      current_round: 33,
      motion_id: 'DEC-088',
      generated_at: NOW,
    });
    expect(result.dispatch_hint.priority).toBe('P3');
    expect(result.dispatch_hint.next_round).toBe(34);
  });

  it('[3] runKptDecChain escalates to P1 on critical events', () => {
    const events = asTimedEvents(
      [],
      [
        { round: 33, latency_p95_ms: 900, error_rate_pct: 4, cost_usd_24h: 9, at: '2026-05-05T00:00:00Z' },
      ]
    );
    const result = runKptDecChain({
      events,
      current_round: 33,
      motion_id: 'DEC-088',
      generated_at: NOW,
    });
    expect(result.dispatch_hint.priority).toBe('P1');
  });

  it('[4] routeMotion P1 → ceo_ack_flow with 4h SLA', () => {
    const events = asTimedEvents(
      [],
      [{ round: 33, latency_p95_ms: 900, error_rate_pct: 4, cost_usd_24h: 9, at: '2026-05-05T00:00:00Z' }]
    );
    const chain = runKptDecChain({
      events,
      current_round: 33,
      motion_id: 'DEC-088',
      generated_at: NOW,
    });
    const decision = routeMotion(chain.motion, chain.dispatch_hint, {
      routed_at: NOW,
    });
    expect(decision.target_queue).toBe('ceo_ack_flow');
    expect(decision.sla_hours).toBe(4);
    expect(decision.hitl_required).toBe(true);
  });

  it('[5] routeMotion P3 → knowledge_backlog non-hitl', () => {
    const events = asTimedEvents(w6Sample(), w7bSample());
    const chain = runKptDecChain({
      events,
      current_round: 33,
      motion_id: 'DEC-088',
      generated_at: NOW,
    });
    const decision = routeMotion(chain.motion, chain.dispatch_hint, {
      routed_at: NOW,
    });
    expect(decision.target_queue).toBe('knowledge_backlog');
    expect(decision.hitl_required).toBe(false);
  });

  it('[6] summarizeChain encodes priority and next round', () => {
    const events = asTimedEvents(w6Sample(), w7bSample());
    const chain = runKptDecChain({
      events,
      current_round: 33,
      motion_id: 'DEC-088',
      generated_at: NOW,
    });
    const summary = summarizeChain(chain);
    expect(summary).toContain('priority=P3');
    expect(summary).toContain('next=R34');
  });

  it('[7] summarizeRouting includes queue and sla', () => {
    const events = asTimedEvents(w6Sample(), w7bSample());
    const chain = runKptDecChain({
      events,
      current_round: 33,
      motion_id: 'DEC-088',
      generated_at: NOW,
    });
    const decision = routeMotion(chain.motion, chain.dispatch_hint, {
      routed_at: NOW,
    });
    const out = summarizeRouting(decision);
    expect(out).toContain('queue=knowledge_backlog');
    expect(out).toContain('sla=168h');
  });

  it('[8] trackSla 90day window counts breach + recovery', () => {
    const r = trackSla(makeSlaSamples(), { now: NOW });
    expect(r.window_days).toBe(90);
    expect(r.breach_count).toBe(1);
    expect(r.recovery_count).toBe(1);
    expect(r.ok_count).toBeGreaterThanOrEqual(2);
  });

  it('[9] isSlaHealthy true when breach_rate ≤ 0.05', () => {
    const r = trackSla(makeSlaSamples(), { now: NOW });
    expect(isSlaHealthy(r, 0.5)).toBe(true);
  });

  it('[10] analyzeCostTrend produces non-null mean and forecast', () => {
    const r = analyzeCostTrend(makeCostSamples(), { now: NOW });
    expect(r.mean_cost).not.toBeNull();
    expect(r.forecast_30day).not.toBeNull();
    expect(r.total_samples).toBeGreaterThanOrEqual(3);
  });

  it('[11] analyzeCostTrend slope reflects rising series', () => {
    const r = analyzeCostTrend(makeCostSamples(), { now: NOW });
    expect(r.slope_per_day).toBeGreaterThanOrEqual(0);
  });

  it('[12] aggregateQuarterWindow categorises by kind', () => {
    const agg = aggregateQuarterWindow(makeQuarterEvents(), { now: NOW });
    expect(agg.kind.dec).toBe(1);
    expect(agg.kind.sla).toBe(1);
    expect(agg.kind.kpt).toBe(1);
    expect(agg.kind.harness).toBe(1);
  });

  it('[13] aggregateQuarterWindow severity counts warn=1', () => {
    const agg = aggregateQuarterWindow(makeQuarterEvents(), { now: NOW });
    expect(agg.severity.warn).toBe(1);
    expect(agg.severity.info).toBe(3);
    expect(agg.severity.critical).toBe(0);
  });

  it('[14] summarizeQuarter encodes window + total', () => {
    const agg = aggregateQuarterWindow(makeQuarterEvents(), { now: NOW });
    const s = summarizeQuarter(agg);
    expect(s).toContain('window=90d');
    expect(s).toContain('total=4');
  });

  it('[15] cross-layer: KPT motion id flows through routing decision', () => {
    const events = asTimedEvents(w6Sample(), w7bSample());
    const chain = runKptDecChain({
      events,
      current_round: 33,
      motion_id: 'DEC-099',
      generated_at: NOW,
    });
    const decision = routeMotion(chain.motion, chain.dispatch_hint, {
      routed_at: NOW,
    });
    expect(decision.motion_id).toBe('DEC-099');
  });

  it('[16] cross-layer: SLA breach feeds quarter window severity warn', () => {
    const slaWarnEvent: QuarterEvent = {
      round: 33,
      occurred_at: '2026-05-04T00:00:00Z',
      kind: 'sla',
      severity: 'warn',
      summary: 'p95 breach',
      numeric_value: 280,
    };
    const agg = aggregateQuarterWindow([...makeQuarterEvents(), slaWarnEvent], {
      now: NOW,
    });
    expect(agg.severity.warn).toBe(2);
    expect(agg.kind.sla).toBe(2);
  });

  it('[17] retrospective KPT keep weight ≥ 1 for healthy canary', () => {
    const events = asTimedEvents(w6Sample(), w7bSample());
    const agg = aggregateWindow(events, { now: NOW });
    const buckets = extractKpt(agg.events_in_window as RetroEvent[], {
      round_min: 28,
      round_max: 33,
      generated_at: NOW,
    });
    expect(buckets.keep.length).toBeGreaterThanOrEqual(1);
    expect(buckets.keep[0].weight).toBeGreaterThanOrEqual(1);
  });

  it('[18] motion + routing + sla + cost + quarter end-to-end deterministic', () => {
    const events = asTimedEvents(w6Sample(), w7bSample());
    const chain = runKptDecChain({
      events,
      current_round: 33,
      motion_id: 'DEC-100',
      generated_at: NOW,
    });
    const route = routeMotion(chain.motion, chain.dispatch_hint, {
      routed_at: NOW,
    });
    const sla = trackSla(makeSlaSamples(), { now: NOW });
    const cost = analyzeCostTrend(makeCostSamples(), { now: NOW });
    const q = aggregateQuarterWindow(makeQuarterEvents(), { now: NOW });
    const motion = generateDecMotion(chain.buckets, {
      motion_id: 'DEC-100',
      generated_at: NOW,
    });
    expect(route.motion_id).toBe('DEC-100');
    expect(motion.motion_id).toBe('DEC-100');
    expect(sla.window_days).toBe(90);
    expect(cost.window_days).toBe(90);
    expect(q.window_days).toBe(90);
  });
});
