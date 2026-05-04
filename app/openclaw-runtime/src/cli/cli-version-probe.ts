/**
 * cli/cli-version-probe — Round 15 Dev-M 着地 (M-2):
 *   Claude Code CLI の version 取得を mock から actual subprocess exec に切替えた
 *   high-level convenience helper。
 *
 *   `cli-version-check-exec.runActualClaudeCodeVersion` は spawn 経路の wrapper だが、
 *   本 module はそれをさらに wrap して、
 *     - 5 sec timeout 既定
 *     - エラー時の明示 fallback
 *     - Result 型 (ok / err discriminated union) で表現
 *     - DEC-019-033 拡張連動の cli-version-update HITL gate (gate-12) 用 request 自動構築
 *   を 1 関数で提供する.
 *
 * 関連:
 *   - cli/cli-version-check.ts (Round 12 Dev-D 着地、純関数 + DI 経路)
 *   - cli/cli-version-check-exec.ts (Round 14 Dev-D 着地、actual spawn wrapper)
 *   - cli/auto-update-hitl.ts (Round 13 Dev-D 着地、HITL gate-12 request builder)
 *   - DEC-019-007 (副作用ゼロ要件 — 本 module は spawn を `spawnFn` 注入経由のみ呼ぶ)
 *   - DEC-019-033 拡張 (cli-version-update HITL gate との連動)
 *   - DEC-019-051 (subscription-driven 中核 / version 不一致時の dry-run fallback)
 *
 * 設計方針:
 *   - **Result 型**: try/catch を caller 側に強制せず、ok=true/false の discriminated union で
 *     返す. caller は switch (result.ok) で網羅的に分岐できる.
 *   - **5 秒 timeout 既定**: claude-code --version は通常 < 1 秒で返るが、binary が hang した
 *     場合の保護として 5_000ms を default に固定. caller override 可.
 *   - **明示 fallback**: outcome='ok' 以外はすべて gate-12 request を auto-build し、
 *     Result.gateRequest に同梱. caller は HITL gate を発火するだけ.
 *   - **副作用 0 (DI 経由)**: spawnFn は `node:child_process.spawn` を default、test では fake 注入.
 *   - **既存 module は無改変**: 本 module は cli-version-check-exec.ts と auto-update-hitl.ts を
 *     合成するだけの adapter. 既存 import path / behavior は完全保持.
 */
import {
  buildCliVersionUpdateHitlRequest,
  type CliVersionUpdateHitlRequest,
} from './auto-update-hitl.js'
import {
  DEFAULT_ACCEPTED_RANGE,
  type AcceptedRange,
  type CliVersionCheckResult,
} from './cli-version-check.js'
import {
  DEFAULT_VERSION_EXEC_TIMEOUT_MS,
  runActualClaudeCodeVersion,
  type RunActualClaudeCodeVersionOptions,
} from './cli-version-check-exec.js'

// ============================================================================
// Result 型 (discriminated union)
// ============================================================================

/** version-check が通過し、CLI が範囲内で稼働可能な状態. */
export interface CliVersionProbeOk {
  readonly ok: true
  readonly outcome: 'ok'
  readonly result: CliVersionCheckResult
  /** ok 時は gate-12 不要なので null. */
  readonly gateRequest: null
}

/** version-check が範囲外 / parse 失敗 / spawn 失敗 / timeout のいずれかで fallback 推奨. */
export interface CliVersionProbeErr {
  readonly ok: false
  readonly outcome: Exclude<CliVersionCheckResult['outcome'], 'ok'>
  readonly result: CliVersionCheckResult
  /** caller が HITL gate-12 を発火するための pre-built request (= 直接 fireGate12HitlGate に渡せる). */
  readonly gateRequest: CliVersionUpdateHitlRequest
  readonly fallbackRecommended: true
}

export type CliVersionProbeResult = CliVersionProbeOk | CliVersionProbeErr

// ============================================================================
// 入力契約
// ============================================================================

export interface ProbeClaudeCodeVersionOptions {
  /** Claude Code CLI 実行ファイル絶対パス (相対パス / 空文字は spawn_failed fallback). */
  readonly cliPath: string
  /** 受容範囲 (default = [1.0, 2.0)). */
  readonly acceptedRange?: AcceptedRange
  /**
   * spawn timeout (ms). default = 5000.
   * NaN / <=0 / Infinity はすべて DEFAULT_VERSION_EXEC_TIMEOUT_MS に正規化.
   */
  readonly timeoutMs?: number
  /** 子プロセス cwd. */
  readonly cwd?: string
  /** ISO 時刻取得 hook. */
  readonly nowIso?: () => string
  /** spawn function 注入 (test 用、default = node:child_process.spawn). */
  readonly spawnFn?: RunActualClaudeCodeVersionOptions['spawnFn']
  /** spawnerOverride: real-child-spawn を bypass する完全 mock 経路 (test 専用). */
  readonly spawnerOverride?: RunActualClaudeCodeVersionOptions['spawnerOverride']
}

