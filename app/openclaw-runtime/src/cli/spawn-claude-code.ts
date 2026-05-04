/**
 * cli/spawn-claude-code — Round 11 Dev-D 前倒し (W3 → W0):
 *   Claude Code CLI を subprocess として spawn する純関数 wrapper。
 *
 * 設計方針 (DEC-019-006 P-D 改 / DEC-019-051 subscription-driven 整合):
 *   - **subscription-driven 中核**: Claude Code CLI を介して Anthropic usage を amortize し、
 *     月総額 ≤$430 cap (DEC-019-051) を遵守する経路の最小起動 primitive。
 *   - **純関数化**: spawn 結果は SpawnHandle オブジェクトを返却、副作用は明示 hook 経由。
 *   - **TimeSource DI**: `nowIso` を options で注入可能。default は new Date().toISOString()。
 *   - **AbortController 対応**: kill-switch G-05/G-06 連鎖で外部からの中断を SIGTERM/SIGKILL に変換。
 *   - **stdout/stderr line buffer**: NDJSON event を抽出して JSON IF 整合
 *     (DEC-019-007 第 9 種 / openclaw-to-ceo.schema.ts と互換)。
 *   - **mock 注入**: 実テストでは MockChildProcess を渡し、副作用ゼロで lifecycle 検証。
 *   - **既存無改変**: skill-adapter / wrapper.ts / protocol/ は完全無 touch。
 *
 * 関連:
 *   - CB-D-W3-04 (skill non-interactive mode adapter) — skill-adapter/ と integrate
 *   - CB-D-W4-01 (DryRunGuard) — dry-run mode で実 spawn せず recording のみ
 *   - DEC-019-007 (副作用ゼロ要件 / 第 9 種 JSON IF)
 *   - DEC-019-051 (月総額 ≤$430 cap / subscription-driven 中核手段)
 *   - DEC-019-053/054/055/056/057 (W0 前倒し / R11 並列 dispatch)
 */
import type {
  ChildProcess,
  ChildProcessByStdio,
  SpawnOptions,
  StdioOptions,
} from 'node:child_process'
import type { Readable, Writable } from 'node:stream'

/**
 * spawn 経路 mode。
 *   - 'subscription' = Claude Code CLI 経由 (推奨、コスト最小)
 *   - 'api'          = Anthropic API 直接 (fallback、緊急時のみ)
 *   - 'dry-run'      = 実 spawn せず recording のみ (DryRunGuard 整合)
 */
export type SpawnMode = 'subscription' | 'api' | 'dry-run'

/**
 * 子プロセス抽象 (実 ChildProcess および MockChildProcess 共通の最小契約)。
 * 既存 wrapper.ts の TimeoutTarget より高機能 (stdout/stderr, kill, exit event)。
 */
export interface MockChildProcess {
  /** OS が割り当てた process id (mock の場合は擬似値、例えば 99999) */
  readonly pid: number
  /** stdout 行 emit 用 listener 登録 (JSON IF event 抽出経路) */
  onStdoutLine(listener: (line: string) => void): void
  /** stderr 行 emit 用 listener 登録 */
  onStderrLine(listener: (line: string) => void): void
  /** 終了 event listener 登録 (code: number | null, signal: NodeJS.Signals | null) */
  onExit(listener: (code: number | null, signal: string | null) => void): void
  /** SIGTERM / SIGKILL を送信 */
  kill(signal?: 'SIGTERM' | 'SIGKILL'): boolean
  /** alive 判定 */
  isAlive(): boolean
}

/**
 * spawn 起動契約。
 */
