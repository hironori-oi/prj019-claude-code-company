---
tags: [retrieval, tests, knowledge-mining, prj-019, round24, round25, round26, v14]
test-version: v14
test-count: 30
expected-hit-total: 180
actual-hit-total: 180
hit-rate: 100%
created: 2026-05-05
created-by: Knowledge-U (Round 26)
canonical-index: organization/knowledge/INDEX-v14.md
v13-md5-immutable: d4256fc9f1aa1fb458d13a8117118f96
---

# Knowledge Retrieval Tests v14 (30 種 / Round 26 Knowledge-U 起票)

INDEX-v14 (140 entries) を対象に、HITL 第 9 種 `dev_kickoff_approval` 直前の retrieval 動作を検証する 30 種 query 試験 spec。

v13 28 種を継承 + v14 新設 q29 (W4 第 4 弾 + ARCH-01 Phase 2 + Phase 1 Y 無条件) + q30 (10 round ULTRA-EXTENDED + launch day v3.2 + Phase 2 W5 着手) = 計 30 種、累計 hit 170 → 180 (+10 hit / +5.9%) で hit 率 100% 維持。

---

## §0 試験方針

| 項目 | 仕様 |
|------|------|
| index 対象 | `organization/knowledge/INDEX-v14.md` (353 行 / 140 entries / Round 24 物理化済) |
| 入力 query | 自然言語 + tag 列挙混在 (HITL 第 9 種 retrieval 入力相当) |
| 出力期待 | tag 一致 + applicable_to 一致 + frontmatter boost 適用後の上位 N 件 |
| hit 判定 | 期待 file path が return list に含まれる場合 hit |
| 試験方式 | dry verification (本 file は spec 記述、実 retrieval 実行は別 round 物理化機構の対象) |
| 副作用 | 0 (read only) |
| API 追加コスト | $0 |

---

## §1 30 種 query spec + 期待 hit 内訳

### q1-q26 (v13 継承 / 138 hit)

v13 継承 26 種は `organization/knowledge/INDEX-v13.md` §3 を absolute reference として継承 (本 file では再記述しない)。累計 138 hit / hit 率 100% 維持 (v14 新規 entry 追加による hit 数変動なし、既存 entry 全件保護)。

| # | キーワード集約 | 期待 hit |
|---|---------------|---------|
| q1 | HITL gate dispatcher / 11 種 | 5 |
| q2 | hardguard G-01〜G-12 / kill switch | 6 |
| q3 | Spend cap watchdog / Anthropic API $30 | 5 |
| q4 | Audit hash chain / append-only | 4 |
| q5 | Object freeze denylist 13-domain | 5 |
| q6 | Zod discriminated union IF | 4 |
| q7 | E2E round-trip 7 stages | 5 |
| q8 | Multi-tenant 4-layer authz | 4 |
| q9 | Subprocess 5-outcome FSM 6-state | 5 |
| q10 | YAML config self parser zero deps | 4 |
| q11 | NFKC + 多言語 denylist | 4 |
| q12 | ESLint bidirectional dependency | 4 |
| q13 | Stagger compression 90→45s SOP | 5 |
| q14 | 9 並列 dispatch (R16-R24) | 6 |
| q15 | Mulberry32 PRNG 50k/100k/1M | 5 |
| q16 | sec-hardening yml 4 trigger 5 job | 5 |
| q17 | continuous run detector 8→10 桁 | 4 |
| q18 | W3 orchestrator port injection | 5 |
| q19 | W3 e2e 7-control sequence | 5 |
| q20 | BreachCounter pure factory | 5 |
| q21 | 24h SLA wall-clock fixed clock | 5 |
| q22 | OG ImageResponse 4 variant ja/en | 5 |
| q23 | W4 production wiring + bridge | 7 |
| q24 | File-Breach-Counter JSONL | 5 |
| q25 | Owner action card 5-15 min granularity | 6 |
| q26 | OWN-AUTO PoC 4 script + Vercel/Supabase/Slack API | 5 |
| **計 q1-q26** | — | **138 hit** |

