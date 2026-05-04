# Dev-Q Round 16 第 1 波 — gate-11 zod schema merge + harness 整合

- **Round**: 16 第 1 波 並列
- **担当**: Dev-Q
- **対象**: PRJ-019 Open Claw harness HITL 第 11 種 (knowledge_pii_review) zod schema 重複 merge
- **完遂日時**: 2026-05-05
- **API コスト**: $0 (外部 API 呼び出しゼロ)
- **副作用**: ゼロ (既存挙動 100% 維持、test PASS 維持)

## 1. 現状確認 (gate-11 関連ファイル所在)

タスク指定の `app/harness/hitl/` ディレクトリは存在せず、実際の配置は次の 3 ファイル:

| ファイル | 役割 | zod 使用 |
|---|---|---|
| `app/harness/src/knowledge/hitl-11-knowledge-pii.ts` | pure decision evaluator (Round 13 Dev-E) | なし (TS 型のみ) |
| `app/harness/src/knowledge/hitl-11-quarantine.ts` | 隔離 file I/O 層 (Round 15 Dev-N) | あり (manifest schema) |
| `app/harness/src/hitl/file-hitl11-gate.ts` | I/O 配線層 (Round 14 Dev-E) | なし (TS 型のみ) |

KE-01 schema (`ke-01-schema.ts`) と組合せて使う構造。

## 2. zod schema 重複の特定

`kind = 'pattern' | 'decision' | 'pitfall'` の列挙が **2 箇所で独立に zod schema 化** されていた:

### 重複 A: `ke-01-schema.ts` (canonical 候補, 内部 discriminator)

```ts
export const PatternFrontmatter  = CommonFrontmatter.extend({ kind: z.literal('pattern'),  ... })
export const DecisionFrontmatter = CommonFrontmatter.extend({ kind: z.literal('decision'), ... })
export const PitfallFrontmatter  = CommonFrontmatter.extend({ kind: z.literal('pitfall'),  ... })
export const KnowledgeFrontmatter = z.discriminatedUnion('kind', [Pattern..., Decision..., Pitfall...])
```

### 重複 B: `hitl-11-quarantine.ts`

```ts
export const ManifestEntryKindSchema = z.enum(['pattern', 'decision', 'pitfall'])
export type  ManifestEntryKind       = z.infer<typeof ManifestEntryKindSchema>
```

### 同一性

両者の文字列リテラル集合は完全一致 (`pattern` / `decision` / `pitfall`)。
KE-01 が canonical SoT であるべきだが、独立 enum が浮いていた。

将来 `ke-04-pii-redaction.ts` や `ke-orchestrator.ts` 等で同 enum を再利用する際、3 重複以上に拡大するリスクがある。

## 3. 採用 merge 戦略 (最小差分)

**SoT 統合方式** — `ke-01-schema.ts` に `KnowledgeKindSchema` を 1 個追加し、`hitl-11-quarantine.ts` 側はそれを **再 export** することで公開 API symbol (`ManifestEntryKindSchema` / `ManifestEntryKind`) を維持。

- 公開 export 名: 不変 (`ManifestEntryKindSchema`, `ManifestEntryKind` 残置)
- runtime 挙動: 不変 (z.enum 構造同一、parse / safeParse 結果同一)
- test import 経路: 不変 (test は `Hitl11Quarantine` と `ManifestSchema` のみ import; `ManifestEntryKindSchema` は内部利用のみ)

## 4. patch (実適用済 diff)

### `app/harness/src/knowledge/ke-01-schema.ts` (+11 行)

```diff
 export type QualityScoreType = z.infer<typeof QualityScore>

+/**
+ * KnowledgeKindSchema — 全 KE-* / HITL-11 module 共通の kind enum SoT
+ * (Round 16 Dev-Q gate-11 zod schema merge).
+ *
+ * 元来 ke-01-schema は discriminatedUnion 内 z.literal('pattern' | 'decision' | 'pitfall')
+ * を 3 箇所重複保持し、hitl-11-quarantine.ts も独自に z.enum(...) を保持していた.
+ * 本 schema を canonical SoT として再公開し、quarantine 側はこれを再 export する.
+ */
+export const KnowledgeKindSchema = z.enum(['pattern', 'decision', 'pitfall'])
+export type KnowledgeKind = z.infer<typeof KnowledgeKindSchema>
+
 /** 共通 frontmatter (全 3 サブディレクトリ共通). */
```

### `app/harness/src/knowledge/hitl-11-quarantine.ts` (+10/-1 行)

