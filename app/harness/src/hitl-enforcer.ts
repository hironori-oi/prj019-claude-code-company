/**
 * hitl-enforcer — Round 7 W0-Week1 prefetch (G-09):
 *   HITL gate enforcement chain。openclaw-runtime の subprocess spawn 前に
 *   必ず通過するチェーンとして HITL gate と audit log を統合する。
 *
 * 関連必須コントロール:
 *   G-04 (公開前人間承認) / G-09 (監査ログ全件保存) / G-V2-04 (指示入力経路の単一化)
 *
 * 設計方針:
 *   - 単一エントリ `enforceBeforeSpawn` を提供。spawn 直前に呼ぶことを契約とし、
 *     openclaw-runtime / claude-bridge / orchestrator は本関数を経由する以外の
 *     spawn 経路を持たないこと (G-V2-04)。
 *   - HITL action 種別に応じて `requestApproval` を発行し、approved 時のみ true を返す。
 *     rejected / timeout / error は false で叩き返す。
 *   - 全ての decision を audit log (`hitl_decision` event) に記録 (G-09)。
 *     audit が未注入の場合は warn ログのみで継続 (W0 段階の互換)。
 *   - dryRun=true の場合は HITL を skip し、audit に `dryRun: true` を残す。
 *     これにより 副作用ゼロ test 経路で gate を素通りさせる (Round 6 G-01 整合)。
 *   - factory pattern: `createHitlEnforcer({ gate, audit, source })` を提供し、
 *     wrapper.ts factory と組み合わせ可能にする。
 */
import type { HitlAction, HitlGate, HitlApprovalResult } from './hitl-gate.js'
import type { AuditLogStore, AuditEventSource } from '@clawbridge/audit'

export interface HitlEnforcerOptions {
  gate: HitlGate
  /** audit log (任意)。未指定なら decision の永続化は skip される。 */
  audit?: AuditLogStore
  /** audit event の source (例: 'openclaw-runtime')。default 'harness' */
  source?: AuditEventSource
}

export interface EnforceBeforeSpawnInput {
  action: HitlAction
  /** subprocess 識別 (任意)。audit log の payload に含める。 */
  subprocessName?: string
  /** dryRun=true の場合 HITL を skip して audit のみ残す */
  dryRun?: boolean
}

export interface EnforceBeforeSpawnResult {
  approved: boolean
  result?: HitlApprovalResult
  /** audit append 結果 (id / hash)。audit 未注入時は undefined。 */
  auditId?: number
  /** audit append が失敗した場合 (best effort 挙動の理由) */
  auditError?: string
}

export interface HitlEnforcer {
  enforceBeforeSpawn(input: EnforceBeforeSpawnInput): Promise<EnforceBeforeSpawnResult>
}

class DefaultHitlEnforcer implements HitlEnforcer {
  private readonly gate: HitlGate
  private readonly audit: AuditLogStore | undefined
  private readonly source: AuditEventSource

  constructor(opts: HitlEnforcerOptions) {
    this.gate = opts.gate
    this.audit = opts.audit
    this.source = opts.source ?? 'harness'
  }

  async enforceBeforeSpawn(
    input: EnforceBeforeSpawnInput,
  ): Promise<EnforceBeforeSpawnResult> {
    const { action, subprocessName, dryRun } = input
    if (dryRun === true) {
      const auditMeta = await this.appendAudit({
        type: 'hitl_decision',
        approved: true,
        actionType: action.type,
        risk: action.risk,
        dryRun: true,
        ...(subprocessName !== undefined && { subprocessName }),
        decidedBy: 'dry-run',
      })
      return {
        approved: true,
        ...(auditMeta.id !== undefined && { auditId: auditMeta.id }),
        ...(auditMeta.error !== undefined && { auditError: auditMeta.error }),
      }
    }

    let result: HitlApprovalResult
    try {
      result = await this.gate.requestApproval(action)
    } catch (err) {
      const msg = (err as Error).message
      const auditMeta = await this.appendAudit({
        type: 'hitl_decision',
        approved: false,
        actionType: action.type,
        risk: action.risk,
        ...(subprocessName !== undefined && { subprocessName }),
        decidedBy: 'error',
        error: msg,
      })
      return {
        approved: false,
        ...(auditMeta.id !== undefined && { auditId: auditMeta.id }),
        ...(auditMeta.error !== undefined && { auditError: auditMeta.error }),
      }
    }

    const auditMeta = await this.appendAudit({
      type: 'hitl_decision',
      approved: result.approved,
      actionType: action.type,
      risk: action.risk,
      ...(subprocessName !== undefined && { subprocessName }),
      decidedAt: result.decidedAt,
      ...(result.reason !== undefined && { reason: result.reason }),
      ...(result.approver !== undefined && { approver: result.approver }),
    })
    return {
      approved: result.approved,
      result,
      ...(auditMeta.id !== undefined && { auditId: auditMeta.id }),
      ...(auditMeta.error !== undefined && { auditError: auditMeta.error }),
    }
  }

  private async appendAudit(
    payload: Record<string, unknown>,
  ): Promise<{ id?: number; error?: string }> {
    if (!this.audit) return {}
    try {
      const r = await this.audit.append({
        type: 'hitl_decision',
        source: this.source,
        payload,
      })
      return { id: r.id }
    } catch (err) {
      return { error: (err as Error).message }
    }
  }
}

/** factory: spawn 前 enforcement を提供する標準実装を返す。 */
export function createHitlEnforcer(opts: HitlEnforcerOptions): HitlEnforcer {
  return new DefaultHitlEnforcer(opts)
}
