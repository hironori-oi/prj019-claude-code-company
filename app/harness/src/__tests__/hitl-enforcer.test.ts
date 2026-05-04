/**
 * hitl-enforcer.test — Round 7 W0-Week1 prefetch (G-09):
 *   HITL gate enforcement chain と audit log 統合の単体テスト。
 *
 * カバー範囲:
 *   1. approved 時に true + audit に hitl_decision 1 件が記録される
 *   2. rejected 時に false + audit に approved=false が記録される
 *   3. timeout 時に false + reason='timeout' が audit に残る
 *   4. dryRun=true で HITL gate に到達せず audit に dryRun=true が残る
 *   5. audit が未注入でも throw せず enforcement は成立する (best-effort)
 *   6. gate が throw した場合 false で叩き返し audit に error が残る
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  createHitlEnforcer,
  FileHitlGate,
  type HitlAction,
  type HitlGate,
  type HitlApprovalResult,
} from '../index.js'
import { FileAuditLogStore } from '@clawbridge/audit'

function tmpDir(): string {
  return join(
    tmpdir(),
    `clawbridge-enforcer-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
}

const sampleAction: HitlAction = {
  type: 'public_release',
  description: 'Deploy preview',
  risk: 'medium',
}

describe('hitl-enforcer (G-09 enforcement chain)', () => {
  let dir: string
  let auditPath: string

  beforeEach(async () => {
    dir = tmpDir()
    await fs.mkdir(dir, { recursive: true })
    auditPath = join(dir, 'audit-events.jsonl')
  })

  afterEach(async () => {
    try {
      await fs.rm(dir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  })

  it('approved decision passes through and is recorded as hitl_decision', async () => {
    const gate = new FileHitlGate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 5000,
    })
    const audit = new FileAuditLogStore({
      filePath: auditPath,
      rotation: { rotateOnAppend: false },
    })
    const enforcer = createHitlEnforcer({ gate, audit, source: 'openclaw-runtime' })

    setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        if (ids[0]) await gate.decide(ids[0], 'approved', { approver: 'owner' })
      })()
    }, 80)
    const r = await enforcer.enforceBeforeSpawn({
      action: sampleAction,
      subprocessName: 'openclaw-agent',
    })
    expect(r.approved).toBe(true)
    expect(r.auditId).toBeGreaterThan(0)

    const events = await audit.list({ type: 'hitl_decision' })
    expect(events).toHaveLength(1)
    expect(events[0]?.payload['approved']).toBe(true)
    expect(events[0]?.payload['actionType']).toBe('public_release')
    expect(events[0]?.payload['subprocessName']).toBe('openclaw-agent')
  })

  it('rejected decision returns false with audit recorded', async () => {
    const gate = new FileHitlGate({
      pendingDir: dir,
      pollIntervalMs: 30,
      timeoutMs: 5000,
    })
    const audit = new FileAuditLogStore({
      filePath: auditPath,
      rotation: { rotateOnAppend: false },
    })
    const enforcer = createHitlEnforcer({ gate, audit })

    setTimeout(() => {
      void (async () => {
        const ids = await gate.listPending()
        if (ids[0]) await gate.decide(ids[0], 'rejected', { comment: 'no go' })
      })()
    }, 80)
    const r = await enforcer.enforceBeforeSpawn({ action: sampleAction })
    expect(r.approved).toBe(false)
    expect(r.result?.reason).toBe('rejected')
    const events = await audit.list({ type: 'hitl_decision' })
    expect(events[0]?.payload['approved']).toBe(false)
    expect(events[0]?.payload['reason']).toBe('rejected')
  })

  it('timeout decision returns false with reason=timeout in audit', async () => {
    const gate = new FileHitlGate({
      pendingDir: dir,
      pollIntervalMs: 25,
      timeoutMs: 150,
    })
    const audit = new FileAuditLogStore({
      filePath: auditPath,
      rotation: { rotateOnAppend: false },
    })
    const enforcer = createHitlEnforcer({ gate, audit })
    const r = await enforcer.enforceBeforeSpawn({ action: sampleAction })
    expect(r.approved).toBe(false)
    expect(r.result?.reason).toBe('timeout')
    const events = await audit.list({ type: 'hitl_decision' })
    expect(events[0]?.payload['reason']).toBe('timeout')
  })

  it('dryRun=true skips HITL gate but still appends audit with dryRun flag', async () => {
    let requestCount = 0
    const fakeGate: HitlGate = {
      requestApproval: async () => {
        requestCount += 1
        return {
          approved: false,
          reason: 'rejected',
          decidedAt: new Date().toISOString(),
        } satisfies HitlApprovalResult
      },
      listPending: async () => [],
      decide: async () => undefined,
    }
    const audit = new FileAuditLogStore({
      filePath: auditPath,
      rotation: { rotateOnAppend: false },
    })
    const enforcer = createHitlEnforcer({ gate: fakeGate, audit })
    const r = await enforcer.enforceBeforeSpawn({
      action: sampleAction,
      dryRun: true,
    })
    expect(r.approved).toBe(true)
    expect(requestCount).toBe(0) // gate に到達していない
    const events = await audit.list({ type: 'hitl_decision' })
    expect(events[0]?.payload['dryRun']).toBe(true)
  })

  it('works without audit injected (best-effort enforcement)', async () => {
    let requestCount = 0
    const fakeGate: HitlGate = {
      requestApproval: async () => {
        requestCount += 1
        return {
          approved: true,
          reason: 'approved',
          decidedAt: new Date().toISOString(),
        }
      },
      listPending: async () => [],
      decide: async () => undefined,
    }
    const enforcer = createHitlEnforcer({ gate: fakeGate })
    const r = await enforcer.enforceBeforeSpawn({ action: sampleAction })
    expect(r.approved).toBe(true)
    expect(r.auditId).toBeUndefined()
    expect(r.auditError).toBeUndefined()
    expect(requestCount).toBe(1)
  })

  it('gate throw is captured and surfaced as approved=false + audit error', async () => {
    const fakeGate: HitlGate = {
      requestApproval: async () => {
        throw new Error('gate exploded')
      },
      listPending: async () => [],
      decide: async () => undefined,
    }
    const audit = new FileAuditLogStore({
      filePath: auditPath,
      rotation: { rotateOnAppend: false },
    })
    const enforcer = createHitlEnforcer({ gate: fakeGate, audit })
    const r = await enforcer.enforceBeforeSpawn({ action: sampleAction })
    expect(r.approved).toBe(false)
    const events = await audit.list({ type: 'hitl_decision' })
    expect(events[0]?.payload['error']).toMatch(/gate exploded/)
  })
})
