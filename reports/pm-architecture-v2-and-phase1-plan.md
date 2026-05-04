# PRJ-019 アーキテクチャ v2 & Phase 1 ディテール計画書

- 案件: PRJ-019「Clawbridge（仮）」 — Open Claw を自律オーナーとする AI 組織ハーネス基盤
- 部署: PM 部門
- 作成日: 2026-05-02
- 作成者: PM Agent (claude-code-company)
- 入力:
  - `projects/PRJ-019/reports/research-openclaw-harness-investigation.md`（リサーチ Phase 0 確定調査）
  - `projects/PRJ-019/reports/pm-requirements-and-architecture.md`（PM v1）
  - `projects/PRJ-019/reports/review-security-and-risk-assessment.md`（レビュー Phase 0 確定評価）
  - リサーチ補追 `research-supplement-tos-and-subscription-paths.md`: **未作成**（本書作成時点）→ §2.3 で代替パス 3 案併記
- オーナー判断（Phase 1 着手前提条件、本書では確定として扱う）:
  - **OQ-01**: ChatGPT Codex 5x usage tier 確定（Pro $200 1 アカウントの 5x 枠を採用、5 アカウント並列ではない）
  - **OQ-02**: Claude Code は **Anthropic サブスクプラン駆動**（Anthropic API キー従量は不採用）
  - **OQ-03**: OpenAI ToS はオーナー直接確認済（Phase 1 着手前提）
  - **OQ-04**: **自前ハーネス構築**（Devin / OpenHands 等の商用 / OSS フレームワーク採用せず）
  - **OQ-05**: PRJ-018 Asagi M1 と並走

---

## 1. v1 からの変更点サマリー

### 1.1 v1 で前提としていた構造 → v2 で破棄したもの

| v1 前提 | v2 での変更 | 根拠 |
|---|---|---|
| **Anthropic API キー（Console 従量課金）必須** | **Anthropic サブスクプラン駆動を採用候補にする**（OQ-02） | オーナー判断で API キー従量不採用 |
| Devin / OpenHands TCO 比較を Phase 1 着手前条件に | **削除**（自前ハーネス構築確定、OQ-04） | OQ-04 |
| OQ-06 の TCO 比較タスク | **削除** | OQ-04 で確定 |
| OQ-01 ChatGPT「x5」意味曖昧 | **Pro $200 1 アカウントの 5x 枠**で確定 | OQ-01 |
| OQ-03 OpenAI ToS 灰色 | **オーナー直接確認済で前提化** | OQ-03 |
| Phase 1 着手は PRJ-018 M1 完遂後を推奨 | **PRJ-018 M1 と並走前提**でリソース配分計画を §3.4 で具体化 | OQ-05 |

### 1.2 v2 で新規追加したもの

| 追加項目 | 概要 | 配置 |
|---|---|---|
| サブスク駆動 3 案併記（P-C / P-D / P-E） | Anthropic サブスク駆動の代替パスをリサーチ補追未着のため PM 側で先行併記 | §2.3 |
| 必須コントロール 12 項目（G-01〜G-12）の Phase 1 実装計画 | レビュー部門指定の 12 ハードガードを Phase 1 内で完全実装する WBS | §3.2 |
| Phase 1 4 週間 WBS（W1〜W4） | レビュー部門 §11.3 最重要 5 項目を W1〜W2 に前倒し配置、PoC 成立は W4 に集約 | §3.3 |
| PRJ-018 並走時のリソース配分マトリクス | Dev / Review 工数の分割、衝突時の優先順位、共通基盤共有設計 | §3.4 |
| ToS 違反監視 hooks の常時動作要件 | OQ-02 サブスク駆動採用時の最大リスクに対する継続監視層 | §3.2 G-03' |
| サブスク BAN 時のフォールバック手順 | OQ-02 採用で残存する CR-01 リスクに対する具体的代替動作 | §6.3 |
| 既存 PRJ への副作用ゼロ証明計画 | dry-run × 3 + git diff 全件 0 + Vercel project untouched 確認の手順化 | §7 |

### 1.3 v1 から保持したまま（変更なし）

- §1 スコープ IN/OUT、§2 ペルソナ・UC、§4 ハーネス権限マトリクス（FS / シェル / ネット / シークレット / HITL ゲート / コストキャップ / wall-clock）
- §5 自律ループ設計（HN/PH/GitHub Trending、評価関数）
- §6 claude-code-company 組織側の改修要件
- §7 Phase 計画の Phase 0/2/3/4 の大枠（Phase 1 のみ詳細を本書 §3 で全置換）

---

## 2. 確定アーキテクチャ v2

### 2.1 C4 Level 1: コンテキスト図

```
                   ┌──────────────────────┐
                   │  オーナー（人間）     │
                   │  ai-lab@improver.jp  │
                   └──────┬──────────┬────┘
                          │ 承認/停止 │ 月次コスト確認
                          │ Slack/TG │ Email
                          ▼          ▼
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│             Clawbridge ハーネス基盤（PRJ-019）                 │
│                                                                │
│  ┌────────────┐   ┌─────────────────┐   ┌──────────────┐     │
│  │ Open Claw  │──▶│ claude-code-    │──▶│ Vercel       │     │
│  │ 自律オーナー│   │ company 組織    │   │ Sandbox      │     │
│  │ (Codex Pro │◀──│ (CEO/PM/Dev/    │◀──│ (Firecracker │     │
│  │  $200 5x)  │   │  Review/...)    │   │  microVM)    │     │
│  └─────┬──────┘   └────────┬────────┘   └──────────────┘     │
│        │                   │                                   │
│        ├──────────┬────────┴────────┐                          │
│        │ ToS 監視 │ HITL 5 ゲート    │ 監査ログ・コスト         │
│        ▼          ▼                  ▼                          │
│  ┌──────────┐ ┌──────────┐  ┌──────────────────┐              │
│  │ 監視層   │ │ 承認層   │  │ Supabase 監査基盤│              │
│  │ hooks    │ │ Slack/TG │  │ (append-only)    │              │
│  └──────────┘ └──────────┘  └──────────────────┘              │
└────────┬─────────────────────────────────┬──────────────────┘
         │                                  │
         ▼                                  ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ ChatGPT Codex│ │ Anthropic    │ │ GitHub       │ │ Vercel       │
│ Pro $200 5x  │ │ サブスク     │ │ (PAT, branch │ │ (deploy,     │
│ (OAuth)      │ │ プラン駆動   │ │  protection) │ │  spend cap)  │
│              │ │ ※§2.3 P-X案 │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
                                          │
                                          ▼
                                 ┌──────────────────┐
                                 │ ニーズ判定ソース │
                                 │ HN / PH / GitHub │
                                 └──────────────────┘
```

### 2.2 C4 Level 2: コンテナ図

