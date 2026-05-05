/**
 * env-gate-audit.test.ts (R32 Dev-NNN / +8 case)
 */
import { describe, it, expect, vi } from "vitest";
import {
  auditOnce,
  classifyTransition,
  deriveModeAfter,
  runAuditSeries,
  type EnvGateInjection,
} from "../env-gate-audit";

const NOW = new Date("2026-06-15T00:00:00.000Z");

function makeInj(state: "granted" | "revoked" | "absent"): {
  inj: EnvGateInjection;
  notify: ReturnType<typeof vi.fn>;
} {
  const notify = vi.fn();
  return {
    notify,
    inj: {
      readEnv: () => state,
      notify,
      now: () => NOW,
    },
  };
}

describe("env-gate-audit", () => {
  it("[1] first observe granted => first-observe + live", () => {
    const ev = auditOnce(null, "live", makeInj("granted").inj);
    expect(ev.kind).toBe("first-observe");
    expect(ev.modeAfter).toBe("live");
  });
  it("[2] granted -> revoked => downgrade dry-run + notify", () => {
    const { inj, notify } = makeInj("revoked");
    const ev = auditOnce("granted", "live", inj);
    expect(ev.kind).toBe("revoked");
    expect(ev.modeAfter).toBe("dry-run");
    expect(notify).toHaveBeenCalledTimes(1);
  });
  it("[3] revoked -> granted => upgrade live + notify", () => {
    const { inj, notify } = makeInj("granted");
    const ev = auditOnce("revoked", "dry-run", inj);
    expect(ev.kind).toBe("granted");
    expect(ev.modeAfter).toBe("live");
    expect(notify).toHaveBeenCalledTimes(1);
  });
  it("[4] no-change preserves mode + no-notify", () => {
    const { inj, notify } = makeInj("granted");
    const ev = auditOnce("granted", "live", inj);
    expect(ev.kind).toBe("no-change");
    expect(ev.modeAfter).toBe("live");
    expect(notify).not.toHaveBeenCalled();
  });
  it("[5] absent -> revoked stays no-change (not granted)", () => {
    const ev = classifyTransition("absent", "revoked");
    expect(ev).toBe("no-change");
  });
  it("[6] deriveModeAfter revoked forces dry-run", () => {
    expect(deriveModeAfter("revoked", "live")).toBe("dry-run");
  });
  it("[7] series granted->revoked->granted ends live", () => {
    const trail = runAuditSeries(["granted", "revoked", "granted"], {
      notify: vi.fn(),
      now: () => NOW,
    });
    expect(trail.finalMode).toBe("live");
    expect(trail.events.length).toBe(3);
  });
  it("[8] series revoked->revoked stays dry-run", () => {
    const trail = runAuditSeries(["granted", "revoked", "revoked"], {
      notify: vi.fn(),
      now: () => NOW,
    });
    expect(trail.finalMode).toBe("dry-run");
  });
});
