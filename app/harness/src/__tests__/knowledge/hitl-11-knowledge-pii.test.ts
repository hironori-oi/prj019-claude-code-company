/**
 * HITL-11 knowledge PII gate test (Round 13 Dev-E).
 *
 * 検証項目 (6 tests):
 *   1. autoEvaluate: PII ゼロで approve
 *   2. autoEvaluate: 軽微 PII (< escalate threshold) で partial_redact
 *   3. autoEvaluate: max PII >= escalate threshold で escalate
 *   4. autoEvaluate: max PII >= reject threshold で reject
 *   5. applyReviewerActions: reviewer 全 accept で approve
 *   6. applyReviewerActions: reviewer 混在 → partial_redact
 */
import { describe, it, expect } from 'vitest'
import {
  HITL11_AUTO_ESCALATE_THRESHOLD,
  HITL11_AUTO_REJECT_THRESHOLD,
  applyReviewerActions,
  autoEvaluate,
  formatHitl11Summary,
} from '../../knowledge/hitl-11-knowledge-pii.js'
import type { KnowledgeDraft } from '../../knowledge/ke-02-trigger.js'

const draftZero: KnowledgeDraft = {
  kind: 'pattern',
  sourcePrj: 'PRJ-019',
  title: 'no-pii',
  bodyRedacted: 'all clean text',
  piiHitCount: 0,
  tags: ['security'],
  requiresHitl11: false,
}

const draftLight: KnowledgeDraft = {
  kind: 'decision',
  sourcePrj: 'PRJ-019',
  title: 'light-pii',
  bodyRedacted: 'some <EMAIL> only',
  piiHitCount: 1,
  tags: ['governance'],
  requiresHitl11: true,
}

const draftHigh: KnowledgeDraft = {
  kind: 'pattern',
  sourcePrj: 'PRJ-019',
  title: 'high-pii',
  bodyRedacted: 'many <EMAIL> <PHONE> <CREDIT_CARD>',
  piiHitCount: HITL11_AUTO_ESCALATE_THRESHOLD,
  tags: ['security'],
  requiresHitl11: true,
}

const draftCritical: KnowledgeDraft = {
  kind: 'pitfall',
  sourcePrj: 'PRJ-019',
  title: 'crit-pii',
  bodyRedacted: 'massive <ANTHROPIC_KEY> <OPENAI_KEY>',
  piiHitCount: HITL11_AUTO_REJECT_THRESHOLD,
  tags: ['security'],
  requiresHitl11: true,
}

describe('HITL-11 autoEvaluate', () => {
  it('PII ゼロで approve', () => {
    const r = autoEvaluate([draftZero, draftZero])
    expect(r.decision).toBe('approve')
    expect(r.acceptedDrafts.length).toBe(2)
    expect(r.summary).toContain('auto-approve')
  })

  it('drafts 0 件で approve + summary=no drafts', () => {
    const r = autoEvaluate([])
    expect(r.decision).toBe('approve')
    expect(r.summary).toBe('no drafts')
  })

  it('軽微 PII で partial_redact', () => {
    const r = autoEvaluate([draftZero, draftLight])
    expect(r.decision).toBe('partial_redact')
    expect(r.acceptedDrafts.length).toBe(1)
    expect(r.redactMoreDrafts.length).toBe(1)
  })

  it('max PII >= escalate threshold で escalate', () => {
    const r = autoEvaluate([draftZero, draftHigh])
    expect(r.decision).toBe('escalate')
    expect(r.redactMoreDrafts.length).toBe(2) // both go to redact-more
  })

  it('max PII >= reject threshold で reject', () => {
    const r = autoEvaluate([draftZero, draftCritical])
    expect(r.decision).toBe('reject')
    expect(r.rejectedDrafts.length).toBe(2)
    expect(r.acceptedDrafts.length).toBe(0)
  })

  it('結果は Object.freeze 済', () => {
    const r = autoEvaluate([draftZero])
    expect(Object.isFrozen(r)).toBe(true)
    expect(Object.isFrozen(r.acceptedDrafts)).toBe(true)
  })
})

describe('HITL-11 applyReviewerActions', () => {
  it('reviewer 全 accept で approve', () => {
    const r = applyReviewerActions({
      drafts: [draftLight, draftZero],
      reviewerActions: ['accept', 'accept'],
      comment: 'looks good',
    })
    expect(r.decision).toBe('approve')
    expect(r.acceptedDrafts.length).toBe(2)
    expect(r.summary).toContain('comment')
  })

  it('reviewer 全 discard で reject', () => {
    const r = applyReviewerActions({
      drafts: [draftLight],
      reviewerActions: ['discard'],
    })
    expect(r.decision).toBe('reject')
    expect(r.rejectedDrafts.length).toBe(1)
  })

  it('reviewer 混在で partial_redact', () => {
    const r = applyReviewerActions({
      drafts: [draftLight, draftZero, draftHigh],
      reviewerActions: ['accept', 'discard', 'redact_more'],
    })
    expect(r.decision).toBe('partial_redact')
    expect(r.acceptedDrafts.length).toBe(1)
    expect(r.rejectedDrafts.length).toBe(1)
    expect(r.redactMoreDrafts.length).toBe(1)
  })

  it('action 配列長 mismatch で autoEvaluate fallback', () => {
    const r = applyReviewerActions({
      drafts: [draftLight, draftZero],
      reviewerActions: ['accept'], // 1 vs 2
    })
    // mismatch → autoEvaluate fallback (light + zero → partial_redact)
    expect(r.decision).toBe('partial_redact')
  })

  it('formatHitl11Summary が prjId + decision を含む', () => {
    const r = autoEvaluate([draftZero])
    const s = formatHitl11Summary(r, 'PRJ-019')
    expect(s).toContain('PRJ-019')
    expect(s).toContain('decision=approve')
  })
})
