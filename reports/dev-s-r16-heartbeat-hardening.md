# PRJ-019 Round 16 Dev-S — heartbeat detector retry hardening (jitter + circuit-breaker + 50k load 設計)

最終更新: 2026-05-05 W0-Week1 / 起案: Dev 部門 R16 第 2 波 Dev-S（DEC-019-025 SOP 準拠）
位置付け: PRJ-019 公開 6/20 or 6/27 に向け Round 15 で達成した 5,000 件副作用 0 を 50,000 件まで負荷耐性拡張。Round 14 Dev-B 着地の `heartbeat-gap-primitive.ts` (286 行) に retry hardening (jitter + circuit-breaker hook) を最小差分で追加。
版: v1.0
連動 DEC: DEC-019-025 / 049 / 053 v15.5 / 054 / 055 / 057 / 062
連動レポート: `dev-round14-B-heartbeat-detector-retry.md`（Round 14 着地）/ `dev-round15-*` heartbeat 5,000 件副作用 0 達成
連動コード変更:
- `projects/PRJ-019/app/harness/src/heartbeat-gap-primitive.ts` — 287 → 416 行（+129）retry hardening primitives 3 種追加
- `projects/PRJ-019/app/harness/src/__tests__/heartbeat-load-50k.spec.ts.todo` — 121 行（新規 / skeleton / 次 Round 実行）

---

## §0 200 字 CEO サマリ

Round 16 第 2 波 Dev-S は heartbeat detector retry hardening を最小差分で完遂。`heartbeat-gap-primitive.ts` に Round 14 着地 API（HeartbeatGapTracker / trackHeartbeatStateless）を **無改変**で 3 種の純関数 primitive を追加: (1) `computeJitteredBackoffMs(attempt, policy, prevWaitMs, rand)` — AWS Architecture Blog "Exponential Backoff and Jitter" 準拠 4 戦略 (none / full / equal / decorrelated) で thundering herd 回避、(2) `RetryHardeningPolicy` 型 + `DEFAULT_RETRY_HARDENING` 既定値 (maxRetries=5 / baseDelayMs=1_000 / capMs=16_000 / jitter='full' / circuitFailureThreshold=10 / circuitCooldownMs=30_000)、(3) `decideRetryAction(attempt, policy, prevWaitMs, circuitOpen, rand)` — 純関数 retry decision (fire / sleep / fail-fast)。circuit-breaker は src/circuit-breaker.ts 既存 class を caller が注入する設計 (本 primitive は型 + 純関数のみ提供、副作用 0 / API $0)。50,000 件 load test は `heartbeat-load-50k.spec.ts.todo` skeleton (10 ケース / DoD 明記) で次 Round 実行に引継。harness 既存 **607 tests 全 PASS** + 自分の変更ファイルの TS strict pass 確認済（pre-existing knowledge/ ts errors とは無関係）。

---

## 目次

| § | 題目 |
|---|------|
| §1 | 現状確認 — heartbeat-gap-primitive.ts 構造 |
| §2 | retry hardening 提案 — jitter / circuit-breaker / load test |
| §3 | 実装 — 最小差分 +129 行 |
| §4 | 50,000 件 load test 設計 (10 ケース) |
| §5 | 検証 — 607 tests PASS / TS strict / 副作用 0 |
| §6 | Round 16 sign-off + 次 Round 引継 |

---

## §1 現状確認

タスク仕様の `heartbeat-detector.ts` は存在せず、Round 14 Dev-B が着地した **`heartbeat-gap-primitive.ts`**（287 行）が実体。本ファイルは `HeartbeatGapTracker` class（stateful tracker）と `trackHeartbeatStateless`（純関数版）を export し、`tos-monitor.ts` の `ContinuousRunDetector.recordHeartbeat()` と数値 8 桁一致が verify 済（19 tests）。retry policy は本 primitive ではなく **`notify-bridge.ts`** に Round 14 Task C で導入済（`RetryPolicy = { maxRetries, backoffMs, backoffStrategy: 'linear'|'exponential' }` / `computeBackoffMs` / `SleepFn` DI、397 行）。circuit-breaker は **`circuit-breaker.ts`**（163 行）に独立して存在し、`failureThreshold=5` / `cooldownMs=30s` / `successThreshold=1` の標準パターン実装済。

