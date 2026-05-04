# PRJ-019 — Round 14 Review-F BAN drill #2 5/7 朝実機検証ランブック確定版（5/8 朝版から 5/7 朝版へ移植 + Dev-C R14 real-mode wire-up integration）

最終更新: 2026-05-04 W0-Week1 深夜 / 起案: Review 部門 R14 Review-F
位置付け: Owner formal「採決日 5/5」+ CEO「drill #2 5/7 朝分離」directive 整合の **drill #2 5/7 朝 06:00-08:00 実機検証 operator 即時実行可能ランブック**。Round 12 Review-D の `review-round12-drill-2-runbook-final.md`（5/8 朝版 v1.0、494 行、130 分 timeline）を base に **5/7 朝版へ移植**、Dev-C R14 の drill-2 real-mode wire-up（`--mode real --date 2026-05-07`）と integration、9 シナリオ × 5 要素 = 45 セルの実機検証手順、05:50-08:00 timeline を確定。Round 13 Review-E の前倒し可否評価で GO 度 4.5/5 推奨日。
版: v1.0（Round 14 Review-F 起案、5/7 朝当日実行用、read-only + report-only）
連動 DEC: DEC-019-007 / DEC-019-019 / DEC-019-025 / DEC-019-050 / DEC-019-052 / DEC-019-054 / DEC-019-055 / DEC-019-056 / DEC-019-057
連動レポート: `review-round12-drill-2-runbook-final.md`（5/8 朝版 base）/ `review-round13-drill-2-pre-emption-evaluation.md`（5/7 朝 GO 度 4.5/5 推奨）/ `review-round13-drill-2-result-aggregation-template.md`（45 セル集計テンプレ）/ `review-round14-5-5-decision-26-pre-decision-checklist.md`（議決-26 採決サポート）/ `dev-round12-C-real-spawn-ndjson-drill2.md`（45 セル dry-run harness + real-child-spawn 290 行）
連動コード（read-only 参照のみ、無改変）: `app/openclaw-runtime/src/cli/real-child-spawn.ts`（290 行）/ `app/openclaw-runtime/src/cli/ndjson-parser.ts`（218 行）/ `app/e2e/src/__tests__/drill-2-pre-execution-dry-run.test.ts`（460 行、9×5=45 cells）/ `app/harness/src/tos-monitor.ts`（1,344 行）/ `app/harness/src/__tests__/tos-monitor.test.ts`（920 行）/ `app/harness/src/dry-run-guard.ts` / `app/e2e/src/flow/run-mock-claw-flow.ts` / `app/harness/src/circuit-breaker.ts` / `app/harness/src/kill-switch.ts`

---

## §0 200 字 CEO サマリ

drill #2 5/7 朝 06:00-08:00 実機検証 operator 即時実行可能ランブック起案。5/8 朝版から 5/7 朝版へ移植、Dev-C R14 の real-mode wire-up（`--mode real --date 2026-05-07`）統合で **createRealSpawner({killGraceMs:200})** 経由の実 child_process spawn 切替、9 シナリオ × 5 要素 = 45 セル実機検証。**5/7 朝 timeline 130 分**: 05:50-06:00 環境準備 + Cond-3 dry-run 45/45 再緑化、06:00-06:30 S-1〜S-3（baseline / kill-switch / cost cap）、06:30-07:00 S-4〜S-6（rate spike / heartbeat gap / clock skew）、07:00-07:30 S-7〜S-9（multi-process / Slack quick-action / audit log）、07:30-08:00 結果集計 + audit log grep + Sumi/Asagi cross check。**5/8 朝版との差分**: (a) 3 condition 達成前提（Cond-1 RSVP 5/5 EOD / Cond-2 Round 7-A core 3 件 commit 5/6 EOD / Cond-3 dry-run 5/6 23:30）、(b) abort criteria #1 環境準備不通過時の前倒し特則（Round 7-A 部分完遂で 70%、abort #1 = 15% vs 5/8 base 5%）、(c) Dev-C R14 real-mode wire-up integration、(d) 5/8 朝 base 復帰経路明示。Owner observation point 4 箇所そのまま継承、12 軸 PASS criteria 同一基準。read-only 厳守、コード一切無改変。

---

## 目次

| § | 題目 |
|---|------|
| §1 | 5/8 朝版から 5/7 朝版への移植差分（要約）|
| §2 | 当日 operator 5 役割 + 集合手順（05:50-06:00、5/7 朝版）|
| §3 | 分単位 timeline 確定版（05:50-08:00、130 分、5/7 朝版）|
| §4 | 05:50-06:00 環境準備（Cond-3 dry-run 45/45 再緑化 + Dev-C R14 real-mode wire-up）|
| §5 | 06:00-06:30 シナリオ S-1〜S-3（通常稼働 / kill-switch / cost cap）|
| §6 | 06:30-07:00 シナリオ S-4〜S-6（rate spike / heartbeat gap / clock skew）|
| §7 | 07:00-07:30 シナリオ S-7〜S-9（multi-process / Slack quick-action / audit log）|
| §8 | 07:30-08:00 結果集計 + audit log grep + Sumi/Asagi cross check |
| §9 | abort criteria 3 件 + 即時中断手順（5/7 朝版特則）|
| §10 | Dev-C R14 real-mode wire-up integration SOP |
| §11 | 5/8 朝 base 復帰経路 + Round 14 引継 TODO |

---

## §1 5/8 朝版から 5/7 朝版への移植差分（要約）

### §1.1 移植差分 7 件

| # | 差分項目 | 5/8 朝版（base）| 5/7 朝版（本書）|
|---|---|---|---|
| 1 | 実施日 | 2026-05-08 06:00-08:00 | **2026-05-07 06:00-08:00** |
| 2 | 3 condition 達成前提 | 不要（base）| **必須**（Cond-1 RSVP 5/5 EOD / Cond-2 Round 7-A core 3 件 commit 5/6 EOD / Cond-3 dry-run 5/6 23:30）|
| 3 | abort criteria #1 確率 | 5%（low）| **15%（中低）**（Round 7-A 部分完遂 70%、git pull conflict 10%）|
| 4 | abort criteria #2 確率 | 4%（low）| **10%（low）** |
| 5 | abort criteria #3 確率 | 4%（low）| 4%（low）（cross check 計画同等）|
| 6 | Full Pass 確度 | 96% | **92%**（base 比 -4pt）|
| 7 | Dev-C R14 real-mode wire-up | base 計画 | **`--mode real --date 2026-05-07` 起動 flag 統合**（§10 詳細）|

### §1.2 不変項目（5/8 朝版から継承）

