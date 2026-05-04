# PRJ-019 秘書部門 案件登録サマリー

**日付**: 2026-05-02
**作成者**: 秘書部門
**対象案件**: PRJ-019「Clawbridge（仮称）」— Open Claw を自律オーナーとする AI 組織ハーネス基盤
**起案者（決裁ライン）**: オーナー → CEO → 秘書（本登録）

---

## 1. 案件登録の経緯

オーナーから CEO 経由で秘書部門に PRJ-019 の新規案件登録依頼を受領。本案件は以下の構造的に重要な案件:

- **主体が AI（Open Claw）**: 兄弟案件 PRJ-012 Sumi / PRJ-018 Asagi が「人間が AI を操作する GUI」であるのに対し、PRJ-019 は **「人間不在で AI が claude-code-company 組織を動かす運用基盤」**
- **形態が運用基盤**: アプリ実体ではなく、ハーネス（権限境界・監査基盤・撤退条件）が主成果物
- **Phase 0 が徹底調査主体**: 実装着手は調査完了後に別決裁（DEC-019-XXX）

仮称「Clawbridge」は秘書側で命名（Claw + bridge、Open Claw と claude-code-company の架橋）。Phase 0 リサーチ完了後に正式名称をオーナーが確定する想定。

---

## 2. 作成・更新したファイル一覧（全て絶対パス）

### 新規作成

| ファイル | 役割 |
|---|---|
| `C:\Users\hiron\Desktop\claude-code-company\projects\PRJ-019\brief.md` | 案件概要 v1。3 大キーワード（人間不在の完全自動化 / Codex サブスクで動く Open Claw / ハーネスエンジニアリング）強調、PRJ-018 との構造対比、Phase 0 deliverable 定義 |
| `C:\Users\hiron\Desktop\claude-code-company\projects\PRJ-019\decisions.md` | DEC-019-001（Phase 0 起案、実装は別決裁）+ Phase 0 完了 DoD |
| `C:\Users\hiron\Desktop\claude-code-company\projects\PRJ-019\progress.md` | Phase 0 着手記録、マイルストン 0〜5、進捗ログ（2026-05-02 登録分） |
| `C:\Users\hiron\Desktop\claude-code-company\projects\PRJ-019\tasks.md` | Phase 0 タスク 21 件 / 76h（CB-R-01〜09 リサーチ / CB-P-01〜06 PM / CB-S-01〜05 レビュー / CB-GATE-01）+ Phase 1 placeholder |
| `C:\Users\hiron\Desktop\claude-code-company\projects\PRJ-019\risks.md` | 当初リスク R-019-01〜R-019-05 + 法務 R-019-L1〜L4 + 運用 R-019-O1〜O3、重大度サマリ、対応タイミング |
| `C:\Users\hiron\Desktop\claude-code-company\projects\PRJ-019\app\README.md` | ハーネス基盤としての性質明記、Phase 0 では実装ゼロ、Phase 1 着手時に整備するファイル一覧 |
| `C:\Users\hiron\Desktop\claude-code-company\projects\PRJ-019\reports\secretary-registration-summary.md` | 本ファイル |

### 新規ディレクトリ

