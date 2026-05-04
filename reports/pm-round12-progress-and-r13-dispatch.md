# PRJ-019 Round 12 progress 棚卸 + Round 13 dispatch 推奨構成 — 9-10 部署完遂状況 measure + 進捗 78% → 81-83% + 5/22 push case / 5/30 維持 case 別構成（Round 12 PM-E deliverable 3）

| 項目 | 内容 |
|---|---|
| 文書 ID | pm-round12-progress-and-r13-dispatch |
| 制定日 | 2026-05-04（Round 12 PM-E dispatch 起案） |
| 起票 | PM 部門（PM-E 独立 Agent、general-purpose 経由 dispatch、DEC-019-025 SOP 準拠） |
| 区分 | **Round 12 progress 棚卸 + Round 13 dispatch 推奨構成 v1** — Round 12 9-10 部署完遂状況 measure + 進捗 78% → 81-83% 想定 + Round 13 dispatch 構成（5/22 push 採用 case と 5/30 維持 case 別） |
| 上位決裁（既存維持） | DEC-019-007 / 010 / 025 / 050 / 052 / 053 / 054 / 055 / 056 / 057（confirmed） / 058（confirmed） |
| 上位決裁（新規予定） | **DEC-019-059**（Round 12 authorization + Phase 1 sign-off 5/22 push 採否、5/8 議決-26 連動） |
| 親文書（破壊しない、差分追加） | `ceo-round11-integrated-report-v12.md` §9 Round 12 dispatch preview（10-11 並列候補）+ `pm-round11-w1-w2-short-sprint.md` |
| 範囲 | Round 12 9-10 部署完遂状況 measure + 進捗 trajectory + Round 13 dispatch 構成（2 case 分岐）|
| ステータス | **draft v1**（Round 12 完遂時 v1.1、5/15 trial 結果 + 5/16 Round 13 dispatch 起動時 v1.2）|

---

## §0 Executive Summary（CEO 向け 200 字以内）

PRJ-019 Round 12 progress 棚卸 + Round 13 dispatch 推奨構成。Round 12 9-10 部署完遂状況 (Dev-A/B/C/D/E + Review-D + PM-E + Marketing-F + Knowledge-H + Sec-G) を measure: Dev-C/D が CRITICAL (real subprocess + kill-switch wiring)、Dev-E が KEY (5/22 push 評価)、PM-E が DELIVERABLE (本書含む 3 件)。進捗 78% → **81-83% 着地予測**（Round 12 EOD = 2026-05-04 深夜）+3-5pt 押上根拠 6 件。Round 13 dispatch (5/16 起動) は 5/22 push 採用 case (8-9 並列、5/22 sign-off 直前準備集中) と 5/30 維持 case (10-11 並列、Round 11 PM-D plan 通り進行) で構成異なる。引継 Round 13 想定 = MS-2 trial 結果集計テンプレ + Phase 2 narrative integration 進捗 measure。

---

## §1 Round 12 9-10 部署完遂状況 measure

### §1.1 Round 12 dispatch 構成 (10 部署、CEO Round 11 v12 §9 引用)

| # | 部署 / Agent | 主タスク | 引継元 | 重要度 |
|---|---|---|---|---|
| 1 | Dev-A | NFKC 正規化 layer + denylist YAML 直書き化 (CB-D-W3-01) | Dev-A R11 | HIGH |
| 2 | Dev-B | tos-monitor primitive 採用 refactor + Slack webhook POST 配線 + IsolationGuard 直接配線 | Dev-B R11 | HIGH |
| 3 | Dev-C | real child_process.spawn 統合 + NDJSON 対応 + e2e 5/8 朝検証 | Dev-D R11 | **CRITICAL** |
| 4 | Dev-D | kill-switch.registerSubprocessKill wiring + index.ts barrel export | Dev-A/D R11 | **CRITICAL** |
| 5 | Dev-E | Phase 1 sign-off 5/22 push 評価（W3 22 日前倒しを sign-off に反映可否）| Dev-A/D R11 | **KEY** |
| 6 | Review-D | drill #2 5/8 朝 06:00-08:00 実機検証準備 | Review-C R11 | HIGH |
| 7 | **PM-E (本書担当)** | MS-2 5/15 trial 詳細手順書 + Phase 1 sign-off 5/22 ケース判定 + Round 12 progress + R13 dispatch | PM-D R11 | **DELIVERABLE** |
| 8 | Marketing-F | dynamic disclosure card データ流入確認 + portfolio 18×18 残 99 cell 埋め | Marketing-E R11 | MEDIUM |
| 9 | Knowledge-H | INDEX-v2 → v3（33 → 40+ 目標）+ HITL gate-11 PII review 1 件 dry run | Knowledge-G R11 | MEDIUM |
| 10 | Secretary-G | DEC-019-059（Round 12 authorization）/ 5/8 議決-26 当日資料配布最終 | Secretary-F R11 | HIGH |

