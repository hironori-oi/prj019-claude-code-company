# 決議-26 配布資料 №06 — Marketing portfolio metric plan v1.1

> **配布資料 №06 / 12** — Round 10 Marketing-ζ deliverable 3（marketing-portfolio-metric-plan-v1.1.md placeholder）
> **集約日**: 2026-05-04 深夜終盤（Secretary-η dispatch、DEC-019-057 暫定起票直後）
> **原本 (予定)**: `projects/PRJ-019/reports/marketing-portfolio-metric-plan-v1.1.md`（Round 10 Marketing-ζ 並列実行中、本配布資料起票時点未着地）
> **位置付け**: portfolio metric placeholder 27 件中 batch 2 反映 + Round 9 Marketing-D 着地分との差分管理
> **status**: **placeholder（Marketing-ζ Round 10 並列着地待ち）** / Round 10 完遂時に Secretary-η が原本コピーで上書き

---

## §0 placeholder 起票根拠

Secretary-η dispatch 時点で Marketing-ζ deliverable 3「marketing-portfolio-metric-plan-v1.1.md」は Round 10 並列実行中。本配布資料 №06 は **placeholder stub** として先行起票。

## §1 配布資料 №06 の想定スコープ（Marketing-ζ deliverable 3 雛形）

| 項目 | 想定内容 |
|---|---|
| 文書 ID | marketing-portfolio-metric-plan-v1.1 |
| 起票 | Marketing 部門（Marketing-ζ 独立 Agent） |
| 区分 | portfolio metric plan v1.1 — Round 9 Marketing-D batch 1 (8 件) ベースに Round 10 batch 2 (Round 7+8+9 着地分の実数値 + tos-monitor + drill #1 dry exec + needs_scout 13 領域 keyword) を反映 |
| 上位決裁 | DEC-019-052 (b)（portfolio C）/ DEC-019-056（portfolio metric batch 1 = 8 件差替、Round 9 Marketing-D 着地）/ DEC-019-057（案 C 採択で 6/27 朝公開維持に metric 反映） |
| 親文書 | `marketing-portfolio-metrics-substitution-plan.md`（Round 7 Marketing 起案、295 行、27 placeholder 差替 SOP）/ `marketing-round9-portfolio-metric-batch-1.md`（Round 9 Marketing-D 起案、batch 1 = 8 件） |
| ステータス | **placeholder（Round 10 Marketing-ζ 着地待ち）** |

## §2 想定章構成

1. **§1 v1.1 改版概要**: Round 9 Marketing-D batch 1（8 件）→ Round 10 Marketing-ζ batch 2（残 19 件中 5-8 件）の差分
2. **§2 batch 2 反映 metric 一覧**: tos-monitor 偽陽性 4 cell PASS 数値 + drill #1 dry exec Full Pass 5/5 + needs_scout 13 領域 keyword set 391 件 + 必須コントロール 50 達成度 ≥ 95% 数値
3. **§3 batch 3 残置 metric 一覧**: 5/22 内部運用着手後〜6/26 期間で順次差替予定の 11-14 件
4. **§4 6/27 朝公開時の最終 metric 確定タイミング**: 6/26 23:59 JST 締め

---

## Secretary-η 集約フッタ

- **配布資料番号**: №06 / 12
- **原本 file_path (予定)**: `projects/PRJ-019/reports/marketing-portfolio-metric-plan-v1.1.md`
- **集約時 status**: **placeholder（Round 10 並列実行中、未着地）**
- **次回更新**: Round 10 Marketing-ζ 着地時 / 5/7 EOD Owner 配布前

---

## Round 12 Secretary-G 5/8 当日配布版差分追記（2026-05-04 深夜終盤、DEC-019-059 起票直後）

### Round 11 完遂着地での metric 確定値

Round 11 で W3 中核 22 日前倒し既達 + drill #2 spec 完備 + 必須 50 = 64% (32/50) → 95%+ roadmap 確定により、portfolio metric placeholder 27 件中 batch 2 反映可能 metric が増加。

| metric | Round 9 末 | Round 10 末 | Round 11 完遂着地 | Round 12 確定（5/8 当日配布版） |
|---|---|---|---|---|
| tos-monitor 偽陽性 4 cell | placeholder | 4 cell PASS（Dev-β R10） | high 4 → 0 / 月次 < 0.07%（Review-C R11） | **high 4 → 0 / 月次 < 0.07% 確定** |
| drill #1 dry exec | Full Pass 5/5（Review-B R9）| Full Pass 5/5 維持 | Full Pass 5/5 + drill #2 spec 480 行（Review-C R11）| **Full Pass 5/5 + drill #2 5/8 朝実機検証 by Review-D R12** |
| needs_scout 13 領域 keyword set | placeholder | 33 件 patch 着地（Dev-α R10）| **33 → 47 keyword（Dev-A R11、+14 keyword）** | **47 keyword 確定 + NFKC 正規化追加 by Dev-A R12** |
| 必須コントロール 50 達成度 | 35/50 = 70% | 32/50 = 64% | 32/50 = 64% + 95% roadmap 確定（5/15 82% / 5/30 95%+）| **32/50 確定 + 5/15 82% 見込 + 5/30 95%+ 見込** |
| API 累計コスト | $0 | $0 累計 / Round 10 も $0 | $0 累計 / Round 11 も $0（CLI subprocess 経由再構築） | **$0 累計確定（Round 12 も $0 見込）** |

### batch 2 反映 metric 一覧（Round 11 着地分含む）

batch 1 (8 件、Round 9 Marketing-D) に加えて Round 11 着地分 7 件を batch 2 として反映:

| # | metric | 値 | 出典 |
|---|---|---|---|
| 9 | denylist keyword 数 | 47 件（13 領域） | Dev-A R11 |
| 10 | subscription CLI 行数 | 939 行（6-state FSM + 5 段階 strategy） | Dev-D R11 |
| 11 | workspace tests pass 数 | 614 pass（Round 10 末 483 → +131） | Round 10/11 累計 |
| 12 | drill #2 spec 行数 | 480 行 | Review-C R11 |
| 13 | knowledge entries 累計 | 33 entries（patterns 13 + decisions 10 + pitfalls 10）+ INDEX-v2 | Knowledge-G R11 |
| 14 | dynamic disclosure cards 行数 | 486 行 | Marketing-E R11 |
| 15 | case-studies 文字数 | 17,970 字 | Marketing-E R11 |

### batch 3 残置 metric 一覧（5/22 内部運用着手後〜6/26 期間）

11-14 件残置（5/22 push 評価結果 + 5/30 必須 50 = 95%+ 達成数値 + 6/3 Phase 1 sign-off 確定数値 + 6/13 Phase 2 Go/NoGo 数値 + 6/27 朝公開直前最終 metric）。

---

**Round 12 Secretary-G 集約フッタ**

- 差分追記日: 2026-05-04 深夜終盤（DEC-019-059 起票直後）
- 5/8 当日配布 ready: **完遂**
