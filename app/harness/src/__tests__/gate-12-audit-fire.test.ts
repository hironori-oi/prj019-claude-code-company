/**
 * gate-12-audit-fire.test — Round 15 Dev-M (M-1):
 *   gate-12 + audit-store SHA-256 chain 統合 fire helper の検証.
 *
 * カバー範囲:
 *   - buildGate12FireAuditPayload / buildGate12DecisionAuditPayload (純関数)
 *   - fireGate12WithAudit: approve / reject / defer 3 経路の audit append
 *   - audit chain 整合 (verifyHashChain in-line check)
 *   - extraPayload merge (reserved key 保護)
 *   - fire entry のみ残るケース (hitl throw)
 *   - chain integrity error 経路
 */
import { describe, it, expect, vi } from 'vitest'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  FileAuditLogStore,
  type AuditLogStore,
  type AuditEvent,
} from '@clawbridge/audit'
import type { HitlApprovalResult, HitlGate } from '../hitl-gate.js'
import {
  GATE_12_TYPE,
  type Gate12Request,
} from '../hitl/gate-12-cli-version-update.js'
import {
  buildGate12FireAuditPayload,
  buildGate12DecisionAuditPayload,
  fireGate12WithAudit,
  Gate12ChainIntegrityError,
} from '../hitl/gate-12-audit-fire.js'

const FIXED_NOW_ISO = '2026-05-04T18:00:00.000Z'

function makeRequest(overrides: Partial<Gate12Request> = {}): Gate12Request {
  return {
    type: GATE_12_TYPE,
    title: 'Claude Code CLI 範囲外検出',
    message: 'version 2.0.0 が範囲外です。',
    risk: 'high',
    outcome: 'out_of_range',
    suggestedApproveAction: 'halt_for_manual_update',
    rejectAction: 'switch_to_dry_run',
    payload: { cliPath: '/usr/local/bin/claude' },
    ...overrides,
  }
}

function makeStubHitl(result: HitlApprovalResult): HitlGate {
  return {
    requestApproval: vi.fn().mockResolvedValue(result),
    listPending: vi.fn().mockResolvedValue([]),
    decide: vi.fn().mockResolvedValue(undefined),
  }
}

async function makeFileAudit(): Promise<{
  store: FileAuditLogStore
  filePath: string
  cleanup: () => Promise<void>
}> {
  const dir = await fs.mkdtemp(join(tmpdir(), 'gate12-audit-test-'))
  const filePath = join(dir, 'audit.jsonl')
  const store = new FileAuditLogStore({
    filePath,
    rotation: { rotateOnAppend: false, retentionMs: 90 * 24 * 60 * 60 * 1000 },
    now: () => new Date(FIXED_NOW_ISO),
  })
  return {
    store,
    filePath,
    cleanup: async () => {
      try {
        await fs.rm(dir, { recursive: true, force: true })
      } catch {
        // ignore
      }
    },
  }
}

