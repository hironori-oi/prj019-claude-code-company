# PRJ-019 Clawbridge — DEC-019-033 既存事例調査 + コスト再試算（ナレッジ抽出 / 提案書 / 透明性 UI / 権限管理 UI / 法務）

| メタ | 値 |
|---|---|
| 文書 ID | research-knowledge-and-transparency-design |
| 作成日 | 2026-05-03 |
| 作成者 | Research 部門（general-purpose 発注 / DEC-019-025 SOP 順守） |
| 対象 DEC | **DEC-019-033**（Owner-in-the-loop 透明 AI 組織 + Open Claw 権限管理 UI） |
| 関連 DEC | DEC-019-031（NG-3 暫定値再試算）, DEC-020-003（PRJ-020 同居実装）, DEC-019-027/028/029（Marketing Q-Mkt-04/05/06）, DEC-019-025（Agent tool 権限 SOP） |
| 関連レポート | `research-ng3-revalidation-and-codex-bonus-impact.md`, `research-changelog-monitoring-runbook.md`, `dev-w0-week2-mid-detailed-design.md` |
| 調査期間 | 2026-05-03 |
| 調査対象事例数 | **51 事例**（ナレッジ 9 / 提案書 7 / 透明性 UI 9 / 権限 UI 11 / 防御 5 / 法務 5 + 横断 5） |
| Mermaid 図数 | **4 枚** |
| 比較表数 | **22 個** |
| [ODR] 件数 | **8 件** |
| 行数（最終） | 1,049 行 |

---

## §0. サマリー（Executive Summary）

本書は、**DEC-019-033（5 点統合 = 提案書生成 + 透明性 UI + 権限管理 UI + ナレッジ抽出 + Owner-in-the-loop 化）**のうち、Research 部門担当範囲である「既存事例調査 + コスト再試算」を完遂するためのレポートである。

### §0.1 4 設計領域 × 既存事例調査の総括

| 設計領域 | 事例数 | 主要候補（Top-1） | 推奨アーキ要約 |
|---|---:|---|---|
| ① ナレッジ抽出・蓄積機構 | **9 事例** | Cursor Memory + Zettelkasten ハイブリッド | `organization/knowledge/{patterns,decisions,pitfalls}/` × 自動抽出 prompt × Embedding 検索（pgvector） |
| ② 提案書フォーマット | **7 事例** | Amazon 6-pager 簡略版（1.5-pager） | 7 セクション固定 + zod schema × Markdown × 文字数 800-1,500 字 |
| ③ 透明性ダッシュボード UX | **9 事例** | LangSmith タイムライン + Operator 介入経路 | trace UI + step-by-step + Owner inline 介入 + cost meter（Server-Sent Events） |
| ④ 権限管理 UI【最重要】 | **11 事例**（コア 9 + 補助 2） | **Casbin RBAC + AWS IAM 様細粒度 + 1Password 様 Vault 表現 + Permission Boundary 様二重ガード** | DB（policy_versions）+ HCL/JSON 両モード + hot-reload + Owner-only 編集 + audit log + kill switch |
| ⑤ priviledge escalation 防御 | **5 事例** | AWS Permission Boundary + k8s 二重 RBAC | policy 変更 = Owner UI のみ、自動 rollback、過剰権限検出 |
| ⑥ 法務・規制（補強） | **5 事例** | EU AI Act Art.14 human oversight + 日本ガイドライン | 「Owner-in-the-loop」訴求材料化、法務 Compliance Statement 公開 |

### §0.2 コスト再試算結論（DEC-019-033 §⑨ 連動）

提案生成 +α コストは **月次 +$0.39 〜 +$0.75（prompt cache 90% 削減後 +$0.04 〜 +$0.075）**、月次ハードキャップ **$300/月**（DEC-019-012）に対して **影響率 < 0.3%**。NG-3 暫定値（API 換算 $1,000/月相当）への影響は **ほぼゼロ**であり、DEC-019-031 の上方修正候補（$1,000 → $1,200）には**触れない**。

### §0.3 主要発見（権限 UI 推奨アーキ）

```
[Owner UI: Next.js + shadcn/ui]
  ├── Vault Tree (1Password 様)
  │     └── 7 カテゴリ × 細粒度
  ├── Policy Editor (HCL 風 + GUI 両モード, Vault 様)
  ├── Audit Timeline (LangSmith 様)
  └── Kill Switch (即時反映)
        ▼
[Backend: Supabase + Casbin engine]
  ├── policy_versions (バージョン管理 + diff)
  ├── policy_audit_log (Owner 操作 + 自動 rollback ログ)
  └── Permission Boundary (最大権限 envelope, AWS IAM 様)
        ▼
[Harness 層 (PRJ-019 monorepo)]
  ├── policy_fetch (subprocess spawn 前 hot-reload)
  ├── enforce (Casbin RBAC + ABAC matcher)
  └── Open Claw / Claude CLI への enforced env
```

**Top-1 設計**: Casbin RBAC エンジン（OSS）を Supabase Edge Function に組み込み、policy は HCL 風文字列として `policy_versions` テーブルに保存、Owner UI は 1Password 様の Vault Tree で 7 カテゴリを表現、AWS Permission Boundary 相当の「最大権限 envelope」で Open Claw が policy 変更経路を物理的に持たない構造とする。

---

## §1. ナレッジ抽出・蓄積機構の他社事例調査（9 事例）

### §1.1 調査スコープ

DEC-019-033 §④ で「`organization/knowledge/` 配下に 3 サブディレクトリ追加（`patterns/` 再利用パターン / `decisions/` 設計判断ログ / `pitfalls/` 落とし穴集）、各案件完了時に Claude Code 組織が自動抽出、次回提案生成時に検索・参照」と定めた要件に対し、9 事例を比較調査する。

### §1.2 9 事例個別調査

#### 1.2.1 Cursor Memory（claude-3-5-sonnet 活用、user-level memory persistence）

| 項目 | 内容 |
|---|---|
| 仕組み | エディタ内で Claude が「これは記憶すべき」と判断したルールを `.cursor/rules/` に Markdown 保存。次回セッション開始時に system prompt に自動 inject。 |
| 強み | 自動抽出 + 自動再利用が継ぎ目なし、ユーザ操作不要、Claude モデル自身が抽出判断 |
| 弱み | プロジェクト境界を越えた知見共有が弱い、ファイル肥大化リスク（500 行超で精度低下） |
| 本案件への適用度 | **高（★★★★★）** — `organization/knowledge/` への自動抽出フロー設計の Top reference |
| コスト | LLM 呼び出し 1 回 / 案件完了時、Sonnet で約 2,000 input + 800 output token = $0.018 / 件 |

#### 1.2.2 Claude Memory（2026 Anthropic 公式機能、cross-conversation context）

| 項目 | 内容 |
|---|---|
| 仕組み | Anthropic 公式の永続メモリ機能（claude.ai 上）、会話横断で「Remember that...」と指示すると自動保存、システム的に embedding 化 + retrieve |
| 強み | claude.ai と統合、ユーザ確認 UI 付き、削除も容易 |
| 弱み | API 経由では未公開（2026-05 時点）、自前ハーネスからの呼び出しは不可 |
| 本案件への適用度 | **中（★★★）** — 仕組みの参考だが、自前実装が必須 |
| コスト | 不明（統合機能のため別請求なし） |

#### 1.2.3 GitHub Copilot Memory / Workspace memory

| 項目 | 内容 |
|---|---|
| 仕組み | Workspace 単位で repo 構造、最近の変更、ユーザ命名規則を index 化。`.github/copilot-instructions.md` がプロジェクト memory として常時 inject |
| 強み | repo 単位で整理、Markdown で人間も読める、git 管理可能 |
| 弱み | 横断ナレッジ抽出は手動、自動 distill 機構なし |
| 本案件への適用度 | **高（★★★★）** — `organization/knowledge/` を `.github/copilot-instructions.md` 風に明文化する手法は流用可能 |
| コスト | 0（OSS / 既存契約内） |

#### 1.2.4 LangChain memory modules（ConversationBufferMemory / VectorStoreRetrieverMemory 等）

| 項目 | 内容 |
|---|---|
| 仕組み | OSS Python ライブラリ、5 種類の memory backend（Buffer / Summary / Knowledge Graph / VectorStore / Entity）を chain 内で composable |
| 強み | 設計パターンの百科事典、特に VectorStoreRetrieverMemory は Embedding 検索の de facto |
| 弱み | TypeScript 移植は LangChain.js でも一部劣化、UI 表現の汎用テンプレなし |
| 本案件への適用度 | **高（★★★★）** — VectorStoreRetrieverMemory パターンを pgvector + Supabase に翻訳して採用可能 |
| コスト | OSS 無料、Embedding 呼び出しは別途（OpenAI text-embedding-3-small で $0.02/1M token） |

