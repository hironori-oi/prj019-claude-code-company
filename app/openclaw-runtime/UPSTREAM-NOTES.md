# UPSTREAM-NOTES: Open Claw OSS / Enderfga openclaw-claude-code

- 作成日: 2026-05-02
- 作成者: Dev Agent (claude-code-company)
- タスク ID: CB-D-W0-02
- 取得方法: WebFetch（GitHub README）
- 用途: PRJ-019「Clawbridge（仮）」W0 上流仕様把握、CB-D-W0-04 実機 PoC 前の事前理解
- 注意: 本書は WebFetch 時点（2026-05-02）の上流情報。CB-D-W0-04 の実機 clone・起動 PoC 時に最新版で再確認する

---

## 1. github.com/openclaw/openclaw（本体）

### 1.1 基本情報

| 項目 | 内容 | 確認済 |
|---|---|---|
| 正式名 | OpenClaw | ✓ |
| 創業者 | Peter Steinberger | ✓ |
| ライセンス | MIT | ✓ |
| GitHub | github.com/openclaw/openclaw | ✓ |
| 公式 docs | docs.openclaw.ai | ✓ |
| 配布形態 | OSS（npm 配布、CLI + companion apps） | ✓ |

### 1.2 性質

- "a _personal AI assistant_ you run on your own devices"
- **Local-first gateway** — sessions / channels / tools / events をローカル制御
- **チャット駆動 UI**: WhatsApp / Telegram / Slack / Discord / Google Chat / Signal / iMessage + 15+ 追加プラットフォーム
- 音声機能（macOS/iOS の wake word、Android の continuous voice）
- Live Canvas（agent-driven visual workspace）
- companion apps（macOS / iOS / Android）

### 1.3 動作要件

- Node 24（または Node 22.14+）
- インストール: `npm install -g openclaw@latest`
- 推奨セットアップ: `openclaw onboard --install-daemon`

### 1.4 主要 CLI コマンド

| コマンド | 用途 |
|---|---|
| `/status`, `/new`, `/reset`, `/compact` | session 管理（chat 内） |
| `openclaw message send` | メッセージ送信 |
| `openclaw agent` | コアオペレーション |
| `openclaw pairing approve` | セキュリティ制御（pairing） |
| `openclaw doctor` | 診断 |
| `openclaw onboard --install-daemon` | デーモンインストール |

（リサーチ §2.3 で言及されていた `openclaw onboard --auth-choice openai-codex` 等の `--auth-choice` フラグは本 README サマリーには明示されず。CB-D-W0-04 で実機確認が必要）

### 1.5 サポート LLM プロバイダ

- 複数モデル対応、OpenAI（ChatGPT/Codex）はサブスクリプションオプションとして記載
- "current flagship model from the provider you trust" を選択する設計
- リサーチ §2.3 で言及された 3 ルート（API Key / Codex Subscription via PI / Native Codex App-Server）の詳細は **CB-D-W0-04 実機検証で公式 docs を確認**する必要あり

### 1.6 設定・セキュリティ

- 設定ファイル: `~/.openclaw/openclaw.json`
- DM ポリシー: 不明送信者には pairing codes 必須（デフォルト）
- ユーザーが sandboxing 設定 / allowlist 設定 / multi-agent routing 管理可能

### 1.7 ToS / プライバシー注意点

- README 上に明示的な ToS 制限記載なし（OSS のため上流自体の利用規約は MIT）
- **本案件で重要なのは「Open Claw 経由で使う LLM プロバイダ側の ToS」**:
  - **OpenAI（Codex Pro $100）**: research-supplement §4.6 で「third-party tool 経由 subscription 消費の明示禁止条項なし、現状黙認」
  - **Anthropic**: research-supplement §2.4 で「OAuth トークンを third-party tool に渡すこと」が明示的に禁止 → **本案件では Open Claw → Anthropic 直接接続は NG**、Claude 関連は claude-bridge（subprocess spawn）経由のみ
- DM polling / pairing codes は **本案件ではオーナー本人マシンでの dogfood なので問題なし**（第三者 DM 受信はしない設計）

### 1.8 W0 / Phase 1 着手前に CB-D-W0-04 で確認すべき項目

