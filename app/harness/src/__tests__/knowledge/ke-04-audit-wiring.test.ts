/**
 * KE-04 audit-store wiring test (Round 14 Dev-E).
 *
 * 検証項目 (12 tests):
 *  1. wrap: PII なし payload は素通り
 *  2. wrap: anthropic_key を含む payload で placeholder 化
 *  3. wrap: nested object も redact される
 *  4. wrap: array 内 string も redact される
 *  5. wrap: hash chain integrity 維持 (verifyHashChain pass)
 *  6. wrap: appendWithRedactionInfo で redactedHits を返す
 *  7. wrap: skip option で除外カテゴリは redact されない
 *  8. wrap: attachSummary=true で _pii_redacted metadata 追加
 *  9. wrap: attachSummary=false で metadata なし
 * 10. redactPayloadDeep: pure function として redact 結果を返す
 * 11. wrap: numeric / boolean は変更されない
 * 12. wrap: list / verifyHashChain / rotate を delegate
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FileAuditLogStore } from '@clawbridge/audit'
import {
  wrapAuditStoreWithRedaction,
  redactPayloadDeep,
} from '../../knowledge/ke-04-audit-wiring.js'

function tmpFile(): string {
  return join(
    tmpdir(),
    `clawbridge-ke04-audit-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`,
  )
}

describe('wrapAuditStoreWithRedaction', () => {
  let filePath: string
  beforeEach(() => {
    filePath = tmpFile()
  })
  afterEach(async () => {
    try {
      await fs.unlink(filePath)
    } catch {
      // ignore
    }
  })

  it('1. passes through clean payload unchanged', async () => {
    const raw = new FileAuditLogStore({ filePath })
    const wrapped = wrapAuditStoreWithRedaction(raw)
    await wrapped.append({
      type: 'spawn',
      source: 'harness',
      payload: { sessionId: 'sess-foo', cmd: 'claude --print' },
    })
    const events = await wrapped.list()
    expect(events.length).toBe(1)
    expect(events[0]?.payload['sessionId']).toBe('sess-foo')
    expect(events[0]?.payload['_pii_redacted']).toBeUndefined()
  })

  it('2. redacts anthropic_key placeholder', async () => {
    const raw = new FileAuditLogStore({ filePath })
    const wrapped = wrapAuditStoreWithRedaction(raw)
    await wrapped.append({
      type: 'hitl_decision',
      source: 'harness',
      payload: { note: 'token sk-ant-AAAAAAAAAAAAAAAAAAAA1234' },
    })
    const events = await wrapped.list()
    expect(events[0]?.payload['note']).toContain('<ANTHROPIC_KEY>')
    expect(events[0]?.payload['note']).not.toContain('sk-ant-AAAA')
  })

  it('3. redacts nested object string fields', async () => {
    const raw = new FileAuditLogStore({ filePath })
    const wrapped = wrapAuditStoreWithRedaction(raw)
    await wrapped.append({
      type: 'other',
      source: 'harness',
      payload: {
        meta: {
          email: 'someone@example.com',
          inner: { deeper: 'sk-ant-XXXXXXXXXXXXXXXXXXXX1234' },
        },
      },
    })
    const events = await wrapped.list()
    const meta = events[0]?.payload['meta'] as { email: string; inner: { deeper: string } }
    expect(meta.email).toContain('<EMAIL>')
    expect(meta.inner.deeper).toContain('<ANTHROPIC_KEY>')
  })

  it('4. redacts array elements', async () => {
    const raw = new FileAuditLogStore({ filePath })
    const wrapped = wrapAuditStoreWithRedaction(raw)
    await wrapped.append({
      type: 'other',
      source: 'harness',
      payload: { contacts: ['a@b.com', 'plain text', 'c@d.com'] },
    })
    const events = await wrapped.list()
    const contacts = events[0]?.payload['contacts'] as string[]
    expect(contacts[0]).toContain('<EMAIL>')
    expect(contacts[1]).toBe('plain text')
    expect(contacts[2]).toContain('<EMAIL>')
  })

  it('5. preserves hash chain integrity', async () => {
    const raw = new FileAuditLogStore({ filePath })
    const wrapped = wrapAuditStoreWithRedaction(raw)
    await wrapped.append({
      type: 'spawn',
      source: 'harness',
      payload: { token: 'sk-ant-AAAAAAAAAAAAAAAAAAAA1234' },
    })
    await wrapped.append({
      type: 'kill_switch',
      source: 'harness',
      payload: { reason: 'budget' },
    })
    const verify = await wrapped.verifyHashChain()
    expect(verify.valid).toBe(true)
    expect(verify.totalChecked).toBe(2)
  })

  it('6. appendWithRedactionInfo returns redactedHits count', async () => {
    const raw = new FileAuditLogStore({ filePath })
    const wrapped = wrapAuditStoreWithRedaction(raw)
    const r = await wrapped.appendWithRedactionInfo({
      type: 'other',
      source: 'harness',
      payload: { a: 'sk-ant-AAAAAAAAAAAAAAAAAAAA1234', b: 'foo@bar.com' },
    })
    expect(r.redactedHits).toBeGreaterThanOrEqual(2)
    expect(typeof r.id).toBe('number')
    expect(typeof r.hash).toBe('string')
  })

  it('7. skip option excludes specified category', async () => {
    const raw = new FileAuditLogStore({ filePath })
    const wrapped = wrapAuditStoreWithRedaction(raw, {
      skip: new Set(['email']),
    })
    await wrapped.append({
      type: 'other',
      source: 'harness',
      payload: { e: 'someone@example.com' },
    })
    const events = await wrapped.list()
    expect(events[0]?.payload['e']).toBe('someone@example.com')
  })

  it('8. attachSummary=true adds _pii_redacted metadata', async () => {
    const raw = new FileAuditLogStore({ filePath })
    const wrapped = wrapAuditStoreWithRedaction(raw)
    await wrapped.append({
      type: 'other',
      source: 'harness',
      payload: { x: 'sk-ant-AAAAAAAAAAAAAAAAAAAA1234' },
    })
    const events = await wrapped.list()
    const meta = events[0]?.payload['_pii_redacted'] as
      | { hit_count: number; categories: Record<string, number> }
      | undefined
    expect(meta).toBeDefined()
    expect(meta?.hit_count).toBeGreaterThanOrEqual(1)
    expect(meta?.categories['anthropic_key']).toBeGreaterThanOrEqual(1)
  })

  it('9. attachSummary=false omits _pii_redacted metadata', async () => {
    const raw = new FileAuditLogStore({ filePath })
    const wrapped = wrapAuditStoreWithRedaction(raw, { attachSummary: false })
    await wrapped.append({
      type: 'other',
      source: 'harness',
      payload: { x: 'sk-ant-AAAAAAAAAAAAAAAAAAAA1234' },
    })
    const events = await wrapped.list()
    expect(events[0]?.payload['_pii_redacted']).toBeUndefined()
  })

  it('10. redactPayloadDeep returns redacted + hits without I/O', () => {
    const r = redactPayloadDeep({
      a: 'sk-ant-AAAAAAAAAAAAAAAAAAAA1234',
      b: { c: 'foo@bar.com' },
    })
    expect((r.redacted['a'] as string)).toContain('<ANTHROPIC_KEY>')
    expect(((r.redacted['b'] as { c: string }).c)).toContain('<EMAIL>')
    expect(r.hits.length).toBeGreaterThanOrEqual(2)
  })

  it('11. preserves numeric and boolean values', async () => {
    const raw = new FileAuditLogStore({ filePath })
    const wrapped = wrapAuditStoreWithRedaction(raw)
    await wrapped.append({
      type: 'other',
      source: 'harness',
      payload: { count: 42, ok: true, ratio: 0.85, none: null },
    })
    const events = await wrapped.list()
    const p = events[0]?.payload
    expect(p?.['count']).toBe(42)
    expect(p?.['ok']).toBe(true)
    expect(p?.['ratio']).toBe(0.85)
    expect(p?.['none']).toBeNull()
  })

  it('12. delegates list / verifyHashChain / rotate to underlying store', async () => {
    const raw = new FileAuditLogStore({ filePath, rotation: { rotateOnAppend: false } })
    const wrapped = wrapAuditStoreWithRedaction(raw)
    await wrapped.append({
      type: 'spawn',
      source: 'harness',
      payload: { x: 1 },
    })
    const events = await wrapped.list({ type: 'spawn' })
    expect(events.length).toBe(1)
    const verify = await wrapped.verifyHashChain()
    expect(verify.valid).toBe(true)
    const rotated = await wrapped.rotate()
    expect(typeof rotated).toBe('number')
  })
})
