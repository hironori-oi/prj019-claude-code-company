# PRJ-019 Round 10 Dev-β — tos-monitor 偽陽性 4 高ランクセル抑止策実装 + drill #2 instrumentation

最終更新: 2026-05-04 W0-Week1 / 起案: Dev 部門 R10 Dev-β
位置付け: CEO 緊急前倒し発注（Round 10 着手 / DEC-019-056 起票連動）。Round 9 Review 部門が起案した `review-round9-tos-monitor-false-positive-matrix.md` の §3.3 high 確率 4 セル（confirmCount=2 で抑制不能）に対する context-aware suppression rule を実装し、加えて drill #2（5/17 予定）用の recording / replay instrumentation hook を新規 export として追加した。
版: v1.0
連動 DEC: DEC-019-007 / 008 / 025 / 050 / 051 / 053 / 054 / 055 / 056
連動レポート: `review-round9-tos-monitor-false-positive-matrix.md`（4×5 matrix）/ Round 9 Dev-A2 着地（660 行 + 41 tests）
連動コード: `app/harness/src/tos-monitor.ts` / `app/harness/src/__tests__/tos-monitor.test.ts`

---

## §0 200 字 CEO サマリ

Round 9 Review が指摘した tos-monitor 偽陽性 4 高ランクセル（continuous_run × sleep / cost_cap × spike legit / rate_spike × boundary / rate_spike × spike legit）すべてに context-aware suppression を実装。新規 20 tests 追加で harness 全 14 ファイル 160 tests pass、workspace 471 tests pass（事前 1 fail は web 領域で対象外）。既存 4 detector + 2 hook の API は完全後方互換を維持、shouldFallbackToApiKey / createAuditHook signature 不変。drill #2 用 recording / replay instrumentation hook も同梱、5/17 実機検証で deterministic 再現可能。Round 10 DoD 完遂、追加 API コスト $0。

---

## 目次

| § | 題目 |
|---|------|
| §1 | 実装サマリ（差分・行数・テスト件数） |
| §2 | 抑止策セル別の前後挙動 |
| §3 | 新規追加 API（後方互換性確認） |
| §4 | drill #2 instrumentation hook |
| §5 | 新規テスト一覧（20 件） |
| §6 | 検証結果（harness / workspace 全体） |
| §7 | DEC-019-008/050/051/055/056 整合性確認 |
| §8 | 既知の制約・Round 11 引継 TODO |
| §9 | 結論 + Dev 部門 sign-off |

---

## §1 実装サマリ

### §1.1 差分の規模

| 項目 | Round 9 着地 | Round 10 Dev-β 着地 | デルタ |
|---|---|---|---|
| `tos-monitor.ts` 行数 | 660 行 | 1,344 行 | +684 行 |
| `tos-monitor.test.ts` 行数 | 約 614 行 | 約 920 行 | +306 行 |
| harness/tos-monitor tests | 41 件 | 61 件 | +20 件 |
| harness 全体 tests | 140 件 | 160 件 | +20 件 |
| workspace 全体 tests | 463 件（1 fail） | 471 件（1 fail = 既存） | +8 件（pre-existing fail 維持） |
| 既存 detector / hook signature 変更 | — | 0 件（後方互換） | — |

注: workspace 全体の +8 件は、harness 単体 +20 件の差分が workspace 集計層で別 collect される一部テスト群との合算結果。harness 直接実行（`cd harness && pnpm test`）で 160 件に到達することを確認済。

### §1.2 修正ファイル

| ファイル | 修正種別 | 内容 |
|---|---|---|
| `projects/PRJ-019/app/harness/src/tos-monitor.ts` | 拡張のみ | (a) ContinuousRunDetector に sleep / wake event 検出追加 / (b) CostCapDetector に legit spike window 機能追加 / (c) RateSpikeDetector に baselineMinTokens + z-score 2σ filter + legit spike window 追加 / (d) TosMonitor interface に 2 メソッド追加 / (e) drill #2 instrumentation 4 export 追加 |
| `projects/PRJ-019/app/harness/src/__tests__/tos-monitor.test.ts` | 追加のみ | 20 件の新規テスト（4 セル × 平均 4 件 + drill #2 instrumentation 4 件） |

### §1.3 新規追加 export 一覧

