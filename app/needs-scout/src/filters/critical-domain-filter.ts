/**
 * needs-scout filters/critical-domain-filter — Round 9 案 9-A1 前倒し:
 *   重要 13 領域の fail-safe denylist フィルタ (R-019-10 緩和)。
 *
 * 設計方針:
 *   - DEC-019-010 で確定した「重要 13 領域 = 人間確認なし完全自動化禁止」を
 *     candidate (HN trending story) に適用する fail-safe フィルタ。
 *   - 13 領域 = 重要インフラ / 教育 / 住居 / 雇用 / 金融 / 保険 / 法律 / 医療 / 行政 /
 *               製品安全 / 国家安全保障 / 移住 / 法執行
 *   - **fail-safe**: title + url + rawText の 3 軸を lowercase 部分一致で確認し、
 *     **1 件でも match した時点で reject** (疑わしき場合は reject)。
 *   - reject 理由 (matchedDomain + matchedTerm + matchedFields) を返すことで
 *     audit log + Open Claw → CEO 構造化 JSON IF 経路で透明性を担保。
 *   - **W3 引継**: CB-S-W0-02 (5/9 期限) のホワイトリスト原案完成後、本フィルタを
 *     denylist + allowlist 両方を持つ 2 段判定に進化させる (allowlist 一致 + denylist 不一致 → accept)。
 *     現時点では denylist のみ。
 *
 * 関連:
 *   - DEC-019-010 (OpenAI ToS 解釈 — 重要 13 領域、ホワイト/ブラック原案 5/9)
 *   - CB-S-W0-02 (対象分野ホワイトリスト原案)
 *   - R-019-10 (重要領域に踏み込んだ案件を完全自動で進めるリスク)
 */
import type { Candidate, RejectedCandidate } from '../sources/types.js'
import { normalizeForFilter } from './normalization.js'
import { DenylistLoaderError, loadDenylist } from './denylist-loader.js'

/**
 * 重要 13 領域の denylist (lowercase、部分一致用)。
 *
 * 各領域に対応する典型 keyword / domain ヒント。
 * **fail-safe 設計**: keyword は意図的に広く取る (false positive 容認、false negative 拒絶)。
 *
 * Round 10 拡張 (案 10-α、Review-B 391 keyword set 起点):
 *   - critical 7 件 + major 26 件 = 33 件追加 (review-round9-critical-13-domain-keyword-set.md §3.2 / §3.3)
 *   - minor 16 件は BACKLOG-MINOR-DENYLIST.md に整理 (5/12 drill 前期限)
 *   - 既存配列は無改変、Round 10 追加分は領域末尾に append (audit trace 維持)
 */
/**
 * Round 12 Dev-A: hard-coded literal は audit trace 維持のため残置 (LEGACY_DENYLIST_LITERAL)、
 * runtime export `CRITICAL_DOMAIN_DENYLIST` は YAML loader 出力に切り替え (CB-D-W3-01 完遂)。
 *
 * fallback 動作: YAML load 失敗時は LEGACY_DENYLIST_LITERAL を採用 (起動 fail-fast vs 旧動作維持の
 * トレードオフでは fail-safe = 旧動作維持を選択、Round 13 で運用 PR フロー確立後 fail-fast 化検討)。
 */
const LEGACY_DENYLIST_LITERAL: Readonly<
  Record<string, readonly string[]>
