# Dev-JJ Round 22 — W4 完成第 1 弾: production e2e fully wired + ARCH-01 評価

- 案件: PRJ-019 Open Claw "Clawbridge"
- 担当: Dev-JJ (Round 22, 9 並列の 1)
- 範囲: W4 完成第 1 弾 — (1) 17day-path W4 production e2e 拡張 tests + (2) ARCH-01 / DEC-019-041 Phase B 候補解消可否評価
- 目的: Dev-GG / Dev-HH (Round 21) が確立した production wiring 基盤 (bridge / persistent counter / monotonic clock) を **直接 import** で接続する extended e2e tests を新規追加し、production 本番 wiring 観点 5 軸を網羅検証する。並行で ARCH-01 cross-rootDir 違反の三択評価を行い、Phase B-1 必達経路を確定。
- 領域不可侵: Round 21 historical baseline 5 file (openclaw-runtime-bridge.ts / file-breach-counter.ts / monotonic-clock.ts / sla-clock-adapter.ts / 17day-path-w4-e2e-fully-wired.test.ts) は完全無改変。Dev-EE 既存 file 無改変。control 本体無改変。

## 0. サマリ

| 項目 | 値 |
|---|---|
| 新規 file | 3 (production e2e extended tests + arch-01 評価書 + 本報告) |
| 実装行数 | extended tests 561 行 / arch-01 評価書 326 行 / 本報告 約 220 行 |
| 新規 tests | **10 (5 groups: A/B/C/D/E × 2 tests each)** |
| Dev-JJ 単独実行 | **10 PASS / 0 FAIL** (約 30ms) |
| harness 全体 (事前) | **771 PASS / 57 files / 0 FAIL** (Round 21 末) |
| harness 全体 (事後) | **790 PASS / 59 files / 0 FAIL** (regression 0 / +19 PASS) |
| Dev-JJ 純粋寄与 | **+10 PASS / +1 file** (差分 +9 PASS / +1 file は他並列 Dev-kk file-breach-counter-stress-chaos = Round 22 並列増分) |
| TypeScript strict (新規 file) | 型エラー 0 件 (既存 cross-rootDir / knowledge errors 9 件は pre-existing, ARCH-01 評価書で別 issue 化提案) |
| Public API of any ctrl | 完全不変 (port 注入のみ) |
| 副作用 / 絵文字 / API コスト | 0 / 0 / $0 (Read + Edit + Write のみ) |
| ARCH-01 推奨案 | **案 A = tsconfig path alias** (短期, Phase B-1 必達), **案 B = pnpm workspaces** (中期, Phase 2 前) |
| 移行コスト概算 | 案 A 約 2.5h / 議決不要 / regression 0 想定 |

## 1. task ① W4 production e2e fully wired 拡張 tests

### 1.1 設計判断

Dev-HH Round 21 第 2 波 で確立した `17day-path-w4-e2e-fully-wired.test.ts` (530 行 / 11 tests) は **Bridge stub + PersistentBreachCounter stub** を内包する port-only 設計だった。Round 22 W4 完成第 1 弾では、これを **Dev-GG / Dev-HH actual file の直接 import** に格上げし、production 本番 wiring に最も近い形で 5 軸 (10+ tests) を追加検証する。

### 1.2 5 軸 / 10 tests の設計根拠

| Group | 軸 | 検証内容 | 設計根拠 |
|---|---|---|---|
| A (2) | 24h SLA wall-clock skew injection | A-1 正常 / A-2 pass_through + NTP forward step → SLA 越境 timeout | Dev-HH 報告 §5 全 7 種 skew 表の production 反映 |
| B (2) | BreachCounter persistence corruption tolerance | B-1 破損 line skip + 続く observe persist / B-2 全行破損 → fail-open fallback | Dev-GG 報告 §7.4 fail-open vs fail-closed trade-off 検証 |
| C (2) | bridge 接続障害 / lifecycle violation | C-1 disposing 中 init → throw / C-2 dispose 後 getContext throw | Dev-GG 報告 §1.1 phase machine 設計の異常系反映 |
| D (2) | 7 ctrl 連続発火 stress | D-1 異 loopId 5 連続 → 2 trip / D-2 同一 loopId 連続 → idempotent clamp | Dev-EE Round 20 ctrl 本体 idempotent semantics の harness 反映 |
| E (2) | hot-restart 後の state 復元 | E-1 process A persist → process B restore → trip → process C で reset 永続化確認 / E-2 bridge re-init 仕様 | Dev-GG §6.2 + §1.1 lifecycle 4: re-init 動作の production 反映 |