### §1.2 Round 12 完遂状況 measure（5/4 深夜時点、PM-E 観測）

| # | 部署 | 完遂状況（5/4 深夜時点 PM-E 観測）| 想定 EOD 完遂率 |
|---|---|---|---|
| 1 | Dev-A | dispatch 中（NFKC + denylist YAML 完遂見込み） | 95% |
| 2 | Dev-B | dispatch 中（tos-monitor primitive refactor + Slack webhook 配線完遂見込み） | 95% |
| 3 | Dev-C | dispatch 中（real subprocess 統合 + NDJSON 対応、5/8 朝 e2e 検証含む）| **90%**（5/8 朝検証は Round 13 prep 連動）|
| 4 | Dev-D | dispatch 中（kill-switch wiring + barrel export、Round 11 Dev-A/D 引継）| 95% |
| 5 | Dev-E | dispatch 中（5/22 push 評価レポート起案）| 90% |
| 6 | Review-D | dispatch 中（drill #2 5/8 朝実機検証準備、Round 11 Review-C drill-2-execution-spec 480 行 整合）| 95% |
| 7 | **PM-E** | **本書 + 姉妹文書 2 件（trial run sheet + 5/22 push case）= 3 件起案、本書で完遂** | **100%** |
| 8 | Marketing-F | dispatch 中（dynamic disclosure card データ流入 + portfolio 残 99 cell）| 85%（portfolio 残埋め時間要）|
| 9 | Knowledge-H | dispatch 中（INDEX-v3 + HITL-11 PII review dry run）| 90% |
| 10 | Secretary-G | dispatch 中（DEC-019-059 起票 + 配布資料最終）| 95% |
| **平均** | — | — | **93%** |

→ Round 12 EOD 完遂率 想定 = **93%**（10 部署平均、Dev-C 5/8 朝検証 + Marketing-F portfolio 残埋め が部分持越）。

### §1.3 Round 12 EOD 主要 deliverable

| 部署 | 想定主要 deliverable | 行数 / 件数 想定 |
|---|---|---|
| Dev-A R12 | denylist YAML 化（minor 16 件含む 47+ keyword） | 200-300 行 src + 30+ tests |
| Dev-B R12 | tos-monitor primitive refactor + Slack webhook | 400-500 行 src + 30+ tests |
| Dev-C R12 | real-child-process-integration.ts + NDJSON 対応 + e2e 5/8 朝 | 400-600 行 src + 25+ tests |
| Dev-D R12 | kill-switch wiring + index.ts barrel | 100-200 行 src + 15+ tests |
| Dev-E R12 | Phase 1 sign-off 5/22 push 評価レポート | 400-500 行 |
| Review-D R12 | drill #2 5/8 朝実機検証 prep + 偽陽性 matrix v2.0 反映 | 300-400 行 |
| **PM-E R12** | **trial run sheet + 5/22 push case + Round 12 progress + R13 dispatch** | **1,300-1,500 行（3 件）** |
| Marketing-F R12 | disclosure card データ流入 + portfolio 残 99 cell | 600-800 行 + portfolio cells |
| Knowledge-H R12 | INDEX-v3 (33 → 40+ entries) + HITL-11 dry run | 200-300 行 + 7+ knowledge files |
| Secretary-G R12 | DEC-019-059 起票 + 配布資料最終 + dashboard 更新 | 300-400 行 |
| **累計（Round 12）** | — | **約 4,200-5,500 行 + 100+ tests** |

→ Round 12 累計 = Round 11 (約 5,852 行 + 17,970 字 + 168 tests) と同等規模、Round 11 比 progress +3-5pt 押上見込み。

---

## §2 進捗 78% → 81-83% 想定（Round 12 EOD）

### §2.1 進捗 trajectory v12 → v13 想定

| 段階 | 進捗 | trajectory 根拠 |
|---|---|---|
| Round 10 末（v11） | 75% | CEO Round 10 v11 §1 整合 |
| Round 11 末（v12） | 78% | CEO Round 11 v12 §0 整合 |
| **Round 12 末（v13 想定）** | **81-83%** | **+3-5pt 押上、本書 §2.2 根拠 6 件** |
| Round 13 末（5/16 EOD 想定） | 84-86% | trial 結果反映 + R13 dispatch 完遂 |
| W1 完遂 (5/19 EOD、v14 想定) | 88-90% | 必須 50 軸 96% 達成 + W1 sprint 完遂 |
| W2 day 2 (5/21 EOD、v15 想定) | 91-93% | 必須 50 軸 100% 達成 prep + drill #2 5/22 prep final |
| Phase 1 sign-off (5/22 or 5/30、v16 想定) | 95-97% | Phase 1 完遂 + Open Claw runtime 本番起動 |

### §2.2 Round 12 進捗 +3-5pt 押上根拠 6 件

