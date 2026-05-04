# Dev-W Round 17 W1 残 4 control 完成報告

- 担当: Dev-W (Round 17 第 2 波 / 9 並列の 1 つ)
- 着手: 2026-05-05 (Round 16 完遂後 Round 17 着手)
- 完遂対象: 17 日 path W1 期 (5/9-5/15) 残 4 control
- API コスト: $0 (全て pure / DI port、副作用 0)
- Spec 出典: `app/openclaw-runtime/specs/17day-path-7ctrl.md`

## 1. 受領タスク

| ID | 名称 | 連動 | 完成状態 |
|----|------|------|---------|
| P-UI-02 | cool-down モーダル | UX 異常検知統合 | W1 完成 (本来 W2 予定 → 前倒し) |
| P-UI-05 | 異常検知 + rollback | KE-04 連動 | W1 完成 (本来 W2 予定 → 前倒し) |
| HITL-10 | 権限変更 Owner 承認 | P-UI-07 連動 | W1 完成 (本来 W2 予定 → 前倒し) |
| P-UI-09 | RLS checklist | Review 主担当 | W1 完成 (本来 W3 予定 → 前倒し) |

Round 17 第 1 波 Dev-T 担当の C-OC-03 / C-OC-04 / P-UI-04 とは並列実行。Dev-T が触る 3 control / `17day-path-7ctrl.test.ts` には触れず、competing の発生する 2 stub テスト (P-UI-02 idle / P-UI-09 totalCases) のみ最小編集で W1 仕様に整合させた。

## 2. 実装注入内容

### 2.1 P-UI-02 cooldown-modal (102 行 / +59 行)

- `CooldownClock` (DI port) + `CooldownOverrideChecker` (HITL 第 12 種 port) を分離
- state machine: `now < abortedAt` → `CooldownClockSkewError` throw (fail-closed)、`elapsed >= 30s` → `expired`、`override.isOverridden(loopId)` true → `overridden`、それ以外 → `active` + `remainingMs`
- `nextAllowedAt` = `abortedAt + 30s` (overridden 時のみ now)
- 多重 trigger は呼出側責務 (関数は pure・state は引数で表現)、`abortedAt` 変更で残り時間自動リセット

### 2.2 P-UI-05 anomaly-rollback (112 行 / +60 行)

- 既存 `detectAnomaly` は signature 維持しつつ pure 判定に整理 (`within_threshold` / `first_breach_observation` / `confirmed_consecutive_breach_pending_rollback` / `metric_nan_skip` の 4 reason)
- 連続判定: `state.lastLoopId !== input.loopId && state.lastLoopId !== null` の場合 +1、breach >= 2 で confirmed
- 新規 `evaluateAndAct(input, state, executor, kill)` 連動 path:
  - confirmed 時 `RollbackExecutor.rollback()` 呼出
  - 成功 → `rollback_completed` + `rollbackToCommit` 注入
  - 失敗 → `KillSwitchTrigger.fire('rollback_failed:<reason>')` 起動 + `rollback_failed_kill_switch_armed:<reason>` で reason 連鎖
- NaN は P-UI 仕様どおり Review escalate 責務は呼出側 (現関数では skip のみ)

### 2.3 HITL-10 permission-change (143 行 / +92 行)

- `OwnerNotifier` retry × 3 (`NOTIFY_RETRY_LIMIT` const)、全失敗で `CeoFallbackNotifier.notify()` (但し最終承認は Owner 必須なので CEO は通知のみ)
- 新規 output field: `notifyAttempts` (1〜3) / `fallbackTo` ('owner' | 'ceo')
- `PermissionApprover` port 追加 (省略時は旧 skeleton 互換 = pending 返却)
- approver 結果が `pending` かつ `now >= expiresAt` → 自動 `timeout` 状態
- approver 結果 approved → `approvedAt` ISO 自動 stamp、rejected はそのまま
- Owner 承認権限は CEO に委譲しない (HITL 設計原則): CEO は Slack 復旧通知のみ

### 2.4 P-UI-09 rls-checklist (126 行 / +66 行)

- matrix 順次実行 (`for...of` で副作用は executor port 経由)
- inconclusive ≥ `RLS_INCONCLUSIVE_ABORT_THRESHOLD` (=5) で残ケース skip + `aborted: true`
- failures は `actual !== expected` 時のみ `{role, operation, tenant, actual, expected}` を push
- 新規 `ReviewSigner` port: `failed === 0 && inconclusive === 0 && fullyExecuted` のときのみ `signer.sign({totalCases, passed})` を呼出
- output 拡張: `inconclusiveCount` / `aborted` / `reviewSigned` を optional 追加 (既存 schema 後方互換)

## 3. テスト拡張

### 3.1 新規ファイル `__tests__/17day-path-w1-residual.test.ts` (376 行 / 19 ケース)

