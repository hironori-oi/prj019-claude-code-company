/**
 * skill-adapter/subprocess — Round 11 案 A 着地 (CB-D-W3-04 完遂):
 *   non-interactive.ts (Round 10 Dev-α 純関数着地) を実 subprocess spawn と
 *   統合する opt-in wrap 層。
 *
 * 設計方針:
 *   - 完全 opt-in: caller が SubprocessSpawner (内部 child_process.spawn 抽象)
 *     を渡した時にのみ subprocess を起動する。default では純関数 path のみ。
 *   - **DryRunGuard 整合**: caller が `dryRunGuard` を渡せば、wrap 経由で
 *     spawn 試行を録画 (mode='dry' なら DryRunRejectError を throw)。
 *   - **AbortController 必須**: kill-switch G-05 (subprocess kill チェーン) と
 *     G-06 (circuit-breaker open 連動) と整合。caller は AbortSignal を渡し、
 *     kill-switch trigger 時に subprocess.signal('SIGTERM') が発火する契約。
 *   - **interactive prompt 検出**: subprocess の stdout/stderr を Round 10
 *     `isInteractivePrompt` で line 単位 monitoring。検出時は
 *     `resolveNonInteractive` 経由で fail-safe default を吐き出して subprocess
 *     を kill (graceful: SIGTERM → grace → SIGKILL fallback)。
 *   - **DryRunGuard 'dry' mode 契約**: 実 spawn を呼ばず、recording のみ残す。
 *     non-interactive.ts の純関数 fail-safe path を直接 invoke して結果を返す。
 *   - **副作用 0 の純関数 helper を最大化**: line splitter / stdout 読み取り
 *     アキュムレータは純関数として export し、wrap 自体は薄く保つ。
 *
 * 既存ファイル無改変原則:
 *   - non-interactive.ts は無改変 (本 module から import のみ)
 *   - dry-run-guard.ts (harness) は無改変、interface のみ依存
 *   - kill-switch.ts (harness) は無改変、AbortSignal 契約で繋ぐ
 *
 * 関連:
 *   - CB-D-W3-04 (skill non-interactive mode adapter — Round 11 で完遂)
 *   - DEC-019-007 第 9 種 dev_kickoff_approval (HITL gate)
 *   - DEC-019-025 Agent tool permissions SOP
 *   - Round 10 Dev-α dev-round10-alpha-denylist-skill-adapter.md
 *   - Round 10 Dev-γ dry-run-guard.ts G-12 hardguard
 *   - Round 6 G-05/G-06 (kill-switch.ts subprocess kill チェーン)
 */
import { z } from 'zod'
import {
  isInteractivePrompt,
  resolveNonInteractive,
  type ResolveNonInteractiveOptions,
  type NonInteractiveResolution,
} from './non-interactive.js'

/**
 * subprocess spawn 抽象 (依存注入用)。
 *
 * 実装は通常 `node:child_process.spawn` を直接呼ぶが、テスト時には
 * stdout/stderr/exitCode を制御可能な fake spawner を渡せる。
 *
 * - alive(): 子プロセスが alive か
 * - signal(): SIGTERM / SIGKILL を送る
 * - onLine(cb): stdout/stderr 行単位 callback (chunk → line splitting は
 *   実装側責任)
 * - waitForExit(): exitCode を Promise で返す
 */
export interface SubprocessHandle {
  /** 子プロセスが alive か */
  alive(): boolean
  /** signal を送る (Round 6 kill-switch G-05 と整合) */
  signal(sig: 'SIGTERM' | 'SIGKILL'): Promise<void> | void
  /** stdout / stderr 行 callback 登録 (line 単位、改行除去済) */
  onLine(cb: (line: string, stream: 'stdout' | 'stderr') => void): void
  /** 終了 promise (resolved with exitCode) */
  waitForExit(): Promise<number | null>
}

/**
 * subprocess spawner 抽象。
 *
 * - command + args + env + cwd を受けて SubprocessHandle を返す
 * - timeout / signal は caller が管理 (本 wrap 層は受け取った AbortSignal を観測)
 */
export interface SubprocessSpawner {
  spawn(opts: SubprocessSpawnInput): SubprocessHandle
}

/** spawn 入力 (副作用 spawn の前段で固める純データ)。 */
export interface SubprocessSpawnInput {
  readonly command: string
  readonly args: readonly string[]
  readonly env: Readonly<Record<string, string>>
  readonly cwd: string
  /** AbortSignal (caller が kill-switch / timeout で abort 操作) */
  readonly signal?: AbortSignal
}

