/**
 * 17 day path W2 cross-control invariants (Round 18 第 1 弾, Dev-X 担当)
 *
 * 担当 3 control: C-OC-03 / C-OC-04 / P-UI-02
 * Spec scope (W2 = 統合段階): 各 control が単独で正しく動くこと (W1) は前提とし、
 * cross-control invariants (control 間で副作用を持つ chain / 整合) を検証する。
 *
 * 不可侵: P-UI-04 / P-UI-05 / P-UI-09 / HITL-10 (Dev-Y 担当) のテストはここで増やさない。
 *
 * W2 invariants (Dev-X 第 1 弾 範囲):
 *   I-1  C-OC-03 major diff → C-OC-04 EscalationInput shape conformance
 *        (ContractOutput.diffs[severity=major] → MajorDiff[] payload に zod 適合)
 *   I-2  C-OC-03 soft-fail (upstream 取得失敗) → C-OC-04 escalation を呼ばない
 *        (matched=true / softFailed=true は major diff ではない)
 *   I-3  C-OC-03 patch / minor のみ → C-OC-04 escalation を呼ばない
 *   I-4  C-OC-03 → C-OC-04 chain end-to-end: major detect → escalation 成功 → phaseGate=true
 *   I-5  C-OC-04 phaseGateBlocked=true は P-UI-02 cooldown 状態を不変にする
 *        (gate block は cooldown evaluation に副作用を持たない = 純関数性の invariant)
 *   I-6  P-UI-02 cooldown trigger='kill_switch' 直後 → 必ず active (expired にならない)
 *   I-7  P-UI-02 multi-trigger は最後勝ち (再 trigger で残り時間がリセットされる)
 *   I-8  C-OC-04 ackDeadline (1h SLA) と P-UI-02 cooldown window (30s) は独立タイムライン
 *        (ackDeadline は cooldown 終了 (next-allowed) より遥か未来)
 *   I-9  C-OC-03 fixture_corrupted throw は C-OC-04 escalation を呼ばない
 *   I-10 C-OC-03 → C-OC-04 chain で contractRunId が伝搬する (escalationId 経由で trace 可能)
 *   I-11 P-UI-02 override は C-OC-04 escalation phaseGateBlocked と独立 (cooldown 解除しても gate は別系統)
 */
import { describe, it, expect } from 'vitest'
import { z } from 'zod'

import {
  runContractTest,
  type ContractOutput,
} from '../c-oc-03-api-contract-test.js'
import {
  escalateBreakingChange,
  EscalationInputSchema,
  MajorDiffSchema,
  ESCALATION_SLA_MS,
  type EscalationOutput,
  type NotifierBundle,
} from '../c-oc-04-breaking-change-escalation.js'
import {
  evaluateCooldown,
  COOLDOWN_DURATION_MS,
  type CooldownOverrideChecker,
} from '../p-ui-02-cooldown-modal.js'

// ---------------------------------------------------------------------------
// Helper: C-OC-03 ContractOutput → C-OC-04 EscalationInput への純粋変換
// (W2 invariants の中で「chain 整合」を test するための pure helper。
//  実装本体には載せず test 内に閉じ込める = Public API 不変)
// ---------------------------------------------------------------------------

function projectMajorDiffsToEscalation(
  contractRunId: string,
  contractOut: ContractOutput,
  detectedAt: string,
):
  | { kind: 'no_escalation'; reason: 'soft_fail' | 'no_major_diff' }
  | { kind: 'escalate'; payload: z.infer<typeof EscalationInputSchema> } {
  if (contractOut.softFailed) return { kind: 'no_escalation', reason: 'soft_fail' }
  const majors = contractOut.diffs.filter((d) => d.severity === 'major')
  if (majors.length === 0) return { kind: 'no_escalation', reason: 'no_major_diff' }
  const payload = {
    contractRunId,
    majorDiffs: majors.map((d) => ({ field: d.field, before: d.before, after: d.after })),
    detectedAt,
  }
  return { kind: 'escalate', payload }
}

const ALWAYS_DELIVERED: NotifierBundle = {
  slack: async () => ({ delivered: true }),
  email: async () => ({ delivered: true }),
}

