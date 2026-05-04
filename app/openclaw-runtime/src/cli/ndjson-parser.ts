/**
 * cli/ndjson-parser — Round 12 Dev-C 着地 (W3 → W0 大胆前倒し):
 *   NDJSON (newline-delimited JSON) 抽出を chunk 跨ぎ buffer 対応で実装する純関数 module。
 *
 * 設計方針:
 *   - **pure function**: parseNdjsonLine は 1 行 string -> Result<unknown, string> の純関数。
 *     malformed JSON は throw せず Err 返却 (caller が skip / log を判断)。
 *   - **stream parser (factory)**: createNdjsonStreamParser() は内部 buffer を持つ stateful parser
 *     を生成する factory。chunk を feed() で渡し、改行到達時のみ parse 実行。
 *     不完全行は内部 buffer に保持。flush() で残存 buffer を最終 parse。
 *   - **CRLF 対応**: '\r\n' / '\n' のいずれも改行扱い。trailing '\r' を strip。
 *   - **空行 skip**: 改行のみ / 空白のみの行は parse 対象外 (skipped としてカウントしない)。
 *   - **JSON IF 整合 (DEC-019-007 第 9 種)**: JSON object / array のみを抽出対象とし、primitive
 *     (number / string literal) は noisy stdout の log 行として skip。
 *   - **既存 spawn-claude-code.extractJsonEvents との統合**: extractJsonEvents は本 parser の
 *     stream feed 機能を利用するように再実装可能 (本 file は単独 module、依存無し)。
 *
 * 関連:
 *   - cli/spawn-claude-code.ts (extractJsonEvents 純関数 helper) と互換
 *   - cli/real-child-spawn.ts (実 stdout chunk が来る経路で使用)
 *   - DEC-019-007 (副作用ゼロ要件 / 第 9 種 JSON IF schema)
 */

/**
 * parseNdjsonLine の戻り値型。
 *   ok=true なら value は parse 結果 (unknown)。
 *   ok=false なら error は parse 失敗理由文字列。
 */
export type NdjsonParseResult =
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false; readonly error: string }

/**
 * 1 行 string を NDJSON として parse する純関数。
 *
 * 動作:
 *   - 行頭末尾の whitespace を trim
 *   - trim 後 空 → ok:false, error: 'empty_line'
 *   - 先頭文字が '{' または '[' でない → ok:false, error: 'not_json_object_or_array'
 *     (primitive を弾くことで stdout log 行を区別)
 *   - JSON.parse 成功 → ok:true, value
 *   - JSON.parse 失敗 → ok:false, error: parse error message
 *
 * @param line 1 行文字列 (改行は含まないこと前提、含まれれば trim される)
 */
