# PRJ-019 W1-W2 short sprint plan — 5/13-5/22 9 日間 daily granularity（Round 11 PM-D deliverable 3）

| 項目 | 内容 |
|---|---|
| 文書 ID | pm-round11-w1-w2-short-sprint |
| 制定日 | 2026-05-04（Round 11 PM-D dispatch 起案） |
| 起票 | PM 部門（PM-D 独立 Agent、general-purpose 経由 dispatch、DEC-019-025 SOP 準拠） |
| 区分 | **W1-W2 short sprint plan v1** — 5/13-5/22 9 日間（W1 7 日 + W2 着手 2 日）daily granularity 計画 |
| 上位決裁（既存維持） | DEC-019-007 / 025 / 050 / 052 / 053 / 055 / 056 / 057 |
| 親文書（破壊しない、差分追加） | `pm-phase1-transition-plan-v1.md`（Round 9 PM-C deliverable 2、554 行）+ `pm-case-c-timeline-final.md`（Round 10 PM-ε deliverable 2、547 行）|
| 範囲 | W1（5/13-5/19、7 日）= subscription-driven CLI 仕上げ + needs_scout productionization + 5/15 MS-2 trial / W2（5/19-5/22、4 日）= 内部運用着手公式準備 + drill #3 prep + 必須 50 軸 95% 達成 |
| ステータス | **draft v1**（5/8 議決-26 Conditional 採択 + Owner 判断-4 選択肢 A 採用時連動） |

---

## §0 Executive Summary（CEO 向け 200 字以内）

PRJ-019 W1-W2 short sprint plan。5/13-5/22 9 日間（W1 5/13-5/19 = 7 日 + W2 着手 5/19-5/22 = 4 日）daily granularity。W1 = subscription-driven CLI 仕上げ + needs_scout productionization + 5/15 MS-2 trial 実施 / W2 = 内部運用着手公式準備 + BAN drill #3 prep + 必須コントロール 50 軸 95% 達成押上。各日 8 部署タスク + Owner 通知ポイント明記。Owner 物理拘束 = 5/13 朝 5 分 + 5/15 夜 5 分 + 5/22 朝 5 分 = 計 15 分のみ（DEC-019-025 SOP 自律展開）。MS-3 5/22 内部運用着手公式 確度 75-80% (Round 10 末) → **80%+ 着地予測**（W1-W2 sprint 完遂時）。

---

## §1 W1-W2 sprint 全体構造

### §1.1 9 日間 timeline overview

```
W1 (5/13-5/19、7 日)
  5/13 (火)  MS-1 W1 着手 day 1   [Owner 5 分]
  5/14 (水)  W1 day 2 (trial 着手準備)
  5/15 (木)  MS-2 trial day 1     [Owner 5 分]
  5/16 (金)  W1 day 4 (trial 結果反映 + 本実装着手)
  5/17 (土)  W1 day 5 (BAN drill #2 実 drill prep)
  5/18 (日)  W1 day 6 (休息 / 軽実装)
  5/19 (月)  W1 完了 + W2 着手     [W1 sign-off]

W2 (5/19-5/22、4 日)
  5/19 (月)  W2 day 1 (W1 完了 + W2 着手 並行)
  5/20 (火)  W2 day 2 (needs_scout 本実装本格化)
  5/21 (水)  W2 day 3 (drill #2 実 drill 5/22 朝 prep final)
  5/22 (木)  MS-3 内部運用着手公式 day 1 [Owner 5 分]
```

### §1.2 W1-W2 期間中の主要マイルストン (PM-ε case-C timeline §1.1 整合)

| MS | 日付 | 内容 | 確度 (Round 10 末) | W1-W2 sprint 完遂後 |
|---|---|---|---|---|
| MS-1 | 5/13 | W1 着手 | 85% | 90% |
| MS-2 | 5/15 | 内部運用着手 trial | 70% | 80% |
| MS-3 | 5/22 | 内部運用着手 公式 | 75-80% | **80%+** |

### §1.3 sprint 期間中の Owner 物理拘束 (3 ポイント、計 15 分)

| 日付 | Owner 拘束時刻 | 内容 | 拘束時間 |
|---|---|---|---|
| 5/13 朝 09:00 | W1 着手 GO 確認会議 | 5 分（GO/NoGo 即決） |
| 5/15 夜 21:00 | MS-2 trial 中間報告 v1 acknowledge | 5 分（trial 結果 acknowledge or 中止判断） |
| 5/22 朝 09:00 | MS-3 内部運用着手公式 GO 確認会議 + Owner 中間報告 v2 acknowledge | 5 分（GO/NoGo 即決） |
| **計** | — | — | **15 分**（DEC-019-052 (c) Channel 3 整合）|

→ Owner 物理拘束 15 分 / 9 日間 = 約 1.5 分/day = Owner 残動作最小化維持。

---

## §2 W1 (5/13-5/19) 日次タスク + 部署別

### §2.1 5/13 (火) W1 day 1 — MS-1 W1 着手

