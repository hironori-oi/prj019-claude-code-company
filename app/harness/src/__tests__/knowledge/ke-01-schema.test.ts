/**
 * KE-01 schema test (Round 13 Dev-E).
 *
 * 検証項目 (6 tests):
 *   1. valid pattern entry が pass する
 *   2. valid decision entry が pass する
 *   3. valid pitfall entry が pass する
 *   4. id 形式違反で KnowledgeSchemaError throw
 *   5. body 長 < 50 で reject (boundary)
 *   6. detectKnowledgeKind が 4 状態 (pattern / decision / pitfall / unknown) を返す
 */
import { describe, it, expect } from 'vitest'
import {
  Hitl11WebhookKindSchema,
  KnowledgeKindSchema,
  KnowledgeSchemaError,
  detectKnowledgeKind,
  idPrefixToKind,
  isValidKnowledgeEntry,
  kindToIdPrefix,
  validateKnowledgeEntry,
} from '../../knowledge/ke-01-schema.js'

const VALID_BODY = 'a'.repeat(80) // 80 chars >= 50

const validPattern = {
  frontmatter: {
    kind: 'pattern' as const,
    id: 'PAT-099-test-pattern',
    source_prj: 'PRJ-019',
    created_at: '2026-05-04',
    tags: ['security', 'harness'],
    category: 'control',
    quality_score: 4,
    reuse_count: 2,
    applies_when: 'detector で context-aware suppression が必要なとき',
  },
  body: VALID_BODY,
}

const validDecision = {
  frontmatter: {
    kind: 'decision' as const,
    id: 'DEC-099-test-decision',
    source_prj: 'PRJ-019',
    created_at: '2026-05-04T12:00:00Z',
    tags: ['governance'],
    category: 'organization',
    quality_score: 5,
    context: 'Phase 1 sign-off の 5/22 push 可否判定が必要',
    alternatives: ['GO 案 9 並列', 'HOLD 案 6 並列', 'HOLD 維持 (5/30)'],
    rationale: 'Owner formal「最速」directive と 5 軸評価で GO（条件付）',
  },
  body: VALID_BODY,
}

const validPitfall = {
  frontmatter: {
    kind: 'pitfall' as const,
    id: 'PIT-099-test-pitfall',
    source_prj: 'PRJ-019',
    created_at: '2026-05-04',
    tags: ['ci'],
    category: 'github-actions',
    quality_score: 4,
    symptom: 'CI が secret 未設定で fail-silent する',
    root_cause: 'GitHub Actions で secret 名が pnpm workspace と衝突した',
    remediation: 'secret 名を CLAWBRIDGE_ プレフィックスに統一',
    prevention: 'preflight CI step で全 secret 名を検証する',
  },
  body: VALID_BODY,
}

describe('KE-01 schema validator', () => {
  it('valid pattern entry が pass する', () => {
    const e = validateKnowledgeEntry(validPattern)
    expect(e.frontmatter.kind).toBe('pattern')
    expect(Object.isFrozen(e)).toBe(true)
  })

  it('valid decision entry が pass する', () => {
    const e = validateKnowledgeEntry(validDecision)
    expect(e.frontmatter.kind).toBe('decision')
    if (e.frontmatter.kind === 'decision') {
      expect(e.frontmatter.alternatives.length).toBe(3)
    }
  })

  it('valid pitfall entry が pass する', () => {
    const e = validateKnowledgeEntry(validPitfall)
    expect(e.frontmatter.kind).toBe('pitfall')
  })

  it('id 形式違反で KnowledgeSchemaError throw', () => {
    const bad = {
      ...validPattern,
      frontmatter: { ...validPattern.frontmatter, id: 'invalid-id-format' },
    }
    let caught: KnowledgeSchemaError | null = null
    try {
      validateKnowledgeEntry(bad)
    } catch (e) {
      if (e instanceof KnowledgeSchemaError) caught = e
    }
    expect(caught).not.toBeNull()
    expect(caught?.issues.length).toBeGreaterThan(0)
    // issues は Object.freeze 済
    expect(Object.isFrozen(caught?.issues)).toBe(true)
  })

  it('body 長 < 50 で reject (boundary)', () => {
    const bad = { ...validPattern, body: 'short' }
    expect(isValidKnowledgeEntry(bad)).toBe(false)
  })

  it('detectKnowledgeKind が 4 状態 (pattern / decision / pitfall / unknown) を返す', () => {
    expect(detectKnowledgeKind(validPattern)).toBe('pattern')
    expect(detectKnowledgeKind(validDecision)).toBe('decision')
    expect(detectKnowledgeKind(validPitfall)).toBe('pitfall')
    expect(detectKnowledgeKind(null)).toBe('unknown')
    expect(detectKnowledgeKind({ frontmatter: { kind: 'foo' } })).toBe('unknown')
  })

  // ==========================================================================
  // Round 17 Dev-V: Hitl11WebhookKindSchema + kindToIdPrefix helper
  // ==========================================================================

  it('Hitl11WebhookKindSchema が 3 値を pass / 不正値を reject する', () => {
    expect(Hitl11WebhookKindSchema.safeParse('knowledge_pii_review_approve').success).toBe(true)
    expect(Hitl11WebhookKindSchema.safeParse('knowledge_pii_review_reject').success).toBe(true)
    expect(Hitl11WebhookKindSchema.safeParse('knowledge_pii_review_partial').success).toBe(true)
    expect(Hitl11WebhookKindSchema.safeParse('knowledge_pii_review_xxx').success).toBe(false)
    expect(Hitl11WebhookKindSchema.safeParse(null).success).toBe(false)
    expect(Hitl11WebhookKindSchema.safeParse(undefined).success).toBe(false)
  })

  it('kindToIdPrefix が 3 種を正しく PAT-/DEC-/PIT- に写像する', () => {
    expect(kindToIdPrefix('pattern')).toBe('PAT-')
    expect(kindToIdPrefix('decision')).toBe('DEC-')
    expect(kindToIdPrefix('pitfall')).toBe('PIT-')
  })

  it('idPrefixToKind が 逆変換 + 不正値で null を返す', () => {
    expect(idPrefixToKind('PAT-')).toBe('pattern')
    expect(idPrefixToKind('DEC-')).toBe('decision')
    expect(idPrefixToKind('PIT-')).toBe('pitfall')
    // ハイフンなしも受容 (lenient)
    expect(idPrefixToKind('pat')).toBe('pattern')
    // 不正値
    expect(idPrefixToKind('XXX-')).toBeNull()
    expect(idPrefixToKind('')).toBeNull()
  })

  it('KnowledgeKindSchema と kindToIdPrefix が網羅的に整合する', () => {
    // KnowledgeKindSchema の全 enum 値で kindToIdPrefix が定義済かを round-trip 検証
    for (const k of KnowledgeKindSchema.options) {
      const prefix = kindToIdPrefix(k)
      expect(idPrefixToKind(prefix)).toBe(k)
    }
  })
})
