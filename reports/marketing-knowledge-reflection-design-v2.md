# PRJ-019 Clawbridge — 社内ナレッジ反映 事前設計 v2

- 案件: PRJ-019 Clawbridge（Open Claw を自律オーナーとする AI 組織ハーネス基盤、自社 PoC 案件）
- 起票: Marketing 部門
- 作成日: 2026-05-03（v2 改訂）
- 対象タイミング: Phase 1 進行中の中間記録 + Phase 1 完了（2026-06-13 予定）後の本格反映、ポートフォリオ公開（**2026-06-20 土曜朝**）と同期
- 関連レポート:
  - `projects/PRJ-019/reports/ceo-w0-week1-consolidation.md`
  - `projects/PRJ-019/decisions.md`（DEC-019-026 / 027 / 028 / 029）
  - `projects/PRJ-019/reports/ceo-q-mkt-01-08-formal-adoption-2026-05-03.md`（Q-Mkt-01〜08 公式採択書）
  - `projects/PRJ-019/reports/marketing-portfolio-reflection-design-v2.md`（ポートフォリオ側 v2、本書と双方向参照）
  - `organization/knowledge/INDEX.md`
  - `organization/templates/lessons-learned-v2.md`
- ステータス: **設計確定**（Q-Mkt-01〜08 採択結果反映済み、実ナレッジファイルの作成は Phase 1 完了後の別タスク）

---

## §0. v1 → v2 変更点（必読）

本 v2 は、2026-05-03 Owner からの「Q-Mkt-01〜08 を CEO 推奨で進めて下さい」明示指示を受け、CEO が公式採択書 `ceo-q-mkt-01-08-formal-adoption-2026-05-03.md` で確定した 8 件の採択結果を、v1 の K1〜K10 章構成を維持したまま全章に反映したものである。特に **Q-Mkt-01（PATTERN 番号棚卸し）** と **Q-Mkt-08（K8/K9 部分匿名化）** は本書の根幹に関わる変更となる。

### v1 → v2 主要変更点一覧

| # | 項目 | v1（決裁前） | v2（採択後） | 採択根拠 |
|---|---|---|---|---|
| 1 | **PATTERN 番号（Q-Mkt-01）** | PATTERN-006 / 007 を確定値として記載 | **PM 棚卸し結果に従う**：暫定 006/007 のまま記載するが「5/8 検収会議で確定報告予定、衝突時 008/009 にスライド」を §X 注記として明記 | Q-Mkt-01 採択 |
| 2 | **K8/K9 anti-pattern 公開範囲（Q-Mkt-08）** | K8/K9 共に「公開範囲未定、社外共有可否は CEO 判断（v1 §7 残課題）」 | **部分匿名化で公開**：PRJ ID は `PRJ-XXX` 伏字、教訓は全面公開、社外参照可能 | Q-Mkt-08 採択 |
| 3 | **ポートフォリオ側との同期** | ポートフォリオ v1 と Q-Mkt 採択前提で接続 | ポートフォリオ v2（公開日 6/20 / 部分開示 80/50/100/概要 / Heading A / Contact form のみ）と整合、§5.3 の双方向リンクを v2 ファイル名に更新 | DEC-019-026 / 027 / 028 / 029 |
| 4 | **K4 playbook（ToS）の表現** | 「グレー / 違反濃厚」等 v1 内部表現 | ポートフォリオ側 ToS 概要のみ開示と整合、ナレッジ側でも **固有名詞は伏せた抽象例** 運用を強化 | Q-Mkt-05 整合 |
| 5 | **K5 playbook（予算）の数値開示** | 月 $300 / 配分事例を「数値ぼかし」 | ポートフォリオ側 cost 100% 開示と整合、社内ナレッジでは **数値そのもの開示**、社外向け派生資料作成時のみ婉曲化フラグを付与 | Q-Mkt-05 整合 |
| 6 | **K6 / K10 への 6/12 締切反映** | 「Phase 1 完了後の別タスク」表記のみ | ポートフォリオ公開（6/20）と同時に **K1 / K10 を最低限ドラフト着地** させる、6/12 ナレッジ最終締切（社内向け）を §X 追記 | 採択結果と同期管理 |
| 7 | **K1 lessons-learned の Try 候補** | 「ToS allowlist 半年再評価」「自社 PoC 起案テンプレ化」等 | 採択された静観方針（プレス NG / SNS X 1 投稿のみ）の **横展開判断**を Try に追加（次自社 PoC 起案時の自動適用ルール） | Q-Mkt-07 採択反映 |
| 8 | **§7 CEO 判断仰ぎ事項** | 6 件（K 優先 / PATTERN 番号 / domain_tags / 中間記録範囲 / K8K9 公開範囲 / GATE-K タイミング） | 採択済 2 件（K 優先 / K8K9 公開）は完了マーク、残 4 件のうち PATTERN 番号は「5/8 PM 棚卸し確定待ち」に降格、新規 1 件（横断 ToS allowlist 自動再評価フロー起票時期）を追加 | 採択結果整理 |
| 9 | **§X 新設（PATTERN 番号注記 + 6/12 ナレッジ締切 + 5/8 検収会議）** | なし | **PATTERN-006/007 番号は PM 棚卸し結果に従う注記**、ナレッジ最終締切（社内 6/12 / 公開ファイル参照可能 6/20）を §X で明示 | 本 v2 新設 |

v2 で **修正していない** 章: §1 ナレッジ蓄積方針（200 字、本質変更なし）、§2 ファイル候補一覧の K1〜K10 配置（PATTERN 番号注記のみ追記）、§3 章構成（K8/K9 内記述方針のみ更新）、§4 KPT 振り返りテンプレ（v1 維持、Try 候補に静観方針反映追加のみ）、§5 既存 INDEX 整合性（双方向リンクファイル名のみ v2 化）、§6 中間記録ポイント（v1 維持）。

---

## §1. ナレッジ蓄積方針（200 字）

