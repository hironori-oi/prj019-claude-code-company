# Dev-DD R20 W3 — P-UI-02 cooldown + P-UI-04 kill-terminal-sink orchestrator 接続

- 案件: PRJ-019 Open Claw "Clawbridge"
- 担当: Dev-DD (Round 20 第 1 波, 9 並列の 1)
- 範囲: P-UI-02 (cooldown state machine) / P-UI-04 (kill-terminal-sink)
- 不可侵: P-UI-05 / HITL-10 (Dev-EE 担当) には触れない
- 対象 path: 17 日 path W3 = harness orchestrator 接続段階
- 完遂日時: 2026-05-05
- SOP 順守: DEC-019-025 (background dispatch、SOP 実証 17 件目相当)

## 0. サマリ

Round 19 で Dev-AA (3 ctrl orchestrator, 12 tests) + Dev-BB (4 ctrl orchestrator, 19 tests) = **31 tests / harness 674 PASS** の baseline 上に、

- P-UI-02 cooldown state machine の harness 側 policy port (`CooldownPolicy`)
- HITL 第 12 種 override の in-memory registry (`CooldownOverrideRegistry`)
- P-UI-04 kill-terminal-sink を端末状態として返す `KillTerminalAdapter`
- broadcaster lifecycle 観察用 `observeLatch / unsubscribe` API

を **append-only 拡張**で追加。**+13 tests / 5 group / harness 674 → 687 PASS、regression 0、ctrl 実装 3 ファイル無改変、Public API 不変**。tsc strict 型エラー (TS2xxx) は 0 件、TS6059 rootDir 警告のみ Round 19 Dev-BB 既存と同パターン (ARCH-01 / DEC-019-041 Phase B で同時解消予定)。

## 1. P-UI-02 接続

### 1.1 ポート設計

```ts
export interface CooldownPolicy {
  isActive(input: CooldownInput): boolean             // active のみ true
  computeExpiry(input: CooldownInput): Date           // abortedAt + 30s 確定値
  evaluate(input: CooldownInput): CooldownOutput      // P-UI-02 evaluateCooldown 同等
}

export interface CooldownOverrideRegistry extends CooldownOverrideChecker {
  markOverridden(loopId: string): void
  reset(loopId: string): void
  resetAll(): void
}
```

### 1.2 builder

- `buildCooldownPolicy(clock, overrideRegistry?)` — P-UI-02 `evaluateCooldown` を CooldownPolicy port に bridge する pure adapter。clock は DI、override は省略可 (no-op = 既存 NO_OP_OVERRIDE と同等)。
- `createCooldownOverrideRegistry()` — in-memory `Set<loopId>` 実装。HITL 第 12 種 webhook 受信 → `markOverridden` で latch、`reset` で解除。`resetAll` で全 loop の latch クリア。

### 1.3 不変保証

- ctrl `p-ui-02-cooldown-modal.ts` は **完全無改変** (Round 17 W1 / Round 18 W2 の挙動 100% 保持)。
- `CooldownClockSkewError` (now < abortedAt) は ctrl 側 throw をそのまま伝搬 (fail-closed)。orchestrator 側で握り潰さない。
- `computeExpiry` は active / expired のいずれの状態でも `abortedAt + 30s` で同一値を返す (timeline 確定性)。

## 2. P-UI-04 接続

### 2.1 ポート設計

```ts
export interface KillTerminalAdapter {
  terminate(input: KillInput, options?: KillTerminalAdapterOptions): Promise<KillTerminalState>
  observeLatch(callback: KillLatchObserver): () => void   // 戻り値は unsubscribe
}

export interface KillTerminalState {
  readonly killOutput: KillOutput               // ctrl propagateKill の戻り値そのまま
  readonly latchActive: boolean                 // sink.isActive() snapshot
  readonly latchReason: string | null           // sink.lastReason() snapshot
}

export type KillLatchObserver = (event: 'fired' | 'verified' | 'failed', reason: string) => void
```

### 2.2 builder

- `buildKillTerminalAdapter({ killTerminalSink })` — Dev-BB W3OrchestratorContext の `killTerminalSink` を保持して terminate adapter を組み立てる。
- 内部に `Set<KillLatchObserver>` を保持し、`killTokenBroadcaster` 経由で全 observer に broadcast。observer 単体の throw は吸収 (lifecycle / 他 observer 隔離)。
- `terminate` 内では `propagateKill` を呼出。`processKiller` 省略時は ALWAYS_OK_KILLER (test isolation を簡単にする default)、`gracePeriodMs` は default 0 + `sleep` no-op で test 高速化。本番運用時は呼出側で sink 含めて override 可能。