```
┌────────────────────────────────────────────────────────────────────┐
│ オーナー実機（Windows 11 + WSL2、Phase 1 のみ。Phase 2 で VPS 検討）│
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Container A: Open Claw ハーネス層                           │    │
│  │  - OpenClaw OSS（github.com/openclaw/openclaw、自前 host）  │    │
│  │  - 認証: ChatGPT Pro $200 device-code OAuth（OQ-01）        │    │
│  │  - モデル: openai-codex/gpt-5.5 経由（5x 枠内）              │    │
│  │  - Skills: needs_scout, cost_check, emergency_stop,         │    │
│  │           tos_monitor（新設、§3.2 G-03'）                   │    │
│  │  - Memory: SQLite + 別 OPENAI_API_KEY for embeddings        │    │
│  │           （Codex プランに含まれない、リサーチ §2.3）       │    │
│  └────────────┬───────────────────────────────────────────────┘    │
│               │ subprocess（claude -p ...）/ MCP / HTTP            │
│  ┌────────────▼───────────────────────────────────────────────┐    │
│  │ Container B: Claude Code 実装層（claude-code-company）      │    │
│  │  - claude -p "..." --bare --output-format stream-json       │    │
│  │  - --json-schema で構造化入出力                             │    │
│  │  - --allowedTools で permission scoping                     │    │
│  │  - 認証: §2.3 で確定する 3 パス（P-C / P-D / P-E）のいずれか│    │
│  │  - Skills: ceo / pm / dev / research / review / secretary 等│    │
│  └────────────┬───────────────────────────────────────────────┘    │
│               │ FS / git / MCP（read-only / write allowlist）      │
│  ┌────────────▼───────────────────────────────────────────────┐    │
│  │ Container C: ローカル workspace                             │    │
│  │  - projects/PRJ-019/**         （write 可）                 │    │
│  │  - projects/PRJ-{020+}/        （PRJ-019 起票案件、write 可）│    │
│  │  - projects/PRJ-001〜018/      （read-only mount）          │    │
│  │  - organization/, dashboard/   （read-only、Phase 2 で再評価）│   │
│  │  - .env*, ~/.ssh, ~/.aws 等    （遮断、Tier 4 secret 階層）  │    │
│  └─────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────┬──────────────────────────────┘
                                       │ HTTPS（allowlist のみ）
                                       ▼
┌────────────────────────────────────────────────────────────────────┐
│ Container D: Vercel Sandbox（Firecracker microVM、iad1）            │
│  - 生成された Web アプリの build / test 実行                        │
│  - ハーネス層 secret 不到達（Vercel KB §5.3 推奨パターン）          │
│  - 上限: 5h/session, Pro 5,000 sandbox/月                          │
│  - 失敗時 ephemeral 破棄                                            │
└────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────┐
│ Container E: クラウドサービス層（allowlist 通信先）                 │
│  api.anthropic.com / api.openai.com / chatgpt.com / api.github.com │
│  api.vercel.com / *.supabase.co / hooks.slack.com / api.telegram.org│
│  hacker-news.firebaseio.com / api.producthunt.com / api.resend.com │
│  上記以外は DNS レベル block（Phase 2 で完全実装）                  │
└────────────────────────────────────────────────────────────────────┘
```

### 2.3 サブスクプラン駆動の Claude Code 接続方式（リサーチ補追未着のため 3 案併記）

リサーチ補追 `research-supplement-tos-and-subscription-paths.md` は本書作成時点で未完成。よって PM 側で **3 つの代替パスを併記**し、補追完成 / オーナー最終判断時に確定する。

#### 比較表

| ID | 名称 | 接続方式 | ToS 適合性 | 実装難易度 | コスト | リスクスコア | Phase 1 推奨 |
|---|---|---|---|---|---|---|---|
| **P-C** | Claude Code CLI を **オーナー本人セッション内サブプロセス**で起動 | Open Claw が SSH/RPC ではなく、オーナーの Claude Code 起動セッション内で `claude -p` を子プロセス起動。OAuth トークンはオーナー本人の手元のみで保持、Open Claw は I/O のみ仲介 | **白〜薄灰**（「ordinary use」を逸脱しない範囲、ただし Anthropic の `third-party developer` 文言抵触の解釈余地あり） | 中 | サブスク代のみ（Claude Pro $20 / Max $100-200） | 5（HR 級） | **第一候補** |
| **P-D** | Claude Code Max プラン + **オーナー手動キック**自動駆動 | Phase 1 では Open Claw は「指示ドラフトと監視」に専念、Claude Code 起動はオーナー（または cron）が手動キック。完全自律ではないが ToS は明確に白 | **白**（明確に ordinary use） | 低 | サブスク代のみ | 2（Low 級） | **保険策**（P-C 駄目時） |
| **P-E** | サブスク駆動を**諦めて Anthropic API キー併用**（v1 案に戻す） | Pro/Max OAuth は使わず、Anthropic Console で発行した API キーを使う。OQ-02 と矛盾するため**最終フォールバック**としてのみ | **白**（Anthropic 公式許諾範囲） | 低 | API 従量 $50-$5,000+/月 | 1（最低） | **CR-01 顕在化時の最終フォールバック** |

#### 各案の詳細

**P-C: オーナー本人セッション内サブプロセス起動**

```
[オーナー手元 PC]
├── ターミナル 1: Open Claw 起動（Codex Pro $200 OAuth、device-code）
│     │
│     └─ subprocess.spawn("claude", ["-p", prompt, "--bare", ...])
│           │ ※ オーナーの Claude Code セッションが既にログイン済
│           │   → サブプロセスは親セッションの OAuth コンテキスト継承
│           │   → 「third-party tool が credentials を route」していない
│           │   → オーナー本人が同一マシンで通常利用している扱い
│           ▼
└── ターミナル 2: Claude Code Max（Anthropic Pro/Max OAuth、オーナー本人）
```

- **利点**: サブスク代のみで運用可能、コスト低
- **リスク**: Anthropic ToS の「third-party developer」文言の解釈次第。Open Claw が「third-party tool」と認定されれば違反。Boris Cherny 発言（「$200/月 Max で $1,000-$5,000 計算消費」）の対象になる可能性
- **緩和策**: tos_monitor hooks（§3.2 G-03'）で「24h 連続稼働」「異常な token 消費」を検知して自動停止、Pro/Max 個人利用の範囲を超えないよう量的制限

**P-D: 半自律（オーナー手動キック前提）**

- Open Claw は「Web ニーズ判定」「指示ドラフト作成」「監視・通知」のみ自律
- Claude Code 起動 = **オーナーがクリック、または Slack 承認、または cron**（オーナー設定の cron なら ToS 観点でグレー → 慎重）
- Phase 1 PoC のゴール「人間不在で 1 タスク自動化」を**部分的に達成**（人間不在 = 起動後の処理のみ）
- 「ニーズ抽出 → 指示草案 → 朝オーナーが起動承認 → Claude Code が実装 → 通知」のパターン

**P-E: API キー併用（v1 戻し）**

- OQ-02 と矛盾するため、CR-01（ToS BAN）が顕在化した時の最終フォールバック
- Phase 1 凍結後の plan B として手順を整備しておく（§6.3 フォールバック手順）

#### Phase 1 採用方針

- **W1 開始時**: P-D（半自律）で着手、ToS リスクをゼロにしつつ PoC 全体構造を組む
- **W3 まで**: tos_monitor 動作確認後、P-C への昇格判断（オーナー＋レビュー部門承認）
- **CR-01 顕在化時**: 24h 以内に P-E にフォールバック
- **リサーチ補追完成時**: 補追推奨に従い W2 までに最終確定

### 2.4 Vercel Sandbox 採用前提のサンドボックス層設計

#### 採用理由（リサーチ §5.3 比較に基づく）

| 比較軸 | Vercel Sandbox | E2B | 判断 |
|---|---|---|---|
| 隔離技術 | Firecracker microVM | Firecracker microVM | 同等 |
| 既存契約 | あり（claude-code-company 標準） | なし（新規契約必要） | **Vercel** |
| 標準スタック整合 | Next.js + Vercel deploy と統合 | 別管理 | **Vercel** |
| リージョン | iad1（US East）のみ | 複数 | E2B 優位だが本件は単一リージョンで可 |
| Phase 1 PoC コスト | Hobby 無料枠（5 CPU 時間 / 420 GB-hr / 5,000 sandbox/月） | $100 一回限りクレジット | **Vercel**（無料枠で PoC 完結） |

→ **Vercel Sandbox を Phase 1 採用確定**。E2B は Phase 3 multi-region 要件発生時に再評価。

#### サンドボックス層の責務分離

