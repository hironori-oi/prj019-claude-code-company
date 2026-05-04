# PRJ-019 Clawbridge — 社内ナレッジ反映 事前設計

- 案件: PRJ-019 Clawbridge（Open Claw を自律オーナーとする AI 組織ハーネス基盤、自社 PoC 案件）
- 起票: Marketing 部門
- 作成日: 2026-05-03
- 対象タイミング: Phase 1 進行中の中間記録 + Phase 1 完了（2026-06-13 予定）後の本格反映
- 関連レポート: `projects/PRJ-019/reports/ceo-w0-week1-consolidation.md` / `projects/PRJ-019/decisions.md` / `organization/knowledge/INDEX.md` / `organization/templates/lessons-learned-v2.md`
- ステータス: **設計のみ**（実ナレッジファイルの作成は Phase 1 完了後の別タスク）

---

## §1. ナレッジ蓄積方針（200 字）

PRJ-019 は自社 PoC かつ ToS 解釈・BAN リスクを能動的に承認した特殊性を持つため、**「次の自社 PoC で再利用可能か」**を判定基準にナレッジ抽出を行う。具体的には ① harness engineering の 9→34 必須コントロール対は他案件にも展開可能なパターン候補、② mock-first + TimeSource pattern は Web/モバイル受託でも転用可能な playbook 候補、③ ToS 順守と BAN リスク管理は「自社 PoC 起案チェックリスト」として checklist 化、の 3 系統に整理する。一方で Open Claw 固有 / OAuth 経路 / 特定 cap 数値などサービス側で陳腐化しやすい知見は lessons-learned 側に閉じ込め、半年棚卸しで再評価する。既存 INDEX.md 構造（lessons-learned / patterns / playbooks / checklists / domain-guides / anti-patterns）に整合する形で配置し、Phase 1 完了後に CEO + PM + Review が GATE-K で品質スコア確定する。

---

## §2. ナレッジファイル候補一覧（5〜10 件）

提案。**実ファイル作成は Phase 1 完了後**、本書はファイル名候補と 1 行サマリのみ。

| # | 配置先 | ファイル名（仮） | type | 1 行サマリ |
|---|---|---|---|---|
| K1 | `lessons-learned/` | `prj-019-lessons-learned.md` | lessons-learned | PRJ-019 全体の KPT 振り返り。3 大キーワード（人間不在 / Codex サブスク / harness engineering）に対する実検証結果と、BAN リスク受容下での運用記録 |
| K2 | `patterns/` | `PATTERN-006-harness-permission-boundary.md` | pattern | 自律 / 半自律エージェントに権限を渡す前に「MUST / MUST-NOT 対」で書き切るパターン。9→34 必須コントロールの抽象化版を Web/モバイル/受託全般へ展開 |
| K3 | `patterns/` | `PATTERN-007-mock-first-timesource.md` | pattern | 実通信を伴うテストを先にモック層で同型再現し、本番ループに統合検証を 1 度だけ通す pattern。TimeSource 注入で libfaketime 代替 |
| K4 | `playbooks/` | `tos-compliant-ai-subscription-runbook.md` | playbook | 商用 AI サブスクリプションを業務利用する際の ToS 解釈プロセス（一次情報取得 → CEO 一次解釈 → Review 二次評価 → 半年再評価）の手順書。固有名詞は婉曲化 |
| K5 | `playbooks/` | `multi-project-budget-cap-orchestration.md` | playbook | 複数案件並走時の月次予算ハードキャップ運用（$300 例）と、超過時の自動停止 / フォールバック切替 / weekly cap 監視の設計手順 |
| K6 | `checklists/` | `self-poc-startup-checklist.md` | checklist | 自社 PoC を起案する際の **着手前チェック 25 項目**（BAN リスク評価 / 副作用ゼロ計画 / 月次予算上限 / 撤退条件 等）。`organization/rules/project-setup-checklist.md` の補完版 |
| K7 | `checklists/` | `zero-side-effect-verification-checklist.md` | checklist | 既存案件への副作用ゼロを担保するための grep + 自動スクリプト + git history 確認の verification checklist |
| K8 | `anti-patterns/` | `ANTI-001-multi-account-tos-bypass.md` | anti-pattern | サブスク使用枠を multi-account で水増しする行為が ToS 違反濃厚であることを記録。NG-2 連鎖 BAN リスクの一般化版 |
| K9 | `anti-patterns/` | `ANTI-002-oauth-token-spawn-direct.md` | anti-pattern | 自律エージェントから OAuth トークンに直接到達させる経路の危険性。env allow-list / FS 隔離の必要性を一般化 |
| K10 | `decisions-log/` | `ADR-001-self-poc-harness-engineering.md` | adr | PRJ-019 で確立した「自社 PoC では商用 AI を直叩きせず、harness 層を必ず挟む」全社方針。今後の自社 PoC 起案時に参照 |

