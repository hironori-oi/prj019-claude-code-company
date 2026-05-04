# PRJ-019 Round 14 PM-G deliverable 1 — 5/5 議決-26 採決後即時 transition plan（5/5 朝 → 5/22 sign-off の 17 日 transition）

| 項目 | 内容 |
|---|---|
| 文書 ID | pm-round14-5-5-post-decision-transition |
| 制定日 | 2026-05-04 深夜終盤（Round 14 PM-G dispatch 起案） |
| 起票 | PM 部門（PM-G 独立 Agent、general-purpose 経由 dispatch、DEC-019-025 SOP 準拠） |
| 区分 | **5/5 議決-26 採決後即時 transition plan v1**（5/5 朝 06:45 採決完了直後 → 内部運用着手公式 5/22 までの 17 日 transition / 各日 deliverable + 担当部署 + dependency / 3 マイルストン整合確保） |
| 上位決裁 | DEC-019-007 / 010 / 025 / 050 / 052 / 053 / 054 / 055 / 056 / 057 / 058 / 059（confirmed）/ 060（5/5 採決後 confirmed 化予定） |
| 親文書 | `pm-round12-phase1-signoff-5-22-case.md`（414 行）+ `pm-round13-decision-26-pre-emption-evaluation.md`（518 行）+ `ceo-round13-integrated-report-v14.md`（241 行） |
| 範囲 | Owner formal「採決日 5/5」directive 受領後、5/5 朝 06:45 採決完了 → 5/22 朝 09:00 sign-off 候補日までの 17 日間 daily transition plan + 3 マイルストン整合確保 |
| ステータス | **draft v1**（5/5 採決完了直後 v1.1 化、Owner directive「5/5 採決日確定」前提） |

---

## §0 Executive Summary（CEO 向け 200 字）

PRJ-019 Round 14 PM-G deliverable 1。Owner formal「採決日 5/5」directive 反映の 5/5 朝 06:45 採決完了直後 → 5/22 朝 09:00 sign-off 候補日までの 17 日 transition。Day-by-day 17 日 deliverable 表（5/5 採決後 / 5/6-12 Round 14-15 / 5/13 MS-1 W1 / 5/15 MS-2 trial / 5/16 trial 結果反映 / 5/17-21 W2 + 必須 50 軸 100% 達成 / 5/22 sign-off）+ 3 マイルストン（MS-2 5/15 trial / drill #2 5/7 朝 / 5/15 中間チェック）整合確保。10 部署 daily owner + dependency 表 + critical path 5 件 + risk register v3.3 整合 + Round 14-15 dispatch 連動。

---

## §1 17 日 transition overview

### §1.1 17 日 timeline 全体像

```
5/5 (日) 06:45     ★ 議決-26 採決完了（Owner formal「採決日 5/5」directive 整合）
5/5 06:45-EOD      DEC-019-060 confirmed 切替 + Round 14 dispatch 起動
5/6 (月)           Round 14 progress + drill #2 5/7 朝 prep + Round 14 deliverable 11 並列
5/7 (火) 06:00-08:00  ★ MS-1: drill #2 5/7 朝実機検証（Review-F + Dev-C real-mode wire-up）
5/7 (火) EOD       Round 14 完遂 + Round 15 dispatch preview
5/8 (水)           Round 15 dispatch 起動（9-10 並列）
5/9-12             Round 15 deliverable + Owner 中間報告 v1 prep
5/13 (火)          ★ MS-1 内部運用 W1 着手（Owner 5 分朝）+ Round 15 完遂 + Round 16 dispatch
5/14 (水)          W1 day 2 + 5/15 trial 直前最終確認 + Dev-E 評価 final
5/15 (木) 09:00-18:00  ★ MS-2: 5/15 trial 9 時間運用（Owner 5 分 17:00）+ ★ 5/15 中間チェック
5/16 (金)          trial 結果反映 + Round 16 dispatch + DEC-019-061 起票（Phase 1 sign-off 5/22 確定）
5/17 (土) - 5/19 (月)  W1 残務 + 必須 50 軸 96% 達成
5/20 (火) - 5/21 (水)  W2 day 1-2 + 必須 50 軸 100% 達成 prep
5/22 (木) 09:00     ★ Phase 1 sign-off 候補日（Owner 5 分朝 GO 確認会議）
```

