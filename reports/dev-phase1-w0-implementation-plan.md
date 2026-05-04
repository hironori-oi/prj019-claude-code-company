# PRJ-019 Phase 1 W0 実装計画書（開発部門）

- 案件: PRJ-019「Clawbridge（仮）」 — Open Claw を自律オーナーとする AI 組織ハーネス基盤
- 部署: 開発部門（Dev）
- 作成日: 2026-05-02
- 作成者: Dev Agent (claude-code-company)
- 期間: **W0 準備期間 = 2026-05-02 〜 2026-05-18**（17 日間）／ **W1 Phase 1 着手 = 2026-05-19**
- 入力（必読インプット）:
  1. `projects/PRJ-019/brief.md`
  2. `projects/PRJ-019/reports/research-openclaw-harness-investigation.md`
  3. `projects/PRJ-019/reports/research-supplement-tos-and-subscription-paths.md`（**P-D 改 採用根拠**）
  4. `projects/PRJ-019/reports/pm-architecture-v2-and-phase1-plan.md`（**WBS 正本**、本書はこの W1〜W4 の前段に W0 を追加する位置付け）
  5. `projects/PRJ-019/reports/review-v2-subscription-risk-and-fallback.md`（**必須コントロール 23 項目の正本**）
- CEO 決裁前提:
  - 接続方式: **P-D 改**（オーナー本人 PC で本人 OAuth ログイン済み公式 Claude Code CLI を常駐、Open Claw が `claude -p ... --output-format stream-json` で subprocess spawn）
  - Open Claw: github.com/openclaw/openclaw（MIT OSS、Peter Steinberger 作）+ Enderfga/openclaw-claude-code 接続例
  - サンドボックス: Vercel Sandbox（Firecracker microVM）採用
  - 月次予算: $300（Claude Max $200 + Codex Pro $100）
  - 連続稼働上限: 12h/日、API 換算 $1000/月相当超過で自動停止
  - DoD: HN trending → /new-project 起票 → Next.js 雛形 → Sandbox テスト → Review 合格 → preview deploy → Slack 通知 完全自動

---

## 1. W0 ゴール

W0（17 日間、5/2〜5/18）の目的は **W1 着手前に「ハーネス実装の技術前提」と「アプリ実体ディレクトリ骨格」を整え、W1 当日に PR 駆動でいきなりコードを書き始められる状態を作ること**。

### 1.1 W0 完了時の目標状態

| # | 状態 | 検証 |
|---|---|---|
| 1 | `projects/PRJ-019/app/` 配下に 9 コンポーネントの空骨格 + 各 README が存在 | `ls`、各 README の責務記述完了 |
| 2 | Open Claw OSS および Enderfga/openclaw-claude-code の上流仕様を取得・要約完了 | `app/openclaw-runtime/UPSTREAM-NOTES.md` |
| 3 | Open Claw OSS が PoC 環境で起動・初期化まで成功（Codex Pro $100 OAuth まで） | 起動ログ、`docs/` に PoC レポート |
| 4 | `claude -p "<prompt>" --output-format stream-json` の動作確認 + stream-json パーサプロトタイプ | `claude-bridge/` に動作確認 log |
| 5 | Vercel Sandbox の Hello World PoC 成功（生成コード隔離実行確認） | `sandbox/` PoC report + sandbox 起動 SDK 動作 |
| 6 | コスト追跡器・kill switch・FS allowlist・secret 隔離の最小プロトタイプ | `harness/` 配下に MVP 実装 |
| 7 | 必須コントロール 23 項目の Phase 1 着手前 21 項目に対応するチケット起票 | `tasks.md` 更新 + GitHub Issues |
| 8 | 既存 PRJ-001〜018 への副作用ゼロを W0 期間中も継続的に確認 | `git diff` 全件 0 行確認スクリプト動作 |

### 1.2 W0 で「やらないこと」

- 自律ループの本番実装（W3 タスク）
- 公開前承認ゲートの完全動作確認（W2 タスク）
- HN/PH/GitHub Trending API 統合（W3 タスク）
- ベンチマークタスク 10 連続実行（W4 タスク）
- Phase 1 月次予算 $300 の本番消費（W0 は試験で最小限のみ、Codex Pro $100 + Claude Max $200 サブスク代以外は $30 以内に抑える）

---

## 2. コンポーネント分解

PM v2 §2.2 のコンテナ図と review v2 必須コントロールに基づき、`projects/PRJ-019/app/` 配下を **9 つの責務分離された層** に分解する。

### 2.1 全体図