PRJ-019 は自社 PoC かつ ToS 解釈・BAN リスクを能動的に承認した特殊性を持つため、**「次の自社 PoC で再利用可能か」**を判定基準にナレッジ抽出を行う。具体的には ① harness engineering の 9→34 必須コントロール対は他案件にも展開可能なパターン候補、② mock-first + TimeSource pattern は Web/モバイル受託でも転用可能な playbook 候補、③ ToS 順守と BAN リスク管理は「自社 PoC 起案チェックリスト」として checklist 化、の 3 系統に整理する。一方で Open Claw 固有 / OAuth 経路 / 特定 cap 数値などサービス側で陳腐化しやすい知見は lessons-learned 側に閉じ込め、半年棚卸しで再評価する。既存 INDEX.md 構造（lessons-learned / patterns / playbooks / checklists / domain-guides / anti-patterns）に整合する形で配置し、Phase 1 完了後に CEO + PM + Review が GATE-K で品質スコア確定する。**v2 では Q-Mkt-08 採択により K8/K9 を部分匿名化（PRJ ID 伏字 + 教訓全面公開）して社外参照可能化、ポートフォリオ v2 公開（6/20）と同期管理する**。

---

## §2. ナレッジファイル候補一覧（5〜10 件、PATTERN 番号は PM 棚卸し結果に従う）

提案。**実ファイル作成は Phase 1 完了後**、本書はファイル名候補と 1 行サマリのみ。

| # | 配置先 | ファイル名（仮） | type | 1 行サマリ | v2 注記 |
|---|---|---|---|---|---|
| K1 | `lessons-learned/` | `prj-019-lessons-learned.md` | lessons-learned | PRJ-019 全体の KPT 振り返り。3 大キーワード（人間不在 / Codex サブスク / harness engineering）に対する実検証結果と、BAN リスク受容下での運用記録 | v2 維持 |
| K2 | `patterns/` | **`PATTERN-NNN-harness-permission-boundary.md`** | pattern | 自律 / 半自律エージェントに権限を渡す前に「MUST / MUST-NOT 対」で書き切るパターン。9→34 必須コントロールの抽象化版を Web/モバイル/受託全般へ展開 | **PATTERN 番号は PM 棚卸し結果に従う**：暫定 006、衝突時 008 にスライド（§X 参照） |
| K3 | `patterns/` | **`PATTERN-NNN-mock-first-timesource.md`** | pattern | 実通信を伴うテストを先にモック層で同型再現し、本番ループに統合検証を 1 度だけ通す pattern。TimeSource 注入で libfaketime 代替 | **PATTERN 番号は PM 棚卸し結果に従う**：暫定 007、衝突時 009 にスライド（§X 参照） |
| K4 | `playbooks/` | `tos-compliant-ai-subscription-runbook.md` | playbook | 商用 AI サブスクリプションを業務利用する際の ToS 解釈プロセス（一次情報取得 → CEO 一次解釈 → Review 二次評価 → 半年再評価）の手順書。固有名詞は婉曲化 | v2 維持（ポートフォリオ ToS 概要のみ開示と整合） |
| K5 | `playbooks/` | `multi-project-budget-cap-orchestration.md` | playbook | 複数案件並走時の月次予算ハードキャップ運用（$300 例）と、超過時の自動停止 / フォールバック切替 / weekly cap 監視の設計手順 | v2 維持（社内ナレッジでは数値開示、社外派生資料は婉曲化） |
| K6 | `checklists/` | `self-poc-startup-checklist.md` | checklist | 自社 PoC を起案する際の **着手前チェック 25 項目**（BAN リスク評価 / 副作用ゼロ計画 / 月次予算上限 / 撤退条件 等）。`organization/rules/project-setup-checklist.md` の補完版 | v2 維持、静観方針（プレス NG / SNS X 1 投稿のみ）も項目に追加検討（§3.6 参照） |
| K7 | `checklists/` | `zero-side-effect-verification-checklist.md` | checklist | 既存案件への副作用ゼロを担保するための grep + 自動スクリプト + git history 確認の verification checklist | v2 維持 |
| K8 | `anti-patterns/` | `ANTI-NNN-multi-account-tos-bypass.md` | anti-pattern | サブスク使用枠を multi-account で水増しする行為が ToS 違反濃厚であることを記録、教訓全面公開（PRJ ID は `PRJ-XXX` 伏字） | **Q-Mkt-08 採択：部分匿名化で公開、社外参照可能**（§3.8 参照） |
| K9 | `anti-patterns/` | `ANTI-NNN-oauth-token-spawn-direct.md` | anti-pattern | 自律エージェントから OAuth トークンに直接到達させる経路の危険性、教訓全面公開（PRJ ID は `PRJ-XXX` 伏字） | **Q-Mkt-08 採択：部分匿名化で公開、社外参照可能**（§3.9 参照） |
| K10 | `decisions-log/` | `ADR-001-self-poc-harness-engineering.md` | adr | PRJ-019 で確立した「自社 PoC では商用 AI を直叩きせず、harness 層を必ず挟む」全社方針。今後の自社 PoC 起案時に参照 | v2 維持 |

**Marketing からの推奨優先度（v2 確定）**: K1 / K2 / K6 / K10 を**最優先**（横展開価値が最も高い）、K3 / K5 / K7 を**第二優先**（受託案件にも応用可能）、K4 / K8 / K9 は**第三優先**（半年棚卸しで陳腐化しやすい知見、定期再評価前提）。**v2 では Q-Mkt-08 採択により K8 / K9 が「社外参照可能 anti-pattern」として再位置付けされ、優先度は維持しつつ社外派生資料（受託営業時の参考資料）への展開可能性を獲得**。

PATTERN 番号（K2 / K3 = 暫定 006 / 007）と ANTI 番号（K8 / K9 = 暫定 001 / 002）は **PM 棚卸し結果に従う**。詳細は §X 参照。

---

