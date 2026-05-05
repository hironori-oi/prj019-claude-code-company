# Dev-HHH R30 W6-A canary Vercel Edge Config wire 物理化レポート

最終更新: 2026-05-06 W0-Week2
起案: Dev 部門 R30 Dev-HHH (9 並列 8 軸目 / Round 30)
位置付け: R29 Dev-FFF 引継 1「実 wire 物理化」のうち W6-A canary 側を完遂。既存 `edge-config-canary.ts` (R29 物理化 117 行) の `applyCanary(decision, writer)` writer 第 2 引数互換 implementation を新規 file で起票し、既存 file は absolute 無改変保持。
版: v1.0 (R30 着地 / 120 行以内)
連動 DEC: DEC-019-006 / 062 / 074-079 / 080 (Sentry 実発火必須化) / 081 (月次予算 alert)

---

## §1 起票物

| # | path | 行数 | 役割 |
|---|------|------|------|
| 1 | `app/openclaw-runtime/src/canary/edge-config-canary-vercel-wire.ts` | 135 | Vercel Edge Config writer factory |
| 2 | `app/openclaw-runtime/src/canary/__tests__/edge-config-canary-vercel-wire.test.ts` | 115 | unit test 6 case |

合計 250 行 / 既存 file 改変 0 件。

## §2 設計要点

1. **WireMode 3 値**: `live` (実 PATCH) / `dry-run` (log のみ) / `mock` (in-memory store)。GTC-7 Owner ACK 前は dry-run / mock のみ使用、物理 deploy 0 件厳守。
2. **`createVercelEdgeConfigWriter(opts)` factory**: 既存 `EdgeConfigWriter = (percent: number) => Promise<void>` 互換 signature を返す。`applyCanary(decision, writer)` の writer 引数にそのまま注入可能。
3. **live mode**: `PATCH https://api.vercel.com/v1/edge-config/{id}/items` を発行 (`Authorization: Bearer <token>` + `items[].operation=upsert`)。`vercelTeamId` 指定時は `?teamId=` query 付与。
4. **fetcher 注入**: test では `fetch` 互換関数を注入し、ネットワーク 0 件で PATCH path を完全検証。
5. **logger 注入**: `invoke` / `success` / `fallback` / `error` 4 種 event を観測可能化。
6. **error path**: 非 2xx で `Error('vercel edge config PATCH failed: ...')` throw。`applyCanary` 上位で catch 可能。

## §3 既存 file 連動 (無改変)

```
applyCanary(decision, writer)
              │
              └─> writer(percent)  ← createVercelEdgeConfigWriter() が返す関数
                       │
                       └─> mode 分岐 (live/dry-run/mock)
                                │
                                └─> live: fetch(PATCH ...)
```

既存 `edge-config-canary.ts` line 118-129 (`applyCanary` 実装) に対し、本 wire は呼出側 (caller) の writer 生成器として機能する。 既存 file は 1 byte も触れていない (mtime 06:24:24 維持確認済)。

## §4 unit test 6 case

| # | case | 検証点 |
|---|------|--------|
| 1 | mock mode writes to in-memory store | `applyCanary` + mock writer が in-memory store に percent 書込 |
| 2 | dry-run mode does not call fetch | dry-run で fetcher 未呼出 |
| 3 | live mode issues PATCH with bearer + json body | URL / method / Authorization / body items[].value 検証 |
| 4 | live mode throws on non-2xx | 403 で Error throw |
| 5 | team scoped URL appends teamId query | `?teamId=` 付与確認 |
| 6 | logger receives invoke + success | event sequence 検証 |

## §5 R31 Dev-KKK 引継 candidate

- **GTC-7 Owner ACK 後の live mode 実発火** (本 wire 起票完遂 / mode='live' に切替えるのみ)
- canary stage 0→1→2→3→4 連続 forward の e2e 検証 (preview env)
- alert 連携: applyCanary error 時の自動 dispatchAlert 連結 (本 round 範囲外)

## §6 制約遵守

| 制約 | status |
|------|--------|
| 既存 `edge-config-canary.ts` 無改変 | PASS (mtime 不変) |
| DEC-019-001-079 absolute 無改変 | PASS |
| 物理 deploy 0 件 | PASS (live 呼出 0 件) |
| API call $0 | PASS (test fetcher 注入のみ) |
| 絵文字 0 / 副作用 0 | PASS |
| 物理改変 = 新規 file 追加のみ | PASS |

## §7 結語

W6-A canary 側 Vercel Edge Config 実 wire 起票完遂。R29 Dev-FFF が物理化した stage 0-4 遷移ロジック + writer 抽象を、Vercel REST API PATCH 経由で実 deploy 環境に接続する path を確立した。GTC-7 Owner ACK 取得後、`mode: 'live'` への切替のみで物理 deploy が起動する設計。本 round では起票のみ完遂、物理 deploy 0 件厳守。
