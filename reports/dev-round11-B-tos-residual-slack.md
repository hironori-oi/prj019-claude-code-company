# PRJ-019 Round 11 Dev-B — tos-monitor 残実装 6 件 + Slack quick-action + multi-process isolation

最終更新: 2026-05-04 W0-Week1 / 起案: Dev 部門 R11 Dev-B（DEC-019-025 SOP 準拠 / general-purpose Agent dispatch）
位置付け: CEO 即決「最速で進めよ」（判断-4 = 案 A confirmed）に基づく Round 11 着手。Round 10 Dev-β 着地後、Review-δ が指摘した残実装 6 件（high 4 セル primitive 4 + Owner Slack quick-action 1 + multi-process 独立確証 hook 1）を W1 → W0 前倒し完遂。
版: v1.0
連動 DEC: DEC-019-007 / 008 / 015 / 022 / 025 / 050 / 051 / 053 v15.5 / 054 / 055 / 056 / 057
連動レポート: `dev-round10-beta-tos-monitor-suppression.md`（Round 10 着地）/ `review-round10-50-controls-re-audit.md`（Review-δ 50 control 再監査）/ `review-round10-false-positive-re-eval-design.md`（4 セル偽陽性 matrix）
連動コード新規:
- `projects/PRJ-019/app/harness/src/suppression-primitives.ts` — 4 primitive 抽出（heartbeatGapDetector / LegitWindowGuard / zScoreFilter / clockSkewBoot）
- `projects/PRJ-019/app/harness/src/slack-quick-action.ts` — Owner Slack 3 button payload + zod schema + parser
- `projects/PRJ-019/app/harness/src/multi-process-isolation.ts` — process.pid + 起動 token + audit record + 衝突検出
- 各 `__tests__/*.test.ts`（55 新規 tests）
連動コード無改変: `projects/PRJ-019/app/harness/src/tos-monitor.ts`（1,344 行 / 既存 61 tests regression 0）

---

## §0 200 字 CEO サマリ

Round 11 Dev-B は Review-δ 残実装 6 件を W1 → W0 前倒しで全完遂。tos-monitor.ts 既存 1,344 行は無改変、独立 3 ファイル + 3 test ファイル新規追加で逆方向 dependency 厳守。harness 全体 160 → 215 tests pass（+55、+34%）、workspace 全体 483 → 507 tests pass（+24）、tos-monitor 既存 61 tests regression 0、API 追加コスト $0。primitive 4 件は zScoreFilter / LegitWindowGuard.effectiveCap / heartbeatGapDetector 5min 閾値が tos-monitor 既存実装と数値的に一致する regression セーフティネットを 3 tests で検証。Slack 3 button は zod discriminated union + JSON serialize + 期限切れ拒否。multi-process は drill #2（5/8 朝）で Sumi/Asagi 巻き添えゼロ確証可能。lint 新規ファイル 0 violation、typecheck pass。

---

## 目次

| § | 題目 |
|---|------|
| §1 | 実装サマリ（差分・行数・テスト件数） |
| §2 | suppression-primitives.ts — 4 primitive 抽出 |
| §3 | slack-quick-action.ts — Owner Slack 3 button payload |
| §4 | multi-process-isolation.ts — drill #2 巻き添えゼロ確証 |
| §5 | テスト網羅率と実行結果 |
| §6 | 既存無改変 + 逆方向 dependency 確認 |
| §7 | Round 11 Dev-B sign-off |

---

## §1 実装サマリ

### §1.1 差分の規模

| 項目 | Round 10 Dev-β 着地 | Round 11 Dev-B 着地 | デルタ |
|---|---|---|---|
| `tos-monitor.ts` 行数 | 1,344 行 | **1,344 行（不変）** | 0 |
| 新規ファイル数 | — | 3（src）+ 3（test） | +6 ファイル |
| harness 全体 tests | 160 件 | **215 件** | +55 件（+34%） |
| harness `tos-monitor.test.ts` tests | 61 件 | **61 件（不変）** | 0 件 regression |
| workspace 全体 tests | 483 件相当 | **507 件** | +24 件（仕様達成、目標 503+） |
| 既存 detector / hook signature 変更 | — | **0 件（後方互換完全維持）** | — |
| API 追加コスト | $0 | **$0** | 0 |

注: workspace 集計は openclaw-runtime 等の conditional test を含むため harness 単体 +55 と完全には連動しない（実測 507）。