## §3. 各ナレッジファイルの outline（タイトル / 想定読者 / 章構成）

### §3.1 K1: `lessons-learned/prj-019-lessons-learned.md`

- **type**: lessons-learned（`organization/templates/lessons-learned-v2.md` 準拠）
- **想定読者**: PM / CEO / Review / Marketing（次の自社 PoC を起案する自分自身）
- **章構成**:
  1. プロジェクト概要（自社 PoC、4 週間 + 準備 2 週間、月 $300、3 案件並走）
  2. TL;DR（5 行以内、harness 9→34 / mock-first / 副作用ゼロ / BAN drill 2 回 / 月予算内完遂）
  3. 案件サマリー（実績数値、テスト 83 / コントロール 9 → 34 / 月次予算 $300 / 副作用 0 行）
  4. Keep（harness 設計の MUST/MUST-NOT 対、TimeSource pattern、mock-claude 5 シナリオ、副作用ゼロ自動検証スクリプト、3 部署並列発注の運用、BAN drill リハーサル、**ポートフォリオ公開判断（部分開示モード採択 / Heading A / 静観方針）の意思決定プロセス**）
  5. Problem（BAN drill で発見された欠陥、weekly cap 数値非公開での運用設計の難しさ、Open Claw 上流再ポジションでマーケ齟齬、Vercel コスト想定の上方修正必要、**ポートフォリオ公開タイミング決裁の所要時間 = Q-Mkt 採択合意形成までの工数**）
  6. Try（Phase 2 改善事項、cost_check skill 拡張、ToS allowlist 半年再評価フロー、自社 PoC 起案テンプレ化、**静観方針（プレス NG / SNS X 1 投稿のみ）の次自社 PoC 起案時の自動適用ルール化**、**部分開示モード（80/50/100/概要）の汎用化**）
  7. 関連 ADR / Pattern / Playbook（K2 / K3 / K4 / K10 への参照、ポートフォリオ v2 への参照）

### §3.2 K2: `patterns/PATTERN-NNN-harness-permission-boundary.md`（番号は PM 棚卸し結果）

- **type**: pattern（既存 `patterns/ai-three-layer-guard.md` の上位概念、または隣接パターンとして配置）
- **想定読者**: 全部署（特に Dev / Review）、横展開で受託案件のセキュリティ設計時にも参照
- **章構成**:
  1. パターン名・適用文脈（自律 / 半自律エージェントに権限を渡す任意の場面）
  2. 問題（無制限権限はコード漏洩 / 課金暴走 / 第三者サービス改変の致命的リスクを生む）
  3. 解決パターン（① MUST / MUST-NOT 対で先に「してはいけないこと」を書く、② 4 層コスト上限 + 緊急停止 + サーキットブレーカ + HITL ゲート、③ env allow-list + FS 隔離 + secret block-list の三重防護）
  4. 結果（PRJ-019 で 9 コントロール 67 テスト全緑、ペネトレ 45 試行 zero-bypass）
  5. トレードオフ（実装コスト / 自動化レベルの一部犠牲）
  6. 適用例（PRJ-019 / 想定: 受託案件で AI 自動化を組み込む際の標準）
  7. 関連パターン（既存 `ai-three-layer-guard.md` / `multi-tenant-three-layer-authz.md` との位置関係）

### §3.3 K3: `patterns/PATTERN-NNN-mock-first-timesource.md`（番号は PM 棚卸し結果）

- **type**: pattern
- **想定読者**: Dev / Review、テスト工学を整備したい全プロジェクト
- **章構成**:
  1. パターン名・適用文脈（外部 API / 課金 / 時間依存テスト全般）
  2. 問題（実通信 / 実時間に依存するテストは決定論的でない、Windows で libfaketime 不可）
  3. 解決パターン（① mock 層は本番と同型 schema、② TimeSource を注入で抽象化、③ 統合テストは 1 度だけ実通信）
  4. 結果（10 files / 83 tests 全緑、Windows でも決定論的実行）
  5. 適用例（PRJ-019 mock-claude / cost-tracker / kill-switch）
  6. 注意点（mock 過信で実通信不具合を見逃さない、統合テスト 1 回はマスト）

### §3.4 K4: `playbooks/tos-compliant-ai-subscription-runbook.md`

- **type**: playbook
- **想定読者**: CEO / PM / Marketing、商用 AI サブスクを業務利用する全案件
- **章構成**:
  1. 背景（商用 AI サブスクは ToS が業務利用 / 自動化 / multi-account を制約する）
  2. 標準プロセス（① 一次情報取得（公式 ToS / Usage Policy 全文）→ ② CEO 一次解釈 → ③ Review 二次評価 → ④ 6 ヶ月ごとに再評価）
  3. 解釈ガイド（許容 / グレー / 違反の 3 分類フレーム、固有名詞は伏せた抽象例 3 件）
  4. 違反濃厚パターン（multi-account 水増し、24/7 連続稼働、API 換算で個人利用想定額の 5 倍超 等を抽象化）
  5. ヒアリング項目（プラン契約状況 / 業務利用条項 / 監査ログ要件 / 取り下げ条件）
  6. 取り下げ判断（一次通告受領時の即時撤退手順）
  7. **v2 追記章: 公開資料連携**（ポートフォリオ等の社外公開資料に ToS 解釈を露出させない原則、概要のみ開示の境界判断、ポートフォリオ v2 §5 チェックリストとの相互参照）

### §3.5 K5: `playbooks/multi-project-budget-cap-orchestration.md`

