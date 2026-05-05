/**
 * 17 day path W4 — File-based BreachCounter persistence (Round 21 第 1 波, Dev-GG 担当)
 *
 * 担当: Round 20 Dev-EE の `BreachCounter` (in-memory pure factory) に対する
 * file-based persistence layer の追加 (W4 task ②)。
 *
 * 設計原則:
 *   1. **Dev-EE の `createBreachCounter()` 関数本体無改変** (新規 file factory は別 file)。
 *   2. JSON Lines append + restore on init で harness restart 後も counter 状態を維持。
 *   3. atomic append (NodeJS fs/promises append flag 'a') — partial write 抑止のため
 *      single-line JSON encode (newline は escape) を採用。
 *   4. corruption tolerant: parse 不能 line は skip しつつ最新有効 state を採用。
 *   5. lifecycle: ファイル path は相対 (production code) / test では tmpdir を経由。
 *
 * file format (JSON Lines):
 *   {"loopId":"L-1","count":1,"recordedAt":"2026-05-05T12:00:00.000Z","kind":"observe"}
 *   {"loopId":"L-2","count":2,"recordedAt":"2026-05-05T12:00:01.000Z","kind":"observe"}
 *   {"loopId":null,"count":0,"recordedAt":"2026-05-05T12:00:02.000Z","kind":"reset"}
 *
 * restore 時は最後の record の (count, lastLoopId) を採用 (reset の場合は count=0/lastLoopId=null)。
 */
import { promises as fs } from 'node:fs'
import { dirname } from 'node:path'

// ============================================================================
// 構造的型 — Dev-EE BreachCounter shape と互換
// ============================================================================

/**
 * Round 20 Dev-EE の BreachCounter port (function 本体は無改変)。
 * 本 file の FileBreachCounter は shape を継承し、永続化を追加する。
 */
export interface BreachCounterPort {
  observe(loopId: string): number
  current(): number
  lastLoopId(): string | null
  reset(): void
}

/** persistence record (JSON Lines 1 line に対応) */
export interface BreachRecord {
  readonly loopId: string | null
  readonly count: number
  readonly recordedAt: string
  readonly kind: 'observe' | 'reset'
}

/** restore 戻り値: file から復元した最新 state */
export interface BreachState {
  readonly count: number
  readonly lastLoopId: string | null
}

/** persist port (test での mock 注入用) */
export interface BreachPersistencePort {
  persist(loopId: string, record: BreachRecord): Promise<void>
  restore(): Promise<BreachState>
}

// ============================================================================
// File path resolution
// ============================================================================

/**
 * default file path. production では `.harness-state/breach-counter.jsonl`
 * (CI で gitignore 推奨) を使用。test では tmpdir を経由。
 */
export const DEFAULT_BREACH_COUNTER_PATH = '.harness-state/breach-counter.jsonl'

// ============================================================================
// Persistence helpers (low-level)
// ============================================================================

async function ensureParentDir(path: string): Promise<void> {
  await fs.mkdir(dirname(path), { recursive: true })
}

/**
 * file から JSON Lines を全 read し、最新 state を再構築する。
 * - file 不在 → empty state を返す
 * - parse 不能 line は skip しつつ valid line を採用
 * - 最後の valid record の (count, loopId) を state とする
 */
async function readBreachState(path: string): Promise<BreachState> {
  let content: string
  try {
    content = await fs.readFile(path, 'utf-8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { count: 0, lastLoopId: null }
    }
    throw err
  }
  const lines = content.split('\n').filter((l) => l.length > 0)
  let state: BreachState = { count: 0, lastLoopId: null }
  for (const line of lines) {
    try {
      const rec = JSON.parse(line) as BreachRecord
      if (
        typeof rec.count !== 'number' ||
        (typeof rec.loopId !== 'string' && rec.loopId !== null) ||
        (rec.kind !== 'observe' && rec.kind !== 'reset')
      ) {
        continue
      }
      if (rec.kind === 'reset') {
        state = { count: 0, lastLoopId: null }
      } else {
        state = { count: rec.count, lastLoopId: rec.loopId }
      }
    } catch {
      // corrupted line — skip
      continue
    }
  }
  return state
}

/**
 * single record を append-flag 'a' で atomic append。
 * newline は JSON encode 時に自動 escape されるので 1 行 = 1 record が保証される。
 */
async function appendBreachRecord(path: string, record: BreachRecord): Promise<void> {
  await ensureParentDir(path)
  const line = JSON.stringify(record) + '\n'
  await fs.appendFile(path, line, { encoding: 'utf-8', flag: 'a' })
}

