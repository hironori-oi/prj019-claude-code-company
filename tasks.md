# PRJ-019 タスク一覧（tasks.md）

**起案日**: 2026-05-02 ／ **担当**: PM（兼任、Phase 0 では秘書代理起票） ／ **タスク ID プレフィクス**: `CB-`（Clawbridge）

## ステータス凡例

- `[ ]` 未着手
- `[>]` 進行中
- `[x]` 完了
- `[!]` ブロック中（理由必須）
- `[-]` 中止

**Phase 0 工数前提**: 「徹底調査・要件整理」が主目的、実装ゼロ。総工数は暫定 30〜50h、リサーチ着手後に PM が再見積。

---

## Phase 0: 徹底調査・要件整理（目標 2 週間）

### Track R: リサーチ部門による徹底調査

| ID | タスク | 担当 | 工数 | 依存 | ステータス |
|---|---|---|---|---|---|
| CB-R-01 | **Open Claw（clawbro.ai/ja）の一次情報全文取得** — トップページ / 製品ページ / 利用規約 / プライバシーポリシー / API ドキュメント / FAQ / 運営者情報。スクリーンショット保存 + 翻訳要約 | リサーチ | 4h | — | [ ] **最優先** |
| CB-R-02 | Open Claw の運営者・所在国・サービス形態（SaaS / OSS / クライアント配布）特定。Crunchbase / LinkedIn / GitHub / WHOIS で裏取り | リサーチ | 3h | CB-R-01 | [ ] |
| CB-R-03 | Open Claw の API / SDK / CLI 公開状況確認。サードパーティ統合可否、認証方式（OAuth / API Key / 独自）特定 | リサーチ | 3h | CB-R-01 | [ ] |
| CB-R-04 | **OpenAI ChatGPT Subscription Terms の「自動化エージェント利用」条項を全文確認**。許容 / グレー / 違反 のいずれかに判定。Codex CLI 用 ToS（PRJ-018 リサーチ済）との差分も明示 | リサーチ | 4h | — | [ ] **最優先（CB-R-01 と並列）** |
| CB-R-05 | Open Claw が Codex サブスク連携する仕様の確認（オーナーログイン経由 / トークン共有 / API ラッピング 等）。OpenAI 側の許可有無を裏取り | リサーチ | 3h | CB-R-01, CB-R-04 | [ ] |
| CB-R-06 | 競合・類似サービスの調査: AutoGPT / Devin AI / OpenAI Operator / Anthropic Computer Use / GitHub Copilot Workspace / Cline / Aider 等の自律エージェントの権限境界・配布形態・価格帯を比較 | リサーチ | 5h | — | [ ] |
| CB-R-07 | 「世の中のニーズの高い Web アプリ抽出」の既存手法調査（X / Reddit / Hacker News / Product Hunt / Google Trends API 等の活用例） | リサーチ | 3h | — | [ ] Should |
| CB-R-08 | Open Claw のデモ動画・ユーザレビュー・実運用事例の収集（YouTube / Twitter / Reddit / GitHub Discussions） | リサーチ | 2h | CB-R-01 | [ ] Should |
| CB-R-09 | リサーチ報告書 v1 完成（`reports/research-clawbridge-v1.md`）— CB-R-01〜08 を統合、CEO 提出 | リサーチ | 4h | CB-R-01〜08 | [ ] |

### Track P: PM による要件整理

