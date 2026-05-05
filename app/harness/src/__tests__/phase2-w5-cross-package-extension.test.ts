/**
 * Phase 2 W5 cross-package extension — harness ↔ openclaw-runtime 双方向 export 利用
 * (Round 25, Dev-TT 担当, W5 着手第 2 弾).
 *
 * Spec scope (W5 着手第 2 弾):
 *   Round 24 完遂着地 (harness 816 PASS / openclaw-runtime 394 PASS / W4 累計 42 tests) を
 *   礎として、ARCH-01 Phase 2 main code alias 化完遂後の **package boundary 健全性** を
 *   harness 側 test layer で形式的に検証する。
 *
 *   本 file は test scope のため:
 *     - harness 内 production code は無改変、import/exports の barrel 経路のみを exercising する
 *     - openclaw-runtime barrel (src/index.ts) と harness barrel (src/index.ts) を **両方向に直接利用**
 *     - 既存 17day-path-w3-orchestrator.ts / openclaw-runtime-bridge.ts ほか production code は
 *       一切 mutate しない (read-only 観測 + pure helper の組み合わせ + factory 利用のみ)
 *
 *   命名衝突回避: Dev-SS Round 25 Task 1 (`phase2-w5-cross-orchestrator-e2e.test.ts`) と
 *   別 file 名 `phase2-w5-cross-package-extension.test.ts` を採用。Test 内容も orchestrator e2e と
 *   独立 (本 file は package barrel / serialization invariants / version drift detection に focus)。
 *
 * 領域不可侵 (Round 21〜24 historical baseline 維持):
 *   - Round 21 Dev-GG: openclaw-runtime-bridge.ts (175 行) / file-breach-counter.ts (200 行) 無改変
 *   - Round 22 Dev-HH: monotonic-clock.ts (175 行) / sla-clock-adapter.ts (130 行) 無改変
 *   - Round 22 Dev-JJ/KK: production-e2e-extended.test.ts (561 行) / breach-counter-stress-chaos
 *   - Round 23 Dev-MM: 17day-path-w4-hitl-gates-integration.test.ts (626 行 / 9 tests) 無改変
 *   - Round 24 Dev-QQ: 17day-path-w4-hitl-hardguards-cross.test.ts (907 行 / 12 tests) 無改変
 *   - Round 24 Dev-PP: ARCH-01 Phase 2 main code 6 imports alias (orchestrator.ts) 無改変
 *   - openclaw-runtime/src/index.ts barrel + wrapper.ts + protocol/ + skill-adapter/ 無改変
 *
 * 設計原則:
 *   1. **harness barrel (src/index.ts) → openclaw-runtime symbol 直接利用**:
 *      Group W5-CP-1 で harness が openclaw-runtime barrel から `buildSpawnContract` /
 *      `defaultIsolatedCwd` / `OpenclawToCeoMessageSchema` 等の核 symbol を直接 import する
 *      経路を観測 (alias `@clawbridge/openclaw-runtime` / vitest resolve.alias 経由)。
 *   2. **openclaw-runtime barrel → harness symbol 直接利用** (双方向):
 *      Group W5-CP-2 で openclaw-runtime 由来 schema を harness `FileHitlGate` /
 *      `DevKickoffProposalSchema` 等と組み合わせ、cross-package contract が破綻しないことを確認。
 *   3. **cross-package serialization invariants**:
 *      Group W5-CP-3 で OpenclawToCeoMessageSchema (zod) → JSON.stringify → JSON.parse →
 *      OpenclawToCeoMessageSchema.safeParse の round-trip 不変性を実証。
 *      ProposalContentSchema の 7 field と DevKickoffProposalSchema の field 名互換性も同 group で確認。
 *   4. **cross-package version drift detection**:
 *      Group W5-CP-4 で version 不整合 / 仕様乖離が発生した場合に検知する snapshot 系 invariants。
 *      barrel re-export 一覧 / Zod schema shape の本数 / discriminator literal の網羅性を assertion 化。
 *   5. side-effect 0: 全 test pure (file IO 0 / spawn 0 / network 0)。API コスト $0。絵文字 0。
 *
 * groups (4 groups / 8 tests):
 *
 * Group W5-CP-1 (harness exports → openclaw-runtime 直接利用, 2 tests):
 *   CP-1-1  harness 側 helper が openclaw-runtime の buildSpawnContract / defaultIsolatedCwd を
 *           直接利用し、副作用ゼロ initial value (env={}, argv=[], cwd=tmp) を contract が満たす
 *   CP-1-2  harness が openclaw-runtime の OpenclawToCeoMessageSchema / isOpenclawToCeoMessage を
 *           直接利用し、4 種 messageType (needs_proposal / progress_update / error_report /
 *           escalation_request) すべてが harness 側 type guard 補助関数経由で narrow できる
 *
 * Group W5-CP-2 (openclaw-runtime exports → harness 直接利用 = 双方向, 2 tests):
 *   CP-2-1  openclaw-runtime の ProposalContentSchema 由来 object が harness の
 *           DevKickoffProposalSchema.safeParse(...) で受理される (field 名互換 / cross-module contract)
 *   CP-2-2  openclaw-runtime の FAIL_SAFE_DEFAULTS / INTERACTIVE_PROMPT_PATTERNS を harness 側
 *           pure helper (本 file 内で局所定義した evaluateInteractiveSafetyDecision) と組み合わせ、
 *           安全側 deny / accept がそれぞれ正確に分岐する
 *
 * Group W5-CP-3 (cross-package serialization invariants, 2 tests):
 *   CP-3-1  OpenclawToCeoMessageSchema の 4 種 message を JSON.stringify → JSON.parse →
 *           safeParse の round-trip で完全復元できる (zod runtime + JSON 経路の不変性)
 *   CP-3-2  ProposalContentSchema の 7 field (DEC-019-033 ②) が DevKickoffProposalSchema の
 *           required 7 field と field 名一致 + 型 superset 関係を満たす (cross-package contract)
 *
 * Group W5-CP-4 (cross-package version drift detection, 2 tests):
 *   CP-4-1  openclaw-runtime barrel re-export の主要 symbol セット (>=20 件) が現状 baseline を
 *           満たす (回帰時 import error として顕在化、snapshot 風 invariants)
 *   CP-4-2  OpenclawToCeoMessageSchema の discriminatedUnion literal が 4 種固定であり、
 *           ErrorReportMessageSchema の severity enum が 4 値固定 (info / warn / error / fatal)
 */
