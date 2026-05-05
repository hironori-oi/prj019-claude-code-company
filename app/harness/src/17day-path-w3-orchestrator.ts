/**
 * 17 day path W3 harness orchestrator (Round 19 第 2 弾, Dev-BB 担当)
 *
 * 担当 4 control: P-UI-04 / P-UI-05 / P-UI-09 / HITL-10
 *
 * W3 = harness 側で 4 control の cross-control sink / port を 1 つの
 * orchestrator context にまとめ、harness 利用側 (orchestrator / claude-bridge) が
 * 同一 audit trail へ集約配線するための「橋渡し helper」を提供する。
 *
 * 設計原則:
 *  - 4 control 実装ファイル (openclaw-runtime/src/controls/*) は無改変。
 *  - 本 module は port (sink / notifier) を組み立てるだけで、
 *    実行フローは利用側 (orchestrator) が ctrl public API 経由で回す。
 *  - W2 で確定した shape (KillTerminalSink / PermissionAuditSink /
 *    RlsAuditTrail / PostRollbackNotifier) を尊重し、本層では shape を増やさない。
 *  - W1 + W2 後方互換: 本 helper を使わない既存呼出は完全に従来挙動。
 *
 * Cross-control invariant 配線:
 *   p-ui-04 fire → killTerminalSink.markFired (latch)
 *   p-ui-05 evaluateAndAct opts.killQuery = killTerminalSink (kill = terminal)
 *   p-ui-05 rollback success → postRollbackNotifier.onRollbackCompleted →
 *           rlsAuditTrail.record(source='p-ui-05', kind='rollback_completed')
 *   hitl-10 終局 → permissionAuditSink.recordDecision →
 *           rlsAuditTrail.record(source='hitl-10', kind=approved/denied)
 *   p-ui-09 runRlsChecklist ctx.auditTrail = rlsAuditTrail (cross-source aggregate)
 *
 * 不可侵: Dev-AA の 第 1 弾 範囲 (C-OC-03 / C-OC-04 / P-UI-02) には触れない。
 */
import {
  createKillTerminalSink,
  type KillTerminalSink,
} from '../../openclaw-runtime/src/controls/p-ui-04-kill-switch-propagation.js'
import type { PostRollbackNotifier } from '../../openclaw-runtime/src/controls/p-ui-05-anomaly-rollback.js'
import {
  createRlsAuditTrail,
  type RlsAuditTrail,
} from '../../openclaw-runtime/src/controls/p-ui-09-rls-checklist.js'
import type { PermissionAuditSink } from '../../openclaw-runtime/src/controls/hitl-10-permission-change.js'

/**
 * 4 control を harness 側で end-to-end 駆動するための orchestrator context。
 *
 * 1 つの instance を共有することで、hitl-10 / p-ui-04 / p-ui-05 の cross-control
 * 副作用が全て同じ rlsAuditTrail に集約され、p-ui-09 が verify 時にそれを参照できる。
 */
export interface W3OrchestratorContext {
  /** p-ui-04 fire latch (terminal). p-ui-05 evaluateAndAct.opts.killQuery に渡す。 */
  killTerminalSink: KillTerminalSink
  /** cross-source audit trail. p-ui-09 runRlsChecklist ctx.auditTrail に渡す。 */
  rlsAuditTrail: RlsAuditTrail
  /** hitl-10 requestPermissionApproval opts.auditSink に渡す。終局判定のみ flush。 */
  permissionAuditSink: PermissionAuditSink
  /** p-ui-05 evaluateAndAct opts.postRollback に渡す。rollback 成功時のみ flush。 */
  postRollbackNotifier: PostRollbackNotifier
}

/**
 * harness orchestrator context を組み立てる。
 *
 * 戻り値は 4 つ全て port-only で副作用を持たない (in-memory)。
 * - 本番運用時は本 helper を 1 度呼び、context を harness lifecycle に保持する。
 * - test では invocation ごとに fresh context を作って isolation を保つ。
 */
export function createW3OrchestratorContext(
  options: { now?: () => string } = {},
): W3OrchestratorContext {
  const killTerminalSink = createKillTerminalSink()
  const rlsAuditTrail = createRlsAuditTrail()
  const now = options.now ?? (() => new Date().toISOString())
  const permissionAuditSink = buildPermissionAuditSink(rlsAuditTrail)
  const postRollbackNotifier = buildPostRollbackNotifier(rlsAuditTrail, now)
  return {
    killTerminalSink,
    rlsAuditTrail,
    permissionAuditSink,
    postRollbackNotifier,
  }
}

/**
 * hitl-10 PermissionAuditSink を rlsAuditTrail に橋渡しする builder。
 *
 * state→kind マッピング:
 *   approved          → permission_approved
 *   rejected/timeout  → permission_denied
 *
 * pending は呼ばれない (hitl-10 ctrl 側で終局時のみ recordDecision を呼ぶため)。
 */
