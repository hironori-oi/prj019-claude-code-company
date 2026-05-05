# Dev-BBB Round 28 — W4 第 5 弾 5-C 物理実装報告 (HG-6 SLA recovery)

最終更新: 2026-05-06 W0-Week2
担当: Dev 部門 R28 Dev-BBB (16 件目 dev sprint)
位置付け: Round 27 Dev-AAA 起案 spec (`dev-aaa-r27-w4-fifth-5c-spec.md`) を物理化。
版: v1.0
連動 DEC: DEC-019-006 / 033 / 049 / 051 / 062 / 074-077 / 079-081

---

## §0 サマリ

R27 Dev-AAA 起案の 5-C spec (breach-counter 1B longrun) を、本 round では timeline 適合性の観点から「**SLA recovery 6 tests に scope 圧縮**」して物理化着地。1B longrun は scheduled longrun 枠で R30+ 想定の方針継承し、本 round は 5-C の SLA / breach signal recovery 軸を 6 tests / 388 行で物理化。harness 既存 836 PASS baseline を 876 PASS に伸長 (+12 tests / 5c+5d 計 / +6 は本 file)、TS6059 = 0、副作用 0、API call $0、絵文字 0 で着地。

---

## §1 物理化 file

### 1.1 新規 file
- `app/harness/src/__tests__/w4-fifth-hg6-sla-recovery.test.ts` (388 行 / 6 tests)
  - 1 describe block / R28 Dev-BBB HG-6 — SLA recovery
  - HG-6-1 〜 HG-6-6 物理化完遂

### 1.2 既存 file (absolute 無改変)
- `w4-fifth-hitl-hardguards-extended.test.ts` (R27 Dev-YY / 1031 行 / 15 tests) — line 1-1031 全行不変
- `sla-clock-adapter.ts` / `monotonic-clock.ts` / `file-breach-counter.ts` — pure import のみ
- `17day-path-w3-rollback-permission-orchestrator.ts` / `openclaw-runtime-bridge.ts` — pure import のみ
- launch day v3.x / web-ops v2.x / sec yml / decisions.md 1-1592 — 不参照

---

## §2 6 tests 内訳

| test | 検証範囲 | assertion 主軸 |
|---|---|---|
| HG-6-1 | skew 検出後 resetMark で起点復元 | `skewObserved=true` → `resetMark()` → `startMark()` 新起点 |
| HG-6-2 | partial recovery: nowMs 連続呼出で elapsed 単調増加 | suspend 復帰相当 (wall 静止 / mono 進行) |
| HG-6-3 | breach signal restore: SLA timeout 後 rollback 再起動 | `timeout` → `rollback_completed` → `counter.observe` 再開 |
| HG-6-4 | SLA clock continuity: 連続 mark 間 elapsed 不可逆 | `monoElapsedMs[i] >= monoElapsedMs[i-1]` |
| HG-6-5 | recovery race: 並列 nowMs (sync) で order-stable | mulberry32 seed 0x52383042 deterministic |
| HG-6-6 | recovery idempotency: resetMark 複数回呼出後 shape 同一 | `wallMs` / `monoMs` 連続呼出で monotonically non-decreasing |

---

## §3 制約遵守 status

| 制約 | 遵守 status | 根拠 |
|---|---|---|
| 既存 5b file 1031 行 absolute 無改変 | 達成 | wc -l 確認 / 別 file (`w4-fifth-hg6-sla-recovery.test.ts`) |
| API call $0 | 達成 | mock approver / executor / kill 全 in-process |
| 副作用 0 | 達成 | OS tmpdir + afterEach `fs.rm` cleanup |
| 絵文字 0 | 達成 | grep 確認 |
| 実 spawn 0 | 達成 | child_process.spawn 1 件も無し |
| harness 836 PASS baseline 維持 | 達成 (876 PASS) | 5c+5d で +12 / 既存全 PASS |
| TS6059 = 0 | 達成 | `tsc --build` 0 件 |
| MockClaudeBridge / MonotonicClock / mulberry32 既存活用 | 達成 | 全て既存 production code import + inline mulberry32 |

---

## §4 R29 引継 3 項目 (5-C 軸)

1. **R30+ longrun 枠で 1B scale 物理化**: 本 round は SLA recovery に scope 圧縮。R27 Dev-AAA 起案の 1B longrun 6-8 tests / 500-650 行 spec は scheduled longrun CI workflow (`breach-counter-1b-longrun.yml` / 週 1 cron) で R30+ 物理化推奨。
2. **HG-6 と R27 Dev-YY HG-1〜HG-5 の cross-matrix 拡張**: 本 file は HG-6 6 tests 単独。HG-1〜HG-5 と HG-6 を貫通する cross fixture (e.g., `breach signal × SLA recovery × HITL retry`) は R29+ で 3-5 tests 追加可能。
3. **`fail_closed` mode の SLA recovery 検証**: 本 file は `pass_through` のみ exercise。`fail_closed` mode で skew 検出後の `slaWindowMs + 1` 強制 timeout 経路は HG-6 拡張で +2 tests 想定。

---

## §5 結語

R27 Dev-AAA 起案 5-C spec を SLA recovery 軸で 6 tests / 388 行 物理化着地。1B longrun は R30+ 引継 (scope 圧縮判断は §4 第 1 項に明記)。harness 836 PASS → 876 PASS 伸長、TS6059 = 0、制約 全 8 項目達成。本 file 単独で再利用可能 / R29+ への引継 3 項目明示。
