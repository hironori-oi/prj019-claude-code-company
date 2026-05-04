/**
 * needs-scout sources/hn-trending — Round 9 案 9-A1 前倒し (CB-D-W3-01):
 *   HN Algolia API から trending TypeScript story を取得する fetcher。
 *
 * 設計方針:
 *   - DI: fetch を引数注入 (テスト容易性 / Vitest mock)。default は globalThis.fetch。
 *   - URL: https://hn.algolia.com/api/v1/search?tags=story&query=typescript&numericFilters=points>50
 *   - 戻り値は正規化済 Candidate[] (source='hackernews', sourceTier='tier1')。
 *   - rawText は title + url + (story_text || '') を結合し、Round 13 で NFKC + lowercase + 空白圧縮を適用。
 *   - Open Claw subprocess spawn 経路から本 skill を介して候補リストを取得する設計。
 *     Open Claw が直接 fetch しないことで G-07 (env / fs アクセス allow-list) を維持。
 *
 * Round 13 Dev-A:
 *   - title / url / rawText を fetch 段階で `normalizeForFilter` (NFKC) 経由化
 *   - critical-domain-filter は再度 normalize しても idempotent (NFKC + lowercase + 空白圧縮)
 *
 * 関連:
 *   - DEC-019-006 P-D 改 (subprocess spawn / 副作用ゼロ)
 *   - CB-D-W3-01 (needs_scout skill MVP)
 *   - dev-round12-A-nfkc-yaml-denylist.md §8.1 #4 引継 (hn-trending fetch path NFKC 適用)
 */
import type { Candidate, CandidateSource, SourceTier } from './types.js'
import { normalizeForFilter, safeNormalize } from '../filters/normalization.js'

/** HN Algolia API デフォルトエンドポイント */
export const HN_ALGOLIA_DEFAULT_ENDPOINT =
  'https://hn.algolia.com/api/v1/search?tags=story&query=typescript&numericFilters=points>50'

/** HN trending fetcher のオプション */
export interface HnTrendingFetchOptions {
  /** API エンドポイント上書き (テスト用、default = HN_ALGOLIA_DEFAULT_ENDPOINT) */
  endpoint?: string
  /** fetch 関数注入 (default = globalThis.fetch) */
  fetchFn?: typeof globalThis.fetch
  /** 現在時刻取得 (テスト注入用、default = () => new Date()) */
  now?: () => Date
  /** 取得上限件数 (default = 50) */
  limit?: number
  /** タイムアウト (ms、default = 10_000) */
  timeoutMs?: number
}

/** HN Algolia API レスポンス hit shape (本 skill が依存する最小限のみ) */
interface HnAlgoliaHit {
  objectID: string
  title?: string | null
  url?: string | null
  points?: number | null
  num_comments?: number | null
  created_at?: string | null
  story_text?: string | null
  tags?: readonly string[]
}

interface HnAlgoliaResponse {
  hits?: readonly HnAlgoliaHit[]
}

/**
 * HN Algolia API から trending TypeScript story を取得し Candidate[] を返す。
 *
 * 失敗時 (network / 5xx) は空配列を返す (fail-safe: scout は空でも後続パイプラインを止めない)。
 * ただし呼び出し側がログに残せるよう reason は console.warn で残す (no-throw 原則)。
 */
export async function fetchHnTrending(
  opts: HnTrendingFetchOptions = {},
): Promise<readonly Candidate[]> {
  const endpoint = opts.endpoint ?? HN_ALGOLIA_DEFAULT_ENDPOINT
  const fetchFn = opts.fetchFn ?? (globalThis.fetch as typeof globalThis.fetch | undefined)
  const now = opts.now ?? (() => new Date())
  const limit = opts.limit ?? 50
  const timeoutMs = opts.timeoutMs ?? 10_000

  if (!fetchFn) {
    // runtime に fetch が存在しない (Node < 18 等) — 空配列で fail-safe
    return []
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let response: Response
  try {
    response = await fetchFn(endpoint, { signal: controller.signal })
  } catch (err) {
    // network / abort
    // eslint-disable-next-line no-console
    console.warn(
      `[needs-scout/hn-trending] fetch failed: ${(err as Error).message}`,
    )
    return []
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.warn(
      `[needs-scout/hn-trending] non-2xx: ${response.status} ${response.statusText}`,
    )
    return []
  }

  let body: HnAlgoliaResponse
  try {
    body = (await response.json()) as HnAlgoliaResponse
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      `[needs-scout/hn-trending] parse failed: ${(err as Error).message}`,
    )
    return []
  }

  const fetchedAt = now().toISOString()
  const out: Candidate[] = []
  const hits = (body.hits ?? []).slice(0, limit)
  for (const hit of hits) {
    if (!hit || !hit.objectID) continue
    // Round 13 Dev-A: safeNormalize で型ガード + NFKC 経由化、null / undefined → 空文字に safe coerce。
    const title = safeNormalize(hit.title).trim()
    if (title.length === 0) continue
    const rawUrl = safeNormalize(hit.url).trim()
    const url = (rawUrl.length > 0
      ? rawUrl
      : `https://news.ycombinator.com/item?id=${hit.objectID}`)
    const points = typeof hit.points === 'number' ? hit.points : 0
    const numComments = typeof hit.num_comments === 'number' ? hit.num_comments : 0
    const publishedAt = hit.created_at ?? fetchedAt
    const ageHours = computeAgeHours(publishedAt, now())
    const storyText = safeNormalize(hit.story_text).trim()
    // Round 13 Dev-A: rawText を fetch 段階で NFKC + lowercase + 空白圧縮に正規化。
    // critical-domain-filter は再度 normalize するが NFKC は idempotent なので二重正規化でも結果不変。
    const rawText = normalizeForFilter([title, url, storyText].join(' '))
    const keywords = extractKeywords(rawText)
    const domain = extractDomain(url)
    const c: Candidate = {
      id: hit.objectID,
      title,
      url,
      source: 'hackernews' satisfies CandidateSource,
      sourceTier: 'tier1' satisfies SourceTier,
      domain,
      publishedAt,
      signalScore: {
        points,
        numComments,
        ageHours,
        keywords,
      },
      rawText,
      fetcherMeta: {
        fetchedAt,
        apiEndpoint: endpoint,
      },
    }
    out.push(c)
  }
  return out
}

/** ISO 文字列の経過時間を hours 単位で返す。負値は 0 にクランプ。 */
export function computeAgeHours(publishedAtIso: string, now: Date): number {
  const t = Date.parse(publishedAtIso)
  if (!Number.isFinite(t)) return 0
  const diffMs = now.getTime() - t
  if (diffMs <= 0) return 0
  return diffMs / (60 * 60 * 1000)
}

/** URL からドメインを抽出 (失敗時 'unknown')。 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return 'unknown'
  }
}

/**
 * scoring v0 用 keyword 抽出 (lowercase 単語、最低長 4、頻出 stopword 除外)。
 *
 * ニーズスカウト目的なので「ツール / saas / framework / cli / api / library」等の
 * 開発系シグナルを残す。
 */
const STOPWORDS = new Set<string>([
  'this',
  'that',
  'with',
  'from',
  'have',
  'been',
  'just',
  'about',
  'your',
  'they',
  'their',
  'what',
  'when',
  'where',
  'which',
  'will',
  'would',
  'could',
  'should',
  'into',
  'over',
  'under',
])

export function extractKeywords(rawText: string): readonly string[] {
  const tokens = rawText
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t))
  return Array.from(new Set(tokens)).slice(0, 30)
}
