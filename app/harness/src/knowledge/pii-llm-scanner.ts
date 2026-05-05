/**
 * pii-llm-scanner.ts — PII redaction stage-2 actual (R33 物理化).
 *
 * 関連: KE-04 / HITL-11 / PIT-098 / PB-093.
 * 二段階 pipeline: stage-1 (regex 10 種 / pii-redactor.ts) + stage-2 (LLM-based deep scan / 本 file).
 * stage-2 は context-aware redaction (氏名 / 住所 / 顧客固有 ID 等) を担い,
 * stage-1 で hit しなかった context-dependent PII を補完する.
 * 副作用: 0 / API call cost: $0 (mock LLM injection で実 LLM call 0 件 / R34+ で real LLM call 想定).
 */

import {
  redactPiiStage1,
  type PiiHit,
  type RedactOptions,
  type RedactResult,
} from './pii-redactor'
import type { PiiCategory } from './pii-patterns'

/** stage-2 で検出する context-aware カテゴリ. */
export type LlmPiiCategory =
  | 'person_name'
  | 'address'
  | 'customer_id'
  | 'org_internal_id'
  | 'free_text_secret'

export interface LlmPiiHit {
  readonly category: LlmPiiCategory
  readonly placeholder: string
  readonly originalLength: number
  readonly confidence: number
}

export interface LlmScanResult {
  readonly redacted: string
  readonly hits: ReadonlyArray<LlmPiiHit>
  readonly invokedCount: number
}

export interface LlmScanRequest {
  readonly text: string
  readonly hintCategories?: ReadonlyArray<LlmPiiCategory>
}

/** mock LLM injection (R33 default / 実 API call 0 件 / R34+ で real impl 差替). */
export type LlmScanner = (req: LlmScanRequest) => LlmScanResult

export interface PipelineOptions extends RedactOptions {
  readonly llmScanner?: LlmScanner
  readonly hintCategories?: ReadonlyArray<LlmPiiCategory>
}

export interface PipelineResult {
  readonly redacted: string
  readonly stage1Hits: ReadonlyArray<PiiHit>
  readonly stage2Hits: ReadonlyArray<LlmPiiHit>
  readonly stage2InvokedCount: number
  readonly mergedHitCount: number
}

const DEFAULT_PLACEHOLDER: Readonly<Record<LlmPiiCategory, string>> = Object.freeze({
  person_name: '<PERSON_NAME>',
  address: '<ADDRESS>',
  customer_id: '<CUSTOMER_ID>',
  org_internal_id: '<ORG_INTERNAL_ID>',
  free_text_secret: '<FREE_TEXT_SECRET>',
})

/** デフォルト mock scanner — 実 LLM call せず簡素な heuristic で hit を返す. */
export function defaultMockLlmScanner(req: LlmScanRequest): LlmScanResult {
  const hits: LlmPiiHit[] = []
  let buffer = req.text

  const heuristics: ReadonlyArray<{
    category: LlmPiiCategory
    regex: RegExp
    confidence: number
  }> = [
    { category: 'person_name', regex: /(?:山田|佐藤|鈴木|田中)[一-龥]{1,3}/g, confidence: 0.85 },
    { category: 'address', regex: /(?:東京都|大阪府|京都府)[一-龥]{1,8}[0-9]{1,4}/g, confidence: 0.9 },
    { category: 'customer_id', regex: /\bCUST-[0-9]{4,8}\b/g, confidence: 0.95 },
    { category: 'org_internal_id', regex: /\bORG-[A-Z0-9]{4,10}\b/g, confidence: 0.9 },
    { category: 'free_text_secret', regex: /秘密キー[:：][^\s]{6,}/g, confidence: 0.7 },
  ]

  for (const h of heuristics) {
    if (
      req.hintCategories &&
      req.hintCategories.length > 0 &&
      !req.hintCategories.includes(h.category)
    ) continue
    buffer = buffer.replace(h.regex, (match) => {
      const placeholder = DEFAULT_PLACEHOLDER[h.category]
      // 既に redact 済 placeholder と重複しない (二重 redact 抑止)
      if (match.startsWith('<') && match.endsWith('>')) return match
      hits.push({
        category: h.category,
        placeholder,
        originalLength: match.length,
        confidence: h.confidence,
      })
      return placeholder
    })
  }

  return Object.freeze({
    redacted: buffer,
    hits: Object.freeze(hits.slice()),
    invokedCount: 1,
  })
}

/** stage-2 単独 scan (stage-1 を経由しない場合用). */
export function scanPiiStage2(
  input: string,
  scanner: LlmScanner = defaultMockLlmScanner,
  hintCategories?: ReadonlyArray<LlmPiiCategory>
): LlmScanResult {
  return scanner({ text: input, ...(hintCategories ? { hintCategories } : {}) })
}

/** stage-1 + stage-2 統合 pipeline (推奨入口). */
export function redactPiiPipeline(
  input: string,
  options: PipelineOptions = {}
): PipelineResult {
  const stage1: RedactResult = redactPiiStage1(input, options)
  const scanner = options.llmScanner ?? defaultMockLlmScanner
  const stage2: LlmScanResult = scanner({
    text: stage1.redacted,
    ...(options.hintCategories ? { hintCategories: options.hintCategories } : {}),
  })
  return Object.freeze({
    redacted: stage2.redacted,
    stage1Hits: stage1.hits,
    stage2Hits: stage2.hits,
    stage2InvokedCount: stage2.invokedCount,
    mergedHitCount: stage1.hits.length + stage2.hits.length,
  })
}

/** カテゴリ別 stage-2 hit 集計 (audit 用). */
export function summarizeLlmHits(
  hits: ReadonlyArray<LlmPiiHit>
): Readonly<Record<LlmPiiCategory, number>> {
  const init: Record<LlmPiiCategory, number> = {
    person_name: 0,
    address: 0,
    customer_id: 0,
    org_internal_id: 0,
    free_text_secret: 0,
  }
  for (const h of hits) init[h.category] += 1
  return Object.freeze(init)
}

/** stage-1 PiiCategory と stage-2 LlmPiiCategory を統合した監査 union. */
export type AnyPiiCategory = PiiCategory | LlmPiiCategory
