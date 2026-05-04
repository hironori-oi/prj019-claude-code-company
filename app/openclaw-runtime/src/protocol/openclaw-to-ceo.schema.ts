/**
 * openclaw-to-ceo.schema — Round 9 案 9-A1 前倒し (CB-D-W3-03):
 *   Open Claw subprocess (subscription 駆動) から CEO 層への構造化通信プロトコル。
 *
 * 設計方針:
 *   - HITL 第 9 種 `dev_kickoff_approval` 提案書テンプレ 7 項目 (DEC-019-033 ②) と
 *     **field 名を完全一致**させる (再利用可能性最大化、Round 8 α で確立した contract を破壊しない)。
 *   - discriminated union (`messageType`) で 4 種を区別:
 *       1. `needs_proposal`     - 案件提案 (HITL 第 9 種への入力)
 *       2. `progress_update`    - 進捗報告 (Phase 1 W4 dry-run / W3 ベンチマーク)
 *       3. `error_report`       - エラー / 想定外停止
 *       4. `escalation_request` - HITL gate / kill-switch 介入要請
 *   - zod スキーマで型 + runtime 検証を二重に担保 (TypeScript strict 整合)。
 *
 * 関連:
 *   - DEC-019-033 ② (HITL 第 9 種 / 提案書テンプレ 7 項目)
 *   - DEC-019-006 P-D 改 (subprocess spawn / 副作用ゼロ)
 *   - CB-D-W3-03 (Open Claw → CEO 構造化 JSON IF)
 *   - app/harness/src/hitl-kickoff-gate.ts DevKickoffProposalSchema (field 名互換 / Round 8 α)
 */
import { z } from 'zod'

/**
 * 提案書テンプレ 7 項目 (DEC-019-033 ②) の field 共通スキーマ。
 *
 * `app/harness/src/hitl-kickoff-gate.ts` の `DevKickoffProposalSchema` と
 * field 名 + 制約を完全一致させる (cross-module contract)。
 *
 * 注意: harness の DevKickoffProposalSchema の `proposalId` は本 schema の
 *   `proposalId` と同義。本 schema は Open Claw が直接出力する protocol message であり、
 *   CEO 側の HITL gate に渡す際にそのまま DevKickoffProposal として再利用できる shape。
 */
export const ProposalContentSchema = z.object({
  /** dedup / audit ID。同一 proposal の重複承認要請を識別する。 */
  proposalId: z.string().min(1).max(200),
  /** (a) 案件サマリ */
  projectSummary: z.string().min(20).max(2000),
  /** (b) 推定価値 (B2B 期待効果 / ROI / strategic alignment) */
  estimatedValue: z.string().min(10).max(2000),
  /** (c) 推定コスト (USD) */
  estimatedCostUsd: z.number().min(0).max(10_000),
  /** (d) 推定工数 (日) */
  estimatedEffortDays: z.number().min(0).max(365),
  /** (e) 既存ナレッジ参照 (PRJ-XXX / patterns / decisions / pitfalls) */
  knowledgeRefs: z.array(z.string().min(1)).min(0).max(50),
  /** (f) リスク評価 (ToS / BAN / 法務 / コスト超過 / 技術的不確実性 等) */
  riskAssessment: z.string().min(10).max(3000),
  /** (g) Owner 質問項目 */
  ownerQuestions: z.array(z.string().min(1)).min(0).max(20),
})
export type ProposalContent = z.infer<typeof ProposalContentSchema>

/**
 * needs_scout が出力する候補 reference (構造化 JSON IF の必須付帯情報)。
 */
export const ScoutReferenceSchema = z.object({
  /** runId (NeedsScoutResult.meta.runId と一致) */
  scoutRunId: z.string().min(1).max(200),
  /** 採用候補 ID (Candidate.id) */
  candidateId: z.string().min(1).max(200),
  /** 採用候補のスコア (0-100) */
  candidateScore: z.number().min(0).max(100),
  /** OSS license 検証必須フラグ (R-019-11、後続 task 担当) */
  licenseCheckRequired: z.literal(true),
})
export type ScoutReference = z.infer<typeof ScoutReferenceSchema>

/** message envelope のヘッダ部 (全 messageType 共通) */
const HeaderSchema = z.object({
  /** message dedup ID (UUID v4 推奨) */
  messageId: z.string().min(1).max(200),
  /** ISO8601 (UTC) で送信時刻 */
  sentAt: z.string().datetime({ offset: true }),
  /** Open Claw subprocess の trace identifier (audit 対応用) */
  openclawTraceId: z.string().min(1).max(200),
})

/**
 * 1. needs_proposal — 案件提案。
 *
 * HITL 第 9 種 `dev_kickoff_approval` への入力として CEO に渡される。
 * proposal field は DevKickoffProposalSchema と互換。
 */
