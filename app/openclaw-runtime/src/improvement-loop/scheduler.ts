/**
 * PRJ-019 Open Claw "Clawbridge" — W7-D continuous improvement loop
 *   cron-like scheduler for KPT-DEC chain
 *
 * R33 Dev-RRR physical implementation (≤120 行).
 * Pure-function scheduler that decides whether the KPT-DEC chain
 * should fire at a given anchor timestamp based on a daily / weekly /
 * monthly cadence. No setTimeout / no setInterval / no fs / no fetch.
 * Caller drives time externally (test-friendly).
 *
 * Constraints (R33 Dev-RRR):
 *   - Pure function. No external API call ($0).
 *   - Strict typing. TS6059 0 件継承.
 *   - 副作用 0 (caller invokes runKptDecChain after shouldFire returns true).
 */

export type Cadence = 'daily' | 'weekly' | 'monthly';

export interface ScheduleConfig {
  cadence: Cadence;
  /** day-of-week (0=Sun..6=Sat) for weekly cadence. default 1=Mon */
  weekly_dow?: number;
  /** day-of-month (1..28) for monthly cadence. default 1 */
  monthly_dom?: number;
  /** UTC hour (0..23) at which to fire. default 0 */
  hour_utc?: number;
}

export interface FireDecision {
  should_fire: boolean;
  reason: string;
  next_fire_iso: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseIso(iso: string): Date {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) {
    throw new Error(`scheduler: invalid ISO timestamp: ${iso}`);
  }
  return new Date(t);
}

function startOfHourUtc(d: Date): Date {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      d.getUTCHours(),
      0,
      0,
      0
    )
  );
}

function matchesCadence(now: Date, cfg: ScheduleConfig): boolean {
  const hour = cfg.hour_utc ?? 0;
  if (now.getUTCHours() !== hour) return false;
  switch (cfg.cadence) {
    case 'daily':
      return true;
    case 'weekly': {
      const dow = cfg.weekly_dow ?? 1;
      return now.getUTCDay() === dow;
    }
    case 'monthly': {
      const dom = cfg.monthly_dom ?? 1;
      return now.getUTCDate() === dom;
    }
  }
}

function nextFire(now: Date, cfg: ScheduleConfig): Date {
  const hour = cfg.hour_utc ?? 0;
  const candidate = startOfHourUtc(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour))
  );
  // walk forward up to 366 days until cadence matches and time > now
  for (let i = 0; i <= 366; i += 1) {
    const c = new Date(candidate.getTime() + i * MS_PER_DAY);
    if (c.getTime() <= now.getTime()) continue;
    if (matchesCadence(c, cfg)) return c;
  }
  throw new Error('scheduler: failed to compute next fire within 366 days');
}

export function shouldFire(
  nowIso: string,
  lastFireIso: string | null,
  cfg: ScheduleConfig
): FireDecision {
  const now = parseIso(nowIso);
  const hourBucket = startOfHourUtc(now);
  const matches = matchesCadence(hourBucket, cfg);

  let alreadyFiredThisBucket = false;
  if (lastFireIso) {
    const last = parseIso(lastFireIso);
    const lastBucket = startOfHourUtc(last);
    if (lastBucket.getTime() === hourBucket.getTime()) {
      alreadyFiredThisBucket = true;
    }
  }

  const fire = matches && !alreadyFiredThisBucket;
  const reason = fire
    ? `cadence=${cfg.cadence} matched at hour=${hourBucket.toISOString()}`
    : matches
      ? `cadence=${cfg.cadence} matched but already fired this bucket`
      : `cadence=${cfg.cadence} did not match current bucket`;

  return {
    should_fire: fire,
    reason,
    next_fire_iso: nextFire(now, cfg).toISOString(),
  };
}

export const __test__ = {
  matchesCadence,
  startOfHourUtc,
  nextFire,
};