/**
 * dry-run guard 契約 (harness/dry-run-guard.ts と互換、薄い interface のみ)。
 *
 * 完全 import 依存ではなく interface 同型として受けることで、
 * openclaw-runtime と harness の循環依存を避ける。
 */
export interface DryRunGuardLike {
  readonly isDryRun: boolean
  wrap<T>(
    category: 'fs' | 'net' | 'spawn' | 'process' | 'other',
    opName: string,
    fn: () => Promise<T> | T,
    meta?: Record<string, unknown>,
  ): Promise<T>
}

/**
 * subprocess wrap 結果。
 */
export interface SubprocessAdapterResult<T> {
  /** 解決済の値 (interactive 検出時 = failSafeDefault / 通常 = parsed) */
  readonly value: T | undefined
  /** 解決の根拠 */
  readonly reason:
    | 'parsed_from_stdout'
    | 'fail_safe_interactive_detected'
    | 'subprocess_failed'
    | 'aborted'
    | 'dry_run_blocked'
    | 'unresolvable'
  /** 検出された interactive prompt 文字列 (なければ undefined) */
  readonly matchedInteractivePrompt: string | undefined
  /** subprocess の exit code (live mode で起動した場合のみ) */
  readonly exitCode: number | null | undefined
  /** stdout 累積 (debug / audit 用、最大 maxBufferBytes で截断) */
  readonly stdoutBuffer: string
  /** stderr 累積 */
  readonly stderrBuffer: string
  /** kill が発火したか (interactive 検出 or abort 時) */
  readonly killTriggered: boolean
  /** dryRunGuard 経由で recording のみ行ったか */
  readonly dryRunRecorded: boolean
}

/**
 * subprocess wrap 入力。
 */
export interface RunSubprocessAdapterOptions<T> {
  /** spawn 入力 (command / args / env / cwd / signal) */
  readonly spawnInput: SubprocessSpawnInput
  /** spawner (DI、test 時は fake) */
  readonly spawner: SubprocessSpawner
  /** non-interactive 純関数 options (schema + failSafeDefault) */
  readonly resolve: ResolveNonInteractiveOptions<T>
  /** dry-run guard (省略時は live mode、渡された場合 isDryRun=true で recording のみ) */
  readonly dryRunGuard?: DryRunGuardLike
  /** stdout/stderr 累積上限 (default 1 MiB) */
  readonly maxBufferBytes?: number
  /** SIGTERM 送信後 SIGKILL fallback までの grace ms (default 2000) */
  readonly killGraceMs?: number
  /** test 用 sleep 注入 */
  readonly sleep?: (ms: number) => Promise<void>
}

const DEFAULT_MAX_BUFFER_BYTES = 1024 * 1024
const DEFAULT_KILL_GRACE_MS = 2000

const defaultSleepImpl = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms))

/**
 * stdout / stderr の chunk を行単位に切り出す純関数アキュムレータ。
 *
 * 既知の制約:
 *   - 行末 '\r\n' / '\n' を区切りとし、行末文字を除去した line 配列を返す
 *   - 不完全 (行末未到達) の末尾は accumulator に残す
 *   - 副作用 0 — accumulator + chunk → { lines, remainder }
 */
export function splitLinesFromChunk(
  accumulator: string,
  chunk: string,
): { lines: string[]; remainder: string } {
  const combined = accumulator + chunk
  const parts = combined.split(/\r?\n/)
  // split で末尾要素が "完全な行ではない" 残部
  const remainder = parts.pop() ?? ''
  return { lines: parts, remainder }
}

/**
 * subprocess 出力 line のいずれかが interactive prompt 判定されるかを検査する純関数。
 *
 * - 検出された場合は { detected:true, matched } を返す
 * - 検出されない場合は { detected:false }
 *
 * **副作用 0**。
 */
export function detectInteractiveInLines(
  lines: readonly string[],
  patterns?: readonly string[],
): { detected: boolean; matched?: string } {
  for (const line of lines) {
    if (
      isInteractivePrompt(line, patterns ? { patterns } : {})
    ) {
      return { detected: true, matched: line }
    }
  }
  return { detected: false }
}

