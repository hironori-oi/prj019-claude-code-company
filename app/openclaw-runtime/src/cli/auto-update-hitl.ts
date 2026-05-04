/**
 * cli/auto-update-hitl — Round 13 Dev-D 着地 (Task B):
 *   `cli-version-check.ts` が detect した out-of-range / unparseable / spawn_failed 等の
 *   状態を、HITL gate 第 12 種 `cli_version_update_approval` の発火 payload に変換する設計層。
 *
 * 設計方針:
 *   - **設計のみ / 副作用 0**: 本 module は payload 構造化と純関数 builder を提供する。
 *     実 fire 経路 (HitlGate.requestApproval 呼び出し) は Round 14 / harness orchestrator
 *     経路で wiring される (W4 想定)。
 *   - **gate-11 (PII review) と同形式**: zod discriminated union で type=cli_version_update_approval
 *     を識別し、approve_action / reject_action の 2 分岐を payload schema で固定化。
 *   - **dry-run fallback 連携**: out-of-range 検出時は reject 後の自動 dry-run fallback を
 *     payload meta に記録 (subscription-router.forceDryRun=true 連動の判断材料)。
 *   - **payload 24h timeout default**: 既存 HITL gate (DEC-019-018) の default に従う。
 *     timeout 時は reject 扱い + warning 継続使用を想定。
 *
 * 関連:
 *   - cli/cli-version-check.ts (CliVersionCheckResult を入力に取る)
 *   - harness/hitl-gate.ts (HitlAction / HitlActionType 拡張候補)
 *   - DEC-019-007 (副作用ゼロ要件)
 *   - DEC-019-018 (HITL 第 6 種 SOP — 第 12 種は同 SOP 形式に準拠)
 *   - DEC-019-051 (subscription-driven 中核 / version 確認の運用)
 *
 * Round 14 引継ぎ予定:
 *   - HitlActionType に 'cli_version_update_approval' を追加
 *   - harness orchestrator が startup health check で本 builder を呼び、結果を gate に投入
 *   - approve 時の自動 update flow (npm i -g claude-code@latest 相当) は別 Decision で議論
 */
import { z } from 'zod'
import type {
  CliVersionCheckResult,
  CliVersionCheckOutcome,
  SemverParts,
  AcceptedRange,
} from './cli-version-check.js'

/**
 * 第 12 種 HITL gate のアクション種別 ID。
 * 既存 HitlActionType (harness/hitl-gate.ts) の拡張候補値。
 */
export const CLI_VERSION_UPDATE_APPROVAL_TYPE = 'cli_version_update_approval' as const

/** approve 時の caller の取り得るアクション。 */
export const CliVersionApproveActionSchema = z.enum([
  /** 範囲外でも fallback せず、現行 CLI で稼働継続を許可する */
  'continue_with_warning',
  /** 範囲外を契機に subscription-router.forceDryRun=true へ切替える */
  'switch_to_dry_run',
  /** caller が手動 update を行うため一時的に halt */
  'halt_for_manual_update',
])
export type CliVersionApproveAction = z.infer<typeof CliVersionApproveActionSchema>

/** reject 時の自動 fallback アクション (default は switch_to_dry_run)。 */
export const CliVersionRejectActionSchema = z.enum([
  /** 全自動で dry-run mode に fallback (本 gate の default reject behavior) */
  'switch_to_dry_run',
  /** caller が halt して手動対応する */
  'halt',
])
export type CliVersionRejectAction = z.infer<typeof CliVersionRejectActionSchema>

/** 範囲構造 (cli-version-check.AcceptedRange と同等、zod 化のみ)。 */
export const AcceptedRangeSchema = z.object({
  minMajor: z.number().int().min(0),
  minMinor: z.number().int().min(0),
  maxMajorExclusive: z.number().int().min(1),
})
export type AcceptedRangeType = z.infer<typeof AcceptedRangeSchema>

/** semver 構造 (cli-version-check.SemverParts と同等、zod 化のみ)。 */
export const SemverPartsSchema = z.object({
  major: z.number().int().min(0),
  minor: z.number().int().min(0),
  patch: z.number().int().min(0),
})
export type SemverPartsType = z.infer<typeof SemverPartsSchema>

/** version-check の outcome 識別 (gate-11 PII review と同形式の discriminated union)。 */
export const CliVersionCheckOutcomeSchema = z.enum([
  'ok',
  'out_of_range',
  'unparseable',
  'spawn_failed',
  'timeout',
])

/**
 * 第 12 種 gate の payload schema (zod discriminated union)。
 *
 * outcome に応じて contextually 必要な情報を絞り込む:
 *   - 'out_of_range' : version 必須
 *   - 'unparseable'  : rawStdout 必須 (truncated)
 *   - 'spawn_failed' : warning + rawStderr (truncated) を必須化
 *   - 'timeout'      : timeoutMs を必須化
 *
 * 'ok' は本 gate の発火 candidate ではないので、guard 関数 (shouldRequestApproval) で
 * 弾く。
 */