export function parseNdjsonLine(line: string): NdjsonParseResult {
  const trimmed = line.trim()
  if (trimmed.length === 0) {
    return { ok: false, error: 'empty_line' }
  }
  const first = trimmed[0]
  if (first !== '{' && first !== '[') {
    return { ok: false, error: 'not_json_object_or_array' }
  }
  try {
    const value = JSON.parse(trimmed) as unknown
    return { ok: true, value }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

/**
 * NDJSON stream parser interface。
 */
export interface NdjsonStreamParser {
  /**
   * chunk (任意の string fragment) を feed する。
   * 内部 buffer に追加し、改行が見つかった行のみ parse して返す。
   * 改行未到達の trailing fragment は buffer に残す。
   */
  feed(chunk: string): readonly unknown[]
  /**
   * 残存 buffer を最終 parse して返す。stream 終了時に呼ぶ。
   * flush 後は buffer は空になる。
   */
  flush(): readonly unknown[]
  /**
   * skip された行数 (malformed / not-json-object) の合計。診断用。
   */
  readonly skippedCount: number
  /**
   * parse 成功した行数の合計。診断用。
   */
  readonly parsedCount: number
  /**
   * 内部 buffer の現在の長さ (bytes / chars)。診断用。
   */
  readonly bufferedLength: number
}

/**
 * stream parser 生成 factory。
 *
 * 使用例:
 * ```
 * const parser = createNdjsonStreamParser()
 * const eventsA = parser.feed('{"a":1}\n{"b":')
 * // eventsA = [{a:1}], 後半は buffer 保留
 * const eventsB = parser.feed('2}\n')
 * // eventsB = [{b:2}]
 * const finalEvents = parser.flush()
 * ```
 *
 * @param opts.skipMalformed malformed 行を skip するか (default true)。
 *                            false の場合は throw
 * @param opts.maxBufferLength 単一未完行 buffer の最大長 (default 1MB)。
 *                              超過時は forced truncate + skip
 */
export function createNdjsonStreamParser(
  opts: {
    skipMalformed?: boolean
    maxBufferLength?: number
  } = {},
): NdjsonStreamParser {
  const skipMalformed = opts.skipMalformed ?? true
  const maxBufferLength = opts.maxBufferLength ?? 1_048_576 // 1 MB

  let buffer = ''
  let parsedCount = 0
  let skippedCount = 0

  function processBufferedLines(): unknown[] {
    const out: unknown[] = []
    let newlineIdx = buffer.indexOf('\n')
    while (newlineIdx !== -1) {
      let line = buffer.slice(0, newlineIdx)
      // strip trailing CR (CRLF 対応)
      if (line.endsWith('\r')) {
        line = line.slice(0, -1)
      }
      buffer = buffer.slice(newlineIdx + 1)
      const result = parseNdjsonLine(line)
      if (result.ok) {
        out.push(result.value)
        parsedCount++
      } else if (result.error === 'empty_line') {
        // 空行は skip 対象だが skippedCount にも数えない (純 noise)
      } else {
        skippedCount++
        if (!skipMalformed) {
          throw new Error(
            `ndjson-parser: malformed line (error=${result.error}): ${line}`,
          )
        }
      }
      newlineIdx = buffer.indexOf('\n')
    }
    return out
  }

  return {
    feed(chunk: string): readonly unknown[] {
      buffer += chunk
      // 単一行 buffer が暴走している場合の保護: 改行が無いまま maxBufferLength 超 → 切捨て
      if (buffer.length > maxBufferLength && buffer.indexOf('\n') === -1) {
        skippedCount++
        buffer = ''
        if (!skipMalformed) {
          throw new Error(
            `ndjson-parser: line buffer exceeded ${maxBufferLength} chars without newline`,
          )
        }
        return Object.freeze([])
      }
      const out = processBufferedLines()
      return Object.freeze(out)
    },
    flush(): readonly unknown[] {
      const out: unknown[] = []
      if (buffer.length === 0) return Object.freeze(out)
      // 残 buffer に改行を補完して再処理
      let line = buffer
      buffer = ''
      if (line.endsWith('\r')) {
        line = line.slice(0, -1)
      }
      const result = parseNdjsonLine(line)
      if (result.ok) {
        out.push(result.value)
        parsedCount++
      } else if (result.error === 'empty_line') {
        // skip
      } else {
        skippedCount++
        if (!skipMalformed) {
          throw new Error(
            `ndjson-parser: malformed line on flush (error=${result.error}): ${line}`,
          )
        }
      }
      return Object.freeze(out)
    },
    get skippedCount() {
      return skippedCount
    },
    get parsedCount() {
      return parsedCount
    },
    get bufferedLength() {
      return buffer.length
    },
  }
}

/**
 * extractJsonEvents の stream 対応版。
 *
 * 既存 spawn-claude-code.ts の extractJsonEvents は array of complete lines を受ける同期版だが、
 * 本関数は chunk 配列を受け、内部で stream parser を介して chunk 跨ぎ buffer を処理する。
 *
 * @param chunks string fragment の配列 (任意分割)
 * @returns parse 成功した event 配列 (Object.freeze 済)
 */
export function extractJsonEventsFromChunks(
  chunks: readonly string[],
): readonly unknown[] {
  const parser = createNdjsonStreamParser()
  const out: unknown[] = []
  for (const chunk of chunks) {
    out.push(...parser.feed(chunk))
  }
  out.push(...parser.flush())
  return Object.freeze(out)
}

/**
 * 完全行 (newline-split 済) の配列を NDJSON parse する純関数 helper。
 *
 * spawn-claude-code.extractJsonEvents の差し替え互換実装。chunk 跨ぎは扱わず、
 * caller が既に line 単位に分割している前提。
 *
 * @param lines 完全行の配列
 * @returns parse 成功 event 配列
 */
export function extractJsonEventsFromLines(
  lines: readonly string[],
): readonly unknown[] {
  const out: unknown[] = []
  for (const line of lines) {
    const result = parseNdjsonLine(line)
    if (result.ok) {
      out.push(result.value)
    }
  }
  return Object.freeze(out)
}

// ============================================================================
// Round 13 Dev-C 拡張 (Task B): back-pressure 対応
//
// 既存の createNdjsonStreamParser は 1MB 上限到達時に forced truncate するのみで、
// downstream consumer (例: openclaw-monitor / kill-switch) が遅延した際に upstream
// (real-child-spawn の stdout chunk) を停止させる経路がない。
//
// 本拡張では:
//   - BackPressureError class (throw 経路)
//   - createBackPressureNdjsonParser factory: AbortSignal + pause/resume + DI 選択
//     (throw or event emission) の back-pressure 対応 stream parser
//   - async iterator API (for await...of で chunk を pull-based 消費可能)
//
// 既存 createNdjsonStreamParser は 1 byte も改変せず、本拡張は append-only。
// ============================================================================

/**
 * back-pressure 上限超過を表す Error。
 *   throw mode で createBackPressureNdjsonParser が利用。
 */
export class BackPressureError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'queue_overflow'
      | 'buffer_overflow'
      | 'aborted'
      | 'paused_overflow',
    readonly meta: Readonly<Record<string, unknown>> = {},
  ) {
    super(message)
    this.name = 'BackPressureError'
  }
}