| 層 | 担当 | 持つ secret | アクセス先 |
|---|---|---|---|
| Tier 1: ハーネス層（Container A+B） | Open Claw + Claude Code | ANTHROPIC_*, OPENAI_*, GITHUB_PAT, VERCEL_TOKEN | クラウド API 全般 |
| Tier 2: workspace 層（Container C） | ローカル FS | なし（読込のみ） | ローカル FS |
| Tier 3: Sandbox 層（Container D） | 生成コード build/test | Sandbox 専用最小 env（Vercel API キーは別、書込権限なし） | npm registry、生成 app の DB（テスト用） |
| Tier 4: 公開層（Container E の subset） | Vercel deploy | preview 用 token のみ（prod は HITL 経由） | Vercel deploy API |

**鍵設計**: Tier 1 secret は Tier 3 に**物理的に到達不可**。Vercel Sandbox 起動時に `env` を明示的に whitelist 指定、ハーネス親プロセスの env は引き継がない（`process.env` 全削除して再構築）。

### 2.5 Secret 階層と隔離方針

| Tier | 階層 | 保管 | 注入 | 例 |
|---|---|---|---|---|
| **Tier-S0**: Master Secrets | オーナー直接管理 | 1Password Vault `Clawbridge-Master`（Phase 1 仮定、OQ-04 で確定済方針） | 手動コピー | Anthropic billing アカウント、OpenAI billing アカウント |
| **Tier-S1**: ハーネス Secrets | Container A+B 専用 | 1Password CLI `op run` で起動時のみ env 注入 | `op run --env-file=.env.tpl -- node bin/clawbridge` | `ANTHROPIC_OAUTH_TOKEN`（P-C 採用時）、`CODEX_OAUTH_TOKEN`、`GITHUB_PAT_PRJ019`、`VERCEL_TOKEN_PRJ019`、`SUPABASE_SERVICE_ROLE_AUDIT` |
| **Tier-S2**: Sandbox Secrets | Container D 専用 | Vercel Sandbox API で起動時に明示注入 | sandbox 起動 SDK に env={...} で渡す | `SUPABASE_TEST_DB_URL`、`STRIPE_TEST_KEY`（テスト用 dummy） |
| **Tier-S3**: 通知 Secrets | 監視層専用、最小権限 | 1Password `Clawbridge-Notify` | 同上、別 vault | `SLACK_WEBHOOK`、`TELEGRAM_BOT_TOKEN`、`RESEND_API_KEY` |
| **Tier-S4**: 公開先 Secrets | HITL ゲート通過後のみ参照 | 1Password `Clawbridge-Public` | G-01 公開ゲート通過時のみ env 注入 | `VERCEL_TOKEN_PROD`（prod deploy 用、HITL 後のみ） |

**遮断ルール**:
- **Tier-S1 → Tier-S2**: env を引き継がず、whitelist で再構築
- **Tier-S0 → Tier-S1**: Master 鍵は Phase 1 で Tier-S1 に降りない（オーナー手元管理）
- **生成コード（Tier 3 の中の生成 app）→ Tier-S2 secret**: 必要最小のみ、test dummy で代替

---

## 3. Phase 1 ディテール計画（最重要セクション）

Phase 1 の位置付け: **「ハーネス PoC：Open Claw 単体 + claude-code-company の 1 タスク自動化」**。

### 3.1 ゴール定義（Definition of Done）

#### 3.1.1 PoC 成功条件（DoD）

**主要 DoD**: Open Claw が以下のシナリオを **完全自動**（HITL ゲート経由を除く）で達成すること。

```
シナリオ「Phase 1 ベンチマークタスク」
  1. オーナーが Slack で `/clawbridge run-benchmark` を実行
  2. Open Claw が HN の trending top 10 から「シンプルな Web アプリ向きアイデア」を 1 件選定
     ※ Phase 1 はニーズ判定の精度ではなく「ループが回ること」を検証
  3. Open Claw が CEO スキルに `/new-project` 構造化 JSON で起票依頼
  4. CEO → 秘書 → PRJ-XXX 採番 + 5 点ドキュメント自動生成
  5. CEO → Dev に「Hello World レベルの Next.js プロジェクト雛形作成」を指示
  6. Dev が Vercel Sandbox 内で `next.js` 雛形作成 + `npm test` 通過
  7. CEO → Review にレビュー依頼、Review 合格判定
  8. Open Claw が Vercel preview deploy（HITL なし、preview なので副作用限定）
  9. Open Claw が Slack に preview URL + 概要 + 実コスト + 所要時間を通知
  10. オーナーが Slack の「破棄 / 承認」ボタンで Phase 1 PoC 終了
```

**Phase 1 PoC は prod deploy まで実行しない**（HITL G-01 の動作確認のみ、prod deploy ボタンを押さずに「破棄」する）。

#### 3.1.2 失敗判定条件（NoGo にロールバック）

| # | 失敗条件 | 検出 | 対応 |
|---|---|---|---|
| F-01 | 上記シナリオで HITL ゲート以外の人間介入が 1 回でも発生 | 監査ログで manual operation event 検出 | Phase 1 着手延長、原因究明 |
| F-02 | Phase 1 PoC 期間 4 週間で実コスト > $300 | cost_check skill 累計 | Phase 1 凍結、コスト構造再設計 |
| F-03 | Anthropic / OpenAI から ToS 警告メール受信 | Email 監視 | 即時全停止、P-E にフォールバック判断 |
| F-04 | 既存 PRJ-001〜018 のいずれかに git diff 発生 | §7 副作用ゼロ証明 | 即時全停止、ロールバック |
| F-05 | サンドボックス escape 兆候 / secret 漏洩兆候 | Sentry alert + log 監視 | 即時全停止、レビュー部門に escalate |
| F-06 | 必須コントロール G-01〜G-12 のいずれかが意図通り動かない | 各 G の検証ログ | Phase 1 凍結、当該 G の再設計 |

#### 3.1.3 KPI（定量）

| KPI | 目標値 | 測定方法 |
|---|---|---|
| **時間 KPI**: ベンチマークタスク 1 件の所要時間（受付〜preview deploy） | < 60 分 | Open Claw timestamp 差分 |
| **コスト KPI**: ベンチマークタスク 1 件あたりコスト | < $5 | cost_check skill 集計 |
| **成功率 KPI**: ベンチマークタスク 10 連続実行成功率 | >= 80% | 10 回試行のうち F-01〜F-06 非該当の回数 |
| **HITL ゲート動作率**: G-01〜G-12 の 12 ゲート全件動作確認 | 100% | 検証ログ |
| **既存 PRJ 副作用**: PRJ-001〜018 への git diff | 0 行 | §7 副作用ゼロ証明 |
| **Phase 1 月次合計コスト** | < $300 | Anthropic/OpenAI/Vercel 請求合算 |

### 3.2 必須コントロール 12 項目の Phase 1 実装計画

レビュー部門指定の G-01〜G-12 を Phase 1 に組み込む順序、担当、検証方法を確定する。

