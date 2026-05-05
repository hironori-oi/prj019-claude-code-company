/**
 * alert-routing.test.ts (R32 Dev-OOO / +8 case)
 *
 * dispatcher は mock injection 経由 (実 API 0 件 / network call 0 件)。
 */
import { describe, it, expect } from "vitest";
import type {
  AlertInput,
  Channel,
  ChannelDispatcher,
} from "../../alerting/alert-router";
import type { KpiSnapshot } from "../kpi-collector";
import type { ThresholdJudgement } from "../threshold-detector";
import {
  decideRouting,
  decideRoutingBatch,
  dispatchMonitoringAlerts,
  severityChannelMatrix,
} from "../alert-routing";

function snap(value: number): KpiSnapshot {
  return {
    kpiId: "k01_latency_p95_ms",
    path: "snapshot",
    value,
    timestampIso: "2026-06-01T00:00:00.000Z",
  };
}

function judge(severity: ThresholdJudgement["severity"]): ThresholdJudgement {
  return { snapshot: snap(500), severity, limit: 400, direction: "upper" };
}

function makeMockDispatcher(opts?: {
  failOn?: Channel;
}): { dispatcher: ChannelDispatcher; calls: Array<{ ch: Channel; input: AlertInput }> } {
  const calls: Array<{ ch: Channel; input: AlertInput }> = [];
  const dispatcher: ChannelDispatcher = async (ch, input) => {
    calls.push({ ch, input });
    if (opts?.failOn === ch) throw new Error(`mock fail ${ch}`);
  };
  return { dispatcher, calls };
}

describe("alert-routing", () => {
  it("info severity routes to slack", () => {
    const d = decideRouting(judge("info"));
    expect(d?.channel).toBe("slack");
    expect(d?.mappedSeverity).toBe("warning");
  });

  it("warn severity routes to pagerduty", () => {
    const d = decideRouting(judge("warn"));
    expect(d?.channel).toBe("pagerduty");
    expect(d?.mappedSeverity).toBe("critical");
  });

  it("critical severity routes to email/SMTP", () => {
    const d = decideRouting(judge("critical"));
    expect(d?.channel).toBe("email");
    expect(d?.mappedSeverity).toBe("emergency");
  });

  it("ok severity returns null", () => {
    expect(decideRouting(judge("ok"))).toBeNull();
  });

  it("decideRoutingBatch filters ok entries", () => {
    const arr = [judge("ok"), judge("info"), judge("warn"), judge("critical")];
    const decisions = decideRoutingBatch(arr);
    expect(decisions.length).toBe(3);
  });

  it("dispatchMonitoringAlerts calls dispatcher per decision (mock injection / 実 API 0)", async () => {
    const { dispatcher, calls } = makeMockDispatcher();
    const decisions = decideRoutingBatch([judge("info"), judge("warn"), judge("critical")]);
    const summary = await dispatchMonitoringAlerts(decisions, dispatcher);
    expect(summary.attempted).toBe(3);
    expect(summary.succeeded).toBe(3);
    expect(summary.failed).toBe(0);
    expect(calls.map((c) => c.ch)).toEqual(["slack", "pagerduty", "email"]);
  });

  it("dispatchMonitoringAlerts collects errors when dispatcher throws", async () => {
    const { dispatcher } = makeMockDispatcher({ failOn: "pagerduty" });
    const decisions = decideRoutingBatch([judge("info"), judge("warn"), judge("critical")]);
    const summary = await dispatchMonitoringAlerts(decisions, dispatcher);
    expect(summary.failed).toBe(1);
    expect(summary.succeeded).toBe(2);
    expect(summary.errors[0].reason).toContain("mock fail pagerduty");
  });

  it("severityChannelMatrix exposes 3 severity x 3 channel mapping", () => {
    const m = severityChannelMatrix();
    expect(m.length).toBe(3);
    const channels = m.map((e) => e.channel).sort();
    expect(channels).toEqual(["email", "pagerduty", "slack"]);
  });
});
