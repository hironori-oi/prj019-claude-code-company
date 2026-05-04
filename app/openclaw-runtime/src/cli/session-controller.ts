/**
 * cli/session-controller — Round 11 Dev-D 前倒し (W3 → W0):
 *   spawn された subprocess の lifecycle 管理 (start / pause / resume / kill)。
 *
 * 設計方針:
 *   - **subscription-driven session の単一責任**: spawnClaudeCode で得た SpawnHandle を
 *     高レベル lifecycle FSM (idle → starting → running → paused → killing → finished) で覆う。
 *   - **AbortController 連動**: kill-switch G-05/G-06 経由で外部から強制停止可能。
 *   - **TimeSource DI 維持**: 状態遷移の audit log に nowIso を注入。
 *   - **巻き添えゼロ**: spawnToken / pid を audit log に必須記録 (Sumi/Asagi confusion 防止)。
 *   - **既存無改変**: skill-adapter / wrapper.ts / protocol/ 完全無 touch。
 *
 * 関連:
 *   - DEC-019-007 (副作用ゼロ要件)
 *   - DEC-019-051 (subscription-driven 中核)
 *   - CB-D-W4-01 DryRunGuard (dry-run mode 整合)
 *   - kill-switch G-05/G-06 (harness/src/kill-switch.ts と将来 integrate)
 */
import type {
  SpawnClaudeCodeOptions,
  SpawnHandle,
  SpawnExitInfo,
  SpawnMode,
  SpawnKillRegistry,
  SpawnKillRegistryToken,
} from './spawn-claude-code.js'
import { spawnClaudeCode, wireSpawnHandleToKillSwitch } from './spawn-claude-code.js'

/**
 * Session lifecycle FSM 状態。
 */
export type SessionState =
  | 'idle' // 未起動
  | 'starting' // spawnClaudeCode 呼び出し直後
  | 'running' // child process alive、event 集約中
  | 'paused' // 外部から pause 要請、SIGSTOP 相当 (実 OS では SIGSTOP)、再開可能
  | 'killing' // kill 要請、SIGTERM 送信中
  | 'finished' // exit (正常 / SIGKILL / abort) 後の最終状態

/**
 * lifecycle 遷移 audit record。
 */
export interface SessionTransitionRecord {
  /** 遷移後の状態 */
  state: SessionState
  /** ISO 時刻 */
  at: string
  /** 任意の理由 / context */
  reason?: string
}

/**
 * Session controller 起動契約。
 */
export interface CreateSessionControllerOptions {
  /** spawnClaudeCode に渡す options */
  spawnOptions: SpawnClaudeCodeOptions
  /** ISO 時刻取得 hook (default = () => new Date().toISOString()) */
  nowIso?: () => string
  /** spawn 関数注入 (test 用、default = spawnClaudeCode) */
  spawnFn?: typeof spawnClaudeCode
  /**
   * Round 13 Dev-D Task C: kill-switch 統合経路。
   *
   * 指定すると start() 内で wireSpawnHandleToKillSwitch を自動呼び出し、
   * kill-switch trigger 時に spawn 子プロセスを SIGTERM/SIGKILL fallback で停止する。
   *
   * - finished state 移行時に自動 unregister (メモリリーク防止)。
   * - dry-run mode では no-op (handle.pid === -1)。
   * - 未指定時は従来通り wiring なし (Round 11/12 互換)。
   */
  killRegistry?: SpawnKillRegistry
  /**
   * Round 13 Dev-D Task C: wireSpawnHandleToKillSwitch の登録名 prefix (audit 用)。
   * 未指定なら spawn-claude-code 側 default (`claude-code:${spawnToken}`)。
   */
  killTargetName?: string
  /**
   * Round 13 Dev-D Task C: wire 関数注入 (test 用、default = wireSpawnHandleToKillSwitch)。
   */
  wireFn?: typeof wireSpawnHandleToKillSwitch
}

/**
 * Session controller 公開 API。
 */