- **type**: playbook
- **想定読者**: PM / CEO、複数案件並走時のリソース管理
- **章構成**:
  1. 背景（個人 / 小規模組織での同時並走では予算 / cap が共有プールになる）
  2. 標準フロー（① 月次ハードキャップ確定 → ② 案件別配分マトリクス → ③ 5h cap / weekly cap 監視 → ④ 80% / 95% でアラート / 自動 pause）
  3. データソース（Console scrape / CLI usage コマンド / 自社 cost_check skill）
  4. フォールバック設計（API キー従量フォールバックの 1 行 env 切替、優先案件の確保ルール）
  5. 月次予算 $300 ケーススタディ（PRJ-019 + 他自社内 2 案件の配分事例、社内ナレッジでは固有名詞・閾値開示、社外派生資料は婉曲化フラグ付き）
  6. extra usage 課金の判断ルール（CEO 決裁必須）
  7. **v2 追記章: 数値開示の階層**（社内ナレッジは数値そのもの、ポートフォリオ等社外公開資料は cost 100% 開示でも案件名は伏字、配分内訳は数値ぼかし）

### §3.6 K6: `checklists/self-poc-startup-checklist.md`

- **type**: checklist
- **想定読者**: CEO / PM / Marketing、自社 PoC を起案する全タイミング
- **章構成**: 25 項目チェック（v2 で公開判断ブロック追記検討）
  - **着手前 10 項目**: 3 大キーワード明文化 / 月次予算ハードキャップ / BAN リスク評価 / 副作用ゼロ計画 / 撤退条件 / ToS 一次情報取得 / アーキテクチャ案 3 種比較 / 既存案件への影響評価 / Owner 残タスク列挙 / DEC 起票
  - **W0 着手 8 項目**: harness 必須コントロール選定 / mock-claude 整備 / TimeSource 拡張 / BAN drill シナリオ / Spend Cap 設定 / OAuth 隔離 / 使用量モニタリング / バックアップ手順
  - **Phase 1 進行中 7 項目**: 副作用ゼロ自動検証 / 週次 KPT / weekly cap 監視 / Vercel 昇格判断 / HITL 通知整備 / インシデント対応訓練 / Phase 2 Go/NoGo 判定材料蓄積
  - **v2 追記候補（公開判断ブロック、5 項目）**: ポートフォリオ公開 Go/NoGo 条件 / 部分開示モード比率の事前合意 / Heading 案 3 案併記 → CEO 採択 / プレス・SNS 静観方針の確認 / 取り下げ Runbook 起票（K6 のサブカテゴリとして組み込み、Phase 1 完了後に正式追加判断）

### §3.7 K7: `checklists/zero-side-effect-verification-checklist.md`

- **type**: checklist
- **想定読者**: Dev / Review、副作用ゼロを担保したい全フェーズ移行時
- **章構成**:
  1. 対象範囲（既存 PRJ ソースコード / DB 行 / Vercel deploy / Supabase / git history）
  2. 検証手段（grep ベース確認、自動スクリプト `verify-zero-side-effect.sh`、git diff 全件レビュー）
  3. 通過基準（変更 0 行、deploy 0 件、新規ファイル不在）
  4. 失敗時の手順（即時 W0 進行 NoGo + 復旧手順）

### §3.8 K8: `anti-patterns/ANTI-NNN-multi-account-tos-bypass.md`（番号は PM 棚卸し結果、Q-Mkt-08 部分匿名化）

- **type**: anti-pattern
- **想定読者**: CEO / Marketing / Dev、再発防止、**社外参照可能（部分匿名化済み）**
- **公開ポリシー（Q-Mkt-08 採択）**: PRJ ID は `PRJ-XXX` 伏字、教訓は全面公開、商用 AI コーディング基盤の固有名詞は婉曲化
- **章構成**:
  1. アンチパターン名（multi-account でサブスク枠を水増し）
  2. 何が悪いか（**v2: 商用 AI サブスクリプションサービスの一般 ToS における多重アカウント禁止条項に該当濃厚、連鎖 BAN リスク**。具体的なベンダー名・条項番号は伏せ、原則のみ記述）
  3. 失敗したらどうなるか（業務メインアカウントの巻き添え BAN）
  4. 正しい代替（単一アカウント運用 + 4 層コスト上限 + extra usage 課金 CEO 決裁）
  5. **v2 追記章: 公開ポリシー**（本 anti-pattern は社外参照可能、ただし本書を引用する場合は PRJ ID 伏字版で参照すること、固有名詞露出時は Marketing → CEO 確認を経る）
  6. **v2 追記章: 教訓の全面公開原則**（事例化のために匿名化された PRJ ID `PRJ-XXX` を使用、教訓「multi-account 運用は商用サブスクの一般 ToS で禁止されているケースが多く、運用前にプラン規約を一次情報で確認するのが必須」「単一アカウント + 課金フォールバック + CEO 決裁の組み合わせが安全」を全面公開）

### §3.9 K9: `anti-patterns/ANTI-NNN-oauth-token-spawn-direct.md`（番号は PM 棚卸し結果、Q-Mkt-08 部分匿名化）

- **type**: anti-pattern
- **想定読者**: Dev / Review、**社外参照可能（部分匿名化済み）**
- **公開ポリシー（Q-Mkt-08 採択）**: PRJ ID は `PRJ-XXX` 伏字、教訓は全面公開、OAuth 経路詳細は実装レベル記述を避ける
- **章構成**:
  1. アンチパターン名（自律エージェントから OAuth トークンに直接到達させる）
  2. 何が悪いか（トークン漏洩 / silent revocation 検知不能 / 連鎖 BAN）
  3. 正しい代替（auth-detector が credentials.json を `stat()` のみ、env から `*secret*` を block、subprocess spawn のみで間接利用）
  4. **v2 追記章: 公開ポリシー**（本 anti-pattern は社外参照可能、ただし `silent_revoke` / `auth_failed` 等の具体シナリオ名やコード片は記載しない、原則のみ記述）
  5. **v2 追記章: 教訓の全面公開原則**（事例化のために匿名化された PRJ ID `PRJ-XXX` を使用、教訓「OAuth トークンは自律エージェントの権限境界外に置く」「stat ベースの存在確認のみ可、内容読取は不可」「env からの secret block-list を必須」を全面公開）

### §3.10 K10: `decisions-log/ADR-001-self-poc-harness-engineering.md`