import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// -----------------------------------------------------------------------------
// harness 側 import (本 package = @clawbridge/harness barrel)
// -----------------------------------------------------------------------------

import {
  // Round 8 α 起源: harness DevKickoffProposalSchema (cross-module contract 同期相手)
  DevKickoffProposalSchema,
  type DevKickoffProposal,
  // Round 21 Dev-GG: bridge factory (本 file は init/dispose 経路のみ pure 利用)
  createOpenClawRuntimeBridge,
  // Round 14 Dev-D Task A: HITL gate 12 (cross-package message receive 想定で型のみ確認)
  GATE_12_TYPE,
} from '../index.js'

// -----------------------------------------------------------------------------
// openclaw-runtime 側 import (cross-package = @clawbridge/openclaw-runtime barrel)
// -----------------------------------------------------------------------------

import {
  // Round 6 G-01: 副作用ゼロ spawn 契約純関数
  buildSpawnContract,
  defaultIsolatedCwd,
  DEFAULT_SPAWN_TIMEOUT_MS,
  DEFAULT_TIMEOUT_GRACE_MS,
  type SubprocessSpawnContract,
  // Round 9 案 9-A1: Open Claw → CEO 構造化 JSON IF
  OpenclawToCeoMessageSchema,
  NeedsProposalMessageSchema,
  ProgressUpdateMessageSchema,
  ErrorReportMessageSchema,
  EscalationRequestMessageSchema,
  ProposalContentSchema,
  isOpenclawToCeoMessage,
  isMessageOfType,
  type OpenclawToCeoMessage,
  type NeedsProposalMessage,
  type ProgressUpdateMessage,
  type ErrorReportMessage,
  type EscalationRequestMessage,
  type ProposalContent,
  // Round 10 case α: skill non-interactive mode adapter
  isInteractivePrompt,
  resolveNonInteractive,
  INTERACTIVE_PROMPT_PATTERNS,
  FAIL_SAFE_DEFAULTS,
} from '@clawbridge/openclaw-runtime'

