# Dev-HHH R30 W6-A health route handlers + 4 probe 物理化レポート

最終更新: 2026-05-06 W0-Week2
起案: Dev 部門 R30 Dev-HHH (9 並列 8 軸目 / Round 30)
位置付け: R29 Dev-FFF 引継 2「health 4 endpoint route handler + probe 実装」を完遂。既存 4 evaluator (liveness / readiness / startup / custom) は absolute 無改変、新規 file で route factory + 4 probe (sentry / vercel / supabase / cost-tracker) を起票。
版: v1.0 (R30 着地 / 120 行以内)
連動 DEC: DEC-019-049 (Supabase) / 068 (5 trigger) / 080 (Sentry 実発火) / 081 (月次予算)

---

## §1 起票物

| # | path | 行数 | 役割 |
|---|------|------|------|
| 1 | `app/openclaw-runtime/src/health/route-handlers.ts` | 123 | 4 endpoint Next.js Route Handler factory |
| 2 | `app/openclaw-runtime/src/health/probes/sentry.ts` | 43 | Sentry health probe |
| 3 | `app/openclaw-runtime/src/health/probes/vercel.ts` | 49 | Vercel status probe |
| 4 | `app/openclaw-runtime/src/health/probes/supabase.ts` | 43 | Supabase REST probe |
| 5 | `app/openclaw-runtime/src/health/probes/cost-tracker.ts` | 47 | 月次予算消化率 probe |
| 6 | `app/openclaw-runtime/src/health/__tests__/probes.test.ts` | 129 | unit test 10 case |

合計 434 行 / 既存 file 改変 0 件。

## §2 4 endpoint 設計

| endpoint | factory | 200 返却条件 | 503 返却条件 |
|----------|---------|--------------|---------------|
| `/api/health/liveness` | `createLivenessRoute` | status='ok' | (内部 evaluator は常に ok 返却) |
| `/api/health/readiness` | `createReadinessRoute` | status in {ready, degraded} | 1+ probe='down' |
| `/api/health/startup` | `createStartupRoute` | status='started' | 1+ pendingItem 存在 |
| `/api/health/custom` | `createCustomRoute` | 5 trigger all true | 1+ trigger=false |

`Cache-Control: no-store, no-cache, must-revalidate` 共通付与で probe stale 化を防止。

## §3 4 probe mapping

| probe | up | degraded | down |
|-------|----|----------|------|
| sentry | 2xx | 4xx (auth 等) | 5xx / abort / network err |
| vercel | indicator='none'/'partial' | 'minor' | 'major'/'critical'/non-ok |
| supabase | 2xx | 4xx (anon key 等) | 5xx / network err |
| cost-tracker | ratio < 0.95 | 0.95 ≤ ratio < 1.0 | ratio ≥ 1.0 / timeout |

各 probe は `AbortController` + timeout (default 3000ms) で hang 防止。

## §4 既存 file 連動 (無改変)

```
route-handlers.ts (新規)
   │
   ├─> evaluateLiveness({ startedAt })          ← 既存 liveness.ts 無改変
   ├─> evaluateReadiness({ sentry, ... })       ← 既存 readiness.ts 無改変
   ├─> evaluateStartup(checks)                  ← 既存 startup.ts 無改変
   └─> evaluateCustomHealth(evidence)           ← 既存 custom.ts 無改変
```

既存 4 file の mtime (06:24:45-06:25:01) は不変、re-export / pass-through のみで結合。

## §5 unit test 10 case (probes.test.ts)

| # | case | 検証点 |
|---|------|--------|
| 1 | sentry probe up | 200 → 'up' |
| 2 | vercel probe minor → degraded | indicator mapping |
| 3 | vercel probe major → down | indicator mapping |
| 4 | supabase probe degraded on 401 | 4xx mapping |
| 5 | cost-tracker degraded at 0.96 | threshold 境界 |
| 6 | cost-tracker down at 1.05 | over budget |
| 7 | liveness route 200 + uptimeMs | startedAt diff |
| 8 | readiness route 503 when down | not_ready 503 |
| 9 | startup route 503 pending | pendingItems incl 'migration' |
| 10 | custom route 200 all 5 pass | satisfied=5 |

## §6 R31 Dev-KKK 引継 candidate

- `app/api/health/{liveness,readiness,startup,custom}/route.ts` thin re-export 配置 (Next.js App Router 物理化)
- DEC-019-080+081 採決後の Sentry SDK init + Vercel monitor wire の本格組込
- probe 並列実行時の P99 latency 測定 (target < 800ms)

## §7 制約遵守

| 制約 | status |
|------|--------|
| 既存 4 file (liveness / readiness / startup / custom) 無改変 | PASS (mtime 06:24-06:25 維持) |
| DEC-019-001-079 absolute 無改変 | PASS |
| 物理 deploy 0 件 | PASS (route 配置 0 件) |
| API call $0 | PASS (test fetcher 注入のみ) |
| 絵文字 0 / 副作用 0 | PASS |
| 物理改変 = 新規 file 追加のみ | PASS |

## §8 結語

W6-A health 4 endpoint の route handler + 4 probe 実装起票完遂。既存 evaluator 4 file は absolute 無改変のまま、新規 6 file (route 1 + probe 4 + test 1) でブリッジング。Next.js App Router 配置は R31 Dev-KKK 引継 (薄い re-export 1-2 行 × 4 file)。GTC-7 Owner ACK 後 mode 切替で probe live 化可能、本 round では起票のみ完遂。
