# PRJ-019 Round 13 PM-F deliverable 2 — MS-2 5/15 trial 結果集計テンプレ（12 件 KPI 集計フォーマット + 3 シナリオ別集計）

| 項目 | 内容 |
|---|---|
| 文書 ID | pm-round13-ms2-result-aggregation-template |
| 制定日 | 2026-05-04 深夜終盤（Round 13 PM-F dispatch 起案） |
| 起票 | PM 部門（PM-F 独立 Agent、general-purpose 経由 dispatch、DEC-019-025 SOP 準拠） |
| 区分 | **MS-2 5/15 trial 結果集計テンプレ v1**（trial 当日 EOD 段階 G 17:35-17:50 で PM-F が即記入可能、12 件 KPI + 3 シナリオ別集計）|
| 上位決裁（既存維持） | DEC-019-007 / 010 / 025 / 050 / 052 / 053 / 054 / 055 / 056 / 057 / 058 / 059（confirmed） |
| 親文書（破壊しない、差分追加） | `pm-round12-ms2-5-15-trial-runsheet.md`（Round 12 PM-E deliverable 1、615 行）— 12 件 KPI 出典 |
| 範囲 | 5/15 trial 当日 EOD 即記入可能なテンプレ + abort case / partial case / full pass case の 3 シナリオ別集計 |
| ステータス | **draft v1**（5/15 trial 当日 18:00 PM-F 当日 actual filled 版 v1.1 化） |

---

## §0 Executive Summary（CEO 向け 200 字）

PRJ-019 MS-2 5/15 trial 結果集計テンプレ。Round 12 PM-E `pm-round12-ms2-5-15-trial-runsheet.md` §12.2 の 12 件 KPI を集計フォーマット化。KPI 表（達成値 / 目標値 / 達成判定 / 算出方法 / 検証主体）+ trial 当日 actual filled 部 + 3 シナリオ別集計（abort case = kill-switch 発動、partial case = 5-9/12 達成、full pass case = 10-12/12 達成）+ fallback 経路選定基準 + Owner 中間報告 v1 5 行サマリ template + Round 13 PM-F 5/15 EOD 即記入用 procedure。15:50 ready で 17:35-17:50 PM-F 担当 v1.1 起案。

---

## §1 12 件 KPI 集計フォーマット

### §1.1 12 件 KPI 集計表（5/15 trial 当日 EOD 段階 G 17:35-17:50 で PM-F が即記入）

| # | KPI 名 | 目標値 | 達成値（記入欄）| 達成判定（PASS/FAIL）| 算出方法 | 検証主体 |
|---|---|---|---|---|---|---|
| 1 | trial run #1 cycle 完遂数 | 3 cycle | `___` cycle | `___` | 12:00 時点で cycle 3 終了 = PASS | Dev |
| 2 | trial run #2 cycle 完遂数 | 3 cycle | `___` cycle | `___` | 16:00 時点で cycle 3 終了 = PASS | Dev |
| 3 | needs_scout 出力件数（trial 全体） | ≥ 36 件 fetch | `___` 件 | `___` | 6 cycle × 6 件以上 = PASS | Dev |
| 4 | filter 後出力件数（trial 全体）| ≥ 24 件 | `___` 件 | `___` | filter 後 4 件 × 6 cycle = PASS | Dev |
| 5 | round-trip 成立件数（trial 全体）| ≥ 24 record | `___` record | `___` | filter 後全件成功 = PASS | Dev |
| 6 | 実 needs 抽出件数（trial 全体）| ≥ 1-2 件 | `___` 件 | `___` | mock-claw "viable" 判定 = PASS | Dev + PM-F |
| 7 | audit log integrity grep PASS 率 | 100% | `___`% (`___`/`___`) | `___` | 全 grep PASS = PASS | Review |
| 8 | cost cap 達成 | < $5 累計 | $`___` | `___` | trial 終了時 < $5 = PASS | PM-F |
| 9 | wall-clock 達成 | ≤ 9 時間 (08:30-18:00) | `___` 時間 | `___` | 段階 G 完遂 ≤ 18:00 = PASS | PM-F |
| 10 | Owner 物理拘束 | ≤ 5 分 | `___` 分 | `___` | 17:00-17:05 acknowledge ≤ 5min = PASS | Owner |
| 11 | 副作用 0 件 | 0 件 | `___` 件 | `___` | tos-monitor 偽陽性 matrix v2.0 検出 0 件 = PASS | Review |
| 12 | regression 0 件 | 0 件 | `___` 件 | `___` | 791 tests pass 維持 = PASS | Dev |

