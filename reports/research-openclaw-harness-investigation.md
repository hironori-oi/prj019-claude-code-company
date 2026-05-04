# PRJ-019 Phase 0 徹底調査レポート: Open Claw を自律オーナーとする AI 組織ハーネス基盤

- 案件: PRJ-019「Clawbridge（仮）」
- 部署: リサーチ部門
- 調査日: 2026-05-02
- 調査者: Research Agent (claude-code-company)
- 対象: Open Claw / Clawbro / Codex / Claude Code を組み合わせた自律オーケストレーション基盤の Phase 0 要件・リスク整理

> 凡例（情報信頼度ラベル）:
> - 公式: ベンダー公式サイト・公式 docs・プレスリリース
> - 半公式: ベンダー公式 GitHub の内容、ベンダー社員の SNS 公式投稿
> - 二次: 第三者メディア・ブログ（複数の独立ソースで裏が取れたもの）
> - コミュニティ: 個人ブログ・フォーラム発言（裏取り 1 ソースのみ）
> - 推測: 本レポート作成者の推論（事実ではない）

---

## 1. エグゼクティブサマリー

オーナー要望の中核「Open Claw を自律オーナーとして claude-code-company を稼働させる」は **2026-05 時点でアーキテクチャ的には実装可能**だが、**契約・課金・ToS の三重制約**で現状のままでは「ChatGPT Codex x5 サブスクで Claude Code を駆動」の組み合わせが**そのままでは合法に成立しない**。

調査により判明した最重要事実は次の 4 つ:

1. **Open Claw（OpenClaw）の正体は確定**: Peter Steinberger（PSPDFKit 創業者、現 OpenAI）が作った MIT ライセンスの OSS エージェントフレームワーク（github.com/openclaw/openclaw）。ローカル実行・BYOK 型・メッセージングプラットフォーム経由 UI。**clawbro.ai は OpenClaw のマネージド・クラウド・ホスティング業者**であり OpenClaw 公式とは別法人（公式アフィリエーションを否定）。「Open Claw を Codex サブスクで動かす」は OpenClaw の `openai-codex` プロバイダ機能で**技術的に可能**（公式 docs に明記）。
2. **Anthropic ToS 制約（最重要障壁）**: 2026 年 2 月以降、Claude Pro/Max のサブスク OAuth トークンを Claude Code 以外の第三者ツール（Agent SDK 含む）から駆動することは **明示的に ToS 違反**。「Open Claw が Claude Code を駆動」を**サブスクの Claude Pro/Max で動かそうとすると違反**。**API キー（従量課金）経由なら OK**。これは公式 docs `code.claude.com/docs/en/legal-and-compliance` に明文化されている。
3. **OpenAI ToS は曖昧**: ChatGPT Plus/Pro の Codex CLI を「Sign in with ChatGPT」で第三者ツール（OpenClaw 等）から駆動することについて、Anthropic ほど明示的な禁止文言はない（GitHub Discussion #8338 で公式回答未取得との報告あり）。サブスクは「ordinary, individual usage」想定で、24/7 自律稼働は灰色〜黒寄り。
4. **コスト構造の不都合な真実**: ChatGPT Codex x5（おそらく Pro $200×5=$1,000/月、または Plus $20×5=$100/月）契約済みでも、**Claude Code を Anthropic API キーで回す部分の従量課金は別途必要**（Sonnet 4.6 入力 $3/1M、出力 $15/1M）。アプリ 1 本完成までに 100M 以上のトークン消費は普通で、**月 $500〜$3,000 の Anthropic 課金が現実レンジ**。さらにサンドボックス（Vercel Sandbox / E2B）と Vercel デプロイで $50〜$200。

**結論（実現可能性の総合評価）**: 「Codex サブスクで Open Claw が動き、Anthropic API キーで Claude Code を駆動する」というハイブリッド構成なら**完全合法かつ実装可能**。「Codex サブスクで Open Claw も Claude Code も全部回す」という最も安価な組み合わせは**Anthropic ToS で確実に NG**、OpenAI 側も grey で推奨できない。

**推奨次アクション（詳細は§11）**: ① ハイブリッド構成（Codex サブスク + Anthropic API キー）で PoC、② Vercel Sandbox による生成コード隔離、③ オーナー承認ゲート必須化（自動公開禁止）、④ 月次コスト上限ハードキャップ、⑤ Devin / OpenHands を比較検討（自前ハーネス構築コストと商用 SaaS 利用の TCO 比較）。

最大の障壁 Top 3:
1. **Anthropic ToS（OAuth 第三者駆動禁止）** → API キー必須 → コスト爆増
2. **自律エージェントが第三者権利侵害コード/有害アプリを生成した場合の責任主体不明確（日本法）**
3. **「ニーズの高いアプリを Web から自動判断」の評価関数設計と Reddit Data API 商用ライセンス問題（GummySearch 倒産事例）**

---

## 2. Open Claw / Clawbro の正体と機能（A 群調査）

### 2.1 OpenClaw（プロダクト本体）