| Slot | 担当 | タスク | 完遂条件 | DoD |
|---|---|---|---|---|
| 09:00-09:05 | **Owner + CEO** | **W1 着手 GO 確認会議（5 分）** | Owner 「OK」即決 | MS-1 GO |
| 09:05-12:00 | Dev | G-V2-11 OAuth 隔離本番統合 + W1 ハードガード G-01〜G-08 検証 | 8 件全件本番統合 PASS | 軸-1/3 寄与 |
| 09:05-12:00 | Review | 必須コントロール 50 中 ≥48 件達成 確認 + drill #2 5/8 朝実機検証 結果反映 | 50 中 35→43 件以上 押上 | 軸-3 +8pt |
| 13:00-15:00 | Dev | trial 環境構築 (mock-claw mode + dry-run mode + audit log) | 環境変数 + secret + log 配置完遂 | MS-2 prep |
| 13:00-17:00 | PM | W1-W2 sprint daily standup 進捗報告 + 5/14 タスク確認 | standup 完遂 | 整合維持 |
| 15:00-17:00 | Dev | needs_scout MVP (Round 9 着地版) trial mode 動作確認 | mock fetch 20 record 成功 | MS-2 prep |
| 13:00-17:00 | Marketing | timeline cards 設計 (K3.1-K3.5 + Phase 2 GO/NoGo) | cards 設計 v1 | 配布物 #11 補強 |
| 13:00-17:00 | Secretary | DEC-019-057 暫定 → 確定 status 切替（Owner 判断-4 即決済反映）| status 切替完遂 | DEC 整合 |
| 13:00-17:00 | Knowledge | Round 10 Dev-β/γ + Review-δ 成果から patterns 抽出 (3 ファイル) | patterns 3 ファイル投入 | DEC-019-033 整合 |
| 17:00-18:00 | CEO | day 1 統合 sign-off + 5/14 GO 判定 | sign-off 完遂 | day 1 完遂 |

#### Owner 通知ポイント

| 通知 | 時刻 | 内容 |
|---|---|---|
| 1 | 09:00 | W1 着手 GO 確認会議 (Owner 5 分) |
| 2 | 18:00 | day 1 完遂報告（5 行サマリ、Owner 確認のみ、即決不要）|

### §2.2 5/14 (水) W1 day 2 — trial 着手準備