### §1.2 達成判定 集計

| 区分 | 件数 | 比率 |
|---|---|---|
| PASS | `___` / 12 | `___`% |
| FAIL | `___` / 12 | `___`% |

→ **PASS 12/12 = full pass case**（経路 1: 5/22 push 採用最有力）/ **PASS 10-11/12 = partial case**（経路 2: 5/30 維持）/ **PASS ≤ 9/12 + kill-switch 発動 = abort case**（経路 2 or 3）。

---

## §2 trial 当日 actual filled 部（PM-F が trial EOD で記入）

### §2.1 trial wall-clock 段階別 完遂状況

| 段階 | 時刻 | 担当 | 完遂状況（PM-F 記入）| 主要 KPI 関連 |
|---|---|---|---|---|
| 段階 A | 08:30-09:00 | PM-F + Dev + Review | 起動準備 10 件チェックリスト `___`/10 OK | KPI 12 件全件依存 |
| 段階 B | 09:00-12:00 | Dev + Review | trial run #1 3 cycle / DoD 7 件 達成 `___`/7 | KPI 1, 3, 4, 5, 7, 8 |
| 段階 C | 12:00-13:00 | CEO + PM-F + Dev + Review | 中間 review 5 軸判定 `___` continue/abort | KPI 1, 7, 8 |
| 段階 D | 13:00-16:00 | Dev + Review | trial run #2 3 cycle / DoD 7 件 達成 `___`/7 | KPI 2, 5, 6, 7, 8 |
| 段階 E | 16:00-17:00 | CEO + PM-F | Owner 通知準備（5 行サマリ + 200-300 行詳細） | KPI 9, 10 |
| 段階 F | 17:00 | Owner | Slack quick-action 4 択 button 即決（Approve / HOLD / Reject / 中止） | KPI 10 |
| 段階 G | 17:00-18:00 | PM-F + Dev + Review + Sec | 後処理 6 件 DoD 達成 `___`/6 | KPI 9, 12 |

### §2.2 abort criteria 4 件 発動状況（PM-F 記入）

| # | abort criteria | 発動状況 | 発動時刻 | 対応 |
|---|---|---|---|---|
| 1 | audit log hash chain integrity violation | `[ ]` 発動 / `[x]` 未発動 | `___` | `___` |
| 2 | cost cap 超過（累計 ≥ $5）| `[ ]` 発動 / `[x]` 未発動 | `___` | `___` |
| 3 | 副作用検出（本番 system への影響） | `[ ]` 発動 / `[x]` 未発動 | `___` | `___` |
| 4 | wall-clock 超過（19:00 までに段階 G 未完遂） | `[ ]` 発動 / `[x]` 未発動 | `___` | `___` |

### §2.3 Owner 即決結果（PM-F 記入）

| 項目 | 結果 |
|---|---|
| Owner Slack push 受信時刻 | 17:00:`___` |
| Owner click decision | Approve / HOLD / Reject / 中止 |
| Owner click 時刻 | 17:0`___`:`___` |
| Owner 物理拘束時間 | `___` 分 |
| 5/22 sign-off push 推奨度 | GO / HOLD / 5/30 維持 / 完全中止 |

---

## §3 3 シナリオ別集計

### §3.1 シナリオ 1: full pass case（KPI 12/12 達成）

| 項目 | 内容 |
|---|---|
| 達成判定 | KPI 12/12 PASS + abort criteria 0 件発動 + Owner Approve |
| 確度（v13 base） | 25-35%（KPI 全件達成 70% × Owner Approve 80%）|
| 後続経路 | **経路 1: 5/22 sign-off push 採用** |
| Phase 1 sign-off 候補日 | 5/22 (5/30 比 8 日前倒し) |
| DEC-019-059 confirmed | (a) Round 12 authorization + (b) 5/22 push 採用 + (c) MS-2 trial 採用 + (d) Round 13 dispatch 5/22 push case |
| 確度押上 | 5/22 push 確度 80-85% → **88-92%** |
| Owner 中間報告 v1 推奨度 | **GO（強く推奨）** |
| Round 13 dispatch 構成 | 5/22 push 採用 case（PM-F 本書姉妹文書）|