**統合の隙間**: heartbeat tracker と retry/circuit-breaker は **未連携**。50,000 件想定では (a) jitter なし exponential で thundering herd 発生リスク、(b) 連続失敗時の fail-fast 経路なし、(c) load test skeleton 不在。本 Round で 3 点を最小差分で埋める。

---

## §2 retry hardening 提案

### §2.1 jitter 追加 — thundering herd 回避

50,000 並列 retry 同時 fire の数学:
- exponential backoff base=1000ms, attempt=4: wait=16s（cap）
- jitter なし → 全 attempt が exact 16s 後に同時再試行 → herd 再現
- AWS Architecture Blog "Exponential Backoff and Jitter" の 4 戦略を実装:
  - **full**（既定）: `wait = rand(0, exp)` — uniform(0, 16s)、CV ≈ 0.577
  - **equal**: `wait = exp/2 + rand(0, exp/2)` — 半固定半乱
  - **decorrelated**: `wait = min(cap, rand(base, prev*3))` — 連続性あり
  - **none**: 既存挙動 (test / debug 用)

### §2.2 circuit-breaker pattern — fail-fast

既存 `CircuitBreaker` class（`circuit-breaker.ts`）は state machine（closed/open/half-open）を持つが、retry loop 側で `breaker.fire(fn)` を呼ぶ責務が caller にあり、jitter sleep を **breaker open 中もスキップする** ロジックが分散していた。本 Round では `decideRetryAction(attempt, policy, prevWaitMs, circuitOpen, rand)` の **純関数** で集約し、`circuitOpen=true` の場合 `kind='fail-fast', reason='circuit-open'` を即返す。caller は CircuitBreaker.status().state === 'open' を boolean に変換して渡すだけ。

### §2.3 50,000 件 load test 設計

10 ケース skeleton（`.todo` 拡張子で vitest pickup 対象外、次 Round で `.ts` rename）:
1. perf: 50,000 tick 同期 < 1s
2. jitter dispersion: full の wait 分布 stddev/mean ≈ 0.577（uniform 検定）
3. circuit-breaker fail-fast: open 中 49,990 件即 reject < 100ms
4. mixed load: 5,000 並列 tracker × 10 attempt = 50,000 retry, cross-talk 0
5. memory: heap delta <= 50MB（`global.gc` 利用）
6. determinism: seed 固定で wait 列 8 桁一致（再現性）
7. backoff cap: attempt=20 でも wait <= capMs
8. decorrelated unbounded grow なし（prevWaitMs フィードバック loop 安定）
9. fail-fast 'max-retries': attempt > maxRetries で必ず fail-fast
10. integration: `ContinuousRunDetector` との 50,000 tick 8 桁一致

---

## §3 実装 — 最小差分 +129 行

`heartbeat-gap-primitive.ts` 末尾に **新規 export 4 件** を追加（既存 287 行は完全無改変、追加のみ）:

| シンボル | kind | 行数 | 備考 |
|---|---|---|---|
| `JitterStrategy` | type | 1 | `'none' \| 'full' \| 'decorrelated' \| 'equal'` |
| `RetryHardeningPolicy` | interface | 14 | maxRetries / baseDelayMs / capMs / jitter / circuitFailureThreshold / circuitCooldownMs |
| `DEFAULT_RETRY_HARDENING` | const | 8 | `{5, 1_000, 16_000, 'full', 10, 30_000}` |
| `computeJitteredBackoffMs` | pure fn | 33 | DI: rand=Math.random、4 戦略分岐 |
| `RetryDecision` | type | 4 | `{kind:'fire'} \| {kind:'sleep'} \| {kind:'fail-fast'}` |
| `decideRetryAction` | pure fn | 17 | 純関数、circuitOpen / attempt 境界条件で kind 決定 |