| # | コントロール | 実装タスク（PR 単位） | 担当 | 着手週 | 完了週 | 検証方法 |
|---|---|---|---|---|---|---|
| **G-01** | コスト上限ハードキャップ 4 層 | PR-1: Anthropic Console / OpenAI Platform / Vercel spend cap 設定スクリプト + 手順書 / PR-2: cost_check skill 実装（1 分間隔集計、Supabase 書込） | Dev + オーナー（Console 設定） | W1 | W1 | 意図的に上限超え試行、API 自動停止確認 |
| **G-02** | 緊急停止スイッチ | PR-3: `emergency_stop` skill 実装（全 child process kill + cron 停止 + API キー一時 revoke） / PR-4: Slack `/clawbridge stop` slash command | Dev | W1 | W2 | 月次 kill drill 訓練、< 30 秒で全停止確認 |
| **G-03** | Anthropic API キー専用、OAuth 排除 (v1) → **G-03': ToS 監視** (v2) | OQ-02 でサブスク駆動採用のため、v1 の「OAuth 排除」は不適用。**v2 では tos_monitor hooks で「24h 連続稼働検知」「異常 token 消費検知」「ordinary individual usage 逸脱検知」を実装** | Dev + Review | W2 | W3 | 異常パターンを意図的に発生、自動停止確認 |
| **G-04** | 公開前人間承認ゲート | PR-5: Claude Code `PreToolUse` hooks で 5 ゲート（G-01 公開 / G-02 課金 / G-03 強制push / G-04 prod deploy / G-05 外部 API）を block + Slack/TG 通知 + 24h タイムアウト | Dev | W1 | W2 | 自動 deploy 試行 → Slack 承認待ち、未承認 24h で自動拒否確認 |
| **G-05** | FS 書込 allowlist | PR-6: Claude Code `--allowedTools` 集約定義 (`permissions/clawbridge.json`) + Open Claw 側 denylist 二重設定 | Dev | W1 | W1 | 他 PRJ への write 試行 → reject 確認 |
| **G-06** | シェルコマンド allowlist | PR-7: `Bash(git status:*)` 等 prefix 一致ホワイトリスト + 禁止コマンド denylist（rm -rf / curl POST / sudo / ssh） | Dev | W1 | W2 | 禁止コマンド実行試行 → reject 確認 |
| **G-07** | Secret 隔離 microVM | PR-8: Vercel Sandbox 起動 SDK ラッパー（env whitelist 強制、親 process env 引き継ぎ禁止） / PR-9: 1Password CLI 統合 | Dev | W2 | W3 | sandbox 内で `env \| grep ANTHROPIC` → 空確認 |
| **G-08** | GitHub branch protection | PR-10: prj019-* リポに branch protection rule 一括適用スクリプト（require review, status checks, block force push, block deletion） | Dev + オーナー（admin 権限） | W1 | W1 | force push 試行 → reject 確認 |
| **G-09** | 監査ログ全件保存 | PR-11: Supabase 監査スキーマ + append-only 制約 + 90 日保持 trigger / PR-12: stream-json 全 event を Supabase 書込する hook | Dev | W2 | W2 | 過去ログ削除試行 → reject 確認、改ざん検出 |
| **G-10** | Multi-channel alert | PR-13: Slack（平常）+ Telegram（異常）+ Resend（critical）+ heartbeat 5 分 + anomaly threshold | Dev | W2 | W3 | drill で各 channel 到達確認、loop 起こし → < N 分通知 |
| **G-11** | 公開可能アプリ allowlist | PR-14: `clawbridge-policy.md` で個人情報 / 商取引 / 認証 / メディア機能 / 医療・金融・法律カテゴリ禁止を明文化 / PR-15: Review skill に自動判定プロンプト追加 | PM + Review | W2 | W3 | 該当カテゴリ submit → reject 確認 |
| **G-12** | 既存 PRJ 副作用ゼロ証明 | PR-16: dry-run モード実装 + Phase 1 全工程 3 回完走 + git diff 全件 0 確認スクリプト | Dev + Review | W3 | W4 | 検証ログを `reports/` に保存（§7 で詳細） |

**実装順序の根拠**:
- W1 で「ハードガード（G-01/G-04/G-05/G-06/G-08）」を最優先 → 暴走時の損害を物理的に止められる状態を最初に作る
- W2 で「監視・隔離（G-02/G-03'/G-07/G-09/G-10）」 → 検知と隔離の整備
- W3 で「公開ガード（G-11）」 → ニーズ判定機能と並行
- W4 で「副作用ゼロ証明（G-12）」 → 全機能完成後の最終証明

### 3.3 タスクブレイクダウン（WBS）— 4 週間

#### 全体ガント（週次マイルストーン）

```
W1 (5/19-5/23): ハードガード 5 項目 + Open Claw 起動環境構築
W2 (5/26-5/30): 監視・隔離 5 項目 + Claude Code 統合
W3 (6/02-6/06): ニーズ判定ループ + 公開ガード + ベンチマークタスク準備
W4 (6/09-6/13): 副作用ゼロ証明 + ベンチマーク 10 連続実行 + Phase 2 設計
```

#### W1（2026-05-19〜2026-05-23）: ハードガード前倒し

| タスク ID | タスク | 担当 | 工数 | 期限 | 並列可 | 依存 | 成果物 |
|---|---|---|---|---|---|---|---|
| CB-1-W1-01 | Anthropic / OpenAI / Vercel spend cap 設定 + 手順書 | オーナー + Dev | 4h | 5/19 | ✓ | — | 手順書 + console scrshot |
| CB-1-W1-02 | cost_check skill 実装 (PR-2) | Dev | 8h | 5/21 | ✓ | — | PR-2 |
| CB-1-W1-03 | Open Claw OSS 自前 host 構築（Codex Pro $200 OAuth、device-code 認証） | Dev | 8h | 5/22 | ✓ | — | 構築手順書 |
| CB-1-W1-04 | Claude Code permission allowlist 集約定義 (PR-6) | Dev | 6h | 5/22 | ✓ | — | PR-6 |
| CB-1-W1-05 | Bash command allowlist + denylist (PR-7) | Dev | 4h | 5/22 | ✓ | CB-1-W1-04 | PR-7 |
| CB-1-W1-06 | GitHub branch protection 一括適用 (PR-10) | Dev + オーナー | 3h | 5/20 | ✓ | — | PR-10 + 確認 scrshot |
| CB-1-W1-07 | HITL 5 ゲート PreToolUse hooks (PR-5) — block 部分のみ | Dev | 8h | 5/23 | — | CB-1-W1-04 | PR-5 |
| CB-1-W1-08 | 1Password Vault `Clawbridge-Master/Dev/Notify/Public` 構築 | オーナー + Dev | 3h | 5/19 | ✓ | — | Vault 構成図 |
| CB-1-W1-09 | レビュー部門による W1 完了レビュー | Review | 4h | 5/23 PM | — | 全 W1 タスク | W1 レビュー報告 |

**W1 マイルストーン**: G-01 / G-04 / G-05 / G-06 / G-08 完了 → 暴走しても物理的に被害が広がらない状態。

#### W2（2026-05-26〜2026-05-30）: 監視・隔離

| タスク ID | タスク | 担当 | 工数 | 期限 | 並列可 | 依存 | 成果物 |
|---|---|---|---|---|---|---|---|
| CB-1-W2-01 | emergency_stop skill 実装 + Slack slash command (PR-3, PR-4) | Dev | 8h | 5/27 | ✓ | — | PR-3, PR-4 |
| CB-1-W2-02 | Vercel Sandbox 起動ラッパー + env whitelist (PR-8) | Dev | 8h | 5/28 | ✓ | — | PR-8 |
| CB-1-W2-03 | 1Password CLI 統合 `op run` (PR-9) | Dev | 4h | 5/28 | ✓ | CB-1-W1-08 | PR-9 |
| CB-1-W2-04 | Supabase 監査スキーマ + append-only + retention (PR-11) | Dev | 6h | 5/29 | ✓ | — | PR-11 + 監査スキーマ doc |
| CB-1-W2-05 | stream-json 全 event Supabase 書込 hook (PR-12) | Dev | 8h | 5/30 | — | CB-1-W2-04 | PR-12 |
| CB-1-W2-06 | tos_monitor hooks 実装（24h 連続検知 / token 消費異常検知） | Dev + Review | 10h | 5/30 | ✓ | — | tos_monitor doc + impl |
| CB-1-W2-07 | Multi-channel alert (Slack/TG/Resend) + heartbeat (PR-13) | Dev | 8h | 5/30 | ✓ | — | PR-13 |
| CB-1-W2-08 | claude-code-company 既存 skill の非対話モード化（CEO/Secretary/Dev/Review） | Dev | 12h | 5/30 | ✓ | — | skills 改修 PR |
| CB-1-W2-09 | レビュー部門による W2 完了レビュー | Review | 4h | 5/30 PM | — | 全 W2 タスク | W2 レビュー報告 |