/**
 * back-pressure イベント名。
 *   - 'pause'     : 上限到達で upstream に pause を要求
 *   - 'resume'    : queue が drain されて upstream に resume を許可
 *   - 'overflow'  : 上限超過 (event emission mode 時)
 *   - 'abort'     : AbortSignal が発火
 *   - 'drain'     : queue が完全に空になった
 */
export type BackPressureEvent =
  | 'pause'
  | 'resume'
  | 'overflow'
  | 'abort'
  | 'drain'

/**
 * back-pressure DI mode。
 *   - 'throw' : 上限超過時に BackPressureError を throw
 *   - 'event' : 上限超過時に listener を発火 (caller が pause / drain を判断)
 */
export type BackPressureMode = 'throw' | 'event'

/**
 * back-pressure listener 契約。
 */
export type BackPressureListener = (
  ev: BackPressureEvent,
  meta: Readonly<Record<string, unknown>>,
) => void

/**
 * back-pressure 対応 NDJSON stream parser interface。
 */
export interface BackPressureNdjsonParser {
  /** chunk feed (paused 時は queue 拒否 / mode に応じて throw/emit)。 */
  feed(chunk: string): readonly unknown[]
  /** 残存 buffer flush。 */
  flush(): readonly unknown[]
  /** queue から pull (back-pressure consumer 用)。 */
  pull(): unknown | undefined
  /** queue 上限を一時的に上書き。 */
  setMaxQueueSize(n: number): void
  /** pause/resume API (downstream consumer が呼び出す)。 */
  pause(): void
  resume(): void
  isPaused(): boolean
  /** AbortSignal 連携 (signal 発火で feed 拒否、queue clear)。 */
  readonly abortSignal: AbortSignal | null
  isAborted(): boolean
  /** 統計。 */
  readonly parsedCount: number
  readonly skippedCount: number
  readonly bufferedLength: number
  readonly queuedCount: number
  readonly droppedCount: number
  /** event listener 登録。 */
  onBackPressure(listener: BackPressureListener): () => void
  /**
   * async iterator API: for await の loop で消費可能。
   *   - queue が空 + paused なら microtask で resolve 待機
   *   - aborted で iterator 終了
   */
  iterator(): AsyncIterator<unknown>
}

/**
 * back-pressure 対応 NDJSON stream parser factory。
 *
 * @param opts.maxQueueSize  queue 上限 (default 1000 events)
 * @param opts.mode          'throw' | 'event' (default 'event')
 * @param opts.maxBufferLength 単一未完行 buffer 上限 (default 1MB)
 * @param opts.skipMalformed   malformed skip (default true)
 * @param opts.abortSignal     external AbortSignal (caller cancel 経路)
 * @param opts.highWaterMark   pause 発火閾値 (queue 比率、default 0.8 = 80%)
 * @param opts.lowWaterMark    resume 発火閾値 (default 0.4 = 40%)
 */
