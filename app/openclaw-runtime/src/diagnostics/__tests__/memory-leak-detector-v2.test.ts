/**
 * memory-leak-detector-v2.test.ts (R33 Dev-QQQ / 6 case)
 */
import { describe, it, expect } from "vitest";
import {
  isLeakActionable,
  runMemoryLeakDetectorV2,
  type HeapSnapshotV2,
  type LeakInjectionV2,
} from "../memory-leak-detector-v2";

interface SeriesOpts {
  heapMB: number[];
  kindsStart?: Record<string, number>;
  kindsEnd?: Record<string, number>;
  gcMinor?: number;
  gcMajor?: number;
  reclaim?: number;
}

function inj(opts: SeriesOpts): LeakInjectionV2 {
  return {
    takeSnapshot: (i: number): HeapSnapshotV2 => {
      const last = opts.heapMB.length - 1;
      const heapUsedMB = opts.heapMB[i] ?? opts.heapMB[last];
      const isFirst = i === 0;
      const isLast = i === last;
      const objectsByKind = isFirst
        ? opts.kindsStart ?? { Buffer: 100, Promise: 50 }
        : isLast
          ? opts.kindsEnd ?? opts.kindsStart ?? { Buffer: 100, Promise: 50 }
          : opts.kindsStart ?? { Buffer: 100, Promise: 50 };
      return {
        takenAtIso: `2026-06-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`,
        heapUsedMB,
        objectsByKind,
        gcMinorCount: opts.gcMinor ?? 5,
        gcMajorCount: opts.gcMajor ?? 1,
        gcReclaimedMB: opts.reclaim ?? 80,
      };
    },
  };
}

describe("memory-leak-detector-v2", () => {
  it("[1] flat heap + low GC => severity=none", () => {
    const r = runMemoryLeakDetectorV2(
      10,
      inj({ heapMB: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100] }),
    );
    expect(r.severity).toBe("none");
    expect(isLeakActionable(r)).toBe(false);
  });

  it("[2] strong monotonic growth => severity confirmed/likely", () => {
    const heapMB = Array.from({ length: 10 }, (_, i) => 100 + i * 8);
    const r = runMemoryLeakDetectorV2(
      10,
      inj({
        heapMB,
        kindsStart: { Buffer: 100, Promise: 50 },
        kindsEnd: { Buffer: 600, Promise: 300 },
        gcMinor: 30,
        gcMajor: 10,
        reclaim: 5,
      }),
    );
    expect(["likely", "confirmed"]).toContain(r.severity);
    expect(isLeakActionable(r)).toBe(true);
    expect(r.slopeMBPerDay).toBeGreaterThan(5);
  });

  it("[3] kind retention growth ranks Buffer top", () => {
    const heapMB = Array.from({ length: 8 }, (_, i) => 100 + i * 6);
    const r = runMemoryLeakDetectorV2(
      8,
      inj({
        heapMB,
        kindsStart: { Buffer: 50, Promise: 50, Map: 50 },
        kindsEnd: { Buffer: 5000, Promise: 60, Map: 55 },
      }),
    );
    expect(r.topKindRetention[0].kind).toBe("Buffer");
    expect(r.topKindRetention[0].growthRatio).toBeGreaterThan(50);
  });

  it("[4] high GC pressure increments pressureScore", () => {
    const r = runMemoryLeakDetectorV2(
      6,
      inj({
        heapMB: [100, 101, 102, 103, 104, 105],
        gcMinor: 200,
        gcMajor: 50,
        reclaim: 1,
      }),
    );
    expect(r.gcPressure.pressureScore).toBeGreaterThan(2);
    expect(r.gcPressure.majorPerDay).toBeGreaterThan(10);
  });

  it("[5] single snapshot => no analysis / severity none", () => {
    const r = runMemoryLeakDetectorV2(1, inj({ heapMB: [100] }));
    expect(r.severity).toBe("none");
    expect(r.snapshotCount).toBe(1);
    expect(r.slopeMBPerDay).toBe(0);
    expect(r.topKindRetention.length).toBe(0);
  });

  it("[6] EMA reflects recent acceleration over earlier flatness", () => {
    const heapMB = [100, 100, 100, 100, 110, 122, 136, 152];
    const r = runMemoryLeakDetectorV2(8, inj({ heapMB }));
    expect(r.emaGrowthMB).toBeGreaterThan(r.avgGrowthPerDayMB * 0.5);
  });
});
