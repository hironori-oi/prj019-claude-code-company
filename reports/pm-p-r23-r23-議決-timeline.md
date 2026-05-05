# PM-P Round 23 報告書 — Round 23 5/26 採択 + 議決準備整理（議決 8 件 timeline）

- **担当**: PM-P（PM 部門 / Round 23 第 1 波）
- **起案日**: 2026-05-05（Round 22 完遂着地直後 / Owner formal「Round 23 9 並列 GO」directive 受領後）
- **位置付け**: Round 23 期間内に処理すべき議決 8 件の timeline 整理 + 5/26 採択 4 件まとめ確定 + Round 23 議決 4 件確定 + Round 24 引継議決 3 件 DRAFT 起案完遂
- **先行**: PM-P `pm-p-r23-dec-074-verification.md`（323 行）/ PM-O `pm-o-r22-dec-067-068-069-070-merged-agenda-2026-05-26.md`（304 行）
- **SOP 順守**: DEC-019-025（background dispatch、SOP 実証 20 件目）

---

## §0. Executive Summary

Round 23 期間（5/5-5/12 想定）+ 5/26 採択 + Round 24 採決の三段階で処理すべき議決 8 件を timeline 化。

| 段階 | 採決方式 | 対象 DEC | 件数 | 推奨判定 |
|---|---|---|---|---|
| (A) 5/26 採択 | 4 件まとめ統合採択 | DEC-019-067 + 068 + 069 + 070 | 4 件 | **Y 揃い無条件**（Review-N 56 観点 全 Y / Critical 0 / Major 0 / Minor 2 議決妨げず）|
| (B) Round 23 完遂時採決 | 3 件 readiness Y 揃い採決 | DEC-019-071 + 072 + 073 | 3 件 | **Y 揃い**（071 Y 無条件 / 072 Y 無条件 / 073 Y 条件付）|
| (C) Round 23 完遂時採決 | DEC-074 verification 採決 | DEC-019-074 | 1 件 | **Y 条件付**（PM-P 8 軸 47 観点 / OK 45 / 評価対象外 2 / Critical 0）|
| (D) Round 24 統合採決 | 3 件 DRAFT 起案議決 | DEC-019-075 + 076 + 077 | 3 件 | **Round 23 中は DRAFT 維持 / Round 24 採決推奨** |
| **計** | - | DEC-019-067〜077 | **11 件処理 / うち 8 件採決** | - |

**総合判定**: Round 23 期間内 5/26 + 完遂時に **8 件採決完遂**（A 4 件 + B 3 件 + C 1 件）+ Round 24 引継 3 件 DRAFT 起案完遂。

---

## §1. (A) 5/26 採択 4 件まとめ統合採択（PM-O 既出 agenda 継承）

### 1.1 対象 DEC

| DEC | タイトル | 起案者 | DRAFT 期間 | readiness |
|---|---|---|---|---|
| DEC-019-067 | Phase 1 W1 完成宣言 + 5/9 kickoff baseline 確定 | PM-J | Round 17-22 | Y 全（4 段階 verification 通過） |
| DEC-019-068 | stagger 圧縮 SOP デフォルト昇格議決 + 連続 round trigger | PM-K | Round 18-22 | Y 全（4 段階 verification 通過） |
| DEC-019-069 | Phase 1 W2 完成宣言 + cross-control invariants 28 件確立 | PM-L | Round 19-22 | Y 全（4 段階 verification 通過） |
| DEC-019-070 | Phase 1 W3 完成宣言 + orchestrator 接続 e2e 7 ctrl 通し sequence | PM-M | Round 20-22 | Y 無条件昇格（Review-M R21「Y 条件付」→ Review-N R22「Y 無条件」、M-7 D-7 詳細手順書 821 行完成で条件解消） |

### 1.2 採決 timeline（PM-O agenda 304 行継承）

