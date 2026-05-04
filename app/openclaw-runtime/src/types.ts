/**
 * openclaw-runtime/types — OpenClaw OSS ラッパ層の型定義。
 *
 * Phase 1 W0 段階では Mock 実装のみ。Real 実装は W1 で着手。
 *
 * 関連必須コントロール:
 *   G-V2-04 (指示入力経路の単一化: Open Claw → claude-bridge → claude -p)
 *   G-V2-11 (OAuth トークン到達禁止: Anthropic OAuth は claude-bridge subprocess に委譲)
 *   G-07   (secret 隔離 microVM: env 引き渡しを type level で allow-list 化)
 */

/**
 * OpenClaw runtime のサポート LLM プロバイダ。
 * W0 段階では openai_codex のみ想定 (Codex Pro $100 OAuth)。
 * Anthropic 直接接続は本案件で禁止 (claude-bridge 経由のみ)。
 */
export type OpenclawProvider = 'openai_codex'

/**
 * OpenClaw runtime の設定。init() に渡す。
 *
 * 環境変数 allow-list (G-07 / G-V2-11):
 *   - 明示的に列挙された env のみ子プロセスに伝搬
 *   - ANTHROPIC_API_KEY / OPENAI_API_KEY 等の secret は env から渡さず
 *     OS の credential store (~/.openclaw/openclaw.json) 側に委譲
 */
export interface OpenclawConfig {
  /** OpenClaw 実行ファイル絶対パス。未指定時は which() で解決。 */
  binaryPath?: string
  /** 利用プロバイダ */
  provider: OpenclawProvider
  /** 子プロセスに渡す env の allow-list (空配列なら何も渡さない) */
  envAllowList: readonly string[]
  /** loop 1 回あたりの timeout (ms) */
  loopTimeoutMs: number
  /** OpenClaw 設定ファイル (~/.openclaw/openclaw.json) 上書きパス */
  configPath?: string
  /**
   * dry-run モード (W0 検証用: 実際の subprocess spawn を行わず log のみ出力)。
   * Mock では常に true 同等。
   */
  dryRun?: boolean
}

/** loop 1 回の結果。 */
export interface LoopResult {
  /** 直近 loop の終了状況 */
  status: 'completed' | 'aborted' | 'timeout' | 'no_action'
  /** loop で発火したアクション (cost-tracker 計上用) */
  actions: readonly {
    kind: string
    summary: string
    /** 大まかな cost 推定 (USD)。Real ではプロバイダ請求に置換。 */
    estimatedCostUsd: number
  }[]
  /** loop 内で生成された need 候補 (HN trending 等) */
  needs: readonly {
    needId: string
    title: string
    source: string
  }[]
  /** 開始時刻 (ISO8601) */
  startedAt: string
  /** 終了時刻 (ISO8601) */
  finishedAt: string
}

/** runtime ステータス (getStatus() 戻り値)。 */
export interface LoopStatus {
  /** init 済か */
  initialized: boolean
  /** loop 実行中か */
  running: boolean
  /** 累計 loop 実行回数 */
  totalLoops: number
  /** 直近 loop の終了時刻 (未実行なら null) */
  lastLoopFinishedAt: string | null
  /** 直近 loop の status (未実行なら null) */
  lastStatus: LoopResult['status'] | null
}
