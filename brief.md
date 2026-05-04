# PRJ-019: Clawbridge（仮称） — Open Claw を自律オーナーとする AI 組織ハーネス基盤

## 基本情報

| 項目 | 内容 |
|---|---|
| 案件ID | PRJ-019 |
| 案件名（仮） | **Clawbridge（仮称）** — Open Claw を自律オーナーとする AI 組織ハーネス基盤 |
| クライアント | 自社（個人開発、オーナー本人 dogfooding 前提） |
| 受付日 | 2026-05-02 |
| 起案日 | 2026-05-02 |
| 希望納期 | Phase 0（徹底調査・要件整理）= 2 週間目安、実装着手は別決裁（DEC-019-XXX） |
| 予算感 | Phase 0 は調査主体・実装コストなし。Phase 1 以降の実装可否は調査結果を踏まえて再決裁 |
| Phase | **Phase 0（調査・要件整理）** — 起案直後 |
| 担当 | オーナー本人 ／ CEO 統括 ／ 秘書（登録） ／ リサーチ（主担当：徹底調査） ／ PM（要件整理） ／ レビュー（セキュリティリスク評価） |
| 主 OS | Windows 11 primary（オーナー実機）、Codex / Open Claw のホスト OS は調査で確定 |
| 兄弟案件 | **PRJ-012「Sumi（墨）」** = Claude Code 特化 IDE ／ **PRJ-018「Asagi（浅葱）」** = Codex マルチプロジェクト IDE（人間が操作する GUI） |

---

## 案件概要

### 背景・課題

オーナーは ChatGPT Codex x5 サブスクプランを契約済で、本組織 `claude-code-company`（Claude Code ベースの AI 組織運営システム）も既に運用中である。両者は現在「人間（オーナー）が CEO に指示を出す」ことで動作する半自動構造に留まる。

一方、Open Claw（https://clawbro.ai/ja）は「Codex 系エージェントをサブスクで動かし、自律的にタスクを進める」コンセプトを謳っている（正体・API 公開状況・ToS は本案件の調査スコープ）。これを **オーナー位置に据え** 、claude-code-company 組織を「AI が AI を運営する」構造に拡張したい。

### 目的・ゴール

- **Open Claw を自律オーナーとして claude-code-company 組織に指示を出させ、Web アプリ開発を完全自動化する運用基盤（= ハーネス基盤）を確立する**
- Phase 0 では **「徹底調査と要件整理」** に集中し、実装着手は調査完了後の DEC-019-XXX で別途判断する
- 安全性（権限境界・損失防止・ToS 遵守）を最優先に、実装可否そのものを Phase 0 で評価する

### ターゲットユーザー

- **本案件の唯一のユーザーはオーナー本人**（Phase 0〜1 は完全 dogfooding）
- 将来的な配布・SaaS 化は本案件のスコープ外（必要なら別案件として起案）

---

## 3 大キーワード（必読・最重要）

本案件の本質は以下 3 キーワードで定義される。brief / decisions / tasks / risks 全てで一貫して扱う。

### 1. Owner-in-the-loop 自動化（DEC-019-033 で改訂、2026-05-03）

