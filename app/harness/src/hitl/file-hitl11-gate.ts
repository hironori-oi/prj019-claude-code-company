/**
 * file-hitl11-gate — HITL 第 11 種 `knowledge_pii_review` の I/O 配線層
 * (Round 14 Dev-E 完遂、HITL gate-11 spec v1.0 準拠).
 *
 * 関連必須コントロール:
 *   HITL-11 (DEC-019-033 ⑪ — Owner-in-the-loop 16 項目のうち、PII review gate)
 *   KE-04   (本 gate は KE-04 redactor 検出結果を input とする)
 *   KE-02   (本 gate は KE-02 trigger 後段で発火する)
 *
 * spec 出典:
 *   `organization/rules/hitl-gate-11-pii-review-spec-v1.md` v1.0
 *
 * 設計方針:
 *   - 既存 `hitl-gate.ts` の `HitlActionType` に 'knowledge_pii_review' を追加せず、
 *     **専用 I/O gate** として独立実装 (既存 hitl-gate 無改変原則維持).
 *   - knowledge/hitl-11-knowledge-pii.ts (Round 13 Dev-E) の **pure decision evaluator**
 *     を組み込み、polling / webhook receive / approval state machine を本書で配線.
 *   - approval state は polling (file-based) を一次経路、webhook receive (Slack quick-action)
 *     を補助経路として両対応 (spec §4 + §5).
 *   - audit-store 連動は Task D (KE-04 redactor + audit append) と分離、本書は **gate decision の audit append のみ**
 *     実施 (Knowledge agent / orchestrator が caller).
 *
 * approval state machine:
 *
 *   pending --[approve webhook|approve file]--> approved
 *   pending --[reject  webhook|reject  file]--> rejected
 *   pending --[partial webhook|partial file]--> partial
 *   pending --[timeout: SLA exceeded]------> timed_out (auto autoEvaluate)
 *
 * file 配置:
 *   ~/.clawbridge/hitl11/<gate_id>.json           (request)
 *   ~/.clawbridge/hitl11/<gate_id>.approve        (decision: approve)
 *   ~/.clawbridge/hitl11/<gate_id>.reject         (decision: reject + reason)
 *   ~/.clawbridge/hitl11/<gate_id>.partial        (decision: partial + actions)
 *   ~/.clawbridge/hitl11/audit-hitl11.json        (audit log; gate decision append)
 *
 * webhook receive:
 *   `receiveWebhookDecision(payload)` を Slack quick-action 受領 endpoint から呼び出し、
 *   nonce + expiresAt 検証を経て pending file を decision file 化する.
 */
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  applyReviewerActions,
  autoEvaluate,
  formatHitl11Summary,
  type Hitl11Decision,
  type Hitl11ReviewResult,
} from '../knowledge/hitl-11-knowledge-pii.js'
import type { KnowledgeDraft } from '../knowledge/ke-02-trigger.js'
import { CLAWBRIDGE_ROOT } from '../paths.js'
import { ensureDirSelf, fileExists, loadJson, saveJson } from '../fs-store.js'

// ============================================================================
// 型
// ============================================================================

/** gate-11 file 配置 root (default: ~/.clawbridge/hitl11/). */
export const HITL11_PENDING_DIR = join(CLAWBRIDGE_ROOT, 'hitl11')

export type Hitl11WebhookKind =
  | 'knowledge_pii_review_approve'
  | 'knowledge_pii_review_reject'
  | 'knowledge_pii_review_partial'

/** Slack quick-action 受領 payload (spec §4.2 簡略版). */
export interface Hitl11WebhookPayload {
  readonly kind: Hitl11WebhookKind
  readonly gate_id: string
  readonly target_file: string
  readonly nonce: string
  readonly issuedAt: string
  readonly expiresAt: string
  /** reject 時必須 */
  readonly reject_reason?: string
  /** partial 時必須 */
  readonly partial_redact_terms?: ReadonlyArray<string>
  readonly keep_terms?: ReadonlyArray<string>
}

/** 1 件の review request (file 永続化). */
export interface Hitl11Request {
  readonly gate_id: string
  readonly drafts: ReadonlyArray<KnowledgeDraft>
  readonly target_file: string
  readonly issuedAt: string
  readonly expiresAt: string
  readonly nonce: string
}

