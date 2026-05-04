# sandbox/ — Vercel Sandbox 連携層

## 責務

**Vercel Sandbox**（Firecracker microVM、iad1）を起動し、Open Claw / Claude Code が生成したコードを **Tier 1 secret から物理的に隔離**して build/test 実行する。失敗時は ephemeral 破棄。

## 入力

- generated repo の git ref または tarball
- env whitelist（明示的に注入する env 変数のみ、親 process env は引き継がない）
- 実行コマンド（`npm install` / `npm test` / `next build` 等）

## 出力

- `SandboxResult`（exit code / stdout / stderr / artifact paths / cost / duration）
- 失敗時は `app/audit/` への記録 + `notify/` 経由 Slack 通知

## 採用根拠（pm v2 §2.4）

| 比較軸 | Vercel Sandbox | E2B | 判断 |
|---|---|---|---|
| 既存契約 | あり（claude-code-company 標準） | なし | Vercel |
| Phase 1 PoC コスト | Hobby 無料枠（5 CPU 時間 / 420 GB-hr / 5,000 sandbox/月） | $100 一回限りクレジット | Vercel |
| 標準スタック整合 | Next.js + Vercel deploy 統合 | 別管理 | Vercel |

## 重要な隔離ルール（**G-07 必須コントロールの中核**）

- 親 process の `process.env` は **絶対に引き継がない**
- env は **whitelist 指定**で sandbox 起動 SDK に明示的に渡す
- Tier 1 secret（ANTHROPIC_*, OPENAI_*, GITHUB_PAT, VERCEL_TOKEN）は sandbox 内に**到達不可**
- 検証: sandbox 内で `env | grep ANTHROPIC` → 空になることを CB-D-W0-08 で確認

## 依存関係

- `harness/secret_isolation.ts` — env whitelist 検証
- `audit/` — sandbox 起動・終了ログ
- Vercel Sandbox SDK（npm package、W1 で導入）

## 主要 API

```typescript
interface SandboxAPI {
  runInSandbox(opts: {
    repo: GitRef | TarballPath
    env: Record<string, string>  // whitelist のみ
    cmd: string[]
    timeoutMs?: number
  }): Promise<SandboxResult>
}
```

## W0 段階の到達目標

- CB-D-W0-08: hello.js を Vercel Sandbox で起動し、`env` が空（whitelist 通り）であることを確認、PoC レポート作成

## 関連必須コントロール

G-07（secret 隔離 microVM）／ G-V2-11（OAuth トークン到達禁止 FS/env 隔離）
