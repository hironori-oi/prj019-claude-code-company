/**
 * ke-orchestrator — Knowledge Extraction の **完全配線** orchestrator
 * (Round 15 Dev-N 第 3 波).
 *
 * 関連必須コントロール:
 *   KE-02 / KE-03 / KE-04 (DEC-019-033 ⑪)
 *   HITL-11 (本 orchestrator が gate-11 と quarantine 層を駆動)
 *
 * 連鎖フロー:
 *
 *   案件完了 hook
 *      → KE-02 trigger (planExtraction)
 *          → KE-04 PII redaction (planExtraction 内で実施済)
 *      → 分類 (PII なし vs PII あり)
 *      → 全 entry を Hitl11Quarantine.quarantineDraft で **隔離 dir に書き込み**
 *      → PII あり entry を gate-11 (decision evaluator) へ
 *          → approve  → Hitl11Quarantine.approveEntry → organization/knowledge/{kind}/
 *          → reject   → Hitl11Quarantine.rejectEntry  → quarantine 維持 + redaction tag
 *          → partial  → Hitl11Quarantine.markPartialRedact → 隔離維持 + 再 review 待機
 *
 * 設計方針:
 *   - 既存 `createKe02Wiring` (Round 14 Task C) は **下位層** として再利用、本 orchestrator は
 *     その上層に Hitl11Quarantine + 自動分配 hook を加えた **完全配線層** を提供.
 *   - 自動 1 段目 PII redaction = KE-04 redactPii の patternd 検出のみ (HITL-11 は人間判定).
 *   - 実書き込み (knowledge/{patterns|decisions|pitfalls}/) は gate-11 approve 後のみ.
 *   - reject 時は隔離 dir 維持、knowledge へは絶対に書き込まない.
 *   - 副作用は **caller が transport を inject** する pattern (試験性確保).
 *
 * 既存ファイル無改変原則:
 *   ke-02-orchestrator-wiring.ts / hitl-11-knowledge-pii.ts には触れない.
 *   本書は新設 orchestrator として独立配置.
 */
import { createKe02Wiring, type Ke02WiringTransports } from './ke-02-orchestrator-wiring.js'
import { autoEvaluate, type Hitl11Decision } from './hitl-11-knowledge-pii.js'
import { Hitl11Quarantine } from './hitl-11-quarantine.js'
import type { ProjectCompletionEvent, KnowledgeDraft, TriggerResult } from './ke-02-trigger.js'

// ============================================================================
// 型
// ============================================================================

export interface KeOrchestratorOptions {
  /** quarantine root (~/.clawbridge/quarantine/hitl11). */
  readonly quarantineRoot: string
  /** organization/knowledge/ ルート (approve 時の rename 先). */
  readonly knowledgeRoot: string
  /**
   * gate-11 decision provider. Round 15 では autoEvaluate を default 採用、
   * 本格運用時は FileHitl11Gate.requestReview に差替可能.
   */
  readonly decideHitl11?: (
    drafts: ReadonlyArray<KnowledgeDraft>,
  ) => Promise<Hitl11Decision> | Hitl11Decision
  /** Slack 通知 transport (best-effort). */
  readonly onSlackNotify?: (message: string) => Promise<void> | void
  /** error log callback. */
  readonly onError?: (where: string, err: unknown) => void
  readonly now?: () => Date
}

export interface KeOrchestratorResult {
  readonly trigger: TriggerResult
  readonly quarantinedCount: number
  readonly approvedCount: number
  readonly rejectedCount: number
  readonly partialCount: number
  readonly indexedCount: number
  readonly hitl11RequiredCount: number
  readonly slackNotified: boolean
}

export interface KeOrchestrator {
  /** 案件完了 event を受領 → 隔離 → gate-11 → approve/reject 配分. */
  handleProjectCompletion(event: ProjectCompletionEvent): Promise<KeOrchestratorResult>
}

// ============================================================================
// 実装
// ============================================================================

/**
 * createKeOrchestrator — KE 完全配線 orchestrator instance を生成.
 */
