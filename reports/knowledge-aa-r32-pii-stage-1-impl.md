---
tags: [knowledge, pii, redaction, stage-1, prj-019, round32, hitl-11, ke-04]
report-version: r32-pii-stage-1-impl
source-PRJ: PRJ-019
source-Round: 32
created: 2026-05-06
created-by: Knowledge-AA (Round 32)
related-DEC: [DEC-019-033, DEC-019-068, DEC-019-068-v2]
related-control: [KE-04, HITL-11, ODR-OG-06, PIT-096, PB-091]
---

# PRJ-019 PII Redaction Stage-1 Actual Implementation 物理化レポート (Round 32 Knowledge-AA)

R28 spec DRAFT → R29 議決 → R30 spec → R31 物理化準備 → **R32 stage-1 actual implementation 物理化完遂**。

---

## §1 物理化対象 file (R32 新規 3 file)

| file | 行数 | 役割 |
|------|------|------|
| `projects/PRJ-019/app/harness/src/knowledge/pii-redactor.ts` | ≤120 | stage-1 actual implementation entry point / 入出力 contract / stage-2 LLM fallback hook |
| `projects/PRJ-019/app/harness/src/knowledge/pii-patterns.ts` | ≤100 | regex 10 detector 定義 (priority 順 / Object.freeze 凍結) |
| `projects/PRJ-019/app/harness/src/knowledge/__tests__/pii-redactor.test.ts` | 23 case | redact / contains / summarize / fallback / skip / keepLastN / category-by-category / edge cases |

既存 `ke-04-pii-redaction.ts` (R13 Dev-E 前倒し起票) は **absolute 無改変継承** (本 R32 物理化は 別 module として独立)。

---

## §2 二段階 redaction 方針

```
Input string (PII を含む可能性)
   ↓
[stage-1 actual / R32 物理化済]
  - regex 10 detector を priority 昇順で直列適用
  - API キー系 (anthropic / openai / github / slack / aws / jwt) を先にマッチ
  - 個人情報系 (email / credit_card / phone) を中段
  - high-entropy hex (low priority / generic key)
  - false positive 抑止: phone 桁数 / credit_card 桁数チェック
   ↓
buffer (placeholder 置換済 / hits[] 配列)
   ↓
[stage-2 LLM fallback / R32 mock injection / R33 real implementation]
  - hook が指定された場合のみ invoke (default 未指定)
  - mock injection: extraHits を追加 / redacted を上書き
  - 実 LLM call は R33 で物理化想定 (R32 時点 $0 維持)
   ↓
RedactResult { redacted, hits[], stage2InvokedCount }
```

---

## §3 入出力 contract

### 関数: `redactPiiStage1`

```typescript
function redactPiiStage1(
  input: string,
  options?: RedactOptions
): RedactResult
```

### 入力

| param | type | 説明 |
|-------|------|------|
| input | string | PII を含む可能性のある任意文字列 |
| options.keepLastN | number? | 末尾 N 文字を tail に保持 (audit fingerprint 用 / default 0) |
| options.skip | Set\<PiiCategory\>? | 検出から除外するカテゴリ |
| options.llmFallback | LlmFallbackHook? | stage-2 hook (mock injection 想定) |

### 出力

| field | type | 説明 |
|-------|------|------|
| redacted | string | placeholder 置換済の文字列 |
| hits | ReadonlyArray\<PiiHit\> | 検出 hit 配列 (immutable) |
| stage2InvokedCount | number | stage-2 hook 呼び出し回数 (0 or 1) |

### `PiiHit`

| field | type | 説明 |
|-------|------|------|
| category | PiiCategory | 検出カテゴリ (10 種) |
| placeholder | string | 置換 placeholder (`<EMAIL>` など) |
| tail | string? | keepLastN 設定時の末尾 N 文字 |
| originalLength | number | original 文字列の長さ (PII 自体は保存しない) |

---

## §4 23 case test 詳細

