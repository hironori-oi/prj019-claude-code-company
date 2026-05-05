# Dev-UU Round 25 — ARCH-01 Phase B-2 feasibility 評価書（composite project references）

- 案件: PRJ-019 Open Claw "Clawbridge"
- 担当: Dev-UU（Round 25, ARCH-01 Phase B-2 feasibility 評価担当）
- 範囲: Phase B-2 = TypeScript composite project references 採用による TS6059 5 件 formal 解消経路の feasibility 評価書（dry-run + risk + fallback）
- 前提:
  - Dev-PP R24 重要発見: paths alias は TypeScript 仕様上 module name resolution のみ alias 化、解決後物理 file の rootDir 検査は実 path で実行 → TS6059 paths alias で解消不可
  - DEC-019-041 status partial-resolved 動議（DEC-019-076 sub-issue close 動議書面 §D）
  - 工数想定 9-11h（Dev-PP R24 提示）= feasibility 3-4h + composite 化 1.5h + references 配線 1.5h + vitest 互換性 1h + supersede 議決自走 + knowledge 4 件別 issue 化 2-3h
- 不可侵: harness 816 PASS / openclaw-runtime 394 PASS / DEC-019-041 + 076 absolute 無改変 / Phase 1 移行済 file (cooldown-killterminal + 4ctrl + orchestrator.ts) absolute 無改変 / W4 historical baseline absolute 無改変 / 4 control 実装 absolute 無改変

## 0. サマリ

| 項目 | 値 |
|---|---|
| Phase B-2 feasibility 判定 | **GO with conditions** |
| 採用経路 | composite project references + paths alias 共存（runtime resolver 経路維持） |
| 物理改変対象 | 2 file（harness/tsconfig.json + openclaw-runtime/tsconfig.json）+ build script 1-2 箇所 |
| TS6059 5 件解消見込 | 高（composite refs は cross-project 違反を formal 許可する仕様） |
| harness 816 PASS regression risk | 低（vitest は composite refs と独立、runtime resolver は alias 経路で完結） |
| openclaw-runtime 394 PASS regression risk | 低（同上、composite 化で runtime 動作は不変） |
| 51 test file regression 0 検証経路 | vitest run 既存経路で完全網羅可能 |
| 工数見積 | 9-11h（Dev-PP R24 提示）= feasibility 3-4h + 物理化 4-5h + 検証 1h + 議決 + knowledge 別 issue 2-3h |
| 主要 risk | 5 件（rootDir + composite 排他 / declaration 必須 / vitest cache drift / build 順序 / pnpm workspaces 二重宣言） |
| fallback | 3 段階（B-2a build script 限定 / B-2b 物理 tsconfig 改変 / B-2c roll-back to paths alias only） |
| Round 26 着手 readiness | Y 条件付（本書面 §10 trigger 4 条件成立時） |

## 1. 背景 + 問題定義

### 1.1 Dev-PP R24 重要発見の本質

Dev-PP Round 24 ARCH-01 Phase 2 production rollout 報告 §3.4 で明示された重要発見:

```
TypeScript paths alias は module name resolution（import 解決）のみ alias 化するが、
解決後の物理 file の物理位置に対する rootDir 制約検査は依然として実 path で実行される。
```

これは TypeScript compiler の仕様（公式 issue #14559 / #25376 系で議論されている既知事項）であり、Phase 1 + Phase 2 で paths alias を完璧に配線しても TS6059 は解消されない。

実証 evidence（Dev-PP R24 §3.4）:
```
src/17day-path-w3-orchestrator.ts(36,8): error TS6059:
  File 'C:/.../openclaw-runtime/src/controls/p-ui-04-kill-switch-propagation.ts'
  is not under 'rootDir' 'C:/.../harness/src'.
```

### 1.2 Phase B-2 の formal 解消経路

TypeScript 仕様で cross-project の rootDir 違反を許可する唯一の formal 経路は **composite project references** = `tsc --build` 経由の incremental build graph で各 project が独立 rootDir を持ち、`references` で参照関係を宣言する mechanism。

公式 reference: https://www.typescriptlang.org/docs/handbook/project-references.html

### 1.3 制約整理

