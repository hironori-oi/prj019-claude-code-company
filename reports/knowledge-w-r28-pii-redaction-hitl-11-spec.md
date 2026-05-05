# PII 保護 redaction HITL 第 11 種 `knowledge_pii_review` spec 起案 (Round 28 Knowledge-W)

最終更新: 2026-05-06
作成: Knowledge-W (Round 28)
status: **DRAFT (R28 起案 / R29 議決見込 / R30 実装見込)**
連携: Review 部門 ODR-OG-06 (CLAUDE.md L42 「正式化検討中」明記済)

---

## §0 経緯と起案根拠

CLAUDE.md L36-42 「ナレッジ蓄積 (DEC-019-033 で拡張、2026-05-03)」の **PII 保護** 項に以下が明示されている:

> **PII 保護**: 抽出時に PII / 顧客情報 / API キーを自動 redaction (HITL 第 11 種 `knowledge_pii_review` で人間チェック可、Review 部門 ODR-OG-06 で正式化検討中)

R28 task 5 「PII 保護 redaction 第 11 種 HITL `knowledge_pii_review` spec 起案 (R28 着地候補)」に従い、本 spec を **DRAFT** として起票する。

---

## §1 HITL 第 11 種 `knowledge_pii_review` 全体像

### 1.1 位置づけ

| HITL 種 | 名称 | 対象 |
|--------|------|------|
| 第 1 種 | `client_communication_approval` | クライアント送信前 |
| 第 2 種 | `production_deployment_approval` | 本番デプロイ前 |
| 第 3 種 | `dec_motion_review` | DEC 議決前 |
| 第 4 種 | `phase_transition_approval` | Phase 移行前 |
| 第 5 種 | `quality_gate_approval` | 品質ゲート通過前 |
| 第 6 種 | `pricing_change_review` | 料金変更前 |
| 第 7 種 | `external_resource_approval` | 外部 SaaS 契約前 |
| 第 8 種 | `legal_clearance_review` | 法務関連発行前 |
| 第 9 種 | `dev_kickoff_approval` | 開発 kickoff 前 (knowledge retrieval 入力経路) |
| 第 10 種 | `incident_response_approval` | 重大インシデント対応 |
| **第 11 種 (本 spec)** | **`knowledge_pii_review`** | **knowledge entry 抽出 / 公開 / retrieval 引用前** |

### 1.2 trigger 経路

| trigger | 発火条件 |
|---------|---------|
| T1 | `organization/knowledge/` 配下に新規 entry を物理 commit する直前 |
| T2 | `projects/PRJ-XXX/knowledge/INDEX-vN.md` 起票時の新規 entry 抽出時 |
| T3 | HITL 第 9 種 `dev_kickoff_approval` 内の retrieval 引用時 (`§(f) 既存ナレッジ参照`) |
| T4 | `organization/knowledge/` 公開化される PR / commit に対する自動スキャン時 |
| T5 | Review 部門 ODR-OG-06 連動 review 時 (人間 reviewer escalation 経路) |

---

## §2 検査対象 PII カテゴリ

### 2.1 機械検出可能 (regex layer)

| カテゴリ | regex 例 | redaction 後 |
|---------|---------|------|
| メールアドレス | `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}` | `[REDACTED:EMAIL]` |
| 電話番号 (日本) | `0\d{1,4}-\d{1,4}-\d{4}` / `\+81-\d+` | `[REDACTED:PHONE]` |
| クレカ番号 | `\b(?:\d{4}[-\s]?){3}\d{4}\b` | `[REDACTED:CC]` |
| API キー / token | `sk-[A-Za-z0-9]{20,}` / `ghp_[A-Za-z0-9]{36,}` 等 | `[REDACTED:API_KEY]` |
| AWS access key | `AKIA[A-Z0-9]{16}` | `[REDACTED:AWS_KEY]` |
| 郵便番号 | `〒?\d{3}-\d{4}` | `[REDACTED:ZIP]` (context-dependent) |
| IP アドレス | `\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}` | `[REDACTED:IP]` (context-dependent) |
| SSH 秘密鍵 | `-----BEGIN .*PRIVATE KEY-----` | `[REDACTED:PRIVATE_KEY]` |

### 2.2 文脈依存検出 (LLM layer)

| カテゴリ | 検出方式 | redaction 後 |
|---------|---------|------|
| Owner 個別固有名詞 | LLM context 判定 (氏名 + Owner role context) | `[REDACTED:OWNER_NAME]` |
| on-call 担当者氏名 | LLM context 判定 (氏名 + on-call role context) | `[REDACTED:ONCALL_NAME]` |
| 顧客情報 (社名 + 個別事案紐付き) | LLM context 判定 | `[REDACTED:CLIENT_INFO]` |
| orderId payload | LLM context 判定 (UUID 形式 + order context) | `[REDACTED:ORDER_ID]` |
| 内部 IP / hostname | LLM context 判定 (private CIDR + 内部 hostname pattern) | `[REDACTED:INTERNAL_HOST]` |
| 内部 Slack channel 名 | LLM context 判定 (`#channel-name` + 内部 channel naming) | `[REDACTED:INTERNAL_CHANNEL]` |

---

## §3 redaction 二段階方式

### Stage 1: regex 機械層

```
入力 entry text
  ↓ regex pattern set 適用 (上記 §2.1 全パターン並列)
  ↓ match 全件を `[REDACTED:カテゴリ]` に置換
出力: regex-cleaned text
```

- 副作用 0 (純 string transform)
- 高速 (1 entry あたり数 ms)
- false negative 多 (context 依存 PII は検出不可)

