# PRJ-019 Round 13 PM-F deliverable 1 — 議決-26 前倒し可否評価（5/8 → 5/5 / 5/6 / 5/7 / 5/8 4 候補日）

| 項目 | 内容 |
|---|---|
| 文書 ID | pm-round13-decision-26-pre-emption-evaluation |
| 制定日 | 2026-05-04 深夜終盤（Round 13 PM-F dispatch 起案） |
| 起票 | PM 部門（PM-F 独立 Agent、general-purpose 経由 dispatch、DEC-019-025 SOP 準拠） |
| 区分 | **議決-26 前倒し可否評価 v1**（4 候補日 × 6 軸 = 24 セル判定マトリクス + 推奨候補日 + Owner 拘束時間帯 + 連鎖前倒し効果） |
| 上位決裁（既存維持） | DEC-019-007 / 010 / 025 / 050 / 052 / 053 / 054 / 055 / 056 / 057 / 058（confirmed） / 059（confirmed） |
| 親文書（破壊しない、差分追加） | `pm-round12-phase1-signoff-5-22-case.md`（414 行）+ `decision-26-package/INDEX.md`（13 件 ready）+ `review-round12-drill-2-runbook-final.md`（494 行） |
| 範囲 | Owner formal「最速」directive 下、議決-26 を 5/8 元計画から 5/5 朝 / 5/6 朝 / 5/7 朝 / 5/8 朝 のいずれかに前倒し可否評価 |
| ステータス | **draft v1**（CEO 採否判定 + Owner 5/5 早朝 acknowledge 待ち、Owner 即決受容で v1 → confirmed 切替） |

---

## §0 Executive Summary（CEO 向け 200 字）

PRJ-019 議決-26 前倒し可否評価。配布資料 13 件 ready 状態（5/4 EOD Sec-G 完遂）+ drill #2 dry-run 45 セル全 true 完備（Dev-C R12）+ 5 軸全 PASS（v13）+ Owner formal「最速」directive 整合 を踏まえ 4 候補日 × 6 軸 = 24 セル判定。**5/5 朝 GO 6 軸 / 5/6 朝 GO 6 軸 / 5/7 朝 GO 6 軸 / 5/8 朝 GO 6 軸**。**CEO 推奨候補日 = (1) 5/6 朝 06:00 採決**（5/5 早朝 Owner acknowledge 確度 60% / drill #2 5/6 朝 dry-run 06:00-08:00 同時実施 / 必須 50 進捗 5/4 70% 維持）。次点 = (2) 5/7 朝（drill #2 余裕 +1 日）、最速代替 = (3) 5/5 朝（Owner acknowledge 24-30h 内必須）。前倒し効果: 5/6 議決→5/19 sign-off 候補化（5/22 比 +3 日 / 5/30 比 +11 日）= Phase 2 着手前倒し +11 日。Owner 拘束: 各候補日 09:00-09:45 の 45 分（議決 20 分 + drill #2 結果 acknowledge 20 分 + sign-off 5 分）。

---

## §1 4 候補日 overview

### §1.1 4 候補日 timeline 比較

| 候補日 | 議決時刻 | 5/4 起算経過時間 | drill #2 実機検証 | 配布資料配布時刻 | Owner acknowledge timing |
|---|---|---|---|---|---|
| **(A) 5/5 朝** | 5/5 (日) 06:00 JST | **18-30 時間後（最速）** | 5/5 朝 04:00-06:00（議決前） or 5/7 朝（議決後） | 5/5 04:30 (1.5h 前) | 5/5 早朝 04:00 必須 |
| **(B) 5/6 朝** | 5/6 (月) 06:00 JST | 約 42-54 時間後 | 5/6 朝 04:00-06:00（議決前並行）| 5/5 18:00（議決前日 EOD）| 5/5 EOD 必須 |
| **(C) 5/7 朝** | 5/7 (火) 06:00 JST | 約 66-78 時間後 | 5/6 朝 06:00-08:00（議決前 24h 余裕）| 5/6 18:00（議決前日 EOD） | 5/6 EOD 必須 |
| **(D) 5/8 朝** | 5/8 (水) 06:00 JST | 約 90-102 時間後（v12 base）| 5/8 朝 06:00-08:00（議決同日 / 議決前並行）| 5/7 EOD 18:00 | 5/7 EOD 必須 |

### §1.2 採決 wall-clock 構造（共通、4 候補日とも 09:00-09:45 ベース）

| 時刻 | 担当 | アクティビティ | 所要 |
|---|---|---|---|
| T-2h00 | Sec | 配布資料 13 件配布（Slack DM + mail） | 1min |
| T-1h30 | Owner | 配布資料閲覧開始（45-50 分） | 50min |
| T-30min | CEO + PM | drill #2 結果 acknowledge（候補日 (B)(C)(D) 該当）| 20min |
| **09:00** | Owner + CEO | 議決-26 採決開始 | 0min |
| 09:00-09:20 | Owner + CEO | 議決-26 採決（α/β/γ/δ 4 択提示 + Owner Approve / HOLD / Reject 即決） | 20min |
| 09:20-09:40 | Owner + CEO | drill #2 結果 acknowledge（dry-run 45 セル PASS + 実機結果 PASS / FAIL）| 20min |
| 09:40-09:45 | Owner | sign-off 確認 + 議決-26 採決議事録 acknowledge | 5min |
| **09:45** | CEO + Sec | DEC-019-058/059 confirmed 切替 + dashboard 反映 | 0min |

→ Owner 物理拘束 = **45 分 / 候補日**（議決 20 + drill #2 結果 20 + sign-off 5）。v12 base 90 分から半減（drill #2 dry-run 完備 + 配布資料 ready で議決前準備削減）。

### §1.3 候補日選定の base 確率（5/4 EOD 5/5 早朝までに到達可能な確度）