export interface Hitl11AuditEntry {
  readonly gate_id: string
  readonly target_file: string
  readonly decision: Hitl11Decision | 'timed_out' | 'webhook_invalid'
  readonly summary: string
  readonly decidedAt: string
  readonly reviewer?: string
  readonly reject_reason?: string
}

interface Hitl11AuditFile {
  entries: Hitl11AuditEntry[]
}

export interface Hitl11RequestResult {
  readonly result: Hitl11ReviewResult
  /** decision が file polling / webhook / timeout のどれで決まったか */
  readonly source: 'file' | 'webhook' | 'timeout'
  readonly gate_id: string
  readonly decidedAt: string
}

export type Hitl11WebhookValidationError =
  | 'unknown_gate'
  | 'nonce_mismatch'
  | 'expired'
  | 'kind_mismatch'
  | 'missing_reason'
  | 'missing_terms'

export interface Hitl11GateOptions {
  /** pending dir 上書き (test 用). */
  readonly pendingDir?: string
  /** polling 間隔 (ms). default 5000. */
  readonly pollIntervalMs?: number
  /** SLA timeout (ms). default 4 日 (Owner formal sign-off, spec §4.3). */
  readonly timeoutMs?: number
  /** 注入用. */
  readonly now?: () => Date
  /** audit log path 上書き. */
  readonly auditPath?: string
}

// ============================================================================
// FileHitl11Gate 本体
// ============================================================================

const DEFAULT_TIMEOUT_MS = 4 * 24 * 60 * 60 * 1000 // 4 日

export class FileHitl11Gate {
  private readonly pendingDir: string
  private readonly pollIntervalMs: number
  private readonly timeoutMs: number
  private readonly now: () => Date
  private readonly auditPath: string
  /** in-memory pending registry (webhook lookup 用). */
  private readonly pending = new Map<string, Hitl11Request>()

  constructor(opts: Hitl11GateOptions = {}) {
    this.pendingDir = opts.pendingDir ?? HITL11_PENDING_DIR
    this.pollIntervalMs = opts.pollIntervalMs ?? 5000
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.now = opts.now ?? (() => new Date())
    this.auditPath = opts.auditPath ?? join(this.pendingDir, 'audit-hitl11.json')
  }

  /**
   * requestReview — review request を file 化 + decision 待機 (polling).
   *
   * 戻り値: webhook / file decision / timeout のいずれかで確定した
   * Hitl11ReviewResult.
   */
  async requestReview(args: {
    drafts: ReadonlyArray<KnowledgeDraft>
    target_file: string
    prjId: string
  }): Promise<Hitl11RequestResult> {
    await ensureDirSelf(this.pendingDir)
    const gate_id = `GATE-11-${randomUUID().toUpperCase()}`
    const issuedAt = this.now().toISOString()
    const expiresAt = new Date(this.now().getTime() + this.timeoutMs).toISOString()
    const nonce = randomUUID().replace(/-/g, '').slice(0, 16)

    const request: Hitl11Request = {
      gate_id,
      drafts: args.drafts,
      target_file: args.target_file,
      issuedAt,
      expiresAt,
      nonce,
    }
    this.pending.set(gate_id, request)
    await fs.writeFile(
      this.requestPath(gate_id),
      JSON.stringify(request, null, 2),
      'utf-8',
    )

    const startMs = this.now().getTime()
    while (true) {
      const elapsed = this.now().getTime() - startMs
      if (elapsed >= this.timeoutMs) {
        // timeout: autoEvaluate fallback (spec §4.3 deadline 超過 → CEO escalation
        // ここでは Round 14 では autoEvaluate を採用、CEO escalation hook は Round 15 引継).
        const result = autoEvaluate(args.drafts)
        const decidedAt = this.now().toISOString()
        await this.appendAudit({
          gate_id,
          target_file: args.target_file,
          decision: 'timed_out',
          summary: formatHitl11Summary(result, args.prjId) + ' (timed_out)',
          decidedAt,
        })
        await this.cleanup(gate_id)
        return Object.freeze({ result, source: 'timeout', gate_id, decidedAt })
      }

      // file decision check
      const decision = await this.readDecisionFile(gate_id)
      if (decision !== null) {
        // decision file の `kind` を **権威的** に採用 (actions 未指定の reject 等で
        // applyReviewerActions が autoEvaluate fallback して partial_redact になる
        // 問題を防ぐ; spec §4.2 整合).
        const effectiveActions: ReadonlyArray<'accept' | 'redact_more' | 'discard'> | undefined =
          decision.actions ?? this.deriveDefaultActionsFromKind(decision.kind, args.drafts)
        const result = applyReviewerActions({
          drafts: args.drafts,
          reviewerActions: effectiveActions,
          ...(decision.comment !== undefined ? { comment: decision.comment } : {}),
        })
        const decidedAt = this.now().toISOString()
        await this.appendAudit({
          gate_id,
          target_file: args.target_file,
          decision: result.decision,
          summary: formatHitl11Summary(result, args.prjId),
          decidedAt,
          ...(decision.reviewer !== undefined && { reviewer: decision.reviewer }),
          ...(decision.reject_reason !== undefined && {
            reject_reason: decision.reject_reason,
          }),
        })
        await this.cleanup(gate_id)
        return Object.freeze({ result, source: 'file', gate_id, decidedAt })
      }

      await sleep(this.pollIntervalMs)
    }
  }