- **type**: ADR（全社決定）
- **想定読者**: 全部署、自社 PoC 起案時の参照
- **章構成**:
  1. ステータス（Accepted / 2026-06-13 想定）
  2. 文脈（自社 PoC で商用 AI を直叩きする誘惑が強いが、ToS / BAN / コスト暴走の 3 リスクで致命的損失）
  3. 決定（自社 PoC では商用 AI を **直叩きせず**、harness 層 + mock 層を必ず挟む。9 必須コントロールを最低ライン）
  4. 結果（PRJ-019 でこの方針が機能、横展開時の標準）
  5. 関連 DEC（DEC-019-005 / 006 / 007 / 011 / 014、**DEC-019-026 / 027 / 028 / 029 = ポートフォリオ公開系**）

---

## §4. KPT 振り返りテンプレ（Phase 1 完了時、6/13 以降）

### §4.1 開催要領（v1 維持）

- **日時**: 2026-06-13 以降（Phase 1 完了 DEC 確定後 1〜3 営業日以内）
- **進行**: PM 主催、CEO / Dev / Research / Review / Marketing 全員参加
- **形式**: 90 分、Keep / Problem / Try の順、各 20 分 + 全体 30 分（決定事項整理）
- **成果物**: K1（`lessons-learned/prj-019-lessons-learned.md`）の母体

### §4.2 Keep 候補（事前ピン止め、ファシリ用、v2 で公開判断系を追記）

- harness 9→34 必須コントロールが**実装レベル**で機能した（67→83 テスト全緑、ペネトレ 45 試行 zero-bypass）
- 副作用ゼロ運用が **grep + 自動スクリプト**で担保された（既存 PRJ-001〜018 への変更 0 行）
- mock-first + TimeSource pattern で **Windows 上でも決定論的テスト**を確立
- 3 部署並列発注（Dev / Research / Review）が**想定通り並列着地**、PM の配分マトリクス機能
- 月次予算 $300 ハードキャップが**機能**、Vercel Hobby→Pro 段階移行で予算最適
- BAN drill #1 / #2 を**事前実施**することでインシデント対応を訓練
- 既存 PRJ への副作用ゼロ宣言を**自動化スクリプトで物理担保**
- **v2 追加: ポートフォリオ部分開示モード（80/50/100/概要）が事業方針「AI 感を出さない」と整合し、CEO 採択まで Q-Mkt 8 件を 2 日で確定**
- **v2 追加: K8/K9 anti-pattern を部分匿名化（PRJ ID 伏字 + 教訓全面公開）で社外参照可能化、ナレッジ資産の社外露出可能性を獲得**

### §4.3 Problem 候補（事前ピン止め、v1 維持 + 公開系追記）

- Claude Max **weekly cap 数値が公式非公開**、運用設計の難度が他より高い
- Open Claw 上流が **personal AI assistant に再ポジション**したため、本件マーケ位置と齟齬
- Vercel コスト想定が **W0-Week1 段階で上方修正**（$20→$46）が必要、初期見積の精度に課題
- Phase 0 の調査範囲（OP-1〜OP-5）の**情報源が刻々と動く**（Codex 2x ボーナス 5/31 終了 等）
- オーナー手番タスク（Spend Cap 設定 / Live test 立会）の**期限管理にバッファ少**
- **v2 追加: ポートフォリオ Q-Mkt 8 件の採択合意形成が CEO・Marketing 往復 2 回必要、初回起票時に CEO 推奨案併記の運用ルール（DEC-019 で標準化済み）が無ければさらに長引いた可能性**

### §4.4 Try 候補（Phase 2 / 次自社 PoC 向け、v2 で静観方針反映）

- cost_check skill を全自社プロジェクトに**横展開**（Sumi / Asagi 含む weekly cap 監視）
- ToS allowlist の**半年自動再評価フロー**（次回 2026-12 予定）
- 自社 PoC 起案テンプレを **K6 self-poc-startup-checklist** として標準化
- 副作用ゼロ自動検証スクリプトを **CI に組み込み**、PR 毎に自動 fail-fast
- BAN 取り下げ Runbook（`marketing-portfolio-takedown-runbook.md`）の事前ドキュメント化
- 今回獲得した 9 コントロール → 34 コントロールの**段階展開ロードマップ**を Phase 2 で完成
- **v2 追加: 静観方針（プレス NG / SNS X 1 投稿のみ）を次自社 PoC 起案時の自動適用ルール化、K6 起案チェックリストの「公開判断ブロック」（§3.6 v2 追記候補 5 項目）に格上げ**
- **v2 追加: 部分開示モード（harness 80% / org 50% / cost 100% / ToS 概要のみ）を汎用化、自社 PoC 公開時のデフォルト開示比率テンプレとして K4 / K5 playbook に取込**
- **v2 追加: K8/K9 部分匿名化方針（PRJ ID 伏字 + 教訓全面公開）を anti-pattern 全般のデフォルト公開ポリシーとして INDEX.md に追記**

### §4.5 KPT テンプレ（Markdown、v1 維持）