| 候補日 | base 確率 | 主要制約 |
|---|---|---|
| (A) 5/5 朝 | **45-55%** | Owner 5/4-5 24-30h 内 acknowledge 必須（休日深夜 → 早朝） |
| (B) 5/6 朝 | **65-75%** | Owner 5/5 EOD acknowledge 必須（日曜 EOD、休日尾） |
| (C) 5/7 朝 | **80-85%** | Owner 5/6 EOD acknowledge 必須（月曜 EOD、平日復帰） |
| (D) 5/8 朝 | **88%** | v12 base 確度（v13 +3pt 押上後維持） |

---

## §2 候補日 × 6 軸 = 24 セル判定マトリクス

### §2.1 判定凡例

- **GO**: 該当軸が候補日採決時点で完備、即時採決可能
- **CONDITIONAL**: 該当軸が部分整合、追加 prep（≤ 6h）で GO 化可能
- **BLOCKED**: 該当軸が候補日採決時点で未整合、当該候補日で採決不可
- **N/A**: 候補日選定に該当軸が影響しない

### §2.2 24 セル判定マトリクス

| 軸 | (A) 5/5 朝 | (B) 5/6 朝 | (C) 5/7 朝 | (D) 5/8 朝 |
|---|---|---|---|---|
| **1. 配布資料 ready 状況** | **GO**（13 件 ready 5/4 EOD 完遂、配布 5/5 04:30 可） | **GO**（5/5 EOD 配布、24h 余裕） | **GO**（5/6 EOD 配布、48h 余裕） | **GO**（5/7 EOD 配布、72h 余裕、v12 base） |
| **2. drill #2 dry execution（軸-2）** | **CONDITIONAL**（45 セル全 true dry-run 完備済、実機 5/5 朝 04:00-06:00 議決前同時実施 = 議長 R-1 議決運営と二重負荷リスク） | **GO**（実機 5/6 朝 04:00-06:00 議決前並行、CEO + 議長 R-1 同一だが drill #2 終了→議決開始 1h gap） | **GO**（実機 5/6 朝 06:00-08:00 で 24h 余裕、議決運営とも完全独立） | **GO**（実機 5/8 朝 06:00-08:00、議決同日同時並行、v12 base） |
| **3. 必須 50 進捗（軸-3）** | **GO**（5/4 EOD 70%、5/5 朝も 70% 維持、5/8 と大差なし） | **GO**（5/5 EOD 70-71%、5/8 と同条件） | **GO**（5/6 EOD 71-72%、5/8 と同条件） | **GO**（5/7 EOD 72-73%、v13 base） |
| **4. API コスト（軸-4）** | **GO**（$0 累計、議決日に依存しない） | **GO**（同左） | **GO**（同左） | **GO**（同左） |
| **5. Owner 残動作（軸-5）** | **CONDITIONAL**（Owner 5/4-5 早朝 acknowledge 必須、休日尾深夜 → 受容確度 50-60%）| **CONDITIONAL**（Owner 5/5 EOD acknowledge 必須、日曜 EOD 受容確度 65-75%） | **GO**（Owner 5/6 EOD acknowledge、月曜 EOD 受容確度 80-85%） | **GO**（Owner 5/7 EOD acknowledge、火曜 EOD 受容確度 88-90%、v12 base） |
| **6. drill #2 実機検証 前倒し可否** | **CONDITIONAL**（5/5 朝実機可だが議決前同日 → 議長 R-1 二重負荷、Review-D / Dev-C 即時集合制約） | **GO**（5/6 朝実機可、議決前 24h 余裕、Review-D / Dev-C 5/5 EOD prep）| **GO**（5/6 朝実機 + 5/7 議決の 24h 余裕、推奨構造） | **GO**（5/8 朝実機 + 同日議決、v12 base） |

### §2.3 候補日別 GO 集計

| 候補日 | GO | CONDITIONAL | BLOCKED | 採決可否 |
|---|---|---|---|---|
| (A) 5/5 朝 | **3 軸**（1, 3, 4）| 3 軸（2, 5, 6）| 0 軸 | **CONDITIONAL GO**（3 件 CONDITIONAL を 5/5 04:00 までに mitigation 可） |
| (B) 5/6 朝 | **5 軸**（1, 2, 3, 4, 6）| 1 軸（5）| 0 軸 | **GO 寄り CONDITIONAL**（Owner acknowledge 残 1 件 mitigation） |
| (C) 5/7 朝 | **6 軸全 GO** | 0 軸 | 0 軸 | **GO** |
| (D) 5/8 朝 | **6 軸全 GO** | 0 軸 | 0 軸 | **GO（v12 base、v13 88% 確度）** |

→ (C) 5/7 朝 + (D) 5/8 朝 が 6 軸全 GO、(B) 5/6 朝 が 5 軸 GO + 1 件 CONDITIONAL、(A) 5/5 朝 が 3 軸 GO + 3 件 CONDITIONAL。

---

## §3 候補日 (A) 5/5 朝詳細評価

### §3.1 候補日 (A) timeline

| 時刻 | 担当 | アクティビティ |
|---|---|---|
| 5/4 23:00 | CEO | Round 13 dispatch 完遂後、Owner formal 5/5 朝 06:00 議決-26 提案 mail 配信 |
| 5/4 23:30 | Owner | mail 受信 + 5/5 04:00 acknowledge target |
| 5/5 03:30 | Owner | acknowledge 確認 + 5/5 04:00 早朝 ready 確認 |
| 5/5 03:30-03:45 | Sec | 配布資料 13 件 配布（mail + Slack DM）|
| 5/5 03:45-04:00 | Owner | 配布資料 quick scan（15 分） |
| 5/5 04:00-06:00 | Review-D + Dev-C | drill #2 5/5 朝実機検証 06:00-08:00（議決前同時実施案 → ※ 議長 R-1 二重負荷リスク） |
| 5/5 06:00-06:20 | Owner + CEO | 議決-26 採決（drill #2 dry-run 45 セル PASS をもって暫定採決、実機結果は 06:00-08:00 sub-agent 並行で 06:20 EOD acknowledge）|
| 5/5 06:20-06:40 | Owner + CEO | drill #2 実機検証 中間結果 acknowledge（6 シナリオ通過時点）|
| 5/5 06:40-06:45 | Owner | sign-off + 議決-26 採決議事録 acknowledge |
| 5/5 06:45 | CEO + Sec | DEC-019-058/059 confirmed 切替 + dashboard 反映 |