### §1.2 新規追加ファイル一覧

| ファイル | 行数 | テスト件数 | 主要 export |
|---|---|---|---|
| `suppression-primitives.ts` | 232 行 | 22 件 | `heartbeatGapDetector` / `LegitWindowGuard` / `zScoreFilter` / `clockSkewBoot` |
| `slack-quick-action.ts` | 268 行 | 15 件 | `buildSlackQuickActionButton` / `parseSlackQuickAction` / `buildSlackQuickActionMetadata` / 3 zod schema |
| `multi-process-isolation.ts` | 235 行 | 18 件 | `buildProcessStartupRecord` / `buildProcessShutdownRecord` / `IsolationGuard` / `detectIsolationViolations` |
| 合計 | 735 行 | **55 件** | — |

### §1.3 既存無改変確認

| ファイル | 状態 |
|---|---|
| `tos-monitor.ts` | **無改変** (1,344 行 SHA 不変) |
| `tos-monitor.test.ts` | **無改変** (61 tests regression 0) |
| `index.ts` | **無改変** (新規 3 module は scenario-by-scenario import で十分 / barrel export は Round 12 で追加判断) |
| `cost-tracker.ts` / `kill-switch.ts` / `circuit-breaker.ts` / `time-source.ts` | **無改変** |

並列 R11 8 Agent との file conflict 回避のため、既存の barrel export `index.ts` への新規追加は意図的に保留。各 primitive / Slack / multi-process は明示 import で利用可能。

---

## §2 suppression-primitives.ts — 4 primitive 抽出

### §2.1 設計判断

Round 10 Dev-β で tos-monitor.ts 内の `RateSpikeDetector` / `CostCapDetector` / `ContinuousRunDetector` クラスに閉じ込めた抑止戦略を、**detector 非依存の generic primitive** として再抽出。

**逆方向 dependency 厳守**:
- `suppression-primitives.ts` は `tos-monitor` を import しない
- 既存の RateSpikeDetector 等は未だ `suppression-primitives` を import しない（既存無改変）
- 将来 G-V2-08 Gmail polling rate detector 等の新規 detector が本 primitive を import する想定

### §2.2 4 primitive interface

```ts
// 1. heartbeatGapDetector — pure function
export function heartbeatGapDetector(
  now: number,
  lastMs: number | null,
  sleepGapMs: number = 5 * 60 * 1000,
): HeartbeatTickResult  // { kind: 'first' | 'normal' | 'suspend' | 'skew', ... }

// 2. LegitWindowGuard — class with TimeSource DI
export class LegitWindowGuard {
  constructor(private readonly now: NowMs)
  declare(durationMs: number, multiplier = 1): void
  isActive(): boolean
  state(): LegitWindowState
  effectiveCap(baseCap: number): number  // baseCap × multiplier
  reset(): void
}

// 3. zScoreFilter — pure function
export function zScoreFilter(
  buckets: readonly number[],  // [0]=直近、残り=過去 baseline
  zThreshold = 2,
): ZScoreFilterResult  // { suppress, mean, stdDev, threshold, current }

// 4. clockSkewBoot — pure function
export function clockSkewBoot(
  now: number,
  lastSeenMs: number,
  bootAtMs: number,
  policy: 'reset_to_now' | 'preserve' | 'shift_by_delta' = 'reset_to_now',
): ClockSkewBootResult
```

### §2.3 既存 tos-monitor との regression セーフティネット

`suppression-primitives.test.ts` 末尾に 3 件の regression テストを追加し、本 primitive の数値計算が tos-monitor 既存実装と完全一致することを検証:

| 比較対象 | 検証内容 | 結果 |
|---|---|---|
| `zScoreFilter` ↔ `RateSpikeDetector.evaluate()` の z-score 算式 | mean / stdDev / threshold が浮動小数点 8 桁まで一致 | PASS |
| `LegitWindowGuard.effectiveCap` ↔ `CostCapDetector` の `inWindow ? cap × multiplier : cap` | 一致 | PASS |
| `heartbeatGapDetector` 5min 境界 ↔ `ContinuousRunDetector` default sleepGapMs | == 境界が normal、超過が suspend で一致 | PASS |

将来 tos-monitor の detector が本 primitive を採用するリファクタを検討する際、これら regression テストが互換性を保証する。

---

## §3 slack-quick-action.ts — Owner Slack 3 button payload