| 項目 | 内容 | 信頼度 |
|---|---|---|
| 正式名 | OpenClaw（旧 Clawdbot → Moltbot → OpenClaw） | 公式 |
| 創業者 | Peter Steinberger（@steipete、Austrian、PSPDFKit 元 CEO、2026/02 に OpenAI 入社、プロジェクトは OSS Foundation 化） | 二次（Wikipedia・Fortune・36Kr） |
| ライセンス | MIT | 公式（GitHub） |
| GitHub | github.com/openclaw/openclaw | 公式 |
| 公式サイト | openclaw.ai | 公式 |
| 言語 | TypeScript + Swift | 公式 docs |
| 動作環境 | Mac / Windows / Linux / Raspberry Pi / セルフホスト Cloud | 公式 |
| インターフェース | (1) CLI（`curl -fsSL https://openclaw.ai/install.sh | bash`）、(2) macOS メニューバー companion app（β、macOS 15+）、(3) チャット連携（Telegram/Discord/Signal/WhatsApp/Slack/iMessage 等 50+ 統合） | 公式 |
| LLM プロバイダ | Anthropic Claude / OpenAI / Google / DeepSeek / ローカル（Ollama 等）。BYOK 統一 IF + ClawRouter 自動ルーティング | 公式 docs |
| GitHub Stars | 2026/04 時点で 347,000（GitHub 史上最速級） | 二次（KDnuggets） |

**重要**: OpenClaw は「エージェント・ハーネス＋スキル・レジストリ＋メッセージング・ゲートウェイ」の 3 層構造。コアは「LLM をローカルでラップして OS / API / ブラウザを操作させる」エージェントランタイム。OpenClaw 自体は LLM ではなく**ハーネスフレームワーク**である。

### 2.2 ClawBro（clawbro.ai）の正体

- **OpenClaw のマネージド・クラウド・ホスティング業者**。OpenClaw 本体とは**別法人**で、公式に「OpenClaw コアチームおよび第三者 AI プロバイダとの提携を否定」と footer に明記（公式: clawbro.ai）。
- 提供物: OpenClaw を VPS 風の Private Container で動かすホスティング。LITE $16/月、PRO $33/月、MAX $66/月（年払い 43-44% OFF）。各プランに $2 の AI クレジット同梱。
- 運営会社・所在地: 公式サイト記載なし。© 2026 ClawBro のみ。
- **オーナーの「Open Claw を Codex サブスクで動かす」要望に ClawBro を使う必要は必ずしもない**。ローカル PC / 自前 VPS / EC2 / Vercel 等で自前ホスティング可能（OSS なので）。ClawBro は「セットアップ手間を省きたい」場合の便利層。

### 2.3 Codex プロバイダの実装詳細（OpenClaw 公式 docs より）

OpenClaw は **OpenAI 接続を 3 ルート**サポート（公式 docs `docs.openclaw.ai/providers/openai`、`github.com/openclaw/openclaw/blob/main/docs/providers/openai.md`）:

1. **API Key（BYOK）**: `OPENAI_API_KEY` で従量課金。コマンド: `openclaw onboard --auth-choice openai-api-key`
2. **Codex Subscription via PI（標準ランナー経由）**: ChatGPT/Codex サインインして `openai-codex/*` モデル ID で利用。コマンド: `openclaw onboard --auth-choice openai-codex` または device-code 認証 `openclaw models auth login --provider openai-codex --device-code`
3. **Native Codex App-Server**: ChatGPT/Codex サブスク + `agentRuntime.id: "codex"` で Codex の app-server 経由実行（OpenClaw が推奨）

サポートモデル（公式 docs 抜粋、2026-04 時点）:
- `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- `openai-codex/gpt-5.5`, `openai-codex/gpt-5.4-mini`
- `openai/gpt-image-2`, `openai/gpt-image-1.5`, `openai/sora-2`

**重要な落とし穴**（コミュニティ報告: Wes Bos / @wesbos on X）: **Codex プランには embeddings（埋め込み）が含まれない**。OpenClaw のメモリ検索機能を使うには別途 OpenAI API キーで `text-embedding-3-small` を有効化する必要あり（数セント/月レベルの追加コスト）。

### 2.4 「Codex サブスクで動かす」の意味の確定

オーナーの「ChatGPT Codex x5 サブスクで Open Claw を動かす」は技術的には**ルート 2 または 3** に該当。
- 「x5」は **ChatGPT Pro $100 プラン**（5x usage）または **5 アカウント分の契約**のいずれか不明（オーナー確認推奨）。後述の通り、5 アカウント分を 1 個の自律エージェントから並列駆動するのは ToS 観点で危険度が上がる。

### 2.5 ChatGPT Codex（OpenAI）と OpenClaw の関係

**両者は完全に別物**:
- ChatGPT Codex = OpenAI の AI コーディングパートナー（CLI / Cloud / IDE 拡張）。ChatGPT サブスクに含まれる。
- OpenClaw = Steinberger 作の OSS 汎用エージェント。Codex を**バックエンドの 1 つとして利用可能**（上記 3 ルート）。

---

## 3. ChatGPT Codex サブスクプランの利用条件と ToS（B 群）

### 3.1 プラン体系（2026-05 時点、公式: developers.openai.com/codex/pricing, openai.com/codex）

| プラン | 月額 | Codex 利用枠（5 時間ウィンドウ） |
|---|---|---|
| Free | $0 | なし |
| Go | $8 | 限定 |
| Plus | $20 | 標準 1x |
| Pro $100（新設、2026-04） | $100 | 5x（5/31 までキャンペーンで 10x） |
| Pro $200 | $200 | 20x（5/31 までキャンペーンで 25x） |
| Business | $30/user | 標準 |
| Enterprise | カスタム | カスタム |

- 2026-04-02: Codex 課金がメッセージ単位 → API トークン単位に変更（input/cached input/output で credits 計算）。
- 5 時間ローリングウィンドウで credit 消費上限到達 → ウィンドウ切り替えまで利用不可（公式 Help Center）。
- Codex CLI で `/status` コマンドにより残量確認可能。

### 3.2 OpenAI ToS の「自動化エージェント」条項（公式: openai.com/policies/service-terms、ただし WebFetch 403 ブロック）

**コミュニティ報告ベース（裏取り 2 ソース）**:
- ChatGPT サブスクは「ordinary, individual usage」を想定。
- 「Sign in with ChatGPT」OAuth を**第三者ツール（OpenClaw 等）から使う**ことについて、Anthropic ほど明文化された禁止条項は**未発見**。
- GitHub Discussion `openai/codex#8338` で「Anthropic と異なり、OpenAI から明示的な許諾文言が出ていない」とユーザーが指摘、公式回答なし（2026-04 時点）。
- Codex 公式 Authentication docs では「device-code 認証は headless / リモート環境での利用」を**公式にサポート**しており、自動化用途を排除していない（`developers.openai.com/codex/auth`）。