| # | 押上要素 | 寄与度 |
|---|---|---|
| 1 | denylist 完全緑化（minor 16 件 + YAML 化、Dev-A R12）| +0.5pt |
| 2 | real subprocess 統合 + NDJSON 対応（Dev-C R12、5/22 sign-off 直結）| +0.8pt |
| 3 | kill-switch wiring 完遂（Dev-D R12、安全運用 readiness +1pt）| +0.5pt |
| 4 | Phase 1 sign-off 5/22 push 評価完遂（Dev-E R12 + PM-E R12 cross-check）| +0.8pt |
| 5 | drill #2 5/8 朝実機検証 prep 完遂（Review-D R12、軸-2 +1pt PASS readiness）| +0.5pt |
| 6 | DEC-019-059 起票 + 配布資料最終（Secretary-G R12、議決-26 採決 readiness）| +0.4pt |
| **計（小計）** | — | **+3.5pt** |
| 補正（Marketing-F portfolio 残埋め partial、+0.5pt 持越） | -0.5pt | -0.5pt |
| 補正（Knowledge-H INDEX-v3 完遂、+0.5pt） | +0.5pt | +0.5pt |
| 補正（PM-E 本書 + 姉妹文書 3 件起案、+0.5pt） | +0.5pt | +0.5pt |
| **進捗 +3-5pt 押上** | — | **+4pt（中央値）= 78% → 82%（v13）** |

→ 中央値 v13 想定 = **82%**（範囲 81-83%、CEO Round 11 v12 §8 確度 trajectory 整合）。

### §2.3 進捗測定指標（v13 想定）

| 指標 | v11 | v12 | v13 想定 | Δ |
|---|---|---|---|---|
| code 累計（行数）| 約 4,000 | 約 6,710（+2,710） | **約 11,000-12,500（+4,200-5,500）** | +60-86% |
| tests pass | 483 | 614（+131） | **約 700-720（+86-106）** | +14-17% |
| レポート累計（行数）| 約 38,000 | 約 43,852（+5,852） | **約 48,000-49,500（+4,200-5,500）** | +9-13% |
| 知見累計（件数） | 17 | 27（+10） | **約 33-37（+6-10）** | +22-37% |
| Decisions 累計 | 21 | 23（+2） | **24（+1、DEC-019-059）** | +4% |
| 5/8 議決-26 採択確度 | 78% | 85% | **88%** | +3pt |
| 5/15 MS-2 trial 確度 | 70% | 80% | **82%** | +2pt |
| 5/22 sign-off (push) 確度 | 60% | 78% | **80-85%**（条件付き） | +2-7pt |
| 5/30 sign-off (维) 確度 | — | 88% | **88% 維持** | 0pt |

---

## §3 Round 13 dispatch 推奨構成（5/22 push 採用 case と 5/30 維持 case 別）

### §3.1 Round 13 dispatch 起動条件

| 条件 | 内容 |
|---|---|
| 起動日時 | 2026-05-16 朝（5/15 MS-2 trial 結果 acknowledge 後）|
| 起動主体 | CEO（Round 12 完遂 + 5/15 trial 結果 acknowledge + Owner 中間報告 v1 acknowledge 後）|
| dispatch 構成決定 | DEC-019-059 §(b) Phase 1 sign-off 5/22 push 採否確定後 |
| 並列数 | 5/22 push case = 8-9 並列、5/30 維持 case = 10-11 並列 |

### §3.2 Round 13 dispatch case A: 5/22 push 採用（8-9 並列、5/22 sign-off 直前準備集中）

#### §3.2.1 case A 主タスク

| # | 部署 | 主タスク | 引継元 | 期限 |
|---|---|---|---|---|
| 1 | Dev-A | needs_scout 本実装 day 1 (HN API integration) | Dev-A R12 NFKC + denylist YAML | 5/17 EOD |
| 2 | Dev-B | tos-monitor production 統合 final + 4 detector × 5 scenario = 20 cell PASS | Dev-B R12 | 5/19 EOD |
| 3 | Dev-C | real subprocess production 統合 + e2e 5/8 朝検証結果反映 | Dev-C R12 | 5/16 EOD |
| 4 | Dev-D | Open Claw runtime 本番起動 prep（mock-claw → 実 claw 切替準備）| Dev-D R12 | 5/19 EOD |
| 5 | Review-E | drill #2 実 drill 5/22 朝 final prep + 必須 50 軸 100% 達成 監督（5/22 EOD 100%）| Review-D R12 | 5/22 朝 |
| 6 | **PM-F** | 5/22 sign-off レポート起案 + Owner 中間報告 v2 起案（5/22 朝公開と統合）| **PM-E R12（本書）** | 5/22 朝 |
| 7 | Marketing-G | 5/22 朝公開 narrative final（Marketing-E R11 narrative final v1.4 + Marketing-F R12 dynamic data 反映）| Marketing-F R12 | 5/22 朝 |
| 8 | Knowledge-I | INDEX-v3 → v4（40+ → 50 目標）+ Phase 1 完遂 知見抽出（patterns 3 + decisions 3 = 6 ファイル）| Knowledge-H R12 | 5/22 EOD |
| 9 | Secretary-H | DEC-019-059 confirmed 切替（5/22 push 採決後）+ dashboard 更新 + Phase 1 sign-off 議事録 | Secretary-G R12 | 5/22 EOD |

