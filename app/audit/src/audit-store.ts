/**
 * audit-store — append-only 監査ログストア (G-10)。
 *
 * 関連必須コントロール:
 *   G-09 (HITL gate enforcement の audit 連携)
 *   G-10 (90 日 retention + SHA-256 hash chain)
 *
 * 設計方針:
 *   - 物理ファイル: JSON Lines (1 行 1 entry)。append-only で書き込み、
 *     既存行の書換は禁止 (verifyHashChain で検出)。
 *   - hash chain: 各 entry の hash = SHA-256(prev_hash || canonical_payload)。
 *     prev_hash は直前 entry の hash。chain の先頭は prev_hash="" (genesis)。
 *   - rotation: 90 日 (default) を超えた entry は `<file>.archive-YYYYMMDD.jsonl`
 *     に move (新ファイル作成 + 旧ファイル切り詰めではなく、別 file 化で rename)。
 *     archive ファイルは削除しない (要件: 「append-only」に従う)。
 *   - イベント種別: spawn / kill-switch / hitl_decision を 3 必須カバー、
 *     拡張可能 (AuditEventType の string enum)。
 */
import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { createHash } from 'node:crypto'

// ============================================================================
// Round 12 Dev-B (DEC-019-057): IsolationGuard 配線
// ============================================================================

/**
 * harness の IsolationGuard が impl する軽量 contract.
 * audit は harness package を import しないが、append 前後で本 interface を
 * 呼び出して異 process 競合を検知する.
 */
export interface PidGuard {
  /** pid 不一致なら throw, 一致 or 未起動なら return. */
  checkPid(currentPid: number): void
}

/**
 * append 時に IsolationGuard.checkPid が pid 不一致を検出した場合に
 * audit-store が throw する error.
 */
export class AuditLogStoreError extends Error {
  override readonly name = 'AuditLogStoreError'
  readonly code: 'isolation_violation' | 'append_failure'
  override readonly cause?: unknown
  constructor(
    code: 'isolation_violation' | 'append_failure',
    message: string,
    cause?: unknown,
  ) {
    super(message)
    this.code = code
    if (cause !== undefined) this.cause = cause
  }
}

export type AuditEventType =
  | 'spawn'
  | 'spawn_timeout'
  | 'kill_switch'
  | 'hitl_decision'
  | 'ban_drill'
  | 'other'

export type AuditEventSource =
  | 'harness'
  | 'openclaw-runtime'
  | 'claude-bridge'
  | 'orchestrator'
  | 'sandbox'
  | 'other'

/** チェーンに連結される 1 entry の最終形 (hash 確定後)。 */
export interface AuditEvent {
  /** 連番 (1 から)。chain 検証のための同期 cursor として使う。 */
  id: number
  /** ISO8601 (UTC) */
  ts: string
  type: AuditEventType
  source: AuditEventSource
  /** 任意の構造化 payload。secret 値は呼び出し側で redaction 済が前提。 */
  payload: Record<string, unknown>
  /** 直前 entry の hash。genesis では空文字。 */
  prevHash: string
  /** SHA-256(prevHash || canonical_payload) を 16 進化したもの。 */
  hash: string
}

/** append 入力 (id / prevHash / hash は store が決定)。 */
export interface AuditEventInput {
  type: AuditEventType
  source: AuditEventSource
  payload: Record<string, unknown>
  /** 注入用 (テスト)。指定なければ store が生成。 */
  ts?: string
}

export interface AuditAppendResult {
  id: number
  hash: string
}

export interface AuditQuery {
  type?: AuditEventType
  source?: AuditEventSource
  /** ISO8601 inclusive lower bound */
  fromTs?: string
  /** ISO8601 inclusive upper bound */
  toTs?: string
}

export interface AuditVerifyResult {
  valid: boolean
  /** chain が壊れた最初の id (1-based)。null = 全件 OK。 */
  brokenAt: number | null
  totalChecked: number
}

export interface AuditRotationPolicy {
  /** 保持期間 (ms)。default 90 日。 */
  retentionMs: number
  /** 1 度の append で rotation を試みるか (default true)。テストで false にすると即時実行を抑止。 */
  rotateOnAppend: boolean
}

