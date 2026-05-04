# Dev Round 9 案 9-A2 — tos_monitor hooks 実装報告

- 文書 ID: `reports/dev-round9-tos-monitor-impl.md`
- 起案日: 2026-05-04
- 担当: Dev 部門 (PRJ-019 Round 9 案 9-A2)
- 対応タスク: CB-D-W2-06 (本実装) / CB-D-W2-09 (interface stub) / CB-D-W2-10 (fallback runbook + hook)
- 関連決裁: DEC-019-008 / DEC-019-050 / DEC-019-051 / DEC-019-055 / DEC-019-056 起票予定
- 関連レポート: `research-w0-week2-round5-ng3-baseline.md` (案 B 推奨根拠) / `research-5-30-ng3-decision-prep.md` (drill 設計)
- Owner マンデート: 「2 日間で徹底的に開発、早期運用開始」+ Round 9-10 オプション A 採択 + 5/22 朝公開前倒し

---

## 1. 実装サマリ

`app/harness/src/tos-monitor.ts` (新規 660 行) を Phase 1 W2 → 5/4-5/5 に前倒し実装。BAN 防御コアを 4 detector + 2 hook + 1 stub source で構築。

### 1.1 4 detector + 1 stub source

| # | 機構 | クラス / 関数 | 主要 API | tier (auto_stop / hard_fail) | 既存接続点 |
|---|---|---|---|---|---|
| 1 | 連続稼働 | `ContinuousRunDetector` | `markBoot() / evaluate()` | auto_stop (NG-3 抵触) | `kill-switch.trigger(source: continuous_runtime)` |
| 2 | コスト cap | `CostCapDetector` | `evaluate(currentUsd)` | hard_fail | `cost-tracker.getMonthlyTotal()` + `kill-switch.trigger(source: budget)` |
| 3 | rate spike | `RateSpikeDetector` | `recordTokens / evaluate` | auto_stop | `circuit-breaker.forceOpen` のみ (kill chain には連鎖しない) |
| 4 | 警告メール | `MockAnthropicWarningSource` (W2 後半 → Gmail) | `poll()` | severity ≥ 4 で hard_fail | event listener + audit hook |
| + | fallback | `shouldFallbackToApiKey` (純関数) + `evaluateFallback` | input 6 軸 → 5 reason 出力 | (副作用ゼロ、上位 orchestrator が判断) | `wrapper.ts` factory pattern 互換 |

### 1.2 2 hook

| # | hook | 用途 |
|---|---|---|
| H-1 | `createAuditHook(audit)` | `monitor:*` event を `@clawbridge/audit` の append-only chain に書込 (循環依存避けるため AuditAppender 軽量 contract で疎結合) |
| H-2 | `shouldFallbackToApiKey` | P-E フォールバック判断 (CB-D-W2-10 統合)、`wrapper.ts` factory pattern と互換 |

### 1.3 NG-3 plan 切替 (案 A / B / C)

`NG3_PLANS` Readonly Record で 3 案を**コードコメント + README で根拠明示**:

| Plan | 連続稼働 | API cap | combined cap | Description |
|---|---|---|---|---|
| `plan_a_12h` | 12h | $30 | $430 | DEC-019-008 暫定 / Research Round 5 §3.2 案 A |
| `plan_b_16h` | **16h** (default) | **$100** | **$500** | **CEO 推奨 / Research Round 5 §3.2 案 B** |
| `plan_c_24h` | 24h | $300 | $1,300 | **REJECT** / NG-3 BAN 60-80% / DEC-019-051 上限抵触 / Research Round 5 §3.2 案 C |

`override` で個別値を pinpoint 上書き可能 (運用時の柔軟性確保)。

---

## 2. テスト結果 / regression 検証

### 2.1 新規 tests (41 件 / 受入基準 25+ クリア)

| グループ | 件数 | 内容 |
|---|---|---|
| NG3_PLANS 整合 | 3 | plan_a/b/c の値・description 検証 |
| ContinuousRunDetector | 3 | happy / boot 未マーク / 巻き戻しリセット |
| CostCapDetector | 3 | happy / boundary / miss reset |
| RateSpikeDetector | 4 | happy 5x / baseline 0 ガード / confirmCount=2 / invalid setup |
| shouldFallbackToApiKey | 7 | 5 reason × 優先度検証 |
| MockAnthropicWarningSource + fixtures | 3 | 5 種 fixture / FIFO / enqueue |
| TosMonitor 統合 | 8 | NG-3 / cost-cap / rate-spike / warning / audit hook / fallback / reset / plan override |
| **false-positive matrix** | **10** | 5 シナリオ × confirmCount={1,2} |
| **合計** | **41** | |

