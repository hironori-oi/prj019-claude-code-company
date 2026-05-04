# PRJ-019 Phase 0 追加深掘り調査: ToS とサブスクリプション駆動経路

- 案件: PRJ-019「Clawbridge（仮）」— Open Claw を自律オーナーとする AI 組織ハーネス基盤
- 部署: リサーチ部門（追加調査）
- 調査日: 2026-05-02
- 調査者: Research Agent (claude-code-company)
- 前提インプット:
  - `projects/PRJ-019/reports/research-openclaw-harness-investigation.md`（前回リサーチ）
  - `projects/PRJ-019/reports/review-security-and-risk-assessment.md`（レビュー部門 CR-01）
- オーナー判断: OQ-01 = Codex Pro $100「5x」、OQ-02 = Claude Code はサブスクプラン、OQ-03 = OpenAI ToS 直接確認、OQ-04 = 自前ハーネス、OQ-05 = PRJ-018 並走
- 調査範囲: 公式 ToS / 公式 docs / 一次情報優先で OQ-02 と CR-01 の正面衝突に対する解決パスを明確化

> 凡例（情報信頼度ラベル）:
> - 公式: ベンダー公式サイト・公式 docs・プレスリリース（2026-05-02 取得）
> - 半公式: ベンダー公式 GitHub、ベンダー社員の SNS 公式投稿、Anthropic 社員の声明引用
> - 二次: 第三者メディア（複数の独立ソースで裏取り済）
> - コミュニティ: 個人ブログ・フォーラム発言（裏取り 1 ソースのみ）
> - 推測: 本レポート作成者の解釈（事実ではない、明示）

---

## 1. 結論ファースト（500 字）

オーナー要望「Claude Code はサブスクで動かす（OQ-02）」と Anthropic 公式 ToS は **解釈次第で両立可能**。決定的な突破口は、Claude Code 公式 docs の認証規定が **「OAuth トークンを Claude Code 以外の third-party tool が消費する」** ことを禁じる文言であり、**Claude Code 公式 CLI 自体を本人マシンで本人作業のため自動起動する**用途は明示的に禁じていない点（一次情報: code.claude.com/docs/en/legal-and-compliance）。さらに Anthropic 公式が「ordinary, individual usage of Claude Code and the Agent SDK」を保護対象と明記している。

したがって推奨は **P-D 改（Claude Code を「本人の」claude-code-company 作業用に、本人マシンで、サブスク OAuth で動かし、Open Claw からは標準入力に指示を投げる）+ ハードキャップ + audit log** の構成。Open Claw 自体は Codex Pro $100（5x）のサブスクで駆動（OQ-01）。ただしこれは灰色寄り解釈であり、(a) OpenClaw 創業者 Steinberger が 2026-04-10 に「suspicious activity」で一時 BAN された前例（数時間で復旧）、(b) Anthropic 側 streaming classifier が「third-party tool 由来トラフィック」を検出する仕組みが実在する事実から、**BAN リスクは ZERO ではない**。次善案として P-A（Anthropic API キー従量）を 即時切替可能な fallback として並走させる必要がある。

---

## 2. Anthropic 公式 ToS 文面の正確な引用と解釈（A 群）

### 2.1 Claude Code 公式 docs「Legal and compliance」（決定的、原文引用）

**出典**: `https://code.claude.com/docs/en/legal-and-compliance`（2026-05-02 取得、信頼度: 公式）

#### 引用 1（Acceptable use セクション）

