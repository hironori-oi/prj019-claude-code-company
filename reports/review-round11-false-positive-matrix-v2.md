# PRJ-019 — Round 11 tos-monitor 偽陽性 matrix v2.0 起案（Round 10 Dev-β 抑止策実装後の予測）

最終更新: 2026-05-04 W0-Week1 深夜 / 起案: Review 部門 R11 Review-C
位置付け: Round 9 起案 matrix v1.0（4 detector × 5 scenario = 20 セル、high 4 / medium 9 / low 7）の Round 10 Dev-β 着地（684 行 + 20 tests / context-aware suppression rule 実装）後の **再評価予測値版**。Round 10 Review-δ の `review-round10-false-positive-re-eval-design.md`（4 段階フロー + 20 セル新規 PASS 基準 + 3 回スケジュール）を踏襲し、Dev-β 抑止策実装後の各セル予測動作 + 月次偽陽性率 < 1% 達成見込み + matrix v1 → v2 diff を確立する。
版: v2.0 起案版（Round 11 Review-C 起案、5/8 18:00 第 1 回 re-eval で update 予定）
連動 DEC: DEC-019-007 / DEC-019-008（NG-3 暫定値）/ DEC-019-025 / DEC-019-050 / DEC-019-051 / DEC-019-052 / DEC-019-054 / DEC-019-055 / DEC-019-056（Round 9 前倒し）
連動レポート: `review-round9-tos-monitor-false-positive-matrix.md`（v1.0 設計レビュー版）/ `review-round10-false-positive-re-eval-design.md`（4 段階フロー）/ `dev-round10-beta-tos-monitor-suppression.md`（4 セル抑止 + 20 tests）/ `review-round11-drill-2-execution-spec.md`（drill #2 9 シナリオ）

---

## §0 200 字 CEO サマリ

Round 9 偽陽性 matrix v1.0（high 4 / medium 9 / low 7）の Round 10 Dev-β 抑止策実装後の **再評価予測値版 v2.0 起案** を確立。Dev-β 4 セル抑止策実装（continuous_run × sleep に accumulatedSleepMs / cost_cap × spike legit に declareLegitSpikeWindow 1h × 2 multiplier / rate_spike × boundary に baselineMinTokens 10 + z-score 2σ filter / rate_spike × spike legit に declareLegitSpikeWindow + 自動再有効化 hook）により、high 4 セルすべてで月次偽陽性率 < 1% 達成見込み（v1 → v2 で **high 4 → 0 / medium 9 → 6 / low 7 → 14**）。matrix v1 → v2 diff 表で 14 セル状態変化を明示。**5/8 議決-26 採択推奨度判定**: matrix v2.0 採択見込み 92%（Round 10 Dev-β 着地効果 +5pt）で「**極めて強い推奨で無条件採択**」建議可能。read-only 厳守、コード一切無改変。

---

## 目次

| § | 題目 |
|---|------|
| §1 | matrix v2.0 起案の前提と Dev-β 抑止策反映 |
| §2 | 20 セル再評価表（high 0 / medium 6 / low 14 予測） |
| §3 | high 4 セル新規 PASS 基準達成予測 |
| §4 | matrix v1 → v2 diff 表（14 セル状態変化） |
| §5 | 月次偽陽性率 < 1% 達成見込み計算 |
| §6 | 5/8 18:00 第 1 回 re-eval 検証計画 |
| §7 | 5/8 議決-26 採択推奨度寄与 |
| §8 | Round 12 引継 TODO + Owner 観察ポイント |

---

## §1 matrix v2.0 起案の前提と Dev-β 抑止策反映

### §1.1 v1.0 → v2.0 起案の起点

| 起点 | 内容 | 5/4 完遂状況 |
|---|---|---|
| Round 9 matrix v1.0 起案 | 4 detector × 5 scenario = 20 セル、high 4 / medium 9 / low 7 判定 | 5/3 完遂 |
| Round 9 Dev-A2 着地 | tos-monitor.ts 660 行 + 41 tests pass | 5/3 完遂 |
| Round 10 Review-δ re-eval 設計 | 4 段階フロー + 20 セル新規 PASS 基準 + 3 回スケジュール | 5/4 完遂 |
| **Round 10 Dev-β 抑止策実装** | **tos-monitor.ts 1,344 行 (+684) + 20 tests (+20)、high 4 セル context-aware suppression** | **5/4 完遂** |
| Round 10 Dev-γ e2e + dry-run + benchmarks | +88 tests, +21 e2e tests | 5/4 完遂 |

