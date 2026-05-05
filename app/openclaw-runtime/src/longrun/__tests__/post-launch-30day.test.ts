/**
 * post-launch-30day.test.ts (R32 Dev-NNN / +20 case)
 */
import { describe, it, expect } from "vitest";
import {
  buildDayBuckets,
  isFourPathCovered,
  runLongrun30day,
  type KpiSample,
  type LongrunInjection,
} from "../post-launch-30day";

const KPIS = [
  "k01","k02","k03","k04","k05","k06","k07",
  "k08","k09","k10","k11","k12","k13",
];

function makeInjection(opts?: {
  breach?: boolean;
  empty?: boolean;
  threshold?: number;
}): LongrunInjection {
  const threshold = opts?.threshold ?? 100;
  return {
    now: () => new Date("2026-06-01T00:00:00.000Z"),
    breachThreshold: threshold,
    fetchSamples: (dayIso: string): ReadonlyArray<KpiSample> => {
      if (opts?.empty) return [];
      const paths: Array<KpiSample["path"]> = [
        "snapshot", "threshold", "breach", "recovery",
      ];
      const out: KpiSample[] = [];
      for (let i = 0; i < KPIS.length; i += 1) {
        const path = paths[i % 4];
        const base = path === "breach" || opts?.breach ? threshold + 10 : 50;
        out.push({
          kpiId: KPIS[i],
          path,
          value: base + (i % 5),
          timestampIso: `${dayIso}T12:00:00.000Z`,
        });
      }
      return out;
    },
  };
}

describe("post-launch-30day longrun", () => {
  it("[1] buildDayBuckets 30 days", () => {
    const inj = makeInjection();
    const b = buildDayBuckets("2026-06-01T00:00:00.000Z", 30, inj.fetchSamples);
    expect(b.length).toBe(30);
  });
  it("[2] daysCovered=30 in report", () => {
    const r = runLongrun30day("2026-06-01T00:00:00.000Z", makeInjection());
    expect(r.daysCovered).toBe(30);
  });
  it("[3] mode='live' default-set", () => {
    const r = runLongrun30day("2026-06-01T00:00:00.000Z", makeInjection());
    expect(r.mode).toBe("live");
  });
  it("[4] mode='dry-run' selectable", () => {
    const r = runLongrun30day("2026-06-01T00:00:00.000Z", makeInjection(), "dry-run");
    expect(r.mode).toBe("dry-run");
  });
  it("[5] daily aggregation length=30", () => {
    const r = runLongrun30day("2026-06-01T00:00:00.000Z", makeInjection());
    expect(r.daily.length).toBe(30);
  });
  it("[6] weekly aggregation length<=5", () => {
    const r = runLongrun30day("2026-06-01T00:00:00.000Z", makeInjection());
    expect(r.weekly.length).toBeLessThanOrEqual(5);
    expect(r.weekly.length).toBeGreaterThanOrEqual(4);
  });
  it("[7] monthly aggregation single", () => {
    const r = runLongrun30day("2026-06-01T00:00:00.000Z", makeInjection());
    expect(r.monthly.period).toBe("monthly");
  });
  it("[8] totalSamples=30*13", () => {
    const r = runLongrun30day("2026-06-01T00:00:00.000Z", makeInjection());
    expect(r.totalSamples).toBe(30 * 13);
  });
  it("[9] 4 path coverage all positive", () => {
    const r = runLongrun30day("2026-06-01T00:00:00.000Z", makeInjection());
    expect(isFourPathCovered(r)).toBe(true);
  });
  it("[10] snapshot path counted", () => {
    const r = runLongrun30day("2026-06-01T00:00:00.000Z", makeInjection());
    expect(r.pathCoverage.snapshot).toBeGreaterThan(0);
  });
  it("[11] threshold path counted", () => {
    const r = runLongrun30day("2026-06-01T00:00:00.000Z", makeInjection());
    expect(r.pathCoverage.threshold).toBeGreaterThan(0);
  });
  it("[12] breach path counted", () => {
    const r = runLongrun30day("2026-06-01T00:00:00.000Z", makeInjection());
    expect(r.pathCoverage.breach).toBeGreaterThan(0);
  });
  it("[13] recovery path counted", () => {
    const r = runLongrun30day("2026-06-01T00:00:00.000Z", makeInjection());
    expect(r.pathCoverage.recovery).toBeGreaterThan(0);
  });
  it("[14] empty samples => fitForRelease=false in dry-run", () => {
    const r = runLongrun30day("2026-06-01T00:00:00.000Z", makeInjection({ empty: true }), "dry-run");
    expect(r.fitForRelease).toBe(false);
  });
  it("[15] breach excessive => fitForRelease=false", () => {
    const r = runLongrun30day("2026-06-01T00:00:00.000Z", makeInjection({ breach: true }));
    expect(r.fitForRelease).toBe(false);
  });
  it("[16] healthy => fitForRelease=true in live", () => {
    const r = runLongrun30day("2026-06-01T00:00:00.000Z", makeInjection());
    expect(r.fitForRelease).toBe(true);
  });
  it("[17] daily mean numeric", () => {
    const r = runLongrun30day("2026-06-01T00:00:00.000Z", makeInjection());
    expect(typeof r.daily[0].mean).toBe("number");
  });
  it("[18] daily p95 numeric", () => {
    const r = runLongrun30day("2026-06-01T00:00:00.000Z", makeInjection());
    expect(typeof r.daily[0].p95).toBe("number");
  });
  it("[19] aggregation breach count <= sample count", () => {
    const r = runLongrun30day("2026-06-01T00:00:00.000Z", makeInjection());
    expect(r.monthly.breachCount).toBeLessThanOrEqual(r.monthly.count);
  });
  it("[20] empty buckets aggregate cleanly", () => {
    const r = runLongrun30day("2026-06-01T00:00:00.000Z", makeInjection({ empty: true }));
    expect(r.totalSamples).toBe(0);
    expect(r.monthly.mean).toBe(0);
  });
});
