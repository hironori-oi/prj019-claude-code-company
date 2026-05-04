# openclaw-runtime/ — Open Claw OSS ランタイム層

## 責務

[github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)（MIT、Peter Steinberger 作）を**自前ホスト**で実行する層。ChatGPT Codex Pro $100 サブスク（OQ-01 確定）の device-code OAuth で認証し、`openai-codex/gpt-5.5` モデルを駆動する。

ニーズ判定（needs_scout）/ コスト確認（cost_check）/ 緊急停止（emergency_stop）/ ToS 監視（tos_monitor）の各 skill の実行コンテナ。

## 入力

- オーナー Slack コマンド（`/clawbridge run-benchmark` 等）
- cron スケジュール（HN/PH/GitHub Trending 監視）

## 出力

- claude-bridge/ への subprocess spawn 指示（prompt + opts）
- harness/ への監視イベント
- audit/ への決定ログ

## 認証方針

- **ChatGPT Pro $100 device-code OAuth**（OQ-01 確定、5x usage tier、Plus 比 5 倍）
- Anthropic は **絶対に直接叩かない**。Claude 関連は claude-bridge 経由のみ
- Codex プランには embeddings が含まれないため、別途 `OPENAI_API_KEY` で `text-embedding-3-small` を有効化（数セント/月）

## 依存関係

- `vendor/openclaw/` — github.com/openclaw/openclaw を clone（CB-D-W0-04、`.gitignore` 推奨）
- `claude-bridge/` — subprocess spawn 経由で Claude Code 駆動
- `harness/` — 全 skill 実行前後フック
- `audit/` — 全 skill 実行ログ

## W0 段階の到達目標

- CB-D-W0-02: 上流 README/docs を WebFetch で取得、`UPSTREAM-NOTES.md` に記録
- CB-D-W0-04: 実機 git clone + 起動 PoC（Codex Pro $100 device-code OAuth まで）

## 上流情報

- 公式: https://github.com/openclaw/openclaw（MIT）
- 接続例: https://github.com/Enderfga/openclaw-claude-code（5 エンジン統合、subprocess spawn 方式）
- 詳細仕様は `UPSTREAM-NOTES.md` 参照

## 関連必須コントロール

G-V2-04（指示入力経路の単一化、Open Claw → claude-bridge → claude -p 経路を強制）／ HR-01（OpenAI Codex サブスク濫用回避、5h ローリングウィンドウ 70% 上限）

## fork / submodule 化の判断

- **W0**: vendor/ 配下に clone のみ（`.gitignore` で除外）
- **Phase 1 W2 以降**: fork（hironori-oi/openclaw-fork）+ submodule 化を検討
- **Phase 1 M3 以降**: hironori-oi/clawbridge private リポへの分離を検討（ADR-004）
