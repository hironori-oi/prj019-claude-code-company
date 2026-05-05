# Knowledge-Y R30 — PII redaction impl-stage-1 spec (HITL 第 11 種 R29 ratify ベース regex 実装 spec)

- 起票: Knowledge-Y (Round 30 9 並列 2 軸目 / Knowledge sprint)
- 起票日時: 2026-05-06
- 対象: HITL 第 11 種 `knowledge_pii_review` impl-stage-1 (regex 実装第 1 弾) 物理化 spec
- R29 ratify base: `projects/PRJ-019/reports/knowledge-x-r29-hitl-11-pii-ratify.md`
- 想定 R31+ 担当: Knowledge-Z (R31 物理化軸)
- 想定工数: 4-6h (regex pattern set + retrieval pipeline 入口 auto-redact + unit test 8-12 case + 既存 entry 全件 verify)

---

## §0 Executive Summary (CEO 200 字)

R29 Knowledge-X で議決完遂した HITL 第 11 種 `knowledge_pii_review` (DRAFT R28 → ratified R29 / 3 者賛成 0 反対 0 棄権) を base に、R30 Knowledge-Y で **regex stage (実装第 1 弾) spec** を起案。Owner 個別固有名詞 / orderId payload / API キー / メール RFC 5322 / 電話 E.164 / on-call 担当者 = 6 系統 regex pattern set + retrieval pipeline 入口 auto-redact + unit test 8-12 case + 既存 entry 全件 verify。R31 Knowledge-Z で物理化想定 (工数 4-6h)。LLM 二段階 (R32 stage-2) → human escalation (R33 stage-3) connecting path 確保。Review 部門 ODR-OG-06 連動。

---

## §1 背景 (R29 議決完遂継承)

### 1.1 HITL 第 11 種 `knowledge_pii_review` ratify status

| 段階 | round | 担当 | 結果 |
|------|-------|------|------|
| spec DRAFT | R28 | Knowledge-W | `knowledge-w-r28-pii-redaction-hitl-11-spec.md` |
| **ratified** | R29 | Knowledge-X | 3 者賛成 0 反対 0 棄権 (CEO + Knowledge-X + Review-U / 15 min self-running) |
| **impl-stage-1 spec** | **R30** | **Knowledge-Y (本 file)** | **本 spec 起案** |
| 物理化 (regex stage) | R31 想定 | Knowledge-Z | 4-6h 工数 / 本 spec ベース実装 |
| LLM 二段階 stage | R32 想定 | Knowledge-AA | 2nd stage extension |
| human escalation | R33 想定 | Knowledge-BB | 3rd stage final |

### 1.2 R30 Knowledge-Y で本 spec を起案する根拠

1. R29 議決完遂直後の **ratify → impl-stage-1 → 物理化** の atomic flow を確立 (R29 → R30 → R31 = 3 round で完了 path)
2. INDEX-v18 起票時点で全 200 entries `pii-redacted: true` 維持済 = regex 設計の base data 揃った
3. Review 部門 ODR-OG-06 (PII 検査経路 spec) 連動で R30+ 採用 path 確保
4. 4-6h 工数 = 1 round 内物理化可能 (R31 Knowledge-Z 想定)

---

## §2 regex pattern set 仕様 (6 系統)

### 2.1 pattern P1: Owner 個別固有名詞

**目的**: Owner 個人名 / 関連個人特定情報の検出 + redaction

**入力 sample 例**:
- `<Owner 個人名>` → 検出 → `[REDACTED:OWNER_NAME]` 置換
- `<Owner email local-part>@<domain>` → P4 (mail) 経由連動
- `<Owner Slack handle>` → 検出 → `[REDACTED:OWNER_HANDLE]` 置換

**regex pattern (例)**:

```
P1-name: \b(<owner-allowlist-name-1>|<owner-allowlist-name-2>)\b
P1-handle: @<owner-allowlist-handle>\b
```

> **note**: allowlist 方式 (Owner 名は固有 / 高 precision 重視 / false-positive 0 件 target)。allowlist は config file 別管理 (`projects/PRJ-019/knowledge/pii-allowlist.json` / 本 spec 物理化時に同時起票想定 / Owner 拘束時 1 min review)。