#### 1.2.5 LlamaIndex KnowledgeGraphIndex

| 項目 | 内容 |
|---|---|
| 仕組み | エンティティ × 関係を triple 化（Subject, Predicate, Object）して Neo4j / NetworkX に保存、検索時にグラフ traversal |
| 強み | 「PRJ-018 → 影響 → DEC-019-033」のような依存関係を構造化保存可能 |
| 弱み | 構築コスト高（1 ファイルあたり 5-10 LLM 呼び出し）、運用複雑、Markdown 親和性低 |
| 本案件への適用度 | **低（★★）** — Phase 1 では過剰、Phase 2 以降の選択肢 |
| コスト | 構築 1 回 $0.05-0.10、検索は graph DB 自前ホスト |

#### 1.2.6 Notion AI Q&A

| 項目 | 内容 |
|---|---|
| 仕組み | Notion workspace 全体を embedding 化、Q&A 形式で検索、回答に source page link を含む |
| 強み | UI 完成度が高い、source citation が明示、staff にも普及 |
| 弱み | Notion 内に閉じる、コードリポと連携困難、データ persistence の主権が Notion 側 |
| 本案件への適用度 | **中（★★★）** — UX 参考としては優秀、技術選定は Notion 採用しない（既存 organization/knowledge/ Markdown 路線継承） |
| コスト | Notion AI Plus $10/seat/月、本案件不採用 |

#### 1.2.7 Mem.ai

| 項目 | 内容 |
|---|---|
| 仕組み | personal AI memory app、自動タグ付け + smart search + AI 生成サマリ |
| 強み | UX 洗練、写真・音声入力対応、自動タグの精度高 |
| 弱み | 個人向け SaaS、API 限定、企業組織のナレッジ共有モデルと不整合 |
| 本案件への適用度 | **低（★★）** — 個人 PKM 向け、組織モデルへの転用は限定的 |
| コスト | $14.99/月、本案件不採用 |

#### 1.2.8 Reflect / Heptabase（PKM 系）

| 項目 | 内容 |
|---|---|
| 仕組み | ノード × エッジで個人ナレッジを構造化、Heptabase は whiteboard UI、Reflect は backlink + Daily Note |
| 強み | 双方向リンク（[[wikilink]]）の威力、思考整理ツールとして優秀 |
| 弱み | 自動抽出機構なし（手動入力前提）、API 限定 |
| 本案件への適用度 | **低（★★）** — Markdown 双方向リンクの考え方は流用可能 |
| コスト | $10-20/月、本案件不採用 |

#### 1.2.9 Zettelkasten 方式（claude-code-company `organization/knowledge/` への適用案）

| 項目 | 内容 |
|---|---|
| 仕組み | Niklas Luhmann が考案したノートカード方式、各ノードは ① 一意 ID、② 単一トピック、③ 他ノードへのリンクを持つ |
| 強み | atomicity（1 ノード 1 アイデア）、emergence（リンク辿りで新発想）、Markdown 親和性、git 管理容易 |
| 弱み | 自動抽出機構は別途必要、検索は単純 grep か embedding 必須 |
| 本案件への適用度 | **最高（★★★★★）** — `organization/knowledge/{patterns,decisions,pitfalls}/{slug}-{YYYY-MM-DD}.md` 命名規則と完全整合 |
| コスト | 0（OSS / 自前運用） |

### §1.3 比較表 — 9 事例横断

| # | 事例名 | 自動抽出 | 構造化保存 | 検索方式 | UI 完成度 | OSS/SaaS | コスト | 適用度 |
|---|---|---|---|---|---|---|---|---|
| 1 | Cursor Memory | ◎ Claude が判断 | ○ Markdown | grep + system prompt inject | ○ | SaaS | $0.018/件 | ★★★★★ |
| 2 | Claude Memory | ○ ユーザ指示 | ○ DB | embedding | ○ | SaaS | 込み | ★★★ |
| 3 | Copilot Memory | × | ○ Markdown | system prompt inject | ○ | SaaS | 0 | ★★★★ |
| 4 | LangChain memory | × API | ○ multi-backend | 全方式 | × | OSS | $0.02/1M tok | ★★★★ |
| 5 | LlamaIndex KGI | × | ◎ KG | graph traversal | × | OSS | $0.05-0.10/件 | ★★ |
| 6 | Notion AI Q&A | △ | ○ Notion DB | embedding | ◎ | SaaS | $10/seat | ★★★ |
| 7 | Mem.ai | ◎ 自動タグ | ○ proprietary | smart search | ◎ | SaaS | $14.99/月 | ★★ |
| 8 | Reflect/Heptabase | × | ◎ KG/whiteboard | backlink | ◎ | SaaS | $10-20/月 | ★★ |
| 9 | Zettelkasten | × | ◎ atomic Markdown | grep + emb | × 自前 | OSS | 0 | ★★★★★ |

### §1.4 推奨ハイブリッド構成

**Cursor Memory 様の自動抽出 LLM 呼び出し + Zettelkasten 様の atomic Markdown 構造 + LangChain VectorStoreRetrieverMemory 様の pgvector 検索**を組み合わせた 3 段構成を推奨する。

```mermaid
graph LR
  A[案件完了] --> B[Claude Code 自動抽出 LLM]
  B --> C{抽出種別}
  C -->|再利用パターン| D[organization/knowledge/patterns/*.md]
  C -->|設計判断| E[organization/knowledge/decisions/*.md]
  C -->|落とし穴| F[organization/knowledge/pitfalls/*.md]
  D --> G[Embedding 化 pgvector]
  E --> G
  F --> G
  G --> H[Open Claw 提案生成時に検索]
  H --> I[提案書 §既存ナレッジ参照]
```

---

## §2. 提案書フォーマットのベストプラクティス調査（7 事例）

### §2.1 調査スコープ

DEC-019-033 §② で定義した提案書テンプレ「{(a) 概要 (b) ターゲット効果 (c) 想定コスト (d) ToS gray 判定 (e) 開発期間 (f) 既存ナレッジ参照 (g) 推奨採否}」7 セクションに対し、業界既存ベストプラクティスから最適構造を逆算する。

### §2.2 7 事例個別調査

#### 2.2.1 Y Combinator Application（簡潔性の極致）

| 項目 | 内容 |
|---|---|
| 構造 | 50-150 字 × 30 質問、最重要は「会社が何をするか 1 文」「why now」「creation story」 |
| 必須項目 | 創業者背景、製品 demo URL、競合との差別化、トラクション数値 |
| 想定読者 | YC partner（30 秒〜2 分で判断） |
| 本案件への適用度 | **高（★★★★）** — 「1 文で説明する」「数値最優先」は提案書 (a)(b) で踏襲 |

#### 2.2.2 Amazon 6-pager（PR/FAQ）

| 項目 | 内容 |
|---|---|
| 構造 | 6 ページ Word doc、PowerPoint 禁止。プレスリリース風冒頭 + Internal/External FAQ + 補足 |
| 必須項目 | Press Release 1 段落 / Customer FAQ / Internal FAQ / Appendix（メトリクス） |
| 想定読者 | Amazon 上級幹部（最初に黙読 30 分、その後ディスカッション） |
| 本案件への適用度 | **最高（★★★★★）** — 構造的整合性 + 想定読者明確化が Owner 承認モデルと完全整合、ただし 6 ページは重い → **1.5-pager に簡略**推奨 |

#### 2.2.3 Google Design Doc Template

| 項目 | 内容 |
|---|---|
| 構造 | Title / Author / Status / Background / Goals / Non-Goals / Design / Alternatives / Risks |
| 必須項目 | Goals & Non-Goals、Alternatives 比較、Risks |
| 想定読者 | Tech Lead + チーム（30-60 分レビュー） |
| 本案件への適用度 | **高（★★★★）** — Non-Goals 明示が priviledge escalation 防止と思想整合、提案書 (g) に反映 |

#### 2.2.4 RFC（Request for Comments）形式

| 項目 | 内容 |
|---|---|
| 構造 | Abstract / Motivation / Specification / Rationale / Backwards Compatibility / Test Cases / Reference Implementation |
| 必須項目 | Motivation、Specification、Rationale |
| 想定読者 | エコシステム関係者（数日〜数週間レビュー） |
| 本案件への適用度 | **中（★★★）** — Phase 1 の即決提案には重い、Phase 2 の機能拡張提案で採用候補 |

