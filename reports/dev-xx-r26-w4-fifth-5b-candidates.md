# Dev-XX Round 26 — W4 第 5 弾 5-B 候補 spec（5-A 除く 3 候補探索）

最終更新: 2026-05-05 W0-Week1
起案: Dev 部門 R26 Dev-XX（補完 dev / 9 並列体制 9 番目）
位置付け: Round 25 Dev-TT が 5-A (claude-bridge integration e2e) を spec 化、R26 Dev-VV が物理化中。本書では **5-A 以外** の W4 第 5 弾候補を 3 件探索し、5-B〜5-D の物理化レベル spec を起案する。
版: v1.0
連動 DEC: DEC-019-006 / 033 / 041 / 049 / 051 / 062 / 068 / 074-077 / 079
連動 spec / file（絶対無改変）:
- `app/harness/src/__tests__/17day-path-w4-hitl-hardguards-cross.test.ts`（R24 Dev-QQ / 907 行 / 12 tests）
- `app/harness/src/__tests__/17day-path-w4-hitl-gates-integration.test.ts`（R23 Dev-MM / 626 行 / 9 tests）
- `app/harness/src/__tests__/17day-path-w4-production-e2e-extended.test.ts`（R22 Dev-JJ / 561 行 / 10 tests）
- `app/harness/src/__tests__/17day-path-w4-e2e-fully-wired.test.ts`（R22 Dev-HH / 530 行 / 11 tests）
- `app/harness/src/__tests__/file-breach-counter-stress-chaos.test.ts`（R22 Dev-KK / 555 行 / 9 tests）
- `app/harness/src/__tests__/heartbeat-1m-10digit-longrun-stability.test.ts`（R22 Sec-Q / 5 tests）

物理化対象 file（R27+ 想定）:
- `app/harness/src/__tests__/phase2-w5-hitl-hardguards-extension.test.ts`（5-B / 600-750 行 / 10-12 tests）
- `app/harness/src/__tests__/phase2-w5-breach-counter-1b-longrun.test.ts`（5-C / 450-600 行 / 6-8 tests）
- `app/harness/src/__tests__/phase2-w5-cross-orchestrator-chaos.test.ts`（5-D / 550-700 行 / 9-11 tests）

---

## §0 サマリ（CEO 250 字）

W4 完成第 5 弾 5-A（claude-bridge integration e2e / Dev-TT R25 spec / Dev-VV R26 物理化）以外の候補を 3 件探索 + 物理化 spec 化。**5-B = HITL × hardguards 拡張**（R24 第 4 弾 12 tests を補完する 10-12 tests / matrix 拡張）/ **5-C = breach-counter 1B longrun**（R22 第 2 弾 stress-chaos の 1 桁延伸 / 6-8 tests / 12-16h longrun 想定）/ **5-D = cross-orchestrator chaos test**（R25 第 1 弾 cross-orchestrator e2e の chaos injection 強化 / 9-11 tests）。**推奨候補 = 5-B**（cross-package coverage との独立性 + 工数 5-7h と中程度 + R24 既存 baseline 補完性が最大）。3 候補すべて harness 836 PASS / openclaw-runtime 394 PASS baseline absolute 保護、API call $0 / 副作用 0 / 絵文字 0 担保。R27+ で 1 候補ずつ物理化想定で base spec 提出。

---

## §1 5-A の現状確認 + 5-B〜5-D 候補の独立性

### 1.1 5-A 現状（R25 → R26 引継）

| 観点 | 値 |
|---|---|
| spec 起案 | R25 Dev-TT（352 行 / 12-15 tests / 4-5 groups） |
| 物理化担当 | R26 Dev-VV（CEO 引継 8 項目 #③） |
| file path | `app/harness/src/__tests__/phase2-w5-claude-bridge-integration-e2e.test.ts` |
| 工数 | 6.5-8h |
| harness 想定変動 | 836 → 848-851 PASS（+12-15）|

### 1.2 5-B〜5-D の独立性（5-A との衝突回避）

