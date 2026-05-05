/**
 * PRJ-019 Dev-PPP R32 — dec-motion-generator.ts unit tests
 * 6 case (R32 W7-C harness contribution).
 */

import { describe, expect, it } from 'vitest';
import { extractKpt, type RetroEvent } from '../kpt-extractor';
import {
  generateDecMotion,
  renderMotionMarkdown,
} from '../dec-motion-generator';

const kptOpts = {
  round_min: 25,
  round_max: 32,
  generated_at: '2026-05-06T00:00:00Z',
};

const motionOpts = {
  motion_id: 'DEC-087',
  generated_at: '2026-05-06T01:00:00Z',
};

function sampleEvents(): RetroEvent[] {
  return [
    { round: 28, kind: 'dec', severity: 'info', summary: 'DEC-083 hotfix landed' },
    { round: 29, kind: 'pitfall', severity: 'critical', summary: 'TS6059 leak' },
    {
      round: 30,
      kind: 'alert',
      severity: 'warn',
      summary: 'canary flaky',
      recurring: true,
    },
  ];
}

describe('dec-motion-generator', () => {
  it('produces a draft with pending_hitl gate', () => {
    const buckets = extractKpt(sampleEvents(), kptOpts);
    const draft = generateDecMotion(buckets, motionOpts);
    expect(draft.approval_gate).toBe('pending_hitl');
    expect(draft.motion_id).toBe('DEC-087');
  });

  it('encodes window range in title', () => {
    const buckets = extractKpt(sampleEvents(), kptOpts);
    const draft = generateDecMotion(buckets, motionOpts);
    expect(draft.title).toContain('R25-R32');
    expect(draft.title).toContain('DEC-087');
  });

  it('reports correct kpt summary counts', () => {
    const buckets = extractKpt(sampleEvents(), kptOpts);
    const draft = generateDecMotion(buckets, motionOpts);
    expect(draft.source_kpt_summary).toEqual({ keep: 1, problem: 1, try: 1 });
  });

  it('renders markdown with all 3 buckets', () => {
    const buckets = extractKpt(sampleEvents(), kptOpts);
    const draft = generateDecMotion(buckets, motionOpts);
    const md = renderMotionMarkdown(draft);
    expect(md).toContain('# PRJ-019 retrospective');
    expect(md).toContain('KEEP');
    expect(md).toContain('PROBLEM');
    expect(md).toContain('TRY');
  });

  it('respects max_items_per_bucket cap', () => {
    const events: RetroEvent[] = Array.from({ length: 10 }, (_, i) => ({
      round: 25 + i,
      kind: 'pitfall' as const,
      severity: 'critical' as const,
      summary: `p${i}`,
    }));
    const buckets = extractKpt(events, kptOpts);
    const draft = generateDecMotion(buckets, { ...motionOpts, max_items_per_bucket: 3 });
    // PROBLEM section should contain 3 items
    const problemMatches = (draft.decision.match(/PROBLEM-/g) || []).length;
    expect(problemMatches).toBe(3);
  });

  it('emits informational consequence when window is empty', () => {
    const buckets = extractKpt([], kptOpts);
    const draft = generateDecMotion(buckets, motionOpts);
    expect(draft.consequences[0]).toContain('informational only');
  });
});
