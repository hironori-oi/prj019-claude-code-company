# PRJ-019 Round 12 Knowledge-H — HITL gate-11 `knowledge_pii_review` dry run

担当: Knowledge 部門 R12 Knowledge-H（general-purpose Agent dispatch）
案件: PRJ-019 Open Claw / Clawbridge — Phase 1 W0 Round 12 / W4 機構拡充
報告日: 2026-05-04
連動 DEC: DEC-019-007 / 025 / 033 / 058
連動 SOP: DEC-019-033（ナレッジ蓄積 3 サブディレクトリ）/ HITL 第 11 種 `knowledge_pii_review`（ODR-OG-06 正式化中）

---

## 0. CEO 向け 200 字サマリ

INDEX-v3 配下 40 件から 1 件（`decisions/cross-validation-4-departments.md`）を選定し、HITL gate-11 PII review が稼働した場合の処理 dry run を実施。PII candidate 自動検出（メール/電話/カード番号/IP/個人名/会社名等の 8 categories）、redaction 候補 list 化（before/after 比較 5 件）、human review 依頼 Slack quick-action 模擬 payload 生成、approve / reject / partial-approve 経路の 3 分岐 dry-run 結果を構造化記録。本 dry run の結果を Round 13 で HITL gate-11 実装 spec 確定材料に活用予定、API 追加コスト $0、Review 部門 ODR-OG-06 正式化連動で Phase 1 W2 までに gate-11 spec 確定見込。

---

## 1. dry run 対象選定

### 1.1 対象 file

`organization/knowledge/decisions/cross-validation-4-departments.md`

### 1.2 選定根拠（5 観点）

| 観点 | 結論 |
|---|---|
| **由来明確性** | Round 10 Knowledge-θ 起票分、INDEX-v2 / v3 に明記、由来追跡容易 |
| **PII 含有可能性** | meta-pattern 系で部署名 / Agent 名 / role 名のみ含む想定、PII 含有 0 件と仮定検証可能 |
| **redaction 範囲** | 部署名（PM-C / Marketing-D 等）が role 名なのか個人名なのか曖昧、HITL 判断必要 |
| **影響範囲** | 重要 meta-pattern（cross-validation 4 部署独立収斂）= 後続提案生成で頻繁に retrieval される、PII review 実施価値高 |
| **gate-11 dry run の代表性** | 部署名 / 案件 ID / DEC 番号 / role 名の典型的組合せ、他 file の dry run 結果類推可能 |

### 1.3 対象 file の概要

- file path: `organization/knowledge/decisions/cross-validation-4-departments.md`
- 行数: 62 行
- frontmatter: `tags / decision-id / source-PRJ / source-DEC / source-Round / created / pii-redacted: true / knowledge-pii-review: pending`
- 内容: PM / Marketing / Dev / Review の 4 部署独立 cross-validation を AI 組織の最重要意思決定シグナルに昇格する meta パターン

---

## 2. PII candidate 自動検出（8 categories）

### 2.1 検出 categories と pattern

| # | category | 検出 pattern（regex / heuristic） | 該当 file での hit |
|---|---|---|---|
| 1 | メールアドレス | `/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/` | **0 件** |
| 2 | 電話番号 | `/\b\d{2,4}-?\d{2,4}-?\d{4}\b/` | **0 件** |
| 3 | クレジットカード番号 | `/\b(?:\d{4}[-\s]?){3}\d{4}\b/` | **0 件** |
| 4 | IP アドレス（IPv4） | `/\b(?:\d{1,3}\.){3}\d{1,3}\b/` | **0 件** |
| 5 | 個人名（日本語） | 苗字 dictionary + 名前 dictionary 突合 | **0 件**（部署名 / role 名のみ） |
| 6 | 会社名（顧客固有名） | 顧客 DB 突合 + 「株式会社」「有限会社」「LLC」suffix 検出 | **0 件** |
| 7 | API キー / token | `/(sk-[a-zA-Z0-9]{32,}|pk_[a-zA-Z0-9]{32,}|xox[baprs]-[a-zA-Z0-9-]+)/` | **0 件** |
| 8 | 機密 path（内部システム） | `/\/(home\/[^\/]+|var\/secrets\/|etc\/passwd)/` | **0 件** |

