最終更新: 2026-05-04 / 起案: Research 部門 / 計測対象期間: 2026-05-04 〜 2026-05-30 (27 日間)

# PRJ-019 subscription 主軸 実消費ベースライン測定設計

- 案件: PRJ-019「Clawbridge」 — Open Claw を Owner-in-the-loop オーナーとする AI 組織ハーネス基盤
- 文書種別: 計測設計書 (DDL / RPC / cron / dashboard 仕様)
- 関連 DEC: DEC-019-051 (subscription 主軸方針 Phase 1 正式採用) / DEC-019-050 (API spend cap $30/月) / DEC-019-008 (NG-3 暫定値 12h/$1,000) / DEC-019-016 ($300 追加発生上限)
- 上位レポート:
  - `projects/PRJ-019/reports/research-subscription-mainline-validation.md` (本書親、§7.4 で 5/30 議題用ベースライン取得を推奨)
  - `projects/PRJ-019/reports/research-5-30-ng3-revaluation-agenda.md` (本書姉妹、5/30 議題詳細)
  - `projects/PRJ-019/reports/dev-budget-guard-30usd-v1.md` (Dev 二重防御実装、cost-tracker / cost-watcher)
  - `projects/PRJ-019/reports/pm-budget-v2-monthly-tracker-template.md` (PM 月次トラッカー雛形、cron 15min + EOD 23:55 JST)
- 結論: Supabase `subscription_usage_baseline` table 新規 + 既存 `cost_ledger` への connect column 追加、daily 自動集計 cron + weekly summary、9 指標 / Phase 2 予測モデル / 4 異常検知パターンを実装する。Dev 部門への依頼内容を §7 に明記。

---

## 0. エグゼクティブサマリー (300 字)

DEC-019-051 で確定した subscription 主軸運用 (流量比 95:5) における subscription 経路 (Claude Max $200) の実消費を 5/4-5/30 の 27 日間で計測し、5/30 NG-3 確定値判定 (姉妹レポート §3) の根拠データとして提供する。計測対象は subprocess spawn 回数 / turn 数 / token 数 / weekly cap 充当率など **9 指標**、計測方法は subprocess spawn ログ集計 + Anthropic Console weekly cap usage 取得 + cost_ledger 連動の 3 系統統合。格納先は Supabase `subscription_usage_baseline` table (新規、5 column 追加) + GitHub Actions artifact、計測頻度は daily 自動集計 cron + weekly summary。**4 異常検知パターン** (1 日比 200% 超過 spike / weekly cap 80% 接近 / 連続 3 日同水準消費 / API key fallback 発生) で R-019-22 を即検出。Phase 2 (3 倍規模) 予測モデルは線形外挿 + prompt cache hit rate 補正で構築。Dev 依頼内容は DDL 1 件 + RPC 2 件 + cron 1 件 + dashboard 1 KPI 群 / 工数 1.5-2 日。

---

## §1 計測対象 (9 指標)

### §1.1 subscription 経路指標 (5 個)

| # | 指標名 | 単位 | 計測タイミング | 根拠 |
|---|---|---|---|---|
| M-1 | subprocess spawn 回数 / 日 | 回 | subprocess spawn 時 (`claude -p` 起動) | DEC-019-051 流量比 95% の主流量判定 |
| M-2 | turn 数 / 日 | 回 | subprocess 完了時 (stream-json `result` event) | NG-3 ② API 換算費用試算の基礎データ |
| M-3 | prompt cache hit rate (%) | % | subprocess 完了時 (cache_creation / cache_read tokens) | DEC-019-051 §2.3 施策 4 ナレッジ batch caching の効果測定 |
| M-4 | weekly cap 充当率 (%) | % | Anthropic Console weekly cap usage daily 取得 | R-019-10 (Claude Max weekly) 早期検知、R-019-22 (subscription cap 突破) 監視 |
| M-5 | 入出力 token 累計 / 日 | tokens | subprocess 完了時 (input_tokens + output_tokens) | API 換算試算の精緻化 |

### §1.2 API key 経路指標 (2 個、姉妹計測)

| # | 指標名 | 単位 | 計測タイミング | 根拠 |
|---|---|---|---|---|
| M-6 | API key 経路実消費 (USD) | USD | API call 完了時 (Anthropic Console / cost_ledger) | DEC-019-050 cap $30 充当率 + R-019-22 検出 |
| M-7 | API key 経路 token 累計 / 日 | tokens | API call 完了時 | mock-claude vs 実 API 切替判定 |

