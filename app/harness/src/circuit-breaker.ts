/**
 * circuit-breaker — 連続失敗時に open し、cooldown 後 half-open で復帰する標準パターン。
 *
 * 関連必須コントロール:
 *   G-V2-03 (起動元偽装/OAuth 直 spawn 防御の補助) — claude CLI / API call ラッパで使用
 *
 * 状態遷移:
 *   closed → (失敗 N 連続) → open → (cooldown 経過) → half-open → (試行成功) → closed
 *                                                              → (試行失敗) → open
 *
 * 用途:
 *   - claude-bridge spawn (Claude Code CLI 起動失敗時)
 *   - 有償 API call (Anthropic / OpenAI / Vercel)
 *   - Slack / Telegram 通知 outbound
 *
 * 設定:
 *   - failureThreshold: open になる連続失敗回数 (default 5)
 *   - cooldownMs: open → half-open までの待ち時間 (default 30s)
 *   - successThreshold: half-open → closed に戻すための連続成功回数 (default 1)
 */

import type { TimeSource } from './time-source.js'

export type CircuitState = 'closed' | 'open' | 'half-open'

export interface CircuitBreakerConfig {
  name: string
  failureThreshold?: number
  successThreshold?: number
  cooldownMs?: number
  /** 注入用 (後方互換) */
  now?: () => number
  /** TimeSource 注入 (libfaketime 代替)。now より優先。 */
  timeSource?: TimeSource
}

export interface CircuitStatus {
  name: string
  state: CircuitState
  consecutiveFailures: number
  consecutiveSuccesses: number
  lastFailureAt?: number
  openedAt?: number
}

export class CircuitOpenError extends Error {
  constructor(public readonly circuitName: string) {
    super(`circuit-breaker open: ${circuitName}`)
    this.name = 'CircuitOpenError'
  }
}

export class CircuitBreaker {
  private state: CircuitState = 'closed'
  private consecutiveFailures = 0
  private consecutiveSuccesses = 0
  private lastFailureAt: number | undefined
  private openedAt: number | undefined

  private readonly name: string
  private readonly failureThreshold: number
  private readonly successThreshold: number
  private readonly cooldownMs: number
  private readonly now: () => number

  constructor(config: CircuitBreakerConfig) {
    this.name = config.name
    this.failureThreshold = config.failureThreshold ?? 5
    this.successThreshold = config.successThreshold ?? 1
    this.cooldownMs = config.cooldownMs ?? 30_000
    if (config.timeSource) {
      const ts = config.timeSource
      this.now = () => ts.nowMs()
    } else {
      this.now = config.now ?? (() => Date.now())
    }
  }

  async fire<T>(fn: () => Promise<T>): Promise<T> {
    // open のときは cooldown 経過していたら half-open に遷移、未経過なら即 reject
    if (this.state === 'open') {
      if (this.openedAt !== undefined && this.now() - this.openedAt >= this.cooldownMs) {
        this.state = 'half-open'
        this.consecutiveSuccesses = 0
      } else {
        throw new CircuitOpenError(this.name)
      }
    }

    try {
      const result = await fn()
      this.recordSuccess()
      return result
    } catch (err) {
      this.recordFailure()
      throw err
    }
  }

  status(): CircuitStatus {
    return {
      name: this.name,
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      ...(this.lastFailureAt !== undefined && { lastFailureAt: this.lastFailureAt }),
      ...(this.openedAt !== undefined && { openedAt: this.openedAt }),
    }
  }

  /** test 用: 状態を強制リセット */
  reset(): void {
    this.state = 'closed'
    this.consecutiveFailures = 0
    this.consecutiveSuccesses = 0
    this.lastFailureAt = undefined
    this.openedAt = undefined
  }

  /**
   * Round 6 G-06: kill-switch 連動で外部から強制 open 化する。
   * cooldown はその時点から計測し、SubprocessKill チェーンの完了後 fire は CircuitOpenError で拒否される。
   */
  forceOpen(_reason?: string): void {
    this.state = 'open'
    this.openedAt = this.now()
    this.consecutiveFailures = Math.max(this.consecutiveFailures, this.failureThreshold)
  }

  /** breaker 名を取得 (kill-switch 登録時の対象識別用) */
  getName(): string {
    return this.name
  }

  private recordSuccess(): void {
    this.consecutiveFailures = 0
    if (this.state === 'half-open') {
      this.consecutiveSuccesses += 1
      if (this.consecutiveSuccesses >= this.successThreshold) {
        this.state = 'closed'
        this.openedAt = undefined
      }
    } else {
      this.state = 'closed'
    }
  }

  private recordFailure(): void {
    this.consecutiveSuccesses = 0
    this.consecutiveFailures += 1
    this.lastFailureAt = this.now()
    if (this.state === 'half-open') {
      // half-open で 1 失敗したら即 open に戻す
      this.state = 'open'
      this.openedAt = this.now()
      return
    }
    if (this.consecutiveFailures >= this.failureThreshold) {
      this.state = 'open'
      this.openedAt = this.now()
    }
  }
}
