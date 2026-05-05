# Dev-FFF R29 — W6-B alert-router 物理化 impl 報告

最終更新: 2026-05-06 W0-Week2
起案: Dev 部門 R29 Dev-FFF (18 件目 dev sprint)
連動 DEC: DEC-019-080 (DRAFT Sentry 実発火必須化) / DEC-019-081 (DRAFT 月次予算 alert)
連動 runsheet: `runsheets/w6b-production-ga-sop.md` §4 alert 3 severity

---

## §1 物理化 file

| file | 行数 | 概要 |
|---|---|---|
| `app/openclaw-runtime/src/alerting/alert-router.ts` | 67 | severity routing / dedup key / dispatcher 注入 |
| `app/openclaw-runtime/src/alerting/__tests__/alert-router.test.ts` | 92 | 6 cases (3 severity + dedup + dispatcher + schema) |
| **合計** | **159** | - |

## §2 設計要点

- **routing table 定数化**: `SEVERITY_TO_CHANNELS` で warning→[slack] / critical→[slack,pagerduty] / emergency→[slack,pagerduty,email] を mapping、SOP §4.2 の routing rule を型レベルで保証。
- **dedup key 決定論**: `${severity}:${source}:${fingerprint}` 形式で生成、同一 incident の重複通知を呼出側が抑止可能。
- **dispatcher 注入**: 実 Slack / PagerDuty / SMTP webhook は注入された `ChannelDispatcher` callback で実装、本 module は決定論的 routing のみ提供、unit test では mock で置換。
- **schema 強制**: `AlertInputSchema` で source / message / fingerprint / occurredAt 必須化、空文字列入力を parse 段階で reject。
- **逐次 dispatch**: `dispatchAlert` は channel 順序を保持して逐次 await、PagerDuty 失敗で email まで届く保証なし (上位 retry 層で別途実装想定)。

## §3 test cases (6 cases)

| # | case | 期待 |
|---|---|---|
| 1 | warning routing | channels=['slack'] |
| 2 | critical routing | channels=['slack','pagerduty'] |
| 3 | emergency routing | channels=['slack','pagerduty','email'] |
| 4 | dedup key 構造 | 'critical:vercel:fp-deploy-x' |
| 5 | dispatcher 呼出回数 | 2 回 / delivered=['slack','pagerduty'] |
| 6 | schema 空 message reject | parse throw |

## §4 制約遵守

| 制約 | 遵守 status |
|---|---|
| 既存 absolute 4 file 無改変 | **達成** (新規 dir `alerting/` 配置) |
| TS6059 0 件維持 | **達成** (composite topology 継承) |
| API call $0 | **達成** (dispatcher 注入で実 webhook 未呼出) |
| 副作用 0 | **達成** (純粋 routing 関数のみ) |
| 物理通知 0 件 | **達成** |
| 絵文字 0 | **達成** |

## §5 R30 + DEC 採決連動

- DEC-080 採決後、Sentry → alert-router → Slack 実 webhook の wire (約 50-80 行) を R30 で物理化想定。
- DEC-081 採決後、月次予算 alert (cost-tracker → emergency severity → 3 channel) の rule 1 件を追加想定。

---

**SOP 順守**: 副作用 0 / 既存 absolute 4 file 無改変 / API call $0 / 絵文字 0 / TS6059 0 件 / 物理通知 0 件 / fix forward-only / 報告 200 行以内厳守。