/**
 * subprocess を opt-in で起動して non-interactive 解決を行う wrap 関数。
 *
 * 動作 (優先順):
 *   1. dryRunGuard.isDryRun=true → 実 spawn を呼ばず recording のみ。
 *      non-interactive 純関数 path で resolve (interactive 検出は不可、
 *      schema parse もできないので action='unresolvable' or fail-safe にも
 *      ならない → reason='dry_run_blocked' で返す)
 *   2. spawnInput.signal が既に aborted → 起動せず reason='aborted' を返す
 *   3. spawner.spawn を呼び、line stream を監視:
 *      - interactive 検出 → resolveNonInteractive (interactive path) で
 *        failSafeDefault を返し、subprocess を SIGTERM → grace → SIGKILL で kill
 *        (reason='fail_safe_interactive_detected')
 *      - exit code 0 + stdout が JSON parse + schema parse OK → parsed 値を返す
 *        (reason='parsed_from_stdout')
 *      - exit code != 0 → reason='subprocess_failed'
 *      - parse 失敗 → reason='unresolvable'
 *      - signal abort → kill して reason='aborted'
 *
 * 既存ファイル無改変原則:
 *   - non-interactive.ts は import のみ (改変 0)
 *   - dry-run-guard.ts (harness) は interface 同型で type-only 依存
 *   - kill-switch.ts は AbortSignal 経由の間接連携 (改変 0)
 *
 * AbortController 整合 (G-05/G-06):
 *   - caller が AbortController.signal を spawnInput.signal に渡し、
 *     kill-switch.registerSubprocessKill で signal abort → adapter 内で
 *     SIGTERM → SIGKILL fallback が発火する契約。
 */
