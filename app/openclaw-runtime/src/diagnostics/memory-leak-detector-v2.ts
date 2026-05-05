/**
 * memory-leak-detector-v2.ts
 * PRJ-019 Open Claw Round 33 / Dev-QQQ Task 3
 *
 * v1 (R32 Dev-NNN, 83 line, frozen) からの拡張:
 *  - heap snapshot diff によるオブジェクト種別単位の retention 検出
 *  - GC pressure 推定 (GC 頻度 + 平均回収量)
 *  - 60day window での双指数平均と回帰係数 (slope MB/day) 算出
 *  - 多段判定 (suspect / likely / confirmed)
 *
 * 副作用 0 / 実 API call $0 / mock injection 厳守 / 既存 v1 file 無改変保持.
 */

export interface HeapSnapshotV2 {
  readonly takenAtIso: string;
  readonly heapUsedMB: number;
  readonly objectsByKind: Readonly<Record<string, number>>;
  readonly gcMinorCount: number;
  readonly gcMajorCount: number;
  readonly gcReclaimedMB: number;
}

export type LeakSeverity = "none" | "suspect" | "likely" | "confirmed";

export interface KindRetention {
  readonly kind: string;
  readonly startCount: number;
  readonly endCount: number;
  readonly growthRatio: number;
}

export interface GcPressureReport {
  readonly minorPerDay: number;
  readonly majorPerDay: number;
  readonly avgReclaimedMB: number;
  readonly pressureScore: number;
}

export interface LeakReportV2 {
  readonly snapshotCount: number;
  readonly daysCovered: number;
  readonly avgGrowthPerDayMB: number;
  readonly maxGrowthPerDayMB: number;
  readonly slopeMBPerDay: number;
  readonly emaGrowthMB: number;
  readonly severity: LeakSeverity;
  readonly thresholdMB: number;
  readonly topKindRetention: ReadonlyArray<KindRetention>;
  readonly gcPressure: GcPressureReport;
}

export interface LeakInjectionV2 {
  readonly takeSnapshot: (dayIndex: number) => HeapSnapshotV2;
}

const DEFAULT_THRESHOLD_MB = 5;
const EMA_ALPHA = 0.3;
const TOP_K = 5;

export function takeSnapshotsV2(
  days: number,
  inj: LeakInjectionV2,
): ReadonlyArray<HeapSnapshotV2> {
  const out: HeapSnapshotV2[] = [];
  for (let i = 0; i < days; i += 1) {
    out.push(inj.takeSnapshot(i));
  }
  return out;
}

function diffKindRetention(
  snapshots: ReadonlyArray<HeapSnapshotV2>,
): ReadonlyArray<KindRetention> {
  if (snapshots.length < 2) return [];
  const first = snapshots[0].objectsByKind;
  const last = snapshots[snapshots.length - 1].objectsByKind;
  const kinds = new Set<string>([...Object.keys(first), ...Object.keys(last)]);
  const out: KindRetention[] = [];
  for (const kind of kinds) {
    const startCount = first[kind] ?? 0;
    const endCount = last[kind] ?? 0;
    const growthRatio = startCount === 0 ? endCount : endCount / startCount;
    out.push({ kind, startCount, endCount, growthRatio });
  }
  out.sort((a, b) => b.growthRatio - a.growthRatio);
  return out.slice(0, TOP_K);
}

function computeGcPressure(
  snapshots: ReadonlyArray<HeapSnapshotV2>,
): GcPressureReport {
  if (snapshots.length === 0) {
    return { minorPerDay: 0, majorPerDay: 0, avgReclaimedMB: 0, pressureScore: 0 };
  }
  const totalMinor = snapshots.reduce((acc, s) => acc + s.gcMinorCount, 0);
  const totalMajor = snapshots.reduce((acc, s) => acc + s.gcMajorCount, 0);
  const totalReclaim = snapshots.reduce((acc, s) => acc + s.gcReclaimedMB, 0);
  const days = Math.max(1, snapshots.length);
  const minorPerDay = totalMinor / days;
  const majorPerDay = totalMajor / days;
  const avgReclaimedMB = totalReclaim / days;
  const pressureScore =
    minorPerDay * 0.05 + majorPerDay * 1.0 + Math.max(0, 50 - avgReclaimedMB) * 0.02;
  return { minorPerDay, majorPerDay, avgReclaimedMB, pressureScore };
}

function linearSlope(values: ReadonlyArray<number>): number {
  const n = values.length;
  if (n < 2) return 0;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i += 1) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

function exponentialMovingAverageGrowth(
  snapshots: ReadonlyArray<HeapSnapshotV2>,
): number {
  if (snapshots.length < 2) return 0;
  let ema = 0;
  for (let i = 1; i < snapshots.length; i += 1) {
    const delta = snapshots[i].heapUsedMB - snapshots[i - 1].heapUsedMB;
    ema = i === 1 ? delta : EMA_ALPHA * delta + (1 - EMA_ALPHA) * ema;
  }
  return ema;
}

function classifySeverity(
  avgGrowth: number,
  emaGrowth: number,
  slope: number,
  thresholdMB: number,
  gcPressure: GcPressureReport,
): LeakSeverity {
  const overAvg = avgGrowth > thresholdMB;
  const overEma = emaGrowth > thresholdMB;
  const overSlope = slope > thresholdMB;
  const highPressure = gcPressure.pressureScore > 2;
  const flags = [overAvg, overEma, overSlope, highPressure].filter(Boolean).length;
  if (flags >= 4) return "confirmed";
  if (flags === 3) return "likely";
  if (flags === 2) return "suspect";
  if (flags === 1 && (overAvg || overSlope)) return "suspect";
  return "none";
}

export function analyzeSnapshotsV2(
  snapshots: ReadonlyArray<HeapSnapshotV2>,
  thresholdMB: number = DEFAULT_THRESHOLD_MB,
): LeakReportV2 {
  const n = snapshots.length;
  if (n < 2) {
    return {
      snapshotCount: n,
      daysCovered: n,
      avgGrowthPerDayMB: 0,
      maxGrowthPerDayMB: 0,
      slopeMBPerDay: 0,
      emaGrowthMB: 0,
      severity: "none",
      thresholdMB,
      topKindRetention: [],
      gcPressure: computeGcPressure(snapshots),
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
  const slope = linearSlope(snapshots.map((s) => s.heapUsedMB));
  const ema = exponentialMovingAverageGrowth(snapshots);
  const gcPressure = computeGcPressure(snapshots);
  const topKindRetention = diffKindRetention(snapshots);
  const severity = classifySeverity(avg, ema, slope, thresholdMB, gcPressure);
  return {
    snapshotCount: n,
    daysCovered: n,
    avgGrowthPerDayMB: avg,
    maxGrowthPerDayMB: max,
    slopeMBPerDay: slope,
    emaGrowthMB: ema,
    severity,
    thresholdMB,
    topKindRetention,
    gcPressure,
  };
}

export function runMemoryLeakDetectorV2(
  days: number,
  inj: LeakInjectionV2,
  thresholdMB: number = DEFAULT_THRESHOLD_MB,
): LeakReportV2 {
  const snaps = takeSnapshotsV2(days, inj);
  return analyzeSnapshotsV2(snaps, thresholdMB);
}

export function isLeakActionable(report: LeakReportV2): boolean {
  return report.severity === "likely" || report.severity === "confirmed";
}
