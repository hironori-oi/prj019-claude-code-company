# Dev-X Round 18 W2 第 1 弾レポート (3 control 担当)

**担当**: Dev-X
**スコープ**: Round 18 第 1 弾 = C-OC-03 / C-OC-04 / P-UI-02 の W2 化 (3 control)
**領域不可侵**: P-UI-04 / P-UI-05 / P-UI-09 / HITL-10 (Dev-Y 担当) は不変
**date**: 2026-05-05

---

## 1. W2 spec scope (Dev-X 第 1 弾 範囲)

W2 段階の本質 = 「W1 までで各 control が単独で動く」のはあたりまえとして、**control 間 chain / 整合 invariants** を定式化し vitest で機械検証する。

3 control の W2 invariant を以下 11 項目で定義した:

| # | Invariant | 領域 |
|---|-----------|------|
| I-1 | C-OC-03 major diff → C-OC-04 EscalationInputSchema 適合 (zod) | chain shape |
| I-2 | C-OC-03 soft-fail → C-OC-04 escalation を呼ばない | chain gating |
| I-3 | C-OC-03 patch / minor のみ → escalation を呼ばない | chain gating |
| I-4 | major detect → escalation 成功 → phaseGateBlocked=true (full chain) | end-to-end |
| I-5 | C-OC-04 phaseGateBlocked は P-UI-02 cooldown 評価を不変にする (purity) | state independence |
| I-6 | P-UI-02 trigger='kill_switch' 直後は必ず active (expired にならない) | cooldown semantics |
| I-7 | P-UI-02 re-trigger は最後勝ち (remaining リセット) | cooldown semantics |
| I-8 | C-OC-04 ackDeadline (1h) と P-UI-02 cooldown window (30s) は独立タイムライン | timeline |
| I-9 | C-OC-03 fixture_corrupted throw は escalation を呼ばない | error gating |
| I-10 | contractRunId が escalationId に伝搬する (trace 連続性) | trace |
| I-11 | P-UI-02 override は C-OC-04 phaseGateBlocked を解除しない (責務分離) | state independence |

**W2 では実装に手を加えない方針** — 11 invariants はすべて W1 完成版 Public API のみで検証可能であり、test file 内の pure helper `projectMajorDiffsToEscalation` (ContractOutput → EscalationInput projection) で chain を表現できた。Public API 変更ゼロで W2 invariant が成立することを確認したのが本ラウンドの主成果。

---

## 2. 追加ファイル

- `app/openclaw-runtime/src/controls/__tests__/17day-path-w2-3ctrl.test.ts` (約 280 行 / 11 tests / 新規)

実装本体 (`c-oc-03-*.ts` / `c-oc-04-*.ts` / `p-ui-02-*.ts`) は **無変更**。

---

## 3. テスト結果

### 3.1 W2 単独実行
```
src/controls/__tests__/17day-path-w2-3ctrl.test.ts (11 tests) — PASS
Test Files: 1 passed (1) / Tests: 11 passed (11)
```

### 3.2 フル suite (regression check)
```
Test Files: 25 passed (25)
Tests: 377 passed (377)
```
- baseline: 366 PASS (Round 17 完了時点)
- 今回追加: +11 W2 tests
- 既存テスト regression: **0 件**

### 3.3 TypeScript strict 検証
- W2 test file (`17day-path-w2-3ctrl.test.ts`): TS error **0 件**
- 既存 `p-ui-09-rls-checklist.ts` に TS6133 (未使用変数 `ctx`) が **pre-existing** で 1 件残存 — Dev-Y 担当領域なので Dev-X は触らない (領域不可侵遵守)。Round 18 第 2 弾 Dev-Y の責務として申し送り。

---

## 4. 各 invariant の test 名 (vitest 実出力)

```
W2 invariant — C-OC-03 → C-OC-04 chain shape & gating
  ✓ I-1: major diff detected → projection conforms to EscalationInputSchema
  ✓ I-2: soft-fail → no escalation (chain MUST NOT trigger C-OC-04)
  ✓ I-3: only patch / minor diffs → no escalation
  ✓ I-4: major diff → escalation success → phaseGateBlocked=true (full chain)
  ✓ I-9: fixture_corrupted throw → chain aborts before escalation
  ✓ I-10: contractRunId propagates to escalationId (trace continuity)

W2 invariant — C-OC-04 ↔ P-UI-02 timeline & state independence
  ✓ I-5: phaseGateBlocked does not perturb cooldown evaluation (purity)
  ✓ I-8: ackDeadline (1h) is far beyond cooldown nextAllowedAt (30s)
  ✓ I-11: P-UI-02 override does NOT unblock C-OC-04 phaseGateBlocked

W2 invariant — P-UI-02 cooldown trigger semantics
  ✓ I-6: kill_switch trigger at t=abortedAt → state must be active (never expired)
  ✓ I-7: re-trigger resets remaining time (last-write-wins)
```

---

## 5. blocker / 申し送り

- **blocker: なし**。Round 18 W2 第 1 弾 (3 ctrl) は完遂。
- **Dev-Y への申し送り**: `p-ui-09-rls-checklist.ts:122` の `ctx` 未使用変数 (TS6133) は Dev-Y 領域のため未修正。第 2 弾 4 ctrl 化と同時に解消されたい。
- **W3 (将来) への持ち越し示唆**:
  - C-OC-03 fixtureLoader と C-OC-04 reArmHook を CronCreate に実 binding する live-integration 段階は W3 の本番 wiring で扱う。
  - P-UI-02 と P-UI-04 (kill-switch) の cooldown ↔ kill-token の同時発火順序は **Dev-Y 第 2 弾の領域** (p-ui-04 を含むため Dev-X では検証しない)。

---

## 6. Public API 不変性

W2 化に伴う Public API 変更:

| ファイル | 変更 |
|---|---|
| `c-oc-03-api-contract-test.ts` | 無変更 |
| `c-oc-04-breaking-change-escalation.ts` | 無変更 |
| `p-ui-02-cooldown-modal.ts` | 無変更 |
| `index.ts` (barrel) | 無変更 |

**結論**: Public API は W1 から完全に不変。W2 invariants は全て test 層に閉じ込めた。
