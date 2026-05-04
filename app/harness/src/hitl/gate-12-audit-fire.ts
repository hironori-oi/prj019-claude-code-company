/**
 * hitl/gate-12-audit-fire — Round 15 Dev-M 着地 (M-1):
 *   gate-12 (cli_version_update_approval) を HITL バスに発火させると同時に、
 *   AuditLogStore (SHA-256 hash chain) に「fire request」と「decision」の 2 entry を
 *   append する統合 helper。
 *
 * 関連:
 *   - hitl/gate-12-cli-version-update.ts (Round 14 Dev-D 着地、純関数 + adapter)
 *   - audit-store.ts (Round 11/12 G-10 着地、SHA-256 hash chain)
 *   - DEC-019-007 (副作用ゼロ要件 — 本 module の append は AuditLogStore 注入経由のみ)
 *   - DEC-019-018 (HITL gate SOP — gate-12 は同 SOP に準拠、24h timeout default reject)
 *   - DEC-019-051 (subscription-driven 中核 / version 不一致時の dry-run fallback)
 *   - G-09 / G-10 (HITL gate enforcement の audit 連携 + 90 日 retention)
 *
 * 設計方針:
 *   - **既存 gate-12 / hitl-gate / audit-store は無改変**: 本 module は append-only SOP
 *     (DEC-019-025) に従って 3 layer を糊付けするだけの adapter.
 *   - **chain integrity 保証**: AuditLogStore.append が線形化されているため、本 helper も
 *     同一 store instance に逐次 append すれば chain が壊れない. 本 helper は append 前後
 *     で verifyHashChain を呼び出す optional check (default off, test 用).
 *   - **2 entry 設計**: fire 発火 (`hitl_decision` type, payload.kind='gate_12_fire')、
 *     decision 確定 (`hitl_decision` type, payload.kind='gate_12_decision') を分離 append.
 *     fire-only の状態 (timeout 前) でも audit に痕跡が残る.
 *   - **副作用 0 (DI 経由)**: hitl / audit を caller が注入. 本 module は store factory を
 *     提供しない.
 *   - **PII 抑制**: payload.message / title 等は base64 化せず保存するが、
 *     redaction は caller (orchestrator) 側で済ませる前提 (gate-11 と同方針).
 */
import type { AuditAppendResult, AuditLogStore } from '@clawbridge/audit'
import type { HitlGate } from '../hitl-gate.js'
import {
  fireGate12HitlGate,
  Gate12RequestSchema,
  type Gate12Decision,
  type Gate12Request,
} from './gate-12-cli-version-update.js'

// ============================================================================
// 型
// ============================================================================

export type Gate12FirePhase = 'fire' | 'decision'

export interface Gate12AuditFireOptions {
  /** harness の HitlGate (FileHitlGate を渡す想定、test では mock 可). */
  readonly hitl: HitlGate
  /** audit-store (FileAuditLogStore を渡す想定、test では InMemoryMockAuditLogStore 可). */
  readonly audit: AuditLogStore
  /** gate-12 fire 入力 (auto-update-hitl.buildCliVersionUpdateHitlRequest 等の出力). */
  readonly request: Gate12Request
  /** ISO 時刻取得 hook (default: () => new Date().toISOString()). */
  readonly nowIso?: () => string
  /**
   * append 前後に verifyHashChain を実行し、chain 破壊を検出したら throw する.
   * default = false (production では heavy なので test 用).
   */
  readonly verifyChain?: boolean
  /**
   * audit append の payload に追加する任意 metadata (caller-side context, prj_id 等).
   */
  readonly extraPayload?: Readonly<Record<string, unknown>>
}

export interface Gate12AuditFireResult {
  readonly decision: Gate12Decision
  readonly fireAuditEntry: AuditAppendResult
  readonly decisionAuditEntry: AuditAppendResult
  /** 発火と決定の prevHash → hash 連鎖を caller が再検証できるよう公開. */
  readonly chainSnapshot: {
    readonly fireHash: string
    readonly decisionHash: string
  }
}

export class Gate12ChainIntegrityError extends Error {
  override readonly name = 'Gate12ChainIntegrityError'
  readonly phase: Gate12FirePhase
  readonly brokenAt: number | null
  constructor(phase: Gate12FirePhase, brokenAt: number | null, message: string) {
    super(message)
    this.phase = phase
    this.brokenAt = brokenAt
  }
}

// ============================================================================
// 純関数: payload builder
// ============================================================================

/**
 * fire 発火 entry 用 payload を生成する純関数.
 * - kind = 'gate_12_fire'
 * - request の outcome / risk / suggestedApproveAction / rejectAction を埋め込む.
 * - extraPayload は caller 側 context (prj_id 等) を上書きせず merge する.
 */