**W2 マイルストーン**: G-02 / G-03' / G-07 / G-09 / G-10 完了 → 異常検知 + 即停止 + 完全監査。

#### W3（2026-06-02〜2026-06-06）: ニーズ判定 + 公開ガード

| タスク ID | タスク | 担当 | 工数 | 期限 | 並列可 | 依存 | 成果物 |
|---|---|---|---|---|---|---|---|
| CB-1-W3-01 | needs_scout skill 実装（HN/PH/GitHub Trending API） | Dev | 12h | 6/04 | ✓ | — | needs_scout impl |
| CB-1-W3-02 | 評価関数 v0 実装（Phase 1 はスコアリングは固定値、ループ検証主眼） | Dev | 4h | 6/04 | ✓ | CB-1-W3-01 | scoring func |
| CB-1-W3-03 | 公開可能アプリ allowlist 明文化（clawbridge-policy.md） | PM + Review | 4h | 6/03 | ✓ | — | clawbridge-policy.md |
| CB-1-W3-04 | Review skill 自動判定プロンプト追加（G-11） | Review | 6h | 6/05 | — | CB-1-W3-03 | review skill 改修 |
| CB-1-W3-05 | Open Claw → CEO 構造化 JSON IF 実装 | Dev | 8h | 6/05 | ✓ | CB-1-W2-08 | JSON schema + impl |
| CB-1-W3-06 | ベンチマークタスク定義 + テストデータ準備 | PM + Dev | 4h | 6/04 | ✓ | — | benchmark spec |
| CB-1-W3-07 | autonomous-loop-guardrails.md 作成 | PM | 3h | 6/06 | ✓ | — | guardrails doc |
| CB-1-W3-08 | レビュー部門による W3 完了レビュー | Review | 4h | 6/06 PM | — | 全 W3 タスク | W3 レビュー報告 |

**W3 マイルストーン**: G-11 完了 + ニーズ判定ループ最小実装。

#### W4（2026-06-09〜2026-06-13）: 副作用ゼロ証明 + ベンチマーク

| タスク ID | タスク | 担当 | 工数 | 期限 | 並列可 | 依存 | 成果物 |
|---|---|---|---|---|---|---|---|
| CB-1-W4-01 | dry-run モード実装 (PR-16) | Dev | 6h | 6/10 | ✓ | — | PR-16 |
| CB-1-W4-02 | dry-run 3 回完走 + git diff 全件 0 確認 | Dev + Review | 6h | 6/11 | — | CB-1-W4-01 | dry-run report |
| CB-1-W4-03 | ベンチマークタスク 10 連続実行（実モード） | Dev + Review | 12h | 6/12 | — | W3 全完了 | benchmark report |
| CB-1-W4-04 | KPI 計測（時間 / コスト / 成功率） | PM + Review | 4h | 6/12 | — | CB-1-W4-03 | KPI report |
| CB-1-W4-05 | Phase 2 設計骨子作成（Phase 1 の知見反映） | PM | 8h | 6/13 | ✓ | CB-1-W4-04 | Phase 2 outline |
| CB-1-W4-06 | Phase 1 完了レポート（DEC-019-XXX 入力資料） | PM + Review | 6h | 6/13 | — | CB-1-W4-04 | phase1-completion-report.md |
| CB-1-W4-07 | レビュー部門による W4 / Phase 1 全完了レビュー | Review | 6h | 6/13 PM | — | 全タスク | Phase 1 final review |

**W4 マイルストーン**: G-12 完了 + Phase 1 PoC DoD 達成 + Phase 2 着手 Go/NoGo 判定材料一式。

#### 並列タスクと直列タスクの整理

- **完全並列可能ブロック**: W1 内（CB-1-W1-01〜06、W1-08）、W2 内（CB-1-W2-01〜04、06、07、08）
- **直列必須**:
  - CB-1-W1-04 → CB-1-W1-05 → CB-1-W1-07 (permission 系)
  - CB-1-W1-08 → CB-1-W2-03 (1Password)
  - CB-1-W2-04 → CB-1-W2-05 (Supabase スキーマ → 書込)
  - CB-1-W3-01 → CB-1-W3-02 → CB-1-W3-05 → CB-1-W4-03 (ループ完成度)
  - W3 全完了 → CB-1-W4-03 → CB-1-W4-04 → CB-1-W4-06 (PoC 検証)

- **総工数概算**: Dev 約 130h / Review 約 30h / PM 約 25h / オーナー約 10h = 約 195h

### 3.4 PRJ-018 並走時のリソース配分

OQ-05 で「PRJ-018 Asagi M1 と並走」確定。Dev 部門・Review 部門の稼働を週次で配分する。

#### 3.4.1 Dev / Review 部門の稼働時間配分

| 週 | Dev 配分（PRJ-019 / PRJ-018 / その他） | Review 配分（PRJ-019 / PRJ-018 / その他） |
|---|---|---|
| W1 | 50% / 40% / 10% | 30% / 60% / 10% |
| W2 | 60% / 30% / 10% | 30% / 60% / 10% |
| W3 | 50% / 40% / 10% | 40% / 50% / 10% |
| W4 | 70% / 20% / 10%（Phase 1 終盤集中） | 60% / 30% / 10%（Phase 1 終盤集中） |

**根拠**: PRJ-018 M1 Real impl は Critical Path 10.5h。1 週あたり 3-4h 進捗で 3 週で完遂可能。Asagi 既存 POC が完了しているため、PRJ-019 Phase 1 に Dev リソースの過半数を割り当て可能。

#### 3.4.2 衝突時の優先順位

優先順位ルール（CEO 経由で確定）:

| 状況 | 優先 | 理由 |
|---|---|---|
| **金銭損失リスク（CR-02）顕在化** | PRJ-019 即時対応 | 1 件 24h で数十万円の損失可能性 |
| **ToS 違反兆候（CR-01）顕在化** | PRJ-019 即時対応 | アカウント BAN で claude-code-company 全停止 |
| **既存運用中 PRJ への副作用兆候** | PRJ-019 即時対応 | F-04 失敗判定 |
| **PRJ-018 の M1 ブロッカー** | PRJ-018 優先 | 既知のクリティカルパス |
| **両方とも通常進捗** | PRJ-018 優先（直近 1 週は M1 集中） | M1 完遂を最優先 DEC-018-014 |
| **PRJ-019 Phase 1 締切間近 + PRJ-018 通常** | PRJ-019 優先 | Phase 1 4 週固定 |

#### 3.4.3 共通基盤の共有設計

| 共通基盤 | PRJ-018 利用 | PRJ-019 利用 | 衝突回避策 |
|---|---|---|---|
| **GitHub** | hironori-oi/Asagi リポ | clawbridge 専用リポ（新設、PRJ-019 専用） | 完全分離リポで衝突なし |
| **Vercel** | Asagi 配布用 deploy はなし（Tauri アプリ） | clawbridge 用 Vercel project（新設） | Asagi はそもそも Vercel 不要 |
| **Codex Pro $200 アカウント** | Asagi 開発時 IDE で使用 | Open Claw が device-code OAuth で使用 | Pro $200 5x usage 枠を消費共有、月次合算で `cost_check` skill 監視。tier 上限到達時は PRJ-019 自動 pause（PRJ-018 優先） |
| **Anthropic Pro/Max（OQ-02 P-C 採用時）** | Asagi 開発時 IDE で使用 | Claude Code 駆動で使用 | 同上、Pro/Max usage 枠を共有監視 |
| **claude-code-company 組織本体** | 開発作業対象 | 自律駆動対象 | PRJ-019 は read-only mount、PRJ-018 と非対称 |
| **Supabase 監査基盤** | Asagi の自前 DB 使わず | clawbridge 監査専用プロジェクト（新設） | 完全分離 |
| **通知系（Slack/Telegram/Email）** | PRJ-018 開発進捗チャネル | PRJ-019 自律ループ通知チャネル | チャネル分離（`#prj-019-clawbridge`、`#prj-018-asagi`） |

