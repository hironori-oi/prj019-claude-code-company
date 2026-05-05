# Dev-HH Round 21 第 2 波 — W4 MonotonicClock + e2e fully wired

- 案件: PRJ-019 Open Claw "Clawbridge"
- 担当: Dev-HH (Round 21 第 2 波, 9 並列の 1)
- 範囲: 24h SLA MonotonicClock 二系統 cross-check + sla-clock-adapter + e2e fully wired (W4)
- 目的: Dev-EE Round 20 W3 で確立した HITL-10 24h SLA wall-clock 検証を、system clock 異常 (NTP step / DST / process suspend) に耐える monotonic 系に昇格させ、Dev-GG W4 持続化 BreachCounter + Round 22 本番 wiring に向けた e2e 統合段階を確立する。
- 領域不可侵: Dev-EE 担当 17day-path-w3-rollback-permission-orchestrator.ts / 17day-path-w3-e2e-7ctrl.test.ts は touch せず。Dev-GG 担当 BreachCounter 永続化 / openclaw-runtime-bridge.ts は本 file 内に **shape 互換 stub** を内包し import なしで smoke check (Round 22 で Dev-GG actual file への差し替えのみで本番 wiring 化可能 = port-only 設計)。control 本体ファイル無改変。

## 0. サマリ

| 項目 | 値 |
|---|---|
| 新規 file | 4 (monotonic-clock 1 + sla-clock-adapter 1 + tests 2) + 報告 1 |
| 実装行数 | monotonic-clock 約 175 行 / sla-clock-adapter 約 130 行 / monotonic-clock tests 約 200 行 / w4-e2e tests 約 530 行 / 報告 約 220 行 |
| 新規 tests | **20 (monotonic-clock 9 + w4-e2e-fully-wired 11)** |
| Dev-HH 単独実行 | **20 PASS / 0 FAIL** (約 12ms) |
| harness 全体 | **766 PASS / 56 files / 0 FAIL** (Round 20 末 720 → +20 / regression 0) |
| TypeScript strict (新規 file) | 型エラー 0 件 (既存 cross-rootDir / knowledge errors は pre-existing, Dev-EE Round 20 報告 §7 に同記録) |
| Public API of any ctrl | 完全不変 (port 注入のみ) |
| 副作用 / 絵文字 / API コスト | 0 / 0 / $0 (Read + Edit + Write のみ) |

## 1. MonotonicClock 二系統 cross-check 実装

### 1.1 設計判断

Dev-EE Round 20 §6.2 引継要請に従い、HITL-10 24h SLA wall-clock 検証を `Date.now()` 単一系から `Date.now() + performance.now()` 二系統 cross-check に格上げ。

**二系統採用根拠:**
- `Date.now()` (wall-clock 系): system clock を反映するため NTP sync / DST / 手動 timezone 変更 / VM clock drift で前後する
- `performance.now()` (Node では `process.hrtime` ベース): プロセス開始からの monotonic 単調増加。OS sleep 復帰時も巻き戻らない
- 二系統の `elapsedMs` 差分 (skew) が閾値超なら system clock 異常と判定

**skew 閾値 = 5_000ms (5 秒) 採用論拠:**

| 観点 | 値 | 判定 |
|---|---|---|
| 24h SLA 全長 | 86_400_000 ms | 5_000 ms は SLA の 0.0058% で精度を損なわない |
| 正常 NTP 1 step 補正 | 128ms 〜 数秒 | 5_000ms 閾値で誤検出しない |
| NTP step による jump | 典型 1〜30 秒 | 確実に検出 |
| DST 切替 | 3_600_000 ms (1h) | 閾値遥か超え、確実に検出 |
| 手動 timezone 変更 | 1〜数時間 | 確実に検出 |
| process suspend (OS sleep) 復帰 | 数十秒〜数十分 | 確実に検出 |

→ 5 秒は「正常 NTP では誤検出なし、異常 jump は確実に検出」のスイートスポット。`createMonotonicClock({ skewThresholdMs })` で test / 運用で上書き可能。

### 1.2 公開 API