export interface SessionController {
  /** 現在状態 */
  readonly state: SessionState
  /** 起動 mode */
  readonly mode: SpawnMode
  /** spawn 起動 token (audit + Sumi/Asagi 巻き添えゼロ確証) */
  readonly spawnToken: string | null
  /** 子プロセス pid (起動前は null、dry-run は -1) */
  readonly pid: number | null
  /** 状態遷移 audit log (insertion 順) */
  readonly transitions: readonly SessionTransitionRecord[]
  /** 起動して running に遷移 */
  start(): Promise<SpawnHandle>
  /** pause を発動 (実 OS では SIGSTOP、mock では state 変更のみ) */
  pause(reason?: string): Promise<void>
  /** pause 状態から再開 (SIGCONT 相当) */
  resume(reason?: string): Promise<void>
  /** kill (SIGTERM、必要なら SIGKILL escalate) */
  kill(reason?: string): Promise<SpawnExitInfo | null>
  /** spawn 結果へのアクセス (start 後のみ非 null) */
  readonly handle: SpawnHandle | null
  /**
   * Round 13 Dev-D Task C: kill-switch に登録された kill token (start 後 / wiring 有効時のみ非 null)。
   *
   * - dry-run mode は subprocess を持たないので null。
   * - 通常終了 (handle.done() resolve) で auto-unregister 済 (idempotent)。
   * - kill-switch 未指定時は null。
   */
  readonly killToken: SpawnKillRegistryToken | null
}

/**
 * Session FSM 許可遷移表 (固定)。
 */
const ALLOWED_TRANSITIONS: Readonly<Record<SessionState, readonly SessionState[]>> = Object.freeze({
  idle: ['starting'],
  starting: ['running', 'killing', 'finished'],
  running: ['paused', 'killing', 'finished'],
  paused: ['running', 'killing', 'finished'],
  killing: ['finished'],
  finished: [],
})

/**
 * 純関数: 遷移が許可されているかを返す。
 */
export function isTransitionAllowed(from: SessionState, to: SessionState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to)
}

/**
 * SessionController を生成する factory。
 *
 * **副作用 0**: spawn は start() を呼ぶまで実行しない。コンストラクタ相当の本関数は純関数。
 *
 * @param opts spawnOptions + nowIso + spawnFn 注入
 * @returns SessionController
 */
