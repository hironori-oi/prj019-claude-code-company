/**
 * cli/cli-version-check — Round 12 Dev-D 着地 (Task C):
 *   起動時 1 回 `claude-code --version` を起動して minor 版範囲内かを確認する layer。
 *
 * 設計方針:
 *   - **純関数化**: parseClaudeCodeVersion は副作用 0、stdout 文字列のみで判定。
 *   - **opt-in 起動**: spawner 注入 (DI) のため、テストでは fake spawner を渡し、
 *     production では adaptRealChildProcess + 標準起動 API を渡す。
 *   - **fallback dry-run mode 候補化**: 範囲外検出時は warning event を返却し、
 *     caller (subscription-router) が dry-run mode への切り替え判断材料とする。
 *   - **既存無改変**: spawn-claude-code.ts / session-controller.ts に touch 0
 *     (本 module は import のみ)。
 *
 * 関連:
 *   - DEC-019-007 (副作用ゼロ要件)
 *   - DEC-019-051 (subscription-driven 中核手段の起動前 health check)
 *   - cli/spawn-claude-code.ts SpawnMode と整合
 *
 * 想定対応版:
 *   - Claude Code CLI v1.x.y (W0 / Phase 1 想定範囲)
 *   - v2.x 以降は破壊的変更見込のため warning + fallback 候補
 *   - v0.x 未満は実験版扱いで warning + fallback 候補
 */
import type {
  MockChildProcess,
  SpawnClaudeCodeOptions,
} from './spawn-claude-code.js'

/** semver 構造 (build/prerelease は無視) */
export interface SemverParts {
  major: number
  minor: number
  patch: number
}

/** version check の結果コード */
export type CliVersionCheckOutcome =
  | 'ok'
  | 'out_of_range'
  | 'unparseable'
  | 'spawn_failed'
  | 'timeout'

/** version check の戻り値 */
export interface CliVersionCheckResult {
  readonly outcome: CliVersionCheckOutcome
  readonly version: SemverParts | null
  readonly rawStdout: string
  readonly rawStderr: string
  readonly warning: string | null
  /** caller が dry-run mode に fallback する候補かどうか */
  readonly fallbackToDryRun: boolean
}

/** 想定 minor 範囲 (default: 1.0 <= v < 2.0) */
export interface AcceptedRange {
  readonly minMajor: number
  readonly minMinor: number
  /** 上限 major (この値以上は out_of_range) */
  readonly maxMajorExclusive: number
}

export const DEFAULT_ACCEPTED_RANGE: AcceptedRange = Object.freeze({
  minMajor: 1,
  minMinor: 0,
  maxMajorExclusive: 2,
})

/** version check 起動入力 */
export interface CheckClaudeCodeVersionOptions {
  /** Claude Code CLI 実行ファイルパス (default: 'claude-code') */
  cliPath?: string
  /** spawner 注入 (production では実起動 API ベース、tests では fake) */
  spawner: (opts: SpawnClaudeCodeOptions) => MockChildProcess
  /** 受容範囲 (default DEFAULT_ACCEPTED_RANGE) */
  acceptedRange?: AcceptedRange
  /** 起動 timeout (ms、default 5000) */
  timeoutMs?: number
  /** ISO 時刻取得 hook */
  nowIso?: () => string
}

/**
 * stdout 文字列から `claude-code --version` 出力の semver を抽出する純関数。
 *
 * 想定出力 (例):
 *   - "claude-code 1.2.3"
 *   - "Claude Code CLI v1.2.3"
 *   - "1.2.3"
 *   - "claude-code 1.2.3-beta.1+build.5" (prerelease/build は無視、major.minor.patch のみ)
 *
 * 失敗 (空文字 / 数字 0 件 / フォーマット不一致) 時は null を返す。
 */
export function parseClaudeCodeVersion(stdout: string): SemverParts | null {
  if (typeof stdout !== 'string') return null
  const lines = stdout.split(/\r?\n/)
  // Allow optional 'v'/'V' prefix immediately before semver (e.g. 'v1.5.0').
  // Use lookahead to avoid consuming surrounding characters and to match
  // patterns embedded in strings like 'CLI v1.5.0' where '\b' fails between letters.
  const re = /(?:^|[^\d])v?(\d+)\.(\d+)\.(\d+)(?:[-+][\w.]*)?(?=$|[^\d])/i
  for (const line of lines) {
    const m = re.exec(line)
    if (m && m[1] !== undefined && m[2] !== undefined && m[3] !== undefined) {
      const major = Number.parseInt(m[1], 10)
      const minor = Number.parseInt(m[2], 10)
      const patch = Number.parseInt(m[3], 10)
      if (
        Number.isFinite(major) &&
        Number.isFinite(minor) &&
        Number.isFinite(patch) &&
        major >= 0 &&
        minor >= 0 &&
        patch >= 0
      ) {
        return { major, minor, patch }
      }
    }
  }
  return null
}