| 候補 | 5-A との独立性 | 5-A 物理化との並列実施可否 |
|---|---|---|
| 5-B | HITL × hardguards 矩形拡張 = harness 内完結 / 5-A claude-bridge layer 不接触 | OK |
| 5-C | breach counter 単体の 1B longrun = harness 内完結 / 5-A 不接触 | OK |
| 5-D | cross-orchestrator chaos = harness 内完結 / 5-A 不接触 | OK |

3 候補すべて **5-A と並列実施可能**（R26 Dev-VV が 5-A、R27+ が 5-B/C/D を 1 件ずつ）。

---

## §2 候補 5-B — HITL × hardguards 拡張（R24 第 4 弾 補完）

### 2.1 概要

**目的**: R24 Dev-QQ 第 4 弾の HITL × hardguards cross-matrix 12 tests を補完し、未充填の matrix 領域 + edge case を 10-12 tests で吸収する。

### 2.2 既存 R24 第 4 弾 baseline（不可侵）

R24 Dev-QQ の `17day-path-w4-hitl-hardguards-cross.test.ts`（907 行 / 12 tests）は以下 matrix を覆っている:

| HITL gate | hardguard G-02 | hardguard G-10 |
|---|---|---|
| dev_kickoff_approval | covered | covered |
| knowledge_pii_review | covered | covered |
| その他 7 gates | partial | partial |

未充填領域（5-B 候補で吸収）:
- HITL gate × hardguard G-XX（G-02 / G-10 以外）の matrix
- HITL gate timeout × hardguard fail-fast 衝突 scenario
- HITL gate retry × hardguard breach counter 連動
- HITL gate cooldown × hardguard SIGTERM escalation

### 2.3 groups + tests 設計（4 groups / 10-12 tests）

#### Group HG-1（HITL × additional hardguard matrix, 3 tests）
| test ID | 検証内容 |
|---|---|
| HG-1-1 | HITL gate × hardguard G-XX (G-02/G-10 以外) の matrix 4 件 PASS |
| HG-1-2 | HITL gate timeout (15s) × hardguard fail-fast (5s) → fail-fast 優勢 |
| HG-1-3 | HITL gate decision pending × hardguard SIGTERM → gate cancel 連動 |

#### Group HG-2（HITL retry × breach counter, 3 tests）
| test ID | 検証内容 |
|---|---|
| HG-2-1 | HITL gate retry 3 回 × breach counter increment 3 件累積 |
| HG-2-2 | HITL gate retry 上限超過 × breach counter threshold trip |
| HG-2-3 | HITL gate retry success on 2nd × breach counter rollback 1 件 |

#### Group HG-3（HITL cooldown × SIGTERM escalation, 3 tests）
| test ID | 検証内容 |
|---|---|
| HG-3-1 | HITL gate cooldown active × hardguard SIGTERM → gate skip / 副作用 0 |
| HG-3-2 | HITL gate cooldown 残時間 5s × hardguard grace 10s → gate 解除 |
| HG-3-3 | HITL gate cooldown 衝突解消 = SIGKILL escalation 確認 |

#### Group HG-4（cross-matrix consistency, 1-3 tests）
| test ID | 検証内容 |
|---|---|
| HG-4-1 | HITL × hardguards 拡張 matrix の summary log 整合性 |
| HG-4-2 | HITL × hardguards consensus state 復元（from journal） |
| HG-4-3 (optional) | HITL × hardguards × breach counter 三重 nested fire scenario |

**合計**: 4 groups / **10-12 tests**

### 2.4 工数 + 優先度

| task | 工数 (h) |
|---|---|
| skeleton 構築（4 groups / 10-12 describe ブロック） | 1.0 |
| Group HG-1 実装 + assertions | 1.5 |
| Group HG-2 実装 | 1.5 |
| Group HG-3 実装 | 1.5 |
| Group HG-4 実装 | 0.5-1.0 |
| harness 836+ PASS regression 0 verify | 0.5 |
| **合計** | **6.0-7.0** |

優先度: **中-高**（R24 第 4 弾の補完 = W4 完成度の質的向上 / cross-package coverage 向上は限定的）

### 2.5 制約担保

- API call $0（HITL / hardguard / breach counter mock 経路のみ）
- 副作用 0（OS tmp + afterEach cleanup）
- 既存 R24 Dev-QQ file は import せず、本 5-B は独立 file として並列存在

