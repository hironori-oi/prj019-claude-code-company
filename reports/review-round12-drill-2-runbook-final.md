# PRJ-019 — Round 12 BAN drill #2 5/8 朝実機検証ランブック確定版（operator 即時実行可能版 v1.0）

最終更新: 2026-05-04 W0-Week1 深夜 / 起案: Review 部門 R12 Review-D
位置付け: Owner formal「最速で進めよ」directive 継続中、議決-26 採択 5 軸の **軸-2（BAN drill #2 5/8 朝実機検証）補強**。Round 11 Review-C の `review-round11-drill-2-execution-spec.md`（480 行、9 シナリオ × 5 要素 = 45 セル）を当日 operator がそのまま読みながら実行可能なレベルに **分単位 timeline + Pre-condition / Trigger / Expected / Pass criteria / Rollback の 5 項目化** で確定。abort criteria 3 件明示、Dev-C Round 12 の `drill-2-pre-execution-dry-run.test.ts`（45 セル網羅）を実機検証 runner として再利用可能化。
版: v1.0 確定版（Round 12 Review-D 起案、5/8 朝当日実行用）
連動 DEC: DEC-019-007 / DEC-019-019（drill #1 シナリオ承認）/ DEC-019-025 / DEC-019-050 / DEC-019-052 / DEC-019-054 / DEC-019-055 / DEC-019-056 / DEC-019-057
連動レポート: `review-round11-drill-2-execution-spec.md`（480 行、9 シナリオ 5 要素仕様の起源）/ `review-round11-false-positive-matrix-v2.md`（high 4→0、月次 < 0.07%）/ `review-round11-50-controls-95-roadmap.md`（64% → 82% (5/15) → 95%+ (5/30)）/ `dev-round10-beta-tos-monitor-suppression.md` / `dev-round10-gamma-e2e-g12-bench.md`
連動コード（read-only 参照のみ、無改変）: `app/harness/src/tos-monitor.ts`（1,344 行）/ `app/harness/src/__tests__/tos-monitor.test.ts`（920 行）/ `app/harness/src/dry-run-guard.ts` / `app/harness/src/benchmarks/baseline.ts` / `app/e2e/src/flow/run-mock-claw-flow.ts` / `app/harness/src/circuit-breaker.ts` / `app/harness/src/kill-switch.ts` / `app/harness/src/usage-monitor.ts` / `app/harness/src/__tests__/drill-2-pre-execution-dry-run.test.ts`（Dev-C Round 12 起案予定、45 セル網羅 runner）

---

## §0 200 字 CEO サマリ

BAN drill #2 5/8 朝 06:00-08:00 実機検証用の **operator 即時実行可能ランブック** を確定。Round 11 Review-C の 9 シナリオ 5 要素仕様を **分単位 timeline（120 分）+ Pre-condition / Trigger / Expected / Pass criteria / Rollback** に再構成し、05:50-06:00 環境準備、06:00-06:30 シナリオ 1-3（通常稼働 / kill-switch / cost cap）、06:30-07:00 シナリオ 4-6（rate spike / heartbeat gap / clock skew）、07:00-07:30 シナリオ 7-9（multi-process / Slack quick-action / audit log）、07:30-08:00 結果集計 + audit log grep + Sumi/Asagi cross check。**abort criteria 3 件明示**: (a) preflight 9 項目で 3 件以上不通過、(b) S-1〜S-4 で 2 件以上 Critical FAIL、(c) Sumi/Asagi quota 1+ 消費。Dev-C Round 12 の dry-run runner を実機 runner として再利用可能化、**5/8 朝実機準備度 = GO**。read-only 厳守、コード一切無改変。

---

## 目次

| § | 題目 |
|---|------|
| §1 | 当日 operator 5 役割 + 集合手順（05:50-06:00） |
| §2 | 分単位 timeline 確定版（05:50-08:00、130 分） |
| §3 | 05:50-06:00 環境準備（git pull / pnpm install / dry-run pre-flight） |
| §4 | 06:00-06:30 シナリオ 1-3（通常稼働 / kill-switch / cost cap） |
| §5 | 06:30-07:00 シナリオ 4-6（rate spike / heartbeat gap / clock skew） |
| §6 | 07:00-07:30 シナリオ 7-9（multi-process / Slack quick-action / audit log） |
| §7 | 07:30-08:00 結果集計 + audit log grep + Sumi/Asagi cross check |
| §8 | abort criteria 3 件 + 即時中断手順 |
| §9 | Dev-C `drill-2-pre-execution-dry-run.test.ts` runner 再利用 SOP |
| §10 | Round 13 引継 TODO |

---

## §1 当日 operator 5 役割 + 集合手順（05:50-06:00）

### §1.1 5 役割確定（Round 11 Review-C §1.2 を踏襲）

| 役割 ID | 役割名 | 担当部署 | 当日主作業 |
|---|---|---|---|
| R-1 | 議長 | CEO | drill #2 開始/終了宣言、9 シナリオ進行、PASS/FAIL 即時判断、Owner 連絡指示 |
| R-2 | 観測 | Review | PASS criteria 計測、Slack post 件数監視、tos-monitor event 観測、`InMemoryDrillRecorder.entries()` JSON 化 |
| R-3 | 異常実行 | Dev | 9 シナリオ mock injection、`monitor.recordTokens` / `recordHeartbeat` / `declareLegitSpikeWindow` 実行、circuit-breaker 5 系統並列発火 |
| R-4 | P-E 切替 | Dev | claude-bridge config 切替、5 件 send 実行、Sumi/Asagi 経路独立性確認 |
| R-5 | Owner 連絡 | 秘書 | 05:50 / 06:50 / 07:50 / 08:00 Slack 投稿、Owner alternate 経路確認、fixture JSON 5/8 EOD 保存指示 |

