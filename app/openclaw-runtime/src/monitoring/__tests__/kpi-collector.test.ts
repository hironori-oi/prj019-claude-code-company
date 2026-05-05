/**
 * kpi-collector.test.ts (R32 Dev-OOO / +9 case)
 */
import { describe, it, expect } from "vitest";
import {
  KPI_IDS,
  collect13KpiSnapshots,
  collectSequence,
  filterByKpiId,
  isFullCoverage,
  summarizeCollection,
  type KpiCollectorInjection,
  type KpiId,
} from "../kpi-collector";

function injectAllOk(): KpiCollectorInjection {
  return {
    now: () => new Date("2026-06-01T00:00:00.000Z"),
    fetchOne: (id: KpiId) => 50 + (KPI_IDS.indexOf(id) % 10),
  };
}

function injectAllNaN(): KpiCollectorInjection {
  return {
    now: () => new Date("2026-06-01T00:00:00.000Z"),
    fetchOne: () => Number.NaN,
  };
}

describe("kpi-collector", () => {
  it("collects all 13 KPI snapshots when fetcher returns valid numbers", () => {
    const r = collect13KpiSnapshots(injectAllOk());
    expect(r.snapshots.length).toBe(13);
    expect(r.missingKpis.length).toBe(0);
    expect(r.capturedAtIso).toBe("2026-06-01T00:00:00.000Z");
  });

  it("path is always 'snapshot' for collected entries", () => {
    const r = collect13KpiSnapshots(injectAllOk());
    expect(r.snapshots.every((s) => s.path === "snapshot")).toBe(true);
  });

  it("places NaN/negative values into missingKpis", () => {
    const r = collect13KpiSnapshots(injectAllNaN());
    expect(r.snapshots.length).toBe(0);
    expect(r.missingKpis.length).toBe(13);
  });

  it("collectSequence produces N results", () => {
    const arr = collectSequence(injectAllOk(), 3);
    expect(arr.length).toBe(3);
    expect(arr.every((r) => r.snapshots.length === 13)).toBe(true);
  });

  it("collectSequence returns [] when iterations <= 0", () => {
    expect(collectSequence(injectAllOk(), 0).length).toBe(0);
    expect(collectSequence(injectAllOk(), -5).length).toBe(0);
  });

  it("filterByKpiId returns only matching KPI", () => {
    const r = collect13KpiSnapshots(injectAllOk());
    const f = filterByKpiId(r.snapshots, "k01_latency_p95_ms");
    expect(f.length).toBe(1);
    expect(f[0].kpiId).toBe("k01_latency_p95_ms");
  });

  it("isFullCoverage true only when 13 snapshots + 0 missing", () => {
    expect(isFullCoverage(collect13KpiSnapshots(injectAllOk()))).toBe(true);
    expect(isFullCoverage(collect13KpiSnapshots(injectAllNaN()))).toBe(false);
  });

  it("summarizeCollection returns total/missing/meanValue", () => {
    const r = collect13KpiSnapshots(injectAllOk());
    const s = summarizeCollection(r);
    expect(s.total).toBe(13);
    expect(s.missing).toBe(0);
    expect(s.meanValue).toBeGreaterThan(0);
  });

  it("Infinity values are treated as missing", () => {
    const inj: KpiCollectorInjection = {
      now: () => new Date("2026-06-01T00:00:00.000Z"),
      fetchOne: () => Number.POSITIVE_INFINITY,
    };
    const r = collect13KpiSnapshots(inj);
    expect(r.missingKpis.length).toBe(13);
    expect(r.snapshots.length).toBe(0);
  });
});
