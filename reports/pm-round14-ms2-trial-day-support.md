# PRJ-019 Round 14 PM-G deliverable 3 — MS-2 trial 当日支援 plan（5/15 trial wall-clock + 12 件 KPI measure timing + abort/continue 判断 timing）

| 項目 | 内容 |
|---|---|
| 文書 ID | pm-round14-ms2-trial-day-support |
| 制定日 | 2026-05-04 深夜終盤（Round 14 PM-G dispatch 起案） |
| 起票 | PM 部門（PM-G 独立 Agent、general-purpose 経由 dispatch、DEC-019-025 SOP 準拠） |
| 区分 | **MS-2 5/15 trial 当日支援 plan v1**（Round 13 PM-F MS-2 結果集計テンプレ base に当日支援詳細 / 12 件 KPI の measure timing + abort/continue 判断 timing） |
| 上位決裁 | DEC-019-007 / 010 / 025 / 050 / 052 / 053 / 054 / 055 / 056 / 057 / 058 / 059（confirmed） |
| 親文書 | `pm-round13-ms2-result-aggregation-template.md`（316 行）+ `pm-round12-ms2-5-15-trial-runsheet.md`（615 行） |
| 範囲 | 5/15 trial 当日 08:30-18:00 wall-clock 詳細 + 12 件 KPI measure timing + abort criteria 4 件 判断 timing + PM-H 当日支援 procedure |
| ステータス | **draft v1**（5/15 trial 当日 EOD v1.1 化） |

---

## §0 Executive Summary（CEO 向け 200 字）

PRJ-019 Round 14 PM-G deliverable 3。Round 13 PM-F MS-2 結果集計テンプレ（316 行）を base に、5/15 trial 当日 08:30-18:00 wall-clock × 12 件 KPI measure timing × abort/continue 判断 timing を統合した当日支援 plan。段階別 minute-by-minute（A 起動準備 30 分 / B trial run #1 3h / C 中間 review 1h / D trial run #2 3h / E Owner 通知準備 1h / F Owner 即決 5 分 / G 後処理 1h）+ 12 件 KPI 即時 measure 表 + 4 件 abort criteria 6 段階 escalation + Owner 17:00 Slack quick-action 即決経路 + PM-H 当日 procedure 17:35-17:50。MS-2 trial 準備度 = Lv 4 高詳細達成。

---

## §1 5/15 trial 当日 08:30-18:00 wall-clock 詳細

### §1.1 段階 A — 起動準備（08:30-09:00 / 30 分）

| 時刻 | 担当 | アクティビティ | 関連 KPI / abort criteria |
|---|---|---|---|
| 08:30-08:35 | PM-H | 起動準備 10 件チェックリスト acknowledge 開始 | KPI 全件依存 |
| 08:35-08:40 | Dev | trial 環境変数 set + mock-claude / mock-claw 起動確認 | KPI 1, 2, 5 |
| 08:40-08:45 | Review | tos-monitor pre-flight check + Slack webhook test | KPI 11 |
| 08:45-08:50 | Dev | needs_scout endpoint health check + filter rule 確認 | KPI 3, 4 |
| 08:50-08:55 | PM-H | cost cap monitoring 起動（$5 cap、累計 reset）| KPI 8, abort #2 |
| 08:55-09:00 | PM-H | 起動準備 10 件 全 OK acknowledge + trial 開始 trigger | KPI 全件依存 |

**段階 A DoD**: 起動準備 10 件 全 OK / cost cap monitoring 起動 / mock 環境健全性確認 / Owner 通知 stand-by。

### §1.2 段階 B — trial run #1（09:00-12:00 / 3 時間 / 軽負荷 mock-claude 中心）