### §1.2 集合手順 05:50-06:00（10 分）

| 時刻 | 担当 | 動作 | 完遂条件 |
|---|---|---|---|
| 05:50 | R-5 | Slack `#clawbridge-alerts` で 5 役割 ack 確認投稿（@channel） | 5/5 ack 受信 → 06:00 集合確定 |
| 05:52 | 各役割 | 役割名 + 在席 reply（30s 上限） | 5 件 reply |
| 05:55 | R-5 | Owner Slack DM「drill #2 開始 5min 前」自動通知投稿 | Owner ack 不要、投稿事実のみ確認 |
| 05:57 | R-1 | 9 シナリオ概要再確認（5 役割同期、§4-6 ヘッダ通読） | 5 役割同意 |
| 06:00 | R-1 | drill #2 開始宣言 + Slack `#clawbridge-alerts` post | 開始時刻 ISO8601 記録 |

### §1.3 集合不達時のエスカレーション

| 不達条件 | 対応 |
|---|---|
| 05:55 までに ack 4/5 以下 | R-5 が個別 DM、05:58 までに 5/5 達成不可なら §8 abort criteria #1 適用検討 |
| Owner Slack DM 経路不通 | 議長単独判断 + 5/8 09:00 検収会議で Owner 事後 sign-off |
| 議長 R-1 不在 | Review 部門 R-2 が議長代行、Owner 即時 Slack DM 報告 |

---

## §2 分単位 timeline 確定版（05:50-08:00、130 分）

### §2.1 timeline 全体表

| 時刻 | 区分 | アクティビティ | 担当 | 所要 |
|---|---|---|---|---|
| 05:50-06:00 | 集合 + 環境準備 | §1 集合 + §3 環境準備（git pull / pnpm install / dry-run pre-flight） | R-2 + R-3 + R-5 | 10min |
| 06:00 | 開始 | drill #2 開始宣言（議長）+ 9 シナリオ概要再確認 | R-1 | 0min |
| 06:00-06:10 | 通常稼働 baseline | S-1 通常稼働 baseline 確認 | R-3 + R-4 | 10min |
| 06:10-06:20 | kill-switch | S-2 emergency_stop（kill-switch + circuit-breaker 5 系統並列）| R-3 + R-2 | 10min |
| 06:20-06:30 | cost cap | S-3 cost_cap × spike legit（declareLegitSpikeWindow 1h × 2 multiplier） | R-3 + R-2 | 10min |
| 06:30-06:40 | rate spike | S-4 rate_spike × boundary（baselineMinTokens 10 + z-score 2σ filter） | R-3 + R-2 | 10min |
| 06:40-06:50 | heartbeat gap | S-5 continuous_run × sleep boundary（accumulatedSleepMs + heartbeat） | R-3 + R-2 | 10min |
| 06:50 | 中間報告 | Slack `#clawbridge-alerts` に S-1〜S-5 完遂中間報告投稿 + Owner Slack DM | R-5 | 1min |
| 06:50-07:00 | clock skew | S-6 clock skew 注入（heartbeat 再同期動作確認） | R-3 + R-2 | 10min |
| 07:00-07:10 | multi-process | S-7 Sumi/Asagi 巻き添え確認（3 アプリ並列稼働で Open Claw 単独 emergency_stop）| R-3 + R-4 | 10min |
| 07:10-07:20 | Slack quick-action | S-8 Owner override（Slack quick-action button 30min SLA mock）| R-3 + R-5 | 10min |
| 07:20-07:30 | audit log | S-9 audit log replay + hash chain verify（SHA-256） | R-3 + R-2 | 10min |
| 07:30-07:45 | 結果集計 | 12 軸 PASS criteria 集計 + `InMemoryDrillRecorder.entries()` JSON 化 + audit log grep | R-1 + R-2 + R-4 | 15min |
| 07:45 | 完遂宣言 | drill #2 完遂宣言（議長、12 軸速報）+ Slack post | R-1 | 1min |
| 07:45-07:55 | Sumi/Asagi cross check | Sumi (PRJ-018) / Asagi (PRJ-008) 同時起動 quota 0 消費確認 | R-4 | 10min |
| 07:55 | Owner 速報 | Slack `#clawbridge-alerts` + Owner Slack DM「12 軸 PASS criteria 速報 + 議決-26 採択推奨度判定文」投稿 | R-5 | 1min |
| 08:00 | 終了 | drill #2 終了宣言 + W0-Week1 検収会議 09:00 への引継 | R-1 | 0min |

### §2.2 9 シナリオ → Round 11 Review-C との対応（再番号化）