| 時刻 | 区分 | 担当 | 内容 | 累計 |
|---|---|---|---|---|
| 09:30 JST | session 開始 | CEO | 4 件まとめ採択 session 開会宣言 | 0:00 |
| 09:35-09:55 JST | DEC-067 採決 | CEO + Sec | Pre-read 10 + 議論 5 + 採決 5 | 0:25 |
| 10:00-10:20 JST | DEC-068 採決 | CEO + Sec | Pre-read 10 + 議論 5 + 採決 5 | 0:50 |
| 10:25-10:45 JST | DEC-069 採決 | CEO + Sec | Pre-read 10 + 議論 5 + 採決 5 | 1:15 |
| 10:50-11:10 JST | DEC-070 採決 | CEO + Sec | Pre-read 10 + 議論 5 + 採決 5（Minor 1 = 議決妨げず） | 1:40 |
| 11:10-11:15 JST | session 終了 | CEO | 統合採択宣言 + dashboard 更新指示 | 1:45 |
| 11:15-11:30 JST | status 切替 | Secretary | decisions.md L283 / L355 / L461 / L551 status DRAFT → confirmed | - |
| 11:30 JST | dashboard 更新 | Secretary | active-projects.md / progress.md 議決 36 件中 4 件 confirmed | - |
| 12:00 JST | Owner 報告 | CEO | 統合報告 v24 = 5/26 採択完遂 + Round 23 引継 | - |

**timeline 余裕**: 60 / 67 / 75 min の 3 pattern（PM-O agenda 304 行）/ 標準 67 min。

### 1.3 Owner 拘束

**推奨 0 分**（CEO 自走採決可、不在時 formal 報告で「採択承認」事後 1 言で十分）。

### 1.4 DEC-072 吸収オプション

5/26 statement 内で **DEC-019-072（confirmed 昇格議決）= DEC-019-068 と同時吸収**するオプション選択時:
- 議決構造: 4 件まとめ → 5 件まとめ拡張
- timeline 余裕: 標準 67 min → 90 min（DEC-072 25 min 追加）
- メリット: stagger SOP デフォルト昇格 + confirmed 昇格を同日完遂、SOP 確証集約
- デメリット: 議論時間延長、Round 23 完遂時採決で独立採決選択時より柔軟性

**PM-P 推奨**: **5/26 = 4 件まとめ堅持**（DEC-072 = Round 23 完遂時採決で独立採決推奨、議論時間最適化）。

---

## §2. (B) Round 23 完遂時採決 3 件（DEC-071 + 072 + 073）

### 2.1 対象 DEC

| DEC | タイトル | 起案者 | DRAFT 期間 | PM-O 推奨判定 |
|---|---|---|---|---|
| DEC-019-071 | SOP 改訂条件 trigger formal 化 | PM-N | Round 21-23 | Y 無条件（PM-O 6 軸 13/15 OK） |
| DEC-019-072 | stagger 圧縮 SOP confirmed 昇格議決 | PM-N | Round 21-23 | Y 無条件（PM-O 6 軸 17/17 OK = 100%） |
| DEC-019-073 | Phase 1 W3→W4 移行宣言 | PM-N | Round 21-23 | Y 条件付（PM-O 6 軸 16/20 OK / 部分達成 4 = W4 完遂時 measurable 完全評価）|

### 2.2 採決 timeline（Round 23 完遂時想定 = 5/12 想定）

| 時刻 | 区分 | 担当 | 内容 | 累計 |
|---|---|---|---|---|
| 09:00 JST | session 開始 | CEO | Round 23 完遂時 3 件採決 session 開会 | 0:00 |
| 09:05-09:25 JST | DEC-071 採決 | CEO + Sec | Pre-read 10 + 議論 5 + 採決 5 | 0:25 |
| 09:30-09:50 JST | DEC-072 採決 | CEO + Sec | Pre-read 10 + 議論 5 + 採決 5 | 0:50 |
| 09:55-10:15 JST | DEC-073 採決 | CEO + Sec | Pre-read 10 + 議論 5 + 採決 5（条件付：W4 完遂時 measurable 完全評価明示）| 1:15 |
| 10:15-10:20 JST | session 終了 | CEO | 採決完遂宣言 + dashboard 更新指示 | 1:20 |
| 10:20-10:30 JST | status 切替 | Secretary | decisions.md DEC-071/072/073 status DRAFT → confirmed | - |

**timeline**: 80 min（標準）/ 60 min（短縮）/ 90 min（議論延長余裕）の 3 pattern。

### 2.3 DEC-073 条件付承認の根拠

