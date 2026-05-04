/**
 * needs-scout filters/multilingual-filter — Round 14 Dev-A:
 *   Round 13 で導入した normalization-multilingual.ts を critical-domain-filter に
 *   注入する統合 pipeline。中文 / 韓国語 / 日本語 + 既存 NFKC を統合判定する。
 *
 * 設計方針:
 *   - **opt-in 拡張**: 既存 `applyCriticalDomainFilter` (Round 9 着地) を破壊せず、
 *     本 file は **wrapper** として上位呼び出し用に多言語前処理を追加適用する。
 *   - **2 段判定**: candidate.title / url / rawText を
 *       (1) Round 12 NFKC layer (`normalizeForFilter`) で判定 → 既存挙動
 *       (2) Round 13 多言語 layer (`safeNormalize` w/ locale=auto) でも判定 → 多言語拡張
 *     どちらか一方でも denylist 一致 → reject (fail-safe)。
 *   - **idempotent 性**: 多言語 layer は NFKC 後に辞書置換、Round 12 出力に対して再適用
 *     しても結果不変 (詳細は normalization-multilingual.ts §設計方針)。
 *   - **denylist は無加工**: denylist YAML は ASCII / NFKC-stable 日本語のみで記述、
 *     辞書置換後の文字列に対しても部分一致が成立する設計 (例: '弁護士法 72 条' は
 *     '辯護士法 72 條' を ja locale で正規化すると '弁护士法 72 条' になり、'弁'+'士'+
 *     '法' の連続が部分一致)。
 *   - **副作用 0 / 例外 throw 0**: 純関数。fail-safe denylist 哲学を維持。
 *
 * 関連:
 *   - DEC-019-010 (重要 13 領域 fail-safe denylist)
 *   - critical-domain-filter.ts (本 file が wrap する基盤フィルタ)
 *   - normalization-multilingual.ts (Round 13 着地、本 file が呼び出す)
 *   - dev-round13-A-multilingual-nfkc-hn-fetch.md §8.2 #2 引継 (本 task)
 */

import type { Candidate, RejectedCandidate } from '../sources/types.js'
import {
  CRITICAL_DOMAIN_DENYLIST,
  applyCriticalDomainFilter,
  type CriticalDomainFilterResult,
} from './critical-domain-filter.js'
import { normalizeForFilter } from './normalization.js'
import {
  detectLocale,
  normalizeMultilingual,
  safeNormalize as safeNormalizeMultilingual,
} from './normalization-multilingual.js'

/**
 * 多言語フィルタ拡張のオプション。
 */
export interface MultilingualFilterOptions {
  /**
   * locale 強制指定 (default: 'auto' = candidate ごとに自動検出)。
   * 'auto' なら title + rawText を結合して `detectLocale` 推定。
   */
  readonly locale?: 'ja' | 'zh' | 'ko' | 'auto'
  /**
   * 中文 (繁体 → 簡体) 統一を有効化 (default: true)
   */
  readonly unifyChinese?: boolean
  /**
   * 韓国語 (한자 → 統一字) 統一を有効化 (default: true)
   */
  readonly unifyKorean?: boolean
  /**
   * 日本語 (旧字体 → 新字体) 統一を有効化 (default: true)
   */
  readonly unifyJapanese?: boolean
}

/**
 * 拡張 reject 理由 (既存 RejectedCandidate を継承し、多言語 layer hit 情報を追加)。
 */
export interface MultilingualRejectedCandidate extends RejectedCandidate {
  /**
   * どの正規化 layer で hit したか:
   *   - 'baseline' = Round 12 NFKC layer のみで hit (既存挙動と等価)
   *   - 'multilingual' = 多言語 layer のみで hit (Round 14 拡張)
   *   - 'both' = 両方で hit
   */
  readonly hitLayer: 'baseline' | 'multilingual' | 'both'
}

/**
 * 多言語拡張版 filter 結果。
 */
export interface MultilingualFilterResult {
  readonly accepted: readonly Candidate[]
  readonly rejected: readonly MultilingualRejectedCandidate[]
}

/**
 * candidate を 1 件、多言語拡張 normalize 経路で denylist チェックする。
 *
 * 戻り値: 1 件以上 hit したら最初の hit 情報を、なければ null。
 * fail-safe: 1 件でも match で reject (Round 9 着地哲学を維持)。
 *
 * @param c 入力 candidate
 * @param options 多言語フラグ
 * @returns hit 情報 or null
 */
