# PRJ-019 — Round 10 BAN drill #2 prep（5/12 → 5/8 朝前倒し検討、9 シナリオ拡張）

最終更新: 2026-05-04 W0-Week1 深夜 / 起案: Review 部門 R10 Review-δ
位置付け: Owner 即決「徹底前倒し / 最短スケジュール」マンデート下、当初 5/12 予定 BAN drill #2 を 5/8 朝に再前倒し検討するための実機検証 prep 文書。Round 9 drill #1 dry Full Pass 5/5 + tos-monitor 4×5 偽陽性 matrix（高ランク 4 セル）を踏襲し、drill #1 の 5 シナリオ + 4 偽陽性セルカバー = 9 シナリオに拡張する。
版: v1.0（Round 10 Review-δ 起案、案 C ハイブリッド暫定運用前提）
連動 DEC: DEC-019-007 / DEC-019-010 / DEC-019-019（drill #1 シナリオ承認）/ DEC-019-025（Agent dispatch SOP）/ DEC-019-050（API cap $30）/ DEC-019-052 / DEC-019-054 / DEC-019-055 / DEC-019-056（Round 9 前倒し）
連動レポート: `review-round9-ban-drill-1-dry-exec-result.md`（drill #1 dry Full Pass 5/5）/ `review-round9-tos-monitor-false-positive-matrix.md`（4×5 偽陽性 matrix）/ `review-ban-drill-2-sumi-asagi-coexistence-procedure.md`（5/17 当初手順）/ `review-mandatory-controls-50-final.md`（必須 50 項目）
連動コード（read-only 参照のみ）: `app/harness/src/ban-drill.ts` / `app/harness/src/tos-monitor.ts`（Round 9 案 9-A2 で 660 行着地済）/ `app/harness/src/usage-monitor.ts` / `app/harness/src/circuit-breaker.ts` / `app/harness/src/kill-switch.ts`

---

## §0 200 字 CEO サマリ

BAN drill #2 を当初 5/12 → 5/8 朝（W0-Week1 検収会議直前 06:00-08:00）への再前倒しを検討。drill #1 dry Full Pass 5/5（Round 9）+ tos-monitor 偽陽性 matrix high 4 セル（continuous_run×sleep / cost_cap×spike legit / rate_spike×boundary / rate_spike×spike legit）を統合し 9 シナリオに拡張。timeline は 06:00 集合 / 06:15 開始 / 08:00 終了で 105 分 + buffer 15 分。PASS criteria は drill #1 5 SLA 全達成 + high 4 セル抑制不能時の manual override 動作確認 + Sumi/Asagi 巻き添えゼロ。fallback は 5/8 着地不可時に当初 5/12 へ復帰し議決-7 採択ライン維持。議決-26 採択 5 軸のうち「BAN 防御演習 PASS」軸に直接寄与し、Phase 1 着手 5/26 Conditional Go 確度 +2pt 押上見込み（93→95%）。read-only 設計、コード一切無改変。

---

## 目次

| § | 題目 |
|---|------|
| §1 | 5/8 朝前倒しの背景と判断軸 |
| §2 | 9 シナリオの構成（drill #1 5 + 偽陽性 high 4） |
| §3 | timeline（06:00-08:00 + buffer 15 分） |
| §4 | 担当役割マトリクス（Round 9 9 役割を 5/8 朝コンパクト版で 5 役割に圧縮） |
| §5 | 観測ポイント 12 件（5 SLA + 4 偽陽性セル + 3 Sumi/Asagi 巻き添え） |
| §6 | PASS criteria（5 SLA + 4 偽陽性セル + 3 巻き添え = 12 軸） |
| §7 | fallback 手順（5/8 朝着地不可時 → 5/12 復帰） |
| §8 | 議決-26 採択 5 軸への寄与判定 |
| §9 | Round 11 引継 TODO + Owner 観察ポイント prep |

---

## §1 5/8 朝前倒しの背景と判断軸

### §1.1 Owner マンデートと前倒し効果

Owner 即決「徹底前倒し / 最短スケジュール」+ Round 9 drill #1 dry Full Pass 5/5 着地により、drill #2 を当初 5/12 → 5/8 朝（W0-Week1 検収会議直前）へ再前倒しすることで以下 3 効果を狙う:

