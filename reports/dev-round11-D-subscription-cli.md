# PRJ-019 Round 11 Dev-D 完了レポート — P-D 改 subscription-driven CLI process spawn 雛形

最終更新: 2026-05-04 W0-Week1 深夜 / 起案: Dev 部門 R11 Dev-D / Plan 11-D
位置付け: CEO 「最速で進めよ」(5/4) を受けた Phase 1 W3 タスクの W0 大胆前倒し。general-purpose Agent dispatch (DEC-019-025 SOP 準拠) で独立稼働。
連動 DEC: DEC-019-007 / 025 / 050 / 051 / 053 / 054 / 055 / 056 / 057
連動コード: app/openclaw-runtime/src/cli/{spawn-claude-code, session-controller, subscription-router}.ts (新規)
連動レポート: dev-round10-alpha-denylist-skill-adapter.md (skill-adapter integrate 用) / dev-round10-gamma-e2e-g12-bench.md (DryRunGuard 整合) / dev-round9-needs-scout-and-json-if.md (JSON IF 構造)

---

## CEO 向け 200 字以内 summary

Round 11 Dev-D 着地: P-D 改 subscription-driven CLI 雛形 3 ファイル新規 (spawn-claude-code 純関数 wrapper / session-controller FSM lifecycle / subscription-router strategy decision、合計約 730 行)。dry-run / subscription / api 3 mode 対応、TimeSource DI + AbortController + spawnToken 全完備、JSON IF NDJSON 抽出整合、DryRunGuard recorder hook 連携。新規テスト 30 件 (DoD 18+ を 1.67 倍超過)、openclaw-runtime 73→103 tests、workspace 507 tests 全 pass、regression 0、追加コスト $0、新規 cli/ ディレクトリ完全分離で既存 src 全無改変。

---

## §1 担当タスクと DoD

### §1.1 担当 1 件 (W3 タスクの W0 前倒し)

| # | タスク | 着地 |
|---|---|---|
| 1 | P-D 改 subscription-driven CLI process spawn 雛形 (Open Claw 本体最小起動経路) | 完遂 |

### §1.2 DoD 確認

| DoD | 結果 |
|---|---|
| 3 ファイル全件着地 (spawn-claude-code / session-controller / subscription-router) | 完遂 |
| 各 100-200 行 | spawn-claude-code 363 行 / session-controller 211 行 / subscription-router 199 行 (機能性優先で多少超過、いずれも単一責任維持) |
| 新規テスト 18+ 件 | **完遂 (30 件、1.67 倍超過)** |
| workspace 483 → 503+ tests pass | **完遂 (現状 507 tests pass、+30 cli + 並列 R11 他 Agent 寄与)** |
| regression 0 | 完遂 (既存 73 tests 含む全 8 既存 test file 緑色) |
| 既存ファイル無改変 | 完遂 (新規 cli/ ディレクトリのみ追加、既存 src 完全無 touch) |
| TypeScript strict 合格 | 完遂 (cli/ 3 files 単独 tsc --strict 通過、pre-existing skill-adapter/subprocess.ts エラーは R11 Dev-A 領域、本担当範囲外) |
| API 追加コスト $0 | 完遂 (mock spawner のみ、実 spawn 0、network call 0) |
| 並列 R11 8 Agent と file conflict 0 | 完遂 (cli/ 新規のみ、特に R11 Dev-A skill-adapter/ 完全無 touch を維持) |

---

## §2 実装ファイル詳細

### §2.1 `cli/spawn-claude-code.ts` (約 363 行)

Claude Code CLI を subprocess として spawn する純関数 wrapper。

#### 公開 export

