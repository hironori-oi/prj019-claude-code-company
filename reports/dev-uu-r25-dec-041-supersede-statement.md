# Dev-UU Round 25 — DEC-019-041 supersede 議決 起案文（DEC-019-079 候補）

- 案件: PRJ-019 Open Claw "Clawbridge"
- 担当: Dev-UU（Round 25, ARCH-01 Phase B-2 supersede 議決起案担当）
- 範囲: DEC-019-041（path alias 経路 / status: confirmed → partial-resolved → resolved 経路）から DEC-019-XYZ（composite project references 経路）への supersede 議決起案文（PM-R Round 25 起案連動 / 番号付与候補 DEC-079 or DEC-080）
- 前提:
  - Dev-PP R24 重要発見: TS6059 paths alias 仕様外（dev-pp-r24-arch-01-phase2-main-code-migrate.md §3.4）
  - DEC-019-076 sub-issue close 動議書面（decisions.md line 1234-1342）= DEC-019-041 partial-resolved 提案
  - Dev-UU R25 feasibility 評価書（dev-uu-r25-phase-b-2-feasibility.md）= GO with conditions 判定
- 不可侵: DEC-019-041 + 076 absolute 無改変 / 本書面は起案文 draft、actual decisions.md 反映は PM-R Round 25 採決後

## 0. サマリ

| 項目 | 値 |
|---|---|
| 起案議決番号候補 | **DEC-019-079** or **DEC-019-080** |
| 推奨番号 | **DEC-019-079**（DEC-078 直後 / Round 25 採決連動 timeline 自然 ） |
| 起案者候補 | PM-R（Round 25 PM 担当）|
| 起案日 想定 | 2026-05-12 (Round 25 中盤) |
| レビュー期限 想定 | 2026-05-26 (Round 25 完遂直後) |
| 採決日 想定 | 2026-06-02 (Round 25 完遂時、Phase 2 W5 6/3 着手直前) |
| supersede 対象 | DEC-019-041 (status: partial-resolved → resolved by supersede) |
| 採決推奨 | **Y 無条件** |
| Round 26 物理化前 trigger | 本議決採択 |

## 1. 起案文（PM-R Round 25 起票用 draft）