| # | 不変項目 |
|---|---|
| 1 | 5 役割（R-1 議長 / R-2 観測 / R-3 異常実行 / R-4 P-E 切替 / R-5 Owner 連絡）|
| 2 | 130 分 timeline 構造（05:50-06:00 / 06:00-07:30 / 07:30-08:00）|
| 3 | 9 シナリオ × 5 要素 = 45 セル仕様 |
| 4 | 12 軸 PASS criteria（O-1〜O-12、Critical 5 + High 4 + Medium 1）|
| 5 | abort criteria 3 件（環境準備不通過 / Critical FAIL / Sumi/Asagi 巻き添え）|
| 6 | Pre-condition / Trigger / Expected / Pass criteria / Rollback 5 項目化 |
| 7 | 議決-26 採択推奨度判定文 4 段階（極めて強い推奨〜採択非推奨）|
| 8 | Owner observation point 4 箇所 |

---

## §2 当日 operator 5 役割 + 集合手順（05:50-06:00、5/7 朝版）

### §2.1 5 役割確定（5/8 朝版踏襲）

| 役割 ID | 役割名 | 担当部署 | 5/7 朝主作業 |
|---|---|---|---|
| R-1 | 議長 | CEO | drill #2 開始/終了宣言、9 シナリオ進行、PASS/FAIL 即時判断、Owner 連絡指示、5/8 base 復帰判断 |
| R-2 | 観測 | Review | PASS criteria 計測、Slack post 件数監視、tos-monitor event 観測、`InMemoryDrillRecorder.entries()` JSON 化 |
| R-3 | 異常実行 | Dev | 9 シナリオ mock injection、`monitor.recordTokens` / `recordHeartbeat` / `declareLegitSpikeWindow` 実行、circuit-breaker 5 系統並列発火、**Dev-C R14 real-mode wire-up 起動** |
| R-4 | P-E 切替 | Dev | claude-bridge config 切替、5 件 send 実行、Sumi/Asagi 経路独立性確認 |
| R-5 | Owner 連絡 | 秘書 | 05:50 / 06:50 / 07:50 / 08:00 Slack 投稿、Owner alternate 経路確認、fixture JSON 5/7 EOD 保存指示 |

### §2.2 集合手順 05:50-06:00（10 分、5/7 朝特則）

| 時刻 | 担当 | 動作 | 完遂条件 |
|---|---|---|---|
| 05:50 | R-5 | Slack `#clawbridge-alerts` で 5 役割 ack 確認投稿（@channel）+ **5/5 EOD Cond-1 RSVP 既取得を全員に再共有** | 5/5 ack 受信 → 06:00 集合確定 |
| 05:52 | 各役割 | 役割名 + 在席 reply（30s 上限）+ Cond-1/2/3 達成確認 | 5 件 reply + 3 condition 緑化 |
| 05:55 | R-5 | Owner Slack DM「drill #2 5/7 朝開始 5min 前」自動通知投稿 | Owner ack 不要、投稿事実のみ確認 |
| 05:57 | R-1 | 9 シナリオ概要再確認（5 役割同期、§5-7 ヘッダ通読）+ 5/8 朝版から 5/7 朝版差分（§1.1）共有 | 5 役割同意 |
| 06:00 | R-1 | drill #2 5/7 朝開始宣言 + Slack `#clawbridge-alerts` post | 開始時刻 ISO8601 記録 |

### §2.3 5/7 朝特則: 3 condition 未達時の即時 5/8 base 復帰

| 不達 condition | 対応 |
|---|---|
| Cond-1 RSVP 未達（5/5 EOD で取得不可）| 5/6 朝 06:00 までに 5/8 朝 base 復帰宣言、5/7 朝中止 |
| Cond-2 Round 7-A core 3 件未達（5/6 EOD で 0-2 件着地）| 5/6 23:00 までに 5/8 朝 base 復帰宣言 |
| Cond-3 dry-run 45/45 不達（5/6 23:30 で N/45、N < 45）| 5/6 23:45 までに 5/8 朝 base 復帰宣言 |
| 集合不達（05:55 までに ack 4/5 以下）| 5/8 朝 base 復帰 or 5/7 EOD reschedule |

---

## §3 分単位 timeline 確定版（05:50-08:00、130 分、5/7 朝版）

### §3.1 timeline 全体表

| 時刻 | 区分 | アクティビティ | 担当 | 所要 |
|---|---|---|---|---|
| 05:50-06:00 | 集合 + 環境準備 | §2 集合 + §4 環境準備（git pull / pnpm install / **Cond-3 dry-run 再緑化**）| R-2 + R-3 + R-5 | 10min |
| 06:00 | 開始 | drill #2 5/7 朝開始宣言（議長）+ 9 シナリオ概要再確認 | R-1 | 0min |
| 06:00-06:10 | 通常稼働 baseline | S-1 通常稼働 baseline 確認 | R-3 + R-4 | 10min |
| 06:10-06:20 | kill-switch | S-2 emergency_stop（kill-switch + circuit-breaker 5 系統並列）| R-3 + R-2 | 10min |
| 06:20-06:30 | cost cap | S-3 cost_cap × spike legit（declareLegitSpikeWindow 1h × 2 multiplier）| R-3 + R-2 | 10min |
| 06:30-06:40 | rate spike | S-4 rate_spike × boundary（baselineMinTokens 10 + z-score 2σ filter）| R-3 + R-2 | 10min |
| 06:40-06:50 | heartbeat gap | S-5 continuous_run × sleep boundary（accumulatedSleepMs + heartbeat）| R-3 + R-2 | 10min |
| 06:50 | 中間報告 | Slack `#clawbridge-alerts` に S-1〜S-5 完遂中間報告投稿 + Owner Slack DM | R-5 | 1min |
| 06:50-07:00 | clock skew | S-6 clock skew 注入（heartbeat 再同期動作確認）| R-3 + R-2 | 10min |
| 07:00-07:10 | multi-process | S-7 Sumi/Asagi 巻き添え確認（3 アプリ並列稼働で Open Claw 単独 emergency_stop）| R-3 + R-4 | 10min |
| 07:10-07:20 | Slack quick-action | S-8 Owner override（Slack quick-action button 30min SLA mock）| R-3 + R-5 | 10min |
| 07:20-07:30 | audit log | S-9 audit log replay + hash chain verify（SHA-256）| R-3 + R-2 | 10min |
| 07:30-07:45 | 結果集計 | 12 軸 PASS criteria 集計 + `InMemoryDrillRecorder.entries()` JSON 化 + audit log grep | R-1 + R-2 + R-4 | 15min |
| 07:45 | 完遂宣言 | drill #2 完遂宣言（議長、12 軸速報）+ Slack post | R-1 | 1min |
| 07:45-07:55 | Sumi/Asagi cross check | Sumi (PRJ-018) / Asagi (PRJ-008) 同時起動 quota 0 消費確認 | R-4 | 10min |
| 07:55 | Owner 速報 | Slack `#clawbridge-alerts` + Owner Slack DM「12 軸 PASS criteria 速報 + 議決-26 効力確定文」投稿 | R-5 | 1min |
| 08:00 | 終了 | drill #2 終了宣言 + W0-Week1 検収会議 09:00 への引継 | R-1 | 0min |

