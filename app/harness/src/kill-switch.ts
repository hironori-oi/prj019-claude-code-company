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

  /**
   * Round 7 G-03': process tree kill。
   * `parentPid` 配下の全子孫プロセスを列挙し、SIGTERM を一斉送信、
   * 5 秒 grace を待って残存プロセスへ SIGKILL を送る。
   * Windows / Linux / macOS で挙動を分岐する。
   *
   * 注: 内部的には `enumerateProcessTree` / `signalProcess` を `deps` から
   * 注入できる設計とし、テスト時は mock を差し替える (Windows でも実 spawn 不要)。
   */
  async killProcessTree(
    parentPid: number,
    deps: KillProcessTreeDeps = realKillProcessTreeDeps,
    opts: { gracePeriodMs?: number } = {},
  ): Promise<KillProcessTreeResult> {
    return killProcessTree(parentPid, deps, opts)
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

// ============================================================================
// Round 7 G-03': process tree kill
// ============================================================================

/**
 * 注入可能な OS 依存層。
 * - enumerateTree(pid): pid 配下の子孫 pid 一覧 (parent を含む) を列挙する。
 * - signal(pid, sig): 単一 pid に SIGTERM/SIGKILL 相当を送る。
 *
 * Windows: enumerate=`wmic`/`Get-CimInstance Win32_Process` 相当、signal=`taskkill /F /PID`
 * Linux/macOS: enumerate=`ps -o pid=,ppid= -e`、signal=`process.kill(pid, sig)`
 *
 * テストでは本 interface を mock 実装に差し替えるため、現環境で実 spawn を行わず
 * 単体検証可能。実 OS 連携は `realKillProcessTreeDeps` を default として export。
 */
export interface KillProcessTreeDeps {
  enumerateTree(parentPid: number): Promise<number[]>
  signal(pid: number, sig: 'SIGTERM' | 'SIGKILL'): Promise<void> | void
  isAlive(pid: number): boolean | Promise<boolean>
  /** test 用 sleep */
  sleep?(ms: number): Promise<void>
  /** test 用 platform 上書き (default process.platform) */
  platform?: NodeJS.Platform
}

export interface KillProcessTreeResult {
  pids: number[]
  sigtermSent: number[]
  sigkillSent: number[]
  platform: NodeJS.Platform
}

const defaultSleepMs = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms))

/**
 * 「全列挙 → SIGTERM 一斉 → grace → 残存に SIGKILL」を実装。
 * platform 分岐は deps 側で行う (Windows / Linux / macOS)。
 */
export async function killProcessTree(
  parentPid: number,
  deps: KillProcessTreeDeps,
  opts: { gracePeriodMs?: number } = {},
): Promise<KillProcessTreeResult> {
  const grace = opts.gracePeriodMs ?? 5_000
  const sleep = deps.sleep ?? defaultSleepMs
  const platform = deps.platform ?? process.platform

  const pids = await deps.enumerateTree(parentPid)
  const sigtermSent: number[] = []
  for (const pid of pids) {
    try {
      await deps.signal(pid, 'SIGTERM')
      sigtermSent.push(pid)
    } catch {
      // 既に死んでいる等は無視
    }
  }

  // grace 期間 alive 監視
  const start = Date.now()
  while (Date.now() - start < grace) {
    let anyAlive = false
    for (const pid of pids) {
      if (await deps.isAlive(pid)) {
        anyAlive = true
        break
      }
    }
    if (!anyAlive) {
      return { pids, sigtermSent, sigkillSent: [], platform }
    }
    await sleep(Math.min(50, grace))
  }

  // 残存に SIGKILL escalate
  const sigkillSent: number[] = []
  for (const pid of pids) {
    if (await deps.isAlive(pid)) {
      try {
        await deps.signal(pid, 'SIGKILL')
        sigkillSent.push(pid)
      } catch {
        // ignore
      }
    }
  }
  return { pids, sigtermSent, sigkillSent, platform }
}

/**
 * 実 OS 連携の deps (default)。`execFile` ベースで shell injection を回避し、
 * pid (number) と固定文字列引数のみで構成する。
 *
 * W0 段階では unit test では mock deps を渡す前提で、本 default は
 * 実環境統合 (W1+) でのみ使用する。
 */
import { execFileSync } from 'node:child_process'

export const realKillProcessTreeDeps: KillProcessTreeDeps = {
  async enumerateTree(parentPid: number): Promise<number[]> {
    const platform = process.platform
    if (platform === 'win32') {
      try {
        const out = execFileSync(
          'wmic',
          ['process', 'get', 'ProcessId,ParentProcessId', '/format:csv'],
          { encoding: 'utf-8' },
        )
        return collectDescendants(parsePsLikeOutput(out, 'csv'), parentPid)
      } catch {
        return [parentPid]
      }
    }
    try {
      const out = execFileSync('ps', ['-e', '-o', 'pid=,ppid='], {
        encoding: 'utf-8',
      })
      return collectDescendants(parsePsLikeOutput(out, 'unix'), parentPid)
    } catch {
      return [parentPid]
    }
  },
  async signal(pid: number, sig: 'SIGTERM' | 'SIGKILL'): Promise<void> {
    if (process.platform === 'win32') {
      try {
        const args = sig === 'SIGKILL'
          ? ['/PID', String(pid), '/F']
          : ['/PID', String(pid)]
        execFileSync('taskkill', args, { stdio: 'ignore' })
      } catch {
        // ignore
      }
      return
    }
    try {
      process.kill(pid, sig)
    } catch {
      // ignore (already dead)
    }
  },
  isAlive(pid: number): boolean {
    if (process.platform === 'win32') {
      try {
        const out = execFileSync(
          'tasklist',
          ['/FI', `PID eq ${pid}`, '/NH', '/FO', 'CSV'],
          { encoding: 'utf-8' },
        )
        return out.includes(`"${pid}"`)
      } catch {
        return false
      }
    }
    try {
      // signal 0 は存在チェック (送信せず権限のみ確認)
      process.kill(pid, 0)
      return true
    } catch {
      return false
    }
  },
}

/** ps / wmic の出力をパースして {pid, ppid}[] を返す。 */
function parsePsLikeOutput(
  out: string,
  format: 'unix' | 'csv',
): { pid: number; ppid: number }[] {
  const rows: { pid: number; ppid: number }[] = []
  const lines = out.split(/\r?\n/)
  for (const raw of lines) {
    const line = raw.trim()
    if (line.length === 0) continue
    if (format === 'csv') {
      // CSV header: Node,ParentProcessId,ProcessId
      const parts = line.split(',')
      if (parts.length < 3) continue
      const ppid = Number(parts[1])
      const pid = Number(parts[2])
      if (Number.isFinite(pid) && Number.isFinite(ppid)) rows.push({ pid, ppid })
      continue
    }
    // unix: 例 "12345 12000"
    const m = /(\d+)\s+(\d+)/.exec(line)
    if (!m) continue
    const pid = Number(m[1])
    const ppid = Number(m[2])
    if (Number.isFinite(pid) && Number.isFinite(ppid)) rows.push({ pid, ppid })
  }
  return rows
}

function collectDescendants(
  rows: { pid: number; ppid: number }[],
  root: number,
): number[] {
  const out = new Set<number>([root])
  let added = true
  while (added) {
    added = false
    for (const r of rows) {
      if (out.has(r.ppid) && !out.has(r.pid)) {
        out.add(r.pid)
        added = true
      }
    }
  }
  return [...out]
}
