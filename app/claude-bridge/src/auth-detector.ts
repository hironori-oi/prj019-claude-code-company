/**
 * auth-detector — Claude Code CLI の認証状態検出。
 *
 * 関連必須コントロール:
 *   G-V2-03 (起動元偽装/OAuth 直 spawn 全面禁止)
 *   G-V2-11 (OAuth トークン到達禁止 FS/env 隔離)
 *
 * 重要原則 (NG-1 違反回避):
 *   - 自動的に OAuth フローを起動しない
 *   - OAuth トークンを直接ハンドリングしない
 *   - オーナー本人が事前にログイン済みであることが前提
 *   - 未認証なら明示エラーにし、kill-switch を armed する想定
 *
 * 検出方法:
 *   1. `claude --version` の exit code 0 を確認
 *   2. `~/.claude/` ディレクトリの存在を確認 (OAuth クレデンシャル保管場所)
 *   3. (任意) `claude config get --global` で oauth_account の存在確認
 *
 * 注意: クレデンシャルファイル本体を読まない。Claude Code CLI 自身に委譲。
 */
import { spawn } from 'node:child_process'
import { promises as fs } from 'node:fs'
import { homedir, platform } from 'node:os'
import { join } from 'node:path'

export interface AuthDetectionResult {
  authenticated: boolean
  /** `claude --version` の出力 (取得できた場合) */
  version?: string
  /** ~/.claude/ が存在するか */
  configDirExists: boolean
  /** Claude Code CLI 自体が見つかったか (PATH 上または明示パス) */
  cliFound: boolean
  /** 失敗時の理由 */
  reason?: string
}

export interface AuthDetectorOptions {
  /** claude CLI 実行コマンド (default: 'claude'。Windows では 'claude.cmd' 自動検出) */
  command?: string
  /** ~/.claude のパス (test 注入用) */
  configDir?: string
  /** spawn timeout (ms) */
  timeoutMs?: number
}

/**
 * Claude Code CLI が認証済みかを検出する。
 *
 * **重要**: 戻り値の authenticated=false は claude-bridge 側で
 * `auth_failed` エラーに変換し、kill-switch を armed すること。
 */
export async function detectClaudeAuth(
  opts: AuthDetectorOptions = {},
): Promise<AuthDetectionResult> {
  const command = opts.command ?? resolveDefaultCommand()
  const configDir = opts.configDir ?? join(homedir(), '.claude')
  const timeoutMs = opts.timeoutMs ?? 5000

  const result: AuthDetectionResult = {
    authenticated: false,
    configDirExists: false,
    cliFound: false,
  }

  // 1. ~/.claude ディレクトリ確認
  try {
    const stat = await fs.stat(configDir)
    result.configDirExists = stat.isDirectory()
  } catch {
    result.configDirExists = false
  }

  // 2. `claude --version` 実行
  let exitCode: number | null = null
  try {
    const { code, stdout, stderr } = await runCommand(command, ['--version'], timeoutMs)
    exitCode = code
    // exit code 0 で正常終了した場合のみ「CLI 起動可能」とみなす。
    // 非 0 (command not found 含む) は cliFound=false 扱いにして "見つからない" 系の reason を立てる。
    if (code === 0) {
      result.cliFound = true
      const v = stdout.trim() || stderr.trim()
      if (v) result.version = v
    } else if (code !== null) {
      result.cliFound = false
      result.reason = `claude --version exited with ${code}`
    } else {
      result.cliFound = false
      result.reason = result.reason ?? 'claude CLI did not return an exit code'
    }
  } catch (err) {
    result.cliFound = false
    result.reason = `cli spawn failed: ${(err as Error).message}`
    return result
  }

  // 認証判定: CLI が --version 0 で応答し、かつ ~/.claude/ が存在すれば「認証済みである可能性が高い」と扱う。
  // 厳密には credentials.json の存在を確認すべきだが、本ファイルへの read access を
  // 取らないのが G-V2-11 方針 (Open Claw / harness プロセスから OAuth に到達させない)。
  if (result.cliFound && result.configDirExists) {
    result.authenticated = true
  } else if (!result.cliFound) {
    result.reason = result.reason ?? 'claude CLI not found in PATH'
  } else if (!result.configDirExists) {
    result.reason = result.reason ?? `~/.claude/ does not exist (need OAuth login first)`
  }
  // exitCode は将来的に詳細レポートで使うため変数として保持 (現状未公開)。
  void exitCode
  return result
}

/**
 * Windows では claude.cmd / claude.bat が PATH に登録される場合がある。
 * 'claude' のままでも spawn 時 shell:true で解決可能なため、
 * default は 'claude' のままで shell 経由起動に委ねる。
 */
function resolveDefaultCommand(): string {
  // 環境変数で明示指定があれば優先
  const env = process.env['CLAUDE_CLI_PATH']
  if (env) return env
  return 'claude'
}

interface CommandResult {
  code: number | null
  signal: NodeJS.Signals | null
  stdout: string
  stderr: string
}

function runCommand(command: string, args: string[], timeoutMs: number): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const isWin = platform() === 'win32'
    const child = spawn(command, args, {
      shell: isWin, // Windows では .cmd / .bat 解決のため shell 必須
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      setTimeout(() => child.kill('SIGKILL'), 1000).unref?.()
    }, timeoutMs)
    timer.unref?.()

    child.stdout?.on('data', (d: Buffer) => {
      stdout += d.toString('utf-8')
    })
    child.stderr?.on('data', (d: Buffer) => {
      stderr += d.toString('utf-8')
    })
    child.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
    child.on('close', (code, signal) => {
      clearTimeout(timer)
      resolve({ code, signal, stdout, stderr })
    })
  })
}
