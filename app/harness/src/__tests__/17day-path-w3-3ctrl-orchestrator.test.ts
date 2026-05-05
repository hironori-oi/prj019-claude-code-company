/**
 * 17 day path W3 harness orchestrator 接続 (Round 19 第 1 弾, Dev-AA 担当)
 *
 * 担当 3 control: C-OC-03 / C-OC-04 / P-UI-02 (Dev-X scope 継承)
 *
 * Spec scope (W3 = harness orchestrator 接続段階):
 *   W2 で確立した cross-control invariants (28 件) を harness 側で end-to-end 駆動する
 *   際の orchestration shape / control invocation sequence / failure handling chain
 *   を検証する。
 *
 * 不可侵: P-UI-04 / P-UI-05 / P-UI-09 / HITL-10 (Dev-BB / Dev-Y 担当) には触れない。
 *
 * W3 invariants (本 file の 12 tests):
 *   O-1  cycle: major diff → projection → escalation 1 回呼出 → phaseGateBlocked=true
 *   O-2  cycle: soft-fail → escalation 0 回呼出 (W2 I-2 の harness 反映)
 *   O-3  cycle: patch / minor のみ → escalation 0 回呼出 (W2 I-3 の harness 反映)
 *   O-4  cycle: fixture_corrupted throw → CycleAbortedResult / escalation 0 回 (W2 I-9)
 *   O-5  cycle: fetch_timeout throw → abortReason='fetch_timeout' / escalation 0 回
 *   O-6  cycle: contractRunId が escalation payload に伝搬する (W2 I-10 反映)
 *   O-7  control invocation order: contract → escalation の順序保証
 *   O-8  cooldown gate: phase gate blocked と cooldown evaluation は独立軸
 *        (同 cycle 後でも cooldown 状態は port 結果のみで決まる, W2 I-5/I-11)
 *   O-9  cooldown gate: ackDeadline と nextAllowedAt は独立 timeline
 *        (W2 I-8 の harness 反映 — orchestrator は 2 軸を別々に提示する)
 *   O-10 W1 + W2 不変保証: port が同じ inputs を受け取れば出力も完全 deterministic
 *        (orchestrator は port 結果に副作用を加えない)
 *   O-11 multiple cycle: 連続 2 cycle で port は 2 回呼ばれ各々独立に判定される
 *   O-12 type guard: isCycleAborted は abort / non-abort を正しく弁別する
 */
import { describe, it, expect } from 'vitest'

import {
  createOpenClawOrchestrator,
  projectMajorDiffsToEscalation,
  isCycleAborted,
  type OocContractInput,
  type OocContractOutput,
  type OocEscalationInput,
  type OocEscalationOutput,
  type OocCooldownInput,
  type OocCooldownOutput,
  type OpenClawOrchestratorPorts,
} from '../openclaw-orchestrator.js'

// ---------------------------------------------------------------------------
// Helpers — port factory (test 用 mock — control 単独挙動を W2 invariants の
//   sub-set として再現。control 本体には絶対に手を入れない)
// ---------------------------------------------------------------------------

interface PortInvocations {
  contractCalls: OocContractInput[]
  escalationCalls: OocEscalationInput[]
  cooldownCalls: OocCooldownInput[]
}

function makeInvocationsLog(): PortInvocations {
  return { contractCalls: [], escalationCalls: [], cooldownCalls: [] }
}

interface MockPortsConfig {
  contract:
    | { kind: 'success'; output: OocContractOutput }
    | { kind: 'throw'; error: Error }
  escalation:
    | { kind: 'success'; output: OocEscalationOutput }
    | { kind: 'never_called' } // expected not to be invoked
  cooldown: OocCooldownOutput
}

function makeMockPorts(
  cfg: MockPortsConfig,
  log: PortInvocations,
): OpenClawOrchestratorPorts {
  return {
    runContractTest: async (input) => {
      log.contractCalls.push(input)
      if (cfg.contract.kind === 'throw') throw cfg.contract.error
      return cfg.contract.output
    },
    escalateBreakingChange: async (input) => {
      log.escalationCalls.push(input)
      if (cfg.escalation.kind === 'never_called') {
        throw new Error('escalation port should not have been called')
      }
      return cfg.escalation.output
    },
    evaluateCooldown: (input) => {
      log.cooldownCalls.push(input)
      return cfg.cooldown
    },
  }
}

