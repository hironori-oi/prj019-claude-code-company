/**
 * memory-leak-detector.test.ts (R32 Dev-NNN / +5 case)
 */
import { describe, it, expect } from "vitest";
import {
  runMemoryLeakDetector,
  type LeakInjection,
} from "../memory-leak-detector";

function inj(seriesMB: number[]): LeakInjection {
  return {
    takeSnapshot: (i: number) => ({
      takenAtIso: `2026-06-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`,
      heapUsedMB: seriesMB[i] ?? seriesMB[seriesMB.length - 1],
    }),
  };
}

describe("memory-leak-detector", () => {
  it("[1] flat series => leakDetected=false", () => {
    const r = runMemoryLeakDetector(5, inj([100, 100, 100, 100, 100]));
    expect(r.leakDetected).toBe(false);
  });
  it("[2] +6MB/day => leakDetected=true", () => {
    const r = runMemoryLeakDetector(5, inj([100, 106, 112, 118, 124]));
    expect(r.leakDetected).toBe(true);
    expect(r.avgGrowthPerDayMB).toBeGreaterThan(5);
  });
  it("[3] +4MB/day => leakDetected=false (under threshold)", () => {
    const r = runMemoryLeakDetector(5, inj([100, 104, 108, 112, 116]));
    expect(r.leakDetected).toBe(false);
  });
  it("[4] single snapshot => leakDetected=false", () => {
    const r = runMemoryLeakDetector(1, inj([100]));
    expect(r.leakDetected).toBe(false);
    expect(r.snapshotCount).toBe(1);
  });
  it("[5] threshold override custom", () => {
    const r = runMemoryLeakDetector(5, inj([100, 102, 104, 106, 108]), 1);
    expect(r.leakDetected).toBe(true);
    expect(r.thresholdMB).toBe(1);
  });
});
