# tsconfig Strict Rollout Strategy (ARCH-01)

**Issue**: ARCH-01 / DEC-019-041 W0-Week2 buffer 期必達クローズ
**起案**: 2026-05-03 (Dev 部門 A 担当)
**最終更新**: 2026-05-03

## 背景

PRJ-019 monorepo (`projects/PRJ-019/app/`) は当初、各 workspace (`harness/`, `claude-bridge/`, `openclaw-runtime/`, `web/`, ...) が個別に tsconfig を保有していた。
W0-Week2 着手時点で web/ のみ `noUncheckedIndexedAccess` / `exactOptionalPropertyTypes` / `noImplicitOverride` が有効化されており、harness/ など既存 monorepo パッケージは緩めの strict 設定で運用していた。

このまま放置すると:

1. 同一 monorepo 内で型安全性レベルが drift し、cross-workspace import 時に隠れた null 不安全コードが伝搬する
2. 新規参入する Phase 1 W1 以降の workspace (orchestrator / sandbox / audit / notify) で「どの strict レベルを採用するか」が毎回議論になる
3. CI 全件型チェックの結果が package によって意味が異なる (false negative の温床)

## 統一方針

`tsconfig.base.json` を **唯一の真実の源 (single source of truth)** とし、各 workspace の `tsconfig.json` は extends 参照する形に統一する。

### 強制方針 (`tsconfig.base.json`)

```jsonc
{
  "compilerOptions": {
    // --- 言語レベル ---
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],

    // --- strict 全部 ---
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "useUnknownInCatchVariables": true,

    // --- 追加 strict (本 PRJ で必須化) ---
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,

    // --- module 系 ---
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  }
}
```

### 各フラグの理由

| フラグ | 理由 |
|---|---|
| `noUncheckedIndexedAccess` | 配列/Record アクセスを `T \| undefined` にする。audit_log の hash chain 走査等で「i 番目要素が undefined の可能性」を型レベルで強制し、null pointer バグの予防を行う。 |
| `exactOptionalPropertyTypes` | `{ x?: string }` への `{ x: undefined }` 代入を禁止。HITL request schema や policy schema で `undefined` と「キーなし」を区別する設計を強制する。 |
| `verbatimModuleSyntax` | `import type` / `import` の用途を明示的に区別。tree-shaking と型のみインポートの混在事故を防止 (Next.js 15 + bundler との相性問題回避)。 |
| `noImplicitOverride` | 親クラス method を意図せず override する事故を防止。`RuntimeWrapper` 等のクラス階層で必須。 |
| `useUnknownInCatchVariables` | `catch (e)` の `e` を `any` でなく `unknown` 化。audit log / circuit breaker の error path で型 narrowing を強制。 |

## ロールアウト戦略 (warn → error の段階移行)

既存 package (harness/ / claude-bridge/ / openclaw-runtime/) は前回 W0-Week1 までに緩い strict 設定で実装済み (61+ ケースの単体テスト含む)。
これを一括で `tsconfig.base.json` に切り替えると 100+ 件の型エラーが出るため、**Phase A (warn) → Phase B (error)** の 2 段階で移行する。

### Phase A (warn) — 2026-05-03 〜 Phase 1 W4 末 (~2026-06-20)

- 既存 package は `tsconfig.legacy-relax.json` を extends する。
- `tsconfig.legacy-relax.json` は `tsconfig.base.json` を extends した上で以下を緩和:
  - `verbatimModuleSyntax: false`
  - `exactOptionalPropertyTypes: false`
  - `noUncheckedIndexedAccess: false`
  - `useUnknownInCatchVariables: false`
- 新規 package (web/, 今後の orchestrator/sandbox/audit/notify) は最初から `tsconfig.base.json` を extends する (Phase B 適用)。
- CI: `pnpm typecheck` は緑のまま維持。新規違反は警告として PR レビューで指摘 (人間レビュー、自動 block しない)。

### Phase B (error) — Phase 1 W4 末 〜

- 既存 package を順次 `tsconfig.base.json` extends に切替えていく。
- 違反コードを修正 (or `// @ts-expect-error` + 修正 issue 作成):
  - 配列アクセス → `array[i] ?? defaultValue` か optional chaining
  - `import type` の付与
  - Optional property の値が `undefined` 可能 → 型シグネチャを `T | undefined` に変更 or キーを必須化
- 一切の Phase A 残存があれば PR block (CI で `tsconfig.legacy-relax.json` 参照を grep して fail させる)。
- Phase B 完了をもって `tsconfig.legacy-relax.json` を削除する (deprecation 完了)。

### 進行表

| 日付 | マイルストン | 担当 |
|---|---|---|
| 2026-05-03 | `tsconfig.base.json` 統一 + `tsconfig.legacy-relax.json` 投入 (本コミット) | Dev A |
| 2026-05-09〜05-15 (W0-Week2) | 全既存 package を `tsconfig.legacy-relax.json` extends に統一 (本コミットで完了) | Dev A |
| 2026-05-16〜06-13 (W1〜W3) | Phase A 期間中、新規 package は base 直 extends で参入 | Dev 全員 |
| 2026-06-14〜06-20 (W4) | 既存 package を順次 base extends に移行、違反コード修正 | Dev A 主導 + Review 部門 |
| 2026-06-20 末 | Phase B 完了、`tsconfig.legacy-relax.json` 削除 | Dev A + CI |

## 既存 package が壊れない保証

- 本コミットで `harness/`, `claude-bridge/`, `openclaw-runtime/` の tsconfig は `tsconfig.legacy-relax.json` を経由して `tsconfig.base.json` を間接的に extends する。
- 緩和フラグは既存実装で実際に使用していた前提と同等 (verbatimModuleSyntax=false, exactOptionalPropertyTypes=false, noUncheckedIndexedAccess=false) を維持。
- 既存テスト 61 cases (harness 9 modules) は引き続き通る想定 (実機実行は本タスク範囲外)。

## 検証手順 (Phase A → Phase B 移行時に実施)

```bash
cd projects/PRJ-019/app

# 1. 現状: warn-level
pnpm typecheck    # 緑であること

# 2. 移行候補 package の tsconfig.json で extends を tsconfig.base.json に書換
# 3. 違反箇所が出る:
pnpm --filter @clawbridge/harness typecheck
# > error TS2532: Object is possibly 'undefined'.  (noUncheckedIndexedAccess)
# > error TS1484: 'X' is a type and must be imported using a type-only import. (verbatimModuleSyntax)

# 4. 違反を順次修正
# 5. 該当 package が緑になったら commit
```

## CI 統合 (Phase B 完了時)

`.github/workflows/typecheck.yml` (将来) で以下を追加する:

```yaml
- name: Forbid legacy-relax extends after Phase B
  run: |
    if grep -r "tsconfig.legacy-relax.json" projects/PRJ-019/app/ --include="tsconfig*.json"; then
      echo "ERROR: legacy-relax extends は Phase B 完了後は禁止"
      exit 1
    fi
```

## 参考

- TypeScript 5.7 (本 PRJ の typescript devDep)
- DEC-019-041 (W0-Week2 buffer 期必達クローズ)
- `projects/PRJ-019/app/tsconfig.base.json`
- `projects/PRJ-019/app/tsconfig.legacy-relax.json`
- 各 workspace `tsconfig.json` の `_meta.rolloutPhase` メタフィールド