> = Object.freeze({
  // 1. 重要インフラ (Critical Infrastructure)
  critical_infrastructure: Object.freeze([
    'power grid',
    'electric grid',
    'nuclear',
    'water utility',
    'pipeline',
    'scada',
    'ics',
    'industrial control',
    'gas utility',
    'critical infrastructure',
    // Round 10 追加 (critical 1 = SCADA は既存 'scada' を維持 + 同義 critical 用語追加; major 5 + minor 0)
    'smart grid',
    '配電制御',
    'ガス供給管理',
    'データセンター冷却',
    '上下水処理',
    // Round 11 minor 追加 (3 件 / BACKLOG-MINOR-DENYLIST.md B-01)
    '廃棄物処理制御',
    '空調 bacnet',
    'エレベーター制御',
  ]),
  // 2. 教育 (Education)
  education: Object.freeze([
    'k-12',
    'k12',
    'student record',
    'student records',
    'school grade',
    'school grades',
    'edtech minor',
    'minor education',
    'school district',
    'transcript service',
    // Round 10 追加 (critical 1 = COPPA; major 4 + minor 0)
    'coppa',
    '偏差値判定',
    '教員評価',
    '自動採点',
    'テスト採点',
    // Round 11 minor 追加 (2 件 / BACKLOG-MINOR-DENYLIST.md B-02)
    '学習進捗評価',
    '学習進捗判定',
  ]),
  // 3. 住居 (Housing)
  housing: Object.freeze([
    'housing application',
    'tenant screening',
    'rental discrimination',
    'eviction',
    'housing voucher',
    'section 8',
    'mortgage approval',
    'fair housing',
    // Round 10 追加 (major 2)
    'tenant scoring',
    'rent automation',
    // Round 11 minor 追加 (3 件 / BACKLOG-MINOR-DENYLIST.md B-03 不動産業界用語)
    '修繕費判定',
    '敷金判定',
    '礼金算定',
  ]),
  // 4. 雇用 (Employment)
  employment: Object.freeze([
    'hiring decision',
    'resume screening',
    'applicant tracking',
    'background check',
    'firing',
    'termination',
    'wage decision',
    'salary decision',
    'employment screening',
    // Round 10 追加 (major 2)
    'ats 自動判定',
    '採用適性スコア',
    // Round 11 minor 追加 (1 件 / BACKLOG-MINOR-DENYLIST.md B-04 — 既存 'applicant tracking' で部分 hit するが audit 用に明示)
    'applicant tracking system',
  ]),
  // 5. 金融 (Finance)
  finance: Object.freeze([
    'credit score',
    'credit decision',
    'loan approval',
    'lending',
    'mortgage',
    'banking customer',
    'investment advice',
    'fintech kyc',
    'aml screening',
    'kyc verification',
    // Round 10 追加 (critical 1 = trading bot; major 2)
    'trading bot',
    'algo trading',
    'defi 自動運用',
    // Round 11 minor 追加 (1 件 / BACKLOG-MINOR-DENYLIST.md B-05 日本国内信用情報)
    'cic スコア',
  ]),
  // 6. 保険 (Insurance)
  insurance: Object.freeze([
    'insurance claim',
    'insurance underwriting',
    'underwriter',
    'claims processing',
    'insurance pricing',
    'risk pricing',
    'health insurance',
    'auto insurance',
    // Round 10 追加 (major 1)
    'underwriting ai',
    // Round 11 minor 追加 (2 件 / BACKLOG-MINOR-DENYLIST.md B-06)
    '引受査定 ai',
    'actuary 自動',
  ]),
  // 7. 法律 (Legal)
  legal: Object.freeze([
    'legal advice',
    'lawyer ai',
    'court ruling',
    'judicial',
    'sentencing',
    'attorney advice',
    'paralegal automation',
    'contract review high-stakes',
    // Round 10 追加 (critical 1 = 弁護士法 72 条; major 2)
    '弁護士法 72 条',
    '弁護士法72条',
    'legal opinion',
    '法律 ai',
  ]),
  // 8. 医療 (Medical)
  medical: Object.freeze([
    'diagnosis',
    'patient record',
    'patient records',
    'medical advice',
    'prescription',
    'clinical decision',
    'phi',
    'hipaa',
    'medical imaging diagnosis',
    'mental health diagnosis',
    'therapy session',
    'symptom check',
    // Round 10 追加 (critical 1 = 医師法 17 条; major 2)
    '医師法 17 条',
    '医師法17条',
    'telemedicine 診断',
    'online consultation 診断',
  ]),
  // 9. 行政 (Government / Public Administration)
  government: Object.freeze([
    'government benefit',
    'public benefit',
    'social welfare',
    'welfare eligibility',
    'tax assessment',
    'public service eligibility',
    'voter registration',
    'voting system',
    'election',
    // Round 10 追加 (含有率 100% — 追加なし、領域 sign-off)
  ]),
  // 10. 製品安全 (Product Safety)
  product_safety: Object.freeze([
    'product recall',
    'product safety',
    'consumer safety',
    'food safety',
    'drug safety',
    'pharmaceutical safety',
    'toy safety',
    'automotive safety',
    'firearm safety',
    // Round 10 追加 (major 1)
    'haccp 判定',
    // Round 11 minor 追加 (2 件 / BACKLOG-MINOR-DENYLIST.md B-10 品質マネジメント)
    'iso 9001 判定',
    'iso 13485 判定',
  ]),
  // 11. 国家安全保障 (National Security)
  national_security: Object.freeze([
    'national security',
    'classified',
    'defense system',
    'weapons system',
    'cyber warfare',
    'intelligence agency',
    'military operations',
    'export control',
    'itar',
    'ofac',
    // Round 10 追加 (major 2)
    'offensive cyber',
    'laws',
  ]),
  // 12. 移住 (Immigration)
  immigration: Object.freeze([
    'immigration',
    'visa application',
    'asylum',
    'deportation',
    'border control',
    'ice enforcement',
    'cbp',
    'uscis',
    'refugee',
    // Round 10 追加 (critical 1 = 行政書士法 1 条の 2; major 2)
    '行政書士法 1 条の 2',
    '行政書士法1条の2',
    'refugee status',
    'asylum 申請',
  ]),
  // 13. 法執行 (Law Enforcement)
  law_enforcement: Object.freeze([
    'law enforcement',
    'predictive policing',
    'arrest record',
    'arrest records',
    'criminal record',
    'criminal records',
    'parole decision',
    'probation decision',
    'facial recognition surveillance',
    'police body cam analysis',
    // Round 10 追加 (critical 1 = COMPAS; major 1)
    'compas',
    'recidivism risk',
  ]),
})

