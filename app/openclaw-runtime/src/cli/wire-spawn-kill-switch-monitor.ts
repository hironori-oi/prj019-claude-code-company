/**
 * cli/wire-spawn-kill-switch-monitor — Round 14 Dev-D 着地 (Task C):
 *   Round 13 Dev-D 着地 `wireSpawnHandleToKillSwitch` + session-controller.start()
 *   統合の堅牢化レイヤ.
 *
 * 設計方針:
 *   - **memory leak 監視**: `KillToken` 登録から N 秒以内に `unregister()` が呼ばれない
 *     場合に warning を発火する (default 12h、subscription session 上限想定).
 *   - **dangling handle recovery**: session 終了時 (handle.done() resolve) でも
 *     unregister 漏れがあった場合、`forceUnregisterAll()` で一括解放できる.
 *   - **副作用 0 (DEC-019-007)**: monitor 自体は pure 構造体 + setTimeout/clearTimeout の
 *     OS scheduler 依存のみ. test では `nowMs` / `setTimer` / `clearTimer` を DI 注入できる.
 *   - **既存 wireSpawnHandleToKillSwitch は無改変**: 本 module は wrapper 層で
 *     monitor 機能を提供し、Round 13 までの caller は監視抜きで動作継続する.
 *
 * 関連:
 *   - cli/spawn-claude-code.ts (wireSpawnHandleToKillSwitch、Round 12/13 着地)
 *   - cli/session-controller.ts (Round 13 Dev-D Task C 着地、自動 wire)
 *   - DEC-019-007 (副作用ゼロ要件)
 *   - DEC-019-051 (subscription-driven 中核 / 12h 連続稼働 cap 監視)
 *
 * Round 15 引継ぎ予定:
 *   - audit log (kill-history.json 経由) と連携した leak 通知の Slack 通知化.
 *   - leak 検出を harness の usage-monitor.ts と統合し、12h cap と連動した自動 BAN drill.
 */
import {
  wireSpawnHandleToKillSwitch,
  type SpawnHandle,
  type SpawnKillRegistry,
  type SpawnKillRegistryToken,
} from './spawn-claude-code.js'

/** monitor を強制発火する閾値の default (12h、subscription 連続稼働 cap = NG-3). */
export const DEFAULT_LEAK_WARN_THRESHOLD_MS = 12 * 60 * 60 * 1000

/** monitor の警告 callback への通知種別. */
export type WireMonitorWarningKind =
  | 'leak_detected'
  | 'unregister_missing'
  | 'recovery_executed'

/**
 * monitor 警告 1 件分の構造化レコード.
 */
export interface WireMonitorWarning {
  readonly kind: WireMonitorWarningKind
  readonly tokenId: string
  readonly handleSpawnToken: string
  readonly handlePid: number
  readonly registeredAtIso: string
  readonly elapsedMs: number
  readonly message: string
}

export type WireMonitorWarningListener = (warning: WireMonitorWarning) => void

/**
 * monitor 内部に保持される 1 件分の wire レコード.
 */
interface WireRecord {
  readonly tokenId: string
  readonly handle: SpawnHandle
  readonly token: SpawnKillRegistryToken
  readonly registeredAtMs: number
  readonly registeredAtIso: string
  /** unregister 済かどうか (idempotent guard 用). */
  unregistered: boolean
  /** leak warn timer handle (clearTimeout 用). */
  warnTimer: ReturnType<typeof setTimeout> | null
}

/**
 * monitor インスタンス.
 *
 * 公開 API:
 *   - `wire(handle, registry, name?)` : wireSpawnHandleToKillSwitch をラップ + 監視登録.
 *   - `getActiveCount()` : 現在 unregister されていない wire 数.
 *   - `forceUnregisterAll(reason?)` : dangling handle を強制解放 (recovery 経路).
 *   - `dispose()` : timer を全 clear (test/shutdown 用).
 *   - `onWarning(listener)` : 警告通知 listener 登録.
 *   - `listActive()` : 現在 active な wire 一覧 (audit 用).
 */
