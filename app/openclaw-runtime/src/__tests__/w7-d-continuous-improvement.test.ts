/**
 * PRJ-019 Dev-RRR R33 — W7-D continuous improvement loop
 *   end-to-end integration test (10 case).
 *
 * Verifies the full chain:
 *   shouldFire(scheduler) → runKptDecChain(orchestrator) → routeMotion(auto-routing)
 *
 * Constraints:
 *   - mock injection only — no fetch / no fs / no real API call ($0).
 *   - R32 retrospective 3 modules 無改変保持 (import only).
 *   - TS6059 0 件継承.
 *   - 副作用 0.
 */

import { describe, expect, it } from 'vitest';
import { shouldFire, type ScheduleConfig } from '../improvement-loop/scheduler';
import {
  runKptDecChain,
  summarizeChain,
  type KptDecChainOptions,
} from '../improvement-loop/kpt-dec-chain';
import {
  routeMotion,
  summarizeRouting,
} from '../improvement-loop/auto-routing';
import type { TimedRetroEvent } from '../retrospective/window-aggregator';

const NOW = '2026-05-06T00:30:00Z';

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

const baseChainOpts = (
  overrides: Partial<KptDecChainOptions> = {}
): KptDecChainOptions => ({
  events: [],
  current_round: 32,
  motion_id: 'DEC-087-DRAFT',
  generated_at: NOW,
  window_days: 30,
  ...overrides,
});

describe('W7-D continuous improvement loop (integration)', () => {
  it('full pipeline fires, chains, and routes a P3 motion (happy path)', () => {
    const cfg: ScheduleConfig = { cadence: 'daily', hour_utc: 0 };
    const fire = shouldFire(NOW, null, cfg);
    expect(fire.should_fire).toBe(true);

    const events = [ev(30, 'dec', 'info', 1, 'DEC-085 confirmed')];
    const chain = runKptDecChain(baseChainOpts({ events }));
    expect(chain.dispatch_hint.priority).toBe('P3');

    const routing = routeMotion(chain.motion, chain.dispatch_hint, {
      routed_at: NOW,
    });
    expect(routing.target_queue).toBe('knowledge_backlog');
    expect(routing.hitl_required).toBe(false);
  });

  it('critical event → P1 → ceo_ack_flow with HITL', () => {
    const events = [ev(31, 'harness', 'critical', 1, 'TS6059 leak')];
    const chain = runKptDecChain(baseChainOpts({ events }));
    const routing = routeMotion(chain.motion, chain.dispatch_hint, {
      routed_at: NOW,
    });
    expect(chain.dispatch_hint.priority).toBe('P1');
    expect(routing.target_queue).toBe('ceo_ack_flow');
    expect(routing.hitl_required).toBe(true);
    expect(routing.sla_hours).toBe(4);
  });

  it('recurring warn → P2 → pm_ratification_queue', () => {
    const events = [ev(30, 'alert', 'warn', 1, 'flaky canary', true)];
    const chain = runKptDecChain(baseChainOpts({ events }));
    const routing = routeMotion(chain.motion, chain.dispatch_hint, {
      routed_at: NOW,
    });
    expect(chain.dispatch_hint.priority).toBe('P2');
    expect(routing.target_queue).toBe('pm_ratification_queue');
    expect(routing.notify_owners).toContain('PM');
  });

  it('scheduler skip → no chain run (caller responsibility)', () => {
    const cfg: ScheduleConfig = { cadence: 'monthly', monthly_dom: 15, hour_utc: 0 };
    const fire = shouldFire(NOW, null, cfg);
    expect(fire.should_fire).toBe(false);
    // we do not run the chain when scheduler skips
  });

  it('30-day window filter excludes ancient events from chain', () => {
    const events = [
      ev(5, 'harness', 'critical', 90, 'old crit'),
      ev(31, 'dec', 'info', 1, 'recent'),
    ];
    const chain = runKptDecChain(baseChainOpts({ events, window_days: 30 }));
    expect(chain.aggregate.total_events).toBe(1);
    expect(chain.dispatch_hint.priority).toBe('P3');
  });

  it('chain dispatch_hint.next_round = current_round + 1', () => {
    const chain = runKptDecChain(baseChainOpts({ current_round: 33 }));
    expect(chain.dispatch_hint.next_round).toBe(34);
  });

  it('motion approval_gate is always pending_hitl regardless of routing override', () => {
    const events = [ev(30, 'dec', 'info', 1)];
    const chain = runKptDecChain(baseChainOpts({ events }));
    expect(chain.motion.approval_gate).toBe('pending_hitl');
    const routing = routeMotion(chain.motion, chain.dispatch_hint, {
      routed_at: NOW,
      override_hitl: false,
    });
    // motion gate is independent of routing hitl override
    expect(chain.motion.approval_gate).toBe('pending_hitl');
    expect(routing.hitl_required).toBe(false);
  });

  it('summarizers produce stable strings for downstream logging', () => {
    const events = [ev(30, 'dec', 'info', 1)];
    const chain = runKptDecChain(baseChainOpts({ events }));
    const routing = routeMotion(chain.motion, chain.dispatch_hint, {
      routed_at: NOW,
    });
    expect(summarizeChain(chain)).toContain('motion=DEC-087-DRAFT');
    expect(summarizeRouting(routing)).toContain('motion=DEC-087-DRAFT');
  });

  it('double-fire guard: scheduler refuses when already fired this hour bucket', () => {
    const cfg: ScheduleConfig = { cadence: 'daily', hour_utc: 0 };
    const first = shouldFire(NOW, null, cfg);
    expect(first.should_fire).toBe(true);
    const second = shouldFire(NOW, NOW, cfg);
    expect(second.should_fire).toBe(false);
  });

  it('empty events stream yields P3 informational motion routed to knowledge_backlog', () => {
    const chain = runKptDecChain(baseChainOpts({ events: [] }));
    expect(chain.aggregate.total_events).toBe(0);
    expect(chain.motion.consequences[0]).toContain('informational only');
    const routing = routeMotion(chain.motion, chain.dispatch_hint, {
      routed_at: NOW,
    });
    expect(routing.target_queue).toBe('knowledge_backlog');
    expect(routing.hitl_required).toBe(false);
  });
});
