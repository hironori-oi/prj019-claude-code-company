/**
 * cli/index — Round 12 Dev-D 着地 (Task B):
 *   cli/ 配下 module の barrel export 統合。
 *
 * 設計方針:
 *   - 既存 import path は完全互換 (`'./spawn-claude-code.js'` 等の直接 import は無修正で動作)
 *   - 公開 API としては cli barrel + 個別 module の双方を提供 (caller の自由)
 *   - alias 衝突回避: skill-adapter/subprocess.ts の `SubprocessHandle` /
 *     `SubprocessSpawner` 等と名前が被るため、cli barrel では re-export しない
 *     (Dev-C 想定の real-child-spawn / ndjson-parser も同様の規約に従う)
 *
 * 関連:
 *   - dev-round11-D-subscription-cli.md (cli 雛形 3 module)
 *   - dev-round11-A-denylist-subprocess.md (skill-adapter/subprocess.ts、別 namespace)
 *   - DEC-019-007 / 051 / 053-057
 */

// ===== spawn-claude-code =====
export {
  spawnClaudeCode,
  extractJsonEvents,
  adaptRealChildProcess,
  wireSpawnHandleToKillSwitch,
  type SpawnMode,
  type MockChildProcess,
  type SpawnClaudeCodeOptions,
  type SpawnHandle,
  type SpawnExitInfo,
  type SpawnDryRunRecord,
  type SpawnKillRegistry,
  type SpawnKillTarget,
  type SpawnKillRegistryToken,
} from './spawn-claude-code.js'

// ===== session-controller =====
export {
  createSessionController,
  isTransitionAllowed,
  awaitSessionFinish,
  type SessionState,
  type SessionTransitionRecord,
  type CreateSessionControllerOptions,
  type SessionController,
} from './session-controller.js'

// ===== subscription-router =====
export {
  selectSpawnMode,
  decisionToMode,
  projectRequiredBudgetUsd,
  isSubscriptionEligible,
  spawnFromDecision,
  type SubscriptionRouterInput,
  type SubscriptionRouterDecision,
  type EvaluationStep,
} from './subscription-router.js'

// ===== cli-version-check =====
export {
  checkClaudeCodeVersion,
  parseClaudeCodeVersion,
  isVersionInRange,
  DEFAULT_ACCEPTED_RANGE,
  type SemverParts,
  type CliVersionCheckOutcome,
  type CliVersionCheckResult,
  type AcceptedRange,
  type CheckClaudeCodeVersionOptions,
} from './cli-version-check.js'

// ===== auto-update-hitl (Round 13 Dev-D Task B、第 12 種候補) =====
export {
  CLI_VERSION_UPDATE_APPROVAL_TYPE,
  CliVersionApproveActionSchema,
  CliVersionRejectActionSchema,
  CliVersionUpdateApprovalPayloadSchema,
  AcceptedRangeSchema,
  SemverPartsSchema,
  CliVersionCheckOutcomeSchema,
  shouldRequestApproval,
  suggestApproveActionFor,
  classifyRisk as classifyCliVersionUpdateRisk,
  buildTitleAndMessage as buildCliVersionUpdateTitleAndMessage,
  buildCliVersionUpdateHitlRequest,
  type CliVersionApproveAction,
  type CliVersionRejectAction,
  type AcceptedRangeType,
  type SemverPartsType,
  type CliVersionUpdateApprovalPayload,
  type CliVersionUpdateHitlRequest,
  type BuildPayloadOptions as BuildCliVersionUpdatePayloadOptions,
} from './auto-update-hitl.js'

// ===== real-child-spawn (Round 12 Dev-C 着地分、Round 13 Dev-D Task D で append) =====
//
// 命名衝突回避規約:
//   - skill-adapter/subprocess.ts の `SubprocessHandle` / `SubprocessSpawner` 等は
//     barrel から re-export しない (cli barrel は cli/ namespace 専用)。
//   - real-child-spawn は `RealChild*` prefix で命名 (Round 12 Dev-D 引継ぎ規約)。
//   - 既存 export 名 (`spawnRealChildProcess` / `createRealSpawner`) は元名を維持。
export {
  spawnRealChildProcess,
  createRealSpawner,
  buildAllowlistedEnv,
  validateSpawnInputs,
  deriveRealSpawnOptions,
  RealChildSpawnValidationError,
  DEFAULT_ENV_ALLOWLIST,
  EMERGENCY_API_ENV_ALLOWLIST,
  type RealChildSpawnOptions,
  type ResolvedSpawnConfig,
} from './real-child-spawn.js'