**Marketing からの推奨優先度**: K1 / K2 / K6 / K10 を**最優先**（横展開価値が最も高い）、K3 / K5 / K7 を**第二優先**（受託案件にも応用可能）、K4 / K8 / K9 は**第三優先**（半年棚卸しで陳腐化しやすい知見、定期再評価前提）。

---

## §3. 各ナレッジファイルの outline（タイトル / 想定読者 / 章構成）

### §3.1 K1: `lessons-learned/prj-019-lessons-learned.md`

- **type**: lessons-learned（`organization/templates/lessons-learned-v2.md` 準拠）
- **想定読者**: PM / CEO / Review / Marketing（次の自社 PoC を起案する自分自身）
- **章構成**:
  1. プロジェクト概要（自社 PoC、4 週間 + 準備 2 週間、月 $300、3 案件並走）
  2. TL;DR（5 行以内、harness 9→34 / mock-first / 副作用ゼロ / BAN drill 2 回 / 月予算内完遂）
  3. 案件サマリー（実績数値、テスト 83 / コントロール 9 → 34 / 月次予算 $300 / 副作用 0 行）
  4. Keep（harness 設計の MUST/MUST-NOT 対、TimeSource pattern、mock-claude 5 シナリオ、副作用ゼロ自動検証スクリプト、3 部署並列発注の運用、BAN drill リハーサル）
  5. Problem（BAN drill で発見された欠陥、weekly cap 数値非公開での運用設計の難しさ、Open Claw 上流再ポジションでマーケ齟齬、Vercel コスト想定の上方修正必要）
  6. Try（Phase 2 改善事項、cost_check skill 拡張、ToS allowlist 半年再評価フロー、自社 PoC 起案テンプレ化）
  7. 関連 ADR / Pattern / Playbook（K2 / K3 / K4 / K10 への参照）

### §3.2 K2: `patterns/PATTERN-006-harness-permission-boundary.md`

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

### §3.3 K3: `patterns/PATTERN-007-mock-first-timesource.md`

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

### §3.5 K5: `playbooks/multi-project-budget-cap-orchestration.md`

- **type**: playbook
- **想定読者**: PM / CEO、複数案件並走時のリソース管理
- **章構成**:
  1. 背景（個人 / 小規模組織での同時並走では予算 / cap が共有プールになる）
  2. 標準フロー（① 月次ハードキャップ確定 → ② 案件別配分マトリクス → ③ 5h cap / weekly cap 監視 → ④ 80% / 95% でアラート / 自動 pause）
  3. データソース（Console scrape / CLI usage コマンド / 自社 cost_check skill）
  4. フォールバック設計（API キー従量フォールバックの 1 行 env 切替、優先案件の確保ルール）
  5. 月次予算 $300 ケーススタディ（PRJ-019 + Sumi + Asagi の配分事例、固有名詞・閾値は婉曲化）
  6. extra usage 課金の判断ルール（CEO 決裁必須）

### §3.6 K6: `checklists/self-poc-startup-checklist.md`

- **type**: checklist
- **想定読者**: CEO / PM / Marketing、自社 PoC を起案する全タイミング
- **章構成**: 25 項目チェック
  - **着手前 10 項目**: 3 大キーワード明文化 / 月次予算ハードキャップ / BAN リスク評価 / 副作用ゼロ計画 / 撤退条件 / ToS 一次情報取得 / アーキテクチャ案 3 種比較 / 既存案件への影響評価 / Owner 残タスク列挙 / DEC 起票
  - **W0 着手 8 項目**: harness 必須コントロール選定 / mock-claude 整備 / TimeSource 拡張 / BAN drill シナリオ / Spend Cap 設定 / OAuth 隔離 / 使用量モニタリング / バックアップ手順
  - **Phase 1 進行中 7 項目**: 副作用ゼロ自動検証 / 週次 KPT / weekly cap 監視 / Vercel 昇格判断 / HITL 通知整備 / インシデント対応訓練 / Phase 2 Go/NoGo 判定材料蓄積

### §3.7 K7: `checklists/zero-side-effect-verification-checklist.md`

- **type**: checklist
- **想定読者**: Dev / Review、副作用ゼロを担保したい全フェーズ移行時
- **章構成**:
  1. 対象範囲（既存 PRJ ソースコード / DB 行 / Vercel deploy / Supabase / git history）
  2. 検証手段（grep ベース確認、自動スクリプト `verify-zero-side-effect.sh`、git diff 全件レビュー）
  3. 通過基準（変更 0 行、deploy 0 件、新規ファイル不在）
  4. 失敗時の手順（即時 W0 進行 NoGo + 復旧手順）