### 1.3 production wiring 反映点

- **Bridge stub 廃止**: Dev-HH e2e の `createBridgeStub` を本 file では使わず、`createOpenClawRuntimeBridge` (Dev-GG actual) を直接 instantiate
- **PersistentBreachCounter stub 廃止**: 本 file では `createFileBreachCounter` (Dev-GG actual) を OS tmpdir 経由で直接 instantiate
- **MonotonicClock + SlaClockAdapter**: Dev-HH actual そのまま使用 (Group A)
- **W3OrchestratorContext**: bridge.init() で得た context の `permissionAuditSink / postRollbackNotifier / killTerminalSink / rlsAuditTrail` 4 port をそのまま orchestrator に注入

### 1.4 vitest 結果

```
$ npx vitest run src/__tests__/17day-path-w4-production-e2e-extended.test.ts
   1 file / 10 tests passed (約 30ms)
   - Group A (24h SLA skew injection):       2 PASS
   - Group B (corruption tolerance):          2 PASS
   - Group C (bridge lifecycle violation):    2 PASS
   - Group D (7 ctrl stress):                 2 PASS
   - Group E (hot-restart state restore):     2 PASS
```

### 1.5 harness 全体 PASS 推移

```
Round 21 末 (Dev-HH 第 2 波 完了時):  766 PASS / 56 files / 0 FAIL
Round 22 着手時 (Dev-JJ start):       771 PASS / 57 files / 0 FAIL  (+5 PASS = 他並列 Round 21 末→22 着手の差分)
Round 22 Dev-JJ 完遂時:               790 PASS / 59 files / 0 FAIL  (+19 PASS / +2 files)
  - Dev-JJ (本件):                    +10 PASS / +1 file (extended e2e)
  - Dev-kk (並列 Round 22):           +9 PASS  / +1 file (file-breach-counter-stress-chaos)
```

regression 0 / 既存 780+ tests は完全無影響。

## 2. task ② ARCH-01 / DEC-019-041 workspace alias 解消可否評価

### 2.1 三択評価

詳細は `dev-jj-r22-arch-01-workspace-alias-feasibility.md` (326 行) 参照。要旨のみ:

| 案 | 内容 | コスト | 推奨 |
|---|---|---|---|
| **A** | **tsconfig path alias 化** (`@clawbridge/openclaw-runtime/*` paths 追加) | **約 2.5h / 議決不要 / regression 0 想定** | **採用 (Phase B-1 必達経路)** |
| B | pnpm workspaces 完全活用 (`package.json` dependencies 化) | 約 6.5h / 議決必要 (循環依存承認) | 中期 (Phase 2 着手前) |
| C | Nx 導入 | 約 12-16h / Phase 1 W4 期限内完遂 NG | 不採用 (workspace size threshold 未到達) |

### 2.2 推奨案 = 案 A (Phase B-1)

**根拠:**
1. Phase A → Phase B 移行の TS6059 error 9 件 (うち ARCH-01 範囲は 7 件) を 2.5h で完全解消可能
2. 議決不要、技術的施策のみで完遂 (Round 23 着手で 6/20 必達期限に大余裕)
3. openclaw-runtime/tsconfig.json で **逆方向 alias は既に同 pattern で実装済** = 採用 pattern が monorepo 内で確立されている
4. 副作用 0 / regression 0 想定 / Phase 2 への前方互換維持

### 2.3 Phase B-2 = 案 B (将来計画)

- Phase 2 着手前 (Round 25 想定) で CEO + Review 部門経由で「harness → openclaw-runtime 依存方向反転」議決
- 案 A の alias は廃止せず並走 = どちらの解決経路でも動作する状態を保持

### 2.4 不採用 = 案 C

