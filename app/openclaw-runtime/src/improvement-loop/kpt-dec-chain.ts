/**
 * PRJ-019 Open Claw "Clawbridge" — W7-D continuous improvement loop
 *   KPT → DEC motion → window aggregation chain orchestrator
 *
 * R33 Dev-RRR physical implementation (≤150 行).
 * Orchestrates the existing R32 retrospective trio:
 *   kpt-extractor (Dev-PPP)
 *     → dec-motion-generator (Dev-PPP)
 *     → window-aggregator (Dev-PPP)
 * into a single continuous-improvement chain that emits a
 * "next round dispatch hint" (P1/P2/P3) for downstream auto-routing.
 *
 * Constraints (R33 Dev-RRR):
 *   - Pure function. No fetch, no fs, no external API call ($0).
 *   - Strict typing. TS6059 0 件継承.
 *   - R32 retrospective 3 modules 無改変保持 (import only).
 *   - 副作用 0.
 */

import {
  extractKpt,
  type ExtractKptOptions,
  type KptBuckets,
  type RetroEvent,
} from '../retrospective/kpt-extractor';
import {
  generateDecMotion,
  type DecMotionDraft,
  type GenerateMotionOptions,
} from '../retrospective/dec-motion-generator';
import {
  aggregateWindow,
  type TimedRetroEvent,
  type WindowAggregate,
  type WindowAggregateOptions,
} from '../retrospective/window-aggregator';

export type DispatchPriority = 'P1' | 'P2' | 'P3';

export interface DispatchHint {
  priority: DispatchPriority;
  next_round: number;
  reason: string;
  suggested_owners: string[];
}

export interface KptDecChainResult {
  buckets: KptBuckets;
  motion: DecMotionDraft;
  aggregate: WindowAggregate;
  dispatch_hint: DispatchHint;
  chain_generated_at: string;
}

export interface KptDecChainOptions {
  events: TimedRetroEvent[];
  current_round: number;
  motion_id: string;
  generated_at: string;
  window_days?: number;
  max_items_per_bucket?: number;
  title_prefix?: string;
}

function decideDispatch(
  buckets: KptBuckets,
  aggregate: WindowAggregate,
  currentRound: number
): DispatchHint {
  const criticalCount = aggregate.severity.critical;
  const warnCount = aggregate.severity.warn;
  const recurringCount = aggregate.recurring_count;
  const problemCount = buckets.problem.length;
  const tryCount = buckets.try.length;

  let priority: DispatchPriority;
  const reasons: string[] = [];
  const owners: string[] = [];

  if (criticalCount > 0 || problemCount >= 3) {
    priority = 'P1';
    reasons.push(`critical=${criticalCount}/problem=${problemCount}`);
    owners.push('CEO', 'Review', 'Dev');
  } else if (recurringCount > 0 || warnCount >= 2 || tryCount >= 3) {
    priority = 'P2';
    reasons.push(
      `recurring=${recurringCount}/warn=${warnCount}/try=${tryCount}`
    );
    owners.push('PM', 'Dev');
  } else {
    priority = 'P3';
    reasons.push('no critical / no recurring / minor try only');
    owners.push('Knowledge');
  }

  return {
    priority,
    next_round: currentRound + 1,
    reason: reasons.join(' / '),
    suggested_owners: owners,
  };
}

export function runKptDecChain(
  options: KptDecChainOptions
): KptDecChainResult {
  const aggOpts: WindowAggregateOptions = {
    now: options.generated_at,
    window_days: options.window_days,
  };
  const aggregate = aggregateWindow(options.events, aggOpts);

  const rounds = aggregate.events_in_window.map((e) => e.round);
  const roundMin = rounds.length > 0 ? Math.min(...rounds) : options.current_round;
  const roundMax = rounds.length > 0 ? Math.max(...rounds) : options.current_round;

  const kptOpts: ExtractKptOptions = {
    round_min: roundMin,
    round_max: roundMax,
    generated_at: options.generated_at,
  };
  const baseEvents: RetroEvent[] = aggregate.events_in_window.map((e) => ({
    round: e.round,
    kind: e.kind,
    severity: e.severity,
    summary: e.summary,
    recurring: e.recurring,
  }));
  const buckets = extractKpt(baseEvents, kptOpts);

  const motionOpts: GenerateMotionOptions = {
    motion_id: options.motion_id,
    generated_at: options.generated_at,
    title_prefix: options.title_prefix,
    max_items_per_bucket: options.max_items_per_bucket,
  };
  const motion = generateDecMotion(buckets, motionOpts);

  const dispatch = decideDispatch(buckets, aggregate, options.current_round);

  return {
    buckets,
    motion,
    aggregate,
    dispatch_hint: dispatch,
    chain_generated_at: options.generated_at,
  };
}

export function summarizeChain(result: KptDecChainResult): string {
  return [
    `chain@${result.chain_generated_at}`,
    `motion=${result.motion.motion_id}`,
    `keep=${result.buckets.keep.length}`,
    `problem=${result.buckets.problem.length}`,
    `try=${result.buckets.try.length}`,
    `priority=${result.dispatch_hint.priority}`,
    `next=R${result.dispatch_hint.next_round}`,
  ].join(' / ');
}

export const __test__ = {
  decideDispatch,
};