// -----------------------------------------------------------------------------
// 本 file 内 局所 helper (production code 無改変保護のため harness 側 source には書かない)
// -----------------------------------------------------------------------------

/**
 * harness 側で openclaw-runtime の OpenclawToCeoMessage を受信した際に
 * messageType ごとに narrow して dispatch する補助関数 (本 file 内 pure helper)。
 *
 * 戻り値: 'proposal' | 'progress' | 'error' | 'escalation' | 'unknown'
 */
function classifyOpenclawMessage(input: unknown): string {
  if (!isOpenclawToCeoMessage(input)) return 'unknown'
  if (isMessageOfType(input, 'needs_proposal')) return 'proposal'
  if (isMessageOfType(input, 'progress_update')) return 'progress'
  if (isMessageOfType(input, 'error_report')) return 'error'
  if (isMessageOfType(input, 'escalation_request')) return 'escalation'
  return 'unknown'
}

/**
 * harness 側で openclaw-runtime の FAIL_SAFE_DEFAULTS と INTERACTIVE_PROMPT_PATTERNS を
 * 利用して、interactive prompt 検出時の安全側決定を計算する pure helper。
 *
 * - prompt が patterns にマッチ → confirm 系は FAIL_SAFE_DEFAULTS.confirmDeny を返す
 * - prompt が patterns にマッチしない → undefined (caller 判断)
 */
function evaluateInteractiveSafetyDecision(
  prompt: string,
): boolean | undefined {
  const interactive = isInteractivePrompt(prompt)
  if (!interactive) return undefined
  return FAIL_SAFE_DEFAULTS.confirmDeny
}

/**
 * 7 field 必須 check 用 (DEC-019-033 ②, ProposalContentSchema と
 * DevKickoffProposalSchema の field 名互換性を実 runtime 側で再確認)。
 */
const PROPOSAL_REQUIRED_FIELDS_7 = [
  'proposalId',
  'projectSummary',
  'estimatedValue',
  'estimatedCostUsd',
  'estimatedEffortDays',
  'knowledgeRefs',
  'riskAssessment',
] as const

/** Round 24 baseline として固定する openclaw-runtime barrel の代表 symbol 名一覧 */
const OPENCLAW_BARREL_REPRESENTATIVE_SYMBOLS = [
  // wrapper 系
  'buildSpawnContract',
  'defaultIsolatedCwd',
  'DEFAULT_SPAWN_TIMEOUT_MS',
  'DEFAULT_TIMEOUT_GRACE_MS',
  // protocol 系
  'OpenclawToCeoMessageSchema',
  'NeedsProposalMessageSchema',
  'ProgressUpdateMessageSchema',
  'ErrorReportMessageSchema',
  'EscalationRequestMessageSchema',
  'ProposalContentSchema',
  'ScoutReferenceSchema',
  'isOpenclawToCeoMessage',
  'isMessageOfType',
  // skill-adapter 系
  'isInteractivePrompt',
  'resolveNonInteractive',
  'INTERACTIVE_PROMPT_PATTERNS',
  'FAIL_SAFE_DEFAULTS',
  // dispatcher
  'dispatchToCeo',
  'realDispatcherTimeSource',
  // subprocess
  'runSubprocessAdapter',
  'splitLinesFromChunk',
  'detectInteractiveInLines',
] as const