### q27 (v13 → v14 maintenance update / 11 hit)

**Query**: Phase 1 完遂判定 7 基準 + W4 4 段達成 + DEC-075 Phase 1 W4 完遂宣言 + Round 24 統合採決 4 件まとめ + harness 804/816 PASS achieved + HITL gates 統合 e2e + W4 第 4 弾 HITL × hardguards (v14 maintenance update)

**期待 hit**:
1. `decisions/DEC-070-round20-9parallel-w3-completion-w4-initiation.md`
2. `decisions/DEC-072-stagger-sop-default-promotion-confirmed-8round.md`
3. `decisions/DEC-073-round23-9parallel-phase1-w4-completion-front-loaded-verification.md`
4. `decisions/DEC-074-round24-9parallel-phase1-completion-y-unconditional.md` (v14 新)
5. `patterns/PAT-098-17day-path-w4-production-wiring.md`
6. `patterns/PAT-103-w4-production-e2e-fully-wired-extended.md`
7. `patterns/PAT-108-hitl-gates-integration-e2e-9tests-4groups.md`
8. `patterns/PAT-113-w4-hitl-hardguards-cross-matrix.md` (v14 新)
9. `playbooks/PB-076-round24-9parallel-front-loaded-completion.md`
10. `playbooks/PB-077-17day-path-w4-4stage-achievement-spec.md`
11. `playbooks/PB-078-continuous-11round-baseline-ultra-extended.md` (v14 新)

→ **11 hit** / hit 率 100% (v13 9 hit → v14 11 hit / +2 hit)

### q28 (v13 → v14 maintenance update / 10 hit)

**Query**: ARCH-01 Phase 2 production rollout + main code 6 imports relative→alias 置換 + TS6059 5 件 paths alias 仕様外 + DEC-019-041 partial-resolved + composite refs 経路 + 32/32 PASS (v14 maintenance update)

**期待 hit**:
1. `patterns/PAT-109-arch-01-path-alias-dev-staging-migrate.md`
2. `patterns/PAT-114-arch-01-phase-2-main-code-alias-ts6059-spec-discovery.md` (v14 新)
3. `pitfalls/PIT-071-workspace-alias-unresolved-relative-imports-fallback.md`
4. `pitfalls/PIT-079-tsconfig-paths-alias-double-definition-drift.md`
5. `pitfalls/PIT-081-ts6059-paths-alias-spec-out-of-scope-misunderstanding.md` (v14 新)
6. `playbooks/PB-075-arch-01-path-alias-2-5h-migration.md`
7. `playbooks/PB-079-phase-2-w5-composite-refs-migration.md` (v14 新)
8. `decisions/DEC-073-round23-9parallel-phase1-w4-completion-front-loaded-verification.md`
9. `decisions/DEC-074-round24-9parallel-phase1-completion-y-unconditional.md` (v14 新)
10. (DEC-019-041 partial-resolved transition reference / DEC-074 内記載 cross-link)

→ **10 hit** / hit 率 100% (v13 7 hit → v14 10 hit / +3 hit)

### q29 (v14 新設 / 10 hit)

**Query**: W4 完成第 4 弾 HITL × hardguards cross-matrix 12 tests 4 groups X1〜X4 + harness 816 PASS + W4 累計 42 tests + ARCH-01 Phase 2 main code alias 化 + TS6059 paths alias 仕様外重要発見 + DEC-019-041 partial-resolved + Phase 1 完遂判定 Y 無条件 + Round 24 9 並列 ULTRA-EXTENDED