**置換 token**: `[REDACTED:OWNER_NAME]` / `[REDACTED:OWNER_HANDLE]`

### 2.2 pattern P2: orderId payload

**目的**: 顧客 order ID / payload 識別子の検出 + redaction

**入力 sample 例**:
- `order-id: ord_<24 hex>` → 検出 → `[REDACTED:ORDER_ID]`
- `payload-id: pl_<UUID v4>` → 検出 → `[REDACTED:PAYLOAD_ID]`

**regex pattern**:

```
P2-order: \bord_[a-f0-9]{24,32}\b
P2-payload: \bpl_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b
```

**置換 token**: `[REDACTED:ORDER_ID]` / `[REDACTED:PAYLOAD_ID]`

### 2.3 pattern P3: API キー

**目的**: API キー / token 全種類検出 + redaction (高 priority)

**入力 sample 例**:
- `sk-<alphanum 48>` → OpenAI sk- prefix → `[REDACTED:API_KEY]`
- `vc_<alphanum 32>` → Vercel token → `[REDACTED:API_KEY]`
- `hsec_<alphanum 64>` → HMAC secret → `[REDACTED:API_KEY]`
- generic bearer token → `[REDACTED:API_KEY]`

**regex pattern**:

```
P3-openai: \bsk-[A-Za-z0-9]{48}\b
P3-vercel: \bvc_[A-Za-z0-9]{32}\b
P3-hmac: \bhsec_[A-Za-z0-9]{64}\b
P3-bearer: \bBearer\s+[A-Za-z0-9._\-]{20,}\b
P3-generic: (?i)\b(token|secret|api[_-]?key|auth[_-]?key)\s*[:=]\s*[A-Za-z0-9._\-]{16,}\b
```

**置換 token**: `[REDACTED:API_KEY]`

### 2.4 pattern P4: メール RFC 5322

**目的**: メールアドレス全件検出 + redaction (Owner allowlist は P1 連動)

**regex pattern (RFC 5322 simplified)**:

```
P4-email: \b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b
```

**置換 token**: `[REDACTED:EMAIL]`

> **note**: Owner allowlist mail (P1 連動) は P4 redaction 後に P1 hint 復元判定。

### 2.5 pattern P5: 電話 E.164

**目的**: 電話番号 (E.164 国際標準) 検出 + redaction

**regex pattern**:

```
P5-phone-e164: \+[1-9][0-9]{1,14}\b
P5-phone-jp: \b0\d{1,4}-\d{1,4}-\d{4}\b
P5-phone-jp-mobile: \b0[7-9]0-\d{4}-\d{4}\b
```

**置換 token**: `[REDACTED:PHONE]`

### 2.6 pattern P6: on-call 担当者

**目的**: on-call schedule の担当者名 / handle 検出 + redaction

**regex pattern (例 / allowlist 方式)**:

```
P6-oncall: (?i)\bon[\-_]?call\s*[:=]\s*<oncall-allowlist>\b
P6-handle: @<oncall-allowlist-handle>\b
```

**置換 token**: `[REDACTED:ONCALL]`

> **note**: P1 同様、allowlist は `projects/PRJ-019/knowledge/pii-allowlist.json` で管理。

---

## §3 retrieval pipeline 入口 auto-redact 仕様

### 3.1 pipeline 位置

```
[user query input]
       ↓
[knowledge retrieval pipeline]
       ↓
   ┌───────────────────────┐
   │ STAGE 0: PII redact   │ ← 本 spec 物理化対象
   │  (regex set P1-P6)    │
   └───────────────────────┘
       ↓
[INDEX query (v18+ entries)]
       ↓
[result composition]
       ↓
[output to caller (e.g., dev-kickoff-approval)]
```

### 3.2 redaction trigger 条件

| 条件 | 動作 |
|------|------|
| query 中に P1-P6 のいずれかにマッチ | match 部を `[REDACTED:<TYPE>]` 置換 |
| match 0 件 | redact 0 / pipeline 通過 |
| match 1 件以上 | redact 後の query で INDEX query 実行 |
| match 5 件以上 | warning log 記録 (高 PII density 通知 / Review 部門 ODR-OG-06 連動) |