### §1.2 3 マイルストン整合確保

| MS | 日付 | 内容 | 整合確保事項 |
|---|---|---|---|
| **MS-1: drill #2 5/7 朝実機検証** | 5/7 (火) 06:00-08:00 | Review-F + Dev-C real-mode wire-up + 1-shot harness 実機実行 | ① 5/5 採決完了後 36-48h 余裕 ② Dev-C R13 1-shot harness 567 行流用（5/7 候補日 parameterize 対応済）③ Review-E R13 5 軸全 GO（GO 度 4.5/5）|
| **MS-2: 5/15 MS-2 trial 9 時間運用** | 5/15 (木) 09:00-18:00 | trial run #1 (3h 軽負荷) + run #2 (3h real subprocess) + 12 件 KPI 集計 | ① Round 15 完遂後（Dev-A〜E 5/12 EOD）② Dev-E Round 15 GO 判定 5/14 EOD ③ Owner 物理拘束 5 分（17:00 Slack quick-action） |
| **MS-3: 5/15 中間チェック** | 5/15 (木) 12:00-13:00 | trial run #1 結果中間 review + continue/abort 判定 5 軸 | ① trial run #1 EOD 12:00 直後 ② CEO + PM-G + Dev + Review 共同 review ③ abort criteria 4 件 発動チェック |

→ 3 マイルストン全件整合、5/5 → 5/22 transition で 0 件 conflict。

---

## §2 17 日 daily deliverable + 担当部署 + dependency

### §2.1 5/5 (日) — 議決-26 採決完了 + DEC-019-060 confirmed 切替

| 時刻 | 担当 | deliverable | dependency |
|---|---|---|---|
| 04:00 | Sec-H | 配布資料 13 件 5/5 朝 case patch 配布完遂 acknowledge | 5/4 EOD ready 状態 |
| 04:30-05:30 | Owner | 配布資料閲覧（45-60 分） | Sec-H 配布完遂 |
| 06:00-06:20 | Owner + CEO | **議決-26 採決（α/β/γ/δ 4 択 → CEO 推奨 (C) 5/7 朝 採択前提）** | 配布資料閲覧完遂 |
| 06:20-06:40 | Owner + CEO | drill #2 dry-run 結果 acknowledge（45 セル全 true）| 採決完了 |
| 06:40-06:45 | Owner | sign-off + 議決-26 議事録 acknowledge | drill #2 acknowledge |
| 06:45 | CEO + Sec-H | DEC-019-060 status: 暫定 → confirmed 切替 + dashboard 反映 | Owner sign-off |
| 07:00-09:00 | CEO | Round 14 dispatch 起動（11 並列）+ 全部署キックオフ mail | DEC-019-060 confirmed |
| 09:00-EOD | 全部署 | Round 14 deliverable 着手 | dispatch mail 受領 |
| EOD 18:00 | Sec-H | weekly digest #1 起票（5/5 採決完了 acknowledge + Round 14 progress 中間報告）| Round 14 dispatch 起動完遂 |

### §2.2 5/6 (月) — Round 14 progress + drill #2 5/7 朝 prep

