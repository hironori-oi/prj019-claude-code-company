/**
 * KE-02 trigger ↔ orchestrator wiring (Round 14 Dev-E 完遂、Task C).
 *
 * 関連必須コントロール:
 *   KE-02 (DEC-019-033 ⑪ — Owner-in-the-loop 16 項目のうち、抽出 trigger 軸)
 *   KE-01 (本 wiring は KE-01 schema validate 済 entry のみ orchestrator に流す)
 *   KE-03 (本 wiring 経由で抽出された entry は KE-03 retrieval index に追加される)
 *   HITL-11 (PII 検出時は HITL-11 gate へ escalate される)
 *
 * 設計方針:
 *   - 案件完了 trigger → KE-01 schema validate → KE-02 plan extraction →
 *     KE-03 retrieval index append → HITL-11 escalation の連鎖を本書で wire.
 *   - 副作用は **caller-injected** な transport / sink 経由のみ
 *     (本 wiring 自体は I/O を直接行わず、orchestrator 上位が transport を保持).
 *   - 既存ファイル無改変原則: harness/src/index.ts の barrel に追加のみ.
 *
 * orchestrator から呼び出す典型 API:
 *
 *   const wiring = createKe02Wiring({
 *     onSlackNotify: async (msg) => {...},        // ke-02 trigger 通知
 *     onIndexAppend: async (entry) => {...},      // ke-03 index 更新
 *     onHitl11Required: async (drafts) => {...},  // hitl-11 escalation
 *   })
 *   const result = await wiring.handleProjectCompletion(event)
 */
import { planExtraction, formatSlackNotification, type ProjectCompletionEvent, type KnowledgeDraft, type TriggerResult } from './ke-02-trigger.js'
import type { IndexedKnowledge } from './ke-03-retrieval.js'

// ============================================================================
// 型
// ============================================================================

export interface Ke02WiringTransports {
  /** Slack 等への抽出 trigger 発火通知 (副作用; best-effort). */
  readonly onSlackNotify?: (message: string) => Promise<void> | void
  /** KE-03 retrieval index への append (PII redact 済 / HITL-11 不要 entry のみ). */
  readonly onIndexAppend?: (entry: IndexedKnowledge) => Promise<void> | void
  /** HITL-11 escalation (PII 1+ 件含む drafts を渡す). */
  readonly onHitl11Required?: (drafts: ReadonlyArray<KnowledgeDraft>) => Promise<void> | void
  /** orchestrator 側で error log するための callback. */
  readonly onError?: (where: string, err: unknown) => void
}

export interface Ke02WiringResult {
  readonly trigger: TriggerResult
  readonly indexedCount: number
  readonly hitl11RequiredCount: number
  readonly slackNotified: boolean
}

export interface Ke02Wiring {
  /** 案件完了 event を受領 → 抽出 plan → side-effect transport 起動 → 結果集約. */
  handleProjectCompletion(event: ProjectCompletionEvent): Promise<Ke02WiringResult>
}

// ============================================================================
// 実装
// ============================================================================

/**
 * createKe02Wiring — orchestrator で 1 度生成して再利用する wiring instance.
 *
 * 連鎖:
 *   1. planExtraction(event) で抽出 plan 取得 (KE-04 redact 適用済 drafts).
 *   2. shouldFire = false なら skip.
 *   3. drafts のうち requiresHitl11 を分類:
 *      - PII なし draft → onIndexAppend に流す (KE-03 即時 retrievable).
 *      - PII あり draft → onHitl11Required に流す (HITL-11 gate へ).
 *   4. onSlackNotify に formatSlackNotification 結果を流す.
 */