export interface AuditLogStore {
  append(event: AuditEventInput): Promise<AuditAppendResult>
  list(query?: AuditQuery): Promise<AuditEvent[]>
  verifyHashChain(): Promise<AuditVerifyResult>
  /** 90 日 retention 越えを archive へ移動 (返り値: 移動件数)。 */
  rotate(): Promise<number>
}

export interface FileAuditLogStoreOptions {
  /** 物理ファイル絶対パス。default: ~/.clawbridge/audit-events.jsonl */
  filePath?: string
  /** rotation policy。default 90 日 / rotateOnAppend=true */
  rotation?: Partial<AuditRotationPolicy>
  /** 注入用 (テスト) */
  now?: () => Date
  /**
   * Round 12 Dev-B (DEC-019-057): 異 process 競合検知用の pid guard.
   * harness 側の IsolationGuard を渡す想定. append 前後に checkPid(currentPid) が
   * 呼ばれ, 不一致なら AuditLogStoreError('isolation_violation', ...) を throw する.
   */
  pidGuard?: PidGuard
  /**
   * pid 取得関数 (DI). default: () => process.pid.
   * test 用に固定 pid を注入したい場合に使う.
   */
  pidProvider?: () => number
}

/**
 * canonical JSON: object key を sorted、一行化。hash 計算用に決定論的にする。
 */
function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return '[' + value.map((v) => canonicalize(v)).join(',') + ']'
  }
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return (
    '{' +
    keys.map((k) => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') +
    '}'
  )
}

/**
 * SHA-256(prevHash || canonical(payload + meta)) を 16 進化。
 *
 * 公開関数: テスト + verifier の両方で利用するため export する。
 */
export function computeHash(args: {
  prevHash: string
  ts: string
  type: AuditEventType
  source: AuditEventSource
  payload: Record<string, unknown>
  id: number
}): string {
  const canonical = canonicalize({
    id: args.id,
    ts: args.ts,
    type: args.type,
    source: args.source,
    payload: args.payload,
  })
  return createHash('sha256').update(args.prevHash).update(canonical).digest('hex')
}

const DEFAULT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000 // 90 日

export class FileAuditLogStore implements AuditLogStore {
  private readonly filePath: string
  private readonly retentionMs: number
  private readonly rotateOnAppend: boolean
  private readonly now: () => Date
  private readonly pidGuard: PidGuard | undefined
  private readonly pidProvider: () => number

  /** in-memory cache: 末尾 entry の id + hash。冒頭 ロード後ずっと保持。 */
  private lastId = 0
  private lastHash = ''
  private loaded = false
  /** 同時 append 防止用 mutex (Promise chain) */
  private appendChain: Promise<unknown> = Promise.resolve()

  constructor(opts: FileAuditLogStoreOptions = {}) {
    this.filePath =
      opts.filePath ?? join(process.env['HOME'] ?? process.env['USERPROFILE'] ?? '.', '.clawbridge', 'audit-events.jsonl')
    this.retentionMs = opts.rotation?.retentionMs ?? DEFAULT_RETENTION_MS
    this.rotateOnAppend = opts.rotation?.rotateOnAppend ?? true
    this.now = opts.now ?? (() => new Date())
    this.pidGuard = opts.pidGuard
    this.pidProvider =
      opts.pidProvider ??
      (() =>
        typeof process !== 'undefined' && typeof process.pid === 'number'
          ? process.pid
          : 0)
  }

  async append(event: AuditEventInput): Promise<AuditAppendResult> {
    // serialise concurrent append to keep chain monotonic
    const result = this.appendChain.then(async () => this.appendInner(event))
    this.appendChain = result.catch(() => undefined)
    return result
  }

  /**
   * pidGuard.checkPid を強制呼び出し. 不一致なら AuditLogStoreError throw.
   * pidGuard 未設定の場合は no-op (既存テスト互換).
   */
  private invokePidGuard(): void {
    if (this.pidGuard === undefined) return
    const pid = this.pidProvider()
    try {
      this.pidGuard.checkPid(pid)
    } catch (err) {
      // IsolationViolationError or generic Error → audit-store の error code に正規化
      const msg = (err as Error)?.message ?? String(err)
      throw new AuditLogStoreError(
        'isolation_violation',
        `audit append blocked by pid guard: ${msg}`,
        err,
      )
    }
  }

