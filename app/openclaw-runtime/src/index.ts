/**
 * @clawbridge/openclaw-runtime — OpenClaw OSS ラッパ層公開エントリ。
 *
 * W0: Mock 実装のみ提供 (W1 で Real 実装着手)。
 * 上流調査詳細: ./upstream-notes.md または ../UPSTREAM-NOTES.md (legacy 配置)
 */
export {
  MockOpenclawRuntime,
  RealOpenclawRuntime,
  createOpenclawRuntime,
  buildAllowedEnv,
  buildSpawnContract,
  defaultIsolatedCwd,
  enforceSpawnTimeout,
  DEFAULT_SPAWN_TIMEOUT_MS,
  DEFAULT_TIMEOUT_GRACE_MS,
  type OpenclawRuntime,
  type SubprocessSpawnContract,
  type OpenclawRuntimeContract,
  type BuildSpawnContractOptions,
  type CreateOpenclawRuntimeOptions,
  type EnforceSpawnTimeoutOptions,
  type EnforceSpawnTimeoutResult,
  type TimeoutTarget,
  type TimeoutCircuitBreaker,
} from './wrapper.js'

export type {
  OpenclawConfig,
  OpenclawProvider,
  LoopResult,
  LoopStatus,
} from './types.js'

// Round 9 案 9-A1 前倒し (CB-D-W3-03): Open Claw → CEO 構造化 JSON IF
export {
  OpenclawToCeoMessageSchema,
  NeedsProposalMessageSchema,
  ProgressUpdateMessageSchema,
  ErrorReportMessageSchema,
  EscalationRequestMessageSchema,
  ProposalContentSchema,
  ScoutReferenceSchema,
  isOpenclawToCeoMessage,
  isMessageOfType,
  type OpenclawToCeoMessage,
  type OpenclawToCeoMessageType,
  type NeedsProposalMessage,
  type ProgressUpdateMessage,
  type ErrorReportMessage,
  type EscalationRequestMessage,
  type ProposalContent,
  type ScoutReference,
} from './protocol/openclaw-to-ceo.schema.js'

export {
  dispatchToCeo,
  realDispatcherTimeSource,
  type DispatchSink,
  type DispatchSinks,
  type DispatchOptions,
  type DispatchResult,
  type DispatchStatus,
  type DispatcherTimeSource,
  type SinkAck,
  type SinkDispatchOutcome,
} from './protocol/dispatcher.js'

// Round 10 案 10-α 前倒し (CB-D-W3-04): skill non-interactive mode adapter
export {
  isInteractivePrompt,
  resolveNonInteractive,
  INTERACTIVE_PROMPT_PATTERNS,
  FAIL_SAFE_DEFAULTS,
  type InteractiveDetectorOptions,
  type NonInteractiveResolution,
  type ResolveNonInteractiveOptions,
} from './skill-adapter/non-interactive.js'

// Round 11 案 A 着地 (CB-D-W3-04 完遂): skill subprocess wrap (DryRunGuard + AbortController + kill chain)
export {
  runSubprocessAdapter,
  splitLinesFromChunk,
  detectInteractiveInLines,
  type SubprocessHandle,
  type SubprocessSpawner,
  type SubprocessSpawnInput,
  type DryRunGuardLike,
  type SubprocessAdapterResult,
  type RunSubprocessAdapterOptions,
  type SubprocessZodSchema,
} from './skill-adapter/subprocess.js'

// Round 12 Dev-D 着地: cli/ namespace barrel export
// caller は `import { cli } from '@clawbridge/openclaw-runtime'` でも
// `import { spawnClaudeCode } from '@clawbridge/openclaw-runtime/cli'` でも取得可能
// (個別 module の直接 import path も Round 11 から完全互換維持)。
export * as cli from './cli/index.js'
