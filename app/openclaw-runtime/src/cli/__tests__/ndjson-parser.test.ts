/**
 * cli/__tests__/ndjson-parser.test — Round 12 Dev-C 着地:
 *   ndjson-parser.ts 単体テスト (純関数 + stream factory、副作用 0)。
 *
 * カバー範囲 (16 tests):
 *   1-6  : parseNdjsonLine 純関数 (object / array / empty / primitive / malformed / CRLF)
 *   7-13 : createNdjsonStreamParser stream feed-flush 動作 (chunk 跨ぎ / CRLF / 空行 / malformed skip)
 *   14   : maxBufferLength 暴走防止
 *   15-16: extractJsonEventsFromChunks / extractJsonEventsFromLines helper
 */
import { describe, it, expect } from 'vitest'

import {
  parseNdjsonLine,
  createNdjsonStreamParser,
  extractJsonEventsFromChunks,
  extractJsonEventsFromLines,
} from '../ndjson-parser.js'

describe('ndjson-parser / parseNdjsonLine (R12 Dev-C)', () => {
  it('1. JSON object 行 → ok:true', () => {
    const r = parseNdjsonLine('{"a":1}')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value).toEqual({ a: 1 })
    }
  })

  it('2. JSON array 行 → ok:true', () => {
    const r = parseNdjsonLine('[1,2,3]')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value).toEqual([1, 2, 3])
    }
  })

  it('3. 空行 → ok:false / error=empty_line', () => {
    expect(parseNdjsonLine('')).toEqual({ ok: false, error: 'empty_line' })
    expect(parseNdjsonLine('   ')).toEqual({ ok: false, error: 'empty_line' })
    expect(parseNdjsonLine('\t')).toEqual({ ok: false, error: 'empty_line' })
  })

  it('4. primitive (number / string literal) → ok:false / not_json_object_or_array', () => {
    expect(parseNdjsonLine('42').ok).toBe(false)
    if (!parseNdjsonLine('42').ok) {
      expect(parseNdjsonLine('42')).toEqual({
        ok: false,
        error: 'not_json_object_or_array',
      })
    }
    expect(parseNdjsonLine('"hello"').ok).toBe(false)
    expect(parseNdjsonLine('null').ok).toBe(false)
    expect(parseNdjsonLine('plain log line').ok).toBe(false)
  })

  it('5. malformed JSON → ok:false / error にメッセージ', () => {
    const r = parseNdjsonLine('{"a":1')
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error).not.toBe('empty_line')
      expect(r.error).not.toBe('not_json_object_or_array')
      expect(typeof r.error).toBe('string')
    }
  })

  it('6. trailing whitespace / CR は trim される', () => {
    expect(parseNdjsonLine('  {"a":1}  ').ok).toBe(true)
    expect(parseNdjsonLine('{"a":1}\r').ok).toBe(true)
  })
})

describe('ndjson-parser / createNdjsonStreamParser (R12 Dev-C)', () => {
  it('7. 完全 1 行 feed → 1 event 返却', () => {
    const p = createNdjsonStreamParser()
    const out = p.feed('{"a":1}\n')
    expect(out).toEqual([{ a: 1 }])
    expect(p.parsedCount).toBe(1)
    expect(p.skippedCount).toBe(0)
    expect(p.bufferedLength).toBe(0)
  })

  it('8. chunk 跨ぎ: 部分行は buffer 保留、改行で flush', () => {
    const p = createNdjsonStreamParser()
    const a = p.feed('{"a":1}\n{"b":')
    expect(a).toEqual([{ a: 1 }])
    expect(p.bufferedLength).toBeGreaterThan(0)
    const b = p.feed('2}\n')
    expect(b).toEqual([{ b: 2 }])
    expect(p.parsedCount).toBe(2)
    expect(p.bufferedLength).toBe(0)
  })

  it('9. CRLF (Windows) 改行も処理', () => {
    const p = createNdjsonStreamParser()
    const out = p.feed('{"a":1}\r\n{"b":2}\r\n')
    expect(out).toEqual([{ a: 1 }, { b: 2 }])
  })

  it('10. 空行は skip 対象 (skippedCount に数えない)', () => {
    const p = createNdjsonStreamParser()
    p.feed('\n\n{"a":1}\n   \n')
    expect(p.parsedCount).toBe(1)
    expect(p.skippedCount).toBe(0)
  })

  it('11. malformed JSON は skip + skippedCount++', () => {
    const p = createNdjsonStreamParser()
    p.feed('{"a":1}\n{"broken\n{"b":2}\n')
    expect(p.parsedCount).toBe(2)
    expect(p.skippedCount).toBe(1)
  })

  it('12. primitive 行は skippedCount++ で skip', () => {
    const p = createNdjsonStreamParser()
    p.feed('{"a":1}\n42\n"plain"\n{"b":2}\n')
    expect(p.parsedCount).toBe(2)
    expect(p.skippedCount).toBe(2) // 42 と "plain"
  })

  it('13. flush 時に buffer 残存行も最終 parse', () => {
    const p = createNdjsonStreamParser()
    p.feed('{"a":1}\n{"b":2}') // 改行無し
    expect(p.parsedCount).toBe(1)
    expect(p.bufferedLength).toBeGreaterThan(0)
    const out = p.flush()
    expect(out).toEqual([{ b: 2 }])
    expect(p.parsedCount).toBe(2)
    expect(p.bufferedLength).toBe(0)
  })

  it('14. maxBufferLength 超過 + 改行未到達 → buffer 切捨て + skip', () => {
    const p = createNdjsonStreamParser({ maxBufferLength: 16 })
    const huge = 'x'.repeat(64) // 改行無し、16 を超過
    const out = p.feed(huge)
    expect(out).toEqual([])
    expect(p.skippedCount).toBe(1)
    expect(p.bufferedLength).toBe(0)
    // 後続 feed で正常動作維持
    const next = p.feed('{"a":1}\n')
    expect(next).toEqual([{ a: 1 }])
  })

  it('15. skipMalformed=false で malformed 行 throw', () => {
    const p = createNdjsonStreamParser({ skipMalformed: false })
    expect(() => p.feed('{"broken\n')).toThrow(/malformed line/)
  })

  it('16. parser 戻り値は frozen', () => {
    const p = createNdjsonStreamParser()
    const out = p.feed('{"a":1}\n')
    expect(Object.isFrozen(out)).toBe(true)
  })
})

describe('ndjson-parser / extract helpers (R12 Dev-C)', () => {
  it('17. extractJsonEventsFromChunks: 任意分割でも全 event を抽出', () => {
    const events = extractJsonEventsFromChunks([
      '{"a":1}\n{"b":',
      '2}\n[1,2,3',
      ']\nplain log\n',
    ])
    expect(events).toEqual([{ a: 1 }, { b: 2 }, [1, 2, 3]])
  })

  it('18. extractJsonEventsFromLines: 完全行配列で純関数 parse', () => {
    const events = extractJsonEventsFromLines([
      '{"a":1}',
      '   ',
      'plain',
      '[1,2,3]',
      '{"b":2}',
      'not-json-{',
    ])
    expect(events).toEqual([{ a: 1 }, [1, 2, 3], { b: 2 }])
  })
})
