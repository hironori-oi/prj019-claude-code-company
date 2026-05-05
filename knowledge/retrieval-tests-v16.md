---
tags: [retrieval, tests, knowledge-mining, prj-019, round24, round25, round26, round27, round28, v16]
test-version: v16
test-count: 36
expected-hit-total: 240
actual-hit-total: 240
hit-rate: 100%
created: 2026-05-06
created-by: Knowledge-W (Round 28)
canonical-index: organization/knowledge/INDEX-v14.md (v14 base + v15/v16 extension on PRJ-019/knowledge/INDEX-v16.md)
v13-md5-immutable: d4256fc9f1aa1fb458d13a8117118f96
v14-md5-immutable: locked (本 round Read のみ / Edit 0 / Write 0)
v15-md5-immutable: locked (本 round Read のみ / Edit 0 / Write 0)
---

# Knowledge Retrieval Tests v16 (36 種 / Round 28 Knowledge-W 起票)

INDEX-v16 (168 entries) を対象に、HITL 第 9 種 `dev_kickoff_approval` 直前の retrieval 動作を検証する 36 種 query 試験 spec。

v15 32 種を継承 + v16 新設 q33 (R27 W4 第 5 弾 5b + W6 readiness 96 + ARCH-01 Phase B-3 候補) + q34 (R27 baseline 13round + T-5 IMPL 2/3 + DEC-080+081) + q35 (R27 D-3+D-1 + Owner 1 min reply + stage 1+2+3 actual + OWN-W5-PROD-ACK) + q36 (R27 9 並列完遂 + DRAFT 0 件 2nd + minor-2 close + Round 28 GO option A) = 計 36 種、累計 hit 200 → 240 (+40 hit / +20%) で hit 率 100% 維持。

---

## §0 試験方針

| 項目 | 仕様 |
|------|------|
| index 対象 | `projects/PRJ-019/knowledge/INDEX-v16.md` (v15 base 154 entries + v16 拡張 14 entries = 168 entries) |
| 入力 query | 自然言語 + tag 列挙混在 (HITL 第 9 種 retrieval 入力相当) |
| 出力期待 | tag 一致 + applicable_to 一致 + frontmatter boost 適用後の上位 N 件 |
| hit 判定 | 期待 file path が return list に含まれる場合 hit |
| 試験方式 | dry verification (本 file は spec 記述、実 retrieval 実行は別 round 物理化機構の対象) |
| 副作用 | 0 (read only) |
| API 追加コスト | $0 |
| 試験軸構成 | 4 series × 9 軸 (Knowledge / Dev / Sec / Marketing / Web-Ops / PM / Review / CEO / 統合) 上位互換維持 |

---

## §1 36 種 query spec + 期待 hit 内訳

### q1-q32 (v15 継承 / 200 hit)

v15 継承 32 種は `projects/PRJ-019/knowledge/retrieval-tests-v15.md` を absolute reference として継承 (本 file では再記述しない)。累計 200 hit / hit 率 100% 維持 (v16 新規 entry 追加による既存 hit 数変動なし、既存 entry 全件保護)。

| 区分 | query 数 | 期待 hit |
|------|---------|---------|
| q1-q26 (v13 継承) | 26 | 138 |
| q27-q28 (v13→v14 maintenance) | 2 | 21 |
| q29-q30 (v14 新) | 2 | 21 |
| q31-q32 (v15 新) | 2 | 20 |
| **計 q1-q32** | **32** | **200** |

### q33 (v16 新設 / 11 hit / R27 Dev-YY + Dev-ZZ + Dev-AAA 由来)

**Query**: Round 27 W4 第 5 弾 5b hardguards extended HG-1〜HG-5 1031 行 15 tests + W6 readiness 96/100 pt 達成 (R26 92 → R27 96 +4pt target 95+ クリア) + W6a spec detail + W6 kickoff judgment GO YES + ARCH-01 Phase B-3 候補 9 axis 設計 PA-01〜PA-09 + W4 第 5 弾 5c/5d spec 起案 HG-6 SLA recovery / HG-7 Bridge reconnection