| ID | タスク | 担当 | 工数 | 依存 | ステータス |
|---|---|---|---|---|---|
| CB-P-01 | **ハーネス仕様 v1 起案** — Open Claw に対する権限境界 MUST / MUST-NOT 表（ファイルシステム / シェル / ネットワーク / 外部 API / 金銭発生操作）。最小 30 項目 | PM | 6h | CB-R-09 | [ ] |
| CB-P-02 | **アーキテクチャ案 3 種以上の比較** — (A) Open Claw が claude-code-company を SSH/CLI で外部から叩く案 / (B) Open Claw 内に claude-code-company を子プロセス常駐させる案 / (C) MCP/REST ゲートウェイ中継案。Trade-off 表 + 推奨案を CEO 提案 | PM | 5h | CB-R-09 | [ ] |
| CB-P-03 | **撤退・リカバリ条件文書化** — 即停止スイッチ仕様 / 課金暴走防止上限 / ToS 違反確定時手順 / Open Claw 暴走時のロールバック | PM | 4h | CB-P-01, CB-P-02 | [ ] |
| CB-P-04 | 監査ログ・観測可能性の最小要件定義（誰が何時何をしたかの完全 trace、外部送信なし） | PM | 3h | CB-P-01 | [ ] Should |
| CB-P-05 | Phase 1 PoC スケジュール案（実装着手承認時の起動図、暫定マイルストン） | PM | 2h | CB-P-01〜CB-P-03 | [ ] Should |
| CB-P-06 | **PM 要件整理レポート v1 完成**（`reports/pm-requirements-v1.md`）— CB-P-01〜05 を統合、CEO 提出 | PM | 3h | CB-P-01〜CB-P-05 | [ ] |

### Track Sec: レビュー部門によるセキュリティリスク評価

| ID | タスク | 担当 | 工数 | 依存 | ステータス |
|---|---|---|---|---|---|
| CB-S-01 | ハーネス仕様 v1 のセキュリティレビュー（PM の CB-P-01 を入力に、抜け漏れ・過剰権限・特権昇格経路の検証） | レビュー | 5h | CB-P-01 | [ ] |
| CB-S-02 | アーキテクチャ案 3 種のセキュリティ Trade-off 評価（攻撃面積 / 隔離度 / 監査容易性） | レビュー | 4h | CB-P-02 | [ ] |
| CB-S-03 | **損失リスク評価** — 金銭暴走 / コード漏洩 / 第三者サービス改変 の最悪シナリオを 3 つ以上想定し、ハーネスでブロック可能か判定 | レビュー | 4h | CB-P-01, CB-P-03 | [ ] |
| CB-S-04 | ToS / 法務リスク評価 — OpenAI / clawbro.ai / GitHub / Vercel / Supabase の自動操作条項を横断レビュー | レビュー | 3h | CB-R-04, CB-R-05 | [ ] |
| CB-S-05 | **レビュー部門セキュリティ評価レポート v1**（`reports/security-evaluation-v1.md`）— CB-S-01〜04 統合、CEO 提出。Phase 1 着手の Go/NoGo 推奨を含む | レビュー | 4h | CB-S-01〜CB-S-04 | [ ] |

### Track Gate: Phase 0 ゲート

| ID | タスク | 担当 | 工数 | 依存 | ステータス |
|---|---|---|---|---|---|
| CB-GATE-01 | **CEO 受領 + DEC-019-XXX 発行** — Phase 1 着手 Go/NoGo 決裁。NoGo の場合は凍結 or 中止 or 再調査 | CEO | 2h | CB-R-09, CB-P-06, CB-S-05 | [ ] |

---

## Phase 0 ステータス（2026-05-02 時点）

- Track R / Track P / Track S / Track Gate 全て **完了**（DEC-019-005〜008 発行済）
- 成果物: `reports/` 配下 7 ファイル（research × 2、pm × 2、review × 2、secretary × 1）
- Phase 1 着手: **強い条件付き Go**（DEC-019-007、2026-05-02）

---

## Phase 1（強い条件付き Go、2026-05-19〜2026-06-13、4 週間）

**着手承認**: DEC-019-007（2026-05-02、CEO） ／ **タスク ID プレフィクス**: `CB-` 系統 ／ **WBS 出典**: `reports/pm-architecture-v2-and-phase1-plan.md` §3.3

**ID 命名規則**:
- `CB-D-XX` = 開発部門
- `CB-R-XX` = リサーチ部門（既存・補追含）
- `CB-S-XX` = レビュー部門
- `CB-O-XX` = オーナー判断 / オーナー作業
- `CB-PM-XX` = PM 部門
- `CB-SC-XX` = 秘書部門

### W0: 準備期間（2026-05-02〜2026-05-18、17 日間、Phase 1 着手前提整備）

