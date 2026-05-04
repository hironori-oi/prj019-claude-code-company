/**
 * KE-01 schema — ナレッジエントリ schema 定義 + validator (Round 13 Dev-E 前倒し).
 *
 * 関連必須コントロール:
 *   KE-01 (DEC-019-033 ⑪ — Owner-in-the-loop 16 項目のうち、ナレッジ自動抽出の schema 軸)
 *
 * 設計方針:
 *   - YAML frontmatter (metadata) + Markdown 本文 (body) を 1 entry とする。
 *   - 3 サブディレクトリ (patterns / decisions / pitfalls) ごとに必須 metadata 異なる。
 *   - 全 entry 共通: id / source_prj / created_at / tags / category / quality_score。
 *   - schema 検証は zod で実施、構造エラーは KnowledgeSchemaError で throw。
 *   - 本書は **pure validator** に徹する: I/O 副作用なし、Object.freeze でイミュータブル化。
 *
 * 参照:
 *   - `organization/knowledge/EXTRACTION-ROADMAP.md` — v1.5 / v2 抽出 status の起源
 *   - DEC-019-033 拡張: `organization/knowledge/{patterns,decisions,pitfalls}/`
 *
 * 後方互換:
 *   - 既存 lessons-learned (v1.5) は本 schema 適用対象外 (legacy mode)。
 *   - v2 抽出済 entry のみ本 validator で検証する (後方互換 escape hatch)。
 */
import { z } from 'zod'

// ============================================================================
// 共通 metadata
// ============================================================================

/** ナレッジ ID. e.g. PAT-001-hitl-gate-dispatcher / DEC-001-priviledge-... / PIT-001-... */
const knowledgeIdRegex = /^(PAT|DEC|PIT)-\d{3}-[a-z0-9-]+$/
const prjIdRegex = /^(PRJ-\d{3}|COMPANY-WEBSITE)$/
const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/

/** quality_score: 1=C / 2=B- / 3=B / 4=A- / 5=A (5 段階). */
export const QualityScore = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
])
export type QualityScoreType = z.infer<typeof QualityScore>

/**
 * KnowledgeKindSchema — 全 KE-* / HITL-11 module 共通の kind enum SoT
 * (Round 16 Dev-Q gate-11 zod schema merge).
 *
 * 元来 ke-01-schema は discriminatedUnion 内 z.literal('pattern' | 'decision' | 'pitfall')
 * を 3 箇所重複保持し、hitl-11-quarantine.ts も独自に z.enum(...) を保持していた.
 * 本 schema を canonical SoT として再公開し、quarantine 側はこれを再 export する.
 */
export const KnowledgeKindSchema = z.enum(['pattern', 'decision', 'pitfall'])
export type KnowledgeKind = z.infer<typeof KnowledgeKindSchema>

/**
 * Hitl11WebhookKindSchema — HITL 第 11 種 (knowledge_pii_review) の Slack
 * quick-action 受領 payload `kind` 値の canonical SoT (Round 17 Dev-V).
 *
 * 元来 file-hitl11-gate.ts に inline `type Hitl11WebhookKind = ...` で 3 文字列
 * union があったが、runtime 検証 (zod) を通せず webhook receive で string が
 * 直接 if 分岐していた. 本 schema を SoT 化し、file-hitl11-gate は再 export と
 * `safeParse` で受信 payload 検証できる構造へ寄せる.
 */
export const Hitl11WebhookKindSchema = z.enum([
  'knowledge_pii_review_approve',
  'knowledge_pii_review_reject',
  'knowledge_pii_review_partial',
])
export type Hitl11WebhookKind = z.infer<typeof Hitl11WebhookKindSchema>

/**
 * kindToIdPrefix — KnowledgeKind → ID prefix 変換 helper (Round 17 Dev-V).
 *
 * 既存 inline 分岐 (hitl-11-quarantine.ts makeEntryId 内 + organization/knowledge/
 * 配下サンプル) で `pattern`→`PAT` / `decision`→`DEC` / `pitfall`→`PIT` の
 * 3 種マッピングが重複していたため、canonical SoT として helper 化する.
 *
 * 戻り値は **大文字 3 文字 + ハイフン** (e.g. `PAT-`) で knowledgeIdRegex 整合.
 */
const KIND_TO_ID_PREFIX = Object.freeze({
  pattern: 'PAT-',
  decision: 'DEC-',
  pitfall: 'PIT-',
} as const satisfies Record<KnowledgeKind, string>)

export function kindToIdPrefix(kind: KnowledgeKind): 'PAT-' | 'DEC-' | 'PIT-' {
  return KIND_TO_ID_PREFIX[kind]
}