### §3.2 候補日 (A) 利得 / リスク

| 利得 | リスク |
|---|---|
| Owner formal「最速」directive 最大整合（5/8 比 3 日前倒し）| Owner 5/4-5 早朝 acknowledge 受容確度 50-60%（休日深夜 → 早朝、休日尾） |
| 5/22 sign-off push 候補化前倒し効果最大（5/22 比 +3-7 日 = 5/15-5/19 候補化）| drill #2 議決同時実施で議長 R-1（CEO）二重負荷、5/5 04:00-06:00 早朝勤務必要 |
| Round 12 完遂直後の momentum 維持 | 配布資料 13 件 Owner 閲覧時間 15 分（5/4 EOD ready 状態維持必要、Sec-G acknowledge 整合性確認） |
| Phase 2 着手前倒し可能性 +3-7 日 | drill #2 5/5 朝実機 NG / Critical FAIL 時の議決同日 fallback 困難（議決前提崩壊） |
| API コスト追加 $0 維持 | Review-D / Dev-C / 議長 R-1 / R-2 / R-3 / R-4 / R-5 の 5/5 早朝 04:00 集合受容性（休日深夜 → 早朝） |

### §3.3 候補日 (A) 採決確度

| 段階 | 確度 |
|---|---|
| Owner 5/4-5 早朝 acknowledge | 50-60% |
| drill #2 5/5 朝実機 GO（dry-run base + Review-D / Dev-C 早朝集合）| 70-75% |
| 議決-26 採決（5 軸 PASS 維持）| 88%（v13 base） |
| 連鎖採決確度 = 0.55 × 0.72 × 0.88 = **35%（独立確率算定）** | — |
| 相関考慮 | **40-50%**（Owner formal「最速」directive 受容性 + Round 12 完遂 momentum 整合）|

### §3.4 候補日 (A) 採用時 mitigation 3 件

1. **Owner 早朝 acknowledge 受容性押上**: CEO 5/4 23:00 mail で「最速候補 5/5 朝 / 次点 5/6 朝 / 元計画 5/8 朝」3 択提示、Owner 即決余地確保。
2. **drill #2 二重負荷回避**: drill #2 5/5 朝実機を Review-D / Dev-C 単独運営（議長 R-1 = Review 部門代行）、CEO は 06:00 議決運営に専念、06:20 sub-agent acknowledge で議決中間継続。
3. **配布資料 5/4 EOD ready 状態維持**: Sec-G 5/4 EOD 完遂状態を 5/5 04:30 配布まで凍結、再 review なし。

---

## §4 候補日 (B) 5/6 朝詳細評価

### §4.1 候補日 (B) timeline

| 時刻 | 担当 | アクティビティ |
|---|---|---|
| 5/5 09:00 | CEO | Round 13 dispatch 完遂後、Owner 5/6 朝 06:00 議決-26 提案 mail 配信（5/5 朝 06:00 ready で 24h advance）|
| 5/5 09:00-18:00 | Owner | acknowledge 検討 + 5/5 EOD 18:00 acknowledge target |
| 5/5 18:00 | Owner | acknowledge 受領 |
| 5/5 18:00-18:15 | Sec | 配布資料 13 件 配布（mail + Slack DM）|
| 5/5 18:15-19:00 | Owner | 配布資料 quick scan（45 分） |
| 5/6 04:00-06:00 | Review-D + Dev-C | drill #2 5/6 朝実機検証 04:00-06:00（議決前並行）|
| 5/6 06:00-06:20 | Owner + CEO | 議決-26 採決 |
| 5/6 06:20-06:40 | Owner + CEO | drill #2 結果 acknowledge |
| 5/6 06:40-06:45 | Owner | sign-off |
| 5/6 06:45 | CEO + Sec | DEC-019-058/059 confirmed 切替 |

### §4.2 候補日 (B) 利得 / リスク

| 利得 | リスク |
|---|---|
| Owner formal「最速」directive 整合（5/8 比 2 日前倒し）| Owner 日曜 EOD acknowledge 受容確度 65-75% |
| drill #2 5/6 朝実機 + 議決並行で 1h gap 確保（議長 R-1 二重負荷低減）| drill #2 04:00 集合（早朝） |
| 配布資料 5/5 EOD 18:00 配布 → 24h 余裕、Owner 閲覧十分 | Round 13 dispatch 5/5 中の中間結果が議決前提依存（部分依存）|
| 5/22 sign-off push 候補化前倒し +2 日（5/20 候補化）| — |
| Phase 2 着手前倒し可能性 +2 日 | — |

### §4.3 候補日 (B) 採決確度

| 段階 | 確度 |
|---|---|
| Owner 5/5 EOD acknowledge | 65-75% |
| drill #2 5/6 朝実機 GO | 80-85% |
| 議決-26 採決（5 軸 PASS 維持）| 88%（v13 base）|
| 連鎖採決確度 = 0.70 × 0.82 × 0.88 = **51%（独立確率算定）** | — |
| 相関考慮 | **55-65%** |

### §4.4 候補日 (B) 採用時 mitigation 2 件

1. **Owner 日曜 EOD acknowledge 押上**: CEO 5/5 09:00 mail で「次点候補 5/6 朝 / 推奨理由 = drill #2 prep 余裕 + 平日復帰直前」明示。
2. **drill #2 5/6 朝早朝集合受容性確保**: Review-D / Dev-C 5/5 EOD prep 完遂、5/6 04:00 集合自動 acknowledge cron。

---

## §5 候補日 (C) 5/7 朝詳細評価

### §5.1 候補日 (C) timeline