| 時刻 | 担当 | deliverable | dependency |
|---|---|---|---|
| 06:00-12:00 | Dev-A | YAML loader fail-fast 化 + multilingual filter 統合 進捗 50% | Dev-A R13 引継 |
| 06:00-12:00 | Dev-B | heartbeat-gap detector primitive 化 + detector-functions z-score 統合 進捗 50% | Dev-B R13 引継 |
| 06:00-12:00 | Dev-C | resource-constraints syscall 実装着手 + **drill-2 real-mode wire-up（5-10 行）完遂** | Dev-C R13 1-shot harness 567 行 |
| 06:00-12:00 | Dev-D | wireSpawnHandleToKillSwitch 完全統合 進捗 50% | Dev-D R13 引継 |
| 06:00-12:00 | Dev-E | FileHitl11Gate I/O 配線 + KE-02 trigger orchestrator wiring 進捗 50% | Dev-E R13 KE 系 5/5 件完遂 |
| 12:00-13:00 | CEO + PM-G | Round 14 中間 progress review | Dev 5 並列 progress 50% |
| 13:00-18:00 | Review-F | drill #2 5/7 朝実機検証 prep（runbook 確定版 execute prep + 機材 / 人員 / 通知 channel 準備）| Review-E R13 ランブック確定 |
| 13:00-18:00 | Marketing-H | extraction Vercel build hook + cron scheduling 着手 | Marketing-G R13 7 extraction script |
| 13:00-18:00 | Knowledge-J | INDEX-v4 → v5 + Round 13 由来 ナレッジ抽出 | Knowledge-I R13 47 entries |
| 13:00-18:00 | Web-Ops-B | shadcn/ui 物理 install + Vercel Analytics 接続 着手 | Web-Ops-A R13 17 file |
| 23:30 | Review-F | drill #2 5/7 朝 dry-run 再実行（45 セル全 true 確認）| Review-F prep 完遂 |
| EOD 18:00 | Sec-I | DEC-019-061 起票（Round 15 dispatch authorization preview）| Round 14 中間 progress |

### §2.3 5/7 (火) — ★ MS-1: drill #2 5/7 朝実機検証 + Round 14 完遂

| 時刻 | 担当 | deliverable | dependency |
|---|---|---|---|
| 03:30-04:00 | Sec-I | drill #2 関係者 5/7 04:00 集合 acknowledge cron 配信 | 5/6 23:30 dry-run 完遂 |
| 04:00-06:00 | Review-F + Dev-C | drill #2 5/7 朝実機検証 prep final | Review-F runbook |
| **06:00-08:00** | **Review-F + Dev-C** | **★ drill #2 5/7 朝実機検証 実施（1-shot harness real-mode）★** | Dev-C 5/6 wire-up |
| 08:00-09:00 | Review-F | drill #2 結果集計（軸-2 +1pt 即時 PASS or FAIL 判定）| 実機検証完遂 |
| 09:00-12:00 | Dev 5 並列 | Round 14 deliverable 進捗 80% | drill #2 結果 acknowledge |
| 12:00-13:00 | CEO + PM-G + Review-F | drill #2 結果 review + Round 14 中間 progress | drill #2 集計 |
| 13:00-18:00 | Dev 5 並列 + 他 5 部署 | Round 14 deliverable 完遂 | Round 14 進捗 80% |
| EOD 18:00 | PM-G | Round 14 完遂レポ + Round 15 dispatch preview | 全部署 EOD 報告 |
| EOD 19:00 | Sec-I | DEC-019-061 confirmed + Round 15 dispatch 起動 trigger 待機 | Round 14 完遂 |

### §2.4 5/8 (水) — Round 15 dispatch 起動（9-10 並列）

| 時刻 | 担当 | deliverable | dependency |
|---|---|---|---|
| 06:00-09:00 | CEO | Round 15 dispatch 起動 mail（9-10 並列）+ 全部署キックオフ | DEC-019-061 confirmed |
| 09:00-18:00 | 全部署 | Round 15 deliverable 着手（5/22 sign-off case 詳細詰め優先）| dispatch mail 受領 |
| EOD 18:00 | PM-H | Round 15 中間 progress + 5/22 case 詰め 50% | Round 15 起動 |

### §2.5 5/9-5/12 — Round 15 deliverable + Owner 中間報告 v1 prep

| 日付 | 担当 | deliverable | dependency |
|---|---|---|---|
| 5/9 (木) | Dev-A〜E | Round 15 進捗 30% | Round 15 起動 |
| 5/10 (金) | Marketing-I | extraction script production runtime 起動 | Marketing-H R14 |
| 5/11 (土) | Dev 5 並列 | Round 15 進捗 60% + 必須 50 軸 5/11 EOD 85% 達成 | Dev-E KE 系完遂 |
| 5/12 (日) | Dev-A〜E | Round 15 完遂 + Dev-E 評価 final prep | 進捗 60% |
| 5/12 EOD | PM-H | Owner 中間報告 v1 起案（trial 直前最終確認）| Round 15 完遂 |

