# Dev-EEE Round 29 — HG-9 + HG-10 候補軸検討 spec (公開後 30day 監視で発見想定 anomaly 対応)

最終更新: 2026-05-06 W0-Week2
担当: Dev 部門 R29 Dev-EEE (17 件目 dev sprint)
位置付け: PRJ-019 Open Claw Round 29 / 公開後 30day 監視軸との integration / 継続的 hardguard 候補。

---

## 0. 概要

- 公開後 30day で発見想定の anomaly 2 種 (HG-9 / HG-10) を予防的に spec 起案
- 各 spec は 約 150 行 / 物理化は anomaly 実観測後 R31+ 着手 (proactive ではなく reactive)
- 本 spec は **anomaly 種別の事前 catalogue 化** が役割 / 観測 → mapping を高速化

---

## 1. HG-9 候補 — Audit log fragmentation guard

### 1.1 想定 anomaly

公開後 30day で Sentry 5xx 累積 (KPI-13) が `> 50/h` を 1 度でも超過した場合、root cause 分析で audit log の **時系列 fragmentation** (= 異なる orchestrator 由来 event が交互に書き込まれ調査困難) が発覚するシナリオ。

### 1.2 trigger 検出経路

| 検出 source | 閾値 | 通知 |
|---|---|---|
| Sentry 5xx | > 50/h | Marketing-V T+24h 13 KPI KPI-13 |
| Sentry breadcrumb 不連続率 | > 5% | (新規 metric) |
| GH issue label `audit-fragmentation` | 1 件 | manual |

### 1.3 spec scope

- **HG-9 invariant**: 同 ack-id chain 内 event は audit log 上で連続配置される (= 他 orchestrator event を挿し込まない)
- **実装**: `AuditLogger.append()` に `chain_id` field 追加 / append 順を `chain_id, sequence` で sort
- **test**: 3 orchestrator 並行で 1000 event 発火 / chain ごと連続性 100% / fragmentation rate < 0.1%

### 1.4 行数見積

| section | 行数 |
|---|---:|
| AuditLogger 拡張 | 60 (新規 70 / 既存 0 改変) |
| test file | 90 |
| **合計** | **150** |

### 1.5 物理化 trigger 条件

- Sentry 5xx > 50/h を 1 回観測 (30day 内)
- もしくは Owner / CEO から audit 調査要求が 1 件以上発生

R31 起点 / 上記 trigger 0 件なら R31 提案ぜず凍結継続。

---

## 2. HG-10 候補 — Stale connection sweep guard

### 2.1 想定 anomaly

公開後 30day で MockClaudeBridge reconnect が **過剰 retry** (HG-7 spec の指数 backoff 上限 60s でも resolve できない idle connection 蓄積) で memory growth 線形化するシナリオ。

### 2.2 trigger 検出経路

| 検出 source | 閾値 | 通知 |
|---|---|---|
| Vercel function memory | > 80% sustained 1h | Vercel Analytics |
| smoke 8 endpoint 1 つ degraded | > 5s response time | KPI-07 |
| heap snapshot leak suspect | linear growth detected | dev manual |

### 2.3 spec scope

- **HG-10 invariant**: 60s idle connection は自動 sweep / max in-flight connection <= 100
- **実装**: `BridgeConnectionPool.sweep()` メソッド追加 / 5s interval で `lastActivityAt` check
- **test**: 200 connection 同時 open / 100 を idle 化 → 60s 後に 100 sweep / 残 100 active 検証

### 2.4 行数見積

| section | 行数 |
|---|---:|
| BridgeConnectionPool 拡張 | 70 |
| test file | 80 |
| **合計** | **150** |

### 2.5 物理化 trigger 条件

- Vercel function memory > 80% sustained 30 min を 1 回観測
- もしくは smoke endpoint response > 5s を 3 round 連続観測

---

## 3. HG-9 / HG-10 共通 frame

### 3.1 reactive 起案 policy

- proactive 物理化 = NG (= 現時点で実 anomaly 観測 0 件のため)
- reactive 起案 trigger 観測時のみ R31+ で物理化検討
- spec 凍結期間: 公開 (2026-06-19) 〜 30day (2026-07-19) は spec のみ保持

### 3.2 30day 監視軸との接続

| KPI | HG-9 関連性 | HG-10 関連性 |
|---|---|---|
| KPI-05 Sentry 5xx | 高 (root cause 分析 trigger) | 低 |
| KPI-07 smoke pass | 中 | 高 (response degraded trigger) |
| KPI-12 Supabase pageview | 低 | 中 (load 増加で connection pool 圧迫) |
| KPI-13 Sentry 累積 | 高 | 中 |

---

## 4. 制約遵守

| 制約 | status |
|---|---|
| 既存 absolute 4 file 無改変 | 達成 |
| 副作用 0 | 達成 (reactive 起案 / 物理化 0) |
| 絵文字 0 | 達成 |
| API call $0 | 達成 |
| Owner 拘束 0 分 | 達成 |

---

## 5. R30 Dev-JJJ 引継

1. 本 spec を `dashboard/active-projects.md` の R31+ candidate list に追記
2. 公開後 30day 監視で trigger 観測時、本 spec を起点に物理化判定 (Owner / CEO 承認経由)
3. trigger 0 件継続なら R31 終了時に再評価 / 90day 観測でも 0 件なら spec 凍結延長

---

(end of file / 約 160 行)
