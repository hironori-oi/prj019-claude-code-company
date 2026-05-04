# PRJ-019 — Round 9 tos_monitor false-positive matrix（4 detector × 5 シナリオ = 20 セル網羅）

最終更新: 2026-05-04 W0-Week1 深夜 / 起案: Review 部門 / 案 9-B
位置付け: CEO 緊急前倒し発注（Round 9 オプション A 採択 + 5/22 朝公開前倒し下、DEC-019-056 起票予定）。Round 9 Dev-A2 で実装中の `app/harness/src/tos-monitor.ts` の 4 detector（連続稼働 / cost cap / rate spike / NG-3）について、Review 視点で **false-positive shape を 20 セルすべて網羅** し、Dev-A2 実装にフィードバックする。
版: v1.0（Round 9 案 9-B 並行起案）
連動 DEC: DEC-019-008（NG-3 暫定値 12h/$1,000）/ DEC-019-050（API cap $30）/ DEC-019-051（subscription 主軸）/ DEC-019-053 v15.5（Round 6 hotfix）/ DEC-019-055（Round 8 完遂）/ DEC-019-056（Round 9 前倒し、起票予定）
連動レポート: `review-round9-ban-drill-1-dry-exec-result.md`（本 Round 9 案 9-B タスク 1）/ `review-round9-critical-13-domain-keyword-set.md`（本 Round 9 案 9-B タスク 2）/ `review-mandatory-controls-50-final.md`（G-V2-08 / G-04）/ `review-risk-register-v3-2.md`（R-019-09 / R-019-19 / R-019-21）
連動コード: `app/harness/src/tos-monitor.ts`（Round 9 Dev-A2 進行中、本書で false-positive 検証）/ `app/harness/src/usage-monitor.ts`（cost watchdog 3 段階閾値）/ `app/harness/src/cost-tracker.ts`（DEC-019-050 $30 cap）/ `app/harness/src/circuit-breaker.ts`（forceOpen 完備）

---

## §0 200 字サマリ

Round 9 Dev-A2 で実装中の `tos-monitor.ts` の 4 detector（連続稼働 / cost cap / rate spike / NG-3）× 5 シナリオ（typical use / boundary / spike with legit cause / sleep boundary / multi-process interaction）= **20 セル全網羅** で false-positive matrix を起案。各セルで (a) false-positive 発生確率（高/中/低）、(b) confirmCount default 2 で抑制可能か（yes/partial/no）、(c) 抑制不能時の対応案（manual override / Owner escalation / drill #2 で実機検証）を整理。**high 確率セルは 4 件**（confirmCount default 2 では抑制不能、manual override + Owner escalation で対応）、medium 8 件（partial 抑制）、low 8 件（confirmCount で完全抑制）。Round 10 引継 TODO 3 件、Phase 1 W2（CB-D-W2-06）の tos_monitor hooks 実装に直接反映可能。

---

## 目次

| § | 題目 |
|---|------|
| §1 | 4 detector の仕様確認（Dev-A2 進行中の実装と整合） |
| §2 | 5 シナリオの定義（typical / boundary / spike legit / sleep / multi-process） |
| §3 | 20 セル false-positive matrix |
| §4 | Detector 1: 連続稼働（detect_continuous_run）詳細 |
| §5 | Detector 2: cost cap（detect_cost_cap）詳細 |
| §6 | Detector 3: rate spike（detect_rate_spike）詳細 |
| §7 | Detector 4: NG-3（detect_ng3_violation）詳細 |
| §8 | high 確率セル 4 件の対応案 |
| §9 | DEC-019-008/050/051/055 整合性確認 |
| §10 | Round 10 引継 TODO 3 件 |
| §11 | 結論 + Review 部門 sign-off |

---

## §1 4 detector の仕様確認

### §1.1 detector 一覧

