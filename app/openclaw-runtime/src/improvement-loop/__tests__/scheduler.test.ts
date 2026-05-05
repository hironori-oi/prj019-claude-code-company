/**
 * PRJ-019 Dev-RRR R33 — scheduler.ts unit tests
 * 8 case (R33 W7-D harness contribution).
 *
 * Constraints:
 *   - mock injection only — no fetch / no fs / no real API call ($0).
 *   - TS6059 0 件継承.
 */

import { describe, expect, it } from 'vitest';
import {
  shouldFire,
  __test__,
  type ScheduleConfig,
} from '../scheduler';

describe('scheduler', () => {
  it('daily cadence fires when hour matches', () => {
    const cfg: ScheduleConfig = { cadence: 'daily', hour_utc: 0 };
    const r = shouldFire('2026-05-06T00:15:00Z', null, cfg);
    expect(r.should_fire).toBe(true);
    expect(r.reason).toContain('matched');
  });

  it('daily cadence does not fire at non-matching hour', () => {
    const cfg: ScheduleConfig = { cadence: 'daily', hour_utc: 12 };
    const r = shouldFire('2026-05-06T03:00:00Z', null, cfg);
    expect(r.should_fire).toBe(false);
    expect(r.reason).toContain('did not match');
  });

  it('weekly cadence fires only on configured day-of-week', () => {
    // 2026-05-04 is Monday (UTC). dow=1
    const cfg: ScheduleConfig = { cadence: 'weekly', weekly_dow: 1, hour_utc: 0 };
    const monday = shouldFire('2026-05-04T00:30:00Z', null, cfg);
    const tuesday = shouldFire('2026-05-05T00:30:00Z', null, cfg);
    expect(monday.should_fire).toBe(true);
    expect(tuesday.should_fire).toBe(false);
  });

  it('monthly cadence fires only on configured day-of-month', () => {
    const cfg: ScheduleConfig = { cadence: 'monthly', monthly_dom: 1, hour_utc: 0 };
    const dom1 = shouldFire('2026-06-01T00:00:00Z', null, cfg);
    const dom2 = shouldFire('2026-06-02T00:00:00Z', null, cfg);
    expect(dom1.should_fire).toBe(true);
    expect(dom2.should_fire).toBe(false);
  });

  it('does not double-fire within the same hour bucket', () => {
    const cfg: ScheduleConfig = { cadence: 'daily', hour_utc: 0 };
    const r = shouldFire(
      '2026-05-06T00:45:00Z',
      '2026-05-06T00:05:00Z',
      cfg
    );
    expect(r.should_fire).toBe(false);
    expect(r.reason).toContain('already fired');
  });

  it('next_fire_iso advances to next eligible day for daily cadence', () => {
    const cfg: ScheduleConfig = { cadence: 'daily', hour_utc: 0 };
    const r = shouldFire('2026-05-06T05:00:00Z', null, cfg);
    expect(r.next_fire_iso).toBe('2026-05-07T00:00:00.000Z');
  });

  it('throws on invalid ISO timestamp', () => {
    const cfg: ScheduleConfig = { cadence: 'daily' };
    expect(() => shouldFire('not-a-date', null, cfg)).toThrow(/invalid ISO/);
  });

  it('matchesCadence internal handles weekly dow boundary', () => {
    const cfg: ScheduleConfig = { cadence: 'weekly', weekly_dow: 0, hour_utc: 0 };
    // 2026-05-03 is Sunday (dow=0)
    const sunday = new Date(Date.UTC(2026, 4, 3, 0, 0, 0, 0));
    expect(__test__.matchesCadence(sunday, cfg)).toBe(true);
  });
});