#### §3.1.1 full pass case 集計表 template

```markdown
# MS-2 5/15 trial full pass case 結果集計

1. trial 実施: 5/15 09:00-18:00 / trial run #1 (3h 軽負荷) + run #2 (3h real subprocess) 完遂
2. KPI 達成: 12/12 PASS（全件達成）
3. needs_scout: 出力 {N} 件 / filter 後 {M} 件 / round-trip {K}/{T} record / 実 needs 抽出 {L} 件
4. cost: 累計 ${X} (cap < $5 達成) / wall-clock {Y} 時間 / Owner 物理拘束 {Z} 分
5. audit log integrity: 100% PASS / 副作用 0 件 / regression 0 件
6. abort criteria: 0 件発動
7. Owner 即決: Approve（5/22 sign-off push 採用）
8. 5/22 push 推奨度: GO（強く推奨、CEO + PM Lv 4+）
9. 後続: DEC-019-059 §(b) (α) 採択 → MS-3 5/22 公式着手 GO + Phase 1 sign-off 5/22 確定
10. Round 13 dispatch: 5/22 push 採用 case（10-11 並列、Dev-A〜E continue + Sec-H DEC-019-060 起票）
```

### §3.2 シナリオ 2: partial case（KPI 5-11/12 達成）

| 項目 | 内容 |
|---|---|
| 達成判定 | KPI 5-11/12 PASS + abort criteria 0-1 件発動 + Owner HOLD or Reject |
| 確度（v13 base） | 35-50%（部分達成 partial KPI スコープによる）|
| 後続経路 | **経路 2: 5/30 維持**（Round 11 PM-D plan 通り） |
| Phase 1 sign-off 候補日 | 5/30（v12 base 維持）|
| DEC-019-059 confirmed | (a) Round 12 authorization + (b) 5/30 維持 + (c) MS-2 trial 採用（部分成功）+ (d) Round 13 dispatch 5/30 維持 case |
| 確度押上 | 5/22 push 候補化なし、5/30 維持確度 88% 維持 |
| Owner 中間報告 v1 推奨度 | **HOLD or Reject** |
| Round 13 dispatch 構成 | 5/30 維持 case（Round 11 PM-D W1-W2 sprint plan 通り）|

#### §3.2.1 partial case 集計表 template

```markdown
# MS-2 5/15 trial partial case 結果集計

1. trial 実施: 5/15 09:00-18:00 / trial run #1 + run #2 部分完遂
2. KPI 達成: {N}/12 PASS（部分達成）
3. 未達 KPI: {KPI #X / KPI #Y / KPI #Z} 詳細
4. needs_scout: 出力 {N} 件 / filter 後 {M} 件 / round-trip {K}/{T} record / 実 needs 抽出 {L} 件
5. cost: 累計 ${X} / wall-clock {Y} 時間 / Owner 物理拘束 {Z} 分
6. audit log integrity: {%} PASS / 副作用 {α} 件 / regression {β} 件
7. abort criteria: {0-1} 件発動（{詳細}）
8. Owner 即決: HOLD / Reject
9. 5/22 push 推奨度: HOLD（5/15 trial 部分成功、5/22-5/30 期間で再評価）or 5/30 維持
10. 後続: DEC-019-059 §(b) (β) or (γ) 採択 → MS-3 5/22 公式着手は維持 + Phase 1 sign-off 5/30 維持
11. Round 13 dispatch: 5/30 維持 case（Round 11 PM-D W1-W2 sprint plan 通り）
12. mitigation: {未達 KPI} を Round 13 〜 W2 期間で消化、5/22-5/30 期間内 再評価で 5/22 push 候補復活余地
```

### §3.3 シナリオ 3: abort case（kill-switch 発動 + KPI ≤ 4/12）