---

## §3 候補 5-C — breach-counter 1B longrun（R22 第 2 弾 1 桁延伸）

### 3.1 概要

**目的**: R22 Dev-KK 第 2 弾の breach-counter stress chaos（555 行 / 9 tests / 100M scale）を 1B（10^9）scale に延伸し、heartbeat 1M longrun（Sec-Q R22 5 tests）と同水準の 1B longrun stability を breach-counter 軸で検証。

### 3.2 既存 baseline

| file | 行数 | tests | scale |
|---|---|---|---|
| `file-breach-counter.test.ts` | - | 既存 | unit |
| `file-breach-counter-stress-chaos.test.ts`（R22 Dev-KK） | 555 | 9 | 100M scale stress |
| `heartbeat-1m-10digit-longrun-stability.test.ts`（R22 Sec-Q） | - | 5 | 1M longrun stability |

5-C 候補は上記 2 file の axis を **breach-counter × 1B scale longrun** で交差させた未充填領域を吸収。

### 3.3 groups + tests 設計（3 groups / 6-8 tests）

#### Group BC-1B-1（1B scale longrun stability, 2-3 tests）
| test ID | 検証内容 |
|---|---|
| BC-1B-1-1 | breach-counter 1B 件 increment / 平均 latency < 10us / coefficient of variation (CV) < 0.3 |
| BC-1B-1-2 | breach-counter 1B 件 increment 中の memory leak 検証 (RSS growth < 50% / 1B ops) |
| BC-1B-1-3 (optional) | 1B ops 中に GC pause spike 検出 (max GC pause < 100ms) |

#### Group BC-1B-2（chaos injection at 1B scale, 2-3 tests）
| test ID | 検証内容 |
|---|---|
| BC-1B-2-1 | 1B ops の 50% 経過時点で SIGTERM injection → graceful drain |
| BC-1B-2-2 | 1B ops 中の disk IO 遅延 simulation × counter accuracy 維持 |
| BC-1B-2-3 (optional) | 1B ops 並列 4 worker × cross-worker counter consistency |

#### Group BC-1B-3（recovery + journal replay, 2 tests）
| test ID | 検証内容 |
|---|---|
| BC-1B-3-1 | 1B ops 完了後 journal replay → counter state 完全復元 |
| BC-1B-3-2 | 1B ops 中 crash → 部分 journal から resume → final count 整合 |

**合計**: 3 groups / **6-8 tests**

### 3.4 工数 + 優先度

| task | 工数 (h) |
|---|---|
| skeleton 構築 | 1.0 |
| 1B scale fixture + counter mock 構築 | 2.0 |
| Group BC-1B-1 実装 | 2.0 |
| Group BC-1B-2 実装 | 1.5 |
| Group BC-1B-3 実装 | 1.0 |
| longrun execution + verify（CI 上 12-16h 想定） | 12-16（バックグラウンド longrun 専用 / dev 同時担当不可）|
| **合計（dev hands-on）** | **7.5-8.5h** + longrun 12-16h |

**重要**: 1B longrun は CI 上 12-16h を要するため、5-A / 5-B / 5-D とは異なり **scheduled longrun** 枠での実行が前提。dev hands-on 工数は 7.5-8.5h だが、longrun 完遂までの wallclock は 24-30h（spec 構築 + longrun 実行 + 報告書）。

優先度: **中**（heartbeat 1M longrun の 1B 延伸は構造的に重要だが、6/19 公開前 timeline では breach-counter は他軸で十分担保されているため緊急性低い）

### 3.5 制約担保

- API call $0（counter mock + journal mock）
- 副作用 0（OS tmp + afterEach cleanup / longrun 中の disk 占有 < 200MB）
- regression 0 担保: longrun 専用 file は `vitest run --testNamePattern` で隔離可能

---

## §4 候補 5-D — cross-orchestrator chaos test（R25 第 1 弾 chaos 強化）

### 4.1 概要

**目的**: R25 Dev-SS 第 1 弾 cross-orchestrator e2e（754 行 / 12 tests）の baseline state-clean 経路を、chaos injection で **failure 系統** に拡張し、real-world failure scenario の cross-orchestrator 復旧経路を 9-11 tests で検証。