### §3.8 K8: `anti-patterns/ANTI-001-multi-account-tos-bypass.md`

- **type**: anti-pattern
- **想定読者**: CEO / Marketing / Dev、再発防止
- **章構成**:
  1. アンチパターン名（multi-account でサブスク枠を水増し）
  2. 何が悪いか（OpenAI Service Terms §3.3(h)(i) / Anthropic 一般 ToS の多重アカウント禁止条項に該当濃厚、連鎖 BAN リスク）
  3. 失敗したらどうなるか（業務メインアカウントの巻き添え BAN）
  4. 正しい代替（単一アカウント運用 + 4 層コスト上限 + extra usage 課金 CEO 決裁）

### §3.9 K9: `anti-patterns/ANTI-002-oauth-token-spawn-direct.md`

- **type**: anti-pattern
- **想定読者**: Dev / Review
- **章構成**:
  1. アンチパターン名（自律エージェントから OAuth トークンに直接到達させる）
  2. 何が悪いか（トークン漏洩 / silent revocation 検知不能 / 連鎖 BAN）
  3. 正しい代替（auth-detector が credentials.json を `stat()` のみ、env から `*secret*` を block、subprocess spawn のみで間接利用）

### §3.10 K10: `decisions-log/ADR-001-self-poc-harness-engineering.md`

- **type**: ADR（全社決定）
- **想定読者**: 全部署、自社 PoC 起案時の参照
- **章構成**:
  1. ステータス（Accepted / 2026-06-13 想定）
  2. 文脈（自社 PoC で商用 AI を直叩きする誘惑が強いが、ToS / BAN / コスト暴走の 3 リスクで致命的損失）
  3. 決定（自社 PoC では商用 AI を **直叩きせず**、harness 層 + mock 層を必ず挟む。9 必須コントロールを最低ライン）
  4. 結果（PRJ-019 でこの方針が機能、横展開時の標準）
  5. 関連 DEC（DEC-019-005 / 006 / 007 / 011 / 014）

---

## §4. KPT 振り返りテンプレ（Phase 1 完了時、6/13 以降）

### §4.1 開催要領

- **日時**: 2026-06-13 以降（Phase 1 完了 DEC 確定後 1〜3 営業日以内）
- **進行**: PM 主催、CEO / Dev / Research / Review / Marketing 全員参加
- **形式**: 90 分、Keep / Problem / Try の順、各 20 分 + 全体 30 分（決定事項整理）
- **成果物**: K1（`lessons-learned/prj-019-lessons-learned.md`）の母体

### §4.2 Keep 候補（事前ピン止め、ファシリ用）

- harness 9→34 必須コントロールが**実装レベル**で機能した（67→83 テスト全緑、ペネトレ 45 試行 zero-bypass）
- 副作用ゼロ運用が **grep + 自動スクリプト**で担保された（既存 PRJ-001〜018 への変更 0 行）
- mock-first + TimeSource pattern で **Windows 上でも決定論的テスト**を確立
- 3 部署並列発注（Dev / Research / Review）が**想定通り並列着地**、PM の配分マトリクス機能
- 月次予算 $300 ハードキャップが**機能**、Vercel Hobby→Pro 段階移行で予算最適
- BAN drill #1 / #2 を**事前実施**することでインシデント対応を訓練
- 既存 PRJ への副作用ゼロ宣言を**自動化スクリプトで物理担保**

### §4.3 Problem 候補（事前ピン止め）

- Claude Max **weekly cap 数値が公式非公開**、運用設計の難度が他より高い
- Open Claw 上流が **personal AI assistant に再ポジション**したため、本件マーケ位置と齟齬
- Vercel コスト想定が **W0-Week1 段階で上方修正**（$20→$46）が必要、初期見積の精度に課題
- Phase 0 の調査範囲（OP-1〜OP-5）の**情報源が刻々と動く**（Codex 2x ボーナス 5/31 終了 等）
- オーナー手番タスク（Spend Cap 設定 / Live test 立会）の**期限管理にバッファ少**

### §4.4 Try 候補（Phase 2 / 次自社 PoC 向け）

- cost_check skill を全自社プロジェクトに**横展開**（Sumi / Asagi 含む weekly cap 監視）
- ToS allowlist の**半年自動再評価フロー**（次回 2026-12 予定）
- 自社 PoC 起案テンプレを **K6 self-poc-startup-checklist** として標準化
- 副作用ゼロ自動検証スクリプトを **CI に組み込み**、PR 毎に自動 fail-fast
- BAN 取り下げ Runbook（`marketing-portfolio-takedown-runbook.md`）の事前ドキュメント化
- 今回獲得した 9 コントロール → 34 コントロールの**段階展開ロードマップ**を Phase 2 で完成

### §4.5 KPT テンプレ（Markdown）

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
- anti-patterns/ 昇格候補: {ファイル名}
- decisions-log/ ADR 候補: {ファイル名}