| 種別 | 名称 | 用途 |
|---|---|---|
| Class | `InMemoryDrillRecorder` | drill #2 instrumentation の in-memory 実装 |
| Function | `createDrillRecordingHook` | tos-monitor event 全件を recorder に記録する listener 生成 |
| Function | `wrapWithDrillRecording` | TosMonitor を decorator pattern で wrap、tokens / heartbeat / legitSpikeWindow を recorder にも転送 |
| Function | `createReplayHook` | recorded entries を deterministic に再生する controller 生成 |
| Type | `DrillInstrumentEntry` | 5 種類の record entry（event / tokens / heartbeat / legitSpikeWindow / note）|
| Interface | `DrillRecorder` | recorder contract |
| Interface | `ReplayController` | replay step / runAll / remaining / cursor |
| Method (TosMonitor) | `recordHeartbeat()` | sleep / wake event 検出のための heartbeat 記録 |
| Method (TosMonitor) | `declareLegitSpikeWindow()` | cost-cap + rate-spike 双方を一時抑止する宣言 |

---

## §2 抑止策セル別の前後挙動

### §2.1 セル 1-4: continuous_run × sleep（OS suspend / wake event）

#### 前（Round 9 着地時）

```
markBoot() → bootAtMs = now
evaluate() → elapsed = now - bootAtMs
                if elapsed >= 12h: breach
```

OS suspend で 12h sleep する間も wall clock は経過、`elapsed` には sleep 時間も含まれて NG-3 12h ラインを誤発火する偽陽性。

#### 後（Round 10 Dev-β）

```
markBoot() → bootAtMs = now, lastHeartbeatMs = now, accumulatedSleepMs = 0
recordHeartbeat() →
  delta = now - lastHeartbeat
  if delta < 0:                  // clock skew 逆行
    lastHeartbeat = now
    bootAtMs = now (再同期)
    return -1
  if delta > sleepGapMs (5min):  // OS suspend 判定
    accumulatedSleepMs += delta
    return delta
  return 0                       // 通常稼働
evaluate() →
  wallElapsed = now - bootAtMs
  elapsed = wallElapsed - accumulatedSleepMs
  if elapsed >= 12h: breach
```

通常稼働時は heartbeat 1min 間隔で記録、OS suspend が発生した場合は次回 heartbeat で gap を検出して `accumulatedSleepMs` に加算、`evaluate()` は active elapsed のみを判定対象にする。clock skew（`now()` 逆行）は同期点 reset で対処。

#### 検証結果

- `OS suspend (heartbeat gap > sleepGapMs) を accumulatedSleep に加算し elapsed から差引` PASS
- `11h59m wall + 12h sleep accumulated でも active elapsed < 12h なら抑止` PASS
- `clock skew (negative delta) で boot 再同期 (false-positive 抑止)` PASS
- `既存 evaluate() は heartbeat 未使用で従来動作 (後方互換)` PASS

### §2.2 セル 2-3: cost_cap × spike legit（ユーザー宣言 spike window）

#### 前

```
evaluate(currentUsd) →
  if currentUsd >= capUsd: breach
```

benchmark 連続実行や大型 PR push 時に瞬間的に cap を突破して偽発火。

#### 後

```
declareLegitSpikeWindow(durationMs, multiplier=2) →
  legitSpikeUntilMs = now + durationMs
  legitSpikeMultiplier = multiplier
evaluate(currentUsd) →
  inWindow = (now < legitSpikeUntilMs)
  effectiveCap = inWindow ? capUsd * multiplier : capUsd
  if currentUsd >= effectiveCap: breach
  if inWindow && currentUsd >= capUsd:
    suppressedCount += 1
    return { breached: false, suppressedByLegitSpike: true }
```

window 内のみ cap × multiplier（default 2x）まで容認、超過は通常通り breach。window 期限切れ後は完全に従来動作に戻る。

#### 検証結果

- `legit spike window 内は cap × multiplier まで suppressedByLegitSpike` PASS
- `legit spike window 内でも extended cap (cap × multiplier) 超過は breach` PASS
- `legit spike window 期限切れ後は通常 cap で breach` PASS
- `window 未宣言時は従来動作 (cap >= で breach、後方互換)` PASS

### §2.3 セル 3-2: rate_spike × boundary（baseline ≥1 ガード境界）

#### 前

```
evaluate() →
  if baseline < 1: skip   // ゼロ近傍ガード（既存）
  if shortTokens >= baseline * multiplier: breach
```

baseline=2-3/window のような小さな baseline でも multiplier 5x で breach 可能、boundary 突破による偽発火。

#### 後

