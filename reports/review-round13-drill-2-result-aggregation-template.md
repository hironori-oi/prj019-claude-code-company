# PRJ-019 — Round 13 Review-E BAN drill #2 実機結果集計テンプレ（9 シナリオ × 5 要素 = 45 セル + pre/in/post-flight）

最終更新: 2026-05-04 W0-Week1 深夜 / 起案: Review 部門 R13 Review-E
位置付け: Owner formal「最速で進めよ」directive 継続中、議決-26 採択 5 軸の **軸-2（BAN drill #2 実機検証）の結果集計テンプレ**。Round 12 Review-D の `review-round12-drill-2-runbook-final.md` v1.0（5/8 朝 130 分 timeline）を base に、当日 operator が結果を記入してそのまま提出可能な構造化テンプレを起案。pre-flight check（環境）/ in-flight（45 セル PASS/FAIL）/ post-flight（audit log grep + cleanup）の 3 段階で網羅。
版: v1.0（Round 13 Review-E 起案、read-only + report-only、当日 operator 記入用）
連動 DEC: DEC-019-019 / DEC-019-052 / DEC-019-055 / DEC-019-056 / DEC-019-057
連動レポート: `review-round12-drill-2-runbook-final.md`（base ランブック）/ `review-round13-drill-2-pre-emption-evaluation.md`（前倒し可否評価）/ `dev-round12-C-real-spawn-ndjson-drill2.md`（45 セル dry-run harness）

---

## §0 200 字 CEO サマリ

drill #2 実機結果集計テンプレを Round 13 Review-E 起案。当日 operator が結果を記入してそのまま提出可能な構造化テンプレ、pre-flight check（環境準備 9 項目）/ in-flight（9 シナリオ × 5 要素 = 45 セル PASS/FAIL）/ post-flight（audit log grep + Sumi/Asagi cross check + cleanup）の 3 段階で網羅。Round 12 Dev-C の `drill-2-pre-execution-dry-run.test.ts` 16 tests と 1:1 対応、12 軸 PASS criteria（O-1〜O-12）集計 + 議決-26 採択推奨度判定文（極めて強い推奨 / 強い推奨 + Conditional / 推奨 + Conditional / 採択非推奨 の 4 段階）+ 9 fixture JSON 自動生成 SOP 含む。read-only 厳守、コード一切無改変、当日記入用 placeholders を `[TODO 記入]` で明示。

---

## 目次

| § | 題目 |
|---|------|
| §1 | テンプレ全体構成（pre/in/post-flight 3 段階）|
| §2 | pre-flight check 記入欄（環境準備 9 項目）|
| §3 | in-flight 記入欄（9 シナリオ × 5 要素 = 45 セル）|
| §4 | post-flight 記入欄（audit log grep + Sumi/Asagi cross check + cleanup）|
| §5 | 12 軸 PASS criteria 集計表 |
| §6 | 議決-26 採択推奨度判定文（4 段階）|
| §7 | 9 fixture JSON 自動生成 SOP |

---

## §1 テンプレ全体構成（pre/in/post-flight 3 段階）

### §1.1 3 段階の時間配分

| 段階 | 時刻 | 所要 | 主目的 |
|---|---|---|---|
| **pre-flight** | 05:50-06:00 | 10min | 環境準備 9 項目 + Dev-C runner dry-run 45/45 green |
| **in-flight** | 06:00-07:30 | 90min | 9 シナリオ × 5 要素 = 45 セル実機実行 |
| **post-flight** | 07:30-08:00 | 30min | audit log grep + Sumi/Asagi cross check + cleanup + 集計 |
| **合計** | 05:50-08:00 | 130min | — |

### §1.2 記入規則

| 記号 | 意味 |
|---|---|
| `[TODO 記入]` | 当日 operator が記入する placeholder |
| `[ISO8601]` | ISO 8601 形式タイムスタンプ（例: `2026-05-08T06:00:00.000Z`）|
| `[PASS / FAIL / PARTIAL]` | 3 値判定 |
| `[N/A]` | 該当なし |

---

## §2 pre-flight check 記入欄（環境準備 9 項目）

