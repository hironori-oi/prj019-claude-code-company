# 議決-26 配布資料 №08 FINAL（5/5 case）— Review drill #2 prep 5/5 朝 06:00 JST 配布版（**5/7 朝分離標準採用**）

> **5/5 朝 06:00 採決 / drill #2 = 5/7 朝分離**
> **配布資料 №08 / 16** — base + 5/7 朝分離反映 patch 統合済（Round 14 Secretary-I 起票）
> **発行日**: 2026-05-04 深夜終盤（DEC-019-061 起票直後）
> **status**: **5/5 朝 06:00 JST 配布 ready 状態（最終版）**
> **連動 DEC**: DEC-019-060 confirmed + DEC-019-061 confirmed
> **重要変更**: drill #2 = **5/8 朝 → 5/7 朝（CEO 標準推奨採用）**（5/5 patch 内の「5/5 朝実機検証」を本 FINAL では「5/7 朝分離」に再上書き）

---

## §0 base + patch 統合方針 + 5/7 朝分離標準採用

- **第 I 部**: 既存 base 文書 `decision-26-package/08-review-drill-2-prep.md`（Round 11 Review-C drill-2-execution-spec 480 行 + Round 12 Review-D 5/8 朝 ランブック GO + Round 12 Secretary-G 着地、不変）
- **第 II 部**: **drill #2 = 5/7 朝分離標準採用**（CEO 標準推奨「5/5 朝は議決のみ、drill #2 = 5/7 朝 06:00-08:00 分離」採用 = 5/5 採決 abort risk 5% 達成）

5-5-case-patch/08-review-drill-2-prep-5-5-patch.md は「5/5 朝実機検証」を提案していたが、CEO 標準推奨により「5/7 朝分離」を採用、本 FINAL で再上書き。

---

## 第 II 部 5/5 case 上書き差分（**5/7 朝分離標準採用版**）

### §1 drill #2 実機検証日変更（**5/8 → 5/7、5/5 採決と切離**）

| 項目 | base 値（5/8 case） | 5/5 patch 値 | **5/5 FINAL 上書き値（5/7 分離採用）** |
|---|---|---|---|
| 実機検証日 | 2026-05-08（金）06:00-08:00 JST | 2026-05-05（火）06:00-08:00 JST | **2026-05-07（木）06:00-08:00 JST**（CEO 標準推奨採用） |
| 担当 Review | Review-D R12 | Review-E R13 | **Review-F R14**（5/5 採決と切離分離担当） |
| 配布 ランブック | drill-2-execution-spec 480 行（5/8 case） | drill-2-execution-spec-5-5-case 差分追記 | **drill-2-execution-spec-5-7-case 差分追記**（Review-F R14 起案、9 シナリオ × 12 観測ポイント維持、日付のみ 5/7 化） |
| false-positive matrix | v2 402 行（5/8 case） | v2.1 5/5 case 差分追記 | **v2.2 5/7 case 差分追記**（数値再確認 8 桁一致維持） |

### §2 5/7 朝 06:00-08:00 実機検証 timeline（5/5 採決後 2 日間隔で分離実施）

| 時刻 | アクション | 担当 |
|---|---|---|
| 06:00 | 集合 + 環境準備（subscription CLI + denylist v3 + spawn handle）| Review-F R14 |
| 06:15 | 9 シナリオ実機実行開始 | Review-F R14 |
| 07:30 | 9 シナリオ完遂 + 結果集計 + 8 桁一致確認 | Review-F R14 |
| 07:45 | false-positive-matrix v2.2 検証結果 + 50 ctrl 5/7 進捗確認（5/7 時点 70-72% 想定） | Review-F R14 |
| 08:00 | 終了 + 5/7 結果報告書（議決-26 採決後の運用継続 prep）| Review-F R14 + CEO |

→ **5/5 採決と完全分離**（5/5 採決は drill #2 結果に conditional でない構造、abort risk 5% 達成）

### §3 9 シナリオ × 12 観測ポイント × 12 PASS criteria（5/7 case 不変）

5/8 case のランブック内容そのまま（9 シナリオ A-I + 12 観測ポイント O-1〜O-12 + 12 PASS criteria P-1〜P-12）。日付依存記述（ヘッダ / 担当者 / 結果報告先）のみ 5/7 case 用に上書き。

### §4 drill #2 5/7 case PASS 確証要件

| 軸 | 要件 | 5/7 case 達成見込み |
|---|---|---|
| 軸-2-PASS-1 | drill #1 Full Pass 5/5 維持 | **PASS**（Round 9 Review-B 着地済、5/5 採決時も 5/7 検証時も維持） |
| 軸-2-PASS-2 | drill #2 9 シナリオ全 PASS | Review-F R14 5/7 朝実機検証で確認 |
| 軸-2-PASS-3 | false-positive 数値 8 桁一致 | Round 12 Dev-B primitive 委譲で 8 桁一致確証済、5/7 朝も維持見込み |
| 軸-2-PASS-4 | 高ランクセル偽陽性 0 件 | Round 11 Review-C false-positive-matrix v2 で high 4→0 確証、5/7 朝再確認 |

→ 全 4 要件 PASS 達成見込み = **drill #2 5/7 朝実機検証 GO**（5/5 採決 abort risk 5% は drill #2 結果非依存で達成）

### §5 5/5 採決 abort risk 5% 達成構造

- 5/5 朝 09:00 採決 = 議決-26 5 軸の **roadmap commit** で採決（drill #2 = 当日実機検証ではなく **5/7 朝分離検証**で軸-2 PASS roadmap 確認）
- drill #1 Full Pass 5/5（Round 9 着地済）+ drill #2 spec 完備（Round 11 Review-C）+ false-positive matrix v2（Round 11 Review-C）= **採決時点で軸-2 PASS roadmap 既確証**
- drill #2 実機検証は 5/7 朝分離で 5/5 採決の前提とせず = **abort risk 5%**（採決時点に未検証の不確定要素なし）
- 5/7 朝実機検証で万が一 NG が発見された場合 = 5/8-9 で fix + 議決-26 採択取消し or 条件付き運用設定（fallback path 確保、6/27 朝公開 confidence 92% 維持）

### §6 5/8 元値 + 5/5 patch との差分要約

本 FINAL は 08-review-drill-2-prep.md base + 5/5 patch（「5/5 朝実機検証」案）から、**CEO 標準推奨「drill #2 = 5/7 朝分離」採用**に再上書きした最終版。9 シナリオ × 12 観測ポイント × 12 PASS criteria の本体内容は 5/8 case と完全同一（実機検証日 + 担当 Review + ランブック バージョン名 + timeline 詳細のみ差分）。

---

## §7 Footer

- **発行**: 2026-05-04 深夜終盤（Round 14 Secretary-I 担当）
- **位置付け**: 5/5-FINAL bundle №08（base + 5/7 朝分離標準採用、CEO 推奨適用）
- **当日読み所要**: 4 分
- **重要度**: 必読（軸-2 寄与、abort risk 5% 達成構造説明）
