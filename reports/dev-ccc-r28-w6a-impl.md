# Dev-CCC Round 28 — W6-A Production Rollout SOP 物理化実装報告

最終更新: 2026-05-06 W0-Week2
起案: Dev 部門 R28 Dev-CCC（17 件目 dev sprint / Round 28 9 並列の 3 軸目）
位置付け: R27 Dev-ZZ `dev-zz-r27-w6-w6a-spec-detail.md`（W6-A spec readiness 96 pt）の **production rollout 側 SOP** を物理化。本 round で W6-A の production rollout runbook を完遂、R30 D-Day 実 deploy 着手の前提を整備。
版: v1.0 (R28 着地)
連動 DEC: DEC-019-006 / 049 / 062 / 074-079 / 080 (DRAFT) / 081 (DRAFT)
連動 spec: `projects/PRJ-019/reports/dev-zz-r27-w6-w6a-spec-detail.md`
連動 runsheet: `projects/PRJ-019/runsheets/w6a-production-rollout-sop.md`

---

## §0 サマリ（CEO 200 字）

R27 Dev-ZZ W6-A spec（test 物理化対象 / 8-12 tests / 600-750 行）と対をなす **production rollout SOP** を物理化。runsheet `w6a-production-rollout-sop.md` 約 480 行で canary 5% → 25% → 50% → 100% 4 段階 progressive rollout、automated trigger 4 種 + manual gate 5 件、monitoring hook 4 系統（Sentry / Vercel Analytics / Supabase / cost-tracker）、rollback 経路（< 5min 完遂目標）を runbook 化。実 deploy は R30 想定、本 round では SOP 物理化のみ（副作用 0 / API call $0）。

---

## §1 R28 Dev-CCC 着手前提

### 1.1 R27 着地状態

| 観点 | 値 |
|---|---|
| W6 readiness | 96/100 pt (R27 着地) |
| W6-A spec | R27 Dev-ZZ で readiness 96 pt 詳細化完遂 |
| W6-B spec | R27 Dev-AAA で readiness 87 pt 草案完遂 |
| W6 kickoff judgment | GO YES（DEC-080 採決前提） |
| harness PASS | 849 維持 |
| openclaw-runtime PASS | 394 維持 |

### 1.2 R28 task scope

| # | task | status |
|---|---|---|
| 1 | W6-A 物理実装着手（rollout SOP） | **本書面で完遂** |
| 2 | W6-B 物理実装着手（GA SOP） | sibling report 参照 |
| 3 | W6 readiness 96 → 98 pt 改善 | sibling report 参照 |
| 4 | R29 着手準備（deploy script / vercel rollout config / supabase migration） | 本書面 §5 |
| 5 | R28 summary report 起票 | sibling report 参照 |

---

## §2 物理化 SOP 構成

### 2.1 runsheet 物理化

- **file**: `projects/PRJ-019/runsheets/w6a-production-rollout-sop.md`
- **行数**: 約 480 行
- **構成 12 章**:
  1. 適用範囲 + 前提（GO checklist 10 件）
  2. rollout 4 段階（S1 canary / S2 partial / S3 majority / S4 full）
  3. rollout trigger（automated 4 種 + manual gate 5 件）
  4. monitoring hook 統合（4 系統）
  5. 段階別実行 runbook（時刻別 task table）
  6. cost-tracker spend rate 連動 alert
  7. rollback 経路（< 5min 完遂目標）
  8. 制約遵守 status
  9. R29 引継 3 項目
  10. R30 想定 W6 完遂条件
  11. 関連 file 参照
  12. 結語

### 2.2 主要設計要素

#### 2.2.1 4 段階 progressive rollout

| stage | traffic % | duration | gate type |
|---|---|---|---|
| S1 canary | 5% | 60 min | automated → manual |
| S2 partial | 25% | 60 min | manual gate |
| S3 majority | 50% | 60 min | manual gate |
| S4 full | 100% | (sustained) | manual gate |

#### 2.2.2 Edge Config 経由動的 rollout

```typescript
// app/middleware.ts (R30 物理化想定 / 本 SOP §2.3)
const canaryPercent = (await get<number>('canary_percent')) ?? 0;
const userBucket = hashUserId(req) % 100;
if (userBucket < canaryPercent) return canaryRoute();
return baselineRoute();
```

→ Edge Config 1 値書換で即時 rollout 段階切替 + 即時 rollback 可能

#### 2.2.3 automated trigger 4 種

| # | trigger | condition |
|---|---|---|
| T1 | CI green + harness 858+ PASS | S1 canary 開始 |
| T2 | Sentry error rate < baseline + 0.5% | S2 gate eligible |
| T3 | p99 latency < baseline × 1.2 | S2 gate eligible |
| T4 | cost-tracker spend rate < budget × 1.1 | S2 gate eligible |

#### 2.2.4 manual gate 5 件

| # | gate item | 確認者 |
|---|---|---|
| 1 | Sentry critical error 0 件 | Dev |
| 2 | p99 latency < baseline × 1.3 | Dev |
| 3 | cost-tracker spend < budget × 1.2 | Sec |
| 4 | Supabase query slow log 0 件 | Dev |
| 5 | user-facing error report 0 件 | Web-Ops |

#### 2.2.5 monitoring hook 4 系統

| 系統 | 主要 metric | 連動 DEC |
|---|---|---|
| Sentry | unhandled exception / 4xx / 5xx / p99 | DEC-080 |
| Vercel Analytics | LCP / INP / CLS / function duration | - |
| Supabase | connection / slow query / storage / auth | - |
| cost-tracker | daily spend / API cost / budget | DEC-081 |

#### 2.2.6 rollback 経路（< 5min）

