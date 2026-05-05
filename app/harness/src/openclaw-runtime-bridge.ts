/**
 * 17 day path W4 — OpenClaw runtime bridge (Round 21 第 1 波, Dev-GG 担当)
 *
 * 担当: harness orchestrator 本番 wiring (W3 で実装した orchestrator context を
 * Harness lifecycle に統合する production-side adapter 層)。
 *
 * Round 19 Dev-BB は `createW3OrchestratorContext()` を test factory として実装
 * (mock 注入用)。本 file は Round 21 W4 で **実 production lifecycle 統合** を
 * 担当する: harness 起動時に W3OrchestratorContext を初期化し、Harness lifecycle
 * (start / stop) に組込み、利用側 (claude-bridge / orchestrator) が
 * `Harness.getOrchestratorContext()` で本番 context を取得可能化する。
 *
 * 不可侵:
 *   - Round 19 Dev-BB の `createW3OrchestratorContext()` 関数本体無改変
 *   - Round 19 Dev-AA の `openclaw-orchestrator.ts` 無改変
 *   - Round 20 Dev-EE の `17day-path-w3-rollback-permission-orchestrator.ts` 無改変
 *   - Dev-HH 担当 (24h SLA + e2e 統合) ファイルに変更を加えない
 *   - control 本体ファイル (openclaw-runtime/src/controls/*) 無改変
 *
 * 設計原則:
 *   1. test factory (`createW3OrchestratorContext()`) は historical baseline 維持。
 *      本 file は production-side bridge として **別 entry point** で公開する。
 *   2. dependency injection: bridge は context 構築 + lifecycle hook を提供するのみ。
 *      実 ctrl の wiring は利用側が orchestrator port 経由で行う (control-agnostic)。
 *   3. lifecycle: bridge は init() / dispose() を持ち、Harness.init / shutdown と連動。
 *      init は冪等 (再呼出で同 context を返す)、dispose は idempotent (二重 dispose 安全)。
 *   4. side effects 0: in-memory のみで file IO は行わない (永続化は別 file
 *      `file-breach-counter.ts` で別レイヤとして提供)。
 *   5. Public API of any underlying control / orchestrator unchanged。
 */
import {
  createW3OrchestratorContext,
  type W3OrchestratorContext,
} from './17day-path-w3-orchestrator.js'

// ============================================================================
// Bridge options / state
// ============================================================================

/**
 * bridge 構築時に渡せる options。test では fixed clock を注入し、
 * 本番では省略 (Date.now() ベース) する。
 */
export interface OpenClawRuntimeBridgeOptions {
  /** 現在時刻 ISO string を返す port (省略時は new Date().toISOString()) */
  readonly now?: () => string
  /** lifecycle hook: init 完遂後に 1 度だけ呼ばれる */
  readonly onInit?: (ctx: W3OrchestratorContext) => void | Promise<void>
  /** lifecycle hook: dispose 直前に 1 度だけ呼ばれる */
  readonly onDispose?: (ctx: W3OrchestratorContext) => void | Promise<void>
}

/**
 * bridge の lifecycle phase。
 *
 * - 'idle'      : init 未呼出 / dispose 後の状態 (context 未保持)
 * - 'active'    : init 完遂 / context 保持中
 * - 'disposing' : dispose 進行中 (再 init 不可)
 */
export type BridgePhase = 'idle' | 'active' | 'disposing'

// ============================================================================
// Bridge interface
// ============================================================================

/**
 * harness lifecycle に W3OrchestratorContext を統合する production bridge。
 *
 * 利用側 (Harness クラス / claude-bridge) は本 bridge を 1 つ保持し、
 * init() で context を初期化、getContext() で取得、dispose() で解放する。
 */
