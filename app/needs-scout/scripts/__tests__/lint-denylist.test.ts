/**
 * lint-denylist.test — Round 14 Dev-A:
 *   denylist 専用 lint script の単体テスト 5 件。
 *
 * カバー:
 *   1. 本番 YAML は ok=true で通過
 *   2. 13 領域 key 全件報告
 *   3. stats に active / backlog の内訳が含まれる
 *   4. warnings は配列 (現状 production YAML では空 or backlog 規約警告のみ)
 *   5. errors は配列で initial empty
 */

// LINT_DENYLIST_NO_AUTORUN=1 で main() 自動実行を抑止
process.env.LINT_DENYLIST_NO_AUTORUN = '1'

import { describe, it, expect, beforeEach } from 'vitest'
import { runLint } from '../lint-denylist.js'
import { _resetDenylistCacheForTesting } from '../../src/filters/denylist-loader.js'

beforeEach(() => {
  _resetDenylistCacheForTesting()
})

describe('lint-denylist (Round 14 Dev-A)', () => {
  it('1. 本番 denylist.yaml は ok=true', () => {
    const r = runLint()
    expect(r.ok).toBe(true)
    expect(r.errors).toHaveLength(0)
  })

  it('2. 13 領域すべて検出される (domainCount=13)', () => {
    const r = runLint()
    expect(r.stats.domainCount).toBe(13)
  })

  it('3. stats に active / backlog の内訳が含まれる', () => {
    const r = runLint()
    expect(r.stats.activeKeywords).toBeGreaterThan(0)
    expect(r.stats.totalKeywords).toBe(
      r.stats.activeKeywords + r.stats.backlogKeywords,
    )
  })

  it('4. warnings は配列', () => {
    const r = runLint()
    expect(Array.isArray(r.warnings)).toBe(true)
  })

  it('5. errors は配列 (production YAML では空)', () => {
    const r = runLint()
    expect(Array.isArray(r.errors)).toBe(true)
    expect(r.errors).toHaveLength(0)
  })
})
