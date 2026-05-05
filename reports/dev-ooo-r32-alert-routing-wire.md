# Dev-OOO R32 — alert routing 3 severity wire 報告

PRJ: PRJ-019 Open Claw "Clawbridge"
Round: 32 / Dev-OOO Task 2
Date: 2026-05-06
Scope: monitoring breach -> alert-router-real-wire.ts (R30 Dev-HHH) connector

## 1. wire 構成

```
[monitoring/threshold-detector.ts]
  -> ThresholdJudgement (severity: ok/info/warn/critical)
[monitoring/alert-routing.ts] decideRouting()
  -> MonitoringRoutingDecision (channel + AlertInput)
[monitoring/alert-routing.ts] dispatchMonitoringAlerts(decisions, dispatcher)
  -> ChannelDispatcher (注入)
[alerting/alert-router-real-wire.ts] createRealChannelDispatcher (R30 Dev-HHH)
  -> mock / dry-run / live (env-gated)
```

## 2. severity -> channel マッピング表

| monitoring severity | channel | AlertInput.severity (alert-router.ts) | 用途 |
|---------------------|---------|---------------------------------------|------|
| info | slack | warning | 情報通知 (即時可視化) |
| warn | pagerduty | critical | warning page (オンコール) |
| critical | email | emergency | critical email (SMTP) |

## 3. AlertInput payload 設計

```ts
{
  severity: <mapped>,
  source: `monitoring/${kpiId}`,
  message: `${kpiId} ${severity.toUpperCase()} threshold ${limit} (value=${value})`,
  fingerprint: `${kpiId}:${severity}`,
  occurredAt: snapshot.timestampIso,
}
```

fingerprint は (kpiId, severity) 単位で安定 — alert-router.ts の dedupKey
`${severity}:${source}:${fingerprint}` と重複しても dispatcher 側で再 hash されるため衝突なし。

## 4. dispatcher 注入経路 (実 API 0 件厳守)

### test 時 (mock)
```ts
const calls: Array<{ ch, input }> = [];
const mockDispatcher: ChannelDispatcher = async (ch, input) => {
  calls.push({ ch, input });
};
await dispatchMonitoringAlerts(decisions, mockDispatcher);
```

### staging 時 (dry-run)
```ts
const { dispatcher } = createRealChannelDispatcherWithEnvGate(
  { mode: 'live', slack, pagerduty, smtp },
  { VERCEL_PROD: 'false' }, // -> 自動 dry-run downgrade
);
```

### prod 時 (live, GTC-7 ACK 後のみ)
```ts
const { dispatcher } = createRealChannelDispatcherWithEnvGate(
  { mode: 'live', ... },
  { VERCEL_PROD: 'true', OWN_W5_PROD_ACK: 'received' },
);
```

R31 Dev-KKK が物理化した env-gate (`resolveDispatcherModeWithEnv`) により、
本 monitoring scope は実 API 呼出を二重 gate で抑止する。

## 5. test verification (alert-routing.test.ts / 8 case)

| # | case | 検証 |
|---|------|------|
| 1 | info -> slack | channel='slack' / mapped='warning' |
| 2 | warn -> pagerduty | channel='pagerduty' / mapped='critical' |
| 3 | critical -> email | channel='email' / mapped='emergency' |
| 4 | ok severity | decideRouting returns null |
| 5 | decideRoutingBatch ok 除外 | 4 -> 3 件 filter |
| 6 | dispatchMonitoringAlerts mock 経由 | 3 channel 全 dispatch / 実 API 0 |
| 7 | dispatcher throw 時 errors 収集 | failed=1 / succeeded=2 |
| 8 | severityChannelMatrix shape | 3 severity x 3 channel matrix |

## 6. 連動 spec / decisions

- DEC-019-080 (Sentry 実発火必須化)
- DEC-019-081 (月次予算 alert)
- runsheets/w6b-production-ga-sop.md §4
- alert-router.ts (R29 Dev-FFF) — 不変
- alert-router-real-wire.ts (R30 Dev-HHH / R31 Dev-KKK) — 不変

## 7. 実 dispatch 0 件厳守 verification

| 経路 | 結果 |
|------|------|
| test (vitest) | mock dispatcher 経由 / network call 0 件 |
| dispatchMonitoringAlerts 内部 | dispatcher 注入のみ / 直接 fetch 呼出 0 件 |
| alert-routing.ts grep "fetch" | 0 件 |
| alert-routing.ts grep "https://" | 0 件 |

## 8. wire 完遂宣言

monitoring breach -> 3 severity x 3 channel x dispatcher injection 経路 物理化完遂。
GTC-7 Owner ACK 後 mode='live' 切替で R30 Dev-HHH 実 wire と接続可能な状態。
