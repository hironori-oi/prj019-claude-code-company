/**
 * kpi-collector.ts
 * PRJ-019 Open Claw "Clawbridge" Round 32 / Dev-OOO Task 1 (W7-B physical)
 *
 * 13 KPI snapshot collector — pure / mock-injection 厳守 / API call 0 / 副作用 0
 *
 * 13 KPI ID:
 *   k01 latency_p95_ms     k02 error_rate_pct      k03 throughput_rps
 *   k04 cpu_usage_pct      k05 mem_usage_pct       k06 disk_io_mbps
 *   k07 queue_depth        k08 retry_count         k09 cache_hit_pct
 *   k10 spawn_failure_pct  k11 dispatch_latency_ms k12 alert_lag_ms
 *   k13 budget_burn_pct
 *
 * 既存 longrun/post-launch-30day.ts (R32 Dev-NNN) と型互換 (KpiSample 再 export 不要)。
 * 連動: alert-router-real-wire.ts (R30 Dev-HHH) dispatcher mock injection。
 */

export const KPI_IDS = [
  "k01_latency_p95_ms",
  "k02_error_rate_pct",
  "k03_throughput_rps",
  "k04_cpu_usage_pct",
  "k05_mem_usage_pct",
  "k06_disk_io_mbps",
  "k07_queue_depth",
  "k08_retry_count",
  "k09_cache_hit_pct",
  "k10_spawn_failure_pct",
  "k11_dispatch_latency_ms",
  "k12_alert_lag_ms",
  "k13_budget_burn_pct",
] as const;

export type KpiId = (typeof KPI_IDS)[number];

export type KpiPath = "snapshot" | "threshold" | "breach" | "recovery";

export interface KpiSnapshot {
  readonly kpiId: KpiId;
  readonly path: KpiPath;
  readonly value: number;
  readonly timestampIso: string;
}

export interface KpiCollectorInjection {
  /** 各 KPI を 1 回 sampling する pure fetcher (実 API 0 件 / mock injection) */
  readonly fetchOne: (kpiId: KpiId, nowIso: string) => number;
  readonly now: () => Date;
}

export interface CollectionResult {
  readonly capturedAtIso: string;
  readonly snapshots: ReadonlyArray<KpiSnapshot>;
  readonly missingKpis: ReadonlyArray<KpiId>;
}

/**
 * 13 KPI を一斉に snapshot 採取する。
 * - path は "snapshot" 固定 (threshold 判定は threshold-detector.ts に分離)。
 * - NaN / Infinity / 負の値は missingKpis に分離 (副作用 0 / throw 0)。
 */
export function collect13KpiSnapshots(
  inj: KpiCollectorInjection,
): CollectionResult {
  const capturedAtIso = inj.now().toISOString();
  const snapshots: KpiSnapshot[] = [];
  const missing: KpiId[] = [];
  for (const kpiId of KPI_IDS) {
    const v = inj.fetchOne(kpiId, capturedAtIso);
    if (!Number.isFinite(v) || v < 0) {
      missing.push(kpiId);
      continue;
    }
    snapshots.push({
      kpiId,
      path: "snapshot",
      value: v,
      timestampIso: capturedAtIso,
    });
  }
  return { capturedAtIso, snapshots, missingKpis: missing };
}

/**
 * 連続 N 回 collect (e.g. 30day longrun 用 daily snapshot 列)。
 * inj.now() を毎回呼ぶので、test では Date sequence を inject すること。
 */
export function collectSequence(
  inj: KpiCollectorInjection,
  iterations: number,
): ReadonlyArray<CollectionResult> {
  if (iterations <= 0) return [];
  const out: CollectionResult[] = [];
  for (let i = 0; i < iterations; i += 1) {
    out.push(collect13KpiSnapshots(inj));
  }
  return out;
}

/** snapshot 配列から特定 KPI のみ抽出 (threshold-detector への橋渡し) */
export function filterByKpiId(
  snapshots: ReadonlyArray<KpiSnapshot>,
  kpiId: KpiId,
): ReadonlyArray<KpiSnapshot> {
  return snapshots.filter((s) => s.kpiId === kpiId);
}

/** 13 KPI 全て captured か coverage 判定 (post-launch fitForRelease の前提) */
export function isFullCoverage(result: CollectionResult): boolean {
  return result.snapshots.length === KPI_IDS.length && result.missingKpis.length === 0;
}

/** missing KPI 0 件 + value 範囲妥当性簡易確認 */
export function summarizeCollection(result: CollectionResult): {
  total: number;
  missing: number;
  meanValue: number;
} {
  const total = result.snapshots.length;
  const missing = result.missingKpis.length;
  const sum = result.snapshots.reduce((a, s) => a + s.value, 0);
  const meanValue = total === 0 ? 0 : sum / total;
  return { total, missing, meanValue };
}
