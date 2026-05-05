# Dev-DDD R28 — ARCH-01 Phase B-3 PA-04〜PA-09 引継 spec

最終更新: 2026-05-06 W0-Week1
起案: Dev 部門 R28 Dev-DDD
位置付け: R27 Dev-AAA 候補 4 件 (B-3-α/β/γ/δ) を 9 軸 spec に展開、PA-04〜PA-09 を R29-R30 引継ぎ。PA-01〜PA-03 は B-3-δ の sub-task として別書面 (pa-01/02/03-impl.md) で詳細化済。
版: v1.0

---

## §0 サマリ (CEO 200 字)

PA-04〜PA-09 を R29-R30 引継 spec として詳細化。PA-04 = pnpm workspace × TS refs drift 検出 script (B-3-α 第 1 段)、PA-05 = monorepo SOP 文書化 (B-3-α 第 2 段)、PA-06 = types-shared package 雛形 (B-3-γ 第 1 段)、PA-07 = 共有型抽出 + import path 更新 (B-3-γ 第 2 段)、PA-08 = build time 計測 dashboard 自動化、PA-09 = Turborepo feasibility 再評価 (B-3-β 保留 trigger 条件確定)。各 PA 工数 0.5-2.5h、合計 8-12h、R29-R30 2 round 完遂想定。

---

## §1 PA-04 spec (B-3-α 第 1 段 / pnpm workspace × TS refs drift 検出)

### 1.1 概要
**目的**: pnpm-workspace.yaml の packages list と TS references path list が手動同期されている drift リスクを検出 script で機械化。

### 1.2 deliverable
- `app/scripts/check-monorepo-drift.ts` (新規 / 50 行想定)
- 動作: `pnpm-workspace.yaml` parse → packages 配列取得 → 各 package の `tsconfig.json` の `references` を逆引きで cross-check → drift があれば exit 1。

### 1.3 工数
0.5-1.0h / R29 想定 / 担当 = Dev-EEE or Dev-FFF

### 1.4 verify
- 現状 (drift 0) で exit 0 確認
- 意図的 drift 注入 (pnpm-workspace.yaml に dummy 追加) で exit 1 確認

---

## §2 PA-05 spec (B-3-α 第 2 段 / monorepo SOP 文書化)

### 2.1 概要
**目的**: pnpm workspace + TS project references の同期 SOP を `organization/rules/monorepo-sop.md` に文書化。

### 2.2 deliverable
- `organization/rules/monorepo-sop.md` (新規 / 100-150 行想定)
- 内容: package 追加 / 削除手順 / references 更新タイミング / drift 検出 hook 設定 / 違反時の rollback 手順

### 2.3 工数
0.5h / R29 想定

### 2.4 整合
CLAUDE.md §「標準技術スタック」セクションから monorepo-sop.md への link 追加（CLAUDE.md 改変 1 行）。

---

## §3 PA-06 spec (B-3-γ 第 1 段 / types-shared package 雛形)

### 3.1 概要
**目的**: `app/types-shared` package を作成、harness × openclaw-runtime 共有型抽出の受け皿。

### 3.2 deliverable
- `app/types-shared/package.json` (新規)
- `app/types-shared/tsconfig.json` (composite: true, declaration: true)
- `app/types-shared/src/index.ts` (空 export)
- `pnpm-workspace.yaml` packages 追加 (1 行)

### 3.3 工数
0.5h / R29-R30

### 3.4 verify
`pnpm install` 通過 + `tsc --build app/types-shared` 通過

---

## §4 PA-07 spec (B-3-γ 第 2 段 / 共有型抽出 + import path 更新)

### 4.1 概要
**目的**: harness × openclaw-runtime で重複候補の型 5-10 件を types-shared に移動、import path 更新。

### 4.2 抽出候補 (R27 §5.2 参照)
- `HitlGate`
- `BreachCounterState`
- `CrossOrchestratorState`
- `KnowledgeFrontmatterType` (parse 結果共有候補)
- `PiiHit`
- `AuditEventInput` (slim 化版)

