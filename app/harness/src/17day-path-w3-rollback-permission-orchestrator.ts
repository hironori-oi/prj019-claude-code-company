/**
 * 17 day path W3 — rollback + permission orchestrator (Round 20 第 2 波, Dev-EE 担当)
 *
 * 担当 2 control: P-UI-05 (rollback executor) + HITL-10 (permission auditor)
 *
 * Spec scope (W3 = harness orchestrator 接続段階):
 *   W2 で確立した cross-control invariants を harness 側で end-to-end 駆動する
 *   際の、rollback executor / permission auditor の orchestration shape を提供する。
 *
 * 不可侵:
 *   - C-OC-03 / C-OC-04 / P-UI-02 (Dev-AA / Dev-X) 領域には touch しない
 *   - P-UI-04 / P-UI-09 / HITL-10 / P-UI-05 ctrl 本体ファイル無改変
 *   - Dev-DD 担当 P-UI-02 + P-UI-04 の harness orchestrator file には touch しない
 *   - 既存 17day-path-w3-orchestrator.ts (Dev-BB) には touch しない (別 file 起票)
 *
 * Public API of any underlying control unchanged — port 注入のみで harness と接続。
 *
 * ===== 設計原則 =====
 * 1. 依存方向: harness → openclaw-runtime は禁止 (openclaw-runtime が harness に依存する側)。
 *    したがって本 orchestrator は **control-agnostic** であり、ctrl 関数を port として
 *    injection で受け取る。型は構造的部分型 (zod 等の重い参照を避ける) で記述。
 * 2. W1 + W2 不変保証: control 単独の挙動は port 経由で完全に preserve される。
 * 3. Owner formal「丁寧に」directive 順守:
 *    - 24h SLA は wall-clock 検証可能 (Date.now() / clock port 注入で制御)
 *    - PostRollbackNotifier は既存 Dev-BB W3 ctx と統合可能 shape
 * 4. pure function + dependency injection 維持。breach counter は in-memory factory で
 *    isolation を保つ (Round 21 W4 で永続化検討)。
 */

// ============================================================================
// 構造的型 (openclaw-runtime 控除型 — 依存を発生させない)
// ============================================================================

/** P-UI-05: rollback 実行 port (control 本体 RollbackExecutor と shape 一致) */
export interface RollbackOutcome {
  readonly ok: boolean
  readonly targetCommit?: string
  readonly reason?: string
}

export interface RollbackExecutorPort {
  rollback(loopId: string): Promise<RollbackOutcome>
}

/** P-UI-05: rollback 失敗時 kill switch interlock port */
export interface KillSwitchTriggerPort {
  fire(reason: string): Promise<void>
  /** Round 21 W4 拡張用: kill switch がすでに armed か (現状 ctrl 本体には無いが harness 側で可視化) */
  armed?: () => boolean
}

/** P-UI-05: kill terminal latch query port (Dev-BB の KillTerminalSink と shape 互換) */
export interface KillTerminalQueryPort {
  isActive(): boolean
  lastReason(): string | null
}

/** P-UI-05: rollback 完遂時 cross-control 通知 port (Dev-BB の PostRollbackNotifier と shape 互換) */
export interface PostRollbackNotifierPort {
  onRollbackCompleted(payload: {
    loopId: string
    targetCommit?: string
  }): Promise<void> | void
}

/** HITL-10: permission auditor port (control 本体 PermissionAuditSink と shape 互換) */
export interface PermissionAuditSinkPort {
  recordDecision(payload: {
    ticketId: string
    state: 'approved' | 'rejected' | 'timeout'
    detail?: string
    recordedAt: string
  }): void
}

/**
 * HITL-10: permission approver port — 24h SLA wall-clock で制御するため、
 * orchestrator 側で nowMs 越境済 → 'timeout' に丸める責務を負う。
 * 戻り値は 'approved' / 'rejected' / 'timeout' / 'pending' (pending は SLA 内のみ valid)。
 */
export interface PermissionApproverPort {
  requestApproval(
    scope: PermissionScope,
    requester: PermissionRequester,
  ): Promise<ApprovalDecision>
}

export interface PermissionScope {
  readonly changeType: 'env' | 'sandbox' | 'delegation'
  readonly before: string
  readonly after: string
  readonly rationale: string
}

export interface PermissionRequester {
  readonly role: string
  readonly ticketId: string
}

export type ApprovalDecision =
  | { readonly state: 'approved'; readonly approvedAtMs: number }
  | { readonly state: 'rejected'; readonly reason?: string }
  | { readonly state: 'timeout' }
  | { readonly state: 'pending' }

// ============================================================================
// BreachCounter — P-UI-05 連続 breach 状態の harness 側 in-memory persistence
// ============================================================================