export function createKeOrchestrator(opts: KeOrchestratorOptions): KeOrchestrator {
  const quarantine = new Hitl11Quarantine({
    quarantineRoot: opts.quarantineRoot,
    knowledgeRoot: opts.knowledgeRoot,
    ...(opts.now ? { now: opts.now } : {}),
  })
  const decide = opts.decideHitl11 ?? defaultDecideViaAutoEvaluate

  return {
    async handleProjectCompletion(event): Promise<KeOrchestratorResult> {
      // 既存 ke-02-orchestrator-wiring を transports なしで実行 → trigger / 分流のみ取得.
      // これにより既存テストとの整合性を保ちつつ、上位 layer で physical I/O を担当.
      const baseTransports: Ke02WiringTransports = {
        ...(opts.onError ? { onError: opts.onError } : {}),
      }
      const baseWiring = createKe02Wiring(baseTransports)
      const baseResult = await baseWiring.handleProjectCompletion(event)
      const trigger = baseResult.trigger

      if (!trigger.shouldFire) {
        return Object.freeze({
          trigger,
          quarantinedCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          partialCount: 0,
          indexedCount: 0,
          hitl11RequiredCount: 0,
          slackNotified: false,
        })
      }

      // 1. 全 entry を quarantine に隔離 (PII の有無問わず明示確認 path 経由).
      const cleanIds: string[] = []
      const piiIds: string[] = []
      const piiDrafts: KnowledgeDraft[] = []
      let quarantinedCount = 0
      for (const draft of trigger.entries) {
        try {
          const r = await quarantine.quarantineDraft(draft)
          quarantinedCount += 1
          if (draft.requiresHitl11) {
            piiIds.push(r.entryId)
            piiDrafts.push(draft)
          } else {
            cleanIds.push(r.entryId)
          }
        } catch (err) {
          opts.onError?.('quarantineDraft', err)
        }
      }

      // 2. PII なし draft → 即時 approve (knowledge へ自動 rename, 1 段目 PII redaction
      //    完了済みのため Owner レビュー不要 と判定).
      let approvedCount = 0
      for (const id of cleanIds) {
        try {
          await quarantine.approveEntry(id)
          approvedCount += 1
        } catch (err) {
          opts.onError?.('approveEntry-clean', err)
        }
      }

      // 3. PII あり draft → gate-11 decision provider 起動 → 結果に応じて分配.
      let rejectedCount = 0
      let partialCount = 0
      let hitl11ApprovedCount = 0
      if (piiDrafts.length > 0) {
        let decision: Hitl11Decision = 'escalate'
        try {
          decision = await decide(piiDrafts)
        } catch (err) {
          opts.onError?.('decideHitl11', err)
        }

        if (decision === 'approve') {
          for (const id of piiIds) {
            try {
              await quarantine.approveEntry(id)
              hitl11ApprovedCount += 1
            } catch (err) {
              opts.onError?.('approveEntry-pii', err)
            }
          }
        } else if (decision === 'reject') {
          for (let i = 0; i < piiIds.length; i += 1) {
            try {
              await quarantine.rejectEntry(piiIds[i]!, {
                reason: 'auto-reject: PII risk above threshold',
                redactionTags: ['AUTO_REJECT'],
              })
              rejectedCount += 1
            } catch (err) {
              opts.onError?.('rejectEntry', err)
            }
          }
        } else if (decision === 'partial_redact' || decision === 'escalate') {
          for (let i = 0; i < piiIds.length; i += 1) {
            const draft = piiDrafts[i]!
            const tags = draft.piiHitCount > 0 ? ['REDACT_MORE'] : []
            try {
              await quarantine.markPartialRedact(piiIds[i]!, tags)
              partialCount += 1
            } catch (err) {
              opts.onError?.('markPartialRedact', err)
            }
          }
        }
      }

      // 4. Slack 通知 (best-effort).
      let slackNotified = false
      if (opts.onSlackNotify) {
        try {
          await opts.onSlackNotify(
            formatOrchestratorSummary({
              prjId: event.prjId,
              quarantinedCount,
              approvedCount: approvedCount + hitl11ApprovedCount,
              rejectedCount,
              partialCount,
            }),
          )
          slackNotified = true
        } catch (err) {
          opts.onError?.('onSlackNotify', err)
        }
      }

      return Object.freeze({
        trigger,
        quarantinedCount,
        approvedCount: approvedCount + hitl11ApprovedCount,
        rejectedCount,
        partialCount,
        indexedCount: approvedCount, // PII なし即時 index 件数と同義
        hitl11RequiredCount: piiDrafts.length,
        slackNotified,
      })
    },
  }
}

function defaultDecideViaAutoEvaluate(
  drafts: ReadonlyArray<KnowledgeDraft>,
): Hitl11Decision {
  return autoEvaluate(drafts).decision
}

function formatOrchestratorSummary(args: {
  prjId: string
  quarantinedCount: number
  approvedCount: number
  rejectedCount: number
  partialCount: number
}): string {
  return (
    `[ke-orchestrator] ${args.prjId} ` +
    `quarantined=${args.quarantinedCount} ` +
    `approved=${args.approvedCount} ` +
    `rejected=${args.rejectedCount} ` +
    `partial=${args.partialCount}`
  )
}
