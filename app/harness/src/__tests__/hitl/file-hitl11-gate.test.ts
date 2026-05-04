/**
 * FileHitl11Gate test (Round 14 Dev-E).
 *
 * 検証項目 (18 tests):
 *  1. requestReview: file decision (approve) で resolve
 *  2. requestReview: file decision (reject) で resolve
 *  3. requestReview: file decision (partial) で resolve
 *  4. requestReview: timeout で autoEvaluate fallback
 *  5. requestReview: timeout で audit append される (timed_out)
 *  6. receiveWebhookDecision: approve payload で decision file 生成
 *  7. receiveWebhookDecision: reject payload で reject_reason を保持
 *  8. receiveWebhookDecision: partial payload で partial_redact_terms を保持
 *  9. receiveWebhookDecision: nonce_mismatch で error
 * 10. receiveWebhookDecision: expired で error
 * 11. receiveWebhookDecision: unknown_gate で error
 * 12. receiveWebhookDecision: reject without reason で missing_reason error
 * 13. receiveWebhookDecision: partial without terms で missing_terms error
 * 14. listPending: pending file が登録される
 * 15. listAudit: 決定後 audit に append される
 * 16. decideViaFile: 直接 file 配置で decision 反映
 * 17. requestReview: webhook 経由の approve で source='file' (decision file 経由)
 * 18. cleanup: decision 確定後 pending file が削除される
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  FileHitl11Gate,
  type Hitl11WebhookPayload,
} from '../../hitl/file-hitl11-gate.js'
import type { KnowledgeDraft } from '../../knowledge/ke-02-trigger.js'

function tmpDir(): string {
  return join(
    tmpdir(),
    `clawbridge-hitl11-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
}

const draftZero: KnowledgeDraft = {
  kind: 'pattern',
  sourcePrj: 'PRJ-019',
  title: 'no-pii',
  bodyRedacted: 'all clean text-content',
  piiHitCount: 0,
  tags: ['security'],
  requiresHitl11: false,
}

const draftWithPii: KnowledgeDraft = {
  kind: 'decision',
  sourcePrj: 'PRJ-019',
  title: 'has-pii',
  bodyRedacted: 'redacted <EMAIL> body',
  piiHitCount: 2,
  tags: ['governance'],
  requiresHitl11: true,
}

describe('FileHitl11Gate', () => {
  let dir: string
  beforeEach(async () => {
    dir = tmpDir()
    await fs.mkdir(dir, { recursive: true })
  })
  afterEach(async () => {
    try {
      await fs.rm(dir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  })

  it('1. resolves via file approve decision', async () => {
    const gate = new FileHitl11Gate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 5000,
    })
    setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        if (ids[0]) await gate.decideViaFile(ids[0], 'approve')
      })()
    }, 80)
    const out = await gate.requestReview({
      drafts: [draftZero],
      target_file: 'organization/knowledge/patterns/sample.md',
      prjId: 'PRJ-019',
    })
    expect(out.result.decision).toBe('approve')
    expect(out.source).toBe('file')
  })

  it('2. resolves via file reject decision', async () => {
    const gate = new FileHitl11Gate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 5000,
    })
    setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        if (ids[0])
          await gate.decideViaFile(ids[0], 'reject', { reject_reason: 'too risky' })
      })()
    }, 80)
    const out = await gate.requestReview({
      drafts: [draftWithPii],
      target_file: 'organization/knowledge/decisions/sample.md',
      prjId: 'PRJ-019',
    })
    expect(out.result.decision).toBe('reject')
  })

  it('3. resolves via file partial decision', async () => {
    const gate = new FileHitl11Gate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 5000,
    })
    setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        if (ids[0])
          await gate.decideViaFile(ids[0], 'partial_redact', {
            actions: ['accept', 'redact_more'],
          })
      })()
    }, 80)
    const out = await gate.requestReview({
      drafts: [draftZero, draftWithPii],
      target_file: 'organization/knowledge/patterns/mixed.md',
      prjId: 'PRJ-019',
    })
    expect(out.result.decision).toBe('partial_redact')
  })

  it('4. timeout falls back to autoEvaluate', async () => {
    const gate = new FileHitl11Gate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 100,
    })
    const out = await gate.requestReview({
      drafts: [draftZero],
      target_file: 'organization/knowledge/patterns/x.md',
      prjId: 'PRJ-019',
    })
    expect(out.source).toBe('timeout')
    expect(out.result.decision).toBe('approve') // autoEvaluate: 0 PII
  })

  it('5. timeout appends timed_out to audit', async () => {
    const gate = new FileHitl11Gate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 80,
    })
    await gate.requestReview({
      drafts: [draftZero],
      target_file: 'a.md',
      prjId: 'PRJ-019',
    })
    const audit = await gate.listAudit()
    expect(audit.length).toBe(1)
    expect(audit[0]?.decision).toBe('timed_out')
  })

  it('6. receiveWebhookDecision: approve payload creates decision file', async () => {
    const gate = new FileHitl11Gate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 5000,
    })
    setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        const id = ids[0]
        if (!id) return
        const reqPath = join(dir, `${id}.json`)
        const req = JSON.parse(await fs.readFile(reqPath, 'utf-8')) as {
          gate_id: string
          nonce: string
          expiresAt: string
        }
        const payload: Hitl11WebhookPayload = {
          kind: 'knowledge_pii_review_approve',
          gate_id: req.gate_id,
          target_file: 'a.md',
          nonce: req.nonce,
          issuedAt: new Date().toISOString(),
          expiresAt: req.expiresAt,
        }
        const r = await gate.receiveWebhookDecision(payload, { reviewer: 'Owner' })
        expect(r.ok).toBe(true)
      })()
    }, 80)
    const out = await gate.requestReview({
      drafts: [draftZero],
      target_file: 'a.md',
      prjId: 'PRJ-019',
    })
    expect(out.result.decision).toBe('approve')
  })

  it('7. receiveWebhookDecision: reject payload preserves reject_reason', async () => {
    const gate = new FileHitl11Gate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 5000,
    })
    setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        const id = ids[0]
        if (!id) return
        const reqPath = join(dir, `${id}.json`)
        const req = JSON.parse(await fs.readFile(reqPath, 'utf-8')) as {
          gate_id: string
          nonce: string
          expiresAt: string
        }
        await gate.receiveWebhookDecision({
          kind: 'knowledge_pii_review_reject',
          gate_id: req.gate_id,
          target_file: 'a.md',
          nonce: req.nonce,
          issuedAt: new Date().toISOString(),
          expiresAt: req.expiresAt,
          reject_reason: 'PII overload',
        })
      })()
    }, 80)
    const out = await gate.requestReview({
      drafts: [draftWithPii],
      target_file: 'a.md',
      prjId: 'PRJ-019',
    })
    expect(out.result.decision).toBe('reject')
    const audit = await gate.listAudit()
    expect(audit[0]?.reject_reason).toBe('PII overload')
  })

  it('8. receiveWebhookDecision: partial payload accepted', async () => {
    const gate = new FileHitl11Gate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 5000,
    })
    setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        const id = ids[0]
        if (!id) return
        const reqPath = join(dir, `${id}.json`)
        const req = JSON.parse(await fs.readFile(reqPath, 'utf-8')) as {
          gate_id: string
          nonce: string
          expiresAt: string
        }
        await gate.receiveWebhookDecision({
          kind: 'knowledge_pii_review_partial',
          gate_id: req.gate_id,
          target_file: 'a.md',
          nonce: req.nonce,
          issuedAt: new Date().toISOString(),
          expiresAt: req.expiresAt,
          partial_redact_terms: ['name', 'email'],
          keep_terms: [],
        })
      })()
    }, 80)
    const out = await gate.requestReview({
      drafts: [draftZero, draftWithPii],
      target_file: 'a.md',
      prjId: 'PRJ-019',
    })
    expect(out.result.decision).toBe('partial_redact')
  })

  it('9. receiveWebhookDecision: nonce_mismatch returns error', async () => {
    const gate = new FileHitl11Gate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 5000,
    })
    let validationResult: { ok: boolean; error?: string } | null = null
    setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        const id = ids[0]
        if (!id) return
        const reqPath = join(dir, `${id}.json`)
        const req = JSON.parse(await fs.readFile(reqPath, 'utf-8')) as {
          gate_id: string
          expiresAt: string
        }
        validationResult = await gate.receiveWebhookDecision({
          kind: 'knowledge_pii_review_approve',
          gate_id: req.gate_id,
          target_file: 'a.md',
          nonce: 'WRONG_NONCE_xxxx',
          issuedAt: new Date().toISOString(),
          expiresAt: req.expiresAt,
        })
        // 並行で正規 nonce でも送って resolve させる (timeout 抑止)
        if (id) await gate.decideViaFile(id, 'approve')
      })()
    }, 80)
    await gate.requestReview({
      drafts: [draftZero],
      target_file: 'a.md',
      prjId: 'PRJ-019',
    })
    expect(validationResult).not.toBeNull()
    expect(validationResult?.ok).toBe(false)
    expect(validationResult?.error).toBe('nonce_mismatch')
  })

  it('10. receiveWebhookDecision: expired returns error', async () => {
    let nowMs = Date.parse('2026-05-04T00:00:00Z')
    const gate = new FileHitl11Gate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 1_000,
      now: () => new Date(nowMs),
    })
    let validationResult: { ok: boolean; error?: string } | null = null
    setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        const id = ids[0]
        if (!id) return
        const reqPath = join(dir, `${id}.json`)
        const req = JSON.parse(await fs.readFile(reqPath, 'utf-8')) as {
          gate_id: string
          nonce: string
          expiresAt: string
        }
        // advance now beyond expiresAt
        nowMs = Date.parse(req.expiresAt) + 5000
        validationResult = await gate.receiveWebhookDecision({
          kind: 'knowledge_pii_review_approve',
          gate_id: req.gate_id,
          target_file: 'a.md',
          nonce: req.nonce,
          issuedAt: new Date(nowMs).toISOString(),
          expiresAt: req.expiresAt,
        })
      })()
    }, 80)
    await gate.requestReview({
      drafts: [draftZero],
      target_file: 'a.md',
      prjId: 'PRJ-019',
    })
    expect(validationResult).not.toBeNull()
    expect(validationResult?.ok).toBe(false)
    expect(validationResult?.error).toBe('expired')
  })

  it('11. receiveWebhookDecision: unknown_gate returns error', async () => {
    const gate = new FileHitl11Gate({ pendingDir: dir })
    const r = await gate.receiveWebhookDecision({
      kind: 'knowledge_pii_review_approve',
      gate_id: 'GATE-11-NONEXISTENT',
      target_file: 'a.md',
      nonce: 'abcdefgh12345678',
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe('unknown_gate')
  })

  it('12. receiveWebhookDecision: reject without reason returns missing_reason', async () => {
    const gate = new FileHitl11Gate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 5000,
    })
    let validationResult: { ok: boolean; error?: string } | null = null
    setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        const id = ids[0]
        if (!id) return
        const reqPath = join(dir, `${id}.json`)
        const req = JSON.parse(await fs.readFile(reqPath, 'utf-8')) as {
          gate_id: string
          nonce: string
          expiresAt: string
        }
        validationResult = await gate.receiveWebhookDecision({
          kind: 'knowledge_pii_review_reject',
          gate_id: req.gate_id,
          target_file: 'a.md',
          nonce: req.nonce,
          issuedAt: new Date().toISOString(),
          expiresAt: req.expiresAt,
          // no reject_reason
        })
        if (id) await gate.decideViaFile(id, 'approve')
      })()
    }, 80)
    await gate.requestReview({
      drafts: [draftZero],
      target_file: 'a.md',
      prjId: 'PRJ-019',
    })
    expect(validationResult).not.toBeNull()
    expect(validationResult?.error).toBe('missing_reason')
  })

  it('13. receiveWebhookDecision: partial without terms returns missing_terms', async () => {
    const gate = new FileHitl11Gate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 5000,
    })
    let validationResult: { ok: boolean; error?: string } | null = null
    setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        const id = ids[0]
        if (!id) return
        const reqPath = join(dir, `${id}.json`)
        const req = JSON.parse(await fs.readFile(reqPath, 'utf-8')) as {
          gate_id: string
          nonce: string
          expiresAt: string
        }
        validationResult = await gate.receiveWebhookDecision({
          kind: 'knowledge_pii_review_partial',
          gate_id: req.gate_id,
          target_file: 'a.md',
          nonce: req.nonce,
          issuedAt: new Date().toISOString(),
          expiresAt: req.expiresAt,
          partial_redact_terms: [],
          keep_terms: [],
        })
        if (id) await gate.decideViaFile(id, 'approve')
      })()
    }, 80)
    await gate.requestReview({
      drafts: [draftZero],
      target_file: 'a.md',
      prjId: 'PRJ-019',
    })
    expect(validationResult).not.toBeNull()
    expect(validationResult?.error).toBe('missing_terms')
  })

  it('14. listPending lists in-flight gate ids', async () => {
    const gate = new FileHitl11Gate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 5000,
    })
    let observed: string[] = []
    setTimeout(() => {
      void (async () => {
        observed = await gate.listPending()
        const ids = observed
        if (ids[0]) await gate.decideViaFile(ids[0], 'approve')
      })()
    }, 80)
    await gate.requestReview({
      drafts: [draftZero],
      target_file: 'a.md',
      prjId: 'PRJ-019',
    })
    expect(observed.length).toBeGreaterThan(0)
    expect(observed[0]?.startsWith('GATE-11-')).toBe(true)
  })

  it('15. audit log appends gate decision', async () => {
    const gate = new FileHitl11Gate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 5000,
    })
    setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        if (ids[0])
          await gate.decideViaFile(ids[0], 'approve', { reviewer: 'OwnerX' })
      })()
    }, 80)
    await gate.requestReview({
      drafts: [draftZero],
      target_file: 'audit-target.md',
      prjId: 'PRJ-019',
    })
    const audit = await gate.listAudit()
    expect(audit.length).toBe(1)
    expect(audit[0]?.decision).toBe('approve')
    expect(audit[0]?.target_file).toBe('audit-target.md')
    expect(audit[0]?.reviewer).toBe('OwnerX')
  })

  it('16. decideViaFile directly resolves polling', async () => {
    const gate = new FileHitl11Gate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 5000,
    })
    setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        if (ids[0])
          await gate.decideViaFile(ids[0], 'reject', { reject_reason: 'r' })
      })()
    }, 50)
    const out = await gate.requestReview({
      drafts: [draftWithPii],
      target_file: 'a.md',
      prjId: 'PRJ-019',
    })
    expect(out.result.decision).toBe('reject')
  })

  it('17. webhook approve produces source=file (decision file path)', async () => {
    const gate = new FileHitl11Gate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 5000,
    })
    setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        const id = ids[0]
        if (!id) return
        const reqPath = join(dir, `${id}.json`)
        const req = JSON.parse(await fs.readFile(reqPath, 'utf-8')) as {
          gate_id: string
          nonce: string
          expiresAt: string
        }
        await gate.receiveWebhookDecision({
          kind: 'knowledge_pii_review_approve',
          gate_id: req.gate_id,
          target_file: 'a.md',
          nonce: req.nonce,
          issuedAt: new Date().toISOString(),
          expiresAt: req.expiresAt,
        })
      })()
    }, 80)
    const out = await gate.requestReview({
      drafts: [draftZero],
      target_file: 'a.md',
      prjId: 'PRJ-019',
    })
    expect(out.source).toBe('file')
    expect(out.result.decision).toBe('approve')
  })

  it('18. cleanup removes pending file after decision', async () => {
    const gate = new FileHitl11Gate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 5000,
    })
    setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        if (ids[0]) await gate.decideViaFile(ids[0], 'approve')
      })()
    }, 50)
    await gate.requestReview({
      drafts: [draftZero],
      target_file: 'a.md',
      prjId: 'PRJ-019',
    })
    const remaining = await gate.listPending()
    expect(remaining.length).toBe(0)
  })
})
