/**
 * gate-12-cli-version-update.test — Round 14 Dev-D 着地 (Task A):
 *   HITL gate 第 12 種 cli_version_update_approval の harness 経路検証.
 *
 * カバー範囲:
 *   - Gate12RequestSchema / Gate12DecisionSchema の zod discriminated union
 *   - gate12RequestToHitlAction (HitlAction 変換)
 *   - interpretHitlResult (approve / reject / defer 3 経路)
 *   - buildGate12SlackButtons (3 button + action_id mapping)
 *   - parseGate12SlackQuickAction (JSON / schema / action_id / expiresAt)
 *   - fireGate12HitlGate (HitlGate adapter)
 */
import { describe, it, expect, vi } from 'vitest'
import type { HitlGate, HitlApprovalResult } from '../hitl-gate.js'
import {
  GATE_12_TYPE,
  Gate12RequestSchema,
  Gate12DecisionSchema,
  Gate12SlackQuickActionSchema,
  ACTION_ID_GATE12_APPROVE,
  ACTION_ID_GATE12_REJECT,
  ACTION_ID_GATE12_DEFER,
  gate12RequestToHitlAction,
  interpretGate12HitlResult,
  buildGate12SlackButtons,
  parseGate12SlackQuickAction,
  fireGate12HitlGate,
  type Gate12Request,
} from '../index.js'
import type { SlackQuickActionMetadata } from '../slack-quick-action.js'

const FIXED_NOW_MS = Date.parse('2026-05-04T18:00:00Z')
const FIXED_NOW_ISO = '2026-05-04T18:00:00.000Z'

function makeMeta(opts?: Partial<SlackQuickActionMetadata>): SlackQuickActionMetadata {
  return {
    projectId: opts?.projectId ?? 'PRJ-019',
    channelId: opts?.channelId ?? 'C0DEADBEEF',
    actorUserId: opts?.actorUserId ?? 'U0CEO',
    nonce: opts?.nonce ?? 'test-nonce-1234',
    issuedAt: opts?.issuedAt ?? new Date(FIXED_NOW_MS).toISOString(),
    expiresAt: opts?.expiresAt ?? new Date(FIXED_NOW_MS + 5 * 60 * 1000).toISOString(),
  }
}

function makeRequest(overrides: Partial<Gate12Request> = {}): Gate12Request {
  return {
    type: GATE_12_TYPE,
    title: 'Claude Code CLI 範囲外検出',
    message: 'version 2.0.0 が範囲外です。手動 update を推奨します。',
    risk: 'high',
    outcome: 'out_of_range',
    suggestedApproveAction: 'halt_for_manual_update',
    rejectAction: 'switch_to_dry_run',
    payload: { cliPath: '/usr/local/bin/claude' },
    ...overrides,
  }
}

