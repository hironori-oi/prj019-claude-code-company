最終更新: 2026-05-04 / 起案: PM 部門

# PRJ-019 Clawbridge — W0-Week2（5/9-5/22）監視ボード

- 案件: PRJ-019「Clawbridge」
- 担当: PM 部門（CEO + PM 1 日 1 回確認）
- 版: v1.0（2026-05-04 起案、5/8 議決-20/-23 採択直後 5/9 朝から運用開始）
- 関連: `pm-phase1-plan-v2.2.md` §3.2、`ceo-owner-consolidated-v7.md` §6、`dev-budget-guard-30usd-v1.md`、DEC-019-050/-051

---

## §0 本書の位置付け

W0-Week2（2026-05-09〜2026-05-22、12 営業日 + 土日 4 日）は **Phase 1 着手 5/26 Conditional Go の最終仕上げ期間**。本書は CEO + PM が 1 日 1 回確認する監視ボードの仕様を定義し、各監視項目の **監視方法 / 閾値 / アラート発火条件 / Owner 通知レベル / 対応 SOP / daily-weekly-集計サマリ** を一覧化する。5/22 EOD に Phase 1 着手 Go/NoGo 判定を集中させ、確度 82% 達成可否を毎日トラッキングする。

### §0.1 7 監視項目サマリ

| # | 監視項目 | 監視周期 | 閾値（赤） | Owner 通知 | 対応 SOP |
|---|---|---|---|---|---|
| **M-1** | Dev burndown（6 タスク SP42） | 日次 | 計画線 -10% 以上遅延 | LOW | §1 |
| **M-2** | API spend（cost-meter） | リアルタイム + 日次 | warn $24 / auto_stop $28.5 / hard_fail $30 | LOW/MEDIUM/HIGH | §2 |
| **M-3** | Slack 通知 3 channel | 日次 | 重大度 HIGH 通知あり | MEDIUM | §3 |
| **M-4** | HITL gate 11 種 | 日次 + 週次 | reject 5 件超 / 24h 内 | LOW | §4 |
| **M-5** | Risk Register v3.1（21 件） | 週次（火・木）| 緑→黄 1 件 / 黄→赤 1 件 | MEDIUM/HIGH | §5 |
| **M-6** | mock 70% 化進捗（AC 37 件） | 日次（5/16 以降） | 5/20 時点で 70% 未満 | MEDIUM | §6 |
| **M-7** | Day-0 readiness（25 項目） | 週次（月） + 5/22 EOD | 99% → 95% 未満 | HIGH | §7 |

---

## §1 M-1: Dev burndown — 6 タスク SP42 日次消化

### §1.1 監視対象

W0-Week2 の Dev/Review 6 タスク（DEC-019-051 5 必須施策 + 1 SOP）= 計 SP42:

| 施策 # | タスク | 担当 | 期限 | SP |
|---|---|---|---|---|
| 施策-1 | mock-claude フル活用（E ベクトル 50 種 + A/B/C/D TimeSource decoupling） | Dev | 5/22 | 12 |
| 施策-2 | HITL 通知テンプレ化（事前 static text） | Dev | 5/9 | 4 |
| 施策-3 | E2E staging 限定実行（週次 1 回 / drill 時のみ） | Dev | 5/19 | 6 |
| 施策-4 | ナレッジ batch caching（PRJ-001〜018 1 回限り） | Dev | 5/30 | 8 |
| 施策-5 | drill #3 簡易化（5 シナリオ E ベクトル mock 100% 化） | Review | 5/16 | 4 |
| SOP | Anthropic Console + cost-monitor.ts 同期 SOP | Dev + PM | 5/22 | 4 |
| **計** | | | | **42** |

### §1.2 監視方法

- **データ源**: GitHub Project board (Dev リード管理)、`reports/pm-phase1-burndown-template.md` の W0-Week2 セクション
- **計測タイミング**: 毎日 EOD 22:00 JST
- **計測項目**: 累積消化 SP / 計画線 / 残 SP / 完了タスク数
- **可視化**: burndown chart（5/9 = SP42 → 5/22 = SP0 の理想線）

### §1.3 閾値・アラート発火

