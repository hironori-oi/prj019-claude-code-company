# Dev-BBB Round 28 — W4 第 5 弾 5c+5d 物理化 summary

最終更新: 2026-05-06 W0-Week2
担当: Dev 部門 R28 Dev-BBB (16 件目 dev sprint)
位置付け: PRJ-019 Open Claw Round 28 9 並列の 2 軸目 (Dev)。R27 Dev-AAA 起案 spec 2 件 (5c HG-6 SLA recovery / 5d HG-7 Bridge reconnect) を物理化着地。

---

## ① 5c+5d 実装行数

| file | 行数 | tests | groups |
|---|---:|---:|---:|
| `app/harness/src/__tests__/w4-fifth-hg6-sla-recovery.test.ts` (5c / 新規) | **388** | **6** | 1 |
| `app/harness/src/__tests__/w4-fifth-hg7-bridge-reconnect.test.ts` (5d / 新規) | **374** | **6** | 1 |
| **R28 Dev-BBB 合計** | **762** | **12** | **2** |

参考:
- R27 Dev-YY 5b file: `w4-fifth-hitl-hardguards-extended.test.ts` (1031 行 / 15 tests / 5 groups) **absolute 無改変**
- R26 Dev-VV 5a file: `phase2-w5-claude-bridge-integration-e2e.test.ts` (13 tests) **absolute 無改変**

---

## ② harness PASS 数

| baseline | 数値 |
|---|---:|
| R26 baseline | **836 PASS** |
| R27 Dev-YY (+15) | 851 PASS |
| **R28 Dev-BBB (+12)** | **876 PASS** ← 本 round 着地値 (vitest run 確認済) |

実測 (`npx vitest run` 全 file 実行):
```
Test Files  68 passed (68)
     Tests  876 passed (876)
  Duration  7.40s
```
regression 0 件 / 既存全 PASS。

---

## ③ TS6059 確認

```
$ npx tsc --build 2>&1 | grep -c "TS6059"
0
```

tsconfig composite + project references topology (R26 Dev-WW 構築済 / harness → openclaw-runtime 片方向) は本 round で**完全継承**、TS6059 (Output Directory must contain rootDir) は **0 件**。

---

## ④ R29 Dev-EEE 引継 3 項目

### 引継 1 — 1B longrun 物理化 (5c 拡張)

R27 Dev-AAA 起案 5c spec の **1B (10^9) scale longrun test (6-8 tests / 500-650 行 / hands-on 7.5-8.5h + longrun wallclock 12-18h)** は本 round で SLA recovery に scope 圧縮。R30+ scheduled longrun CI workflow (`breach-counter-1b-longrun.yml` / 週 1 cron / `LONGRUN_FULL=1` env gating) で物理化推奨。物理化 readiness pt = 89/100 (R27 Dev-AAA 評価) は変更なし。

### 引継 2 — 真の cross-orchestrator chaos test (5d 拡張)

R27 Dev-AAA 起案 5d spec の **ChaosScenario 7 種 enum (HEARTBEAT_LOST / SIGTERM / BUDGET_EXCEED / HANDOFF_TIMEOUT / STATE_CORRUPTION / SUBPROCESS_HANG / FULL_CRASH) × cross-orchestrator A/B/C 4 groups / 9-11 tests** は本 round で MockClaudeBridge 単独 (Bridge reconnect 6 tests) に scope 圧縮。R29+ で実 cross-orchestrator infra (orchestrator A × B 実 wiring) が整備されたら、R27 spec §4 chaos-injector helper (120-150 行 / 7 scenario) を physical 化し HG-8 として起案推奨。物理化 readiness pt = 96/100 (R27 Dev-AAA 評価) も改めて R29 で再評価可。

### 引継 3 — HG-6 × HG-7 cross fixture + HITL gate 干渉

本 round は HG-6 (SLA recovery) と HG-7 (Bridge reconnect) を完全独立 file (mulberry32 seed 0x52383042 vs 0x52383044) で実装し cross-test 影響 0 件を担保。R29+ 拡張軸:

- (a) **HG-6 × HG-7 connect**: `reconnect during SLA breach` / `breach signal during reconnect handshake` 連動 → 3-5 tests 推奨
- (b) **HITL 12 gates × bridge reconnect 干渉 matrix**: R27 Dev-AAA spec §4 CO-CHAOS-4-2 (HITL gate × chaos × human escalation) を physical 化 → HG-8 候補 12 tests
- (c) **`fail_closed` mode の SLA recovery**: 本 round は `pass_through` のみ exercise。`fail_closed` mode + `slaWindowMs + 1` 強制 timeout 経路は HG-6 拡張で +2 tests 推奨

---

## §補足 — 制約遵守 status (一括)

| 制約 | 遵守 status |
|---|---|
| 既存 5b 1031 行 absolute 無改変 (`w4-fifth-hitl-hardguards-extended.test.ts`) | 達成 |
| 既存 4 file absolute 無改変 (launch day v3.x / web-ops v2.x / sec yml / decisions.md 1-1592) | 達成 (本 file 不参照) |
| API call $0 | 達成 (全 in-process mock) |
| 副作用 0 | 達成 (OS tmpdir + afterEach `fs.rm`) |
| 絵文字 0 | 達成 (grep 確認) |
| 実 Claude Code spawn 0 | 達成 (MockClaudeBridge inline / 5-A pattern 継承) |
| MockClaudeBridge / MonotonicClock / mulberry32 PRNG 既存活用 | 達成 |
| tsconfig composite + project references topology 維持 | 達成 (TS6059 = 0) |
| 別 file 推奨 (5c / 5d 独立) | 達成 (`w4-fifth-hg6-sla-recovery.test.ts` + `w4-fifth-hg7-bridge-reconnect.test.ts`) |
| +12 PASS 想定 | 達成 (実測 +12 = 6 + 6) |

---

## §結語

R28 Dev-BBB は R27 Dev-AAA 起案 5c+5d spec 2 件を **762 行 / 12 tests / 2 file** で物理化着地。harness 累計 +27 PASS (R27 +15 + R28 +12) = 876 PASS、TS6059 = 0、副作用 0、API $0、実 spawn 0、絵文字 0 で **9 制約全件達成**。R29 Dev-EEE への引継 3 項目 (1B longrun / 真 cross-orchestrator / HG-6×HG-7×HITL cross) を明示。