| Slot | 担当 | タスク | 完遂条件 | DoD |
|---|---|---|---|---|
| 09:00-11:00 | Dev | JSON IF dispatch trial mode 動作確認（Round 9 案 9-B 着地版） | round-trip 通信 dummy data Pass | MS-2 prep |
| 09:00-12:00 | Review | tos-monitor (Round 10 Dev-β 1,344 行) trial mode 起動確認 | 4 detector + 2 hooks 起動 OK | 軸-3 寄与 |
| 11:00-12:00 | Dev | mock-claw e2e (Round 10 Dev-γ Full Pass 5 cases) trial mode 動作確認 | 5 cases 全 PASS | MS-2 prep |
| 13:00-15:00 | Dev + Review | trial run rehearsal (dummy data で全 4 段階 1 周完遂) | rehearsal 1 周 wall-clock ≤ 60 min | MS-2 prep |
| 13:00-17:00 | PM | trial 5/15 朝実施 GO 判定資料 起案 + 5/15 timeline final 確認 | 資料 v1 完成 | MS-2 prep |
| 13:00-17:00 | Marketing | 5/22 内部運用着手 narrative 起案 (Marketing-D narrative draft v1 から差分) | narrative draft v1.1 | 配布物 #11 補強 |
| 13:00-17:00 | Secretary | dashboard 更新 (W1 day 1-2 完遂反映) | dashboard 同期 | 整合維持 |
| 13:00-17:00 | Knowledge | pitfalls 抽出 (3 ファイル、Round 10 失敗パターン from drill #2 prep) | pitfalls 3 ファイル投入 | DEC-019-033 整合 |
| 17:00-18:00 | CEO + PM | trial 5/15 朝実施 GO 判定会議 + rollback 手順 final 確認 | GO 判定完遂 | MS-2 GO |

#### Owner 通知ポイント

| 通知 | 時刻 | 内容 |
|---|---|---|
| 1 | 18:00 | day 2 完遂報告（5 行サマリ、trial 5/15 朝実施 GO 確定、Owner 確認のみ）|

### §2.3 5/15 (木) W1 day 3 — MS-2 trial day 1

| Slot | 担当 | タスク | 完遂条件 | DoD |
|---|---|---|---|---|
| 09:00-11:05 | **Dev + Review + PM + CEO** | **MS-2 trial 実施（120 分 timeline）** | trial 成功判定 3 件全件達成 | MS-2 達成 |
| 11:05-12:00 | PM + CEO | trial 結果集約レポート 起案 + 中間報告 v1 起案 | レポート 200-300 行 + 中間報告 v1 完成 | Owner 通知 prep |
| 13:00-15:00 | Dev | trial 結果反映 (needs_scout output 分析 + 抽出 needs 1-2 件 詳細化) | 抽出 needs 詳細レポート | 軸-1 強化 |
| 13:00-15:00 | Review | trial audit log 詳細検証 + drill #2 5/17 実 drill prep 着手 | audit log 整合確認 + drill #2 prep | 軸-2/3 寄与 |
| 15:00-17:00 | Marketing | trial 成功 narrative 反映 (5/22 narrative draft v1.1 → v1.2) | narrative v1.2 起案 | 配布物 #11 補強 |
| 15:00-17:00 | Secretary | DEC-019-058 起票準備 (Round 11 8 並列 dispatch 完遂 acknowledge) | DEC 起票 draft | DEC 整合 |
| 15:00-17:00 | Knowledge | trial pattern 抽出 (1 ファイル、MS-2 trial 成功事例) | pattern 1 ファイル投入 | DEC-019-033 整合 |
| **21:00-21:05** | **Owner + CEO** | **MS-2 trial 中間報告 v1 acknowledge（5 分）** | Owner 「OK」即決 or 中止判断 | MS-2 結果 acknowledge |

#### Owner 通知ポイント

| 通知 | 時刻 | 内容 |
|---|---|---|
| 1 | 21:00 | **MS-2 trial 中間報告 v1（Slack push、Owner 5 分 acknowledge）**|

### §2.4 5/16 (金) W1 day 4 — trial 結果反映 + 本実装着手

| Slot | 担当 | タスク | 完遂条件 | DoD |
|---|---|---|---|---|
| 09:00-12:00 | Dev | needs_scout 本実装着手 (HN/PH/GitHub Trending API 本番化、5/22 公式着手前提) | API 認証 + 設計レビュー | MS-3 prep |
| 09:00-12:00 | Review | drill #2 5/17 実 drill prep + 偽陽性 matrix v2.0 起案 | matrix v2.0 draft | 軸-2 強化 |
| 13:00-15:00 | Dev | subscription-driven CLI 仕上げ (DEC-019-051 月総額 ≤$430 維持監視) | CLI script 動作確認 | 軸-4 維持 |
| 13:00-15:00 | Review | tos-monitor production 統合検証 (Round 10 Dev-β 1,344 行 + Round 11 Dev-B 残実装 6 件) | tos-monitor production ready | 軸-3 +2pt |
| 15:00-17:00 | PM | W1 残務 review + 5/17-5/19 タスク確認 + W2 sprint plan 起案 | W2 plan v1 完成 | sprint 整合 |
| 15:00-17:00 | Marketing | portfolio Section 1-10 (Round 5/6 草稿活用) 反映準備 | Section 1-10 確認 | 配布物 #11 補強 |
| 15:00-17:00 | Secretary | dashboard 更新 (MS-2 trial 結果反映、active-projects.md 同期) | dashboard 同期 | 整合維持 |
| 15:00-17:00 | Knowledge | decisions 抽出 (Round 10 議決-26 final agenda 由来 4 ファイル) | decisions 4 ファイル投入 | DEC-019-033 整合 |
| 17:00-18:00 | CEO | day 4 統合 sign-off + 5/17 GO 判定 | sign-off 完遂 | day 4 完遂 |

#### Owner 通知ポイント

| 通知 | 時刻 | 内容 |
|---|---|---|
| 1 | 18:00 | day 4 完遂報告（5 行サマリ、Owner 確認のみ）|

### §2.5 5/17 (土) W1 day 5 — BAN drill #2 実 drill prep

| Slot | 担当 | タスク | 完遂条件 | DoD |
|---|---|---|---|---|
| 09:00-12:00 | Review + Owner (option) | BAN drill #2 実 drill prep final + Owner 同席 option 確認 | drill #2 prep complete | 軸-2 +1pt 即時 |
| 09:00-12:00 | Dev | needs_scout 本実装 day 2 (HN API integration) | HN API 動作確認 | MS-3 prep |
| 13:00-15:00 | Dev | needs_scout 本実装 day 2 (PH API integration) | PH API 動作確認 | MS-3 prep |
| 13:00-15:00 | Review | drill #2 実 drill (mock 中心、本番には影響無) | drill #2 dry exec full Pass 12/12 | 軸-2 +1pt |
| 15:00-17:00 | Marketing | 5/22 朝公開 narrative draft v1.2 → v1.3 (drill #2 結果反映) | narrative v1.3 完成 | 配布物 #11 補強 |
| 15:00-17:00 | PM | drill #2 結果 sign-off + 軸-2 PASS acknowledge + 5/18 軽実装計画 | sign-off 完遂 | 軸-2 確定 |
| 15:00-17:00 | Secretary | DEC-019-058 起票完遂 (Round 11 8 並列 dispatch 完遂 acknowledge) | DEC 起票完遂 | DEC 整合 |
| 15:00-17:00 | Knowledge | pitfalls 追加 (drill #2 失敗パターン 1 ファイル) | pitfalls 1 ファイル投入 | DEC-019-033 整合 |
| 17:00-18:00 | CEO | day 5 統合 sign-off | sign-off 完遂 | day 5 完遂 |

#### Owner 通知ポイント

| 通知 | 時刻 | 内容 |
|---|---|---|
| 1 | 18:00 | day 5 完遂報告（5 行サマリ、drill #2 Pass 反映、Owner 確認のみ）|

### §2.6 5/18 (日) W1 day 6 — 休息 / 軽実装

| Slot | 担当 | タスク | 完遂条件 | DoD |
|---|---|---|---|---|
| 09:00-12:00 | Dev (option) | needs_scout 本実装 day 3 (GitHub Trending API integration、軽実装) | GitHub Trending API 動作確認 | MS-3 prep |
| 09:00-12:00 | Review (option) | tos-monitor production 統合検証 day 2 + 50 control 再監査 v1.2 起案 | 50 control 95% 押上 | 軸-3 +5pt |
| 13:00-17:00 | (休息) | (休息日、軽実装のみ) | — | — |
| 13:00-15:00 | PM (option) | W1 完了 sign-off prep + W2 sprint plan v1 → v1.1 | W2 plan v1.1 | sprint 整合 |
| 17:00-18:00 | CEO | day 6 統合 sign-off | sign-off 完遂 | day 6 完遂 |

#### Owner 通知ポイント

| 通知 | 時刻 | 内容 |
|---|---|---|
| 1 | (休息日のため通知なし) | — |

### §2.7 5/19 (月) W1 day 7 — W1 完了 + W2 着手 並行

| Slot | 担当 | タスク | 完遂条件 | DoD |
|---|---|---|---|---|
| 09:00-12:00 | Dev | W1 完了 sign-off + W2 着手 (needs_scout 本実装 day 4) | W1 sign-off + W2 day 1 着手 | W1 完遂 |
| 09:00-12:00 | Review | W1 完遂 sign-off + 必須 50 軸 95% 達成判定 + drill #3 prep 着手 | 50 軸 95%（≥48/50）達成 | 軸-3 PASS 即時 |
| 13:00-15:00 | Dev | needs_scout 本実装 day 4 (3 API 統合 + denylist filter 完遂) | 統合動作確認 | MS-3 prep |
| 13:00-15:00 | Review | drill #3 5/29 prep 起案 (drill #2 結果反映) | drill #3 prep v1 | 軸-2 強化 |
| 15:00-17:00 | PM | W1 完遂 sign-off レポート + W2 sprint plan final + Owner 中間報告 v2 起案 | sign-off + 中間報告 v2 完成 | W1 完遂 |
| 15:00-17:00 | Marketing | 5/22 朝公開 narrative final v1.4 (W1 完遂 + drill #2 Pass + 軸-3 95% 達成 反映) | narrative v1.4 完成 | 配布物 #11 final |
| 15:00-17:00 | Secretary | dashboard 更新 (W1 完遂反映、active-projects.md 同期) + progress 更新 | dashboard + progress 同期 | 整合維持 |
| 15:00-17:00 | Knowledge | W1 完遂 知見抽出 (patterns 2 + decisions 2 + pitfalls 2 = 6 ファイル) | 知見 6 ファイル投入 | DEC-019-033 整合 |
| 17:00-18:00 | CEO | W1 完遂 sign-off + Round 12 dispatch prep | sign-off 完遂 | W1 完遂 |

#### Owner 通知ポイント

| 通知 | 時刻 | 内容 |
|---|---|---|
| 1 | 18:00 | **W1 完遂報告（10 行サマリ、Owner 確認のみ、5/22 朝公開 GO 確認 prep）**|

---

## §3 W2 (5/19-5/22) 日次タスク + 部署別

### §3.1 5/20 (火) W2 day 1 — needs_scout 本実装本格化

| Slot | 担当 | タスク | 完遂条件 | DoD |
|---|---|---|---|---|
| 09:00-12:00 | Dev | needs_scout 本実装 day 5 (HN/PH/GitHub Trending API 本番統合検証) | 本番データ fetch 成功 | MS-3 prep |
| 09:00-12:00 | Review | 必須 50 軸 95% → 100% 押上 (KE 系 5 件 着手 + HITL-11 設計完了) | 50 軸 100% 達成 prep | 軸-3 完全 PASS |
| 13:00-15:00 | Dev | 評価関数 v0 動作確認 + HITL 11 種ゲート 本番統合 検証 | 評価関数 v0 + HITL 統合 PASS | MS-3 prep |
| 13:00-15:00 | Review | drill #3 5/29 prep day 2 + 偽陽性 matrix v2.0 final | matrix v2.0 final | 軸-2 強化 |
| 15:00-17:00 | PM | W2 sprint progress + 5/21-5/22 タスク確認 | progress 同期 | sprint 整合 |
| 15:00-17:00 | Marketing | 5/22 朝公開 narrative final v1.4 → v1.5 (Phase 2 着手前倒し narrative 反映) | narrative v1.5 | 配布物 #11 final |
| 15:00-17:00 | Secretary | dashboard 更新 + DEC-019-058 acknowledge (Round 11 8 並列 dispatch 完遂) | dashboard 同期 | 整合維持 |
| 15:00-17:00 | Knowledge | Phase 2 narrative integration plan 知見抽出 (patterns 2 ファイル) | patterns 2 ファイル | DEC-019-033 整合 |
| 17:00-18:00 | CEO | day 1 統合 sign-off + 5/21 GO 判定 | sign-off 完遂 | day 1 完遂 |

#### Owner 通知ポイント

| 通知 | 時刻 | 内容 |
|---|---|---|
| 1 | 18:00 | day 1 完遂報告（5 行サマリ、Owner 確認のみ）|

### §3.2 5/21 (水) W2 day 2 — drill #2 実 drill 5/22 朝 prep final

| Slot | 担当 | タスク | 完遂条件 | DoD |
|---|---|---|---|---|
| 09:00-12:00 | Review + Owner (option) | drill #2 実 drill 5/22 朝 prep final + Owner 同席 option | drill #2 ready | 軸-2 +1pt |
| 09:00-12:00 | Dev | needs_scout 本実装 day 6 (3 API 統合 final) + 評価関数 v0 final | needs_scout production ready | MS-3 prep |
| 13:00-15:00 | Dev | tos-monitor production 統合 final (Round 10 Dev-β + Round 11 Dev-B 残実装 6 件統合) | tos-monitor production final | 軸-3 強化 |
| 13:00-15:00 | Review | tos-monitor 4 detector × 5 scenario = 20 cell 全 PASS 検証 | 20 cell 全 PASS | 軸-3 完全 PASS |
| 15:00-17:00 | PM | MS-3 5/22 内部運用着手公式 GO 判定資料 起案 + 中間報告 v2 final | 資料 + 中間報告 v2 完成 | MS-3 prep |
| 15:00-17:00 | Marketing | 5/22 朝公開 narrative final v1.5 → final （6/27 朝公開準備並行） | narrative final | 配布物 #11 final |
| 15:00-17:00 | Secretary | dashboard 更新 + 5/22 朝 Owner 中間報告 v2 配信 prep | dashboard 同期 + Slack ready | 整合維持 |
| 15:00-17:00 | Knowledge | drill #2 知見 + tos-monitor production 知見抽出 (decisions 2 + pitfalls 2 = 4 ファイル) | 知見 4 ファイル | DEC-019-033 整合 |
| 17:00-18:00 | CEO + PM | MS-3 5/22 朝公式着手 GO 判定会議 + Owner 中間報告 v2 final 確認 | GO 判定完遂 | MS-3 GO |

#### Owner 通知ポイント

| 通知 | 時刻 | 内容 |
|---|---|---|
| 1 | 18:00 | day 2 完遂報告（5 行サマリ、MS-3 5/22 朝公式着手 GO 確定、Owner 確認のみ）|

### §3.3 5/22 (木) W2 day 3 — MS-3 内部運用着手公式 day 1

| Slot | 担当 | タスク | 完遂条件 | DoD |
|---|---|---|---|---|
| **09:00-09:05** | **Owner + CEO** | **MS-3 内部運用着手公式 GO 確認会議 + Owner 中間報告 v2 acknowledge（5 分）**| Owner 「OK」即決 | MS-3 GO |
| 09:05-12:00 | Dev | Open Claw runtime 本番起動 (mock-claw → 実 claw への切替確認) | runtime 本番起動 PASS | MS-3 達成 |
| 09:05-12:00 | Review | BAN drill #2 実 drill 5/22 朝実施 (Owner 同席 option) | drill #2 dry exec 12/12 Full Pass | 軸-2 +1pt |
| 13:00-15:00 | Dev | needs_scout production runtime 起動 + 1 周完遂 | 1 周完遂 + 実 needs 抽出 ≥ 5 件 | MS-3 達成 |
| 13:00-15:00 | Review | tos-monitor production runtime 起動確認 + 24/7 監視開始 | 24/7 監視開始 | 軸-3 完全 PASS |
| 15:00-17:00 | PM | MS-3 達成 sign-off + Owner 中間報告 v2 配信 + 5/22-5/26 W2 残務計画 | sign-off + 配信完遂 | MS-3 確定 |
| 15:00-17:00 | Marketing | 5/22 朝公開 narrative 配信完遂 + 「発射延期 = 正常運用」narrative 同期 | narrative 配信 | 配布物 #11 完遂 |
| 15:00-17:00 | Secretary | dashboard 更新 (MS-3 達成反映) + active-projects.md 同期 + progress 更新 | dashboard + progress 同期 | 整合維持 |
| 15:00-17:00 | Knowledge | MS-3 達成 知見抽出 (patterns 3 + decisions 3 = 6 ファイル) | 知見 6 ファイル | DEC-019-033 整合 |
| 17:00-18:00 | CEO | MS-3 達成 sign-off + Round 12 dispatch GO 判定 | sign-off 完遂 | MS-3 完遂 |

#### Owner 通知ポイント

| 通知 | 時刻 | 内容 |
|---|---|---|
| 1 | 09:00 | **MS-3 内部運用着手公式 GO 確認会議 (Owner 5 分)**|
| 2 | 18:00 | **MS-3 達成報告（10 行サマリ、Owner 確認のみ、Phase 1 W2-W4 期間 GO 確認）**|

---

## §4 W1-W2 sprint 中の達成目標一覧

### §4.1 必須コントロール 50 軸 95% 達成 trajectory

| 日付 | 累計達成件数 | 達成率 | 寄与要素 |
|---|---|---|---|
| 5/13 開始時点 | 35/50 | 70% (Round 10 末確定) | Round 10 Review-δ + Dev-γ |
| 5/13 EOD | 38/50 | 76% | Round 7-A 完遂分本番統合 (G-02/G-07/G-09/G-10) |
| 5/14 EOD | 40/50 | 80% | tos-monitor production 統合 +2 件 |
| 5/15 EOD | 41/50 | 82% | trial 結果反映で +1 件 (HITL-9 強化) |
| 5/16 EOD | 43/50 | 86% | needs_scout 本実装着手で +2 件 (G-Top-2 + C-OC-03) |
| 5/17 EOD | 45/50 | 90% | drill #2 Pass で C-A-02 PASS + drill #3 prep で +1 件 |
| 5/18 EOD | 46/50 | 92% | (軽実装) +1 件 (HITL-11 設計完了) |
| 5/19 EOD | **48/50** | **96%** | **W1 完遂で軸-3 PASS 即時** |
| 5/20 EOD | 49/50 | 98% | W2 着手で +1 件 (KE-01) |
| 5/21 EOD | 49/50 | 98% | drill #2 prep final |
| 5/22 EOD | **50/50** | **100%** | **MS-3 達成 + 軸-3 完全 PASS** |

→ **W1 完遂時点 (5/19 EOD) = 96% 達成 = 軸-3 PASS 即時化**（Round 10 末 Conditional Pass → Full Pass 昇格）。

### §4.2 5 軸 PASS 状況 trajectory（W1-W2 期間）

| 軸 | 5/13 開始 | 5/19 W1 完遂 | 5/22 MS-3 達成 |
|---|---|---|---|
| 軸-1 (mock-claw) | PASS (Round 10 Dev-γ) | PASS 維持 | PASS 強化 (Open Claw runtime 本番起動) |
| 軸-2 (BAN drill) | drill #1 Full Pass | drill #2 dry exec Pass (5/17) | drill #2 実 drill Pass (5/22 朝) |
| 軸-3 (必須 50) | 70% Conditional | **96% PASS** | **100% Full PASS** |
| 軸-4 (API ≤$30) | $0 維持 | $0-2 維持 | $2-5 維持 (本実装期間突入) |
| 軸-5 (Owner 残動作 0) | 達成 | 達成 (Owner 5 分 × 2) | 達成 (Owner 5 分 × 3 計 15 分) |
| **5 軸全 PASS** | **88-92% 確度** | **94-96% 確度** | **97-99% 確度** |

→ W1-W2 sprint 完遂で 5 軸全 PASS 確度 = **97-99%** 着地予測。

### §4.3 MS-3 5/22 内部運用着手公式 確度押上見込み

| 段階 | 確度 | 押上根拠 |
|---|---|---|
| Round 10 末 | 75-80% | PM-ε case-C timeline §2.3.3 算定 |
| W1 着手 5/13 後 | **80%** | MS-1 達成 (確度 85% 達成済) で +5pt |
| W1 day 3 5/15 trial 後 | **82%** | MS-2 trial 達成 (成功時) で +2pt、失敗時は維持 |
| W1 完遂 5/19 後 | **84%** | 軸-3 96% 達成 + 必須 50 PASS 即時化で +2pt |
| 5/21 EOD W2 day 2 後 | **85-86%** | drill #2 prep final + tos-monitor production final で +1-2pt |
| 5/22 朝 GO 判定後 | **80-86% (確定 GO)** | 5/22 朝 Owner GO 即決時に確定 |

→ **MS-3 5/22 内部運用着手公式 確度 = 80%+ 着地予測**（Round 10 末 75-80% から +5-6pt 押上）= DoD 達成。

---

## §5 W1-W2 sprint 中の Round 11 並列 8 Agent との整合

### §5.1 W1-W2 期間中の Agent 別主要タスク

| Agent | W1 (5/13-5/19) 主要タスク | W2 (5/20-5/22) 主要タスク |
|---|---|---|
| Dev-A (Round 11) | minor 16 件 denylist 補完 (5/12 EOD で完遂済前提) | needs_scout 本実装 (HN/PH/GitHub Trending API) |
| Dev-B (Round 11) | tos-monitor high 4 セル primitive + multi-process 独立確証 (5/15 W1 day 3 着手) | tos-monitor production 統合 final |
| Dev-C (Round 11) | mock-claw e2e audit hash chain integrity 検証 (5/13 day 1 着手) + recovery e2e 拡張 | mock-claw production 統合 |
| Review-C (Round 11) | drill #2 5/8 朝実機検証 (W1 開始前) + 偽陽性 matrix v2.0 起案 (W1 day 4-5) | drill #2 実 drill 5/22 朝 + 必須 50 100% 達成監督 |
| **PM-D (本書担当)** | W1-W2 sprint 進行管理 + 5/15 trial scenario | MS-3 GO 判定 + W2 sprint plan |
| Marketing-E (Round 11) | timeline cards 設計 + 5/22 narrative 起案 | 5/22 narrative final + 6/27 朝公開準備 |
| Secretary-F (Round 11) | DEC-019-058 起票 + dashboard 更新 (W1 day 1-7) | DEC-019-058 acknowledge + dashboard 更新 (W2 day 1-3) |
| Knowledge-G (Round 11) | patterns / pitfalls 抽出 (W1 期間 10+ ファイル) | patterns / decisions 抽出 (W2 期間 6+ ファイル) |

### §5.2 PM-D 整合性維持必須項目

| 項目 | 整合先 | 整合状態 |
|---|---|---|
| 議決-26 採択推奨度 Lv 4+ | 本書 §3 (5 軸全 PASS 確度 88-92%) + Round 11 PM-D deliverable 1 §3 | **整合** |
| 案 C ハイブリッド + MS-2 trial 採用 | 本書 §1.2 + §2.3 (MS-2 5/15 trial day 3) | **整合** |
| MS-1〜MS-3 確度 85% / 80% / 80%+ | 本書 §1.2 + §4.3 | **整合** |
| 必須 50 軸 95% 達成 (5/19 EOD 96%) | 本書 §4.1 | **整合** |
| Owner 物理拘束 15 分 / 9 日間 | 本書 §1.3 | **整合** |
| Round 11 PM-D 3 deliverable 整合 | deliverable 1 (final confirmation) + deliverable 2 (MS-2 trial) + 本書 (deliverable 3) | **整合** |
| 配布物 #11 (Marketing) narrative 補強 | Marketing-E timeline cards + 5/22 narrative final | **整合** |
| 配布物 #1/#2 (Secretary) 整合 | Secretary-F DEC-019-058 起票 + dashboard 更新 | **整合** |

→ Round 11 並列 8 Agent + PM-D 3 deliverable 整合性 8/8 件全 OK。

---

## §6 失敗時 sprint plan 修正手順（5 失敗パターン）

### §6.1 失敗パターン 1: 5/13 W1 着手 GO 否決

| 失敗内容 | Owner 5/13 朝 GO 確認会議で「W1 着手 NoGo」即決 |
|---|---|
| 検出 | Owner 即決受領 (5/13 09:05) |
| 修正手順 | sprint plan 全体を 5/19 W1 着手版 (案 B) へ完全 fallback、MS-2 trial 中止、MS-3 5/22 維持 |
| 影響 | W1-W2 sprint 9 日間 → 5/19-5/22 4 日間版 sprint へ縮小 |

### §6.2 失敗パターン 2: 5/15 MS-2 trial 失敗

| 失敗内容 | trial run 副作用検出 or DoD 未達 (実 needs 抽出 0 件 or audit log 不整合) |
|---|---|
| 検出 | Dev + Review による wall-clock 監視 (5/15 11:00 時点) |
| 修正手順 | trial 中止 → 5/22 公式着手で吸収（PM-D deliverable 2 §5 整合）、sprint plan 5/16-5/22 タスク継続 |
| 影響 | MS-2 失敗ペナルティ 0、組織コスト 0、sprint timeline 0 日延期 |

### §6.3 失敗パターン 3: drill #2 実 drill Failed

| 失敗内容 | 5/17 drill #2 dry exec or 5/22 朝 drill #2 実 drill で Failed (12/12 未達) |
|---|---|
| 検出 | Review による drill 結果検証 |
| 修正手順 | MS-3 5/22 内部運用着手延期 5/22 → 5/26 (4 日延期、W2 内吸収)、Round 12 dispatch で drill #2 再 prep |
| 影響 | MS-3 4 日延期、Phase 1 sign-off 6/3 → 6/7 へ 4 日延期 (5/30 暫定 sign-off は廃止) |

### §6.4 失敗パターン 4: 必須 50 軸 95% 未達 (W1 完遂 5/19 時点)

| 失敗内容 | 5/19 EOD 必須 50 達成率 < 95% (≤47/50) |
|---|---|
| 検出 | Review による 50 control 再監査 v1.2 |
| 修正手順 | W2 day 1-2 (5/20-5/21) で集中対応 + KE 系 5 件 W4 期限 binding 維持 + MS-3 5/22 GO は条件付き判定 |
| 影響 | MS-3 5/22 朝 GO 判定で軸-3 Conditional Pass 維持、Phase 1 W4 完遂で 100% 達成 binding |

### §6.5 失敗パターン 5: needs_scout 本実装 wall-clock 超過 (5/22 までに完遂困難)

| 失敗内容 | 5/22 朝時点で needs_scout 本実装 < 80% 完遂 |
|---|---|
| 検出 | Dev + PM による wall-clock 監視 (5/21 EOD) |
| 修正手順 | mock-claw mode 維持 + needs_scout 本実装は 5/26-5/30 (W2 後半) で吸収、MS-3 5/22 朝公式着手は mock 中心で実施 |
| 影響 | MS-3 5/22 朝公式着手は維持 (mock 中心)、needs_scout 本実装完遂は 5/30 (W2 後半) へ 8 日延期 |

### §6.6 5 失敗パターン共通: sprint timeline 延期上限

| 区分 | 延期上限 |
|---|---|
| MS-3 5/22 公式着手 | 最大 4 日延期 (5/26 まで) |
| Phase 1 sign-off 6/3 公式 | 最大 4 日延期 (6/7 まで) |
| Marketing 公開 6/27 朝 | 0 日延期 (DEC-019-052 維持) |
| 6/27 朝公開からの逆算余裕 | 24 日 (6/3-6/27) → 20 日 (6/7-6/27)、4 日縮小だが Marketing 段階 1-3 (5 日) 確保可能 |

→ **6/27 朝公開 0 日延期 binding** = 5 失敗パターン全件で達成可能 sprint plan 設計。

---

## §7 結論（DoD 達成判定）

1. **W1 (5/13-5/19) 7 日間 + W2 (5/19-5/22) 4 日間 = 9 日間 daily granularity 計画完遂** (§2 + §3)。
2. **各日 8 部署タスク + Owner 通知ポイント明記** (§2.1-§2.7 + §3.1-§3.3)。
3. **Owner 物理拘束 15 分 / 9 日間** (§1.3): 5/13 朝 5 分 + 5/15 夜 5 分 + 5/22 朝 5 分。
4. **必須コントロール 50 軸 95% 達成 trajectory 明示** (§4.1): 5/13 70% → 5/19 W1 完遂時点 96% → 5/22 MS-3 達成時点 100%。
5. **5 軸全 PASS 確度 trajectory** (§4.2): 5/13 88-92% → 5/19 94-96% → 5/22 97-99%。
6. **MS-3 5/22 内部運用着手公式 確度 75-80% (Round 10 末) → 80%+ 着地予測** (§4.3) = DoD 達成。
7. **Round 11 並列 8 Agent + PM-D 3 deliverable 整合性 8/8 件全 OK** (§5.2)。
8. **失敗時 sprint plan 修正手順 5 パターン明文化** (§6.1-§6.5) + **6/27 朝公開 0 日延期 binding 維持** (§6.6)。

→ **5/22 内部運用着手公式 確度 80%+ 着地予測** = DoD 達成。

---

## §8 関連決裁・参照

### §8.1 反映決裁

- DEC-019-007 (HITL 11 種、需要_scout 本実装期間内 HITL gate 完全準拠)
- DEC-019-025 (Agent tool permissions SOP、Round 11/12 dispatch SOP 遵守)
- DEC-019-050 (Anthropic spend cap $30、W2 期間 needs_scout 本実装で +$5-10 想定)
- DEC-019-052 (a)(b)(c) (Marketing tone B + portfolio C + 09:00 JST + Channel 3、6/27 朝公開維持)
- DEC-019-053 (2-tier env、production tier W2 期間突入)
- DEC-019-055 (Round 8 Plan 8-Full、prefetch 50-55% 完遂前提)
- DEC-019-056 (Round 9 起票済、議決-26 Conditional 採択前提)
- DEC-019-057 (Owner 判断-4 結果議決、案 C + MS-2 trial 採用)
- DEC-019-058 (Round 11 Secretary-F 起票予定、Round 11 8 並列 dispatch 完遂 acknowledge)

### §8.2 参照書

- `pm-phase1-transition-plan-v1.md`（Round 9 PM-C deliverable 2、§6 + §7 案 C 推奨、554 行）
- `pm-case-c-timeline-final.md`（Round 10 PM-ε deliverable 2、§2.1-§2.3 MS-1/2/3 詳細、547 行）
- `pm-round11-decision-26-final-confirmation.md`（Round 11 PM-D deliverable 1、本書と同 dispatch）
- `pm-round11-ms2-5-15-trial-scenario.md`（Round 11 PM-D deliverable 2、本書と同 dispatch）
- `ceo-round10-integrated-report-v11.md`（CEO Round 10 統合報告 v11、200 行）
- `review-round10-50-controls-re-audit.md`（Round 10 Review-δ 再監査、400 行）

### §8.3 Risk Register v3.2 整合

- R-019-06 (BAN 30-60% / 12 ヶ月): drill #2 5/22 朝 Pass で残存確率 15-30% へ低減
- R-019-09 (NG-3 24/7 監視): tos-monitor production 5/22 起動で 24/7 監視開始
- R-019-10 (重要分野ホワイトリスト未確定): minor 16 件 denylist 5/12 完遂 + W2 期間 KE-01〜04 着手で完全緑化
- R-RUSH-01〜04: W1-W2 sprint 9 日間 daily granularity で発動確率 10-15% へ低減
- R-019-11 (Codex 出力 OSS ライセンス検証フロー未整備): Phase 2 で扱い (Phase 1 範囲外)

### §8.4 並列 Round 11 Agent との整合 (§5 詳細)

- Round 11 PM-D 3 deliverable 整合: deliverable 1 (final confirmation 350-450 行) + deliverable 2 (MS-2 trial 300-400 行) + 本書 (W1-W2 sprint 350-450 行) = 計 1,000-1,300 行 (DoD 達成範囲内)

---

## フッタ — 改版履歴

| 版 | 日付 | 起案 | 主要変更 |
|---|---|---|---|
| v1 | 2026-05-04（Round 11 PM-D dispatch 起案） | PM 部門（PM-D 独立 Agent） | 初版（W1-W2 short sprint plan、9 日間 daily granularity、各日 8 部署タスク + Owner 通知ポイント、必須 50 軸 95% 達成 trajectory + 5 軸全 PASS 確度 + MS-3 確度 80%+ 着地予測 + 失敗時修正手順 5 パターン）|

**v1 確定**: 2026-05-04（Round 11 PM-D dispatch 完遂時） / **採用判断**: 5/8 議決-26 Conditional 採択 + Owner 判断-4 選択肢 A 採用時 / **次回更新**: 5/13 W1 着手後 v1.1（day 1 進捗反映） / 5/19 W1 完遂後 v1.2（W2 sprint plan final 化） / 5/22 MS-3 達成後 v2.0（Phase 1 W2-W4 sprint plan 起案）

## フッタ詳細

- 文書: `projects/PRJ-019/reports/pm-round11-w1-w2-short-sprint.md`
- 版: v1（2026-05-04、Round 11 PM-D 担当 deliverable 3）
- 起案: PM 部門（PM-D 独立 Agent）
- 範囲: W1-W2 9 日間 sprint plan + daily granularity + 各部署タスク + Owner 通知ポイント + 失敗時修正手順
- 検収: CEO（Round 11 commit 時）+ Owner（5/13 朝 / 5/15 夜 / 5/22 朝の 3 ポイント計 15 分）
