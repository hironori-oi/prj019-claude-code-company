/**
 * PRJ-019 Dev-PPP R32 — kpt-extractor.ts unit tests
 * 7 case (R32 W7-C harness contribution).
 */

import { describe, expect, it } from 'vitest';
import {
  extractKpt,
  summarizeKpt,
  type RetroEvent,
} from '../kpt-extractor';

const baseOpts = {
  round_min: 1,
  round_max: 32,
  generated_at: '2026-05-06T00:00:00Z',
};

describe('kpt-extractor', () => {
  it('classifies info-level dec event as keep', () => {
    const events: RetroEvent[] = [
      { round: 30, kind: 'dec', severity: 'info', summary: 'DEC-085 confirmed' },
    ];
    const out = extractKpt(events, baseOpts);
    expect(out.keep).toHaveLength(1);
    expect(out.problem).toHaveLength(0);
    expect(out.try).toHaveLength(0);
  });

  it('classifies critical event as problem regardless of kind', () => {
    const events: RetroEvent[] = [
      { round: 28, kind: 'harness', severity: 'critical', summary: 'TS6059 leak' },
    ];
    const out = extractKpt(events, baseOpts);
    expect(out.problem).toHaveLength(1);
    expect(out.problem[0].weight).toBe(3);
  });

  it('classifies recurring warn as try', () => {
    const events: RetroEvent[] = [
      {
        round: 31,
        kind: 'alert',
        severity: 'warn',
        summary: 'flaky canary stage',
        recurring: true,
      },
    ];
    const out = extractKpt(events, baseOpts);
    expect(out.try).toHaveLength(1);
  });

  it('filters events outside window', () => {
    const events: RetroEvent[] = [
      { round: 5, kind: 'dec', severity: 'info', summary: 'old' },
      { round: 30, kind: 'dec', severity: 'info', summary: 'recent' },
    ];
    const out = extractKpt(events, { ...baseOpts, round_min: 25 });
    expect(out.keep).toHaveLength(1);
    expect(out.keep[0].source_event.summary).toBe('recent');
  });

  it('sorts by weight desc then round asc', () => {
    const events: RetroEvent[] = [
      { round: 30, kind: 'pitfall', severity: 'info', summary: 'A' },
      { round: 28, kind: 'pitfall', severity: 'critical', summary: 'B' },
      { round: 29, kind: 'pitfall', severity: 'warn', summary: 'C' },
    ];
    const out = extractKpt(events, baseOpts);
    expect(out.problem.map((i) => i.source_event.summary)).toEqual(['B', 'C', 'A']);
  });

  it('classifies pitfall kind as problem', () => {
    const events: RetroEvent[] = [
      { round: 27, kind: 'pitfall', severity: 'info', summary: 'naming clash' },
    ];
    const out = extractKpt(events, baseOpts);
    expect(out.problem).toHaveLength(1);
  });

  it('summarizeKpt returns deterministic string', () => {
    const events: RetroEvent[] = [
      { round: 30, kind: 'dec', severity: 'info', summary: 'k1' },
      { round: 30, kind: 'pitfall', severity: 'critical', summary: 'p1' },
    ];
    const out = extractKpt(events, baseOpts);
    const s = summarizeKpt(out);
    expect(s).toContain('keep=1');
    expect(s).toContain('problem=1');
    expect(s).toContain('try=0');
  });
});