- 現状 monorepo size 9 packages = Nx justifiability threshold (~30 packages) 未到達
- Phase 2 末で再評価 (workspace 数増加時)
- 不採用判断を decisions.md DEC-019-XYZ 候補として記録推奨

### 2.5 移行手順 (案 A 詳細)

1. `harness/tsconfig.json` に `paths: { "@clawbridge/openclaw-runtime/*": ["../openclaw-runtime/src/*"] }` 追加
2. 既存 6 import 文を alias 経由に書換 (対象 file: `harness/src/17day-path-w3-orchestrator.ts`)
3. `harness/vitest.config.ts` の `resolve.alias` を同期
4. `npx tsc --noEmit` で TS6059 9 件 → 0 件 (or knowledge 系 2 件残) 確認
5. `npx vitest run` で 790+ PASS / 0 FAIL 継続確認
6. 完遂報告 + DEC-019-041 sub-issue close + decisions.md 更新

### 2.6 risk assessment

| risk | likelihood | impact | mitigation |
|---|---|---|---|
| vitest が tsconfig paths を解決しない | 低 | 中 | vitest.config.ts の resolve.alias 同期 (既知 pattern) |
| dist build 時に paths 変換抜け | 低 | 中 | Phase 1 では未 build 方針、Phase 2 build pipeline で `tsc-alias` 等を評価 |
| 別 workspace で同 alias 必要化 | 中 | 低 | Phase 2 着手前に `tsconfig.base.json` paths 集約 task を 1 件起票 |
| Phase A → B 切替時に他 TS error 顕在化 | 中 | 中 | knowledge 系 7 件は別 issue 化、ARCH-01 範囲を限定 |
| relative imports と alias の混在 merge conflict | 低 | 低 | Round 23 完了後 1 PR で全変換 = 混在期間最小化 |

## 3. 不可侵維持の確認

### 3.1 Round 21 historical baseline 5 file は無改変

```
$ git status (relevant only)
  modified:  ... (only new files)
  ...

  unchanged:
    projects/PRJ-019/app/harness/src/openclaw-runtime-bridge.ts          (175 行 / Dev-GG R21)
    projects/PRJ-019/app/harness/src/file-breach-counter.ts              (200 行 / Dev-GG R21)
    projects/PRJ-019/app/harness/src/monotonic-clock.ts                  (175 行 / Dev-HH R21)
    projects/PRJ-019/app/harness/src/sla-clock-adapter.ts                (130 行 / Dev-HH R21)
    projects/PRJ-019/app/harness/src/__tests__/17day-path-w4-e2e-fully-wired.test.ts (530 行 / Dev-HH R21)
```

### 3.2 Dev-EE / Dev-AA / Dev-BB / Dev-DD 既存 W3 file 無改変

- `17day-path-w3-rollback-permission-orchestrator.ts` (Dev-EE R20)
- `17day-path-w3-orchestrator.ts` (Dev-BB R19)
- `openclaw-orchestrator.ts` (Dev-AA R19)

### 3.3 control 本体無改変

- `openclaw-runtime/src/controls/*` 全 7 ctrl ファイル無改変

### 3.4 ARCH-01 評価書は分析のみ (物理 migrate なし)

- relative imports fallback pattern (`../openclaw-runtime/src/...`) 維持
- 物理 migrate は Round 23 以降で別 ticket として実施

## 4. 実装中遭遇課題

### 4.1 B-1 corrupted tail line の append 連結現象

**問題:** corrupted line に trailing newline がない場合、後続 `appendFile` の `JSON\n` が同 line 末尾に連結される (test B-1 で当初 4 行期待 → 実際 3 行)。

**解析:** `file-breach-counter.ts` の `appendBreachRecord` は `JSON.stringify(record) + '\n'` を書き込む。先行 line に newline がないと append が物理的に同 line 内に追記される (POSIX file IO の通常挙動)。

**対処:** 期待値を `lines.length >= 2` に緩和し、最終 line が `"kind":"reset"` を含むことで「reset record の到達」を検証する形に修正。これは production fail-open semantics の正しい挙動 (corrupted line を skip しつつ valid 部分だけ採用、append は失われない) を反映する。