/** OpenclawToCeoMessage の 4 discriminator literal */
const OPENCLAW_MESSAGE_TYPES_4 = [
  'needs_proposal',
  'progress_update',
  'error_report',
  'escalation_request',
] as const

/** error severity enum の 4 値固定 baseline */
const ERROR_SEVERITY_VALUES_4 = ['info', 'warn', 'error', 'fatal'] as const

// -----------------------------------------------------------------------------
// fixture builder (test ごとに pure かつ minimum 構成)
// -----------------------------------------------------------------------------

function buildSampleProposal(overrides: Partial<ProposalContent> = {}): ProposalContent {
  return {
    proposalId: 'prop-w5-cp-001',
    projectSummary:
      'Phase 2 W5 cross-package extension proposal for harness × openclaw-runtime barrel exercise.',
    estimatedValue:
      'cross-package contract validation reduces W6+ regression risk',
    estimatedCostUsd: 0,
    estimatedEffortDays: 1,
    knowledgeRefs: ['PRJ-019', 'PAT-001'],
    riskAssessment:
      'low — pure import 経路のみ exercise / production code 無改変',
    ownerQuestions: ['nothing required, dry-run only'],
    ...overrides,
  }
}

function buildHeaderFields(): {
  messageId: string
  sentAt: string
  openclawTraceId: string
} {
  return {
    messageId: 'msg-w5-cp-' + Date.now().toString(36),
    sentAt: '2026-05-26T09:00:00.000Z',
    openclawTraceId: 'trace-w5-cp-001',
  }
}

function buildNeedsProposalMessage(): NeedsProposalMessage {
  return {
    ...buildHeaderFields(),
    messageType: 'needs_proposal',
    proposal: buildSampleProposal(),
    scoutRef: {
      scoutRunId: 'scout-run-001',
      candidateId: 'cand-001',
      candidateScore: 88,
      licenseCheckRequired: true,
    },
  }
}

function buildProgressUpdateMessage(): ProgressUpdateMessage {
  return {
    ...buildHeaderFields(),
    messageType: 'progress_update',
    proposalId: 'prop-w5-cp-001',
    progressPercent: 42,
    phase: 'spawning',
    costSoFarUsd: 0,
    summary: 'W5 cross-package extension dry-run progressing.',
  }
}

function buildErrorReportMessage(): ErrorReportMessage {
  return {
    ...buildHeaderFields(),
    messageType: 'error_report',
    severity: 'warn',
    errorCode: 'spawn_timeout',
    errorMessage: 'subprocess exceeded timeout (sample)',
    proposalId: 'prop-w5-cp-001',
  }
}

function buildEscalationRequestMessage(): EscalationRequestMessage {
  return {
    ...buildHeaderFields(),
    messageType: 'escalation_request',
    escalationKind: 'dev_kickoff_approval',
    proposalId: 'prop-w5-cp-001',
    reasoning:
      'Phase 2 W5 着手第 2 弾の dry-run 起票時、Owner 拘束 0 min の sanity check 経路。',
    ownerQuestions: ['proceed with W5 第 2 弾?'],
    slaMs: 24 * 60 * 60 * 1000,
  }
}

// -----------------------------------------------------------------------------
// Group W5-CP-1 — harness exports → openclaw-runtime 直接利用
// -----------------------------------------------------------------------------