export const CliVersionUpdateApprovalPayloadSchema = z
  .object({
    /** 既存 cliPath (audit 用) */
    cliPath: z.string().min(1).max(500),
    /** 受容範囲 */
    acceptedRange: AcceptedRangeSchema,
    /** version-check の warning 文字列 (人間可読) */
    warning: z.string().min(1).max(1000),
    /** caller が approve した場合の希望アクション (= UI 上のラジオ選択肢) */
    suggestedApproveAction: CliVersionApproveActionSchema,
    /** reject 時の fallback アクション */
    rejectAction: CliVersionRejectActionSchema,
    /** retrieval / audit 用の追加 metadata */
    meta: z
      .object({
        /** 起動時刻 ISO */
        detectedAt: z.string(),
        /** dry-run fallback 候補かどうか (cli-version-check.fallbackToDryRun) */
        fallbackToDryRun: z.boolean(),
        /** rawStdout の先頭 1KB (truncated) */
        stdoutPreview: z.string().max(1024).optional(),
        /** rawStderr の先頭 1KB (truncated) */
        stderrPreview: z.string().max(1024).optional(),
      })
      .strict(),
  })
  .and(
    z.discriminatedUnion('outcome', [
      z.object({
        outcome: z.literal('out_of_range'),
        version: SemverPartsSchema,
      }),
      z.object({
        outcome: z.literal('unparseable'),
        version: z.null(),
      }),
      z.object({
        outcome: z.literal('spawn_failed'),
        version: z.null(),
      }),
      z.object({
        outcome: z.literal('timeout'),
        version: z.null(),
        timeoutMs: z.number().int().positive(),
      }),
    ]),
  )
export type CliVersionUpdateApprovalPayload = z.infer<
  typeof CliVersionUpdateApprovalPayloadSchema
>

/**
 * 第 12 種 gate の HITL request 構造 (HitlAction と互換)。
 *
 * harness/hitl-gate.ts が現状受ける HitlAction は { type, description, risk, meta } 形式。
 * 本 module はその meta に payload を埋め込む形で互換させ、Round 14 で
 * HitlActionType に 'cli_version_update_approval' を追加する想定。
 */
export interface CliVersionUpdateHitlRequest {
  readonly type: typeof CLI_VERSION_UPDATE_APPROVAL_TYPE
  readonly title: string
  readonly message: string
  readonly approveAction: CliVersionApproveAction
  readonly rejectAction: CliVersionRejectAction
  readonly risk: 'low' | 'medium' | 'high'
  readonly payload: CliVersionUpdateApprovalPayload
}

/**
 * version-check 結果が gate-12 の発火対象かを判定する純関数。
 *
 * - outcome === 'ok' は false (発火不要)
 * - その他は true
 */
export function shouldRequestApproval(result: CliVersionCheckResult): boolean {
  return result.outcome !== 'ok'
}

/** 文字列を 1KB 以下に truncate (純関数、suffix 込みで max 以下を保証)。 */
function truncate(s: string, max = 1024): string {
  if (typeof s !== 'string') return ''
  if (s.length <= max) return s
  const suffix = '...[truncated]'
  const head = max - suffix.length
  if (head <= 0) return suffix.slice(0, max)
  return s.slice(0, head) + suffix
}

/**
 * outcome に応じて approveAction の default 候補を決定する純関数。
 */
export function suggestApproveActionFor(
  outcome: CliVersionCheckOutcome,
): CliVersionApproveAction {
  switch (outcome) {
    case 'out_of_range':
      // 既知の上位版 → 手動 update を促す
      return 'halt_for_manual_update'
    case 'unparseable':
      // parse できないだけで動作は問題ない可能性あり → 警告継続
      return 'continue_with_warning'
    case 'spawn_failed':
    case 'timeout':
      // 起動できない / 応答なし → dry-run へ切替
      return 'switch_to_dry_run'
    case 'ok':
    default:
      return 'continue_with_warning'
  }
}

/**
 * outcome に応じて risk level を分類する純関数 (UI / audit ソート用)。
 */
export function classifyRisk(
  outcome: CliVersionCheckOutcome,
): 'low' | 'medium' | 'high' {
  switch (outcome) {
    case 'out_of_range':
      return 'high'
    case 'spawn_failed':
    case 'timeout':
      return 'medium'
    case 'unparseable':
      return 'low'
    case 'ok':
    default:
      return 'low'
  }
}

/**
 * outcome に応じて UI 表示用の title / message を生成する純関数。
 *
 * 既存 hitl-gate (DEC-019-018) の description / meta UI 形式に準拠。
 */
