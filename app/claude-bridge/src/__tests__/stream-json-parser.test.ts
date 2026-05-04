import { describe, it, expect } from 'vitest'
import {
  parseStreamJsonText,
  parseStreamJsonLine,
  parseStreamJsonChunks,
  extractUsage,
} from '../stream-json-parser.js'

describe('parseStreamJsonLine', () => {
  it('parses a valid line', () => {
    const r = parseStreamJsonLine('{"type":"system","subtype":"init","session_id":"s1"}')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.message.type).toBe('system')
      expect(r.message.subtype).toBe('init')
      expect(r.message.session_id).toBe('s1')
    }
  })

  it('returns error on JSON parse failure', () => {
    const r = parseStreamJsonLine('not json')
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error).toMatch(/JSON parse error/)
    }
  })

  it('rejects when type is missing (schema)', () => {
    const r = parseStreamJsonLine('{"foo":"bar"}')
    expect(r.ok).toBe(false)
  })

  it('preserves unknown extra fields via passthrough', () => {
    const r = parseStreamJsonLine('{"type":"assistant","custom_field":42}')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect((r.message as unknown as { custom_field: number }).custom_field).toBe(42)
    }
  })
})

describe('parseStreamJsonText', () => {
  it('parses multi-line NDJSON, skipping blanks', () => {
    const text = [
      '{"type":"system","subtype":"init"}',
      '',
      '{"type":"assistant"}',
      '{"type":"result","total_cost_usd":0.0123}',
    ].join('\n')
    const r = parseStreamJsonText(text)
    expect(r.messages).toHaveLength(3)
    expect(r.unparseable).toHaveLength(0)
    expect(r.messages[2]?.total_cost_usd).toBe(0.0123)
  })

  it('records unparseable lines without throwing', () => {
    const r = parseStreamJsonText('{"type":"a"}\nxxx not json\n{"type":"b"}')
    expect(r.messages).toHaveLength(2)
    expect(r.unparseable).toHaveLength(1)
    expect(r.unparseable[0]?.line).toBe('xxx not json')
  })

  it('handles CRLF line separators', () => {
    const text = '{"type":"a"}\r\n{"type":"b"}\r\n'
    const r = parseStreamJsonText(text)
    expect(r.messages).toHaveLength(2)
  })
})

describe('parseStreamJsonChunks', () => {
  async function* mkChunks(parts: string[]): AsyncGenerator<string, void, void> {
    for (const p of parts) yield p
  }

  it('handles chunk boundaries that split JSON lines', async () => {
    const parts = [
      '{"type":"sys',
      'tem","subtype":"init"}\n{"type":"assi',
      'stant"}\n{"type":"result","total_cost_usd":0.5}\n',
    ]
    const out = []
    for await (const m of parseStreamJsonChunks(mkChunks(parts))) {
      out.push(m)
    }
    expect(out).toHaveLength(3)
    expect(out[0]?.type).toBe('system')
    expect(out[2]?.total_cost_usd).toBe(0.5)
  })

  it('emits a tail line that is not newline-terminated', async () => {
    const out = []
    for await (const m of parseStreamJsonChunks(mkChunks(['{"type":"final"}']))) {
      out.push(m)
    }
    expect(out).toHaveLength(1)
    expect(out[0]?.type).toBe('final')
  })

  it('drops unparseable lines silently', async () => {
    const out = []
    for await (const m of parseStreamJsonChunks(mkChunks(['{"type":"a"}\ngarbage\n{"type":"b"}\n']))) {
      out.push(m)
    }
    expect(out).toHaveLength(2)
  })
})

describe('extractUsage', () => {
  it('sums token usage and takes max of cost', () => {
    const messages = [
      {
        type: 'assistant',
        usage: { input_tokens: 100, output_tokens: 50, cache_read_input_tokens: 10 },
      },
      {
        type: 'assistant',
        usage: { input_tokens: 30, output_tokens: 20, cache_creation_input_tokens: 5 },
      },
      { type: 'result', total_cost_usd: 0.025 },
    ]
    const u = extractUsage(messages)
    expect(u.inputTokens).toBe(130)
    expect(u.outputTokens).toBe(70)
    expect(u.cacheReadTokens).toBe(10)
    expect(u.cacheWriteTokens).toBe(5)
    expect(u.totalCostUsd).toBe(0.025)
  })

  it('returns zero values for empty input', () => {
    const u = extractUsage([])
    expect(u.inputTokens).toBe(0)
    expect(u.outputTokens).toBe(0)
    expect(u.totalCostUsd).toBe(0)
  })

  it('uses the maximum total_cost_usd seen (in case of multiple result messages)', () => {
    const u = extractUsage([
      { type: 'result', total_cost_usd: 0.01 },
      { type: 'result', total_cost_usd: 0.05 },
      { type: 'result', total_cost_usd: 0.03 },
    ])
    expect(u.totalCostUsd).toBe(0.05)
  })
})