#### 3.4.4 Codex 5x usage 枠の共有監視（重要）

OQ-01 で「Pro $200 1 アカウント 5x 枠」確定。**PRJ-018 と PRJ-019 で同一アカウントを共有**するため、5 時間ローリングウィンドウの credit を競合する可能性。

実装:
- `cost_check` skill が `codex /status` 相当で残量確認、5 分間隔で記録
- 残量 < 30% で Slack 警告
- 残量 < 10% で **PRJ-019 自律ループ自動 pause**（PRJ-018 開発を優先）
- 残量回復 > 50% で自動再開（cron で 1 時間後リトライ）

---

## 4. Phase 2 / Phase 3 の更新ロードマップ

### 4.1 v1 から大きく変えた部分

| 項目 | v1 | v2 |
|---|---|---|
| Phase 2 着手判定 | Phase 1 の TCO 比較 + Devin/OpenHands 評価結果 | OQ-04 で自前ハーネス確定のため、TCO 比較タスク削除 |
| Phase 2 ゴール | 自律ループ実装 / 1 アプリ草案完成 | **「全自動ループ（ニーズ判定 → 1 アプリ完成）の最小ループ達成」**で再定義 |
| Phase 3 ゴール | 並列 3 案件 + コスト 50% 削減 | **「並列複数案件、コスト最適化」**（OQ-02 サブスク駆動でコスト構造変動のため、削減目標を流動化） |

### 4.2 Phase 2 ゴール詳細（更新）

**Phase 2 (8 週間)**: 全自動ループ最小達成

- **DoD**:
  - Phase 1 ベンチマークタスクを **「実際の HN trending アイデア」で実行**し、preview deploy まで自律到達
  - HITL G-01〜G-05 の 5 ゲートが全て期待通り動作（誤起動 0 件）
  - 月次コスト < $1,000
  - **prod deploy は引き続きオーナー手動承認**（自動公開は Phase 4 で別決裁）
- **新規実装**:
  - ニーズ判定の評価関数チューニング（HN/PH/GitHub Trending スコアの重み調整）
  - idea-reality-mcp 統合（リサーチ §6.2）
  - Phase 1 検出 issue の修正
  - 月 1 アプリ草案完成を 3 件達成
- **Phase 2 撤退条件**:
  - 月次コスト > $1,500
  - 誤起動 3 件以上
  - ToS 警告受信

### 4.3 Phase 3 ゴール詳細（更新）

**Phase 3 (12 週間)**: 並列複数案件、コスト最適化

- **DoD**:
  - 並列 3 案件同時進行（worktree 隔離で衝突なし）
  - モデル階層化（Haiku 4.5 → Sonnet 4.6 → Opus 4.7）でコスト 30-50% 削減
  - prompt caching 活用
  - 監視ダッシュボード（Next.js）の最小実装
- **OQ-02 サブスク駆動採用時の追加課題**:
  - サブスク枠を超過した場合の取り扱い（API キー従量併用 or 枠拡張）
  - 月次 token 消費の予測モデル
- **Phase 3 撤退条件**:
  - 月次コスト > $3,000
  - レビュー部門が品質劣化と判定

---

## 5. コスト計画 v2

### 5.1 OQ-02 サブスクプラン採用前提の月額レンジ

| 項目 | Phase 1 PoC | Phase 2 最小ループ | Phase 3 並列・最適化 | v1 比較 |
|---|---|---|---|---|
| **既知（オーナー契約済）**: ChatGPT Codex Pro $200 (5x usage) | $200 | $200 | $200 | 同 |
| **新規**: Anthropic Pro/Max サブスク（OQ-02 P-C 採用時） | $20 (Pro) または $100-200 (Max) | $200 (Max 必須) | $200 (Max) | v1 では $50-$5,000+ の API 従量 → 大幅圧縮 |
| Vercel Sandbox（生成コード実行） | 無料枠内 | $20-$80 | $100-$300 | v1 と同 |
| Vercel デプロイ（生成アプリホスティング） | Hobby 無料 | Pro $20/site | Pro $20-$100 | v1 と同 |
| Supabase 監査基盤 | 無料枠内 | Free or Pro $25 | Pro $25 | v1 と同 |
| Sentry / 監視 | 無料 | $26 | $80+ | v1 と同 |
| GitHub Actions（CI） | 無料枠 | $0-$50 | $50-$200 | v1 と同 |
| 1Password CLI | $3-$8 | $3-$8 | $3-$8 | 新規 |
| Resend / Twilio（通知） | 無料 | $20 | $50 | v1 と同 |
| **OpenAI API キー（embeddings 別途）** | $5-$20 | $20-$50 | $50-$100 | v1 §9.3 と同（Codex プランに含まれない） |
| **合計（既知サブスク含む）** | **$228-$248** | **$509-$683** | **$758-$1,283** | **v1 重運用 $2,300-$5,800+ → 大幅削減** |
| **合計（既知 Codex を除く）** | **$28-$48** | **$309-$483** | **$558-$1,083** | — |

### 5.2 v1 からの差分（最大の差）

- **Anthropic 従量課金 $50-$5,000+/月 → サブスク $20-$200/月の固定費**
- **Phase 3 重運用コスト見込み: v1 $2,300-$5,800+ → v2 $758-$1,283**（約 50-70% 削減）
- ただし P-E (API キー併用) フォールバック時は v1 同等コストに戻る

### 5.3 Phase 1 月次予算決裁推奨額

- **Phase 1 月次ハードキャップ**: $300（KPI F-02 の閾値、cost_check skill が監視）
- **Phase 1 4 週間累計**: 上記 $228-$248 × 1 ヶ月 = $228-$248 → 余裕 $52-$72
- **G-01 設定値**: Anthropic Console $250 / OpenAI Platform $250 / Vercel $50（合算で $550 だが個別キャップ）

---

## 6. リスク受容方針

### 6.1 OQ-02 採用後の残存致命リスク

レビュー部門 §1.1 の致命リスク CR-01〜CR-05 のうち、OQ-02（サブスク駆動）採用で**残存または増大するリスク**:

| ID | リスク | OQ-02 採用後の状態 | 残存スコア |
|---|---|---|---|
| **CR-01** | Anthropic ToS 違反 | **増大**（v1 では API キーで回避可能だった、v2 では P-C 採用時にグレー領域） | **9 → 9（同高水準）** |
| CR-02 | コスト爆発 | **減少**（サブスク固定費でハードキャップが効きやすい） | 9 → 4 |
| CR-03 | 既存 PRJ 破壊 | 不変 | 6 → 6 |
| CR-04 | 法令違反 | 不変 | 6 → 6 |
| CR-05 | secret 漏洩 | 不変 | 6 → 6 |

### 6.2 残存最大リスク CR-01 を許容範囲に収める方針

OQ-02 サブスク駆動採用は**ToS リスクを背負う代わりにコスト構造を改善する判断**。許容のための追加コントロール:

