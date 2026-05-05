# Dev-JJJ R30 — W7 spec brief pre-fab (Phase 3 公開後 30day-90day 拡張 / 3 波構造)

最終更新: 2026-05-06 W0-Week2
担当: Dev 部門 R30 Dev-JJJ (19 件目 dev sprint / 9 並列 9 軸目)
位置付け: W6 完遂宣言 (DEC-087 候補) を起点として、Phase 3 (公開後 30day 〜 90day 拡張) の **W7 spec brief**。3 波構造で第 1 波 (30day 13 KPI 監視運用) + 第 2 波 (HG-8 scheduled CI 実装) + 第 3 波 (W6-D automatic rollback wire) を pre-fab 化、R31+ Dev-LLL 引継基準書として起票。

---

## §0 W7 軸概要

- **W7 軸 mission**: Phase 3 (公開後 30day-90day) において W6 軸完遂後の運用監視・回復・自動 rollback を確立
- **3 波構造**:
  - 第 1 波: **30day 13 KPI 監視運用** (R31-R33 想定 / 公開後 1week 〜 30day)
  - 第 2 波: **HG-8 scheduled CI 実装** (R32-R34 想定 / 公開後 30day 〜 60day)
  - 第 3 波: **W6-D automatic rollback wire** (R34-R36 想定 / 公開後 60day 〜 90day)
- **担当 round**: R31 Dev-LLL → R32 Dev-MMM → R33 Dev-NNN → R34+ continued
- **Owner 拘束想定**: 全 W7 軸通算 0-3 min (T+30day 立会 1 min × 1 件 / T+60day pulse 1 min × 1 件 / T+90day completion 1 min × 1 件)

---

## §1 第 1 波: 30day 13 KPI 監視運用 spec brief

### §1.1 mission

Marketing-V T+24h 13 KPI 設計 (R28 完遂) + Dev-EEE R29 30day 13 KPI mapping (R29 完遂 / 4 種 integration 経路) を **physical 実装** へ移行する。`app/harness/src/kpi-poller/` 配下に 13 file × 50-80 行 = 約 800 行を物理化、KpiPoller 共通 interface + threshold/breach/recovery automation を確立。

### §1.2 担当 + 工数 + 着地時期

| 項目 | 詳細 |
|------|------|
| 担当 round | R31 Dev-LLL (起点) → R32 Dev-MMM (拡張) → R33 Dev-NNN (完遂) |
| hands-on 工数 | 16-22h (poller 13 file 物理化 12h + integration test 4h + threshold tuning 2-4h + Owner 0-1 min ack 整合性検証 2h) |
| 公開後 timing | T+1week 〜 T+30day (30day window) |
| Owner 拘束 | 0-1 min (T+30day completion ack のみ / 1 件 push) |

### §1.3 物理化対象 (13 file × 50-80 行)

| KPI# | file | LOC | source 系統 |
|------|------|----:|-------------|
| KPI-01 | `kpi-poller/impression.ts` | 60 | GA realtime API |
| KPI-02 | `kpi-poller/click.ts` | 55 | GA event API |
| KPI-03 | `kpi-poller/signup.ts` | 70 | Supabase readonly |
| KPI-04 | `kpi-poller/bounce.ts` | 65 | GA Bounce API |
| KPI-05 | `kpi-poller/sentry-5xx.ts` | 80 | Sentry stats API + HG-6 trigger |
| KPI-06 | `kpi-poller/sentry-4xx.ts` | 65 | Sentry stats API |
| KPI-07 | `kpi-poller/smoke-pass.ts` | 75 | curl HEAD + HG-12/HG-7 連動 |
| KPI-08 | `kpi-poller/slack-reaction.ts` | 50 | Slack API |
| KPI-09 | `kpi-poller/x-impressions.ts` | 55 | X analytics API |
| KPI-10 | `kpi-poller/linkedin-impressions.ts` | 55 | LinkedIn analytics |
| KPI-11 | `kpi-poller/lighthouse.ts` | 70 | Lighthouse CLI |
| KPI-12 | `kpi-poller/supabase-pageview.ts` | 75 | Supabase + HG-10 candidate |
| KPI-13 | `kpi-poller/sentry-cumulative.ts` | 80 | Sentry cumulative + HG-9 candidate |
| **計** | - | **855** | - |

### §1.4 共通 interface

```ts
// app/harness/src/kpi-poller/types.ts
export interface KpiPoller {
  pollSnapshot(kpiId: string): Promise<KpiSnapshot>;
  evaluateThreshold(snapshot: KpiSnapshot): 'normal' | 'warn' | 'breach';
  triggerHardGuard(level: 'warn' | 'breach', guardName: string): Promise<void>;
}

export interface KpiSnapshot {
  kpiId: string;
  timestamp: number;
  value: number;
  source: 'GA' | 'Sentry' | 'Supabase' | 'Slack' | 'X' | 'LinkedIn' | 'Lighthouse';
  metadata?: Record<string, unknown>;
}
```

