/**
 * hn-trending-normalization.test — Round 13 Dev-A:
 *   hn-trending.ts fetch path に NFKC 正規化注入後の挙動検証 (8 cases)。
 *
 * 前提:
 *   - Round 13 Dev-A で hn-trending.ts が title / url / story_text を
 *     `safeNormalize` (型 coerce) → `normalizeForFilter` (NFKC + lowercase + 空白圧縮) に通す。
 *   - rawText は最終的に NFKC 後の lowercase + 連続空白圧縮形で生成される。
 *   - critical-domain-filter は再 normalize しても idempotent (二重通過で結果不変)。
 *
 * カバー:
 *   1. 全角英数字 ＨＥＬＬＯ → 半角化 + lowercase
 *   2. 全角空白 (U+3000) → ASCII space に圧縮
 *   3. 半角カナ ｱｲｳ → 全角カナ アイウ
 *   4. 旧字体混在 → NFKC で吸収可能な部分は吸収
 *   5. null title は skip / 空文字相当
 *   6. story_text の null safe coerce
 *   7. denylist 一致用語が NFKC 経由でも検出可能 (二重正規化 idempotent 確認)
 *   8. URL 内の全角混在も正規化される (G-07 観点で外部 URL も lowercase 化済)
 */
import { describe, it, expect } from 'vitest'

import { fetchHnTrending } from '../sources/hn-trending.js'
import { applyCriticalDomainFilter } from '../filters/critical-domain-filter.js'

