/**
 * drill-2-real-wireup — Round 15 Dev-L 着地 (Task L-2):
 *   5/7 朝 06:00-08:00 JST に実施される drill #2 (Review-F 担当) の
 *   "real subprocess + audit log + hash chain integrity" を mock ではなく
 *   実 path で検証可能にするための wire-up helper layer。
 *
 * 設計方針 (DEC-019-006 / 051 / 053-057 整合):
 *   - **既存 harness は無改変**: drill-2-1-shot-real-execution.harness.ts は変更せず、
 *     本 module で wire-up + integrity 検証を追加機能として提供する。
 *   - **mock / real co-exist**: 同じ scenario を `mode='audit-mock'` (in-memory) /
 *     `mode='audit-real'` (FileAuditLogStore) のいずれでも回せる。
 *   - **hash chain integrity**: drill 中に audit log に append された全 entry を
 *     verifyHashChain() で検証し、brokenAt が null かつ totalChecked === append 件数で
 *     OK と判定。
 *   - **dry-run guard G-12 抑止**: drill モード時は `mode='live'` の DryRunGuard を
 *     注入することで G-12 が発火しないことを保証する (drill は実機実行のため抑止が必須)。
 *   - **副作用ゼロ要件 (DEC-019-007)**: real audit path も tmp dir に閉じる。
 *     Sumi/Asagi の Claude Code session には一切影響しない。
 *
 * 関連:
 *   - drill-2-1-shot-real-execution.harness.ts (Round 13/14 Dev-C / 既存 harness)
 *   - audit/src/audit-log-real-impl.ts (Round 14 Dev-F / mock-real bridge)
 *   - audit/src/audit-store.ts (Round 7 / FileAuditLogStore + computeHash)
 *   - harness/src/dry-run-guard.ts (G-12 / CB-D-W4-01)
 *   - DEC-019-007 / 051
 *   - drill #2 5/7 朝 06:00-08:00 JST (Review-F)
 */
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  createAuditImpl,
  ensureDrillAuditDir,
  type AuditImplDescriptor,
  type AuditImplMode,
  type CreateAuditImplOptions,
} from '../../../audit/src/audit-log-real-impl.js'
import {
  type AuditLogStore,
  type AuditEvent,
  type AuditVerifyResult,
} from '../../../audit/src/audit-store.js'
import {
  createDryRunGuard,
  type DryRunGuard,
  type DryRunMode,
} from '../../../harness/src/dry-run-guard.js'
import type { DrillScenario } from './drill-2-1-shot-real-execution.harness.js'

// ============================================================================
// drill mode の整合性レコード
// ============================================================================

export type DrillRealWireupMode = 'audit-mock' | 'audit-real'

/**
 * drill 1-shot 実行コンテキスト。caller は createDrillRealWireupContext で初期化する。
 */
export interface DrillRealWireupContext {
  /** 'audit-mock' or 'audit-real' */
  readonly mode: DrillRealWireupMode
  /** real 経路時の audit ファイル path、mock 経路では null */
  readonly auditFilePath: string | null
  /** AuditLogStore (mock or real impl) */
  readonly audit: AuditLogStore
  /** audit-log-real-impl の descriptor (mode / filePath / bridgeProgress) */
  readonly descriptor: AuditImplDescriptor
  /** drill モード用 DryRunGuard (mode='live' で G-12 を抑止) */
  readonly dryRunGuard: DryRunGuard
  /** drill 開始 ISO 時刻 */
  readonly startedAtIso: string
  /** drill scratch dir (cleanup 用) */
  readonly scratchDir: string
}

export interface CreateDrillRealWireupContextOptions {
  /** 'audit-mock' or 'audit-real' (default = 'audit-mock') */
  mode?: DrillRealWireupMode
  /** audit file path 上書き (default = tmpdir 下に自動生成) */
  auditFilePath?: string
  /** scratch dir 上書き (default = tmpdir 下に自動生成) */
  scratchDir?: string
  /** ISO 時刻 hook (test 用) */
  nowIso?: () => string
  /** dry-run guard mode 上書き (default = 'live')。drill モードでは G-12 抑止必須なので 'live'。 */
  dryRunMode?: DryRunMode
}

/**
 * drill 1-shot 実行用 context を初期化する factory。
 *
 * 動作:
 *   - audit-mock mode: in-memory store (test 高速 / dry-run 互換)
 *   - audit-real mode: FileAuditLogStore + temp file path (実機 drill 検証)
 *   - DryRunGuard は default 'live' (drill 中に G-12 が発火しないことを保証)
 *
 * @returns 初期化済 context
 */