### 2.2 グレーゾーン候補（HITL 判断必要）

| # | 候補 | 行 | 判断 |
|---|---|---|---|
| 1 | "PM-C" | 28, 35, 49, 53 | role 名（PM 部署 + 識別子 C）、個人名ではない → keep |
| 2 | "Marketing-D" | 30, 35, 49, 53 | 同上 → keep |
| 3 | "Dev-β/γ" | 31 | role 名（Dev 部署 + 識別子）→ keep |
| 4 | "Review-δ" | 32 | 同上 → keep |
| 5 | "Owner" | 23, 47 | role 名（最高責任者）、個人名ではない → keep |
| 6 | "DEC-019-057" / "DEC-019-025" / "DEC-019-056" | 全体 | 内部 DEC 番号、PII ではない → keep |
| 7 | "PRJ-019" | frontmatter / 全体 | 案件 ID、PII ではない → keep |

→ **PII 該当 0 件、グレーゾーン 7 件すべて keep 判断**（全件 role 名 / 識別子 / 案件 ID）

### 2.3 自動検出結果サマリ

| 観点 | 結果 |
|---|---|
| 8 categories の hit 件数 | 全 0 件 |
| グレーゾーン候補 | 7 件（全件 keep 判断） |
| redaction 候補（before / after 比較） | 0 件（PII 該当なし） |
| 自動 pii-redacted: true 維持判定 | OK（frontmatter `pii-redacted: true` 適切） |
| HITL human review 推奨 | **推奨**（グレーゾーン 7 件の判断確認 + meta-pattern の retrieval 頻度高） |

---

## 3. redaction 候補 list 化（before / after 比較）

### 3.1 PII 該当ゼロ → redaction 候補も 0 件

本 file は PII / 顧客情報 / API キーを 1 件も含まないため、redaction 候補は 0 件。
ただし、「もし PII が含まれていた場合の redaction 形式」を以下に dry run として記載:

### 3.2 仮想 redaction 形式（参考）

| 元 type | before（仮想） | after（仮想） | 備考 |
|---|---|---|---|
| メール | `hironori555@gmail.com` | `[REDACTED-EMAIL-001]` | 一意 ID 付与で逆引き可能（HITL 経由） |
| 電話 | `090-1234-5678` | `[REDACTED-PHONE-001]` | 同上 |
| 個人名 | `山田太郎` | `[REDACTED-NAME-001]` | 同上 |
| 会社名 | `株式会社ACME` | `[REDACTED-COMPANY-001]` | 同上 |
| API key | `sk-abc123...xyz789` | `[REDACTED-APIKEY-001]` | full redact、復号不可 |
| IP | `192.168.1.100` | `[REDACTED-IP-001]` | 同上 |
| 機密 path | `/home/hiron/secrets/` | `[REDACTED-PATH-001]` | 同上 |

### 3.3 本 file の最終 redaction 結果

```
file: organization/knowledge/decisions/cross-validation-4-departments.md
before redaction: PII candidate 0 件
after redaction:  PII candidate 0 件（無変更）
frontmatter pii-redacted: true → true（維持）
frontmatter knowledge-pii-review: pending → reviewed-no-pii（HITL approve 後）
```

---

## 4. Slack quick-action 模擬 payload 生成

### 4.1 payload 形式（HITL gate-11 想定）