- **本キーワードは 2026-05-03 オーナー指示「開発スタートのキックはオーナー許可必須、Open Claw は Claude Code に指示してアプリ概要・効果を提案させる」を受けて、従来の「人間不在の完全自動化」から「Owner-in-the-loop 自動化」へ正式変更（DEC-019-033）**
- **2 段階モデル**: 「世の中のニーズ抽出 → **アプリ提案生成（Open Claw → Claude Code 指示）** → **オーナー承認（HITL 第 9 種 `dev_kickoff_approval`、SLA 72h、default reject）** → 開発キック → 実装 → preview deploy → 完了通知」
- **数値目標**: 提案生成 < 60min/件 + Owner 承認待ち + 実装 < 60min/件、提案承認率 ≥ 30%（自然棄却含む）+ 承認後実装成功率 ≥ 80%
- **透明性**: Open Claw の行動・思考・中間出力・コスト消費・HITL 滞留・提案待ち件数を **透明性ダッシュボード**（PRJ-020 ClawDialog 内 `/dashboard`）で可視化、Owner はリアルタイム監視可能
- **権限制御**: **Open Claw 権限管理 UI**（7 カテゴリ × 細粒度設定）で Owner が随時調整可能、kill switch で即時全停止、policy 変更は Owner のみ可能（priviledge escalation 物理防止）
- 失敗時の縮退・自動復旧・人間エスカレーションのトリガ条件を全て Phase 0 設計時に確定済（DEC-019-007 / DEC-019-018 / DEC-019-022 / DEC-019-033）
- **「Owner が承認するから安全」「Open Claw の行動が全て透明」「権限を Owner が細粒度で制御できる」状態が Full Win**
- 法令整合性: EU AI Act Article 14（human oversight）/ 日本 AI 事業者ガイドライン / NIST AI RMF / ISO/IEC 42001 と完全整合（Marketing 訴求材料化）

### 2. Codex サブスクで動く Open Claw

- オーナーは ChatGPT Codex x5 サブスクを契約済（PRJ-018 と共有）
- Open Claw は Codex API ではなく **「ChatGPT Codex サブスクプラン経由で動作」** することを前提とする（API Key 直接購入のコスト暴走を回避）
- ただし Open Claw が実際にサブスクプランで動作する仕様か、ToS が自動化エージェント利用を許容するかは Phase 0 調査の核心スコープ

### 3. ハーネスエンジニアリング

- 自律エージェントに「無制限のシェル権限」を渡すと、コード漏洩 / 第三者サービス改変 / 金銭損失 のリスクが致命的に跳ねる
- 本案件は **Open Claw に与える権限・操作可能範囲・通信経路・ロールバック手段を厳密に設計する「ハーネスエンジニアリング」** が成果物の中心
- 「自律」と「権限境界」を両立させる設計こそが Phase 0 の deliverable

---

## 構造定義（PRJ-018 との対比で明確化）

| 軸 | PRJ-018 Asagi | PRJ-019 Clawbridge（本件） |
|---|---|---|
| 主体 | 人間（オーナー本人） | **Open Claw**（自律 AI エージェント） |
| 操作対象 | Codex（人間 → Codex） | claude-code-company 組織（Open Claw → CEO → 各部署 AI） |
| 形態 | デスクトップ IDE（GUI アプリ） | **運用基盤・ハーネス**（アプリ実体ではない） |
| 配布対象 | 日本語話者の素人開発者 + オーナー | オーナー本人のみ（dogfooding） |
| 配布物 | Tauri アプリ（MSI/DMG/AppImage） | 設定ファイル / スクリプト / ポリシー文書 / 監査ログ基盤 |
| 主成果物 | UI コンポーネント・チャット機能 | 権限境界設計 / 自動化スクリプト / リスク監査基盤 / 撤退条件 |

**重要**: 本案件は **アプリではなく運用基盤**。`projects/PRJ-019/app/` には当面ソースコードを置かず、設計成果物・調査ドキュメント・スクリプト雛形を中心に蓄積する（`app/README.md` 参照）。

---

## 案件登録時点の指示原文（オーナー）

- Open Claw（https://clawbro.ai/ja）を ChatGPT Codex のサブスクプラン（オーナーは ChatGPT Codex x5 サブスク契約済み）で動作させる
- Open Claw から Claude Code（本組織 claude-code-company）に対して指示を出させ、自動で Web アプリを開発させる
- Open Claw に与える権限を厳密に整備した「ハーネスエンジニアリング」を行い、安全かつ完全自動化で Web アプリ開発が回る環境を作る
- イメージ: claude-code-company 組織を Open Claw が「オーナー」として運営し、世の中のニーズの高い Web アプリを日々の Web 情報から自律判断して組織に開発依頼、進捗チェック、テスト、完成、通知までを自動で実行する
- 本案件は「徹底調査と要件整理」が Phase 0 の主目的。実装ではなく、要件・設定事項・リスク・アーキテクチャ案を整理することが Phase 0 の deliverable

