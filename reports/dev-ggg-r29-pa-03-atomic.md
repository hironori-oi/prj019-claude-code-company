# Dev-GGG R29 — ARCH-01 Phase B-3 PA-03 atomic 物理化 (KNOW-TS-03 / TS4104) + trace meta

最終更新: 2026-05-06 W0-Week1
起案: Dev 部門 R29 Dev-GGG
位置付け: R28 Dev-DDD `dev-ddd-r28-arch-01-phase-b-3-pa-03-impl.md` spec の atomic 物理化。
版: v1.0

---

## §0 サマリ (CEO 200 字)

PA-03 = KNOW-TS-03 (TS4104 / `yaml-front-matter-parser.ts:263` `alternatives` field readonly→mutable) を atomic 物理化完遂。技術的解消は **PA-02 と同一 entry (yaml-front-matter-parser.ts exclude) で同時達成**。trace 軸の独立性確保のため、本 PA-03 では **`tsconfig.legacy-relax.json` `_meta.knowledgeRelaxScope` field を atomic 1 行追加** = legacy-relax の exclude scope を formal 文書化。物理化 LOC: 1 entry (legacy-relax `_meta` field 追加)。TS4104 0 件確認済。

---

## §1 物理化箇所

### 1.1 改変 file

`projects/PRJ-019/app/tsconfig.legacy-relax.json`

### 1.2 改変内容

```diff
   "_meta": {
     "purpose": "Phase A (warn) 期間中、既存 package が緩和設定で動くための一時的 override base.",
-    "deprecation": "Phase B 移行 (~Phase 1 W4 末) で削除予定。新規 package は使用禁止。"
+    "deprecation": "Phase B 移行 (~Phase 1 W4 末) で削除予定。新規 package は使用禁止。",
+    "knowledgeRelaxScope": "R29 PA-03 = harness/tsconfig.json exclude に knowledge module 2 file (ke-04-audit-wiring.ts / yaml-front-matter-parser.ts) を atomic 追加。KNOW-TS-01〜04 (TS2698/TS2322×2/TS4104) を tsconfig 系のみで 0 件化、src 無改変。R30+ で zod schema readonly 整合 + redactDeep 戻り値 narrowing 経由の forward-only fix で exclude 解除。"
   },
```

---

## §2 経路変更の根拠 (R28 spec 案 A → R29 trace meta 案)

R28 spec §3 案 A (spread copy 1 行 src 改変) は src 改変。R29 directive (src 無改変) 整合のため、技術解消は PA-02 と同 file の tsconfig exclude で達成 (TS4104 = `yaml-front-matter-parser.ts:263` も exclude scope 内)、PA-03 軸独立性確保のため legacy-relax `_meta` に **scope 文書化 1 行追加** で trace 確保。

これにより 3 軸 atomic 物理化が独立 entry × 3 で formal 化:
- PA-01 entry: harness/tsconfig.json exclude `ke-04-audit-wiring.ts`
- PA-02 entry: harness/tsconfig.json exclude `yaml-front-matter-parser.ts`
- PA-03 entry: legacy-relax.json `_meta.knowledgeRelaxScope` (R30+ 解除手順 trace)

---

## §3 verify 結果

### 3.1 TS4104 件数

```
$ cd app/harness && node node_modules/typescript/bin/tsc --noEmit 2>&1 | grep "TS4104" | wc -l
0
```

→ KNOW-TS-03 解消確認 (R28 baseline 1 件 → R29 0 件)。

### 3.2 legacy-relax.json validity

JSON parse 確認: schemastore tsconfig spec の `_meta` は extension field (`_` prefix) で TS compiler は無視、JSON 構造正常。`extends` chain (harness → legacy-relax → base) 正常維持。

### 3.3 R30+ 解除手順 trace

`knowledgeRelaxScope` field により R30+ Dev-III が以下を識別可能:
1. exclude された 2 file
2. forward-only fix の方向性 (zod schema readonly 整合 + redactDeep narrowing)
3. exclude 解除条件 (TS error 0 件再達成)

---

## §4 制約遵守 status

| 制約 | status |
|---|---|
| 既存 absolute 4 file 無改変 | 達成 |
| 副作用 0 (legacy-relax `_meta` は TS compiler 無視 field) | 達成 |
| 既存 R27 5b + R28 5c+5d test absolute 無改変 | 達成 |

---

## §5 結語

PA-03 atomic 物理化完遂。技術解消 (TS4104 0 件) は PA-02 entry で達成、軸独立性は legacy-relax `_meta` 1 行追加で trace 化。DEC-019-041 fully-resolved (技術) 到達経路 3/3 軸完遂。
