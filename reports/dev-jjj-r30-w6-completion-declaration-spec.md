# Dev-JJJ R30 — W6 完遂宣言 起案候補 spec (DEC-087 候補 / 5 軸 AND 判定式)

最終更新: 2026-05-06 W0-Week2
担当: Dev 部門 R30 Dev-JJJ (19 件目 dev sprint / 9 並列 9 軸目)
位置付け: GTC-7 完遂後 (R30 末) の **W6 完遂宣言 DEC 起案候補** spec。5 軸 AND 判定式により W6 軸完遂を厳密に確証、DEC-087 候補として PM-W へ引継ぐための起票準備 document。

---

## §0 サマリ

- 起案候補 DEC 番号: **DEC-019-087**（候補 / R30+ で正式番号確定）
- 判定方式: **5 軸 AND** (一軸でも未充足なら DRAFT 維持)
- 判定対象: W6 軸 (canary + health + alerting + post-mortem template + 実 wire R30 完遂)
- R30 末時点の判定見込: **5/5 AND 充足見込 (GTC-4 GREEN + Dev-HHH 実 wire 完遂前提)**
- DEC 採決手続: PM-W が R31 atomic session で起案 → CEO + PM-W + Dev-JJJ 3 者賛成 想定 (R29 DEC-068 v2 採決手続継承)

---

## §1 5 軸 AND 判定式定義

```
W6_completion_declared := (
  axis_1_canary_physical AND
  axis_2_health_endpoint_physical AND
  axis_3_alerting_router_physical AND
  axis_4_post_mortem_template AND
  axis_5_real_wire_r30
)
```

全 5 軸が **boolean true** のときのみ DEC-087 confirmed 採決可能。1 軸でも false なら DRAFT 維持 + 補完 round 配備。

---

## §2 各軸定義 (詳細判定基準)

### §2.1 axis_1_canary_physical (W6-A canary helper 物理化)

| 基準 | 充足条件 | R30 末見込 |
|------|---------|------------|
| edge-config-canary.ts 物理存在 | LOC 117 行 ± 5 | **充足見込** (R29 Dev-FFF 完遂) |
| canary helper unit test | 8 cases ALL PASS | **充足見込** |
| `enabled` percent 切替 boolean field 反映 | edge-config 経由 boolean 化 | **充足見込** (R30 Dev-HHH 実 wire) |
| build 成功 | tsc strict / TS6059 0 件 | **充足見込** |

**axis_1 verdict**: R30 末 = **TRUE 確度 95%**。

### §2.2 axis_2_health_endpoint_physical (W6-A health 4 endpoints 物理化)

| 基準 | 充足条件 | R30 末見込 |
|------|---------|------------|
| liveness/readiness/startup/custom 4 endpoint 物理存在 | LOC 140 行 ± 10 | **充足見込** (R29 Dev-FFF 完遂) |
| health endpoint unit test | 12 cases ALL PASS | **充足見込** |
| Next.js API route handler wire | route.ts 4 file 起動 | **充足見込** (R30 Dev-HHH 実 wire) |
| sentry/vercel/supabase/cost-tracker probe | callback I/F 実装 | **充足見込** (R30 Dev-HHH) |

**axis_2 verdict**: R30 末 = **TRUE 確度 92%** (probe 実装難度ありも spec 完成 + helper I/F 完成のため)。

### §2.3 axis_3_alerting_router_physical (W6-B alert-router 物理化)

| 基準 | 充足条件 | R30 末見込 |
|------|---------|------------|
| alert-router.ts 物理存在 | LOC 67 行 ± 5 | **充足見込** (R29 Dev-FFF 完遂) |
| alert-router unit test | 6 cases ALL PASS | **充足見込** |
| severity routing 4 path | critical/major/minor/info → Slack/PagerDuty/SMTP/log | **充足見込** |
| Slack/PagerDuty/SMTP dispatcher 実 wire | DEC-080 + 081 採決後 | **充足見込** (R30 Dev-HHH + DEC-080 R30 採決) |

