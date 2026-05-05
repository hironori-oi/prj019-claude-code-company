# Dev-XX Round 26 — harness 健全性 round-wide verification + regression リスク予測

最終更新: 2026-05-05 W0-Week1
起案: Dev 部門 R26 Dev-XX（補完 dev / 9 並列体制 9 番目）
位置付け: Round 26 dev agent（Dev-VV: claude-bridge integration e2e 物理化 / Dev-WW: ARCH-01 Phase B-2 composite refs 物理実装）の影響を予測し、836 PASS baseline（R25 着地値）に対する regression risk を評価する round-wide verification。
版: v1.0
連動 DEC: DEC-019-006 / 041 / 049 / 062 / 074-077 / 079
連動 baseline:
- harness 836 PASS（R25 Dev-SS +12 + Dev-TT +8 = R24 816 + 20）
- openclaw-runtime 394 PASS（R23 以降不変）
- 51 .test.ts file（harness/src/__tests__/ 配下、R25 着地時点）

---

## §0 サマリ（CEO 200 字）

Round 26 dev agent 2 件（Dev-VV: 5-A claude-bridge integration e2e 物理化 / Dev-WW: ARCH-01 Phase B-2 composite refs 物理実装）の harness 836 PASS baseline に対する regression risk を予測。**Dev-VV regression risk = 低**（新規 file 追加のみ、既存 file 不可侵 / mock 経路で副作用 0）/ **Dev-WW regression risk = 中**（tsconfig 改変 + composite refs 化で build flow 変動、ただし vitest src 直結 alias 維持で runtime layer 不変）/ **Round 26 全体 regression risk = 低-中** + mitigation 完備。harness 想定 836 → 848-851（+12-15 / 5-A）+ 同 836 維持（Phase B-2 経由 vitest 不変）= 累計 **848-851 PASS** 想定で R26 完遂着地。openclaw-runtime 394 PASS は両 dev 影響下で完全維持。

---

## §1 R25 着地 baseline 確認

### 1.1 harness 836 PASS 内訳（R25 着地時点）

| Round | 担当 | 寄与 | 累計 |
|---|---|---|---|
| R0-R21 | 各 dev | 全 baseline | 631 (R18 時点) |
| R22 Dev-HH | W4 第 1 弾準備 (e2e fully wired) | +11 | - |
| R22 Dev-JJ | W4 production e2e extended | +10 | - |
| R22 Dev-KK | breach stress chaos | +9 | - |
| R22 Sec-Q | heartbeat 1M longrun | +5 | - |
| R23 Dev-MM | HITL gates integration | +9 | - |
| R24 Dev-QQ | HITL × hardguards cross | +12 | 816 (R24 着地) |
| R25 Dev-SS | cross-orchestrator e2e | +12 | 828 |
| R25 Dev-TT | cross-package extension | +8 | **836 (R25 着地)** |

### 1.2 51 test file 構成（実測）

R25 着地時点での `harness/src/__tests__/` 配下 51 file を分類:

| 系列 | file 数 | 代表 file |
|---|---|---|
| 17day-path 系（W3+W4） | 9 | `17day-path-w4-hitl-hardguards-cross.test.ts` |
| heartbeat / load / longrun | 7 | `heartbeat-1m-10digit-longrun-stability.test.ts` |
| HITL 系 | 5 | `hitl-gate.test.ts` / `hitl-kickoff-gate.test.ts` |
| kill-switch / kill-chain 系 | 4 | `kill-switch.test.ts` |
| hardguard 系 | 2 | `hardguard-g-02.test.ts` / `hardguard-g-10.test.ts` |
| gate-12 系 | 2 | `gate-12-audit-fire.test.ts` |
| breach-counter 系 | 2 | `file-breach-counter-stress-chaos.test.ts` |
| detector-functions 系 | 2 | `detector-functions.test.ts` |
| phase2-w5 系（NEW R25） | 2 | `phase2-w5-cross-orchestrator-e2e.test.ts` / `phase2-w5-cross-package-extension.test.ts` |
| その他 | 16 | cost-tracker / circuit-breaker / monotonic-clock / multi-process-isolation / notify-bridge / openclaw-runtime-bridge / p-ui-10 / process-tree-kill / slack-quick-action / suppression / time-source / tos-monitor / usage-monitor / watchdog / workflow-yaml / clock-skew-boot |
| **計** | **51** | - |