| case | 試験軸 | 期待結果 |
|------|--------|---------|
| 01 | anthropic_key 単独 redact | placeholder=`<ANTHROPIC_KEY>` |
| 02 | openai_key 単独 redact | placeholder=`<OPENAI_KEY>` |
| 03 | github_pat 単独 redact | placeholder=`<GITHUB_PAT>` |
| 04 | slack_token 単独 redact | placeholder=`<SLACK_TOKEN>` |
| 05 | aws_key 単独 redact | placeholder=`<AWS_KEY>` |
| 06 | jwt 単独 redact | placeholder=`<JWT>` |
| 07 | email 単独 redact | placeholder=`<EMAIL>` |
| 08 | credit_card 単独 redact | placeholder=`<CREDIT_CARD>` |
| 09 | phone 単独 redact | placeholder=`<PHONE>` |
| 10 | high_entropy_hex 単独 redact | placeholder=`<HEX_KEY>` |
| 11 | email + anthropic_key 同時 redact | hits.length=2 |
| 12 | API キー系 priority 1 が email priority 7 より先 hit | hits[0]=anthropic_key |
| 13 | 複数 email 全件 redact | hits.length=3 |
| 14 | skip option で email 除外 | hits.length=0 |
| 15 | keepLastN=4 で tail 保持 | tail='.com' |
| 16 | phone 9 桁未満 redact しない | hits.length=0 |
| 17 | credit_card 12 桁 redact しない | ccHits.length=0 |
| 18 | containsPii true/false | true / false |
| 19 | summarizeHits カテゴリ別件数 | email=2, anthropic_key=1, phone=0 |
| 20 | llmFallback 未指定 stage2InvokedCount=0 | 0 |
| 21 | llmFallback 指定 stage2InvokedCount=1 (mock) | 1 |
| 22 | llmFallback extraHits 追加 | hits.length=1 |
| 23 | PII 0 件 input edge case | redacted=input / hits=[] |

---

## §5 harness +23 case 集計

| 項目 | 値 |
|------|-----|
| R31 着地 harness 件数 | 1017 |
| R32 +23 case 追加 (本 file) | +23 |
| **R32 着地 harness 件数 (想定)** | **1040** |

---

## §6 副作用宣言

| 軸 | 状態 |
|----|------|
| 既存 ke-04-pii-redaction.ts 改変 | 0 (absolute 無改変継承) |
| 既存 hitl-11-knowledge-pii.ts 改変 | 0 |
| Sec yml 12 file md5 改変 | 0 (31 round 連続継承) |
| API call cost | $0 (LLM fallback は mock injection / 実 LLM call 0 件) |
| 絵文字 | 0 |
| Owner 拘束 | 0 分 |
| forward-only fix | 適用済 (削除 0 / 追加のみ / 既存 file 無改変) |

---

## §7 次 round (R33) 引継 spec

### stage-2 LLM fallback real implementation 物理化

```
[R33 想定]
  - LlmFallbackHook の real implementation
  - LLM 呼び出し: claude-haiku 想定 ($0.25/1M tokens / cost 抑制)
  - input: stage-1 後の buffer (PII 大半は除去済)
  - output: contextual PII (regex で取りこぼした地名 / 個人名 / 内部 ID)
  - cache: 30 日 LRU で重複 call 抑制
  - 副作用: API call cost が $0 → 限定 cost に移行 (PRJ-019 budget 上限内)
  - mock injection は維持 (test 専用)
```

---

## §8 KE-04 / HITL-11 連動

| 連動 | 説明 |
|------|------|
| KE-04 | DEC-019-033 ⑪ Owner-in-the-loop 16 項目のうち PII redaction 軸 / stage-1 actual implementation で物理化 |
| HITL-11 | PII 検出結果を人間チェックに回す gate / hits[] が空でない場合は HITL-11 quarantine 経由 |
| ODR-OG-06 | Review 部門で正式化検討中 / 本 stage-1 actual で先行実装 |
| PIT-096 (R32 新規) | retrospective KPT 抽出時 PII 落とし穴 / 二段階 redaction 必須 |
| PB-091 (R32 新規) | W7-C post-launch retrospective KPT + GTC-11 actual D-Day verification 連動 |

---

(EOF / Round 32 Knowledge-AA / PII stage-1 actual implementation 物理化完遂 / harness 1017 → 1040)