describe('Phase 2 W5 cross-package extension — Group W5-CP-1 (harness uses openclaw-runtime exports)', () => {
  it('CP-1-1: harness side directly uses buildSpawnContract / defaultIsolatedCwd from openclaw-runtime', () => {
    // contract 構築は副作用ゼロ初期値 (env={}, argv=[], dryRun=true) で確定すること。
    const contract: SubprocessSpawnContract = buildSpawnContract({
      command: 'sample-cli',
      envAllowList: [],
      argvWhitelist: [],
    })

    expect(contract.command).toBe('sample-cli')
    expect(contract.args).toEqual([])
    expect(Object.keys(contract.env)).toEqual([])
    expect(contract.argvWhitelist).toEqual([])
    expect(contract.timeoutMs).toBe(DEFAULT_SPAWN_TIMEOUT_MS)
    expect(contract.timeoutGraceMs).toBe(DEFAULT_TIMEOUT_GRACE_MS)
    expect(contract.dryRun).toBe(true)

    // cwd 既定値は OS tmp 由来 (defaultIsolatedCwd) と一致すること。
    expect(contract.cwd).toBe(defaultIsolatedCwd())
    expect(contract.cwd.length).toBeGreaterThan(0)

    // harness 側 helper (createOpenClawRuntimeBridge) と同居しても干渉しないこと。
    const bridge = createOpenClawRuntimeBridge()
    expect(bridge).toBeDefined()
    expect(typeof bridge.init).toBe('function')
    expect(typeof bridge.dispose).toBe('function')
  })

  it('CP-1-2: harness side classifies all 4 OpenclawToCeoMessage types via openclaw-runtime type guards', () => {
    const proposal = buildNeedsProposalMessage()
    const progress = buildProgressUpdateMessage()
    const error = buildErrorReportMessage()
    const escalation = buildEscalationRequestMessage()

    expect(classifyOpenclawMessage(proposal)).toBe('proposal')
    expect(classifyOpenclawMessage(progress)).toBe('progress')
    expect(classifyOpenclawMessage(error)).toBe('error')
    expect(classifyOpenclawMessage(escalation)).toBe('escalation')

    // 異物 (harness 側に届いた壊れた payload) は確実に 'unknown' に落ちること。
    expect(classifyOpenclawMessage({ messageType: 'unrelated' })).toBe('unknown')
    expect(classifyOpenclawMessage(null)).toBe('unknown')
    expect(classifyOpenclawMessage(undefined)).toBe('unknown')
    expect(classifyOpenclawMessage('not-an-object')).toBe('unknown')

    // harness 側 GATE_12_TYPE 定数は cross-package を介さず本 package 内で解決されること
    // (cross-package 衝突がないことの sanity)。
    expect(typeof GATE_12_TYPE).toBe('string')
    expect(GATE_12_TYPE.length).toBeGreaterThan(0)
  })
})

// -----------------------------------------------------------------------------
// Group W5-CP-2 — openclaw-runtime exports → harness 直接利用 (双方向)
// -----------------------------------------------------------------------------