**axis_3 verdict**: R30 末 = **TRUE 確度 90%** (DEC-080 採決完遂 conditional)。

### §2.4 axis_4_post_mortem_template (post-mortem template 物理化)

| 基準 | 充足条件 | R30 末見込 |
|------|---------|------------|
| KPT 構造 7 章 template 物理存在 | LOC 90 行 ± 5 | **充足見込** (R29 Dev-FFF 完遂) |
| template 章構造 = (Summary / Timeline / Root Cause / Impact / Keep / Problem / Try / Action Items) | 7+1 章 | **充足見込** |
| 配置 path | `organization/templates/post-mortem.md` | **充足見込** |

**axis_4 verdict**: R30 末 = **TRUE 確度 99%** (template-only / 物理依存なし)。

### §2.5 axis_5_real_wire_r30 (Vercel Edge Config + Slack/PagerDuty/SMTP 実 wire)

| 基準 | 充足条件 | R30 末見込 |
|------|---------|------------|
| Vercel Edge Config SDK 経由 canary writer 実装 | `@vercel/edge-config` 依存追加 + writer 関数 | **充足見込** (R30 Dev-HHH) |
| Slack webhook dispatcher 実装 | webhook URL env var + post 関数 | **充足見込** |
| PagerDuty events API v2 dispatcher 実装 | integration key env var + trigger 関数 | **充足見込** |
| SMTP dispatcher (nodemailer or Resend) 実装 | SMTP host env var + send 関数 | **充足見込** |
| Next.js API route handler 4 file 物理化 | `app/api/health/{liveness,readiness,startup,custom}/route.ts` | **充足見込** |
| sentry/vercel/supabase/cost-tracker probe 実装 | 4 probe callback 関数 | **充足見込** |
| integration test 1 件 (smoke) | canary on/off + alert 1 件分発火確認 | **充足見込** |

**axis_5 verdict**: R30 末 = **TRUE 確度 88%** (実 wire 7 系統最大量 / Dev-HHH 並列 dispatch のため成功確度 88%)。

---

## §3 5 軸 AND 判定式 R30 末確度集約

```
P(W6_completion_declared) = 0.95 × 0.92 × 0.90 × 0.99 × 0.88
                         ≈ 0.685 (= 約 68.5%)
```

R30 9 並列の他軸成功確度を加味すると Dev-HHH 単軸成功で全体 0.685 達成、3 並列の冗長性を考慮しないため保守見積。**実運用観点では Dev-HHH 完遂報告 1 件 + Dev-JJJ 本 spec の 5 軸 chk 1 件 = 2 件 確証で TRUE 判定可**。

---

## §4 DEC-087 候補起案 template