### §3.1 3 button 種別と zod schema

| kind | use case | UI style | confirm dialog | 主要 field |
|---|---|---|---|---|
| `kill_switch` | G-02 緊急停止（SIGTERM→SIGKILL chain） | `danger` | **必須** | `reason`, `graceSeconds` (1〜120, default 30) |
| `cost_cap` | 月次 cap 切替（30→100→500 USD） | `primary` | `requiresConfirmation` 可 | `newCapUsd` (≤1300, DEC-019-051 上限), `reason` |
| `drill_start` | BAN drill #1〜#3 即時起動 | `primary` | 不要 | `scenarioId` (`drill-1\|2\|3`), `dryRun` |

**discriminated union schema** で型安全:

```ts
export const SlackQuickActionPayloadSchema = z.discriminatedUnion('kind', [
  KillSwitchPayloadSchema,
  CostCapPayloadSchema,
  DrillStartPayloadSchema,
])
```

### §3.2 共通 metadata（replay 攻撃防止）

```ts
SlackQuickActionMetadataSchema = z.object({
  projectId, channelId, actorUserId,
  nonce: z.string().min(8),         // 16-byte hex 自動生成
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime(), // default 5min
})
```

### §3.3 builder / parser 責務境界

- 本ファイルは **payload + Slack Block Kit Button 表現** の生成・検証のみ
- 実 Slack API 通信（webhook POST）は `notify` package or 別 layer 責務
- audit hook は `parseSlackQuickAction(rawValue, actionId, nowMs)` を import して button click を verify

### §3.4 検証項目

| テストケース | 検証内容 |
|---|---|
| build kill_switch | `style='danger'` + `confirm` 必須 + `JSON.parse(value).kind === 'kill_switch'` |
| build cost_cap (confirm 必須/任意) | `requiresConfirmation` で `confirm` field の有無切替 |
| build drill_start dry-run | `text` に `dry-run` 含む / 本番は含まない |
| schema violation | `graceSeconds > 120`、`newCapUsd > 1300` で zod throw |
| parse round-trip | build → parse で同じ payload に戻る |
| parse invalid JSON | `/invalid JSON/` throw |
| parse action_id mismatch | cost_cap payload を kill_switch action_id で parse → throw |
| parse expired | `expiresAt < nowMs` で `/expired/` throw |
| metadata default 5min TTL | `expires - issued === 300_000` |

---

## §4 multi-process-isolation.ts — drill #2 巻き添えゼロ確証

### §4.1 drill #2（5/8 朝）背景

PRJ-019 Open Claw harness を本番起動した瞬間、PRJ-012 Sumi（Cursor session）と PRJ-018 Asagi（background runner）が同時稼働しているケースで、**本案件 harness のみが kill-switch / NG-3 trigger に反応し、Sumi/Asagi に巻き添えダメージが及ばないこと**を audit log で確証する必要がある（DEC-019-007 G-V2-01 並列 1 強制の運用安全弁）。

### §4.2 ProcessStartupRecord 構造

```ts
export interface ProcessStartupRecord {
  kind: 'isolation:start'
  projectId: string         // PRJ-019
  pid: number               // process.pid (DI 化)
  startupToken: string      // pid + startedAtMs + 24-char random hex
  startedAt: string         // ISO8601
  parentPid: number | null
  parallelAllowed: boolean  // G-V2-01 default false
  knownPeerPids: readonly number[]  // Sumi/Asagi の pid 観測値
}
```

`process.pid` 取得は `PidProvider` interface で DI 化（TimeSource と同様パターン）。test では fixed pid を注入して deterministic 検証。

### §4.3 衝突検出 (`detectIsolationViolations`)

3 種類の violation type を一括検出:

| type | 検出条件 | drill #2 での意味 |
|---|---|---|
| `pid_duplicate` | 同 pid で 2 record × 両方 `parallelAllowed=false` | OS が pid を再利用して別案件と競合 |
| `token_duplicate` | 同 startupToken で 2 record | 実装バグ（必ず違反） |
| `parallel_violation` | 同 projectId × 2 record × `parallelAllowed=false` | G-V2-01 違反（並列 1 強制） |

### §4.4 IsolationGuard lifecycle

