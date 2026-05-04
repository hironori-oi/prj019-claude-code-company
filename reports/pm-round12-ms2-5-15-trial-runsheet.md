# PRJ-019 MS-2 5/15 trial confirmed run sheet — 5/15 当日 09:00-18:00 分単位 timeline + abort criteria + fallback 3 経路（Round 12 PM-E deliverable 1）

| 項目 | 内容 |
|---|---|
| 文書 ID | pm-round12-ms2-5-15-trial-runsheet |
| 制定日 | 2026-05-04（Round 12 PM-E dispatch 起案） |
| 起票 | PM 部門（PM-E 独立 Agent、general-purpose 経由 dispatch、DEC-019-025 SOP 準拠） |
| 区分 | **MS-2 5/15 trial confirmed run sheet v1** — Round 11 PM-D `pm-round11-ms2-5-15-trial-scenario.md`（489 行）の 120 分 timeline を 5/15 当日 09:00-18:00 9 時間版へ拡張、PM がそのまま執行可能な詳細度 |
| 上位決裁（既存維持） | DEC-019-007 / 010 / 025 / 050 / 052 / 053 / 054 / 055 / 056 / 057（confirmed） / 058（confirmed） |
| 上位決裁（新規予定） | **DEC-019-059**（Round 12 authorization、Secretary-G 起票予定） |
| 親文書（破壊しない、差分追加） | `pm-round11-ms2-5-15-trial-scenario.md`（Round 11 PM-D deliverable 2、489 行） |
| 範囲 | 5/15 当日 09:00-18:00 の 9 時間 wall-clock 分単位 timeline + abort criteria 4 件 + fallback 3 経路 + Round 12 Dev-A〜E 完遂タスク依存表 |
| ステータス | **confirmed run sheet v1**（Owner 5/7 朝判断-4 = 選択肢 A 採用後、5/14 18:00 GO 判定会議で本書を最終 acknowledge → 5/15 当日 PM 執行） |

---

## §0 Executive Summary（CEO 向け 200 字以内）

PRJ-019 MS-2 5/15 trial 当日執行用 confirmed run sheet。Round 11 PM-D scenario の 120 分 timeline を 9 時間 9 段階構造へ拡張: ① 08:30-09:00 起動準備 / ② 09:00-12:00 trial run #1 (3h continuous, cost cap < $5) / ③ 12:00-13:00 中間 review CEO+PM 同席 / ④ 13:00-16:00 trial run #2 (real subprocess + JSON IF dispatch) / ⑤ 16:00-17:00 Owner 通知準備 / ⑥ 17:00 Owner 通知 (Slack quick-action dry-run) / ⑦ 17:00-18:00 後処理。kill-switch 4 条件 + fallback 3 経路 (5/22 push / 5/30 維持 / 完全中止) 完備。MS-2 trial 準備度 = **CONDITIONAL GO**（5/14 GO 判定会議 + 5/8 議決-26 Conditional 採択 + drill #2 5/8 朝 Pass の 3 件成立条件）。

---

## §1 trial 全体構造（9 時間 9 段階）

### §1.1 5/15 当日 9 段階 timeline overview

```
08:30-09:00 [段階 A] 起動準備（30 分） — 環境変数 / 1Password CLI / 監視 dashboard
09:00       [trigger]   needs_scout 起動（ANTHROPIC_API_KEY 強制 dry-run mode）
09:00-12:00 [段階 B] trial run #1（3 時間継続稼働） — 軽負荷 3h / cost cap < $5 / audit log integrity 5 分間隔 grep
12:00-13:00 [段階 C] 中間 review（60 分） — CEO + PM 同席判定 continue/abort
13:00-16:00 [段階 D] trial run #2（3 時間） — real subprocess + JSON IF dispatch
16:00-17:00 [段階 E] Owner 通知準備（60 分） — 成果サマリ + 残懸念 + 5/22 sign-off 推奨度
17:00       [段階 F] Owner 通知（5 分） — Slack quick-action 経路 dry-run 検証兼
17:00-18:00 [段階 G] 後処理（60 分） — audit log archive / metric snapshot / Round 12 progress
```

### §1.2 Round 11 PM-D scenario との差分

| 項目 | Round 11 PM-D 版 | Round 12 PM-E confirmed run sheet |
|---|---|---|
| 想定 wall-clock | 120 分（09:00-11:05） | **9 時間（08:30-18:00）** |
| trial run 構成 | 1 周（4 段階） | **2 周（trial run #1 軽負荷 + trial run #2 real subprocess）** |
| 中間 review | なし（trial 中断 = abort） | **CEO + PM 同席 60 分 (12:00-13:00)** |
| Owner 通知時刻 | 21:00（夜） | **17:00（業務時間内）** |
| Slack quick-action 検証 | 通知のみ | **dry-run 経路検証兼用** |
| cost cap | $2 (mock 中心) | **$5（trial run #2 real subprocess 含む）** |
| audit log 監視 | 完了時 1 回 | **5 分間隔 grep** |
| abort criteria | 5 失敗パターン | **kill-switch 4 件 + 5 失敗パターン** |
| fallback | 5/22 公式着手 1 経路 | **3 経路（5/22 push / 5/30 維持 / 完全中止）** |

→ Round 12 PM-E confirmed run sheet は Round 11 PM-D scenario の上位互換、PM が当日そのまま執行可能。

### §1.3 関与人員 + 物理拘束

| 役割 | 5/15 当日拘束時間 | 主担当 slot |
|---|---|---|
| PM-E（本書執行責任者） | **9 時間 (08:30-18:00 全行程)** | 全段階 |
| CEO | **3-4 時間（重要 slot のみ）** | 段階 C 中間 review (1h) + 段階 E Owner 通知準備 (1h) + 段階 F (5min) + 段階 G (1h) |
| Dev リード（trial run 実行） | **6-7 時間（段階 A-D + G）** | 段階 A / B / C 共同 / D / G |
| Review リード（audit log 監視） | **6 時間（段階 B-D + G）** | 5 分間隔 grep + 段階 C 共同 / G archive |
| Owner | **5 分（段階 F のみ）** | 17:00 Slack acknowledge / 中止判断 |

