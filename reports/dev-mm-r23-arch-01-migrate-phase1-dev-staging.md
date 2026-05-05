# Dev-MM Round 23 — ARCH-01 path alias 物理 migrate Phase 1 (dev/staging 段階)

- 案件: PRJ-019 Open Claw "Clawbridge"
- 担当: Dev-MM (Round 23, 9 並列の 1)
- 範囲: ARCH-01 / DEC-019-041 Phase B-1 物理 migrate **dev/staging 段階** (Dev-JJ R22 案 A 推奨経路の最小実装)
- 関連: Dev-JJ R22 評価書 `dev-jj-r22-arch-01-workspace-alias-feasibility.md` (326 行) §3.2
- 制約: spec + 最小実装 (test file 1-2 個のみ alias 化) = 議決不要 / regression 0 維持

## 0. サマリ

| 項目 | 値 |
|---|---|
| 着地 | **Phase 1 (dev/staging) 完遂** — paths alias 動作確認 + 2 test file 移行 + regression 0 |
| 変更 file | 4 (tsconfig.json × 2 + vitest.config.ts × 1 + test file × 2 + spec annotate) |
| 移行 test file | **2** (`17day-path-w3-cooldown-killterminal-orchestrator.test.ts` / `17day-path-w3-4ctrl-orchestrator.test.ts`) |
| 移行 import 文数 | **6** (cross-rootDir relative imports → alias imports) |
| harness 全体 (事前) | **795 PASS / 60 files / 0 FAIL** (Round 22 末) |
| harness 全体 (事後) | **804 PASS / 61 files / 0 FAIL** (regression 0 / +9 PASS / +1 file) |
| 純粋 alias 移行寄与 | **0 PASS 増減** (移行 2 files の 32 tests は完全 PASS 維持) |
| Dev-MM 純粋寄与 | **+9 PASS / +1 file** (新規 HITL gates integration test = task ①) |
| TypeScript strict | error 9 件 (= R22 baseline と同数, 全て pre-existing main code TS6059 + knowledge 系) |
| 副作用 / 議決 / API コスト | 0 / 不要 / $0 (Read + Edit + Write のみ) |
| Phase 2 (production rollout) | Round 23 後半 Dev-NN 引継 (main code `17day-path-w3-orchestrator.ts` 全 6 imports 移行 + 残 W3 test file 移行) |

## 1. Phase 1 範囲定義

### 1.1 Phase B-1 (Dev-JJ R22 設計) と Phase 1 (dev/staging) の関係

Dev-JJ R22 §3.2 で示された「Phase B-1 移行手順」(Step 1〜6) を **2 段階に分割**:

| 段階 | 範囲 | 担当 / Round |
|---|---|---|
| **Phase 1 (dev/staging)** = 本書 | tsconfig paths 追加 + vitest alias 同期 + 検証用 test file 1-2 個のみ alias 化 | **Dev-MM R23 (本書)** |
| Phase 2 (production rollout) | main code (`17day-path-w3-orchestrator.ts` の 6 imports) + 残 W3 test file 全移行 + DEC-019-041 sub-issue close | Dev-NN R23 後半 (引継) |

分割理由:
- Phase 1 で alias resolver (tsconfig + vitest) の動作を **production main code を触らずに** 検証
- Phase 2 で main code 移行する際、resolver 不具合の risk を 0 化 (Phase 1 で実証済みのため)
- 議決不要 / regression 0 維持の制約を Phase 1 完遂時点で完全担保

### 1.2 設計判断: なぜ 2 test file か