| Round 12 ランブック | Round 11 Review-C spec | 焦点 |
|---|---|---|
| S-1 通常稼働 baseline | （新規追加、preflight 補強）| baseline 70% RPS で 5min 持続、正常 evaluate() |
| S-2 kill-switch | Round 11 §4.1 S-1 emergency_stop | 401/403 5 連続 + circuit-breaker 5 系統並列 |
| S-3 cost cap | Round 11 §4.7 S-7 cost_cap × spike legit | declareLegitSpikeWindow 1h × 2 multiplier |
| S-4 rate spike | Round 11 §4.8 S-8 rate_spike × boundary | baselineMinTokens 10 + z-score 2σ filter |
| S-5 heartbeat gap | Round 11 §4.6 S-6 continuous_run × sleep boundary | accumulatedSleepMs + heartbeat |
| S-6 clock skew | （Round 11 §4.6 補強）| heartbeat 再同期 + monotonic clock 整合 |
| S-7 multi-process | Round 11 §4.5 S-5 Sumi/Asagi 巻き添え | 3 アプリ並列で Open Claw 単独 kill |
| S-8 Slack quick-action | Round 11 §4.7/§4.9 Owner override | Slack quick-action button 30min SLA mock |
| S-9 audit log | Round 11 §4.4 S-4 復旧 + audit chain verify | hash chain valid + replay 整合 |

注: Round 11 Review-C の S-1〜S-9 と本ランブックの S-1〜S-9 は番号順が異なる（実機検証の順序最適化）。本ランブックの順序は **依存関係 + リスク段階的進行**（baseline → kill-switch → 抑止策 → 巻き添え → audit）に基づく。

---

## §3 05:50-06:00 環境準備（git pull / pnpm install / dry-run pre-flight）

### §3.1 環境準備 9 項目チェックリスト（5min 上限）

| # | 項目 | 確認コマンド | PASS 基準 | 担当 |
|---|---|---|---|---|
| 1 | repo 最新化 | `cd C:/Users/hiron/Desktop/claude-code-company && git pull --ff-only origin main` | up-to-date or fast-forward 完了 | R-2 |
| 2 | pnpm install | `cd app/harness && pnpm install --frozen-lockfile` | exit 0 | R-3 |
| 3 | harness/Vitest tos-monitor | `cd app/harness && pnpm test --reporter=verbose --run tos-monitor` | 61 tests pass | R-2 |
| 4 | tos-monitor 1,344 行 importable | `node -e "const m=require('./dist/tos-monitor.js'); console.log(typeof m.createTosMonitor)"` | `function` 出力 | R-2 |
| 5 | drill #2 instrumentation 4 export | `node -e "const m=require('./dist/tos-monitor.js'); console.log(['InMemoryDrillRecorder','createDrillRecordingHook','wrapWithDrillRecording','createReplayHook'].every(k => k in m))"` | `true` 出力 | R-3 |
| 6 | dry-run-guard importable | `node -e "const m=require('./dist/dry-run-guard.js'); console.log(typeof m.createDryRunGuard)"` | `function` 出力 | R-3 |
| 7 | e2e flow mock-claw-flow 動作 | `cd app/e2e && pnpm test --run mock-claw-flow` | 8 tests pass | R-3 |
| 8 | benchmarks fixture 存在 | `ls app/harness/benchmark-results.json` | file 存在 | R-2 |
| 9 | Sumi/Asagi 稼働 + Owner alternate 経路 | Slack `#sumi-ops` + `#asagi-ops` heartbeat 5min 以内 + Owner ack request → 30s 内応答 | 3 件すべて確認 | R-4 + R-5 |

### §3.2 dry-run pre-flight（Dev-C Round 12 runner）

```bash
# Dev-C Round 12 起案予定の dry-run runner を 05:55-06:00 で実行
cd C:/Users/hiron/Desktop/claude-code-company/app/harness
pnpm test --run drill-2-pre-execution-dry-run --reporter=verbose
```

**期待出力**: 45 セル（9 シナリオ × 5 要素）すべて green、所要 < 60s。
**不通過時**: §3.3 不通過対応に従う。

### §3.3 環境準備不通過時の対応

| 不通過項目 | 対応 |
|---|---|
| 1 (git pull) | merge conflict なら R-2 が解決（read-only branch なので fast-forward 失敗時は drill #2 中止 = §8 abort criteria #1）|
| 2 (pnpm install) | lockfile 不整合なら drill #2 中止 |
| 3-4 (harness)| **§8 abort criteria #1 適用、5/12 復帰**|
| 5-7 (instrumentation / dry-run / e2e)| **縮退実施**（drill #2 instrumentation 不使用、observation のみ実施）|
| 8 (benchmarks)| 縮退実施（S-3 cost cap で benchmark fixture 不使用、手動値で代替）|
| 9 (Sumi/Asagi/Owner)| **S-7 縮退**（observation のみ）+ 議長単独判断 |

### §3.4 環境準備完遂判定

| 判定 | 条件 |
|---|---|
| **GO** | 9 項目すべて PASS、Dev-C dry-run runner 45/45 green |
| **CONDITIONAL GO** | 1-4 すべて PASS + 5-9 のいずれか縮退、議長判断で続行 |
| **HOLD / abort** | 1-4 のいずれか不通過 → §8 abort criteria #1 適用 |

---

## §4 06:00-06:30 シナリオ 1-3（通常稼働 / kill-switch / cost cap）

### §4.1 S-1: 通常稼働 baseline（06:00-06:10、10min）

| 項目 | 内容 |
|---|---|
| **Pre-condition** | (a) 環境準備 §3 GO、(b) `monitor = createTosMonitor()` 起動済、(c) `recorder-s1 = new InMemoryDrillRecorder()` 生成 |
| **Trigger** | `monitor = wrapWithDrillRecording(monitor, recorder-s1); for (let i=0; i<300; i++) await monitor.recordTokens(70);`（70 RPS 5min 持続 baseline） |
| **Expected** | (a) `evaluate()` returns `{breached: false}`、(b) `recorder-s1.entries()` に 300 件 tokens entry、(c) Slack post 0 件、(d) circuit-breaker open 0 件 |
| **Pass criteria** | O-baseline-1: breach 件数 = 0 / O-baseline-2: token 記録 300 件 / O-baseline-3: Slack post 0 件 |
| **Rollback** | (a) `monitor.reset()`、(b) `recorder-s1.clear()` 不要（保管）、(c) S-2 へ進行 |