| 時刻 | 担当 | アクティビティ | 関連 KPI |
|---|---|---|---|
| 09:00-10:00 | Dev + Review | cycle 1: needs_scout fetch (6 件) + filter (4 件) + round-trip (4 record) + audit log integrity grep | KPI 1, 3, 4, 5, 7 |
| 10:00-11:00 | Dev + Review | cycle 2: 同上 + 副作用 0 件確認 | KPI 1, 3, 4, 5, 7, 11 |
| 11:00-12:00 | Dev + Review | cycle 3: 同上 + 累計 cost < $1 確認 + regression 0 件確認 | KPI 1, 3, 4, 5, 7, 8, 12 |

**段階 B DoD（7 件）**:
1. cycle 1 完遂
2. cycle 2 完遂
3. cycle 3 完遂
4. needs_scout 出力 ≥ 18 件（trial run #1 のみ）
5. filter 後出力 ≥ 12 件
6. round-trip ≥ 12 record
7. audit log integrity 100% PASS

### §1.3 段階 C — 中間 review（12:00-13:00 / 1 時間 / continue/abort 判定）

| 時刻 | 担当 | アクティビティ | 判定軸 |
|---|---|---|---|
| 12:00-12:15 | PM-H + Dev + Review | trial run #1 結果集計 + 7 件 DoD acknowledge | DoD 7/7 PASS = continue |
| 12:15-12:30 | CEO + PM-H + Dev + Review | **★ 5 軸 continue/abort 判定 review ★** | 軸 1-5 |
| | | 軸 1: KPI 1-5, 7 PASS 状況 | |
| | | 軸 2: cost 累計 < $1 (cap 余裕 80%+) | |
| | | 軸 3: 副作用 0 件（tos-monitor 偽陽性 matrix v2.0 検出 0）| |
| | | 軸 4: regression 0 件（791 tests pass 維持）| |
| | | 軸 5: wall-clock 順守（12:00 で run #1 完遂）| |
| 12:30-12:45 | CEO | continue 判定（5 軸全 PASS）or abort 判定（1 軸でも FAIL）| 5 軸 |
| 12:45-13:00 | PM-H | 段階 D 着手 prep（continue case）or Owner 緊急通知 prep（abort case）| — |

**段階 C 判定 timing**: **12:30** = continue/abort 判定確定 timing。

### §1.4 段階 D — trial run #2（13:00-16:00 / 3 時間 / real subprocess 中心）

| 時刻 | 担当 | アクティビティ | 関連 KPI |
|---|---|---|---|
| 13:00-14:00 | Dev + Review | cycle 1: real subprocess (mock-claw "viable" 判定) + needs_scout fetch + filter + round-trip + 実 needs ≥ 1 件抽出 | KPI 2, 3, 4, 5, 6, 7 |
| 14:00-15:00 | Dev + Review | cycle 2: 同上 + 累計 cost < $3 確認 | KPI 2, 6, 8 |
| 15:00-16:00 | Dev + Review | cycle 3: 同上 + 実 needs ≥ 2 件累計抽出 + 累計 cost < $5 確認 | KPI 2, 6, 8 |

**段階 D DoD（7 件）**:
1. cycle 1 完遂
2. cycle 2 完遂
3. cycle 3 完遂
4. trial run #2 のみ needs_scout 出力 ≥ 18 件
5. trial 全体 filter 後 ≥ 24 件
6. trial 全体 round-trip ≥ 24 record
7. 実 needs 抽出 ≥ 1-2 件

### §1.5 段階 E — Owner 通知準備（16:00-17:00 / 1 時間）

| 時刻 | 担当 | アクティビティ |
|---|---|---|
| 16:00-16:15 | PM-H | trial 全体結果集計（KPI 12 件 measure）|
| 16:15-16:30 | CEO + PM-H | Owner 中間報告 v1 5 行サマリ起案 |
| 16:30-16:45 | CEO + PM-H | 200-300 行詳細報告 起案（dev-trial-5-15-result.md）|
| 16:45-17:00 | Sec-J | Slack quick-action 4 択 button 配信 prep（[Approve][HOLD][Reject][中止]）|

### §1.6 段階 F — Owner 即決（17:00-17:05 / 5 分 / Owner 物理拘束）