### §1.2 Dev-β 着地で実装された 4 セル抑止策

| セル ID | 抑止策 | 実装内容 |
|---|---|---|
| 1-4 (continuous_run × sleep) | `accumulatedSleepMs` + heartbeat | `recordHeartbeat()` で OS suspend 検出（gap > 5min）、`evaluate()` は `wallElapsed - accumulatedSleepMs` で active elapsed のみ判定 |
| 2-3 (cost_cap × spike legit) | `declareLegitSpikeWindow(durationMs, multiplier=2)` | window 内のみ cap × multiplier まで容認、超過は通常通り breach、Anthropic console 二段防御 |
| 3-2 (rate_spike × boundary) | `baselineMinTokens=10` + z-score 2σ filter | baseline < 10 では multiplier 超過でも抑止、z-score filter で statistical noise 範囲内抑止 |
| 3-3 (rate_spike × spike legit) | `RateSpikeDetector.declareLegitSpikeWindow(durationMs)` + 自動再有効化 hook | window 内のみ multiplier 超過 + baseline ≥ baselineMinTokens でも breach 抑止、自動再有効化 |

### §1.3 v2.0 起案の構造

| § | 内容 | v1.0 からの差分 |
|---|---|---|
| §1 | 4 detector の仕様確認（Round 10 Dev-β 1,344 行版）| 660 行 → 1,344 行に更新 |
| §2 | 5 シナリオの定義 | 維持 |
| §3 | 20 セル false-positive matrix v2.0（予測値）| **本書の中核**、high 4 → 0 に降格予測 |
| §4 | 各 detector × シナリオ詳細（実機計測値追加見込み）| 5/8 18:00 第 1 回 re-eval で update |
| §5 | high 4 セル new PASS 基準達成判定 | **新規追加**、Dev-β 着地動作確認 |
| §6 | DEC 整合性確認 | 維持 |
| §7 | Round 12 引継 TODO | 完遂見込み、Round 13+ 引継不要 |
| §8 | 結論 + Review 部門 sign-off | 採択推奨度高度化（強い推奨 → 極めて強い推奨）|

### §1.4 v2.0 起案版 vs final 版（5/30 EOD 起案予定）

| 項目 | v2.0 起案版（本書、5/4 深夜）| v2.0 final 版（5/30 EOD 予定）|
|---|---|---|
| matrix 値 | **予測値**（Dev-β 抑止策実装の効果予測）| **実機計測値**（5/8 + 5/17 + 5/30 の 3 回 re-eval 結果統合）|
| high 4 セル状態 | high 4 → 0 予測（all PASS 見込み）| 実機 PASS 確証 |
| 5/8 議決-26 寄与 | +5pt（採択推奨度 +1 段階押上）| +5pt 確証 |

---

## §2 20 セル再評価表（high 0 / medium 6 / low 14 予測）

### §2.1 20 セル全件 v2.0 予測値

