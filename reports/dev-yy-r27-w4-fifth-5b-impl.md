# Dev-YY Round 27 — W4 第 5 弾 5-B (HITL × hardguards 拡張) 物理実装報告書

最終更新: 2026-05-05 W0-Week1
起案: Dev 部門 R27 Dev-YY (W4 第 5 弾 5-B = HITL × hardguards 拡張 物理実装担当)
位置付け: Round 26 Dev-XX 5-B 候補 spec + Dev-VV 5-B candidate spec 起案を受け、Round 27 で物理実装完遂。
版: v1.0
連動 DEC: DEC-019-006 / 033 / 041 / 049 / 051 / 062 / 068 / 074-077 / 079
連動 spec / 親書 (絶対無改変保護):
- `projects/PRJ-019/reports/dev-xx-r26-w4-fifth-5b-candidates.md` (R26 Dev-XX / 5-B 推奨候補 spec)
- `projects/PRJ-019/reports/dev-vv-r26-w4-fifth-candidate-spec.md` (R26 Dev-VV / 14-18 tests / 5-6 groups 規模 spec)
- `projects/PRJ-019/reports/ceo-v27-round26-9parallel-completion.md` (CEO v27 §8 ③ 引継)

---

## §0 サマリ (CEO 200 字)

W4 完成第 5 弾 5-B = **HITL × hardguards 拡張** を Round 27 で物理実装完遂。R26 Dev-XX `dev-xx-r26-w4-fifth-5b-candidates.md` の推奨候補 5-B (HITL × hardguards 拡張 / 10-12 tests / 4 groups) を、R26 Dev-VV `dev-vv-r26-w4-fifth-candidate-spec.md` の規模 (5-6 groups / 14-18 tests / 600-800 行) に拡張する形で **5 groups / 15 tests / 1031 行** の test file を新規追加。**harness 849 → 864 PASS (+15)** / openclaw-runtime 394 PASS 維持 / regression 0 件。R23 Dev-MM / R24 Dev-QQ / R25 Dev-SS / Dev-TT / R26 Dev-VV historical baseline absolute 無改変。API call $0 / 副作用 0 (OS tmp + afterEach cleanup) / 絵文字 0 / 制約全完遂。Round 28 Dev-BBB 引継 3 項目: ①5-D 物理化 (cross-orchestrator chaos / Dev-XX spec §4) ②W4 累計 79 tests baseline JSON 起票 ③INDEX-v15 / W4 第 5 弾 5-B 由来 entry 追加。

---

## §1 物理実装着地概要

### 1.1 新規追加 file

| 観点 | 値 |
|---|---|
| file path | `app/harness/src/__tests__/w4-fifth-hitl-hardguards-extended.test.ts` |
| 行数 | 1031 行 |
| groups | 5 (HG-1 / HG-2 / HG-3 / HG-4 / HG-5) |
| tests | 15 |
| 命名 | R27 Dev-YY 推奨 = HITL × hardguards 軸明示 + 5 弾位置付け明示 |

### 1.2 harness PASS 数値

| state | tests | files |
|---|---|---|
| R27 着手前 (R26 完遂時) | **849 PASS** | 65 files |
| R27 Dev-YY 完遂後 (本書起案時) | **864 PASS (+15)** | 66 files |
| openclaw-runtime | **394 PASS** (維持 / regression 0) | 26 files |

regression 検出: **0 件**

---

## §2 groups + tests 設計 (5 groups / 15 tests)

### 2.1 Group HG-1 — HITL × additional hardguard matrix (3 tests)

R24 第 4 弾が G-02 / G-10 を中心に carry した分の補完として、G-XX (G-03 / G-08 / G-09 / G-12) と HITL の残 7 gates の matrix を吸収。

| test ID | 検証内容 | 結果 |
|---|---|---|
| HG-1-1 | HITL 残 4 gates × G-03 / G-08 / G-09 / G-12 matrix all valid | OK |
| HG-1-2 | HITL gate timeout (24h SLA 越境) × G-07 fail-fast (control_chars) → fail-fast 優勢 | OK |
| HG-1-3 | HITL gate decision pending × G-05 SIGTERM 経路 → gate cancel 連動 | OK |

### 2.2 Group HG-2 — HITL retry × breach counter (3 tests)

HITL gate retry の各ステップが breach counter にどう反映されるかを 3 ケース (累積 / 上限超過 trip / 2nd success reset) で網羅。