function findMultilingualHit(
  c: Candidate,
  options: Required<MultilingualFilterOptions>,
): {
  matchedDomain: string
  matchedTerm: string
  matchedFields: ('title' | 'url' | 'rawText')[]
} | null {
  const { locale, unifyChinese, unifyKorean, unifyJapanese } = options

  // locale='auto' なら candidate 単位で自動検出
  const probeText = `${c.title} ${c.rawText}`
  const effectiveLocale =
    locale === 'auto' ? detectLocale(probeText) : locale

  // multilingual normalize (locale 適用版)
  // safeNormalizeMultilingual は locale undefined 時に Round 12 互換 (辞書 bypass) なので、
  // locale が確定しているこのパスでは normalizeMultilingual を直接呼ぶ。
  const titleM =
    effectiveLocale === 'auto'
      ? normalizeForFilter(c.title)
      : normalizeMultilingual(c.title, {
          unifyChinese,
          unifyKorean,
          unifyJapanese,
        })
  const urlM =
    effectiveLocale === 'auto'
      ? normalizeForFilter(c.url)
      : normalizeMultilingual(c.url, {
          unifyChinese,
          unifyKorean,
          unifyJapanese,
        })
  const rawM =
    effectiveLocale === 'auto'
      ? normalizeForFilter(c.rawText)
      : normalizeMultilingual(c.rawText, {
          unifyChinese,
          unifyKorean,
          unifyJapanese,
        })

  for (const [domainKey, terms] of Object.entries(CRITICAL_DOMAIN_DENYLIST)) {
    for (const term of terms) {
      const matchedFields: ('title' | 'url' | 'rawText')[] = []
      if (titleM.includes(term)) matchedFields.push('title')
      if (urlM.includes(term)) matchedFields.push('url')
      if (rawM.includes(term)) matchedFields.push('rawText')
      if (matchedFields.length > 0) {
        return {
          matchedDomain: domainKey,
          matchedTerm: term,
          matchedFields,
        }
      }
    }
  }
  return null
}

/**
 * 多言語拡張版 critical-domain filter (Round 14 Dev-A)。
 *
 * 動作:
 *   1. 既存 `applyCriticalDomainFilter` (Round 12 NFKC layer) で baseline 判定
 *   2. baseline accepted の中から `findMultilingualHit` で多言語 layer 判定
 *   3. baseline / multilingual のどちらかで hit したら reject
 *   4. hitLayer field で「どちら経路で hit したか」を記録 (audit 用)
 *
 * 後方互換:
 *   - baseline で hit したものは hitLayer='baseline' or 'both' で reject される
 *     (既存 critical-domain-filter と同等の挙動を担保しつつ、多言語 hit を追加で検出)
 *   - multilingual layer のみで hit すれば hitLayer='multilingual'
 *   - reject 件数は既存以上 (false negative を減らす方向、false positive 容認)
 *
 * @param candidates 入力候補
 * @param options 多言語フラグ (default: 全 unify on / locale=auto)
 * @returns accepted (両 layer 通過) + rejected (理由付き、layer 情報付き)
 */
