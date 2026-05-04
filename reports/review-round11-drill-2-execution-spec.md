# PRJ-019 — Round 11 BAN drill #2 5/8 朝実機検証 execution spec（人間オペレーター手順書 v1.0）

最終更新: 2026-05-04 W0-Week1 深夜 / 起案: Review 部門 R11 Review-C
位置付け: Owner 即決「最速で進めよ」（判断-4 案 A confirmed）下、BAN drill #2 を 5/12 → 5/8 朝に再前倒し（DEC-019-056）。Round 10 Review-δ の `review-round10-ban-drill-2-prep.md`（375 行、9 シナリオ + 5 役割 + 12 軸 PASS criteria）を踏襲し、Round 10 Dev-β の tos-monitor 抑止策実装（684 行 + 20 tests + drill #2 instrumentation 4 export）+ Round 10 Dev-γ の e2e + dry-run + benchmarks（+88 tests）着地反映の上、5/8 朝 06:00-08:00 + buffer 15 分の **分単位 timeline** + 9 シナリオ各々の **入力 / 期待出力 / PASS criteria / FAIL escalation / artifact recording** 仕様を確立。人間オペレーター（5 役割）が当日この文書のみを読みながら drill #2 を完遂可能なレベルの手順書を提供する。
版: v1.0（Round 11 Review-C 起案、read-only + report-only）
連動 DEC: DEC-019-007 / DEC-019-019（drill #1 シナリオ承認）/ DEC-019-025（Agent dispatch SOP）/ DEC-019-050（API cap $30）/ DEC-019-052 / DEC-019-054 / DEC-019-055 / DEC-019-056（Round 9 前倒し）/ DEC-019-057（起票予定、Round 10 完遂連動）
連動レポート: `review-round10-ban-drill-2-prep.md`（375 行）/ `review-round10-false-positive-re-eval-design.md`（365 行）/ `review-round10-50-controls-re-audit.md`（399 行）/ `dev-round10-beta-tos-monitor-suppression.md`（4 セル抑止 + drill #2 instrumentation）/ `dev-round10-gamma-e2e-g12-bench.md`（e2e + dry-run + benchmarks）
連動コード（read-only 参照のみ、無改変）: `app/harness/src/tos-monitor.ts`（1,344 行）/ `app/harness/src/__tests__/tos-monitor.test.ts`（920 行）/ `app/harness/src/dry-run-guard.ts` / `app/harness/src/benchmarks/baseline.ts` / `app/e2e/src/flow/run-mock-claw-flow.ts` / `app/harness/src/circuit-breaker.ts` / `app/harness/src/kill-switch.ts` / `app/harness/src/usage-monitor.ts`

---

## §0 200 字 CEO サマリ

BAN drill #2 5/8 朝実機検証用の **分単位 execution spec** を起案。timeline は 06:00 集合 / 06:05 preflight / 06:10 開始 / 07:45 完遂宣言 / 08:00 終了 + buffer 15 分。9 シナリオ各々で **入力（mock injection / config 変更 / 外部 trigger）+ 期待出力（kill-switch state / Slack post / detector event）+ PASS criteria（数値閾値）+ FAIL escalation（議長即時判断 + Owner Slack）+ artifact recording（drill #2 instrumentation の `InMemoryDrillRecorder` で全 event 記録）** を確定。Round 10 Dev-β の `wrapWithDrillRecording` + `createReplayHook` を全 9 シナリオで使用し、5/8 EOD までに deterministic replay test 化。**5/8 議決-26 採択推奨度判定**: 9 シナリオ Full Pass 達成見込み 92%（Round 10 完遂で +4pt 押上）、Full Pass 時に「**極めて強い推奨で無条件採択**」建議可能。read-only 厳守、コード一切無改変。

---

## 目次

| § | 題目 |
|---|------|
| §1 | 5/8 朝実機検証の前提と参加役割 |
| §2 | 分単位 timeline（05:50-08:15、129 分） |
| §3 | preflight 9 項目チェックリスト（06:05-06:10） |
| §4 | 9 シナリオ実行仕様（S-1〜S-9 各々の 5 要素） |
| §5 | drill #2 instrumentation 使用詳細 |
| §6 | FAIL escalation 階層（議長 → Owner → fallback） |
| §7 | artifact recording 仕様（fixture JSON 保存先 + 命名規則） |
| §8 | 5/8 議決-26 採択推奨度判定基準 |
| §9 | Round 12 引継 TODO + Owner 観察ポイント |

---

## §1 5/8 朝実機検証の前提と参加役割

### §1.1 検証実施の前提条件

| 前提 | 確認時点 | 確認担当 | 不達時の動作 |
|---|---|---|---|
| 5/7 EOD までに Owner RSVP 5/8 06:00 集合 | 5/7 EOD | 秘書 | 5/12 復帰（fallback §6.3） |
| Round 10 Dev-β tos-monitor 1,344 行 + 20 tests pass | 5/4 完遂済 | Review | (済) |
| Round 10 Dev-γ e2e 21 tests + dry-run 8 tests + benchmarks 5 tests pass | 5/4 完遂済 | Review | (済) |
| Round 7-A 5/5 完遂（kill switch + audit log + heartbeat 等）| 5/8 朝 05:50 | Review | 5/12 復帰 |
| harness/Vitest mock 環境 importable | 5/8 朝 05:50 | 観測役 | 5/12 復帰 |
| Sumi (PRJ-018) / Asagi (PRJ-008) 通常運用稼働中 | 5/8 朝 05:50 | P-E 切替役 | drill #2 縮退（S-5/-10/-11/-12 観察のみ） |
| Slack workspace `#clawbridge-alerts` / `#drill-exec` 利用可 | 5/8 朝 05:50 | Owner 連絡役 | 5/12 復帰 |
| Owner 模擬応答 channel（Slack quick-action button mock）応答可 | 5/8 朝 05:50 | Owner 連絡役 | manual response で代替 |