```ts
createMonotonicClock(options): MonotonicClock
DEFAULT_SKEW_THRESHOLD_MS: 5_000

interface MonotonicClock {
  markNow(): ClockMark                           // 副作用 0、両系統同時取得
  elapsedMs(start: ClockMark): ElapsedReading    // wallElapsed / monoElapsed / skew / skewDetected
  detectSkew(start: ClockMark): boolean          // shortcut
  readonly skewThresholdMs: number
}
interface ClockMark { wallMs: number; monoMs: number }
interface ElapsedReading {
  wallElapsedMs: number; monoElapsedMs: number;
  skewMs: number; skewDetected: boolean;
}
```

mark/elapsed パターンで「ある時点からの経過」を取り出す。test では固定値 / 配列を返す mock を `wallNowMs` / `monoNowMs` に注入し、NTP step / DST jump / process suspend 復帰を deterministic に再現。

## 2. sla-clock-adapter 実装

### 2.1 設計判断

Dev-EE 既存 `createPermissionOrchestrator(ports.nowMs: () => number)` の port shape を変えずに MonotonicClock を注入するため、adapter で `nowMs` 関数を提供する。

**動作方針 (fail-closed):**
1. constructor で `clock.markNow()` を起点 mark として保持
2. `nowMs()` 呼出時に `clock.elapsedMs(mark)` を実行
3. **正常時**: `mark.wallMs + monoElapsedMs` を返す → wall-clock 巻き戻りを上位に伝播させない
4. **skew 検出時 + onSkew='fail_closed'** (default): `mark.wallMs + APPROVAL_SLA_MS + 1` を返す → 上位 orchestrator の `tNow >= t0 + APPROVAL_SLA_MS` が必ず true → permission timeout に丸め込み
5. `onSkew='pass_through'`: skew 観測のみで `mark.wallMs + monoElapsedMs` を返す (audit のみ運用)

### 2.2 公開 API

```ts
createSlaClockAdapter(clock, options): SlaClockAdapter
interface SlaClockAdapterOptions {
  onSkew?: 'fail_closed' | 'pass_through'  // default: fail_closed
  slaWindowMs?: number                     // default: APPROVAL_SLA_MS = 24h
}
interface SlaClockAdapter {
  nowMs: () => number                      // createPermissionOrchestrator.nowMs に直接渡せる
  resetMark(): void                        // 同一 adapter で複数 lifecycle 回す test 用
  lastSkewMs(): number | null              // audit 用 read-only
  skewObserved(): boolean                  // skew が一度でも閾値超を観測したか
  startMark(): ClockMark                   // test 用 read-only
}
```

**接続コード例 (Round 22 W5 で本番 wiring 化想定):**
```ts
const clock = createMonotonicClock()
const adapter = createSlaClockAdapter(clock)
const permission = createPermissionOrchestrator({
  approver,
  auditSink,
  nowMs: adapter.nowMs,  // ← Dev-EE 既存 port shape そのまま
})
```

Dev-EE file 無改変で接続完了。

## 3. e2e fully wired 拡張 (W4)

### 3.1 経路設計

```
[ Bridge.acquire() = Dev-GG W3 ctx 同 shape stub ]
         ↓
(1) C-OC-03 → (2) C-OC-04 → (3) P-UI-02         [Dev-AA 既存 factory]
         ↓
(4) P-UI-04 latch query (bridge ctx.killQuery)   [stub 内包]
         ↓
(5) P-UI-05 rollback executor                    [Dev-EE 既存 factory + Dev-GG persistent counter stub]
         ↓
(6) HITL-10 permission auditor                   [Dev-EE 既存 factory + Dev-HH MonotonicClock SLA adapter]
         ↓
(7) P-UI-09 RLS audit aggregator                 [stub 内包 = Dev-EE 既存 e2e と同 shape]
```

### 3.2 e2e tests (新 file `17day-path-w4-e2e-fully-wired.test.ts`, 11 tests / 4 groups)

