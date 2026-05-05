/**
 * 17 day path W3 — OpenClaw orchestrator (Round 19 Dev-AA, Dev-X scope 継承)
 *
 * 担当 3 control: C-OC-03 / C-OC-04 / P-UI-02
 * Spec scope (W3 = harness orchestrator 接続段階):
 *   W2 で確立した cross-control invariants を harness 側で end-to-end 駆動する
 *   整合性レイヤを提供する。
 *
 * 不可侵: P-UI-04 / P-UI-05 / P-UI-09 / HITL-10 (Dev-BB / Dev-Y 担当) には触れない。
 * Public API of any underlying control unchanged — port 注入のみで harness と接続。
 *
 * ===== 設計原則 =====
 * 1. 依存方向: harness → openclaw-runtime は禁止 (openclaw-runtime が harness に依存する側)。
 *    したがって本 orchestrator は **control-agnostic** であり、3 ctrl の関数を port として
 *    injection で受け取る。型は構造的部分型 (zod 等の重い参照を避ける) で記述。
 * 2. W1 + W2 不変保証: control 単独の挙動は port 経由で完全に preserve される。
 * 3. orchestration shape は 4 段階の chain: contract → projection → escalation → cooldown gate。
 * 4. failure handling chain:
 *      - fixture_corrupted throw   → abort orchestration (escalation 不発火)
 *      - soft-fail (matched=true,softFailed=true) → escalation skip / no-op return
 *      - patch / minor のみ        → escalation skip / no-op return
 *      - major diff 検出           → escalation 起動 → phaseGateBlocked=true
 * 5. cooldown evaluation は phase gate と独立軸 (W2 I-5 / I-11 invariant の harness 反映)。
 */

// ============================================================================
// 構造的型 (openclaw-runtime 控除型 — 依存を発生させない)
// ============================================================================

export interface OocContractDiff {
  readonly field: string
  readonly before: string
  readonly after: string
  readonly severity: 'major' | 'minor' | 'patch'
}

export interface OocContractInput {
  readonly runId: string
  readonly upstreamRef: string
  readonly localFixturePath: string
}

export interface OocContractOutput {
  readonly matched: boolean
  readonly diffs: ReadonlyArray<OocContractDiff>
  readonly reportPath: string
  readonly softFailed: boolean
}

export interface OocMajorDiff {
  readonly field: string
  readonly before: string
  readonly after: string
}

export interface OocEscalationInput {
  readonly contractRunId: string
  readonly majorDiffs: ReadonlyArray<OocMajorDiff>
  readonly detectedAt: string
}

export interface OocEscalationOutput {
  readonly escalationId: string
  readonly notifiedChannels: ReadonlyArray<string>
  readonly failedChannels: ReadonlyArray<string>
  readonly phaseGateBlocked: boolean
  readonly ackDeadline: string
  readonly criticalLogged: boolean
  readonly reArmRequested: boolean
}

export interface OocCooldownInput {
  readonly triggerEvent: 'loop_abort' | 'manual_stop' | 'kill_switch'
  readonly abortedAt: string
  readonly loopId: string
}

export interface OocCooldownOutput {
  readonly cooldownState: 'idle' | 'active' | 'expired' | 'overridden'
  readonly remainingMs: number
  readonly nextAllowedAt: string
}

// ============================================================================
// Port 定義 (control 関数の構造的 contract)
// ============================================================================

export type RunContractTestPort = (input: OocContractInput) => Promise<OocContractOutput>
export type EscalateBreakingChangePort = (
  input: OocEscalationInput,
) => Promise<OocEscalationOutput>
export type EvaluateCooldownPort = (input: OocCooldownInput) => OocCooldownOutput

export interface OpenClawOrchestratorPorts {
  readonly runContractTest: RunContractTestPort
  readonly escalateBreakingChange: EscalateBreakingChangePort
  readonly evaluateCooldown: EvaluateCooldownPort
}

export interface OpenClawCycleInput {
  readonly contract: OocContractInput
  readonly detectedAt: string
}

export interface OpenClawCycleResult {
  readonly contractRunId: string
  readonly contractOutput: OocContractOutput
  readonly chainOutcome:
    | { readonly kind: 'no_escalation_soft_fail' }
    | { readonly kind: 'no_escalation_no_major' }
    | { readonly kind: 'escalation_fired'; readonly escalation: OocEscalationOutput }
  readonly phaseGateBlocked: boolean
}

