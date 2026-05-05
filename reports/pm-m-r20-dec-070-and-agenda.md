# PM-M Round 20 報告書 — DEC-019-070 DRAFT 起案 + 5/26 統合採択 agenda 作成

- **担当**: PM-M（PM 部門 / Round 20 第 1 波）
- **起案日**: 2026-05-05（Round 19 完遂着地直後 / Owner formal「Round 20 9 並列 GO 丁寧に」directive 想定 trigger）
- **対象議決**: DEC-019-070（DRAFT 起案 = Round 20 9 並列構成 + W3 完成 + 5/29 W4 移行 + measurable 7 件） / DEC-019-067 + 068 + 069（5/26 統合採択 agenda 作成）
- **レビュー期限**: DEC-070 = 2026-05-26（5/26 統合採択 session 内 formal 化想定） / agenda = 2026-05-26 当日運営
- **関連報告**: ceo-v20-round19-9parallel-completion.md / pm-l-r19-dec-068-finalize.md / review-k-r19-sec-final-and-dec-prep.md / pm-j-r17-dec-067-finalize.md / pm-k-r18-dec-068-finalize.md
- **先行 commit**: 8742931（Round 19 完遂着地反映）
- **SOP 順守**: DEC-019-025（background dispatch、SOP 実証 17 件目）

---

## §0. サマリ

PM-M Round 20 第 1 波として独立稼働し、以下 2 件の deliverable を完遂:

1. **5/26 統合採択 agenda 作成**（`reports/pm-m-r20-dec-067-068-069-agenda-2026-05-26.md`）= DEC-019-067 / 068 / 069 の 3 件 formal 統合採択 session 運営 SOP（45 min ver / 60 min fallback / Owner 拘束推奨 0 分）
2. **DEC-019-070 DRAFT 起案**（`projects/PRJ-019/decisions.md` 末尾追記、append-only）= Round 20 9 並列構成 + 17 日 path W3 完成（5/29 W4 移行）+ measurable success criteria 7 件 + 採用根拠 8 件

両 deliverable を通じて以下を確証:
- Round 20 dispatch 構成は DEC-019-068 デフォルト昇格後の 1 round 目（連続 6 round 目）
- 5/26 統合採択は trigger 4 条件全 PASS 確証 → CEO 自走採決 + Owner 拘束 0 分推奨
- DEC-019-070 measurable 7 件 = harness 700+ / openclaw 394+ / W3 e2e 50+ / heartbeat 1M / INDEX-v9 90+ / 5/26 採択 / 6/19 launch dry-run

制約遵守: API $0 / 副作用 0 / 絵文字 0 / tests 影響 0 / 既存 DEC 改変 0（append-only 厳守）。

---

## §1. 5/26 採択 agenda（DEC-019-067 + 068 + 069 統合）

### 1.1 agenda 構成（8 セクション）

| § | 内容 | 行数想定 |
|---|---|---|
| §0 | 概要 | 約 10 行 |
| §1 | 採択 3 件 status | 約 35 行 |
| §2 | 5/26 当日 timeline（45-60 min） | 約 30 行 |
| §3 | 各 DEC の readiness 検証チェックリスト | 約 50 行 |
| §4 | 採択後の implementation roadmap | 約 30 行 |
| §5 | 否決時 fallback | 約 30 行 |
| §6 | Owner 拘束時間（推奨 0 分） | 約 15 行 |
| §7 + §8 | 制約遵守 + 関連 file | 約 15 行 |

合計約 215 行（要件: §0-§6 網羅）。

### 1.2 5/26 当日 timeline 標準形（45 min ver / 推奨）

