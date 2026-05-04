/**
 * multi-process-isolation — Round 11 Dev-B (DEC-019-057 連動 / R10 Review-δ 残実装 6 件 #6).
 *
 * 関連:
 *   - DEC-019-007 / 015 (G-V2-01 並列セッション数 = 1 強制)
 *   - DEC-019-053 v15.5 / 054 / 055 / 056 / 057
 *   - drill #2 (5/8 朝予定): Sumi/Asagi 巻き添えゼロ確証
 *
 * 責務:
 *   - 同時起動された別プロセス (PRJ-012 Sumi の Cursor session, PRJ-018 Asagi の background runner 等)
 *     から **本案件の harness が独立して動いている確証** を audit log に焼き付ける純関数群
 *   - process.pid + 起動 token + audit log への独立 process record を生成
 *
 * 設計方針:
 *   - process.pid 取得は DI 化 (TimeSource と同様パターン、Windows / Linux / test 互換).
 *   - 起動 token は uuid v4 風 (依存ゼロ実装、本番は crypto.randomUUID 推奨).
 *   - 純関数 + 軽量 class、tos-monitor / kill-switch / audit を一切 import しない
 *     (逆方向 dependency, file-conflict 禁止).
 *   - generated record は audit hook (FileAuditLogStore) が import してそのまま append できる shape.
 *
 * Drill #2 用途:
 *   - 5/8 朝の Sumi/Asagi 巻き添え検証時に、本案件 harness の StartupRecord を audit に保存し、
 *     Sumi/Asagi 側からは異なる pid + token + projectId であることを確認する.
 *   - 検証コマンド (drill 完了後): audit/clawbridge.log を grep "isolation:start" して
 *     pid / token / projectId が衝突していないことを確認.
 */

// ============================================================================
// 型定義
// ============================================================================

/** process.pid 取得関数 (DI 化、Windows/Linux/test 互換). */
export type PidProvider = () => number

/** ms 単位 timestamp (TimeSource 互換). */
export type NowMs = () => number

/** 起動 token (uuid v4 風). */
export type StartupToken = string

/**
 * 独立 process startup record. audit log にそのまま append される。
 */
export interface ProcessStartupRecord {
  /** record kind (audit 検索用 fixed key). */
  kind: 'isolation:start'
  /** 案件 ID (PRJ-XXX). */
  projectId: string
  /** OS process id. */
  pid: number
  /** 起動 token (案件 + pid + 開始時刻に対し一意). */
  startupToken: StartupToken
  /** 起動時刻 ISO8601. */
  startedAt: string
  /** 親プロセス info (Sumi/Asagi orchestrator の pid 等、判明していれば). */
  parentPid: number | null
  /** 並列許容フラグ (G-V2-01 並列 1 強制 = false 推奨). */
  parallelAllowed: boolean
  /** 観測した同時刻 既知 process ids (drill #2 で Sumi/Asagi の pid を記録). */
  knownPeerPids: readonly number[]
}

/**
 * shutdown record (起動 token と共に終了を記録). drill #2 で起動/終了の対が揃って
 * 巻き添えゼロを確証する.
 */
export interface ProcessShutdownRecord {
  kind: 'isolation:stop'
  projectId: string
  pid: number
  startupToken: StartupToken
  startedAt: string
  endedAt: string
  durationMs: number
  /** 異常終了 reason (audit 上 root cause 追跡). */
  exitReason: string | null
}

// ============================================================================
// builder — 純関数
// ============================================================================

export interface BuildStartupRecordOptions {
  projectId: string
  pidProvider?: PidProvider
  now?: NowMs
  parentPid?: number | null
  parallelAllowed?: boolean
  knownPeerPids?: readonly number[]
  /** test 用 explicit token (省略で 32 字 hex 生成). */
  token?: StartupToken
}

/**
 * 独立 process startup record を生成する純関数。audit log に append する用途。
 *
 * G-V2-01 (並列セッション数 = 1 強制) を尊重するため parallelAllowed は default false。
 * 上書きしたい場合は明示的に true を渡すこと (Sumi/Asagi 共存テスト時の例外).
 */