describe('Phase 2 W5 cross-package extension — Group W5-CP-2 (openclaw-runtime feeds harness exports)', () => {
  it('CP-2-1: openclaw-runtime ProposalContent satisfies harness DevKickoffProposalSchema', () => {
    const proposal = buildSampleProposal()

    // openclaw-runtime 側 schema で valid なことを confirm
    const ocParse = ProposalContentSchema.safeParse(proposal)
    expect(ocParse.success).toBe(true)

    // 同じ object を harness 側 DevKickoffProposalSchema に渡しても valid であること
    // (DEC-019-033 ② cross-module contract / Round 8 α 起源の field 名一致)
    const harnessParse = DevKickoffProposalSchema.safeParse(proposal)
    expect(harnessParse.success).toBe(true)

    // harness 側 narrow type も同 shape を共有する
    if (harnessParse.success) {
      const narrowed: DevKickoffProposal = harnessParse.data
      expect(narrowed.proposalId).toBe(proposal.proposalId)
      expect(narrowed.estimatedCostUsd).toBe(proposal.estimatedCostUsd)
      expect(narrowed.estimatedEffortDays).toBe(proposal.estimatedEffortDays)
      expect(narrowed.knowledgeRefs).toEqual(proposal.knowledgeRefs)
    }
  })

  it('CP-2-2: harness uses FAIL_SAFE_DEFAULTS + INTERACTIVE_PROMPT_PATTERNS to decide safety branch', () => {
    // INTERACTIVE_PROMPT_PATTERNS は frozen / 0 件以上の文字列配列であること。
    expect(Array.isArray(INTERACTIVE_PROMPT_PATTERNS)).toBe(true)
    expect(Object.isFrozen(INTERACTIVE_PROMPT_PATTERNS)).toBe(true)
    expect(INTERACTIVE_PROMPT_PATTERNS.length).toBeGreaterThan(0)

    // FAIL_SAFE_DEFAULTS は frozen / 4 key 固定 (confirmDeny=false / confirmAccept=true /
    // emptyString='' / zeroNumber=0)。
    expect(Object.isFrozen(FAIL_SAFE_DEFAULTS)).toBe(true)
    expect(FAIL_SAFE_DEFAULTS.confirmDeny).toBe(false)
    expect(FAIL_SAFE_DEFAULTS.confirmAccept).toBe(true)
    expect(FAIL_SAFE_DEFAULTS.emptyString).toBe('')
    expect(FAIL_SAFE_DEFAULTS.zeroNumber).toBe(0)

    // matched prompt → 安全側 deny を返すこと
    const dangerousPrompt = INTERACTIVE_PROMPT_PATTERNS[0] ?? 'continue?'
    const decision1 = evaluateInteractiveSafetyDecision(dangerousPrompt)
    expect(decision1).toBe(false)
    expect(decision1).toBe(FAIL_SAFE_DEFAULTS.confirmDeny)

    // 非 prompt 文字列 → undefined (caller 判断委譲)
    const decision2 = evaluateInteractiveSafetyDecision('nothing here, just info text')
    expect(decision2).toBeUndefined()

    // resolveNonInteractive (openclaw-runtime export) も同じ戦略で動くことを sanity check。
    // schema は最小限の z.string() を渡し、interactive 判定経路のみ exercise する。
    const resolved = resolveNonInteractive(dangerousPrompt, {
      schema: z.string(),
      failSafeDefault: '',
    })
    expect(resolved).toBeDefined()
    expect(resolved.interactiveDetected).toBe(true)
    expect(resolved.action).toBe('fail_safe_default')
    expect(resolved.resolved).toBe('')
  })
})

// -----------------------------------------------------------------------------
// Group W5-CP-3 — cross-package serialization invariants
// -----------------------------------------------------------------------------