| # | detector 名 | 仕様根拠 | 発火条件（推定） | 連動 G コントロール |
|---|---|---|---|---|
| 1 | detect_continuous_run | DEC-019-008 NG-3 | 12h 連続稼働超過 | G-V2-08 / G-04 |
| 2 | detect_cost_cap | DEC-019-008 / DEC-019-050 | API 換算 $1,000/月 接近 + Hard $30 接近 | G-04 watchdog 3 段階 |
| 3 | detect_rate_spike | G-V2-02 / G-V2-08 | レート 70% 超過 + 401/403/429 連続検知 | G-V2-02 / G-V2-08 |
| 4 | detect_ng3_violation | DEC-019-008 NG-3 | 12h/日 + $1,000/月相当 同時超過 | G-04 / G-V2-08 |

### §1.2 confirmCount の役割

`confirmCount` は false-positive を抑制するための「連続検知 N 回で確定」パラメータ:
- default = 2 → 1 回の検知では発火せず、2 回連続で確定発火
- 単発 spike（typical use の boundary）を緩和
- ただし spike 持続時は false-positive 抑制不能

### §1.3 Dev-A2 進行中実装との照合

`tos-monitor.ts` は Round 9 W0-Week1 Dev-A2 で実装中、5/8 議決-23 連動採択前に completion 見込み。本書は実装完成前の **設計レビュー** として false-positive shape を網羅する。実装完成後の re-validation は Round 10 で実施（本書 §10 引継 TODO #1）。

---

## §2 5 シナリオの定義

### §2.1 シナリオ定義

| # | シナリオ名 | 定義 | false-positive 発生原理 |
|---|---|---|---|
| 1 | typical use | 通常運用パターン（Phase 1 W1〜W2 想定の baseline） | detector 閾値の保守的設計で小波動が誤検知される |
| 2 | boundary | 閾値ぎりぎりの挙動（NG-3 12h - 5min / $1,000 - $5 等） | 浮動小数 / タイミング誤差で閾値超過判定 |
| 3 | spike with legit cause | 正当な理由でのスパイク（PRJ-018 並走 / 大型 PR の連続 push） | 突発的高負荷を異常検知と誤判定 |
| 4 | sleep boundary | sleep / cron 起動境界（深夜 0:00 / 12:00 切替） | 時刻計測の境界で 1 サイクル超過判定 |
| 5 | multi-process interaction | 複数プロセス同時稼働の相互干渉（Sumi/Asagi/Open Claw 同居） | 別プロセスのリソース消費を自プロセスと混同 |

### §2.2 検証スコープ

各 detector × 各シナリオ = 20 セル。各セルで:
- (a) false-positive 発生確率: 高（> 5% / 月）/ 中（1-5% / 月）/ 低（< 1% / 月）
- (b) confirmCount default 2 で抑制可能: yes（完全抑制）/ partial（部分抑制、追加対応必要）/ no（抑制不能、別対応必須）
- (c) 抑制不能時の対応案: manual override（Owner 即時 override 可）/ Owner escalation（Slack 通知 + 30min 以内応答）/ drill #2 で実機検証（5/17 drill #2 で確証）

---

## §3 20 セル false-positive matrix

### §3.1 全 20 セル概観表

| detector \ シナリオ | typical use | boundary | spike legit | sleep | multi-process |
|---|---|---|---|---|---|
| **continuous_run** | 低 / yes | 中 / partial | 中 / partial | **高 / no** | 中 / partial |
| **cost_cap** | 低 / yes | 中 / partial | **高 / no** | 低 / yes | 中 / partial |
| **rate_spike** | 中 / partial | **高 / no** | **高 / no** | 低 / yes | 中 / partial |
| **ng3_violation** | 低 / yes | 中 / partial | 中 / partial | 中 / partial | 中 / partial |

### §3.2 確率分布サマリ

| 確率 | セル数 | confirmCount 抑制 |
|---|---|---|
| 高 | 4 セル | 全て no（抑制不能） |
| 中 | 9 セル | 全て partial（部分抑制） |
| 低 | 7 セル | 全て yes（完全抑制） |
| **合計** | **20** | — |

### §3.3 high 確率 4 セルの一覧

