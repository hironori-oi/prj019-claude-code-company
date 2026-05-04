/**
 * dispatcher — Round 9 案 9-A1 前倒し (CB-D-W3-03):
 *   Open Claw → CEO 構造化 JSON IF の dispatch 関数。
 *
 * 設計方針:
 *   - **純関数 + DI**: sinks (audit log + HITL gate enforcer + Slack notifier 等) を
 *     injectable に。`TimeSource` も注入で副作用ゼロ。
 *   - **retry policy**: 最大 3 回 + exponential backoff (100ms / 200ms / 400ms)。
 *     失敗 sink は記録するが他 sink は継続 (best-effort fan-out)。
 *   - **schema 検証**: dispatch 前に zod 検証。invalid → DispatchResult.status='invalid'。
 *   - HITL 第 9 種接続: messageType='needs_proposal' 受信時は HitlGateSink 経由で
 *     既存 `hitl-kickoff-gate.ts` に橋渡しする想定 (本 dispatcher は sink 抽象のみ提供)。
 *
 * 関連:
 *   - DEC-019-033 ② (HITL 第 9 種、SLA 72h、cost rollback)
 *   - DEC-019-006 P-D 改 (subprocess spawn / 副作用ゼロ)
 *   - CB-D-W3-03 (Open Claw → CEO 構造化 JSON IF)
 */
import {
  OpenclawToCeoMessageSchema,
  type OpenclawToCeoMessage,
  type OpenclawToCeoMessageType,
} from './openclaw-to-ceo.schema.js'

/** dispatch sink の戻り値。 */
export interface SinkAck {
  /** 配送成否 */
  ok: boolean
  /** ack metadata (audit ID / Slack thread ts 等) */
  meta?: Record<string, unknown>
}

/**
 * dispatch sink contract。
 *
 * 各 sink は同じ message を受け、それぞれの永続化 / 通知を担当する:
 *   - auditLog sink: append-only audit log に記録
 *   - hitlGate sink: messageType='needs_proposal' → HITL 第 9 種 evaluate
 *   - slackNotify sink: Slack channel に通知 post
 *   - dashboard sink: SSE event を Dashboard に push
 */
export interface DispatchSink {
  /** sink name (logging / telemetry 用) */
  readonly name: string
  /** 該当 message を処理。throw でも retry 対象だが、ok:false 戻りでも retry 可。 */
  deliver(message: OpenclawToCeoMessage): Promise<SinkAck>
}

/**
 * sinks 集合 (DI、deterministic な fan-out 用に固定順列)。
 */
export interface DispatchSinks {
  readonly auditLog?: DispatchSink
  readonly hitlGate?: DispatchSink
  readonly slackNotify?: DispatchSink
  readonly dashboard?: DispatchSink
  /** 他 task / 拡張用、複数許容 (Slack #monitor / #ops 等の二重通知) */
  readonly extras?: readonly DispatchSink[]
}

/** TimeSource - retry の sleep 注入用 (テスト容易性 / FakeTimeSource 利用想定) */
export interface DispatcherTimeSource {
  sleep(ms: number): Promise<void>
}

/** 既定 sleep (Real time) */
export const realDispatcherTimeSource: DispatcherTimeSource = {
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
}

export interface DispatchOptions {
  /** retry 上限 (default 3) */
  maxRetries?: number
  /** retry の初期 backoff ms (default 100) */
  initialBackoffMs?: number
  /** TimeSource 注入 (default = realDispatcherTimeSource) */
  timeSource?: DispatcherTimeSource
  /** logger 注入 (default 無効化) */
  logger?: { warn: (msg: string) => void; error: (msg: string) => void }
}

/** 個別 sink の dispatch outcome */
export interface SinkDispatchOutcome {
  sinkName: string
  ok: boolean
  attempts: number
  ackMeta?: Record<string, unknown>
  errorMessage?: string
}

export type DispatchStatus =
  | 'invalid' // schema 検証失敗
  | 'all_succeeded' // 全 sink 成功
  | 'partial_failure' // 一部 sink 失敗
  | 'all_failed' // 全 sink 失敗
  | 'no_sinks' // sinks 未注入

export interface DispatchResult {
  status: DispatchStatus
  /** message が schema 通過した場合の type (failure 時 undefined) */
  messageType?: OpenclawToCeoMessageType
  /** schema 検証エラー (invalid 時のみ) */
  schemaErrors?: string[]
  /** 個別 sink の outcome (順序固定) */
  sinkOutcomes: readonly SinkDispatchOutcome[]
  /** 完了時刻 ISO8601 */
  completedAt: string
}