export function createSessionController(
  opts: CreateSessionControllerOptions,
): SessionController {
  const nowIso = opts.nowIso ?? (() => new Date().toISOString())
  const spawnFn = opts.spawnFn ?? spawnClaudeCode
  const wireFn = opts.wireFn ?? wireSpawnHandleToKillSwitch
  const transitions: SessionTransitionRecord[] = []
  let state: SessionState = 'idle'
  let handle: SpawnHandle | null = null
  let killToken: SpawnKillRegistryToken | null = null
  const mode: SpawnMode = opts.spawnOptions.mode ?? 'subscription'

  /**
   * Round 13 Dev-D Task C: finished 移行に伴う auto-unregister。
   *
   * - 通常終了 (handle.done() resolve) でも wireSpawnHandleToKillSwitch 内で auto-unregister
   *   される (Round 12 既存挙動)。
   * - 本 helper は recordTransition('finished') と同期に追加 unregister を呼ぶことで、
   *   kill 経由で finished に到達するケースでも確実に解除する (idempotent なので二重呼び safe)。
   */
  const ensureKillTokenReleased = (): void => {
    if (killToken) {
      try {
        killToken.unregister()
      } catch {
        // best effort
      }
    }
  }

  const recordTransition = (next: SessionState, reason?: string): void => {
    if (!isTransitionAllowed(state, next)) {
      throw new Error(
        `session-controller: invalid transition ${state} → ${next}` +
          (reason ? ` (reason: ${reason})` : ''),
      )
    }
    state = next
    const rec: SessionTransitionRecord = reason
      ? { state: next, at: nowIso(), reason }
      : { state: next, at: nowIso() }
    transitions.push(rec)
    // Round 13 Dev-D Task C: finished 到達で kill-token を必ず解除 (memory leak 防止)
    if (next === 'finished') {
      ensureKillTokenReleased()
    }
  }

  return {
    get state() {
      return state
    },
    mode,
    get spawnToken() {
      return handle?.spawnToken ?? null
    },
    get pid() {
      return handle?.pid ?? null
    },
    get transitions() {
      return transitions.slice()
    },
    get handle() {
      return handle
    },
    get killToken() {
      return killToken
    },
    async start() {
      if (state !== 'idle') {
        throw new Error(`session-controller: cannot start from state=${state}`)
      }
      recordTransition('starting', 'start() called')
      try {
        handle = spawnFn(opts.spawnOptions)
      } catch (err) {
        recordTransition('finished', `spawn failed: ${(err as Error).message}`)
        throw err
      }
      // Round 13 Dev-D Task C: kill-switch 統合 (registry が指定されている場合のみ)
      // - dry-run mode (handle.pid === -1) は wireSpawnHandleToKillSwitch 内で no-op (null 返却)
      // - 通常終了で wire 内 auto-unregister も働く + recordTransition('finished') でも解除
      if (opts.killRegistry) {
        try {
          killToken = wireFn(handle, opts.killRegistry, opts.killTargetName)
        } catch (err) {
          // wire 失敗時 (例: kill-switch limit 超過) は spawn を止め、finished へ遷移
          recordTransition(
            'finished',
            `kill-switch wire failed: ${(err as Error).message}`,
          )
          throw err
        }
      }
      // dry-run mode は即座に finished へ遷移 (child は exit code 0 即時)
      if (mode === 'dry-run') {
        recordTransition('finished', 'dry-run immediate completion')
      } else {
        recordTransition('running', 'spawn ok, child alive')
        // exit を non-await で監視
        handle.done().then((info) => {
          // exit 時に finished へ自動遷移 (kill 経由でなければ)
          if (state === 'running' || state === 'paused' || state === 'killing') {
            try {
              recordTransition(
                'finished',
                info.aborted
                  ? `aborted: ${info.abortReason ?? 'unknown'}`
                  : `exit code=${info.code} signal=${info.signal}`,
              )
            } catch {
              // 競合した場合は既に finished に到達済み、無視
            }
          }
        })
      }
      return handle
    },
    async pause(reason) {
      if (state !== 'running') {
        throw new Error(`session-controller: cannot pause from state=${state}`)
      }
      // 実 OS では SIGSTOP 相当だが、抽象 child.kill には SIGTERM/SIGKILL のみ。
      // 実装は MockChildProcess の onPause hook を caller が実装することを想定。
      // 現段階では state 遷移のみ記録し、SIGSTOP 連携は将来 hook 化。
      recordTransition('paused', reason ?? 'pause() called')
    },
    async resume(reason) {
      if (state !== 'paused') {
        throw new Error(`session-controller: cannot resume from state=${state}`)
      }
      recordTransition('running', reason ?? 'resume() called')
    },
    async kill(reason) {
      if (state === 'finished') return null
      if (state === 'idle') {
        recordTransition('starting', 'kill() called before start (auto-transition)')
        recordTransition('finished', 'kill() before spawn — no-op finish')
        return null
      }
      recordTransition('killing', reason ?? 'kill() called')
      if (handle) {
        handle.abort(reason ?? 'session-controller.kill()')
        const info = await handle.done()
        // 競合: handle.done() resolution が先に running → finished へ遷移させる可能性がある。
        // killing → finished は遷移許可なので race 後でも安全に finished に到達しているかを判定。
        if (state === 'killing') {
          recordTransition(
            'finished',
            `kill done: code=${info.code} signal=${info.signal}`,
          )
        }
        return info
      }
      recordTransition('finished', 'kill done (no handle)')
      return null
    },
  }
}

/**
 * 型: 純関数で session の最終終了情報を取り出す helper (caller の test 用)。
 */
export async function awaitSessionFinish(
  controller: SessionController,
): Promise<SpawnExitInfo | null> {
  if (controller.state === 'finished') {
    if (controller.handle) {
      return controller.handle.done()
    }
    return null
  }
  if (!controller.handle) return null
  return controller.handle.done()
}