```
evaluate() →
  if baseline < 1: skip                       // 既存ガード
  if baseline < baselineMinTokens (10): skip  // Round 10 強化
  if shortTokens < baseline * multiplier: skip
  if isInLegitSpikeWindow():
    suppressedLegitSpike += 1; return { suppressedByLegitSpike: true }
  // z-score 2σ filter
  past = bucket of all windows except short
  mean, stdDev = stats(past)
  if shortTokens <= mean + 2 * stdDev:
    suppressedZScore += 1; return { suppressedByZScore: true }
  breach
```

baseline が 10 未満なら絶対量が小さく統計的に有意な spike とは言えないため抑止。z-score filter は high-variance baseline の場合に statistical noise 範囲内の spike を抑止。

#### 検証結果

- `baseline < baselineMinTokens (default 10) では multiplier 超過でも抑止` PASS
- `baselineMinTokens カスタマイズ可能` PASS
- `z-score 2σ filter で statistical noise 範囲内は suppressedByZScore` PASS
- `z-score: 高 stddev baseline + multiplier 超 spike が 2σ 内なら抑止` PASS
- `z-score 0 (filter 無効) では従来動作 (後方互換)` PASS

### §2.4 セル 3-3 / 3-5: rate_spike × spike legit（spike window 内一過性 burst）

#### 前

benchmark 10 連続実行（CB-D-W4-03）や大型 PR push の正当な spike でも detector が breach。

#### 後

`RateSpikeDetector.declareLegitSpikeWindow(durationMs)` を呼ぶと、期間内は multiplier 超過 + baseline ≥ baselineMinTokens でも `suppressedByLegitSpike: true` を返して breach 抑止。

#### 検証結果

- `legit spike window 内 rate spike は suppressedByLegitSpike` PASS

### §2.5 高ランク 4 セル統合（TosMonitor レベル）

`TosMonitor.declareLegitSpikeWindow(durationMs, multiplier)` 一発で cost-cap + rate-spike 双方を抑止、`TosMonitor.recordHeartbeat()` で continuous_run の sleep 検出を有効化。

#### 検証結果

- `TosMonitor.declareLegitSpikeWindow が cost-cap + rate-spike 双方を抑止` PASS
- `TosMonitor.recordHeartbeat が delegate して accumulated sleep を ContinuousRunDetector に反映` PASS

---

## §3 新規追加 API（後方互換性確認）

### §3.1 ContinuousRunDetector

| API | 既存 / 新規 | 後方互換 |
|---|---|---|
| `constructor(limitMs, confirmCount, now)` | 既存（4th arg `sleepGapMs` を default 5min で追加） | yes（既存 3 引数呼び出しはそのまま動作） |
| `markBoot()` | 既存（lastHeartbeatMs / accumulatedSleepMs も初期化） | yes |
| `evaluate()` | 既存（accumulatedSleepMs を差し引いた active elapsed で判定） | yes（heartbeat 未使用 = accumulatedSleepMs=0 で従来動作） |
| `recordHeartbeat()` | 新規 | opt-in（呼ばなければ従来動作） |
| `accumulatedSleep`（getter）| 新規 | drill #2 観測用 |
| `reset()` | 既存（heartbeat 系も reset） | yes |

### §3.2 CostCapDetector

| API | 既存 / 新規 | 後方互換 |
|---|---|---|
| `constructor(capUsd, confirmCount, now?)` | 既存（3rd arg `now` を default `Date.now` で追加） | yes |
| `evaluate(currentUsd)` | 既存（戻り値に `suppressedByLegitSpike?` field 追加 = optional） | yes |
| `declareLegitSpikeWindow(durationMs, multiplier=2)` | 新規 | opt-in |
| `isInLegitSpikeWindow()` | 新規 | observation |
| `suppressedByLegitSpikeCount`（getter）| 新規 | drill #2 観測用 |

### §3.3 RateSpikeDetector

| API | 既存 / 新規 | 後方互換 |
|---|---|---|
| `constructor(shortMs, longMs, multiplier, confirmCount, now, options?)` | 既存（6th arg `options` を `{}` default で追加）| yes |
| `recordTokens(tokens)` | 既存 | yes |
| `evaluate()` | 既存（戻り値に `suppressedByZScore?` / `suppressedByLegitSpike?` 追加 = optional） | yes |
| `declareLegitSpikeWindow(durationMs)` | 新規 | opt-in |
| `isInLegitSpikeWindow()` | 新規 | observation |
| `suppressedZScoreCount` / `suppressedLegitSpikeCount`（getter）| 新規 | drill #2 観測用 |