**Research 部門の解釈（推測ラベル）**: OpenAI 側は OpenClaw 経由 Codex 利用を**現状黙認**しているが、**24/7 自律エージェントとして 5 アカウントを並列稼働させて意図的に枠を増やす**のはサブスク濫用と判断されるリスクあり（Anthropic と同じパターンを辿る可能性）。Pro $200 に統合する方が長期的に安全。

### 3.3 Codex CLI のセキュリティ・サンドボックス機構（公式: developers.openai.com/codex/concepts/sandboxing）

Codex CLI 自体が**ハーネス機能を内蔵**:
- **Sandbox mode**（OS レベル）: macOS は Seatbelt（`sandbox-exec`）、Linux は bwrap + seccomp。
- **Approval policy**: `read-only` / `workspace-write` / `danger-full-access` × `untrusted` / `on-request` / `on-failure` / `never`
- **Auto preset**: `--sandbox workspace-write --ask-for-approval on-request` が推奨。Network access はデフォルト遮断、要時のみ承認要求。
- v0.124.0（2026-04-23）で hooks が stable 化。

**本件への含意**: Codex CLI を Open Claw から駆動する場合、Codex 側の sandbox / approval も**ハーネスのレイヤーとして利用可能**。ただし `never` ＋ `danger-full-access` で全自動化すると Anthropic OAuth と同様の濫用と見なされるリスク。

---

## 4. Claude Code 側の自動化受け入れ（C 群）

### 4.1 Claude Code Headless Mode と Agent SDK（公式: code.claude.com/docs/en/headless）

- 旧名「headless mode」、現在は「Agent SDK の CLI モード」と統合（Anthropic 公式ノート）。
- 基本構文: `claude -p "プロンプト" --allowedTools "Read,Edit,Bash"`
- 主要フラグ:
  - `--bare`: hooks/skills/plugins/MCP/CLAUDE.md 自動読み込みをスキップ → CI 向け（推奨、将来 `-p` のデフォルトになる予定）
  - `--allowedTools`: ツール許可リスト（permission rule syntax 対応）
  - `--permission-mode`: `acceptEdits` / `dontAsk`
  - `--output-format`: `text` / `json` / `stream-json`（NDJSON）
  - `--json-schema`: 構造化出力（schema 適合）
  - `--continue` / `--resume <session_id>`: 会話継続
  - `--append-system-prompt` / `--system-prompt`: システムプロンプト操作
  - `--mcp-config`, `--agents`, `--plugin-dir`, `--settings`: 外部リソース注入

- **認証**: `--bare` モードでは OAuth/keychain を読まず、`ANTHROPIC_API_KEY` または `apiKeyHelper` 必須 → 自動化用途では API キー認証が**標準ルート**。

- **stream-json** で `system/api_retry` イベント、`system/init` イベント、`stream_event` (text_delta) などを受信可能 → 親エージェントから token 単位で監視可能。

### 4.2 Anthropic ToS の決定的禁止条項（公式: code.claude.com/docs/en/legal-and-compliance、原文抜粋）

> **OAuth authentication** is intended exclusively for purchasers of Claude Free, Pro, Max, Team, and Enterprise subscription plans and is designed to support ordinary use of Claude Code and other native Anthropic applications.
>
> **Developers** building products or services that interact with Claude's capabilities, including those using the Agent SDK, should use API key authentication through Claude Console or a supported cloud provider. **Anthropic does not permit third-party developers to offer Claude.ai login or to route requests through Free, Pro, or Max plan credentials on behalf of their users.**
>
> Anthropic reserves the right to take measures to enforce these restrictions and may do so without prior notice.

**含意**:
- Open Claw が Claude Code を駆動する場合、**Anthropic API キー認証必須**（Claude Pro/Max OAuth は使えない）。
- 2026-02 に Boris Cherny（Anthropic Claude Code 責任者）が「$200/月 Max サブスクで $1,000-$5,000 相当のエージェント計算が回されていた」と発言、ポリシー強化の引き金（出典: PYMNTS, The Register）。
- 違反時の制裁措置は「事前通知なし」と明記 → アカウント BAN リスク実存。

### 4.3 OpenClaw → Claude Code 駆動の既存実装