export interface WireSpawnKillSwitchMonitor {
  wire(
    handle: SpawnHandle,
    registry: SpawnKillRegistry,
    name?: string,
  ): SpawnKillRegistryToken | null
  getActiveCount(): number
  listActive(): readonly Pick<
    WireRecord,
    'tokenId' | 'registeredAtIso' | 'registeredAtMs'
  >[]
  forceUnregisterAll(reason?: string): number
  dispose(): void
  onWarning(listener: WireMonitorWarningListener): () => void
}

/**
 * monitor 構築 options.
 */
export interface CreateWireMonitorOptions {
  /** leak 警告までの ms (default = 12h). */
  leakWarnThresholdMs?: number
  /** 内部 nowMs hook (test 用、default = Date.now). */
  nowMs?: () => number
  /** ISO 時刻取得 hook (test 用、default = () => new Date(nowMs()).toISOString()). */
  nowIso?: () => string
  /** wireSpawnHandleToKillSwitch 注入 (test 用). */
  wireFn?: typeof wireSpawnHandleToKillSwitch
  /** setTimeout 注入 (test 用、default = global setTimeout). */
  setTimer?: (cb: () => void, ms: number) => ReturnType<typeof setTimeout>
  /** clearTimeout 注入. */
  clearTimer?: (handle: ReturnType<typeof setTimeout>) => void
}

/**
 * monitor を生成する factory (副作用 0).
 */
