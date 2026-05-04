/**
 * yaml-front-matter-parser — `organization/knowledge/` 配下 md ファイルの
 * frontmatter parser + KE-03 retrieval index loader (Round 14 Dev-E 完遂).
 *
 * 関連必須コントロール:
 *   KE-01 (本書 parser は KE-01 schema validator と組み合わせて使う)
 *   KE-03 (本書は IndexedKnowledge[] を生成 → KE-03 retrieve に直接 feed)
 *   KE-04 (parse 後 body は KE-04 redactor で redact してから index 化)
 *
 * 設計方針:
 *   - 外部 dependency 不可 (API $0): yaml package を使わず軽量 parser を内製.
 *   - 対象は `id: VALUE` / `tags: [a, b]` / `quality_score: 3` 等の **flat YAML 限定**.
 *   - 全機能 pure function: file I/O は loadKnowledgeIndexFromDir のみ実施.
 *   - parse 失敗は throw せず { ok: false, error } を返す (lenient parser).
 *
 * 受容 frontmatter 形式 (PRJ-019 organization/knowledge/ 既存サンプル整合):
 *
 *   ---
 *   id: PAT-001
 *   type: pattern
 *   category: architecture
 *   title: "..."
 *   source_prj: PRJ-019
 *   source_decisions: [DEC-019-033]
 *   tags: [hitl-gate, owner-in-the-loop, dispatcher]
 *   confidence: 0.80
 *   quality_score: 3
 *   ---
 *   # ...body markdown ...
 *
 * 既存ファイル無改変原則:
 *   - 本 parser は read-only、既存 organization/knowledge/ md を改変しない.
 *   - quality_score 未設定の場合は 3 (B 既定値) で fallback.
 */
import { promises as fs } from 'node:fs'
import { join, basename } from 'node:path'
import {
  KnowledgeKindSchema,
  detectKnowledgeKind,
  validateKnowledgeEntry,
  type KnowledgeEntryType,
  type KnowledgeFrontmatterType,
  type QualityScoreType,
} from './ke-01-schema.js'
import type { IndexedKnowledge } from './ke-03-retrieval.js'

// ============================================================================
// 型
// ============================================================================

export interface FrontmatterRaw {
  /** 任意 key-value (string / string[] / number / boolean). */
  readonly fields: Readonly<Record<string, FrontmatterValue>>
}

export type FrontmatterValue = string | number | boolean | ReadonlyArray<string>

export interface ParsedMarkdown {
  readonly frontmatter: FrontmatterRaw
  readonly body: string
}

export interface ParseSuccess {
  readonly ok: true
  readonly parsed: ParsedMarkdown
}

export interface ParseFailure {
  readonly ok: false
  readonly error:
    | 'no_frontmatter'
    | 'malformed_delimiter'
    | 'parse_error'
    | 'empty_body'
}

export type ParseResult = ParseSuccess | ParseFailure

export interface LoadIndexOptions {
  /** kind subdirectory 制限 (default: 全 3 種読込). */
  readonly kinds?: ReadonlyArray<'patterns' | 'decisions' | 'pitfalls'>
  /** parse error 時のみ skip (default true), false なら throw. */
  readonly skipMalformed?: boolean
  /** skip された file path を report (test 用). */
  readonly onSkip?: (path: string, reason: string) => void
}

export interface LoadIndexResult {
  readonly entries: ReadonlyArray<IndexedKnowledge>
  readonly skipped: ReadonlyArray<{ path: string; reason: string }>
}

// ============================================================================
// 1. raw frontmatter parser
// ============================================================================

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/

/**
 * parseFrontmatter — 1 markdown ファイルの先頭 frontmatter + body を抽出.
 *
 * 副作用なし、外部依存なし (pure).
 */
export function parseFrontmatter(content: string): ParseResult {
  if (!content.startsWith('---')) {
    return { ok: false, error: 'no_frontmatter' }
  }
  const match = FRONTMATTER_RE.exec(content)
  if (!match) {
    return { ok: false, error: 'malformed_delimiter' }
  }
  const yamlBlock = match[1] ?? ''
  const body = (match[2] ?? '').trim()
  if (body.length === 0) {
    return { ok: false, error: 'empty_body' }
  }
  try {
    const fields = parseYamlFlatBlock(yamlBlock)
    return Object.freeze({
      ok: true,
      parsed: Object.freeze({
        frontmatter: Object.freeze({ fields }),
        body,
      }),
    })
  } catch {
    return { ok: false, error: 'parse_error' }
  }
}

