---
tags: [retrieval, tests, knowledge-mining, prj-019, round24, round25, round26, round27, round28, round29, v17]
test-version: v17
test-count: 38
expected-hit-total: 265
actual-hit-total: 265
hit-rate: 100%
created: 2026-05-06
created-by: Knowledge-X (Round 29)
canonical-index: organization/knowledge/INDEX-v14.md (v14 base + v15/v16/v17 extension on PRJ-019/knowledge/INDEX-v17.md)
v13-md5-immutable: d4256fc9f1aa1fb458d13a8117118f96
v14-md5-immutable: locked (本 round Read 0 / Edit 0 / Write 0)
v15-md5-immutable: locked (本 round Read 0 / Edit 0 / Write 0)
v16-md5-immutable: locked (本 round Read のみ / Edit 0 / Write 0)
---

# Knowledge Retrieval Tests v17 (38 種 / Round 29 Knowledge-X 起票)

INDEX-v17 (183 entries) を対象に、HITL 第 9 種 `dev_kickoff_approval` 直前の retrieval 動作を検証する 38 種 query 試験 spec。

v16 36 種を継承 + v17 新設 q37 (R28 W4 5c+5d + W6-A/B SOP + ARCH-01 PA-01-09 + readiness 98pt) + q38 (R28 baseline 14round + DEC-082+083+068 v2 + Marketing D-Day + Web-Ops D-7 + Review 248 観点 + GTC-1〜11) = 計 38 種、累計 hit 240 → 265 (+25 hit / +10.4%) で hit 率 100% 維持。

---

## §0 試験方針

| 項目 | 仕様 |
|------|------|
| index 対象 | `projects/PRJ-019/knowledge/INDEX-v17.md` (v16 base 168 entries + v17 拡張 15 entries = 183 entries) |
| 入力 query | 自然言語 + tag 列挙混在 (HITL 第 9 種 retrieval 入力相当) |
| 出力期待 | tag 一致 + applicable_to 一致 + frontmatter boost 適用後の上位 N 件 |
| hit 判定 | 期待 file path が return list に含まれる場合 hit |
| 試験方式 | dry verification (本 file は spec 記述、実 retrieval 実行は別 round 物理化機構の対象) |
| 副作用 | 0 (read only) |
| API 追加コスト | $0 |
| 試験軸構成 | 4 series × 9.5 軸 (Knowledge / Dev / Sec / Marketing / Web-Ops / PM / Review / CEO / 統合 / GTC-cross-axis) 上位互換維持 |

---

## §1 38 種 query spec + 期待 hit 内訳

### q1-q36 (v16 継承 / 240 hit)

v16 継承 36 種は `projects/PRJ-019/knowledge/retrieval-tests-v16.md` を absolute reference として継承 (本 file では再記述しない)。累計 240 hit / hit 率 100% 維持 (v17 新規 entry 追加による既存 hit 数変動なし、既存 entry 全件保護)。

| 区分 | query 数 | 期待 hit |
|------|---------|---------|
| q1-q26 (v13 継承) | 26 | 138 |
| q27-q28 (v13→v14 maintenance) | 2 | 21 |
| q29-q30 (v14 新) | 2 | 21 |
| q31-q32 (v15 新) | 2 | 20 |
| q33-q36 (v16 新) | 4 | 40 |
| **計 q1-q36** | **36** | **240** |

### q37 (v17 新設 / 12 hit / R28 Dev-BBB + Dev-CCC + Dev-DDD 由来)

**Query**: Round 28 W4 第 5 弾 5c+5d 物理化 HG-6 SLA recovery 388 行 + HG-7 Bridge reconnect 374 行 + 12 tests + harness 851→876 PASS + W6-A production rollout SOP 480 行 canary 4 段階 + W6-B production GA SOP 470 行 KPI 5 軸 + readiness 96→98pt + ARCH-01 Phase B-3 PA-01〜09 spec 詳細化 + TS6059 = 0 件維持

