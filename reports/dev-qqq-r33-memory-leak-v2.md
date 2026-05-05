# Dev-QQQ R33 Task 3 — memory-leak-detector v2

PRJ-019 Open Claw "Clawbridge" / Round 33 / Dev-QQQ
位置付け: R32 Dev-NNN memory-leak-detector.ts 物理化 (83 行 frozen) の v2 拡張
版: v1.0
連動 file:
- src: `app/openclaw-runtime/src/diagnostics/memory-leak-detector-v2.ts` (214 行)
- test: `app/openclaw-runtime/src/diagnostics/__tests__/memory-leak-detector-v2.test.ts` (6 case)

---

## §0 サマリ (200 字以内)

R32 v1 (83 行 frozen) を不変保持しつつ、heap snapshot diff (objectsByKind 単位 retention) + GC pressure 推定 + 線形回帰 slope + EMA growth + 4 段 severity 判定 (none/suspect/likely/confirmed) を物理化。Dev-NNN v1 file 無改変保持厳守。6 case unit test all pass 想定。

---

## §1 v1 → v2 拡張差分

| 観点 | v1 (R32 Dev-NNN) | v2 (R33 Dev-QQQ) |
|---|---|---|
| heap snapshot | heapUsedMB のみ | + objectsByKind / GC counts / reclaimedMB |
| 判定 | binary (leakDetected: bool) | 4 段 severity (none/suspect/likely/confirmed) |
| retention | なし | top-K (5) kind 単位 growthRatio sort |
| GC pressure | なし | minorPerDay / majorPerDay / avgReclaimed / pressureScore |
| trend math | avg + max | avg + max + slope (linear regression) + EMA (α=0.3) |
| 行数 | 83 | 214 (+131) |

---

## §2 severity 判定アルゴリズム

4 flags の AND/カウントによる多段判定:
- overAvg = avgGrowth > thresholdMB
- overEma = emaGrowth > thresholdMB
- overSlope = slope > thresholdMB
- highPressure = pressureScore > 2

| flags | severity |
|---|---|
| 4 | confirmed |
| 3 | likely |
| 2 | suspect |
| 1 (avg or slope のみ) | suspect |
| その他 | none |

`isLeakActionable(report)` = severity ∈ {likely, confirmed} で actionable と判定。

---

## §3 公開 API

```ts
runMemoryLeakDetectorV2(days, inj, thresholdMB=5): LeakReportV2
analyzeSnapshotsV2(snapshots, thresholdMB=5): LeakReportV2
takeSnapshotsV2(days, inj): readonly HeapSnapshotV2[]
isLeakActionable(report): boolean
```

LeakReportV2:
- snapshotCount / daysCovered / thresholdMB
- avgGrowthPerDayMB / maxGrowthPerDayMB / slopeMBPerDay / emaGrowthMB
- severity (LeakSeverity)
- topKindRetention (top-5)
- gcPressure (minor/major/reclaim/score)

---

## §4 6 case unit test 構成

| # | 観点 | assertion |
|---|---|---|
| 1 | flat heap + low GC | severity=none / !actionable |
| 2 | strong monotonic growth | severity ∈ {likely, confirmed} / actionable / slope > 5 |
| 3 | kind retention | Buffer top / growthRatio > 50 |
| 4 | high GC pressure | pressureScore > 2 / majorPerDay > 10 |
| 5 | single snapshot | severity=none / slope=0 / topKind=[] |
| 6 | EMA acceleration | emaGrowth > avgGrowth × 0.5 (recent surge) |

---

## §5 制約遵守

| 項目 | status |
|---|---|
| 副作用 | 0 (pure function / mock injection) |
| API call | $0 |
| TS6059 | 0 件継承 |
| R32 既存 v1 file 無改変 | memory-leak-detector.ts unchanged (verified) |
| 絵文字 | 0 |
| 物理化方式 | 新規 file 作成のみ |
| harness +6 想定 | memory-leak-detector-v2 6 case |

---

## §6 後続接続点

- Diagnostics dashboard 接続: severity ∈ {likely, confirmed} 検出時、dashboard `RollingKpiCard` (R33 拡張) へ `severity='warn'/'critical'` propagation 経路を確保。
- W7-D auto-routing: severity=confirmed 時 P1 escalation (`routeMotion` → `ceo_ack_flow`) を発行する hook 想定 (R34 wire).
- 60day longrun との連携: post-launch-60day.ts 完遂期間中の heap profile を 24h ごとに `takeSnapshotsV2` で 60 件採取する想定 (R34+ scheduler).
