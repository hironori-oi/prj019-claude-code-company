/**
 * hitl-gate — 人間最終承認ゲート (Human In The Loop)。
 *
 * 関連必須コントロール:
 *   G-04 (公開前人間承認ゲート)
 *   DEC-019-018 (HITL 第 6 種 tos_gray_review、24h timeout default reject)
 *
 * ゲート対象 6 種 (PM v2 §3.2 / pm-phase1-plan-v2.1.md / DEC-019-018):
 *   - public_release   : preview/prod の公開 deploy
 *   - paid_api_call    : 有償 API key の利用 (Anthropic API / OpenAI API 等)
 *   - force_push       : git force push (NG-5 違反予防)
 *   - prod_deploy      : production 環境への deploy
 *   - external_api     : 第三者 API への outbound call (HTTP allowlist 外)
 *   - tos_gray_review  : ToS gray ジャンル (G-Top-1〜4) または confidence 0.5〜0.85 の HITL
 *
 * 承認方式 (W0 段階):
 *   - file based polling: ~/.clawbridge/pending-approvals/<id>.json を作成
 *   - オーナーが <id>.approved または <id>.rejected ファイルを置くまで polling
 *   - timeout: 24h でデフォルト reject (PM v2 仕様)
 *   - W2 で Slack interactive button / Email magic link への拡張余地を残す
 *
 * 並列度:
 *   - 1 ハーネスで複数 pending を持てる (UUID で識別)
 *   - request → poll loop で wait
 *
 * 重複排除（DEC-019-018 ⑤）:
 *   - tos_gray_review では meta.need_id で dedup する
 *   - 同一 need_id が in-flight なら新規 request は同じ promise を返す（最初の決定を共有）
 */
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { HITL_PENDING_DIR } from './paths.js'
import { ensureDirSelf, fileExists, saveJson, loadJson } from './fs-store.js'

export type HitlActionType =
  | 'public_release'
  | 'paid_api_call'
  | 'force_push'
  | 'prod_deploy'
  | 'external_api'
  | 'tos_gray_review'

/** 後方互換 alias (旧コード参照用)。新規コードは HitlActionType を使用。 */
export type HitlActionKind = HitlActionType

export type HitlRiskLevel = 'low' | 'medium' | 'high'

/**
 * tos_gray_review 用 payload スキーマ (DEC-019-018)。
 * ジャンル分類器 (claude -p --json-schema) の出力サブセット +
 * 人間判断者向けの need_summary を必須化。
 */
export const TosGrayReviewPayload = z.object({
  category: z.string().min(1).max(100),
  subcategory: z.string().min(1).max(100),
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(20).max(2000),
  need_summary: z.string().min(1).max(2000),
  /** dedup キー。同一 need_id への重複承認要請をマージする。 */
  need_id: z.string().min(1).max(200),
  /**
   * blocklist キーワードヒット (任意)。
   * gray パスでも blocklist キーワードを補足検知した場合 'tos_gray_blocklist_hit' で
   * 即拒否するためのヒント。
   */
  blocklist_hits: z.array(z.string()).default([]),
})
export type TosGrayReviewPayloadType = z.infer<typeof TosGrayReviewPayload>

export interface HitlAction {
  type: HitlActionType
  description: string
  risk: HitlRiskLevel
  meta?: Record<string, unknown>
}

/** 拒否理由の標準種別 (audit / monitoring 用)。 */
export type HitlRejectionReason =
  | 'timeout'
  | 'rejected'
  | 'approved'
  | 'tos_gray_timeout'
  | 'tos_gray_human_reject'
  | 'tos_gray_blocklist_hit'

export interface HitlApprovalResult {
  approved: boolean
  approver?: string
  comment?: string
  /** 'approved' / 'rejected' / 'timeout' の従来値 + tos_gray_* 拡張 */
  reason?: HitlRejectionReason
  decidedAt: string
  /** tos_gray_review で audit append された override note */
  override_note?: string
}

export interface HitlGate {
  requestApproval(action: HitlAction): Promise<HitlApprovalResult>
  /** pending request 一覧 (テスト/デバッグ用) */
  listPending(): Promise<string[]>
  /** id 指定で承認/却下 (テスト・CLI 用) */
  decide(
    id: string,
    decision: 'approved' | 'rejected',
    meta?: { approver?: string; comment?: string; override_note?: string },
  ): Promise<void>
}