| 時刻 | 区分 | 担当 | 所要 |
|---|---|---|---|
| 09:30:00 | session 開始 | CEO | 1 min |
| 09:31:00 | trigger 4 条件確認 | Review-L 想定 | 5 min |
| 09:36:00 | DEC-019-067 審議 | PM-J + Review-K | 8 min |
| 09:44:00 | DEC-019-068 審議 | PM-K + PM-L | 10 min |
| 09:54:00 | DEC-019-069 審議 | PM-L + PM-M | 10 min |
| 10:04:00 | 統合採決 | CEO 自走 | 5 min |
| 10:09:00 | 採択後 roadmap | CEO + PM-M | 5 min |
| 10:14:00 | 議事録確定 | Secretary | 1 min |

→ 45 min 完遂、Owner 拘束 0 分推奨。

### 1.3 trigger 4 条件 evidence trace（agenda §3.1）

| 条件 | 達成状況 | evidence |
|---|---|---|
| T-1 適合率 80%+ n=36 | **PASS（n=45 / 適合 100%）** | Round 15-19 全 5 round 完遂着地 commit hash |
| T-2 API $0 | **PASS（5 round 全 $0）** | agent dispatch log |
| T-3 tests baseline | **PASS（harness 674 + openclaw 394）** | vitest run log |
| T-4 Owner 拘束 0 分 | **PASS（5 round 全 0 分）** | Owner directive log + CEO 自走 dispatch evidence |

→ **4/4 全 PASS** 確証で 5/26 統合採択判定可能。

### 1.4 採択後 implementation roadmap

| Round | 期間 | 主要マイル |
|---|---|---|
| Round 20 | 5/5-5/12 | W3 完成 + heartbeat 1M + INDEX-v9 + 6/19 dry-run + DEC-070 起案 |
| Round 21 | 5/12-5/19 | W4 移行 + Sec 横展開 + ARCH-01 解消 + DEC-071/072/073 |
| Round 22 | 5/19-5/26 | W4 完遂 + 公開リハ dry-run + CARD A 7 sub-card |

---

## §2. DEC-019-070 DRAFT 起案

### 2.1 起案動機

Round 19 完遂着地（CEO 統合報告 v20）で 17 日 path W3 = 31 tests 確立 / heartbeat 500k 12/12 PASS / Sec hardening 4/4 完成 / DEC 3 件 readiness Y 揃い済の 4 軸が同時成立。Owner formal「Round 20 9 並列 GO 丁寧に」directive 想定 trigger（5/5 受領想定）+ Owner formal「最速で進めよ」directive 継続中 → Round 20 9 並列構成 + W3 完成 + 5/29 W4 移行を formal 議決事項として起案。

DEC-019-067 / 068 / 069 の連続継承議決として位置付け、5/26 統合採択 session 内で 4 件まとめ formal 化想定（067 + 068 + 069 + 070 = 計 4 件 status 遷移）。

### 2.2 採択 7 軸（DRAFT）

1. **Round 20 着地宣言 + 9 並列構成 SOP 連続 6 round 適用**: DEC-019-068 デフォルト昇格後の 1 round 目、第 1 波 4 / 第 2 波 5、累計 n=54 dispatch
2. **17 日 path W3 完成宣言**: 残 4 ctrl orchestrator 接続（P-UI-02 / P-UI-04 / P-UI-05 / HITL-10）+ e2e fully wired、harness 674 → 700+ PASS
3. **17 日 path 5/29 W4 移行宣言**: Round 21 想定（5/12-5/19）= W3 完成直後の事後継続、6/20 期限の 25 日前完遂目標
4. **heartbeat 1M load test 評価**: 500k → 1M 拡張、perf 656ms / memory 12-15MB 想定、CI runner 制限要確認
5. **INDEX-v9 起票 + Knowledge 蓄積 90+ entries**: 81 → 90+（patterns +5 / decisions +1 / pitfalls +3）
6. **DEC-019-067 + 068 + 069 5/26 formal 統合採択**: 3 件まとめ判定、CEO 自走採決
7. **6/19 launch dry-run rehearsal 完遂**: Marketing-M SOP 機械実行、log template 117 行記入

