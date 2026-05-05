# Dev-XX Round 26 — Phase 2 W6 着手準備 spec（W5 第 1+2+3 弾完遂後の W6 移行）

最終更新: 2026-05-05 W0-Week1
起案: Dev 部門 R26 Dev-XX（補完 dev / 9 並列体制 9 番目）
位置付け: Phase 2 W5 第 1+2 弾達成（R25 / harness 836 PASS）+ W5 第 3 弾 5-A R26 物理化完遂後の W6 着手 spec。6/3 Phase 2 W5 正式着手前の W5→W6 移行経路と W6 第 1 弾候補を物理化レベル準備。
版: v1.0
連動 DEC: DEC-019-006 / 041 / 049 / 062 / 074-077 / 079
連動 baseline:
- W5 第 1 弾: `phase2-w5-cross-orchestrator-e2e.test.ts`（R25 Dev-SS / 754 行 / 12 tests）
- W5 第 2 弾: `phase2-w5-cross-package-extension.test.ts`（R25 Dev-TT / 613 行 / 8 tests）
- W5 第 3 弾 (5-A): `phase2-w5-claude-bridge-integration-e2e.test.ts`（R26 Dev-VV / 700-850 行想定 / 12-15 tests）
- W4 完成累計 54-57 tests（R26 5-A 完遂後想定）

---

## §0 サマリ（CEO 200 字）

W5 第 1+2+3 弾完遂後（R26 着地時点 = harness 848-851 PASS 想定）の Phase 2 W6 着手 spec を物理化レベル準備。**W6 主軸 = Phase 2 で W5 cross-package + bridge 統合を踏まえた production stabilization layer**。W6 第 1 弾候補 = **operational hardening e2e**（real-world failure pattern × 完全復旧経路 / 8-10 tests）/ 第 2 弾候補 = **performance regression baseline**（heartbeat / breach-counter / cost-tracker 3 軸の latency baseline 確定）/ 第 3 弾候補 = **multi-tenant isolation e2e**（複数 project 並列実行下の cross-contamination 0 化検証）。**W6 着手 readiness pt = 87/100**（W5 完遂依存 / DEC-019-079 採決依存 / Phase B-2 物理化依存）= R28 着手見込（6/10 想定）。harness baseline 848-851 → 870-880 想定（+22-29）で W6 完成見込。

---

## §1 W5 完遂前提 + W6 着手 trigger

### 1.1 W5 完遂状態（R26 着地時点 想定）

| 弾 | 担当 | 物理化状態 | tests | 行数 |
|---|---|---|---|---|
| 第 1 弾 | R25 Dev-SS | **完遂** | 12 | 754 |
| 第 2 弾 | R25 Dev-TT | **完遂** | 8 | 613 |
| 第 3 弾 (5-A) | R26 Dev-VV | R26 完遂見込 | 12-15 | 700-850 |
| **W5 累計** | - | - | **32-35** | **2067-2217** |

### 1.2 W6 着手 trigger 4 条件

| # | trigger | 検証時点 | satisfy 見込 |
|---|---|---|---|
| T1 | W5 第 1+2+3 弾完遂（32-35 tests） | R26 完遂時 | Y |
| T2 | DEC-019-079 採決（Phase 2 W5 着手宣言 + ARCH-01 Phase B-2 supersede） | 5/26 統合採決 | Y 強化 |
| T3 | ARCH-01 Phase B-2 物理実装完遂（TS6059 5 件 → 0 件） | R26 Dev-WW 完遂時 | Y 条件付 |
| T4 | harness 848-851 PASS / openclaw-runtime 394 PASS 維持 | R26 完遂時 | Y |

→ T1-T4 全 satisfy 見込で R28（6/10 想定）W6 着手 readiness Y

### 1.3 W6 着手 timing

| date | event |
|---|---|
| 5/12 | Round 26 完遂着地（5-A + B-2 物理化完遂） |
| 5/19 | 統合採決 4 件（DEC-074-077） |
| 5/19-5/26 | Round 27（W4 第 5 弾 5-B + Phase B-2 完遂検証 + INDEX-v15）|
| 5/26 | 統合採決 2 件（DEC-078+079）|
| 5/26-6/2 | Round 28（W4 第 5 弾 5-D 候補 + W6 第 1 弾 spec 起案）|
| 6/2 | DEC-019-079 採決 |
| **6/3 火** | **Phase 2 W5 正式着手**（決定済 milestone）|
| 6/3-6/10 | Round 29（W5 stabilization + W6 第 1 弾準備）|
| **6/10 想定** | **Phase 2 W6 着手**（本書面 spec） |