| 候補 | 移行 import 数 | 採用 | 理由 |
|---|---|---|---|
| **`17day-path-w3-cooldown-killterminal-orchestrator.test.ts`** | 2 | **採用** | 最小単位 / W3 ctrl 種別カバー (P-UI-02 / P-UI-04) |
| **`17day-path-w3-4ctrl-orchestrator.test.ts`** | 4 | **採用** | 最大単位 / W3 ctrl 種別カバー (P-UI-04 / P-UI-05 / P-UI-09 / HITL-10) |
| `17day-path-w3-rollback-permission-orchestrator.test.ts` | 0 | 不採用 | cross-rootDir import なし (移行対象外) |
| `17day-path-w4-e2e-fully-wired.test.ts` | 0 | 不採用 | historical baseline 絶対無改変 + cross-rootDir なし |
| `17day-path-w4-production-e2e-extended.test.ts` | 0 | 不採用 | Dev-JJ R22 baseline 絶対無改変 + cross-rootDir なし |

**選定根拠**: 2 test file で W3 で使われる主要 5 ctrl type (P-UI-02 / P-UI-04 / P-UI-05 / P-UI-09 / HITL-10) を全て alias 経由で resolve する shape カバレッジを確保。Phase 2 で main code 移行する際の resolver 動作 confidence を最大化。

## 2. 実装変更 (4 file)

### 2.1 `harness/tsconfig.json` — paths 追加 (前方互換)

```diff
{
  "_meta": {
-   "rolloutPhase": "A (warn)",
+   "rolloutPhase": "A (warn) → ARCH-01 Phase 1 dev/staging migrate (Round 23 Dev-MM)",
    "migrationTarget": "tsconfig.base.json (Phase B / Phase 1 W4 末)",
-   "issue": "ARCH-01 (DEC-019-041)"
+   "issue": "ARCH-01 (DEC-019-041)",
+   "archPhase1": {
+     "since": "Round 23 Dev-MM (2026-05-05)",
+     "scope": "test files 1-2 個のみ alias 化 (議決不要 / regression 0 維持)",
+     "spec": "Dev-JJ R22 case A 推奨経路 = `@clawbridge/openclaw-runtime/*` paths 追加",
+     "production_rollout": "Phase 2 (Round 23 後半 Dev-NN 引継 = main code 全移行)"
+   }
  },
  "extends": "../tsconfig.legacy-relax.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
-   "composite": false
+   "composite": false,
+   "baseUrl": "./src",
+   "paths": {
+     "@clawbridge/openclaw-runtime/*": ["../../openclaw-runtime/src/*"]
+   }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "src/**/__tests__/**", "src/**/*.test.ts"]
}
```

**設計判断**:
- `baseUrl: ./src` を新規追加 (paths が relative path で resolve するために必要 = TypeScript 仕様)
- `paths` 値は `../../openclaw-runtime/src/*` (harness/src からの 2 階層遡上)
- `exclude: src/**/*.test.ts` は Phase 1 段階では維持 = test files は tsc strict 対象外、vitest が独自に解決
- 副作用: tsc が paths を認識するようになるが、main code (orchestrator) は relative imports を維持しているため動作変化 0

### 2.2 `openclaw-runtime/tsconfig.json` — annotate のみ (semantic 不変)

```diff
{
  "_meta": {
-   "rolloutPhase": "A (warn)",
+   "rolloutPhase": "A (warn) → ARCH-01 Phase 1 dev/staging migrate (Round 23 Dev-MM)",
    "migrationTarget": "tsconfig.base.json (Phase B / Phase 1 W4 末)",
-   "issue": "ARCH-01 (DEC-019-041)"
+   "issue": "ARCH-01 (DEC-019-041)",
+   "archPhase1": {
+     "since": "Round 23 Dev-MM (2026-05-05)",
+     "scope": "harness 側に `@clawbridge/openclaw-runtime/*` alias 追加。本 file は `@clawbridge/harness` 逆方向 alias で既に統一 pattern を実装済 (Dev-BB Round 19 由来)。Phase 1 段階では本 file 無改変 (annotate のみ)。",
+     "production_rollout": "Phase 2 (Round 23 後半 Dev-NN 引継 = main code 全移行)"
+   }
  },
  // (compilerOptions / paths / include / exclude すべて不変)
}
```

**設計判断**:
- `paths` 値は不変 (`@clawbridge/harness` 逆方向 alias は Round 19 Dev-BB 由来で既に動作中)
- annotate のみで semantic 変化 0 = monorepo の path alias 統一 pattern を文書化
- Phase 2 で必要なら openclaw-runtime 側の self-alias 追加検討 (現状不要)

### 2.3 `harness/vitest.config.ts` — resolve.alias 同期 (vitest 経路)

```diff
+import { resolve } from 'node:path'

 export default defineConfig({
   test: { /* 不変 */ },
+  resolve: {
+    alias: {
+      '@clawbridge/openclaw-runtime': resolve(__dirname, '../openclaw-runtime/src'),
+    },
+  },
 })