```json
{
  "gate": "knowledge_pii_review",
  "gate_id": "GATE-11-DRY-001",
  "target_file": "organization/knowledge/decisions/cross-validation-4-departments.md",
  "trigger_round": 12,
  "triggered_by": "Knowledge-H (Round 12 dry run)",
  "auto_detection_summary": {
    "pii_categories_checked": 8,
    "pii_hits": 0,
    "grayzone_candidates": 7,
    "redaction_candidates": 0,
    "frontmatter_pii_redacted": true,
    "frontmatter_knowledge_pii_review": "pending"
  },
  "grayzone_list": [
    { "term": "PM-C", "occurrences": 4, "judgment": "role-name", "recommendation": "keep" },
    { "term": "Marketing-D", "occurrences": 4, "judgment": "role-name", "recommendation": "keep" },
    { "term": "Dev-β/γ", "occurrences": 1, "judgment": "role-name", "recommendation": "keep" },
    { "term": "Review-δ", "occurrences": 1, "judgment": "role-name", "recommendation": "keep" },
    { "term": "Owner", "occurrences": 2, "judgment": "role-name", "recommendation": "keep" },
    { "term": "DEC-019-XXX", "occurrences": "multiple", "judgment": "internal-DEC-id", "recommendation": "keep" },
    { "term": "PRJ-019", "occurrences": "multiple", "judgment": "project-id", "recommendation": "keep" }
  ],
  "review_actions": [
    {
      "action": "approve",
      "label": "Approve - PII 0 件、grayzone keep",
      "result_frontmatter_update": {
        "pii-redacted": true,
        "knowledge-pii-review": "reviewed-no-pii"
      }
    },
    {
      "action": "reject",
      "label": "Reject - 再 redaction 必要",
      "result_frontmatter_update": {
        "pii-redacted": false,
        "knowledge-pii-review": "rejected-needs-redaction"
      },
      "result_action": "Knowledge agent に redaction 再実施 dispatch"
    },
    {
      "action": "partial_approve",
      "label": "Partial - grayzone の一部を redact",
      "result_frontmatter_update": {
        "pii-redacted": true,
        "knowledge-pii-review": "partial-redacted"
      },
      "result_action": "選択された grayzone term を [REDACTED-...] に置換"
    }
  ],
  "reviewer_assigned": "Owner (formal sign-off)",
  "deadline_iso": "2026-05-08T18:00:00+09:00",
  "context_links": [
    "https://internal/INDEX-v3.md",
    "https://internal/projects/PRJ-019/reports/knowledge-round11-mining-batch-2.md"
  ]
}
```

### 4.2 Slack message 模擬 view

```
[HITL gate-11] Knowledge PII Review Required

File: organization/knowledge/decisions/cross-validation-4-departments.md
Trigger: Round 12 Knowledge-H dry run
Auto-detection: PII 0 hit / grayzone 7 件（全件 role 名 / 識別子）

Grayzone:
  - PM-C, Marketing-D, Dev-β/γ, Review-δ (role 名)
  - Owner (role 名)
  - DEC-019-XXX (内部 DEC 番号)
  - PRJ-019 (案件 ID)

Recommendation: All grayzone items can be kept (no PII).

Actions:
  [Approve]  [Reject]  [Partial]

Deadline: 2026-05-08 18:00 JST
```

---

## 5. 3 分岐 dry-run 結果

### 5.1 経路 A: approve（推奨経路）

#### 入力

```
gate_id: GATE-11-DRY-001
action: approve
reviewer: Owner
reviewed_at: 2026-05-04T23:30:00+09:00
```

#### 処理 step

1. frontmatter 更新: `knowledge-pii-review: pending → reviewed-no-pii`
2. INDEX-v3.md の対象 entry に `[reviewed-no-pii]` flag 追加（option）
3. audit log に approve event を append（DEC-019-054 hash chain）
4. Slack message 更新: `[Approved by Owner @ 2026-05-04 23:30]`

#### 結果

| 項目 | 値 |
|---|---|
| frontmatter pii-redacted | true（維持） |
| frontmatter knowledge-pii-review | reviewed-no-pii（更新） |
| INDEX-v3 status | reviewed |
| audit log entry | append 済 |
| 後続処理 | なし、Knowledge agent への redispatch 不要 |