| ID | タスク | 担当 | 工数 | 期限 | 依存 | 成果物 | ステータス |
|---|---|---|---|---|---|---|---|
| CB-O-01 | **OpenAI Service Terms オーナー直接確認**（自動化エージェント条項、`policies/service-terms/` 全文確認、グレー黙認妥当性の最終判定） | オーナー | 2h | 2026-05-09 | OQ-03 | 確認結果メモ → `reports/owner-openai-tos-check.md` | [x] **完了**（2026-05-02、ToS 全文取得 + CEO 一次解釈「条件付き許容」確定 → DEC-019-010） |
| CB-O-02 | **Anthropic Max $200 契約**（既存 Claude Pro/Max を Max 20x に確認・昇格、月次サブスク $200 アクティベート） | オーナー | 1h | 2026-05-15 | — | 契約確認 scrshot | [x] **完了**（2026-05-02、既 Max $200 アップグレード済 + オプション A 採用確定 → DEC-019-011） |
| CB-O-03 | **ChatGPT Pro $200（Codex 5x、$100 想定撤回）契約確認**（既契約: 次回更新 2026-06-01、Plus 比 5x、Codex 最大アクセス、週使用量 94% 残・Codex 5h 制限 100% 残） | オーナー | 1h | 2026-05-15 | OQ-01 | 契約確認 scrshot | [x] **完了**（2026-05-02、Pro $200 既契約確定 → DEC-019-009） |
| GO-06 | **月次予算 $300 承認**（DEC-019-009 で「Phase 1 で追加発生する月額の上限」として再定義、内訳: Claude Max $200 既契約 + Doppler 無料 + Vercel Hobby 無料 + Sentry 無料 + バッファ $100） | オーナー | 1h | 2026-05-09 | — | 承認メモ | [>] **部分完了**（2026-05-02、予算決裁完了。Anthropic Spend Cap Hard $50/月 + OpenAI Spend Cap Hard $20/月の設定はオーナー残タスク、5/18 期限 → DEC-019-012）|
| CB-O-04 | **Vercel Sandbox 利用設定**（Hobby 無料枠で開始、claude-code-company 既存アカウントでの sandbox API 有効化） | オーナー + Dev | 2h | 2026-05-16 | — | sandbox 接続確認ログ | [ ] |
| CB-O-05 | **1Password Vault 4 系統構築**（`Clawbridge-Master / Dev / Notify / Public`） | オーナー + Dev | 3h | 2026-05-16 | — | Vault 構成図 | [ ] |
| CB-D-01 | **clawbridge 専用 GitHub リポジトリ作成**（org or 個人、private、`prj019-*` 命名、branch protection 一括適用スクリプト準備） | Dev + オーナー | 3h | 2026-05-16 | — | リポ URL + protection rule | [ ] |
| CB-D-02 | **clawbridge 専用 Vercel project 作成**（PRJ-019 専用、deployment 用 token 発行、spend cap $50 設定） | Dev + オーナー | 2h | 2026-05-17 | CB-D-01 | Vercel project URL | [ ] |
| CB-D-03 | **clawbridge 専用 Supabase 監査基盤プロジェクト作成**（既存運用と物理分離、append-only スキーマ準備） | Dev | 3h | 2026-05-17 | — | Supabase project URL | [ ] |
| CB-D-04 | **OAuth トークン到達禁止 FS / env 隔離方針確定**（AppArmor / Mac TCC 仕様調査、Windows 11 + WSL2 での代替実装案） | Dev + Review | 4h | 2026-05-18 | — | 隔離方針 doc | [ ] |
| CB-PM-01 | **W1 着手前のキックオフ計画書作成**（W0 全タスク完遂確認、W1 担当アサイン、PRJ-018 並走時間配分の最終確認） | PM | 4h | 2026-05-18 | 全 W0 タスク | kickoff doc | [ ] |
| CB-S-W0-01 | **W0 完了レビュー + W1 着手 Go/NoGo 確認**（必須コントロール 21 項目の準備状況、未着 2 項目の W1 内整備計画レビュー） | Review | 4h | 2026-05-18 | CB-PM-01 | W0 完了レビュー報告 | [ ] |
| CB-SC-W0-01 | **W0 進捗の dashboard 反映**（PRJ-019 行更新、PRJ-018 並走時間競合週特定、週次対照表整備） | 秘書 | 3h | 2026-05-18 | — | dashboard + 対照表 | [>] **進行中**（2026-05-02、本セッションで PRJ-019 行更新済） |
| CB-S-W0-02 | **対象分野ホワイトリスト/ブラックリスト原案策定**（重要 13 領域 = 重要インフラ / 教育 / 住居 / 雇用 / 金融 / 保険 / 法律 / 医療 / 行政 / 製品安全 / 国家安全保障 / 移住 / 法執行 = 人間確認なし完全自動化禁止、ホワイトリスト案: ニッチ B2C ツール / 個人開発者向け / エンタメ等の低リスク領域、Phase 1 W1 着手前にレビュー済とすること、DEC-019-010 根拠） | レビュー | 4h | 2026-05-09 | DEC-019-010 | `reports/clawbridge-domain-allowlist-v1.md` | [ ] **最優先** |
| CB-D-W0-05 | **Sumi (PRJ-012) / Asagi (PRJ-018) 作業データ完全バックアップ**（git push + Anthropic セッション履歴 export、Phase 1 W1 着手前にレビュー部門が検証、C-A-01 / DEC-019-013 根拠） | Dev | 4h | 2026-05-15 | DEC-019-013 | バックアップ手順 + 検証ログ | [ ] |
| CB-S-W0-03 | **BAN 検知時の Sumi/Asagi 退避手順書整備**（API キー従量での即時継続手順、想定 RTO 4h 以内、C-A-02 / DEC-019-013 根拠） | レビュー | 4h | 2026-05-15 | DEC-019-013 | `reports/ban-evacuation-runbook-v1.md` | [ ] |
| CB-S-W0-04 | **BAN drill 2 回実施**（v2 計画は 1 回。1 回目 = Phase 1 タスクのみ / 2 回目 = Sumi/Asagi 同居前提、emergency_stop → P-E フォールバック → 復旧の 3 段階を測時、C-A-03 / DEC-019-013 根拠） | レビュー + Dev | 6h | 2026-05-12（1 回目）/ 2026-05-17（2 回目） | DEC-019-013 | drill 結果報告 ×2 | [ ] |
| CB-D-W0-06 | **Anthropic / OpenAI 使用量モニタリング組み込み**（Anthropic Console + ChatGPT Settings の usage を毎日 export、Doppler 経由でセキュア取得、C-A-04 / DEC-019-013 根拠） | Dev | 4h | 2026-05-12 | DEC-019-013 | usage export スクリプト + 日次 cron | [ ] |
| CB-D-W0-07 | **OAuth トークン保管隔離**（既存 claude.ai の OAuth トークンを OS ユーザー / 環境変数 / Doppler のレベルで隔離、同一アカウントだが Phase 1 ハーネス層からトークン到達経路を限定、C-A-05 / DEC-019-013 根拠） | Dev | 4h | 2026-05-15 | DEC-019-013 | 隔離設定 doc + 検証ログ | [ ] |
| CB-PM-W0-02 | **コスト計画 v3 策定**（DEC-019-009 反映 = Codex Pro $200 既契約 + Anthropic Max $200 既契約・同居 / 月次予算 $300 を「追加発生分の上限」として再構成、Phase 1 W1〜W4 のコスト推移再見積、Spend Cap $50/$20 反映） | PM | 4h | 2026-05-09 | DEC-019-009 / DEC-019-012 | `reports/cost-plan-v3.md` | [ ] |

