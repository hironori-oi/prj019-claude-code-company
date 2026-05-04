/**
 * denylist-loader.test — Round 12 Dev-A:
 *   YAML config → 構造検証 → tier 分類 → enabled filter → Object.freeze の loader 単体テスト。
 *
 * カバー (10 件):
 *   1. parseRestrictedYaml — block style mapping + sequence
 *   2. parseRestrictedYaml — boolean / number / quoted string
 *   3. loadDenylist — 13 領域全件存在
 *   4. loadDenylist — Object.freeze で immutable
 *   5. loadDenylist — runtime export は重複除外済 (minor + backlog dual placement の dedup)
 *   6. loadDenylistFullTable — backlog tier の enabled: false 確認
 *   7. enabled filter — backlog tier keyword は runtime に出ない
 *   8. enabled filter — minor tier keyword は runtime に出る (back-compat)
 *   9. test override path — 別 YAML を読める (cache bypass)
 *  10. _resetDenylistCacheForTesting — cache クリア
 *  11. zod 検証 — version 必須
 *  12. parseRestrictedYaml — comment / 空行 skip
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  parseRestrictedYaml,
  loadDenylist,
  loadDenylistFullTable,
  loadDomainKeys,
  _resetDenylistCacheForTesting,
} from '../denylist-loader.js'

const EXPECTED_DOMAIN_KEYS = [
  'critical_infrastructure',
  'education',
  'housing',
  'employment',
  'finance',
  'insurance',
  'legal',
  'medical',
  'government',
  'product_safety',
  'national_security',
  'immigration',
  'law_enforcement',
]

beforeEach(() => {
  _resetDenylistCacheForTesting()
})

describe('denylist-loader (Round 12 Dev-A — CB-D-W3-01 完遂)', () => {
  // ----------------- parseRestrictedYaml -----------------
  describe('parseRestrictedYaml', () => {
    it('1. block style mapping + sequence を正しく parse', () => {
      const yaml = `
domains:
  foo:
    keywords:
      - alpha
      - beta
`
      const parsed = parseRestrictedYaml(yaml) as {
        domains: { foo: { keywords: string[] } }
      }
      expect(parsed.domains.foo.keywords).toEqual(['alpha', 'beta'])
    })

    it('2. boolean / number / quoted string を正しく型解釈', () => {
      const yaml = `
enabled: true
disabled: false
count: 42
name: "hello world"
`
      const parsed = parseRestrictedYaml(yaml) as {
        enabled: unknown
        disabled: unknown
        count: unknown
        name: unknown
      }
      expect(parsed.enabled).toBe(true)
      expect(parsed.disabled).toBe(false)
      expect(parsed.count).toBe(42)
      expect(parsed.name).toBe('hello world')
    })

    it('12. comment / 空行は skip', () => {
      const yaml = `
# top comment
version: 1

# another comment
domains:
  foo:
    enabled: true
`
      const parsed = parseRestrictedYaml(yaml) as {
        version: number
        domains: { foo: { enabled: boolean } }
      }
      expect(parsed.version).toBe(1)
      expect(parsed.domains.foo.enabled).toBe(true)
    })
  })

  // ----------------- loadDenylist (本番 YAML) -----------------
  describe('loadDenylist', () => {
    it('3. 13 領域全件存在', () => {
      const denylist = loadDenylist()
      const keys = Object.keys(denylist).sort()
      expect(keys).toEqual([...EXPECTED_DOMAIN_KEYS].sort())
    })

    it('4. Object.freeze で immutable (table + 各領域配列)', () => {
      const denylist = loadDenylist()
      expect(Object.isFrozen(denylist)).toBe(true)
      for (const key of Object.keys(denylist)) {
        const arr = denylist[key]!
        expect(Object.isFrozen(arr)).toBe(true)
      }
    })

    it('5. runtime export は重複除外済 (minor + backlog dual placement の dedup)', () => {
      const denylist = loadDenylist()
      // critical_infrastructure には minor + backlog で同じ keyword が登場するが、
      // backlog は enabled: false なので runtime には minor の 1 つしか出ない。
      const ci = denylist.critical_infrastructure!
      const haisuiCount = ci.filter((k) => k === '廃棄物処理制御').length
      expect(haisuiCount).toBe(1)
    })

    it('8. enabled filter — minor tier keyword は runtime に出る (back-compat)', () => {
      const denylist = loadDenylist()
      // Round 11 で追加された minor 14 件のうち代表 3 件をサンプル確認
      expect(denylist.critical_infrastructure).toContain('廃棄物処理制御')
      expect(denylist.education).toContain('学習進捗評価')
      expect(denylist.product_safety).toContain('iso 9001 判定')
    })

    it('loadDomainKeys — 13 領域 key 配列を返す', () => {
      const keys = loadDomainKeys()
      expect(keys).toHaveLength(13)
    })
  })

  // ----------------- loadDenylistFullTable -----------------
  describe('loadDenylistFullTable', () => {
    it('6. backlog tier の enabled: false が記録されている', () => {
      const table = loadDenylistFullTable()
      const ci = table.critical_infrastructure
      expect(ci).toBeDefined()
      // critical_infrastructure には backlog tier が存在し、enabled: false
      expect(ci?.backlog).toBeDefined()
      expect(ci?.backlog?.enabled).toBe(false)
      expect(ci?.backlog?.keywords).toContain('廃棄物処理制御')
    })

    it('7. enabled filter — backlog tier だけの keyword は runtime に出ない', () => {
      // 後の test override で確認するため、ここでは backlog tier 限定の架空 keyword を含む
      // 一時 YAML を作って検証する (本番 YAML には backlog のみ keyword が無いため)。
      const yaml = `
version: 1
domains:
  test_domain:
    minor:
      enabled: true
      keywords:
        - active_kw
    backlog:
      enabled: false
      keywords:
        - inactive_kw
`
      const tmpDir = join(tmpdir(), `denylist-loader-test-${Date.now()}`)
      mkdirSync(tmpDir, { recursive: true })
      const tmpPath = join(tmpDir, 'denylist.yaml')
      writeFileSync(tmpPath, yaml, 'utf8')

      const denylist = loadDenylist(tmpPath)
      expect(denylist.test_domain).toContain('active_kw')
      expect(denylist.test_domain).not.toContain('inactive_kw')
    })
  })

  // ----------------- test override path -----------------
  describe('test override path', () => {
    it('9. 別 YAML を読める (cache bypass)', () => {
      const yaml = `
version: 1
domains:
  custom:
    baseline:
      enabled: true
      keywords:
        - foo
        - bar
`
      const tmpDir = join(tmpdir(), `denylist-loader-test-${Date.now()}-2`)
      mkdirSync(tmpDir, { recursive: true })
      const tmpPath = join(tmpDir, 'custom.yaml')
      writeFileSync(tmpPath, yaml, 'utf8')

      const denylist = loadDenylist(tmpPath)
      expect(Object.keys(denylist)).toEqual(['custom'])
      expect(denylist.custom).toEqual(['foo', 'bar'])
    })

    it('10. _resetDenylistCacheForTesting — cache クリア', () => {
      // 1 回 load → cache 生成
      loadDenylist()
      // reset
      _resetDenylistCacheForTesting()
      // 再 load (cache miss でも 13 領域揃う)
      const second = loadDenylist()
      expect(Object.keys(second).sort()).toEqual([...EXPECTED_DOMAIN_KEYS].sort())
    })

    it('11. zod 検証 — version 必須 (欠落時 throw)', () => {
      const yaml = `
domains:
  custom:
    baseline:
      enabled: true
      keywords:
        - foo
`
      const tmpDir = join(tmpdir(), `denylist-loader-test-${Date.now()}-3`)
      mkdirSync(tmpDir, { recursive: true })
      const tmpPath = join(tmpDir, 'no-version.yaml')
      writeFileSync(tmpPath, yaml, 'utf8')

      expect(() => loadDenylist(tmpPath)).toThrow()
    })
  })
})
