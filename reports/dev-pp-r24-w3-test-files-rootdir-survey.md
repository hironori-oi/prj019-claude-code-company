# Dev-PP Round 24 — W3 test files cross-rootDir 残存洗い出し + 段階移行判断

- 案件: PRJ-019 Open Claw "Clawbridge"
- 担当: Dev-PP（Round 24, 第 1 波第 3 列, task ②）
- 範囲: harness/src/__tests__/ 配下の全 test file（51 件）に対する cross-rootDir relative import 残存件数調査 + alias 化未済の優先度（high/mid/low）+ 移行コスト + Round 25 引継推奨件数判定
- 前提: Dev-NN R23 spec 必達条件 4（残 W3 test file の cross-rootDir 洗い出し + 段階移行判断）
- 不可侵: 既存 test files absolute 無改変（本書は調査のみ、実 migration は実施せず）

## 0. サマリ

| 項目 | 値 |
|---|---|
| 調査対象 | harness/src/__tests__/ 全 test file = **51 件** |
| `from '../../../openclaw-runtime/...'` 残存 import 文 | **0 件** |
| `from '@clawbridge/openclaw-runtime/...'` alias 化済 import 文 | **6 件**（Phase 1 で migrate 済 2 file） |
| 移行未済 high priority file | **0 件** |
| 移行未済 mid priority file | **0 件** |
| 移行未済 low priority file | **0 件** |
| Round 25 引継推奨件数 | **0 件**（本層は完了状態） |
| 結論 | **W3 test layer は alias 化完了 / cross-rootDir 残存 0 / Phase B (test layer) クローズ可能** |

## 1. 調査方法

### 1.1 grep pattern

```bash
# Pattern A: relative cross-rootDir imports（残存検出）
grep -rnE "from ['\"]\.\.[\\\/]\.\.[\\\/]\.\.[\\\/]openclaw-runtime[\\\/]src" harness/src/__tests__/

# Pattern B: alias 化済 imports（既 migrate 確認）
grep -rnE "from ['\"]@clawbridge/openclaw-runtime/" harness/src/__tests__/

# Pattern C: comment 内参照（誤検出排除用）
grep -rn "openclaw-runtime/src/controls" harness/src/__tests__/
```

### 1.2 検出方針

- import statement のみカウント（comment block / docstring 内記述は誤検出排除）
- `.ts` / `.tsx` / `.js` 全拡張子対象
- 第三者依存（`@clawbridge/*` package 指定）と相対 path（`../*`）を区別

## 2. 調査結果

### 2.1 全 51 test file の overview

| file | size | imports | cross-rootDir status |
|---|---|---|---|
| 17day-path-w3-3ctrl-orchestrator.test.ts | mid | local-only | clean |
| 17day-path-w3-rollback-permission-orchestrator.test.ts | mid | local-only | clean |
| 17day-path-w3-e2e-7ctrl.test.ts | large | local-only | clean |
| **17day-path-w3-cooldown-killterminal-orchestrator.test.ts** | mid | **alias ×2** | **migrated（Phase 1）** |
| **17day-path-w3-4ctrl-orchestrator.test.ts** | large | **alias ×4** | **migrated（Phase 1）** |
| 17day-path-w4-e2e-fully-wired.test.ts | large | local-only | clean（historical baseline） |
| 17day-path-w4-production-e2e-extended.test.ts | large | local-only | clean（Dev-JJ R22 baseline） |
| 17day-path-w4-hitl-gates-integration.test.ts | mid | local-only | clean |
| heartbeat-load-{50k,100k,500k,1m,1m-10digit,continuous-run-detector-10digit}.test.ts | large×6 | local-only | clean |
| heartbeat-1m-10digit-longrun-stability.test.ts | large | local-only | clean |
| heartbeat-gap-primitive.test.ts | mid | local-only | clean |
| file-breach-counter{,-stress-chaos}.test.ts | mid×2 | local-only | clean |
| monotonic-clock.test.ts | mid | local-only | clean |
| openclaw-runtime-bridge.test.ts | mid | local-only | clean |
| kill-switch{,-graceful-options,-subprocess-wiring}.test.ts | mid×3 | local-only | clean |
| kill-chain.test.ts | mid | local-only | clean |
| process-tree-kill.test.ts | small | local-only | clean |
| hitl-gate.test.ts / hitl-enforcer.test.ts / hitl-kickoff-gate.test.ts | mid×3 | local-only | clean |
| circuit-breaker.test.ts / cost-tracker.test.ts / usage-monitor.test.ts | mid×3 | local-only | clean |
| ban-drill.test.ts / suppression-primitives.test.ts / multi-process-isolation.test.ts | small/mid×3 | local-only | clean |
| time-source.test.ts / clock-skew-boot-evaluation.test.ts | mid×2 | local-only | clean |
| workflow-yaml.test.ts | small | local-only | clean |
| watchdog.test.ts | mid | local-only | clean |
| tos-monitor{,-refactor}.test.ts | mid×2 | local-only | clean |
| slack-quick-action.test.ts | mid | local-only | clean |
| notify-bridge{,-retry}.test.ts | mid×2 | local-only | clean |
| detector-functions{,-zscore}.test.ts | mid×2 | local-only | clean |
| gate-12-{cli-version-update,audit-fire}.test.ts | mid×2 | local-only | clean |
| hardguard-g-{02,10}.test.ts | mid×2 | local-only | clean |
| p-ui-10-pentest-scheduler.test.ts | mid | local-only | clean |
| **合計** | **51 file** | - | **0 残存 / 2 migrated / 49 clean** |

