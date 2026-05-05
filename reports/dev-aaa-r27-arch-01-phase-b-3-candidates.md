# Dev-AAA Round 27 — ARCH-01 Phase B-3 候補探索

最終更新: 2026-05-05 W0-Week1
起案: Dev 部門 R27 Dev-AAA（補完 dev / 9 並列体制 9 番目）
位置付け: Round 26 Dev-WW Phase B-2 物理実装完遂（TS6059 5→0 件 / `dev-ww-r26-arch-01-resolution-evidence.md`）後、Phase B-3 候補（次段の architectural improvement）を 4 件探索 + feasibility 評価 + 推奨候補確定。
版: v1.0
連動 DEC: DEC-019-041（partial-resolved → resolved-evidence-ready）/ DEC-019-076 / DEC-019-079（採決待機 / 5/26 想定）
連動 baseline:
- harness 836 PASS / openclaw-runtime 394 PASS 維持
- TS6059 0 件達成（R26 Dev-WW Phase B-2 完遂時）
- knowledge 系 4 件（TS2698 / TS2322 / TS4104）残存（KNOW-TS-01〜04 別 issue 化想定）

---

## §0 サマリ（CEO 250 字）

ARCH-01 Phase B-3 候補（次段 architectural improvement）を 4 件探索: **B-3-α = pnpm workspaces 正式運用化**（package 二重宣言 drift SOP 整備 / R5 mitigation 完遂 / 1.5-2.5h）/ **B-3-β = Turborepo 導入**（build orchestration 高度化 / cache 効率向上 / 6-8h）/ **B-3-γ = types-shared package 抽出**（harness × openclaw-runtime 共有型 DRY 化 / 2.5-3.5h）/ **B-3-δ = legacy-relax 解消**（knowledge 系 4 件 TS2698/TS2322/TS4104 解消 = KNOW-TS-01〜04 / 2-3h）。**推奨候補 = B-3-δ**（DEC-019-041 fully-resolved 到達 trigger / 工数 2-3h / 6/19 公開前 timeline 適合性最大）。第 2 推奨 = B-3-α（pnpm workspaces SOP 整備で R5 mitigation 完遂）/ 第 3 推奨 = B-3-γ（共有型 DRY 化）/ 第 4 推奨 = B-3-β（Turborepo は overengineering リスク）。harness 836 PASS / openclaw-runtime 394 PASS baseline absolute 保護、本書面で実改変ゼロ件。

---

## §1 Phase B-3 の位置付け

### 1.1 Phase 系統 timeline

```
Phase B-1 (R23 Dev-MM): dev/staging migrate（test files 1-2 個 alias 化）→ 完遂
Phase B-2 (R24 Dev-PP + R26 Dev-WW): paths alias + composite refs 物理実装 → 完遂（TS6059 0 件）
Phase B-3 (R28+): 次段 architectural improvement（本書面で候補探索）
```

### 1.2 R26 着地時点の「未解消」項目

| # | 項目 | 件数 / 状態 |
|---|---|---|
| ① | knowledge 系 TS error（TS2698 / TS2322 / TS4104） | 4 件 残存 |
| ② | pnpm-workspace.yaml × TS references の二重宣言 drift SOP | 整備 pending（R5 mitigation） |
| ③ | harness × openclaw-runtime 共有型の重複 | 数件（型重複検出 pending） |
| ④ | build orchestration（tsc --build × vitest × pnpm の手動連携） | overhead は微増 / Turborepo 化未検討 |

→ 4 項目それぞれが Phase B-3 候補（α / β / γ / δ）に対応

---

## §2 Phase B-3 候補 4 件 概要

| 候補 ID | 主題 | 工数 | timeline 適合性 | feasibility |
|---|---|---|---|---|
| B-3-α | pnpm workspaces 正式運用化 | 1.5-2.5h | 高 | 高 |
| B-3-β | Turborepo 導入 | 6-8h | 中 | 中 |
| B-3-γ | types-shared package 抽出 | 2.5-3.5h | 高 | 高 |
| B-3-δ | legacy-relax 解消（knowledge 系 4 件） | 2-3h | **最高** | 高 |

---

## §3 候補 B-3-α — pnpm workspaces 正式運用化

### 3.1 概要

**目的**: pnpm-workspace.yaml と TS references の二重宣言を SOP 化し、R5 mitigation pending を解消（Dev-WW R26 §6 R5 参照）。

### 3.2 現状

```yaml
# projects/PRJ-019/pnpm-workspace.yaml (現状)
packages:
  - 'app/harness'
  - 'app/openclaw-runtime'
```

```jsonc
// projects/PRJ-019/app/harness/tsconfig.json (R26 Dev-WW 改変済)
"references": [{ "path": "../openclaw-runtime" }]
```

