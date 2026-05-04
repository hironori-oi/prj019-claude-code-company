/**
 * hn-fixture — HN Algolia API レスポンス相当の fixture。
 *
 * needs-scout/sources/hn-trending.ts が期待する HnAlgoliaResponse shape を返す。
 * 実際の network 通信は一切行わず、Response object を組み立てて DI 経由で渡す。
 */

export interface HnFixtureHit {
  objectID: string
  title: string
  url: string
  points: number
  num_comments: number
  created_at: string
  story_text?: string
}

export const HN_FIXTURE_HITS: readonly HnFixtureHit[] = Object.freeze([
  {
    objectID: 'mock-typescript-saas-1',
    title: 'Open source TypeScript SaaS framework for B2B niche',
    url: 'https://github.com/example/open-saas',
    points: 220,
    num_comments: 110,
    created_at: '2026-05-04T10:30:00.000Z',
    story_text: 'open source typescript saas framework b2b cli devtool productivity',
  },
  {
    objectID: 'mock-typescript-cli-2',
    title: 'Tiny CLI productivity tool in TypeScript',
    url: 'https://example.com/cli-tool',
    points: 95,
    num_comments: 32,
    created_at: '2026-05-04T08:00:00.000Z',
    story_text: 'typescript cli productivity automation devtool',
  },
  {
    objectID: 'mock-typescript-lib-3',
    title: 'TypeScript library for analytics dashboards',
    url: 'https://example.com/analytics-lib',
    points: 70,
    num_comments: 12,
    created_at: '2026-05-04T05:00:00.000Z',
    story_text: 'typescript analytics dashboard library',
  },
])

export function buildHnFixtureResponse(
  hits: readonly HnFixtureHit[] = HN_FIXTURE_HITS,
  status = 200,
): Response {
  return new Response(JSON.stringify({ hits }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