| プロジェクト | 概要 | URL | 信頼度 |
|---|---|---|---|
| **openclaw-claude-code** (Enderfga) | OpenClaw plugin、Claude Code CLI を programmable headless engine 化。Claude Code / Codex / Gemini / Cursor Agent / Custom CLI の 5 エンジンを統一 ISession IF で抽象化。27 tools 公開、persistent session 7-day TTL、stream-json、git worktree 隔離、council / consensus 投票、ultraplan / ultrareview ワークフロー | github.com/Enderfga/openclaw-claude-code | 半公式 |
| **ClaudeClaw** (Mark Craddock) | OpenClaw 風自律エージェントを Claude Code ネイティブ機能で再構築。Gateway = `claude -p` ヘッドレス、Skills = `.claude/skills/`、Multi-Agent = Agent Teams (v2.1.32+)、Event Bus = HTTP hooks。Telegram/Discord ネイティブ（v2.1.80）、worktree 隔離、`maxTurns` / `disallowedTools` / `effort` で resource 制御 | medium.com/@mcraddock | 二次 |
| **OpenHarness** (HKUDS) | Open Agent Harness with Built-in Personal Agent (Ohmo) | github.com/HKUDS/OpenHarness | 半公式 |

**含意**: 「OpenClaw → Claude Code」連携は**既に 2026 年初頭に複数の OSS で実装済み**。本件は完全な独自開発ではなく、既存パターンの応用が可能。

---

## 5. ハーネスエンジニアリング理論と OSS/商用事例（D 群）

### 5.1 定義（公式: openai.com/index/harness-engineering、二次: Martin Fowler 2026-04 essay, Addy Osmani）

> Harness engineering is everything surrounding an AI model, except the model itself.（Fowler 定義）

5 つの柱（`github.com/ai-boost/awesome-harness-engineering`）:
1. **Tool orchestration**（どのツールを、どう呼ばせるか）
2. **Permission scoping**（ファイル / ネットワーク / シェル / シークレット）
3. **Memory & context**（短期 / 長期 / プロンプトキャッシュ）
4. **Observability**（trace / replay / audit log / cost tracking）
5. **Recovery**（rollback / circuit breaker / human-in-the-loop）

### 5.2 ベンダー比較（公式: thenewstack.io/ai-agent-harness-pricing-split, epsilla.com）

| ベンダー | ハーネス哲学 | 課金モデル |
|---|---|---|
| **Anthropic** | Claude Code が built-in harness。permission モデル + hooks + multi-session。MCP（Model Context Protocol）でツール抽象化。**ローカル実行 + MCP 接続**が中心 | API トークン従量課金（Sonnet 4.6 $3/$15、Opus 4.7 $5/$25）+ サブスクは個人利用限定 |
| **OpenAI** | Codex CLI に sandbox 内蔵（Seatbelt / bwrap）。**workspace / cloud storage / output path を sandbox プロバイダから decoupling**（1 行で sandbox 切替可能、Vercel Sandbox / E2B / Daytona / Modal を選択） | サブスク $20-$200 + Codex は ChatGPT plan に従属 |
| **Microsoft** | Azure AI Foundry Agent Service | Azure 課金 |
| **Google** | Vertex AI Agent Builder + Gemini | Vertex 課金 |

### 5.3 サンドボックス比較（D-2、本件で重要）

| プラットフォーム | 隔離技術 | 起動時間 | セッション上限 | 価格（2026-05） | BYOC | リージョン |
|---|---|---|---|---|---|---|
| **Vercel Sandbox** | Firecracker microVM | 数秒 | Pro 5 時間 | Hobby 無料（5 CPU 時間 / 420 GB-hr / 5,000 sandbox/月）、Pro $0.128/CPU-hr + $0.0106/GB-hr + $0.15/GB net + $0.60/M sandbox creations | 不可 | iad1（US East）のみ |
| **E2B** | Firecracker microVM | 数秒 | Pro 24 時間 | Hobby 無料 + $100 一回限りクレジット、Pro $150/月（20+ concurrent） | 可（一部） | 複数 |
| **Daytona** | Docker container | sub-90 ms | persistent + auto-stop/archive | usage-based | 可 | 複数 |
| **Modal** | gVisor + Firecracker | 〜1 秒 | 〜24h | usage-based | 可 | 複数 |

**推奨アーキテクチャ**（公式: Vercel KB / Northflank blog）:
> The agent harness and its secrets live in one security context (such as a Vercel Function) while generated code executes in a separate sandbox with no access to agent secrets.

→ **本件への適用**: Open Claw + Claude Code（ハーネス層）はオーナーの PC / VPS で動かし、**生成された Web アプリのビルド・テストは Vercel Sandbox / E2B 等の別 microVM で実行**。Open Claw の API キーが生成コードに読まれない構造を強制。

### 5.4 Permission Scoping パターン（Anthropic 流）

Claude Code のツールゲーティング（公式 docs より総合）:
- ツール ~40 種類を独立にゲート
- 3 段階: ① プロジェクトロード時の trust 確立、② 各 tool call 前の permission チェック、③ 高リスク操作（rm -rf 等）の明示的確認
- `--allowedTools` で prefix 一致パーミッション（例: `Bash(git diff *)` は `git diff` 始まりの Bash 全てを許可、空白 `*` の前後で `git diff-index` をマッチさせない注意）
- `--permission-mode dontAsk`: `permissions.allow` ＋ read-only コマンドセット以外を**全拒否**（CI のロックダウン用）
- `--permission-mode acceptEdits`: ファイル書き込み・mkdir/touch/mv/cp 自動承認、シェル・ネットワークは要許可

### 5.5 自律エージェント関連 OSS / 商用ツール