### 4.3 deliverable
- `app/types-shared/src/*.ts` (5-10 file 新規)
- harness + openclaw-runtime の import path 更新 (10-30 箇所)
- composite refs 配線 (harness/openclaw → types-shared 追加)

### 4.4 工数
1.5-2.5h / R30 想定

### 4.5 verify
- harness 836 PASS / openclaw 394 PASS 維持
- TS error 0 件維持
- tsc --build 完遂

---

## §5 PA-08 spec (build time 計測 dashboard 自動化)

### 5.1 概要
**目的**: R28 baseline 計測値 (本書面 §6) を round 毎自動取得し dashboard 化、build time regression 早期検知。

### 5.2 deliverable
- `app/scripts/measure-build-time.ts` (新規 / 30-50 行)
- output: `dashboard/build-time-history.md` に追記 (round / build time / TS error count)

### 5.3 工数
0.5-1.0h / R29

### 5.4 baseline (R28 計測)
- tsc --build (incremental, openclaw up-to-date): **0.937s**
- tsc --build (full rebuild after dist clean): 未計測 (R29 で取得想定)
- tsc --noEmit (no composite): **1.352s**

---

## §6 PA-09 spec (Turborepo feasibility 再評価 / B-3-β 保留 trigger)

### 6.1 概要
**目的**: R27 §4.5 で B-3-β は「package 数 5+ で再評価」NO-GO 保留。PA-09 で具体的 trigger 条件 + 再評価書面雛形を確定。

### 6.2 trigger 条件 (確定)
| # | 条件 | 現状 | trigger 状態 |
|---|---|---|---|
| 1 | pnpm workspace package 数 ≥ 5 | 2 (harness + openclaw-runtime) | not yet |
| 2 | tsc --build 全体 build time > 30s | 約 1-2s | not yet |
| 3 | CI cache miss rate > 50% (測定可能になり次第) | 未計測 | pending |
| 4 | 月次 build cost > $X (Vercel 経由想定 / 別 DEC) | $0 (現状) | not yet |

→ 4 条件中 1 つでも trigger で B-3-β 再評価 round 起票。

### 6.3 deliverable
- `projects/PRJ-019/reports/dev-XXX-rN-arch-01-b-3-beta-reeval.md` (template / 雛形 30 行)

### 6.4 工数
0.3h / R30 (or trigger 発動時 ad-hoc)

---

## §7 PA-04〜09 R29-R30 timeline

| Round | 担当想定 | PA | 工数 |
|---|---|---|---|
| R29 | Dev-EEE | PA-01 + PA-02 + PA-03 (KNOW-TS atomic 物理化) | 0.5h |
| R29 | Dev-FFF | PA-04 (drift 検出 script) | 1.0h |
| R29 | Dev-FFF | PA-05 (monorepo SOP 文書) | 0.5h |
| R29 | Dev-FFF | PA-08 (build time 計測 script) | 1.0h |
| R30 | Dev-GGG | PA-06 (types-shared 雛形) | 0.5h |
| R30 | Dev-GGG | PA-07 (共有型抽出) | 2.0h |
| R30 | Dev-GGG | PA-09 (B-3-β 再評価 trigger 確定) | 0.3h |

合計: R29 = 3.0h / R30 = 2.8h / 計 5.8h

---

## §8 制約遵守 status

| 制約 | status |
|---|---|
| 既存 absolute 4 file 無改変 | 達成 (本書面 spec のみ) |
| 副作用 0 | 達成 |
| 既存 R27 5b test 1031 行 absolute 無改変 | 達成 |
| 絵文字 0 / API $0 | 達成 |

---

## §9 結語

PA-04〜09 spec 確定。R29 = KNOW-TS atomic 物理化 + α 系 / R30 = γ + β 再評価 で Phase B-3 全件着地経路明確化。Turborepo (B-3-β) は package 数 ≥ 5 等 4 trigger 条件確定で objective 判定可能。Phase B-3 完遂時に DEC-019-041 fully-resolved 全条件達成。