### §2.1 環境準備 9 項目チェックリスト

drill 実施日: `[TODO 記入]`（例: 2026-05-08）
開始時刻: `[ISO8601]`
担当 operator: R-1 / R-2 / R-3 / R-4 / R-5（5 役割）

| # | 項目 | 確認コマンド | PASS 基準 | 担当 | 結果 | 備考 |
|---|---|---|---|---|---|---|
| 1 | repo 最新化 | `git pull --ff-only origin main` | up-to-date or fast-forward | R-2 | `[PASS / FAIL]` | `[TODO]` |
| 2 | pnpm install | `pnpm install --frozen-lockfile` | exit 0 | R-3 | `[PASS / FAIL]` | `[TODO]` |
| 3 | tos-monitor 61 tests | `pnpm test --run tos-monitor` | 61 pass | R-2 | `[PASS / FAIL]` | `[TODO]` |
| 4 | tos-monitor importable | `node -e "..."` | function 出力 | R-2 | `[PASS / FAIL]` | `[TODO]` |
| 5 | drill #2 instrumentation 4 export | `node -e "..."` | true | R-3 | `[PASS / FAIL]` | `[TODO]` |
| 6 | dry-run-guard importable | `node -e "..."` | function | R-3 | `[PASS / FAIL]` | `[TODO]` |
| 7 | e2e mock-claw-flow | `pnpm test --run mock-claw-flow` | 8 pass | R-3 | `[PASS / FAIL]` | `[TODO]` |
| 8 | benchmarks fixture 存在 | `ls benchmark-results.json` | 存在 | R-2 | `[PASS / FAIL]` | `[TODO]` |
| 9 | Sumi/Asagi heartbeat + Owner ack | Slack heartbeat 5min + 30s ack | 3/3 | R-4 + R-5 | `[PASS / FAIL]` | `[TODO]` |

### §2.2 Dev-C runner dry-run pre-flight

```bash
cd app/harness && pnpm test --run drill-2-pre-execution-dry-run --reporter=verbose -- --dry-run
```

| 項目 | 期待 | 結果 |
|---|---|---|
| 45 セル green | 45/45 | `[TODO 記入: NN/45]` |
| 所要 < 60s | < 60s | `[TODO 記入: NN.Ns]` |
| Slack post 0 件 | 0 | `[TODO 記入: NN]` |
| circuit-breaker 状態無変動 | unchanged | `[PASS / FAIL]` |

### §2.3 pre-flight 完遂判定

| 判定 | 条件 | 結果 |
|---|---|---|
| **GO** | 9 項目すべて PASS + Dev-C runner 45/45 green | `[GO / CONDITIONAL GO / HOLD]` |
| **CONDITIONAL GO** | 1-4 すべて PASS + 5-9 のいずれか縮退 | — |
| **HOLD** | 1-4 のいずれか不通過 → §8 abort criteria #1 | — |

判定者（R-1 議長）: `[TODO 記入]`
判定時刻: `[ISO8601]`

---

## §3 in-flight 記入欄（9 シナリオ × 5 要素 = 45 セル）

### §3.1 シナリオ実行記入欄テンプレ（共通）

各シナリオ（S-1〜S-9）について以下 5 要素を記入:

| 要素 | 内容 | 結果欄 |
|---|---|---|
| Pre-condition | 事前条件達成確認 | `[PASS / FAIL]` |
| Trigger | trigger 実行記録 | `[実行時刻 ISO8601 / 失敗理由]` |
| Expected | 期待事象観測 | `[PASS / FAIL]` |
| Pass criteria | 5 軸計測値 | `[計測値]` |
| Rollback | 巻き戻し完遂 | `[PASS / FAIL]` |

### §3.2 S-1: 通常稼働 baseline（06:00-06:10、10min）

| 要素 | 内容 | 結果 |
|---|---|---|
| Pre-condition | (a) 環境準備 GO、(b) `monitor = createTosMonitor()` 起動済、(c) `recorder-s1` 生成 | `[PASS / FAIL]` |
| Trigger | 70 RPS 5min baseline 注入 | `[時刻]` |
| Expected | breach=false / 300 件 token entry / Slack 0 件 / circuit-breaker open 0 件 | `[PASS / FAIL]` |
| Pass criteria | O-baseline-1: breach=0 / O-baseline-2: token 300 / O-baseline-3: Slack 0 | `[NN / NN / NN]` |
| Rollback | monitor.reset() | `[PASS / FAIL]` |