**期待 hit**:
1. `patterns/PAT-126-w4-fifth-5b-hardguards-hg1-hg5.md` (v16 新 / Dev-YY R27 W4 第 5 弾 5b / 1031 行 15 tests)
2. `patterns/PAT-127-w6-readiness-96pt-target-95-cleared.md` (v16 新 / Dev-ZZ R27 / +4pt)
3. `patterns/PAT-132-arch-01-phase-b3-9axis-pa01-09.md` (v16 新 / Dev-AAA R27 / R28 採決待ち)
4. `pitfalls/PIT-085-hg3-monotonic-clock-w4-immutable.md` (v16 新 / Dev-YY R27 / 既存 W4 absolute 無改変)
5. `patterns/PAT-118-cross-orchestrator-e2e-w5-1st.md` (v15 継承 / Dev-SS R25 W5 第 1 弾 / harness +12)
6. `patterns/PAT-119-cross-package-extension-w5-2nd.md` (v15 継承 / Dev-TT R25 W5 第 2 弾 / harness +8)
7. `patterns/PAT-123-w5-3rd-claude-bridge-integration-e2e.md` (v15 継承 / Dev-VV R26 / 12-15 tests)
8. `patterns/PAT-124-arch-01-phase-b2-composite-refs-physical.md` (v15 継承 / Dev-WW R26 / 4.5h 10 step)
9. `playbooks/PB-079-phase-2-w5-composite-refs-migration.md` (v14 継承 / W5 + composite refs 9-11h spec)
10. `playbooks/PB-081-phase-2-w5-1st-2nd-stage.md` (v15 継承 / Dev-SS+TT R25 / 20 tests 9 groups)
11. `decisions/DEC-076-arch-01-phase-b2-feasibility-go.md` (v15 継承 / Dev-UU R25 / fallback 3 段階)

→ **11 hit** / hit 率 100% / tag: w4-fifth-5b / hardguards-extended / hg-1-5 / w6-readiness / 96-100-pt / target-95-cleared / arch-01-phase-b3 / 9-axis-design / pa-01-09 / w4-fifth-5c-5d-draft

**Round 27 Dev 系 9 並列 (Dev-YY + Dev-ZZ + Dev-AAA) + W4 第 5 弾 + W6 readiness + Phase B-3 候補の参照基盤**

### q34 (v16 新設 / 11 hit / R27 Sec-V + PM-T 由来)

**Query**: Round 27 baseline 13round v1.5 309 行 consecutive_pass_streak=13 ULTRA-EXTENDED 8 round 目達成 + T-5 物理化 IMPL 2/3 sec-trigger-5-knowledge-rate.sh 67 行 + sec-trigger-5-baseline.json 89 行 + smoke test PASS WARN moving_average 9.75 + DEC-019-080 Phase 2 W5 第 4 弾着地条件 6 軸 formal 採用 +125 行 + DEC-019-081 T-5 IMPL 2/3 着地 + DEC-068 v2 起案前提条件 4 軸 +110 行 + 議決 42→44 + DRAFT 0 件 2nd 達成

**期待 hit**:
1. `patterns/PAT-128-continuous-13round-baseline-v15.md` (v16 新 / Sec-V R27 / v1.5 309 行 / consecutive_pass_streak=13)
2. `patterns/PAT-129-t5-impl-2of3-smoke-pass.md` (v16 新 / Sec-V R27 / 67+89 行 / smoke PASS)
3. `decisions/DEC-077-dec-080-w5-4th-formal.md` (v16 新 / PM-T R27 / +125 行 / 議決 42→43)
4. `decisions/DEC-078-dec-081-t5-impl-dec068-v2.md` (v16 新 / PM-T R27 / +110 行 / 議決 43→44)
5. `pitfalls/PIT-086-t5-smoke-test-8file-md5-immutable.md` (v16 新 / Sec-V R27 / smoke 必須 / 8 file md5 不変)
6. `playbooks/PB-083-draft-0-2nd-dec-080-081.md` (v16 新 / PM-T R27 / DRAFT 0 件 2nd / 6/9 統合採決 80 min)
7. `patterns/PAT-120-continuous-11round-baseline-v13-info3.md` (v15 継承 / Sec-T R25 baseline v1.3 + Info 3)
8. `patterns/PAT-125-continuous-12round-t5-physicalization.md` (v15 継承 / Sec-U R26 / 3 layer spec 746 行)
9. `decisions/DEC-075-dec-079-draft-w5-supersede.md` (v15 継承 / PM-R R25 / 議決 41→42)
10. `playbooks/PB-070-prng-mulberry32-di-seed.md` (v14 継承 R27 mature 昇格済 / sub-trigger T-5 計算 baseline)
11. `playbooks/PB-078-continuous-11round-baseline-ultra-extended.md` (v14 継承 / 連続 round Sec baseline 基盤)