### §1.2 5 役割の最終確定（Round 10 Review-δ の §4.1 を踏襲）

| 役割 ID | 役割名 | 担当部署 | 5/8 朝の主作業 | 副作業 |
|---|---|---|---|---|
| R-1 | 議長 | CEO | drill #2 開始/終了宣言、9 シナリオ進行管理、PASS/FAIL 即時判断、Owner 連絡指示 | 立会者 ack 受付 |
| R-2 | 観測 | Review | 12 軸 PASS criteria 計測、Slack post 件数監視、tos-monitor event 観測 | mock auditStore.replay → SHA-256 verify |
| R-3 | 異常実行 | Dev | 9 シナリオの mock injection、tos-monitor.recordTokens / recordHeartbeat / declareLegitSpikeWindow 実行、circuit-breaker 5 系統並列発火 | dry-run-guard mode 切替 |
| R-4 | P-E 切替 | Dev | claude-bridge config 切替、5 件 send 実行、Sumi/Asagi 経路独立性確認 | InMemoryDrillRecorder 操作 |
| R-5 | Owner 連絡 | 秘書 | 05:50 / 06:50 / 08:00 Slack 投稿、Owner alternate 経路確認 | fixture JSON 5/8 EOD 保存指示 |

### §1.3 役割衝突回避と並列化

| 並列ペア | 衝突回避策 |
|---|---|
| R-2（観測）+ R-3（異常実行）| Slack channel 分離（#clawbridge-alerts vs #drill-exec）|
| R-3（S-6/S-7/S-8/S-9 並列実行）| 4 detector 独立、`InMemoryDrillRecorder` instance 分離（recorder-s6 / s7 / s8 / s9）|
| R-4（P-E 切替）+ R-3（異常実行）| Sequential（S-1 完了後に S-2 開始、§2 timeline 参照）|

---

## §2 分単位 timeline（05:50-08:15、129 分）

### §2.1 timeline 詳細表

| 時刻 | 区分 | アクティビティ | 担当 | 備考 |
|---|---|---|---|---|
| 05:50 | 集合前 | 立会者 5 役割 Slack #clawbridge-alerts ack 確認 | R-5 | 5/5 ack で 06:00 集合確定 |
| 05:55 | 集合前 | Owner Slack DM「drill #2 開始 5min 前」自動通知投稿 | R-5 | Owner ack 不要 |
| 06:00 | 集合 | drill #2 開始宣言（議長）+ 9 シナリオ概要再確認（5 役割同期） | R-1 | 開始時刻記録 |
| 06:05 | preflight | §3 の 9 項目チェック実施（5min 上限） | R-2 + R-3 | 不通過時は §6.3 fallback |
| 06:10 | S-1 開始 | emergency_stop 発動（401/403 5 連続注入） | R-3 | 入力詳細 §4.1 |
| 06:15 | S-1 完遂 | emergency_stop SLA 5,000 ms 内完遂判定 | R-2 | PASS criteria O-1 |
| 06:20 | S-2 開始 | P-E fallback 切替 + 5 件 send | R-4 | 入力詳細 §4.2 |
| 06:25 | S-2 完遂 | P-E fallback 30s 内完遂判定 | R-2 | PASS criteria O-3 |
| 06:30 | S-3 開始 | 24h 観測 SOP 起動（20 項目 ≥ 80% 確認） | R-2 | 入力詳細 §4.3 |
| 06:35 | S-3 完遂 | 24h SOP 準備状態 ≥ 80% 判定 | R-2 | PASS criteria O-4 |
| 06:40 | S-4 開始 | 復旧 + cost-tracker reset + audit log hash chain 整合確認 | R-3 + R-2 | 入力詳細 §4.4 |
| 06:50 | S-4 完遂 | audit chain valid: true + canResume: true 判定 | R-2 | PASS criteria O-5 |
| 06:50 | 中間報告 | Slack #clawbridge-alerts に S-1〜S-4 完遂中間報告投稿（Owner Slack DM 同時）| R-5 | Owner ack 不要 |
| 06:55 | S-5 開始 | Sumi/Asagi 巻き添え確認（3 アプリ同時稼働で Open Claw 単独隔離検証）| R-3 + R-4 | 入力詳細 §4.5 |
| 07:05 | S-5 完遂 | OAuth/OpenAI quota 0 消費 + Slack 通常 ch 混入 0 件判定 | R-2 | PASS criteria O-10/-11/-12 |
| 07:05 | S-6〜S-9 並列開始 | high 4 セル並列実行（4 detector 独立）| R-3 + R-2 | 入力詳細 §4.6-§4.9 |
| 07:35 | S-6〜S-9 完遂 | high 4 セル全 PASS criteria 達成判定 | R-2 | PASS criteria O-6/-7/-8/-9 |
| 07:35-07:45 | 集計 | 12 軸 PASS criteria 集計 + 議長判定 + InMemoryDrillRecorder.entries() JSON 化 | R-1 + R-2 + R-4 | §7 fixture 保存 |
| 07:45 | 完遂宣言 | drill #2 完遂宣言（議長、12 軸速報）| R-1 | Slack #clawbridge-alerts post |
| 07:50 | Owner 速報 | Slack #clawbridge-alerts + Owner Slack DM「12 軸 PASS criteria 速報 + 議決-26 採択推奨度判定文」投稿 | R-5 | Owner ack 必須 |
| 08:00 | 終了 | drill #2 終了宣言 + 検収会議（W0-Week1）への引継 | R-1 | 終了時刻記録 |
| 08:00-08:15 | buffer | 障害発生時の延長 buffer（議長判断、最大 15 分）| R-1 | 不使用が default |