---

## 要件概要（Phase 0 時点、調査結果次第で更新）

### 必須要件（Must, Phase 0 deliverable）

1. **Open Claw の正体把握** — clawbro.ai の運営者・サービスモデル・API 公開状況・SDK 有無・ToS / Privacy Policy / Codex サブスク利用許容範囲を全文確認
2. **Codex サブスクプラン x5 の自動化エージェント許容判定** — OpenAI ChatGPT Subscription Terms 上で「自動化エージェントによるサブスク利用」がグレー / 違反 / 許容のどれに該当するか結論
3. **権限境界設計（ハーネス仕様）** — Open Claw が claude-code-company 組織に対して「何ができ、何ができないか」を MUST/MUST-NOT の対で網羅。最低限以下を含む:
   - ファイルシステム書込範囲（`projects/PRJ-XXX/app/` 配下のみ等）
   - シェルコマンド実行可否・許可コマンドのホワイトリスト
   - ネットワーク通信先（許可ドメイン / 拒否ドメイン）
   - 外部 API 呼出可否（Supabase / Vercel / GitHub / OpenAI 等）
   - 金銭発生操作（API 課金 / インフラ契約 / ドメイン購入）の人間エスカレーション必須化
4. **アーキテクチャ案 3 種比較** — 「Open Claw を完全外部から claude-code-company に SSH/CLI で叩かせる案」「Open Claw 内に claude-code-company を子プロセスとして常駐させる案」「中間層に MCP/REST ゲートウェイを噛ませる案」など複数案の Trade-off を提示
5. **撤退・リカバリ条件** — 「Open Claw が暴走した時の即停止スイッチ」「課金暴走防止の上限設定」「ToS 違反確定時の即時撤退手順」を文書化
6. **Phase 1 以降の実装着手判定（Go/NoGo）** — Phase 0 完了時点で CEO が DEC-019-XXX として「Phase 1 着手 / 凍結 / 中止」を決裁できる材料を揃える

### 希望要件（Should, Phase 0 で着手検討）

1. Open Claw のデモ動画 / スクリーンショット / 一次情報のキャプチャ
2. 競合・類似サービスの調査（AutoGPT / Devin / OpenAI Operator / Anthropic Computer Use 等）
3. 監査ログ・観測可能性（observability）の最小要件
4. Phase 1 PoC のスケジュール案（実装着手承認時の起動図）

### あれば嬉しい（Could, Phase 0 範囲外、参考のみ）

1. 「世の中のニーズの高い Web アプリ」抽出ロジックの初期案（X / Reddit / Hacker News / G Trends 監視等）
2. 法人化視野での運用形態（複数オーナーで共有する場合の権限分離）

### 対象外（Won't, Phase 0 では絶対にやらない）

1. 実装着手（Open Claw との実通信、claude-code-company の自動運転テスト含む）
2. 課金発生する API キーの本契約（Open Claw が有償サービスの場合、Phase 0 では無償枠のみ調査）
3. Web アプリ自動生成の実機トライアル（Phase 1 以降）
4. 第三者へのデモ・配布

---

## 制約条件

- **技術的制約**:
  - オーナー実機は Windows 11 primary、副次に WSL2
  - claude-code-company は既存運用中（Claude Code ベース、`organization/roles/` に各部署定義あり）
  - PRJ-012 / PRJ-018 と同時並行運用、リソース食合いに注意
- **デザイン制約**: 該当なし（運用基盤、UI 不在）
- **法務制約**:
  - OpenAI ChatGPT Subscription Terms（自動化利用条項）
  - clawbro.ai の利用規約・プライバシーポリシー
  - 第三者サービス（Supabase / Vercel / GitHub）の自動操作に関する各 ToS
- **その他制約**:
  - **「人間不在の完全自動化」が前提のため、安全装置の設計が最優先**。1 つでも穴があれば Phase 1 着手は不可
  - 本案件はオーナー個人の検証目的、商用化・配布は別案件で起案