| 項目 | 内容 |
|---|---|
| 達成判定 | abort criteria 1 件以上発動 / KPI ≤ 4/12 達成 / Owner 中止判断 |
| 確度（v13 base） | 5-10%（kill-switch 発動 + 副作用検出 / cost cap 超過 / wall-clock 超過）|
| 後続経路 | **経路 2: 5/30 維持**（kill-switch #2/#4）or **経路 3: 完全中止**（kill-switch #1/#3）|
| Phase 1 sign-off 候補日 | 5/30 維持 or 6/3（W4 buffer 終端）|
| DEC-019-059 confirmed | (a) Round 12 authorization + (b) 5/30 維持 or 6/3 / (c) MS-2 trial 中止 acknowledge + (d) Round 13 緊急 dispatch |
| 確度押上 | Phase 1 sign-off 確度 88% → 70%（経路 3 完全中止 case）|
| Owner 中間報告 v1 推奨度 | **中止 / 緊急対応** |
| Round 13 dispatch 構成 | 緊急 dispatch（hash chain integrity 緊急修正 + Dev audit-hash-chain-integrity 拡張）|

#### §3.3.1 abort case 集計表 template

```markdown
# MS-2 5/15 trial abort case 結果集計

1. trial 中止: 5/15 {時刻} kill-switch #{N} 発動（{理由}）
2. KPI 達成: {≤ 4}/12 PASS（中止前まで）
3. abort criteria 発動: #1 audit integrity / #2 cost cap / #3 副作用 / #4 wall-clock のいずれか
4. 中止前 KPI 詳細: {達成 KPI} / {未達 KPI}
5. cost: 累計 ${X} / 中止時刻 {時刻} / Owner 物理拘束 {緊急} 分
6. 副作用: {0 件 / 検出 詳細}
7. Owner 即決: 中止判断 / 緊急対応
8. 5/22 push 推奨度: 完全中止 or 5/30 維持
9. 後続: DEC-019-059 §(b) (γ) or (緊急対応) 採択
10. fallback 経路: 経路 2 5/30 維持（kill-switch #2/#4）or 経路 3 完全中止（kill-switch #1/#3、副作用範囲次第で経路 2）
11. Round 13 dispatch: 緊急 dispatch（hash chain integrity 緊急修正 + 再 trial 計画）
12. Owner 物理拘束追加: 5 分（緊急通知 acknowledge）
13. mitigation: 5/22 公式着手も延期検討（5/26 まで延期可、Phase 1 sign-off 6/3 維持）
```

### §3.4 3 シナリオ 確度 summary

| シナリオ | 確度 | 後続経路 | Phase 1 sign-off | Owner 中間報告 v1 |
|---|---|---|---|---|
| 1. full pass case (12/12) | 25-35% | 経路 1: 5/22 push | 5/22 (8 日前倒し) | GO（強く推奨） |
| 2. partial case (5-11/12) | 35-50% | 経路 2: 5/30 維持 | 5/30 (v12 base) | HOLD / Reject |
| 3. abort case (≤ 4/12 / kill-switch) | 5-10% | 経路 2: 5/30 維持 / 経路 3: 完全中止 | 5/30 / 6/3 | 中止 / 緊急対応 |
| 不達（合計） | 65-90%（partial + abort 上振れ）| 経路 2/3 主流 | 5/30 / 6/3 | HOLD / Reject / 中止 |

---

## §4 fallback 経路選定基準（trial 結果別）

### §4.1 fallback 経路選定マトリクス

