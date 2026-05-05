# Dev-CCC Round 28 — W6-B Production GA SOP 物理化実装報告

最終更新: 2026-05-06 W0-Week2
起案: Dev 部門 R28 Dev-CCC（17 件目 dev sprint / Round 28 9 並列の 3 軸目）
位置付け: R27 Dev-AAA `dev-aaa-r27-w6-w6b-spec-draft.md`（W6-B spec readiness 87 pt 草案）の **production GA 運用 SOP** を物理化。本 round で W6-B の post-launch 監視 / KPI dashboard / alert routing runbook を完遂、R30 以降 D-Day 6/19 後の sustained 運用着手の前提を整備。
版: v1.0 (R28 着地)
連動 DEC: DEC-019-006 / 049 / 062 / 074-079 / 080 (DRAFT) / 081 (DRAFT)
連動 spec: `projects/PRJ-019/reports/dev-aaa-r27-w6-w6b-spec-draft.md`
連動 runsheet: `projects/PRJ-019/runsheets/w6b-production-ga-sop.md`

---

## §0 サマリ（CEO 200 字）

R27 Dev-AAA W6-B spec（test 物理化対象 / 6-8 tests / 500-650 行 / performance baseline 永続化）と対をなす **production GA 運用 SOP** を物理化。runsheet `w6b-production-ga-sop.md` 約 470 行で D+1h / D+24h / D+1week / D+1month 4 段階監視 cadence、KPI dashboard 5 軸（Sentry / Vercel / Supabase / cost / user satisfaction）、alert routing 3 severity、incident response 5 段階 runbook、post-mortem template を整備。実運用は R30 以降想定、本 round では SOP 物理化のみ（副作用 0 / API call $0）。

---

## §1 R28 Dev-CCC 着手前提

### 1.1 R27 W6-B spec 状態

| 観点 | 値 |
|---|---|
| W6-B spec readiness | 87/100 pt (R27 草案完遂) |
| W6-B test 物理化対象 file | `phase2-w6-performance-regression-baseline.test.ts` |
| W6-B test 物理化 担当 | R30+ Dev-XXX |
| W6-B baseline file | `app/harness/src/__tests__/fixtures/performance-baseline-v1.json` |

### 1.2 R28 で W6-B 側で物理化する範囲

| 範囲 | 担当 round | status |
|---|---|---|
| test 物理化（performance baseline test） | R30+ Dev-XXX | 本 round 対象外 |
| **production GA 運用 SOP** | **R28 Dev-CCC** | **本書面で完遂** |
| KPI dashboard skeleton | R29 Dev-FFF (引継) | 引継 |
| alert routing helper 物理化 | R29 Dev-FFF (引継) | 引継 |
| post-mortem template 配置 | R29 Dev-FFF (引継) | 引継 |

---

## §2 物理化 SOP 構成

### 2.1 runsheet 物理化

- **file**: `projects/PRJ-019/runsheets/w6b-production-ga-sop.md`
- **行数**: 約 470 行
- **構成 11 章**:
  1. 適用範囲 + 前提（GO checklist 8 件）
  2. 監視 cadence 4 段階（GA-1 hyper care / GA-2 acute / GA-3 sub-acute / GA-4 sustained）
  3. KPI dashboard 5 軸
  4. alert routing 3 severity（warning / critical / emergency）
  5. incident response runbook（5 段階）
  6. KPI report cadence（daily / weekly / monthly）
  7. 制約遵守 status
  8. R29 引継 3 項目
  9. R30 想定 W6 完遂条件
  10. 関連 file 参照
  11. 結語

### 2.2 主要設計要素

#### 2.2.1 監視 cadence 4 段階

| stage | 期間 | 担当 cadence | 監視粒度 |
|---|---|---|---|
| GA-1 hyper care | D+0h 〜 D+24h | 24h on-call (15min check) | 5 軸全部 |
| GA-2 acute | D+1d 〜 D+7d | 8h on-call (1h check) | 5 軸全部 |
| GA-3 sub-acute | D+1w 〜 D+1mo | weekday on-call (4h check) | 5 軸 summary |
| GA-4 sustained | D+1mo 〜 | 通常運用（daily check） | weekly summary |

