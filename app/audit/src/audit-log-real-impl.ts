/**
 * audit-log-real-impl — Round 14 Dev-F (緊急対応): G-09 audit log mock 依存解消.
 *
 * 関連必須コントロール:
 *   G-09 (HITL gate enforcement の audit 連携 / 全件保存)
 *   G-10 (90 日 retention + SHA-256 hash chain)
 *
 * 起源:
 *   - Review-E R13 指摘 「Round 7-A G-09 audit log mock 依存解消未完遂」
 *   - drill-2 abort risk 38% の主因の 1 つ (mock-audit から real-audit への切替 layer 欠落)
 *   - 5/5 朝 06:00 採決時間制約厳守
 *
 * 設計方針:
 *   - 既存 FileAuditLogStore.append との完全整合 (interface AuditLogStore を再利用).
 *   - mock 実装と real 実装を切替可能にする factory layer + adapter.
 *   - dry-run / drill / production 3 mode を識別子で明示.
 *   - 切替操作は idempotent + audit に observable (which mode is active を query 可能).
 *   - hash chain は real 化後も継続 (mock → real 切替時に prevHash を引き継ぐ).
 *
 * 提供 API:
 *   - createAuditImpl(options): mode に応じた AuditLogStore を返す factory.
 *   - InMemoryMockAuditLogStore: 既存 mock 互換の in-memory 実装 (test / dry-run 用).
 *   - RealAuditLogAdapter: FileAuditLogStore を wrap して real-impl 切替を可視化.
 *   - bridgeMockToReal: mock の在 entries を real ストアへ migration する純関数.
 *
 * Drill #2 用途:
 *   - 5/8 朝 (or 5/7 朝前倒し) の audit_log_replay シナリオ (D1-S3 / drill-2 S-9) で
 *     mock → real 切替を physical に検証可能に.
 *   - createAuditImpl({ mode: 'drill', filePath, ... }) で drill mode を発火.
 *   - mock impl と real impl で同じ AuditLogStore interface を提供するため caller 透過.
 */
import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  FileAuditLogStore,
  computeHash,
  AuditLogStoreError,
  type AuditEvent,
  type AuditLogStore,
  type AuditEventInput,
  type AuditAppendResult,
  type AuditQuery,
  type AuditVerifyResult,
  type AuditEventType,
  type AuditEventSource,
  type FileAuditLogStoreOptions,
  type PidGuard,
} from './audit-store.js'

// ============================================================================
// mode 定義
// ============================================================================

export type AuditImplMode = 'mock' | 'real' | 'drill'

export interface AuditImplDescriptor {
  readonly mode: AuditImplMode
  readonly filePath: string | null
  readonly readOnly: boolean
  /** mock → real bridge の進捗 (0..1). drill mode のみ意味を持つ. */
  readonly bridgeProgress: number
}

// ============================================================================
// InMemoryMockAuditLogStore — 既存 mock 互換 (test / dry-run 用)
// ============================================================================

export interface InMemoryMockAuditLogStoreOptions {
  /** 注入用 (テスト) */
  now?: () => Date
  /** 初期化時の seed entries (drill 復元 testing 用). */
  seed?: readonly AuditEvent[]
  /** PidGuard (オプション). pid mismatch 時に AuditLogStoreError throw. */
  pidGuard?: PidGuard
  pidProvider?: () => number
}

/**
 * in-memory mock 実装. AuditLogStore interface を完全実装し、
 * FileAuditLogStore と切替可能.
 *
 * 動作:
 *   - hash chain は computeHash で real と同じ算出.
 *   - rotation は no-op (in-memory 上は保持期間制限なし).
 *   - verifyHashChain は real と同等の判定.
 */
export class InMemoryMockAuditLogStore implements AuditLogStore {
  private readonly events: AuditEvent[] = []
  private readonly now: () => Date
  private readonly pidGuard: PidGuard | undefined
  private readonly pidProvider: () => number
  private lastHash = ''