export function createBackPressureNdjsonParser(
  opts: {
    maxQueueSize?: number
    mode?: BackPressureMode
    maxBufferLength?: number
    skipMalformed?: boolean
    abortSignal?: AbortSignal | null
    highWaterMark?: number
    lowWaterMark?: number
  } = {},
): BackPressureNdjsonParser {
  let maxQueueSize = opts.maxQueueSize ?? 1000
  const mode: BackPressureMode = opts.mode ?? 'event'
  const maxBufferLength = opts.maxBufferLength ?? 1_048_576
  const skipMalformed = opts.skipMalformed ?? true
  const abortSignal = opts.abortSignal ?? null
  const highWaterMark = opts.highWaterMark ?? 0.8
  const lowWaterMark = opts.lowWaterMark ?? 0.4

  const queue: unknown[] = []
  let buffer = ''
  let parsedCount = 0
  let skippedCount = 0
  let droppedCount = 0
  let paused = false
  let aborted = false

  const listeners: BackPressureListener[] = []
  // async iterator pump 用 promise resolver chain
  let pumpResolve: ((v: IteratorResult<unknown>) => void) | null = null

  const fireEvent = (
    ev: BackPressureEvent,
    meta: Record<string, unknown> = {},
  ): void => {
    const frozen = Object.freeze({ ...meta })
    for (const l of listeners) {
      try {
        l(ev, frozen)
      } catch {
        // listener throw は無視 (本 parser の責務外)
      }
    }
  }

  if (abortSignal) {
    if (abortSignal.aborted) {
      aborted = true
    } else {
      abortSignal.addEventListener(
        'abort',
        () => {
          aborted = true
          queue.length = 0
          fireEvent('abort', { reason: 'external_signal' })
          // pump resolver があれば終了通知
          if (pumpResolve) {
            const r = pumpResolve
            pumpResolve = null
            r({ value: undefined, done: true })
          }
        },
        { once: true },
      )
    }
  }

  const checkBackPressure = (): void => {
    const ratio = queue.length / maxQueueSize
    if (!paused && ratio >= highWaterMark) {
      paused = true
      fireEvent('pause', { queuedCount: queue.length, ratio })
    } else if (paused && ratio <= lowWaterMark) {
      paused = false
      fireEvent('resume', { queuedCount: queue.length, ratio })
    }
  }

  const enqueue = (value: unknown): boolean => {
    if (aborted) return false
    if (queue.length >= maxQueueSize) {
      droppedCount++
      const meta = { queuedCount: queue.length, droppedCount, maxQueueSize }
      fireEvent('overflow', meta)
      if (mode === 'throw') {
        throw new BackPressureError(
          `ndjson back-pressure: queue overflow (size=${queue.length}/max=${maxQueueSize})`,
          'queue_overflow',
          meta,
        )
      }
      return false
    }
    queue.push(value)
    // pump resolver が waiting なら即解決
    if (pumpResolve) {
      const r = pumpResolve
      pumpResolve = null
      r({ value: queue.shift(), done: false })
    }
    checkBackPressure()
    return true
  }

  const processBufferedLines = (): unknown[] => {
    const accepted: unknown[] = []
    let newlineIdx = buffer.indexOf('\n')
    while (newlineIdx !== -1 && !aborted) {
      let line = buffer.slice(0, newlineIdx)
      if (line.endsWith('\r')) line = line.slice(0, -1)
      buffer = buffer.slice(newlineIdx + 1)
      const result = parseNdjsonLine(line)
      if (result.ok) {
        const ok = enqueue(result.value)
        if (ok) {
          accepted.push(result.value)
          parsedCount++
        }
      } else if (result.error === 'empty_line') {
        // skip
      } else {
        skippedCount++
        if (!skipMalformed) {
          throw new Error(
            `ndjson-parser (bp): malformed line (error=${result.error}): ${line}`,
          )
        }
      }
      newlineIdx = buffer.indexOf('\n')
    }
    return accepted
  }

  return {
    feed(chunk: string): readonly unknown[] {
      if (aborted) {
        if (mode === 'throw') {
          throw new BackPressureError(
            'ndjson back-pressure: feed after abort',
            'aborted',
          )
        }
        return Object.freeze([])
      }
      if (paused) {
        // paused 中は buffer 追加すら拒否 (upstream pause 確証)
        const meta = { reason: 'paused', chunkLength: chunk.length }
        fireEvent('overflow', meta)
        if (mode === 'throw') {
          throw new BackPressureError(
            'ndjson back-pressure: feed while paused',
            'paused_overflow',
            meta,
          )
        }
        return Object.freeze([])
      }
      buffer += chunk
      if (
        buffer.length > maxBufferLength &&
        buffer.indexOf('\n') === -1
      ) {
        skippedCount++
        const meta = { bufferLength: buffer.length, maxBufferLength }
        buffer = ''
        if (!skipMalformed) {
          throw new BackPressureError(
            `ndjson back-pressure: line buffer exceeded ${maxBufferLength} chars`,
            'buffer_overflow',
            meta,
          )
        }
        fireEvent('overflow', meta)
        return Object.freeze([])
      }
      const out = processBufferedLines()
      return Object.freeze(out)
    },
    flush(): readonly unknown[] {
      const out: unknown[] = []
      if (buffer.length === 0 || aborted) return Object.freeze(out)
      let line = buffer
      buffer = ''
      if (line.endsWith('\r')) line = line.slice(0, -1)
      const result = parseNdjsonLine(line)
      if (result.ok) {
        const ok = enqueue(result.value)
        if (ok) {
          out.push(result.value)
          parsedCount++
        }
      } else if (result.error !== 'empty_line') {
        skippedCount++
        if (!skipMalformed) {
          throw new Error(
            `ndjson-parser (bp): malformed line on flush (error=${result.error}): ${line}`,
          )
        }
      }
      return Object.freeze(out)
    },
    pull(): unknown | undefined {
      const v = queue.shift()
      if (queue.length === 0) {
        fireEvent('drain', {})
      }
      checkBackPressure()
      return v
    },
    setMaxQueueSize(n: number): void {
      if (!Number.isFinite(n) || n <= 0) {
        throw new Error(
          `ndjson back-pressure: maxQueueSize must be positive, got ${n}`,
        )
      }
      maxQueueSize = Math.floor(n)
      checkBackPressure()
    },
    pause(): void {
      if (!paused) {
        paused = true
        fireEvent('pause', { reason: 'manual' })
      }
    },
    resume(): void {
      if (paused) {
        paused = false
        fireEvent('resume', { reason: 'manual' })
      }
    },
    isPaused(): boolean {
      return paused
    },
    abortSignal,
    isAborted(): boolean {
      return aborted
    },
    get parsedCount() {
      return parsedCount
    },
    get skippedCount() {
      return skippedCount
    },
    get bufferedLength() {
      return buffer.length
    },
    get queuedCount() {
      return queue.length
    },
    get droppedCount() {
      return droppedCount
    },
    onBackPressure(listener: BackPressureListener): () => void {
      listeners.push(listener)
      return () => {
        const idx = listeners.indexOf(listener)
        if (idx >= 0) listeners.splice(idx, 1)
      }
    },
    iterator(): AsyncIterator<unknown> {
      return {
        next: (): Promise<IteratorResult<unknown>> => {
          if (aborted) {
            return Promise.resolve({ value: undefined, done: true })
          }
          if (queue.length > 0) {
            const v = queue.shift()
            checkBackPressure()
            if (queue.length === 0) fireEvent('drain', {})
            return Promise.resolve({ value: v, done: false })
          }
          // 未来 chunk 待ち
          return new Promise<IteratorResult<unknown>>((resolve) => {
            pumpResolve = resolve
          })
        },
        return: (): Promise<IteratorResult<unknown>> => {
          aborted = true
          queue.length = 0
          if (pumpResolve) {
            const r = pumpResolve
            pumpResolve = null
            r({ value: undefined, done: true })
          }
          return Promise.resolve({ value: undefined, done: true })
        },
      }
    },
  }
}