export function createWireSpawnKillSwitchMonitor(
  opts: CreateWireMonitorOptions = {},
): WireSpawnKillSwitchMonitor {
  const threshold = opts.leakWarnThresholdMs ?? DEFAULT_LEAK_WARN_THRESHOLD_MS
  const nowMs = opts.nowMs ?? (() => Date.now())
  const nowIso = opts.nowIso ?? (() => new Date(nowMs()).toISOString())
  const wireFn = opts.wireFn ?? wireSpawnHandleToKillSwitch
  const setTimer = opts.setTimer ?? ((cb, ms) => setTimeout(cb, ms))
  const clearTimer =
    opts.clearTimer ?? ((h: ReturnType<typeof setTimeout>) => clearTimeout(h))

  const records = new Map<string, WireRecord>()
  const warningListeners: WireMonitorWarningListener[] = []
  let disposed = false

  const emit = (warning: WireMonitorWarning): void => {
    for (const l of warningListeners) {
      try {
        l(warning)
      } catch {
        // best effort: monitor 自身で listener エラーは握り潰す
      }
    }
  }

  const removeRecord = (tokenId: string): WireRecord | undefined => {
    const rec = records.get(tokenId)
    if (!rec) return undefined
    if (rec.warnTimer) {
      try {
        clearTimer(rec.warnTimer)
      } catch {
        // best effort
      }
      rec.warnTimer = null
    }
    records.delete(tokenId)
    return rec
  }

  return {
    wire(handle, registry, name) {
      if (disposed) {
        return wireFn(handle, registry, name)
      }
      const token = wireFn(handle, registry, name)
      // dry-run handle (pid===-1) や registry が token を返さない実装の場合 null になる.
      if (!token) return null

      const registeredAtMs = nowMs()
      const record: WireRecord = {
        tokenId: token.id,
        handle,
        token,
        registeredAtMs,
        registeredAtIso: nowIso(),
        unregistered: false,
        warnTimer: null,
      }

      // leak warn timer 設定. unregister 前に閾値経過すれば警告発火.
      record.warnTimer = setTimer(() => {
        // この時点で record がまだ active なら leak と判定.
        if (records.has(token.id) && !record.unregistered) {
          emit({
            kind: 'leak_detected',
            tokenId: token.id,
            handleSpawnToken: handle.spawnToken,
            handlePid: handle.pid,
            registeredAtIso: record.registeredAtIso,
            elapsedMs: nowMs() - record.registeredAtMs,
            message:
              `wire-monitor: KillToken ${token.id} (spawn=${handle.spawnToken}, pid=${handle.pid}) ` +
              `not unregistered after ${threshold}ms — possible memory leak.`,
          })
        }
      }, threshold)
      // unref で event loop ブロック回避 (Node.js timer のみ).
      const t = record.warnTimer as unknown as { unref?: () => void }
      if (typeof t.unref === 'function') {
        t.unref()
      }
      records.set(token.id, record)

      // wireSpawnHandleToKillSwitch は handle.done().then で auto-unregister するが、
      // monitor 側でも record を解除するため wrapper token を返す.
      const wrappedToken: SpawnKillRegistryToken = {
        id: token.id,
        unregister: () => {
          if (record.unregistered) return
          record.unregistered = true
          try {
            token.unregister()
          } catch {
            // best effort
          }
          removeRecord(token.id)
        },
      }

      // handle.done() で auto-cleanup (wireSpawnHandleToKillSwitch 側でも auto-unregister
      // が呼ばれるが、本 monitor が record を保持しているため cleanup 必須).
      void handle.done().then(
        () => {
          if (records.has(token.id) && !record.unregistered) {
            // auto-unregister がまだ呼ばれていない (= wire 内 done().then 競合) 場合に
            // unregister_missing として通知し、強制解放.
            emit({
              kind: 'unregister_missing',
              tokenId: token.id,
              handleSpawnToken: handle.spawnToken,
              handlePid: handle.pid,
              registeredAtIso: record.registeredAtIso,
              elapsedMs: nowMs() - record.registeredAtMs,
              message:
                `wire-monitor: handle.done() resolved but token ${token.id} still active. ` +
                `Force-unregistering.`,
            })
            wrappedToken.unregister()
          } else if (records.has(token.id) && record.unregistered) {
            // unregister 済 (idempotent) でも record が残っていれば cleanup
            removeRecord(token.id)
          }
        },
        () => {
          // handle.done() reject — これは spawn-claude-code.ts 既存実装では
          // 起きないが、defensive に cleanup.
          if (records.has(token.id) && !record.unregistered) {
            wrappedToken.unregister()
          }
        },
      )

      return wrappedToken
    },
    getActiveCount() {
      return records.size
    },
    listActive() {
      const out: Pick<WireRecord, 'tokenId' | 'registeredAtIso' | 'registeredAtMs'>[] = []
      for (const rec of records.values()) {
        out.push({
          tokenId: rec.tokenId,
          registeredAtIso: rec.registeredAtIso,
          registeredAtMs: rec.registeredAtMs,
        })
      }
      return out
    },
    forceUnregisterAll(reason) {
      const targets = [...records.values()]
      let count = 0
      for (const rec of targets) {
        if (rec.unregistered) continue
        rec.unregistered = true
        try {
          rec.token.unregister()
        } catch {
          // best effort
        }
        emit({
          kind: 'recovery_executed',
          tokenId: rec.tokenId,
          handleSpawnToken: rec.handle.spawnToken,
          handlePid: rec.handle.pid,
          registeredAtIso: rec.registeredAtIso,
          elapsedMs: nowMs() - rec.registeredAtMs,
          message:
            `wire-monitor: forceUnregisterAll executed (reason=${reason ?? 'unspecified'}, token=${rec.tokenId})`,
        })
        removeRecord(rec.tokenId)
        count++
      }
      return count
    },
    dispose() {
      if (disposed) return
      disposed = true
      // 全 timer を clear (record は保持、cleanup 漏れ検出は外部に委ねる)
      for (const rec of records.values()) {
        if (rec.warnTimer) {
          try {
            clearTimer(rec.warnTimer)
          } catch {
            // best effort
          }
          rec.warnTimer = null
        }
      }
      records.clear()
    },
    onWarning(listener) {
      warningListeners.push(listener)
      return () => {
        const idx = warningListeners.indexOf(listener)
        if (idx >= 0) warningListeners.splice(idx, 1)
      }
    },
  }
}
