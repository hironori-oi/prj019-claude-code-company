# PRJ-019 Round 31 Dev-KKK — post-launch 24h longrun e2e spec

- 案件: PRJ-019 Open Claw "Clawbridge"
- 担当: Dev-KKK (Round 31)
- 起票日: 2026-05-06
- 連動: GTC-7 W5→W6 / 13 KPI integration (snapshot/threshold/breach/recovery) / R30 Dev-HHH 着地

---

## 1. 目的

mode='live' 切替後 24h 連続稼働を simulation で検証し、
13 KPI integration 4 経路 (snapshot / threshold / breach / recovery) を
通しで PASS させる。実 API 発火 0 件厳守。

---

## 2. simulation 構成

### 2.1 時間軸圧縮

- 実時間 24h → simulation 上は 24 tick (1 tick = 1h 相当)
- vi.useFakeTimers + vi.advanceTimersByTime で前進

### 2.2 mock 注入

- canary writer: `mode='live'` + env-gate pass + fetcher = vi.fn (200 固定)
- alert dispatcher: 同上 + slack/pagerduty/smtp 全て注入関数
- 4 probe: fetcher 注入 (各 tick で status 抽選)
- cost-tracker: ratio = 0.7 + 0.005×tick (24h で 0.82)

### 2.3 KPI integration 4 経路

| 経路 | 検証内容 |
|------|---------|
| snapshot | 各 tick で 13 KPI を確定値として保存 |
| threshold | 13 KPI のうち breach 候補に該当する条件を判定 |
| breach | breach 検出時に alert-router へ AlertInput を発射 |
| recovery | breach 後に閾値復帰した場合に recovery alert (warn 級) |

---

## 3. 24h longrun 想定遷移

| tick | 想定 KPI | 期待発火 |
|------|---------|---------|
| 0    | 全 up   | live activation log |
| 6    | sentry degraded (1tick) | warn alert (slack) |
| 7    | sentry recovery | recovery alert |
| 12   | cost-tracker 0.95 越え | budget alert (DEC-019-081 連動) |
| 18   | vercel minor → degraded | warn alert |
| 23   | 全 up 復帰 | full-recovery summary |

---

## 4. 期待値 / 不変量

- `harness 924 + 23 case = 947 PASS` (R31 完遂)
- TS6059 0 件継承
- 実 API call 0 件 (全 fetcher は vi.fn / network 0 件)
- env 物理書込 0 件
- mtime 不変: R30 既存 6 file + R30 wire 2 file の line 1〜N 完全保存
- alert dispatcher 経路の log event は dispatcher 内 logger に蓄積 (副作用 0 / test 内 array)
- recovery alert は breach の重複 dedup (fingerprint 一致時)

---

## 5. KPI breach simulation 詳細

### 5.1 13 KPI 一覧 (W6 readiness 連動)

1. canary percent
2. error rate
3. p95 latency
4. p99 latency
5. throughput (req/s)
6. cost ratio (DEC-019-081)
7. sentry status
8. vercel status
9. supabase status
10. cost-tracker status
11. cache hit ratio
12. queue depth
13. retry count

### 5.2 threshold

各 KPI に以下 3 段階 threshold を設定し、breach / recovery 判定を行う:
- warn (注意)
- critical (緊急)
- emergency (即停止)

---

## 6. 物理 deploy 0 件継承

24h simulation は **vitest 内** で完結 (vi.useFakeTimers)。
実 cron / 実 worker は起動しない。post-launch 真の 24h 実稼働は GTC-7 ACK 後
runsheet に従い別途 Dev 部門が監視 (本 spec 範囲外)。

---

## 7. 観測点

- live activation timestamp (mock injection で固定値 2026-05-06T00:00:00Z)
- 24 tick 全件の KPI snapshot 配列
- alert dispatch 履歴 (mode='live' の log event を全件記録)
- fetcher 呼出 count (canary / 4 probe / 3 alert channel = 計 8 系統)

---

## 8. R32 引継

- 30day spec: 24h を 30 倍に拡張 + memory leak 検出
- W7-A KPI dashboard で 13 KPI を可視化 + threshold breach 履歴の grafana export