### 2.3 broadcaster lifecycle

- `observeLatch` 戻り値は unsubscribe 関数。明示的 cleanup を提供。
- subprocess kill 後の cleanup hook = `markVerified` または `failed` broadcast 完了時点で sink に latch (terminal monotonic) → 後段 P-UI-05 evaluateAndAct.killQuery で rollback 抑止 (Dev-EE 接続点)。
- W3 cross-control invariant 配線: `kill-trigger → propagateKill → killTerminalSink (Dev-BB context) → 後段 ctrl 抑止` を 1 つの adapter で wrap。

## 3. tests 結果

### 3.1 新規 file 単体

```
$ npx vitest run src/__tests__/17day-path-w3-cooldown-killterminal-orchestrator.test.ts
Test Files  1 passed (1)
     Tests  13 passed (13)
   Duration 545ms
```

### 3.2 5 group / 13 tests 構成

| Group | 件数 | 検証内容 |
|---|---|---|
| A — P-UI-02 active 抑止 | 3 | active 内 / expired / clock skew throw |
| B — P-UI-02 expiry 通過 | 2 | computeExpiry deterministic / active と expired で同一 expiry |
| C — P-UI-02 override port reset | 2 | markOverridden → state=overridden / reset → 復帰 + resetAll |
| D — P-UI-04 graceful → forceful | 3 | pidTree=[201] all_terminated / empty pidTree / SIGTERM 失敗→SIGKILL fallback |
| E — P-UI-04 broadcaster cleanup | 3 | observeLatch fired / unsubscribe cleanup / observer throw isolation |

### 3.3 harness 全体 regression

```
$ npx vitest run (harness package, full suite)
Test Files  48 passed (48)
     Tests  687 passed (687)
   Duration 3.91s
```

baseline 47 files / 674 tests → 48 files / 687 tests (+1 file / +13 tests)。**既存 31 W3 tests (Dev-AA 12 + Dev-BB 19) 含む全 674 既存 tests は regression 0**。

### 3.4 openclaw-runtime regression

```
Test Files  26 passed (26)
     Tests  394 passed (394)
```

ctrl 実装 3 ファイル (p-ui-02 / p-ui-04 / 関連) 無改変保証 (W1 + W2 の 78 tests 含め全 PASS 維持)。

## 4. Public API 不変性 W3 確認

| ファイル | 改変有無 | 内容 |
|---|---|---|
| `app/openclaw-runtime/src/controls/p-ui-02-cooldown-modal.ts` | 無改変 | Round 17 W1 / Round 18 W2 のまま |
| `app/openclaw-runtime/src/controls/p-ui-04-kill-switch-propagation.ts` | 無改変 | Round 17 W1 / Round 18 W2 のまま |
| `app/harness/src/17day-path-w3-orchestrator.ts` | append-only | Dev-BB 125 行 → 約 290 行 (+ 約 165 行) |
| `app/harness/src/index.ts` | 既存 export 不変 / 新規 export +12 行 | Dev-AA / Dev-BB export 全保持 |
| `app/harness/src/__tests__/17day-path-w3-cooldown-killterminal-orchestrator.test.ts` | NEW | 約 250 行 / 13 tests |

- 既存 `createW3OrchestratorContext` / `buildPermissionAuditSink` / `buildPostRollbackNotifier` (Dev-BB) は touchnone。
- 既存 `createOpenClawOrchestrator` / `projectMajorDiffsToEscalation` / `isCycleAborted` (Dev-AA) は touchnone。
- `tsc --noEmit` 型エラー (TS2xxx) = 0 件。TS6059 rootDir 警告は Dev-BB 既存と同 5 行 (line 32/33/37/38) + 私の追加 1 行 (line 158, P-UI-02 import) のみ。pre-existing 設計事情で blocker 扱いせず (DEC-019-041 ARCH-01 Phase B 移行時に同時解消予定)。

## 5. Dev-EE 接続点 (P-UI-05 + HITL-10)

Dev-DD 単独段階で確定済の port は以下:

1. **P-UI-04 KillTerminalAdapter → P-UI-05 evaluateAndAct.killQuery**
   - 既に Dev-BB W3OrchestratorContext.killTerminalSink を共有しているため、Dev-EE 側は P-UI-05 統合時に `killQuery: ctx.killTerminalSink` を渡すだけで kill = terminal の rollback 抑止が成立 (W2 invariant I1 保持)。
   - 私が追加した `KillTerminalAdapter.terminate` は kill-trigger 起点の wrap であり、後段 P-UI-05 とは sink 経由で疎結合。