```ts
const guard = new IsolationGuard({
  projectId: 'PRJ-019',
  pidProvider: () => process.pid,
  now: () => Date.now(),
})
const start = guard.start({ knownPeerPids: [sumiPid, asagiPid] })
// audit.append(start)  // → audit/clawbridge.log
// ... harness lifecycle ...
const stop = guard.stop('completed')
// audit.append(stop)
// → drill 完了後 grep "isolation:start" で衝突なし確認
```

### §4.5 検証項目

| テストケース | 検証内容 |
|---|---|
| buildProcessStartupRecord 必須フィールド | DI で固定 pid + token 注入し全フィールド検証 |
| parallelAllowed=true / parentPid 指定 | 上書き反映 |
| self pid in knownPeerPids | throw `/self pid/`（drill 設計エラー検知） |
| invalid input | projectId 空 / pid 負値 で throw |
| default pidProvider | `process.pid > 0` 確認 |
| buildProcessShutdownRecord durationMs | 30s 経過で `durationMs === 30_000` |
| clock skew (end < start) | throw `/before start/` |
| IsolationGuard 重複 start | throw `/already started/` |
| IsolationGuard start 前 stop | throw `/not started/` |
| current() snapshot immutable | 別オブジェクト返す |
| detectIsolationViolations: 違反なしケース | 異 pid + 異 token + 異 projectId で `[]` |
| pid_duplicate / token_duplicate / parallel_violation | 各 type 検出 |
| parallelAllowed=true 同士 | pid 重複も違反扱いしない（test harness 用例外） |
| **drill #2 シナリオ（PRJ-019 + PRJ-012 + PRJ-018 同時）** | 異 pid + 異 token = `[]` 違反なし |

---

## §5 テスト網羅率と実行結果

### §5.1 harness 全体（17 ファイル / 215 tests）

```
$ cd projects/PRJ-019/app/harness && pnpm test

✓ src/__tests__/suppression-primitives.test.ts    (22 tests)  8ms
✓ src/__tests__/multi-process-isolation.test.ts   (18 tests) 14ms
✓ src/__tests__/slack-quick-action.test.ts        (15 tests) 31ms
✓ src/__tests__/tos-monitor.test.ts               (61 tests) 110ms  ← 既存無改変、regression 0
✓ src/__tests__/cost-tracker.test.ts              (12 tests)
✓ src/__tests__/usage-monitor.test.ts             ( 5 tests)
✓ src/__tests__/process-tree-kill.test.ts         ( 3 tests)
✓ src/__tests__/time-source.test.ts               (11 tests)
✓ src/__tests__/kill-chain.test.ts                ( 5 tests)
✓ src/__tests__/watchdog.test.ts                  (13 tests)
✓ src/__tests__/kill-switch.test.ts               ( 8 tests)
✓ src/__tests__/circuit-breaker.test.ts           ( 8 tests)
✓ src/__tests__/hitl-enforcer.test.ts             ( 6 tests)
✓ src/__tests__/ban-drill.test.ts                 ( 3 tests)
✓ src/__tests__/hitl-gate.test.ts                 (11 tests)
✓ src/__tests__/hitl-kickoff-gate.test.ts         ( 8 tests)
✓ src/__tests__/workflow-yaml.test.ts             ( 6 tests)

Test Files  17 passed (17)
     Tests  215 passed (215)
  Duration  3.66s
```

### §5.2 workspace 全体（507 tests）

| package | tests pass | 備考 |
|---|---|---|
| harness | 215 | +55 (本 Round) |
| openclaw-runtime | 118 | 既存 |
| needs-scout | 79 | 既存 |
| e2e | 50 | 既存 |
| claude-bridge | 29 | 既存 |
| openclaw-monitor (scripts) | 10 | 既存 |
| audit | 6 | 既存 |
| **合計** | **507** | DoD 503+ 達成 |

### §5.3 typecheck / lint

| check | 結果 |
|---|---|
| `pnpm typecheck` (`tsc --noEmit`) | **PASS**（新規 3 ファイル + 3 test ファイルともクリーン） |
| `pnpm lint` 新規ファイルのみ | **0 violation** |
| `pnpm lint` 既存ファイル | 既存の lint エラー（tos-monitor.ts 等）は本 Round で無改変方針のため修正対象外 |

---

## §6 既存無改変 + 逆方向 dependency 確認

### §6.1 tos-monitor.ts 完全無改変

```bash
$ git diff --stat projects/PRJ-019/app/harness/src/tos-monitor.ts
# (no output = unchanged)
```

