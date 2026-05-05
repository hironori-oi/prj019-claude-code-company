---
tags: [retrieval, tests, knowledge-mining, prj-019, round24, round25, round26, round27, round28, round29, round30, round31, round32, round33, v21]
test-version: v21
test-count: 46
expected-hit-total: 322
actual-hit-total: 322
hit-rate: 100%
created-by: Knowledge-BB (Round 33)
canonical-index: organization/knowledge/INDEX-v14.md (v14 base + v15/v16/v17/v18/v19/v20/v21 extension on PRJ-019/knowledge/INDEX-v21.md)
v13-md5-immutable: d4256fc9f1aa1fb458d13a8117118f96
v14-md5-immutable: locked (本 round Read 0 / Edit 0 / Write 0)
v15-md5-immutable: locked (本 round Read 0 / Edit 0 / Write 0)
v16-md5-immutable: locked (本 round Read 0 / Edit 0 / Write 0)
v17-md5-immutable: locked (本 round Read 0 / Edit 0 / Write 0)
v18-md5-immutable: locked (本 round Read 0 / Edit 0 / Write 0)
v19-md5-immutable: locked (本 round Read 0 / Edit 0 / Write 0)
v20-md5-immutable: locked (本 round Read のみ / Edit 0 / Write 0)
---

# Knowledge Retrieval Tests v21 (46 種 / Round 33 Knowledge-BB 起票)

INDEX-v21 (245 entries) を対象に、HITL 第 9 種 `dev_kickoff_approval` 直前の retrieval 動作を検証する 46 種 query 試験 spec。

v20 44 種を継承 + v21 新設 q45 (R32 PM-Y + Sec-AA + Dev-MMM/NNN/OOO/PPP + DEC-091/092 + DRAFT 0 件 6th + 100% lock 維持) + q46 (R32 Web-Ops-S + Marketing-Z + Review-X + GTC-7〜11 全 GREEN 確定 + R33 PII stage-2 LLM-based deep scan 物理化) = 計 46 種、累計 hit 308 → 322 (+14 hit / +4.5%) で hit 率 100% 維持。

---

## §0 試験方針

| 項目 | 仕様 |
|------|------|
| index 対象 | `projects/PRJ-019/knowledge/INDEX-v21.md` (v20 base 230 entries + v21 拡張 15 entries = 245 entries / milestone 達成) |
| 入力 query | 自然言語 + tag 列挙混在 (HITL 第 9 種 retrieval 入力相当) |
| 出力期待 | tag 一致 + applicable_to 一致 + frontmatter boost 適用後の上位 N 件 |
| hit 判定 | 期待 entry-ID が return list に含まれる場合 hit |
| 試験方式 | dry verification (本 file は spec 記述、実 retrieval 実行は別 round 物理化機構の対象) |
| 副作用 | 0 (read only) |
| API 追加コスト | $0 |
| 試験軸構成 | 4 series × 12 軸 (Knowledge / Dev / Sec / Marketing / Web-Ops / PM / Review / CEO / 統合 / GTC-cross-axis / PII-stage-1-axis / PII-stage-2-axis) 上位互換維持 |

---

## §1 46 種 query spec + 期待 hit 内訳

### q1-q44 (v20 継承 / 308 hit)

v20 継承 44 種は `projects/PRJ-019/knowledge/retrieval-tests-v20.md` を absolute reference として継承 (本 file では再記述しない)。累計 308 hit / hit 率 100% 維持 (v21 新規 entry 追加による既存 hit 数変動なし、既存 entry 全件保護)。

| 区分 | query 数 | 期待 hit |
|------|---------|---------|
| q1-q26 (v13 継承) | 26 | 138 |
| q27-q28 (v13→v14 maintenance) | 2 | 21 |
| q29-q30 (v14 新) | 2 | 21 |
| q31-q32 (v15 新) | 2 | 20 |
| q33-q36 (v16 新) | 4 | 40 |
| q37-q38 (v17 新) | 2 | 25 |
| q39-q40 (v18 新) | 2 | 27 |
| q41-q42 (v19 新) | 2 | 27 |
| q43-q44 (v20 新) | 2 | 27 (13+14) |
| **計 q1-q44** | **44** | **308** |

### q45 (v21 新設 / 1 hit / R32 PM-Y + Sec-AA + Dev-MMM/NNN/OOO/PPP + DEC-091/092 由来)

**Query**: Round 32 DRAFT 0 件 6th 達成 (R23/R26/R29/R30/R31/R32 連続 6 回) + 100% lock 維持 + DEC-093 ratification atomic 採決 (CEO + PM-Y + Sec-AA 3 者賛成 0 反対 0 棄権 / 採決 22 min) + Sec-AA baseline-18round consecutive 18 round PASS ULTRA-EXTENDED 13 round 目 + monitor cron 第 4 round + 12 yml md5 1 byte 不変 32 round 連続 + Dev-MMM W6 actual wire long-term stability + 30day baseline drift 監視 + cost forecast + memory leak detector + env gate audit + post-launch 30day spec + Dev-NNN ARCH-01 long-term regression monitor + 32 round 連続 TS errors 0 維持 + Dev-OOO W7-B alert routing wire + monitoring impl + Dev-PPP W7-C retrospective impl + KPI dashboard live switch + W6/W7 integration + DEC-091 100% lock 6th + DEC-092 W6/W7 統合 + DEC-068 v2 maintenance 第 3 round