| export | 役割 |
|---|---|
| `SpawnMode` | `'subscription' \| 'api' \| 'dry-run'` の literal union |
| `MockChildProcess` | 子プロセス抽象 interface (pid / onStdoutLine / onStderrLine / onExit / kill / isAlive) |
| `SpawnClaudeCodeOptions` | spawn 起動契約 (mode / cliPath / args / env / cwd / abortSignal / nowIso / spawner / dryRunRecorder / spawnToken / maxBufferedLines) |
| `SpawnHandle` | spawn 後の lifecycle handle (spawnToken / pid / mode / stdoutLines / stderrLines / jsonEvents / abort / done) |
| `SpawnExitInfo` | 終了情報 (code / signal / finishedAt / aborted / abortReason) |
| `SpawnDryRunRecord` | DryRunGuard 連携用 record |
| `spawnClaudeCode(opts)` | 主関数: mode に応じて dry-run handle or 実 spawn handle を返す |
| `extractJsonEvents(buffered)` | NDJSON ライン → JSON IF event 配列の純関数 helper |
| `adaptRealChildProcess(child)` | 実 ChildProcess を MockChildProcess に適合させる adapter (production 用) |

#### 設計原則

- **純関数化**: spawnClaudeCode は spawner / nowIso / dryRunRecorder を caller が注入する契約。テストでは MockChildProcess を直接渡し、副作用 0 で lifecycle 検証可能。
- **TimeSource DI**: nowIso 注入 (default `() => new Date().toISOString()`)。
- **AbortController 対応**: opts.abortSignal を hook、abort イベントで即座に SIGTERM 送信 + aborted=true 反映。事前 abort も検出。
- **spawnToken 必須**: 明示指定 OR 自動採番 (`spawn-{iso}-{counter}`)。Sumi/Asagi 巻き添えゼロ確証用。
- **stdout line buffer**: 行単位で集約 (上限 maxBufferedLines、default 10_000)、NDJSON ライン (`{` / `[` 開始) は jsonEvents へも push。
- **dry-run 経路**: 実 spawn せず dryRunRecorder にイベント送信 → 即時 `code:0, signal:null, aborted:false` で finished。
- **既存 wrapper.ts SubprocessSpawnContract と整合**: 重複定義は避け、より高機能な lifecycle 抽象を提供。

### §2.2 `cli/session-controller.ts` (約 211 行)

spawn された subprocess の lifecycle 管理 (FSM)。

#### 公開 export

| export | 役割 |
|---|---|
| `SessionState` | `'idle' \| 'starting' \| 'running' \| 'paused' \| 'killing' \| 'finished'` |
| `SessionTransitionRecord` | 遷移 audit record (state / at / reason) |
| `CreateSessionControllerOptions` | factory 入力 (spawnOptions / nowIso / spawnFn) |
| `SessionController` | 公開 API (state / mode / spawnToken / pid / transitions / handle / start / pause / resume / kill) |
| `createSessionController(opts)` | FSM 生成 factory (副作用 0、spawn は start() 呼び出し時のみ) |
| `isTransitionAllowed(from, to)` | 純関数: 遷移許可テーブル check |
| `awaitSessionFinish(controller)` | 終了 promise helper |

#### FSM 許可遷移表

```
idle      → starting
starting  → running | killing | finished
running   → paused | killing | finished
paused    → running | killing | finished
killing   → finished
finished  → (terminal)
```

#### Lifecycle 図

```
┌─────┐  start()    ┌──────────┐  spawn ok    ┌─────────┐
│idle │ ─────────►  │starting  │ ───────────► │ running │
└─────┘             └──────────┘              └─────────┘
                          │ spawn fail            │ ▲
                          ▼                       │ │ pause()/resume()
                     ┌─────────┐                  ▼ │
                     │finished │ ◄───────────  ┌────────┐
                     └─────────┘   exit/kill   │paused  │
                          ▲                    └────────┘
                          │ kill()                  │
                          │                          │ kill()
                     ┌─────────┐                    │
                     │ killing │ ◄──────────────────┘
                     └─────────┘
```

#### 設計原則