- `C:\Users\hiron\Desktop\claude-code-company\projects\PRJ-019\`
- `C:\Users\hiron\Desktop\claude-code-company\projects\PRJ-019\app\`
- `C:\Users\hiron\Desktop\claude-code-company\projects\PRJ-019\reports\`

### 更新

| ファイル | 変更内容 |
|---|---|
| `C:\Users\hiron\Desktop\claude-code-company\dashboard\active-projects.md` | (1) PRJ-019 行を PRJ-018 行直後に追加（Phase 0 着手、5%、高優先、3 大キーワード + 当初リスク + Phase 0 タスク主担当を要約） / (2) 「次に採番する案件 ID: **PRJ-019**」 → **PRJ-020** に更新 |

---

## 3. 登録内容のサマリー

### 案件 ID
**PRJ-019**

### 案件名（仮）
Clawbridge（仮称） — Open Claw を自律オーナーとする AI 組織ハーネス基盤

### Phase
**Phase 0（徹底調査・要件整理）**着手

### 担当
- CEO 統括
- 秘書（登録 = 本セッションで完了）
- リサーチ部門（主担当: CB-R-01〜09、Open Claw 一次情報 / ChatGPT Subscription Terms / 競合分析）
- PM（CB-P-01〜06、ハーネス仕様 v1 / アーキテクチャ案 3 種 / 撤退条件）
- レビュー部門（CB-S-01〜05、セキュリティリスク評価、Phase 1 Go/NoGo 推奨）

### 3 大キーワード（brief.md で強調）
1. **人間不在の完全自動化** — オーナーが手元で逐次承認しない、ニーズ抽出 → 開発依頼 → 進捗チェック → テスト → 完成 → 通知 まで Open Claw が自律
2. **Codex サブスクで動く Open Claw** — オーナー契約済の ChatGPT Codex x5 サブスクで稼働（Codex API 直接購入のコスト暴走回避）
3. **ハーネスエンジニアリング** — 自律エージェントへの権限境界を MUST / MUST-NOT で厳密設計、暴走・損失防止が本案件の核心

### 兄弟案件との対比（PRJ-018 / PRJ-019）
- **PRJ-018 Asagi**: 人間が Codex を操作する GUI（Tauri デスクトップ IDE）
- **PRJ-019 Clawbridge**: **人間不在で Codex 系エージェント（Open Claw）が claude-code-company 組織を動かす自律基盤**（アプリではなく運用基盤・ハーネス）

### Phase 0 主要 deliverable
1. Open Claw（clawbro.ai/ja）の一次情報全文取得 + 運営者・API 公開状況確認
2. OpenAI ChatGPT Subscription Terms の自動化エージェント条項判定（許容 / グレー / 違反）
3. ハーネス仕様 v1（権限境界 MUST / MUST-NOT 表、最低 30 項目）
4. アーキテクチャ案 3 種比較（外部 SSH / 子プロセス常駐 / MCP-REST ゲートウェイ）
5. 撤退・リカバリ条件（即停止スイッチ / 課金暴走防止 / ToS 違反時手順）
6. レビュー部門のセキュリティリスク評価レポート
7. CEO による DEC-019-XXX 発行（Phase 1 Go/NoGo 決裁）

### 当初リスク Top 5
1. **R-019-01** Open Claw の正体・API 公開状況が未確認（最重、Day 1 で即判定）
2. **R-019-02** 自律エージェントへの過剰権限による損失リスク（本案件核心、ハーネス設計で軽減）
3. **R-019-03** Codex サブスクの ToS 違反リスク（最重、Day 1〜2 で即判定）
4. **R-019-04** claude-code-company 組織の暴走連鎖
5. **R-019-05** 兄弟案件（PRJ-012 / PRJ-018）とのリソース食合い

---

## 4. 次アクション（CEO への申し送り）

1. **CEO 起動** — 本登録完了を受けて、リサーチ部門に Phase 0 調査依頼を発令
   - **最優先 2 タスク並列**: CB-R-01（Open Claw 一次情報全文取得）+ CB-R-04（ChatGPT Subscription Terms 自動化条項確認）
   - 早期判定で R-019-01 / R-019-03 のいずれかが「NoGo 寄り」確定なら即時凍結検討
2. **PM 待機** — リサーチ中間報告受領後に CB-P-01〜06 着手
3. **レビュー部門待機** — PM 成果物受領後に CB-S-01〜05 着手
4. **CEO 週次レビュー** — PRJ-012 / PRJ-018 / PRJ-019 の 3 案件並行リソース配分（R-019-05 緩和）

---

## 5. 仕様遵守確認

- [x] CLAUDE.md 最優先ルール: `projects/PRJ-019/app/` ディレクトリ作成 + README.md でハーネス基盤性質明記（実装ゼロを明示）
- [x] 5 点ドキュメント整備: brief / decisions / progress / tasks / risks
- [x] 案件 ID 採番: PRJ-019、`dashboard/active-projects.md` 反映 + 次採番 PRJ-020 に更新
- [x] 兄弟案件（PRJ-012 / PRJ-018）との関係を brief / decisions / dashboard で明示
- [x] 3 大キーワード（人間不在の完全自動化 / Codex サブスクで動く Open Claw / ハーネスエンジニアリング）を brief.md で強調
- [x] DEC-019-001 で「Phase 0 = 徹底調査・要件整理、実装は DEC-019-XXX で別途判断」を記録
- [x] レポート: 本ファイル（`projects/PRJ-019/reports/secretary-registration-summary.md`）

---

**v1**: 2026-05-02 起案 ／ 秘書部門