| # | 制約 | 評価への影響 |
|---|---|---|
| C1 | harness 816 PASS 維持 | composite 化で runtime 動作は不変だが build flow 変更の波及検証必要 |
| C2 | openclaw-runtime 394 PASS 維持 | 同上、runtime resolver は alias 経路で独立完結 |
| C3 | DEC-019-041 + 076 absolute 無改変 | 本書面は decisions.md 改変ゼロ |
| C4 | API 追加コスト $0 | Read + 評価書面のみ、外部 API 不使用 |
| C5 | 副作用 0 / 絵文字 0 | 本書面 readiness 100% |
| C6 | fix forward-only | 本書面は dry-run + spec のみ、物理改変は R26+ |

## 2. composite project references vs paths alias 共存 評価

### 2.1 共存可能性 matrix

| 観点 | paths alias 単独（現状） | composite refs 単独 | 共存（推奨） |
|---|---|---|---|
| import resolver（runtime） | OK（vitest resolve.alias 経由） | OK（dist 経由 .js） | OK（両経路有効） |
| TS strict typecheck | NG（TS6059 5 件） | OK（cross-project 許可） | OK（composite が rootDir 緩和） |
| `tsc --noEmit` | TS6059 fire | OK（`--build` 経由） | OK（composite 経路採用） |
| vitest test 実行 | OK | 要 build 先行（dist 必要） | OK（resolve.alias は src 直結維持） |
| HMR / dev cycle | 高速（src 直結） | 低速（build 必要） | 高速（src 直結維持） |
| CI build 時間 | 短（tsc --noEmit） | 中（incremental cache 効果あり） | 中 |
| 開発体験 | 良 | 中（dist 同期意識必要） | 良（runtime は src） |

→ **共存採用 = 開発体験を維持しつつ TS strict layer を formal 解消する最適解**

### 2.2 共存設計 詳細

```
[runtime layer (vitest run / tsx 実行)]
  test file → @clawbridge/openclaw-runtime/* → vitest resolve.alias → ../openclaw-runtime/src/* (TypeScript src 直結、HMR 高速)

[type-check layer (tsc --build)]
  harness tsconfig.json → references: [{ path: "../openclaw-runtime" }] → openclaw-runtime tsconfig.json (composite: true)
  → cross-project rootDir 制約緩和、TS6059 fire 抑止
```

**核心**: vitest は src 直結 alias で動き、TS は composite refs で type-check する。runtime と type-check が **異なる経路** を使うが、source of truth（物理 src file）は同一なので drift しない。

### 2.3 TypeScript 公式仕様の根拠

Project References 公式 doc（https://www.typescriptlang.org/docs/handbook/project-references.html）抜粋要点:

1. `composite: true` を持つ project は他 project から `references` 経由で参照可能。
2. 参照される project の `rootDir` は参照元の `rootDir` に縛られない（cross-project 許可）。
3. `tsc --build` は references graph を辿り、依存関係順に incremental build。
4. `declaration: true` が必須（自動 enforce）= openclaw-runtime は既に NodeNext + verbatimModuleSyntax で declaration 出力 OK。

## 3. harness + openclaw-runtime tsconfig `composite: true` 化 spec

### 3.1 改変対象 file 一覧（dry-run、R26+ で物理化）

| file | 現状 | Phase B-2 後 |
|---|---|---|
| `projects/PRJ-019/app/openclaw-runtime/tsconfig.json` | composite: false | **composite: true** + rootDir 明示 |
| `projects/PRJ-019/app/harness/tsconfig.json` | composite: false | **composite: true**（任意）+ **references** 追加 |
| `projects/PRJ-019/app/tsconfig.base.json` | declaration: true（既設） | 改変不要（base 維持） |
| `projects/PRJ-019/app/tsconfig.legacy-relax.json` | warn 緩和用 | 改変不要 |

### 3.2 openclaw-runtime/tsconfig.json 改変 dry-run

**改変前（line 13-19、現状）**:
```jsonc
{
  "extends": "../tsconfig.legacy-relax.json",
  "compilerOptions": {
    "outDir": "./dist",
    "composite": false,
    "paths": {
      "@clawbridge/harness": ["../harness/src/index.ts"],
      "@clawbridge/harness/*": ["../harness/src/*"]
    }
  },
  ...
}
```