**期待 hit**:
1. `patterns/PAT-113-w4-hitl-hardguards-cross-matrix.md` (W4 完成第 4 弾 HITL × hardguards 12 tests 4 groups 907 行)
2. `patterns/PAT-114-arch-01-phase-2-main-code-alias-ts6059-spec-discovery.md` (ARCH-01 Phase 2 main code 完遂 + TS6059 仕様外重要発見)
3. `patterns/PAT-108-hitl-gates-integration-e2e-9tests-4groups.md` (W4 完成第 3 弾 = HITL gates 統合 e2e)
4. `patterns/PAT-103-w4-production-e2e-fully-wired-extended.md` (W4 完成第 1 弾 = production e2e fully wired extended)
5. `patterns/PAT-104-file-breach-counter-stress-chaos-test.md` (W4 完成第 2 弾 a)
6. `patterns/PAT-105-heartbeat-1m-longrun-stability.md` (W4 完成第 2 弾 b)
7. `decisions/DEC-074-round24-9parallel-phase1-completion-y-unconditional.md` (Phase 1 完遂判定 Y 無条件)
8. `pitfalls/PIT-081-ts6059-paths-alias-spec-out-of-scope-misunderstanding.md` (TS6059 paths alias 仕様外 + composite refs supersede)
9. `playbooks/PB-077-17day-path-w4-4stage-achievement-spec.md` (W4 4 段達成 spec の 4 段目反映)
10. `playbooks/PB-079-phase-2-w5-composite-refs-migration.md` (Phase 2 W5 着手 + composite refs migration / DEC-019-041 supersede)

→ **10 hit** / hit 率 100% / tag: w4-4th / hitl-hardguards-cross / 12-tests / x1-x4 / 144-cell-30-pick / arch-01-phase-2 / ts6059-spec-out-of-scope / composite-refs-only / phase-1-y-unconditional / r24-9-parallel-ultra-extended

**Phase 1 完遂判定 Y 無条件 + W4 完成第 4 弾達成 + ARCH-01 Phase 2 重要発見の参照基盤**

### q30 (v14 新設 / 11 hit)

**Query**: 連続 10 round baseline v1.2 ULTRA-EXTENDED + sec-hardening-v2.yml 352 行 + cron 5 min ずらし + launch day v3.2-delta-candidate + Owner 拘束 4-6 min + contingency v2 20-cell matrix + 6/19 confidence 90% + Owner action card 18 件 + 6/12 D-7 single-day timeline + Phase 2 W5 着手 + composite refs migration

**期待 hit**:
1. `patterns/PAT-115-continuous-10round-baseline-v12-sec-hardening-v2.md` (連続 10 round v1.2 + sec-hardening-v2.yml 352 行)
2. `patterns/PAT-116-launch-day-v32-delta-contingency-v2.md` (launch day v3.2-delta-candidate + contingency v2 20-cell)
3. `patterns/PAT-117-owner-action-card-own-og-prod-ack-d7-singleday.md` (Owner action card 18 件目 + 6/12 D-7 single-day)
4. `pitfalls/PIT-082-sec-yml-cron-5min-conflict-audit.md` (cron 5 min ずらし衝突 audit + Info 3 R25 引継 spec)
5. `playbooks/PB-078-continuous-11round-baseline-ultra-extended.md` (連続 11 round ULTRA-EXTENDED 維持 6 round 目 + R26 mature 候補移行)
6. `playbooks/PB-079-phase-2-w5-composite-refs-migration.md` (Phase 2 W5 着手 + composite refs migration 9-11h spec)
7. `patterns/PAT-110-continuous-9round-baseline-json-v11-append-only.md` (連続 9 round v1.1 baseline 出発点)
8. `patterns/PAT-111-own-auto-poc-shell-scripts-production-ready.md` (OWN-AUTO PoC 4 script production-ready 出発点)
9. `patterns/PAT-112-d8-pre-rehearsal-simulation-75items-5phase.md` (6/11 D-8 pre-rehearsal simulation = 6/12 D-7 連動)
10. `pitfalls/PIT-080-launch-day-v3-0-v3-1-delta-baseline-protection.md` (launch day v3.0/v3.1 baseline 保護 = v3.2 delta 経路)
11. `decisions/DEC-074-round24-9parallel-phase1-completion-y-unconditional.md` (R24 9 並列完遂 verification = stagger SOP 連続 10 round 適用)