```bash
# Step 1: Edge Config canary_percent = 0 (即時)
# Step 2: previous stable deployment への alias 切替
# Step 3: Sentry / Slack 通知
# Step 4: Owner / CEO 報告
# Step 5: post-mortem schedule (24h 以内)
```

---

## §3 spec → SOP 物理化の適応事項

### 3.1 R27 Dev-ZZ spec からの拡張軸

| 軸 | R27 spec（test 物理化軸） | R28 SOP（rollout 物理化軸） |
|---|---|---|
| 主目的 | failure pattern e2e test 化 | production deploy runbook 化 |
| 物理化対象 | `phase2-w6-operational-hardening-e2e.test.ts` | `w6a-production-rollout-sop.md` |
| 行数 | 600-750（test code） | 480（runbook） |
| Mock 戦略 | 6 種 mock（API call $0 担保） | Edge Config 経由（実 deploy 0 件 担保） |
| 制約 | 副作用 0 / 子 process 0 | 実 deploy 0 件 / 既存 file 無改変 |
| 担当 round | R28-R29 物理化 | R28 SOP / R30 実 deploy |

### 3.2 spec 継承事項 + 新規追加

**継承（R27 Dev-ZZ → R28 Dev-CCC）**:
- 制約 12 項目厳守（副作用 0 / API call $0 / 絵文字 0 等）
- 既存 W4 + W5 + control + Phase 1 file absolute 無改変
- DEC-080 採決前 = 物理化 staging（実 deploy 0 件）

**新規追加（R28 Dev-CCC 独自）**:
- canary 4 段階 + Edge Config 動的 rollout 設計
- automated trigger 4 種 + manual gate 5 件の判定経路
- monitoring hook 4 系統の統合 SOP
- rollback 経路（< 5min 完遂目標 / 5 step）
- alert routing 3 severity（warning / critical / emergency）

---

## §4 制約遵守 status

| 制約 | 遵守 status |
|---|---|
| 副作用 0 | **達成**（runsheet 1 file 新規追加のみ） |
| 既存 absolute 4 file 無改変 | **達成**（W4 baseline / W5 file / control / Phase 1 移行済） |
| API call $0 | **達成**（SOP 物理化のみ） |
| 絵文字 0 | **達成**（runsheet + report 両 file 確認） |
| W6 物理 deploy R30 想定 = 本 round では実 deploy 0 件 | **達成** |
| fix forward-only | **達成**（append のみ） |
| DEC-080 / 081 採決前提 | **達成**（SOP のみ起票 / 実 deploy 待機） |

---

## §5 R29 Dev-FFF 引継 3 項目

### 5.1 引継 1: R30 実 deploy リハーサル準備

- Vercel preview 環境で S1 canary deploy dry-run（実 deploy 0 件 / preview 確認のみ）
- preview URL 取得 + monitoring hook 4 系統の動作確認
- 工数想定: 2-3h

### 5.2 引継 2: Edge Config canary_percent helper 物理化

- file: `app/lib/edge-config-canary.ts`
- 行数: 50-80 行
- 機能: type 定義 + factory + canary_percent get/set + hashUserId helper
- 工数想定: 1.5-2h

### 5.3 引継 3: monitoring hook 4 種 health-check API 物理化

- files:
  - `app/api/health/sentry/route.ts`
  - `app/api/health/vercel/route.ts`
  - `app/api/health/supabase/route.ts`
  - `app/api/health/cost-tracker/route.ts`
- 各 30-50 行（合計 120-200 行）
- 機能: 各 hook の up/down 判定 + JSON response
- 工数想定: 2-3h

---

## §6 R30 想定 W6-A 完遂条件

| 条件 | 達成 method | 担当 round |
|---|---|---|
| W6-A test 物理化（8-12 tests / 600-750 行） | R28 Dev-CCC + R29 Dev-FFF | R28-R29 |
| W6-A rollout 実 deploy 完遂 | 本 SOP 全 stage GO | R30 (D-Day) |
| W6 readiness 100/100 pt | DEC-080+081 採決 + Dev-CCC dispatch | R28-R29 |
| harness 858-863 PASS（W6-A 完成） | W6-A test 物理化完遂 | R29-R30 |

---

## §7 関連 file 参照

- 前提 spec: `projects/PRJ-019/reports/dev-zz-r27-w6-w6a-spec-detail.md`
- 物理化 runsheet: `projects/PRJ-019/runsheets/w6a-production-rollout-sop.md`
- 連動 runsheet: `projects/PRJ-019/runsheets/w6b-production-ga-sop.md`
- sibling report: `projects/PRJ-019/reports/dev-ccc-r28-w6b-impl.md`
- readiness 評価: `projects/PRJ-019/reports/dev-ccc-r28-w6-readiness-98pt-eval.md`
- summary: `projects/PRJ-019/reports/dev-ccc-r28-summary.md`

---

## §8 結語

R27 Dev-ZZ W6-A spec（test 物理化軸）と対をなす **production rollout SOP** を物理化完遂。runsheet 約 480 行で 4 段階 canary rollout + monitoring hook 4 系統 + rollback 経路（< 5min）を runbook 化、R30 D-Day 6/19 実 deploy 着手前提の整備完了。

本 round では実 deploy 0 件 / 副作用 0 / API call $0 厳守、R29 Dev-FFF への引継 3 項目（rehearsal + helper + health-check API）で R30 実 deploy 完遂の経路確立。

---

**SOP 順守**: 副作用 0 / 既存 absolute 4 file 無改変 / API call $0 / 絵文字 0 / 物理 deploy R30+ / fix forward-only / DEC-080+081 採決前提。