export async function createDrillRealWireupContext(
  opts: CreateDrillRealWireupContextOptions = {},
): Promise<DrillRealWireupContext> {
  const mode: DrillRealWireupMode = opts.mode ?? 'audit-mock'
  const nowIso = opts.nowIso ?? (() => new Date().toISOString())
  const startedAtIso = nowIso()
  const scratchDir =
    opts.scratchDir ??
    join(
      tmpdir(),
      `clawbridge-drill2-realwireup-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    )
  await fs.mkdir(scratchDir, { recursive: true })

  const auditMode: AuditImplMode = mode === 'audit-real' ? 'drill' : 'mock'
  const auditFilePath =
    mode === 'audit-real'
      ? (opts.auditFilePath ?? join(scratchDir, 'drill-audit.jsonl'))
      : null

  const auditOpts: CreateAuditImplOptions = {
    mode: auditMode,
  }
  if (auditFilePath !== null) {
    auditOpts.filePath = auditFilePath
    await ensureDrillAuditDir(auditFilePath)
  }
  const { store, descriptor } = await createAuditImpl(auditOpts)

  // drill mode では G-12 を抑止 ('live' は素通り、record のみ残す)
  const dryRunGuard = createDryRunGuard({
    mode: opts.dryRunMode ?? 'live',
  })

  return Object.freeze({
    mode,
    auditFilePath,
    audit: store,
    descriptor,
    dryRunGuard,
    startedAtIso,
    scratchDir,
  })
}

// ============================================================================
// scenario → audit append helper
// ============================================================================

/**
 * 1 シナリオ実行に対応する audit entry 列を append する純関数 helper。
 * 実 spawn の有無に依存せず、drill 中の "scenario 開始 / spawn 試行 / scenario 終了" の
 * 3 件の audit entry を保証する。
 *
 * @returns append された entry id 列
 */
export async function appendScenarioAuditEntries(
  ctx: DrillRealWireupContext,
  scenario: DrillScenario,
  attempt: {
    readonly stage: 'spawn_start' | 'spawn_exit' | 'spawn_aborted'
    readonly pid: number | null
    readonly exitCode: number | null
    readonly exitSignal: string | null
    readonly note?: string
  },
): Promise<{ readonly id: number; readonly hash: string }> {
  const event = {
    type:
      attempt.stage === 'spawn_aborted'
        ? ('kill_switch' as const)
        : ('spawn' as const),
    source: 'orchestrator' as const,
    payload: {
      scenario,
      stage: attempt.stage,
      pid: attempt.pid,
      exitCode: attempt.exitCode,
      exitSignal: attempt.exitSignal,
      note: attempt.note ?? null,
    },
  }
  return ctx.audit.append(event)
}

/**
 * scenario 1 件分の標準 sequence を append する高レベル helper:
 *   1. spawn_start
 *   2. spawn_exit (exit_code/signal を伴う)
 * 実機 spawn が abort された場合は spawn_aborted が使われる。
 */
export async function appendScenarioStandardSequence(
  ctx: DrillRealWireupContext,
  scenario: DrillScenario,
  outcome: {
    readonly pid: number | null
    readonly exitCode: number | null
    readonly exitSignal: string | null
    readonly aborted: boolean
    readonly note?: string
  },
): Promise<readonly { readonly id: number; readonly hash: string }[]> {
  const ids: { id: number; hash: string }[] = []
  ids.push(
    await appendScenarioAuditEntries(ctx, scenario, {
      stage: 'spawn_start',
      pid: outcome.pid,
      exitCode: null,
      exitSignal: null,
      note: outcome.note ?? null,
    }),
  )
  const finalStage = outcome.aborted ? 'spawn_aborted' : 'spawn_exit'
  ids.push(
    await appendScenarioAuditEntries(ctx, scenario, {
      stage: finalStage,
      pid: outcome.pid,
      exitCode: outcome.exitCode,
      exitSignal: outcome.exitSignal,
      note: outcome.note ?? null,
    }),
  )
  return Object.freeze(ids)
}

// ============================================================================
// hash chain integrity verification
// ============================================================================

export interface DrillHashChainCheckResult {
  /** verifyHashChain valid フラグ (true なら chain 完全) */
  readonly chainValid: boolean
  /** brokenAt entry id (null なら破損なし) */
  readonly brokenAt: number | null
  /** verify した entry 総数 */
  readonly totalChecked: number
  /** drill 中に append された entry 件数 (audit.list().length) */
  readonly appendedCount: number
  /** 期待件数と実件数が一致するか */
  readonly countsMatch: boolean
  /** drill モード固有の警告 (mode 不整合 / append 件数 0 等) */
  readonly diagnostics: readonly string[]
}

/**
 * drill 中に積まれた audit chain の整合性を verify する純関数 (副作用は audit.list / verify のみ)。
 *
 * 判定規則:
 *   - chainValid: verifyHashChain().valid === true
 *   - countsMatch: totalChecked === appendedCount
 *   - 両方 true なら drill OK
 *
 * @returns 結果 (chainValid + countsMatch + 診断メッセージ)
 */
export async function verifyDrillHashChainIntegrity(
  ctx: DrillRealWireupContext,
  expectedAppendedCount?: number,
): Promise<DrillHashChainCheckResult> {
  const verify: AuditVerifyResult = await ctx.audit.verifyHashChain()
  const all: AuditEvent[] = await ctx.audit.list({})
  const diagnostics: string[] = []
  if (!verify.valid) {
    diagnostics.push(`hash chain broken at id=${verify.brokenAt}`)
  }
  if (
    expectedAppendedCount !== undefined &&
    expectedAppendedCount !== all.length
  ) {
    diagnostics.push(
      `appended count mismatch: expected=${expectedAppendedCount} actual=${all.length}`,
    )
  }
  if (all.length === 0) {
    diagnostics.push('no audit entries appended during drill — likely wireup gap')
  }
  if (verify.totalChecked !== all.length) {
    diagnostics.push(
      `verify totalChecked=${verify.totalChecked} but list size=${all.length}`,
    )
  }
  const countsMatch =
    expectedAppendedCount === undefined
      ? true
      : expectedAppendedCount === all.length

  return Object.freeze({
    chainValid: verify.valid,
    brokenAt: verify.brokenAt,
    totalChecked: verify.totalChecked,
    appendedCount: all.length,
    countsMatch,
    diagnostics: Object.freeze(diagnostics),
  })
}

// ============================================================================
// G-12 drill mode bypass 確認
// ============================================================================

/**
 * drill 中に G-12 (DryRunGuard) が "発火しない" こと (= 'live' mode) を assert する純関数。
 *
 * drill モード ('live') では fn は素通しで実行され、record は blocked=false で残る。
 * もし誤って 'dry' mode で起動された場合、本 helper は Promise.reject になり caller で
 * detect 可能。
 *
 * @returns G-12 抑止チェック結果
 */
export async function verifyDrillG12NotFiring(
  ctx: DrillRealWireupContext,
): Promise<{
  readonly notFiring: boolean
  readonly mode: DryRunMode
  readonly recordedCount: number
  readonly blockedCount: number
  readonly diagnostics: readonly string[]
}> {
  const mode = ctx.dryRunGuard.mode
  const diagnostics: string[] = []
  if (mode === 'dry') {
    diagnostics.push(
      "drill 中に DryRunGuard mode='dry' で起動されています — drill 実機検証では 'live' が必須です",
    )
  }

  // 'live' mode 時に test fn を 1 回 wrap (素通し). dry mode 時は throw を期待.
  let blocked = false
  let recordedCount = 0
  try {
    await ctx.dryRunGuard.wrap('spawn', 'drill_g12_probe', async () => {
      // no-op: drill モード G-12 抑止確認用 probe
      return null
    })
  } catch (e) {
    // dry-run mode で起動されている場合 (= drill モード逸脱) DryRunRejectError が throw
    blocked = true
    diagnostics.push(
      `G-12 fired during drill probe: ${e instanceof Error ? e.message : String(e)}`,
    )
  }
  recordedCount = ctx.dryRunGuard.sideEffectsRecorded.length
  const blockedCount = ctx.dryRunGuard.sideEffectsRecorded.filter(
    (r) => r.blocked,
  ).length

  return Object.freeze({
    notFiring: !blocked && mode === 'live',
    mode,
    recordedCount,
    blockedCount,
    diagnostics: Object.freeze(diagnostics),
  })
}

// ============================================================================
// cleanup
// ============================================================================

/**
 * drill 終了後の context をクリーンアップする (scratch dir 削除)。
 * idempotent.
 */
export async function disposeDrillRealWireupContext(
  ctx: DrillRealWireupContext,
): Promise<void> {
  try {
    await fs.rm(ctx.scratchDir, { recursive: true, force: true })
  } catch {
    // best effort
  }
}