**改変後（B-2 候補）**:
```jsonc
{
  "_meta": {
    "rolloutPhase": "ARCH-01 Phase B-2 (composite project references)",
    "since": "Round 26+ (Dev-UU R25 spec / DEC-019-XYZ 採決後)"
  },
  "extends": "../tsconfig.legacy-relax.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo",
    "paths": {
      "@clawbridge/harness": ["../harness/src/index.ts"],
      "@clawbridge/harness/*": ["../harness/src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "vendor", "upstream", "src/**/__tests__/**", "src/**/*.test.ts"]
}
```

**diff 推定**: +5/-1 行（composite false→true / rootDir 追加 / declaration + declarationMap + tsBuildInfoFile 追加 / _meta annotation）

### 3.3 harness/tsconfig.json 改変 dry-run

**改変前（現状）**:
```jsonc
{
  "extends": "../tsconfig.legacy-relax.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": false,
    "baseUrl": "./src",
    "paths": {
      "@clawbridge/openclaw-runtime/*": ["../../openclaw-runtime/src/*"]
    }
  },
  ...
}
```

**改変後（B-2 候補）**:
```jsonc
{
  "_meta": {
    "rolloutPhase": "ARCH-01 Phase B-2 (composite project references)",
    "since": "Round 26+ (Dev-UU R25 spec / DEC-019-XYZ 採決後)"
  },
  "extends": "../tsconfig.legacy-relax.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo",
    "baseUrl": "./src",
    "paths": {
      "@clawbridge/openclaw-runtime/*": ["../../openclaw-runtime/src/*"]
    }
  },
  "references": [
    { "path": "../openclaw-runtime" }
  ],
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "src/**/__tests__/**", "src/**/*.test.ts"]
}
```

**diff 推定**: +7/-1 行（composite false→true / declaration + declarationMap + tsBuildInfoFile / references block / _meta annotation）

### 3.4 build script 改変 dry-run

`projects/PRJ-019/app/harness/package.json`（現状 line 38）:
```json
"build": "tsc -p tsconfig.json",
```

**改変後（B-2 候補）**:
```json
"build": "tsc --build tsconfig.json",
"typecheck": "tsc --build tsconfig.json --noEmit"
```

`projects/PRJ-019/app/openclaw-runtime/package.json` も同様（composite true package は `tsc -p` ではなく `tsc --build` 経由が公式推奨）。

**diff 推定**: 各 package +1/-1（build script の `-p` → `--build`、typecheck script は `tsc --noEmit` → `tsc --build --noEmit`）

### 3.5 tsBuildInfoFile + dist の `.gitignore` 確認

- `projects/PRJ-019/` 全体が monorepo root の `.gitignore` line 22 で除外済 → tsBuildInfoFile + dist は file system のみ生成 = 副作用 0
- 既存 dist 出力は composite 化前後で互換（NodeNext + .js extension 規約継承）

## 4. references 配線 + `tsc --build` 経路

### 4.1 build graph

```
harness (composite: true, references: [openclaw-runtime])
   │
   ▼ tsc --build resolves dependency
openclaw-runtime (composite: true, references: [harness])  ←逆参照あり（既存）
   │
   ▼ tsc --build detects cycle
```

**重要観察**: 現状 openclaw-runtime/tsconfig.json は paths で `@clawbridge/harness` を参照している。逆方向 references を追加すると **循環依存** が発生する。

### 4.2 循環依存の解消方針 3 案

| 案 | 内容 | trade-off |
|---|---|---|
| 案 X | harness → openclaw-runtime のみ references 配線（逆方向は paths alias のまま） | TS6059 を harness 側のみ解消 / openclaw-runtime 側は元々違反なしのため OK / **採用推奨** |
| 案 Y | 双方向 references（openclaw-runtime → harness も追加） | 循環依存で `tsc --build` fail / **NG** |
| 案 Z | 中間 base package (`@clawbridge/types-shared` 新設) で双方が参照 | 大規模リファクタ、9-11h 工数を超過 / R26+ 別議論 |

→ **案 X 採用推奨**（references は harness → openclaw-runtime の片方向のみ）

### 4.3 案 X 補強根拠