| 状態 | 閾値 | アラート | 通知レベル |
|---|---|---|---|
| 緑 | 計画線 ±5% 内 | なし | — |
| 黄 | 計画線 -5〜-10% | Slack `#prj019-monitor` 警告 | LOW |
| 赤 | 計画線 -10% 以下 | Slack `#prj019-monitor` HIGH + Owner DM 翌朝 | MEDIUM |
| 致命 | 5/22 EOD 完遂困難判明 | Slack `#prj019-drill` HIGH + Owner DM 即時 | HIGH |

### §1.4 対応 SOP

1. **黄 検知** → Dev リードに原因聞取り（24h 内）→ 翌週リカバリ計画提出
2. **赤 検知** → CEO + PM + Dev リード 30 分緊急 standup → SP 再配分 or 施策削減判断
3. **致命 検知** → Phase 1 着手 6/2 延期 fallback 起動判断（DEC-019-051 採択条件②未達 → 議決-2 採択取消）

### §1.5 Daily / Weekly / 5/22 集計

- **Daily**: burndown chart 更新 + 進捗％ Slack `#prj019-monitor` 配信（22:30 JST）
- **Weekly（金曜 EOD）**: 週次サマリ報告書 1 ページ生成（消化 SP / 残 SP / リスク 3 件 / 翌週見通し）
- **5/22 EOD 集計**: 全 6 タスク完遂確認 → §6 mock 70% 化進捗と統合 → Phase 1 着手 Go/NoGo 判定

---

## §2 M-2: API spend — Anthropic API 累積 spend 監視

### §2.1 監視対象

DEC-019-050 Hard $30 / Soft $25 cap に対する Anthropic API 月次累積 spend:

- **アプリ層 cost-monitor**: `app/web/src/lib/cost/anthropic-spend-tracker.ts`（Dev 二重防御実装、本日納品済）
- **Anthropic Console**: provider 側 Hard $30（Owner 設定済）
- **二重防御 drift 検出**: 月次同期チェック SOP（5/22 完遂、議決-23）

### §2.2 監視方法

- **データ源**:
  - cost-monitor.ts → Supabase `cost_metrics` table（cron 15min 集計）
  - cost-watcher.ts → daily 23:55 JST EOD aggregation
  - dashboard `/admin/budget` page → Realtime 表示
- **計測項目**: 当月累積 spend ($) / Tier (ok/warn/auto_stop/hard_fail) / 残予算 / 予測月末 spend
- **可視化**: cost-meter.tsx の `AnthropicBudgetMeter` + `DailySpendTrend` 拡張（本日納品済）

### §2.3 閾値・アラート発火（三段階 guard）

| Tier | 閾値 | 動作 | Slack channel | Owner 通知 |
|---|---|---|---|---|
| `ok` | < $24 | 通常運用 | — | — |
| `warn` | ≥ $24（80%） | log + 警告 | `#prj019-monitor` | LOW（情報共有） |
| `auto_stop` | ≥ $28.5（95%） | API 呼出停止 + Slack DM | `#prj019-drill` HIGH | MEDIUM（確認） |
| `hard_fail` | ≥ $30（Hard） | 例外 throw + 監査ログ | `#prj019-drill` HIGH | HIGH（即時判断、subscription only fallback 移行判断） |
| Console drift | アプリ層 vs Console 値差分 ≥ $1 | drift alert | `#prj019-monitor` | LOW |

### §2.4 対応 SOP

1. **warn ($24)** → cost-watcher のログ確認、subscription 経路へのトラフィック移管推奨（5 必須施策 効果確認）
2. **auto_stop ($28.5)** → API 呼出停止状態を 1 営業日内に解除可否判断、subscription only fallback SOP 起動準備
3. **hard_fail ($30)** → 即時 subscription only fallback 移行（R-019-19 mitigation）、Phase 1 W0-Week2 残タスク再優先順位付け
4. **Console drift** → 月次同期チェック SOP 緊急起動（議決-23）、cap value 一致性確認 → 設定不一致なら Owner に再設定依頼

### §2.5 Daily / Weekly / 5/22 集計

- **Daily**: 23:55 JST EOD aggregation で当日 spend / 累積 spend / Tier 通知（auto_stop 以上は即時通知）
- **Weekly（金曜 EOD）**: 週次総額 / Tier 推移 / 流量比 (subscription 95% / API 5%) 維持確認
- **5/22 EOD 集計**: W0-Week2 期間（5/9-5/22）の累積 API spend を最終集計 → DEC-019-051 期待効果（$11-15）達成度判定 → 5/26 着手判断材料

---

## §3 M-3: Slack 通知 3 channel — 発火件数 / 重大度別

