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
import { z } from 'zod'
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
   *
   * Round 12 拡張:
   *   - 戻り値の `KillToken` を caller が保持し、subprocess 正常終了時に `unregister()`
   *     を呼ぶことでメモリリークを防止する (long-running session で多数 spawn 経路を想定)。
   *   - 同時登録上限 256 を超過した場合は `KillSwitchError('subprocess_limit_exceeded')`
   *     を throw する (DoS 緩和、暴走中のさらなる暴走を抑止)。
   *   - 既存の void-return コール (Round 6 / Round 11 fixture) と完全互換: 戻り値を
   *     破棄しても従来挙動 (kill 時のみ使用、unregister なし) を維持する。
   */
  registerSubprocessKill(target: SubprocessKillTarget): KillToken
  /**
   * circuit-breaker open target を登録 (G-06)。trigger 検知時に open 状態へ強制遷移。
   * 順序: circuit-breaker open → subprocess kill の連鎖を保つため、
   *       本登録は subprocess kill より前に実行される。
   */
  registerCircuitBreakerOpen(target: CircuitBreakerOpenTarget): void
  /**
   * Round 13 Dev-D Task A: graceful shutdown timeout を上書き設定する。
   * 既存 default (200/200/100) は Round 12 までと完全互換。
   * 引数は zod (KillSwitchOptionsSchema) で validate される。
   * 環境変数 (OPEN_CLAW_KILL_GRACE_MS / OPEN_CLAW_KILL_SIGTERM_TIMEOUT_MS /
   * OPEN_CLAW_KILL_SIGKILL_TIMEOUT_MS) より優先される。
   */
  configure(options: KillSwitchOptionsType): void
  /**
   * Round 13 Dev-D Task A: 現時点で適用されている graceful config を返す (test / audit 用)。
   */
  getGracefulConfig(): ResolvedKillSwitchGracefulConfig
}

/**
 * Round 12 拡張: subprocess 登録上限超過などの programming error を表すドメインエラー。
 *
 * `code` は安定した文字列 ID で、テスト assert / dashboard 集計に使う。
 *   - `subprocess_limit_exceeded` : registerSubprocessKill の同時登録上限を超えた
 */
export class KillSwitchError extends Error {
  readonly code: KillSwitchErrorCode
  constructor(code: KillSwitchErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'KillSwitchError'
    this.code = code
  }
}

export type KillSwitchErrorCode = 'subprocess_limit_exceeded'

/**
 * Round 12 拡張: registerSubprocessKill の戻り値。caller が subprocess の正常終了時に
 * `unregister()` を呼んでメモリリーク (kill-switch 内部 Set への滞留) を防ぐ。
 *
 * - `unregister()` は 二重呼び safe (idempotent)
 */
export interface KillToken {
  readonly id: string
  unregister(): void
}

/** Round 12: 同時 subprocess 登録上限。Set ベースで超過時 KillSwitchError を投げる。 */
export const SUBPROCESS_KILL_LIMIT = 256

// ============================================================================
// Round 13 Dev-D Task A: graceful shutdown timeout 設定可能化
// ============================================================================

/**
 * Round 13 Dev-D Task A: graceful shutdown timeout の構造化設定 schema。
 *
 * Round 12 までは default 200ms hard-coded だったが、Round 13 では caller / 環境変数
 * から override 可能にする。3 段階 (gracePeriod / sigtermTimeout / sigkillTimeout) を
 * 独立に設定できることで、CI / production / local debug で異なる挙動を実現する。
 *
 * 各 field の意味:
 *   - gracePeriodMs   : SIGTERM 後 target.alive() を polling する最大時間 (ms)。
 *                        target ごとの target.gracePeriodMs が指定された場合はそちらが
 *                        優先される (個別 override > switch-wide override > default)。
 *   - sigtermTimeoutMs: SIGTERM 送信操作自体の timeout (ms)。target.signal が hang した
 *                        場合の保護。0 = 無制限 (Round 12 までの挙動)。
 *   - sigkillTimeoutMs: SIGKILL 送信操作自体の timeout (ms)。同上。
 *
 * 既存挙動との互換性:
 *   - configure() を呼ばない場合、すべての default 値は Round 12 までと一致 (200/200/100)
 *     ただし Round 12 までの実装では sigterm/sigkill timeout は概念として存在しなかった。
 *     既存テスト fixture では target.signal は同期的 / 即時 resolve なので timeout は発火しない。
 */