export function buildProcessStartupRecord(
  opts: BuildStartupRecordOptions,
): ProcessStartupRecord {
  if (!opts.projectId || opts.projectId.length === 0) {
    throw new Error('multi-process-isolation: projectId required')
  }
  const pidProv = opts.pidProvider ?? defaultPidProvider
  const now = opts.now ?? (() => Date.now())
  const pid = pidProv()
  if (!Number.isInteger(pid) || pid < 0) {
    throw new Error(`multi-process-isolation: invalid pid ${pid}`)
  }
  const token = opts.token ?? generateStartupToken(pid, now())
  const peerPids = opts.knownPeerPids ?? []
  // self pid が peer に含まれている場合は drill 設計エラー (本 process が peer に紛れている).
  if (peerPids.includes(pid)) {
    throw new Error(
      `multi-process-isolation: self pid ${pid} found in knownPeerPids (collision risk)`,
    )
  }
  return {
    kind: 'isolation:start',
    projectId: opts.projectId,
    pid,
    startupToken: token,
    startedAt: new Date(now()).toISOString(),
    parentPid: opts.parentPid ?? null,
    parallelAllowed: opts.parallelAllowed ?? false,
    knownPeerPids: [...peerPids],
  }
}

export interface BuildShutdownRecordOptions {
  startupRecord: ProcessStartupRecord
  now?: NowMs
  exitReason?: string | null
}

export function buildProcessShutdownRecord(
  opts: BuildShutdownRecordOptions,
): ProcessShutdownRecord {
  const now = opts.now ?? (() => Date.now())
  const start = Date.parse(opts.startupRecord.startedAt)
  const end = now()
  if (!Number.isFinite(start)) {
    throw new Error('multi-process-isolation: startupRecord.startedAt invalid')
  }
  if (end < start) {
    throw new Error(
      `multi-process-isolation: shutdown end ${end} before start ${start} (clock skew?)`,
    )
  }
  return {
    kind: 'isolation:stop',
    projectId: opts.startupRecord.projectId,
    pid: opts.startupRecord.pid,
    startupToken: opts.startupRecord.startupToken,
    startedAt: opts.startupRecord.startedAt,
    endedAt: new Date(end).toISOString(),
    durationMs: end - start,
    exitReason: opts.exitReason ?? null,
  }
}

// ============================================================================
// IsolationGuard — 軽量 class. drill #2 で start/stop を 1 ペアとして記録.
// ============================================================================

export interface IsolationGuardOptions {
  projectId: string
  pidProvider?: PidProvider
  now?: NowMs
}

/**
 * IsolationGuard — 案件の独立 process 確証を 1 lifecycle で管理する.
 * drill #2 で本 process の start/stop を audit に焼き付ける用途。
 */
export class IsolationGuard {
  private startRecord: ProcessStartupRecord | null = null
  private readonly pidProvider: PidProvider
  private readonly now: NowMs
  private readonly projectId: string

  constructor(opts: IsolationGuardOptions) {
    this.pidProvider = opts.pidProvider ?? defaultPidProvider
    this.now = opts.now ?? (() => Date.now())
    this.projectId = opts.projectId
  }

  /**
   * 起動を記録. 既に start 済の場合は throw (重複起動検知).
   */
  start(extra: Omit<BuildStartupRecordOptions, 'projectId' | 'pidProvider' | 'now'> = {}): ProcessStartupRecord {
    if (this.startRecord !== null) {
      throw new Error('IsolationGuard: already started')
    }
    this.startRecord = buildProcessStartupRecord({
      projectId: this.projectId,
      pidProvider: this.pidProvider,
      now: this.now,
      ...extra,
    })
    return this.startRecord
  }

  /**
   * 終了を記録. start 前なら throw.
   */
  stop(exitReason: string | null = null): ProcessShutdownRecord {
    if (this.startRecord === null) {
      throw new Error('IsolationGuard: not started')
    }
    const stop = buildProcessShutdownRecord({
      startupRecord: this.startRecord,
      now: this.now,
      exitReason,
    })
    this.startRecord = null
    return stop
  }

  /** 現在の start 状態. */
  isActive(): boolean {
    return this.startRecord !== null
  }

  /** 現在の record snapshot. */
  current(): ProcessStartupRecord | null {
    return this.startRecord === null ? null : { ...this.startRecord }
  }

  /**
   * Round 12 Dev-B (DEC-019-057): audit-store.append への配線用。
   *
   * 起動済 process の pid と渡された pid を照合し、不一致なら
   * IsolationViolationError を throw する。append 前後に強制呼び出しすることで
   * 異 process が同 audit log に書き込もうとした場合に即座に検知する。
   *
   * 設計:
   *   - start() 未呼び出しの場合は throw しない (audit append は通す、新規 process が
   *     start() を後から呼ぶ可能性を考慮)。明示的にチェックしたい場合は
   *     requireStarted=true を渡す。
   *   - 起動済 + pid mismatch → throw 'isolation_violation' (graceful shutdown 経路へ).
   *
   * @param currentPid  audit append を実行している process.pid
   * @param requireStarted  start() 未呼び出し時に throw するか (default false)
   */
  checkPid(currentPid: number, requireStarted = false): void {
    if (this.startRecord === null) {
      if (requireStarted) {
        throw new IsolationViolationError(
          'IsolationGuard.checkPid: not started (call start() before audit append)',
          { reason: 'not_started', currentPid },
        )
      }
      return
    }
    if (currentPid !== this.startRecord.pid) {
      throw new IsolationViolationError(
        `IsolationGuard.checkPid: pid mismatch (expected ${this.startRecord.pid}, got ${currentPid}) — different process attempting audit append`,
        {
          reason: 'pid_mismatch',
          currentPid,
          expectedPid: this.startRecord.pid,
          startupToken: this.startRecord.startupToken,
          projectId: this.startRecord.projectId,
        },
      )
    }
  }
}