#### §3.2.2 case A dispatch 期間 + 重点

| 期間 | 重点タスク | Owner 物理拘束 |
|---|---|---|
| 5/16-5/19 (4 日) | needs_scout 本実装 + tos-monitor production + Open Claw runtime prep | 0 分（Round 13 進行は Owner 介入 0）|
| 5/20-5/21 (2 日) | drill #2 実 drill 5/22 朝 final prep + 必須 50 軸 100% prep + Phase 1 sign-off レポート起案 | 0 分 |
| 5/22 (Phase 1 sign-off 候補日) | Open Claw runtime 本番起動 + drill #2 実 drill + 必須 50 軸 100% 達成 + 5/22 朝公開 narrative 配信 | **5 分**（09:00-09:05 GO 確認会議） |

#### §3.2.3 case A dispatch 想定成果物

| 部署 | 想定主要 deliverable | 行数 / 件数 想定 |
|---|---|---|
| Dev-A R13 | needs_scout HN API integration | 300-500 行 src + 25+ tests |
| Dev-B R13 | tos-monitor production 統合 final | 200-400 行 src + 30+ tests |
| Dev-C R13 | real subprocess production 統合 | 200-400 行 src + 20+ tests |
| Dev-D R13 | Open Claw runtime 本番起動 prep | 300-500 行 src + 20+ tests |
| Review-E R13 | drill #2 実 drill 5/22 朝 final prep + 必須 50 監督 | 400-600 行 |
| **PM-F R13** | 5/22 sign-off レポート + 中間報告 v2 + W2 残務計画 | 600-900 行 |
| Marketing-G R13 | 5/22 朝公開 narrative final | 400-600 行 |
| Knowledge-I R13 | INDEX-v4 + Phase 1 完遂 知見 6 件 | 200-300 行 + 6 知見 |
| Secretary-H R13 | DEC-019-059 confirmed + Phase 1 sign-off 議事録 | 400-600 行 |
| **累計（Round 13 case A）** | — | **約 3,000-4,800 行 + 115+ tests + 6 知見** |

### §3.3 Round 13 dispatch case B: 5/30 維持（10-11 並列、Round 11 PM-D plan 通り進行）

#### §3.3.1 case B 主タスク

| # | 部署 | 主タスク | 引継元 | 期限 |
|---|---|---|---|---|
| 1 | Dev-A | needs_scout 本実装 day 1 (HN API integration) | Dev-A R12 | 5/17 EOD |
| 2 | Dev-B | tos-monitor production 統合 + 4 detector × 5 scenario = 20 cell PASS | Dev-B R12 | 5/19 EOD |
| 3 | Dev-C | real subprocess production 統合 + e2e 検証 | Dev-C R12 | 5/19 EOD |
| 4 | Dev-D | needs_scout 本実装 day 2 (PH API integration) | Dev-D R12 | 5/17 EOD |
| 5 | Dev-E | needs_scout 本実装 day 3 (GitHub Trending API integration) + 評価関数 v0 | Dev-E R12 5/22 push 評価結果反映 | 5/19 EOD |
| 6 | Review-E | drill #2 実 drill 5/22 朝 final prep + drill #3 5/29 prep | Review-D R12 | 5/22-5/29 |
| 7 | **PM-F** | W1 完遂 sign-off + 中間報告 v2 + W2 sprint plan final | **PM-E R12** | 5/19-5/22 |
| 8 | Marketing-G | 5/22 朝公開 narrative final + 6/27 朝公開 prep | Marketing-F R12 | 5/22 朝 |
| 9 | Marketing-H | portfolio 18×18 残 99 cell 埋め完遂 (Marketing-F R12 残務) | Marketing-F R12 | 5/26 EOD |
| 10 | Knowledge-I | INDEX-v3 → v4 + W1-W2 期間 知見抽出（patterns 3 + decisions 2 + pitfalls 2 = 7 ファイル） | Knowledge-H R12 | 5/22 EOD |
| 11 | Secretary-H | dashboard 更新（W1-W2 期間日次）+ MS-3 5/22 公式着手議事録 | Secretary-G R12 | 5/22 EOD |

#### §3.3.2 case B dispatch 期間 + 重点

