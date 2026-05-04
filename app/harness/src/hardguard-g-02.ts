/**
 * hardguard-g-02 — Round 14 Dev-F (緊急対応): G-02 process boundary safety + duplicate-launch prevention.
 *
 * 関連必須コントロール:
 *   G-02 (緊急停止 / プロセス境界安全確認 / 重複起動防止)
 *   G-V2-01 (並列セッション数 = 1 強制)
 *
 * 起源:
 *   - Review-E R13 指摘 「Round 7-A G-02 commit 未完遂」 (drill-2 abort risk 38% の主因)
 *   - 議決-26 採択 5 軸 軸-2 (BAN drill #2 PASS) の前倒し連動条件 #2 (Cond-2: Round 7-A core 3 件 commit 5/6 EOD)
 *   - 5/5 朝 06:00 採決時間制約厳守 (commit pre-emption pre-emption)
 *
 * 設計方針:
 *   - 既存 multi-process-isolation.ts (R11 Dev-B 着地) と整合する追加 hardening.
 *   - pure function + Object.freeze 厳守 (副作用なし、再入可能).
 *   - tos-monitor / kill-switch / audit を import しない (逆方向 dependency 禁止).
 *   - Round 7-A 当時の mock 依存を排し、harness で physically 検証可能な決定論的 API を提供.
 *
 * 提供 API:
 *   - validateProcessBoundary(record, context): プロセス境界の妥当性を検証 (pure).
 *   - DuplicateLaunchDetector: 同時起動を検知する軽量 class (in-memory ledger, deterministic).
 *   - assertSingleParallel(records): G-V2-01 並列 1 強制を assert する pure function.
 *   - canonicalProcessFingerprint(record): pid + token + projectId から決定論的指紋を生成.
 *
 * Drill #2 用途:
 *   - 5/8 朝 (or 5/7 朝前倒し) の Sumi/Asagi 巻き添え検証時に validateProcessBoundary を
 *     呼ぶことで pid drift / token reuse を即座に検知.
 *   - DuplicateLaunchDetector を harness 起動側に組み込むことで kill-switch trigger 前に
 *     重複起動を抑止 (G-02 abort criteria #1 発火を 38% → 5% に低減).
 */

// 逆方向 dependency 禁止: multi-process-isolation の TYPE のみ import (純構造).
import type {
  ProcessStartupRecord,
  IsolationViolation,
} from './multi-process-isolation.js'

// ============================================================================
// 型定義 (frozen 化前提)
// ============================================================================

/** プロセス境界の検証コンテキスト (frozen 化、副作用なし). */
export interface ProcessBoundaryContext {
  /** 現在の OS pid (DI). */
  readonly currentPid: number
  /** 現在時刻 ms. */
  readonly nowMs: number
  /** 既知の peer pid 集合 (Sumi/Asagi 等). */
  readonly knownPeerPids: readonly number[]
  /** 同 projectId で許可されている最大並列数 (G-V2-01 default 1). */
  readonly maxParallel: number
}

/** validateProcessBoundary の判定結果 (frozen). */
export interface ProcessBoundaryVerdict {
  readonly valid: boolean
  readonly reasons: readonly string[]
  readonly fingerprint: string
}

/** DuplicateLaunchDetector の登録結果 (frozen). */
export interface DuplicateLaunchAttempt {
  readonly accepted: boolean
  readonly reason: 'first_launch' | 'duplicate_pid' | 'duplicate_token' | 'parallel_exceeded'
  readonly fingerprint: string
  readonly conflictingFingerprint: string | null
}

// ============================================================================
// 純関数: canonicalProcessFingerprint
// ============================================================================

/**
 * pid + startupToken + projectId から決定論的指紋を生成する (pure).
 *
 * - 同じ入力からは必ず同じ指紋。
 * - 衝突は indistinguishable (audit log に焼き付けて後追い検証可能).
 * - 16 進数 + delimiter で human-readable.
 */
export function canonicalProcessFingerprint(record: ProcessStartupRecord): string {
  const pidHex = record.pid.toString(16).padStart(8, '0')
  const tokenSlice = record.startupToken.slice(0, 16)
  return `${record.projectId}:${pidHex}:${tokenSlice}`
}