---

## 参考情報

- **参考サイト**:
  - Open Claw 公式: https://clawbro.ai/ja （Phase 0 で全文確認）
  - 兄弟案件 PRJ-012 Sumi: `projects/PRJ-012/brief.md`
  - 兄弟案件 PRJ-018 Asagi: `projects/PRJ-018/brief.md`
- **競合・類似**:
  - AutoGPT / Devin AI / OpenAI Operator / Anthropic Computer Use / GitHub Copilot Workspace（Phase 0 で深掘り）
- **オーナー保有資産**:
  - ChatGPT Codex x5 サブスクプラン契約済
  - claude-code-company 運用中
  - PRJ-018 で Codex CLI 統合のリサーチ知見蓄積済（`projects/PRJ-018/reports/research-report-v1.md` 等）

---

## 主要リスク Top 5（詳細は `risks.md`）

1. **R-019-01 Open Claw の正体・API 公開状況が未確認** — 調査結果次第で本案件は即時凍結可能性。Phase 0 最優先タスク
2. **R-019-02 自律エージェントへの過剰権限による損失リスク** — 金銭・コード漏洩・第三者サービス改変。ハーネス設計の核心
3. **R-019-03 Codex サブスクの ToS 違反リスク** — 「自動化エージェント利用」がグレーなら即時凍結。OpenAI 側の判定優先
4. **R-019-04 claude-code-company 組織の暴走連鎖** — Open Claw 経由で誤指示が CEO → 各部署 → ファイルシステムに伝播
5. **R-019-05 兄弟案件（PRJ-012/PRJ-018）とのリソース食合い** — オーナー個人開発、3 案件同時進行のキャパオーバ

---

## ヒアリングメモ

- 起案日 2026-05-02、オーナー指示原文は本ドキュメント § 案件登録時点の指示原文 を参照
- 仮称「Clawbridge」は秘書側で命名（Claw + bridge で「Open Claw と claude-code-company の架橋」を表現）。Phase 0 リサーチ完了後にオーナー判断で正式名称を確定（DEC-019-XXX 候補）

---

## 未確認事項（Phase 0 で全て確認する）

- [ ] Open Claw の運営者・所在国・サービス形態（SaaS / OSS / クライアント配布）
- [ ] Open Claw の API / SDK / CLI の公開状況
- [ ] Open Claw の Codex サブスク連携方式（OAuth / API Key / 独自認証）
- [ ] Open Claw 自身のセキュリティ設計（権限分離 / sandboxing / 監査ログ）
- [ ] OpenAI ChatGPT Subscription Terms の自動化エージェント条項
- [ ] clawbro.ai の利用規約・プライバシーポリシー全文
- [ ] 第三者サービス（GitHub / Vercel / Supabase 等）の自動操作 ToS
- [ ] Open Claw の利用料金体系（無償枠 / 課金体系 / 月額上限）
- [ ] 競合（AutoGPT / Devin / Operator）との差分
- [ ] claude-code-company 組織を「外部から指示」する具体的なエンドポイント設計（CLI / Web API / MCP）
- [ ] 暴走時の即停止スイッチ実装案

---

## 関連ドキュメント

- 意思決定: `decisions.md`（DEC-019-001 起案）
- タスク: `tasks.md`（リサーチ部門・PM・レビュー部門の Phase 0 タスク）
- リスク: `risks.md`（R-019-01〜R-019-05 + 順次追加）
- 進捗: `progress.md`（Phase 0 着手）
- 兄弟案件: `projects/PRJ-018/brief.md`（Asagi）／ `projects/PRJ-012/brief.md`（Sumi）
- レポート先: `projects/PRJ-019/reports/`（秘書登録サマリー / リサーチ報告書 / レビューセキュリティ評価 等）

---

**v1 起案**: 2026-05-02 ／ **次回更新**: リサーチ部門の Phase 0 調査完了時（DEC-019-XXX 発行時）