→ Owner 物理拘束 5 分（DEC-019-052 (c) Channel 3 + Round 11 PM-D scenario §2.3.1 整合）。

---

## §2 段階 A: 08:30-09:00 起動準備（30 分）

### §2.1 段階 A タスク分単位 timeline

| 時刻 | 担当 | タスク | 完遂条件 |
|---|---|---|---|
| 08:30-08:35 | PM-E | trial run sheet 全員配布 + 本日 GO 状態最終確認（昨日 5/14 GO 判定会議結果再確認） | sheet 配布完遂 |
| 08:35-08:40 | Dev | 環境変数読込（1Password CLI 経由 secret 取得） | env 設定完遂 |
| 08:35-08:40 | Dev | `ANTHROPIC_API_KEY` を強制 dry-run mode 用 placeholder 値に上書き（real key を 18:00 まで露出しない） | placeholder 設定完遂 |
| 08:40-08:45 | Dev | 監視 dashboard 起動（local Grafana + prometheus exporter from openclaw-runtime） | dashboard live |
| 08:40-08:45 | Review | audit log 出力先確認（`projects/PRJ-019/app/openclaw-runtime/audit/trial-5-15/`）+ ローテート設定確認 | log dir ready |
| 08:45-08:50 | Dev | mock-claw mode + dry-run mode の dual mode 起動 confirmation script 実行 | dual mode OK |
| 08:50-08:55 | PM-E + CEO | trial run #1 (09:00-12:00) GO 判定 final（kill-switch 4 件 acknowledge）| GO acknowledge |
| 08:55-09:00 | PM-E | audit log timestamp 開始 marker `TRIAL-5-15-START` 投入 | marker 投入 |

### §2.2 段階 A 起動準備チェックリスト（PM 当日チェック）

| # | チェック項目 | 担当 | 完遂判定 |
|---|---|---|---|
| 1 | 1Password CLI session active | Dev | `op whoami` 成功 |
| 2 | `ANTHROPIC_API_KEY` placeholder 化 (`sk-ant-PLACEHOLDER-DRY-RUN-ONLY`) | Dev | env grep で確認 |
| 3 | 監視 dashboard URL `http://localhost:3000/grafana/d/openclaw` 開閲 | PM-E | dashboard live |
| 4 | audit log dir 書込権限 | Review | `touch test.log` 成功 |
| 5 | mock-claw mode 起動 dry-run | Dev | exit code 0 |
| 6 | dry-run mode 起動 dry-run | Dev | exit code 0 |
| 7 | tos-monitor (Round 10 Dev-β 1,344 行) 起動 OK | Review | 4 detector + 2 hooks 起動 |
| 8 | `kill-switch.registerSubprocessKill` 配線確認（Dev-D Round 12 完遂依存）| Dev | wiring confirmed |
| 9 | Slack #prj019-owner-trial channel 投稿権限 | CEO | test post + delete 成功 |
| 10 | 中間 review (12:00-13:00) Zoom link 共有 | PM-E | link 配信完遂 |

→ 10 件全件 OK で段階 B GO。1 件でも NG = abort + 再準備。

---

## §3 段階 B: 09:00-12:00 trial run #1（3 時間継続稼働、軽負荷）

### §3.1 段階 B 概要

| 項目 | 内容 |
|---|---|
| 目的 | mock 中心 + 限定 live fetch で needs_scout → JSON IF → mock-claw → audit log の 3 時間継続稼働確認 |
| mode | mock-claw mode + dry-run mode + `ANTHROPIC_API_KEY` placeholder 強制 dry-run |
| 負荷 | 軽負荷（HN/PH/GitHub Trending 各 cycle 1h × 3 cycle = 3 周） |
| 想定 cost | < $5（cost cap、超過時 kill-switch 発動）|
| audit log 監視 | 5 分間隔 grep（自動 cron + 手動再確認） |

### §3.2 段階 B 分単位 timeline（3 時間 = 180 分）

| 時刻 | 担当 | タスク | 完遂条件 |
|---|---|---|---|
| 09:00 | PM-E | trial run #1 trigger 発令（GO 宣言）| trigger 配信 |
| 09:00-09:05 | Dev | `npm run needs-scout:trial -- --mode=mock-with-limited-live --cycle=1` 実行 | cycle 1 開始 |
| 09:05-09:30 | Dev | needs_scout cycle 1（HN top 10 + PH top 5 + GitHub Trending top 5 = 20 record fetch + 13-domain denylist filter） | filter 後出力 ≥ 12 件 |
| 09:30-10:00 | Dev | JSON IF dispatch cycle 1（needs_scout output → mock-claw → response → audit log） | round-trip 成立 ≥ 12 record |
| 09:30-10:00 | Review | audit log integrity grep #1（5 分間隔 × 6 回 = 30 分）| hash chain 整合 |
| 10:00-10:05 | Dev | cycle 1 終了 + cycle 2 trigger | cycle 2 開始 |
| 10:00-10:05 | PM-E | cost monitor: cycle 1 累計コスト確認（想定 ≤ $1.5）| cost ≤ $1.5 |
| 10:05-11:00 | Dev | needs_scout + JSON IF cycle 2（同 cycle 1） | filter 後 ≥ 12 件 + round-trip ≥ 12 record |
| 10:05-11:00 | Review | audit log integrity grep #2（5 分間隔 × 11 回） | hash chain 整合 |
| 11:00-11:05 | Dev | cycle 2 終了 + cycle 3 trigger | cycle 3 開始 |
| 11:00-11:05 | PM-E | cost monitor: cycle 2 累計コスト確認（想定 ≤ $3） | cost ≤ $3 |
| 11:05-12:00 | Dev | needs_scout + JSON IF cycle 3（同 cycle 1）| filter 後 ≥ 12 件 + round-trip ≥ 12 record |
| 11:05-12:00 | Review | audit log integrity grep #3（5 分間隔 × 11 回） | hash chain 整合 |
| 12:00 | PM-E | trial run #1 完遂宣言 + 段階 C 中間 review 移行 | run #1 完遂 |

### §3.3 段階 B audit log integrity grep procedure（5 分間隔）