---

## §2 W6 主軸 + 第 1 弾候補 3 件

### 2.1 W6 主軸の位置付け

W5 で達成した cross-package + bridge 統合を踏まえ、**production stabilization layer** が W6 の主軸。具体的には:

1. real-world failure pattern × 完全復旧経路の e2e 検証
2. performance regression baseline の確定
3. multi-tenant isolation の cross-contamination 0 化検証

### 2.2 W6 第 1 弾候補 3 件比較

| 候補 | tests | 工数 | 優先度 | 6/19 timeline 適合性 |
|---|---|---|---|---|
| 候補 W6-A: operational hardening e2e | 8-10 | 6-7h | **高** | 高 |
| 候補 W6-B: performance regression baseline | 6-8 | 5-6h + measurement runs | 中 | 中 |
| 候補 W6-C: multi-tenant isolation e2e | 7-9 | 7-8h | 中 | 中-低 |

**第 1 弾推奨 = 候補 W6-A**（operational hardening e2e）

---

## §3 候補 W6-A — operational hardening e2e（推奨）

### 3.1 概要

**目的**: real-world で発生する failure pattern（network partition / disk full / OOM / cascading failure 等）に対する完全復旧経路を e2e で検証し、6/19 公開当日の anomaly 対応を物理 test 化で担保。

### 3.2 groups + tests 設計（4 groups / 8-10 tests）

#### Group OH-1（network partition × cross-orchestrator 復旧, 2-3 tests）
| test ID | 検証内容 |
|---|---|
| OH-1-1 | orchestrator A → B 通信断 (5s) × heartbeat fallback × auto-resume |
| OH-1-2 | claude-bridge ↔ harness 通信断 × dryRun bypass で test 継続 |
| OH-1-3 (optional) | 多段 partition (A↔B + A↔bridge) × 全段復旧 |

#### Group OH-2（disk / IO 障害 × graceful degradation, 2-3 tests）
| test ID | 検証内容 |
|---|---|
| OH-2-1 | journal write 失敗 (disk full simulation) × in-memory fallback |
| OH-2-2 | breach-counter checkpoint 失敗 × replay from previous state |
| OH-2-3 (optional) | OS tmp 削除 mid-run × test cleanup graceful |

#### Group OH-3（OOM / resource exhaustion, 2 tests）
| test ID | 検証内容 |
|---|---|
| OH-3-1 | heartbeat queue OOM simulation × backpressure trigger |
| OH-3-2 | cost-tracker memo cache 上限到達 × LRU eviction 確認 |

#### Group OH-4（cascading failure × full recovery, 2 tests）
| test ID | 検証内容 |
|---|---|
| OH-4-1 | A 障害 → B fallback → bridge 障害 → 全段 SIGTERM → graceful shutdown |
| OH-4-2 | 障害解消 → 全段 re-init → state replay → consistent recovery |

**合計**: 4 groups / **8-10 tests**

### 3.3 物理化想定

- 物理化 file: `app/harness/src/__tests__/phase2-w6-operational-hardening-e2e.test.ts`
- 行数想定: 600-750
- 工数: 6-7h
- R28-R29 想定で物理化（DEC-079 採決後 + Phase 2 W5 着手後）

### 3.4 制約担保

- API call $0（全 failure injection は mock 経路）
- 副作用 0（OS tmp + afterEach cleanup）
- W5 第 1+2+3 弾 file は import せず独立

---

## §4 候補 W6-B — performance regression baseline（第 2 推奨）

### 4.1 概要

**目的**: heartbeat / breach-counter / cost-tracker 3 軸の latency baseline を統計的に確定し、R30+ で performance regression を自動検出する基準を確立。

### 4.2 groups + tests 設計（3 groups / 6-8 tests）

#### Group PB-1（heartbeat latency baseline, 2-3 tests）
| test ID | 検証内容 |
|---|---|
| PB-1-1 | heartbeat 100k loop / p50 / p99 / max 計測 |
| PB-1-2 | heartbeat 1M loop / CV < 0.3 / RSS growth < 50% |
| PB-1-3 (optional) | heartbeat parallel 4 worker × cross-worker latency consistency |

