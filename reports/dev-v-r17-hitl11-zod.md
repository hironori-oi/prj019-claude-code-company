# Dev-V Round 17 第 2 波 — Hitl11WebhookKind zod 化 + kindToIdPrefix helper 化

- **担当**: Dev-V (PRJ-019 Dev 部門 第 2 波)
- **日付**: 2026-05-05
- **commit 対象**: harness `src/knowledge/`, `src/hitl/`, `src/__tests__/knowledge/`
- **前提**: Round 16 Dev-Q `KnowledgeKindSchema = z.enum(['pattern','decision','pitfall'])` 確定 (`ke-01-schema.ts`)
- **目的**: Hitl11WebhookKind の zod 化 + kindToIdPrefix helper 化 + yaml-parser での safeParse 利用
- **harness テスト結果**: 607 → **611 PASS** (+4 件追加, 全件 GREEN)

## 1. 実装サマリー

### 1.1 `ke-01-schema.ts` (canonical SoT 拡張)

新規 export を追加 (zero side-effect, pure):

```ts
export const Hitl11WebhookKindSchema = z.enum([
  'knowledge_pii_review_approve',
  'knowledge_pii_review_reject',
  'knowledge_pii_review_partial',
])
export type Hitl11WebhookKind = z.infer<typeof Hitl11WebhookKindSchema>

const KIND_TO_ID_PREFIX = Object.freeze({
  pattern: 'PAT-',
  decision: 'DEC-',
  pitfall: 'PIT-',
} as const satisfies Record<KnowledgeKind, string>)

export function kindToIdPrefix(kind: KnowledgeKind): 'PAT-' | 'DEC-' | 'PIT-'
export function idPrefixToKind(prefix: string): KnowledgeKind | null
```

`satisfies Record<KnowledgeKind, string>` により、将来 KnowledgeKind に新値を追加した際は **コンパイル時エラー** で漏れ検知できる。

### 1.2 `file-hitl11-gate.ts` (canonical 再 export)

旧 inline `type Hitl11WebhookKind = 'knowledge_pii_review_approve' | ...` を削除し、`ke-01-schema` から re-export:

```ts
import { Hitl11WebhookKindSchema, type Hitl11WebhookKind as Hitl11WebhookKindCanonical } from '../knowledge/ke-01-schema.js'
export type Hitl11WebhookKind = Hitl11WebhookKindCanonical
export { Hitl11WebhookKindSchema }
```

加えて `receiveWebhookDecision` の冒頭で `safeParse` による runtime kind 検証を追加 (既に宣言されていた `kind_mismatch` validation error を実際に返す経路が出来た):

```ts
if (!Hitl11WebhookKindSchema.safeParse(payload.kind).success) {
  return { ok: false, error: 'kind_mismatch' }
}
```

公開 API 互換性: `Hitl11WebhookKind` 型 / `Hitl11WebhookPayload.kind` フィールド / 既存 18 件のテスト挙動はすべて 100% 同一。

### 1.3 `hitl-11-quarantine.ts` (kindToIdPrefix 採用)

`makeEntryId` 内の inline 三項分岐を helper 呼出しに置換:

```diff
- const prefix = draft.kind === 'pattern' ? 'PAT' : draft.kind === 'decision' ? 'DEC' : 'PIT'
+ const prefix = kindToIdPrefix(draft.kind).slice(0, -1) // 'PAT-' → 'PAT'
```

`-` 区切りを取り去る `.slice(0, -1)` は明示コメント付き。Round 16 で merge 済の `ManifestEntryKindSchema = KnowledgeKindSchema` と組合せ、quarantine module 内の kind 関連 SoT は **ke-01-schema 1 箇所** に完全集約。

### 1.4 `yaml-front-matter-parser.ts` (safeParse 利用)

`pickKind` 内の inline 文字列比較を `KnowledgeKindSchema.safeParse` に置換:

```diff
- const kindRaw = asString(fm['kind']) ?? asString(fm['type'])
- if (kindRaw === 'pattern' || kindRaw === 'decision' || kindRaw === 'pitfall') {
-   return kindRaw
- }
- return 'unknown'
+ const kindRaw = asString(fm['kind']) ?? asString(fm['type'])
+ const parsed = KnowledgeKindSchema.safeParse(kindRaw)
+ return parsed.success ? parsed.data : 'unknown'
```

挙動完全同一 (3 値 pass / 不正値 → `'unknown'` fallback)。将来 KnowledgeKindSchema に新値追加した場合、自動で yaml-parser も追従する。

### 1.5 `knowledge/index.ts` (公開 API 拡張)

新規 SoT を package 公開:

```ts
KnowledgeKindSchema,
Hitl11WebhookKindSchema,
kindToIdPrefix,
idPrefixToKind,
type KnowledgeKind,
type Hitl11WebhookKind,
```

