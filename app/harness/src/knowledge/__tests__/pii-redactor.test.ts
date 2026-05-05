/**
 * pii-redactor.test.ts — stage-1 actual implementation 23 case test (R32 物理化).
 *
 * 試験軸構成:
 *   1-10: 各 PII category 単独 redact 確認 (10 case)
 *   11-13: 複数 category 混在 + 順序保証 (3 case)
 *   14-15: skip / keepLastN option (2 case)
 *   16-17: false positive 抑止 (phone 桁数 / credit_card 桁数) (2 case)
 *   18-19: containsPii / summarizeHits (2 case)
 *   20-22: LLM fallback hook (mock injection) (3 case)
 *   23   : PII 0 件 input (edge case) (1 case)
 *
 * 副作用: 0 / API call cost: $0 (LLM fallback は mock injection / 実 LLM call 0 件).
 */

import { describe, it, expect } from 'vitest'
import {
  redactPiiStage1,
  containsPii,
  summarizeHits,
  type LlmFallbackHook,
  type PiiHit,
} from '../pii-redactor'

describe('pii-redactor stage-1 (R32 actual implementation / 23 case)', () => {
  // ============================================================================
  // 1-10: 各 category 単独
  // ============================================================================
  it('case 01: anthropic_key を <ANTHROPIC_KEY> に置換', () => {
    const r = redactPiiStage1('key=sk-ant-abcdefghijklmnopqrstuvwxyz')
    expect(r.redacted).toContain('<ANTHROPIC_KEY>')
    expect(r.hits[0]?.category).toBe('anthropic_key')
  })

  it('case 02: openai_key を <OPENAI_KEY> に置換', () => {
    const r = redactPiiStage1('key=sk-abcdefghijklmnopqrstuvwxyz1234')
    expect(r.redacted).toContain('<OPENAI_KEY>')
    expect(r.hits[0]?.category).toBe('openai_key')
  })

  it('case 03: github_pat を <GITHUB_PAT> に置換', () => {
    const r = redactPiiStage1('pat=ghp_abcdefghijklmnopqrstuvwxyz1234567890')
    expect(r.redacted).toContain('<GITHUB_PAT>')
    expect(r.hits[0]?.category).toBe('github_pat')
  })

  it('case 04: slack_token を <SLACK_TOKEN> に置換', () => {
    const r = redactPiiStage1('token=xoxb-1234567890-abcdef')
    expect(r.redacted).toContain('<SLACK_TOKEN>')
    expect(r.hits[0]?.category).toBe('slack_token')
  })

  it('case 05: aws_key を <AWS_KEY> に置換', () => {
    const r = redactPiiStage1('key=AKIAIOSFODNN7EXAMPLE')
    expect(r.redacted).toContain('<AWS_KEY>')
    expect(r.hits[0]?.category).toBe('aws_key')
  })

  it('case 06: jwt を <JWT> に置換', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIs.eyJzdWIiOiIxMjM0NTY3ODkw.SflKxwRJSMeKKF2QT4'
    const r = redactPiiStage1(`token=${jwt}`)
    expect(r.redacted).toContain('<JWT>')
    expect(r.hits[0]?.category).toBe('jwt')
  })

  it('case 07: email を <EMAIL> に置換', () => {
    const r = redactPiiStage1('Contact: alice@example.com for info')
    expect(r.redacted).toContain('<EMAIL>')
    expect(r.hits[0]?.category).toBe('email')
  })

  it('case 08: credit_card (16 桁 hyphen 区切り) を <CREDIT_CARD> に置換', () => {
    const r = redactPiiStage1('card=4111-1111-1111-1111')
    expect(r.redacted).toContain('<CREDIT_CARD>')
    expect(r.hits[0]?.category).toBe('credit_card')
  })

  it('case 09: phone を <PHONE> に置換', () => {
    const r = redactPiiStage1('Call 090-1234-5678 anytime')
    expect(r.redacted).toContain('<PHONE>')
    expect(r.hits[0]?.category).toBe('phone')
  })

  it('case 10: high_entropy_hex を <HEX_KEY> に置換', () => {
    const hex = 'a'.repeat(32)
    const r = redactPiiStage1(`hash=${hex}`)
    expect(r.redacted).toContain('<HEX_KEY>')
    expect(r.hits[0]?.category).toBe('high_entropy_hex')
  })

  // ============================================================================
  // 11-13: 複数 category 混在 + 順序保証
  // ============================================================================
  it('case 11: email + anthropic_key 同時 redact', () => {
    const input = 'mail=alice@example.com key=sk-ant-abcdefghijklmnopqrstuvwxyz'
    const r = redactPiiStage1(input)
    expect(r.redacted).toContain('<EMAIL>')
    expect(r.redacted).toContain('<ANTHROPIC_KEY>')
    expect(r.hits.length).toBe(2)
  })

  it('case 12: API キー系が email より優先 (priority 順)', () => {
    const input = 'sk-ant-abcdefghijklmnopqrstuvwxyz alice@example.com'
    const r = redactPiiStage1(input)
    // anthropic_key (priority 1) が先に hit
    expect(r.hits[0]?.category).toBe('anthropic_key')
    expect(r.hits[1]?.category).toBe('email')
  })

  it('case 13: 複数 email を全件 redact', () => {
    const r = redactPiiStage1('a@example.com b@example.com c@example.com')
    expect(r.hits.length).toBe(3)
    expect(r.hits.every((h) => h.category === 'email')).toBe(true)
  })

  // ============================================================================
  // 14-15: option
  // ============================================================================
  it('case 14: skip option で email を除外', () => {
    const r = redactPiiStage1('alice@example.com', { skip: new Set(['email']) })
    expect(r.redacted).toBe('alice@example.com')
    expect(r.hits.length).toBe(0)
  })

  it('case 15: keepLastN で末尾 4 文字を tail に保持', () => {
    const r = redactPiiStage1('mail=alice@example.com', { keepLastN: 4 })
    expect(r.hits[0]?.tail).toBe('.com')
  })

  // ============================================================================
  // 16-17: false positive 抑止
  // ============================================================================
  it('case 16: phone 9 桁未満は redact しない', () => {
    const r = redactPiiStage1('id=123456')
    expect(r.redacted).toBe('id=123456')
    expect(r.hits.length).toBe(0)
  })

  it('case 17: credit_card 16 桁以外は redact しない', () => {
    const r = redactPiiStage1('seq=1234-5678-9012')
    // 12 桁 (4-4-4) は credit_card にマッチしない
    const ccHits = r.hits.filter((h) => h.category === 'credit_card')
    expect(ccHits.length).toBe(0)
  })

  // ============================================================================
  // 18-19: containsPii / summarizeHits
  // ============================================================================
  it('case 18: containsPii true / false', () => {
    expect(containsPii('alice@example.com')).toBe(true)
    expect(containsPii('hello world no pii')).toBe(false)
  })

  it('case 19: summarizeHits でカテゴリ別件数', () => {
    const r = redactPiiStage1('a@example.com b@example.com sk-ant-abcdefghijklmnopqrstuvwxyz')
    const sum = summarizeHits(r.hits)
    expect(sum.email).toBe(2)
    expect(sum.anthropic_key).toBe(1)
    expect(sum.phone).toBe(0)
  })

  // ============================================================================
  // 20-22: LLM fallback hook (mock injection)
  // ============================================================================
  it('case 20: llmFallback 未指定時は stage2InvokedCount=0', () => {
    const r = redactPiiStage1('alice@example.com')
    expect(r.stage2InvokedCount).toBe(0)
  })

  it('case 21: llmFallback 指定時は stage2InvokedCount=1 (mock)', () => {
    const mockHook: LlmFallbackHook = (input) => ({
      redacted: input.replace(/contextual-pii/g, '<CONTEXTUAL>'),
      extraHits: [],
    })
    const r = redactPiiStage1('contextual-pii detected', { llmFallback: mockHook })
    expect(r.stage2InvokedCount).toBe(1)
    expect(r.redacted).toContain('<CONTEXTUAL>')
  })

  it('case 22: llmFallback で extraHits を追加', () => {
    const extraHit: PiiHit = {
      category: 'email',
      placeholder: '<EMAIL>',
      originalLength: 17,
    }
    const mockHook: LlmFallbackHook = () => ({
      redacted: '<CONTEXTUAL>',
      extraHits: [extraHit],
    })
    const r = redactPiiStage1('input', { llmFallback: mockHook })
    expect(r.hits.length).toBe(1)
    expect(r.hits[0]?.category).toBe('email')
  })

  // ============================================================================
  // 23: edge case (PII 0 件)
  // ============================================================================
  it('case 23: PII 0 件 input は redacted=input + hits=[]', () => {
    const input = 'hello world this is plain text'
    const r = redactPiiStage1(input)
    expect(r.redacted).toBe(input)
    expect(r.hits.length).toBe(0)
    expect(r.stage2InvokedCount).toBe(0)
  })
})