### §3.1 監視対象

DEC-019-049（Slack workspace 新規作成）で構成された 3 channel:

| Channel | 用途 | 想定発火頻度 |
|---|---|---|
| `#prj019-monitor` | 監視 / 警告（warn 系・drift 系） | 1-3 件/日 |
| `#prj019-drill` | drill 通知 / HIGH 重大度（auto_stop / hard_fail / drill 異常） | 0-1 件/日（drill 日除く） |
| `#prj019-hitl` | HITL Gate 11 種通知（pending / approved / rejected / timeout） | 5-10 件/週 |

### §3.2 監視方法

- **データ源**: Slack API（channel history）+ Supabase `slack_notifications` table（cost-watcher.ts と同 cron）
- **計測項目**: channel 別件数 / 重大度別（LOW/MEDIUM/HIGH）/ 24h 移動平均 / 同一 alert 重複発火検知
- **可視化**: dashboard `/admin/notifications` page（5/22 までに W0-Week2 内追加実装、Dev 連携）

### §3.3 閾値・アラート発火

| 状態 | 閾値 | アラート | 通知レベル |
|---|---|---|---|
| 緑 | 想定範囲内 | なし | — |
| 黄 | `#prj019-monitor` 5 件超/日 | summary 報告 | LOW |
| 赤 | `#prj019-drill` HIGH 通知 1 件以上 | 即時 Owner DM | MEDIUM |
| 致命 | `#prj019-drill` 1 日 3 件以上 HIGH | 緊急 standup 招集 | HIGH |

### §3.4 対応 SOP

1. **黄 検知** → 発火集中時間帯確認、cron 重複 / 重複 alert 検出（cost-watcher の dedup logic）
2. **赤 検知** → HIGH alert の根本原因（cap 突破 / drill 失敗 / drift / HITL timeout reject）特定 → 24h 内対応
3. **致命 検知** → Phase 1 W0-Week2 進行可否判断、CEO 即時招集

### §3.5 Daily / Weekly / 5/22 集計

- **Daily**: 23:55 JST 3 channel 件数サマリ Slack `#prj019-monitor` 配信
- **Weekly**: 重大度別週次推移 + HITL channel の reject 率
- **5/22 EOD 集計**: W0-Week2 期間 HIGH 通知 0 件達成（理想）/ 1-2 件以下（許容）の最終確認

---

## §4 M-4: HITL gate 11 種 — 発火件数 + reject 件数（24h timeout default reject 含む）

### §4.1 監視対象

DEC-019-033（HITL 第 9/10 種追加）+ DEC-019-022（第 7 種 external_api）+ DEC-019-018（第 6 種 tos_gray_review）で発令された HITL Gate 11 種:

| # | Gate name | SLA | default action | 想定発火 |
|---|---|---|---|---|
| 1 | `secret_access` | 即時 | reject | 0/週 |
| 2 | `network_egress` | 即時 | reject | 0/週 |
| 3 | `large_diff` | 24h | reject | 1-2/週 |
| 4 | `unknown_command` | 24h | reject | 0-1/週 |
| 5 | `policy_change` | 24h | reject | 0/週 |
| 6 | `tos_gray_review` | 24h | reject | 0-1/週 |
| 7 | `external_api` | 24h | reject | 0/週（W0-Week2） |
| 8 | `owner_input_review` | 24h | reject | 0/週（PRJ-020 連動） |
| 9 | `dev_kickoff_approval` | 72h | reject | 0/週（Phase 1 中盤以降） |
| 10 | `permission_change_review` | 24h | reject | 0/週 |
| 11 | `knowledge_pii_review` | 24h | reject | 0-1/週（5/30 抽出時） |

### §4.2 監視方法

- **データ源**: Supabase `hitl_gates` table、`hitl-gate.ts` 経由ログ
- **計測項目**: gate 別 pending / approved / rejected / timeout-reject 件数、SLA 超過率
- **可視化**: dashboard `/admin/hitl` page（5/22 までに W0-Week2 内追加実装）

### §4.3 閾値・アラート発火

| 状態 | 閾値 | アラート | 通知レベル |
|---|---|---|---|
| 緑 | 想定範囲内 + reject 5 件未満/週 | なし | — |
| 黄 | reject 5 件超/週 | 集中監視 | LOW |
| 赤 | timeout-reject 3 件超/週 | Owner notification 不達疑い | MEDIUM |
| 致命 | HITL pending 24h 滞留 5 件以上 | 系統不具合疑い | HIGH |