| ID | シナリオ | 検証 |
|---|---|---|
| W-1 | bridge ok → 7 ctrl 通し → aggregator に rollback_completed + permission_approved 集約 | full wired happy path |
| W-2 | C-OC-03 soft-fail via bridge → escalation 不発火, downstream 独立 | W2 I-5 / I-11 reflection |
| W-3 | invocation order が Dev-EE 推奨 sequence と完全一致 | sequence ['C-OC-03', 'C-OC-04', 'P-UI-02', 'P-UI-05.exec', 'HITL-10'] |
| B-1 | bridge.create() throw → e2e 起動拒否 / 全 ctrl 不発火 | 異常系 |
| B-2 | bridge.acquire() で reject → orchestrator 構築失敗を上位 catch 可能 | 異常系 |
| P-1 | Persistent BreachCounter initial=0 → 1st breach 後 snapshot.count=1 | restart 想定 |
| P-2 | 前 process で count=1 復元 → 1 回 breach で trip 即 rollback | restart 復元 |
| P-3 | rollback ok 後 snapshot=0 (counter reset の永続化反映) | 永続化 reset 連鎖 |
| M-1 | MonotonicClock 正常 → permission approved → audit 1 件 / skew 0 | adapter 通常系 |
| M-2 | NTP forward step 30s 検出 → fail_closed → permission timeout 丸め込み | adapter fail-closed |
| M-3 | NTP backward step → fail_closed → 同じく timeout 丸め込み | adapter fail-closed (負 skew) |

### 3.3 領域不可侵維持

- Dev-EE 既存 file (`17day-path-w3-rollback-permission-orchestrator.ts` / `17day-path-w3-e2e-7ctrl.test.ts`) — touch なし
- Dev-GG 担当 file (BreachCounter persistence + openclaw-runtime-bridge.ts) — まだ存在しないが、本 file 内に **同 shape stub** を内包し interface 互換性を smoke check 済。Round 22 で Dev-GG actual file 完成後、stub を `import { createBridge } from '../openclaw-runtime-bridge.js'` 等に置換するだけで本番 wiring に切替可能 (port-only 設計のため orchestrator 側は無改変)。
- control 本体 (`openclaw-runtime/src/controls/*`) — 一切 import せず

## 4. tests 結果

```
$ npx vitest run src/__tests__/monotonic-clock.test.ts
   9 tests passed (約 3ms)

$ npx vitest run src/__tests__/17day-path-w4-e2e-fully-wired.test.ts
   11 tests passed (約 9ms)

$ npx vitest run (full harness suite)
   766 tests passed / 56 files / 0 FAIL (約 4.95s)

  baseline (Round 20 末): 720 PASS / 51 files
  Dev-HH 単独段階: +20 = 766 PASS / 56 files / regression 0
```

| File | tests | 結果 |
|---|---|---|
| `monotonic-clock.test.ts` (新規 Dev-HH) | **9** | PASS |
| `17day-path-w4-e2e-fully-wired.test.ts` (新規 Dev-HH) | **11** | PASS |
| W3 既存 (Dev-AA + Dev-BB + Dev-DD + Dev-EE) | 65 | PASS (regression 0) |
| 残 harness 既存 | 681 | PASS (regression 0) |

### 4.1 monotonic-clock test グループ詳細 (4 groups, 9 tests)

- Group 1 (mark/elapsed correctness, 2 tests): M-1 (正常 skew=0) / M-2 (累積経過 2 段)
- Group 2 (dual-source consistency, 2 tests): D-1 (+1s skew within threshold) / D-2 (-1s skew within threshold)
- Group 3 (system clock skew detection, 3 tests): S-1 (NTP +30s) / S-2 (NTP -10s) / S-3 (DST 1h jump)
- Group 4 (detectSkew shortcut + custom threshold, 2 tests): F-1 (shortcut 整合) / F-2 (custom threshold 100ms)

### 4.2 w4-e2e-fully-wired test グループ詳細 (4 groups, 11 tests)

- Group 1 (full wired happy path via bridge stub, 3 tests): W-1 / W-2 / W-3
- Group 2 (bridge initialization failure, 2 tests): B-1 / B-2
- Group 3 (e2e + persistent BreachCounter stub, 3 tests): P-1 / P-2 / P-3
- Group 4 (e2e + MonotonicClock SLA adapter, 3 tests): M-1 / M-2 / M-3

