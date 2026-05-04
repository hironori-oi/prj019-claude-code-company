/**
 * critical-denylist-failfast.test — Round 15 Dev-K (K-1):
 *   critical-domain-filter.ts 側に追加した起動 fail-fast 経路の単体テスト 8 件。
 *
 * Round 14 Dev-A 時点で `denylist-loader.ts` 側の DenylistLoaderError + assertDenylistIntegrity
 * は既に実装済 (denylist-loader-failfast.test.ts §1-18 で網羅)。
 * 本 Round 15 では critical-domain-filter.ts の **module-load 時 legacy fallback 採用検出**
 * 経路を fail-fast に統合する API (`assertCriticalDenylistReady` / `getDenylistLoadStatus` /
 * `enforceStrictDenylistFromEnv`) を被覆する。
 *
 * カバー (8 件):
 *   1. getDenylistLoadStatus 既定 = 'yaml' (本番 YAML 正常 load 経路)
 *   2. assertCriticalDenylistReady 正常時 = throw なし
 *   3. _setCriticalDenylistLoadStatusForTesting で 'legacy_fallback' 状態にすると
 *      assertCriticalDenylistReady が DenylistLoaderError throw
 *   4. throw された error message にどの YAML / 何が問題か (failureReason) が含まれる
 *   5. throw された error は DenylistLoaderError instance で識別可能
 *   6. _resetCriticalDenylistLoadStatusForTesting で正常状態に戻る
 *   7. enforceStrictDenylistFromEnv は env 未設定なら throw しない
 *   8. enforceStrictDenylistFromEnv は env=1 + legacy_fallback 状態で throw する
 *
 * 関連:
 *   - DEC-019-010 (重要 13 領域 fail-safe denylist)
 *   - dev-round14-A 引継 (denylist-loader-failfast 完遂、本 Round で critical-domain 経路統合)
 *   - dev-round13-A §8.2 #1 (YAML loader fail-fast 化、Round 14-15 で 2 段階完遂)
 */
import { afterEach, describe, it, expect } from 'vitest'

import {
  assertCriticalDenylistReady,
  enforceStrictDenylistFromEnv,
  getDenylistLoadStatus,
  _setCriticalDenylistLoadStatusForTesting,
  _resetCriticalDenylistLoadStatusForTesting,
} from '../critical-domain-filter.js'
import { DenylistLoaderError } from '../denylist-loader.js'

afterEach(() => {
  // 各 test 後に必ず正常状態に戻して module-level state の汚染を防ぐ
  _resetCriticalDenylistLoadStatusForTesting()
  delete process.env.NEEDS_SCOUT_STRICT_DENYLIST
})

describe('critical-denylist fail-fast (Round 15 Dev-K K-1)', () => {
  it('1. getDenylistLoadStatus 既定 = source: "yaml"', () => {
    const status = getDenylistLoadStatus()
    expect(status.source).toBe('yaml')
    expect(status.failureReason).toBeNull()
    // Object.freeze 確認 (mutation 不可)
    expect(Object.isFrozen(status)).toBe(true)
  })

  it('2. assertCriticalDenylistReady 正常時は throw しない', () => {
    expect(() => assertCriticalDenylistReady()).not.toThrow()
  })

  it('3. legacy_fallback 状態で assertCriticalDenylistReady は DenylistLoaderError throw', () => {
    _setCriticalDenylistLoadStatusForTesting({
      source: 'legacy_fallback',
      failureReason:
        'DenylistLoaderError: failed to read denylist YAML at \'/tmp/missing.yaml\': ENOENT',
      attemptedPath: null,
    })
    expect(() => assertCriticalDenylistReady()).toThrow(DenylistLoaderError)
  })

  it('4. throw error message に failureReason + 対処指示が含まれる (どの YAML / 何が問題か)', () => {
    _setCriticalDenylistLoadStatusForTesting({
      source: 'legacy_fallback',
      failureReason:
        "DenylistLoaderError: malformed YAML at 'config/denylist.yaml': expected key:",
      attemptedPath: null,
    })
    try {
      assertCriticalDenylistReady()
      throw new Error('should have thrown')
    } catch (err) {
      const e = err as Error
      expect(e).toBeInstanceOf(DenylistLoaderError)
      // どの YAML / 何が問題か を message に含むこと (タスク要件)
      expect(e.message).toMatch(/YAML denylist not loaded/)
      expect(e.message).toMatch(/legacy fallback/)
      expect(e.message).toMatch(/malformed YAML/)
      expect(e.message).toMatch(/lint:denylist/)
    }
  })

  it('5. throw error は DenylistLoaderError 派生 (caller は型で識別可能)', () => {
    _setCriticalDenylistLoadStatusForTesting({
      source: 'legacy_fallback',
      failureReason: 'unknown',
      attemptedPath: null,
    })
    expect(() => assertCriticalDenylistReady()).toThrow(DenylistLoaderError)
    try {
      assertCriticalDenylistReady()
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      expect(err).toBeInstanceOf(DenylistLoaderError)
      expect((err as DenylistLoaderError).name).toBe('DenylistLoaderError')
    }
  })

  it('6. _reset で 正常状態に戻り throw しなくなる', () => {
    _setCriticalDenylistLoadStatusForTesting({
      source: 'legacy_fallback',
      failureReason: 'simulated failure',
      attemptedPath: null,
    })
    expect(() => assertCriticalDenylistReady()).toThrow()
    _resetCriticalDenylistLoadStatusForTesting()
    expect(() => assertCriticalDenylistReady()).not.toThrow()
    expect(getDenylistLoadStatus().source).toBe('yaml')
  })

  it('7. enforceStrictDenylistFromEnv は env 未設定なら throw しない (default no-op)', () => {
    delete process.env.NEEDS_SCOUT_STRICT_DENYLIST
    _setCriticalDenylistLoadStatusForTesting({
      source: 'legacy_fallback',
      failureReason: 'simulated failure',
      attemptedPath: null,
    })
    // env 未設定 = strict 不要 = throw しない (production opt-in 設計)
    expect(() => enforceStrictDenylistFromEnv()).not.toThrow()
  })

  it('8. enforceStrictDenylistFromEnv は env=1 + legacy_fallback で DenylistLoaderError throw', () => {
    process.env.NEEDS_SCOUT_STRICT_DENYLIST = '1'
    _setCriticalDenylistLoadStatusForTesting({
      source: 'legacy_fallback',
      failureReason: 'simulated YAML missing',
      attemptedPath: null,
    })
    expect(() => enforceStrictDenylistFromEnv()).toThrow(DenylistLoaderError)
    expect(() => enforceStrictDenylistFromEnv()).toThrow(/legacy fallback/)

    // env='true' 文字列でも有効化される
    process.env.NEEDS_SCOUT_STRICT_DENYLIST = 'true'
    expect(() => enforceStrictDenylistFromEnv()).toThrow(DenylistLoaderError)

    // env=正常状態なら throw しない
    _resetCriticalDenylistLoadStatusForTesting()
    expect(() => enforceStrictDenylistFromEnv()).not.toThrow()
  })
})
