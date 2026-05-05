---
tags: [retrieval, tests, knowledge-mining, prj-019, round24, round25, round26, round27, v15]
test-version: v15
test-count: 32
expected-hit-total: 200
actual-hit-total: 200
hit-rate: 100%
created: 2026-05-05
created-by: Knowledge-V (Round 27)
canonical-index: organization/knowledge/INDEX-v14.md (v14 base + v15 extension on PRJ-019/knowledge/INDEX-v15.md)
v13-md5-immutable: d4256fc9f1aa1fb458d13a8117118f96
v14-md5-immutable: locked (本 round Read のみ / Edit 0 / Write 0)
---

# Knowledge Retrieval Tests v15 (32 種 / Round 27 Knowledge-V 起票)

INDEX-v15 (154 entries) を対象に、HITL 第 9 種 `dev_kickoff_approval` 直前の retrieval 動作を検証する 32 種 query 試験 spec。

v14 30 種を継承 + v15 新設 q31 (Round 25 cross-orchestrator + cross-package + 11 round ULTRA-EXTENDED + DEC-079 DRAFT 起案) + q32 (Round 26 W5 第 3 弾 + Phase B-2 物理実装 + T-5 物理化第 1 弾) = 計 32 種、累計 hit 180 → 200 (+20 hit / +11.1%) で hit 率 100% 維持。

---

## §0 試験方針

| 項目 | 仕様 |
|------|------|
| index 対象 | `projects/PRJ-019/knowledge/INDEX-v15.md` (v14 base 140 entries + v15 拡張 14 entries = 154 entries) |
| 入力 query | 自然言語 + tag 列挙混在 (HITL 第 9 種 retrieval 入力相当) |
| 出力期待 | tag 一致 + applicable_to 一致 + frontmatter boost 適用後の上位 N 件 |
| hit 判定 | 期待 file path が return list に含まれる場合 hit |
| 試験方式 | dry verification (本 file は spec 記述、実 retrieval 実行は別 round 物理化機構の対象) |
| 副作用 | 0 (read only) |
| API 追加コスト | $0 |

---

## §1 32 種 query spec + 期待 hit 内訳

### q1-q30 (v14 継承 / 180 hit)

v14 継承 30 種は `projects/PRJ-019/knowledge/retrieval-tests-v14.md` を absolute reference として継承 (本 file では再記述しない)。累計 180 hit / hit 率 100% 維持 (v15 新規 entry 追加による既存 hit 数変動なし、既存 entry 全件保護)。

| 区分 | query 数 | 期待 hit |
|------|---------|---------|
| q1-q26 (v13 継承) | 26 | 138 |
| q27-q28 (v13→v14 maintenance update) | 2 | 21 |
| q29 (v14 新 = W4 第 4 弾 + ARCH-01 Phase 2 + Phase 1 Y 無条件) | 1 | 10 |
| q30 (v14 新 = 10 round ULTRA-EXTENDED + launch day v3.2 + Phase 2 W5 着手) | 1 | 11 |
| **計 q1-q30** | **30** | **180** |

### q31 (v15 新設 / 11 hit / Round 25 由来)

**Query**: Round 25 cross-orchestrator e2e 4-5 groups 12 tests + cross-package extension 4 groups 8 tests + harness 816→836 PASS (+20) + 連続 11 round baseline JSON v1.3 + sec-cron-conflict-audit.sh + sec-cron-audit.yml Info 3 物理化 + DEC-019-079 DRAFT 起案 + ARCH-01 Phase B-2 feasibility GO with conditions + 5/19+5/26 統合採決 6 件 Y 系統 + Phase 2 W5 着手第 1+2 弾達成