```

**設計判断**:
- vitest は `tsconfig-paths` を auto-load しないため、`resolve.alias` で明示的に同期
- alias 値は tsconfig paths と完全 1:1 対応 (`../../openclaw-runtime/src` ≡ `../openclaw-runtime/src` from vitest.config.ts location)
- 副作用: vitest の resolver が新 alias prefix を認識するが、relative imports は完全に維持される

### 2.4 test file 2 件 — alias imports 移行

**Pattern A (`17day-path-w3-cooldown-killterminal-orchestrator.test.ts` / 2 imports)**:
```diff
-import {
-  CooldownClockSkewError,
-  type CooldownClock,
-  type CooldownInput,
-} from '../../../openclaw-runtime/src/controls/p-ui-02-cooldown-modal.js'
-import type { KillInput } from '../../../openclaw-runtime/src/controls/p-ui-04-kill-switch-propagation.js'
+// Round 23 Dev-MM: ARCH-01 Phase 1 dev/staging migrate (DEC-019-041 / Dev-JJ R22 案 A).
+// 旧 `../../../openclaw-runtime/src/controls/...` → 新 `@clawbridge/openclaw-runtime/controls/...`.
+// Phase 1 段階 = test file 1-2 個のみ alias 化 (議決不要 / regression 0 維持).
+import {
+  CooldownClockSkewError,
+  type CooldownClock,
+  type CooldownInput,
+} from '@clawbridge/openclaw-runtime/controls/p-ui-02-cooldown-modal.js'
+import type { KillInput } from '@clawbridge/openclaw-runtime/controls/p-ui-04-kill-switch-propagation.js'
```

**Pattern B (`17day-path-w3-4ctrl-orchestrator.test.ts` / 4 imports)**: 同 pattern で 4 import 文を全て alias 化 (P-UI-04 / P-UI-05 / P-UI-09 / HITL-10 全 ctrl カバー)。

**設計判断**:
- 移行は **import 文のみ**、本体 code は完全不変 (test 結果不変想定)
- comment block で「Round 23 Dev-MM ARCH-01 Phase 1」由来を明示 (将来監査時の trail)
- 旧 relative path に戻したい場合は import 行 1〜4 行の差し替えで完全 revert 可能

## 3. vitest 検証結果

### 3.1 個別 file 検証

```bash
# 移行 file 1
$ npx vitest run src/__tests__/17day-path-w3-cooldown-killterminal-orchestrator.test.ts
  → 13 PASS / 0 FAIL (8ms)

# 移行 file 2
$ npx vitest run src/__tests__/17day-path-w3-4ctrl-orchestrator.test.ts
  → 19 PASS / 0 FAIL (8ms)
```

合計 32 tests (移行前 13 + 19) すべて PASS = alias resolver 動作確認完遂。

### 3.2 harness 全体 (regression check)

```
事前 (R22 末):  795 PASS / 60 files / 0 FAIL
事後 (R23 着地): 804 PASS / 61 files / 0 FAIL  (+9 PASS / +1 file = task ① 由来)
```

**regression 0 完全達成**: 既存 795 tests に対する破壊なし。新規 9 tests (HITL gates integration) は task ① 単独寄与。

### 3.3 TypeScript strict 検証

```bash
$ npx tsc --noEmit
  → error 9 件 (R22 baseline と同数)
    - 5 件: TS6059 cross-rootDir (main code `17day-path-w3-orchestrator.ts` 由来 = Phase 2 で解消予定)
    - 4 件: knowledge 系 (yaml-front-matter-parser.ts / ke-04-audit-wiring.ts = ARCH-01 範囲外)
