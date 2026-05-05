/**
 * pii-llm-scanner.test.ts — stage-2 LLM-based deep scan 25 case test (R33 物理化).
 *
 * 試験軸構成:
 *   1-5  : 各 LlmPiiCategory 単独 scan (5 case / person_name / address / customer_id / org_internal_id / free_text_secret)
 *   6-8  : context-aware redaction (3 case / 漢字氏名 / 都道府県+番地 / customer_id)
 *   9-11 : pipeline (stage-1 + stage-2) 統合 (3 case)
 *   12-14: mock LLM injection (3 case / null mock / custom mock / no-op mock)
 *   15-17: stage-1 hit を stage-2 が二重 redact しない (3 case)
 *   18-19: hintCategories filter (2 case)
 *   20-21: large input / no hit (2 case)
 *   22-23: summarizeLlmHits / scanPiiStage2 単独 (2 case)
 *   24   : merged stage-1 + stage-2 hit count 整合 (1 case)
 *   25   : edge case (空文字 / 空白のみ) (1 case)
 *
 * 副作用: 0 / API call cost: $0 (mock LLM injection / 実 LLM call 0 件).
 */

import { describe, it, expect } from 'vitest'
import {
  defaultMockLlmScanner,
  redactPiiPipeline,
  scanPiiStage2,
  summarizeLlmHits,
  type LlmPiiHit,
  type LlmScanner,
} from '../pii-llm-scanner'