| test ID | 検証内容 | 結果 |
|---|---|---|
| HG-2-1 | HITL gate retry 3 回 × breach counter increment 3 件累積 | OK |
| HG-2-2 | HITL gate retry 上限超過 (4 回) × breach counter threshold trip → rollback_completed | OK |
| HG-2-3 | HITL gate retry success on 2nd × breach counter reset | OK |

### 2.3 Group HG-3 — HITL cooldown × SIGTERM escalation (3 tests)

| test ID | 検証内容 | 結果 |
|---|---|---|
| HG-3-1 | HITL gate cooldown active × hardguard SIGTERM → gate skip / 副作用 0 | OK |
| HG-3-2 | HITL gate cooldown 残時間 5s × hardguard grace 10s → gate 解除 | OK |
| HG-3-3 | HITL gate cooldown 衝突 (5 回連続) → SIGKILL escalation (rollback_failed_kill_switch_armed) | OK |

### 2.4 Group HG-4 — cross-matrix consistency (3 tests)

| test ID | 検証内容 | 結果 |
|---|---|---|
| HG-4-1 | HITL × hardguards 拡張 matrix の summary log 整合性 (3 gates × 3 hardguards) | OK |
| HG-4-2 | HITL × hardguards consensus state 復元 (FileBreachCounter persist / process A → B) | OK |
| HG-4-3 | HITL × hardguards × breach counter 三重 nested fire scenario | OK |

### 2.5 Group HG-5 — fail-open / fail-closed 完全網羅 (3 tests)

R24 第 4 弾の補完 edge: hardguards の fail-open / fail-closed mode を gate matrix で網羅。

| test ID | 検証内容 | 結果 |
|---|---|---|
| HG-5-1 | hardguards fail-open mode (破損 jsonl + counter fail-open) × HITL 12 gates 全 approved | OK |
| HG-5-2 | hardguards fail-closed mode (4 種 invalid reason) × HITL 12 gates 連鎖 reject | OK |
| HG-5-3 | HITL × hardguards 全段 audit log 整合 (rejected reason chain ordering / 12 件 ledger record) | OK |

---

## §3 制約遵守 status