### §3.2 9 シナリオ → Round 11 Review-C / Round 12 Review-D との対応

| 5/7 朝版 | 5/8 朝版 | Round 11 Review-C spec | 焦点 |
|---|---|---|---|
| S-1 通常稼働 baseline | S-1 通常稼働 baseline | (新規 preflight 補強)| baseline 70% RPS で 5min 持続、正常 evaluate() |
| S-2 kill-switch | S-2 kill-switch | Round 11 §4.1 S-1 emergency_stop | 401/403 5 連続 + circuit-breaker 5 系統並列 |
| S-3 cost cap | S-3 cost cap | Round 11 §4.7 S-7 cost_cap × spike legit | declareLegitSpikeWindow 1h × 2 multiplier |
| S-4 rate spike | S-4 rate spike | Round 11 §4.8 S-8 rate_spike × boundary | baselineMinTokens 10 + z-score 2σ filter |
| S-5 heartbeat gap | S-5 heartbeat gap | Round 11 §4.6 S-6 continuous_run × sleep boundary | accumulatedSleepMs + heartbeat |
| S-6 clock skew | S-6 clock skew | (Round 11 §4.6 補強)| heartbeat 再同期 + monotonic clock 整合 |
| S-7 multi-process | S-7 multi-process | Round 11 §4.5 S-5 Sumi/Asagi 巻き添え | 3 アプリ並列で Open Claw 単独 kill |
| S-8 Slack quick-action | S-8 Slack quick-action | Round 11 §4.7/§4.9 Owner override | Slack quick-action button 30min SLA mock |
| S-9 audit log | S-9 audit log | Round 11 §4.4 S-4 復旧 + audit chain verify | hash chain valid + replay 整合 |

注: 5/7 朝版と 5/8 朝版で S-1〜S-9 の番号順 + 内容は完全同一（実機検証日のみ -1 日前倒し）。

---

## §4 05:50-06:00 環境準備（Cond-3 dry-run 45/45 再緑化 + Dev-C R14 real-mode wire-up）

### §4.1 環境準備 9 項目チェックリスト（5min 上限、5/7 朝特則）

| # | 項目 | 確認コマンド | PASS 基準 | 担当 | 5/7 朝特則 |
|---|---|---|---|---|---|
| 1 | repo 最新化 | `cd C:/Users/hiron/Desktop/claude-code-company && git pull --ff-only origin main` | up-to-date or fast-forward 完了 | R-2 | **Cond-2 5/6 EOD Round 7-A core 3 件 commit 後の最新を pull** |
| 2 | pnpm install | `cd app/harness && pnpm install --frozen-lockfile` | exit 0 | R-3 | — |
| 3 | harness/Vitest tos-monitor | `cd app/harness && pnpm test --reporter=verbose --run tos-monitor` | 61 tests pass | R-2 | — |
| 4 | tos-monitor 1,344 行 importable | `node -e "const m=require('./dist/tos-monitor.js'); console.log(typeof m.createTosMonitor)"` | `function` 出力 | R-2 | — |
| 5 | drill #2 instrumentation 4 export | `node -e "const m=require('./dist/tos-monitor.js'); console.log(['InMemoryDrillRecorder','createDrillRecordingHook','wrapWithDrillRecording','createReplayHook'].every(k => k in m))"` | `true` 出力 | R-3 | — |
| 6 | dry-run-guard importable | `node -e "const m=require('./dist/dry-run-guard.js'); console.log(typeof m.createDryRunGuard)"` | `function` 出力 | R-3 | — |
| 7 | e2e flow mock-claw-flow 動作 | `cd app/e2e && pnpm test --run mock-claw-flow` | 8 tests pass | R-3 | — |
| 8 | benchmarks fixture 存在 | `ls app/harness/benchmark-results.json` | file 存在 | R-2 | — |
| 9 | Sumi/Asagi 稼働 + Owner alternate 経路 | Slack `#sumi-ops` + `#asagi-ops` heartbeat 5min 以内 + Owner ack request → 30s 内応答 | 3 件すべて確認 | R-4 + R-5 | **5/5 採決時 Owner ack で確証済 + 5/7 朝再確認** |

### §4.2 Cond-3 dry-run pre-flight（5/7 朝版必須、Dev-C runner 再緑化）

```bash
# 5/6 23:30 Cond-3 dry-run（事前）
cd C:/Users/hiron/Desktop/claude-code-company/app/e2e
pnpm test --run drill-2-pre-execution-dry-run --reporter=verbose

# 5/7 朝 05:55-06:00 当日 dry-run 再緑化確認（10min タイムスロット内 < 60s）
cd C:/Users/hiron/Desktop/claude-code-company/app/e2e
pnpm test --run drill-2-pre-execution-dry-run --reporter=verbose
```

**期待出力**: 45 セル（9 シナリオ × 5 要素）すべて green、所要 < 60s、test 11 で `trueCount === 45` 確認、test 12 で `shouldUseRealSpawn=true` 明示 throw 確認。
**不通過時**: §9 abort criteria #1 適用検討 → 5/8 朝 base 復帰判定。

### §4.3 Dev-C R14 real-mode wire-up integration（5/7 朝特則）

#### §4.3.1 real-mode 起動 flag

```bash
# 5/7 朝 06:00-07:30 実機検証 = wet-run mode + real-mode wire-up
cd C:/Users/hiron/Desktop/claude-code-company/app/e2e
pnpm test --run drill-2-pre-execution-dry-run --reporter=verbose -- \
  --mode real \
  --date 2026-05-07 \
  --record-fixtures=tasks/round14/drill2/
```

#### §4.3.2 real-mode 切替の 3 行差分（Dev-C R12 起案 §4.4 base + Dev-C R14 wire-up）

```ts
// 5/7 朝実機検証時の wire-up（コメントアウト解除）:
import { createRealSpawner } from '../../../openclaw-runtime/src/cli/real-child-spawn.js'

// runDrillScenario 内（--mode real 時）:
const useReal = (opts.mode ?? 'dry') === 'real'
if (useReal) {
  spawner = createRealSpawner({ killGraceMs: 200 })
  mode = 'subscription'
}
```

**期待**: 9 シナリオ × 5 要素を実機実行（実 child_process spawn 経由、Slack mock post 有り、circuit-breaker mock 発火有り）、各シナリオ完遂時に fixture JSON 自動生成（`tasks/round14/drill2/fixture-drill2-sN-*.json` 9 件）、recorder.entries() 自動 dump、§8 集計の手作業を 80% 削減。

