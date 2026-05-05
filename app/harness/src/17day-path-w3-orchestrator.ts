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