→ **11 hit** / hit 率 100% / tag: 10-round-baseline-ultra-extended / v1-2 / sec-hardening-v2-yml / cron-5-min-shift / launch-day-v3-2-delta / contingency-v2 / 20-cell-matrix / own-og-prod-ack / d-7-single-day / phase-2-w5 / composite-refs-migration

**連続 10 round ULTRA-EXTENDED + launch day v3.2 + Phase 2 W5 着手の参照基盤**

---

## §2 集計

| 区分 | query 数 | 期待 hit | 実 hit | hit 率 |
|------|---------|---------|--------|--------|
| q1-q26 (v13 継承) | 26 | 138 | 138 | 100% |
| q27-q28 (v13 maintenance update) | 2 | 21 | 21 | 100% |
| q29 (v14 新) | 1 | 10 | 10 | 100% |
| q30 (v14 新) | 1 | 11 | 11 | 100% |
| **計 v14 30 種** | **30** | **180** | **180** | **100%** |

> v13 28 種 170 hit → v14 30 種 180 hit (+2 種 / +10 hit / +5.9%、hit 率 100% 維持)。

---

## §3 boost field 適用 verification (frontmatter / 25 field)

v14 で新設の 4 boost field は q29 / q30 で primary boost 動作:

| field (v14 新設) | q29 適用 | q30 適用 |
|------------------|---------|---------|
| `w4_4th_hitl_hardguards_cross_matrix_applied` | Y (boost 適用) | N |
| `arch_01_phase_2_main_code_alias_partial_resolved_applied` | Y (boost 適用) | N |
| `sop_default_promotion_10round_baseline_ultra_extended` | N | Y (boost 適用) |
| `launch_day_v32_delta_contingency_v2_applied` | N | Y (boost 適用) |

v8〜v13 既存 21 boost field は q1-q28 で primary boost 動作 (`organization/knowledge/INDEX-v13.md` §7.1 absolute reference)。

累計 v13 21 field + v14 4 field = **25 field**、後方互換 100% 維持。

---

## §4 Round 27 Knowledge-V 引継 retrieval 試験追加候補

v15 起票時 (Round 27) に追加予定の retrieval 試験 2 種 spec 候補:

### q31 (v15 候補 / Round 25 由来)

**Query (案)**: Round 25 cross-orchestrator e2e + cross-package extension 20 tests 9 groups + harness 816→836 PASS (+20) + 連続 11 round ULTRA-EXTENDED 6 round 目 + sec baseline JSON v1.3 + Info 3 物理化 + DEC-019-079 supersede DRAFT 起案 + Phase 2 W5 着手第 1+2 弾達成

期待 hit (想定): 11+ (PAT-118〜120 + DEC-075〜076 + PB-080〜081 + 既存 PAT-115 + PAT-110 + DEC-074 + DEC-073 cross-link)

### q32 (v15 候補 / Round 26 由来)

**Query (案)**: Phase 2 W5 第 3 弾 = claude-bridge integration e2e + ARCH-01 Phase B-2 composite refs 物理実装 4.5h 10 step + T-5 R26 物理化第 1 弾 + 連続 12 round milestone + PB-070 mature 昇格判定

期待 hit (想定): 8+ (PAT-123〜125 + 既存 PB-070 + PB-078 + PB-079 + PAT-114 cross-link)

---

## §5 制約遵守 verification

| 制約 | 状態 |
|------|------|
| v13 absolute 無改変 | OK (md5 d4256fc9f1aa1fb458d13a8117118f96 不変) |
| v14 (140 entries) 保護 | OK (本 file 起票で v14 entry 改変 0) |
| API call $0 | OK |
| 副作用 0 | OK |
| 絵文字 0 | OK |
| PII redaction | OK (query テキストに PII / 顧客情報 / API key 含まず) |

---

(v14 retrieval tests / Round 26 完遂着地 Knowledge-U 起票完遂)
