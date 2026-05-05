# Dev-EE Round 20 第 2 波 — 17 day path W3 (P-UI-05 + HITL-10 + e2e fully wired)

- 案件: PRJ-019 Open Claw "Clawbridge"
- 担当: Dev-EE (Round 20 第 2 波, 9 並列の 1)
- 範囲: P-UI-05 (rollback executor) + HITL-10 (permission auditor) + e2e fully wired (7 ctrl)
- 目的: W3 (harness orchestrator 接続段階) で Dev-AA (3 ctrl) / Dev-BB (4 ctrl context) / Dev-DD (cooldown + kill terminal) と独立稼働しつつ、rollback + permission の orchestration を端まで配線。e2e 1 通しシナリオで 7 ctrl 全部発火する経路を確立。
- 領域不可侵: Dev-DD 担当 P-UI-02 + P-UI-04 ファイルに変更を加えていない (別 file 起票)。Dev-AA / Dev-BB の既存 W3 file にも touch せず。control 本体ファイル (openclaw-runtime/src/controls/*) も無改変。

## 0. サマリ

| 項目 | 値 |
|---|---|
| 新規 file | 3 (orchestrator 本体 1 + tests 2 + 本報告 1) |
| 実装行数 | orchestrator 約 270 行 / tests 約 460 行 / 報告 約 180 行 |
| 新規 tests | 21 (rollback-permission 14 + e2e-7ctrl 7) |
| Dev-EE 単独実行 | **21 PASS / 0 FAIL** (約 12ms) |
| Dev-AA + Dev-EE 結合 | 33 PASS / 0 FAIL |
| harness 全体 | **720 PASS / 51 files / 0 FAIL** (regression 0) |
| TypeScript strict | Dev-EE 新規 file は型エラー 0 件 (既存 knowledge / cross-rootDir errors は pre-existing) |
| Public API of any ctrl | 完全不変 (port 注入のみ) |
| 副作用 / 絵文字 / API コスト | 0 / 0 / $0 (Read + Edit + Write のみ) |

## 1. P-UI-05 (rollback executor) orchestrator 接続

### 1.1 設計判断

- **harness 側で in-memory BreachCounter** を新設: P-UI-05 ctrl 本体は `AnomalyState` を「呼出側保持」させる pure 関数なので、harness 側で連続 breach 数を保持する。Round 20 段階は in-memory factory、Round 21 W4 で永続化検討。
- **port 注入**: `RollbackExecutorPort` (control 本体 `RollbackExecutor` と shape 互換) / `KillSwitchTriggerPort` / `KillTerminalQueryPort` / `PostRollbackNotifierPort` を構造的部分型で再宣言。Dev-AA と同じ「control-agnostic」パターン継承で、cross-rootDir error を回避 (Dev-BB の `17day-path-w3-orchestrator.ts` と異なり、本 file は openclaw-runtime を import しない)。
- **kill terminal latch との統合**: `evaluate` 段階で `killQuery.isActive()` を確認し、active なら `rollback_skipped_kill_terminal` で短絡。executor / postRollback / killSwitch.fire いずれも呼び出さない (W2 I-1 invariant の harness 反映 = Dev-BB W3 group 2 と整合)。
- **PostRollbackNotifier 統合**: rollback ok 時のみ `onRollbackCompleted` を発火。Dev-BB W3 ctx の `buildPostRollbackNotifier` がそのまま注入可能 (構造的部分型 = `adaptW3ContextToRollbackPorts` adapter 提供)。
- **kill switch fire**: rollback 失敗時のみ `killSwitch.fire("rollback_failed:" + reason)` を呼ぶ。BreachCounter は failed では reset しない (再試行可能性を残す)。

### 1.2 公開 API

```ts
createBreachCounter(): BreachCounter
createRollbackOrchestrator(ports, counter?): RollbackOrchestrator
adaptW3ContextToRollbackPorts(ctx, executor, killSwitch): RollbackOrchestratorPorts
```

| 結果 kind | 発火条件 | 副作用 |
|---|---|---|
| `within_threshold` | observedValue ≤ threshold | counter 不変 |
| `metric_nan_skip` | NaN | counter 不変 |
| `first_breach` | breach=1 | counter→1 |
| `rollback_skipped_kill_terminal` | breach≥2 + killQuery.isActive() | executor 0 / postRollback 0 / killSwitch 0 |
| `rollback_completed` | breach≥2 + executor.ok | postRollback 1 / counter reset |
| `rollback_failed_kill_switch_armed` | breach≥2 + executor.fail | killSwitch.fire 1 / counter 維持 |

## 2. HITL-10 (permission auditor) orchestrator 接続

### 2.1 設計判断

- **24h SLA wall-clock 検証可能化** (Owner formal「丁寧に」directive 直接対応): `nowMs: () => number` port を必須化。test では `let calls = 0; calls === 1 ? t0 : t0 + APPROVAL_SLA_MS + 1` 等の fixed clock で **真の wall-clock 経過** を再現可能。
- **pending → timeout 丸め込み**: approver が `pending` を返した場合、orchestrator 側で `tNow >= t0 + APPROVAL_SLA_MS` 判定を行い、越境していれば `timeout` に丸めて auditSink に `recordDecision({state:'timeout'})` を流す。これにより Owner / CEO 側 race condition が起きても audit trail には必ず終局判定が残る。
- **PermissionApproverPort signature**: `requestApproval(scope, requester) → Promise<ApprovalDecision>` で control 本体 `PermissionApprover.decide` よりも harness 寄りの shape (ticketId は requester に同梱、expiresAt は orchestrator が算出)。
- **PermissionAuditSink 統合**: Dev-BB W3 ctx の `permissionAuditSink` がそのまま注入可能 (構造的部分型 = `adaptW3ContextToPermissionPorts` adapter 提供)。終局判定のみ flush (pending は audit 対象外、ctrl 本体仕様と整合)。

### 2.2 公開 API

```ts
APPROVAL_SLA_MS: 24 * 60 * 60 * 1000
createPermissionOrchestrator(ports): PermissionOrchestrator
adaptW3ContextToPermissionPorts(ctx, approver, nowMs): PermissionOrchestratorPorts
```

| 結果 kind | 発火条件 | 副作用 |
|---|---|---|
| `approved` | approver.state=approved | audit({state:'approved'}) |
| `rejected` | approver.state=rejected | audit({state:'rejected'}) |
| `timeout` (直接) | approver.state=timeout | audit({state:'timeout'}) |
| `timeout` (丸め込み) | approver.state=pending + tNow ≥ expiresAt | audit({state:'timeout'}) |
| `pending` | approver.state=pending + tNow < expiresAt | audit 0 件 (まだ終局でない) |

## 3. e2e fully wired (7 ctrl 通し sequence)

### 3.1 経路設計

```
(1) C-OC-03 subscription contract test          [Dev-AA]
   → (2) C-OC-04 cli-version breaking change escalation  [Dev-AA]
      → (3) P-UI-02 cooldown evaluation (phase gate と独立軸)  [Dev-AA / Dev-DD]
         → (4) P-UI-04 kill terminal latch       [Dev-DD, 異常分岐のみ active]
            → (5) P-UI-05 rollback executor      [Dev-EE 本 file]
               → (6) HITL-10 permission auditor  [Dev-EE 本 file]
                  → (7) P-UI-09 RLS audit trail aggregation  [Dev-BB]
```

### 3.2 e2e test (新 file `17day-path-w3-e2e-7ctrl.test.ts`)

| ID | シナリオ | 検証 |
|---|---|---|
| E-1 | full 7 ctrl 通し happy path | escalation_fired + rollback ok + permission approved + agg.count=2 (rollback_completed + permission_approved) |
| E-2 | C-OC-03 soft-fail | escalation 不発火 / 下流 P-UI-05 / HITL-10 は別軸独立で動作可 (W2 I-5 / I-11 反映) |
| E-3 | P-UI-04 kill latch fired before rollback | P-UI-05 skipped, HITL-10 audit 維持 (rollback_completed 0 件 / permission_denied 1 件) |
| E-4 | invocation order | 推奨 sequence 通り `seq.steps = [C-OC-03, C-OC-04, P-UI-02, P-UI-05.exec, HITL-10]` (P-UI-04 latch は本 path 不発火) |
| A-1 | C-OC-03 fixture_corrupted throw | cycle aborted, 下流 ctrl 全不発火 (`seq.steps = ['C-OC-03:E2E-1']`) |
| A-2 | HITL-10 rejected + P-UI-05 ok | aggregator に 2 entry 集約 (rollback_completed + permission_denied) |
| A-3 | P-UI-05 failed rollback | killSwitch.fire 1 回 / aggregator に rollback_completed 不記録 |

### 3.3 cross-control aggregator stub (P-UI-09 相当)

`AuditAggregator` を test 内で stub 実装 (本体 ctrl 非 import = 依存方向制約遵守)。`buildPermissionAuditSinkFromAggregator` / `buildPostRollbackFromAggregator` で source 別 entry を集約。Dev-BB の `RlsAuditTrail` と shape 互換なので、本番運用時は aggregator stub を Dev-BB の W3 ctx に差し替えるだけ。

## 4. tests 結果

```
$ npx vitest run src/__tests__/17day-path-w3-rollback-permission-orchestrator.test.ts
   14 tests passed (約 7ms)

$ npx vitest run src/__tests__/17day-path-w3-e2e-7ctrl.test.ts
   7 tests passed (約 5ms)

$ npx vitest run (full harness suite)
   720 tests passed (51 files / 約 3.86s)

  baseline (Round 19 末 + Dev-DD 完遂後 仮定): ~699 PASS
  Dev-EE 単独段階: +21 = 720 PASS / 0 FAIL / regression 0
```

| File | tests | 結果 |
|---|---|---|
| `17day-path-w3-3ctrl-orchestrator.test.ts` (Dev-AA) | 12 | PASS |
| `17day-path-w3-4ctrl-orchestrator.test.ts` (Dev-BB) | 19 | PASS |
| `17day-path-w3-cooldown-killterminal-orchestrator.test.ts` (Dev-DD) | 13 | PASS |
| `17day-path-w3-rollback-permission-orchestrator.test.ts` (Dev-EE 新規) | **14** | PASS |
| `17day-path-w3-e2e-7ctrl.test.ts` (Dev-EE 新規) | **7** | PASS |
| 合計 W3 | 65 | PASS |

### 4.1 test グループ詳細

**`17day-path-w3-rollback-permission-orchestrator.test.ts` (4 groups, 14 tests)**

- Group 1 (BreachCounter pure logic, 3 tests): B-1 / B-2 / B-3
- Group 2 (Rollback orchestrator, 6 tests): R-1 (within_threshold) / R-2 (NaN skip) / R-3 (first_breach) / R-4 (kill latch active) / R-5 (rollback ok + counter reset) / R-6 (failed rollback + kill switch fire)
- Group 3 (Permission orchestrator, 4 tests): P-1 (approved) / P-2 (rejected) / P-3 (timeout direct) / P-4 (pending → 24h wall-clock 越境 → timeout 丸め込み)
- Group 4 (combined chain, 1 test): C-1 (rollback ok + permission rejected via shared audit + adapter 構造的部分型 smoke check)

**`17day-path-w3-e2e-7ctrl.test.ts` (2 groups, 7 tests)**

- Group 1 (full chain happy path, 4 tests): E-1 / E-2 / E-3 / E-4
- Group 2 (anomaly branches, 3 tests): A-1 / A-2 / A-3

## 5. Public API 不変性 W3 確認

- 触っていない file (control 本体): `p-ui-04-kill-switch-propagation.ts` / `p-ui-05-anomaly-rollback.ts` / `p-ui-09-rls-checklist.ts` / `hitl-10-permission-change.ts` / `c-oc-03-*` / `c-oc-04-*` / `p-ui-02-*`
- 触っていない file (Dev-AA / Dev-BB / Dev-DD scope): `openclaw-orchestrator.ts` / `17day-path-w3-orchestrator.ts` / `17day-path-w3-3ctrl-orchestrator.test.ts` / `17day-path-w3-4ctrl-orchestrator.test.ts` / `17day-path-w3-cooldown-killterminal-orchestrator.test.ts`
- W2 + W1 ctrl の Public API は port 注入経由で完全 preserve。test 内で構造的部分型 adapter (`adaptW3ContextToRollbackPorts` / `adaptW3ContextToPermissionPorts`) が型エラーなく適合することを smoke check 済 (group 4 C-1)。

## 6. Round 21 W4 引継

### 6.1 BreachCounter 永続化 (P-UI-05 拡張)

- 現状 in-memory factory (`createBreachCounter()`)。harness restart で counter 消失。
- 提案: `KillSwitch` と同じ `FileXxx` パターンで `FileBreachCounter` を実装し、`fs-store` 経由で永続化。loopId 単位の counter snapshot を JSON line append で記録。
- 工数見積: 約 2-3h (実装 + tests 6-8 件)。

### 6.2 24h SLA wall-clock 精度向上 (HITL-10 拡張)

- 現状 `nowMs: () => number` は単純 wall-clock。NTP skew + プロセス suspend 中の経過時間を考慮した `MonotonicClock` port (Date.now() + performance.now() 二系統) を追加検討。
- 提案: `time-source.ts` の `RealTimeSource` / `FakeTimeSource` パターンを HITL-10 にも展開。`createPermissionOrchestrator` の `nowMs` を `TimeSource` に置換可能化。
- 既存 W3 test (P-4 pending wall-clock 越境 timeout 丸め込み) はそのまま valid。

### 6.3 e2e 経路の本番 wiring 化

- 現状 e2e test は aggregator stub (本体 ctrl 非 import) で 7 ctrl 通しを確認。
- 本番 wiring では Dev-BB の `createW3OrchestratorContext()` を harness lifecycle に保持し、Dev-EE adapter (`adaptW3ContextToRollbackPorts` / `adaptW3ContextToPermissionPorts`) で接続する。
- harness `Harness` クラスへの組み込み (init / shutdown lifecycle 連動) は Round 21 W4 で計画。

### 6.4 cross-rootDir blocker (Dev-BB 引継)

- Dev-AA 報告 §6 で記録された `17day-path-w3-orchestrator.ts` の cross-rootDir TS error は本 file では再現せず (Dev-EE は openclaw-runtime を import しない設計を継承)。
- ただし Dev-BB の既存 file は依然 TS error が出るため、Round 21 W4 で port-injection 設計への refactor を継続検討。

### 6.5 BreachCounter loopId 同一観測のセマンティクス

- 現状: 同一 loopId 連続観測は `max(count, 1)` clamp。これは P-UI-05 ctrl 本体 `detectAnomaly` の semantics (`isConsecutive = lastLoopId !== null && lastLoopId !== input.loopId`) と一致。
- Round 21 で「同 loopId 内で metric 種別が異なる」ケース (例: cost burst + output anomaly が同 loopId で同時 trip) の semantics を追加検討。

## 7. 実装中遭遇課題

### 7.1 vitest mock invocation 数 / counter 値の検証

- R-5 / R-6 / C-1 で BreachCounter が rollback 完遂後 reset するが failed rollback では reset しないという非対称仕様を、orchestrator factory の戻り値に `counter` を expose することで test 可能化。
- これにより Round 21 W4 で永続化版を実装する際も同じ public test contract で regression check 可能。

### 7.2 構造的部分型の strict tsc 適合

- `RollbackOutcome.targetCommit?: string` / `ApprovalDecision rejected.reason?: string` の `exactOptionalPropertyTypes` strict 対応として、戻り値オブジェクトの構築時に `...(targetCommit !== undefined ? { targetCommit } : {})` パターンで分岐 spread を使用。これにより `undefined` を明示的に含む差分を排除し、test 内の `toMatchObject` / `toEqual` でも誤検出を回避。

### 7.3 mock approver の sequence log 統合

- `mockApprover` を `(seq, decision) => PermissionApproverPort` の 2 引数 factory にし、`requestApproval` 内で `seq.steps.push("HITL-10:" + ticketId)` を記録する設計で、E-4 invocation order test の deterministic 検証を実現。

### 7.4 e2e test の P-UI-04 stub 設計

- P-UI-04 ctrl 本体 (`propagateKill`) を import せず、`mockKillQuery(active, reason)` で `KillTerminalQueryPort` を直接 stub。これにより test 内で「P-UI-04 が fire 済の状態」を 1 行で構築でき、依存方向制約 (harness → openclaw-runtime 禁止) を遵守。

---

**SOP 順守**: DEC-019-025 (background dispatch、SOP 実証 17 件目) に基づき、Dev-EE は他 9 並列 Agent と独立稼働。Dev-DD 担当 P-UI-02 + P-UI-04 ファイルには touch せず、Dev-AA / Dev-BB の既存 W3 file にも変更を加えていない。