export interface SpawnClaudeCodeOptions {
  /** 起動 mode (default = 'subscription') */
  mode?: SpawnMode
  /** Claude Code CLI 実行ファイル絶対パス。subscription 専用、api / dry-run では無視可。 */
  cliPath?: string
  /** 追加 CLI args (Claude Code が受ける引数) */
  args?: readonly string[]
  /** allow-list 後の env (空 = inherit ではなく empty で起動) */
  env?: Readonly<Record<string, string>>
  /** 子プロセスの cwd 絶対パス。未指定なら OS tmp。 */
  cwd?: string
  /** prompt / 入力 string (subscription mode で stdin に流す内容) */
  prompt?: string
  /** AbortController.signal を受けて kill 信号に変換するか (default true) */
  abortSignal?: AbortSignal
  /** ISO 時刻取得 hook (TimeSource DI、default = () => new Date().toISOString()) */
  nowIso?: () => string
  /** spawner 注入: 実 child_process.spawn の代わりに mock を返す factory */
  spawner?: (opts: SpawnClaudeCodeOptions) => MockChildProcess
  /** dry-run 時に副作用を recording する hook (DryRunGuard 連携用) */
  dryRunRecorder?: (record: SpawnDryRunRecord) => void
  /** 起動 token (Sumi/Asagi 巻き添えゼロ確証用、未指定なら自動採番) */
  spawnToken?: string
  /** stdout 行 buffer の最大保持件数 (default 10_000) */
  maxBufferedLines?: number
}

/**
 * spawn 後に返される handle。lifecycle 制御 + event 集約を提供。
 */
export interface SpawnHandle {
  /** spawn 起動 token (audit + Sumi/Asagi 巻き添えゼロ確証用) */
  readonly spawnToken: string
  /** OS pid (dry-run の場合は -1) */
  readonly pid: number
  /** 起動 mode */
  readonly mode: SpawnMode
  /** 起動 ISO 時刻 */
  readonly startedAt: string
  /** 集約された stdout 行 (insertion 順、最新は末尾、上限 maxBufferedLines) */
  readonly stdoutLines: readonly string[]
  /** 集約された stderr 行 */
  readonly stderrLines: readonly string[]
  /** stdout から抽出された JSON IF event 候補 (parse 失敗 / non-JSON は除外) */
  readonly jsonEvents: readonly unknown[]
  /** 子プロセス参照 (mock or real)。caller は lifecycle 制御に使う。 */
  readonly child: MockChildProcess
  /** abort を発火 (内部で SIGTERM 送信) */
  abort(reason?: string): void
  /** 終了 promise (resolved on exit、終了情報を含む) */
  done(): Promise<SpawnExitInfo>
}

/**
 * subprocess 終了情報。
 */
export interface SpawnExitInfo {
  /** exit code (signal で停止した場合 null) */
  readonly code: number | null
  /** 終了 signal (例 'SIGTERM' / 'SIGKILL'、code で停止なら null) */
  readonly signal: string | null
  /** 終了 ISO 時刻 */
  readonly finishedAt: string
  /** abort された場合 true */
  readonly aborted: boolean
  /** abort 理由 (caller 渡し or 自動) */
  readonly abortReason: string | undefined
}

/**
 * dry-run mode で発生する spawn 試行 record (DryRunGuard 連携)。
 */
export interface SpawnDryRunRecord {
  spawnToken: string
  command: string
  args: readonly string[]
  cwd: string
  envKeys: readonly string[]
  attemptedAt: string
  /** mode (dry-run 内訳: 'subscription_dry' / 'api_dry') */
  modeRequested: SpawnMode
}

/** 内部 default options */
const DEFAULT_MAX_BUFFERED_LINES = 10_000

/**
 * 起動 token 生成 (簡易、prefix + counter + iso)。
 */
let _tokenCounter = 0
function generateSpawnToken(nowIso: () => string): string {
  _tokenCounter += 1
  return `spawn-${nowIso().replace(/[:.]/g, '-')}-${_tokenCounter}`
}

/**
 * line-buffered stream 集約用 helper (入力に NDJSON ライン抽出を試みる)。
 *
 * **完全純関数**: stdout 文字列 chunk を受け取り、line 配列に分解、JSON IF 候補を試み、
 *   parse 成功した object を events に push する。
 */