  /**
   * receiveWebhookDecision — Slack quick-action endpoint から呼ばれる.
   * 妥当な payload なら decision file を作成し、polling loop が pickup する.
   */
  async receiveWebhookDecision(
    payload: Hitl11WebhookPayload,
    opts: { reviewer?: string } = {},
  ): Promise<{ ok: true } | { ok: false; error: Hitl11WebhookValidationError }> {
    const req = this.pending.get(payload.gate_id)
    if (!req) {
      // gate_id 未登録 (process restart 後 in-memory map 喪失) でも file が残っていれば検証可能
      const persisted = await this.loadRequest(payload.gate_id)
      if (!persisted) return { ok: false, error: 'unknown_gate' }
      this.pending.set(payload.gate_id, persisted)
      return this.receiveWebhookDecision(payload, opts)
    }
    if (req.nonce !== payload.nonce) return { ok: false, error: 'nonce_mismatch' }
    if (this.now().getTime() > Date.parse(req.expiresAt)) {
      return { ok: false, error: 'expired' }
    }
    // kind ↔ field consistency
    if (payload.kind === 'knowledge_pii_review_reject') {
      if (!payload.reject_reason || payload.reject_reason.length === 0) {
        return { ok: false, error: 'missing_reason' }
      }
    }
    if (payload.kind === 'knowledge_pii_review_partial') {
      if (
        !payload.partial_redact_terms ||
        payload.partial_redact_terms.length === 0
      ) {
        return { ok: false, error: 'missing_terms' }
      }
    }

    const actions = this.deriveActionsFromWebhook(payload, req)
    const decisionFile: Hitl11DecisionFile = {
      kind: payload.kind,
      actions,
      ...(opts.reviewer !== undefined && { reviewer: opts.reviewer }),
      ...(payload.reject_reason !== undefined && {
        reject_reason: payload.reject_reason,
      }),
      receivedAt: this.now().toISOString(),
    }
    await fs.writeFile(
      this.decisionPath(payload.gate_id, payload.kind),
      JSON.stringify(decisionFile, null, 2),
      'utf-8',
    )
    return { ok: true }
  }

  /** test/CLI 用: file decision を直接書き込む. */
  async decideViaFile(
    gate_id: string,
    decision: Hitl11Decision,
    args: {
      actions?: ReadonlyArray<'accept' | 'redact_more' | 'discard'>
      reviewer?: string
      reject_reason?: string
      comment?: string
    } = {},
  ): Promise<void> {
    await ensureDirSelf(this.pendingDir)
    const kind: Hitl11WebhookKind =
      decision === 'approve'
        ? 'knowledge_pii_review_approve'
        : decision === 'reject'
          ? 'knowledge_pii_review_reject'
          : 'knowledge_pii_review_partial'
    const decisionFile: Hitl11DecisionFile = {
      kind,
      ...(args.actions !== undefined && { actions: args.actions }),
      ...(args.reviewer !== undefined && { reviewer: args.reviewer }),
      ...(args.reject_reason !== undefined && { reject_reason: args.reject_reason }),
      ...(args.comment !== undefined && { comment: args.comment }),
      receivedAt: this.now().toISOString(),
    }
    await fs.writeFile(
      this.decisionPath(gate_id, kind),
      JSON.stringify(decisionFile, null, 2),
      'utf-8',
    )
  }

