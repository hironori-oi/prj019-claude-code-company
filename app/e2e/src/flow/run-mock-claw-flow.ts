/**
 * run-mock-claw-flow — mock-claw e2e full flow scaffold (R10 Dev-γ 主成果)。
 *
 * 1 round-trip flow:
 *   Stage 1: needs_scout — runNeedsScout (HN fixture, 13 領域 denylist filter, scoring)
 *   Stage 2: dispatch    — Open Claw → CEO 構造化 JSON IF (dispatchToCeo + sinks)
 *   Stage 3: ceo_receive — CEO mock inbox accumulate (sink ack)
 *   Stage 4: tos_check   — tos-monitor 評価 (continuous run / cost cap / fallback)
 *   Stage 5: kill_switch — kill-switch trigger 評価 (mock、exitOnTrigger=false)
 *   Stage 6: audit_chain — audit log SHA-256 hash chain verify
 *   Stage 7: recovery    — kill-switch disarm + state reset で次サイクル可能性確認
 *
 * 設計原則:
 *   - 副作用ゼロ (HTTP / process spawn / 既存 fs path 一切叩かない)。
 *     audit log の出力先は tmp dir 注入 (test 側で os.tmpdir() 配下を渡す想定)。
 *   - 既存 module はすべて import で利用、内部改変なし。
 *   - 各 stage の outcome を構造化して返し、test では集約値を assert 可能。
 *
 * 関連: CLAUDE.md app/e2e/ 配置原則 / DEC-019-006 P-D 改 / DEC-019-033 ②
 */

import {
  runNeedsScout,
  type Candidate,
  type NeedsScoutResult,
} from '@clawbridge/needs-scout'
import {
  dispatchToCeo,
  type DispatchResult,
  type DispatchSinks,
  type DispatcherTimeSource,
} from '@clawbridge/openclaw-runtime'
import {
  createTosMonitor,
  FileKillSwitch,
  shouldFallbackToApiKey,
  type FallbackDecision,
  type FallbackDecisionInput,
  type Ng3Plan,
  type TimeSource,
  type TosMonitor,
  type TosMonitorEvent,
} from '@clawbridge/harness'
import {
  FileAuditLogStore,
  type AuditLogStore,
  type AuditVerifyResult,
} from '@clawbridge/audit'

import { buildHnFixtureResponse, HN_FIXTURE_HITS, type HnFixtureHit } from '../fixtures/hn-fixture.js'
import { buildProposalFromCandidate } from '../fixtures/proposal-builder.js'
import { CeoMockInbox } from '../ceo/ceo-mock-inbox.js'
import { createCeoInboxSink } from '../ceo/ceo-inbox-sink.js'
import { createAuditDispatchSink } from '../ceo/audit-dispatch-sink.js'

export type FlowStageName =
  | 'needs_scout'
  | 'dispatch'
  | 'ceo_receive'
  | 'tos_check'
  | 'kill_switch'
  | 'audit_chain'
  | 'recovery'

export interface FlowStageOutcome {
  stage: FlowStageName
  ok: boolean
  detail: Record<string, unknown>
  errorMessage?: string
}

export interface FlowRecoveryReport {
  killWasArmed: boolean
  killWasTriggered: boolean
  /** disarm + reset 完了後 next cycle 可能か (副作用ゼロで判定) */
  canResume: boolean
  /** 次 boot 時の seenWarnings / breachLog がリセット済か */
  monitorResetVerified: boolean
}

export interface MockClawE2eFlowOptions {
  /** HN fixture の hits 上書き (default = HN_FIXTURE_HITS) */
  hnHits?: readonly HnFixtureHit[]
  /** scoutRunId (default = 'mock-scout-1') */
  scoutRunId?: string
  /** message id (default = 'mock-msg-1') */
  messageId?: string
  /** trace id (default = 'mock-trace-1') */
  openclawTraceId?: string
  /** proposalId (default = 'mock-proposal-1') */
  proposalId?: string
  /** sentAt ISO8601 (default = '2026-05-04T12:00:00.000Z') */
  sentAt?: string
  /** TimeSource 注入 (default = FakeTimeSource at sentAt) */
  timeSource?: TimeSource
  /** dispatcher 用 sleep mock (default = 0ms 即時) */
  dispatcherTimeSource?: DispatcherTimeSource
  /** audit log の物理ファイル絶対パス (default = test tmp dir 必須) */
  auditFilePath: string
  /** NG-3 plan (default = plan_b_16h CEO 推奨) */
  ng3Plan?: Ng3Plan
  /** sub-flow: rate spike 強制 evaluate (default = false) */
  evaluateRateSpike?: boolean
  /** sub-flow: cost cap 強制 evaluate (default = true、costTracker stub 経由) */
  evaluateCostCap?: boolean
  /** kill-switch を hard_fail で発火させるか (cost cap > $30 強制注入、default = false) */
  forceKillTrigger?: boolean
  /** failNthAttempt: CEO sink の N 回目を失敗させる (default なし) */
  ceoSinkFailNthAttempt?: number
}

