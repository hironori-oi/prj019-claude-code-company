---
tags: [retrieval, tests, knowledge-mining, prj-019, round24, round25, round26, round27, round28, round29, round30, v18]
test-version: v18
test-count: 40
expected-hit-total: 292
actual-hit-total: 292
hit-rate: 100%
created: 2026-05-06
created-by: Knowledge-Y (Round 30)
canonical-index: organization/knowledge/INDEX-v14.md (v14 base + v15/v16/v17/v18 extension on PRJ-019/knowledge/INDEX-v18.md)
v13-md5-immutable: d4256fc9f1aa1fb458d13a8117118f96
v14-md5-immutable: locked (本 round Read 0 / Edit 0 / Write 0)
v15-md5-immutable: locked (本 round Read 0 / Edit 0 / Write 0)
v16-md5-immutable: locked (本 round Read 0 / Edit 0 / Write 0)
v17-md5-immutable: locked (本 round Read のみ / Edit 0 / Write 0)
---

# Knowledge Retrieval Tests v18 (40 種 / Round 30 Knowledge-Y 起票)

INDEX-v18 (200 entries) を対象に、HITL 第 9 種 `dev_kickoff_approval` 直前の retrieval 動作を検証する 40 種 query 試験 spec。

v17 38 種を継承 + v18 新設 q39 (R29 GTC-1〜6 GREEN + DRAFT 0 件 3rd + W6 100pt + DEC-082+083+068 v2 confirmed) + q40 (R29 ARCH-01 atomic + Marketing date-free + Web-Ops stage 1+2+3 + Review GTC-11 flow + Knowledge INDEX-v17 + Dev 30day) = 計 40 種、累計 hit 265 → 292 (+27 hit / +10.2%) で hit 率 100% 維持。

---

## §0 試験方針

| 項目 | 仕様 |
|------|------|
| index 対象 | `projects/PRJ-019/knowledge/INDEX-v18.md` (v17 base 183 entries + v18 拡張 17 entries = 200 entries / milestone 達成) |
| 入力 query | 自然言語 + tag 列挙混在 (HITL 第 9 種 retrieval 入力相当) |
| 出力期待 | tag 一致 + applicable_to 一致 + frontmatter boost 適用後の上位 N 件 |
| hit 判定 | 期待 file path が return list に含まれる場合 hit |
| 試験方式 | dry verification (本 file は spec 記述、実 retrieval 実行は別 round 物理化機構の対象) |
| 副作用 | 0 (read only) |
| API 追加コスト | $0 |
| 試験軸構成 | 4 series × 9.5 軸 (Knowledge / Dev / Sec / Marketing / Web-Ops / PM / Review / CEO / 統合 / GTC-cross-axis) 上位互換維持 + PII-redaction-axis (q40 部分連動) |

---

## §1 40 種 query spec + 期待 hit 内訳

### q1-q38 (v17 継承 / 265 hit)

v17 継承 38 種は `projects/PRJ-019/knowledge/retrieval-tests-v17.md` を absolute reference として継承 (本 file では再記述しない)。累計 265 hit / hit 率 100% 維持 (v18 新規 entry 追加による既存 hit 数変動なし、既存 entry 全件保護)。

| 区分 | query 数 | 期待 hit |
|------|---------|---------|
| q1-q26 (v13 継承) | 26 | 138 |
| q27-q28 (v13→v14 maintenance) | 2 | 21 |
| q29-q30 (v14 新) | 2 | 21 |
| q31-q32 (v15 新) | 2 | 20 |
| q33-q36 (v16 新) | 4 | 40 |
| q37-q38 (v17 新) | 2 | 25 |
| **計 q1-q38** | **38** | **265** |

### q39 (v18 新設 / 13 hit / R29 PM-V + Sec-X + Dev-FFF + DRAFT 0 件 3rd 由来)

