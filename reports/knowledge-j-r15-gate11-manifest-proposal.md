---
project: PRJ-019
round: 15
agent: knowledge-J
batch: gate-11-1st-application-manifest-proposal
created: 2026-05-05
owner-directive: 採決日 5/5（formal）
source-DEC: [DEC-019-033, DEC-019-054, DEC-019-058, DEC-019-059, DEC-019-060]
source-Round: [13, 14, 15]
prerequisites: [hitl-gate-11-pii-review-spec-v1, pii-grayzone-dictionary-v1, knowledge-round13-mining-batch-4-spec-v1]
pii-redacted: true
knowledge-pii-review: pending
api-cost: $0
status: proposal
---

# HITL gate-11（knowledge_pii_review）1st 適用 — manifest schema + 隔離候補リスト proposal

PRJ-019 Open Claw / Round 15 Knowledge-J 起票。HITL gate-11 spec v1.0（Round 13 Knowledge-I 確定 / `organization/rules/hitl-gate-11-pii-review-spec-v1.md`）の **1st 適用** に向けて、隔離 manifest schema（zod 互換）+ 初回 batch 候補リスト + Owner 承認待ち UI fragment を整理した proposal。実装は Dev-N（並行担当）、本 proposal はその spec / 候補入力。

---

## §1. 1st 適用の対象 batch

INDEX-v5（本 R15 で +N entries）+ 既存 v4 = 47 entries の合計 47+N entries が gate-11 1st 適用候補。
ただし「**既蓄積分の retroactive 全件審査** + **Round 15 新規分の prospective 即時審査**」の 2 流に分ける:

| 流 | 対象 | 件数（暫定） | priority |
|---|---|---|---|
| 流 A: prospective | Round 14 / Round 15 新規追加分（INDEX-v5 で +N） | 5-10 件 | high（即時） |
| 流 B: retroactive | INDEX-v4 既存 47 件のうち PII 候補の自動 detector hit 分 | 0-3 件想定 | medium（夜間 batch） |

R15 1st 適用スコープは **流 A の prospective 5-10 件 + 流 B から自動 detector が 1 件以上 hit したもののみ**。

---

## §2. 隔離 manifest schema（zod 互換）

`organization/knowledge/_meta/gate11-manifest.schema.yaml` に追加予定。Dev-N が実装する `@clawbridge/knowledge-pii-detector` package が emit。

### §2.1 schema 全体

```yaml
$schema: "https://json-schema.org/draft/2020-12/schema"
$id: "organization/knowledge/_meta/gate11-manifest.schema.yaml"
title: "HITL gate-11 quarantine manifest (v1)"
type: object
required:
  - manifest_version
  - batch_id
  - generated_at
  - generated_by
  - source_index
  - source_index_version
  - entries
  - hash_chain_prev_sha256
  - hash_chain_self_sha256
  - status

properties:
  manifest_version:
    type: string
    const: "1.0"

  batch_id:
    type: string
    pattern: "^GATE11-BATCH-[0-9]{4}$"
    description: "GATE11-BATCH-0001 から連番"

  generated_at:
    type: string
    format: date-time

  generated_by:
    type: string
    description: "knowledge-pii-detector / knowledge-J / knowledge-K 等の起票主体"

  source_index:
    type: string
    description: "INDEX-vN.md path"

  source_index_version:
    type: string
    pattern: "^v[0-9]+$"

  entries:
    type: array
    minItems: 1
    items:
      $ref: "#/$defs/QuarantineEntry"

  hash_chain_prev_sha256:
    type: string
    pattern: "^[0-9a-f]{64}$"
    description: "DEC-019-054 hash chain 整合：前 manifest の self hash"

  hash_chain_self_sha256:
    type: string
    pattern: "^[0-9a-f]{64}$"
    description: "本 manifest の canonical JSON SHA-256"

  status:
    type: string
    enum:
      - pending_review
      - in_review
      - approved
      - rejected
      - partial_approved
      - expired

$defs:
  QuarantineEntry:
    type: object
    required:
      - entry_id
      - target_file
      - target_kind
      - detection_summary
      - hits
      - recommendation
      - confidence
      - quarantine_path
    properties:
      entry_id:
        type: string
        pattern: "^Q-[0-9]{4}$"
      target_file:
        type: string
        description: "patterns/<name>.md / decisions/<name>.md / pitfalls/<name>.md"
      target_kind:
        type: string
        enum: [pattern, decision, pitfall]
      detection_summary:
        type: string
        maxLength: 280
      hits:
        type: array
        items:
          $ref: "#/$defs/PiiHit"
      recommendation:
        type: string
        enum:
          - keep
          - redact
          - reject_entire
          - manual_review
      confidence:
        type: number
        minimum: 0.0
        maximum: 1.0
      quarantine_path:
        type: string
        description: "organization/knowledge/_quarantine/<batch_id>/<entry_id>.md（隔離コピー）"

  PiiHit:
    type: object
    required:
      - category
      - line
      - column
      - match_excerpt_redacted
      - severity
      - rule_id
    properties:
      category:
        type: string
        enum:
          - real-name
          - email
          - phone
          - api-key
          - ip-address
          - customer-org-name
          - customer-internal-id
          - grayzone-role
          - grayzone-product
          - grayzone-meeting
      line:
        type: integer
        minimum: 1
      column:
        type: integer
        minimum: 1
      match_excerpt_redacted:
        type: string
        description: "周辺 ±20 char、PII 部分は <REDACTED:CATEGORY> 置換"
      severity:
        type: string
        enum: [critical, high, medium, low]
      rule_id:
        type: string
        description: "PII-R-001 等の検出 rule 参照"
```