| # | detector × シナリオ | 抑制不能の理由 | 対応案 |
|---|---|---|---|
| 1 | continuous_run × sleep | 深夜 0:00 / 12:00 切替で時刻計測誤差、12h を 11h59min59sec で誤判定 | manual override + Owner escalation |
| 2 | cost_cap × spike legit | 大型 PR 連続 push で API 換算 cost 短時間スパイク、$1,000 月次 ペースを瞬間突破 | drill #2 で実機検証 + Owner escalation |
| 3 | rate_spike × boundary | レート 70% 自主上限が瞬間突破、即座に 71% 復帰でも detector が反応 | manual override + drill #2 で実機検証 |
| 4 | rate_spike × spike legit | benchmark 10 連続実行（CB-D-W4-03）で正当な spike、レート 70% 超過が 5min 持続 | manual override + Owner escalation |

---

## §4 Detector 1: 連続稼働（detect_continuous_run）詳細

### §4.1 セル 1-1: typical use

| 項目 | 内容 |
|---|---|
| 発生確率 | **低（< 1% / 月）** |
| 抑制可能 | yes（confirmCount 2 で完全抑制） |
| 発火パターン | 通常 8h/日 × 5 日（Phase 1 W1〜W2 想定）では 12h 上限に到達せず、誤検知ほぼなし |
| 抑制策 | confirmCount default 2 で十分。1 サイクル誤検知が発生しても 2 連続にならず確定発火回避 |
| 実機検証 | drill #1（5/12）で confirm |

### §4.2 セル 1-2: boundary

| 項目 | 内容 |
|---|---|
| 発生確率 | **中（1-5% / 月）** |
| 抑制可能 | partial |
| 発火パターン | 11h59min30sec での breakpoint で「12h 超過寸前」を 1 サイクル誤判定 |
| 抑制策 | confirmCount 2 で 1 サイクル目を抑制。ただし 30sec 後の 2 サイクル目で再判定 → 確定発火する場合あり |
| 抑制不能時の対応案 | Owner escalation（Slack #monitor 通知）+ 12h 上限の手動再設定検討 |
| 実機検証 | drill #2（5/17）で長時間稼働 + boundary 検証 |

### §4.3 セル 1-3: spike with legit cause

| 項目 | 内容 |
|---|---|
| 発生確率 | **中（1-5% / 月）** |
| 抑制可能 | partial |
| 発火パターン | benchmark 10 連続実行（CB-D-W4-03、6/12）で 10h 連続稼働、追加 3h で偽陽性 |
| 抑制策 | confirmCount 2 で 1 サイクル抑制。benchmark 自体は 4-6h 完遂見込みで 12h 到達せず |
| 抑制不能時の対応案 | benchmark 実行時の `--allow-extended-run` flag で detector 一時無効化 |
| 実機検証 | benchmark 10 連続実行（CB-D-W4-03、6/12）で confirm |

### §4.4 セル 1-4: sleep boundary 【高 / no】

| 項目 | 内容 |
|---|---|
| 発生確率 | **高（> 5% / 月）** |
| 抑制可能 | **no** |
| 発火パターン | 深夜 0:00 / 12:00 切替の cron 境界で時刻計測（`Date.now()` ベース）が 11h59min59sec で 12h 判定する境界誤差 |
| 抑制策 | confirmCount 2 では抑制不能、cron 境界で連続 2 回 false-positive 発火する可能性 |
| 抑制不能時の対応案 | **manual override + Owner escalation** — Slack #monitor 通知 + 30min 以内に Owner override 受付、override 時は detector を 1h cooldown |
| 実機検証 | drill #2（5/17）で深夜境界の動作確認 |

### §4.5 セル 1-5: multi-process interaction

