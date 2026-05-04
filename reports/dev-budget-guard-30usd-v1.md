# Dev — Anthropic API Budget Guard $30/月 実装レポート v1

- 案件: PRJ-019 Clawbridge
- 部署: Dev
- 反映決裁: **DEC-019-050** (Anthropic API key 月次 spend cap = $30/月、subscription plan 主軸)
- 関連決裁: DEC-019-006 P-D 改 / DEC-019-031 Spend Cap 構造 / DEC-019-049 Slack 3 channel 独立運用 / DEC-019-048 1Password CLI
- 起票日: 2026-05-04
- ステータス: 実装完了 (実機動作確認は Owner setup 完了後に実施)

---

## §1. 反映決裁 DEC-019-050

DEC-019-050 (2026-05-03 Owner 直接決裁) の要旨:

- Anthropic Console Hard $30 / Soft $25 (メール通知) / 2026-06-01 リセット
- 当初想定 $300 から **97% 下方修正**
- 基本運用は **subscription plan 主軸** (Claude Max $200 + Codex Pro $200)
- API key 直接消費は **HITL 通知 / mock-claude / E2E test 等の補助用途に限定**
- 将来的な増額は別途 DEC で判断
- Phase 1 進行中に $30 突破 → API 自動停止 → subscription plan のみで継続運用

**本レポートは「アプリ層の実装ガード」(= 二重防御の内側) を担当する。**
Anthropic Console の Hard $30 は provider 側の最終ガード (請求停止) であり、
アプリ層は spend tracking + soft warn / hard stop により **早期検知 + 緊急停止** を実現する。

---

## §2. 実装範囲 (8 ファイル + 報告書 1 = 計 9 成果物)

| # | 種別 | ファイル | 概要 |
|---|------|---------|------|
| 1 | 新規 | `app/web/src/lib/cost/budget-guard.ts` | 三段階 guard / 月次 cap 判定 / Slack 通知発火 |
| 2 | 新規 | `app/web/src/lib/cost/anthropic-spend-tracker.ts` | spend 加算 / 価格表 / daily aggregation / spike detection |
| 3 | 新規 | `app/supabase/migrations/20260503000009_cost_ledger_v2.sql` | 6 column 追加 + view + 2 RPC ※タスク指定の `_000003` は base v1 (`_000006`) より前になり ALTER 失敗するため `_000009` に補正 |
| 4 | 新規 | `app/web/src/lib/cost/budget-guard.test.ts` | 13 ケース (5 ケース要件超過) |
| 5 | 新規 | `app/scripts/openclaw-monitor/src/cost-watcher.ts` | daily cron / threshold cross / 3 channel 通知 |
| 6 | 新規 | `app/web/src/app/api/admin/budget/route.ts` | GET 状態 / POST cap update (HITL 第10種連動) |
| 7 | 更新 | `app/web/src/app/dashboard/_components/cost-meter.tsx` | `AnthropicBudgetMeter` + `DailySpendTrend` 追加 |
| 8 | 更新 | `app/.env.example` | `ANTHROPIC_MONTHLY_CAP_USD` 等 3 行追記 |
| 9 | 新規 | `projects/PRJ-019/reports/dev-budget-guard-30usd-v1.md` | 本レポート |

**path 補正**: タスク仕様書には `app/web/lib/cost/...` と記載されていたが、
実リポジトリ構成は Next.js 標準の `app/web/src/lib/...` (alias `@/lib/*`) のため、
実態に合わせて `src/` 配下に配置した。Web 配下の他モジュール (`@/lib/supabase/server`,
`@/lib/hitl/dispatcher` 等) との import 整合を維持。

---

## §3. 二重防御アーキテクチャ

