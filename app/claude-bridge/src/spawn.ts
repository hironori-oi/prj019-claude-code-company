/**
 * spawn — Claude Code CLI を subprocess spawn する claude-bridge の中核。
 *
 * 関連必須コントロール:
 *   G-V2-03 (起動元偽装/OAuth 直 spawn 全面禁止)
 *   G-V2-04 (指示入力経路の単一化)
 *   G-V2-12 (投入経路文書化)
 *
 * P-D 改 採用根拠:
 *   - 公式 Claude Code CLI を改変なしで使用 → "third-party tool" 該当しない
 *   - 認証はオーナー本人 OAuth (CLI 自身に委譲、bridge は OAuth トークン直接ハンドルしない)
 *   - `claude -p "<prompt>" --output-format=stream-json` で起動
 *   - stdout を行ベースで stream-json parse
 *   - stderr は構造化ログとして記録
 *   - timeout 時 SIGTERM → 5 秒後 SIGKILL
 *   - cost-tracker / usage-monitor に記録
 *   - circuit-breaker でラップ
 *
 * Windows 11 primary 注意:
 *   - `claude.cmd` 解決のため shell:true で起動 (resolveCommand 参照)
 *   - SIGTERM/SIGKILL はそのまま動作する (process.kill('SIGTERM') は Windows でも有効)
 */
import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { platform } from 'node:os'
import {
  CircuitBreaker,
  CircuitOpenError,
  type CostTracker,
  type UsageMonitor,
} from '@clawbridge/harness'
import {
  parseStreamJsonChunks,
  extractUsage,
  type ClaudeMessage,
} from './stream-json-parser.js'
import { detectClaudeAuth } from './auth-detector.js'

export type ClaudePermissionMode = 'default' | 'plan' | 'acceptEdits'

export interface ClaudeBridgeOptions {
  /** claude CLI 実行コマンド (test 注入用) */
  command?: string
  /** harness 統合用 */
  costTracker?: CostTracker
  usageMonitor?: UsageMonitor
  /** circuit-breaker (default: 失敗 5 回で open / 30s cooldown) */
  circuitBreaker?: CircuitBreaker
  /** 認証チェックをスキップ (test 用) */
  skipAuthCheck?: boolean
  /** stderr / stdout を取得しつつ debug 出力するか */
  debug?: boolean
}

export interface ClaudeExecuteOptions {
  cwd?: string
  /** 全体 timeout (ms)。default 10 分。 */
  timeoutMs?: number
  /** Claude Code の --allowedTools フラグ */
  allowedTools?: string[]
  /** Claude Code の --permission-mode フラグ */
  permissionMode?: ClaudePermissionMode
  /** Claude Code の --session-id フラグ (resume) */
  sessionId?: string
  /** Claude Code の --append-system-prompt フラグ */
  appendSystemPrompt?: string
  /** harness 連携用 metadata */
  projectId?: string
  /** 追加 env (Windows path 等)。secret は注入しないこと */
  extraEnv?: Record<string, string>
}

export type ClaudeErrorType =
  | 'timeout'
  | 'spawn_failed'
  | 'auth_failed'
  | 'rate_limited'
  | 'circuit_open'
  | 'unknown'

export interface ClaudeResult {
  success: boolean
  /** stream-json でパースされた全メッセージ */
  messages: ClaudeMessage[]
  /** 集計済 token usage */
  tokenUsage: {
    input: number
    output: number
    cacheRead: number
    cacheWrite: number
  }
  /** Claude が報告した cost (公式 result.total_cost_usd 由来、サブスク経由なので参考値) */
  costEstimate: number
  durationMs: number
  exitCode: number | null
  signal: NodeJS.Signals | null
  /** stderr 全文 (debug 用) */
  stderr: string
  error?: { type: ClaudeErrorType; message: string }
}

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000 // 10 min
const SIGTERM_GRACE_MS = 5_000

export class ClaudeBridge {
  private readonly command: string
  private readonly costTracker?: CostTracker
  private readonly usageMonitor?: UsageMonitor
  private readonly circuit: CircuitBreaker
  private readonly skipAuthCheck: boolean
  /** debug ログ出力用フラグ。W0 ではフラグ保持のみ (詳細ログは W1 で実装) */
  private readonly debug: boolean
  private authChecked = false
  private authResult: { authenticated: boolean; reason?: string } | null = null

  constructor(opts: ClaudeBridgeOptions = {}) {
    this.command = opts.command ?? process.env['CLAUDE_CLI_PATH'] ?? 'claude'
    if (opts.costTracker !== undefined) this.costTracker = opts.costTracker
    if (opts.usageMonitor !== undefined) this.usageMonitor = opts.usageMonitor
    this.circuit =
      opts.circuitBreaker ??
      new CircuitBreaker({
        name: 'claude-bridge',
        failureThreshold: 5,
        cooldownMs: 30_000,
      })
    this.skipAuthCheck = opts.skipAuthCheck ?? false
    this.debug = opts.debug ?? false
    void this.debug // W0 stub: 値を保持するだけ (使われていない警告回避)
  }