### 1.3 openclaw-runtime 394 PASS（不変 baseline）

R23 以降 openclaw-runtime 内 test 数は 394 で stabilized。R25 Dev-SS / Dev-TT は openclaw-runtime 内 test を新規追加せず、harness 側で cross-package 検証を実施。

---

## §2 Round 26 Dev-VV 影響予測（5-A 物理化）

### 2.1 Dev-VV 担当範囲（R25 Dev-TT spec 由来）

- 物理化 file: `app/harness/src/__tests__/phase2-w5-claude-bridge-integration-e2e.test.ts`
- 行数想定: 700-850
- tests 数: 12-15（Group B-1〜B-5 = 4-5 groups）
- 工数: 6.5-8h
- 既存 file 改変: **0 件**（5-A spec 厳守）

### 2.2 影響軸 5 件 + 予測

| 軸 | 内容 | 影響予測 | regression risk |
|---|---|---|---|
| 軸 1 | harness 836 → 848-851 PASS（+12-15）| 期待通り | 低 |
| 軸 2 | openclaw-runtime 394 PASS 維持 | 不変（5-A は harness 内 file）| 低 |
| 軸 3 | claude-bridge 経路 dryRun=true bypass | mock 経路完結 = 副作用 0 | 低 |
| 軸 4 | mock SubprocessSpawner 注入 | test 内局所 helper / production code 無改変 | 低 |
| 軸 5 | OS tmp 経由 file IO | afterEach cleanup 完備 = leak 0 | 低 |

### 2.3 Dev-VV regression risk 総合評価

**regression risk = 低**

根拠:
1. 5-A spec は既存 file 完全不改変 + 新規 file 1 件のみ追加
2. mock 経路で claude-bridge / openclaw-runtime production code 不接触
3. dryRun=true 経路で API call $0 / spawn 0 担保
4. R25 Dev-TT 352 行 spec で 5 軸 + 8 failure scenario + 12-15 tests / 4-5 groups の物理化レベル詳細化済
5. R22-R25 5 file の historical baseline absolute 無改変

---

## §3 Round 26 Dev-WW 影響予測（Phase B-2 composite refs 物理実装）

### 3.1 Dev-WW 担当範囲（R25 Dev-UU feasibility GO with conditions 由来）

- 物理改変対象: 2 file（`harness/tsconfig.json` + `openclaw-runtime/tsconfig.json`）+ build script 1-2 箇所
- 工数: 4.5h（10 step）
- 採決前提: DEC-019-079 採択（5/26 統合採決 想定）
- conditions 4 件 R25 中 satisfy 見込: C1 (循環依存検証) / C2 (DEC-079 採択) / C3 (KNOW-TS-01-04 別 issue 起票) / C4 (baseline 維持)

### 3.2 影響軸 7 件 + 予測

| 軸 | 内容 | 影響予測 | regression risk |
|---|---|---|---|
| 軸 1 | tsconfig.json composite: false → true | TS strict layer 変動 / vitest 不変 | 中 |
| 軸 2 | references: [{path:"../openclaw-runtime"}] 追加 | build graph 変動 / runtime 不変 | 中 |
| 軸 3 | rootDir: "./src" 明示固定 | TS6059 5 件 0 化見込 | 低 |
| 軸 4 | declaration: true / declarationMap: true | dist 出力増 / .gitignore 範囲内 | 低 |
| 軸 5 | tsBuildInfoFile: "./dist/.tsbuildinfo" | cache file 生成 / 副作用 .gitignore 既設 | 低 |
| 軸 6 | package.json build script `tsc -p` → `tsc --build` | CI build flow 変動 | 中 |
| 軸 7 | vitest resolve.alias src 直結維持 | runtime layer 不変 | 低 |

