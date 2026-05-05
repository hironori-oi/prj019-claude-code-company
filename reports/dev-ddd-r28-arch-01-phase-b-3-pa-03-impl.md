# Dev-DDD R28 — ARCH-01 Phase B-3 PA-03 実装書面 (KNOW-TS-03 / TS4104)

最終更新: 2026-05-06 W0-Week1
起案: Dev 部門 R28 Dev-DDD
位置付け: R27 推奨 B-3-δ の PA-03 (KNOW-TS-03 = TS4104 / yaml-front-matter-parser.ts:263) の物理化前 spec 詳細化。
版: v1.0

---

## §0 サマリ (CEO 200 字)

PA-03 = KNOW-TS-03 (TS4104 = `The type 'readonly string[]' is 'readonly' and cannot be assigned to the mutable type 'string[]'.` / yaml-front-matter-parser.ts:263 / `alternatives` field) の根本原因 + fix 確定。`asStringArray(fm['alternatives']) ?? asStringArray(fm['source_decisions']) ?? ['n/a']` 三項 nullish chain で `readonly` 型混入、target は mutable。fix = 末尾に `as string[]` 1 行 / または明示 spread copy。LOC 1 行。R29 Dev-EEE 引継ぎ。

---

## §1 問題箇所

```typescript
// app/harness/src/knowledge/yaml-front-matter-parser.ts:258-267
} else if (kind === 'decision') {
  frontmatter = {
    ...common,
    kind: 'decision',
    context: asString(fm['context']) ?? 'auto-loaded from frontmatter',
    alternatives:                       // ← line 263 TS4104
      asStringArray(fm['alternatives']) ??
      asStringArray(fm['source_decisions']) ?? ['n/a'],
    rationale: asString(fm['rationale']) ?? 'see body',
  }
}
```

エラー:
```
src/knowledge/yaml-front-matter-parser.ts(263,7): error TS4104:
  The type 'readonly string[]' is 'readonly'
  and cannot be assigned to the mutable type 'string[]'.
```

---

## §2 根本原因

`asStringArray` の戻り値型が `readonly string[] | undefined` で、`?? ['n/a']` fallback の literal `['n/a']` は mutable `string[]` だが、union 結果が `readonly string[] | string[]` = `readonly string[]` に widening される TS 仕様。target frontmatter `alternatives: string[]` への代入で TS4104。

---

## §3 fix 方針 (3 案)

| 案 | 内容 | LOC | risk |
|---|---|---|---|
| A | `alternatives` 値を `[...(asStringArray(...) ?? asStringArray(...) ?? ['n/a'])]` で mutable copy | 1 | 低 |
| B | `asStringArray` 戻り値型を `string[]` に変更 (上流 normalize) | 多 | 中 |
| C | 末尾 `as string[]` assertion | 1 | 低 |

**推奨**: 案 A (spread copy / mutable 化が runtime 安全 / 1 行)。

---

## §4 物理化 spec (R29 Dev-EEE 引継ぎ)

### 4.1 改変箇所

```typescript
// before (line 263-265)
alternatives:
  asStringArray(fm['alternatives']) ??
  asStringArray(fm['source_decisions']) ?? ['n/a'],

// after
alternatives: [
  ...(asStringArray(fm['alternatives']) ??
      asStringArray(fm['source_decisions']) ??
      ['n/a']),
],
```

### 4.2 verify 手順

1. `npx tsc --noEmit 2>&1 | grep "TS4104" | wc -l` → 0 件
2. `npx vitest run src/__tests__/knowledge/yaml-front-matter-parser.test.ts` → 全 PASS

### 4.3 rollback

git revert (line 263-265 small block)。

---

## §5 PA-01〜03 統合物理化推奨

KNOW-TS-01〜04 は同一 knowledge module 系の 2 file (ke-04-audit-wiring.ts + yaml-front-matter-parser.ts) に集約しており、R29 物理化は **PA-01 + PA-02 + PA-03 を 1 round 集約** が:

- 同 file 触れる回数最小化 (yaml-front-matter-parser.ts は PA-02 + PA-03 同時改変)
- regression verify 1 回で済む (vitest run 1 回)
- DEC-019-041 fully-resolved 到達条件「TS error 0 件」を atomic に達成

工数想定: PA-01 (1 行) + PA-02 (1 行) + PA-03 (1 行) = 計 3 行 / verify 込 30 分。

---

## §6 制約遵守 status

| 制約 | status |
|---|---|
| 既存 absolute 4 file 無改変 | 達成 |
| 副作用 0 | 達成 |
| 既存 R27 5b test 1031 行 absolute 無改変 | 達成 |

---

## §7 結語

PA-03 = KNOW-TS-03 物理化 spec 確定。1 行 spread copy で fix。PA-01〜03 は R29 atomic 物理化推奨、DEC-019-041 fully-resolved 到達経路 3/4 軸確保 (4/4 軸 = PA-02 内 KNOW-TS-04 同時解消で完遂)。