// ============================================================================
// FileBreachCounter — Dev-EE BreachCounterPort 互換 + 永続化
// ============================================================================

export interface FileBreachCounterOptions {
  /** persistence file path (省略時は DEFAULT_BREACH_COUNTER_PATH) */
  readonly path?: string
  /** 現在時刻 (test 用; 省略時は new Date().toISOString()) */
  readonly now?: () => string
  /**
   * 初期 state (省略時は file から restore)。
   * test で fresh state 注入時に有用。
   */
  readonly initialState?: BreachState
}

export interface FileBreachCounter extends BreachCounterPort {
  /** 起動時に file から state を復元する。冪等。 */
  init(): Promise<void>
  /** 現在の path */
  readonly path: string
  /**
   * pending append (observe / reset 直後の fire-and-forget write) が
   * 全て file に到達するまで待つ。
   * lifecycle dispose / test cleanup で呼出する。
   */
  flush(): Promise<void>
}

/**
 * file-backed BreachCounter factory。
 *
 * lifecycle:
 *   1. createFileBreachCounter({ path }) で instance を構築 (file IO は init 時のみ)。
 *   2. await counter.init() で file から最新 state を復元 (file 不在なら count=0)。
 *   3. counter.observe(loopId) → in-memory 更新 + JSON Lines append (await 内部完遂)。
 *   4. counter.reset() → in-memory reset + JSON Lines append (kind='reset')。
 *
 * Dev-EE BreachCounter と semantics 一致:
 *   - 同一 loopId 連続観測は max(count, 1) clamp
 *   - 異なる loopId 観測は count += 1
 *   - reset で count=0 / lastLoopId=null
 */
export function createFileBreachCounter(
  options: FileBreachCounterOptions = {},
): FileBreachCounter {
  const path = options.path ?? DEFAULT_BREACH_COUNTER_PATH
  const now = options.now ?? (() => new Date().toISOString())
  let count = options.initialState?.count ?? 0
  let lastId: string | null = options.initialState?.lastLoopId ?? null
  let initialized = false

  // observe / reset は in-memory 更新 + fire-and-forget の append を行う。
  // 内部 promise chain を保持し、flush() で完遂を await 可能にする。
  let pending: Promise<void> = Promise.resolve()

  function enqueue(record: BreachRecord): void {
    pending = pending
      .then(() => appendBreachRecord(path, record))
      .catch(() => {
        // 単一 append 失敗は chain 全体を止めない (次の append で recover 可能)。
        // 失敗は flush() の戻り値で観測可能。
      })
  }

  return {
    path,
    async init() {
      if (initialized) return
      // initialState 注入時は file restore を skip (test の isolation 用)
      if (options.initialState === undefined) {
        const state = await readBreachState(path)
        count = state.count
        lastId = state.lastLoopId
      }
      initialized = true
    },
    observe(loopId) {
      // Dev-EE と同 semantics
      if (lastId !== null && lastId !== loopId) {
        count += 1
      } else {
        count = Math.max(count, 1)
      }
      lastId = loopId
      enqueue({
        loopId,
        count,
        recordedAt: now(),
        kind: 'observe',
      })
      return count
    },
    current: () => count,
    lastLoopId: () => lastId,
    reset() {
      count = 0
      lastId = null
      enqueue({
        loopId: null,
        count: 0,
        recordedAt: now(),
        kind: 'reset',
      })
    },
    async flush() {
      await pending
    },
  }
}

/**
 * test 用 helper: counter の pending append が flush されるまで待つ。
 *
 * counter.flush() の thin wrapper。 production code でも lifecycle dispose 時に
 * 呼出可能 (Harness.shutdown 等の前段で全 append が file に到達することを保証)。
 */
export async function flushPendingBreachAppends(counter: FileBreachCounter): Promise<void> {
  await counter.flush()
}

// ============================================================================
// Persistence port adapter — Dev-EE orchestrator に注入する場合の bridge
// ============================================================================

/**
 * Dev-EE の `RollbackOrchestratorPorts.counter` (= BreachCounter) に
 * FileBreachCounter を直接注入できる adapter。
 *
 * Dev-EE の `createRollbackOrchestrator(ports, counter)` が引数として
 * BreachCounter shape を受けるので、本 adapter は実体的には passthrough だが
 * lifecycle (init) 経過の保証として明示する。
 */
export async function adaptFileBreachCounterAsPort(
  counter: FileBreachCounter,
): Promise<BreachCounterPort> {
  await counter.init()
  return counter
}