### §2.6 5/13 (火) — ★ MS-1 内部運用 W1 着手 + Round 16 dispatch

| 時刻 | 担当 | deliverable | dependency |
|---|---|---|---|
| 09:00-09:05 | Owner + CEO | W1 着手 GO 確認会議（Owner 5 分朝） | 5/12 EOD Owner 中間報告 v1 acknowledge |
| 09:05-EOD | Dev | Open Claw runtime 起動 + needs_scout production runtime 起動 | Dev-D R11 spawn-claude-code + Dev-C R12 real subprocess |
| 09:05-EOD | Review | tos-monitor production runtime 起動 + 24/7 監視開始 | Round 10 Dev-β 1,344 行 + Round 11 Dev-B 残実装 |
| EOD 18:00 | CEO | Round 16 dispatch 起動（9 並列）| W1 着手完遂 |

### §2.7 5/14 (水) — W1 day 2 + 5/15 trial 直前最終確認 + Dev-E 評価 final

| 時刻 | 担当 | deliverable | dependency |
|---|---|---|---|
| 09:00-12:00 | Dev | W1 day 2 + needs_scout 1 周完遂 + 実 needs ≥ 5 件抽出 | W1 着手 |
| 12:00-13:00 | CEO + PM-H | 5/15 trial 直前最終確認 review | W1 day 2 進捗 |
| **18:00** | **Dev-E** | **★ Round 15-16 GO 判定会議 final（5/22 push 採用 4 条件のうち 3 件 acknowledge）★** | Dev-A〜E 完遂 |
| EOD 18:00 | PM-H | trial run sheet 当日執行 spec final 確定 | Dev-E GO 判定 |

### §2.8 5/15 (木) — ★ MS-2: 5/15 trial 9 時間運用 + ★ 5/15 中間チェック

| 時刻 | 担当 | deliverable | dependency |
|---|---|---|---|
| 08:30-09:00 | PM-H + Dev + Review | trial 起動準備 10 件チェックリスト OK | 5/14 EOD prep |
| 09:00-12:00 | Dev + Review | trial run #1 3 cycle / DoD 7 件 達成 | 起動準備完遂 |
| **12:00-13:00** | **CEO + PM-H + Dev + Review** | **★ 5/15 中間チェック review 5 軸 continue/abort 判定 ★** | trial run #1 EOD |
| 13:00-16:00 | Dev + Review | trial run #2 3 cycle / DoD 7 件 達成 | 中間チェック continue |
| 16:00-17:00 | CEO + PM-H | Owner 通知準備（5 行サマリ + 200-300 行詳細）| trial run #2 EOD |
| **17:00** | **Owner** | **★ Slack quick-action 4 択 button 即決（5 分） ★** | 通知配信 |
| 17:00-18:00 | PM-H + Dev + Review + Sec | 後処理 6 件 DoD 達成 + 12 件 KPI 集計 v1.1 起案 | Owner 即決 |

### §2.9 5/16 (金) — trial 結果反映 + Round 17 dispatch + DEC-019-062 起票

| 時刻 | 担当 | deliverable | dependency |
|---|---|---|---|
| 06:00 | PM-H | trial 結果 v1.1 → v1.2 化（Round 17 dispatch 連動）| 5/15 EOD v1.1 |
| 09:00 | CEO + PM-H | Round 17 dispatch 構成 final 確認（5/22 push case / 5/30 維持 case）| trial 結果 v1.2 |
| 09:30 | Sec-J | DEC-019-062 起票（Round 17 authorization + Phase 1 sign-off 5/22 確定 case）| trial Owner Approve |
| 10:00 | CEO | Round 17 dispatch 起動 | DEC-019-062 confirmed |
| EOD 18:00 | PM-H | Phase 1 sign-off 5/22 case 詳細詰め v2 起案 | Round 17 起動 |

### §2.10 5/17 (土) - 5/19 (月) — W1 残務 + 必須 50 軸 96% 達成

