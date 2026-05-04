# claude-bridge/ — Claude Code subprocess spawn 層

## 責務

**P-D 改**（CEO 決裁済）方式で Claude Code CLI を subprocess spawn し、本人マシン OAuth 認証下で `claude -p "<prompt>" --output-format stream-json` を実行。stream-json NDJSON を parse して上位層（orchestrator / harness / audit）に流す。

## 入力

- orchestrator/ からの prompt + allowed tools + json schema 指定

## 出力

- `AsyncIterable<StreamEvent>` （system/init / stream_event / tool_use / system/api_retry / result）
- 失敗時の例外 + Slack 通知

## 認証方針（**ToS 適合性の核心**）

- **オーナー本人マシン**で **本人の Claude Max OAuth** ログイン状態を維持（research-supplement §9.1 P-D 改）
- `--bare` は **使わない**（`--bare` は OAuth/keychain を読まないため、サブスク認証ができなくなる）
- Open Claw / claude-bridge は **絶対に Anthropic API を直接叩かない**。Claude 関連は **すべて Claude Code CLI 経由**
- OAuth トークンを env / config から読み出さず、Claude Code CLI 自身に委譲

## ToS 適合性の根拠

1. 公式 Claude Code CLI を **改変なし**で使用 → "third-party tool" には該当しない
2. 認証は **オーナー本人の OAuth** → "on behalf of their users" には該当しない
3. claude-code-company の **オーナー個人作業** → "ordinary, individual usage" 範囲
4. Anthropic streaming classifier から見て **正規 Claude Code session そのもの**

## 依存関係

- `harness/` — 起動前 cost_check / business_hour_guard / rate_jitter、起動後 tos_monitor
- `audit/` — stream-json 全 event を hook で書込

## 主要 API

```typescript
interface ClaudeBridgeAPI {
  spawnClaude(opts: {
    prompt: string
    allowedTools?: string[]
    jsonSchema?: object
    permissionMode?: 'acceptEdits' | 'dontAsk'
    cwd?: string
  }): AsyncIterable<StreamEvent>
}

type StreamEvent =
  | { type: 'system/init'; session_id: string; ... }
  | { type: 'stream_event'; delta: string; ... }
  | { type: 'tool_use'; tool: string; input: unknown; ... }
  | { type: 'system/api_retry'; ... }
  | { type: 'result'; final: string; usage: TokenUsage; ... }
```

## W0 段階の到達目標

- CB-D-W0-06: `claude -p "echo test" --output-format stream-json` 動作確認、サンプル NDJSON 取得
- CB-D-W0-07: `parseStreamJson` プロトタイプ + Vitest 単体テスト

## 関連必須コントロール

G-V2-03（起動元偽装禁止、OAuth 直 spawn 禁止）／ G-V2-11（OAuth トークン到達禁止 FS/env 隔離）／ G-V2-12（投入経路文書化）
