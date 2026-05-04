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
  type OpenclawRuntime,
  type SubprocessSpawnContract,
  type OpenclawRuntimeContract,
} from './wrapper.js'

export type {
  OpenclawConfig,
  OpenclawProvider,
  LoopResult,
  LoopStatus,
} from './types.js'
