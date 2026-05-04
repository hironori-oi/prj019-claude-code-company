/**
 * 17 day path 7 control — Vitest test stub (Round 16 第 2 波)
 * skeleton 段階につき副作用 0 の schema 検証 + skeleton 戻り値固定確認のみ。
 * 完成版テストは W1-W3 で各 control 実装と同時に追加。
 */
import { describe, it, expect } from 'vitest'

import {
  evaluateCooldown,
  CooldownInputSchema,
} from '../p-ui-02-cooldown-modal.js'
import {
  propagateKill,
  KillInputSchema,
} from '../p-ui-04-kill-switch-propagation.js'
import {
  detectAnomaly,
  AnomalyInputSchema,
} from '../p-ui-05-anomaly-rollback.js'
import {
  requestPermissionApproval,
  PermissionChangeInputSchema,
} from '../hitl-10-permission-change.js'
import {
  runContractTest,
  ContractInputSchema,
} from '../c-oc-03-api-contract-test.js'
import {
  escalateBreakingChange,
  EscalationInputSchema,
} from '../c-oc-04-breaking-change-escalation.js'
import {
  runRlsChecklist,
  RlsInputSchema,
} from '../p-ui-09-rls-checklist.js'

describe('17day-path 7 control skeletons', () => {
  it('P-UI-02 input schema rejects empty loopId', () => {
    expect(() =>
      CooldownInputSchema.parse({
        triggerEvent: 'loop_abort',
        abortedAt: new Date().toISOString(),
        loopId: '',
      }),
    ).toThrow()
  })

  it('P-UI-02 skeleton returns idle state', () => {
    const out = evaluateCooldown(
      { triggerEvent: 'loop_abort', abortedAt: new Date().toISOString(), loopId: 'L-1' },
      { now: () => 0 },
    )
    expect(out.cooldownState).toBe('idle')
  })

  it('P-UI-04 input schema enforces positive pids', () => {
    expect(() =>
      KillInputSchema.parse({
        killReason: 'manual',
        initiatedAt: new Date().toISOString(),
        pidTree: [-1],
      }),
    ).toThrow()
  })

  it('P-UI-04 skeleton returns failed status (W1 fallback pending)', async () => {
    const out = await propagateKill(
      { killReason: 'test', initiatedAt: new Date().toISOString(), pidTree: [123] },
      { signal: async () => true },
    )
    expect(out.status).toBe('failed')
    expect(out.survivors).toEqual([123])
  })

  it('P-UI-05 NaN observed → metric_nan_skip', () => {
    const out = detectAnomaly(
      { metric: 'cost_per_loop', observedValue: Number.NaN, threshold: 1, loopId: 'L-2' },
      { consecutiveBreaches: 0, lastLoopId: null },
    )
    expect(out.reason).toBe('metric_nan_skip')
  })

  it('P-UI-05 schema rejects non-positive threshold', () => {
    expect(() =>
      AnomalyInputSchema.parse({
        metric: 'cost_per_loop',
        observedValue: 1,
        threshold: 0,
        loopId: 'L-3',
      }),
    ).toThrow()
  })

  it('HITL-10 returns pending with deterministic ticket prefix', async () => {
    const out = await requestPermissionApproval(
      {
        changeType: 'env',
        before: 'A',
        after: 'B',
        requesterRole: 'dev',
        rationale: 'test',
      },
      { notify: async () => ({ delivered: true }) },
      () => 1_700_000_000_000,
    )
    expect(out.approvalState).toBe('pending')
    expect(out.ticketId.startsWith('HITL10-')).toBe(true)
  })

  it('HITL-10 schema requires non-empty rationale', () => {
    expect(() =>
      PermissionChangeInputSchema.parse({
        changeType: 'env',
        before: '',
        after: '',
        requesterRole: 'dev',
        rationale: '',
      }),
    ).toThrow()
  })

  it('C-OC-03 skeleton returns matched=true (no diff engine yet)', async () => {
    const out = await runContractTest(
      { runId: 'R1', upstreamRef: 'main', localFixturePath: '/tmp/fix.json' },
      { fetch: async () => ({ ok: true, body: '{}' }) },
    )
    expect(out.matched).toBe(true)
    expect(out.diffs.length).toBe(0)
  })

  it('C-OC-03 schema rejects empty runId', () => {
    expect(() =>
      ContractInputSchema.parse({ runId: '', upstreamRef: 'x', localFixturePath: 'y' }),
    ).toThrow()
  })

  it('C-OC-04 phaseGateBlocked is true on detection', async () => {
    const out = await escalateBreakingChange(
      {
        contractRunId: 'R1',
        majorDiffs: [{ field: 'cli.flag', before: '--x', after: '--y' }],
        detectedAt: new Date('2026-05-09T00:00:00Z').toISOString(),
      },
      {
        slack: async () => ({ delivered: true }),
        email: async () => ({ delivered: true }),
      },
    )
    expect(out.phaseGateBlocked).toBe(true)
    expect(out.escalationId).toContain('COC04-')
  })

  it('C-OC-04 schema rejects empty majorDiffs', () => {
    expect(() =>
      EscalationInputSchema.parse({
        contractRunId: 'R',
        majorDiffs: [],
        detectedAt: new Date().toISOString(),
      }),
    ).toThrow()
  })

  it('P-UI-09 skeleton returns totalCases = matrix length', async () => {
    const out = await runRlsChecklist(
      {
        matrix: [
          { role: 'admin', operation: 'select', tenant: 't1', expected: 'allow' },
          { role: 'guest', operation: 'delete', tenant: 't1', expected: 'deny' },
        ],
      },
      { execute: async () => ({ outcome: 'allow' }) },
    )
    expect(out.totalCases).toBe(2)
    expect(out.failures).toEqual([])
  })

  it('P-UI-09 schema rejects empty matrix', () => {
    expect(() => RlsInputSchema.parse({ matrix: [] })).toThrow()
  })
})