  constructor(opts: InMemoryMockAuditLogStoreOptions = {}) {
    this.now = opts.now ?? (() => new Date())
    this.pidGuard = opts.pidGuard
    this.pidProvider =
      opts.pidProvider ??
      (() =>
        typeof process !== 'undefined' && typeof process.pid === 'number'
          ? process.pid
          : 0)
    if (opts.seed) {
      for (const e of opts.seed) {
        this.events.push(e)
        this.lastHash = e.hash
      }
    }
  }

  private invokePidGuard(): void {
    if (this.pidGuard === undefined) return
    const pid = this.pidProvider()
    try {
      this.pidGuard.checkPid(pid)
    } catch (err) {
      const msg = (err as Error)?.message ?? String(err)
      throw new AuditLogStoreError(
        'isolation_violation',
        `mock audit append blocked by pid guard: ${msg}`,
        err,
      )
    }
  }

  async append(event: AuditEventInput): Promise<AuditAppendResult> {
    this.invokePidGuard()
    const id = this.events.length + 1
    const ts = event.ts ?? this.now().toISOString()
    const hash = computeHash({
      prevHash: this.lastHash,
      ts,
      type: event.type,
      source: event.source,
      payload: event.payload,
      id,
    })
    const entry: AuditEvent = {
      id,
      ts,
      type: event.type,
      source: event.source,
      payload: event.payload,
      prevHash: this.lastHash,
      hash,
    }
    this.events.push(entry)
    this.lastHash = hash
    this.invokePidGuard()
    return { id, hash }
  }

  async list(query: AuditQuery = {}): Promise<AuditEvent[]> {
    return this.events.filter((e) => {
      if (query.type && e.type !== query.type) return false
      if (query.source && e.source !== query.source) return false
      if (query.fromTs && e.ts < query.fromTs) return false
      if (query.toTs && e.ts > query.toTs) return false
      return true
    })
  }

  async verifyHashChain(): Promise<AuditVerifyResult> {
    let prev = ''
    for (const e of this.events) {
      if (e.prevHash !== prev) {
        return {
          valid: false,
          brokenAt: e.id,
          totalChecked: this.events.length,
        }
      }
      const recomputed = computeHash({
        prevHash: prev,
        ts: e.ts,
        type: e.type,
        source: e.source,
        payload: e.payload,
        id: e.id,
      })
      if (recomputed !== e.hash) {
        return {
          valid: false,
          brokenAt: e.id,
          totalChecked: this.events.length,
        }
      }
      prev = e.hash
    }
    return { valid: true, brokenAt: null, totalChecked: this.events.length }
  }

  async rotate(): Promise<number> {
    return 0
  }

  /** test 用: 内部 entries snapshot. */
  snapshot(): readonly AuditEvent[] {
    return [...this.events]
  }

  /** test 用: 末尾 entry 改竄シミュレート. */
  tamperPayload(id: number, mutator: (e: AuditEvent) => void): void {
    const idx = this.events.findIndex((e) => e.id === id)
    if (idx === -1) return
    const target = this.events[idx]
    if (target !== undefined) {
      mutator(target)
    }
  }
}

// ============================================================================
// RealAuditLogAdapter — FileAuditLogStore を wrap
// ============================================================================

export interface RealAuditLogAdapterOptions extends FileAuditLogStoreOptions {
  /** drill mode で起動した時刻 (audit observability 用). */
  activatedAt?: Date
}

/**
 * RealAuditLogAdapter — FileAuditLogStore を wrap して real-impl 切替を
 * audit 上 observable にする adapter.
 *
 * - 既存 FileAuditLogStore の interface を完全継承 (透過).
 * - 切替時刻 / mode を query 可能 (descriptor).
 * - 失敗時の error 経路を AuditLogStoreError('append_failure') に統一.
 */
export class RealAuditLogAdapter implements AuditLogStore {
  private readonly inner: FileAuditLogStore
  private readonly _filePath: string
  private readonly activatedAt: Date

