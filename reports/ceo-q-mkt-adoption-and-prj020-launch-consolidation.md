# CEO 第 5 弾連結報告 — Q-Mkt 全件 CEO 推奨採択 + PRJ-020 ClawDialog 起案

- 文書 ID: ceo-q-mkt-adoption-and-prj020-launch-consolidation
- 制定: 2026-05-03
- Owner 指示原文 (本セッション):
  - (1)「Q-Mkt-01〜08 についてCEO推奨で進めてください」
  - (2)「open clawと私の間でやり取りできる環境が欲しいので、こちらも実装を計画して下さい。私からは、ほしいアプリの情報などをopen clawに情報提供し、open clawが採用するかどうかも含めて判断するイメージです。」
- 連結対象: 第 1〜4 弾連結報告 + 本第 5 弾
- 報告経路: CEO → オーナー

---

## 0. 200 字 サマリ

Owner 2 つの直接指示を 1 セッションで完遂。**(1) Q-Mkt-01〜08 を CEO 推奨案そのまま全件公式採択** (DEC-019-026 公開 6/20 / 027 Heading A / 028 部分開示 / 029 HP 配置 + Contact form の DEC 4 件 + DEC-019-030 G-Top-1 (a)+(e) 採用 + 議事録扱い 4 件)、**(2) PRJ-020 ClawDialog (Owner ↔ Open Claw 双方向対話環境) を新規起案** (DEC-020-001〜003、Phase 0 4 並列発注 5/3 中完遂)。本セッション計 **9 件成果物 + DEC 8 件公式起票 + dashboard PRJ-020 新規追加**、累積本日 (2026-05-03) **17 件 / 約 9,000 行の prep 物**。Marketing 即時着手指示済、5/8 検収会議 §5 後半は事後承認モードで時間圧縮 (10→5 分) + §5(d) PRJ-020 報告 5 分新設。

---

## 1. 経緯

第 4 弾連結報告 (`ceo-w0-week2-prep-final-followup.md`) で W0-Week2 prep 12 件完遂を直前報告。Owner から 2 つの直接指示が連続発出:
- 指示 (1): Q-Mkt 8 件 CEO 推奨採択を Owner 一任承認 (5/8 12:00 期限を待たず即決)
- 指示 (2): Open Claw との双方向対話環境を新規実装計画として起案

CEO は両指示を統合的に処理する判断:
- 指示 (1) → 公式採択書 + DEC 起票 + Marketing 反映 + 議題 v3→v4 修正
- 指示 (2) → PRJ-020 新規 PRJ として独立案件化 + Phase 0 4 並列発注 (Research / Dev / Review + 秘書)

---

## 2. 成果物詳細 (本セッション = 9 件)

### 2.1 Q-Mkt 採択関連 (5 件)

| # | ファイル | 種別 | 容量 | 主要内容 |
|---|---|---|---|---|
| 1 | `ceo-q-mkt-01-08-formal-adoption-2026-05-03.md` | CEO 自前 | 9 章構成 | 8 件全件 CEO 推奨採択 + DEC 4 件詳細 reasoning + 議事録扱い 4 件記録雛形 + 5/8 議題 §5 運用変更 + Marketing 即時着手指示 |
| 2 | `secretary-w0-week1-meeting-agenda-v4.md` | 秘書 | 440 行 / 34,497 字 | v3→v4: §5 後半 10→5 分事後承認、§5(c) G-Top-1 5→10 分、§5(d) PRJ-020 5 分新設、120 分維持 |
| 3 | `secretary-w0-week1-meeting-minutes-template-v2.md` | 秘書 | 632 行 / 37,289 字 | DEC-019-026〜030 既決前提に書き換え、議事メモ 4 件「Owner 一任承認済」形式、投票集計 17→8 議題 |
| 4 | `marketing-portfolio-reflection-design-v2.md` | Marketing | 497 行 / 41,797 字 | Heading A / 公開 6/20 / 部分開示 80-50-100-概要 / HP 配置 + Contact form のみ / SNS X 1 投稿 + M1〜M7 マイルストーン |
| 5 | `marketing-knowledge-reflection-design-v2.md` | Marketing | 459 行 / 42,196 字 | K8/K9 部分匿名化 (PRJ ID 伏字 + 教訓全面公開)、PATTERN 番号 暫定 + 5/8 棚卸し記述、N1〜N7 マイルストーン新設 |

### 2.2 PRJ-020 関連 (4 件 + 案件登録 3 ファイル)

