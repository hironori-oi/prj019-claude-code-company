# Dev-JJ Round 22 — ARCH-01 / DEC-019-041 workspace alias 解消可否評価

- 案件: PRJ-019 Open Claw "Clawbridge"
- 担当: Dev-JJ (Round 22, W4 完成第 1 弾 task ②)
- 範囲: ARCH-01 (DEC-019-041) Phase B 候補 — `harness → openclaw-runtime` cross-rootDir 解消可否評価
- 関連: Round 19 Dev-AA / Dev-BB / Round 20 Dev-EE 報告で記録された cross-rootDir TS error 9 件、Dev-GG R21 報告 §6.5
- 不可侵: 本評価では物理 migrate せず、設計分析のみ行う (relative imports fallback pattern 維持)

## 0. サマリ

| 項目 | 値 |
|---|---|
| 評価対象 | tsconfig path alias / pnpm workspaces / Nx の三択 |
| **推奨案** | **案 A = tsconfig path alias** (短期), **案 B = pnpm workspaces 完全活用** (中期) |
| 移行コスト (推奨経路) | Phase B-1 (path alias): 約 2.5h / 0 副作用 / regression 0 想定 / Phase B-2 (workspaces 強化): 約 4h |
| 不採用 | 案 C = Nx 導入 (over-engineering, scope 不一致) |
| Phase 2 影響 | 案 A は完全前方互換、案 B は build script 追加変更のみ、案 C は監視 / observability に副作用 |
| 残存 risk | cross-rootDir error 9 件は warn-level (Phase A `tsconfig.legacy-relax`) のため CI block されず実害 0、Phase B 完了 (~6/20) までに解消が DEC-019-041 必達 |

## 1. 現状把握

### 1.1 cross-rootDir 違反箇所

`projects/PRJ-019/app/harness/src/` 配下から `openclaw-runtime/src/controls/*` への relative imports が以下 2 file で確認:

```
src/17day-path-w3-orchestrator.ts
  ├─ '../../openclaw-runtime/src/controls/p-ui-04-kill-switch-propagation.js'
  ├─ '../../openclaw-runtime/src/controls/p-ui-05-anomaly-rollback.js' (type only)
  ├─ '../../openclaw-runtime/src/controls/p-ui-09-rls-checklist.js'
  ├─ '../../openclaw-runtime/src/controls/hitl-10-permission-change.js' (type only)
  ├─ '../../openclaw-runtime/src/controls/p-ui-02-cooldown-modal.js'
  └─ '../../openclaw-runtime/src/controls/p-ui-04-kill-switch-propagation.js'
```

→ TS6059 (rootDir 違反) 9 件 (knowledge 2 件 + その他は別 issue)。

### 1.2 関連状態

- **`harness/tsconfig.json`**: `extends: ../tsconfig.legacy-relax.json` / `rootDir: ./src` / Phase A (warn) 期。
- **`openclaw-runtime/tsconfig.json`**: `paths: { "@clawbridge/harness": ["../harness/src/index.ts"], ... }` を保有しているが、harness 側からの逆方向 alias は未定義 (依存方向上 harness → openclaw-runtime は禁止だったが、Round 19 Dev-BB 実装段階で **必要悪** として relative import が混入)。
- **`pnpm-workspace.yaml`**: `harness / openclaw-runtime` ともに workspace member 登録済 (依存解決は既に機能中)。
- **dependency 方向**: openclaw-runtime → harness は `package.json` の `dependencies: { "@clawbridge/harness": "workspace:*" }` で正規。逆方向 (harness → openclaw-runtime) は `package.json` には記載なし、TS import のみ存在 = "untracked physical reference"。

### 1.3 影響度

| 観点 | 状態 |
|---|---|
| 現状 vitest test runner (esbuild jit) | 動作 (relative path 解決可能) |
| `pnpm typecheck` (tsc strict) | TS6059 warn / Phase A 期間中 CI block なし |
| Phase B (~6/20) で base extends 切替時 | error 化 → CI block / Phase B 移行ブロッカー |
| production runtime (Node `import`) | dist 未 build 状態では未影響、build 後 dist ファイル間で path 不整合 risk 中 |