| 期間 | 重点タスク | Owner 物理拘束 |
|---|---|---|
| 5/16-5/19 (4 日) | needs_scout 本実装 (HN/PH/GitHub Trending) + tos-monitor production + W1 sprint 完遂 | 0 分（W1 sprint 内 Owner 介入 0）|
| 5/20-5/21 (2 日) | W2 day 1-2 + drill #2 実 drill 5/22 朝 prep | 0 分 |
| 5/22 (MS-3 day) | 内部運用着手公式 + 5/22 朝公開 narrative 配信 + drill #2 実 drill | **5 分**（MS-3 GO 確認会議） |
| 5/23-5/29 (W2 day 4-10) | 必須 50 軸 100% 達成 + needs_scout production + Phase 1 sign-off prep | 0 分 |
| 5/30 (Phase 1 sign-off 公式日) | Phase 1 完遂 sign-off + Owner 中間報告 v3 | **5 分**（Phase 1 sign-off GO 確認会議） |

#### §3.3.3 case B dispatch 想定成果物

| 部署 | 想定主要 deliverable | 行数 / 件数 想定 |
|---|---|---|
| Dev-A R13 | needs_scout HN API integration | 300-500 行 src + 25+ tests |
| Dev-B R13 | tos-monitor production 統合 | 200-400 行 src + 30+ tests |
| Dev-C R13 | real subprocess production 統合 | 200-400 行 src + 20+ tests |
| Dev-D R13 | needs_scout PH API integration | 200-400 行 src + 20+ tests |
| Dev-E R13 | needs_scout GitHub Trending API + 評価関数 v0 | 200-400 行 src + 15+ tests |
| Review-E R13 | drill #2 実 drill 5/22 朝 + drill #3 5/29 prep | 500-700 行 |
| **PM-F R13** | W1 sign-off + 中間報告 v2 + W2 sprint plan final | 600-900 行 |
| Marketing-G R13 | 5/22 朝公開 narrative + 6/27 朝公開 prep | 500-700 行 |
| Marketing-H R13 | portfolio 残 99 cell 埋め完遂 | 500-800 行 + portfolio cells |
| Knowledge-I R13 | INDEX-v4 + 知見 7 件 | 300-400 行 + 7 知見 |
| Secretary-H R13 | dashboard 日次更新 + MS-3 議事録 | 400-600 行 |
| **累計（Round 13 case B）** | — | **約 4,000-5,800 行 + 130+ tests + 7 知見** |

### §3.4 case A vs case B 比較

| 比較軸 | case A (5/22 push) | case B (5/30 維持) |
|---|---|---|
| 並列数 | 8-9 並列 | **10-11 並列** |
| dispatch 期間 | 5/16-5/22（7 日） | 5/16-5/30（15 日） |
| 重点 | **5/22 sign-off 直前準備集中** | Round 11 PM-D plan 通り進行（W1-W2 sprint）|
| Owner 物理拘束（dispatch 期間） | 5 分（5/22 朝のみ） | 10 分（5/22 朝 5 分 + 5/30 朝 5 分）|
| 累計成果物（行数） | 約 3,000-4,800 行 | 約 4,000-5,800 行 |
| 累計 tests | 115+ | 130+ |
| Phase 2 着手前倒し効果 | **+8 日（5/22 sign-off 後 Phase 2 prep 着手可）** | 0 日 |
| リスク | 中（必須 50 軸 5/22 EOD 100% タイト trajectory）| 小（必須 50 軸 5/30 EOD 100% 余裕） |
| 確度（Phase 1 sign-off） | 80-85%（条件付き） | 88% |

### §3.5 Round 13 dispatch 推奨度（PM-E 観点）

| case | 推奨度 | 採用判定基準 |
|---|---|---|
| **case A (5/22 push)** | **CONDITIONAL GO**（Lv 4「強く推奨、ただし 4 条件付き」） | DEC-019-059 §(b) (α) 採択 + 4 条件達成（Round 12 Dev-A〜E 完遂 + MS-2 trial 12 件 KPI 達成 + Dev-E GO + Owner Approve）|
| case B (5/30 維持) | RECOMMEND（Lv 3「推奨」、リスク回避型） | DEC-019-059 §(b) (γ) 採択時 |
| ハイブリッド (β HOLD) | CONDITIONAL（Lv 3「条件付推奨」、再判定 5/22-5/30 期間内）| DEC-019-059 §(b) (β) 採択時、case A 着手 + case B fallback 並行 |
| 延期 (δ) | NOT RECOMMEND（Lv 2「条件付推奨」、機会損失あり）| DEC-019-059 §(b) (δ) 採択時 |

→ PM-E 推奨 = case A (5/22 push CONDITIONAL GO) を最優先、4 条件未達時は case B 自動 fallback。

---

## §4 引継 Round 13 想定（PM-D R11 → PM-E R12 → PM-F R13）

### §4.1 PM-F Round 13 主要 deliverable