### §4.2 S-2: kill-switch（06:10-06:20、10min）

| 項目 | 内容 |
|---|---|
| **Pre-condition** | (a) S-1 PASS、(b) `recorder-s2 = new InMemoryDrillRecorder()` 生成、(c) circuit-breaker 5 系統 closed 状態確認 |
| **Trigger** | `for (let i=0; i<5; i++) await monitor.pollWarnings({ status: i<3?401:403, body: '{"error":"unauthorized"}' });` + 並行で `circuitBreaker.forceOpen()` × 5 系統 |
| **Expected** | (a) tos-monitor event `kind: 'unauthorized_chain_detected'` 発火、(b) `kill-switch.trigger()` 呼出、(c) 5 系統 forceOpen 同期 ≤ 500 ms、(d) Slack `#clawbridge-alerts` `[CRITICAL] emergency_stop fired` post |
| **Pass criteria** | O-1: kill-switch elapsed ≤ 5,000 ms（`performance.now()`）/ O-2: circuit-breaker 5 系統 100% 同期 ≤ 500 ms |
| **Rollback** | (a) `kill-switch.disarm()`、(b) circuit-breaker 5 系統 `forceClose()`、(c) `monitor.reset()`、(d) `recorder-s2.entries()` 退避保管 |

### §4.3 S-3: cost cap（06:20-06:30、10min）

| 項目 | 内容 |
|---|---|
| **Pre-condition** | (a) S-2 PASS + rollback 完遂、(b) `recorder-s3` 生成、(c) cost-tracker `currentUsd === 0` 確認 |
| **Trigger** | `await monitor.declareLegitSpikeWindow(3600000, 2);` + `for (let i=0; i<10; i++) await costTracker.recordSpend(3.5);`（合計 $35、cap $30 超え、extended cap $60 内） |
| **Expected** | (a) `evaluate()` returns `{breached: false, suppressedByLegitSpike: true}`、(b) `suppressedByLegitSpikeCount += 1`、(c) Anthropic console mock で hard cap 動作なし（$60 < $60 cap）、(d) Owner Slack quick-action button mock post |
| **Pass criteria** | O-7: `--cost-cap-extended` flag 受理 + detector 1h 一時無効化 + Owner override 30min SLA 内 mock 応答 |
| **Rollback** | (a) `costTracker.reset()`、(b) `monitor.disableLegitSpikeWindow()`、(c) `recorder-s3.entries()` 退避保管 |

### §4.4 06:00-06:30 区分判定

| 判定 | 条件 |
|---|---|
| **段階 GO** | S-1 + S-2 + S-3 すべて PASS |
| **CONDITIONAL** | S-1 PASS + S-2 PASS + S-3 PARTIAL（Owner mock 応答遅延等） |
| **abort** | S-2 で kill-switch 5,000 ms 超過 → §8 abort criteria #2 検討 |

---

## §5 06:30-07:00 シナリオ 4-6（rate spike / heartbeat gap / clock skew）

### §5.1 S-4: rate spike × boundary（06:30-06:40、10min）

| 項目 | 内容 |
|---|---|
| **Pre-condition** | (a) S-3 PASS + rollback、(b) `recorder-s4` 生成、(c) baselineMinTokens 10 設定確認 |
| **Trigger** | (a) baseline 70% 70 RPS で 5min 持続（既 S-1 と同等の baseline）、(b) 瞬間突破 5 RPS で 1sec 注入、(c) baselineMinTokens 10 設定で baseline=8 注入で抑止確認、(d) z-score 2σ filter 動作確認: 高 stddev baseline + multiplier 超 spike が 2σ 内なら抑止 |
| **Expected** | (a) 1 サイクル目 strip + 確定発火なし、(b) `suppressedByZScore: true` + `suppressedZScoreCount += 1`、(c) jittering 統合で request 間隔 std > 0、(d) sliding window rate calculation でなめらか動作 |
| **Pass criteria** | O-8: debounce 60s 動作 + 1 サイクル目 strip + false-positive 月次発生確率 < 1% |
| **Rollback** | (a) `monitor.reset()`、(b) `recorder-s4.entries()` 退避保管、(c) S-5 へ進行 |

### §5.2 S-5: heartbeat gap（06:40-06:50、10min）

| 項目 | 内容 |
|---|---|
| **Pre-condition** | (a) S-4 PASS + rollback、(b) `recorder-s5` 生成、(c) `monitor.markBoot()` 実行済 |
| **Trigger** | (a) Vitest fake timer で 11h59min59sec advance、(b) `monitor.recordHeartbeat()` 1min 間隔で 12 回呼出（その間に OS suspend mock 12h 注入）、(c) `monitor.checkContinuousRun()` で判定 |
| **Expected** | (a) `accumulatedSleepMs` に 12h 加算、(b) `wallElapsed - accumulatedSleepMs = active elapsed < 12h`、(c) `evaluate()` returns `{breached: false}`、(d) heartbeat 12 件 recorder 記録 |
| **Pass criteria** | O-6: tolerance 60s 動作（23:55-00:05 境界 / 11:55-12:05 境界で誤発火件数 0 件）+ false-positive 月次発生確率 < 1% |
| **Rollback** | (a) `monitor.reset()`、(b) `recorder-s5.entries()` 退避保管、(c) S-6 へ進行 |