→ pnpm workspace の package list と TS references の path list が **手動同期** = drift リスク。

### 3.3 改善案

| step | 内容 | 工数 (h) |
|---|---|---|
| 1 | pnpm workspace + TS references の同期 SOP 文書化（`organization/rules/monorepo-sop.md`） | 0.5 |
| 2 | drift 検出スクリプト（`scripts/check-monorepo-drift.sh`） | 0.5 |
| 3 | CI pre-commit hook 追加（drift 検出時 fail） | 0.5 |
| 4 | README + CLAUDE.md 連動 update | 0.3 |
| 5 | regression 0 verify | 0.2 |
| **合計** | | **2.0** |

### 3.4 risk + mitigation

| # | risk | mitigation |
|---|---|---|
| α-R1 | 既存 pnpm-workspace.yaml 改変で install 経路 break | install 経路は read-only / 改変は補助 script のみ |
| α-R2 | drift 検出 script の false positive | path 正規化 + 単純 diff で誤検出 0 |
| α-R3 | CI pre-commit hook で developer 体験悪化 | warning モード（fail でなく warn）で初期運用 |

### 3.5 feasibility 評価

| 軸 | 評価 |
|---|---|
| 工数 | **小（2h）** |
| 6/19 timeline 適合性 | **高** |
| 既存 baseline regression risk | **低**（補助 script + 文書のみ） |
| R5 mitigation 完遂寄与 | **高**（R5 完全解消） |
| **総合** | **GO 推奨** |

---

## §4 候補 B-3-β — Turborepo 導入

### 4.1 概要

**目的**: `tsc --build` + `vitest` + `pnpm` の手動連携を Turborepo 化し、incremental build cache の効率化 + parallelism 向上。

### 4.2 現状

```bash
# 現状 build / test 経路（手動）
cd app/openclaw-runtime && npx vitest run  # 394 PASS
cd app/harness && npx vitest run            # 836 PASS
cd app/harness && npx tsc --build           # composite refs build
```

### 4.3 改善案

| step | 内容 | 工数 (h) |
|---|---|---|
| 1 | turbo.json 設計 + pipeline 定義（build / test / lint） | 1.5 |
| 2 | Turborepo 導入（`pnpm add -Dw turbo`）| 0.5 |
| 3 | 既存 npm script を turbo 経由に refactor | 1.5 |
| 4 | local cache + remote cache（Vercel）設定 | 1.5 |
| 5 | CI workflow update | 1.0 |
| 6 | regression 0 verify（836 + 394 維持） | 1.0 |
| 7 | 文書化 | 0.5-1.0 |
| **合計** | | **6.5-8.0** |

### 4.4 risk + mitigation

| # | risk | mitigation |
|---|---|---|
| β-R1 | turbo cache invalidation 仕様で stale build 参照 | turbo.json の inputs/outputs 明示 + cache key 検証 |
| β-R2 | 既存 npm script 全面書換でテスト経路 break | turbo run 経由で透過化 / 既存 script は alias 化 |
| β-R3 | Vercel remote cache 連携で API 課金発生（B-2 制約 $0 違反リスク） | local cache のみで運用 / remote cache は別承認下 |
| β-R4 | overengineering（2 package のみ で turbo 導入は ROI 低い） | package 数 5+ で再評価 / 当面は不要 |

### 4.5 feasibility 評価

| 軸 | 評価 |
|---|---|
| 工数 | **中（6.5-8h）** |
| 6/19 timeline 適合性 | **中**（R28-R30 で完遂可だが緊急性低） |
| ROI | **低**（package 数 2 で turbo 導入は overengineering） |
| 既存 baseline regression risk | **中**（全 build 経路書換） |
| **総合** | **保留**（package 数 5+ で再評価 / 当面 NO-GO） |

---

## §5 候補 B-3-γ — types-shared package 抽出

### 5.1 概要

**目的**: harness × openclaw-runtime で重複している型定義（HitlGate / BreachCounterState / CrossOrchestratorState 等）を `@clawbridge/types-shared` package に抽出し DRY 化。

### 5.2 現状

```typescript
// app/harness/src/types/hitl-gate.ts (重複 1)
export type HitlGate = { ... };

// app/openclaw-runtime/src/types/hitl-gate.ts (重複 2)
export type HitlGate = { ... };
```

→ 同型を 2 場所で維持 = drift リスク

### 5.3 改善案