| # | ファイル | 種別 | 容量 | 主要内容 |
|---|---|---|---|---|
| 6 | `projects/PRJ-020/README.md` | CEO 自前 | 約 50 行 | 案件概要 + Phase 計画 + PRJ-019 同居方針 + 関連ファイル一覧 |
| 7 | `projects/PRJ-020/decisions.md` | CEO 自前 | DEC-020-001〜003 | 起案承認 + Phase 0 4 並列 + 同居実装 |
| 8 | `projects/PRJ-020/state.md` | CEO 自前 | 約 30 行 | Phase 0 / 5% 進捗 / リスク 4 件 |
| 9 | `projects/PRJ-020/reports/ceo-prj020-scope-definition.md` | CEO 自前 | 10 章構成 | 機能要件 + アーキ案 3 + HITL 第 8 種 仕様 + Phase 計画 + Spend Cap $26.5/月 + リスク 6 件 |
| 10 | `projects/PRJ-020/reports/research-prj020-connection-method.md` | Research | 539 行 / 28,207 字 / Mermaid 4 / 比較表 14 | Open Claw input mechanism 調査、**接続方式 案 B-2 (stdin one-shot + meta JSON envelope) を CEO 推奨採択** |
| 11 | `projects/PRJ-020/reports/dev-prj020-implementation-skeleton.md` | Dev | 1,164 行 / 40,854 字 / コード片 18 / Mermaid 2 | ディレクトリ構造 + Supabase スキーマ完全 SQL + Server Action + 採否判断プロンプト + HITL 第 8 種実装 + `/new-project` 連動 + Phase 1/2 DoD |
| 12 | `projects/PRJ-020/reports/review-prj020-security-risk.md` | Review | 401 行 / 29,962 字 / Mermaid 1 / 比較表 18 | リスクレジスタ R-020-01〜12 (Showstopper 1 / High 7 / Medium 4) + 必達コントロール C-020-01〜07 + **結論: Strong Conditional Go** (HITL 第 8 種仕様確定が Phase 1 PoC 着手絶対条件) |
| 13 | `projects/PRJ-020/reports/secretary-prj020-dashboard-and-meeting-integration.md` | 秘書 | 367 行 / 25,273 字 / 8 章構成 | dashboard 反映 + §5(d) 議事メモ雛形 + 同居実装表記方針 + 6/13 PoC Go/NoGo 議題予告 |

### 2.3 DEC 公式起票 (8 件)

`projects/PRJ-019/decisions.md` に 84 行追記:
- **DEC-019-026**: Q-Mkt-02 公開タイミング 6/20 確定
- **DEC-019-027**: Q-Mkt-04 Heading A 採用「AI 組織が AI 組織を運営する」
- **DEC-019-028**: Q-Mkt-05 部分開示モード (harness 80% / org 50% / cost 100% / ToS 概要)
- **DEC-019-029**: Q-Mkt-06 HP 配置トップ + 事例ページ + Contact form のみ
- **DEC-019-030**: G-Top-1 採用案 (a)+(e) ハイブリッド (W1〜W3 HN trending TS / W4 自社 PRJ-001〜018 リファクタ)
- **DEC-020-001**: PRJ-020 起案承認
- **DEC-020-002**: Phase 0 + 4 並列発注
- **DEC-020-003**: 同居実装方針 (PRJ-019 `app/clawdialog/` 配下)

---

## 3. 累積成果 (本日 2026-05-03 = 17 件)

| 連結報告 | 件数 | 行数概算 | 主要納品物 |
|---|---|---|---|
| 第 1 弾 (W0-Week2 prep) | 4 + 1 | 約 1,400 行 | Owner cover letter / G-Top-1 比較 / PRJ-018-019 matrix / PM kickoff |
| 第 2 弾 (即決 3 件) | 議事録扱 | — | DEC-019-018〜020 |
| 第 3 弾 (統合) | — | — | dashboard 35→45% |
| 第 4 弾 (Phase 1 中盤 + Owner 支援) | 4 件 | 約 2,082 行 | Owner setup / 議事録 template / BAN drill #1 / HITL 6/7 SOP |
| **第 5 弾 (本書)** | **9 件 + DEC 8 件** | **約 4,400 行** | **Q-Mkt 採択 + PRJ-020 起案 + 4 並列発注成果** |
| **本日累計** | **17 件 + DEC 13 件** | **約 8,900 行** | **Mermaid 25+ / 比較表 220+** |

---

## 4. 5/4 以降直近マイルストーン更新