### 2.3 measurable success criteria（M-1〜M-7）

| # | 指標 | 達成判定基準 |
|---|---|---|
| M-1 | harness 700+ PASS | 残 4 ctrl orchestrator tests 30+ 追加で 674 → 700+ |
| M-2 | openclaw-runtime 394+ PASS 維持 | regress 0 |
| M-3 | W3 e2e tests 50+ 確立 | 31（既存 Dev-AA 12 + Dev-BB 19）+ 残 4 ctrl 19+ + e2e wired = 50+ |
| M-4 | heartbeat 1M load test 評価完了 | 1M PASS / 750k 中間 / 評価着手 |
| M-5 | INDEX-v9 90+ entries | 81 → 90+ |
| M-6 | 5/26 統合採択 067 + 068 + 069 全採択 | 3 件全 confirmed |
| M-7 | 6/19 launch dry-run 機械実行 rehearsal 完遂 | T-24h / T-2h / T-0 / T+1h / T+24h 全 step 機械実行 |

### 2.4 採用根拠 8 件

1. Owner formal「Round 20 9 並列 GO 丁寧に」directive 想定 trigger + 「最速で進めよ」directive 継続
2. Round 19 完遂着地で harness 631→674 PASS / openclaw 394 維持 / W3 = 31 tests 確立 / heartbeat 500k 12/12 PASS
3. stagger 圧縮 SOP 連続 5 round 達成 = DEC-019-068 デフォルト昇格 trigger 4/4 全 PASS
4. DEC-019-068 デフォルト昇格 trigger 4/4 全 PASS = Round 20 9 並列構成は formal 議決事項
5. 17 日 path W3 31 tests 確立済 = 残 4 ctrl orchestrator 接続のみ = 1 round 内消化可能
6. heartbeat 500k 12/12 PASS 確証 = 1M 件評価への自然継続、新規 3 観点（jitter / thundering herd / tail latency p99）拡張 ready
7. Sec hardening 4/4 完成 = Round 20 で Sec runsheet 4 SOP デフォルト適用、追加実装不要
8. INDEX-v8 81 entries 物理化済 = v9 90+ entries への自然継続、playbooks 物理 dir 確立済

### 2.5 fix forward-only 確認

- 既存 DEC-019-001〜069: **無改変**（削除 / 改変 0 件）
- 本 PM-M 作業: decisions.md 末尾追記のみ（DEC-019-070 セクション約 100 行）+ reports/ 新規 2 ファイル
- DRAFT 維持: Round 20 進行中 status DRAFT 固定、5/26 統合採択 session 内 formal 化時に confirmed / rejected / revised へ遷移

---

## §3. trigger 条件達成状況（5/26 統合採択前提条件）

### 3.1 DEC-019-068 デフォルト昇格 trigger 4 条件

| 条件 | n | 達成 | evidence |
|---|---|---|---|
| T-1 適合率 80%+ | n=45（5 round × 9 並列） | **PASS（適合 100%）** | Round 15-19 全 dispatch agent 完遂着地 |
| T-2 API 追加コスト累計 $0 | 5 round | **PASS（$0）** | agent dispatch log 累計 |
| T-3 tests 791 baseline | harness 674 + openclaw 394 + workspace | **PASS（baseline 拡大）** | vitest run log |
| T-4 Owner 拘束 0 分 | 5 round | **PASS（0 分）** | Owner directive log |

### 3.2 DEC-019-067 readiness 条件

| 条件 | 達成 | evidence |
|---|---|---|
| 条件 A: BASE_REF 明示指定 | **解消** | Sec-N で 3-tier fallback 実装（HEAD~1 / origin/main / $BASE_REF env） |
| 条件 B: Sec-M 4/4 review 完遂 | **解消** | Round 19 Review-K 実 PASS（API spike 検知 / 副作用 0 / SEC_OVERRIDE audit / tests gate） |