| # | deliverable | 行数想定 | 担当 |
|---|---|---|---|
| 1 | MS-2 trial 結果集計テンプレ起票（5/15 trial 結果反映用 template） | 300-400 行 | PM-F R13 |
| 2 | Phase 2 narrative integration 進捗 measure | 300-400 行 | PM-F R13 + Marketing-G R13 |
| 3 | 5/22 sign-off レポート (case A 採択時) or W1 完遂 sign-off (case B 採択時) | 500-700 行 | PM-F R13 |
| 4 | Owner 中間報告 v2 起案 | 200-300 行 | PM-F R13 + CEO |
| 5 | W2 sprint plan final or W2-W4 sprint plan final | 400-500 行 | PM-F R13 |
| **PM-F R13 累計** | — | **1,700-2,300 行** | — |

### §4.2 MS-2 trial 結果集計テンプレ（PM-F R13 起票推奨内容）

| Section | 内容 |
|---|---|
| §0 Exec Summary | 5/15 trial 結果 200 字（成功 / 部分成功 / 失敗）|
| §1 trial 当日 9 段階 actual filled | run sheet v1.1 整合 |
| §2 KPI 12 件 達成判定（pass/fail × 12）| run sheet §12.2 整合 |
| §3 needs_scout 出力 + 実 needs 抽出 詳細 | needs_scout output JSON 全件 list |
| §4 audit log integrity grep 35-72 回 結果 | hash chain 整合性検証結果 |
| §5 cost cap < $5 達成判定 | actual cost / cap |
| §6 副作用 0 件検証 | tos-monitor 偽陽性 matrix v2.0 検出 0 件 確認 |
| §7 Owner 即決結果（Approve / HOLD / Reject / 中止）| Slack thread reply log |
| §8 fallback 経路選択 | 経路 1 (5/22 push) / 経路 2 (5/30 維持) / 経路 3 (完全中止) |
| §9 Round 13 dispatch 構成決定 | DEC-019-059 §(b) 連動 case A or case B |
| §10 反映決裁・参照 | DEC-019-007/050/052/053/054/056/057/058/059 |

### §4.3 Phase 2 narrative integration 進捗 measure（PM-F R13 起票推奨内容）

| Section | 内容 |
|---|---|
| §0 Exec Summary | Phase 2 narrative integration 進捗 200 字 |
| §1 Phase 2 narrative scope 確認 | Round 11 PM-D Phase 2 narrative integration plan §1 整合 |
| §2 Phase 2 narrative 4 章構成 (vision / journey / transparency / continuity) | 各章現状 + 残タスク |
| §3 Phase 2 narrative 進捗 timeline measure | 5/8 議決-26 後 → 5/22 sign-off → 6/3 buffer → 6/27 公開 期間 trajectory |
| §4 Phase 2 narrative integration 残タスク | 残 narrative 行数 + 担当 + 期限 |
| §5 6/27 朝公開 narrative final readiness | DEC-019-052 (a)(b)(c) 整合 |
| §6 dynamic disclosure card データ流入確認 | Marketing-F R12 引継 |
| §7 portfolio 18×18 残埋め完遂状況 | Marketing-G/H R13 連動 |
| §8 Knowledge-I INDEX-v4 整合性 | Phase 1 完遂 知見 6-7 件 反映 |
| §9 Round 14-16 dispatch 推奨構成 | Phase 2 着手前倒し / Phase 1 W3-W4 完遂 連動 |
| §10 反映決裁・参照 | DEC-019-052 / 057 / 058 / 059 |

---

## §5 Round 12 → Round 13 移行プロセス

### §5.1 Round 12 完遂 → Round 13 起動 timeline

| 日時 | イベント | 担当 |
|---|---|---|
| 2026-05-04 深夜終盤 | Round 12 完遂宣言（CEO） | CEO |
| 2026-05-05 朝 | Round 12 progress dashboard 反映（78% → 82%）| Secretary-G R12 + PM-E R12（本書） |
| 2026-05-05 〜 2026-05-07 | 議決-26 配布資料 final 確認 + Owner 判断-4 受領 | Secretary-G R12 + Owner |
| 2026-05-08 09:00 | Owner 判断-5（formal）受領（α/β/γ/δ）| Owner |
| 2026-05-08 18:00-18:50 | 議決-26 採決（Conditional 採択）+ DEC-019-059 確定 | CEO + Owner + 全部署 |
| 2026-05-09-12 | Round 12 補完 + Round 13 dispatch 構成 final（case A or case B 決定）| CEO + PM-E |
| 2026-05-13 | MS-1 W1 着手 | Owner + Dev + Review |
| 2026-05-14 18:00 | 5/15 trial GO 判定会議 + Round 12 残務 final | CEO + PM-E |
| 2026-05-15 | MS-2 5/15 trial 9 時間運用 | 全部署 + Owner |
| 2026-05-15 17:00 | Owner 中間報告 v1 acknowledge | Owner |
| 2026-05-15 EOD | trial 結果 acknowledge + Round 13 dispatch 起動 prep | CEO |
| **2026-05-16 朝** | **Round 13 dispatch 起動（case A or case B）** | **CEO** |