1. **Phase 1 着手 5/26 Conditional Go 確度 +2pt（93→95%）**: drill #2 Pass を 5/8 議決-26 採択直前に確定させ、議決-26 を「採択」→「無条件採択」に押上
2. **Sumi/Asagi 巻き添え検証を Phase 1 着手前に完遂**: 当初 drill #2（5/17）は Phase 1 W1（5/19 着手）4 日後で巻き添え発生時のリカバリ余裕がなかった。5/8 朝完遂により Phase 1 着手前に 18 日間の余裕確保
3. **議決-7（drill #3 5/29）への波及**: drill #2 + drill #3 セット運用の最適化を 5/8 議決-7 採択時に同時確定可能

### §1.2 5/8 朝前倒しのリスクと判断軸

| リスク | 影響 | mitigation |
|---|---|---|
| Round 9 案 9-A2 tos-monitor.ts 着地（660 行）の品質確認時間不足 | 高 | drill #2 prep を Round 10 で完遂、Round 11 で実機 dry exec 再実施 |
| Owner RSVP 5/8 06:00 集合の確認不足 | 中 | 5/7 EOD までに Owner alternate 経路（Slack quick-action / Email 30min SLA）確立 |
| 5/8 朝の立会者疲労（W0-Week1 検収会議直前の集中投入） | 中 | 担当役割を Round 9 9 → 5/8 朝コンパクト版で 5 役割に圧縮、各役割の負荷を 50% 以下に抑制 |
| drill #2 Fail 時の議決-26 への悪影響 | 高 | fallback 手順（§7）で 5/12 復帰 + 議決-7 採択ライン維持を確保 |

### §1.3 案 C ハイブリッド暫定運用前提

DEC-019-052（案 C ハイブリッド暫定運用）下、drill #2 は subscription 主軸（DEC-019-051）+ API fallback（5%）の両方を検証する必要がある。本 prep は両モードの検証を 9 シナリオに統合する。

---

## §2 9 シナリオの構成

### §2.1 9 シナリオの全体構造

| # | シナリオ名 | 起源 | 検証目的 | 想定時間 |
|---|---|---|---|---|
| S-1 | emergency_stop 発動 | drill #1 dry exec §3 | 401/403 5 連続 → kill-switch 5s 内発火 | 10 分 |
| S-2 | P-E fallback 切替 | drill #1 dry exec §4 | claude-bridge config 変更 + 5 件 send + 30s 内完遂 | 10 分 |
| S-3 | 24h 観測 SOP 起動 | drill #1 dry exec §4.3 | SOP 17/20 → 18/20 ready 化（5/8 議決-23 採択前提） | 10 分 |
| S-4 | 復旧 + cost-tracker reset | drill #1 dry exec §5 | subscription 駆動再開判定 4/4 + audit log hash chain 整合 | 10 分 |
| S-5 | Sumi/Asagi 巻き添え確認 | Round 9 drill #2 当初 §1.2 検証目的 #1-#5 | 3 アプリ同時稼働で Open Claw 単独隔離可能性 | 15 分 |
| S-6 | high セル 1: continuous_run × sleep boundary | tos-monitor matrix §8.1 | 深夜 0:00 / 12:00 切替で manual override 動作 | 10 分 |
| S-7 | high セル 2: cost_cap × spike legit | tos-monitor matrix §8.2 | benchmark 連続実行で `--cost-cap-extended` flag 動作 | 10 分 |
| S-8 | high セル 3: rate_spike × boundary | tos-monitor matrix §8.3 | レート 70% 瞬間突破で debounce 60s 動作 | 10 分 |
| S-9 | high セル 4: rate_spike × spike legit | tos-monitor matrix §8.4 | benchmark spike で `--rate-spike-extended` flag 動作 | 10 分 |

合計: 95 分（実測 timeline + buffer 15 分 = 110 分、§3 で 105 分 + 15 分 = 120 分内に圧縮）

### §2.2 drill #1 dry exec 5 シナリオ（S-1〜S-4 + S-5）の踏襲

S-1〜S-4 は drill #1 dry exec の 4 段階（emergency_stop / P-E fallback / 24h 観測 SOP / 復旧）をそのまま実機化、S-5 は当初 drill #2（5/17）の Sumi/Asagi 同居検証 5 目的を圧縮実施する。

