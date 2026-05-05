/**
 * memory-leak-detector.ts
 * PRJ-019 Open Claw Round 32 / Dev-NNN Task 2
 *
 * 30 day 連続 run の heap snapshot を 24h ごとに採取し、
 * 1 日あたり 5 MB を超える単調増加を leak と判定する。
 *
 * - 副作用 0 / 実 API call $0 / mock injection 厳守
 */

export interface HeapSnapshot {
  readonly takenAtIso: string;
  readonly heapUsedMB: number;
}

export interface LeakReport {
  readonly snapshotCount: number;
  readonly daysCovered: number;
  readonly avgGrowthPerDayMB: number;
  readonly maxGrowthPerDayMB: number;
  readonly leakDetected: boolean;
  readonly thresholdMB: number;
}

export interface LeakInjection {
  readonly takeSnapshot: (dayIndex: number) => HeapSnapshot;
}

const DEFAULT_THRESHOLD_MB = 5;

export function takeSnapshots(
  days: number,
  inj: LeakInjection,
): ReadonlyArray<HeapSnapshot> {
  const out: HeapSnapshot[] = [];
  for (let i = 0; i < days; i += 1) {
    out.push(inj.takeSnapshot(i));
  }
  return out;
}

export function analyzeSnapshots(
  snapshots: ReadonlyArray<HeapSnapshot>,
  thresholdMB: number = DEFAULT_THRESHOLD_MB,
): LeakReport {
  const n = snapshots.length;
  if (n < 2) {
    return {
      snapshotCount: n,
      daysCovered: n,
      avgGrowthPerDayMB: 0,
      maxGrowthPerDayMB: 0,
      leakDetected: false,
      thresholdMB,
    };
  }
  let total = 0;
  let max = 0;
  for (let i = 1; i < n; i += 1) {
    const delta = snapshots[i].heapUsedMB - snapshots[i - 1].heapUsedMB;
    total += delta;
    if (delta > max) max = delta;
  }
  const avg = total / (n - 1);
  const leakDetected = avg > thresholdMB;
  return {
    snapshotCount: n,
    daysCovered: n,
    avgGrowthPerDayMB: avg,
    maxGrowthPerDayMB: max,
    leakDetected,
    thresholdMB,
  };
}

export function runMemoryLeakDetector(
  days: number,
  inj: LeakInjection,
  thresholdMB: number = DEFAULT_THRESHOLD_MB,
): LeakReport {
  const snaps = takeSnapshots(days, inj);
  return analyzeSnapshots(snaps, thresholdMB);
}
