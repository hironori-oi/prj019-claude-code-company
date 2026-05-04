/**
 * openclaw-runtime/wrapper — OpenClaw OSS ラッパ層。
 *
 * 設計方針:
 *   - W0: Mock 実装のみ。Real は W1 でスタブから実装に昇格。
 *   - 上流 OSS は personal AI assistant 化したため第一級ユースケースとして
 *     示されておらず (R-019-12)、本件は連携プラグイン (Enderfga/openclaw-claude-code v2.14.1)
 *     を中心に parts only 利用方針。詳細: ./upstream-notes.md
 *   - subprocess spawn による分離は claude-bridge と同じ pattern を採用予定 (W1)。
 *
 * 関連必須コントロール:
 *   G-V2-04 / G-V2-11 / G-07
 */
import type { LoopResult, LoopStatus, OpenclawConfig } from './types.js'

/**
 * OpenClaw OSS ラッパの公開 interface。
 *
 * 実装は最低限 4 メソッドを満たす:
 *   1. init(config)        — runtime をセットアップ (env allow-list 検証, binary 探索)
 *   2. runLoop(needSummary) — 1 ループ実行 (HN trending → ニーズ抽出 → 提案)
 *   3. shutdown()           — 子プロセス停止, リソース開放
 *   4. getStatus()          — 現在状態の取得
 */
export interface OpenclawRuntime {
  init(config: OpenclawConfig): Promise<void>
  runLoop(needSummary: string): Promise<LoopResult>
  shutdown(): Promise<void>
  getStatus(): LoopStatus
}

/**
 * Mock 実装 (W0 で使用)。
 * - 実 subprocess を spawn せず、固定 / 決定論的なダミーデータを返す。
 * - 全テストおよび harness 統合検証は本クラスのみで完結する。
 *
 * Phase 1 W2 で Real 実装に切替。テストでも mock を維持し dual-track。
 */
export class MockOpenclawRuntime implements OpenclawRuntime {
  private initialized = false
  private running = false
  private totalLoops = 0
  private lastLoopFinishedAt: string | null = null
  private lastStatus: LoopResult['status'] | null = null
  /**
   * 内部保持。Mock 実装内で env allow-list / dryRun 等の参照に使う。
   * exported readonly accessor は提供しない (Real への移行時に再設計)。
   */
  private config: OpenclawConfig | null = null

  async init(config: OpenclawConfig): Promise<void> {
    // 冪等性: 二重 init はエラーにせず無視
    if (this.initialized) return
    if (config.envAllowList.length > 1000) {
      throw new Error(
        'mock-openclaw-runtime: envAllowList too long (sanity check)',
      )
    }
    this.config = config
    this.initialized = true
  }

  /** test / debug 用: 現在の config を取得 (init 前なら null)。 */
  getConfig(): OpenclawConfig | null {
    return this.config
  }

  async runLoop(needSummary: string): Promise<LoopResult> {
    if (!this.initialized) {
      throw new Error('mock-openclaw-runtime: not initialized')
    }
    if (this.running) {
      throw new Error('mock-openclaw-runtime: loop already running')
    }
    this.running = true
    const startedAt = new Date().toISOString()
    try {
      // 決定論的 mock 出力
      const isEmpty = needSummary.trim().length === 0
      const result: LoopResult = isEmpty
        ? {
            status: 'no_action',
            actions: [],
            needs: [],
            startedAt,
            finishedAt: new Date().toISOString(),
          }
        : {
            status: 'completed',
            actions: [
              {
                kind: 'classify_need',
                summary: `mock classification of "${needSummary.slice(0, 40)}"`,
                estimatedCostUsd: 0.001,
              },
            ],
            needs: [
              {
                needId: `mock-need-${this.totalLoops + 1}`,
                title: needSummary.slice(0, 80),
                source: 'mock',
              },
            ],
            startedAt,
            finishedAt: new Date().toISOString(),
          }
      this.totalLoops += 1
      this.lastLoopFinishedAt = result.finishedAt
      this.lastStatus = result.status
      return result
    } finally {
      this.running = false
    }
  }

  async shutdown(): Promise<void> {
    // 冪等性: 二重 shutdown も OK
    if (!this.initialized) return
    this.initialized = false
    this.running = false
    this.config = null
  }

  getStatus(): LoopStatus {
    return {
      initialized: this.initialized,
      running: this.running,
      totalLoops: this.totalLoops,
      lastLoopFinishedAt: this.lastLoopFinishedAt,
      lastStatus: this.lastStatus,
    }
  }
}

/**
 * Real 実装 (W1 で本格着手予定)。
 *
 * W0 段階ではインスタンス化禁止 (誤って本番経路に乗らないよう保護)。
 * interface contract のみ揃える。
 *
 * 実装方針 (W1):
 *   - child_process.spawn で `openclaw agent --headless` を起動
 *   - stream-json NDJSON parse は claude-bridge/stream-json-parser.ts を流用
 *   - env allow-list を spawn 時に厳格化 (G-07 / G-V2-11)
 *   - cost / kill / hitl は @clawbridge/harness Harness クラス経由で連携
 */
export class RealOpenclawRuntime implements OpenclawRuntime {
  constructor() {
    throw new Error(
      'RealOpenclawRuntime: not implemented (W0 stub). ' +
        'Use MockOpenclawRuntime in W0. Real implementation lands W1 (CB-D-W1-XX).',
    )
  }

  // 以下は interface contract 充足のためのスタブ。
  // constructor で throw するため到達不能だが、interface 整合性のため実装する。
  async init(_config: OpenclawConfig): Promise<void> {
    throw new Error('RealOpenclawRuntime: not implemented')
  }
  async runLoop(_needSummary: string): Promise<LoopResult> {
    throw new Error('RealOpenclawRuntime: not implemented')
  }
  async shutdown(): Promise<void> {
    throw new Error('RealOpenclawRuntime: not implemented')
  }
  getStatus(): LoopStatus {
    throw new Error('RealOpenclawRuntime: not implemented')
  }
}