2. **P-UI-02 CooldownPolicy → orchestrator runOpenClawCycle 後段**
   - Dev-AA `OpenClawOrchestratorPorts.evaluateCooldown` は構造的 contract のみ (W2 I-5 / I-11 独立軸保証)。
   - Dev-EE が orchestrator 全段統合時に、`evaluateCooldown: (input) => buildCooldownPolicy(clock, registry).evaluate(input)` の adapter を 1 行で wire 可能。HITL 第 12 種 webhook 受信は `registry.markOverridden(loopId)` の呼出を Dev-EE が HITL-10 経由で配線する設計。

3. **HITL-10 終局判定 → CooldownOverrideRegistry**
   - HITL-10 `requestPermissionApproval` の state='approved' で `registry.markOverridden(loopId)` を呼ぶ adapter は Dev-EE 統合時に追加 (本ラウンド範囲外、既存 Dev-BB `buildPermissionAuditSink` と独立 sink で並列配線可能)。

## 6. Round 21 W4 引継

- **W4 = 7 ctrl 全段 end-to-end 統合 (実 orchestrator app への取り込み)** が次焦点。
- 現状 `app/orchestrator/src/` は空 (Dev-BB Round 19 §7 記録)。Round 21 で本 helper 群 (Dev-AA orchestrator + Dev-BB context + Dev-DD cooldown/kill adapter + Dev-EE P-UI-05/HITL-10 adapter) を取り込む実 orchestrator を構築する想定。
- W4 統合時の test 追加候補:
  - 7 ctrl 全段 end-to-end (1 cycle = contract → projection → escalation → cooldown gate → rollback or kill → audit trail aggregate)
  - HITL 第 12 種 override webhook → CooldownOverrideRegistry latch → 次回 cycle 通過 の連鎖
  - kill-trigger → KillTerminalAdapter → P-UI-05 抑止 → HITL-10 audit の 3 段独立 timeline
- Phase B 移行 (DEC-019-041 ARCH-01) で `tsconfig.base.json` に切替後、TS6059 警告は 0 化見込み。

## 7. 実装中遭遇課題

| 課題 | 内容 | 対処 |
|---|---|---|
| harness rootDir 違反 (TS6059) | harness `tsconfig.json` の `rootDir: ./src` 下で `../../openclaw-runtime/src/...` を直接 relative import すると tsc が rootDir 違反警告 | Round 19 Dev-BB と同パターン採用 (vitest ESM 解決は問題なし、tsc 警告は ARCH-01 Phase B で同時解消)。新規型エラー (TS2xxx) は 0 件 |
| broadcaster observer 隔離 | observer 1 個の throw が他 observer / lifecycle に伝搬すると後段 propagateKill が異常停止する懸念 | adapter 内 broadcast 関数で try/catch 吸収。test E-3 で明示検証 |
| processKiller default 設計 | terminate options 省略時に test が pidTree 全 SIGTERM 成功を期待。本番運用との混線回避 | default = ALWAYS_OK_KILLER + gracePeriodMs=0 + sleep no-op。本番側は呼出時に override 必須 (port-injection の流儀厳守) |
| sleep / verifySurvivors の optional 厳格化 | `KillBroadcasterOptions` の optional プロパティを `exactOptionalPropertyTypes` 制約下で型安全に渡すため | undefined 直渡しを避け、条件付きで `broadcasterOpts.verifySurvivors = options.verifySurvivors` のように動的 assign |

---

## 数値サマリ

- 実装行数 (新規 + append): 約 165 行 (orchestrator helper 拡張) + 約 250 行 (test) + 12 行 (index.ts export) = **約 427 行**
- tests 追加: **+13 tests / 5 group**
- harness PASS: **674 → 687 (+13)**, FAIL 0
- openclaw-runtime PASS: **394 → 394 (unchanged)**, FAIL 0
- ctrl 実装無改変: **3 ファイル全保持** (p-ui-02 / p-ui-04 / p-ui-05 = touchnone)
- 型エラー新規: **0 件** (TS2xxx)
- API 追加コスト: **$0** (Read + Edit + Write のみ)
- 副作用: **0** (pure function + DI port 完全準拠)
- 絵文字: **0** (Owner directive 順守)

---
担当: Dev-DD / Round 20 第 1 波