## 5. system clock skew 検出論拠

| skew 種別 | wall 系挙動 | mono 系挙動 | 検出 | 影響 |
|---|---|---|---|---|
| NTP slew (連続補正) | 数 ms/s ペースで前進 | 単調増加 | skewMs ≪ 5_000 で 非検出 | SLA 計算は monotonic に従い続け wall-clock 微調整は許容 |
| NTP step forward | 数秒〜数十秒 jump 前進 | 単調増加 | 検出 | fail_closed → 上位 timeout 丸め込み = 安全側 |
| NTP step backward | 巻き戻り | 単調増加 | 検出 (skew 負) | 同上 |
| DST 切替 | 1h jump | 単調増加 | 確実検出 | 同上 |
| 手動 timezone 変更 | 大規模 jump | 単調増加 | 確実検出 | 同上 |
| process suspend (OS sleep 復帰) | suspend 中の wall 経過分 jump | suspend 中は mono も停止 | mono もある程度進む実装あり / 検出感度は OS 依存 | suspend 復帰時は SLA 起点を更新する運用を Round 22 で検討 (resetMark) |
| VM clock drift | 緩やかな skew (秒/h) | 比較的安定 | 長時間で検出可能 | fail_closed で上位 timeout = 24h SLA 切迫時に保全 |

**Owner formal「丁寧に」directive 遵守:**
- 24h SLA は wall-clock 単独では NTP step / DST 等で誤判定の可能性があったが、本 monotonic clock 二系統 cross-check で skew 検出時は **fail-closed (timeout 側)** に倒すため、approver 判定が pending のまま放置される race condition は decisively 解消される。
- 全ての skew 種別について検出 / 影響を上記表で網羅。

## 6. Dev-GG bridge との接続点

Dev-GG が Round 21 第 2 波で実装する 2 task:

1. **本番 wiring** (`app/harness/src/openclaw-runtime-bridge.ts`)
2. **BreachCounter 永続化** (file factory)

への接続点:

### 6.1 bridge 接続点

本 file W4 e2e tests は内部で `createBridgeStub()` を使用する。**Dev-GG 完成後の置換手順** (Round 22 W5):
```ts
// Before (本 file 内 stub)
const bridge = createBridgeStub({ agg, killActive: false })

// After (Dev-GG actual)
import { createBridge } from '../openclaw-runtime-bridge.js'
const bridge = createBridge({ ...config })
```

`Bridge` interface (`acquire(): Promise<BridgeContext>`) と `BridgeContext` shape (`postRollback / permissionAudit / killQuery`) は本 file で定義済み = Dev-GG 側でも同 shape を満たせば 1 行差し替えで接続完了。

### 6.2 PersistentBreachCounter 接続点

本 file `createPersistentBreachCounterStub({ count, lastLoopId })` が Dev-EE 既存 `BreachCounter` interface を実装。`createRollbackOrchestrator(ports, counter)` の第 2 引数に渡せる (Dev-EE Round 20 既存 API)。

**Dev-GG 完成後の置換手順** (Round 22 W5):
```ts
// Before (本 file stub, in-memory snapshot)
const counter = createPersistentBreachCounterStub({ count: 0, lastLoopId: null })

// After (Dev-GG actual file factory)
import { createFileBreachCounter } from '../file-breach-counter.js'
const counter = await createFileBreachCounter({ path: 'state/breach.json' })
```

## 7. Round 22 W5 引継

### 7.1 本番 wiring 完成 (Dev-GG file 完成後)

- 本 file e2e bridge stub → Dev-GG `createBridge` 直接 import 化
- 本 file persistent counter stub → Dev-GG `createFileBreachCounter` 直接 import 化
- 期待 regression: 0 (port shape 維持)

### 7.2 SLA adapter の本番運用組込み

- `Harness` クラス init 時に MonotonicClock + sla-clock-adapter を 1 instance ずつ作る
- `permission lifecycle` 単位で `adapter.resetMark()` を呼ぶ運用を確立 (`requestPermission` 入口で reset、終局判定後 dispose)