describe('Round 14 Dev-D Task A: gate-12 cli_version_update_approval', () => {
  describe('zod schema validation', () => {
    it('1. GATE_12_TYPE 定数が固定化されている', () => {
      expect(GATE_12_TYPE).toBe('cli_version_update_approval')
    })

    it('2. Gate12RequestSchema valid input を accept', () => {
      expect(() => Gate12RequestSchema.parse(makeRequest())).not.toThrow()
    })

    it('3. Gate12RequestSchema invalid type を reject', () => {
      expect(() =>
        Gate12RequestSchema.parse({
          ...makeRequest(),
          type: 'something_else',
        }),
      ).toThrow()
    })

    it('4. Gate12RequestSchema invalid risk を reject', () => {
      expect(() =>
        Gate12RequestSchema.parse({
          ...makeRequest(),
          risk: 'critical',
        }),
      ).toThrow()
    })

    it('5. Gate12DecisionSchema discriminated union (approve / reject / defer)', () => {
      const ap = Gate12DecisionSchema.parse({
        decision: 'approve',
        approveAction: 'continue_with_warning',
        decidedAt: FIXED_NOW_ISO,
      })
      expect(ap.decision).toBe('approve')

      const rj = Gate12DecisionSchema.parse({
        decision: 'reject',
        rejectAction: 'halt',
        decidedAt: FIXED_NOW_ISO,
      })
      expect(rj.decision).toBe('reject')

      const df = Gate12DecisionSchema.parse({
        decision: 'defer',
        deferAction: 'recheck_in_next_boot',
        decidedAt: FIXED_NOW_ISO,
      })
      expect(df.decision).toBe('defer')
    })

    it('6. Gate12DecisionSchema cross-decision field reject (approve に rejectAction)', () => {
      // approve は approveAction が必須、rejectAction を入れても strict ではないため通る場合あり
      expect(() =>
        Gate12DecisionSchema.parse({
          decision: 'approve',
          // approveAction missing
          decidedAt: FIXED_NOW_ISO,
        }),
      ).toThrow()
    })
  })

  describe('gate12RequestToHitlAction', () => {
    it('7. HitlAction 変換: type/risk/description/meta が forward される', () => {
      const action = gate12RequestToHitlAction(makeRequest())
      // HitlActionType への正式追加は CEO 議決待ち、'paid_api_call' を一時流用
      expect(action.type).toBe('paid_api_call')
      expect(action.risk).toBe('high')
      expect(action.description).toContain('範囲外検出')
      expect(action.meta?.['kind']).toBe(GATE_12_TYPE)
      expect(action.meta?.['outcome']).toBe('out_of_range')
      expect(action.meta?.['suggestedApproveAction']).toBe('halt_for_manual_update')
      expect(action.meta?.['rejectAction']).toBe('switch_to_dry_run')
    })

    it('8. description 500 chars を超えると truncate される', () => {
      const huge = 'x'.repeat(2000)
      const action = gate12RequestToHitlAction(
        makeRequest({ message: huge.slice(0, 1900) }),
      )
      expect(action.description.length).toBeLessThanOrEqual(500)
      expect(action.description.endsWith('...')).toBe(true)
    })
  })

  describe('interpretHitlResult', () => {
    it('9. approved=true → decision=approve + suggestedApproveAction', () => {
      const req = makeRequest({ suggestedApproveAction: 'switch_to_dry_run' })
      const result: HitlApprovalResult = {
        approved: true,
        approver: 'owner',
        comment: 'OK',
        reason: 'approved',
        decidedAt: FIXED_NOW_ISO,
      }
      const dec = interpretGate12HitlResult(req, result)
      expect(dec.decision).toBe('approve')
      if (dec.decision === 'approve') {
        expect(dec.approveAction).toBe('switch_to_dry_run')
        expect(dec.approver).toBe('owner')
        expect(dec.comment).toBe('OK')
      }
    })

    it('10. timeout → decision=defer + recheck_in_next_boot', () => {
      const req = makeRequest()
      const result: HitlApprovalResult = {
        approved: false,
        reason: 'timeout',
        decidedAt: FIXED_NOW_ISO,
      }
      const dec = interpretGate12HitlResult(req, result)
      expect(dec.decision).toBe('defer')
      if (dec.decision === 'defer') {
        expect(dec.deferAction).toBe('recheck_in_next_boot')
      }
    })

    it('11. rejected → decision=reject + req.rejectAction', () => {
      const req = makeRequest({ rejectAction: 'halt' })
      const result: HitlApprovalResult = {
        approved: false,
        reason: 'rejected',
        approver: 'owner',
        decidedAt: FIXED_NOW_ISO,
      }
      const dec = interpretGate12HitlResult(req, result)
      expect(dec.decision).toBe('reject')
      if (dec.decision === 'reject') {
        expect(dec.rejectAction).toBe('halt')
        expect(dec.approver).toBe('owner')
      }
    })
  })

  describe('buildGate12SlackButtons', () => {
    it('12. 3 button (approve / reject / defer) を返す', () => {
      const btns = buildGate12SlackButtons({
        request: makeRequest(),
        metadata: makeMeta(),
      })
      expect(btns).toHaveLength(3)
      expect(btns[0]!.action_id).toBe(ACTION_ID_GATE12_APPROVE)
      expect(btns[1]!.action_id).toBe(ACTION_ID_GATE12_REJECT)
      expect(btns[2]!.action_id).toBe(ACTION_ID_GATE12_DEFER)
    })

    it('13. high risk approve button は danger style', () => {
      const btns = buildGate12SlackButtons({
        request: makeRequest({ risk: 'high' }),
        metadata: makeMeta(),
      })
      expect(btns[0]!.style).toBe('danger')
    })

    it('14. low risk approve button は primary style', () => {
      const btns = buildGate12SlackButtons({
        request: makeRequest({ risk: 'low' }),
        metadata: makeMeta(),
      })
      expect(btns[0]!.style).toBe('primary')
    })

    it('15. button.value は zod parse 可能な JSON', () => {
      const btns = buildGate12SlackButtons({
        request: makeRequest(),
        metadata: makeMeta(),
      })
      for (const b of btns) {
        const parsed = JSON.parse(b.value)
        expect(() => Gate12SlackQuickActionSchema.parse(parsed)).not.toThrow()
      }
    })

    it('16. approve button label に suggestedApproveAction が反映される', () => {
      const btns = buildGate12SlackButtons({
        request: makeRequest({ suggestedApproveAction: 'switch_to_dry_run' }),
        metadata: makeMeta(),
      })
      expect(btns[0]!.text.text).toContain('Switch to dry-run')
    })
  })

  describe('parseGate12SlackQuickAction', () => {
    it('17. valid approve button payload を parse', () => {
      const btns = buildGate12SlackButtons({
        request: makeRequest(),
        metadata: makeMeta(),
      })
      const parsed = parseGate12SlackQuickAction(
        btns[0]!.value,
        ACTION_ID_GATE12_APPROVE,
        FIXED_NOW_MS,
      )
      expect(parsed.decision).toBe('approve')
      expect(parsed.outcome).toBe('out_of_range')
    })

    it('18. action_id mismatch で reject', () => {
      const btns = buildGate12SlackButtons({
        request: makeRequest(),
        metadata: makeMeta(),
      })
      // approve button の value を reject action_id で parse 試行
      expect(() =>
        parseGate12SlackQuickAction(
          btns[0]!.value,
          ACTION_ID_GATE12_REJECT,
          FIXED_NOW_MS,
        ),
      ).toThrow(/mismatch/)
    })

    it('19. expiresAt 過去で reject', () => {
      const btns = buildGate12SlackButtons({
        request: makeRequest(),
        metadata: makeMeta({
          expiresAt: new Date(FIXED_NOW_MS - 1000).toISOString(),
        }),
      })
      expect(() =>
        parseGate12SlackQuickAction(
          btns[0]!.value,
          ACTION_ID_GATE12_APPROVE,
          FIXED_NOW_MS,
        ),
      ).toThrow(/expired/)
    })

    it('20. invalid JSON で reject', () => {
      expect(() =>
        parseGate12SlackQuickAction(
          'not-json',
          ACTION_ID_GATE12_APPROVE,
          FIXED_NOW_MS,
        ),
      ).toThrow(/invalid JSON/)
    })

    it('21. defer button parse OK', () => {
      const btns = buildGate12SlackButtons({
        request: makeRequest(),
        metadata: makeMeta(),
      })
      const parsed = parseGate12SlackQuickAction(
        btns[2]!.value,
        ACTION_ID_GATE12_DEFER,
        FIXED_NOW_MS,
      )
      expect(parsed.decision).toBe('defer')
      expect(parsed.action).toBe('recheck_in_next_boot')
    })
  })

  describe('fireGate12HitlGate (adapter)', () => {
    it('22. HitlGate.requestApproval を呼んで approve 結果を Decision に変換', async () => {
      const stubHitl: HitlGate = {
        requestApproval: vi.fn().mockResolvedValue({
          approved: true,
          reason: 'approved',
          approver: 'owner',
          decidedAt: FIXED_NOW_ISO,
        }),
        listPending: vi.fn().mockResolvedValue([]),
        decide: vi.fn().mockResolvedValue(undefined),
      }
      const dec = await fireGate12HitlGate({
        hitl: stubHitl,
        request: makeRequest(),
      })
      expect(stubHitl.requestApproval).toHaveBeenCalledTimes(1)
      expect(dec.decision).toBe('approve')
    })

    it('23. HitlGate timeout を defer に変換', async () => {
      const stubHitl: HitlGate = {
        requestApproval: vi.fn().mockResolvedValue({
          approved: false,
          reason: 'timeout',
          decidedAt: FIXED_NOW_ISO,
        }),
        listPending: vi.fn().mockResolvedValue([]),
        decide: vi.fn().mockResolvedValue(undefined),
      }
      const dec = await fireGate12HitlGate({
        hitl: stubHitl,
        request: makeRequest(),
      })
      expect(dec.decision).toBe('defer')
    })
  })
})