## 2. tests 拡張

`__tests__/knowledge/ke-01-schema.test.ts` に **+4 件** 追加 (合計 6 → 10):

1. `Hitl11WebhookKindSchema` が 3 値 pass / 不正値 reject (null/undefined/typo を網羅)
2. `kindToIdPrefix` が 3 種を正しく `PAT-`/`DEC-`/`PIT-` に写像
3. `idPrefixToKind` が逆変換 + 不正値で `null` (lenient: ハイフンなしも許容)
4. `KnowledgeKindSchema.options` で全 enum 値 round-trip 整合 (網羅性 guard)

特に **網羅性 guard** は `satisfies Record<KnowledgeKind, string>` と二重で「将来 KnowledgeKind 追加忘れ」を阻止する。

## 3. 検証結果

| 項目 | Before | After |
|------|--------|-------|
| harness 全テスト | 607 PASS | **611 PASS** |
| ke-01-schema.test.ts | 6 件 | **10 件** |
| TypeScript strict 新規 error | — | **0 件** (既存 ke-04-audit-wiring / yaml-parser readonly tags 警告は本変更前から存在、無関係) |
| API 副作用 | $0 | $0 |
| 絵文字 | 0 | 0 |
| 公開 API 破壊 | — | **なし** (`Hitl11WebhookKind` type 名 / 全 import 経路保持) |

`npx vitest --run` で 42 test files / 611 tests が約 3.9s で全 GREEN。`heartbeat-load-50k` は本タスク対象外につき影響なし。

## 4. SoT 集約 マッピング (Round 16 + 17 完成形)

```
ke-01-schema.ts (canonical)
├── KnowledgeKindSchema       (Round 16 Dev-Q)
├── Hitl11WebhookKindSchema   (Round 17 Dev-V) NEW
├── kindToIdPrefix / idPrefixToKind (Round 17 Dev-V) NEW
└── 各 module から再 export
    ├── hitl-11-quarantine.ts: ManifestEntryKindSchema = KnowledgeKindSchema
    ├── file-hitl11-gate.ts:   Hitl11WebhookKind / Hitl11WebhookKindSchema
    ├── yaml-front-matter-parser.ts: pickKind() で safeParse 利用
    └── (Round 17 で makeEntryId も kindToIdPrefix 経由)
```

## 5. 後続提案

1. **`decideViaFile` の Hitl11Decision → Hitl11WebhookKind マッピング helper 化** (Round 18 候補):
   現在 `file-hitl11-gate.ts` の `decideViaFile` 内に三項分岐 (`approve` → `_approve`, `reject` → `_reject`, default → `_partial`) が残存。これも `decisionToWebhookKind(d: Hitl11Decision): Hitl11WebhookKind` helper 化すれば、test 17 で同一マッピングを再利用できる。
2. **`decisionPath` の suffix 抽出 helper** (Round 18 候補):
   `'_approve' → 'approve'` / `'_reject' → 'reject'` / `'_partial' → 'partial'` の split が私的 method として残存。`webhookKindToFileSuffix(k): 'approve' | 'reject' | 'partial'` 化で suffix 命名が SoT 化される。
3. **Hitl11WebhookValidationError の zod 化** (Round 19 候補):
   現在 union type (`'unknown_gate' | ... | 'kind_mismatch'`) は zod 化されておらず、外部 API/Slack 側との contract test が string match に依存している。`Hitl11WebhookValidationErrorSchema = z.enum([...])` 化で同様に SoT 集約可能。
4. **`organization/knowledge/` 配下 sample md の id 形式 audit**:
   `kindToIdPrefix` が canonical 化されたため、既存 `organization/knowledge/{patterns,decisions,pitfalls}/*.md` の id 値が `^(PAT|DEC|PIT)-NNN-` 形式に揃っているか CI lint で audit する task が組める。yaml-parser load 時に `validateKnowledgeEntry` を通せば自動検証される (skipMalformed=false 付きの一時 CI)。

## 6. 参照ファイル (絶対パス)

- 修正ファイル
  - `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness/src/knowledge/ke-01-schema.ts` (+44 行)
  - `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness/src/knowledge/index.ts` (+6 行)
  - `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness/src/knowledge/hitl-11-quarantine.ts` (差分 ±5 行)
  - `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness/src/knowledge/yaml-front-matter-parser.ts` (差分 ±9 行)
  - `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness/src/hitl/file-hitl11-gate.ts` (差分 ±22 行)
  - `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/harness/src/__tests__/knowledge/ke-01-schema.test.ts` (+42 行, +4 ケース)
- 関連既存ファイル (参照のみ)
  - `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/reports/dev-q-*` (Round 16 Dev-Q canonical SoT 起源)
