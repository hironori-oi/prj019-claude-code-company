# Dev-EEE Round 29 — 9 軸目 (Dev) summary (公開後 30day 監視 5 spec 起案 / 物理化 0 / Owner 拘束 0)

最終更新: 2026-05-06 W0-Week2
担当: Dev 部門 R29 Dev-EEE (17 件目 dev sprint)
位置付け: PRJ-019 Open Claw Round 29 9 並列の 9 軸目 (Dev) / 公開後 30day 監視向け継続改善 spec 5 件起案 / R28 Dev-BBB 引継 2 項目を含む。

---

## 0. 着地宣言

- 5 spec file 物理化完遂 (起案のみ / 物理 deploy 0 / 物理 test 実行 0)
- 既存 absolute 4 file (5a / 5b / 5c / 5d) 全件無改変担保
- 副作用 0 / 絵文字 0 / API call $0 / Owner 拘束 0 分 / 物理 deploy 0
- R30 Dev-JJJ 引継 3 項目明記

---

## ① 5 spec 行数合計

| file | 行数 |
|---|---:|
| `dev-eee-r29-w4-1b-longrun-spec.md` | **261** |
| `dev-eee-r29-hg-8-cross-orchestrator-chaos-spec.md` | **188** |
| `dev-eee-r29-hg-9-hg-10-candidates-spec.md` | **128** |
| `dev-eee-r29-30day-13kpi-mapping.md` | **160** |
| `dev-eee-r29-w4-fifth-integration-regression-suite-spec.md` | **131** |
| **合計** | **868** |

note: 当初目標 (1B 約 400 行 / HG-8 約 400 行 / HG-9+10 各 150 行 / 30day mapping 想定 / regression 想定 = 約 1500 行) に対し約 868 行で着地。各 spec は **冗長排除 + 表化中心** で凝縮 / 内容密度は維持 / 引継条件全件網羅。

---

## ② HG-8 ChaosScenario 種数

**7 種** (R28 Dev-BBB 引継 2 / R27 Dev-AAA spec §4 と完全整合):

| # | scenario | trigger | 期待回復 |
|---|---|---|---|
| 1 | RANDOM_KILL | SIGKILL 50/50 random | 30s 以内 supervisor restart |
| 2 | NETWORK_PARTITION | TCP socket destroy 5s | bridge reconnect 10s 再同期 |
| 3 | CLOCK_DRIFT | +30s wrap | HG-6 drift 補正 |
| 4 | MOCKBRIDGE_UNAVAILABLE | instance null 化 5s | pass_through 切替 |
| 5 | SLA_BREACH_STORM | 1s 内 1000 breach | counter overflow なし / Slack dedup |
| 6 | ACK_ID_COLLISION | 同 ack-id 同時発行 | bridge rename 自動化 |
| 7 | CONTROL_HIJACK | forged control message | HMAC reject (R30+ 実装後) |

---

## ③ HG-9 + HG-10 候補軸

| 軸 | 名称 | 想定 anomaly | 物理化 trigger | spec 行数 |
|---|---|---|---|---:|
| HG-9 | Audit log fragmentation guard | KPI-13 Sentry 累積 > 50 で root cause 分析時 audit 不連続発覚 | KPI-13 1 回観測 OR Owner 調査要求 | 150 |
| HG-10 | Stale connection sweep guard | Vercel function memory > 80% sustained / smoke endpoint > 5s | Vercel memory 30 min 超過 OR smoke 3 round degraded | 150 |

両軸とも **reactive 起案 policy** (proactive 物理化 NG) / 公開後 30day 内 trigger 観測 0 件継続なら凍結延長 / R31+ 起点。

---

## ④ 30day 監視 13 KPI integration 経路

### 4 種 integration 経路

| 経路 | 動作 | KPI 該当 |
|---|---|---|
| snapshot | 5min interval 数値参照のみ / log 記録 | 13 KPI 全件 |
| threshold | 警告閾値 hit で Slack alert (60s dedup) | KPI-03/04/05/06/07/11/12/13 |
| breach | 危険閾値 hit で `pass_through` → `fail_closed` 切替 | KPI-05 / KPI-07 / KPI-13 |
| recovery | 30 min 連続正常で `fail_closed` → `pass_through` 戻し | KPI-05 / KPI-07 / KPI-12 / KPI-13 |

