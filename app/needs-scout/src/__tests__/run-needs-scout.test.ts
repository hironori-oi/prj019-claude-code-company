/**
 * run-needs-scout.test — Round 9 案 9-A1 前倒し:
 *   needs_scout skill ファサード (E2E happy path + reject path) のテスト。
 *
 * カバー範囲:
 *   1. E2E happy path - HN 3 hits → filter 通過 → scoring → score 降順 + licenseCheckRequired:true
 *   2. E2E reject path - 重要 13 領域候補が rejected[] に並ぶ
 *   3. topN 切り出し
 *   4. fetch 失敗時 fail-safe (空結果)
 */
import { describe, it, expect } from 'vitest'

import { runNeedsScout } from '../index.js'

/** Response stub factory */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('runNeedsScout E2E (CB-D-W3-01 + CB-D-W3-02 統合)', () => {
  it('1. E2E happy path - 3 safe hits → filter 通過 → scoring → 降順 + licenseCheckRequired', async () => {
    const fixedNow = new Date('2026-05-04T12:00:00.000Z')
    const fakeFetch: typeof globalThis.fetch = async () =>
      jsonResponse({
        hits: [
          {
            objectID: 'a',
            title: 'TypeScript SaaS framework',
            url: 'https://github.com/example/saas',
            points: 200,
            num_comments: 100,
            created_at: '2026-05-04T11:00:00.000Z',
            story_text: 'open source typescript saas framework b2b cli',
          },
          {
            objectID: 'b',
            title: 'Tiny CLI tool',
            url: 'https://example.com/cli',
            points: 60,
            num_comments: 5,
            created_at: '2026-05-03T12:00:00.000Z',
            story_text: 'cli typescript productivity tool',
          },
          {
            objectID: 'c',
            title: 'Old library typescript',
            url: 'https://example.com/lib',
            points: 55,
            num_comments: 0,
            created_at: '2026-04-30T12:00:00.000Z', // ~96h
            story_text: 'old library',
          },
        ],
      })
    const result = await runNeedsScout({
      hn: { fetchFn: fakeFetch, now: () => fixedNow },
      now: () => fixedNow,
      runId: 'test-run-1',
    })

    expect(result.fetchedCount).toBe(3)
    expect(result.accepted).toHaveLength(3)
    expect(result.rejected).toHaveLength(0)

    // 降順ソート
    const scores = result.accepted.map((c) => c.score)
    expect(scores[0]!).toBeGreaterThanOrEqual(scores[1]!)
    expect(scores[1]!).toBeGreaterThanOrEqual(scores[2]!)

    // 高 signal (id='a') が top
    expect(result.accepted[0]!.id).toBe('a')

    // licenseCheckRequired 必須化 (R-019-11)
    expect(result.meta.licenseCheckRequired).toBe(true)
    expect(result.meta.runId).toBe('test-run-1')
    expect(result.meta.startedAt).toBeDefined()
    expect(result.meta.finishedAt).toBeDefined()

    // scoreBreakdown が 4 因子で出力されている
    const breakdown = result.accepted[0]!.scoreBreakdown
    expect(breakdown.pointsContribution).toBeGreaterThan(0)
    expect(breakdown.commentsContribution).toBeGreaterThan(0)
    expect(breakdown.ageContribution).toBeGreaterThan(0)
  })

  it('2. E2E reject path - 重要 13 領域候補が rejected[] に並ぶ', async () => {
    const fakeFetch: typeof globalThis.fetch = async () =>
      jsonResponse({
        hits: [
          {
            objectID: 'safe-1',
            title: 'Safe TypeScript framework',
            url: 'https://example.com/safe',
            points: 100,
            num_comments: 50,
            created_at: '2026-05-04T11:00:00.000Z',
            story_text: 'safe typescript framework',
          },
          {
            objectID: 'medical-1',
            title: 'AI Diagnosis assistant',
            url: 'https://example.com/diag',
            points: 200,
            num_comments: 200,
            created_at: '2026-05-04T11:00:00.000Z',
            story_text: 'ai diagnosis tool for clinical decision',
          },
          {
            objectID: 'finance-1',
            title: 'Credit score automation',
            url: 'https://example.com/credit',
            points: 80,
            num_comments: 10,
            created_at: '2026-05-04T11:00:00.000Z',
            story_text: 'credit score automation tool',
          },
        ],
      })
    const result = await runNeedsScout({
      hn: { fetchFn: fakeFetch, now: () => new Date('2026-05-04T12:00:00.000Z') },
      now: () => new Date('2026-05-04T12:00:00.000Z'),
    })

    expect(result.fetchedCount).toBe(3)
    expect(result.accepted).toHaveLength(1)
    expect(result.accepted[0]!.id).toBe('safe-1')
    expect(result.rejected).toHaveLength(2)
    const domains = result.rejected.map((r) => r.matchedDomain).sort()
    expect(domains).toEqual(['finance', 'medical'])
  })

  it('3. topN 切り出し - score 降順で N 件のみ返す', async () => {
    const fakeFetch: typeof globalThis.fetch = async () =>
      jsonResponse({
        hits: [
          { objectID: '1', title: 'A typescript', url: 'https://e.com/a', points: 200, num_comments: 100, created_at: '2026-05-04T11:00:00.000Z' },
          { objectID: '2', title: 'B typescript', url: 'https://e.com/b', points: 100, num_comments: 50, created_at: '2026-05-04T11:00:00.000Z' },
          { objectID: '3', title: 'C typescript', url: 'https://e.com/c', points: 50, num_comments: 5, created_at: '2026-05-04T11:00:00.000Z' },
        ],
      })
    const result = await runNeedsScout({
      hn: { fetchFn: fakeFetch, now: () => new Date('2026-05-04T12:00:00.000Z') },
      now: () => new Date('2026-05-04T12:00:00.000Z'),
      topN: 2,
    })
    expect(result.accepted).toHaveLength(2)
    expect(result.accepted[0]!.id).toBe('1')
    expect(result.accepted[1]!.id).toBe('2')
  })

  it('4. fetch 失敗時 fail-safe - 空 accepted / 空 rejected / fetchedCount=0 / licenseCheckRequired:true 維持', async () => {
    const fakeFetch: typeof globalThis.fetch = async () =>
      new Response('error', { status: 503 })
    const result = await runNeedsScout({
      hn: { fetchFn: fakeFetch, now: () => new Date('2026-05-04T12:00:00.000Z') },
      now: () => new Date('2026-05-04T12:00:00.000Z'),
    })
    expect(result.fetchedCount).toBe(0)
    expect(result.accepted).toHaveLength(0)
    expect(result.rejected).toHaveLength(0)
    expect(result.meta.licenseCheckRequired).toBe(true) // 必須化維持
  })
})