| # | 確認項目 | 関連必須コントロール |
|---|---|---|
| 1 | `openclaw onboard --auth-choice openai-codex` または `--device-code` で Codex Pro $100 OAuth が成功するか | OQ-01 検証 |
| 2 | Codex 5h ローリングウィンドウの残量取得方法（`/status` か内部 API か） | G-V2-02（レート自主上限 70%） |
| 3 | `~/.openclaw/openclaw.json` の Skill 定義方式、自前 skill 追加手順 | needs_scout / cost_check / emergency_stop / tos_monitor の実装方式 |
| 4 | `openclaw agent` の subprocess spawn 仕様、子プロセスへの env 引き渡しルール | G-07 / G-V2-11 secret 隔離 |
| 5 | DM polling の停止方法（dogfood では Slack 1 channel のみ使用） | G-V2-04 指示入力経路の単一化 |
| 6 | Live Canvas / companion apps の本案件での要否（不要なら disable） | スコープ削減 |
| 7 | OpenClaw skill レジストリの第三者 skill 取り込み制限（Trend Micro 報告のデータ exfiltration 系 skill 排除） | review v2 §10.4（Cisco 研究） |
| 8 | `openclaw doctor` の診断項目、CI で活用可能か | tests/ 統合テストでの活用 |

### 1.9 Phase 1 段階での fork / submodule 化判断

- **W0**: `vendor/openclaw/` 配下に clone のみ（`.gitignore` で除外）
- **Phase 1 W2 以降**: skill 拡張で fork が必要か判断、必要なら hironori-oi/openclaw-fork に fork + submodule 化
- **Phase 1 M3 以降**: hironori-oi/clawbridge private リポへの全体分離を検討（ADR-004）

### 1.10 取得 URL と取得日

- https://github.com/openclaw/openclaw（2026-05-02 取得、WebFetch）
- 公式 docs（CB-D-W0-04 で取得予定）: https://docs.openclaw.ai

---

## 2. github.com/Enderfga/openclaw-claude-code（参考実装）

### 2.1 基本情報

| 項目 | 内容 | 確認済 |
|---|---|---|
| 名前 | OpenClaw Claude Code Plugin | ✓ |
| 作者 | Enderfga | ✓ |
| 役割 | Claude Code CLI を "programmable bridge that turns coding CLIs into headless, agentic engines" に変換 | ✓ |
| ライセンス | （README サマリーで明示確認できず、CB-D-W0-04 で確認） | △ |

### 2.2 アーキテクチャ（**本案件の参考実装の核心**）

#### Subprocess 方式

- 各 engine（Claude Code / Codex / Gemini / Cursor Agent / Custom CLI）を **独立サブプロセス**として管理
- **stream-json NDJSON** 形式でイベント出力を解析
- → **本案件 claude-bridge/ の設計と完全一致**（P-D 改採用）

#### Persistent Session

- 最大 **7 日間のディスク TTL** で session 保持
- 再開時に context 復元
- → 本案件では **W0 段階では fresh session 主義**で開始、persistent は W2 以降検討

### 2.3 5 エンジン統合

| エンジン | 接続方式 |
|---|---|
| Claude Code | persistent subprocess、stream-json 対応 |
| OpenAI Codex | per-message one-shot |
| Google Gemini | per-message one-shot |
| Cursor Agent | per-message one-shot |
| Custom CLI | ユーザー定義可能 |

→ 本案件は **Claude Code（persistent subprocess、stream-json）+ OpenAI Codex（Open Claw 本体駆動）**の 2 エンジン構成。Gemini / Cursor / Custom は不要。

### 2.4 高度なオーケストレーション機能

| 機能 | 概要 | 本案件での採用 |
|---|---|---|
| **Multi-Agent Council** | git worktree で agent 隔離、"two-phase protocol (plan then execute)"、`[CONSENSUS: YES/NO]` タグ要求 | **Phase 2 で評価**（claude-code-company 既存組織モデルとの統合検討） |
| **Ultraplan** | "Dedicated Opus planning session for up to 30 minutes" で詳細実装計画を生成 | **Phase 2 で評価**（CEO/PM の長期計画作成への活用） |
| **Ultrareview** | "Fleet of 5-20 bug-hunting agents" が並列にレビュー | **Phase 2 で評価**（Review 部門の並列化） |

### 2.5 Tool セット

- **27 tools** — session lifecycle / operations / inbox / agent teams / council / ultraplan / ultrareview
- → 本案件では **claude-code-company 既存 skill 群（CEO/Secretary/Dev/Review/PM/Research/Web-Ops）**を優先利用、Enderfga の 27 tools は **概念参考**のみ

### 2.6 認証・免責事項（**最重要**）

- README 内に **OAuth / Pro / Max に関する明示的な認証委譲メカニズムや免責事項の記載なし**
- OpenAI 互換 API セクションでは "any API key (or leave blank)" と記載
- **各エンジン（Anthropic / OpenAI / Google）の認証は既存 CLI に委譲される想定**（本案件 P-D 改と完全一致）