### Stage 2: LLM context 層

```
入力 regex-cleaned text
  ↓ LLM prompt: "以下のテキストに残存する PII を検出し、`[REDACTED:カテゴリ]` 形式で置換せよ"
  ↓ LLM 出力 + diff 計算
  ↓ Stage 1 と diff = LLM が追加検出した PII 数
出力: redacted text + redaction_metadata
```

- API call: あり (Stage 2 のみ / 1 entry あたり 1 call)
- 検出精度高 (context 依存 PII 含む)
- false positive 防止: LLM 出力を必ず Review 部門 human escalation 経路に通す (高 confidence のみ自動採用)

### Stage 3: human escalation (Review 部門 ODR-OG-06)

```
redacted text + redaction_metadata
  ↓ pii_review_required: true (LLM 検出件数 > 0 の場合) ならば
  ↓ Review 部門 reviewer に escalation
  ↓ reviewer が承認 / 修正 / reject
  ↓ CEO 最終承認
出力: published entry
```

- 副作用 0 (entry 公開前のみ実施 / 既存 entry 全件保護)
- 平均 escalation 時間: 1 entry あたり 5-10 min (LLM 検出件数依存)
- skip 条件: regex 検出 0 件 + LLM 検出 0 件 → automatic publish

---

## §4 metadata 構造

各 entry の frontmatter に以下を追加:

```yaml
pii-redacted: true                    # 既存 (継続)
pii-redaction-stage: [regex, llm]     # 新規 (適用 stage 履歴)
pii-redaction-metadata:               # 新規 (検出 + 置換 件数)
  regex-detections: 0
  llm-detections: 0
  total-redactions: 0
  redaction-categories: []            # ['EMAIL', 'PHONE', ...] 等
knowledge-pii-review:                 # 既存 (拡張)
  status: passed                      # passed | pending | failed | escalated
  reviewer: [REDACTED:REVIEWER_NAME]  # human reviewer (Review 部門)
  reviewed-at: 2026-05-06T10:00:00Z
  ceo-approval: passed                # passed | pending | rejected
  ceo-approved-at: 2026-05-06T11:00:00Z
```

---

## §5 副作用 / コスト評価

| 軸 | 評価 |
|----|------|
| API call 増 | Stage 2 LLM のみ / 1 entry あたり 1 call (約 $0.001-0.01 想定) |
| 既存 entry への影響 | 0 (既存 entry 全件 `pii-redacted: true` 維持 / 新規 entry のみ第 11 種適用) |
| 起票時間増 | 1 entry あたり 数秒 (regex) + LLM call 数秒 + escalation 5-10 min (escalation 時のみ) |
| 後方互換 | 100% 維持 (旧 metadata schema は継続有効 / 新 schema は addtitive) |
| Review 部門負荷 | escalation 経路のみ / 1 round あたり 0-3 件想定 (regex で 95% 検出見込) |

---

## §6 Round 30 実装 path 想定

### Round 28 (本 round)

- spec **DRAFT** 起案 (本 file)
- INDEX-v16.md §6 に summary 反映済

### Round 29 (議決)

- HITL 第 11 種 を DEC-019-082 (仮) として議決
- Review 部門 ODR-OG-06 と並列 review
- 議決成立 → R30 実装着手

### Round 30 (実装)

- `scripts/knowledge-pii-redact.sh` (regex layer / 約 80 行想定)
- `scripts/knowledge-pii-redact-llm.ts` (LLM layer / 約 150 行想定)
- `scripts/knowledge-pii-escalate.sh` (Review 部門 escalation / 約 50 行想定)
- frontmatter schema 拡張 (上記 §4)
- smoke test: 既存 v15-v16 entry 全件で `pii-redacted: true` 維持確認

### Round 31+ (運用)

- v17 起票時に新規 entry へ第 11 種適用
- 既存 v15-v16 entry は **遡及適用なし** (絶対不変保護 / 新 schema のみ addtitive)

---

## §7 制約遵守 verification (本 spec 起案)

| 制約 | 状態 | 確証 |
|------|------|------|
| 既存 entry 全件保護 | OK | 第 11 種は新規 entry にのみ適用 / 既存 v15-v16 entry 遡及適用なし |
| API call $0 (R28 spec 起案) | OK | 本 round = Read + Write のみ / Stage 2 LLM 実装は R30 |
| 副作用 0 | OK | 本 file は新規作成 / 既存 file 改変 0 |
| 絵文字 0 | OK | 全成果物で絵文字使用 0 |
| Owner 拘束 0 分 | OK | 本 spec 起案内で Owner 確認待ち 0 件 (R29 議決時に Owner 1 min reply 想定) |
| 後方互換 | OK | 旧 metadata schema は継続有効 |

---

## §8 R29 Knowledge-X 引継

1. **HITL 第 11 種 議決経路調整**: PM 部門と連携し DEC-019-082 (仮) として議決議題に追加 (R29 統合採決経路想定)
2. **Review 部門 ODR-OG-06 連動 spec 詳細化**: 本 spec の §3 Stage 3 escalation 経路を Review 部門 ODR-OG-06 と整合化
3. **regex pattern set v1.0 起草**: §2.1 の regex pattern を `scripts/knowledge-pii-redact.sh` 用 v1.0 として実装前 spec を起草

---

(HITL 第 11 種 `knowledge_pii_review` spec / DRAFT / R28 起案 → R29 議決 → R30 実装 path / Round 28 Knowledge-W 起票完遂)