/**
 * Open Claw → CEO に message を fan-out する純関数。
 *
 * 処理順:
 *   1. schema 検証 (zod) - invalid → 'invalid' 即時 return
 *   2. sinks 列挙 - sinks 未注入 → 'no_sinks' 即時 return
 *   3. 各 sink を deterministic 順 (auditLog → hitlGate → slackNotify → dashboard → extras)
 *      で順次 deliver。失敗時は exponential backoff で最大 maxRetries 回リトライ。
 *   4. 全 outcome を集約し DispatchResult 返却。
 *
 * 注意:
 *   - sink throw は retry 対象 (catch して再実行)。
 *   - sink ok:false 戻りも retry 対象。
 *   - 失敗 sink は他 sink の継続を妨げない (best-effort fan-out)。
 *   - retry の backoff sleep は TimeSource 注入で fake 化可能 (FakeTimeSource 互換)。
 */
export async function dispatchToCeo(
  message: unknown,
  sinks: DispatchSinks,
  opts: DispatchOptions = {},
): Promise<DispatchResult> {
  const maxRetries = opts.maxRetries ?? 3
  const initialBackoffMs = opts.initialBackoffMs ?? 100
  const timeSource = opts.timeSource ?? realDispatcherTimeSource
  const logger = opts.logger ?? {
    warn: () => undefined,
    error: () => undefined,
  }

  // 1. schema 検証
  const parsed = OpenclawToCeoMessageSchema.safeParse(message)
  if (!parsed.success) {
    const errors = parsed.error.issues.map(
      (i) => `${i.path.join('.') || '<root>'}: ${i.message}`,
    )
    return {
      status: 'invalid',
      schemaErrors: errors,
      sinkOutcomes: Object.freeze([]),
      completedAt: new Date().toISOString(),
    }
  }
  const validMessage = parsed.data

  // 2. sinks 列挙 (順序固定)
  const sinkList = collectSinks(sinks)
  if (sinkList.length === 0) {
    return {
      status: 'no_sinks',
      messageType: validMessage.messageType,
      sinkOutcomes: Object.freeze([]),
      completedAt: new Date().toISOString(),
    }
  }

  // 3. 各 sink を順次 deliver (retry 含む)
  const outcomes: SinkDispatchOutcome[] = []
  for (const sink of sinkList) {
    const outcome = await deliverWithRetry(
      sink,
      validMessage,
      maxRetries,
      initialBackoffMs,
      timeSource,
      logger,
    )
    outcomes.push(outcome)
  }

  // 4. 集約
  const successCount = outcomes.filter((o) => o.ok).length
  const status: DispatchStatus =
    successCount === outcomes.length
      ? 'all_succeeded'
      : successCount === 0
        ? 'all_failed'
        : 'partial_failure'

  return {
    status,
    messageType: validMessage.messageType,
    sinkOutcomes: Object.freeze(outcomes),
    completedAt: new Date().toISOString(),
  }
}

/** sinks の deterministic 列挙 (順序: auditLog → hitlGate → slackNotify → dashboard → extras)。 */
function collectSinks(sinks: DispatchSinks): readonly DispatchSink[] {
  const out: DispatchSink[] = []
  if (sinks.auditLog) out.push(sinks.auditLog)
  if (sinks.hitlGate) out.push(sinks.hitlGate)
  if (sinks.slackNotify) out.push(sinks.slackNotify)
  if (sinks.dashboard) out.push(sinks.dashboard)
  if (sinks.extras) {
    for (const e of sinks.extras) out.push(e)
  }
  return out
}

/** 単一 sink を retry policy 付きで deliver。 */
async function deliverWithRetry(
  sink: DispatchSink,
  message: OpenclawToCeoMessage,
  maxRetries: number,
  initialBackoffMs: number,
  timeSource: DispatcherTimeSource,
  logger: NonNullable<DispatchOptions['logger']>,
): Promise<SinkDispatchOutcome> {
  let attempts = 0
  let lastError: string | undefined
  let lastMeta: Record<string, unknown> | undefined

  while (attempts < maxRetries) {
    attempts += 1
    try {
      const ack = await sink.deliver(message)
      if (ack.ok) {
        return {
          sinkName: sink.name,
          ok: true,
          attempts,
          ...(ack.meta !== undefined && { ackMeta: ack.meta }),
        }
      }
      lastError = `sink returned ok:false`
      lastMeta = ack.meta
    } catch (err) {
      lastError = (err as Error).message
      logger.warn(
        `[dispatcher] sink ${sink.name} attempt ${attempts}/${maxRetries} threw: ${lastError}`,
      )
    }

    if (attempts < maxRetries) {
      const backoff = initialBackoffMs * Math.pow(2, attempts - 1)
      await timeSource.sleep(backoff)
    }
  }

  logger.error(
    `[dispatcher] sink ${sink.name} exhausted ${maxRetries} retries; last error: ${lastError ?? '<unknown>'}`,
  )
  const out: SinkDispatchOutcome = {
    sinkName: sink.name,
    ok: false,
    attempts,
    ...(lastError !== undefined && { errorMessage: lastError }),
    ...(lastMeta !== undefined && { ackMeta: lastMeta }),
  }
  return out
}