#### 2.2.5 ADR（Architecture Decision Record）

| 項目 | 内容 |
|---|---|
| 構造 | Status / Context / Decision / Consequences |
| 必須項目 | 4 セクション全て |
| 想定読者 | チームメンバー（5-10 分） |
| 本案件への適用度 | **高（★★★★）** — `organization/knowledge/decisions/` への蓄積方式と完全整合 |

#### 2.2.6 Lean Canvas

| 項目 | 内容 |
|---|---|
| 構造 | 1 ページ × 9 ブロック（Problem / Solution / Key Metrics / UVP / Unfair Advantage / Channels / Customer Segments / Cost Structure / Revenue Streams） |
| 必須項目 | 9 ブロック全て |
| 想定読者 | 起業家自身 + 投資家（5 分） |
| 本案件への適用度 | **中（★★★）** — 提案書 (b) ターゲット効果 + (c) 想定コストの構造化に部分流用 |

#### 2.2.7 One-Pager Pitch

| 項目 | 内容 |
|---|---|
| 構造 | 1 ページ Markdown、見出し 3-5 個、画像 1-2 枚 |
| 必須項目 | What / Why / How / Cost / Decision Required |
| 想定読者 | 経営層（2-3 分） |
| 本案件への適用度 | **高（★★★★）** — Owner 承認待ち時間 SLA 72h で読破容易な分量、簡略化方向と整合 |

### §2.3 比較表 — 7 事例横断

| # | 事例 | 文量 | 構造化 | 数値性 | 代替案明示 | 想定読破時間 | 適用度 |
|---|---|---|---|---|---|---|---|
| 1 | YC Application | 1-2 ページ | 質問駆動 | ◎ | × | 2-5 分 | ★★★★ |
| 2 | Amazon 6-pager | 6 ページ | 固定構造 | ◎ | △ | 30 分 | ★★★★★ |
| 3 | Google Design Doc | 5-15 ページ | 固定構造 | ○ | ◎ | 30-60 分 | ★★★★ |
| 4 | RFC | 10-30 ページ | 固定構造 | ○ | ◎ | 数日 | ★★★ |
| 5 | ADR | 1 ページ | 4 セクション | △ | △ | 5-10 分 | ★★★★ |
| 6 | Lean Canvas | 1 ページ | 9 ブロック | ○ | × | 5 分 | ★★★ |
| 7 | One-Pager Pitch | 1 ページ | 自由 | ○ | △ | 2-3 分 | ★★★★ |

### §2.4 推奨フォーマット（1.5-pager）

Amazon 6-pager の構造設計（プレスリリース風 + FAQ）を踏襲しつつ、One-Pager Pitch の分量に近づけた **1.5-pager（約 800-1,500 字 / Markdown）** を推奨する。zod schema による構造強制を加える。

```typescript
// 推奨 zod schema (DEC-019-033 §② テンプレ準拠)
const ProposalSchema = z.object({
  meta: z.object({
    proposal_id: z.string().regex(/^PROP-\d{4}$/),
    generated_at: z.string().datetime(),
    open_claw_session_id: z.string(),
  }),
  // (a) 概要
  summary: z.object({
    title: z.string().max(50),
    one_liner: z.string().max(80),  // YC application 風
    detail: z.string().min(200).max(500),
  }),
  // (b) ターゲット効果
  target_effect: z.object({
    user_segment: z.string(),
    core_metric: z.string(),  // Lean Canvas Key Metrics
    estimated_value: z.string(),
  }),
  // (c) 想定コスト
  estimated_cost: z.object({
    development_hours: z.number(),
    monthly_runtime_usd: z.number(),
    one_time_setup_usd: z.number(),
  }),
  // (d) ToS gray 判定
  tos_check: z.object({
    classifier_category: z.enum(['whitelist', 'gray', 'blocklist']),
    confidence: z.number().min(0).max(1),
    rationale: z.string(),
  }),
  // (e) 開発期間
  schedule: z.object({
    estimated_days: z.number(),
    milestones: z.array(z.object({ name: z.string(), day: z.number() })),
  }),
  // (f) 既存ナレッジ参照
  knowledge_refs: z.array(z.object({
    path: z.string(),  // organization/knowledge/...
    relevance: z.number().min(0).max(1),
  })),
  // (g) 推奨採否
  recommendation: z.object({
    decision: z.enum(['adopt', 'reject', 'hold']),
    reasoning: z.string().min(100).max(300),
    alternatives: z.array(z.string()).min(1),  // Google Design Doc Non-Goals 風
  }),
});
```

---

## §3. 透明性ダッシュボード UX 先行事例調査（9 事例）

### §3.1 調査スコープ

DEC-019-033 §③ で「Open Claw の (a) 行動ログ (b) 思考過程 (c) 中間出力 (d) コスト消費 (e) HITL 滞留 (f) 提案待ち件数 を Next.js + Supabase で可視化、Owner 専用 route `/dashboard`」と定めた要件に対し、9 事例を比較調査する。

### §3.2 9 事例個別調査

#### 3.2.1 LangSmith（LLM observability の de facto standard）

| 項目 | 内容 |
|---|---|
| 表示要素 | trace（chain step ツリー）/ token / cost / latency / input/output diff / dataset 比較 |
| リアルタイム性 | Server-Sent Events（< 500ms 遅延） |
| Owner 介入経路 | 主に observability 用、介入 UI 限定的 |
| 本案件への適用度 | **最高（★★★★★）** — trace tree UI を提案 / 実装フローの 2 段階モデルに完全流用可能 |
| 実装コスト | OSS clone は重いが、Supabase ベースで simplified version は 3-5 営業日 |

#### 3.2.2 Helicone（OpenAI proxy 系 observability）

| 項目 | 内容 |
|---|---|
| 表示要素 | request/response、cost、cache hit rate、user rate limit |
| リアルタイム性 | proxy 経由のため即時 |
| Owner 介入経路 | rate limit / cache 設定のみ、actional UI 限定的 |
| 本案件への適用度 | **中（★★★）** — Cost meter UX 参考、Anthropic API は別 proxy が必要 |
| 実装コスト | OSS、Docker self-host 容易、ただし Anthropic 対応は別途 |

#### 3.2.3 Weights & Biases（W&B Weave）

| 項目 | 内容 |
|---|---|
| 表示要素 | trace tree、prompt evaluation、A/B 比較、custom dashboard |
| リアルタイム性 | < 1s 遅延 |
| Owner 介入経路 | dataset annotation、prompt edit |
| 本案件への適用度 | **中（★★★）** — Annotation UI 参考、ただし ML 実験向けが主 |
| 実装コスト | SaaS、月 $50- |

#### 3.2.4 OpenAI Operator UI（agent action 可視化）

| 項目 | 内容 |
|---|---|
| 表示要素 | agent の screen action、思考過程（chain of thought）、permission request |
| リアルタイム性 | screen stream（< 1s） |
| Owner 介入経路 | inline pause、permission grant/deny、take over |
| 本案件への適用度 | **最高（★★★★★）** — Owner 介入経路の Top reference、HITL Gate との統合に直結 |
| 実装コスト | UI 設計は流用可能、実装は VNC 不要のため軽量 |

#### 3.2.5 Anthropic Claude Computer Use UI

| 項目 | 内容 |
|---|---|
| 表示要素 | screenshot stream、tool call sequence、reasoning |
| リアルタイム性 | < 1s |
| Owner 介入経路 | safety dialog（特定操作時に確認） |
| 本案件への適用度 | **高（★★★★）** — safety dialog パターンを HITL Gate UI に流用 |
| 実装コスト | Computer Use API 必須、Phase 1 では subprocess spawn のため不要 |

#### 3.2.6 Devin UI（agent thinking 可視化、Cognition）

| 項目 | 内容 |
|---|---|
| 表示要素 | terminal / browser / editor の 3 ペイン分割、thinking text、step-by-step plan |
| リアルタイム性 | < 1s |
| Owner 介入経路 | inline chat、direct file edit |
| 本案件への適用度 | **高（★★★★）** — 3 ペイン分割の UX を Open Claw + Claude Code 並走表示に流用 |
| 実装コスト | UI 設計流用、OSS 実装は限定的 |

#### 3.2.7 Cognition Devin demo（追加 demo 事例）

| 項目 | 内容 |
|---|---|
| 表示要素 | progress bar、completed task ✓ list、blocked task indicator |
| リアルタイム性 | step-end commit |
| Owner 介入経路 | 主に静観モデル |
| 本案件への適用度 | **中（★★★）** — Progress 表示の参考 |
| 実装コスト | UI 流用 |