export function extractJsonEvents(
  buffered: readonly string[],
): readonly unknown[] {
  const out: unknown[] = []
  for (const line of buffered) {
    const trimmed = line.trim()
    if (trimmed.length === 0) continue
    if (trimmed[0] !== '{' && trimmed[0] !== '[') continue
    try {
      out.push(JSON.parse(trimmed))
    } catch {
      // non-JSON line; skip (純 log 行は events に入れない)
    }
  }
  return out
}

/**
 * Claude Code CLI を subprocess として spawn する。
 *
 * **完全純関数**: spawner / nowIso / dryRunRecorder を caller が注入することで、
 *   テストでは MockChildProcess を返す spawner を渡し、副作用 0 で lifecycle 検証可能。
 *
 * 動作:
 *   1. mode === 'dry-run' → 実 spawn せず、dryRunRecorder に record を渡し、即座に
 *      finished=true で SpawnHandle を返却。
 *   2. mode === 'subscription' or 'api' → spawner で MockChildProcess (実装は実 spawn) を取得し、
 *      stdout / stderr listener を登録、abortSignal 連動を hook、SpawnHandle を返却。
 *
 * @param opts spawn 起動契約
 * @returns SpawnHandle (lifecycle 操作 + 集約 event)
 */
export function spawnClaudeCode(opts: SpawnClaudeCodeOptions): SpawnHandle {
  const mode: SpawnMode = opts.mode ?? 'subscription'
  const nowIso = opts.nowIso ?? (() => new Date().toISOString())
  const spawnToken = opts.spawnToken ?? generateSpawnToken(nowIso)
  const startedAt = nowIso()
  const maxBuf = opts.maxBufferedLines ?? DEFAULT_MAX_BUFFERED_LINES

  // dry-run 経路: 実 spawn しない
  if (mode === 'dry-run') {
    if (opts.dryRunRecorder) {
      opts.dryRunRecorder({
        spawnToken,
        command: opts.cliPath ?? '<dry-run-no-cli>',
        args: Object.freeze([...(opts.args ?? [])]),
        cwd: opts.cwd ?? '',
        envKeys: Object.freeze(Object.keys(opts.env ?? {})),
        attemptedAt: startedAt,
        modeRequested: 'dry-run',
      })
    }
    return createDryRunHandle({ spawnToken, startedAt, mode })
  }

  // subscription / api 経路: spawner 必須 (caller が child_process.spawn or mock を渡す)
  if (!opts.spawner) {
    throw new Error(
      'spawnClaudeCode: spawner is required for mode="subscription" or "api". ' +
        'In production pass child_process.spawn-based factory; in tests pass MockChildProcess factory.',
    )
  }

  const child = opts.spawner(opts)
  const stdoutBuf: string[] = []
  const stderrBuf: string[] = []
  const jsonEventsRef: unknown[] = []
  let aborted = false
  let abortReason: string | undefined
  let exitInfo: SpawnExitInfo | null = null
  const exitWaiters: Array<(info: SpawnExitInfo) => void> = []

  child.onStdoutLine((line) => {
    if (stdoutBuf.length < maxBuf) stdoutBuf.push(line)
    // NDJSON 候補なら json events にも push
    const trimmed = line.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        jsonEventsRef.push(JSON.parse(trimmed))
      } catch {
        // skip
      }
    }
  })
  child.onStderrLine((line) => {
    if (stderrBuf.length < maxBuf) stderrBuf.push(line)
  })
  child.onExit((code, signal) => {
    exitInfo = {
      code,
      signal,
      finishedAt: nowIso(),
      aborted,
      abortReason,
    }
    for (const w of exitWaiters) w(exitInfo)
    exitWaiters.length = 0
  })

  // AbortController hook
  if (opts.abortSignal) {
    if (opts.abortSignal.aborted) {
      // 既に aborted の場合即時 SIGTERM 送信
      aborted = true
      abortReason = 'pre-aborted at spawn time'
      try {
        child.kill('SIGTERM')
      } catch {
        // best effort
      }
    } else {
      opts.abortSignal.addEventListener(
        'abort',
        () => {
          aborted = true
          abortReason = 'AbortController.abort()'
          try {
            child.kill('SIGTERM')
          } catch {
            // best effort
          }
        },
        { once: true },
      )
    }
  }

  return {
    spawnToken,
    pid: child.pid,
    mode,
    startedAt,
    get stdoutLines() {
      return stdoutBuf.slice()
    },
    get stderrLines() {
      return stderrBuf.slice()
    },
    get jsonEvents() {
      return jsonEventsRef.slice()
    },
    child,
    abort(reason) {
      if (aborted) return
      aborted = true
      abortReason = reason ?? 'manual abort()'
      try {
        child.kill('SIGTERM')
      } catch {
        // best effort
      }
    },
    done() {
      if (exitInfo) return Promise.resolve(exitInfo)
      return new Promise<SpawnExitInfo>((resolve) => {
        exitWaiters.push(resolve)
      })
    },
  }
}

