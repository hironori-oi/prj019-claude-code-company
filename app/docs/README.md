# docs/ — アーキテクチャ・API 仕様・PoC レポート

## 責務

Clawbridge ハーネス基盤の **設計成果物**を集約。ADR（アーキテクチャ決定記録）、各層の API 仕様、PoC レポート、運用ドキュメントを置く。

## 構成

```
docs/
├── adr/                          # アーキテクチャ決定記録（ADR）
│   ├── ADR-001-connection-method.md          # P-D 改採用（CB-D-W0-03）
│   ├── ADR-002-sandbox-platform.md           # Vercel Sandbox（CB-D-W0-03）
│   ├── ADR-003-self-hosted-harness.md        # 自前ハーネス（CB-D-W0-03）
│   └── ADR-004-app-location.md               # app 配下配置（外部リポ化は M3 以降）
├── api-spec/                     # 各層の API 仕様
│   ├── claude-bridge.md          # spawnClaude API
│   ├── orchestrator.md           # requestCEO API
│   ├── sandbox.md                # runInSandbox API
│   └── harness.md                # cost_check / emergency_stop / hitl_gate 等
├── poc/                          # W0 PoC レポート
│   ├── openclaw-bootstrap.md     # CB-D-W0-04
│   ├── claude-bridge-bootstrap.md # CB-D-W0-06
│   └── vercel-sandbox-bootstrap.md # CB-D-W0-08
├── account-isolation.md          # メイン業務との Anthropic アカウント分離（CB-D-W0-05）
├── control-matrix.md             # 必須コントロール 23 項目 → W1〜W4 タスク マッピング（CB-D-W0-16）
└── w0-completion-review.md       # W0 完了レビュー報告（CB-D-W0-17）
```

## ADR の書式

各 ADR は以下のフォーマットで統一:

```markdown
# ADR-XXX: タイトル

## 状態
Accepted / Proposed / Deprecated / Superseded by ADR-YYY

## 文脈
背景・課題

## 決定
具体的な決定内容

## 結論の理由
根拠（research v1/v2、pm v2、review v2 等の引用）

## 影響
ポジティブ・ネガティブ両面、トレードオフ

## 関連
- 引用元レポート
- 関連 ADR
- 関連必須コントロール
```

## 参照

- 全体計画: `projects/PRJ-019/reports/dev-phase1-w0-implementation-plan.md`
- WBS 正本: `projects/PRJ-019/reports/pm-architecture-v2-and-phase1-plan.md`
- 必須コントロール正本: `projects/PRJ-019/reports/review-v2-subscription-risk-and-fallback.md`