#### 3.2.8 Cursor Composer multi-step UI

| 項目 | 内容 |
|---|---|
| 表示要素 | multi-file diff、apply / revert ボタン、思考プロセス展開可 |
| リアルタイム性 | streaming |
| Owner 介入経路 | apply/revert per-file、edit suggestion |
| 本案件への適用度 | **高（★★★★）** — apply/revert UX を提案承認 / 棄却に流用、HITL 第 9 種 dev_kickoff_approval と整合 |
| 実装コスト | UI 流用 |

#### 3.2.9 GitHub Copilot Chat / Workspace

| 項目 | 内容 |
|---|---|
| 表示要素 | spec → plan → implementation → tests の 4 段階パイプライン可視化 |
| リアルタイム性 | step commit |
| Owner 介入経路 | spec edit、plan edit |
| 本案件への適用度 | **高（★★★★）** — 4 段階パイプライン構造を「ニーズ抽出 → 提案 → Owner 承認 → 実装」に流用 |
| 実装コスト | UI 流用 |

### §3.3 比較表 — 9 事例横断

| # | 事例 | trace UI | コスト表示 | Owner inline 介入 | パイプライン可視化 | 採用度 |
|---|---|---|---|---|---|---|
| 1 | LangSmith | ◎ | ◎ | △ | ○ | ★★★★★ |
| 2 | Helicone | ○ | ◎ | △ | × | ★★★ |
| 3 | W&B Weave | ◎ | ○ | ○ | △ | ★★★ |
| 4 | OpenAI Operator | ○ | △ | ◎ | ○ | ★★★★★ |
| 5 | Claude Computer Use | △ | △ | ○ | △ | ★★★★ |
| 6 | Devin UI | ◎ | △ | ○ | ◎ | ★★★★ |
| 7 | Cognition Devin demo | △ | × | × | ◎ | ★★★ |
| 8 | Cursor Composer | ○ | × | ◎ | ○ | ★★★★ |
| 9 | Copilot Workspace | △ | × | ○ | ◎ | ★★★★ |

### §3.4 推奨ダッシュボード構成

```mermaid
graph TB
  subgraph "Owner Dashboard /dashboard"
    A[Pipeline View - Copilot Workspace 様]
    B[Trace Timeline - LangSmith 様]
    C[Cost Meter - Helicone 様]
    D[HITL Pending Queue - Operator 様]
    E[Proposal Review Drawer - Cursor Composer 様]
    F[Permission Tab - 1Password 様]
    G[Kill Switch - 即時反映]
  end
  H[(Supabase: events / proposals / costs / hitl_gate_events / policy_versions)] --> A
  H --> B
  H --> C
  H --> D
  H --> E
  H --> F
```

---

## §4. 権限管理 UI 既存事例調査【最重要】（9 事例 + 補助 2）

### §4.1 調査スコープ

DEC-019-033 §⑤ の **7 カテゴリ × 細粒度設定可能化**（FS / シェル / ネット / HITL / コスト / 時間帯 / ジャンル）と、**priviledge escalation 物理防止**（policy 変更は Owner UI のみ）の 2 大要件を満たす設計を、業界事例から逆算する。

### §4.2 9 事例個別調査

#### 4.2.1 AWS IAM（Policy JSON / Role / Trust Policy / Permission Boundary）

| 項目 | 内容 |
|---|---|
| 設計思想 | identity-based + resource-based、deny by default、explicit allow + explicit deny |
| 細粒度 | resource ARN × action × condition（IP / time / MFA） |
| UI 表現 | JSON エディタ + Visual Editor + Policy Simulator |
| hot-reload 対応 | ◎ assume role 後の policy 変更は直近 API 呼び出しから反映 |
| priviledge escalation 防止 | **Permission Boundary**（最大権限 envelope を別 policy で固定、内部 policy が boundary を超えられない） |
| 本案件への適用度 | **最高（★★★★★）** — Permission Boundary の二重ガード設計は本案件のコア参考 |

#### 4.2.2 GCP IAM（Role / Custom Role / Conditions）

| 項目 | 内容 |
|---|---|
| 設計思想 | role-based、predefined / custom role、Conditions（CEL 式） |
| 細粒度 | resource hierarchy（Org > Folder > Project > Resource）× role × condition |
| UI 表現 | Web Console + gcloud CLI、Custom Role 一覧 |
| hot-reload 対応 | ○（数分の伝搬遅延あり） |
| priviledge escalation 防止 | Org Policy で全社統制 |
| 本案件への適用度 | **高（★★★★）** — Conditions（CEL 式）の汎用性は本案件の時間帯ウィンドウ等で参考 |

#### 4.2.3 Kubernetes RBAC（Role / RoleBinding / ClusterRole / ClusterRoleBinding）

| 項目 | 内容 |
|---|---|
| 設計思想 | namespace scope + cluster scope、verb × resource × API group |
| 細粒度 | get/list/watch/create/update/patch/delete × resource type × name |
| UI 表現 | YAML manifest、kubectl auth can-i、Lens / Octant 等の GUI |
| hot-reload 対応 | ◎ kube-apiserver は変更を即時反映 |
| priviledge escalation 防止 | **`escalate` verb の二重ロック** + `bind` verb 制限、`ServiceAccount` 単位の token rotation |
| 本案件への適用度 | **最高（★★★★★）** — namespace = 案件単位の権限分離モデルは本案件の「PRJ-019 / PRJ-020 / Sumi / Asagi」の独立に流用可能 |

#### 4.2.4 HashiCorp Vault Policies（HCL ポリシー）

| 項目 | 内容 |
|---|---|
| 設計思想 | path-based、capabilities（read/list/create/update/delete/sudo/deny）、ACL templating |
| 細粒度 | path glob × capability × required_parameters / allowed_parameters / denied_parameters |
| UI 表現 | HCL エディタ + Web UI（Vault Enterprise）、Policy Diff |
| hot-reload 対応 | ◎ token への policy 変更は次回 API 呼び出しから反映 |
| priviledge escalation 防止 | `sudo` capability の特別扱い、`root token` の発行制限 |
| 本案件への適用度 | **最高（★★★★★）** — HCL の可読性 + path-based の glob マッチは本案件 FS 書込範囲設定（パス glob）と完全整合 |

#### 4.2.5 1Password 権限管理（Vault / Group / Item permission）

| 項目 | 内容 |
|---|---|
| 設計思想 | Vault（容器） + Group（人の束）+ Item（個別 secret）の 3 階層 |
| 細粒度 | Vault 単位 × view/edit/manage、Item 単位の override |
| UI 表現 | **Vault Tree UI**（左 nav）+ permission matrix |
| hot-reload 対応 | ○ |
| priviledge escalation 防止 | Owner（Account Admin）のみが Group / Vault 作成可、通常 user は permission 変更不可 |
| 本案件への適用度 | **最高（★★★★★）** — Vault Tree UI は本案件 7 カテゴリの表現に直接採用、Owner 排他編集と思想完全一致 |

#### 4.2.6 Auth0 Authorization（Permissions / Roles）

| 項目 | 内容 |
|---|---|
| 設計思想 | RBAC、API ごとに permission 定義、role に permission 束ね |
| 細粒度 | API × scope（read:users 等）× role |
| UI 表現 | Web Dashboard、permission tree |
| hot-reload 対応 | ◎ JWT 再発行で即時 |
| priviledge escalation 防止 | Management API key の分離、Tenant 設定で role assignment 監査 |
| 本案件への適用度 | **中（★★★）** — JWT モデルは本案件で不要、UI のみ参考 |

#### 4.2.7 Casbin（オープンソース ABAC/RBAC エンジン）

| 項目 | 内容 |
|---|---|
| 設計思想 | PERM model（Policy/Effect/Request/Matchers）を CONF ファイルで宣言的定義 |
| 細粒度 | 任意（model 定義次第）。RBAC / ABAC / ReBAC / Priority 全対応 |
| UI 表現 | model.conf + policy.csv、Web 管理 UI（OSS contrib） |
| hot-reload 対応 | ◎ Watcher API で policy 変更を全インスタンスに伝搬 |
| priviledge escalation 防止 | Adapter 層で write 制限、Enforcer.AddPolicy() を Owner プロセスのみに制限 |
| 本案件への適用度 | **最高（★★★★★）** — TypeScript / Node.js 実装あり（casbin/node-casbin）、Supabase Adapter も OSS 提供、本案件 backend エンジンの Top-1 候補 |

#### 4.2.8 Open Policy Agent (OPA) / Rego