#### dry-run 評価

- approve 経路は**最も多用**される想定（PII 含有 0 件の knowledge file が大半）
- 自動検出で PII 0 件 + grayzone 全件 keep 推奨 → reviewer は 1 click で approve 可能
- audit trail 確保で後日「なぜ approve されたか」を trace 可能

### 5.2 経路 B: reject（再 redaction 必要）

#### 入力

```
gate_id: GATE-11-DRY-001
action: reject
reviewer: Owner
reviewed_at: 2026-05-04T23:30:00+09:00
reject_reason: "grayzone Dev-β/γ が個人名の可能性あり、再確認必要"
```

#### 処理 step

1. frontmatter 更新: `pii-redacted: true → false` / `knowledge-pii-review: pending → rejected-needs-redaction`
2. INDEX-v3.md の対象 entry に `[rejected]` flag 追加
3. audit log に reject event + reject_reason を append
4. Knowledge agent への redispatch 自動 trigger（次 Round Knowledge-X が redaction 再実施）
5. Slack message 更新: `[Rejected by Owner @ 2026-05-04 23:30] reason: ...`

#### 結果

| 項目 | 値 |
|---|---|
| frontmatter pii-redacted | false（更新） |
| frontmatter knowledge-pii-review | rejected-needs-redaction（更新） |
| INDEX-v3 status | rejected |
| audit log entry | append 済（reject_reason 含む） |
| 後続処理 | Knowledge agent redispatch 自動 trigger |

#### dry-run 評価

- reject 経路は**稀少**だが、grayzone 判断の最終 safeguard として重要
- redispatch は自動 trigger、Knowledge agent は reject_reason を input にして再 redaction
- audit trail で reject 履歴を蓄積、HITL gate-11 SOP の改善材料

### 5.3 経路 C: partial-approve（選択的 redaction）

#### 入力

```
gate_id: GATE-11-DRY-001
action: partial_approve
reviewer: Owner
reviewed_at: 2026-05-04T23:30:00+09:00
partial_redact_terms: ["Dev-β/γ", "Review-δ"]
keep_terms: ["PM-C", "Marketing-D", "Owner", "DEC-019-XXX", "PRJ-019"]
```

#### 処理 step

1. file 本文の `Dev-β/γ` を `[REDACTED-ROLE-001]` に置換、`Review-δ` を `[REDACTED-ROLE-002]` に置換
2. frontmatter 更新: `pii-redacted: true（維持）` / `knowledge-pii-review: pending → partial-redacted`
3. INDEX-v3.md の対象 entry に `[partial-redacted]` flag 追加
4. audit log に partial_approve event + redacted_terms を append
5. Slack message 更新: `[Partial-approved by Owner @ 2026-05-04 23:30] redacted: 2 terms`

#### 結果

| 項目 | 値 |
|---|---|
| frontmatter pii-redacted | true（維持） |
| frontmatter knowledge-pii-review | partial-redacted（更新） |
| INDEX-v3 status | partial-redacted |
| 本文変更 | 2 terms 置換（[REDACTED-ROLE-001/002]） |
| audit log entry | append 済（redacted_terms 含む） |
| 後続処理 | なし（partial 確定で完了） |

#### dry-run 評価

- partial-approve 経路は**中庸**な safeguard、grayzone の一部のみ redact 可能
- 置換 ID（[REDACTED-ROLE-XXX]）は逆引き可能（HITL 経由）、後で keep 判断が変更された場合に復元可能
- knowledge file の retrieval 価値を保ちつつ、PII risk を最小化

---

## 6. 3 経路の比較表

| 経路 | 想定 frequency | 処理 step 数 | 後続自動処理 | 適用 case |
|---|---|---|---|---|
| **A. approve** | 最多（80%+） | 4 step | なし | PII 0 件 + grayzone keep |
| **B. reject** | 稀少（5% 以下） | 5 step | Knowledge agent redispatch 自動 | grayzone に個人名疑義 |
| **C. partial-approve** | 中庸（15%） | 5 step | なし | grayzone の一部のみ redact |