### §1.5 第 1 波 完遂判定

| 軸 | 判定 |
|----|------|
| 13 file 物理化完遂 | LOC 800-870 行 |
| integration test PASS | 1 件 smoke + 13 file unit test ALL PASS |
| Marketing-V T+24h spec 整合 | Owner 拘束 0-1 min 維持 |
| HG-6/HG-7/HG-12 連動 wire | Slack/PagerDuty alert 実発火 1 件以上 |

**第 1 波 readiness 目標**: R33 完遂時 95+ pt。

---

## §2 第 2 波: HG-8 scheduled CI 実装 spec brief

### §2.1 mission

R29 Dev-EEE HG-8 cross-orchestrator chaos spec (188 行 / 7 ChaosScenario) を **scheduled CI** で月次自動実行可能に物理化。`.github/workflows/hg-8-monthly-chaos.yml` + `app/harness/src/__tests__/hg-8-cross-orchestrator-chaos.test.ts` を起票、orchestrator A 双方向 wire 整備 (`app/openclaw-runtime/bin/`) + chaos-injector helper 物理化を含む。

### §2.2 担当 + 工数 + 着地時期

| 項目 | 詳細 |
|------|------|
| 担当 round | R32 Dev-MMM (起点 / orchestrator wire) → R33 Dev-NNN (chaos-injector + test) → R34 Dev-OOO (scheduled CI 完遂) |
| hands-on 工数 | 28-35h (orchestrator A 双方向 wire 4-6h + chaos-injector helper 180 行 / 3h + HG-8 test file 580 行 / 12-15 tests / 8-10h + scheduled CI yml 起票 2h + 月次自動実行 verification 4h + integration test 6-8h) |
| 公開後 timing | T+30day 〜 T+60day (30day window) |
| Owner 拘束 | 0-1 min (T+60day pulse ack のみ / 1 件 push) |

### §2.3 物理化対象

| 項目 | path | LOC |
|------|------|----:|
| orchestrator A 双方向 wire | `app/openclaw-runtime/bin/orchestrator-a-bridge.ts` | 220 |
| chaos-injector helper | `app/harness/src/chaos-injector.ts` | 180 |
| HG-8 test file | `app/harness/src/__tests__/hg-8-cross-orchestrator-chaos.test.ts` | 580 |
| scheduled CI yml | `.github/workflows/hg-8-monthly-chaos.yml` | 60 |
| **計** | - | **1,040** |

### §2.4 7 ChaosScenario × scheduled CI 経路

| scenario | trigger | 期待回復 |
|----------|---------|---------|
| RANDOM_KILL | 月次 1st Monday 09:00 UTC + on-demand | 30s 以内 supervisor restart |
| NETWORK_PARTITION | 月次 + chaos toolkit invoke | bridge reconnect 10s 再同期 |
| CLOCK_DRIFT | 月次 + faketime + 30s wrap | HG-6 drift 補正 |
| MOCKBRIDGE_UNAVAILABLE | 月次 + instance null 化 5s | pass_through 切替 |
| SLA_BREACH_STORM | 月次 + 1s 内 1000 breach | counter overflow なし / Slack dedup |
| ACK_ID_COLLISION | 月次 + 同 ack-id 同時発行 | bridge rename 自動化 |
| CONTROL_HIJACK | 月次 + forged control message | HMAC reject (R30+ 実装後) |

### §2.5 第 2 波 完遂判定

| 軸 | 判定 |
|----|------|
| 4 file 物理化完遂 | LOC 1,040 行 |
| 12-15 tests ALL PASS | scheduled CI 月次自動 invoke + GREEN |
| HG-8 readiness | R34 完遂時 88 pt → 95 pt 昇格 |
| chaos-injector reusable | HG-9/HG-10 candidate でも流用可 |

**第 2 波 readiness 目標**: R34 完遂時 95+ pt。

---

## §3 第 3 波: W6-D automatic rollback wire spec brief

### §3.1 mission

W6-A canary helper + W6-B alert-router + 30day 13 KPI poller を統合し、**automatic rollback wire** を実装。breach 危険閾値 hit + 3 round 連続継続で `pass_through` → `fail_closed` 切替後、5 min 内に Vercel deployment rollback (前 GA tag へ revert) を自動実行する経路を物理化。

### §3.2 担当 + 工数 + 着地時期

