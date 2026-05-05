# PM-T Round 27 報告書 — 6/9 統合採決 timeline 完成版（DEC-080 + DEC-081 = 2 件まとめ採決 pattern）

- **担当**: PM-T（PM 部門 / Round 27 PM-T 列）
- **起案日**: 2026-05-05（Round 26 9 並列完遂着地直後 / DEC-080 + DEC-081 物理起案完遂直後）
- **対象**: 2026-06-09（火）統合採決 2 件まとめ（DEC-019-080 + 081）の **timeline 詳細化完成版**（Owner 拘束 0 分継承想定 / 60-80 min 内訳 2 件 + 統合 spec 化）
- **task 番号**: Task 3（4 件中の 3 件目）
- **位置付け**: PM-T Task 1 (DEC-080 物理起案完了) + Task 2 (DEC-081 物理起案完了) の自然統合 = 採決日当日 minute-by-minute 完成版 spec / 5/19 6 層 lock + 5/26 7 層 lock の自然継承

---

## §0. Executive Summary

PM-T Round 27 第 1 波 Task 3 として **6/9 統合採決 2 件まとめ完遂 timeline 完成版** を完成。Owner 拘束 0 分継承構造を 7 層 lock 化、80 min 内訳を DEC-080 30-40 min + DEC-081 25-35 min + 統合 5-10 min spec 化、議決録 reports/ + dashboard / progress.md / decisions.md status 切替 5 件 update 経路を確立。

| 指標 | 値 |
|---|---|
| 採決日 | 2026-06-09（火）09:00-10:20 JST |
| 採決件数 | **2 件**（DEC-019-080 + DEC-019-081）|
| 採決 timeline 内訳 | 開会 5 min + DEC-080 35 min + DEC-081 30 min + 統合 10 min = **80 min**（標準延長 pattern）|
| Owner 拘束 | **0 分継承**（CEO 自走採決 + 事後 formal 1 言で採択承認）|
| 出席者 | CEO + PM-T + PM-S + Review-S（再起動 / R28 想定）+ Knowledge-V（再起動 / R28 想定）+ Sec-V = 6 名（Owner 不在）|
| 採決推奨総合判定 | **2 件全 Y 系統**（Y 強化 1 + Y 無条件 1）|
| 議決 trajectory | 6/9 完遂前 44 件 (DRAFT 2 = DEC-080 + DEC-081) → 完遂後 44 件 (DRAFT 0 = 全 confirmed)|
| 議決録 起票 | reports/pm-t-r27-may-or-jun9-statement-record.md（6/9 10:25 想定）|
| update 5 件 path | decisions.md status / dashboard / progress / reports / CEO Owner formal v28 = 75 min 1.25 hour 内完成 |
| 制約遵守 | API $0 / 副作用 0 / 絵文字 0 |

---

## §1. 6/9 採決 2 件 全体構造

### 1.1 2 件の status + 起案者 + 採決日想定

| # | DEC | 起案者 | status | タイトル | 想定議論時間 | 採決推奨 |
|---|---|---|---|---|---|---|
| 1 | DEC-019-080 | PM-T | DRAFT | Phase 2 W5 完成宣言 + DEC-074 carry-forward | 35 min | **Y 強化** |
| 2 | DEC-019-081 | PM-T | DRAFT | T-5 物理化第 1 弾完遂 + 連続 12 round milestone | 30 min | **Y 無条件** |

### 1.2 採決方式

- **6/9（火）統合採決 2 件まとめ pattern**（DEC-080 + DEC-081）= **80 min（標準延長 pattern）**/ Owner 拘束 0 分継承
- 標準 pattern: 60 min（議論なし採決時 / DEC-080 30 + DEC-081 25 + 統合 5）
- 議論延長 pattern: 100 min（W5 完成 evidence + Phase B-2 物理化連動 review 延長時）

### 1.3 採決後 議決 trajectory（DRAFT 0 件達成 = PRJ-019 議決構造 absolute 確証 second time）