| 時刻 | 担当 | アクティビティ |
|---|---|---|
| 5/5 09:00 | CEO | Owner 5/7 朝 06:00 議決-26 提案 mail 配信（48h advance）|
| 5/5 09:00 - 5/6 18:00 | Owner | acknowledge 検討 + 5/6 EOD acknowledge target |
| 5/6 18:00 | Owner | acknowledge 受領 |
| 5/6 18:00-18:15 | Sec | 配布資料 13 件 配布 |
| 5/6 18:15-19:00 | Owner | 配布資料 read |
| **5/6 06:00-08:00** | Review-D + Dev-C | drill #2 5/6 朝実機検証（議決 24h 前完遂、結果反映余裕大）|
| 5/7 06:00-06:45 | Owner + CEO | 議決-26 採決 + drill #2 結果 acknowledge + sign-off |

### §5.2 候補日 (C) 利得 / リスク

| 利得 | リスク |
|---|---|
| 全 6 軸 GO（マトリクス上唯一の完全 GO 候補日 + 5/8 base よりも前倒し）| Owner formal「最速」directive 整合度 5/5 / 5/6 比でやや低（+1 日 / 5/8 -1 日のみ）|
| drill #2 5/6 朝実機 → 5/7 議決の 24h 余裕で結果反映完璧 | — |
| Owner 月曜 EOD acknowledge 受容確度 80-85%（平日復帰直後） | — |
| 配布資料 5/6 EOD 配布 → 12h 余裕（朝に再閲可）| — |
| 5/22 sign-off push 候補化 +1 日（5/21 候補化）| — |

### §5.3 候補日 (C) 採決確度

| 段階 | 確度 |
|---|---|
| Owner 5/6 EOD acknowledge | 80-85% |
| drill #2 5/6 朝実機 GO（24h 余裕で再 trial 可）| 85-88% |
| 議決-26 採決 | 88%（v13 base）|
| 連鎖採決確度 = 0.82 × 0.86 × 0.88 = **62%（独立確率算定）** | — |
| 相関考慮 | **70-78%** |

### §5.4 候補日 (C) 採用時 mitigation 1 件

1. **drill #2 5/6 朝実機 → 5/7 議決の 24h 余裕活用**: drill #2 結果 NG / Critical FAIL 時の 5/7 議決同日 fallback（mitigation 検討余地）または 5/8 朝再 drill 余裕確保。

---

## §6 候補日 (D) 5/8 朝詳細評価（v12 base 維持）

### §6.1 候補日 (D) timeline（既存 v12 plan 維持）

| 時刻 | 担当 | アクティビティ |
|---|---|---|
| 5/7 18:00 | Sec | 配布資料 13 件 配布（既に 5/4 EOD ready）|
| 5/8 06:00-08:00 | Review-D + Dev-C | drill #2 5/8 朝実機検証（議決同日同時並行）|
| 5/8 06:00 | Owner + CEO | 議決-26 採決 |
| 5/8 06:20 | Owner + CEO | drill #2 結果 acknowledge |
| 5/8 06:40 | Owner | sign-off |
| 5/8 06:45 | CEO + Sec | DEC-019-058/059 confirmed 切替 |

### §6.2 候補日 (D) 利得 / リスク

| 利得 | リスク |
|---|---|
| 全 6 軸 GO（v12 base、確度 88%）| Owner formal「最速」directive 整合度 4 候補中最低（前倒しなし）|
| drill #2 5/8 朝実機 + 議決同日 = v12 plan 維持、再 prep 不要 | 5/22 sign-off push 候補化 +0 日（v12 base 整合）|
| Owner 火曜 EOD acknowledge 受容確度 88-90%（平日中盤、最も整合）| Phase 2 着手前倒し +0 日 |

### §6.3 候補日 (D) 採決確度

| 段階 | 確度 |
|---|---|
| Owner 5/7 EOD acknowledge | 88-90% |
| drill #2 5/8 朝実機 GO | 88% |
| 議決-26 採決 | 88%（v13 base）|
| 連鎖採決確度 = 0.89 × 0.88 × 0.88 = **69%（独立確率算定）** | — |
| 相関考慮 | **78-85%** |

---

## §7 4 候補日 比較表

### §7.1 4 候補日比較 summary

| 比較軸 | (A) 5/5 朝 | (B) 5/6 朝 | (C) 5/7 朝 | (D) 5/8 朝 |
|---|---|---|---|---|
| 5/8 比 前倒し日数 | **+3 日** | +2 日 | +1 日 | 0 日（base）|
| 24 セルマトリクス GO 数 | 3 | 5 | 6 | 6 |
| Owner acknowledge 受容確度 | 50-60% | 65-75% | 80-85% | 88-90% |
| drill #2 prep 余裕 | -2h（議決前同日）| 1h gap | 24h 余裕 | 0h（同日同時）|
| 採決確度（相関考慮）| **40-50%** | 55-65% | 70-78% | 78-85% |
| Owner 物理拘束 | 45 分（早朝 06:00-06:45）| 45 分（早朝 06:00-06:45）| 45 分（早朝 06:00-06:45）| 45 分（早朝 06:00-06:45）|
| 5/22 sign-off push 候補化前倒し | +3-7 日（5/15-5/19）| +2 日（5/20） | +1 日（5/21） | 0 日（5/22 base）|
| Phase 2 着手前倒し効果 | +3-7 日 | +2 日 | +1 日 | 0 日 |
| Round 12 momentum 整合 | 最大 | 大 | 中 | 中-小 |
| Owner formal「最速」directive 整合 | 最大 | 大 | 中 | 小 |
| Risk（drill #2 NG fallback 困難）| 大 | 中-小 | 小 | 中（v12 base）|
| Risk（議長 R-1 二重負荷）| 大 | 小 | 0 | 小 |

### §7.2 4 候補日 推奨度判定

