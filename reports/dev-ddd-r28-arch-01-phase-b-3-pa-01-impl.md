# Dev-DDD R28 — ARCH-01 Phase B-3 PA-01 実装書面 (KNOW-TS-01 / TS2698)

最終更新: 2026-05-06 W0-Week1
起案: Dev 部門 R28 Dev-DDD（9 並列 5 軸目 / 18 件目 dev sprint）
位置付け: R27 Dev-AAA `dev-aaa-r27-arch-01-phase-b-3-candidates.md` 推奨候補 B-3-δ (legacy-relax 解消) の PA-01 (KNOW-TS-01 = TS2698 / ke-04-audit-wiring.ts:87) を物理化前 spec として詳細化。
版: v1.0
連動 DEC: DEC-019-041 (resolved-evidence-ready / fully-resolved 待機) / DEC-019-076 / DEC-019-079
連動 baseline: harness 836 PASS / openclaw-runtime 394 PASS 維持 / TS6059 0 件維持 / total TS errors 4 件 (KNOW-TS-01〜04)

---

## §0 サマリ (CEO 200 字)

PA-01 = KNOW-TS-01 (TS2698 = `Spread types may only be created from object types.` / `ke-04-audit-wiring.ts:87`) の根本原因 + fix 方針確定。`redactDeep(event.payload, ...)` 戻り値が `unknown` 推論されるため `{ ...redactedPayload }` spread 不可。fix = `redactDeep` return type narrowing (`Record<string, unknown>`) または call site での type assertion (`redactedPayload as Record<string, unknown>`)。R28 物理化は副作用 0 厳守で見送り、R29 Dev-EEE 引継ぎ。物理化 LOC: 1-3 行想定。regression risk: 極小 (1 関数の戻り値型のみ局所変更)。

---

## §1 問題箇所

```typescript
// app/harness/src/knowledge/ke-04-audit-wiring.ts:85-87
const hits: PiiHit[] = []
const redactedPayload = redactDeep(event.payload, hits, { skip, keepLastN })
const finalPayload: Record<string, unknown> = { ...redactedPayload }  // ← TS2698
```

エラー:
```
src/knowledge/ke-04-audit-wiring.ts(87,53): error TS2698:
  Spread types may only be created from object types.
```

---

## §2 根本原因

`redactDeep` の signature を確認すると、`event.payload` が `unknown` または `Record<string, unknown> | unknown[] | string | ...` の union を取り、戻り値型も同 union を継承するため spread 対象が object と narrow されない。`exactOptionalPropertyTypes: true` + `noUncheckedIndexedAccess: true` 環境で TS が strict に判定。

---

## §3 fix 方針 (3 案)

| 案 | 内容 | LOC | risk |
|---|---|---|---|
| A | `redactDeep` の signature を `<T extends Record<string, unknown>>(payload: T, ...) => T` に narrow | 3-5 | 中 (call site 全箇所影響) |
| B | call site で `redactedPayload as Record<string, unknown>` assertion | 1 | 低 |
| C | `finalPayload` 構築を `Object.assign({}, redactedPayload)` に変更 (object 確認 + 安全 copy) | 1 | 低 |

**推奨**: 案 B (call site narrow / 1 行 / 局所改変)。
**理由**: `event.payload: AuditEventInput['payload']` が既に `Record<string, unknown>` 想定であり、redactDeep が値構造を保持する仕様 (R27 KE-04 spec) のため runtime 型一致が保証される。

---

## §4 物理化 spec (R29 Dev-EEE 引継ぎ)

### 4.1 改変箇所

```typescript
// before (line 87)
const finalPayload: Record<string, unknown> = { ...redactedPayload }

// after (line 87)
const finalPayload: Record<string, unknown> = {
  ...(redactedPayload as Record<string, unknown>),
}
```

### 4.2 verify 手順

1. `cd app/harness && npx tsc --noEmit 2>&1 | grep "TS2698" | wc -l` → 0 件
2. `npx vitest run src/__tests__/knowledge/ke-04-audit-wiring.test.ts` → 全 PASS
3. `npx vitest run` → harness 836 PASS 維持

### 4.3 rollback

git revert 1 行のみ (line 87 single-line edit)。

---

## §5 R28 物理化見送り判断

R27 §6.4 δ-R4 「δ 着地は技術解消のみ / DEC-019-079 採決連動は別 round」+ 本 round 制約「副作用 0 / 既存 absolute 4 file 無改変 / 既存 R27 5b test 1031 行 absolute 無改変」を受け、R28 では spec 化のみ実施。R29 Dev-EEE で物理化想定。

regression 評価: 1 行 type assertion のため極小 risk、ただし R28 で 9 並列他軸との regression conflict 回避のため敢えて分離。

---

## §6 制約遵守 status

| 制約 | status |
|---|---|
| 既存 absolute 4 file 無改変 (harness/openclaw tsconfig + DEC + baseline) | 達成 |
| 副作用 0 | 達成 (本書面 spec のみ) |
| 絵文字 0 | 達成 |
| API call $0 | 達成 |
| 既存 R27 5b test 1031 行 absolute 無改変 | 達成 |
| TS6059 0 件維持 | 達成 (本 round 計測値 0 件) |

---

## §7 結語

PA-01 (KNOW-TS-01 / TS2698) 物理化 spec 確定。1 行 type assertion で fix 可能、regression risk 極小。R28 は副作用 0 厳守で spec 化のみ、R29 Dev-EEE 引継ぎで物理化、DEC-019-041 fully-resolved 到達経路の 1/4 軸を確保。