## 2. 三択評価

### 2.1 案 A — tsconfig path alias

`harness/tsconfig.json` に `paths: { "@clawbridge/openclaw-runtime/*": ["../openclaw-runtime/src/*"] }` を追加し、relative imports を `@clawbridge/openclaw-runtime/controls/p-ui-04-kill-switch-propagation.js` に置換する案。

**pros:**
- 既に **逆方向 alias は openclaw-runtime/tsconfig.json で実装済** = pattern が monorepo 内で確立されている
- `tsc --noEmit` の rootDir 違反は解消する (alias 経由では同一 rootDir 制約は適用されない)
- vitest は `tsconfig-paths` 互換でそのまま解決可能 (要 verify, Round 22 W5 で確認)
- pnpm-workspace.yaml / package.json には変更なし = 副作用最小
- relative imports と vite/esbuild jit の両立も維持可能 (移行期は混在許容)

**cons:**
- 物理依存方向の問題 (harness → openclaw-runtime) は `package.json` 側で未表明のまま残る
- alias は **TypeScript / vitest config 限定** で動く = build 時 (tsc compile + Node ESM) には別途 path 変換が必要 (現状 dist build しない方針なので Phase 1 W4 では問題なし、Phase 2 で build pipeline 確立時に再検討)
- "依存方向: harness → openclaw-runtime は禁止" の design rule (Dev-EE 報告 §1) との緊張: Phase 1 段階の実装現実 (Dev-BB が必要として relative import 採用) を後追いで正規化する形になる

**移行コスト:** 約 2.5h (Phase B-1)
- harness/tsconfig.json に paths 追加: 5 分
- 6 件の import 文 path 書換: 15 分
- vitest config の resolve.alias 同期: 30 分 (要 vitest.config.ts 確認)
- 全 harness test 再実行 + regression 0 確認: 30 分
- knowledge 関連 2 件の TS error は別 root cause (別 issue として分離): 30 分
- 報告 / DEC-019-041 close 動議書面: 30 分

**regression 範囲:**
- harness 内 import が機能維持される限り 0 (production code 経路には影響しない)
- Round 21 で既に existing relative imports が test 通過済 = alias 化しても test 結果は不変想定

**Phase 2 影響:**
- Phase 2 は claude-bridge / orchestrator / sandbox など別 workspace との連携が増える。alias を **monorepo root レベル** で統一しないと cross-workspace alias が不整合化する risk 中。
- Phase 1 W4 終了時に全 workspace の paths を `tsconfig.base.json` に集約する追加 task を Phase 2 着手前に Round 25-27 程度で計画することを推奨。

### 2.2 案 B — pnpm workspaces 完全活用 (`package.json` dependencies 化)

`harness/package.json` に `dependencies: { "@clawbridge/openclaw-runtime": "workspace:*" }` を追加し、import を `import { ... } from '@clawbridge/openclaw-runtime/controls/p-ui-04-kill-switch-propagation.js'` に置換する案 (alias と物理依存の両立)。