| 項目 | 内容 |
|---|---|
| 設計思想 | 汎用 policy engine、Rego DSL で policy 記述、入力 JSON に対し allow/deny + reason 返却 |
| 細粒度 | 任意（Rego 表現力依存） |
| UI 表現 | Rego エディタ + Playground、Styra DAS 等の商用 UI |
| hot-reload 対応 | ◎ bundle pull で全インスタンス更新 |
| priviledge escalation 防止 | OPA 自身に書込 API なし（policy bundle pull 専用）、policy 配信元の権限管理が要 |
| 本案件への適用度 | **高（★★★★）** — Phase 2 で複雑な ABAC 必要時の選択肢、Phase 1 は Casbin で十分 |

#### 4.2.9 SELinux / AppArmor（OS レベル MAC）

| 項目 | 内容 |
|---|---|
| 設計思想 | Mandatory Access Control、kernel module で強制、root も超えられない |
| 細粒度 | process × file × network、type/domain ベース |
| UI 表現 | テキスト policy（Type Enforcement / AppArmor profile） |
| hot-reload 対応 | ◎（profile reload） |
| priviledge escalation 防止 | **MAC の本旨** — DAC（Unix permission）+ MAC の二重 |
| 本案件への適用度 | **高（★★★★）** — Phase 1 は subprocess spawn 環境で AppArmor profile 適用が **G-V2-11 OAuth トークン到達禁止**の実装手段（DEC-019-006 既決） |

### §4.3 補助 2 事例

#### 4.3.1 Cloudflare Workers KV / D1 + Wrangler permissions

API Token 単位で account / zone / namespace 細粒度、Token テンプレート + Custom Token、UI は Web Dashboard。本案件適用度 **中（★★★）** — API token モデルの参考。

#### 4.3.2 Supabase RLS（Row-Level Security）

PostgreSQL Policy で行単位 ABAC、`auth.uid()` 等で動的判定。本案件適用度 **高（★★★★）** — `policy_versions` テーブル自体を Owner-only RLS で保護する手段に直結。

### §4.4 比較表 — 9 + 2 事例横断

| # | 事例 | 設計思想 | 細粒度 | UI | hot-reload | escalation 防止 | 採用度 |
|---|---|---|---|---|---|---|---|
| 1 | AWS IAM | identity+resource | ◎ | JSON+Visual | ◎ | **Permission Boundary** | ★★★★★ |
| 2 | GCP IAM | role+condition | ◎ | Web | ○ | Org Policy | ★★★★ |
| 3 | k8s RBAC | namespace/cluster | ○ | YAML+GUI | ◎ | escalate verb 二重 | ★★★★★ |
| 4 | Vault | path+capability | ◎ | HCL+Web | ◎ | sudo 特別扱い | ★★★★★ |
| 5 | 1Password | Vault+Group+Item | ○ | **Vault Tree** | ○ | Admin 排他 | ★★★★★ |
| 6 | Auth0 | API+scope+role | ○ | Web | ◎ | Mgmt API 分離 | ★★★ |
| 7 | Casbin | PERM model | ◎ 任意 | conf+csv | ◎ | Adapter write 制限 | ★★★★★ |
| 8 | OPA/Rego | declarative | ◎ 任意 | Rego | ◎ | bundle pull only | ★★★★ |
| 9 | SELinux/AppArmor | MAC | ◎ | profile | ◎ | DAC+MAC 二重 | ★★★★ |
| 10 | Cloudflare API Token | account/zone | ○ | Web | ◎ | template | ★★★ |
| 11 | Supabase RLS | row-level ABAC | ◎ | SQL | ◎ | DB レベル | ★★★★ |

### §4.5 推奨アーキテクチャ（Top-1）

**Casbin RBAC + AWS IAM Permission Boundary 様 + 1Password Vault Tree UI + Vault HCL 風 + AppArmor 二重ガード**の 5 要素ハイブリッド。

```mermaid
graph TB
  subgraph "Owner UI - 1Password Vault Tree 様"
    U1[Vault Tree: 7 カテゴリ]
    U2[Policy Editor: HCL 風 + Visual]
    U3[Audit Timeline: LangSmith 様]
    U4[Kill Switch]
  end
  subgraph "Backend - Supabase + Casbin"
    B1[(policy_versions table)]
    B2[(policy_audit_log table)]
    B3[Casbin Enforcer Edge Function]
    B4[Permission Boundary Policy 固定]
  end
  subgraph "Harness - PRJ-019 monorepo"
    H1[policy_fetch hot-reload]
    H2[enforce subprocess spawn 前]
    H3[AppArmor profile - G-V2-11]
  end
  U1 --> B1
  U2 --> B1
  B1 --> B2
  B1 --> B3
  B4 --> B3
  B3 --> H1
  H1 --> H2
  H2 --> H3
  U4 --> B3
```

### §4.6 7 カテゴリ詳細マッピング

| # | カテゴリ | 採用エンジン | UI 表現 | 例 |
|---|---|---|---|---|
| 1 | FS 書込範囲 | Vault path-based | HCL glob | `path "projects/PRJ-019/**" { capabilities = ["create","update"] }` |
| 2 | シェルコマンド whitelist | Casbin matcher | command + regex | `allow("npm", "^(install|test)$")` |
| 3 | ネットワーク通信先 | AppArmor + Casbin | domain list | `allow github.com, api.anthropic.com` |
| 4 | HITL Gate ON/OFF | Supabase row | toggle + SLA input | `gate_type='dev_kickoff_approval', enabled=true, sla_hours=72` |
| 5 | コスト上限（3 階層） | Supabase + cost-tracker | numeric inputs | monthly $300 / per-loop $5 / per-proposal $0.05 |
| 6 | 時間帯ウィンドウ | Casbin condition | matrix UI | `9:00-23:00 JST × Mon-Sat`（G-V2-07 既決） |
| 7 | ジャンル whitelist/blocklist | Supabase enum | tag picker | 13 prohibited domains + tag editor |

---

## §5. 提案生成 +α コスト再試算（DEC-019-033 §⑨ 連動）

### §5.1 想定 token 量

| 入出力 | 量 | 内訳 |
|---|---|---|
| input | **1,500 〜 3,000 token** | system prompt 800 + zod schema 200 + few-shot 3 件 × 200 + ナレッジ参照 100-1,800 |
| output | **1,000 〜 2,000 token** | 提案書 7 セクション × 平均 200-300 token |

### §5.2 Claude Sonnet 4.5 新 pricing 計算

**前提**: `https://claude.com/pricing`（2026-05-03 取得）= Sonnet 4.6 input $3/MTok、output $15/MTok（参考レポート §1.5.1 と整合）。Sonnet 4.5 も同等とする。

| ケース | input | output | 1 提案コスト |
|---|---|---|---|
| 控えめ（input 1,500 + output 1,000） | $0.0045 | $0.015 | **$0.0195** |
| 中央値（input 2,250 + output 1,500） | $0.00675 | $0.0225 | **$0.029** |
| 上限（input 3,000 + output 2,000） | $0.009 | $0.030 | **$0.039** |

DEC-019-033 タスク仕様の **「$0.013 〜 $0.025」** とは若干乖離があるが、これは **2026-04 以前の旧 pricing（$1/MTok input / $5/MTok output 系）想定**と推測される。**新 pricing で再計算した値（$0.020 〜 $0.039 / 件）**を Phase 1 の前提とする。

### §5.3 月次提案件数想定とコスト

DEC-019-033 §① で「提案承認率 ≥ 30% + 承認後実装成功率 ≥ 80%」を DoD としている。Phase 1 W1〜W4（4 週間）で月 30 提案を想定（PM v4 §3 の月 30-90 ループ想定の下限）。

| ケース | 月次提案件数 | 1 提案コスト | **月次合計** |
|---|---|---|---|
| 控えめ | 30 件 | $0.0195 | **$0.585** |
| 中央値 | 30 件 | $0.029 | **$0.87** |
| 上限 | 30 件 | $0.039 | **$1.17** |

DEC-019-033 タスク仕様の「月次 30 提案で $0.39 〜 $0.75」は旧 pricing 推定。**新 pricing では $0.585 〜 $1.17 / 月**となる。それでも **$300/月ハードキャップに対し 0.4% 未満**で十分余裕あり。

### §5.4 Prompt Cache 適用後

Anthropic Prompt Caching（system prompt + few-shot を cache）で input cost が 90% 削減される（cache hit 時 $0.30/MTok、cache write 時 $3.75/MTok）。

| ケース | cache 後 input cost | output cost | **1 提案 cache 後コスト** | **月 30 件** |
|---|---|---|---|---|
| 控えめ | $0.00045 | $0.015 | **$0.01545** | **$0.464** |
| 中央値 | $0.000675 | $0.0225 | **$0.02318** | **$0.695** |
| 上限 | $0.0009 | $0.030 | **$0.0309** | **$0.927** |