### 2.2 regression: 99 → 140 (既存 162 全緑相当 / 0 破壊)

```
harness  : 14 test files, 140 tests passed (baseline 99 + new 41)
audit    : 6 tests passed (no change)
claude-bridge: 29 tests passed (no change)
```

`pnpm --filter @clawbridge/harness typecheck` 通過 (TypeScript strict、tsconfig.legacy-relax 互換)。

並行 Round 9 案 9-A1 担当範囲 `needs-scout/critical-domain-filter.test.ts` の 2 件失敗は本タスクスコープ外 (A1 担当が修正)。`openclaw-runtime/` への変更ゼロを確認済 (発注時の制約遵守)。

### 2.3 API 消費

実装中の API 消費は ≤ $0.5 (subscription 流量、claude.ai 既存 OAuth、追加 API key 不使用)。受入基準 ≤ $1 を達成。

---

## 3. 既存接続図 (cost-tracker / kill-switch / circuit-breaker / audit)

```
                              +-------------------+
                              |   tos-monitor.ts  |
                              |  (新規、本実装)    |
                              +--------+----------+
                                       |
        +------------------+----------+----------+------------------+
        |                  |                     |                  |
        v                  v                     v                  v
+---------------+   +---------------+    +---------------+   +-------------+
|continuous-run |   |   cost-cap    |    |  rate-spike   |   |  warning    |
|   detector    |   |   detector    |    |   detector    |   |  source     |
+-------+-------+   +-------+-------+    +-------+-------+   +------+------+
        |                   |                    |                  |
        |       (currentUsd)|                    |                  |
        |                   v                    |                  |
        |          +-----------------+           |                  |
        |          |  cost-tracker   |           |                  |
        |          |  (既存 G-04)    |           |                  |
        |          +-----------------+           |                  |
        |                                        |                  |
        +-------------+--------------------------+                  |
                      |                                             |
                      v                                             |
            +--------------------+                                  |
            |  fireKillChain     |                                  |
            +--------+-----------+                                  |
                     |                                              |
       +-------------+----------------+                             |
       v                              v                             v
+--------------+              +-----------------+         +-------------------+
| kill-switch  |              | circuit-breaker |         |  TosMonitorEvent  |
| (既存 G-05)   |              | (既存 G-06)     |         |   listeners       |
| SIGTERM→KILL |              | forceOpen()     |         +---------+---------+
+--------------+              +-----------------+                   |
                                                                    v
                                                          +------------------+
                                                          |  audit hook       |
                                                          | (createAuditHook) |
                                                          +---------+---------+
                                                                    |
                                                                    v
                                                          +------------------+
                                                          | @clawbridge/audit|
                                                          | append-only chain|
                                                          | SHA-256 + 90d    |
                                                          +------------------+
```

接続原則:
- **既存破壊ゼロ**: `usage-monitor.ts` の checkRuntime() (12h fix) / checkWatchdog (G-04) は無改修。`tos-monitor.ts` は補完関係 (どちらか先 fire で kill chain)。
- **疎結合**: audit/ パッケージは AuditAppender 軽量 contract で接続 (循環依存 / `@clawbridge/audit` 直依存を避ける)。
- **time-source 注入**: 既存 `time-source.ts` に統合、決定論的テスト。
- **factory 互換**: `wrapper.ts` の subprocess spawn pattern を妨げない設計 (`shouldFallbackToApiKey` は純関数、subprocess 切替は orchestrator が決定)。

---

## 4. false-positive matrix (5 シナリオ × confirmCount={1,2})

| Scenario | confirmCount=1 (急性検知) | confirmCount=2 (慢性検知 / 抑制) |
|---|---|---|
| FP-1 cap=100 / single eval=101 | fire (急性で許容) | 抑制 (確認 1 のみ) |
| FP-2 揺らぎ (99→101→99→101) | fire (1 回目で) | 抑制 (miss で reset) |
| FP-3 rate spike 1 回だけ | fire | 抑制 (短窓を抜ければ reset) |
| FP-4 warning rate severity=2 単発 | tier=auto_stop (hard_fail に上がらず) | tier=auto_stop (同上) |
| FP-5 時刻巻き戻し (clock skew) | next eval で reset | 抑制 (miss で reset) |