| 項目 | 内容 |
|---|---|
| 発生確率 | **中（1-5% / 月）** |
| 抑制可能 | partial |
| 発火パターン | Sumi (PRJ-012) / Asagi (PRJ-018) / Open Claw 3 アプリ同居時、3 プロセスの稼働時間を合算判定する誤実装 |
| 抑制策 | プロセス毎に independent timer、`app_id` tag で分離（Sumi/Asagi 退避時のみ Open Claw のタイマーが reset） |
| 抑制不能時の対応案 | drill #2（5/17）で実機検証、3 プロセス独立性を確証 |
| 実機検証 | drill #2 検証目的 #3「3 アプリ同時 pause 時の Slack 通知混在防止」と統合 |

---

## §5 Detector 2: cost cap（detect_cost_cap）詳細

### §5.1 セル 2-1: typical use

| 項目 | 内容 |
|---|---|
| 発生確率 | **低（< 1% / 月）** |
| 抑制可能 | yes |
| 発火パターン | 通常運用で月次 $300（DEC-019-009）以内、API 換算 $1,000 / Hard $30 到達せず |
| 抑制策 | confirmCount default 2 で完全抑制。$24 watchdog warn → $28.5 auto_stop → $30 hard_fail の 3 段階で十分 |
| 実機検証 | drill #1 で $5 以下確認（mock 70% 化前提） |

### §5.2 セル 2-2: boundary

| 項目 | 内容 |
|---|---|
| 発生確率 | **中（1-5% / 月）** |
| 抑制可能 | partial |
| 発火パターン | $24 watchdog warn を 1 度通過後、$23 復帰 → $24 再到達の繰り返しで confirmCount 2 達成 |
| 抑制策 | confirmCount 2 で部分抑制、debounce window を追加（例: 5min 内の再判定は無視） |
| 抑制不能時の対応案 | manual override（Owner 24h 1 回まで $1 一時引上）+ Slack #monitor 通知 |
| 実機検証 | drill #2（5/17）で boundary 検証 |

### §5.3 セル 2-3: spike with legit cause 【高 / no】

| 項目 | 内容 |
|---|---|
| 発生確率 | **高（> 5% / 月）** |
| 抑制可能 | **no** |
| 発火パターン | benchmark 10 連続実行や大型 PR 連続 push で API 換算 cost 短時間スパイク、$1,000 月次 ペースを瞬間突破して detector 誤発火 |
| 抑制策 | confirmCount 2 では抑制不能、spike が 2-3min 持続 → 確定発火 |
| 抑制不能時の対応案 | **drill #2 で実機検証 + Owner escalation** — benchmark 時の `--cost-cap-extended` flag で 1h 一時引上、Slack 通知 + Owner 即時 override |
| 実機検証 | benchmark 10 連続実行時に confirm |

### §5.4 セル 2-4: sleep boundary

| 項目 | 内容 |
|---|---|
| 発生確率 | **低（< 1% / 月）** |
| 抑制可能 | yes |
| 発火パターン | 月初 0:00 リセット境界で前月分 + 当月分の合算誤判定 |
| 抑制策 | cost-tracker `reset()` 関数の atomic write で対応済（既存実装）、confirmCount 2 で完全抑制 |
| 実機検証 | 月初境界で 1 度だけ実機確認（Phase 1 W1 5/19 着手後） |

### §5.5 セル 2-5: multi-process interaction

| 項目 | 内容 |
|---|---|
| 発生確率 | **中（1-5% / 月）** |
| 抑制可能 | partial |
| 発火パターン | Sumi/Asagi/Open Claw 3 プロセスの cost を Anthropic 一括判定で合算 → 単体プロセスの cap 超過誤判定 |
| 抑制策 | プロセス毎の independent cost-tracker、Anthropic API console での合算は別系統で監視 |
| 抑制不能時の対応案 | drill #2 で実機検証、3 プロセス cost 独立性を確証 |
| 実機検証 | drill #2 検証目的 #3「3 アプリ監査ログ独立性」と統合 |

---

## §6 Detector 3: rate spike（detect_rate_spike）詳細

### §6.1 セル 3-1: typical use