export function applyMultilingualCriticalFilter(
  candidates: readonly Candidate[],
  options: MultilingualFilterOptions = {},
): MultilingualFilterResult {
  const opts: Required<MultilingualFilterOptions> = {
    locale: options.locale ?? 'auto',
    unifyChinese: options.unifyChinese ?? true,
    unifyKorean: options.unifyKorean ?? true,
    unifyJapanese: options.unifyJapanese ?? true,
  }

  // Step 1: baseline (Round 12 NFKC) で判定
  const baseline: CriticalDomainFilterResult =
    applyCriticalDomainFilter(candidates)
  const baselineRejectedById = new Map<string, RejectedCandidate>()
  for (const r of baseline.rejected) {
    baselineRejectedById.set(r.candidate.id, r)
  }

  // Step 2: multilingual 拡張で再判定 (全候補に対して、reject の上書き含む)
  const finalAccepted: Candidate[] = []
  const finalRejected: MultilingualRejectedCandidate[] = []

  for (const c of candidates) {
    const baselineHit = baselineRejectedById.get(c.id) ?? null
    const multilingualHit = findMultilingualHit(c, opts)

    if (baselineHit && multilingualHit) {
      // 両 layer hit
      // hitLayer は 'both'、matchedDomain/matchedTerm は baseline 優先 (既存 audit 互換)
      finalRejected.push({
        candidate: c,
        matchedDomain: baselineHit.matchedDomain,
        matchedTerm: baselineHit.matchedTerm,
        matchedFields: baselineHit.matchedFields,
        reason:
          `multilingual-critical-filter: baseline=${baselineHit.matchedDomain}` +
          ` matched in ${baselineHit.matchedFields.join('+')}; ` +
          `multilingual=${multilingualHit.matchedDomain} matched '${multilingualHit.matchedTerm}'` +
          ` in ${multilingualHit.matchedFields.join('+')} (DEC-019-010 R-019-10)`,
        hitLayer: 'both',
      })
      continue
    }
    if (baselineHit) {
      finalRejected.push({
        candidate: baselineHit.candidate,
        matchedDomain: baselineHit.matchedDomain,
        matchedTerm: baselineHit.matchedTerm,
        matchedFields: baselineHit.matchedFields,
        reason: baselineHit.reason,
        hitLayer: 'baseline',
      })
      continue
    }
    if (multilingualHit) {
      finalRejected.push({
        candidate: c,
        matchedDomain: multilingualHit.matchedDomain,
        matchedTerm: multilingualHit.matchedTerm,
        matchedFields: Object.freeze(multilingualHit.matchedFields),
        reason:
          `multilingual-critical-filter: matched '${multilingualHit.matchedTerm}'` +
          ` in ${multilingualHit.matchedFields.join('+')}` +
          ` (domain=${multilingualHit.matchedDomain});` +
          ` rejected by multilingual normalization (DEC-019-010 R-019-10)`,
        hitLayer: 'multilingual',
      })
      continue
    }
    finalAccepted.push(c)
  }

  return {
    accepted: Object.freeze(finalAccepted),
    rejected: Object.freeze(finalRejected),
  }
}

/**
 * helper: 任意の文字列を「baseline 正規化」と「多言語正規化」の両方で返す。
 * audit / debug / test 用。
 *
 * @param input 任意文字列
 * @param locale 'auto' 含む locale 指定
 */
export function normalizePairForAudit(
  input: string,
  locale: 'ja' | 'zh' | 'ko' | 'auto' = 'auto',
): { baseline: string; multilingual: string; effectiveLocale: 'ja' | 'zh' | 'ko' | 'auto' } {
  const baseline = normalizeForFilter(input)
  const effectiveLocale =
    locale === 'auto' ? detectLocale(input) : locale
  const multilingual =
    effectiveLocale === 'auto'
      ? baseline
      : normalizeMultilingual(input, {
          unifyChinese: true,
          unifyKorean: true,
          unifyJapanese: true,
        })
  return { baseline, multilingual, effectiveLocale }
}

/**
 * helper: 2 layer normalization 経由で文字列が denylist の **どの** keyword に
 * hit するかを返す (test / audit 用)。
 *
 * @param text 任意文字列
 * @returns hit 情報 (domain + term + layer) の配列、何も hit しなければ空配列
 */
export function probeMultilingualMatches(
  text: string,
): ReadonlyArray<{
  readonly domain: string
  readonly term: string
  readonly layer: 'baseline' | 'multilingual'
}> {
  const baseline = normalizeForFilter(text)
  const detected = detectLocale(text)
  const multilingual =
    detected === 'auto'
      ? baseline
      : normalizeMultilingual(text, {
          unifyChinese: true,
          unifyKorean: true,
          unifyJapanese: true,
        })

  const hits: { domain: string; term: string; layer: 'baseline' | 'multilingual' }[] = []
  for (const [domain, terms] of Object.entries(CRITICAL_DOMAIN_DENYLIST)) {
    for (const term of terms) {
      if (baseline.includes(term)) hits.push({ domain, term, layer: 'baseline' })
      if (multilingual !== baseline && multilingual.includes(term)) {
        hits.push({ domain, term, layer: 'multilingual' })
      }
    }
  }
  return Object.freeze(hits)
}

/**
 * Round 14 Dev-A: 上位 API (re-export safeNormalize for convenience)。
 * 既存 import をシンプル化するために本 file 経由で expose。
 */
export { safeNormalizeMultilingual }
