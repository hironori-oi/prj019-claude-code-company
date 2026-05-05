/**
 * pii-redactor.ts — PII redaction stage-1 actual (R32 物理化).
 *
 * 関連: KE-04 / HITL-11 / PIT-096 / PB-091.
 * 二段階: stage-1 (本 file regex 10 種) + stage-2 (LLM fallback hook / R33 real impl).
 * 副作用: 0 / API call cost: $0 (LLM fallback は mock injection で実 LLM call 0 件).
 */

import { PII_PATTERNS, type PiiCategory } from './pii-patterns'

export interface PiiHit {
  readonly category: PiiCategory
  readonly placeholder: string
  readonly tail?: string
  readonly originalLength: number
}

export interface RedactResult {
  readonly redacted: string
  readonly hits: ReadonlyArray<PiiHit>
  readonly stage2InvokedCount: number
}

export interface RedactOptions {
  readonly keepLastN?: number
  readonly skip?: ReadonlySet<PiiCategory>
  /** stage-2 LLM fallback hook (mock injection / R32 時点は実 LLM call 0). */
  readonly llmFallback?: LlmFallbackHook
}

export type LlmFallbackHook = (input: string) => {
  readonly redacted: string
  readonly extraHits: ReadonlyArray<PiiHit>
}

/**
 * redactPiiStage1 — stage-1 actual implementation.
 * 入: string + RedactOptions / 出: RedactResult { redacted, hits[], stage2InvokedCount }.
 */
export function redactPiiStage1(
  input: string,
  options: RedactOptions = {}
): RedactResult {
  const keepLastN = options.keepLastN ?? 0
  const skip = options.skip ?? new Set<PiiCategory>()
  const hits: PiiHit[] = []
  let buffer = input

  const sorted = [...PII_PATTERNS].sort((a, b) => a.priority - b.priority)

  for (const det of sorted) {
    if (skip.has(det.category)) continue
    buffer = buffer.replace(det.regex, (match) => {
      if (det.category === 'phone') {
        const digits = match.replace(/\D/g, '')
        if (digits.length < 10 || digits.length > 15) return match
      }
      if (det.category === 'credit_card') {
        const digits = match.replace(/\D/g, '')
        if (digits.length !== 16) return match
      }
      const tail =
        keepLastN > 0
          ? match.slice(-Math.min(keepLastN, match.length))
          : undefined
      const hit: PiiHit = {
        category: det.category,
        placeholder: det.placeholder,
        ...(tail !== undefined ? { tail } : {}),
        originalLength: match.length,
      }
      hits.push(hit)
      return det.placeholder
    })
  }

  // stage-2 LLM fallback (mock injection / R32 時点は実 LLM call 0)
  let stage2InvokedCount = 0
  if (options.llmFallback) {
    const r = options.llmFallback(buffer)
    buffer = r.redacted
    for (const h of r.extraHits) hits.push(h)
    stage2InvokedCount = 1
  }

  return Object.freeze({
    redacted: buffer,
    hits: Object.freeze(hits.slice()),
    stage2InvokedCount,
  })
}

/** containsPii — redact せず存在判定のみ. */
export function containsPii(input: string, options: RedactOptions = {}): boolean {
  return redactPiiStage1(input, options).hits.length > 0
}

/** カテゴリ別件数 (audit / Slack 通知用). */
export function summarizeHits(
  hits: ReadonlyArray<PiiHit>
): Readonly<Record<PiiCategory, number>> {
  const init: Record<PiiCategory, number> = {
    email: 0,
    phone: 0,
    credit_card: 0,
    aws_key: 0,
    anthropic_key: 0,
    openai_key: 0,
    github_pat: 0,
    jwt: 0,
    slack_token: 0,
    high_entropy_hex: 0,
  }
  for (const h of hits) init[h.category] += 1
  return Object.freeze(init)
}
