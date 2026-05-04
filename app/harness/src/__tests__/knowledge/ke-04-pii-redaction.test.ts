/**
 * KE-04 PII redaction test (Round 13 Dev-E).
 *
 * 検証項目 (DoD: 50 cases):
 *   - 10 カテゴリ × 平均 5 cases = 50 cases 想定
 *   - vitest each で table 駆動、各 category positive + negative + boundary
 */
import { describe, it, expect } from 'vitest'
import {
  containsPii,
  redactPii,
  summarizeHits,
  type PiiCategory,
} from '../../knowledge/ke-04-pii-redaction.js'

interface Case {
  readonly name: string
  readonly input: string
  readonly expectCategory: PiiCategory | null // null = no match expected
}

const cases: Case[] = [
  // -- email (5)
  { name: 'email basic', input: 'contact me at hironori555@gmail.com please', expectCategory: 'email' },
  { name: 'email subdomain', input: 'foo@bar.baz.example.co.jp', expectCategory: 'email' },
  { name: 'email plus tag', input: 'a+b@x.io', expectCategory: 'email' },
  { name: 'email-like but no TLD', input: 'foo@bar', expectCategory: null },
  { name: 'email with leading dot domain rejected', input: '@gmail.com', expectCategory: null },

  // -- phone (5) — 10-15 桁桁数 + hyphen / space allow
  { name: 'phone JP mobile', input: 'TEL: 090-1234-5678', expectCategory: 'phone' },
  { name: 'phone JP landline', input: '03-1234-5678', expectCategory: 'phone' },
  { name: 'phone intl +81', input: '+81 90 1234 5678', expectCategory: 'phone' },
  { name: 'phone too short rejected', input: '123-45', expectCategory: null },
  { name: 'phone 16 digits rejected', input: '1234567890123456789', expectCategory: null },

  // -- credit_card (4)
  { name: 'cc 16 digits no sep', input: 'card 4111111111111111 charged', expectCategory: 'credit_card' },
  { name: 'cc 16 digits hyphen', input: '4111-1111-1111-1111', expectCategory: 'credit_card' },
  { name: 'cc 16 digits space', input: '4111 1111 1111 1111', expectCategory: 'credit_card' },
  { name: 'cc 15 digits → not credit_card (may match phone)', input: '411-111-1111-111', expectCategory: 'phone' },

  // -- aws_key (4)
  { name: 'aws akia', input: 'AKIAIOSFODNN7EXAMPLE found', expectCategory: 'aws_key' },
  { name: 'aws asia', input: 'ASIAIOSFODNN7EXAMPLE found', expectCategory: 'aws_key' },
  { name: 'aws bad prefix rejected', input: 'AKIB1234567890123456 wrong', expectCategory: null },
  { name: 'aws 15 digits rejected', input: 'AKIA12345', expectCategory: null },

  // -- anthropic_key (4)
  { name: 'anthropic basic', input: 'use sk-ant-api03-abcDEFghi_jkl-mnopQRStuv', expectCategory: 'anthropic_key' },
  { name: 'anthropic long', input: 'sk-ant-' + 'A'.repeat(60), expectCategory: 'anthropic_key' },
  { name: 'anthropic short rejected', input: 'sk-ant-abc123', expectCategory: null },
  { name: 'anthropic-like prefix sk-foo (high entropy fallback)', input: 'sk-foo-' + 'a'.repeat(40), expectCategory: 'high_entropy_hex' },

  // -- openai_key (4)
  { name: 'openai sk-', input: 'OPENAI_API_KEY=sk-' + 'a'.repeat(40), expectCategory: 'openai_key' },
  { name: 'openai sess-', input: 'sess-' + 'B'.repeat(30), expectCategory: 'openai_key' },
  { name: 'openai short rejected', input: 'sk-short', expectCategory: null },
  { name: 'openai inside text', input: 'token=sk-' + 'X'.repeat(30) + ' end', expectCategory: 'openai_key' },

  // -- github_pat (4)
  { name: 'github ghp_', input: 'token=ghp_' + 'A'.repeat(36), expectCategory: 'github_pat' },
  { name: 'github gho_', input: 'gho_' + 'B'.repeat(36), expectCategory: 'github_pat' },
  { name: 'github ghs_', input: 'ghs_' + 'C'.repeat(40), expectCategory: 'github_pat' },
  { name: 'github too short rejected', input: 'ghp_short', expectCategory: null },

  // -- jwt (4)
  {
    name: 'jwt basic',
    input: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    expectCategory: 'jwt',
  },
  { name: 'jwt no segments rejected', input: 'eyJabc.def', expectCategory: null },
  {
    name: 'jwt short segments',
    input: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signaturedata12',
    expectCategory: 'jwt',
  },
  { name: 'jwt embedded', input: 'use eyJaaaaaaaaaa.bbbbbbbbbbb.cccccccccc1234567 ok', expectCategory: 'jwt' },

  // -- slack_token (4)
  { name: 'slack xoxa', input: 'xoxa-1234567890-abcde', expectCategory: 'slack_token' },
  { name: 'slack xoxb', input: 'xoxb-' + 'A'.repeat(20), expectCategory: 'slack_token' },
  { name: 'slack short rejected', input: 'xoxb-abc', expectCategory: null },
  { name: 'slack xoxp', input: 'xoxp-100-200-300abc', expectCategory: 'slack_token' },

  // -- high_entropy_hex (5)
  { name: 'hex 32', input: 'KEY=' + 'a'.repeat(32), expectCategory: 'high_entropy_hex' },
  { name: 'hex 64', input: 'sha256:' + 'd'.repeat(64), expectCategory: 'high_entropy_hex' },
  { name: 'hex 31 rejected', input: 'a'.repeat(31), expectCategory: null },
  { name: 'hex mixed case', input: 'AbCdEf1234567890aBcDeF1234567890aB', expectCategory: 'high_entropy_hex' },
  { name: 'plain text passthrough', input: 'this is just a normal sentence', expectCategory: null },

  // -- complex multiple
  {
    name: 'mixed: email + cc',
    input: 'me@example.com / 4111-1111-1111-1111',
    expectCategory: 'email', // first hit
  },
  {
    name: 'all clean text',
    input: 'no secrets here, just words',
    expectCategory: null,
  },
]

