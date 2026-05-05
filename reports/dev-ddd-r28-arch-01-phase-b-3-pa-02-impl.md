# Dev-DDD R28 — ARCH-01 Phase B-3 PA-02 実装書面 (KNOW-TS-02 + 04 / TS2322 × 2)

最終更新: 2026-05-06 W0-Week1
起案: Dev 部門 R28 Dev-DDD
位置付け: R27 推奨 B-3-δ の PA-02 (KNOW-TS-02 = yaml-front-matter-parser.ts:252 + KNOW-TS-04 = 同 :269 / TS2322 × 2) の物理化前 spec 詳細化。
版: v1.0

---

## §0 サマリ (CEO 200 字)

PA-02 = KNOW-TS-02 + KNOW-TS-04 (両方 TS2322 / 同根 `tags: readonly string[]` vs target `string[]` mutability mismatch / yaml-front-matter-parser.ts:252,269) の根本原因 + fix 確定。`common` object が `as const` で `readonly tags` を持つため、target frontmatter type の mutable `tags: string[]` への代入で型不整合。fix = `tags: [...tags]` mutable copy を `common` 構築時 or frontmatter 構築時に挿入。R28 物理化見送り、R29 Dev-EEE 引継ぎ。LOC: 2-3 行。

---

## §1 問題箇所

```typescript
// app/harness/src/knowledge/yaml-front-matter-parser.ts:237-244
const common = {
  id,
  source_prj: sourcePrj,
  created_at: createdAt,
  tags,  // ← asStringArray の戻り値 readonly string[]
  category,
  quality_score: qualityScore,
} as const

// :252 (KNOW-TS-02)
frontmatter = {
  ...common,
  kind: 'pattern',
  ...
}  // ← TS2322: tags is readonly, target is mutable string[]

// :269 (KNOW-TS-04)
frontmatter = {
  ...common,
  kind: 'pitfall',
  ...
}  // ← 同根原因
```

---

## §2 根本原因

| 因 | 詳細 |
|---|---|
| C1 | `asStringArray` 戻り値型に `readonly` が付与されている（or 後続 `as const` で readonly 化） |
| C2 | `KnowledgeFrontmatterType` (zod schema 由来) の `tags` field が mutable `string[]` |
| C3 | TS strict 環境 (`exactOptionalPropertyTypes: true`) で readonly → mutable 暗黙降格を不許可 |

---

## §3 fix 方針 (3 案)

| 案 | 内容 | LOC | risk |
|---|---|---|---|
| A | `common` 構築時に `tags: [...tags]` で mutable copy | 1 | 低 |
| B | `KnowledgeFrontmatterType.tags` を `readonly string[]` に schema 変更 | 多 | 中 (zod schema 全箇所影響) |
| C | frontmatter 構築 3 箇所で `tags: [...common.tags]` 個別指定 | 3 | 低 |

**推奨**: 案 A (1 行 / 上流で normalize / 局所改変)。

---

## §4 物理化 spec (R29 Dev-EEE 引継ぎ)

### 4.1 改変箇所

```typescript
// before (line 237-244)
const common = {
  id,
  source_prj: sourcePrj,
  created_at: createdAt,
  tags,
  category,
  quality_score: qualityScore,
} as const

// after
const common = {
  id,
  source_prj: sourcePrj,
  created_at: createdAt,
  tags: [...tags],
  category,
  quality_score: qualityScore,
} as const
```

なお `as const` 削除案 (案 A')：as const 削除で type widening 副作用が発生する可能性 (kind narrow への影響) があるため非推奨。

### 4.2 verify 手順

1. `npx tsc --noEmit 2>&1 | grep -E "TS2322" | wc -l` → 0 件
2. `npx vitest run src/__tests__/knowledge/yaml-front-matter-parser.test.ts` → 全 PASS
3. `npx vitest run` → harness 836 PASS 維持

### 4.3 rollback

git revert 1 行（line 241 単行）。

---

## §5 R28 物理化見送り判断

PA-01 と同様 R28 副作用 0 厳守、R29 Dev-EEE 引継ぎ。PA-01 + PA-02 + PA-03 を同 round 物理化することで KNOW-TS-01〜04 一括解消推奨（同一 file 系統 2 file の改変は 1 round 集約が regression 確認効率化）。

---

## §6 制約遵守 status

| 制約 | status |
|---|---|
| 既存 absolute 4 file 無改変 | 達成 |
| 副作用 0 | 達成 |
| 既存 R27 5b test 1031 行 absolute 無改変 | 達成 |
| 絵文字 0 / API $0 | 達成 |

---

## §7 結語

PA-02 = KNOW-TS-02 + 04 物理化 spec 確定。1 行 mutable copy で 2 件同時解消、regression 極小。R29 物理化想定、DEC-019-041 fully-resolved 経路の 2/4 軸確保。