describe('pii-llm-scanner stage-2 (R33 actual implementation / 25 case)', () => {
  // ============================================================================
  // 1-5: 各 LlmPiiCategory 単独
  // ============================================================================
  it('case 01: person_name (山田太郎) を <PERSON_NAME> に置換', () => {
    const r = scanPiiStage2('担当: 山田太郎')
    expect(r.redacted).toContain('<PERSON_NAME>')
    expect(r.hits[0]?.category).toBe('person_name')
  })

  it('case 02: address (東京都...) を <ADDRESS> に置換', () => {
    const r = scanPiiStage2('住所: 東京都千代田区1234')
    expect(r.redacted).toContain('<ADDRESS>')
    expect(r.hits[0]?.category).toBe('address')
  })

  it('case 03: customer_id (CUST-12345) を <CUSTOMER_ID> に置換', () => {
    const r = scanPiiStage2('顧客 CUST-12345 のデータ')
    expect(r.redacted).toContain('<CUSTOMER_ID>')
    expect(r.hits[0]?.category).toBe('customer_id')
  })

  it('case 04: org_internal_id (ORG-ABCD1234) を <ORG_INTERNAL_ID> に置換', () => {
    const r = scanPiiStage2('組織 ORG-ABCD1234 内部')
    expect(r.redacted).toContain('<ORG_INTERNAL_ID>')
    expect(r.hits[0]?.category).toBe('org_internal_id')
  })

  it('case 05: free_text_secret (秘密キー:xxxxxx) を <FREE_TEXT_SECRET> に置換', () => {
    const r = scanPiiStage2('秘密キー:abcdef123456')
    expect(r.redacted).toContain('<FREE_TEXT_SECRET>')
    expect(r.hits[0]?.category).toBe('free_text_secret')
  })

  // ============================================================================
  // 6-8: context-aware redaction
  // ============================================================================
  it('case 06: 漢字氏名 + 役職 context で person_name のみ redact', () => {
    const r = scanPiiStage2('部長: 佐藤花子 / 担当部署: 開発')
    expect(r.redacted).toContain('<PERSON_NAME>')
    expect(r.redacted).toContain('開発')
  })

  it('case 07: 都道府県 + 番地 context で address redact', () => {
    const r = scanPiiStage2('配送先: 大阪府北区567 まで')
    expect(r.redacted).toContain('<ADDRESS>')
    expect(r.redacted).toContain('まで')
  })

  it('case 08: customer_id を含む長文で他文字列を破壊しない', () => {
    const r = scanPiiStage2('顧客 CUST-99999 様 / 注文 ID は別系統です。')
    expect(r.redacted).toContain('<CUSTOMER_ID>')
    expect(r.redacted).toContain('注文 ID は別系統です。')
  })

  // ============================================================================
  // 9-11: pipeline (stage-1 + stage-2) 統合
  // ============================================================================
  it('case 09: pipeline で email (stage-1) + person_name (stage-2) 両方 redact', () => {
    const r = redactPiiPipeline('担当 山田一郎 (foo@example.com)')
    expect(r.redacted).toContain('<PERSON_NAME>')
    expect(r.redacted).toContain('<EMAIL>')
    expect(r.stage1Hits.length).toBeGreaterThan(0)
    expect(r.stage2Hits.length).toBeGreaterThan(0)
  })

  it('case 10: pipeline mergedHitCount は stage-1+stage-2 合計と一致', () => {
    const r = redactPiiPipeline('foo@example.com / CUST-12345')
    expect(r.mergedHitCount).toBe(r.stage1Hits.length + r.stage2Hits.length)
  })

  it('case 11: pipeline stage2InvokedCount は default で 1', () => {
    const r = redactPiiPipeline('テスト本文')
    expect(r.stage2InvokedCount).toBe(1)
  })

  // ============================================================================
  // 12-14: mock LLM injection
  // ============================================================================
  it('case 12: custom mock scanner を inject して call される', () => {
    let called = 0
    const mock: LlmScanner = (req) => {
      called += 1
      return { redacted: req.text, hits: [], invokedCount: 1 }
    }
    redactPiiPipeline('test', { llmScanner: mock })
    expect(called).toBe(1)
  })

  it('case 13: no-op mock を inject して stage-2 hits 0', () => {
    const mock: LlmScanner = (req) => ({
      redacted: req.text,
      hits: [],
      invokedCount: 1,
    })
    const r = redactPiiPipeline('佐藤太郎', { llmScanner: mock })
    expect(r.stage2Hits.length).toBe(0)
  })

  it('case 14: default mock scanner は invokedCount 1 を返す', () => {
    const r = defaultMockLlmScanner({ text: 'test' })
    expect(r.invokedCount).toBe(1)
  })

  // ============================================================================
  // 15-17: stage-1 hit を stage-2 が二重 redact しない
  // ============================================================================
  it('case 15: <EMAIL> placeholder を stage-2 が再 redact しない', () => {
    const r = scanPiiStage2('contact <EMAIL> です')
    expect(r.redacted).toBe('contact <EMAIL> です')
    expect(r.hits.length).toBe(0)
  })

  it('case 16: <ANTHROPIC_KEY> placeholder を stage-2 が再 redact しない', () => {
    const r = scanPiiStage2('key=<ANTHROPIC_KEY>')
    expect(r.hits.length).toBe(0)
  })

  it('case 17: pipeline で email を redact 後 stage-2 が email 部位を触らない', () => {
    const r = redactPiiPipeline('foo@example.com')
    expect(r.redacted).toContain('<EMAIL>')
    // stage-2 default mock は person_name 等しか拾わない
    expect(r.stage2Hits.length).toBe(0)
  })

  // ============================================================================
  // 18-19: hintCategories filter
  // ============================================================================
  it('case 18: hintCategories=[customer_id] で person_name は redact しない', () => {
    const r = scanPiiStage2(
      '担当: 山田太郎 / 顧客 CUST-12345',
      defaultMockLlmScanner,
      ['customer_id']
    )
    expect(r.redacted).toContain('山田太郎')
    expect(r.redacted).toContain('<CUSTOMER_ID>')
  })

  it('case 19: hintCategories=[] (empty) は全カテゴリ redact', () => {
    const r = scanPiiStage2('CUST-99999 / 山田次郎')
    expect(r.redacted).toContain('<CUSTOMER_ID>')
    expect(r.redacted).toContain('<PERSON_NAME>')
  })

  // ============================================================================
  // 20-21: large input / no hit
  // ============================================================================
  it('case 20: 大きな input でも redact 動作 (PII 1 件のみ抽出)', () => {
    const big = 'x'.repeat(5000) + ' CUST-77777 ' + 'y'.repeat(5000)
    const r = scanPiiStage2(big)
    expect(r.redacted).toContain('<CUSTOMER_ID>')
    expect(r.hits.length).toBe(1)
  })

  it('case 21: PII 含まない input は redacted=input / hits=0', () => {
    const r = scanPiiStage2('plain content with no PII whatsoever')
    expect(r.redacted).toBe('plain content with no PII whatsoever')
    expect(r.hits.length).toBe(0)
  })

  // ============================================================================
  // 22-23: summarizeLlmHits / scanPiiStage2 単独
  // ============================================================================
  it('case 22: summarizeLlmHits でカテゴリ別件数集計', () => {
    const hits: LlmPiiHit[] = [
      { category: 'person_name', placeholder: '<PERSON_NAME>', originalLength: 4, confidence: 0.9 },
      { category: 'person_name', placeholder: '<PERSON_NAME>', originalLength: 4, confidence: 0.9 },
      { category: 'customer_id', placeholder: '<CUSTOMER_ID>', originalLength: 10, confidence: 0.95 },
    ]
    const s = summarizeLlmHits(hits)
    expect(s.person_name).toBe(2)
    expect(s.customer_id).toBe(1)
    expect(s.address).toBe(0)
  })

  it('case 23: scanPiiStage2 で複数 category 混在を一度の scan で全 hit', () => {
    const r = scanPiiStage2('鈴木次郎 / 京都府上京区890 / CUST-22222')
    expect(r.hits.length).toBeGreaterThanOrEqual(3)
  })

  // ============================================================================
  // 24: merged stage-1 + stage-2 hit count 整合
  // ============================================================================
  it('case 24: pipeline merged stage-1 email + stage-2 customer_id 計 2 hit', () => {
    const r = redactPiiPipeline('foo@example.com / CUST-33333')
    expect(r.stage1Hits.length).toBe(1)
    expect(r.stage2Hits.length).toBe(1)
    expect(r.mergedHitCount).toBe(2)
  })

  // ============================================================================
  // 25: edge case (空文字 / 空白のみ)
  // ============================================================================
  it('case 25: 空文字 / 空白のみ input は hits 0 で no-op', () => {
    const r1 = scanPiiStage2('')
    const r2 = scanPiiStage2('   \n\t   ')
    expect(r1.hits.length).toBe(0)
    expect(r2.hits.length).toBe(0)
  })
})