  constructor(opts: RealAuditLogAdapterOptions) {
    if (!opts.filePath) {
      throw new AuditLogStoreError(
        'append_failure',
        'RealAuditLogAdapter: filePath required',
      )
    }
    this._filePath = opts.filePath
    this.activatedAt = opts.activatedAt ?? new Date()
    this.inner = new FileAuditLogStore(opts)
  }

  async append(event: AuditEventInput): Promise<AuditAppendResult> {
    try {
      return await this.inner.append(event)
    } catch (err) {
      if (err instanceof AuditLogStoreError) {
        throw err
      }
      throw new AuditLogStoreError(
        'append_failure',
        `RealAuditLogAdapter.append failed: ${(err as Error).message}`,
        err,
      )
    }
  }

  async list(query: AuditQuery = {}): Promise<AuditEvent[]> {
    return this.inner.list(query)
  }

  async verifyHashChain(): Promise<AuditVerifyResult> {
    return this.inner.verifyHashChain()
  }

  async rotate(): Promise<number> {
    return this.inner.rotate()
  }

  /** wrapped FileAuditLogStore へのアクセス (test 用). */
  inner_(): FileAuditLogStore {
    return this.inner
  }

  /** real-impl の起動時刻. */
  getActivatedAt(): Date {
    return this.activatedAt
  }

  /** 現在の物理ファイル path. */
  getFilePath(): string {
    return this._filePath
  }
}

// ============================================================================
// factory: createAuditImpl
// ============================================================================

export interface CreateAuditImplOptions {
  mode: AuditImplMode
  filePath?: string
  pidGuard?: PidGuard
  pidProvider?: () => number
  now?: () => Date
  /** drill mode 時に mock seed を引き継ぐか. */
  seedFromMock?: InMemoryMockAuditLogStore | null
}

export interface CreateAuditImplResult {
  store: AuditLogStore
  descriptor: AuditImplDescriptor
}

/**
 * mode に応じた AuditLogStore を生成する factory.
 *
 * mode='mock': InMemoryMockAuditLogStore (test / dry-run).
 * mode='real': RealAuditLogAdapter (production / drill 検証実機).
 * mode='drill': RealAuditLogAdapter + seedFromMock の bridge 段階.
 *
 * drill mode で seedFromMock が与えられた場合は bridgeMockToReal を呼んで mock の
 * 在 entries を real ストアへ migration する.
 */
export async function createAuditImpl(
  opts: CreateAuditImplOptions,
): Promise<CreateAuditImplResult> {
  if (opts.mode === 'mock') {
    const mockOpts: InMemoryMockAuditLogStoreOptions = {}
    if (opts.now !== undefined) mockOpts.now = opts.now
    if (opts.pidGuard !== undefined) mockOpts.pidGuard = opts.pidGuard
    if (opts.pidProvider !== undefined) mockOpts.pidProvider = opts.pidProvider
    const store = new InMemoryMockAuditLogStore(mockOpts)
    return {
      store,
      descriptor: Object.freeze({
        mode: 'mock',
        filePath: null,
        readOnly: false,
        bridgeProgress: 1,
      }),
    }
  }

  if (opts.mode === 'real' || opts.mode === 'drill') {
    if (!opts.filePath) {
      throw new AuditLogStoreError(
        'append_failure',
        `createAuditImpl: filePath required for mode=${opts.mode}`,
      )
    }
    const realOpts: RealAuditLogAdapterOptions = {
      filePath: opts.filePath,
    }
    if (opts.pidGuard !== undefined) realOpts.pidGuard = opts.pidGuard
    if (opts.pidProvider !== undefined) realOpts.pidProvider = opts.pidProvider
    if (opts.now !== undefined) realOpts.now = opts.now
    const adapter = new RealAuditLogAdapter(realOpts)
    let bridgeProgress = 1
    if (opts.mode === 'drill' && opts.seedFromMock) {
      bridgeProgress = await bridgeMockToReal(opts.seedFromMock, adapter)
    }
    return {
      store: adapter,
      descriptor: Object.freeze({
        mode: opts.mode,
        filePath: opts.filePath,
        readOnly: false,
        bridgeProgress,
      }),
    }
  }

  throw new AuditLogStoreError(
    'append_failure',
    `createAuditImpl: unknown mode ${String(opts.mode)}`,
  )
}