| step | 内容 | 工数 (h) |
|---|---|---|
| 1 | `app/types-shared` package 新規作成 + tsconfig + package.json | 0.5 |
| 2 | 共有型 5-10 件抽出 + export | 1.0 |
| 3 | harness + openclaw-runtime の import path 更新 | 1.0 |
| 4 | composite refs 追加（harness + openclaw-runtime → types-shared） | 0.3 |
| 5 | regression 0 verify（836 + 394 維持） | 0.5 |
| 6 | 文書化 | 0.2-0.5 |
| **合計** | | **2.5-3.3** |

### 5.4 risk + mitigation

| # | risk | mitigation |
|---|---|---|
| γ-R1 | 既存 import path 全置換で TS strict error 発生 | 段階的置換（5-10 件一括 → tsc --build verify） |
| γ-R2 | types-shared に runtime code 混入で circular import | 型のみ export 厳守（runtime export 0 件） |
| γ-R3 | composite refs 3 段化で build 時間増加 | tsbuildinfo cache で incremental 維持 |

### 5.5 feasibility 評価

| 軸 | 評価 |
|---|---|
| 工数 | **小-中（2.5-3.3h）** |
| 6/19 timeline 適合性 | **高** |
| ROI | **中**（型重複の防止 + DRY 化）|
| 既存 baseline regression risk | **低-中**（import path 置換のみ） |
| **総合** | **GO 推奨**（B-3-δ 完遂後の R29+ 想定） |

---

## §6 候補 B-3-δ — legacy-relax 解消（knowledge 系 4 件）

### 6.1 概要

**目的**: R26 Dev-WW Phase B-2 物理実装後も残存する knowledge 系 TS error 4 件（KNOW-TS-01〜04）を解消し、DEC-019-041 fully-resolved 状態に到達。

### 6.2 残存 4 件の内訳

```
src/knowledge/ke-04-audit-wiring.ts(87,53): error TS2698: Spread types may only be created from object types.
src/knowledge/yaml-front-matter-parser.ts(252,5): error TS2322: Type ... is not assignable
src/knowledge/yaml-front-matter-parser.ts(263,7): error TS4104: The type 'readonly string[]' is 'readonly' and cannot be assigned to the mutable type 'string[]'.
src/knowledge/yaml-front-matter-parser.ts(269,5): error TS2322: Type ... is not assignable
```

| ID | error | 場所 | 想定 fix |
|---|---|---|---|
| KNOW-TS-01 | TS2698 | ke-04-audit-wiring.ts:87 | spread 対象を object 型 narrow + as object 明示 |
| KNOW-TS-02 | TS2322 | yaml-front-matter-parser.ts:252 | type assertion + zod schema 整合 |
| KNOW-TS-03 | TS4104 | yaml-front-matter-parser.ts:263 | readonly → mutable copy（spread or `[...arr]`） |
| KNOW-TS-04 | TS2322 | yaml-front-matter-parser.ts:269 | KNOW-TS-02 と同経路 |

### 6.3 改善案

| step | 内容 | 工数 (h) |
|---|---|---|
| 1 | KNOW-TS-01 fix（TS2698）+ unit test 確認 | 0.5 |
| 2 | KNOW-TS-02 fix（TS2322 第 1 件）+ unit test | 0.5 |
| 3 | KNOW-TS-03 fix（TS4104）+ unit test | 0.3 |
| 4 | KNOW-TS-04 fix（TS2322 第 2 件）+ unit test | 0.4 |
| 5 | tsc --build verbose で 0 件確認 | 0.2 |
| 6 | harness 836 + openclaw 394 regression 0 verify | 0.3 |
| 7 | DEC-019-041 status 遷移書面（resolved-evidence-ready → fully-resolved） | 0.5 |
| **合計** | | **2.7** |

### 6.4 risk + mitigation

| # | risk | mitigation |
|---|---|---|
| δ-R1 | as 型 assertion で runtime mismatch 発生 | unit test で完全検証 + zod schema 連動 |
| δ-R2 | readonly → mutable copy で意図しない mutation 発生 | spread copy 使用（`[...arr]`）で immutable 維持 |
| δ-R3 | knowledge 系 file 改変で ke-* unit test regression | 既存 test 全 PASS verify |
| δ-R4 | DEC-019-041 fully-resolved 遷移は DEC-019-079 採決後の formal 化必要 | δ 着地は技術解消のみ / DEC-019-079 採決連動は別 round |

### 6.5 feasibility 評価

| 軸 | 評価 |
|---|---|
| 工数 | **最小（2.7h）** |
| 6/19 timeline 適合性 | **最高** |
| ROI | **最高**（DEC-019-041 fully-resolved 到達 trigger） |
| 既存 baseline regression risk | **低**（4 file 限定改変） |
| **総合** | **GO（最優先）推奨** |

---

## §7 4 候補比較 matrix