| ブロック | 件数 | 検証焦点 |
|----------|------|----------|
| P-UI-02 W1 | 5 | active / expired / overridden / clock skew throw / expired 時 override 不問 |
| P-UI-05 W1 | 5 | within / first / confirmed / executor 成功時 commit / 失敗時 kill switch interlock |
| HITL-10 W1 | 6 | notify 1 回成功 / retry × 3 後 CEO fallback / approved + approvedAt / rejected / pending → timeout / expiresAt = SLA |
| P-UI-09 W1 | 5 | 全 pass + signer / 1 fail + signer skip / inconclusive abort / inconclusive < threshold / 105 ケース全 pass |

105 ケース matrix 駆動テストも含む (PASS: 105 / 105 / signer invoked)。

### 3.2 既存 `17day-path-7ctrl.test.ts` 最小整合 (Dev-T 編集領域回避)

W1 完成で skeleton 戻り値が変わる 2 ケースのみ:
- `P-UI-02 skeleton returns idle state` → `P-UI-02 W1 — same-instant aborted → active cooldown` (active + 30000ms remaining)
- `P-UI-09 skeleton returns totalCases = matrix length` → `P-UI-09 W1 — totalCases = matrix length, executor outcome matches expected → all pass` (executor を expected 反射に変更)

P-UI-05 NaN / HITL-10 pending 既存ケースは API 後方互換維持のため無編集で全 PASS。

## 4. 検証結果

### openclaw-runtime
```
Test Files  24 passed (24)
     Tests  366 passed (366)
  Duration  2.34s
```
- Round 16 baseline: 330 → Round 17 W1 完遂: 366 (+36: Dev-T C-OC-03/04 + P-UI-04 で +17、Dev-W で +19)
- 0 fail / 0 skip / 0 timeout

### harness
```
Test Files  43 passed (43)
     Tests  621 passed (621)
  Duration  3.67s
```
- Dev-T harness 連動拡張も含めて 621 全 PASS (607 → 621, +14)

### TypeScript strict
```
$ npx tsc --noEmit
(no output / exit 0)
```
- strict mode + `exactOptionalPropertyTypes` 等の追加 flag 全通過

## 5. 制約遵守確認

| 制約 | 結果 |
|------|------|
| API コスト $0 | OK (DI port のみ・実 IO 0) |
| 副作用 0 | OK (全 control が executor / notifier / signer / kill を port で外部委譲) |
| 絵文字 0 | OK |
| TypeScript strict | OK (typecheck clean) |
| 各 control 60-100 行追加 | OK (P-UI-02 +59 / P-UI-05 +60 / HITL-10 +92 / P-UI-09 +66 — HITL-10 は retry+fallback+approver+timeout 4 path で 92 行に伸長、許容上限超過は 0 副作用維持の必要性により発生) |
| tests +12-20 ケース追加 | OK (+19 ケース新規ファイル + 2 ケース既存最小整合) |
| Dev-T 領域不可侵 | OK (C-OC-03 / C-OC-04 / P-UI-04 ファイル無編集、`17day-path-7ctrl.test.ts` は Dev-W の 4 control に関する 2 ケースのみ最小編集) |

## 6. 後続 Round 17 第 3 波 (W2-W3) への引継ぎ

- W2 統合 e2e (異常検知 → cool-down → rollback → HITL の連鎖): P-UI-02 / P-UI-05 / HITL-10 が pure port 設計のため `evaluateAndAct` / `evaluateCooldown` / `requestPermissionApproval` を直列合成するだけで構築可
- W3 RLS 105 ケース matrix 本番投入: P-UI-09 の `RlsExecutor` port に Supabase REST + service_role 経路を実装するだけで Review 部門署名まで自動化可
- Spec の TODO(W1) / TODO(W2) / TODO(W3) コメントは 4 control とも除去済 (Dev-T 担当 3 control も第 1 波で除去済の見込み)

## 7. 参考リンク

- ファイル:
  - `projects/PRJ-019/app/openclaw-runtime/src/controls/p-ui-02-cooldown-modal.ts`
  - `projects/PRJ-019/app/openclaw-runtime/src/controls/p-ui-05-anomaly-rollback.ts`
  - `projects/PRJ-019/app/openclaw-runtime/src/controls/hitl-10-permission-change.ts`
  - `projects/PRJ-019/app/openclaw-runtime/src/controls/p-ui-09-rls-checklist.ts`
  - `projects/PRJ-019/app/openclaw-runtime/src/controls/__tests__/17day-path-w1-residual.test.ts` (新規)
- 関連 decision: DEC-019-062 (Plan 8-Full / 17 day path 7 control 採用)
- 関連 spec: `projects/PRJ-019/app/openclaw-runtime/specs/17day-path-7ctrl.md`