const CONTRACT_INPUT: OocContractInput = {
  runId: 'CYC-1',
  upstreamRef: 'main',
  localFixturePath: '/tmp/fixture.json',
}

const DETECTED_AT = '2026-05-09T00:00:00.000Z'

const COOLDOWN_OK: OocCooldownOutput = {
  cooldownState: 'idle',
  remainingMs: 0,
  nextAllowedAt: '2026-05-09T00:00:30.000Z',
}

function majorContractOutput(): OocContractOutput {
  return {
    matched: false,
    diffs: [
      { field: '--required', before: 'string', after: '', severity: 'major' },
      { field: '--mode', before: 'fast', after: 'turbo', severity: 'patch' },
    ],
    reportPath: '/tmp/fixture.json.report.json',
    softFailed: false,
  }
}

function softFailContractOutput(): OocContractOutput {
  return {
    matched: true,
    diffs: [],
    reportPath: '/tmp/fixture.json.report.json',
    softFailed: true,
  }
}

function patchOnlyContractOutput(): OocContractOutput {
  return {
    matched: false,
    diffs: [
      { field: '--mode', before: 'fast', after: 'turbo', severity: 'patch' },
      { field: '--new-flag', before: '', after: 'on', severity: 'minor' },
    ],
    reportPath: '/tmp/fixture.json.report.json',
    softFailed: false,
  }
}

function escalationSuccess(contractRunId: string): OocEscalationOutput {
  return {
    escalationId: `COC04-${contractRunId}`,
    notifiedChannels: ['#drill', 'ceo@clawbridge.local'],
    failedChannels: [],
    phaseGateBlocked: true,
    ackDeadline: '2026-05-09T01:00:00.000Z',
    criticalLogged: false,
    reArmRequested: false,
  }
}

// ---------------------------------------------------------------------------
// O-1 .. O-7 — orchestration shape & failure handling chain
// ---------------------------------------------------------------------------