#### §4.3.3 real-mode 切替の risk 確認

| risk | 確率（5/7 朝）| mitigation |
|---|---|---|
| createRealSpawner({killGraceMs:200}) で SIGTERM grace タイマー race | 1% | setTimeout.unref() 既統合、Round 12 Dev-C test 13 で SIGTERM exit 検証済 |
| Windows 環境での shell:false 強制下の `.bat` 起動失敗 | 0%（cliPath は `.exe` のみ）| Round 12 Dev-C 制限事項 §9 で明示済、本 drill では `.exe` 限定 |
| stdout/stderr line stream chunk 跨ぎでの multi-byte 文字 split | 1% | adaptRealChildProcess の `\n` split + tail 機構で吸収、Buffer.toString('utf8') 利用 |
| env allowlist で必須 env 漏洩 | 0% | DEFAULT_ENV_ALLOWLIST = ['PATH', 'HOME', 'LANG'] + emergencyApiOverride で ANTHROPIC_API_KEY のみ |

### §4.4 環境準備不通過時の対応（5/7 朝特則）

| 不通過項目 | 対応 |
|---|---|
| 1 (git pull) | merge conflict なら R-2 が解決（read-only branch なので fast-forward 失敗時は drill #2 中止 = §9 abort criteria #1）|
| 2 (pnpm install) | lockfile 不整合なら drill #2 中止 |
| 3-4 (harness)| **§9 abort criteria #1 適用、5/8 朝 base 復帰**（Round 7-A core 3 件 5/6 EOD commit 後の harness 整合性問題なら 5/8 朝で再確認）|
| 5-7 (instrumentation / dry-run / e2e)| **縮退実施**（drill #2 instrumentation 不使用、observation のみ実施）or **5/8 base 復帰**|
| 8 (benchmarks)| 縮退実施（S-3 cost cap で benchmark fixture 不使用、手動値で代替）|
| 9 (Sumi/Asagi/Owner)| **S-7 縮退**（observation のみ）+ 議長単独判断 or **5/8 base 復帰**|

### §4.5 環境準備完遂判定

| 判定 | 条件 |
|---|---|
| **GO** | 9 項目すべて PASS、Cond-3 dry-run 45/45 green、Dev-C R14 real-mode wire-up 動作確認 |
| **CONDITIONAL GO** | 1-4 すべて PASS + 5-9 のいずれか縮退、議長判断で続行 |
| **HOLD / 5/8 base 復帰** | 1-4 のいずれか不通過 → §9 abort criteria #1 適用 + 5/8 朝 base 復帰 |

---

## §5 06:00-06:30 シナリオ S-1〜S-3（通常稼働 / kill-switch / cost cap）

### §5.1 S-1: 通常稼働 baseline（06:00-06:10、10min）

| 項目 | 内容 |
|---|---|
| **Pre-condition** | (a) 環境準備 §4 GO、(b) `monitor = createTosMonitor()` 起動済（real-mode）、(c) `recorder-s1 = new InMemoryDrillRecorder()` 生成 |
| **Trigger** | `monitor = wrapWithDrillRecording(monitor, recorder-s1); for (let i=0; i<300; i++) await monitor.recordTokens(70);`（70 RPS 5min 持続 baseline、real spawn 経路で実 CLI 起動）|
| **Expected** | (a) `evaluate()` returns `{breached: false}`、(b) `recorder-s1.entries()` に 300 件 tokens entry、(c) Slack post 0 件、(d) circuit-breaker open 0 件 |
| **Pass criteria** | O-baseline-1: breach 件数 = 0 / O-baseline-2: token 記録 300 件 / O-baseline-3: Slack post 0 件 |
| **Rollback** | (a) `monitor.reset()`、(b) `recorder-s1.clear()` 不要（保管）、(c) S-2 へ進行 |

### §5.2 S-2: kill-switch（06:10-06:20、10min）

| 項目 | 内容 |
|---|---|
| **Pre-condition** | (a) S-1 PASS、(b) `recorder-s2 = new InMemoryDrillRecorder()` 生成、(c) circuit-breaker 5 系統 closed 状態確認、**(d) Cond-2 G-02 kill-switch 5/6 EOD commit 完遂確認** |
| **Trigger** | `for (let i=0; i<5; i++) await monitor.pollWarnings({ status: i<3?401:403, body: '{"error":"unauthorized"}' });` + 並行で `circuitBreaker.forceOpen()` × 5 系統 |
| **Expected** | (a) tos-monitor event `kind: 'unauthorized_chain_detected'` 発火、(b) `kill-switch.trigger()` 呼出、(c) 5 系統 forceOpen 同期 ≤ 500 ms、(d) Slack `#clawbridge-alerts` `[CRITICAL] emergency_stop fired` post、**(e) real spawn 経由で SIGTERM → 200ms grace → SIGKILL fallback 動作確認** |
| **Pass criteria** | O-1: kill-switch elapsed ≤ 5,000 ms（`performance.now()`）/ O-2: circuit-breaker 5 系統 100% 同期 ≤ 500 ms |
| **Rollback** | (a) `kill-switch.disarm()`、(b) circuit-breaker 5 系統 `forceClose()`、(c) `monitor.reset()`、(d) `recorder-s2.entries()` 退避保管 |

### §5.3 S-3: cost cap（06:20-06:30、10min）

| 項目 | 内容 |
|---|---|
| **Pre-condition** | (a) S-2 PASS + rollback 完遂、(b) `recorder-s3` 生成、(c) cost-tracker `currentUsd === 0` 確認 |
| **Trigger** | `await monitor.declareLegitSpikeWindow(3600000, 2);` + `for (let i=0; i<10; i++) await costTracker.recordSpend(3.5);`（合計 $35、cap $30 超え、extended cap $60 内）|
| **Expected** | (a) `evaluate()` returns `{breached: false, suppressedByLegitSpike: true}`、(b) `suppressedByLegitSpikeCount += 1`、(c) Anthropic console mock で hard cap 動作なし（$60 < $60 cap）、(d) Owner Slack quick-action button mock post |
| **Pass criteria** | O-7: `--cost-cap-extended` flag 受理 + detector 1h 一時無効化 + Owner override 30min SLA 内 mock 応答 |
| **Rollback** | (a) `costTracker.reset()`、(b) `monitor.disableLegitSpikeWindow()`、(c) `recorder-s3.entries()` 退避保管 |

### §5.4 06:00-06:30 区分判定

| 判定 | 条件 |
|---|---|
| **段階 GO** | S-1 + S-2 + S-3 すべて PASS |
| **CONDITIONAL** | S-1 PASS + S-2 PASS + S-3 PARTIAL（Owner mock 応答遅延等）|
| **abort** | S-2 で kill-switch 5,000 ms 超過 → §9 abort criteria #2 検討 |

