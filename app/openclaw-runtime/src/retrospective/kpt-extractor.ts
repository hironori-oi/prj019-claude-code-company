/**
 * PRJ-019 Open Claw "Clawbridge" — W7-C post-launch retrospective
 *   KPT (Keep / Problem / Try) extractor
 *
 * R32 Dev-PPP physical implementation (≤150 行).
 * Aggregates round-by-round events (DEC, harness, alert, canary stage)
 * into a 3-bucket KPT structure for retrospective DEC motion generation.
 *
 * Constraints (R32 Dev-PPP):
 *   - Pure function. No fetch, no fs, no external API call ($0).
 *   - Strict typing. TS6059 0 件継承.
 *   - mock injection only (live wire 厳守: R32 でも実 API call 0).
 */

export type KptCategory = 'keep' | 'problem' | 'try';

export interface RetroEvent {
  round: number;
  kind: 'dec' | 'harness' | 'alert' | 'canary' | 'pitfall';
  severity: 'info' | 'warn' | 'critical';
  summary: string;
  recurring?: boolean;
}

export interface KptItem {
  category: KptCategory;
  weight: number;
  source_event: RetroEvent;
  rationale: string;
}

export interface KptBuckets {
  keep: KptItem[];
  problem: KptItem[];
  try: KptItem[];
  generated_at: string;
  window_round_min: number;
  window_round_max: number;
}

const SEVERITY_WEIGHT: Record<RetroEvent['severity'], number> = {
  info: 1,
  warn: 2,
  critical: 3,
};

function classifyEvent(event: RetroEvent): KptCategory {
  if (event.severity === 'critical') {
    return 'problem';
  }
  if (event.recurring && event.severity === 'warn') {
    return 'try';
  }
  if (event.kind === 'pitfall') {
    return 'problem';
  }
  if (event.kind === 'dec' && event.severity !== 'warn') {
    return 'keep';
  }
  if (event.kind === 'harness' && event.severity === 'info') {
    return 'keep';
  }
  if (event.kind === 'canary' && event.severity === 'info') {
    return 'keep';
  }
  if (event.kind === 'alert') {
    return event.severity === 'warn' ? 'try' : 'problem';
  }
  return 'try';
}

function buildRationale(event: RetroEvent, category: KptCategory): string {
  const base = `[R${event.round}/${event.kind}/${event.severity}]`;
  switch (category) {
    case 'keep':
      return `${base} stable signal — continue current practice (${event.summary})`;
    case 'problem':
      return `${base} issue surfaced — root-cause review required (${event.summary})`;
    case 'try':
      return `${base} candidate improvement — pilot in next round (${event.summary})`;
  }
}

export interface ExtractKptOptions {
  round_min: number;
  round_max: number;
  generated_at: string;
}

export function extractKpt(
  events: RetroEvent[],
  options: ExtractKptOptions
): KptBuckets {
  const filtered = events.filter(
    (e) => e.round >= options.round_min && e.round <= options.round_max
  );
  const buckets: KptBuckets = {
    keep: [],
    problem: [],
    try: [],
    generated_at: options.generated_at,
    window_round_min: options.round_min,
    window_round_max: options.round_max,
  };
  for (const event of filtered) {
    const category = classifyEvent(event);
    const item: KptItem = {
      category,
      weight: SEVERITY_WEIGHT[event.severity],
      source_event: event,
      rationale: buildRationale(event, category),
    };
    buckets[category].push(item);
  }
  // deterministic ordering: weight desc, then round asc
  for (const cat of ['keep', 'problem', 'try'] as const) {
    buckets[cat].sort((a, b) => {
      if (b.weight !== a.weight) {
        return b.weight - a.weight;
      }
      return a.source_event.round - b.source_event.round;
    });
  }
  return buckets;
}

export function summarizeKpt(buckets: KptBuckets): string {
  return [
    `KPT window R${buckets.window_round_min}-R${buckets.window_round_max}`,
    `keep=${buckets.keep.length}`,
    `problem=${buckets.problem.length}`,
    `try=${buckets.try.length}`,
    `generated_at=${buckets.generated_at}`,
  ].join(' / ');
}

export const __test__ = {
  classifyEvent,
  buildRationale,
  SEVERITY_WEIGHT,
};