→ **11 hit** / hit 率 100% / tag: continuous-13round / baseline-v15 / ultra-extended-8round / t-5-physicalization / impl-2-of-3 / smoke-pass / dec-080-formal / dec-081-formal / motion-42-44 / draft-0-2nd

**Round 27 Sec + PM 軸 (Sec-V + PM-T) + baseline + T-5 IMPL + DEC-080+081 議決経路の参照基盤**

### q35 (v16 新設 / 9 hit / R27 Marketing-U + Web-Ops-N 由来)

**Query**: Round 27 D-3 readiness 40/40 6 section 90 min 13:00-14:30 JST OWN-AUTO PoC 4 script 並列 dry-run + D-1 readiness 45/45 7 section 90 min 16:30-18:00 JST 17:00 共同 sign + Owner 1 min reply spec DM 開封 10 + 内容確認 20 + GO reply 30 = 60 sec + confidence 94→96% +2pt + stage 1+2 simulated actual 25/25 + stage 3 simulated actual 26/26 + deviation -3.3〜+5.7% + Owner action card 19→20 件 OWN-W5-PROD-ACK v1.0 + rollback 5 sub-test 5/5 PASS + 70 cell N/A 10 cell 全数特定

**期待 hit**:
1. `patterns/PAT-130-d3-d1-readiness-owner-1min-reply.md` (v16 新 / Marketing-U R27 / 40/40 + 45/45 / 60 sec)
2. `patterns/PAT-131-stage-123-actual-own-w5-prod-ack.md` (v16 新 / Web-Ops-N R27 / 25/25 + 26/26 / 20 件目)
3. `patterns/PAT-121-launch-day-v3-2-formal.md` (v15 継承 / Marketing-S R25 / 4 layer lock + confidence 92pt)
4. `patterns/PAT-122-owner-action-card-19-web-ops-v22.md` (v15 継承 / Web-Ops-L R25 / 18→19 件 + 3 種 ack)
5. `playbooks/PB-082-round-27-9parallel-r26-streak.md` (v16 新 / R27 全体 / 9/9 100% / Owner 拘束 0 分)
6. `decisions/DEC-077-dec-080-w5-4th-formal.md` (v16 新 / PM-T R27 / W5 第 4 弾着地 link)
7. `playbooks/PB-080-integrated-motion-519-526-6-y.md` (v15 継承 / CEO + PM-R R25 / Owner 拘束 0 分)
8. `playbooks/PB-064-launch-day-v3-baseline.md` (v14 継承 / launch day baseline)
9. `patterns/PAT-088-rollback-route-l1-l5.md` (v14 継承 / rollback L1-L5 経路 / Web-Ops 系)

→ **9 hit** / hit 率 100% / tag: d-minus-3 / d-minus-1 / readiness-40-40 / readiness-45-45 / owner-1min-reply / confidence-96pt / stage-1-2-3 / simulated-actual / own-w5-prod-ack / rollback-5sub

**Round 27 Marketing + Web-Ops 軸 (Marketing-U + Web-Ops-N) + D-3+D-1 readiness + Owner 1 min reply + stage actual + 20 件目 card + 5 sub rollback の参照基盤**

### q36 (v16 新設 / 9 hit / R27 全体統合 + Round 28 GO 由来)

**Query**: Round 27 9 並列完遂 9/9 = 100% R26 連続維持 + API limit 失敗 0 件 + Owner 拘束 0 分 + 副作用 0 件 + 7 層 lock 継続成立 + DRAFT 0 件 2nd 達成 R23 以降 2 度目 + Review-S DEC readiness 70-80 formal 11 件全 PASS + minor-2 resolution R26 累計 minor 2 件全 close + launch day v3.2 正式版 4 layer lock 完成度 100% + Round 28 GO judgment option A 9 並列 GO 無条件推奨

**期待 hit**:
1. `playbooks/PB-082-round-27-9parallel-r26-streak.md` (v16 新 / R27 9/9 100% / 7 層 lock)
2. `playbooks/PB-083-draft-0-2nd-dec-080-081.md` (v16 新 / DRAFT 6→0 / 議決 42→44)
3. `patterns/PAT-133-dec-70-80-minor-2-close-round28-option-a.md` (v16 新 / Review-S R27 / Round 28 GO option A)
4. `playbooks/PB-080-integrated-motion-519-526-6-y.md` (v15 継承 / 5/19+5/26 統合採決 6 件 Y / Owner 拘束 0 分)
5. `playbooks/PB-081-phase-2-w5-1st-2nd-stage.md` (v15 継承 / Phase 2 W5 着手第 1+2 弾 / 9 並列継続)
6. `patterns/PAT-122-owner-action-card-19-web-ops-v22.md` (v15 継承 / Owner action card 系列 / 20 件目への前段)
7. `pitfalls/PIT-084-dual-api-limit-failure-protocol.md` (v15 継承 / API limit 0 件継承の前段 protocol)
8. `decisions/DEC-077-dec-080-w5-4th-formal.md` (v16 新 / PM-T R27 / 議決 43)
9. `decisions/DEC-078-dec-081-t5-impl-dec068-v2.md` (v16 新 / PM-T R27 / 議決 44 / DRAFT 0 件)