| # | コントロール | 実装 | 担当 |
|---|---|---|---|
| **1** | tos_monitor hooks（G-03'）の常時動作 | 「24h 連続稼働」「token 消費異常」「ordinary individual usage 逸脱」を 1 分間隔で検知、即停止 | Dev + Review |
| **2** | 段階的昇格（P-D → P-C） | W1 開始時は P-D（半自律）、W3 までに P-C 昇格判断（オーナー＋レビュー承認必要） | PM |
| **3** | 月次 ToS 動向レビュー | Anthropic / OpenAI の ToS 改訂を月次チェック、強化兆候あれば即 P-E フォールバック | Research |
| **4** | サブスク枠の量的制限 | Pro/Max usage 枠の 70% 以下で運用、超過時は自動 pause | Dev |
| **5** | フォールバック手順整備 | 24h 以内に P-E（API キー併用）に切り替え可能な手順を Phase 1 W2 までに整備 | PM + Dev |

### 6.3 リスク発現時のフォールバック手順

#### CR-01 顕在化時（Anthropic アカウント警告メール受信、または BAN）

**発現検知**:
- Anthropic からのメール（ai-lab@improver.jp）を 5 分間隔監視
- 「ToS violation」「account suspension」「unusual activity」キーワードで Slack 緊急通知
- Boris Cherny 発言型の「過剰使用警告」も含む

**24h 以内の対応手順**:
1. **T+0**: 緊急停止スイッチ発動（emergency_stop skill）、全 Open Claw / Claude Code 停止
2. **T+15min**: オーナー Slack に緊急通知、状況確認
3. **T+1h**: レビュー部門が原因究明、ログ精査
4. **T+4h**: P-E（API キー併用）への切替判断（オーナー決裁）
5. **T+8h**: P-E 設定完了、Phase 1 続行 or 凍結判断
6. **T+24h**: Anthropic への状況説明 + 必要なら appeal メール送信

**P-E 切替手順**（事前整備、§6.2 #5 で W2 まで完了予定）:
1. Anthropic Console で API キー新規発行
2. 1Password Vault `Clawbridge-Dev` に登録
3. Container B の認証設定を OAuth → API キーに切替（環境変数のみ変更、コード改修不要）
4. cost_check skill のコスト計算ロジックを従量モードに切替
5. オーナー承認後、Phase 1 PoC を P-E モードで再開

#### CR-02 顕在化時（コスト爆発）

- T+0: Anthropic Console / OpenAI Platform / Vercel spend cap 自動発動 → API 停止
- T+1h: 原因究明（ループ起因か、悪意ある generated code か）
- T+4h: 修正 + テスト
- T+8h: 段階的再開（cost_check skill の閾値を厳格化して再開）

#### CR-03〜CR-05 顕在化時

- §7 副作用ゼロ証明計画 + §6.1 v1 ハーネス権限マトリクスの即時厳格化
- 1 件発生で Phase 1 凍結、原因究明完了まで再開不可

---

## 7. 既存 PRJ への副作用ゼロ証明計画

レビュー部門 G-12 の具体実装。Phase 1 W4 で完遂予定（CB-1-W4-02）。

### 7.1 claude-code-company 組織自体への影響評価

| 影響項目 | 評価方法 | 許容基準 |
|---|---|---|
| `organization/` 配下の改変 | git diff 全件確認 | **0 行** |
| `dashboard/active-projects.md` の改変 | PRJ-019 起票時のみ追記、他案件行への変更なし | PRJ-019 行のみ更新 |
| 既存ロール定義（`roles/`）の改変 | git diff 全件確認 | **0 行**（Phase 2 以降に Open Claw からの改修許可検討） |
| `.claude/` 設定の改変 | git diff 全件確認 | PRJ-019 専用ファイル追加のみ、既存ファイル改変なし |

### 7.2 PRJ-001〜PRJ-018 への副作用検証手順

#### 検証 step 1: dry-run モード（CB-1-W4-01）

- Phase 1 全工程を実 deploy 抑制で 3 回完走
- 各回ごとに以下を全件確認:
  - `git diff projects/PRJ-001/`〜`projects/PRJ-018/` の全 PRJ で 0 行
  - Vercel project 全件で deployment 数 / build 数の変化なし
  - GitHub repo PRJ-018 (Asagi) の commit 数変化なし
  - Supabase 既存プロジェクト（自社運用 PRJ）の row count 変化なし

#### 検証 step 2: 実モード（CB-1-W4-03）

- 同上を実 deploy で 10 回連続実行
- ベンチマークタスク 10 回の各回前後で git diff 全件 0 確認
- 各回コスト < $5（KPI に合致）

#### 検証 step 3: ログ証拠保存

- 全検証ログを `projects/PRJ-019/reports/phase1-side-effect-zero-evidence.md` に保存
- git status snapshot を before/after で diff 比較
- Vercel API による project state snapshot を before/after で diff 比較
- 検証スクリプト `scripts/verify-zero-side-effect.sh` を `app/scripts/` に commit

### 7.3 ロールバック手順

#### Phase 1 完全撤退時の復旧手順

1. **T+0**: 全 cron / scheduler 停止（emergency_stop skill）
2. **T+5min**: ハーネス API キー / OAuth トークン全 revoke（Anthropic Console / OpenAI Platform / GitHub PAT / Vercel Token）
3. **T+15min**: Vercel project 全 delete（PRJ-019 配下のみ）
4. **T+30min**: GitHub repo 全削除（clawbridge 専用リポのみ、claude-code-company 本体は触らない）
5. **T+45min**: Supabase 監査ログ archive → 90 日保持後削除
6. **T+60min**: claude-code-company 本体は Phase 1 着手前の git tag `pre-prj019-phase1` に戻して原状復帰確認

**復旧時間目標**: < 1 時間（事前にスクリプト化必須）

**ロールバック試験**: Phase 1 着手前（W1 開始時）に 1 回、撤退手順を実行して 1 時間以内復旧を実証する（必須、CB-1-W1-09 の一部として）。

---

## 8. オープン論点（残存）

v1 §9 の OQ-01〜OQ-10 のうち、本書 v2 でオーナー判断 5 件により**解消されたもの / 解消されていないもの** + Phase 2 で判断必要なものを整理。

### 8.1 v1 から解消されたもの

| OQ ID | v1 内容 | 解消方法 |
|---|---|---|
| OQ-01 | ChatGPT Codex「x5」契約の意味 | **OQ-01 オーナー判断**: Pro $200 の 5x usage 枠で確定 |
| OQ-02 | Anthropic API キー予算月次上限決裁 | **OQ-02 オーナー判断**: API キー従量不採用、サブスク駆動採用 |
| OQ-03 | OpenAI Service Terms 全文確認 | **OQ-03 オーナー判断**: オーナー直接確認済 |
| OQ-06 | 自前 vs Devin/OpenHands TCO 比較 | **OQ-04 オーナー判断**: 自前ハーネス確定、TCO 比較不要 |
| OQ-09 | Phase 1 着手時期（PRJ-018 並走 vs 待機） | **OQ-05 オーナー判断**: 並走確定 |

### 8.2 v1 で残存しているもの（Phase 1 着手前に判断必要）

| OQ ID | 内容 | 判断者 | 期限 |
|---|---|---|---|
| OQ-04 | Secret 管理方式（1Password CLI / Doppler / Vault のいずれか） | オーナー | W1 開始前 |
| OQ-05 | Vercel Sandbox vs E2B（v2 では Vercel 推奨確定） | Dev + オーナー | W2 開始前（事実上 Vercel 確定） |
| OQ-07 | Open Claw 自前 host vs clawbro.ai マネージド | オーナー | W1 開始前（v2 では自前 host 推奨確定） |
| OQ-08 | 公開可能アプリ allowlist 確定（個人情報 / 商取引 / SaaS auth / メディア機能なし） | オーナー + Review | W3 までに（CB-1-W3-03 で完遂予定） |
| OQ-10 | プロジェクト正式名称（Clawbridge のまま採用するか） | オーナー | Phase 1 開始時 |