---

## §6 06:30-07:00 シナリオ S-4〜S-6（rate spike / heartbeat gap / clock skew）

### §6.1 S-4: rate spike × boundary（06:30-06:40、10min）

| 項目 | 内容 |
|---|---|
| **Pre-condition** | (a) S-3 PASS + rollback、(b) `recorder-s4` 生成、(c) baselineMinTokens 10 設定確認 |
| **Trigger** | (a) baseline 70% 70 RPS で 5min 持続（既 S-1 と同等の baseline）、(b) 瞬間突破 5 RPS で 1sec 注入、(c) baselineMinTokens 10 設定で baseline=8 注入で抑止確認、(d) z-score 2σ filter 動作確認 |
| **Expected** | (a) 1 サイクル目 strip + 確定発火なし、(b) `suppressedByZScore: true` + `suppressedZScoreCount += 1`、(c) jittering 統合で request 間隔 std > 0、(d) sliding window rate calculation でなめらか動作 |
| **Pass criteria** | O-8: debounce 60s 動作 + 1 サイクル目 strip + false-positive 月次発生確率 < 1% |
| **Rollback** | (a) `monitor.reset()`、(b) `recorder-s4.entries()` 退避保管、(c) S-5 へ進行 |

### §6.2 S-5: heartbeat gap（06:40-06:50、10min）

| 項目 | 内容 |
|---|---|
| **Pre-condition** | (a) S-4 PASS + rollback、(b) `recorder-s5` 生成、(c) `monitor.markBoot()` 実行済 |
| **Trigger** | (a) Vitest fake timer で 11h59min59sec advance、(b) `monitor.recordHeartbeat()` 1min 間隔で 12 回呼出（その間に OS suspend mock 12h 注入）、(c) `monitor.checkContinuousRun()` で判定 |
| **Expected** | (a) `accumulatedSleepMs` に 12h 加算、(b) `wallElapsed - accumulatedSleepMs = active elapsed < 12h`、(c) `evaluate()` returns `{breached: false}`、(d) heartbeat 12 件 recorder 記録 |
| **Pass criteria** | O-6: tolerance 60s 動作（23:55-00:05 境界 / 11:55-12:05 境界で誤発火件数 0 件）+ false-positive 月次発生確率 < 1% |
| **Rollback** | (a) `monitor.reset()`、(b) `recorder-s5.entries()` 退避保管、(c) S-6 へ進行 |

### §6.3 06:50 中間報告（1min）

| 担当 | 動作 | 完遂条件 |
|---|---|---|
| R-5 | Slack `#clawbridge-alerts` に「S-1〜S-5 完遂中間報告」投稿（5/5 PASS or 縮退状況明示）| post 確認 |
| R-5 | Owner Slack DM 同時投稿（5/7 朝特則: Owner formal「採決日 5/5」directive 連動 ack 含む）| Owner ack 不要 |
| R-1 | 後半 4 シナリオ進行確認 + 06:50 → 07:00 を S-6 開始時刻として確定 | timeline 整合 |

### §6.4 S-6: clock skew（06:50-07:00、10min）

| 項目 | 内容 |
|---|---|
| **Pre-condition** | (a) S-5 PASS、(b) `recorder-s6` 生成、(c) monotonic clock spy ON |
| **Trigger** | (a) `clock.advance(60000)` で 1min 進行、(b) `clock.skew(-30000)` で -30s skew 注入、(c) `monitor.recordHeartbeat()` 呼出、(d) skew 後の `lastHeartbeat = now` 再同期確認 |
| **Expected** | (a) skew 検出 event 発火 (`kind: 'clock_skew_detected'`)、(b) heartbeat 再同期完了、(c) `accumulatedSleepMs` 整合性維持（skew 量を sleep として誤計上しない）、(d) monotonic clock 観測値が wall clock と独立 |
| **Pass criteria** | O-skew-1: skew 検出 + 再同期 ≤ 1,000 ms / O-skew-2: accumulatedSleepMs 整合（誤計上 0 ms）|
| **Rollback** | (a) `clock.reset()`、(b) `monitor.reset()`、(c) `recorder-s6.entries()` 退避保管 |

### §6.5 06:30-07:00 区分判定

| 判定 | 条件 |
|---|---|
| **段階 GO** | S-4 + S-5 + S-6 すべて PASS |
| **CONDITIONAL** | S-4 + S-5 PASS + S-6 PARTIAL（skew 再同期遅延等）|
| **abort** | S-4/S-5 のいずれかで月次偽陽性率 ≥ 1% 検出 → §9 abort criteria #2 |

---

## §7 07:00-07:30 シナリオ S-7〜S-9（multi-process / Slack quick-action / audit log）

### §7.1 S-7: multi-process（07:00-07:10、10min）

| 項目 | 内容 |
|---|---|
| **Pre-condition** | (a) S-6 PASS + rollback、(b) Sumi (PRJ-018) 稼働確認、(c) Asagi (PRJ-008) 稼働確認、(d) `recorder-s7` 生成、**(e) 5/7 朝特則: Cond-2 G-02 kill-switch 完遂で propagation 動作期待 70% 確度** |
| **Trigger** | (a) Sumi normal task 実行 (PRJ-018 hello-world)、(b) Asagi normal task 実行 (PRJ-008 daily report)、(c) Open Claw に 401/403 5 連続注入で kill-switch trigger（S-2 と同等）|
| **Expected** | (a) Open Claw kill 完遂 ≤ 5,000 ms、(b) Sumi の Claude Code OAuth quota 消費 0、(c) Asagi の OpenAI Codex API quota 消費 0、(d) Slack 通常 ch（`#sumi-ops` / `#asagi-ops`）混入 0 件 |
| **Pass criteria** | O-10: Sumi quota 0 消費 / O-11: Asagi quota 0 消費 / O-12: 通常 ch 混入 0 件（3 軸全 PASS）|
| **Rollback** | (a) Open Claw kill-switch disarm、(b) Sumi/Asagi 通常運用継続、(c) `recorder-s7.entries()` 退避保管 |

**最重要**: S-7 で Sumi/Asagi quota 1+ 消費検出時 → **§9 abort criteria #3 即時適用**（drill #2 中止 + 議決-26 効力 reset 必至 + 5/12 復帰）。

### §7.2 S-8: Slack quick-action（07:10-07:20、10min）

