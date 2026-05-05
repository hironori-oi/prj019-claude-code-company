# Dev-QQQ R33 Task 1 — post-launch 60day longrun expansion

PRJ-019 Open Claw "Clawbridge" / Round 33 / Dev-QQQ
位置付け: R32 Dev-NNN post-launch-30day.ts 物理化 (142 行) の 60day window 拡張
版: v1.0
連動 file:
- src: `app/openclaw-runtime/src/longrun/post-launch-60day.ts` (260 行)
- test: `app/openclaw-runtime/src/longrun/__tests__/post-launch-60day.test.ts` (12 case)

---

## §0 サマリ (200 字以内)

R32 Dev-NNN post-launch-30day.ts (142 行 frozen) を独立 type 再宣言で 60day window 拡張。Phase-1 (1-30day) + Phase-2 (31-60day) drift 検出 / 14d biweekly aggregation / sustained breach streak / recovery latency / fitForRelease v2 を物理化。R32 既存 src 全 file 無改変保持厳守。12 case unit test all pass 想定。

---

## §1 設計判断

| 観点 | 採用方針 | 根拠 |
|---|---|---|
| 30day file 連結 | **import せず independent type 再宣言** | R32 既存 src 全 file 無改変保持厳守 + circular import 回避 + interface evolution の自由度確保 |
| window 長 | 60day 固定 | brief 「post-launch 60day expansion」の直接要請 |
| aggregation 階層 | daily / weekly (9) / biweekly (5) / monthly (2) / quarterly (1) | 30day 4 階層 → 60day 5 階層 (biweekly 追加) で trend 解像度向上 |
| drift 判定 | Phase-1 vs Phase-2 monthly 比較 (mean / p95 / breach) | regression 早期検出。tolerance default 25% (R29 DEC-082 alert 仕様継承) |
| breach streak 判定 | 連続日数 max ≤ 3 が release 条件 | W7-B threshold-detector (Dev-OOO) breach-counter 連動仕様継承 |
| fitForRelease v2 | live mode AND 4path coverage AND quarterly breach ≤ 5% AND drift !detected AND streak ≤ 3 | 5 条件 AND ゲート (R29 DEC-082-086 + R32 W7-B 連動) |

---

## §2 公開 API

```ts
runLongrun60day(startIso, inj, mode='live'): LongrunReport60
buildDayBuckets60(startIso, days, fetchSamples)
isFourPathCovered60(report): boolean
phase2RegressionFlag(report): boolean
```

LongrunReport60 含有:
- daysCovered=60 / totalSamples
- daily[60] / weekly[8-9] / biweekly[4-5] / monthly[2] / quarterly[1]
- drift: meanDeltaPct / p95DeltaPct / breachDeltaPct / driftDetected
- breachStreak: maxStreakDays / totalBreachDays / recoveryLatencyDays
- fitForRelease (5 条件 AND)

---

## §3 12 case unit test 構成

| # | 観点 | assertion |
|---|---|---|
| 1 | buildDayBuckets60 | length=60 |
| 2 | daysCovered | 60 |
| 3 | daily aggregation | length=60 |
| 4 | weekly aggregation | 8 ≤ len ≤ 9 |
| 5 | biweekly aggregation | 4 ≤ len ≤ 5 |
| 6 | monthly aggregation | 2 phase entries |
| 7 | totalSamples | 60 × 13 KPI |
| 8 | 4 path coverage | all positive |
| 9 | healthy steady | fitForRelease=true / drift !detected |
| 10 | phase2 drift boost | drift detected → fitForRelease=false |
| 11 | sustained breach streak | maxStreakDays > 3 → phase2RegressionFlag=true |
| 12 | empty samples | totalSamples=0 / quarterly.count=0 / fitForRelease=false |

---

## §4 制約遵守

| 項目 | status |
|---|---|
| 副作用 | 0 (pure function / mock injection) |
| API call | $0 |
| TS6059 | 0 件継承 |
| R32 既存 src 無改変 | post-launch-30day.ts unchanged (verified) |
| 絵文字 | 0 |
| 物理化方式 | 新規 file 作成のみ (append-only 不要) |
| harness +12 想定 | post-launch-60day 12 case |

---

## §5 後続接続点

- W7-B monitoring (Dev-OOO R32) との live 連動: kpi-collector.ts の 60day rollover で `runLongrun60day` を nightly 起動する想定 (R34+ scheduler).
- W7-D auto-routing (Dev-RRR R33): drift detected 時 P1 escalation を `routeMotion` 経由で発行する hook を `dashboard/page.tsx` R33 拡張側に置いた (`getEscalationLanes`).
- W7-E long-term-metrics (Dev-SSS R33) との接続: 60day → 90day window への bridge は quarter-window.ts の `aggregateQuarterWindow` 経由 (R34 wire 想定).