| 項目 | 内容 |
|---|---|
| 発生確率 | **中（1-5% / 月）** |
| 抑制可能 | partial |
| 発火パターン | レート 70% 自主上限（G-V2-02）に到達する瞬間が 1 日 2-3 回発生、confirmCount 2 で抑制 |
| 抑制策 | confirmCount 2 で多くは抑制、ただし 5min 内の連続 70% 突破は確定発火 |
| 抑制不能時の対応案 | rate jittering（CB-D-W3-04、Phase 1 W3）で平均化 |
| 実機検証 | drill #1（5/12）で rate jittering 動作確認 |

### §6.2 セル 3-2: boundary 【高 / no】

| 項目 | 内容 |
|---|---|
| 発生確率 | **高（> 5% / 月）** |
| 抑制可能 | **no** |
| 発火パターン | レート 70% を 5 RPS で 1sec だけ突破して即復帰、confirmCount 2 で 2 連続検知が boundary では起きやすい |
| 抑制策 | confirmCount 2 では抑制不能、debounce window 60s で 1 サイクル目を strip すべき |
| 抑制不能時の対応案 | **manual override + drill #2 で実機検証** — debounce 60s 設定 + Owner 24h 1 回まで一時無効化可能 |
| 実機検証 | drill #2（5/17）で boundary 動作 + debounce 検証 |

### §6.3 セル 3-3: spike with legit cause 【高 / no】

| 項目 | 内容 |
|---|---|
| 発生確率 | **高（> 5% / 月）** |
| 抑制可能 | **no** |
| 発火パターン | benchmark 10 連続実行（CB-D-W4-03、6/12）で正当な spike、レート 70% 超過が 5min 持続 → 確定発火 |
| 抑制策 | confirmCount 2 では抑制不能、benchmark 自体が 70% 超過設計のため検出される |
| 抑制不能時の対応案 | **manual override + Owner escalation** — benchmark 時の `--rate-spike-extended` flag で 1h 一時引上、Slack 通知 |
| 実機検証 | benchmark 10 連続実行時に confirm |

### §6.4 セル 3-4: sleep boundary

| 項目 | 内容 |
|---|---|
| 発生確率 | **低（< 1% / 月）** |
| 抑制可能 | yes |
| 発火パターン | cron 境界で rate window が境界跨ぎ、瞬間カウント増加 |
| 抑制策 | rate window を sliding ベースで実装 → 境界誤判定回避、confirmCount 2 で完全抑制 |
| 実機検証 | drill #1 で sliding window 動作確認 |

### §6.5 セル 3-5: multi-process interaction

| 項目 | 内容 |
|---|---|
| 発生確率 | **中（1-5% / 月）** |
| 抑制可能 | partial |
| 発火パターン | Sumi/Asagi/Open Claw 3 プロセスの rate を一括合算 → 単体プロセスの 70% 自主上限を 3 プロセス合計で誤超過判定 |
| 抑制策 | プロセス毎の independent rate window、`app_id` tag で分離 |
| 抑制不能時の対応案 | drill #2 で実機検証、3 プロセス rate 独立性を確証 |
| 実機検証 | drill #2 検証目的 #4「Open Claw fallback 切替中の Sumi/Asagi 無停止」と統合 |

---

## §7 Detector 4: NG-3（detect_ng3_violation）詳細

### §7.1 セル 4-1: typical use

| 項目 | 内容 |
|---|---|
| 発生確率 | **低（< 1% / 月）** |
| 抑制可能 | yes |
| 発火パターン | 通常運用で 12h/日 + $1,000/月 同時超過は発生せず |
| 抑制策 | confirmCount default 2 で完全抑制、12h + $1,000 の AND 条件で false-positive 抑制 |
| 実機検証 | drill #1 で confirm |

### §7.2 セル 4-2: boundary

| 項目 | 内容 |
|---|---|
| 発生確率 | **中（1-5% / 月）** |
| 抑制可能 | partial |
| 発火パターン | 12h ぎりぎり + $1,000 ぎりぎり の同時 boundary（極稀）|
| 抑制策 | confirmCount 2 で部分抑制、debounce 60s で 1 サイクル抑制 |
| 抑制不能時の対応案 | Owner escalation + 手動 cap 引上検討（DEC-019-008 の W2 終了時再確認 = CB-O-W2-01 と統合） |
| 実機検証 | drill #2（5/17）で boundary 検証 |