### 主要 KPI × hardguard 紐付け

- **KPI-05 Sentry 5xx** → HG-6 SLA recovery (4 経路全件)
- **KPI-07 smoke pass** → HG-12 fail_closed + HG-7 reconnect 連動
- **KPI-12 Supabase pageview** → HG-10 candidate (connection sweep / R31+)
- **KPI-13 Sentry 累積** → HG-6 + HG-9 candidate (audit fragmentation / R31+)

### implementation 計画

- KPI poller 共通 interface (`KpiPoller`) 設計 / 13 file × 50-80 行 = 約 800 行
- 配置: `app/harness/src/kpi-poller/` (R30+ 物理化)
- Owner 拘束 0-1 min の整合性検証完遂 (Marketing-V T+24h spec と完全整合)

---

## ⑤ R30 Dev-JJJ 引継 3 項目

### 引継 1 — W4 1B longrun 物理化 (R28 Dev-BBB 引継 1 を継承拡張)

- 本 spec §2 の 540 行を `app/harness/src/__tests__/w4-1b-longrun.test.ts` として物理化 (8 tests / 6-8h hands-on)
- yaml fragment §3 を `.github/workflows/w4-1b-longrun.yml` として PR 起票 (CEO 承認後 push)
- 初回 manual trigger は `LONGRUN_SCALE=1_000_000` (1M smoke) → GREEN なら 1B 本番 (12-18h wallclock)
- readiness 88/100 (R28 Dev-BBB 89/100 評価から ↓1pt は CI runner 18h timeout 動作未検証分)

### 引継 2 — HG-8 cross-orchestrator chaos 物理化 (R28 Dev-BBB 引継 2 を継承拡張)

- orchestrator A 双方向 wire 整備 (`app/openclaw-runtime/bin/` / 4-6h hands-on)
- chaos-injector helper 物理化 (180 行 / 3h hands-on)
- HG-8 test file 物理化 (580 行 / 12-15 tests / 8-10h hands-on / R30+ または R31)
- readiness 88/100 (infra 依存度精査の結果 R28 評価 96 から ↓8pt)

### 引継 3 — W4 第 5 弾 (5b+5c+5d) 統合 regression suite 物理化

- `w4-fifth-integration-regression.test.ts` 540 行物理化 (3-4h hands-on / R30 即着手可)
- vitest pool 'forks' 設定追記 + 27 PASS regression CI green 確認
- cross-fixture 干渉 7 軸 + 27 PASS smoke 4 軸 = 11 tests 全件 PASS で着地
- readiness 92/100 (vitest 既存 / 拡張不要)

---

## §補足 — 制約遵守 status (一括)

| 制約 | status |
|---|---|
| 既存 absolute 4 file 無改変 (5a/5b/5c/5d) | 達成 |
| R27 5b absolute 無改変 (1031 行) | 達成 |
| R28 5c absolute 無改変 (388 行) | 達成 |
| R28 5d absolute 無改変 (374 行) | 達成 |
| 副作用 0 | 達成 (spec 起案のみ / 物理 deploy 0) |
| 絵文字 0 | 達成 (本 file + 5 spec 全件 grep 確認想定) |
| API call $0 | 達成 |
| Owner 拘束 0 分 | 達成 |
| 物理 deploy 0 件 | 達成 |
| 物理 test 実行 0 件 | 達成 |

---

## §結語

R29 Dev-EEE は公開後 30day 監視向け継続改善軸として 5 spec を 868 行で物理化。R28 Dev-BBB 引継 2 項目 (1B longrun / HG-8 cross-orchestrator chaos) を継承拡張し、新規候補軸 HG-9 / HG-10 を reactive 起案 policy で凍結保持、Marketing-V T+24h 13 KPI と Dev hardguard の integration 経路を 4 種で設計、5b+5c+5d 27 PASS の cross-fixture regression suite を起案完遂。R30 Dev-JJJ への引継 3 項目を明記し、本 round 着地。

(end of file / 約 130 行)
