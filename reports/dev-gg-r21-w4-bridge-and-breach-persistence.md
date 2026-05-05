# Dev-GG Round 21 第 1 波 — 17 day path W4 (harness orchestrator 本番 wiring + BreachCounter 永続化)

- 案件: PRJ-019 Open Claw "Clawbridge"
- 担当: Dev-GG (Round 21 第 1 波, 9 並列の 1)
- 範囲: W4 task ① harness orchestrator 本番 wiring + W4 task ② BreachCounter 永続化
- 目的: Round 19 + Round 20 で確立した W3 (harness orchestrator 接続段階) の test factory / in-memory 実装を、production lifecycle 統合 + file-based persistence に拡張。Dev-HH (24h SLA + e2e 統合) と独立稼働。
- 領域不可侵: Dev-HH 担当ファイルに変更を加えていない。Dev-EE BreachCounter pure factory 関数本体無改変 (新規 file factory は別 file)。Dev-AA / Dev-BB / Dev-DD の既存 W3 file にも touch せず。control 本体ファイル (openclaw-runtime/src/controls/*) も無改変。

## 0. サマリ

| 項目 | 値 |
|---|---|
| 新規 file | 5 (bridge 1 + breach-counter 1 + tests 2 + 報告 1) |
| 実装行数 (production) | bridge 約 175 行 / file-breach-counter 約 200 行 (合計 約 375 行) |
| 実装行数 (tests) | bridge tests 約 130 行 / breach-counter tests 約 200 行 (合計 約 330 行) |
| 新規 tests | 19 (bridge 10 + breach-counter 9) |
| Dev-GG 単独 (新規 file) | **19 PASS / 0 FAIL** (約 0.65s) |
| harness 全体 | **748 PASS / 54 files / 0 FAIL** (regression 0、Dev-HH も同時並行で +9 monotonic-clock 追加観測) |
| TypeScript strict | Dev-GG 新規 file は型エラー 0 件 (既存 cross-rootDir / knowledge errors は pre-existing 9 件、本件由来 0) |
| Public API of any ctrl / Dev-EE BreachCounter | 完全不変 (新規 file factory として共存) |
| 副作用 / 絵文字 / API コスト | 0 / 0 / $0 (Read + Edit + Write のみ) |
| index.ts 拡張 | 2 セクション append (W4 bridge + file-breach-counter exports) |

## 1. harness orchestrator 本番 wiring (W4 task ①)

### 1.1 設計判断

- **Dev-BB test factory との共存**: Round 19 Dev-BB の `createW3OrchestratorContext()` は test factory (mock 注入用) として historical baseline 維持。本 file (`openclaw-runtime-bridge.ts`) は production-side bridge として **別 entry point** で公開する。dependency direction (harness → openclaw-runtime 禁止) の継承。
- **lifecycle phase machine**: bridge は `idle` → `active` → `disposing` → `idle` の 3 phase で state を管理。冪等 (`init` 再呼出で同 context) / idempotent (`dispose` 二重呼出安全) / re-init (dispose 後の再 init で fresh context) を全保証。
- **Harness クラス統合**: `bindBridgeToLifecycle(bridge)` で `start / stop / getContext / isActive` の thin wrapper を提供。Harness.init / shutdown と直接連動可能 shape。
- **hook port**: `onInit / onDispose` を options に持ち、test では event log 記録に、production では cross-control wiring の追加処理 (例: `permissionAuditSink` を audit-store に bind) に使う。

### 1.2 公開 API

```ts
createOpenClawRuntimeBridge(options): OpenClawRuntimeBridge
bindBridgeToLifecycle(bridge): BridgeLifecycleHandle
type BridgePhase = 'idle' | 'active' | 'disposing'
```

| API | 戻り値 | 副作用 |
|---|---|---|
| `bridge.init()` | `Promise<W3OrchestratorContext>` | phase=active / context 構築 / onInit 1 回 |
| `bridge.getContext()` | `W3OrchestratorContext` | state 検査のみ; idle/disposing で throw |
| `bridge.dispose()` | `Promise<void>` | phase=idle / onDispose 1 回 (active からの遷移時のみ) |
| `bridge.phase()` | `BridgePhase` | 副作用 0 |

## 2. BreachCounter 永続化 (W4 task ②)

### 2.1 設計判断

- **Dev-EE pure factory 無改変**: Round 20 Dev-EE の `createBreachCounter()` は in-memory pure factory として historical baseline 維持。本 file (`file-breach-counter.ts`) は **別 file factory として共存** し、Dev-EE BreachCounter shape (`BreachCounterPort`) と互換。
- **JSON Lines append + restore on init**: file format は 1 line = 1 record の JSON Lines で、`{loopId, count, recordedAt, kind: 'observe'|'reset'}`。NodeJS `fs.appendFile(path, line, {flag:'a'})` を使い、newline は JSON encode 時に自動 escape されるので 1 line = 1 record が保証される。
- **corruption tolerant**: parse 不能 line は skip しつつ valid line を採用 (test B-1 で実証)。これにより partial write / 異常終了で破損した tail line があっても counter restore 可能。
- **pending append flush**: observe / reset は in-memory 更新 + fire-and-forget の append を行うため、test では `counter.flush()` で promise chain を await して file 到達を保証する。production では Harness.shutdown 直前に flush することで全 record の persistence を確定可能。
- **lifecycle isolation**: `initialState` 注入で file restore を skip 可能 (test の isolation 用)。production では init 時に file から最新 state を復元 (file 不在なら count=0 / lastLoopId=null)。

### 2.2 公開 API

```ts
createFileBreachCounter(options?): FileBreachCounter  // BreachCounterPort 互換 + flush + path
adaptFileBreachCounterAsPort(counter): Promise<BreachCounterPort>  // init 完遂後の port 取得
flushPendingBreachAppends(counter): Promise<void>  // counter.flush() の thin wrapper
DEFAULT_BREACH_COUNTER_PATH = '.harness-state/breach-counter.jsonl'
```

| 操作 | semantics (Dev-EE 互換) | 永続化 |
|---|---|---|
| `observe(loopId)` (initial) | count=1 / lastLoopId=loopId | append `{kind:'observe',count:1}` |
| `observe(loopId)` (different) | count+=1 | append `{kind:'observe',count:N}` |
| `observe(loopId)` (same) | max(count,1) clamp | append `{kind:'observe',count:N}` |
| `reset()` | count=0 / lastLoopId=null | append `{kind:'reset',count:0,loopId:null}` |
| `init()` (fresh) | restore from file (or initialState) | read JSON Lines, accept latest valid |

## 3. tests 結果

```
$ npx vitest run src/__tests__/openclaw-runtime-bridge.test.ts src/__tests__/file-breach-counter.test.ts
   2 files / 19 tests passed (約 0.65s)
   - openclaw-runtime-bridge.test.ts  : 10 PASS (約 18ms)
   - file-breach-counter.test.ts      :  9 PASS (約 153ms)

$ npx vitest run (full harness suite)
   54 files / 748 tests passed (約 6.07s)

  baseline (Round 20 末): 51 files / 720 PASS
  Dev-GG 単独段階:        +2 files / +19 PASS
  Dev-HH 同時並行 (推定): +1 file  / +9 PASS (monotonic-clock)
  途中追加で観測 +20 PASS (Dev-HH e2e + 10digit detector も同時並行)
  → 計 748 PASS / 0 FAIL / regression 0
```

### 3.1 test グループ詳細

**`openclaw-runtime-bridge.test.ts` (3 groups, 10 tests)**

- Group A (bridge initialization, 3 tests): A-1 (init→active phase + 4 ports) / A-2 (init 冪等) / A-3 (options.now が postRollback に伝搬)
- Group B (lifecycle integration, 3 tests): B-1 (dispose→idle / getContext throws) / B-2 (dispose idempotent) / B-3 (re-init で fresh context)
- Group C (port wiring verification, 4 tests): C-1 (bindBridgeToLifecycle 連動) / C-2 (onInit/onDispose hook 順序) / C-3 (init 前の getContext throw) / C-4 (cross-control wiring — postRollback と permissionAuditSink が rlsAuditTrail に集約)

**`file-breach-counter.test.ts` (3 groups, 9 tests)**

- Group A (append + restore, 3 tests): A-1 (observe → JSON Lines append) / A-2 (init で file から最新 state 復元) / A-3 (異なる loopId 連続増加 + restore)
- Group B (atomic write / corruption recovery, 3 tests): B-1 (破損 line skip) / B-2 (reset record の後 observe で count=1 から再開) / B-3 (initialState 注入で file restore skip)
- Group C (lifecycle integration, 3 tests): C-1 (Dev-EE in-memory createBreachCounter と semantics 完全一致) / C-2 (adaptFileBreachCounterAsPort で init 完遂後の port 取得) / C-3 (init 冪等)

## 4. .harness-state ディレクトリ運用 (CI gitignore 提案)

### 4.1 file path 設計

- **default**: `.harness-state/breach-counter.jsonl` (relative path から resolve、harness 起動 cwd を基準)
- **production override**: 環境変数 / Harness options で path 注入可能化を Round 22 W5 で検討
- **test isolation**: vitest test は `fs.mkdtemp(join(tmpdir(), 'breach-counter-test-'))` で OS tmp に隔離 (test 4 件以上で path 競合の risk 0)

### 4.2 gitignore 推奨

`.harness-state/` ディレクトリは以下の理由で commit 対象外とすべき:

1. counter 値は環境固有 (loopId は production runtime で生成された一過性 token)
2. recordedAt は wall-clock で test 環境で再現性のあるコミットができない
3. 将来的に PII / loopId に customer ref が入る可能性 (HITL 第 11 種 `knowledge_pii_review` 規制対象)

**推奨追加** (`projects/PRJ-019/app/.gitignore` または harness 直下 `.gitignore` に):

```gitignore
# harness state (Round 21 W4 Dev-GG: BreachCounter persistence)
.harness-state/
```

CI では each job の workspace tmp を使うか、`CLAWBRIDGE_ROOT` 相当の env で test path を override する方針を Round 22 W5 で確定。

## 5. Dev-HH 接続点 (24h SLA + e2e 統合)

Dev-HH 担当 (Round 21 第 2 波 / 24h SLA MonotonicClock + e2e 統合) との接続点を以下に整理。本 file は touch しないが、Dev-HH 側で本 file の API を以下のように利用可能。

### 5.1 24h SLA MonotonicClock との統合

- Dev-EE Round 20 報告 §6.2 で提案された `MonotonicClock` port (`Date.now()` + `performance.now()` 二系統) を Dev-HH が新設する場合、本 file の `OpenClawRuntimeBridgeOptions.now` を `monotonicClock.toIsoString` 互換 callable に置換可能。
- 既に Round 21 で `monotonic-clock.test.ts` が並行で追加されたことを vitest 出力で確認済 (9 tests)。本件 bridge とは独立軸で実装されている (Dev-HH スコープ尊重)。

### 5.2 e2e 統合の本番 wiring 化

- Dev-EE Round 20 報告 §6.3 で提案された「e2e 経路の本番 wiring 化」は、本 file の `bindBridgeToLifecycle()` を Dev-HH e2e harness で利用すれば達成可能:

```ts
// Dev-HH e2e harness (期待される shape)
const bridge = createOpenClawRuntimeBridge({ now: monotonicClock.toIsoString })
const lifecycle = bindBridgeToLifecycle(bridge)
const ctx = await lifecycle.start()

// Dev-EE adapter で 7 ctrl wiring
const rollbackPorts = adaptW3ContextToRollbackPorts(ctx, executor, killSwitch)
const permPorts = adaptW3ContextToPermissionPorts(ctx, approver, monotonicClock.nowMs)

// FileBreachCounter で persistence を有効化
const fileCounter = createFileBreachCounter()
await fileCounter.init()
const rollback = createRollbackOrchestrator(rollbackPorts, fileCounter)

// ... e2e 通し試験 ...

await fileCounter.flush()
await lifecycle.stop()
```

- 同時並行で観測された `17day-path-w4-e2e-fully-wired.test.ts` (11 tests PASS) は Dev-HH 担当範囲と推定 (本 file は touch していない)。

### 5.3 BreachCounter port 互換性 smoke check

- Dev-EE in-memory `createBreachCounter()` と本 file `createFileBreachCounter()` の semantics 一致は test C-1 で smoke check 済 (同一 operation sequence で count / lastLoopId が完全一致)。
- Dev-HH e2e で本 file の FileBreachCounter を `createRollbackOrchestrator(ports, counter)` の counter 引数に直接注入可能 (BreachCounterPort 互換)。

## 6. Round 22 W5 引継

### 6.1 Harness クラス本体への統合

- 現状: `Harness` クラス (index.ts §270~) は cost / kill / hitl / usage の 4 component のみ保持。
- 提案: Round 22 W5 で `Harness` に `bridge: OpenClawRuntimeBridge` を追加し、`init()` で `bridge.init()` を、`shutdown()` で `bridge.dispose()` を呼ぶ lifecycle 統合を計画。
- 工数見積: 約 1.5h (Harness 改造 + tests 4-5 件 + Dev-HH 経路との競合検証)。
- 本件で既に `bindBridgeToLifecycle()` adapter を提供しているため Round 22 W5 の改造は thin。

### 6.2 FileBreachCounter の Harness lifecycle 連動

- 現状: `createFileBreachCounter()` は単独 factory で Harness とは未連動。
- 提案: `Harness.init()` で `breachCounter.init()` を呼び、`Harness.shutdown()` で `breachCounter.flush()` → file flush 確定後に process exit 経路に渡す。
- これにより 12h continuous run / kill switch 発火時にも counter state の file persistence を保証できる。

### 6.3 path 注入 / env 上書き

- 現状: `DEFAULT_BREACH_COUNTER_PATH = '.harness-state/breach-counter.jsonl'` (relative)。
- 提案: Round 22 W5 で `CLAWBRIDGE_ROOT` 環境変数 (`paths.ts` の既存パターン) と統合し、`join(CLAWBRIDGE_ROOT, 'breach-counter.jsonl')` に切替検討。これにより既存 cost-ledger / kill-history と同一 root に配置可能。

### 6.4 24h SLA MonotonicClock との整合性

- Dev-HH Round 21 第 2 波で MonotonicClock が production-grade になった後、本 file `bridge.options.now` を `monotonicClock.toIsoString` で初期化する production pattern を Round 22 で確立。test で `FakeTimeSource` 注入も同様に可能化。

### 6.5 cross-rootDir TS error の解消検討

- Dev-AA Round 19 / Dev-BB Round 19 で記録された `17day-path-w3-orchestrator.ts` の cross-rootDir error (5 件) は本 file では再現せず (本 file は openclaw-runtime を import しない設計を継承)。
- ただし Round 22 W5 で workspace alias / TS path mapping の正式設計を完了し、Dev-BB の既存 file の error も解消する方針を Dev-EE 報告 §6.4 と整合させる。

## 7. 実装中遭遇課題

### 7.1 fire-and-forget append の test cleanup race

- `observe()` が同期 return / fire-and-forget な append を chain するため、vitest `afterEach` で tmp dir を削除する直前に pending append が走り `ENOENT` の Unhandled Rejection が発生する race condition を確認。
- 解消: `counter.flush()` を public API として追加し、test の `afterEach` で `Promise.all(trackedCounters.map(c => c.flush()))` を await してから tmp 削除する pattern を採用。production code でも `Harness.shutdown` 前段で flush 可能 (lifecycle 同期化)。
- 本 pattern は Round 22 W5 で `Harness` 統合する際の lifecycle 順序を先取りした設計。

### 7.2 RlsAuditTrail public API name (snapshot vs list)

- 初期実装で `rlsAuditTrail.snapshot()` を仮定したが、`p-ui-09-rls-checklist.ts` 確認の結果 actual API は `list()` (snapshot 同等の readonly array 返却)。test を修正 (`A-3 / C-4`)。
- 本件は port-injection 設計の typecheck で fail 検知され、結果として cross-control wiring の正確性を保証 (smoke check として機能)。

### 7.3 strict tsc 適合 — exactOptionalPropertyTypes

- `OpenClawRuntimeBridgeOptions` の optional `now` / `onInit` / `onDispose` を Object.freeze する際、`exactOptionalPropertyTypes` 制約で `undefined` を明示せず `...(opt.now !== undefined ? { now: opt.now } : {})` パターンで分岐 spread を使用。Dev-EE Round 20 報告 §7.2 と同 pattern (orchestrator 全体で一貫)。

### 7.4 file restore 時の corruption tolerance

- JSON Lines parse で `JSON.parse` が throw した場合、line を skip して次の line を読む設計。これにより partial write / 異常終了で破損した tail line があっても valid な前半 line から最新 state を復元可能 (test B-1 で実証)。
- 完全壊れた file (全 line が parse 失敗) は count=0 / lastLoopId=null = 「初期状態」として fallback。これにより harness restart 後に file 破損で起動失敗するリスクを排除 (fail-open vs fail-closed の trade-off は KillSwitch とは異なり permissive を選択)。

---

**SOP 順守**: DEC-019-025 (background dispatch、SOP 実証 18 件目) に基づき、Dev-GG は他 9 並列 Agent と独立稼働。Dev-HH 担当 (24h SLA + e2e 統合) ファイルには touch せず、Dev-AA / Dev-BB / Dev-DD / Dev-EE の既存 file にも変更を加えていない。