// ===== ndjson-parser (Round 12 Dev-C 着地分、Round 13 Dev-D Task D で append) =====
//
// 命名衝突回避規約:
//   - 既存 spawn-claude-code.extractJsonEvents と区別するため stream 版は
//     `extractJsonEventsFromChunks` / `extractJsonEventsFromLines` の suffix 命名。
//   - parseNdjsonLine / createNdjsonStreamParser は元名を維持。
export {
  parseNdjsonLine,
  createNdjsonStreamParser,
  extractJsonEventsFromChunks,
  extractJsonEventsFromLines,
  type NdjsonParseResult,
  type NdjsonStreamParser,
} from './ndjson-parser.js'

// ===== cli-version-check-exec (Round 14 Dev-D Task B、actual spawn wrapper) =====
//
// 命名衝突回避規約:
//   - cli-version-check.ts と関数名重複を避けるため、actual exec 経路は
//     `runActualClaudeCodeVersion` / `buildVersionSpawnOptions` / `interpretSpawnOutcome`
//     / `shouldRecommendFallback` を新名で expose する.
//   - parseClaudeCodeVersion は cli-version-check.ts と同一実体 (re-export 経由) なので
//     cli-version-check-exec.ts からの export は省略 (重複 export を避ける).
export {
  runActualClaudeCodeVersion,
  buildVersionSpawnOptions,
  interpretSpawnOutcome,
  shouldRecommendFallback,
  DEFAULT_VERSION_EXEC_TIMEOUT_MS,
  type RunActualClaudeCodeVersionOptions,
  type ActualVersionExecOutcome,
} from './cli-version-check-exec.js'

// ===== cli-version-probe (Round 15 Dev-M M-2、actual exec + Result 型 + gate-12 連動) =====
export {
  probeClaudeCodeVersion,
  buildProbeResult,
  normalizeTimeoutMs,
  type CliVersionProbeOk,
  type CliVersionProbeErr,
  type CliVersionProbeResult,
  type ProbeClaudeCodeVersionOptions,
} from './cli-version-probe.js'

// ===== resource-quota-constants (Round 15 Dev-L Task L-1) =====
//
// subprocess spawn の resource quota の MIN/DEFAULT/MAX 値を一元管理する constants.
// drill #2 5/7 朝検証 (Review-F) で直接 import される。
export {
  MEMORY_MIN_BYTES,
  MEMORY_DEFAULT_BYTES,
  MEMORY_MAX_BYTES,
  CPU_MIN_PERCENT,
  CPU_DEFAULT_PERCENT,
  CPU_MAX_PERCENT,
  TIME_MIN_MS,
  TIME_DEFAULT_MS,
  TIME_MAX_MS,
  KILL_GRACE_MIN_MS,
  KILL_GRACE_DEFAULT_MS,
  KILL_GRACE_MAX_MS,
  DRILL_2_RECOMMENDED_QUOTA,
  clampNumeric,
  clampResourceQuotaSpec,
  defaultQuotaForPlatform,
  type ClampOutcome,
  type ClampedResourceQuota,
  type ResourceQuotaSpec,
} from './resource-quota-constants.js'

// ===== spawn-resource-attach (Round 15 Dev-L Task L-1) =====
//
// cgroup-linux / job-object-windows の cross-platform 統合 helper。
// post-spawn hook として "attachResourcePlanCrossPlatform(spec, pid, opts)" 1 関数で
// Linux/Windows/macOS/other を全部吸収する。
export {
  attachResourcePlanCrossPlatform,
  detectPlatformForAttach,
  createMockAttachOptions,
  type CrossPlatformAttachOutcome,
  type AttachResourcePlanOptions,
} from './spawn-resource-attach.js'

// ===== subprocess-related types from skill-adapter (alias 衝突回避用 re-export なし) =====
// 注意: skill-adapter/subprocess.ts の `SubprocessHandle` / `SubprocessSpawner` /
//       `SubprocessSpawnInput` / `SubprocessAdapterResult` などは、
//       本 cli barrel から直接 re-export しない。
//       caller が必要なら `@clawbridge/openclaw-runtime` root export または
//       `'@clawbridge/openclaw-runtime/skill-adapter/subprocess'` から取得する。
