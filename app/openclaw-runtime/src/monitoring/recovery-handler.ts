/**
 * recovery-handler.ts
 * PRJ-019 Round 32 / Dev-OOO Task 1 (W7-B physical)
 *
 * breach -> recovery 状態遷移を pure 検出する。
 * 副作用 0 / mock injection (now のみ) / API call 0。
 */
import type { KpiId, KpiSnapshot } from "./kpi-collector.js";
import type { ThresholdJudgement } from "./threshold-detector.js";

export type RecoveryState = "stable" | "in-breach" | "recovered";

export interface RecoveryEvent {
  readonly kpiId: KpiId;
  readonly state: RecoveryState;
  readonly atIso: string;
  readonly breachDurationMs: number;
}

export interface RecoveryHandlerInjection {
  readonly now: () => Date;
}

interface InternalState {
  state: RecoveryState;
  breachStartIso?: string;
}

/**
 * 直前 state と現 judgement を比較して RecoveryEvent を 1 件生成。
 * - stable -> ok          : event 無し (null)
 * - stable -> breach      : in-breach event
 * - in-breach -> breach   : event 無し (継続)
 * - in-breach -> ok       : recovered event (breachDurationMs = now - breachStartIso)
 */
export function stepRecovery(
  prev: InternalState,
  current: ThresholdJudgement,
  inj: RecoveryHandlerInjection,
): { next: InternalState; event: RecoveryEvent | null } {
  const nowIso = inj.now().toISOString();
  const isBreach = current.severity !== "ok";
  if (prev.state === "stable" && !isBreach) {
    return { next: { state: "stable" }, event: null };
  }
  if (prev.state === "stable" && isBreach) {
    return {
      next: { state: "in-breach", breachStartIso: current.snapshot.timestampIso },
      event: {
        kpiId: current.snapshot.kpiId,
        state: "in-breach",
        atIso: nowIso,
        breachDurationMs: 0,
      },
    };
  }
  if (prev.state === "in-breach" && isBreach) {
    return { next: { ...prev }, event: null };
  }
  // in-breach -> ok (recovered)
  const start = prev.breachStartIso ? new Date(prev.breachStartIso).getTime() : Date.parse(nowIso);
  const duration = Math.max(0, Date.parse(nowIso) - start);
  return {
    next: { state: "stable" },
    event: {
      kpiId: current.snapshot.kpiId,
      state: "recovered",
      atIso: nowIso,
      breachDurationMs: duration,
    },
  };
}

/**
 * KPI 単位で時系列 judgement を pipeline 処理し、recovery events を抽出。
 */
export function detectRecoveryEvents(
  judgements: ReadonlyArray<ThresholdJudgement>,
  inj: RecoveryHandlerInjection,
): ReadonlyArray<RecoveryEvent> {
  const byKpi = new Map<KpiId, ThresholdJudgement[]>();
  for (const j of judgements) {
    const arr = byKpi.get(j.snapshot.kpiId) ?? [];
    arr.push(j);
    byKpi.set(j.snapshot.kpiId, arr);
  }
  const events: RecoveryEvent[] = [];
  for (const [, arr] of byKpi) {
    arr.sort((a, b) => a.snapshot.timestampIso.localeCompare(b.snapshot.timestampIso));
    let state: InternalState = { state: "stable" };
    for (const j of arr) {
      const r = stepRecovery(state, j, inj);
      state = r.next;
      if (r.event) events.push(r.event);
    }
  }
  return events;
}

/** recovered のみ抽出 (post-launch report 用) */
export function filterRecovered(
  events: ReadonlyArray<RecoveryEvent>,
): ReadonlyArray<RecoveryEvent> {
  return events.filter((e) => e.state === "recovered");
}

/** 最大 / 平均 breach 持続時間 (recovered 限定) */
export function summarizeRecoveryDurations(
  events: ReadonlyArray<RecoveryEvent>,
): { maxMs: number; avgMs: number; count: number } {
  const recs = filterRecovered(events);
  if (recs.length === 0) return { maxMs: 0, avgMs: 0, count: 0 };
  let max = 0;
  let sum = 0;
  for (const e of recs) {
    if (e.breachDurationMs > max) max = e.breachDurationMs;
    sum += e.breachDurationMs;
  }
  return { maxMs: max, avgMs: sum / recs.length, count: recs.length };
}

/** snapshot を生成して judgement と組み合わせる helper (test 簡略化用) */
export function pairSnapshotJudgement(
  snapshot: KpiSnapshot,
  severity: ThresholdJudgement["severity"],
): ThresholdJudgement {
  return { snapshot, severity, limit: 0, direction: "upper" };
}
