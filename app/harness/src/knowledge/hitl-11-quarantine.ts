/**
 * hitl-11-quarantine — HITL 第 11 種 (knowledge_pii_review) の隔離 / approve / reject
 * の物理 file I/O 層 (Round 15 Dev-N 第 3 波).
 *
 * 関連必須コントロール:
 *   HITL-11 (DEC-019-033 ⑪ — Owner-in-the-loop 16 項目のうち、PII review gate)
 *   KE-04   (本層は KE-04 redactor の検出結果を input とし、redacted body を保存)
 *   KE-02   (本層は KE-02 trigger 後段で発火する)
 *
 * 設計方針:
 *   - file-hitl11-gate.ts (Round 14 Dev-E) の **decision evaluator** と分離した
 *     **隔離 file I/O 層** として独立実装. gate decision とは責務分離.
 *   - PII 候補は **隔離ディレクトリ** へ移動 + manifest.json に記録.
 *     - approve 時: `organization/knowledge/{patterns|decisions|pitfalls}/` へ移動可能.
 *     - reject 時: 隔離維持 + redaction tag 付与, knowledge へは移動しない.
 *     - partial 時: 一部のみ approve, 残りは隔離維持.
 *   - manifest schema は zod で strict 検証.
 *
 * 直接 home dir 配下を破壊しないよう、quarantine root は injection 可能.
 *
 * file 配置:
 *   <quarantineRoot>/manifest.json                       — 全 entry の状態管理
 *   <quarantineRoot>/<entryId>.md                        — redacted body (Markdown)
 *   <quarantineRoot>/rejected/<entryId>.md               — reject 後の保存先
 *
 * approve 時の knowledge dir 配置:
 *   <knowledgeRoot>/patterns/<entryId>.md
 *   <knowledgeRoot>/decisions/<entryId>.md
 *   <knowledgeRoot>/pitfalls/<entryId>.md
 */
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import type { KnowledgeDraft } from './ke-02-trigger.js'
import { ensureDirSelf, fileExists, loadJson, saveJson } from '../fs-store.js'

// ============================================================================
// zod schema
// ============================================================================

export const ManifestEntryStateSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'partial_redact',
  'moved',
])
export type ManifestEntryState = z.infer<typeof ManifestEntryStateSchema>

export const ManifestEntryKindSchema = z.enum(['pattern', 'decision', 'pitfall'])
export type ManifestEntryKind = z.infer<typeof ManifestEntryKindSchema>

export const ManifestEntrySchema = z.object({
  entryId: z.string().min(3),
  kind: ManifestEntryKindSchema,
  sourcePrj: z.string().min(3),
  title: z.string().min(1),
  piiHitCount: z.number().int().nonnegative(),
  tags: z.array(z.string()),
  state: ManifestEntryStateSchema,
  redactionTags: z.array(z.string()).optional(),
  rejectReason: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  /** approve 後の最終配置 path (relative). */
  knowledgePath: z.string().optional(),
})
export type ManifestEntry = z.infer<typeof ManifestEntrySchema>

export const ManifestSchema = z.object({
  schemaVersion: z.literal(1),
  entries: z.array(ManifestEntrySchema),
})
export type Manifest = z.infer<typeof ManifestSchema>

// ============================================================================
// 型 (内部)
// ============================================================================

export interface QuarantineOptions {
  readonly quarantineRoot: string
  readonly knowledgeRoot: string
  readonly now?: () => Date
}

export interface QuarantineResult {
  readonly entryId: string
  readonly kind: ManifestEntryKind
  readonly state: ManifestEntryState
  readonly bodyPath: string
}

export interface ApproveResult {
  readonly entryId: string
  readonly knowledgePath: string
}

export interface RejectResult {
  readonly entryId: string
  readonly redactionTags: ReadonlyArray<string>
  readonly rejectedPath: string
}

// ============================================================================
// 実装
// ============================================================================

const MANIFEST_VERSION = 1 as const

/**
 * Hitl11Quarantine — quarantine root に対する CRUD 層.
 *
 * gate decision 層 (file-hitl11-gate.ts) は本クラスを呼び出して
 * approve/reject に応じた physical move + manifest 更新を実施する.
 */
export class Hitl11Quarantine {
  private readonly quarantineRoot: string
  private readonly knowledgeRoot: string
  private readonly now: () => Date

