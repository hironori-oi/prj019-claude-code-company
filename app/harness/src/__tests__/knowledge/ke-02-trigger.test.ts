/**
 * KE-02 trigger test (Round 13 Dev-E).
 *
 * 検証項目 (5 tests):
 *   1. shouldTrigger: completed 遷移で true, 同 status で false
 *   2. shouldTrigger: cancelled も terminal として扱う
 *   3. planExtraction: hints 0 件で skip
 *   4. planExtraction: PII を含む snippet → bodyRedacted に placeholder + requiresHitl11=true
 *   5. formatSlackNotification: shouldFire 反映 + HITL-11 件数表示
 */
import { describe, it, expect } from 'vitest'
import {
  formatSlackNotification,
  planExtraction,
  shouldTrigger,
  type ProjectCompletionEvent,
} from '../../knowledge/ke-02-trigger.js'

const baseSnippet =
  'This is a fairly long snippet describing how we discovered the pattern in our practice during PRJ-019.'

describe('KE-02 trigger.shouldTrigger', () => {
  it('completed 遷移で true', () => {
    expect(
      shouldTrigger({
        prjId: 'PRJ-019',
        previousStatus: 'in_progress',
        newStatus: 'completed',
        rawReport: 'r',
      }),
    ).toBe(true)
  })

  it('同 status で false', () => {
    expect(
      shouldTrigger({
        prjId: 'PRJ-019',
        previousStatus: 'completed',
        newStatus: 'completed',
        rawReport: 'r',
      }),
    ).toBe(false)
  })

  it('cancelled も terminal として true', () => {
    expect(
      shouldTrigger({
        prjId: 'PRJ-008',
        previousStatus: 'in_progress',
        newStatus: 'cancelled',
        rawReport: 'r',
      }),
    ).toBe(true)
  })

  it('frozen は terminal ではない', () => {
    expect(
      shouldTrigger({
        prjId: 'PRJ-008',
        previousStatus: 'in_progress',
        newStatus: 'frozen',
        rawReport: 'r',
      }),
    ).toBe(false)
  })
})

describe('KE-02 trigger.planExtraction', () => {
  it('hints 0 件で skip + shouldFire=false', () => {
    const event: ProjectCompletionEvent = {
      prjId: 'PRJ-019',
      previousStatus: 'in_progress',
      newStatus: 'completed',
      rawReport: 'no hints here',
    }
    const r = planExtraction(event)
    expect(r.shouldFire).toBe(false)
    expect(r.entries.length).toBe(0)
    expect(r.skipped.find((s) => s.kind === 'no_hints')).toBeTruthy()
  })

  it('snippet < 50 文字で skip', () => {
    const event: ProjectCompletionEvent = {
      prjId: 'PRJ-019',
      previousStatus: 'in_progress',
      newStatus: 'completed',
      rawReport: 'r',
      hints: [{ kind: 'pattern', title: 'tiny', snippet: 'too short' }],
    }
    const r = planExtraction(event)
    expect(r.shouldFire).toBe(false)
    expect(r.skipped.find((s) => s.kind === 'snippet_too_short')).toBeTruthy()
  })

  it('PII を含む snippet → bodyRedacted に placeholder + requiresHitl11=true', () => {
    const event: ProjectCompletionEvent = {
      prjId: 'PRJ-019',
      previousStatus: 'in_progress',
      newStatus: 'completed',
      rawReport: '...',
      hints: [
        {
          kind: 'pattern',
          title: 'auth flow',
          snippet:
            'During PRJ-019 we used the Anthropic key sk-ant-' +
            'A'.repeat(40) +
            ' which was rotated. Contact: hironori555@gmail.com',
        },
      ],
    }
    const r = planExtraction(event)
    expect(r.shouldFire).toBe(true)
    expect(r.entries.length).toBe(1)
    const e = r.entries[0]!
    expect(e.bodyRedacted).toContain('<ANTHROPIC_KEY>')
    expect(e.bodyRedacted).toContain('<EMAIL>')
    expect(e.bodyRedacted).not.toContain('hironori555@gmail.com')
    expect(e.piiHitCount).toBeGreaterThanOrEqual(2)
    expect(e.requiresHitl11).toBe(true)
    expect(Object.isFrozen(e)).toBe(true)
  })

  it('PII なし snippet → requiresHitl11=false', () => {
    const event: ProjectCompletionEvent = {
      prjId: 'PRJ-014',
      previousStatus: 'in_progress',
      newStatus: 'completed',
      rawReport: 'r',
      hints: [{ kind: 'pitfall', title: 'env naming', snippet: baseSnippet }],
    }
    const r = planExtraction(event)
    expect(r.shouldFire).toBe(true)
    expect(r.entries[0]?.requiresHitl11).toBe(false)
  })

  it('結果は Object.freeze 済', () => {
    const r = planExtraction({
      prjId: 'PRJ-019',
      previousStatus: 'in_progress',
      newStatus: 'cancelled',
      rawReport: 'r',
    })
    expect(Object.isFrozen(r)).toBe(true)
    expect(Object.isFrozen(r.entries)).toBe(true)
    expect(Object.isFrozen(r.skipped)).toBe(true)
  })
})

describe('KE-02 trigger.formatSlackNotification', () => {
  it('shouldFire=false で skipped メッセージ', () => {
    const r = planExtraction({
      prjId: 'PRJ-019',
      previousStatus: 'completed',
      newStatus: 'completed',
      rawReport: 'r',
    })
    const msg = formatSlackNotification(r, 'PRJ-019')
    expect(msg).toContain('skipped')
    expect(msg).toContain('PRJ-019')
  })

  it('shouldFire=true で件数 + HITL-11 件数表示', () => {
    const r = planExtraction({
      prjId: 'PRJ-019',
      previousStatus: 'in_progress',
      newStatus: 'completed',
      rawReport: 'r',
      hints: [
        { kind: 'pattern', title: 'a', snippet: baseSnippet + ' contact me@example.com' },
        { kind: 'decision', title: 'b', snippet: baseSnippet },
      ],
    })
    const msg = formatSlackNotification(r, 'PRJ-019')
    expect(msg).toContain('candidates: 2')
    expect(msg).toContain('requires HITL-11: 1 / 2')
  })
})