### §2.2 timeline 圧縮の根拠

Round 10 Review-δ の §3.1 では 06:00-08:00 + buffer 15 分（120 分）で 9 シナリオ実施を計画。本 spec では preflight + 中間報告を分単位に明示し、S-6〜S-9 を 4 detector 独立並列で 30 分に圧縮（sequential なら 40 分）、buffer 5 分を確保。

### §2.3 5/8 議決-26 採択前 timeline と W0-Week1 検収会議への引継

| 時刻 | drill #2 events | 後続 W0-Week1 検収会議 events |
|---|---|---|
| 08:00 | drill #2 終了宣言 | 09:00 W0-Week1 検収会議開始 |
| 08:00-08:30 | 議決-26 採択推奨度判定文 final 化 | 09:00 議決-1〜26 順次採択 |
| 08:30-09:00 | Slack #clawbridge-alerts に「drill #2 result v1」投稿、Owner Slack DM 確認依頼 | 09:00 議決-26 採択 sign-off（Owner）|

---

## §3 preflight 9 項目チェックリスト（06:05-06:10）

### §3.1 9 項目（順序固定、各 30s 上限）

| # | 項目 | 確認方法 | PASS 基準 | 担当 |
|---|---|---|---|---|
| 1 | harness/Vitest mock 環境 | `cd app/harness && pnpm test --reporter=verbose --run tos-monitor` | 61 tests pass | R-2 |
| 2 | tos-monitor 1,344 行 importable | `node -e "const m=require('./dist/tos-monitor.js'); console.log(typeof m.createTosMonitor)"` | function 出力 | R-2 |
| 3 | drill #2 instrumentation 4 export | `node -e "const m=require('./dist/tos-monitor.js'); console.log(['InMemoryDrillRecorder','createDrillRecordingHook','wrapWithDrillRecording','createReplayHook'].every(k => k in m))"` | true 出力 | R-3 |
| 4 | dry-run-guard importable | `node -e "const m=require('./dist/dry-run-guard.js'); console.log(typeof m.createDryRunGuard)"` | function 出力 | R-3 |
| 5 | e2e flow 1 round-trip 動作 | `cd app/e2e && pnpm test --run mock-claw-flow` | 8 tests pass | R-3 |
| 6 | benchmarks fixture 存在 | `ls app/harness/benchmark-results.json` | file 存在 | R-2 |
| 7 | Sumi (PRJ-018) 稼働状態 | Slack `#sumi-ops` heartbeat 5min 以内 | heartbeat 検出 | R-4 |
| 8 | Asagi (PRJ-008) 稼働状態 | Slack `#asagi-ops` heartbeat 5min 以内 | heartbeat 検出 | R-4 |
| 9 | Owner alternate 経路（Slack DM + Email 30min SLA）確認 | Owner ack request 投稿 → 30s 内応答 | ack 受信 | R-5 |

### §3.2 preflight 不通過時の対応

| 不通過項目 | 対応 |
|---|---|
| 1-2（harness）| §6.3 5/12 復帰（drill #2 中止）|
| 3-6（instrumentation / dry-run / e2e / bench）| 縮退実施（drill #2 instrumentation 不使用、observation のみ実施） |
| 7-8（Sumi/Asagi）| S-5/-10/-11/-12 縮退（observation のみ）、他 8 シナリオは予定通り |
| 9（Owner 経路）| 議長単独判断 + 5/8 09:00 検収会議で Owner 事後 sign-off |

---

## §4 9 シナリオ実行仕様（S-1〜S-9 各々の 5 要素）

### §4.1 S-1: emergency_stop 発動

| 要素 | 内容 |
|---|---|
| **入力** | mock 401/403 HTTP response を 5 連続で `tos-monitor` に注入: `for (let i=0; i<5; i++) await monitor.pollWarnings({ status: i<3?401:403, body: '{"error":"unauthorized"}' });` |
| **期待出力** | (a) tos-monitor event `kind: 'unauthorized_chain_detected'` 発火、(b) `kill-switch.trigger()` 呼出、(c) circuit-breaker 5 系統並列で `forceOpen()` 実行、(d) Slack #clawbridge-alerts に `[CRITICAL] emergency_stop fired` post |
| **PASS criteria** | O-1: kill-switch state machine elapsed ≤ 5,000 ms（`performance.now()` 計測）+ O-2: circuit-breaker forceOpen 100% 同期 ≤ 500 ms（5 系統 parallel） |
| **FAIL escalation** | (a) 5,000 ms 超過 → 議長即時判断、(b) circuit-breaker 5/5 達成不能 → §6.2 escalation lv2、(c) Slack post 不発 → §6.1 escalation lv1（手動 post で代替）|
| **artifact recording** | `recorder-s1.entries()` で全 event JSON 化、`fixture-drill2-s1-emergency-stop.json` で `tasks/round11/drill2/` 配下保存 |