```markdown
## DEC-019-079 (起案 / status: DRAFT / 起案者: PM-R / 起案日: 2026-05-12 / レビュー期限: 2026-05-26 / 採決日: 2026-06-02)

**タイトル**: ARCH-01 Phase B-2 採用 + DEC-019-041 supersede（path alias 経路 → composite project references 経路）

**status 注意**: 本議決は **DRAFT** であり、Round 25 完遂時 (2026-06-02) 採決想定。Round 25 期間中は措置案として参照のみ可。確定値（feasibility GO with conditions / 4 trigger 条件 satisfy 状況 / R26 着手 readiness）は Round 25 完遂着地時点で update する。

**(1) background**:

- DEC-019-041（Round 17 制定、ARCH-01 = harness↔openclaw-runtime 間の cross-package import 整理 / Phase A warn → Phase B error の段階移行 / paths alias 経路採用）の path alias 経路は Round 23 Dev-MM Phase 1 dev/staging migrate + Round 24 Dev-PP Phase 2 production rollout で物理化完遂し、runtime layer 1198 PASS 完全達成 = formal credit 確立。
- ただし Round 24 Dev-PP の重要発見（dev-pp-r24-arch-01-phase2-main-code-migrate.md §3.4）により、TypeScript の `paths` alias は **module name resolution（import 解決）** のみ alias 化、解決後の物理 file が rootDir 外なら依然として TS6059 を発火する仕様であることが確定。
- DEC-019-041 必達 6 条件の C-4（TS6059 系違反 6 件解消）は paths alias の仕様外で達成不可、formal 解消経路は **TypeScript composite project references** のみ。
- DEC-019-076 sub-issue close 動議書面（decisions.md line 1234-1342）で DEC-019-041 status: confirmed → partial-resolved（runtime layer 完遂 / strict layer は Phase B-2 escalate）が提案済。
- Round 25 Dev-UU feasibility 評価書（dev-uu-r25-phase-b-2-feasibility.md）で Phase B-2 = composite refs 採用が **GO with conditions** 判定。

**(2) decision**:

DEC-019-041 を **resolved by supersede** 状態に遷移させ、ARCH-01 完遂経路を **composite project references** に切り替える。具体的には以下を採択する:

- ① DEC-019-041 status を `partial-resolved` → `resolved by supersede (DEC-019-079)` に formal 遷移
- ② Phase B-2 = TypeScript composite project references を ARCH-01 の formal 解消経路として採択
- ③ harness/tsconfig.json + openclaw-runtime/tsconfig.json `composite: true` 化を物理改変として承認（Round 26 Dev-RR 担当）
- ④ harness → openclaw-runtime 片方向 references 配線を承認（dev-uu-r25-phase-b-2-feasibility.md §4.2 案 X）
- ⑤ paths alias は維持（runtime resolver 経路 = vitest resolve.alias と共存運用継続、開発体験維持目的）
- ⑥ knowledge 系 4 件（KNOW-TS-01〜04）は別 issue として Dev-SS R25 担当で個別解消（composite refs と独立 root cause）
- ⑦ Phase B-2 完遂後の DEC-019-041 final status は `resolved by supersede (DEC-019-079)` で確定

**(3) rationale**:

- TypeScript 公式仕様で cross-project の rootDir 違反を許可する唯一の formal 経路は composite project references = `tsc --build` 経由の incremental build graph で各 project が独立 rootDir を保持する mechanism（公式 doc: https://www.typescriptlang.org/docs/handbook/project-references.html）。
- paths alias 単独では TS6059 5 件を構造的に解消できず、warn 期間（tsconfig.legacy-relax.json）の永続化が技術負債として蓄積するリスク。
- composite refs 採用で TS strict layer の formal クローズ + paths alias 共存で開発体験維持の両立可能（Dev-UU R25 feasibility §2.1 共存可能性 matrix）。
- Round 26 物理化工数は 4-5h（Dev-RR 担当）= Round 26-27 期間内で完遂可能、Phase 2 W5 着手 6/3 直前まで余裕。

**(4) supersede 関係**:

- DEC-019-041 (Round 17 制定) → DEC-019-079 (本議決、Round 25 採決) で supersede
- DEC-019-076 (Phase B 必達クローズ宣言、Round 24 採決想定) は本議決後も保持、ただし C-4 の formal 解消は DEC-019-079 経由で達成と再キャリブレ
- DEC-019-074 ④ (Phase 2 評価可否 GO) + DEC-019-075 ⑥ (Phase 2 W5 着手 trigger) は本議決後も保持

**(5) measurable success criteria**:

| # | 指標 | 目標値 | 測定方法 |
|---|---|---|---|
| M-1 | Phase B-2 物理化完遂 (Round 26) | tsconfig 2 file + package.json 2 file 改変 commit + harness 816 PASS / openclaw-runtime 394 PASS 維持 | git diff + vitest run log |
| M-2 | TS6059 5 件 → 0 件 | tsc --build 出力で TS6059 行ゼロ件 | `tsc --build 2>&1 \| grep -c TS6059` = 0 |
| M-3 | regression 0 厳格達成 | pre 1198 PASS = post 1198 PASS | vitest run reporter=default 比較 |
| M-4 | W3+W4 smoke 95 tests PASS | 9 file 95 tests 全 PASS 維持 | 個別 vitest run |
| M-5 | knowledge 系 4 件 別 issue 化完遂 | KNOW-TS-01〜04 起票 + 解消 | issue tracker + tsc 残件 0 |
| M-6 | DEC-019-041 status resolved by supersede 遷移 | decisions.md DEC-041 セクションに supersede annotation 追加 | grep + DEC-079 ID 参照確認 |

**(6) trigger conditions**（着手条件 Round 26 物理化前）:

- T1: 本議決（DEC-019-079）採決 = Y 採択（Round 25 完遂時）
- T2: 循環依存検証（openclaw-runtime → harness import 0 件確認）= Round 25 中 Dev-UU/VV で実施
- T3: knowledge 系 4 件 別 issue 起票完遂 = KNOW-TS-01〜04 創設 (Round 25 Dev-SS)
- T4: harness 816 PASS / openclaw-runtime 394 PASS の baseline 維持 = Round 25 完遂着地時

T1〜T4 全 satisfy で Round 26 物理化着手 readiness Y。

**(7) verification**（採決後 6 週間以内 = Round 26-28 内検証）:

- V-1: Round 26 物理化完遂報告（Dev-RR R26）= harness 816 + openclaw 394 維持 evidence
- V-2: TS6059 5 件 → 0 件 evidence（tsc --build log）
- V-3: 51 test file vitest run regression 0 evidence
- V-4: knowledge 系 4 件 KNOW-TS-01〜04 解消 evidence（Dev-SS R25-R27）
- V-5: DEC-019-041 status 遷移完遂 evidence（decisions.md DEC-041 supersede annotation）
- V-6: PB-XXX (composite refs パターン) 起票 evidence（Round 26 Knowledge 担当）

**(8) fallback**:

- F-1: feasibility GO with conditions が NO-GO に降下した場合 = DEC-019-079 を取り下げ、DEC-019-041 を partial-resolved 永続維持（warn 期間延長）
- F-2: Round 26 物理化で Gate 1-5 のいずれか FAIL = file system level rollback（dev-uu-r25-phase-b-2-feasibility §9 fallback B-2b）+ DEC-019-079 status を `partially-implemented` に降格
- F-3: 全面 roll-back 必要時 = paths alias only state に復帰、DEC-019-079 取り下げ + DEC-019-041 partial-resolved 維持（fallback B-2c）

**(9) 採決推奨**:

| 採決軸 | Dev-UU R25 推奨 | 根拠 |
|---|---|---|
| ① DEC-019-041 partial-resolved → resolved by supersede 遷移 | **Y 無条件** | DEC-019-076 動議書面 §D で partial-resolved 提案済、本議決で formal supersede 化 |
| ② Phase B-2 composite refs 採択 | **Y 条件付**（feasibility 4 conditions） | dev-uu-r25-phase-b-2-feasibility GO with conditions |
| ③ tsconfig 2 file + package.json 2 file 物理改変承認 | **Y 無条件** | spec dry-run 完了（feasibility §3）、改変 LOC 推定 +13/-2 = 妥当 |
| ④ harness → openclaw-runtime 片方向 references | **Y 無条件** | feasibility §4.2 案 X、循環依存回避 |
| ⑤ paths alias 共存運用継続 | **Y 無条件** | feasibility §2.1 共存可能性 matrix で共存最適解確証 |
| ⑥ knowledge 系 4 件別 issue 化 | **Y 無条件** | feasibility §6 別 root cause 確認、範囲分離 OK |
| ⑦ DEC-019-041 final status resolved by supersede | **Y 無条件**（M-1〜M-6 satisfy 後）| measurable success criteria 6 件全 satisfy で trigger |

**全 7 採決軸 = Y 揃い**

**(10) Round 25 採決 timeline 連動**:

| 日付 | event |
|---|---|
| 2026-05-12 (Round 25 中盤) | PM-R 起案 = 本書面参照で起票 |
| 2026-05-19 (Round 25 中盤) | DEC-074-077 統合採決連動チェック（並行進行） |
| 2026-05-26 (Round 25 完遂前) | レビュー期限、Dev/Review 部門合意 |
| 2026-06-02 (Round 25 完遂時) | 採決日 = Y 揃い 7 軸採択推奨 |
| 2026-06-03 (Round 26 着手) | Phase 2 W5 着手 + Phase B-2 物理化（Dev-RR R26）並行 |
| 2026-06-10 (Round 26 完遂想定) | M-1〜M-4 verification 完遂 |
| 2026-06-17 (Round 27 中盤) | M-5（knowledge 4 件解消）verification 完遂 |
| 2026-06-19 (launch day) | M-6 (DEC-019-041 final status) verification 完遂 |

**(11) refs**:

- DEC-019-041（Round 17 制定 / 本議決で supersede）
- DEC-019-074 ④ Phase 2 評価可否 GO（保持）
- DEC-019-075 ⑥ Phase 2 W5 着手 trigger（保持）
- DEC-019-076 sub-issue close 動議書面（decisions.md line 1234-1342 / 保持）
- DEC-019-078 Round 24 完遂着地宣言（DRAFT, Round 25 採決想定）
- Dev-PP R24 重要発見（dev-pp-r24-arch-01-phase2-main-code-migrate.md §3.4 §3.5）
- Dev-UU R25 feasibility 評価書（dev-uu-r25-phase-b-2-feasibility.md / GO with conditions 判定）
- TypeScript 公式 doc: https://www.typescriptlang.org/docs/handbook/project-references.html
```