export function buildTitleAndMessage(
  result: CliVersionCheckResult,
  acceptedRange: AcceptedRange,
): { title: string; message: string } {
  const v = result.version
  switch (result.outcome) {
    case 'out_of_range': {
      const verStr = v ? `${v.major}.${v.minor}.${v.patch}` : 'unknown'
      return {
        title: 'Claude Code CLI 版数 範囲外検出',
        message:
          `検出 version=${verStr} が受容範囲 ` +
          `[${acceptedRange.minMajor}.${acceptedRange.minMinor}, ` +
          `${acceptedRange.maxMajorExclusive}.0) を外れています。` +
          ' 手動 update 後の再起動を推奨します。',
      }
    }
    case 'unparseable':
      return {
        title: 'Claude Code CLI 版数 parse 失敗',
        message:
          '`claude-code --version` の出力から semver を抽出できませんでした。 ' +
          '版数特定不能のまま稼働継続するか、手動確認を要請します。',
      }
    case 'spawn_failed':
      return {
        title: 'Claude Code CLI 起動失敗',
        message:
          `\`claude-code --version\` 起動に失敗 (${result.warning ?? 'unknown'})。` +
          ' dry-run mode への自動 fallback を承認してください。',
      }
    case 'timeout':
      return {
        title: 'Claude Code CLI 応答 timeout',
        message:
          `\`claude-code --version\` が応答しませんでした (${result.warning ?? 'timeout'})。` +
          ' dry-run mode への自動 fallback を承認してください。',
      }
    case 'ok':
    default:
      return {
        title: 'Claude Code CLI 版数 OK',
        message: 'version-check に問題はありません。本 gate は発火対象外です。',
      }
  }
}

/**
 * cli-version-check の結果を gate-12 用 payload に変換する builder (純関数)。
 *
 * - outcome==='ok' は null を返す (caller は shouldRequestApproval で gate を skip)。
 * - その他は zod schema で validate された構造化 payload を返す。
 *
 * 副作用 0 / 入力に依らず副作用なし / parse error は throw (caller が握る)。
 */
export interface BuildPayloadOptions {
  cliPath: string
  acceptedRange: AcceptedRange
  /** ISO 時刻取得 hook (default = new Date().toISOString()) */
  nowIso?: () => string
  /** timeout 時の timeoutMs (out-of-context のため明示注入が必要) */
  timeoutMs?: number
}

export function buildCliVersionUpdateHitlRequest(
  result: CliVersionCheckResult,
  opts: BuildPayloadOptions,
): CliVersionUpdateHitlRequest | null {
  if (!shouldRequestApproval(result)) return null

  const nowIso = opts.nowIso ?? (() => new Date().toISOString())
  const acceptedRange = AcceptedRangeSchema.parse(opts.acceptedRange)
  const suggestedApproveAction = suggestApproveActionFor(result.outcome)
  const rejectAction: CliVersionRejectAction =
    result.fallbackToDryRun ? 'switch_to_dry_run' : 'halt'
  const risk = classifyRisk(result.outcome)
  const { title, message } = buildTitleAndMessage(result, acceptedRange)

  // outcome 別 payload (discriminated union 経路)
  const baseMeta = {
    cliPath: opts.cliPath,
    acceptedRange,
    warning: result.warning ?? `cli version-check outcome=${result.outcome}`,
    suggestedApproveAction,
    rejectAction,
    meta: {
      detectedAt: nowIso(),
      fallbackToDryRun: result.fallbackToDryRun,
      stdoutPreview: truncate(result.rawStdout ?? ''),
      stderrPreview: truncate(result.rawStderr ?? ''),
    },
  }

  let payload: CliVersionUpdateApprovalPayload
  switch (result.outcome) {
    case 'out_of_range': {
      const ver = result.version
      if (!ver) {
        throw new Error(
          'auto-update-hitl: outcome=out_of_range but version is null (invariant violated)',
        )
      }
      payload = CliVersionUpdateApprovalPayloadSchema.parse({
        ...baseMeta,
        outcome: 'out_of_range',
        version: ver,
      })
      break
    }
    case 'unparseable':
      payload = CliVersionUpdateApprovalPayloadSchema.parse({
        ...baseMeta,
        outcome: 'unparseable',
        version: null,
      })
      break
    case 'spawn_failed':
      payload = CliVersionUpdateApprovalPayloadSchema.parse({
        ...baseMeta,
        outcome: 'spawn_failed',
        version: null,
      })
      break
    case 'timeout': {
      const timeoutMs = opts.timeoutMs ?? 5000
      payload = CliVersionUpdateApprovalPayloadSchema.parse({
        ...baseMeta,
        outcome: 'timeout',
        version: null,
        timeoutMs,
      })
      break
    }
    default:
      // 'ok' は shouldRequestApproval で弾いている。型で網羅されないが defensive。
      return null
  }

  return Object.freeze({
    type: CLI_VERSION_UPDATE_APPROVAL_TYPE,
    title,
    message,
    approveAction: suggestedApproveAction,
    rejectAction,
    risk,
    payload,
  })
}

/**
 * Re-export 専用の型エイリアス (cli barrel から `import type` で参照する場合の便宜)。
 */
export type { SemverParts, AcceptedRange, CliVersionCheckOutcome }