```markdown
# PRJ-019 Phase 1 完了 KPT 振り返り

- 日付: YYYY-MM-DD
- 参加者: CEO / PM / Dev / Research / Review / Marketing
- 関連レポート: `projects/PRJ-019/reports/ceo-phase1-completion.md`（仮）

## 1. 案件サマリー（実績数値）

| 項目 | 計画 | 実績 | 差分 |
|---|---|---|---|
| Phase 1 期間 | 4 週間 | {実績} | {} |
| テスト件数 | 60+ | {実績} | {} |
| 必須コントロール | 9（基盤）+ 25（拡張） | {実績} | {} |
| 月次予算 | $300 | {実績} | {} |
| 副作用 | 0 行 | {実績} | {} |
| BAN drill | 2 回（W0）+ 訓練 | {実績} | {} |
| 並走影響（Sumi/Asagi） | 維持 | {実績} | {} |
| ポートフォリオ公開（v2 追加） | 6/20 公開・SNS X 1 投稿 | {実績} | {} |

## 2. Keep（継続すべきこと）
- {1} 重要度 / 横展開先 / 関連 Pattern
- {2} ...

## 3. Problem（問題があったこと）
- {1} 重要度（CRITICAL/HIGH/MEDIUM/LOW）/ ステータス / 再発防止策
- {2} ...

## 4. Try（次の試行）
- {1} 適用先（Phase 2 / 次自社 PoC / 受託展開）/ 担当 / 期限
- {2} ...

## 5. 横展開判断
- patterns/ 昇格候補: {ファイル名}
- playbooks/ 昇格候補: {ファイル名}
- checklists/ 昇格候補: {ファイル名}
- anti-patterns/ 昇格候補: {ファイル名}（部分匿名化方針適用）
- decisions-log/ ADR 候補: {ファイル名}

## 6. 残課題と次アクション
- 担当 / 期限 / 関連 DEC
```

---

## §5. 既存 `organization/knowledge/` 構成と整合性チェック

### §5.1 既存構成（INDEX.md より、v1 維持）

- ルート直下: `INDEX.md` / `EXTRACTION-ROADMAP.md` / `desktop-app-development-guide.md` / `tech-research-hono-drizzle.md` 等
- サブディレクトリ: `lessons-learned/` / `patterns/` / `playbooks/` / `checklists/` / `domain-guides/` / `decisions-log/` / `anti-patterns/`
- v2 テンプレ: `organization/templates/lessons-learned-v2.md`（フロントマター必須）
- 半自動運用: 新規追加時に PM が INDEX.md 該当セクションを更新（GATE-K 通過条件）
- 半年棚卸し: 4 月末 / 10 月末
- 「2 回踏んだら lessons-learned、3 回踏んだら patterns/」ルール

### §5.2 整合性チェック（v2 では PATTERN 番号注記を強化）

| 観点 | 整合性 | 備考 |
|---|---|---|
| サブディレクトリ命名 | 整合 | K1〜K10 全て既存サブディレクトリのいずれかに配置可能 |
| ファイル命名規則 | 整合 | `prj-XXX-lessons-learned.md` / `PATTERN-NNN-{name}.md` / `ANTI-NNN-{name}.md` / `ADR-NNN-{name}.md` の既存パターンに準拠 |
| フロントマター | 整合 | lessons-learned v2 テンプレ準拠（type / project_id / domain_tags / tech_tags / quality_score 等） |
| domain_tags 揺れ | 要確認 | 「ai-orchestration」「harness-engineering」「self-poc」は新規タグ候補、INDEX.md §3「正規語彙ルール」に従い PM 承認後追加 |
| tech_tags | 整合 | typescript / pnpm / vitest / playwright / nextjs / vercel-sandbox 等は既存語彙 |
| INDEX.md 更新責任 | PM | Phase 1 完了時に PM が INDEX.md §0〜§4 を一括更新（K1〜K10 反映） |
| GATE-K 品質スコア | 未確定 | Phase 1 完了後に Review が付与（K1 は 4〜5、K10 は 5 想定、Marketing 視点では K2 / K3 / K6 が最も横展開価値高） |
| 既存 PATTERN-001〜005 との重複 | **PM 棚卸し待ち** | **K2 / K3 の番号（暫定 006/007）は EXTRACTION-ROADMAP Phase C 第1弾の PATTERN-003 / 004 / 005 起票進捗次第、5/8 検収会議で確定報告予定**（§X 参照） |
| 既存 ANTI-PATTERN との重複 | **PM 棚卸し待ち** | **K8 / K9 の番号（暫定 ANTI-001/002）も既存 anti-pattern 起票進捗次第、5/8 検収会議で確定報告予定** |
| EXTRACTION-ROADMAP との整合 | **PM 棚卸し待ち** | Phase C 第1弾 で起票中の PATTERN-003 / 004 / 005 と PATTERN-006 / 007 の番号衝突を事前回避（PM 5/8 確定） |
| K8/K9 公開ポリシー（v2 追加） | 整合 | Q-Mkt-08 採択により部分匿名化（PRJ ID 伏字 + 教訓全面公開）、INDEX.md §3「公開ポリシー欄」（仮）に追加検討 |

### §5.3 既存ナレッジへの参照追加（双方向リンク維持、v2 でファイル名更新）

PRJ-019 ナレッジ追加時に、以下既存ファイルにも逆参照を追加すべき:

- `organization/knowledge/INDEX.md` §0 / §1 / §2 / §3 / §4 すべて
- `organization/knowledge/patterns/ai-three-layer-guard.md`（既存、K2 の前駆として相互参照）
- `organization/knowledge/playbooks/ai-cost-management.md`（既存、K5 の隣接として相互参照）
- `organization/rules/project-setup-checklist.md`（K6 から参照、相互リンク）
- **v2 追加: `projects/PRJ-019/reports/marketing-portfolio-reflection-design-v2.md`**（ポートフォリオ側 v2、K1 / K4 / K8 / K9 / K10 から相互参照、特に §5 公開可能要素チェックリストとの双方向リンク）

---

## §6. Phase 1 進行中の中間記録ポイント（v1 維持）

Phase 1 完了を待たず、進行中に**中間記録**を取ることで Phase 1 完了時の KPT 抽出コストを下げる。

### §6.1 W2 終了時（2026-05-30 想定）

- **記録対象**:
  - W0 必須コントロール 23 項目の完成状況（残 G-V2-06 / G-V2-10 を除く 21 項目）
  - DEC-019-008 NG-3 暫定値（12h/日 / $1,000/月）の実運用ベースライン
  - BAN drill #1（5/13）+ #2（5/17）結果
  - cost_check skill / H-09 weekly cap 監視の実装状況
  - 副作用ゼロ確認（W0〜W2 累積）