/**
 * Round 12 Dev-A: runtime export は YAML loader 出力 (起動時 1 回のみ load、Object.freeze 済)。
 *
 * YAML load 失敗時 (file 欠落 / parse error 等) は LEGACY_DENYLIST_LITERAL に fallback。
 * これにより本 file 単体での import / test 互換性を維持しつつ、CB-D-W3-01 の YAML 直書き化を実現。
 *
 * Round 15 Dev-K (K-1 fail-fast 統合):
 *   - Round 14 で `denylist-loader.ts` 側に DenylistLoaderError + assertDenylistIntegrity を実装済。
 *   - 本 file は historical compatibility のため module-load 時は依然 fallback だが、
 *     `assertCriticalDenylistReady()` を起動経路 (CLI / runNeedsScout fail-fast 版) で呼ぶことで
 *     fallback 採用時に明示的 throw できるようにする。
 *   - 環境変数 NEEDS_SCOUT_STRICT_DENYLIST=1 設定時は module-load 時点でも throw する
 *     (production 起動経路で誤って legacy fallback が使われることを防ぐ)。
 *   - ロード失敗の真因 (DenylistLoaderError or 領域 key 不整合) を `_loadFailureReason`
 *     に保存して assertCriticalDenylistReady() / getDenylistLoadStatus() から参照可能にする。
 */

/**
 * Round 15 Dev-K: 起動時に YAML load の成否を記録する型。
 *
 * - 'yaml': YAML から正常 load (期待状態)
 * - 'legacy_fallback': YAML 失敗 → LEGACY_DENYLIST_LITERAL を採用 (fail-safe 互換動作)
 */
export type DenylistLoadSource = 'yaml' | 'legacy_fallback'

/**
 * Round 15 Dev-K: 起動時 load の状態。assertCriticalDenylistReady() で参照する。
 */
export interface DenylistLoadStatus {
  readonly source: DenylistLoadSource
  /** legacy_fallback の場合の真因 message (YAML 起動成功時は null) */
  readonly failureReason: string | null
  /** load 試行時の YAML path (test override の場合は null、本番は YAML 解決 path) */
  readonly attemptedPath: string | null
}