/** 逆変換: ID prefix → KnowledgeKind. 不正 prefix は null. */
export function idPrefixToKind(prefix: string): KnowledgeKind | null {
  const upper = prefix.toUpperCase()
  if (upper === 'PAT-' || upper === 'PAT') return 'pattern'
  if (upper === 'DEC-' || upper === 'DEC') return 'decision'
  if (upper === 'PIT-' || upper === 'PIT') return 'pitfall'
  return null
}

/** 共通 frontmatter (全 3 サブディレクトリ共通). */
export const CommonFrontmatter = z.object({
  id: z.string().regex(knowledgeIdRegex, 'id must match (PAT|DEC|PIT)-NNN-slug'),
  source_prj: z.string().regex(prjIdRegex, 'source_prj must be PRJ-NNN or COMPANY-WEBSITE'),
  created_at: z.string().regex(isoDateRegex, 'created_at must be ISO 8601'),
  tags: z.array(z.string().min(1).max(50)).min(1).max(20),
  category: z.string().min(1).max(50),
  quality_score: QualityScore,
})
export type CommonFrontmatterType = z.infer<typeof CommonFrontmatter>

// ============================================================================
// 各サブディレクトリ固有 frontmatter
// ============================================================================

/** patterns/ 固有: re-use件数 + 適用条件 + 反例 (任意). */
export const PatternFrontmatter = CommonFrontmatter.extend({
  kind: z.literal('pattern'),
  reuse_count: z.number().int().min(0).max(1000).default(0),
  applies_when: z.string().min(1).max(500),
  anti_example: z.string().max(500).optional(),
})
export type PatternFrontmatterType = z.infer<typeof PatternFrontmatter>

/** decisions/ 固有: 文脈 + 代替案 + 採用根拠. */
export const DecisionFrontmatter = CommonFrontmatter.extend({
  kind: z.literal('decision'),
  context: z.string().min(1).max(1000),
  alternatives: z.array(z.string().min(1).max(500)).min(1).max(10),
  rationale: z.string().min(1).max(1000),
  consequences: z.string().max(1000).optional(),
})
export type DecisionFrontmatterType = z.infer<typeof DecisionFrontmatter>

/** pitfalls/ 固有: 症状 + 原因 + 対処 + 再発防止策 (4 要素). */
export const PitfallFrontmatter = CommonFrontmatter.extend({
  kind: z.literal('pitfall'),
  symptom: z.string().min(1).max(500),
  root_cause: z.string().min(1).max(1000),
  remediation: z.string().min(1).max(1000),
  prevention: z.string().min(1).max(1000),
})
export type PitfallFrontmatterType = z.infer<typeof PitfallFrontmatter>

// ============================================================================
// 統合 schema
// ============================================================================

export const KnowledgeFrontmatter = z.discriminatedUnion('kind', [
  PatternFrontmatter,
  DecisionFrontmatter,
  PitfallFrontmatter,
])
export type KnowledgeFrontmatterType = z.infer<typeof KnowledgeFrontmatter>

/** body 制約: 50 文字以上 / 50,000 文字以下 (大型レポート許容). */
export const KnowledgeBody = z.string().min(50).max(50_000)

/** 1 entry = frontmatter + body. */
export const KnowledgeEntry = z.object({
  frontmatter: KnowledgeFrontmatter,
  body: KnowledgeBody,
})
export type KnowledgeEntryType = z.infer<typeof KnowledgeEntry>

// ============================================================================
// validator + error
// ============================================================================

export class KnowledgeSchemaError extends Error {
  override readonly name = 'KnowledgeSchemaError'
  readonly issues: ReadonlyArray<{ path: string; message: string }>
  constructor(issues: Array<{ path: string; message: string }>) {
    super(`KnowledgeSchemaError: ${issues.length} issue(s); first=${issues[0]?.message ?? ''}`)
    this.issues = Object.freeze(issues.slice())
  }
}

/**
 * validateKnowledgeEntry — schema 違反を集約して KnowledgeSchemaError で throw.
 *
 * @param raw - 任意 unknown (JSON / YAML parse 後の object)
 * @returns 検証済 entry (Object.freeze 済)
 */
export function validateKnowledgeEntry(raw: unknown): Readonly<KnowledgeEntryType> {
  const parsed = KnowledgeEntry.safeParse(raw)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }))
    throw new KnowledgeSchemaError(issues)
  }
  return Object.freeze(parsed.data)
}

/** validate のみで pass/fail 判定 (throw しない). */
export function isValidKnowledgeEntry(raw: unknown): boolean {
  return KnowledgeEntry.safeParse(raw).success
}

/** kind を inspect (前段ルーティング用). */
export function detectKnowledgeKind(raw: unknown): 'pattern' | 'decision' | 'pitfall' | 'unknown' {
  if (raw === null || typeof raw !== 'object') return 'unknown'
  const obj = raw as { frontmatter?: { kind?: unknown } }
  const kind = obj.frontmatter?.kind
  if (kind === 'pattern' || kind === 'decision' || kind === 'pitfall') return kind
  return 'unknown'
}
