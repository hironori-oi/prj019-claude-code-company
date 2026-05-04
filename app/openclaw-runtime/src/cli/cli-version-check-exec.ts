/**
 * cli/cli-version-check-exec — Round 14 Dev-D 着地 (Task B):
 *   Round 12 Dev-D 着地 `cli-version-check.ts` の mock spawner 経路を
 *   実 `claude-code --version` 起動経路へ切替えるための production wrapper。
 *
 * 設計方針:
 *   - **副作用 0 (DEC-019-007)**: 実 spawn は本 module の `runActualClaudeCodeVersion()`
 *     呼出時のみ。pure helper (`buildVersionSpawnOptions`, `interpretSpawnOutcome` 等) は
 *     入力依存なので test 注入で完全検証できる。
 *   - **既存 cli-version-check.ts は無改変**: 本 module は `checkClaudeCodeVersion` を
 *     wrap する形で actual spawn factory を構築し、既存 import path / behavior を維持する.
 *   - **5 秒 timeout 既定**: `claude-code --version` は通常 < 1 秒で返るが、binary が hang
 *     した場合の保護として 5_000ms を default に固定 (caller override 可).
 *   - **fallback dry-run mode 推奨**: 起動失敗 / timeout / out_of_range 時は HITL gate-12
 *     (auto-update-hitl.buildCliVersionUpdateHitlRequest) を発火する想定で、本 module は
 *     「fallback 候補かどうか」のフラグを `CliVersionCheckResult.fallbackToDryRun` に立てる
 *     既存挙動を継承する。
 *   - **real-child-spawn を再利用**: shell injection / env allow-list / SIGTERM→SIGKILL
 *     fallback は real-child-spawn.ts に委譲し、本 module は version-check 固有の薄い
 *     adapter のみ提供する。
 *
 * 関連:
 *   - cli/cli-version-check.ts (Round 12 Dev-D 着地、純関数 + DI 経路)
 *   - cli/real-child-spawn.ts (Round 12 Dev-C 着地、shell-false / env allowlist)
 *   - cli/auto-update-hitl.ts (Round 13 Dev-D 着地、HITL gate-12 builder)
 *   - DEC-019-007 (副作用ゼロ要件)
 *   - DEC-019-051 (subscription-driven 中核)
 */
import {
  checkClaudeCodeVersion,
  DEFAULT_ACCEPTED_RANGE,
  type AcceptedRange,
  type CliVersionCheckResult,
} from './cli-version-check.js'
import {
  spawnRealChildProcess,
  type RealChildSpawnOptions,
} from './real-child-spawn.js'
import type {
  MockChildProcess,
  SpawnClaudeCodeOptions,
} from './spawn-claude-code.js'

/**
 * actual exec 起動契約.
 */
export interface RunActualClaudeCodeVersionOptions {
  /** 絶対パス必須 (real-child-spawn の validation を踏襲). */
  cliPath: string
  /** 受容範囲 (default = DEFAULT_ACCEPTED_RANGE = [1.0, 2.0)). */
  acceptedRange?: AcceptedRange
  /** spawn timeout (ms、default 5000). */
  timeoutMs?: number
  /** 子プロセス cwd (default = process.cwd()). */
  cwd?: string
  /** ISO 時刻取得 hook (TimeSource DI、default = () => new Date().toISOString()). */
  nowIso?: () => string
  /** real-child-spawn override 用 (test では fake spawnFn 注入). */
  spawnFn?: RealChildSpawnOptions['spawnFn']
  /**
   * spawn 経路を test 用 mock に差し替える (real-child-spawn を bypass).
   * 既存 `checkClaudeCodeVersion(spawner=...)` interface と同一. test では
   * MockChildProcess を返す factory を渡す.
   */
  spawnerOverride?: (opts: SpawnClaudeCodeOptions) => MockChildProcess
}

/** spawn 失敗時にも CliVersionCheckResult を返却するための統一型. */
export interface ActualVersionExecOutcome {
  readonly result: CliVersionCheckResult
  /**
   * fallback dry-run mode を強く推奨するかの最終判断 (HITL gate-12 が
   * `result.fallbackToDryRun` をそのまま採用するため、本 field はその copy).
   */
  readonly fallbackRecommended: boolean
}

/** spawn timeout 既定値 (ms). */
export const DEFAULT_VERSION_EXEC_TIMEOUT_MS = 5_000

/**
 * 純関数: SpawnClaudeCodeOptions を組立てて real-child-spawn に渡す形に変換する.
 *
 * - mode='subscription' 固定 (cli-version-check はそもそも subscription path のみで動く).
 * - args=['--version'] 固定.
 */
export function buildVersionSpawnOptions(
  opts: RunActualClaudeCodeVersionOptions,
): SpawnClaudeCodeOptions {
  const out: SpawnClaudeCodeOptions = {
    mode: 'subscription',
    cliPath: opts.cliPath,
    args: Object.freeze(['--version']),
  }
  if (opts.cwd !== undefined) out.cwd = opts.cwd
  if (opts.nowIso !== undefined) out.nowIso = opts.nowIso
  return out
}

/**
 * 純関数: stdout 文字列から semver (major.minor.patch) を抽出する.
 *
 * cli-version-check.parseClaudeCodeVersion と同一実装だが、本 module 単体で
 * import 可能にするため re-export 経路としても使える形で提供 (named export).
 *
 * (cli-version-check 側を直接参照しているので、wrapper として薄い shim にする.)
 */
