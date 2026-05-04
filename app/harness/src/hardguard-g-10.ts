/**
 * hardguard-g-10 — Round 14 Dev-F (緊急対応): G-10 kill-switch 周辺 hardening.
 *
 * 関連必須コントロール:
 *   G-10 (90 日 retention + SHA-256 hash chain / kill-switch hardening)
 *   G-02 (緊急停止) / G-05 (subprocess kill チェーン) / G-06 (circuit-breaker open 連動)
 *
 * 起源:
 *   - Review-E R13 指摘 「Round 7-A G-10 commit 未完遂」
 *   - drill-2 abort risk 38% の主因の 1 つ (kill-switch propagation 動作不確実)
 *   - 5/5 朝 06:00 採決時間制約厳守
 *
 * 設計方針:
 *   - 既存 kill-switch.ts (FileKillSwitch) との整合確保 (interface はそのまま、追加 hardening のみ).
 *   - pure function + Object.freeze 厳守 (副作用なし、再入可能).
 *   - kill-switch 自体は import しない (循環依存回避)、KillSwitch interface のみ structural typing で受ける.
 *   - audit / tos-monitor を import しない (逆方向 dependency 禁止).
 *
 * 提供 API:
 *   - validateKillTriggerReason(reason): trigger reason の妥当性検証 (pure).
 *   - canonicalKillTriggerSignature(reason, source): kill 履歴の決定論的署名生成.
 *   - KillTriggerLedger: in-memory kill 履歴 ledger (重複 trigger / cooldown 管理).
 *   - assessKillPropagation(targets): subprocess kill 連鎖の妥当性評価 (pure).
 *
 * Drill #2 用途:
 *   - 5/8 朝 (or 5/7 朝前倒し) の S-2 (kill-switch trigger) シナリオで kill propagation
 *     の各段階を validateKillTriggerReason + assessKillPropagation で physical 検証可能に.
 *   - KillTriggerLedger を harness 起動側に組み込むことで重複 trigger / cooldown 違反を検知.
 */

// 逆方向 dependency 禁止: kill-switch の TYPE のみ import.
import type {
  KillTriggerMeta,
  SubprocessKillTarget,
  CircuitBreakerOpenTarget,
} from './kill-switch.js'

// ============================================================================
// 型定義 (frozen 化前提)
// ============================================================================

/** trigger reason の検証結果 (frozen). */
export interface KillTriggerReasonVerdict {
  readonly valid: boolean
  readonly normalizedReason: string
  readonly issues: readonly string[]
}

/** kill 履歴 ledger に保存される 1 件の record (frozen). */
export interface KillLedgerEntry {
  readonly signature: string
  readonly reason: string
  readonly source: string
  readonly tsMs: number
}

/** ledger 登録結果 (frozen). */
export interface KillLedgerAttempt {
  readonly accepted: boolean
  readonly reason: 'first_trigger' | 'duplicate' | 'cooldown_violation'
  readonly signature: string
  readonly conflictingSignature: string | null
}

/** kill propagation の妥当性評価 (frozen). */
export interface KillPropagationAssessment {
  readonly safe: boolean
  readonly subprocessCount: number
  readonly circuitBreakerCount: number
  readonly issues: readonly string[]
}

// ============================================================================
// 純関数: validateKillTriggerReason
// ============================================================================

/** kill trigger reason の最低長 (短すぎる reason は audit で意味不明になるため). */
export const KILL_REASON_MIN_LENGTH = 4
/** kill trigger reason の最大長 (audit log payload 巨大化を抑止). */
export const KILL_REASON_MAX_LENGTH = 512

/**
 * trigger reason の妥当性を検証する pure function.
 *
 * 検査項目:
 *   1. reason が空でない
 *   2. 長さが [KILL_REASON_MIN_LENGTH, KILL_REASON_MAX_LENGTH] の範囲
 *   3. 制御文字 / null byte を含まない (audit log corruption 抑止)
 *   4. PII 疑い (e.g. メールアドレス / API key 風文字列) を含まない (best effort)
 *
 * 戻り値は frozen.
 */
