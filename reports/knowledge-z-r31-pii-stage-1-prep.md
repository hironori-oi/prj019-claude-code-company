---
tags: [knowledge, pii, redaction, hitl-11, stage-1, prep, prj-019, round31, knowledge-z]
report-version: r31-pii-stage-1-prep-v1
source-PRJ: PRJ-019
source-Round: 31
created: 2026-05-06
created-by: Knowledge-Z (Round 31)
parent-spec: HITL 第 11 種 knowledge_pii_review (R29 議決完遂 / R30 impl-stage-1 spec 起案)
related-DEC: DEC-019-033 (Knowledge 蓄積拡張) + R29 議決ratification
---

# Knowledge-Z R31 HITL 第 11 種 PII Redaction Stage-1 物理化準備

R30 Knowledge-Y が起案した PII redaction regex+LLM 二段階 stage-1 spec を継承し、R31 で物理化準備 (R32 物理化引継) を完遂する。

---

## §0 経緯 (R28 → R31)

| Round | 担当 | status |
|-------|------|-------|
| R28 | Knowledge-W | HITL 第 11 種 PII spec DRAFT 起票 |
| R29 | Knowledge-X | HITL 第 11 種 PII 議決完遂 (ratified) / Review 部門 ODR-OG-06 連動 |
| R30 | Knowledge-Y | impl-stage-1 spec 起案 (regex+LLM 二段階 stage-1) |
| **R31** | **Knowledge-Z (本 round)** | **物理化準備 spec / R32 actual implementation 引継 prep** |

---

## §1 stage-1 物理化対象 (regex+LLM 二段階 stage-1)

### 1.1 stage-1a: regex pre-filter

| PII 種別 | regex pattern | 適用 file |
|---------|--------------|---------|
| email | `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}` | knowledge/* + reports/* |
| phone (JP) | `0\d{1,4}-\d{1,4}-\d{4}` + `\+81\d{9,10}` | 同上 |
| API key (generic) | `(sk-[A-Za-z0-9]{20,}|api[_-]?key[=:][A-Za-z0-9]{20,})` | 同上 |
| credit card | `\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}` | 同上 |
| 顧客名 (個人) | (LLM stage-1b に委譲) | 同上 |
| IPv4 (private 除外) | `\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b` (10./192.168./172.16-31. 除外) | 同上 |

### 1.2 stage-1b: LLM secondary verification

regex pre-filter の hit 候補 + 個人名 / 組織名 / 住所 / 顧客識別子の判定を LLM (Claude / 軽量 model) に委譲、context を加味して final redaction 判定。

| 入力 | 出力 |
|------|------|
| regex pre-filter の hit candidate list + surrounding context (前後 100 char) | redaction 判定 (true/false) + redaction reason (JSON) |

---

## §2 物理化準備 spec (R32 actual implementation 引継)

### 2.1 module 構成 (想定)

```
projects/PRJ-019/knowledge/_pii-redaction/
├── README.md (spec 概要)
├── stage-1a-regex.ts (regex pre-filter / 想定 80 行)
├── stage-1b-llm.ts (LLM secondary / 想定 120 行)
├── stage-1-orchestrator.ts (二段階 orchestrator / 想定 60 行)
├── test/
│   ├── stage-1a-regex.test.ts (10 case 想定 / regex pattern 別)
│   ├── stage-1b-llm.test.ts (8 case 想定 / context 別)
│   └── stage-1-integration.test.ts (5 case 想定 / e2e)
└── fixtures/
    ├── pii-positive.txt (PII 含有 sample / redact されるべき)
    └── pii-negative.txt (PII 不含 sample / redact されないべき)
```

### 2.2 入出力 contract

| 関数 | 入力 | 出力 |
|------|------|------|
| `runStage1Regex(text: string)` | 原文 | `{ matches: PIIMatch[], redactedText: string }` |
| `runStage1LLM(text: string, candidates: PIIMatch[])` | 原文 + regex hit candidates | `{ verifiedMatches: PIIMatch[], redactedText: string }` |
| `runStage1(text: string)` | 原文 | `{ allMatches: PIIMatch[], finalRedactedText: string, stage1aHits: number, stage1bHits: number }` |

### 2.3 redaction marker 仕様

| PII 種別 | redacted marker |
|---------|----------------|
| email | `[EMAIL_REDACTED]` |
| phone | `[PHONE_REDACTED]` |
| API key | `[API_KEY_REDACTED]` |
| credit card | `[CC_REDACTED]` |
| 顧客名 | `[NAME_REDACTED]` |
| IPv4 (public) | `[IP_REDACTED]` |

> redaction marker は idempotent (再 run しても二重 redaction されない) / 既 redacted marker は skip。

---

## §3 物理化準備チェックリスト (R32 引継)

| 項目 | R31 status | R32 担当想定 |
|------|----------|------------|
| regex pattern 確定 | done (本 file §1.1) | Dev-MMM (実装担当想定) |
| LLM prompt template 確定 | spec 確立 (§1.2) | Dev-MMM |
| module 構成確定 | spec 確立 (§2.1) | Dev-MMM |
| 入出力 contract 確定 | spec 確立 (§2.2) | Dev-MMM |
| redaction marker 仕様確定 | done (§2.3) | Dev-MMM |
| test fixture 準備 | spec 確立 (PII positive/negative sample 計 2 file) | Knowledge-AA (R32 担当想定) |
| unit test 23 case spec | spec 確立 (regex 10 + LLM 8 + integration 5) | Dev-MMM |
| HITL 11 連動確認 | ratified (R29 完遂) | Review-X (R32 担当想定) |
| forward-only fix 厳守 | 適用宣言 (本 file 自体も削除 0 / 追加のみ) | Dev-MMM |

---

## §4 R32 物理化時の制約

| 軸 | 制約 |
|----|------|
| 既存 v17/v18/v19 INDEX 改変 | 0 (新規 module / forward-only) |
| 既存 retrieval-tests 改変 | 0 |
| Sec yml 12 file md5 改変 | 0 (Knowledge 由来 31 round 連続継承想定) |
| API call cost (LLM stage-1b) | 案件単価 unit test ≤ $0.50 / production ≤ $X (R32 budget 確定要) |
| Owner 拘束 | 0 分 (R32 自動進行想定) |
| HITL 11 fire 条件 | regex+LLM 二段階完遂後の最終確認 trigger (Review 部門連動) |

---

## §5 副作用宣言 (Round 31 Knowledge-Z)

| 軸 | 状態 |
|----|------|
| 本 file は spec 記述のみ | 物理 module 0 件追加 (R32 引継) |
| 既存 file 改変 | 0 |
| API call cost | $0 (本 round) |
| 絵文字 | 0 |
| Owner 拘束 | 0 分 |
| forward-only fix | 適用済 (本 file 自体は新規 file / 既存無改変) |

---

## §6 R32 引継 summary

1. **module 物理実装** (`projects/PRJ-019/knowledge/_pii-redaction/`)
2. **unit test 23 case 実行** (regex 10 + LLM 8 + integration 5 / target 23/23 PASS)
3. **HITL 11 fire smoke test** (Review 部門連動)
4. **forward-only fix 厳守** (削除 0 / 追加のみ / 既存 INDEX 無改変)
5. **R23-R32 11 round trajectory 連動** (Knowledge-AA R32 担当想定)

---

(EOF / Round 31 Knowledge-Z / PII redaction stage-1 物理化準備完遂 / R32 actual implementation 引継)