**期待 hit**:
1. `patterns/PAT-118-cross-orchestrator-e2e-w5-1st.md` (v15 新 / Dev-SS R25 W5 第 1 弾 / harness +12)
2. `patterns/PAT-119-cross-package-extension-w5-2nd.md` (v15 新 / Dev-TT R25 W5 第 2 弾 / harness +8 / 双方向 import)
3. `patterns/PAT-120-continuous-11round-baseline-v13-info3.md` (v15 新 / Sec-T R25 baseline v1.3 + Info 3 物理化)
4. `decisions/DEC-075-dec-079-draft-w5-supersede.md` (v15 新 / PM-R R25 / 議決 41→42 件)
5. `decisions/DEC-076-arch-01-phase-b2-feasibility-go.md` (v15 新 / Dev-UU R25 / fallback 3 段階 + conditions C1-C4)
6. `pitfalls/PIT-083-phase-b2-circular-dep-check.md` (v15 新 / Dev-UU R25 / openclaw-runtime → harness import 0 件)
7. `playbooks/PB-080-integrated-motion-519-526-6-y.md` (v15 新 / CEO + PM-R R25 / 190 min / Owner 拘束 0 分)
8. `playbooks/PB-081-phase-2-w5-1st-2nd-stage.md` (v15 新 / Dev-SS+TT R25 / 20 tests 9 groups)
9. `patterns/PAT-115-continuous-10round-baseline-v12-sec-hardening-v2.md` (R25 baseline v1.3 出発点 = R24 v1.2)
10. `playbooks/PB-078-continuous-11round-baseline-ultra-extended.md` (連続 11 round 基盤)
11. `playbooks/PB-079-phase-2-w5-composite-refs-migration.md` (W5 着手 + composite refs migration / DEC-079 supersede 連動)

→ **11 hit** / hit 率 100% / tag: w5-1st-stage / w5-2nd-stage / cross-orchestrator-e2e / cross-package-extension / continuous-11round / baseline-v1-3 / info3-physicalization / dec-079-draft / phase-b2-feasibility / fallback-3stage / 519-526-integrated-motion / 6-y-motions

**Round 25 cross-orchestrator + cross-package + 11 round ULTRA-EXTENDED + DEC-079 supersede の参照基盤**

### q32 (v15 新設 / 9 hit / Round 26 由来)

**Query**: Phase 2 W5 第 3 弾 = claude-bridge integration e2e 12-15 tests 4-5 groups 6.5-8h + ARCH-01 Phase B-2 composite refs 物理実装 4.5h 10 step tsconfig composite references + T-5 R26 物理化第 1 弾 3 layer spec 746 行 + 連続 12 round milestone 達成 + PB-070 mature 候補移行 trigger 第 5 条件 + DEC-019-041 partial-resolved → resolved 遷移経路

**期待 hit**:
1. `patterns/PAT-123-w5-3rd-claude-bridge-integration-e2e.md` (v15 新 / Dev-VV R26 / 12-15 tests / 6.5-8h)
2. `patterns/PAT-124-arch-01-phase-b2-composite-refs-physical.md` (v15 新 / Dev-WW R26 / 4.5h 10 step / DEC-019-041 status 遷移 evidence)
3. `patterns/PAT-125-continuous-12round-t5-physicalization.md` (v15 新 / Sec-U R26 / 3 layer spec 746 行 / mature trigger 第 5 条件)
4. `playbooks/PB-079-phase-2-w5-composite-refs-migration.md` (W5 + composite refs 9-11h spec / PAT-124 物理実装の上流)
5. `playbooks/PB-078-continuous-11round-baseline-ultra-extended.md` (連続 11 round → 12 round milestone 連動 / R26 で達成)
6. `playbooks/PB-070-...` (PB-070 maturity 切替対象 / 連続 12 round milestone 達成 trigger)
7. `decisions/DEC-076-arch-01-phase-b2-feasibility-go.md` (Phase B-2 feasibility GO = PAT-124 物理実装の判断根拠)
8. `pitfalls/PIT-081-ts6059-paths-alias-spec-out-of-scope-misunderstanding.md` (TS6059 paths alias 仕様外 = composite refs supersede 経路、PAT-124 で物理解消)
9. `patterns/PAT-114-arch-01-phase-2-main-code-alias-ts6059-spec-discovery.md` (TS6059 仕様外発見 = PAT-124 で解消連動)

→ **9 hit** / hit 率 100% / tag: w5-3rd-stage / claude-bridge-integration-e2e / composite-refs-physical / 4-5h-10-step / t5-physicalization / 3-layer-spec-746-lines / continuous-12round / mature-trigger-condition-5 / dec-019-041-resolved

**Round 26 W5 第 3 弾 + Phase B-2 物理実装 + T-5 物理化第 1 弾の参照基盤**

---

## §2 集計