export const KillSwitchOptionsSchema = z
  .object({
    gracePeriodMs: z.number().int().min(0).max(60_000).optional(),
    sigtermTimeoutMs: z.number().int().min(0).max(60_000).optional(),
    sigkillTimeoutMs: z.number().int().min(0).max(60_000).optional(),
  })
  .strict()

export type KillSwitchOptionsType = z.infer<typeof KillSwitchOptionsSchema>

/**
 * Round 13 Dev-D Task A: graceful shutdown 設定の internal 型。
 * configure() / 環境変数 / default が merge された後の最終値を表現する。
 */
export interface ResolvedKillSwitchGracefulConfig {
  readonly gracePeriodMs: number
  readonly sigtermTimeoutMs: number
  readonly sigkillTimeoutMs: number
}

/** Round 13 Dev-D Task A: configure 未呼び出し時の default 値。 */
export const DEFAULT_KILL_SWITCH_GRACEFUL: ResolvedKillSwitchGracefulConfig = Object.freeze({
  gracePeriodMs: 200,
  sigtermTimeoutMs: 200,
  sigkillTimeoutMs: 100,
})

/** Round 13 Dev-D Task A: 環境変数 override の名前。 */
export const KILL_SWITCH_ENV_GRACE_KEY = 'OPEN_CLAW_KILL_GRACE_MS'
export const KILL_SWITCH_ENV_SIGTERM_KEY = 'OPEN_CLAW_KILL_SIGTERM_TIMEOUT_MS'
export const KILL_SWITCH_ENV_SIGKILL_KEY = 'OPEN_CLAW_KILL_SIGKILL_TIMEOUT_MS'

/**
 * 純関数: 環境変数から KillSwitchOptionsType を構築 (test 注入可能)。
 *
 * - 数値変換に失敗 / 範囲外 / 負数は無視 (default にフォールバック)。
 * - 何も拾えない場合は空 object を返す (= configure 未呼び出し相当)。
 */
export function resolveKillSwitchOptionsFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): KillSwitchOptionsType {
  const out: KillSwitchOptionsType = {}
  const tryNum = (key: string): number | undefined => {
    const raw = env[key]
    if (raw === undefined || raw === '') return undefined
    const n = Number.parseInt(raw, 10)
    if (!Number.isFinite(n) || n < 0 || n > 60_000) return undefined
    return n
  }
  const g = tryNum(KILL_SWITCH_ENV_GRACE_KEY)
  if (g !== undefined) out.gracePeriodMs = g
  const t = tryNum(KILL_SWITCH_ENV_SIGTERM_KEY)
  if (t !== undefined) out.sigtermTimeoutMs = t
  const k = tryNum(KILL_SWITCH_ENV_SIGKILL_KEY)
  if (k !== undefined) out.sigkillTimeoutMs = k
  return out
}

/**
 * 純関数: 3 段の優先順位で final config を解決する。
 *   1. 明示 options (configure() 引数)
 *   2. 環境変数 override
 *   3. default
 */
export function mergeKillSwitchGracefulConfig(
  explicit: KillSwitchOptionsType | undefined,
  envOpts: KillSwitchOptionsType,
  base: ResolvedKillSwitchGracefulConfig = DEFAULT_KILL_SWITCH_GRACEFUL,
): ResolvedKillSwitchGracefulConfig {
  return Object.freeze({
    gracePeriodMs:
      explicit?.gracePeriodMs ?? envOpts.gracePeriodMs ?? base.gracePeriodMs,
    sigtermTimeoutMs:
      explicit?.sigtermTimeoutMs ?? envOpts.sigtermTimeoutMs ?? base.sigtermTimeoutMs,
    sigkillTimeoutMs:
      explicit?.sigkillTimeoutMs ?? envOpts.sigkillTimeoutMs ?? base.sigkillTimeoutMs,
  })
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
  /**
   * Round 13 Dev-D Task A: graceful shutdown timeout の構造化 override。
   *   - configure() / 環境変数より低優先 (= constructor 引数 < env < configure())
   *   - 未指定なら default (200/200/100)。
   *
   * 注: env override も constructor 時点で読み込まれる。test では env を pre-set してから
   * 新規 instance を作るか、明示的に configure() を呼ぶこと。
   */
  graceful?: KillSwitchOptionsType
  /**
   * Round 13 Dev-D Task A: env 注入 hook (test 用、default = process.env)。
   * production では指定不要。
   */
  envForGraceful?: NodeJS.ProcessEnv
}