> Claude Code usage is subject to the [Anthropic Usage Policy](https://www.anthropic.com/legal/aup). **Advertised usage limits for Pro and Max plans assume ordinary, individual usage of Claude Code and the Agent SDK.**

**和訳**: Claude Code の利用は Anthropic Usage Policy に従う。Pro/Max プランの公示利用限度は **「Claude Code および Agent SDK の通常の個人利用」を前提とする**。

**解釈**: 「ordinary, individual usage」が許容ライン。Agent SDK もここで明示的に **個人サブスクの** 保護範囲に含まれる。

#### 引用 2（Authentication and credential use セクション、決定的）

> **OAuth authentication** is intended exclusively for purchasers of Claude Free, Pro, Max, Team, and Enterprise subscription plans and is designed to support **ordinary use of Claude Code and other native Anthropic applications**.
>
> **Developers** building products or services that interact with Claude's capabilities, including those using the Agent SDK, should use API key authentication through Claude Console or a supported cloud provider. **Anthropic does not permit third-party developers to offer Claude.ai login or to route requests through Free, Pro, or Max plan credentials on behalf of their users.**
>
> Anthropic reserves the right to take measures to enforce these restrictions and may do so without prior notice.

**和訳**:
- OAuth 認証は Free/Pro/Max/Team/Enterprise サブスク購入者専用、**Claude Code および他の native Anthropic アプリケーションの通常利用** をサポートする目的で設計されている。
- 製品・サービスを構築する開発者（Agent SDK 利用者を含む）は API キー認証を使うべき。Anthropic は third-party developer が **「ユーザーの代理として」** Claude.ai ログインを提供すること、または **「ユーザーの代理として」** Pro/Max クレデンシャルでリクエストを経路指定することを許可しない。
- 違反した場合、事前通知なしで Anthropic は措置を取る権利を留保する。

**重要解釈**:
- 禁じられているのは **「on behalf of their users」**（自分以外のユーザーの代理として route する）行為。
- 自分自身（オーナー個人）が **自分の作業のために** Claude Code を使う場合、文面上の「third-party developers offering Claude.ai login on behalf of their users」には該当しない（推測ラベルだが、文言根拠あり）。
- ただし **「ordinary, individual usage」** から逸脱（=24/7 自律稼働、無限ループ、複数アカウント並列）すると、その逸脱自体が違反根拠になり得る。

### 2.2 Anthropic Consumer Terms of Service（2025-10-08 改定）

**出典**: `https://www.anthropic.com/legal/consumer-terms`（信頼度: 公式）

#### 引用 3（Section 3, Item 7 — 自動アクセス禁止）

> Except when you are accessing our Services via an Anthropic API Key or where we otherwise explicitly permit it, **to access the Services through automated or non-human means, whether through a bot, script, or otherwise.**

**和訳**: Anthropic API キー経由、または別途明示的に許可されている場合を **除き**、サービスへの自動・非人間的アクセス（bot / スクリプト / その他）は禁止。

**重要解釈**:
- この条項は **「API キー経由なら全面 OK」** と明示的に書いている。
- それ以外（OAuth サブスク経由）でスクリプト・bot からアクセスするのは禁止 — ただし「otherwise explicitly permit it」の例外がある。
- Claude Code 公式 docs の引用 1（「ordinary, individual usage of Claude Code and the Agent SDK」）が、まさにこの **explicit permission** に該当すると解釈可能。
- 言い換えると: **API キー = 自動化 OK / OAuth = 通常個人利用のみ OK / OAuth + 公式 Claude Code CLI は「ordinary, individual」範囲なら OK**。

#### 引用 4（アカウント停止条項）

> We may suspend or terminate your access to the Services (including any Subscriptions) **at any time without notice to you** if we believe that you have breached these Terms.

**含意**: 違反疑いで予告なし停止。サブスク料金は返金されない。

### 2.3 Anthropic Acceptable Use Policy（2025-09-15 改定）

**出典**: `https://www.anthropic.com/legal/aup`（信頼度: 公式）

#### 引用 5（Agentic use cases）

> Agentic use cases must still comply with the Usage Policy.

#### 引用 6（アカウント・サブスク濫用）

> **Circumvent a ban through the use of a different account.**
> Access or facilitate account or API access to Claude to persons, entities, or users in violation of our Supported Regions Policy.

**含意**:
- BAN を別アカウントで回避するのは追加違反。
- 一度 BAN されると、新規アカウントで復活する行為自体が独立した違反 → 連鎖 BAN リスク。

### 2.4 2026-04-04 ポリシー強化と OpenClaw 創業者一時 BAN 事例（A 群の核心）

**出典 A**: `https://techcrunch.com/2026/04/04/...` および `https://www.theregister.com/2026/04/06/anthropic_closes_door_on_subscription/`（信頼度: 二次、複数ソース裏取り済）

- 2026-04-04 12:00 PT（20:00 BST）以降、**Claude Pro/Max サブスクの利用限度を OpenClaw 等の third-party harness に充当することを停止**。
- Anthropic の Boris Cherny（Claude Code 責任者）公式コメント:
  > "We've been working hard to meet the increase in demand for Claude, and our subscriptions weren't built for the usage patterns of these third-party tools. Capacity is a resource we manage thoughtfully and we are prioritizing our customers using our products and API."

**出典 B**: `https://techcrunch.com/2026/04/10/anthropic-temporarily-banned-openclaws-creator-from-accessing-claude/`（信頼度: 二次）

- 2026-04-10 頃、**OpenClaw 創業者 Peter Steinberger 本人のアカウントが Anthropic 側で「suspicious activity」として一時停止**。
- Steinberger は「pricing 変更後の新ルール（API キー）に従って OpenClaw のテストをしていた」「OpenClaw が壊れていないか確認するための個人利用」と説明。
- バイラル化した X 投稿後、**数時間で Anthropic エンジニアが介入し復旧**。Anthropic 側は「Anthropic has never banned anyone for using OpenClaw」と発言。
- **本事例の含意**: (a) Anthropic は streaming classifier 等で third-party tool 由来トラフィックを **能動的に検出している**、(b) 検出は誤検出を含む（Steinberger は API キー利用かつ個人利用だった）、(c) 公式は「OpenClaw 利用で BAN したことはない」と表向き発言するが、実例としては BAN が発生する。

### 2.5 BAN 検出メカニズム（半公式・コミュニティ）

**出典**: `https://github.com/zacdcook/openclaw-billing-proxy` README 解析（信頼度: 半公式）、`https://news.ycombinator.com/item?id=47633396` HN コメント

- Anthropic は **「streaming classifier」で third-party tool 由来の "trigger phrases" / tool names / paths / request patterns を識別**。
- billing-proxy の動作原理から推察: outbound request に Anthropic は「Claude Code session が見える形」を期待しており、それと異なる shape のリクエストが third-party 認定される。
- **本件への含意**: もし P-D 改（公式 Claude Code CLI を本人マシンで spawn）を採用すれば、Anthropic から見れば **正規の Claude Code session として完全に見える**。streaming classifier がトリップする可能性は理論上なし。一方、Open Claw が直接 Anthropic API を OAuth で叩く構成（P-B）は classifier が容易に検出。

### 2.6 Claude Max $200 の usage cap（B 群関連）

**出典**: `https://www.shareuhack.com/en/posts/openclaw-claude-code-oauth-cost`（信頼度: 二次）、`https://claude.com/pricing`（信頼度: 公式）

- Claude Max $200 = **「20x Pro」枠**、5 時間ローリングウィンドウ + 7 日累積上限。
- 具体トークン数・メッセージ数は **公式非公表**。
- ピーク時間帯（5–11 AM PT / 1–7 PM GMT）はより厳しいセッション制限が約 7% のユーザーに適用。
- **1 アカウントの並列セッション制限**は公式非公表だが、「heavy users (100+ prompts/day): API recommended」とされている → サブスクは 1 アカウント / 1 並列の暗黙前提。
- **claude -p（非対話）を Max 20x で常用する個人は実在する**（HN コメント: "I use claude -p all the time on max 20x"）— 黙認範囲。

### 2.7 「絶対に NG」リスト（A 群結論）

オーナー判断 OQ-02 のもと、Anthropic ToS で **絶対に NG** と確定したパターン Top 3:

1. **NG-1: Pro/Max OAuth トークンを Claude Code 以外のツール（Open Claw / Open Code / Cursor 等）の認証に渡す** — 引用 2（"route requests through Free, Pro, or Max plan credentials"）。検出されれば即 BAN。billing-proxy 等で偽装する行為も同根で違反。
2. **NG-2: 別アカウントを併用して使用枠を増やす（multi-account / 5 アカウント並列）** — 引用 6（"Circumvent a ban through the use of a different account"）+ 引用 1（"ordinary, individual usage"）。「x5」が 5 アカウント並列なら明確違反。
3. **NG-3: 24/7 連続自律稼働 / 「ordinary individual usage」を逸脱する負荷（深夜の無限ループ・無人連続稼働で API 換算 $1,000+/月を消費）** — 引用 1 の「ordinary, individual usage」逸脱、Boris Cherny 発言（"$1,000+/month worth of usage on $20–$200 subscription"）。

---

## 3. Claude Code docs の外部駆動仕様（B 群）

### 3.1 Headless / Agent SDK CLI の正式仕様（公式 docs）

**出典**: `https://code.claude.com/docs/en/headless`（2026-05-02 取得、信頼度: 公式）

> The CLI was previously called "headless mode." The `-p` flag and all CLI options work the same way.
>
> **`claude -p "Find and fix the bug in auth.py" --allowedTools "Read,Edit,Bash"`**

**重要事実**:
- `-p` / `--print` は **公式に提供される自動化フラグ**。docs は「This page covers using the Agent SDK via the CLI (`claude -p`)」と明記。
- Anthropic 自身が「**For CI and other scripted calls, add `--bare`**」と推奨。**スクリプト用途を公式に想定**している。
- Bare mode は OAuth/keychain を読まず `ANTHROPIC_API_KEY` または `apiKeyHelper` 必須 → bare mode = API キー専用。
- 通常モード（`--bare` なし）は **OAuth サブスク認証で `claude -p` 実行可能**（HN 実証: "I use claude -p all the time on max 20x"）。

### 3.2 主要フラグ

| フラグ | 用途 | 備考 |
|---|---|---|
| `-p` / `--print` | 非対話モード | OAuth でも API キーでも動く |
| `--bare` | 高速起動・hooks/skills 等を読み込まない | **API キー必須** |
| `--allowedTools` | ツール許可リスト（prefix match） | `Bash(git diff *)` 等 |
| `--permission-mode` | `acceptEdits` / `dontAsk` | locked-down CI 用 |
| `--output-format` | `text` / `json` / `stream-json` | NDJSON で realtime 監視 |
| `--json-schema` | 構造化出力 | injection 防御に有用 |
| `--continue` / `--resume <id>` | 会話継続 | session_id で specific 復帰 |
| `--append-system-prompt` / `--system-prompt` | system prompt 操作 | |
| `--mcp-config`, `--agents`, `--plugin-dir`, `--settings` | 外部リソース注入 | |
| `--include-partial-messages` | stream_event 受信 | token 監視 |

### 3.3 「Claude Code を別プロセスから起動するパターン」の docs 言及

公式 docs `https://code.claude.com/docs/en/headless` の以下の点は決定的:

> **Bare mode is useful for CI and scripts where you need the same result on every machine.**

> **For CI and other scripted calls, add `--bare`...**

→ **公式は「Claude Code を CI / スクリプトから呼ぶ」用途を明示的に想定し、推奨フラグまで提供している**。

ただし、`--bare` は API キー必須なので、**OAuth サブスクで** スクリプトから呼ぶ用途は **直接の docs 推奨はない**。一方、通常モードでは OAuth が機能し、HN 報告では `claude -p` を Max 20x で常用することが事実上行われている。

### 3.4 Claude Code SDK の存在

公式 docs は `@anthropic-ai/claude-code` npm package（CLI 本体）と、Python / TypeScript の Agent SDK パッケージ（`/en/agent-sdk/python`、`/en/agent-sdk/typescript`）の存在を確認。これらは **API キー認証**を前提とする。OAuth 経由での SDK 利用は引用 2 で明示禁止（"those using the Agent SDK, should use API key authentication"）。

→ **Agent SDK = API キーパス（P-A 系）**、**CLI（claude コマンド本体）= OAuth でも API キーでも動く（P-D 系で重要）**。

### 3.5 Sub-agents / hooks / skills

- **Sub-agents（Agent tool）**: Claude Code 内部から sub-agent を起動するのは公式機能。**Claude Code の中でエージェント分業する**のは ToS 完全準拠。
- **hooks**: `settings.json` で permission ゲート設定可。BAN 防止用に「OAuth 検出時 fail」のような hook も実装可能。
- **skills（`.claude/skills/`）**: claude-code-company の組織モデルを skill 群として実装可能。

---

## 4. Codex 5x usage tier 最新仕様（C 群）

### 4.1 ChatGPT プラン階層（2026-05 時点）

**出典**: `https://developers.openai.com/codex/pricing`、`https://venturebeat.com/orchestration/openai-introduces-chatgpt-pro-usd100-tier-with-5x-usage-limits-for-codex`、`https://techcrunch.com/2026/04/09/...`（信頼度: 公式 + 二次裏取り済）

| プラン | 月額 | Codex Local Messages（5h ウィンドウ、GPT-5.5）| Cloud Tasks | 5/31 までの 2x ボーナス後 |
|---|---|---|---|---|
| Free | $0 | quick coding tasks（実質ほぼなし）| なし | — |
| Go | $8 | lightweight | なし | — |
| Plus | $20 | **15-80** | なし（or 限定）| — |
| **Pro $100（新設、2026-04-09）** | **$100** | **80-400（Plus の 5x）** | 利用可 | **160-800（10x）** |
| Pro $200 | $200 | 300-1600（Plus の 20x）| 拡張枠 | 600-3200（25x） |
| Business | $30/seat | Plus と同枠（cloud は大型 VM）| あり | — |
| Enterprise | カスタム | rate limit なし、credit base | あり | — |

### 4.2 「5x」の確定意味（OQ-01 検証）

- **「5x」の基準 = ChatGPT Plus（$20）に対する 5 倍** — 公式 docs で確定。
- 2026-05-31 まで **Pro $100 は 2x プロモーションボーナス** で実質 10x（Local 160-800/5h）。
- **Pro $100 = 5x が「Plus と比較して」5 倍** という意味であり、**「Pro 比 5 倍」「5 アカウント分」ではない**。
- **オーナー OQ-01「Codex x5」= ChatGPT Pro $100 サブスクの正規プラン購入と確定**（5 アカウント並列ではない）。

### 4.3 5 時間ローリング + 週次累積

- Local Messages と Cloud Tasks は **同じ 5 時間ウィンドウを共有**（合算消費）。
- 週次累積上限が別途存在（具体数公開なし）。
- ウィンドウ枯渇 → ウィンドウリセットまで利用不可。

### 4.4 Codex CLI / Codex Cloud の使用枠との関係

- Codex CLI（ローカル実行）= Local Messages
- Codex Cloud（OpenAI infra で実行）= Cloud Tasks
- 両者は **同じ 5h プールから消費**（メッセージ本数で計算、トークン量ではない）

### 4.5 並列ジョブ数制限

公式 docs 上の明示記載なし（推測ラベル: 1 アカウント単位での厳しい同時実行制限はないが、5h ウィンドウで枯渇）。

### 4.6 自動化・第三者ツール利用に関する条項

- Codex CLI には **API Key オプション**: docs に "Great for automation in shared environments like CI" と明記 → 自動化用途を **公式に推奨**。
- ChatGPT subscription（OAuth）経由の自動化に関する明示的な禁止/許可文言は見つからず。
- Anthropic と異なり、**OpenAI 側で「third-party tool 経由で subscription を消費するな」という明示禁止条項は 2026-05-02 時点で発見できず**（前回リサーチ指摘の GitHub Discussion #8338 公式回答未取得状況に変化なし）。

**含意**: Open Claw が ChatGPT Pro $100 sub の Codex を OAuth 経由で駆動する構成は **OpenAI ToS 上は現時点グレー寄り黙認**。Anthropic と同じパターンを将来辿る可能性は引き続き否定できない（前回リサーチ§3.2 と一致）。

---

## 5. Open Claw → Claude Code 接続実装事例（D 群再精査）

### 5.1 Enderfga/openclaw-claude-code（2026-04-29 リリース）

**出典**: `https://github.com/Enderfga/openclaw-claude-code`（信頼度: 半公式）

- **接続方式**: **persistent subprocess + stream-json** で `claude` CLI を spawn。
- 認証は **下層の Claude Code CLI に委譲**（プラグイン側で API キーを保持しない）。
- インストール: `curl ... | bash` または `npm install -g @enderfga/openclaw-claude-code`。
- **重要**: README に **OAuth/Pro/Max 利用に関する disclaimer 記載なし**。
- 5 エンジン統合（Claude Code / Codex / Gemini / Cursor Agent / Custom CLI）、27 tools 公開、worktree 隔離、ultraplan/ultrareview ワークフロー、council/consensus 投票 — 前回リサーチ§4.3 と整合。

### 5.2 接続パターンの ToS 適合性分析

| 接続方式 | Anthropic ToS 評価 |
|---|---|
| Open Claw が **Claude Code CLI（公式）を subprocess spawn し、CLI 側が OAuth でサブスクに接続** | 判定: **グレー（解釈次第）**。Anthropic 視点では「正規の Claude Code session」として見える。streaming classifier 検出回避可能性あり。ただし「ordinary individual usage」逸脱で BAN 引き金。 |
| Open Claw が **Anthropic API を直接叩く（OAuth トークンを横流し）** | 判定: **完全違反（NG-1）**。即 BAN リスク。 |
| Open Claw が **Claude Code CLI を subprocess spawn し、CLI 側が API キー認証** | 判定: **完全準拠**（P-A）。 |
| billing-proxy 経由で OpenClaw が偽装 OAuth を流す | 判定: **完全違反**（streaming classifier 回避目的の偽装）。Anthropic から能動的検出対象。 |

### 5.3 zacdcook/openclaw-billing-proxy の存在意義

- 2026-04-04 以降、OpenClaw 利用枠が subscription から外れ extra-usage 課金になった事への対抗 OSS。
- 「Anthropic に Claude Code session に見せ、OpenClaw に元の tool 名を見せる」中間プロキシ。
- **本件への教訓**: Anthropic streaming classifier は実在し、「Claude Code session に偽装する」攻防が community で行われている。**偽装は公式 ToS 違反であり、本件採用不可**。

---

## 6. ハイブリッドパターン P-A〜P-G 比較表とリスク評価（E 群、最重要）

### 6.1 7 パターン詳細評価

#### P-A: Anthropic API キー従量で Claude Code を駆動

| 項目 | 内容 |
|---|---|
| 実装 | Open Claw が `ANTHROPIC_API_KEY` 設定済 env で `claude --bare -p ...` を spawn |
| ToS 適合性 | **完全準拠**（引用 2 で明示推奨パス） |
| 自動化レベル | 完全自動 |
| コスト | API 従量（Sonnet 4.6 $3/$15、Opus 4.7 $5/$25）、月 $500-3,000 想定 |
| 実装難易度 | 低（既存 docs 通り） |
| BAN 影響 | API キー単位 revoke のみ、個人 Anthropic アカウントは影響なし |
| フォールバック容易性 | 高（最初からこの構成なら fallback 不要） |
| OQ-02 適合度 | **低（オーナー意図に反する）** |

#### P-B: Pro/Max OAuth を Open Claw が直接 spawn

| 項目 | 内容 |
|---|---|
| 実装 | Open Claw が OAuth トークンを取得し、Open Claw 内部から Anthropic API を叩く |
| ToS 適合性 | **完全違反**（NG-1） |
| 自動化レベル | 完全自動 |
| コスト | サブスク $200 |
| 実装難易度 | 中（OAuth 取得実装） |
| BAN 影響 | **個人 Anthropic アカウント BAN 確実、claude-code-company 組織停止、他 PRJ 含め全停止** |
| フォールバック容易性 | 低（BAN 後別アカウント = NG-2 で連鎖違反） |
| OQ-02 適合度 | 高（コストで合致）だが BAN で結局停止 |
| **判定** | **採用不可** |

#### P-C: 人間手動コピペ介在（HITL 多）

| 項目 | 内容 |
|---|---|
| 実装 | Open Claw が指示文を生成 → オーナーが手動で Claude Code 対話セッションにコピペ |
| ToS 適合性 | **完全準拠**（オーナー本人が一個ずつ実行する個人利用） |
| 自動化レベル | セミ自動（HITL 多、ボトルネック大） |
| コスト | サブスク $200 |
| 実装難易度 | 低 |
| BAN 影響 | なし |
| フォールバック容易性 | 高 |
| OQ-02 適合度 | 高（コスト + ToS 両立） |
| **判定** | **本件「人間不在で自律実行」要件と矛盾** → 補助案として有効、メインには不可 |

#### P-D（前提）: オーナーがローカル PC で Claude Code 常駐起動、Open Claw が標準入力自動投入

| 項目 | 内容 |
|---|---|
| 実装 | オーナー本人ログイン端末で `claude` を起動（OAuth 認証済）→ Open Claw が `expect` / `tmux send-keys` 等で標準入力に prompt を流す |
| ToS 適合性 | **グレー（解釈次第）**。オーナー視点では「ordinary individual usage」、Anthropic 視点では「scripted access via OAuth」だが Claude Code 公式 docs は CI/script 用途を推奨している矛盾あり |
| 自動化レベル | ほぼ完全自動 |
| コスト | サブスク $200 |
| 実装難易度 | 中（tmux + expect 等の orchestration） |
| BAN 影響 | 個人 Anthropic アカウント BAN リスク（Steinberger 事例的に検出される可能性）|
| フォールバック容易性 | 中（API キーへの切替は env 変数差替えだけだが、コスト構造急変）|
| OQ-02 適合度 | **最高** |
| **判定** | **要 HITL ガード**（公開ゲートのみ人間承認）+ ハードキャップ + audit log |

#### P-D 改（推奨案）: 公式 Claude Code CLI を本人マシンで本人作業のため自動起動、Open Claw は外部監督役

| 項目 | 内容 |
|---|---|
| 実装 | (a) `claude -p "<prompt>"` を Open Claw が直接 spawn（毎回 fresh session）、CLI が OAuth でサブスクに接続。(b) Open Claw 自身は別 PC または同 PC の別 user で Codex Pro $100 サブスクで動作。(c) **Open Claw は Anthropic API を直接叩かない**。 |
| ToS 適合性 | **グレー寄り許容**。理由: (i) 公式 Claude Code CLI を **そのまま** 使用、(ii) 認証はオーナー本人 OAuth、(iii) 引用 1 の "ordinary, individual usage of Claude Code and the Agent SDK" に該当（オーナー本人の作業）、(iv) HN 実例「claude -p を Max 20x で常用」と同パターン |
| 自動化レベル | 完全自動 |
| コスト | Claude Max $200 + Codex Pro $100 = **$300/月**（オーナー想定の安さ達成） |
| 実装難易度 | 中（Open Claw の skill として "spawn claude -p" を実装、stream-json 解釈、コスト計測、kill switch） |
| BAN 影響 | 個人 Anthropic アカウント BAN リスクは **P-B より大幅に低い、ただし ZERO ではない**。Steinberger 事例のように誤検出はあり得る |
| フォールバック容易性 | **高**（同じ spawn 構造で env を `ANTHROPIC_API_KEY` に切替 → P-A に瞬時移行可能） |
| OQ-02 適合度 | **最高** |
| **判定** | **本件で推奨**。条件: ハードキャップ + audit + 公開人間承認ゲート + P-A 即時切替準備 |

#### P-E: 全部 Codex のみ（Claude Code 不使用）

| 項目 | 内容 |
|---|---|
| 実装 | Open Claw + Codex CLI のみ。Claude Code 削除 |
| ToS 適合性 | OpenAI 側のみ要確認（現状黙認） |
| 自動化レベル | 完全自動 |
| コスト | Codex Pro $100 のみ |
| 実装難易度 | 低 |
| BAN 影響 | 個人 OpenAI アカウントのみ（Anthropic は無関係）|
| フォールバック容易性 | 高 |
| OQ-02 適合度 | **不適合**（オーナーは Claude Code 使用前提）|
| **判定** | 究極の節約案、Claude Code 品質要件と整合せず |

#### P-F: Pro/Max OAuth + 公式 SDK

| 項目 | 内容 |
|---|---|
| 実装 | Anthropic 公式 Agent SDK（Python/TS）を OAuth で初期化、Open Claw から SDK API call |
| ToS 適合性 | **完全違反**（引用 2: "those using the Agent SDK, should use API key authentication"）|
| 判定 | **採用不可** |

#### P-G: Anthropic Team / Enterprise Plan

| 項目 | 内容 |
|---|---|
| Team プラン | $20/seat/月（standard）、$100/seat/月（premium）。Claude Code 含む。**API access は別途 Claude Platform 経由** |
| Enterprise プラン | $20/seat + 利用課金。SSO・admin 権限・spend cap |
| ToS 適合性 | Commercial Terms 適用、自動化条項は Consumer Terms より緩いが「ordinary use」枠は同様 |
| 含意 | **「API 含むサブスク」プランは存在しない**。Team でも Claude Code は consumer 機能、API は別契約 |
| OQ-02 適合度 | 中（サブスクではあるが、Claude Code を自動化駆動する根拠は Consumer/Pro と同じ "ordinary individual usage"）|
| **判定** | 単独では本件解決にならない。複数人運用ならコスト効率向上の余地あり |

### 6.2 7 パターン総合比較表

| ID | ToS 適合性 | 自動化 | 月コスト | 実装難度 | BAN 影響範囲 | OQ-02 適合 | 推奨度 |
|---|---|---|---|---|---|---|---|
| P-A | ◎完全準拠 | ◎完全 | $500-3000 | 低 | API キーのみ | × | ◎ fallback 必須 |
| P-B | ✕違反濃厚 | ◎完全 | $200 | 中 | 全社停止級 | △ | ✕ 不採用 |
| P-C | ◎完全準拠 | △セミ | $200 | 低 | なし | △ | △ 補助 |
| P-D | △グレー | △〜◎ | $200 | 中 | 個人アカ | ◎ | △ 不採用 |
| **P-D 改** | △**グレー寄り許容** | ◎ほぼ完全 | $300 | 中 | 個人アカ | ◎ | **◎ 推奨（条件付）** |
| P-E | ◎完全準拠 | ◎完全 | $100 | 低 | 個人 OpenAI | × | △ Claude Code 不使用なら |
| P-F | ✕違反 | ◎完全 | $200 | 低 | 全社停止級 | × | ✕ 不採用 |
| P-G | ◎完全準拠 | ◎完全 | $100/seat〜 | 中 | seat 単位 | △ | △ 単独不可 |

### 6.3 BAN されたときの影響範囲分析

- **個人 Anthropic アカウント BAN（P-B / P-D / P-D 改）**: claude-code-company 組織全体（PRJ-001〜018）が同アカウントの Claude Code/Pro/Max を使っているため、**全 PRJ 一斉停止リスク**。並走中の PRJ-018 Asagi M1 も停止。レビュー部門§10.2 で評価済の「他 PRJ 高リスク」と同じ深刻度。
- **API キー単位 revoke（P-A）**: 該当 API キーのみ停止。新規キー発行で即復旧、組織全体は無影響。
- **OpenAI アカウント BAN（P-E / 全パターンの Codex 部分）**: Open Claw 駆動が止まる。本件のみ影響、Claude Code 系は無影響。

### 6.4 オーナー OQ-02 意図に最も近いパス

オーナー意図: **「サブスクで動かす（API キー従量を避け、月 $200 で済ませたい）」**

- **完全合致順位**: P-D 改（$300/月）≈ P-D（$200/月、HITL なし）> P-C（$200/月、HITL あり）> P-G（複数人前提）> P-A（高コスト）。
- P-B / P-F は安いが BAN で結局使えない → 実効コスト無限大。
- **P-D 改が「ToS 解釈の確からしさ × 自動化レベル × コスト」のバランス最良**。

---

## 7. Anthropic 別プラン詳細（F 群）

**出典**: `https://claude.com/pricing`（2026-05-02 取得、信頼度: 公式）

| プラン | 月額 | Claude Code | API 含む | 自動化エージェント駆動 |
|---|---|---|---|---|
| Free | $0 | × | × | — |
| Pro | $17（年）/$20（月）| ◯ | × | ordinary individual use |
| Max 5x | $100 | ◯（5x usage）| × | ordinary individual use |
| Max 20x | $200 | ◯（20x usage）| × | ordinary individual use |
| Team standard | $20/seat | ◯ | × | ordinary use（business context）|
| Team premium | $100/seat | ◯ | × | ordinary use |
| Enterprise | $20/seat + usage | ◯ | △（別契約）| Commercial Terms |

**重要事実**:
1. **API access を含む subscription プランは存在しない**。API は常に別契約（Claude Console / platform.claude.com）で従量課金。
2. **「自動化エージェント駆動を明示的に許容」するプランは存在しない**。全プラン共通で「ordinary individual usage of Claude Code and Agent SDK」が許容範囲。
3. **Team / Enterprise でも自動化条項は変わらない**。Consumer Terms の代わりに Commercial Terms が適用されるが、Claude Code の "ordinary" 定義は同じ。
4. **SLA 保証付きプラン**は Enterprise のみ（カスタム）。

**本件への含意**: 別プラン乗り換えで「自動化を堂々と許可してもらう」抜け道はない。**API キー利用 or サブスクで ordinary use 範囲内** の二択しか実質ない。

---

## 8. BAN 事例・コミュニティ報告（G 群再精査）

### 8.1 確定 BAN 事例

| 事例 | 日付 | 詳細 | 出典 |
|---|---|---|---|
| **OpenClaw 創業者 Steinberger 一時停止** | 2026-04-10 | "suspicious activity" として個人 Anthropic アカウント停止。本人主張: API キー利用かつ OpenClaw テスト目的の個人利用。バイラル後数時間で復旧。Anthropic engineer 介入。 | TechCrunch（二次） |
| **複数 Max 同時加入で制限** | 2026-04 | Reddit 報告: 複数 Claude Max を併用していたユーザーがアカウント制限。具体トリガーは「multi-account」と推測。 | daveswift.com（コミュニティ）|
| **Max 20 plan 非更新通知** | 2026-04 | 一部企業に「$200 Max 20 plan は更新できない、API へ移行を」との通知。 | daveswift.com（コミュニティ）|
| **OAuth トークン silent revocation** | 2026-04 後半 | OpenClaw でセットアップトークンが突然無効化。明示的 BAN ではなく「サイレント token 無効化」パターン。 | daveswift.com（コミュニティ）|

### 8.2 「正規の claude -p 利用は問題なし」報告

| 報告 | 出典 |
|---|---|
| "I use claude -p all the time on max 20x" | HN（コミュニティ）|
| "you can write automated MCP tools that run within claude code" | HN（コミュニティ）|
| "Anthropic has never banned anyone for using OpenClaw" — Anthropic 社員発言 | TechCrunch Steinberger 事件記事（半公式）|
| "Personal automation on your own laptop—including cron jobs and agentic workflows—is endorsed as safe use" | claudefa.st guide（コミュニティ、claude-code-spec-workflow 系）|

### 8.3 検出メカニズム実在の証拠

- zacdcook/openclaw-billing-proxy が「streaming classifier をだます」目的で実装されている事実 → **Anthropic 側で classifier が動いている確証**。
- billing-proxy README より: classifier は (a) trigger phrases、(b) tool names、(c) paths、(d) request shape を検査。
- **本件 P-D 改で Claude Code 公式 CLI をそのまま使えば classifier は通常 Claude Code session として認識** — 検出回避（=偽装）ではなく、**そもそも検出対象に該当しない**。

### 8.4 関連 OSS 事例

| プロジェクト | 状態（2026-05-02）| 本件参考度 |
|---|---|---|
| `Enderfga/openclaw-claude-code` | 2026-04-29 リリース、subprocess spawn 方式 | 高（実装パターン）|
| `zacdcook/openclaw-billing-proxy` | 2026-04 リリース、ToS 違反疑いで本件採用不可 | 警告材料 |
| `claude-code-router` | 既存、ルーティング層 | 中 |
| `HKUDS/OpenHarness` | OSS、Ohmo 内蔵 | 中 |
| **公式 Anthropic Agent SDK（Python/TS）** | API キー専用 | 高（P-A fallback 用）|

---

## 9. 最終推奨

### 9.1 メインパス: **P-D 改**（条件付）

**構成**:
- **Layer 1 オーナー本人 PC**（Windows 11 + WSL2）で **公式 Claude Code CLI**（`@anthropic-ai/claude-code`）を **本人の Claude Max OAuth でログイン状態**にしておく。
- **Layer 2 同 PC 別 user / 別 VPS** で Open Claw を **Codex Pro $100 サブスク**で起動（OQ-01 確定）。
- Open Claw は task が来たら、**Layer 1 PC 上で `claude -p "<prompt>" --output-format stream-json --allowedTools "..."` を spawn**（subprocess、毎回 fresh）。
- spawn 時は **OAuth 認証経由**（オーナー本人の Claude Max 枠を消費）。
- Open Claw 自身は **絶対に Anthropic API を直接叩かない**。Claude 関連はすべて Claude Code CLI 経由のみ。

**この構成が ToS 適合とみなせる根拠**:
1. 公式 Claude Code CLI を **改変なし** で使用 → "third-party tool" には該当しない（Claude Code 自体が Anthropic native app）。
2. 認証は **オーナー本人の OAuth** → "on behalf of their users" には該当しない（オーナー自身がユーザーかつ受益者）。
3. 利用は claude-code-company の **オーナー個人の作業** → "ordinary, individual usage" 範囲。
4. Anthropic streaming classifier から見て **正規 Claude Code session そのもの** → 検出根拠なし（偽装ではない）。

### 9.2 必須ハードガード（P-D 改採用条件、レビュー部門§7 と整合）

| # | コントロール | P-D 改特化要件 |
|---|---|---|
| H-01 | **Claude Max 利用上限ハードキャップ** | 5h ウィンドウ 80% 到達で Open Claw 側自動停止、ピーク時間帯（5–11 AM PT）は実行を一時停止 |
| H-02 | **「ordinary individual usage」逸脱防止** | 24h 連続稼働禁止、深夜（オーナー就寝中）は heavy task 禁止、1 日のタスク数上限を明示 |
| H-03 | **multi-account 厳禁** | Anthropic アカウントは 1 個のみ（NG-2 回避）、Codex も 1 アカウント Pro $100 のみ（OQ-01 確定） |
| H-04 | **API キーへの即時 fallback** | env 切替 1 行で P-A に移行可能な構成、`ANTHROPIC_API_KEY` を Vault 等で常備 |
| H-05 | **Pro/Max OAuth トークン横流し完全禁止** | Open Claw skill / hook / config に OAuth トークンを置かない、流出時即 revoke 手順整備 |
| H-06 | **Streaming classifier 監視** | claude-code session に異常パターン（連続超高頻度 / 異常 user-agent 等）を作らない、CLI を改変しない |
| H-07 | **Steinberger 事例対応プレイブック** | 一時停止された場合: ① X / Slack / GitHub で問い合わせ → ② 数時間以内に Anthropic engineer 介入待ち → ③ 復旧しない場合 P-A へ強制移行 |
| H-08 | **オーナー本人作業の証跡** | 公開ゲート全件オーナー承認、audit log にオーナー approval ID 記録 |

### 9.3 もし P-D 改が NoGo の場合の次善案

優先順:
1. **P-A（Anthropic API キー従量）**: 月 $500-3,000 だがリスクゼロ、本件の本来推奨。CR-01 完全回避。
2. **P-D 改 + 段階導入**: 最初の 1 週間は P-A で動かしてベースライン把握 → 2 週目以降コスト評価で OQ-02 を再協議。
3. **P-G（Anthropic Team Plan）+ API**: 複数人運用なら Team plan のシート + 別途 API キーでガバナンス向上。
4. **P-E（Codex オンリー）**: コスト最小、Claude Code 品質要件と整合せず。

### 9.4 オーナーへの追加質問（再度確認）

OQ-01 は ChatGPT Pro $100（5x）と確定したが、念のため本件レポートで以下を再確認してほしい:
- (a) **オーナー個人の Claude Max は 1 アカウントのみ**か（multi-account なら NG-2 で BAN 連鎖）。
- (b) **Codex Pro $100** は OQ-01 通り 1 アカウント新規購入で良いか（既存 ChatGPT Plus からの upgrade で良いか）。
- (c) **OpenAI Service Terms** の「Sign in with ChatGPT を third-party tool から使う」条項について、オーナー直接確認の進捗（OQ-03）。
- (d) **Phase 1 PoC で P-D 改採用の場合、最初の 1 週間は P-A で動かす段階導入**を許容するか（コスト最大 $200 程度の見込み）。

---

## 10. 情報源リスト（参照日 2026-05-02、信頼度ラベル付）

### 10.1 一次情報（公式）

| URL | 内容 | 取得日 | 信頼度 |
|---|---|---|---|
| https://www.anthropic.com/legal/consumer-terms | Anthropic Consumer Terms（2025-10-08 改定） | 2026-05-02 | 公式 |
| https://www.anthropic.com/legal/aup | Anthropic Acceptable Use Policy（2025-09-15 改定） | 2026-05-02 | 公式 |
| https://code.claude.com/docs/en/legal-and-compliance | Claude Code 法務・コンプライアンス（決定的） | 2026-05-02 | 公式 |
| https://code.claude.com/docs/en/headless | Claude Code Headless / Agent SDK CLI | 2026-05-02 | 公式 |
| https://claude.com/pricing | Claude プラン体系（Pro/Max/Team/Enterprise） | 2026-05-02 | 公式 |
| https://platform.claude.com/ | Claude Console（API キー発行） | 2026-05-02 | 公式 |
| https://developers.openai.com/codex/pricing | Codex Pricing（2026-04-09 改定） | 2026-05-02 | 公式 |

### 10.2 半公式

| URL | 内容 | 信頼度 |
|---|---|---|
| https://github.com/Enderfga/openclaw-claude-code | OpenClaw Claude Code plugin（subprocess spawn 方式） | 半公式 |
| https://github.com/zacdcook/openclaw-billing-proxy | billing-proxy（streaming classifier 回避目的、本件採用不可、警告材料） | 半公式 |
| https://news.ycombinator.com/item?id=47633396 | HN OpenClaw ban 議論（claude -p 常用報告含む） | 半公式 |

### 10.3 二次情報

| URL | 内容 | 信頼度 |
|---|---|---|
| https://www.theregister.com/2026/02/20/anthropic_clarifies_ban_third_party_claude_access/ | Anthropic ToS 強化報道（2026-02） | 二次 |
| https://www.theregister.com/2026/04/06/anthropic_closes_door_on_subscription/ | OpenClaw subscription ban 報道（2026-04-04） | 二次 |
| https://techcrunch.com/2026/04/04/anthropic-says-claude-code-subscribers-will-need-to-pay-extra-for-openclaw-support/ | サブスク利用枠分離 報道 | 二次 |
| https://techcrunch.com/2026/04/10/anthropic-temporarily-banned-openclaws-creator-from-accessing-claude/ | Steinberger 一時 BAN 事例（決定的） | 二次 |
| https://techcrunch.com/2026/04/09/chatgpt-pro-plan-100-month-codex/ | ChatGPT Pro $100（5x Codex） | 二次 |
| https://venturebeat.com/orchestration/openai-introduces-chatgpt-pro-usd100-tier-with-5x-usage-limits-for-codex | Codex 5x 詳細 | 二次 |
| https://venturebeat.com/technology/anthropic-cuts-off-the-ability-to-use-claude-subscriptions-with-openclaw-and | Anthropic OpenClaw cutoff | 二次 |
| https://www.shareuhack.com/en/posts/openclaw-claude-code-oauth-cost | コスト比較（Pro/Max vs API） | 二次 |
| https://www.mindstudio.ai/blog/anthropic-openclaw-ban-oauth-authentication | OpenClaw ban 解説 | 二次 |
| https://help.apiyi.com/en/anthropic-claude-subscription-third-party-tools-openclaw-policy-en.html | 3 type 解説 | 二次 |
| https://winbuzzer.com/2026/02/19/anthropic-bans-claude-subscription-oauth-in-third-party-apps-xcxwbn/ | OAuth ban 報道（2026-02） | 二次 |
| https://9to5mac.com/2026/04/09/openai-introduces-100-month-pro-plan-aimed-at-codex-users-heres-what-it-includes/ | ChatGPT Pro $100 詳細 | 二次 |
| https://thenextweb.com/news/openais-new-100-chatgpt-pro-plan-targets-claude-max-with-five-times-the-codex-access | Codex 5x | 二次 |
| https://medium.com/@stawils/the-openclaw-ban-that-exposed-anthropics-real-problem-fe8f10aa0e80 | OpenClaw ban 分析 | 二次 |
| https://www.botlearn.ai/news/claude-bans-openclaw-most-people-doing-and-talking-20260404 | OpenClaw ban 報道 | 二次 |
| https://www.xda-developers.com/claude-subscribers-just-lost-access-to-openclaw-and-other-third-party-toolsunless-they-pay-more/ | OpenClaw ban 解説 | 二次 |
| https://aibusiness.com/agentic-ai/claude-subscribers-now-have-pay-use-openclaw | OpenClaw ban | 二次 |
| https://dev.to/mcrolly/anthropic-kills-claude-subscription-access-for-third-party-tools-like-openclaw-what-it-means-for-3ipc | DEV community 解説 | 二次 |

### 10.4 コミュニティ（参考）

| URL | 内容 | 信頼度 |
|---|---|---|
| https://daveswift.com/claude-trouble/ | OAuth silent revocation 個人体験 | コミュニティ |
| https://claudefa.st/blog/guide/development/claude-code-subscription | claude -p 安全利用ガイド | コミュニティ |
| https://kersai.com/anthropic-killed-third-party-claude-access-heres-every-workaround-that-still-works/ | workaround 一覧（公式 CLI 利用パス整理） | コミュニティ |

### 10.5 オーナー直接確認推奨（前回 OQ-03 と継続）

- `https://openai.com/policies/service-terms/` — WebFetch 403 / 429 で本調査未取得、OQ-03 でオーナー直接確認継続中。
- `https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan` — 同上。
- `https://chatgpt.com/codex/pricing/` — 本調査 403、developers.openai.com 側で代替確認済み。

---

**v1 確定**: 2026-05-02  
**次回更新**: Phase 1 着手時 P-D 改の運用実績に基づき、ToS 解釈リスクを再評価