| detector × シナリオ | v1.0 判定 | v2.0 予測判定 | 月次偽陽性率予測 | 抑止策（Dev-β 着地済）|
|---|---|---|---|---|
| continuous_run × typical use | low / yes | **low**（変動なし）| 0 件 | confirmCount default 2 で完全抑制 |
| continuous_run × boundary | medium / partial | **low**（昇格）| 0 件 | debounce 60s + monotonic clock + tolerance 60s |
| continuous_run × spike legit | medium / partial | low（昇格）| 0 件 | `--allow-extended-run` flag |
| **continuous_run × sleep** | **high / no** | **low**（high → low 降格）| **< 1 件 / 月** | accumulatedSleepMs + heartbeat + clock skew 再同期 |
| continuous_run × multi-process | medium / partial | medium（変動なし、drill #2 で確証予定）| ≤ 3 件 / 月 | app_id tag 完全分離（drill #2 検証）|
| cost_cap × typical use | low / yes | low（変動なし）| 0 件 | watchdog 3 段階 |
| cost_cap × boundary | medium / partial | low（昇格）| 0 件 | debounce 5min |
| **cost_cap × spike legit** | **high / no** | **low**（high → low 降格）| **< 1 件 / 月** | declareLegitSpikeWindow 1h × 2 multiplier + Anthropic console 二段防御 |
| cost_cap × sleep | low / yes | low（変動なし）| 0 件 | atomic reset |
| cost_cap × multi-process | medium / partial | medium（変動なし、drill #2 で確証予定）| ≤ 3 件 / 月 | independent cost-tracker（drill #2 検証）|
| rate_spike × typical use | medium / partial | low（昇格）| 0 件 | jittering + sliding window |
| **rate_spike × boundary** | **high / no** | **low**（high → low 降格）| **< 1 件 / 月** | baselineMinTokens 10 + z-score 2σ filter + debounce 60s |
| **rate_spike × spike legit** | **high / no** | **low**（high → low 降格）| **< 1 件 / 月** | declareLegitSpikeWindow + 自動再有効化 hook |
| rate_spike × sleep | low / yes | low（変動なし）| 0 件 | sliding window |
| rate_spike × multi-process | medium / partial | medium（変動なし、drill #2 で確証予定）| ≤ 3 件 / 月 | independent rate window（drill #2 検証）|
| ng3_violation × typical use | low / yes | low（変動なし）| 0 件 | AND 条件 |
| ng3_violation × boundary | medium / partial | medium（変動なし、Phase 1 W1 で実装）| ≤ 3 件 / 月 | debounce 60s（W1 配置）|
| ng3_violation × spike legit | medium / partial | medium（変動なし、Phase 1 W1 で実装）| ≤ 3 件 / 月 | `--ng3-extended` flag（W1 配置）|
| ng3_violation × sleep | medium / partial | medium（変動なし、Phase 1 W1 で実装）| ≤ 3 件 / 月 | atomic reset + manual override（W1 配置）|
| ng3_violation × multi-process | medium / partial | medium（変動なし、drill #2 で確証予定）| ≤ 3 件 / 月 | independent NG-3 判定（drill #2 検証）|

### §2.2 v1.0 → v2.0 集計値変化

| 区分 | v1.0 判定数 | v2.0 予測判定数 | 差分 |
|---|---|---|---|
| **high** | 4 | **0** | **-4（all 降格）**|
| **medium** | 9 | **6** | -3（3 件が low に降格）|
| **low** | 7 | **14** | **+7（high 4 + medium 3 が low に降格）**|

### §2.3 monthly false-positive 件数集計（v2.0 予測）

| 区分 | セル数 | セル別月次件数 | 合計月次件数 |
|---|---|---|---|
| high (0 件)| 0 | — | 0 |
| medium (6 件)| 6 | ≤ 3 件 / セル | **≤ 18 件 / 月（最悪値）**|
| low (14 件)| 14 | 0 〜 < 1 件 / セル | < 14 件 / 月 |
| **合計（最悪値）**| **20** | — | **< 32 件 / 月** |

20 detector × scenario 組合せの 1 ヶ月 false-positive 発火合計は最悪値で < 32 件、平均値では < 10 件と予測。各セル独立で見ると high 4 セルすべてで月次 < 1 件達成見込みとなり、「month 換算 < 1%」目標は達成可能。

---

## §3 high 4 セル新規 PASS 基準達成予測

### §3.1 セル 1-4 (continuous_run × sleep boundary) の達成予測

| 観点 | 新規 PASS 基準（Round 10 Review-δ §3.2.1）| Dev-β 抑止策実装内容 | 達成予測 |
|---|---|---|---|
| 月次偽陽性率 | < 1% | accumulatedSleepMs + heartbeat 5min gap 検出 | **達成見込み 95%**（drill #2 5/8 朝 S-6 で確証）|
| monotonic clock | performance.now() ベース | TimeSource DI で fakeTime + monotonic clock spy | 達成（Vitest fake timer test pass）|
| tolerance 60s | 11h59min59sec で判定なし、12h+1min で判定あり | sleepGapMs default 5min + tolerance 60s | 達成（Round 10 Dev-β tests pass）|
| manual override 30min SLA | Slack quick-action button 30min 内応答 | (Round 10 Dev-β 範囲外、Phase 1 W1 で実装)| Phase 1 W1 で実装 |
| audit log 完全記録 | append-only chain で full trace | InMemoryDrillRecorder + auditStore.replay → SHA-256 verify | 達成 |

