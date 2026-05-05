# Dev-NNN R32 / Task 2: memory leak detector

- Round: PRJ-019 Round 32 / 9 並列 5 軸目
- Owner 拘束: 0 分 / 副作用: 0 / 実 API call $0

## 1. 目的
30 日連続 run 中に 24 時間ごとに heap snapshot を採取し、1 日あたり 5MB を超える単調増加を leak と判定する。

## 2. 仕様
- 入力: `days`, `LeakInjection { takeSnapshot(dayIndex) }`, optional thresholdMB（既定 5）
- 出力: `LeakReport { snapshotCount, daysCovered, avgGrowthPerDayMB, maxGrowthPerDayMB, leakDetected, thresholdMB }`

## 3. アルゴリズム
- 連続する snapshot 間の delta を計算
- 平均 delta が threshold を超えたら leak 判定
- snapshot が 1 件以下なら leakDetected=false（判断保留）

## 4. test 設計（+5 case）
1. flat 系列 → leakDetected=false
2. +6MB/day 系列 → true
3. +4MB/day 系列 → false（境界下）
4. snapshot 1 件 → false
5. threshold=1MB override → 検出

## 5. mock injection 厳守
heap snapshot 採取は本番では Node `process.memoryUsage()` だが、本 spec は `takeSnapshot(dayIndex)` を経由し純粋関数を保つ。実 API call 0。

## 6. 出力 file
- 実装: `projects/PRJ-019/app/openclaw-runtime/src/diagnostics/memory-leak-detector.ts`
- test: `.../diagnostics/__tests__/memory-leak-detector.test.ts`

## 7. fix forward-only / harness 影響
+5 case 加算（R32 合計 +39 case の一部）。
