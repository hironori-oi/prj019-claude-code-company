/**
 * KE-03 retrieval test (Round 13 Dev-E).
 *
 * 検証項目 (6 tests):
 *   1. tag match で score boost
 *   2. category match で score boost
 *   3. kindFilter で除外
 *   4. topN で結果数制限
 *   5. formatProposalCitation 正常系 + miss
 *   6. summarizeIndex で kind 別カウント
 */
import { describe, it, expect } from 'vitest'
import {
  formatProposalCitation,
  retrieve,
  summarizeIndex,
  type IndexedKnowledge,
} from '../../knowledge/ke-03-retrieval.js'

const e1: IndexedKnowledge = {
  frontmatter: {
    kind: 'pattern',
    id: 'PAT-001-hitl-gate-dispatcher',
    source_prj: 'PRJ-019',
    created_at: '2026-05-01',
    tags: ['security', 'harness'],
    category: 'control',
    quality_score: 5,
    reuse_count: 3,
    applies_when: 'when HITL gate dispatch is needed',
  },
  body: 'The hitl gate dispatcher pattern is used for security governance harness '.repeat(2),
}

const e2: IndexedKnowledge = {
  frontmatter: {
    kind: 'decision',
    id: 'DEC-001-priviledge-escalation-4-layers',
    source_prj: 'PRJ-019',
    created_at: '2026-05-02',
    tags: ['governance', 'security'],
    category: 'organization',
    quality_score: 5,
    context: 'we needed multi-layer defense',
    alternatives: ['single layer', 'two layers', 'four layers'],
    rationale: 'four layers chosen',
  },
  body: 'Privilege escalation prevention via 4 defense layers in harness'.repeat(2),
}

const e3: IndexedKnowledge = {
  frontmatter: {
    kind: 'pitfall',
    id: 'PIT-002-github-actions-secret-naming-and-pnpm-workspace',
    source_prj: 'COMPANY-WEBSITE',
    created_at: '2026-04-10',
    tags: ['ci', 'github-actions'],
    category: 'github-actions',
    quality_score: 4,
    symptom: 'CI fails silently',
    root_cause: 'secret name collision',
    remediation: 'rename with prefix',
    prevention: 'preflight CI check',
  },
  body: 'github actions secret naming pitfall in pnpm workspace setup '.repeat(2),
}

const index: ReadonlyArray<IndexedKnowledge> = [e1, e2, e3]

describe('KE-03 retrieval', () => {
  it('tag match で score boost (security tag → 2 件 hit)', () => {
    const r = retrieve(index, { text: 'gate', tags: ['security'] })
    expect(r.hits.length).toBe(2)
    // both e1 and e2 have 'security' tag; reasons include tag:N
    for (const h of r.hits) {
      expect(h.reasons.some((rs) => rs.startsWith('tag:'))).toBe(true)
    }
  })

  it('category exact match で score boost', () => {
    const r = retrieve(index, { text: 'workspace', category: 'github-actions' })
    expect(r.hits.length).toBeGreaterThan(0)
    // e3 が最上位
    expect(r.hits[0]?.entry.frontmatter.id).toBe(e3.frontmatter.id)
    expect(r.hits[0]?.reasons).toContain('category')
  })

  it('kindFilter で pattern のみに絞る', () => {
    const r = retrieve(index, {
      text: 'harness',
      tags: ['security'],
      kindFilter: ['pattern'],
    })
    expect(r.hits.length).toBe(1)
    expect(r.hits[0]?.entry.frontmatter.kind).toBe('pattern')
  })

  it('topN で結果数制限', () => {
    const r = retrieve(index, { text: 'harness security', tags: ['security'], topN: 1 })
    expect(r.hits.length).toBe(1)
  })

  it('score 降順 sort される', () => {
    const r = retrieve(index, { text: 'harness governance security', tags: ['security', 'governance'] })
    expect(r.hits.length).toBeGreaterThanOrEqual(2)
    for (let i = 1; i < r.hits.length; i += 1) {
      expect(r.hits[i - 1]!.score).toBeGreaterThanOrEqual(r.hits[i]!.score)
    }
  })

  it('formatProposalCitation 正常系で markdown 行生成', () => {
    const r = retrieve(index, { text: 'gate', tags: ['security'] })
    const md = formatProposalCitation(r)
    expect(md).toContain('## §(f) 既存ナレッジ参照')
    expect(md).toContain('PAT-001')
    expect(md).toMatch(/score \d+\.\d{2}/)
  })

  it('formatProposalCitation hit 0 件で miss 表示', () => {
    const r = retrieve(index, { text: 'no-match-keyword', tags: ['nonexistent'] })
    // tag が hit しないので 0 件
    expect(r.hits.length).toBe(0)
    const md = formatProposalCitation(r)
    expect(md).toContain('該当ナレッジなし')
  })

  it('summarizeIndex で kind 別カウント', () => {
    const sum = summarizeIndex(index)
    expect(sum.total).toBe(3)
    expect(sum.pattern).toBe(1)
    expect(sum.decision).toBe(1)
    expect(sum.pitfall).toBe(1)
    expect(Object.isFrozen(sum)).toBe(true)
  })
})