interface HitlGateOptions {
  pendingDir?: string
  /** 承認待ち polling 間隔 (ms) */
  pollIntervalMs?: number
  /** 承認待ち timeout (ms)。デフォルト 24h。 */
  timeoutMs?: number
  /** test 注入用 */
  now?: () => Date
  /** test 用に timeout を受け取る代わりに 1 tick で reject する */
  abortSignal?: AbortSignal
  /**
   * tos_gray_review 用 audit ログのパス。
   * 未指定なら pendingDir/audit-tos-gray.json を使用。
   */
  tosGrayAuditPath?: string
}

interface TosGrayAuditEntry {
  approved_by?: string
  approved_at: string
  override_note?: string
  need_id: string
  category: string
  subcategory: string
  confidence: number
  rejection_reason?: HitlRejectionReason
}

interface TosGrayAuditLog {
  entries: TosGrayAuditEntry[]
}

export class FileHitlGate implements HitlGate {
  private readonly pendingDir: string
  private readonly pollIntervalMs: number
  private readonly timeoutMs: number
  private readonly now: () => Date
  private readonly tosGrayAuditPath: string
  /** dedup: need_id → in-flight promise */
  private readonly inflightTosGray = new Map<string, Promise<HitlApprovalResult>>()

  constructor(opts: HitlGateOptions = {}) {
    this.pendingDir = opts.pendingDir ?? HITL_PENDING_DIR
    this.pollIntervalMs = opts.pollIntervalMs ?? 5000
    this.timeoutMs = opts.timeoutMs ?? 24 * 60 * 60 * 1000 // 24h
    this.now = opts.now ?? (() => new Date())
    this.tosGrayAuditPath =
      opts.tosGrayAuditPath ?? join(this.pendingDir, 'audit-tos-gray.json')
  }

  async requestApproval(action: HitlAction): Promise<HitlApprovalResult> {
    if (action.type === 'tos_gray_review') {
      return this.requestTosGrayReview(action)
    }
    return this.requestApprovalRaw(action)
  }

  /** tos_gray_review 専用の入口。dedup + payload 検証 + blocklist 即拒否 + audit 連携。 */
  private async requestTosGrayReview(action: HitlAction): Promise<HitlApprovalResult> {
    // payload zod 検証 (不正 category / 範囲外 confidence をここで弾く)
    const parsed = TosGrayReviewPayload.safeParse(action.meta ?? {})
    if (!parsed.success) {
      throw new Error(
        `hitl-gate: invalid tos_gray_review payload — ${parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')}`,
      )
    }
    const payload = parsed.data

    // dedup: 同一 need_id の in-flight 要求が存在すればその promise を共有
    const existing = this.inflightTosGray.get(payload.need_id)
    if (existing) return existing

    // blocklist ヒットあれば即拒否（人間 polling 不要、コスト 0）
    if (payload.blocklist_hits.length > 0) {
      const result: HitlApprovalResult = {
        approved: false,
        reason: 'tos_gray_blocklist_hit',
        decidedAt: this.now().toISOString(),
      }
      await this.appendTosGrayAudit({
        approved_at: result.decidedAt,
        need_id: payload.need_id,
        category: payload.category,
        subcategory: payload.subcategory,
        confidence: payload.confidence,
        rejection_reason: 'tos_gray_blocklist_hit',
      })
      return result
    }

    // 通常 polling フローを起動 + dedup map に登録
    const promise = (async () => {
      try {
        const raw = await this.requestApprovalRaw(action)
        // tos_gray_* に reason を rewrite + audit append
        let mappedReason: HitlRejectionReason = raw.reason ?? 'timeout'
        if (raw.reason === 'timeout') mappedReason = 'tos_gray_timeout'
        else if (raw.reason === 'rejected') mappedReason = 'tos_gray_human_reject'
        // approved の場合は 'approved' のまま（reason は意味的に成功側）
        const finalResult: HitlApprovalResult = {
          ...raw,
          reason: mappedReason,
        }
        await this.appendTosGrayAudit({
          ...(raw.approver !== undefined && { approved_by: raw.approver }),
          approved_at: finalResult.decidedAt,
          ...(raw.override_note !== undefined && { override_note: raw.override_note }),
          need_id: payload.need_id,
          category: payload.category,
          subcategory: payload.subcategory,
          confidence: payload.confidence,
          ...(raw.approved ? {} : { rejection_reason: mappedReason }),
        })
        return finalResult
      } finally {
        this.inflightTosGray.delete(payload.need_id)
      }
    })()
    this.inflightTosGray.set(payload.need_id, promise)
    return promise
  }