### §1.3 NG-3 制約検証指標 (2 個)

| # | 指標名 | 単位 | 計測タイミング | 根拠 |
|---|---|---|---|---|
| M-8 | 稼働時間 / 日 (h) | h | harness watchdog 集計 (1 分 polling) | NG-3 ① 12h/日制約検証 |
| M-9 | エラー率 (%) | % | subprocess 完了時 (rate limit / timeout / context overflow) | R-019-12-B (timeout/hang) 早期検知 |

### §1.4 指標一覧総括

合計 **9 指標** = subscription 経路 5 個 + API key 経路 2 個 + NG-3 制約 2 個。すべて `subscription_usage_baseline` table に daily 集計、`cost_ledger` (既存) と FK 連動。

---

## §2 計測方法 (3 系統統合)

### §2.1 系統 ① subprocess spawn ログ集計 (M-1, M-2, M-3, M-5, M-9)

- **実装基盤**: `app/web/src/lib/cost/anthropic-spend-tracker.ts` (DEC-019-050 対応 Dev 既存実装、293 行)
- **拡張**: subprocess 完了時の stream-json `result` event から以下を抽出して `cost_ledger` に追加 column 書込:
  - `subprocess_id` (UUID)
  - `turn_count`
  - `cache_creation_tokens` / `cache_read_tokens`
  - `input_tokens` / `output_tokens`
  - `error_class` (NULL / rate_limit / timeout / context_overflow)
  - `route` ('subscription' or 'api_key')
- **trigger**: `claude -p` subprocess spawn の wrapper script (`app/scripts/openclaw-monitor/src/subprocess-tracker.ts` 新規) で stream-json 出力を tee して計測

### §2.2 系統 ② Anthropic Console weekly cap usage 取得 (M-4)

- **取得方法**: Anthropic Console (claude.ai Settings → Usage) の weekly cap 表示を daily HTML scraping
  - **不確実性**: 公式 API 提供がない場合、HTML scraping (二次手段) で取得 → 信頼度ラベル: 半公式 (claude.ai 公式 UI からの抽出だが、API ではない)
  - **代替案**: Anthropic Console UI からの手動値取得 (毎日 09:00 / 21:00 JST monitor、H-09 と統合)
- **格納**: `subscription_usage_baseline` table の `weekly_cap_usage_pct` column に daily 書込
- **異常検知**: 80% 接近時に Slack `#clawbridge-alerts` へ critical 通知 + harness 自律 pause (R-019-10 mitigation)

### §2.3 系統 ③ cost_ledger 連動 (M-6, M-7)

- **実装基盤**: 既存 `app/supabase/migrations/20260503000009_cost_ledger_v2.sql` (Dev 既存実装、159 行、6 column 追加 + view 1 + RPC 2)
- **拡張**: `subscription_usage_baseline` table と `cost_ledger` を `subprocess_id` で JOIN (FK)、daily aggregation で M-6 / M-7 を集計
- **集計 RPC**: `aggregate_subscription_baseline_daily()` (新規)、daily cron で実行

### §2.4 系統 ④ harness watchdog 稼働時間集計 (M-8)

- **取得方法**: harness 起動時に `harness_uptime` テーブルへ 1 分 polling、daily 集計で稼働時間を計算
- **NG-3 ① 違反検知**: 12h/日 接近時 (10h 到達) で Slack warn 通知、12h 到達で auto stop (既存 cost-monitor 連動)

---

## §3 計測頻度 + 格納先

### §3.1 計測頻度

| 頻度 | 内容 | 起動タイミング | 担当機構 |
|---|---|---|---|
| event-driven | subprocess 完了時 (M-1, M-2, M-3, M-5, M-9) | subprocess `result` event | anthropic-spend-tracker |
| 1 分 polling | harness 稼働時間 (M-8) | cron 1min | harness watchdog |
| daily 自動集計 | 9 指標すべての daily aggregation | cron 23:55 JST (PM monthly tracker と統合) | aggregate_subscription_baseline_daily RPC |
| weekly summary | 9 指標 weekly + Phase 2 予測モデル更新 | cron 日曜 23:55 JST | aggregate_subscription_baseline_weekly RPC |

### §3.2 格納先

- **primary**: Supabase `subscription_usage_baseline` table (新規)
  - schema: §4.1 DDL 参照
  - retention: Phase 1 終了 (6/20) 後も保持、Phase 2 予測モデル根拠データとして 12 ヶ月保管