| 項目 | 内容 |
|---|---|
| **Pre-condition** | (a) S-7 PASS、(b) `recorder-s8` 生成、(c) Slack workspace `#drill-exec` 利用可確認 |
| **Trigger** | (a) `monitor.declareLegitSpikeWindow(300000, 2)` で 5min spike window 宣言、(b) Slack quick-action button mock post（Owner ack request 投稿）、(c) 30min SLA 計測開始、(d) Owner 模擬応答（30s 内に R-5 が ack click mock）|
| **Expected** | (a) Owner 模擬応答 timestamp 記録、(b) `manualOverrideAcknowledged: true` set、(c) 30min SLA 内応答（30s で達成）、(d) audit log full trace 記録 |
| **Pass criteria** | O-9: Slack quick-action button 受理 + Owner 30min SLA 内応答 + audit log 記録 |
| **Rollback** | (a) `monitor.disableLegitSpikeWindow()`、(b) Slack post 削除（mock のみ、本番影響なし）、(c) `recorder-s8.entries()` 退避保管 |

### §7.3 S-9: audit log（07:20-07:30、10min）

| 項目 | 内容 |
|---|---|
| **Pre-condition** | (a) S-8 PASS、(b) `recorder-s9` 生成、(c) auditStore 初期化確認、**(d) 5/7 朝特則: Cond-2 G-09 監査ログ全件保存 commit 完遂で hash chain 動作期待 70% 確度** |
| **Trigger** | (a) `await auditStore.replay()`、(b) `const valid = await auditStore.verifyHashChain()`、(c) `kill-switch.disarm()` + `costTracker.reset()` + `monitor.reset()` の 3 reset 連続実行、(d) `canResume: true` 確認 |
| **Expected** | (a) audit log `chain_valid: true`、(b) `brokenAt: null`、(c) cost-tracker `currentUsd === 0`、(d) replay 整合性 100%（SHA-256 ハッシュ一致）|
| **Pass criteria** | O-5: audit log hash chain `chain_valid: true` + 3 reset items すべて成功 + `canResume: true` |
| **Rollback** | (a) audit log read-only（rollback 不要）、(b) reset 後の状態維持（後続集計用）、(c) `recorder-s9.entries()` 退避保管 |

### §7.4 07:00-07:30 区分判定

| 判定 | 条件 |
|---|---|
| **段階 GO** | S-7 + S-8 + S-9 すべて PASS |
| **CONDITIONAL** | S-7 PASS + S-8 PARTIAL（Owner mock 応答 30s 超過）+ S-9 PASS |
| **abort** | S-7 で Sumi/Asagi quota 1+ 消費 → §9 abort criteria #3 即時 / S-9 で chain_valid: false → §9 abort criteria #2 |

---

## §8 07:30-08:00 結果集計 + audit log grep + Sumi/Asagi cross check

### §8.1 07:30-07:45 結果集計（15min）

| 時刻 | 担当 | 動作 | 完遂条件 |
|---|---|---|---|
| 07:30-07:35 | R-2 | 9 シナリオ各々の `recorder-sN.entries()` を JSON 化、`tasks/round14/drill2/fixture-drill2-sN-*.json` 保存 | 9 fixture file 存在 |
| 07:35-07:38 | R-2 | audit log grep: `grep -E "kind: '(unauthorized|cost_cap|rate_spike|continuous_run|clock_skew)_'" audit.log` で 9 シナリオ event 件数集計 | event 件数 vs 期待値 比較 |
| 07:38-07:42 | R-1 + R-2 | 12 軸 PASS criteria 集計表作成（O-1 〜 O-12、Round 13 Review-E result-aggregation-template.md §5 踏襲）| 12 軸 PASS / PARTIAL / FAIL 判定 |
| 07:42-07:45 | R-4 | `summary-drill2-12-axes.json` 生成（12 軸 + 9 シナリオ + 議決-26 効力確定文）| JSON 妥当性 |

### §8.2 07:45 完遂宣言（1min）

| 担当 | 動作 |
|---|---|
| R-1 | Slack `#clawbridge-alerts` に「drill #2 5/7 朝完遂宣言、12 軸速報: {N}/12 PASS」投稿 |
| R-1 | timeline ISO8601 終了時刻記録 |

### §8.3 07:45-07:55 Sumi/Asagi cross check（10min）

| 時刻 | 担当 | 動作 | 完遂条件 |
|---|---|---|---|
| 07:45-07:50 | R-4 | Sumi (PRJ-018) 同時起動状態確認: `claude-bridge --workspace=PRJ-018 --status` | OAuth quota 消費 0、heartbeat 5min 以内 |
| 07:50-07:55 | R-4 | Asagi (PRJ-008) 同時起動状態確認: `codex --workspace=PRJ-008 --status` | OpenAI API quota 消費 0、heartbeat 5min 以内 |
| 07:55 | R-2 | cross check 結果を `summary-drill2-12-axes.json` に追記（O-10/-11/-12 確証）| JSON 更新 |

### §8.4 07:55-08:00 Owner 速報 + 議決-26 効力確定（5min）

| 担当 | 動作 | テンプレ |
|---|---|---|
| R-1 | 議決-26 効力確定文生成（5/5 採決時 Conditional Pass → 5/7 朝結果で確定）| §8.5 テンプレ参照 |
| R-5 | Slack `#clawbridge-alerts` + Owner Slack DM 投稿 | post 確認 |
| R-1 | drill #2 終了宣言 + W0-Week1 検収会議 09:00 への引継宣言 | 終了時刻 ISO8601 記録 |

### §8.5 議決-26 効力確定文テンプレ（5/7 朝版）

```
[drill #2 5/7 朝実機検証 result v1 + 議決-26 効力確定文]

期間: 2026-05-07 06:00-08:00 (120 min)
12 軸 PASS criteria: {ACHIEVED}/12 ({STATUS})
- Critical 5 軸 (#1/#2/#5/#10/#11): {PASS_COUNT}/5 PASS
- High 4 軸 (#6/#7/#8/#9): {PASS_COUNT}/4 PASS
- Medium 1 軸 (#12): {PASS_COUNT}/1 PASS

5/5 採決時の議決-26 Conditional Pass → 5/7 朝 drill #2 結果反映:
{EFFICACY_RESULT}

artifact: tasks/round14/drill2/ 配下 9 fixture JSON + summary-drill2-12-axes.json
```

| 達成数 | 効力結果（{EFFICACY_RESULT}）|
|---|---|
| 12/12 Full Pass | 採択効力 unconditional 化（極めて強い推奨で無条件採択） + Phase 1 着手 5/26 計画通り |
| 11/12 Partial Pass（Critical 5 軸全 PASS）| 採択効力維持（強い推奨で Conditional 採択） + Phase 1 W4 完遂を condition |
| 10/12 Partial Pass（Critical 5 軸全 PASS）| 採択効力維持（強い推奨で Conditional 採択） + Phase 1 W4 完遂を condition |
| 9/12 Conditional Pass（Critical 5 軸全 PASS）| 採択効力維持（推奨で Conditional 採択） + 5/12 復帰検討 |
| < 9/12 Fail | 議決-26 採択効力 reset、5/12 復帰 + 再採決 |