### §5.3 06:50 中間報告（1min）

| 担当 | 動作 | 完遂条件 |
|---|---|---|
| R-5 | Slack `#clawbridge-alerts` に「S-1〜S-5 完遂中間報告」投稿（5/5 PASS or 縮退状況明示） | post 確認 |
| R-5 | Owner Slack DM 同時投稿 | Owner ack 不要 |
| R-1 | 後半 4 シナリオ進行確認 + 06:50 → 07:00 を S-6 開始時刻として確定 | timeline 整合 |

### §5.4 S-6: clock skew（06:50-07:00、10min）

| 項目 | 内容 |
|---|---|
| **Pre-condition** | (a) S-5 PASS、(b) `recorder-s6` 生成、(c) monotonic clock spy ON |
| **Trigger** | (a) `clock.advance(60000)` で 1min 進行、(b) `clock.skew(-30000)` で -30s skew 注入、(c) `monitor.recordHeartbeat()` 呼出、(d) skew 後の `lastHeartbeat = now` 再同期確認 |
| **Expected** | (a) skew 検出 event 発火 (`kind: 'clock_skew_detected'`)、(b) heartbeat 再同期完了、(c) `accumulatedSleepMs` 整合性維持（skew 量を sleep として誤計上しない）、(d) monotonic clock 観測値が wall clock と独立 |
| **Pass criteria** | O-skew-1: skew 検出 + 再同期 ≤ 1,000 ms / O-skew-2: accumulatedSleepMs 整合（誤計上 0 ms） |
| **Rollback** | (a) `clock.reset()`、(b) `monitor.reset()`、(c) `recorder-s6.entries()` 退避保管 |

### §5.5 06:30-07:00 区分判定

| 判定 | 条件 |
|---|---|
| **段階 GO** | S-4 + S-5 + S-6 すべて PASS |
| **CONDITIONAL** | S-4 + S-5 PASS + S-6 PARTIAL（skew 再同期遅延等） |
| **abort** | S-4/S-5 のいずれかで月次偽陽性率 ≥ 1% 検出 → §8 abort criteria #2 |

---

## §6 07:00-07:30 シナリオ 7-9（multi-process / Slack quick-action / audit log）

### §6.1 S-7: multi-process（07:00-07:10、10min）

| 項目 | 内容 |
|---|---|
| **Pre-condition** | (a) S-6 PASS + rollback、(b) Sumi (PRJ-018) 稼働確認、(c) Asagi (PRJ-008) 稼働確認、(d) `recorder-s7` 生成 |
| **Trigger** | (a) Sumi normal task 実行 (PRJ-018 hello-world)、(b) Asagi normal task 実行 (PRJ-008 daily report)、(c) Open Claw に 401/403 5 連続注入で kill-switch trigger（S-2 と同等） |
| **Expected** | (a) Open Claw kill 完遂 ≤ 5,000 ms、(b) Sumi の Claude Code OAuth quota 消費 0、(c) Asagi の OpenAI Codex API quota 消費 0、(d) Slack 通常 ch（`#sumi-ops` / `#asagi-ops`）混入 0 件 |
| **Pass criteria** | O-10: Sumi quota 0 消費 / O-11: Asagi quota 0 消費 / O-12: 通常 ch 混入 0 件（3 軸全 PASS） |
| **Rollback** | (a) Open Claw kill-switch disarm、(b) Sumi/Asagi 通常運用継続、(c) `recorder-s7.entries()` 退避保管 |

**重要**: S-7 で Sumi/Asagi quota 1+ 消費 検出時 → **§8 abort criteria #3 即時適用**（drill #2 中止 + 5/12 復帰）。

### §6.2 S-8: Slack quick-action（07:10-07:20、10min）

| 項目 | 内容 |
|---|---|
| **Pre-condition** | (a) S-7 PASS、(b) `recorder-s8` 生成、(c) Slack workspace `#drill-exec` 利用可確認 |
| **Trigger** | (a) `monitor.declareLegitSpikeWindow(300000, 2)` で 5min spike window 宣言、(b) Slack quick-action button mock post（Owner ack request 投稿）、(c) 30min SLA 計測開始、(d) Owner 模擬応答（30s 内に R-5 が ack click mock） |
| **Expected** | (a) Owner 模擬応答 timestamp 記録、(b) `manualOverrideAcknowledged: true` set、(c) 30min SLA 内応答（30s で達成）、(d) audit log full trace 記録 |
| **Pass criteria** | O-9: Slack quick-action button 受理 + Owner 30min SLA 内応答 + audit log 記録 |
| **Rollback** | (a) `monitor.disableLegitSpikeWindow()`、(b) Slack post 削除（mock のみ、本番影響なし）、(c) `recorder-s8.entries()` 退避保管 |

### §6.3 S-9: audit log（07:20-07:30、10min）

| 項目 | 内容 |
|---|---|
| **Pre-condition** | (a) S-8 PASS、(b) `recorder-s9` 生成、(c) auditStore 初期化確認 |
| **Trigger** | (a) `await auditStore.replay()`、(b) `const valid = await auditStore.verifyHashChain()`、(c) `kill-switch.disarm()` + `costTracker.reset()` + `monitor.reset()` の 3 reset 連続実行、(d) `canResume: true` 確認 |
| **Expected** | (a) audit log `chain_valid: true`、(b) `brokenAt: null`、(c) cost-tracker `currentUsd === 0`、(d) replay 整合性 100%（SHA-256 ハッシュ一致） |
| **Pass criteria** | O-5: audit log hash chain `chain_valid: true` + 3 reset items すべて成功 + `canResume: true` |
| **Rollback** | (a) audit log read-only（rollback 不要）、(b) reset 後の状態維持（後続集計用）、(c) `recorder-s9.entries()` 退避保管 |