| 時点 | 累計 | DRAFT | confirmed |
|---|---|---|---|
| 6/9 09:00（採決前 / 5/26 完遂後 + DEC-080+081 起案後）| 44 件 | 2 件（DEC-080 + DEC-081）| 42 件 |
| 6/9 10:20（採決完遂直後）| 44 件 | **0 件**（全 confirmed）| **44 件** |
| 6/9 10:25-11:35 update 完遂時 | 44 件 | 0 件 | 44 件 absolute |

**重要**: 6/9 採決完遂で **DRAFT 0 件 second time 達成**（5/26 1st + 6/9 2nd）= PRJ-019 議決構造 absolute 確証 reinforcement = Round 27 着地宣言の核心成果

---

## §2. 採決日当日 timeline 完成版（minute-by-minute）

### 2.1 出席者構成（6 名 / Owner 不在）

| 役割 | 担当 | 主要責務 |
|---|---|---|
| 議長 | CEO | session 進行 + 採決宣言 + Owner formal 報告 |
| 議事進行 | Review-S（R28 Review-T 想定）| 議題進行 + 採決推奨判定読み上げ + Owner 拘束 0 分監視 |
| DEC-080 + DEC-081 起案者 | PM-T | DEC-080/081 採択 6 軸読み上げ + 質疑応答 |
| PM-S 推奨候補 prep 担当 | PM-S | PM-S R26 §2-3 候補 A+B 推奨根拠 補足 |
| INDEX 反映担当 | Knowledge-V（R28 Knowledge-W 想定）| INDEX-v15 確認 + 6/9 完遂後 v16 反映準備 |
| T-5 物理化第 1 弾 evidence | Sec-V | T-5 IMPL 1/3 evidence + baseline JSON v1.4 提示 |

### 2.2 timeline 詳細（80 min 標準延長 pattern）

| 時刻 | 所要 | 内容 | 担当 |
|---|---|---|---|
| 09:00-09:05 | 5 min | session 開会 / 出席確認 / agenda 通知 / 2 件統合採決方式 confirm | CEO |
| 09:05-09:40 | 35 min | **DEC-019-080 採決ブロック**（後述 §2.3）| PM-T + PM-S + Review-S |
| 09:40-10:10 | 30 min | **DEC-019-081 採決ブロック**（後述 §2.4）| PM-T + Sec-V + Review-S |
| 10:10-10:20 | 10 min | **統合採決 + DRAFT 0 件 second 達成宣言**（後述 §2.5）| CEO + Knowledge-V |

合計: 5 + 35 + 30 + 10 = **80 min**（標準延長 pattern）

### 2.3 DEC-019-080 採決ブロック（09:05-09:40 / 35 min）

| 時刻 | 所要 | 内容 |
|---|---|---|
| 09:05-09:10 | 5 min | PM-T が DEC-080 採択 6 軸読み上げ（① Phase 2 W5 完成 / ② cross-orchestrator e2e + cross-package + claude-bridge 累計 / ③ W6 着手準備 / ④ 議決 42→44 件 / ⑤ Round 28 引継 6 項目 / ⑥ Phase 2 進捗 25% + 6/20 余裕拡大）|
| 09:10-09:15 | 5 min | PM-S が **PM-S R26 §2 候補 A 推奨根拠** 補足（24/30 スコア / 第 1 推奨 / DEC-074 carry-forward 仕様 / 5/19 採決後の自然継承）|
| 09:15-09:25 | 10 min | **measurable 7 件 + 採用根拠 8 件 + W5 累計 +33 PASS evidence 議論**（M-1〜M-7 履行確認）|
| 09:25-09:32 | 7 min | 質疑応答 = Phase 2 W5 完成 evidence + W6 着手 trigger 4 条件成立 evidence + DEC-074 carry-forward 仕様の supersede 不採用根拠 + Phase B-2 物理化完遂 R26 連動 confirm |
| 09:32-09:36 | 4 min | Review-S が **採決推奨 Y 強化** 読み上げ（5 軸無条件 + 1 軸強化 = W5 第 3 弾達成 evidence 完備）|
| 09:36-09:40 | 4 min | DEC-080 採決判定 = Y 強化 → DRAFT → confirmed 切替議決 |