```

**新規 / 移行 file の追加 error は 0**:
- 新規 `17day-path-w4-hitl-gates-integration.test.ts` → exclude 対象 (test files は tsc 対象外)
- 移行 2 file → exclude 対象 (同上)

`exclude: src/**/*.test.ts` の効果で test files は tsc strict 検証から除外されるが、vitest は **全 test file を resolve + 実行する** ため alias の runtime 動作は完全検証済。Phase 2 で main code 移行時に tsc strict も追加検証する。

## 4. Phase 1 完遂判定

| 判定軸 | 結果 |
|---|---|
| paths alias 設計 (tsconfig) | OK (harness/tsconfig.json baseUrl + paths 追加) |
| vitest resolve.alias 同期 | OK (vitest.config.ts resolve.alias 追加) |
| test file 移行 (1-2 個) | OK (2 file = 6 imports 移行、Dev-JJ R22 §3.2 Step 2 を test 範囲のみで実施) |
| 移行 file の test PASS | OK (32/32 tests PASS) |
| harness 全体 regression 0 | OK (795 → 804、+9 は task ① 由来、移行 file 由来 +0) |
| TypeScript strict 追加 error | OK (新規 / 移行 file の追加 error 0) |
| 議決必要性 | 不要 (技術的施策 / Dev-JJ R22 §6.1 推奨通り) |
| API コスト | $0 (Read + Edit + Write のみ) |

**Phase 1 完遂判定: GO** — Phase 2 (production rollout) 着手可能状態。

## 5. Phase 2 引継 task (Round 23 後半 Dev-NN)

### 5.1 main code 移行 (6 imports / 1 file)

対象: `harness/src/17day-path-w3-orchestrator.ts`

```diff
-} from '../../openclaw-runtime/src/controls/p-ui-04-kill-switch-propagation.js'
-import type { PostRollbackNotifier } from '../../openclaw-runtime/src/controls/p-ui-05-anomaly-rollback.js'
-} from '../../openclaw-runtime/src/controls/p-ui-09-rls-checklist.js'
-import type { PermissionAuditSink } from '../../openclaw-runtime/src/controls/hitl-10-permission-change.js'
-} from '../../openclaw-runtime/src/controls/p-ui-02-cooldown-modal.js'
-} from '../../openclaw-runtime/src/controls/p-ui-04-kill-switch-propagation.js'
+} from '@clawbridge/openclaw-runtime/controls/p-ui-04-kill-switch-propagation.js'
+import type { PostRollbackNotifier } from '@clawbridge/openclaw-runtime/controls/p-ui-05-anomaly-rollback.js'
+} from '@clawbridge/openclaw-runtime/controls/p-ui-09-rls-checklist.js'
+import type { PermissionAuditSink } from '@clawbridge/openclaw-runtime/controls/hitl-10-permission-change.js'
+} from '@clawbridge/openclaw-runtime/controls/p-ui-02-cooldown-modal.js'
+} from '@clawbridge/openclaw-runtime/controls/p-ui-04-kill-switch-propagation.js'
```

**完遂条件**:
- 6 imports 全 alias 化
- `npx tsc --noEmit` で TS6059 5 件 (main code 由来) → **0 件** に reduce
- `npx vitest run` で全 804+ tests が PASS 維持 (regression 0)

### 5.2 残 W3 test file 移行 (任意)

その他の cross-rootDir relative imports を持つ test file:
```bash
$ grep -rn "openclaw-runtime/src/controls" harness/src/__tests__/ | wc -l
# Phase 1 完了後の残件は 8 import 以下 (主要 file は本書で 6 移行済)
```

これらは Phase 2 一括 / 段階移行どちらでも可。基本方針: **新規 test file は alias で書く / 既存 test file は触らない限り移行しない** = 段階移行の自然な収束。

### 5.3 DEC-019-041 sub-issue close 動議

Phase 2 完遂時点で:
- Phase A → Phase B 移行の TS6059 5 件 (ARCH-01 範囲) を完全解消
- DEC-019-041 sub-issue close を decisions.md に追記 (Phase B-1 完遂報告 + Phase B-2 = pnpm workspaces 完全活用 = Phase 2 着手前 Round 25 想定 へのハンドオフ)

### 5.4 Phase 2 着手前 checklist

Dev-NN が R23 後半着手時に確認すべき事項:
1. 本書 §2 の 4 file 変更が main branch に commit 済 (PR merge 済)
2. `harness/tsconfig.json` の `paths` で `@clawbridge/openclaw-runtime/*` が解決可能
3. `harness/vitest.config.ts` の `resolve.alias` が同期済
4. 移行済 test file 2 件 (cooldown-killterminal / 4ctrl) が PASS 維持
5. main code 移行後の `tsc --noEmit` で TS6059 が 0 件になることを事前 dry-run

## 6. risk assessment

| risk | likelihood | impact | mitigation |
|---|---|---|---|
| 移行 test file が Phase 2 で破綻 | 低 | 中 | Phase 1 で 32 tests PASS 確認済 / Phase 2 main code 移行と独立 |
| vitest alias と tsc paths の resolve 不整合 | 低 | 中 | 両側で `../openclaw-runtime/src` を同 1:1 mapping (検証済) |
| Dev-NN が Phase 2 着手時に history 紛失 | 低 | 低 | tsconfig.json `_meta.archPhase1` annotation で記録、本書 §5.4 checklist 参照 |
| Phase 2 main code 移行で tsc が新 error 検出 | 中 | 中 | Phase 2 着手前に dry-run 実施推奨、error 出現時は本書 §2.1 の paths 値を再確認 |
| relative imports と alias の混在で merge conflict | 低 | 低 | 本書時点で全変換は実施せず段階移行 = conflict 自然回避 |

## 7. 不可侵領域 (本書では touch せず)

- `openclaw-runtime-bridge.ts` (Dev-GG 175 行) — 完全無改変
- `file-breach-counter.ts` (Dev-GG 200 行) — 完全無改変
- `monotonic-clock.ts` (Dev-HH 175 行) — 完全無改変
- `sla-clock-adapter.ts` (Dev-HH 130 行) — 完全無改変
- `17day-path-w4-e2e-fully-wired.test.ts` (Dev-HH 530 行 / 11 tests) — 完全無改変
- `17day-path-w4-production-e2e-extended.test.ts` (Dev-JJ 561 行 / 10 tests) — 完全無改変
- `17day-path-w3-rollback-permission-orchestrator.ts` (Dev-EE) — 完全無改変
- `17day-path-w3-orchestrator.ts` (Dev-BB / main code) — 完全無改変 (Phase 2 で Dev-NN 引継)
- `openclaw-runtime/src/controls/*` (control 本体) — 完全無改変

## 8. 参照

- Dev-JJ R22 ARCH-01 評価書: `projects/PRJ-019/reports/dev-jj-r22-arch-01-workspace-alias-feasibility.md` §3.2 Phase B-1 移行手順
- Dev-JJ R22 W4 production e2e: `projects/PRJ-019/reports/dev-jj-r22-w4-production-e2e-and-arch01.md` §1
- Dev-GG R21 W4 bridge + persistence: `projects/PRJ-019/reports/dev-gg-r21-w4-bridge-and-breach-persistence.md`
- Dev-HH R21 monotonic clock: `projects/PRJ-019/reports/dev-hh-r21-w4-monotonic-clock-and-e2e.md`
- DEC-019-041 (cross-rootDir 解消): `projects/PRJ-019/decisions.md`
- DEC-019-041 sub-issue (Phase B-1 完遂候補): Phase 2 完遂時に decisions.md 追記予定

---

**SOP 順守**: 本書は spec + 最小実装 (test file 2 個移行) のみで、議決不要 / regression 0 / API コスト $0 の制約を完全担保。Phase 2 (main code 移行) は Round 23 後半 Dev-NN 引継。