### 8.3 v2 で新規発生したもの

| 新 OQ ID | 内容 | 判断者 | 期限 |
|---|---|---|---|
| **OQ-11** | サブスク駆動 P-C / P-D / P-E のうちどれを採用するか | オーナー + Review（リサーチ補追完成後） | W2 開始前（Phase 1 着手後すぐ） |
| **OQ-12** | tos_monitor の閾値設定（24h 連続稼働 / token 消費異常の具体値） | Review + オーナー | W2 開始前 |
| **OQ-13** | サブスク枠 70% 上限の具体実装（Pro/Max usage 枠の取得方法、Anthropic 公式 API 不在） | Dev + Research | W2 開始前 |

### 8.4 Phase 2 で判断必要なもの

| Phase 2 OQ ID | 内容 |
|---|---|
| OQ-P2-01 | ニーズ判定評価関数の重み調整（Phase 1 で固定値、Phase 2 でチューニング） |
| OQ-P2-02 | 月 1 アプリ草案完成のターゲット領域（中小企業向け Web アプリのカテゴリ拡張） |
| OQ-P2-03 | サブスク枠超過時の対応（API キー併用 or プラン拡張） |
| OQ-P2-04 | 自動公開（prod deploy 自動化）の検討開始時期 |

---

## 9. Phase 0 → Phase 1 着手 Go/NoGo 最終判定

### 9.1 Go 条件のチェックリスト（v2）

| # | 条件 | 状態 | 根拠 |
|---|---|---|---|
| GO-01 | リサーチ報告書完成 + CEO 受領 | ✓ | `research-openclaw-harness-investigation.md` 完成 |
| GO-02 | PM 要件定義書（v1 + v2）完成 + CEO 受領 | ✓ | 本書 v2 + `pm-requirements-and-architecture.md` 完成 |
| GO-03 | レビュー部門セキュリティ評価レポート完成 + Phase 1 推奨 Go | ✓ | `review-security-and-risk-assessment.md` 「条件付き Go」判定 |
| GO-04 | OQ-01 / OQ-02 / OQ-03 オーナー判断完了 | ✓ | 本書冒頭で前提化 |
| GO-04+ | OQ-04（自前ハーネス） / OQ-05（PRJ-018 並走）オーナー判断完了 | ✓ | 本書冒頭で前提化 |
| GO-05 | リサーチ §11.2 最大障壁 Top 3 の対処方針が本書 §3-§7 で明示 | ✓ | §3.2 G-03'（CR-01）/ §6.2（許容方針）/ §3.2 G-04・G-11（公開ガード）/ §3.2 G-11（ニーズ判定 allowlist） |
| GO-06 | Phase 1 月次予算（$300）の確保 | **要確認** | オーナー決裁、W1 開始前 |
| GO-07 | キルスイッチ・コストキャップ実装方針確定 + Phase 1 タスク化 | ✓ | §3.2 G-01, G-02, G-04 / §3.3 W1 タスク化 |
| GO-08（v2 新規） | サブスク駆動 3 案併記 + 段階的昇格手順整備 | ✓ | §2.3 + §6.2 |
| GO-09（v2 新規） | PRJ-018 並走時のリソース配分計画完成 | ✓ | §3.4 |
| GO-10（v2 新規） | 既存 PRJ 副作用ゼロ証明手順整備 | ✓ | §7 |
| GO-11（v2 新規） | リサーチ補追未着 → P-D 開始 + W2 までに P-C 判断 | ✓（条件付き） | §2.3 で対応済 |

### 9.2 残タスク（Phase 1 着手前に揃える）

| 残タスク | 担当 | 期限 | 影響 |
|---|---|---|---|
| GO-06: 月次予算 $300 のオーナー決裁 + Anthropic Console / OpenAI Platform / Vercel spend cap 設定 | オーナー + Dev | W1 開始日（5/19） | 設定完了で Phase 1 着手可 |
| OQ-04: Secret 管理方式（1Password CLI 推奨） | オーナー | W1 開始日 | 推奨で確定可能なら追加判断不要 |
| OQ-07: Open Claw 自前 host 確定（v2 推奨） | オーナー | W1 開始日 | 推奨で確定可能なら追加判断不要 |
| OQ-11: P-C / P-D / P-E 採用方針の中間確認（W3 までに P-C 昇格判断） | オーナー + Review | W2 開始日 | リサーチ補追完成次第 |
| ロールバック試験（W1 開始時 1 回実施） | Dev + Review | W1 開始日 | < 1h 復旧確認 |

### 9.3 NoGo 判定条件（v2）

| # | NoGo 条件 | 対応 |
|---|---|---|
| NG-01 | OQ-11 で P-C / P-D / P-E のいずれも採用不可と判明 | 即時撤退 or PRJ-019 凍結 |
| NG-02 | 月次予算 $300 がオーナー決裁で確保不可 | Phase 1 凍結 |
| NG-03 | 必須コントロール 12 項目のうち、W1 ハードガード 5 項目（G-01 / G-04 / G-05 / G-06 / G-08）が W1 終了時に未完成 | W2 着手延期、原因究明 |
| NG-04 | PRJ-018 M1 で重大ブロッカー発生 + Dev リソース確保不能 | Phase 1 着手延期（最大 2 週間） |
| NG-05 | 兄弟案件で重大インシデント発生 | 全停止、原因究明後に再評価 |

### 9.4 CEO への Phase 1 着手承認要請

**CEO への要請文（DEC-019-XXX 候補本文）**:

> Phase 0 Deliverable（リサーチ徹底調査・PM v1+v2 アーキテクチャ・レビュー セキュリティ評価）が全て完成、オーナー判断 OQ-01〜OQ-05 が確定済。本書 §9.1 GO 条件 11 項目のうち 10 項目が ✓、残 1 項目（GO-06: 月次予算 $300 決裁）は W1 開始時オーナー設定で完了予定。
>
> Phase 1 着手は 2026-05-19（月）から 4 週間、PRJ-018 M1 と並走、Dev 約 130h / Review 約 30h / PM 約 25h / オーナー約 10h の工数配分。
>
> **PM 部門としての推奨**: **Phase 1 着手 Go 推奨**（条件付き、§9.2 残タスク完遂を W1 開始日までに完了することが条件）。
>
> 残存最大リスク CR-01（Anthropic ToS、サブスク駆動採用で増大）に対しては、§3.2 G-03' tos_monitor + §6.2 段階的昇格（P-D → P-C） + §6.3 P-E フォールバック手順により許容可能と判定。
>
> CEO による DEC-019-XXX 発行を要請する。

---

## 10. まとめ

本書は v1 アーキテクチャをオーナー判断 OQ-01〜OQ-05 で全面更新し、Phase 1 で実装可能な状態まで落とし込んだ v2 確定版である。最大の変更点は (1) Anthropic API キー従量 → サブスク駆動への切替、(2) 自前ハーネス構築確定（Devin/OpenHands 比較タスク削除）、(3) PRJ-018 M1 並走時のリソース配分明示、(4) リサーチ補追未着のため P-C/P-D/P-E 3 案併記 + 段階的昇格、(5) 必須コントロール 12 項目を Phase 1 4 週 WBS に完全配置。

Phase 1 PoC の DoD は「Open Claw が 1 つの簡単な Web アプリ案件を起票し、Claude Code に実装指示し、preview deploy + Slack 通知まで完全自動で達成」。月次コスト < $300、ベンチマーク 10 連続成功率 >= 80%、既存 PRJ 副作用 0 行を必達 KPI とする。

**v2 確定**: 2026-05-02 ／ **次回更新**: Phase 1 W1 開始時 / OQ-11 採用方針確定時 / リサーチ補追完成時 ／ **作成**: PM 部門