**W0 マイルストーン**: オーナー契約 3 件完了 + リポ / Vercel / Supabase / Vault 整備完了 + 隔離方針確定 + 対象分野リスト原案策定 + Sumi/Asagi バックアップ + BAN drill 2 回完遂 + 使用量モニタリング起動 + OAuth トークン隔離 + コスト v3 策定 + W1 着手 Go 確認。

### W1（2026-05-19〜2026-05-23）: ハードガード前倒し

| ID | タスク | 担当 | 工数 | 期限 | 依存 | 成果物 | ステータス |
|---|---|---|---|---|---|---|---|
| CB-D-W1-01 | Anthropic / OpenAI / Vercel spend cap 設定 + 手順書（G-01） | オーナー + Dev | 4h | 2026-05-19 | CB-O-02, CB-O-03, CB-O-04 | 手順書 + console scrshot | [ ] |
| CB-D-W1-02 | cost_check skill 実装（PR-2、1 分間隔集計、Supabase 書込） | Dev | 8h | 2026-05-21 | CB-D-03 | PR-2 | [ ] |
| CB-D-W1-03 | Open Claw 自前 host 構築（Codex Pro $100 device-code OAuth、Container A） | Dev | 8h | 2026-05-22 | CB-O-03 | 構築手順書 | [ ] |
| CB-D-W1-04 | Claude Code permission allowlist 集約定義（PR-6、`permissions/clawbridge.json`、G-05） | Dev | 6h | 2026-05-22 | — | PR-6 | [ ] |
| CB-D-W1-05 | Bash command allowlist + denylist（PR-7、G-06） | Dev | 4h | 2026-05-22 | CB-D-W1-04 | PR-7 | [ ] |
| CB-D-W1-06 | GitHub branch protection 一括適用（PR-10、G-08） | Dev + オーナー | 3h | 2026-05-20 | CB-D-01 | PR-10 + scrshot | [ ] |
| CB-D-W1-07 | HITL 5 ゲート PreToolUse hooks block 部分（PR-5、G-04） | Dev | 8h | 2026-05-23 | CB-D-W1-04 | PR-5 | [ ] |
| CB-D-W1-08 | OAuth トークン FS / env 隔離実装（G-V2-11、AppArmor / TCC / WSL2 制約） | Dev | 6h | 2026-05-23 | CB-D-04 | 隔離設定 + 検証ログ | [ ] |
| CB-S-W1-01 | W1 完了レビュー（G-01 / G-04 / G-05 / G-06 / G-08 / G-V2-11 動作確認） | Review | 4h | 2026-05-23 PM | 全 W1 タスク | W1 レビュー報告 | [ ] |
| CB-SC-W1-01 | W1 進捗 dashboard 反映 + 週次対照（PRJ-018 と稼働時間突合） | 秘書 | 1h | 2026-05-23 PM | — | dashboard 更新 | [ ] |

