/**
 * PRJ-019 Clawbridge - Audit Log SHA-256 Hash Chain
 *
 * Source of truth: dev-security-w0-skeleton.md §5
 *                  supabase/migrations/20260503000002_audit_log.sql
 *                  docs/audit-canonical-spec.md  (canonical 仕様の正本)
 *
 * 設計:
 *   - chain genesis = '0' x 64
 *   - canonical payload =
 *       tenant_id | ts | actor_kind | actor_id | event_kind | resource | payload_json | prev_hash
 *   - DB トリガ (audit_log_compute_hash) と完全に同形のキャノニカル化を本ファイルでも提供 (verify 用)
 *   - canonical JSON 仕様は `docs/audit-canonical-spec.md` 参照 (RFC 8785 簡易版)
 *   - verify() は線形 scan、breakage 検出時は { ok:false, brokenAtId } を返す
 *
 * canonical drift 検知:
 *   - `fixtures/audit-canonical-vectors.json` を SQL/TS 双方が同じハッシュ生成することで担保
 *   - SQL 側: `supabase/tests/audit_hash_chain.test.sql` (pgTAP)
 *   - TS 側: `hash-chain.test.ts` (Vitest)
 */

import { createHash } from "node:crypto";

export interface AuditRecord {
  id: number;
  tenantId: string;
  ts: string; // ISO-8601 (Postgres timestamptz, microsecond 切り捨て / +00 表現で統一)
  actorKind: "owner" | "operator" | "open_claw" | "system" | "subprocess";
  actorId: string;
  eventKind: string;
  resource: string;
  payload: unknown;
  prevHash: string; // 64 hex
  currHash: string; // 64 hex
}

export const GENESIS_PREV_HASH = "0".repeat(64);

/**
 * canonical JSON serializer.
 *
 * RFC 8785 (JSON Canonicalization Scheme) の簡易版:
 *   - object key は UTF-16 codepoint 昇順
 *   - 配列は要素順を維持 (再帰)
 *   - number は最短表現 (Postgres jsonb 出力と一致)。NaN / Infinity は禁止 (throw)
 *   - string は JSON.stringify 経由で標準 JSON エスケープ
 *   - undefined はキー除外 (RFC 8259 準拠)
 *   - null はそのまま "null"
 *
 * Postgres jsonb との互換性:
 *   - jsonb は内部表現で key 重複排除 + ソート済みだが、`payload::text` 出力時の key 順は
 *     Postgres バージョン依存で不安定。よって SQL trigger 側でも同等の正規化が必要。
 *   - migration 20260503000002 の `audit_log_compute_hash` は payload を JSON 化してから
 *     `jsonb_canonical(payload)` 相当の処理に統一する (本 buffer 期で対応する想定)。
 */
