# Dev-NNN R32 / Task 1: post-launch 30day longrun e2e spec

- Round: PRJ-019 Round 32 / 9 並列 5 軸目
- Owner 拘束: 0 分 / 副作用: 0 / 物理 deploy: 0 / 実 API call $0

## 1. 目的
mode='live' 切替後の post-launch 30 日間連続運用を simulation し、13 KPI x 4 経路（snapshot / threshold / breach / recovery）の安定性を保証する。

## 2. 入出力
- 入力: startIso (ISO8601), `LongrunInjection { now, fetchSamples(dayIso), breachThreshold }`
- 出力: `LongrunReport { mode, daysCovered, totalSamples, daily[30], weekly[<=5], monthly, pathCoverage, fitForRelease }`

## 3. 13 KPI integration / 4 経路
- 13 KPI: k01..k13 を毎日サンプリング（mock 注入）
- snapshot: 安定値の点検 / threshold: 閾値近傍 / breach: 違反値 / recovery: 回復値
- 4 経路の到達数を `pathCoverage` に集計し、`isFourPathCovered` でゲート

## 4. aggregation 仕様
- daily: 30 件 / weekly: 7 日刻みで 4〜5 件 / monthly: 単一
- 各 bucket に対し `count / mean / p95 / breachCount` を算出
- p95 は `Math.ceil(count * 0.95) - 1` の index を採用（境界条件は count=0 で 0）

## 5. fit-for-release 判定
- mode='live' 必須
- 4 経路すべて > 0 件
- 月次 breachCount <= ceil(count*0.05) （5% SLA）

## 6. test 設計（+20 case）
- buckets / report / mode / daily / weekly / monthly / totalSamples / 4path coverage 各経路 / empty / breach excessive / fit / mean / p95 / breach<=count / empty aggregate

## 7. 出力 file
- 実装: `projects/PRJ-019/app/openclaw-runtime/src/longrun/post-launch-30day.ts` (≤200 行)
- test: `projects/PRJ-019/app/openclaw-runtime/src/longrun/__tests__/post-launch-30day.test.ts` (20 case)

## 8. 既存 wire 6 file + canary-vercel-wire / alert-router-real-wire mtime 不変厳守
触れない。新規 module は longrun/ 配下に独立配置。

## 9. harness 影響
- R31 累計 1017 → +20 = 1037（部分加算 / R32 全体で 1056）

## 10. fix forward-only
回帰時は新 patch を追加投入し、本 spec は historical reference として固定する。