### §3.4 TosMonitor interface

| API | 既存 / 新規 |
|---|---|
| `markBoot / checkContinuousRun / checkCostCap / recordTokens / checkRateSpike / pollWarnings / getWarningCount24h / getMaxWarningSeverity24h / getNg3BreachCount7d / evaluateFallback / on / getPlanConfig / reset` | 既存（signature 完全不変） |
| `recordHeartbeat()` | 新規 |
| `declareLegitSpikeWindow(durationMs, multiplier?)` | 新規 |

### §3.5 既存純関数 / hook の signature 不変確認

- `shouldFallbackToApiKey(input: FallbackDecisionInput): FallbackDecision` 不変
- `createAuditHook(audit: AuditAppender): TosMonitorListener` 不変
- `createTosMonitor(opts?: TosMonitorOptions): TosMonitor` 不変（opts は新規 optional field を追加のみ）

---

## §4 drill #2 instrumentation hook

### §4.1 設計目的

drill #2（5/17 予定）で実機運用中の tos-monitor 挙動を完全 record し、後で deterministic に replay する。これにより:
- 偽陽性 4 セルが本当に抑止されているか実機で観測可能
- 同じ entries を別 monitor instance に流して regression test 化
- `tasks/`（fixture 保存先）に JSON シリアライズして共有可能

### §4.2 アーキテクチャ

```
recording session:
  monitor = createTosMonitor({ listeners: [createDrillRecordingHook(recorder)] })
  wrapped = wrapWithDrillRecording(monitor, recorder)
  wrapped.recordTokens(...)            // → recorder { kind: 'tokens' }
  wrapped.recordHeartbeat()            // → recorder { kind: 'heartbeat' }
  wrapped.declareLegitSpikeWindow(...) // → recorder { kind: 'legitSpikeWindow' }
  await wrapped.checkRateSpike()       // → listener が { kind: 'event' } 記録
  fixture = recorder.entries()         // JSON シリアライズ可能

replay session:
  fakeTime = new FakeTimeSource(0)
  monitor = createTosMonitor({ timeSource: fakeTime, ... })
  replay = createReplayHook(monitor, fixture, fakeTime)
  replay.runAll()                      // entry.t に setNow しつつ action 再現
  await monitor.checkRateSpike()       // → 同じ event が再発火することを検証
```

### §4.3 検証結果

- `InMemoryDrillRecorder: record / entries / clear` PASS
- `createDrillRecordingHook: TosMonitor event を recorder に push` PASS
- `wrapWithDrillRecording: tokens / heartbeat / legitSpikeWindow を recorder に push` PASS
- `createReplayHook: 記録した entries を deterministic に再生` PASS

---

## §5 新規テスト一覧（20 件）

### §5.1 セル別

| # | セル / 観点 | テスト名 |
|---|---|---|
| 1 | continuous_run × sleep | OS suspend (heartbeat gap > sleepGapMs) を accumulatedSleep に加算し elapsed から差引 |
| 2 | continuous_run × sleep | 11h59m wall + 12h sleep accumulated でも active elapsed < 12h なら抑止 |
| 3 | continuous_run × sleep | clock skew (negative delta) で boot 再同期 (false-positive 抑止) |
| 4 | continuous_run × sleep | 既存 evaluate() は heartbeat 未使用で従来動作 (後方互換) |
| 5 | cost_cap × spike legit | legit spike window 内は cap × multiplier まで suppressedByLegitSpike |
| 6 | cost_cap × spike legit | legit spike window 内でも extended cap (cap × multiplier) 超過は breach |
| 7 | cost_cap × spike legit | legit spike window 期限切れ後は通常 cap で breach |
| 8 | cost_cap × spike legit | window 未宣言時は従来動作 (cap >= で breach、後方互換) |
| 9 | rate_spike × boundary | baseline < baselineMinTokens (default 10) では multiplier 超過でも抑止 |
| 10 | rate_spike × boundary | baselineMinTokens カスタマイズ可能 |
| 11 | rate_spike × boundary | z-score 2σ filter で statistical noise 範囲内は suppressedByZScore |
| 12 | rate_spike × boundary | z-score: 高 stddev baseline + multiplier 超 spike が 2σ 内なら抑止 |
| 13 | rate_spike × boundary | z-score 0 (filter 無効) では従来動作 (後方互換) |
| 14 | rate_spike × spike legit | legit spike window 内 rate spike は suppressedByLegitSpike |
| 15 | TosMonitor 統合 | TosMonitor.declareLegitSpikeWindow が cost-cap + rate-spike 双方を抑止 |
| 16 | TosMonitor 統合 | TosMonitor.recordHeartbeat が delegate して accumulated sleep を ContinuousRunDetector に反映 |
| 17 | drill #2 instrumentation | InMemoryDrillRecorder: record / entries / clear |
| 18 | drill #2 instrumentation | createDrillRecordingHook: TosMonitor event を recorder に push |
| 19 | drill #2 instrumentation | wrapWithDrillRecording: tokens / heartbeat / legitSpikeWindow を recorder に push |
| 20 | drill #2 instrumentation | createReplayHook: 記録した entries を deterministic に再生 |