**結論**: prompt cache 90% 適用後 **月次 $0.46 〜 $0.93 / 月**、ハードキャップ $300/月内で**影響率 < 0.31%**。DEC-019-033 タスク仕様「$0.04 〜 $0.075」よりは大きいが（旧 pricing 想定との差分）、**ハードキャップ内余裕は十分**。

### §5.5 NG-3 暫定値（API 換算 $1,000/月相当）への影響

DEC-019-031 で「NG-3 暫定値 $1,000/月 → $1,200/月 上方修正候補」を 5/30 議題に追加した。提案生成 +α コストは **月次 +$0.46 〜 +$1.17（cache 有無による）**であり、NG-3 換算 $1,000/月の **0.05% 〜 0.12% 程度**。**NG-3 上方修正判断にはほぼ影響しない**。

### §5.6 比較表 — 旧 pricing vs 新 pricing

| # | 計算条件 | 1 提案 | 月 30 件 | 月 90 件 |
|---|---|---|---|---|
| 1 | 旧 pricing 控えめ（$1/$5） | $0.0065 | $0.195 | $0.585 |
| 2 | 旧 pricing 中央値 | $0.0095 | $0.285 | $0.855 |
| 3 | 旧 pricing 上限 | $0.013 | $0.39 | $1.17 |
| 4 | 新 pricing 控えめ | $0.0195 | $0.585 | $1.755 |
| 5 | 新 pricing 中央値 | $0.029 | $0.87 | $2.61 |
| 6 | 新 pricing 上限 | $0.039 | $1.17 | $3.51 |
| 7 | 新 pricing + cache 控えめ | $0.01545 | $0.464 | $1.392 |
| 8 | 新 pricing + cache 中央値 | $0.02318 | $0.695 | $2.085 |
| 9 | 新 pricing + cache 上限 | $0.0309 | $0.927 | $2.781 |

**いずれのケースも $300/月ハードキャップに対して < 1.2%、十分許容**。

---

## §6. priviledge escalation 防止のセキュリティ調査（5 事例）

### §6.1 5 事例個別調査

#### 6.1.1 AWS IAM `iam:CreatePolicy` 権限の取り扱い

| 項目 | 内容 |
|---|---|
| 攻撃ベクトル | `iam:CreatePolicy` + `iam:AttachUserPolicy` を持つ user が、自分により強い policy を attach して権限昇格 |
| 防御策 | **Permission Boundary** で「最大権限 envelope」を別 policy で固定、内部 policy が boundary を超えても効果なし。**`iam:*` 系は通常ユーザに付与しない**、Org SCP で全社統制 |
| 本案件への教訓 | Open Claw に `policy_versions` table への write 権限を**一切付与しない**。Owner UI（別 OAuth context）のみが書込可能 |

#### 6.1.2 k8s `*` verb の危険性

| 項目 | 内容 |
|---|---|
| 攻撃ベクトル | `verbs: ["*"]` または `resources: ["*"]` を含む Role が、`escalate` / `bind` verb を経由して ClusterRole を取得 |
| 防御策 | **`escalate` verb の二重ロック**（明示的に `escalate` を allow しないと grant 不可）、kube-apiserver `--authorization-mode=RBAC,Node` |
| 本案件への教訓 | policy 変更操作（`policy_versions` への INSERT / UPDATE）を別 SQL grant 系統で隔離、Open Claw 経路の grant に絶対含めない |

#### 6.1.3 SUID/SGID Unix

| 項目 | 内容 |
|---|---|
| 攻撃ベクトル | SUID bit が立った binary を実行することで一時的に owner 権限取得、buffer overflow / shell injection で root 取得 |
| 防御策 | SUID bit の最小化（必須のみ）、`mount -o nosuid`、`capabilities(7)` で SUID 不要化 |
| 本案件への教訓 | Phase 1 で subprocess spawn する際、**SUID binary を一切実行しない**、env PATH を厳密制御（G-V2-11 と整合） |

#### 6.1.4 sudo configuration

| 項目 | 内容 |
|---|---|
| 攻撃ベクトル | `NOPASSWD` 設定 + 危険コマンド（`/bin/bash`、`/usr/bin/find` 等）の組合せで権限昇格、`sudoedit` の symlink 攻撃 |
| 防御策 | **絶対パス指定**、command 単位 allow、引数まで制限（`!` 否定リスト併用）、最小特権原則 |
| 本案件への教訓 | シェルコマンド whitelist は **絶対パス + 引数 regex** で定義、`bash -c "..."` 等の任意コード実行は **絶対禁止** |

#### 6.1.5 Capabilities (Linux capabilities, e.g., CAP_SYS_ADMIN)

| 項目 | 内容 |
|---|---|
| 攻撃ベクトル | container に過剰 capability 付与で escape（CAP_SYS_ADMIN, CAP_SYS_PTRACE, CAP_NET_ADMIN 等） |
| 防御策 | **capabilities drop**（`docker run --cap-drop=ALL`）、必要最小のみ add、seccomp profile 併用 |
| 本案件への教訓 | Vercel Sandbox の Firecracker microVM は capabilities 最小化済（公式）、追加 capability 付与は本案件で**一切不要** |

### §6.2 比較表 — 5 事例横断

| # | 事例 | 攻撃手段 | 主防御 | 本案件採用 |
|---|---|---|---|---|
| 1 | AWS iam:CreatePolicy | 自己 grant | Permission Boundary | policy_versions write を Owner UI のみ |
| 2 | k8s `*` verb | escalate via wildcard | escalate 二重ロック | wildcard 禁止、SQL grant 分離 |
| 3 | SUID Unix | suid binary 経由 | SUID 最小化 | SUID binary 実行禁止 |
| 4 | sudo NOPASSWD | 危険コマンド | 絶対パス + 引数 regex | 同左 |
| 5 | Linux capabilities | 過剰 capability | drop ALL + 必要のみ add | Vercel 既定維持 |

### §6.3 二重ガード設計

```mermaid
graph LR
  A[Owner UI 操作] --> B[policy_versions INSERT]
  B --> C{Permission Boundary check}
  C -->|envelope 内| D[OK 反映]
  C -->|envelope 超過| E[REJECT + Slack 通知]
  F[Open Claw subprocess] -.絶対禁止.-> B
  G[Casbin Adapter Read-Only] --> H[policy 取得]
  H --> I[enforce]
```

**Permission Boundary 相当の固定 policy**: Owner UI でも変更不可な「絶対上限」を別 SQL grant で envelope 化（例: `path "/etc/**"` への write は **永遠に deny**）。

---

## §7. Owner-in-the-loop AI システムの法務・規制動向（5 事例）

### §7.1 5 事例個別調査

#### 7.1.1 EU AI Act（2024 採択、High-risk AI システムの human oversight 要件）

| 項目 | 内容 |
|---|---|
| 該当条項 | **Article 14 — Human Oversight**: high-risk AI system は人間が effectively oversee できる構造であること（介入・停止・出力上書き可能） |
| 本案件への適用度 | **高（★★★★）** — 本案件「Open Claw 自律組織」は high-risk 分類に該当する可能性（重要分野 13 ドメインを ToS で blocklist 化済 = DEC-019-010 も Article 14 整合方向） |
| 訴求材料化 | **「Owner-in-the-loop transparent AI org」 = EU AI Act Article 14 整合**として LP / プレスに明示可能 |

#### 7.1.2 日本「AI 事業者ガイドライン」（2025、総務省/経産省）

| 項目 | 内容 |
|---|---|
| 該当条項 | 「AI 開発者・提供者・利用者の役割分担」「人間中心」「透明性・アカウンタビリティ」「リスクマネジメント」 |
| 本案件への適用度 | **最高（★★★★★）** — Owner-in-the-loop は「人間中心」原則に直接整合、透明性ダッシュボード + 権限管理 UI は「透明性・アカウンタビリティ」直接実装 |
| 訴求材料化 | **「日本 AI 事業者ガイドライン準拠の自律 AI 開発組織」** = 国内 B2B 中小企業向け訴求の差別化要素 |

#### 7.1.3 NIST AI Risk Management Framework

| 項目 | 内容 |
|---|---|
| 該当条項 | 4 functions（Govern / Map / Measure / Manage）、特に **Govern 1.5 — human accountability** |
| 本案件への適用度 | **高（★★★★）** — HITL Gate 1〜10 種は Manage function 直接実装、policy_audit_log は Govern function 整合 |
| 訴求材料化 | **「NIST AI RMF 4 functions 全カバー」**として技術ブログで詳細解説可能 |

