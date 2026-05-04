# Dev-Y — PRJ-019 Round 18 W2 4ctrl 完遂レポート

- 担当: Dev-Y (parallel 第 2 弾)
- 対象: p-ui-04 / p-ui-05 / p-ui-09 / hitl-10 の W2 化 (cross-control invariants)
- 日付: 2026-05-05
- 領域不可侵: c-oc-03 / c-oc-04 / p-ui-02 (Dev-X 領域) には触れていない

## 1. Cross-control invariants 設計

W2 で確立した 3 invariant (+ 1 派生):

| ID | invariant | 実装 port |
|----|-----------|---------|
| I1 | p-ui-04 kill-switch fired → p-ui-05 rollback NOT triggered (kill is terminal) | `KillTerminalSink` (p-ui-04) ↔ `KillTerminalQuery` (p-ui-05 evaluateAndAct opts.killQuery) |
| I2 | hitl-10 permission denied (rejected/timeout) → p-ui-09 RLS checklist must include audit trail entry | `PermissionAuditSink` (hitl-10 opts.auditSink) ↔ `RlsAuditTrail` (p-ui-09 ctx.auditTrail) |
| I3 | p-ui-05 rollback completed → p-ui-09 RLS verify post-rollback state | `PostRollbackNotifier` (p-ui-05 opts.postRollback) ↔ `ctx.postRollback` flag (p-ui-09 output.postRollback) |
| X1 | (派生) kill terminal は post-rollback notify よりも先行する (rollback そのものが起動しないので notifier も発火しない) | I1 の副次効果として保証 |

設計原則:
- **後方互換**: W1 既存テスト 21 件は無変更で全 PASS。新 port は全て optional で省略時 W1 と同一挙動
- **Pure DI**: 副作用は外部委譲 (sink / notifier / query)、関数本体は zod parse + 状態遷移のみ
- **Terminal latch monotonicity**: `KillTerminalSink` は markFired/markVerified どちらでも `isActive=true` を維持 (down-grade 不可)

## 2. 実装変更点 (4 ファイル)

### 2.1 `p-ui-04-kill-switch-propagation.ts`
- 追加: `KillTerminalSink` interface + `createKillTerminalSink()` factory
- 追加: `KillBroadcasterOptions.killTerminalSink?`
- 結線: 空 pidTree path / fired path / verified path / partial・failed path で sink を更新
- `markFired` は terminal latch (verified に格上げされても active=true 維持)

### 2.2 `p-ui-05-anomaly-rollback.ts`
- 追加: `KillTerminalQuery` (isActive / lastReason)
- 追加: `PostRollbackNotifier` (onRollbackCompleted)
- 追加: `EvaluateAndActOptions` (killQuery + postRollback) を `evaluateAndAct` 第 5 引数に optional 追加
- I1: `confirmed_consecutive_breach_pending_rollback` 後に `killQuery.isActive()` を check し、true なら `rollback_skipped_kill_terminal:<reason>` を返却 (executor 呼出 0)
- I3: rollback ok 時 `postRollback.onRollbackCompleted({loopId, targetCommit})` を await

### 2.3 `p-ui-09-rls-checklist.ts`
- 追加: `RlsAuditEntrySchema` (source/kind/ticketId/detail/recordedAt) + `RlsAuditTrail` interface + `createRlsAuditTrail()` factory
- 追加: `RlsContextOptions` (auditTrail + postRollback) を `runRlsChecklist` 第 4 引数に optional 追加
- output schema 拡張: `auditTrailCount` + `postRollback` (両 optional, 既存テストは無変更で通過)
- abort path / 通常 return 両方で auditTrailCount + postRollback を反映

### 2.4 `hitl-10-permission-change.ts`
- 追加: `PermissionAuditSink` interface (recordDecision)
- 追加: `PermissionApprovalOptions` (auditSink) を `requestPermissionApproval` 第 6 引数に optional 追加
- I2: 終局判定 (approved / rejected / timeout) の各 return 直前で `auditSink.recordDecision(...)` を呼出
- pending state は終局でないため記録しない
- W1 の SLA 計時 (`now()` 2 回呼出) は変更なし — recordedAt は `nowAfter` を再利用

## 3. 新規テストファイル

`src/controls/__tests__/17day-path-w2-4ctrl.test.ts` (約 350 lines, 17 tests)

| describe block | tests | 用途 |
|----------------|-------|------|
| W2 invariant I1 — kill terminal blocks p-ui-05 rollback | 5 | propagateKill→sink 反映, sink→evaluateAndAct skip, end-to-end, W1 後方互換, latch monotonicity |
| W2 invariant I2 — hitl-10 denial → p-ui-09 audit trail entry | 6 | rejected→denied, timeout→denied, approved→approved, p-ui-09 audit count surface, end-to-end propagation, W1 後方互換 |
| W2 invariant I3 — rollback completed → post-rollback RLS verify | 5 | notifier 発火, 失敗時非発火, postRollback flag, end-to-end RLS run, W1 後方互換 |
| W2 cross-invariant — kill terminal precedence | 1 | I1 が postRollback notifier より先行することを保証 |
| 計 | **17** |  |

## 4. 実行結果

```
$ npx vitest run --reporter=basic
 Test Files  26 passed (26)
      Tests  394 passed (394)
   Duration  2.04s
```

- baseline (Round 17 完遂時点): 24 files / 366 tests
- Round 18 後 (Dev-X w2-3ctrl 11 tests + Dev-Y w2-4ctrl 17 tests): 26 files / 394 tests
- 純増: **+28 tests** (うち Dev-Y 寄与 = **17**)
- W1 既存テスト (`17day-path-w1-residual.test.ts` 21 件 + `17day-path-7ctrl.test.ts` 29 件): 全 PASS、regression 0

```
$ npx tsc --noEmit
(no output → strict typecheck clean)
```

## 5. 領域不可侵の確認

`git diff --stat` 上の変更ファイル:
- `src/controls/p-ui-04-kill-switch-propagation.ts` ✓ Dev-Y
- `src/controls/p-ui-05-anomaly-rollback.ts` ✓ Dev-Y
- `src/controls/p-ui-09-rls-checklist.ts` ✓ Dev-Y
- `src/controls/hitl-10-permission-change.ts` ✓ Dev-Y
- `src/controls/__tests__/17day-path-w2-4ctrl.test.ts` (新規) ✓ Dev-Y

Dev-X 領域 (c-oc-03 / c-oc-04 / p-ui-02 / 17day-path-w2-3ctrl.test.ts) は **未触**。

## 6. 既知のフォロー / W3 への申し送り

- 現状 `RlsAuditTrail` の `record` は idempotent ガードを実装していない (重複 ticketId+kind 受け入れ可)。実運用で multi-source flooding 懸念があれば W3 で `seen: Set<string>` を内部に持つ実装に差替推奨
- I3 の post-rollback RLS verify は呼出側責務 (notifier の中で `runRlsChecklist` を呼ぶ pattern) として実装。W3 で harness 連動時に「自動的に matrix 全 run」する orchestrator 層を p-ui-09 と別 module で組む案あり
- HITL-10 の `pending` state は audit に流していない (= 終局でないため)。CEO/Review が pending を可視化したい場合は別の `inflight_sink` を W3 で追加する余地あり
- p-ui-04 markFired 後の verified への遷移時、現在は `lastReason` を上書きする。CEO 監査要件で「初回 fire 理由を保持したい」場合は immutable first-write semantics に切替検討

## 7. blocker

無し。Round 18 W2 第 2 弾 4ctrl 着地完了。Round 19 W3 (harness 統合 + e2e) への引継ぎ可能。