### §6.4 07:00-07:30 区分判定

| 判定 | 条件 |
|---|---|
| **段階 GO** | S-7 + S-8 + S-9 すべて PASS |
| **CONDITIONAL** | S-7 PASS + S-8 PARTIAL（Owner mock 応答 30s 超過）+ S-9 PASS |
| **abort** | S-7 で Sumi/Asagi quota 1+ 消費 → §8 abort criteria #3 即時 / S-9 で chain_valid: false → §8 abort criteria #2 |

---

## §7 07:30-08:00 結果集計 + audit log grep + Sumi/Asagi cross check

### §7.1 07:30-07:45 結果集計（15min）

| 時刻 | 担当 | 動作 | 完遂条件 |
|---|---|---|---|
| 07:30-07:35 | R-2 | 9 シナリオ各々の `recorder-sN.entries()` を JSON 化、`tasks/round12/drill2/fixture-drill2-sN-*.json` 保存 | 9 fixture file 存在 |
| 07:35-07:38 | R-2 | audit log grep: `grep -E "kind: '(unauthorized|cost_cap|rate_spike|continuous_run|clock_skew)_'" audit.log` で 9 シナリオ event 件数集計 | event 件数 vs 期待値 比較 |
| 07:38-07:42 | R-1 + R-2 | 12 軸 PASS criteria 集計表作成（O-1 〜 O-12） | 12 軸 PASS / PARTIAL / FAIL 判定 |
| 07:42-07:45 | R-4 | `summary-drill2-12-axes.json` 生成（12 軸 + 9 シナリオ + 議決-26 採択推奨度判定文） | JSON 妥当性 |

### §7.2 07:45 完遂宣言（1min）

| 担当 | 動作 |
|---|---|
| R-1 | Slack `#clawbridge-alerts` に「drill #2 完遂宣言、12 軸速報: {N}/12 PASS」投稿 |
| R-1 | timeline ISO8601 終了時刻記録 |

### §7.3 07:45-07:55 Sumi/Asagi cross check（10min）

| 時刻 | 担当 | 動作 | 完遂条件 |
|---|---|---|---|
| 07:45-07:50 | R-4 | Sumi (PRJ-018) 同時起動状態確認: `claude-bridge --workspace=PRJ-018 --status` | OAuth quota 消費 0、heartbeat 5min 以内 |
| 07:50-07:55 | R-4 | Asagi (PRJ-008) 同時起動状態確認: `codex --workspace=PRJ-008 --status` | OpenAI API quota 消費 0、heartbeat 5min 以内 |
| 07:55 | R-2 | cross check 結果を `summary-drill2-12-axes.json` に追記（O-10/-11/-12 確証） | JSON 更新 |

### §7.4 07:55-08:00 Owner 速報（5min）

| 担当 | 動作 | テンプレ |
|---|---|---|
| R-1 | 議決-26 採択推奨度判定文生成 | §7.5 テンプレ参照 |
| R-5 | Slack `#clawbridge-alerts` + Owner Slack DM 投稿 | post 確認 |
| R-1 | drill #2 終了宣言 + W0-Week1 検収会議 09:00 への引継宣言 | 終了時刻 ISO8601 記録 |

### §7.5 議決-26 採択推奨度判定文テンプレ

```
[drill #2 5/8 朝実機検証 result v1]

期間: 2026-05-08 06:00-08:00 (120 min)
12 軸 PASS criteria: {ACHIEVED}/12 ({STATUS})
- Critical 5 軸 (#1/#2/#3/#5/#10/#11): {PASS_COUNT}/5 PASS
- High 3 軸 (#4/#6/#7/#8/#9): {PASS_COUNT}/3 PASS  
- Medium 1 軸 (#12): {PASS_COUNT}/1 PASS

5/8 議決-26 採択推奨度判定: {RECOMMENDATION}
Owner sign-off 期待: {EXPECTATION}
artifact: tasks/round12/drill2/ 配下 9 fixture JSON + summary-drill2-12-axes.json
```

| 達成数 | 採択推奨度（{RECOMMENDATION}）| Owner sign-off 期待 |
|---|---|---|
| 12/12 Full Pass | **極めて強い推奨で無条件採択** | 即時 sign-off |
| 11/12 Partial Pass（Critical 5 軸全 PASS）| 強い推奨で Conditional 採択 | Phase 1 W4 完遂を condition |
| 10/12 Partial Pass（Critical 5 軸全 PASS）| 強い推奨で Conditional 採択 | 同上 |
| 9/12 Conditional Pass（Critical 5 軸全 PASS）| 推奨で Conditional 採択 | 5/12 復帰検討 + Conditional sign-off |
| < 9/12 Fail | 採択非推奨 | 5/12 復帰 + 議決-26 再評価 |

---

## §8 abort criteria 3 件 + 即時中断手順

### §8.1 abort criteria #1: 環境準備不通過（critical fail 即時中断条件）