| 日付 | 担当 | deliverable | dependency |
|---|---|---|---|
| 5/17 (土) | Review-G | 必須 50 軸 5/17 EOD 90% 達成 | trial 結果反映 |
| 5/18 (日) | Dev + Review | W1 残務消化 + Round 17 deliverable 50% | Round 17 起動 |
| 5/19 (月) | Review-G | 必須 50 軸 5/19 EOD 96% 達成 + P-UI-10 残 1 件 prep | 5/18 deliverable 50% |

### §2.11 5/20 (火) - 5/21 (水) — W2 day 1-2 + 必須 50 軸 100% 達成 prep

| 日付 | 担当 | deliverable | dependency |
|---|---|---|---|
| 5/20 (火) | Dev + Review | W2 day 1 + Round 17 完遂 | 必須 50 軸 96% |
| 5/20 (火) EOD | Review-G | 必須 50 軸 5/20 EOD 98% 達成 | W2 day 1 |
| 5/21 (水) | Dev + Review | W2 day 2 + 必須 50 軸 100% 達成 prep final | 必須 50 軸 98% |
| 5/21 (水) EOD | Review-G | 必須 50 軸 5/21 EOD 100% 達成 + P-UI-10 完遂 | W2 day 2 |
| 5/21 (水) EOD | PM-I | Phase 1 sign-off 5/22 case 詳細詰め v3 final + Owner 5/22 朝確認会議 prep | 必須 50 軸 100% |

### §2.12 5/22 (木) — ★ Phase 1 sign-off 候補日

| 時刻 | 担当 | deliverable | dependency |
|---|---|---|---|
| 06:00-08:00 | Review-G | drill #2 実 drill 5/22 朝（Owner 同席 option）+ 12/12 Full Pass | Round 14 5/7 朝 drill #2 PASS |
| 08:00-09:00 | PM-I + CEO | Phase 1 sign-off レポート最終 prep | drill #2 5/22 朝 PASS |
| **09:00-09:05** | **Owner + CEO** | **★ Phase 1 sign-off GO 確認会議（Owner 5 分朝）★** | drill #2 + 必須 50 軸 100% |
| 09:05-12:00 | 全部署 | Phase 1 sign-off acknowledge + Phase 2 着手準備 | Owner Approve |
| 12:00-EOD | Marketing-J | 5/22 朝公開 narrative 配信完遂 | sign-off acknowledge |
| EOD 18:00 | Sec-K | DEC-019-063 confirmed 切替 + Phase 1 sign-off 確定 dashboard 反映 | sign-off 完遂 |

---

## §3 10 部署 daily owner + dependency 表

### §3.1 部署別 17 日 daily owner