**W1 マイルストーン**: G-01 / G-04 / G-05 / G-06 / G-08 / G-V2-11 完了 → 暴走しても物理的に被害が広がらない状態。

### W2（2026-05-26〜2026-05-30）: 監視・隔離 + tos_monitor

| ID | タスク | 担当 | 工数 | 期限 | 依存 | 成果物 | ステータス |
|---|---|---|---|---|---|---|---|
| CB-D-W2-01 | emergency_stop skill + Slack slash command（PR-3, PR-4、G-02） | Dev | 8h | 2026-05-27 | — | PR-3, PR-4 | [ ] |
| CB-D-W2-02 | Vercel Sandbox 起動ラッパー + env whitelist（PR-8、G-07） | Dev | 8h | 2026-05-28 | CB-D-02 | PR-8 | [ ] |
| CB-D-W2-03 | 1Password CLI 統合 `op run`（PR-9、G-07 補強） | Dev | 4h | 2026-05-28 | CB-O-05 | PR-9 | [ ] |
| CB-D-W2-04 | Supabase 監査スキーマ + append-only + 90 日保持（PR-11、G-09） | Dev | 6h | 2026-05-29 | CB-D-03 | PR-11 + スキーマ doc | [ ] |
| CB-D-W2-05 | stream-json 全 event Supabase 書込 hook（PR-12、G-09） | Dev | 8h | 2026-05-30 | CB-D-W2-04 | PR-12 | [ ] |
| CB-D-W2-06 | **tos_monitor hooks 実装**（24h 連続検知 / token 消費異常検知 / NG-3 12h・$1,000 上限、G-03'、DEC-019-008） | Dev + Review | 10h | 2026-05-30 | — | tos_monitor doc + impl | [ ] **重要** |
| CB-D-W2-07 | Multi-channel alert（Slack/TG/Resend、PR-13、G-10） | Dev | 8h | 2026-05-30 | — | PR-13 | [ ] |
| CB-D-W2-08 | claude-code-company 既存 skill の非対話モード化（CEO/Secretary/Dev/Review） | Dev | 12h | 2026-05-30 | — | skills 改修 PR | [ ] |
| CB-D-W2-09 | Anthropic 警告メール監視（Gmail API 1h polling、G-V2-08） | Dev | 4h | 2026-05-30 | — | Gmail filter + alert | [ ] |
| CB-D-W2-10 | API キー P-E フォールバック手順整備（24h 以内切替可能化、Plan B-1） | Dev + PM | 4h | 2026-05-30 | — | フォールバック手順 doc | [ ] |
| CB-O-W2-01 | **DEC-019-008 NG-3 暫定値（12h/日、$1,000 相当）の再確認**（実運用ベースラインを基にオーナー再判断） | オーナー + CEO | 2h | 2026-05-30 | CB-D-W2-06 | DEC-019-XXX（再確認 or 変更） | [ ] **重要** |
| CB-S-W2-01 | W2 完了レビュー（G-02 / G-03' / G-07 / G-09 / G-10 / G-V2-08 / Plan B-1 動作確認） | Review | 4h | 2026-05-30 PM | 全 W2 タスク | W2 レビュー報告 | [ ] |
| CB-SC-W2-01 | W2 進捗 dashboard 反映 + 週次対照 | 秘書 | 1h | 2026-05-30 PM | — | dashboard 更新 | [ ] |

