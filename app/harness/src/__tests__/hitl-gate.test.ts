import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FileHitlGate, type HitlAction } from '../hitl-gate.js'

interface TosGrayAuditEntry {
  approved_by?: string
  approved_at: string
  override_note?: string
  need_id: string
  category: string
  subcategory: string
  confidence: number
  rejection_reason?: string
}
interface TosGrayAuditFile {
  entries: TosGrayAuditEntry[]
}

function tmpDir(): string {
  return join(tmpdir(), `clawbridge-hitl-${Date.now()}-${Math.random().toString(36).slice(2)}`)
}

const sampleAction: HitlAction = {
  type: 'public_release',
  description: 'Deploy preview to vercel',
  risk: 'medium',
}

describe('FileHitlGate', () => {
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

  it('approves when .approved file is placed', async () => {
    const gate = new FileHitlGate({
      pendingDir: dir,
      pollIntervalMs: 50,
      timeoutMs: 5000,
    })
    // background placer
    const placer = setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        if (ids[0]) {
          await gate.decide(ids[0], 'approved', { approver: 'owner', comment: 'ok' })
        }
      })()
    }, 100)
    const result = await gate.requestApproval(sampleAction)
    clearTimeout(placer)
    expect(result.approved).toBe(true)
    expect(result.approver).toBe('owner')
    expect(result.comment).toBe('ok')
    expect(result.reason).toBe('approved')
  })

  it('rejects when .rejected file is placed', async () => {
    const gate = new FileHitlGate({
      pendingDir: dir,
      pollIntervalMs: 50,
      timeoutMs: 5000,
    })
    setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        if (ids[0]) {
          await gate.decide(ids[0], 'rejected', { approver: 'owner', comment: 'no' })
        }
      })()
    }, 100)
    const result = await gate.requestApproval(sampleAction)
    expect(result.approved).toBe(false)
    expect(result.reason).toBe('rejected')
    expect(result.comment).toBe('no')
  })

  it('times out when no decision is made', async () => {
    const gate = new FileHitlGate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 200,
    })
    const result = await gate.requestApproval(sampleAction)
    expect(result.approved).toBe(false)
    expect(result.reason).toBe('timeout')
  })

  it('listPending returns ids', async () => {
    const gate = new FileHitlGate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 1000,
    })
    const p = gate.requestApproval(sampleAction)
    // Wait for request file creation
    await new Promise((r) => setTimeout(r, 60))
    const ids = await gate.listPending()
    expect(ids.length).toBeGreaterThanOrEqual(1)
    // Cleanup: timeout the request
    await p
  })

  it('cleans up pending files after decision', async () => {
    const gate = new FileHitlGate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 5000,
    })
    setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        if (ids[0]) {
          await gate.decide(ids[0], 'approved')
        }
      })()
    }, 80)
    await gate.requestApproval(sampleAction)
    const remaining = await fs.readdir(dir)
    expect(remaining.filter((f) => f.endsWith('.json'))).toHaveLength(0)
  })
})

/* ------------------------------------------------------------------ *
 * tos_gray_review (DEC-019-018)
 * ------------------------------------------------------------------ */

const grayBase: HitlAction = {
  type: 'tos_gray_review',
  description: 'gray category review',
  risk: 'high',
  meta: {
    category: 'G-Top-1_matching',
    subcategory: 'G-Top-1',
    confidence: 0.7,
    rationale:
      'マッチング系プロダクト。decision making への影響度が中程度のため gray パスへ寄せる。',
    need_summary:
      'HN trending: AI-powered networking app for solo developers — matching tier feature',
    need_id: 'need-2026-05-03-0001',
    blocklist_hits: [],
  },
}