### §3.3 S-2: kill-switch（06:10-06:20、10min）

| 要素 | 内容 | 結果 |
|---|---|---|
| Pre-condition | S-1 PASS + circuit-breaker 5 系統 closed | `[PASS / FAIL]` |
| Trigger | 401/403 5 連続 + circuit-breaker 5 系統並列 forceOpen | `[時刻]` |
| Expected | unauthorized_chain_detected event / kill-switch.trigger() / 5,000ms 内 kill / Slack [CRITICAL] post | `[PASS / FAIL]` |
| Pass criteria | **O-1**: kill-switch elapsed `[TODO ms]` ≤ 5,000ms / **O-2**: 5 系統同期 `[TODO ms]` ≤ 500ms | `[NNms / NNms]` |
| Rollback | kill-switch.disarm() + 5 系統 forceClose() + monitor.reset() | `[PASS / FAIL]` |

### §3.4 S-3: cost cap（06:20-06:30、10min）

| 要素 | 内容 | 結果 |
|---|---|---|
| Pre-condition | S-2 PASS + rollback 完遂 + currentUsd === 0 | `[PASS / FAIL]` |
| Trigger | declareLegitSpikeWindow(3600000, 2) + $35 spend | `[時刻]` |
| Expected | breach=false / suppressedByLegitSpike=true / suppressedByLegitSpikeCount += 1 / Owner Slack quick-action mock | `[PASS / FAIL]` |
| Pass criteria | **O-7**: --cost-cap-extended flag + 1h 一時無効化 + 30min SLA | `[PASS / FAIL]` |
| Rollback | costTracker.reset() + monitor.disableLegitSpikeWindow() | `[PASS / FAIL]` |

### §3.5 S-4: rate spike × boundary（06:30-06:40、10min）

| 要素 | 内容 | 結果 |
|---|---|---|
| Pre-condition | S-3 PASS + baselineMinTokens 10 設定 | `[PASS / FAIL]` |
| Trigger | baseline 70 RPS 5min + 瞬間 5 RPS 1sec + baseline=8 + z-score 2σ filter 動作 | `[時刻]` |
| Expected | 1 サイクル目 strip + suppressedByZScore=true + suppressedZScoreCount += 1 | `[PASS / FAIL]` |
| Pass criteria | **O-8**: debounce 60s 動作 + 月次偽陽性率 < 1% | `[計測値: NN%]` |
| Rollback | monitor.reset() | `[PASS / FAIL]` |

### §3.6 S-5: heartbeat gap（06:40-06:50、10min）

| 要素 | 内容 | 結果 |
|---|---|---|
| Pre-condition | S-4 PASS + monitor.markBoot() 実行済 | `[PASS / FAIL]` |
| Trigger | Vitest fake timer 11h59min59sec advance + heartbeat 12 回 + OS suspend mock 12h | `[時刻]` |
| Expected | accumulatedSleepMs += 12h / wallElapsed - accumulatedSleepMs < 12h / breach=false / heartbeat 12 件記録 | `[PASS / FAIL]` |
| Pass criteria | **O-6**: tolerance 60s 動作 + 月次偽陽性率 < 1% | `[計測値: NN%]` |
| Rollback | monitor.reset() | `[PASS / FAIL]` |

### §3.7 06:50 中間報告

| 担当 | 動作 | 完遂 |
|---|---|---|
| R-5 | Slack #clawbridge-alerts に S-1〜S-5 中間報告 | `[時刻]` |
| R-5 | Owner Slack DM 同時投稿 | `[時刻]` |
| R-1 | 後半 4 シナリオ進行確認 | `[PASS / FAIL]` |

### §3.8 S-6: clock skew（06:50-07:00、10min）