export interface OpenClawRuntimeBridge {
  /** 現在の phase。test での state machine 検証用。 */
  phase(): BridgePhase
  /**
   * context を初期化。冪等 (active 状態での再呼出は同 context を返す)。
   * disposing 状態での呼出は Error を throw (lifecycle violation)。
   */
  init(): Promise<W3OrchestratorContext>
  /**
   * 初期化済 context を取得。idle 状態での呼出は Error を throw。
   */
  getContext(): W3OrchestratorContext
  /**
   * context を解放。idempotent (idle 状態での dispose は no-op)。
   * dispose 後は再 init 可能 (新規 context が生成される)。
   */
  dispose(): Promise<void>
  /**
   * onInit / onDispose hook に渡すための options snapshot。
   * test 検証用 (本番は不要)。
   */
  readonly options: Readonly<OpenClawRuntimeBridgeOptions>
}

// ============================================================================
// Bridge factory
// ============================================================================

/**
 * production bridge を構築する。
 *
 * lifecycle 設計:
 *   1. init() 1 回目 → createW3OrchestratorContext() → onInit hook → phase='active'
 *   2. init() 再呼出 (active 中) → 同 context を即座に返す (冪等)
 *   3. dispose() (active 中) → phase='disposing' → onDispose hook → phase='idle'
 *   4. dispose() (idle 中) → no-op
 *   5. init() (disposing 中) → Error throw
 *
 * @param options bridge options (now / onInit / onDispose hooks)
 */
export function createOpenClawRuntimeBridge(
  options: OpenClawRuntimeBridgeOptions = {},
): OpenClawRuntimeBridge {
  let context: W3OrchestratorContext | null = null
  let currentPhase: BridgePhase = 'idle'
  const optionsSnapshot: Readonly<OpenClawRuntimeBridgeOptions> = Object.freeze({
    ...(options.now !== undefined ? { now: options.now } : {}),
    ...(options.onInit !== undefined ? { onInit: options.onInit } : {}),
    ...(options.onDispose !== undefined ? { onDispose: options.onDispose } : {}),
  })

  return {
    phase: () => currentPhase,
    options: optionsSnapshot,

    async init() {
      if (currentPhase === 'disposing') {
        throw new Error('OpenClawRuntimeBridge: cannot init while disposing')
      }
      if (currentPhase === 'active' && context !== null) {
        return context
      }
      const ctx = createW3OrchestratorContext(
        options.now !== undefined ? { now: options.now } : {},
      )
      context = ctx
      currentPhase = 'active'
      if (options.onInit !== undefined) {
        await options.onInit(ctx)
      }
      return ctx
    },

    getContext() {
      if (currentPhase !== 'active' || context === null) {
        throw new Error(
          `OpenClawRuntimeBridge: getContext requires active phase (current=${currentPhase})`,
        )
      }
      return context
    },

    async dispose() {
      if (currentPhase === 'idle') {
        return
      }
      if (currentPhase === 'disposing') {
        return
      }
      currentPhase = 'disposing'
      const ctx = context
      try {
        if (options.onDispose !== undefined && ctx !== null) {
          await options.onDispose(ctx)
        }
      } finally {
        context = null
        currentPhase = 'idle'
      }
    },
  }
}

// ============================================================================
// Lifecycle helper — Harness クラス統合用
// ============================================================================

/**
 * Harness クラスの init / shutdown lifecycle に bridge を組み込むための helper。
 *
 * 利用側 (Harness インスタンス保持側) は:
 *   const bridge = createOpenClawRuntimeBridge({ ... })
 *   const lifecycle = bindBridgeToLifecycle(bridge)
 *   await lifecycle.start()      // Harness.init 中で呼出
 *   ctx = lifecycle.getContext() // ctrl wiring 時に取得
 *   await lifecycle.stop()       // Harness.shutdown 中で呼出
 *
 * 本 helper は thin wrapper で、bridge の冪等性 / idempotent dispose を尊重する。
 */
export interface BridgeLifecycleHandle {
  start(): Promise<W3OrchestratorContext>
  getContext(): W3OrchestratorContext
  stop(): Promise<void>
  isActive(): boolean
}

export function bindBridgeToLifecycle(
  bridge: OpenClawRuntimeBridge,
): BridgeLifecycleHandle {
  return {
    start: () => bridge.init(),
    getContext: () => bridge.getContext(),
    stop: () => bridge.dispose(),
    isActive: () => bridge.phase() === 'active',
  }
}