export interface MockClawE2eFlowResult {
  /** 各 stage の outcome (順序固定) */
  stages: readonly FlowStageOutcome[]
  /** stage 全体が ok=true ならば true (audit verify pass + dispatch success + recovery 完了) */
  overallOk: boolean
  /** Stage 1 needs_scout の生戻り値 (test 側 deep assert 用) */
  scoutResult: NeedsScoutResult
  /** Stage 2 dispatch の戻り値 */
  dispatchResult: DispatchResult
  /** Stage 3 受信 inbox snapshot */
  ceoInbox: CeoMockInbox
  /** Stage 4 tos-monitor が emit した event 列 */
  tosEvents: readonly TosMonitorEvent[]
  /** Stage 4 fallback decision (純関数評価) */
  fallbackDecision: FallbackDecision
  /** Stage 5 kill-switch 状態 */
  killTriggered: boolean
  /** Stage 6 audit chain verify 結果 */
  auditVerify: AuditVerifyResult
  /** Stage 7 recovery 報告 */
  recovery: FlowRecoveryReport
  /** 完了時刻 ISO8601 */
  completedAt: string
}

/**
 * mock-claw e2e full flow を 1 round-trip で実行する scaffold。
 *
 * @param opts - 主に auditFilePath (tmp dir パス) を test 側で渡す。それ以外は default 値あり。
 */