### 3.3 DEC-019-069 readiness（measurable 7 件確定値）

- M-1 (T+50 内 dispatch): 達成
- M-2 (API $0): 達成
- M-3 (tests baseline ± 0): 達成（拡大）
- M-4 (SOP 適合率 80%+ n=45): 達成（100%）
- M-5 (W3 進行 R19 IPC + R20 invariants): 部分達成（R19 = 31 tests 確立、R20 残 4 ctrl 接続予定）
- M-6 (orchestrator 5 要素実装): **5/5**（OrchestratorAdapter / RuntimeBridge / NDJSON / invariants 28 件 / Sec 4/4）
- M-7 (Phase 1 W4 完遂期限余裕): 維持（32-39 日）

### 3.4 5/26 統合採択判定可能性

3 件 readiness Y + trigger 4/4 全 PASS + measurable 7 件 6/7 達成（M-5 部分達成）→ **5/26 統合採択判定可能**確証。

---

## §4. Round 21 引継 5 項目（想定）

### 4.1 Round 21 5 項目

1. **17 日 path W4 移行 + 5/29 完遂目標着手**: Round 20 W3 完成直後の事後継続、e2e validation suite + 公開リハ machine-executable SOP dry-run 完遂 + ARCH-01（DEC-019-041 Phase B / workspace alias 課題）解消検討
2. **DEC-019-071 / 072 / 073 起案**: 071 = SOP 改訂条件 trigger 設定 / 072 = SOP confirmed 昇格議決（5/26 で 068 confirmed 切替時は吸収）/ 073 = W3→W4 移行宣言（本 DEC-070 ② / ③ フォローアップ）
3. **heartbeat 1M load test 結果 evidence + ContinuousRunDetector 拡張**: Round 20 で 1M 評価着手 → Round 21 で評価完遂 + ContinuousRunDetector 拡張議決（DEC-019-074 想定）
4. **INDEX-v10 起票 + 100+ entries**: 90+ → 100+（Round 20 由来 patterns / decisions / pitfalls / playbooks 反映）
5. **6/12 D-7 公開前運用設定 7 sub-card 着手準備**: CARD A（80 min）= Vercel Env / DNS / Sentry / Supabase 設定の Web-Ops-G action card 整備

### 4.2 引継 trajectory

| Round | 引継項目数 | 主要マイル |
|---|---|---|
| Round 19 → 20 | 6 項目 | INDEX-v9 / W3 完成 / 5/26 採択準備 / heartbeat 1M / launch dry-run / OG image 実体生成 |
| Round 20 → 21 | 5 項目（本書） | W4 移行 / DEC-071-073 / heartbeat 1M 完遂 / INDEX-v10 / CARD A 着手準備 |
| Round 21 → 22 | 4 項目（想定） | W4 完遂 / 公開リハ dry-run / CARD A 7 sub-card / Phase 1 W4 完遂 6/20 期限 |

---

## §5. リスク・懸念

### 5.1 リスク 4 件

- **R1（中）**: Round 20 完遂時 SOP 連続 6 round 累計適合率 80%+ 維持失敗 → DEC-019-070 M-1〜M-7 部分達成 → 5/26 統合採択時に DEC-070 status: revised（measurable 暫定値 update のみ）で吸収
- **R2（中）**: heartbeat 1M load test memory 上限超過（CI runner 制限 12-15MB） → M-4 部分達成 = 750k 中間段階で代替 evidence、CI runner memory 上限緩和議決を Round 21 で起案
- **R3（中）**: 17 日 path W3 残 4 ctrl orchestrator 接続実装で tests regress（harness 674 → < 674） → DEC-070 M-1 未達 → in-memory mock fallback で W3 完成を Round 21 まで延長（DEC-019-069 ③ 失敗時 fallback 条項適用継承）
- **R4（低）**: 5/26 統合採択 session で 3 件中 1 件以上が rejected / revised → Round 20 完遂着地直前に判明した場合 v21 報告で fallback roadmap 開示（agenda §5 否決時 fallback 参照）

