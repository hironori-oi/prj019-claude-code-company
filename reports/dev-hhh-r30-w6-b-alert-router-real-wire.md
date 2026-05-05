# Dev-HHH R30 W6-B alert-router real wire 物理化レポート

最終更新: 2026-05-06 W0-Week2
起案: Dev 部門 R30 Dev-HHH (9 並列 8 軸目 / Round 30)
位置付け: R29 Dev-FFF 引継 1「実 wire 物理化」のうち W6-B alert-router 側を完遂。既存 `alert-router.ts` (R29 物理化 67 行) の `dispatchAlert(route, input, dispatcher)` dispatcher 第 3 引数互換 implementation を新規 file で起票、既存 file は absolute 無改変保持。
版: v1.0 (R30 着地 / 120 行以内)
連動 DEC: DEC-019-068 (5 trigger) / 080 (Sentry 実発火必須化) / 081 (月次予算 alert)

---

## §1 起票物

| # | path | 行数 | 役割 |
|---|------|------|------|
| 1 | `app/openclaw-runtime/src/alerting/alert-router-real-wire.ts` | 191 | Slack + PagerDuty + SMTP dispatcher factory |
| 2 | `app/openclaw-runtime/src/alerting/__tests__/alert-router-real-wire.test.ts` | 131 | unit test 6 case |

合計 322 行 / 既存 file 改変 0 件。

## §2 3 channel wire 設計

| channel | wire | live mode 動作 | mock 動作 |
|---------|------|----------------|------------|
| slack | Incoming Webhook POST | `POST {webhookUrl}` JSON body (`text` + `attachments[].fingerprint`) | `MOCK_DELIVERIES.push` |
| pagerduty | Events API v2 | `POST events.pagerduty.com/v2/enqueue` (`routing_key` + `event_action='trigger'` + `dedup_key`) | 同上 |
| email | SMTP send 注入 | `opts.smtp.send({to, subject, textBody})` を recipient ごと | 同上 |

severity → PagerDuty severity mapping: `emergency → critical`, `critical → error`, `warning → warning`。

## §3 RealWireMode 3 値

| mode | 用途 |
|------|------|
| live | GTC-7 Owner ACK 後の物理通知 (本 round では使用 0 件) |
| dry-run | log 出力のみ / network 0 件 |
| mock | in-memory `MOCK_DELIVERIES` 蓄積 (test 用) |

## §4 既存 `alert-router.ts` 連動 (無改変)

```
dispatchAlert(route, input, dispatcher)         ← 既存 alert-router.ts 67 行 無改変
        │
        └─> for ch of route.channels:
                dispatcher(ch, input)            ← createRealChannelDispatcher() が返す関数
                       │
                       └─> mode 分岐 (live/dry-run/mock)
                                │
                                ├─> slack:     fetch(POST webhookUrl)
                                ├─> pagerduty: fetch(POST events.pagerduty.com)
                                └─> email:     opts.smtp.send(...) × recipients
```

既存 `alert-router.ts` mtime 06:25:32 維持、line 51-67 (`dispatchAlert` 実装) 1 byte も触れず。

## §5 unit test 6 case

| # | case | 検証点 |
|---|------|--------|
| 1 | mock mode records deliveries | mock store に 2 channel (slack + pagerduty) 蓄積 |
| 2 | dry-run skips network | fetcher 未呼出 / `kind: 'skip'` log 2+ |
| 3 | live slack POST | webhookUrl + body.text に severity 含む |
| 4 | live pagerduty POST | routing_key + dedup_key + payload.severity='error' |
| 5 | live email multi recipient | emergency severity + 2 recipient で send 2 回 |
| 6 | live error propagation | slack 403 で Error throw |

## §6 dedup key 設計

`${severity}:${source}:${fingerprint}` を slack/email 用 dedupKey + pagerduty 用 dedup_key 両用。R29 `routeAlert` が生成する `route.dedupKey` と PagerDuty payload 内の `dedup_key` は等価フォーマット。alert flood 時 PagerDuty 側で suppression が動作する設計。

## §7 R31 Dev-KKK 引継 candidate

- **DEC-080+081 採決連動 live mode 実発火 e2e** (本 wire 起票完遂 / mode='live' 切替のみ)
- Slack message 装飾 (Block Kit) 拡張 / 現状は plain text + attachments minimum
- PagerDuty resolve event (event_action='resolve') 連携 / 現状は 'trigger' のみ
- SMTP rate limit / retry policy 整備

## §8 制約遵守

| 制約 | status |
|------|--------|
| 既存 `alert-router.ts` 無改変 | PASS (mtime 06:25:32 維持) |
| DEC-019-001-079 absolute 無改変 | PASS |
| 物理通知 0 件 | PASS (live 呼出 0 件 / mock + test fetcher のみ) |
| API call $0 | PASS |
| 絵文字 0 / 副作用 0 | PASS |
| 物理改変 = 新規 file 追加のみ | PASS |

## §9 結語

W6-B alert-router 3 channel 実 wire 起票完遂。R29 Dev-FFF が物理化した severity → channels routing + dedupKey 生成ロジックを、Slack Webhook / PagerDuty Events API / SMTP 経由で実 alert path に接続する design を確立。DEC-019-080 (Sentry 実発火) + DEC-019-081 (月次予算 alert) 採決後、`mode: 'live'` への切替のみで本番 alert 発火が起動する。本 round では起票のみ完遂、物理通知 0 件厳守。
