/**
 * cli/real-child-spawn — Round 12 Dev-C 着地 (W3 → W0 大胆前倒し):
 *   Node.js `node:child_process.spawn()` を Dev-D の SpawnHandle / MockChildProcess interface
 *   に適合させる production 用 adapter。
 *
 * 設計方針 (DEC-019-006 / 051 / 053-057 整合):
 *   - **shell: false 強制**: 任意 OS shell 経由を禁止し、shell injection 0。argv 配列固定。
 *   - **絶対パス必須**: 相対パスで CLI 起動を試みた場合は throw (PATH 依存の不確実性排除)。
 *   - **環境変数 whitelist**: PATH / HOME / LANG / ANTHROPIC_API_KEY (emergency override 限定) 以外は
 *     inheritEnv: false で完全遮断。Sumi/Asagi 巻き添えゼロ確証。
 *   - **stdout/stderr line stream**: chunk 跨ぎ buffering (NDJSON 対応 / utf-8 decode)。
 *   - **SIGTERM → 200ms grace → SIGKILL fallback**: subscription-router / session-controller の
 *     仕様と一致。kill-switch G-05/G-06 連鎖で外部からの中断を OS signal に変換。
 *   - **Windows / macOS / Linux 互換**: process.platform 分岐は spawn options で吸収、
 *     Windows でも shell: false で動く argv 配列を保証。
 *   - **adaptRealChildProcess 経由**: spawn-claude-code.ts の既存 adapter と互換。
 *     上位 layer (spawnClaudeCode) は MockChildProcess interface のみで動作。
 *
 * 関連:
 *   - cli/spawn-claude-code.ts (adaptRealChildProcess を再利用)
 *   - cli/session-controller.ts (lifecycle FSM)
 *   - cli/subscription-router.ts (mode 決定)
 *   - DEC-019-007 (副作用ゼロ要件 / 第 9 種 JSON IF)
 *   - DEC-019-051 (subscription-driven 中核手段)
 *   - DEC-019-053/054/055/056/057 (W0 前倒し / R12 並列 dispatch)
 */
import {
  spawn as nodeSpawn,
  type ChildProcess,
  type SpawnOptions,
} from 'node:child_process'
import { isAbsolute } from 'node:path'

import {
  adaptRealChildProcess,
  type MockChildProcess,
  type SpawnClaudeCodeOptions,
} from './spawn-claude-code.js'

/**
 * 環境変数 allow-list (白名単方式)。
 * これら以外の env 変数は inheritEnv: false 時に子プロセスへ漏出しない。
 */
export const DEFAULT_ENV_ALLOWLIST: readonly string[] = Object.freeze([
  'PATH',
  'HOME',
  'LANG',
])

/**
 * emergency override 時のみ追加する env 変数 (api fallback 用)。
 */
export const EMERGENCY_API_ENV_ALLOWLIST: readonly string[] = Object.freeze([
  'ANTHROPIC_API_KEY',
])

/**
 * real spawn 起動契約 (上位 SpawnClaudeCodeOptions と同等だが、env 取扱の方針が明示)。
 */
export interface RealChildSpawnOptions {
  /** Claude Code CLI 実行ファイル絶対パス。相対パスは throw。 */
  cliPath: string
  /** CLI args (空可)。shell parsing は介在しない。 */
  args?: readonly string[]
  /** 子プロセスの cwd 絶対パス (相対は throw)。未指定なら process.cwd()。 */
  cwd?: string
  /**
   * 親プロセスの env を inherit するか。
   *   - false (default): allowlist のみを子に渡す。
   *   - true            : process.env 全体を子に渡す (デバッグ用 / 通常運用は false)。
   */
  inheritEnv?: boolean
  /** allowlist 上書き (白名単方式)。default = DEFAULT_ENV_ALLOWLIST */
  envAllowlist?: readonly string[]
  /**
   * emergency API override 時のみ true。ANTHROPIC_API_KEY を allowlist に追加する。
   * subscription-router の selected==='api' (emergency) と連動。
   */
  emergencyApiOverride?: boolean
  /** 強制注入する env (allowlist と独立、明示的な追加 KV)。 */
  extraEnv?: Readonly<Record<string, string>>
  /** SIGTERM 後 SIGKILL 送信までの grace ms (default 200) */
  killGraceMs?: number
  /** spawn 直前に呼ぶ pre-flight hook (validation / logging 用、副作用注入禁止) */
  preFlightHook?: (final: ResolvedSpawnConfig) => void
  /** spawn function 注入 (test 用、default = node:child_process.spawn) */
  spawnFn?: typeof nodeSpawn
}

