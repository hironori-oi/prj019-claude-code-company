/**
 * PRJ-019 Open Claw "Clawbridge" — W7-C DEC-087 retrospective motion
 * auto-generator. R32 Dev-PPP physical implementation (≤120 行).
 * Pure function. No fetch / fs / external API. TS6059 0 件継承.
 * DEC-087 ID は外部から与えられる (テンプレ生成のみ実施).
 */

import type { KptBuckets, KptItem } from './kpt-extractor';

export interface DecMotionDraft {
  motion_id: string;
  title: string;
  context: string;
  decision: string;
  consequences: string[];
  source_kpt_summary: {
    keep: number;
    problem: number;
    try: number;
  };
  generated_at: string;
  approval_gate: 'pending_hitl';
}

export interface GenerateMotionOptions {
  motion_id: string;
  generated_at: string;
  title_prefix?: string;
  max_items_per_bucket?: number;
}

function pickTopItems(items: KptItem[], max: number): KptItem[] {
  return items.slice(0, Math.max(0, max));
}

function bucketLine(prefix: string, items: KptItem[]): string {
  if (items.length === 0) {
    return `${prefix}: (no items)`;
  }
  const lines = items.map(
    (it, idx) =>
      `${prefix}-${idx + 1} [w=${it.weight}] R${it.source_event.round} ${it.source_event.kind}: ${it.source_event.summary}`
  );
  return lines.join('\n');
}

export function generateDecMotion(
  buckets: KptBuckets,
  options: GenerateMotionOptions
): DecMotionDraft {
  const max = options.max_items_per_bucket ?? 5;
  const keepTop = pickTopItems(buckets.keep, max);
  const probTop = pickTopItems(buckets.problem, max);
  const tryTop = pickTopItems(buckets.try, max);

  const titlePrefix = options.title_prefix ?? 'PRJ-019 retrospective';
  const title = `${titlePrefix} R${buckets.window_round_min}-R${buckets.window_round_max} (motion ${options.motion_id})`;

  const context = [
    `Window: R${buckets.window_round_min}-R${buckets.window_round_max}`,
    `KPT extracted_at: ${buckets.generated_at}`,
    `motion_generated_at: ${options.generated_at}`,
  ].join(' / ');

  const decision = [
    bucketLine('KEEP', keepTop),
    bucketLine('PROBLEM', probTop),
    bucketLine('TRY', tryTop),
  ].join('\n');

  const consequences: string[] = [];
  if (probTop.length > 0) {
    consequences.push(`${probTop.length} problem item(s) require follow-up DEC or pitfall registration`);
  }
  if (tryTop.length > 0) {
    consequences.push(`${tryTop.length} try item(s) candidate for next-round pilot`);
  }
  if (keepTop.length > 0) {
    consequences.push(`${keepTop.length} keep item(s) reinforce current playbook`);
  }
  if (consequences.length === 0) {
    consequences.push('No actionable items in window — motion is informational only');
  }

  return {
    motion_id: options.motion_id,
    title,
    context,
    decision,
    consequences,
    source_kpt_summary: {
      keep: buckets.keep.length,
      problem: buckets.problem.length,
      try: buckets.try.length,
    },
    generated_at: options.generated_at,
    approval_gate: 'pending_hitl',
  };
}

export function renderMotionMarkdown(draft: DecMotionDraft): string {
  return [
    `# ${draft.title}`,
    '',
    `motion_id: ${draft.motion_id}`,
    `approval_gate: ${draft.approval_gate}`,
    `generated_at: ${draft.generated_at}`,
    '',
    '## Context',
    draft.context,
    '',
    '## Decision',
    '```',
    draft.decision,
    '```',
    '',
    '## Consequences',
    ...draft.consequences.map((c) => `- ${c}`),
  ].join('\n');
}