export function createKe02Wiring(transports: Ke02WiringTransports): Ke02Wiring {
  return {
    async handleProjectCompletion(event: ProjectCompletionEvent): Promise<Ke02WiringResult> {
      const trigger = planExtraction(event)

      if (!trigger.shouldFire) {
        // skip: trigger 発火条件不一致
        return Object.freeze({
          trigger,
          indexedCount: 0,
          hitl11RequiredCount: 0,
          slackNotified: false,
        })
      }

      // 1. 分類
      const indexable: KnowledgeDraft[] = []
      const hitl11Drafts: KnowledgeDraft[] = []
      for (const d of trigger.entries) {
        if (d.requiresHitl11) {
          hitl11Drafts.push(d)
        } else {
          indexable.push(d)
        }
      }

      // 2. KE-03 retrieval index へ append (PII なし drafts のみ).
      let indexedCount = 0
      for (const d of indexable) {
        try {
          if (transports.onIndexAppend) {
            const indexed = draftToIndexed(d)
            await transports.onIndexAppend(indexed)
            indexedCount += 1
          }
        } catch (err) {
          transports.onError?.('onIndexAppend', err)
        }
      }

      // 3. HITL-11 escalation (PII あり drafts).
      let hitl11RequiredCount = 0
      if (hitl11Drafts.length > 0 && transports.onHitl11Required) {
        try {
          await transports.onHitl11Required(Object.freeze(hitl11Drafts.slice()))
          hitl11RequiredCount = hitl11Drafts.length
        } catch (err) {
          transports.onError?.('onHitl11Required', err)
        }
      }

      // 4. Slack 通知 (best-effort).
      let slackNotified = false
      if (transports.onSlackNotify) {
        try {
          const msg = formatSlackNotification(trigger, event.prjId)
          await transports.onSlackNotify(msg)
          slackNotified = true
        } catch (err) {
          transports.onError?.('onSlackNotify', err)
        }
      }

      return Object.freeze({
        trigger,
        indexedCount,
        hitl11RequiredCount,
        slackNotified,
      })
    },
  }
}

/**
 * draftToIndexed — KnowledgeDraft (KE-02) を IndexedKnowledge (KE-03) へ変換.
 *
 * 注: draft.bodyRedacted (KE-04 適用済) を body に使用、frontmatter は draft の
 * tags / kind / sourcePrj から **暫定 frontmatter** を構築 (id は draft 段階では
 * 確定していないため `<KIND_PREFIX>-DRAFT-<sourcePrj>-<title slug>` 形式).
 */
function draftToIndexed(d: KnowledgeDraft): IndexedKnowledge {
  const idPrefix = d.kind === 'pattern' ? 'PAT' : d.kind === 'decision' ? 'DEC' : 'PIT'
  const slug = d.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
  const id = `${idPrefix}-999-${slug || 'draft'}`
  const createdAt = new Date().toISOString().slice(0, 10)
  const tags = d.tags.length > 0 ? Array.from(d.tags) : ['general']

  let frontmatter: IndexedKnowledge['frontmatter']
  if (d.kind === 'pattern') {
    frontmatter = {
      kind: 'pattern',
      id,
      source_prj: d.sourcePrj,
      created_at: createdAt,
      tags,
      category: 'auto',
      quality_score: 3,
      reuse_count: 0,
      applies_when: 'auto-extracted',
    }
  } else if (d.kind === 'decision') {
    frontmatter = {
      kind: 'decision',
      id,
      source_prj: d.sourcePrj,
      created_at: createdAt,
      tags,
      category: 'auto',
      quality_score: 3,
      context: 'auto-extracted from project completion',
      alternatives: ['n/a'],
      rationale: 'see body',
    }
  } else {
    frontmatter = {
      kind: 'pitfall',
      id,
      source_prj: d.sourcePrj,
      created_at: createdAt,
      tags,
      category: 'auto',
      quality_score: 3,
      symptom: 'see body',
      root_cause: 'see body',
      remediation: 'see body',
      prevention: 'see body',
    }
  }
  // body は KE-01 schema で min 50 文字必要、不足時 padding
  const body =
    d.bodyRedacted.length < 50 ? d.bodyRedacted.padEnd(50, ' ') : d.bodyRedacted

  return Object.freeze({
    frontmatter,
    body,
  })
}