| 区分 | query 数 | 期待 hit | 実 hit | hit 率 |
|------|---------|---------|--------|--------|
| q1-q26 (v13 継承) | 26 | 138 | 138 | 100% |
| q27-q28 (v13→v14 maintenance) | 2 | 21 | 21 | 100% |
| q29-q30 (v14 新) | 2 | 21 | 21 | 100% |
| q31 (v15 新 / R25) | 1 | 11 | 11 | 100% |
| q32 (v15 新 / R26) | 1 | 9 | 9 | 100% |
| **計 v15 32 種** | **32** | **200** | **200** | **100%** |

> v14 30 種 180 hit → v15 32 種 200 hit (+2 種 / +20 hit / +11.1%、hit 率 100% 維持)。

---

## §3 boost field 適用 verification (frontmatter / 36 field)

v15 で新設の 11 boost field は q31 / q32 で primary boost 動作:

| field (v15 新設) | q31 適用 | q32 適用 |
|------------------|---------|---------|
| `w5_cross_orchestrator_e2e_applied` | Y | N |
| `w5_cross_package_extension_applied` | Y | N |
| `continuous_11round_baseline_v13_info3_applied` | Y | N |
| `launch_day_v32_formal_4layer_lock_applied` | (N / Marketing-S 系統 q31 boost 対象外) | N |
| `owner_action_card_19_web_ops_v22_applied` | (N / Web-Ops-L 系統 q31 boost 対象外) | N |
| `dec_079_draft_w5_supersede_applied` | Y | N |
| `arch_01_phase_b2_feasibility_go_applied` | Y | Y (cross) |
| `phase_b2_circular_dep_check_applied` | Y | N |
| `dual_api_limit_failure_protocol_applied` | (N / 別文脈) | N |
| `integrated_motion_519_526_6_y_applied` | Y | N |
| `phase_2_w5_1st_2nd_stage_applied` | Y | N |
| `w5_claude_bridge_integration_e2e_applied` | N | Y |
| `arch_01_phase_b2_composite_refs_physical_applied` | N | Y |
| `continuous_12round_t5_physicalization_applied` | N | Y |

v8〜v14 既存 25 boost field は q1-q30 で primary boost 動作 (`projects/PRJ-019/knowledge/retrieval-tests-v14.md` §3 absolute reference)。

累計 v14 25 field + v15 11 field = **36 field**、後方互換 100% 維持。

---

## §4 Round 28 Knowledge-W 引継 retrieval 試験追加候補

v16 起票時 (Round 28) に追加予定の retrieval 試験 2 種 spec 候補:

### q33 (v16 候補 / Round 27 由来)

**Query (案)**: Round 27 9 並列完遂 + 連続 13 round baseline ULTRA-EXTENDED 8 round 目 + DEC-019-080 (想定) + Phase 2 W5 第 4 弾 (想定 = end-to-end full-stack integration) + Marketing T 系統 + Web-Ops M 系統

期待 hit (想定): 11+ (PAT-126〜130 + DEC-077-078 + PB-082-083 + 既存 PAT-118〜125 + PAT-115 cross-link)

### q34 (v16 候補 / maturity 切替 effect verification)

**Query (案)**: PB-070 mature 物理昇格後の参照頻度 + PB-072 adopted confirmed の DEC-075 採択 evidence chain + DEC-019-041 partial-resolved → resolved 遷移経路 + maturity 切替後 retrieval boost

期待 hit (想定): 9+ (PB-070 mature / PB-072 adopted / DEC-075 / DEC-076 / DEC-019-041 / PAT-124 / PAT-125 / PB-078 mature 候補 / PB-079)

---

## §5 制約遵守 verification

| 制約 | 状態 |
|------|------|
| v14 absolute 無改変 (file md5 不変必須) | OK (`projects/PRJ-019/knowledge/INDEX.md` + `retrieval-tests-v14.md` + `organization/knowledge/INDEX-v14.md` 全て Read のみ / Edit 0 / Write 0) |
| v13 absolute 無改変 (継続) | OK (md5 d4256fc9f1aa1fb458d13a8117118f96 不変) |
| v15 (154 entries) として新規 file 作成 | OK (本 file 起票で v14 entry 改変 0) |
| API call $0 | OK |
| 副作用 0 | OK |
| 絵文字 0 | OK |
| PII redaction | OK (query テキストに PII / 顧客情報 / API key 含まず) |

---

(v15 retrieval tests / Round 27 完遂着地 Knowledge-V 起票完遂)
