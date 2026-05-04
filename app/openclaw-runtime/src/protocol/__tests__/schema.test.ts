/**
 * schema.test — Round 9 案 9-A1 前倒し (CB-D-W3-03):
 *   Open Claw → CEO 構造化 JSON IF zod スキーマの単体テスト。
 *
 * カバー範囲 (12+ tests):
 *   1. needs_proposal happy path - 7 項目 fully populated で parse 成功
 *   2. progress_update happy path
 *   3. error_report happy path
 *   4. escalation_request happy path
 *   5. discriminated union - messageType に基づき branch される
 *   6. needs_proposal の proposal field が DevKickoffProposalSchema と互換
 *   7. required field 欠落で fail (各 messageType につき 1 件)
 *   8. range constraints - estimatedCostUsd 上限 / progressPercent 範囲 / slaMs 範囲
 *   9. type guard isOpenclawToCeoMessage
 *   10. narrow type guard isMessageOfType
 *   11. ScoutReference licenseCheckRequired は literal true 必須
 *   12. invalid messageType で reject
 */
import { describe, it, expect } from 'vitest'

import {
  ErrorReportMessageSchema,
  EscalationRequestMessageSchema,
  isMessageOfType,
  isOpenclawToCeoMessage,
  NeedsProposalMessageSchema,
  OpenclawToCeoMessageSchema,
  ProgressUpdateMessageSchema,
  ProposalContentSchema,
  ScoutReferenceSchema,
  type EscalationRequestMessage,
  type NeedsProposalMessage,
  type OpenclawToCeoMessage,
  type ProposalContent,
} from '../openclaw-to-ceo.schema.js'

const baseHeader = {
  messageId: 'msg-2026-05-04-001',
  sentAt: '2026-05-04T12:00:00.000Z',
  openclawTraceId: 'trace-abc-123',
}

function validProposal(overrides: Partial<ProposalContent> = {}): ProposalContent {
  return {
    proposalId: 'kickoff-2026-05-04-001',
    projectSummary:
      'TypeScript SaaS のためのニッチ B2B ツールを Phase 1 で構築する案件。',
    estimatedValue: 'B2B 中小企業 100 社獲得想定、推定 ARR $50k',
    estimatedCostUsd: 12.5,
    estimatedEffortDays: 14,
    knowledgeRefs: ['PRJ-019', 'patterns/openclaw-runtime'],
    riskAssessment:
      'ToS gray 領域 (open ai usage policy) の評価要、BAN リスク 30-60% を許容。',
    ownerQuestions: ['Q1: Phase 2 への接続方針'],
    ...overrides,
  }
}

function validScoutRef() {
  return {
    scoutRunId: 'scout-2026-05-04T11:00:00.000Z',
    candidateId: 'hn-12345',
    candidateScore: 78.5,
    licenseCheckRequired: true as const,
  }
}