export async function runMockClawE2eFlow(
  opts: MockClawE2eFlowOptions,
): Promise<MockClawE2eFlowResult> {
  const stages: FlowStageOutcome[] = []
  const fixedSentAt = opts.sentAt ?? '2026-05-04T12:00:00.000Z'
  const fixedNow = new Date(fixedSentAt)
  const scoutRunId = opts.scoutRunId ?? 'mock-scout-1'
  const messageId = opts.messageId ?? 'mock-msg-1'
  const traceId = opts.openclawTraceId ?? 'mock-trace-1'
  const proposalId = opts.proposalId ?? 'mock-proposal-1'

  // ---------- Stage 1: needs_scout ----------
  let scoutResult: NeedsScoutResult
  try {
    const fakeFetch: typeof globalThis.fetch = async () =>
      buildHnFixtureResponse(opts.hnHits ?? HN_FIXTURE_HITS)
    scoutResult = await runNeedsScout({
      hn: { fetchFn: fakeFetch, now: () => fixedNow },
      now: () => fixedNow,
      runId: scoutRunId,
    })
    stages.push({
      stage: 'needs_scout',
      ok: scoutResult.accepted.length > 0,
      detail: {
        fetchedCount: scoutResult.fetchedCount,
        acceptedCount: scoutResult.accepted.length,
        rejectedCount: scoutResult.rejected.length,
        topScore: scoutResult.accepted[0]?.score ?? null,
        licenseCheckRequired: scoutResult.meta.licenseCheckRequired,
      },
    })
    if (scoutResult.accepted.length === 0) {
      throw new Error('Stage 1 needs_scout: accepted=[] (fixture mismatch)')
    }
  } catch (err) {
    stages.push({
      stage: 'needs_scout',
      ok: false,
      detail: {},
      errorMessage: (err as Error).message,
    })
    return finalize(stages, opts, undefined, undefined, undefined, undefined, undefined, undefined, undefined)
  }

  // ---------- Stage 2: dispatch ----------
  const inbox = new CeoMockInbox(() => fixedSentAt)
  const auditStore: AuditLogStore = new FileAuditLogStore({
    filePath: opts.auditFilePath,
    rotation: { rotateOnAppend: false }, // test では rotate 抑止
    now: () => fixedNow,
  })
  const ceoSink = createCeoInboxSink(
    inbox,
    opts.ceoSinkFailNthAttempt !== undefined
      ? { failNthAttempt: opts.ceoSinkFailNthAttempt }
      : {},
  )
  const auditSink = createAuditDispatchSink(auditStore, { auditSource: 'orchestrator' })
  const sinks: DispatchSinks = {
    auditLog: auditSink,
    dashboard: ceoSink,
  }
  const topCandidate = scoutResult.accepted[0] as Candidate & { score: number }
  const proposal = buildProposalFromCandidate({
    candidate: topCandidate,
    scoutRunId,
    messageId,
    openclawTraceId: traceId,
    sentAt: fixedSentAt,
    proposalId,
  })
  let dispatchResult: DispatchResult
  try {
    dispatchResult = await dispatchToCeo(proposal, sinks, {
      maxRetries: 3,
      initialBackoffMs: 0,
      timeSource: opts.dispatcherTimeSource ?? { sleep: () => Promise.resolve() },
    })
    const ok =
      dispatchResult.status === 'all_succeeded' ||
      dispatchResult.status === 'partial_failure'
    stages.push({
      stage: 'dispatch',
      ok,
      detail: {
        status: dispatchResult.status,
        sinkOutcomes: dispatchResult.sinkOutcomes.map((s) => ({
          sinkName: s.sinkName,
          ok: s.ok,
          attempts: s.attempts,
        })),
        messageType: dispatchResult.messageType,
      },
    })
  } catch (err) {
    stages.push({
      stage: 'dispatch',
      ok: false,
      detail: {},
      errorMessage: (err as Error).message,
    })
    return finalize(stages, opts, scoutResult, undefined, inbox, undefined, undefined, undefined, undefined)
  }

  // ---------- Stage 3: ceo_receive ----------
  stages.push({
    stage: 'ceo_receive',
    ok: inbox.size >= 1,
    detail: {
      inboxSize: inbox.size,
      lastMessageType: inbox.last()?.message.messageType ?? null,
      lastAckId: inbox.last()?.ackId ?? null,
    },
  })

  // ---------- Stage 4: tos_check ----------
  const monitor: TosMonitor = createTosMonitor({
    ng3Plan: opts.ng3Plan ?? 'plan_b_16h',
    confirmCount: 1, // test 高速化
    ...(opts.timeSource !== undefined ? { timeSource: opts.timeSource } : {}),
    ...(opts.forceKillTrigger
      ? {
          // cost cap breach を駆動するため costTracker stub を注入 (CostTracker contract 実装)
          costTracker: {
            recordSpend: async () => undefined,
            getMonthlyTotal: async () => 9999,
            getDailyTotal: async () => 0,
            getSessionTotal: async () => 0,
            getProjectTotal: async () => 0,
            checkBudget: async () => ({ ok: true }),
            reset: async () => undefined,
          },
        }
      : {}),
  })
  const tosEvents: TosMonitorEvent[] = []
  monitor.on((ev) => {
    tosEvents.push(ev)
  })

  // 連続稼働 evaluate (boot 直後なので breach なしを想定)
  monitor.markBoot()
  await monitor.checkContinuousRun()

  // cost cap evaluate (forceKillTrigger=true なら breach 検知される)
  if (opts.evaluateCostCap !== false) {
    await monitor.checkCostCap()
  }

  // rate spike evaluate (任意)
  if (opts.evaluateRateSpike) {
    monitor.recordTokens(0)
    await monitor.checkRateSpike()
  }

  // fallback decision (純関数)
  const fallbackInput: FallbackDecisionInput = {
    subscription: 'active',
    warningCount: monitor.getWarningCount24h(),
    maxWarningSeverity: monitor.getMaxWarningSeverity24h(),
    costTier: null,
    ng3BreachCount7d: monitor.getNg3BreachCount7d(),
  }
  const fallbackDecision = shouldFallbackToApiKey(fallbackInput)
  stages.push({
    stage: 'tos_check',
    ok: true,
    detail: {
      tosEventCount: tosEvents.length,
      tosEventTypes: tosEvents.map((e) => e.type),
      fallbackDecision: {
        shouldFallback: fallbackDecision.shouldFallback,
        reason: fallbackDecision.reason,
      },
    },
  })

  // ---------- Stage 5: kill_switch ----------
  const killSwitch = new FileKillSwitch({
    signalPath: opts.auditFilePath + '.kill-signal', // test 用 isolated path
    historyPath: opts.auditFilePath + '.kill-history.json',
    pollIntervalMs: 60_000, // poll を実質無効化 (test 中に発火しないよう長め)
    handlerTimeoutMs: 1_000,
    exitOnTrigger: false,
  })
  let killTriggered = false
  if (opts.forceKillTrigger) {
    await killSwitch.trigger('e2e mock-claw flow forceKillTrigger=true', {
      source: 'budget',
      details: { e2e: true },
    })
    killTriggered = killSwitch.isTriggered()
  }
  stages.push({
    stage: 'kill_switch',
    ok: opts.forceKillTrigger ? killTriggered : !killSwitch.isTriggered(),
    detail: {
      armed: killSwitch.isArmed(),
      triggered: killTriggered,
      forceKillTrigger: opts.forceKillTrigger ?? false,
    },
  })

  // ---------- Stage 6: audit_chain ----------
  const auditVerify = await auditStore.verifyHashChain()
  stages.push({
    stage: 'audit_chain',
    ok: auditVerify.valid,
    detail: {
      valid: auditVerify.valid,
      brokenAt: auditVerify.brokenAt,
      totalChecked: auditVerify.totalChecked,
    },
  })

  // ---------- Stage 7: recovery ----------
  const monitorBeforeReset = monitor.getNg3BreachCount7d()
  await killSwitch.disarm()
  monitor.reset()
  const monitorAfterReset = monitor.getNg3BreachCount7d()
  const recovery: FlowRecoveryReport = {
    killWasArmed: false, // arm 自体を呼んでいないので false が正常
    killWasTriggered: killTriggered,
    canResume: !killSwitch.isArmed(),
    monitorResetVerified: monitorBeforeReset >= 0 && monitorAfterReset === 0,
  }
  stages.push({
    stage: 'recovery',
    ok: recovery.canResume && recovery.monitorResetVerified,
    detail: {
      ...recovery,
    },
  })

  return finalize(
    stages,
    opts,
    scoutResult,
    dispatchResult,
    inbox,
    tosEvents,
    fallbackDecision,
    auditVerify,
    recovery,
    killTriggered,
  )
}

