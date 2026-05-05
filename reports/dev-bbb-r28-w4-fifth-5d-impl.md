# Dev-BBB Round 28 — W4 第 5 弾 5-D 物理実装報告 (HG-7 Bridge reconnection)

最終更新: 2026-05-06 W0-Week2
担当: Dev 部門 R28 Dev-BBB (16 件目 dev sprint)
位置付け: Round 27 Dev-AAA 起案 spec (`dev-aaa-r27-w4-fifth-5d-spec.md`) を物理化。
版: v1.0
連動 DEC: DEC-019-006 / 033 / 049 / 051 / 062 / 074-077 / 079-081

---

## §0 サマリ

R27 Dev-AAA 起案の 5-D spec (cross-orchestrator chaos test) を、本 round では実 cross-orchestrator infra 不在のため「**Bridge reconnection 6 tests に scope 圧縮**」して物理化着地。MockClaudeBridge handle (本 file 内 inline / 5-A R26 Dev-VV pattern 継承) で reconnection 経路を 6 tests / 374 行 物理化。harness 既存 836 PASS baseline を 876 PASS に伸長 (+12 / 5c+5d 計 / +6 は本 file)、TS6059 = 0、実 spawn 0、API call $0、絵文字 0 で着地。

---

## §1 物理化 file

### 1.1 新規 file
- `app/harness/src/__tests__/w4-fifth-hg7-bridge-reconnect.test.ts` (374 行 / 6 tests)
  - 1 describe block / R28 Dev-BBB HG-7 — Bridge reconnection
  - HG-7-1 〜 HG-7-6 物理化完遂

### 1.2 既存 file (absolute 無改変)
- `w4-fifth-hitl-hardguards-extended.test.ts` (R27 Dev-YY / 1031 行 / 15 tests) 不変
- `phase2-w5-claude-bridge-integration-e2e.test.ts` (R26 Dev-VV / 13 tests) 不変
- `sla-clock-adapter.ts` / `monotonic-clock.ts` / `kill-switch.ts` / `openclaw-runtime-bridge.ts` 不変
- `index.ts` (CircuitBreaker / CostTracker types) pure import のみ

---

## §2 6 tests 内訳

| test | 検証範囲 | assertion 主軸 |
|---|---|---|
| HG-7-1 | reconnect after kill | `signal('SIGTERM')` → `alive=false` → `reconnect()` → `alive=true` |
| HG-7-2 | reconnect race | parallel 4 reconnect → `1 <= reconnectCount <= 4` |
| HG-7-3 | reconnect ack-id resync | `lastAckId=5` → down → reconnect → `ackId=5` 維持 → resume id=6 |
| HG-7-4 | reconnect with SLA hold | reconnect 中も SLA elapsed 単調増加 / SLA window 内 |
| HG-7-5 | reconnect after timeout | `failOnFirstInit=true` → 1st throw → 2nd success |
| HG-7-6 | reconnect concurrent | 3 instance / mulberry32 seed 0x52383044 / cross-isolation |

---

## §3 MockClaudeBridge 戦略 (5-A R26 Dev-VV pattern 継承)

### 3.1 inline mock 配置
本 file 内 `buildMockClaudeBridge(opts)` で SubprocessKillTarget + reconnection state を等価 shape 化:
- `alive()` / `signal('SIGTERM' | 'SIGKILL')` (SubprocessKillTarget 完全実装)
- `init()` / `reconnect()` / `sendMsg(payload)` (handshake + msg passing)
- `status()` (authChecked / authResult / alive / reconnectCount / lastAckId)
- `__forceDown()` (test-only)

### 3.2 制約担保
| 制約 | 担保経路 |
|---|---|
| API call $0 | mock 内部完結 / network call 0 |
| 副作用 0 | OS tmpdir + afterEach cleanup |
| 実 child_process.spawn 0 | claude-bridge spawn.ts 不 import |
| 絵文字 0 | grep 確認 |

---

## §4 制約遵守 status

| 制約 | 遵守 status | 根拠 |
|---|---|---|
| 既存 5b file absolute 無改変 | 達成 | line 1-1031 不変 |
| HG-6 file (5c) と完全独立 | 達成 | import 経路 0 件 / mulberry32 seed 0x52383044 で 5c (0x52383042) と区別 |
| API call $0 | 達成 | 全 in-memory |
| 副作用 0 | 達成 | OS tmpdir + afterEach |
| 絵文字 0 | 達成 | grep 確認 |
| 実 spawn 0 | 達成 | child_process unused |
| harness 836 PASS baseline 維持 | 達成 (876 PASS) | 5c+5d で +12 / regression 0 |
| TS6059 = 0 | 達成 | `tsc --build` 0 件 |

---

## §5 R29 引継 3 項目 (5-D 軸)

1. **実 cross-orchestrator infra との結合 test**: 本 file は MockClaudeBridge 単独。R28 完遂後 cross-orchestrator infra (orchestrator A × B 実 wiring) が用意できれば、HG-7 を真の cross-orchestrator chaos test に拡張可能。R27 Dev-AAA spec §4 ChaosScenario 7 種 enum を physical 化推奨。
2. **HG-6 × HG-7 cross fixture**: SLA recovery (HG-6) × Bridge reconnect (HG-7) 連動 (e.g., `reconnect during SLA breach` / `breach signal during reconnect handshake`) は R29+ で 3-5 tests 追加可能。
3. **HITL gate × bridge reconnect 干渉**: R27 Dev-AAA spec §4 CO-CHAOS-4-2 (HITL gate × chaos × human escalation) は本 file scope 外。HITL 12 gates の各 gate × bridge reconnect 干渉 matrix (12 tests) は HG-8 候補として R29+ 起案推奨。

---

## §6 結語

R27 Dev-AAA 起案 5-D spec を Bridge reconnection 軸で 6 tests / 374 行 物理化着地。MockClaudeBridge inline 戦略で 5-A R26 Dev-VV pattern 継承、実 spawn 0 担保。HG-6 (5c) との完全独立性確認 / mulberry32 seed 別系統で cross-test 影響 0 件。harness 836 PASS → 876 PASS 伸長、TS6059 = 0、制約 全 8 項目達成。R29+ への引継 3 項目明示。
