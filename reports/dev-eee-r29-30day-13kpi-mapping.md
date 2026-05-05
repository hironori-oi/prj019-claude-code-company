# Dev-EEE Round 29 — 公開後 30day 監視軸 13 KPI mapping (Marketing-V T+24h × Dev hardguard integration 経路設計)

最終更新: 2026-05-06 W0-Week2
担当: Dev 部門 R29 Dev-EEE (17 件目 dev sprint)
位置付け: PRJ-019 Open Claw Round 29 / Marketing-V T+24h 13 KPI と Dev 部門 hardguard (HG-1〜HG-10) の integration 経路設計。

---

## 0. 概要

- Marketing-V R28 task ② T+24h 13 KPI を Dev hardguard (既存 HG-6 / HG-7 + R29 起案 HG-8 / HG-9 / HG-10) と紐付け
- 異常検知 → hardguard 発火 → Owner 拘束 0-1 min 自動応答までの整合性検証
- integration 経路は 4 種 (snapshot / threshold / breach / recovery)

---

## 1. 13 KPI 一覧 (Marketing-V 由来)

| KPI | 名称 | source | 警告閾値 | 危険閾値 |
|---|---|---|---|---|
| KPI-01 | Impression | GA realtime API | < 100 (T+1h) | < 10 |
| KPI-02 | Click | GA event API | < 5 | - |
| KPI-03 | Signup | Supabase readonly | 0 (T+24h) | - |
| KPI-04 | Bounce rate | GA Bounce API | > 80% | > 95% |
| KPI-05 | Sentry 5xx | Sentry stats API | > 5/h | > 50/h |
| KPI-06 | Sentry 4xx | Sentry stats API | > 100/h | - |
| KPI-07 | smoke 8 endpoint pass | curl HEAD | 7/8 | < 6/8 |
| KPI-08 | Slack reaction | Slack API | < 2/post | - |
| KPI-09 | X impressions | X analytics | < 200 | - |
| KPI-10 | LinkedIn impressions | LinkedIn analytics | < 100 | - |
| KPI-11 | Lighthouse 4 score | Lighthouse CLI | 1 score < 90 | - |
| KPI-12 | Supabase pageview 24h | Supabase readonly | < 100 | - |
| KPI-13 | Sentry 5xx 累積 (24h) | Sentry stats API | > 5 | > 50 |

---

## 2. KPI × hardguard mapping

### 2.1 4 種 integration 経路定義

| 経路 | 説明 | 発火 trigger | Dev hardguard 動作 |
|---|---|---|---|
| **snapshot** | KPI 数値を Dev guard が参照のみ | 5min interval | guard log 記録のみ (no action) |
| **threshold** | KPI 閾値超過で guard 警告 | 警告閾値 hit | Slack alert post (rate limit 60s) |
| **breach** | KPI 危険閾値超過で guard 強制 fail-closed | 危険閾値 hit | `pass_through` → `fail_closed` 切替 |
| **recovery** | breach 後の自動回復経路 | 30 min 連続正常 | `fail_closed` → `pass_through` 戻し |

### 2.2 13 KPI mapping table

| KPI | snapshot | threshold | breach | recovery | 主担当 hardguard |
|---|:---:|:---:|:---:|:---:|---|
| KPI-01 Impression | ✓ | - | - | - | (Marketing 専管) |
| KPI-02 Click | ✓ | - | - | - | (Marketing 専管) |
| KPI-03 Signup | ✓ | ✓ | - | - | (Marketing × Dev) |
| KPI-04 Bounce | ✓ | ✓ | - | - | (Marketing 専管) |
| **KPI-05 Sentry 5xx** | ✓ | ✓ | ✓ | ✓ | **HG-6 SLA recovery** |
| KPI-06 Sentry 4xx | ✓ | ✓ | - | - | HG-6 (warn only) |
| **KPI-07 smoke pass** | ✓ | ✓ | ✓ | ✓ | **HG-12 fail_closed (既存) + HG-7 reconnect** |
| KPI-08 Slack reaction | ✓ | - | - | - | (Marketing 専管) |
| KPI-09 X impressions | ✓ | - | - | - | (Marketing 専管) |
| KPI-10 LinkedIn impressions | ✓ | - | - | - | (Marketing 専管) |
| KPI-11 Lighthouse | ✓ | ✓ | - | - | (Web-Ops 専管) |
| KPI-12 Supabase pageview | ✓ | ✓ | - | ✓ | **HG-10 candidate (connection sweep)** |
| **KPI-13 Sentry 累積** | ✓ | ✓ | ✓ | ✓ | **HG-6 + HG-9 candidate (audit fragmentation)** |