/**
 * semver が受容範囲内かを判定する純関数。
 *
 *   minMajor.minMinor <= v < maxMajorExclusive.0.0
 */
export function isVersionInRange(
  v: SemverParts,
  range: AcceptedRange = DEFAULT_ACCEPTED_RANGE,
): boolean {
  if (v.major >= range.maxMajorExclusive) return false
  if (v.major < range.minMajor) return false
  if (v.major === range.minMajor && v.minor < range.minMinor) return false
  return true
}

/**
 * 起動時 1 回 `claude-code --version` を起動して minor 版範囲を確認する。
 *
 * - 範囲外 → outcome='out_of_range' + warning + fallbackToDryRun=true
 * - parse 失敗 → outcome='unparseable' + warning + fallbackToDryRun=true
 * - 起動失敗 → outcome='spawn_failed' + warning + fallbackToDryRun=true
 * - timeout → outcome='timeout' + warning + fallbackToDryRun=true
 * - 範囲内 → outcome='ok' + warning=null + fallbackToDryRun=false
 *
 * 副作用は spawner 注入経由のみ。起動結果は返却前に pure 値化される。
 */
export async function checkClaudeCodeVersion(
  options: CheckClaudeCodeVersionOptions,
): Promise<CliVersionCheckResult> {
  const cliPath = options.cliPath ?? 'claude-code'
  const range = options.acceptedRange ?? DEFAULT_ACCEPTED_RANGE
  const timeoutMs = options.timeoutMs ?? 5000

  let child: MockChildProcess
  try {
    child = options.spawner({
      mode: 'subscription',
      cliPath,
      args: ['--version'],
    })
  } catch (err) {
    return {
      outcome: 'spawn_failed',
      version: null,
      rawStdout: '',
      rawStderr: (err as Error)?.message ?? 'spawner threw',
      warning: `claude-code --version 起動失敗: ${(err as Error)?.message ?? 'unknown'}`,
      fallbackToDryRun: true,
    }
  }

  let stdoutBuf = ''
  let stderrBuf = ''
  let exitCode: number | null | undefined
  let exitSignal: string | null = null
  let timedOut = false

  child.onStdoutLine((line) => {
    stdoutBuf += line + '\n'
  })
  child.onStderrLine((line) => {
    stderrBuf += line + '\n'
  })

  const exitPromise = new Promise<void>((resolve) => {
    child.onExit((code, signal) => {
      exitCode = code
      exitSignal = signal
      resolve()
    })
  })

  const timeoutPromise = new Promise<void>((resolve) =>
    setTimeout(() => {
      timedOut = true
      try {
        child.kill('SIGTERM')
      } catch {
        // best effort
      }
      resolve()
    }, timeoutMs),
  )

  await Promise.race([exitPromise, timeoutPromise])

  if (timedOut) {
    return {
      outcome: 'timeout',
      version: null,
      rawStdout: stdoutBuf,
      rawStderr: stderrBuf,
      warning: `claude-code --version timed out after ${timeoutMs}ms`,
      fallbackToDryRun: true,
    }
  }

  if (exitCode !== 0) {
    return {
      outcome: 'spawn_failed',
      version: null,
      rawStdout: stdoutBuf,
      rawStderr: stderrBuf,
      warning: `claude-code --version exited code=${exitCode} signal=${exitSignal}`,
      fallbackToDryRun: true,
    }
  }

  const v = parseClaudeCodeVersion(stdoutBuf)
  if (!v) {
    return {
      outcome: 'unparseable',
      version: null,
      rawStdout: stdoutBuf,
      rawStderr: stderrBuf,
      warning: 'claude-code --version stdout could not be parsed as semver',
      fallbackToDryRun: true,
    }
  }

  if (!isVersionInRange(v, range)) {
    return {
      outcome: 'out_of_range',
      version: v,
      rawStdout: stdoutBuf,
      rawStderr: stderrBuf,
      warning:
        `claude-code version ${v.major}.${v.minor}.${v.patch} is outside accepted range ` +
        `[${range.minMajor}.${range.minMinor}, ${range.maxMajorExclusive}.0)`,
      fallbackToDryRun: true,
    }
  }

  return {
    outcome: 'ok',
    version: v,
    rawStdout: stdoutBuf,
    rawStderr: stderrBuf,
    warning: null,
    fallbackToDryRun: false,
  }
}