| 要素 | 内容 | 結果 |
|---|---|---|
| Pre-condition | S-5 PASS + monotonic clock spy ON | `[PASS / FAIL]` |
| Trigger | clock.advance(60000) + clock.skew(-30000) + heartbeat | `[時刻]` |
| Expected | clock_skew_detected event / heartbeat 再同期 / accumulatedSleepMs 整合性 / monotonic clock 独立 | `[PASS / FAIL]` |
| Pass criteria | **O-skew-1**: skew 検出 + 再同期 ≤ 1,000ms / **O-skew-2**: accumulatedSleepMs 誤計上 0ms | `[NNms / NNms]` |
| Rollback | clock.reset() + monitor.reset() | `[PASS / FAIL]` |

### §3.9 S-7: multi-process（07:00-07:10、10min）

| 要素 | 内容 | 結果 |
|---|---|---|
| Pre-condition | S-6 PASS + Sumi (PRJ-018) + Asagi (PRJ-008) 稼働確認 | `[PASS / FAIL]` |
| Trigger | Sumi normal task + Asagi normal task + Open Claw に 401/403 5 連続注入 | `[時刻]` |
| Expected | Open Claw kill ≤ 5,000ms / Sumi quota 0 / Asagi quota 0 / 通常 ch 混入 0 件 | `[PASS / FAIL]` |
| Pass criteria | **O-10**: Sumi quota 消費 `[TODO]` / **O-11**: Asagi quota 消費 `[TODO]` / **O-12**: 通常 ch 混入 `[TODO]` | `[NN / NN / NN]` |
| Rollback | Open Claw kill-switch disarm + Sumi/Asagi 通常運用継続 | `[PASS / FAIL]` |

**最重要**: S-7 で Sumi/Asagi quota 1+ 消費検出時 → §8 abort criteria #3 即時適用、drill #2 中止。

### §3.10 S-8: Slack quick-action（07:10-07:20、10min）

| 要素 | 内容 | 結果 |
|---|---|---|
| Pre-condition | S-7 PASS + Slack workspace #drill-exec 利用可 | `[PASS / FAIL]` |
| Trigger | declareLegitSpikeWindow(300000, 2) + Slack quick-action button mock + 30min SLA 計測 + Owner mock 応答 | `[時刻]` |
| Expected | Owner 応答 timestamp / manualOverrideAcknowledged=true / 30min SLA 内 / audit log full trace | `[PASS / FAIL]` |
| Pass criteria | **O-9**: button 受理 + Owner 30min SLA 内 + audit log 記録 | `[応答時間 NN s]` |
| Rollback | monitor.disableLegitSpikeWindow() + Slack post 削除 | `[PASS / FAIL]` |

### §3.11 S-9: audit log（07:20-07:30、10min）

| 要素 | 内容 | 結果 |
|---|---|---|
| Pre-condition | S-8 PASS + auditStore 初期化 | `[PASS / FAIL]` |
| Trigger | auditStore.replay() + verifyHashChain() + 3 reset 連続実行 + canResume 確認 | `[時刻]` |
| Expected | chain_valid=true / brokenAt=null / currentUsd === 0 / replay 整合性 100% (SHA-256 一致) | `[PASS / FAIL]` |
| Pass criteria | **O-5**: chain_valid=true + 3 reset すべて成功 + canResume=true | `[PASS / FAIL]` |
| Rollback | audit log read-only / reset 後の状態維持 | `[PASS / FAIL]` |

### §3.12 in-flight 45 セル集計欄

| シナリオ | Pre | Trigger | Expected | Pass criteria | Rollback | 5/5 集計 |
|---|---|---|---|---|---|---|
| S-1 | `[P/F]` | `[P/F]` | `[P/F]` | `[P/F]` | `[P/F]` | `NN/5` |
| S-2 | `[P/F]` | `[P/F]` | `[P/F]` | `[P/F]` | `[P/F]` | `NN/5` |
| S-3 | `[P/F]` | `[P/F]` | `[P/F]` | `[P/F]` | `[P/F]` | `NN/5` |
| S-4 | `[P/F]` | `[P/F]` | `[P/F]` | `[P/F]` | `[P/F]` | `NN/5` |
| S-5 | `[P/F]` | `[P/F]` | `[P/F]` | `[P/F]` | `[P/F]` | `NN/5` |
| S-6 | `[P/F]` | `[P/F]` | `[P/F]` | `[P/F]` | `[P/F]` | `NN/5` |
| S-7 | `[P/F]` | `[P/F]` | `[P/F]` | `[P/F]` | `[P/F]` | `NN/5` |
| S-8 | `[P/F]` | `[P/F]` | `[P/F]` | `[P/F]` | `[P/F]` | `NN/5` |
| S-9 | `[P/F]` | `[P/F]` | `[P/F]` | `[P/F]` | `[P/F]` | `NN/5` |
| **合計**| | | | | | **`NN/45`**|