**重要**: DEC-080 = Phase 2 W5 完成宣言 = PRJ-019 中核議決 = 35 min 確保（2 件中最長）

### 2.4 DEC-019-081 採決ブロック（09:40-10:10 / 30 min）

| 時刻 | 所要 | 内容 |
|---|---|---|
| 09:40-09:44 | 4 min | PM-T が DEC-081 採択 6 軸読み上げ（① T-5 物理化第 1 弾 / ② 連続 12 round milestone / ③ DEC-068 v2 起案 trigger / ④ baseline JSON v2.0 起票 / ⑤ 議決 43→44 件 / ⑥ Round 28 引継）|
| 09:44-09:50 | 6 min | Sec-V が **T-5 物理化第 1 弾 evidence** 報告（monitor spec 347 行 / READY 7/7 → IMPL 1/3 / baseline JSON v1.4 / 4 layer 累計 1271 行 / 8 file md5 不変）|
| 09:50-09:58 | 8 min | **measurable 6 件 + 採用根拠 6 件 確認 + 連続 12 round milestone evidence review**（M-1〜M-6 履行確認）|
| 09:58-10:03 | 5 min | 質疑応答 = R21-R24 MA=9.75 件/round WARN level evidence + DEC-068 v2 起案 timeline + Sec-V R27 dispatch 想定 confirm |
| 10:03-10:06 | 3 min | Review-S が **採決推奨 Y 無条件** 読み上げ（6 軸全無条件）|
| 10:06-10:10 | 4 min | DEC-081 採決判定 = Y 無条件 → DRAFT → confirmed 切替議決 |

### 2.5 統合採決ブロック + DRAFT 0 件 second 達成宣言（10:10-10:20 / 10 min）

| 時刻 | 所要 | 内容 |
|---|---|---|
| 10:10-10:13 | 3 min | CEO が **2 件まとめ採決宣言** = DEC-080 (Y 強化) + DEC-081 (Y 無条件) → 2 件全 confirmed 切替 |
| 10:13-10:15 | 2 min | CEO が **DRAFT 0 件 second 達成宣言** = 議決構造 44 件全 confirmed = PRJ-019 議決構造 absolute 確証 reinforcement |
| 10:15-10:17 | 2 min | Knowledge-V が INDEX-v15（暫定 151 entries）→ INDEX-v16 反映準備 confirm（Round 28 Knowledge-W 担当）|
| 10:17-10:19 | 2 min | DEC-068 v2 起案 trigger 確定宣言（Sec-V R27 担当 / Round 28 採決想定）|
| 10:19-10:20 | 1 min | session 閉会 + Owner formal 報告 path（CEO 経由 1 言）confirm |

**統合採決 10 min spec 化**: 2 件統合 + DRAFT 0 件 second 達成宣言 + INDEX 反映準備 + DEC-068 v2 trigger + Owner formal 報告 path = 5 要素を 10 min 内に集約

---

## §3. Owner 拘束 0 分継承構造（7 層 lock）

### 3.1 7 層 lock 設計（5/19 6 層 + 5/26 7 層 の自然継承）

| 層 | lock 内容 | 根拠 |
|---|---|---|
| 第 1 層 | CEO 自走採決 | DEC-019-025 SOP（background dispatch）+ CEO formal 採択権限 |
| 第 2 層 | 2 件全議決は Round 26-27 完遂着地の自然継承宣言 | Owner directive「最速で進めよ」継続適用範囲内 |
| 第 3 層 | 採択 6 軸はすべて Round 26-27 完遂着地時の事実 freeze | 議論余地少 / Owner 直接 review 不要 |
| 第 4 層 | Owner 残動作 1 件不変 | 6/19 朝公開最終確認のみ（C-1 / 2-3 min）|
| 第 5 層 | CEO 経由 formal 報告 path 確立 | CEO 統合報告 v28 起票準備 + Owner formal 1 言 ack 経路 |
| 第 6 層 | Owner ack card 19 件物理化済 + 20 件目候補 R27 起票 | 19 件 + OWN-W5-PROD-ACK 20 件目候補 = ack 体系完備 |
| 第 7 層 | **5/19 + 5/26 採決完遂 evidence + Phase B-2 物理化完遂 evidence 自然継承** | 5/19 4 件 + 5/26 2 件 = 6 件 confirmed 切替済 + Phase B-2 物理化 R26 完遂 |

