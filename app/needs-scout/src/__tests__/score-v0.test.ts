/**
 * score-v0.test — Round 9 案 9-A1 前倒し (CB-D-W3-02):
 *   評価関数 v0 (純関数、固定重み) の単体テスト。
 *
 * カバー範囲:
 *   1. computeScore 純関数性 - 同一入力で常に同一出力
 *   2. 高 signal 候補 (points 200, 50 comments, 1h age, 6+ keyword hit) → 高 score
 *   3. 低 signal 候補 (points 10, 0 comments, 80h age, no keyword hit) → 低 score
 *   4. 0-100 範囲クランプ
 *   5. normalize 系 - points / comments / age / keyword 各因子の境界
 *   6. SCORE_V0_WEIGHTS 合計 = 1.0
 */
import { describe, it, expect } from 'vitest'

import {
  computeScore,
  normalizeAge,
  normalizeComments,
  normalizeKeywordMatch,
  normalizePoints,
  SCORE_V0_KEYWORD_BOOSTS,
  SCORE_V0_WEIGHTS,
} from '../scoring/score-v0.js'
import type { Candidate } from '../sources/types.js'

function buildCandidate(
  signal: Partial<Candidate['signalScore']> = {},
): Candidate {
  return {
    id: 'test-1',
    title: 'test',
    url: 'https://example.com',
    source: 'hackernews',
    sourceTier: 'tier1',
    domain: 'example.com',
    publishedAt: '2026-05-04T00:00:00.000Z',
    signalScore: {
      points: 100,
      numComments: 20,
      ageHours: 12,
      keywords: ['typescript', 'saas'],
      ...signal,
    },
    rawText: 'test',
  }
}

describe('score-v0 computeScore (CB-D-W3-02)', () => {
  it('1. 純関数性 - 同一入力で常に同一出力', () => {
    const c = buildCandidate()
    const r1 = computeScore(c)
    const r2 = computeScore(c)
    const r3 = computeScore(c)
    expect(r1.score).toBe(r2.score)
    expect(r2.score).toBe(r3.score)
    expect(r1.breakdown).toEqual(r2.breakdown)
  })

  it('2. 高 signal 候補 → 高 score (>= 70)', () => {
    const c = buildCandidate({
      points: 200,
      numComments: 200,
      ageHours: 1,
      keywords: ['saas', 'b2b', 'typescript', 'nextjs', 'react', 'tailwind', 'cli'],
    })
    const r = computeScore(c)
    expect(r.score).toBeGreaterThanOrEqual(70)
    expect(r.score).toBeLessThanOrEqual(100)
  })

  it('3. 低 signal 候補 → 低 score (<= 20)', () => {
    const c = buildCandidate({
      points: 5,
      numComments: 0,
      ageHours: 100, // > 72h
      keywords: ['unrelatedword', 'anotherword'],
    })
    const r = computeScore(c)
    expect(r.score).toBeLessThanOrEqual(20)
  })

  it('4. 0-100 範囲クランプ - score が必ず [0, 100]', () => {
    const cMax = buildCandidate({
      points: 999_999,
      numComments: 999_999,
      ageHours: 0,
      keywords: SCORE_V0_KEYWORD_BOOSTS.slice(0, 10) as string[],
    })
    const cMin = buildCandidate({
      points: -10,
      numComments: -10,
      ageHours: -10,
      keywords: [],
    })
    expect(computeScore(cMax).score).toBeLessThanOrEqual(100)
    expect(computeScore(cMax).score).toBeGreaterThanOrEqual(0)
    expect(computeScore(cMin).score).toBeGreaterThanOrEqual(0)
    expect(computeScore(cMin).score).toBeLessThanOrEqual(100)
  })

  it('5. normalizePoints 境界 - 0 / 100 / 200 / 1000', () => {
    expect(normalizePoints(0)).toBe(0)
    expect(normalizePoints(100)).toBe(0.5)
    expect(normalizePoints(200)).toBe(1)
    expect(normalizePoints(1000)).toBe(1) // cap
    expect(normalizePoints(-5)).toBe(0)
    expect(normalizePoints(NaN)).toBe(0)
  })

  it('6. normalizeComments - 単調増加 / 0 で 0 / 大量で 1.0 cap', () => {
    expect(normalizeComments(0)).toBe(0)
    const a = normalizeComments(10)
    const b = normalizeComments(50)
    const c = normalizeComments(200)
    expect(a).toBeLessThan(b)
    expect(b).toBeLessThan(c)
    expect(c).toBeLessThanOrEqual(1)
    expect(c).toBeGreaterThan(0.9)
  })

  it('7. normalizeAge - 24h 以内 1.0 / 72h 以降 0 / 中間線形', () => {
    expect(normalizeAge(0)).toBe(1)
    expect(normalizeAge(12)).toBe(1)
    expect(normalizeAge(24)).toBe(1)
    expect(normalizeAge(48)).toBeCloseTo(0.5, 5) // 24h で 1.0、72h で 0 の中間
    expect(normalizeAge(72)).toBe(0)
    expect(normalizeAge(100)).toBe(0)
    expect(normalizeAge(-1)).toBe(0)
  })

  it('8. normalizeKeywordMatch - 0 / 1 / 6+ hit で 1.0 cap', () => {
    expect(normalizeKeywordMatch([])).toBe(0)
    expect(normalizeKeywordMatch(['unrelated'])).toBe(0)
    expect(normalizeKeywordMatch(['saas'])).toBeCloseTo(1 / 6, 5)
    expect(
      normalizeKeywordMatch(['saas', 'b2b', 'cli', 'tool', 'framework', 'api']),
    ).toBe(1) // 6 hit
    expect(
      normalizeKeywordMatch(['saas', 'b2b', 'cli', 'tool', 'framework', 'api', 'react']),
    ).toBe(1) // 7 hit, cap
  })

  it('9. SCORE_V0_WEIGHTS 合計が 1.0', () => {
    const sum =
      SCORE_V0_WEIGHTS.points +
      SCORE_V0_WEIGHTS.comments +
      SCORE_V0_WEIGHTS.age +
      SCORE_V0_WEIGHTS.keyword
    expect(sum).toBeCloseTo(1.0, 5)
  })

  it('10. breakdown 内訳が 4 因子に分解されている', () => {
    const c = buildCandidate({
      points: 100,
      numComments: 50,
      ageHours: 12,
      keywords: ['saas', 'b2b'],
    })
    const r = computeScore(c)
    expect(r.breakdown.pointsContribution).toBeGreaterThan(0)
    expect(r.breakdown.commentsContribution).toBeGreaterThan(0)
    expect(r.breakdown.ageContribution).toBeGreaterThan(0)
    expect(r.breakdown.keywordContribution).toBeGreaterThan(0)
    // 合計が score に近い (rounding 誤差 ±0.5 許容)
    const total =
      r.breakdown.pointsContribution +
      r.breakdown.commentsContribution +
      r.breakdown.ageContribution +
      r.breakdown.keywordContribution
    expect(Math.abs(total - r.score)).toBeLessThan(0.5)
  })
})
