/**
 * PRJ-019 Open Claw "Clawbridge" — W7-E long-term operational metrics
 *   90day quarter window aggregator
 *
 * R33 Dev-SSS physical implementation (~130 行).
 * Aggregates QuarterEvent stream over a configurable rolling window
 * (default 90 days) for long-term operational trend analysis.
 * Companion to W7-C 30day window-aggregator (Dev-PPP) but extended
 * for quarter-level KPT/SLO/cost trajectory observation.
 *
 * Constraints (R33 Dev-SSS):
 *   - Pure function. No fetch, no fs, no external API call ($0).
 *   - Strict typing. TS6059 0 件継承.
 *   - Time math uses Date constructor only (no external lib).
 *   - Side effect: 0.
 */

export type QuarterEventKind =
  | 'dec'
  | 'harness'
  | 'sla'
  | 'cost'
  | 'kpt'
  | 'pitfall';

export type QuarterEventSeverity = 'info' | 'warn' | 'critical';

export interface QuarterEvent {
  round: number;
  occurred_at: string; // ISO-8601
  kind: QuarterEventKind;
  severity: QuarterEventSeverity;
  summary: string;
  numeric_value?: number;
}

export interface QuarterWindowOptions {
  now: string; // ISO-8601 anchor
  window_days?: number; // default 90
}

export interface QuarterSeverityBreakdown {
  info: number;
  warn: number;
  critical: number;
}

export interface QuarterKindBreakdown {
  dec: number;
  harness: number;
  sla: number;
  cost: number;
  kpt: number;
  pitfall: number;
}

export interface QuarterWindowAggregate {
  window_start: string;
  window_end: string;
  window_days: number;
  total_events: number;
  unique_rounds: number;
  severity: QuarterSeverityBreakdown;
  kind: QuarterKindBreakdown;
  events_in_window: QuarterEvent[];
  numeric_avg: number | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function emptyKind(): QuarterKindBreakdown {
  return { dec: 0, harness: 0, sla: 0, cost: 0, kpt: 0, pitfall: 0 };
}

function emptySeverity(): QuarterSeverityBreakdown {
  return { info: 0, warn: 0, critical: 0 };
}

export function aggregateQuarterWindow(
  events: QuarterEvent[],
  options: QuarterWindowOptions
): QuarterWindowAggregate {
  const window_days = options.window_days ?? 90;
  const nowMs = Date.parse(options.now);
  const startMs = nowMs - window_days * MS_PER_DAY;

  const severity = emptySeverity();
  const kind = emptyKind();
  const inWindow: QuarterEvent[] = [];
  const rounds = new Set<number>();
  let numericSum = 0;
  let numericCount = 0;

  for (const ev of events) {
    const t = Date.parse(ev.occurred_at);
    if (Number.isNaN(t)) continue;
    if (t < startMs) continue;
    if (t > nowMs) continue;

    inWindow.push(ev);
    rounds.add(ev.round);
    severity[ev.severity] += 1;
    kind[ev.kind] += 1;

    if (typeof ev.numeric_value === 'number' && !Number.isNaN(ev.numeric_value)) {
      numericSum += ev.numeric_value;
      numericCount += 1;
    }
  }

  return {
    window_start: new Date(startMs).toISOString(),
    window_end: new Date(nowMs).toISOString(),
    window_days,
    total_events: inWindow.length,
    unique_rounds: rounds.size,
    severity,
    kind,
    events_in_window: inWindow,
    numeric_avg: numericCount === 0 ? null : numericSum / numericCount,
  };
}

export function summarizeQuarter(agg: QuarterWindowAggregate): string {
  const parts: string[] = [];
  parts.push(`window=${agg.window_days}d`);
  parts.push(`total=${agg.total_events}`);
  parts.push(`rounds=${agg.unique_rounds}`);
  parts.push(
    `sev=info:${agg.severity.info}/warn:${agg.severity.warn}/crit:${agg.severity.critical}`
  );
  if (agg.numeric_avg !== null) {
    parts.push(`avg=${agg.numeric_avg.toFixed(2)}`);
  }
  return parts.join(' | ');
}