### 2.7 本案件への適用

- claude-bridge/ 設計の **直接の参考実装**として活用
- subprocess spawn + stream-json parser のリファレンス実装として CB-D-W0-07 で参照
- ただし **fork / submodule 化はしない**（27 tools はオーバースペック、claude-code-company 既存 skill 群と方針異なる）
- **ライセンス確認は CB-D-W0-04 で実施**（MIT または Apache 2.0 でなければ採用検討再評価）

### 2.8 取得 URL と取得日

- https://github.com/Enderfga/openclaw-claude-code（2026-05-02 取得、WebFetch）

---

## 3. CB-D-W0-04（実機 PoC）で必ず確認すべき総合チェックリスト

| # | 確認項目 | 出典 |
|---|---|---|
| 1 | `npm install -g openclaw@latest` 成功（Node 24 or 22.14+） | §1.3 |
| 2 | `openclaw doctor` で環境健全性確認 | §1.4 |
| 3 | Codex Pro $100 device-code OAuth で `openclaw onboard` 成功 | §1.5、OQ-01 |
| 4 | `~/.openclaw/openclaw.json` の Skill 定義スキーマ確認 | §1.8 #3 |
| 5 | DM polling 全停止（Slack 1 channel のみ活性化） | §1.8 #5 |
| 6 | OpenAI 接続ルートの確定（`--auth-choice openai-codex` で OAuth 成功するか） | §1.5、§1.8 #1 |
| 7 | Codex 5h ローリングウィンドウ残量取得方法 | §1.8 #2 |
| 8 | Open Claw → Anthropic 直接接続を **disable**（claude-bridge subprocess 経由のみ強制） | review v2 §6 行 #5 |
| 9 | Live Canvas / Voice / companion apps を disable（dogfood 範囲外） | §1.2、§1.8 #6 |
| 10 | Enderfga/openclaw-claude-code のライセンス確認（MIT/Apache 2.0 必須） | §2.6 |

---

## 4. 既知の不確実性

### 4.1 リサーチ v1（research-openclaw-harness-investigation.md）と本書の差分

| 項目 | リサーチ v1 §2 | 本書 WebFetch（2026-05-02） | 差分 |
|---|---|---|---|
| プロダクト名遷移 | Clawdbot → Moltbot → OpenClaw | 名称遷移の記載なし | 上流 wikipedia / 二次情報での記載、本書では未確認 |
| GitHub Stars | 347,000（2026/04 時点、KDnuggets） | 本書 WebFetch では未確認 | 上流情報の信頼度確認は CB-D-W0-04 で再取得 |
| インターフェース | (1) CLI、(2) macOS メニューバー、(3) チャット 50+ 統合 | (1) CLI、(2) companion apps（macOS/iOS/Android）、(3) 15+ プラットフォーム | 数値・対応プラットフォーム数に差分あり、最新版で再確認 |
| `--auth-choice` フラグ | `openclaw onboard --auth-choice openai-codex` 明示記載 | README サマリーで `--install-daemon` のみ明示 | 公式 docs `docs.openclaw.ai` で再確認必要 |

### 4.2 CB-D-W0-04 で再取得する情報源

- https://docs.openclaw.ai/providers/openai
- https://github.com/openclaw/openclaw/blob/main/docs/providers/openai.md（リサーチ §2.3 で URL 言及）
- https://github.com/openclaw/openclaw（最新 README、リリースノート）
- https://github.com/Enderfga/openclaw-claude-code（最新 README、ライセンスファイル）

---

## 5. 関連必須コントロール

- **G-V2-04**（指示入力経路の単一化）: Open Claw → claude-bridge → claude -p の経路を物理強制
- **G-V2-11**（OAuth トークン到達禁止）: Open Claw プロセス空間に Anthropic OAuth トークンを到達させない
- **G-07**（secret 隔離 microVM）: Open Claw 起動時の env 制御を厳格化
- **HR-01**（Codex サブスク濫用回避）: 5h ローリングウィンドウ 70% 上限を技術強制

---

## 6. 関連ドキュメント

- 本案件 W0 計画: `projects/PRJ-019/reports/dev-phase1-w0-implementation-plan.md`
- 接続方式根拠: `projects/PRJ-019/reports/research-supplement-tos-and-subscription-paths.md`
- 徹底調査: `projects/PRJ-019/reports/research-openclaw-harness-investigation.md`
- WBS 正本: `projects/PRJ-019/reports/pm-architecture-v2-and-phase1-plan.md`

---

**v1 作成**: 2026-05-02 ／ **次回更新**: CB-D-W0-04（実機 PoC）完了時に v2 で実装詳細を反映