let _loadStatus: DenylistLoadStatus = Object.freeze({
  source: 'yaml',
  failureReason: null,
  attemptedPath: null,
})

function loadDenylistWithFallback(): Readonly<Record<string, readonly string[]>> {
  try {
    const loaded = loadDenylist()
    // 必須 13 領域がすべて存在するか軽く検証 (zod 経由で形式は保証済だが念のため key set 確認)
    const expectedKeys = Object.keys(LEGACY_DENYLIST_LITERAL)
    const missing: string[] = []
    for (const k of expectedKeys) {
      if (!(k in loaded)) missing.push(k)
    }
    if (missing.length > 0) {
      _loadStatus = Object.freeze({
        source: 'legacy_fallback' as const,
        failureReason: `expected 13 critical domains, missing keys: ${missing.join(', ')}`,
        attemptedPath: null,
      })
      return LEGACY_DENYLIST_LITERAL
    }
    _loadStatus = Object.freeze({
      source: 'yaml' as const,
      failureReason: null,
      attemptedPath: null,
    })
    return loaded
  } catch (err) {
    const message =
      err instanceof DenylistLoaderError
        ? `${err.name}: ${err.message}`
        : `${(err as Error).name ?? 'Error'}: ${(err as Error).message}`
    _loadStatus = Object.freeze({
      source: 'legacy_fallback' as const,
      failureReason: message,
      attemptedPath: null,
    })
    return LEGACY_DENYLIST_LITERAL
  }
}

export const CRITICAL_DOMAIN_DENYLIST: Readonly<
  Record<string, readonly string[]>
> = Object.freeze(loadDenylistWithFallback())

/**
 * Round 15 Dev-K (K-1): module-load 時点での YAML load 状態を返す。
 *
 * - source === 'yaml' なら正常 load
 * - source === 'legacy_fallback' なら何らかの理由で YAML load に失敗、LEGACY_DENYLIST_LITERAL を採用
 *
 * 本 status は **module load 時点で 1 回確定**し、その後は freeze される。
 *
 * @returns DenylistLoadStatus (frozen)
 */
export function getDenylistLoadStatus(): DenylistLoadStatus {
  return _loadStatus
}

/**
 * Round 15 Dev-K (K-1): production 起動経路で「YAML 由来の denylist が確実に load されている」
 * ことを保証する fail-fast assertion。
 *
 * 動作:
 *   - YAML 由来 (source === 'yaml') → throw なし (正常)
 *   - legacy fallback 採用 (source === 'legacy_fallback') → DenylistLoaderError throw
 *     (どの YAML / 何が問題か を message に含む)
 *
 * 利用箇所:
 *   - `runNeedsScoutWithFailFast()` (本 file からは呼ばないが、index.ts の strict 版で利用)
 *   - production CLI 起動経路 (NEEDS_SCOUT_STRICT_DENYLIST=1 時)
 *   - test 経路では呼ばない (legacy fallback 経路を意図的に exercise する test がある)
 *
 * @throws DenylistLoaderError YAML load 失敗で legacy fallback 採用時
 */
export function assertCriticalDenylistReady(): void {
  if (_loadStatus.source === 'yaml') return
  const reason = _loadStatus.failureReason ?? 'unknown failure'
  throw new DenylistLoaderError(
    `critical-domain-filter: YAML denylist not loaded; running on legacy fallback. ` +
      `This is unsafe for production. cause: ${reason}. ` +
      `Action: verify needs-scout/config/denylist.yaml is present and valid; run lint:denylist.`,
  )
}

/**
 * Round 15 Dev-K (K-1): NEEDS_SCOUT_STRICT_DENYLIST=1 (or true) が環境変数で指定された場合、
 * module load 時点で fallback が採用されたら即 throw する。
 *
 * 副作用: process.env を読むのみ、書き込み 0、log 1 行 (失敗時のみ stderr)。
 * test では呼ばない。production startup script (scripts/preflight-env.ts 等) で呼ぶ想定。
 */