## 6. 残課題と次アクション
- 担当 / 期限 / 関連 DEC
```

---

## §5. 既存 `organization/knowledge/` 構成と整合性チェック

### §5.1 既存構成（INDEX.md より）

- ルート直下: `INDEX.md` / `EXTRACTION-ROADMAP.md` / `desktop-app-development-guide.md` / `tech-research-hono-drizzle.md` 等
- サブディレクトリ: `lessons-learned/` / `patterns/` / `playbooks/` / `checklists/` / `domain-guides/` / `decisions-log/` / `anti-patterns/`
- v2 テンプレ: `organization/templates/lessons-learned-v2.md`（フロントマター必須）
- 半自動運用: 新規追加時に PM が INDEX.md 該当セクションを更新（GATE-K 通過条件）
- 半年棚卸し: 4 月末 / 10 月末
- 「2 回踏んだら lessons-learned、3 回踏んだら patterns/」ルール

### §5.2 整合性チェック

| 観点 | 整合性 | 備考 |
|---|---|---|
| サブディレクトリ命名 | 整合 | K1〜K10 全て既存サブディレクトリのいずれかに配置可能 |
| ファイル命名規則 | 整合 | `prj-XXX-lessons-learned.md` / `PATTERN-NNN-{name}.md` / `ANTI-NNN-{name}.md` / `ADR-NNN-{name}.md` の既存パターンに準拠 |
| フロントマター | 整合 | lessons-learned v2 テンプレ準拠（type / project_id / domain_tags / tech_tags / quality_score 等） |
| domain_tags 揺れ | 要確認 | 「ai-orchestration」「harness-engineering」「self-poc」は新規タグ候補、INDEX.md §3「正規語彙ルール」に従い PM 承認後追加 |
| tech_tags | 整合 | typescript / pnpm / vitest / playwright / nextjs / vercel-sandbox 等は既存語彙 |
| INDEX.md 更新責任 | PM | Phase 1 完了時に PM が INDEX.md §0〜§4 を一括更新（K1〜K10 反映） |
| GATE-K 品質スコア | 未確定 | Phase 1 完了後に Review が付与（K1 は 4〜5、K10 は 5 想定、Marketing 視点では K2 / K3 / K6 が最も横展開価値高） |
| 既存 PATTERN-001〜005 との重複 | 整合 | K2（PATTERN-006）は既存 `ai-three-layer-guard.md`（PATTERN-002 隣接）の上位概念として位置付け、PM が階層整理 |
| EXTRACTION-ROADMAP との整合 | 要確認 | Phase C 第1弾 で起票中の PATTERN-003 / 004 / 005 と PATTERN-006 / 007 の番号衝突を事前回避（PM 調整） |

### §5.3 既存ナレッジへの参照追加（双方向リンク維持）

PRJ-019 ナレッジ追加時に、以下既存ファイルにも逆参照を追加すべき:

- `organization/knowledge/INDEX.md` §0 / §1 / §2 / §3 / §4 すべて
- `organization/knowledge/patterns/ai-three-layer-guard.md`（既存、K2 の前駆として相互参照）
- `organization/knowledge/playbooks/ai-cost-management.md`（既存、K5 の隣接として相互参照）
- `organization/rules/project-setup-checklist.md`（K6 から参照、相互リンク）

---

## §6. Phase 1 進行中の中間記録ポイント

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
- **記録先**:
  - `projects/PRJ-019/reports/marketing-knowledge-interim-w4.md`（**新規、Phase 1 完了直前に作成**）
  - 内容は K1 lessons-learned 章 3（実績数値表）の**確定値**を提供
- **責任**: Marketing が CEO 連結報告に同期

### §6.3 中間記録テンプレ（共通）

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

## §7. CEO に判断を仰ぐ事項

1. **K1〜K10 の優先順位**（Marketing 推奨は K1 / K2 / K6 / K10 最優先）が適切か
2. **PATTERN-006 / 007 の番号**が EXTRACTION-ROADMAP の起票中 PATTERN-003 / 004 / 005 と衝突しないか PM に事前確認させる必要あり
3. **新規 domain_tags**（ai-orchestration / harness-engineering / self-poc）の追加可否
4. **中間記録 W2 / W4** の Marketing 担当範囲（CEO 連結報告との重複回避）
5. **K8 / K9 anti-patterns 公開範囲**（社外共有時にも安全か、社内限定のみか）
6. **GATE-K 品質スコア**を Phase 1 完了後すぐ付与するか、半年棚卸しで確定するか

---

**v1 作成**: 2026-05-03 ／ **次回更新**: Phase 1 W2 終了時（中間記録 §6.1 着手）または Phase 1 完了時（KPT 振り返り §4 実施）
