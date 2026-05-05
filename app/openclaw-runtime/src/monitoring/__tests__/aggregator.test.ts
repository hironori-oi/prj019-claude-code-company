/**
 * aggregator.test.ts (R32 Dev-OOO / +8 case)
 */
import { describe, it, expect } from "vitest";
import type { KpiSnapshot } from "../kpi-collector";
import {
  aggregateDaily,
  aggregateMonthly,
  aggregateWeekly,
  buildMultiPeriodReport,
} from "../aggregator";

function makeSamples(): KpiSnapshot[] {
  const out: KpiSnapshot[] = [];
  // 14 day window with values 1..14 each day having 1 sample
  for (let d = 0; d < 14; d += 1) {
    const day = new Date(Date.UTC(2026, 5, 1 + d)).toISOString().slice(0, 10);
    out.push({
      kpiId: "k01_latency_p95_ms",
      path: "snapshot",
      value: d + 1,
      timestampIso: `${day}T12:00:00.000Z`,
    });
  }
  return out;
}

describe("aggregator", () => {
  it("aggregateDaily produces one bucket per day", () => {
    const r = aggregateDaily(makeSamples());
    expect(r.length).toBe(14);
    expect(r.every((b) => b.count === 1 && b.period === "daily")).toBe(true);
  });

  it("aggregateDaily computes mean=value when single sample", () => {
    const r = aggregateDaily(makeSamples());
    expect(r[0].mean).toBe(1);
    expect(r[13].mean).toBe(14);
  });

  it("aggregateWeekly buckets samples into 2 weeks", () => {
    const r = aggregateWeekly(makeSamples(), "2026-06-01T00:00:00.000Z", 2);
    expect(r.length).toBe(2);
    expect(r[0].count).toBe(7);
    expect(r[1].count).toBe(7);
  });

  it("aggregateWeekly mean of 1..7 is 4", () => {
    const r = aggregateWeekly(makeSamples(), "2026-06-01T00:00:00.000Z", 1);
    expect(r[0].mean).toBe(4);
  });

  it("aggregateMonthly counts all samples in range", () => {
    const r = aggregateMonthly(
      makeSamples(),
      "2026-06-01T00:00:00.000Z",
      "2026-06-30T23:59:59.999Z",
    );
    expect(r.count).toBe(14);
    expect(r.min).toBe(1);
    expect(r.max).toBe(14);
  });

  it("aggregateMonthly p95 close to top of distribution", () => {
    const r = aggregateMonthly(
      makeSamples(),
      "2026-06-01T00:00:00.000Z",
      "2026-06-30T23:59:59.999Z",
    );
    expect(r.p95).toBeGreaterThanOrEqual(13);
    expect(r.p99).toBe(14);
  });

  it("aggregateMonthly stdDev > 0 for varied values", () => {
    const r = aggregateMonthly(
      makeSamples(),
      "2026-06-01T00:00:00.000Z",
      "2026-06-30T23:59:59.999Z",
    );
    expect(r.stdDev).toBeGreaterThan(0);
  });

  it("buildMultiPeriodReport combines daily/weekly/monthly", () => {
    const rep = buildMultiPeriodReport(
      makeSamples(),
      "2026-06-01T00:00:00.000Z",
      "2026-06-30T23:59:59.999Z",
      2,
    );
    expect(rep.daily.length).toBe(14);
    expect(rep.weekly.length).toBe(2);
    expect(rep.monthly.count).toBe(14);
  });

  it("aggregate handles empty input safely", () => {
    const r = aggregateMonthly(
      [],
      "2026-06-01T00:00:00.000Z",
      "2026-06-30T23:59:59.999Z",
    );
    expect(r.count).toBe(0);
    expect(r.mean).toBe(0);
    expect(r.p95).toBe(0);
  });
});