| 制約 | 遵守 status | 検証根拠 |
|---|---|---|
| harness 849 PASS / openclaw-runtime 394 PASS 維持 (前 round baseline) | OK 達成 | harness 864 (+15) / openclaw-runtime 394 維持 |
| 既存 W4 W5 file md5 不変厳守 | OK 達成 | 新規 file 1 件追加のみ / 既存 file 0 件改変 |
| API 追加コスト $0 | OK 達成 | parser / mock / pure helper のみ / network 0 |
| 副作用 0 | OK 達成 | OS tmp (`os.tmpdir()/r27-dev-yy-`) + afterEach `fs.rm` |
| 絵文字 0 | OK 達成 | 全 file ASCII + 日本語のみ / emoji 0 件 |
| R20-R26 historical baseline absolute 無改変 | OK 達成 | 既存 R22-R26 file は import のみ / 改変 0 件 |
| Phase 1 移行済 file absolute 無改変 | OK 達成 | openclaw-runtime / claude-bridge production code 改変 0 件 |
| 4 control 実装 absolute 無改変 | OK 達成 | controls/* に touch 0 件 |
| fix forward-only 厳守 | OK 達成 | 新規 file 追加のみ / revert 0 件 |
| harness PASS regression 絶対 0 | OK 達成 | 65 files → 66 files (+1) / 既存 file の test 全件 PASS 維持 |
| 物理化 file 命名衝突 0 | OK 達成 | `w4-fifth-hitl-hardguards-extended.test.ts` = unique |

---

## §4 実装の主要技術的判断

### 4.1 file 名選定: `w4-fifth-hitl-hardguards-extended.test.ts`

ユーザー指示で 2 候補 (`phase2-w5-stream-json-fuzz-chaos.test.ts` / `w4-fifth-hitl-hardguards-extended.test.ts`) のいずれかを選択する形で示されていた。本実装は **HITL × hardguards 拡張** が主軸 (Dev-XX spec 推奨候補 5-B) であり、stream-json fuzz とは異なる scope。よって後者を採用、unique 命名で衝突 0。

### 4.2 enum / fixture の独立宣言

R23 Dev-MM / R24 Dev-QQ historical baseline file (`17day-path-w4-hitl-gates-integration.test.ts` / `17day-path-w4-hitl-hardguards-cross.test.ts`) からの import を行わず、HITL 12 gate enum / mock helpers / makeStartupRecord 等を本 file 内で独立再宣言。これにより baseline file の touch を完全回避。

### 4.3 R24 の 4 groups (X1-X4) への重複回避

R24 Dev-QQ 既存 12 tests (X1-1〜X4-2) と test ID prefix (HG-1〜HG-5) を区別し、内容も R24 cell pick から離した補完軸 (G-XX × HITL 残 7 gates / fail-open / fail-closed / retry / cooldown / nested fire) のみを carry。

### 4.4 fail-open / fail-closed 軸の追加 (HG-5)

Dev-XX spec の 4 groups (HG-1-HG-4 / 10-12 tests) に対し、Dev-VV spec の 5-6 groups / 14-18 tests レンジに合わせるため **HG-5 = fail-open / fail-closed 完全網羅** を新規追加。R24 第 4 弾の補完 edge を完全網羅し、CI 上の robustness 確証を追加。

### 4.5 production code の絶対無改変

`createOpenClawRuntimeBridge` / `createFileBreachCounter` / `createMonotonicClock` / `createSlaClockAdapter` / hardguards / `createPermissionOrchestrator` / `createRollbackOrchestrator` を全て pure import のみ。production code 0 行改変。

---

## §5 R27 完遂による W4 累計試算

| 観点 | R26 完遂時 | R27 完遂時 (本書) | Δ |
|---|---|---|---|
| W4 累計 tests (R22-R27) | 58 (R22 第 1+2 弾 + Sec-Q + R23 第 3 弾 + R24 第 4 弾 + R26 5-A) | **73** (上記 + R27 5-B 15) | **+15** |
| harness PASS | 849 | **864** | +15 |
| 物理 file 件数 (W4 系列) | 6 | **7** | +1 |
| HITL × hardguards coverage | R24 4 groups 12 tests | **R24 + R27 9 groups 27 tests** | +5 groups / +15 tests |

W4 累計 +26% 増加 / HITL × hardguards 軸単独で +125% 増加。

---

## §6 Round 28 Dev-BBB 引継 3 項目

| # | 内容 | 工数想定 | 担当想定 |
|---|---|---|---|
| ① | **5-D 物理化** (cross-orchestrator chaos / Dev-XX spec §4 / 9-11 tests / 4 groups CO-CHAOS-1〜4) | 7-7.5h | Dev-BBB |
| ② | **W4 累計 73-79 tests baseline JSON 起票** (harness 864-867 PASS / W4 系列 7+ files / Sec baseline v1.5 連動) | 1.5-2h | Sec-V または後続 Sec |
| ③ | **INDEX-v15 への 5-B 由来 entry 追加** (PAT-XXX 候補 / fail-open / fail-closed pattern + retry × breach counter pattern + cooldown × SIGTERM pattern) + DEC-019-XYZ 起案 (W4 完成最終宣言議決を踏まえた 5-D も含む 5 弾完成宣言) | 2-2.5h | Knowledge-V または PM-T |

---

## §7 制約遵守チェックリスト最終確認

- [x] R23 Dev-MM / R24 Dev-QQ / R25 Dev-SS / Dev-TT / R26 Dev-VV 物理 file absolute 無改変 (改変 0 行)
- [x] R22 Dev-JJ / Dev-KK / Sec-Q historical baseline absolute 無改変
- [x] claude-bridge / openclaw-runtime / harness production code 無改変
- [x] API call $0 / 副作用 0 / 絵文字 0
- [x] 物理化 file 1 件 (`w4-fifth-hitl-hardguards-extended.test.ts`) のみ新規追加
- [x] 既存 W4 完成第 1-4 弾 + W5 第 1+2+3 弾 regression 0 件
- [x] Sec baseline v1.4 / cron-audit / cron-conflict 不変厳守 (本実装は touch 0)

---

## §8 結語

W4 完成第 5 弾 5-B (HITL × hardguards 拡張) を Round 27 で物理実装完遂。**harness 849 → 864 PASS (+15) / 5 groups / 15 tests / 1031 行**。R26 Dev-XX 推奨候補 spec + Dev-VV 規模 spec を統合し、R24 第 4 弾の補完 edge (G-XX × HITL 残 7 gates / fail-open / fail-closed / retry / cooldown / nested fire) を完全網羅。openclaw-runtime 394 PASS 維持 / regression 0 件 / 制約全完遂。

Round 28 Dev-BBB 引継 3 項目を §6 に提示。W4 完成 5 弾累計 7+ files / 73+ tests = +26% 規模に到達し、6/19 公開前 timeline / 6/3 W5 着手 readiness 100% を維持して進行可能。
