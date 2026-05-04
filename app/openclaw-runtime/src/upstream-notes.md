# openclaw-runtime — 上流調査メモ (Dev 視点)

- 作成日: 2026-05-03
- 作成者: Dev Agent (PRJ-019, W0-Week2 ブートストラップ)
- 関連: `../UPSTREAM-NOTES.md` (Phase 0 で作成、本書は Dev W0-Week2 視点での実装着眼点を要約)
- 対象: Phase 1 W1〜W2 で `RealOpenclawRuntime` を実装するための事前メモ

## 1. 上流リポジトリ

| リポジトリ | 用途 | Phase 1 での扱い |
|---|---|---|
| `github.com/openclaw/openclaw` (本体) | OpenClaw OSS 本体 (CLI + companion apps) | **parts only** 利用。`openclaw agent --headless` 相当 + skill 定義のみ |
| `github.com/Enderfga/openclaw-claude-code` v2.14.1 (2026-04-29) | Claude Code を headless 化する連携プラグイン | **第一参考実装**。subprocess + stream-json NDJSON 部分を流用 |

R-019-12 (上流変更追従コスト) を踏まえ、本案件では「OSS は personal AI assistant 化したため第一級ユースケースとして示されていない」前提で、本体への依存を最小化する。

## 2. Phase 1 で必要な OSS API surface (W1 実装着手前の確認項目)

| API / 機能 | 必要度 | 確認方法 |
|---|---|---|
| `openclaw agent` subprocess 起動 | 必須 | CB-D-W0-04 実機 PoC |
| stream-json (NDJSON) イベント仕様 | 必須 | Enderfga 連携プラグインの `stream-parser.ts` 参照 |
| skill 定義スキーマ (`~/.openclaw/openclaw.json`) | 必須 | UPSTREAM-NOTES §1.6 |
| `--auth-choice openai-codex` フラグ | 必須 | 公式 docs `docs.openclaw.ai/providers/openai` で再確認 |
| Codex 5h ローリングウィンドウ残量取得 | 強推奨 | 内部 API か `/status` 経由かは実機検証 |
| DM polling 全停止 (Slack 1 channel のみ) | 必須 | 設定ファイル経路で disable |
| Live Canvas / Voice / companion apps disable | 必須 | スコープ外、起動時 disable |

## 3. buy / build 判断ポイント

| コンポーネント | buy (上流流用) | build (自前) | W0-Week2 での判断 |
|---|---|---|---|
| subprocess spawn + stream-json 解析 | ◎ (Enderfga) | ○ (claude-bridge) | claude-bridge と上流を **両方** 持ち、最終的に共通モジュール化（W2 後半） |
| skill 定義 / 27 tools | △ (オーバースペック) | ◎ | claude-code-company 既存 skill を流用、上流 27 tools は **概念参考**のみ |
| Multi-Agent Council / Ultraplan / Ultrareview | ✗ (Phase 2 評価) | — | Phase 1 では採用しない |
| Persistent Session 7 day TTL | △ | ◎ (fresh session 主義) | W0 段階では fresh session、Persistent は W2 以降検討 |

## 4. 上流変更追従戦略

- **W0-W2**: vendor/ 配下に clone のみ (`.gitignore` で除外、現行運用継続)
- **W2-Week2 以降**: `~/.openclaw/openclaw.json` の skill schema 変更を WebFetch で月次監視 (`research-w0-supplement-op1-op5.md` のリリースノート監視に統合)
- **Phase 1 M3 以降**: skill 拡張で本格的に fork が必要なら `hironori-oi/openclaw-fork` に fork + submodule 化 (ADR-004 で決裁)

## 5. interface contract (W0 提供分)

```ts
interface OpenclawRuntime {
  init(config: OpenclawConfig): Promise<void>
  runLoop(needSummary: string): Promise<LoopResult>
  shutdown(): Promise<void>
  getStatus(): LoopStatus
}
```

W0 では `MockOpenclawRuntime` のみ実装。`RealOpenclawRuntime` はインスタンス化時 `not implemented` を throw して Phase 1 W1 で本格着手する。

## 6. 関連必須コントロール

- **G-V2-04** (指示入力経路の単一化): `runLoop` から claude-bridge 経由でしか Claude を呼べない設計を physical 化
- **G-V2-11** (OAuth トークン到達禁止): `OpenclawConfig.envAllowList` に `ANTHROPIC_API_KEY` / `CLAUDE_CODE_OAUTH_TOKEN` を含めない (型 / lint / runtime 3 重保護)
- **G-07** (secret 隔離 microVM): `envAllowList` に列挙された env のみ subprocess へ伝搬、それ以外は default 拒否

## 7. 関連ドキュメント

- 包括的な上流仕様メモ: `../UPSTREAM-NOTES.md`
- W0 計画書: `../../../reports/dev-phase1-w0-implementation-plan.md`
- アーキテクチャ正本: `../../../reports/pm-architecture-v2-and-phase1-plan.md` §3.2
- ToS / 接続方式根拠: `../../../reports/research-supplement-tos-and-subscription-paths.md`

---

**v1**: 2026-05-03 ／ **次回更新**: CB-D-W1-XX (RealOpenclawRuntime 着手前)
