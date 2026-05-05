/**
 * PRJ-019 Dev-RRR R33 — auto-routing.ts unit tests
 * 8 case (R33 W7-D harness contribution).
 *
 * Constraints:
 *   - mock injection only — no fetch / no fs / no real API call ($0).
 *   - TS6059 0 件継承.
 */

import { describe, expect, it } from 'vitest';
import { routeMotion, summarizeRouting, __test__ } from '../auto-routing';
import type { DispatchHint } from '../kpt-dec-chain';
import type { DecMotionDraft } from '../../retrospective/dec-motion-generator';

const NOW = '2026-05-06T00:00:00Z';

function motion(id = 'DEC-087-DRAFT'): DecMotionDraft {
  return {
    motion_id: id,
    title: 't',
    context: 'c',
    decision: 'd',
    consequences: [],
    source_kpt_summary: { keep: 0, problem: 0, try: 0 },
    generated_at: NOW,
    approval_gate: 'pending_hitl',
  };
}

function hint(priority: DispatchHint['priority']): DispatchHint {
  return {
    priority,
    next_round: 33,
    reason: `priority=${priority}`,
    suggested_owners: priority === 'P1' ? ['CEO', 'Review', 'Dev'] : priority === 'P2' ? ['PM', 'Dev'] : ['Knowledge'],
  };
}

describe('auto-routing', () => {
  it('P1 routes to ceo_ack_flow with 4h SLA', () => {
    const r = routeMotion(motion(), hint('P1'), { routed_at: NOW });
    expect(r.target_queue).toBe('ceo_ack_flow');
    expect(r.sla_hours).toBe(4);
    expect(r.escalation_after_hours).toBe(2);
  });

  it('P2 routes to pm_ratification_queue with 24h SLA', () => {
    const r = routeMotion(motion(), hint('P2'), { routed_at: NOW });
    expect(r.target_queue).toBe('pm_ratification_queue');
    expect(r.sla_hours).toBe(24);
    expect(r.escalation_after_hours).toBe(12);
  });

  it('P3 routes to knowledge_backlog with 168h SLA', () => {
    const r = routeMotion(motion(), hint('P3'), { routed_at: NOW });
    expect(r.target_queue).toBe('knowledge_backlog');
    expect(r.sla_hours).toBe(168);
    expect(r.escalation_after_hours).toBe(72);
  });

  it('P1 and P2 require HITL by default', () => {
    expect(routeMotion(motion(), hint('P1'), { routed_at: NOW }).hitl_required).toBe(true);
    expect(routeMotion(motion(), hint('P2'), { routed_at: NOW }).hitl_required).toBe(true);
  });

  it('P3 does not require HITL by default', () => {
    expect(routeMotion(motion(), hint('P3'), { routed_at: NOW }).hitl_required).toBe(false);
  });

  it('override_hitl forces HITL on P3', () => {
    const r = routeMotion(motion(), hint('P3'), { routed_at: NOW, override_hitl: true });
    expect(r.hitl_required).toBe(true);
  });

  it('notify_owners is copied (defensive copy) from hint', () => {
    const h = hint('P1');
    const r = routeMotion(motion(), h, { routed_at: NOW });
    expect(r.notify_owners).toEqual(['CEO', 'Review', 'Dev']);
    // mutate original hint owners → routing decision unaffected
    h.suggested_owners.push('X');
    expect(r.notify_owners).not.toContain('X');
  });

  it('summarizeRouting emits motion_id, priority, queue, sla, hitl, owners', () => {
    const r = routeMotion(motion('DEC-099'), hint('P2'), { routed_at: NOW });
    const s = summarizeRouting(r);
    expect(s).toContain('motion=DEC-099');
    expect(s).toContain('priority=P2');
    expect(s).toContain('queue=pm_ratification_queue');
    expect(s).toContain('sla=24h');
    expect(s).toContain('hitl=true');
    expect(s).toContain('PM,Dev');
    // const-table contract reaffirmed
    expect(__test__.QUEUE_BY_PRIORITY.P1).toBe('ceo_ack_flow');
    expect(__test__.SLA_HOURS_BY_PRIORITY.P3).toBe(168);
    expect(__test__.ESCALATION_HOURS_BY_PRIORITY.P2).toBe(12);
    expect(__test__.defaultHitl('P3')).toBe(false);
  });
});