### 3.3 既存 entry 全件 verify (200 entries)

物理化時、INDEX-v18 全 200 entries に対して P1-P6 を適用、以下 audit 結果を report 化:

- false-positive 件数 (本来 PII でないのに redact された件数)
- false-negative 件数 (本来 PII なのに redact されなかった件数 / human review)
- 既存 `pii-redacted: true` 整合性 verify (200 件全件再 audit)

### 3.4 unit test 8-12 case 仕様

| case | 入力 query | 期待出力 |
|------|-----------|---------|
| C1 | "Owner <name> へ通知して" | `[REDACTED:OWNER_NAME] へ通知して` |
| C2 | "ord_abcdef0123456789abcdef01 を確認" | `[REDACTED:ORDER_ID] を確認` |
| C3 | "sk-AbCdEf0123456789AbCdEf0123456789AbCdEf0123456789 を取得" | `[REDACTED:API_KEY] を取得` |
| C4 | "hironori555@gmail.com に送信" | `[REDACTED:EMAIL] に送信` |
| C5 | "+819012345678 にコール" | `[REDACTED:PHONE] にコール` |
| C6 | "on-call: <oncall-name>" | `on-call: [REDACTED:ONCALL]` |
| C7 | "Bearer eyJhbGciOiJIUzI1NiI..." | `[REDACTED:API_KEY]` |
| C8 | "通常 query (PII なし)" | redact 0 (passthrough) |
| C9 | "PII 5 件混在 query" | warning log 発火 + 全件 redact |
| C10 | "Owner allowlist mail" | P4 redact + P1 hint 判定 |
| C11 | "vc_abcdef0123456789abcdef0123456789" (Vercel token) | `[REDACTED:API_KEY]` |
| C12 | "0120-456-789" (フリーダイヤル想定外) | redact 判定スキップ (false-positive 防止 = JP 03/06 prefix 除外) |

---

## §4 物理化 step (R31 Knowledge-Z 担当想定)

### 4.1 step S1: pii-allowlist.json 起票 (30 min)

`projects/PRJ-019/knowledge/pii-allowlist.json` 新規起票。Owner 関係 + on-call 担当者 allowlist (5-10 件想定 / Owner 拘束 1 min review path 連動)。

### 4.2 step S2: regex pattern impl (60 min)

`projects/PRJ-019/knowledge/pii-redact-patterns.ts` (もしくは `.py` 等 / 物理化機構連動) 新規起票。P1-P6 6 系統 regex pattern を定数化、export 関数 `redactPII(query: string): { redacted: string, hits: PIIHit[] }` 提供。

### 4.3 step S3: pipeline 入口 wire (60 min)

retrieval pipeline 入口 (HITL 第 9 種 `dev_kickoff_approval` 直前 / INDEX query 前) に `redactPII()` 呼び出し挿入。warning log 5 件以上 trigger も実装。

### 4.4 step S4: unit test 8-12 case 物理化 (60 min)

`projects/PRJ-019/knowledge/__tests__/pii-redact.test.ts` (もしくは harness 連動 file) 新規起票、上記 §3.4 12 case を実装、PASS 判定。harness PASS 数 902 → 902+12 = **914 PASS 想定** (R31 Knowledge-Z 着地値想定)。

### 4.5 step S5: 既存 entry 全件 verify (30-60 min)

INDEX-v18 全 200 entries に対し audit 実施、false-positive / false-negative 件数 report 起票 (`projects/PRJ-019/reports/knowledge-z-r31-pii-redact-audit.md` 想定)。

### 4.6 step S6: spec 物理化 完遂 report 起票 (30 min)

`projects/PRJ-019/reports/knowledge-z-r31-pii-redact-stage-1-impl.md` 起票で R31 完遂宣言、stage-2 (LLM 二段階) 引継 spec 提示。

**合計**: 30 + 60 + 60 + 60 + 30-60 + 30 = **270-300 min = 4.5-5h** (target 4-6h 内達成想定)

---

## §5 stage-2 (LLM 二段階) connecting path

### 5.1 LLM 二段階 stage の目的

regex (P1-P6) で false-negative 検出される PII (含意推定 / 文脈ベース PII / 別言語 PII 等) を LLM で 2nd stage 検出。