```
┌─────────────────────────────────────────────────────────────────┐
│ PRJ-019 Clawbridge ハーネス基盤（projects/PRJ-019/app/）        │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ openclaw-runtime/（Codex Pro $100 駆動、Open Claw OSS）│     │
│  │   - github.com/openclaw/openclaw を自前ホスト          │     │
│  │   - Codex Pro $100 device-code OAuth 認証              │     │
│  │   - Skill 群: needs_scout / cost_check / etc           │     │
│  └─────────────────┬──────────────────────────────────────┘     │
│                    │ subprocess spawn                            │
│  ┌─────────────────▼──────────────────────────────────────┐     │
│  │ claude-bridge/（Claude Code 接続層）                    │     │
│  │   - claude -p "<prompt>" --output-format stream-json   │     │
│  │   - stream-json NDJSON パーサ                          │     │
│  │   - prompt テンプレート + --json-schema                │     │
│  │   - 認証は本人マシン OAuth（P-D 改）                   │     │
│  └─────────────────┬──────────────────────────────────────┘     │
│                    │ FS write / git / MCP                       │
│  ┌─────────────────▼──────────────────────────────────────┐     │
│  │ orchestrator/（claude-code-company 接続層）             │     │
│  │   - CEO/Secretary/Dev/Review skill 呼び出し IF         │     │
│  │   - /new-project 構造化 JSON 起票                      │     │
│  │   - 既存 organization/ は read-only                    │     │
│  └─────────────────┬──────────────────────────────────────┘     │
│                    │                                             │
│  ┌─────────────────▼──────────────────────────────────────┐     │
│  │ sandbox/（Vercel Sandbox 連携層）                       │     │
│  │   - Firecracker microVM 起動 SDK ラッパー              │     │
│  │   - env whitelist（親 process env 引き継ぎ禁止）       │     │
│  │   - 生成コード隔離実行 + npm test                      │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ harness/（ハーネス制御層、横断）                        │     │
│  │   - cost_check（4 層ハードキャップ + 自主上限 70%）    │     │
│  │   - emergency_stop（kill switch、< 30 秒で全停止）     │     │
│  │   - HITL ゲート（公開 / 課金 / force push / prod / 外部API）│ │
│  │   - tos_monitor（24h 連続稼働 / 異常 token 消費検知）  │     │
│  │   - rate_limit_jitter / business-hour-window           │     │
│  │   - FS allowlist + Bash allowlist                      │     │
│  │   - secret 隔離（Tier-S0〜S4、1Password Vault）        │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ audit/（監査ログ・トレース層）                          │     │
│  │   - Supabase append-only（90 日保持）                   │     │
│  │   - stream-json 全 event を hook 経由で書込             │     │
│  │   - replay 可能な投入経路ログ                           │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ notify/（通知層）                                        │     │
│  │   - Slack（平常時 + heartbeat）                          │     │
│  │   - Telegram（異常時）                                   │     │
│  │   - Resend Email（critical）                             │     │
│  │   - Anthropic 警告メール監視 → 即停止フック              │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ tests/（単体・統合テスト）                                │     │
│  │   - Vitest 単体（harness / claude-bridge / sandbox）    │     │
│  │   - Playwright 統合（Phase 1 W4 ベンチマーク用）        │     │
│  │   - dry-run mode（git diff 全件 0 確認）                │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ docs/（アーキ図・API 仕様）                              │     │
│  │   - 各層の I/F 仕様、JSON schema、ADR                   │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 各層の責務・I/F・W0 段階の到達目標

#### 2.2.1 openclaw-runtime/（Open Claw ランタイム層）

| 項目 | 内容 |
|---|---|
| 責務 | Open Claw OSS（github.com/openclaw/openclaw、MIT）の自前ホスト、Codex Pro $100 サブスク OAuth で動作。Skill 群（needs_scout / cost_check / emergency_stop / tos_monitor）の実行コンテナ |
| 上流依存 | `openclaw/openclaw`（MIT）、`Enderfga/openclaw-claude-code`（参考実装） |
| 認証 | ChatGPT Pro $100 device-code OAuth（OQ-01 確定） |
| 入力 | オーナー Slack コマンド `/clawbridge run-benchmark`、cron スケジュール |
| 出力 | claude-bridge へのプロンプト指示、harness への監視イベント |
| W0 到達目標 | 上流仕様取得、ライセンス確認、ローカル起動 PoC、Codex OAuth 完了、空 skill のスケルトン |

#### 2.2.2 claude-bridge/（Claude Code 接続層）

| 項目 | 内容 |
|---|---|
| 責務 | Claude Code CLI を subprocess spawn し、本人マシン OAuth で動作させる。stream-json NDJSON を parse して event を harness/audit に流す |
| 主要 API | `spawnClaude(prompt: string, opts: SpawnOpts): AsyncIterable<StreamEvent>` |
| 起動コマンド | `claude -p "<prompt>" --output-format stream-json --allowedTools "..." --json-schema "..."` |
| 認証 | **オーナー本人の Claude Max OAuth**（P-D 改、本人マシン常駐前提）。`--bare` は使わない（OAuth が必要） |
| ToS 適合性 | research-supplement §9.1 の P-D 改根拠（公式 CLI を改変なし、本人 OAuth、ordinary individual usage） |
| W0 到達目標 | `claude -p` 動作確認、stream-json パーサプロトタイプ、エラー処理の最小実装 |

#### 2.2.3 orchestrator/（claude-code-company 接続層）

| 項目 | 内容 |
|---|---|
| 責務 | claude-bridge を介して既存 organization/ の skill 群（CEO/Secretary/Dev/Review）を呼び出す。`/new-project` 起票、PRJ-XXX 採番、5 点ドキュメント生成のオーケストレーション |
| 重要制約 | **既存 `organization/` は read-only**。Open Claw からの改修許可は Phase 2 以降で別決裁 |
| 主要 API | `requestCEO(intent: NewProjectIntent): Promise<CEOResponse>` |
| W0 到達目標 | I/F 設計のみ、実装は W2（CB-1-W2-08 と整合） |

#### 2.2.4 sandbox/（Vercel Sandbox 連携層）

| 項目 | 内容 |
|---|---|
| 責務 | Firecracker microVM 起動、生成コード隔離実行、env whitelist 強制（親 process env 引き継ぎ禁止）、artifact 退避、ephemeral 破棄 |
| 主要 API | `runInSandbox(repo: GitRef, env: EnvWhitelist, cmd: string[]): Promise<SandboxResult>` |
| Tier 階層 | Tier 3（生成コード）— Tier 1 secret は到達不可 |
| 上限 | Hobby 無料枠（5 CPU 時間 / 420 GB-hr / 5,000 sandbox/月）、5h/session |
| W0 到達目標 | Hello World PoC（hello.js を sandbox で実行、env が空であることを確認） |

#### 2.2.5 harness/（ハーネス制御層）

| 項目 | 内容 |
|---|---|
| 責務 | コスト追跡（4 層ハードキャップ）、稼働時間監視（12h/日、$1000/月相当）、HITL ゲート（5 種）、kill switch、tos_monitor、FS allowlist、Bash allowlist、secret 隔離 |
| 構成要素 | `cost_check.ts` / `emergency_stop.ts` / `hitl_gate.ts` / `tos_monitor.ts` / `rate_jitter.ts` / `business_hour_guard.ts` / `fs_allowlist.json` / `bash_allowlist.json` / `secret_isolation.ts` |
| W0 到達目標 | 各モジュールのスケルトン + cost_check の最小プロトタイプ（concept 実装） + emergency_stop のドラフト実装 |

#### 2.2.6 audit/（監査ログ・トレース層）

| 項目 | 内容 |
|---|---|
| 責務 | Supabase append-only テーブル、90 日保持、stream-json 全 event 書込、replay 可能化 |
| スキーマ | `clawbridge_audit_events`（id / ts / task_id / parent_task_id / event_type / payload jsonb / hash） |
| 改ざん防止 | append-only RLS + 各行 SHA-256 ハッシュチェーン |
| W0 到達目標 | スキーマ設計（DDL ドラフト）+ Supabase クライアント I/F 設計 |

#### 2.2.7 notify/（通知層）

| 項目 | 内容 |
|---|---|
| 責務 | Slack（平常 + heartbeat 5 分）、Telegram（異常）、Resend（critical）、Gmail polling（Anthropic 警告メール監視）|
| W0 到達目標 | Slack Webhook URL 取得、ping 通知 PoC、ファイル骨格 |

#### 2.2.8 orchestrator/（再掲: claude-code-company 接続層）

→ 2.2.3 と同一。

#### 2.2.9 tests/（単体・統合テスト）

| 項目 | 内容 |
|---|---|
| 責務 | Vitest 単体、Playwright 統合、dry-run mode（git diff 全件 0 確認） |
| W0 到達目標 | Vitest セットアップ、`scripts/verify-zero-side-effect.sh` の MVP 実装 |

#### 2.2.10 docs/（アーキ図・API 仕様）

| 項目 | 内容 |
|---|---|
| 責務 | 各層の I/F 仕様、JSON schema、ADR、PoC レポート |
| W0 到達目標 | 各層の I/F 仕様 v0、ADR-001（接続方式 = P-D 改）、ADR-002（サンドボックス = Vercel Sandbox）、ADR-003（自前ハーネス確定） |

---

## 3. W0 タスク詳細（5/2〜5/18）

タスク ID プレフィクス: **`CB-D-W0-XX`**（Clawbridge / Dev / W0）

凡例: 担当 = `Dev`（単独）／ `Dev+Review`（協調）／ `Dev+オーナー`（オーナー操作要）

### 3.1 タスク一覧

| ID | タスク | 担当 | 工数 | 期限 | 並列可 | 依存 | 成果物 |
|---|---|---|---|---|---|---|---|
| **CB-D-W0-01** | `projects/PRJ-019/app/` 配下に 9 ディレクトリ骨格作成 + 各 README 配置（責務・I/F・依存関係を 1 ページで明記）、`app/README.md` を W0 段階のステータス反映に更新 | Dev | 2h | 5/3 | ✓ | — | 9 ディレクトリ + 各 README + 更新済 `app/README.md` |
| **CB-D-W0-02** | Open Claw OSS（github.com/openclaw/openclaw）README/docs を WebFetch で取得、`app/openclaw-runtime/UPSTREAM-NOTES.md` に記録（ライセンス、依存、起動方法、ToS 注意点）。Enderfga/openclaw-claude-code も同様に追記 | Dev | 2h | 5/3 | ✓ | CB-D-W0-01 | `UPSTREAM-NOTES.md` |
| **CB-D-W0-03** | ADR-001（接続方式 = P-D 改）/ ADR-002（サンドボックス = Vercel Sandbox）/ ADR-003（自前ハーネス確定）を `app/docs/adr/` に作成。research v2 / pm v2 / review v2 を根拠引用 | Dev | 3h | 5/4 | ✓ | CB-D-W0-01 | `app/docs/adr/ADR-001.md` 等 3 件 |
| **CB-D-W0-04** | Open Claw OSS の実機 git clone + ローカル PoC 起動（Codex Pro $100 device-code OAuth 完了まで）。**注: `app/openclaw-runtime/` は upstream を submodule 化せず、まずは `vendor/` 配下に clone して読込のみ。fork 化は Phase 1 W2 以降で判断** | Dev | 4h | 5/8 | — | CB-D-W0-02, CB-D-W0-03 | PoC report `app/docs/poc/openclaw-bootstrap.md` + 起動ログ |
| **CB-D-W0-05** | Anthropic Max アカウント手順整備 — review v2 §5 に従い「メイン業務用と分離した別 email + 別 Anthropic アカウント」運用ドラフトを `app/docs/account-isolation.md` に整備。**実アカウント取得自体はオーナー手動操作で W0 期間中に完了**（Dev は手順書作成と確認のみ） | Dev+オーナー | 2h | 5/9 | ✓ | CB-D-W0-03 | `app/docs/account-isolation.md` + オーナー作成済アカウント情報（Vault のみ） |
| **CB-D-W0-06** | `claude -p "<prompt>" --output-format stream-json` 動作確認 — 本人マシン OAuth ログイン状態の Claude Max で `claude -p "echo test"` を実行、stream-json NDJSON が想定通り流れるか確認。`app/claude-bridge/poc/` に動作ログ保存 | Dev | 3h | 5/10 | ✓ | CB-D-W0-05 | `app/claude-bridge/poc/stream-json-sample.ndjson` + `app/docs/poc/claude-bridge-bootstrap.md` |
| **CB-D-W0-07** | stream-json NDJSON パーサプロトタイプ — TypeScript で `parseStreamJson(input: AsyncIterable<string>): AsyncIterable<StreamEvent>` を実装、`stream_event` / `system/init` / `system/api_retry` を識別。Vitest 単体テスト | Dev | 6h | 5/12 | — | CB-D-W0-06 | `app/claude-bridge/src/stream-json-parser.ts` + Vitest |
| **CB-D-W0-08** | Vercel Sandbox PoC — vercel sandbox SDK で hello.js（`console.log("hello"); console.log(JSON.stringify(process.env))`）を起動、env whitelist で親 env が引き継がれていないことを確認。`app/sandbox/poc/` に確認ログ | Dev | 4h | 5/13 | ✓ | CB-D-W0-03 | `app/sandbox/poc/env-whitelist-verify.log` + `app/docs/poc/vercel-sandbox-bootstrap.md` |
| **CB-D-W0-09** | コスト追跡器プロトタイプ — `app/harness/src/cost_check.ts` で 4 層（Anthropic / OpenAI / Vercel / 自主上限）をモック値で集計し、閾値超過時に Slack 通知を発火する MVP 実装。Vitest 単体 | Dev | 6h | 5/14 | ✓ | CB-D-W0-08 | `app/harness/src/cost_check.ts` + Vitest |
| **CB-D-W0-10** | kill switch プロトタイプ — `app/harness/src/emergency_stop.ts` で「全 child process kill」「cron 停止フラグ書込」「API キー一時 revoke 手順書呼び出し」の MVP 実装。手動トリガー（環境変数）で発火確認、< 30 秒で完全停止検証 | Dev | 5h | 5/15 | ✓ | CB-D-W0-09 | `app/harness/src/emergency_stop.ts` + 検証ログ |
| **CB-D-W0-11** | FS allowlist 仕様策定 — `app/harness/config/fs_allowlist.json` で「`projects/PRJ-019/**` write 可、`projects/PRJ-{020+}/` write 可、`projects/PRJ-001〜018/` read-only、`organization/` read-only、`.env*` 遮断」を JSON で明文化。`fs_allowlist.ts` で適用ロジックの型定義 | Dev | 3h | 5/15 | ✓ | CB-D-W0-03 | `app/harness/config/fs_allowlist.json` + 適用ロジック型 |
| **CB-D-W0-12** | secret 隔離設計 — `app/harness/src/secret_isolation.ts` で Tier-S0〜S4 の取り扱い I/F 定義、`op run` 統合のドラフト、Sandbox 起動時の env whitelist 強制ロジック。**実 secret は注入せず**、ダミー値で動作確認 | Dev | 4h | 5/16 | ✓ | CB-D-W0-08 | `app/harness/src/secret_isolation.ts` + Vitest |
| **CB-D-W0-13** | Slack Webhook 通知 PoC — `app/notify/src/slack.ts` で webhook 経由 ping、`app/notify/src/index.ts` で Slack/Telegram/Resend の I/F 統一抽象 | Dev | 3h | 5/16 | ✓ | CB-D-W0-09 | `app/notify/src/*` + ping ログ |
| **CB-D-W0-14** | 副作用ゼロ確認スクリプト MVP — `app/scripts/verify-zero-side-effect.sh` で `git diff projects/PRJ-001/`〜`projects/PRJ-018/` 全件 0 行を確認、`organization/` も同様。W0 期間中も毎日 cron で実行 | Dev | 2h | 5/17 | ✓ | CB-D-W0-01 | `app/scripts/verify-zero-side-effect.sh` |
| **CB-D-W0-15** | ハーネスポリシー雛形 — `app/harness/config/hitl_gates.json`（公開 / 課金 / force push / prod deploy / 外部 API の 5 ゲート定義）+ `business_hour_window.json`（09:00-23:00 JST）+ `tos_monitor_thresholds.json`（24h 連続稼働 NG / 1 日タスク数上限） | Dev | 3h | 5/17 | ✓ | CB-D-W0-11 | 各 JSON ファイル |
| **CB-D-W0-16** | 必須コントロール 23 項目 → W1〜W4 タスクへのマッピング表 — review v2 §7.1 の 23 項目を pm v2 §3.2 の WBS タスク（PR 単位）に紐付け、`app/docs/control-matrix.md` で可視化 | Dev+Review | 3h | 5/17 | ✓ | CB-D-W0-15 | `app/docs/control-matrix.md` |
| **CB-D-W0-17** | W0 完了レビュー（Review 部門との合同） — 上記成果物全件、ToS 適合性、副作用ゼロ、必須コントロール充足度を Review に確認依頼 | Dev+Review | 4h | 5/18 PM | — | 全 W0 タスク | `app/docs/w0-completion-review.md` |
| **CB-D-W0-18** | tasks.md / progress.md 更新 — Phase 1 着手前残タスク（GO-06 / OQ-04 / OQ-07 / OQ-11 / ロールバック試験）の状態を反映、CEO への W0 完了報告ドラフト作成 | Dev | 2h | 5/18 PM | — | CB-D-W0-17 | 更新済 `tasks.md` / `progress.md` |

### 3.2 集計

| 区分 | 件数 | 工数 |
|---|---|---|
| Dev 単独 | 13 件 | 47h |
| Dev+Review | 2 件 | 7h |
| Dev+オーナー | 1 件 | 2h |
| **合計** | **16 件**（B-1/B-2 完遂分含めると **18 件**） | **56h** |

W0 17 日間で約 56h = 1 日 3.3h ペース、PRJ-018 並走中の Dev 配分（W0 期間は PRJ-018 通常進捗、PRJ-019 は準備のため軽負荷）として現実的。

### 3.3 工数の根拠

- 上流調査（CB-D-W0-02, 04）: WebFetch + 実機 clone + 起動 = 6h
- ADR/I/F 設計（CB-D-W0-01, 03, 11, 15, 16）: 設計密度高め、合計 14h
- 実装プロトタイプ（CB-D-W0-07, 09, 10, 12, 13, 14）: TypeScript + Vitest、合計 26h
- PoC 実機検証（CB-D-W0-06, 08）: 7h
- 完了レビュー・報告（CB-D-W0-17, 18）: 6h

---

## 4. アプリ実体の格納先

### 4.1 組織ルール準拠

CLAUDE.md（プロジェクトルート）の最優先ルール、および `organization/rules/project-setup-checklist.md` の【最優先ルール】に厳密に従う:

> すべての新規案件のアプリケーション実体は `projects/{案件ID}/app/` 配下に配置する。

PRJ-019 では W0 段階で実装を `projects/PRJ-019/app/` 配下に直接配置する。**外部リポ化（hironori-oi/clawbridge private リポ）は Phase 1 M3 以降で検討**（理由: Phase 1 PoC 段階では claude-code-company リポ内で完結する方が、副作用ゼロ証明・dry-run が容易）。

### 4.2 ディレクトリ構造案（最終形、W0 完了時点）

```
projects/PRJ-019/app/
├── README.md                          # 全体図、W0/W1 段階のステータス
├── docs/
│   ├── adr/
│   │   ├── ADR-001-connection-method.md          # P-D 改採用
│   │   ├── ADR-002-sandbox-platform.md           # Vercel Sandbox
│   │   ├── ADR-003-self-hosted-harness.md        # 自前ハーネス
│   │   └── ADR-004-app-location.md               # app 配下配置（外部リポ化は M3 以降）
│   ├── api-spec/
│   │   ├── claude-bridge.md                      # spawnClaude API
│   │   ├── orchestrator.md                       # requestCEO API
│   │   ├── sandbox.md                            # runInSandbox API
│   │   └── harness.md                            # cost_check / emergency_stop 等
│   ├── poc/
│   │   ├── openclaw-bootstrap.md                 # CB-D-W0-04
│   │   ├── claude-bridge-bootstrap.md            # CB-D-W0-06
│   │   └── vercel-sandbox-bootstrap.md           # CB-D-W0-08
│   ├── account-isolation.md                      # CB-D-W0-05
│   ├── control-matrix.md                         # CB-D-W0-16
│   └── w0-completion-review.md                   # CB-D-W0-17
├── harness/                                       # ハーネス制御層
│   ├── README.md
│   ├── src/
│   │   ├── cost_check.ts                         # CB-D-W0-09
│   │   ├── emergency_stop.ts                     # CB-D-W0-10
│   │   ├── hitl_gate.ts                          # W2 で本実装
│   │   ├── tos_monitor.ts                        # W2 で本実装
│   │   ├── rate_jitter.ts                        # W2 で本実装
│   │   ├── business_hour_guard.ts                # W2 で本実装
│   │   ├── fs_allowlist.ts                       # CB-D-W0-11
│   │   └── secret_isolation.ts                   # CB-D-W0-12
│   └── config/
│       ├── fs_allowlist.json                     # CB-D-W0-11
│       ├── bash_allowlist.json                   # W1 で本実装
│       ├── hitl_gates.json                       # CB-D-W0-15
│       ├── business_hour_window.json             # CB-D-W0-15
│       └── tos_monitor_thresholds.json           # CB-D-W0-15
├── orchestrator/                                  # claude-code-company 接続層
│   ├── README.md
│   └── src/
│       └── index.ts                              # I/F のみ、実装は W2
├── claude-bridge/                                 # Claude Code subprocess spawn 層
│   ├── README.md
│   ├── src/
│   │   ├── spawn.ts                              # spawnClaude 実装、W1 着手
│   │   └── stream-json-parser.ts                 # CB-D-W0-07
│   └── poc/
│       └── stream-json-sample.ndjson             # CB-D-W0-06
├── openclaw-runtime/                              # Open Claw OSS 自前ホスト or wrapper
│   ├── README.md
│   ├── UPSTREAM-NOTES.md                         # CB-D-W0-02
│   └── vendor/                                   # CB-D-W0-04（git clone 物、.gitignore 推奨）
├── sandbox/                                       # Vercel Sandbox 連携
│   ├── README.md
│   ├── src/
│   │   └── runInSandbox.ts                       # W2 着手、CB-D-W0-08 は概念検証
│   └── poc/
│       └── env-whitelist-verify.log              # CB-D-W0-08
├── audit/                                         # 監査ログ・トレース
│   ├── README.md
│   ├── schema/
│   │   └── 001-init.sql                          # Supabase append-only DDL ドラフト、W2 で確定
│   └── src/
│       └── client.ts                             # I/F のみ、実装は W2
├── notify/                                        # 通知層
│   ├── README.md
│   └── src/
│       ├── index.ts                              # CB-D-W0-13
│       ├── slack.ts                              # CB-D-W0-13
│       ├── telegram.ts                           # W2 で本実装
│       └── email.ts                              # W2 で本実装
├── tests/                                         # 単体・統合テスト
│   ├── README.md
│   ├── unit/                                     # Vitest（各層単体）
│   └── e2e/                                      # Playwright（W4 ベンチマーク）
├── scripts/
│   └── verify-zero-side-effect.sh                # CB-D-W0-14
├── package.json                                   # W1 着手時に作成、W0 では未配置
├── tsconfig.json                                  # 同上
└── vitest.config.ts                               # 同上
```

**注**: `vendor/` 配下は `.gitignore` で除外し、submodule 化または Phase 1 M3 以降の fork repo 化で再評価する（CB-D-W0-04）。

### 4.3 既存 `app/README.md` の更新方針

既存 `app/README.md` は「Phase 0 期間中は実装ゼロ」と書かれているが、CEO 決裁により Phase 1 W1 着手 = 5/19 が確定したため、**W0 段階のステータス追記**を行う。既存文面は「Phase 0 履歴」として保持しつつ、新セクションとして W0 進行中・W1 着手予定を追加（CB-D-W0-01 で実施）。

---

## 5. 検証手順

### 5.1 各コンポーネントの動作確認方法

| 層 | W0 検証 | W1 以降検証 |
|---|---|---|
| openclaw-runtime | 上流 git clone + Codex OAuth 起動成功 | needs_scout skill が HN trending 取得 |
| claude-bridge | `claude -p "echo test"` が stream-json 返却 | `claude -p "<本格 prompt>"` が allowed tools 制限下で動作 |
| orchestrator | I/F 設計のみ | `requestCEO()` で /new-project が起票 |
| sandbox | hello.js + env whitelist 確認 | Next.js 雛形を sandbox で `npm test` |
| harness/cost_check | モック値で閾値超過 → Slack 通知 | Anthropic / OpenAI / Vercel 実 cost 集計 |
| harness/emergency_stop | 環境変数トリガーで child process kill | Slack `/clawbridge stop` で全停止 |
| harness/fs_allowlist | JSON 設定 + 適用ロジック単体テスト | 他 PRJ への write 試行 → reject |
| harness/secret_isolation | Sandbox env が空であることをログ確認 | 1Password CLI `op run` 統合動作 |
| audit | Supabase スキーマ DDL レビュー | stream-json 全 event 書込確認 |
| notify | Slack ping 到達確認 | heartbeat / anomaly 通知到達 |

### 5.2 統合テスト手順（W4 想定の DoD ベンチマーク事前準備）

W0 では DoD ベンチマークそのものは実行しないが、**W4 で実行可能な状態を整える**。

DoD（CEO 決裁: HN trending → /new-project 起票 → Next.js 雛形 → Sandbox テスト → Review 合格 → preview deploy → Slack 通知 完全自動）を W4 で実行するために、W0 段階で以下を整えておく:

1. ベンチマークタスク仕様書ドラフト（`app/docs/benchmark-spec.md`）を W3 着手時に書けるよう、W0 では HN trending API のサンプル取得 + Next.js 雛形生成コマンドの素振りを 1 回実施
2. dry-run mode の擬似フロー設計（W4 で本実装、`tests/e2e/benchmark.spec.ts` の skeleton のみ作成）
3. `scripts/verify-zero-side-effect.sh` を毎日 W0 期間中も走らせ、Phase 0 終了〜W1 着手までの差分が PRJ-019 配下のみであることを継続確認

### 5.3 W0 完了判定（CB-D-W0-17 の検収項目）

| # | 項目 | 判定 |
|---|---|---|
| 1 | 全 16 タスク（CB-D-W0-01〜18 から B-1/B-2 を除く 16 件）完了 | チェックリスト |
| 2 | 9 ディレクトリ + 各 README 配置 | `ls` |
| 3 | UPSTREAM-NOTES / ADR 4 件 / PoC レポート 3 件 配置 | `ls` |
| 4 | stream-json パーサ Vitest 緑 | `vitest run` |
| 5 | Vercel Sandbox env whitelist 検証ログ存在 | `cat env-whitelist-verify.log` |
| 6 | cost_check / emergency_stop プロトタイプ動作 | Vitest + 手動 trigger |
| 7 | FS allowlist / HITL gates / business hour window JSON 配置 | `ls` |
| 8 | 副作用ゼロスクリプト動作（PRJ-001〜018 / organization/ への diff 0 行） | `bash scripts/verify-zero-side-effect.sh` |
| 9 | 必須コントロール 23 項目 → W1〜W4 タスクのマッピング完成 | `cat control-matrix.md` |
| 10 | Review 部門の W0 合同レビュー合格 | `w0-completion-review.md` |

---

## 6. リスクと既知の不確実性

### 6.1 W0 期間中に潰すべき仮説

| ID | 仮説 | 検証方法 | 検証完了タスク |
|---|---|---|---|
| H-W0-01 | `claude -p ... --output-format stream-json` が本人 Max OAuth で問題なく動作する | `claude -p "echo test"` を実行、Anthropic から警告メールが来ないか観察 | CB-D-W0-06 |
| H-W0-02 | Vercel Sandbox の env whitelist が親 process env を引き継がない | sandbox 内で `env` を吐いて確認 | CB-D-W0-08 |
| H-W0-03 | Open Claw OSS が Codex Pro $100 device-code OAuth で起動する（リサーチ §2.3 の 3 ルート中ルート 2 or 3） | 実機 clone + 起動 | CB-D-W0-04 |
| H-W0-04 | 既存 `organization/` を read-only mount しつつ Open Claw が skill を呼び出せる | I/F 設計レビュー（実装は W2） | CB-D-W0-16 |
| H-W0-05 | review v2 §5 の「メイン業務用と分離した別 Anthropic アカウント」が技術的に取得・運用可能 | オーナー操作（別 email、別アカウント、Pro $20 か Max $200） | CB-D-W0-05 |

### 6.2 W0 段階の既知の不確実性

| 不確実性 | 影響 | W0 での対応方針 |
|---|---|---|
| **OQ-04** Secret 管理方式（1Password CLI / Doppler / Vault） | secret 隔離の実装パスに影響 | CB-D-W0-12 で 1Password CLI 推奨を前提に I/F 設計、オーナー判断は W1 開始日までに |
| **OQ-07** Open Claw 自前ホスト確定（v2 推奨は自前） | openclaw-runtime/ の実装範囲 | 自前ホスト前提で進める、オーナー判断は W1 開始日までに |
| **OQ-08** 公開可能アプリ allowlist 確定（個人情報なし、商取引なし、SaaS auth なし、メディア機能なし） | 公開ガード G-11 の判定 | W3 までに確定（CB-1-W3-03）、W0 では JSON 雛形のみ |
| **OQ-12** tos_monitor 閾値（24h 連続稼働 / token 消費異常の具体値） | tos_monitor の判定精度 | CB-D-W0-15 で初期値ドラフト、Review 部門と W2 開始前に確定 |
| **OQ-13** サブスク枠 70% 上限の取得方法（Anthropic 公式 API 不在） | rate_check の実装精度 | W0 段階では「内部カウンタ + 5 分 polling + 過去 5h 集計」で代替設計、W2 で実装 |
| **claude -p stream-json の細かな event 仕様** | パーサの完全性 | CB-D-W0-06 で実サンプル取得、CB-D-W0-07 でパーサに反映 |
| **Vercel Sandbox iad1 単一リージョン** | 将来的な multi-region | Phase 1 では問題なし、Phase 3 で E2B 再評価（pm v2 §2.4） |
| **OpenClaw 上流の API 安定性**（OSS、急速進化中） | submodule 化 vs vendor clone | W0 では vendor clone（CB-D-W0-04）、Phase 1 W2 で submodule/fork 化判断 |

### 6.3 W0 で残る ToS 解釈リスク

P-D 改の ToS 適合性は **research-supplement §6.1 行 #2 のグレー（許容範囲）** であり、review v2 §6 で「BAN 確率 12 ヶ月で 30〜60%」と評価されている。W0 で claude-bridge の動作確認（CB-D-W0-06）を行う際は以下を遵守:

- 1 セッション 1 リクエストの単発検証のみ、連続実行はしない
- 業務時間帯（09:00-23:00 JST）のみ実行
- 5h ローリングウィンドウの 70% に達しない最小回数
- Anthropic からの警告メールを毎日チェック
- もし警告メールを受信したら **即座に CB-D-W0-06 以降を中断**、W0 完了を遅延させてでも CEO・Review 部門に escalate

---

## 7. W1 着手前のブロッカー

### 7.1 W1 着手不可となる条件（NoGo）

| # | 条件 | 検出 | 対応 |
|---|---|---|---|
| **NG-W0-01** | CB-D-W0-06 で `claude -p` が本人 Max OAuth で動作しない、または Anthropic から警告メール受信 | 実機検証 + Gmail 監視 | P-A（Anthropic API キー従量）への即時切替判断、W1 開始延期、PM v2 §6.3 フォールバック実行 |
| **NG-W0-02** | CB-D-W0-04 で Open Claw OSS が Codex Pro $100 OAuth で起動しない | 実機 PoC | 上流 issue 起票、Enderfga/openclaw-claude-code 等の代替実装を再評価、W1 開始延期最大 1 週間 |
| **NG-W0-03** | CB-D-W0-08 で Vercel Sandbox の env whitelist が親 env を引き継いでしまう | sandbox 内 env 確認 | E2B / Daytona の代替評価（pm v2 §2.4）、サンドボックス層の再設計、W1 開始延期 |
| **NG-W0-04** | review v2 §5 の **メイン業務用 Anthropic アカウント分離**が技術的・実務的に不可（家族プラン制限等） | オーナー操作確認 | review v2 §8.4 代替案 1（API キー従量に戻す）または PRJ-019 凍結判断 |
| **NG-W0-05** | 副作用ゼロスクリプトで `projects/PRJ-001〜018/` または `organization/` に意図しない diff 検出 | `bash scripts/verify-zero-side-effect.sh` 失敗 | 即時全停止、原因究明、ロールバック、W1 着手延期 |
| **NG-W0-06** | 月次予算 $300 のオーナー決裁が 5/18 までに完了しない（GO-06） | オーナー確認 | W1 開始延期、決裁完了まで開始不可 |

### 7.2 オーナー判断を要する論点（W1 着手前に解消必須）

| 論点 ID | 内容 | 判断者 | 期限 |
|---|---|---|---|
| **OQ-04** | Secret 管理方式: **1Password CLI**（v2 推奨）で確定するか | オーナー | 5/18（W1 開始前） |
| **OQ-07** | Open Claw: **自前ホスト**（v2 推奨）で確定するか | オーナー | 5/18 |
| **OQ-11** | サブスク駆動: **P-D 改**（CEO 決裁済）で確定、W3 までの段階確認方法をオーナー承認 | オーナー + Review | 5/18 |
| **OQ-12** | tos_monitor 閾値: 24h 連続稼働 NG、1 日タスク数上限（提案: 20 件/日）、token 消費 1 日上限（提案: $50/日） | Review + オーナー | 5/18 |
| **OQ-13** | サブスク枠 70% 上限の具体実装（公式 API 不在、内部カウンタ案を承認するか） | Dev + Research + オーナー | 5/18 |
| **GO-06** | Phase 1 月次予算 $300 のオーナー決裁、Anthropic Console / OpenAI Platform / Vercel spend cap 設定 | オーナー | 5/18 |
| **OQ-10** | プロジェクト正式名称: **Clawbridge** で確定するか（仮称のままで W1 着手か）| オーナー | 5/18 |
| **追加** | **OpenAI ToS（OQ-03）の最終確認** — research v1/v2 で WebFetch 403 となった `openai.com/policies/service-terms/` のオーナー直接確認結果 | オーナー | 5/18 |

### 7.3 ブロッカー Top 3（最重要）

最優先で潰すべきブロッカー:

1. **NG-W0-01: `claude -p` 本人 Max OAuth 動作確認** — P-D 改の根幹仮説。これが崩れると Phase 1 全体の前提が壊れる。CB-D-W0-06 で 5/10 までに検証完了させ、警告メール来ない期間 1 週間を W0 内で確保する。
2. **NG-W0-04: メイン業務用 Anthropic アカウント分離** — review v2 §5 の必須要件。BAN 波及で claude-code-company 全 PRJ 停止リスク（損失 ¥500k〜¥2M）を回避する唯一の手段。CB-D-W0-05 で 5/9 までにオーナー操作完了。
3. **GO-06: 月次予算 $300 のオーナー決裁 + spend cap 設定** — これがないと W1 タスクの CB-1-W1-01 が実行できない。CB-D-W0-18 で 5/18 までに完了させる。

---

## 8. 関連ドキュメント・参照

- 案件概要: `projects/PRJ-019/brief.md`
- 意思決定: `projects/PRJ-019/decisions.md`（W0 着手時に DEC-019-XXX で W1 着手 Go 決裁予定）
- WBS 正本: `projects/PRJ-019/reports/pm-architecture-v2-and-phase1-plan.md`
- 必須コントロール正本: `projects/PRJ-019/reports/review-v2-subscription-risk-and-fallback.md`
- 接続方式根拠: `projects/PRJ-019/reports/research-supplement-tos-and-subscription-paths.md`
- 徹底調査: `projects/PRJ-019/reports/research-openclaw-harness-investigation.md`
- 組織ルール（最優先）: `organization/rules/project-setup-checklist.md`
- 開発部門ロール定義: `organization/roles/dev.md`

---

**v1 起案**: 2026-05-02 ／ **次回更新**: W0 中間レビュー（5/10 想定、CB-D-W0-06 完了後）／ W0 完了レビュー（5/18、CB-D-W0-17）
