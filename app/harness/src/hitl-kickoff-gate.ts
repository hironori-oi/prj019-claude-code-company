/**
 * hitl-kickoff-gate — Round 8 W2 後半実装前倒し (DEC-019-033 ② / DEC-019-055 α 雛形):
 *   HITL 第 9 種 `dev_kickoff_approval` runtime 雛形。
 *
 * 関連必須コントロール:
 *   G-04 (公開前 / 開発キック前 人間承認ゲート)
 *   G-09 (監査ログ全件保存) — hitl-enforcer 経由で audit 連携
 *   DEC-019-033 ② (HITL 第 9 種、default reject、SLA 72h、提案書テンプレ 7 項目)
 *   DEC-019-055 α (Round 8 雛形 / W1 実装本番化)
 *
 * 設計方針:
 *   - 「開発キック (= ニーズ → 提案 → Owner 承認 → 実装 spawn)」前段の Gate。
 *     既存 hitl-enforcer.ts の `enforceBeforeSpawn` と同レイヤだが、proposal 単位で
 *     extra validation (テンプレ 7 項目 + cost rollback) を提供する。
 *   - **default reject**: Owner 明示承認なしで自動却下。timeout / parse fail / template
 *     不足 / cost rollback fail どれでも `approved=false` を返す。
 *   - **SLA 72h**: 営業日 5 日換算 = 72h (DEC-019-033 ② 明文)。timeout で
 *     auto reject + cost rollback を発火させる。
 *   - **提案書テンプレ 7 項目** (命令書スコープ準拠、DEC-019-033 ② の 7 項目を拡張命名):
 *       (a) projectSummary    : 案件サマリ
 *       (b) estimatedValue    : 推定価値（ターゲット効果 / B2B 想定）
 *       (c) estimatedCostUsd  : 推定コスト（USD）
 *       (d) estimatedEffortDays: 推定工数（日）
 *       (e) knowledgeRefs     : 既存ナレッジ参照（PRJ-XXX / patterns / decisions / pitfalls）
 *       (f) riskAssessment    : リスク評価（ToS / BAN / 法務 / コスト超過）
 *       (g) ownerQuestions    : Owner 質問項目（採否判断材料の追加問合せ）
 *   - **HITL gate 連動**: Round 7 hitl-enforcer.ts と接続。
 *     `evaluateGate('dev_kickoff_approval', proposal)` で proposal status を
 *     `approved` / `rejected` / `timeout` の 3 状態に確定する。
 *     既存 HitlGate の action.type は閉鎖列挙だが、本 gate は meta.dev_kickoff_proposal
 *     payload を載せた `tos_gray_review` 互換 envelope ではなく、type-specific 拡張点として
 *     `KickoffHitlGate` interface（このファイル内で定義）を経由する。
 *     hitl-enforcer.ts への組込みは W1 で本番化（雛形段階では adapter 関数で接続点を提示）。
 *   - **cost rollback hook**: timeout / reject 時、Anthropic spend tracker (cost-tracker.ts)
 *     の rollback callback を呼ぶ。雛形段階では interface 注入のみで具体実装は W1 持越し。
 *
 * 戻り値契約:
 *   - approved=true  → status='approved', decidedAt 確定, cost rollback NOT called
 *   - approved=false → status in {'rejected','timeout','template_invalid','error'}
 *                      timeout / rejected の場合は cost rollback が呼ばれる
 *
 * テスト方針:
 *   - 8 ケース最低カバー (default reject / approve flow / reject flow / timeout 72h /
 *     cost rollback / template 7 項目 validation / hitl-enforcer integration / edge cases)
 */
import { z } from 'zod'

import type { HitlAction, HitlActionType } from './hitl-gate.js'

/** SLA 72h を ms で表現する定数 (DEC-019-033 ②)。 */
export const KICKOFF_SLA_MS = 72 * 60 * 60 * 1000

/**
 * 提案書テンプレ 7 項目の zod スキーマ。
 *
 * DEC-019-033 ② のテンプレ 7 項目に整合するが、命令書スコープに従い
 * 工数 / リスク / 質問項目を明示フィールド化している。
 */
export const DevKickoffProposalSchema = z.object({
  /** (a) 案件サマリ */
  projectSummary: z.string().min(20).max(2000),
  /** (b) 推定価値 (B2B 期待効果 / ROI / strategic alignment) */
  estimatedValue: z.string().min(10).max(2000),
  /** (c) 推定コスト (USD) */
  estimatedCostUsd: z.number().min(0).max(10_000),
  /** (d) 推定工数 (日) */
  estimatedEffortDays: z.number().min(0).max(365),
  /** (e) 既存ナレッジ参照 (PRJ-XXX / patterns / decisions / pitfalls から少なくとも 1 件) */
  knowledgeRefs: z.array(z.string().min(1)).min(0).max(50),
  /** (f) リスク評価 (ToS / BAN / 法務 / コスト超過 / 技術的不確実性 等) */
  riskAssessment: z.string().min(10).max(3000),
  /** (g) Owner 質問項目 (採否判断材料の追加問合せ) */
  ownerQuestions: z.array(z.string().min(1)).min(0).max(20),
  /** dedup / audit ID。同一 proposal の重複承認要請を識別する。 */
  proposalId: z.string().min(1).max(200),
})
export type DevKickoffProposal = z.infer<typeof DevKickoffProposalSchema>

