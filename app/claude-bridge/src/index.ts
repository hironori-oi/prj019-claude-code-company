/**
 * @clawbridge/claude-bridge — Claude Code CLI subprocess spawn 層公開エントリ。
 */
export {
  ClaudeBridge,
  type ClaudeBridgeOptions,
  type ClaudeExecuteOptions,
  type ClaudeResult,
  type ClaudeErrorType,
  type ClaudePermissionMode,
} from './spawn.js'

export {
  parseStreamJsonText,
  parseStreamJsonLine,
  parseStreamJsonChunks,
  extractUsage,
  ClaudeMessageSchema,
  ClaudeUsageSchema,
  type ClaudeMessage,
  type ClaudeUsage,
  type ParseStreamJsonResult,
  type ParseLineResult,
  type ExtractedUsage,
} from './stream-json-parser.js'

export {
  detectClaudeAuth,
  type AuthDetectionResult,
  type AuthDetectorOptions,
} from './auth-detector.js'