```bash
# 5 分間隔で cron 実行（projects/PRJ-019/app/openclaw-runtime/audit/trial-5-15/）
*/5 9-12 15 5 * /path/to/audit-grep-trial.sh
```

```bash
# audit-grep-trial.sh 主要ロジック
LOG_DIR="projects/PRJ-019/app/openclaw-runtime/audit/trial-5-15"
LATEST_HASH=$(tail -1 "$LOG_DIR/hash-chain.log" | awk '{print $3}')
PREV_HASH=$(tail -2 "$LOG_DIR/hash-chain.log" | head -1 | awk '{print $3}')
COMPUTED_HASH=$(sha256sum "$LOG_DIR/latest-record.json" | awk '{print $1}')

if [ "$LATEST_HASH" != "$COMPUTED_HASH" ]; then
  echo "[ABORT] hash chain integrity violation detected at $(date -Iseconds)"
  echo "Expected: $COMPUTED_HASH / Actual: $LATEST_HASH"
  # kill-switch 発動: trial 即時中止 + Owner 通知
  /path/to/kill-switch.sh "audit-log-integrity-violation"
fi
```

### §3.4 段階 B DoD（trial run #1 完遂判定）

| # | DoD 項目 | 検証主体 | 達成判定 |
|---|---|---|---|
| 1 | 3 cycle 全完遂（HN/PH/GitHub Trending × 3 周）| Dev | cycle 3 終了 12:00 |
| 2 | 各 cycle filter 後 ≥ 12 件 fetch | Dev | cycle 1/2/3 全件達成 |
| 3 | 各 cycle round-trip ≥ 12 record | Dev | cycle 1/2/3 全件達成 |
| 4 | cost cap < $5（trial run #1 終了時） | PM-E | 想定 $4-5 |
| 5 | audit log hash chain 整合 (grep 35 回 = 3h × 11.7 回/h) | Review | 全 grep PASS |
| 6 | 副作用 0 件（本番 system 影響無） | Review | dry-run mode 完全準拠 |
| 7 | regression 0 件（Round 11 既存 614 tests pass 維持） | Dev | smoke test PASS |

→ 7 件全件達成 = trial run #1 完遂 → 段階 C 中間 review 移行。

---

## §4 段階 C: 12:00-13:00 中間 review（CEO + PM 同席判定 60 分）

### §4.1 段階 C 概要

| 項目 | 内容 |
|---|---|
| 目的 | trial run #1 結果を CEO + PM 同席で評価、trial run #2 (13:00-16:00) GO/abort 判定 |
| 同席者 | CEO（mandatory）/ PM-E（mandatory）/ Dev リード（mandatory）/ Review リード（mandatory）/ Owner（option）|
| 成果物 | 中間 review minutes（200-300 行）+ trial run #2 GO/abort 判定 |
| 場所 | Zoom + 監視 dashboard 共有画面 |

### §4.2 段階 C 分単位 timeline（60 分）

| 時刻 | 担当 | タスク | 完遂条件 |
|---|---|---|---|
| 12:00-12:05 | PM-E | trial run #1 結果 5 行サマリ提示 | summary 提示 |
| 12:05-12:15 | Dev | trial run #1 詳細結果 read（cycle 1/2/3 各 KPI 比較） | KPI 提示完遂 |
| 12:15-12:25 | Review | audit log integrity grep 35 回結果 read + 副作用検証結果 read | integrity 結論 |
| 12:25-12:35 | PM-E | cost cap 状況 + Round 11 PM-D scenario 主要 KPI 8 件達成判定 | KPI 8 件達成判定 |
| 12:35-12:45 | CEO | trial run #2 (13:00-16:00) GO/abort 判定 + 5/22 sign-off push 推奨度仮判定 | CEO 判定 |
| 12:45-12:55 | PM-E + Dev | trial run #2 GO 時: real subprocess + JSON IF dispatch 経路 final 確認 | GO 確認 |
| 12:55-13:00 | PM-E | trial run #2 trigger 準備 + 中間 review minutes 起案 | trigger ready |

### §4.3 段階 C 判定基準