export function buildGate12FireAuditPayload(
  request: Gate12Request,
  extraPayload?: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const validated = Gate12RequestSchema.parse(request)
  const base: Record<string, unknown> = {
    kind: 'gate_12_fire',
    gate_type: validated.type,
    title: validated.title,
    risk: validated.risk,
    outcome: validated.outcome,
    suggestedApproveAction: validated.suggestedApproveAction,
    rejectAction: validated.rejectAction,
  }
  if (validated.payload !== undefined) {
    base['requestPayload'] = validated.payload
  }
  if (extraPayload !== undefined) {
    for (const [k, v] of Object.entries(extraPayload)) {
      // caller 側 metadata は base の core key を上書きしない (= reserved key 保護).
      if (!(k in base)) base[k] = v
    }
  }
  return base
}

/**
 * decision 確定 entry 用 payload を生成する純関数.
 * - kind = 'gate_12_decision'
 * - decision の決定軸 (approve / reject / defer) と action enum を埋め込む.
 */
export function buildGate12DecisionAuditPayload(
  request: Gate12Request,
  decision: Gate12Decision,
  extraPayload?: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const validated = Gate12RequestSchema.parse(request)
  const base: Record<string, unknown> = {
    kind: 'gate_12_decision',
    gate_type: validated.type,
    outcome: validated.outcome,
    decision: decision.decision,
    decidedAt: decision.decidedAt,
  }
  if (decision.decision === 'approve') {
    base['approveAction'] = decision.approveAction
  } else if (decision.decision === 'reject') {
    base['rejectAction'] = decision.rejectAction
  } else {
    base['deferAction'] = decision.deferAction
  }
  if (decision.approver !== undefined) base['approver'] = decision.approver
  if (decision.comment !== undefined) base['comment'] = decision.comment
  if (extraPayload !== undefined) {
    for (const [k, v] of Object.entries(extraPayload)) {
      if (!(k in base)) base[k] = v
    }
  }
  return base
}

// ============================================================================
// 統合 fire helper
// ============================================================================

/**
 * gate-12 を発火 + audit log に request + decision の 2 entry を append する統合 helper.
 *
 * フロー:
 *   1. fire entry を append (発火を audit に観測可能にする)
 *   2. opts.verifyChain=true の場合は chain 整合を検証
 *   3. fireGate12HitlGate を呼んで Owner / CEO の判断を待つ (24h timeout default)
 *   4. decision entry を append
 *   5. opts.verifyChain=true の場合は再度 chain 整合を検証
 *
 * 副作用は AuditLogStore.append + HitlGate.requestApproval のみで、すべて DI 経由.
 *
 * 注意:
 *   - fire entry append 後に hitl が throw した場合、audit には fire のみ残る (= timeout 等
 *     と区別がつく). caller 側が graceful shutdown 経路に進むことを推奨.
 *   - opts.verifyChain=true は production では重い (全件再 hash) ため test 専用想定.
 */
export async function fireGate12WithAudit(
  opts: Gate12AuditFireOptions,
): Promise<Gate12AuditFireResult> {
  const validated = Gate12RequestSchema.parse(opts.request)

  // 1. fire entry を append
  const firePayload = buildGate12FireAuditPayload(validated, opts.extraPayload)
  const fireAppend = await opts.audit.append({
    type: 'hitl_decision',
    source: 'harness',
    payload: firePayload,
    ...(opts.nowIso !== undefined && { ts: opts.nowIso() }),
  })

  // 2. (optional) chain integrity check
  if (opts.verifyChain === true) {
    const v = await opts.audit.verifyHashChain()
    if (!v.valid) {
      throw new Gate12ChainIntegrityError(
        'fire',
        v.brokenAt,
        `gate-12 audit chain broken after fire entry id=${fireAppend.id} (brokenAt=${v.brokenAt})`,
      )
    }
  }

  // 3. HITL gate を発火 (24h timeout default, FileHitlGate)
  const decision = await fireGate12HitlGate({
    hitl: opts.hitl,
    request: validated,
  })

  // 4. decision entry を append
  const decisionPayload = buildGate12DecisionAuditPayload(
    validated,
    decision,
    opts.extraPayload,
  )
  const decisionAppend = await opts.audit.append({
    type: 'hitl_decision',
    source: 'harness',
    payload: decisionPayload,
    ...(opts.nowIso !== undefined && { ts: opts.nowIso() }),
  })

  // 5. (optional) chain integrity 再検証
  if (opts.verifyChain === true) {
    const v = await opts.audit.verifyHashChain()
    if (!v.valid) {
      throw new Gate12ChainIntegrityError(
        'decision',
        v.brokenAt,
        `gate-12 audit chain broken after decision entry id=${decisionAppend.id} (brokenAt=${v.brokenAt})`,
      )
    }
  }

  return {
    decision,
    fireAuditEntry: fireAppend,
    decisionAuditEntry: decisionAppend,
    chainSnapshot: {
      fireHash: fireAppend.hash,
      decisionHash: decisionAppend.hash,
    },
  }
}