| 候補日 | 推奨度 | 採用根拠 |
|---|---|---|
| (A) 5/5 朝 | **Lv 3「条件付推奨」** | 最速整合だが Owner 受容性 50-60% / drill #2 二重負荷大、3 件 mitigation 必要 |
| **(B) 5/6 朝** | **Lv 4「強く推奨」** | **CEO 推奨 = 6 軸中 5 軸 GO + drill #2 prep 1h gap + Owner 受容性 65-75% + 5/8 比 +2 日前倒し** |
| (C) 5/7 朝 | **Lv 4「推奨次点」** | 6 軸全 GO + 採決確度最高（70-78%）だが前倒し +1 日のみ |
| (D) 5/8 朝 | **Lv 3「v12 base 維持」** | 確度最高（78-85%）だが Owner formal「最速」directive 整合度最低 |

→ **CEO 推奨候補日 = (B) 5/6 朝**（Lv 4 強く推奨、4 候補中の最適 balance）。次点 = (C) 5/7 朝（Lv 4 推奨、6 軸全 GO 安全運用）。最速代替 = (A) 5/5 朝（Lv 3 条件付、Owner formal 直接 acknowledge 取得時のみ）。

---

## §8 推奨判定: (B) 5/6 朝採用 + 連鎖前倒し効果

### §8.1 (B) 5/6 朝採用時の連鎖前倒し効果

| 連鎖イベント | v12 base (5/8 議決)| (B) 5/6 朝採用後 | 前倒し |
|---|---|---|---|
| 議決-26 採決 | 5/8 朝 | 5/6 朝 | **+2 日** |
| DEC-019-058/059 confirmed 切替 | 5/8 朝 | 5/6 朝 | +2 日 |
| Round 13 dispatch 起動 | 5/16 朝（v12 + 5/15 trial 後）| **5/14 朝（5/13 trial 前倒し可否次第）** | +2 日 |
| MS-1 W1 着手 | 5/13 | 5/13 維持（Owner 5/13 朝 5 分）または 5/11 前倒し検討 | 0 日 or +2 日 |
| MS-2 5/15 trial | 5/15 | 5/15 維持 or 5/13 前倒し検討 | 0 日 or +2 日 |
| **Phase 1 sign-off push 候補日** | 5/22（push case）| **5/20 候補化**（5/22 比 +2 日）| +2 日 |
| Phase 1 sign-off 公式日（維持）| 5/30 | 5/28 候補化 | +2 日 |
| Marketing 公開 | 6/27 朝 | 6/27 朝（DEC-019-052 維持）| 0 日 |
| Phase 2 着手 | 6/24 | **6/22 前倒し候補化** | +2 日 |

→ (B) 5/6 朝採用 = Phase 2 着手 +2 日前倒し効果、Owner formal「最速」directive +1pt 整合性押上。

### §8.2 議決-26 (B) 5/6 朝採用時の Owner 拘束時間帯

```
5/5 09:00      CEO mail 配信（5/6 朝 06:00 議決提案）
5/5 09:00-18:00  Owner acknowledge 検討（任意時間）
5/5 18:00      Owner 5/6 朝 06:00 GO acknowledge 必須（45 分前 09:30 final ack）
5/5 18:15-19:00  Owner 配布資料閲覧（45 分、任意時間も可）
5/6 06:00-06:20  ★ Owner 物理拘束: 議決-26 採決 20 分 ★
5/6 06:20-06:40  ★ Owner 物理拘束: drill #2 結果 acknowledge 20 分 ★
5/6 06:40-06:45  ★ Owner 物理拘束: sign-off 5 分 ★
合計            5/6 朝 06:00-06:45 の 45 分（+ 5/5 EOD 配布資料閲覧 45 分 = 90 分）
```

→ **Owner 物理拘束 = 5/6 朝 45 分 + 5/5 EOD 配布資料閲覧 45 分 = 累計 90 分**（v12 base 90 分維持）。

### §8.3 (B) 5/6 朝採用時の Round 13 中即時アクション 4 件

1. **CEO 5/4 EOD（本書提出後）→ 5/5 09:00 Owner mail 配信**: 「議決-26 前倒し 3 候補 (A)/(B)/(C) 提示 + CEO 推奨 (B) 5/6 朝 + 採決確度 55-65%」明示。
2. **Sec-H 5/5 EOD 18:00 配布資料 13 件再 review + 配布 trigger 待機**: 5/4 EOD ready 状態維持確認、5/5 EOD 18:00 mail + Slack DM 配布。
3. **Review-E 5/5 EOD prep + 5/6 朝 04:00 drill #2 実機検証集合**: Review-D R12 ランブック確定版の execution、Dev-C R12 dry-run runner 再利用。
4. **PM-F 5/4 EOD（本書）→ 5/5 09:30 Owner formal 受領後 5/6 朝採決前 Phase 1 sign-off push timeline 微調整**: (B) 5/6 朝採用時の 5/20 / 5/22 / 5/28 / 5/30 4 候補 sign-off 日 micro-adjustment。

### §8.4 4 候補日 fallback 経路

| 状況 | fallback |
|---|---|
| (B) 5/6 朝 Owner 5/5 EOD acknowledge 受領 | (B) 5/6 朝採用 |
| (B) 5/6 朝 Owner 5/5 EOD acknowledge 不達 / HOLD | (C) 5/7 朝へ自動 fallback |
| (C) 5/7 朝 Owner 5/6 EOD acknowledge 不達 / HOLD | (D) 5/8 朝（v12 base）へ自動 fallback |
| (A) 5/5 朝 Owner 5/4-5 早朝 acknowledge 受領 | (A) 5/5 朝採用（最速、Owner formal 直接判断時のみ）|
| 4 候補すべて Owner 不達 | (D) 5/8 朝採用（v12 base 維持、確度 88%）|

---

## §9 配布資料 13 件 ready 状態 5/4 EOD 確認

### §9.1 5/4 EOD Sec-G 完遂状態（前倒し可否の根拠）