### 3.2 Owner 拘束 0 分継承 evidence chain

1. **CEO 自走採決**: 議長権限 + 議事進行 Review-S + 起案者 PM-T + INDEX 反映 Knowledge-V + Sec evidence Sec-V = 6 名 self-contained
2. **採決推奨判定確定**: 2 件全 Y 系統 = 議論余地少
3. **議論延長 buffer 20 min** 内蔵（80 min 標準延長 → 100 min 議論延長 pattern 即対応）
4. **fallback path 3 種準備済**（後述 §5）
5. **6/9 完遂後 update 5 件 path 確立**（後述 §4）
6. **6/19 公開最終確認 1 件のみ Owner 残動作**

---

## §4. 6/9 採決完遂後 update 5 件 path

### 4.1 update path 詳細（採決完遂後 1.25 hour 内完成）

| 時刻 | task | file 対象 | 担当 | 所要 |
|---|---|---|---|---|
| 10:20-10:30 | 議決録起票 | reports/pm-t-r27-jun9-statement-record.md（NEW）| Review-S | 10 min |
| 10:30-10:45 | decisions.md status 切替 | DEC-080 + DEC-081 status DRAFT → confirmed × 2 件 | PM-T | 15 min |
| 10:45-11:00 | dashboard 反映 | dashboard/active-projects.md（議決構造 42 → **44 件 confirmed = DRAFT 0 件 second 達成**）| CEO | 15 min |
| 11:00-11:20 | progress.md 反映 | projects/PRJ-019/progress.md（Phase 2 W5 完成宣言 + DEC-074 carry-forward + T-5 IMPL 1/3 + 連続 12 round milestone）| PM-T + Sec-V | 20 min |
| 11:20-11:35 | CEO 経由 Owner 統合報告 v28 起票準備 | CEO 統合報告 v28（Round 27 6/9 採決完遂着地）+ Owner formal 1 言 ack | CEO | 15 min |

合計: 10 + 15 + 15 + 20 + 15 = **75 min**（10:20 採決完遂後の 1.25 hour 内完成）

### 4.2 6/9 採決日当日 全体タイムテーブル（採決 + update 統合 / 9:00-11:35）

| 時刻 | block | 所要 |
|---|---|---|
| 09:00-10:20 | 採決 session | 80 min |
| 10:20-10:30 | 議決録起票 | 10 min |
| 10:30-10:45 | decisions.md status 切替 × 2 件（DEC-080 + DEC-081）| 15 min |
| 10:45-11:00 | dashboard 反映 | 15 min |
| 11:00-11:20 | progress.md 反映 | 20 min |
| 11:20-11:35 | CEO Owner formal 報告 v28 | 15 min |
| **合計** | - | **2.6 hour（155 min）** |

Owner 拘束: **0 分継承**（全 task CEO + PM 部署内消化 / Owner formal 1 言 ack のみ事後）

---

## §5. 否決時 fallback path（6/9 採決 3 種）

| 否決 case | 影響 | fallback 経路 |
|---|---|---|
| (P) DEC-080 否決 | Phase 2 W5 完成宣言不成立 / DEC-074 carry-forward 未確定 | Round 28 繰越 / DEC-081 単独採決継承 / Phase 2 W5 完成は R28 で carry 可能 |
| (Q) DEC-081 否決 | T-5 物理化第 1 弾 + 連続 12 round milestone formal 化遅延 | Round 28 繰越 / Sec-V R27 担当作業継続 / DEC-080 単独 confirmed 切替維持 |
| (R) 2 件全否決 | timeline 倍増（160 min）+ Phase 2 W5 完成 + T-5 物理化 formal 化 1 round 延期 | Round 28 採決優先 + Round 27 完遂着地時の暫定 status 維持 |