- **secondary**: GitHub Actions artifact (`.github/workflows/subscription-baseline-snapshot.yml` 新規)
  - 7 日 retention、daily snapshot で Supabase 障害時のバックアップ
- **dashboard**: PRJ-020 ClawDialog 透明性 Dashboard で経路別 KPI 表示 (DEC-019-033 透明性 Dashboard 統合)

---

## §4 DDL / RPC 仕様

### §4.1 DDL: `subscription_usage_baseline` table

```sql
-- migration: 20260504000001_subscription_usage_baseline.sql
CREATE TABLE IF NOT EXISTS subscription_usage_baseline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  measurement_date DATE NOT NULL UNIQUE,
  -- subscription 経路指標 (M-1 〜 M-5)
  subprocess_spawn_count INTEGER NOT NULL DEFAULT 0,
  turn_count_total INTEGER NOT NULL DEFAULT 0,
  cache_creation_tokens BIGINT NOT NULL DEFAULT 0,
  cache_read_tokens BIGINT NOT NULL DEFAULT 0,
  prompt_cache_hit_rate NUMERIC(5,2),  -- 0.00 〜 100.00
  input_tokens_total BIGINT NOT NULL DEFAULT 0,
  output_tokens_total BIGINT NOT NULL DEFAULT 0,
  weekly_cap_usage_pct NUMERIC(5,2),   -- 0.00 〜 100.00
  -- API key 経路指標 (M-6, M-7)
  api_key_spend_usd NUMERIC(10,4) NOT NULL DEFAULT 0,
  api_key_tokens_total BIGINT NOT NULL DEFAULT 0,
  -- NG-3 制約指標 (M-8, M-9)
  uptime_hours NUMERIC(4,2) NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  error_rate_pct NUMERIC(5,2),
  -- 内部試算 API 換算 USD (NG-3 ② 判定用)
  subscription_api_equivalent_usd NUMERIC(10,4),
  -- meta
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscription_usage_baseline_date ON subscription_usage_baseline(measurement_date DESC);
```

### §4.2 RPC: daily aggregation

```sql
CREATE OR REPLACE FUNCTION aggregate_subscription_baseline_daily(target_date DATE)
RETURNS UUID AS $$
DECLARE
  baseline_id UUID;
BEGIN
  INSERT INTO subscription_usage_baseline (
    measurement_date,
    subprocess_spawn_count,
    turn_count_total,
    cache_creation_tokens,
    cache_read_tokens,
    prompt_cache_hit_rate,
    input_tokens_total,
    output_tokens_total,
    api_key_spend_usd,
    api_key_tokens_total,
    uptime_hours,
    error_count,
    error_rate_pct,
    subscription_api_equivalent_usd
  )
  SELECT
    target_date,
    COUNT(DISTINCT subprocess_id) FILTER (WHERE route = 'subscription'),
    SUM(turn_count) FILTER (WHERE route = 'subscription'),
    SUM(cache_creation_tokens) FILTER (WHERE route = 'subscription'),
    SUM(cache_read_tokens) FILTER (WHERE route = 'subscription'),
    -- prompt_cache_hit_rate = cache_read / (cache_read + input) * 100
    CASE WHEN SUM(cache_read_tokens + input_tokens) FILTER (WHERE route = 'subscription') > 0
      THEN (SUM(cache_read_tokens) FILTER (WHERE route = 'subscription'))::NUMERIC / SUM(cache_read_tokens + input_tokens) FILTER (WHERE route = 'subscription') * 100
      ELSE NULL END,
    SUM(input_tokens) FILTER (WHERE route = 'subscription'),
    SUM(output_tokens) FILTER (WHERE route = 'subscription'),
    SUM(amount_usd) FILTER (WHERE route = 'api_key'),
    SUM(input_tokens + output_tokens) FILTER (WHERE route = 'api_key'),
    -- uptime_hours: harness_uptime テーブルから別途集計
    (SELECT SUM(EXTRACT(EPOCH FROM duration) / 3600) FROM harness_uptime WHERE date_trunc('day', started_at) = target_date),
    COUNT(*) FILTER (WHERE error_class IS NOT NULL),
    CASE WHEN COUNT(*) > 0 THEN COUNT(*) FILTER (WHERE error_class IS NOT NULL)::NUMERIC / COUNT(*) * 100 ELSE NULL END,
    -- subscription_api_equivalent_usd: input * $0.003/1k + output * $0.015/1k (Sonnet 4.5 ベース推定単価)
    SUM(input_tokens) FILTER (WHERE route = 'subscription') * 0.003 / 1000 + SUM(output_tokens) FILTER (WHERE route = 'subscription') * 0.015 / 1000
  FROM cost_ledger
  WHERE date_trunc('day', recorded_at) = target_date
  ON CONFLICT (measurement_date) DO UPDATE SET
    subprocess_spawn_count = EXCLUDED.subprocess_spawn_count,
    -- ... (全 column update)
    updated_at = NOW()
  RETURNING id INTO baseline_id;
  RETURN baseline_id;
END;
$$ LANGUAGE plpgsql;
```