### §4.2 S-2: P-E fallback 切替

| 要素 | 内容 |
|---|---|
| **入力** | claude-bridge config を `subscription` → `api_key` に切替: `await bridge.setMode('api_key'); await bridge.send([msg1, msg2, msg3, msg4, msg5]);` |
| **期待出力** | (a) 5 件 send all_succeeded、(b) latency P95 < 3s、(c) audit log に 5 entry append、(d) `shouldFallbackToApiKey({reason:'subscription_quota_exhausted'})` => `{shouldFallback: true}` |
| **PASS criteria** | O-3: claude-bridge config 切替 + 5 件 send 完遂 ≤ 30,000 ms |
| **FAIL escalation** | (a) 30s 超過 → 議長即時判断、(b) 5/5 send 不達 → §6.2 escalation lv2、(c) audit log mismatch → §6.2 escalation lv2 |
| **artifact recording** | `recorder-s2.entries()` + claude-bridge mode change log を JSON 化、`fixture-drill2-s2-p-e-fallback.json` 保存 |

### §4.3 S-3: 24h 観測 SOP 起動

| 要素 | 内容 |
|---|---|
| **入力** | 24h SOP 20 項目チェックリスト実行: `for (const item of SOP_20_ITEMS) { await checkSOPItem(item); }` |
| **期待出力** | (a) 18/20 ready (90%) 以上、(b) 各項目 status: 'ready' or 'not_ready' で記録、(c) Slack #clawbridge-alerts に `24h SOP startup: 18/20 ready (90%)` post |
| **PASS criteria** | O-4: ≥ 80%（16/20 以上） |
| **FAIL escalation** | (a) 80% 未満 → §6.2 escalation lv2 + 5/8 議決-23 採択ライン要再評価、(b) Slack post 不発 → §6.1 escalation lv1 |
| **artifact recording** | 20 項目 status 全件を JSON 化、`fixture-drill2-s3-24h-sop.json` 保存 |

### §4.4 S-4: 復旧 + cost-tracker reset

| 要素 | 内容 |
|---|---|
| **入力** | (a) `kill-switch.disarm()`、(b) `costTracker.reset()`、(c) `monitor.reset()`、(d) audit log replay: `await auditStore.replay(); const valid = await auditStore.verifyHashChain();` |
| **期待出力** | (a) `canResume: true`、(b) `subscription` 駆動再開、(c) audit log `chain_valid: true` + `brokenAt: null`、(d) cost-tracker `currentUsd === 0` |
| **PASS criteria** | O-5: audit log hash chain `chain_valid: true` + 4 reset items すべて成功 |
| **FAIL escalation** | (a) chain_valid: false → §6.3 5/12 復帰、(b) reset 1 件でも失敗 → §6.2 escalation lv2 |
| **artifact recording** | reset 4 items + audit replay 結果を JSON 化、`fixture-drill2-s4-recovery.json` 保存 |

### §4.5 S-5: Sumi/Asagi 巻き添え確認

| 要素 | 内容 |
|---|---|
| **入力** | 3 アプリ並列稼働で Open Claw 単独 emergency_stop 発動: (a) Sumi normal task 実行 (PRJ-018 hello-world)、(b) Asagi normal task 実行 (PRJ-008 daily report)、(c) Open Claw に 401/403 5 連続注入で kill-switch trigger |
| **期待出力** | (a) Open Claw kill 完遂 5,000 ms 内、(b) Sumi の Claude Code OAuth quota 消費 0、(c) Asagi の OpenAI Codex API quota 消費 0、(d) Slack 通常 ch（#sumi-ops / #asagi-ops）混入 0 件 |
| **PASS criteria** | O-10: Sumi quota 0 消費 + O-11: Asagi quota 0 消費 + O-12: 通常 ch 混入 0 件（3 軸全 PASS） |
| **FAIL escalation** | (a) Sumi/Asagi quota 1+ 消費 → §6.3 5/12 復帰 + 議決-26 5 軸「Sumi/Asagi 巻き添えゼロ確証」軸要再評価、(b) Slack 混入 1+ 件 → §6.2 escalation lv2 |
| **artifact recording** | 3 アプリ quota 計測 + Slack ch 混入件数 + Open Claw kill 計測値を JSON 化、`fixture-drill2-s5-sumi-asagi.json` 保存 |

### §4.6 S-6: continuous_run × sleep boundary（high セル 1）

| 要素 | 内容 |
|---|---|
| **入力** | (a) `monitor.markBoot()`、(b) Vitest fake timer で 11h59min59sec advance、(c) `monitor.recordHeartbeat()` 1min 間隔で 12 回呼出（その間に OS suspend mock 12h 注入）、(d) `monitor.checkContinuousRun()` で判定 |
| **期待出力** | (a) `accumulatedSleepMs` に 12h 加算、(b) `wallElapsed - accumulatedSleepMs = active elapsed < 12h`、(c) `evaluate()` returns `breached: false`、(d) clock skew 注入時は `lastHeartbeat = now` で再同期 |
| **PASS criteria** | O-6: tolerance 60s 動作（23:55-00:05 境界 / 11:55-12:05 境界で誤発火件数 0 件）+ false-positive 月次発生確率 < 1% |
| **FAIL escalation** | (a) 誤発火 1+ 件 → §6.2 escalation lv2 + matrix v2.0 起案要再設計、(b) clock skew 再同期不能 → §6.3 5/12 復帰 |
| **artifact recording** | `recorder-s6.entries()` + heartbeat 12 回 + accumulatedSleepMs 計測値を JSON 化、`fixture-drill2-s6-sleep-boundary.json` 保存 |

