/**
 * normalization.test — Round 12 Dev-A:
 *   normalization.ts (NFKC 正規化 + token 抽出 + PII redaction + safe coerce)
 *   の 5 関数 × 各 3-5 ケース = 21 件テスト。
 *
 * カバー:
 *   1. normalizeForFilter — NFKC + lowercase + 空白圧縮 (5 cases)
 *   2. extractTokenCandidates — 形態素近似 token 分割 (4 cases)
 *   3. containsCriticalPattern — pure 検査 (3 cases)
 *   4. redactPII — email / 電話 / クレジットカード / IPv4 (5 cases)
 *   5. safeNormalize — null/undefined/非 string 型の safe coerce (4 cases)
 */
import { describe, it, expect } from 'vitest'

import {
  normalizeForFilter,
  extractTokenCandidates,
  containsCriticalPattern,
  redactPII,
  safeNormalize,
} from '../normalization.js'

describe('normalization (Round 12 Dev-A)', () => {
  // ----------------- normalizeForFilter -----------------
  describe('normalizeForFilter', () => {
    it('1.1. 半角 ASCII 大文字を lowercase 化', () => {
      expect(normalizeForFilter('HELLO World')).toBe('hello world')
    })

    it('1.2. 全角英数字を NFKC で半角化 + lowercase', () => {
      expect(normalizeForFilter('ＨＥＬＬＯ１２３')).toBe('hello123')
    })

    it('1.3. 全角空白 (U+3000) を半角 1 つに圧縮', () => {
      expect(normalizeForFilter('弁護士法\u300072\u3000条')).toBe('弁護士法 72 条')
    })

    it('1.4. tab / 改行 / 連続空白を単一半角 space に圧縮', () => {
      expect(normalizeForFilter('a\t\n  b\r\nc')).toBe('a b c')
    })

    it('1.5. 互換漢字 (NFKC で吸収) — 全角ローマ数字 / 半角カナ', () => {
      // ｱ (HALFWIDTH KATAKANA A) → ア (NFKC 後)
      const result = normalizeForFilter('ｱｲｳ')
      expect(result).toBe('アイウ')
    })

    it('1.6. 前後 trim', () => {
      expect(normalizeForFilter('   foo bar   ')).toBe('foo bar')
    })

    it('1.7. 空文字 / 空白のみは空文字を返す', () => {
      expect(normalizeForFilter('')).toBe('')
      expect(normalizeForFilter('   \t\n   ')).toBe('')
    })
  })

  // ----------------- extractTokenCandidates -----------------
  describe('extractTokenCandidates', () => {
    it('2.1. 半角空白で分割', () => {
      const tokens = extractTokenCandidates('hello world foo bar')
      expect([...tokens]).toEqual(['hello', 'world', 'foo', 'bar'])
    })

    it('2.2. 句読点 / 記号で分割', () => {
      const tokens = extractTokenCandidates('attorney-advice; legal_opinion!')
      expect([...tokens]).toEqual(['attorney', 'advice', 'legal', 'opinion'])
    })

    it('2.3. 日本語句読点で分割', () => {
      const tokens = extractTokenCandidates('弁護士法 72 条、医師法 17 条。')
      expect([...tokens]).toEqual(['弁護士法', '72', '条', '医師法', '17', '条'])
    })

    it('2.4. 空文字 → 空配列', () => {
      const tokens = extractTokenCandidates('')
      expect([...tokens]).toEqual([])
    })

    it('2.5. 出力配列は frozen', () => {
      const tokens = extractTokenCandidates('a b c')
      expect(Object.isFrozen(tokens)).toBe(true)
    })
  })

  // ----------------- containsCriticalPattern -----------------
  describe('containsCriticalPattern', () => {
    it('3.1. 含む場合 true', () => {
      expect(containsCriticalPattern('hello world', 'world')).toBe(true)
    })

    it('3.2. 含まない場合 false', () => {
      expect(containsCriticalPattern('hello world', 'xyz')).toBe(false)
    })

    it('3.3. 空 pattern は常に false (副作用回避)', () => {
      expect(containsCriticalPattern('hello', '')).toBe(false)
    })

    it('3.4. 部分一致でも true', () => {
      expect(containsCriticalPattern('弁護士法 72 条 ai', '弁護士法 72 条')).toBe(true)
    })
  })

  // ----------------- redactPII -----------------
  describe('redactPII', () => {
    it('4.1. email を [REDACTED:email] 化', () => {
      const result = redactPII('contact: foo@example.com please')
      expect(result).toBe('contact: [REDACTED:email] please')
    })

    it('4.2. 複数 email を一括 redact', () => {
      const result = redactPII('a@b.com, c@d.io')
      expect(result).toBe('[REDACTED:email], [REDACTED:email]')
    })

    it('4.3. credit card (16 桁) を redact', () => {
      const result = redactPII('card: 4111 1111 1111 1111 expires')
      expect(result).toContain('[REDACTED:credit_card]')
      expect(result).not.toContain('4111 1111 1111 1111')
    })

    it('4.4. IPv4 を redact', () => {
      const result = redactPII('server at 192.168.1.100 down')
      expect(result).toBe('server at [REDACTED:ipv4] down')
    })

    it('4.5. 複数種類混在', () => {
      const result = redactPII('email a@b.io ip 10.0.0.1')
      expect(result).toContain('[REDACTED:email]')
      expect(result).toContain('[REDACTED:ipv4]')
    })

    it('4.6. PII を含まない文字列は不変', () => {
      const safe = 'this is a safe string with no pii'
      expect(redactPII(safe)).toBe(safe)
    })
  })

  // ----------------- safeNormalize -----------------
  describe('safeNormalize', () => {
    it('5.1. null → 空文字', () => {
      expect(safeNormalize(null)).toBe('')
    })

    it('5.2. undefined → 空文字', () => {
      expect(safeNormalize(undefined)).toBe('')
    })

    it('5.3. string はそのまま', () => {
      expect(safeNormalize('hello')).toBe('hello')
    })

    it('5.4. number → String coerce', () => {
      expect(safeNormalize(42)).toBe('42')
    })

    it('5.5. boolean → String coerce', () => {
      expect(safeNormalize(true)).toBe('true')
      expect(safeNormalize(false)).toBe('false')
    })

    it('5.6. object / array は空文字 (fail-safe)', () => {
      expect(safeNormalize({ key: 'val' })).toBe('')
      expect(safeNormalize([1, 2, 3])).toBe('')
    })
  })
})