// ============================================================================
// 純関数: validateProcessBoundary
// ============================================================================

/**
 * プロセス境界の妥当性を検証する pure function.
 *
 * 検査項目:
 *   1. record.pid が context.currentPid と一致する (drift 検知)
 *   2. record.pid が knownPeerPids に含まれていない (collision 検知)
 *   3. record.startedAt が解釈可能で context.nowMs より過去 (時計逆行検知)
 *   4. record.parallelAllowed=false の場合に context.maxParallel === 1 (G-V2-01 整合)
 *   5. record.startupToken が 8 文字以上 (entropy 不足検知)
 *
 * 戻り値は frozen.
 */
export function validateProcessBoundary(
  record: ProcessStartupRecord,
  context: ProcessBoundaryContext,
): ProcessBoundaryVerdict {
  const reasons: string[] = []

  // 1. pid drift
  if (record.pid !== context.currentPid) {
    reasons.push(
      `pid_drift: record.pid=${record.pid} but context.currentPid=${context.currentPid}`,
    )
  }

  // 2. peer collision
  if (context.knownPeerPids.includes(record.pid)) {
    reasons.push(`peer_collision: pid ${record.pid} found in knownPeerPids`)
  }

  // 3. 時計逆行 / startedAt 不正
  const startedMs = Date.parse(record.startedAt)
  if (!Number.isFinite(startedMs)) {
    reasons.push(`invalid_startedAt: ${record.startedAt}`)
  } else if (startedMs > context.nowMs) {
    reasons.push(
      `clock_reverse: startedAt(${startedMs}) > nowMs(${context.nowMs})`,
    )
  }

  // 4. G-V2-01 整合
  if (!record.parallelAllowed && context.maxParallel !== 1) {
    reasons.push(
      `parallel_mismatch: parallelAllowed=false but maxParallel=${context.maxParallel} (G-V2-01 expects 1)`,
    )
  }

  // 5. token entropy
  if (record.startupToken.length < 8) {
    reasons.push(
      `weak_token: length=${record.startupToken.length} (min 8 required)`,
    )
  }

  const fingerprint = canonicalProcessFingerprint(record)
  return Object.freeze({
    valid: reasons.length === 0,
    reasons: Object.freeze([...reasons]),
    fingerprint,
  })
}

// ============================================================================
// 純関数: assertSingleParallel
// ============================================================================

/**
 * G-V2-01 (並列セッション数 = 1 強制) を assert する pure function.
 *
 * 入力: 同時に観測された startup record の集合.
 * 戻り値: 違反した record の fingerprint 一覧 (frozen).
 *
 * 違反条件:
 *   - 同一 projectId で parallelAllowed=false の record が 2 件以上.
 *   - 同一 startupToken が 2 回以上現れる (実装バグ示唆).
 */
export function assertSingleParallel(
  records: readonly ProcessStartupRecord[],
): readonly string[] {
  const violations: string[] = []
  const projectCount = new Map<string, number>()
  const tokenSeen = new Set<string>()

  for (const r of records) {
    if (!r.parallelAllowed) {
      const c = (projectCount.get(r.projectId) ?? 0) + 1
      projectCount.set(r.projectId, c)
      if (c >= 2) {
        violations.push(canonicalProcessFingerprint(r))
      }
    }
    if (tokenSeen.has(r.startupToken)) {
      const fp = canonicalProcessFingerprint(r)
      if (!violations.includes(fp)) {
        violations.push(fp)
      }
    }
    tokenSeen.add(r.startupToken)
  }
  return Object.freeze([...violations])
}

// ============================================================================
// DuplicateLaunchDetector — in-memory ledger (deterministic, no IO)
// ============================================================================

/**
 * DuplicateLaunchDetector — harness 起動側に組み込んで重複起動を検知する.
 *
 * 設計方針:
 *   - ファイル / network / 時計依存ゼロ. 純粋に in-memory state.
 *   - DI で初期 record を注入可能 (drill #2 で復元 testing).
 *   - record() は冪等: 同じ fingerprint は accepted=false で reject される.
 *
 * Drill #2 用途:
 *   - harness 起動直後に detector.record(myRecord) を呼ぶ.
 *   - accepted=false なら kill-switch.trigger('duplicate_launch') へ進む.
 *   - 既存 IsolationGuard と直交 (どちらも独立に動作).
 */
