/**
 * needs-scout scoring/score-v0 — Round 9 案 9-A1 前倒し (CB-D-W3-02):
 *   評価関数 v0 (Phase 1 はスコアリング固定値)。
 *
 * 設計方針:
 *   - 純関数。副作用ゼロ、入出力のみ (Phase 1 W3 の DoD 達成)。
 *   - 固定重み (DEC-019-033 ② を Phase 2 で見直す前提):
 *       - points (40%)         : HN points 自体を 0-200 → 0-1 に圧縮
 *       - num_comments (25%)   : engagement signal、log scale
 *       - age (15%)            : 24h 以内に高ボーナス、72h 以降は減衰
 *       - keyword match (20%)  : "saas / b2b / tool / framework / cli / api / library" 等の
 *                                 開発ツール系キーワードに固定加点
 *   - 戻り値: 0-100 範囲 + 内訳 breakdown (debugability)。
 *   - score = points * 0.4 + comments * 0.25 + age * 0.15 + keyword * 0.20、各因子 0-100。
 *
 * 関連:
 *   - CB-D-W3-02 (評価関数 v0、Phase 1 固定値)
 */
import type { Candidate, ScoringResult } from '../sources/types.js'

/**
 * scoring v0 の固定重み。
 *
 * 合計 1.0 に正規化されていること。Phase 2 で機械学習化する想定。
 */
export const SCORE_V0_WEIGHTS = Object.freeze({
  points: 0.4,
  comments: 0.25,
  age: 0.15,
  keyword: 0.2,
})

/**
 * 開発ツール / SaaS シグナルの加点キーワード (lowercase)。
 *
 * 重要 13 領域 (人間確認なし完全自動化禁止) とは独立。
 * 本リストは「needs として評価したい領域」のシグナル。
 */
export const SCORE_V0_KEYWORD_BOOSTS: readonly string[] = [
  'saas',
  'b2b',
  'cli',
  'tool',
  'tools',
  'framework',
  'library',
  'api',
  'developer',
  'open',
  'source',
  'oss',
  'self-hosted',
  'serverless',
  'webapp',
  'productivity',
  'automation',
  'ai',
  'agent',
  'typescript',
  'nextjs',
  'react',
  'tailwind',
  'shadcn',
]

/**
 * 評価関数 v0 (純関数、固定重み、CB-D-W3-02 DoD 達成)。
 *
 * 引数の Candidate.signalScore のみを参照し、副作用ゼロ。
 *
 * @returns 0-100 範囲の score + 内訳。
 */
export function computeScore(candidate: Candidate): ScoringResult {
  const { points, numComments, ageHours, keywords } = candidate.signalScore

  // 各因子を 0-100 範囲に正規化
  const pointsContribution = normalizePoints(points) * SCORE_V0_WEIGHTS.points * 100
  const commentsContribution =
    normalizeComments(numComments) * SCORE_V0_WEIGHTS.comments * 100
  const ageContribution = normalizeAge(ageHours) * SCORE_V0_WEIGHTS.age * 100
  const keywordContribution =
    normalizeKeywordMatch(keywords) * SCORE_V0_WEIGHTS.keyword * 100

  const score = clamp0to100(
    pointsContribution + commentsContribution + ageContribution + keywordContribution,
  )

  return {
    score,
    breakdown: {
      pointsContribution: round2(pointsContribution),
      commentsContribution: round2(commentsContribution),
      ageContribution: round2(ageContribution),
      keywordContribution: round2(keywordContribution),
    },
  }
}

/** points 0-200 を 0-1 に圧縮 (200+ は cap)。 */
export function normalizePoints(points: number): number {
  if (!Number.isFinite(points) || points <= 0) return 0
  if (points >= 200) return 1
  return points / 200
}

/** num_comments を log10(1+x)/log10(201) で 0-1 に圧縮。 */
export function normalizeComments(numComments: number): number {
  if (!Number.isFinite(numComments) || numComments <= 0) return 0
  const v = Math.log10(numComments + 1) / Math.log10(201) // 200 comments で 1.0 相当
  return clamp0to1(v)
}

/**
 * 経過時間 (hours) を 0-1 に変換。
 *   - <= 24h: 1.0 (新鮮)
 *   - 24-72h: linear に減衰 1.0 -> 0.3
 *   - >= 72h: 0
 */
export function normalizeAge(ageHours: number): number {
  if (!Number.isFinite(ageHours) || ageHours < 0) return 0
  if (ageHours <= 24) return 1
  if (ageHours >= 72) return 0
  // 24h で 1.0、72h で 0 の線形
  return clamp0to1(1 - (ageHours - 24) / 48)
}

/**
 * keyword マッチ率 (heuristic):
 *   - boosts のうち何件 hit したかを 0-1 に compresss。
 *   - 6 件以上 hit で 1.0 (cap)。
 */
export function normalizeKeywordMatch(keywords: readonly string[]): number {
  if (keywords.length === 0) return 0
  const boostSet = new Set(SCORE_V0_KEYWORD_BOOSTS)
  let hits = 0
  for (const kw of keywords) {
    if (boostSet.has(kw)) hits += 1
  }
  if (hits === 0) return 0
  return clamp0to1(hits / 6)
}

function clamp0to1(v: number): number {
  if (!Number.isFinite(v)) return 0
  if (v < 0) return 0
  if (v > 1) return 1
  return v
}

function clamp0to100(v: number): number {
  if (!Number.isFinite(v)) return 0
  if (v < 0) return 0
  if (v > 100) return 100
  return Math.round(v * 100) / 100
}

function round2(v: number): number {
  if (!Number.isFinite(v)) return 0
  return Math.round(v * 100) / 100
}