### 3.3 Dev-WW regression risk 総合評価

**regression risk = 中**

根拠:
1. tsconfig 改変 = TS strict layer の root cause 解消（TS6059 5 件 → 0 件）= 質的向上
2. composite: true 化で `rootDir` 自動検査が逆に厳しくなる可能性（R25 Dev-UU §8 risk R1）
3. `tsc --build` 依存順序誤検出 risk（R5 Dev-UU §8 R4）= mitigation 完備（references 片方向のみ）
4. fallback 3 段階完備（B-2a / B-2b / B-2c）= 即時復元可能
5. vitest 51 file regression 0 期待（src 直結 alias 維持）

### 3.4 mitigation strategy（R26 Dev-WW 担当 checklist）

R25 Dev-UU §10 trigger 4 条件 + 物理化前 pre-flight 必須:

- [ ] pre-flight: `cd openclaw-runtime/src && grep -rn "@clawbridge/harness" .` で 0 件確認（循環依存解消検証）
- [ ] pre-flight: harness 836 PASS / openclaw-runtime 394 PASS baseline 計測
- [ ] step 1: openclaw-runtime/tsconfig.json composite 化（0.5h）
- [ ] step 2: harness/tsconfig.json composite + references 配線（1.0h）
- [ ] step 3: 各 package.json build script `tsc --build` 化（0.5h）
- [ ] step 4: `tsc --build --verbose` 動作確認 + TS6059 5 件 0 化検証（0.5h）
- [ ] step 5: vitest 51 file regression 0 検証（0.5h）
- [ ] step 6: W3+W4 smoke 95+ tests 再走（0.25h）
- [ ] step 7: knowledge 系 4 件 = post 4 件（範囲外維持）確認（0.25h）
- [ ] step 8: harness 836 / openclaw 394 PASS 完全一致確認（0.25h）
- [ ] step 9: DEC-019-041 status 遷移 evidence 起案（0.5h）
- [ ] step 10: 完遂報告書起案（0.5h）

合計 4.5h（R25 Dev-UU 提示値と一致）

### 3.5 fallback trigger 条件再掲

| trigger | 適用 fallback |
|---|---|
| Gate 1-2 (vitest regression) FAIL 1 件以上 | B-2b（即時復元 / 5-10 分）|
| Gate 3 (TS6059) post 0 件にならず 1 件以上残存 | B-2b（spec 再検討）|
| Gate 4 (knowledge 4 件) 想定外増加 | B-2b（composite 由来時のみ）|
| Gate 5 (W3+W4 smoke) FAIL 1 件以上 | B-2b（即時復元）|
| 物理化後 24h 以内に複数 Gate FAIL 連発 | B-2c（完全 roll-back / 30 分）|

---

## §4 Round 26 全体 regression risk 評価

### 4.1 risk matrix（Dev-VV + Dev-WW）

| risk | likelihood | impact | mitigation |
|---|---|---|---|
| Dev-VV 5-A 新規 file 単体エラー | 低 | 低 | mock 経路完備 / spec R25 Dev-TT 詳細化済 |
| Dev-VV 5-A による既存 file 副作用 | 低 | 低 | 既存 file 完全不改変担保 |
| Dev-WW Phase B-2 vitest regression | 低 | 中 | src 直結 alias 維持 / fallback B-2b 5-10 分復旧 |
| Dev-WW Phase B-2 build script 失敗 | 中 | 中 | fallback B-2a / B-2b 即時適用 |
| Dev-WW Phase B-2 循環依存 fire | 低 | 高 | pre-flight grep で事前検出 / case Y 採用 OK |
| Dev-VV + Dev-WW 並列実施衝突 | 低 | 中 | 改変対象 file 完全非交差（5-A=test file 新規 / B-2=tsconfig）|
| openclaw-runtime 394 PASS regression | 低 | 中 | 両 dev とも openclaw-runtime test 不改変 |