describe('W3 orchestrator — orchestration shape & control invocation chain', () => {
  it('O-1: major diff → projection → escalation 1 回 → phaseGateBlocked=true', async () => {
    const log = makeInvocationsLog()
    const orch = createOpenClawOrchestrator(
      makeMockPorts(
        {
          contract: { kind: 'success', output: majorContractOutput() },
          escalation: { kind: 'success', output: escalationSuccess('CYC-1') },
          cooldown: COOLDOWN_OK,
        },
        log,
      ),
    )
    const result = await orch.runOpenClawCycle({
      contract: CONTRACT_INPUT,
      detectedAt: DETECTED_AT,
    })
    expect(isCycleAborted(result)).toBe(false)
    if (isCycleAborted(result)) return
    expect(result.phaseGateBlocked).toBe(true)
    expect(result.chainOutcome.kind).toBe('escalation_fired')
    expect(log.contractCalls).toHaveLength(1)
    expect(log.escalationCalls).toHaveLength(1)
  })

  it('O-2: soft-fail → escalation 0 回 → chainOutcome=no_escalation_soft_fail', async () => {
    const log = makeInvocationsLog()
    const orch = createOpenClawOrchestrator(
      makeMockPorts(
        {
          contract: { kind: 'success', output: softFailContractOutput() },
          escalation: { kind: 'never_called' },
          cooldown: COOLDOWN_OK,
        },
        log,
      ),
    )
    const result = await orch.runOpenClawCycle({
      contract: CONTRACT_INPUT,
      detectedAt: DETECTED_AT,
    })
    expect(isCycleAborted(result)).toBe(false)
    if (isCycleAborted(result)) return
    expect(result.chainOutcome.kind).toBe('no_escalation_soft_fail')
    expect(result.phaseGateBlocked).toBe(false)
    expect(log.escalationCalls).toHaveLength(0)
  })

  it('O-3: patch / minor only → escalation 0 回 → chainOutcome=no_escalation_no_major', async () => {
    const log = makeInvocationsLog()
    const orch = createOpenClawOrchestrator(
      makeMockPorts(
        {
          contract: { kind: 'success', output: patchOnlyContractOutput() },
          escalation: { kind: 'never_called' },
          cooldown: COOLDOWN_OK,
        },
        log,
      ),
    )
    const result = await orch.runOpenClawCycle({
      contract: CONTRACT_INPUT,
      detectedAt: DETECTED_AT,
    })
    expect(isCycleAborted(result)).toBe(false)
    if (isCycleAborted(result)) return
    expect(result.chainOutcome.kind).toBe('no_escalation_no_major')
    expect(result.phaseGateBlocked).toBe(false)
    expect(log.escalationCalls).toHaveLength(0)
  })

  it('O-4: fixture_corrupted throw → CycleAbortedResult / escalation 0 回 (W2 I-9)', async () => {
    const log = makeInvocationsLog()
    const orch = createOpenClawOrchestrator(
      makeMockPorts(
        {
          contract: { kind: 'throw', error: new Error('fixture_corrupted') },
          escalation: { kind: 'never_called' },
          cooldown: COOLDOWN_OK,
        },
        log,
      ),
    )
    const result = await orch.runOpenClawCycle({
      contract: CONTRACT_INPUT,
      detectedAt: DETECTED_AT,
    })
    expect(isCycleAborted(result)).toBe(true)
    if (!isCycleAborted(result)) return
    expect(result.abortReason).toBe('fixture_corrupted')
    expect(result.contractRunId).toBe('CYC-1')
    expect(log.escalationCalls).toHaveLength(0)
  })

  it('O-5: fetch_timeout throw → abortReason=fetch_timeout / escalation 0 回', async () => {
    const log = makeInvocationsLog()
    const orch = createOpenClawOrchestrator(
      makeMockPorts(
        {
          contract: { kind: 'throw', error: new Error('fetch_timeout') },
          escalation: { kind: 'never_called' },
          cooldown: COOLDOWN_OK,
        },
        log,
      ),
    )
    const result = await orch.runOpenClawCycle({
      contract: CONTRACT_INPUT,
      detectedAt: DETECTED_AT,
    })
    expect(isCycleAborted(result)).toBe(true)
    if (!isCycleAborted(result)) return
    expect(result.abortReason).toBe('fetch_timeout')
    expect(log.escalationCalls).toHaveLength(0)
  })

  it('O-6: contractRunId propagates to escalation payload (W2 I-10 反映)', async () => {
    const log = makeInvocationsLog()
    const customInput: OocContractInput = { ...CONTRACT_INPUT, runId: 'TRACE-77' }
    const orch = createOpenClawOrchestrator(
      makeMockPorts(
        {
          contract: { kind: 'success', output: majorContractOutput() },
          escalation: { kind: 'success', output: escalationSuccess('TRACE-77') },
          cooldown: COOLDOWN_OK,
        },
        log,
      ),
    )
    const result = await orch.runOpenClawCycle({
      contract: customInput,
      detectedAt: DETECTED_AT,
    })
    expect(isCycleAborted(result)).toBe(false)
    if (isCycleAborted(result)) return
    if (result.chainOutcome.kind !== 'escalation_fired') {
      throw new Error('expected escalation_fired')
    }
    expect(log.escalationCalls[0]?.contractRunId).toBe('TRACE-77')
    expect(result.chainOutcome.escalation.escalationId).toContain('TRACE-77')
  })

  it('O-7: invocation order = contract first, escalation second (sequence guarantee)', async () => {
    const order: string[] = []
    const orch = createOpenClawOrchestrator({
      runContractTest: async (input) => {
        order.push(`contract:${input.runId}`)
        return majorContractOutput()
      },
      escalateBreakingChange: async (input) => {
        order.push(`escalation:${input.contractRunId}`)
        return escalationSuccess(input.contractRunId)
      },
      evaluateCooldown: (i) => {
        order.push(`cooldown:${i.loopId}`)
        return COOLDOWN_OK
      },
    })
    await orch.runOpenClawCycle({ contract: CONTRACT_INPUT, detectedAt: DETECTED_AT })
    expect(order).toEqual(['contract:CYC-1', 'escalation:CYC-1'])
  })
})

