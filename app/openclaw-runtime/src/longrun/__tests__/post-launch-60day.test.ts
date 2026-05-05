/**
 * post-launch-60day.test.ts (R33 Dev-QQQ / 12 case)
 */
import { describe, it, expect } from "vitest";
import {
  buildDayBuckets60,
  isFourPathCovered60,
  phase2RegressionFlag,
  runLongrun60day,
  type KpiSample60,
  type LongrunInjection60,
} from "../post-launch-60day";

const KPIS = [
  "k01", "k02", "k03", "k04", "k05", "k06", "k07",
  "k08", "k09", "k10", "k11", "k12", "k13",
];

interface InjOpts {
  breach?: boolean;
  empty?: boolean;
  threshold?: number;
  driftPhase2Boost?: number;
  streakWindow?: [number, number];
}

function makeInjection60(opts?: InjOpts): LongrunInjection60 {
  const threshold = opts?.threshold ?? 100;
  const boost = opts?.driftPhase2Boost ?? 0;
  return {
    now: () => new Date("2026-06-01T00:00:00.000Z"),
    breachThreshold: threshold,
    fetchSamples: (dayIso: string): ReadonlyArray<KpiSample60> => {
      if (opts?.empty) return [];
      const dayIdx = Number(dayIso.slice(8, 10)) - 1; // rough day index
      const inPhase2 = dayIso >= "2026-07-01";
      const inStreak = opts?.streakWindow
        ? dayIdx >= opts.streakWindow[0] && dayIdx <= opts.streakWindow[1]
        : false;
      const paths: Array<KpiSample60["path"]> = [
        "snapshot", "threshold", "breach", "recovery",
      ];
      const out: KpiSample60[] = [];
      for (let i = 0; i < KPIS.length; i += 1) {
        const path = paths[i % 4];
        const breachActive = path === "breach" || opts?.breach || inStreak;
        const base = breachActive ? threshold + 10 : 50;
        const driftAdd = inPhase2 ? boost : 0;
        out.push({
          kpiId: KPIS[i],
          path,
          value: base + (i % 5) + driftAdd,
          timestampIso: `${dayIso}T12:00:00.000Z`,
        });
      }
      return out;
    },
  };
}

describe("post-launch-60day longrun", () => {
  it("[1] buildDayBuckets60 produces 60 day buckets", () => {
    const inj = makeInjection60();
    const b = buildDayBuckets60(
      "2026-06-01T00:00:00.000Z",
      60,
      inj.fetchSamples,
    );
    expect(b.length).toBe(60);
  });

  it("[2] daysCovered=60 in report", () => {
    const r = runLongrun60day(
      "2026-06-01T00:00:00.000Z",
      makeInjection60(),
    );
    expect(r.daysCovered).toBe(60);
  });

  it("[3] daily aggregation length=60", () => {
    const r = runLongrun60day(
      "2026-06-01T00:00:00.000Z",
      makeInjection60(),
    );
    expect(r.daily.length).toBe(60);
  });

  it("[4] weekly aggregation 8 or 9 buckets", () => {
    const r = runLongrun60day(
      "2026-06-01T00:00:00.000Z",
      makeInjection60(),
    );
    expect(r.weekly.length).toBeGreaterThanOrEqual(8);
    expect(r.weekly.length).toBeLessThanOrEqual(9);
  });

  it("[5] biweekly aggregation length<=5", () => {
    const r = runLongrun60day(
      "2026-06-01T00:00:00.000Z",
      makeInjection60(),
    );
    expect(r.biweekly.length).toBeLessThanOrEqual(5);
    expect(r.biweekly.length).toBeGreaterThanOrEqual(4);
  });

  it("[6] monthly aggregation produces 2 phase entries", () => {
    const r = runLongrun60day(
      "2026-06-01T00:00:00.000Z",
      makeInjection60(),
    );
    expect(r.monthly.length).toBe(2);
    expect(r.monthly[0].period).toBe("monthly");
  });

  it("[7] totalSamples = 60 * 13", () => {
    const r = runLongrun60day(
      "2026-06-01T00:00:00.000Z",
      makeInjection60(),
    );
    expect(r.totalSamples).toBe(60 * 13);
  });

  it("[8] 4 path coverage all positive", () => {
    const r = runLongrun60day(
      "2026-06-01T00:00:00.000Z",
      makeInjection60(),
    );
    expect(isFourPathCovered60(r)).toBe(true);
  });

  it("[9] healthy steady => fitForRelease=true", () => {
    const r = runLongrun60day(
      "2026-06-01T00:00:00.000Z",
      makeInjection60(),
    );
    expect(r.fitForRelease).toBe(true);
    expect(r.drift.driftDetected).toBe(false);
  });

  it("[10] phase2 drift => fitForRelease=false", () => {
    const r = runLongrun60day(
      "2026-06-01T00:00:00.000Z",
      makeInjection60({ driftPhase2Boost: 80 }),
    );
    expect(r.drift.driftDetected).toBe(true);
    expect(r.fitForRelease).toBe(false);
  });

  it("[11] sustained breach streak flagged", () => {
    const r = runLongrun60day(
      "2026-06-01T00:00:00.000Z",
      makeInjection60({ streakWindow: [10, 20] }),
    );
    expect(r.breachStreak.maxStreakDays).toBeGreaterThan(3);
    expect(phase2RegressionFlag(r)).toBe(true);
  });

  it("[12] empty samples => fitForRelease=false / quarterly count 0", () => {
    const r = runLongrun60day(
      "2026-06-01T00:00:00.000Z",
      makeInjection60({ empty: true }),
      "dry-run",
    );
    expect(r.totalSamples).toBe(0);
    expect(r.quarterly.count).toBe(0);
    expect(r.fitForRelease).toBe(false);
  });
});
