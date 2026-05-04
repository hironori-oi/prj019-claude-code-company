/**
 * @clawbridge/needs-scout — needs scout skill MVP (Round 9 案 9-A1 前倒し):
 *   HN trending TypeScript -> 13 critical domain denylist filter -> scoring v0 -> 構造化 JSON 出力。
 *
 * 関連:
 *   - CB-D-W3-01 (needs_scout skill MVP)
 *   - CB-D-W3-02 (評価関数 v0)
 *   - DEC-019-010 (OpenAI ToS — 重要 13 領域)
 *   - DEC-019-033 ② (HITL 第 9 種 dev_kickoff_approval 入力源)
 *
 * **重要な制約 (R-019-10 / R-019-11 緩和)**:
 *   - critical-domain-filter は fail-safe denylist。CB-S-W0-02 ホワイトリスト原案 (5/9 期限)
 *     完成までは denylist 主軸で運用。完成後にホワイトリストを W3 で追加する。
 *   - OSS license 検証は本 skill のスコープ外。出力に licenseCheckRequired:true フラグを必須化し、
 *     後続 task (`codex_output_license_check` skill) で検証することを明示。
 */
import {
  applyCriticalDomainFilter,
  assertCriticalDenylistReady,
} from './filters/critical-domain-filter.js'
import { applyMultilingualCriticalFilter } from './filters/multilingual-filter.js'
import type { MultilingualFilterOptions } from './filters/multilingual-filter.js'
import { computeScore } from './scoring/score-v0.js'
import { fetchHnTrending, type HnTrendingFetchOptions } from './sources/hn-trending.js'
import type {
  Candidate,
  NeedsScoutResult,
  RejectedCandidate,
  ScoringResult,
} from './sources/types.js'

export type {
  Candidate,
  CandidateSource,
  NeedsScoutResult,
  RejectedCandidate,
  ScoringResult,
  SourceTier,
} from './sources/types.js'

export {
  fetchHnTrending,
  HN_ALGOLIA_DEFAULT_ENDPOINT,
  computeAgeHours,
  extractDomain,
  extractKeywords,
  type HnTrendingFetchOptions,
} from './sources/hn-trending.js'

export {
  computeScore,
  normalizeAge,
  normalizeComments,
  normalizeKeywordMatch,
  normalizePoints,
  SCORE_V0_KEYWORD_BOOSTS,
  SCORE_V0_WEIGHTS,
} from './scoring/score-v0.js'

export {
  applyCriticalDomainFilter,
  assertCriticalDenylistReady,
  CRITICAL_DOMAIN_DENYLIST,
  CRITICAL_DOMAIN_KEYS,
  enforceStrictDenylistFromEnv,
  getDenylistLoadStatus,
  type CriticalDomainFilterResult,
  type DenylistLoadSource,
  type DenylistLoadStatus,
} from './filters/critical-domain-filter.js'

export {
  applyMultilingualCriticalFilter,
  normalizePairForAudit,
  probeMultilingualMatches,
  safeNormalizeMultilingual,
  type MultilingualFilterOptions,
  type MultilingualFilterResult,
  type MultilingualRejectedCandidate,
} from './filters/multilingual-filter.js'

export {
  DenylistLoaderError,
  loadDenylist,
  loadDenylistFullTable,
  loadDenylistOrExit,
  loadDenylistFullTableOrExit,
  type DenylistFullTable,
  type DenylistTier,
  type RuntimeDenylist,
} from './filters/denylist-loader.js'

/**
 * needs_scout skill のファサード入力。
 */