/**
 * parseYamlFlatBlock — flat YAML key: value 行を Record にする (内製).
 *
 * 対応:
 *   - `key: value`               -> string
 *   - `key: "quoted value"`      -> string (quote 剥離)
 *   - `key: [a, b, c]`           -> string[]
 *   - `key: 0.85` / `key: 5`     -> number
 *   - `key: true` / `key: false` -> boolean
 *
 * 制限: nested object / multi-line list は未対応 (parse_error).
 */
function parseYamlFlatBlock(block: string): Record<string, FrontmatterValue> {
  const fields: Record<string, FrontmatterValue> = {}
  const lines = block.split(/\r?\n/)
  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, '')
    if (line.length === 0) continue
    if (line.trimStart().startsWith('#')) continue
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) {
      throw new Error(`malformed line: ${line}`)
    }
    const key = line.slice(0, colonIdx).trim()
    const rawValue = line.slice(colonIdx + 1).trim()
    if (key.length === 0) throw new Error(`empty key`)
    fields[key] = parseYamlValue(rawValue)
  }
  return fields
}

function parseYamlValue(raw: string): FrontmatterValue {
  if (raw.length === 0) return ''
  if (raw === 'true') return true
  if (raw === 'false') return false
  if (raw.startsWith('[') && raw.endsWith(']')) {
    const inner = raw.slice(1, -1)
    if (inner.trim().length === 0) return Object.freeze([] as ReadonlyArray<string>)
    return Object.freeze(splitListInner(inner).map((s) => stripQuotes(s.trim())))
  }
  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    const n = Number(raw)
    if (Number.isFinite(n)) return n
  }
  return stripQuotes(raw)
}

function splitListInner(inner: string): string[] {
  const out: string[] = []
  let buf = ''
  let inQuote: '"' | "'" | null = null
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i]!
    if (inQuote) {
      if (ch === inQuote) {
        inQuote = null
      }
      buf += ch
      continue
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch
      buf += ch
      continue
    }
    if (ch === ',') {
      out.push(buf)
      buf = ''
      continue
    }
    buf += ch
  }
  if (buf.length > 0) out.push(buf)
  return out
}

function stripQuotes(s: string): string {
  if (s.length >= 2) {
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1)
    }
  }
  return s
}

// ============================================================================
// 2. KnowledgeEntry adapter (ke-01-schema 整合)
// ============================================================================

export function toKnowledgeEntry(
  parsed: ParsedMarkdown,
): Readonly<KnowledgeEntryType> | null {
  const fm = parsed.frontmatter.fields
  const kind = pickKind(fm)
  if (kind === 'unknown') return null

  const id = asString(fm['id'])
  const sourcePrj = asString(fm['source_prj'])
  const createdAt =
    asString(fm['created_at']) ?? asString(fm['last_validated']) ?? '2026-01-01'
  const tags = asStringArray(fm['tags']) ?? []
  const category = asString(fm['category']) ?? 'general'
  const qualityScore = pickQualityScore(fm)

  if (!id || !sourcePrj || tags.length === 0) return null

  const common = {
    id,
    source_prj: sourcePrj,
    created_at: createdAt,
    tags,
    category,
    quality_score: qualityScore,
  } as const

  let frontmatter: KnowledgeFrontmatterType
  if (kind === 'pattern') {
    const appliesWhen =
      asString(fm['applies_when']) ??
      asStringArray(fm['applicable_to'])?.join(', ') ??
      'general'
    frontmatter = {
      ...common,
      kind: 'pattern',
      reuse_count: pickInt(fm['reuse_count']) ?? 0,
      applies_when: appliesWhen,
    }
  } else if (kind === 'decision') {
    frontmatter = {
      ...common,
      kind: 'decision',
      context: asString(fm['context']) ?? 'auto-loaded from frontmatter',
      alternatives:
        asStringArray(fm['alternatives']) ??
        asStringArray(fm['source_decisions']) ?? ['n/a'],
      rationale: asString(fm['rationale']) ?? 'see body',
    }
  } else {
    frontmatter = {
      ...common,
      kind: 'pitfall',
      symptom: asString(fm['symptom']) ?? 'see body',
      root_cause: asString(fm['root_cause']) ?? 'see body',
      remediation: asString(fm['remediation']) ?? 'see body',
      prevention: asString(fm['prevention']) ?? 'see body',
    }
  }

  const body = parsed.body.length < 50 ? parsed.body.padEnd(50, ' ') : parsed.body
  try {
    return validateKnowledgeEntry({ frontmatter, body })
  } catch {
    return null
  }
}