function finalize(
  stages: FlowStageOutcome[],
  _opts: MockClawE2eFlowOptions,
  scoutResult?: NeedsScoutResult,
  dispatchResult?: DispatchResult,
  inbox?: CeoMockInbox,
  tosEvents?: readonly TosMonitorEvent[],
  fallbackDecision?: FallbackDecision,
  auditVerify?: AuditVerifyResult,
  recovery?: FlowRecoveryReport,
  killTriggered?: boolean,
): MockClawE2eFlowResult {
  const completedAt = new Date().toISOString()
  return {
    stages: Object.freeze(stages),
    overallOk: stages.every((s) => s.ok),
    scoutResult: scoutResult ?? emptyScoutResult(),
    dispatchResult: dispatchResult ?? emptyDispatchResult(),
    ceoInbox: inbox ?? new CeoMockInbox(),
    tosEvents: tosEvents ?? Object.freeze([]),
    fallbackDecision: fallbackDecision ?? {
      shouldFallback: false,
      reason: 'no_action',
      escalateToOwner: false,
      rationale: 'flow aborted before tos_check',
    },
    killTriggered: killTriggered ?? false,
    auditVerify: auditVerify ?? { valid: false, brokenAt: null, totalChecked: 0 },
    recovery: recovery ?? {
      killWasArmed: false,
      killWasTriggered: false,
      canResume: false,
      monitorResetVerified: false,
    },
    completedAt,
  }
}

function emptyScoutResult(): NeedsScoutResult {
  return {
    accepted: [],
    rejected: [],
    fetchedCount: 0,
    meta: {
      runId: 'aborted',
      startedAt: new Date(0).toISOString(),
      finishedAt: new Date(0).toISOString(),
      licenseCheckRequired: true,
    },
  }
}

function emptyDispatchResult(): DispatchResult {
  return {
    status: 'no_sinks',
    sinkOutcomes: Object.freeze([]),
    completedAt: new Date(0).toISOString(),
  }
}