// ============================================================================
// IsolationViolationError — audit-store 配線時の強制例外型
// ============================================================================

export interface IsolationViolationDetail {
  reason: 'pid_mismatch' | 'not_started'
  currentPid: number
  expectedPid?: number
  startupToken?: StartupToken
  projectId?: string
}

export class IsolationViolationError extends Error {
  override readonly name = 'IsolationViolationError'
  readonly detail: IsolationViolationDetail
  constructor(message: string, detail: IsolationViolationDetail) {
    super(message)
    this.detail = detail
  }
}

/**
 * audit-store が依存できる軽量 contract. harness の IsolationGuard が impl する.
 * audit パッケージは harness を import せず、本 interface のみで結合する.
 */
export interface PidGuard {
  /** pid 不一致なら throw、一致 or 未起動なら return. */
  checkPid(currentPid: number): void
}

// ============================================================================
// 衝突検出 — drill #2 検証用
// ============================================================================

/**
 * 同時に存在する複数の startup record から衝突 (= G-V2-01 違反) を検出する.
 *
 * 衝突条件:
 *   1. pid 重複 (parallelAllowed=false の同案件で別 record)
 *   2. startupToken 重複 (実装バグ示唆、必ず違反)
 *   3. 同 projectId で parallelAllowed=false の record が 2 件以上
 *
 * @returns violations 配列 (空配列 = 違反なし)
 */
export interface IsolationViolation {
  type: 'pid_duplicate' | 'token_duplicate' | 'parallel_violation'
  detail: string
}

export function detectIsolationViolations(
  records: readonly ProcessStartupRecord[],
): IsolationViolation[] {
  const violations: IsolationViolation[] = []
  const seenPids = new Map<number, ProcessStartupRecord>()
  const seenTokens = new Map<StartupToken, ProcessStartupRecord>()
  const projectCounts = new Map<string, number>()

  for (const r of records) {
    // pid 重複
    const prevPid = seenPids.get(r.pid)
    if (prevPid && !prevPid.parallelAllowed && !r.parallelAllowed) {
      violations.push({
        type: 'pid_duplicate',
        detail: `pid ${r.pid} appears in projects ${prevPid.projectId} + ${r.projectId} (both parallelAllowed=false)`,
      })
    }
    seenPids.set(r.pid, r)
    // token 重複 (必ず違反)
    const prevTok = seenTokens.get(r.startupToken)
    if (prevTok) {
      violations.push({
        type: 'token_duplicate',
        detail: `startupToken ${r.startupToken} duplicated across projects ${prevTok.projectId} + ${r.projectId}`,
      })
    }
    seenTokens.set(r.startupToken, r)
    // 並列違反 (同 projectId で parallelAllowed=false × 2 件以上)
    if (!r.parallelAllowed) {
      const c = (projectCounts.get(r.projectId) ?? 0) + 1
      projectCounts.set(r.projectId, c)
      if (c >= 2) {
        violations.push({
          type: 'parallel_violation',
          detail: `projectId ${r.projectId}: ${c} concurrent records with parallelAllowed=false (G-V2-01 violation)`,
        })
      }
    }
  }
  return violations
}

// ============================================================================
// 内部 helper
// ============================================================================

function defaultPidProvider(): number {
  // Node.js process.pid (Windows + Linux 共通).
  return typeof process !== 'undefined' && typeof process.pid === 'number'
    ? process.pid
    : 0
}

/**
 * 起動 token (32-char hex) 生成. crypto.randomUUID が無い環境用に Math.random fallback.
 * pid + startedAtMs を seed の一部として混ぜることで衝突確率を下げる。
 */
function generateStartupToken(pid: number, startedAtMs: number): StartupToken {
  const seed = `${pid.toString(16)}-${startedAtMs.toString(16)}`
  let s = ''
  for (let i = 0; i < 24; i++) {
    s += Math.floor(Math.random() * 16).toString(16)
  }
  return `${seed}-${s}`
}
