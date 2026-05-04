/**
 * denylist-loader-failfast.test — Round 14 Dev-A:
 *   YAML loader fail-fast 改修 (assertDenylistIntegrity + DenylistLoaderError +
 *   loadDenylistOrExit + zod strict 化) の単体テスト 18 件。
 *
 * カバー:
 *   1. malformed YAML → DenylistLoaderError throw
 *   2. file not found → DenylistLoaderError throw
 *   3. zod 違反 (version 欠落) → DenylistLoaderError throw + 詳細 issue 含む
 *   4. zod 違反 (未知 tier label) → DenylistLoaderError throw
 *   5. zod 違反 (空 keywords 配列) → DenylistLoaderError throw
 *   6. zod 違反 (空 string keyword) → DenylistLoaderError throw
 *   7. integrity: active tier 内重複 → DenylistLoaderError throw
 *   8. integrity: active tier 跨ぎ重複 → DenylistLoaderError throw
 *   9. integrity: active + backlog dual placement は許容 (throw しない)
 *  10. integrity: 異 domain 同 keyword は許容
 *  11. assertDenylistIntegrity 単体: 正常 table → throw なし
 *  12. assertDenylistIntegrity 単体: 重複 table → throw
 *  13. DenylistLoaderError は Error 派生
 *  14. DenylistLoaderError の name === 'DenylistLoaderError'
 *  15. DenylistLoaderError は cause を保持
 *  16. 本番 YAML (config/denylist.yaml) は assertDenylistIntegrity 通過
 *  17. test override で正常 YAML を読める
 *  18. zod 違反時 message に issue path が含まれる
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  loadDenylist,
  loadDenylistFullTable,
  assertDenylistIntegrity,
  DenylistLoaderError,
  _resetDenylistCacheForTesting,
  type DenylistFullTable,
} from '../denylist-loader.js'

beforeEach(() => {
  _resetDenylistCacheForTesting()
})

function writeTmpYaml(name: string, content: string): string {
  const dir = join(tmpdir(), `denylist-failfast-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  const path = join(dir, name)
  writeFileSync(path, content, 'utf8')
  return path
}

describe('denylist-loader fail-fast (Round 14 Dev-A)', () => {
  // ----------------- malformed YAML -----------------
  describe('malformed YAML / file IO', () => {
    it('1. parse 不能 YAML → DenylistLoaderError throw', () => {
      // ': ' を含まない non-comment 行 = parser が key: 期待で throw
      const path = writeTmpYaml(
        'malformed.yaml',
        `version: 1
domains:
  legal:
    bogus_line_without_colon
`,
      )
      expect(() => loadDenylist(path)).toThrow(DenylistLoaderError)
      expect(() => loadDenylist(path)).toThrow(/malformed YAML/)
    })

    it('2. 存在しない file → DenylistLoaderError throw', () => {
      const missing = join(tmpdir(), `denylist-not-exists-${Date.now()}.yaml`)
      expect(() => loadDenylist(missing)).toThrow(DenylistLoaderError)
      expect(() => loadDenylist(missing)).toThrow(/failed to read/)
    })
  })

  // ----------------- zod 違反 -----------------
  describe('zod schema violations', () => {
    it('3. version 欠落 → DenylistLoaderError + schema violation message', () => {
      const path = writeTmpYaml(
        'no-version.yaml',
        `domains:
  legal:
    baseline:
      enabled: true
      keywords:
        - foo
`,
      )
      expect(() => loadDenylist(path)).toThrow(DenylistLoaderError)
      expect(() => loadDenylist(path)).toThrow(/schema violation/)
    })

    it('4. 未知 tier label → DenylistLoaderError throw (strict 化)', () => {
      const path = writeTmpYaml(
        'unknown-tier.yaml',
        `version: 1
domains:
  legal:
    nightmare:
      enabled: true
      keywords:
        - foo
`,
      )
      expect(() => loadDenylist(path)).toThrow(DenylistLoaderError)
    })

    it('5. 空 keywords 配列 → DenylistLoaderError throw', () => {
      // YAML で空配列を表現するため keywords だけ書いて中身なしにする
      const path = writeTmpYaml(
        'empty-keywords.yaml',
        `version: 1
domains:
  legal:
    baseline:
      enabled: true
      keywords:
        -
`,
      )
      // parser が `- ` の後を null と解釈、zod 配列に null は通らない
      expect(() => loadDenylist(path)).toThrow(DenylistLoaderError)
    })

    it('6. 空文字 keyword → DenylistLoaderError throw', () => {
      const path = writeTmpYaml(
        'empty-keyword.yaml',
        `version: 1
domains:
  legal:
    baseline:
      enabled: true
      keywords:
        - ""
`,
      )
      expect(() => loadDenylist(path)).toThrow(DenylistLoaderError)
    })

    it('18. zod 違反 message には issue path が含まれる', () => {
      const path = writeTmpYaml(
        'bad-version.yaml',
        `domains:
  legal:
    baseline:
      enabled: true
      keywords:
        - foo
`,
      )
      try {
        loadDenylist(path)
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(DenylistLoaderError)
        // version 欠落の path は <root> または version
        expect((err as Error).message).toMatch(/version|<root>/)
      }
    })
  })

  // ----------------- integrity -----------------
  describe('integrity assertion (Round 14)', () => {
    it('7. active tier 内重複 → DenylistLoaderError throw', () => {
      const path = writeTmpYaml(
        'dup-within.yaml',
        `version: 1
domains:
  legal:
    baseline:
      enabled: true
      keywords:
        - duplicated_kw
        - other
        - duplicated_kw
`,
      )
      expect(() => loadDenylist(path)).toThrow(DenylistLoaderError)
      expect(() => loadDenylist(path)).toThrow(/duplicate keyword/)
    })

    it('8. active tier 跨ぎ重複 → DenylistLoaderError throw (tier-move oversight)', () => {
      const path = writeTmpYaml(
        'dup-across.yaml',
        `version: 1
domains:
  legal:
    baseline:
      enabled: true
      keywords:
        - shared_kw
    major:
      enabled: true
      keywords:
        - shared_kw
`,
      )
      expect(() => loadDenylist(path)).toThrow(DenylistLoaderError)
      expect(() => loadDenylist(path)).toThrow(/multiple active tiers/)
    })

    it('9. active + backlog dual placement は許容 (throw しない)', () => {
      const path = writeTmpYaml(
        'dual-active-backlog.yaml',
        `version: 1
domains:
  legal:
    minor:
      enabled: true
      keywords:
        - same_kw
    backlog:
      enabled: false
      keywords:
        - same_kw
`,
      )
      expect(() => loadDenylist(path)).not.toThrow()
      const result = loadDenylist(path)
      expect(result.legal).toContain('same_kw')
      // dedup 確認: backlog 同名は runtime 1 件のみ
      const count = (result.legal ?? []).filter((k) => k === 'same_kw').length
      expect(count).toBe(1)
    })

    it('10. 異 domain 同 keyword は許容', () => {
      const path = writeTmpYaml(
        'cross-domain-shared.yaml',
        `version: 1
domains:
  legal:
    baseline:
      enabled: true
      keywords:
        - mortgage
  finance:
    baseline:
      enabled: true
      keywords:
        - mortgage
`,
      )
      expect(() => loadDenylist(path)).not.toThrow()
      const result = loadDenylist(path)
      expect(result.legal).toContain('mortgage')
      expect(result.finance).toContain('mortgage')
    })

    it('11. assertDenylistIntegrity 単体: 正常 table → throw なし', () => {
      const table: DenylistFullTable = Object.freeze({
        legal: Object.freeze({
          baseline: Object.freeze({
            enabled: true,
            keywords: Object.freeze(['foo', 'bar']),
          }),
        }),
      })
      expect(() => assertDenylistIntegrity(table)).not.toThrow()
    })

    it('12. assertDenylistIntegrity 単体: tier 内重複 table → throw', () => {
      const table: DenylistFullTable = Object.freeze({
        legal: Object.freeze({
          baseline: Object.freeze({
            enabled: true,
            keywords: Object.freeze(['foo', 'foo']),
          }),
        }),
      })
      expect(() => assertDenylistIntegrity(table)).toThrow(DenylistLoaderError)
    })
  })

  // ----------------- DenylistLoaderError -----------------
  describe('DenylistLoaderError class', () => {
    it('13. Error 派生', () => {
      const err = new DenylistLoaderError('test')
      expect(err).toBeInstanceOf(Error)
      expect(err).toBeInstanceOf(DenylistLoaderError)
    })

    it('14. name === DenylistLoaderError', () => {
      const err = new DenylistLoaderError('test')
      expect(err.name).toBe('DenylistLoaderError')
    })

    it('15. cause を保持', () => {
      const inner = new Error('inner')
      const err = new DenylistLoaderError('outer', { cause: inner })
      expect(err.cause).toBe(inner)
    })
  })

  // ----------------- 本番 YAML 統合 -----------------
  describe('本番 YAML 整合性', () => {
    it('16. 本番 config/denylist.yaml は loadDenylist で例外なし', () => {
      // production YAML を default path で load
      expect(() => loadDenylist()).not.toThrow()
      expect(() => loadDenylistFullTable()).not.toThrow()
    })

    it('17. test override で正常 YAML を読める', () => {
      const path = writeTmpYaml(
        'happy.yaml',
        `version: 1
domains:
  custom:
    baseline:
      enabled: true
      keywords:
        - alpha
        - beta
`,
      )
      const result = loadDenylist(path)
      expect(result.custom).toEqual(['alpha', 'beta'])
    })
  })
})