// ---------------------------------------------------------------------------
// O-8 .. O-9 — phase gate ↔ cooldown 独立軸
// ---------------------------------------------------------------------------

describe('W3 orchestrator — phase gate vs cooldown independence', () => {
  it('O-8: phase gate blocked AND cooldown active → 2 軸が独立に評価される', async () => {
    const log = makeInvocationsLog()
    const cooldownActive: OocCooldownOutput = {
      cooldownState: 'active',
      remainingMs: 25_000,
      nextAllowedAt: '2026-05-09T00:00:30.000Z',
    }
    const orch = createOpenClawOrchestrator(
      makeMockPorts(
        {
          contract: { kind: 'success', output: majorContractOutput() },
          escalation: { kind: 'success', output: escalationSuccess('CYC-1') },
          cooldown: cooldownActive,
        },
        log,
      ),
    )
    const cycleResult = await orch.runOpenClawCycle({
      contract: CONTRACT_INPUT,
      detectedAt: DETECTED_AT,
    })
    const cooldownInput: OocCooldownInput = {
      triggerEvent: 'kill_switch',
      abortedAt: DETECTED_AT,
      loopId: 'L-indep',
    }
    const cooldownResult = orch.evaluateCooldownGate(cooldownInput)

    expect(isCycleAborted(cycleResult)).toBe(false)
    if (isCycleAborted(cycleResult)) return
    expect(cycleResult.phaseGateBlocked).toBe(true)
    // cooldown 結果は cycle と完全独立 (port 結果そのまま)
    expect(cooldownResult).toEqual(cooldownActive)
    expect(log.cooldownCalls).toHaveLength(1)
    expect(log.cooldownCalls[0]).toEqual(cooldownInput)
  })

  it('O-9: ackDeadline (1h) と nextAllowedAt (30s) は独立 timeline (2 軸提示)', async () => {
    const log = makeInvocationsLog()
    const ackDeadlineFuture = '2026-05-09T01:00:00.000Z' // detectedAt + 1h
    const nextAllowedSoon = '2026-05-09T00:00:30.000Z' // abortedAt + 30s
    const cooldownActive: OocCooldownOutput = {
      cooldownState: 'active',
      remainingMs: 30_000,
      nextAllowedAt: nextAllowedSoon,
    }
    const escalationOut: OocEscalationOutput = {
      ...escalationSuccess('CYC-1'),
      ackDeadline: ackDeadlineFuture,
    }
    const orch = createOpenClawOrchestrator(
      makeMockPorts(
        {
          contract: { kind: 'success', output: majorContractOutput() },
          escalation: { kind: 'success', output: escalationOut },
          cooldown: cooldownActive,
        },
        log,
      ),
    )
    const cycleResult = await orch.runOpenClawCycle({
      contract: CONTRACT_INPUT,
      detectedAt: DETECTED_AT,
    })
    const cooldownResult = orch.evaluateCooldownGate({
      triggerEvent: 'kill_switch',
      abortedAt: DETECTED_AT,
      loopId: 'L-tl',
    })
    if (isCycleAborted(cycleResult)) throw new Error('not aborted')
    if (cycleResult.chainOutcome.kind !== 'escalation_fired') {
      throw new Error('expected escalation_fired')
    }
    const ackMs = Date.parse(cycleResult.chainOutcome.escalation.ackDeadline)
    const nextAllowedMs = Date.parse(cooldownResult.nextAllowedAt)
    expect(ackMs).toBeGreaterThan(nextAllowedMs)
    // 1h - 30s = 3,570,000 ms
    expect(ackMs - nextAllowedMs).toBe(60 * 60 * 1000 - 30 * 1000)
  })
})

// ---------------------------------------------------------------------------
// O-10 .. O-12 — determinism, multi-cycle, type guard
// ---------------------------------------------------------------------------