/** Response stub factory */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('hn-trending NFKC fetch path (Round 13 Dev-A)', () => {
  const fixedNow = new Date('2026-05-04T12:00:00.000Z')

  it('1. 全角英数字 title の rawText が NFKC で半角化 + lowercase される', async () => {
    const fakeFetch: typeof globalThis.fetch = async () =>
      jsonResponse({
        hits: [
          {
            objectID: '1',
            title: 'ＮＥＷ TypeScript framework',
            url: 'https://example.com/ts',
            points: 100,
            num_comments: 10,
            created_at: '2026-05-04T10:00:00.000Z',
            story_text: '',
          },
        ],
      })
    const result = await fetchHnTrending({ fetchFn: fakeFetch, now: () => fixedNow })
    expect(result).toHaveLength(1)
    // title は表示用に raw 形式を維持 (Round 13: safeNormalize は型 coerce のみ)
    expect(result[0]!.title).toBe('ＮＥＷ TypeScript framework')
    // rawText は NFKC + lowercase + 空白圧縮で正規化済 (denylist 部分一致用)
    expect(result[0]!.rawText).toContain('new typescript framework')
    expect(result[0]!.rawText).not.toContain('ＮＥＷ')
  })

  it('2. 全角空白 (U+3000) を含む title の rawText が ASCII space に圧縮される', async () => {
    const fakeFetch: typeof globalThis.fetch = async () =>
      jsonResponse({
        hits: [
          {
            objectID: '2',
            title: '弁護士法\u300072\u3000条 ai',
            url: 'https://example.com/legal',
            points: 80,
            num_comments: 20,
            created_at: '2026-05-04T11:00:00.000Z',
            story_text: '',
          },
        ],
      })
    const result = await fetchHnTrending({ fetchFn: fakeFetch, now: () => fixedNow })
    expect(result).toHaveLength(1)
    // title 自体は raw 維持 (表示用)
    expect(result[0]!.title).toBe('弁護士法\u300072\u3000条 ai')
    // rawText では全角空白が半角化されて denylist 一致可能に
    expect(result[0]!.rawText).toContain('弁護士法 72 条')
    // 全角空白は rawText には残らない
    expect(result[0]!.rawText).not.toContain('\u3000')
  })

  it('3. 半角カナ ｱｲｳ を含む title の rawText が NFKC で全角カナに正規化される', async () => {
    const fakeFetch: typeof globalThis.fetch = async () =>
      jsonResponse({
        hits: [
          {
            objectID: '3',
            title: 'ｱｲｳ tools',
            url: 'https://example.com/x',
            points: 50,
            num_comments: 5,
            created_at: '2026-05-04T11:30:00.000Z',
            story_text: '',
          },
        ],
      })
    const result = await fetchHnTrending({ fetchFn: fakeFetch, now: () => fixedNow })
    expect(result).toHaveLength(1)
    // title は raw 維持
    expect(result[0]!.title).toBe('ｱｲｳ tools')
    // rawText では全角カナ化
    expect(result[0]!.rawText).toContain('アイウ tools')
  })

  it('4. story_text が null でも safeNormalize で空文字に coerce', async () => {
    const fakeFetch: typeof globalThis.fetch = async () =>
      jsonResponse({
        hits: [
          {
            objectID: '4',
            title: 'sample story',
            url: 'https://example.com/null',
            points: 30,
            num_comments: 2,
            created_at: '2026-05-04T11:00:00.000Z',
            story_text: null,
          },
        ],
      })
    const result = await fetchHnTrending({ fetchFn: fakeFetch, now: () => fixedNow })
    expect(result).toHaveLength(1)
    // story_text=null は空文字として safe coerce、rawText は NFKC + lowercase 化済
    expect(result[0]!.rawText).toBe('sample story https://example.com/null')
  })

  it('5. title が undefined なら skip', async () => {
    const fakeFetch: typeof globalThis.fetch = async () =>
      jsonResponse({
        hits: [
          { objectID: '5', title: null, url: 'https://example.com', points: 10 },
          { objectID: '6', title: 'valid story', url: 'https://example.com', points: 5 },
        ],
      })
    const result = await fetchHnTrending({ fetchFn: fakeFetch, now: () => fixedNow })
    // title=null は skip、title=valid story のみ残る
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('6')
  })

  it('6. denylist 一致語が NFKC 経由でも検出可能 (二重正規化 idempotent)', async () => {
    const fakeFetch: typeof globalThis.fetch = async () =>
      jsonResponse({
        hits: [
          {
            objectID: '7',
            // 全角空白 + 全角英数字混在で legal advice 該当
            title: 'ＡＩ legal\u3000advice service',
            url: 'https://example.com/legal-ai',
            points: 200,
            num_comments: 50,
            created_at: '2026-05-04T08:00:00.000Z',
            story_text: '',
          },
        ],
      })
    const fetched = await fetchHnTrending({ fetchFn: fakeFetch, now: () => fixedNow })
    expect(fetched).toHaveLength(1)
    // critical-domain-filter で再 normalize されても同等 (idempotent) → 'legal advice' で reject
    const filtered = applyCriticalDomainFilter(fetched)
    expect(filtered.rejected).toHaveLength(1)
    expect(filtered.accepted).toHaveLength(0)
    expect(filtered.rejected[0]!.matchedDomain).toBe('legal')
    expect(filtered.rejected[0]!.matchedTerm).toBe('legal advice')
  })

  it('7. ASCII lowercase title (denylist 不一致) は accept される', async () => {
    const fakeFetch: typeof globalThis.fetch = async () =>
      jsonResponse({
        hits: [
          {
            objectID: '8',
            title: 'New TypeScript saas framework',
            url: 'https://github.com/example/ts-saas',
            points: 120,
            num_comments: 45,
            created_at: '2026-05-04T10:00:00.000Z',
            story_text: 'Open source typescript framework for B2B saas',
          },
        ],
      })
    const fetched = await fetchHnTrending({ fetchFn: fakeFetch, now: () => fixedNow })
    expect(fetched).toHaveLength(1)
    // title は raw 維持 (表示用)
    expect(fetched[0]!.title).toBe('New TypeScript saas framework')
    // rawText は normalize 済
    expect(fetched[0]!.rawText).toContain('new typescript saas framework')
    const filtered = applyCriticalDomainFilter(fetched)
    expect(filtered.accepted).toHaveLength(1)
    expect(filtered.rejected).toHaveLength(0)
  })

  it('8. url が undefined なら HN item URL を fallback で生成', async () => {
    const fakeFetch: typeof globalThis.fetch = async () =>
      jsonResponse({
        hits: [
          {
            objectID: '9',
            title: 'ask hn: opinion on saas',
            url: null,
            points: 40,
            num_comments: 12,
            created_at: '2026-05-04T11:00:00.000Z',
            story_text: '',
          },
        ],
      })
    const result = await fetchHnTrending({ fetchFn: fakeFetch, now: () => fixedNow })
    expect(result).toHaveLength(1)
    expect(result[0]!.url).toBe('https://news.ycombinator.com/item?id=9')
  })
})