#### Group PB-2（breach-counter latency baseline, 2 tests）
| test ID | 検証内容 |
|---|---|
| PB-2-1 | breach-counter 1M increment / p50 / p99 / max |
| PB-2-2 | breach-counter checkpoint 100 件 / save/restore latency |

#### Group PB-3（cost-tracker latency baseline, 2-3 tests）
| test ID | 検証内容 |
|---|---|
| PB-3-1 | cost-tracker checkBudget 10k 回 / latency baseline |
| PB-3-2 | cost-tracker incrementCost 10k 回 / latency baseline |
| PB-3-3 (optional) | cost-tracker 並列 100 contender × budget consistency |

**合計**: 3 groups / **6-8 tests**

### 4.3 物理化想定

- 物理化 file: `app/harness/src/__tests__/phase2-w6-performance-regression-baseline.test.ts`
- 行数想定: 450-600
- 工数: 5-6h + measurement runs（CI 上 1-2h × 3 軸 = 3-6h）
- R29+ 想定

### 4.4 制約担保

- API call $0（全 measurement は in-process）
- 副作用 0（measurement output は OS tmp 経由 / afterAll で削除）

---

## §5 候補 W6-C — multi-tenant isolation e2e（第 3 推奨）

### 5.1 概要

**目的**: 複数 project（PRJ-019 + PRJ-016 + PRJ-017 等）の harness が並列実行された場合の cross-contamination 0 化を検証。

### 5.2 groups + tests 設計（3 groups / 7-9 tests）

#### Group MT-1（process isolation, 3 tests）
| test ID | 検証内容 |
|---|---|
| MT-1-1 | tenant A + B 並列 harness × 各々独立 process tree |
| MT-1-2 | tenant A SIGTERM × tenant B 不影響 |
| MT-1-3 | tenant A budget exceed × tenant B budget 独立 |

#### Group MT-2（state isolation, 2-3 tests）
| test ID | 検証内容 |
|---|---|
| MT-2-1 | tenant A heartbeat journal × tenant B journal 物理隔離 |
| MT-2-2 | tenant A breach counter × tenant B counter 独立 |
| MT-2-3 (optional) | tenant A HITL gate decision × tenant B gate 不影響 |

#### Group MT-3（resource isolation, 2-3 tests）
| test ID | 検証内容 |
|---|---|
| MT-3-1 | tenant A OS tmp 占有 1GB × tenant B 不影響 |
| MT-3-2 | tenant A cost-tracker 上限 × tenant B 独立予算 |
| MT-3-3 (optional) | tenant A claude-bridge dry-run × tenant B 並列 dry-run 独立 |

**合計**: 3 groups / **7-9 tests**

### 5.3 物理化想定

- 物理化 file: `app/harness/src/__tests__/phase2-w6-multi-tenant-isolation-e2e.test.ts`
- 行数想定: 550-700
- 工数: 7-8h
- R30+ 想定（公開後 stabilization 期間でも対応可）

---

## §6 W6 着手 readiness pt 算出

### 6.1 readiness 評価軸 10 件

| # | 評価軸 | 配点 | 現時点 score | 根拠 |
|---|---|---|---|---|
| 1 | W5 第 1+2 弾完遂 | 10 | **10** | R25 着地で達成（836 PASS）|
| 2 | W5 第 3 弾 (5-A) 物理化進捗 | 10 | **9** | R26 Dev-VV 物理化中 / 完遂見込 |
| 3 | DEC-019-079 採決状態 | 10 | **8** | DRAFT 起案完遂 / 5/26 採決見込 |
| 4 | Phase B-2 物理実装進捗 | 10 | **8** | R25 GO with conditions / R26 Dev-WW 物理化想定 |
| 5 | harness baseline 維持 | 10 | **10** | R25 着地 836 PASS 維持 |
| 6 | openclaw-runtime baseline 維持 | 10 | **10** | 394 PASS 維持 |
| 7 | W6 第 1 弾 spec 起案 | 10 | **9** | 本書面で 3 候補 spec 化済 |
| 8 | W6 第 1 弾担当決定 | 10 | **5** | R28 dispatch 時に確定 |
| 9 | 6/19 公開前 timeline 適合 | 10 | **9** | 6/10 着手見込 = 9 日 buffer |
| 10 | 制約遵守状況（API $0 / 副作用 0 / 絵文字 0） | 10 | **10** | 全 round 完全遵守 |
| **合計** | - | **100** | **87** | - |