### §4.4 対応 SOP

1. **黄 検知** → Owner 通知到達確認、Slack DM テスト送信
2. **赤 検知** → HITL Gate 通知設計見直し、5 必須施策 施策-2（HITL 通知テンプレ化）の実装進捗加速
3. **致命 検知** → HITL 系統緊急停止、subscription only fallback 移行判断

### §4.5 Daily / Weekly / 5/22 集計

- **Daily**: pending 件数 + 24h 経過件数 Slack `#prj019-hitl` 配信
- **Weekly**: gate 別 approved / rejected / timeout 集計 + Owner 平均応答時間
- **5/22 EOD 集計**: HITL Gate 11 種すべての 1 件以上発火実証 + Owner 通知到達率 ≥ 95% 達成確認

---

## §5 M-5: Risk Register v3.1（21 件）— ステータス変動

### §5.1 監視対象

5/8 議決-21 採択後の Risk Register v3.1（21 件）:

- 赤 2 件: R-019-15 / R-019-XX (赤再評価対象)
- 黄 14 件: R-019-04 / -06 / -07 / -08 / -10 / -11 / -12-A / -12-B / -13 / -14 / -19 / -21 + 既存
- 緑 5 件: R-019-09（再評価緑化）/ -16 / -17 / -20 / -22

### §5.2 監視方法

- **データ源**: `reports/secretary-risk-register-v3-1.md`（秘書管理）+ `reports/review-risk-register-v3-1.md`（Review 部門 5/8 までに新規生成）
- **計測周期**: 週 2 回（火・木 15:00 JST）+ 緊急変動時即時
- **計測項目**: 緑→黄 移動 / 黄→赤 移動 / 赤→黄 緑化 / 新規 R-019-XX 起票

### §5.3 閾値・アラート発火

| 状態 | 閾値 | アラート | 通知レベル |
|---|---|---|---|
| 緑 | 変動なし | なし | — |
| 黄 | 緑→黄 1 件 | 報告書 | LOW |
| 赤 | 黄→赤 1 件 | CEO + PM 30 分 standup | MEDIUM |
| 致命 | 赤 3 件以上 同時存在 | Phase 1 着手判断見直し | HIGH |

### §5.4 対応 SOP

1. **黄 検知** → 該当リスク mitigation 進捗確認、必要なら Plan B 起草
2. **赤 検知** → 該当リスク oversight 即時起票、5/22 までに緑化 / 黄 mitigation 計画提出
3. **致命 検知** → 5/26 Phase 1 着手 NoGo 検討（DEC-019-051 採択条件①再評価）

### §5.5 Daily / Weekly / 5/22 集計

- **火・木**: Risk Register v3.1 ステータス table Slack `#prj019-monitor` 配信
- **Weekly**: 週次変動マトリクス（IN/OUT 件数）+ mitigation 進捗％
- **5/22 EOD 集計**: 21 件のうち赤 2 件 mitigation 完遂状況 + 黄 14 件のうち 5/22 までに緑化目標件数（≥3 件）達成判定

---

## §6 M-6: mock 70% 化進捗 — AC 37 件のうち完了件数

### §6.1 監視対象

DEC-019-051 施策-1 完遂条件 = `review-mock-claude-70pct-acceptance-criteria.md`（5/9 起案、Review 部門納品予定）の AC 37 件:

- E ベクトル canned response 50 種 = AC 15 件
- A ベクトル TimeSource decoupling = AC 5 件
- B ベクトル TimeSource decoupling = AC 5 件
- C ベクトル TimeSource decoupling = AC 5 件
- D ベクトル TimeSource decoupling = AC 5 件
- 統合（drill #3 mock 70% 比率検証）= AC 2 件

→ 5/22 までに 37/37（100%）= mock 70% 化完遂

### §6.2 監視方法

- **データ源**: `reports/dev-mock-claude-progress.md`（5/16 以降日次更新、Dev 連携）+ Review 部門 acceptance テスト結果
- **計測周期**: 5/16 から日次（mock 70% 化フェーズ突入後）
- **計測項目**: AC 完了件数 / 残件数 / Review 検収 pass 率

### §6.3 閾値・アラート発火

