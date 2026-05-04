# orchestrator/ — claude-code-company 接続層

## 責務

Open Claw からの自律指示を、既存の **claude-code-company 組織モデル**（CEO / Secretary / PM / Dev / Research / Review / Web-Ops）に橋渡しする層。`/new-project` 起票、PRJ-XXX 採番、5 点ドキュメント生成のオーケストレーションを担う。

## 入力

- Open Claw（`openclaw-runtime/`）からの構造化 JSON 指示（`NewProjectIntent`、`TaskAssignment` 等）

## 出力

- claude-bridge/ 経由で `claude -p "<prompt>" --output-format stream-json` を発火
- 既存 organization/ skill 群を呼び出し（CEO/Secretary/Dev/Review）

## 重要な制約（**最重要**）

- 既存 `organization/` 配下は **read-only mount**。Open Claw からの **改修許可は Phase 2 以降で別決裁**
- `dashboard/active-projects.md` は PRJ-019 起票案件（PRJ-020+）のみ追記可、他案件行への変更禁止
- `projects/PRJ-001〜018/` は **read-only**、書込試行は harness/fs_allowlist で reject

## 依存関係

- `claude-bridge/` — Claude Code subprocess spawn 経由で組織 skill を実行
- `harness/` — 全ての呼び出しに対して permission チェック
- `audit/` — orchestrator level の決定ログ

## 主要 API（W0 段階は I/F のみ、本実装は W2）

```typescript
interface OrchestratorAPI {
  requestCEO(intent: NewProjectIntent): Promise<CEOResponse>
  assignTask(role: Role, task: TaskAssignment): Promise<TaskResult>
  reviewProject(projectId: string): Promise<ReviewVerdict>
}

type Role = 'ceo' | 'secretary' | 'pm' | 'dev' | 'research' | 'review' | 'web-ops'
```

## 関連必須コントロール

G-12（既存 PRJ 副作用ゼロ証明）の中核。orchestrator が write 範囲を越えないことを `scripts/verify-zero-side-effect.sh` で継続検証。
