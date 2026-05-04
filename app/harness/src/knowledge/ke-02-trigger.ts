/**
 * KE-02 trigger — 案件完了時のナレッジ自動抽出 trigger (Round 13 Dev-E 前倒し).
 *
 * 関連必須コントロール:
 *   KE-02 (DEC-019-033 ⑪ — Owner-in-the-loop 16 項目のうち、抽出 trigger 軸)
 *
 * 設計方針:
 *   - 案件完了 event (project_completed) を input とし、抽出候補 entry list を返す.
 *   - 副作用なし (pure planner): I/O は呼び出し側 (orchestrator) 責任.
 *   - PII redaction (KE-04) を **抽出時点で必ず適用** する (不可分な connection).
 *   - 第 11 種 HITL gate (HITL-11) へ送る前段の **draft entry** を生成.
 *
 * trigger 条件:
 *   - status が 'completed' / 'cancelled' へ遷移したとき
 *   - 引数 raw report に再利用可能 indicator (>= 2 案件で発生) が含まれるとき
 *
 * 出力:
 *   - { entries: KnowledgeDraft[], skipped: SkipReason[] }
 *   - entries は redact 済 body + frontmatter draft (id 未確定、HITL-11 で確定)
 */
import { redactPii, type RedactResult } from './ke-04-pii-redaction.js'

// ============================================================================
// 型
// ============================================================================

export type ProjectStatus = 'in_progress' | 'completed' | 'cancelled' | 'frozen'

export interface ProjectCompletionEvent {
  readonly prjId: string // PRJ-NNN or COMPANY-WEBSITE
  readonly previousStatus: ProjectStatus
  readonly newStatus: ProjectStatus
  /** lessons-learned / brief / decisions の連結 raw text (PII 含む可能性あり). */
  readonly rawReport: string
  /** 検出された pattern / decision / pitfall の type hint (任意). */
  readonly hints?: ReadonlyArray<{
    readonly kind: 'pattern' | 'decision' | 'pitfall'
    readonly title: string
    readonly snippet: string
  }>
}

export interface KnowledgeDraft {
  readonly kind: 'pattern' | 'decision' | 'pitfall'
  readonly sourcePrj: string
  readonly title: string
  readonly bodyRedacted: string
  readonly piiHitCount: number
  readonly tags: ReadonlyArray<string>
  readonly requiresHitl11: boolean
}

export type SkipReason =
  | { readonly kind: 'not_terminal_status' }
  | { readonly kind: 'no_hints' }
  | { readonly kind: 'snippet_too_short'; readonly title: string }

export interface TriggerResult {
  readonly entries: ReadonlyArray<KnowledgeDraft>
  readonly skipped: ReadonlyArray<SkipReason>
  /** trigger 自体を発火させるか (false なら pre-empt). */
  readonly shouldFire: boolean
}

// ============================================================================
// trigger 判定
// ============================================================================

const TERMINAL_STATUSES: ReadonlySet<ProjectStatus> = new Set(['completed', 'cancelled'])

const MIN_BODY_LENGTH = 50 // KE-01 schema body min と整合
const HITL11_PII_THRESHOLD = 1 // PII 1 件以上検出で HITL-11 必須化

/**
 * shouldTrigger — 状態遷移ベース判定 (純関数).
 */
export function shouldTrigger(event: ProjectCompletionEvent): boolean {
  if (event.previousStatus === event.newStatus) return false
  return TERMINAL_STATUSES.has(event.newStatus)
}

/**
 * extractTags — title + snippet から軽量 tag を抽出 (heuristic).
 */
function extractTags(title: string, snippet: string): string[] {
  const text = `${title} ${snippet}`.toLowerCase()
  const candidates = [
    'security',
    'harness',
    'ci',
    'github-actions',
    'next.js',
    'supabase',
    'expo',
    'mobile',
    'tauri',
    'electron',
    'pdf',
    'ocr',
    'vlm',
    'ai-sdk',
    'organization',
    'governance',
    'control',
  ]
  const hits = candidates.filter((c) => text.includes(c))
  return hits.length > 0 ? hits : ['general']
}

/**
 * planExtraction — completion event から抽出 plan を生成.
 *
 * 副作用なし: I/O / Slack 通知 / file write は呼び出し側責任.
 * PII redaction は **必ず** 通す (KE-04 連動).
 */
export function planExtraction(event: ProjectCompletionEvent): TriggerResult {
  const skipped: SkipReason[] = []

  if (!shouldTrigger(event)) {
    skipped.push({ kind: 'not_terminal_status' })
    return Object.freeze({
      entries: Object.freeze([]),
      skipped: Object.freeze(skipped),
      shouldFire: false,
    })
  }

  const hints = event.hints ?? []
  if (hints.length === 0) {
    skipped.push({ kind: 'no_hints' })
    return Object.freeze({
      entries: Object.freeze([]),
      skipped: Object.freeze(skipped),
      shouldFire: false,
    })
  }

  const drafts: KnowledgeDraft[] = []

  for (const h of hints) {
    if (h.snippet.length < MIN_BODY_LENGTH) {
      skipped.push({ kind: 'snippet_too_short', title: h.title })
      continue
    }
    const redact: RedactResult = redactPii(h.snippet)
    const draft: KnowledgeDraft = {
      kind: h.kind,
      sourcePrj: event.prjId,
      title: h.title,
      bodyRedacted: redact.redacted,
      piiHitCount: redact.hits.length,
      tags: Object.freeze(extractTags(h.title, h.snippet)),
      requiresHitl11: redact.hits.length >= HITL11_PII_THRESHOLD,
    }
    drafts.push(Object.freeze(draft))
  }

  return Object.freeze({
    entries: Object.freeze(drafts.slice()),
    skipped: Object.freeze(skipped),
    shouldFire: drafts.length > 0,
  })
}

/**
 * formatSlackNotification — 抽出 trigger 発火を Slack 通知用に整形 (副作用なし).
 */
export function formatSlackNotification(result: TriggerResult, prjId: string): string {
  if (!result.shouldFire) {
    return `[knowledge-extract] skipped for ${prjId} (no fire)`
  }
  const lines: string[] = [
    `[knowledge-extract] trigger fired for ${prjId}`,
    `  candidates: ${result.entries.length}`,
  ]
  let needsHitl = 0
  for (const e of result.entries) {
    if (e.requiresHitl11) needsHitl += 1
  }
  lines.push(`  requires HITL-11: ${needsHitl} / ${result.entries.length}`)
  return lines.join('\n')
}
