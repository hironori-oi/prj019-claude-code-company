/**
 * KE-04 PII redactor ↔ audit-store append 配線 (Round 14 Dev-E 完遂、Task D).
 *
 * 関連必須コントロール:
 *   KE-04 (DEC-019-033 ⑪ — Owner-in-the-loop 16 項目のうち、PII redaction 軸)
 *   G-09  (HITL gate enforcement の audit 連携 / append-only 監査ログ)
 *   G-10  (90 日 retention + SHA-256 hash chain)
 *
 * 設計方針:
 *   - 既存 `audit-store.ts` を改変せず、**ラッパー** として redact 強制層を提供.
 *   - audit-store.append の **前段** に KE-04 redactor を強制起動、PII 含む payload は
 *     placeholder 化してから hash chain に append (改ざん検出層を破らない).
 *   - 副作用なし設計を維持: redaction は pure function、append のみ caller (audit-store).
 *   - `payload` 内の string field を **再帰的に** redact (nested object / array 対応).
 *
 * 利用例:
 *
 *   import { FileAuditLogStore } from '@clawbridge/audit'
 *   import { wrapAuditStoreWithRedaction } from '@clawbridge/harness'
 *
 *   const raw = new FileAuditLogStore({...})
 *   const safe = wrapAuditStoreWithRedaction(raw)  // KE-04 強制
 *   await safe.append({type: 'hitl_decision', source: 'harness', payload: {note: 'sk-ant-...' }})
 *   // -> hash chain には placeholder <ANTHROPIC_KEY> で append される
 */
import type {
  AuditAppendResult,
  AuditEvent,
  AuditEventInput,
  AuditLogStore,
  AuditQuery,
  AuditVerifyResult,
} from '@clawbridge/audit'
import { redactPii, type PiiCategory, type PiiHit } from './ke-04-pii-redaction.js'

// ============================================================================
// 型
// ============================================================================

export interface RedactionAuditOptions {
  /** redact 対象から除外するカテゴリ. */
  readonly skip?: ReadonlySet<PiiCategory>
  /** 末尾 N 文字保持 (audit fingerprint 用、既定 0). */
  readonly keepLastN?: number
  /** redaction summary を payload に追加するか (既定 true). */
  readonly attachSummary?: boolean
  /** 監査ログ append 失敗時の error log. */
  readonly onError?: (where: string, err: unknown) => void
}

export interface RedactionAppendResult extends AuditAppendResult {
  /** 当 append 時に検出された PII hit 件数. */
  readonly redactedHits: number
}

/**
 * RedactingAuditLogStore — 既存 AuditLogStore を実装する pass-through wrapper.
 * append() の前段で KE-04 redactor を必ず通す.
 */
export interface RedactingAuditLogStore extends AuditLogStore {
  /** redaction 件数を含む拡張 result を返す API (元 AuditLogStore.append 互換). */
  appendWithRedactionInfo(event: AuditEventInput): Promise<RedactionAppendResult>
}

// ============================================================================
// 実装
// ============================================================================

/**
 * wrapAuditStoreWithRedaction — KE-04 redactor を audit-store の前段に配線.
 *
 * 注: 元 store の hash chain integrity は維持される (redact 後 payload で hash 計算).
 */
export function wrapAuditStoreWithRedaction(
  store: AuditLogStore,
  opts: RedactionAuditOptions = {},
): RedactingAuditLogStore {
  const skip = opts.skip
  const keepLastN = opts.keepLastN ?? 0
  const attachSummary = opts.attachSummary ?? true

  async function appendCore(
    event: AuditEventInput,
  ): Promise<{ result: AuditAppendResult; hits: number }> {
    const hits: PiiHit[] = []
    const redactedPayload = redactDeep(event.payload, hits, { skip, keepLastN })
    // R30 Dev-III forward-only fix: redactDeep 戻り値は unknown のため、object spread 前に
    // narrow する。event.payload が plain object であることは AuditEventInput 契約で保証され、
    // redactDeep は plain object → plain object (Record<string, unknown>) を返す再帰実装
    // (line 162-171 参照) のため、type guard で安全に narrow できる。
    const redactedRecord: Record<string, unknown> =
      redactedPayload !== null &&
      typeof redactedPayload === 'object' &&
      !Array.isArray(redactedPayload)
        ? (redactedPayload as Record<string, unknown>)
        : {}
    const finalPayload: Record<string, unknown> = { ...redactedRecord }
    if (attachSummary && hits.length > 0) {
      finalPayload['_pii_redacted'] = {
        hit_count: hits.length,
        categories: tallyCategories(hits),
      }
    }
    try {
      const result = await store.append({
        type: event.type,
        source: event.source,
        payload: finalPayload,
        ...(event.ts !== undefined ? { ts: event.ts } : {}),
      })
      return { result, hits: hits.length }
    } catch (err) {
      opts.onError?.('append', err)
      throw err
    }
  }

  return {
    async append(event: AuditEventInput): Promise<AuditAppendResult> {
      const { result } = await appendCore(event)
      return result
    },
    async appendWithRedactionInfo(
      event: AuditEventInput,
    ): Promise<RedactionAppendResult> {
      const { result, hits } = await appendCore(event)
      return Object.freeze({
        id: result.id,
        hash: result.hash,
        redactedHits: hits,
      })
    },
    list(query?: AuditQuery): Promise<AuditEvent[]> {
      return store.list(query)
    },
    verifyHashChain(): Promise<AuditVerifyResult> {
      return store.verifyHashChain()
    },
    rotate(): Promise<number> {
      return store.rotate()
    },
  }
}

// ============================================================================
// helpers
// ============================================================================

/**
 * redactDeep — payload 内の string field を再帰的に redact.
 *
 * - string         → redactPii で placeholder 化、hits を集約
 * - array          → 各要素を再帰
 * - plain object   → 各 value を再帰
 * - 数値 / boolean / null → そのまま
 *
 * pure function (副作用なし).
 */
function redactDeep(
  value: unknown,
  collectedHits: PiiHit[],
  opts: { skip?: ReadonlySet<PiiCategory>; keepLastN: number },
): unknown {
  if (typeof value === 'string') {
    const r = redactPii(value, {
      ...(opts.skip !== undefined ? { skip: opts.skip } : {}),
      keepLastN: opts.keepLastN,
    })
    for (const h of r.hits) collectedHits.push(h)
    return r.redacted
  }
  if (Array.isArray(value)) {
    return value.map((v) => redactDeep(v, collectedHits, opts))
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redactDeep(v, collectedHits, opts)
    }
    return out
  }
  return value
}

function tallyCategories(hits: ReadonlyArray<PiiHit>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const h of hits) {
    out[h.category] = (out[h.category] ?? 0) + 1
  }
  return out
}

/**
 * Convenience: payload を redact だけして audit-store.append には渡さない pure 版.
 *
 * orchestrator が rotation policy を独自管理したい場合の hook.
 */
export function redactPayloadDeep(
  payload: Record<string, unknown>,
  opts: RedactionAuditOptions = {},
): { redacted: Record<string, unknown>; hits: ReadonlyArray<PiiHit> } {
  const hits: PiiHit[] = []
  const redacted = redactDeep(payload, hits, {
    ...(opts.skip !== undefined ? { skip: opts.skip } : {}),
    keepLastN: opts.keepLastN ?? 0,
  }) as Record<string, unknown>
  return { redacted, hits: Object.freeze(hits.slice()) }
}