export function buildPermissionAuditSink(trail: RlsAuditTrail): PermissionAuditSink {
  return {
    recordDecision: (payload) => {
      trail.record({
        source: 'hitl-10',
        kind: payload.state === 'approved' ? 'permission_approved' : 'permission_denied',
        ticketId: payload.ticketId,
        detail: payload.detail,
        recordedAt: payload.recordedAt,
      })
    },
  }
}

/**
 * p-ui-05 PostRollbackNotifier を rlsAuditTrail に橋渡しする builder。
 *
 * rollback 成功時のみ呼ばれる (p-ui-05 ctrl 側 evaluateAndAct で
 * result.ok=true の場合のみ onRollbackCompleted する責務分離)。
 *
 * detail には loopId と targetCommit を含めて trace 可能にする。
 */
export function buildPostRollbackNotifier(
  trail: RlsAuditTrail,
  now: () => string = () => new Date().toISOString(),
): PostRollbackNotifier {
  return {
    onRollbackCompleted: (payload) => {
      trail.record({
        source: 'p-ui-05',
        kind: 'rollback_completed',
        detail: `loopId=${payload.loopId};targetCommit=${payload.targetCommit ?? ''}`,
        recordedAt: now(),
      })
    },
  }
}

// ============================================================================
// Round 20 Dev-DD append-only 拡張:
//   P-UI-02 cooldown state machine + P-UI-04 kill-terminal-sink を
//   harness orchestrator 側で end-to-end 駆動する port + wire helper を追加。
//
// 設計原則:
//   - ctrl 実装ファイル無改変 (Round 19 Dev-AA / Dev-BB 路線継続)
//   - openclaw-runtime → harness の依存方向を維持
//   - Dev-AA `openclaw-orchestrator.ts` は構造的 contract のみで実 ctrl と未接続。
//     本拡張は **構造的 port (Dev-AA の OocCooldownInput / OocCooldownOutput) と
//     実 ctrl (P-UI-02 evaluateCooldown) を bridge する pure adapter** を提供する。
//   - P-UI-04 は既に Dev-BB context が killTerminalSink を保持している。本拡張は
//     kill-trigger → P-UI-04 propagateKill → KillTerminalSink latch → 後段抑止の
//     一連の lifecycle を harness 側で wrap する pure orchestrator port を追加する。
//
// Cross-control invariant 配線 (W3 拡張):
//   trigger event (loop_abort / manual_stop / kill_switch) → P-UI-02 evaluateCooldown
//     → cooldownState ∈ {active, expired, overridden} を query 可能形式で公開
//   HITL 第 12 種 override webhook → CooldownOverrideRegistry.markOverridden(loopId)
//     → 次回 evaluateCooldown で cooldownState='overridden'
//   kill-trigger payload → KillTerminalAdapter.terminate(input)
//     → ctrl propagateKill → killTerminalSink.markFired/markVerified (terminal latch)
//     → 後段 P-UI-05 evaluateAndAct.killQuery で rollback 抑止
// ============================================================================

import {
  evaluateCooldown,
  type CooldownClock,
  type CooldownInput,
  type CooldownOutput,
  type CooldownOverrideChecker,
} from '../../openclaw-runtime/src/controls/p-ui-02-cooldown-modal.js'
import {
  propagateKill,
  type KillInput,
  type KillOutput,
  type ProcessKiller,
  type KillBroadcasterOptions,
} from '../../openclaw-runtime/src/controls/p-ui-04-kill-switch-propagation.js'

// ----------------------------------------------------------------------------
// P-UI-02 cooldown — orchestrator-facing port group
// ----------------------------------------------------------------------------

/**
 * cooldown state を query 形式で公開する port。
 *
 * orchestrator (Dev-AA `OpenClawOrchestratorPorts.evaluateCooldown`) に
 * adapter として注入できる shape を提供する。
 *
 * - `isActive`: enqueue 抑止判定 (active のみ true)
 * - `computeExpiry`: 次回 allowed 時刻 (UTC) を返す
 * - `evaluate`: P-UI-02 evaluateCooldown の同等呼出 (state 完全形)
 */
export interface CooldownPolicy {
  isActive(input: CooldownInput): boolean
  computeExpiry(input: CooldownInput): Date
  evaluate(input: CooldownInput): CooldownOutput
}

/**
 * HITL 第 12 種 override port を harness 側で latch する registry。
 *
 * webhook 受信時に `markOverridden(loopId)` を呼び、以後の evaluateCooldown
 * 結果が cooldownState='overridden' になる。`reset(loopId)` で latch 解除。
 *
 * latch shape は in-memory Set (副作用 0、test isolation 簡単)。
 */
export interface CooldownOverrideRegistry extends CooldownOverrideChecker {
  markOverridden(loopId: string): void
  reset(loopId: string): void
  resetAll(): void
}