export interface OpenClawCycleAbortedResult {
  readonly contractRunId: string
  readonly aborted: true
  readonly abortReason: 'fixture_corrupted' | 'fetch_timeout' | 'unknown'
  readonly cause: Error
}

// ============================================================================
// 純関数 helper (W2 I-1 ~ I-3, I-9 整合の harness 側反映)
// ============================================================================

interface ProjectionEscalate {
  readonly kind: 'escalate'
  readonly payload: OocEscalationInput
}
interface ProjectionNoEscalation {
  readonly kind: 'no_escalation'
  readonly reason: 'soft_fail' | 'no_major_diff'
}
type Projection = ProjectionEscalate | ProjectionNoEscalation

export function projectMajorDiffsToEscalation(
  contractRunId: string,
  contractOut: OocContractOutput,
  detectedAt: string,
): Projection {
  if (contractOut.softFailed) {
    return { kind: 'no_escalation', reason: 'soft_fail' }
  }
  const majors = contractOut.diffs.filter((d) => d.severity === 'major')
  if (majors.length === 0) {
    return { kind: 'no_escalation', reason: 'no_major_diff' }
  }
  return {
    kind: 'escalate',
    payload: {
      contractRunId,
      majorDiffs: majors.map((d) => ({ field: d.field, before: d.before, after: d.after })),
      detectedAt,
    },
  }
}

function classifyAbortReason(err: unknown): OpenClawCycleAbortedResult['abortReason'] {
  if (err instanceof Error) {
    if (err.message === 'fixture_corrupted') return 'fixture_corrupted'
    if (err.message === 'fetch_timeout') return 'fetch_timeout'
  }
  return 'unknown'
}

// ============================================================================
// Orchestrator 本体
// ============================================================================

export interface OpenClawOrchestrator {
  /**
   * C-OC-03 → projection → C-OC-04 chain を端から端まで駆動する。
   * - fixture_corrupted / fetch_timeout 等の throw は CycleAbortedResult として返る
   *   (escalation は呼ばれない: W2 I-9 invariant の harness 反映)。
   * - major diff 0 件 / soft-fail は escalation 不発火 (W2 I-2 / I-3 反映)。
   * - major diff 検出時のみ escalation 起動 → phaseGateBlocked=true (W2 I-4 反映)。
   */
  runOpenClawCycle(
    input: OpenClawCycleInput,
  ): Promise<OpenClawCycleResult | OpenClawCycleAbortedResult>

  /**
   * P-UI-02 cooldown 評価を直接 port 越しに行う。
   * phase gate (C-OC-04 phaseGateBlocked) と独立して評価される
   * (W2 I-5 / I-8 / I-11 invariant の harness 反映)。
   */
  evaluateCooldownGate(input: OocCooldownInput): OocCooldownOutput
}

export function createOpenClawOrchestrator(
  ports: OpenClawOrchestratorPorts,
): OpenClawOrchestrator {
  return {
    async runOpenClawCycle(input) {
      const { contract, detectedAt } = input
      let contractOutput: OocContractOutput
      try {
        contractOutput = await ports.runContractTest(contract)
      } catch (err) {
        return {
          contractRunId: contract.runId,
          aborted: true,
          abortReason: classifyAbortReason(err),
          cause: err instanceof Error ? err : new Error(String(err)),
        }
      }

      const projection = projectMajorDiffsToEscalation(
        contract.runId,
        contractOutput,
        detectedAt,
      )
      if (projection.kind === 'no_escalation') {
        return {
          contractRunId: contract.runId,
          contractOutput,
          chainOutcome:
            projection.reason === 'soft_fail'
              ? { kind: 'no_escalation_soft_fail' }
              : { kind: 'no_escalation_no_major' },
          phaseGateBlocked: false,
        }
      }

      const escalation = await ports.escalateBreakingChange(projection.payload)
      return {
        contractRunId: contract.runId,
        contractOutput,
        chainOutcome: { kind: 'escalation_fired', escalation },
        phaseGateBlocked: escalation.phaseGateBlocked,
      }
    },

    evaluateCooldownGate(input) {
      return ports.evaluateCooldown(input)
    },
  }
}

/** Type guard: cycle が abort 終端したかを判定。 */
export function isCycleAborted(
  r: OpenClawCycleResult | OpenClawCycleAbortedResult,
): r is OpenClawCycleAbortedResult {
  return (r as OpenClawCycleAbortedResult).aborted === true
}