**W2 マイルストーン**: G-02 / G-03' / G-07 / G-09 / G-10 / G-V2-08 / Plan B-1 完了 → 異常検知 + 即停止 + 完全監査 + ToS フォールバック準備完了。

### W3（2026-06-02〜2026-06-06）: ニーズ判定 + 公開ガード

| ID | タスク | 担当 | 工数 | 期限 | 依存 | 成果物 | ステータス |
|---|---|---|---|---|---|---|---|
| CB-D-W3-01 | needs_scout skill 実装（HN/PH/GitHub Trending API） | Dev | 12h | 2026-06-04 | — | needs_scout impl | [ ] |
| CB-D-W3-02 | 評価関数 v0 実装（Phase 1 はスコアリング固定値） | Dev | 4h | 2026-06-04 | CB-D-W3-01 | scoring func | [ ] |
| CB-PM-W3-01 | 公開可能アプリ allowlist 明文化（`clawbridge-policy.md`、G-11） | PM + Review | 4h | 2026-06-03 | — | clawbridge-policy.md | [ ] |
| CB-S-W3-01 | Review skill 自動判定プロンプト追加（G-11） | Review | 6h | 2026-06-05 | CB-PM-W3-01 | review skill 改修 | [ ] |
| CB-D-W3-03 | Open Claw → CEO 構造化 JSON IF 実装 | Dev | 8h | 2026-06-05 | CB-D-W2-08 | JSON schema + impl | [ ] |
| CB-PM-W3-02 | ベンチマークタスク定義 + テストデータ準備 | PM + Dev | 4h | 2026-06-04 | — | benchmark spec | [ ] |
| CB-PM-W3-03 | autonomous-loop-guardrails.md 作成 | PM | 3h | 2026-06-06 | — | guardrails doc | [ ] |
| CB-D-W3-04 | rate jittering 実装（G-V2-06、W1〜W2 で未着手分） | Dev | 4h | 2026-06-06 | — | jitter impl | [ ] |
| CB-S-W3-02 | W3 完了レビュー（G-11 / 残存コントロール 2 項目動作確認） | Review | 4h | 2026-06-06 PM | 全 W3 タスク | W3 レビュー報告 | [ ] |
| CB-SC-W3-01 | W3 進捗 dashboard 反映 | 秘書 | 1h | 2026-06-06 PM | — | dashboard 更新 | [ ] |