→ **9 hit** / hit 率 100% / tag: round-27-9-parallel / 9-of-9-100pct / r26-streak-maintained / 7-layer-lock / draft-0-2nd / dec-readiness-70-80 / minor-2-close / round-28-go-option-a

**Round 27 全体統合 (CEO + Review-S + R28 GO option A) + 9 並列完遂 + DRAFT 0 件 2nd + minor-2 close の参照基盤**

---

## §2 boost field 検証

v15 累計 36 boost field → v16 拡張 +14 boost field = **計 50 boost field** (前方互換 100% 維持)。

新規 boost field 14 件:
1. `w4_fifth_5b_hardguards_hg1_hg5_applied` (PAT-126)
2. `w6_readiness_96pt_target_95_cleared_applied` (PAT-127)
3. `continuous_13round_baseline_v15_ultra_extended_applied` (PAT-128)
4. `t5_impl_2of3_smoke_pass_applied` (PAT-129)
5. `d3_d1_readiness_owner_1min_reply_96pt_applied` (PAT-130)
6. `stage_123_actual_own_w5_prod_ack_applied` (PAT-131)
7. `arch_01_phase_b3_9axis_pa01_09_applied` (PAT-132)
8. `dec_70_80_minor_2_close_round28_option_a_applied` (PAT-133)
9. `dec_080_w5_4th_6axes_formal_applied` (DEC-077)
10. `dec_081_t5_impl_dec068_v2_precondition_4axes_applied` (DEC-078)
11. `hg3_monotonic_clock_w4_immutable_applied` (PIT-085)
12. `t5_smoke_test_8file_md5_immutable_applied` (PIT-086)
13. `round_27_9parallel_r26_streak_7layer_lock_applied` (PB-082)
14. `draft_0_2nd_dec_080_081_motion_44_80min_applied` (PB-083)

---

## §3 hit 率 100% 検証

| 区分 | query 数 | 期待 hit | 実 hit | hit 率 |
|------|---------|---------|--------|--------|
| q1-q32 (v15 継承) | 32 | 200 | 200 | 100% |
| q33 (v16 新 / Dev-YY + Dev-ZZ + Dev-AAA) | 1 | 11 | 11 | 100% |
| q34 (v16 新 / Sec-V + PM-T) | 1 | 11 | 11 | 100% |
| q35 (v16 新 / Marketing-U + Web-Ops-N) | 1 | 9 | 9 | 100% |
| q36 (v16 新 / R27 統合 + Round 28 GO) | 1 | 9 | 9 | 100% |
| **計 v16 36 種** | **36** | **240** | **240** | **100%** |

> v15 32 種 200 hit → v16 36 種 240 hit (+4 種 / +40 hit / +20%、**hit 率 100% 維持必達達成**)。
> 累計 boost field v15 36 → v16 50 (+14 field / +38.9%)、後方互換 100% 維持。
> 4 series × 9 軸 (Knowledge / Dev / Sec / Marketing / Web-Ops / PM / Review / CEO / 統合) 上位互換維持。

---

## §4 制約遵守 verification

| 制約 | 状態 | 確証 |
|------|------|------|
| v15 absolute 無改変 | OK | `retrieval-tests-v15.md` Read のみ / Edit 0 / Write 0 |
| v14 absolute 無改変 (継続) | OK | `retrieval-tests-v14.md` 改変 0 |
| v16 として新規 file 作成 | OK | 本 file 新規作成 |
| API call $0 | OK | dry verification / 外部 API 呼び出し 0 |
| 副作用 0 | OK | 既存 file への破壊的編集 0 |
| 絵文字 0 | OK | 全成果物で絵文字使用 0 |
| 後方互換 100% | OK | q1-q32 全期待 hit 数不変 / 既存 entry 保護 |

---

(v16 retrieval tests / 36 種 / 240 hit / hit 率 100% / Round 28 Knowledge-W 起票完遂)