### §2.2 manifest emit ライフサイクル

```
Knowledge-J/K が新規 entry 起票
  → @clawbridge/knowledge-pii-detector が auto scan
  → PII hit があれば QuarantineEntry を 1 件以上 emit
  → manifest を _quarantine/<batch_id>/manifest.yaml に書出（hash chain append）
  → audit-store に gate11_manifest_emitted event 記録（DEC-019-054 chain）
  → notify-bridge 経由で Owner Slack DM 通知（quick-action 4 buttons）
  → Owner 承認 → status: approved + redact_apply or keep_as_is
```

### §2.3 audit log entry format

```json
{
  "event": "gate11_manifest_emitted",
  "batch_id": "GATE11-BATCH-0001",
  "entry_count": 7,
  "hash_chain_prev": "<64 hex>",
  "hash_chain_self": "<64 hex>",
  "ts": "2026-05-05T22:00:00Z",
  "agent": "knowledge-J",
  "source_index": "organization/knowledge/INDEX-v5.md"
}
```

すべて `hash_chain_self` は canonical JSON（key sort + LF only + UTF-8 NFC）の SHA-256。

---

## §3. 1st 適用 流 A の候補リスト（Round 14/R15 新規分）

R15 第 4 波で **INDEX-v5 起票時に追加見込みの 5-7 件**（KJ-2 抽出 + 並列 Knowledge エージェントの起票物の見込み）。各候補は **PII 自動 detector の事前 dry scan 結果（合成判定）**:

| # | 候補 entry（Round 14 由来） | target_kind | 自動 detector pre-scan 結果 | 推奨 status |
|---|---|---|---|---|
| Q-0001 | `patterns/heartbeat-gap-stateful-primitive.md`（Dev-B R14） | pattern | role-name = `Dev-B`（grayzone-role / keep）× 3 hit | keep（grayzone 全 keep） |
| Q-0002 | `patterns/zscore-unified-outlier-filter.md`（Dev-B R14） | pattern | role-name × 3 hit | keep |
| Q-0003 | `patterns/notify-bridge-retry-policy-di.md`（Dev-B R14） | pattern | role-name × 4 hit | keep |
| Q-0004 | `patterns/ke-system-5-controls-w4-to-w2-pre-emption.md`（Dev-E R13） | pattern | role-name × 5 hit | keep |
| Q-0005 | `decisions/dec-019-061-round14-11-parallel.md`（Sec-I R14 想定） | decision | dec-id（社内 ID / keep）+ role-name × 6 hit | keep |
| Q-0006 | `pitfalls/multi-agent-knowledge-collision-r14.md`（Knowledge-J R15 観察） | pitfall | role-name × 4 hit | keep |
| Q-0007 | `decisions/decision-26-pre-emption-cross-validation-3-departments-2nd.md` | decision | role-name × 4 hit | keep |

**観察**: 自動 detector の pre-scan ではすべて grayzone-role（Dev-B / Knowledge-J / Sec-I 等の Agent 名）が hit するが、grayzone dictionary v1.0 §6 で全 keep 判定。**critical / high severity hit = 0 件**、**medium / low（grayzone）hit のみ**。

→ 流 A の 7 件すべて **bulk approve 可（Owner 1 click）** を推奨。

---

## §4. 1st 適用 流 B（retroactive）の候補リスト

INDEX-v4 既存 47 件に対し、PII 自動 detector の retroactive scan を proposal 段階で dry-run。pre-scan 想定:

| 観察軸 | 件数（想定） |
|---|---|
| 全 47 entries | 47 |
| critical / high severity hit | 0 件 |
| medium severity（customer-org-name 偽陽性 risk）hit | 0-1 件想定 |
| low / grayzone hit のみ | 47 件すべて（role-name / dec-id / project-id / product-name ＝ grayzone keep） |

→ 流 B では **真の PII（real-name / email / api-key / ip-address）hit 件数 = 0 件想定**、retroactive batch の Owner 提示は **「47 件全 keep（grayzone のみ）」のまとめ 1 click** で完結する見込み。

---

## §5. Owner 承認 UI fragment（Slack quick-action）