既存 1,344 行 + 61 tests は本 Round で 1 文字も触れていない。Round 10 Dev-β 着地 SHA を保持。

### §6.2 逆方向 dependency 厳守

| 新規ファイル | tos-monitor を import? | 既存 ファイルを import? |
|---|---|---|
| `suppression-primitives.ts` | **No** | No（zero-dep） |
| `slack-quick-action.ts` | **No** | `zod`（既存 dep） |
| `multi-process-isolation.ts` | **No** | No（zero-dep） |

すべて `tos-monitor` への依存ゼロ。将来 detector 側がこれら primitive を採用する場合は単方向依存（detector → primitive）になる。

### §6.3 並列 R11 8 Agent との file conflict ゼロ

本 Agent は以下のみ追加/変更:
- 新規: `suppression-primitives.ts` / `slack-quick-action.ts` / `multi-process-isolation.ts`
- 新規: `__tests__/suppression-primitives.test.ts` / `__tests__/slack-quick-action.test.ts` / `__tests__/multi-process-isolation.test.ts`
- 変更ゼロ: `tos-monitor.ts` / `index.ts` / その他既存ファイル

`index.ts` の barrel export 追加は意図的に保留（並列 Agent との conflict 回避）。後続 Round で必要に応じて統合。

---

## §7 Round 11 Dev-B sign-off

### §7.1 DoD 全項目達成

| DoD 項目 | 目標 | 実績 | 判定 |
|---|---|---|---|
| 4 primitive each テスト着地 | 12+ tests | **22 tests** | PASS（+10） |
| Slack quick-action 3 button payload テスト | 4+ tests | **15 tests** | PASS（+11） |
| multi-process isolation テスト | 4+ tests | **18 tests** | PASS（+14） |
| 既存 tos-monitor.test.ts regression | 0 件 | **0 件（61/61 維持）** | PASS |
| harness 全体テスト | 180+ pass | **215 pass** | PASS（+35） |
| workspace 全体テスト | 503+ pass | **507 pass** | PASS（+4） |
| 既存ファイル無改変 | tos-monitor.ts 等 | **完全無改変** | PASS |
| 新規ファイル数 | 3 src + 3 test | **3 + 3** | PASS |
| API 追加コスト | $0 | **$0** | PASS |

### §7.2 ファイル ManifEST

```
projects/PRJ-019/app/harness/src/
  ├── suppression-primitives.ts          (232 行 NEW)
  ├── slack-quick-action.ts              (268 行 NEW)
  ├── multi-process-isolation.ts         (235 行 NEW)
  ├── tos-monitor.ts                     (1,344 行 UNCHANGED)
  └── __tests__/
      ├── suppression-primitives.test.ts  (22 tests NEW)
      ├── slack-quick-action.test.ts      (15 tests NEW)
      ├── multi-process-isolation.test.ts (18 tests NEW)
      └── tos-monitor.test.ts            (61 tests UNCHANGED)
```

### §7.3 Round 12 引継 TODO（任意・本 Round 完遂後の future work）

1. **`index.ts` barrel export 統合**: 並列 R11 完了後、3 新規 module を `index.ts` に追加（10 行程度の軽微変更）
2. **tos-monitor 内部 detector の primitive 採用 refactor**: regression テスト 3 件で互換性保証済 → 安全に置換可能
3. **Slack 実通信 layer**: `notify` package 側で `buildSlackQuickActionButton` を import + webhook POST 実装
4. **audit hook 統合**: `IsolationGuard.start/stop` を `FileAuditLogStore.append` に直接配線するアダプタ
5. **drill #2 5/8 朝実機検証**: `IsolationGuard` を Sumi/Asagi 同時起動環境で実行、audit log grep で衝突ゼロ確認

これらは Round 11 DoD には含まれず、Round 12 以降の選択肢として記録。

### §7.4 結論

Round 11 Dev-B は CEO 即決「最速で進めよ」の指令通り、Review-δ が指摘した残実装 6 件（high 4 セル primitive 4 + Owner Slack quick-action 1 + multi-process 独立確証 hook 1）を W1 → W0 前倒しで全完遂。tos-monitor.ts 既存無改変・逆方向 dependency 厳守・API コスト $0・workspace 全体 507 tests pass を達成。drill #2（5/8 朝）の Sumi/Asagi 巻き添えゼロ確証は `IsolationGuard.detectIsolationViolations` で実機 verify 可能。

Dev 部門 R11 Dev-B sign-off。
