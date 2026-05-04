最終更新: 2026-05-04 / 起案: CEO / Owner 直接報告

# Owner 連結報告 v7 — DEC-019-050 ($30 cap) 受領後 4 部署並列発注成果統合

- 案件: PRJ-019「Clawbridge」
- 報告区分: CEO 統合報告 (4 部署並列発注 → DEC-019-051 起票)
- 起点: Owner Anthropic Console スクショ共有 (2026-05-03) = $30/月 spend cap 設定確定 = DEC-019-050 正式起票
- 4 部署並列発注: PM (月次予算 v2) / Dev (API spend $30 ガード実装) / Review ($30 cap 影響評価) / Research (subscription 主軸 P-D 改妥当性)
- 統合結論: **DEC-019-051 起票 = subscription plan 主軸運用方針を Phase 1 正式採用**
- 推奨アクション: 5/8 W0-Week1 検収会議で議決-20〜24 (5 件追加) を正式採択

---

## §1. エグゼクティブサマリ (300 字)

Owner Anthropic Console 設定 ($30/月 Hard cap, $25 メール通知, 6/1 リセット) を受け、4 部署並列発注で影響評価 + 実装ガード + 接続方式妥当性を即時実施。**全部署が「DEC-019-050 採択 + Phase 1 完遂可能」で結論一致**: PM 月次総額 ≤$430 (既契約$400 + 新規≤$30 + インフラ$0)・API余裕率 90%・R-019-04 12黄→6緑、Dev 二重防御 9 deliverables (warn$24 / auto_stop$28.5 / hard_fail$30 throw)、Review 条件付採択 (mock 70% 化 + 議決-21/22/23 全採択前提)、Research P-D 改 維持・強化 (cap 縮小は構造優位を逆に拡大、5 施策必須)。**確度全帯+2%上昇** (5/22: 80→82%, 5/26: 84→86%, 6/20: 75→77%)、Risk Register v3→v3.1 (R-019-19/20/21/22 新規 + R-019-09 緑化)、5/8 議決 7→10 件。**CEO 統合判断 = DEC-019-051 起票 (subscription 主軸方針 Phase 1 正式採用)**。

---

## §2. 4 部署並列発注 成果サマリ

### §2.1 PM 部門 — 月次予算 v2 (3 deliverables / 1,013 行)

| 成果物 | 行数 | 主要結論 |
|---|---|---|
| pm-budget-v2-30usd-api-cap.md | 324 | 月次総額 ≤$430、API 充当率 10%、余裕率 90%、Phase 2 拡張余地 $270 |
| pm-budget-v2-monthly-tracker-template.md | 390 | daily/weekly/monthly tracker 雛形、cron 15min + EOD 23:55 JST |
| pm-budget-v2-related-decisions-impact.md | 299 | DEC-019-007/-012/-016 との整合表、議決-20 起票案 |

**主要数値**:
- (A) 既契約 subscription = **$400/月** (Claude Max $200 + Codex Pro $200、追加発生なし)
- (B) 新規 API = **≤$30/月** (DEC-019-050 Hard cap)
- (C) インフラ = **$0/月** (全 free / personal tier)
- 総額 = **≤$430/月**
- DEC-019-016 ($300 追加発生上限) 充当率 = 10%、**余裕率 90%**
- R-019-04 cost overrun スコア = **12 (黄) → 6 (緑)** ((-6))

### §2.2 Research 部門 — subscription 主軸 P-D 改妥当性 (326 行)

| ファイル | 結論 |
|---|---|
| research-subscription-mainline-validation.md | **DEC-019-006 P-D 改 維持・強化 (変更不要)** |

**主要結論**:
- subscription 経路 = 主流量 **95%** (Claude Max $200 OAuth、ループ・proposal・harness 制御本体)
- API key 経路 = 補助 **5%** ($30 cap、HITL 通知 / mock-claude / E2E / drill / ナレッジ batch)
- Phase 1 期間 (5/26-6/20) API 消費見積 = **$19-31/月**、5 施策実施で **$11-15/月** に圧縮可能
- 代替案 (P-A 直叩き) は $30 cap で 1-3 日枯渇、Phase 1 機能不能 → P-D 改 相対優位は cap 縮小で**逆に拡大**
- 上流 OpenClaw / Anthropic 双方の personal/consumer pivot は subscription 経路の安定性を向上