| 部署 | 5/5 | 5/6 | 5/7 | 5/8 | 5/9-12 | 5/13 | 5/14 | 5/15 | 5/16 | 5/17-19 | 5/20-21 | 5/22 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Dev-A | R14 | R14 進捗 50% | R14 完遂 | R15 起動 | R15 deliverable | W1 着手 + R16 起動 | W1 day 2 | trial 段階 B/D | R17 起動 | W1 残務 + R17 50% | W2 day 1-2 | sign-off acknowledge |
| Dev-B | R14 | R14 進捗 50% | R14 完遂 | R15 起動 | R15 deliverable | W1 着手 | W1 day 2 | trial 段階 B/D | R17 起動 | W1 残務 | W2 day 1-2 | sign-off acknowledge |
| Dev-C | R14 + 5/7 wire-up | wire-up 完遂 + R14 進捗 50% | **drill #2 実機実行** | R15 起動 | R15 deliverable | W1 着手 | W1 day 2 | trial 段階 B/D | R17 起動 | W1 残務 | W2 day 1-2 | sign-off acknowledge |
| Dev-D | R14 | R14 進捗 50% | R14 完遂 | R15 起動 | R15 deliverable | W1 着手 | W1 day 2 | trial 段階 B/D | R17 起動 | W1 残務 | W2 day 1-2 | sign-off acknowledge |
| Dev-E | R14 | R14 進捗 50% | R14 完遂 | R15 起動 | R15 deliverable | W1 着手 | **GO 判定 final** | trial 段階 B/D | R17 起動 | W1 残務 | W2 day 1-2 | sign-off acknowledge |
| Review-F | R14 | drill #2 prep + 5/6 23:30 dry-run | **drill #2 実機実行** | R15 起動 | R15 deliverable | W1 着手 | trial 直前 prep | trial 段階 B/D | R17 起動 | 必須 50 軸 90% | 必須 50 軸 100% prep | drill #2 5/22 朝 + 12/12 PASS |
| PM-G/H/I | R14 5/5 transition plan + MS-2 trial 当日支援 + Phase 1 case 詳細 | progress review | drill #2 結果 + R15 dispatch preview | R15 起動 | Owner 中間報告 v1 prep | W1 着手 | trial 直前確認 | **trial 当日支援** | trial 結果 v1.2 + Phase 1 case v2 | W1 残務 review | Phase 1 case v3 final | **sign-off レポ起案** |
| Marketing-H/I/J | R14 | extraction Vercel build hook | R14 完遂 | R15 起動 | extraction production 起動 | W1 着手 | trial 直前 | trial 段階 B/D | R17 起動 | W1 残務 | W2 day 1-2 | **5/22 朝公開 narrative 配信** |
| Knowledge-J | R14 | INDEX-v5 + R13 由来抽出 | R14 完遂 | R15 起動 | INDEX-v5 拡張 | W1 着手 | trial 直前 | trial 段階 B/D | R17 起動 | W1 残務 | W2 day 1-2 | Phase 1 完遂 知見抽出 |
| Web-Ops-B/C | R14 | shadcn/ui install + Vercel Analytics | R14 完遂 | R15 起動 | 公開化 skeleton | W1 着手 | trial 直前 | trial 段階 B/D | R17 起動 | W1 残務 | W2 day 1-2 | 5/22 朝公開 acknowledge |
| Sec-I/J/K | DEC-019-060 confirmed + R14 weekly digest | DEC-019-061 起票 | R14 完遂 + R15 dispatch | R15 起動 | weekly digest #2 | W1 着手 | trial 直前 | trial 段階 B/D | DEC-019-062 起票 | weekly digest #3 | weekly digest #4 | DEC-019-063 confirmed |

### §3.2 critical path 5 件

| # | critical path | 連鎖部署 | 期限 | failure 影響 |
|---|---|---|---|---|
| 1 | **Dev-C 5/6 drill-2 real-mode wire-up（5-10 行）→ 5/7 朝 drill #2 実機実行** | Dev-C → Review-F | 5/6 EOD 18:00 | drill #2 5/7 朝 abort → 軸-2 PASS 不確実 → 5/8 朝再実機検証必要 |
| 2 | **Dev-E Round 15-16 GO 判定 final（5/14 EOD 18:00）→ 5/15 trial 着手** | Dev-E → trial全体 | 5/14 EOD 18:00 | trial 着手 NO-GO → 5/22 push case 4 条件 #3 未達 → 5/30 維持 case fallback |
| 3 | **5/15 trial Owner Approve（17:00）→ 5/22 push case 4 条件 #4 達成** | Owner → Phase 1 sign-off | 5/15 17:00-17:05 | Owner HOLD/Reject → 5/22 push case fallback → 5/30 維持 |
| 4 | **必須 50 軸 5/21 EOD 100% 達成（P-UI-10 完遂）→ 5/22 sign-off 軸-3 PASS** | Review-G → Owner 5/22 朝 | 5/21 EOD 23:59 | 軸-3 100% 未達 → 5/22 sign-off CONDITIONAL → 5/30 維持 fallback |
| 5 | **drill #2 5/22 朝実 drill 12/12 Full Pass → 5/22 sign-off 軸-2 PASS** | Review-G → Owner 5/22 朝 | 5/22 08:00 | 軸-2 12/12 未達 → 5/22 sign-off HOLD → 5/29 朝再 drill |

---

## §4 Round 14-15-16-17 dispatch 連動

### §4.1 Round 14 (5/5-5/7) 11 並列 deliverable