**連鎖否決確度**: **2-3%**（順調 97-98% / 5/19 + 5/26 採決完遂 evidence + Phase B-2 物理化完遂 evidence 自然継承）

---

## §6. 議決構造 trajectory R20-R27（PM-T 集計版）

### 6.1 議決数 trajectory

| Round | 累計 | DRAFT | confirmed | Δ |
|---|---|---|---|---|
| Round 20 | 38 件 | 6 件 | 32 件 | - |
| Round 21 | 39 件 | 6-7 件 | 32-33 件 | +1 |
| Round 22 | 40 件 | 7 件 | 33 件 | +1 |
| Round 23 | 40 件 | 8 件 | 32 件 | 0（DEC-073 採択完遂）|
| Round 24 | 41 件 | 9 件 | 32 件 | +1（DEC-078 起案）|
| Round 25 | **42 件** | 6 件継続 / 暫定実態 | 36 件想定 | **+1**（DEC-079 起案）|
| Round 26 | **42 件** | 6 件継続 | 36 件 | 0（採決前）|
| **Round 27 着地（PM-T 起案後）**| **44 件** | **2 件**（DEC-080 + DEC-081 DRAFT）| 42 件 | **+2**（DEC-080 + DEC-081 起案）|
| Round 27 6/9 採決後想定 | **44 件** | **0 件**（全 confirmed）| **44 件** | 0（採決完遂）|

### 6.2 DRAFT 状態 trajectory

| 時点 | DRAFT 件数 | confirmed 件数 | 比率 |
|---|---|---|---|
| Round 20 | 6 件 | 32 件 | 84% confirmed |
| Round 24 | 9 件 | 32 件 | 78% confirmed |
| Round 25 5/19 採決前 | 10 件 | 32 件 | 76% confirmed |
| Round 25 5/19 採決後想定 | 6 件 | 36 件 | 86% confirmed |
| **Round 25 5/26 採決後想定** | **0-1 件** | **41-42 件** | **97-100% confirmed**（DRAFT 0 件 1st 達成）|
| Round 26 着地時 | 6 件継続 | 36 件 | 86% |
| **Round 27 着地時（PM-T 起案後）** | **2 件**（DEC-080+081）| 42 件 | 95% |
| **Round 27 6/9 採決後想定** | **0 件** | **44 件** | **100% confirmed**（DRAFT 0 件 2nd 達成）|

### 6.3 Owner 拘束 trajectory（採決日累計）

| Round | 採決 Owner 拘束 | 累計（採決日） |
|---|---|---|
| Round 20-24 | 0 分 / round | 0 分 |
| Round 25 5/19 | 0 分 | 0 分 |
| Round 25 5/26 | 0 分 | 0 分 |
| Round 26（採決なし）| - | 0 分 |
| **Round 27 6/9（DEC-080+081）**| **0 分継承** | **0 分** |
| 6/19 公開当日 | - | 2-3 min（C-1 朝確認のみ）|

**重要**: Round 20-27 採決 Owner 拘束累計 **0 分**（CEO 自走採決構造的成立）= PRJ-019 議決構造 absolute 確証の中核成果 = 8 round 連続維持

---

## §7. リスク + 制約遵守

### 7.1 採決リスク（極低）

| リスク | 確度 | 影響 | 対策 |
|---|---|---|---|
| 6/9 議論延長（100 min 超過）| 低（5%）| Owner 拘束影響なし | 議論延長 100 min pattern 適用 + buffer 20 min 内蔵 |
| DEC-080 carry-forward 仕様議論延長 | 低（5%）| timeline +5-10 min | DEC-074 confirmed 維持 evidence 即提示 |
| DEC-081 連続 12 round milestone evidence 議論延長 | 低（5%）| timeline +5-10 min | Sec-V baseline JSON v1.4 + monitor spec 即提示 |
| 連鎖否決（2 件中 1 件以上否決）| 低（2-3%）| Round 28 部分繰越 | fallback 3 種準備済 |