---

## §4 post-flight 記入欄（audit log grep + Sumi/Asagi cross check + cleanup）

### §4.1 audit log grep（07:30-07:38、8min）

#### §4.1.1 9 シナリオ event 件数集計

```bash
grep -E "kind: '(unauthorized|cost_cap|rate_spike|continuous_run|clock_skew)_'" audit.log
```

| シナリオ | 期待 event 件数 | 実際件数 | 結果 |
|---|---|---|---|
| S-1 baseline | 0 | `[TODO]` | `[PASS / FAIL]` |
| S-2 unauthorized_chain_detected | 1 | `[TODO]` | `[PASS / FAIL]` |
| S-3 cost_cap | 1 | `[TODO]` | `[PASS / FAIL]` |
| S-4 rate_spike | 0（suppress 動作）| `[TODO]` | `[PASS / FAIL]` |
| S-5 continuous_run | 0（heartbeat 整合）| `[TODO]` | `[PASS / FAIL]` |
| S-6 clock_skew_detected | 1 | `[TODO]` | `[PASS / FAIL]` |
| S-7 unauthorized_chain_detected (再発火) | 1 | `[TODO]` | `[PASS / FAIL]` |
| S-8 manual_override_received | 1 | `[TODO]` | `[PASS / FAIL]` |
| S-9 audit_chain_verified | 1 | `[TODO]` | `[PASS / FAIL]` |
| **合計**| **6 期待**| `[NN]` | `[PASS / FAIL]` |

#### §4.1.2 hash chain 整合性確認

```bash
grep "chain_valid" audit.log | tail -1
```

| 項目 | 期待 | 結果 |
|---|---|---|
| chain_valid | true | `[true / false]` |
| brokenAt | null | `[null / NN]` |
| 90 日保持 TTL trigger | 設定済 | `[PASS / FAIL]` |

### §4.2 Sumi/Asagi cross check（07:45-07:55、10min）

#### §4.2.1 Sumi (PRJ-018) cross check

```bash
claude-bridge --workspace=PRJ-018 --status
```

| 項目 | 期待 | 結果 |
|---|---|---|
| OAuth quota 消費 | 0 | `[NN]` |
| heartbeat 5min 以内 | 確認 | `[PASS / FAIL]` |
| Slack #sumi-ops 混入 | 0 件 | `[NN]` |

#### §4.2.2 Asagi (PRJ-008) cross check

```bash
codex --workspace=PRJ-008 --status
```

| 項目 | 期待 | 結果 |
|---|---|---|
| OpenAI API quota 消費 | 0 | `[NN]` |
| heartbeat 5min 以内 | 確認 | `[PASS / FAIL]` |
| Slack #asagi-ops 混入 | 0 件 | `[NN]` |

### §4.3 cleanup（07:55-08:00、5min）

| 項目 | 動作 | 結果 |
|---|---|---|
| 9 fixture JSON 保存 | `tasks/round12/drill2/fixture-drill2-sN-*.json` 9 件 | `[PASS / FAIL]` |
| summary-drill2-12-axes.json 生成 | 12 軸 + 9 シナリオ + 議決-26 採択推奨度判定文 | `[PASS / FAIL]` |
| Slack `#clawbridge-alerts` 完遂宣言 | post 確認 | `[PASS / FAIL]` |
| Owner Slack DM 速報 | post 確認 | `[PASS / FAIL]` |
| timeline ISO8601 終了時刻記録 | 08:00 ± 5min | `[ISO8601]` |

---