  constructor(opts: QuarantineOptions) {
    this.quarantineRoot = opts.quarantineRoot
    this.knowledgeRoot = opts.knowledgeRoot
    this.now = opts.now ?? (() => new Date())
  }

  /** quarantine + manifest にエントリを登録. body は redacted のみ書き込み. */
  async quarantineDraft(draft: KnowledgeDraft): Promise<QuarantineResult> {
    await ensureDirSelf(this.quarantineRoot)
    const entryId = this.makeEntryId(draft)
    const bodyPath = this.bodyPath(entryId)
    await fs.writeFile(bodyPath, this.formatBody(draft, entryId), 'utf-8')

    const ts = this.now().toISOString()
    const entry: ManifestEntry = {
      entryId,
      kind: draft.kind,
      sourcePrj: draft.sourcePrj,
      title: draft.title,
      piiHitCount: draft.piiHitCount,
      tags: Array.from(draft.tags),
      state: 'pending',
      createdAt: ts,
      updatedAt: ts,
    }
    await this.upsertEntry(entry)
    return Object.freeze({
      entryId,
      kind: draft.kind,
      state: 'pending',
      bodyPath,
    })
  }

  /**
   * approve — quarantine から organization/knowledge/{kind 別}/ へ移動.
   * manifest state を 'approved' → 'moved' に更新, knowledgePath を記録.
   */
  async approveEntry(entryId: string): Promise<ApproveResult> {
    const manifest = await this.loadManifest()
    const idx = manifest.entries.findIndex((e) => e.entryId === entryId)
    if (idx === -1) throw new Error(`entry not found: ${entryId}`)
    const entry = manifest.entries[idx]!
    if (entry.state === 'rejected') {
      throw new Error(`cannot approve rejected entry: ${entryId}`)
    }
    const subdir = this.kindToSubdir(entry.kind)
    const destDir = join(this.knowledgeRoot, subdir)
    await ensureDirSelf(destDir)
    const destPath = join(destDir, `${entryId}.md`)
    const srcPath = this.bodyPath(entryId)
    if (!(await fileExists(srcPath))) {
      throw new Error(`quarantine body missing for ${entryId}`)
    }
    await fs.rename(srcPath, destPath).catch(async () => {
      // rename across drives may fail; fallback to copy + unlink.
      const content = await fs.readFile(srcPath, 'utf-8')
      await fs.writeFile(destPath, content, 'utf-8')
      await fs.unlink(srcPath)
    })
    const knowledgePath = join(subdir, `${entryId}.md`).replace(/\\/g, '/')
    const updated: ManifestEntry = {
      ...entry,
      state: 'moved',
      knowledgePath,
      updatedAt: this.now().toISOString(),
    }
    manifest.entries[idx] = updated
    await this.saveManifest(manifest)
    return Object.freeze({ entryId, knowledgePath })
  }

  /**
   * reject — quarantine 維持 + redaction tag 付与 + rejected/ subdir へ移動.
   * knowledge へは移動しない. tags は audit / 再 review 用に保持.
   */
  async rejectEntry(
    entryId: string,
    args: { reason: string; redactionTags?: ReadonlyArray<string> },
  ): Promise<RejectResult> {
    const manifest = await this.loadManifest()
    const idx = manifest.entries.findIndex((e) => e.entryId === entryId)
    if (idx === -1) throw new Error(`entry not found: ${entryId}`)
    const entry = manifest.entries[idx]!
    if (entry.state === 'moved') {
      throw new Error(`cannot reject already-moved entry: ${entryId}`)
    }
    const rejectedDir = join(this.quarantineRoot, 'rejected')
    await ensureDirSelf(rejectedDir)
    const srcPath = this.bodyPath(entryId)
    const destPath = join(rejectedDir, `${entryId}.md`)
    if (await fileExists(srcPath)) {
      await fs.rename(srcPath, destPath).catch(async () => {
        const content = await fs.readFile(srcPath, 'utf-8')
        await fs.writeFile(destPath, content, 'utf-8')
        await fs.unlink(srcPath)
      })
    }
    const tags = Object.freeze([
      'PII_REJECTED',
      ...(args.redactionTags ? Array.from(args.redactionTags) : []),
    ])
    const updated: ManifestEntry = {
      ...entry,
      state: 'rejected',
      rejectReason: args.reason,
      redactionTags: Array.from(tags),
      updatedAt: this.now().toISOString(),
    }
    manifest.entries[idx] = updated
    await this.saveManifest(manifest)
    return Object.freeze({
      entryId,
      redactionTags: tags,
      rejectedPath: destPath,
    })
  }

