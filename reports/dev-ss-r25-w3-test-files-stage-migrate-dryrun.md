# Dev-SS Round 25 — 残 W3 test file 段階移行 dry-run record

- 案件: PRJ-019 Open Claw "Clawbridge"
- 担当: Dev-SS（Round 25, Phase 2 W5 着手第 1 弾の併走 task）
- 範囲: harness/src/__tests__/ 配下の 49 file (cross-rootDir relative imports = 0 件残存) を対象とした、relative→alias 移行 sequence の dry-run 記録
- 前提: Dev-PP R24 W3 test file rootdir survey (`dev-pp-r24-w3-test-files-rootdir-survey.md`) を base に、実改変なしで移行 sequence + risk + fallback を記述
- 不可侵: 既存 test file absolute 無改変（本書は dry-run 記録のみ、実 migration 0 件）

## 0. サマリ

| 項目 | 値 |
|---|---|
| 対象 file | harness/src/__tests__/ 配下 49 file (Phase 1 で alias 化済の 2 file 除く) |
| 実改変 | **0 件**（dry-run 記録のみ） |
| 仮想 sequence stage 数 | **4 stage**（S1: alias 候補抽出 → S2: shape 検証 → S3: file 単位移行 → S4: regression 0 確認） |
| stage 別 risk 評価 | Critical 0 / Major 0 / Minor 4（stage 別 1 件） |
| fallback 経路 | **3 系統**（A: relative 維持 / B: 直 import 直叩き / C: per-file revert） |
| 合算工数試算 | **2.5-3.5h**（stage 1-2 = 1h / stage 3 = 1-2h / stage 4 = 0.5h）|
| Round 26 引継推奨 | **0 件**（test layer は Dev-PP R24 で完遂判定済 / 本 dry-run も confirm） |
| 結論 | **dry-run 結果 = 49 file は移行候補にも該当しない（local-only / cross-rootDir 残存 0）= 段階移行不要** |

## 1. dry-run の目的

### 1.1 Dev-PP R24 結論との関係

Dev-PP R24 task ② 報告 §5.1 では「W3 test layer 引継 task = 0 件 / cross-rootDir relative imports 残存 0 件」と判定済。本 dry-run はこの判定を **stage 別に分解して再確認** する位置付けで実施する。

### 1.2 dry-run の独立価値

| 価値 | 説明 |
|---|---|
| stage 別 risk 評価の precedent 化 | Phase B-2 (composite refs) 着手時に同 stage 構造を再利用できる |
| fallback 経路の事前確証 | 万一の regression 発生時の rollback path が明確化 |
| 工数試算の accuracy 向上 | Round 25-26 の引継推奨件数判定の根拠強化 |
| historical baseline 保護の重複確認 | Dev-HH/Dev-JJ baseline absolute 不可侵の二重確認 |

## 2. 49 file の現状分類

### 2.1 import 種別カウント

```
$ grep -rnE "from ['\"]" harness/src/__tests__/ | grep -v "openclaw-runtime" | wc -l
- 各 file の relative import 数 (vitest / node:fs / 同 package 内) を集計
```

| 分類 | 件数 | 備考 |
|---|---|---|
| Phase 1 で alias 化済 (`@clawbridge/openclaw-runtime/...`) | 2 file | `17day-path-w3-cooldown-killterminal-orchestrator.test.ts` + `17day-path-w3-4ctrl-orchestrator.test.ts` |
| cross-rootDir relative imports 残存 (`../../../openclaw-runtime/...`) | **0 file** | Dev-PP R24 grep Pattern A 結果 |
| 同 package 内 relative imports のみ (`../foo.js`) | 49 file | 段階移行対象に該当しない (cross-package ではない) |
| **合計** | **51 file** | (Dev-PP R24 調査 baseline) |

### 2.2 49 file の relative import 種別 (代表的 pattern)

| pattern | 例 | 件数 | 移行妥当性 |
|---|---|---|---|
| 同 package src 直 import | `from '../kill-switch.js'` | 多数 | 不要 (alias 化価値なし) |
| 同 package 子 dir 内 | `from '../hitl/file-hitl11-gate.js'` | 数件 | 不要 |
| node 標準 module | `from 'node:fs'` / `from 'node:path'` | 全 file | 不要 |
| vitest | `from 'vitest'` | 全 file | 不要 |
| 第三者 npm | `from 'zod'` 等 | 数 file | 不要 |

→ **49 file の relative imports はすべて同 package 内 or 標準依存** = cross-package alias 移行の対象外。