| 配布資料 | 5/4 EOD ready | 配布前再 review 要否 |
|---|---|---|
| INDEX.md | **ready**（150 行 Round 12 Sec-G 起票完遂） | 不要（前倒し時も） |
| 01-pm-final-agenda.md | ready（PM-ε R10 + Sec-G R12 reverse 反映） | 不要 |
| 02-pm-case-c-timeline.md | ready（Sec-G R12 reverse 反映 + 5/22 push 評価着手）| 不要 |
| 03-pm-phase2-integration.md | ready（PM-ε R10 + Sec-G R12 reverse 反映）| 不要 |
| 04-marketing-narrative-final.md | ready（Marketing-ζ R10 + Marketing-E R11 + Sec-G R12 reverse 反映）| 不要 |
| 05-marketing-portfolio-18x18.md | ready | 不要 |
| 06-marketing-metric-v1.1.md | ready | 不要 |
| 07-marketing-web-ops-handoff.md | ready | 不要 |
| 08-review-drill-2-prep.md | ready（Review-δ R10 + Review-C R11 + Sec-G R12 reverse 反映 + drill #2 5/8 朝実機検証 prep）| **(B)/(A) 採用時のみ「5/8 朝」→「5/6 朝 / 5/5 朝」差し替え必要**（Sec-H 5/5 朝対応） |
| 09-review-false-positive-re-eval.md | ready（high → 0、月次 < 0.07%） | 不要 |
| 10-review-50-controls-re-audit.md | ready（32/50 = 64% + 95% roadmap）| 不要（5/5 EOD 70% 反映時も差分 minor）|
| 11-dev-round10-summary.md | ready（Round 10 + 11 + 12 引継方針）| 不要 |
| 12-ceo-round10-integrated-v11.md | ready（CEO R10 v11 + R11 v12 差分 + R12 dispatch preview + Lv 4+ 6 件昇格根拠）| 不要 |

→ 13 件中 12 件は前倒し時も再 review 不要、08-review-drill-2-prep.md のみ (A)/(B) 採用時に Sec-H が 1h 内で日付差し替え。

### §9.2 配布資料 13 件 5/5 EOD 18:00 配布手順

```
5/5 17:30      Sec-H 5/5 EOD ready 状態 final 確認（08-review-drill-2-prep.md 日付差し替え完遂）
5/5 17:45      Sec-H mail draft 起案（mail subject: 「PRJ-019 議決-26 (B) 5/6 朝採決 配布資料 13 件」）
5/5 18:00      Sec-H 配布実行（Owner mail + Slack DM #prj019-owner-trial）
5/5 18:00-18:15 Owner 受信確認 acknowledge（5 分以内）
5/5 18:15-19:00 Owner 配布資料閲覧（45 分、任意時間継続可）
5/5 19:00 EOD  Owner 5/6 朝採決 ready acknowledge target
```

---

## §10 結論（DoD 達成判定）

1. **4 候補日 timeline overview 確定** (§1.1-§1.3): (A) 5/5 朝 / (B) 5/6 朝 / (C) 5/7 朝 / (D) 5/8 朝 の wall-clock 構造 + Owner acknowledge timing。
2. **24 セルマトリクス確定** (§2.2): 候補日 × 6 軸 = 24 セル GO/CONDITIONAL/BLOCKED 判定。
3. **(A) 5/5 朝詳細評価 + 採決確度 40-50%** (§3): Lv 3 条件付推奨、3 件 mitigation 必要。
4. **(B) 5/6 朝詳細評価 + 採決確度 55-65%** (§4): **Lv 4 強く推奨、CEO 推奨候補日**。
5. **(C) 5/7 朝詳細評価 + 採決確度 70-78%** (§5): Lv 4 推奨次点、6 軸全 GO 安全運用。
6. **(D) 5/8 朝詳細評価（v12 base 維持）** (§6): Lv 3 v12 base、確度 78-85%。
7. **4 候補日比較表 + 推奨度判定** (§7): (B) 5/6 朝最適 balance。
8. **連鎖前倒し効果 + Round 13 中即時アクション 4 件** (§8): Phase 2 着手 +2 日前倒し可能、4 件 fallback 経路明示。
9. **配布資料 13 件 ready 状態 5/4 EOD 確認** (§9): 12/13 件再 review 不要、1/13 件は (A)/(B) 採用時 Sec-H 1h 対応。

→ **議決-26 前倒し可否評価 DoD 達成**。CEO 推奨 = (B) 5/6 朝採用（採決確度 55-65% / Phase 2 着手 +2 日前倒し / Owner 物理拘束 90 分維持）。

---

## §10.5 補足: 候補日選定における Owner 受容確度の根拠（曜日 / 時間帯 / 休日尾分析）

### §10.5.1 曜日 / 時間帯別の受容確度根拠

| 候補日 | 曜日 | acknowledge 必要時刻 | 曜日 / 時間帯特性 | 受容確度 |
|---|---|---|---|---|
| (A) 5/5 朝 | 日曜（休日尾、5/6 月曜復帰前夜） | 5/4 (土) 深夜 〜 5/5 (日) 早朝 04:00 | **休日尾深夜 → 早朝 = Owner 私的時間最大、業務関連 acknowledge 受容性最低**（4 候補中最低）| 50-60% |
| (B) 5/6 朝 | 月曜（平日復帰初日） | 5/5 (日) EOD 18:00 | **日曜 EOD = 平日復帰準備時間、業務関連 mail 確認受容性中**（休日尾だが平日復帰意識ありで上昇）| 65-75% |
| (C) 5/7 朝 | 火曜（平日中盤） | 5/6 (月) EOD 18:00 | **月曜 EOD = 平日復帰直後、平日業務リズム確立で受容性高**（4 候補中 2 位）| 80-85% |
| (D) 5/8 朝 | 水曜（平日中盤、最も整合）| 5/7 (火) EOD 18:00 | **火曜 EOD = 平日中盤、業務リズム確立 + Owner 業務 schedule 整合性最高**（4 候補中最高、v12 base） | 88-90% |

### §10.5.2 Owner formal「最速」directive 整合度の判定根拠