// ============================================================================
// 純関数: timeout 値正規化
// ============================================================================

/**
 * timeout 値を妥当範囲に正規化する純関数.
 * - NaN / <=0 / non-finite → DEFAULT_VERSION_EXEC_TIMEOUT_MS
 * - そうでなければ Math.floor (整数化)
 */
export function normalizeTimeoutMs(input: number | undefined): number {
  if (input === undefined) return DEFAULT_VERSION_EXEC_TIMEOUT_MS
  if (!Number.isFinite(input)) return DEFAULT_VERSION_EXEC_TIMEOUT_MS
  if (input <= 0) return DEFAULT_VERSION_EXEC_TIMEOUT_MS
  return Math.floor(input)
}

// ============================================================================
// 純関数: Result 型 builder
// ============================================================================

/**
 * CliVersionCheckResult を Result 型に変換する純関数.
 * - outcome='ok' → CliVersionProbeOk
 * - その他 → gate-12 request を build し、CliVersionProbeErr を返す.
 *
 * gate-12 request の build に失敗した場合 (invariant violation) は throw.
 */
export function buildProbeResult(args: {
  result: CliVersionCheckResult
  cliPath: string
  acceptedRange: AcceptedRange
  timeoutMs: number
  nowIso?: () => string
}): CliVersionProbeResult {
  const { result, cliPath, acceptedRange, timeoutMs, nowIso } = args
  if (result.outcome === 'ok') {
    return Object.freeze({
      ok: true as const,
      outcome: 'ok' as const,
      result,
      gateRequest: null,
    })
  }
  // gate-12 request を auto-build
  const gateRequest = buildCliVersionUpdateHitlRequest(result, {
    cliPath,
    acceptedRange,
    timeoutMs,
    ...(nowIso !== undefined && { nowIso }),
  })
  if (gateRequest === null) {
    // shouldRequestApproval が outcome!=='ok' で true を返すはずなので、
    // null は invariant 違反.
    throw new Error(
      `cli-version-probe: invariant violated — gateRequest=null for outcome=${result.outcome}`,
    )
  }
  return Object.freeze({
    ok: false as const,
    outcome: result.outcome,
    result,
    gateRequest,
    fallbackRecommended: true as const,
  })
}

// ============================================================================
// 主関数: actual subprocess exec で version probe を行う
// ============================================================================

/**
 * Claude Code CLI の version を actual subprocess exec で取得し、
 * 結果を Result 型 (ok / err) で返す.
 *
 * - default で `node:child_process.spawn` 経由の real subprocess を起動.
 * - test では `spawnFn` (raw spawn) または `spawnerOverride` (high-level) を注入可能.
 * - 5 sec timeout 既定. timeout 時は outcome='timeout' + fallbackRecommended=true.
 * - 起動失敗 (cliPath 相対 / 空文字 / validation error) 時は outcome='spawn_failed'.
 * - exit code != 0 時は outcome='spawn_failed' + stderr を warning に同梱.
 * - stdout の semver parse 失敗時は outcome='unparseable'.
 * - version が範囲外時は outcome='out_of_range'.
 *
 * caller は result.ok で網羅分岐し、err 時は result.gateRequest を HITL gate-12 に流すだけ.
 */
export async function probeClaudeCodeVersion(
  opts: ProbeClaudeCodeVersionOptions,
): Promise<CliVersionProbeResult> {
  const acceptedRange = opts.acceptedRange ?? DEFAULT_ACCEPTED_RANGE
  const timeoutMs = normalizeTimeoutMs(opts.timeoutMs)

  const execOpts: RunActualClaudeCodeVersionOptions = {
    cliPath: opts.cliPath,
    acceptedRange,
    timeoutMs,
  }
  if (opts.cwd !== undefined) execOpts.cwd = opts.cwd
  if (opts.nowIso !== undefined) execOpts.nowIso = opts.nowIso
  if (opts.spawnFn !== undefined) execOpts.spawnFn = opts.spawnFn
  if (opts.spawnerOverride !== undefined) execOpts.spawnerOverride = opts.spawnerOverride

  const exec = await runActualClaudeCodeVersion(execOpts)

  // gate-12 request build には cliPath が空文字の場合 sentinel が必要 (zod min(1) 制約).
  // 空 cliPath で spawn_failed になっても、audit / HITL に明示的な値で残せるよう sentinel 化.
  const cliPathForGate =
    opts.cliPath.length > 0 ? opts.cliPath : '<unset-cli-path>'

  return buildProbeResult({
    result: exec.result,
    cliPath: cliPathForGate,
    acceptedRange,
    timeoutMs,
    ...(opts.nowIso !== undefined && { nowIso: opts.nowIso }),
  })
}