| 時刻 | 担当 | アクティビティ |
|---|---|---|
| 17:00:00 | Sec-J | Owner Slack quick-action 4 択 button 配信実行 |
| 17:00:30-17:04:30 | Owner | Slack quick-action 受信 + 4 択 button 即決（5 分以内） |
| 17:04:30-17:05:00 | Sec-J | Owner click 結果 acknowledge + CEO 通知 |

**Owner 物理拘束**: **5 分以内**（KPI 10 達成基準）。

### §1.7 段階 G — 後処理（17:00-18:00 / 1 時間 / DoD 6 件）

| 時刻 | 担当 | アクティビティ | DoD |
|---|---|---|---|
| 17:00-17:10 | Dev | trial 環境 cleanup + cost cap monitoring 終了 | DoD 1 |
| 17:10-17:20 | Review | tos-monitor production runtime continue 確認 | DoD 2 |
| 17:20-17:30 | Sec-J | trial 結果 commit log + DEC-019-061 v1.1 起票 prep | DoD 3 |
| 17:30-17:35 | PM-H | trial 結果 v1.1 actual filled 起案開始 | DoD 4 |
| **17:35-17:50** | **PM-H** | **★ 12 件 KPI 即記入 + 3 シナリオ判定 + fallback 経路選定 ★** | **DoD 5** |
| 17:50-17:55 | PM-H | trial 結果 v1.1 確定 + Sec へ commit 依頼 | DoD 6 |
| 17:55-18:00 | Sec-J | trial 結果 v1.1 commit + dashboard 反映 | DoD 6 acknowledge |

---

## §2 12 件 KPI measure timing 表

### §2.1 12 件 KPI measure timing 詳細

| # | KPI 名 | measure 開始 | measure 中間 | **measure 確定** | 記入 timing |
|---|---|---|---|---|---|
| 1 | trial run #1 cycle 完遂数 | 09:00 | 11:00 | **12:00**（run #1 EOD）| 17:35-17:36 |
| 2 | trial run #2 cycle 完遂数 | 13:00 | 15:00 | **16:00**（run #2 EOD）| 17:36-17:37 |
| 3 | needs_scout 出力件数（trial 全体）| 09:00 | 12:00 / 14:00 | **16:00** | 17:37-17:38 |
| 4 | filter 後出力件数（trial 全体）| 09:00 | 12:00 / 14:00 | **16:00** | 17:38-17:39 |
| 5 | round-trip 成立件数（trial 全体）| 09:00 | 12:00 / 14:00 | **16:00** | 17:39-17:40 |
| 6 | 実 needs 抽出件数（trial 全体）| 13:00 | 14:00 / 15:00 | **16:00** | 17:40-17:41 |
| 7 | audit log integrity grep PASS 率 | 09:00 | 各 cycle 終了時 | **16:00** | 17:41-17:42 |
| 8 | cost cap 達成 | 09:00 monitoring 起動 | 12:00 / 16:00 | **17:10**（cleanup 完遂時）| 17:42-17:43 |
| 9 | wall-clock 達成 | 08:30 起動準備 | 12:00 / 16:00 / 17:00 | **18:00**（段階 G EOD）| 17:43-17:44 |
| 10 | Owner 物理拘束 | 17:00 Slack 配信 | 17:00:30 受信 | **17:05**（Owner click 完遂時）| 17:44-17:45 |
| 11 | 副作用 0 件 | 09:00 tos-monitor 起動 | 各 cycle 終了時 | **16:00** | 17:45-17:46 |
| 12 | regression 0 件 | 09:00 vitest baseline | 各 cycle 終了時 | **16:00** | 17:46-17:47 |

### §2.2 12 件 KPI 記入完了 timing

| 区分 | timing |
|---|---|
| measure 確定（最遅）| 18:00（KPI 9 wall-clock）|
| 記入完了（最遅）| 17:47（KPI 12 regression）|
| 達成判定 PASS/FAIL 確定 | 17:48-17:50 |