### §2.3 high 4 セル（S-6〜S-9）の拡張

tos-monitor 偽陽性 matrix（Round 9）で「confirmCount default 2 では抑制不能」と判定された high 4 セルを実機検証する。各セルで以下 3 プリミティブの動作を確認:

1. `--{detector}-extended` flag による benchmark 時の一時引上
2. Owner escalation Slack quick-action button（30min 以内応答 → 1h cooldown）
3. debounce window 60s + sliding window rate calculation

### §2.4 9 シナリオ間の依存関係

```
[S-1 emergency_stop] → [S-2 P-E fallback] → [S-3 24h SOP] → [S-4 復旧]
                                                                  ↓
                                                      [S-5 Sumi/Asagi 巻き添え]
                                                                  ↓
                              [S-6 sleep boundary] / [S-7 cost spike] / [S-8 rate boundary] / [S-9 rate spike]
                                                                  ↓
                                                              [drill #2 完遂]
```

S-6〜S-9 は並列実行可能（独立 detector のため）、S-1〜S-5 は sequential。

---

## §3 timeline（06:00-08:00 + buffer 15 分）

### §3.1 タイムライン詳細

| 時刻 | 区分 | アクティビティ | 担当 |
|---|---|---|---|
| 05:50 | 集合前 | 立会者 5 役割 Slack #clawbridge-alerts ack 確認 | 議長 |
| 06:00 | 集合 | drill #2 開始宣言 + 9 シナリオ概要再確認 | 議長 |
| 06:05 | preflight | 環境確認: harness/Vitest mock 状態 + tos-monitor 660 行 importable + Sumi/Asagi 稼働状態 | 観測 |
| 06:10 | 開始 | S-1 emergency_stop 発動（401/403 5 連続注入） | 異常実行 |
| 06:20 | 進行 | S-2 P-E fallback 切替 | P-E 切替 |
| 06:30 | 進行 | S-3 24h 観測 SOP 起動 | 監査確認 |
| 06:40 | 進行 | S-4 復旧 + cost-tracker reset | 監査確認 |
| 06:50 | 進行 | S-5 Sumi/Asagi 巻き添え確認 | 観測 + 異常実行 |
| 07:05 | 並列開始 | S-6/S-7/S-8/S-9（high 4 セル）並列実行 | 異常実行 + 監査確認 |
| 07:45 | 完遂 | 9 シナリオ完遂宣言 + 12 軸 PASS criteria 速報 | 議長 |
| 07:50 | 集計 | 5 役割 ack 集計 + Owner 連絡 | Owner 連絡 |
| 08:00 | 終了 | drill #2 終了宣言 + 検収会議（W0-Week1）への引継 | 議長 |
| 08:00-08:15 | buffer | 障害発生時の延長 buffer（議長判断） | 議長 |

### §3.2 5/8 朝の Owner 確認 タイミング

| 時刻 | Owner 確認内容 | 期待応答 |
|---|---|---|
| 5/7 EOD | 5/8 06:00 集合 RSVP + drill #2 9 シナリオ承認 | RSVP + 承認 |
| 5/8 05:50 | Slack 「drill #2 開始 5min 前」自動通知 | ack |
| 5/8 06:50 | Slack 「S-1〜S-4 完遂」中間報告 | ack（応答必須でない） |
| 5/8 08:00 | Slack 「drill #2 完遂、12 軸 PASS criteria 速報」+ 議決-26 採択推奨度高度化提案 | ack + 議決-26 採択方針確認 |

### §3.3 drill #2（5/8 朝版）と当初 drill #2（5/17）の差分

| 項目 | 当初 drill #2（5/17） | 5/8 朝版 |
|---|---|---|
| 開始時刻 | 09:00 | 06:00（前倒し 3h） |
| 所要時間 | 4h（09:00〜13:00） | 105 分 + buffer 15 分（圧縮） |
| 立会役割 | 9 役割 | 5 役割（圧縮） |
| 異常シナリオ | 7 種（A〜G） | 9 種（S-1〜S-9、+2 種） |
| 巻き添え検証 | 詳細実施 | コンパクト実施（S-5 で 15 分） |
| Phase 1 W1 着手判断 | 5/19 着手判断トリガ | 5/8 議決-26 採択推奨度高度化トリガ |