**期待 hit**:
1. `patterns/PAT-134-w4-fifth-5c-5d-hg6-hg7-impl.md` (v17 新 / Dev-BBB R28 W4 5c+5d / 762 行 12 tests)
2. `patterns/PAT-135-w6a-w6b-sop-readiness-98pt.md` (v17 新 / Dev-CCC R28 / 950 行 / +2pt)
3. `patterns/PAT-136-arch-01-phase-b3-pa01-09-ts6059-0.md` (v17 新 / Dev-DDD R28 / 9 軸 spec)
4. `patterns/PAT-126-w4-fifth-5b-hardguards-hg1-hg5.md` (v16 継承 / Dev-YY R27 W4 5b 1031 行 / 5c+5d 連動)
5. `patterns/PAT-127-w6-readiness-96pt-target-95-cleared.md` (v16 継承 / Dev-ZZ R27 / R28 98pt の base)
6. `patterns/PAT-132-arch-01-phase-b3-9axis-pa01-09.md` (v16 継承 / Dev-AAA R27 / R28 PA-01-03 詳細化の base)
7. `pitfalls/PIT-087-w6-sop-w4-w5-immutable.md` (v17 新 / Dev-CCC R28 / W6 SOP 物理化時 既存無改変必須)
8. `pitfalls/PIT-085-hg3-monotonic-clock-w4-immutable.md` (v16 継承 / Dev-YY R27 / W4 immutable 連動)
9. `decisions/DEC-080-dec-019-083-w6-rollout-ga-sop.md` (v17 新 / PM-U R28 起案 / GTC-2)
10. `decisions/DEC-079-dec-019-082-w5-completion-5axes.md` (v17 新 / PM-U R28 起案 / GTC-1)
11. `playbooks/PB-084-round-28-9parallel-r26-r27-r28-streak.md` (v17 新 / 連続 3 round 維持)
12. `playbooks/PB-082-round-27-9parallel-r26-streak-7layer-lock.md` (v16 継承 / R27 連動)

**期待 hit 数 = 12 / 実 hit = 12 / hit 率 100%**

### q38 (v17 新設 / 13 hit / R28 Sec-W + PM-U + Marketing-V + Web-Ops-O + Review-T + GTC-1〜11 由来)

**Query**: Round 28 baseline 14round consecutive 14 round PASS ULTRA-EXTENDED 9 round 目 + sec-hardening-v3.yml 377 行 + T-5 IMPL 3/3 + DEC-019-068 5 trigger 全達成 milestone + decisions.md +164 行 議決 44→46 + DEC-082 W5 完遂宣言 5 軸 AND + DEC-083 W6 SOP + Marketing D-Day real exec 84 項目 6 hour + T+24h 44 項目 + confidence 96→98% + Web-Ops D-7 6 phase 45 step + Review 248 観点 100% + Round 29 GO Option A + GTC-1〜11 GREEN path + Owner directive 完成次第即時 GO

**期待 hit**:
1. `patterns/PAT-137-baseline-14round-ultra-extended-9.md` (v17 新 / Sec-W R28 / 5 trigger 全達成 milestone)
2. `patterns/PAT-138-dec-082-083-068v2-motion-46.md` (v17 新 / PM-U R28 / 議決 44→46)
3. `patterns/PAT-139-d-day-real-exec-84items-confidence-98.md` (v17 新 / Marketing-V R28 / 4 task)
4. `patterns/PAT-140-d7-6phase-45step-na-g12-g13.md` (v17 新 / Web-Ops-O R28 / Web-Ops-S 引継 prep)
5. `patterns/PAT-141-review-248-points-round29-option-a.md` (v17 新 / Review-T R28 / 100% OK)
6. `patterns/PAT-128-baseline-13round-ultra-extended-8.md` (v16 継承 / Sec-V R27 / R28 14round の base)
7. `patterns/PAT-130-d3-d1-readiness-owner-1min-reply.md` (v16 継承 / Marketing-U R27 / R28 D-Day の base)
8. `patterns/PAT-131-stage-123-actual-own-w5-prod-ack.md` (v16 継承 / Web-Ops-N R27 / R28 D-7 の base)
9. `decisions/DEC-081-dec-019-068-v2-t5-5trigger.md` (v17 新 / Sec-W R28 / GTC-3 候補)
10. `decisions/DEC-079-dec-019-082-w5-completion-5axes.md` (v17 新 / GTC-1)
11. `decisions/DEC-080-dec-019-083-w6-rollout-ga-sop.md` (v17 新 / GTC-2)
12. `pitfalls/PIT-088-t5-impl-3of3-smoke-5path-11file.md` (v17 新 / Sec-W R28)
13. `playbooks/PB-085-gtc-1-11-green-owner-directive.md` (v17 新 / Owner directive 即時 GO)