/**
 * P-UI-05 ctrl 本体は AnomalyState を「呼出側保持」させる pure 関数なので、
 * harness 側で breach counter の persistence を担う。
 *
 * Round 20 段階: in-memory factory (Round 21 W4 で永続化検討)。
 * loopId 単位で breach 数をインクリメントし、2 連続で trip する。
 */
export interface BreachCounter {
  /** 観測 1 件を記録。返り値は新しい consecutive count (≥1)。 */
  observe(loopId: string): number
  /** 現在の連続 breach 数。 */
  current(): number
  /** 最後に観測した loopId。 */
  lastLoopId(): string | null
  /** 明示リセット (rollback 完遂後 / kill latch 後に呼出可)。 */
  reset(): void
}

export function createBreachCounter(): BreachCounter {
  let count = 0
  let lastId: string | null = null
  return {
    observe(loopId) {
      // 同一 loopId の重複観測は max(count, 1) で抑制 (W1 ctrl 本体と同 semantics)
      if (lastId !== null && lastId !== loopId) {
        count += 1
      } else {
        count = Math.max(count, 1)
      }
      lastId = loopId
      return count
    },
    current: () => count,
    lastLoopId: () => lastId,
    reset() {
      count = 0
      lastId = null
    },
  }
}

// ============================================================================
// Rollback orchestrator (P-UI-05 接続)
// ============================================================================

export interface RollbackOrchestrationInput {
  readonly loopId: string
  readonly metric: 'cost_per_loop' | 'loop_duration' | 'output_anomaly'
  readonly observedValue: number
  readonly threshold: number
}

export type RollbackOrchestrationResult =
  | { readonly kind: 'within_threshold' }
  | { readonly kind: 'first_breach'; readonly consecutiveBreaches: 1 }
  | { readonly kind: 'metric_nan_skip' }
  | {
      readonly kind: 'rollback_skipped_kill_terminal'
      readonly killReason: string
    }
  | {
      readonly kind: 'rollback_completed'
      readonly targetCommit?: string
    }
  | {
      readonly kind: 'rollback_failed_kill_switch_armed'
      readonly reason: string
    }

export interface RollbackOrchestratorPorts {
  readonly executor: RollbackExecutorPort
  readonly killSwitch: KillSwitchTriggerPort
  readonly killQuery?: KillTerminalQueryPort
  readonly postRollback?: PostRollbackNotifierPort
}

export interface RollbackOrchestrator {
  evaluate(
    input: RollbackOrchestrationInput,
  ): Promise<RollbackOrchestrationResult>
  readonly counter: BreachCounter
}

/**
 * P-UI-05 orchestrator factory。breach counter を内蔵し、harness 側で
 * 連続 2 breach 確定 → executor.rollback 呼出 → success 時 postRollback 発火 →
 * failure 時 killSwitch.fire(reason) という cross-control chain を提供する。
 *
 * killQuery が active なら rollback を起動しない (W2 I-1 invariant の harness 反映)。
 */
export function createRollbackOrchestrator(
  ports: RollbackOrchestratorPorts,
  counter: BreachCounter = createBreachCounter(),
): RollbackOrchestrator {
  return {
    counter,
    async evaluate(input) {
      if (!Number.isFinite(input.observedValue)) {
        return { kind: 'metric_nan_skip' }
      }
      if (input.observedValue <= input.threshold) {
        return { kind: 'within_threshold' }
      }
      const breaches = counter.observe(input.loopId)
      if (breaches < 2) {
        return { kind: 'first_breach', consecutiveBreaches: 1 }
      }
      // kill terminal latch が立っていれば rollback を起動しない
      if (ports.killQuery?.isActive()) {
        return {
          kind: 'rollback_skipped_kill_terminal',
          killReason: ports.killQuery.lastReason() ?? 'unknown',
        }
      }
      const outcome = await ports.executor.rollback(input.loopId)
      if (outcome.ok) {
        if (ports.postRollback) {
          await ports.postRollback.onRollbackCompleted({
            loopId: input.loopId,
            targetCommit: outcome.targetCommit,
          })
        }
        // counter は明示 reset (W1 ctrl 本体は state を呼出側保持にしているため)
        counter.reset()
        return {
          kind: 'rollback_completed',
          ...(outcome.targetCommit !== undefined
            ? { targetCommit: outcome.targetCommit }
            : {}),
        }
      }
      const reason = outcome.reason ?? 'unknown'
      await ports.killSwitch.fire(`rollback_failed:${reason}`)
      return { kind: 'rollback_failed_kill_switch_armed', reason }
    },
  }
}

// ============================================================================
// Permission orchestrator (HITL-10 接続)
// ============================================================================

export const APPROVAL_SLA_MS = 24 * 60 * 60 * 1000

export interface PermissionOrchestrationInput {
  readonly scope: PermissionScope
  readonly requester: PermissionRequester
}

