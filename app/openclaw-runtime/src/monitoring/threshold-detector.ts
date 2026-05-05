/**
 * threshold-detector.ts
 * PRJ-019 Round 32 / Dev-OOO Task 1 (W7-B physical) — pure threshold judge
 *
 * 13 KPI ごとに上限/下限 threshold (severity 別) を保持し、snapshot を判定する。
 * 副作用 0 / throw 0 / API call 0。
 */
import type { KpiId, KpiSnapshot } from "./kpi-collector.js";

export type ThresholdSeverity = "info" | "warn" | "critical";

export interface ThresholdRule {
  readonly kpiId: KpiId;
  readonly direction: "upper" | "lower"; // upper: value > limit が breach
  readonly info: number;
  readonly warn: number;
  readonly critical: number;
}

export interface ThresholdJudgement {
  readonly snapshot: KpiSnapshot;
  readonly severity: ThresholdSeverity | "ok";
  readonly limit: number;
  readonly direction: "upper" | "lower";
}

/** R32 Dev-OOO 標準 threshold 表 (post-launch 30day baseline / 数値は調整可) */
export const DEFAULT_THRESHOLDS: ReadonlyArray<ThresholdRule> = [
  { kpiId: "k01_latency_p95_ms", direction: "upper", info: 200, warn: 400, critical: 800 },
  { kpiId: "k02_error_rate_pct", direction: "upper", info: 0.5, warn: 1.0, critical: 5.0 },
  { kpiId: "k03_throughput_rps", direction: "lower", info: 50, warn: 20, critical: 5 },
  { kpiId: "k04_cpu_usage_pct", direction: "upper", info: 60, warn: 80, critical: 95 },
  { kpiId: "k05_mem_usage_pct", direction: "upper", info: 65, warn: 85, critical: 95 },
  { kpiId: "k06_disk_io_mbps", direction: "upper", info: 100, warn: 200, critical: 400 },
  { kpiId: "k07_queue_depth", direction: "upper", info: 100, warn: 500, critical: 2000 },
  { kpiId: "k08_retry_count", direction: "upper", info: 5, warn: 20, critical: 100 },
  { kpiId: "k09_cache_hit_pct", direction: "lower", info: 80, warn: 60, critical: 30 },
  { kpiId: "k10_spawn_failure_pct", direction: "upper", info: 0.1, warn: 1.0, critical: 5.0 },
  { kpiId: "k11_dispatch_latency_ms", direction: "upper", info: 50, warn: 200, critical: 1000 },
  { kpiId: "k12_alert_lag_ms", direction: "upper", info: 1000, warn: 5000, critical: 30000 },
  { kpiId: "k13_budget_burn_pct", direction: "upper", info: 50, warn: 80, critical: 100 },
];

function indexByKpi(
  rules: ReadonlyArray<ThresholdRule>,
): Map<KpiId, ThresholdRule> {
  const m = new Map<KpiId, ThresholdRule>();
  for (const r of rules) m.set(r.kpiId, r);
  return m;
}

export function judgeThreshold(
  snapshot: KpiSnapshot,
  rules: ReadonlyArray<ThresholdRule> = DEFAULT_THRESHOLDS,
): ThresholdJudgement {
  const map = indexByKpi(rules);
  const rule = map.get(snapshot.kpiId);
  if (!rule) {
    return {
      snapshot,
      severity: "ok",
      limit: 0,
      direction: "upper",
    };
  }
  const v = snapshot.value;
  let severity: ThresholdJudgement["severity"] = "ok";
  let limit = 0;
  if (rule.direction === "upper") {
    if (v >= rule.critical) { severity = "critical"; limit = rule.critical; }
    else if (v >= rule.warn) { severity = "warn"; limit = rule.warn; }
    else if (v >= rule.info) { severity = "info"; limit = rule.info; }
  } else {
    if (v <= rule.critical) { severity = "critical"; limit = rule.critical; }
    else if (v <= rule.warn) { severity = "warn"; limit = rule.warn; }
    else if (v <= rule.info) { severity = "info"; limit = rule.info; }
  }
  return { snapshot, severity, limit, direction: rule.direction };
}

export function judgeBatch(
  snapshots: ReadonlyArray<KpiSnapshot>,
  rules: ReadonlyArray<ThresholdRule> = DEFAULT_THRESHOLDS,
): ReadonlyArray<ThresholdJudgement> {
  return snapshots.map((s) => judgeThreshold(s, rules));
}

export function filterBreaches(
  judgements: ReadonlyArray<ThresholdJudgement>,
): ReadonlyArray<ThresholdJudgement> {
  return judgements.filter((j) => j.severity !== "ok");
}

export function countBySeverity(
  judgements: ReadonlyArray<ThresholdJudgement>,
): Record<ThresholdSeverity | "ok", number> {
  const out: Record<ThresholdSeverity | "ok", number> = {
    ok: 0, info: 0, warn: 0, critical: 0,
  };
  for (const j of judgements) out[j.severity] += 1;
  return out;
}