describe('KE-04 PII redaction', () => {
  it.each(cases)('case: $name', ({ input, expectCategory }) => {
    const r = redactPii(input)
    if (expectCategory === null) {
      expect(r.hits.length).toBe(0)
      expect(r.redacted).toBe(input)
    } else {
      expect(r.hits.length).toBeGreaterThan(0)
      const cats = r.hits.map((h) => h.category)
      expect(cats).toContain(expectCategory)
    }
  })

  it('keepLastN option で末尾 N 文字を tail に保存する', () => {
    const r = redactPii('hironori555@gmail.com is mine', { keepLastN: 4 })
    expect(r.hits.length).toBe(1)
    expect(r.hits[0]?.tail?.length).toBe(4)
    // 末尾は ".com"
    expect(r.hits[0]?.tail).toBe('.com')
  })

  it('skip option で指定カテゴリを検出しない', () => {
    const r = redactPii('me@example.com / 03-1234-5678', { skip: new Set(['email']) })
    const cats = r.hits.map((h) => h.category)
    expect(cats).not.toContain('email')
    expect(cats).toContain('phone')
  })

  it('結果は Object.freeze 済 (immutable)', () => {
    const r = redactPii('plain text')
    expect(Object.isFrozen(r)).toBe(true)
    expect(Object.isFrozen(r.hits)).toBe(true)
  })

  it('summarizeHits は 10 カテゴリ全件カウント', () => {
    const r = redactPii(
      'me@example.com / 03-1234-5678 / 4111-1111-1111-1111 / sk-ant-' + 'A'.repeat(30),
    )
    const sum = summarizeHits(r.hits)
    expect(sum.email).toBeGreaterThanOrEqual(1)
    expect(sum.phone).toBeGreaterThanOrEqual(1)
    expect(sum.credit_card).toBeGreaterThanOrEqual(1)
    expect(sum.anthropic_key).toBeGreaterThanOrEqual(1)
    expect(Object.isFrozen(sum)).toBe(true)
  })

  it('containsPii は hit 有無 boolean で返す', () => {
    expect(containsPii('plain')).toBe(false)
    expect(containsPii('me@example.com')).toBe(true)
  })

  it('redacted 文字列に placeholder が含まれる (二重置換なし)', () => {
    const r = redactPii('email me@x.io please')
    expect(r.redacted).toContain('<EMAIL>')
    // 再 redact しても新規 hit なし
    const r2 = redactPii(r.redacted)
    expect(r2.hits.length).toBe(0)
  })
})