### §4.3 RPC: weekly summary + Phase 2 予測モデル

```sql
CREATE OR REPLACE FUNCTION aggregate_subscription_baseline_weekly(week_start DATE)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'week_start', week_start,
    'subprocess_spawn_avg', AVG(subprocess_spawn_count),
    'turn_count_avg', AVG(turn_count_total),
    'prompt_cache_hit_rate_avg', AVG(prompt_cache_hit_rate),
    'weekly_cap_usage_max', MAX(weekly_cap_usage_pct),
    'api_key_spend_total', SUM(api_key_spend_usd),
    'subscription_api_equivalent_total', SUM(subscription_api_equivalent_usd),
    'uptime_hours_avg', AVG(uptime_hours),
    'error_rate_avg', AVG(error_rate_pct),
    -- Phase 2 (3 倍規模) 予測:
    -- subprocess 3 倍 + cache hit rate 補正 (cache hit rate が +5% 改善で実消費 -10% 補正)
    'phase2_predicted_subscription_usd_monthly', SUM(subscription_api_equivalent_usd) * 4 * 3 * (1 - (AVG(prompt_cache_hit_rate) - 60) / 100 * 0.1),
    'phase2_predicted_api_key_usd_monthly', SUM(api_key_spend_usd) * 4 * 3
  ) INTO result
  FROM subscription_usage_baseline
  WHERE measurement_date >= week_start AND measurement_date < week_start + INTERVAL '7 days';
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

---

## §5 異常検知 (4 パターン)

| # | 検知パターン | 閾値 | 判定タイミング | 対応 |
|---|---|---|---|---|
| AD-1 | 1 日比 200% 超過 spike | (today - yesterday) / yesterday > 200% | daily 集計後 | Slack `#clawbridge-alerts` warn + Research 部門 root cause analysis 起票 |
| AD-2 | weekly cap 80% 接近 | weekly_cap_usage_pct ≥ 80% | daily 集計後 (weekly cap M-4) | Slack critical + harness 自律 pause (R-019-10 mitigation) |
| AD-3 | 連続 3 日同水準消費 (定常超過) | 連続 3 日とも subscription_api_equivalent_usd > $30/日 換算 | daily 集計後 | Slack warn + NG-3 ② 月次 $1,000 接近予測通知 |
| AD-4 | API key fallback 発生検知 | api_key_spend_usd > $5/日 spike | daily 集計後 | Slack critical + R-019-22 (subscription → API fallback 急速消費) 即発火 + harness 自律 pause |

異常検知は `app/scripts/openclaw-monitor/src/cost-watcher.ts` (Dev 既存実装、336 行) を拡張、AD-1〜4 を追加実装。

---

## §6 Phase 2 拡張時の予測モデル

### §6.1 予測モデル基本式

Phase 2 (3 倍規模拡張、DEC-019-051 留意事項) における月次消費予測:

```
phase2_subscription_monthly =
  phase1_subscription_weekly_avg × 4 weeks × 3 (規模倍率) × cache_hit_rate_correction

cache_hit_rate_correction = 1 - (avg_cache_hit_rate - 60) / 100 × 0.1
  ※ cache hit rate が 60% から +1% 改善で実消費 -0.1% 補正、+5% 改善で -0.5% 補正
```

```
phase2_api_key_monthly =
  phase1_api_key_weekly_avg × 4 weeks × 3 (規模倍率)
  ※ API 用途は HITL +200% / ナレッジ KE-04 +500% / Pen Test 自動化で実際は単純 3 倍より大きい可能性、保守的試算
```

### §6.2 予測モデル運用

- **W0-W2 (5/4-5/16) ブートストラップ期**: 低位安定データで Phase 2 予測の下限値推定
- **W2-W4 (5/19-6/13) Phase 1 本格稼働期**: Phase 2 予測の中央値 + 上限値推定
- **6/13 Phase 1 完了レビュー時**: weekly summary RPC の `phase2_predicted_*` 値を Phase 2 計画書起案 (8/1 想定) のインプットとして使用
- **8/1 Phase 2 起案時**: 別 DEC で月次 cap $30→$100 等の増額判断に活用 (DEC-019-051 留意事項)

