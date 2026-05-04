/**
 * mock-claude scenario-smoke
 *
 * Review ペネトレシナリオ B5 / B6 の検証用 mock-claude スタブを、claude-bridge spawn.ts から
 * 実 spawn でローンチして 5 シナリオ × 1 ケース = 5 ケースの基本動作を確認する。
 *
 * 関連必須コントロール:
 *   G-V2-03 (起動元偽装/OAuth 直 spawn 全面禁止)
 *   G-V2-08 (401/403/429 連続検知)
 *   G-V2-11 (緊急停止 + OAuth トークン到達禁止)
 *
 * Note:
 *   - vitest workspace 設定の include 規則で本ファイルもピックアップされる
 *   - live integration test の除外パターン (`**\/integration/**\/*-live.test.ts`) には引っかからない
 *   - 実 Claude CLI は呼ばないので課金ゼロ (`MOCK_CLAUDE_PATH` で mock-claude.mjs を指す)
 */
import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { ClaudeBridge } from '@clawbridge/claude-bridge'
import { CircuitBreaker } from '@clawbridge/harness'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MOCK_CLAUDE_PATH = join(__dirname, '..', 'bin', 'mock-claude.mjs')
const NODE = process.execPath

function quoteIfWin(s: string): string {
  return process.platform === 'win32' ? `"${s}"` : s
}

function buildCommand(): string {
  // shell:true で起動するので `node <path>` 形式
  return `${quoteIfWin(NODE)} ${quoteIfWin(MOCK_CLAUDE_PATH)}`
}

function makeBridge(failureThreshold = 10): ClaudeBridge {
  return new ClaudeBridge({
    command: buildCommand(),
    skipAuthCheck: true,
    // テスト独立性のため毎回新規 circuit-breaker
    circuitBreaker: new CircuitBreaker({ name: 'scenario-smoke', failureThreshold }),
  })
}

describe('mock-claude scenario-smoke', () => {
  it('scenario=success returns ok with usage and cost', async () => {
    const bridge = makeBridge()
    const r = await bridge.executeTask('hello', {
      extraEnv: { MOCK_CLAUDE_SCENARIO: 'success' },
    })
    expect(r.success).toBe(true)
    expect(r.exitCode).toBe(0)
    expect(r.error).toBeUndefined()
    // system + tool_use + assistant + result = 4 messages
    expect(r.messages.length).toBeGreaterThanOrEqual(3)
    const types = r.messages.map((m) => m.type)
    expect(types).toContain('system')
    expect(types).toContain('result')
    // usage が assistant に乗っているので extractUsage 経由で input/output が見える
    expect(r.tokenUsage.input).toBeGreaterThan(0)
    expect(r.tokenUsage.output).toBeGreaterThan(0)
    expect(r.costEstimate).toBeGreaterThan(0)
  })

  it('scenario=auth_failed produces auth_failed error type', async () => {
    const bridge = makeBridge()
    const r = await bridge.executeTask('test', {
      extraEnv: { MOCK_CLAUDE_SCENARIO: 'auth_failed' },
    })
    expect(r.success).toBe(false)
    // stderr に "credential" / "log in" が含まれる → auth_failed 分類
    expect(r.error?.type).toBe('auth_failed')
    expect(r.exitCode).not.toBe(0)
  })

  it('scenario=silent_revoke produces auth_failed via 401 stderr', async () => {
    const bridge = makeBridge()
    const r = await bridge.executeTask('test', {
      extraEnv: { MOCK_CLAUDE_SCENARIO: 'silent_revoke' },
    })
    expect(r.success).toBe(false)
    expect(r.error?.type).toBe('auth_failed')
    expect(r.stderr.toLowerCase()).toContain('401')
  })

  it('scenario=rate_limit_429 yields stream-json error message and stderr 429', async () => {
    const bridge = makeBridge()
    const r = await bridge.executeTask('test', {
      extraEnv: { MOCK_CLAUDE_SCENARIO: 'rate_limit_429' },
    })
    // 現行 spawn.ts: exit 0 → success: true で帰ってくる。
    // ただし stream-json に 429 エラーが乗っており、stderr にも 429 が含まれる。
    expect(r.exitCode).toBe(0)
    expect(r.success).toBe(true)
    expect(r.stderr).toMatch(/429/)
    // stream-json の error メッセージが messages 配列に観測される
    const errMsg = r.messages.find(
      (m) =>
        m.type === 'system' &&
        (m as unknown as { subtype?: string }).subtype === 'error',
    )
    expect(errMsg).toBeDefined()
  })

  it('scenario=slow times out when timeoutMs < 5000', async () => {
    const bridge = makeBridge()
    const r = await bridge.executeTask('test', {
      timeoutMs: 1000,
      extraEnv: { MOCK_CLAUDE_SCENARIO: 'slow' },
    })
    expect(r.success).toBe(false)
    expect(['timeout', 'unknown', 'spawn_failed']).toContain(r.error?.type)
  }, 30_000)
})
