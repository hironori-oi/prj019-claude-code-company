/**
 * KE-02 orchestrator wiring test (Round 14 Dev-E).
 *
 * 検証項目 (12 tests):
 *  1. shouldFire=false (status 同一) で skip / indexedCount=0
 *  2. shouldFire=false (no hints) で skip
 *  3. PII なし draft → onIndexAppend 呼出 (1 件)
 *  4. PII あり draft → onHitl11Required 呼出
 *  5. 混在 → indexable + hitl11 を別経路に分流
 *  6. onSlackNotify が呼ばれ slackNotified=true
 *  7. onIndexAppend で error 発生時 onError callback
 *  8. onHitl11Required で error 発生時 onError callback
 *  9. transport 未指定でも crash しない
 * 10. indexedCount / hitl11RequiredCount の集計確認
 * 11. draft → IndexedKnowledge 変換: pattern 用 frontmatter
 * 12. draft → IndexedKnowledge 変換: pitfall 用 frontmatter
 */
import { describe, it, expect } from 'vitest'
import { createKe02Wiring } from '../../knowledge/ke-02-orchestrator-wiring.js'
import type { ProjectCompletionEvent } from '../../knowledge/ke-02-trigger.js'
import type { IndexedKnowledge } from '../../knowledge/ke-03-retrieval.js'

const longSnippet =
  'This is a long enough snippet to exceed the minimum body length of 50 characters for KE-01 schema validation. abc def.'

const eventNoTransition: ProjectCompletionEvent = {
  prjId: 'PRJ-019',
  previousStatus: 'in_progress',
  newStatus: 'in_progress',
  rawReport: 'no transition',
}

const eventCompletedNoHints: ProjectCompletionEvent = {
  prjId: 'PRJ-019',
  previousStatus: 'in_progress',
  newStatus: 'completed',
  rawReport: 'completed',
  hints: [],
}

const eventWithCleanHint: ProjectCompletionEvent = {
  prjId: 'PRJ-019',
  previousStatus: 'in_progress',
  newStatus: 'completed',
  rawReport: 'see hints',
  hints: [
    {
      kind: 'pattern',
      title: 'clean pattern',
      snippet: longSnippet,
    },
  ],
}

const eventWithPiiHint: ProjectCompletionEvent = {
  prjId: 'PRJ-019',
  previousStatus: 'in_progress',
  newStatus: 'completed',
  rawReport: 'see hints',
  hints: [
    {
      kind: 'decision',
      title: 'has-pii',
      snippet: `Contact owner@example.com for details. ${longSnippet}`,
    },
  ],
}

const eventMixed: ProjectCompletionEvent = {
  prjId: 'PRJ-019',
  previousStatus: 'in_progress',
  newStatus: 'completed',
  rawReport: 'mixed',
  hints: [
    { kind: 'pattern', title: 'clean1', snippet: longSnippet },
    {
      kind: 'pitfall',
      title: 'pii-pitfall',
      snippet: `secret sk-ant-AAAAAAAAAAAAAAAAAAAAAAA. ${longSnippet}`,
    },
  ],
}