| 状態 | 閾値 | アラート | 通知レベル |
|---|---|---|---|
| 緑 | 計画線 ±5% | なし | — |
| 黄 | 5/19 EOD 70% 未達 | 警告 | LOW |
| 赤 | 5/20 EOD 70% 未達 | リカバリ計画 24h 内提出 | MEDIUM |
| 致命 | 5/22 EOD 100% 未達 | Phase 1 着手 NoGo（DEC-019-051 採択条件②未達） | HIGH |

### §6.4 対応 SOP

1. **黄 検知** → Dev SP 配分集中化、他施策（施策-2/-3）の遅延許容化
2. **赤 検知** → mock 70% 化スコープ縮小判断（E ベクトル canned 50→30 種 等）、Review 部門と AC 緩和協議
3. **致命 検知** → Phase 1 着手 6/2 fallback（DEC-019-051 採択条件②未達 = 議決-2 採択取消）

### §6.5 Daily / Weekly / 5/22 集計

- **Daily（5/16 以降）**: AC 完了率 Slack `#prj019-monitor` 配信
- **Weekly**: AC カテゴリ別進捗（E ベクトル / TimeSource decoupling × A/B/C/D / 統合）
- **5/22 EOD 集計**: 37/37 完遂確認 → Phase 1 着手 5/26 Conditional Go 確定

---

## §7 M-7: Day-0 readiness — 99% から低下していないか

### §7.1 監視対象

`pm-phase1-day0-readiness-checklist.md` 全 25 項目（Dev 8 + Research 4 + PM 4 + Marketing 4 + Review 5）+ Owner 3 操作 + 50 統制 Day-0 ステータス + SOP 移行手順:

- 5/9 時点 readiness: 95%（DEC-019-051 採択前）
- 5/22 時点 目標: 99%（W0-Week2 5 必須施策完遂後）

### §7.2 監視方法

- **データ源**: `pm-phase1-day0-readiness-checklist.md` の §1 25 項目チェック + `pm-day0-owner-actions-detailed-v2.md` 32 項目（うち §1 Pre-Day 12 項目）
- **計測周期**: 月曜 EOD（週次）+ 5/22 EOD（最終）
- **計測項目**: 25 項目 GO / NoGo / pending、Owner Pre-Day 12 項目達成率

### §7.3 閾値・アラート発火

| 状態 | 閾値 | アラート | 通知レベル |
|---|---|---|---|
| 緑 | 95% 維持 | なし | — |
| 黄 | 95% → 90% | 警告 | LOW |
| 赤 | 90% 未満 | リカバリ計画 | MEDIUM |
| 致命 | 5/22 EOD 99% 未達 | Phase 1 着手 NoGo 検討 | HIGH |

### §7.4 対応 SOP

1. **黄 検知** → 未達項目特定 → 該当部署リードに依頼、24h 内ステータス確認
2. **赤 検知** → CEO + PM + 該当部署リード緊急 standup
3. **致命 検知** → 5/25 Pre-Phase Go/NoGo 議決で fallback 起動判断

### §7.5 Daily / Weekly / 5/22 集計

- **月曜 EOD**: 25 項目 + Owner Pre-Day 12 項目チェック Slack `#prj019-monitor` 配信
- **Weekly**: 部署別 readiness 進捗
- **5/22 EOD 集計**: 99% 達成確認 → 5/25 Pre-Phase Go/NoGo Gate-3 + 5/26 Day-0 Go/NoGo の前提条件成立

---

## §8 集計サマリ生成方法

### §8.1 Daily 集計（22:30〜23:55 JST）

```
22:30 JST: M-1 Dev burndown 更新 + Slack 配信
22:45 JST: M-3 Slack 通知 channel 件数集計
23:00 JST: M-4 HITL gate pending / approved / rejected 集計
23:15 JST: M-6 mock 70% 化進捗（5/16 以降）
23:55 JST: M-2 API spend EOD aggregation + 当日 daily summary 配信（cost-watcher.ts）
```

→ 1 日 1 通の **daily-monitor-summary.md**（自動生成、Slack `#prj019-monitor` 配信、CEO + PM 朝確認）

### §8.2 Weekly 集計（金曜 18:00 JST）