- 部分達成 4 = M-1 harness 800+ / M-2 openclaw 410+ / M-3 統合 e2e fully wired / M-7 Sec hardening 維持 + dependencies 解消 = **W4 完遂時 measurable 完全評価対象**
- Round 23 完遂時の評価は「W3→W4 移行宣言」の formal 化と「W4 着手 4/4 task 達成」確証 = 移行 trigger 成立採択
- 完成評価は別 DEC（DEC-019-075 Phase 1 完遂宣言）で実施

### 2.4 Owner 拘束

**推奨 0 分**（CEO 自走採決可、Round 23 完遂時統合報告 v24 で「採決完遂」事後 1 言）。

---

## §3. (C) Round 23 完遂時採決 1 件（DEC-074）

### 3.1 対象 DEC

| DEC | タイトル | 起案者 | DRAFT 期間 | PM-P 推奨判定 |
|---|---|---|---|---|
| DEC-019-074 | Round 22 9 並列構成 + 17 日 path W4 完成（6/20 Phase 1 完遂）+ measurable 7 件 | PM-O | Round 22-24 | **Y 条件付**（PM-P 8 軸 47 観点 / OK 45 / 評価対象外 2 = 未来 milestone）|

### 3.2 採決 timing 推奨

| 採決方式 | timing | 推奨度 |
|---|---|---|
| Round 23 完遂時単独採決（DEC-074 単体）| 5/12 想定 | 中（M-3 / M-7 未到達のため条件付）|
| Round 24 統合採決（DEC-074 + 075 + 076 + 077）| 5/19 想定 | **高（推奨）** = 3 件 DRAFT 起案完遂後の 4 件まとめ採決 |
| 6/12 statement 完遂後採決 | 6/12 後 | 中（M-3 / M-7 完全評価可能だが期限圧迫）|

**PM-P 推奨**: **Round 24 統合採決**（DEC-074 + 075 + 076 + 077 = 4 件まとめ採決）。

### 3.3 Round 24 統合採決時の timeline（暫定）

| 時刻 | 区分 | 担当 | 内容 | 累計 |
|---|---|---|---|---|
| 09:00 JST | session 開始 | CEO | Round 24 4 件まとめ採決 session 開会 | 0:00 |
| 09:05-09:30 JST | DEC-074 採決 | CEO + Sec | Pre-read 10 + 議論 10 + 採決 5（条件付：未来 milestone 評価対象外明示）| 0:30 |
| 09:35-10:00 JST | DEC-075 採決 | CEO + Sec | Pre-read 10 + 議論 10 + 採決 5（Phase 1 完遂宣言）| 1:00 |
| 10:05-10:25 JST | DEC-076 採決 | CEO + Sec | Pre-read 10 + 議論 5 + 採決 5（ARCH-01 必達クローズ）| 1:25 |
| 10:30-10:50 JST | DEC-077 採決 | CEO + Sec | Pre-read 10 + 議論 5 + 採決 5（OWN-AUTO default 化）| 1:50 |
| 10:50-10:55 JST | session 終了 | CEO | 4 件統合採択宣言 | 1:55 |

**timeline**: 115 min（標準）/ 90 min（短縮）/ 130 min（議論延長余裕）の 3 pattern。

---

## §4. (D) Round 24 引継議決 3 件（DEC-019-075/076/077 DRAFT 起案完遂）

### 4.1 対象 DEC（PM-P Round 23 第 1 波 起案）

| DEC | タイトル | 起案者 | DRAFT 起案 | レビュー期限 |
|---|---|---|---|---|
| DEC-019-075 | Phase 1 W4 完遂宣言 + 17 日 path 4 段達成宣言 | PM-P | 2026-05-05 | 2026-05-19（Round 24 採決想定）|
| DEC-019-076 | ARCH-01 解消 = DEC-019-041 Phase B 必達クローズ宣言（path alias 物理 migrate 完遂）| PM-P | 2026-05-05 | 2026-05-19（Round 24 採決想定）|
| DEC-019-077 | Owner 拘束 76% 圧縮 default 化議決（OWN-AUTO 自動化 PoC 完遂後の default flow 化）| PM-P | 2026-05-05 | 2026-05-19（Round 24 採決想定）|

### 4.2 3 件の関係性