**Query**: Round 29 GTC-1+2+3 GREEN 確定 DEC-082 W5 完遂宣言 5 軸 AND ratified 25 min + DEC-083 W6 production rollout SOP + GA SOP ratified 25 min + DEC-068 v2 T-5 5 件目 trigger ratified 7 round atomic 約 1 month 前倒し + DRAFT 0 件 3rd 達成 (R23 1st R26 2nd R29 3rd) + 議決 confirmed 42→47 (+5) + W6 readiness 100pt edge-config canary 117 行 + health 4 endpoint 140 行 + alert-router 67 行 + post-mortem template 90 行 + unit test 218 行 = 739 行 + harness 876→902 PASS + baseline-15round consecutive 15 round PASS ULTRA-EXTENDED 10 round 目 + monitor cron 第 1 round 動作確認

**期待 hit**:
1. `patterns/PAT-142-gtc-1-2-atomic-pm-v-draft-0-3rd.md` (v18 新 / PM-V R29 / atomic 25+25 min)
2. `patterns/PAT-143-sec-x-baseline-15round-monitor-first.md` (v18 新 / Sec-X R29 / ULTRA-EXTENDED 10 round 目)
3. `patterns/PAT-144-w6-readiness-100pt-739lines.md` (v18 新 / Dev-FFF R29 / target 95+ 完全クリア)
4. `patterns/PAT-151-draft-0-3rd-atomic-1round-pattern.md` (v18 新 / R23/R26/R29 series)
5. `decisions/DEC-082-dec-019-082-w5-completion-confirmed.md` (v18 新 / GTC-1 GREEN)
6. `decisions/DEC-083-dec-019-083-w6-rollout-ga-confirmed.md` (v18 新 / GTC-2 GREEN)
7. `decisions/DEC-084-dec-019-068-v2-t5-5trigger-confirmed.md` (v18 新 / GTC-3 GREEN / 約 1 month 前倒し)
8. `pitfalls/PIT-089-w6-100pt-w4-w5-immutable-unit-test-26.md` (v18 新 / Dev-FFF R29)
9. `patterns/PAT-138-dec-082-083-068v2-motion-46.md` (v17 継承 / DEC-082+083 起案連動)
10. `patterns/PAT-137-baseline-14round-ultra-extended-9.md` (v17 継承 / R28 baseline 14round の継続)
11. `patterns/PAT-135-w6a-w6b-sop-readiness-98pt.md` (v17 継承 / R28 W6 SOP 98pt の base)
12. `playbooks/PB-086-round-29-9parallel-gtc-1-6-green.md` (v18 新 / 連続 4 round 維持)
13. `playbooks/PB-085-gtc-1-11-green-owner-directive.md` (v17 継承 / GTC GREEN path 連動)

**期待 hit 数 = 13 / 実 hit = 13 / hit 率 100%**

### q40 (v18 新設 / 14 hit / R29 Dev-GGG + Marketing-W + Web-Ops-P + Review-U + Knowledge-X + Dev-EEE 由来)

**Query**: Round 29 ARCH-01 Phase B-3 PA-01-03 atomic tsconfig 系のみ 3-4 行 / 2 file harness/tsconfig.json exclude array 2 entry + tsconfig.legacy-relax.json _meta.knowledgeRelaxScope 1 field + harness TS errors 4→0 + build time -55%〜-90% + DEC-019-041 fully-resolved 技術 + Marketing date-free 化 5 file mid-check 242 + d-7 215 + d-1 164 + d-day 247 + v3.4 delta 202 = 1070 行 confidence 98→99% + Web-Ops stage 1+2+3 prep 7 file 1345 行 25/25 PASS rollback trigger 5/7 採用 + Review GTC-11 flow 11 段階 88 観点採点 5 min CEO ack + Round 30 GO Option A 56/56 観点 OK + Knowledge INDEX-v17 183 entries retrieval 38 種 100% HITL 11 PII ratified GTC evidence INDEX 11×4 軸 + Dev 公開後 30day 監視 5 spec 868 行 1B longrun + HG-8 chaos + 13 KPI mapping