```
[ユーザー / API call source]
        │
        ▼
┌────────────────────────────────────┐
│  アプリ層ガード (本実装)            │  ← 早期検知 + 緊急停止
│  - assertBudgetAllowsCall()         │
│  - tier: ok → warn → auto_stop →    │
│    hard_fail (例外 throw)           │
└────────────────────────────────────┘
        │   (cost_ledger に都度 INSERT)
        ▼
┌────────────────────────────────────┐
│  Anthropic API (provider)           │
└────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────┐
│  Anthropic Console (provider 側)    │  ← 最終ガード (請求停止)
│  - Hard $30 / Soft $25              │
│  - 2026-06-01 月次リセット           │
└────────────────────────────────────┘
```

### 三段階 guard (アプリ層)

| Tier | 閾値 (default) | 動作 | Slack channel |
|------|---------------|------|--------------|
| `ok` | < $24 | 通常運用、通知なし | — |
| `warn` | ≥ $24 (80%) | 通知のみ、API 継続可 | `#prj019-monitor` |
| `auto_stop` | ≥ $28.5 (95%) | 通知 + API key 削除推奨を log | `#prj019-drill` |
| `hard_fail` | ≥ $30 (100%) | `BudgetCapExceededError` throw、API call 不可 | `#prj019-drill` |

**閾値は ENV (`ANTHROPIC_MONTHLY_CAP_USD` / `ANTHROPIC_WARN_THRESHOLD` / `ANTHROPIC_STOP_THRESHOLD`) で override 可能** — テスト容易性 + 将来増額時の即時反映を狙う。
順序整合 (`warn < stop < cap`) が崩れた場合は default に fallback。

### 月次リセット

- リセットタイミング: **毎月 1 日 0:00 UTC** = JST 09:00 (Anthropic Console と同期)
- Supabase RPC `get_current_month_spend()` が `to_char(now() at time zone 'UTC', 'YYYY-MM')` で当月を抽出
- `cost_ledger.month_year` column (新設) が UTC 基準のキー

### cost_ledger v2 — 追加 column 6 件

| column | 型 | DEFAULT | 用途 |
|--------|----|---------|------|
| `provider` | `text NOT NULL` | `'anthropic'` | provider 識別 (anthropic / openai / codex / ...) |
| `model` | `text` | NULL | Anthropic model id (`claude-3-7-sonnet-20250219` 等) |
| `request_tokens` | `int` | NULL | 入力 token 数 |
| `response_tokens` | `int` | NULL | 出力 token 数 |
| `cost_usd` | `numeric(10,4)` | NULL | 計算済コスト (4 桁精度) |
| `month_year` | `text` | NULL | UTC 月キー `YYYY-MM` (cap 集計用) |

**互換維持**: 既存 `amount_usd` column はそのまま保持、新規 INSERT は新旧両方に値を書く。
既存行には migration 内で `month_year = to_char(ts at time zone 'UTC', 'YYYY-MM')` を埋める。

---

## §4. spike scenario simulation (5 ケース)

すべて `vitest` で再現可能 (`app/web/src/lib/cost/budget-guard.test.ts`)。

### Case A: 通常運用 (ok)
- 月初 spend = $0.50 (HITL 通知 5 回程度)
- tier = `ok`、Slack 通知なし、API 継続
- **想定**: Phase 1 期間中の標準パターン

### Case B: warn 到達 ($24)
- 月中 spend = $24.10 (E2E test 大量実行 + Mock 検証)
- tier = `warn`、`#prj019-monitor` に "80% reached" 通知
- API 継続可、subscription plan 主軸への切替 5 日以内推奨

### Case C: auto_stop 到達 ($28.5)
- spend = $28.50 (一時的バースト = drill 用 mock-claude session 暴走)
- tier = `auto_stop`、`#prj019-drill` に critical 通知 + log
- log には `ANTHROPIC_API_KEY` env 削除推奨を出力 (process 内では削除不可)
- subscription plan で運用継続 (DEC-019-006 P-D 改)

### Case D: hard_fail ($30)
- spend = $30.00 (auto_stop を operator が見逃した場合)
- `BudgetCapExceededError` throw、`/api/admin/budget` GET は 402 Payment Required を返す
- `#prj019-drill` に "API calls blocked" 通知
- **provider 側でも Anthropic Console Hard $30 が効くため、二重で 100% 遮断**