| 名称 | 種別 | 概要 | 本件への参考度 |
|---|---|---|---|
| AutoGPT | OSS | 第一世代、現代では参考程度 | 低 |
| BabyAGI | OSS | Task queue 系 | 低 |
| OpenDevin / OpenHands | OSS | Devin OSS 版、SWE-bench 上位 | **高** |
| Aider | OSS | git ベース AI ペアプロ | 中 |
| Claude Computer Use | 公式 API | スクリーンショット → アクション | 中 |
| Claude Agent SDK | 公式 SDK | Python/TS 用、Claude Code と同等の loop | **高** |
| Anthropic Skills | 公式 | `.claude/skills/` ディレクトリ、Skill = 再利用可能専門知識 | **高** |
| Devin（Cognition） | 商用 | Linux sandbox + browser + terminal、SWE-bench 13.86%、v3.0（2026）で動的再計画 | **高（参考）** |
| Replit Agent 3 | 商用 | Web IDE 統合、低価格 | 中 |
| Cursor Composer Background Agent | 商用 | バックグラウンドタスク | 中 |
| Cognition Devin | 商用 | $500/月～、autonomous | 高 |

---

## 6. ニーズ判定自動化（E 群）

### 6.1 市場リサーチ自動化アプローチ

| データソース | API/手段 | コスト | 注意 |
|---|---|---|---|
| Reddit | Reddit Data API（商用ライセンス必須）| 高額（**GummySearch が 2025/11 にライセンス取得失敗で倒産、$35K MRR**） | **要法務** |
| Hacker News | 公式 Firebase API（無料）| 無料 | OK |
| Product Hunt | API + RSS | 無料〜中 | OK |
| X (Twitter) | Enterprise API | 高額 | 個人で困難 |
| Google Trends | 非公式 API（pytrends）or 有料 SerpAPI | 中 | レート制限 |
| GitHub Trending | scraping or GitHub API | 無料 | OK |
| npm / PyPI | 公式 API | 無料 | OK |

### 6.2 既存ツール参考（複数の独立ソースで確認）

- **WorthBuild**: Google Trends + Reddit + 競合トラフィック + Funding DB → 検証レポート 2 分
- **idea-reality-mcp** (mnemox-ai): GitHub / HN / npm / PyPI / Product Hunt / SO スキャン → 0-100 reality score、MCP server、290+ stars → **本件で OpenClaw / Codex の MCP として直接利用可能**
- **Trending Needs Analyzer**: Reddit / HN / GitHub のリアルタイム hot content
- **PainBase / ProductGapHunt / Validator AI / IdeaProof**: SaaS 検証カテゴリ群

### 6.3 ニーズ判定スコアリング設計（推奨）

```
score = w1 * 市場規模(検索ボリューム/月)
      + w2 * 競合密度の逆数(GitHub stars / npm DL の競合上位)
      + w3 * 実装難易度の逆数(LLM が分解した工数)
      + w4 * 法務リスクの逆数(法令・規約抵触ペナルティ)
      + w5 * 自社実装適合度(Next.js + Supabase で実現可能か)
```

**重要**: GummySearch 倒産の教訓 → Reddit Data API は商用ライセンスを取らないと使えない。**HN / Product Hunt / GitHub Trending を中心に組み立てる**のが安全。

---

## 7. 自律開発オーケストレーション事例（F 群）

| 事例 | アーキテクチャ | 本件転用ポイント |
|---|---|---|
| **Devin (Cognition v3)** | Linux sandbox + terminal + editor + browser + 動的再計画 | sandbox + browser を持たせる構造、再計画ロジック |
| **OpenHands** | OSS Devin、SWE-bench 高スコア | アーキテクチャを直接参考、コード参照可 |
| **Replit Agent 3** | クラウド IDE 統合 | UI（Web ベース監視）参考 |
| **SWE-agent (Princeton)** | ACI (Agent-Computer Interface) で抽象化 | ツールセットの粒度設計 |
| **AutoCodeRover** | リポジトリ構造解析 + 修正 | バグフィックスループ |
| **Aider** | git diff ベース | コミット粒度の参考 |
| **Multi-Agent Council**（Enderfga 実装） | Planner / Generator / Evaluator + consensus 投票 + worktree 隔離 | 本件「組織」コンセプトに直結 |

**Research 部門の推奨**: 本件は **claude-code-company の既存組織モデル（CEO / PM / Dev / Review 等）を multi-agent council として実装**できる。Open Claw が CEO の上に座り、CEO 経由で各部署エージェントを動かす形。Enderfga の openclaw-claude-code が既にこの構造を提供しているため、forkして claude-code-company の skill 群と接続する道筋が現実的。

---

## 8. 通知・介入インターフェース（G 群）

### 8.1 通知先候補

| 手段 | 実装難度 | 実装方法 |
|---|---|---|
| **Slack** | 低 | Incoming Webhook + Slack App、OpenClaw 標準対応 |
| **Discord** | 低 | OpenClaw v2.1.80 ネイティブ |
| **Telegram** | 低 | OpenClaw v2.1.80 ネイティブ |
| **LINE** | 中 | LINE Messaging API、日本オーナー向けに有用 |
| **Email** | 低 | Resend / SendGrid |
| **iOS Push** | 中 | Expo Push Notifications（オーナーが iOS 中心なら） |
| **専用ダッシュボード（Next.js）** | 中 | Vercel + Supabase でリアルタイム監視 UI |

### 8.2 緊急停止・介入

- **必須機能**:
  - 全エージェント即時停止スイッチ（kill switch）
  - コスト上限ハードキャップ（API キー側 + Anthropic Console / OpenAI Platform 側で設定可能）
  - 監査ログ全件保存（Supabase / S3）
  - 重要操作の human-in-the-loop ゲート（GitHub force push / Vercel prod deploy / 課金操作）