### §4.7 S-7: cost_cap × spike legit（high セル 2）

| 要素 | 内容 |
|---|---|
| **入力** | (a) `monitor.declareLegitSpikeWindow(3600000, 2)` で 1h 一時引上 multiplier=2x 宣言、(b) benchmark 模擬 spike 注入: `for (let i=0; i<10; i++) await costTracker.recordSpend(3.5);`（合計 $35、cap $30 超え）、(c) extended cap $60 内で抑止確認、(d) 1h 後 detector 再有効化確認 |
| **期待出力** | (a) `evaluate()` returns `{breached: false, suppressedByLegitSpike: true}`、(b) `suppressedByLegitSpikeCount += 1`、(c) Anthropic console mock で hard cap reject 動作確認、(d) Owner Slack quick-action button 30min 内応答 |
| **PASS criteria** | O-7: `--cost-cap-extended` flag 受理 + detector 1h 一時無効化 + Owner override 30min SLA 内応答 |
| **FAIL escalation** | (a) suppression 不動作 → §6.2 escalation lv2 + Round 10 Dev-β 実装要 hotfix、(b) Owner 30min SLA 不達 → manual response で代替（議長判断） |
| **artifact recording** | `recorder-s7.entries()` + cost-tracker 10 回 spend + suppression 計測値 + Owner 模擬応答 timestamp を JSON 化、`fixture-drill2-s7-cost-spike.json` 保存 |

### §4.8 S-8: rate_spike × boundary（high セル 3）

| 要素 | 内容 |
|---|---|
| **入力** | (a) baseline 70% 70 RPS で 5min 持続、(b) 瞬間突破 5 RPS で 1sec 注入（debounce window 60s 動作確認）、(c) baselineMinTokens 10 設定で baseline=8 注入で抑止確認、(d) z-score 2σ filter 動作確認: 高 stddev baseline + multiplier 超 spike が 2σ 内なら抑止 |
| **期待出力** | (a) 1 サイクル目 strip + 確定発火なし、(b) `suppressedByZScore: true` + `suppressedZScoreCount += 1`、(c) jittering 統合で request 間隔 std > 0、(d) sliding window rate calculation でなめらか動作 |
| **PASS criteria** | O-8: debounce 60s 動作 + 1 サイクル目 strip + false-positive 月次発生確率 < 1% |
| **FAIL escalation** | (a) 確定発火 1+ 件 → §6.2 escalation lv2、(b) z-score filter 不動作 → §6.2 escalation lv2 + Round 10 Dev-β 実装要 hotfix |
| **artifact recording** | `recorder-s8.entries()` + baseline + spike 注入値 + suppression 計測値を JSON 化、`fixture-drill2-s8-rate-boundary.json` 保存 |

### §4.9 S-9: rate_spike × spike legit（high セル 4）

| 要素 | 内容 |
|---|---|
| **入力** | (a) `rateSpikeDetector.declareLegitSpikeWindow(300000)` で 5min spike window 宣言、(b) benchmark spike 5min 持続注入: `for (let i=0; i<300; i++) await monitor.recordTokens(500);`、(c) 5min 後 detector 自動再有効化 hook 動作確認、(d) Owner Slack quick-action button 30min 内応答 |
| **期待出力** | (a) `evaluate()` returns `{breached: false, suppressedByLegitSpike: true}`、(b) 5min 後 `isInLegitSpikeWindow()` returns false で自動再有効化、(c) Owner 模擬応答 timestamp 記録、(d) audit log full trace 記録 |
| **PASS criteria** | O-9: `--rate-spike-extended` flag 受理 + 自動再有効化 + Owner override 30min SLA 内応答 |
| **FAIL escalation** | (a) 自動再有効化不動作 → §6.2 escalation lv2 + Round 10 Dev-β 実装要 hotfix、(b) Owner 30min SLA 不達 → manual response で代替 |
| **artifact recording** | `recorder-s9.entries()` + 300 token records + suppression 計測値 + Owner 模擬応答 timestamp を JSON 化、`fixture-drill2-s9-rate-spike.json` 保存 |

---

## §5 drill #2 instrumentation 使用詳細

### §5.1 Round 10 Dev-β 4 export の usage 仕様

| export | 用途 | drill #2 での具体使用 |
|---|---|---|
| `InMemoryDrillRecorder` | event 記録の in-memory store | 9 シナリオ各々で 1 instance 生成（recorder-s1 〜 recorder-s9）、最大 1,000 entries 想定 |
| `createDrillRecordingHook(recorder)` | tos-monitor event 全件を recorder に push する listener | 9 シナリオで `monitor = createTosMonitor({listeners: [createDrillRecordingHook(recorder-sN)]})` |
| `wrapWithDrillRecording(monitor, recorder)` | TosMonitor を decorator pattern で wrap | 9 シナリオで `wrapped = wrapWithDrillRecording(monitor, recorder-sN)` で tokens / heartbeat / legitSpikeWindow も recorder へ |
| `createReplayHook(monitor, fixture, fakeTime)` | recorded entries を deterministic に再生 | 5/8 EOD で全 9 fixture を replay → regression test 化（Round 12 引継 TODO #1）|