### 5.2 LLM stage 入力

```
[stage-1 redacted query]
       ↓
   ┌───────────────────────┐
   │ STAGE 1.5: LLM check  │ ← R32 stage-2 物理化対象
   │  (LLM PII detection)  │
   └───────────────────────┘
       ↓
[stage-2 redacted query]
       ↓
[INDEX query]
```

### 5.3 stage-2 → stage-3 escalation

LLM stage で confidence 低い (< 0.8) match を human review にエスカレート (HITL 第 11 種 trigger 経由 / Review 部門 ODR-OG-06 連動 / R33 stage-3 物理化対象)。

---

## §6 Review 部門 ODR-OG-06 連動

R29 議決完遂時、Review-U R29 が ratify 投票者として参加。本 spec 物理化時 (R31) も Review 部門 ODR-OG-06 (PII 検査経路 spec) 連動で audit 実施想定。具体的には:

1. **R31 Review-V audit**: 物理化前の本 spec を Review-V が事前 audit (Critical 0 / Major 0 / Minor 0 確認)
2. **R31 物理化後 verify**: regex pattern + unit test の挙動を Review-V が事後 verify
3. **R32 stage-2 連動**: LLM stage 物理化前に Review-W が ODR-OG-06 spec 拡張承認

---

## §7 制約遵守 verification (本 spec 起案時点)

| 制約 | 状態 | 確証 |
|------|------|------|
| HITL 第 11 種 ratified 継承 | OK | R29 議決完遂 base 採用 |
| Review 部門 ODR-OG-06 連動 | OK | §6 で明記 |
| API call $0 (本 spec 起案時) | OK | Read + Write のみ / 物理化は R31+ 別 round |
| 副作用 0 | OK | 既存 file 改変 0 / 新規 file 作成のみ |
| 絵文字 0 | OK | 0 件 |
| Owner 拘束 0 分 (本 round 内) | OK | 物理化時 (R31) の allowlist review 1 min は別途 |
| INDEX-v17 absolute 無改変 | OK | Read のみ |
| 既存 200 entries `pii-redacted: true` 維持 | OK | 物理化時 audit で再 verify |
| sec yml 12 file md5 不変 | OK (28 round 連続継承) | 本 round 改変 0 |

---

## §8 R31 Knowledge-Z 引継 checklist

| 項目 | status | 備考 |
|------|--------|------|
| 本 spec (`knowledge-y-r30-pii-redaction-impl-stage-1-spec.md`) | 起案完遂 (本 round) | R31 物理化 base |
| pii-allowlist.json 起票 | R31 物理化対象 | 30 min 工数 |
| pii-redact-patterns.ts 起票 | R31 物理化対象 | 60 min 工数 |
| retrieval pipeline 入口 wire | R31 物理化対象 | 60 min 工数 |
| unit test 8-12 case | R31 物理化対象 | 60 min 工数 / harness 902→914 想定 |
| 既存 200 entries audit | R31 物理化対象 | 30-60 min 工数 |
| 完遂 report 起票 | R31 物理化対象 | 30 min 工数 |
| Review-V audit 連動 | R31 連動 | ODR-OG-06 連動 |
| **総工数想定** | **270-300 min = 4.5-5h** | target 4-6h 内達成想定 |

---

## §9 結語

R29 Knowledge-X 議決完遂 (HITL 第 11 種 ratified) を base に、R30 Knowledge-Y で regex 実装第 1 弾 spec を起案完遂。6 系統 regex pattern (P1-P6) + retrieval pipeline 入口 auto-redact + unit test 8-12 case + 既存 200 entries audit = R31 物理化 (工数 4-6h) で stage-1 完成、R32 stage-2 (LLM) → R33 stage-3 (human escalation) connecting path 確保。Review 部門 ODR-OG-06 連動。Owner 拘束 0 分 (本 round) / 1 min (R31 allowlist review)。

---

(PII redaction impl-stage-1 spec / Knowledge-Y R30 起票完遂 / R31 Knowledge-Z 物理化 base / 6 系統 regex + pipeline + unit test + audit / 4-6h 工数 / Review 部門 ODR-OG-06 連動 / stage-2 LLM 二段階 + stage-3 human escalation connecting path)