- **設計推奨**: Open Claw のメッセージング UI（Telegram/Slack）から「⏸ 一時停止」「🚨 緊急停止」「✅ 承認」のクイックアクションを毎タスク表示。

---

## 9. コスト試算（H 群）

### 9.1 月額コスト・レンジ予測（2026-05 価格）

| 項目 | 軽運用（PoC） | 中運用（月 5 アプリ） | 重運用（24/7 自律） |
|---|---|---|---|
| ChatGPT Codex（オーナー契約済 x5）| 契約済み | 契約済み | 契約済み |
| Anthropic API（Claude Code 駆動、**API キー必須**）| $50-$200 | $500-$1,500 | $2,000-$5,000+ |
| Vercel Sandbox（生成コード実行）| 無料枠内 | $20-$80 | $100-$300 |
| Vercel デプロイ（生成アプリのホスティング）| Hobby 無料 | Pro $20/site | Pro $20/site × N |
| Supabase（生成アプリの DB）| 無料枠内 | Pro $25/プロジェクト | Pro $25/N |
| Sentry / 監視 | 無料 | $26 | $80+ |
| Slack / Discord 通知 | 無料 | 無料 | 無料 |
| GitHub Actions（CI）| 2,000 分無料 | $0-$50 | $50-$200 |
| 監査ログ（Supabase または S3）| 〜$5 | 〜$20 | 〜$100 |
| **合計（オーナー既存サブスク除く）** | **$80-$280** | **$600-$1,720** | **$2,300-$5,800+** |

### 9.2 コスト最適化戦略

- **モデル階層化**: Haiku 4.5 ($1/$5) でトリアージ、Sonnet 4.6 ($3/$15) で実装、Opus 4.7 ($5/$25) は計画と難所のみ → 50-70% コスト削減
- **Prompt Caching**: Anthropic 側で最大 90% 削減（システムプロンプト・CLAUDE.md・固定コンテキスト）
- **Batch API**: 24h 以内可なら 50% OFF（リサーチタスク向き）
- **maxTurns 制限**: 暴走防止（ClaudeClaw 推奨パターン）

### 9.3 「Codex サブスクで全部回せれば安い」案の現実

**結論**: 不可。Anthropic ToS で Pro/Max OAuth を第三者ツールから使えない。仮に「Open Claw も Claude Code も全部 Codex で動かす」(Claude Code を全廃して Codex のみ)とすれば $0 上乗せだが、**コーディング品質が Anthropic Sonnet/Opus に劣る場面が多い**（claude-code-company 既存ノウハウとの整合も崩れる）。

---

## 10. 法的・倫理的リスク（I 群）

### 10.1 ToS リスクサマリー

| リスク | 深刻度 | 対処 |
|---|---|---|
| Anthropic OAuth 第三者駆動 → アカウント BAN | **高** | API キー必須、Pro/Max は使わない |
| OpenAI Codex 自動化エージェント濫用 | 中 | Pro $200 1 アカウントに統合、5 アカウント並列濫用しない |
| GitHub TOS（自動 push）| 低 | Personal Access Token + rate limit 遵守 |
| Vercel TOS（自動 deploy）| 低 | 通常利用範囲内 |

### 10.2 自律生成コードの権利侵害リスク

- **責任主体**: 法的にはオーナー（コード生成・公開を指示した主体）。OpenClaw / Anthropic / OpenAI は ToS で免責条項を持つ。
- **リスクシナリオ**:
  - LLM が他者のコードを部分コピー → ライセンス違反
  - 生成 Web アプリが個人情報漏洩 → 個人情報保護法・GDPR 違反
  - 生成アプリが薬機法 / 景表法 / 金商法に抵触
- **対処**:
  - **公開前に必ずオーナー承認ゲート**（自動公開禁止）
  - レビュー部門エージェントが法務観点でチェック
  - SPDX / fossology 等のライセンススキャン自動化

### 10.3 日本国内法

- **電気通信事業法**: 公開 Web アプリで「他人の通信を媒介」する機能（チャット・SNS 機能）を含む場合、届出が必要なケースあり（2023 改正）。
- **個人情報保護法**: ユーザーデータを扱うアプリは個人情報取扱事業者として運営。
- **景表法・特商法**: 自動生成された LP に虚偽広告が含まれた場合、表示主体が責任。
- **特定商取引法 11 条**: ECサイト型なら事業者表示必須。

→ **対処**: 自律エージェントが**公開可能なアプリのカテゴリを事前に絞る**（個人情報を扱わない、SaaS 認証を要しない、商用取引を含まない、等）。

### 10.4 倫理的リスク

- **MoltMatch 事件（2026-02）**: 学生の OpenClaw が無認可でデート profile を作成 → AI 代理行為の同意問題。
- **Cisco 研究**: OpenClaw の third-party skills に**データ exfiltration / prompt injection**を行う悪意ある skill が存在することを発見。**skill レジストリから取り込む際は必ずレビュー必須**。
- **中国政府**: 2026-03 に国営企業・政府機関の OpenClaw 利用を制限（規制リスクの先例）。

---

## 11. 総合評価と推奨次アクション

### 11.1 実現可能性の総合評価

**結論**: 実現可能（条件付き）。

