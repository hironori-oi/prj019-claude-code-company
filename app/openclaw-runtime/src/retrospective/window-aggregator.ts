/**
 * PRJ-019 Open Claw "Clawbridge" — W7-C post-launch retrospective
 *   30day window aggregator
 *
 * R32 Dev-PPP physical implementation (≤140 行).
 * Aggregates RetroEvent stream over a configurable rolling window
 * (default 30 days) for KPT extraction. Produces summary stats used by
 * dec-motion-generator and the dashboard live wire.
 *
 * Constraints (R32 Dev-PPP):
 *   - Pure function. No fetch, no fs, no external API call ($0).
 *   - Strict typing. TS6059 0 件継承.
 *   - Time math uses Date constructor only (no external lib).
 */

import type { RetroEvent } from './kpt-extractor';

export interface TimedRetroEvent extends RetroEvent {
  occurred_at: string; // ISO-8601
}

export interface WindowAggregateOptions {
  now: string; // ISO-8601 anchor
  window_days?: number; // default 30
}

export interface SeverityBreakdown {
  info: number;
  warn: number;
  critical: number;
}

export interface KindBreakdown {
  dec: number;
  harness: number;
  alert: number;
  canary: number;
  pitfall: number;
}

export interface WindowAggregate {
  window_start: string;
  window_end: string;
  window_days: number;
  total_events: number;
  unique_rounds: number;
  severity: SeverityBreakdown;
  kind: KindBreakdown;
  recurring_count: number;
  events_in_window: TimedRetroEvent[];
}

const DEFAULT_WINDOW_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function emptySeverity(): SeverityBreakdown {
  return { info: 0, warn: 0, critical: 0 };
}

function emptyKind(): KindBreakdown {
  return { dec: 0, harness: 0, alert: 0, canary: 0, pitfall: 0 };
}

function parseIso(iso: string): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) {
    throw new Error(`window-aggregator: invalid ISO timestamp: ${iso}`);
  }
  return t;
}

export function aggregateWindow(
  events: TimedRetroEvent[],
  options: WindowAggregateOptions
): WindowAggregate {
  const windowDays = options.window_days ?? DEFAULT_WINDOW_DAYS;
  if (windowDays <= 0) {
    throw new Error(
      `window-aggregator: window_days must be > 0 (got ${windowDays})`
    );
  }
  const nowMs = parseIso(options.now);
  const startMs = nowMs - windowDays * MS_PER_DAY;
  const windowStartIso = new Date(startMs).toISOString();
  const windowEndIso = new Date(nowMs).toISOString();

  const inWindow: TimedRetroEvent[] = [];
  const severity = emptySeverity();
  const kind = emptyKind();
  const rounds = new Set<number>();
  let recurringCount = 0;

  for (const e of events) {
    const t = parseIso(e.occurred_at);
    if (t < startMs || t > nowMs) {
      continue;
    }
    inWindow.push(e);
    severity[e.severity] += 1;
    kind[e.kind] += 1;
    rounds.add(e.round);
    if (e.recurring) {
      recurringCount += 1;
    }
  }

  // deterministic order: occurred_at asc, then round asc
  inWindow.sort((a, b) => {
    const ta = parseIso(a.occurred_at);
    const tb = parseIso(b.occurred_at);
    if (ta !== tb) return ta - tb;
    return a.round - b.round;
  });

  return {
    window_start: windowStartIso,
    window_end: windowEndIso,
    window_days: windowDays,
    total_events: inWindow.length,
    unique_rounds: rounds.size,
    severity,
    kind,
    recurring_count: recurringCount,
    events_in_window: inWindow,
  };
}

export function summarizeAggregate(agg: WindowAggregate): string {
  return [
    `window=${agg.window_days}d`,
    `total=${agg.total_events}`,
    `rounds=${agg.unique_rounds}`,
    `crit=${agg.severity.critical}`,
    `warn=${agg.severity.warn}`,
    `info=${agg.severity.info}`,
    `recurring=${agg.recurring_count}`,
  ].join(' / ');
}
