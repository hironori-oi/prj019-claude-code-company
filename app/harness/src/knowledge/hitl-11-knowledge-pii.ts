/**
 * HITL-11 ナレッジ PII レビュー gate (Round 13 Dev-E 前倒し).
 *
 * 関連必須コントロール:
 *   HITL-11 (DEC-019-033 ⑪ — Owner-in-the-loop 16 項目のうち、人間チェック gate 軸)
 *   KE-04 (本 gate は KE-04 redactor の検出結果を input とする)
 *   KE-02 (本 gate は KE-02 trigger 後段で発火する)
 *
 * 設計方針:
 *   - 既存 hitl-gate.ts の HitlActionType に 'knowledge_pii_review' を追加せず、
 *     **専用 gate decision evaluator** を本書で提供 (既存 hitl-gate 無改変原則).
 *   - 本書は **pure decision function** を主成分とし、polling / file I/O は
 *     上位 orchestrator が担う (既存 FileHitlGate と同パターン).
 *   - decision: approve / reject / partial_redact / escalate の 4 状態.
 *
 * 4 決定種別:
 *   - approve         : 全 entry を redact 済 body のまま採用 (PII 検出ゼロ or 既に十分 redact).
 *   - reject          : 全 entry を破棄 (PII 量過大 or 機密性極端).
 *   - partial_redact  : 一部 entry のみ採用、残りは追加 redact 後 re-review.
 *   - escalate        : Owner / CEO 判断必須 (確信度低、複雑な案件).
 */
import type { KnowledgeDraft } from './ke-02-trigger.js'

// ============================================================================
// 型
// ============================================================================

export type Hitl11Decision = 'approve' | 'reject' | 'partial_redact' | 'escalate'

export interface Hitl11ReviewInput {
  readonly drafts: ReadonlyArray<KnowledgeDraft>
  /** Reviewer が個別 entry に対して付ける action (index 順). */
  readonly reviewerActions?: ReadonlyArray<'accept' | 'redact_more' | 'discard'>
  /** Reviewer の自由 comment (audit log に保存). */
  readonly comment?: string
}

export interface Hitl11ReviewResult {
  readonly decision: Hitl11Decision
  readonly acceptedDrafts: ReadonlyArray<KnowledgeDraft>
  readonly rejectedDrafts: ReadonlyArray<KnowledgeDraft>
  readonly redactMoreDrafts: ReadonlyArray<KnowledgeDraft>
  readonly summary: string
}

// ============================================================================
// 自動判定 (reviewer 不在時 default)
// ============================================================================

/** PII 件数による「自動 escalate 閾値」(>= で escalate). */
export const HITL11_AUTO_ESCALATE_THRESHOLD = 5

/** PII 件数による「自動 reject 閾値」(>= で reject). */
export const HITL11_AUTO_REJECT_THRESHOLD = 20

/**
 * autoEvaluate — reviewer 不在 / SLA 超過時の default 評価 (純関数).
 *
 * 規則:
 *   - 全 entry の piiHitCount === 0 → approve
 *   - 1 件以上 entry が >= REJECT_THRESHOLD → reject
 *   - 1 件以上 entry が >= ESCALATE_THRESHOLD → escalate
 *   - 一部 entry に PII あり (上記閾値未満) → partial_redact
 */
export function autoEvaluate(drafts: ReadonlyArray<KnowledgeDraft>): Hitl11ReviewResult {
  if (drafts.length === 0) {
    return Object.freeze({
      decision: 'approve',
      acceptedDrafts: Object.freeze([]),
      rejectedDrafts: Object.freeze([]),
      redactMoreDrafts: Object.freeze([]),
      summary: 'no drafts',
    })
  }

  let maxPii = 0
  let totalPii = 0
  let anyPii = false
  for (const d of drafts) {
    if (d.piiHitCount > maxPii) maxPii = d.piiHitCount
    totalPii += d.piiHitCount
    if (d.piiHitCount > 0) anyPii = true
  }

  if (!anyPii) {
    return Object.freeze({
      decision: 'approve',
      acceptedDrafts: Object.freeze(drafts.slice()),
      rejectedDrafts: Object.freeze([]),
      redactMoreDrafts: Object.freeze([]),
      summary: `auto-approve: ${drafts.length} drafts, 0 PII`,
    })
  }

  if (maxPii >= HITL11_AUTO_REJECT_THRESHOLD) {
    return Object.freeze({
      decision: 'reject',
      acceptedDrafts: Object.freeze([]),
      rejectedDrafts: Object.freeze(drafts.slice()),
      redactMoreDrafts: Object.freeze([]),
      summary: `auto-reject: max PII=${maxPii} >= ${HITL11_AUTO_REJECT_THRESHOLD}`,
    })
  }

  if (maxPii >= HITL11_AUTO_ESCALATE_THRESHOLD) {
    return Object.freeze({
      decision: 'escalate',
      acceptedDrafts: Object.freeze([]),
      rejectedDrafts: Object.freeze([]),
      redactMoreDrafts: Object.freeze(drafts.slice()),
      summary: `auto-escalate: max PII=${maxPii} >= ${HITL11_AUTO_ESCALATE_THRESHOLD}, total=${totalPii}`,
    })
  }

  // partial_redact: PII あるが軽微
  const accepted: KnowledgeDraft[] = []
  const redactMore: KnowledgeDraft[] = []
  for (const d of drafts) {
    if (d.piiHitCount === 0) accepted.push(d)
    else redactMore.push(d)
  }
  return Object.freeze({
    decision: 'partial_redact',
    acceptedDrafts: Object.freeze(accepted),
    rejectedDrafts: Object.freeze([]),
    redactMoreDrafts: Object.freeze(redactMore),
    summary: `auto-partial: accepted ${accepted.length}, redact-more ${redactMore.length}`,
  })
}

/**
 * applyReviewerActions — reviewer の個別 action を反映して result を構成.
 *
 * action 配列長は drafts と一致しない場合は autoEvaluate に fallback.
 */
export function applyReviewerActions(input: Hitl11ReviewInput): Hitl11ReviewResult {
  const { drafts, reviewerActions } = input
  if (!reviewerActions || reviewerActions.length !== drafts.length) {
    return autoEvaluate(drafts)
  }

  const accepted: KnowledgeDraft[] = []
  const rejected: KnowledgeDraft[] = []
  const redactMore: KnowledgeDraft[] = []

  for (let i = 0; i < drafts.length; i += 1) {
    const a = reviewerActions[i]!
    const d = drafts[i]!
    if (a === 'accept') accepted.push(d)
    else if (a === 'discard') rejected.push(d)
    else redactMore.push(d)
  }

  let decision: Hitl11Decision
  if (rejected.length === drafts.length) decision = 'reject'
  else if (accepted.length === drafts.length) decision = 'approve'
  else if (redactMore.length === drafts.length) decision = 'escalate'
  else decision = 'partial_redact'

  const commentPart = input.comment ? ` / comment="${input.comment.slice(0, 80)}"` : ''
  return Object.freeze({
    decision,
    acceptedDrafts: Object.freeze(accepted),
    rejectedDrafts: Object.freeze(rejected),
    redactMoreDrafts: Object.freeze(redactMore),
    summary:
      `reviewer: accept=${accepted.length} discard=${rejected.length} redact-more=${redactMore.length}` +
      commentPart,
  })
}

/** Slack / audit 用 1-line summary. */
export function formatHitl11Summary(result: Hitl11ReviewResult, prjId: string): string {
  return `[hitl-11] ${prjId} decision=${result.decision} (${result.summary})`
}