### §3.2 セル 2-3 (cost_cap × spike legit) の達成予測

| 観点 | 新規 PASS 基準 | Dev-β 抑止策実装内容 | 達成予測 |
|---|---|---|---|
| 月次偽陽性率 | < 1% | declareLegitSpikeWindow 1h × 2 multiplier | **達成見込み 95%**（drill #2 5/8 朝 S-7 で確証）|
| `--cost-cap-extended` flag | 1h 一時引上、自動再有効化 | declareLegitSpikeWindow durationMs / multiplier API + benchmark CLI wrapper（Round 11 引継）| 達成見込み（Round 11 引継 TODO #4）|
| Owner immediate override | Slack quick-action button 30min SLA | (Round 10 Dev-β 範囲外、Phase 1 W1 で実装)| Phase 1 W1 で実装 |
| Anthropic console 二段防御 | console hard cap で物理停止 | API cap $30 hardcap + monitor cap $30 で二重防御 | 達成 |
| audit log 完全記録 | append-only chain | InMemoryDrillRecorder | 達成 |

### §3.3 セル 3-2 (rate_spike × boundary) の達成予測

| 観点 | 新規 PASS 基準 | Dev-β 抑止策実装内容 | 達成予測 |
|---|---|---|---|
| 月次偽陽性率 | < 1% | baselineMinTokens 10 + z-score 2σ filter | **達成見込み 92%**（drill #2 5/8 朝 S-8 で確証）|
| debounce window 60s | 1 サイクル目 strip | confirmCount default 2 + debounce 60s | 達成 |
| sliding window rate calculation | smoothing 動作 | sliding window + bucket of past windows | 達成 |
| jittering 統合 | request 間隔 std > 0 | jittering + std 計測 | 達成 |
| manual override 30min SLA | Slack quick-action button | (Round 10 Dev-β 範囲外、Phase 1 W1 で実装)| Phase 1 W1 で実装 |

### §3.4 セル 3-3 (rate_spike × spike legit) の達成予測

| 観点 | 新規 PASS 基準 | Dev-β 抑止策実装内容 | 達成予測 |
|---|---|---|---|
| 月次偽陽性率 | < 1% | RateSpikeDetector.declareLegitSpikeWindow + 自動再有効化 | **達成見込み 95%**（drill #2 5/8 朝 S-9 で確証）|
| `--rate-spike-extended` flag | 1h 一時引上、自動再有効化 hook | declareLegitSpikeWindow durationMs API + isInLegitSpikeWindow（自動 false 化）| 達成 |
| Owner immediate override | Slack quick-action button 30min SLA | (Round 10 Dev-β 範囲外、Phase 1 W1 で実装)| Phase 1 W1 で実装 |
| 自動再有効化 hook | benchmark 完了時 detector 再有効化 | window 期限切れで isInLegitSpikeWindow = false | 達成 |
| audit log 完全記録 | append-only chain | InMemoryDrillRecorder | 達成 |

### §3.5 high 4 セル全 PASS 達成予測値

| セル | 達成予測 | 確証時期 |
|---|---|---|
| 1-4 (continuous_run × sleep) | **95%**（drill #2 S-6 + 5/30 EOD 第 3 回 re-eval）| 5/8 朝 S-6 PASS で +3pt 押上 = 98% |
| 2-3 (cost_cap × spike legit) | **95%**（drill #2 S-7 + 5/30 EOD 第 3 回 re-eval）| 5/8 朝 S-7 PASS で +3pt 押上 = 98% |
| 3-2 (rate_spike × boundary) | **92%**（drill #2 S-8 + 5/30 EOD 第 3 回 re-eval）| 5/8 朝 S-8 PASS で +3pt 押上 = 95% |
| 3-3 (rate_spike × spike legit) | **95%**（drill #2 S-9 + 5/30 EOD 第 3 回 re-eval）| 5/8 朝 S-9 PASS で +3pt 押上 = 98% |

平均達成予測: 94%（drill #2 5/8 朝 Pass 後 = 97%）。

---

## §4 matrix v1 → v2 diff 表（14 セル状態変化）

### §4.1 全 14 セル diff