| 部署 | 主要 task |
|---|---|
| Dev-A | YAML loader fail-fast 化 / multilingual filter 統合 / 自動 lint workflow / 漢字辞書 35→50+ |
| Dev-B | heartbeat-gap detector primitive 化 / detector-functions z-score 統合 / notify-bridge retry policy DI |
| Dev-C | resource-constraints syscall 実装 / **drill-2 real-mode wire-up（5-10 行）** / cgroup/Job Object |
| Dev-D | wireSpawnHandleToKillSwitch 完全統合 / cli-version-check actual exec / HITL gate-12 実装着手 |
| Dev-E | FileHitl11Gate I/O 配線 / yaml-front-matter parser / KE-02 trigger orchestrator wiring / KE-04 ↔ audit-store 配線 |
| Review-F | **drill #2 5/7 朝実機検証実施** + 結果集計 / 5/15 中間チェック当日 / drill #3 readiness |
| PM-G (本書担当) | **5/5 議決-26 採決後即時 transition plan + MS-2 trial 当日支援 + Phase 1 case 詳細詰め + R14 progress R15 dispatch 推奨** |
| Marketing-H | extraction Vercel build hook / cron scheduling / portfolio v3.1 / 英語版 v1.1 |
| Knowledge-J | INDEX-v4 → v5 / HITL gate-11 spec の 1st 適用 / Round 13 由来 ナレッジ抽出 |
| Web-Ops-B | shadcn/ui 物理 install / Vercel Analytics 接続 / Tag Manager scroll_75 |
| Sec-I | DEC-019-061 起票 / 5/7 当日後 follow-up / weekly digest #1 |

### §4.2 Round 15 (5/8-5/12) 9-10 並列 dispatch preview

| 部署 | 主要 task |
|---|---|
| Dev-A | YAML loader 仕様確定 / multilingual filter production-ready |
| Dev-B | detector-functions z-score 完遂 / notify-bridge retry production |
| Dev-C | cgroup/Job Object 実装完遂 / drill #3 readiness |
| Dev-D | HITL gate-12 実装完遂 / cli-version-check production |
| Dev-E | KE-02 trigger orchestrator production / KE-04 ↔ audit-store production |
| Review-G | 必須 50 軸 5/12 EOD 85% trajectory / drill #3 prep |
| PM-H | 5/15 trial 当日 spec final + Owner 中間報告 v1 起案 |
| Marketing-I | extraction production runtime / portfolio v3.1 確定 |
| Knowledge-K | INDEX-v5 → v6 / Round 14 由来 ナレッジ抽出 |
| Sec-J | DEC-019-062 起票 prep / weekly digest #2 |

### §4.3 Round 16 (5/13-5/14) 9 並列 + Round 17 (5/16-5/22) 9-10 並列

Round 16 = MS-1 W1 着手後の deliverable 消化（W1 day 1-2、5/15 trial 直前最終確認）。
Round 17 = trial 結果反映後の Phase 1 sign-off 5/22 直前 deliverable（W1 残務 + W2 + 必須 50 軸 100% + drill #2 5/22 朝再実機）。

---

## §5 Risk Register v3.3 整合（Round 14 transition 期間）