- **記録先**:
  - `projects/PRJ-019/reports/marketing-knowledge-interim-w2.md`（**新規、Phase 1 W2 終了時に作成**）
  - 内容は K1 lessons-learned の章 4（Keep）と章 5（Problem）の**ドラフト 1 次素材**
- **責任**: Marketing が PM / Review からの中間レポートを集約

### §6.2 W4 終了時 = Phase 1 完了直前（2026-06-12 想定）

- **記録対象**:
  - 10 連続成功率（DoD 80% 目標）
  - 所要時間 < 60 min/件 達成率
  - コスト < $5/件 達成率
  - 副作用ゼロ最終確認（Phase 1 全期間累積）
  - HITL ゲート 6 種の発動回数 / 解決時間
  - 月次予算実績（$300 ハードキャップ達成）
  - **v2 追加: ポートフォリオ v2 最終締切（6/12）と同期、Marketing が中間記録 W4 と公開準備完了報告を 1 本化**
- **記録先**:
  - `projects/PRJ-019/reports/marketing-knowledge-interim-w4.md`（**新規、Phase 1 完了直前に作成**）
  - 内容は K1 lessons-learned 章 3（実績数値表）の**確定値**を提供
- **責任**: Marketing が CEO 連結報告に同期

### §6.3 中間記録テンプレ（共通、v1 維持）

```markdown
# PRJ-019 ナレッジ中間記録 — {W2 / W4} 終了時点

- 起票: Marketing
- 期間: {YYYY-MM-DD 〜 YYYY-MM-DD}
- 関連レポート: {CEO 連結報告 / Dev / Research / Review 各部署レポート}

## 1. 数値スナップショット
| 項目 | この期間実績 | 累積 |
|---|---|---|
| ... | ... | ... |

## 2. Keep 候補（速報、Phase 1 完了 KPT で再評価）
- ...

## 3. Problem 候補（速報、CRITICAL/HIGH のみ即時起票）
- ...

## 4. Try（W{2/4 → 次期間} で実施する改善事項）
- ...

## 5. 既存ナレッジへの差分（半年棚卸し前倒し対象）
- ...
```

---

## §X. PATTERN 番号棚卸し注記 + ナレッジ最終締切（v2 新設）

### X.1 PATTERN 番号 / ANTI 番号の棚卸し注記（Q-Mkt-01 採択）

Q-Mkt-01「PATTERN 番号は PM 棚卸し結果に従う」採択により、本書の K2 / K3 / K8 / K9 のファイル名番号は **暫定値**として記載し、PM 棚卸し結果による確定を待つ運用とする。具体的には以下の通り。

| 候補 | 暫定番号 | 衝突時スライド先 | 確定時期 |
|---|---|---|---|
| K2 harness-permission-boundary | **PATTERN-006**（暫定） | 既存 PATTERN-003/004/005 と衝突する場合は **PATTERN-008** へスライド | **5/8 検収会議で PM が確定報告** |
| K3 mock-first-timesource | **PATTERN-007**（暫定） | 同上、衝突時は **PATTERN-009** へスライド | 同上 |
| K8 multi-account-tos-bypass | **ANTI-001**（暫定） | 既存 ANTI-PATTERN と衝突時は **ANTI-003** へスライド | 同上 |
| K9 oauth-token-spawn-direct | **ANTI-002**（暫定） | 同上、衝突時は **ANTI-004** へスライド | 同上 |

**5/8 検収会議の議題**:
- PM が `organization/knowledge/EXTRACTION-ROADMAP.md` の Phase C 第1弾の起票進捗（PATTERN-003 / 004 / 005 など）を棚卸し
- 既存 anti-patterns/ ディレクトリの ANTI-XXX 番号を棚卸し
- 衝突有無を確定し、本 v2 §2 表のファイル名（`PATTERN-NNN-...md` / `ANTI-NNN-...md` 表記）を確定値に置換する DEC を起票
- 確定 DEC 番号は v2.1 改訂時に本書 §X.1 表の「確定時期」列を更新

**衝突回避ルール**: PM 棚卸しで番号衝突が確認された場合、**Marketing は単独判断せず**、PM 主管で番号スライドを実行する。Marketing は本書 §2 / §3 のファイル名を §X.1 表の「衝突時スライド先」に従って一括置換するのみ。

### X.2 ナレッジ最終締切（社内 6/12 / 公開ファイル参照可能 6/20）

ポートフォリオ v2 の M3 最終締切（6/12）と同期し、ナレッジ側の社内ドラフト着地を以下マイルストーンで管理する。

| マイルストーン | 日付 | 成果物 | レビュー / 承認 |
|---|---|---|---|
| **N1 着手宣言** | 2026-05-04（月） | 本 v2 を `decisions.md` に DEC-019-031 として登録、PM 棚卸し（Q-Mkt-01 PATTERN 番号）依頼 | CEO 承認、PM ack |
| **N2 PATTERN 番号確定** | **2026-05-08（金）** | PM 棚卸し結果報告、§X.1 表を確定値に置換、v2.1 改訂 | PM 主管、CEO ack |
| **N3 中間記録 W2** | 2026-05-30（土） | `marketing-knowledge-interim-w2.md` 起票（§6.1） | Marketing 単独 |
| **N4 中間記録 W4 + 社内ドラフト着地** | **2026-06-12（金）** | `marketing-knowledge-interim-w4.md` 起票、K1 lessons-learned ドラフト v0.5、K10 ADR ドラフト v0.5 を社内向けに着地（公開はしない） | Review 一次チェック、CEO 中間確認 |
| **N5 Phase 1 完了 KPT** | **2026-06-13（土）以降 1〜3 営業日** | KPT 90 分（§4.1）、K1 完成、K10 ADR Accepted、K8/K9 部分匿名化版完成（§3.8 / §3.9 に従う） | PM 主催、全部署参加 |
| **N6 ポートフォリオ公開と同期** | **2026-06-20（土）朝** | K8 / K9 anti-pattern を社外参照可能ファイルとして INDEX.md に登録、ポートフォリオ v2 公開と同時にナレッジ側も「参照可能」状態に | Marketing → CEO に事後報告 |
| **N7 GATE-K 品質スコア確定** | 2026-06-27（土） | Review が K1〜K10 に GATE-K スコア付与、半年棚卸し（2026-10 月末）までの再評価対象を確定 | Review 主管、CEO ack |

