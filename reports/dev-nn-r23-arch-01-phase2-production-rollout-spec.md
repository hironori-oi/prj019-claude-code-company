# Dev-NN Round 23 — ARCH-01 Phase 2 production rollout 実行設計（案 A 物理 migrate）

- 案件: PRJ-019 Open Claw "Clawbridge"
- 担当: Dev-NN（Round 23, W4 完成第 2 弾 task ①）
- 範囲: ARCH-01（DEC-019-041 Phase B）= harness → openclaw-runtime cross-rootDir 違反 9 件解消（うち本件対象 6 件 + knowledge 系 3 件は別 issue）
- 前提: Dev-JJ R22 326 行評価書（`dev-jj-r22-arch-01-workspace-alias-feasibility.md`）案 A = tsconfig path alias を採用、移行コスト 2.5h / 副作用 0 想定 / regression 0 目標
- 不可侵: 本書は Round 23 の **実行設計のみ**。実物理 migrate は Round 24 想定（Round 23 終端で readiness 判定 GO if ready）。既存 tsconfig.json / Dev-JJ R22 spec は absolute 無改変
- 関連: DEC-019-041 / DEC-019-074 ④ / DEC-019-076 候補（PM-P 起案 = ARCH-01 解消 + DEC-019-041 Phase B 必達クローズ宣言）

## 0. サマリ

| 項目 | 値 |
|---|---|
| Phase 2 目標 | harness/tsconfig.json に paths 追加 + 6 import 文 alias 化 + vitest.config.ts resolve.alias 同期 + regression 0 確認 |
| 採用案 | 案 A = tsconfig path alias（Dev-JJ R22 推奨経路、議決不要、技術施策） |
| 想定実行時間 | 2.5h（Dev-JJ R22 見積もり踏襲、step 詳細化で誤差 ±15 分） |
| 影響 file 数 | 3 file 変更（harness/tsconfig.json / harness/src/17day-path-w3-orchestrator.ts / harness/vitest.config.ts） |
| 推定 LOC | +3 / -0（tsconfig paths 1 行追加 + vitest resolve.alias 3 行追加 + import 文 6 行 in-place 書換、改行差分換算） |
| regression 想定 | harness 795 PASS + openclaw-runtime 394 PASS = 1189 累計 / Phase 2 完遂後も 1189 PASS 維持（差分 0 が GO 条件） |
| rollback 経路 | git revert 1 コミットで relative imports 即時復元（branch 戦略 + revert sentinel あり） |
| readiness 判定 | GO with conditions（Round 24 着手前に CEO 承認 + harness 物理 baseline tag 取得） |

## 1. step-by-step 実行計画（12 step）

### Step 1: pre-flight verification（実行前 baseline 固定）— 想定 10 分

```bash
cd C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app
pnpm install --frozen-lockfile
pnpm --filter @clawbridge/harness exec vitest run --reporter=verbose 2>&1 | tee /tmp/harness-pre-r24.log
pnpm --filter @clawbridge/openclaw-runtime exec vitest run --reporter=verbose 2>&1 | tee /tmp/openclaw-pre-r24.log
```

- 期待値: harness 795 PASS / openclaw-runtime 394 PASS / 0 FAIL
- 失敗時: Round 22 着地と乖離 = 即 abort、Dev-JJ R22 評価の前提崩れ（先に regression 原因調査）
- log は Round 24 commit message に baseline 引用元として埋込

### Step 2: branch + sentinel commit 作成 — 想定 5 分

```bash
git checkout -b feat/arch-01-phase-2-path-alias-migrate
git commit --allow-empty -m "chore(arch-01): rollout sentinel commit for path alias migrate (revertable)"
```

- sentinel commit の SHA を記録（rollback 時に `git revert <sentinel..HEAD>` の起点）
- 本作業の全 commit は本 branch に閉じ、main への merge は readiness 判定 GO 後

### Step 3: harness/tsconfig.json に paths 追加 — 想定 5 分

