/**
 * alert-routing.ts
 * PRJ-019 Round 32 / Dev-OOO Task 2 (W7-B physical)
 *
 * monitoring breach -> alert-router-real-wire.ts (R30 Dev-HHH) connector module。
 *
 * severity -> channel 対応 (本 module の monitoring scope severity):
 *   info     -> Slack (informational)
 *   warn     -> PagerDuty (warning page)
 *   critical -> SMTP (critical email)
 *
 * NOTE: alert-router.ts (R29) は warning/critical/emergency の 3 severity 体系。
 *       本 monitoring scope は info/warn/critical を独自に持ち、AlertInput.severity
 *       にマッピングして dispatch する。実 dispatch は injected dispatcher 経由のみ
 *       (実 API 0 件 / mock injection 厳守)。
 */
import type {
  AlertInput,
  Channel,
  ChannelDispatcher,
  Severity,
} from "../alerting/alert-router.js";
import type { ThresholdJudgement, ThresholdSeverity } from "./threshold-detector.js";

export type MonitoringSeverity = ThresholdSeverity; // info | warn | critical

export interface MonitoringRoutingDecision {
  readonly judgement: ThresholdJudgement;
  readonly channel: Channel;
  readonly mappedSeverity: Severity;
  readonly alertInput: AlertInput;
}

const CHANNEL_MAP: Record<MonitoringSeverity, Channel> = {
  info: "slack",
  warn: "pagerduty",
  critical: "email",
};

const SEVERITY_MAP: Record<MonitoringSeverity, Severity> = {
  info: "warning",
  warn: "critical",
  critical: "emergency",
};

export function decideRouting(
  j: ThresholdJudgement,
): MonitoringRoutingDecision | null {
  if (j.severity === "ok") return null;
  const channel = CHANNEL_MAP[j.severity];
  const mappedSeverity = SEVERITY_MAP[j.severity];
  const alertInput: AlertInput = {
    severity: mappedSeverity,
    source: `monitoring/${j.snapshot.kpiId}`,
    message: `${j.snapshot.kpiId} ${j.severity.toUpperCase()} threshold ${j.limit} (value=${j.snapshot.value})`,
    fingerprint: `${j.snapshot.kpiId}:${j.severity}`,
    occurredAt: j.snapshot.timestampIso,
  };
  return { judgement: j, channel, mappedSeverity, alertInput };
}

export function decideRoutingBatch(
  judgements: ReadonlyArray<ThresholdJudgement>,
): ReadonlyArray<MonitoringRoutingDecision> {
  const out: MonitoringRoutingDecision[] = [];
  for (const j of judgements) {
    const d = decideRouting(j);
    if (d) out.push(d);
  }
  return out;
}

export interface DispatchSummary {
  readonly attempted: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly errors: ReadonlyArray<{ kpiId: string; reason: string }>;
}

/**
 * 注入された dispatcher (alert-router-real-wire.ts createRealChannelDispatcher 互換) を
 * 介して 1 件ずつ送出する。実 API は dispatcher 内部で mock/dry-run/live 切替され、
 * 本 module は実通知 0 件厳守。
 */
export async function dispatchMonitoringAlerts(
  decisions: ReadonlyArray<MonitoringRoutingDecision>,
  dispatcher: ChannelDispatcher,
): Promise<DispatchSummary> {
  let succeeded = 0;
  let failed = 0;
  const errors: Array<{ kpiId: string; reason: string }> = [];
  for (const d of decisions) {
    try {
      await dispatcher(d.channel, d.alertInput);
      succeeded += 1;
    } catch (e) {
      failed += 1;
      errors.push({
        kpiId: d.judgement.snapshot.kpiId,
        reason: e instanceof Error ? e.message : "unknown",
      });
    }
  }
  return { attempted: decisions.length, succeeded, failed, errors };
}

/** 3 severity × 3 channel の matrix coverage (test / spec 検証用) */
export function severityChannelMatrix(): ReadonlyArray<{
  severity: MonitoringSeverity;
  channel: Channel;
  mapped: Severity;
}> {
  return (Object.keys(CHANNEL_MAP) as MonitoringSeverity[]).map((s) => ({
    severity: s,
    channel: CHANNEL_MAP[s],
    mapped: SEVERITY_MAP[s],
  }));
}