  /**
   * 1 回の Claude Code 呼び出し。fresh session (P-D 改方針)。
   */
  async executeTask(prompt: string, options: ClaudeExecuteOptions = {}): Promise<ClaudeResult> {
    // 1. 認証チェック (初回のみ)
    if (!this.skipAuthCheck && !this.authChecked) {
      const auth = await detectClaudeAuth({ command: this.command })
      this.authChecked = true
      this.authResult = { authenticated: auth.authenticated }
      if (auth.reason) this.authResult.reason = auth.reason
      if (!auth.authenticated) {
        return this.makeErrorResult('auth_failed', auth.reason ?? 'not authenticated')
      }
    }

    // 2. circuit-breaker でラップ
    try {
      return await this.circuit.fire(() => this.spawnClaude(prompt, options))
    } catch (err) {
      if (err instanceof CircuitOpenError) {
        return this.makeErrorResult('circuit_open', err.message)
      }
      throw err
    }
  }

  /** 内部状態 (test 用) */
  status(): {
    authChecked: boolean
    authResult: { authenticated: boolean; reason?: string } | null
    circuit: ReturnType<CircuitBreaker['status']>
  } {
    return {
      authChecked: this.authChecked,
      authResult: this.authResult,
      circuit: this.circuit.status(),
    }
  }

  private async spawnClaude(
    prompt: string,
    options: ClaudeExecuteOptions,
  ): Promise<ClaudeResult> {
    const start = Date.now()
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

    const args = buildArgs(prompt, options)
    const env = buildEnv(options.extraEnv)
    const isWin = platform() === 'win32'

    // 注: shell:true は Windows で claude.cmd 解決のため必須。Linux/macOS は shell:false で OK。
    // stdio:['ignore','pipe','pipe'] なので stdin は null になる。
    // ChildProcessWithoutNullStreams は stdin が non-null を要求するため、
    // unknown 経由で安全にキャストする (本実装は stdin を使わない)。
    const child = spawn(this.command, args, {
      shell: isWin,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      ...(options.cwd !== undefined && { cwd: options.cwd }),
      env,
    }) as unknown as ChildProcessWithoutNullStreams

    let stderr = ''
    let timedOut = false

    const timer = setTimeout(() => {
      timedOut = true
      killProcessTree(child, isWin, 'SIGTERM')
      setTimeout(() => {
        killProcessTree(child, isWin, 'SIGKILL')
      }, SIGTERM_GRACE_MS).unref?.()
    }, timeoutMs)

    // stdout の AsyncIterable 化
    async function* stdoutChunks(): AsyncGenerator<Buffer, void, void> {
      for await (const chunk of child.stdout) {
        yield chunk as Buffer
      }
    }

    const messages: ClaudeMessage[] = []
    let parseError: Error | null = null
    try {
      for await (const msg of parseStreamJsonChunks(stdoutChunks())) {
        messages.push(msg)
      }
    } catch (err) {
      parseError = err as Error
    }

    child.stderr.on('data', (d: Buffer) => {
      stderr += d.toString('utf-8')
    })

    // process exit を待つ
    const exitInfo: { code: number | null; signal: NodeJS.Signals | null } = await new Promise(
      (resolve) => {
        child.on('close', (code, signal) => resolve({ code, signal }))
        child.on('error', () => resolve({ code: null, signal: null }))
      },
    )
    clearTimeout(timer)

    const durationMs = Date.now() - start
    const usage = extractUsage(messages)

    // record cost & usage
    if (this.costTracker && usage.totalCostUsd > 0) {
      try {
        await this.costTracker.recordSpend(
          'anthropic_subscription',
          usage.totalCostUsd,
          {
            ...(options.sessionId !== undefined && { sessionId: options.sessionId }),
            ...(options.projectId !== undefined && { projectId: options.projectId }),
          },
        )
      } catch {
        // ignore — record 失敗で本処理を止めない
      }
    }
    if (this.usageMonitor) {
      const status = exitInfo.code === 0 ? 200 : 500
      try {
        await this.usageMonitor.recordCall('anthropic_oauth', {
          status,
          tokens: usage.inputTokens + usage.outputTokens,
          costUsd: usage.totalCostUsd,
          durationMs,
        })
      } catch {
        // ignore
      }
    }

    // 結果判定
    if (timedOut) {
      return {
        success: false,
        messages,
        tokenUsage: toTokenUsage(usage),
        costEstimate: usage.totalCostUsd,
        durationMs,
        exitCode: exitInfo.code,
        signal: exitInfo.signal,
        stderr,
        error: { type: 'timeout', message: `claude CLI exceeded ${timeoutMs}ms` },
      }
    }
    if (exitInfo.code === null && exitInfo.signal === null) {
      return {
        success: false,
        messages,
        tokenUsage: toTokenUsage(usage),
        costEstimate: usage.totalCostUsd,
        durationMs,
        exitCode: null,
        signal: null,
        stderr,
        error: {
          type: 'spawn_failed',
          message: `claude CLI failed to spawn${parseError ? ': ' + parseError.message : ''}`,
        },
      }
    }
    if (exitInfo.code !== 0) {
      const errorType = detectErrorType(stderr, exitInfo.code)
      return {
        success: false,
        messages,
        tokenUsage: toTokenUsage(usage),
        costEstimate: usage.totalCostUsd,
        durationMs,
        exitCode: exitInfo.code,
        signal: exitInfo.signal,
        stderr,
        error: { type: errorType, message: stderr.trim() || `exit code ${exitInfo.code}` },
      }
    }

    return {
      success: true,
      messages,
      tokenUsage: toTokenUsage(usage),
      costEstimate: usage.totalCostUsd,
      durationMs,
      exitCode: exitInfo.code,
      signal: exitInfo.signal,
      stderr,
    }
  }