```jsonc
// projects/PRJ-019/app/harness/tsconfig.json (Round 24 で +3 行追加想定)
{
  "_meta": { ... 既存維持 ... },
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

- 追加は `paths` フィールドのみ。openclaw-runtime/tsconfig.json 既存 paths（`@clawbridge/harness/*`）と対称構造で命名統一
- `baseUrl` は extends 元の tsconfig.legacy-relax.json で定義済（or `.` fallback）= 別途指定不要を Round 23 末に Dev-NN が事前確認

### Step 4: vitest.config.ts に resolve.alias 同期 — 想定 10 分

```ts
// projects/PRJ-019/app/harness/vitest.config.ts (Round 24 で resolve.alias 追加)
import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@clawbridge/openclaw-runtime': resolve(__dirname, '../openclaw-runtime/src'),
    },
  },
  test: {
    testTimeout: 15_000,
    hookTimeout: 15_000,
    include: ['src/**/*.test.ts'],
  },
})
```

- vitest は tsconfig paths を **直接読まない**（`vite-tsconfig-paths` plugin 不採用方針継続）= resolve.alias で **二重定義** が必要
- prefix match のみ記述（末尾 `/*` は不要 = vite resolve.alias は prefix match）
- 二重定義の整合性は Round 24 step 11 で sanity check（後述）

### Step 5: 既存 import 文 6 件を alias 経由に書換 — 想定 15 分

対象 file: `projects/PRJ-019/app/harness/src/17day-path-w3-orchestrator.ts`

```diff
- } from '../../openclaw-runtime/src/controls/p-ui-04-kill-switch-propagation.js'
+ } from '@clawbridge/openclaw-runtime/controls/p-ui-04-kill-switch-propagation.js'

- import type { PostRollbackNotifier } from '../../openclaw-runtime/src/controls/p-ui-05-anomaly-rollback.js'
+ import type { PostRollbackNotifier } from '@clawbridge/openclaw-runtime/controls/p-ui-05-anomaly-rollback.js'

- } from '../../openclaw-runtime/src/controls/p-ui-09-rls-checklist.js'
+ } from '@clawbridge/openclaw-runtime/controls/p-ui-09-rls-checklist.js'

- import type { PermissionAuditSink } from '../../openclaw-runtime/src/controls/hitl-10-permission-change.js'
+ import type { PermissionAuditSink } from '@clawbridge/openclaw-runtime/controls/hitl-10-permission-change.js'

- } from '../../openclaw-runtime/src/controls/p-ui-02-cooldown-modal.js'
+ } from '@clawbridge/openclaw-runtime/controls/p-ui-02-cooldown-modal.js'

- } from '../../openclaw-runtime/src/controls/p-ui-04-kill-switch-propagation.js'  (158 行付近 2 件目)
+ } from '@clawbridge/openclaw-runtime/controls/p-ui-04-kill-switch-propagation.js'
```

- 6 行 in-place 書換 / file 全体は 600+ 行想定で diff は 12 行（- + ペア）
- import statement 順序 / 識別子 / type-only marker は無改変
- `.js` 拡張子は NodeNext + verbatimModuleSyntax 規約により維持必須

### Step 6: typecheck（ARCH-01 違反消失確認）— 想定 5 分

```bash
cd projects/PRJ-019/app/harness
pnpm exec tsc --noEmit 2>&1 | tee /tmp/harness-typecheck-r24.log
```

- 期待差分: TS6059 / TS2307 系 9 件 → 6 件解消（残 3 件は knowledge 系 = 別 root cause で別 issue 化）
- diff コマンド: `diff <(grep -E "TS(6059|2307|2691)" /tmp/harness-typecheck-pre-r24.log) <(grep -E "TS(6059|2307|2691)" /tmp/harness-typecheck-r24.log)`
- knowledge 系 3 件残存は **本 step では許容**（DEC-019-041 ARCH-01 は本件 6 件で完結、knowledge 系は別 ticket で Round 25 以降）

### Step 7: vitest run（regression 0 確認）— 想定 10 分

```bash
pnpm --filter @clawbridge/harness exec vitest run 2>&1 | tee /tmp/harness-post-r24.log
pnpm --filter @clawbridge/openclaw-runtime exec vitest run 2>&1 | tee /tmp/openclaw-post-r24.log
```

- 期待値: harness 795 PASS / openclaw-runtime 394 PASS / 0 FAIL（差分 0）
- 差分検証: `diff /tmp/harness-pre-r24.log /tmp/harness-post-r24.log | head -50`（PASS 件数行のみ抽出推奨）
- 1 件でも FAIL → step 10 rollback 即時実行（部分 PASS 妥協なし）

### Step 8: lint + format — 想定 5 分

```bash
pnpm --filter @clawbridge/harness exec eslint src/17day-path-w3-orchestrator.ts
pnpm --filter @clawbridge/harness exec prettier --check src/17day-path-w3-orchestrator.ts
```

- 期待値: 0 error / 0 warning
- alias 化で import 順序が import/order rule に違反しないか sanity check（一般に第三者 path → relative の順、本件は alias = 第三者扱い昇格 = 順序維持で OK 想定）

### Step 9: smoke test（実走）— 想定 10 分

```bash
cd projects/PRJ-019/app/harness
pnpm exec vitest run src/__tests__/17day-path-w3-orchestrator.test.ts --reporter=verbose 2>&1 | tail -40
```

- W3 orchestrator 関連 tests のみ単独実行（影響対象 file の専用 suite）
- 期待値: 全 PASS / 0 skip / 0 todo
- 個別 test file 単独で alias 解決を vitest が完了することを確認（regression suite と独立に二重確認）

### Step 10: rollback 経路 dry-run（実行はしないが検証）— 想定 5 分

- sentinel commit から HEAD までの commit を `git log --oneline <sentinel>..HEAD` で確認
- `git revert --no-commit <sentinel>..HEAD; git status` で revert plan を **dry-run 表示のみ**（実 revert はしない）
- 確認後 `git reset --hard HEAD` で dry-run state を破棄
- 本 step は Round 24 実行直前に必須 = rollback 信頼性の事前確証

### Step 11: 二重定義整合性 sanity check — 想定 5 分

- tsconfig paths と vitest resolve.alias が同一物理 path を指すことを script で確認

```bash
# 期待: 両者とも projects/PRJ-019/app/openclaw-runtime/src を指す
node -e "
  const ts = require('./harness/tsconfig.json');
  const vc = require('./harness/vitest.config.ts');  // ESM の場合は別途 import 経由
  console.log('tsconfig:', ts.compilerOptions.paths['@clawbridge/openclaw-runtime/*']);
  console.log('vitest  :', vc.default.resolve.alias['@clawbridge/openclaw-runtime']);
"
```

- 不整合検出 → step 6-7 で全 PASS でも future regression risk あり = Round 24 末に必ず実施
- vitest config は ESM のため import 経由読込が必要、Round 24 で実行可能 form に詳細化

### Step 12: commit + push — 想定 5 分

```bash
git add projects/PRJ-019/app/harness/tsconfig.json
git add projects/PRJ-019/app/harness/vitest.config.ts
git add projects/PRJ-019/app/harness/src/17day-path-w3-orchestrator.ts
git commit -m "feat(arch-01): migrate harness imports to @clawbridge/openclaw-runtime alias

- Add path alias in harness/tsconfig.json (matches openclaw-runtime symmetry)
- Sync vitest.config.ts resolve.alias for runtime resolution
- Replace 6 relative imports in 17day-path-w3-orchestrator.ts
- Closes DEC-019-041 Phase B for ARCH-01 cross-rootDir violations (6/9 cases)
- Knowledge subsystem 3 cases remain as separate issue (different root cause)

baseline: harness 795 PASS / openclaw-runtime 394 PASS / 0 FAIL
post-migrate: harness 795 PASS / openclaw-runtime 394 PASS / 0 FAIL (regression 0)

Refs: DEC-019-041, DEC-019-074-④, Dev-JJ R22 feasibility report"

git push origin feat/arch-01-phase-2-path-alias-migrate
```

- commit message に baseline / post-migrate 両 PASS 件数を埋込（後続 audit trail）
- main merge 前に Review-O / Review-N の事前合意 gate（DEC-074 V-4 evidence 化）

## 2. 影響範囲詳細

### 2.1 file 単位

| file | 変更種別 | 行数 |
|---|---|---|
| `projects/PRJ-019/app/harness/tsconfig.json` | paths 追加 | +3 / -0 |
| `projects/PRJ-019/app/harness/vitest.config.ts` | resolve.alias 追加 | +6 / -0 |
| `projects/PRJ-019/app/harness/src/17day-path-w3-orchestrator.ts` | import 6 行書換 | +6 / -6 |
| **合計** | 3 file | +15 / -6（実質 net +9 行） |

### 2.2 推定 LOC

- 純粋追加: 9 行（tsconfig paths 3 + vitest resolve.alias 6）
- in-place 書換: 6 行（import 文）
- code logic 変更: 0 行（純粋 path 文字列の置換、振る舞いは bit-identical）

### 2.3 regression 想定

| layer | baseline | 想定 post-migrate | 差分許容 |
|---|---|---|---|
| harness vitest | 795 PASS | 795 PASS | 0（厳格） |
| openclaw-runtime vitest | 394 PASS | 394 PASS | 0（厳格） |
| harness typecheck（ARCH-01 violations） | 9 件 | 3 件（knowledge 系のみ残） | -6（解消） |
| harness lint | 0 error | 0 error | 0（厳格） |
| total tests | 1189 PASS | 1189 PASS | 0（厳格） |

### 2.4 副作用想定

- production runtime: dist 未 build 方針（Phase 1 W4）= 影響 0
- CI: tsconfig.legacy-relax.json Phase A（warn）期間中、本変更で warn 6 件減 = CI block なし
- pnpm install: package.json 未変更 = node_modules / pnpm-lock.yaml への影響 0
- IDE（VSCode TS server）: paths 認識まで 1 回再起動推奨（Round 24 開発者 note）

## 3. rollback 経路（path alias 失敗時の relative imports 復元手順）

### 3.1 rollback trigger 条件

以下いずれか 1 つでも該当時、即時 rollback：

1. step 7 で harness vitest が 1 件でも FAIL（795 → 794 以下）
2. step 7 で openclaw-runtime vitest が 1 件でも FAIL（394 → 393 以下）
3. step 6 で TS6059 / TS2307 が **増加**（pre-baseline 9 件 → 10 件以上、新規 error 派生）
4. step 8 で lint error 1 件でも発生（pre-baseline 0 → 1 以上）
5. step 9 で smoke test の W3 orchestrator suite が PASS 維持できない

### 3.2 rollback step（fail-safe 想定 5 分以内）

```bash
# Round 24 作業中（commit 前）に失敗した場合
git checkout -- projects/PRJ-019/app/harness/tsconfig.json
git checkout -- projects/PRJ-019/app/harness/vitest.config.ts
git checkout -- projects/PRJ-019/app/harness/src/17day-path-w3-orchestrator.ts

# Round 24 commit 後に失敗した場合（push 前）
git reset --hard <sentinel-sha>

# Round 24 push 後 / Round 25 で発覚した場合
git revert --no-edit <feat-commit-sha>
git push origin feat/arch-01-phase-2-path-alias-migrate
# main 未 merge 状態なら branch 削除のみで OK
```

### 3.3 rollback 後の安定状態確認

```bash
pnpm --filter @clawbridge/harness exec vitest run | tail -5
pnpm --filter @clawbridge/openclaw-runtime exec vitest run | tail -5
pnpm --filter @clawbridge/harness exec tsc --noEmit | grep -cE "TS(6059|2307)"
```

- 期待: harness 795 PASS / openclaw-runtime 394 PASS / TS error 9 件（baseline）
- 確認 OK で rollback 完遂、Round 25 で root cause 再分析後に Phase B-1 再挑戦

### 3.4 rollback 後の DEC-019-041 状態

- Phase B クローズ判定は **HOLD**（rollback 発生時）
- DEC-019-076 候補（PM-P 起案 = ARCH-01 解消宣言）も **HOLD**
- relative imports fallback pattern を継続維持（DEC-019-041 確立済規約に沿う）
- Round 25 で Phase B-2 候補（pnpm workspaces 完全活用）への前倒し検討

## 4. Round 24 実行 readiness 前提条件

| 条件 | 状態 | 充足 |
|---|---|---|
| Dev-JJ R22 評価書（326 行 / 案 A 推奨）存在 | 確認済 | OK |
| Round 22 baseline（harness 795 / openclaw 394）固定 | 確認済 | OK |
| harness/openclaw-runtime/tsconfig.json 構造既知 | 確認済 | OK |
| Round 23 で本書 + DEC-041 closure prep + regression strategy 完成 | Round 23 内 | 進行中 |
| CEO 承認（Round 24 実行 GO 判定） | Round 23 着地時 | 待機 |
| Review-N / Review-O 事前合意（DEC-074 V-4 evidence 化） | Round 24 着手前 | 待機 |
| sentinel commit 用 branch 戦略確立 | 本書 §1 step 2 | OK |

## 5. Phase 2 完遂後の波及

### 5.1 DEC-019-041 Phase B クローズ条件

- harness の cross-rootDir 違反 6 件解消（knowledge 系 3 件は別 issue）
- regression 0（1189 PASS 維持）
- 本書 step 12 commit が main に merge

→ 上記 3 条件 AND 達成時に DEC-019-041 status: confirmed → resolved 遷移可能（DEC-019-076 候補で formal 化）

### 5.2 Phase 2（claude-bridge / orchestrator / sandbox）への波及

- 案 A は **harness 単独** の局所修正 = 他 workspace への波及 0
- ただし Round 25-27 で `tsconfig.base.json` への paths 集約 task を別途起票推奨（Dev-JJ R22 §5.1）
- claude-bridge / orchestrator 着手時に同 alias pattern を踏襲 = monorepo 統一性維持

### 5.3 案 B（pnpm workspaces 正規化）への移行 path

- 本 Phase 2 完遂後も relative imports は完全廃止せず alias と共存可能
- Phase 2 着手前（Round 25 想定）に DEC で「依存方向反転承認」議決 → 案 B 移行
- 本書 §3 rollback 不要のまま、案 B は **追加** 移行として扱える

## 6. risk assessment

| risk | likelihood | impact | mitigation |
|---|---|---|---|
| vitest が tsconfig paths を解決せず resolve.alias 不整合 | 低 | 中 | step 11 二重定義 sanity check、step 7 で即検出 |
| import 文書換 6 件中 1 件で識別子 typo | 低 | 中 | step 6 typecheck で TS2305（identifier not found）即検出 |
| .js 拡張子の付け忘れで NodeNext 解決失敗 | 低 | 中 | step 8 lint + step 7 vitest でカバレッジ重複検証 |
| baseline 795 / 394 が Round 23-24 間で変動 | 中 | 低 | step 1 で再 baseline 取得、commit message に最新値を埋込 |
| knowledge 系 3 件 TS error が別 root cause で連鎖発火 | 中 | 低 | 本 Phase 2 範囲外として明示分離、Round 25 以降 別 issue |
| sentinel commit 紛失 / branch 切替ミス | 低 | 高 | step 2 で SHA を log 保存 + step 10 dry-run で検証 |
| IDE TS server cache が古い paths を保持 | 中 | 低 | Round 24 開発者向け note: VSCode 再起動推奨を commit message に明記 |

## 7. 結論 + Round 24 着手要件

### 7.1 Phase 2 readiness 判定

**GO with conditions**

- Dev-JJ R22 評価書の三択評価が成熟（案 A 推奨確証）
- baseline 1189 PASS の安定確証（Round 22 着地時点）
- 12 step 詳細化 + rollback 経路 5 分以内 + risk matrix 完備
- 必要条件: (1) CEO 承認（Round 23 着地時）+ (2) Review 部門事前合意 + (3) Round 24 着手前の baseline 再取得

### 7.2 Round 24 着手 trigger（4 条件 AND）

1. CEO 形式承認（本書 + Dev-NN R23 summary 受領後）
2. Round 22 着地値（harness 795 / openclaw 394）が Round 23 末まで維持されていること（再 sanity check）
3. main 同期済（merge conflict ゼロ）
4. sentinel commit 戦略 + rollback dry-run 経路の commit ready

### 7.3 想定 Round 24 完遂時の評価軸

- harness 795 PASS / openclaw-runtime 394 PASS 完全維持
- TS6059 / TS2307 系 違反 6 件解消（baseline 9 → 残 3 件）
- DEC-019-041 status: confirmed → resolved（または DEC-019-076 で formal クローズ）
- W4 完成第 2 弾の ARCH-01 完遂宣言（Round 24 PM 報告に同梱）

## 8. 関連 file 参照

- `projects/PRJ-019/reports/dev-jj-r22-arch-01-workspace-alias-feasibility.md`（前提評価書 326 行）
- `projects/PRJ-019/app/harness/tsconfig.json`（Round 24 で paths 追加対象）
- `projects/PRJ-019/app/harness/vitest.config.ts`（Round 24 で resolve.alias 追加対象）
- `projects/PRJ-019/app/harness/src/17day-path-w3-orchestrator.ts`（Round 24 で 6 import 文書換対象）/ `projects/PRJ-019/app/openclaw-runtime/tsconfig.json`（逆方向 alias 既存実装 = pattern source）/ `tsconfig.base.json` / `tsconfig.legacy-relax.json`（strict 設定基盤）
- `projects/PRJ-019/decisions.md` DEC-019-041 / DEC-019-074 ④ / DEC-019-076 候補
- `projects/PRJ-019/reports/dev-nn-r23-dec-041-phase-b-closure-prep.md`（本書姉妹報告）
- `projects/PRJ-019/reports/dev-nn-r23-arch-01-regression-test-strategy.md`（本書姉妹報告）

---

**SOP 順守**: 本書は Round 23 実行設計のみ（実物理 migrate は Round 24 想定）。Dev-JJ R22 評価書は absolute 無改変。relative imports fallback pattern は Round 24 完遂まで維持。