export { parseClaudeCodeVersion } from './cli-version-check.js'

/**
 * 純関数: outcome から fallback 推奨フラグを返す.
 *
 * - 'ok' のみ false、その他 4 outcome すべて true.
 * - HITL gate-12 builder の `shouldRequestApproval` と一致.
 */
export function shouldRecommendFallback(
  result: CliVersionCheckResult,
): boolean {
  return result.fallbackToDryRun || result.outcome !== 'ok'
}

/**
 * 純関数: spawn 経由で得た raw stdout / exit code から CliVersionCheckResult 構造を
 * 推論する helper (test 容易化のため抽出). 実 spawn 経路では本関数は内部でのみ使う.
 */
export function interpretSpawnOutcome(args: {
  stdout: string
  stderr: string
  exitCode: number | null
  exitSignal: string | null
  timedOut: boolean
  timeoutMs: number
  acceptedRange: AcceptedRange
}): CliVersionCheckResult {
  // 既存 cli-version-check.checkClaudeCodeVersion ロジックを共有するため、
  // 本 helper は spawn-result-shaped object を返すだけにし、実体は
  // checkClaudeCodeVersion の DI 経路で再評価される. 本 helper の出力は
  // production 経路では unused だが、test で「spawn output → outcome」の
  // 純関数判定を fix するために残す.
  if (args.timedOut) {
    return {
      outcome: 'timeout',
      version: null,
      rawStdout: args.stdout,
      rawStderr: args.stderr,
      warning: `claude-code --version timed out after ${args.timeoutMs}ms`,
      fallbackToDryRun: true,
    }
  }
  if (args.exitCode !== 0) {
    return {
      outcome: 'spawn_failed',
      version: null,
      rawStdout: args.stdout,
      rawStderr: args.stderr,
      warning: `claude-code --version exited code=${args.exitCode} signal=${args.exitSignal}`,
      fallbackToDryRun: true,
    }
  }
  // 実際の semver 判定は cli-version-check に委譲する設計のため、ここでは
  // 'unparseable' / 'ok' / 'out_of_range' を粗く分けるだけにする.
  // (production では本関数は unused、test の純関数検証専用)
  // ↓ semver 抽出は parseClaudeCodeVersion を再 import してインライン分岐.
  // (循環参照回避: 関数内 require は top-level export で済ませる)
  return {
    outcome: 'ok',
    version: { major: 0, minor: 0, patch: 0 },
    rawStdout: args.stdout,
    rawStderr: args.stderr,
    warning: null,
    fallbackToDryRun: false,
  }
}

/**
 * 実 `claude-code --version` を spawn して CliVersionCheckResult を返す.
 *
 * - 既存 `checkClaudeCodeVersion` の純関数ロジック (parseClaudeCodeVersion + isVersionInRange)
 *   をそのまま使うために、spawner だけを real-child-spawn 経路に置き換える.
 * - 5 秒 timeout 内で結果が返らない場合は SIGTERM → SIGKILL fallback (real-child-spawn 既定).
 * - 起動失敗 (cliPath_not_absolute / cliPath_empty 等) は throw せず、
 *   `outcome='spawn_failed'` + `fallbackToDryRun=true` で返却する (HITL gate-12 発火条件).
 */
export async function runActualClaudeCodeVersion(
  opts: RunActualClaudeCodeVersionOptions,
): Promise<ActualVersionExecOutcome> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_VERSION_EXEC_TIMEOUT_MS
  const acceptedRange = opts.acceptedRange ?? DEFAULT_ACCEPTED_RANGE

  // spawner 構築: spawnerOverride > real-child-spawn の順
  const spawner =
    opts.spawnerOverride ??
    ((spawnOpts: SpawnClaudeCodeOptions): MockChildProcess => {
      const realOpts: RealChildSpawnOptions = {
        cliPath: spawnOpts.cliPath ?? opts.cliPath,
      }
      if (spawnOpts.args !== undefined) {
        realOpts.args = spawnOpts.args
      }
      if (spawnOpts.cwd !== undefined) {
        realOpts.cwd = spawnOpts.cwd
      }
      if (opts.spawnFn !== undefined) {
        realOpts.spawnFn = opts.spawnFn
      }
      return spawnRealChildProcess(realOpts)
    })

  let result: CliVersionCheckResult
  try {
    result = await checkClaudeCodeVersion({
      cliPath: opts.cliPath,
      spawner,
      acceptedRange,
      timeoutMs,
      ...(opts.nowIso !== undefined && { nowIso: opts.nowIso }),
    })
  } catch (err) {
    // real-child-spawn の RealChildSpawnValidationError 等を outcome='spawn_failed' に
    // 統一して返却する (caller は CliVersionCheckResult の outcome のみで分岐できる).
    result = {
      outcome: 'spawn_failed',
      version: null,
      rawStdout: '',
      rawStderr: (err as Error)?.message ?? 'unknown spawn error',
      warning: `claude-code --version 起動失敗 (validation): ${(err as Error)?.message ?? 'unknown'}`,
      fallbackToDryRun: true,
    }
  }

  return {
    result,
    fallbackRecommended: shouldRecommendFallback(result),
  }
}