/** kickoff gate 評価結果 status。 */
export type KickoffStatus =
  | 'approved'
  | 'rejected'
  | 'timeout'
  | 'template_invalid'
  | 'error'

export interface KickoffApprovalResult {
  approved: boolean
  status: KickoffStatus
  /** ISO8601 (UTC) */
  decidedAt: string
  /** Owner / 棄却理由 */
  approver?: string
  reason?: string
  /** template_invalid 時の zod エラー内容 */
  templateErrors?: string[]
  /** cost rollback が実行されたか (timeout / rejected で true) */
  costRolledBack?: boolean
  /** rollback hook の戻り値メタ */
  rollbackMeta?: Record<string, unknown>
}

/**
 * hitl-enforcer.ts との統合点。
 *
 * 既存 HitlGate は閉鎖 enum (`HitlActionType`) で 6 種類しか受けないため、
 * W1 で `dev_kickoff_approval` を `HitlActionType` に拡張する想定（雛形段階では
 * 本 interface を経由）。
 *
 * 雛形段階の adapter 戦略:
 *   - 本 interface `KickoffHitlGate` は `HitlGate` のサブセット契約 (requestApproval / decide / listPending)
 *   - W1 で実装本番化する際は HitlActionType に 'dev_kickoff_approval' を追加し、
 *     FileHitlGate を再利用するだけで本 gate 機能を吸収できる。
 */
export interface KickoffHitlGate {
  requestApproval(action: HitlAction): Promise<{
    approved: boolean
    approver?: string
    comment?: string
    reason?: 'approved' | 'rejected' | 'timeout'
    decidedAt: string
  }>
  listPending(): Promise<string[]>
  decide(
    id: string,
    decision: 'approved' | 'rejected',
    meta?: { approver?: string; comment?: string },
  ): Promise<void>
}

/**
 * cost rollback hook 契約。
 *
 * timeout / rejected で発火。Anthropic spend tracker (cost-tracker.ts) に対して
 * proposal で予約済の見積コスト分を rollback する。雛形段階では interface 注入のみで、
 * 実装は cost-tracker への `recordSpend(amount=-x)` 呼出 + meta.proposalId による idempotent 化が想定。
 */
export interface CostRollbackHook {
  rollback(input: {
    proposalId: string
    amountUsd: number
    reason: 'timeout' | 'rejected' | 'template_invalid' | 'error'
  }): Promise<{ ok: boolean; meta?: Record<string, unknown> }>
}

export interface KickoffGateOptions {
  gate: KickoffHitlGate
  costRollback?: CostRollbackHook
  /** SLA timeout (ms)。default 72h。 */
  slaMs?: number
  /** 現在時刻取得 (テスト注入用)。default `() => new Date()` */
  now?: () => Date
  /** logger 注入 (テスト用)。default 無効化。 */
  logger?: { warn: (msg: string) => void; error: (msg: string) => void }
}

export interface KickoffGate {
  /**
   * proposal を評価し承認結果を返す。
   *
   * 1. テンプレ 7 項目 zod 検証 → 不足は default reject (`template_invalid`) + rollback
   * 2. underlying HitlGate に承認要求発出 (action.type='dev_kickoff_approval' 互換 envelope)
   * 3. 承認 → approved=true / 却下 / timeout → approved=false + rollback
   * 4. gate throw → approved=false (`error`) + rollback
   */
  evaluate(proposal: unknown): Promise<KickoffApprovalResult>
  /**
   * SLA timeout (ms) を返す。雛形段階では underlying HitlGate に SLA を直接伝搬する
   * adapter が未実装のため、本 accessor から W1 実装本番化時に FileHitlGate timeoutMs
   * へ橋渡しする。default 72h。
   */
  getSlaMs(): number
}

/**
 * `dev_kickoff_approval` 拡張用の HitlActionType マーカー。
 *
 * W1 で `HitlActionType` に正式追加されるまで、本 gate 内では string literal として
 * 注入する。HitlAction.type は string なので runtime 上は問題なく通過する。
 */
export const DEV_KICKOFF_ACTION_TYPE = 'dev_kickoff_approval' as const
export type DevKickoffActionType = typeof DEV_KICKOFF_ACTION_TYPE

/**
 * action.type に `dev_kickoff_approval` を載せて HitlGate に渡すための envelope ビルダ。
 *
 * W1 で HitlActionType への正式追加が完了したら、`as unknown as HitlActionType`
 * の cast を削除する想定。
 */
export function buildKickoffHitlAction(proposal: DevKickoffProposal): HitlAction {
  return {
    type: DEV_KICKOFF_ACTION_TYPE as unknown as HitlActionType,
    description: `dev_kickoff_approval: ${proposal.projectSummary.slice(0, 80)}`,
    risk: 'high',
    meta: {
      proposalId: proposal.proposalId,
      estimatedCostUsd: proposal.estimatedCostUsd,
      estimatedEffortDays: proposal.estimatedEffortDays,
      knowledgeRefsCount: proposal.knowledgeRefs.length,
      ownerQuestionsCount: proposal.ownerQuestions.length,
    },
  }
}