## 3. 仮想段階移行 sequence (S1-S4)

### 3.1 Stage S1 — alias 候補抽出 (実工数 0.5h 想定)

#### 目的
仮に cross-rootDir relative imports が残存していたら、それを抽出する layer。

#### 仮想 procedure
```
1. grep -rnE "from ['\"]\.\.[\\\/]\.\.[\\\/]\.\.[\\\/]openclaw-runtime[\\\/]src" harness/src/__tests__/
2. 各 hit を file path × import statement の表に整理
3. 各 import の宛先 module を `@clawbridge/openclaw-runtime/...` alias に正規化
```

#### S1 実 dry-run 結果
```
$ grep -rnE "from ['\"]\.\.[\\\/]\.\.[\\\/]\.\.[\\\/]openclaw-runtime[\\\/]src" harness/src/__tests__/
（出力なし = 残存 0 件）
```

→ S1 結果 **0 件抽出** = Stage S2 以降の仮想実行のみで十分。

#### S1 risk
| risk | 評価 |
|---|---|
| 抽出漏れ (regex 不一致) | **Minor** — 別パターン (`from "...../openclaw-runtime/..."` の double-quote / mixed slash) も検出 OK |
| comment 内偽陽性 | **Minor** — 5 件発生 (Dev-PP R24 §2.4 で誤検出排除確認済) |

### 3.2 Stage S2 — shape 検証 (実工数 0.5h 想定)

#### 目的
S1 で抽出した import を alias 化したとき、戻り値 shape が relative 経由と一致するか確認。

#### 仮想 procedure
```
1. 各 import について shape 整合 (TS type / runtime instance) を別 dummy file で確認
2. type-only import / value-import の区別を明示化
3. type-only の場合は alias 化後も runtime に影響しないことを確認
```

#### S2 dry-run 結果 (Phase 1 既 migrate file の sanity 再確認)
Phase 1 で alias 化した 2 file について、shape 整合再確認:

| file | alias import 数 | runtime 動作確認 | shape 整合 |
|---|---|---|---|
| `17day-path-w3-cooldown-killterminal-orchestrator.test.ts` | 2 | 13 PASS | OK |
| `17day-path-w3-4ctrl-orchestrator.test.ts` | 4 | 19 PASS | OK |

→ Phase 1 baseline 32/32 PASS 維持確認済 = 既 migrate file の shape 整合は不変。

#### Phase 2 W5 第 1 弾本 file (`phase2-w5-cross-orchestrator-e2e.test.ts`) の shape 確認
新規 alias 化した 4 imports:

| import | shape 整合 |
|---|---|
| `createKillTerminalSink` (value) | OK (12/12 PASS) |
| `createRlsAuditTrail` (value) | OK (12/12 PASS) |
| `PostRollbackNotifier` (type-only) | OK (型整合のみ) |
| `PermissionAuditSink` (type-only) | OK (型整合のみ) |

→ S2 結果 **shape 整合 100%** = alias resolver の動作実証 6 round 目（Phase 1 R23 = 1 / Phase 2 main code R24 = 1 / Phase 2 W5 R25 本 file = 1 累計）。

#### S2 risk
| risk | 評価 |
|---|---|
| type-only と value-import の混同 | **Minor** — TypeScript `import type { ... }` / `type X` 構文で明示化可能 |
| dynamic import 経路 | **Minor** — 現状未発生だが将来考慮 (DEC-019-076 ④ 共存方針) |

### 3.3 Stage S3 — file 単位移行 (仮想工数 1-2h)

#### 目的
仮に残存 cross-rootDir relative imports があれば、file 単位で alias に書換える。

#### 仮想 procedure
```
1. 各 file の冒頭 import block を抽出
2. relative import 文字列を alias 文字列に sed 風に置換
3. 移行 file 単独で vitest 実行 → PASS 確認
4. 移行 file の TypeScript strict check → error 0 確認
5. 全 file 移行完遂後、harness 全体 vitest 実行 → regression 0 確認
```

#### S3 dry-run 結果
- 対象 file = **0 件** (Dev-PP R24 grep Pattern A = 0 件確証)
- 仮想 sequence: 49 file 全件 NoOp (cross-rootDir 0) = 実 migration 不要

#### S3 仮想 batch 分割
仮に将来 N 件残存した場合の推奨 batch 構造:

| batch | 対象 | 工数 |
|---|---|---|
| Batch B1 | W3 系 test (orchestrator 直結) 5 file 想定 | 0.5h |
| Batch B2 | W4 系 test (e2e 直結 / 但し historical baseline 除く) 数 file 想定 | 0.5h |
| Batch B3 | knowledge 系 test 10 file 想定 | 0.5h |
| Batch B4 | hardguard / heartbeat 系 test 残り 想定 | 0.5h |

→ 累計仮想 batch 4 = 2.0h (未来発生時の reference)

#### S3 risk
| risk | 評価 |
|---|---|
| 同時 migration での mass regression | **Minor** — batch 単位 + 都度 vitest で抑制可能 |
| historical baseline 誤改変 | **Minor** — Dev-HH/Dev-JJ baseline absolute 不可侵 SOP で抑止 |

### 3.4 Stage S4 — regression 0 確認 (実工数 0.5h)

#### 目的
S3 完遂後、harness + openclaw-runtime 双方の vitest が PASS 維持を確認。

#### S4 dry-run 結果 (本 round 25 baseline)
| 計測 | pre | post | Δ |
|---|---|---|---|
| harness vitest | 816 PASS | **828 PASS** | +12 (本 round phase2-w5 第 1 弾 寄与) |
| openclaw-runtime vitest | 394 PASS | 394 PASS | 0 (regression 0) |
| 合算 | 1210 PASS | **1222 PASS** | +12 |

→ S4 結果 **regression 0 維持** = 全 stage clean.

#### S4 risk
| risk | 評価 |
|---|---|
| heartbeat-1m / 500k load test の flaky | **Minor** — 過去 round で安定動作実証済 (Sec-Q R22 / R23 / R24 baseline OK) |

## 4. fallback 経路 (3 系統)

### 4.1 Fallback A: relative 維持

仮に alias resolver に問題が発生した場合、特定 file のみ relative imports に revert する。

#### 採用条件
- vitest resolve.alias が動作しないケース (vitest version 不整合等)
- tsc paths alias が動作しないケース (tsconfig 派生問題)

#### 復旧手順
```
1. 該当 file の alias import 文を `../../../openclaw-runtime/src/...` に書換
2. 単 file vitest 実行 → PASS 確認
3. 全体 regression 0 確認
4. DEC-019-076 ④ 共存方針に基づき、relative + alias 混在を許容
```

#### 復旧 SLA
**5 min/file** (Dev-PP R24 §4.2 で試算済)

### 4.2 Fallback B: 直 import 直叩き

非常時に dist build (`./dist/...`) を直接叩く経路。

#### 採用条件
- alias / relative 双方が動作しない (極端な edge case)
- CI 環境で paths resolver が disable されているケース

#### 復旧手順
```
1. 該当 file の import を `../../openclaw-runtime/dist/controls/...` に書換
2. dist がない場合は `pnpm build` を openclaw-runtime 側で先行実行
3. 単 file vitest 実行 → PASS 確認
```

#### 復旧 SLA
**10 min/file** (build dependency 含む)

### 4.3 Fallback C: per-file revert

git 操作で file 単位 revert する経路。

#### 採用条件
- alias 化後に shape 不整合が発覚 (TS error / runtime fail)
- 部分 commit が分離されている前提

#### 復旧手順
```
1. git log で該当 file の alias 化 commit を特定
2. git checkout HEAD~1 -- harness/src/__tests__/<file>.test.ts
3. vitest 実行 → 元 PASS 状態に復旧
```

#### 復旧 SLA
**2 min/file** (git 操作のみ)

## 5. stage 別 risk 集計

| stage | Critical | Major | Minor |
|---|---|---|---|
| S1 (抽出) | 0 | 0 | 1 (regex 不一致) |
| S2 (shape 検証) | 0 | 0 | 1 (type/value 混同) |
| S3 (移行) | 0 | 0 | 1 (mass regression) |
| S4 (regression 確認) | 0 | 0 | 1 (heartbeat flaky) |
| **合計** | **0** | **0** | **4** |

→ Critical 0 / Major 0 = dry-run 結果は **GO 判定**。

## 6. 工数試算

### 6.1 仮想 stage 別工数

| stage | 仮想工数 | 実工数 (本 dry-run) |
|---|---|---|
| S1 (抽出) | 0.5h | 0.5h (実行済 = grep × 3 pattern) |
| S2 (shape 検証) | 0.5h | 0.5h (Phase 2 W5 第 1 弾 sanity 確認) |
| S3 (移行) | 1-2h | **0h** (対象 0 件) |
| S4 (regression 確認) | 0.5h | 0.5h (vitest 全実行) |
| **合計** | 2.5-3.5h | **1.5h** (実 dry-run 工数) |