/**
 * dry-run 専用 SpawnHandle (実 spawn せず即時 exit code 0 / pid -1 / 副作用ゼロ)。
 */
function createDryRunHandle(args: {
  spawnToken: string
  startedAt: string
  mode: SpawnMode
}): SpawnHandle {
  const stdoutBuf: string[] = []
  const stderrBuf: string[] = []
  const jsonEventsRef: unknown[] = []
  const exitInfo: SpawnExitInfo = {
    code: 0,
    signal: null,
    finishedAt: args.startedAt,
    aborted: false,
    abortReason: undefined,
  }
  const child: MockChildProcess = {
    pid: -1,
    onStdoutLine() {
      // no-op
    },
    onStderrLine() {
      // no-op
    },
    onExit(listener) {
      // 即時呼び出し
      listener(0, null)
    },
    kill() {
      return false
    },
    isAlive() {
      return false
    },
  }
  return {
    spawnToken: args.spawnToken,
    pid: -1,
    mode: args.mode,
    startedAt: args.startedAt,
    get stdoutLines() {
      return stdoutBuf.slice()
    },
    get stderrLines() {
      return stderrBuf.slice()
    },
    get jsonEvents() {
      return jsonEventsRef.slice()
    },
    child,
    abort() {
      // dry-run はそもそも実 spawn 無し
    },
    done() {
      return Promise.resolve(exitInfo)
    },
  }
}

/**
 * 実 child_process.spawn を MockChildProcess interface に適合させる adapter。
 *
 * 注意: テストでは使わない (実テストは MockChildProcess を直接渡す)。
 *   本 helper は production / integration test での実起動経路用。
 *
 * 行 buffer は newline split で line 化、UTF-8 decode を仮定。
 */
export function adaptRealChildProcess(
  child: ChildProcess | ChildProcessByStdio<Writable | null, Readable | null, Readable | null>,
): MockChildProcess {
  let alive = true
  const stdoutListeners: Array<(line: string) => void> = []
  const stderrListeners: Array<(line: string) => void> = []
  const exitListeners: Array<(code: number | null, signal: string | null) => void> = []

  let stdoutTail = ''
  let stderrTail = ''

  if (child.stdout) {
    child.stdout.on('data', (chunk: Buffer | string) => {
      stdoutTail += typeof chunk === 'string' ? chunk : chunk.toString('utf8')
      const parts = stdoutTail.split('\n')
      stdoutTail = parts.pop() ?? ''
      for (const line of parts) {
        for (const l of stdoutListeners) l(line)
      }
    })
  }
  if (child.stderr) {
    child.stderr.on('data', (chunk: Buffer | string) => {
      stderrTail += typeof chunk === 'string' ? chunk : chunk.toString('utf8')
      const parts = stderrTail.split('\n')
      stderrTail = parts.pop() ?? ''
      for (const line of parts) {
        for (const l of stderrListeners) l(line)
      }
    })
  }
  child.on('exit', (code, signal) => {
    alive = false
    // tail flush
    if (stdoutTail.length > 0) {
      for (const l of stdoutListeners) l(stdoutTail)
      stdoutTail = ''
    }
    if (stderrTail.length > 0) {
      for (const l of stderrListeners) l(stderrTail)
      stderrTail = ''
    }
    for (const l of exitListeners) l(code, signal as string | null)
  })

  return {
    get pid() {
      return child.pid ?? -1
    },
    onStdoutLine(listener) {
      stdoutListeners.push(listener)
    },
    onStderrLine(listener) {
      stderrListeners.push(listener)
    },
    onExit(listener) {
      exitListeners.push(listener)
    },
    kill(signal) {
      const sig = signal ?? 'SIGTERM'
      const ok = child.kill(sig)
      return ok
    },
    isAlive() {
      return alive
    },
  }
}