  /** entry を partial_redact に遷移 (quarantine 維持、再 redaction 待機). */
  async markPartialRedact(
    entryId: string,
    redactionTags: ReadonlyArray<string>,
  ): Promise<void> {
    const manifest = await this.loadManifest()
    const idx = manifest.entries.findIndex((e) => e.entryId === entryId)
    if (idx === -1) throw new Error(`entry not found: ${entryId}`)
    const entry = manifest.entries[idx]!
    const updated: ManifestEntry = {
      ...entry,
      state: 'partial_redact',
      redactionTags: Array.from(redactionTags),
      updatedAt: this.now().toISOString(),
    }
    manifest.entries[idx] = updated
    await this.saveManifest(manifest)
  }

  /** manifest 一覧 (test / dashboard 用、Object.freeze 済 copy). */
  async listEntries(): Promise<ReadonlyArray<ManifestEntry>> {
    const manifest = await this.loadManifest()
    return Object.freeze(manifest.entries.slice())
  }

  /** 特定 entry を取得. */
  async getEntry(entryId: string): Promise<ManifestEntry | null> {
    const manifest = await this.loadManifest()
    return manifest.entries.find((e) => e.entryId === entryId) ?? null
  }

  // ==========================================================================
  // internal helpers
  // ==========================================================================

  private bodyPath(entryId: string): string {
    return join(this.quarantineRoot, `${entryId}.md`)
  }

  private manifestPath(): string {
    return join(this.quarantineRoot, 'manifest.json')
  }

  private async loadManifest(): Promise<Manifest> {
    const raw = await loadJson<unknown>(this.manifestPath(), {
      schemaVersion: MANIFEST_VERSION,
      entries: [],
    })
    const parsed = ManifestSchema.safeParse(raw)
    if (parsed.success) return parsed.data
    // 破損時は空 manifest にフォールバック (audit でも検知される).
    return { schemaVersion: MANIFEST_VERSION, entries: [] }
  }

  private async saveManifest(manifest: Manifest): Promise<void> {
    // schema validation を必ず通す (write-time guard).
    const validated = ManifestSchema.parse(manifest)
    await saveJson(this.manifestPath(), validated)
  }

  private async upsertEntry(entry: ManifestEntry): Promise<void> {
    const manifest = await this.loadManifest()
    const idx = manifest.entries.findIndex((e) => e.entryId === entry.entryId)
    if (idx === -1) manifest.entries.push(entry)
    else manifest.entries[idx] = entry
    await this.saveManifest(manifest)
  }

  private makeEntryId(draft: KnowledgeDraft): string {
    const prefix = draft.kind === 'pattern' ? 'PAT' : draft.kind === 'decision' ? 'DEC' : 'PIT'
    const slug = draft.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30)
    const ts = this.now()
      .toISOString()
      .replace(/[-:T]/g, '')
      .slice(0, 14)
    return `${prefix}-${draft.sourcePrj}-${slug || 'draft'}-${ts}`
  }

  private kindToSubdir(kind: ManifestEntryKind): 'patterns' | 'decisions' | 'pitfalls' {
    return kind === 'pattern' ? 'patterns' : kind === 'decision' ? 'decisions' : 'pitfalls'
  }

  private formatBody(draft: KnowledgeDraft, entryId: string): string {
    const fmKind = draft.kind
    const tags = draft.tags.length > 0 ? Array.from(draft.tags) : ['general']
    const lines: string[] = []
    lines.push('---')
    lines.push(`kind: ${fmKind}`)
    lines.push(`id: ${entryId}`)
    lines.push(`source_prj: ${draft.sourcePrj}`)
    lines.push(`title: ${JSON.stringify(draft.title)}`)
    lines.push(`tags: [${tags.map((t) => JSON.stringify(t)).join(', ')}]`)
    lines.push(`pii_hit_count: ${draft.piiHitCount}`)
    lines.push(`requires_hitl_11: ${draft.requiresHitl11}`)
    lines.push('---')
    lines.push('')
    lines.push(draft.bodyRedacted)
    return lines.join('\n')
  }
}