### 6.2 W6 着手 readiness pt = **87/100**

**判定**: GO 条件付（DEC-079 採決 + Phase B-2 物理化完遂 + 担当決定の 3 条件 satisfy で 95+ 到達見込）

### 6.3 残 13 pt の収束経路

| pt | 収束 trigger | 想定 round |
|---|---|---|
| -1 (5-A 物理化) | R26 Dev-VV 完遂 | R26 |
| -2 (DEC-079) | 5/26 採決完遂 | R28 |
| -2 (B-2 物理化) | R26 Dev-WW 完遂 + Round 27 verify | R27 |
| -5 (第 1 弾担当) | R28 dispatch | R28 |
| -1 (timeline buffer) | R29 W5 stabilization 完遂 | R29 |
| -1 (W6 spec) | 第 1 弾 file 物理化前 spec 確定 | R28-R29 |

→ R29 完遂時に readiness 95+ 到達見込 → R30 W6 着手 GO

---

## §7 W6 完成想定 baseline

| 観点 | R26 着地 想定 | W6 完成時 想定 | Δ |
|---|---|---|---|
| harness PASS | 848-851 | **870-880** | +22-29 |
| W4 累計 tests | 54-57 | 54-57 | 0（W4 は固定）|
| W5 累計 tests | 32-35 | 32-35 | 0（W5 は固定）|
| W6 累計 tests | 0 | **22-29** | +22-29 |
| openclaw-runtime PASS | 394 | 394 | 0 |
| TS6059 fire 件数 | 0 | 0 | 0 |
| 物理 file 件数（W4+W5+W6） | 7 | **9-10** | +2-3 |

---

## §8 R28 引継 spec（Round 27 → Round 28）

### 8.1 R28 dispatch 想定 9 部署

| 部署 | Agent ID 想定 | 主要 task |
|---|---|---|
| PM | PM-T | DEC-080 起案 + 6/2 採決準備 |
| Dev | Dev-AAA | W4 第 5 弾 5-D 候補（cross-orchestrator chaos）物理化 |
| Dev | Dev-BBB | W6 第 1 弾 W6-A spec 詳細化 + 物理化 readiness |
| Dev | Dev-CCC | Phase B-2 完遂検証 + Phase B-3 候補探索 |
| Sec | Sec-V | T-5 R28 物理化第 2 弾 + 連続 13 round milestone |
| Knowledge | Knowledge-W | INDEX-v16（160+ entries） |
| Review | Review-S | R26-R28 trajectory + Round 29 GO 判定 |
| Marketing | Marketing-U | 6/19 confidence 92→94% → 96% trajectory |
| Web-Ops | Web-Ops-N | 6/3 Phase 2 W5 着手連動 deploy |

### 8.2 R28 完遂時想定

| 観点 | R28 完遂時 |
|---|---|
| harness PASS | 858-865 |
| W6 第 1 弾準備状態 | spec 完遂 + 担当決定 |
| W6 着手 readiness pt | 95+ |

---

## §9 制約遵守 status

| 制約 | 遵守 status |
|---|---|
| harness 836 PASS / openclaw-runtime 394 PASS 維持（本書面期間中） | **達成** |
| API 追加コスト $0 | **達成** |
| 副作用 0 | **達成**（reports 配下 1 file 新規追加のみ） |
| 絵文字 0 | **達成** |
| W5 第 1+2 弾 file absolute 無改変 | **達成** |
| W4 historical baseline absolute 無改変 | **達成** |
| Phase 1 移行済 file absolute 無改変 | **達成** |
| 4 control 実装 absolute 無改変 | **達成** |
| fix forward-only 厳守 | **達成** |
| 物理化 file は R28+ 想定（R26 では起案しない） | **達成** |

---

## §10 結語

Phase 2 W6 着手 spec を物理化レベル準備。**第 1 弾推奨 = W6-A operational hardening e2e**（8-10 tests / 6-7h / 6/19 公開前 timeline 適合）。第 2 推奨 = W6-B performance regression baseline / 第 3 推奨 = W6-C multi-tenant isolation e2e。**W6 着手 readiness pt = 87/100**（残 13 pt は R26-R29 で収束見込）= R30 W6 着手 GO 想定。harness baseline 848-851 → 870-880 想定（+22-29）で W6 完成見込。本書面は spec のみ、物理化は R28+ Dev-BBB 担当で実行予定。
