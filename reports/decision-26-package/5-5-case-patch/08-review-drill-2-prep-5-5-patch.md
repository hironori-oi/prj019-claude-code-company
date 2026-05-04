# 08-review-drill-2-prep 5/5 case 差分パッチ

> **対象元**: `decision-26-package/08-review-drill-2-prep.md`
> **連動 DEC**: DEC-019-060（status 暫定）
> **適用 trigger**: CEO 判断 confirmed = 議決-26 前倒し 5/5 case 採択

---

## §1 drill #2 実機検証日変更（5/8 → 5/5）

| 項目 | 元値（5/8 case） | 5/5 case 上書き値 |
|---|---|---|
| 実機検証日 | 2026-05-08（金）06:00-08:00 JST | **2026-05-05（火）06:00-08:00 JST** |
| 担当 Review | Review-D R12 | **Review-E R13** |
| 配布 ランブック | drill-2-execution-spec 480 行（5/8 case） | **drill-2-execution-spec-5-5-case 差分追記**（Review-E R13 起案、9 シナリオ × 12 観測ポイント維持、日付のみ 5/5 化） |
| false-positive matrix | v2 402 行（5/8 case） | **v2.1 5/5 case 差分追記**（数値再確認 8 桁一致維持） |

---

## §2 5/5 朝 06:00-08:00 実機検証 timeline

| 時刻 | アクション | 担当 |
|---|---|---|
| 06:00 | 集合 + 環境準備（subscription CLI + denylist v3 + spawn handle） | Review-E R13 |
| 06:15 | 9 シナリオ実機実行開始 | Review-E R13 |
| 07:30 | 9 シナリオ完遂 + 結果集計 + 8 桁一致確認 | Review-E R13 |
| 07:45 | false-positive-matrix v2.1 検証結果 + 50 ctrl 5/12 進捗確認（5/5 時点 67-70% 想定） | Review-E R13 |
| 08:00 | 終了 + 5/5 議決-26 直前 CEO 統合判断 prep（09:00 議決まで 1 時間 buffer） | Review-E R13 + CEO |

---

## §3 9 シナリオ × 12 観測ポイント × 12 PASS criteria（5/5 case 不変）

5/8 case のランブック内容そのまま（9 シナリオ A-I + 12 観測ポイント O-1〜O-12 + 12 PASS criteria P-1〜P-12）。日付依存記述（ヘッダ / 担当者 / 結果報告先）のみ 5/5 case 用に上書き。

---

## §4 drill #2 5/5 case PASS 確証要件

| 軸 | 要件 | 5/5 case 達成見込み |
|---|---|---|
| 軸-2-PASS-1 | drill #1 Full Pass 5/5 維持 | **PASS**（Round 9 Review-B 着地済、5/5 朝も維持） |
| 軸-2-PASS-2 | drill #2 9 シナリオ全 PASS | Review-E R13 5/5 朝実機検証で確認 |
| 軸-2-PASS-3 | false-positive 数値 8 桁一致 | Round 12 Dev-B primitive 委譲で 8 桁一致確証済、5/5 朝も維持見込み |
| 軸-2-PASS-4 | 高ランクセル偽陽性 0 件 | Round 11 Review-C false-positive-matrix v2 で high 4→0 確証、5/5 朝再確認 |

→ 全 4 要件 PASS 達成見込み = **drill #2 5/5 朝実機検証 GO**（Review-E R13 ランブック GO 確証後 confirmed 切替）

---

## §5 5/8 元値との差分要約

本 patch は 08-review-drill-2-prep.md の **実機検証日 / 担当 Review / 配布ランブック バージョン名 / timeline 詳細** を 5/5 case 用に上書きする。9 シナリオ × 12 観測ポイント × 12 PASS criteria の本体内容は 5/8 case と完全同一（日付依存記述のみ差分）。