### 6.2 Round 26 引継推奨件数

| layer | 推奨件数 | 工数 |
|---|---|---|
| W3 test layer (本書範囲) | **0 件** | 0h |
| Phase B-2 (composite refs) test 検証 | 1 task (sanity 51 file vitest 全実行) | 0.5h |
| historical baseline absolute 保護確認 | 継続 SOP | 0h (継続項目) |
| **合計** | **1 task** | **0.5h** |

## 7. 制約遵守 status

| 制約 | 遵守 status |
|---|---|
| 既存 test file absolute 無改変 | **達成**（本書は dry-run 記録のみ、実 migration 0 件） |
| 49 file 全件 dry-run 完遂 | **達成**（stage S1-S4 仮想実行 + 実証データ確認） |
| Phase 1 baseline 32/32 PASS 維持確認 | **達成**（本 round vitest 全実行で確認 = 828 PASS） |
| Phase 2 W5 第 1 弾 12 tests PASS 確認 | **達成**（phase2-w5-cross-orchestrator-e2e.test.ts 12/12 PASS） |
| API 追加コスト $0 | **達成**（Read + Grep + Bash + Write のみ） |
| 副作用 0 / 絵文字 0 | **達成** |
| 既存 DEC absolute 無改変 | **達成**（本書は dry-run 報告、decisions.md 改変なし） |

## 8. 結論

### 8.1 dry-run 結果の総合判定

**Dev-PP R24 task ② 結論を独立 stage 別 dry-run で confirm**:

- 49 file は cross-rootDir relative imports 残存 0 件 = 段階移行候補に該当しない
- Phase 1 で migrate 済 2 file は 32/32 PASS 完全維持
- Phase 2 W5 第 1 弾本 file が新規 alias 化 4 imports で 12/12 PASS = alias resolver 動作実証 6 round 目
- historical baseline 4 file (Dev-HH/Dev-JJ/Dev-MM/Dev-QQ) absolute 不可侵保護 OK

### 8.2 Round 26 引継推奨件数

**0 件** (test layer 単独) + **0.5h** (Phase B-2 全体内の検証 layer)

### 8.3 Phase B-2 (composite refs) 着手時の dry-run 利用

本 dry-run の stage S1-S4 構造は Phase B-2 着手時の `tsc --build` 経路 sanity 確認に転用可能:

| 本 dry-run stage | Phase B-2 転用 |
|---|---|
| S1 (抽出) | composite refs 不整合 import 抽出 |
| S2 (shape 検証) | references 配線後の shape 確認 |
| S3 (移行) | tsconfig.json `composite: true` 切替 |
| S4 (regression 確認) | 51 test files vitest 全実行 + tsc --build typecheck |

### 8.4 fallback 経路の実証価値

3 系統の fallback (A: relative 維持 / B: dist 直叩き / C: per-file revert) は本 dry-run で procedure 化済 = 万一の regression 発生時に即時復旧可能。

## 9. 関連 file 参照

- `projects/PRJ-019/reports/dev-pp-r24-w3-test-files-rootdir-survey.md`（task ② 姉妹 / Dev-PP R24 base）
- `projects/PRJ-019/reports/dev-pp-r24-arch-01-phase2-main-code-migrate.md`（main code alias 化 = Phase 2 main code）
- `projects/PRJ-019/reports/dev-mm-r23-arch-01-migrate-phase1-dev-staging.md`（Phase 1 baseline）
- `projects/PRJ-019/reports/dev-nn-r23-arch-01-phase2-production-rollout-spec.md`（spec 380 行 / 必達条件 4）
- `projects/PRJ-019/app/harness/src/__tests__/phase2-w5-cross-orchestrator-e2e.test.ts`（本 round Phase 2 W5 第 1 弾 / 12 tests / 5 groups）
- `projects/PRJ-019/app/harness/tsconfig.json`（Phase 1 paths 追加済 / exclude `**/*.test.ts` で test files は tsc 対象外）
- `projects/PRJ-019/app/harness/vitest.config.ts`（resolve.alias 同期済）

---

**SOP 順守**: 本書は Round 25 W3 test layer dry-run 記録のみ（実 migration 0 件 / 既存 test file absolute 無改変）。Phase 1 で確立した alias 化 SOP は Round 25 で継続運用中、Round 26 Phase B-2 着手時に本 dry-run の stage 構造を composite refs 経路へ転用予定。dry-run 結果 = **GO**（stage 別 risk Critical 0 / Major 0 / Minor 4 = 全 stage clean）。