export function validateKillTriggerReason(reason: string): KillTriggerReasonVerdict {
  const issues: string[] = []
  const trimmed = reason.trim()

  if (trimmed.length === 0) {
    issues.push('empty_reason')
  }
  if (trimmed.length > 0 && trimmed.length < KILL_REASON_MIN_LENGTH) {
    issues.push(`reason_too_short: length=${trimmed.length}`)
  }
  if (trimmed.length > KILL_REASON_MAX_LENGTH) {
    issues.push(`reason_too_long: length=${trimmed.length}`)
  }
  // 制御文字 / null byte 検出
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(trimmed)) {
    issues.push('control_chars_present')
  }
  // 雑な PII 検出 (best effort)
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(trimmed)) {
    issues.push('email_like_pii_suspicion')
  }
  // API key 風 (AKIA + 16 大文字 / sk- + 32 char)
  if (/AKIA[0-9A-Z]{16}/.test(trimmed) || /\bsk-[a-zA-Z0-9]{32,}\b/.test(trimmed)) {
    issues.push('api_key_like_pii_suspicion')
  }

  // normalize: 連続空白を 1 個に圧縮
  const normalized = trimmed.replace(/\s+/g, ' ')

  return Object.freeze({
    valid: issues.length === 0,
    normalizedReason: normalized,
    issues: Object.freeze([...issues]),
  })
}

// ============================================================================
// 純関数: canonicalKillTriggerSignature
// ============================================================================

/**
 * reason + source から決定論的な kill trigger signature を生成する pure function.
 *
 * - 同じ入力からは必ず同じ署名.
 * - audit log に焼き付けて重複 trigger / cooldown 違反を後追い検証可能.
 */
export function canonicalKillTriggerSignature(
  reason: string,
  source: string,
): string {
  const sourceLower = source.toLowerCase().slice(0, 32)
  const reasonNorm = reason.trim().replace(/\s+/g, '_').slice(0, 80)
  return `${sourceLower}:${reasonNorm}`
}

// ============================================================================
// 純関数: assessKillPropagation
// ============================================================================

export interface AssessKillPropagationInput {
  readonly subprocessTargets: readonly SubprocessKillTarget[]
  readonly circuitBreakerTargets: readonly CircuitBreakerOpenTarget[]
}

/**
 * subprocess kill 連鎖の妥当性を評価する pure function.
 *
 * 検査項目:
 *   1. subprocess target が 1 件以上 (空集合は drill 設計エラー: kill 経路が確認できない)
 *   2. circuit-breaker target が 1 件以上 (G-06 整合)
 *   3. subprocess の name 重複なし
 *   4. circuit-breaker の name 重複なし
 *   5. subprocess の各 target が必須 method を備える (alive / signal が function)
 *
 * 戻り値は frozen. drill #2 で kill propagation のヘルスチェック用途.
 */
export function assessKillPropagation(
  input: AssessKillPropagationInput,
): KillPropagationAssessment {
  const issues: string[] = []
  const { subprocessTargets, circuitBreakerTargets } = input

  if (subprocessTargets.length === 0) {
    issues.push('no_subprocess_targets')
  }
  if (circuitBreakerTargets.length === 0) {
    issues.push('no_circuit_breaker_targets')
  }

  // name 重複検出 (subprocess)
  const seenSubName = new Set<string>()
  for (const t of subprocessTargets) {
    if (typeof t.name !== 'string' || t.name.length === 0) {
      issues.push('subprocess_name_invalid')
      continue
    }
    if (seenSubName.has(t.name)) {
      issues.push(`subprocess_name_duplicate: ${t.name}`)
    }
    seenSubName.add(t.name)
    if (typeof t.alive !== 'function' || typeof t.signal !== 'function') {
      issues.push(`subprocess_method_missing: ${t.name}`)
    }
  }

  // name 重複検出 (circuit-breaker)
  const seenCbName = new Set<string>()
  for (const t of circuitBreakerTargets) {
    if (typeof t.name !== 'string' || t.name.length === 0) {
      issues.push('circuit_breaker_name_invalid')
      continue
    }
    if (seenCbName.has(t.name)) {
      issues.push(`circuit_breaker_name_duplicate: ${t.name}`)
    }
    seenCbName.add(t.name)
    if (typeof t.forceOpen !== 'function') {
      issues.push(`circuit_breaker_method_missing: ${t.name}`)
    }
  }

  return Object.freeze({
    safe: issues.length === 0,
    subprocessCount: subprocessTargets.length,
    circuitBreakerCount: circuitBreakerTargets.length,
    issues: Object.freeze([...issues]),
  })
}

// ============================================================================
// KillTriggerLedger — in-memory ledger (cooldown / 重複 trigger 検知)
// ============================================================================