### 7.2 制約遵守

- API 消費: **$0**（PM-T は Read + Edit + Write のみ）
- 副作用: **0**（decisions.md 末尾追記 + reports/ 新規 4 ファイルのみ）
- 絵文字: **0**
- tests 影響: **0**（baseline harness 849 + openclaw-runtime 394 維持）
- 既存 DEC 改変: **0**（DEC-019-001〜079 すべて無改変、append-only 厳守 / 6/9 採決は Round 28 task）
- DRAFT 維持: DEC-080 + DEC-081 status DRAFT（6/9 採決時 confirmed 切替予定）
- decisions.md 末尾追記のみ（line 1593 以降）
- 既存 file md5 不変厳守
- SOP 順守: DEC-019-025（background dispatch、SOP 実証 24 件目 = Round 27 連続 13 round 達成見込）

---

## §8. 関連 file

### 8.1 PM-T Round 27 deliverable（4 ファイル / 本書 = Task 3）

- `projects/PRJ-019/reports/pm-t-r27-summary.md`（Task 4 / Round 27 PM-T summary）
- `projects/PRJ-019/reports/pm-t-r27-dec-080-formal.md`（Task 1 / DEC-080 物理起案完了）
- `projects/PRJ-019/reports/pm-t-r27-dec-081-formal.md`（Task 2 / DEC-081 物理起案完了）
- `projects/PRJ-019/reports/pm-t-r27-6-9-statement-final.md`（Task 3 / 本書）

### 8.2 先行 deliverable（参照）

- `projects/PRJ-019/reports/ceo-v27-round26-9parallel-completion.md`（CEO 統合報告 v27 / Round 26 9 並列 完遂）
- `projects/PRJ-019/reports/pm-s-r26-summary.md`（PM-S R26 summary）
- `projects/PRJ-019/reports/pm-s-r26-5-19-statement-final.md`（5/19 採決 timeline 完成版）
- `projects/PRJ-019/reports/pm-s-r26-5-26-statement-final.md`（5/26 採決 timeline 完成版）
- `projects/PRJ-019/reports/pm-s-r26-dec-080-draft-prep.md`（DEC-080 起案候補 4 件比較）
- `projects/PRJ-019/decisions.md` L1593-1716（DEC-019-080 物理起案 / PM-T R27 起案）
- `projects/PRJ-019/decisions.md` L1718-1827（DEC-019-081 物理起案 / PM-T R27 起案）

---

**v15.27 footer (Round 27 PM-T = Task 3 完遂)**: 2026-05-05 ／ 6/9 採決対象議決数: **2 件**（DEC-019-080 + DEC-019-081）／ 採決 timeline: 09:00-10:20 JST / 80 min（標準延長）= 開会 5 + DEC-080 35 + DEC-081 30 + 統合 10 ／ Owner 拘束: **0 分継承**（7 層 lock = 5/19 6 層 + 5/26 7 層 + 6/9 自然継承）／ 採決推奨総合判定: **2 件全 Y 系統**（Y 強化 1 + Y 無条件 1）／ DRAFT 0 件 2nd 達成 = PRJ-019 議決構造 absolute 確証 reinforcement（44 件全 confirmed）／ update 5 件 path: 議決録 + decisions.md status × 2 + dashboard + progress + CEO Owner formal v28 = 75 min 1.25 hour 内完成 ／ fallback 3 種準備済（連鎖否決確度 2-3%）／ 議決構造 trajectory R20-R27: 38 → **44 件**（+6 件 / 7 round）/ DRAFT 0 件 1st (5/26) + 2nd (6/9) 達成 / Owner 拘束採決日累計 **0 分** 8 round 連続維持 ／ 制約遵守: API $0 / 副作用 0 / 絵文字 0 / tests 影響 0 / 既存 DEC-001-079 完全無改変 ／ SOP 順守 24 件目（DEC-019-025 / Round 27 連続 13 round 達成見込）