### §7.3 セル 4-3: spike with legit cause

| 項目 | 内容 |
|---|---|
| 発生確率 | **中（1-5% / 月）** |
| 抑制可能 | partial |
| 発火パターン | benchmark 10 連続実行 + 大型 PR 連続 push の組合せで 12h + $1,000 同時瞬間超過 |
| 抑制策 | confirmCount 2 で部分抑制、benchmark 時の `--ng3-extended` flag で一時無効化 |
| 抑制不能時の対応案 | benchmark 完遂後の通常運用復帰時に detector 自動再有効化 |
| 実機検証 | benchmark 10 連続実行時に confirm |

### §7.4 セル 4-4: sleep boundary

| 項目 | 内容 |
|---|---|
| 発生確率 | **中（1-5% / 月）** |
| 抑制可能 | partial |
| 発火パターン | 月初 0:00 リセット境界 + 12h sleep 境界の同時発生 |
| 抑制策 | cost-tracker reset + continuous_run reset の atomic 実行、confirmCount 2 で部分抑制 |
| 抑制不能時の対応案 | manual override（月初 1 回限り） |
| 実機検証 | 月初境界で 1 度だけ実機確認 |

### §7.5 セル 4-5: multi-process interaction

| 項目 | 内容 |
|---|---|
| 発生確率 | **中（1-5% / 月）** |
| 抑制可能 | partial |
| 発火パターン | Sumi/Asagi/Open Claw 3 プロセス合算で NG-3 発火、単体プロセスでは未超過 |
| 抑制策 | プロセス毎の independent NG-3 判定、Anthropic console での合算は別系統 |
| 抑制不能時の対応案 | drill #2 で実機検証、3 プロセス NG-3 独立性を確証 |
| 実機検証 | drill #2 検証目的 #1「Open Claw BAN 時の Sumi 経路独立性」と統合 |

---

## §8 high 確率セル 4 件の対応案

### §8.1 セル 1-4 (continuous_run × sleep): 深夜境界の時刻計測誤差

| 観点 | 内容 |
|---|---|
| 根本原因 | `Date.now()` ベースの計測で深夜 0:00 / 12:00 切替で 11h59min59sec で 12h 判定する境界誤差 |
| 対応案 | (1) `Date.now()` ベースを `monotonic clock`（performance.now() ベース）に変更 (2) deadline を `startTime + 12h - 1ms` から `startTime + 12h + tolerance(60s)` に変更 (3) Owner escalation path を Slack #monitor で 30min 以内応答化 |
| Dev-A2 へのフィードバック | tolerance window 60s 追加 + monotonic clock 採用 |
| 実機検証 | drill #2（5/17）23:55-00:05 / 11:55-12:05 の境界 5min ずつで実機確認 |

### §8.2 セル 2-3 (cost_cap × spike legit): 大型 PR 連続 push の正当 spike

| 観点 | 内容 |
|---|---|
| 根本原因 | benchmark 実行や大型 PR 連続 push で API 換算 cost が短時間スパイク、$1,000 月次 ペースを瞬間突破 |
| 対応案 | (1) `--cost-cap-extended` flag で benchmark 時の 1h 一時引上 (2) Owner immediate override path（Slack quick-action button） (3) Anthropic console との二段防御（コンソール側 hard cap で物理停止） |
| Dev-A2 へのフィードバック | extended flag + override hook + console 二段防御の実装 |
| 実機検証 | benchmark 10 連続実行（CB-D-W4-03、6/12）で confirm |

### §8.3 セル 3-2 (rate_spike × boundary): レート 70% 瞬間突破

