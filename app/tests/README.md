# tests/ — 単体・統合テスト

## 責務

各層の単体テスト（Vitest）と Phase 1 W4 ベンチマークの統合テスト（Playwright）。dry-run mode で副作用ゼロ証明も担う。

## 構成

```
tests/
├── unit/                # Vitest 単体（各層に対応）
│   ├── harness/
│   │   ├── cost_check.test.ts
│   │   ├── emergency_stop.test.ts
│   │   ├── fs_allowlist.test.ts
│   │   └── secret_isolation.test.ts
│   ├── claude-bridge/
│   │   └── stream-json-parser.test.ts
│   └── sandbox/
│       └── runInSandbox.test.ts
└── e2e/                 # Playwright 統合（W4 ベンチマーク）
    ├── benchmark.spec.ts            # DoD ベンチマーク（HN trending → preview deploy）
    └── side-effect-zero.spec.ts     # 副作用ゼロ証明
```

## テスト方針

### 単体テスト（Vitest）

- 各 src ファイルに対応する `*.test.ts` を `unit/` 配下に配置
- harness 系は **failure-first**（block / warn の挙動を最初にテスト）
- claude-bridge は **stream-json サンプル NDJSON 固定 input** で event 抽出を確認
- sandbox は **env whitelist が引き継がれない**ことを最重要テスト

### 統合テスト（Playwright）

- W4 ベンチマーク 10 連続実行（CB-1-W4-03）
- 各回前後で `git diff projects/PRJ-001/` 〜 `projects/PRJ-018/` 全件 0 行確認
- Vercel preview deploy URL 取得 → Slack 通知到達確認

### dry-run モード

- W4 で実装（CB-1-W4-01）
- 実 deploy 抑制で全工程 3 回完走
- W0 では `tests/e2e/benchmark.spec.ts` の skeleton（タスク `it.todo(...)` 列挙）のみ

## 依存関係

- Vitest（単体）
- Playwright（統合、`@playwright/test`）
- `@vercel/sandbox` SDK（sandbox 単体テスト）

## W0 段階の到達目標

- Vitest セットアップ（`vitest.config.ts`、W1 着手時に `package.json` と一緒に配置）
- `unit/claude-bridge/stream-json-parser.test.ts` 実装（CB-D-W0-07）
- `unit/harness/cost_check.test.ts` 実装（CB-D-W0-09）
- `unit/harness/emergency_stop.test.ts` 実装（CB-D-W0-10）

## 関連必須コントロール

G-12（既存 PRJ 副作用ゼロ証明） — `e2e/side-effect-zero.spec.ts` で恒常的に検証