```mermaid
gantt
    title 2026-05-04〜05-18 + PRJ-020 Phase 1 PoC (6/14-27)
    dateFormat YYYY-MM-DD
    section Owner
    Q-Mkt 8件回答(不要 既決)         :crit, done, 2026-05-03, 1d
    1Password 4 Vault 構築          :2026-05-04, 2d
    Spend Cap 設定                   :2026-05-05, 1d
    OAuth 隔離検証 3 件             :2026-05-06, 1d
    section 5/8 検収会議
    議題 v4 リハ                     :2026-05-07, 1d
    検収会議 18:00-20:00 (120分)    :2026-05-08, 1d
    DEC-019-026〜030 事後承認        :2026-05-08, 1d
    PRJ-020 §5(d) 報告              :2026-05-08, 1d
    section PRJ-019 W0-W2
    BAN drill #1                     :2026-05-15, 1d
    OAuth 隔離 + Sumi/Asagi backup  :2026-05-15, 1d
    BAN drill #2                     :2026-05-17, 1d
    W0 完了 Go/NoGo                  :milestone, 2026-05-18, 0d
    section PRJ-019 Phase 1
    W1 着手                          :milestone, 2026-05-19, 0d
    Phase 1 完了                     :milestone, 2026-06-13, 0d
    section PRJ-020
    Phase 0 完遂                     :crit, done, 2026-05-03, 1d
    Phase 1 PoC                      :2026-06-14, 14d
    Phase 2 本実装                   :2026-06-28, 28d
    section Marketing
    v2 中間納品                      :2026-05-26, 1d
    最終締切                         :milestone, 2026-06-12, 0d
    6/20 朝公開                      :milestone, 2026-06-20, 0d
```

| 日付 | 主要イベント | Owner 関与 | CEO 担当 |
|---|---|---|---|
| 5/3 終盤 | Q-Mkt 採択 + PRJ-020 起案 + DEC 8 件 | 直接指示で本日完遂 | 完了 |
| 5/4 朝 | Owner Q-Mkt 回答送付不要 (既決) → 1Password 構築開始 | 直接 | 進捗確認 |
| 5/4-5/7 | Owner W0 セットアップ (1Password / Spend Cap / OAuth 隔離) | 必須 | daily 確認 |
| 5/7 18:00 | 5/8 検収リハ | — | 主導 |
| 5/8 18:00-20:00 | 検収会議 (議題 v4) | 必須 | 議長 |
| 5/8 §5(d) | PRJ-020 Phase 0 結果報告 (5 分) | 確認 | 報告 |
| 5/13 | BAN drill #1 | 立会任意 | 主導 |
| 5/15 | OAuth 隔離 + AS-151 スライド | — | 主導 |
| 5/19 | PRJ-019 Phase 1 W1 着手 | キックオフ | — |
| 6/13 | Phase 1 完了 + PRJ-020 PoC Go/NoGo 判定 | 必須 | 議長 |
| 6/14-27 | PRJ-020 Phase 1 PoC | — | Dev 主導 |
| 6/20 朝 | Marketing 公開 (HP + LP + ブログ + ナレッジ) | 確認 | — |
| 6/28-7/25 | PRJ-020 Phase 2 本実装 | — | Dev 主導 |

---

## 5. リスク再評価

| リスク ID | 内容 | 第 4 弾時点 | 第 5 弾後 | 変動要因 |
|---|---|---|---|---|
| R-019-08 | PRJ-018 並走 | 中 | 中 | 5/15 以降の調整次第 |
| R-019-09 | Owner 5/4-5/8 過負荷 | 中 | **低** | Q-Mkt 8 件 即決済で 30〜45 分 Owner 工数解放 |
| R-019-10 | 5/8 検収 120 分超過 | 低 | 低 | v4 で §5 後半 10→5 分圧縮 (5 分余り = §5(c) 拡大) |
| R-019-11 | BAN drill #1 当日混乱 | 低 | 低 | 詳細手順 + 立会者 7 役割確定 |
| R-019-12 | HITL 6/7 種 W0-W2 着手遅延 | 中 | 中 | SOP 完成、Dev 5/26 着手予定 |
| R-019-13 | Q-Mkt 8 件 Owner 期限超過 | 中 | **解消** | 5/3 即決 |
| **R-020-01** | **PRJ-020 prompt injection** | **新規** | 中 | HITL 第 8 種で軽減、6/13 までに仕様確定が PoC 絶対条件 (Review Strong Conditional Go) |
| **R-020-02** | **PRJ-020 Spend Cap 圧迫** | **新規** | 中 | 月次 $30 上限、PRJ-019 内 8.8% |
| **R-020-03** | **PRJ-020 採用判断バイアス** | **新規** | 中 | Phase 1 PoC 後再評価 |
| **R-020-04** | **PRJ-019 注意分散** | **新規** | 低 | Phase 0 のみ本セッション、Phase 1 着手は PRJ-019 Phase 1 完了後 |