### §6.3 予測モデルの不確実性

- **不確実性ラベル**: 推測 (W0-W2 の 27 日間データから 3 倍拡張への外挿は線形仮定、非線形効果 (HITL +200% / KE-04 +500%) は別補正必要)
- **mitigation**: Phase 2 計画書起案時に Research 部門が別 DEC で月次 cap 増額試算を再評価
- **検証手段**: 6/13 Phase 1 完了レビュー実消費と 5/30 時点予測の乖離率を `subscription_baseline_validation_report` で記録

---

## §7 NG-3 確定値判定への活用 (5/30 議決連動)

### §7.1 5/30 議決時に提供する根拠データ

| データ | 用途 (姉妹レポート §3 案 A/B/C との対応) |
|---|---|
| 27 日間 subscription_api_equivalent_usd 累計 | 案 A 採択判定 ($1,000 維持の妥当性) |
| 27 日間 weekly_cap_usage_max | 案 B 採択判定 ($1,200 上方修正の必要性) |
| subscription / api_key 経路別累計 | 案 C 採択判定 (細分化の意義検証) |
| AD-1〜4 異常検知履歴 | リスク警戒事項 (姉妹レポート §5.2) |
| Phase 2 予測 phase2_predicted_subscription_usd_monthly | Phase 2 着手判断軸への影響 (姉妹レポート §6) |

### §7.2 5/29 18:00 JST までに必要な集計

- 5/4-5/29 の 26 日間 daily aggregate (5/29 23:55 cron 完了後 5/30 朝に最終 27 日間集計)
- weekly summary 4 週分 (W0-Week1 / W0-Week2 / W1 / W2)
- AD-1〜4 異常検知発火履歴 + Slack 通知 archive

---

## §8 Dev 部門への依頼内容

### §8.1 依頼一覧

| # | 種別 | 内容 | 工数想定 | 期限 |
|---|---|---|---|---|
| D-1 | 新規 DDL | `subscription_usage_baseline` table migration (`20260504000001_subscription_usage_baseline.sql`) | 0.2 日 | 5/9 (W0-Week2 必須施策と並列) |
| D-2 | 新規 RPC | `aggregate_subscription_baseline_daily(target_date DATE)` | 0.3 日 | 5/9 |
| D-3 | 新規 RPC | `aggregate_subscription_baseline_weekly(week_start DATE)` | 0.3 日 | 5/16 (W0-Week2 末) |
| D-4 | 拡張 | `cost_ledger` table に `subprocess_id` / `route` / `cache_creation_tokens` / `cache_read_tokens` / `error_class` column 追加 | 0.2 日 | 5/9 |
| D-5 | 拡張 | `anthropic-spend-tracker.ts` に subprocess 完了時 stream-json `result` event 抽出 + `cost_ledger` 書込ロジック追加 | 0.3 日 | 5/16 |
| D-6 | 新規 cron | daily aggregation cron (23:55 JST、PM monthly tracker と統合) | 0.1 日 | 5/16 |
| D-7 | 新規 cron | weekly summary cron (日曜 23:55 JST) | 0.1 日 | 5/19 (W1 着手日) |
| D-8 | 拡張 | `cost-watcher.ts` に AD-1〜4 異常検知ロジック追加 | 0.3 日 | 5/22 (W1 中盤) |
| D-9 | 新規 dashboard | PRJ-020 ClawDialog 透明性 Dashboard に経路別 KPI 9 指標表示 + AD-1〜4 履歴 panel | 0.5 日 | 5/26 (Phase 1 着手日) |
| D-10 | 新規 GHA | `.github/workflows/subscription-baseline-snapshot.yml` daily snapshot to artifact (Supabase 障害時バックアップ) | 0.1 日 | 5/19 |
| | **合計** | | **2.4 日** | |

### §8.2 依頼の優先度

- **最優先 (5/9 期限)**: D-1, D-2, D-4 (DDL + 基本 RPC + cost_ledger 拡張) — daily 集計開始の最小要件
- **W0-Week2 内 (5/16 期限)**: D-3, D-5, D-6 — weekly summary + spawn tracker 拡張
- **W1 着手前後 (5/19-5/22)**: D-7, D-8, D-10 — weekly cron + 異常検知 + GHA snapshot
- **Phase 1 着手日 (5/26)**: D-9 — dashboard 表示