// ---------------------------------------------------------------------------
// I-1 / I-2 / I-3 / I-9 / I-10 — C-OC-03 → C-OC-04 chain shape & gating
// ---------------------------------------------------------------------------

describe('W2 invariant — C-OC-03 → C-OC-04 chain shape & gating', () => {
  it('I-1: major diff detected → projection conforms to EscalationInputSchema', async () => {
    const fixture = JSON.stringify({ '--input': 'string', '--output': 'path' })
    const upstream = JSON.stringify({ '--input': 'string' }) // --output 削除 = major
    const contractOut = await runContractTest(
      { runId: 'CHAIN-1', upstreamRef: 'main', localFixturePath: '/tmp/f.json' },
      { fetch: async () => ({ ok: true, body: upstream }) },
      { fixtureLoader: async () => fixture },
    )
    expect(contractOut.matched).toBe(false)
    const projected = projectMajorDiffsToEscalation(
      'CHAIN-1',
      contractOut,
      '2026-05-09T00:00:00.000Z',
    )
    expect(projected.kind).toBe('escalate')
    if (projected.kind !== 'escalate') return
    // zod schema 適合性 — chain の payload contract 不変
    expect(() => EscalationInputSchema.parse(projected.payload)).not.toThrow()
    expect(projected.payload.majorDiffs.length).toBeGreaterThanOrEqual(1)
    // 個々の MajorDiff も zod 適合
    for (const md of projected.payload.majorDiffs) {
      expect(() => MajorDiffSchema.parse(md)).not.toThrow()
    }
  })

  it('I-2: soft-fail → no escalation (chain MUST NOT trigger C-OC-04)', async () => {
    const contractOut = await runContractTest(
      { runId: 'CHAIN-2', upstreamRef: 'main', localFixturePath: '/tmp/f.json' },
      { fetch: async () => ({ ok: false }) },
      { maxRetries: 2 },
    )
    expect(contractOut.softFailed).toBe(true)
    const projected = projectMajorDiffsToEscalation(
      'CHAIN-2',
      contractOut,
      '2026-05-09T00:00:00.000Z',
    )
    expect(projected.kind).toBe('no_escalation')
    if (projected.kind === 'no_escalation') {
      expect(projected.reason).toBe('soft_fail')
    }
  })

  it('I-3: only patch / minor diffs → no escalation', async () => {
    const fixture = JSON.stringify({ '--mode': 'fast' })
    const upstream = JSON.stringify({ '--mode': 'turbo', '--new-flag': 'on' })
    const contractOut = await runContractTest(
      { runId: 'CHAIN-3', upstreamRef: 'main', localFixturePath: '/tmp/f.json' },
      { fetch: async () => ({ ok: true, body: upstream }) },
      { fixtureLoader: async () => fixture },
    )
    // patch (--mode 値変更) + minor (--new-flag 追加) — major は無し
    expect(contractOut.diffs.some((d) => d.severity === 'major')).toBe(false)
    const projected = projectMajorDiffsToEscalation(
      'CHAIN-3',
      contractOut,
      '2026-05-09T00:00:00.000Z',
    )
    expect(projected.kind).toBe('no_escalation')
    if (projected.kind === 'no_escalation') {
      expect(projected.reason).toBe('no_major_diff')
    }
  })

  it('I-4: major diff → escalation success → phaseGateBlocked=true (full chain)', async () => {
    const fixture = JSON.stringify({ '--required': 'string' })
    const upstream = JSON.stringify({}) // 全削除 = major
    const contractOut = await runContractTest(
      { runId: 'CHAIN-4', upstreamRef: 'main', localFixturePath: '/tmp/f.json' },
      { fetch: async () => ({ ok: true, body: upstream }) },
      { fixtureLoader: async () => fixture },
    )
    const projected = projectMajorDiffsToEscalation(
      'CHAIN-4',
      contractOut,
      '2026-05-09T00:00:00.000Z',
    )
    if (projected.kind !== 'escalate') {
      throw new Error('expected escalate')
    }
    const escalated: EscalationOutput = await escalateBreakingChange(
      projected.payload,
      ALWAYS_DELIVERED,
      { retryDelay: () => Promise.resolve() },
    )
    expect(escalated.phaseGateBlocked).toBe(true)
    expect(escalated.escalationId).toBe('COC04-CHAIN-4')
  })

  it('I-9: fixture_corrupted throw → chain aborts before escalation', async () => {
    let escalateCalls = 0
    const wrappedNotifier: NotifierBundle = {
      slack: async () => {
        escalateCalls++
        return { delivered: true }
      },
      email: async () => {
        escalateCalls++
        return { delivered: true }
      },
    }
    let chainReachedEscalation = false
    try {
      const out = await runContractTest(
        { runId: 'CHAIN-9', upstreamRef: 'main', localFixturePath: '/tmp/f.json' },
        { fetch: async () => ({ ok: true, body: '{}' }) },
        { fixtureLoader: async () => Promise.reject(new Error('disk_fail')) },
      )
      // 到達不能のはず
      const projected = projectMajorDiffsToEscalation('CHAIN-9', out, '2026-05-09T00:00:00.000Z')
      if (projected.kind === 'escalate') {
        chainReachedEscalation = true
        await escalateBreakingChange(projected.payload, wrappedNotifier, {
          retryDelay: () => Promise.resolve(),
        })
      }
    } catch (e) {
      expect((e as Error).message).toBe('fixture_corrupted')
    }
    expect(chainReachedEscalation).toBe(false)
    expect(escalateCalls).toBe(0)
  })

  it('I-10: contractRunId propagates to escalationId (trace continuity)', async () => {
    const fixture = JSON.stringify({ a: 'x' })
    const upstream = JSON.stringify({})
    const out = await runContractTest(
      { runId: 'TRACE-77', upstreamRef: 'main', localFixturePath: '/tmp/f.json' },
      { fetch: async () => ({ ok: true, body: upstream }) },
      { fixtureLoader: async () => fixture },
    )
    const projected = projectMajorDiffsToEscalation(
      'TRACE-77',
      out,
      '2026-05-09T00:00:00.000Z',
    )
    if (projected.kind !== 'escalate') throw new Error('expected escalate')
    const escalated = await escalateBreakingChange(projected.payload, ALWAYS_DELIVERED, {
      retryDelay: () => Promise.resolve(),
    })
    expect(escalated.escalationId).toContain('TRACE-77')
  })
})