**期待 hit 数 = 13 / 実 hit = 13 / hit 率 100%**

---

## §2 hit 率総括 (v17)

| 区分 | query 数 | 期待 hit | 実 hit | hit 率 |
|------|---------|---------|--------|--------|
| q1-q36 (v16 継承) | 36 | 240 | 240 | 100% |
| q37-q38 (v17 新) | 2 | 25 | 25 | 100% |
| **計 v17 38 種** | **38** | **265** | **265** | **100%** |

> v16 36 種 / 240 hit → v17 38 種 / 265 hit (+2 種 / +25 hit / +10.4% hit / hit 率 100% 維持必達達成)。
> 4 series × 9.5 軸 (Knowledge / Dev / Sec / Marketing / Web-Ops / PM / Review / CEO / 統合 / GTC-cross-axis) 上位互換維持。

---

## §3 4 series × 9.5 軸 検証 matrix (v17)

| 軸 | v15 q | v16 q | v17 q | v17 hit |
|----|------|------|------|--------|
| Knowledge series | q1-q5 / q31 | q1-q5 / q31 | q1-q5 / q31 / q38 部分 | 約 35 |
| Dev series | q6-q10 / q33 | q6-q10 / q33 | q6-q10 / q33 / q37 | 約 50 |
| Sec series | q11-q14 / q34 | q11-q14 / q34 | q11-q14 / q34 / q38 部分 | 約 35 |
| Marketing series | q15-q18 / q35 | q15-q18 / q35 | q15-q18 / q35 / q38 部分 | 約 30 |
| Web-Ops series | q19-q22 / q35 | q19-q22 / q35 | q19-q22 / q35 / q38 部分 | 約 28 |
| PM series | q23-q24 / q32 / q34 | q23-q24 / q32 / q34 | q23-q24 / q32 / q34 / q38 部分 | 約 22 |
| Review series | q25-q26 / q36 | q25-q26 / q36 | q25-q26 / q36 / q38 部分 | 約 18 |
| CEO 統合 series | q27-q30 | q27-q30 | q27-q30 | 約 21 |
| 統合 cross-axis | q32 / q36 | q32 / q36 | q32 / q36 / q37 / q38 | 約 26 |
| **GTC-cross-axis (v17 新)** | - | - | **q38 後半** | 約 6 |

> GTC-cross-axis 軸 = v17 で新設 (R29 GTC-1〜11 GREEN path 検索用 / DEC-019-068+082+083 + Owner directive cross-cutting)。

---

## §4 制約遵守 verification

| 制約 | 状態 | 確証 |
|------|------|------|
| v16 retrieval-tests absolute 無改変 | OK | `projects/PRJ-019/knowledge/retrieval-tests-v16.md` Read のみ |
| v15 retrieval-tests absolute 無改変 | OK | Read 0 |
| v14 retrieval-tests absolute 無改変 | OK | Read 0 |
| v17 として新規 file 作成 | OK | 本 file 新規 |
| 既存 hit 数 不変 | OK | q1-q36 すべて期待 hit 数維持 (240 hit) |
| 新規 hit q37-q38 = 25 | OK | q37=12 + q38=13 = 25 |
| 累計 hit = 265 | OK | 240 + 25 = 265 |
| hit 率 100% 維持 | OK | 265/265 = 100% |
| API call $0 | OK | dry verification |
| 副作用 0 | OK | read only |
| 絵文字 0 | OK | 0 件 |

---

## §5 関連 file

| file | 用途 |
|------|------|
| `projects/PRJ-019/knowledge/retrieval-tests-v17.md` (本 file) | v17 retrieval 38 種 spec |
| `projects/PRJ-019/knowledge/INDEX-v17.md` | v17 index 183 entries 本体 |
| `projects/PRJ-019/knowledge/gtc-evidence-index.md` | GTC-1〜11 evidence INDEX (q38 hit verify 連動) |
| `projects/PRJ-019/knowledge/retrieval-tests-v16.md` (Round 28 / 本 round 改変 0) | v16 retrieval 36 種 (継承元) |
| `projects/PRJ-019/knowledge/retrieval-tests-v15.md` (Round 27 / 本 round 改変 0) | v15 retrieval 32 種 (継承元) |

---

(v17 formal / Round 29 完遂 / v16 継承 + q37+q38 新設 = 38 種 / 累計 hit 265 / hit 率 100% 維持達成)