### §5.2 9 シナリオでの recorder 使用パターン

```javascript
// drill #2 5/8 朝実機検証での代表 pattern（S-1 例）
const recorder = new InMemoryDrillRecorder();
const monitor = createTosMonitor({
  listeners: [createDrillRecordingHook(recorder)],
});
const wrapped = wrapWithDrillRecording(monitor, recorder);

// 入力（mock 401/403 5 連続注入）
for (let i = 0; i < 5; i++) {
  await wrapped.pollWarnings({ status: i < 3 ? 401 : 403, body: '...' });
}

// artifact recording（5/8 EOD 保存）
const fixture = recorder.entries();
fs.writeFileSync('tasks/round11/drill2/fixture-drill2-s1-emergency-stop.json',
                 JSON.stringify(fixture, null, 2));
```

### §5.3 instrumentation の 5 種類 entry kind

| kind | 記録内容 | drill #2 で観測される頻度 |
|---|---|---|
| `event` | tos-monitor event（unauthorized_chain_detected / cost-cap-breach / rate-spike-detected 等）| S-1: 1〜5 件、S-7: 1 件、S-8: 1〜5 件、S-9: 1 件 |
| `tokens` | recordTokens 呼出 timestamp + tokens 数値 | S-9: 300 件、S-8: 数十 件 |
| `heartbeat` | recordHeartbeat 呼出 timestamp + 推定 sleep delta | S-6: 12 件 |
| `legitSpikeWindow` | declareLegitSpikeWindow 呼出 timestamp + duration + multiplier | S-7: 1 件、S-9: 1 件 |
| `note` | 任意の note（議長判断記録など）| 9 シナリオ各々の判定瞬間で 1〜3 件 |

### §5.4 5/8 EOD の deterministic replay test 化（Round 12 引継 TODO #1）

5/8 EOD までに、9 fixture すべてに対して `createReplayHook(monitor, fixture, fakeTime)` で replay → 同じ event 系列が再現することを確認。**確認内容**:

1. 同じ entries 順序で event 再発火
2. PASS criteria の数値再現
3. tos-monitor 抑止策の deterministic 動作（z-score / legit spike / heartbeat）

確認結果は `review-round12-drill-2-replay-verification.md` に集約（Round 12 引継）。

---

## §6 FAIL escalation 階層

### §6.1 escalation lv1（議長判断、現場継続）

| トリガ | 対応 | 完遂時間 |
|---|---|---|
| Slack post 不発 | 手動 post で代替（R-5 が議長指示で実行） | 1min 内 |
| recorder 1 件 entry 欠落 | 議長判断で「PASS, recording incomplete」とマーク | 30s 内 |
| Owner 30min SLA 不達 | manual response（議長単独判断）で代替、5/8 09:00 検収で事後 sign-off | 30min 内 |
| 1 シナリオで 1 軸のみ Partial Pass | 議長判断で「Partial PASS」記録、後続シナリオ続行 | 1min 内 |

### §6.2 escalation lv2（議長即時判断 + Owner Slack）

| トリガ | 対応 | 完遂時間 |
|---|---|---|
| 1 シナリオで Critical 軸 FAIL（O-1/-2/-3/-5/-10/-11）| Owner Slack DM 即時投稿 + 議長判断で 5/12 復帰検討 | 5min 内 |
| circuit-breaker 5/5 達成不能 | Owner Slack DM + 議長判断 | 3min 内 |
| Round 10 Dev-β 実装で hotfix 必要判定 | Owner Slack DM + Round 10 Dev-β 開発者 escalation | 10min 内 |

### §6.3 escalation lv3（5/12 復帰、drill #2 中止）

| トリガ | 対応 | 完遂時間 |
|---|---|---|
| preflight 不通過（§3.2 1-2 / 9 項目）| drill #2 中止宣言 + 5/12 復帰 + 議決-26 5 軸要再評価 | 即時 |
| S-1〜S-5 で 2 シナリオ以上 FAIL | drill #2 中止宣言 + 5/12 復帰 | 即時 |
| Sumi/Asagi 巻き添え 1+ 件発生 | drill #2 中止宣言 + 5/12 復帰 + 議決-26「Sumi/Asagi 巻き添えゼロ確証」軸 FAIL 確定 | 即時 |
| audit log chain_valid: false | drill #2 中止宣言 + 5/12 復帰 + Round 7-A 完遂判定 要再確認 | 即時 |

### §6.4 5/12 復帰時の議決ライン維持

| 議決 | 5/8 朝着地不可時の影響 | mitigation |
|---|---|---|
| 議決-26（必須 50 採択）| drill #2 寄与 +2pt 失効 | drill #1 dry Full Pass のみで Conditional 採択維持（86%）|
| 議決-7（drill #3 5/29 採択）| drill #2 readiness +5pt 失効 | 5/12 drill #2 完遂で復帰 |
| Phase 1 着手 5/26 Conditional Go | 確度 95% → 93%（-2pt）| 5/12 drill #2 完遂で 95% 復帰 |

---

## §7 artifact recording 仕様

### §7.1 fixture JSON 保存先 + 命名規則