describe('FileHitlGate.tos_gray_review', () => {
  let dir: string

  beforeEach(async () => {
    dir = join(
      tmpdir(),
      `clawbridge-hitl-gray-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    )
    await fs.mkdir(dir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await fs.rm(dir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  })

  it('approves gray review and appends audit entry', async () => {
    const gate = new FileHitlGate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 5000,
    })
    setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        if (ids[0]) {
          await gate.decide(ids[0], 'approved', {
            approver: 'owner',
            override_note: 'gray manual override: niche dev tool only',
          })
        }
      })()
    }, 80)

    const result = await gate.requestApproval(grayBase)
    expect(result.approved).toBe(true)
    expect(result.reason).toBe('approved')
    expect(result.approver).toBe('owner')
    expect(result.override_note).toContain('niche dev tool')

    // audit log assert
    const auditPath = join(dir, 'audit-tos-gray.json')
    const raw = await fs.readFile(auditPath, 'utf-8')
    const parsed = JSON.parse(raw) as TosGrayAuditFile
    expect(parsed.entries).toHaveLength(1)
    const e0 = parsed.entries[0]
    expect(e0?.need_id).toBe('need-2026-05-03-0001')
    expect(e0?.approved_by).toBe('owner')
    expect(e0?.category).toBe('G-Top-1_matching')
  })

  it('rejects gray review with tos_gray_human_reject reason', async () => {
    const gate = new FileHitlGate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 5000,
    })
    setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        if (ids[0]) {
          await gate.decide(ids[0], 'rejected', {
            approver: 'owner',
            comment: 'too risky, needs Phase 2 council',
          })
        }
      })()
    }, 80)

    const result = await gate.requestApproval(grayBase)
    expect(result.approved).toBe(false)
    expect(result.reason).toBe('tos_gray_human_reject')
    expect(result.comment).toBe('too risky, needs Phase 2 council')

    const auditPath = join(dir, 'audit-tos-gray.json')
    const parsed = JSON.parse(
      await fs.readFile(auditPath, 'utf-8'),
    ) as TosGrayAuditFile
    expect(parsed.entries[0]?.rejection_reason).toBe('tos_gray_human_reject')
  })

  it('times out gray review with tos_gray_timeout (24h default reject)', async () => {
    const gate = new FileHitlGate({
      pendingDir: dir,
      pollIntervalMs: 25,
      timeoutMs: 200,
    })
    const result = await gate.requestApproval(grayBase)
    expect(result.approved).toBe(false)
    expect(result.reason).toBe('tos_gray_timeout')

    const auditPath = join(dir, 'audit-tos-gray.json')
    const parsed = JSON.parse(
      await fs.readFile(auditPath, 'utf-8'),
    ) as TosGrayAuditFile
    expect(parsed.entries[0]?.rejection_reason).toBe('tos_gray_timeout')
  })

  it('throws on invalid category (empty string) payload', async () => {
    const gate = new FileHitlGate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 1000,
    })
    const bad: HitlAction = {
      ...grayBase,
      meta: { ...(grayBase.meta as object), category: '' },
    }
    await expect(gate.requestApproval(bad)).rejects.toThrow(
      /invalid tos_gray_review payload/,
    )
  })

  it('throws on out-of-range confidence (negative or > 1)', async () => {
    const gate = new FileHitlGate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 1000,
    })
    const negative: HitlAction = {
      ...grayBase,
      meta: { ...(grayBase.meta as object), confidence: -0.1 },
    }
    const tooHigh: HitlAction = {
      ...grayBase,
      meta: { ...(grayBase.meta as object), confidence: 1.5 },
    }
    await expect(gate.requestApproval(negative)).rejects.toThrow(
      /invalid tos_gray_review payload/,
    )
    await expect(gate.requestApproval(tooHigh)).rejects.toThrow(
      /invalid tos_gray_review payload/,
    )
  })

  it('deduplicates concurrent requests with same need_id', async () => {
    const gate = new FileHitlGate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 5000,
    })
    // 同一 need_id で 2 並列 request
    const p1 = gate.requestApproval(grayBase)
    const p2 = gate.requestApproval(grayBase)

    // 1 件だけ pending が立っていることを確認 (= dedup 成功)
    await new Promise((r) => setTimeout(r, 80))
    const pending = await gate.listPending()
    expect(pending).toHaveLength(1)

    // 承認
    const firstId = pending[0]
    if (!firstId) throw new Error('no pending request found')
    await gate.decide(firstId, 'approved', { approver: 'owner' })
    const [r1, r2] = await Promise.all([p1, p2])
    expect(r1.approved).toBe(true)
    expect(r2.approved).toBe(true)
    // 同じ promise を共有するため decidedAt も同一
    expect(r1.decidedAt).toBe(r2.decidedAt)

    // audit は 1 件のみ
    const auditPath = join(dir, 'audit-tos-gray.json')
    const parsed = JSON.parse(
      await fs.readFile(auditPath, 'utf-8'),
    ) as TosGrayAuditFile
    expect(parsed.entries).toHaveLength(1)
  })
})

