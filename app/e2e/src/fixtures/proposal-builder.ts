/**
 * proposal-builder — needs-scout の Candidate (accepted top-1) から
 *   Open Claw → CEO 構造化 JSON IF (NeedsProposalMessage) を組み立てる純関数。
 *
 * field 制約は `openclaw-to-ceo.schema.ts` の zod スキーマに準拠する:
 *   - projectSummary    20-2000 chars
 *   - estimatedValue    10-2000 chars
 *   - estimatedCostUsd  0-10_000
 *   - estimatedEffortDays 0-365
 *   - knowledgeRefs     0-50 件
 *   - riskAssessment    10-3000 chars
 *   - ownerQuestions    0-20 件
 *   - scoutRef.licenseCheckRequired = true (R-019-11)
 *
 * 実 Open Claw 実装が出揃うまでの fixture-grade implementation。
 * dispatcher.ts が schema invalid を弾くため、本 builder は常に valid 出力を保証する。
 */
import type { NeedsProposalMessage } from '@clawbridge/openclaw-runtime'
import type { Candidate } from '@clawbridge/needs-scout'

export interface BuildProposalInput {
  /** scout run id */
  scoutRunId: string
  /** scoring 後の Candidate (accepted の top-1 想定) */
  candidate: Candidate & { score: number }
  /** message id (UUID v4 など) */
  messageId: string
  /** trace id */
  openclawTraceId: string
  /** sentAt ISO8601 */
  sentAt: string
  /** proposalId (HITL gate dedup 用) */
  proposalId: string
}

/**
 * 候補 1 件から NeedsProposalMessage を生成する純関数。
 *
 * - knowledgeRefs には PRJ-019 + 'patterns/typescript-saas-mvp' を default 追加。
 * - estimatedCostUsd / estimatedEffortDays は score をベースに簡易推定 (fixture-grade)。
 */
export function buildProposalFromCandidate(input: BuildProposalInput): NeedsProposalMessage {
  const { candidate, scoutRunId, messageId, openclawTraceId, sentAt, proposalId } = input
  // 簡易見積 (fixture-grade): score 100 → $30 / 30d、score 0 → $5 / 5d
  const score = Math.max(0, Math.min(100, candidate.score))
  const estimatedCostUsd = round2(5 + (score / 100) * 25)
  const estimatedEffortDays = Math.round(5 + (score / 100) * 25)

  const projectSummary = pad(
    `候補 ${candidate.id} (${candidate.source}) の B2B SaaS 提案。タイトル: ${candidate.title}. 領域: TypeScript エコシステム + 中小企業向け生産性ツール。Score=${score.toFixed(1)} で top-1 として採択。`,
    20,
    2000,
  )
  const estimatedValue = pad(
    `B2B 中小企業 ${Math.max(20, Math.round(score))} 社獲得想定 / ROI 6 ヶ月以内 / strategic alignment HIGH (PRJ-019 ターゲット領域)`,
    10,
    2000,
  )
  const riskAssessment = pad(
    `ToS gray 領域: ${candidate.sourceTier === 'tier1' ? 'LOW (HN tier1 source)' : 'MEDIUM (lower tier)'} / BAN risk 軽微 (subscription 主軸 + API hard cap $30) / 法務: OSS license 検証必須 (R-019-11) / 技術不確実性 LOW (TypeScript 標準スタック)`,
    10,
    3000,
  )

  return {
    messageId,
    sentAt,
    openclawTraceId,
    messageType: 'needs_proposal',
    proposal: {
      proposalId,
      projectSummary,
      estimatedValue,
      estimatedCostUsd,
      estimatedEffortDays,
      knowledgeRefs: ['PRJ-019', 'patterns/typescript-saas-mvp'],
      riskAssessment,
      ownerQuestions: [
        '本領域への参入は中小企業 SaaS 戦略と整合しますか?',
        '14d 以内のリリース許容しますか?',
      ],
    },
    scoutRef: {
      scoutRunId,
      candidateId: candidate.id,
      candidateScore: score,
      licenseCheckRequired: true,
    },
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function pad(s: string, min: number, max: number): string {
  if (s.length >= min && s.length <= max) return s
  if (s.length < min) {
    // padding (描写を膨らませる、fixture-grade)
    const filler = ' (auto-padded fixture description for schema compliance)'
    let out = s
    while (out.length < min) out += filler
    return out.slice(0, max)
  }
  return s.slice(0, max)
}