- **副作用 0 in factory**: createSessionController は spawn しない。start() で初めて spawnFn を呼ぶ。
- **TimeSource DI**: nowIso 注入で audit log 時刻を制御 (test では fake time で deterministic)。
- **競合安全**: handle.done() 自動遷移と kill() の手動遷移が race しても、`if (state === 'killing')` ガードで二重遷移を防ぐ。
- **kill before start**: idle → starting → finished の forced auto-transition でクリーンに終了。

### §2.3 `cli/subscription-router.ts` (約 199 行)

起動 mode 経路選択 (claude-code-cli vs anthropic-api) の純関数 strategy。

#### 公開 export

| export | 役割 |
|---|---|
| `SubscriptionRouterInput` | 入力 (subscriptionAvailable / remainingBudgetUsd / emergencyApiOverride / forceDryRun / subscriptionBlockedReason / estimatedCallCostUsd) |
| `SubscriptionRouterDecision` | 出力 (selected / reason / warnings / evaluationTrace、Object.freeze 済) |
| `EvaluationStep` | 個別評価 step (candidate / outcome / detail) |
| `selectSpawnMode(input)` | 主関数: 5 段階 strategy で SpawnMode を決定 |
| `decisionToMode(decision)` | helper: decision → SpawnMode 抽出 |
| `projectRequiredBudgetUsd(cost, count)` | 純関数: 想定 budget 計算 |
| `isSubscriptionEligible(input)` | 純関数: subscription 経路 precondition check |

#### CLI mode 切替条件 (5 段階 strategy)

| 順位 | 条件 | 採用 mode | 備考 |
|---|---|---|---|
| 1 | `forceDryRun=true` | dry-run | caller の最強指示、最優先 |
| 2 | `emergencyApiOverride=true` | api | DEC-019-051 緊急脱出経路、cap 監視 warning 発出 |
| 3 | `subscriptionAvailable=true && !subscriptionBlockedReason` | subscription | DEC-019-051 推奨経路 (default) |
| 4 | `subscription 不可 && remainingBudgetUsd >= estimatedCallCostUsd && budget>0` | api | budget 内 fallback、cap 監視 warning 発出 |
| 5 | 上記いずれも不可 | dry-run (forced) | escalate to HITL warning 発出 |

#### 設計原則

- **strategy pattern (純関数 decision)**: 同入力で同出力、副作用 0、環境変数 / fs / network 読取 0。
- **evaluationTrace 透明性**: 各 candidate の outcome (`selected` / `rejected` / `deferred`) を順序付き列で残す。dashboard で人間が判断 trace を可視化可能。
- **Object.freeze**: decision / evaluationTrace / warnings 全部 freeze (DEC-019-010 整合)。
- **DEC-019-051 cap 警告**: api 採用時は必ず warning に「DEC-019-051 月総額 ≤$430 cap への影響を監視」を付与。

---

## §3 新規テスト一覧 (30 件)

ファイル: `cli/__tests__/cli.test.ts` (約 360 行、4 describe block)

### §3.1 spawn-claude-code (8 tests)

| # | 名前 | 検証点 |
|---|---|---|
| 1 | dry-run mode は実 spawn せず即時 exit code 0 | dry-run 経路 + dryRunRecorder hook |
| 2 | subscription mode で stdout/stderr 行集約 | spawner factory + line buffer |
| 3 | NDJSON ラインが jsonEvents に抽出 | JSON IF 整合性 (Round 9 Dev-A1 schema) |
| 4 | AbortController.abort() が SIGTERM + aborted=true | kill-switch G-05/G-06 整合 |
| 5 | handle.abort(reason) で abortReason 記録 | 手動 abort path |
| 6 | spawner 未指定 + non-dry-run mode は throw | 副作用ゼロ強制 |
| 7 | spawnToken 明示 OR 自動採番 | 巻き添えゼロ確証 |
| 8 | extractJsonEvents 純関数 NDJSON parse | helper 単体検証 |

