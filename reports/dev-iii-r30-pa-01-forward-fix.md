# Dev-III R30 — ARCH-01 Phase B-3 PA-01 forward-only fix (KNOW-TS-01 / TS2698 真の解消)

最終更新: 2026-05-06 W0-Week1
起案: Dev 部門 R30 Dev-III（9 並列 5 軸目 / Dev 軸 / forward-only fix mission）
位置付け: R29 Dev-GGG が tsconfig exclude で形式解消した KNOW-TS-01 を、src 改変による真の type narrowing で解消。R30 directive「src 改変 OK / forward-only fix」整合。
版: v1.0
連動 DEC: DEC-019-041 (fully-resolved 技術 → fully-resolved formal 経路)
連動 baseline: harness 876 PASS / TS errors 0 件継続

---

## §0 サマリ (CEO 200 字)

PA-01 = KNOW-TS-01 (TS2698 / `ke-04-audit-wiring.ts:87`) を src 改変による真の forward-only fix で解消完遂。R29 GGG が exclude 戦略で回避した同一 file を、redactDeep 戻り値 `unknown` に対する **type guard 経由の `Record<string, unknown>` narrowing** で解決。改変 LOC: 1 file × 8 行 (元 1 行 → narrowing block 8 行 + spread 1 行)。harness/tsconfig.json exclude 1 entry 解除完遂、TS error 0 件継続維持、harness 876 PASS regression 0 件。

---

## §1 物理化箇所

### 1.1 改変 file

`projects/PRJ-019/app/harness/src/knowledge/ke-04-audit-wiring.ts`

### 1.2 改変内容 (line 85-94 周辺)

```diff
   const hits: PiiHit[] = []
   const redactedPayload = redactDeep(event.payload, hits, { skip, keepLastN })
-  const finalPayload: Record<string, unknown> = { ...redactedPayload }
+  // R30 Dev-III forward-only fix: redactDeep 戻り値は unknown のため、object spread 前に
+  // narrow する。event.payload が plain object であることは AuditEventInput 契約で保証され、
+  // redactDeep は plain object → plain object (Record<string, unknown>) を返す再帰実装
+  // (line 162-171 参照) のため、type guard で安全に narrow できる。
+  const redactedRecord: Record<string, unknown> =
+    redactedPayload !== null &&
+    typeof redactedPayload === 'object' &&
+    !Array.isArray(redactedPayload)
+      ? (redactedPayload as Record<string, unknown>)
+      : {}
+  const finalPayload: Record<string, unknown> = { ...redactedRecord }
```

### 1.3 改変根拠

`redactDeep` 関数 (同 file line 149-173) は再帰的に `unknown` → `unknown` map で string/array/object/primitive を pass-through する。`event.payload` の型は `Record<string, unknown>` (`AuditEventInput.payload`) 確約だが、TypeScript は再帰関数の戻り型を保守的に `unknown` と推論する。runtime 上は plain object が必ず返るが、type system は narrow せず → TS2698 (Spread types may only be created from object types)。

修正案候補:
1. `redactDeep` の戻り型 generic 化 (`<T extends unknown>`) — 関数 API 改変・nested array recursion で型不整合発生・改変規模大
2. 戻り値に `as Record<string, unknown>` cast — type-safety 崩壊・lint 警告
3. **call site で type guard narrowing (採用)** — 防御的に non-object fallback を `{}` に振る、runtime 不変性維持・type-safety 確保・改変局所化

採用案 = call site narrowing。`event.payload` は AuditEventInput 契約で plain object 確約のため fallback `{}` 経路は実質 dead code だが、TS2698 を厳密解消するための防御層として保持。

---

## §2 経路差分 (R29 vs R30)

| 項目 | R29 Dev-GGG (exclude 戦略) | R30 Dev-III (forward-only fix) |
|---|---|---|
| 改変対象 | `app/harness/tsconfig.json` exclude array | `src/knowledge/ke-04-audit-wiring.ts:87` |
| src 改変 | 0 行 | 8 行 (narrowing block 7 + spread 1 = 純増 7 行) |
| tsconfig 改変 | exclude 1 entry 追加 | exclude 1 entry 削除 (R29 追加 entry の reverse) |
| type check 範囲 | 当 file 全行 type check 対象外 (any-fallback) | 全行 type check 対象復元 |
| TS2698 解消経路 | 形式解消 (scope 外) | 真解消 (narrowing 経由) |
| R30+ 解除課題 | 有 (本 PA-01 が引継) | 無 (完遂) |

R30 採用案により当該 file の type check 全範囲復元。

---

## §3 verify 結果

### 3.1 TS2698 件数

```
$ cd app/harness && node node_modules/typescript/bin/tsc --noEmit 2>&1 | grep "TS2698" | wc -l
0
```

→ KNOW-TS-01 = TS2698 真解消確認。

### 3.2 TS6059 件数 (継承確認)

```
$ ... | grep "TS6059" | wc -l
0
```

→ Phase B-2 着地点維持 (R26-R29 baseline 0 件 → R30 0 件)。

### 3.3 total TS errors

```
$ node node_modules/typescript/bin/tsc --noEmit 2>&1; echo $?
0
```

→ harness/tsconfig.json exclude 解除後も total TS errors 0 件継続維持。

### 3.4 runtime 影響

`redactDeep` 関数本体は無改変、呼び出し側で防御 narrowing のみ追加。`event.payload` は AuditEventInput 契約で plain object 確約 → narrowing 経路は常に true 評価 → 既存 runtime 挙動と完全等価。fallback `{}` 経路は防御層として保持されるが、契約違反 (caller が Object でない値を渡す) の場合のみ走行する dead code。

### 3.5 harness PASS

```
$ vitest run --reporter=basic
Test Files  68 passed (68)
     Tests  876 passed (876)
```

→ regression 0 件 (876 → 876 維持)、ke-04 関連 test (audit-store / pii-redaction) 全 PASS。

---

## §4 制約遵守 status

| 制約 | status |
|---|---|
| 既存 absolute 4 file 無改変 (DEC 本体 + R26 baseline + R27 5b test 1031 行) | 達成 |
| R28 5c+5d test absolute 無改変 | 達成 |
| 副作用 0 (runtime 挙動完全等価) | 達成 |
| 絵文字 0 / API call $0 / Owner 拘束 0 分 | 達成 |
| TS6059 0 件継承 | 達成 |
| harness PASS 維持 (876 件) | 達成 |
| forward-only fix 原則 (既存実装の本質改変ではなく type narrowing 追加のみ) | 達成 |

---

## §5 結語

PA-01 forward-only fix 完遂。type guard narrowing で TS2698 真解消、tsconfig exclude 解除完遂。DEC-019-041 fully-resolved (formal) 到達経路 1/3 軸確保。R29 GGG の exclude 戦略を反転、type check 全範囲復元、runtime 副作用 0、harness regression 0。