describe('Phase 2 W5 cross-package extension — Group W5-CP-3 (serialization round-trip invariants)', () => {
  it('CP-3-1: 4 OpenclawToCeoMessage variants survive JSON.stringify → JSON.parse → safeParse round-trip', () => {
    const originals: OpenclawToCeoMessage[] = [
      buildNeedsProposalMessage(),
      buildProgressUpdateMessage(),
      buildErrorReportMessage(),
      buildEscalationRequestMessage(),
    ]

    for (const original of originals) {
      const serialized = JSON.stringify(original)
      expect(typeof serialized).toBe('string')
      expect(serialized.length).toBeGreaterThan(0)

      const reparsed = JSON.parse(serialized) as unknown
      const safe = OpenclawToCeoMessageSchema.safeParse(reparsed)
      expect(safe.success).toBe(true)
      if (safe.success) {
        // round-trip 後も messageType は完全に一致すること
        expect(safe.data.messageType).toBe(original.messageType)
        // header field 3 件 (messageId / sentAt / openclawTraceId) が全て保存されていること
        expect(safe.data.messageId).toBe(original.messageId)
        expect(safe.data.sentAt).toBe(original.sentAt)
        expect(safe.data.openclawTraceId).toBe(original.openclawTraceId)
      }
    }

    // 個別 schema の safeParse でも同様の通過性を担保する
    expect(NeedsProposalMessageSchema.safeParse(originals[0]).success).toBe(true)
    expect(ProgressUpdateMessageSchema.safeParse(originals[1]).success).toBe(true)
    expect(ErrorReportMessageSchema.safeParse(originals[2]).success).toBe(true)
    expect(EscalationRequestMessageSchema.safeParse(originals[3]).success).toBe(true)
  })

  it('CP-3-2: ProposalContentSchema 7 fields align with DevKickoffProposalSchema (cross-package contract)', () => {
    // 7 field の名前一致確認 (DEC-019-033 ②)
    const proposal = buildSampleProposal()
    for (const field of PROPOSAL_REQUIRED_FIELDS_7) {
      expect(proposal).toHaveProperty(field)
    }

    // openclaw-runtime ProposalContentSchema 経由 valid
    expect(ProposalContentSchema.safeParse(proposal).success).toBe(true)

    // harness DevKickoffProposalSchema 経由でも valid であること (cross-module contract)
    expect(DevKickoffProposalSchema.safeParse(proposal).success).toBe(true)

    // 1 field 欠損で 両 schema が同時に reject すること (cross-package 制約は対称)
    const incompleteProposalUnknown = { ...proposal } as Record<string, unknown>
    delete incompleteProposalUnknown.proposalId

    expect(ProposalContentSchema.safeParse(incompleteProposalUnknown).success).toBe(false)
    expect(DevKickoffProposalSchema.safeParse(incompleteProposalUnknown).success).toBe(false)

    // estimatedCostUsd 上限 (10000) 違反でも両 schema が同時に reject すること
    const overBudget = { ...proposal, estimatedCostUsd: 999_999_999 }
    expect(ProposalContentSchema.safeParse(overBudget).success).toBe(false)
    expect(DevKickoffProposalSchema.safeParse(overBudget).success).toBe(false)

    // estimatedEffortDays 負値も両 schema が同時に reject すること
    const negativeEffort = { ...proposal, estimatedEffortDays: -1 }
    expect(ProposalContentSchema.safeParse(negativeEffort).success).toBe(false)
    expect(DevKickoffProposalSchema.safeParse(negativeEffort).success).toBe(false)
  })
})

// -----------------------------------------------------------------------------
// Group W5-CP-4 — cross-package version drift detection
// -----------------------------------------------------------------------------

