/**
 * PRJ-019 Open Claw "Clawbridge" — W7-E long-term operational metrics
 *   SLA recovery 90day rolling tracker
 *
 * R33 Dev-SSS physical implementation (~110 行).
 * Computes SLA breach / recovery rolling 90day stats for a single SLO
 * (e.g. P95 latency, queue depth, hitl ack time). Companion to
 * W7-B threshold-detector (Dev-OOO 30day) but extended for 90day window.
 *
 * Constraints (R33 Dev-SSS):
 *   - Pure function. No fetch, no fs, no external API call ($0).
 *   - Strict typing. TS6059 0 件継承.
 *   - Side effect: 0.
 */

export type SlaSampleStatus = 'ok' | 'breach' | 'recovered';

export interface SlaSample {
  round: number;
  observed_at: string; // ISO-8601
  status: SlaSampleStatus;
  value: number; // measured numeric (lower = better, by convention)
  threshold: number; // SLA threshold for the metric
}

export interface SlaTrackerOptions {
  now: string; // ISO-8601 anchor
  window_days?: number; // default 90
}

export interface SlaTrackerResult {
  window_start: string;
  window_end: string;
  window_days: number;
  total_samples: number;
  breach_count: number;
  recovery_count: number;
  ok_count: number;
  breach_rate: number; // 0..1 (breach / total)
  mean_value: number | null;
  worst_value: number | null;
  worst_round: number | null;
  consecutive_ok_streak: number; // longest streak of ok inside window
  current_status: SlaSampleStatus | null; // last sample inside window
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function trackSla(
  samples: SlaSample[],
  options: SlaTrackerOptions
): SlaTrackerResult {
  const window_days = options.window_days ?? 90;
  const nowMs = Date.parse(options.now);
  const startMs = nowMs - window_days * MS_PER_DAY;

  const inWindow: SlaSample[] = [];
  for (const s of samples) {
    const t = Date.parse(s.observed_at);
    if (Number.isNaN(t)) continue;
    if (t < startMs || t > nowMs) continue;
    inWindow.push(s);
  }

  inWindow.sort((a, b) => Date.parse(a.observed_at) - Date.parse(b.observed_at));

  let breach = 0;
  let recovery = 0;
  let ok = 0;
  let valueSum = 0;
  let valueCount = 0;
  let worstValue: number | null = null;
  let worstRound: number | null = null;
  let curStreak = 0;
  let bestStreak = 0;

  for (const s of inWindow) {
    if (s.status === 'breach') breach += 1;
    else if (s.status === 'recovered') recovery += 1;
    else if (s.status === 'ok') ok += 1;

    if (typeof s.value === 'number' && !Number.isNaN(s.value)) {
      valueSum += s.value;
      valueCount += 1;
      if (worstValue === null || s.value > worstValue) {
        worstValue = s.value;
        worstRound = s.round;
      }
    }

    if (s.status === 'ok') {
      curStreak += 1;
      if (curStreak > bestStreak) bestStreak = curStreak;
    } else {
      curStreak = 0;
    }
  }

  const total = inWindow.length;
  const breach_rate = total === 0 ? 0 : breach / total;
  const last = inWindow.length > 0 ? inWindow[inWindow.length - 1] : null;

  return {
    window_start: new Date(startMs).toISOString(),
    window_end: new Date(nowMs).toISOString(),
    window_days,
    total_samples: total,
    breach_count: breach,
    recovery_count: recovery,
    ok_count: ok,
    breach_rate,
    mean_value: valueCount === 0 ? null : valueSum / valueCount,
    worst_value: worstValue,
    worst_round: worstRound,
    consecutive_ok_streak: bestStreak,
    current_status: last ? last.status : null,
  };
}

export function isSlaHealthy(result: SlaTrackerResult, max_breach_rate = 0.05): boolean {
  return result.breach_rate <= max_breach_rate;
}