| 条件 | 即時中断手順 |
|---|---|
| §3.1 環境準備 9 項目で **3 件以上不通過** OR **項目 1-4（git pull / pnpm install / harness / tos-monitor importable）のいずれか不通過** | (a) R-1 が 06:00 直前に「drill #2 中止宣言」、(b) R-5 が Slack `#clawbridge-alerts` + Owner Slack DM「drill #2 中止、5/12 復帰検討」投稿、(c) 全 recorder クリア、(d) 5/12 復帰スケジュールを W0-Week1 検収会議 09:00 で再確認 |

### §8.2 abort criteria #2: シナリオ実行中の Critical FAIL

| 条件 | 即時中断手順 |
|---|---|
| **S-1〜S-9 のいずれかで Critical 軸（O-1/-2/-3/-5/-10/-11）FAIL** OR **S-1〜S-4 で 2 件以上 Critical FAIL** | (a) R-1 が即時「drill #2 中断宣言」、(b) R-3 が現在進行中の trigger を即時停止、(c) R-2 がそれまでの recorder.entries() を退避保管、(d) R-5 が Slack + Owner DM 投稿「drill #2 中断、原因分析後 5/12 復帰判断」、(e) 完了済シナリオの結果は §7 に従い集計（Conditional Pass 判定） |

### §8.3 abort criteria #3: Sumi/Asagi 巻き添え発生（最重大）

| 条件 | 即時中断手順 |
|---|---|
| **S-7 multi-process で Sumi/Asagi quota 1+ 消費** OR **Slack 通常 ch（`#sumi-ops` / `#asagi-ops`）に Open Claw alert 1+ 件混入** | (a) R-1 が **最高 priority で「drill #2 即時中止宣言」**、(b) Sumi/Asagi 経路を即時隔離（claude-bridge config 退避）、(c) R-5 が Owner Slack DM **緊急投稿**「Sumi/Asagi 巻き添え検出、drill #2 中止 + 5/12 復帰確定 + 議決-26 5 軸『Sumi/Asagi 巻き添えゼロ確証』軸 FAIL 確定」、(d) 議決-26 採択を 5/12 まで延期（W0-Week1 検収会議で reschedule 議決） |

### §8.4 abort 後の復帰手順

| 復帰段階 | 期限 | 完遂条件 |
|---|---|---|
| 1. 原因分析 | 5/8 EOD | abort criteria 別の root cause 文書化（`review-round12-drill-2-abort-analysis.md`）|
| 2. 修正 + dry-run 再実施 | 5/10 EOD | Dev-C runner で 45/45 green 再達成 |
| 3. drill #2 5/12 復帰 | 5/12 朝 06:00-08:00 | 本ランブック v1.1 で再実施 |
| 4. 議決-26 採択 reschedule | 5/12 EOD | W0-Week1 検収会議延長会議で再採択 |

---

## §9 Dev-C `drill-2-pre-execution-dry-run.test.ts` runner 再利用 SOP

### §9.1 runner の位置付け

Dev-C Round 12 起案予定の `app/harness/src/__tests__/drill-2-pre-execution-dry-run.test.ts`（45 セル網羅、Vitest base）は、**dry-run pre-flight + 実機検証 runner の 2 用途で再利用可能**。

### §9.2 dry-run pre-flight 用途（05:55-06:00）

```bash
# dry-run mode で 45 セル網羅 dry-run（実機 Slack post / circuit-breaker 発火なし）
cd app/harness && pnpm test --run drill-2-pre-execution-dry-run --reporter=verbose -- --dry-run
```

**期待**: 45/45 green、所要 < 60s、Slack post 0 件、circuit-breaker 状態無変動。

### §9.3 実機検証 runner 用途（06:00-07:30）

```bash
# wet-run mode で 9 シナリオ × 5 要素を実機実行（Slack mock post 有り、circuit-breaker mock 発火有り）
cd app/harness && pnpm test --run drill-2-pre-execution-dry-run --reporter=verbose -- --wet-run --record-fixtures=tasks/round12/drill2/
```

**期待**: 各シナリオ完遂時に fixture JSON 自動生成、recorder.entries() 自動 dump、§7 集計の手作業を 80% 削減。

### §9.4 runner 内部の 5 要素 mapping

| ランブック §4-6 の 5 要素 | runner test() 内の section |
|---|---|
| Pre-condition | `beforeEach()` での setup |
| Trigger | `await scenario.trigger()` |
| Expected | `expect(...)` assertions |
| Pass criteria | `expect(passCriteria.O_N).toBe(true)` |
| Rollback | `afterEach()` での teardown |

### §9.5 runner 不在時の手動 fallback

Dev-C Round 12 で runner 起案が間に合わない場合、本ランブック §4-6 の 5 要素を operator が手動実行（既存の Round 11 Review-C spec と同等の手作業）。fixture JSON は R-2 が手動 dump。

---

## §10 Round 13 引継 TODO

### §10.1 Round 13 Review-D 起票候補 4 件

| # | TODO | 担当 | 期限 | 完遂条件 |
|---|---|---|---|---|
| 1 | drill #2 実機結果集計テンプレ起票（`review-round13-drill-2-result-template.md`）| Review | 5/9 EOD | 12 軸集計 + 9 fixture summary + 議決-26 採択判定文 final 化 |
| 2 | drill #2 9 fixture deterministic replay verification 起票（`review-round13-drill-2-replay-verification.md`）| Review | 5/9 EOD | `createReplayHook` で 9 fixture replay → 同 event 系列再現確認 |
| 3 | 50 ctrl の 5/15 中間チェック実施 + 起票（`review-round13-50-ctrl-5-15-mid-check.md`）| Review | 5/15 EOD | 70% → 82% 達成判定 + gap 残 controls 再評価 |
| 4 | drill #3 5/29 採択ライン readiness 起票（`review-round13-drill-3-readiness.md`）| Review | 5/20 EOD | drill #2 result 反映 + drill #3 シナリオ案 起案 |