---

## 7. dry run 観測項目と Round 13 spec 確定材料

### 7.1 観測項目

| # | 観測項目 | dry run 結果 |
|---|---|---|
| 1 | 自動 PII 検出 8 categories の network 必要性 | 全 regex / heuristic / dictionary 突合、network 不要、API コスト $0 |
| 2 | grayzone 判断の caller-side 自動化可能性 | role 名 / 識別子 / 案件 ID は自動 keep 判定可能（dictionary 拡充で精度向上） |
| 3 | 3 経路の処理 step 数 | approve 4 / reject 5 / partial-approve 5、平均 4.7 step |
| 4 | audit log 連携 | DEC-019-054 hash chain と整合、event append のみ、改ざん検出可能 |
| 5 | redispatch 自動 trigger（経路 B） | Knowledge agent への message queue 経由 dispatch、SOP 化必要 |
| 6 | Slack quick-action UI | 3 button（approve / reject / partial）、deadline 表示、grayzone list 表示 |

### 7.2 Round 13 HITL gate-11 spec 確定材料

| # | spec 項目 | dry run 由来推奨 |
|---|---|---|
| 1 | 自動 PII 検出 8 categories | 採用、network 不要 |
| 2 | grayzone dictionary | role 名 / 識別子 / 案件 ID / DEC 番号を初期 dictionary に登録 |
| 3 | 3 経路（approve / reject / partial）| 全て採用、frontmatter status update 規約を確定 |
| 4 | audit log 連携 | DEC-019-054 hash chain と整合、event append 必須 |
| 5 | redispatch SOP（経路 B） | Knowledge agent への message queue 経由、reject_reason を input に |
| 6 | Slack quick-action UI | 3 button + deadline + grayzone list、dashboard と連動 |
| 7 | reviewer assignment | Owner formal sign-off / Review 部門 ODR-OG-06 連動 |
| 8 | deadline 設定 | 議決-26 等の重要 milestone と連動、default 4 日 |

---

## 8. 制約遵守状況

| 制約 | 結果 |
|---|---|
| API 追加コスト = $0 | yes（regex / heuristic / dictionary 突合のみ、network 不要） |
| organization/knowledge/ + projects/PRJ-019/reports/ 配下のみ | yes |
| 並列 R12 Agent と file conflict 禁止 | yes（dry run report 新規作成のみ、既存 file 無改変） |
| 既存 organization/knowledge/ ファイル無改変 | yes（dry run のみ、frontmatter / 本文ともに 0 件編集） |
| DEC-019-033 3 原則（YAML frontmatter / PRJ-XXX 由来 / tag 付け）| 100% 遵守 |
| 絵文字なし | yes |

---

## 9. 副次効果と Round 13 引継 TODO

### 9.1 副次効果

1. **HITL gate-11 spec 確定材料**: 本 dry run の 6 観測項目 + 3 経路設計が Round 13 spec 確定の直接 input
2. **grayzone dictionary 初期化基盤**: 7 grayzone 候補（role 名 / 識別子 / 案件 ID / DEC 番号）が初期 dictionary 登録候補
3. **audit log 連携の整合性確保**: DEC-019-054 hash chain との整合 dry run 確認、redispatch 自動化の SOP 起点
4. **Slack quick-action UI design**: 3 button 模擬 payload で UI 詳細仕様の参考材料

### 9.2 Round 13 引継 TODO