| 項目 | 詳細 |
|------|------|
| 担当 round | R34 Dev-OOO (起点 / spec 詳細化) → R35 Dev-PPP (impl) → R36 Dev-QQQ (integration test + completion) |
| hands-on 工数 | 20-26h (rollback orchestrator 3h + Vercel deployment API wire 6h + alert-router rollback path 2h + integration test 6h + dry-run 6 件確認 4-6h + post-mortem 整合性検証 3h) |
| 公開後 timing | T+60day 〜 T+90day (30day window) |
| Owner 拘束 | 0-1 min (T+90day completion ack / 1 件 push) |

### §3.3 物理化対象

| 項目 | path | LOC |
|------|------|----:|
| rollback orchestrator | `app/harness/src/rollback-orchestrator.ts` | 180 |
| Vercel deployment API wire | `app/harness/src/vercel-deployment-api.ts` | 120 |
| alert-router rollback path 拡張 | `app/harness/src/alert-router.ts` 既存に +30 行 | +30 |
| integration test | `app/harness/src/__tests__/w6-d-automatic-rollback.test.ts` | 280 |
| **計** | - | **610** |

### §3.4 automatic rollback flow

```
[KPI-05 Sentry 5xx > 50/h hit]
        ↓ HG-6 breach trigger
[alert-router severity=critical]
        ↓ Slack post + PagerDuty trigger
[rollback-orchestrator detect 3 round continued]
        ↓ Vercel deployment API GET /v6/deployments
[前 GA tag (vN-1) revert]
        ↓ Vercel deployment API POST promote
[5 min 内 fail_closed → previous GA active]
        ↓ post-mortem template 自動 issue 作成
[Owner ack 1 min push]
```

### §3.5 第 3 波 完遂判定

| 軸 | 判定 |
|----|------|
| 4 file 物理化完遂 | LOC 610 行 |
| dry-run 6 件 ALL PASS | 6 種 breach scenario × rollback verify |
| 5 min 内自動 rollback 確証 | T+90day 期間内 1 件以上実 rollback OR dry-run |
| post-mortem 自動 issue 作成 | KPT 7 章 template 自動展開 |

**第 3 波 readiness 目標**: R36 完遂時 95+ pt。

---

## §4 W7 軸 通算 工数 / Owner 拘束 / readiness

| 波 | hands-on 工数 | Owner 拘束 | readiness 目標 |
|----|--------------:|-----------:|---------------:|
| 第 1 波 | 16-22h | 0-1 min | 95+ pt |
| 第 2 波 | 28-35h | 0-1 min | 95+ pt |
| 第 3 波 | 20-26h | 0-1 min | 95+ pt |
| **計** | **64-83h** | **0-3 min** | **95+ pt 各波** |

---

## §5 W7 軸 完遂宣言 候補 (DEC-088 候補)

R36 第 3 波完遂後、**DEC-019-088 候補** として W7 軸完遂宣言を起案。3 波 AND 判定式 = (第 1 波 95+ pt AND 第 2 波 95+ pt AND 第 3 波 95+ pt)。R36 末で TRUE 判定見込。

---

## §6 制約遵守

| 制約 | status |
|------|--------|
| DEC-019-001-079 absolute 無改変 | 達成 (本 spec brief は pre-fab のため改変 0) |
| 既存 absolute 4 file 無改変 | 達成 |
| W4 5a-5d test absolute 無改変 | 達成 |
| sec yml 12 file md5 不変 | 達成 |
| 物理改変 0 件 | 達成 (本軸 spec のみ) |
| 並列他軸 (Dev-III + Dev-HHH) と src 衝突なし | 達成 |
| 副作用 0 / 絵文字 0 / API call $0 | 達成 |
| Owner 拘束 0 分 (本 round) | 達成 |

---

## §7 R31 Dev-LLL 引継 3 項目

1. **第 1 波 着手判定**: 公開後 1week 経過後、KPI poller 13 file 物理化スプリント計画起票 (R31 head)
2. **共通 interface 起票**: `app/harness/src/kpi-poller/types.ts` を R31 で起票 / KPI-05/07/13 の 3 件を pilot 物理化
3. **integration test 起案**: HG-6/HG-7/HG-12 連動 wire integration test 1 件 spec を R31 起票

---

## §8 結語

W7 spec brief を Phase 3 (公開後 30day-90day) の 3 波構造として pre-fab。第 1 波 30day 13 KPI 監視運用 855 行 + 第 2 波 HG-8 scheduled CI 1,040 行 + 第 3 波 W6-D automatic rollback 610 行 = 計 2,505 行 / 工数 64-83h / Owner 拘束 0-3 min / readiness 95+ pt 各波。R31 Dev-LLL 引継 3 項目を明記、DEC-088 候補 W7 完遂宣言を R36 起案見込。本 spec 副作用 0 / 物理改変 0 / spec only 着地。

(end of file / 約 240 行)