describe('OpenclawToCeoMessage schema (CB-D-W3-03 / DEC-019-033 ② 互換)', () => {
  it('1. needs_proposal happy path - 7 項目 fully populated で parse 成功', () => {
    const msg = {
      ...baseHeader,
      messageType: 'needs_proposal',
      proposal: validProposal(),
      scoutRef: validScoutRef(),
    }
    const result = NeedsProposalMessageSchema.safeParse(msg)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.messageType).toBe('needs_proposal')
      expect(result.data.proposal.proposalId).toBe('kickoff-2026-05-04-001')
      expect(result.data.scoutRef.licenseCheckRequired).toBe(true)
    }
  })

  it('2. progress_update happy path', () => {
    const msg = {
      ...baseHeader,
      messageType: 'progress_update',
      proposalId: 'kickoff-001',
      progressPercent: 42.5,
      phase: 'classifying',
      costSoFarUsd: 1.23,
      summary: 'Loop 3/10 finished, awaiting next batch',
    }
    const result = ProgressUpdateMessageSchema.safeParse(msg)
    expect(result.success).toBe(true)
  })

  it('3. error_report happy path', () => {
    const msg = {
      ...baseHeader,
      messageType: 'error_report',
      severity: 'error',
      errorCode: 'spawn_timeout',
      errorMessage: 'subprocess exceeded 600s timeout',
      proposalId: 'kickoff-001',
    }
    const result = ErrorReportMessageSchema.safeParse(msg)
    expect(result.success).toBe(true)
  })

  it('4. escalation_request happy path', () => {
    const msg = {
      ...baseHeader,
      messageType: 'escalation_request',
      escalationKind: 'tos_gray_review',
      reasoning: 'OpenAI usage policy gray area in domain X',
      ownerQuestions: ['Should we proceed with API key fallback?'],
      slaMs: 72 * 60 * 60 * 1000,
    }
    const result = EscalationRequestMessageSchema.safeParse(msg)
    expect(result.success).toBe(true)
  })

  it('5. discriminated union - messageType に基づき branch される', () => {
    const proposalMsg = {
      ...baseHeader,
      messageType: 'needs_proposal',
      proposal: validProposal(),
      scoutRef: validScoutRef(),
    }
    const errorMsg = {
      ...baseHeader,
      messageType: 'error_report',
      severity: 'fatal',
      errorCode: 'crash',
      errorMessage: 'segfault',
    }
    const r1 = OpenclawToCeoMessageSchema.safeParse(proposalMsg)
    const r2 = OpenclawToCeoMessageSchema.safeParse(errorMsg)
    expect(r1.success).toBe(true)
    expect(r2.success).toBe(true)
    if (r1.success) expect(r1.data.messageType).toBe('needs_proposal')
    if (r2.success) expect(r2.data.messageType).toBe('error_report')
  })

  it('6. proposal field が DevKickoffProposalSchema と field 名互換', () => {
    // DevKickoffProposalSchema (hitl-kickoff-gate.ts) と同じ 8 field を持つことを確認
    // (proposalId + projectSummary + estimatedValue + estimatedCostUsd +
    //  estimatedEffortDays + knowledgeRefs + riskAssessment + ownerQuestions)
    const shape = ProposalContentSchema.shape
    const expectedFields = [
      'proposalId',
      'projectSummary',
      'estimatedValue',
      'estimatedCostUsd',
      'estimatedEffortDays',
      'knowledgeRefs',
      'riskAssessment',
      'ownerQuestions',
    ].sort()
    expect(Object.keys(shape).sort()).toEqual(expectedFields)
  })

  it('7-a. needs_proposal required field 欠落で fail (proposal 欠落)', () => {
    const msg = {
      ...baseHeader,
      messageType: 'needs_proposal',
      scoutRef: validScoutRef(),
    }
    expect(NeedsProposalMessageSchema.safeParse(msg).success).toBe(false)
  })

  it('7-b. progress_update required field 欠落で fail (phase 欠落)', () => {
    const msg = {
      ...baseHeader,
      messageType: 'progress_update',
      progressPercent: 50,
      costSoFarUsd: 1.0,
      summary: 'half way',
    }
    expect(ProgressUpdateMessageSchema.safeParse(msg).success).toBe(false)
  })

  it('7-c. error_report required field 欠落で fail (severity 欠落)', () => {
    const msg = {
      ...baseHeader,
      messageType: 'error_report',
      errorCode: 'crash',
      errorMessage: 'kernel panic',
    }
    expect(ErrorReportMessageSchema.safeParse(msg).success).toBe(false)
  })

  it('7-d. escalation_request required field 欠落で fail (ownerQuestions 空)', () => {
    const msg = {
      ...baseHeader,
      messageType: 'escalation_request',
      escalationKind: 'tos_gray_review',
      reasoning: 'gray area detected',
      ownerQuestions: [], // min(1) 違反
      slaMs: 1000,
    }
    expect(EscalationRequestMessageSchema.safeParse(msg).success).toBe(false)
  })

  it('8-a. range - estimatedCostUsd 上限超過で fail', () => {
    const msg = {
      ...baseHeader,
      messageType: 'needs_proposal',
      proposal: validProposal({ estimatedCostUsd: 100_000 }), // > 10_000 max
      scoutRef: validScoutRef(),
    }
    expect(NeedsProposalMessageSchema.safeParse(msg).success).toBe(false)
  })

  it('8-b. range - progressPercent 範囲外で fail', () => {
    const msg = {
      ...baseHeader,
      messageType: 'progress_update',
      progressPercent: 150,
      phase: 'classifying',
      costSoFarUsd: 1.0,
      summary: 'over 100%',
    }
    expect(ProgressUpdateMessageSchema.safeParse(msg).success).toBe(false)
  })

  it('8-c. range - slaMs 過大で fail', () => {
    const msg = {
      ...baseHeader,
      messageType: 'escalation_request',
      escalationKind: 'tos_gray_review',
      reasoning: 'gray area detected for 99 days',
      ownerQuestions: ['why?'],
      slaMs: 1_000_000_000, // > 7 days max
    }
    expect(EscalationRequestMessageSchema.safeParse(msg).success).toBe(false)
  })

  it('9. type guard isOpenclawToCeoMessage', () => {
    const valid = {
      ...baseHeader,
      messageType: 'progress_update',
      progressPercent: 50,
      phase: 'running',
      costSoFarUsd: 1.0,
      summary: 'halfway',
    }
    expect(isOpenclawToCeoMessage(valid)).toBe(true)
    expect(isOpenclawToCeoMessage({ messageType: 'unknown' })).toBe(false)
    expect(isOpenclawToCeoMessage(null)).toBe(false)
    expect(isOpenclawToCeoMessage(undefined)).toBe(false)
  })

  it('10. narrow type guard isMessageOfType', () => {
    const msg: OpenclawToCeoMessage = {
      ...baseHeader,
      messageType: 'needs_proposal',
      proposal: validProposal(),
      scoutRef: validScoutRef(),
    } as NeedsProposalMessage
    expect(isMessageOfType(msg, 'needs_proposal')).toBe(true)
    expect(isMessageOfType(msg, 'progress_update')).toBe(false)
    if (isMessageOfType(msg, 'needs_proposal')) {
      // narrow 後 proposal にアクセス可能
      expect(msg.proposal.proposalId).toBe('kickoff-2026-05-04-001')
    }
  })

  it('11. ScoutReference licenseCheckRequired は literal true 必須', () => {
    expect(
      ScoutReferenceSchema.safeParse({
        scoutRunId: 'scout-1',
        candidateId: 'c-1',
        candidateScore: 80,
        licenseCheckRequired: true,
      }).success,
    ).toBe(true)
    expect(
      ScoutReferenceSchema.safeParse({
        scoutRunId: 'scout-1',
        candidateId: 'c-1',
        candidateScore: 80,
        licenseCheckRequired: false, // literal true 違反
      }).success,
    ).toBe(false)
  })

  it('12. invalid messageType で reject', () => {
    const msg = {
      ...baseHeader,
      messageType: 'unknown_type',
    }
    expect(OpenclawToCeoMessageSchema.safeParse(msg).success).toBe(false)
  })

  it('13. sentAt 形式 - ISO8601 datetime 必須', () => {
    const msg = {
      messageId: 'm-1',
      sentAt: 'not-a-date',
      openclawTraceId: 't-1',
      messageType: 'progress_update',
      progressPercent: 50,
      phase: 'running',
      costSoFarUsd: 1.0,
      summary: 'halfway',
    }
    expect(ProgressUpdateMessageSchema.safeParse(msg).success).toBe(false)
  })

  it('14. escalation_request - 7 項目互換 ownerQuestions array が DevKickoff と同種', () => {
    const msg: EscalationRequestMessage = {
      ...baseHeader,
      messageType: 'escalation_request',
      escalationKind: 'dev_kickoff_approval',
      proposalId: 'kickoff-001',
      reasoning: 'Owner judgement required for approval',
      ownerQuestions: [
        'Q1: budget acceptable?',
        'Q2: timing ok?',
        'Q3: risk level acceptable?',
      ],
      slaMs: 72 * 60 * 60 * 1000,
    }
    expect(EscalationRequestMessageSchema.safeParse(msg).success).toBe(true)
  })
})