---

## §4 担当役割マトリクス（5 役割版）

### §4.1 5 役割定義

| # | 役割 | 担当部署 | 5/8 朝の作業 | 当初 9 役割からの圧縮 |
|---|---|---|---|---|
| R-1 | 議長 | CEO | 開始/終了宣言、9 シナリオ進行管理、Owner 連絡 | 議長 + 部署 ack 受付（2 役割統合） |
| R-2 | 観測 | Review | 5 SLA + 12 軸 PASS criteria 計測、Slack #clawbridge-alerts 配信確認 | 観測 + 監査ログ確認（2 役割統合） |
| R-3 | 異常実行 | Dev | 9 シナリオ実機注入、tos-monitor mock injection、異常 D 用 2 次系 API キー操作 | 異常シナリオ実行 単独 |
| R-4 | P-E 切替 | Dev | claude-bridge config 切替、5 件 send 実行、Sumi/Asagi 経路独立性確認 | P-E fallback 切替 + Sumi/Asagi 担当（2 役割統合） |
| R-5 | Owner 連絡 | 秘書 | 5/8 05:50 / 06:50 / 08:00 Slack quick-action 投稿、Owner alternate 経路確認 | Owner 連絡 単独 |

### §4.2 当初 9 役割との対応

| 当初 9 役割 | 5/8 朝 5 役割 | 圧縮根拠 |
|---|---|---|
| 議長 | R-1 | 維持 |
| 観測 | R-2 | 維持 |
| 部署 ack 受付 | R-1（統合） | 5 役割 ack のみで簡略化 |
| P-E fallback 切替 | R-4 | 維持 |
| 監査ログ確認 | R-2（統合） | mock 環境で hash chain 自動検証可能 |
| Owner 連絡 | R-5 | 維持 |
| 異常シナリオ実行 | R-3 | 維持 |
| Sumi PM | R-4（統合） | 5/8 朝はコンパクト実施で代替 |
| Asagi PM | R-4（統合） | 5/8 朝はコンパクト実施で代替 |

### §4.3 役割衝突回避

R-2 観測（Review）と R-3 異常実行（Dev）は同時並列実行のため、Slack channel 分離（#clawbridge-alerts vs #drill-exec）で衝突回避。R-4 P-E 切替と R-3 異常実行は sequential（S-1 完了後に S-2 開始）のため衝突なし。

---

## §5 観測ポイント 12 件

### §5.1 5 SLA 観測（drill #1 dry exec 踏襲）

| # | 観測ポイント | 計測方法 | SLA |
|---|---|---|---|
| O-1 | emergency_stop 5s 内完遂 | kill-switch state machine elapsed | ≤ 5,000 ms |
| O-2 | circuit-breaker forceOpen 100% 同期 | 5 系統並列発火 elapsed | ≤ 500 ms |
| O-3 | P-E fallback 30s 内完遂 | claude-bridge config 切替 + 5 件 send | ≤ 30,000 ms |
| O-4 | 24h SOP 準備状態 ≥ 80% | SOP 20 項目チェックリスト | ≥ 80% |
| O-5 | audit log hash chain 整合 | mock auditStore.replay → SHA-256 verify | chain_valid: true |

### §5.2 high 4 セル観測

| # | 観測ポイント | 計測方法 | PASS 基準 |
|---|---|---|---|
| O-6 | continuous_run × sleep: tolerance 60s 動作 | 23:55-00:05 境界で誤発火件数 | 0 件 |
| O-7 | cost_cap × spike legit: `--cost-cap-extended` flag | benchmark 模擬 spike 注入で flag 受理 | flag 受理 + detector 1h 一時無効化 |
| O-8 | rate_spike × boundary: debounce 60s | 70% 瞬間突破 5 RPS で 1sec 注入 | 1 サイクル目 strip + 確定発火なし |
| O-9 | rate_spike × spike legit: `--rate-spike-extended` flag | benchmark spike 5min 持続で flag 受理 | flag 受理 + 自動再有効化 |

### §5.3 Sumi/Asagi 巻き添えゼロ観測