| Risk | 影響度 | mitigation |
|---|---|---|
| R-019-06 (BAN 30-60% / 12 ヶ月) | 5/7 drill #2 PASS で残存 15-30% / 5/22 drill #2 再 PASS で 5-10% へ低減 | drill #2 2 段運用（5/7 + 5/22） |
| R-019-09 (NG-3 24/7 監視) | 5/13 W1 着手で tos-monitor production 起動 | Dev-B production wire-up |
| R-019-10 (重要分野ホワイトリスト未確定) | 5/22 EOD で minor 16 件 + KE-01〜04 + HITL-11 完遂 | Dev-E KE 系 5/5 件完遂済 (R13) |
| R-RUSH-01〜04 (タイト trajectory) | 5/5 採決前倒し +3 日で残作業 +3 日余裕 → mitigation 自動成立 | 5/5 採決早期確定 |
| **R-NEW-01 (5/7 drill #2 abort risk)** | drill #2 5/7 朝 NG → 5/8 朝再実機検証必要 → Round 14 完遂 +1 日遅延 | Dev-C 5/6 EOD wire-up 完遂 binding + Review-F 5/6 23:30 dry-run 再実行 |
| **R-NEW-02 (Dev-E 5/14 GO 判定 NO-GO)** | trial 着手 NO-GO → 5/30 維持 case fallback | Dev-E R13 KE 系 5/5 件完遂済 (80%) で確度 75-80% |

---

## §6 結論（DoD 達成判定）

1. **17 日 transition timeline 確定** (§1): 5/5 採決完了 → 5/22 sign-off 候補日まで day-by-day 17 日 deliverable。
2. **3 マイルストン整合確保確定** (§1.2): MS-1 drill #2 5/7 朝 / MS-2 trial 5/15 / MS-3 中間チェック 5/15 全件整合 0 件 conflict。
3. **17 日 daily deliverable + 担当部署 + dependency 表確定** (§2): 各日 deliverable + 担当 + dependency 全件記載。
4. **10 部署 daily owner + dependency 表確定** (§3.1): 部署 × 17 日 = 170 セル daily owner。
5. **critical path 5 件確定** (§3.2): Dev-C wire-up / Dev-E GO 判定 / Owner Approve / 必須 50 軸 100% / drill #2 5/22 朝。
6. **Round 14-15-16-17 dispatch 連動確定** (§4): Round 14 11 並列 / Round 15 9-10 並列 / Round 16 9 並列 / Round 17 9-10 並列。
7. **Risk Register v3.3 整合確定** (§5): R-019-06/09/10 + R-RUSH-01〜04 + R-NEW-01/02 mitigation 全件記載。

→ **5/5 議決-26 採決後即時 transition plan DoD 達成**。Owner formal「採決日 5/5」directive 整合 + 5/22 sign-off 候補日までの 17 日 daily transition 完備。

---

## §7 関連決裁・参照

### §7.1 反映決裁

- DEC-019-007 / 010 / 025 / 050 / 052 / 053 / 054 / 055 / 056 / 057（confirmed）/ 058（confirmed）/ 059（confirmed）
- DEC-019-060（Round 13 Sec-H 起票、5/5 採決後 confirmed 切替予定）
- DEC-019-061（Round 14 Sec-I 起票推奨予定、Round 15 dispatch authorization）
- DEC-019-062（Round 16 Sec-J 起票推奨予定、Round 17 authorization + 5/22 push 確定）
- DEC-019-063（Round 17 Sec-K 起票推奨予定、Phase 1 sign-off 確定）

### §7.2 参照書

- `pm-round12-phase1-signoff-5-22-case.md`（Round 12 PM-E、414 行）— 親文書 #1
- `pm-round13-decision-26-pre-emption-evaluation.md`（Round 13 PM-F、518 行）— 親文書 #2
- `pm-round13-ms2-result-aggregation-template.md`（Round 13 PM-F、316 行）— MS-2 12 件 KPI 集計フォーマット連動
- `ceo-round13-integrated-report-v14.md`（Round 13 CEO 統合報告 v14、241 行）— Round 14 dispatch preview 整合

---

## フッタ — 改版履歴

| 版 | 日付 | 起案 | 主要変更 |
|---|---|---|---|
| v1 | 2026-05-04 深夜終盤（Round 14 PM-G dispatch 起案） | PM 部門（PM-G 独立 Agent） | 初版（17 日 daily transition + 3 マイルストン整合 + 10 部署 daily owner + critical path 5 件 + Round 14-17 dispatch 連動 + Risk v3.3） |

**v1 確定**: 2026-05-04 深夜終盤（Round 14 PM-G 完遂時） / **採用判断**: 5/5 採決完了直後 v1.1（採決結果反映） / **次回更新**: 5/7 drill #2 結果反映 v1.2 / 5/15 trial 結果反映 v1.3 / 5/22 sign-off 完遂反映 v2.0

## フッタ詳細

- 文書: `projects/PRJ-019/reports/pm-round14-5-5-post-decision-transition.md`
- 版: v1（2026-05-04、Round 14 PM-G 担当 deliverable 1）
- 起案: PM 部門（PM-G 独立 Agent）
- 範囲: 5/5 議決-26 採決後即時 transition plan + 17 日 daily deliverable + 3 マイルストン整合 + critical path 5 件
- 検収: CEO（Round 14 commit 時）+ Owner（5/5 採決完了 acknowledge）+ Sec-I（DEC-019-061 起票連動）