→ R-019-09 中→低、R-019-13 解消、新規 R-020 4 件追加 (中 3 件 / 低 1 件)。

---

## 6. 結論

- **Owner 2 つの直接指示を 1 セッションで完遂**: Q-Mkt 8 件採択 + PRJ-020 起案
- **本日累計 17 件成果物 + DEC 13 件 + 約 8,900 行**
- **5/8 検収会議は v4 議題で時間最適化** (§5 後半 10→5 分、§5(c) 拡大、§5(d) PRJ-020 新設)
- **Marketing 即時着手で 6/12 締切に向けて作業可能**
- **PRJ-020 は Strong Conditional Go** (Review 評価、HITL 第 8 種仕様 6/13 確定が Phase 1 PoC 絶対条件)
- **Owner 5/4 朝の主要アクション**: Q-Mkt 回答不要 (既決済) → 1Password Vault 構築開始のみ

---

## 7. 次アクション

### 7.1 本セッション内
- [x] Q-Mkt 公式採択書 + PRJ-020 案件登録 + スコープ定義
- [x] dashboard 更新 (PRJ-020 追加 + Next ID PRJ-021)
- [x] 5 並列発注 (秘書 / Marketing / Research / Dev / Review)
- [x] DEC-019-026〜030 + DEC-020-001〜003 公式起票
- [x] 第 5 弾連結報告 (本書)
- [ ] Owner 報告 (本セッション総括)

### 7.2 5/4 以降
- [ ] Owner: 1Password Vault 4 系統構築 (`secretary-owner-w0-setup-guide.md` §2)
- [ ] Owner: Spend Cap / OAuth 隔離検証 (5/5-5/7)
- [ ] CEO: 5/7 18:00 検収リハ
- [ ] CEO: 5/8 18:00 検収会議議長 (議題 v4 + 議事録 v2)
- [ ] CEO: 5/15 BAN drill #1 主導
- [ ] CEO: 6/13 Phase 1 完了検収 + PRJ-020 PoC Go/NoGo 判定
- [ ] Marketing: 5/26 portfolio/knowledge v2 中間納品 → 6/12 最終
- [ ] Web 運営: 6/3 HP 改修着手 (トップ訴求 + 事例ページ + Contact form 強化)

---

## 8. 関連ファイル

### 8.1 第 5 弾納品 (本セッション 9 件)
1. `reports/ceo-q-mkt-01-08-formal-adoption-2026-05-03.md` (CEO 自前)
2. `reports/secretary-w0-week1-meeting-agenda-v4.md` (秘書)
3. `reports/secretary-w0-week1-meeting-minutes-template-v2.md` (秘書)
4. `reports/marketing-portfolio-reflection-design-v2.md` (Marketing)
5. `reports/marketing-knowledge-reflection-design-v2.md` (Marketing)
6. `projects/PRJ-020/README.md` + `decisions.md` + `state.md` (CEO 自前)
7. `projects/PRJ-020/reports/ceo-prj020-scope-definition.md` (CEO 自前)
8. `projects/PRJ-020/reports/research-prj020-connection-method.md` (Research)
9. `projects/PRJ-020/reports/dev-prj020-implementation-skeleton.md` (Dev)
10. `projects/PRJ-020/reports/review-prj020-security-risk.md` (Review)
11. `projects/PRJ-020/reports/secretary-prj020-dashboard-and-meeting-integration.md` (秘書)

### 8.2 第 1〜4 弾連結報告
- `reports/ceo-w0-week2-prep-consolidation.md` (第 1 弾)
- `reports/ceo-w0-week2-sop-and-secretary-followup.md` (第 2 弾)
- `reports/ceo-w0-week2-prep-consolidation-final.md` (第 3 弾)
- `reports/ceo-w0-week2-prep-final-followup.md` (第 4 弾)

### 8.3 DEC 起票
- `projects/PRJ-019/decisions.md` (DEC-019-026〜030 + DEC-020-001〜003 = 計 8 件)

### 8.4 dashboard
- `dashboard/active-projects.md` (PRJ-019 50% 維持 + PRJ-020 5% 新規追加 + Next ID PRJ-021)

---

**送付者**: CEO ／ **送付先**: オーナー ／ **送付タイミング**: 2026-05-03 終盤 ／ **次回マイルストーン**: 5/8 18:00 検収会議 (議題 v4 + 議事録 v2 運用)