### 2.3 主要 mapping 詳細

#### 2.3.1 KPI-05 → HG-6 SLA recovery (snapshot + threshold + breach + recovery)

- snapshot: 5min interval で `Sentry.fetchStats()` 経由 KPI-05 取得 → guard 内 ringbuffer 保持
- threshold: > 5/h で Slack `[WARN] Sentry 5xx > 5/h` post (60s dedup)
- breach: > 50/h で `pass_through` → `fail_closed` 即時切替 (HG-6 既存実装 invoke)
- recovery: 30 min 連続 < 1/h で `fail_closed` → `pass_through` 自動戻し (HG-6 既存)

#### 2.3.2 KPI-07 → HG-12 + HG-7 (連動)

- snapshot: 5 min interval smoke 8 endpoint pass count
- threshold: 7/8 で Slack `[WARN] smoke degraded` post
- breach: < 6/8 が 3 round 連続で HG-12 `fail_closed` 強制 + HG-7 bridge reconnect 起動
- recovery: 8/8 が 12 round 連続で `pass_through` 戻し

#### 2.3.3 KPI-13 → HG-6 + HG-9 candidate

- snapshot: 1h interval 累積 Sentry 5xx
- threshold: > 5 で Marketing-V T+24h judgment Path D 候補入り
- breach: > 50 で HG-6 fail_closed + HG-9 candidate 物理化 trigger 発火 (R31 起点)
- recovery: 24h 連続 0 件で 平常復帰

---

## 3. integration 経路実装方針

### 3.1 KPI poller 共通 interface

```ts
interface KpiPoller {
  pollSnapshot(kpiId: string): Promise<KpiSnapshot>;
  evaluateThreshold(snapshot: KpiSnapshot): 'normal' | 'warn' | 'breach';
  triggerHardGuard(level: 'warn' | 'breach', guardName: string): Promise<void>;
}
```

### 3.2 poller 実装場所

- `app/harness/src/kpi-poller/` (新規 / R30+ 物理化)
- 13 KPI ごと poller 実装 (各 50-80 行)
- 合計 約 800 行 / 13 file / R30 着手

### 3.3 poller × hardguard wire 図

```
[GA / Sentry / Supabase / Slack / X / LinkedIn / Lighthouse]
       ↓ pollSnapshot (5min interval)
[KPI Poller × 13]
       ↓ evaluateThreshold
[snapshot / warn / breach 判定]
       ↓ triggerHardGuard
[HG-6 / HG-7 / HG-9 / HG-10 / HG-12]
       ↓ action
[Slack alert / fail_closed / reconnect / sweep]
       ↓ recovery 監視
[KPI Poller 再測定 → 自動 recovery 判定]
```

---

## 4. Owner 拘束 0-1 min 整合性検証

| 経路 | Owner 拘束 | 整合性 |
|---|---|---|
| snapshot | 0 min | OK (log only) |
| threshold | 0 min | OK (Slack auto post / Owner DM mention 0) |
| breach | 0-1 min | OK (Slack DM mention は CEO 経由のみ / Owner final reply 1 min) |
| recovery | 0 min | OK (auto) |

Marketing-V T+24h spec の Owner 拘束 0-1 min 設計と完全整合。

---

## 5. 制約遵守

| 制約 | status |
|---|---|
| 既存 absolute 4 file 無改変 | 達成 |
| 副作用 0 | 達成 |
| 絵文字 0 | 達成 |
| API call $0 | 達成 |
| Owner 拘束 0 分 | 達成 |

---

## 6. R30 Dev-JJJ 引継

1. KPI poller 13 file 物理化 (約 800 行 / R30 着手 / 6/19 公開前完遂目標は無し / 公開後 reactive 物理化可)
2. KPI × hardguard wire は HG-6 / HG-7 / HG-12 既存と integration test 1 件起案 (R31)
3. Marketing-V との週次 sync で 13 KPI mapping 表 maintenance

---

(end of file / 約 195 行)