## §5 12 軸 PASS criteria 集計表

### §5.1 12 軸集計欄

| 軸 ID | 軸名 | 優先度 | 期待 PASS 基準 | 結果 |
|---|---|---|---|---|
| O-1 | kill-switch elapsed | **Critical** | ≤ 5,000ms | `[NNms]` `[PASS / FAIL]` |
| O-2 | circuit-breaker 5 系統同期 | **Critical** | ≤ 500ms | `[NNms]` `[PASS / FAIL]` |
| O-3 | (Round 11 Review-C 軸-3) | **Critical** | (該当時記入)| `[PASS / FAIL]` |
| O-4 | (該当軸記入)| High | (該当時記入)| `[PASS / FAIL]` |
| O-5 | audit chain valid | **Critical** | chain_valid=true + canResume=true | `[PASS / FAIL]` |
| O-6 | heartbeat tolerance 60s | High | 月次偽陽性率 < 1% | `[NN%]` `[PASS / FAIL]` |
| O-7 | --cost-cap-extended flag | High | 1h 一時無効化 + Owner 30min SLA | `[PASS / FAIL]` |
| O-8 | rate spike debounce 60s | High | 1 サイクル strip + 月次偽陽性率 < 1% | `[NN%]` `[PASS / FAIL]` |
| O-9 | Slack quick-action 30min SLA | High | button 受理 + audit log 記録 | `[PASS / FAIL]` |
| O-10 | Sumi quota 0 消費 | **Critical** | 0 | `[NN]` `[PASS / FAIL]` |
| O-11 | Asagi quota 0 消費 | **Critical** | 0 | `[NN]` `[PASS / FAIL]` |
| O-12 | 通常 ch 混入 0 件 | Medium | 0 | `[NN]` `[PASS / FAIL]` |
| **合計**| — | — | **12/12 Full Pass**| **`NN/12`**|

### §5.2 優先度別集計

| 優先度 | 軸数 | PASS 数 | 達成率 |
|---|---|---|---|
| Critical | 5 (O-1/-2/-5/-10/-11) | `[NN]` | `[NN%]` |
| High | 4 (O-6/-7/-8/-9) | `[NN]` | `[NN%]` |
| Medium | 1 (O-12) | `[NN]` | `[NN%]` |
| **合計**| **10**（O-3/O-4 該当時 12）| `[NN]` | `[NN%]` |

---

## §6 議決-26 採択推奨度判定文（4 段階）

### §6.1 判定基準（Round 12 ランブック §7.5 踏襲）

| 達成数 | 採択推奨度 | Owner sign-off 期待 |
|---|---|---|
| **12/12 Full Pass** | **極めて強い推奨で無条件採択** | 即時 sign-off |
| **11/12 Partial Pass**（Critical 5 軸全 PASS）| 強い推奨で Conditional 採択 | Phase 1 W4 完遂を condition |
| **10/12 Partial Pass**（Critical 5 軸全 PASS）| 強い推奨で Conditional 採択 | 同上 |
| **9/12 Conditional Pass**（Critical 5 軸全 PASS）| 推奨で Conditional 採択 | 5/12 復帰検討 + Conditional sign-off |
| **< 9/12 Fail** | 採択非推奨 | 5/12 復帰 + 議決-26 再評価 |

### §6.2 判定文記入欄（template）

```
[drill #2 5/8 朝（or 5/7 朝前倒し case）実機検証 result v1]

実施日時: [TODO 記入] (ISO8601 範囲: [開始]〜[終了])
所要: [NN] min（130 min 計画 vs [NN] 実績）

12 軸 PASS criteria 達成数: [NN]/12 ([STATUS])
- Critical 5 軸 (#1/#2/#5/#10/#11): [NN]/5 PASS
- High 4 軸 (#6/#7/#8/#9): [NN]/4 PASS
- Medium 1 軸 (#12): [NN]/1 PASS

9 シナリオ 5 要素達成数: [NN]/45
- pre-flight 9 項目: [NN]/9
- in-flight 45 セル: [NN]/45
- post-flight cleanup: [NN]/N

5/8 議決-26 採択推奨度判定: [RECOMMENDATION]
Owner sign-off 期待: [EXPECTATION]
artifact: tasks/round12/drill2/ 配下 9 fixture JSON + summary-drill2-12-axes.json

abort criteria 発火: [なし / #1 環境準備不通過 / #2 Critical FAIL / #3 Sumi/Asagi 巻き添え]
特記事項: [TODO 記入]
```