## 2. partial-resolved → resolved 経路 詳細

### 2.1 status 遷移 timeline

```
[Round 17 制定]
DEC-019-041 status: confirmed
   │
   ▼ Round 23 Dev-MM Phase 1 完遂（dev/staging migrate）
status: confirmed (継続、Phase A → Phase B 進行中)
   │
   ▼ Round 24 Dev-PP Phase 2 完遂（main code migrate）
status: confirmed (5/6 必達条件 AND 達成、C-4 spec 修正)
   │
   ▼ Round 24 DEC-019-076 sub-issue close 動議書面（decisions.md line 1234-1342）
status: partial-resolved (runtime layer 完遂 / strict layer Phase B-2 escalate / Round 24 動議で提案)
   │
   ▼ Round 25 採決（DEC-074-077 統合採決 / 5/19 想定）
status: partial-resolved (formal 確定)
   │
   ▼ Round 25 Dev-UU feasibility 評価書（GO with conditions 判定）
status: partial-resolved (Phase B-2 採用準備完了)
   │
   ▼ Round 25 DEC-019-079 採決 (本書面起案 / 6/2 想定)
status: resolved by supersede (DEC-019-079) / Round 26 物理化待機
   │
   ▼ Round 26 Phase B-2 物理化（Dev-RR）
M-1〜M-4 verification 完遂
   │
   ▼ Round 27-28 knowledge 4 件解消（Dev-SS）
M-5 verification 完遂
   │
   ▼ Round 28 完遂時
status: fully-resolved (DEC-019-041 全 6 必達条件 AND 達成、ARCH-01 全完遂)
```

