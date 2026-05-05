/**
 * breach-counter.ts (monitoring scope)
 * PRJ-019 Round 32 / Dev-OOO Task 1 (W7-B physical)
 *
 * NOTE: 既存の R23 着地 file-breach-counter (file 系 breach 集計) とは別命名スコープ。
 * 本 module は monitoring/ 配下 KPI breach の累計 + sliding window counter。
 *
 * 副作用 0 / pure / mock injection 不要 (純算術)。
 */
import type { KpiId } from "./kpi-collector.js";
import type { ThresholdJudgement, ThresholdSeverity } from "./threshold-detector.js";

export interface BreachTally {
  readonly kpiId: KpiId;
  readonly info: number;
  readonly warn: number;
  readonly critical: number;
  readonly total: number;
}

export interface BreachWindow {
  readonly windowStartIso: string;
  readonly windowEndIso: string;
  readonly tallies: ReadonlyArray<BreachTally>;
  readonly grandTotal: number;
}

function emptyTally(kpiId: KpiId): {
  kpiId: KpiId;
  info: number;
  warn: number;
  critical: number;
  total: number;
} {
  return { kpiId, info: 0, warn: 0, critical: 0, total: 0 };
}

export function tallyBreaches(
  judgements: ReadonlyArray<ThresholdJudgement>,
): ReadonlyArray<BreachTally> {
  const map = new Map<KpiId, ReturnType<typeof emptyTally>>();
  for (const j of judgements) {
    if (j.severity === "ok") continue;
    const id = j.snapshot.kpiId;
    const cur = map.get(id) ?? emptyTally(id);
    if (j.severity === "info") cur.info += 1;
    else if (j.severity === "warn") cur.warn += 1;
    else if (j.severity === "critical") cur.critical += 1;
    cur.total += 1;
    map.set(id, cur);
  }
  return Array.from(map.values());
}

export function buildBreachWindow(
  judgements: ReadonlyArray<ThresholdJudgement>,
  windowStartIso: string,
  windowEndIso: string,
): BreachWindow {
  const filtered = judgements.filter((j) => {
    const t = j.snapshot.timestampIso;
    return t >= windowStartIso && t <= windowEndIso;
  });
  const tallies = tallyBreaches(filtered);
  const grandTotal = tallies.reduce((a, t) => a + t.total, 0);
  return { windowStartIso, windowEndIso, tallies, grandTotal };
}

export function totalBySeverity(
  tallies: ReadonlyArray<BreachTally>,
): Record<ThresholdSeverity, number> {
  const out: Record<ThresholdSeverity, number> = {
    info: 0, warn: 0, critical: 0,
  };
  for (const t of tallies) {
    out.info += t.info;
    out.warn += t.warn;
    out.critical += t.critical;
  }
  return out;
}

export function topBreachKpi(
  tallies: ReadonlyArray<BreachTally>,
  limit = 3,
): ReadonlyArray<BreachTally> {
  return tallies
    .slice()
    .sort((a, b) => b.total - a.total)
    .slice(0, Math.max(0, limit));
}