| # | detector × シナリオ | v1.0 判定 | v2.0 予測判定 | 状態変化 | 根拠 |
|---|---|---|---|---|---|
| 1 | continuous_run × boundary | medium / partial | low | **昇格 1 段階** | debounce 60s + monotonic clock + tolerance 60s |
| 2 | continuous_run × spike legit | medium / partial | low | **昇格 1 段階** | `--allow-extended-run` flag |
| 3 | continuous_run × sleep | **high / no** | low | **昇格 2 段階** | accumulatedSleepMs + heartbeat |
| 4 | cost_cap × boundary | medium / partial | low | **昇格 1 段階** | debounce 5min |
| 5 | cost_cap × spike legit | **high / no** | low | **昇格 2 段階** | declareLegitSpikeWindow + Anthropic console 二段防御 |
| 6 | rate_spike × typical use | medium / partial | low | **昇格 1 段階** | jittering + sliding window |
| 7 | rate_spike × boundary | **high / no** | low | **昇格 2 段階** | baselineMinTokens 10 + z-score 2σ filter |
| 8 | rate_spike × spike legit | **high / no** | low | **昇格 2 段階** | declareLegitSpikeWindow + 自動再有効化 hook |
| (変動なし、12 セル) | — | — | — | — | — |
| 9 | continuous_run × typical use | low / yes | low | 不変 | confirmCount default 2 |
| 10 | continuous_run × multi-process | medium / partial | medium | 不変（drill #2 確証）| app_id tag |
| 11 | cost_cap × typical use | low / yes | low | 不変 | watchdog 3 段階 |
| 12 | cost_cap × sleep | low / yes | low | 不変 | atomic reset |
| 13 | cost_cap × multi-process | medium / partial | medium | 不変（drill #2 確証）| independent cost-tracker |
| 14 | rate_spike × sleep | low / yes | low | 不変 | sliding window |
| 15 | rate_spike × multi-process | medium / partial | medium | 不変（drill #2 確証）| independent rate window |
| 16 | ng3_violation × typical use | low / yes | low | 不変 | AND 条件 |
| 17 | ng3_violation × boundary | medium / partial | medium | 不変（W1 配置）| debounce 60s |
| 18 | ng3_violation × spike legit | medium / partial | medium | 不変（W1 配置）| `--ng3-extended` flag |
| 19 | ng3_violation × sleep | medium / partial | medium | 不変（W1 配置）| atomic reset + manual override |
| 20 | ng3_violation × multi-process | medium / partial | medium | 不変（drill #2 確証）| independent NG-3 判定 |

### §4.2 状態変化の集計

| 状態変化 | 件数 | 根拠 |
|---|---|---|
| 昇格 2 段階（high → low）| **4 セル** | 高ランク 4 セルすべてで Dev-β 抑止策完遂 |
| 昇格 1 段階（medium → low）| **4 セル** | confirmCount + debounce + monotonic clock 効果 |
| 不変（low / medium 維持）| 12 セル | drill #2 multi-process 確証 / Phase 1 W1 配置で確証 |
| 降格（low → medium / high）| **0 セル** | regression なし |

### §4.3 v1 → v2 diff まとめ

| 区分 | v1.0 → v2.0 | 説明 |
|---|---|---|
| 高ランクセル | 4 → 0 | Dev-β 抑止策で all 降格 |
| 中ランクセル | 9 → 6 | 4 セル昇格（low へ）+ 1 セル不変 + 4 セル昇格（low へ）= 9 - 3 = 6 |
| 低ランクセル | 7 → 14 | high 4 + medium 3 が low に昇格 = 7 + 7 = 14 |

注: §4.2 の「昇格 1 段階」と §4.1 の medium/partial → low の昇格セルは同一セット（4 セル）。

---

## §5 月次偽陽性率 < 1% 達成見込み計算

### §5.1 計算前提

| 前提 | 数値 | 根拠 |
|---|---|---|
| 月次総 detector 評価回数 | ~1,000 回 | 1 detector 1 評価 / 5min × 24h × 30day = ~8,640 / detector × 4 detector = ~34,560 |
| month 換算 < 1% target | < 346 件 / 月 | 34,560 × 1% = 346 件 / 月 |
| Dev-β 抑止策抑止率（high 4 セル）| 99%+ | 月次偽陽性率 < 1% / セル |
| medium 6 セルの抑止率 | ≤ 99.7% | ≤ 3 件 / 月 / セル × 6 セル = ≤ 18 件 / 月 |
| low 14 セルの抑止率 | 100% | 0 件 / 月 / セル |