技術的に実装可能なのは:
1. Open Claw を ChatGPT Codex サブスクで動かす（OpenClaw 公式 docs に明記、3 ルートあり）
2. Open Claw から Claude Code を駆動する（Enderfga/openclaw-claude-code 等の既存 OSS で実装済み）
3. ハーネスエンジニアリング（権限分離・サンドボックス）（Vercel Sandbox / E2B / Codex 内蔵 sandbox / Claude Code permission 等の組み合わせ）
4. Web からニーズ判定 → アプリ開発 → テスト → 通知の自律ループ（idea-reality-mcp + 既存 multi-agent council パターン）

**条件**:
- Claude Code 駆動部分は**Anthropic API キー従量課金**（Pro/Max OAuth は ToS 違反で BAN リスク）
- ChatGPT Codex は Pro $200 1 アカウントに統合推奨（5 アカウント並列濫用は灰色）
- 公開ゲートは必ず human-in-the-loop（オーナー承認）
- 月額コスト現実レンジ: **PoC $80-$280 / 中運用 $600-$1,720 / 重運用 $2,300-$5,800+**（オーナー既存サブスク除く）

### 11.2 最大の障壁 Top 3

1. **Anthropic ToS（OAuth 第三者駆動禁止）** — `code.claude.com/docs/en/legal-and-compliance` に明文化、違反は事前通知なし BAN。Claude Code を Pro/Max で動かす案は完全不可。**API キー従量必須でコスト構造が大きく変わる**。
2. **責任主体の不明確さ（日本法・自動公開リスク）** — 自律エージェントが生成・公開した Web アプリで事故が起きた場合、オーナーが全責任。電気通信事業法届出・個人情報保護法・特商法・景表法を自動チェックする仕組みが必須で、これを LLM だけで担保するのは現状困難。**人間の最終承認ゲート無しでの公開は禁止**にせざるを得ない。
3. **ニーズ判定の評価関数とデータソース** — Reddit Data API は商用ライセンス必須（GummySearch 倒産事例）、X Enterprise API は個人で実質取得不可。HN/Product Hunt/GitHub に依存すると技術者バイアスがかかり「中小企業向けアプリ」のニーズが拾えない可能性。**スコアリング設計と継続評価が PoC の核**。

### 11.3 推奨次アクション（5 つ）

1. **PoC アーキテクチャ確定**: 「Codex サブスク（Open Claw 本体駆動）+ Anthropic API キー（Claude Code 駆動）+ Vercel Sandbox（生成コード実行）+ Slack/Telegram 通知 + Supabase 監査ログ」のハイブリッド構成で Phase 1 設計。Enderfga/openclaw-claude-code を fork ベースに使用するか、自前で組むかを決定。
2. **コスト・ハードキャップとキルスイッチ**: Anthropic Console + OpenAI Platform で月額上限設定。OpenClaw skill として `cost_check` / `emergency_stop` を実装。Slack に毎日コストレポート。
3. **承認ゲート設計**: 「公開前承認」「課金操作前承認」「force push 前承認」「prod deploy 前承認」「外部 API 連携前承認」の 5 ゲートを必須化。承認 UI は Telegram/Slack のクイックアクションボタン。
4. **法務・倫理ガードレール**: 公開可能アプリのカテゴリ allowlist を作成（個人情報なし、商用取引なし、SaaS 認証なし、メディア機能なし）。レビュー部門エージェントに SPDX ライセンススキャン + 法務観点プロンプトを追加。
5. **代替案 TCO 比較**: Devin（Cognition、$500/月～）/ OpenHands（OSS、自前ホスト）/ Replit Agent 3 / Cursor Background Agent の TCO を本件構成と比較。**「自前ハーネス構築」と「商用 SaaS 利用」のどちらが事業として正しいか**を Phase 1 の意思決定で確定する。

---

## 12. 情報源リスト（参照日 2026-05-02、信頼度ラベル付き）

### 12.1 一次情報（公式）

| URL | 内容 | 信頼度 |
|---|---|---|
| https://clawbro.ai/ja | ClawBro 日本語ランディング | 公式 |
| https://clawbro.ai/ | ClawBro 英語ランディング | 公式 |
| https://openclaw.ai/ | OpenClaw 公式 | 公式 |
| https://github.com/openclaw/openclaw | OpenClaw GitHub | 公式 |
| https://github.com/openclaw/openclaw/blob/main/docs/providers/openai.md | OpenAI プロバイダ docs | 公式 |
| https://docs.openclaw.ai/providers/openai | OpenClaw OpenAI プロバイダ | 公式 |
| https://code.claude.com/docs/en/legal-and-compliance | Claude Code 法務・コンプライアンス | 公式（決定的） |
| https://code.claude.com/docs/en/headless | Claude Code Headless / Agent SDK | 公式 |
| https://www.anthropic.com/legal/aup | Anthropic Acceptable Use Policy | 公式 |
| https://www.anthropic.com/legal/consumer-terms | Anthropic Consumer Terms | 公式 |
| https://www.anthropic.com/legal/commercial-terms | Anthropic Commercial Terms | 公式 |
| https://developers.openai.com/codex/pricing | Codex Pricing | 公式 |
| https://developers.openai.com/codex/auth | Codex Authentication | 公式 |
| https://developers.openai.com/codex/cli | Codex CLI | 公式 |
| https://developers.openai.com/codex/concepts/sandboxing | Codex Sandbox | 公式 |
| https://developers.openai.com/codex/agent-approvals-security | Codex Agent Approvals & Security | 公式 |
| https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan | Using Codex with ChatGPT plan | 公式 |
| https://help.openai.com/en/articles/20001106-codex-rate-card | Codex rate card | 公式 |
| https://openai.com/policies/service-terms/ | OpenAI Service Terms（WebFetch 403、要オーナー直接確認） | 公式 |
| https://platform.claude.com/docs/en/about-claude/pricing | Claude API Pricing | 公式 |
| https://openai.com/index/harness-engineering/ | Harness engineering by OpenAI | 公式 |
| https://vercel.com/kb/guide/vercel-sandbox-vs-e2b | Vercel Sandbox vs E2B | 公式 |

