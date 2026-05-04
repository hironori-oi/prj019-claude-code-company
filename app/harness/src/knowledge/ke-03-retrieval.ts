/**
 * KE-03 retrieval — ナレッジ検索 API + 提案書テンプレ §(f) 自動引用 (Round 13 Dev-E 前倒し).
 *
 * 関連必須コントロール:
 *   KE-03 (DEC-019-033 ⑪ — Owner-in-the-loop 16 項目のうち、retrieval 軸)
 *
 * 設計方針:
 *   - in-memory index に対する **TF-IDF 風 simple ranking** (外部依存なし、API $0).
 *   - retrieve(query, opts) → Top N entries with score.
 *   - 提案書テンプレ §(f) 自動引用は formatProposalCitation で markdown 行を生成.
 *   - 全関数は **pure**: Object.freeze で結果イミュータブル化、副作用なし.
 *
 * scoring:
 *   - tag exact match    : +3.0
 *   - category match     : +2.0
 *   - title token match  : +1.5 / token
 *   - body token match   : +0.5 / token (上限 5 件まで)
 *   - quality_score boost: +quality_score * 0.2
 *   - kind フィルタ pass : 必須 (false なら除外)
 */
import type { KnowledgeFrontmatterType } from './ke-01-schema.js'

// ============================================================================
// 型
// ============================================================================

/** retrieval 入力 entry (index 化された軽量 view). */
export interface IndexedKnowledge {
  readonly frontmatter: KnowledgeFrontmatterType
  /** redact 済 body (KE-04 を通したもの). */
  readonly body: string
}

export interface RetrieveQuery {
  readonly text: string
  readonly tags?: ReadonlyArray<string>
  readonly category?: string
  readonly kindFilter?: ReadonlyArray<'pattern' | 'decision' | 'pitfall'>
  readonly topN?: number
}

export interface ScoredHit {
  readonly entry: IndexedKnowledge
  readonly score: number
  readonly reasons: ReadonlyArray<string>
}

export interface RetrieveResult {
  readonly hits: ReadonlyArray<ScoredHit>
  readonly query: RetrieveQuery
}

// ============================================================================
// tokenize
// ============================================================================

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\-_]+/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2)
}

// ============================================================================
// scoring
// ============================================================================

function scoreEntry(entry: IndexedKnowledge, query: RetrieveQuery): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0
  let contentMatch = false // tag / category / title / body のいずれかで hit したか
  const fm = entry.frontmatter

  // tag exact match
  if (query.tags && query.tags.length > 0) {
    const entryTags = new Set(fm.tags.map((t) => t.toLowerCase()))
    let tagHits = 0
    for (const t of query.tags) {
      if (entryTags.has(t.toLowerCase())) tagHits += 1
    }
    if (tagHits > 0) {
      score += tagHits * 3.0
      reasons.push(`tag:${tagHits}`)
      contentMatch = true
    }
  }

  // category exact
  if (query.category && fm.category.toLowerCase() === query.category.toLowerCase()) {
    score += 2.0
    reasons.push('category')
    contentMatch = true
  }

  // text token match
  const queryTokens = tokenize(query.text)
  if (queryTokens.length > 0) {
    // title (id slug + alternative title approximation): use id
    const titleTokens = new Set(tokenize(fm.id))
    let titleHits = 0
    for (const t of queryTokens) {
      if (titleTokens.has(t)) titleHits += 1
    }
    if (titleHits > 0) {
      score += titleHits * 1.5
      reasons.push(`title:${titleHits}`)
      contentMatch = true
    }

    // body token (capped to avoid runaway)
    const bodyTokens = tokenize(entry.body)
    const bodySet = new Set(bodyTokens)
    let bodyHits = 0
    for (const t of queryTokens) {
      if (bodySet.has(t)) bodyHits += 1
    }
    const cappedBody = Math.min(bodyHits, 5)
    if (cappedBody > 0) {
      score += cappedBody * 0.5
      reasons.push(`body:${cappedBody}`)
      contentMatch = true
    }
  }

  // 何らかの content match がない場合は score=0 で除外 (quality boost のみでは不可).
  if (!contentMatch) {
    return { score: 0, reasons: [] }
  }

  // quality boost
  score += fm.quality_score * 0.2
  reasons.push(`q:${fm.quality_score}`)

  return { score, reasons }
}

// ============================================================================
// 公開 API
// ============================================================================

/** retrieve — query にマッチする entries を score 降順で返す (Top N). */
export function retrieve(
  index: ReadonlyArray<IndexedKnowledge>,
  query: RetrieveQuery,
): RetrieveResult {
  const topN = query.topN ?? 5
  const filterKinds = query.kindFilter ? new Set(query.kindFilter) : null

  const scored: ScoredHit[] = []
  for (const entry of index) {
    if (filterKinds && !filterKinds.has(entry.frontmatter.kind)) continue
    const { score, reasons } = scoreEntry(entry, query)
    if (score <= 0) continue
    scored.push(Object.freeze({ entry, score, reasons: Object.freeze(reasons.slice()) }))
  }

  scored.sort((a, b) => b.score - a.score)

  return Object.freeze({
    hits: Object.freeze(scored.slice(0, topN)),
    query,
  })
}

/**
 * formatProposalCitation — 提案書テンプレ §(f) 既存ナレッジ参照用 markdown 行を生成.
 *
 * 出力例:
 * ```
 * ## §(f) 既存ナレッジ参照
 * - [PAT-001] hitl-gate-dispatcher (PRJ-019, q=5) — score 4.7 — tag:2, q:5
 * - [DEC-001] priviledge-escalation-4-layers (PRJ-019, q=5) — score 3.2 — title:1, q:5
 * ```
 */
export function formatProposalCitation(result: RetrieveResult): string {
  if (result.hits.length === 0) {
    return '## §(f) 既存ナレッジ参照\n\n_該当ナレッジなし (retrieval miss)._\n'
  }
  const lines: string[] = ['## §(f) 既存ナレッジ参照', '']
  for (const hit of result.hits) {
    const fm = hit.entry.frontmatter
    const score = hit.score.toFixed(2)
    const reasons = hit.reasons.join(', ')
    lines.push(
      `- [${fm.id}] ${fm.category} (${fm.source_prj}, q=${fm.quality_score}) — score ${score} — ${reasons}`,
    )
  }
  return `${lines.join('\n')}\n`
}

/** index 内の総数 / kind 別件数 (健全性監視用). */
export function summarizeIndex(
  index: ReadonlyArray<IndexedKnowledge>,
): Readonly<{ total: number; pattern: number; decision: number; pitfall: number }> {
  let pattern = 0
  let decision = 0
  let pitfall = 0
  for (const e of index) {
    if (e.frontmatter.kind === 'pattern') pattern += 1
    else if (e.frontmatter.kind === 'decision') decision += 1
    else pitfall += 1
  }
  return Object.freeze({ total: index.length, pattern, decision, pitfall })
}