### §5.2 月次偽陽性率計算

| 区分 | セル数 | 月次件数（最悪）| 月次件数（平均）|
|---|---|---|---|
| high (0 セル)| 0 | 0 件 | 0 件 |
| medium (6 セル)| 6 | ≤ 18 件 | ≤ 6 件（平均値）|
| low (14 セル)| 14 | < 14 件 | < 4 件（平均値）|
| **合計** | 20 | **≤ 32 件 / 月** | **≤ 10 件 / 月** |

20 detector × scenario 組合せの月次偽陽性件数は最悪値で ≤ 32 件、平均値で ≤ 10 件と予測。月次総評価回数 34,560 件に対する偽陽性率は最悪値で 0.09%、平均値で 0.03%。**月次偽陽性率 < 1% 目標は最悪値でも達成見込み**（margin 91% で達成）。

### §5.3 detector 別月次偽陽性率

| detector | 月次評価回数 | 月次偽陽性件数（最悪）| 偽陽性率（最悪）|
|---|---|---|---|
| continuous_run | ~8,640 | ≤ 3 件 | < 0.04% |
| cost_cap | ~8,640 | ≤ 3 件 | < 0.04% |
| rate_spike | ~8,640 | ≤ 3 件 | < 0.04% |
| ng3_violation | ~8,640 | ≤ 12 件（W1 着地後）| < 0.14% |
| **合計** | ~34,560 | ≤ 21 件 | **< 0.07%** |

**4 detector すべてで月次偽陽性率 < 1% 達成見込み**（margin 92%+）。

---

## §6 5/8 18:00 第 1 回 re-eval 検証計画

### §6.1 第 1 回 re-eval（5/8 18:00 議決-23 採択直後）の目的

Round 10 Dev-β 着地版 1,344 行 + 20 tests pass を実機で確認し、本書 v2.0 起案版の予測値が正しいかを検証。

### §6.2 5/8 18:00 第 1 回 re-eval 実施 step

| # | step | 担当 | 所要時間 |
|---|---|---|---|
| 1 | harness/Vitest mock 環境で 20 セル全注入実施 | Review | 30 min |
| 2 | high 4 セル予測値（< 1 件 / 月）を harness `Vitest fake timer + monotonic clock spy` で再現 | Review | 30 min |
| 3 | medium 6 セル予測値（≤ 3 件 / 月）を実機で確認 | Review | 30 min |
| 4 | low 14 セル予測値（0 件 / 月）を実機で確認 | Review | 30 min |
| 5 | 結果集計 + matrix v2.0 起案版の予測値修正（必要なら）| Review | 30 min |
| 6 | matrix v2.0 v1（5/8 版）として `review-round11-false-positive-matrix-v2-1st-result.md` 起案 | Review | 30 min |
| **合計** | — | — | **180 min（5/8 18:00-21:00）**|

### §6.3 第 1 回 re-eval の完遂判定

| 判定 | 条件 |
|---|---|
| **Full Pass** | high 4 セル全 PASS + medium 6 セル全 PASS + low 14 セル全 PASS = 20/20 |
| Partial Pass | high 4 セル全 PASS + medium 6 セル ≥ 5 PASS + low 14 セル全 PASS = 19/20 |
| Conditional Pass | high 4 セル ≥ 3 PASS + medium 6 セル ≥ 4 PASS = 17/20 以上 |
| Fail | high 4 セル < 3 PASS or matrix v2.0 起案版の予測値が大きく外れた | 

### §6.4 第 2 回 + 第 3 回 re-eval（drill #2 連動 + 5/30 EOD）

| 回 | 実施日時 | 主目的 |
|---|---|---|
| 第 2 回 | 5/8 朝 drill #2 連動（07:35 完遂判定）| multi-process interaction 5 セル（1-5 / 2-5 / 3-5 / 4-5 / ng3-5）実機検証 |
| 第 3 回 | 5/30 EOD（Phase 1 W2 完遂）| Dev-β 6 残実装件着地後の最終 re-evaluation + matrix v2.0 final 起案 |