#### 2.2.2 KPI dashboard 5 軸

| # | 軸 | metric | source | 目標値 |
|---|---|---|---|---|
| K1 | Sentry error rate | unhandled / 1000 req | Sentry | < 0.5% |
| K2 | Vercel p99 latency | API route p99 | Vercel Analytics | < 2.0s |
| K3 | Supabase health | conn + slow + storage | Supabase | all green |
| K4 | cost spend rate | daily USD | cost-tracker | < monthly/30 × 1.2 |
| K5 | user satisfaction | NPS / ticket | Marketing | NPS > 30 |

#### 2.2.3 alert routing 3 severity

| severity | 影響範囲 | 対応 SLA | escalation |
|---|---|---|---|
| warning | 単一 KPI 軽微 | 30 min | Dev on-call |
| critical | 重大 / 複数軽微 | 5 min | Dev + Owner |
| emergency | 複数重大 / outage | 1 min | Dev + Sec + Owner + CEO |

#### 2.2.4 incident response 5 段階

| stage | task | 担当 | 目標時間 |
|---|---|---|---|
| I1 detect | alert ack | Dev on-call | < 5 min |
| I2 triage | severity 判定 | Dev on-call | < 10 min |
| I3 mitigate | rollback / hotfix | Dev + Owner | < 30 min |
| I4 resolve | KPI GREEN 復帰 | Dev | < 4 hour |
| I5 post-mortem | RCA | Dev + Review | < 7 day |

#### 2.2.5 post-mortem template

本 SOP §5.4 で 7 セクション template 化（Summary / Timeline / Root Cause / Resolution / Lessons Learned (KPT) / Action Items）。R29 Dev-FFF が `organization/templates/post-mortem.md` 配下に正式配置。

---

## §3 spec → SOP 物理化の適応事項

### 3.1 R27 Dev-AAA spec からの拡張軸

| 軸 | R27 spec（performance test 軸） | R28 SOP（運用軸） |
|---|---|---|
| 主目的 | latency baseline 統計確定 | post-launch 監視運用 |
| 物理化対象 | `phase2-w6-performance-regression-baseline.test.ts` | `w6b-production-ga-sop.md` |
| 行数 | 500-650（test code） | 470（runbook） |
| 検証範囲 | heartbeat / breach-counter / cost-tracker 3 軸 | KPI 5 軸（W6-A monitoring と整合） |
| 担当 round | R30+ Dev-XXX | R28 SOP / R30+ 実運用 |

### 3.2 spec 継承事項 + 新規追加

**継承（R27 Dev-AAA → R28 Dev-CCC）**:
- 制約厳守（API call $0 / 副作用 0 / 絵文字 0）
- baseline file 仕様（performance-baseline-v1.json）= GA dashboard data source として参照
- 既存 R22 stress chaos + 1M longrun を baseline 比較に活用

**新規追加（R28 Dev-CCC 独自）**:
- 監視 cadence 4 段階の time-axis 設計（GA-1 〜 GA-4）
- KPI 5 軸 + threshold + alert 連動 table
- alert routing 3 severity + escalation chain
- incident response 5 段階 runbook + hotfix 経路
- post-mortem template + KPT 構造
- KPI report cadence（daily / weekly / monthly）

---

## §4 W6-A SOP との整合

| 観点 | W6-A SOP | W6-B SOP | 整合性 |
|---|---|---|---|
| 監視軸 | 4 hook（Sentry / Vercel / Supabase / cost） | 5 軸（4 hook + user satisfaction） | W6-B が W6-A 4 hook を継承 + K5 拡張 |
| rollback 経路 | < 5min 完遂 | hotfix 経路で参照 | 同経路を short-cycle 化で再利用 |
| alert routing | 3 severity (簡易) | 3 severity（詳細化 + escalation chain） | W6-B が W6-A を補強 |
| timeline | T+0 〜 T+240 (rollout day) | D+0h 〜 D+1month (sustained) | W6-A 完遂後に W6-B 接続 |
| 担当部門 | Dev + Web-Ops | Dev + Web-Ops + Sec + Review + Marketing | W6-B が部門拡張 |