| # | TODO | 担当 | 期限 |
|---|---|---|---|
| 1 | 本 dry run 結果を HITL gate-11 spec 確定（v1.0）に反映 | Review + Knowledge | Phase 1 W2（5/16-22） |
| 2 | grayzone dictionary v1.0 起票（role 名 / 識別子 / 案件 ID / DEC 番号 4 categories）| Knowledge | Round 13 |
| 3 | 自動 PII 検出 8 categories の regex / heuristic / dictionary を spec 化 | Dev + Knowledge | Phase 1 W2 |
| 4 | redispatch SOP（経路 B）= Knowledge agent への message queue 経由 dispatch を DEC-019-025 拡張に組込 | PM + Dev | Round 13 |
| 5 | Slack quick-action UI 詳細仕様（dashboard 連動含む）| Dev + Marketing | Phase 1 W4 |
| 6 | 本 dry run 結果を ODR-OG-06 正式化議事に提出 | Review | 5/8 議決-26 検収会議 |

---

## 10. 結論 + Knowledge 部門 sign-off

### 10.1 結論

INDEX-v3 配下 40 件から `decisions/cross-validation-4-departments.md` を選定し、HITL gate-11 PII review が稼働した場合の処理 dry run を完遂。8 categories 自動 PII 検出で hit 0 件、grayzone 7 件全件 keep 判断、redaction 候補 0 件、Slack quick-action 模擬 payload + 3 経路（approve / reject / partial-approve）dry-run 結果を構造化記録。本 dry run の 6 観測項目 + 3 経路設計が Round 13 HITL gate-11 spec 確定（v1.0）の直接 input、Phase 1 W2 までに spec 確定 + ODR-OG-06 正式化連動見込。API 追加コスト $0、既存 file 無改変、DEC-019-033 3 原則 100% 遵守。

### 10.2 Knowledge 部門 sign-off

| 観点 | sign-off |
|---|---|
| dry run 対象 1 件選定（cross-validation-4-departments.md）| sign-off |
| 8 categories 自動 PII 検出（hit 0 + grayzone 7） | sign-off |
| redaction 候補 list 化（0 件、仮想形式記載） | sign-off |
| Slack quick-action 模擬 payload 生成 | sign-off |
| 3 経路（approve / reject / partial-approve）dry-run 結果 | sign-off |
| Round 13 HITL gate-11 spec 確定材料抽出（6 観測項目 + 8 spec 項目） | sign-off |
| 既存 file 無改変（dry run のみ） | sign-off |
| API 追加コスト $0 | sign-off |

### 10.3 関連 DEC / リスク参照

- **DEC-019-007**: G-05/G-06/G-12 hardguard — 本 dry run の audit log 連携の上位根拠
- **DEC-019-025**: Agent dispatch SOP — redispatch 経路（B）の SOP 拡張候補
- **DEC-019-033**: ナレッジ蓄積 3 サブディレクトリ — 本 dry run で構造化記録基盤再確認
- **DEC-019-054**: Hash chain audit — 本 dry run の audit log append の整合 primitive
- **DEC-019-058**: Round 11 9 並列 dispatch authorization — 本 Round 12 Knowledge-H 起票根拠
- **ODR-OG-06**（Review 部門 organization rule）: HITL 第 11 種正式化中、本 dry run 結果を spec 確定材料に活用

### 10.4 次回更新

- 5/8 18:00（議決-26 採択直後）= 本 dry run 結果を ODR-OG-06 正式化議事に提出
- 5/16-22（Phase 1 W2）= HITL gate-11 spec v1.0 確定 + grayzone dictionary v1.0 起票
- 6/3 / 6/27（Phase 1 sign-off / 朝公開）= Round 13-14 Knowledge-I/J 後続継続蓄積

---

**v1 起案**: 2026-05-04 W0-Week1 深夜 Knowledge 部門 R12 Knowledge-H / 案 C ハイブリッド前提
**正式採択**: 2026-05-08 W0-Week1 検収会議（議決-26 連動採択、Owner sign-off 予定）
**v1 確定差分**: dry run 1 件 + 8 categories PII 検出 + 3 経路 dry-run + Slack quick-action 模擬 payload + 6 観測項目 + 8 spec 項目

(以上 / R12 Knowledge-H HITL gate-11 dry run 完遂報告)
