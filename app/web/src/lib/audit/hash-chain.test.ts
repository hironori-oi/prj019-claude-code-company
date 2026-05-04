/**
 * PRJ-019 Clawbridge - Hash Chain Canonical Drift Test (Vitest)
 *
 * Issue: DEC-019-041 W0-Week2 buffer (hash-chain canonical drift 防止)
 * Source of truth: ../../../../fixtures/audit-canonical-vectors.json
 * Spec: ../../../../docs/audit-canonical-spec.md
 *
 * SQL trigger と TS canonicalize() が同一 hash を生成することを round-trip で検証。
 * SQL 側は supabase/tests/audit_hash_chain.test.sql で同 fixture を検証する。
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  GENESIS_PREV_HASH,
  canonicalJson,
  canonicalize,
  canonicalizePartial,
  buildAppendAuditPayload,
  computeCurrHash,
  sha256Hex,
  verifyChain,
  verifyRecord,
  type AuditRecord,
} from "./hash-chain";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURE_PATH = resolve(__dirname, "../../../../fixtures/audit-canonical-vectors.json");

interface FixtureVector {
  id: number;
  label: string;
  tenantId: string;
  ts: string;
  actorKind: AuditRecord["actorKind"];
  actorId: string;
  eventKind: string;
  resource: string;
  payload: unknown;
  prevHash: string;
  expectedCanonical: string;
  expectedCurrHash: string;
}

interface FixtureFile {
  tenantId: string;
  genesisPrevHash: string;
  vectors: FixtureVector[];
}

const fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf8")) as FixtureFile;

describe("audit hash-chain canonicalJson", () => {
  it("null is 'null'", () => {
    expect(canonicalJson(null)).toBe("null");
  });

  it("undefined at top-level is 'null'", () => {
    expect(canonicalJson(undefined)).toBe("null");
  });

  it("boolean", () => {
    expect(canonicalJson(true)).toBe("true");
    expect(canonicalJson(false)).toBe("false");
  });

  it("number short form", () => {
    expect(canonicalJson(0)).toBe("0");
    expect(canonicalJson(-0)).toBe("0");
    expect(canonicalJson(1.5)).toBe("1.5");
    expect(canonicalJson(0.0123)).toBe("0.0123");
    expect(canonicalJson(1e21)).toBe("1e+21");
  });

  it("number rejects non-finite", () => {
    expect(() => canonicalJson(NaN)).toThrow();
    expect(() => canonicalJson(Infinity)).toThrow();
    expect(() => canonicalJson(-Infinity)).toThrow();
  });

  it("string with quote/backslash/newline", () => {
    expect(canonicalJson('a"b\\c\nd')).toBe('"a\\"b\\\\c\\nd"');
  });

  it("array preserves order", () => {
    expect(canonicalJson([3, 1, 2])).toBe("[3,1,2]");
  });

  it("object sorts keys", () => {
    expect(canonicalJson({ z: 1, a: 2, m: 3 })).toBe('{"a":2,"m":3,"z":1}');
  });

  it("nested object recursively sorts", () => {
    expect(canonicalJson({ b: { y: 1, x: 2 }, a: 0 })).toBe('{"a":0,"b":{"x":2,"y":1}}');
  });

  it("undefined value drops the key", () => {
    expect(canonicalJson({ a: 1, b: undefined as unknown })).toBe('{"a":1}');
  });

  it("null value retained", () => {
    expect(canonicalJson({ a: null })).toBe('{"a":null}');
  });

  it("rejects bigint", () => {
    expect(() => canonicalJson(1n)).toThrow();
  });
});

describe("audit hash-chain fixture round-trip (SQL parity)", () => {
  it("genesis prev_hash constant matches fixture", () => {
    expect(GENESIS_PREV_HASH).toBe(fixture.genesisPrevHash);
  });

  for (const v of fixture.vectors) {
    it(`vector #${v.id} (${v.label}): canonicalize() matches expected`, () => {
      const rec = {
        tenantId: v.tenantId,
        ts: v.ts,
        actorKind: v.actorKind,
        actorId: v.actorId,
        eventKind: v.eventKind,
        resource: v.resource,
        payload: v.payload,
        prevHash: v.prevHash,
      };
      expect(canonicalize(rec)).toBe(v.expectedCanonical);
    });

    it(`vector #${v.id} (${v.label}): computeCurrHash() matches expected SHA-256`, () => {
      const rec = {
        tenantId: v.tenantId,
        ts: v.ts,
        actorKind: v.actorKind,
        actorId: v.actorId,
        eventKind: v.eventKind,
        resource: v.resource,
        payload: v.payload,
        prevHash: v.prevHash,
      };
      expect(computeCurrHash(rec)).toBe(v.expectedCurrHash);
    });
  }
});

describe("audit hash-chain verifyChain", () => {
  it("empty chain is ok", () => {
    expect(verifyChain([])).toEqual({ ok: true, scanned: 0 });
  });

  it("full fixture chain verifies", () => {
    const records: AuditRecord[] = fixture.vectors.map((v) => ({
      id: v.id,
      tenantId: v.tenantId,
      ts: v.ts,
      actorKind: v.actorKind,
      actorId: v.actorId,
      eventKind: v.eventKind,
      resource: v.resource,
      payload: v.payload,
      prevHash: v.prevHash,
      currHash: v.expectedCurrHash,
    }));
    const result = verifyChain(records);
    expect(result.ok).toBe(true);
    expect(result.scanned).toBe(records.length);
  });

  it("breaks if first record prev_hash != genesis", () => {
    const records: AuditRecord[] = [
      {
        id: 1,
        tenantId: fixture.tenantId,
        ts: "2026-05-03T00:00:00.000000+00:00",
        actorKind: "system",
        actorId: "x",
        eventKind: "x",
        resource: "x",
        payload: null,
        prevHash: "f".repeat(64),
        currHash: "f".repeat(64),
      },
    ];
    const result = verifyChain(records);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("genesis");
  });

  it("breaks if curr_hash tampered", () => {
    const v0 = fixture.vectors[0]!;
    const records: AuditRecord[] = [
      {
        id: v0.id,
        tenantId: v0.tenantId,
        ts: v0.ts,
        actorKind: v0.actorKind,
        actorId: v0.actorId,
        eventKind: v0.eventKind,
        resource: v0.resource,
        payload: v0.payload,
        prevHash: v0.prevHash,
        currHash: "0".repeat(64), // 改ざん
      },
    ];
    const result = verifyChain(records);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("curr_hash mismatch");
    expect(result.brokenAtId).toBe(v0.id);
  });

  it("breaks if prev_hash != previous curr_hash", () => {
    const v0 = fixture.vectors[0]!;
    const v1 = fixture.vectors[1]!;
    const records: AuditRecord[] = [
      {
        id: v0.id,
        tenantId: v0.tenantId,
        ts: v0.ts,
        actorKind: v0.actorKind,
        actorId: v0.actorId,
        eventKind: v0.eventKind,
        resource: v0.resource,
        payload: v0.payload,
        prevHash: v0.prevHash,
        currHash: v0.expectedCurrHash,
      },
      {
        id: v1.id,
        tenantId: v1.tenantId,
        ts: v1.ts,
        actorKind: v1.actorKind,
        actorId: v1.actorId,
        eventKind: v1.eventKind,
        resource: v1.resource,
        payload: v1.payload,
        prevHash: "1".repeat(64), // 改ざん: 前 record の curr_hash と不一致
        currHash: v1.expectedCurrHash,
      },
    ];
    const result = verifyChain(records);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("prev_hash != previous curr_hash");
    expect(result.brokenAtId).toBe(v1.id);
  });
});

describe("audit hash-chain canonicalizePartial / buildAppendAuditPayload (P0-2)", () => {
  it("canonicalizePartial returns 7 fields joined by '|' (no prev_hash)", () => {
    const v = fixture.vectors[0]!;
    const partial = canonicalizePartial({
      tenantId: v.tenantId,
      ts: v.ts,
      actorKind: v.actorKind,
      actorId: v.actorId,
      eventKind: v.eventKind,
      resource: v.resource,
      payload: v.payload,
    });
    // partial + '|' + prev_hash should equal full canonical
    expect(`${partial}|${v.prevHash}`).toBe(v.expectedCanonical);
  });

  it("buildAppendAuditPayload returns canonical + expectedCurrHash matching fixture", () => {
    const v = fixture.vectors[0]!;
    const payload = buildAppendAuditPayload({
      tenantId: v.tenantId,
      ts: v.ts,
      actorKind: v.actorKind,
      actorId: v.actorId,
      eventKind: v.eventKind,
      resource: v.resource,
      payload: v.payload,
      prevHash: v.prevHash,
    });
    expect(payload.canonical).toBe(v.expectedCanonical);
    expect(payload.expectedCurrHash).toBe(v.expectedCurrHash);
    expect(sha256Hex(payload.canonical)).toBe(v.expectedCurrHash);
  });

  it("buildAppendAuditPayload preserves all fields verbatim", () => {
    const v = fixture.vectors[1]!;
    const payload = buildAppendAuditPayload({
      tenantId: v.tenantId,
      ts: v.ts,
      actorKind: v.actorKind,
      actorId: v.actorId,
      eventKind: v.eventKind,
      resource: v.resource,
      payload: v.payload,
      prevHash: v.prevHash,
    });
    expect(payload.tenantId).toBe(v.tenantId);
    expect(payload.actorKind).toBe(v.actorKind);
    expect(payload.actorId).toBe(v.actorId);
    expect(payload.eventKind).toBe(v.eventKind);
    expect(payload.resource).toBe(v.resource);
    expect(payload.payload).toEqual(v.payload);
  });
});

describe("audit hash-chain verifyRecord (incremental)", () => {
  it("genesis record verifies with prev=null", () => {
    const v = fixture.vectors[0]!;
    const rec: AuditRecord = {
      id: v.id,
      tenantId: v.tenantId,
      ts: v.ts,
      actorKind: v.actorKind,
      actorId: v.actorId,
      eventKind: v.eventKind,
      resource: v.resource,
      payload: v.payload,
      prevHash: v.prevHash,
      currHash: v.expectedCurrHash,
    };
    expect(verifyRecord(rec, null)).toEqual({ ok: true, scanned: 1 });
  });

  it("subsequent record verifies with previous", () => {
    const prev = fixture.vectors[0]!;
    const curr = fixture.vectors[1]!;
    const prevRec: AuditRecord = {
      id: prev.id,
      tenantId: prev.tenantId,
      ts: prev.ts,
      actorKind: prev.actorKind,
      actorId: prev.actorId,
      eventKind: prev.eventKind,
      resource: prev.resource,
      payload: prev.payload,
      prevHash: prev.prevHash,
      currHash: prev.expectedCurrHash,
    };
    const currRec: AuditRecord = {
      id: curr.id,
      tenantId: curr.tenantId,
      ts: curr.ts,
      actorKind: curr.actorKind,
      actorId: curr.actorId,
      eventKind: curr.eventKind,
      resource: curr.resource,
      payload: curr.payload,
      prevHash: curr.prevHash,
      currHash: curr.expectedCurrHash,
    };
    expect(verifyRecord(currRec, prevRec)).toEqual({ ok: true, scanned: 1 });
  });
});