/**
 * pre-flight 検証後の確定 config (preFlightHook で読み取り可能)。
 */
export interface ResolvedSpawnConfig {
  readonly command: string
  readonly args: readonly string[]
  readonly cwd: string
  readonly env: Readonly<Record<string, string>>
  readonly platform: NodeJS.Platform
  readonly inheritEnvUsed: boolean
}

/**
 * pre-flight 検証エラー。
 */
export class RealChildSpawnValidationError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'cliPath_not_absolute'
      | 'cwd_not_absolute'
      | 'cliPath_empty'
      | 'args_contains_null'
      | 'env_key_invalid',
  ) {
    super(message)
    this.name = 'RealChildSpawnValidationError'
  }
}

/**
 * env allow-list を適用して子プロセス用 env を構築 (純関数)。
 *
 * @param sourceEnv 親 env (通常は process.env)
 * @param allowlist 白名単
 * @param extraEnv 強制注入 KV
 * @param inheritEnv true の場合は sourceEnv 全体を返す
 * @returns 子プロセス用 env (string -> string only)
 */
export function buildAllowlistedEnv(
  sourceEnv: NodeJS.ProcessEnv,
  allowlist: readonly string[],
  extraEnv: Readonly<Record<string, string>> = {},
  inheritEnv = false,
): Record<string, string> {
  const out: Record<string, string> = {}
  if (inheritEnv) {
    for (const [k, v] of Object.entries(sourceEnv)) {
      if (typeof v === 'string') out[k] = v
    }
  } else {
    for (const key of allowlist) {
      const v = sourceEnv[key]
      if (typeof v === 'string') out[key] = v
    }
  }
  for (const [k, v] of Object.entries(extraEnv)) {
    out[k] = v
  }
  return out
}

/**
 * pre-flight validation (純関数)。
 *
 * @throws RealChildSpawnValidationError on invalid input
 */
export function validateSpawnInputs(opts: RealChildSpawnOptions): void {
  if (!opts.cliPath || opts.cliPath.length === 0) {
    throw new RealChildSpawnValidationError(
      'cliPath must be a non-empty absolute path',
      'cliPath_empty',
    )
  }
  if (!isAbsolute(opts.cliPath)) {
    throw new RealChildSpawnValidationError(
      `cliPath must be absolute path. Got: ${opts.cliPath}`,
      'cliPath_not_absolute',
    )
  }
  if (opts.cwd !== undefined && !isAbsolute(opts.cwd)) {
    throw new RealChildSpawnValidationError(
      `cwd must be absolute path. Got: ${opts.cwd}`,
      'cwd_not_absolute',
    )
  }
  if (opts.args) {
    for (let i = 0; i < opts.args.length; i++) {
      const a = opts.args[i]
      if (a === null || a === undefined) {
        throw new RealChildSpawnValidationError(
          `args[${i}] is null/undefined`,
          'args_contains_null',
        )
      }
    }
  }
  if (opts.extraEnv) {
    for (const k of Object.keys(opts.extraEnv)) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)) {
        throw new RealChildSpawnValidationError(
          `extraEnv key invalid: ${k}`,
          'env_key_invalid',
        )
      }
    }
  }
}

/**
 * SpawnClaudeCodeOptions から RealChildSpawnOptions を構築する純関数 helper。
 * spawnClaudeCode の spawner 注入経路で利用。
 */
export function deriveRealSpawnOptions(
  opts: SpawnClaudeCodeOptions,
  defaults: Partial<RealChildSpawnOptions> = {},
): RealChildSpawnOptions {
  const result: RealChildSpawnOptions = {
    cliPath: opts.cliPath ?? '',
    inheritEnv: defaults.inheritEnv ?? false,
    envAllowlist: defaults.envAllowlist ?? DEFAULT_ENV_ALLOWLIST,
    emergencyApiOverride:
      defaults.emergencyApiOverride ?? opts.mode === 'api',
    killGraceMs: defaults.killGraceMs ?? 200,
  }
  if (opts.args !== undefined) result.args = opts.args
  if (opts.cwd !== undefined) result.cwd = opts.cwd
  if (opts.env !== undefined) result.extraEnv = opts.env
  if (defaults.preFlightHook !== undefined)
    result.preFlightHook = defaults.preFlightHook
  if (defaults.spawnFn !== undefined) result.spawnFn = defaults.spawnFn
  return result
}

