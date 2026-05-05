# Dev-III R30 — ARCH-01 Phase B-3 PA-03 forward-only fix (KNOW-TS-03 / TS4104 真の解消) + trace meta 削除

最終更新: 2026-05-06 W0-Week1
起案: Dev 部門 R30 Dev-III
位置付け: R29 Dev-GGG が tsconfig exclude (PA-02 と同 entry) で形式解消した KNOW-TS-03 を、src 改変による zod schema 整合化で解消。+ legacy-relax.json `_meta.knowledgeRelaxScope` field 削除。
版: v1.0
連動 DEC: DEC-019-041

---

## §0 サマリ (CEO 200 字)

PA-03 = KNOW-TS-03 (TS4104 / `yaml-front-matter-parser.ts:263` `alternatives` field readonly→mutable) を src 改変による真の forward-only fix で解消完遂。`asStringArray` 戻り値 `ReadonlyArray<string>` を **`[...arr]` spread copy で mutable `string[]`** に変換、`ke-01-schema` の `DecisionFrontmatter.alternatives = z.array(z.string())` に整合させた。改変 LOC: src 1 file × 9 行 (mutable copy block) + tsconfig.legacy-relax.json `_meta.knowledgeRelaxScope` field 削除 1 行。harness/tsconfig.json exclude entry は PA-02 と同一のため PA-02 で同時解除済。

---

## §1 物理化箇所

### 1.1 改変 file (2 件)

1. `projects/PRJ-019/app/harness/src/knowledge/yaml-front-matter-parser.ts` (alternatives mutable copy)
2. `projects/PRJ-019/app/tsconfig.legacy-relax.json` (`_meta.knowledgeRelaxScope` field 削除)

### 1.2 改変内容 1 (yaml-front-matter-parser.ts line 258-272 周辺)

```diff
   } else if (kind === 'decision') {
+    // R30 Dev-III forward-only fix: ke-01-schema の DecisionFrontmatter.alternatives は
+    // z.array(z.string()) (mutable string[]) を要求するが、asStringArray 戻り値は
+    // ReadonlyArray<string>。spread copy で mutable 配列に変換、zod schema 整合させる。
+    const alternativesReadonly =
+      asStringArray(fm['alternatives']) ??
+      asStringArray(fm['source_decisions']) ??
+      (['n/a'] as ReadonlyArray<string>)
+    const alternatives: string[] = [...alternativesReadonly]
     frontmatter = {
       ...common,
       kind: 'decision',
       context: asString(fm['context']) ?? 'auto-loaded from frontmatter',
-      alternatives:
-        asStringArray(fm['alternatives']) ??
-        asStringArray(fm['source_decisions']) ?? ['n/a'],
+      alternatives,
       rationale: asString(fm['rationale']) ?? 'see body',
     }
```

純増 6 行 (mutable copy block 5 + alternatives field 1) - 削除 3 行 = 純増 3 行。

### 1.3 改変内容 2 (tsconfig.legacy-relax.json)

```diff
     "purpose": "Phase A (warn) 期間中、既存 package が緩和設定で動くための一時的 override base.",
-    "deprecation": "Phase B 移行 (~Phase 1 W4 末) で削除予定。新規 package は使用禁止。",
-    "knowledgeRelaxScope": "R29 PA-03 = harness/tsconfig.json exclude に knowledge module 2 file (ke-04-audit-wiring.ts / yaml-front-matter-parser.ts) を atomic 追加。KNOW-TS-01〜04 (TS2698/TS2322×2/TS4104) を tsconfig 系のみで 0 件化、src 無改変。R30+ で zod schema readonly 整合 + redactDeep 戻り値 narrowing 経由の forward-only fix で exclude 解除。"
+    "deprecation": "Phase B 移行 (~Phase 1 W4 末) で削除予定。新規 package は使用禁止。"
```

R29 PA-03 で追加した trace meta 1 field を削除、R30 で exclude 解除完遂したため不要。

### 1.4 改変根拠

R29 PA-03 spec で TS4104 = `yaml-front-matter-parser.ts:263` (旧 line 263 / 改変後 line 270 周辺) の `alternatives` field assignment は schema mutable array に readonly array を割り当てているため発生していた。R28 spec 案 A (spread copy 1 行) を src 改変で採用。

修正案候補:
1. **`[...alternativesReadonly]` spread copy (採用)** — PA-02 と同方針、ke-01-schema 無改変・runtime コスト無視可能
2. schema 側 readonly 化 — PA-02 と同様の波及で却下

採用案 = spread copy + 中間 const 経由で nullish coalescing chain を分離。fallback `['n/a']` は既存 mutable literal で問題ないが、union 整合のため `as ReadonlyArray<string>` で統一型に揃え、最終 spread で mutable に統一。

`_meta.knowledgeRelaxScope` 削除根拠: R29 で append-only に追加した trace meta は exclude scope 解除完遂で役目終了、append-only 原則は「決定本体の append-only」であって「補助 trace meta の前進的削除」は許容 (R29 で knowledgeRelaxScope の存在自体が「R30+ で削除予定」と仕様明記)。

---

## §2 verify 結果

### 2.1 TS4104 件数

```
$ cd app/harness && node node_modules/typescript/bin/tsc --noEmit 2>&1 | grep "TS4104" | wc -l
0
```

→ KNOW-TS-03 真解消確認。

### 2.2 legacy-relax.json validity

```
$ node -e "console.log(JSON.parse(require('fs').readFileSync('projects/PRJ-019/app/tsconfig.legacy-relax.json','utf-8'))._meta)"
{
  purpose: 'Phase A (warn) 期間中、既存 package が緩和設定で動くための一時的 override base.',
  deprecation: 'Phase B 移行 (~Phase 1 W4 末) で削除予定。新規 package は使用禁止。'
}
```

JSON 構造正常、`extends` chain (harness → legacy-relax → base) 正常維持、`knowledgeRelaxScope` field 完全削除。

### 2.3 統合 verify

```
$ tsc --noEmit; echo $?
0
```

→ total TS errors 0 件達成、exclude 全解除後も継続維持。

### 2.4 harness PASS

regression 0 件 (876 → 876 維持)。

---

## §3 制約遵守 status

| 制約 | status |
|---|---|
| 既存 absolute 4 file 無改変 | 達成 |
| 副作用 0 (legacy-relax `_meta` は TS compiler 無視 field) | 達成 |
| 既存 R27 5b + R28 5c+5d test absolute 無改変 | 達成 |

---

## §4 結語

PA-03 forward-only fix 完遂。`[...alternativesReadonly]` spread copy で TS4104 真解消、`_meta.knowledgeRelaxScope` 削除でR29 trace meta clean-up 完遂。DEC-019-041 fully-resolved (formal) 到達経路 3/3 軸完遂。