describe('W3 orchestrator — determinism / multi-cycle / type guard', () => {
  it('O-10: deterministic — 同じ port 出力 → 同じ orchestrator 出力 (副作用なし)', async () => {
    const cfg: MockPortsConfig = {
      contract: { kind: 'success', output: majorContractOutput() },
      escalation: { kind: 'success', output: escalationSuccess('CYC-1') },
      cooldown: COOLDOWN_OK,
    }
    const log1 = makeInvocationsLog()
    const log2 = makeInvocationsLog()
    const orch1 = createOpenClawOrchestrator(makeMockPorts(cfg, log1))
    const orch2 = createOpenClawOrchestrator(makeMockPorts(cfg, log2))
    const r1 = await orch1.runOpenClawCycle({
      contract: CONTRACT_INPUT,
      detectedAt: DETECTED_AT,
    })
    const r2 = await orch2.runOpenClawCycle({
      contract: CONTRACT_INPUT,
      detectedAt: DETECTED_AT,
    })
    expect(r1).toEqual(r2)
  })

  it('O-11: 連続 2 cycle → port は計 2 回 / 各々独立判定 (state leak なし)', async () => {
    const log = makeInvocationsLog()
    let callCount = 0
    const orch = createOpenClawOrchestrator({
      runContractTest: async (input) => {
        log.contractCalls.push(input)
        callCount += 1
        // 1 回目: major / 2 回目: soft-fail
        return callCount === 1 ? majorContractOutput() : softFailContractOutput()
      },
      escalateBreakingChange: async (input) => {
        log.escalationCalls.push(input)
        return escalationSuccess(input.contractRunId)
      },
      evaluateCooldown: (i) => {
        log.cooldownCalls.push(i)
        return COOLDOWN_OK
      },
    })
    const r1 = await orch.runOpenClawCycle({
      contract: { ...CONTRACT_INPUT, runId: 'CYC-A' },
      detectedAt: DETECTED_AT,
    })
    const r2 = await orch.runOpenClawCycle({
      contract: { ...CONTRACT_INPUT, runId: 'CYC-B' },
      detectedAt: DETECTED_AT,
    })
    expect(log.contractCalls).toHaveLength(2)
    expect(log.escalationCalls).toHaveLength(1) // 1 回目のみ escalation
    if (isCycleAborted(r1) || isCycleAborted(r2)) throw new Error('unexpected abort')
    expect(r1.chainOutcome.kind).toBe('escalation_fired')
    expect(r2.chainOutcome.kind).toBe('no_escalation_soft_fail')
  })

  it('O-12: isCycleAborted type guard — abort / non-abort 弁別 + projection helper の整合', () => {
    const aborted = {
      contractRunId: 'X',
      aborted: true as const,
      abortReason: 'fixture_corrupted' as const,
      cause: new Error('fixture_corrupted'),
    }
    const ok = {
      contractRunId: 'X',
      contractOutput: softFailContractOutput(),
      chainOutcome: { kind: 'no_escalation_soft_fail' as const },
      phaseGateBlocked: false,
    }
    expect(isCycleAborted(aborted)).toBe(true)
    expect(isCycleAborted(ok)).toBe(false)
    // projection helper の独立検証 (W2 I-1 / I-2 / I-3 と一致)
    expect(projectMajorDiffsToEscalation('X', softFailContractOutput(), DETECTED_AT)).toEqual({
      kind: 'no_escalation',
      reason: 'soft_fail',
    })
    expect(projectMajorDiffsToEscalation('X', patchOnlyContractOutput(), DETECTED_AT)).toEqual({
      kind: 'no_escalation',
      reason: 'no_major_diff',
    })
    const proj = projectMajorDiffsToEscalation('X', majorContractOutput(), DETECTED_AT)
    expect(proj.kind).toBe('escalate')
    if (proj.kind === 'escalate') {
      expect(proj.payload.majorDiffs).toHaveLength(1)
      expect(proj.payload.majorDiffs[0]?.field).toBe('--required')
    }
  })
})