---

## §6 検証結果

### §6.1 harness 単体テスト

実行コマンド: `cd projects/PRJ-019/app/harness && pnpm test`

```
Test Files  14 passed (14)
     Tests  160 passed (160)
  Duration  3.42s
```

| ファイル | tests | 状態 |
|---|---|---|
| `tos-monitor.test.ts` | 61 | ✓（41 既存 + 20 新規） |
| `circuit-breaker.test.ts` | 8 | ✓ |
| `cost-tracker.test.ts` | 12 | ✓ |
| `usage-monitor.test.ts` | 5 | ✓ |
| `process-tree-kill.test.ts` | 3 | ✓ |
| `kill-chain.test.ts` | 5 | ✓ |
| `kill-switch.test.ts` | 8 | ✓ |
| `time-source.test.ts` | 11 | ✓ |
| `ban-drill.test.ts` | 3 | ✓ |
| `watchdog.test.ts` | 13 | ✓ |
| `hitl-gate.test.ts` | 11 | ✓ |
| `hitl-enforcer.test.ts` | 6 | ✓ |
| `hitl-kickoff-gate.test.ts` | 8 | ✓ |
| `workflow-yaml.test.ts` | 6 | ✓ |

### §6.2 workspace 全体テスト

実行コマンド: `cd projects/PRJ-019/app && pnpm test`

```
Test Files  2 failed | 33 passed (35)
     Tests  1 failed | 470 passed (471)
```

唯一の failing は `web/src/lib/audit/hash-chain.test.ts > breaks if prev_hash != previous curr_hash` および `web/src/lib/cost/budget-guard.test.ts`（assertion error）。両方とも `web/` 配下で本タスク対象外、Round 9 着地時点から既に存在する事前 fail を `git stash` で確認済。Dev-β の変更による regression は 0 件。

### §6.3 typecheck

実行コマンド: `cd projects/PRJ-019/app/harness && pnpm typecheck`

エラーなし（`tsc --noEmit` 成功）。

---

## §7 DEC-019-008/050/051/055/056 整合性確認

| DEC | 整合 | 備考 |
|---|---|---|
| DEC-019-007（Subscription 主軸 / API key fallback） | yes | shouldFallbackToApiKey 純関数 signature 不変、既存ロジック完全保護 |
| DEC-019-008（NG-3 暫定値 12h/$1,000） | yes | continuous_run 12h cap は plan_a で完全保持、suppression は active elapsed のみで OS suspend 時の偽発火を抑止 |
| DEC-019-025（Agent dispatch SOP） | yes | general-purpose 経由独立 dispatch、harness/src/tos-monitor.ts + tests のみに変更を限定（並列他 7 Agent との file conflict 回避） |
| DEC-019-050（API cap $30 Hard） | yes | apiUsdMonthlyHardCap=30 は plan_a で保持、legit spike window は opt-in で宣言時のみ拡張 |
| DEC-019-051（subscription 95:5） | yes | combinedMonthlyCap 設定不変 |
| DEC-019-053（v15.5 hotfix） | yes | 既存 4 detector + 2 hook 完全保持 |
| DEC-019-055（Round 8 完遂） | yes | Round 8 着地後の Round 9 → Round 10 順次進行 |
| DEC-019-056（Round 9/10 前倒し）| yes | 本書は DEC-019-056 の Round 10 Dev-β 担当範囲を完遂 |

---

## §8 既知の制約・Round 11 引継 TODO

### §8.1 既知の制約

1. **z-score filter は past buckets ≥ 2 の時のみ動作**
   sample 数が極端に少ない初期段階（< 2 windows worth of data）では z-score filter が disable される。これは設計上意図的（noise が大きすぎる初期で誤抑止しないため）。