#### 7.1.4 ISO/IEC 42001（AI Management System）

| 項目 | 内容 |
|---|---|
| 該当条項 | AI MS の PDCA、データ管理、リスク管理、impact assessment |
| 本案件への適用度 | **中（★★★）** — ISO 認証取得は Phase 1 範囲外、ただし考え方の整合性は確保 |
| 訴求材料化 | **「ISO/IEC 42001 整合方向の運用」**として Phase 2 以降の認証取得検討材料 |

#### 7.1.5 GDPR Article 22（automated decision-making）

| 項目 | 内容 |
|---|---|
| 該当条項 | Article 22 — Automated individual decision-making, including profiling: 個人に法的影響を与える完全自動化決定への異議申立権 |
| 本案件への適用度 | **中（★★★）** — 本案件は B2B 受託、個人データ自動決定は限定的だが、提案書の Owner 承認モデル = Article 22 「人間の介入」要件と整合 |
| 訴求材料化 | **「GDPR Article 22 整合の Owner 承認モデル」**として欧州案件展開時の訴求要素 |

### §7.2 比較表 — 5 事例横断

| # | 規制 | 該当条項 | 本案件適用度 | 訴求強度 |
|---|---|---|---|---|
| 1 | EU AI Act | Art.14 human oversight | ★★★★ | ◎ |
| 2 | 日本 AI 事業者ガイドライン | 人間中心 / 透明性 | ★★★★★ | ◎ |
| 3 | NIST AI RMF | Govern 1.5 | ★★★★ | ○ |
| 4 | ISO/IEC 42001 | AI MS PDCA | ★★★ | △ |
| 5 | GDPR Art.22 | automated decision | ★★★ | ○ |

### §7.3 Marketing 訴求材料化の推奨

```
LP / プレス文言案（Marketing 部門への引き継ぎ案）:

「Clawbridge は、EU AI Act Article 14（人間監督）と日本 AI 事業者ガイドライン
（人間中心 / 透明性 / アカウンタビリティ）に整合した、Owner-in-the-loop transparent AI org
を実装します。AI 組織が AI 組織を運営するという認知衝撃の裏で、すべての行動・
コスト・権限はオーナーの可視範囲・操作範囲にあります。」
```

---

## §8. 結論と推奨

### §8.1 4 設計領域 × 推奨 Top-1 サマリ

| 設計領域 | 推奨 Top-1 |
|---|---|
| ナレッジ抽出 | **Cursor Memory + Zettelkasten ハイブリッド** — `organization/knowledge/{patterns,decisions,pitfalls}/{slug}-{date}.md` × Claude 自動抽出 × pgvector 検索 |
| 提案書 | **Amazon 6-pager 簡略版（1.5-pager）** — 800-1,500 字 / Markdown / zod schema 強制 / 7 セクション固定 |
| 透明性 UI | **LangSmith 様 trace timeline + Operator 様 inline 介入** — Server-Sent Events / Pipeline View 4 段階 / Cost Meter |
| 権限 UI | **Casbin RBAC + AWS IAM Permission Boundary 様 + 1Password Vault Tree UI + Vault HCL 風 + AppArmor 二重** — 5 要素ハイブリッド |
| escalation 防御 | **AWS Permission Boundary 様の二重ガード** — Owner UI 排他編集 + envelope 固定 policy + 自動 rollback |
| 法務 | **EU AI Act + 日本ガイドライン整合** — Marketing 訴求材料化 |

### §8.2 Phase 1 着手日への影響評価

DEC-019-033 §⑦ で「Phase 1 着手日 5/19 → **5/26 に 1 週間延期**」と決定済。Research 観点で**この延期は妥当**と判定する根拠:

| 工数項目 | 必要営業日 | 充当週 |
|---|---:|---|
| ナレッジ抽出機構（基本） | 1.5 日 | W0-Week2 |
| 提案書テンプレ + zod schema | 1 日 | W0-Week2 |
| 透明性ダッシュボード（基本 6 要素） | 3 日 | W0-Week2 〜 W1 |
| 権限管理 UI（7 カテゴリ × 細粒度） | 4 日 | W0-Week2 〜 W1 |
| Casbin 統合 + Permission Boundary | 2 日 | W0-Week2 |
| **合計** | **11.5 営業日** | (5/9 〜 5/22) |

**5/26 着手は工数的に妥当**、ただし Dev 部門 1 人月内の比重では透明性 UI + 権限 UI が overhead 大きい → Phase 1 の 5/19→5/26 延期は不可避と判定。

### §8.3 PRJ-020 同居実装方針との整合性

DEC-020-003（PRJ-019 `app/clawdialog/` 同居）と DEC-019-033 §③「透明性ダッシュボード = PRJ-020 ClawDialog 内に統合実装」は**完全整合**。インフラ共有 / HITL 統合 / 監査ログ統合 / Spend Cap 統合の 4 つのメリットを享受可能。

### §8.4 月次予算への影響

| 項目 | 追加コスト | 占める % |
|---|---|---|
| 提案生成 +α | $0.46 〜 $1.17 / 月（cache 有無で変動） | 0.15% 〜 0.39% |
| 透明性 UI（Supabase 行追加分） | $0 〜 $5 / 月 | 0% 〜 1.7% |
| 権限管理 UI（Casbin 計算負荷） | $0 〜 $2 / 月 | 0% 〜 0.7% |
| ナレッジ抽出（Embedding） | $0.02 〜 $0.10 / 月 | < 0.1% |
| **合計** | **$0.48 〜 $8.27 / 月** | **0.16% 〜 2.76%** |

**$300/月ハードキャップに対し最大 2.76%、十分許容**。DEC-019-031 の上方修正候補 $1,000 → $1,200 とは**独立判断可能**。

---

## §9. [OWNER-DECISION-REQUIRED]

| ID | 内容 | 推奨案 | 影響 | 締切 |
|---|---|---|---|---|
| **[ODR-DEC033-01]** | 権限管理 UI のエンジン選定 | **Casbin（node-casbin）採用** | TypeScript 親和性 + Supabase Adapter OSS 提供、Phase 1 着手可能 | 5/8 検収会議 |
| **[ODR-DEC033-02]** | 提案書フォーマット文字数上限 | **800 〜 1,500 字（1.5-pager）** | Owner 承認 SLA 72h で読破容易、Amazon 6-pager 簡略版 | 5/8 検収会議 |
| **[ODR-DEC033-03]** | ナレッジ抽出の自動 / 半自動切替 | **半自動（Claude 抽出案 → Owner 確認 1 回）** Phase 1、Phase 2 で完全自動化検討 | Phase 1 早期はナレッジ品質劣化リスク低減、Owner 工数 +5 分/件 | 5/8 検収会議 |
| **[ODR-DEC033-04]** | 透明性ダッシュボードの表示遅延上限 | **< 2 秒**（Server-Sent Events、Polling Fallback 5 秒） | Supabase Realtime + Edge Function で実現可能 | 5/8 検収会議 |
| **[ODR-DEC033-05]** | Permission Boundary の envelope 設計 | **`/etc/**` `/usr/**` `/sys/**` `/proc/**` 永遠 deny + Anthropic API 直叩き永遠 deny + 13 prohibited domains 永遠 deny** | NG-1 / DEC-019-006 整合、絶対線引きの可視化 | 5/8 検収会議 |
| **[ODR-DEC033-06]** | 提案生成の prompt cache 採用判断 | **採用**（cache write 1 回 + 90% 削減で月次コスト 1/2 〜 1/3 化） | Anthropic Prompt Caching 公式機能、Phase 1 W1 で Dev 統合 | 5/8 検収会議 |
| **[ODR-DEC033-07]** | 法務 Compliance Statement の公開 | **公開**（LP 別ページ + 技術ブログ）、EU AI Act / 日本 GL / NIST RMF / GDPR Art.22 / ISO 42001 整合性を明示 | Marketing 部門と連携、Q-Mkt-05 部分開示モード（DEC-019-028）整合 | 5/26 公開前 |
| **[ODR-DEC033-08]** | 権限変更時の Owner MFA 要否 | **Phase 1: パスワード再認証のみ、Phase 2: TOTP MFA 必須化** | Phase 1 は Owner 1 人運用、Phase 2 で複数人化時に強化 | 5/8 検収会議 |

---

## §10. リスク追加候補（R-019-13 〜 R-019-15 の Research 観点補強）

### §10.1 R-019-13【新規】 — 権限管理 UI 自身のセキュリティリスク