| trial 結果 | abort criteria 発動 | Owner 即決 | 選択 fallback 経路 |
|---|---|---|---|
| 成功 12/12 | 0 件 | Approve | **経路 1: 5/22 push** |
| 成功 12/12 | 0 件 | HOLD | 経路 2: 5/30 維持（再評価）|
| 成功 12/12 | 0 件 | Reject | 経路 2: 5/30 維持 |
| 部分成功 (10-11/12)| 0-1 件 | Approve | 経路 1（条件付き）or 経路 2 |
| 部分成功 (10-11/12) | 0-1 件 | HOLD | 経路 2: 5/30 維持 |
| 部分成功 (10-11/12) | 0-1 件 | Reject | 経路 2: 5/30 維持 |
| 部分成功 (5-9/12) | 0-1 件 | 任意 | 経路 2: 5/30 維持 |
| 部分成功 (≤ 4/12) | 0 件 | 任意 | 経路 2: 5/30 維持 or ad-hoc |
| abort #1 audit integrity | 1 件 | 中止 | **経路 3: 完全中止** |
| abort #2 cost cap | 1 件 | 中止 | 経路 2: 5/30 維持 |
| abort #3 副作用 | 1 件 | 中止 | 経路 3: 完全中止（副作用範囲次第で経路 2）|
| abort #4 wall-clock | 1 件 | 中止 | 経路 2: 5/30 維持 |

### §4.2 fallback 経路 + Owner 中間報告 v1 5 行サマリ template

```markdown
# MS-2 5/15 trial 中間報告 v1（Owner 即決依頼）

1. trial 実施: 5/15 09:00-{16:00 / 17:00} / trial run #1 (3h 軽負荷) + run #2 (3h real subprocess) {完遂 / 部分完遂 / 中止}
2. 結果: KPI {N}/12 達成 / needs_scout 出力 {N} 件 / 実 needs 抽出 {M} 件 / round-trip 成功 {K}/{T} record / audit log 整合 {全 PASS / 一部 FAIL / 中止前 PASS}
3. cost: 累計 ${X} / cost cap < $5 {達成 / 超過 / N/A 中止}
4. 5/22 sign-off push 推奨度: {GO / HOLD / 5/30 維持推奨 / 完全中止}
5. Owner 即決依頼: ① acknowledge → 5/22 sign-off push 採用 / ② HOLD → Round 13 で再評価 / ③ 中止 → 5/30 維持 / ④ 緊急 → 6/3 維持

詳細: /path/to/dev-trial-5-15-result.md（200-300 行、CEO + PM-F + Dev 共同起案）
Slack quick-action: [Approve][HOLD][Reject][中止] 4 択 button
```

---

## §5 Round 13 PM-F 5/15 EOD 即記入用 procedure

### §5.1 5/15 EOD 段階 G 17:35-17:50 PM-F 担当 procedure

```
17:35  PM-F 本書 v1.1 起案開始（actual filled 版）
17:35-17:40 KPI 12 件達成値記入（§1.1）
17:40-17:42 達成判定 PASS/FAIL 記入（§1.2）
17:42-17:45 trial wall-clock 段階別 完遂状況記入（§2.1）
17:45-17:46 abort criteria 4 件 発動状況記入（§2.2）
17:46-17:47 Owner 即決結果記入（§2.3）
17:47-17:48 シナリオ判定（full pass / partial / abort）（§3）
17:48-17:50 fallback 経路選定 + Owner 中間報告 v1 5 行サマリ起案（§4）
17:50  PM-F 本書 v1.1 確定 / Sec への commit 依頼
```

### §5.2 5/16 朝以降の v1.2 化（Round 14 dispatch 連動）

| 5/16 朝 ～ | 担当 | アクティビティ |
|---|---|---|
| 5/16 06:00 | PM-F | trial 結果 v1.1 を Round 14 dispatch 構成に反映、v1.2 起案 |
| 5/16 09:00 | CEO + PM-F | Round 14 dispatch 構成 final 確認（5/22 push case / 5/30 維持 case / 緊急 case の 3 系統別構成）|
| 5/16 09:30 | Sec | DEC-019-060 起票（Round 14 authorization + 5/22 push 採否 confirmed）|
| 5/16 10:00 | CEO | Round 14 dispatch 起動 |

### §5.3 PM-F 引継 (Round 14 PM-G)

| Round 13 PM-F deliverable | Round 14 PM-G 引継先 |
|---|---|
| 本書 v1.2（5/15 trial 結果集計） | Round 14 で actual filled 版 v1.3 → confirmed |
| `pm-round13-decision-26-pre-emption-evaluation.md` | Round 14 で議決-26 採決結果反映 v1.1 → confirmed |
| `pm-round13-phase2-narrative-progress.md` | Round 14 で Phase 1 sign-off → Phase 2 着手切替 trigger 確定 |