**pros:**
- pnpm workspace の正規依存解決で `node_modules/.../openclaw-runtime` symlink を経由 = monorepo の standard practice
- Vitest / Node / tsc 全 toolchain で同 path で解決可能 = build pipeline 確立時に追加変換不要
- "harness → openclaw-runtime は禁止" の design rule に正面から対峙 — Round 22 で「**依存方向反転は事実上発生済、rule の更新が必要**」と decisions.md に記録するのが clean
- openclaw-runtime/package.json の `exports` field を追加すれば controls/* の sub-path import も明示可能

**cons:**
- 循環依存 risk: openclaw-runtime/package.json は既に `dependencies: { "@clawbridge/harness": "workspace:*" }` を持つ → harness → openclaw-runtime 方向が package.json に記載されると **循環依存** が形式化される
  - ただし pnpm は循環依存を block しない (warning のみ)
  - vitest / tsc は問題なく解決
  - production runtime でも Node ESM は import resolution graph で解決可能 (eager evaluation はしない)
- 設計 cleanliness で "open-claw-runtime → harness が cost-tracker / kill-switch を借りる" rule の崩れを公式記録する責務が伴う
- decisions.md 更新 + DEC-019-041 sub-issue で公式化が必要

**移行コスト:** 約 4h (Phase B-2)
- 案 A 完了 (~2.5h) を前提として、+
- harness/package.json の dependencies 追加: 10 分
- openclaw-runtime/package.json の `exports` field 追加 (controls/* 公開): 30 分
- import path 全置換: 30 分
- pnpm install 経由で symlink graph 検証: 15 分
- 循環依存記録 (decisions.md DEC-019-XYZ) + Review 部門レビュー: 60 分

**regression 範囲:**
- 案 A 完了済前提なら test 結果は不変
- pnpm install で workspace graph が再構築されるため、CI cache invalidation 1 回発生 (許容)

**Phase 2 影響:**
- 案 B は Phase 2 の cross-workspace 連携基盤として最も clean
- ただし循環依存の公式承認が必要 = DEC-019-041 議決 + Review 部門 ODR 必須 → 議決待ちで Phase B 期限 (~6/20) を圧迫する risk 中

### 2.3 案 C — Nx 導入

monorepo build orchestrator として Nx を導入し、`nx run-many --target=typecheck` で workspace dependency graph を統括する案。

**pros:**
- 大規模 monorepo の標準解
- task graph caching で CI 速度向上
- code generation / scaffolding 機能

**cons:**
- 現状 monorepo size は 9 packages = Nx 導入の justifiable threshold (~30 packages 以上) に達していない
- 導入コスト 約 12-16h (`nx init` + `project.json` 9 件 + CI 統合 + 全員学習)
- Phase 1 W4 完成期限 (~6/20) との競合 → 期限内完遂 risk 高
- monitoring / observability への副作用: Nx Cloud が enabled になると build artifact が外部 cache に保管される = security review 必要 (Review 部門)
- 学習曲線: 全 Dev agent が Nx 流儀を覚える必要 = 他の Phase 1 task の進捗を圧迫
- Phase 2 (orchestrator / sandbox / audit / notify) で workspace 数が拡大したら再評価が妥当

**移行コスト:** 約 12-16h (Phase B-3 候補だが推奨しない)

**regression 範囲:** 全 workspace の build / test command 経路変更 = 大 (高リスク)

**Phase 2 影響:** 別途 Nx Cloud 統合検討必要 = 監視 stack の再設計

→ **不採用**

### 2.4 三択比較表

| 評価軸 | 案 A (path alias) | 案 B (pnpm workspaces) | 案 C (Nx) |
|---|---|---|---|
| **TS error 9 件解消** | 完全解消 | 完全解消 | 完全解消 |
| **副作用** | 0 | 循環依存記録のみ | build pipeline 全変更 |
| **コスト** | 2.5h | 6.5h (案 A 含む) | 12-16h |
| **Phase 1 W4 期限内完遂** | OK (圧倒的余裕) | OK (議決待ち risk あり) | NG |
| **Phase 2 互換** | 中 (root レベル統一が後追い必要) | 高 (standard practice) | 高 (但し別の cost) |
| **regression risk** | 低 | 低 | 高 |
| **議決必要性** | 不要 (技術的施策) | 必要 (DEC で循環依存承認) | 必要 + ODR + budget 確認 |
| **学習コスト** | 0 (既存 pattern 踏襲) | 低 (pnpm workspace 既知) | 高 |

## 3. 推奨案 + 移行手順

### 3.1 推奨経路: 案 A → 案 B (段階移行)

**Phase B-1 (~6/20 必達, 案 A): tsconfig path alias 化**
- DEC-019-041 必達期限内完遂を最優先
- 議決不要、技術的修正のみで TS error 9 件 (本件 ARCH-01) クローズ
- Phase A → Phase B 移行を block しない

**Phase B-2 (Phase 2 着手前 = ~Round 25 程度, 案 B 候補): pnpm workspaces 正規化**
- 循環依存の公式承認は Phase 2 設計レビュー時に CEO + Review 部門経由で実施
- alias は廃止せず paths と workspaces dependencies の **両立** を許容 (どちらでも解決可能)

### 3.2 Phase B-1 移行手順 (詳細)

#### Step 1: harness/tsconfig.json に paths 追加

```jsonc
// harness/tsconfig.json
{
  "extends": "../tsconfig.legacy-relax.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": false,
    "paths": {
      "@clawbridge/openclaw-runtime/*": ["../openclaw-runtime/src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "src/**/__tests__/**", "src/**/*.test.ts"]
}
```

#### Step 2: 既存 import 6 件を alias 経由に書換

```diff
- import { ... } from '../../openclaw-runtime/src/controls/p-ui-04-kill-switch-propagation.js'
+ import { ... } from '@clawbridge/openclaw-runtime/controls/p-ui-04-kill-switch-propagation.js'
```

書換対象:
- `harness/src/17day-path-w3-orchestrator.ts` (6 import 文)

#### Step 3: vitest.config.ts の resolve.alias 同期

```ts
// harness/vitest.config.ts (例)
import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@clawbridge/openclaw-runtime': resolve(__dirname, '../openclaw-runtime/src'),
    },
  },
})
```

#### Step 4: typecheck + test 実行で regression 0 確認

```bash
cd projects/PRJ-019/app/harness
npx tsc --noEmit          # → TS6059 9 件 → 0 件 (or knowledge 2 件のみ残)
npx vitest run            # → 790+ PASS / 0 FAIL 継続
```

#### Step 5: knowledge 系 7 件の TS error は別 issue 化

`yaml-front-matter-parser.ts` / `ke-04-audit-wiring.ts` の error は ARCH-01 範囲外 (型定義の readonly[] vs string[] 不整合 = 別 root cause)。Phase B-1 とは分離し、別 ticket として Round 23 以降で対応。

#### Step 6: report + 議決書面

- `projects/PRJ-019/reports/dev-XX-r2X-arch-01-phase-b-1-completion.md` で完遂報告
- DEC-019-041 sub-issue close (decisions.md 更新)

### 3.3 Phase B-2 移行手順 (将来, 議決後)

1. CEO + Review 部門で「harness → openclaw-runtime 依存方向反転承認」議決
2. harness/package.json に `dependencies: { "@clawbridge/openclaw-runtime": "workspace:*" }` 追加
3. openclaw-runtime/package.json の `exports` field を controls/* 公開 shape に拡張
4. import path を alias から workspace package 形式に書換 (alias は残置)
5. `pnpm install` で symlink graph 再構築 + CI 全件再実行
6. 循環依存検知 (`pnpm why @clawbridge/harness` / `pnpm why @clawbridge/openclaw-runtime`) で graph 確認
7. decisions.md DEC-019-XYZ で循環依存公式記録

## 4. risk assessment

### 4.1 案 A (推奨経路) の risk matrix

| risk | likelihood | impact | mitigation |
|---|---|---|---|
| vitest が tsconfig paths を解決しない | 低 | 中 | vitest.config.ts の resolve.alias で同期 (既知 pattern) |
| dist build 時に paths 変換が抜ける | 低 | 中 (Phase 1 では未 build) | tsc-alias / `tsc-paths` 等の build-time 変換は Phase 2 build pipeline 確立時に追加 |
| 別 workspace (claude-bridge etc) で同 alias が必要になる | 中 | 低 | tsconfig.base.json に paths 集約案を Phase 2 着手前に検討 (Round 25 計画) |
| Phase A → B 切替時に他の TS error が顕在化 | 中 | 中 | knowledge 系 7 件は本案で別 issue 化、ARCH-01 範囲を限定 |
| relative imports と alias の混在で merge conflict | 低 | 低 | Round 22 完了後 1 回で全変換 = 混在期間最小化 |

### 4.2 案 B 移行時の追加 risk

| risk | likelihood | impact | mitigation |
|---|---|---|---|
| 循環依存承認の議決が長引き Phase B 期限超過 | 中 | 高 | 案 B は Phase 2 着手前に分離 = Phase 1 W4 完成は案 A のみで担保 |
| openclaw-runtime exports field 設計ミスで sub-path 解決失敗 | 中 | 中 | exports field 細分化 + smoke test 5+ 件で検証 |
| pnpm symlink が CI cache miss で遅延 | 低 | 低 | pnpm-lock.yaml commit + CI cache key で対応 |

### 4.3 不採用 (案 C) の risk-benefit

- Nx 不採用 = monorepo size が threshold 未満なので技術的に不要
- Phase 2 末で再評価 (workspace 数が 30+ になったら採用検討)
- 不採用判断を decisions.md に記録 (Round 22 完成時に DEC-019-XYZ 候補)

## 5. Phase 2 影響範囲

### 5.1 案 A 採用時

- Phase 2 着手前 (Round 25 想定) に `tsconfig.base.json` への paths 集約 task を 1 件起票
- claude-bridge / orchestrator / sandbox 着手時点でも同 alias を使う = standard 化
- build pipeline 確立 (Phase 2 W2 想定) で `tsc-alias` 等の path 変換 tool 評価必要

### 5.2 案 B 完全移行時

- workspace dependency graph が完全に正規化される
- production build (Phase 2) で `pnpm -r build` がそのまま機能
- Nx 導入の justifiability も高まる (workspace size 30+ 到達時に再評価)

### 5.3 監視・observability

- 案 A / B ともに監視 / observability stack には影響 0
- 案 C のみ Nx Cloud が cache layer に介入する可能性あり

## 6. 結論 + 次手順

### 6.1 推奨

**Phase B-1 (~6/20 必達): 案 A = tsconfig path alias 化を採用**
- 移行コスト 2.5h / 議決不要 / regression 0 想定 / DEC-019-041 必達クローズ可能
- 実装担当は Round 23-24 で Dev 1 名にアサイン (Dev-AA / Dev-BB / 担当者問わず可、historical baseline 知識者推奨)

**Phase B-2 (将来): 案 B = pnpm workspaces 正規化を計画**
- Phase 2 着手前に CEO + Review 部門経由で「依存方向反転」議決
- 案 A の alias と並走させ、移行は段階的に (alias 廃止は急がない)

**案 C (Nx): 現時点では不採用** — workspace size threshold 未到達のため

### 6.2 Round 23 着手要件

1. CEO 承認: 本評価書を踏まえた Phase B-1 着手 GO 判断
2. 担当 Dev assign: 1 名 / 想定 0.5 day
3. PR template: ARCH-01 phase B-1 完遂報告 + decisions.md 更新案 同梱
4. Review 部門事前合意: 関連 6 import 書換の merge gate 設定 (regression 0 確認義務)

### 6.3 関連 file 参照

- `projects/PRJ-019/app/docs/tsconfig-rollout.md` (Phase A → B 全体方針)
- `projects/PRJ-019/app/tsconfig.base.json` / `tsconfig.legacy-relax.json` (現行 strict 設定)
- `projects/PRJ-019/app/harness/tsconfig.json` (ARCH-01 対象 1)
- `projects/PRJ-019/app/openclaw-runtime/tsconfig.json` (逆方向 alias 既存実装 = pattern source)
- `projects/PRJ-019/decisions.md` (DEC-019-041 本体)
- Round 19 Dev-AA / Dev-BB 報告 (cross-rootDir error 初出記録)
- Round 20 Dev-EE 報告 §6.4 (Round 21+ で path mapping 正式設計の引継要請)
- Round 21 Dev-GG 報告 §6.5 (本評価書の前提)

---

**SOP 順守**: 本評価は物理 migrate せず設計分析のみ実施 (Round 22 制約)。relative imports fallback pattern は維持。CEO 承認後に Round 23 で実装着手予定。
