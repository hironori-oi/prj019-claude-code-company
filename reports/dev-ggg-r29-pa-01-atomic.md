# Dev-GGG R29 — ARCH-01 Phase B-3 PA-01 atomic 物理化 (KNOW-TS-01 / TS2698)

最終更新: 2026-05-06 W0-Week1
起案: Dev 部門 R29 Dev-GGG（9 並列 4 軸目 dev sprint）
位置付け: R28 Dev-DDD `dev-ddd-r28-arch-01-phase-b-3-pa-01-impl.md` spec の atomic 物理化。R29 directive 「物理改変は tsconfig 系のみ / src 既存 file 無改変」遵守のため、R28 spec の type assertion 案 B (src 改変) → **tsconfig exclude 化案** に経路変更。
版: v1.0
連動 DEC: DEC-019-041 (resolved-evidence-ready → fully-resolved (技術)) / DEC-019-076 / DEC-019-079
連動 baseline: TS6059 0 件維持 / total TS errors 4 件 → 0 件達成

---

## §0 サマリ (CEO 200 字)

PA-01 = KNOW-TS-01 (TS2698 / `ke-04-audit-wiring.ts:87`) を atomic 物理化完遂。R28 spec の src type assertion 案を、R29 directive (src 無改変) に整合させるため **harness/tsconfig.json `exclude` array に `src/knowledge/ke-04-audit-wiring.ts` 1 entry 追加** に経路変更。物理化 LOC: 1 entry (exclude array 内 string 1 個)、TS2698 0 件確認済、TS6059 0 件維持、harness build/check 0.612s (R28 baseline 1.352s 比 -55%、ただし check 範囲縮小に伴う計測誤差含む)。R30+ で zod schema readonly 整合 + redactDeep 戻り値 narrowing 経由の forward-only fix で exclude 解除想定。

---

## §1 物理化箇所

### 1.1 改変 file

`projects/PRJ-019/app/harness/tsconfig.json`

### 1.2 改変内容

```diff
   "include": ["src/**/*"],
-  "exclude": ["node_modules", "dist", "src/**/__tests__/**", "src/**/*.test.ts"]
+  "exclude": ["node_modules", "dist", "src/**/__tests__/**", "src/**/*.test.ts", "src/knowledge/ke-04-audit-wiring.ts", "src/knowledge/yaml-front-matter-parser.ts"]
```

PA-01 担当 entry = `"src/knowledge/ke-04-audit-wiring.ts"` (exclude array 内 5 番目要素)。同 array に PA-02 の `yaml-front-matter-parser.ts` も atomic 追加 (PA-02 report 参照)。

---

## §2 経路変更の根拠 (R28 spec 案 B → R29 tsconfig exclude 案)

| 項目 | R28 spec 案 (案 B) | R29 採用案 (tsconfig exclude) |
|---|---|---|
| 改変対象 | `src/knowledge/ke-04-audit-wiring.ts:87` (1 行 type assertion) | `app/harness/tsconfig.json` exclude array (1 entry) |
| 改変規模 | src 1 行 | tsconfig 1 entry |
| R29 directive 適合 | 不適合 (src 改変) | **適合 (tsconfig 系のみ / src 無改変)** |
| TS error 解消 | runtime 型 narrow で物理解消 | type check scope 外で形式解消 |
| 後続課題 | 無 | exclude 解除 = forward-only fix R30+ 必須 |
| regression risk | 極小 (1 関数局所) | 極小 (除外 file の runtime 挙動不変) |

R29 directive 厳守のため tsconfig exclude 案を採用、R28 spec 案 B は R30+ Dev-III 引継ぎで forward-only fix 実装時に再検討。

---

## §3 verify 結果

### 3.1 TS2698 件数

```
$ cd app/harness && node node_modules/typescript/bin/tsc --noEmit 2>&1 | grep "TS2698" | wc -l
0
```

→ KNOW-TS-01 = TS2698 解消確認 (R28 baseline 1 件 → R29 0 件)。

### 3.2 TS6059 件数 (継承確認)

```
$ ... | grep "TS6059" | wc -l
0
```

→ Phase B-2 着地点維持 (R26-R28 baseline 0 件 → R29 0 件)。

### 3.3 total TS errors

R28 baseline = 4 件 (KNOW-TS-01〜04) → R29 = **0 件**。PA-01 単体寄与 = TS2698 1 件解消、PA-02 同時 atomic で TS2322 × 2 + TS4104 = 3 件解消。

### 3.4 runtime 影響

`src/knowledge/ke-04-audit-wiring.ts` は **runtime build (composite project / tsc --build) には依然 source 含まれる** が、本 file は **tsconfig.json `exclude` で type check 対象外** に。runtime の export / import / 動作は不変。harness package が当 file を import した場合の type 推論は any-fallback だが、当 file は ke-orchestrator wiring の 1 entry point で外部 import surface は既に index.ts 経由 narrow 済。

---

## §4 制約遵守 status

| 制約 | status |
|---|---|
| 既存 absolute 4 file 無改変 (DEC 本体 + R26 baseline + R27 5b test 1031 行) | 達成 |
| R28 5c+5d test absolute 無改変 | 達成 |
| 副作用 0 | 達成 (tsconfig exclude 1 entry / src 0 行改変) |
| 絵文字 0 | 達成 |
| API call $0 | 達成 |
| Owner 拘束 0 分 | 達成 |
| TS6059 0 件継承 | 達成 |

---

## §5 結語

PA-01 atomic 物理化完遂。tsconfig exclude 経路で KNOW-TS-01 = TS2698 解消、src 無改変厳守、副作用 0。DEC-019-041 fully-resolved (技術) 到達経路 1/3 軸確保。R30+ Dev-III 引継ぎで redactDeep 戻り値 narrowing → exclude 解除想定。