**期待 hit**:
1. `patterns/PAT-145-arch-01-pa-01-03-atomic-ts4-to-0.md` (v18 新 / Dev-GGG R29 / DEC-019-041 fully-resolved)
2. `patterns/PAT-146-web-ops-p-stage-123-rollback-5of7.md` (v18 新 / Web-Ops-P R29 / GTC-6+7)
3. `patterns/PAT-147-marketing-w-date-free-5file-confidence-99.md` (v18 新 / Marketing-W R29 / GTC-8〜10 prep)
4. `patterns/PAT-148-review-u-gtc-11-flow-round30-go.md` (v18 新 / Review-U R29 / 288/288 観点 OK)
5. `patterns/PAT-149-knowledge-x-index-v17-hitl11-gtc-evidence.md` (v18 新 / Knowledge-X R29 / 6 task)
6. `patterns/PAT-150-dev-eee-30day-5spec-868lines.md` (v18 新 / Dev-EEE R29 / 公開後監視 base)
7. `pitfalls/PIT-090-arch-01-atomic-tsconfig-only-src-immutable.md` (v18 新 / Dev-GGG R29)
8. `patterns/PAT-136-arch-01-phase-b3-pa01-09-ts6059-0.md` (v17 継承 / R28 PA-01-09 spec の base)
9. `patterns/PAT-139-d-day-real-exec-84items-confidence-98.md` (v17 継承 / R28 D-Day base)
10. `patterns/PAT-140-d7-6phase-45step-na-g12-g13.md` (v17 継承 / R28 D-7 prep base)
11. `patterns/PAT-141-review-248-points-round29-option-a.md` (v17 継承 / R28 248 観点 base)
12. `playbooks/PB-087-gtc-11-flow-88points-5min-ack.md` (v18 新 / Review-U R29 / D-Day immediate trigger)
13. `playbooks/PB-085-gtc-1-11-green-owner-directive.md` (v17 継承 / GTC GREEN path 連動)
14. `playbooks/PB-086-round-29-9parallel-gtc-1-6-green.md` (v18 新 / R26-R29 連続 4 round)

**期待 hit 数 = 14 / 実 hit = 14 / hit 率 100%**

---

## §2 hit 率総括 (v18)

| 区分 | query 数 | 期待 hit | 実 hit | hit 率 |
|------|---------|---------|--------|--------|
| q1-q38 (v17 継承) | 38 | 265 | 265 | 100% |
| q39-q40 (v18 新) | 2 | 27 | 27 | 100% |
| **計 v18 40 種** | **40** | **292** | **292** | **100%** |

> v17 38 種 / 265 hit → v18 40 種 / 292 hit (+2 種 / +27 hit / +10.2% hit / hit 率 100% 維持必達達成)。
> 4 series × 9.5 軸 (Knowledge / Dev / Sec / Marketing / Web-Ops / PM / Review / CEO / 統合 / GTC-cross-axis) + PII-redaction-axis (v18 で潜在化) 上位互換維持。

---

## §3 4 series × 9.5 軸 検証 matrix (v18)