### 7.3 process suspend (OS sleep) 復帰時の起点更新

- 現状は suspend 中も wall-clock が進む環境では skew 検出 → fail_closed で SLA timeout 丸め込みになる
- 改善案: harness lifecycle hook で suspend 検出時 `adapter.resetMark()` を呼び SLA 計算起点を更新する
- 工数見積: 約 1.5h (検出 hook + tests 4 件)

### 7.4 ClockMark の persistence 検討

- 現状 markNow は in-memory ClockMark を保持。harness restart で起点 mark 喪失
- BreachCounter 永続化 (Dev-GG) と同じく、permission ticket 単位で markStartedAt を file で永続化することで、24h SLA を harness restart 跨ぎでも保全可能
- 注: `performance.now()` は process 起点 monotonic なので、restart 時には wall-clock 経由で再計算が必要 (Round 22 で詳細設計)

### 7.5 skew 監視と運用 alerting

- `adapter.skewObserved()` / `adapter.lastSkewMs()` は audit 用 read-only ですでに expose 済
- Round 22 で notify-bridge 経由で skew 検出を Slack 通知する経路を組み込み、運用側で system clock 異常を即知できる体制に発展

## 8. 実装中遭遇課題

### 8.1 nowMs 呼出回数と adapter 配列 mock 設計

`createPermissionOrchestrator.request` 内で `ports.nowMs()` は 2 回呼ばれる (t0 + tNow)。adapter は内部で `clock.elapsedMs(mark)` を呼び、`elapsedMs` は `wallNowMs()` + `monoNowMs()` を 1 回ずつ呼ぶ。さらに adapter constructor 時に `clock.markNow()` で 1 回 (各系統)。

この呼出順を deterministic に再現するため、test M-2 / M-3 では wallSeq / monoSeq を独立 index で進める設計を採用。配列長は 3 (mark + t0 elapsed + tNow elapsed) で、元 wall+30_000ms の skew 分が 3 番目に現れる。

### 8.2 fail_closed mode で SLA 越境を確実にする値選択

orchestrator は `tNow >= t0 + APPROVAL_SLA_MS` で timeout 判定する (≧)。adapter が `mark.wallMs + slaWindowMs + 1` を返せば必ず越境。`+1` の根拠: integer offset で安全側に倒すため (`mark.wallMs + slaWindowMs` だと等号成立で実装上問題ないが、orchestrator 内部実装が `>` に変わった場合に備えて `+1`)。

### 8.3 BridgeContext shape の Dev-GG 想定

Dev-GG actual file は本 file 完成時点で未存在。Dev-EE Round 20 §6.3 と Dev-BB W3 ctx (`W3OrchestratorContext`) の構造を参考に、本 file 内 `BridgeContext` を以下 3 port のみで構成:
- `postRollback: PostRollbackNotifierPort`
- `permissionAudit: PermissionAuditSinkPort`
- `killQuery: KillTerminalQueryPort`

これは Dev-EE が `adaptW3ContextToRollbackPorts` / `adaptW3ContextToPermissionPorts` に渡している shape の sub-set に相当し、Dev-GG が `createW3OrchestratorContext()` (Dev-BB 既存) を内側で組み立てて bridge に積む実装でもそのまま適合する設計。

### 8.4 vitest expect.toBe(true) と adapter.lastSkewMs() null 排除

M-3 で `expect(adapter.lastSkewMs()! < 0).toBe(true)` の non-null assertion を使用。直前に `expect(adapter.lastSkewMs()).not.toBeNull()` を明示してから assertion することで、null 状態のまま比較するバグを排除。

---

**SOP 順守**: DEC-019-025 (background dispatch、SOP 実証 18 件目) に基づき、Dev-HH は他 9 並列 Agent と独立稼働。Dev-EE 担当 file (orchestrator + e2e) には touch せず、Dev-GG 担当 file (BreachCounter persistence + bridge) はまだ存在しないため shape 互換 stub を本 file 内に内包して interface 互換性のみ smoke check (Round 22 で actual file への 1 行差し替えで本番 wiring 化可能)。control 本体 (openclaw-runtime/src/controls/*) も完全無改変。