### 2.2 grep 結果（Pattern A = 残存）

```
$ grep -rnE "from ['\"]\.\.[\\\/]\.\.[\\\/]\.\.[\\\/]openclaw-runtime[\\\/]src" harness/src/__tests__/
（出力なし）
```

→ **51 file 全件で cross-rootDir relative imports は 0 件**。

### 2.3 grep 結果（Pattern B = alias 化済）

```
$ grep -lE "from ['\"]@clawbridge/openclaw-runtime/" harness/src/__tests__/
harness/src/__tests__/17day-path-w3-4ctrl-orchestrator.test.ts
harness/src/__tests__/17day-path-w3-cooldown-killterminal-orchestrator.test.ts
```

→ Phase 1 で migrate された 2 file のみ。各 4 + 2 = 計 6 imports。

### 2.4 grep 結果（Pattern C = comment 内参照、誤検出排除）

```
$ grep -rn "openclaw-runtime/src/controls" harness/src/__tests__/
17day-path-w4-hitl-gates-integration.test.ts:33: *   - control 本体 (openclaw-runtime/src/controls/*) 無改変
17day-path-w3-4ctrl-orchestrator.test.ts:20: * Spec source: ../../../openclaw-runtime/src/controls/__tests__/17day-path-w2-4ctrl.test.ts
17day-path-w3-4ctrl-orchestrator.test.ts:26:// 旧 `../../../openclaw-runtime/src/controls/...` → 新 `@clawbridge/openclaw-runtime/controls/...`.
17day-path-w3-cooldown-killterminal-orchestrator.test.ts:43:// 旧 `../../../openclaw-runtime/src/controls/...` (cross-rootDir relative imports) →
17day-path-w4-production-e2e-extended.test.ts:20: *   - control 本体 (openclaw-runtime/src/controls/*) 無改変
```

→ comment / docstring 内記述のみ（5 件すべて非 import）= 誤検出排除確認。

## 3. 段階移行判断（high/mid/low priority）

### 3.1 priority matrix

| priority | 定義 | 該当件数 |
|---|---|---|
| **high** | 残存 cross-rootDir imports + W3/W4 critical path | **0 件** |
| **mid** | 残存 cross-rootDir imports + 副次 path | **0 件** |
| **low** | comment / docstring 内参照のみ（移行不要） | 5 件（移行対象外） |

### 3.2 historical baseline 保護対象

Phase 1 spec で明示された **absolute 無改変 file**:

| file | 担当 / Round | 移行判断 |
|---|---|---|
| `17day-path-w4-e2e-fully-wired.test.ts` | Dev-HH R21（530 行 / 11 tests） | **完全無改変**（historical baseline） |
| `17day-path-w4-production-e2e-extended.test.ts` | Dev-JJ R22（561 行 / 10 tests） | **完全無改変**（Dev-JJ R22 baseline） |

