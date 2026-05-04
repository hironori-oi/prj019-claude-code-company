# 08-review-drill-2-prep 5/7 case 差分パッチ

> **対象元**: `decision-26-package/08-review-drill-2-prep.md`
> **連動 DEC**: DEC-019-060（status 暫定）
> **適用 trigger**: CEO 判断 confirmed = 議決-26 前倒し 5/7 case 採択

---

## §1 drill #2 実機検証日変更（5/8 → 5/7）

| 項目 | 元値（5/8 case） | 5/7 case 上書き値 |
|---|---|---|
| 実機検証日 | 2026-05-08（金）06:00-08:00 JST | **2026-05-07（木）06:00-08:00 JST** |
| 担当 Review | Review-D R12 | **Review-E R13** |
| 配布 ランブック | drill-2-execution-spec 480 行（5/8 case） | **drill-2-execution-spec-5-7-case 差分追記**（Review-E R13 起案） |
| false-positive matrix | v2 402 行（5/8 case） | **v2.1 5/7 case 差分追記**（数値再確認 8 桁一致維持） |

---

## §2 5/7 朝 06:00-08:00 実機検証 timeline

| 時刻 | アクション | 担当 |
|---|---|---|
| 06:00 | 集合 + 環境準備 | Review-E R13 |
| 06:15 | 9 シナリオ実機実行開始 | Review-E R13 |
| 07:30 | 9 シナリオ完遂 + 結果集計 + 8 桁一致確認 | Review-E R13 |
| 07:45 | false-positive-matrix v2.1 検証結果 + 50 ctrl 5/14 進捗確認（5/7 時点 70-74% 想定） | Review-E R13 |
| 08:00 | 終了 + 5/7 議決-26 直前 CEO 統合判断 prep | Review-E R13 + CEO |

---

## §3 9 シナリオ × 12 観測ポイント × 12 PASS criteria（5/7 case 不変）

5/8 case のランブック内容そのまま。日付依存記述（ヘッダ / 担当者 / 結果報告先）のみ 5/7 case 用に上書き。

---

## §4 drill #2 5/7 case PASS 確証要件

| 軸 | 要件 | 5/7 case 達成見込み |
|---|---|---|
| 軸-2-PASS-1 | drill #1 Full Pass 5/5 維持 | **PASS** |
| 軸-2-PASS-2 | drill #2 9 シナリオ全 PASS | Review-E R13 5/7 朝実機検証で確認 |
| 軸-2-PASS-3 | false-positive 数値 8 桁一致 | **8 桁一致維持見込み** |
| 軸-2-PASS-4 | 高ランクセル偽陽性 0 件 | **0 件維持見込み**|

→ 全 4 要件 PASS 達成見込み = **drill #2 5/7 朝実機検証 GO**（リードタイム 78h 確保で最も確証性が高い前倒し case）

---

## §5 5/8 / 5/5 / 5/6 case との差分要約

本 patch は 08-review-drill-2-prep.md の **実機検証日 / 担当 Review / 配布ランブック バージョン名 / timeline 詳細** を 5/7 case 用に上書きする。5/5 / 5/6 case より 1-2 日後倒しでリードタイム最大 78h 確保、採択確度 87%（最大）。