- **DEC-075（Phase 1 完遂宣言）= 上位 wrapping**
  - Phase 2 W5 着手 trigger 4 条件 = (a) tests / (b) ARCH-01 / (c) OWN-AUTO / (d) Owner 承認
  - DEC-076 採決完遂 = 条件 (b) 成立
  - DEC-077 採決完遂 = 条件 (c) 成立
  - 条件 (a) = Round 23 完遂時の harness 800+ / openclaw 410+ / e2e fully wired
  - 条件 (d) = Round 24 統合採決時の Owner 承認

- **DEC-076（ARCH-01 必達クローズ）= 必達経路 ESTABLISHED の formal 化**
  - DEC-019-041 Phase B candidate → closed
  - Dev-MM + Dev-NN（Round 23 第 1 波）= path alias 物理 migrate 2.5h 実行
  - regression 0 + relative imports fallback 並存維持

- **DEC-077（OWN-AUTO default 化）= Owner 拘束 76% 圧縮実証の default 化**
  - Web-Ops-J（Round 23 第 2 波）= OWN-AUTO PoC 物理 implementation
  - 80→19 min 76% 圧縮実機実測
  - manual fallback 維持（OWN-PRE 80 min）

### 4.3 Round 23 中の DRAFT 維持 + Round 24 採決推奨

- Round 23 進行中は DEC-075/076/077 status DRAFT 固定（Round 24 採決時に confirmed 切替）
- Round 23 完遂時は DEC-071/072/073/074 採決のみ（4 件まとめ単独採決）
- Round 24 採決時 = DEC-074 統合採決 + DEC-075/076/077 DRAFT 起案議決 = **4 件まとめ統合採決**

---

## §5. Round 23 議決 8 件 timeline 統合表

### 5.1 timeline 全体図

| 段階 | 日時 | 採決対象 | 件数 | Owner 拘束 | 累計議決完遂 |
|---|---|---|---|---|---|
| (A) 5/26 採択 | 2026-05-26 09:30-11:30 | DEC-019-067 + 068 + 069 + 070 | 4 件 | 0 分 | 4 件 |
| (B) Round 23 完遂時 | 2026-05-12（想定）09:00-10:30 | DEC-019-071 + 072 + 073 | 3 件 | 0 分 | 7 件 |
| (C) Round 23 完遂時（B と同 session）| 同上 10:30-10:55 | DEC-019-074 | 1 件 | 0 分 | 8 件 |
| (D) Round 24 統合採決 | 2026-05-19（想定）09:00-10:55 | DEC-019-075 + 076 + 077（+ 074 再統合）| 3 件（+ 1 件再採択）| 0 分 | 11 件（DEC-074 = (C) と (D) で位置付け遷移）|

### 5.2 timeline 採決方式 推奨

**PM-P 推奨**:
- (A) 5/26 採択 = **4 件まとめ確定**（DEC-072 吸収オプション不採用、議論時間最適化）
- (B) + (C) Round 23 完遂時採決 = **DEC-071/072/073 + 074 = 4 件まとめ統合採決**（標準 100-115 min）
  - もしくは (B) と (C) を分離 = (B) 80 min + (C) 30 min separate session
- (D) Round 24 統合採決 = **DEC-075 + 076 + 077 = 3 件まとめ採決**（標準 80-90 min）
  - DEC-074 status update のみ（(C) で採決済 → 改めて再採決不要）

### 5.3 採決完遂時の議決構造遷移

| 時点 | 議決総数 | confirmed | DRAFT |
|---|---|---|---|
| Round 22 完遂時（5/5）| 37 件 | 32 件 | 5 件（070/071/072/073/074）|
| Round 23 完遂時（5/12）| 40 件 | 36 件 | 4 件（075/076/077/+ DEC-074 = (C) で confirmed 切替時 3 件）|
| 5/26 採択完遂時 | 40 件 | 40 件（4 件 status 切替）+ Round 24 引継 3 件 = 計 confirmed 36 件 + DRAFT 4 件（074/075/076/077）|
| Round 24 採決完遂時（5/19）| 40 件 | 40 件全 confirmed | 0 件 |

※ Round 23 中の DEC-075/076/077 起案で 37 → 40 件（+3 件）

---

## §6. 5/26 採択完遂後の implementation timeline

### 6.1 5/26 採択完遂直後