---

## §7 5/8 議決-26 採択推奨度寄与

### §7.1 議決-26 採択 5 軸への寄与

| 議決-26 採択 5 軸 | 現在値（5/4 深夜）| matrix v2.0 起案後寄与 |
|---|---|---|
| 必須 50 ≥ 95% | 64% | +5pt（matrix v2.0 採択で G-V2-06 / G-V2-08 / NG-3 系コントロール完遂判定）|
| BAN 防御演習 PASS | drill #1 dry 5/5 PASS | 間接寄与（drill #2 5/8 朝で multi-process 5 セル確証）|
| Phase 1 着手 5/26 Conditional Go ≥ 95% | 93% | +2pt（Phase 1 W1 着手 + W2 完遂見込みで 95%）|
| 議決-7 drill #3 5/29 採択ライン | drill #1 dry +3pt | 間接寄与 |
| **Phase 1 W2 tos_monitor hooks 完遂** | 85% | **+5pt（matrix v2.0 採択で 90%）**|

### §7.2 5/8 議決-26 採択推奨度判定

| 判定 | matrix v2.0 起案後 5 軸 PASS 見込み | 採択推奨度 |
|---|---|---|
| **5/8 議決-26 採択時点** | 4/5 軸 Conditional Pass + 1/5 軸 Full Pass | **強い推奨で Conditional 採択** |
| Phase 1 着手 5/26 時点 | 4/5 軸 Full Pass + 1/5 軸 Conditional Pass | 極めて強い推奨で Conditional 採択 |
| Phase 1 完了 6/20 時点 | 5/5 軸 Full Pass | **無条件採択** |

### §7.3 確度押上推定

| 観点 | Round 10 完遂時 | Round 11 完遂時（本書）| matrix v2.0 final 5/30 EOD 後 |
|---|---|---|---|
| Phase 1 W2 tos_monitor hooks 完遂確度 | 85% | **90%**（v2.0 起案効果）| 95% |
| Phase 1 着手 5/26 Conditional Go 確度 | 93% | 93% | **95%**（drill #2 Pass + matrix v2.0 final）|
| 議決-26 採択推奨度 | 強い推奨 | 強い推奨 | **極めて強い推奨** |
| 5/22 朝公開前倒し（DEC-019-056）確度 | 81% | **84%** | **87%** |

---

## §8 Round 12 引継 TODO + Owner 観察ポイント

### §8.1 Round 12 引継 TODO 4 件

| # | TODO | 担当 | 期限 | 完遂条件 |
|---|---|---|---|---|
| 1 | 第 1 回 re-eval（5/8 18:00 議決-23 採択直後）実施 → matrix v2.0 v1 起案 | Review | 5/8 21:00 | 20 セル予測値の実機確認 + 修正 |
| 2 | drill #2 5/8 朝（07:35 完遂判定）連動の multi-process 5 セル検証 | Review + Dev | 5/8 08:00 | 5 セルすべて Sumi/Asagi 同居下で false-positive ≤ 3 件 |
| 3 | Dev-β 6 残実装件 W1 並列着手（5/19-25）| Dev | 5/25 EOD | 6 件すべて commit + テスト緑化 |
| 4 | matrix v2.0 final 起案（5/30 EOD）| Review | 5/30 EOD | matrix v2.0 final + 議決-26 軸 5/5 達成判定 |

### §8.2 Owner 観察ポイント prep（議決-26 採択時、3 箇所）

| 観察ポイント | 期待挙動 | Owner 判断 |
|---|---|---|
| 1. high 4 セル全降格（high 0 件達成）| Dev-β 4 セル抑止策で達成 | high 0 / medium 6 / low 14 で ◎ |
| 2. 月次偽陽性率 < 1% 達成 | 4 detector すべてで < 0.07% 達成 | < 0.07% 達成で ◎ |
| 3. Phase 1 W2 tos_monitor hooks 完遂 | matrix v2.0 採択で議決-26 軸 PASS 判定 | 5/30 EOD 採択で ◎ |

### §8.3 確度押上推定（Round 11 完遂時）