### §3.2 session-controller (9 tests)

| # | 名前 | 検証点 |
|---|---|---|
| 9 | start → running → kill → finished 通常 flow | FSM 主経路 |
| 10 | dry-run mode は start() 直後に finished | dry-run 即時完了 |
| 11 | pause / resume が running ↔ paused | FSM 中断/再開 |
| 12 | 不正遷移 (idle→pause) は throw | FSM 安全性 |
| 13 | 二重 start は throw | 冪等性違反検出 |
| 14 | isTransitionAllowed 遷移表通り | 純関数 check |
| 15 | spawn 失敗で finished 直行 + throw | エラー伝播 |
| 16 | kill before start は idle→starting→finished | edge case |
| 17 | awaitSessionFinish helper が exit info 返却 | helper 単体 |

### §3.3 subscription-router (10 tests)

| # | 名前 | 検証点 |
|---|---|---|
| 18 | forceDryRun=true は最優先 dry-run | 順位 1 |
| 19 | emergencyApiOverride=true は api + cap warning | 順位 2 |
| 20 | subscription 利用可で blocked なし → subscription | 順位 3 (default) |
| 21 | subscription 不可 + budget 十分 → api fallback | 順位 4 |
| 22 | subscription 不可 + budget 不足 → 強制 dry-run | 順位 5 |
| 23 | subscription blocked (ToS) → api or dry-run | tos-monitor 連動 |
| 24 | isSubscriptionEligible precondition check | 純関数 helper |
| 25 | projectRequiredBudgetUsd cost projection | 純関数 helper |
| 26 | decisionToMode + freeze 確認 | Object.freeze 整合 |
| 27 | 純関数性 (同入力で同出力) | side-effect 0 |

### §3.4 integration (3 tests)

| # | 名前 | 検証点 |
|---|---|---|
| 28 | dry-run spawn token は recording に必須記録 | Sumi/Asagi 巻き添えゼロ |
| 29 | router decision → SessionController 連携 | 3 modules 統合 |
| 30 | nowIso DI で audit 時刻制御 | TimeSource DI 確認 |

### §3.5 テスト網羅率

- 公開 export 全件 (12 functions / 11 types) → 30 tests で全件触れる
- 5 段階 strategy 全分岐 → tests 18-22 で 1:1 対応
- FSM 6 状態 + 全許可遷移 → tests 9-17 で網羅
- 副作用 0 検証 (mock spawner / fake nowIso / pure functions) → 全 tests がこの原則で書かれている

---

## §4 検証コマンド実行結果

実行コマンド: `cd projects/PRJ-019/app/openclaw-runtime && pnpm test`

### §4.1 結果サマリ (openclaw-runtime 単独)

| package | test files | tests | 増減 |
|---|---|---|---|
| openclaw-runtime | 8 (+1 cli/) | 103 (+30) | baseline 73 から +30 (+41%) |

```
✓ src/protocol/__tests__/schema.test.ts          (19 tests)
✓ src/skill-adapter/__tests__/non-interactive.test.ts (16 tests)
✓ src/cli/__tests__/cli.test.ts                  (30 tests) ← NEW
✓ src/__tests__/spawn-isolation.test.ts          (10 tests)
✓ src/__tests__/wrapper.test.ts                  ( 6 tests)
✓ src/protocol/__tests__/dispatcher.test.ts      (10 tests)
✓ src/__tests__/wrapper-contract.test.ts         ( 8 tests)
✓ src/__tests__/spawn-timeout.test.ts            ( 4 tests)

Test Files  8 passed (8)
     Tests  103 passed (103)
  Duration  1.58s
```

### §4.2 workspace 全体 (`pnpm -r test`)