  /** 既存 5 種 + tos_gray_review の polling 共通実装。 */
  private async requestApprovalRaw(action: HitlAction): Promise<HitlApprovalResult> {
    await ensureDirSelf(this.pendingDir)
    const id = randomUUID()
    const requestPath = join(this.pendingDir, `${id}.json`)
    const approvedPath = join(this.pendingDir, `${id}.approved`)
    const rejectedPath = join(this.pendingDir, `${id}.rejected`)

    const requestBody = {
      id,
      action,
      createdAt: this.now().toISOString(),
      timeoutMs: this.timeoutMs,
    }
    await fs.writeFile(requestPath, JSON.stringify(requestBody, null, 2), 'utf-8')

    const startMs = this.now().getTime()
    // poll loop
    while (true) {
      const elapsed = this.now().getTime() - startMs
      if (elapsed >= this.timeoutMs) {
        // timeout = reject (PM v2 仕様: 24h 未承認で auto reject)
        await this.cleanup(id)
        return {
          approved: false,
          reason: 'timeout',
          decidedAt: this.now().toISOString(),
        }
      }
      if (await fileExists(approvedPath)) {
        const data = await this.readDecision(approvedPath)
        await this.cleanup(id)
        return {
          approved: true,
          ...(data.approver !== undefined && { approver: data.approver }),
          ...(data.comment !== undefined && { comment: data.comment }),
          ...(data.override_note !== undefined && { override_note: data.override_note }),
          reason: 'approved',
          decidedAt: this.now().toISOString(),
        }
      }
      if (await fileExists(rejectedPath)) {
        const data = await this.readDecision(rejectedPath)
        await this.cleanup(id)
        return {
          approved: false,
          ...(data.approver !== undefined && { approver: data.approver }),
          ...(data.comment !== undefined && { comment: data.comment }),
          ...(data.override_note !== undefined && { override_note: data.override_note }),
          reason: 'rejected',
          decidedAt: this.now().toISOString(),
        }
      }
      await sleep(this.pollIntervalMs)
    }
  }

  async listPending(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.pendingDir)
      return files
        .filter((f) => f.endsWith('.json') && !f.startsWith('audit-'))
        .map((f) => f.replace(/\.json$/, ''))
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
      throw err
    }
  }

  async decide(
    id: string,
    decision: 'approved' | 'rejected',
    meta: { approver?: string; comment?: string; override_note?: string } = {},
  ): Promise<void> {
    await ensureDirSelf(this.pendingDir)
    const target = join(this.pendingDir, `${id}.${decision}`)
    await fs.writeFile(target, JSON.stringify(meta, null, 2), 'utf-8')
  }

  /** tos_gray_review の audit 追記 (fs-store atomic write 経由)。 */
  private async appendTosGrayAudit(entry: TosGrayAuditEntry): Promise<void> {
    const log = await loadJson<TosGrayAuditLog>(this.tosGrayAuditPath, { entries: [] })
    log.entries.push(entry)
    await saveJson(this.tosGrayAuditPath, log)
  }

  private async readDecision(
    path: string,
  ): Promise<{ approver?: string; comment?: string; override_note?: string }> {
    try {
      const content = await fs.readFile(path, 'utf-8')
      const parsed: unknown = JSON.parse(content)
      if (typeof parsed === 'object' && parsed !== null) {
        const obj = parsed as Record<string, unknown>
        const result: { approver?: string; comment?: string; override_note?: string } = {}
        if (typeof obj['approver'] === 'string') result.approver = obj['approver']
        if (typeof obj['comment'] === 'string') result.comment = obj['comment']
        if (typeof obj['override_note'] === 'string')
          result.override_note = obj['override_note']
        return result
      }
      return {}
    } catch {
      return {}
    }
  }

  private async cleanup(id: string): Promise<void> {
    const targets = [
      join(this.pendingDir, `${id}.json`),
      join(this.pendingDir, `${id}.approved`),
      join(this.pendingDir, `${id}.rejected`),
    ]
    for (const t of targets) {
      try {
        await fs.unlink(t)
      } catch {
        // ignore
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