describe('Round 15 Dev-M M-1: gate-12 audit-fire integration', () => {
  describe('buildGate12FireAuditPayload (純関数)', () => {
    it('1. fire payload は kind=gate_12_fire を含む', () => {
      const p = buildGate12FireAuditPayload(makeRequest())
      expect(p['kind']).toBe('gate_12_fire')
      expect(p['gate_type']).toBe(GATE_12_TYPE)
      expect(p['outcome']).toBe('out_of_range')
      expect(p['risk']).toBe('high')
      expect(p['suggestedApproveAction']).toBe('halt_for_manual_update')
      expect(p['rejectAction']).toBe('switch_to_dry_run')
    })

    it('2. extraPayload は merge され、reserved key を上書きしない', () => {
      const p = buildGate12FireAuditPayload(makeRequest(), {
        prj_id: 'PRJ-019',
        // reserved key を上書き試行
        kind: 'attempt_override',
        outcome: 'attempt_override',
      })
      expect(p['prj_id']).toBe('PRJ-019')
      // reserved key は保護される
      expect(p['kind']).toBe('gate_12_fire')
      expect(p['outcome']).toBe('out_of_range')
    })
  })

  describe('buildGate12DecisionAuditPayload (純関数)', () => {
    it('3. approve decision payload', () => {
      const p = buildGate12DecisionAuditPayload(makeRequest(), {
        decision: 'approve',
        approveAction: 'switch_to_dry_run',
        decidedAt: FIXED_NOW_ISO,
        approver: 'owner',
      })
      expect(p['kind']).toBe('gate_12_decision')
      expect(p['decision']).toBe('approve')
      expect(p['approveAction']).toBe('switch_to_dry_run')
      expect(p['approver']).toBe('owner')
    })

    it('4. reject decision payload', () => {
      const p = buildGate12DecisionAuditPayload(makeRequest(), {
        decision: 'reject',
        rejectAction: 'halt',
        decidedAt: FIXED_NOW_ISO,
      })
      expect(p['decision']).toBe('reject')
      expect(p['rejectAction']).toBe('halt')
      // approveAction は含まれない (討議的に分離)
      expect(p['approveAction']).toBeUndefined()
    })

    it('5. defer decision payload', () => {
      const p = buildGate12DecisionAuditPayload(makeRequest(), {
        decision: 'defer',
        deferAction: 'recheck_in_next_boot',
        decidedAt: FIXED_NOW_ISO,
      })
      expect(p['decision']).toBe('defer')
      expect(p['deferAction']).toBe('recheck_in_next_boot')
    })
  })

  describe('fireGate12WithAudit (statement integration)', () => {
    it('6. approve 経路: fire + decision の 2 entry が append される', async () => {
      const { store, cleanup } = await makeFileAudit()
      try {
        const hitl = makeStubHitl({
          approved: true,
          reason: 'approved',
          approver: 'owner',
          decidedAt: FIXED_NOW_ISO,
        })
        const out = await fireGate12WithAudit({
          hitl,
          audit: store,
          request: makeRequest(),
        })
        expect(out.decision.decision).toBe('approve')
        expect(out.fireAuditEntry.id).toBe(1)
        expect(out.decisionAuditEntry.id).toBe(2)
        expect(out.fireAuditEntry.hash).not.toBe(out.decisionAuditEntry.hash)

        const events = await store.list()
        expect(events).toHaveLength(2)
        expect((events[0]!.payload as { kind: string }).kind).toBe('gate_12_fire')
        expect((events[1]!.payload as { kind: string }).kind).toBe('gate_12_decision')
      } finally {
        await cleanup()
      }
    })

    it('7. reject 経路: decision payload に rejectAction が記録される', async () => {
      const { store, cleanup } = await makeFileAudit()
      try {
        const hitl = makeStubHitl({
          approved: false,
          reason: 'rejected',
          decidedAt: FIXED_NOW_ISO,
        })
        const out = await fireGate12WithAudit({
          hitl,
          audit: store,
          request: makeRequest({ rejectAction: 'halt' }),
        })
        expect(out.decision.decision).toBe('reject')
        const events = await store.list()
        expect(
          (events[1]!.payload as { rejectAction: string }).rejectAction,
        ).toBe('halt')
      } finally {
        await cleanup()
      }
    })

    it('8. defer 経路 (timeout): deferAction=recheck_in_next_boot', async () => {
      const { store, cleanup } = await makeFileAudit()
      try {
        const hitl = makeStubHitl({
          approved: false,
          reason: 'timeout',
          decidedAt: FIXED_NOW_ISO,
        })
        const out = await fireGate12WithAudit({
          hitl,
          audit: store,
          request: makeRequest(),
        })
        expect(out.decision.decision).toBe('defer')
        const events = await store.list()
        expect(
          (events[1]!.payload as { deferAction: string }).deferAction,
        ).toBe('recheck_in_next_boot')
      } finally {
        await cleanup()
      }
    })

    it('9. SHA-256 chain integrity: fire.hash → decision.prevHash 一致', async () => {
      const { store, cleanup } = await makeFileAudit()
      try {
        const hitl = makeStubHitl({
          approved: true,
          reason: 'approved',
          decidedAt: FIXED_NOW_ISO,
        })
        await fireGate12WithAudit({
          hitl,
          audit: store,
          request: makeRequest(),
        })
        const events: AuditEvent[] = await store.list()
        // chain: events[0].hash === events[1].prevHash
        expect(events[1]!.prevHash).toBe(events[0]!.hash)
        const v = await store.verifyHashChain()
        expect(v.valid).toBe(true)
        expect(v.totalChecked).toBe(2)
      } finally {
        await cleanup()
      }
    })

    it('10. verifyChain=true で chain 整合が in-line 検証される', async () => {
      const { store, cleanup } = await makeFileAudit()
      try {
        const hitl = makeStubHitl({
          approved: true,
          reason: 'approved',
          decidedAt: FIXED_NOW_ISO,
        })
        const out = await fireGate12WithAudit({
          hitl,
          audit: store,
          request: makeRequest(),
          verifyChain: true,
        })
        expect(out.chainSnapshot.fireHash).toBe(out.fireAuditEntry.hash)
        expect(out.chainSnapshot.decisionHash).toBe(out.decisionAuditEntry.hash)
      } finally {
        await cleanup()
      }
    })

    it('11. fire 後に hitl が throw → fire entry のみ残る (decision なし)', async () => {
      const { store, cleanup } = await makeFileAudit()
      try {
        const hitl: HitlGate = {
          requestApproval: vi.fn().mockRejectedValue(new Error('hitl failure')),
          listPending: vi.fn().mockResolvedValue([]),
          decide: vi.fn().mockResolvedValue(undefined),
        }
        await expect(
          fireGate12WithAudit({
            hitl,
            audit: store,
            request: makeRequest(),
          }),
        ).rejects.toThrow(/hitl failure/)
        const events = await store.list()
        expect(events).toHaveLength(1)
        expect((events[0]!.payload as { kind: string }).kind).toBe('gate_12_fire')
      } finally {
        await cleanup()
      }
    })

    it('12. extraPayload (prj_id) は fire / decision 両 entry に乗る', async () => {
      const { store, cleanup } = await makeFileAudit()
      try {
        const hitl = makeStubHitl({
          approved: true,
          reason: 'approved',
          decidedAt: FIXED_NOW_ISO,
        })
        await fireGate12WithAudit({
          hitl,
          audit: store,
          request: makeRequest(),
          extraPayload: { prj_id: 'PRJ-019', round: 15 },
        })
        const events = await store.list()
        expect((events[0]!.payload as { prj_id: string }).prj_id).toBe('PRJ-019')
        expect((events[1]!.payload as { prj_id: string }).prj_id).toBe('PRJ-019')
        expect((events[0]!.payload as { round: number }).round).toBe(15)
      } finally {
        await cleanup()
      }
    })

    it('13. chain integrity error: fire 後に外部から log 改ざんされたら verifyChain で throw', async () => {
      const { store, cleanup } = await makeFileAudit()
      try {
        // 第三者が事前に append (異 instance 経由) してから fire 経由で append → chain は通る
        // 外部 throw を発火させるには、verifyHashChain を mock してエラー化する
        const tamperedAudit: AuditLogStore = {
          append: vi.fn().mockResolvedValue({ id: 1, hash: 'fake-hash' }),
          list: vi.fn().mockResolvedValue([]),
          verifyHashChain: vi
            .fn()
            .mockResolvedValue({ valid: false, brokenAt: 1, totalChecked: 1 }),
          rotate: vi.fn().mockResolvedValue(0),
        }
        const hitl = makeStubHitl({
          approved: true,
          reason: 'approved',
          decidedAt: FIXED_NOW_ISO,
        })
        await expect(
          fireGate12WithAudit({
            hitl,
            audit: tamperedAudit,
            request: makeRequest(),
            verifyChain: true,
          }),
        ).rejects.toBeInstanceOf(Gate12ChainIntegrityError)
      } finally {
        await cleanup()
      }
    })
  })
})