両 file とも cross-rootDir imports は 0 件（local-only）= 移行候補にも該当しない。

### 3.3 Phase 1 で migrate 済 file

| file | 担当 / Round | 移行 imports | tests |
|---|---|---|---|
| `17day-path-w3-cooldown-killterminal-orchestrator.test.ts` | Dev-MM R23 Phase 1 | 2 | 13 PASS |
| `17day-path-w3-4ctrl-orchestrator.test.ts` | Dev-MM R23 Phase 1 | 4 | 19 PASS |

→ Round 24 Phase 2 では **追加変更不要**（resolver 動作確認済 32/32 PASS 維持）。

## 4. 移行コスト試算

### 4.1 個別 file 移行コスト

調査結果より移行対象 file = **0 件** = 移行コスト = **0 時間**。

### 4.2 仮想シナリオ: 将来新規 test file 作成時のコスト

新規 test file が `openclaw-runtime/src/controls/*` を import する場合:

| シナリオ | 推奨 path | 工数 |
|---|---|---|
| import 1 件追加 | `from '@clawbridge/openclaw-runtime/controls/...'` 直接記述 | 1 分 |
| 既存 test file への新規 import 追加 | 同上、alias 直接記述 | 1 分 |
| relative imports で書かれた legacy file の段階移行 | line 単位 in-place 書換 | 5 分/file |

→ **デフォルトで alias 経由が SOP 化されており、追加コストは無視可能**。

### 4.3 Phase B-2（composite refs）への移行時のコスト

Phase B-2 = pnpm workspaces 完全活用 / composite project references 採用時の追加検証コスト:

| task | 想定工数 |
|---|---|
| 51 test files の vitest 全実行 + 1198 PASS regression 0 確認 | 0.5h |
| tsc --build 経路での 51 test files 全 typecheck | 0.5h |
| edge case（dynamic import / re-export chain）の sanity | 1h |
| **合計** | **2h** |

これは Round 25 引継 spec（Phase B-2 計 7-8h）の中で検証 layer として組み込まれる想定。

## 5. Round 25 引継推奨件数判定

### 5.1 W3 test layer の引継 task

**結論: 0 件**

理由:
- harness/src/__tests__/ 配下の 51 file 全件で cross-rootDir relative imports は 0 残存
- Phase 1 で migrate 済の 2 file は 32/32 PASS 維持で完全運用中
- 49 file は local-only（cross-rootDir 参照なし）で本論点と無関係

### 5.2 Phase B-2 着手時の test layer 引継

| task | Round | 担当候補 | 工数 |
|---|---|---|---|
| 51 test files vitest + tsc 全 regression 0 検証 | R25 | Dev-RR | 1h |
| Phase B-2 完遂後の test layer status report 作成 | R25 | Dev-RR | 0.5h |
| **合計** | - | - | **1.5h** |

→ Phase B-2 全体 7-8h の中の test 検証 layer のみ（個別 migration 不要）。

### 5.3 main code layer の引継

| task | Round | 備考 |
|---|---|---|
| Phase B-2 = composite refs 配線（Dev-PP R24 報告 §8.1） | R25 | TS6059 5 件解消の唯一の formal path |
| DEC-019-041 supersede 議決（DEC-019-XYZ 番号付与） | R25 | PM-Q 起案候補 |
| knowledge 系 4 件 別 issue 化 + 修正 | R25 | TS2322/TS2698/TS4104 = 別 root cause |

詳細は本書 task ① 報告（`dev-pp-r24-arch-01-phase2-main-code-migrate.md`）§8 参照。

## 6. 設計判断の根拠

### 6.1 なぜ「W3 test layer は完了」と判定するか

| 根拠 | 評価 |
|---|---|
| cross-rootDir relative imports 残存 = 0 | 完全達成 |
| Phase 1 で実証済 alias resolver 動作 | 32/32 PASS（runtime 経路） |
| Phase 2 で main code 1198 PASS 維持 | 副作用 0 |
| 新規 file SOP = alias 推奨で確立済 | 段階移行の自然収束 |
| historical baseline file 2 件 = 完全保護維持 | Dev-HH/Dev-JJ baseline absolute 不可侵 |