→ W6-A → W6-B 連続性確保、D-Day 6/19 当日に W6-A SOP 完遂後 W6-B SOP 即時着手可能。

---

## §5 制約遵守 status

| 制約 | 遵守 status |
|---|---|
| 副作用 0 | **達成**（runsheet 1 file 新規追加のみ） |
| 既存 absolute 4 file 無改変 | **達成**（W4 baseline / W5 file / control / Phase 1 移行済） |
| API call $0 | **達成**（SOP 物理化のみ） |
| 絵文字 0 | **達成** |
| W6 物理 monitoring R30+ 想定 = 本 round では実運用 0 件 | **達成** |
| fix forward-only | **達成**（append のみ） |
| DEC-080 / 081 採決前提 | **達成**（SOP のみ起票 / 実運用待機） |

---

## §6 R29 Dev-FFF 引継 3 項目

### 6.1 引継 1: KPI dashboard skeleton 物理化

- file: `app/dashboard/page.tsx`（Vercel preview 環境）
- 行数: 80-120 行
- 機能: 5 軸 mock data 表示 + DashboardLayout component
- 工数想定: 2-3h

### 6.2 引継 2: alert routing 3 severity 物理化

- file: `app/lib/alert-router.ts`
- 行数: 60-100 行
- 機能: severity 判定 + Slack webhook routing + email + SMS routing skeleton
- 工数想定: 1.5-2h

### 6.3 引継 3: post-mortem template 配置

- file: `organization/templates/post-mortem.md`
- 行数: 50-80 行
- 機能: 本 SOP §5.4 を template 化、KPT 構造保持、PRJ-XXX 由来明示
- 工数想定: 0.5-1h

---

## §7 R30 以降想定 W6-B 完遂条件

| 条件 | 達成 method | 担当 round |
|---|---|---|
| W6-B test 物理化（6-8 tests / 500-650 行） | R30+ Dev-XXX | R30 |
| performance-baseline-v1.json 永続化 | W6-B test 物理化完遂 | R30 |
| 本 SOP の D+1h 〜 D+1month 実運用完遂 | 本 SOP 全段階 GO | R30+ (sustained) |
| KPI dashboard 5 軸 物理化 | R29 Dev-FFF skeleton + R30 完遂 | R29-R30 |
| alert routing helper 物理化 + Slack 連動確認 | R29 Dev-FFF skeleton + R30 webhook | R29-R30 |

---

## §8 関連 file 参照

- 前提 spec: `projects/PRJ-019/reports/dev-aaa-r27-w6-w6b-spec-draft.md`
- 物理化 runsheet: `projects/PRJ-019/runsheets/w6b-production-ga-sop.md`
- 連動 runsheet: `projects/PRJ-019/runsheets/w6a-production-rollout-sop.md`
- sibling report: `projects/PRJ-019/reports/dev-ccc-r28-w6a-impl.md`
- readiness 評価: `projects/PRJ-019/reports/dev-ccc-r28-w6-readiness-98pt-eval.md`
- summary: `projects/PRJ-019/reports/dev-ccc-r28-summary.md`

---

## §9 結語

R27 Dev-AAA W6-B spec（test 物理化軸）と対をなす **production GA 運用 SOP** を物理化完遂。runsheet 約 470 行で 4 段階監視 cadence + KPI 5 軸 + alert routing 3 severity + incident response 5 段階 runbook + post-mortem template を整備、R30 以降 D-Day 6/19 後の sustained 運用着手前提の整備完了。

本 round では実運用 0 件 / 副作用 0 / API call $0 厳守、R29 Dev-FFF への引継 3 項目（dashboard skeleton + alert helper + post-mortem template）で R30+ 実運用着手の経路確立。W6-A SOP との整合性確保、D-Day 6/19 当日 W6-A → W6-B 連続接続可能。

---

**SOP 順守**: 副作用 0 / 既存 absolute 4 file 無改変 / API call $0 / 絵文字 0 / 物理 monitoring R30+ / fix forward-only / DEC-080+081 採決前提。