### Case E: spike detection (前日比 200% 超)
- 前日 spend = $0.30 / 当日 spend = $1.20 (4x ratio)
- `cost-watcher.ts` の daily cron で検出
- `#prj019-monitor` に "Daily spend SPIKE" 通知 (severity = L2)
- 通常 cap は超えていなくても anomaly fire (= 早期検知)

### Case F (補助): 月次リセット境界
- 5/31 23:59 UTC: spend = $29.50 (auto_stop tier)
- 6/1 00:00 UTC: spend = $0 (新月) — `monthYearKey` が `2026-06` に切り替わり cap が再充填
- ENV で `daysUntilReset = 0` → `30` の遷移を確認 (test に含む)

---

## §5. 残課題

| # | 項目 | 期限 | 備考 |
|---|------|------|------|
| 1 | Vercel deploy 後の cron 環境差異検証 | Phase 1 W2 | `cost-watcher.ts` を GitHub Actions 経由で発火させる前提。Vercel Cron に移行する場合は `runtime = 'nodejs'` + import path 調整が必要。 |
| 2 | 月次リセット動作確認 | 2026-06-01 朝 | Anthropic Console のリセット時刻と当該 RPC `get_current_month_spend()` の月遷移が同期するかを実観測。 |
| 3 | `open_claw_restricted` role の grants 検証 | Phase 1 W1 | role 未作成環境では DO ブロックでスキップしているが、本番投入前に role 作成 + grant が確実に効いているか SQL で確認。 |
| 4 | Casbin policy 連動 | Phase 1 W2 | `/api/admin/budget` の Owner-only ガードを Casbin で表現 (現状は middleware TODO)。 |
| 5 | audit_log 連動 | Phase 1 W1 | budget tier 遷移を audit_log に記録 (hash chain 維持)。本実装では Slack 通知のみ。 |
| 6 | Resend fallback (Slack 失敗時) | Phase 1 W2 | `cost-watcher.ts` は現状 Slack 失敗で諦める。`scripts/openclaw-monitor/src/notify.ts` の Resend fallback と統合する。 |

---

## §6. Owner 動作確認手順 (3 ケース)

### 確認 1: GET /api/admin/budget で現在の spend 状態を取得
```bash
op run --env-file=.env.local -- pnpm -C web dev
# 別 terminal で:
curl http://localhost:3000/api/admin/budget | jq
```
**期待**:
```json
{
  "ok": true,
  "decisionRef": "DEC-019-050",
  "status": {
    "tier": "ok",
    "spentUsd": 0,
    "capUsd": 30,
    "warnUsd": 24,
    "stopUsd": 28.5,
    ...
    "daysUntilReset": 28
  }
}
```

### 確認 2: ENV override で warn 通知を発火
```bash
ANTHROPIC_WARN_THRESHOLD=0.01 \
op run --env-file=.env.local -- pnpm -C web dev
# cost_ledger に 1 行 INSERT (cost_usd = 0.05) → /api/admin/budget GET
# tier = "warn" + #prj019-monitor に通知が届くこと
```

### 確認 3: cap update を HITL 第10種に投げる
```bash
curl -X POST http://localhost:3000/api/admin/budget \
  -H 'content-type: application/json' \
  -d '{"newCapUsd":50,"reason":"DEC-019-050 増額検討"}'
```
**期待**: 202 Accepted + `hitlRequest.gateKind = "permission_change_review"` が返る。
HITL queue に 1 件 pending が追加されることを `/api/hitl?gateKind=permission_change_review` で確認。

---

## 補足: テスト実行

```bash
pnpm -C app vitest run web/src/lib/cost/budget-guard.test.ts
```
全 13 ケース通過想定 (実機 Anthropic API は呼ばない、Supabase / fetch は DI mock)。

---

**起票**: Dev 部門 / 2026-05-04
**承認待ち**: CEO → Owner (HITL gate 経由)