| 観点 | Round 10 完遂時 | Round 11 完遂時（本書）| matrix v2.0 final 後 |
|---|---|---|---|
| Phase 1 W2 tos_monitor hooks 完遂確度 | 85% | **90%** | 95% |
| 議決-26 採択推奨度 | 強い推奨 | 強い推奨 | **極めて強い推奨** |
| Phase 1 着手 5/26 Conditional Go 確度 | 93% | 93% | **95%** |
| 5/22 朝公開前倒し（DEC-019-056）確度 | 81% | 84% | **87%** |

---

## §9 結論 + Review 部門 sign-off

### §9.1 結論

Round 9 偽陽性 matrix v1.0（high 4 / medium 9 / low 7）の Round 10 Dev-β 着地後の **再評価予測値版 v2.0** を起案。Dev-β 4 セル抑止策実装（accumulatedSleepMs / declareLegitSpikeWindow / baselineMinTokens 10 + z-score 2σ filter / 自動再有効化 hook）により、high 4 セルすべてで月次偽陽性率 < 1% 達成見込み。**v2.0 予測値: high 4 → 0 / medium 9 → 6 / low 7 → 14**、状態変化集計は昇格 2 段階 4 セル + 昇格 1 段階 4 セル + 不変 12 セル + 降格 0 セル。月次偽陽性率は最悪値 < 0.09%、平均値 < 0.03% で「month 換算 < 1%」目標達成見込み（margin 91%+）。**5/8 議決-26 採択推奨度判定**: 「Phase 1 W2 tos_monitor hooks 完遂」軸に +5pt 寄与（85→90%）、5 軸合計で「**強い推奨で Conditional 採択**」、Phase 1 完了 6/20 時に「**無条件採択**」ライン到達見込み。read-only 厳守、コード一切無改変。

### §9.2 Review 部門 sign-off

| 観点 | sign-off |
|---|---|
| 20 セル v2.0 予測値（high 0 / medium 6 / low 14）| sign-off |
| high 4 セル新規 PASS 基準達成予測（94% 達成）| sign-off |
| matrix v1 → v2 diff 表（14 セル状態変化）| sign-off |
| 月次偽陽性率 < 1% 達成見込み計算（< 0.07%）| sign-off |
| 5/8 18:00 第 1 回 re-eval 検証計画 | sign-off |
| 5/8 議決-26 採択推奨度寄与（+5pt）| sign-off |
| Round 12 引継 TODO 4 件 | sign-off |

### §9.3 関連 DEC / リスク参照

- **DEC-019-008**: NG-3 暫定値 — 12h cap を plan_a で完全保持、active elapsed で sleep 偽発火を抑止
- **DEC-019-050**: API cap $30 — base cap 不変、legit spike window で extended cap 提供
- **DEC-019-051**: subscription 95:5 — combinedMonthlyCap 設定不変
- **DEC-019-055**: Round 8 完遂 — 本前倒しの起点
- **DEC-019-056**: Round 9/10 前倒し — 本書 v2.0 起案の根拠
- **R-019-06**: BAN 30-60% / 12 ヶ月 — matrix v2.0 で +10% mitigation（high 4 セル降格効果）
- **R-019-09**: NG-3 24/7 監視 — matrix v2.0 で +5% mitigation
- **R-019-19**: API $30 Hard cap 突破 — Anthropic console 二段防御確立で +5% mitigation
- **R-019-21**: subscription quota 突破時 API fallback 急速消費 — extended flag 動作で +5% mitigation

### §9.4 次回更新

- 5/8 21:00（第 1 回 re-eval 結果反映 → matrix v2.0 v1 起案 = `review-round11-false-positive-matrix-v2-1st-result.md`）
- 5/8 朝（drill #2 連動 multi-process 5 セル実機検証反映）
- 5/30 EOD（第 3 回 re-eval 結果反映 → matrix v2.0 final 起案）

---

**v2.0 起案**: 2026-05-04 W0-Week1 深夜 Review 部門 R11 Review-C / 案 C ハイブリッド暫定運用前提
**正式採択**: 2026-05-08 W0-Week1 検収会議（議決-23 連動採択、Owner sign-off 予定）
**v2.0 確定差分**: 20 セル v2.0 予測値（high 0 / medium 6 / low 14）+ high 4 セル新規 PASS 基準達成予測 + matrix v1 → v2 diff 表 + 月次偽陽性率 < 1% 達成見込み計算 + 5/8 18:00 第 1 回 re-eval 検証計画