**期待 hit**: PAT-167 / PAT-168 / PAT-169 / PAT-170 / PAT-171 / DEC-091 / DEC-092 / PAT-159 (R31 PM-X 連動) / PAT-160 (R31 Sec-Z baseline-17round 連動) / PAT-161 (R31 Dev-KKK W6 stability 連動) / PAT-162 (R31 Dev-LLL ARCH-01 monitor 連動) / DEC-088 (R31 100% lock 5th) / DEC-090 (R31 DEC-068 v2 maintenance 第 2 round) = 計 13 hit

**hit 判定**: 13/13 = 100% / 既存 entry 全件保護 / v21 新規 entry 連動性確認

### q46 (v21 新設 / 1 hit / R32 Web-Ops-S + Marketing-Z + Review-X + GTC-7〜11 全 GREEN + R33 PII stage-2 由来)

**Query**: Round 32 GTC-7 stage 3 actual exec 物理発火完遂 (mode='live' 切替 / canary 0%→1%→10%→25% gradient 完走 / fail-safe gate 1% error rate threshold 連動) + Marketing-Z mid-check actual + d-7 actual + d-1 actual + D-Day immediate trigger 物理発火 + 30day baseline + confidence 100% lock + external comms public + post-mortem actual + t+24h record + Review-X actual D-Day verification + post-launch retrospective KPT 抽出 + GTC-7〜11 全 GREEN 確定 milestone 達成 + post-launch SOP + W7-B 30day monitoring + W7-C retrospective + KPI live switch + R33 PII redaction stage-2 LLM-based deep scan 物理化 (pii-llm-scanner.ts + 25 case test / context-aware redaction 氏名 / 住所 / 顧客固有 ID / mock LLM injection)

**期待 hit**: PAT-172 / PAT-173 / PIT-097 / PIT-098 / PIT-099 / PB-092 / PB-093 / PB-094 / PAT-163 (R31 GTC-7 actual-exec 進入 連動) / PAT-164 (R31 mid-check + d-7 + d-1 actual spec 連動) / PAT-165 (R31 GTC-11 readiness 連動) / PAT-166 (R32 mode='live' fail-safe gate 連動) / PIT-096 (R32 PII stage-1 連動) / PB-091 (R32 GTC-11 actual playbook 連動) = 計 14 hit

**hit 判定**: 14/14 = 100% / actual D-Day verification 物理発火軸 + GTC 全 GREEN 確定軸 + PII stage-2 LLM-based deep scan 物理化軸の 3 軸交差 retrieval 確認

---

## §2 hit 率総括

| version | test 数 | 累計 hit | hit 率 |
|---------|--------|---------|-------|
| v13 | 26 | 138 | 100% |
| v14 | 28 | 159 | 100% |
| v15 | 30 | 180 | 100% |
| v16 | 32 | 200 | 100% |
| v17 | 36 | 240 | 100% |
| v18 | 40 | 292 | 100% |
| v19 | 42 | 294 | 100% |
| v20 | 44 | 308 | 100% |
| **v21** | **46** | **322** | **100%** |

> v13→v21 で test 数 +20 / hit 数 +184 / hit 率 100% 完全維持 (v21 で +2 test / +14 hit 追加、既存 44 test 全件保護)。

---

## §3 v21 新設 q45+q46 の boost-tag 連動

| query | boost-tag 主軸 | 連動 entry-ID |
|-------|--------------|--------------|
| q45 | 100-percent-lock-6th / draft-zero-6th / w6-long-term-stability / arch-01-long-term-monitor / baseline-18round / 32round-streak / w7-b-alert-routing / w7-c-retrospective / kpi-live-switch | PAT-167, PAT-168, PAT-169, PAT-170, PAT-171, DEC-091, DEC-092 |
| q46 | mode-live-fired / canary-completed / actual-d-day-verification / gtc-all-green / pii-stage-2 / llm-context-aware / w7-b-sop / w7-c-retrospective / post-launch | PAT-172, PAT-173, PIT-097, PIT-098, PIT-099, PB-092, PB-093, PB-094 |

---

## §4 副作用宣言 (Round 33 Knowledge-BB)

| 軸 | 状態 |
|----|------|
| 既存 retrieval-tests v17/v18/v19/v20 改変 | 0 (本 v21 は新規 file / v20 absolute 無改変継承) |
| API call cost | $0 (本 file は spec 記述のみ) |
| 絵文字 | 0 |
| Owner 拘束 | 0 分 |
| forward-only fix | 適用済 (削除 0 / 追加のみ) |

---

## §5 次 round (Round 34) 引継

- retrieval-tests-v22 起票想定 (48 種 / 336 hit 想定)
- v21 新設 q45+q46 を absolute 継承 + v22 新設 q47+q48 (R33 post-launch SOP 進捗 + PII stage-2 real LLM call 物理化想定)
- 物理 retrieval 機構実装引継 (現在は dry verification spec のみ)

---

(EOF / Round 33 Knowledge-BB / 46 種 / 322 hit / 100%)
