/**
 * kill-switch — 緊急停止スイッチ。
 *
 * 関連必須コントロール:
 *   G-02 (緊急停止) / G-05 (subprocess kill チェーン) / G-06 (circuit-breaker open 連動)
 *   G-V2-11 (BAN フォールバック検知 < 1 分 / 通知 < 5 分)
 *
 * 触発条件:
 *   - cost-tracker による予算超過
 *   - usage-monitor によるレート異常 (401/403/429 連続検知)
 *   - 連続稼働 12h 超過
 *   - 手動: ~/.clawbridge/STOP ファイル出現 (`touch` で発動)
 *   - API: trigger(reason) メソッド呼び出し
 *
 * 仕様:
 *   - 起動後 STOP ファイルを fs.watch で監視 (poll fallback あり; Windows での fs.watch 信頼性のため)
 *   - trigger 時、登録済 onTrigger ハンドラを順次実行 (各 5 秒 timeout)
 *   - すべてのハンドラ完了 or timeout 後 process.exit() を呼ぶ (Harness クラスが exit 制御)
 *   - 停止理由は kill-history.json に追記 (PostMortem 用)
 *
 * Round 6 拡張 (G-05/G-06):
 *   - SubprocessKillTarget interface: openclaw-runtime の subprocess を SIGTERM → SIGKILL
 *     fallback で停止する契約 (実装は openclaw-runtime 側)。
 *   - registerSubprocessKill / registerCircuitBreakerOpen で kill チェーンを構成:
 *     trigger 検知時 → circuit-breaker open → subprocess kill の順序で連鎖。
 *
 * Windows 11 primary 注意:
 *   - fs.watch は Windows でファイル名 case 違い等で取りこぼしが起きるため、
 *     1 秒間隔の polling fallback で stat チェックも併用する。
 */
import { promises as fs } from 'node:fs'
import { watch } from 'node:fs'
import type { FSWatcher } from 'node:fs'
import { KILL_SIGNAL_PATH, KILL_HISTORY_PATH } from './paths.js'
import { ensureDirSelf, fileExists, loadJson, saveJson } from './fs-store.js'
import { dirname } from 'node:path'

export interface KillTriggerMeta {
  source: 'manual' | 'budget' | 'rate_anomaly' | 'continuous_runtime' | 'file_signal' | 'other'
  details?: Record<string, unknown>
}

export interface KillRecord {
  ts: string
  reason: string
  meta?: KillTriggerMeta
}

/**
 * subprocess kill 契約 (Round 6 G-05)。
 * openclaw-runtime や claude-bridge が child_process を保持する場合、
 * 本契約を実装した object を kill-switch に登録する。
 *
 * - signal('SIGTERM') を最初に試行
 * - timeoutMs 経過しても alive() なら signal('SIGKILL') で強制終了
 */
export interface SubprocessKillTarget {
  /** 登録名 (kill-history で使用) */
  name: string
  /** 子プロセスが alive か */
  alive(): boolean
  /** signal を送る (SIGTERM / SIGKILL) */
  signal(sig: 'SIGTERM' | 'SIGKILL'): Promise<void> | void
  /** SIGTERM → SIGKILL fallback の wait timeout (ms)。default 2000 */
  gracePeriodMs?: number
}

/**
 * circuit-breaker open 連動契約 (Round 6 G-06)。
 * 任意の circuit-breaker を kill-switch に登録すると、trigger 検知時に
 * 自動的に open 状態へ強制遷移する。
 */
export interface CircuitBreakerOpenTarget {
  name: string
  /** 強制 open 化 (cooldown は実装依存) */
  forceOpen(reason?: string): void
}

export interface KillSwitch {
  arm(): Promise<void>
  disarm(): Promise<void>
  isArmed(): boolean
  trigger(reason: string, meta?: KillTriggerMeta): Promise<void>
  isTriggered(): boolean
  onTrigger(handler: KillTriggerHandler): void
  /** STOP ファイルクリア (drill 後の再アーム時に使用) */
  clearSignal(): Promise<void>
  // ---- Round 6 G-05/G-06 ----
  /**
   * subprocess kill target を登録 (G-05)。trigger 検知時 SIGTERM → SIGKILL fallback で停止。
   */
  registerSubprocessKill(target: SubprocessKillTarget): void
  /**
   * circuit-breaker open target を登録 (G-06)。trigger 検知時に open 状態へ強制遷移。
   * 順序: circuit-breaker open → subprocess kill の連鎖を保つため、
   *       本登録は subprocess kill より前に実行される。
   */
  registerCircuitBreakerOpen(target: CircuitBreakerOpenTarget): void
}

export type KillTriggerHandler = (reason: string, meta?: KillTriggerMeta) => Promise<void> | void

interface KillSwitchOptions {
  signalPath?: string
  historyPath?: string
  /** STOP ファイル polling 間隔 (ms)。Windows での fs.watch 取りこぼし対策。 */
  pollIntervalMs?: number
  /** 各 onTrigger ハンドラの実行 timeout (ms)。 */
  handlerTimeoutMs?: number
  /** trigger 時に process.exit するか (テストでは false) */
  exitOnTrigger?: boolean
}

export class FileKillSwitch implements KillSwitch {
  private armed = false
  private triggered = false
  private readonly handlers: KillTriggerHandler[] = []
  private watcher: FSWatcher | null = null
  private pollTimer: NodeJS.Timeout | null = null