### 5.2 懸念 3 件

- **C1**: Owner formal「丁寧に」directive 順守度 = trigger 条件・readiness 検証を網羅したが、5/26 当日 CEO 自走採決の運営練度に依存。fallback として 60 min 拡張形 timeline 用意済（agenda §2.2）
- **C2**: ARCH-01（DEC-019-041 Phase B）= workspace alias 課題 Round 19 Dev-BB 報告で記録済、Round 20 / 21 で本格解消検討。Round 20 W3 完成は relative imports 経由で達成可能（Dev-BB 既証）
- **C3**: DEC-019-070 measurable M-7（6/19 launch dry-run 機械実行 rehearsal 完遂）の所要時間がもっとも大きい。Round 20 第 2 波で Marketing 部門にアサイン想定、SOP 198 行 + log template 117 行を base に T-24h 〜 T+24h の 5 段階機械実行を完遂

### 5.3 観察項目 3 件

- 5/26 統合採択 session の Owner 拘束実績（推奨 0 分 vs 任意 1 分 vs fallback 5-15 分）の事後測定
- Round 20 完遂時の連続 SOP 6 round 適合率（n=54 累計、目標 80%+）
- Phase 1 W4 完遂期限（6/20）までの逆算余裕（Round 20 完遂時 32 → 25 日想定、Round 21 完遂時 25 → 18 日想定）

---

## §6. 制約遵守

- API 消費: $0（PM-M は Read + Edit + Write のみ、外部 API call 0）
- 副作用: 0（decisions.md 末尾追記 + reports/ 新規 2 ファイルのみ、既存 DEC-019-001〜069 改変 0）
- 絵文字: 0
- tests 影響: 0（baseline harness 674 + openclaw-runtime 394 維持）
- 起案行数: agenda 約 215 行 + DEC-019-070 約 100 行 + 本報告書 約 200 行（130 行+ 要件達成）
- fix forward-only 厳守: 既存 DEC 削除 0 / 改変 0、本 PM-M 作業範囲は decisions.md 末尾追記 + reports/ 新規 2 ファイルの 3 ファイル touch のみ
- DRAFT 維持: DEC-019-070 = status DRAFT 明記、5/26 統合採択 session 内 formal 化時に遷移
- SOP 順守: DEC-019-025（background dispatch）= SOP 実証 17 件目

---

## §7. 関連 file

- **created**: `projects/PRJ-019/reports/pm-m-r20-dec-067-068-069-agenda-2026-05-26.md`（5/26 統合採択 agenda、約 215 行）
- **created**: `projects/PRJ-019/reports/pm-m-r20-dec-070-and-agenda.md`（本報告書、約 200 行）
- **modified**: `projects/PRJ-019/decisions.md`（末尾追記のみ、DEC-019-070 セクション約 100 行）
- **無改変確認**: 既存 DEC-019-001〜069 すべて、PRJ-019 既存 production file すべて

---

## §8. 次アクション

- 5/12 想定 Round 20 完遂着地時点: PM-N 等が DEC-019-070 measurable M-1〜M-7 暫定値 update（CEO 統合報告 v21）
- 5/26 09:30-10:30 JST: 5/26 統合採択 session 開催 → DEC-019-067 / 068 / 069 / 070 の 4 件まとめ formal 化
- 5/26 採択後: CEO 統合報告 v21 で formal 採択結果開示、Owner 任意 1 言「採択承認」想定
- 5/27 想定 Round 21 第 1 波 dispatch: PM-N 等が引継 5 項目（§4.1）で着手

---

**起案者**: PM-M / **起案日**: 2026-05-05 / **次回更新**: Round 20 完遂着地時（PM-N 担当）+ 5/26 統合採択 session 後 + Round 21 起案時