describe('createKe02Wiring', () => {
  it('1. skips when no status transition', async () => {
    const wiring = createKe02Wiring({})
    const r = await wiring.handleProjectCompletion(eventNoTransition)
    expect(r.trigger.shouldFire).toBe(false)
    expect(r.indexedCount).toBe(0)
    expect(r.hitl11RequiredCount).toBe(0)
    expect(r.slackNotified).toBe(false)
  })

  it('2. skips when no hints', async () => {
    const wiring = createKe02Wiring({})
    const r = await wiring.handleProjectCompletion(eventCompletedNoHints)
    expect(r.trigger.shouldFire).toBe(false)
    expect(r.indexedCount).toBe(0)
  })

  it('3. routes clean draft to onIndexAppend', async () => {
    const indexed: IndexedKnowledge[] = []
    const wiring = createKe02Wiring({
      onIndexAppend: (e) => {
        indexed.push(e)
      },
    })
    const r = await wiring.handleProjectCompletion(eventWithCleanHint)
    expect(r.indexedCount).toBe(1)
    expect(indexed.length).toBe(1)
    expect(indexed[0]?.frontmatter.kind).toBe('pattern')
  })

  it('4. routes pii draft to onHitl11Required', async () => {
    let hitl11Called = false
    const wiring = createKe02Wiring({
      onHitl11Required: (drafts) => {
        hitl11Called = drafts.length > 0
      },
    })
    const r = await wiring.handleProjectCompletion(eventWithPiiHint)
    expect(r.hitl11RequiredCount).toBeGreaterThan(0)
    expect(hitl11Called).toBe(true)
  })

  it('5. routes mixed drafts to both transports separately', async () => {
    const indexed: IndexedKnowledge[] = []
    let hitl11Drafts = 0
    const wiring = createKe02Wiring({
      onIndexAppend: (e) => {
        indexed.push(e)
      },
      onHitl11Required: (drafts) => {
        hitl11Drafts = drafts.length
      },
    })
    const r = await wiring.handleProjectCompletion(eventMixed)
    expect(r.indexedCount).toBe(1) // clean1
    expect(hitl11Drafts).toBeGreaterThan(0) // pii-pitfall
    expect(indexed.length).toBe(1)
  })

  it('6. invokes onSlackNotify and reports slackNotified=true', async () => {
    let slackMsg = ''
    const wiring = createKe02Wiring({
      onSlackNotify: (m) => {
        slackMsg = m
      },
    })
    const r = await wiring.handleProjectCompletion(eventWithCleanHint)
    expect(r.slackNotified).toBe(true)
    expect(slackMsg).toContain('PRJ-019')
  })

  it('7. invokes onError when onIndexAppend throws', async () => {
    const errs: string[] = []
    const wiring = createKe02Wiring({
      onIndexAppend: () => {
        throw new Error('append fail')
      },
      onError: (where) => {
        errs.push(where)
      },
    })
    await wiring.handleProjectCompletion(eventWithCleanHint)
    expect(errs).toContain('onIndexAppend')
  })

  it('8. invokes onError when onHitl11Required throws', async () => {
    const errs: string[] = []
    const wiring = createKe02Wiring({
      onHitl11Required: () => {
        throw new Error('hitl11 fail')
      },
      onError: (where) => {
        errs.push(where)
      },
    })
    await wiring.handleProjectCompletion(eventWithPiiHint)
    expect(errs).toContain('onHitl11Required')
  })

  it('9. survives missing transports', async () => {
    const wiring = createKe02Wiring({})
    const r = await wiring.handleProjectCompletion(eventMixed)
    expect(r.trigger.shouldFire).toBe(true)
    // no transports -> nothing recorded
    expect(r.indexedCount).toBe(0)
    expect(r.hitl11RequiredCount).toBe(0)
  })

  it('10. counts indexed and hitl11Required correctly', async () => {
    const wiring = createKe02Wiring({
      onIndexAppend: () => {},
      onHitl11Required: () => {},
    })
    const r = await wiring.handleProjectCompletion(eventMixed)
    expect(r.indexedCount + r.hitl11RequiredCount).toBe(2)
  })

  it('11. converts pattern draft to IndexedKnowledge with proper frontmatter', async () => {
    let frontmatterKind = ''
    const wiring = createKe02Wiring({
      onIndexAppend: (e) => {
        frontmatterKind = e.frontmatter.kind
      },
    })
    await wiring.handleProjectCompletion(eventWithCleanHint)
    expect(frontmatterKind).toBe('pattern')
  })

  it('12. converts pitfall draft to IndexedKnowledge', async () => {
    const indexed: IndexedKnowledge[] = []
    const wiring = createKe02Wiring({
      onIndexAppend: (e) => {
        indexed.push(e)
      },
    })
    const event: ProjectCompletionEvent = {
      prjId: 'PRJ-019',
      previousStatus: 'in_progress',
      newStatus: 'completed',
      rawReport: 'pitfall sample',
      hints: [
        {
          kind: 'pitfall',
          title: 'clean pitfall',
          snippet: longSnippet,
        },
      ],
    }
    await wiring.handleProjectCompletion(event)
    expect(indexed.length).toBe(1)
    expect(indexed[0]?.frontmatter.kind).toBe('pitfall')
  })
})