/**
 * 型 helper: SpawnOptions / StdioOptions の re-export (caller の参照用)。
 */
export type { SpawnOptions, StdioOptions }

// ============================================================================
// Round 12 Dev-D 追補 (Task A wiring): kill-switch.registerSubprocessKill 連携
// ============================================================================

/**
 * KillSwitch (harness 側) との依存を型レベルで切り、循環依存 / Round 11 spawn-claude-code
 * の純関数性を維持するための薄い構造的 interface。
 *
 * harness/kill-switch.ts の `KillSwitch.registerSubprocessKill(target)` 戻り値
 * (`KillToken`) と互換 (id + unregister のみ)。
 */
export interface SpawnKillRegistry {
  registerSubprocessKill(target: SpawnKillTarget): SpawnKillRegistryToken
}

/** harness の SubprocessKillTarget と互換の最小 contract。 */
export interface SpawnKillTarget {
  readonly name: string
  alive(): boolean
  signal(sig: 'SIGTERM' | 'SIGKILL'): Promise<void> | void
  gracePeriodMs?: number
}

/** harness の KillToken と互換 (戻り値は破棄してもよい)。 */
export interface SpawnKillRegistryToken {
  readonly id: string
  unregister(): void
}

/**
 * SpawnHandle を kill-switch に register し、subprocess の正常終了で auto-unregister する
 * adapter 経路の wiring helper。
 *
 * 動作:
 *   1. handle.child を SpawnKillTarget に適合させて registry に登録
 *   2. handle.done() resolve 時に token.unregister() を呼ぶ (memory leak 防止)
 *   3. dry-run mode (handle.pid === -1) は subprocess を持たないので no-op
 *
 * 既存 import path / 型は完全互換 (本 helper は append-only)。
 *
 * @param handle spawnClaudeCode が返した SpawnHandle
 * @param registry kill-switch (harness/index.ts の FileKillSwitch を渡す想定)
 * @param name kill-history audit 用の登録名 (default = `claude-code:${spawnToken}`)
 * @returns KillToken (caller が任意で unregister 可能、auto-unregister 済の場合 idempotent)
 */
export function wireSpawnHandleToKillSwitch(
  handle: SpawnHandle,
  registry: SpawnKillRegistry,
  name?: string,
): SpawnKillRegistryToken | null {
  // dry-run path は subprocess を持たないので登録不要
  if (handle.pid === -1) return null

  const target: SpawnKillTarget = {
    name: name ?? `claude-code:${handle.spawnToken}`,
    alive: () => handle.child.isAlive(),
    signal: (sig) => {
      try {
        handle.child.kill(sig)
      } catch {
        // best effort
      }
    },
    // kill-switch Round 12 default 200ms に従う (target 未指定なら registry 側 default)
    gracePeriodMs: 200,
  }

  const token = registry.registerSubprocessKill(target)
  // 正常終了で auto-unregister
  void handle.done().then(
    () => token.unregister(),
    () => token.unregister(),
  )
  return token
}
