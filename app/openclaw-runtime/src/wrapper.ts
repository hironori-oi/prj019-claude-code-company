/**
 * openclaw-runtime/wrapper — OpenClaw OSS ラッパ層。
 *
 * 設計方針:
 *   - W0: Mock 実装のみ。Real は W1 でスタブから実装に昇格。
 *   - 上流 OSS は personal AI assistant 化したため第一級ユースケースとして
 *     示されておらず (R-019-12)、本件は連携プラグイン (Enderfga/openclaw-claude-code v2.14.1)
 *     を中心に parts only 利用方針。詳細: ./upstream-notes.md
 *   - subprocess spawn による分離は claude-bridge と同じ pattern を採用予定 (W1)。
 *   - DEC-019-006 P-D 改 整合: 子プロセス spawn 契約を SubprocessSpawnContract に集約。
 *   - DEC-019-051 施策-1 整合: factory で mock-claude スタブと差し替え可能 shape。
 *   - Round 6 (議決-25 採択前提) 前倒し: G-01 (副作用ゼロ spawn) 強化。
 *     env / cwd / argv の whitelist 引数を契約に追加し、未指定時は厳格なデフォルト
 *     (env=空, cwd=OS tmp, argv=[]) で起動。SpawnIsolation 純関数で値を確定し
 *     テスト容易性を確保。
 *
 * 関連必須コントロール:
 *   G-01 / G-V2-04 / G-V2-11 / G-07
 */
import type { LoopResult, LoopStatus, OpenclawConfig } from './types.js'

/**
 * SpawnIsolation 既定方針 (Round 6 G-01 強化版)。
 *
 * 副作用ゼロの厳格モードでは:
 *   - env: 空オブジェクト ({}) を強制。allow-list が指定された場合のみ
 *     `process.env` から該当キーを写し取る。
 *   - cwd: 明示指定が無ければ OS の一時ディレクトリ (例: /tmp) を使用。
 *     PRJ-019 親 monorepo (claude-code-company) を絶対に cwd にしない
 *     (DEC-019-007 副作用ゼロ要件)。
 *   - argv: 明示的に列挙された配列のみを受け付け、空でも許可。
 */

import { tmpdir } from 'node:os'

/** OS 一時ディレクトリを既定 cwd として返す (副作用ゼロ初期値)。 */
export function defaultIsolatedCwd(): string {
  return tmpdir()
}

/**
 * env allow-list を受け取り、`process.env` から該当キーのみを抽出した
 * Readonly Record を返す純関数。
 *
 * - allow-list が空配列の場合は `{}` を返す (subprocess は env 0 個で起動)。
 * - process.env に該当キーが存在しないものは静かに skip。
 * - undefined / 空文字は除外し、Real spawn 時に `inherit` 化を防ぐ。
 */
export function buildAllowedEnv(
  allowList: readonly string[],
  source: NodeJS.ProcessEnv = process.env,
): Readonly<Record<string, string>> {
  const out: Record<string, string> = {}
  for (const key of allowList) {
    const v = source[key]
    if (v !== undefined && v !== '') {
      out[key] = v
    }
  }
  return Object.freeze(out)
}

/**
 * 子プロセス spawn 契約 (DEC-019-006 P-D 改 整合、W1 で実装)。
 *
 * Real 実装は `child_process.spawn` を本契約で抽象化し、
 * テスト時には mock-claude / stub spawner に差し替え可能とする (DEC-019-051 施策-1)。
 *
 * 注意: env は allow-list で厳格化 (G-07 / G-V2-11)。
 *
 * Round 6 拡張 (G-01):
 *   - cwd / argv を契約レベルで明示。Real 実装は本契約以外の値を絶対に
 *     使わないことで副作用ゼロを保証する。
 *   - env は既に存在 (allow-list 後)、cwd / argv も whitelist 引数として
 *     SubprocessSpawnContract が一元管理する。
 */
export interface SubprocessSpawnContract {
  /** 実行ファイル絶対パス (init 時の OpenclawConfig.binaryPath を解決済み) */
  command: string
  /** CLI 引数 (例: ['agent', '--headless', '--config', path]) */
  args: readonly string[]
  /** allow-list 後の env (空なら inherit ではなく empty で起動) */
  env: Readonly<Record<string, string>>
  /** タイムアウト (ms)、loopTimeoutMs と一致させる */
  timeoutMs: number
  /** dryRun=true の場合 spawn せず固定値を返すフックを許可 */
  dryRun: boolean
  /**
   * (Round 6 追加 / G-01) 子プロセスの cwd 絶対パス。
   * 親 monorepo の path を渡してはならない (DEC-019-007 副作用ゼロ要件)。
   * 未指定相当は defaultIsolatedCwd() で OS tmp を返す。
   */
  cwd: string
  /**
   * (Round 6 追加 / G-01) argv whitelist。
   * Node.js 側 process.argv をそのまま透過してはいけないため、本契約で
   * 明示的に列挙された配列のみ伝搬する。args と分離しているのは、
   * args が「実行ファイル後の追加 CLI 引数」であるのに対し、argv は
   * 「子プロセスの process.argv0 等の表面化制御」を意図するため。
   */
  argvWhitelist: readonly string[]
}