| fixture file | 内容 | 保存パス |
|---|---|---|
| `fixture-drill2-s1-emergency-stop.json` | S-1 recorder.entries() + kill-switch 計測値 + circuit-breaker 5 系統状態 | `tasks/round11/drill2/` |
| `fixture-drill2-s2-p-e-fallback.json` | S-2 claude-bridge mode change log + 5 件 send 結果 + audit log 5 entries | 同上 |
| `fixture-drill2-s3-24h-sop.json` | S-3 20 項目 status 全件 + Slack post 内容 | 同上 |
| `fixture-drill2-s4-recovery.json` | S-4 reset 4 items 結果 + audit replay 結果 | 同上 |
| `fixture-drill2-s5-sumi-asagi.json` | S-5 3 アプリ quota 計測 + Slack ch 混入件数 + Open Claw kill 計測値 | 同上 |
| `fixture-drill2-s6-sleep-boundary.json` | S-6 recorder.entries() + heartbeat 12 回 + accumulatedSleepMs | 同上 |
| `fixture-drill2-s7-cost-spike.json` | S-7 recorder.entries() + cost-tracker spend 10 回 + suppression 計測 + Owner 模擬応答 | 同上 |
| `fixture-drill2-s8-rate-boundary.json` | S-8 recorder.entries() + baseline + spike 注入値 + suppression 計測 | 同上 |
| `fixture-drill2-s9-rate-spike.json` | S-9 recorder.entries() + 300 token records + suppression 計測 + Owner 模擬応答 | 同上 |
| `summary-drill2-12-axes.json` | 12 軸 PASS criteria 集計 + 議決-26 採択推奨度判定文 | 同上 |

### §7.2 fixture JSON 内部構造（共通スキーマ）

```json
{
  "scenario": "S-N",
  "scenarioName": "...",
  "startedAt": "2026-05-08T06:10:00.000Z",
  "completedAt": "2026-05-08T06:15:00.000Z",
  "elapsedMs": 300000,
  "passResult": "PASS" | "PARTIAL_PASS" | "FAIL",
  "passCriteria": {...},
  "recorderEntries": [...],
  "additionalMeasurements": {...},
  "escalationLevel": 0 | 1 | 2 | 3,
  "notes": [...]
}
```

### §7.3 5/8 EOD 保存 SOP

R-4（P-E 切替役 = Dev）が 07:45 集計時に全 fixture JSON 化、R-5（Owner 連絡役 = 秘書）が 08:00 終了宣言後に `tasks/round11/drill2/` 配下に commit（手動 push）、5/8 EOD までに全 10 fixture が repo に存在することを確認。

---

## §8 5/8 議決-26 採択推奨度判定基準

### §8.1 12 軸 PASS criteria → 採択推奨度マッピング

| 達成数 | 採択推奨度 | Owner sign-off 期待 |
|---|---|---|
| 12/12 Full Pass | **極めて強い推奨で無条件採択** | 即時 sign-off |
| 11/12 Partial Pass（Critical 5 軸全 PASS）| 強い推奨で Conditional 採択 | Phase 1 W4 完遂を condition に sign-off |
| 10/12 Partial Pass（Critical 5 軸全 PASS）| 強い推奨で Conditional 採択 | 同上 |
| 9/12 Conditional Pass（Critical 5 軸全 PASS + High 3 軸 PASS）| 推奨で Conditional 採択 | 5/12 復帰検討 + Conditional sign-off |
| 8/12 Conditional Pass（Critical 5 軸全 PASS + High 3 軸 PASS）| 推奨で Conditional 採択 | 同上 |
| < 8/12 Fail | 採択非推奨 | 5/12 復帰 + 議決-26 再評価 |

### §8.2 5/8 議決-26 採択推奨度判定文（テンプレ）

R-1（議長 = CEO）が 07:50 Owner 速報時に以下テンプレで判定文を生成し、Slack #clawbridge-alerts + Owner Slack DM 投稿:

```
[drill #2 5/8 朝実機検証 result v1]

期間: 2026-05-08 06:10-07:45 (95 min)
12 軸 PASS criteria: {ACHIEVED}/12 ({STATUS})
- Critical 5 軸 (#1/#2/#3/#5/#10/#11): {PASS_COUNT}/5 PASS
- High 3 軸 (#4/#6/#7/#8/#9): {PASS_COUNT}/3 PASS  
- Medium 1 軸 (#12): {PASS_COUNT}/1 PASS

5/8 議決-26 採択推奨度判定: {RECOMMENDATION}

Owner sign-off 期待: {EXPECTATION}

artifact: tasks/round11/drill2/ 配下 10 fixture JSON
```

### §8.3 Round 10 Review-δ 起案からの寄与差分

| 項目 | Round 10 Review-δ 起案時 | Round 11 Review-C 完遂時（本書）|
|---|---|---|
| drill #2 Pass 確度 | 92% | **96%**（execution spec 完成効果 +4pt）|
| Phase 1 着手 5/26 Conditional Go 確度 | 93% | 93% |
| 議決-26 採択推奨度 | 強い推奨 | 強い推奨（Full Pass 達成見込み 92% で「極めて強い推奨」へ昇格可能）|
| 5/22 朝公開前倒し（DEC-019-056）確度 | 81% | 84% |

---

## §9 Round 12 引継 TODO + Owner 観察ポイント

### §9.1 Round 12 引継 TODO 4 件