/** in-memory CooldownOverrideRegistry 実装。 */
export function createCooldownOverrideRegistry(): CooldownOverrideRegistry {
  const overridden = new Set<string>()
  return {
    isOverridden: (loopId) => overridden.has(loopId),
    markOverridden: (loopId) => {
      overridden.add(loopId)
    },
    reset: (loopId) => {
      overridden.delete(loopId)
    },
    resetAll: () => {
      overridden.clear()
    },
  }
}

/**
 * P-UI-02 evaluateCooldown を CooldownPolicy port に bridge する builder。
 *
 * harness orchestrator は本 policy を保持し、`isActive` で enqueue 抑止判定、
 * `evaluate` で full state を取得する。clock skew throw は ctrl 側そのまま伝搬
 * (fail-closed 設計)。
 *
 * @param clock — 現在時刻 port (test 注入可)
 * @param overrideRegistry — HITL 第 12 種 override 状態 (省略時は no-op)
 */
export function buildCooldownPolicy(
  clock: CooldownClock,
  overrideRegistry?: CooldownOverrideChecker,
): CooldownPolicy {
  const override = overrideRegistry
  return {
    isActive: (input) => {
      const out = evaluateCooldown(input, clock, override)
      return out.cooldownState === 'active'
    },
    computeExpiry: (input) => {
      const out = evaluateCooldown(input, clock, override)
      return new Date(out.nextAllowedAt)
    },
    evaluate: (input) => evaluateCooldown(input, clock, override),
  }
}

// ----------------------------------------------------------------------------
// P-UI-04 kill-terminal-sink — orchestrator-facing terminate port
// ----------------------------------------------------------------------------

/**
 * kill-trigger 受信時に P-UI-04 propagateKill を呼び、結果を terminal state
 * として返す orchestrator port。
 *
 * - `terminate`: kill input を受け、graceful → forceful → verified の chain を実行。
 *   戻り値の terminal state には latch 状態 (sink active=true) と KillOutput を含む。
 * - `observeLatch`: kill が fired/verified した瞬間を callback で受ける subscribe API。
 *   broadcaster lifecycle の test 検証に用いる。
 */
export interface KillTerminalState {
  readonly killOutput: KillOutput
  readonly latchActive: boolean
  readonly latchReason: string | null
}

export type KillLatchObserver = (event: 'fired' | 'verified' | 'failed', reason: string) => void

export interface KillTerminalAdapter {
  terminate(input: KillInput, options?: KillTerminalAdapterOptions): Promise<KillTerminalState>
  observeLatch(callback: KillLatchObserver): () => void
}

/**
 * terminate 呼出時に追加で渡せる options。
 * - `processKiller`: SIGTERM / SIGKILL 実行 port (省略時は no-op = 全成功)
 * - `gracePeriodMs` / `verifySurvivors` / `sleep` / `now`: ctrl propagateKill にそのまま転送
 */
export interface KillTerminalAdapterOptions {
  readonly processKiller?: ProcessKiller
  readonly gracePeriodMs?: number
  readonly verifySurvivors?: KillBroadcasterOptions['verifySurvivors']
  readonly sleep?: KillBroadcasterOptions['sleep']
  readonly now?: KillBroadcasterOptions['now']
}

const ALWAYS_OK_KILLER: ProcessKiller = { signal: async () => true }

/**
 * KillTerminalSink を持つ orchestrator context (Dev-BB W3OrchestratorContext)
 * から terminate adapter を組み立てる builder。
 *
 * broadcaster lifecycle:
 *   propagateKill 内で killTokenBroadcaster('fired', reason) → 観察者全員に通知
 *   verified / failed も同様に伝搬。
 *   adapter は subscribe / unsubscribe を提供し、cleanup も明示的にできる。
 */
export function buildKillTerminalAdapter(
  context: Pick<W3OrchestratorContext, 'killTerminalSink'>,
): KillTerminalAdapter {
  const observers = new Set<KillLatchObserver>()
  const broadcast: KillLatchObserver = (event, reason) => {
    for (const o of observers) {
      try {
        o(event, reason)
      } catch {
        // observer 1 個の throw が他の observer / lifecycle に伝搬しないよう吸収
      }
    }
  }
  return {
    terminate: async (input, options = {}) => {
      const killer = options.processKiller ?? ALWAYS_OK_KILLER
      const broadcasterOpts: KillBroadcasterOptions = {
        killTerminalSink: context.killTerminalSink,
        killTokenBroadcaster: broadcast,
        gracePeriodMs: options.gracePeriodMs ?? 0,
        sleep: options.sleep ?? (async () => {}),
      }
      if (options.verifySurvivors !== undefined) {
        broadcasterOpts.verifySurvivors = options.verifySurvivors
      }
      if (options.now !== undefined) {
        broadcasterOpts.now = options.now
      }
      const killOutput = await propagateKill(input, killer, broadcasterOpts)
      return {
        killOutput,
        latchActive: context.killTerminalSink.isActive(),
        latchReason: context.killTerminalSink.lastReason(),
      }
    },
    observeLatch: (callback) => {
      observers.add(callback)
      return () => {
        observers.delete(callback)
      }
    },
  }
}