  private makeErrorResult(type: ClaudeErrorType, message: string): ClaudeResult {
    return {
      success: false,
      messages: [],
      tokenUsage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      costEstimate: 0,
      durationMs: 0,
      exitCode: null,
      signal: null,
      stderr: '',
      error: { type, message },
    }
  }
}

function buildArgs(prompt: string, options: ClaudeExecuteOptions): string[] {
  const args: string[] = ['-p', prompt, '--output-format', 'stream-json', '--verbose']
  if (options.allowedTools && options.allowedTools.length > 0) {
    args.push('--allowedTools', options.allowedTools.join(','))
  }
  if (options.permissionMode) {
    args.push('--permission-mode', options.permissionMode)
  }
  if (options.sessionId) {
    args.push('--resume', options.sessionId)
  }
  if (options.appendSystemPrompt) {
    args.push('--append-system-prompt', options.appendSystemPrompt)
  }
  return args
}

/**
 * env をコピーしつつ、secret 系を絞る (G-V2-11 secret 隔離方針)。
 *
 * - ANTHROPIC_API_KEY は明示的に渡さない (P-D 改は OAuth 経由)
 * - OPENAI_API_KEY も同様
 * - PATH / NODE_PATH 等は引き継ぎ必要
 *
 * extraEnv で必要な値だけ追加注入する設計。
 */
function buildEnv(extra?: Record<string, string>): NodeJS.ProcessEnv {
  const allow = new Set([
    'PATH',
    'Path',
    'PATHEXT',
    'HOME',
    'USERPROFILE',
    'APPDATA',
    'LOCALAPPDATA',
    'TEMP',
    'TMP',
    'SYSTEMROOT',
    'COMSPEC',
    'NODE_PATH',
    'CI',
    'TZ',
    'LANG',
    'LC_ALL',
  ])
  const env: NodeJS.ProcessEnv = {}
  for (const [k, v] of Object.entries(process.env)) {
    if (allow.has(k) && typeof v === 'string') {
      env[k] = v
    }
  }
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      // secret 系の名前をブロックする (defense in depth)
      if (/api[_-]?key|secret|token|password|credential/i.test(k)) {
        continue
      }
      env[k] = v
    }
  }
  return env
}

/**
 * 子プロセスを kill する。
 * Windows + shell:true ではシェル親 (cmd.exe) に SIGTERM を送るだけでは
 * 孫プロセスが残るため、taskkill /T /F で プロセスツリーを丸ごと終了させる。
 */
function killProcessTree(
  child: ChildProcessWithoutNullStreams,
  isWin: boolean,
  signal: 'SIGTERM' | 'SIGKILL',
): void {
  try {
    if (isWin && child.pid !== undefined) {
      // /T: tree, /F: force (SIGKILL 相当時のみ /F)
      const args = ['/PID', String(child.pid), '/T']
      if (signal === 'SIGKILL') args.push('/F')
      spawnSync('taskkill', args, { stdio: 'ignore', windowsHide: true })
    } else {
      child.kill(signal)
    }
  } catch {
    // ignore
  }
}

function detectErrorType(stderr: string, code: number | null): ClaudeErrorType {
  const lower = stderr.toLowerCase()
  if (/401|403|unauthorized|forbidden|sign in|please log in|not authenticated/.test(lower)) {
    return 'auth_failed'
  }
  if (/429|rate.?limit|too many requests/.test(lower)) {
    return 'rate_limited'
  }
  if (code === 127 || /command not found|enoent/.test(lower)) {
    return 'spawn_failed'
  }
  return 'unknown'
}

function toTokenUsage(usage: ReturnType<typeof extractUsage>): ClaudeResult['tokenUsage'] {
  return {
    input: usage.inputTokens,
    output: usage.outputTokens,
    cacheRead: usage.cacheReadTokens,
    cacheWrite: usage.cacheWriteTokens,
  }
}