| # | 観測ポイント | 計測方法 | PASS 基準 |
|---|---|---|---|
| O-10 | Sumi 経路独立性 | Sumi の Claude Code OAuth quota 消費 | 0 消費 |
| O-11 | Asagi 経路独立性 | Asagi OpenAI Codex API quota 消費 | 0 消費 |
| O-12 | 3 アプリ Slack 通知混在防止 | #clawbridge-alerts 単独配信、Sumi/Asagi 通常運用 ch への混入件数 | 0 件 |

---

## §6 PASS criteria（12 軸）

### §6.1 12 軸 PASS 表

| # | 軸 | PASS 閾値 | 観測ポイント | 重要度 |
|---|---|---|---|---|
| 1 | emergency_stop | ≤ 5,000 ms | O-1 | Critical |
| 2 | circuit-breaker forceOpen | ≤ 500 ms | O-2 | Critical |
| 3 | P-E fallback | ≤ 30,000 ms | O-3 | Critical |
| 4 | 24h SOP | ≥ 80% | O-4 | High |
| 5 | audit log hash chain | chain_valid: true | O-5 | Critical |
| 6 | continuous_run × sleep | tolerance 60s 動作 | O-6 | High |
| 7 | cost_cap × spike legit | extended flag 受理 | O-7 | High |
| 8 | rate_spike × boundary | debounce 60s 動作 | O-8 | High |
| 9 | rate_spike × spike legit | extended flag + 自動再有効化 | O-9 | High |
| 10 | Sumi 経路独立性 | OAuth quota 0 消費 | O-10 | Critical |
| 11 | Asagi 経路独立性 | OpenAI quota 0 消費 | O-11 | Critical |
| 12 | Slack 混在防止 | 通常 ch 混入 0 件 | O-12 | Medium |

### §6.2 総合判定基準

| 判定 | 条件 |
|---|---|
| Full Pass（12/12 PASS） | 12 軸すべて PASS、議決-26 採択推奨度を「強い推奨」→「極めて強い推奨」に押上 |
| Partial Pass（10-11/12 PASS） | Critical 5 軸（#1/2/3/5/10/11）+ High 3 軸 = 8 軸最低 PASS、Medium 1 件未達は許容 |
| Conditional Pass（8-9/12 PASS） | Critical 5 軸全 PASS + High 3 軸以上 PASS、議決-26 は「採択」維持、5/12 復帰検討 |
| Fail（< 8/12 PASS） | Critical 1 軸でも未達 → 5/12 復帰 + 議決-26 採択ライン要再評価 |

### §6.3 議決-26 採択推奨度寄与

drill #2 5/8 朝版 Full Pass 達成時、議決-26 採択 5 軸のうち以下軸への寄与:

| 議決-26 採択 5 軸 | drill #2 寄与 | 寄与率 |
|---|---|---|
| 必須 50 ≥ 95% | 間接寄与（C-A-02 BAN drill 2 回 完遂で +2pt） | +2pt |
| BAN 防御演習 PASS | **直接寄与**（drill #1 dry + drill #2 5/8 朝で 2/2 PASS） | +30pt |
| Phase 1 着手 5/26 Conditional Go ≥ 95% | 直接寄与（drill #2 Pass で +2pt 押上、93→95%） | +2pt |
| 議決-7 drill #3 5/29 採択ライン維持 | 間接寄与（drill #2 Pass で drill #3 readiness +5pt） | +5pt |
| Sumi/Asagi 巻き添えゼロ確証 | **直接寄与**（O-10/O-11/O-12 で確証） | +20pt |

---

## §7 fallback 手順（5/8 朝着地不可時 → 5/12 復帰）

### §7.1 5/8 朝着地不可の判断トリガ

以下のいずれか発生時、5/8 朝 drill #2 を中止し当初 5/12 へ復帰:

1. 5/7 EOD までに Owner RSVP 不達
2. Round 9 案 9-A2 tos-monitor.ts 660 行の品質確認で重大欠陥発覚
3. Sumi/Asagi 5/8 早朝の通常運用緊急対応（PRJ-018 M1 Real impl 障害等）
4. 5/8 朝 05:50 の preflight 確認で harness/Vitest mock 環境未整備

### §7.2 5/12 復帰時の議決ライン維持