export class FileKillSwitch implements KillSwitch {
  private armed = false
  private triggered = false
  private readonly handlers: KillTriggerHandler[] = []
  private watcher: FSWatcher | null = null
  private pollTimer: NodeJS.Timeout | null = null

  // Round 6 G-05/G-06 — Round 12 拡張: Set + KillToken による unregister 対応
  private readonly subprocessEntries: Set<{ id: string; target: SubprocessKillTarget }> = new Set()
  private _subprocessTokenCounter = 0
  private readonly circuitBreakerTargets: CircuitBreakerOpenTarget[] = []

  private readonly signalPath: string
  private readonly historyPath: string
  private readonly pollIntervalMs: number
  private readonly handlerTimeoutMs: number
  private readonly exitOnTrigger: boolean
  // Round 13 Dev-D Task A: graceful shutdown 設定。
  // 優先度: configure() の引数 > env override > constructor opts.graceful > default
  private gracefulConfig: ResolvedKillSwitchGracefulConfig

  constructor(opts: KillSwitchOptions = {}) {
    this.signalPath = opts.signalPath ?? KILL_SIGNAL_PATH
    this.historyPath = opts.historyPath ?? KILL_HISTORY_PATH
    this.pollIntervalMs = opts.pollIntervalMs ?? 1000
    this.handlerTimeoutMs = opts.handlerTimeoutMs ?? 5000
    this.exitOnTrigger = opts.exitOnTrigger ?? false
    // Round 13 Dev-D Task A:
    //   constructor opts.graceful (低優先) <= env override <= configure() (最優先)
    const env = opts.envForGraceful ?? process.env
    const envOpts = resolveKillSwitchOptionsFromEnv(env)
    // constructor 引数が base、env が上書き
    const baseFromConstructor = mergeKillSwitchGracefulConfig(
      opts.graceful,
      {},
      DEFAULT_KILL_SWITCH_GRACEFUL,
    )
    this.gracefulConfig = mergeKillSwitchGracefulConfig(
      undefined,
      envOpts,
      baseFromConstructor,
    )
  }

  /**
   * Round 13 Dev-D Task A: graceful shutdown timeout を runtime で上書きする。
   *
   * - 引数は zod (KillSwitchOptionsSchema) で validate。
   * - validation 失敗時は ZodError を rethrow (caller が握る)。
   * - 部分指定 OK (未指定 field は前回値を維持)。
   * - 既存 API 完全互換: 本メソッドを呼ばなければ default 200/200/100 が維持される。
   */
  configure(options: KillSwitchOptionsType): void {
    const parsed = KillSwitchOptionsSchema.parse(options)
    // 既存 gracefulConfig を base に、parsed のみ上書き
    this.gracefulConfig = mergeKillSwitchGracefulConfig(
      parsed,
      {},
      this.gracefulConfig,
    )
  }

  /**
   * Round 13 Dev-D Task A: 現時点で適用されている graceful config を返す。
   */
  getGracefulConfig(): ResolvedKillSwitchGracefulConfig {
    return this.gracefulConfig
  }

  registerSubprocessKill(target: SubprocessKillTarget): KillToken {
    if (this.subprocessEntries.size >= SUBPROCESS_KILL_LIMIT) {
      throw new KillSwitchError(
        'subprocess_limit_exceeded',
        `subprocess registration limit exceeded (${SUBPROCESS_KILL_LIMIT}). ` +
          `Ensure each spawn calls KillToken.unregister() on graceful exit.`,
      )
    }
    this._subprocessTokenCounter += 1
    const id = `kt-${Date.now()}-${this._subprocessTokenCounter}`
    const entry = { id, target }
    this.subprocessEntries.add(entry)
    let unregistered = false
    return {
      id,
      unregister: (): void => {
        if (unregistered) return
        unregistered = true
        this.subprocessEntries.delete(entry)
      },
    }
  }

