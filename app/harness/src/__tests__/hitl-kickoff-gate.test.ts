/**
 * hitl-kickoff-gate.test — Round 8 W2 後半実装前倒し (DEC-019-033 ② / DEC-019-055 α 雛形):
 *   HITL 第 9 種 `dev_kickoff_approval` runtime 雛形の単体テスト。
 *
 * カバー範囲 (8 ケース最低、命令書スコープ準拠):
 *   1. default reject — Owner 明示承認なしで自動却下
 *   2. approve flow — Owner approved → approved=true, status='approved'
 *   3. reject flow — Owner rejected → approved=false, status='rejected', cost rollback 発火
 *   4. timeout 72h — gate timeout → approved=false, status='timeout', cost rollback 発火
 *   5. cost rollback — rollback hook が proposal cost で正しく呼ばれる
 *   6. template validation 7 項目 — 必須 7 項目欠落で template_invalid + rollback
 *   7. hitl-enforcer integration — HitlAction envelope が正しく組み立てられる
 *   8. edge cases — gate throw / rollback throw / rollback 未注入時の best-effort
 *
 * 雛形段階の注意:
 *   - 既存 hitl-enforcer.ts と統合する W1 本実装版では、enforceBeforeSpawn 経由で
 *     audit 連携も自動化される。本 test では KickoffHitlGate モックを直接注入して
 *     雛形の評価ロジックのみを検証する。
 */
import { describe, it, expect } from 'vitest'

import {
  createKickoffGate,
  buildKickoffHitlAction,
  DevKickoffProposalSchema,
  DEV_KICKOFF_ACTION_TYPE,
  KICKOFF_SLA_MS,
  type CostRollbackHook,
  type DevKickoffProposal,
  type KickoffHitlGate,
} from '../hitl-kickoff-gate.js'

/** テスト用 valid proposal 7 項目 fully populated */
function validProposal(overrides: Partial<DevKickoffProposal> = {}): DevKickoffProposal {
  return {
    projectSummary:
      'Open Claw 自律 AI 組織のための B2B SaaS 雛形を Phase 1 で構築する案件。',
    estimatedValue: 'B2B 中小企業 100 社獲得想定、推定 ARR $50k',
    estimatedCostUsd: 12.5,
    estimatedEffortDays: 14,
    knowledgeRefs: ['PRJ-019', 'patterns/openclaw-runtime', 'pitfalls/hitl-naming'],
    riskAssessment:
      'ToS gray 領域 (open ai usage policy) の評価要、BAN リスク 30-60% を許容。',
    ownerQuestions: ['Q1: Phase 2 への接続方針', 'Q2: $30 cap 見直し可否'],
    proposalId: 'kickoff-2026-05-04-001',
    ...overrides,
  }
}

/** モック gate factory: 任意の応答を注入できる */
function mockGate(
  response: Awaited<ReturnType<KickoffHitlGate['requestApproval']>> | (() => never),
): KickoffHitlGate {
  return {
    requestApproval: async () => {
      if (typeof response === 'function') response()
      // unreachable when response is value
      return response as Awaited<ReturnType<KickoffHitlGate['requestApproval']>>
    },
    listPending: async () => [],
    decide: async () => undefined,
  }
}

/** モック cost rollback hook: 呼び出し記録を保持 */
function mockRollback(): CostRollbackHook & {
  calls: Array<{ proposalId: string; amountUsd: number; reason: string }>
} {
  const calls: Array<{ proposalId: string; amountUsd: number; reason: string }> = []
  return {
    calls,
    rollback: async (input) => {
      calls.push({
        proposalId: input.proposalId,
        amountUsd: input.amountUsd,
        reason: input.reason,
      })
      return { ok: true, meta: { idempotencyKey: input.proposalId } }
    },
  }
}