| 議決 | 5/8 朝着地不可時の影響 | mitigation |
|---|---|---|
| 議決-26（必須 50 採択） | drill #2 寄与 +2pt 失効 | drill #1 dry Full Pass のみで採択維持（93%） |
| 議決-7（drill #3 5/29 採択） | drill #2 readiness +5pt 失効 | 5/12 drill #2 完遂で復帰 |
| Phase 1 着手 5/26 Conditional Go | 確度 95% → 93%（-2pt） | 5/12 drill #2 完遂で 95% 復帰 |

### §7.3 5/12 復帰時の追加 prep

5/12 復帰時は当初 drill #2（5/17）を更に前倒しし、5/12 09:00-12:00 で実施。本書 9 シナリオをそのまま流用、5 役割 → 9 役割に拡張。

---

## §8 議決-26 採択 5 軸への寄与判定

### §8.1 5 軸現在値（Round 10 開始時点）

| 軸 | 現在値 | 5/8 朝 drill #2 Pass 後 | 議決-26 採択推奨度 |
|---|---|---|---|
| 必須 50 ≥ 95% | 60%（Round 9 完遂時 30/50）→ 5/8 議決-5 採択前提で 86% 見込み | 86%（変動なし） | 該当軸単独では Conditional |
| BAN 防御演習 PASS | drill #1 dry 5/5 PASS（1/2） | drill #1 + drill #2 5/8 朝 Full Pass = 2/2 PASS | **Full Pass** |
| Phase 1 着手 5/26 Conditional Go ≥ 95% | 93%（Round 9 完遂時） | 95% | **Full Pass** |
| 議決-7 drill #3 5/29 採択ライン維持 | drill #1 dry 5/5 PASS で +3pt | drill #2 Full Pass で +5pt = 計 +8pt | **Full Pass** |
| Sumi/Asagi 巻き添えゼロ確証 | 当初 drill #2（5/17）実施待ち | drill #2 5/8 朝で確証 | **Full Pass** |

### §8.2 5 軸全 PASS 見込み判定

drill #2 5/8 朝版 Full Pass 達成時、議決-26 採択 5 軸のうち 4/5 軸が Full Pass、1/5 軸（必須 50 ≥ 95%）は議決-5 採択 + Phase 1 W4 完遂で 100% 達成見込み。

**議決-26 採択推奨度判定**: drill #2 5/8 朝版 Full Pass 達成見込みで「**極めて強い推奨で無条件採択**」を建議可能。

### §8.3 5 軸寄与の数値サマリ

| 軸 | 寄与 pt（drill #2 単独） | 累積 |
|---|---|---|
| 必須 50 ≥ 95% | +2pt | 60→62%（議決-5 採択で 86%） |
| BAN 防御演習 PASS | +30pt | 50→80%（drill #1 dry 50% + drill #2 30%） |
| Phase 1 着手 5/26 Go | +2pt | 93→95% |
| 議決-7 drill #3 採択ライン | +5pt | 88→93% |
| Sumi/Asagi 巻き添えゼロ | +20pt | 70→90% |

---

## §9 Round 11 引継 TODO + Owner 観察ポイント prep

### §9.1 Round 11 引継 TODO 3 件

| # | TODO | 担当 | 期限 | 完遂条件 |
|---|---|---|---|---|
| 1 | drill #2 5/8 朝版 実機 dry exec 再実施（Round 9 案 9-A2 tos-monitor.ts 660 行 品質確認後） | Review + Dev | 5/7 EOD | 9 シナリオ全 PASS 見込み確証 |
| 2 | 5/8 朝立会 5 役割の最終確定（特に Owner RSVP） | 秘書 + CEO | 5/7 18:00 | 5/5 役割割当確定 + 5/8 06:00 集合確認 |
| 3 | fallback 手順（5/12 復帰）の trigger 監視 | Review | 5/8 05:50 まで | 4 トリガすべて監視、発生時は議長即時判断 |

### §9.2 Owner 観察ポイント prep（5/8 朝 drill #2 用、4 箇所）