| 時刻 | 区分 | 担当 | 内容 |
|---|---|---|---|
| 11:15-11:30 JST | status 切替 | Secretary | decisions.md DEC-067 / 068 / 069 / 070 status DRAFT → confirmed |
| 11:30 JST | dashboard 更新 | Secretary | active-projects.md / progress.md / INDEX 議決 36 件中 4 件 confirmed |
| 12:00 JST | Owner 報告 | CEO | 統合報告 v24 = 5/26 採択完遂 + Round 23 引継 |
| 12:00-13:00 JST | INDEX update | Knowledge | INDEX-v11 → INDEX-v12（DEC-067/068/069/070 confirmed 反映）|

### 6.2 Round 23 完遂時採決完遂直後（5/12 想定）

| 時刻 | 区分 | 担当 | 内容 |
|---|---|---|---|
| 10:55-11:30 JST | status 切替 | Secretary | decisions.md DEC-071 / 072 / 073 / 074 status DRAFT → confirmed |
| 11:30 JST | dashboard 更新 | Secretary | active-projects.md / progress.md / INDEX 議決構造 update |
| 12:00 JST | Owner 報告 | CEO | 統合報告 v24+ = Round 23 完遂 + Round 24 引継 |

### 6.3 Round 24 採決完遂直後（5/19 想定）

| 時刻 | 区分 | 担当 | 内容 |
|---|---|---|---|
| 10:55-11:30 JST | status 切替 | Secretary | decisions.md DEC-075 / 076 / 077 status DRAFT → confirmed |
| 11:30 JST | dashboard 更新 | Secretary | active-projects.md / progress.md / INDEX 議決構造 update |
| 12:00 JST | Phase 1 完遂宣言 | CEO | 統合報告 v25 = Phase 1 完遂宣言 + Phase 2 W5 着手 trigger 4 条件成立確認 |
| 12:30 JST | Phase 2 着手判定 | Owner | Phase 2 W5 着手 GO 判断（Owner formal 承認）|

---

## §7. リスク

### 7.1 5/26 採択リスク（極低）

| リスク | 確度 | 影響 | 対策 |
|---|---|---|---|
| Owner 5/26 当日不在 | 低 | impact 0（CEO 自走採決 + formal 報告で「採択承認」事後 1 言）| Owner 拘束推奨 0 分前提 |
| DEC-070 Minor 1 件議論延長 | 中 | 採決時間 +3-5 min | M-7 = D-7 詳細手順書完成 + 実機実行 6/12 = 議決妨げず明示済 |
| 新規 Critical 検出 | 極低 | 採択遅延（6/2 Round 23 完遂時に再採択）| Review-N 56 観点 全 Y / Critical 0 確証 |

### 7.2 Round 23 完遂時採決リスク（低）

| リスク | 確度 | 影響 | 対策 |
|---|---|---|---|
| DEC-074 採決時の M-3 / M-7 議論延長 | 低 | timeline +5-10 min | PM-P verification §5.2「未来 milestone 評価対象外」明示済 |
| DEC-073 条件付承認の議論延長 | 低 | timeline +5 min | PM-O verification §2.4「W4 完遂時 measurable 完全評価」timeline 明示済 |
| DEC-074 採決を Round 24 に繰越 | 中 | (C) 段階 1 件減 | Round 24 統合採決推奨に切替 = 4 件まとめへ |

### 7.3 Round 24 採決リスク（極低）

| リスク | 確度 | 影響 | 対策 |
|---|---|---|---|
| DEC-075 Phase 1 完遂宣言 = harness 800+ 未到達 | 低 | 部分達成扱い | Round 23 完遂時 trajectory 通り推移想定 / 5 件以上達成で formal 化 |
| DEC-076 ARCH-01 物理 migrate regression 検出 | 極低 | DEC-019-041 Phase B closed delay | Dev-JJ 案 A 評価 = 2.5h / 議決不要 / regression 0 想定 + relative imports fallback 並存 |
| DEC-077 OWN-AUTO PoC 19 min 未達 | 低 | 部分達成扱い | sub-card 別圧縮率 evidence で部分達成判定可能 |

---

## §8. 制約遵守

