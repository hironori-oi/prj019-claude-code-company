/**
 * KE orchestrator wiring test (Round 15 Dev-N).
 *
 * 検証項目 (6 tests):
 *  1. shouldFire=false (no transition) で全カウント 0
 *  2. PII なし draft のみ → 自動 approve、knowledge subdir に rename される
 *  3. PII あり draft → decideHitl11 = approve で knowledge へ移動
 *  4. PII あり draft → decideHitl11 = reject で quarantine/rejected/ に保持
 *  5. PII あり draft → decideHitl11 = partial_redact で隔離維持 + tags 付与
 *  6. Slack notify が呼ばれて summary を渡す + onError は throw 時に拾う
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createKeOrchestrator } from '../../knowledge/ke-orchestrator.ts'
import type { ProjectCompletionEvent } from '../../knowledge/ke-02-trigger.js'

function tmpDir(prefix: string): string {
  return join(
    tmpdir(),
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  )
}

const longSnippet =
  'This is a sufficiently long snippet to exceed the minimum body length of 50 characters required by the KE-01 schema validation logic.'

const eventNoTransition: ProjectCompletionEvent = {
  prjId: 'PRJ-019',
  previousStatus: 'in_progress',
  newStatus: 'in_progress',
  rawReport: '',
}

const eventClean: ProjectCompletionEvent = {
  prjId: 'PRJ-019',
  previousStatus: 'in_progress',
  newStatus: 'completed',
  rawReport: 'see hints',
  hints: [
    {
      kind: 'pattern',
      title: 'clean pattern alpha',
      snippet: longSnippet,
    },
    {
      kind: 'pattern',
      title: 'clean pattern beta',
      snippet: longSnippet,
    },
  ],
}

const eventWithPii: ProjectCompletionEvent = {
  prjId: 'PRJ-019',
  previousStatus: 'in_progress',
  newStatus: 'completed',
  rawReport: 'see hints',
  hints: [
    {
      kind: 'decision',
      title: 'pii decision',
      snippet: `Contact owner@example.com for more info. ${longSnippet}`,
    },
  ],
}

describe('createKeOrchestrator', () => {
  let qroot: string
  let kroot: string

  beforeEach(async () => {
    qroot = tmpDir('clawbridge-orch-q')
    kroot = tmpDir('clawbridge-orch-k')
    await fs.mkdir(qroot, { recursive: true })
    await fs.mkdir(kroot, { recursive: true })
  })

  afterEach(async () => {
    for (const d of [qroot, kroot]) {
      try {
        await fs.rm(d, { recursive: true, force: true })
      } catch {
        // ignore
      }
    }
  })

  it('1. skips entirely when no transition', async () => {
    const orch = createKeOrchestrator({ quarantineRoot: qroot, knowledgeRoot: kroot })
    const r = await orch.handleProjectCompletion(eventNoTransition)
    expect(r.trigger.shouldFire).toBe(false)
    expect(r.quarantinedCount).toBe(0)
    expect(r.approvedCount).toBe(0)
    expect(r.rejectedCount).toBe(0)
  })

  it('2. clean drafts auto-approved into knowledge subdirs', async () => {
    const orch = createKeOrchestrator({ quarantineRoot: qroot, knowledgeRoot: kroot })
    const r = await orch.handleProjectCompletion(eventClean)
    expect(r.quarantinedCount).toBe(2)
    expect(r.approvedCount).toBe(2)
    expect(r.hitl11RequiredCount).toBe(0)
    // patterns dir に 2 件
    const patternsDir = join(kroot, 'patterns')
    const files = await fs.readdir(patternsDir)
    expect(files.length).toBe(2)
    for (const f of files) expect(f.endsWith('.md')).toBe(true)
  })

  it('3. pii drafts approved when decideHitl11 returns approve', async () => {
    const orch = createKeOrchestrator({
      quarantineRoot: qroot,
      knowledgeRoot: kroot,
      decideHitl11: () => 'approve',
    })
    const r = await orch.handleProjectCompletion(eventWithPii)
    expect(r.hitl11RequiredCount).toBe(1)
    expect(r.approvedCount).toBe(1)
    expect(r.rejectedCount).toBe(0)
    const decisionsDir = join(kroot, 'decisions')
    const files = await fs.readdir(decisionsDir)
    expect(files.length).toBe(1)
  })

  it('4. pii drafts rejected when decideHitl11 returns reject', async () => {
    const orch = createKeOrchestrator({
      quarantineRoot: qroot,
      knowledgeRoot: kroot,
      decideHitl11: () => 'reject',
    })
    const r = await orch.handleProjectCompletion(eventWithPii)
    expect(r.rejectedCount).toBe(1)
    expect(r.approvedCount).toBe(0)
    // knowledge dir には何も移動しない
    const decisionsDirExists = await fs
      .access(join(kroot, 'decisions'))
      .then(() => true)
      .catch(() => false)
    expect(decisionsDirExists).toBe(false)
    // quarantine/rejected に 1 件
    const rejectedDir = join(qroot, 'rejected')
    const files = await fs.readdir(rejectedDir)
    expect(files.length).toBe(1)
  })

  it('5. pii drafts marked partial_redact when decideHitl11 returns partial_redact', async () => {
    const orch = createKeOrchestrator({
      quarantineRoot: qroot,
      knowledgeRoot: kroot,
      decideHitl11: () => 'partial_redact',
    })
    const r = await orch.handleProjectCompletion(eventWithPii)
    expect(r.partialCount).toBe(1)
    expect(r.approvedCount).toBe(0)
    expect(r.rejectedCount).toBe(0)
    // body はまだ quarantine 直下に保持 (rejected/ にも knowledge にも移動していない)
    const qFiles = (await fs.readdir(qroot)).filter((f) => f.endsWith('.md'))
    expect(qFiles.length).toBe(1)
  })

  it('6. invokes onSlackNotify with summary and captures onError on transport throw', async () => {
    const errs: string[] = []
    let slackMsg = ''
    const orch = createKeOrchestrator({
      quarantineRoot: qroot,
      knowledgeRoot: kroot,
      decideHitl11: () => {
        throw new Error('decision oracle down')
      },
      onSlackNotify: (m) => {
        slackMsg = m
      },
      onError: (where, _err) => {
        errs.push(where)
      },
    })
    const r = await orch.handleProjectCompletion(eventWithPii)
    // decideHitl11 throw → fallback escalate path → partial_redact branch executed
    expect(errs).toContain('decideHitl11')
    expect(slackMsg).toContain('PRJ-019')
    expect(slackMsg).toContain('quarantined=')
    expect(r.slackNotified).toBe(true)
  })
})
