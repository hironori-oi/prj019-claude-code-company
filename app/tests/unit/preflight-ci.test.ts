/**
 * preflight-ci.test — Round 6 G-08 CI mode の単体テスト。
 *
 * 関連:
 *   - DEC-019-053 (2-tier 設計 / Tier 1 op:// 解決検証)
 *   - 議決-25 採択前提 Phase 1 W1 ハードガード前倒し
 *
 * カバー範囲:
 *   1. isCiMode flag parser
 *   2. checkTier1: 9 fields 全 resolved 時の挙動
 *   3. buildSummary: unresolved 検出時の pendingRcs 集計
 */
import { describe, it, expect } from 'vitest'
import {
  isCiMode,
  checkTier1,
  buildSummary,
  TIER1_FIELDS,
  WORKFLOW_SCOPE_FIELDS,
  classify,
  parseScope,
  fieldsForScope,
} from '../../scripts/preflight-env.js'

describe('G-08: isCiMode flag parser', () => {
  it('--ci が渡されたら true を返す', () => {
    expect(isCiMode(['--ci'])).toBe(true)
    expect(isCiMode(['foo', '--ci'])).toBe(true)
  })
  it('--ci が無ければ false を返す', () => {
    expect(isCiMode([])).toBe(false)
    expect(isCiMode(['--dev'])).toBe(false)
  })
})

describe('G-08: checkTier1 9 fields validation', () => {
  it('TIER1_FIELDS が 9 個 (DEC-019-053 整合)', () => {
    expect(TIER1_FIELDS.length).toBe(9)
  })

  it('全 9 fields に値が入っていれば全 resolved になる', () => {
    const env: Record<string, string | undefined> = {}
    for (const f of TIER1_FIELDS) {
      env[f.envVar] = `value-${f.envVar.toLowerCase()}-real`
    }
    const results = checkTier1(env)
    expect(results.every((r) => r.status === 'resolved')).toBe(true)
    const s = buildSummary(results)
    expect(s.resolved).toBe(9)
    expect(s.unresolved).toBe(0)
    expect(s.missing).toBe(0)
  })

  it('op:// literal は unresolved として分類される', () => {
    const env: Record<string, string | undefined> = {}
    for (const f of TIER1_FIELDS) {
      env[f.envVar] = f.vaultPath // op://... のまま
    }
    const results = checkTier1(env)
    expect(results.every((r) => r.status === 'unresolved')).toBe(true)
    const s = buildSummary(results)
    expect(s.unresolved).toBe(9)
    // 全 RC が pendingRcs に含まれる
    expect(s.pendingRcs.length).toBeGreaterThan(0)
  })

  it('classify: 空文字 / undefined は missing', () => {
    expect(classify(undefined).status).toBe('missing')
    expect(classify('').status).toBe('missing')
  })

  it('classify: op:// literal は unresolved', () => {
    const c = classify('op://prj019/foo/bar')
    expect(c.status).toBe('unresolved')
    expect(c.unresolvedPath).toBe('op://prj019/foo/bar')
  })

  it('classify: 通常値は resolved (length 表示のみ)', () => {
    const c = classify('https://hooks.slack.com/services/xxx/yyy')
    expect(c.status).toBe('resolved')
    expect(c.length).toBeGreaterThan(0)
  })
})

describe('G-08 hotfix: parseScope + fieldsForScope (DEC-019-053 v15.2 整合)', () => {
  it('--scope=workflow が渡されたら workflow scope を返す', () => {
    expect(parseScope(['--scope=workflow'])).toBe('workflow')
    expect(parseScope(['--ci', '--scope=workflow'])).toBe('workflow')
  })

  it('--scope=all 明示も all を返す', () => {
    expect(parseScope(['--scope=all'])).toBe('all')
  })

  it('scope flag 無し / 不正値は all (default)', () => {
    expect(parseScope([])).toBe('all')
    expect(parseScope(['--ci'])).toBe('all')
    expect(parseScope(['--scope=garbage'])).toBe('all')
  })

  it('fieldsForScope("all") は 9 fields (Supabase 2 含む)', () => {
    expect(fieldsForScope('all').length).toBe(9)
  })

  it('fieldsForScope("workflow") は 7 fields (Supabase 2 除外)', () => {
    const fields = fieldsForScope('workflow')
    expect(fields.length).toBe(7)
    expect(fields.some((f) => f.envVar === 'SUPABASE_SERVICE_ROLE_KEY')).toBe(false)
    expect(fields.some((f) => f.envVar === 'SUPABASE_DB_URL')).toBe(false)
    expect(WORKFLOW_SCOPE_FIELDS.size).toBe(7)
  })

  it('checkTier1(env, "workflow") は Supabase 未投入でも resolved 全達成可能', () => {
    const env: Record<string, string | undefined> = {
      SLACK_WEBHOOK_HITL: 'https://hooks.slack.com/services/xxx',
      SLACK_WEBHOOK_MONITOR: 'https://hooks.slack.com/services/yyy',
      SLACK_WEBHOOK_DRILL: 'https://hooks.slack.com/services/zzz',
      RESEND_API_KEY: 're_AAAAAAAAA',
      OWNER_NOTIFY_EMAIL: 'owner@example.com',
      DEV_NOTIFY_EMAIL: 'dev@example.com',
      GITHUB_PAT_READ_ONLY: 'ghp_BBBBBBBBB',
      // SUPABASE_* は意図的に未投入 (W3 まで RC-Vault-Supabase 保留)
    }
    const results = checkTier1(env, 'workflow')
    expect(results.length).toBe(7)
    expect(results.every((r) => r.status === 'resolved')).toBe(true)
    const s = buildSummary(results)
    expect(s.resolved).toBe(7)
    expect(s.missing).toBe(0)
  })

  it('checkTier1(env, "all") は Supabase 未投入時に missing 検出', () => {
    const env: Record<string, string | undefined> = {
      SLACK_WEBHOOK_HITL: 'https://hooks.slack.com/services/xxx',
      SLACK_WEBHOOK_MONITOR: 'https://hooks.slack.com/services/yyy',
      SLACK_WEBHOOK_DRILL: 'https://hooks.slack.com/services/zzz',
      RESEND_API_KEY: 're_AAAAAAAAA',
      OWNER_NOTIFY_EMAIL: 'owner@example.com',
      DEV_NOTIFY_EMAIL: 'dev@example.com',
      GITHUB_PAT_READ_ONLY: 'ghp_BBBBBBBBB',
    }
    const results = checkTier1(env, 'all')
    expect(results.length).toBe(9)
    const s = buildSummary(results)
    expect(s.missing).toBe(2)
    expect(s.pendingRcs).toContain('RC-Vault-Supabase')
  })
})
