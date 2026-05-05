/**
 * PRJ-019 Dev-RRR R33 — kpt-dec-chain.ts unit tests
 * 12 case (R33 W7-D harness contribution).
 */

import { describe, expect, it } from 'vitest';
import {
  runKptDecChain,
  summarizeChain,
  __test__,
  type KptDecChainOptions,
} from '../kpt-dec-chain';
import type { TimedRetroEvent } from '../../retrospective/window-aggregator';

const NOW = '2026-05-06T00:00:00Z';

function ev(
  round: number,
  kind: TimedRetroEvent['kind'],
  severity: TimedRetroEvent['severity'],
  daysAgo: number,
  summary = 'evt',
  recurring?: boolean
): TimedRetroEvent {
  const t = Date.parse(NOW) - daysAgo * 24 * 60 * 60 * 1000;
  return {
    round,
    kind,
    severity,
    summary,
    recurring,
    occurred_at: new Date(t).toISOString(),
  };
}

const baseOpts = (overrides: Partial<KptDecChainOptions> = {}): KptDecChainOptions => ({
  events: [],
  current_round: 32,
  motion_id: 'DEC-087-DRAFT',
  generated_at: NOW,
  window_days: 30,
  ...overrides,
});

describe('kpt-dec-chain', () => {
  it('produces buckets, motion, aggregate, dispatch_hint', () => {
    const events = [ev(30, 'dec', 'info', 1, 'DEC-085 confirmed')];
    const r = runKptDecChain(baseOpts({ events }));
    expect(r.buckets.keep.length).toBe(1);
    expect(r.motion.motion_id).toBe('DEC-087-DRAFT');
    expect(r.aggregate.total_events).toBe(1);
    expect(r.dispatch_hint.next_round).toBe(33);
  });

  it('classifies P1 when critical event present', () => {
    const events = [ev(31, 'harness', 'critical', 2, 'TS6059 leak')];
    const r = runKptDecChain(baseOpts({ events }));
    expect(r.dispatch_hint.priority).toBe('P1');
    expect(r.dispatch_hint.suggested_owners).toContain('CEO');
  });

  it('classifies P1 when problem >= 3', () => {
    const events = [
      ev(28, 'pitfall', 'warn', 1, 'p1'),
      ev(29, 'pitfall', 'warn', 2, 'p2'),
      ev(30, 'pitfall', 'warn', 3, 'p3'),
    ];
    const r = runKptDecChain(baseOpts({ events }));
    expect(r.buckets.problem.length).toBeGreaterThanOrEqual(3);
    expect(r.dispatch_hint.priority).toBe('P1');
  });

  it('classifies P2 when recurring warn present', () => {
    const events = [ev(30, 'alert', 'warn', 1, 'flaky', true)];
    const r = runKptDecChain(baseOpts({ events }));
    expect(r.dispatch_hint.priority).toBe('P2');
    expect(r.dispatch_hint.suggested_owners).toContain('PM');
  });

  it('classifies P2 when warn count >= 2', () => {
    const events = [
      ev(29, 'alert', 'warn', 1, 'a'),
      ev(30, 'alert', 'warn', 2, 'b'),
    ];
    const r = runKptDecChain(baseOpts({ events }));
    expect(r.dispatch_hint.priority).toBe('P2');
  });

  it('classifies P3 when only minor info events', () => {
    const events = [
      ev(30, 'dec', 'info', 1, 'minor'),
      ev(31, 'canary', 'info', 2, 'stage ok'),
    ];
    const r = runKptDecChain(baseOpts({ events }));
    expect(r.dispatch_hint.priority).toBe('P3');
    expect(r.dispatch_hint.suggested_owners).toEqual(['Knowledge']);
  });

  it('respects window_days filter (excludes events outside window)', () => {
    const events = [
      ev(10, 'harness', 'critical', 60, 'old crit'), // outside 30d window
      ev(30, 'dec', 'info', 1, 'in window'),
    ];
    const r = runKptDecChain(baseOpts({ events, window_days: 30 }));
    expect(r.aggregate.total_events).toBe(1);
    expect(r.dispatch_hint.priority).toBe('P3');
  });

  it('bucket window_round_min/max derived from in-window events', () => {
    const events = [
      ev(20, 'dec', 'info', 5, 'a'),
      ev(31, 'dec', 'info', 1, 'b'),
    ];
    const r = runKptDecChain(baseOpts({ events }));
    expect(r.buckets.window_round_min).toBe(20);
    expect(r.buckets.window_round_max).toBe(31);
  });

  it('handles empty events gracefully', () => {
    const r = runKptDecChain(baseOpts({ events: [] }));
    expect(r.aggregate.total_events).toBe(0);
    expect(r.buckets.keep).toHaveLength(0);
    expect(r.buckets.problem).toHaveLength(0);
    expect(r.buckets.try).toHaveLength(0);
    expect(r.dispatch_hint.priority).toBe('P3');
  });

  it('motion source_kpt_summary reflects bucket counts', () => {
    const events = [
      ev(29, 'dec', 'info', 1, 'k1'),
      ev(30, 'pitfall', 'warn', 2, 'p1'),
      ev(31, 'alert', 'warn', 3, 't1', true),
    ];
    const r = runKptDecChain(baseOpts({ events }));
    expect(r.motion.source_kpt_summary.keep + r.motion.source_kpt_summary.problem + r.motion.source_kpt_summary.try).toBe(3);
  });

  it('summarizeChain emits motion_id and priority', () => {
    const events = [ev(30, 'dec', 'info', 1)];
    const r = runKptDecChain(baseOpts({ events }));
    const s = summarizeChain(r);
    expect(s).toContain('motion=DEC-087-DRAFT');
    expect(s).toContain('priority=P3');
    expect(s).toContain('next=R33');
  });

  it('decideDispatch internal: warn count alone (>=2) escalates to P2', () => {
    const buckets = {
      keep: [],
      problem: [],
      try: [],
      generated_at: NOW,
      window_round_min: 1,
      window_round_max: 1,
    };
    const aggregate = {
      window_start: NOW,
      window_end: NOW,
      window_days: 30,
      total_events: 0,
      unique_rounds: 0,
      severity: { info: 0, warn: 2, critical: 0 },
      kind: { dec: 0, harness: 0, alert: 0, canary: 0, pitfall: 0 },
      recurring_count: 0,
      events_in_window: [],
    };
    const hint = __test__.decideDispatch(buckets, aggregate, 32);
    expect(hint.priority).toBe('P2');
  });
});