→ **PM-H 当日 procedure 17:35-17:50（15 分）で 12 件 KPI 全件 measure + 記入 + 判定完了**。

---

## §3 abort criteria 4 件 判断 timing

### §3.1 abort criteria 4 件 6 段階 escalation

| # | abort criteria | 検知 timing | escalation 6 段階 |
|---|---|---|---|
| 1 | audit log hash chain integrity violation | 各 cycle 終了時（grep 実行時）| Lv 1 警告 → Lv 2 cycle 中断 → Lv 3 trial run #1/#2 中断 → Lv 4 trial 全体中止 → Lv 5 Owner 緊急通知 → Lv 6 fallback 経路 3（完全中止）|
| 2 | cost cap 超過（累計 ≥ $5）| cost cap monitoring 5 分間隔 | Lv 1 ≥ $3 警告 → Lv 2 ≥ $4 cycle 中断検討 → Lv 3 ≥ $4.5 trial 中断検討 → Lv 4 ≥ $5 trial 全体中止 → Lv 5 Owner 緊急通知 → Lv 6 fallback 経路 2 (5/30 維持) |
| 3 | 副作用検出（本番 system への影響）| tos-monitor 偽陽性 matrix v2.0 検出時 | Lv 1 偽陽性確認 → Lv 2 副作用範囲特定 → Lv 3 trial run 中断 → Lv 4 trial 全体中止 → Lv 5 Owner 緊急通知 → Lv 6 fallback 経路 3（副作用範囲次第で経路 2）|
| 4 | wall-clock 超過（19:00 までに段階 G 未完遂）| 段階 G 17:00-18:00 monitoring | Lv 1 17:30 警告 → Lv 2 18:00 後処理短縮 → Lv 3 18:30 段階 G 未完遂 → Lv 4 19:00 trial 全体中止 → Lv 5 Owner 緊急通知 → Lv 6 fallback 経路 2 (5/30 維持) |

### §3.2 abort 判断 timing matrix

| timing | 判断軸 | 判断主体 | abort 判定 trigger |
|---|---|---|---|
| 09:00-12:00 段階 B | KPI 1, 3, 4, 5, 7 monitoring + cost monitoring | Dev + Review + PM-H | abort #1 / #3 検知時 cycle 中断 |
| 12:00-12:30 段階 C 判定 | 5 軸 continue/abort 判定 | CEO + PM-H + Dev + Review | 5 軸 1 件 FAIL → abort 判定 |
| 13:00-16:00 段階 D | KPI 2, 6, 7 monitoring + cost monitoring | Dev + Review + PM-H | abort #1 / #2 / #3 検知時 cycle 中断 |
| 16:00-17:00 段階 E | trial 全体結果集計 + KPI 12 件 measure | PM-H | KPI 5-9/12 = partial case / KPI ≤ 4/12 = abort case |
| 17:00-17:05 段階 F | Owner 即決 | Owner | Owner 中止 click → 即時中止 |
| 17:00-18:00 段階 G | wall-clock monitoring | PM-H | abort #4 検知時 段階 G 短縮 |

### §3.3 abort case 緊急通知経路

| abort 種別 | 緊急通知経路 | Owner 拘束 |
|---|---|---|
| abort #1 audit integrity | Sec-J 緊急 mail + Slack 緊急通知 + Review 緊急 review | Owner 5 分（緊急 acknowledge）|
| abort #2 cost cap | PM-H 緊急 cost report + Sec-J Slack 通知 | Owner 5 分（緊急 acknowledge）|
| abort #3 副作用 | Review 緊急 + tos-monitor production 停止 + Sec-J 緊急 mail | Owner 10 分（緊急 acknowledge + 副作用範囲確認）|
| abort #4 wall-clock | PM-H 段階 G 短縮通知 + Sec-J Slack 通知 | Owner 5 分（17:00 Slack 即決時の緊急 case 通知）|

---

## §4 PM-H 当日 procedure（17:35-17:50 / 15 分）