### 4.2 Round 26 全体 regression risk 総合評価

**Round 26 全体 regression risk = 低-中**

根拠:
1. Dev-VV (5-A) = 低 risk（新規 file のみ）
2. Dev-WW (B-2) = 中 risk（tsconfig + build script 改変、ただし fallback 完備）
3. 並列衝突 risk = 低（改変対象非交差）
4. mitigation 累計 7 件すべて R25 中 satisfy 見込
5. R25 着地 836 PASS / 394 PASS baseline absolute 保護

### 4.3 Round 26 完遂時 想定 baseline

| 観点 | R25 着地 | R26 完遂時 | Δ |
|---|---|---|---|
| harness PASS | 836 | **848-851** | +12-15 |
| openclaw-runtime PASS | 394 | **394** | 0 |
| TS6059 fire 件数 | 5 | **0** | -5 |
| knowledge 系 TS error | 4 | 4 | 0（範囲外維持）|
| 物理 file 件数（W4+W5）| 6 | 7 (5-A 追加) | +1 |
| tsconfig 改変 file | 0 | 2 (B-2 適用) | +2 |
| build script 改変 | 0 | 2 (B-2 適用) | +2 |

---

## §5 R27+ 引継 readiness（Round 26 → Round 27）

### 5.1 Dev-YY 引継 3 項目（推奨）

| # | 内容 | 担当想定 | 工数 |
|---|---|---|---|
| ① | W4 第 5 弾 5-B（HITL × hardguards 拡張）物理化 | Dev-YY | 6-7h |
| ② | Phase 2 W6 第 1 弾 spec 起案 + 物理化準備 | Dev-YY | 3-4h |
| ③ | ARCH-01 Phase B-3 候補探索（B-2 完遂後の次段） | Dev-YY | 2-3h |

### 5.2 R27 着地想定 baseline

| 観点 | R26 着地 | R27 完遂想定 | Δ |
|---|---|---|---|
| harness PASS | 848-851 | **858-863** | +10-12（5-B 寄与）|
| W4 累計 tests | 54-57 | **64-69** | +10-12 |
| Phase 2 W6 進捗 | 第 0 弾 | 第 1 弾 spec 起案完遂 | 第 1 弾準備 |

---

## §6 制約遵守 status

| 制約 | 遵守 status |
|---|---|
| harness 836 PASS / openclaw-runtime 394 PASS 維持（本書面期間中） | **達成** |
| API 追加コスト $0 | **達成** |
| 副作用 0 | **達成**（reports 配下 1 file 新規追加のみ）|
| 絵文字 0 | **達成** |
| R22-R25 historical baseline absolute 無改変 | **達成** |
| Phase 1 移行済 file absolute 無改変 | **達成** |
| 4 control 実装 absolute 無改変 | **達成** |
| fix forward-only 厳守 | **達成** |

---

## §7 結語

Round 26 dev agent 2 件（Dev-VV: 5-A / Dev-WW: B-2）の harness 836 PASS baseline 影響を予測。Dev-VV = 低 risk（新規 file のみ）/ Dev-WW = 中 risk（tsconfig 改変 / fallback 完備）/ 並列衝突 risk = 低。**Round 26 全体 regression risk = 低-中** + mitigation 累計 7 件完備。R26 完遂時想定 baseline = harness **848-851 PASS** + openclaw-runtime **394 PASS** 維持。R27 Dev-YY 引継 3 項目（5-B 物理化 / W6 第 1 弾 spec / Phase B-3 候補探索）で R26 → R27 遷移経路を確保。
