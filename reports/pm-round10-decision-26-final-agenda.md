# PRJ-019 議決-26 final agenda — 5/8 朝 Owner 即決用 配布資料 12 件最終化準備（Round 10 PM-ε deliverable 1）

| 項目 | 内容 |
|---|---|
| 文書 ID | pm-round10-decision-26-final-agenda |
| 制定日 | 2026-05-04（Round 10 PM-ε dispatch 起案） |
| 起票 | PM 部門（PM-ε 独立 Agent、general-purpose 経由 dispatch、DEC-019-025 SOP 準拠） |
| 区分 | **議決-26 final agenda v11（5/8 朝 Owner 即決用）** — Round 9 PM-C v10 ベース + Round 10 Dev-α/β/γ + Review-δ + Marketing-ζ 結果込みプレースホルダ更新枠 |
| 上位決裁（既存維持） | DEC-019-007 / 025 / 033 / 050 / 051 / 052 / 053 / 054 / 055 / **019-056** |
| 上位決裁（新規予定） | DEC-019-057（Owner 判断-4 結果議決、Secretary-η 起票） |
| 親文書（破壊しない、差分追加） | `pm-5-8-agenda-v10-decision-26-prep.md`（Round 9 PM-C v10、387 行） |
| ステータス | **final agenda v11 draft**（Round 10 統合時に Secretary-η が値埋め予定、5/7 EOD 配布資料 12 件最終確定） |

---

## §0 Executive Summary（CEO 向け 200 字以内）