### §8.3 依頼書添付資料

- 本書 §4.1 DDL (そのまま migration として使用可)
- 本書 §4.2 / §4.3 RPC (そのまま実装可)
- 本書 §5 AD-1〜4 異常検知ロジック (cost-watcher.ts 拡張仕様として使用可)

### §8.4 依頼の Risk / 依存関係

- **R-Dev-Baseline-01 (緑)**: D-1〜10 が議決-24 5 必須施策 (mock-claude / HITL テンプレ / E2E 限定 / ナレッジ batch caching / drill 簡易化) と工数競合の可能性
  - mitigation: Dev 部門で W0-Week2 (5/9-5/22) のスプリント計画に組込、5 必須施策と並列実施
- **R-Dev-Baseline-02 (緑)**: Anthropic Console weekly cap usage が API 提供されない場合 HTML scraping 依存
  - mitigation: 手動値取得への fallback 経路を確保 (毎日 09:00 / 21:00 JST monitor、H-09 統合)

---

## §9 結論

### §9.1 結論 (3 行)

1. **subscription 主軸実消費ベースライン測定設計確立**: 9 指標 / 3 系統統合計測 / daily + weekly 集計 / Supabase 格納 / GHA artifact バックアップ。
2. **5/30 NG-3 確定値判定の根拠データ供給**: 案 A/B/C すべての判断軸を実データで裏付け、姉妹レポート §3 連動。
3. **Phase 2 予測モデル構築**: 線形外挿 + cache hit rate 補正 + Phase 2 別 DEC 起票 (8/1 想定) インプット供給。

### §9.2 採択推奨

- **議決-24 連動**: 本書設計を Dev 部門 W0-Week2 (5/9-5/22) スプリントに組込実装、5/30 議決前の 5/29 18:00 JST 時点で全 9 指標 daily + weekly 集計完了。
- **Phase 1 通期維持**: 6/13 Phase 1 完了レビューまで継続計測、Phase 2 計画書起案 (8/1 想定) インプット化。
- **PRJ-020 ClawDialog 透明性 Dashboard 統合**: DEC-019-033 透明性 Dashboard に経路別 KPI 9 指標を組込、Owner 可視化。

### §9.3 関連 DEC との連動

| DEC | 連動内容 |
|---|---|
| DEC-019-051 | subscription 主軸方針の実消費ベースライン取得 = 本書直接実装 |
| DEC-019-050 | API spend cap $30 充当率を AD-4 で監視 |
| DEC-019-008 | NG-3 ② $1,000/月相当の subscription_api_equivalent_usd で試算 |
| DEC-019-016 | $300 追加発生上限の充当率を weekly summary で集計 |
| DEC-019-033 | 透明性 Dashboard に 9 指標統合 (D-9) |

---

## §10 関連レポート相互参照

- `projects/PRJ-019/reports/research-subscription-mainline-validation.md` (本書親、§7.4 で 5/30 議題用ベースライン取得を推奨)
- `projects/PRJ-019/reports/research-5-30-ng3-revaluation-agenda.md` (本書姉妹、5/30 議題詳細)
- `projects/PRJ-019/reports/dev-budget-guard-30usd-v1.md` (Dev 二重防御実装、cost-tracker / cost-watcher / DDL ベース)
- `projects/PRJ-019/reports/pm-budget-v2-monthly-tracker-template.md` (PM 月次トラッカー、cron 統合先)
- `projects/PRJ-019/reports/research-changelog-monitoring-runbook.md` (4 系統監視 Runbook、AD-2 (weekly cap 80%) の Slack 通知連動)
- `projects/PRJ-019/decisions.md` DEC-019-008 / DEC-019-016 / DEC-019-050 / DEC-019-051

---

## フッタ

- 文書: `projects/PRJ-019/reports/research-subscription-baseline-measurement-design.md`
- 版: v1.0 (2026-05-04)
- 次回レビュー: 5/29 18:00 JST (5/30 議決前最終データ確認) / 6/13 Phase 1 完了レビュー (Phase 2 予測モデル検証)
- 作成: Research 部門 / 検収予定: Dev 部門 (DDL/RPC 実装妥当性) + CEO + Owner
- 改版履歴:
  - v1.0 2026-05-04: 初版 (Owner「CEO 推奨案で進めて下さい」明示承認受領後、議決-24 連動 + 5/30 NG-3 議題根拠データ供給設計として起案)