export const NeedsProposalMessageSchema = HeaderSchema.extend({
  messageType: z.literal('needs_proposal'),
  proposal: ProposalContentSchema,
  /** どの scout run / candidate から派生したかを残す (audit + 後続 license check 用) */
  scoutRef: ScoutReferenceSchema,
})
export type NeedsProposalMessage = z.infer<typeof NeedsProposalMessageSchema>

/**
 * 2. progress_update — 進捗報告。
 *
 * Phase 1 W4 dry-run / W3 ベンチマーク経過の通知。CEO が透明性 dashboard に
 * リアルタイム反映する。
 */
export const ProgressUpdateMessageSchema = HeaderSchema.extend({
  messageType: z.literal('progress_update'),
  /** 紐付く proposalId (関連 proposal がある場合) */
  proposalId: z.string().min(1).max(200).optional(),
  /** 進捗率 0-100 (% 表記) */
  progressPercent: z.number().min(0).max(100),
  /** 現在 phase (free text、例 'spawning' / 'classifying' / 'reporting') */
  phase: z.string().min(1).max(100),
  /** 現時点までの累積コスト (USD) */
  costSoFarUsd: z.number().min(0).max(10_000),
  /** human-readable な近況サマリ */
  summary: z.string().min(1).max(2000),
})
export type ProgressUpdateMessage = z.infer<typeof ProgressUpdateMessageSchema>

/**
 * 3. error_report — エラー / 想定外停止の報告。
 *
 * spawn timeout / circuit-breaker open / 子プロセス crash 等を CEO に通知。
 */
export const ErrorReportMessageSchema = HeaderSchema.extend({
  messageType: z.literal('error_report'),
  /** error severity (info / warn / error / fatal) */
  severity: z.enum(['info', 'warn', 'error', 'fatal']),
  /** error code (例 'spawn_timeout' / 'circuit_open' / 'crash') */
  errorCode: z.string().min(1).max(100),
  /** error human message (PII redacted 前提) */
  errorMessage: z.string().min(1).max(3000),
  /** 紐付く proposalId (関連 proposal がある場合) */
  proposalId: z.string().min(1).max(200).optional(),
  /** stack trace (PII redacted 後の sanitized version、optional) */
  stackTrace: z.string().min(1).max(10_000).optional(),
})
export type ErrorReportMessage = z.infer<typeof ErrorReportMessageSchema>

/**
 * 4. escalation_request — HITL gate 介入 / kill-switch 等の人間介入要請。
 *
 * Open Claw が「Owner 判断必須」と判定した場合に発出。
 */
export const EscalationRequestMessageSchema = HeaderSchema.extend({
  messageType: z.literal('escalation_request'),
  /** どの HITL gate / control 種別 (例 'tos_gray_review' / 'cost_cap_breach' / 'dev_kickoff_approval') */
  escalationKind: z.string().min(1).max(100),
  /** 紐付く proposalId (関連 proposal がある場合) */
  proposalId: z.string().min(1).max(200).optional(),
  /** Owner にとっての判断材料 (free text、PII redacted) */
  reasoning: z.string().min(10).max(5000),
  /** Owner に対する明示の質問 / 選択肢 */
  ownerQuestions: z.array(z.string().min(1)).min(1).max(20),
  /** SLA (ms) - timeout で default reject (DEC-019-033 ②) */
  slaMs: z.number().int().min(0).max(7 * 24 * 60 * 60 * 1000),
})
export type EscalationRequestMessage = z.infer<typeof EscalationRequestMessageSchema>

/**
 * Open Claw → CEO の通信 message 全種の discriminated union。
 *
 * `messageType` literal で 4 種を区別。zod の discriminatedUnion で type guard も自動生成。
 */
export const OpenclawToCeoMessageSchema = z.discriminatedUnion('messageType', [
  NeedsProposalMessageSchema,
  ProgressUpdateMessageSchema,
  ErrorReportMessageSchema,
  EscalationRequestMessageSchema,
])
export type OpenclawToCeoMessage = z.infer<typeof OpenclawToCeoMessageSchema>

/** messageType 列挙の literal union (pattern matching 用) */
export type OpenclawToCeoMessageType = OpenclawToCeoMessage['messageType']

/**
 * type guard: 任意の値が OpenclawToCeoMessage であるかを返す。
 */
export function isOpenclawToCeoMessage(input: unknown): input is OpenclawToCeoMessage {
  return OpenclawToCeoMessageSchema.safeParse(input).success
}

/**
 * narrow type guard: messageType を指定して個別の message kind に narrow する。
 */
export function isMessageOfType<T extends OpenclawToCeoMessageType>(
  msg: OpenclawToCeoMessage,
  type: T,
): msg is Extract<OpenclawToCeoMessage, { messageType: T }> {
  return msg.messageType === type
}
