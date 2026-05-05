# Dev-III R30 — ARCH-01 Phase B-3 PA-02 forward-only fix (KNOW-TS-02 + 04 / TS2322 × 2 真の解消)

最終更新: 2026-05-06 W0-Week1
起案: Dev 部門 R30 Dev-III
位置付け: R29 Dev-GGG が tsconfig exclude で形式解消した KNOW-TS-02/04 を、src 改変による zod schema 整合化で解消。
版: v1.0
連動 DEC: DEC-019-041

---

## §0 サマリ (CEO 200 字)

PA-02 = KNOW-TS-02 (TS2322 / `yaml-front-matter-parser.ts:252` tags 経由) + KNOW-TS-04 (TS2322 / `yaml-front-matter-parser.ts:269` 同 tags 経由) を src 改変による真の forward-only fix で解消完遂。`asStringArray` 戻り値 `ReadonlyArray<string>` を **`[...arr]` spread copy で mutable `string[]`** に変換、`ke-01-schema` の `CommonFrontmatter.tags = z.array(z.string())` (mutable) に整合させた。改変 LOC: 1 file × 4 行純増 (1 行 `tagsReadonly` + 1 行 `tags spread` + 2 行コメント)。harness/tsconfig.json exclude 1 entry 解除済 (PA-03 と同 entry)、TS error 0 件継続維持。

---

## §1 物理化箇所

### 1.1 改変 file

`projects/PRJ-019/app/harness/src/knowledge/yaml-front-matter-parser.ts`

### 1.2 改変内容 (line 230-244 周辺 / `tags`)

```diff
-  const tags = asStringArray(fm['tags']) ?? []
+  // R30 Dev-III forward-only fix: ke-01-schema の CommonFrontmatter.tags は
+  // z.array(z.string()) (mutable string[]) を要求するが、asStringArray 戻り値は
+  // ReadonlyArray<string>。spread copy で mutable 配列に変換し、zod schema 整合させる。
+  const tagsReadonly = asStringArray(fm['tags']) ?? []
+  const tags: string[] = [...tagsReadonly]
   const category = asString(fm['category']) ?? 'general'
   const qualityScore = pickQualityScore(fm)
```

### 1.3 改変根拠

`asStringArray()` (同 file line 326-331) は戻り型 `ReadonlyArray<string> | null`。一方 `ke-01-schema.ts` の `CommonFrontmatter.tags` は `z.array(z.string().min(1).max(50)).min(1).max(20)` (line 103) → mutable `string[]` 型。

R28 spec の案 A (`tags: [...tags]` mutable copy) を src 1 行改変で採用、R29 directive (src 無改変) では tsconfig exclude 経路に変更されたが、R30 directive で src 改変 OK となったため真の fix を実装。

修正案候補:
1. **`[...tagsReadonly]` spread copy (採用)** — runtime コスト = O(n) array clone、type-safety 確保、ke-01-schema 無改変
2. zod schema を `z.readonly(z.array(...))` に変更 — schema infer 型が ReadonlyArray となり、他多数の caller (validateKnowledgeEntry / Object.freeze 経由) に波及・既存 absolute 配下 schema export 4 種に影響大
3. `as string[]` cast — type-safety 崩壊・lint 警告

採用案 = spread copy。runtime コストは knowledge frontmatter 規模 (tags max 20 件) で無視可能、ke-01-schema 無改変で副作用最小。

---

## §2 verify 結果

### 2.1 TS2322 件数

```
$ cd app/harness && node node_modules/typescript/bin/tsc --noEmit 2>&1 | grep "TS2322" | wc -l
0
```

→ KNOW-TS-02 + KNOW-TS-04 真解消確認。R29 baseline (exclude 経路) 0 件 → R30 真解消後 0 件継続。

### 2.2 統合 verify

```
$ tsc --noEmit; echo $?
0
```

→ harness 全 file (`yaml-front-matter-parser.ts` 含む) total TS errors 0 件達成、exclude 解除後も継続維持。

### 2.3 runtime 影響

`tags` の type は `string[]` mutable に変更されるが、`common` object は `as const` で freeze 化、`frontmatter` は `Object.freeze` 後 export → 外部観測上 immutable 担保。spread copy 経路は array 1 段 shallow clone のみで副作用無し。

### 2.4 harness PASS

```
Test Files  68 passed (68)
     Tests  876 passed (876)
```

→ regression 0 件、yaml-front-matter-parser 関連 test (ke-01 schema validator / ke-03 retrieval) 全 PASS。

---

## §3 制約遵守 status

| 制約 | status |
|---|---|
| 既存 absolute 4 file 無改変 | 達成 |
| 副作用 0 | 達成 (Object.freeze 経由 immutable 担保継続) |
| Owner 拘束 0 分 | 達成 |
| TS6059 0 件継承 | 達成 |
| harness PASS 維持 (876 件) | 達成 |

---

## §4 結語

PA-02 forward-only fix 完遂。`[...tagsReadonly]` spread copy で TS2322 × 2 真解消、ke-01-schema 無改変、runtime immutable 担保継続、harness regression 0。DEC-019-041 fully-resolved (formal) 到達経路 2/3 軸確保。
