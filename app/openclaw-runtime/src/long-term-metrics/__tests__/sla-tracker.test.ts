/**
 * PRJ-019 Open Claw "Clawbridge" — W7-E long-term operational metrics
 *   sla-tracker unit test (R33 Dev-SSS / 8 case)
 *
 * Constraints:
 *   - Pure function tests. No fetch, no fs, no real API call ($0).
 *   - Strict typing. TS6059 0 件継承.
 *   - Side effect: 0.
 */

import { describe, expect, it } from 'vitest';
import {
  trackSla,
  isSlaHealthy,
  type SlaSample,
} from '../sla-tracker';

const NOW = '2026-05-06T00:00:00Z';

function okSample(): SlaSample[] {
  return [
    { round: 25, observed_at: '2026-04-01T00:00:00Z', status: 'ok', value: 180, threshold: 250 },
    { round: 26, observed_at: '2026-04-08T00:00:00Z', status: 'ok', value: 190, threshold: 250 },
    { round: 27, observed_at: '2026-04-15T00:00:00Z', status: 'ok', value: 200, threshold: 250 },
    { round: 28, observed_at: '2026-04-22T00:00:00Z', status: 'ok', value: 210, threshold: 250 },
    { round: 29, observed_at: '2026-04-29T00:00:00Z', status: 'ok', value: 195, threshold: 250 },
  ];
}

function mixedSample(): SlaSample[] {
  return [
    { round: 25, observed_at: '2026-04-01T00:00:00Z', status: 'ok', value: 180, threshold: 250 },
    { round: 26, observed_at: '2026-04-08T00:00:00Z', status: 'breach', value: 320, threshold: 250 },
    { round: 27, observed_at: '2026-04-15T00:00:00Z', status: 'recovered', value: 240, threshold: 250 },
    { round: 28, observed_at: '2026-04-22T00:00:00Z', status: 'ok', value: 200, threshold: 250 },
    { round: 29, observed_at: '2026-04-29T00:00:00Z', status: 'breach', value: 410, threshold: 250 },
    { round: 30, observed_at: '2026-05-02T00:00:00Z', status: 'recovered', value: 245, threshold: 250 },
    // out of window
    { round: 5, observed_at: '2025-11-01T00:00:00Z', status: 'breach', value: 999, threshold: 250 },
  ];
}

describe('trackSla (W7-E sla-tracker)', () => {
  it('counts ok samples within window correctly', () => {
    const r = trackSla(okSample(), { now: NOW });
    expect(r.window_days).toBe(90);
    expect(r.total_samples).toBe(5);
    expect(r.ok_count).toBe(5);
    expect(r.breach_count).toBe(0);
    expect(r.recovery_count).toBe(0);
  });

  it('reports a 0 breach_rate when all ok', () => {
    const r = trackSla(okSample(), { now: NOW });
    expect(r.breach_rate).toBe(0);
    expect(isSlaHealthy(r)).toBe(true);
  });

  it('counts breach / recovered status correctly', () => {
    const r = trackSla(mixedSample(), { now: NOW });
    expect(r.breach_count).toBe(2);
    expect(r.recovery_count).toBe(2);
    expect(r.ok_count).toBe(2);
    expect(r.total_samples).toBe(6);
  });

  it('computes breach_rate as breach / total', () => {
    const r = trackSla(mixedSample(), { now: NOW });
    expect(r.breach_rate).toBeCloseTo(2 / 6, 5);
    expect(isSlaHealthy(r, 0.5)).toBe(true);
    expect(isSlaHealthy(r, 0.1)).toBe(false);
  });

  it('identifies worst value and worst round', () => {
    const r = trackSla(mixedSample(), { now: NOW });
    expect(r.worst_value).toBe(410);
    expect(r.worst_round).toBe(29);
  });

  it('computes longest consecutive ok streak inside window', () => {
    const r = trackSla(okSample(), { now: NOW });
    expect(r.consecutive_ok_streak).toBe(5);
    const r2 = trackSla(mixedSample(), { now: NOW });
    // mixedSample has at most 1 ok in a row
    expect(r2.consecutive_ok_streak).toBe(1);
  });

  it('excludes samples outside the window', () => {
    const r = trackSla(mixedSample(), { now: NOW });
    expect(r.total_samples).toBe(6);
    // round 5 sample with date 2025-11-01 should be excluded
    expect(r.worst_round).not.toBe(5);
  });

  it('returns null mean and current_status for empty window', () => {
    const r = trackSla([], { now: NOW });
    expect(r.total_samples).toBe(0);
    expect(r.mean_value).toBeNull();
    expect(r.current_status).toBeNull();
    expect(isSlaHealthy(r)).toBe(true);
  });
});