export interface KillTriggerLedgerOptions {
  /** 同一 signature の連続 trigger を抑止する cooldown ms. default 5000ms. */
  readonly cooldownMs?: number
  /** ledger の最大保持件数 (LRU 風 trim). default 1024. */
  readonly maxEntries?: number
  /** 時刻取得関数 (DI). default Date.now. */
  readonly nowMs?: () => number
}

/**
 * KillTriggerLedger — in-memory kill 履歴 ledger.
 *
 * 用途:
 *   - kill-switch.trigger の前段に組み込み、cooldown 内の重複 trigger を抑止.
 *   - drill #2 で kill 履歴の連続性を検証.
 *   - audit に焼き付ける前の pre-check 段階.
 *
 * 設計方針:
 *   - ファイル / network 依存ゼロ.
 *   - cooldown 違反は accepted=false で reject (trigger を抑止する判断は caller 側).
 *   - LRU 風に古い entry を trim (max 1024).
 */
export class KillTriggerLedger {
  private readonly cooldownMs: number
  private readonly maxEntries: number
  private readonly nowMs: () => number
  private readonly entries: KillLedgerEntry[] = []

  constructor(opts: KillTriggerLedgerOptions = {}) {
    this.cooldownMs = opts.cooldownMs ?? 5000
    this.maxEntries = opts.maxEntries ?? 1024
    this.nowMs = opts.nowMs ?? (() => Date.now())
  }

  /**
   * trigger 試行を ledger に登録. cooldown 違反 / 重複なら accepted=false.
   *
   * 注: 副作用は entries への push のみ.
   */
  record(reason: string, source: string, meta?: KillTriggerMeta): KillLedgerAttempt {
    void meta
    const signature = canonicalKillTriggerSignature(reason, source)
    const now = this.nowMs()

    // cooldown 違反検出
    for (let i = this.entries.length - 1; i >= 0; i--) {
      const e = this.entries[i]
      if (e === undefined) continue
      if (e.signature === signature) {
        const elapsed = now - e.tsMs
        if (elapsed < this.cooldownMs) {
          return Object.freeze({
            accepted: false,
            reason: 'cooldown_violation',
            signature,
            conflictingSignature: e.signature,
          })
        }
        // cooldown 経過済 → 重複として扱うが accepted=true (再登録 OK)
        break
      }
    }

    const entry: KillLedgerEntry = Object.freeze({
      signature,
      reason: reason.trim(),
      source,
      tsMs: now,
    })
    this.entries.push(entry)

    // LRU 風 trim
    while (this.entries.length > this.maxEntries) {
      this.entries.shift()
    }

    return Object.freeze({
      accepted: true,
      reason: 'first_trigger',
      signature,
      conflictingSignature: null,
    })
  }

  /** 登録件数. */
  size(): number {
    return this.entries.length
  }

  /** 指定 signature の登録件数. */
  countForSignature(signature: string): number {
    return this.entries.filter((e) => e.signature === signature).length
  }

  /** 全 entries snapshot (frozen). drill #2 audit 用. */
  snapshot(): readonly KillLedgerEntry[] {
    return Object.freeze([...this.entries])
  }

  /** 末尾 entry (frozen) or null. */
  last(): KillLedgerEntry | null {
    return this.entries.length === 0
      ? null
      : (this.entries[this.entries.length - 1] ?? null)
  }
}

// ============================================================================
// 純関数: classifyKillSeverity
// ============================================================================

export type KillSeverity = 'info' | 'warning' | 'critical'

/**
 * trigger reason / source から severity を分類する pure function.
 * audit log の filtering / dashboard 集計用.
 */
export function classifyKillSeverity(
  reason: string,
  source: KillTriggerMeta['source'] | string,
): KillSeverity {
  const r = reason.toLowerCase()
  if (
    source === 'budget' ||
    source === 'rate_anomaly' ||
    r.includes('cost_cap_breach') ||
    r.includes('budget')
  ) {
    return 'critical'
  }
  if (source === 'continuous_runtime' || r.includes('runtime_limit')) {
    return 'warning'
  }
  if (source === 'manual' || r.includes('manual')) {
    return 'info'
  }
  if (source === 'file_signal' || r.includes('stop signal')) {
    return 'critical'
  }
  return 'warning'
}

// ============================================================================
// const default export
// ============================================================================

export const DEFAULT_KILL_LEDGER_COOLDOWN_MS = 5000