export function enforceStrictDenylistFromEnv(): void {
  const v = process.env.NEEDS_SCOUT_STRICT_DENYLIST
  if (v === '1' || v === 'true') {
    assertCriticalDenylistReady()
  }
}

/**
 * Round 15 Dev-K (K-1): test 経路専用。_loadStatus を任意の値に上書きして
 * assertCriticalDenylistReady の throw / non-throw を駆動する。
 *
 * 注意:
 *   - production code から絶対に呼ばない (test 専用 API)
 *   - 呼び出し後は必ず `_resetCriticalDenylistLoadStatusForTesting()` で元に戻すこと
 *
 * @internal
 */
export function _setCriticalDenylistLoadStatusForTesting(
  next: DenylistLoadStatus,
): void {
  _loadStatus = Object.freeze({
    source: next.source,
    failureReason: next.failureReason,
    attemptedPath: next.attemptedPath,
  })
}

/**
 * Round 15 Dev-K (K-1): test 経路専用。_loadStatus を 'yaml' 正常状態にリセットする。
 *
 * @internal
 */
export function _resetCriticalDenylistLoadStatusForTesting(): void {
  _loadStatus = Object.freeze({
    source: 'yaml',
    failureReason: null,
    attemptedPath: null,
  })
}

/** 13 領域の key 配列 (順序固定)。 */
export const CRITICAL_DOMAIN_KEYS: readonly string[] = Object.freeze(
  Object.keys(CRITICAL_DOMAIN_DENYLIST),
)

/**
 * filter 結果。accepted + rejected を返す。
 */
export interface CriticalDomainFilterResult {
  accepted: readonly Candidate[]
  rejected: readonly RejectedCandidate[]
}

/**
 * fail-safe critical domain filter。
 *
 * - title + url + rawText の 3 軸 lowercase 部分一致を実施
 * - 1 件でも denylist match で reject、reject 理由 (matchedDomain + matchedTerm + matchedFields) を返す
 * - 複数領域で hit した場合は最初に hit した領域を採用 (fail-safe: 全 13 領域走査するが reject 確定後は次の候補へ)
 *
 * @param candidates 入力候補
 * @returns accepted (denylist 不一致) と rejected (理由付き) の 2 リスト
 */
export function applyCriticalDomainFilter(
  candidates: readonly Candidate[],
): CriticalDomainFilterResult {
  const accepted: Candidate[] = []
  const rejected: RejectedCandidate[] = []

  for (const c of candidates) {
    // Round 12 Dev-A: NFKC + lowercase + 空白圧縮を一括適用 (全角混在 / 大小文字混在の吸収)。
    // 既存挙動互換: 半角 ASCII lowercase 入力に対しては toLowerCase() と等価動作。
    const titleLower = normalizeForFilter(c.title)
    const urlLower = normalizeForFilter(c.url)
    const rawLower = normalizeForFilter(c.rawText)

    let hit: RejectedCandidate | null = null
    for (const [domainKey, terms] of Object.entries(CRITICAL_DOMAIN_DENYLIST)) {
      for (const term of terms) {
        const matchedFields: ('title' | 'url' | 'rawText')[] = []
        if (titleLower.includes(term)) matchedFields.push('title')
        if (urlLower.includes(term)) matchedFields.push('url')
        if (rawLower.includes(term)) matchedFields.push('rawText')
        if (matchedFields.length > 0) {
          hit = {
            candidate: c,
            matchedDomain: domainKey,
            matchedTerm: term,
            matchedFields: Object.freeze(matchedFields),
            reason: `critical-domain-filter: matched '${term}' in ${matchedFields.join(
              '+',
            )} (domain=${domainKey}); rejected by fail-safe denylist (DEC-019-010 R-019-10)`,
          }
          break
        }
      }
      if (hit) break
    }

    if (hit) {
      rejected.push(hit)
    } else {
      accepted.push(c)
    }
  }

  return { accepted: Object.freeze(accepted), rejected: Object.freeze(rejected) }
}