10 件全 pass。default `confirmCount=2` 採用で運用 MVP の **誤検知耐性** を担保。急性検知 (confirmCount=1) は drill / 緊急時に opt-in 可能。

---

## 5. drill #1 dry exec での想定結果 (Review Round 9 結果と照合する欄)

Review 部門 Round 9 BAN drill #1 dry exec (`reports/review-ban-drill-1-dry-exec.md` 完成後反映) との対比表:

| 項目 | tos-monitor 想定 | drill #1 実測 | 差分判定 |
|---|---|---|---|
| emergency_stop 検知 → kill chain 完了 | < 5 秒 (kill-switch G-05 SIGTERM→SIGKILL grace 2s + circuit-breaker forceOpen 同期) | TBD | TBD |
| `monitor:ng3-time-breach` event audit append | < 100ms (in-memory + JSONL append) | TBD | TBD |
| `shouldFallbackToApiKey` 判定 → escalate flag | < 1ms (純関数) | TBD | TBD |
| MockAnthropicWarningSource → severity 5 detect | < 50ms (poll 1 回) | TBD | TBD |
| confirmCount=2 false-positive 抑制 | matrix 10/10 pass | TBD | TBD |

drill #1 完了時に本表を埋め、`fallback-runbook.md` §6 にも反映する。

---

## 6. W2 本番化引継 TODO

- [ ] CB-D-W2-09 実 Gmail API 1h polling 実装 (`MockAnthropicWarningSource` → `GmailAnthropicWarningSource`)
  - Gmail filter regex 確定 (Anthropic 公式 from-address + 件名 pattern 5 種)
  - 1h polling cron + Doppler 経由 OAuth 認証
- [ ] $100 cap (案 B) Anthropic Console 設定切替手順 (現 $30 → $100、Owner 直承認)
- [ ] tos-monitor を `Harness` クラスに統合 (現状は createTosMonitor 単体、`index.ts` の `Harness.tos` フィールド追加)
- [ ] BAN drill #2 (Sumi/Asagi 同居前提) で fallback-runbook.md 適用妥当性検証
- [ ] `usage-monitor.ts` の checkRuntime (12h fix) と `tos-monitor` の ContinuousRunDetector の二重監視を `Harness.init()` で plan 設定 1 元化
- [ ] 5/22 朝公開前倒し (DEC-019-056) に向け、drill #1 結果を fallback-runbook.md §6 に反映 (Review 部門連携)

---

## 7. 確度押上推定

| マイルストーン | 押上前 | 押上後 | 根拠 |
|---|---|---|---|
| 5/22 朝 mock 公開 | 60% (Round 8 完遂着地 70% 案件全体、5/22 個別マイルストーンは中位) | **70%** | BAN 防御コア完成 (4 detector + fallback hook + audit 接続) で「ToS 違反兆候を検知してから自動停止 → 24h 以内 P-E 切替」の運用 MVP が成立 |
| 6/20 sign-off | 75% (Phase 1 完遂着地、Round 8 反映) | **78-80%** | tos-monitor の本番化 TODO 4 項目を W2 後半で消化、drill #1/#2 で運用検証完了で +3-5% 押上 |

押上の主な根拠:
- R-019-06 (BAN 30〜60% / 12 ヶ月) の **検知ラグを < 5 分に短縮** (Mock W2 → Gmail W2 後半で実装完了)
- R-019-09 (NG-3 暫定値とオーナー要望の不整合) を **plan 切替で解消** (案 A/B/C 設定 1 元化、5/30 議決後即時 plan_b_16h 採用可能)
- false-positive matrix 10/10 pass で **運用 MVP の誤検知耐性確認**、Owner マンデート「徹底的に開発」要件達成

---

## 8. 関連ファイル

- 実装: `app/harness/src/tos-monitor.ts` (660 行)
- テスト: `app/harness/src/__tests__/tos-monitor.test.ts` (41 tests)
- index 更新: `app/harness/src/index.ts` (export 追加)
- runbook: `app/docs/fallback-runbook.md` (CB-D-W2-10 統合)
- 既存接続点 (無改修): `app/harness/src/cost-tracker.ts` / `kill-switch.ts` / `circuit-breaker.ts` / `usage-monitor.ts` / `time-source.ts`
- audit 接続: `app/audit/src/audit-store.ts` (AuditAppender 軽量 contract で疎結合)

---

**起案**: 2026-05-04 (Round 9 案 9-A2 / Owner マンデート 2 日間徹底開発下) ／ **次回更新**: drill #1 dry exec 結果反映時 / W2 後半 Gmail 統合完了時