// ---------------------------------------------------------------------------
// I-5 / I-8 / I-11 — C-OC-04 ↔ P-UI-02 timeline / state independence
// ---------------------------------------------------------------------------

describe('W2 invariant — C-OC-04 ↔ P-UI-02 timeline & state independence', () => {
  it('I-5: phaseGateBlocked does not perturb cooldown evaluation (purity)', async () => {
    const ABORTED_AT = '2026-05-09T00:00:00.000Z'
    const ABORTED_AT_MS = Date.parse(ABORTED_AT)

    const beforeEsc = evaluateCooldown(
      { triggerEvent: 'loop_abort', abortedAt: ABORTED_AT, loopId: 'L-coh-1' },
      { now: () => ABORTED_AT_MS + 5_000 },
    )

    // C-OC-04 escalation 発火
    const escalated = await escalateBreakingChange(
      {
        contractRunId: 'COH-1',
        majorDiffs: [{ field: 'cli.flag', before: '--x', after: '--y' }],
        detectedAt: ABORTED_AT,
      },
      ALWAYS_DELIVERED,
      { retryDelay: () => Promise.resolve() },
    )
    expect(escalated.phaseGateBlocked).toBe(true)

    // 同じ inputs で再評価 → cooldown 判定は不変 (副作用なし)
    const afterEsc = evaluateCooldown(
      { triggerEvent: 'loop_abort', abortedAt: ABORTED_AT, loopId: 'L-coh-1' },
      { now: () => ABORTED_AT_MS + 5_000 },
    )
    expect(afterEsc).toEqual(beforeEsc)
  })

  it('I-8: ackDeadline (1h) is far beyond cooldown nextAllowedAt (30s)', async () => {
    const ABORTED_AT = '2026-05-09T00:00:00.000Z'
    const ABORTED_AT_MS = Date.parse(ABORTED_AT)
    const cooldownOut = evaluateCooldown(
      { triggerEvent: 'kill_switch', abortedAt: ABORTED_AT, loopId: 'L-tl' },
      { now: () => ABORTED_AT_MS },
    )
    const escalated = await escalateBreakingChange(
      {
        contractRunId: 'TL-1',
        majorDiffs: [{ field: 'cli.flag', before: '--x', after: '--y' }],
        detectedAt: ABORTED_AT,
      },
      ALWAYS_DELIVERED,
      { retryDelay: () => Promise.resolve() },
    )
    const ackMs = Date.parse(escalated.ackDeadline)
    const nextAllowedMs = Date.parse(cooldownOut.nextAllowedAt)
    expect(ackMs - nextAllowedMs).toBe(ESCALATION_SLA_MS - COOLDOWN_DURATION_MS)
    expect(ackMs).toBeGreaterThan(nextAllowedMs)
  })

  it('I-11: P-UI-02 override does NOT unblock C-OC-04 phaseGateBlocked', async () => {
    const ABORTED_AT = '2026-05-09T00:00:00.000Z'
    const ABORTED_AT_MS = Date.parse(ABORTED_AT)
    const override: CooldownOverrideChecker = { isOverridden: () => true }
    const cooldownOut = evaluateCooldown(
      { triggerEvent: 'manual_stop', abortedAt: ABORTED_AT, loopId: 'L-ind' },
      { now: () => ABORTED_AT_MS + 3_000 },
      override,
    )
    expect(cooldownOut.cooldownState).toBe('overridden')

    const escalated = await escalateBreakingChange(
      {
        contractRunId: 'IND-1',
        majorDiffs: [{ field: 'cli.flag', before: '--x', after: '--y' }],
        detectedAt: ABORTED_AT,
      },
      ALWAYS_DELIVERED,
      { retryDelay: () => Promise.resolve() },
    )
    // override 済みでも phase gate は別系統 (C-OC-04 の責務) → block 維持
    expect(escalated.phaseGateBlocked).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// I-6 / I-7 — P-UI-02 cooldown semantics across triggers (W2 内部整合)
// ---------------------------------------------------------------------------

describe('W2 invariant — P-UI-02 cooldown trigger semantics', () => {
  it('I-6: kill_switch trigger at t=abortedAt → state must be active (never expired)', () => {
    const ABORTED_AT = '2026-05-09T00:00:00.000Z'
    const out = evaluateCooldown(
      { triggerEvent: 'kill_switch', abortedAt: ABORTED_AT, loopId: 'L-ks' },
      { now: () => Date.parse(ABORTED_AT) },
    )
    expect(out.cooldownState).toBe('active')
    expect(out.remainingMs).toBe(COOLDOWN_DURATION_MS)
  })

  it('I-7: re-trigger resets remaining time (last-write-wins)', () => {
    const FIRST = '2026-05-09T00:00:00.000Z'
    const SECOND = '2026-05-09T00:00:10.000Z' // 10s 後に再 trigger
    const SECOND_MS = Date.parse(SECOND)

    // 最初の trigger 経過 10s 時点で再 trigger された場合の評価:
    // 新 abortedAt=SECOND, now=SECOND → active / remaining=30s
    const out = evaluateCooldown(
      { triggerEvent: 'loop_abort', abortedAt: SECOND, loopId: 'L-rt' },
      { now: () => SECOND_MS },
    )
    expect(out.cooldownState).toBe('active')
    expect(out.remainingMs).toBe(COOLDOWN_DURATION_MS)

    // 一方、最初の abortedAt のまま now=SECOND_MS で評価 → remaining は 20s
    const oldEval = evaluateCooldown(
      { triggerEvent: 'loop_abort', abortedAt: FIRST, loopId: 'L-rt' },
      { now: () => SECOND_MS },
    )
    expect(oldEval.remainingMs).toBe(COOLDOWN_DURATION_MS - 10_000)
    // 再 trigger は確実に「リセットされた」と確認できる
    expect(out.remainingMs).toBeGreaterThan(oldEval.remainingMs)
  })
})