// ============================================================================
// bridgeMockToReal — mock の在 entries を real ストアへ移送
// ============================================================================

/**
 * mock store の在 entries を real ストアへ append し直す純関数 (実 IO は real 側のみ).
 *
 * - hash chain は real 側で再構築される (prevHash は real の lastHash から再計算).
 * - mock 側の hash と real 側の hash が一致しない場合がある (ts / payload 同一でも prevHash が異なるため).
 * - 戻り値: bridge が完了した entries の比率 (0..1).
 *
 * 注: drill mode で mock → real 切替時の連続性確保用. real のみで完結する場合は不要.
 */
export async function bridgeMockToReal(
  mock: InMemoryMockAuditLogStore,
  real: AuditLogStore,
): Promise<number> {
  const entries = mock.snapshot()
  if (entries.length === 0) return 1

  let migrated = 0
  for (const e of entries) {
    try {
      await real.append({
        type: e.type,
        source: e.source,
        payload: e.payload,
        ts: e.ts,
      })
      migrated += 1
    } catch (err) {
      // best effort: 1 件失敗しても続行 (drill mode の robustness)
      void err
    }
  }
  return entries.length > 0 ? migrated / entries.length : 1
}

// ============================================================================
// 純関数: assertCompatibleEvent — input validation
// ============================================================================

/**
 * append 前に AuditEventInput が known type / source であることを assert する純関数.
 *
 * 不正な enum 値を mock / real どちらに渡しても同じ error code で failure するように.
 */
export function assertCompatibleEvent(input: AuditEventInput): void {
  const knownTypes: readonly AuditEventType[] = [
    'spawn',
    'spawn_timeout',
    'kill_switch',
    'hitl_decision',
    'ban_drill',
    'other',
  ]
  const knownSources: readonly AuditEventSource[] = [
    'harness',
    'openclaw-runtime',
    'claude-bridge',
    'orchestrator',
    'sandbox',
    'other',
  ]
  if (!knownTypes.includes(input.type)) {
    throw new AuditLogStoreError(
      'append_failure',
      `unknown audit event type: ${String(input.type)}`,
    )
  }
  if (!knownSources.includes(input.source)) {
    throw new AuditLogStoreError(
      'append_failure',
      `unknown audit event source: ${String(input.source)}`,
    )
  }
  if (input.payload === null || typeof input.payload !== 'object') {
    throw new AuditLogStoreError(
      'append_failure',
      `payload must be a non-null object`,
    )
  }
}

// ============================================================================
// 純関数: temp file helper (drill testing 専用)
// ============================================================================

/**
 * drill mode で使う temp audit file path を生成する純関数 (no IO, ただし fs.mkdir は別途必要).
 */
export function makeDrillTempAuditPath(label = 'drill'): string {
  const ts = Date.now()
  const rand = Math.random().toString(36).slice(2)
  return join(tmpdir(), `clawbridge-${label}-${ts}-${rand}`, 'audit-events.jsonl')
}

/**
 * drill mode 用の temp dir を物理的に作成する helper (drill 起動時のみ呼ぶ).
 */
export async function ensureDrillAuditDir(filePath: string): Promise<void> {
  await fs.mkdir(dirname(filePath), { recursive: true })
}

// ============================================================================
// 純関数: descriptor 比較 (test 用)
// ============================================================================

export function descriptorsEqual(
  a: AuditImplDescriptor,
  b: AuditImplDescriptor,
): boolean {
  return (
    a.mode === b.mode &&
    a.filePath === b.filePath &&
    a.readOnly === b.readOnly &&
    a.bridgeProgress === b.bridgeProgress
  )
}