openclaw-runtime/tsconfig.json には paths で `@clawbridge/harness/*` 参照がすでにあるが、**openclaw-runtime/src/** から harness/src/** への実 import は現状ゼロ件想定**（要確認）。これが事実なら逆方向 references は元から不要で、循環依存問題は発生しない。

検証 task（R26 物理化前 30 分以内）:
```bash
cd projects/PRJ-019/app/openclaw-runtime/src
grep -rn "@clawbridge/harness" .
# 期待: 0 件 ヒット
```

万一 hit があれば、composite refs 化前に該当 import を排除（DI 経由 / interface 抽出）して循環解消。

### 4.4 `tsc --build` 経路実行 dry-run

```
$ cd projects/PRJ-019/app/harness
$ npx tsc --build --verbose

[verbose] Projects in this build:
    * ../openclaw-runtime/tsconfig.json
    * ./tsconfig.json

[verbose] Project '../openclaw-runtime/tsconfig.json' is out of date because output file 'dist/.tsbuildinfo' does not exist
[verbose] Building project '../openclaw-runtime/tsconfig.json'...
[verbose] Project '../openclaw-runtime/tsconfig.json' built in NNms

[verbose] Project './tsconfig.json' is out of date because output of its dependency has changed
[verbose] Building project './tsconfig.json'...
[verbose] Project './tsconfig.json' built in NNms
```

**期待**: TS6059 5 件は composite refs の cross-project rootDir 緩和で fire しない = **5/5 解消見込**。

knowledge 系 4 件（TS2698 / TS2322 / TS4104）は composite refs と独立した root cause（spread types / type assignment / readonly modifier 系）= 別 issue 化（本書面 §6）。

## 5. vitest 互換性 + 51 test file regression 0 検証経路

### 5.1 vitest と composite refs の互換性

Vite 系 tools と TypeScript composite refs の相性は実証済（vite + vitest はそれぞれ独立 resolver で source 直結を解決）:

- vitest の resolve.alias は `node:path resolve` で物理 path を直接指定 = TypeScript build graph と独立
- vitest は declaration ファイル（.d.ts）を消費しない、src の .ts を直接 transform して実行
- `--isolate` mode（vitest 2.x default）で test file 単位の cache 隔離あり、composite refs の incremental cache とは別系統

→ **vitest run は composite 化前後で動作不変** が高確率で予測される

### 5.2 51 test file 内訳

`harness/src/__tests__/` 配下の 51 .test.ts file（実測）:
- 17day-path 系: 9 file（W3 5 + W4 4）
- heartbeat / load / longrun: 7 file
- HITL 系: 5 file（kickoff-gate / enforcer / gate + hitl/* sub）
- kill-switch / kill-chain / kill-graceful / kill-subprocess: 4 file
- hardguard 系: 2 file
- gate-12 系: 2 file
- breach-counter: 2 file
- detector-functions: 2 file
- その他（cost-tracker / circuit-breaker / monotonic-clock / multi-process / notify-bridge / openclaw-runtime-bridge / p-ui-10 / process-tree / slack / suppression / time-source / tos-monitor / usage-monitor / watchdog / workflow-yaml 等）: 18 file

= **51 file 合計**（hitl/ + knowledge/ subdirectory も含めると追加 file あり、本評価 §7 で詳述）

### 5.3 regression 0 検証 手順 dry-run

```bash
# Step 1: pre-flight baseline
cd projects/PRJ-019/app/harness
npx vitest run --reporter=default 2>&1 | tail -5
# 期待: Tests 816 passed (816)

cd projects/PRJ-019/app/openclaw-runtime
npx vitest run --reporter=default 2>&1 | tail -5
# 期待: Tests 394 passed (394)

# Step 2: tsconfig 物理改変（§3.2 §3.3）
# Step 3: tsc --build
cd projects/PRJ-019/app/harness
npx tsc --build --verbose 2>&1 | tail -20
# 期待: TS6059 5 件 fire しない、knowledge 系 4 件残存

# Step 4: vitest 完全再走
npx vitest run --reporter=default 2>&1 | tail -5
# 期待: Tests 816 passed (816) 完全一致

cd projects/PRJ-019/app/openclaw-runtime
npx vitest run --reporter=default 2>&1 | tail -5
# 期待: Tests 394 passed (394) 完全一致

# Step 5: W3+W4 smoke test 再走（特定 file 集中検証）
cd projects/PRJ-019/app/harness
npx vitest run \
  src/__tests__/17day-path-w3-3ctrl-orchestrator.test.ts \
  src/__tests__/17day-path-w3-rollback-permission-orchestrator.test.ts \
  src/__tests__/17day-path-w3-e2e-7ctrl.test.ts \
  src/__tests__/17day-path-w3-cooldown-killterminal-orchestrator.test.ts \
  src/__tests__/17day-path-w3-4ctrl-orchestrator.test.ts \
  src/__tests__/17day-path-w4-e2e-fully-wired.test.ts \
  src/__tests__/17day-path-w4-production-e2e-extended.test.ts \
  src/__tests__/17day-path-w4-hitl-gates-integration.test.ts \
  src/__tests__/17day-path-w4-hitl-hardguards-cross.test.ts
# 期待: Tests 95+ passed
```

### 5.4 検証 PASS 判定基準

| ゲート | 判定 |
|---|---|
| Gate 1: harness 816 PASS = post 816 PASS | regression 0 OK |
| Gate 2: openclaw-runtime 394 PASS = post 394 PASS | regression 0 OK |
| Gate 3: TS6059 5 件 → 0 件 | TS strict layer formal 解消 OK |
| Gate 4: knowledge 系 4 件 = post 4 件 | 範囲外、別 issue で対応 |
| Gate 5: W3+W4 smoke 95 tests PASS | historical baseline 完全保護 OK |

5/5 PASS で Phase B-2 完遂判定。

## 6. knowledge 系 4 件 別 issue 化 spec

### 6.1 4 件内訳（Dev-PP R24 §3.3 baseline 一致）

```
src/knowledge/ke-04-audit-wiring.ts(87,53): error TS2698: Spread types may only be created from object types
src/knowledge/yaml-front-matter-parser.ts(252,5): error TS2322: Type ... is not assignable to type ...
src/knowledge/yaml-front-matter-parser.ts(263,7): error TS4104: The type 'readonly ...' is 'readonly' and cannot be assigned to the mutable type ...
src/knowledge/yaml-front-matter-parser.ts(269,5): error TS2322: Type ... is not assignable to type ...
```

### 6.2 4 件は composite refs と独立した root cause

- TS2698: spread types は cross-project 違反ではなく、object spread 構文の type narrowing 問題
- TS2322: type assignment violation（structural typing 違反）
- TS4104: readonly 修飾子の mutable 型への代入

→ Phase B-2 composite refs 化では **解消されない** ことが TypeScript 仕様から明確。

### 6.3 別 issue 起票 spec（KNOW-TS-01〜04）

| issue ID | 対象 file | 対象行 | error | 担当候補 | 想定工数 |
|---|---|---|---|---|---|
| KNOW-TS-01 | ke-04-audit-wiring.ts | 87,53 | TS2698 | Dev-SS R25 | 30 min |
| KNOW-TS-02 | yaml-front-matter-parser.ts | 252,5 | TS2322 | Dev-SS R25 | 30 min |
| KNOW-TS-03 | yaml-front-matter-parser.ts | 263,7 | TS4104 | Dev-SS R25 | 30 min |
| KNOW-TS-04 | yaml-front-matter-parser.ts | 269,5 | TS2322 | Dev-SS R25 | 30 min |
| **計** | - | - | - | - | **2-3h（buffer 含）** |

### 6.4 KNOW-TS-* 解消経路 案

- TS2698（spread）: object spread 対象を `Record<string, unknown>` 等で type narrow → 構造維持で解消
- TS2322 / TS4104（assignment / readonly）: yaml-front-matter-parser の return type を `readonly` 含む immutable type に変更 → caller 側でも readonly 対応化

物理改変は本評価書面の範囲外、Round 25 Dev-SS 担当で別 PR / 別 issue として処理。

## 7. 工数見積 詳細（Dev-PP R24 提示値の精緻化）

### 7.1 段階別工数

| phase | task | 担当候補 | 工数 |
|---|---|---|---|
| **Pre-flight** | 循環依存検証（openclaw-runtime → harness import 0 件確認） | Dev-UU/Dev-VV | 0.5h |
| **Phase B-2 物理化** | openclaw-runtime/tsconfig.json composite 化 | Dev-RR R26 | 0.5h |
| **Phase B-2 物理化** | harness/tsconfig.json composite + references 配線 | Dev-RR R26 | 1h |
| **Phase B-2 物理化** | package.json build script `tsc --build` 化 (2 package) | Dev-RR R26 | 0.5h |
| **検証** | tsc --build 動作確認 + TS6059 5 件 0 化検証 | Dev-RR R26 | 0.5h |
| **検証** | vitest 51 file regression 0 検証 | Dev-RR R26 | 0.5h |
| **検証** | W3+W4 smoke 95 tests 再走 | Dev-RR R26 | 0.25h |
| **議決** | DEC-019-041 supersede 議決起案 + 採決準備 | PM-Q/PM-R R25 | 自走採決 |
| **knowledge** | KNOW-TS-01〜04 別 issue 起票 + 修正 | Dev-SS R25 | 2-3h |
| **feasibility** | 本書面（Dev-UU R25） | Dev-UU R25 | 3-4h |
| **合計** | - | - | **9-11h** |

### 7.2 Dev-PP R24 提示値との照合

| 項目 | Dev-PP R24 | Dev-UU R25 | Δ |
|---|---|---|---|
| feasibility 評価書 | 3-4h（Dev-QQ R25 想定） | 3-4h（Dev-UU R25 実担当） | 0 |
| composite 化 + references | 1.5h+1.5h=3h（Dev-RR R25） | 0.5+1+0.5=2h（Dev-RR R26） | -1h（精緻化で短縮） |
| vitest 互換性検証 | 1h | 0.5+0.5+0.25=1.25h | +0.25h（W3+W4 smoke 追加） |
| pre-flight 循環依存検証 | 未明示 | 0.5h（NEW） | +0.5h |
| 議決自走 | - | - | 0 |
| knowledge 別 issue | 2-3h | 2-3h | 0 |
| **合計** | **9-11h** | **9-11h** | **±0** |

**精緻化結果**: Dev-PP R24 9-11h 見積は本書面で再キャリブレ後も **同範囲内に収束** = 工数妥当。

## 8. risk + mitigation 5 件

### 8.1 risk matrix

| # | risk | likelihood | impact | mitigation |
|---|---|---|---|---|
| R1 | composite: true 化で `rootDir` の自動検査が逆に厳しくなり想定外の cross-project 違反が新規発火 | 中 | 中 | rootDir を `./src` に明示固定（本書面 §3.2 §3.3）+ pre-flight typecheck で baseline 9 件以外の新規 error fire しないことを確認 |
| R2 | declaration: true 必須 + declarationMap で `dist/.tsbuildinfo` 生成 → cache stale で次回 build が古い state を参照 | 中 | 中 | `tsc --build --clean` を初回物理化前に実行 + .tsbuildinfo は `.gitignore` 既設範囲内（`projects/PRJ-019/` 全体除外）で副作用 0 |
| R3 | vitest が composite refs 化後の dist を意図せず resolve してしまい test 実行で stale dist を参照 | 低 | 高 | vitest resolve.alias を src 直結で維持（本書面 §2.2）+ vitest config の include は `src/**/*.test.ts` のため dist は除外 |
| R4 | `tsc --build` が依存順序を誤検出して openclaw-runtime build 後に harness build へ移行する前に fail | 低 | 中 | references を harness → openclaw-runtime 片方向のみで配線（本書面 §4.2 案 X）+ openclaw-runtime → harness 逆 import を pre-flight で 0 件確認（本書面 §4.3） |
| R5 | pnpm-workspace.yaml と TS references の二重宣言が drift（package 追加時に片方更新忘れ） | 低 | 低 | 本書面 §9 で SOP（package 追加時 checklist）追加 + Round 26+ で `pnpm-workspace.yaml` の packages と TS references list を週次 audit |

### 8.2 risk 集計

- 高 likelihood: 0 件
- 中 likelihood: 2 件（R1 R2）→ いずれも mitigation で 低 likelihood に降下可能
- 低 likelihood: 3 件（R3 R4 R5）→ standard 対策で十分
- 高 impact: 1 件（R3）→ low likelihood + 強 mitigation で expected loss 微小

→ **risk 総合評価: 低-中**（Phase B-2 着手の阻害要因なし）

## 9. fallback spec 3 段階

### 9.1 Fallback B-2a: build script 限定改変（最小侵襲）

物理改変を build script のみに留め、tsconfig は無改変でも `tsc --build` の挙動を確認できる。

```diff
# projects/PRJ-019/app/harness/package.json
- "build": "tsc -p tsconfig.json",
+ "build": "tsc --build tsconfig.json",
```

ただし **composite: true がない project に対する `tsc --build` は warning** となるため、形式的には B-2a は B-2 の前段検証用 fallback。完全 fallback としては B-2c へ。

### 9.2 Fallback B-2b: tsconfig 物理改変まで実行 + 問題発生で復元

本書面 §3 spec を物理化した後に Gate 1〜5 のいずれかで FAIL を観測した場合:

```bash
# tsconfig 復元（本書面 §3.2 §3.3 旧値に戻す）
# package.json build script 復元
# tsc --build --clean で .tsbuildinfo + dist 削除
cd projects/PRJ-019/app/harness && npx tsc --build --clean
cd projects/PRJ-019/app/openclaw-runtime && npx tsc --build --clean

