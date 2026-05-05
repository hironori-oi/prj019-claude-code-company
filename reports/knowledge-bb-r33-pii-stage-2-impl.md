---
tags: [knowledge, pii, stage-2, llm-deep-scan, prj-019, round33, knowledge-bb]
report-version: r33-pii-stage-2-impl
source-PRJ: PRJ-019
source-Round: 33
created-by: Knowledge-BB (Round 33)
parent-index: projects/PRJ-019/knowledge/INDEX-v21.md
related-DEC: [DEC-019-033, DEC-019-091, DEC-019-092]
related-PIT: [PIT-096, PIT-098]
related-PB: [PB-091, PB-093]
---

# PRJ-019 Round 33 Knowledge-BB PII Redaction Stage-2 LLM-based Deep Scan 物理化レポート

R32 Knowledge-AA で物理化された PII redaction **stage-1** (regex 10 detector / `pii-redactor.ts` + `pii-patterns.ts` + 23 case test) を absolute 無改変継承し、本 R33 で **stage-2 LLM-based deep scan** を物理化完遂。stage-1 で hit しなかった context-dependent PII (氏名 / 住所 / 顧客固有 ID 等) を補完する LLM-based deep scan を追加し、stage-1 + stage-2 統合 pipeline を提供する。

---

## §1 物理化 file 一覧

| # | file path | 行数 | 内容 |
|---|-----------|------|------|
| 1 | `projects/PRJ-019/app/harness/src/knowledge/pii-llm-scanner.ts` | 約 130 | stage-2 LLM-based deep scan 本体 (mock LLM injection / context-aware redaction / pipeline 統合) |
| 2 | `projects/PRJ-019/app/harness/src/knowledge/__tests__/pii-llm-scanner.test.ts` | 25 case | scan / context-aware / pipeline / mock injection / merge / category / edge case |

stage-1 (R32 物理化済) は **本 round 完全無改変** で、R32 物理化資産を absolute 継承する。

---

## §2 stage-2 設計概要

### 2.1 新規 carry カテゴリ (LlmPiiCategory)

| category | placeholder | 例 |
|---------|------------|-----|
| `person_name` | `<PERSON_NAME>` | 山田太郎 / 佐藤花子 / 鈴木次郎 / 田中... |
| `address` | `<ADDRESS>` | 東京都千代田区1234 / 大阪府北区567 / 京都府... |
| `customer_id` | `<CUSTOMER_ID>` | CUST-12345 / CUST-99999 |
| `org_internal_id` | `<ORG_INTERNAL_ID>` | ORG-ABCD1234 |
| `free_text_secret` | `<FREE_TEXT_SECRET>` | 秘密キー:xxxxxx |

### 2.2 入出力 contract

```ts
type LlmScanner = (req: { text: string; hintCategories?: LlmPiiCategory[] }) => {
  redacted: string
  hits: LlmPiiHit[]
  invokedCount: number
}

function redactPiiPipeline(input: string, options?: PipelineOptions): {
  redacted: string
  stage1Hits: PiiHit[]
  stage2Hits: LlmPiiHit[]
  stage2InvokedCount: number
  mergedHitCount: number
}
```

### 2.3 stage-1 + stage-2 統合 pipeline

```
input
  ↓ stage-1 redactPiiStage1 (regex 10 detector)
  → redacted_1 + stage1Hits[]
  ↓ stage-2 LlmScanner (mock injection / context-aware)
  → redacted_2 + stage2Hits[]
  ↓ output
PipelineResult { redacted: redacted_2, stage1Hits, stage2Hits, mergedHitCount }
```

二重 redact 抑止: stage-1 で出力した placeholder (`<EMAIL>` 等) を stage-2 が再 redact しないよう, 既存 placeholder 形 (`<...>`) は stage-2 mock heuristic が touch しない設計。

---

## §3 mock LLM injection 方針 ($0 維持)

R33 では **`defaultMockLlmScanner`** が以下の単純 heuristic で context-aware PII を検出:

| heuristic | regex (簡素) | confidence |
|-----------|-------------|-----------|
| person_name | `(?:山田\|佐藤\|鈴木\|田中)[一-龥]{1,3}` | 0.85 |
| address | `(?:東京都\|大阪府\|京都府)[一-龥]{1,8}[0-9]{1,4}` | 0.9 |
| customer_id | `\bCUST-[0-9]{4,8}\b` | 0.95 |
| org_internal_id | `\bORG-[A-Z0-9]{4,10}\b` | 0.9 |
| free_text_secret | `秘密キー[:：][^\s]{6,}` | 0.7 |

実 LLM call は **0 件**。`LlmScanner` 型を pluggable interface として外部に公開しているため、R34+ で `defaultMockLlmScanner` を real LLM call 実装に差替可能 (`options.llmScanner` 経由で inject)。

---

## §4 25 case test 構成

| 区分 | case 番号 | 検証内容 |
|------|----------|---------|
| 1 | 01-05 (5 case) | 各 LlmPiiCategory 単独 scan |
| 2 | 06-08 (3 case) | context-aware redaction |
| 3 | 09-11 (3 case) | pipeline (stage-1 + stage-2) 統合 |
| 4 | 12-14 (3 case) | mock LLM injection (custom / no-op / default invokedCount) |
| 5 | 15-17 (3 case) | stage-1 placeholder の二重 redact 抑止 |
| 6 | 18-19 (2 case) | hintCategories filter |
| 7 | 20-21 (2 case) | large input / no-PII input |
| 8 | 22-23 (2 case) | summarizeLlmHits / 複数 category 混在 |
| 9 | 24 (1 case)    | merged stage-1 + stage-2 hit count 整合 |
| 10 | 25 (1 case)   | edge case (空文字 / 空白のみ) |

harness 累計: **1040 → 1065 (+25 case)**。

---

## §5 関連 entry (INDEX-v21 連動)

| ID | type | 概要 |
|----|------|------|
| PIT-098 | pitfall | post-launch retrospective LLM context-aware redaction 落とし穴 (R33 物理化済) |
| PB-093 | playbook | PII redaction stage-2 LLM-based deep scan playbook (mock → real 想定) |

---

## §6 副作用宣言

| 軸 | 状態 |
|----|------|
| pii-redactor.ts 改変 | 0 (R32 物理化済を absolute 無改変継承) |
| pii-patterns.ts 改変 | 0 (R32 物理化済を absolute 無改変継承) |
| pii-redactor.test.ts 改変 | 0 (R32 23 case を absolute 無改変継承) |
| 新規 file | 2 (`pii-llm-scanner.ts` + `pii-llm-scanner.test.ts`) |
| Sec yml 12 file md5 改変 | 0 (32 round → 33 round 連続継承) |
| API call cost | $0 (mock LLM injection / 実 LLM call 0 件) |
| 絵文字 | 0 |
| Owner 拘束 | 0 分 |
| forward-only fix | 適用済 (削除 0 / 追加のみ) |

---

## §7 次 round (Round 34) 引継

- stage-2 mock injection → **real LLM call** へ移行 (defaultMockLlmScanner を real impl で差替)
- stage-2 hint-categories 拡張 (organization-specific patterns 取り込み)
- pipeline 性能監視 (stage-2 invocation latency / 5 categories 検出精度評価)
- 25 case → 30+ case 拡張想定 (real LLM call edge case)

---

(EOF / Round 33 Knowledge-BB / PII stage-2 LLM-based deep scan 物理化完遂 / harness 1065 / $0 維持)