### 4.2 既存 baseline

| file | 行数 | tests | 検証軸 |
|---|---|---|---|
| `phase2-w5-cross-orchestrator-e2e.test.ts`（R25 Dev-SS） | 754 | 12 | clean state cross-orchestrator |
| `phase2-w5-cross-package-extension.test.ts`（R25 Dev-TT） | 613 | 8 | clean state cross-package |

5-D 候補は上記 2 file の axis に **chaos injection** を追加した failure 系統を吸収。

### 4.3 groups + tests 設計（4 groups / 9-11 tests）

#### Group CO-CHAOS-1（orchestrator A 内 chaos × B 影響, 3 tests）
| test ID | 検証内容 |
|---|---|
| CO-CHAOS-1-1 | orchestrator A heartbeat lost × orchestrator B fallback 動作 |
| CO-CHAOS-1-2 | orchestrator A SIGTERM × orchestrator B journal replay |
| CO-CHAOS-1-3 | orchestrator A budget exceed × orchestrator B kill propagation |

#### Group CO-CHAOS-2（orchestrator B 内 chaos × A 影響, 3 tests）
| test ID | 検証内容 |
|---|---|
| CO-CHAOS-2-1 | orchestrator B handoff timeout × A retry 経路 |
| CO-CHAOS-2-2 | orchestrator B state corruption × A consensus rollback |
| CO-CHAOS-2-3 | orchestrator B subprocess hang × A escalation chain |

#### Group CO-CHAOS-3（cross-orchestrator partial failure, 2-3 tests）
| test ID | 検証内容 |
|---|---|
| CO-CHAOS-3-1 | A + B 同時 chaos × global kill switch trigger |
| CO-CHAOS-3-2 | A 完全 down × B 単独 fallback mode 動作 |
| CO-CHAOS-3-3 (optional) | A + B 交互 chaos 5 cycle × consensus 維持 |

#### Group CO-CHAOS-4（recovery resilience, 1-2 tests）
| test ID | 検証内容 |
|---|---|
| CO-CHAOS-4-1 | chaos 解消後の cross-orchestrator state re-sync |
| CO-CHAOS-4-2 (optional) | chaos × HITL gate 干渉 → human escalation |

**合計**: 4 groups / **9-11 tests**

### 4.4 工数 + 優先度

| task | 工数 (h) |
|---|---|
| skeleton 構築（4 groups / 9-11 describe） | 1.0 |
| chaos injector helper 構築 | 1.0 |
| Group CO-CHAOS-1 実装 | 1.5 |
| Group CO-CHAOS-2 実装 | 1.5 |
| Group CO-CHAOS-3 実装 | 1.0 |
| Group CO-CHAOS-4 実装 | 0.5 |
| harness 836+ PASS regression 0 verify | 0.5 |
| **合計** | **7.0-7.5** |

優先度: **中**（R25 第 1 弾 happy-path は完備されており、chaos 系統は real-world resilience の質的向上 / 6/19 公開前は contingency v2 で代替可）

### 4.5 制約担保

- API call $0（chaos injector mock + orchestrator mock）
- 副作用 0（OS tmp + afterEach cleanup）
- R25 Dev-SS / Dev-TT file は import せず独立

---

## §5 推奨候補比較 + 採択 priority

### 5.1 3 候補比較 matrix

| 観点 | 5-B (HITL × hardguards 拡張) | 5-C (breach-counter 1B longrun) | 5-D (cross-orchestrator chaos) |
|---|---|---|---|
| 工数 (dev hands-on) | 6.0-7.0h | 7.5-8.5h + longrun 12-16h | 7.0-7.5h |
| tests 数 | 10-12 | 6-8 | 9-11 |
| baseline 補完性 | 高（R24 第 4 弾の 12 tests を直接拡張） | 中（heartbeat 1M を breach-counter 1B に複製） | 中（R25 第 1 弾 chaos 系統の追加） |
| 5-A 並列実施 | OK | OK | OK |
| 6/19 公開前 timeline 適合性 | 高（R27+ 1 round で完遂可） | 低（longrun 24-30h wallclock） | 中（R27+ 1 round で完遂可） |
| harness 想定 | 836 → 846-848 (+10-12) | 836 → 842-844 (+6-8) | 836 → 845-847 (+9-11) |
| R26 並列実施可否 | OK | longrun は別 wallclock 必要 | OK |