  // Round 6 G-05/G-06
  private readonly subprocessTargets: SubprocessKillTarget[] = []
  private readonly circuitBreakerTargets: CircuitBreakerOpenTarget[] = []

  private readonly signalPath: string
  private readonly historyPath: string
  private readonly pollIntervalMs: number
  private readonly handlerTimeoutMs: number
  private readonly exitOnTrigger: boolean

  constructor(opts: KillSwitchOptions = {}) {
    this.signalPath = opts.signalPath ?? KILL_SIGNAL_PATH
    this.historyPath = opts.historyPath ?? KILL_HISTORY_PATH
    this.pollIntervalMs = opts.pollIntervalMs ?? 1000
    this.handlerTimeoutMs = opts.handlerTimeoutMs ?? 5000
    this.exitOnTrigger = opts.exitOnTrigger ?? false
  }

  registerSubprocessKill(target: SubprocessKillTarget): void {
    this.subprocessTargets.push(target)
  }

  registerCircuitBreakerOpen(target: CircuitBreakerOpenTarget): void {
    this.circuitBreakerTargets.push(target)
  }

  async arm(): Promise<void> {
    if (this.armed) return
    this.armed = true

    // signal dir を確保
    await ensureDirSelf(dirname(this.signalPath))

    // 起動時点で STOP ファイルが残っていたら直ちに発動
    if (await fileExists(this.signalPath)) {
      await this.trigger('STOP signal file exists at startup', { source: 'file_signal' })
      return
    }

    // fs.watch (Windows での信頼性は不安定なため try-catch)
    try {
      this.watcher = watch(dirname(this.signalPath), (eventType, filename) => {
        if (
          (eventType === 'rename' || eventType === 'change') &&
          filename === 'STOP' &&
          !this.triggered
        ) {
          void this.checkSignalFile()
        }
      })
    } catch {
      // fs.watch 失敗時は polling のみで対応
    }

    // 1 秒間隔の polling (fs.watch fallback)
    this.pollTimer = setInterval(() => {
      if (!this.triggered) {
        void this.checkSignalFile()
      }
    }, this.pollIntervalMs)

    // process exit 時のクリーンアップ
    this.pollTimer.unref?.()
  }

  async disarm(): Promise<void> {
    this.armed = false
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }

  isArmed(): boolean {
    return this.armed
  }

  isTriggered(): boolean {
    return this.triggered
  }

  onTrigger(handler: KillTriggerHandler): void {
    this.handlers.push(handler)
  }

  async trigger(reason: string, meta?: KillTriggerMeta): Promise<void> {
    if (this.triggered) return
    this.triggered = true

    // 履歴に書込 (失敗しても処理は止めない)
    try {
      await this.appendHistory({
        ts: new Date().toISOString(),
        reason,
        ...(meta !== undefined && { meta }),
      })
    } catch {
      // ignore — 緊急停止中なので best effort
    }

    // Round 6 G-06: circuit-breaker を先に open (新規 fire を即拒否)
    for (const cb of this.circuitBreakerTargets) {
      try {
        cb.forceOpen(`kill-switch trigger: ${reason}`)
      } catch {
        // best effort
      }
    }

    // Round 6 G-05: 登録 subprocess を SIGTERM → SIGKILL fallback で停止
    await this.killAllSubprocesses()

    // ハンドラ順次実行 (各 timeout あり)
    for (const h of this.handlers) {
      try {
        await Promise.race([
          Promise.resolve(h(reason, meta)),
          new Promise<void>((_, reject) =>
            setTimeout(
              () => reject(new Error(`kill-switch handler timeout (${this.handlerTimeoutMs}ms)`)),
              this.handlerTimeoutMs,
            ),
          ),
        ])
      } catch {
        // ignore — 緊急停止フェーズなので継続
      }
    }

    await this.disarm()

    if (this.exitOnTrigger) {
      // 1 tick 待ってから exit (ログ flush)
      setImmediate(() => {
        process.exit(1)
      })
    }
  }

  /**
   * Round 6 G-05: 登録された subprocess を SIGTERM → grace 待機 → SIGKILL fallback で停止。
   * gracePeriodMs を超えても alive() の場合のみ SIGKILL に escalate する。
   */
  private async killAllSubprocesses(): Promise<void> {
    for (const target of this.subprocessTargets) {
      const grace = target.gracePeriodMs ?? 2000
      try {
        if (!target.alive()) continue
        // SIGTERM
        await target.signal('SIGTERM')
        // grace 期間中は alive() を polling
        const start = Date.now()
        while (Date.now() - start < grace) {
          if (!target.alive()) break
          await new Promise((r) => setTimeout(r, Math.min(50, grace)))
        }
        if (target.alive()) {
          // SIGKILL fallback
          await target.signal('SIGKILL')
        }
      } catch {
        // best effort
      }
    }
  }

  async clearSignal(): Promise<void> {
    try {
      await fs.unlink(this.signalPath)
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err
      }
    }
    this.triggered = false
  }

  private async checkSignalFile(): Promise<void> {
    if (this.triggered || !this.armed) return
    if (await fileExists(this.signalPath)) {
      await this.trigger(`STOP signal file detected at ${this.signalPath}`, { source: 'file_signal' })
    }
  }

  private async appendHistory(record: KillRecord): Promise<void> {
    const history = await loadJson<{ records: KillRecord[] }>(this.historyPath, { records: [] })
    history.records.push(record)
    await saveJson(this.historyPath, history)
  }
}