| 判定軸 | continue (trial run #2 GO) | abort (run #2 中止) |
|---|---|---|
| trial run #1 DoD 7 件達成度 | 7/7 全件達成 | < 7 件 |
| audit log integrity grep | 35 回全 PASS | 1 回でも FAIL |
| cost cap < $5 | < $5（想定 $4-5） | ≥ $5 |
| 副作用 0 件 | 0 件 | ≥ 1 件 |
| Owner 5/22 push 受容仮確度 | ≥ 70% | < 70% |

→ 5 軸全 continue 判定で trial run #2 GO、1 軸でも abort 判定で trial run #2 中止 → 段階 E (Owner 通知準備) へ skip。

---

## §5 段階 D: 13:00-16:00 trial run #2（3 時間、real subprocess + JSON IF dispatch）

### §5.1 段階 D 概要

| 項目 | 内容 |
|---|---|
| 目的 | real subprocess（mock-claw → real claw mode 切替）+ JSON IF dispatch 経路の本番統合検証 |
| mode | real claw mode（ただし production target は mock 維持、dispatch 経路のみ real subprocess）|
| 負荷 | 中負荷（real subprocess 起動 + Dev-D Round 11 spawn-claude-code 経路 統合）|
| 想定 cost | trial run #1 + trial run #2 累計 < $5（cost cap） |
| audit log 監視 | 5 分間隔 grep 継続 |

### §5.2 段階 D 分単位 timeline（3 時間 = 180 分）

| 時刻 | 担当 | タスク | 完遂条件 |
|---|---|---|---|
| 13:00 | PM-E | trial run #2 trigger 発令 | trigger 配信 |
| 13:00-13:15 | Dev | `spawn-claude-code.ts` (Dev-D Round 11) real subprocess 起動 + adaptRealChildProcess 配線 | real subprocess 起動 |
| 13:15-14:00 | Dev | trial run #2 cycle 1（real subprocess + JSON IF NDJSON dispatch + audit log） | round-trip ≥ 10 record |
| 13:15-14:00 | Review | audit log integrity grep + hash chain integrity 拡張検証（Dev-C Round 11 audit-hash-chain-integrity 9 tests 連動） | hash chain 整合 |
| 14:00-14:15 | PM-E | cycle 1 中間確認 + cost check（想定 累計 $4 程度） | cost ≤ $4 |
| 14:15-15:00 | Dev | trial run #2 cycle 2（同 cycle 1、real subprocess 維持） | round-trip ≥ 10 record |
| 14:15-15:00 | Review | audit log integrity grep 継続 | integrity OK |
| 15:00-15:15 | PM-E | cycle 2 中間確認 + cost check（想定 累計 $4.5 程度） | cost ≤ $4.5 |
| 15:15-16:00 | Dev | trial run #2 cycle 3（同 cycle 1、real subprocess 維持）+ recovery scenario 1 件実行（Dev-C Round 11 recovery-scenarios 8 tests 連動） | round-trip + recovery PASS |
| 15:15-16:00 | Review | audit log integrity grep 継続 + recovery integrity 検証 | integrity OK |
| 16:00 | PM-E | trial run #2 完遂宣言 + 段階 E Owner 通知準備移行 | run #2 完遂 |

### §5.3 段階 D real subprocess 経路 spec

| 経路 | 内容 |
|---|---|
| 起動 | `spawnClaudeCode({ mode: 'subscription', cliPath: '/usr/local/bin/claude-mock', spawner: realSpawner })` |
| 通信 | NDJSON stdout → `extractJsonEvents()` → JSON IF event 配列 |
| audit log | 各 event を SHA-256 hash chain 拡張記録 |
| recovery | abort signal で SIGTERM → 200ms grace → SIGKILL fallback（Dev-A Round 11 SIGTERM→SIGKILL 仕様連動）|
| termination | finished or aborted で hash chain seal record 投入 |

### §5.4 段階 D DoD（trial run #2 完遂判定）

| # | DoD 項目 | 検証主体 | 達成判定 |
|---|---|---|---|
| 1 | real subprocess 起動成功（spawn → finished or aborted）| Dev | exit code 0 or aborted |
| 2 | 各 cycle round-trip ≥ 10 record | Dev | cycle 1/2/3 全件達成 |
| 3 | recovery scenario 1 件実行 PASS | Dev + Review | recovery PASS |
| 4 | cost cap < $5 累計（trial run #1 + #2） | PM-E | 想定 $4.5-5 |
| 5 | audit log hash chain 整合 + recovery integrity 整合 | Review | 全 grep + recovery PASS |
| 6 | 副作用 0 件 | Review | 0 件 |
| 7 | regression 0 件 | Dev | smoke test PASS |

→ 7 件全件達成 = trial run #2 完遂 → 段階 E Owner 通知準備移行。

---

## §6 段階 E: 16:00-17:00 Owner 通知準備（60 分）

### §6.1 段階 E 概要

| 項目 | 内容 |
|---|---|
| 目的 | Owner 17:00 通知に必要な成果サマリ + 残懸念 + 5/22 sign-off 推奨度を CEO + PM 共同で起案 |
| 同席者 | CEO（mandatory）/ PM-E（mandatory）/ Dev リード（option）/ Review リード（option）|
| 成果物 | Owner 中間報告 v1（5 行サマリ + 200-300 行詳細レポート）|

### §6.2 段階 E 分単位 timeline（60 分）

| 時刻 | 担当 | タスク | 完遂条件 |
|---|---|---|---|
| 16:00-16:10 | PM-E + Dev | trial run #1 + #2 統合結果集約（実 needs 抽出件数 + KPI 達成度 + cost cap 達成度） | 統合結果 v1 |
| 16:10-16:25 | CEO + PM-E | 5/22 sign-off push 推奨度起案（GO / HOLD / 5/30 維持 / 完全中止）| 推奨度 v1 |
| 16:25-16:40 | PM-E | 残懸念リスト起案（5 件以内、各々の Round 12 〜 W2 mitigation） | 残懸念 v1 |
| 16:40-16:50 | CEO | Owner 中間報告 v1 5 行サマリ起案 | summary v1 |
| 16:50-16:55 | PM-E | 詳細レポート 200-300 行 Markdown 整形 + Slack 投稿 preview | Slack preview ready |
| 16:55-17:00 | CEO + PM-E | Owner 通知 final 確認 + Slack post 待機 | post ready |

### §6.3 段階 E Owner 中間報告 v1 5 行サマリ template

```markdown
# MS-2 5/15 trial 中間報告 v1（Owner 即決依頼）

1. trial 実施: 5/15 09:00-16:00 / trial run #1 (3h 軽負荷) + run #2 (3h real subprocess) 完遂
2. 結果: needs_scout 出力 {N} 件 / 実 needs 抽出 {M} 件 / round-trip 成功 {K}/{T} record / audit log 整合 {全 PASS / 一部 FAIL}
3. cost: 累計 ${X} / cost cap < $5 {達成 / 超過}
4. 5/22 sign-off push 推奨度: {GO / HOLD / 5/30 維持推奨 / 完全中止}
5. Owner 即決依頼: ① acknowledge → 5/22 sign-off push 採用 / ② HOLD → Round 13 で再評価 / ③ 中止 → 5/30 維持

詳細: /path/to/dev-trial-5-15-result.md（200-300 行、CEO + PM-E + Dev 共同起案）
Slack quick-action: [Approve][HOLD][Reject][中止] 4 択 button
```

---

## §7 段階 F: 17:00 Owner 通知（5 分、Slack quick-action dry-run 検証兼用）

### §7.1 段階 F 概要

| 項目 | 内容 |
|---|---|
| 目的 | Owner Slack push 通知 + Slack quick-action 経路 dry-run 検証（Dev-B Round 11 slack-quick-action.ts 309 行 統合確認）|
| Owner 物理拘束 | 5 分（Slack push 受信 + 詳細リンク確認 + 4 択 button 即決）|
| channel | DEC-019-052 (c) Channel 3 整合（Slack #prj019-owner-trial）|

### §7.2 段階 F 分単位 timeline（5 分）

| 時刻 | 担当 | タスク | 完遂条件 |
|---|---|---|---|
| 17:00 | CEO | Slack #prj019-owner-trial へ Owner 中間報告 v1 post（quick-action 4 択 button 添付）| post 配信 |
| 17:00-17:01 | Owner | Slack push 受信 + 5 行サマリ read | read 完遂 |
| 17:01-17:03 | Owner | 詳細リンク 200-300 行レポート確認 | read 完遂 |
| 17:03-17:05 | Owner | quick-action 4 択 button click（Approve / HOLD / Reject / 中止）| 即決受領 |
| 17:05 | CEO | Owner 即決 acknowledge → Slack thread reply | acknowledge 完遂 |

### §7.3 段階 F Slack quick-action dry-run 検証ポイント

| 検証点 | 内容 |
|---|---|
| 1. push 配信 | Owner DM + #prj019-owner-trial 両方へ配信成功 |
| 2. quick-action button rendering | 4 択 button が Owner Slack 画面で正しく表示 |
| 3. Owner click → webhook 経由 CEO 受信 | webhook payload に decision = "Approve"/"HOLD"/"Reject"/"中止" 含む |
| 4. CEO Slack reply via webhook | reply post が Owner DM へ即時配信 |
| 5. audit log への即決記録 | hash chain に owner-decision-{timestamp} record 投入 |

→ 5 件全件 OK で Slack quick-action 経路 dry-run 完遂、6/27 朝公開時の本番経路 readiness +1pt 押上。

### §7.4 Owner 即決 4 ケース別 後続経路

| Owner 即決 | 後続経路 | Phase 1 sign-off |
|---|---|---|
| ① Approve | 5/22 sign-off push 採用 → DEC-019-059 起票（Round 12 Sec-G）+ MS-3 5/22 公式着手 GO | 5/22 push (5/30 比 8 日前倒し) |
| ② HOLD | Round 13 で再評価 → 5/22 push 暫定 HOLD → 5/22-5/30 期間内に再判定 | 5/22 候補 / 5/30 維持 並行 |
| ③ Reject | 5/22 push 却下 → 5/30 維持 → MS-3 5/22 公式着手は維持 | 5/30 維持 |
| ④ 中止 | trial 結果 abort 判定 → 5/22 公式着手も延期検討（5/26 まで延期可、Phase 1 sign-off 6/3 維持）| 6/3 (W4 buffer 終端) |

---

## §8 段階 G: 17:00-18:00 後処理（60 分）

### §8.1 段階 G タスク分単位 timeline

| 時刻 | 担当 | タスク | 完遂条件 |
|---|---|---|---|
| 17:05-17:20 | Review | audit log archive（trial run #1 + #2 全 log を `audit/archived/2026-05-15/` へ移送 + hash chain seal record 投入）| archive 完遂 |
| 17:05-17:20 | Dev | metric snapshot 取得（cost / wall-clock / KPI 8 件 / regression count）+ Grafana dashboard PNG export | snapshot 完遂 |
| 17:20-17:35 | PM-E | Round 12 progress 反映（dashboard 78% → 81-83% 想定、`progress.md` v12 更新）| progress 更新 |
| 17:20-17:35 | Secretary（option）| `dev-trial-5-15-result.md` 200-300 行レポート最終化 + git commit | commit 完遂 |
| 17:35-17:50 | PM-E | trial run sheet 当日 actual filled 版 v1.1 起案（5/15 21:00 dispatch retro 用）| v1.1 完成 |
| 17:50-18:00 | CEO + PM-E | 5/15 trial 完遂 sign-off + Round 12 残務 5/16 GO 判定 | sign-off 完遂 |

### §8.2 段階 G DoD

| # | DoD 項目 | 検証主体 |
|---|---|---|
| 1 | audit log archive 完遂（trial run #1 + #2 全 log seal）| Review |
| 2 | metric snapshot 取得（cost / KPI / regression）| Dev |
| 3 | Round 12 progress dashboard 反映（78% → 81-83%）| PM-E |
| 4 | trial run sheet v1.1 actual filled 版起案 | PM-E |
| 5 | git commit 完遂（trial 結果 + run sheet v1.1）| Secretary |
| 6 | 5/15 trial 完遂 sign-off acknowledge | CEO |

→ 6 件全件達成 = 5/15 trial 当日 9 時間運用完遂、5/16 朝以降は通常 sprint へ復帰。

---

## §9 abort criteria（kill-switch 発動条件 4 件、即時 Owner 通知）

### §9.1 kill-switch 発動条件

| # | 条件 | 検出方法 | 発動アクション |
|---|---|---|---|
| **1** | **audit log hash chain integrity violation** | 5 分間隔 grep で hash chain 不整合検出 | 即時 trial 中止 + Slack #prj019-owner-trial 緊急 post + audit log dump + Dev/Review 緊急集合 |
| **2** | **cost cap 超過（累計 ≥ $5）** | PM-E 30 分間隔 cost monitor で確認 | 即時 trial 中止 + Owner 通知（cost cap 超過理由 + 5/22 sign-off push 中止勧告）|
| **3** | **副作用検出（本番 system への影響）** | Review tos-monitor (Dev-β 1,344 行) 偽陽性 matrix v2.0 検出 | 即時 trial 中止 + 影響 system 隔離 + Owner 緊急通知 |
| **4** | **wall-clock 超過（19:00 までに段階 G 未完遂）** | PM-E wall-clock 監視 | trial 強制中止 + 進行中 process kill + Owner 中間報告 v1 「wall-clock 超過 = 5/22 push 不適格」即決依頼 |

### §9.2 kill-switch 発動時の即時 Owner 通知 procedure

```
T-0:  検出 → kill-switch.sh 実行
T-1:  進行中 process 全 kill (SIGTERM → 200ms grace → SIGKILL)
T-2:  audit log timestamp 終了 marker `TRIAL-5-15-ABORT-{reason}` 投入
T-3:  Slack #prj019-owner-trial 緊急 post（5 行サマリ「trial abort - {reason}」）
T-4:  Owner Slack push 受信 → 5 分以内 acknowledge or 中止判断即決
T-5:  CEO + PM-E + Dev + Review 緊急集合（Zoom）
T-6:  fallback 3 経路から選択（5/22 push / 5/30 維持 / 完全中止）
T-end: kill-switch 完遂 (想定 wall-clock 30 分)
```

### §9.3 kill-switch 発動時の組織コスト

| 区分 | 失敗時コスト |
|---|---|
| Owner 物理拘束追加 | 5 分のみ（緊急通知 acknowledge）|
| 5/22 公式着手 fallback | 完全吸収（5/22 push 不採用 → 5/30 維持 case へ）|
| Phase 1 sign-off 影響 | 0 日延期（5/30 維持 case = Round 11 PM-D plan 通り）|
| Marketing 公開 6/27 朝影響 | 0 日延期（DEC-019-052 (a)(b)(c) 維持）|

→ kill-switch 発動 = 失敗ペナルティ 0（DEC-019-057 整合、Round 11 PM-D scenario §5.6 整合）。

---

## §10 fallback 3 経路（trial 結果別の後続選択）

### §10.1 経路 1: 5/22 sign-off push 採用（Owner Approve case）

| 条件 | trial 完全成功 + Owner Approve |
|---|---|
| 後続 | DEC-019-059 起票（Round 12 Sec-G）+ MS-3 5/22 公式着手 GO + Phase 1 sign-off 5/22 候補日確定 |
| timeline | 5/22 sign-off → 6/27 朝公開（DEC-019-052 維持）+ 5/30 → 5/22 8 日前倒し |
| 確度押上 | 5/22 push 採択時 → Phase 1 sign-off 確度 80% → **88-90%** |
| 残懸念 | 必須 50 軸 95% 達成（5/22 時点 100%、Round 11 PM-D §4.1 §3.3 5/22 EOD 100% 達成 trajectory 整合）|

### §10.2 経路 2: 5/30 維持（Owner Reject or HOLD case）

| 条件 | trial 部分成功 + Owner HOLD/Reject、または kill-switch 発動 #2/#3/#4 |
|---|---|
| 後続 | MS-3 5/22 公式着手は維持（mock 中心）+ Phase 1 sign-off 5/30 維持 + Round 11 PM-D plan 通り進行 |
| timeline | 5/22 公式着手 → 5/30 sign-off → 6/27 朝公開（Round 11 PM-D plan 整合）|
| 確度押上 | なし（Round 11 PM-D plan 維持、確度 78%）|
| 残懸念 | trial 結果反映で sprint plan v1.1 微調整必要 |

### §10.3 経路 3: 完全中止（kill-switch 発動 #1 audit integrity violation case）

| 条件 | audit log hash chain integrity violation 検出（最重大）|
|---|---|
| 後続 | 5/22 公式着手も延期（5/26 までに整合性復旧 + 再 trial 計画）+ Phase 1 sign-off 6/3（W4 buffer 終端）へ後ろ倒し |
| timeline | 5/15 trial 中止 → 5/16-5/22 hash chain integrity 緊急修正 → 5/22-5/26 再 trial → 5/26 公式着手 → 6/3 sign-off |
| 確度押上 | 大幅悪化（Phase 1 sign-off 確度 88% → 70%）|
| 残懸念 | DEC-019-054 hash chain integrity 設計再検証 + Dev-C Round 11 audit-hash-chain-integrity 9 tests 拡張必要 |

### §10.4 fallback 3 経路の選択判定マトリクス

| trial 結果 | Owner 即決 | 選択 fallback 経路 |
|---|---|---|
| 成功 7/7 + Owner Approve | Approve | **経路 1: 5/22 push** |
| 成功 7/7 + Owner HOLD | HOLD | **経路 2: 5/30 維持**（Round 13 で再評価）|
| 成功 7/7 + Owner Reject | Reject | **経路 2: 5/30 維持** |
| 部分成功（5-6/7）+ Owner 任意 | 任意 | **経路 2: 5/30 維持** |
| 部分成功（≤4/7）+ Owner 任意 | 任意 | **経路 2: 5/30 維持** または ad-hoc |
| kill-switch #1 audit integrity violation | 中止 | **経路 3: 完全中止** |
| kill-switch #2 cost cap 超過 | 中止 | **経路 2: 5/30 維持** |
| kill-switch #3 副作用検出 | 中止 | **経路 3: 完全中止**（副作用範囲次第で経路 2）|
| kill-switch #4 wall-clock 超過 | 中止 | **経路 2: 5/30 維持** |

---

## §11 Round 12 Dev-A〜E 完遂タスクとの依存関係表

### §11.1 Round 12 Dev-A〜E 主タスク（CEO Round 11 v12 §9 引用）

| Agent | 主タスク | 5/15 trial 依存度 |
|---|---|---|
| Dev-A | NFKC 正規化 layer + denylist YAML 直書き化 (CB-D-W3-01) | **HIGH**（denylist filter 完全準拠が trial run #1 §3.4 DoD #1 前提）|
| Dev-B | tos-monitor primitive 採用 refactor + Slack webhook POST 配線 + IsolationGuard 直接配線 | **HIGH**（Slack webhook = §7.3 Slack quick-action dry-run 検証兼用 / IsolationGuard = §3.4 DoD #6 副作用 0 件前提）|
| Dev-C | real child_process.spawn 統合 + NDJSON 対応 + e2e 5/8 朝検証 | **CRITICAL**（trial run #2 §5.3 real subprocess 経路 spec 直結、5/15 当日まで完遂必須）|
| Dev-D | kill-switch.registerSubprocessKill wiring + index.ts barrel export | **CRITICAL**（§9.2 kill-switch 発動時の即時 process kill 経路前提）|
| Dev-E | Phase 1 sign-off 5/22 push 評価（W3 22 日前倒しを sign-off に反映可否） | **MEDIUM**（trial 結果 + Dev-E 評価が §10 fallback 経路 1 採用判断連動）|

### §11.2 Round 12 完遂期限（5/14 EOD まで）

| Agent | 完遂期限 | 完遂しない場合の影響 |
|---|---|---|
| Dev-A | 5/13 EOD | trial run #1 cycle 1 denylist filter 完全準拠不可 → trial 部分成功 |
| Dev-B | 5/14 EOD | Slack webhook = quick-action 検証不可 / IsolationGuard 副作用検出不可 → trial 中止リスク |
| Dev-C | **5/14 朝**（5/14 18:00 GO 判定会議までに必須） | real subprocess 経路成立せず → trial run #2 GO 不可 → 部分 trial で経路 2 fallback 確定 |
| Dev-D | **5/14 朝**（5/14 18:00 GO 判定会議までに必須） | kill-switch 発動経路成立せず → trial run #1/#2 GO 不可 → trial 完全中止 |
| Dev-E | 5/14 EOD | 5/22 push 推奨度 v1 不在 → §6.2 Owner 通知準備で CEO ad-hoc 判定（精度低下）|

### §11.3 Round 12 Dev-A〜E 完遂前提でのみ trial GO

| 完遂状況 | 5/15 trial 実施判定 |
|---|---|
| Dev-A〜E 全件完遂 | **GO**（5/15 trial 9 時間運用） |
| Dev-A/B/E のみ完遂、Dev-C/D 未完遂 | **CONDITIONAL HOLD** → 5/14 18:00 GO 判定会議で再評価 |
| Dev-C/D いずれか未完遂 | **NO-GO** → trial 5/15 → 5/22 へ 7 日延期、または完全中止 |

---

## §12 trial 当日 監視 dashboard + 主要 KPI

### §12.1 監視 dashboard 主要 panel

| Panel | 表示内容 | 更新頻度 |
|---|---|---|
| 1. wall-clock progress | 9 時間 9 段階の進捗 bar | 1 分 |
| 2. cost monitor | trial run #1 + #2 累計コスト + cost cap $5 残量 | 30 秒 |
| 3. audit log integrity | 5 分間隔 grep 結果（PASS/FAIL カウント）| 5 分 |
| 4. round-trip success rate | needs_scout → JSON IF → mock-claw → audit log の round-trip 成功率 | 1 分 |
| 5. real subprocess status | trial run #2 期間中の real subprocess pid + stdout/stderr line count | 30 秒 |
| 6. kill-switch status | 4 条件 status（trigger ready / armed / fired）| 1 分 |
| 7. owner notification status | 17:00 Slack post status + Owner acknowledge timestamp | 5 分 |
| 8. regression test count | Round 11 614 tests pass 維持確認 | 30 分 |

### §12.2 trial 当日 主要 KPI 12 件

| # | KPI | 目標値 | 達成判定基準 | 検証主体 |
|---|---|---|---|---|
| 1 | trial run #1 cycle 完遂数 | 3 cycle | 12:00 時点で cycle 3 終了 | Dev |
| 2 | trial run #2 cycle 完遂数 | 3 cycle | 16:00 時点で cycle 3 終了 | Dev |
| 3 | needs_scout 出力件数（trial 全体）| ≥ 36 件 fetch | 6 cycle × 6 件以上 | Dev |
| 4 | filter 後出力件数（trial 全体） | ≥ 24 件 | filter 後 4 件 × 6 cycle | Dev |
| 5 | round-trip 成立件数（trial 全体）| ≥ 24 record | filter 後全件成功 | Dev |
| 6 | 実 needs 抽出件数（trial 全体）| ≥ 1-2 件 | mock-claw "viable" 判定 | Dev + PM-E |
| 7 | audit log integrity grep PASS 率 | 100% | 全 grep PASS | Review |
| 8 | cost cap 達成 | < $5 累計 | trial 終了時 | PM-E |
| 9 | wall-clock 達成 | ≤ 9 時間 (08:30-18:00) | 段階 G 完遂 | PM-E |
| 10 | Owner 物理拘束 | ≤ 5 分 | 17:00-17:05 acknowledge | Owner |
| 11 | 副作用 0 件 | 0 件 | tos-monitor 偽陽性 matrix v2.0 検出 0 件 | Review |
| 12 | regression 0 件 | 0 件 | 614 tests pass 維持 | Dev |

→ 12 件全件達成 = trial 完全成功 = 経路 1 (5/22 push) 採用最有力。10-11 件達成 = 部分成功 = 経路 2 (5/30 維持)。≤9 件達成 = 経路 3 (完全中止) または再 trial 検討。

---

## §13 trial 完遂後の Round 12-13 引継

### §13.1 5/15 trial 完遂後 Round 12 残務

| Round 12 残務 | 担当 | 期限 |
|---|---|---|
| trial 結果集計テンプレ起票 | PM-E + Dev | 5/15 EOD |
| `dev-trial-5-15-result.md` 200-300 行レポート最終化 + git commit | Secretary | 5/15 EOD |
| Round 12 progress dashboard 反映（78% → 81-83%）| PM-E + Secretary | 5/15 EOD |
| DEC-019-059 起票（trial 結果反映 + Round 12 authorization）| Secretary-G | 5/16 朝 |
| 5/22 push 採択 case の Round 13 dispatch 構成起案 | PM-E（本書姉妹文書）| 5/15 EOD |
| 5/30 維持 case の Round 13 dispatch 構成起案 | PM-E（本書姉妹文書）| 5/15 EOD |

### §13.2 Round 13 dispatch 想定構成（5/16 起動）

| 経路 | Round 13 主要 dispatch |
|---|---|
| 経路 1 (5/22 push) | Dev-A〜E continue + Sec-G DEC-019-059 起票 + Marketing-F portfolio 残埋め + Knowledge-H INDEX-v3 |
| 経路 2 (5/30 維持) | Round 11 PM-D W1-W2 sprint plan 通り（5/16 W1 day 4 進行）|
| 経路 3 (完全中止) | Round 13 緊急 dispatch（hash chain integrity 緊急修正 + Dev-C audit-hash-chain-integrity 拡張）|

---

## §14 結論（DoD 達成判定）

1. **5/15 当日 09:00-18:00 9 時間 9 段階 timeline 確定** (§1.1 + §2-§8): 段階 A〜G + Owner 通知。
2. **08:30-09:00 起動準備 30 分 + 10 件チェックリスト** (§2): 環境変数 / 1Password CLI / 監視 dashboard。
3. **09:00-12:00 trial run #1 (3h continuous)** (§3): cost cap < $5 + audit log integrity 5 分間隔 grep + 7 件 DoD。
4. **12:00-13:00 中間 review CEO + PM 同席判定** (§4): 5 軸全 continue で trial run #2 GO。
5. **13:00-16:00 trial run #2 (real subprocess + JSON IF dispatch)** (§5): 7 件 DoD。
6. **16:00-17:00 Owner 通知準備** (§6): 5 行サマリ + 200-300 行詳細 + 5/22 sign-off push 推奨度。
7. **17:00 Owner 通知 (Slack quick-action 経路 dry-run 検証兼用)** (§7): Owner 物理拘束 5 分 + 4 択 button 即決。
8. **17:00-18:00 後処理** (§8): audit log archive / metric snapshot / Round 12 progress 反映 / 6 件 DoD。
9. **abort criteria 4 件 (kill-switch)** (§9): audit integrity / cost cap / 副作用 / wall-clock 超過。
10. **fallback 3 経路** (§10): 5/22 push / 5/30 維持 / 完全中止。
11. **Round 12 Dev-A〜E 完遂タスク依存表** (§11): Dev-C/D が CRITICAL (5/14 朝必須)。
12. **trial 当日 監視 dashboard + 主要 KPI 12 件** (§12): 12 件全件達成 = trial 完全成功。

→ **MS-2 trial 準備度 = CONDITIONAL GO**（5/14 18:00 GO 判定会議 + 5/8 議決-26 Conditional 採択 + drill #2 5/8 朝 Pass + Round 12 Dev-A〜E 完遂の 4 件成立条件）= DoD 達成。

---

## §15 関連決裁・参照

### §15.1 反映決裁

- DEC-019-007 (HITL 11 種、第 9 種 dev_kickoff_approval mock approve in trial)
- DEC-019-010 (13-domain denylist Object.freeze、§3.4 DoD #1 前提)
- DEC-019-025 (Agent tool permissions SOP、本書も general-purpose 経由 dispatch 遵守)
- DEC-019-050 (Anthropic spend cap $30、trial cost cap < $5 維持)
- DEC-019-052 (a)(b)(c) (Marketing tone B + Channel 3、§7 Slack #prj019-owner-trial 整合)
- DEC-019-053 (2-tier env、trial mode は dev tier、本番 system 影響無)
- DEC-019-054 (Round 7 ハッシュチェイン、§3.3 audit log integrity grep 直結)
- DEC-019-055 (Round 8 Plan 8-Full、prefetch 50-55% 完遂前提)
- DEC-019-056 (Round 9 起票済、議決-26 Conditional 採択前提)
- DEC-019-057 (confirmed、案 C + MS-2 trial 採用)
- DEC-019-058 (confirmed、Round 11 9 並列 dispatch authorization)
- DEC-019-059（Round 12 Sec-G 起票予定、trial 結果反映）

### §15.2 参照書

- `pm-round11-ms2-5-15-trial-scenario.md`（Round 11 PM-D deliverable 2、489 行）— 親文書
- `pm-round11-w1-w2-short-sprint.md`（Round 11 PM-D deliverable 3、472 行）— W1 day 3 (5/15) 整合
- `pm-round11-decision-26-final-confirmation.md`（Round 11 PM-D deliverable 1、417 行）— 議決-26 Lv 4+ 連動
- `ceo-round11-integrated-report-v12.md`（CEO Round 11 統合報告 v12、186 行）— Round 12 dispatch preview 整合
- `dev-round11-A-denylist-subprocess.md`（Round 11 Dev-A、SIGTERM→SIGKILL 仕様連動）
- `dev-round11-B-tos-residual-slack.md`（Round 11 Dev-B、slack-quick-action 309 行 連動）
- `dev-round11-C-e2e-hash-recovery.md`（Round 11 Dev-C、audit-hash-chain-integrity 9 tests 連動）
- `dev-round11-D-subscription-cli.md`（Round 11 Dev-D、spawn-claude-code 363 行 連動）
- `review-round11-50-controls-95-roadmap.md`（Round 11 Review-C、必須 50 軸 trajectory 連動）

### §15.3 Risk Register v3.2 整合

- R-019-06 (BAN 30-60% / 12 ヶ月): trial dry-run mode + mock 中心で BAN リスクなし
- R-019-09 (NG-3 24/7 監視): tos-monitor 1,344 行 trial 期間中 24/7 監視継続
- R-019-10 (重要分野ホワイトリスト未確定): minor 16 件 denylist Round 12 Dev-A 完遂で完全緑化 trial 前提
- R-RUSH-01〜04: trial 失敗時組織コスト 0 で R-RUSH 系発動なし

---

## フッタ — 改版履歴

| 版 | 日付 | 起案 | 主要変更 |
|---|---|---|---|
| v1 | 2026-05-04（Round 12 PM-E dispatch 起案） | PM 部門（PM-E 独立 Agent） | 初版（5/15 当日 9 時間 9 段階 timeline 分単位 + abort criteria 4 件 + fallback 3 経路 + Round 12 Dev-A〜E 依存表 + 主要 KPI 12 件）|

**v1 確定**: 2026-05-04（Round 12 PM-E dispatch 完遂時） / **採用判断**: 5/14 18:00 GO 判定会議で final acknowledge / **次回更新**: 5/15 trial 当日 EOD 段階 G 後 v1.1（actual filled 版）/ 5/16 朝 v1.2（trial 結果反映 + Round 13 dispatch 連動）

## フッタ詳細

- 文書: `projects/PRJ-019/reports/pm-round12-ms2-5-15-trial-runsheet.md`
- 版: v1（2026-05-04、Round 12 PM-E 担当 deliverable 1）
- 起案: PM 部門（PM-E 独立 Agent）
- 範囲: 5/15 当日 9 時間 9 段階分単位 timeline + 監視 dashboard + abort criteria + fallback 3 経路 + Round 12 Dev-A〜E 依存表
- 検収: CEO（Round 12 commit 時）+ Owner（5/15 17:00 Slack quick-action acknowledge）+ Dev/Review（5/14 18:00 GO 判定会議 + 5/15 当日執行）