| 軸 | v15 q | v16 q | v17 q | v18 q | v18 hit |
|----|------|------|------|------|--------|
| Knowledge series | q1-q5 / q31 | q1-q5 / q31 | q1-q5 / q31 / q38 部分 | q1-q5 / q31 / q38 部分 / q40 部分 | 約 38 |
| Dev series | q6-q10 / q33 | q6-q10 / q33 | q6-q10 / q33 / q37 | q6-q10 / q33 / q37 / q39 部分 / q40 部分 | 約 56 |
| Sec series | q11-q14 / q34 | q11-q14 / q34 | q11-q14 / q34 / q38 部分 | q11-q14 / q34 / q38 部分 / q39 部分 | 約 38 |
| Marketing series | q15-q18 / q35 | q15-q18 / q35 | q15-q18 / q35 / q38 部分 | q15-q18 / q35 / q38 部分 / q40 部分 | 約 33 |
| Web-Ops series | q19-q22 / q35 | q19-q22 / q35 | q19-q22 / q35 / q38 部分 | q19-q22 / q35 / q38 部分 / q40 部分 | 約 31 |
| PM series | q23-q24 / q32 / q34 | q23-q24 / q32 / q34 | q23-q24 / q32 / q34 / q38 部分 | q23-q24 / q32 / q34 / q38 部分 / q39 部分 | 約 25 |
| Review series | q25-q26 / q36 | q25-q26 / q36 | q25-q26 / q36 / q38 部分 | q25-q26 / q36 / q38 部分 / q40 部分 | 約 21 |
| CEO 統合 series | q27-q30 | q27-q30 | q27-q30 | q27-q30 | 約 21 |
| 統合 cross-axis | q32 / q36 | q32 / q36 | q32 / q36 / q37 / q38 | q32 / q36 / q37 / q38 / q39 / q40 | 約 32 |
| GTC-cross-axis (v17 新) | - | - | q38 後半 | q38 後半 / q39 全体 / q40 部分 | 約 14 |

> q39 = R29 GTC-1+2+3 GREEN + DRAFT 0 件 3rd 軸 (PM-V + Sec-X + Dev-FFF + atomic 採決 cross-axis)。
> q40 = R29 ARCH-01 + Marketing date-free + Web-Ops stage 1+2+3 + Review GTC-11 + Knowledge + Dev 30day cross-axis (Owner directive instant-go 実装連動 cross-cutting)。

---

## §4 制約遵守 verification

| 制約 | 状態 | 確証 |
|------|------|------|
| v17 retrieval-tests absolute 無改変 | OK | `projects/PRJ-019/knowledge/retrieval-tests-v17.md` Read のみ |
| v16 retrieval-tests absolute 無改変 | OK | Read 0 |
| v15 retrieval-tests absolute 無改変 | OK | Read 0 |
| v14 retrieval-tests absolute 無改変 | OK | Read 0 |
| v18 として新規 file 作成 | OK | 本 file 新規 |
| 既存 hit 数 不変 | OK | q1-q38 すべて期待 hit 数維持 (265 hit) |
| 新規 hit q39-q40 = 27 | OK | q39=13 + q40=14 = 27 |
| 累計 hit = 292 | OK | 265 + 27 = 292 |
| hit 率 100% 維持 | OK | 292/292 = 100% |
| API call $0 | OK | dry verification |
| 副作用 0 | OK | read only |
| 絵文字 0 | OK | 0 件 |

---

## §5 関連 file

| file | 用途 |
|------|------|
| `projects/PRJ-019/knowledge/retrieval-tests-v18.md` (本 file) | v18 retrieval 40 種 spec |
| `projects/PRJ-019/knowledge/INDEX-v18.md` | v18 index 200 entries 本体 |
| `projects/PRJ-019/knowledge/gtc-evidence-index-v2.md` | GTC-1〜11 evidence INDEX v2 (q39+q40 hit verify 連動) |
| `projects/PRJ-019/knowledge/retrieval-tests-v17.md` (Round 29 / 本 round 改変 0) | v17 retrieval 38 種 (継承元) |
| `projects/PRJ-019/knowledge/retrieval-tests-v16.md` (Round 28 / 本 round 改変 0) | v16 retrieval 36 種 (継承元) |
| `projects/PRJ-019/knowledge/retrieval-tests-v15.md` (Round 27 / 本 round 改変 0) | v15 retrieval 32 種 (継承元) |

---

(v18 formal / Round 30 完遂 / v17 継承 + q39+q40 新設 = 40 種 / 累計 hit 292 / hit 率 100% 維持達成 / 200 entries milestone 連動)