export async function runSubprocessAdapter<T>(
  options: RunSubprocessAdapterOptions<T>,
): Promise<SubprocessAdapterResult<T>> {
  const {
    spawnInput,
    spawner,
    resolve: resolveOpts,
    dryRunGuard,
    maxBufferBytes = DEFAULT_MAX_BUFFER_BYTES,
    killGraceMs = DEFAULT_KILL_GRACE_MS,
    sleep = defaultSleepImpl,
  } = options

  // ---- 1. dry-run mode: spawn せず recording のみ -----------------------
  if (dryRunGuard?.isDryRun === true) {
    let recordedOk = false
    try {
      await dryRunGuard.wrap('spawn', `subprocess:${spawnInput.command}`, async () => {
        // dry-run mode では本 fn は呼ばれない (DryRunRejectError throw 仕様)
        // unreachable in production
        return undefined
      }, {
        argsCount: spawnInput.args.length,
        cwd: spawnInput.cwd,
        envKeys: Object.keys(spawnInput.env).sort(),
      })
      recordedOk = true
    } catch {
      // DryRunRejectError は期待動作。recording は完了済 (wrap 内で push 済)。
    }
    void recordedOk
    return {
      value: undefined,
      reason: 'dry_run_blocked',
      matchedInteractivePrompt: undefined,
      exitCode: undefined,
      stdoutBuffer: '',
      stderrBuffer: '',
      killTriggered: false,
      dryRunRecorded: true,
    }
  }

  // ---- 2. signal 既に aborted? ------------------------------------------
  if (spawnInput.signal?.aborted === true) {
    return {
      value: undefined,
      reason: 'aborted',
      matchedInteractivePrompt: undefined,
      exitCode: undefined,
      stdoutBuffer: '',
      stderrBuffer: '',
      killTriggered: false,
      dryRunRecorded: false,
    }
  }

  // ---- 3. spawn + line stream 監視 + interactive 検出 ------------------
  const handle = spawner.spawn(spawnInput)

  let stdoutAcc = ''
  let stderrAcc = ''
  let stdoutRemainder = ''
  let stderrRemainder = ''
  let stdoutBuffer = ''
  let stderrBuffer = ''
  let interactiveMatched: string | undefined
  let killTriggered = false

  const killNow = async (): Promise<void> => {
    if (killTriggered) return
    killTriggered = true
    try {
      if (handle.alive()) {
        await handle.signal('SIGTERM')
        const start = Date.now()
        while (Date.now() - start < killGraceMs) {
          if (!handle.alive()) break
          await sleep(Math.min(50, killGraceMs))
        }
        if (handle.alive()) {
          await handle.signal('SIGKILL')
        }
      }
    } catch {
      // best effort
    }
  }

  // stream callback registration
  handle.onLine((line, stream) => {
    if (stream === 'stdout') {
      stdoutAcc += line + '\n'
      const next = splitLinesFromChunk(stdoutRemainder, line + '\n')
      stdoutRemainder = next.remainder
      if (stdoutBuffer.length < maxBufferBytes) {
        stdoutBuffer += line + '\n'
        if (stdoutBuffer.length > maxBufferBytes) {
          stdoutBuffer = stdoutBuffer.slice(0, maxBufferBytes)
        }
      }
      const det = detectInteractiveInLines(next.lines)
      if (det.detected && interactiveMatched === undefined) {
        interactiveMatched = det.matched
        void killNow()
      }
    } else {
      stderrAcc += line + '\n'
      const next = splitLinesFromChunk(stderrRemainder, line + '\n')
      stderrRemainder = next.remainder
      if (stderrBuffer.length < maxBufferBytes) {
        stderrBuffer += line + '\n'
        if (stderrBuffer.length > maxBufferBytes) {
          stderrBuffer = stderrBuffer.slice(0, maxBufferBytes)
        }
      }
      const det = detectInteractiveInLines(next.lines)
      if (det.detected && interactiveMatched === undefined) {
        interactiveMatched = det.matched
        void killNow()
      }
    }
  })

  // AbortSignal listener
  const onAbort = (): void => {
    void killNow()
  }
  spawnInput.signal?.addEventListener('abort', onAbort, { once: true })

  // 終了待機
  const exitCode = await handle.waitForExit()
  spawnInput.signal?.removeEventListener('abort', onAbort)
  void stdoutAcc // referenced for completeness but not exposed externally
  void stderrAcc

  // ---- 4. 結果分岐 -------------------------------------------------------

  // (a) abort signal が立っていれば aborted を返す (interactive 検出より優先しない;
  //     interactive で kill した場合も signal.aborted=true になり得るが、
  //     interactive 検出のほうが意味が強いので順序逆)
  if (interactiveMatched !== undefined) {
    // interactive 検出 → non-interactive 純関数で fail-safe default 解決
    const r: NonInteractiveResolution<T> = resolveNonInteractive(
      interactiveMatched,
      resolveOpts,
    )
    return {
      value: r.failSafeValue,
      reason: 'fail_safe_interactive_detected',
      matchedInteractivePrompt: interactiveMatched,
      exitCode,
      stdoutBuffer,
      stderrBuffer,
      killTriggered: true,
      dryRunRecorded: false,
    }
  }

  // 完了後にも abort 状態を再評価 (signal.aborted は mutable)
  const abortedAfterExit = spawnInput.signal !== undefined && spawnInput.signal.aborted
  if (abortedAfterExit) {
    return {
      value: undefined,
      reason: 'aborted',
      matchedInteractivePrompt: undefined,
      exitCode,
      stdoutBuffer,
      stderrBuffer,
      killTriggered,
      dryRunRecorded: false,
    }
  }

  if (exitCode !== 0) {
    return {
      value: undefined,
      reason: 'subprocess_failed',
      matchedInteractivePrompt: undefined,
      exitCode,
      stdoutBuffer,
      stderrBuffer,
      killTriggered,
      dryRunRecorded: false,
    }
  }

  // (b) exit 0: stdout 全体を JSON として parse 試行
  //   - JSON 行が複数混在する pattern (NDJSON) は別 IF — ここでは末尾 1 JSON 想定
  //   - resolveNonInteractive は trimmed 文字列を要求 (前後空白で JSON parse 落ちる)
  const trimmed = stdoutBuffer.trim()
  const r: NonInteractiveResolution<T> = resolveNonInteractive(
    trimmed,
    resolveOpts,
  )
  if (r.action === 'parsed') {
    return {
      value: r.parsedValue,
      reason: 'parsed_from_stdout',
      matchedInteractivePrompt: undefined,
      exitCode,
      stdoutBuffer,
      stderrBuffer,
      killTriggered,
      dryRunRecorded: false,
    }
  }

  return {
    value: undefined,
    reason: 'unresolvable',
    matchedInteractivePrompt: undefined,
    exitCode,
    stdoutBuffer,
    stderrBuffer,
    killTriggered,
    dryRunRecorded: false,
  }
}

/**
 * 内部 helper: schema 注入時に zod を import する場所を一箇所に固める。
 * (z は型推論のみで使う場合があるため、re-export の hint として残す)
 */
export type SubprocessZodSchema<T> = z.ZodType<T>