設計原則:
- **既存 API 完全無改変**: HeartbeatGapTracker / trackHeartbeatStateless / NowMs / 戻り値 contract（0 / sleepMs / -1）すべて touch なし
- **副作用 0**: 純関数のみ、setTimeout / fetch / fs 一切呼ばない
- **DI 完備**: `rand` を引数化 → test で deterministic 化 / seedrandom 注入可能
- **circuit-breaker は型のみ依存**: `CircuitBreaker` class import せず、caller が `breaker.status().state === 'open'` を boolean で渡す疎結合

---

## §4 50,000 件 load test 設計詳細

`__tests__/heartbeat-load-50k.spec.ts.todo`（121 行 / 全 it.skip 想定）の DoD:
- 全 10 ケース PASS
- harness 既存 607 tests + 本 +10 tests = **617 tests PASS**
- vitest 全体実行時間 +5s 以下
- 副作用 0（timer / fs / fetch 触らず）
- API $0（純 in-memory）

実行条件（次 Round 着地時）:
- `node --expose-gc` for memory test (case 5)
- seedrandom の依存追加 or fast-check で代替（要検討）
- vitest config に `concurrency: 5_000` の設定（case 4 の Promise.all 並列）

---

## §5 検証

| 項目 | 結果 |
|---|---|
| 自分の変更ファイル TS strict | PASS（`tsc --noEmit` で heartbeat-gap-primitive / heartbeat-load-50k 由来エラー 0） |
| `heartbeat-gap-primitive.test.ts` 19 tests | PASS（5ms） |
| **harness 全体 42 files / 607 tests** | **全 PASS（3.54s）** |
| `circuit-breaker.test.ts` 8 tests | PASS（無改変、regression 0） |
| `notify-bridge-retry.test.ts` 12 tests | PASS（無改変、regression 0） |
| 副作用 0 | 純関数のみ、`Math.random` も DI 化（既定値のみ非決定） |
| API $0 | API call なし、新規依存 0 |
| 行数 | +129（既存 287 → 416）+ skeleton 121 = 全 250 行 |
| 絵文字 | 0 |

pre-existing TS errors（`knowledge/yaml-front-matter-parser.ts` の readonly array、`knowledge/ke-04-audit-wiring.ts` の spread types）は **本 Round と無関係**。Round 15 着地時から存在し、別 Dev タスクで処理予定。

---

## §6 Round 16 Dev-S sign-off + 次 Round 引継

### 引継 1: load test skeleton → 実体化

`heartbeat-load-50k.spec.ts.todo` を `.ts` rename し 10 ケース実装（次 Round Dev-S または別担当）。実装時の注意:
- case 2 の jitter dispersion は `Math.random` を seedrandom でモック必須（再現性）
- case 4 の 5,000 並列は vitest の `test.concurrent` + `Promise.all` で対応
- case 5 のメモリ測定は `--expose-gc` 必要、`process.memoryUsage().heapUsed` 前後 diff

### 引継 2: caller 側統合

`notify-bridge.ts` / `tos-monitor.ts` / `usage-monitor.ts` の retry loop を **段階的に** `decideRetryAction` + `computeJitteredBackoffMs` ベースへ移行（既存 API 互換のまま）。優先順位:
1. `notify-bridge.ts`（既に RetryPolicy DI 済 → jitter フィールド追加で互換維持）
2. `tos-monitor.ts` ContinuousRunDetector の自動 retry（未実装 → 新規導入）
3. `usage-monitor.ts` の watchdog（既存 retry なし、負荷高い場合のみ追加）

### 引継 3: circuit-breaker 連携の正式化

`CircuitBreaker.status().state` を boolean に変換する helper を追加検討（`isCircuitOpen(breaker): boolean`）。本 Round では caller 責務に留めたが、誤用リスク（half-open 中の扱い）を考慮し helper 化推奨。

### Round 16 Dev-S DoD

現状確認 / 提案 3 件 / 最小差分実装 +129 行 / load skeleton 121 行 / 報告書 / 607 tests PASS / API $0 / 副作用 0 / 絵文字 0 / TS strict — 全達成。