### §10.2 Owner 観察ポイント prep（5/8 朝、4 箇所）

| 観察ポイント | 期待挙動 | Owner 判断補助 |
|---|---|---|
| 1. 環境準備 9 項目 GO | 9/9 PASS、Dev-C runner 45/45 green | 9/9 達成で ◎ |
| 2. S-2 emergency_stop 物理動作 | 5,000 ms 以内 kill 完了 + circuit-breaker 5/5 open | 5,000 ms 以内なら ◎ |
| 3. high 4 セル抑止動作（S-3/-4/-5/-6）| 4/4 セル PASS（false-positive < 1%）| 4/4 PASS なら ◎ |
| 4. Sumi/Asagi 巻き添えゼロ（S-7 + cross check）| OAuth/OpenAI quota 0 消費 + Slack 混入 0 件 | 3/3 確証なら ◎ |

### §10.3 確度押上推定

| 観点 | Round 11 完遂時 | Round 12 完遂時（本書）| drill #2 5/8 朝 Pass 後 |
|---|---|---|---|
| drill #2 Pass 確度 | 96% | **98%**（runbook 確定 + Dev-C runner 再利用 +2pt）| **Full Pass = 100%** |
| Phase 1 着手 5/26 Conditional Go 確度 | 93% | 93% | **95%** |
| 議決-26 採択推奨度 | 強い推奨 | 強い推奨 | **極めて強い推奨** |
| 5/22 朝公開前倒し（DEC-019-056）確度 | 84% | **86%** | **88%** |

---

## §11 結論 + Review 部門 sign-off

### §11.1 結論

BAN drill #2 5/8 朝 06:00-08:00 実機検証用の **operator 即時実行可能ランブック確定版** を起案。Round 11 Review-C の 9 シナリオ 5 要素仕様を **分単位 timeline（130 分）+ Pre-condition / Trigger / Expected / Pass criteria / Rollback の 5 項目化** で再構成、abort criteria 3 件明示（環境準備不通過 / Critical FAIL / Sumi/Asagi 巻き添え）、Dev-C Round 12 の `drill-2-pre-execution-dry-run.test.ts` を dry-run pre-flight + 実機検証 runner の 2 用途で再利用可能化。**5/8 朝実機準備度 = GO**（環境準備 9/9 + 9 シナリオ仕様完成 + abort 手順確立 + Dev-C runner 計画整合）。Owner observation point 4 箇所（環境準備 / S-2 物理 kill / high 4 セル抑止 / Sumi/Asagi cross check）すべて Round 11 完遂で達成見込み 92-98%、drill #2 Full Pass 後に「**極めて強い推奨で無条件採択**」建議可能。read-only 厳守、コード一切無改変。

### §11.2 Review 部門 sign-off

| 観点 | sign-off |
|---|---|
| 当日 operator 5 役割 + 集合手順 | sign-off |
| 分単位 timeline 確定版（130 分）| sign-off |
| 環境準備 9 項目チェックリスト | sign-off |
| 9 シナリオ × 5 要素実行仕様（45 セル）| sign-off |
| abort criteria 3 件 + 即時中断手順 | sign-off |
| Dev-C runner 再利用 SOP | sign-off |
| 議決-26 採択推奨度判定文テンプレ | sign-off |
| Round 13 引継 TODO 4 件 | sign-off |

### §11.3 関連 DEC / リスク参照

- **DEC-019-019**: drill #1 シナリオ承認 — 本書 9 シナリオの S-2/-3/-4 起源
- **DEC-019-052**: 案 C ハイブリッド暫定運用 — drill #2 で subscription + API fallback 両モード検証根拠
- **DEC-019-055**: Round 8 完遂 — 本前倒しの起点
- **DEC-019-056**: Round 9/10 前倒し — drill #2 instrumentation 4 export 着地の起源
- **R-019-06**: BAN 30-60% / 12 ヶ月 — drill #2 Full Pass で mitigation +10%
- **R-019-08**: 兄弟案件リソース食合い — drill #2 S-7 + cross check Sumi/Asagi 巻き添えゼロ確証で +5%
- **R-019-09**: NG-3 24/7 監視 — high 4 セル（S-3/-4/-5/-6）抑止動作確認で +5%

### §11.4 次回更新

- 5/7 18:00（Round 13 立会者最終確定 + Owner RSVP 確認）
- 5/8 08:00（drill #2 5/8 朝 実施結果反映 → Round 13 引継 TODO #1 起票 = `review-round13-drill-2-result-template.md`）
- 5/8 EOD（9 fixture deterministic replay 確認 → Round 13 引継 TODO #2 起票）

---

**v1.0 確定**: 2026-05-04 W0-Week1 深夜 Review 部門 R12 Review-D / 案 C ハイブリッド暫定運用前提 / Owner formal「最速で進めよ」directive 継続中
**正式採択**: 2026-05-08 W0-Week1 検収会議（議決-26 連動採択、Owner sign-off 予定）
**v1.0 確定差分**: 当日 operator 5 役割 + 分単位 timeline + 環境準備 9 項目 + 9 シナリオ 5 要素（45 セル）+ abort criteria 3 件 + Dev-C runner 再利用 SOP + Round 13 引継 4 件
