/**
 * stream-json-parser — Claude Code CLI の `--output-format=stream-json` 出力を行ごとパース。
 *
 * 仕様 (公式 docs https://code.claude.com/docs/en/headless 由来):
 *   各行が独立した JSON オブジェクト (NDJSON / JSONL)。
 *
 * 既知の type:
 *   - "system"    : init / api_retry / config 等の system message
 *   - "user"      : user input echo
 *   - "assistant" : assistant message (delta or full)
 *   - "result"    : 最終結果 (usage / cost を含む可能性)
 *   - "error"     : エラー
 *
 * 未知 type は ClaudeMessage の type='unknown' として保持 (forward compat)。
 *
 * Phase 1 W0 段階では公式 spec が変動中の可能性があるため、zod schema は
 * 緩めに定義して passthrough 中心。
 */
import { z } from 'zod'

/* eslint-disable @typescript-eslint/consistent-type-definitions */

export const ClaudeUsageSchema = z
  .object({
    input_tokens: z.number().optional(),
    output_tokens: z.number().optional(),
    cache_read_input_tokens: z.number().optional(),
    cache_creation_input_tokens: z.number().optional(),
  })
  .passthrough()

export type ClaudeUsage = z.infer<typeof ClaudeUsageSchema>

export const ClaudeMessageSchema = z
  .object({
    type: z.string(),
    subtype: z.string().optional(),
    session_id: z.string().optional(),
    message: z.unknown().optional(),
    usage: ClaudeUsageSchema.optional(),
    total_cost_usd: z.number().optional(),
    is_error: z.boolean().optional(),
    result: z.string().optional(),
  })
  .passthrough()

export type ClaudeMessage = z.infer<typeof ClaudeMessageSchema>

export interface ParseStreamJsonResult {
  messages: ClaudeMessage[]
  unparseable: { line: string; error: string }[]
}

/**
 * 改行区切りの stream-json 文字列を一括パース。
 */
export function parseStreamJsonText(text: string): ParseStreamJsonResult {
  const result: ParseStreamJsonResult = { messages: [], unparseable: [] }
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const parsed = parseStreamJsonLine(line)
    if (parsed.ok) {
      result.messages.push(parsed.message)
    } else {
      result.unparseable.push({ line, error: parsed.error })
    }
  }
  return result
}

export type ParseLineResult =
  | { ok: true; message: ClaudeMessage }
  | { ok: false; error: string }

export function parseStreamJsonLine(line: string): ParseLineResult {
  let raw: unknown
  try {
    raw = JSON.parse(line)
  } catch (err) {
    return { ok: false, error: `JSON parse error: ${(err as Error).message}` }
  }
  const validated = ClaudeMessageSchema.safeParse(raw)
  if (!validated.success) {
    return { ok: false, error: `schema validation failed: ${validated.error.message}` }
  }
  return { ok: true, message: validated.data }
}

/**
 * AsyncIterable<string> (chunk) を AsyncIterable<ClaudeMessage> に変換する。
 * 行境界をまたぐ chunk もバッファリングで対応。
 */
export async function* parseStreamJsonChunks(
  chunks: AsyncIterable<string | Buffer>,
): AsyncGenerator<ClaudeMessage, void, void> {
  let buffer = ''
  for await (const chunk of chunks) {
    buffer += typeof chunk === 'string' ? chunk : chunk.toString('utf-8')
    let nlIdx: number
    while ((nlIdx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nlIdx).trim()
      buffer = buffer.slice(nlIdx + 1)
      if (!line) continue
      const result = parseStreamJsonLine(line)
      if (result.ok) {
        yield result.message
      }
      // unparseable は黙って捨てる (caller 側で合算したい場合は parseStreamJsonText を使う)
    }
  }
  // tail
  const tail = buffer.trim()
  if (tail) {
    const result = parseStreamJsonLine(tail)
    if (result.ok) {
      yield result.message
    }
  }
}

/**
 * usage / cost を message 群から抽出。`result` type のメッセージから取得 (Claude Code 公式仕様)。
 */
export interface ExtractedUsage {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  totalCostUsd: number
}

export function extractUsage(messages: ClaudeMessage[]): ExtractedUsage {
  const out: ExtractedUsage = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    totalCostUsd: 0,
  }
  for (const m of messages) {
    if (m.usage) {
      out.inputTokens += m.usage.input_tokens ?? 0
      out.outputTokens += m.usage.output_tokens ?? 0
      out.cacheReadTokens += m.usage.cache_read_input_tokens ?? 0
      out.cacheWriteTokens += m.usage.cache_creation_input_tokens ?? 0
    }
    if (typeof m.total_cost_usd === 'number') {
      out.totalCostUsd = Math.max(out.totalCostUsd, m.total_cost_usd)
    }
  }
  return out
}