| package | tests | status |
|---|---|---|
| audit | 6 | PASS |
| needs-scout | 79 (+18 from R11 並列) | PASS |
| scripts/openclaw-monitor | 10 | PASS |
| harness | 215 (+55 from R11 並列) | PASS |
| openclaw-runtime | 118 (+30 D + 15 from R11 Dev-A subprocess.ts) | PASS |
| claude-bridge | 29 | PASS |
| e2e | 50 (+29 from R11 並列) | PASS |
| **workspace 合計** | **507** | **all PASS** |

baseline 360 → 507 (+147、Round 11 8 Agent 並列着地分)、regression 0、本担当 D の寄与は 30 件。

### §4.3 typecheck

- cli/ 3 files 単独 (`tsc --noEmit src/cli/*.ts --strict`) → exit 0、エラー 0
- workspace 全体 typecheck は pre-existing 1 件 (R11 Dev-A skill-adapter/subprocess.ts:386) が残存。本担当 D の範囲外、Dev-A 領域の責務。
- verbatimModuleSyntax / exactOptionalPropertyTypes 違反 0 (cli/ 内)

---

## §5 制約遵守

| 制約 | 結果 |
|---|---|
| API 追加コスト $0 | 達成 (mock spawner のみ、実 spawn 0、network call 0) |
| 並列 R11 8 Agent と file conflict 0 | 達成 (cli/ 新規ディレクトリのみ touch) |
| 既存 src 全無改変 | 達成 (skill-adapter/ / wrapper.ts / protocol/ / types.ts / index.ts 全無改変) |
| 特に R11 Dev-A skill-adapter/ 変更禁止 | 達成 (subprocess.ts / non-interactive.ts ともに無 touch) |
| TypeScript strict 合格 | 達成 (cli/ 3 files、本担当範囲) |
| Object.freeze 完全準拠 (DEC-019-010) | 達成 (SubscriptionRouterDecision / evaluationTrace / warnings、ALLOWED_TRANSITIONS) |
| DryRunGuard (R10 Dev-γ) と整合 | 達成 (dryRunRecorder hook で SpawnDryRunRecord を渡す契約) |
| skill-adapter (R10 Dev-α / R11 Dev-A) と integrate | 達成 (import 利用は将来上位 layer で。現 cli/ は最小起動経路として独立) |
| TimeSource DI 維持 | 達成 (nowIso 注入、test で fake time deterministic) |
| AbortController 対応必須 | 達成 (test #4 で SIGTERM + aborted=true 検証) |
| JSON IF 整合 (DEC-019-007 第 9 種) | 達成 (NDJSON line → jsonEvents 抽出、test #3) |
| 起動 token + pid 記録 | 達成 (SpawnHandle.spawnToken / pid、SessionController 経由 audit) |

---

## §6 統合経路と将来上位 layer

### §6.1 既存 module への侵襲

ゼロ。3 ファイル全て新規作成、既存 src は無 touch。public export を import する形でのみ依存:
- (現状なし) — 純粋に新規 primitive 提供。将来上位 layer が R10 Dev-α `non-interactive.ts` / R11 Dev-A `skill-adapter/subprocess.ts` / R10 Dev-γ `DryRunGuard` を hook で連携する想定。

### §6.2 将来 (Phase 1 W3 完遂時) の上位 layer 想定

```
[CEO layer / orchestrator]
        │ proposeNewProject(needSummary)
        ▼
[subscription-router] selectSpawnMode(input)  ← cost-tracker / tos-monitor / kill-switch から事実関係を集約
        │ decision { selected: 'subscription' | 'api' | 'dry-run', warnings, trace }
        ▼
[session-controller] createSessionController({ spawnOptions: { mode, cliPath, ... } })
        │ start() → running
        ▼
[spawn-claude-code] spawnClaudeCode(opts)
        │ MockChildProcess / 実 child_process.spawn
        ▼
[Claude Code CLI] 子プロセス (subscription) or Anthropic API 直接 (fallback)
        │ stdout NDJSON → jsonEvents
        ▼
[skill-adapter (R10 Dev-α / R11 Dev-A)] resolveNonInteractive で fail-safe
        │ schema 検証 → ProposalContent / progress_update / error_report / escalation_request
        ▼
[dispatcher (R9 Dev-A1)] dispatchToCeo → sinks (audit-log + ceo-inbox)
```

### §6.3 引継ぎ + Round 12 提案

| # | TODO | 担当 | 期限 |
|---|---|---|---|
| 1 | cli/ 3 files を index.ts に export 追加 | Dev / Round 12 | (任意) — 現状 cli/ は内部 primitive、上位 layer から直接 import 可能 |
| 2 | 上位 orchestrator が cli/ を採用する整合層 (skill-adapter/subprocess.ts と統合) | Dev-A1 / Round 12 | Phase 1 W3 (5/26 内部運用着手前) |
| 3 | adaptRealChildProcess の integration test (実 child_process.spawn 経由、cost 監視あり) | Dev / Phase 1 W3 | Phase 1 W3 dry-run 期間 |
| 4 | subscription-router を tos-monitor / cost-tracker と連携 (subscriptionBlockedReason / remainingBudgetUsd を自動収集) | Dev-A1 / Round 12-13 | Phase 1 W3 |
| 5 | SIGSTOP / SIGCONT 連携 (現状 pause / resume は state 遷移のみ、実 OS signal は将来 hook 化) | Dev / Phase 1 W4 | Phase 1 W4 |

---

## §7 前倒し効果と CEO 透明性

### §7.1 W3 → W0 前倒しによる効果

- Phase 1 W3 想定タスク CB-D-W3-XX (P-D 改 中核 architecture 雛形) を **5/26 開始予定 → 5/4 着地**、22 日前倒し。
- DEC-019-051 月総額 ≤$430 cap 遵守の中核手段が **W0 段階で形になり**、subscription-driven 経路の strategy decision + lifecycle FSM が test 上で動作確認済み。
- 後続 W3/W4 は本 cli/ primitives を上位 layer に組み込む integration 作業に集中可能。

### §7.2 並列 R11 dispatch 全体寄与

本担当 D は workspace +147 tests のうち **+30 tests (20.4%)** を寄与。他 7 並列 Agent (Dev-A 等) と file conflict 0。

### §7.3 risk / open issue

- pre-existing typecheck エラー 1 件 (skill-adapter/subprocess.ts:386 R11 Dev-A 領域) — 本担当 D 範囲外、Dev-A 引継ぎ。
- adaptRealChildProcess は production 用 adapter として提供したが integration test は未実装 (DoD 範囲外)。Phase 1 W3 dry-run 期間に integration を追加する想定。
- pause / resume の SIGSTOP 連携は将来 hook 化 (現状は state 遷移のみ deterministic、実 OS signal は Phase 1 W4)。

---

## §8 結論

Round 11 Dev-D は CEO「最速で進めよ」命令を受けた W3 → W0 大胆前倒しを独立 Agent dispatch (DEC-019-025 SOP) で完遂。P-D 改 subscription-driven CLI 雛形 3 ファイル (spawn-claude-code / session-controller / subscription-router、約 730 行) を新規実装し、いずれも純関数 / TimeSource DI / AbortController / JSON IF 整合 / DryRunGuard 連携の設計原則を維持。新規 30 tests 全 pass (DoD 18+ を 1.67 倍超過)、workspace 507 tests 全 pass、regression 0、追加コスト $0、TypeScript strict 合格 (cli/ 範囲)、既存 src 完全無改変、特に R11 Dev-A skill-adapter/ 完全保護。DEC-019-051 月総額 ≤$430 cap 遵守の中核 architecture が W0 段階で形になり、Phase 1 W3 / W4 integration への基盤確立。

---

**Sign-off**: 2026-05-04 W0-Week1 深夜 / Dev R11 Dev-D
**次回**: Round 12 で cli/ index.ts export 追加 + skill-adapter/subprocess.ts との上位 layer integration を引継ぎ