# vitest 再走で baseline 復帰確認
cd projects/PRJ-019/app/harness && npx vitest run
cd projects/PRJ-019/app/openclaw-runtime && npx vitest run
```

復旧時間想定: 5-10 分。

### 9.3 Fallback B-2c: paths alias only に完全 roll-back

Phase B-2 全体を諦めて Phase 2 paths alias only state（Round 24 Dev-PP 着地）に完全復帰。

```bash
# tsconfig 全 file を Round 24 Dev-PP 着地値に復元
# DEC-019-041 status を partial-resolved 維持（resolved に到達せず）
# 議決 DEC-019-XYZ supersede を取り下げ
# TS6059 5 件は warn 期間継続（tsconfig.legacy-relax.json で Phase A 状態維持）
```

復旧時間想定: 30 分（議決取り下げ手順含）。

### 9.4 fallback trigger 条件

| trigger | 適用 fallback |
|---|---|
| Gate 1-2 (vitest regression) FAIL 1 件以上 | B-2b（即時復元）|
| Gate 3 (TS6059) post 0 件にならず 1 件以上残存 | B-2b（spec 再検討）|
| Gate 4 (knowledge 4 件) 想定外増加 | B-2b（範囲外なら継続、composite 由来なら B-2b）|
| Gate 5 (W3+W4 smoke 95 tests) FAIL 1 件以上 | B-2b（即時復元）|
| 物理化後 24h 以内に複数 Gate FAIL 連発 | B-2c（完全 roll-back）|

## 10. R26 着手 readiness + trigger 4 条件

### 10.1 R26 着手 trigger

| # | trigger 条件 | R25 時点 status |
|---|---|---|
| T1 | 本 feasibility 書面 GO 判定（GO / GO with conditions / NO-GO） | **本書面で GO with conditions 判定確定** |
| T2 | DEC-019-041 supersede 議決（DEC-019-XYZ）採択 | R25 PM-R 起案待ち（本書面 §10.2） |
| T3 | 循環依存検証（openclaw-runtime → harness import 0 件） | R25 中に Dev-UU/VV で 0.5h で実施可能 |
| T4 | knowledge 系 4 件 別 issue 起票（KNOW-TS-01〜04 創設） | 本書面 §6.3 で spec 完成、R25 Dev-SS 担当 |

→ T1 確定 / T2 R25 中採択見込 / T3 R25 中実施可 / T4 R25 中起票可 = **4/4 satisfied 見込で R26 着手 readiness Y**

### 10.2 supersede 議決連動

DEC-019-041（path alias 経路）→ DEC-019-XYZ（composite refs 経路 / 番号 079 or 080 候補）

詳細は別書面 `dev-uu-r25-dec-041-supersede-statement.md` で起案文として整理。

## 11. 総合判定

### 11.1 Phase B-2 feasibility 判定

**GO with conditions**

GO 根拠:
1. composite project references は TypeScript 公式 mechanism = TS6059 5 件 formal 解消経路
2. paths alias 共存可能 = vitest src 直結 + 開発体験維持
3. risk 5 件すべて低-中 likelihood + 強 mitigation = 阻害要因なし
4. 工数 9-11h は Round 25-26 期間内（5 round 余裕、6/3 Phase 2 W5 着手前完遂可能）
5. fallback 3 段階完備 = 安全網確保
6. knowledge 系 4 件は別 issue で R25 中処理可能 = 範囲分離 OK

conditions:
- C1: 循環依存検証（pre-flight）で openclaw-runtime → harness import 0 件確認
- C2: DEC-019-041 supersede 議決（DEC-019-XYZ）R25 中採択
- C3: knowledge 系 4 件別 issue 起票完遂
- C4: harness 816 PASS / openclaw-runtime 394 PASS の baseline 維持

C1〜C4 すべて R25 中満たす見込 = R26 着手 readiness **Y 条件付**

### 11.2 NO-GO になる条件（参考）

以下のいずれか発生時は本判定を NO-GO に再評価:
- 循環依存検証で openclaw-runtime → harness import 1 件以上 hit
- DEC-019-XYZ 採決で 5/19 統合採決組と矛盾発生
- vitest dry-run で 1 件以上 regression 発生

→ R25 期間中の R26 物理化前 30 分 pre-flight で C1 確認。

### 11.3 Round 25 Dev-UU 結論

Phase B-2 = composite project references 採用は **technically GO**。runtime layer + TS strict layer の formal 同時クローズが達成可能で、DEC-019-041 を resolved 状態に遷移させる formal 経路として合理的。

R26 着手は条件付 GO（4 conditions すべて R25 中 satisfy 見込）。fallback 3 段階完備で risk 管理済。Dev-PP R24 提示値 9-11h は精緻化後も同範囲で工数妥当。

## 12. 制約遵守 status

| 制約 | 遵守 status |
|---|---|
| harness 816 PASS 維持（読み取りのみ、実改変は R26+） | **達成** / 本書面で実改変 0 件 |
| API 追加コスト $0 | **達成** / Read + Edit のみ |
| 副作用 0 | **達成** / file 改変は本書面 1 file のみ（reports 配下） |
| 絵文字 0 | **達成** / 本書面全体絵文字なし |
| DEC-019-041 + 076 absolute 無改変 | **達成** / decisions.md 改変ゼロ |
| Phase 1 移行済 file (cooldown-killterminal + 4ctrl + orchestrator.ts) absolute 無改変 | **達成** / 本書面で touch せず |
| W4 historical baseline files absolute 無改変 | **達成** |
| 4 control 実装 (openclaw-runtime/src/controls/*) absolute 無改変 | **達成** |
| fix forward-only 厳守 | **達成** / 本書面は新規作成 |

## 13. 関連 file 参照

- 本書面（feasibility 評価書）: `projects/PRJ-019/reports/dev-uu-r25-phase-b-2-feasibility.md`
- 姉妹: `projects/PRJ-019/reports/dev-uu-r25-dec-041-supersede-statement.md`（DEC-019-041 supersede 議決起案文）
- 姉妹: `projects/PRJ-019/reports/dev-uu-r25-summary.md`（Round 25 Dev 総括）
- 前提: `projects/PRJ-019/reports/dev-pp-r24-arch-01-phase2-main-code-migrate.md`（Round 24 重要発見）
- 前提: `projects/PRJ-019/reports/ceo-v25-round24-9parallel-completion.md`（Round 24 完遂着地）
- 対象 file（読み取りのみ）: `projects/PRJ-019/app/harness/tsconfig.json`
- 対象 file（読み取りのみ）: `projects/PRJ-019/app/openclaw-runtime/tsconfig.json`
- 対象 file（読み取りのみ）: `projects/PRJ-019/app/harness/vitest.config.ts`
- 対象 file（読み取りのみ）: `projects/PRJ-019/app/tsconfig.base.json`
- 対象 file（読み取りのみ）: `projects/PRJ-019/app/tsconfig.legacy-relax.json`
- 対象 file（読み取りのみ）: `projects/PRJ-019/app/pnpm-workspace.yaml`
- 議決参照（読み取りのみ）: `projects/PRJ-019/decisions.md` line 1234-1342（DEC-019-076 sub-issue close 動議）

---

**SOP 順守**: 本書面は Round 25 Phase B-2 feasibility 評価記録のみ。物理改変は R26+ Dev-RR 担当で実行、本書面範囲では tsconfig + package.json + vitest config いずれも touch せず。harness 816 PASS / openclaw-runtime 394 PASS の baseline は本書面実施期間中も完全維持（Read のみ実行）。DEC-019-041 + 076 absolute 無改変、本書面は append-only ではなく独立新規 file（feasibility 評価書面として reports/ 配下に新規追加）。