**5 必須施策 (Dev W0-Week2 内完遂、5/9-5/22)**:
1. mock-claude フル活用 (drill #3 mock 70% 化、E ベクトル canned response 50 種)
2. HITL 通知テンプレ化 (事前 static text 生成、API 直接消費 $1-2 → $0.10)
3. E2E staging 限定 (週次 1 回 / drill 時のみ)
4. ナレッジ batch caching (PRJ-001〜018 抽出は 1 回限り)
5. drill #3 簡易化 (5 シナリオ実 API 消費を $5-10 → $3-5)

**新規 R-019**:
- R-019-22 (subscription cap 突破 → API fallback 急速消費、黄)
- R-019-23 (mock/template 遅延で API 消費膨張、緑)

### §2.3 Review 部門 — $30 cap 影響評価 (336 行)

| ファイル | 結論 |
|---|---|
| review-30usd-cap-impact-assessment.md | **条件付き採択 (Conditional Adoption)** |

**3 観点での影響評価**:

| 観点 | 影響 | 判定 |
|---|---|---|
| BAN drill #3 (5/22-24 リハ + 5/29 公式) 5 シナリオ | mock 70% 化で $5-10 → $3-5 (cap $30 の 10-17%) | 実行可、mock 70% 化条件付き |
| HITL 11 種 Gate 運用持続性 | 4 週合計 $0.40-$0.82 (cap の 1.4-2.7%) | 影響軽微 |
| R-019-15 mitigation v2 (5 攻撃ベクトル × 4 層防御) | cap 独立で影響ゼロ + 第 6 補助層 (cap 物理停止) で +5% 緩和 | retrofit 不要、補助層追加で改善 |

**新規 R-019**:
- R-019-19 (API $30 Hard cap 突破時の Phase 1 中断、黄)
- R-019-20 (アプリ層 × Console 二重防御 drift、緑)
- R-019-21 (subscription quota 突破時 API fallback 急速消費、黄)
- **R-019-09 (NG-3 24/7) 12 (赤) → 6 (緑) に再評価** (cap 縮小により 24/7 監視優先度が緩和)

**3 採択条件**:
1. 5/8 検収会議で議決-21 (R-019-19/20/21 起票) + 議決-22 (5 reports 差分修正) + 議決-23 (subscription plan 主軸 SOP 策定) を 3 件すべて YES 採択
2. Phase 1 W0-Week2 末 (5/22) までに mock-claude 70% 化 (E ベクトル canned response 50 種 + A/B/C/D TimeSource decoupling) を Dev 部門完遂
3. Anthropic Console (Hard $30 / Soft $25) + アプリ層 cost-monitor.ts cap value の月次同期チェック SOP を Phase 1 W0-Week2 までに策定

**確度更新**:
- 5/22 scaffold 完全承認確度: **80% → 82% (+2%)**
- 5/26 Phase 1 着手 Conditional Go 達成確率: **84% → 86% (+2%)**
- 6/20 Phase 1 完了 sign-off 確度: **75% → 77% (+2%)**

### §2.4 Dev 部門 — Anthropic API Budget Guard 実装 (9 deliverables)

| # | 種別 | ファイル | 行数 | 概要 |
|---|------|---------|------|------|
| 1 | 新規 | `app/web/src/lib/cost/budget-guard.ts` | 287 | 三段階 guard / 月次 cap 判定 / Slack 通知発火 |
| 2 | 新規 | `app/web/src/lib/cost/anthropic-spend-tracker.ts` | 293 | spend 加算 / 価格表 / daily aggregation / spike detection |
| 3 | 新規 | `app/supabase/migrations/20260503000009_cost_ledger_v2.sql` | 159 | 6 column 追加 + view 1 + RPC 2 |
| 4 | 新規 | `app/web/src/lib/cost/budget-guard.test.ts` | 241 | 13 ケース (5 ケース要件超過) |
| 5 | 新規 | `app/scripts/openclaw-monitor/src/cost-watcher.ts` | 336 | daily cron / threshold cross / 3 channel 通知 |
| 6 | 新規 | `app/web/src/app/api/admin/budget/route.ts` | 157 | GET 状態 / POST cap update (HITL 第10種連動) |
| 7 | 更新 | `app/web/src/app/dashboard/_components/cost-meter.tsx` | 338 | `AnthropicBudgetMeter` + `DailySpendTrend` 追加 |
| 8 | 更新 | `app/.env.example` | +3 行 | `ANTHROPIC_MONTHLY_CAP_USD` 等 |
| 9 | 新規 | `projects/PRJ-019/reports/dev-budget-guard-30usd-v1.md` | 216 | 実装レポート |

**二重防御アーキテクチャ**:

```
[呼出元] → アプリ層ガード (本実装) → Anthropic API → Anthropic Console (provider 側 Hard $30)
              │ tier: ok → warn → auto_stop → hard_fail (例外 throw)
              │ cost_ledger に都度 INSERT
```

**三段階 guard 閾値**:

| Tier | 閾値 (default) | 動作 | Slack channel |
|------|---------------|------|--------------|
| `ok` | < $24 | 通常運用、通知なし | — |
| `warn` | ≥ $24 (80%) | ログ + Slack `#prj019-monitor` 警告通知 | monitor |
| `auto_stop` | ≥ $28.5 (95%) | API 呼出停止 + Slack `#prj019-drill` HIGH 通知 + Owner DM | drill |
| `hard_fail` | ≥ $30 (Hard) | 例外 throw + Slack `#prj019-drill` HIGH 通知 + 監査ログ | drill |

**path 補正 (重要)**: タスク仕様の `app/web/lib/cost/...` を実リポジトリ構成 `app/web/src/lib/cost/...` (Next.js + tsconfig alias `@/* → src/*`) に整合。Migration filename `_000003` → `_000009` に補正 (base v1 = `_000006` より後にする必要あり、Dev 報告書 §2 に記載)。

---

## §3. CEO 統合判断 → DEC-019-051 起票

### §3.1 統合判断ロジック

| 観点 | 全部署一致点 | 判断 |
|---|---|---|
| **DEC-019-050 採択可否** | PM/Dev/Review/Research すべて「採択可能」 | **採択** |
| **Phase 1 完遂可否** | 5 施策実施前提で全部署「可能」結論 | **着手継続** |
| **P-D 改 (DEC-019-006) 妥当性** | Research 「維持・強化」 + Dev 実装整合 | **DEC-019-006 維持** |
| **subscription 主軸方針** | PM 構造再定義 + Research 95:5 流量比 + Dev 二重防御 + Review 補助層 | **正式採用 = DEC-019-051** |
| **Phase 1 達成確率** | Review 84→86% (+2%) | **Conditional Go 継続承認** |

### §3.2 DEC-019-051 起票内容 (decisions.md に追記済)

> **DEC-019-051**: subscription plan 主軸運用方針を Phase 1 正式採用 (CEO 起票 2026-05-04、5/8 W0-Week1 検収会議 議決-24 で正式採択予定)
> 
> - 月次総コスト構造: (A) 既契約 subscription $400 + (B) 新規 API ≤$30 + (C) インフラ $0 = **総額 ≤$430/月**
> - 流量比: subscription 95% / API 5%
> - 5 必須施策: Dev W0-Week2 内完遂 (5/9-5/22)
> - 期待効果: API 消費 $19-31 → $11-15 (cap $30 内 buffer 50%以上)
> - 4 部署成果反映: PM v2 / Dev 二重防御 / Review 条件付採択 / Research P-D 改 維持
> - Risk Register: v3 (17件) → **v3.1 (21件)**
> - 確度: 5/22 80→82% / 5/26 84→86% / 6/20 75→77%
> - 5/8 検収議題: 7→10 件 (議決-21/22/23/24 新規)

### §3.3 Risk ID 重複統合

4 部署提案で生じた ID 重複を CEO 判定で統合:

| 元提案 | 元 ID | 統合後 ID | 内容 | 格付 |
|---|---|---|---|---|
| PM §9.1 + Review §5 | R-019-19 (両者) | **R-019-19** (統合) | API $30 Hard cap 突破時の Phase 1 中断 | 黄 |
| Review §5 | R-019-20 | **R-019-20** | アプリ層 × Console 二重防御 drift | 緑 |
| Review §5 + Research §6 R-019-22 | R-019-21 + R-019-22 | **R-019-21** (統合) | subscription quota 突破時 API fallback 急速消費 | 黄 |
| Research §6 R-019-23 | R-019-23 (繰上) | **R-019-22** | mock/template 遅延で API 消費膨張 | 緑 |

→ Risk Register v3 (17件) → **v3.1 (21件)**: R-019-19/20/21/22 (4 件新規) + R-019-09 12→6 緑化

---

## §4. 5/8 W0-Week1 検収会議 議題改訂 (7→10 件 + 既存 13→14)

### §4.1 新規追加議題 (4 件)

| # | 議決番号 | 内容 | 起票元 | 採択推奨 |
|---|---------|------|--------|---------|
| 1 | **議決-20** | PM 月次予算 v2 ($430/月構造) 正式採用 | PM 部門 | YES |
| 2 | **議決-21** | Risk Register v3.1 (R-019-19/20/21/22 新規 + R-019-09 緑化) 正式採用 | Review 部門 | YES |
| 3 | **議決-22** | 既存 5 reports 差分修正 (review-ban-drill-3-scenario.md 等) 正式採用 | Review 部門 | YES |
| 4 | **議決-23** | mock-claude 70% 化 SOP + Anthropic Console 同期チェック SOP 正式採用 | Review 部門 | YES |
| 5 | **議決-24** | DEC-019-051 = subscription plan 主軸方針 Phase 1 正式採用 | CEO + Research 部門 | YES |

### §4.2 議題総数

- 既存: 議決-7〜19 (13 件) + 議決-2/-3 (Phase 1 着手判定 / scaffold 完全承認)
- 新規: 議決-20/-21/-22/-23/-24 (5 件)
- **計 議決 5 件追加**、所要時間想定 +30〜45 分 (60 分 → 90〜105 分)

### §4.3 既存議題への影響

| 議決 | 内容 | $30 cap 影響 | 修正後の推奨 |
|---|---|---|---|
| 議決-2 | Phase 1 着手 Conditional Go | 達成確率 84→86% | YES (条件付き) 維持 |
| 議決-3 | scaffold 完全承認 | 5/22 確度 80→82% | YES (Conditional Go) 維持 |
| 議決-7 | BAN drill #3 実施承認 | mock 70% 化条件付き | YES + 条件追記 |
| 議決-8 | R-019-15 = 赤格付け公式化 | 第 6 補助層 cap 注記追加 | YES + 補注 |
| 残 9 議題 | Marketing / G-Top / HITL 拡張 etc. | 影響なし | YES 維持 |

---

## §5. 確度トラッキング (累積効果)

| マイルストン | 起点 | DEC-019-050 採択前 | DEC-019-051 採択後 | 累積差分 |
|---|---|---|---|---|
| 5/22 scaffold 完全承認確度 | 78% | 80% | **82%** | +4% |
| 5/26 Phase 1 着手 Conditional Go 達成確率 | 80% | 84% | **86%** | +6% |
| 6/20 Phase 1 完了 sign-off 確度 | 73% | 75% | **77%** | +4% |
| 6/27 公開遵守確度 | 70% | 73% | **75%** | +5% |
| Day-0 readiness | 95% | 97% | **99%** (Owner setup 完了後) | +4% |

→ **$30 cap 採択は Phase 1 達成確率を全帯で +2% 押上げ**、cost discipline + 物理防御 + subscription 主軸明確化が累積効果を発揮。

---

## §6. Phase 1 W0-Week2 必須タスク (5/9-5/22)

### §6.1 Dev 部門 (5 必須施策中 4 件)

| # | タスク | 期限 | 担当 |
|---|---|---|---|
| 1 | mock-claude フル活用 (drill #3 mock 70% 化、E ベクトル canned response 50 種) | 5/22 | Dev |
| 2 | HITL 通知テンプレ化 (事前 static text、$1-2 → $0.10 圧縮) | 5/9 | Dev |
| 3 | E2E staging 限定実行 (週次 1 回 / drill 時のみ) | 5/19 | Dev |
| 4 | ナレッジ batch caching (PRJ-001〜018 1 回限り抽出) | 5/30 (W2 末) | Dev |
| 5 | A/B/C/D TimeSource decoupling (review test-strategy §6.4 整合) | 5/22 | Dev |
| 6 | Anthropic Console + cost-monitor.ts 同期 SOP 策定 | 5/22 | Dev + PM |

### §6.2 Review 部門 (1 件)

| # | タスク | 期限 | 担当 |
|---|---|---|---|
| 1 | drill #3 簡易化 (5 シナリオ E ベクトル LLM scan を mock 100% 化) | 5/16 | Review |

### §6.3 秘書部門 (1 件)

| # | タスク | 期限 | 担当 |
|---|---|---|---|
| 1 | Risk Register v3.1 (R-019-19/20/21/22) 反映 + 5/8 議題 v6 改訂 | 5/8 | 秘書 |

### §6.4 Research 部門 (1 件)

| # | タスク | 期限 | 担当 |
|---|---|---|---|
| 1 | 5/30 W2 終了時 NG-3 再評価議題に「subscription 主軸での実消費ベースライン」追加 | 5/30 | Research |

---

## §7. Owner への確認事項

### §7.1 即決判断 (CEO 推奨で進める場合は無回答可)

| # | 議題 | CEO 推奨 |
|---|---|---|
| 1 | DEC-019-051 起票 (subscription 主軸方針 Phase 1 正式採用) | YES (decisions.md に追記済) |
| 2 | 議決-20〜24 を 5/8 検収会議で正式採択 | YES (5/8 議題 v6 として秘書に発令) |
| 3 | Phase 1 W0-Week2 5 必須施策の Dev 着手指示 (5/9 開始) | YES |
| 4 | Risk Register v3.1 採用 (R-019-19/20/21/22 + R-019-09 緑化) | YES |

### §7.2 Owner 別途共有事項 (情報のみ)

| # | 内容 |
|---|---|
| 1 | Anthropic Console Hard $30 / Soft $25 設定済 (Owner 設定完了) |
| 2 | Phase 1 月次総コスト = ≤$430/月 (subscription $400 既契約 + API ≤$30 + インフラ $0) |
| 3 | 5/8 検収会議 = 90-105 分想定、議題 14 件 (既存 13 + 新規追加分カウント整理) |
| 4 | 6/20 Phase 1 完了 sign-off 確度 = 77% (DEC-019-051 採択後) |

---

## §8. 次のアクション (CEO → 部署)

### §8.1 即時発令 (本日 5/4)

| # | 部署 | タスク | 期限 |
|---|---|---|---|
| 1 | 秘書 | 5/8 議題 v6 改訂 (議決-20〜24 追加 + 議決時間配分再計算) | 5/5 朝 |
| 2 | 秘書 | Risk Register v3.1 反映 (R-019-19〜22 追加 + R-019-09 緑化) | 5/8 朝 |
| 3 | Dev | W0-Week2 5 必須施策の WBS 細分化 (各タスクへの SP 割当) | 5/5 朝 |
| 4 | PM | DEC-019-051 反映の Phase 1 plan v2.2 起案 (v2.1 上書き) | 5/6 朝 |
| 5 | Review | mock-claude 70% 化 acceptance criteria 起案 (5/22 検収用) | 5/9 朝 |

### §8.2 5/8 検収会議当日 (CEO 司会)

- 議題総数: 14 件 (既存 9 + 新規 5)
- 所要時間: 90-105 分想定
- 期待議決結果: 議決-2/-3/-7/-8 = YES (条件付) 維持 + 議決-20〜24 = YES 全採択 = **計 14 件 YES**
- 期待 sign-off: Phase 1 着手 5/26 Conditional Go 確定 (達成確率 86%)

---

## §9. リスク・懸念事項

### §9.1 残存懸念 (5 件)

| # | 懸念 | 対策 | 期限 |
|---|---|---|---|
| 1 | mock-claude 70% 化 5/22 完遂困難リスク | Dev W0-Week2 SP 配分集中化、Review 早期 acceptance | 5/22 |
| 2 | Anthropic Console + アプリ層 cap 値 drift | 月次同期チェック SOP (議決-23) 必須化 | 5/22 |
| 3 | subscription quota 突破時 API fallback 急速消費 | R-019-21 mitigation: subscription only fallback 手順事前文書化 (PM §9.3) | 5/22 |
| 4 | E ベクトル injection 250 turn 想定 3 倍膨張 | mock 100% 化 + Soft $25 警告メールでの即時切替 | 5/24 (drill リハ前) |
| 5 | Phase 2 拡張時の cap 不足 (HITL +200% / KE-04 +500%) | Phase 2 計画書起案時 (8/1 想定) に別 DEC で増額判断 | 8/1 |

### §9.2 緊急介入トリガー (Owner 通知必須)

| トリガー | 通知方法 | 介入レベル |
|---|---|---|
| spend ≥ $24 (warn) | Slack `#prj019-monitor` | LOW (情報共有) |
| spend ≥ $28.5 (auto_stop) | Slack `#prj019-drill` HIGH + Owner DM | MEDIUM (確認) |
| spend ≥ $30 (hard_fail) | Slack `#prj019-drill` HIGH + Owner DM + メール | HIGH (即時判断) |
| Anthropic Console Hard $30 到達 | Anthropic 自動メール (Owner 受領) | HIGH (subscription only fallback 移行判断) |

---

## §10. 結論

1. **DEC-019-050 ($30 cap) は Phase 1 完遂を阻害しない**: 全 4 部署が「採択可能 + Phase 1 完遂可能」で結論一致。
2. **DEC-019-051 起票 (subscription 主軸方針正式採用)**: Phase 1 月次総コスト ≤$430、subscription 経路 95% / API 経路 5%、5 必須施策で API 消費 $19-31 → $11-15 圧縮。
3. **確度全帯で +2% 改善**: 5/22 80→82% / 5/26 84→86% / 6/20 75→77% / 6/27 73→75% / Day-0 95→99%。
4. **Risk Register 統合**: v3 (17 件) → v3.1 (21 件)、R-019-19〜22 新規 + R-019-09 12→6 緑化。
5. **5/8 検収議題 +5 件**: 議決-20〜24 全採択で Phase 1 5/26 Conditional Go 確定。
6. **Owner 工数影響なし**: 月次予算追加投資ゼロ (subscription $400 既契約のまま)、Phase 1 期間中の Owner 工数 ≤ 週 10h 維持。

---

## §11. 添付資料

### §11.1 4 部署成果物 (本日納品)

- `projects/PRJ-019/reports/pm-budget-v2-30usd-api-cap.md` (324 行)
- `projects/PRJ-019/reports/pm-budget-v2-monthly-tracker-template.md` (390 行)
- `projects/PRJ-019/reports/pm-budget-v2-related-decisions-impact.md` (299 行)
- `projects/PRJ-019/reports/research-subscription-mainline-validation.md` (326 行)
- `projects/PRJ-019/reports/review-30usd-cap-impact-assessment.md` (336 行)
- `projects/PRJ-019/reports/dev-budget-guard-30usd-v1.md` (216 行)

### §11.2 4 部署成果物 (Dev 実装)

- `projects/PRJ-019/app/web/src/lib/cost/budget-guard.ts` (287 行)
- `projects/PRJ-019/app/web/src/lib/cost/anthropic-spend-tracker.ts` (293 行)
- `projects/PRJ-019/app/supabase/migrations/20260503000009_cost_ledger_v2.sql` (159 行)
- `projects/PRJ-019/app/web/src/lib/cost/budget-guard.test.ts` (241 行 / 13 ケース)
- `projects/PRJ-019/app/scripts/openclaw-monitor/src/cost-watcher.ts` (336 行)
- `projects/PRJ-019/app/web/src/app/api/admin/budget/route.ts` (157 行)
- `projects/PRJ-019/app/web/src/app/dashboard/_components/cost-meter.tsx` (338 行 / 拡張)
- `projects/PRJ-019/app/.env.example` (+3 行)

### §11.3 決裁・連結記録

- `projects/PRJ-019/decisions.md` (DEC-019-050 line 85 既存 + DEC-019-051 line 86 追記、v12 footer 更新)
- 本書: `projects/PRJ-019/reports/ceo-owner-consolidated-v7.md`

---

## フッタ

- 文書: `projects/PRJ-019/reports/ceo-owner-consolidated-v7.md`
- 版: v1.0 (2026-05-04)
- 起案: CEO 部門
- 検収: Owner (本書受領後 5/8 議題 v6 への議決-20〜24 統合を発令判定)
- 次回更新: 2026-05-08 W0-Week1 検収会議結果反映 (議決-20〜24 採択結果 + DEC-019-051 公式採択スタンプ)