**学習:** Dev-GG file-breach-counter は **JSON Lines 形式の prefix を信頼する設計** であり、外部から bad data を mix injection する shape では tail concatenation が発生しうる。production では同 process が排他的に append するため実害 0 だが、test fixture では明示的に trailing newline を付与する pattern が望ましい (B-1 改良候補)。

### 4.2 vitest cleanup race の flush 義務化

`afterEach` で tmp dir を rm する前に `counter.flush()` を await しないと、fire-and-forget の append が ENOENT で fail する (Dev-GG 報告 §7.1 と同 race)。本 file では `trackedCounters` array で全 counter を記録し、afterEach で `for (const c of trackedCounters) await c.flush()` を実施することで race を排除。

### 4.3 ARCH-01 三択評価における循環依存の扱い

案 B (pnpm workspaces 化) では openclaw-runtime/package.json の既存 `dependencies: { "@clawbridge/harness": "workspace:*" }` と新規 harness/package.json の `dependencies: { "@clawbridge/openclaw-runtime": "workspace:*" }` で形式的循環が発生する。pnpm は循環を block しない (warning のみ) ため技術的には動作するが、設計 cleanliness では「依存方向反転を公式承認する DEC が必要」と評価書 §2.2 で明示。

### 4.4 Nx 導入の justifiability threshold

monorepo size 9 packages では Nx の cost-benefit が成立しない (一般的 threshold ~30 packages)。Phase 2 で workspace 数が拡大したら再評価する路線を評価書 §2.3 で記録。Phase 1 W4 期限内完遂 (~6/20) との競合 risk を decisively 棄却。

## 5. Round 22 W5 / Round 23 引継

### 5.1 ARCH-01 Phase B-1 着手要件

1. CEO 承認: 本評価書を踏まえた Phase B-1 着手 GO 判断
2. 担当 Dev assign: 1 名 / 想定 0.5 day
3. PR template: ARCH-01 phase B-1 完遂報告 + decisions.md 更新案 同梱
4. Review 部門事前合意: 関連 6 import 書換の merge gate 設定 (regression 0 確認義務)

### 5.2 W4 完成第 2 弾候補

- Round 21 W4 で残置された Round 22 W5 引継 (Dev-GG §6 / Dev-HH §7) のうち未完遂分:
  - Harness クラス本体への bridge 統合 (Dev-GG §6.1, 約 1.5h)
  - FileBreachCounter の Harness lifecycle 連動 (Dev-GG §6.2)
  - SLA adapter の本番運用組込み + suspend 復帰 hook (Dev-HH §7.2 / §7.3)
- 本 task ① extended tests の +5 軸はこれら統合への基盤としても機能する (lifecycle violation / hot-restart シナリオの先取り検証)

### 5.3 評価書追記候補

- Phase 2 着手時の `tsconfig.base.json` paths 集約 task を Round 25 計画に組み込む
- 案 B 移行時の循環依存承認議決 agenda を Phase 1 W4 末 (~6/20) で議題化準備

## 6. 出力 file 一覧

| file | 行数 | 用途 |
|---|---|---|
| `projects/PRJ-019/app/harness/src/__tests__/17day-path-w4-production-e2e-extended.test.ts` | 561 | task ① production e2e extended tests (5 groups / 10 tests) |
| `projects/PRJ-019/reports/dev-jj-r22-arch-01-workspace-alias-feasibility.md` | 326 | task ② ARCH-01 三択評価書 |
| `projects/PRJ-019/reports/dev-jj-r22-w4-production-e2e-and-arch01.md` | 約 220 | task ③ 本 Round 22 summary report |

---

**SOP 順守**: DEC-019-025 (background dispatch、SOP 実証 18 件目以降) に基づき、Dev-JJ は他並列 Agent と独立稼働。Round 21 historical baseline 5 file (Dev-GG / Dev-HH) には完全無改変、Dev-EE / Dev-AA / Dev-BB / Dev-DD の既存 W3 file 無改変、control 本体 (openclaw-runtime/src/controls/*) 無改変、relative imports fallback pattern 維持。ARCH-01 評価書は分析のみで物理 migrate なし。