### 5.2 推奨候補 = 5-B

**根拠**:
1. **R24 第 4 弾の質的補完**: HITL × hardguards 12 tests の matrix 拡張 = W4 完成度の構造的向上
2. **工数中程度**: 6-7h = R27+ 1 round で完遂可能
3. **6/19 公開前 timeline 適合**: longrun 不要 / hands-on 工数のみで完結
4. **5-A との独立性**: claude-bridge 層を touch せず harness 内で完結 = 並列実施安全

### 5.3 第 2 推奨 = 5-D

**根拠**: cross-orchestrator chaos は R25 第 1 弾の延伸として自然 / 工数 7-7.5h で 9-11 tests = 効率良 / R28 想定で物理化可。

### 5.4 第 3 推奨 = 5-C

**根拠**: 1B longrun は構造的に重要だが wallclock 24-30h = 6/19 公開前 timeline での緊急性低い / R29+ または公開後 stabilization 期間で実施推奨。

---

## §6 R27+ 物理化想定 timeline

### 6.1 R26-R29 候補配置（推奨）

| Round | 担当想定 | 物理化対象 | 工数 |
|---|---|---|---|
| R26 | Dev-VV | 5-A (claude-bridge integration e2e) | 6.5-8h |
| R27 | Dev-YY | **5-B (HITL × hardguards 拡張) ← 推奨** | 6-7h |
| R28 | Dev-ZZ | 5-D (cross-orchestrator chaos) | 7-7.5h |
| R29+ | Dev-AAA | 5-C (1B longrun) ※ scheduled longrun 枠 | 7.5-8.5h + longrun |

### 6.2 W4 完成累計予測

| 状態 | tests | 累計 |
|---|---|---|
| R24 完遂時点 | 42 (R22 第 1+2 弾 + Sec longrun + R23 第 3 弾 + R24 第 4 弾) | 42 |
| R26 5-A 完遂後 | +12-15 | 54-57 |
| R27 5-B 完遂後 | +10-12 | 64-69 |
| R28 5-D 完遂後 | +9-11 | 73-80 |
| R29+ 5-C 完遂後 | +6-8 | 79-88 |

→ W4 累計 **+88% 増加可能性**（5-A〜5-D 全実施時）

---

## §7 制約遵守 status

| 制約 | 遵守 status |
|---|---|
| harness 836 PASS / openclaw-runtime 394 PASS 維持 | **達成**（本書面で実改変 0 件） |
| API 追加コスト $0 | **達成** |
| 副作用 0 | **達成**（reports 配下 1 file 新規追加のみ） |
| 絵文字 0 | **達成** |
| R22 Dev-JJ/HH/KK / R23 Dev-MM / R24 Dev-QQ / R25 Dev-SS/TT historical baseline absolute 無改変 | **達成** |
| Phase 1 移行済 file absolute 無改変 | **達成** |
| 4 control 実装 absolute 無改変 | **達成** |
| fix forward-only 厳守 | **達成** |
| 物理化 file は R27+ 想定（R26 では起案しない） | **達成** |
| 5-A (R26 Dev-VV 物理化中) との file 名衝突なし | **達成**（5-B/C/D 各々独立 path） |

---

## §8 結語

W4 完成第 5 弾候補を 5-A 以外で 3 件探索。**5-B = HITL × hardguards 拡張** を **推奨** とし、第 2 推奨 5-D / 第 3 推奨 5-C で R27-R29 の物理化 timeline を提案。3 候補すべて 5-A と並列実施可能で、harness baseline / API 制約 / 副作用 0 担保。本書面は spec のみ、物理化は R27+ Dev-YY/ZZ/AAA 担当で実行。

R26 Dev-VV の 5-A 物理化と並列で本 5-B〜5-D の base spec を提供することで、Phase 2 W5 着手前後の Dev 部署活動を 4 候補 stack で支える。
