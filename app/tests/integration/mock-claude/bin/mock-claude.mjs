#!/usr/bin/env node
/**
 * mock-claude — 公式 `claude` CLI の最小互換スタブ。
 *
 * 関連必須コントロール:
 *   G-V2-03 (起動元偽装/OAuth 直 spawn 全面禁止) — Review ペネトレシナリオ B5/B6 検証用
 *   G-V2-08 (401/403/429 連続検知 → kill switch)
 *   G-V2-11 (緊急停止 + OAuth トークン到達禁止) — auth_failed / silent_revoke パス検証用
 *
 * 用途:
 *   - claude-bridge spawn.ts が `claude -p "<prompt>" --output-format=stream-json --verbose` 形式で
 *     起動してくる subprocess を、実 Claude CLI を使わずに再現する
 *   - 環境変数 MOCK_CLAUDE_SCENARIO で挙動を切り替えて 5 シナリオを網羅
 *   - 公式 CLI と同じく stdout に NDJSON (1 行 1 メッセージ) を吐き、最後に process.exit(code)
 *
 * シナリオ一覧 (env: MOCK_CLAUDE_SCENARIO):
 *   - 'success' (default)    : 通常成功 (system → assistant + usage → result)
 *   - 'auth_failed'          : exit 1 + stderr "credential" 系 → spawn.ts が auth_failed に分類
 *   - 'rate_limit_429'       : exit 0 だが stream-json に 429 エラーメッセージ含む
 *   - 'silent_revoke'        : exit 1 + stderr "401 Unauthorized" → spawn.ts auth_failed
 *   - 'slow'                 : 5 秒スリープしてから success ペイロードを返す (timeout テスト用)
 *
 * 受理する CLI フラグ (互換性のため受理するだけで動作には影響しない):
 *   -p, --print                     : prompt mode
 *   --output-format <fmt>           : 'stream-json' を期待
 *   --verbose
 *   --allowedTools <tools>
 *   --permission-mode <mode>
 *   --resume <session>
 *   --append-system-prompt <p>
 *
 * Windows / WSL2 / POSIX 互換: Node.js のみ依存。shebang は POSIX のみで効くが、
 * spawn から `node mock-claude.mjs` 形式で呼ぶ前提なので shebang 非必須。
 */

const SCENARIO = (process.env['MOCK_CLAUDE_SCENARIO'] ?? 'success').trim()

// argv パース (緩く) — 公式 CLI 互換性のため受理だけする
const argv = process.argv.slice(2)
const flags = {
  prompt: '',
  outputFormat: '',
  verbose: false,
  allowedTools: '',
  permissionMode: '',
  resume: '',
  appendSystemPrompt: '',
  unknownArgs: /** @type {string[]} */ ([]),
}
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  switch (a) {
    case '-p':
    case '--print':
      flags.prompt = argv[++i] ?? ''
      break
    case '--output-format':
      flags.outputFormat = argv[++i] ?? ''
      break
    case '--verbose':
      flags.verbose = true
      break
    case '--allowedTools':
      flags.allowedTools = argv[++i] ?? ''
      break
    case '--permission-mode':
      flags.permissionMode = argv[++i] ?? ''
      break
    case '--resume':
      flags.resume = argv[++i] ?? ''
      break
    case '--append-system-prompt':
      flags.appendSystemPrompt = argv[++i] ?? ''
      break
    case '--version':
      // 公式 CLI 互換: バージョンを返して exit 0
      process.stdout.write('mock-claude 0.1.0\n')
      process.exit(0)
      break
    default:
      if (a !== undefined) flags.unknownArgs.push(a)
  }
}

/** Write a single NDJSON line to stdout (newline-terminated). */
function emit(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n')
}

/** Sleep helper. */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * 共通の system init メッセージ (公式 stream-json 形式に近づける)。
 */
function emitSystemInit() {
  emit({
    type: 'system',
    subtype: 'init',
    session_id: flags.resume || `mock-${Date.now().toString(36)}`,
    cwd: process.cwd(),
    tools: flags.allowedTools ? flags.allowedTools.split(',') : [],
    permission_mode: flags.permissionMode || 'default',
    mock: true,
    scenario: SCENARIO,
  })
}

/**
 * 公式 stream-json で観測される assistant_message + usage の最低例。
 */
function emitAssistantMessage(text = 'mock response') {
  emit({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [{ type: 'text', text }],
    },
    usage: {
      input_tokens: 12,
      output_tokens: 7,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    },
  })
}

/**
 * tool_use の例 (一部シナリオで使用)。
 */
function emitToolUse(name = 'Read') {
  emit({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: 'tool_mock_001',
          name,
          input: { path: '/tmp/example' },
        },
      ],
    },
  })
}

/**
 * 公式 stream-json で最後に来る result message (cost 含む)。
 */
function emitResult({ isError = false, cost = 0.001 } = {}) {
  emit({
    type: 'result',
    is_error: isError,
    total_cost_usd: cost,
    duration_ms: 100,
    duration_api_ms: 80,
    num_turns: 1,
  })
}

async function main() {
  switch (SCENARIO) {
    case 'success': {
      emitSystemInit()
      emitToolUse('Read')
      emitAssistantMessage('all good')
      emitResult({ isError: false, cost: 0.001 })
      process.exit(0)
      break
    }
    case 'auth_failed': {
      // 公式 CLI が未ログイン時に出すメッセージを模倣。
      // spawn.ts の detectErrorType regex (/401|403|unauthorized|forbidden|sign in|please log in|not authenticated/i)
      // にヒットさせるため "Please log in" を含める。
      process.stderr.write('Error: missing credential. not authenticated.\n')
      process.stderr.write('Please log in via `claude login` first.\n')
      process.exit(1)
      break
    }
    case 'rate_limit_429': {
      // exit 0 だが stream-json に 429 エラーが乗るケース (公式でも観測される)
      emitSystemInit()
      // assistant の代わりに error メッセージ (公式 schema は緩いので passthrough で受理される)
      emit({
        type: 'system',
        subtype: 'error',
        error: {
          type: 'rate_limit',
          status: 429,
          message: '429 Too Many Requests: rate limit exceeded',
        },
      })
      emitResult({ isError: true, cost: 0 })
      // claude-bridge 側で stderr に 429 が無くても error.type=rate_limited を判定できるよう、
      // stderr にも 429 を吐いておく (defense in depth)
      process.stderr.write('429 too many requests\n')
      process.exit(0)
      break
    }
    case 'silent_revoke': {
      // OAuth セッションが裏で revoke された状態。本ケースは exit 1 + 401 Unauthorized
      process.stderr.write('401 Unauthorized\n')
      process.stderr.write('Session token has been revoked. Please re-authenticate.\n')
      process.exit(1)
      break
    }
    case 'slow': {
      // 5 秒スリープして success と同じものを返す (claude-bridge の timeoutMs テスト用)
      await sleep(5000)
      emitSystemInit()
      emitAssistantMessage('slow but ok')
      emitResult({ isError: false, cost: 0.001 })
      process.exit(0)
      break
    }
    default: {
      process.stderr.write(`mock-claude: unknown scenario "${SCENARIO}"\n`)
      process.exit(2)
    }
  }
}

main().catch((err) => {
  process.stderr.write(`mock-claude: fatal error: ${err && err.message ? err.message : String(err)}\n`)
  process.exit(127)
})