class DefaultKickoffGate implements KickoffGate {
  private readonly gate: KickoffHitlGate
  private readonly costRollback: CostRollbackHook | undefined
  private readonly slaMs: number
  private readonly now: () => Date
  private readonly logger: NonNullable<KickoffGateOptions['logger']>

  constructor(opts: KickoffGateOptions) {
    this.gate = opts.gate
    this.costRollback = opts.costRollback
    this.slaMs = opts.slaMs ?? KICKOFF_SLA_MS
    this.now = opts.now ?? (() => new Date())
    this.logger = opts.logger ?? {
      warn: () => undefined,
      error: () => undefined,
    }
  }

  getSlaMs(): number {
    return this.slaMs
  }

  async evaluate(proposal: unknown): Promise<KickoffApprovalResult> {
    // 1. テンプレ 7 項目 zod 検証
    const parsed = DevKickoffProposalSchema.safeParse(proposal)
    if (!parsed.success) {
      const errors = parsed.error.issues.map(
        (i) => `${i.path.join('.') || '<root>'}: ${i.message}`,
      )
      const rb = await this.tryRollback({
        proposalId: this.extractProposalId(proposal),
        amountUsd: this.extractAmountUsd(proposal),
        reason: 'template_invalid',
      })
      return {
        approved: false,
        status: 'template_invalid',
        decidedAt: this.now().toISOString(),
        reason: 'proposal template validation failed',
        templateErrors: errors,
        ...(rb !== undefined && { costRolledBack: rb.ok, rollbackMeta: rb.meta }),
      }
    }

    const validProposal = parsed.data

    // 2. underlying HitlGate に承認要求
    const action = buildKickoffHitlAction(validProposal)
    let raw: Awaited<ReturnType<KickoffHitlGate['requestApproval']>>
    try {
      raw = await this.gate.requestApproval(action)
    } catch (err) {
      const msg = (err as Error).message
      this.logger.error(`hitl-kickoff-gate: gate threw: ${msg}`)
      const rb = await this.tryRollback({
        proposalId: validProposal.proposalId,
        amountUsd: validProposal.estimatedCostUsd,
        reason: 'error',
      })
      return {
        approved: false,
        status: 'error',
        decidedAt: this.now().toISOString(),
        reason: `gate threw: ${msg}`,
        ...(rb !== undefined && { costRolledBack: rb.ok, rollbackMeta: rb.meta }),
      }
    }

    // 3. 結果分岐 (default reject)
    if (raw.approved && raw.reason === 'approved') {
      return {
        approved: true,
        status: 'approved',
        decidedAt: raw.decidedAt,
        ...(raw.approver !== undefined && { approver: raw.approver }),
        ...(raw.comment !== undefined && { reason: raw.comment }),
      }
    }

    // rejected / timeout / 不明 reason はすべて default reject + rollback
    const status: KickoffStatus = raw.reason === 'timeout' ? 'timeout' : 'rejected'
    const rb = await this.tryRollback({
      proposalId: validProposal.proposalId,
      amountUsd: validProposal.estimatedCostUsd,
      reason: status,
    })
    return {
      approved: false,
      status,
      decidedAt: raw.decidedAt,
      ...(raw.approver !== undefined && { approver: raw.approver }),
      ...(raw.comment !== undefined && { reason: raw.comment }),
      ...(rb !== undefined && { costRolledBack: rb.ok, rollbackMeta: rb.meta }),
    }
  }

  private async tryRollback(input: {
    proposalId: string
    amountUsd: number
    reason: 'timeout' | 'rejected' | 'template_invalid' | 'error'
  }): Promise<{ ok: boolean; meta?: Record<string, unknown> } | undefined> {
    if (!this.costRollback) return undefined
    try {
      return await this.costRollback.rollback(input)
    } catch (err) {
      this.logger.warn(
        `hitl-kickoff-gate: cost rollback failed for ${input.proposalId}: ${(err as Error).message}`,
      )
      return { ok: false, meta: { error: (err as Error).message } }
    }
  }

  /** template_invalid 時に proposal が壊れていても rollback の amount/proposalId を best-effort 抽出する。 */
  private extractProposalId(input: unknown): string {
    if (typeof input === 'object' && input !== null) {
      const v = (input as Record<string, unknown>)['proposalId']
      if (typeof v === 'string' && v.length > 0) return v
    }
    return 'unknown'
  }

  private extractAmountUsd(input: unknown): number {
    if (typeof input === 'object' && input !== null) {
      const v = (input as Record<string, unknown>)['estimatedCostUsd']
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return v
    }
    return 0
  }
}

/** factory: `dev_kickoff_approval` 評価ゲートの標準実装を返す。 */
export function createKickoffGate(opts: KickoffGateOptions): KickoffGate {
  return new DefaultKickoffGate(opts)
}