```
金曜 18:00 JST:
  - M-1 burndown 週次サマリ
  - M-2 API spend 週次総額 + Tier 推移
  - M-3 Slack 通知 重大度別週次推移
  - M-4 HITL gate 週次 approved / rejected / timeout
  - M-5 Risk Register v3.1 週次変動マトリクス（火・木集計の総括）
  - M-6 mock 70% 化 週次進捗（5/16 以降）
  - M-7 Day-0 readiness 月曜時点ステータス
→ 1 通の weekly-monitor-report.md 生成、CEO + PM レビュー
```

### §8.3 5/22 EOD 最終集計（W0-Week2 完了判定）

```
5/22 EOD:
  全 7 監視項目の最終ステータス + 達成判定
  - M-1: 6 タスク SP42 完遂 ✓
  - M-2: API spend ≤ $15 達成 ✓
  - M-3: HIGH 通知 0-2 件以下 ✓
  - M-4: HITL Gate 11 種すべて 1 件以上発火実証 ✓
  - M-5: Risk Register v3.1 赤 2 件 mitigation 完遂 ✓
  - M-6: mock 70% 化 AC 37/37 完遂 ✓
  - M-7: Day-0 readiness 99% 達成 ✓
→ 5/22-final-readiness-summary.md 生成
→ 5/25 Pre-Phase Go/NoGo Gate-3 + 5/26 Day-0 Go/NoGo の確定材料
```

---

## §9 監視ボード Owner 通知レベル定義（再掲）

| レベル | 配信方法 | 想定対応 SLA |
|---|---|---|
| LOW | Slack `#prj019-monitor` | 翌営業日確認 |
| MEDIUM | Slack `#prj019-drill` + Owner DM | 24h 内確認 + 簡易判断 |
| HIGH | Slack `#prj019-drill` HIGH + Owner DM + メール | 即時判断（4h 以内） |

---

## §10 結論 + 次のアクション

1. **W0-Week2（5/9-5/22）期間の 7 監視項目を CEO + PM が 1 日 1 回確認する仕組みを確立**
2. **3 段階通知（LOW/MEDIUM/HIGH）+ 致命検知時の Phase 1 着手 NoGo 判断ロジックを明示**
3. **Daily（22:30-23:55 JST）+ Weekly（金 18:00 JST）+ 5/22 EOD 最終集計の 3 タイミングで自動生成**
4. **DEC-019-051 採択条件②（5/22 mock 70% 化完遂）+ 採択条件③（Console 同期 SOP 策定）の毎日監視**
5. **5/22 最終集計で全 7 項目緑判定 → 5/25 Pre-Phase Go/NoGo Gate-3 + 5/26 Day-0 Go/NoGo 達成（確度 86%）**

### §10.1 5/8 議決後の即時アクション

- 議決-20/-21/-23 採択直後（5/8 19:00 EOD）→ 監視ボード仕様確定
- 5/9 朝 standup で M-1 burndown 開始 + cost-watcher cron 起動 + Slack 3 channel 確認
- 5/9 EOD 22:30 JST 第 1 回 daily-monitor-summary.md 配信開始

---

## §11 関連決裁・参照

### §11.1 反映決裁

- DEC-019-050 (Anthropic API spend cap $30/月)
- DEC-019-051 (subscription plan 主軸方針 Phase 1 正式採用)
- DEC-019-049 (Slack workspace 新規作成方針)
- DEC-019-033 (Owner-in-the-loop 透明 AI 組織モデル + HITL 第 9/10 種)

### §11.2 参照書

- `reports/pm-phase1-plan-v2.2.md` §3.2 W0-Week2 5 必須施策（本日納品）
- `reports/ceo-owner-consolidated-v7.md` §6 W0-Week2 必須タスク
- `reports/dev-budget-guard-30usd-v1.md`（Dev 二重防御 9 deliverables 実装報告）
- `reports/pm-phase1-burndown-template.md`（W0-Week2 セクション追加予定、5/22 必須更新）
- `reports/pm-conditional-go-tracker.md`（5/9-5/25 17 日間 tracker、本書と統合運用）
- `reports/pm-phase1-day0-readiness-checklist.md`（25 項目、§7 M-7 根拠）

---

## フッタ

- 文書: `projects/PRJ-019/reports/pm-w0-week2-monitor-board.md`
- 版: v1.0（2026-05-04）
- 起案: PM 部門
- 検収: CEO（5/8 議決-23 採択直後 → 5/9 朝運用開始承認）
- 次回更新: 2026-05-09（運用初日報告）+ 5/13 BAN drill #1 直後 + 5/16 mock 70% 化フェーズ開始 + 5/22 EOD 最終集計