### §6.3 4 段階判定の自動推論ロジック

```python
def determine_recommendation(pass_count, critical_pass_count):
    if pass_count == 12:
        return "極めて強い推奨で無条件採択"
    elif pass_count >= 10 and critical_pass_count == 5:
        return "強い推奨で Conditional 採択"
    elif pass_count == 9 and critical_pass_count == 5:
        return "推奨で Conditional 採択"
    else:
        return "採択非推奨、5/12 復帰 + 議決-26 再評価"
```

---

## §7 9 fixture JSON 自動生成 SOP

### §7.1 Dev-C runner wet-run mode で自動生成

```bash
cd app/harness && pnpm test --run drill-2-pre-execution-dry-run --reporter=verbose -- --wet-run --record-fixtures=tasks/round12/drill2/
```

期待出力: `tasks/round12/drill2/fixture-drill2-sN-*.json` 9 件自動生成。

### §7.2 fixture JSON 構造（テンプレ）

```json
{
  "scenarioId": "S-1",
  "scenarioName": "通常稼働 baseline",
  "executionTimestamp": "[ISO8601]",
  "preCondition": {
    "satisfied": true,
    "details": "[TODO 記入]"
  },
  "trigger": {
    "command": "[TODO 記入]",
    "timestamp": "[ISO8601]"
  },
  "expected": {
    "events": ["[TODO 記入]"],
    "values": {
      "breach": false,
      "tokenCount": 300,
      "slackPostCount": 0
    }
  },
  "actual": {
    "events": ["[TODO 記入]"],
    "values": {
      "breach": "[TODO]",
      "tokenCount": "[TODO]",
      "slackPostCount": "[TODO]"
    }
  },
  "passCriteria": {
    "O_baseline_1": "[true / false]",
    "O_baseline_2": "[true / false]",
    "O_baseline_3": "[true / false]"
  },
  "rollback": {
    "completed": "[true / false]",
    "details": "[TODO 記入]"
  }
}
```

### §7.3 summary-drill2-12-axes.json 構造（テンプレ）

```json
{
  "drillId": "drill-2",
  "executionDate": "[TODO 記入]",
  "executionTimeRange": {
    "start": "[ISO8601]",
    "end": "[ISO8601]"
  },
  "totalScenarios": 9,
  "totalCells": 45,
  "passCount": "[TODO]",
  "axes": {
    "O-1": { "value": "[NNms]", "passed": "[true / false]", "priority": "Critical" },
    "O-2": { "value": "[NNms]", "passed": "[true / false]", "priority": "Critical" },
    "O-5": { "value": "true", "passed": "[true / false]", "priority": "Critical" },
    "O-6": { "value": "[NN%]", "passed": "[true / false]", "priority": "High" },
    "O-7": { "value": "[true / false]", "passed": "[true / false]", "priority": "High" },
    "O-8": { "value": "[NN%]", "passed": "[true / false]", "priority": "High" },
    "O-9": { "value": "[NNs]", "passed": "[true / false]", "priority": "High" },
    "O-10": { "value": 0, "passed": "[true / false]", "priority": "Critical" },
    "O-11": { "value": 0, "passed": "[true / false]", "priority": "Critical" },
    "O-12": { "value": 0, "passed": "[true / false]", "priority": "Medium" }
  },
  "scenarios": {
    "S-1": { "passed5of5": "[NN]/5", "passCriteriaResult": "[PASS / FAIL]" },
    "S-2": { "passed5of5": "[NN]/5", "passCriteriaResult": "[PASS / FAIL]" },
    "S-3": { "passed5of5": "[NN]/5", "passCriteriaResult": "[PASS / FAIL]" },
    "S-4": { "passed5of5": "[NN]/5", "passCriteriaResult": "[PASS / FAIL]" },
    "S-5": { "passed5of5": "[NN]/5", "passCriteriaResult": "[PASS / FAIL]" },
    "S-6": { "passed5of5": "[NN]/5", "passCriteriaResult": "[PASS / FAIL]" },
    "S-7": { "passed5of5": "[NN]/5", "passCriteriaResult": "[PASS / FAIL]" },
    "S-8": { "passed5of5": "[NN]/5", "passCriteriaResult": "[PASS / FAIL]" },
    "S-9": { "passed5of5": "[NN]/5", "passCriteriaResult": "[PASS / FAIL]" }
  },
  "abortCriteriaTriggered": "[none / #1 / #2 / #3]",
  "recommendationLevel": "[極めて強い推奨で無条件採択 / 強い推奨で Conditional 採択 / 推奨で Conditional 採択 / 採択非推奨]",
  "ownerSignOffExpectation": "[即時 sign-off / Phase 1 W4 完遂 condition / 5/12 復帰検討 / 5/12 復帰再評価]"
}
```