### 12.2 半公式（GitHub / 著名社員 SNS）

| URL | 内容 | 信頼度 |
|---|---|---|
| https://github.com/Enderfga/openclaw-claude-code | OpenClaw Claude Code plugin（5 エンジン統合） | 半公式 |
| https://github.com/HKUDS/OpenHarness | OpenHarness OSS | 半公式 |
| https://github.com/openai/codex/discussions/8338 | Codex CLI ToS 議論（OAuth 第三者利用の可否） | 半公式 |
| https://github.com/ai-boost/awesome-harness-engineering | Awesome Harness Engineering | 半公式 |
| https://github.com/mnemox-ai/idea-reality-mcp | アイデア検証 MCP server（290+ stars） | 半公式 |
| https://x.com/wesbos/status/2024610896811524535 | Wes Bos: Codex プランは embeddings なし → BYOK 必要 | 半公式 |
| https://www.linkedin.com/posts/jasoncalacanis_using-claude-pro-credits-no-longer-works-...| Anthropic ポリシー変更の同時報告 | 半公式 |

### 12.3 二次情報（メディア・複数ソース裏取り済）

| URL | 内容 | 信頼度 |
|---|---|---|
| https://en.wikipedia.org/wiki/OpenClaw | OpenClaw Wikipedia | 二次 |
| https://en.wikipedia.org/wiki/Peter_Steinberger_(programmer) | Peter Steinberger Wikipedia | 二次 |
| https://www.theregister.com/2026/02/20/anthropic_clarifies_ban_third_party_claude_access/ | Anthropic ToS 強化報道 | 二次 |
| https://www.pymnts.com/artificial-intelligence-2/2026/third-party-agents-lose-access-as-anthropic-tightens-claude-usage-rules/ | Anthropic 第三者エージェント制限 | 二次 |
| https://www.kdnuggets.com/openclaw-explained-the-free-ai-agent-tool-going-viral-already-in-2026 | KDnuggets OpenClaw 解説 | 二次 |
| https://thenewstack.io/ai-agent-harness-pricing-split/ | 4 ベンダー harness 比較 | 二次 |
| https://blog.dailydoseofds.com/p/the-anatomy-of-an-agent-harness | Agent Harness 解剖 | 二次 |
| https://medium.com/@mcraddock/building-claudeclaw-an-openclaw-style-autonomous-agent-system-on-claude-code-fe0d7814ac2e | ClaudeClaw 構築解説 | 二次 |
| https://www.trendmicro.com/en_us/research/26/b/what-openclaw-reveals-about-agentic-assistants.html | Trend Micro OpenClaw セキュリティ研究 | 二次 |
| https://addyosmani.com/blog/agent-harness-engineering/ | Addy Osmani Harness Engineering | 二次 |
| https://www.epsilla.com/blogs/2026-04-16-openai-harness-vs-claude-mcp | OpenAI Harness vs MCP 比較 | 二次 |
| https://cognition.ai/blog/introducing-devin | Devin 公式ブログ | 公式 |
| https://www.augmentcode.com/tools/intent-vs-devin | Devin v3 / 動的再計画 | 二次 |
| https://needle.app/blog/how-we-automated-reddit-market-research | Reddit リサーチ自動化（GummySearch 倒産言及） | 二次 |
| https://blaxel.ai/blog/daytona-dev-environment-pricing-alternatives | サンドボックス価格比較 | 二次 |
| https://northflank.com/blog/e2b-vs-vercel-sandbox | E2B vs Vercel Sandbox | 二次 |
| https://venturebeat.com/orchestration/openai-introduces-chatgpt-pro-usd100-tier-with-5x-usage-limits-for-codex | ChatGPT Pro $100 5x Codex | 二次 |

### 12.4 コミュニティ（裏取り 1 ソース、参考情報）

| URL | 内容 | 信頼度 |
|---|---|---|
| https://www.facebook.com/jonathanjmast/posts/... | Anthropic OpenClaw policy update SNS | コミュニティ |
| https://www.answeroverflow.com/m/1473453929403650209 | Best way to use Claude Code with OpenClaw | コミュニティ |
| https://amankhan1.substack.com/p/how-to-make-your-openclaw-agent-useful | OpenClaw agent secure | コミュニティ |
| https://blog.devgenius.io/you-might-be-breaking-claudes-tos-without-knowing-it-... | Claude ToS 解説 | コミュニティ |
| https://community.openai.com/t/codex-rate-limits-reset-for-all-paid-plans-april-28-2026/1379921 | Codex rate limit reset | コミュニティ |

### 12.5 オーナー直接確認推奨事項（公式 fetch がブロックされた等の理由）

- `https://openai.com/policies/service-terms/`: 本調査では WebFetch 403。**オーナー側で直接確認推奨**（自動化エージェント条項、Sign in with ChatGPT の第三者利用について）
- `https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan`: 同上 403。直接確認推奨
- ChatGPT Codex「x5」の意味確定（Pro $100 の 5x 枠か、5 アカウント契約か）

---

**文書終わり / 案件: PRJ-019 / 部門: リサーチ / 完了日時: 2026-05-02**
