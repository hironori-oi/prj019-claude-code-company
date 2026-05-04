/**
 * needs-scout sources/types — Round 9 案 9-A1 前倒し (CB-D-W3-01 + CB-D-W3-02 統合):
 *   trending source 横断の正規化型定義。
 *
 * 設計方針:
 *   - source 横断 (HN / PH / GitHub Trending) で同一 shape を返す。
 *     Phase 1 W3 では HN のみだが、後続 W3 で PH / GitHub Trending を追加する想定で
 *     `source` 列挙と `sourceTier` を分離。
 *   - DEC-019-033 ② HITL 第 9 種 `dev_kickoff_approval` 提案書テンプレ 7 項目との
 *     橋渡しに必要な field を含める (signalScore + rawText)。
 *   - 重要 13 領域 fail-safe フィルタ (R-019-10 緩和) で reject された候補は
 *     `RejectedCandidate` として理由付きで返す。
 *
 * 関連:
 *   - DEC-019-010 (OpenAI ToS 解釈 — 重要 13 領域は人間確認なし完全自動化禁止)
 *   - CB-S-W0-02 (対象分野ホワイトリスト原案 5/9 期限) — 完成後にホワイトリスト追加
 *   - CB-D-W3-01 (needs_scout skill MVP) / CB-D-W3-02 (評価関数 v0)
 */

/** trending source の出自。Phase 1 W3 では 'hackernews' のみ。 */
export type CandidateSource = 'hackernews' | 'producthunt' | 'github_trending'

/**
 * source ティア。risk 評価に使う。
 *   - tier1: 信頼度高、moderation 強 (HN front page / PH 公開済)
 *   - tier2: 信頼度中、moderation 弱 (GitHub Trending raw)
 *   - tier3: 未検証 (W3 では未使用、W4 以降で reddit 等を想定)
 */
export type SourceTier = 'tier1' | 'tier2' | 'tier3'

/** trending 候補の正規化形。 */
export interface Candidate {
  /** source 内 ID (HN: objectID, PH: id, GH: full_name 等) */
  id: string
  /** タイトル */
  title: string
  /** 候補の URL (story の外部リンク or HN itself) */
  url: string
  /** 出自 source */
  source: CandidateSource
  /** source ティア */
  sourceTier: SourceTier
  /** ホスト名 (例: github.com / news.ycombinator.com) */
  domain: string
  /** ISO8601 (UTC) で公開日時 */
  publishedAt: string
  /**
   * シグナルスコア (raw、未正規化、scoring v0 への入力):
   *   HN の場合: { points, num_comments, ageHours, keywords[] } を統合した raw値
   * scoring/score-v0.ts が再計算して 0-100 範囲の score に正規化する。
   */
  signalScore: {
    points: number
    numComments: number
    ageHours: number
    keywords: readonly string[]
  }
  /** 生テキスト (タイトル + 説明 + コメント抜粋等)。critical-domain-filter で全文 lowercase 部分一致用。 */
  rawText: string
  /** 取得 fetcher (テスト注入容易化のための情報、トレース用 optional)。 */
  fetcherMeta?: {
    fetchedAt: string
    apiEndpoint: string
  }
}

/**
 * critical-domain-filter で reject された候補。
 *
 * fail-safe 原則: 1 件でも denylist match で reject。
 * 理由 (matchedTerm + matchedDomain) を返すことで Open Claw 側が監査ログに残せる。
 */
export interface RejectedCandidate {
  candidate: Candidate
  /** ヒットした重要領域 (domain key、例: 'medical' / 'legal') */
  matchedDomain: string
  /** denylist の中で実際に部分一致したワード */
  matchedTerm: string
  /** どの軸でヒットしたか (title / url / rawText のうち 1 つ以上) */
  matchedFields: readonly ('title' | 'url' | 'rawText')[]
  /** 監査ログ用 reason 文字列 (人間可読) */
  reason: string
}

/**
 * scoring v0 の出力 (純関数戻り値、CB-D-W3-02)。
 *
 * 0-100 範囲の score + 内訳 (debugability)。
 */
export interface ScoringResult {
  /** 0-100 範囲の正規化スコア */
  score: number
  /** 内訳: 各シグナルの寄与 */
  breakdown: {
    pointsContribution: number
    commentsContribution: number
    ageContribution: number
    keywordContribution: number
  }
}

/**
 * needs_scout skill 全体の戻り値 (runNeedsScout)。
 */
export interface NeedsScoutResult {
  /** filter + scoring 通過候補 (score 降順)。 */
  accepted: Array<Candidate & { score: number; scoreBreakdown: ScoringResult['breakdown'] }>
  /** filter で reject された候補 (理由付き)。 */
  rejected: readonly RejectedCandidate[]
  /** 取得した raw 候補数 (filter 前) */
  fetchedCount: number
  /** 実行 metadata */
  meta: {
    runId: string
    startedAt: string
    finishedAt: string
    /** OSS license 検証は本 skill のスコープ外 (R-019-11 緩和)、後続 task で必須 */
    licenseCheckRequired: true
  }
}