### 6.2 なぜ relative fallback pattern を完全廃止しないか

DEC-019-041 Phase A baseline（relative imports fallback pattern）は以下のケースで残存価値あり:

| ケース | 採用例 |
|---|---|
| 動的 import（`import('...')` で alias prefix が runtime 解決必要） | 現状未発生だが将来可能性 |
| dist build 直叩き（`./dist/...` 直接参照） | CI / e2e で発生可能 |
| edge case の cross-package re-export chain | Round 25 Phase B-2 で再評価 |

→ alias と共存運用継続 = DEC-019-076 ④ 段階移行方針との整合。

### 6.3 historical baseline 保護の正当性

`17day-path-w4-e2e-fully-wired.test.ts`（Dev-HH R21）/ `17day-path-w4-production-e2e-extended.test.ts`（Dev-JJ R22）は cross-rootDir imports 0 件のため、技術的に migration 不要。仮に migration 候補だった場合でも、Dev-MM R23 Phase 1 spec §1.2 で「historical baseline 絶対無改変」と明記済 = 移行対象外として確定。

## 7. 制約遵守 status

| 制約 | 遵守 status |
|---|---|
| 既存 test file absolute 無改変 | **達成**（本書は調査のみ、実 migration 0） |
| 51 file 全件調査完遂 | **達成**（grep + manual inspection） |
| Phase 1 baseline 32/32 PASS 維持確認 | **達成**（task ① 報告 §4.3 で smoke test 実証） |
| API 追加コスト $0 | **達成**（Read + Grep + Bash のみ） |
| 副作用 0 / 絵文字 0 | **達成** |
| 既存 DEC absolute 無改変 | **達成**（本書は調査報告、decisions.md 改変なし） |

## 8. 結論

### 8.1 W3 test layer の status

**ARCH-01 Phase B クローズ可能（test layer のみ独立評価）**:
- cross-rootDir relative imports 残存 = 0 件
- Phase 1 migrate 済 2 file = 32 PASS 完全維持
- 49 file = local-only / cross-rootDir 参照なし
- historical baseline 2 file = 完全保護維持
- 新規 file SOP = alias 推奨で確立済

### 8.2 Round 25 引継推奨件数

**0 件**（test layer 単独）+ **1.5h**（Phase B-2 全体内の検証 layer）

### 8.3 task ① 報告との連携

| task ① 報告 | task ② 報告（本書） | 結論連携 |
|---|---|---|
| main code 6 imports alias 化完遂 | main code 修正対象 1 file 確認 | runtime layer 完遂 |
| TS6059 5 件残存（paths alias 仕様外） | test layer 0 件残存 = 影響なし | strict layer は Phase B-2 escalate |
| 1198 PASS 維持（regression 0） | 51 test file 全件 alias 共存運用維持 | 副作用 0 完全達成 |
| DEC-019-041 partial-resolved 提案 | test layer は完全 resolved | 全体 partial-resolved 整合 |

## 9. 関連 file 参照

- `projects/PRJ-019/reports/dev-pp-r24-arch-01-phase2-main-code-migrate.md`（task ① 姉妹）
- `projects/PRJ-019/reports/dev-mm-r23-arch-01-migrate-phase1-dev-staging.md`（Phase 1 GO 306 行）
- `projects/PRJ-019/reports/dev-nn-r23-arch-01-phase2-production-rollout-spec.md`（spec 380 行 / 必達条件 4 = 本書範囲）
- `projects/PRJ-019/app/harness/src/__tests__/`（51 test file 全件）
- `projects/PRJ-019/app/harness/tsconfig.json`（Phase 1 paths 追加済 / exclude `**/*.test.ts` で test files は tsc 対象外）
- `projects/PRJ-019/app/harness/vitest.config.ts`（resolve.alias 同期済）

---

**SOP 順守**: 本書は Round 24 W3 test layer 調査報告のみ（実 migration 0 件 / 既存 test file absolute 無改変）。Phase 1 で確立した alias 化 SOP は Round 24 で継続運用中、Round 25 Phase B-2 着手時に composite refs 経路で test layer 検証を再実施予定。