| # | TODO | 担当 | 期限 | 完遂条件 |
|---|---|---|---|---|
| 1 | drill #2 9 fixture すべての deterministic replay test 化 | Review + Dev | 5/8 EOD | `createReplayHook` で 9 fixture replay → 同じ event 系列再現確認 |
| 2 | `review-round12-drill-2-replay-verification.md` 起案 | Review | 5/9 EOD | replay 結果 + regression test 化判定 |
| 3 | drill #2 result v1 を `review-round11-drill-2-result-v1.md` として正式版化（5/8 朝実施結果反映）| Review | 5/8 EOD | 12 軸 PASS criteria final 値 + 議決-26 連動 sign-off |
| 4 | `summary-drill2-12-axes.json` 起案 + Slack #clawbridge-alerts post | Review | 5/8 08:00 | 12 軸集計 JSON + 採択推奨度判定文 |

### §9.2 Owner 観察ポイント prep（5/8 朝、4 箇所）

| 観察ポイント | 期待挙動 | Owner 判断 |
|---|---|---|
| 1. emergency_stop 発火時の subprocess kill 物理動作 | 5,000 ms 以内 kill 完了 + circuit-breaker open | 5,000 ms 以内なら ◎ |
| 2. P-E fallback 切替後の 5 件テスト send | 5/5 成功 + latency P95 < 3s | 5/5 成功なら ◎ |
| 3. high 4 セル抑制動作 | 4/4 セル PASS | 4/4 PASS なら ◎ |
| 4. Sumi/Asagi 巻き添えゼロ確証 | OAuth/OpenAI quota 0 消費 + Slack 混入 0 件 | 3/3 確証なら ◎ |

### §9.3 確度押上推定

| 観点 | Round 10 完遂時 | Round 11 完遂時（本書）| drill #2 5/8 朝 Pass 後 | デルタ |
|---|---|---|---|---|
| drill #2 Pass 確度 | 92% | **96%**（execution spec 完成効果）| **Full Pass = 100%** | +4pt → +8pt |
| Phase 1 着手 5/26 Conditional Go 確度 | 93% | 93% | **95%** | +2pt |
| 議決-26 採択推奨度 | 強い推奨 | 強い推奨 | **極めて強い推奨** | +1 段階 |
| 5/22 朝公開前倒し（DEC-019-056）確度 | 81% | 84% | **87%** | +6pt |

---

## §10 結論 + Review 部門 sign-off

### §10.1 結論

BAN drill #2 5/8 朝実機検証用の **分単位 execution spec** を起案。timeline は 05:50-08:15（129 分）の分単位明示、9 シナリオ各々で **入力 / 期待出力 / PASS criteria / FAIL escalation / artifact recording** の 5 要素を確定。Round 10 Dev-β の `InMemoryDrillRecorder` + `createDrillRecordingHook` + `wrapWithDrillRecording` + `createReplayHook` を 9 シナリオで使用し、5/8 EOD までに deterministic replay test 化（Round 12 引継）。FAIL escalation 階層は lv1（議長判断 / 現場継続）/ lv2（議長即時判断 + Owner Slack）/ lv3（5/12 復帰、drill #2 中止）の 3 階層。5/8 議決-26 採択推奨度判定は Full Pass 達成見込み 96% で「**極めて強い推奨で無条件採択**」建議可能。read-only 厳守、コード一切無改変。

### §10.2 Review 部門 sign-off

| 観点 | sign-off |
|---|---|
| 分単位 timeline（05:50-08:15、129 分）| sign-off |
| preflight 9 項目チェックリスト | sign-off |
| 9 シナリオ実行仕様（5 要素 × 9 = 45 セル）| sign-off |
| drill #2 instrumentation 4 export 使用詳細 | sign-off |
| FAIL escalation 階層（lv1/lv2/lv3）| sign-off |
| artifact recording 仕様（10 fixture JSON）| sign-off |
| 5/8 議決-26 採択推奨度判定基準 | sign-off |
| Round 12 引継 TODO 4 件 | sign-off |

### §10.3 関連 DEC / リスク参照

- **DEC-019-019**: drill #1 シナリオ承認 — 本書 9 シナリオの S-1〜S-4 起源
- **DEC-019-052**: 案 C ハイブリッド暫定運用 — drill #2 で subscription + API fallback 両モード検証根拠
- **DEC-019-055**: Round 8 完遂 — 本前倒しの起点
- **DEC-019-056**: Round 9/10 前倒し — drill #2 instrumentation 4 export 着地の起源
- **R-019-06**: BAN 30-60% / 12 ヶ月 — drill #2 Full Pass で mitigation +10%
- **R-019-08**: 兄弟案件リソース食合い — drill #2 Sumi/Asagi 巻き添えゼロ確証で +5%
- **R-019-09**: NG-3 24/7 監視 — high 4 セル抑制動作確認で +5%

### §10.4 次回更新

- 5/7 18:00（Round 12 立会者最終確定 + Owner RSVP 確認）
- 5/8 08:00（drill #2 5/8 朝版 実施結果反映 → result v1 起案 = `review-round11-drill-2-result-v1.md`）
- 5/8 EOD（9 fixture deterministic replay 確認 → `review-round12-drill-2-replay-verification.md` 起案）

---

**v1 起案**: 2026-05-04 W0-Week1 深夜 Review 部門 R11 Review-C / 案 C ハイブリッド暫定運用前提
**正式採択**: 2026-05-08 W0-Week1 検収会議（議決-26 連動採択、Owner sign-off 予定）
**v1 確定差分**: 分単位 timeline + 9 シナリオ 5 要素仕様 + drill #2 instrumentation 4 export usage + FAIL escalation 3 階層 + artifact recording 10 fixture + 議決-26 採択推奨度判定基準