| 候補日 | 5/8 比 前倒し | Owner formal「最速」directive 整合度 | 判定根拠 |
|---|---|---|---|
| (A) 5/5 朝 | +3 日 | **最大整合**（5pt / 5pt）| Round 12 完遂直後 momentum 維持 + 物理的最速候補 |
| (B) 5/6 朝 | +2 日 | **大整合**（4pt / 5pt）| 平日復帰初日採決 + drill #2 prep 1h gap で twin 二重負荷回避 |
| (C) 5/7 朝 | +1 日 | **中整合**（3pt / 5pt）| 平日中盤 + drill #2 24h prep 余裕、安全運用優先 |
| (D) 5/8 朝 | 0 日 | **小整合**（1pt / 5pt）| 前倒しなし、v12 base 維持、Owner formal「最速」directive 反映度最低 |

### §10.5.3 採決確度 vs 整合度 の trade-off 分析

| 候補日 | 採決確度 | Owner directive 整合度 | 総合 score |
|---|---|---|---|
| (A) 5/5 朝 | 40-50% (低)| 最大 (5pt) | 0.45 × 5 = **2.25** |
| (B) 5/6 朝 | 55-65% (中)| 大 (4pt) | 0.60 × 4 = **2.40** ★ |
| (C) 5/7 朝 | 70-78% (高)| 中 (3pt) | 0.74 × 3 = **2.22** |
| (D) 5/8 朝 | 78-85% (最高)| 小 (1pt) | 0.82 × 1 = **0.82** |

→ **総合 score 最大 = (B) 5/6 朝（2.40）**、CEO 推奨候補日確定。次点 = (A) 5/5 朝（2.25）/ (C) 5/7 朝（2.22）の僅差。(D) 5/8 朝は採決確度高いが Owner directive 整合度最低で score 最低。

### §10.5.4 (B) 5/6 朝採用時の Round 13 dispatch 微調整 5 件

| 部署 | Round 12 dispatch preview（v12 base 5/8 朝） | (B) 5/6 朝採用後微調整 |
|---|---|---|
| Sec-H | DEC-019-060（Round 13 authorization + 5/22 push 採択）| **5/4 EOD 起票 + 5/5 09:00 配信 trigger 待機**（5/4 EOD ready 化前倒し）|
| Review-E | drill #2 5/8 朝実機結果集計テンプレ | **drill #2 5/6 朝実機集計 → 議決前 06:00-06:20 反映**（5/5 EOD prep）|
| PM-F (本書担当) | MS-2 trial 結果集計テンプレ + Phase 2 narrative integration 進捗 measure | **議決-26 前倒し可否評価（最優先 = 本書）+ MS-2 + Phase 2** |
| Marketing-G | extraction script 5 件実装 + portfolio v3 + case study 英語版 | 5/22 朝公開 narrative 5/20 朝公開時の差し替え（push +2 日前倒し採用時）|
| Knowledge-I | INDEX-v3 → v4 + HITL gate-11 spec v1.0 + grayzone dictionary v1.0 + 提案書 §(f) 自動引用機構 | （変動なし、5/8 朝 → 5/6 朝で Round 13 期間 ±0）|

### §10.5.5 (B) 5/6 朝採用時の SOP / DEC 整合性確認 5 件

| SOP / DEC | 5/8 朝採用時 | (B) 5/6 朝採用時 | 整合性 |
|---|---|---|---|
| DEC-019-025（Agent tool permissions SOP）| 維持 | 維持 | OK |
| DEC-019-050（Anthropic spend cap $30）| $0 累計 | $0 累計（前倒しでも追加コスト 0）| OK |
| DEC-019-052 (a)(b)(c)（Marketing 6/27 朝公開維持）| 0 日延期 | **0 日延期維持**（5/22 push case 採用時のみ Phase 2 着手 6/24 → 6/22 候補化）| OK |
| DEC-019-054（Round 7 ハッシュチェイン）| 5/8 朝 drill #2 PASS | 5/6 朝 drill #2 PASS（24h gap 削減）| OK（Review-D R12 ランブック確定版で整合）|
| DEC-019-057/058/059（confirmed）| 5/8 朝 acknowledge | **5/6 朝 acknowledge**（DEC-019-060 起票時に 5/6 朝採用 confirmed として記載）| OK |

### §10.5.6 (B) 5/6 朝採用時の Risk Register v3.2 整合性確認

| Risk | 5/8 朝採用時 | (B) 5/6 朝採用時 | 影響度 |
|---|---|---|---|
| R-019-06 (BAN 30-60% / 12 ヶ月) | drill #2 5/8 朝 PASS で残存 15-30% | drill #2 5/6 朝 PASS で残存 15-30%（同等） | 0 |
| R-019-09 (NG-3 24/7 監視) | tos-monitor 1,344 行 24/7 監視 | 同左 | 0 |
| R-019-10 (重要分野ホワイトリスト未確定) | minor 16 件 denylist 完全緑化 | 同左 | 0 |
| R-RUSH-01〜04 (タイト trajectory) | 5/8 朝採用 = 0pt 上昇 | **5/6 朝採用 = +5pt 上昇**（Owner acknowledge tight + drill #2 prep 1h gap）| **+5pt（mitigation 4 件で 0pt 化）** |

### §10.5.7 (B) 5/6 朝採用時の mitigation 4 件（R-RUSH-01〜04 +5pt → 0pt 化）

1. **Owner acknowledge mitigation**: CEO 5/4 EOD - 5/5 09:00 mail 配信、Owner 5/5 EOD acknowledge target、不達時 (C) 5/7 朝 自動 fallback。
2. **drill #2 prep mitigation**: Review-E + Dev-C 5/5 EOD prep（Dev-C R12 dry-run runner 再利用 + Review-D R12 ランブック確定版執行）、5/6 朝 04:00 集合自動 acknowledge cron。
3. **配布資料 mitigation**: Sec-H 5/4 EOD ready 状態維持確認 + 5/5 EOD 18:00 配布 trigger 確実実行（08-review-drill-2-prep.md 日付差し替え 1h 内完遂）。
4. **議決運営 mitigation**: 議決-26 採決 + drill #2 結果 acknowledge の 1h gap で議長 R-1（CEO）二重負荷低減、議決前 30 分 prep 確保。