---

## §6 結論（DoD 達成判定）

1. **12 件 KPI 集計フォーマット確定** (§1.1-§1.2): 5/15 trial 当日 EOD 段階 G で PM-F が即記入可能。
2. **trial 当日 actual filled 部 template 確定** (§2.1-§2.3): wall-clock 段階別 + abort criteria 4 件 + Owner 即決結果。
3. **3 シナリオ別集計 template 確定** (§3.1-§3.3): full pass case / partial case / abort case + 集計表 template。
4. **3 シナリオ 確度 summary 確定** (§3.4): full pass 25-35% / partial 35-50% / abort 5-10%。
5. **fallback 経路選定マトリクス + Owner 中間報告 v1 5 行サマリ template 確定** (§4): 12 件 trial 結果 × 経路 1/2/3 選定基準。
6. **Round 13 PM-F 5/15 EOD 即記入用 procedure 確定** (§5.1): 17:35-17:50 15 分 procedure。
7. **5/16 朝以降の v1.2 化 + Round 14 PM-G 引継 確定** (§5.2-§5.3): Round 14 dispatch 連動。

→ **MS-2 結果集計テンプレ DoD 達成**。5/15 trial EOD 段階 G で PM-F が 15 分以内に v1.1 化可能、Round 14 dispatch 連動準備完備。

---

## §7 関連決裁・参照

### §7.1 反映決裁

- DEC-019-007 / 010 / 025 / 050 / 052 / 053 / 054 / 055 / 056 / 057（confirmed）/ 058（confirmed）/ 059（confirmed）
- DEC-019-060（Round 13 PM-F 起票推奨予定、Sec-H 起票候補）

### §7.2 参照書

- `pm-round12-ms2-5-15-trial-runsheet.md`（Round 12 PM-E deliverable 1、615 行）— 親文書、12 件 KPI 出典
- `pm-round12-phase1-signoff-5-22-case.md`（Round 12 PM-E deliverable 2、414 行）— 5/22 push case 4 条件 binding
- `pm-round11-ms2-5-15-trial-scenario.md`（Round 11 PM-D deliverable 2、489 行）— scenario 整合
- `pm-round13-decision-26-pre-emption-evaluation.md`（Round 13 PM-F deliverable 1、姉妹文書）— 議決-26 前倒し連動

### §7.3 Risk Register v3.2 整合

- R-019-06 (BAN 30-60% / 12 ヶ月): trial 全 mode dry-run + mock 中心で BAN リスクなし
- R-019-09 (NG-3 24/7 監視): tos-monitor 1,344 行 trial 期間中 24/7 監視継続
- R-019-10 (重要分野ホワイトリスト未確定): trial 12 件 KPI 達成度で minor 16 件 denylist 完全緑化確認

---

## フッタ — 改版履歴

| 版 | 日付 | 起案 | 主要変更 |
|---|---|---|---|
| v1 | 2026-05-04 深夜終盤（Round 13 PM-F dispatch 起案） | PM 部門（PM-F 独立 Agent） | 初版（12 件 KPI 集計フォーマット + actual filled 部 + 3 シナリオ別集計 + fallback 経路選定 + 5/15 EOD procedure） |

**v1 確定**: 2026-05-04 深夜終盤（Round 13 PM-F 完遂時） / **採用判断**: 5/15 trial 当日 17:35-17:50 PM-F 担当 v1.1 起案 / **次回更新**: 5/15 EOD v1.1（actual filled 版）/ 5/16 朝 v1.2（Round 14 dispatch 連動）

## フッタ詳細

- 文書: `projects/PRJ-019/reports/pm-round13-ms2-result-aggregation-template.md`
- 版: v1（2026-05-04、Round 13 PM-F 担当 deliverable 2）
- 起案: PM 部門（PM-F 独立 Agent）
- 範囲: MS-2 5/15 trial 結果集計テンプレ + 12 件 KPI フォーマット + 3 シナリオ別集計 + Round 14 引継
- 検収: CEO（Round 13 commit 時）+ PM-F（5/15 trial EOD 段階 G v1.1 起案）+ Sec-H（DEC-019-060 起票連動）