/**
 * SubprocessSpawnContract 構築用ヘルパ (Round 6 G-01)。
 *
 * Real 実装と Mock 実装、ならびにテストが同じ純関数を経由して契約を組み立てる
 * ことで、副作用ゼロの不変条件 (env={}, cwd=tmp, argv=[]) を一元的に強制する。
 *
 * 引数を全て明示することで、呼び出し側のうっかり漏れによる process.env / cwd の
 * 透過を型レベルで阻止する。
 */
export interface BuildSpawnContractOptions {
  command: string
  args?: readonly string[]
  envAllowList: readonly string[]
  timeoutMs: number
  dryRun?: boolean
  cwd?: string
  argvWhitelist?: readonly string[]
  /** test 用 env 注入 (default: process.env) */
  envSource?: NodeJS.ProcessEnv
}

export function buildSpawnContract(
  opts: BuildSpawnContractOptions,
): SubprocessSpawnContract {
  return Object.freeze({
    command: opts.command,
    args: Object.freeze([...(opts.args ?? [])]),
    env: buildAllowedEnv(opts.envAllowList, opts.envSource ?? process.env),
    timeoutMs: opts.timeoutMs,
    dryRun: opts.dryRun ?? true,
    cwd: opts.cwd ?? defaultIsolatedCwd(),
    argvWhitelist: Object.freeze([...(opts.argvWhitelist ?? [])]),
  })
}

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
 *   - cwd / argv も whitelist のみ伝搬 (G-01 / Round 6 強化)
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

/**
 * Factory 入力: SpawnIsolation を強制するための optional オプション。
 * Round 6 で追加。指定されない場合も既定値 (副作用ゼロ) で動作する。
 */
export interface CreateOpenclawRuntimeOptions {
  /** test / debug 用 cwd 上書き。未指定なら defaultIsolatedCwd()。 */
  cwd?: string
  /** test / debug 用 env source 上書き。未指定なら process.env。 */
  envSource?: NodeJS.ProcessEnv
  /** argv whitelist。未指定なら []。 */
  argvWhitelist?: readonly string[]
}

/**
 * Factory: 既定で Mock を返す。
 *
 * W0 (5/2-5/18) は env `CLAWBRIDGE_OPENCLAW_RUNTIME` 未設定 / 'mock' なら MockOpenclawRuntime、
 * 'real' を明示指定された場合のみ RealOpenclawRuntime を返す (W0 では即 throw)。
 *
 * mock-claude スタブと統合可能 (DEC-019-051 施策-1):
 *   - テスト経路は本 factory を経由し、Real 実装が landed しても
 *     CLAWBRIDGE_OPENCLAW_RUNTIME=mock で副作用無しに mock 経路を強制可能。
 *
 * Round 6 拡張 (G-01):
 *   - 第 2 引数 options で SpawnIsolation 用の cwd / envSource / argvWhitelist を渡せる。
 *     これらは Real 実装が spawn する際の SubprocessSpawnContract に直接伝搬される
 *     設計とし、Mock では現状参照しない (将来 Real 移行時に互換性のためのスロット)。
 */
export function createOpenclawRuntime(
  mode?: 'mock' | 'real',
  _options?: CreateOpenclawRuntimeOptions,
): OpenclawRuntime {
  // Round 6: options は将来の Real 実装で SubprocessSpawnContract 構築時に
  // 注入される予定。Mock パスでは現状無視しているが、API 互換性のため受け取る。
  const resolved =
    mode ??
    (process.env['CLAWBRIDGE_OPENCLAW_RUNTIME'] === 'real' ? 'real' : 'mock')
  if (resolved === 'real') {
    return new RealOpenclawRuntime()
  }
  return new MockOpenclawRuntime()
}

/**
 * 型レベル検証用ヘルパ (Vitest type assertion で利用)。
 * 任意の OpenclawRuntime 実装に SubprocessSpawnContract から派生する init/runLoop が
 * 存在することを契約として明示する。
 */
export type OpenclawRuntimeContract = {
  spawn: SubprocessSpawnContract
  runtime: OpenclawRuntime
}