/**
 * 実 child_process.spawn を呼び出し、MockChildProcess interface に適合させた handle を返す。
 *
 * **副作用**: 子プロセスを OS レベルで起動する。
 * **shell: false 強制**: 任意 shell 経由を禁止 (argv injection 0)。
 * **env**: inheritEnv=false (default) なら allowlist のみ。emergencyApiOverride=true で
 *   ANTHROPIC_API_KEY を allowlist に追加。
 *
 * SIGTERM → grace → SIGKILL の死亡確認 fallback は外部 (caller) の責務でも実行可能だが、
 * 本 module は kill(signal) を呼んだ際の OS 動作のみを保証する。
 *
 * @param opts 起動契約
 * @returns MockChildProcess 互換 handle
 * @throws RealChildSpawnValidationError on invalid input
 */
export function spawnRealChildProcess(
  opts: RealChildSpawnOptions,
): MockChildProcess {
  validateSpawnInputs(opts)

  const allowlist = opts.envAllowlist ?? DEFAULT_ENV_ALLOWLIST
  const finalAllowlist = opts.emergencyApiOverride
    ? Object.freeze([...allowlist, ...EMERGENCY_API_ENV_ALLOWLIST])
    : allowlist
  const inheritEnv = opts.inheritEnv ?? false
  const env = buildAllowlistedEnv(
    process.env,
    finalAllowlist,
    opts.extraEnv ?? {},
    inheritEnv,
  )
  const cwd = opts.cwd ?? process.cwd()
  const args = opts.args ? [...opts.args] : []

  const resolved: ResolvedSpawnConfig = Object.freeze({
    command: opts.cliPath,
    args: Object.freeze([...args]),
    cwd,
    env: Object.freeze({ ...env }),
    platform: process.platform,
    inheritEnvUsed: inheritEnv,
  })

  if (opts.preFlightHook) {
    opts.preFlightHook(resolved)
  }

  const spawnFn = opts.spawnFn ?? nodeSpawn
  const spawnOptions: SpawnOptions = {
    shell: false, // 強制: shell injection 防止
    cwd,
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
    // detached は false (親と同 process group)
    detached: false,
  }

  const child: ChildProcess = spawnFn(opts.cliPath, args, spawnOptions)

  // SIGTERM → grace → SIGKILL の二段 kill を adapter にラップする
  const graceMs = opts.killGraceMs ?? 200
  const adapted = adaptRealChildProcess(child)
  let killed = false
  return {
    get pid() {
      return adapted.pid
    },
    onStdoutLine(listener) {
      adapted.onStdoutLine(listener)
    },
    onStderrLine(listener) {
      adapted.onStderrLine(listener)
    },
    onExit(listener) {
      adapted.onExit(listener)
    },
    kill(signal) {
      if (killed) return false
      const sig = signal ?? 'SIGTERM'
      const ok = adapted.kill(sig)
      if (sig === 'SIGTERM') {
        // 200ms grace 後にまだ alive なら SIGKILL
        const handle = setTimeout(() => {
          if (adapted.isAlive()) {
            try {
              adapted.kill('SIGKILL')
            } catch {
              // best effort
            }
          }
        }, graceMs)
        // unref で event loop ブロック回避
        if (typeof (handle as unknown as { unref?: () => void }).unref === 'function') {
          ;(handle as unknown as { unref: () => void }).unref()
        }
      }
      killed = sig === 'SIGKILL'
      return ok
    },
    isAlive() {
      return adapted.isAlive()
    },
  }
}

/**
 * spawnClaudeCode の spawner option として直接渡せる factory。
 *
 * 使用例:
 * ```
 * const handle = spawnClaudeCode({
 *   mode: 'subscription',
 *   cliPath: '/usr/local/bin/claude',
 *   args: ['-p', 'hello'],
 *   spawner: createRealSpawner({ killGraceMs: 200 }),
 * })
 * ```
 */
export function createRealSpawner(
  defaults: Partial<RealChildSpawnOptions> = {},
): (opts: SpawnClaudeCodeOptions) => MockChildProcess {
  return (opts: SpawnClaudeCodeOptions) => {
    const realOpts = deriveRealSpawnOptions(opts, defaults)
    return spawnRealChildProcess(realOpts)
  }
}