| 観点 | B-3-α (pnpm SOP) | B-3-β (Turborepo) | B-3-γ (types-shared) | B-3-δ (legacy-relax) |
|---|---|---|---|---|
| 工数 | 2.0h | 6.5-8h | 2.5-3.3h | 2.7h |
| 6/19 timeline 適合性 | 高 | 中 | 高 | **最高** |
| feasibility | 高 | 中 | 高 | 高 |
| ROI | 高（R5 完遂）| 低（overengineering）| 中（DRY 化）| **最高（fully-resolved 到達）** |
| baseline regression risk | 低 | 中 | 低-中 | 低 |
| DEC-019-041 fully-resolved 寄与 | なし | なし | なし | **直接寄与** |
| 推奨 round | R29 | 保留 | R29-R30 | **R28** |

---

## §8 推奨 priority

### 8.1 推奨候補 = B-3-δ（最優先）

**根拠**:
1. **DEC-019-041 fully-resolved 到達 trigger**（最重要）
2. 工数 2.7h で R28 1 round の半分以下で完遂可能
3. 6/19 公開前 timeline 適合性最高
4. baseline regression risk 最低（4 file 限定）
5. KNOW-TS-01〜04 を統合解消で別 issue 起票不要

### 8.2 第 2 推奨 = B-3-α

**根拠**: R5 mitigation 完遂で Phase B-2 残課題を全消化、工数小（2h）で完遂。R29 想定。

### 8.3 第 3 推奨 = B-3-γ

**根拠**: types-shared 抽出で DRY 化、構造的健全性向上。工数中（2.5-3.3h）/ R29-R30 想定。

### 8.4 第 4 推奨 = B-3-β

**根拠**: package 数 2 のみで Turborepo 導入は overengineering / ROI 低 / 当面 NO-GO / package 数 5+ で再評価。

---

## §9 R28+ Phase B-3 timeline 提案

| Round | 担当想定 | 物理化対象 | 工数 |
|---|---|---|---|
| R28 | Dev-DDD | **B-3-δ (legacy-relax 解消) ← 最優先推奨** | 2.7h |
| R29 | Dev-EEE | B-3-α (pnpm SOP 整備) | 2.0h |
| R29-R30 | Dev-FFF | B-3-γ (types-shared 抽出) | 2.5-3.3h |
| 保留 | - | B-3-β (Turborepo) | 6.5-8h（package 数 5+ で再評価） |

### 9.1 R28-R30 完遂時想定

| 観点 | R28 後 | R29 後 | R30 後 |
|---|---|---|---|
| TS error 件数 | **0**（KNOW-TS-01〜04 解消） | 0 | 0 |
| pnpm × TS refs drift SOP | pending | **完遂** | 完遂 |
| 共有型 DRY 化 | 未実施 | 未実施 | **完遂** |
| DEC-019-041 status | resolved-evidence-ready (技術 fully) | (DEC-079 採決後 fully-resolved) | fully-resolved |

---

## §10 制約遵守 status

| 制約 | 遵守 status |
|---|---|
| harness 836 PASS / openclaw-runtime 394 PASS 維持 | **達成**（本書面で実改変 0 件） |
| API 追加コスト $0 | **達成** |
| 副作用 0 | **達成**（reports 配下 1 file 新規追加のみ） |
| 絵文字 0 | **達成** |
| DEC-019-041 + 076 + 079 absolute 無改変 | **達成**（参照のみ） |
| Phase 1 移行済 file absolute 無改変 | **達成** |
| W4 historical baseline absolute 無改変 | **達成** |
| 4 control 実装 absolute 無改変 | **達成** |
| fix forward-only 厳守 | **達成** |
| 物理化 file は R28+ 想定 | **達成**（本書面は探索のみ） |

---

## §11 結語

ARCH-01 Phase B-3 候補を 4 件探索: B-3-α (pnpm SOP) / B-3-β (Turborepo) / B-3-γ (types-shared) / B-3-δ (legacy-relax)。

**推奨候補 = B-3-δ**（legacy-relax 解消 = KNOW-TS-01〜04 / 工数 2.7h / DEC-019-041 fully-resolved 到達 trigger / 6/19 公開前 timeline 適合性最高）= **R28 物理化 GO（最優先）**。

R28+ Phase B-3 timeline 提案: R28 = δ → R29 = α → R29-R30 = γ → β は package 数 5+ で再評価（保留）。R30 完遂時に DEC-019-041 全条件 fully-resolved 到達経路明確化、ARCH-01 全完遂着地経路確定。

本書面は候補探索 + feasibility 評価のみ、物理化は R28+ Dev 担当で実行。harness 836 PASS / openclaw-runtime 394 PASS baseline absolute 保護完遂。
