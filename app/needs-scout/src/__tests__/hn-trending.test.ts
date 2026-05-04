/**
 * hn-trending.test — Round 9 案 9-A1 前倒し (CB-D-W3-01):
 *   HN Algolia API fetcher の単体テスト。
 *
 * カバー範囲:
 *   1. happy path - 200 OK + 2 hits を Candidate[] に正規化
 *   2. non-2xx response - 空配列で fail-safe
 *   3. fetch throw / network error - 空配列で fail-safe
 *   4. invalid JSON - 空配列で fail-safe
 *   5. ageHours 計算 - publishedAt から経過時間を hours 単位で正しく算出
 *   6. domain 抽出 - URL から hostname を抽出 / 失敗時 'unknown'
 */
import { describe, it, expect } from 'vitest'

import {
  computeAgeHours,
  extractDomain,
  extractKeywords,
  fetchHnTrending,
  HN_ALGOLIA_DEFAULT_ENDPOINT,
} from '../sources/hn-trending.js'

/** Response stub factory */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('hn-trending fetchHnTrending (CB-D-W3-01)', () => {
  it('1. happy path - 200 OK + 2 hits を Candidate[] に正規化する', async () => {
    const fixedNow = new Date('2026-05-04T12:00:00.000Z')
    const fakeFetch: typeof globalThis.fetch = async () =>
      jsonResponse({
        hits: [
          {
            objectID: '12345',
            title: 'New TypeScript SaaS framework',
            url: 'https://github.com/example/ts-saas',
            points: 120,
            num_comments: 45,
            created_at: '2026-05-04T10:00:00.000Z',
            story_text: 'Open source typescript framework for B2B saas',
          },
          {
            objectID: '67890',
            title: 'TS productivity CLI tool',
            url: 'https://example.com/ts-cli',
            points: 60,
            num_comments: 8,
            created_at: '2026-05-03T12:00:00.000Z',
            story_text: '',
          },
        ],
      })
    const result = await fetchHnTrending({
      fetchFn: fakeFetch,
      now: () => fixedNow,
    })
    expect(result).toHaveLength(2)
    const first = result[0]!
    expect(first.id).toBe('12345')
    expect(first.title).toBe('New TypeScript SaaS framework')
    expect(first.url).toBe('https://github.com/example/ts-saas')
    expect(first.source).toBe('hackernews')
    expect(first.sourceTier).toBe('tier1')
    expect(first.domain).toBe('github.com')
    expect(first.signalScore.points).toBe(120)
    expect(first.signalScore.numComments).toBe(45)
    expect(first.signalScore.ageHours).toBeCloseTo(2, 1) // 12:00 - 10:00 = 2h
    expect(first.signalScore.keywords.length).toBeGreaterThan(0)
    expect(first.rawText).toContain('saas')
    expect(first.fetcherMeta?.apiEndpoint).toBe(HN_ALGOLIA_DEFAULT_ENDPOINT)
  })

  it('2. non-2xx response - 空配列で fail-safe', async () => {
    const fakeFetch: typeof globalThis.fetch = async () =>
      new Response('Service unavailable', { status: 503 })
    const result = await fetchHnTrending({ fetchFn: fakeFetch })
    expect(result).toEqual([])
  })

  it('3. fetch throws (network error) - 空配列で fail-safe', async () => {
    const fakeFetch: typeof globalThis.fetch = async () => {
      throw new Error('ECONNRESET')
    }
    const result = await fetchHnTrending({ fetchFn: fakeFetch })
    expect(result).toEqual([])
  })

  it('4. invalid JSON - 空配列で fail-safe (parse fail)', async () => {
    const fakeFetch: typeof globalThis.fetch = async () =>
      new Response('not-json{{{', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    const result = await fetchHnTrending({ fetchFn: fakeFetch })
    expect(result).toEqual([])
  })

  it('5. ageHours 計算 - publishedAt から経過時間を hours 単位で算出', () => {
    const now = new Date('2026-05-04T12:00:00.000Z')
    expect(computeAgeHours('2026-05-04T11:00:00.000Z', now)).toBeCloseTo(1, 5)
    expect(computeAgeHours('2026-05-03T12:00:00.000Z', now)).toBeCloseTo(24, 5)
    expect(computeAgeHours('2026-05-04T13:00:00.000Z', now)).toBe(0) // future -> 0
    expect(computeAgeHours('not-a-date', now)).toBe(0)
  })

  it('6. domain 抽出 - URL から hostname を抽出 / 失敗時 "unknown"', () => {
    expect(extractDomain('https://github.com/foo/bar')).toBe('github.com')
    expect(extractDomain('https://news.ycombinator.com/item?id=1')).toBe(
      'news.ycombinator.com',
    )
    expect(extractDomain('not-a-url')).toBe('unknown')
    expect(extractDomain('')).toBe('unknown')
  })

  it('7. extractKeywords - lowercase tokens / stopword 除外 / 30 件 cap', () => {
    const text = 'this is a typescript saas framework with amazing dev tools'
    const kws = extractKeywords(text)
    expect(kws).toContain('typescript')
    expect(kws).toContain('saas')
    expect(kws).toContain('framework')
    expect(kws).toContain('tools')
    // stopword 除外
    expect(kws).not.toContain('this')
    expect(kws).not.toContain('with')
  })

  it('8. empty/missing field - hits の title が空なら skip / objectID 欠落も skip', async () => {
    const fakeFetch: typeof globalThis.fetch = async () =>
      jsonResponse({
        hits: [
          { objectID: '1', title: '', url: 'https://example.com', points: 10 }, // skip
          { objectID: '', title: 'no id', url: 'https://example.com' }, // skip
          { objectID: '3', title: 'valid story', url: 'https://example.com', points: 5 },
        ],
      })
    const result = await fetchHnTrending({ fetchFn: fakeFetch })
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('3')
  })
})