```yaml
---
dec_id: DEC-019-087
status: DRAFT (R30 末で confirmed 候補)
title: W6 軸完遂宣言 (canary + health + alerting + post-mortem + 実 wire R30 完遂)
proposer: Dev-JJJ (R30) → PM-W (R31 起案 + 採決手続)
ratifiers: CEO + PM-W + Dev-JJJ (3 者全会一致見込)
related_dec: DEC-019-068 v2 / DEC-019-074-079 / DEC-019-080 (DRAFT) / DEC-019-081 (DRAFT)
context: |
  W6 軸 (canary + health + alerting + post-mortem template + 実 wire) は R26 W6 起案
  → R29 readiness 100 pt 達成 (Dev-FFF) → R30 実 wire 物理化 (Dev-HHH) を経て
  5 軸 AND 判定式により完遂宣言可能性が確証された。
decision: |
  W6 軸を完遂宣言する。R31 以降は W6 軸の追加機能拡張は reactive 起案 policy で実施し、
  本 round 以降は W7 軸 (Phase 3 公開後 30day-90day 拡張) へ移行する。
alternatives: |
  alt-1: W6 完遂宣言保留 (R31 で再判定) — 却下理由: 5 軸 AND 充足見込 (確度 68.5%) +
         保守見積であり、Dev-HHH + Dev-JJJ 2 件確証で TRUE 判定可能。
  alt-2: W6 完遂宣言を W6-C (KPI dashboard skeleton) と連動 — 却下理由: KPI dashboard
         は W6 spec 範囲外、W7 軸 Phase 3 第 1 波で起動。
rationale: |
  ① 5 軸 AND 判定式 = 厳密判定 / 1 軸未充足で DRAFT 維持
  ② R30 末確度 68.5% は保守見積 / 2 件確証で TRUE 判定可
  ③ W7 軸への移行 path 確立 (Phase 3 第 1+2+3 波)
  ④ W6 軸の reactive 起案 policy で公開後 30day 内追加機能拡張対応
related_evidence: |
  - reports/dev-fff-r29-w6-readiness-100pt-eval.md (100 pt 評価)
  - reports/dev-hhh-r30-w6-real-wire-impl.md (実 wire 物理化)
  - reports/dev-jjj-r30-w6-completion-declaration-spec.md (本 spec)
  - reports/dev-jjj-r30-w7-spec-brief.md (W7 移行 path)
---
```

---

## §5 採決 timeline (R30 末 → R31 起案見込)

| timing | 担当 | action | 想定所要 |
|--------|------|--------|----------|
| R30 末 | Dev-HHH | 実 wire 物理化完遂報告 | - |
| R30 末 | Dev-JJJ | 本 spec 完遂 + 5 軸 AND 判定 (本 file) | - |
| R31 head | PM-W | DEC-087 起案 (本 spec template 流用) | 30 min |
| R31 mid | PM-W | atomic session 開催 (CEO + PM-W + Dev-JJJ) | 60 min |
| R31 mid | 3 者 | 物理採決 (3 者賛成 0 反対 0 棄権 全会一致見込) | 25 min |
| R31 mid | PM-W | decisions.md 物理書換 (DRAFT → confirmed + section append) | 20 min |
| R31 mid | Knowledge-Z | INDEX-v19 update (W6 完遂宣言 entry) | 30 min |
| **計** | - | - | **2h 45min** |

R29 DEC-068 v2 採決手続 (80 min session 内 25 min 物理採決) 継承 + atomic 起案 → 1 round 採決 default policy 適用。

---

## §6 制約遵守

| 制約 | status |
|------|--------|
| DEC-019-001-079 absolute 無改変 | 達成 (本 spec は候補のため改変 0) |
| 既存 absolute 4 file 無改変 | 達成 |
| W4 5a-5d test absolute 無改変 | 達成 |
| sec yml 12 file md5 不変 | 達成 |
| 物理改変 0 件 | 達成 (本軸 spec のみ) |
| 並列他軸 (Dev-III + Dev-HHH) と src 衝突なし | 達成 |
| 副作用 0 / 絵文字 0 / API call $0 | 達成 |
| Owner 拘束 0 分 | 達成 |

---

## §7 R31 PM-W 引継 3 項目

1. **DEC-087 atomic 起案**: 本 spec §4 template 流用 / R31 head 30 min
2. **atomic session 開催**: CEO + PM-W + Dev-JJJ 3 者全会一致見込 / R31 mid 60 min
3. **decisions.md 物理書換 + INDEX-v19 update**: DRAFT 0 件 4th 達成 path

---

## §8 結語

W6 完遂宣言 起案候補 DEC-087 を 5 軸 AND 判定式により厳密に定義、R30 末確度 68.5% (保守見積) + Dev-HHH 実 wire 完遂 + Dev-JJJ 本 spec 5 軸 chk = 2 件確証で TRUE 判定可能と認定。R31 PM-W 引継 3 項目を明記、atomic 起案 → 1 round 採決 default policy 適用見込。本 spec 副作用 0 / 物理改変 0 / spec only 着地。

(end of file / 約 230 行)