describe('hitl-kickoff-gate (DEC-019-033 ② / HITL 第 9 種 dev_kickoff_approval)', () => {
  it('1. default reject — Owner 明示承認なしの不明 reason を default reject 扱いにする', async () => {
    const rollback = mockRollback()
    // gate が approved=false で reason 不明な値を返した場合 → default reject
    const gate = createKickoffGate({
      gate: mockGate({
        approved: false,
        reason: undefined as unknown as 'rejected',
        decidedAt: '2026-05-04T00:00:00.000Z',
      }),
      costRollback: rollback,
    })
    const r = await gate.evaluate(validProposal())
    expect(r.approved).toBe(false)
    expect(r.status).toBe('rejected')
    expect(r.costRolledBack).toBe(true)
    expect(rollback.calls).toHaveLength(1)
    expect(rollback.calls[0]?.reason).toBe('rejected')
  })

  it('2. approve flow — Owner approved → status=approved, rollback 未発火', async () => {
    const rollback = mockRollback()
    const gate = createKickoffGate({
      gate: mockGate({
        approved: true,
        approver: 'owner@example.com',
        reason: 'approved',
        decidedAt: '2026-05-04T01:00:00.000Z',
      }),
      costRollback: rollback,
    })
    const r = await gate.evaluate(validProposal())
    expect(r.approved).toBe(true)
    expect(r.status).toBe('approved')
    expect(r.approver).toBe('owner@example.com')
    expect(r.decidedAt).toBe('2026-05-04T01:00:00.000Z')
    expect(r.costRolledBack).toBeUndefined()
    expect(rollback.calls).toHaveLength(0)
  })

  it('3. reject flow — Owner rejected → cost rollback 発火 + status=rejected', async () => {
    const rollback = mockRollback()
    const gate = createKickoffGate({
      gate: mockGate({
        approved: false,
        approver: 'owner@example.com',
        comment: 'risk too high for Phase 1',
        reason: 'rejected',
        decidedAt: '2026-05-04T02:00:00.000Z',
      }),
      costRollback: rollback,
    })
    const proposal = validProposal({ estimatedCostUsd: 25 })
    const r = await gate.evaluate(proposal)
    expect(r.approved).toBe(false)
    expect(r.status).toBe('rejected')
    expect(r.costRolledBack).toBe(true)
    expect(rollback.calls[0]).toMatchObject({
      proposalId: proposal.proposalId,
      amountUsd: 25,
      reason: 'rejected',
    })
  })

  it('4. timeout 72h — SLA timeout → status=timeout + rollback 発火', async () => {
    const rollback = mockRollback()
    // SLA 定数が DEC-019-033 ② の 72h と一致することも assert する
    expect(KICKOFF_SLA_MS).toBe(72 * 60 * 60 * 1000)

    const gate = createKickoffGate({
      gate: mockGate({
        approved: false,
        reason: 'timeout',
        decidedAt: '2026-05-07T00:00:00.000Z',
      }),
      costRollback: rollback,
    })
    // gate 経由で SLA を引き出せる（W1 で FileHitlGate.timeoutMs に橋渡し）
    expect(gate.getSlaMs()).toBe(72 * 60 * 60 * 1000)
    const r = await gate.evaluate(validProposal({ estimatedCostUsd: 18 }))
    expect(r.approved).toBe(false)
    expect(r.status).toBe('timeout')
    expect(r.costRolledBack).toBe(true)
    expect(rollback.calls[0]?.reason).toBe('timeout')
    expect(rollback.calls[0]?.amountUsd).toBe(18)
  })

  it('5. cost rollback — proposalId/amount/reason が正しく hook に伝わる', async () => {
    const rollback = mockRollback()
    const gate = createKickoffGate({
      gate: mockGate({
        approved: false,
        reason: 'rejected',
        decidedAt: '2026-05-04T03:00:00.000Z',
      }),
      costRollback: rollback,
    })
    const proposal = validProposal({
      proposalId: 'kickoff-rollback-check',
      estimatedCostUsd: 7.7,
    })
    await gate.evaluate(proposal)
    expect(rollback.calls).toHaveLength(1)
    expect(rollback.calls[0]).toEqual({
      proposalId: 'kickoff-rollback-check',
      amountUsd: 7.7,
      reason: 'rejected',
    })
  })

  it('6. template validation 7 項目 — 必須欠落で template_invalid + rollback', async () => {
    const rollback = mockRollback()
    const gate = createKickoffGate({
      // gate は呼ばれない想定 (zod 段で reject)
      gate: mockGate(() => {
        throw new Error('should not reach gate')
      }),
      costRollback: rollback,
    })
    // (a)〜(g) のうち knowledgeRefs / ownerQuestions / riskAssessment / estimatedEffortDays
    // の 4 項目を欠落させる
    const broken = {
      projectSummary: 'short', // min 20 violation も同時発生
      estimatedValue: 'small',
      estimatedCostUsd: 12.5,
      proposalId: 'kickoff-broken-001',
    }
    const r = await gate.evaluate(broken)
    expect(r.approved).toBe(false)
    expect(r.status).toBe('template_invalid')
    expect(r.templateErrors).toBeDefined()
    expect(r.templateErrors!.length).toBeGreaterThan(0)
    // 7 項目のうち 4 つは絶対不足するので最低 4 件以上のエラーが立つ
    expect(r.templateErrors!.length).toBeGreaterThanOrEqual(4)
    // rollback も best-effort で呼ばれる (proposalId は best-effort 抽出)
    expect(rollback.calls).toHaveLength(1)
    expect(rollback.calls[0]?.reason).toBe('template_invalid')
    expect(rollback.calls[0]?.proposalId).toBe('kickoff-broken-001')

    // 全 7 項目が schema で必須宣言されていることをスキーマ自体からも確認
    const shape = DevKickoffProposalSchema.shape
    expect(Object.keys(shape).sort()).toEqual(
      [
        'projectSummary',
        'estimatedValue',
        'estimatedCostUsd',
        'estimatedEffortDays',
        'knowledgeRefs',
        'riskAssessment',
        'ownerQuestions',
        'proposalId',
      ].sort(),
    )
  })

  it('7. hitl-enforcer integration — HitlAction envelope が正しく組み立てられる', async () => {
    const proposal = validProposal({
      proposalId: 'kickoff-envelope-001',
      estimatedCostUsd: 9.9,
      estimatedEffortDays: 7,
    })
    const action = buildKickoffHitlAction(proposal)
    expect(action.type).toBe(DEV_KICKOFF_ACTION_TYPE)
    expect(action.type).toBe('dev_kickoff_approval')
    expect(action.risk).toBe('high')
    expect(action.description.startsWith('dev_kickoff_approval:')).toBe(true)
    expect(action.meta).toMatchObject({
      proposalId: 'kickoff-envelope-001',
      estimatedCostUsd: 9.9,
      estimatedEffortDays: 7,
      knowledgeRefsCount: proposal.knowledgeRefs.length,
      ownerQuestionsCount: proposal.ownerQuestions.length,
    })

    // gate が action.type='dev_kickoff_approval' を受け取ることを runtime 経路でも確認
    let receivedType = ''
    const gate: KickoffHitlGate = {
      requestApproval: async (a) => {
        receivedType = a.type
        return {
          approved: true,
          reason: 'approved',
          approver: 'owner',
          decidedAt: '2026-05-04T04:00:00.000Z',
        }
      },
      listPending: async () => [],
      decide: async () => undefined,
    }
    const kg = createKickoffGate({ gate })
    const r = await kg.evaluate(proposal)
    expect(r.approved).toBe(true)
    expect(receivedType).toBe('dev_kickoff_approval')
  })

  it('8. edge cases — gate throw / rollback throw / rollback 未注入で best-effort', async () => {
    // 8-a: gate throw → status='error' + rollback called
    const rollbackA = mockRollback()
    const gateA = createKickoffGate({
      gate: mockGate(() => {
        throw new Error('gate exploded')
      }),
      costRollback: rollbackA,
    })
    const rA = await gateA.evaluate(validProposal())
    expect(rA.approved).toBe(false)
    expect(rA.status).toBe('error')
    expect(rA.reason).toMatch(/gate exploded/)
    expect(rollbackA.calls).toHaveLength(1)
    expect(rollbackA.calls[0]?.reason).toBe('error')

    // 8-b: rollback hook 自体が throw した場合は costRolledBack=false でフォールバック (gate 評価結果は維持)
    const throwingRollback: CostRollbackHook = {
      rollback: async () => {
        throw new Error('rollback DB unreachable')
      },
    }
    const gateB = createKickoffGate({
      gate: mockGate({
        approved: false,
        reason: 'rejected',
        decidedAt: '2026-05-04T05:00:00.000Z',
      }),
      costRollback: throwingRollback,
    })
    const rB = await gateB.evaluate(validProposal())
    expect(rB.approved).toBe(false)
    expect(rB.status).toBe('rejected')
    expect(rB.costRolledBack).toBe(false)
    expect(rB.rollbackMeta).toMatchObject({ error: expect.stringMatching(/rollback DB/) })

    // 8-c: rollback hook 未注入 → reject 時も throw せず costRolledBack/rollbackMeta は undefined
    const gateC = createKickoffGate({
      gate: mockGate({
        approved: false,
        reason: 'timeout',
        decidedAt: '2026-05-04T06:00:00.000Z',
      }),
    })
    const rC = await gateC.evaluate(validProposal())
    expect(rC.approved).toBe(false)
    expect(rC.status).toBe('timeout')
    expect(rC.costRolledBack).toBeUndefined()
    expect(rC.rollbackMeta).toBeUndefined()
  })
})