### 2.2 partial-resolved の formal 定義（本書面で新規導入）

```
status: partial-resolved
意味: 議決の必達条件のうち一部が達成 + 残りは別経路（supersede / fork / escalate）で解消予定
       resolved に到達せず、新規導入の中間状態
適用条件:
  (a) 必達条件の 50% 以上が達成済（DEC-019-041 では 5/6 = 83%）
  (b) 残条件の formal 解消経路が別議決として識別済（DEC-019-079 = composite refs）
  (c) 残条件の解消 timeline が明示（Round 26-28 物理化）
```

DEC-019-XYZ（resolved by supersede ID）採決後に **resolved by supersede** へ自動遷移、partial-resolved 状態は中間 marker として履歴に保持。

### 2.3 resolved 到達条件

DEC-019-041 が **fully-resolved** に到達する条件:

| # | 条件 | satisfy timeline |
|---|---|---|
| R-1 | runtime layer 完遂（C-1, C-2, C-3, C-5, C-6 = 5 条件 AND） | **済**（Round 24 Dev-PP）|
| R-2 | TS strict layer C-4 解消（DEC-019-079 経由）| Round 26 完遂時 |
| R-3 | knowledge 系 4 件 別 issue 解消（KNOW-TS-01〜04）| Round 27-28 完遂時 |
| R-4 | DEC-019-041 status `resolved by supersede` 遷移 | Round 28 完遂時 |
| R-5 | ARCH-01 全完遂宣言（PM 部門起案）| Round 28 完遂時 |

R-1〜R-5 全 satisfy = DEC-019-041 fully-resolved + ARCH-01 closure 達成。

## 3. 番号付与候補（DEC-079 vs DEC-080）

### 3.1 候補 比較

| 候補 | timing | trade-off |
|---|---|---|
| **DEC-019-079**（推奨） | Round 25 中盤起案、Round 25 完遂時採決 | DEC-078 直後 = Round 25 採決 timeline 自然 / Phase 2 W5 着手 6/3 直前で R26 物理化 readiness 確証 / 議決構造 41→42 件 |
| DEC-019-080 | Round 25 完遂後起案、Round 26 採決 | DEC-079 を別議決（例: knowledge 系 別 issue 創設議決 KNOW-TS-master）に preserve / Phase B-2 物理化が Round 26-27 にずれる / R26 物理化 readiness が議決依存 |

### 3.2 推奨理由（DEC-019-079）

1. **timeline 自然**: Round 25 採決 timeline で DEC-078（Round 24 完遂着地宣言）→ DEC-079（Phase B-2 採択）→ DEC-080+（Round 26 以降の議決）の番号順序が論理連続
2. **R26 着手 readiness**: Round 25 完遂時（6/2）採決 = Round 26 着手 6/3 直前で trigger T1 即時 satisfy
3. **議決構造拡大率**: 41 件 → 42 件 = +2.4% / Round 25 自然増分
4. **Phase 2 W5 着手連動**: Phase 2 W5 着手 6/3 と Phase B-2 物理化 6/3-6/10 が並行進行可能

### 3.3 reserved 用途（DEC-019-080）

DEC-019-079 採用時、DEC-019-080 は以下用途で reserved:
- 候補 A: knowledge 系 4 件 別 issue 創設議決（KNOW-TS-master 議決、Dev-SS R25 起案候補）
- 候補 B: PB-XXX (composite refs パターン) Knowledge 部門 mature 議決
- 候補 C: ARCH-01 全完遂宣言議決（Round 28 想定）

→ Round 25 後段-Round 28 の議決計画として preserve。

## 4. PM-R Round 25 起案連動 SOP

### 4.1 起案 step