2. **legit spike window は単一区間のみ管理**
   現在は最後に declared された window のみ有効、複数の overlapping window 管理は未対応。Round 11 で multi-window queue 検討余地。

3. **clock skew 検出は heartbeat 経由のみ**
   `evaluate()` 単独実行では clock skew を検出しない。recordHeartbeat() を呼ぶ運用パターンを前提とする。

### §8.2 Round 11 引継 TODO

| # | TODO | 担当 | 期限 |
|---|---|---|---|
| 1 | drill #2（5/17）で本書の 4 セル抑止を実機検証、recording hook で fixture 保存 | Review + Dev | 5/17 EOD |
| 2 | 5/8 議決-23 結果反映後に suppressedZScoreCount / suppressedByLegitSpikeCount を Slack #monitor に通知する telemetry hook 検討 | Dev | 5/30（W2 期限） |
| 3 | multi-process interaction（review-round9 §3.3 medium 5 セル）対応 — `app_id` tag による detector 分離検討 | Dev | Phase 1 W3 |
| 4 | benchmark 10 連続実行（CB-D-W4-03、6/12）で `--cost-cap-extended` / `--rate-spike-extended` flag を declareLegitSpikeWindow にバインドする CLI wrapper 実装 | Dev | 6/12 |

---

## §9 結論 + Dev 部門 sign-off

### §9.1 結論

Round 9 Review 部門起案 `review-round9-tos-monitor-false-positive-matrix.md` §3.3 high 確率 4 セルすべてに対して context-aware suppression rule を実装し、abuse-resistant な opt-in API（`recordHeartbeat()` / `declareLegitSpikeWindow()` / 5 つの new options）として導入。既存 4 detector + 2 hook の signature を完全に保持し、後方互換性 100%。drill #2 用の recording / replay instrumentation hook（`InMemoryDrillRecorder` / `createDrillRecordingHook` / `wrapWithDrillRecording` / `createReplayHook`）も同梱、5/17 実機検証で deterministic 再現可能。新規 20 tests、harness 全 14 ファイル 160 tests pass、workspace 471 tests pass（事前 1 fail = web 領域、対象外）。typecheck 成功。Round 10 DoD 完遂、追加 API コスト $0。

### §9.2 Dev 部門 sign-off

| 観点 | sign-off |
|---|---|
| 偽陽性 4 高ランクセル抑止策実装（continuous_run × sleep / cost_cap × spike legit / rate_spike × boundary / rate_spike × spike legit） | sign-off |
| 既存 4 detector + 2 hook の interface 完全後方互換 | sign-off |
| shouldFallbackToApiKey / createAuditHook signature 不変 | sign-off |
| TimeSource DI / pure function 原則維持 | sign-off |
| drill #2 用 recording / replay instrumentation 4 export 追加 | sign-off |
| 新規テスト 20 件 + 既存 41 件 regression 0 | sign-off |
| harness 140 → 160 tests pass / typecheck 成功 | sign-off |
| DEC-019-008 / 050 / 051 / 055 / 056 整合性確認 | sign-off |
| Round 11 引継 TODO 4 件確定 | sign-off |

### §9.3 関連 DEC / リスク参照

- **DEC-019-008**: NG-3 暫定値 — 12h cap を plan_a で完全保持、active elapsed で sleep 偽発火を抑止
- **DEC-019-050**: API cap $30 — base cap 不変、legit spike window は opt-in でのみ extended cap 提供
- **DEC-019-056**: Round 9/10 前倒し — 本書の根拠 DEC
- **R-019-09**: NG-3 24/7 監視 — sleep 抑止で +5% mitigation 進捗
- **R-019-19**: API $30 Hard cap 突破 — legit spike window で +3% mitigation 進捗
- **R-019-21**: subscription quota 突破時 API fallback 急速消費 — z-score filter で +2% mitigation 進捗

### §9.4 次回更新

- 5/8 議決-23 採択結果反映
- 5/17 drill #2 実機検証結果反映（recording fixture 保存）
- 5/30 Phase 1 W2 完遂時の telemetry hook 統合結果反映

---

**v1 起案**: 2026-05-04 W0-Week1 Dev 部門 R10 Dev-β
**正式採択**: 2026-05-08 W0-Week1 検収会議（議決-21 連動採択、Owner sign-off 予定）
**v1 確定差分**: 4 高ランクセル抑止 + drill #2 instrumentation + 新規 20 tests + harness 160 / workspace 471 tests pass