### §4.1 17:35-17:50 PM-H minute-by-minute procedure

| 時刻 | 担当 | アクティビティ | アウトプット |
|---|---|---|---|
| 17:35:00 | PM-H | trial 結果 v1.1 actual filled 起案開始 | template open |
| 17:35-17:36 | PM-H | KPI 1 (run #1 cycle) 記入 | template §1.1 |
| 17:36-17:37 | PM-H | KPI 2 (run #2 cycle) 記入 | template §1.1 |
| 17:37-17:38 | PM-H | KPI 3 (needs_scout 出力) 記入 | template §1.1 |
| 17:38-17:39 | PM-H | KPI 4 (filter 後) 記入 | template §1.1 |
| 17:39-17:40 | PM-H | KPI 5 (round-trip) 記入 | template §1.1 |
| 17:40-17:41 | PM-H | KPI 6 (実 needs) 記入 | template §1.1 |
| 17:41-17:42 | PM-H | KPI 7 (audit log integrity) 記入 | template §1.1 |
| 17:42-17:43 | PM-H | KPI 8 (cost cap) 記入 | template §1.1 |
| 17:43-17:44 | PM-H | KPI 9 (wall-clock) 記入 | template §1.1 |
| 17:44-17:45 | PM-H | KPI 10 (Owner 物理拘束) 記入 | template §1.1 |
| 17:45-17:46 | PM-H | KPI 11 (副作用) 記入 | template §1.1 |
| 17:46-17:47 | PM-H | KPI 12 (regression) 記入 | template §1.1 |
| 17:47-17:48 | PM-H | 達成判定 PASS/FAIL 集計 + シナリオ判定（full pass / partial / abort） | template §1.2, §3 |
| 17:48-17:49 | PM-H | fallback 経路選定 + Owner 中間報告 v1 5 行サマリ起案 | template §4 |
| 17:49-17:50 | PM-H | trial 結果 v1.1 確定 + Sec へ commit 依頼 | v1.1 final |

### §4.2 PM-H 当日支援 11 件 task

| # | task | timing | 想定時間 |
|---|---|---|---|
| 1 | 起動準備 10 件 acknowledge | 08:30-09:00 | 30 分 |
| 2 | trial run #1 monitoring | 09:00-12:00 | 3 時間 |
| 3 | 中間 review 5 軸判定 facilitate | 12:00-13:00 | 1 時間 |
| 4 | trial run #2 monitoring | 13:00-16:00 | 3 時間 |
| 5 | trial 全体結果集計 + KPI 12 件 measure | 16:00-16:15 | 15 分 |
| 6 | Owner 中間報告 v1 5 行サマリ起案 | 16:15-16:30 | 15 分 |
| 7 | 200-300 行詳細報告 起案 | 16:30-16:45 | 15 分 |
| 8 | Slack quick-action 配信 prep | 16:45-17:00 | 15 分 |
| 9 | Owner 即決 acknowledge | 17:00-17:05 | 5 分 |
| 10 | 後処理 6 件 facilitate | 17:00-17:35 | 35 分 |
| 11 | trial 結果 v1.1 actual filled 起案 | 17:35-17:50 | 15 分 |
| **PM-H 当日支援合計** | — | **08:30-18:00** | **9.5 時間** |

---

## §5 MS-2 trial 準備度 self-assessment

### §5.1 準備度 5 軸 self-check

| 軸 | 準備度 | 根拠 |
|---|---|---|
| 1. wall-clock 詳細 | **Lv 4 高詳細**（08:30-18:00 / 7 段階 minute-by-minute）| §1.1-§1.7 |
| 2. 12 件 KPI measure timing | **Lv 4 高詳細**（KPI 別 measure 開始/中間/確定/記入 timing）| §2.1-§2.2 |
| 3. abort criteria 判断 timing | **Lv 4 高詳細**（4 件 abort × 6 段階 escalation + timing matrix + 緊急通知経路）| §3.1-§3.3 |
| 4. PM-H 当日 procedure | **Lv 4 高詳細**（17:35-17:50 minute-by-minute + 11 件 task）| §4.1-§4.2 |
| 5. fallback 経路接続 | **Lv 4 高詳細**（Round 13 PM-F template fallback マトリクス継承）| 親文書 §4 |

→ **MS-2 trial 準備度 = Lv 4 高詳細（5 軸全 Lv 4）**。

---

## §6 結論（DoD 達成判定）

1. **5/15 trial 当日 wall-clock 詳細確定** (§1): 08:30-18:00 / 7 段階 minute-by-minute / 段階 A-G DoD 完備。
2. **12 件 KPI measure timing 表確定** (§2.1-§2.2): KPI 別 measure 開始/中間/確定/記入 timing + PM-H 17:35-17:50 15 分 procedure。
3. **abort criteria 4 件 判断 timing 確定** (§3.1-§3.3): 4 件 × 6 段階 escalation + timing matrix + 緊急通知経路。
4. **PM-H 当日 procedure 17:35-17:50 確定** (§4.1-§4.2): 11 件 task + 15 分 minute-by-minute。
5. **MS-2 trial 準備度 Lv 4 高詳細達成** (§5): 5 軸全 Lv 4。

→ **MS-2 trial 当日支援 plan DoD 達成**。Round 13 PM-F template base + 当日支援詳細 + 12 件 KPI measure + abort 判断 timing + PM-H 当日 procedure 完備。

---

## §7 関連決裁・参照

### §7.1 反映決裁

- DEC-019-007 / 010 / 025 / 050 / 052 / 053 / 054 / 055 / 056 / 057（confirmed）/ 058（confirmed）/ 059（confirmed）

### §7.2 参照書

- `pm-round13-ms2-result-aggregation-template.md`（Round 13 PM-F、316 行）— 親文書、12 件 KPI 集計フォーマット
- `pm-round12-ms2-5-15-trial-runsheet.md`（Round 12 PM-E、615 行）— 親文書、12 件 KPI + 9 時間 timeline
- `pm-round14-5-5-post-decision-transition.md`（Round 14 PM-G 姉妹文書）— 17 日 transition 連動

### §7.3 Risk Register v3.3 整合

- R-019-06 (BAN 30-60% / 12 ヶ月): trial 全 mode dry-run + mock 中心で BAN リスクなし
- R-019-09 (NG-3 24/7 監視): tos-monitor 1,344 行 trial 期間中 24/7 監視継続
- R-019-10 (重要分野ホワイトリスト未確定): trial 12 件 KPI 達成度で minor 16 件 denylist 完全緑化確認

---

## フッタ — 改版履歴

| 版 | 日付 | 起案 | 主要変更 |
|---|---|---|---|
| v1 | 2026-05-04 深夜終盤（Round 14 PM-G dispatch 起案） | PM 部門（PM-G 独立 Agent） | 初版（5/15 trial 当日 wall-clock minute-by-minute + 12 件 KPI measure timing + abort criteria 4 件 判断 timing + PM-H 当日 procedure 17:35-17:50） |

**v1 確定**: 2026-05-04 深夜終盤（Round 14 PM-G 完遂時） / **採用判断**: 5/15 trial 当日 EOD v1.1 / **次回更新**: 5/15 trial 結果反映 v1.1 / Round 14 完遂後 v1.2

## フッタ詳細

- 文書: `projects/PRJ-019/reports/pm-round14-ms2-trial-day-support.md`
- 版: v1（2026-05-04、Round 14 PM-G 担当 deliverable 3）
- 起案: PM 部門（PM-G 独立 Agent）
- 範囲: MS-2 5/15 trial 当日支援 plan + 12 件 KPI measure timing + abort 判断 timing + PM-H 当日 procedure
- 検収: CEO（Round 14 commit 時）+ PM-H（5/15 trial 当日 EOD v1.1 起案）+ Sec-J（DEC-019-061 起票連動）