export type PermissionOrchestrationResult =
  | {
      readonly kind: 'approved'
      readonly ticketId: string
      readonly approvedAtMs: number
      readonly expiresAtMs: number
    }
  | {
      readonly kind: 'rejected'
      readonly ticketId: string
      readonly reason?: string
    }
  | { readonly kind: 'timeout'; readonly ticketId: string; readonly expiredAtMs: number }
  | { readonly kind: 'pending'; readonly ticketId: string; readonly expiresAtMs: number }

export interface PermissionOrchestratorPorts {
  readonly approver: PermissionApproverPort
  readonly auditSink: PermissionAuditSinkPort
  /** wall-clock。test では fixed clock を注入する。 */
  readonly nowMs: () => number
}

export interface PermissionOrchestrator {
  request(
    input: PermissionOrchestrationInput,
  ): Promise<PermissionOrchestrationResult>
}

/**
 * HITL-10 permission orchestrator factory。
 *
 * 24h SLA wall-clock 検証:
 *   - request 開始時の nowMs() を t0 として保持
 *   - approver 戻り値が pending かつ nowMs() ≥ t0 + APPROVAL_SLA_MS なら timeout に丸める
 *   - approved の approvedAtMs が t0 + SLA を越えていても (clock skew) timeout にしない
 *     (ctrl 本体仕様 = approver の判定優先)
 *
 * 終局判定 (approved / rejected / timeout) のみ auditSink.recordDecision を呼ぶ。
 * pending は audit 対象外 (ctrl 本体 spec と整合)。
 */
export function createPermissionOrchestrator(
  ports: PermissionOrchestratorPorts,
): PermissionOrchestrator {
  return {
    async request(input) {
      const t0 = ports.nowMs()
      const expiresAtMs = t0 + APPROVAL_SLA_MS
      const decision = await ports.approver.requestApproval(
        input.scope,
        input.requester,
      )
      const tNow = ports.nowMs()
      const recordedAt = new Date(tNow).toISOString()
      const ticketId = input.requester.ticketId

      if (decision.state === 'approved') {
        ports.auditSink.recordDecision({
          ticketId,
          state: 'approved',
          detail: `changeType=${input.scope.changeType}`,
          recordedAt,
        })
        return {
          kind: 'approved',
          ticketId,
          approvedAtMs: decision.approvedAtMs,
          expiresAtMs,
        }
      }
      if (decision.state === 'rejected') {
        ports.auditSink.recordDecision({
          ticketId,
          state: 'rejected',
          detail: `changeType=${input.scope.changeType}`,
          recordedAt,
        })
        return {
          kind: 'rejected',
          ticketId,
          ...(decision.reason !== undefined ? { reason: decision.reason } : {}),
        }
      }
      if (decision.state === 'timeout') {
        ports.auditSink.recordDecision({
          ticketId,
          state: 'timeout',
          detail: `changeType=${input.scope.changeType}`,
          recordedAt,
        })
        return { kind: 'timeout', ticketId, expiredAtMs: tNow }
      }
      // pending: SLA 越境済なら timeout に丸める (wall-clock 判定)
      if (tNow >= expiresAtMs) {
        ports.auditSink.recordDecision({
          ticketId,
          state: 'timeout',
          detail: `changeType=${input.scope.changeType}`,
          recordedAt,
        })
        return { kind: 'timeout', ticketId, expiredAtMs: tNow }
      }
      return { kind: 'pending', ticketId, expiresAtMs }
    },
  }
}

// ============================================================================
// 統合 helper — Dev-BB の W3 orchestrator context と接続するための adapter
// ============================================================================

/**
 * Dev-BB の W3 orchestrator context shape (KillTerminalSink + PermissionAuditSink +
 * PostRollbackNotifier) を本 file の port に変換する adapter。
 *
 * 構造的部分型なので、Dev-BB の context をそのまま渡せる (依存方向不問)。
 */
export function adaptW3ContextToRollbackPorts<
  Ctx extends {
    killTerminalSink: KillTerminalQueryPort
    postRollbackNotifier: PostRollbackNotifierPort
  },
>(ctx: Ctx, executor: RollbackExecutorPort, killSwitch: KillSwitchTriggerPort): RollbackOrchestratorPorts {
  return {
    executor,
    killSwitch,
    killQuery: ctx.killTerminalSink,
    postRollback: ctx.postRollbackNotifier,
  }
}

export function adaptW3ContextToPermissionPorts<
  Ctx extends { permissionAuditSink: PermissionAuditSinkPort },
>(ctx: Ctx, approver: PermissionApproverPort, nowMs: () => number): PermissionOrchestratorPorts {
  return {
    approver,
    auditSink: ctx.permissionAuditSink,
    nowMs,
  }
}