**W3 マイルストーン**: G-11 完了 + ニーズ判定ループ最小実装 + 必須コントロール 23/23 完了。

### W4（2026-06-09〜2026-06-13）: 副作用ゼロ証明 + ベンチマーク 10 連続

| ID | タスク | 担当 | 工数 | 期限 | 依存 | 成果物 | ステータス |
|---|---|---|---|---|---|---|---|
| CB-D-W4-01 | dry-run モード実装（PR-16、G-12） | Dev | 6h | 2026-06-10 | — | PR-16 | [ ] |
| CB-D-W4-02 | dry-run 3 回完走 + git diff 全件 0 確認 | Dev + Review | 6h | 2026-06-11 | CB-D-W4-01 | dry-run report | [ ] |
| CB-D-W4-03 | ベンチマークタスク 10 連続実行（実モード） | Dev + Review | 12h | 2026-06-12 | W3 全完了 | benchmark report | [ ] |
| CB-PM-W4-01 | KPI 計測（時間 < 60 分 / コスト < $5 / 成功率 ≥ 80%） | PM + Review | 4h | 2026-06-12 | CB-D-W4-03 | KPI report | [ ] |
| CB-PM-W4-02 | Phase 2 設計骨子作成（Phase 1 知見反映） | PM | 8h | 2026-06-13 | CB-PM-W4-01 | Phase 2 outline | [ ] |
| CB-PM-W4-03 | Phase 1 完了レポート（DEC-019-XXX Phase 2 Go/NoGo 判定資料） | PM + Review | 6h | 2026-06-13 | CB-PM-W4-01 | phase1-completion-report.md | [ ] |
| CB-S-W4-01 | W4 / Phase 1 全完了レビュー | Review | 6h | 2026-06-13 PM | 全タスク | Phase 1 final review | [ ] |
| CB-SC-W4-01 | Phase 1 完了 dashboard 反映 + 進捗 90% へ更新 | 秘書 | 2h | 2026-06-13 PM | — | dashboard 更新 | [ ] |

**W4 マイルストーン**: G-12 完了 + Phase 1 PoC DoD 達成 + Phase 2 着手 Go/NoGo 判定材料一式。

---

## 集計

| Track | タスク数（Phase 0） | 暫定工数 |
|---|---|---|
| R リサーチ（Phase 0 + 補追） | 9 + 1 補追レポート | 31h（補追含む実績）|
| P PM 要件整理（v1 + v2） | 6 + v2 計画 | 23h + v2 約 12h |
| S レビュー部門（v1 + v2） | 5 + v2 評価 | 20h + v2 約 10h |
| GATE | 1 | 2h |
| **Phase 0 計** | **21+α** | **約 100h（実績）** |

| Track（Phase 1） | タスク数 | 暫定工数 |
|---|---|---|
| W0 準備期間（オーナー / Dev / PM / Review / 秘書、DEC-019-009〜013 反映 +7 件追加 + GO-06 含む） | 20 | 約 62h |
| W1 ハードガード | 10 | 約 53h |
| W2 監視・隔離 + tos_monitor | 13 | 約 79h |
| W3 ニーズ判定 + 公開ガード | 10 | 約 50h |
| W4 副作用ゼロ証明 + ベンチマーク | 8 | 約 50h |
| **Phase 1 計** | **61** | **約 294h（PM v2 §3.3 概算 195h + W0 62h + 秘書 / レビュー反復）** |

---

**v1 起案**: 2026-05-02 ／ **v2 更新**: 2026-05-02（Phase 1 タスク追加、CB-D / CB-O / CB-PM / CB-S / CB-SC 系列採番） ／ **v3 更新**: 2026-05-02（オーナー W0 タスク完了反映 = CB-O-01/02/03/GO-06 完了化、DEC-019-009〜013 起因の 7 件追加 = CB-S-W0-02/03/04 + CB-D-W0-05/06/07 + CB-PM-W0-02、W0 タスク 12→20 / Phase 1 計 53→61） ／ **次回更新**: W0 各タスク完了時 / W1 着手時