  /** test 用 helper: 現在登録されている subprocess 数。 */
  getRegisteredSubprocessCount(): number {
    return this.subprocessEntries.size
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
   * Round 6 G-05 / Round 12 拡張: 登録された全 subprocess に対し
   *   1. SIGTERM 一斉送信
   *   2. gracePeriodMs (target ごと、未指定なら default 200ms) 待機
   *   3. 残存 (alive) のみ SIGKILL を順次送信
   *
   * Round 11 までの sequential SIGTERM→SIGKILL 経路と互換 (kill-chain.test.ts 既存 5 tests
   * は SIGTERM only / SIGTERM+SIGKILL いずれの単体 fixture も通過し続ける)。
   *
   * Round 12 仕様変更点:
   *   - target 全件への SIGTERM を「先に一斉に投げてから」grace 待機する
   *     (Round 11 までは sequential。Round 12 では複数 subprocess の grace を
   *     並列消化することで全体停止時間を短縮)。
   *   - default gracePeriodMs は Round 12 で 200ms に短縮 (従来 2000ms はホストプロセス
   *     全体が「あと 200ms で死ぬ」緊急停止局面で過長)。target.gracePeriodMs を caller
   *     が明示すればそちらを優先する。
   */
  private async killAllSubprocesses(): Promise<void> {
    const entries = [...this.subprocessEntries]
    if (entries.length === 0) return

    const cfg = this.gracefulConfig

    // 1. SIGTERM 一斉
    const targetsAlive: SubprocessKillTarget[] = []
    let maxGrace = 0
    for (const { target } of entries) {
      try {
        if (!target.alive()) continue
        targetsAlive.push(target)
        // 優先: target 個別の gracePeriodMs > switch-wide gracefulConfig.gracePeriodMs
        const grace = target.gracePeriodMs ?? cfg.gracePeriodMs
        if (grace > maxGrace) maxGrace = grace
        await this.sendSignalWithTimeout(target, 'SIGTERM', cfg.sigtermTimeoutMs)
      } catch {
        // best effort
      }
    }

    if (targetsAlive.length === 0) return

    // 2. grace 待機 (max 値に従う、default は gracefulConfig.gracePeriodMs)
    const grace = maxGrace > 0 ? maxGrace : cfg.gracePeriodMs
    const start = Date.now()
    while (Date.now() - start < grace) {
      let anyAlive = false
      for (const target of targetsAlive) {
        try {
          if (target.alive()) {
            anyAlive = true
            break
          }
        } catch {
          // best effort
        }
      }
      if (!anyAlive) return
      await new Promise((r) => setTimeout(r, Math.min(50, grace)))
    }

    // 3. 残存 SIGKILL
    for (const target of targetsAlive) {
      try {
        if (target.alive()) {
          await this.sendSignalWithTimeout(target, 'SIGKILL', cfg.sigkillTimeoutMs)
        }
      } catch {
        // best effort
      }
    }
  }

  /**
   * Round 13 Dev-D Task A: target.signal 送信を timeout 付きで実行 (hang 保護)。
   *
   * - timeoutMs === 0 なら無制限 (Round 12 までの挙動と互換)。
   * - timeout 発火時は best-effort で握り潰し、後続の SIGKILL escalation に続ける。
   */
  private async sendSignalWithTimeout(
    target: SubprocessKillTarget,
    sig: 'SIGTERM' | 'SIGKILL',
    timeoutMs: number,
  ): Promise<void> {
    if (timeoutMs <= 0) {
      await target.signal(sig)
      return
    }
    let timer: NodeJS.Timeout | null = null
    try {
      await Promise.race([
        Promise.resolve(target.signal(sig)),
        new Promise<void>((resolve) => {
          timer = setTimeout(() => resolve(), timeoutMs)
          if (timer.unref) timer.unref()
        }),
      ])
    } finally {
      if (timer) clearTimeout(timer)
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
