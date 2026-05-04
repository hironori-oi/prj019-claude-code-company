/**
 * Hitl11Quarantine test (Round 15 Dev-N).
 *
 * 検証項目 (8 tests):
 *  1. quarantineDraft: redacted body を quarantine に書き込み + manifest 登録
 *  2. quarantineDraft: 複数 entry でも manifest に蓄積
 *  3. approveEntry: knowledge subdir へ rename 移動 + state=moved
 *  4. approveEntry: 不存在 entry で error
 *  5. rejectEntry: redaction tag 付与 + rejected/ subdir へ移動 + state=rejected
 *  6. rejectEntry: moved 済 entry を reject 不可
 *  7. markPartialRedact: state=partial_redact + tags 更新
 *  8. manifest schema: zod 違反データはロード時 fallback (空 manifest)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  Hitl11Quarantine,
  ManifestSchema,
} from '../../knowledge/hitl-11-quarantine.js'
import type { KnowledgeDraft } from '../../knowledge/ke-02-trigger.js'

function tmpDir(prefix: string): string {
  return join(
    tmpdir(),
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  )
}

const draftPattern: KnowledgeDraft = {
  kind: 'pattern',
  sourcePrj: 'PRJ-019',
  title: 'sample pattern',
  bodyRedacted: 'A redacted body suitable for tests, exceeding fifty characters total length.',
  piiHitCount: 0,
  tags: ['security', 'governance'],
  requiresHitl11: false,
}

const draftDecisionWithPii: KnowledgeDraft = {
  kind: 'decision',
  sourcePrj: 'PRJ-019',
  title: 'has pii decision',
  bodyRedacted: 'redacted decision body with <EMAIL> placeholder and additional content here.',
  piiHitCount: 2,
  tags: ['governance'],
  requiresHitl11: true,
}

const draftPitfall: KnowledgeDraft = {
  kind: 'pitfall',
  sourcePrj: 'PRJ-019',
  title: 'tricky pitfall',
  bodyRedacted: 'redacted pitfall body for HITL-11 quarantine spec verification only.',
  piiHitCount: 1,
  tags: ['security'],
  requiresHitl11: true,
}

describe('Hitl11Quarantine', () => {
  let quarantineRoot: string
  let knowledgeRoot: string
  let q: Hitl11Quarantine

  beforeEach(async () => {
    quarantineRoot = tmpDir('clawbridge-quarantine')
    knowledgeRoot = tmpDir('clawbridge-knowledge')
    await fs.mkdir(quarantineRoot, { recursive: true })
    await fs.mkdir(knowledgeRoot, { recursive: true })
    q = new Hitl11Quarantine({ quarantineRoot, knowledgeRoot })
  })

  afterEach(async () => {
    for (const d of [quarantineRoot, knowledgeRoot]) {
      try {
        await fs.rm(d, { recursive: true, force: true })
      } catch {
        // ignore
      }
    }
  })

  it('1. quarantineDraft writes redacted body and registers manifest entry', async () => {
    const r = await q.quarantineDraft(draftPattern)
    expect(r.state).toBe('pending')
    expect(r.kind).toBe('pattern')
    const body = await fs.readFile(r.bodyPath, 'utf-8')
    expect(body).toContain('redacted body')
    expect(body).toContain('source_prj: PRJ-019')
    const list = await q.listEntries()
    expect(list.length).toBe(1)
    expect(list[0]?.state).toBe('pending')
  })

  it('2. quarantineDraft accumulates multiple entries in manifest', async () => {
    await q.quarantineDraft(draftPattern)
    await q.quarantineDraft(draftDecisionWithPii)
    await q.quarantineDraft(draftPitfall)
    const list = await q.listEntries()
    expect(list.length).toBe(3)
    const kinds = list.map((e) => e.kind).sort()
    expect(kinds).toEqual(['decision', 'pattern', 'pitfall'])
  })

  it('3. approveEntry moves body to knowledge subdir and updates manifest', async () => {
    const qres = await q.quarantineDraft(draftPattern)
    const ar = await q.approveEntry(qres.entryId)
    expect(ar.knowledgePath).toContain('patterns/')
    const destAbsPath = join(knowledgeRoot, ar.knowledgePath)
    const exists = await fs
      .access(destAbsPath)
      .then(() => true)
      .catch(() => false)
    expect(exists).toBe(true)
    // quarantine body removed
    const srcExists = await fs
      .access(qres.bodyPath)
      .then(() => true)
      .catch(() => false)
    expect(srcExists).toBe(false)
    // manifest state moved
    const entry = await q.getEntry(qres.entryId)
    expect(entry?.state).toBe('moved')
    expect(entry?.knowledgePath).toBe(ar.knowledgePath)
  })

  it('4. approveEntry on missing entry throws', async () => {
    await expect(q.approveEntry('NOPE-XXX')).rejects.toThrow(/not found/)
  })

  it('5. rejectEntry adds redaction tags and moves body to rejected/', async () => {
    const qres = await q.quarantineDraft(draftDecisionWithPii)
    const rr = await q.rejectEntry(qres.entryId, {
      reason: 'too risky',
      redactionTags: ['EMAIL_ADDR', 'NAME'],
    })
    expect(rr.redactionTags).toContain('PII_REJECTED')
    expect(rr.redactionTags).toContain('EMAIL_ADDR')
    const rejectedExists = await fs
      .access(rr.rejectedPath)
      .then(() => true)
      .catch(() => false)
    expect(rejectedExists).toBe(true)
    const entry = await q.getEntry(qres.entryId)
    expect(entry?.state).toBe('rejected')
    expect(entry?.rejectReason).toBe('too risky')
  })

  it('6. rejectEntry on already-moved entry throws', async () => {
    const qres = await q.quarantineDraft(draftPattern)
    await q.approveEntry(qres.entryId)
    await expect(
      q.rejectEntry(qres.entryId, { reason: 'late reject' }),
    ).rejects.toThrow(/already-moved/)
  })

  it('7. markPartialRedact transitions state and stores tags', async () => {
    const qres = await q.quarantineDraft(draftPitfall)
    await q.markPartialRedact(qres.entryId, ['EMAIL_ADDR'])
    const entry = await q.getEntry(qres.entryId)
    expect(entry?.state).toBe('partial_redact')
    expect(entry?.redactionTags).toEqual(['EMAIL_ADDR'])
  })

  it('8. ManifestSchema rejects malformed manifests (parse failure → fallback)', async () => {
    // 直接 manifest を破損データに書き換えて load 経路の resilience を確認
    const manifestPath = join(quarantineRoot, 'manifest.json')
    await fs.writeFile(
      manifestPath,
      JSON.stringify({ schemaVersion: 99, entries: 'not an array' }),
      'utf-8',
    )
    // schema validation
    const parsed = ManifestSchema.safeParse(
      JSON.parse(await fs.readFile(manifestPath, 'utf-8')),
    )
    expect(parsed.success).toBe(false)
    // listEntries は破損時 empty で resilient
    const list = await q.listEntries()
    expect(list.length).toBe(0)
  })
})
