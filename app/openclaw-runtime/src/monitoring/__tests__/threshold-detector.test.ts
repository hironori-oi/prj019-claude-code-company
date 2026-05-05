/**
 * threshold-detector.test.ts (R32 Dev-OOO / +8 case)
 */
import { describe, it, expect } from "vitest";
import type { KpiSnapshot } from "../kpi-collector";
import {
  DEFAULT_THRESHOLDS,
  countBySeverity,
  filterBreaches,
  judgeBatch,
  judgeThreshold,
} from "../threshold-detector";

function snap(kpiId: KpiSnapshot["kpiId"], value: number): KpiSnapshot {
  return {
    kpiId,
    path: "snapshot",
    value,
    timestampIso: "2026-06-01T00:00:00.000Z",
  };
}

describe("threshold-detector", () => {
  it("returns ok when value below all upper thresholds", () => {
    const j = judgeThreshold(snap("k01_latency_p95_ms", 100));
    expect(j.severity).toBe("ok");
  });

  it("returns info when value crosses upper info threshold", () => {
    const j = judgeThreshold(snap("k01_latency_p95_ms", 250));
    expect(j.severity).toBe("info");
  });

  it("returns warn when value crosses upper warn threshold", () => {
    const j = judgeThreshold(snap("k01_latency_p95_ms", 500));
    expect(j.severity).toBe("warn");
  });

  it("returns critical when value crosses upper critical threshold", () => {
    const j = judgeThreshold(snap("k01_latency_p95_ms", 1000));
    expect(j.severity).toBe("critical");
  });

  it("lower-direction KPI flips logic (cache_hit_pct=20 critical)", () => {
    const j = judgeThreshold(snap("k09_cache_hit_pct", 20));
    expect(j.severity).toBe("critical");
  });

  it("lower-direction KPI ok when above info (cache_hit_pct=90)", () => {
    const j = judgeThreshold(snap("k09_cache_hit_pct", 90));
    expect(j.severity).toBe("ok");
  });

  it("judgeBatch + filterBreaches removes ok entries", () => {
    const snaps = [
      snap("k01_latency_p95_ms", 100), // ok
      snap("k01_latency_p95_ms", 1000), // critical
      snap("k02_error_rate_pct", 0.1), // ok
      snap("k02_error_rate_pct", 6), // critical
    ];
    const judges = judgeBatch(snaps);
    const breaches = filterBreaches(judges);
    expect(breaches.length).toBe(2);
  });

  it("countBySeverity tallies correctly", () => {
    const snaps = [
      snap("k01_latency_p95_ms", 100), // ok
      snap("k01_latency_p95_ms", 250), // info
      snap("k01_latency_p95_ms", 500), // warn
      snap("k01_latency_p95_ms", 1000), // critical
    ];
    const c = countBySeverity(judgeBatch(snaps));
    expect(c.ok).toBe(1);
    expect(c.info).toBe(1);
    expect(c.warn).toBe(1);
    expect(c.critical).toBe(1);
  });

  it("DEFAULT_THRESHOLDS covers all 13 KPIs", () => {
    expect(DEFAULT_THRESHOLDS.length).toBe(13);
  });
});