  private async appendInner(event: AuditEventInput): Promise<AuditAppendResult> {
    // Round 12 Dev-B: append 前 pid guard
    this.invokePidGuard()
    await this.ensureLoaded()
    const id = this.lastId + 1
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
    await fs.mkdir(dirname(this.filePath), { recursive: true })
    await fs.appendFile(this.filePath, JSON.stringify(entry) + '\n', 'utf-8')
    this.lastId = id
    this.lastHash = hash
    // Round 12 Dev-B: append 後 pid guard (file 書込中の race を検知).
    //   ここで例外が出ても entry 自体は既に書き込み済なので, caller は graceful shutdown
    //   経路に進むこと推奨.
    this.invokePidGuard()
    if (this.rotateOnAppend) {
      try {
        await this.rotate()
      } catch {
        // best effort
      }
    }
    return { id, hash }
  }

  async list(query: AuditQuery = {}): Promise<AuditEvent[]> {
    const events = await this.readAll()
    return events.filter((e) => {
      if (query.type && e.type !== query.type) return false
      if (query.source && e.source !== query.source) return false
      if (query.fromTs && e.ts < query.fromTs) return false
      if (query.toTs && e.ts > query.toTs) return false
      return true
    })
  }

  async verifyHashChain(): Promise<AuditVerifyResult> {
    const events = await this.readAll()
    let prev = ''
    for (const e of events) {
      if (e.prevHash !== prev) {
        return { valid: false, brokenAt: e.id, totalChecked: events.length }
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
        return { valid: false, brokenAt: e.id, totalChecked: events.length }
      }
      prev = e.hash
    }
    return { valid: true, brokenAt: null, totalChecked: events.length }
  }

  async rotate(): Promise<number> {
    await this.ensureLoaded()
    const events = await this.readAll()
    if (events.length === 0) return 0
    const cutoff = this.now().getTime() - this.retentionMs
    const expired: AuditEvent[] = []
    const kept: AuditEvent[] = []
    for (const e of events) {
      if (Date.parse(e.ts) < cutoff) expired.push(e)
      else kept.push(e)
    }
    if (expired.length === 0) return 0
    const stamp = this.formatStamp(this.now())
    const archivePath = `${this.filePath}.archive-${stamp}.jsonl`
    await fs.appendFile(
      archivePath,
      expired.map((e) => JSON.stringify(e)).join('\n') + '\n',
      'utf-8',
    )
    // active file を kept のみで rewrite (atomic via tmp)
    const tmp = `${this.filePath}.tmp.${process.pid}.${Date.now()}`
    await fs.writeFile(
      tmp,
      kept.map((e) => JSON.stringify(e)).join('\n') + (kept.length > 0 ? '\n' : ''),
      'utf-8',
    )
    await fs.rename(tmp, this.filePath)
    // chain head は kept の末尾 (= 既存 lastId/lastHash と一致するはず)
    const tail = kept[kept.length - 1]
    this.lastId = tail?.id ?? 0
    this.lastHash = tail?.hash ?? ''
    return expired.length
  }

  /** test 用: 内部状態リロード (ファイル直接編集後の再同期)。 */
  async reload(): Promise<void> {
    this.loaded = false
    await this.ensureLoaded()
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return
    const events = await this.readAll()
    const tail = events[events.length - 1]
    this.lastId = tail?.id ?? 0
    this.lastHash = tail?.hash ?? ''
    this.loaded = true
  }

  private async readAll(): Promise<AuditEvent[]> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8')
      const out: AuditEvent[] = []
      for (const line of raw.split('\n')) {
        const trimmed = line.trim()
        if (trimmed.length === 0) continue
        try {
          out.push(JSON.parse(trimmed) as AuditEvent)
        } catch {
          // 破損行は skip (verifyHashChain が後で気付く)
        }
      }
      return out
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
      throw err
    }
  }

  private formatStamp(d: Date): string {
    const y = d.getUTCFullYear().toString().padStart(4, '0')
    const m = (d.getUTCMonth() + 1).toString().padStart(2, '0')
    const day = d.getUTCDate().toString().padStart(2, '0')
    return `${y}${m}${day}`
  }
}