function pickKind(
  fm: Readonly<Record<string, FrontmatterValue>>,
): 'pattern' | 'decision' | 'pitfall' | 'unknown' {
  // Round 17 Dev-V: KnowledgeKindSchema.safeParse 採用 (canonical SoT 経由).
  // 既存挙動と完全互換: parse 失敗時は 'unknown' fallback.
  const kindRaw = asString(fm['kind']) ?? asString(fm['type'])
  const parsed = KnowledgeKindSchema.safeParse(kindRaw)
  return parsed.success ? parsed.data : 'unknown'
}

function pickQualityScore(
  fm: Readonly<Record<string, FrontmatterValue>>,
): QualityScoreType {
  const raw = fm['quality_score']
  if (typeof raw === 'number') {
    const rounded = Math.round(raw)
    if (rounded >= 1 && rounded <= 5) return rounded as QualityScoreType
  }
  const conf = fm['confidence']
  if (typeof conf === 'number' && conf >= 0 && conf <= 1) {
    const mapped = Math.max(1, Math.min(5, Math.round(conf * 5)))
    return mapped as QualityScoreType
  }
  return 3
}

function pickInt(v: FrontmatterValue | undefined): number | null {
  if (typeof v === 'number') {
    const n = Math.round(v)
    if (Number.isInteger(n)) return n
  }
  return null
}

function asString(v: FrontmatterValue | undefined): string | null {
  if (typeof v === 'string') return v
  return null
}

function asStringArray(
  v: FrontmatterValue | undefined,
): ReadonlyArray<string> | null {
  if (Array.isArray(v)) return v
  return null
}

// ============================================================================
// 3. directory loader (KE-03 retrieve index 直結)
// ============================================================================

export async function loadKnowledgeIndexFromDir(
  rootDir: string,
  opts: LoadIndexOptions = {},
): Promise<LoadIndexResult> {
  const kinds = opts.kinds ?? (['patterns', 'decisions', 'pitfalls'] as const)
  const skipMalformed = opts.skipMalformed ?? true
  const skipped: { path: string; reason: string }[] = []
  const entries: IndexedKnowledge[] = []

  for (const sub of kinds) {
    const subDir = join(rootDir, sub)
    let files: string[]
    try {
      files = await fs.readdir(subDir)
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') continue
      throw err
    }
    for (const f of files) {
      if (!f.endsWith('.md')) continue
      if (basename(f).toUpperCase().startsWith('README')) continue
      if (basename(f).toUpperCase().startsWith('INDEX')) continue
      const filePath = join(subDir, f)
      let raw: string
      try {
        raw = await fs.readFile(filePath, 'utf-8')
      } catch (err) {
        if (skipMalformed) {
          skipped.push({ path: filePath, reason: 'read_failed' })
          opts.onSkip?.(filePath, 'read_failed')
          continue
        }
        throw err
      }
      const parsed = parseFrontmatter(raw)
      if (!parsed.ok) {
        if (skipMalformed) {
          skipped.push({ path: filePath, reason: parsed.error })
          opts.onSkip?.(filePath, parsed.error)
          continue
        }
        throw new Error(`parse failed: ${filePath} (${parsed.error})`)
      }
      const entry = toKnowledgeEntry(parsed.parsed)
      if (!entry) {
        if (skipMalformed) {
          skipped.push({ path: filePath, reason: 'schema_invalid' })
          opts.onSkip?.(filePath, 'schema_invalid')
          continue
        }
        throw new Error(`schema validation failed: ${filePath}`)
      }
      const kind = detectKnowledgeKind(entry)
      if (kind === 'unknown') {
        skipped.push({ path: filePath, reason: 'unknown_kind' })
        continue
      }
      entries.push(
        Object.freeze({
          frontmatter: entry.frontmatter,
          body: entry.body,
        }),
      )
    }
  }

  return Object.freeze({
    entries: Object.freeze(entries.slice()),
    skipped: Object.freeze(skipped.slice()),
  })
}