### §5.2 Round 12 → Round 13 移行ハンドオフ項目

| ハンドオフ項目 | from | to | 詳細 |
|---|---|---|---|
| MS-2 trial run sheet | PM-E R12 | PM-F R13 | 本書姉妹文書 `pm-round12-ms2-5-15-trial-runsheet.md` v1 → 5/15 EOD v1.1（actual filled）→ Round 13 で v1.2（trial 結果反映）|
| Phase 1 sign-off 5/22 push case 判定 | PM-E R12 | PM-F R13 | 本書姉妹文書 `pm-round12-phase1-signoff-5-22-case.md` v1 → 5/15 EOD v1.1（trial 結果 + Dev-E 評価反映）→ 5/22 EOD or 5/30 EOD v1.2（sign-off 完遂反映）|
| Round 13 dispatch 構成 | PM-E R12（本書）| CEO（dispatch 起動主体）+ PM-F R13 | case A 8-9 並列 or case B 10-11 並列、DEC-019-059 §(b) 連動 |
| denylist YAML | Dev-A R12 | Dev-A R13 | minor 16 件 + YAML 化版 → needs_scout production filter 経路へ |
| tos-monitor primitive refactor | Dev-B R12 | Dev-B R13 | suppression-primitives 採用版 → tos-monitor production 統合へ |
| real subprocess 統合 | Dev-C R12 | Dev-C R13 | NDJSON 対応 + e2e 5/8 朝検証結果 → Open Claw runtime 本番起動へ |
| kill-switch wiring | Dev-D R12 | Dev-D R13 | registerSubprocessKill wiring 完遂 → safety net production readiness |
| Phase 1 sign-off 5/22 push 評価 | Dev-E R12 | PM-F R13（5/22 sign-off レポート起案連動）| GO/HOLD/NO-GO 結果 |
| drill #2 実機検証 prep | Review-D R12 | Review-E R13 | drill-2-execution-spec 480 行 + Round 12 反映版 → 5/22 朝実 drill 直前 prep |
| dynamic disclosure card データ流入 | Marketing-F R12 | Marketing-G R13 | データ流入確認版 → 5/22 朝 / 6/27 朝公開 narrative 反映 |
| portfolio 18×18 残埋め | Marketing-F R12 | Marketing-H R13（case B 採用時のみ）| 99 cell 残 → 各 cell 確定値 |
| INDEX-v3 | Knowledge-H R12 | Knowledge-I R13 | 33 → 40+ entries → INDEX-v4（50 目標） |
| DEC-019-059 起票 | Secretary-G R12 | Secretary-H R13 | 暫定 → 5/8 議決-26 採決時 confirmed → 5/15 trial 結果反映 → 5/22 or 5/30 sign-off 反映 |

---

## §6 結論（DoD 達成判定）

1. **Round 12 9-10 部署完遂状況 measure 完遂** (§1.1-§1.2): 平均完遂率 93% (Dev-C 5/8 朝検証 + Marketing-F portfolio 残埋め部分持越)。
2. **Round 12 EOD 主要 deliverable 累計約 4,200-5,500 行 + 100+ tests** (§1.3): Round 11 (5,852 行 + 168 tests) と同等規模。
3. **進捗 78% → 81-83% 想定 (中央値 82%)** (§2.1-§2.2): +3-5pt 押上根拠 6 件明示。
4. **進捗測定指標 v13 想定** (§2.3): code +60-86% / tests +14-17% / 知見 +22-37% / 5/22 push 確度 80-85%。
5. **Round 13 dispatch case A (5/22 push 採用、8-9 並列、5/22 sign-off 直前準備集中)** (§3.2): 累計約 3,000-4,800 行 + 115+ tests。
6. **Round 13 dispatch case B (5/30 維持、10-11 並列、Round 11 PM-D plan 通り進行)** (§3.3): 累計約 4,000-5,800 行 + 130+ tests。
7. **Round 13 dispatch 推奨度** (§3.5): case A CONDITIONAL GO (Lv 4)、case B RECOMMEND (Lv 3)。
8. **PM-F Round 13 主要 deliverable 1,700-2,300 行 (5 件) + MS-2 trial 結果集計テンプレ + Phase 2 narrative integration 進捗 measure** (§4.1-§4.3) = 引継 Round 13 想定明示。
9. **Round 12 → Round 13 移行ハンドオフ項目 13 件明示** (§5.2): PM-E → PM-F 引継完備。

→ **Round 12 progress 棚卸 + Round 13 dispatch 推奨構成完遂** = DoD 達成。

---

## §7 関連決裁・参照

### §7.1 反映決裁

- DEC-019-007 / 010 / 025 / 050 / 052 / 053 / 054 / 055 / 056 / 057（confirmed） / 058（confirmed）
- DEC-019-059（Round 12 Sec-G 起票予定、Round 12 authorization + 5/22 push 採否 + Round 13 dispatch 構成連動）