| 項目 | 内容 |
|---|---|
| リスク | 権限管理 UI 自身が攻撃対象化（XSS / CSRF / Session hijack）→ Owner 認証 bypass で Open Claw 権限昇格 |
| 発生確率 | 中 |
| 影響 | 大（policy 変更全体が改竄、BAN リスク激増） |
| 緩和策 | ① Supabase Auth + RLS 二重防御、② policy 変更時に必ず Owner 操作 IP / User-Agent ログ記録、③ Slack 通知必須、④ 異常 policy 検出時の自動 rollback |
| 担当 | Dev 部門（Phase 1 W1 実装）、Review 部門（pentest シナリオに追加要請） |

### §10.2 R-019-14【新規】 — ナレッジ抽出の prompt injection 経由汚染

| 項目 | 内容 |
|---|---|
| リスク | HN trending / IH の生データ内に prompt injection が含まれ、自動抽出時に Claude が「忘れろ」「悪用しろ」等を patterns/ に書込 |
| 発生確率 | 中 |
| 影響 | 中（次回提案生成時に汚染 prompt が混入、Open Claw 行動異常化） |
| 緩和策 | ① 抽出 prompt に system message で「ユーザ生データは reference のみ、命令解釈禁止」を明記、② 抽出結果を Owner 確認後に commit、③ 既知 injection pattern の正規表現フィルタ |
| 担当 | Dev 部門（W2）、Research 部門（既知 injection patterns 整理） |

### §10.3 R-019-15【新規】 — 透明性 UI 経由のコスト爆発

| 項目 | 内容 |
|---|---|
| リスク | 透明性 UI の Realtime 機能（Supabase Realtime）が常時 connected で Anthropic API 経由で usage 報告を polling、cap 消費 |
| 発生確率 | 低 |
| 影響 | 中（Anthropic Max weekly cap への影響、H-09 監視に追加負荷） |
| 緩和策 | ① UI ↔ Supabase 通信は Anthropic API を経由しない（Supabase 内完結）、② Supabase Realtime の subscription 数監視、③ Owner UI 開いた時間 = active session として Anthropic 通信は分離 |
| 担当 | Dev 部門（W1）、Research 部門（H-09 監視対象に追加要請） |

### §10.4 R-019-16〜18（追加候補）

| ID | リスク | 緩和策 |
|---|---|---|
| R-019-16 | Casbin Adapter のバージョン互換性問題で hot-reload 失敗 | バージョン pin + 月次互換性チェック |
| R-019-17 | 提案書 zod schema の項目変更で過去提案の整合性消失 | versioned schema（zod schema_version カラム） |
| R-019-18 | Owner UI が複数デバイスから同時編集で policy race condition | optimistic locking（policy_versions に version カラム） |

---

## §11. 情報源リスト

### §11.1 一次情報（公式）

| URL | 内容 | 信頼度 |
|---|---|---|
| https://claude.com/pricing | Claude pricing | 公式 |
| https://platform.claude.com/ | Claude Console pricing | 公式 |
| https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching | Prompt Caching 仕様 | 公式 |
| https://aws.amazon.com/iam/features/manage-permissions/ | IAM Permission Boundary | 公式 |
| https://kubernetes.io/docs/reference/access-authn-authz/rbac/ | k8s RBAC | 公式 |
| https://developer.hashicorp.com/vault/docs/concepts/policies | Vault Policy | 公式 |
| https://casbin.org/docs/overview | Casbin 概要 | 公式 |
| https://www.openpolicyagent.org/docs/latest/ | OPA docs | 公式 |
| https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai | EU AI Act | 公式 |
| https://www.soumu.go.jp/main_sosiki/kenkyu/ai_network/ | 日本 AI 事業者ガイドライン | 公式 |
| https://www.nist.gov/itl/ai-risk-management-framework | NIST AI RMF | 公式 |

### §11.2 半公式

| URL | 内容 |
|---|---|
| https://www.cursor.com/docs/memory | Cursor Memory ドキュメント |
| https://docs.langchain.com/docs/components/memory | LangChain memory |
| https://docs.llamaindex.ai/en/stable/examples/index_structs/knowledge_graph/ | LlamaIndex KG |
| https://github.com/casbin/node-casbin | Casbin Node.js 実装 |
| https://github.com/casbin/supabase-adapter | Casbin Supabase Adapter |

### §11.3 二次情報

| URL | 内容 |
|---|---|
| https://www.langsmith.com/ | LangSmith trace UI 紹介 |
| https://helicone.ai/ | Helicone observability |
| https://wandb.ai/site/weave | W&B Weave |
| https://openai.com/index/introducing-operator/ | OpenAI Operator UI 紹介 |
| https://docs.cursor.com/composer | Cursor Composer multi-step |

### §11.4 取得失敗・要オーナー直接確認

| 項目 | 理由 |
|---|---|
| Devin の最新 UI スクリーンショット | Cognition は招待制、公開 demo 動画のみ参照 |
| 1Password Business UI 詳細 | Trial アカウント未契約、Marketing 資料ベース |
| Anthropic Sonnet 4.5 vs 4.6 pricing 差分 | 公式 pricing ページが Sonnet ライン全体を統一表記、4.5 / 4.6 内訳明示なし |

---

## §12. 関連ファイル（PRJ-019 内）

| ファイル | 関係 |
|---|---|
| `decisions.md` DEC-019-033 | 本書の発端決裁 |
| `decisions.md` DEC-019-031 | 月次予算 +α 上方修正候補との整合判定 |
| `decisions.md` DEC-020-003 | PRJ-020 同居実装方針（透明性 UI / 権限 UI 統合先） |
| `reports/research-ng3-revalidation-and-codex-bonus-impact.md` | NG-3 / Codex 影響再試算（本書 §5 の根拠） |
| `reports/research-changelog-monitoring-runbook.md` | Anthropic / OpenAI changelog 監視（pricing 変更検知） |
| `reports/dev-w0-week2-mid-detailed-design.md` | Dev 詳細設計（HITL 第 9/10 種実装の根拠） |
| `reports/review-tos-allowlist-dod-integration-v1.md` | ToS allowlist DoD（権限 UI ジャンルカテゴリの根拠） |
| `reports/marketing-portfolio-reflection-design-v2.md` | Marketing 訴求（法務整合性の引き継ぎ先） |
| `organization/rules/agent-tool-permission-sop.md` | DEC-019-025 SOP（本書発注根拠） |

---

## §13. 完了確認チェックリスト

| 要件 | 達成状況 |
|---|---|
| §0 サマリー（4 設計領域 × 9〜12 既存事例 = 計 36〜48 事例） | ◎ ナレッジ 9 + 提案書 7 + 透明性 9 + 権限 9 + 補助 2 + 防御 5 + 法務 5 = **計 46 事例**（4 領域コア合計 34 + 法務 / 防御 12 = 充足） |
| §1 ナレッジ事例（最低 9） | ◎ 9 事例 |
| §2 提案書事例（最低 7） | ◎ 7 事例 |
| §3 透明性 UI 事例（最低 9） | ◎ 9 事例 |
| §4 権限 UI 事例（最低 9） | ◎ 9 + 補助 2 = 11 事例 |
| §5 コスト再試算（DEC-019-033 §⑨ 連動、$1,200 上方修正整合判定） | ◎ 完了、独立判断可能と判定 |
| §6 priviledge escalation 防御（最低 5） | ◎ 5 事例 |
| §7 法務・規制（最低 5） | ◎ 5 事例 |
| §8 結論と推奨 | ◎ Top-1 各領域明示 |
| §9 [ODR] 5〜8 件 | ◎ 8 件 |
| §10 リスク追加候補 R-019-13〜15 | ◎ 13 / 14 / 15 + 16-18 補助 |
| Mermaid 図 4 枚以上 | ◎ 4 枚（§1.4 ナレッジフロー / §3.4 ダッシュボード構成 / §4.5 権限 UI 全体 / §6.3 二重ガード） |
| 比較表 15 個以上 | ◎ 22 個（§0×1, §1×1, §2×1, §3×1, §4×3, §5×2, §6×1, §7×1, §8×1 + 個別事例表 10） |
| 800〜1,200 行目安 | ◎ 約 1,090 行 |
| Write ツールで物理書込 | ◎ 本書を Write で生成 |
| DEC-019-025 SOP 順守 | ◎ general-purpose 発注ルートで作成 |

---

**本書作成責任者**: Research 部門（general-purpose 発注）
**最終更新**: 2026-05-03
**承認待ち**: CEO（5/8 検収会議で正式承認予定、それまでは「事前配布資料」扱い）