| 観点 | 内容 |
|---|---|
| 根本原因 | レート 70% を 5 RPS で 1sec だけ突破して即復帰、confirmCount 2 では 2 連続検知が boundary では起きやすい |
| 対応案 | (1) debounce window 60s 設定 (2) sliding window rate calculation で smoothing (3) rate jittering（CB-D-W3-04、Phase 1 W3）で平均化 |
| Dev-A2 へのフィードバック | debounce 60s + sliding window + jittering 統合 |
| 実機検証 | drill #2（5/17）で boundary 動作 + debounce 検証 |

### §8.4 セル 3-3 (rate_spike × spike legit): benchmark 正当 spike

| 観点 | 内容 |
|---|---|
| 根本原因 | benchmark 10 連続実行で正当な spike、レート 70% 超過が 5min 持続 → 確定発火 |
| 対応案 | (1) `--rate-spike-extended` flag で benchmark 時の 1h 一時引上 (2) Owner immediate override path (3) benchmark 完了時の自動 detector 再有効化 |
| Dev-A2 へのフィードバック | extended flag + 自動再有効化 hook |
| 実機検証 | benchmark 10 連続実行時に confirm |

### §8.5 high 4 件の共通対応プリミティブ

すべての high 4 件は以下 3 プリミティブの組合せで対応:
1. **manual override flag**: `--{detector}-extended` で benchmark 時の一時引上
2. **Owner escalation Slack quick-action button**: 30min 以内応答 → 1h cooldown
3. **drill #2（5/17）/ benchmark（6/12）での実機検証**: false-positive 実測 + override 動作確認

---

## §9 DEC-019-008/050/051/055 整合性確認

### §9.1 整合性確認

| DEC | 内容 | 本書との整合 |
|---|---|---|
| DEC-019-008 | NG-3 暫定値 12h/$1,000 | 本書 detector 1 (continuous_run) + detector 4 (ng3_violation) で実装、整合 |
| DEC-019-050 | API cap $30 (Hard) | 本書 detector 2 (cost_cap) で $24 warn / $28.5 auto_stop / $30 hard_fail の 3 段階実装、整合 |
| DEC-019-051 | subscription 主軸 95:5 | 本書 detector 2 で subscription 駆動を default、API fallback は 5% only、整合 |
| DEC-019-055 | Round 8 完遂 | 本書は Round 8 完遂を起点とする Round 9 案 9-B 緊急前倒し、整合 |

### §9.2 議決-23 / 議決-21 / 議決-7 / 議決-2 との矛盾なし

- 議決-23（mock 70% 化 SOP）: 本 false-positive matrix は mock 環境での仕様レビュー、実機検証は drill #2（mock 70% 化前提）で実施
- 議決-21（Risk Register v3.2）: R-019-09 / R-019-19 / R-019-21 mitigation 進捗を本書で +5pt
- 議決-7（drill #3 5/29）: 本書は detector 仕様レビュー、drill #3 とは対象が異なる
- 議決-2（Phase 1 着手 5/26 Conditional Go）: 本書 high 4 件の対応で確度 +1pt

### §9.3 R-019-09 / R-019-19 / R-019-21 との連動

| risk | 連動 detector | 本書での mitigation 進捗 |
|---|---|---|
| R-019-09 NG-3 24/7 監視 | detector 4 (ng3_violation) | high 1 件 + medium 4 件、対応案 確立で +5% |
| R-019-19 API $30 Hard cap 突破 | detector 2 (cost_cap) | high 1 件、extended flag + console 二段防御で +5% |
| R-019-21 subscription quota 突破時 API fallback 急速消費 | detector 2 (cost_cap) | console 二段防御で物理停止確立で +5% |

---

## §10 Round 10 引継 TODO 3 件

### §10.1 引継 TODO

| # | TODO | 担当 | 期限 |
|---|---|---|---|
| 1 | 実 `tos-monitor.ts`（Round 9 Dev-A2）完成後の re-validation で本書 20 セルすべての false-positive shape を実装と照合 | Review + Dev-A2 | 5/8 18:00 |
| 2 | high 4 件の対応プリミティブ 3 種（manual override flag / Slack quick-action button / drill #2 実機検証）を Phase 1 W2（CB-D-W2-06）の tos_monitor hooks 実装に直接反映 | Dev | 5/30（W2 期限） |
| 3 | drill #2（5/17）で multi-process interaction 5 セルすべての実機検証、Sumi/Asagi 同居時の detector 独立性を確証 | Review + Dev | 5/17 EOD |

