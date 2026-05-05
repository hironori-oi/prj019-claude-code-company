/**
 * env-gate-audit.ts
 * PRJ-019 Open Claw Round 32 / Dev-NNN Task 3
 *
 * env.OWN_W5_PROD_ACK の状態変化を監査し、
 * 撤回検出時に mode='live' → 'dry-run' へ自動 downgrade + 通知を生成する。
 *
 * - 副作用 0 / 通知は injection 経由で配信先 abstract / 実 API call $0
 */

export type AckState = "granted" | "revoked" | "absent";
export type RuntimeMode = "live" | "dry-run";

export interface EnvSnapshot {
  readonly takenAtIso: string;
  readonly state: AckState;
}

export interface AuditEvent {
  readonly kind: "granted" | "revoked" | "no-change" | "first-observe";
  readonly fromState: AckState;
  readonly toState: AckState;
  readonly atIso: string;
  readonly modeAfter: RuntimeMode;
  readonly notify: boolean;
}

export interface EnvGateInjection {
  readonly readEnv: () => AckState;
  readonly notify: (event: AuditEvent) => void;
  readonly now: () => Date;
}

export function classifyTransition(
  prev: AckState | null,
  curr: AckState,
): AuditEvent["kind"] {
  if (prev === null) return "first-observe";
  if (prev === curr) return "no-change";
  if (prev !== "granted" && curr === "granted") return "granted";
  if (prev === "granted" && curr !== "granted") return "revoked";
  return "no-change";
}

export function deriveModeAfter(
  kind: AuditEvent["kind"],
  prevMode: RuntimeMode,
): RuntimeMode {
  if (kind === "revoked") return "dry-run";
  if (kind === "granted") return "live";
  return prevMode;
}

export function auditOnce(
  prev: AckState | null,
  prevMode: RuntimeMode,
  inj: EnvGateInjection,
): AuditEvent {
  const curr = inj.readEnv();
  const kind = classifyTransition(prev, curr);
  const modeAfter = deriveModeAfter(kind, prevMode);
  const notify = kind === "revoked" || kind === "granted";
  const event: AuditEvent = {
    kind,
    fromState: prev ?? "absent",
    toState: curr,
    atIso: inj.now().toISOString(),
    modeAfter,
    notify,
  };
  if (notify) inj.notify(event);
  return event;
}

export interface AuditTrail {
  readonly events: ReadonlyArray<AuditEvent>;
  readonly finalMode: RuntimeMode;
}

export function runAuditSeries(
  states: ReadonlyArray<AckState>,
  inj: Omit<EnvGateInjection, "readEnv">,
): AuditTrail {
  let prev: AckState | null = null;
  let mode: RuntimeMode = "live";
  const events: AuditEvent[] = [];
  for (const s of states) {
    const local: EnvGateInjection = { ...inj, readEnv: () => s };
    const ev = auditOnce(prev, mode, local);
    events.push(ev);
    prev = s;
    mode = ev.modeAfter;
  }
  return { events, finalMode: mode };
}