export function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "null"; // top-level undefined は payload 欠落と同義扱い

  const t = typeof value;
  if (t === "boolean") return value ? "true" : "false";
  if (t === "number") {
    const n = value as number;
    if (!Number.isFinite(n)) {
      throw new Error(`canonicalJson: non-finite number not allowed (got ${String(n)})`);
    }
    // JS 既定の number → string で十分 (ECMAScript ToString(Number) は IEEE 754 短縮形)
    // Postgres の jsonb も同等 (numeric の最短表現)
    return String(n);
  }
  if (t === "string") return JSON.stringify(value);
  if (t === "bigint") {
    throw new Error("canonicalJson: bigint not supported");
  }

  if (Array.isArray(value)) {
    const parts = value.map((v) => canonicalJson(v));
    return `[${parts.join(",")}]`;
  }

  if (t === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj)
      .filter((k) => obj[k] !== undefined) // undefined キーは除外
      .sort(); // UTF-16 codepoint sort (default)
    const parts = keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`);
    return `{${parts.join(",")}}`;
  }

  throw new Error(`canonicalJson: unsupported type ${t}`);
}

/**
 * canonical 化。DB トリガ (audit_log_compute_hash) と完全に同形でなければならない。
 *  - 各フィールドを '|' で連結 (8 フィールド)
 *  - payload は canonicalJson() でキー順正規化
 *  - timestamp は ISO-8601 文字列 (caller 側で `2026-05-03T12:34:56.789000+00:00` 形式に揃える)
 *
 * canonical 形式の正本: docs/audit-canonical-spec.md
 */
export function canonicalize(rec: Omit<AuditRecord, "id" | "currHash">): string {
  const payloadCanonical =
    rec.payload === null || rec.payload === undefined ? "null" : canonicalJson(rec.payload);
  return [
    rec.tenantId,
    rec.ts,
    rec.actorKind,
    rec.actorId,
    rec.eventKind,
    rec.resource,
    payloadCanonical,
    rec.prevHash,
  ].join("|");
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function computeCurrHash(rec: Omit<AuditRecord, "id" | "currHash">): string {
  return sha256Hex(canonicalize(rec));
}

export interface VerifyResult {
  ok: boolean;
  scanned: number;
  brokenAtId?: number;
  reason?: string;
}

/**
 * 全 chain を線形 scan して整合性を検証。
 * - records は ORDER BY id ASC で渡される前提。
 * - 期待: records[0].prevHash === GENESIS_PREV_HASH
 *         records[i].prevHash === records[i-1].currHash
 *         records[i].currHash === computeCurrHash(records[i])
 */
export function verifyChain(records: AuditRecord[]): VerifyResult {
  if (records.length === 0) {
    return { ok: true, scanned: 0 };
  }

  const first = records[0];
  if (first === undefined) {
    return { ok: true, scanned: 0 };
  }
  if (first.prevHash !== GENESIS_PREV_HASH) {
    return {
      ok: false,
      scanned: 0,
      brokenAtId: first.id,
      reason: "first record prev_hash != genesis",
    };
  }

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (r === undefined) continue;
    const expected = computeCurrHash(r);
    if (r.currHash !== expected) {
      return {
        ok: false,
        scanned: i + 1,
        brokenAtId: r.id,
        reason: "curr_hash mismatch",
      };
    }
    if (i > 0) {
      const prev = records[i - 1];
      if (prev !== undefined && r.prevHash !== prev.currHash) {
        return {
          ok: false,
          scanned: i + 1,
          brokenAtId: r.id,
          reason: "prev_hash != previous curr_hash",
        };
      }
    }
  }

  return { ok: true, scanned: records.length };
}

/**
 * 単一レコードの hash を検証 (差分インクリメンタル検証用)。
 */
export function verifyRecord(rec: AuditRecord, prevRecord: AuditRecord | null): VerifyResult {
  const expectedPrev = prevRecord === null ? GENESIS_PREV_HASH : prevRecord.currHash;
  if (rec.prevHash !== expectedPrev) {
    return { ok: false, scanned: 1, brokenAtId: rec.id, reason: "prev_hash mismatch" };
  }
  const expected = computeCurrHash(rec);
  if (rec.currHash !== expected) {
    return { ok: false, scanned: 1, brokenAtId: rec.id, reason: "curr_hash mismatch" };
  }
  return { ok: true, scanned: 1 };
}

// =============================================================================
// P0-2 (review-scaffold-code-review-v1.md §3.1) 対応:
//   DB の `append_audit_log(p_tenant_id, ..., p_payload, p_canonical)` SECURITY DEFINER fn
//   に渡すための canonical 文字列を生成するための型 + helper。
//
//   prev_hash は DB 側で SELECT FOR UPDATE 後に確定するため、Node 側は prev_hash 抜きの
//   "partial canonical" を生成する責務しか持てない。よって本 helper は最終 canonical を
//   作るための「Node 側で確定可能なフィールドだけの canonical 部分」を返し、DB 側で
//   prev_hash を結合した上で SHA-256 計算する経路を取る。
//
//   ただし scaffold 期は p_canonical NULL を許容し、トリガ側 fallback (旧経路) も維持する。
//   完全な Node 主導 hash は Phase 1 W1 で「prev_hash を Node に往復させる API route」
//   実装後に有効化する。
// =============================================================================

/**
 * append_audit_log fn 引数として渡す partial canonical (prev_hash を除く 7 フィールド連結)。
 * DB 側で `<partial>|<prev_hash>` を SHA-256 にかけて curr_hash とする想定。
 *
 * NOTE: 本 helper は scaffold 期向け。Phase 1 W1 の API route 実装で正式採用する。
 */
export function canonicalizePartial(
  rec: Omit<AuditRecord, "id" | "currHash" | "prevHash">,
): string {
  const payloadCanonical =
    rec.payload === null || rec.payload === undefined ? "null" : canonicalJson(rec.payload);
  return [
    rec.tenantId,
    rec.ts,
    rec.actorKind,
    rec.actorId,
    rec.eventKind,
    rec.resource,
    payloadCanonical,
  ].join("|");
}

/**
 * append_audit_log fn 呼出ペイロード (p_canonical 含む完全版)。
 * prev_hash が判明している場合のみ呼び出し可能 (e.g. 単一トランザクション内で Node が
 * SELECT して直前 hash を取得済の場合、または genesis 投入時)。
 */
export function buildAppendAuditPayload(
  rec: Omit<AuditRecord, "id" | "currHash">,
): {
  tenantId: string;
  actorKind: AuditRecord["actorKind"];
  actorId: string;
  eventKind: string;
  resource: string;
  payload: unknown;
  canonical: string;
  expectedCurrHash: string;
} {
  const canonical = canonicalize(rec);
  const expectedCurrHash = sha256Hex(canonical);
  return {
    tenantId: rec.tenantId,
    actorKind: rec.actorKind,
    actorId: rec.actorId,
    eventKind: rec.eventKind,
    resource: rec.resource,
    payload: rec.payload,
    canonical,
    expectedCurrHash,
  };
}