  /** pending request の gate_id 一覧 (file system 由来). */
  async listPending(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.pendingDir)
      return files
        .filter((f) => f.endsWith('.json') && !f.startsWith('audit-'))
        .map((f) => f.replace(/\.json$/, ''))
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
      throw err
    }
  }

  /** audit log を読込 (test / dashboard 用). */
  async listAudit(): Promise<ReadonlyArray<Hitl11AuditEntry>> {
    const log = await loadJson<Hitl11AuditFile>(this.auditPath, { entries: [] })
    return Object.freeze(log.entries.slice())
  }

  // ============================================================================
  // private helpers
  // ============================================================================

  private requestPath(gate_id: string): string {
    return join(this.pendingDir, `${gate_id}.json`)
  }

  private decisionPath(gate_id: string, kind: Hitl11WebhookKind): string {
    const suffix =
      kind === 'knowledge_pii_review_approve'
        ? 'approve'
        : kind === 'knowledge_pii_review_reject'
          ? 'reject'
          : 'partial'
    return join(this.pendingDir, `${gate_id}.${suffix}`)
  }

  private async readDecisionFile(
    gate_id: string,
  ): Promise<Hitl11DecisionFile | null> {
    for (const suffix of ['approve', 'reject', 'partial'] as const) {
      const path = join(this.pendingDir, `${gate_id}.${suffix}`)
      if (await fileExists(path)) {
        try {
          const content = await fs.readFile(path, 'utf-8')
          return JSON.parse(content) as Hitl11DecisionFile
        } catch {
          return null
        }
      }
    }
    return null
  }

  private async loadRequest(gate_id: string): Promise<Hitl11Request | null> {
    const path = this.requestPath(gate_id)
    if (!(await fileExists(path))) return null
    try {
      const content = await fs.readFile(path, 'utf-8')
      return JSON.parse(content) as Hitl11Request
    } catch {
      return null
    }
  }

  private deriveActionsFromWebhook(
    payload: Hitl11WebhookPayload,
    req: Hitl11Request,
  ): ReadonlyArray<'accept' | 'redact_more' | 'discard'> {
    if (payload.kind === 'knowledge_pii_review_approve') {
      return Object.freeze(req.drafts.map(() => 'accept' as const))
    }
    if (payload.kind === 'knowledge_pii_review_reject') {
      return Object.freeze(req.drafts.map(() => 'discard' as const))
    }
    // partial: PII あり draft は redact_more, PII なしは accept.
    return Object.freeze(
      req.drafts.map((d) => (d.piiHitCount === 0 ? 'accept' : 'redact_more')),
    )
  }

  /**
   * deriveDefaultActionsFromKind — decision file の actions が未指定の場合の
   * default action 列を kind から導出する.
   *
   * - approve  → 全 entry accept
   * - reject   → 全 entry discard
   * - partial  → PII なし accept / PII あり redact_more (default policy)
   */
  private deriveDefaultActionsFromKind(
    kind: Hitl11WebhookKind,
    drafts: ReadonlyArray<KnowledgeDraft>,
  ): ReadonlyArray<'accept' | 'redact_more' | 'discard'> {
    if (kind === 'knowledge_pii_review_approve') {
      return Object.freeze(drafts.map(() => 'accept' as const))
    }
    if (kind === 'knowledge_pii_review_reject') {
      return Object.freeze(drafts.map(() => 'discard' as const))
    }
    return Object.freeze(
      drafts.map((d) => (d.piiHitCount === 0 ? 'accept' : 'redact_more')),
    )
  }

  private async appendAudit(entry: Hitl11AuditEntry): Promise<void> {
    const log = await loadJson<Hitl11AuditFile>(this.auditPath, { entries: [] })
    log.entries.push(entry)
    await saveJson(this.auditPath, log)
  }

  private async cleanup(gate_id: string): Promise<void> {
    this.pending.delete(gate_id)
    const targets = [
      this.requestPath(gate_id),
      join(this.pendingDir, `${gate_id}.approve`),
      join(this.pendingDir, `${gate_id}.reject`),
      join(this.pendingDir, `${gate_id}.partial`),
    ]
    for (const t of targets) {
      try {
        await fs.unlink(t)
      } catch {
        // ignore
      }
    }
  }
}

interface Hitl11DecisionFile {
  kind: Hitl11WebhookKind
  actions?: ReadonlyArray<'accept' | 'redact_more' | 'discard'>
  reviewer?: string
  reject_reason?: string
  comment?: string
  receivedAt: string
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
