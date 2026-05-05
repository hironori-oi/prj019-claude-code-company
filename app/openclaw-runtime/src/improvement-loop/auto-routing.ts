/**
 * PRJ-019 Open Claw "Clawbridge" — W7-D continuous improvement loop
 *   DEC motion auto-routing (P1/P2/P3 → CEO ack / PM queue / Knowledge backlog)
 *
 * R33 Dev-RRR physical implementation (≤110 行).
 * Pure function. Maps a DispatchHint + DecMotionDraft to a
 * RoutingDecision (target queue + sla + escalation policy).
 *
 * Constraints (R33 Dev-RRR):
 *   - Pure function. No fetch / fs / external API ($0).
 *   - Strict typing. TS6059 0 件継承.
 *   - 副作用 0.
 */

import type { DecMotionDraft } from '../retrospective/dec-motion-generator';
import type { DispatchHint, DispatchPriority } from './kpt-dec-chain';

export type TargetQueue =
  | 'ceo_ack_flow'
  | 'pm_ratification_queue'
  | 'knowledge_backlog';

export interface RoutingDecision {
  motion_id: string;
  priority: DispatchPriority;
  target_queue: TargetQueue;
  sla_hours: number;
  escalation_after_hours: number;
  hitl_required: boolean;
  notify_owners: string[];
  rationale: string;
  routed_at: string;
}

export interface AutoRoutingOptions {
  routed_at: string;
  override_hitl?: boolean;
}

const QUEUE_BY_PRIORITY: Record<DispatchPriority, TargetQueue> = {
  P1: 'ceo_ack_flow',
  P2: 'pm_ratification_queue',
  P3: 'knowledge_backlog',
};

const SLA_HOURS_BY_PRIORITY: Record<DispatchPriority, number> = {
  P1: 4,
  P2: 24,
  P3: 168,
};

const ESCALATION_HOURS_BY_PRIORITY: Record<DispatchPriority, number> = {
  P1: 2,
  P2: 12,
  P3: 72,
};

function defaultHitl(priority: DispatchPriority): boolean {
  // P1/P2 require human-in-the-loop ack. P3 may be auto-archived.
  return priority === 'P1' || priority === 'P2';
}

export function routeMotion(
  motion: DecMotionDraft,
  hint: DispatchHint,
  options: AutoRoutingOptions
): RoutingDecision {
  const priority = hint.priority;
  const queue = QUEUE_BY_PRIORITY[priority];
  const sla = SLA_HOURS_BY_PRIORITY[priority];
  const escalation = ESCALATION_HOURS_BY_PRIORITY[priority];
  const hitl =
    options.override_hitl !== undefined
      ? options.override_hitl
      : defaultHitl(priority);

  const rationale = [
    `priority=${priority}`,
    `queue=${queue}`,
    `sla=${sla}h`,
    `escalation=${escalation}h`,
    `hitl=${hitl}`,
    `hint:${hint.reason}`,
  ].join(' / ');

  return {
    motion_id: motion.motion_id,
    priority,
    target_queue: queue,
    sla_hours: sla,
    escalation_after_hours: escalation,
    hitl_required: hitl,
    notify_owners: [...hint.suggested_owners],
    rationale,
    routed_at: options.routed_at,
  };
}

export function summarizeRouting(d: RoutingDecision): string {
  return [
    `motion=${d.motion_id}`,
    `priority=${d.priority}`,
    `queue=${d.target_queue}`,
    `sla=${d.sla_hours}h`,
    `hitl=${d.hitl_required}`,
    `owners=${d.notify_owners.join(',')}`,
  ].join(' / ');
}

export const __test__ = {
  QUEUE_BY_PRIORITY,
  SLA_HOURS_BY_PRIORITY,
  ESCALATION_HOURS_BY_PRIORITY,
  defaultHitl,
};