export interface RunNeedsScoutInput {
  /** trending 取得 fetcher オプション (default = HN Algolia API) */
  hn?: HnTrendingFetchOptions
  /** runId override (default = `scout-{ISO}`) */
  runId?: string
  /** 取得後 score 降順での top-N 切り出し (default = 全件) */
  topN?: number
  /** 現在時刻取得 (テスト注入用、default = () => new Date()) */
  now?: () => Date
  /**
   * Round 15 Dev-K (K-2): 多言語フィルタ統合 opt-in。
   * true 時は applyCriticalDomainFilter (NFKC のみ) ではなく
   * applyMultilingualCriticalFilter (NFKC + 漢字統一辞書) を使用。
   * default: false (Round 12 互換維持)
   */
  enableMultilingualFilter?: boolean
  /**
   * Round 15 Dev-K (K-2): 多言語フィルタの細粒度オプション。
   * `enableMultilingualFilter === true` の場合のみ有効。
   * default: { locale: 'auto', unifyChinese: true, unifyKorean: true, unifyJapanese: true }
   */
  multilingualOptions?: MultilingualFilterOptions
}

/**
 * needs_scout skill ファサード (CB-D-W3-01 + CB-D-W3-02 統合)。
 *
 * 1. HN trending TypeScript stories を fetch (subprocess spawn 経路から呼び出し可能)
 * 2. critical domain denylist で fail-safe filter
 * 3. 通過候補に scoring v0 を適用 (純関数、副作用ゼロ)
 * 4. score 降順でソートし top-N を返す
 * 5. licenseCheckRequired:true を必須化 (R-019-11 緩和、後続 task で検証)
 */
export async function runNeedsScout(
  input: RunNeedsScoutInput = {},
): Promise<NeedsScoutResult> {
  const now = input.now ?? (() => new Date())
  const startedAt = now().toISOString()
  const runId = input.runId ?? `scout-${startedAt}`

  // 1. fetch
  const hnOpts = input.hn !== undefined ? input.hn : {}
  const hnOptsWithNow: HnTrendingFetchOptions =
    hnOpts.now !== undefined ? hnOpts : { ...hnOpts, now }
  const fetched = await fetchHnTrending(hnOptsWithNow)
  const fetchedCount = fetched.length

  // 2. filter (fail-safe denylist)
  // Round 15 Dev-K (K-2): enableMultilingualFilter=true で多言語拡張 layer を経由
  const filtered: {
    accepted: readonly Candidate[]
    rejected: readonly RejectedCandidate[]
  } =
    input.enableMultilingualFilter === true
      ? applyMultilingualCriticalFilter(fetched, input.multilingualOptions ?? {})
      : applyCriticalDomainFilter(fetched)

  // 3. scoring (純関数)
  const scored: Array<
    Candidate & { score: number; scoreBreakdown: ScoringResult['breakdown'] }
  > = filtered.accepted.map((c) => {
    const r = computeScore(c)
    return { ...c, score: r.score, scoreBreakdown: r.breakdown }
  })

  // 4. score 降順ソート + top-N
  scored.sort((a, b) => b.score - a.score)
  const accepted =
    typeof input.topN === 'number' && input.topN > 0
      ? scored.slice(0, input.topN)
      : scored

  // 5. licenseCheckRequired 必須化 (R-019-11)
  const finishedAt = now().toISOString()
  return {
    accepted,
    rejected: filtered.rejected,
    fetchedCount,
    meta: {
      runId,
      startedAt,
      finishedAt,
      licenseCheckRequired: true,
    },
  }
}

/**
 * Round 15 Dev-K (K-1): production 起動経路用 fail-fast 版 facade。
 *
 * 動作:
 *   1. `assertCriticalDenylistReady()` で YAML 由来 denylist が確実に load されていることを検証
 *      → legacy fallback 採用時は DenylistLoaderError throw
 *   2. その後 `runNeedsScout()` を通常 invoke
 *
 * 利用箇所: production CLI / cron job 起動経路 (本番では legacy fallback 動作させない方針)
 *
 * @throws DenylistLoaderError YAML denylist 未 load (legacy fallback) 時
 */
export async function runNeedsScoutWithFailFast(
  input: RunNeedsScoutInput = {},
): Promise<NeedsScoutResult> {
  // K-1 起動 fail-fast: YAML denylist が legacy fallback の場合は即 throw
  assertCriticalDenylistReady()
  return runNeedsScout(input)
}