---

## §8 Review 部門 sign-off + 記入完了確認チェック

### §8.1 当日 operator 完了確認チェック

| 段階 | 完遂 | 確認者 | 確認時刻 |
|---|---|---|---|
| pre-flight 9 項目 + Dev-C dry-run | `[PASS / FAIL]` | R-2 | `[ISO8601]` |
| in-flight 9 シナリオ × 5 要素 = 45 セル | `[NN/45]` | R-1 + R-2 | `[ISO8601]` |
| post-flight audit log grep | `[PASS / FAIL]` | R-2 | `[ISO8601]` |
| Sumi/Asagi cross check | `[PASS / FAIL]` | R-4 | `[ISO8601]` |
| cleanup + 9 fixture JSON 保存 | `[PASS / FAIL]` | R-2 + R-4 | `[ISO8601]` |
| 12 軸集計表記入完遂 | `[NN/12 PASS]` | R-1 | `[ISO8601]` |
| 議決-26 採択推奨度判定文記入 | `[判定文]` | R-1 | `[ISO8601]` |
| Slack #clawbridge-alerts + Owner Slack DM 速報投稿 | `[PASS / FAIL]` | R-5 | `[ISO8601]` |

### §8.2 Review 部門 sign-off

| 観点 | sign-off |
|---|---|
| pre-flight 9 項目記入欄 | sign-off |
| in-flight 45 セル記入欄（9 シナリオ × 5 要素）| sign-off |
| post-flight audit log grep + Sumi/Asagi cross check + cleanup 記入欄 | sign-off |
| 12 軸 PASS criteria 集計表 | sign-off |
| 議決-26 採択推奨度判定文（4 段階）| sign-off |
| 9 fixture JSON + summary JSON 自動生成 SOP | sign-off |
| 当日 operator 完了確認チェック | sign-off |

### §8.3 関連 DEC / 連動レポート

- **DEC-019-019**: drill #1 シナリオ承認 — 本テンプレ 9 シナリオの S-2/-3/-4 起源
- **DEC-019-052**: 案 C ハイブリッド暫定運用 — drill #2 で subscription + API fallback 両モード検証根拠
- **DEC-019-055**: Round 8 完遂 — drill #2 5/8 朝 base 設定の起源
- **DEC-019-056**: Round 9/10 前倒し — drill #2 instrumentation 4 export 着地の起源
- **DEC-019-057**: Round 11 4 部署並列前倒し — Dev-A/B/C/D 4 部署寄与で 45 セル全 true 完備の起源

---

**v1.0 起案**: 2026-05-04 W0-Week1 深夜 Review 部門 R13 Review-E / 案 C ハイブリッド暫定運用前提 / Owner formal「最速で進めよ」directive 継続中
**正式採択**: 2026-05-08 朝（or 5/7 朝前倒し case）drill #2 完遂直後の operator 記入後
**v1.0 確定差分**: pre-flight 9 項目 + in-flight 45 セル（9×5）+ post-flight audit log grep + Sumi/Asagi cross check + 12 軸集計表 + 議決-26 採択推奨度判定文 4 段階 + 9 fixture JSON + summary JSON 自動生成 SOP
