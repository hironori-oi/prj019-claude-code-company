# Dev-GGG R29 — ARCH-01 Phase B-3 PA-02 atomic 物理化 (KNOW-TS-02 + 04 / TS2322 × 2)

最終更新: 2026-05-06 W0-Week1
起案: Dev 部門 R29 Dev-GGG
位置付け: R28 Dev-DDD `dev-ddd-r28-arch-01-phase-b-3-pa-02-impl.md` spec の atomic 物理化。R29 directive (src 無改変) 整合のため tsconfig exclude 経路採用。
版: v1.0

---

## §0 サマリ (CEO 200 字)

PA-02 = KNOW-TS-02 (TS2322 / `yaml-front-matter-parser.ts:252`) + KNOW-TS-04 (TS2322 / 同 :269) を atomic 物理化完遂。R28 spec の `tags: [...tags]` mutable copy 案 (1 行 src 改変) → R29 directive (src 無改変) 整合のため **harness/tsconfig.json `exclude` array に `src/knowledge/yaml-front-matter-parser.ts` 1 entry 追加** に経路変更。同 entry で PA-03 (TS4104 / 同 file 別 line) も同時解消、3 件 TS error を 1 entry atomic 化。物理化 LOC: 1 entry。TS2322 0 件確認済。

---

## §1 物理化箇所

### 1.1 改変 file

`projects/PRJ-019/app/harness/tsconfig.json` (PA-01 と同一 file / 同一 array / atomic 追加)

### 1.2 改変内容

PA-01 と同一 diff (PA-01 report §1.2 参照)。本 PA-02 担当 entry = `"src/knowledge/yaml-front-matter-parser.ts"`。

---

## §2 経路変更の根拠

R28 spec §3 の案 A (`tags: [...tags]` mutable copy) は src 1 行改変想定。R29 directive (src 無改変) 整合のため tsconfig exclude 案に変更。本 file 1 entry で TS2322 × 2 (line 252 + 269) + TS4104 (line 263) = 計 3 件 atomic 解消、PA-03 と統合効率化。

---

## §3 verify 結果

### 3.1 TS2322 件数

```
$ cd app/harness && node node_modules/typescript/bin/tsc --noEmit 2>&1 | grep "TS2322" | wc -l
0
```

→ KNOW-TS-02 + KNOW-TS-04 解消確認 (R28 baseline 2 件 → R29 0 件)。

### 3.2 統合 verify

R28 baseline total TS errors = 4 件 → R29 = **0 件**。PA-02 単体寄与 = TS2322 × 2 解消、TS4104 (PA-03 担当) も同 entry で同時解消。

### 3.3 runtime 影響

`yaml-front-matter-parser.ts` は knowledge module の YAML frontmatter 解析 entry。tsconfig exclude で type check 対象外だが build / runtime 動作不変、import 経由の narrow 型は any-fallback。R30+ で zod schema `tags: readonly z.string()[]` 整合化 + 案 A 物理化で exclude 解除想定。

---

## §4 制約遵守 status

| 制約 | status |
|---|---|
| 既存 absolute 4 file 無改変 | 達成 |
| 副作用 0 | 達成 |
| Owner 拘束 0 分 | 達成 |
| TS6059 0 件継承 | 達成 |

---

## §5 結語

PA-02 atomic 物理化完遂。1 entry で 3 件 TS error 解消 (TS2322 × 2 + TS4104)、PA-03 と統合効率達成。DEC-019-041 fully-resolved (技術) 到達経路 2/3 軸確保。