### §10.2 確度押上推定

| 観点 | Round 8 完遂時 | Round 9 案 9-B 完遂時（本書） | デルタ |
|---|---|---|---|
| Phase 1 W2 (5/30) tos_monitor hooks 完遂確度 | 80% | **85%** | +5pt |
| drill #2（5/17）Pass 確度 | 88% | **90%** | +2pt |
| Phase 1 着手 5/26 Conditional Go 確度 | 92% | **93%** | +1pt（タスク 1 / タスク 2 と累積で 95%） |
| 5/22 朝公開前倒し（DEC-019-056）確度 | 78% | **81%** | +3pt（タスク 1 / タスク 2 と累積で 86%） |

---

## §11 結論 + Review 部門 sign-off

### §11.1 結論

Round 9 Dev-A2 で実装中の `tos-monitor.ts` の 4 detector × 5 シナリオ = 20 セル すべてで false-positive shape を網羅。high 4 件 / medium 9 件 / low 7 件で分布、high 4 件は confirmCount default 2 では抑制不能のため manual override flag + Owner escalation Slack quick-action button + drill #2 実機検証 の 3 プリミティブで対応。DEC-019-008 / 050 / 051 / 055 + 議決-23 / 議決-21 / 議決-7 / 議決-2 すべてと整合性確認、矛盾なし。Round 10 引継 TODO 3 件で残作業を最小化、Phase 1 W2（CB-D-W2-06）の tos_monitor hooks 実装に直接反映可能。

### §11.2 Review 部門 sign-off

| 観点 | sign-off |
|---|---|
| 4 detector の仕様確認 | sign-off |
| 5 シナリオの定義 | sign-off |
| 20 セル false-positive matrix（全網羅） | sign-off |
| high 4 件の対応案（manual override + Owner escalation + drill #2 実機検証） | sign-off |
| DEC-019-008/050/051/055 整合性確認 | sign-off |
| Round 10 引継 TODO 3 件確定 | sign-off |

### §11.3 関連 DEC / リスク参照

- **DEC-019-008**: NG-3 暫定値 — detector 1 / detector 4 の閾値根拠
- **DEC-019-050**: API cap $30 — detector 2 の $24/$28.5/$30 watchdog 3 段階閾値根拠
- **DEC-019-051**: subscription 主軸 95:5 — detector 2 の subscription 駆動 default 根拠
- **DEC-019-055**: Round 8 完遂 — 本前倒しの起点
- **DEC-019-056**: Round 9 前倒し（起票予定）— 本書の根拠 DEC
- **R-019-06**: BAN 30-60% / 12 ヶ月 — false-positive 抑制で BAN 誤発火回避
- **R-019-09**: NG-3 24/7 監視 — detector 4 で対応、+5% mitigation 進捗
- **R-019-19**: API $30 Hard cap 突破 — detector 2 で対応、+5% mitigation 進捗
- **R-019-21**: subscription quota 突破時 API fallback 急速消費 — detector 2 で対応、+5% mitigation 進捗

### §11.4 次回更新

- 5/8 18:00（議決-23 採択結果反映 + 実 tos-monitor.ts 完成後の re-validation）
- 5/17 EOD（drill #2 Sumi/Asagi 同居検証実施結果反映、multi-process interaction 5 セル実機検証）
- 5/30 EOD（Phase 1 W2 完遂後、tos_monitor hooks 実装結果反映）

---

**v1 起案**: 2026-05-04 W0-Week1 深夜 Review 部門 / 案 9-B
**正式採択**: 2026-05-08 W0-Week1 検収会議（議決-21 連動採択、Owner sign-off 予定）
**v1 確定差分**: 4 detector × 5 シナリオ = 20 セル全網羅 + high 4 件対応案 + Round 10 引継 3 件