---

## §9 abort criteria 3 件 + 即時中断手順（5/7 朝版特則）

### §9.1 abort criteria #1: 環境準備不通過（5/7 朝特則: 5/8 朝 base 復帰経路明示）

| 条件 | 即時中断手順 + 5/8 朝 base 復帰 |
|---|---|
| §4.1 環境準備 9 項目で **3 件以上不通過** OR **項目 1-4（git pull / pnpm install / harness / tos-monitor importable）のいずれか不通過**（5/7 朝発火確率 15%）| (a) R-1 が 06:00 直前に「drill #2 5/7 朝中止宣言」、(b) R-5 が Slack `#clawbridge-alerts` + Owner Slack DM「drill #2 5/7 朝中止、**5/8 朝 base 復帰決定**」投稿、(c) 全 recorder クリア、(d) 5/8 朝 06:00 で 5/8 base ランブック（review-round12-drill-2-runbook-final.md）に従い再実施 |

### §9.2 abort criteria #2: シナリオ実行中の Critical FAIL（5/7 朝発火確率 10%）

| 条件 | 即時中断手順 |
|---|---|
| **S-1〜S-9 のいずれかで Critical 軸（O-1/-2/-5/-10/-11）FAIL** OR **S-1〜S-4 で 2 件以上 Critical FAIL** | (a) R-1 が即時「drill #2 中断宣言」、(b) R-3 が現在進行中の trigger を即時停止、(c) R-2 がそれまでの recorder.entries() を退避保管、(d) R-5 が Slack + Owner DM 投稿「drill #2 中断、原因分析後 5/12 復帰判断」、(e) 完了済シナリオの結果は §8 に従い集計（Conditional Pass 判定）、(f) 議決-26 効力 = Conditional Pass 維持 or reset 検討（CEO 判断）|

### §9.3 abort criteria #3: Sumi/Asagi 巻き添え発生（5/7 朝発火確率 4%、最重大）

| 条件 | 即時中断手順 |
|---|---|
| **S-7 multi-process で Sumi/Asagi quota 1+ 消費** OR **Slack 通常 ch（`#sumi-ops` / `#asagi-ops`）に Open Claw alert 1+ 件混入**（5/7 朝も 5/8 base と同等の 4% 確率）| (a) R-1 が **最高 priority で「drill #2 即時中止宣言」**、(b) Sumi/Asagi 経路を即時隔離（claude-bridge config 退避）、(c) R-5 が Owner Slack DM **緊急投稿**「Sumi/Asagi 巻き添え検出、drill #2 中止 + **議決-26 採択効力 reset 必至** + 5/12 復帰確定」、(d) 議決-26 採択を 5/12 まで延期（W0-Week1 検収会議で reschedule 議決）|

### §9.4 abort 後の復帰手順（5/7 朝特則）

| 復帰段階 | 期限 | 完遂条件 |
|---|---|---|
| 1. abort #1 時 5/8 朝 base 復帰 | 5/8 朝 06:00 | 5/8 base ランブック（`review-round12-drill-2-runbook-final.md`）で再実施 |
| 2. abort #2/#3 時原因分析 | 5/7 EOD | abort criteria 別の root cause 文書化（`review-round14-drill-2-5-7-abort-N-analysis.md`、N = 2/3）|
| 3. 修正 + dry-run 再実施 | 5/10 EOD | Dev-C runner で 45/45 green 再達成 |
| 4. drill #2 5/12 復帰 | 5/12 朝 06:00-08:00 | 5/7 朝版または新 v1.1 ランブックで再実施 |
| 5. 議決-26 効力 reschedule | 5/12 EOD | 必要に応じて W0-Week1 検収会議延長会議で再採決 |

---

## §10 Dev-C R14 real-mode wire-up integration SOP

### §10.1 Dev-C R14 wire-up の 3 stage

| stage | 内容 | 期限 |
|---|---|---|
| **stage 1** | Round 12 Dev-C `drill-2-pre-execution-dry-run.test.ts` の 5/8 朝切替構造（§4.4 1 行コメントアウト解除）を 5/7 朝版へ移植 | 5/5 EOD |
| **stage 2** | `--mode real --date 2026-05-07` flag 追加 + cli args parser 統合 | 5/6 EOD |
| **stage 3** | 5/7 朝当日 5/7 06:00-07:30 で wet-run mode + real-mode 起動 | 5/7 朝 06:00 |

### §10.2 stage 1 詳細: 5/7 朝切替構造への移植

```ts
// 5/7 朝実機検証時の wire-up（コメントアウト解除）:
import { createRealSpawner } from '../../../openclaw-runtime/src/cli/real-child-spawn.js'

// runDrillScenario 内（--mode real + --date 2026-05-07 時）:
const useReal = (opts.mode ?? 'dry') === 'real'
const targetDate = opts.date ?? '2026-05-08' // 5/8 base default
if (useReal && targetDate === '2026-05-07') {
  spawner = createRealSpawner({ killGraceMs: 200 })
  mode = 'subscription'
} else if (useReal && targetDate === '2026-05-08') {
  spawner = createRealSpawner({ killGraceMs: 200 })
  mode = 'subscription'
}
```

### §10.3 stage 2 詳細: cli args parser 統合

```bash
# Dev-C R14 起動 flag 仕様
pnpm test --run drill-2-pre-execution-dry-run --reporter=verbose -- \
  --mode <dry|real>           # default: dry
  --date <2026-05-07|2026-05-08>  # default: 2026-05-08
  --record-fixtures=<path>    # default: 不記録
```

### §10.4 stage 3 詳細: 5/7 朝当日実行 SOP

| 時刻 | 動作 |
|---|---|
| 06:00 | drill #2 5/7 朝開始宣言 + `--mode real --date 2026-05-07 --record-fixtures=tasks/round14/drill2/` 起動 |
| 06:00-07:30 | 9 シナリオ × 5 要素 = 45 セル wet-run 実機実行 |
| 07:30 | 9 fixture JSON 自動生成完遂、`summary-drill2-12-axes.json` も自動生成 |

### §10.5 runner 内部の 5 要素 mapping（Round 12 §9.4 踏襲）

| ランブック §5-7 の 5 要素 | runner test() 内の section |
|---|---|
| Pre-condition | `beforeEach()` での setup |
| Trigger | `await scenario.trigger()` |
| Expected | `expect(...)` assertions |
| Pass criteria | `expect(passCriteria.O_N).toBe(true)` |
| Rollback | `afterEach()` での teardown |

### §10.6 wire-up 不在時の手動 fallback