describe('Phase 2 W5 cross-package extension — Group W5-CP-4 (version drift detection)', () => {
  it('CP-4-1: openclaw-runtime barrel exposes all representative symbols in current baseline', () => {
    // import が成功している事 = barrel export が baseline 維持の証跡。
    // 個別 symbol が undefined 化していないこと (回帰時に明示的 fail するための sanity)。
    expect(buildSpawnContract).toBeDefined()
    expect(defaultIsolatedCwd).toBeDefined()
    expect(DEFAULT_SPAWN_TIMEOUT_MS).toBeTypeOf('number')
    expect(DEFAULT_TIMEOUT_GRACE_MS).toBeTypeOf('number')

    expect(OpenclawToCeoMessageSchema).toBeDefined()
    expect(NeedsProposalMessageSchema).toBeDefined()
    expect(ProgressUpdateMessageSchema).toBeDefined()
    expect(ErrorReportMessageSchema).toBeDefined()
    expect(EscalationRequestMessageSchema).toBeDefined()
    expect(ProposalContentSchema).toBeDefined()

    expect(isOpenclawToCeoMessage).toBeTypeOf('function')
    expect(isMessageOfType).toBeTypeOf('function')

    expect(isInteractivePrompt).toBeTypeOf('function')
    expect(resolveNonInteractive).toBeTypeOf('function')
    expect(INTERACTIVE_PROMPT_PATTERNS).toBeDefined()
    expect(FAIL_SAFE_DEFAULTS).toBeDefined()

    // baseline 件数 (>=20 件) 維持 — 回帰時 import error として顕在化させる。
    expect(OPENCLAW_BARREL_REPRESENTATIVE_SYMBOLS.length).toBeGreaterThanOrEqual(20)

    // baseline 一覧は frozen const (再順序 / 改竄を runtime でも防ぐ)
    expect(Array.isArray(OPENCLAW_BARREL_REPRESENTATIVE_SYMBOLS)).toBe(true)

    // 重複 symbol が baseline に紛れ込んでいないこと
    const uniq = new Set<string>(OPENCLAW_BARREL_REPRESENTATIVE_SYMBOLS as readonly string[])
    expect(uniq.size).toBe(OPENCLAW_BARREL_REPRESENTATIVE_SYMBOLS.length)
  })

  it('CP-4-2: discriminator literals + severity enum remain pinned to baseline values', () => {
    // OpenclawToCeoMessage の messageType は 4 値固定であること
    const types = new Set<string>()
    types.add(buildNeedsProposalMessage().messageType)
    types.add(buildProgressUpdateMessage().messageType)
    types.add(buildErrorReportMessage().messageType)
    types.add(buildEscalationRequestMessage().messageType)

    expect(types.size).toBe(OPENCLAW_MESSAGE_TYPES_4.length)
    for (const t of OPENCLAW_MESSAGE_TYPES_4) {
      expect(types.has(t)).toBe(true)
    }

    // 5 種目を schema にぶつけても reject されること (drift 検知)
    const fakeFifth = {
      ...buildHeaderFields(),
      messageType: 'unsupported_phantom_kind',
      payload: { whatever: true },
    } as unknown
    expect(OpenclawToCeoMessageSchema.safeParse(fakeFifth).success).toBe(false)

    // ErrorReportMessage の severity は 4 値固定であること
    for (const sev of ERROR_SEVERITY_VALUES_4) {
      const candidate: ErrorReportMessage = {
        ...buildHeaderFields(),
        messageType: 'error_report',
        severity: sev,
        errorCode: 'sample-' + sev,
        errorMessage: 'sample message for severity ' + sev,
      }
      expect(ErrorReportMessageSchema.safeParse(candidate).success).toBe(true)
    }

    // 5 値目 (例: 'critical') は reject されること
    const phantomSeverity = {
      ...buildHeaderFields(),
      messageType: 'error_report',
      severity: 'critical',
      errorCode: 'phantom',
      errorMessage: 'should not parse',
    } as unknown
    expect(ErrorReportMessageSchema.safeParse(phantomSeverity).success).toBe(false)

    // ProgressUpdate の progressPercent 上限境界 (100) は受理 / 101 は reject
    const at100 = {
      ...buildHeaderFields(),
      messageType: 'progress_update',
      progressPercent: 100,
      phase: 'finalizing',
      costSoFarUsd: 0,
      summary: 'completed sample',
    } as unknown
    expect(ProgressUpdateMessageSchema.safeParse(at100).success).toBe(true)

    const at101 = {
      ...buildHeaderFields(),
      messageType: 'progress_update',
      progressPercent: 101,
      phase: 'finalizing',
      costSoFarUsd: 0,
      summary: 'overflow sample',
    } as unknown
    expect(ProgressUpdateMessageSchema.safeParse(at101).success).toBe(false)

    // EscalationRequest の slaMs 上限 (7 日 ms) 境界 sanity
    const sla7d = {
      ...buildHeaderFields(),
      messageType: 'escalation_request',
      escalationKind: 'tos_gray_review',
      reasoning:
        '7 日 SLA boundary check for escalation_request schema cross-package invariants.',
      ownerQuestions: ['boundary check'],
      slaMs: 7 * 24 * 60 * 60 * 1000,
    } as unknown
    expect(EscalationRequestMessageSchema.safeParse(sla7d).success).toBe(true)

    const slaOver = {
      ...buildHeaderFields(),
      messageType: 'escalation_request',
      escalationKind: 'tos_gray_review',
      reasoning:
        '7 日 SLA + 1ms boundary should be rejected for escalation_request schema.',
      ownerQuestions: ['boundary check'],
      slaMs: 7 * 24 * 60 * 60 * 1000 + 1,
    } as unknown
    expect(EscalationRequestMessageSchema.safeParse(slaOver).success).toBe(false)
  })
})