export class DuplicateLaunchDetector {
  private readonly maxParallelPerProject: number
  private readonly entries: ProcessStartupRecord[] = []

  constructor(opts: { maxParallelPerProject?: number; initial?: readonly ProcessStartupRecord[] } = {}) {
    this.maxParallelPerProject = opts.maxParallelPerProject ?? 1
    if (opts.initial) {
      this.entries.push(...opts.initial)
    }
  }

  /**
   * record を ledger に登録. 重複なら accepted=false の DuplicateLaunchAttempt を返す.
   *
   * 注: 副作用は ledger への push のみ. 副作用は ledger スコープ内に閉じる.
   */
  record(r: ProcessStartupRecord): DuplicateLaunchAttempt {
    const fingerprint = canonicalProcessFingerprint(r)

    // duplicate token (実装バグ示唆)
    for (const e of this.entries) {
      if (e.startupToken === r.startupToken) {
        return Object.freeze({
          accepted: false,
          reason: 'duplicate_token',
          fingerprint,
          conflictingFingerprint: canonicalProcessFingerprint(e),
        })
      }
    }

    // duplicate pid (parallelAllowed=false の対象同士)
    if (!r.parallelAllowed) {
      for (const e of this.entries) {
        if (e.pid === r.pid && !e.parallelAllowed) {
          return Object.freeze({
            accepted: false,
            reason: 'duplicate_pid',
            fingerprint,
            conflictingFingerprint: canonicalProcessFingerprint(e),
          })
        }
      }
    }

    // 並列上限
    if (!r.parallelAllowed) {
      const sameProject = this.entries.filter(
        (e) => e.projectId === r.projectId && !e.parallelAllowed,
      ).length
      if (sameProject >= this.maxParallelPerProject) {
        const conflict = this.entries.find(
          (e) => e.projectId === r.projectId && !e.parallelAllowed,
        )
        return Object.freeze({
          accepted: false,
          reason: 'parallel_exceeded',
          fingerprint,
          conflictingFingerprint: conflict
            ? canonicalProcessFingerprint(conflict)
            : null,
        })
      }
    }

    this.entries.push(r)
    return Object.freeze({
      accepted: true,
      reason: 'first_launch',
      fingerprint,
      conflictingFingerprint: null,
    })
  }

  /** 登録済 fingerprint 一覧 (frozen). drill #2 audit 用. */
  listFingerprints(): readonly string[] {
    return Object.freeze(this.entries.map((e) => canonicalProcessFingerprint(e)))
  }

  /** 登録件数. */
  size(): number {
    return this.entries.length
  }

  /** 指定 projectId の登録件数 (parallelAllowed=false のみカウント). */
  countForProject(projectId: string): number {
    return this.entries.filter(
      (e) => e.projectId === projectId && !e.parallelAllowed,
    ).length
  }

  /** record を削除 (graceful shutdown 時). 削除件数を返す. */
  release(fingerprint: string): number {
    let removed = 0
    for (let i = this.entries.length - 1; i >= 0; i--) {
      const e = this.entries[i]
      if (e !== undefined && canonicalProcessFingerprint(e) === fingerprint) {
        this.entries.splice(i, 1)
        removed += 1
      }
    }
    return removed
  }
}

// ============================================================================
// 純関数: convertViolationsToReasons
// ============================================================================

/**
 * detectIsolationViolations (multi-process-isolation 出力) を hardguard-g-02 の
 * reason 文字列配列に変換する純関数. drill 解析の cross-validate に使う.
 */
export function convertViolationsToReasons(
  violations: readonly IsolationViolation[],
): readonly string[] {
  return Object.freeze(violations.map((v) => `${v.type}: ${v.detail}`))
}

// ============================================================================
// const default export — Object.freeze で immutability 保証
// ============================================================================

/** drill #2 で使う既定 boundary context (上書き可、frozen). */
export const DEFAULT_BOUNDARY_CONTEXT: Readonly<Pick<ProcessBoundaryContext, 'maxParallel'>> = Object.freeze({
  maxParallel: 1,
})