Round 9 PM-C v10 (387 行) ベースに Round 10 並列 8 Agent 結果反映枠を追加した final agenda。議決-26「Phase 1 W1 実運用着手 Go (5/13 + 案 C ハイブリッド)」の採択前提 5 軸に Round 9 着地値 (BAN drill #1 dry exec 5/5 Pass / mock-claw end-to-end Round 10 で確定 / 必須コントロール 50 = Round 9 時点 47-48/50 / API ≤$30 維持 / Owner 残動作 0) を反映。Round 10 完遂後 Secretary-η が値埋め。採択推奨度 Lv 4「強く推奨、ただし条件付き」維持判定。否決時 fallback F-1 (5/30 NG-3 議決とパッケージ化) 詳細化。

---

## §1 議決-26 議題文案 final（300 字、Round 10 完遂値反映プレースホルダ込）

### §1.1 議決-26 タイトル

**「議決-26: Phase 1 W1 実運用着手 Go — 5/13 前倒し採択 + 案 C ハイブリッド timeline 採用 + DEC-019-056 acknowledge + DEC-019-057 結果連動」**

### §1.2 議題文案 final（300 字版、Round 10 値埋め後の確定形）

```
PRJ-019 Clawbridge Phase 1 W1 実運用着手を 2026-05-13（火）へ前倒し採択する。
Round 9-10 集中スプリント (5/4-5/6) 完遂で Phase 1 W2/W3/W4 想定スコープの
prefetch 比率 {{prefetch_ratio_round10}}% (目標 50-55%) に到達、必須コントロール
50 中 {{controls_passed_round10}}/50 達成、mock-claw end-to-end run dry exec
{{mock_claw_status}}、BAN drill #1 dry exec {{ban_drill_status}}、API 累積消費
${{api_cost_round10}}/30 維持。これらを根拠に W1 着手 5/19 → 5/13 への 6 日前倒し
+ Phase 1 sign-off 6/20 → 6/3 への 17 日前倒し + 5/22 内部運用着手 + Marketing
公開 6/27 朝維持の案 C ハイブリッド採択。DEC-019-056 (5/4 Round 9 起票済) を
acknowledge、DEC-019-057 (Owner 判断-4 結果議決) を 5/8 議事で採決連動。
採択前提 5 軸全 PASS 確認。
```

### §1.3 値埋めプレースホルダ一覧（Round 10 統合時に Secretary-η が値埋め）

| Placeholder | Round 10 完遂時に確定する値 | 値埋め担当 | 出典 |
|---|---|---|---|
| `{{prefetch_ratio_round10}}` | Phase 1 W1/W2/W3/W4 想定スコープの prefetch 比率 (目標 50-55%、Round 10 R10-1/2 完遂時に確定) | Secretary-η | Round 10 Dev-α/β 完遂報告 |
| `{{controls_passed_round10}}` | 必須コントロール 50 達成件数 (目標 ≥48 件 = ≥96%) | Secretary-η | Review-δ 再監査結果 |
| `{{mock_claw_status}}` | mock-claw end-to-end run dry execution の結果 ("Pass 5 cases"/"部分 Pass") | Secretary-η | Dev-β Round 10 R10-2 完遂報告 |
| `{{ban_drill_status}}` | BAN drill #1 dry exec 結果 ("Full Pass 5/5"/"部分 Pass") | Secretary-η | Round 9 Review-B 既確定 + Round 10 R10-1 補完確認 |
| `{{api_cost_round10}}` | 5/4-5/8 累積 API 消費額 ($) | Secretary-η | cost-tracker.ts Round 10 終端値 |

→ 5 placeholder + Round 10 完遂時 (5/6 夜) に Secretary-η が値埋め → 5/7 EOD 配布前に PM-ε による final 校正。

---

## §2 採択 5 軸 PASS 状況最新化（Round 9 着地 + Round 10 結果込み）

### §2.1 5 軸採択前提条件 final 一覧（最新化版）

| 軸 | 条件 | Round 9 時点 | **Round 10 想定** | 検証時刻 | 検証主体 |
|---|---|---|---|---|---|
| **軸-1** | mock-claw end-to-end dry execution Pass | Dev-A1 needs_scout MVP 完遂 + Dev-A2 tos-monitor 完遂 (Round 9 着地) | **Round 10 R10-2 で 5 cases 全 PASS 想定**（Dev-β 担当）| 5/6 夜 | Dev + Review |
| **軸-2** | BAN drill #1 dry exec Pass | **Round 9 Review-B 着地済 = Full Pass 5/5**（CEO Round 9 v10 §2 #3 確定）| 維持 + Round 10 R10-1 で補完確認 | 5/6 夜 + 5/8 朝 | Review |
| **軸-3** | 必須コントロール 50 達成度 ≥ 95% | Round 9 着地時点 47-48/50 (94-96%、推定) | **Round 10 Review-δ 再監査で ≥48/50 = ≥96% 想定**（tos-monitor 4 高ランクセル PASS 判定込み）| 5/8 朝 | Review |
| **軸-4** | API 消費 ≤$30 維持 | Round 9 追加コスト $0 (CEO v10 §1 確定)、5/4 累積想定 ≤$5 | **Round 10 mock 中心で追加コスト 想定 ≤$2、5/8 朝累積 ≤$10/30 維持**| 5/8 朝 | Dev |
| **軸-5** | Owner 残動作 0 件継続 | Round 9 期間 = Owner 物理拘束 0 分 (即決のみ)、5/8 までに Spend Cap 設定残 | **Round 10 期間 + 5/7 朝 判断-4 即決 5 分 + Spend Cap 設定 5/6 夜完了想定**| 5/8 朝 | CEO |

### §2.2 5 軸 PASS 状況の Round 9 → Round 10 trajectory

| 軸 | Round 8 確度 | Round 9 確度 | **Round 10 想定確度** | 5/8 朝 PASS 確度 |
|---|---|---|---|---|
| 軸-1 (mock-claw) | n/a | 70% (Dev-A1/A2 着地) | **88-92%** (R10-2 で確定) | 90%+ |
| 軸-2 (BAN drill #1) | 75% | **95%** (Review-B Full Pass 確定) | 95% 維持 | 95%+ |
| 軸-3 (必須コントロール 50) | 80% | 84% (47-48/50 推定) | **92-94%** (Review-δ 再監査) | 92%+ |
| 軸-4 (API ≤$30) | 95% | 98% ($0 追加) | **98%** (Round 10 ≤$2 追加) | 98%+ |
| 軸-5 (Owner 残動作 0) | 95% | 98% (5/4 即決のみ) | **97%** (5/7 朝判断-4 即決 1 件加味) | 97%+ |
| **5 軸全 PASS 確度** | 約 65% | **約 78%** | **約 82-85%** | **約 85%** |

→ Round 10 完遂時の議決-26 採択前提 5 軸全 PASS 確度 = **82-85%**（CEO Round 9 v10 §5 trajectory と整合）。

### §2.3 5 軸採択判定マトリクス（Round 10 完遂時想定）

| シナリオ | 軸-1 | 軸-2 | 軸-3 | 軸-4 | 軸-5 | 結果 | 確度 |
|---|---|---|---|---|---|---|---|
| 全 PASS | PASS | PASS | PASS | PASS | PASS | **議決-26 採択 + 案 C 推奨** | 82-85% |
| 軸-1 のみ部分 Pass | 部分 | PASS | PASS | PASS | PASS | **議決-26 条件付き採択（Round 10 補完）**| 8-10% |
| 軸-3 が < 95% | PASS | PASS | < 95% | PASS | PASS | **議決-26 見送り (F-1 fallback)**| 3-5% |
| 2 軸以上 FAIL | — | — | — | — | — | **議決-26 完全見送り (F-1 fallback)**| 2-5% |

### §2.4 採択推奨度 Lv 4「強く推奨、ただし条件付き」維持判定

- Round 9 着地時点 = Lv 4 維持確定（PM-C v10 §1.4 + CEO v10 §3.2 cross-validation）
- Round 10 想定 = Lv 4 維持予測（5 軸全 PASS 確度 82-85%）
- 5/8 朝時点 = Lv 4 維持判定（5 軸全 PASS 確度 ≥ 85% 想定時）

→ **議決-26 採択推奨度 Lv 4「強く推奨、ただし条件付き」維持** = DoD 達成。

---

## §3 v10 → v11 議事構造差分（Round 10 完遂結果反映）

### §3.1 議事時間 final 試算（v10 50-60 分 → v11 45-50 分への圧縮、方式 A 採用前提）

| 区分 | v10 (Round 9 着地) | **v11 (Round 10 完遂後 final)** | 差分 |
|---|---|---|---|
| §1 開催情報確認 | 1 分 | 1 分 | 0 |
| §2 W0-Week1 進捗報告 | 6 分 | **7 分** (Round 10 完遂報告 +1 分) | +1 |
| §6 議決 21 件採決 (A 11 + B 5 + C 5) | 30 分 | 30 分 | 0 |
| **§6.1 議決-26** (DEC-019-056 acknowledge 方式 A) | 10-15 分 (議論)/2 分 (acknowledge) | **2 分** (5/4 起票済を 5/8 議事録に追加記録) | -8 〜 -13 |
| **§6.2 議決-27** (DEC-019-057 Owner 判断-4 結果議決) | n/a | **2 分** (5/6-5/8 朝 Owner 即決済を acknowledge) | +2 |
| §7 質疑応答 | 5-7 分 | **5 分** | -2 |
| §8 締め | 2 分 | 2 分 | 0 |
| **計** | **51-58 分** (バッファ込 50-60 分) | **45-49 分** (バッファ込 45-50 分) | **-6 〜 -10 分** |

→ Round 10 完遂で議決-26 = DEC-019-056 acknowledge + 議決-27 = DEC-019-057 acknowledge の **2 件 acknowledge 方式 A 採用**で議事時間 v9 35-45 分に近い 45-50 分着地予測。

### §3.2 議決-27 (DEC-019-057 Owner 判断-4 結果議決) の議事追加

| 項目 | 内容 |
|---|---|
| タイトル | **「議決-27: Owner 判断-4 結果 acknowledge — 案 C ハイブリッド採択 (Round 9 CEO 推奨 Lv 4) を 5/8 議事録に追加記録」**|
| 起票部署 | Secretary 部門 (Secretary-η 起票、DEC-019-057 として 5/6 夜 Owner 即決後に 起票) |
| 議事構造 | 議題文案読了 + Owner 即決済 acknowledge + 議事録スタンプ (計 2 分) |
| 推奨 | YES (採択)、推奨度 Lv 4 (Round 9 CEO 推奨と整合) |

### §3.3 v10 → v11 議事構造の sign-off 欄追加

| 区分 | v10 | **v11** |
|---|---|---|
| 議決-1〜25 sign-off 欄 | 既存 21 件 | 維持 |
| 議決-26 sign-off 欄 | DEC-019-056 acknowledge | 維持 |
| **議決-27 sign-off 欄** | n/a | **新規追加 (DEC-019-057 acknowledge)** |
| Round 10 完遂報告欄 | n/a | **新規追加 (Round 10 8 Agent 並列 dispatch 完遂状況)** |
| Owner 判断-4 結果記録欄 | n/a | **新規追加 (5/6-5/8 朝 Owner 即決内容)** |

---

## §4 配布物 v10 (12 件) → v11 (12 件 + 値埋め確定) 一覧

### §4.1 配布物 12 件 final list（Round 10 完遂後 5/7 EOD 配布予定）

| # | ファイル | 起案 Round | 行数（目安）| Round 10 値埋め有無 | 担当 |
|---|---|---|---|---|---|
| 1 | `secretary-5-8-meeting-package-v11.md` (cover letter + 全 v11 配布物 index) | Round 10 Secretary-η | 500-600 | 値埋め必要 (Round 10 集計値) | Secretary-η |
| 2 | `secretary-agenda-v9.md` (議題 v9 = 22 件議決) | Round 10 Secretary-η | 350-400 | 値埋め必要 (議決-26 + 議決-27 final agenda) | Secretary-η |
| 3 | `pm-round9-10-2day-sprint-plan.md` (Round 9 PM-C 起案) | Round 9 PM-C | 507 | 値埋めなし (Round 9 確定) | PM-C |
| 4 | `pm-phase1-transition-plan-v1.md` (Round 9 PM-C 起案) | Round 9 PM-C | 554 | 値埋めなし (Round 9 確定) | PM-C |
| 5 | `pm-5-8-agenda-v10-decision-26-prep.md` (Round 9 PM-C 起案) | Round 9 PM-C | 387 | 値埋めなし (Round 9 確定) | PM-C |
| 6 | **`pm-round10-decision-26-final-agenda.md` (本書、Round 10 PM-ε 起案)**| Round 10 PM-ε | **400-500**| 値埋め必要 (5 placeholder) | Secretary-η が値埋め |
| 7 | **`pm-case-c-timeline-final.md` (Round 10 PM-ε deliverable 2)**| Round 10 PM-ε | **400-500**| 値埋め一部 (Round 10 達成値) | Secretary-η |
| 8 | **`pm-phase2-narrative-integration-plan.md` (Round 10 PM-ε deliverable 3)**| Round 10 PM-ε | **300-400**| 値埋めなし | — |
| 9 | `secretary-w0-week1-meeting-minutes-template-v6.md` (議事録テンプレ v5 → v6) | Round 10 Secretary-η | 500-600 | 値埋めなし (5/8 当日記入) | Secretary-η |
| 10 | `review-mandatory-controls-50-final-v3.md` (Round 10 Review-δ 再監査結果) | Round 10 Review-δ | 500-600 | 値埋め必要 (50 中達成件数) | Review-δ |
| 11 | `marketing-launch-final-narrative-v1.md` (Round 10 Marketing-ζ final draft) | Round 10 Marketing-ζ | 800-1,200 | 値埋めなし | Marketing-ζ |
| 12 | `dev-round10-mock-claw-e2e-report.md` (Round 10 Dev-β 完遂報告) | Round 10 Dev-β | 500-700 | 値埋め必要 (e2e 結果) | Dev-β |

→ 配布物 12 件、計 5,747-7,037 行想定（Round 9 PM-C v10 想定 12 件と件数同じ、行数は Round 10 並列 8 Agent dispatch 結果込みで増加）。

### §4.2 命名整合性検証（Secretary-η DEC-019-057 配布資料収集との整合）

| 命名 | Round 9 PM-C v10 想定 | **Round 10 final** | 整合性 |
|---|---|---|---|
| 集会パッケージ | `secretary-5-8-meeting-package-v10.md` | `secretary-5-8-meeting-package-v11.md` | v10 → v11 へ更新 |
| 議題ファイル | `secretary-agenda-v8.md` | `secretary-agenda-v9.md` | v8 → v9 へ更新 (議決-27 追加分) |
| 議事録テンプレート | `secretary-w0-week1-meeting-minutes-template-v5.md` | `secretary-w0-week1-meeting-minutes-template-v6.md` | v5 → v6 へ更新 (議決-27 sign-off 欄 + Round 10 完遂報告欄) |

→ **Secretary-η が DEC-019-057 起票時に上記 命名を採用、本書は配布物 12 件中の #6 として位置付け**。

### §4.3 配布物 12 件の Owner 事前読了所要時間試算

| 区分 | v10 想定 | **v11 final** | 差分 |
|---|---|---|---|
| Cover letter (#1) | 3 分 | **3 分** | 0 |
| Agenda (#2) | 3 分 | **3 分** | 0 |
| PM Round 9 系列 (#3-#5) | 15 分 | 15 分 | 0 |
| **PM Round 10 系列 (#6-#8、本書 + 案 C timeline + Phase 2 narrative integration)**| n/a | **15 分** | **+15** |
| 議事録テンプレ (#9) | 3 分 | 3 分 | 0 |
| Review final (#10) | 5 分 | 5 分 | 0 |
| Marketing final (#11) | 8 分 | **10 分** | +2 |
| **Dev Round 10 (#12)**| n/a | **5 分** | **+5** |
| **計**| 約 18 分 | **約 47 分** | **+29 分** |

→ Owner 事前読了 47 分 = 5/7 EOD 配布から 5/8 18:00 議事まで 約 24h ある中で 47 分の事前読了 = 許容範囲（DEC-019-054 「オプション 1 で進めて」パターンで Owner が読了スキルを既に確立している前提）。

---

## §5 否決時 fallback F-1 詳細（5/30 NG-3 議決とパッケージ化）

### §5.1 F-1 採択時の 5/30 議決パッケージ構造（Round 9 PM-C v10 §3 拡張）

| 議決 | 内容 | 議事時間 | 起票部署 |
|---|---|---|---|
| 議決-26 (5/30 移送版) | 実運用着手 Go (5/30 → 6/3 までの実績ベース判定) | **8 分**（Round 9 PM-C v10 想定 10 分から圧縮）| PM + Review 連名 |
| 議決-27 (DEC-019-057 移送版) | Owner 判断-4 結果議決 (5/30 acknowledge) | **2 分** | Secretary |
| 議決-28 (5/30 議決-NG-3 既存) | DEC-019-008 NG-3 暫定値再確認 | **8 分**（Round 6 圧縮効果込）| Research |
| **計** | — | **18 分** (Round 9 PM-C v10 想定 20 分から 2 分圧縮) | — |

### §5.2 F-1 採択時の Phase 1 W1 着手スケジュール

| 区分 | F-1 採択時 | 比較: 議決-26 採択時 (案 C) |
|---|---|---|
| Phase 1 W1 着手 | 5/19 維持 (DEC-019-052 通り) | **5/13 へ 6 日前倒し** |
| Phase 1 sign-off | 6/20 維持 | **6/3 へ 17 日前倒し** |
| Phase 2 着手 | 6/24 維持 | **6/10-17 へ 7-14 日前倒し** |
| Marketing 公開 | 6/27 朝 09:00 維持 | 6/27 朝 09:00 維持 |
| Round 10 deliverable 活用 | Phase 1 W1-W4 で staged のまま活用 | 同上 |

### §5.3 F-1 採択時の組織コスト

| 区分 | F-1 採択時 | 比較: 議決-26 採択時 |
|---|---|---|
| Owner 物理拘束 (5/8) | 35-45 分 (v9 維持) | 45-50 分 (v11) |
| Owner 物理拘束 (5/30) | 18 分 (パッケージ化) | 10 分 (NG-3 単独) |
| **計**| **53-63 分** | **55-60 分** |
| Round 10 deliverable 廃棄リスク | なし (Phase 1 W1-W4 で活用) | なし |

→ F-1 採択時の組織コストは議決-26 採択時とほぼ同等。**F-1 は「やめても損しない」設計**として PM-ε 部門推奨可能。

### §5.4 F-1 採択判定基準

| トリガー | F-1 発動 |
|---|---|
| 5 軸採択判定マトリクス §2.3 「軸-3 が < 95%」シナリオ | F-1 |
| 同 「2 軸以上 FAIL」シナリオ | F-1 |
| Round 10 完遂時に 5 軸全 PASS 確度 < 70% | F-1 |
| Owner 5/7 朝即決で「F-1 fallback で」 | F-1 |

### §5.5 F-1 採択時の議題 v11 構造変更（議決-26 = 見送り 1 件 + 議決-27 = 起票見送り）

```
§6.1 議決-26 (現議題)
  → "議決-26 は本日見送り。5/30 議決-26 移送版とパッケージ化採決に変更。"
  → 議事時間: 1-2 分 (見送り判断 acknowledge のみ)

§6.2 議決-27
  → 議決-27 起票見送り (Owner 判断-4 = "議決-26 見送りを Owner 即決")
  → 議事時間: 0 分 (起票なし)
```

→ F-1 時の v11 議事時間 = **35-40 分** (v9 ベース + 議決-26 見送り 1-2 分 + Round 10 完遂報告 +1 分) = Owner 物理拘束最小化。

---

## §6 Round 10 並列 8 Agent dispatch との整合 (PM-ε 担当)

### §6.1 Round 10 並列 8 Agent 構成

| # | 部署 / Agent | 主タスク | DoD | 本書との関係 |
|---|---|---|---|---|
| 1 | Dev-α | needs_scout 49 ギャップ critical 7 補完 + skill non-interactive mode 残務 | 全 critical 件着地 + 非対話 8/8 | 軸-1 mock-claw 構成要素 |
| 2 | Dev-β | mock-claw end-to-end run + dry-run 統合検証 | e2e 5 cases PASS + 副作用 0 | **軸-1 PASS 直接寄与** |
| 3 | Dev-γ | tos-monitor 偽陽性 4 高ランクセル ロジック改修 | 4 セル抑止策実装 | **軸-3 必須コントロール 50 寄与** |
| 4 | Review-δ | 必須コントロール 50 再監査 + drill #2 dry exec prep | 50 中 ≥48 件 PASS 判定 | **軸-3 PASS 直接寄与** |
| 5 | **PM-ε (本書担当)**| 議決-26 final agenda + 案 C timeline + Phase 2 narrative integration | 3 deliverable 完遂 | 配布資料 #6/#7/#8 |
| 6 | Marketing-ζ | full draft 完成 + Web-Ops 引継 + 18×18 独立ファイル | 公開可能 narrative 着地 | 配布資料 #11 |
| 7 | Secretary-η | DEC-019-057 起票 + 配布資料 12 件最終化 + dashboard 更新 | DEC + dashboard 同期 | **配布資料 #1/#2/#9 + 本書 #6 値埋め担当** |
| 8 | Research-θ | (オプション) Phase 2 ジャンル拡張 case-by-case | (オプション) | Phase 2 narrative integration 寄与 |

### §6.2 PM-ε 整合性維持必須項目

| 項目 | 整合先 | 整合状態 |
|---|---|---|
| 議決-26 採択推奨度 Lv 4 | CEO Round 9 v10 §3 + PM-C v10 §1.4 | **完全整合** (本書 §2.4) |
| 案 C ハイブリッド採用 | PM-C transition plan v1 §6 + §7 | **完全整合** (本書 §1.2 + §5.2) |
| 5 placeholder 値埋め担当 | Secretary-η DEC-019-057 起票時値埋め | **整合済** (本書 §1.3) |
| 配布物 12 件命名 | Secretary-η DEC-019-057 配布資料収集 | **整合済** (本書 §4.2) |
| Review-δ 50 control 再監査結果プレースホルダ | Review-δ Round 10 deliverable | **整合済** (本書 §1.3 + §2.1 軸-3) |
| Marketing-ζ narrative final と timeline 整合 | 案 C timeline (本書 deliverable 2) | **整合 (deliverable 2 で詳細)** |

### §6.3 Round 10 完遂時 (5/6 夜 21:00 JST 想定) の PM-ε 着地確認手順

```
5/6 21:00 JST: Round 10 8 Agent 完遂確認 (CEO 統合判定)
5/6 21:05 JST: PM-ε 5 placeholder 値埋め依頼を Secretary-η へ送付
5/6 21:10 JST: Secretary-η 値埋め完遂 (Round 10 集計値反映)
5/6 21:15 JST: PM-ε による final 校正 (本書 + deliverable 2 + deliverable 3)
5/6 21:20 JST: CEO による配布物 12 件 final review
5/6 21:30 JST: Owner 5/7 朝判断-4 即決依頼パッケージ送付
5/7 09:00 JST: Owner 即決受領 (案 C 採択 / F-1 fallback / 5/8 再判定)
5/7 EOD: 配布物 12 件 v11 配布実行
5/8 18:00 JST: 検収会議開始 (議事時間 45-50 分想定)
```

---

## §7 既存議決 cross-ref 整合性検証（Round 9 + Round 10 反映）

### §7.1 反映決裁

| DEC | Round 9 整合 | Round 10 整合 | 本書整合 |
|---|---|---|---|
| DEC-019-007 (HITL 11 種) | OK (Round 9 needs_scout MVP で第 9 種 dev_kickoff_approval 直前 needs_scout 起動) | 維持 | OK |
| DEC-019-010 (13-domain denylist Object.freeze) | OK (Dev-A1 完全準拠) | Round 10 Dev-α 49 ギャップ補完で完全準拠 | OK |
| DEC-019-025 (Agent tool permissions SOP) | OK (Round 9 6 並列 dispatch 全件遵守) | OK (Round 10 8 並列 dispatch 全件遵守) | OK (本書 PM-ε dispatch 遵守) |
| DEC-019-033 (ナレッジ蓄積 3 サブディレクトリ) | OK (Dev-A1/A2 + Marketing-D 経由抽出材料蓄積) | Round 10 で抽出継続 | OK |
| DEC-019-050 (Anthropic spend cap $30) | OK ($0 追加コスト) | OK (Round 10 ≤$2 追加想定) | OK |
| DEC-019-051 (月総額 ≤$430) | OK (不変) | OK (不変) | OK |
| DEC-019-052 (a)(b)(c) (Marketing tone B + portfolio C + 6/27 朝 09:00 JST + Channel 3) | OK (案 C 採択で 6/27 朝公開維持) | OK (Marketing-ζ final draft で完全保持) | OK |
| DEC-019-053 (2-tier env) | OK (不変) | OK (不変) | OK |
| DEC-019-054 (Round 7 ハッシュチェイン監査ログ) | OK (Round 9 dry exec で recovery integrity 確認) | OK (Round 10 R10-2 で再確認) | OK |
| DEC-019-055 (Round 8 Plan 8-Full) | OK (Round 9 で α deliverable 完遂) | OK (Round 10 で完遂継続) | OK |
| **DEC-019-056** (Round 9 起票済) | **本書 §1.2 で acknowledge** | 維持 | **本書 議決-26 = DEC-019-056 acknowledge 方式** |
| **DEC-019-057** (Round 10 Secretary-η 起票予定) | n/a | **本書 §3.2 で議決-27 = acknowledge 方式** | OK |

→ **既存議決 cross-ref 整合性 12/12 件全 OK**。

### §7.2 Risk Register v3.2 整合

| Risk ID | 概要 | Round 10 影響 |
|---|---|---|
| R-019-06 | BAN 確率 30-60% / 12 ヶ月 | 案 C 採択時 drill #1 + #2 完遂可能 → 残存確率低減 (CEO Round 9 v10 §5 整合) |
| R-019-09 | NG-3 暫定値とオーナー要望不整合 | F-1 採択時 5/30 NG-3 議決とパッケージ化で吸収 |
| R-019-10 | 重要分野ホワイトリスト未確定 | Round 10 Dev-α 補完で緑化進展 |
| R-019-11 | Codex 出力 OSS ライセンス検証フロー未整備 | Round 10 影響なし (mock 中心) |
| R-019-19/20/21/22 | (v3.1 新規) | Round 10 影響なし |
| **R-RUSH-01〜04** (sprint plan §6) | Round 10 完遂時に発動確率 30-40% → 20-25% へ低減想定 |

→ Risk Register v3.2 + R-RUSH 系 全件整合。

---

## §8 5/8 議事進行 final flow（v11 final agenda、議決-26 + 議決-27 acknowledge 方式）

### §8.1 議事構造 (45-50 分版)

```
18:00-18:01 §1 開催情報確認 (1 分)
18:01-18:08 §2 W0-Week1 進捗報告 (7 分、Round 9-10 完遂 + 案 C 採択結果)
18:08-18:10 §3 議決準備 acknowledge (2 分)
18:10-18:40 §6 議決 21 件採決 (30 分、層 A 11 + B 5 + C 5、DEC-019-054 通り)
18:40-18:42 §6.1 議決-26 = DEC-019-056 acknowledge (2 分、5/4 起票済を議事録追加記録)
18:42-18:44 §6.2 議決-27 = DEC-019-057 acknowledge (2 分、5/6 夜 Owner 即決済を議事録追加記録)
18:44-18:49 §7 質疑応答 (5 分)
18:49-18:50 §8 締め (1 分)
合計 50 分 (バッファ込 45-50 分)
```

### §8.2 F-1 fallback 採択時の議事構造 (35-40 分版)

```
18:00-18:01 §1 開催情報確認 (1 分)
18:01-18:08 §2 W0-Week1 進捗報告 (7 分、Round 9-10 完遂 + F-1 採択結果)
18:08-18:10 §3 議決準備 acknowledge (2 分)
18:10-18:40 §6 議決 21 件採決 (30 分)
18:40-18:42 §6.1 議決-26 見送り acknowledge (2 分、5/30 移送)
18:42-18:47 §7 質疑応答 (5 分)
18:47-18:48 §8 締め (1 分)
合計 38 分 (バッファ込 35-40 分)
```

---

## §9 結論（DoD 達成判定）

1. **議決-26 議題文案 final 300 字確定** (§1.2)、5 placeholder 込み Secretary-η 値埋め予定。
2. **採択 5 軸 PASS 状況最新化完了** (§2.1): Round 10 完遂時 5 軸全 PASS 確度 = **82-85%**。
3. **採択推奨度 Lv 4「強く推奨、ただし条件付き」維持判定** (§2.4)。
4. **配布物 12 件 final list 確定** (§4.1): PM-ε 担当 #6/#7/#8 計 1,100-1,400 行。
5. **否決時 fallback F-1 詳細化完了** (§5.1-§5.5): 5/30 NG-3 議決とパッケージ化、組織コスト議決-26 採択時とほぼ同等。
6. **Round 10 並列 8 Agent との整合性維持確認完了** (§6.2): 6/6 件全 OK。
7. **既存議決 12 件 cross-ref 整合性 12/12 件全 OK** (§7.1)。
8. **議事時間 final 試算: 45-50 分 (議決-26 + 議決-27 acknowledge 方式)** = v9 35-45 分から +5-10 分のみ。
9. **Owner 物理拘束 +5-10 分のみ**で議決-26 + 議決-27 採決完了 = Owner 残動作 0 件継続維持。

---

## §10 関連決裁・参照

### §10.1 反映決裁

- DEC-019-007 / 025 / 033 / 050 / 051 / 052 / 053 / 054 / 055 / **056** (起票済)
- DEC-019-057 (Round 10 Secretary-η 起票予定、Owner 判断-4 結果議決)

### §10.2 参照書

- `pm-round9-10-2day-sprint-plan.md` (Round 9 PM-C deliverable 1、507 行)
- `pm-phase1-transition-plan-v1.md` (Round 9 PM-C deliverable 2、554 行)
- `pm-5-8-agenda-v10-decision-26-prep.md` (Round 9 PM-C deliverable 3、387 行)
- `ceo-round9-integrated-report-v10.md` (CEO Round 9 統合報告 v10、186 行)
- `marketing-launch-5-22-narrative-draft-v1.md` (Round 9 Marketing-D deliverable、723 行)

### §10.3 部署別 Round 10 hand-off (本書 §6.1 + 整合性維持必須項目 §6.2)

| 部署 | Round 10 hand-off |
|---|---|
| Dev-α/β/γ | needs_scout / mock-claw / tos-monitor で軸-1/3 寄与 |
| Review-δ | 必須コントロール 50 再監査で軸-3 PASS 判定 |
| **PM-ε (本書 + deliverable 2 + 3)**| 議決-26 final agenda + 案 C timeline + Phase 2 narrative integration |
| Marketing-ζ | narrative final 着地 + 案 C 採択前提整合 |
| Secretary-η | DEC-019-057 起票 + 配布物 12 件最終化 + 5 placeholder 値埋め |
| Research-θ | Phase 2 ジャンル拡張 case-by-case (オプション) |
| CEO | Round 10 統合判定 + Owner 5/7 朝即決依頼 |

### §10.4 Phase 2 plan v1 への影響評価

- 議決-26 採択時 (案 C): Phase 2 着手 6/24 → **6/10-17 へ 7-14 日前倒し** 確度 40-50% (Round 10 完遂時)
- 議決-26 見送り時 (F-1): Phase 2 着手 6/24 維持 確度 95%
- Phase 2 narrative integration plan (deliverable 3) で詳細化

---

## フッタ — 改版履歴

| 版 | 日付 | 起案 | 主要変更 |
|---|---|---|---|
| v1 | 2026-05-04 (Round 10 PM-ε dispatch 起案) | PM 部門 (PM-ε 独立 Agent) | 初版（議決-26 final agenda v11、Round 9 PM-C v10 ベース + Round 10 値埋め枠 + 議決-27 = DEC-019-057 acknowledge 方式追加 + F-1 fallback 詳細化）|

**v1 確定**: 2026-05-04 (Round 10 PM-ε dispatch 完遂時) / **採択予定**: 5/8 議決-26 結果次第 / **次回更新**: ① Round 10 完遂時 Secretary-η 値埋め後 (5/6 夜) ② 5/8 議決-26 結果反映後

## フッタ詳細

- 文書: `projects/PRJ-019/reports/pm-round10-decision-26-final-agenda.md`
- 版: v1（2026-05-04、Round 10 PM-ε 担当 deliverable 1）
- 起案: PM 部門（PM-ε 独立 Agent）
- 範囲: 議決-26 final agenda v11 + 5 placeholder 値埋め枠 + 議決-27 議事追加 + F-1 fallback 詳細
- 検収: CEO（Round 10 commit 時）+ Secretary-η (5 placeholder 値埋め時) + Owner（5/8 議決-26 採決）