- API 消費: **$0**（PM-P は Read + Edit + Write のみ）
- 副作用: **0**（reports/ 新規 + decisions.md 末尾追記のみ、既存 DEC-019-001〜074 完全無改変）
- 絵文字: **0**（本書全文）
- tests 影響: **0**（baseline harness 795 + openclaw-runtime 394 維持）
- 既存 DEC 改変: **0**（DEC-019-001〜077 すべて無改変、append-only 厳守）
- DRAFT 維持: DEC-070/071/072/073 = 既存 DRAFT 維持（5/26 + Round 23 完遂時に confirmed 切替）/ DEC-074 = Round 23 完遂時 or Round 24 統合採決時に confirmed 切替 / DEC-075/076/077 = Round 23 進行中 DRAFT 固定、Round 24 採決時 confirmed 切替
- relative imports fallback pattern 維持（ARCH-01 = DEC-019-076 で並走議決）
- manual fallback（OWN-PRE 80 min）維持（DEC-077 で並走議決、backward compat 完全保証）
- fix forward-only 厳守: 本書 + decisions.md 末尾追記のみ、既存議決すべて無改変
- SOP 順守: DEC-019-025（background dispatch、SOP 実証 20 件目）

---

## §9. 関連 file

### 9.1 PM-P Round 23 第 1 波 deliverable（4 ファイル）

- `projects/PRJ-019/reports/pm-p-r23-dec-074-verification.md`（task ① / 8 軸 47 観点 verification）
- `projects/PRJ-019/decisions.md` L965+（task ② / DEC-019-075/076/077 DRAFT 起案 = 964→1233 / +269 行）
- `projects/PRJ-019/reports/pm-p-r23-r23-議決-timeline.md`（task ③ / 本書）
- `projects/PRJ-019/reports/pm-p-r23-summary.md`（task ④ / Round 23 PM 総括 + Round 24 引継 6 項目候補）

### 9.2 先行 deliverable（参照）

- `projects/PRJ-019/reports/pm-o-r22-summary.md`（PM-O Round 22 第 1 波 summary 284 行）
- `projects/PRJ-019/reports/pm-o-r22-dec-067-068-069-070-merged-agenda-2026-05-26.md`（PM-O 5/26 agenda 304 行）
- `projects/PRJ-019/reports/pm-o-r22-dec-071-072-073-verification.md`（PM-O 6 軸 verification 457 行）
- `projects/PRJ-019/reports/review-n-r22-dec-readiness-5dec-verification.md`（Review-N 56 観点）
- `projects/PRJ-019/reports/review-n-r22-quality-trajectory-r17-r22.md`（Review-N R17→R22 trajectory 48 観点 332 行）
- `projects/PRJ-019/reports/review-n-r22-landing-judgment.md`（Review-N 着地判定 172 行）
- `projects/PRJ-019/reports/ceo-v23-round22-9parallel-completion.md`（CEO 統合報告 v23）
- `projects/PRJ-019/decisions.md`（DEC-019-067〜077 全文）

---

**v15.23 footer (Round 23 第 1 波 PM-P = 議決 timeline 整理完遂)**: 2026-05-05（Round 22 完遂着地直後 / Owner formal「Round 23 9 並列 GO」directive 順守継続）／ **Round 23 議決 8 件 timeline 確立**: (A) 5/26 採択 4 件まとめ + (B) Round 23 完遂時 3 件採決 + (C) Round 23 完遂時 1 件採決 + (D) Round 24 統合採決 3 件 ／ **採決方式推奨**: (A) 4 件まとめ確定 / (B)+(C) 4 件まとめ統合採決 100-115 min / (D) 3 件まとめ採決 80-90 min ／ **Owner 拘束**: 全 0 分（CEO 自走採決 + formal 報告事後 1 言）／ **議決構造 trajectory**: 37 件（Round 22 完遂） → 40 件（Round 23 完遂）→ 40 件全 confirmed（Round 24 採決完遂）／ **制約遵守**: API $0 / 副作用 0 / 絵文字 0 / tests 影響 0 / 既存 DEC 改変 0 / SOP 順守 20 件目（DEC-019-025）／ **次回更新**: Round 23 完遂着地時 v15.24 footer（CEO 統合報告 v24 + 5/26 採択 readiness 最終確認 + DEC-071/072/073/074 採決完遂 + DEC-075/076/077 DRAFT status update）