```diff
 import { z } from 'zod'
 import type { KnowledgeDraft } from './ke-02-trigger.js'
+import { KnowledgeKindSchema } from './ke-01-schema.js'
 import { ensureDirSelf, fileExists, loadJson, saveJson } from '../fs-store.js'

 // ============================================================================
 // zod schema
 // ============================================================================

 export const ManifestEntryStateSchema = z.enum([ ... ])
 export type ManifestEntryState = z.infer<typeof ManifestEntryStateSchema>

-export const ManifestEntryKindSchema = z.enum(['pattern', 'decision', 'pitfall'])
+/**
+ * ManifestEntryKindSchema — KE-01 canonical KnowledgeKindSchema を再 export
+ * (Round 16 Dev-Q gate-11 zod schema merge).
+ *
+ * 公開 API 互換性維持のため symbol/type 名は残し、SoT のみ ke-01-schema へ統合.
+ * 既存 import 経路 / runtime 挙動 / safeParse / parse のすべて 100% 同一.
+ */
+export const ManifestEntryKindSchema = KnowledgeKindSchema
 export type ManifestEntryKind = z.infer<typeof ManifestEntryKindSchema>
```

実差分 = 2 ファイル / 約 +21 / -1 行 (コメント込み、コード本体は実質 +2 / -1 行)。

## 5. 検証結果

### harness 単体 vitest

```
Test Files  42 passed (42)
     Tests  607 passed (607)
  Duration  3.37s
```

→ **607 / 607 PASS 維持** (Round 15 baseline 同一、回帰ゼロ)。
特に直接影響を受けるテストも全 PASS:

- `__tests__/knowledge/hitl-11-quarantine.test.ts` — 8 / 8 PASS
- `__tests__/knowledge/ke-01-schema.test.ts` — 6 / 6 PASS
- `__tests__/knowledge/hitl-11-knowledge-pii.test.ts` — 11 / 11 PASS
- `__tests__/hitl/file-hitl11-gate.test.ts` — 18 / 18 PASS

### workspace 全体 vitest

```
Test Files  2 failed | 99 passed (101)
     Tests  1 failed | 1503 passed (1504)
```

failed 2 件は Round 15 baseline からの **既存失敗** (本 patch と無関係):

- `web/src/lib/audit/hash-chain.test.ts` — `verifyChain.reason` 文字列差分 (本 patch 非関与)
- `web/src/lib/cost/budget-guard.test.ts` — fetch ECONNRESET (外部 fetch 起因、本 patch 非関与)

knowledge / hitl 関連 test はすべて PASS。本 merge による回帰ゼロを確認。

## 6. HITL 第 11 種 (knowledge_pii_review) 接続点

merge 後、kind enum の SoT は KE-01 単一に。これにより:

- KE-04 redactor / KE-02 trigger / HITL-11 quarantine / HITL-11 gate I/O 配線
  が同一 schema instance を参照可能 (将来 import で `KnowledgeKindSchema` 利用推奨)
- HITL 第 11 種 review payload 検証 (Slack quick-action `Hitl11WebhookKind`) は
  別 enum (`knowledge_pii_review_{approve|reject|partial}`) のため本 merge 影響なし

## 7. 後続提案 (Round 16 第 2 波以降向け)

1. **`Hitl11WebhookKind` の zod schema 化** — 現在 TS 型のみで runtime 検証なし。
   Slack quick-action endpoint で payload 受領時の入力検証を強化する余地あり
   (file-hitl11-gate.ts L68 `Hitl11WebhookPayload` 周辺)
2. **`ke-02-orchestrator-wiring.ts` L152 三項演算子** — `kind === 'pattern' ? 'PAT' : ...`
   が `hitl-11-quarantine.ts` L308 と同一ロジック。`kindToIdPrefix(kind)` helper 関数化検討
3. **`yaml-front-matter-parser.ts` L290 文字列比較** — `KnowledgeKindSchema.safeParse`
   へ置換可能 (本 merge で利用可能になった)

これらは **本 patch 範囲外** とし、Round 16 第 2 波 / 第 3 波で別 task 化を推奨。

## 8. 制約遵守確認

- API $0: 外部 API 呼び出しゼロ (vitest 完全 local)
- 副作用 0: harness 607 / 607 PASS 維持、knowledge & hitl tests 全 PASS
- 絵文字 0: 本書 / patch 共に絵文字未使用
- 物理化最小: 修正 2 ファイル (新規ファイル作成なし、schema 統合 1 経路のみ)
- 既存 test 破壊禁止: 確認済 (Round 15 baseline と同一 PASS 件数)

---

**Dev-Q 担当範囲完遂**: gate-11 zod schema merge + harness 整合性検証を Round 16 第 1 波として完了。