```
Step 1 (Round 25 中盤、5/12 想定):
  PM-R が本書面 §1 起案文 draft を decisions.md 末尾（line 1467 以降）に append-only で追加
  ↓
Step 2 (Round 25 中盤、5/12 直後):
  起案完遂報告 (pm-r-r25-dec-079-issuance.md) で起案 evidence
  ↓
Step 3 (Round 25 中盤、5/19 想定):
  DEC-074-077 統合採決連動チェック（並行進行、本議決はまだ採決対象外）
  ↓
Step 4 (Round 25 完遂前、5/26 想定):
  Review 部門レビュー期限、Dev 部門合意確認
  ↓
Step 5 (Round 25 完遂時、6/2 想定):
  採決日 = Y 揃い 7 軸採択
  ↓
Step 6 (Round 25 完遂直後、6/2-6/3):
  decisions.md 採決結果反映、status DRAFT → confirmed
  Round 26 物理化 trigger 4 条件 satisfy 確認
```

### 4.2 起案文 配置先

`projects/PRJ-019/decisions.md` 末尾に append-only。現状最終 entry は DEC-019-078（DRAFT, line 1344-）+ DEC-019-076 sub-issue close 動議書面（line 1234-1342）。

PM-R 起案時は DEC-019-078 の直後（line 1467 以降想定）に DEC-019-079 セクションを追加。本書面 §1 の draft をそのまま貼付可能。

### 4.3 起案文 LOC 推定

本書面 §1 起案文 = 約 110 行（タイトル + (1)〜(11) section）= decisions.md 行数 1467 → 1577 想定（+110）。

## 5. 制約遵守 status

| 制約 | 遵守 status |
|---|---|
| harness 816 PASS 必達維持（読み取りのみ）| **達成** / 本書面で実改変 0 件 |
| API 追加コスト $0 | **達成** / Read + Write のみ |
| 副作用 0 | **達成** / file 改変は本書面 1 file のみ（reports 配下） |
| 絵文字 0 | **達成** / 本書面全体絵文字なし |
| DEC-019-041 + 076 absolute 無改変 | **達成** / decisions.md 改変ゼロ、本書面は新規起案 draft（PM-R 採用時に decisions.md へ append） |
| Phase 1 移行済 file absolute 無改変 | **達成** |
| W4 historical baseline files absolute 無改変 | **達成** |
| 4 control 実装 absolute 無改変 | **達成** |
| fix forward-only 厳守 | **達成** / 本書面は新規作成 |

## 6. 結語

DEC-019-079（or DEC-019-080）= ARCH-01 Phase B-2 採用 + DEC-019-041 supersede 議決の起案文 draft を本書面で完成。PM-R Round 25 中盤（2026-05-12 想定）起票 + Round 25 完遂時（2026-06-02 想定）採決 = Y 揃い 7 軸採択推奨。採決後 Round 26 着手 trigger 4 条件 satisfy で Phase B-2 物理化（Dev-RR R26）に円滑遷移。

DEC-019-041 status: confirmed → partial-resolved → resolved by supersede (DEC-019-079) → fully-resolved の 4 段階遷移経路を本書面で formal 化、Round 28 ARCH-01 全完遂宣言まで連続。

## 7. 関連 file 参照

- 本書面（supersede 議決起案文）: `projects/PRJ-019/reports/dev-uu-r25-dec-041-supersede-statement.md`
- 姉妹: `projects/PRJ-019/reports/dev-uu-r25-phase-b-2-feasibility.md`（feasibility GO with conditions）
- 姉妹: `projects/PRJ-019/reports/dev-uu-r25-summary.md`（Round 25 Dev 総括）
- 前提: `projects/PRJ-019/reports/dev-pp-r24-arch-01-phase2-main-code-migrate.md`（Round 24 重要発見）
- 議決参照（読み取りのみ）: `projects/PRJ-019/decisions.md` line 1234-1342（DEC-019-076 sub-issue close 動議）
- 議決参照（読み取りのみ）: `projects/PRJ-019/decisions.md` line 1344-（DEC-019-078 DRAFT, Round 25 採決想定）
- TypeScript 公式仕様 reference: https://www.typescriptlang.org/docs/handbook/project-references.html

---

**SOP 順守**: 本書面は Round 25 DEC-019-079 起案 draft + supersede 経路 spec のみ。DEC-019-041 + 076 absolute 無改変 (read-only)。decisions.md への actual append は PM-R Round 25 中盤起票 step で実施 (Dev-UU は draft 提供のみ)。harness 816 PASS / openclaw 394 PASS baseline は本書面実施期間中も完全維持。fix forward-only 厳守 (本書面は新規 file 作成、既存 file 無改変)。