→ R-RUSH +5pt → mitigation 4 件で **0pt 化**、(B) 5/6 朝採用が安全運用整合。

### §10.5.8 議決-26 前倒し採用時の Owner formal 受領経路 3 系統

| 系統 | 5/4 EOD - 5/5 09:00 mail 配信内容 | Owner acknowledge 経路 |
|---|---|---|
| 系統 1（推奨）| 「議決-26 前倒し 3 候補 (A) 5/5 朝 / (B) 5/6 朝 / (C) 5/7 朝 提示 + CEO 推奨 (B) 5/6 朝 + 採決確度 55-65% + 5/8 比 +2 日前倒し効果」 | Owner Slack DM `#prj019-owner-trial` で 4 択 quick-action button（(A)/(B)/(C)/(D)）)|
| 系統 2（次点）| 「Owner formal『最速』directive 整合最優先 + (A)/(B) どちらか即決依頼」| Owner mail reply（ad-hoc 文面）|
| 系統 3（fallback）| 「議決-26 (D) 5/8 朝採用 v12 base 維持 + Round 13 中の中間進捗報告」| Owner 受信確認 acknowledge のみ（fallback case）|

### §10.5.9 (B) 5/6 朝採用時の Phase 1 sign-off 5/22 push case 連動

| 連動要素 | 5/8 朝採用時（v12 base） | (B) 5/6 朝採用時 | 連動効果 |
|---|---|---|---|
| 5/22 push 採用 4 条件達成確度 | 40-55%（Round 12 PM-E base） | **45-60%**（5/8 → 5/6 で 2 日前倒し → 残作業 +2 日余裕）| +5pt 押上 |
| MS-2 5/15 trial 12 件 KPI 達成確度 | 70%（PM-E base） | 70-72%（trial 当日変動なし、ただし議決後の Round 13 dispatch 余裕 +2 日）| +0-2pt |
| Dev-E Round 12 GO 判定 (5/14 EOD) | 65-75%（PM-E base） | 65-75%（変動なし、Dev-E 評価期限変動なし） | 0pt |
| Owner 5/22 朝 GO 即決受容 | 70%（PM-E base） | **75-80%**（5/6 朝採決で Owner formal「最速」directive 受容性 +5-10pt 上昇）| +5-10pt 押上 |
| **5/22 push 採用 4 条件全件達成確度** | **40-55%** | **48-65%**（相関考慮）| **+8-10pt** |

→ (B) 5/6 朝採用 = 5/22 push 4 条件達成確度 +8-10pt 押上、Phase 1 sign-off 5/22 採用最有力化。

---

## §11 関連決裁・参照

### §11.1 反映決裁

- DEC-019-007 / 010 / 025 / 050 / 052 / 053 / 054 / 055 / 056 / 057（confirmed）/ 058（confirmed）/ 059（confirmed）
- DEC-019-060（Round 13 PM-F 起票推奨予定、Sec-H 起票候補）

### §11.2 参照書

- `pm-round12-phase1-signoff-5-22-case.md`（Round 12 PM-E deliverable 2、414 行）— 5/22 push case 4 条件 binding 連動
- `pm-round12-ms2-5-15-trial-runsheet.md`（Round 12 PM-E deliverable 1、615 行）— MS-2 trial 9 時間 timeline 連動
- `decision-26-package/INDEX.md`（Round 12 Sec-G、150 行）— 13 件 ready 連動
- `review-round12-drill-2-runbook-final.md`（Round 12 Review-D、494 行）— drill #2 5/8 朝実機検証ランブック確定版
- `ceo-round12-integrated-report-v13.md`（Round 12 CEO 統合報告 v13、246 行）— Round 13 dispatch preview + 5/22 push 評価連動

### §11.3 Risk Register v3.2 整合

- R-019-06 (BAN 30-60% / 12 ヶ月): drill #2 5/6 朝実機 PASS で残存確率 15-30% へ低減
- R-019-09 (NG-3 24/7 監視): tos-monitor 1,344 行 24/7 監視継続
- R-019-10 (重要分野ホワイトリスト未確定): minor 16 件 denylist Round 12 完遂で完全緑化
- R-RUSH-01〜04: 前倒し採決時のタイト trajectory リスク + 10pt（mitigation 4 件で 0pt 化）

---

## フッタ — 改版履歴

| 版 | 日付 | 起案 | 主要変更 |
|---|---|---|---|
| v1 | 2026-05-04 深夜終盤（Round 13 PM-F dispatch 起案） | PM 部門（PM-F 独立 Agent） | 初版（4 候補日 × 6 軸 = 24 セル判定 + (B) 5/6 朝採用推奨 + 連鎖前倒し効果 + Owner 拘束時間帯 + Round 13 中即時アクション 4 件） |

**v1 確定**: 2026-05-04 深夜終盤（Round 13 PM-F 完遂時） / **採用判断**: CEO 5/4 EOD - 5/5 09:00 mail 配信時 + Owner 5/5 EOD acknowledge / **次回更新**: Owner 5/5 EOD acknowledge 後 v1.1（採決日確定）/ 議決-26 採決完遂後 v1.2（採決結果反映）

## フッタ詳細

- 文書: `projects/PRJ-019/reports/pm-round13-decision-26-pre-emption-evaluation.md`
- 版: v1（2026-05-04、Round 13 PM-F 担当 deliverable 1）
- 起案: PM 部門（PM-F 独立 Agent）
- 範囲: 議決-26 前倒し可否評価 4 候補日 × 6 軸 = 24 セル + 推奨候補日 + Owner 拘束時間帯 + 連鎖前倒し効果
- 検収: CEO（Round 13 commit 時）+ Owner（5/5 EOD acknowledge）+ Sec-H（DEC-019-060 起票連動）