Dev-C R14 で wire-up が間に合わない場合: (a) Round 12 Dev-C `shouldUseRealSpawn=true` 明示 throw 構造のまま 5/7 朝中止 = 5/8 朝 base 復帰、または (b) 本ランブック §5-7 の 5 要素を operator が手動実行（既存の Round 11 Review-C spec と同等の手作業）。

---

## §11 5/8 朝 base 復帰経路 + Round 14 引継 TODO

### §11.1 5/8 朝 base 復帰経路（5/7 朝中止時の transition）

| 中止トリガ | 5/8 朝 base 復帰判断時刻 | 復帰手順 |
|---|---|---|
| Cond-1 RSVP 未達（5/5 EOD）| 5/6 朝 06:00 | 5/8 朝 base ランブック（`review-round12-drill-2-runbook-final.md`）で再計画 |
| Cond-2 Round 7-A core 3 件未達（5/6 EOD）| 5/6 23:00 | 同上 |
| Cond-3 dry-run 不達（5/6 23:30）| 5/6 23:45 | 同上 |
| 5/7 朝集合不達 / 環境準備不通過 | 5/7 朝 06:00 直前 | 同上、5/8 朝 06:00 で再実施 |
| 5/7 朝 abort criteria #1 発火 | 5/7 朝 06:00 直後 | 同上 |
| 5/7 朝 abort criteria #2/#3 発火 | 5/7 EOD | 5/12 朝復帰（5/8 base 復帰ではなく 5/12 朝復帰）|

### §11.2 Round 14 引継 TODO 6 件

| # | TODO | 担当 | 期限 | 完遂条件 |
|---|---|---|---|---|
| 1 | 5/5 EOD Cond-1 RSVP 取得確認 | 秘書 + Review | 5/5 EOD | Owner Slack DM RSVP 確認 |
| 2 | 5/6 EOD Cond-2 Round 7-A core 3 件 commit 完遂確認 | Dev + Review | 5/6 EOD | G-02 / G-09 / G-10 の 3 PR merge + test 緑化 |
| 3 | 5/6 23:30 Cond-3 dry-run 45/45 再緑化確認 | Review | 5/6 23:30 | 45/45 green |
| 4 | 5/7 朝 drill #2 実施 + 結果集計レポート起票（`review-round15-drill-2-5-7-result.md`）| Review | 5/7 EOD | 12 軸集計 + 9 fixture summary + 議決-26 効力確定文 |
| 5 | 5/7 EOD C-A-02 PASS 化反映（必須 50 50% 達成判定）| Review | 5/7 EOD | C-A-02 PASS 反映 + 5/15 中間チェックへの効果反映 |
| 6 | 5/7 EOD 議決-26 効力確定文起票（`review-round15-decision-26-efficacy-final.md`）| Review + CEO | 5/7 EOD | 5 段階効力結果文（極めて強い推奨〜採択非推奨）|

### §11.3 関連 DEC / リスク参照

- **DEC-019-019**: drill #1 シナリオ承認 — 本書 9 シナリオの S-2/-3/-4 起源
- **DEC-019-052**: 案 C ハイブリッド暫定運用 — drill #2 で subscription + API fallback 両モード検証根拠
- **DEC-019-054**: Round 7 完遂 — Cond-2 core 3 件の根拠
- **DEC-019-055**: Round 8 完遂 — drill #2 5/8 朝 base 設定の起源（5/7 朝版は -1 日前倒し）
- **DEC-019-056**: Round 9/10 前倒し — drill #2 instrumentation 4 export 着地の起源
- **DEC-019-057**: Round 11 4 部署並列前倒し — Dev-A/B/C/D harness 準備度 GO 確定の起源
- **R-019-06**: BAN 30-60% / 12 ヶ月 — drill #2 Full Pass で +10% mitigation
- **R-019-08**: 兄弟案件リソース食合い — drill #2 S-7 + cross check Sumi/Asagi 巻き添えゼロ確証で +5%
- **R-019-09**: NG-3 24/7 監視 — high 4 セル抑止動作確認で +5%

### §11.4 確度押上推定

| 観点 | 5/8 朝 base | 5/7 朝版（本書）|
|---|---|---|
| drill #2 Pass 確度 | 96% | **92%**（base 比 -4pt、Round 7-A 完遂見込み 70% 反映）|
| Phase 1 着手 5/26 Conditional Go 確度 | 95% | **96%**（5/7 朝完遂で +1 日 buffer 確保）|
| 議決-26 採択推奨度 | Conditional Pass | **Conditional Pass（5/5 採決時）+ 5/7 朝結果で確定**|
| 5/22 朝公開前倒し（DEC-019-056）確度 | 88% | **90%**（5/7 朝完遂で +1 日早期化）|

### §11.5 Review 部門 sign-off

| 観点 | sign-off |
|---|---|
| 5/8 朝版から 5/7 朝版への移植差分（7 件）| sign-off |
| 当日 operator 5 役割 + 集合手順（5/7 朝特則）| sign-off |
| 分単位 timeline 確定版（130 分、5/7 朝版）| sign-off |
| 環境準備 9 項目 + Cond-3 dry-run 45/45 再緑化 + Dev-C R14 real-mode wire-up | sign-off |
| 9 シナリオ × 5 要素実行仕様（45 セル、real-mode 統合）| sign-off |
| abort criteria 3 件 + 即時中断手順（5/7 朝特則 + 5/8 朝 base 復帰経路）| sign-off |
| Dev-C R14 real-mode wire-up integration SOP（3 stage）| sign-off |
| 議決-26 効力確定文テンプレ（5/7 朝版 5 段階）| sign-off |
| Round 14 引継 TODO 6 件 | sign-off |

### §11.6 次回更新

- 5/5 EOD（Cond-1 RSVP 取得確認）
- 5/6 EOD（Cond-2 Round 7-A core 3 件 commit 完遂確認）
- 5/6 23:30（Cond-3 dry-run 45/45 再緑化確認）
- 5/7 朝 06:00（drill #2 5/7 朝開始）
- 5/7 朝 08:00（drill #2 完遂直後 → Round 14 引継 TODO #4-#6 起票）

---

**v1.0 起案**: 2026-05-04 W0-Week1 深夜 Review 部門 R14 Review-F / 案 C ハイブリッド暫定運用前提 / Owner formal「採決日 5/5」+ CEO「drill #2 5/7 分離」directive 整合
**正式採択**: 2026-05-07 朝 06:00 drill #2 5/7 朝開始時（3 condition すべて達成確認後）
**v1.0 確定差分**: 5/8 朝版から 5/7 朝版へ移植（7 差分）+ Dev-C R14 real-mode wire-up integration（3 stage）+ 5/8 朝 base 復帰経路明示（6 中止トリガ別）+ 5 段階効力確定文 + Round 14 引継 TODO 6 件