| 観察ポイント | 期待挙動 | Owner 判断 |
|---|---|---|
| 1. emergency_stop 発火時の subprocess kill 物理動作 | 5 秒以内に kill 完了 + circuit-breaker open | 5 秒以内なら ◎ |
| 2. P-E fallback 切替後の 5 件テスト send | 5/5 成功 + latency P95 < 3s | 5/5 成功 + P95 < 3s なら ◎ |
| 3. high 4 セル抑制動作（manual override / debounce / extended flag） | 4/4 セル PASS | 4/4 PASS なら ◎ |
| 4. Sumi/Asagi 巻き添えゼロ確証 | OAuth/OpenAI quota 0 消費 + Slack 混入 0 件 | 3/3 確証なら ◎ |

### §9.3 確度押上推定

| 観点 | Round 9 完遂時 | Round 10 完遂時（本書） | drill #2 5/8 朝 Pass 後 | デルタ |
|---|---|---|---|---|
| drill #2 Pass 確度 | 88% | **92%**（prep 完成効果） | **Full Pass = 100%** | +4pt → +8pt |
| Phase 1 着手 5/26 Conditional Go 確度 | 93% | 93% | **95%** | +2pt |
| 議決-26 採択推奨度（強い推奨 → 極めて強い推奨） | 強い推奨 | 強い推奨 | **極めて強い推奨** | +1 段階 |
| 5/22 朝公開前倒し（DEC-019-056）確度 | 81% | 81% | **84%** | +3pt |

---

## §10 結論 + Review 部門 sign-off

### §10.1 結論

BAN drill #2 を当初 5/12 → 5/8 朝（W0-Week1 検収会議直前 06:00-08:00）への再前倒しを検討。drill #1 dry Full Pass 5/5 + tos-monitor 偽陽性 matrix high 4 セルを統合し 9 シナリオに拡張、5 役割で 105 分 + buffer 15 分の圧縮実施。12 軸 PASS criteria（5 SLA + 4 偽陽性セル + 3 巻き添え）で総合判定、Full Pass 達成時に議決-26 採択推奨度を「極めて強い推奨」に押上。fallback 手順で 5/12 復帰時も議決ライン維持を確保。read-only 厳守、コード一切無改変。

### §10.2 Review 部門 sign-off

| 観点 | sign-off |
|---|---|
| 9 シナリオ構成（drill #1 5 + 偽陽性 high 4） | sign-off |
| timeline（06:00-08:00 + buffer 15 分） | sign-off |
| 5 役割マトリクス（当初 9 役割から圧縮） | sign-off |
| 12 軸 PASS criteria | sign-off |
| fallback 手順（5/12 復帰） | sign-off |
| 議決-26 採択 5 軸寄与判定 | sign-off |
| Round 11 引継 TODO 3 件 | sign-off |

### §10.3 関連 DEC / リスク参照

- **DEC-019-019**: drill #1 シナリオ承認 — 本書 9 シナリオの S-1〜S-4 起源
- **DEC-019-052**: 案 C ハイブリッド暫定運用 — drill #2 で subscription + API fallback 両モード検証根拠
- **DEC-019-055**: Round 8 完遂 — 本前倒しの起点
- **DEC-019-056**: Round 9 前倒し（起票予定）— drill #1 dry Full Pass 確定
- **R-019-06**: BAN 30-60% / 12 ヶ月 — drill #2 Full Pass で mitigation +10%（drill #1 dry +5% + drill #2 +5%）
- **R-019-08**: 兄弟案件リソース食合い — drill #2 Sumi/Asagi 巻き添えゼロ確証で +5%
- **R-019-09**: NG-3 24/7 監視 — high 4 セル抑制動作確認で +5%

### §10.4 次回更新

- 5/7 18:00（Round 11 立会者最終確定 + Owner RSVP 確認）
- 5/8 08:00（drill #2 5/8 朝版 実施結果反映 → result v1 起案）
- 5/12 EOD（fallback 復帰時のみ、5/12 drill #2 実施結果反映）

---

**v1 起案**: 2026-05-04 W0-Week1 深夜 Review 部門 R10 Review-δ / 案 C ハイブリッド暫定運用前提
**正式採択**: 2026-05-08 W0-Week1 検収会議（議決-26 連動採択、Owner sign-off 予定）
**v1 確定差分**: drill #2 5/8 朝前倒し検討 + 9 シナリオ拡張 + 5 役割圧縮 + 12 軸 PASS criteria + fallback 手順 + 議決-26 採択 5 軸寄与判定