### X.3 6/12 ナレッジ社内ドラフト最終チェックリスト（N4）

- [ ] K1 lessons-learned ドラフト v0.5（§3.1 章構成全 7 章を 70% 以上埋める）
- [ ] K10 ADR ドラフト v0.5（§3.10 章構成全 5 章、Accepted ステータスは KPT 後に確定）
- [ ] K2 / K3 PATTERN 暫定番号は §X.1 表に従う、5/8 確定値で固定済み
- [ ] K8 / K9 ANTI 暫定番号は §X.1 表に従う、5/8 確定値で固定済み
- [ ] K8 / K9 部分匿名化方針（PRJ ID `PRJ-XXX` 伏字 + 教訓全面公開）が §3.8 / §3.9 章構成 4-5 章に明記
- [ ] K4 / K5 playbook ドラフト v0.3（章構成 1-7 を骨子レベルで起票、特に v2 追記章「公開資料連携」「数値開示の階層」を含む）
- [ ] K6 / K7 checklist ドラフト v0.3（K6 の v2 追記候補「公開判断ブロック 5 項目」を組み込み）
- [ ] §5.3 双方向リンク：ポートフォリオ v2 への参照、`ai-three-layer-guard.md` / `ai-cost-management.md` / `project-setup-checklist.md` への参照を全 K で確認
- [ ] §4.4 Try 候補に「静観方針自動適用」「部分開示モード汎用化」「K8/K9 部分匿名化方針の anti-pattern 全般デフォルト化」が明記
- [ ] CEO 中間確認 + Review 一次チェックの二重サイン

### X.4 リスクと緩衝策

| リスク | 発生時期 | 緩衝策 |
|---|---|---|
| 5/8 PM 棚卸しで PATTERN 番号衝突確定 | 5/8 | §X.1 表の「衝突時スライド先」（008/009 / ANTI-003/004）に Marketing が一括置換、v2.1 改訂を 5/9 までに完了 |
| Phase 1 副作用ゼロ破れで KPT 内容大幅変更 | 6/13 | K1 章 5（Problem）の比重を増やし、K10 ADR を「Rejected」または「Superseded」ステータスに変更 |
| K8/K9 部分匿名化が Review 二次チェックで NG | N4 / N5 | 社内限定公開に降格、INDEX.md 登録時に「社内限定」フラグ付与、ポートフォリオ v2 §6 公開判断と整合 |
| GATE-K 品質スコア低 | N7 | 半年棚卸し（2026-10）まで再評価延期、Phase 2 進捗で内容拡充後に再採点 |

---

## §7. CEO に判断を仰ぐ事項（採択済 2 件は完了マーク、残 4 件 + 新規 1 件）

Q-Mkt 採択により v1 §7 の 6 件のうち 2 件は確定済み、PATTERN 番号は PM 棚卸し（5/8）に降格、新規 1 件追加。

| # | 項目 | v1 ステータス | v2 ステータス |
|---|---|---|---|
| 1 | K1〜K10 の優先順位（Marketing 推奨は K1 / K2 / K6 / K10 最優先）が適切か | 要決裁 | **完了：採択（Q-Mkt 採択結果に内包、優先度維持）** |
| 2 | PATTERN-006 / 007 の番号が EXTRACTION-ROADMAP の起票中 PATTERN-003 / 004 / 005 と衝突しないか PM に事前確認させる必要あり | 要決裁 | **降格：5/8 検収会議で PM が棚卸し報告（Q-Mkt-01 採択により Marketing 単独判断不可）** |
| 3 | 新規 domain_tags（ai-orchestration / harness-engineering / self-poc）の追加可否 | 要決裁 | **未決裁（残課題 1）**：PM が INDEX.md §3「正規語彙ルール」に従い 5/8 検収会議で同時棚卸し提案 |
| 4 | 中間記録 W2 / W4 の Marketing 担当範囲（CEO 連結報告との重複回避） | 要決裁 | **未決裁（残課題 2）**：N3 / N4 のスコープを CEO に確認、5/26 ポートフォリオ M2 中間レビューと同時調整 |
| 5 | K8 / K9 anti-patterns 公開範囲（社外共有時にも安全か、社内限定のみか） | 要決裁 | **完了：Q-Mkt-08 採択により部分匿名化（PRJ ID 伏字 + 教訓全面公開）で社外参照可能に確定** |
| 6 | GATE-K 品質スコアを Phase 1 完了後すぐ付与するか、半年棚卸しで確定するか | 要決裁 | **未決裁（残課題 3）**：N7（6/27）で Review が一次付与、半年棚卸し（10 月末）で再採点の二段階運用を提案 |
| 7 | **【v2 新規】** 横断 ToS allowlist 自動再評価フロー（K4 playbook §2 標準プロセス ④）の起票時期と担当 | — | **未決裁（残課題 4）**：次回再評価日 2026-12 を見据え、Phase 2 開始前または N5 KPT 直後に CEO 決裁を提案 |

---

**v2 作成**: 2026-05-03 ／ **次回更新**: 5/8 PM 棚卸し結果反映時（v2.1）または N3 中間記録 W2（5/30）または Phase 1 完了 KPT（6/13 以降）
**v1 → v2 改訂責任**: Marketing 部門 ／ **採択根拠**: `ceo-q-mkt-01-08-formal-adoption-2026-05-03.md` + DEC-019-026 / 027 / 028 / 029
**ポートフォリオ v2 との同期**: `marketing-portfolio-reflection-design-v2.md` §6.1 / §X 全章と双方向参照、6/12 ナレッジ最終締切 + 6/20 公開と整合