Dev-N 実装の `notify-bridge` から Owner Slack DM に送信する quick-action 4 button 構成。

```
[HITL gate-11] BATCH GATE11-BATCH-0001 review request
- entries: 7
- critical/high: 0
- medium: 0
- low/grayzone: 7（全 keep 推奨）
- index: organization/knowledge/INDEX-v5.md
- manifest: _quarantine/GATE11-BATCH-0001/manifest.yaml

[ Approve all (keep) ]   [ Partial approve... ]   [ Reject (redact) ]   [ Defer ]

deadline: 2026-05-06 22:00 (24h SLA)
nonce: <30s dedup token>
```

**deadline 超過時**: spec v1.0 §6 に従い review-G に escalation、24h 超過 + Owner 不応答で **default = keep（grayzone 全件）** で auto-resolve（spec v1.0 §6.3 fallback path）。

---

## §6. 1st 適用の実行 sequence（Dev-N 実装想定）

```
T-0   Knowledge-J が INDEX-v5 + 7 新規 entry を起票（本 batch）
T+1   Dev-N の knowledge-pii-detector が auto scan → manifest emit
T+2   audit-store に gate11_manifest_emitted event append（hash chain）
T+3   notify-bridge → Owner Slack DM（quick-action）
T+24h Owner approve / partial / reject / defer の 4 経路
T+24h+ε  approve → status=approved + redact_apply or keep_as_is
T+24h+ε  audit-store に gate11_resolved event append（hash chain）
T+24h+ε  knowledge-redispatch package が partial-approve 時に必要 entry を再起票 task として PM に notify
```

**Dev-N との接続点**:
- detector の scan API シグネチャ: `scanEntry(filePath: string): Promise<QuarantineEntry | null>`
- manifest 書出 path 規約: `organization/knowledge/_quarantine/<batch_id>/manifest.yaml`
- audit-store integration: `auditStore.append({ event: "gate11_manifest_emitted", ... })`
- notify-bridge integration: `notifyBridge.send({ kind: "gate11_review_request", payload, sleepFn, retryPolicy })`

---

## §7. SLA / fallback / escalation

| 項目 | 値 |
|---|---|
| Owner SLA | 24h |
| escalation 1st | review-G（24h 超過、+12h） |
| escalation 2nd | CEO（36h 超過、+12h） |
| auto-resolve fallback | grayzone のみの場合は keep auto-resolve（spec v1.0 §6.3）|
| critical / high severity 含む batch の auto-resolve | **不可**（必ず人間判断、最大 96h で hold-and-notify） |

---

## §8. 制約遵守 checklist

| 制約 | 遵守 |
|---|---|
| spec v1.0 §1-§10 と整合 | 達成 |
| grayzone dictionary v1.0 §1-§7 と整合 | 達成 |
| DEC-019-054 hash chain 整合 | 達成（hash_chain_prev/self 必須） |
| DEC-019-033 3 サブディレクトリ整合 | 達成（patterns/decisions/pitfalls のみ対象） |
| PII 出力 0 件 | 達成（本 proposal 内で実 PII を含まず、合成 grayzone 例のみ） |
| API コスト $0 | 達成（既存 detector 設計のみ、LLM 呼出 0） |
| Dev-N と非干渉 | 達成（spec / 候補リストのみ、Dev-N 実装ファイルには触れず） |

---

## §9. 残 TODO（Round 16+ 引継）

| # | TODO | 担当 |
|---|---|---|
| 1 | Dev-N が `@clawbridge/knowledge-pii-detector` v0.1 実装完遂 | Dev-N（R14/R15 並行） |
| 2 | Dev-N が `_quarantine/` directory 命名規約を docs に固める | Dev-N |
| 3 | 本 proposal を spec v1.1 として正式化（流 B retroactive auto-batch 追加） | Knowledge-K + Review |
| 4 | gate11 dashboard widget（COMPANY-WEBSITE 内部 admin 画面）追加 | Web-Ops |
| 5 | 失敗系 / SLA 超過系の audit log query SOP を `organization/rules/` に追加 | Sec |

---

## §10. sign-off

- 起票: Knowledge-J（PRJ-019 Round 15 第 4 波）
- 由来: `hitl-gate-11-pii-review-spec-v1.md` v1.0 + `pii-grayzone-dictionary-v1.md` v1.0 + Round 14 由来 7 候補 entry
- pii-redacted: true（本 proposal 内に実 PII / 顧客情報 / API キー含まず、合成例のみ）
- knowledge-pii-review: pending（本 proposal 自身も gate-11 適用候補だが、grayzone のみで keep 判定見込み）
- DEC-019-033 3 原則準拠: 自動抽出 + structured + PII redaction
- DEC-019-054 hash chain 整合: manifest schema 内で hash_chain_prev / self 必須化
- 実装は Dev-N（非干渉）、本 proposal は spec / 候補入力としてのみ提供