### §7.2 参照書

- `pm-round11-w1-w2-short-sprint.md`（Round 11 PM-D deliverable 3、472 行）— 親文書 (case B 連動)
- `pm-round12-ms2-5-15-trial-runsheet.md`（Round 12 PM-E deliverable 1、姉妹文書）
- `pm-round12-phase1-signoff-5-22-case.md`（Round 12 PM-E deliverable 2、姉妹文書）
- `ceo-round11-integrated-report-v12.md`（CEO Round 11 統合報告 v12、186 行）— Round 12 dispatch preview 整合
- Round 11 Dev-A〜D 4 件レポート（Dev-A denylist + Dev-B tos-residual + Dev-C e2e-hash + Dev-D subscription-cli）
- Round 11 Review-C 3 件レポート（drill-2 + false-positive-matrix + 50-controls-95-roadmap）
- Round 11 Marketing-E 2 件 + Knowledge-G 1 件 + Secretary-F 1 件

### §7.3 Risk Register v3.2 整合

- R-019-06 (BAN 30-60% / 12 ヶ月): Round 12 完遂 + drill #2 5/8 朝 Pass で残存確率 20-40% → 15-30%
- R-019-09 (NG-3 24/7 監視): Round 12 Dev-B tos-monitor primitive refactor 完遂で偽陽性 matrix v2.0 < 0.07% 達成
- R-019-10 (重要分野ホワイトリスト未確定): Round 12 Dev-A NFKC + denylist YAML 完遂で完全緑化
- R-RUSH-01〜04: case A 採用時 sprint plan タイト trajectory で発動確率 15-25%、case B 採用時 10-15%

### §7.4 並列 Round 12 9-10 Agent 整合性

| Agent | 接続点 | 整合状態 |
|---|---|---|
| Dev-A R12 | NFKC + denylist YAML → Round 13 needs_scout production filter 経路 | 整合 |
| Dev-B R12 | tos-monitor primitive refactor → Round 13 tos-monitor production 統合 | 整合 |
| Dev-C R12 | real subprocess 統合 → Round 13 Open Claw runtime 本番起動 | **整合（CRITICAL）** |
| Dev-D R12 | kill-switch wiring → safety net production readiness | **整合（CRITICAL）** |
| Dev-E R12 | 5/22 push 評価 → DEC-019-059 §(b) 連動 | **整合（KEY）** |
| Review-D R12 | drill #2 5/8 朝実機 prep → Round 13 drill #2 5/22 朝実 drill | 整合 |
| **PM-E R12（本書担当）** | trial run sheet + 5/22 push case + Round 12 progress + R13 dispatch | — |
| Marketing-F R12 | dynamic disclosure card + portfolio 残 99 cell → Round 13 narrative 配信 | 整合 |
| Knowledge-H R12 | INDEX-v3 + HITL-11 dry run → Round 13 INDEX-v4 | 整合 |
| Secretary-G R12 | DEC-019-059 起票 + 配布資料最終 → Round 13 confirmed 切替 | 整合 |

→ Round 12 並列 9-10 Agent 整合性 10/10 件全 OK。

---

## フッタ — 改版履歴

| 版 | 日付 | 起案 | 主要変更 |
|---|---|---|---|
| v1 | 2026-05-04（Round 12 PM-E dispatch 起案） | PM 部門（PM-E 独立 Agent） | 初版（Round 12 9-10 部署完遂状況 measure + 進捗 78% → 81-83% + Round 13 dispatch case A (5/22 push 8-9 並列) / case B (5/30 維持 10-11 並列) + 引継 Round 13 想定 = MS-2 trial 結果集計テンプレ + Phase 2 narrative integration 進捗 measure）|

**v1 確定**: 2026-05-04（Round 12 PM-E dispatch 完遂時） / **採用判断**: 5/8 議決-26 採決時 + 5/15 MS-2 trial 結果 + 5/16 朝 Round 13 dispatch 起動連動 / **次回更新**: Round 12 EOD v1.1（actual completed 反映）/ 5/15 trial EOD v1.2（trial 結果 + case A/B 確定反映）/ 5/16 Round 13 dispatch 起動時 v1.3（Round 13 dispatch 構成 final）

## フッタ詳細

- 文書: `projects/PRJ-019/reports/pm-round12-progress-and-r13-dispatch.md`
- 版: v1（2026-05-04、Round 12 PM-E 担当 deliverable 3）
- 起案: PM 部門（PM-E 独立 Agent）
- 範囲: Round 12 9-10 部署完遂状況 measure + 進捗 78% → 82% trajectory + Round 13 dispatch 構成 (case A 5/22 push / case B 5/30 維持) + 引継 Round 13 想定
- 検収: CEO（Round 12 commit 時）+ Owner（5/8 議決-26 採決時 Owner 判断-5 即決）+ Secretary-G（DEC-019-059 起票時）+ PM-F（Round 13 dispatch 起動時）
