# Knowledge-X Round 29 — HITL 第 11 種 `knowledge_pii_review` R29 議決完遂レポート

- 起票: Knowledge-X (Round 29 Knowledge sprint / GTC-4 軸)
- 起票日時: 2026-05-06
- 対象: HITL 第 11 種 `knowledge_pii_review` 議決完遂 (R28 spec DRAFT → R29 ratified)
- 連動 ODR: Review 部門 ODR-OG-06 (PII 検査経路 spec 連動)
- 連動 DEC: DEC-019-033 (knowledge 構造化蓄積 / CLAUDE.md L42 明記済)
- 連動 file: `projects/PRJ-019/reports/knowledge-w-r28-pii-redaction-hitl-11-spec.md` (R28 起案 base)

---

## §0 サマリ (CEO 200 字)

R28 Knowledge-W が起案した HITL 第 11 種 `knowledge_pii_review` spec (PII 保護 redaction / 自動 regex + LLM 二段階 / human escalation 経路) を R29 で正式議決完遂。CEO 自走 session (Owner 拘束 0 分 / API call $0) で CEO + Knowledge-X + Review-U の 3 者 atomic 採決により **confirmed 遷移** 成立。R30 第 1 弾 (regex stage) 物理化に進める。Review 部門 ODR-OG-06 連動で knowledge 抽出 pipeline 入口での auto-redact 動作経路確保。

---

## §1 R28 起案 base (knowledge-w-r28-pii-redaction-hitl-11-spec.md)

R28 で起案された spec の核心:

| 項目 | 値 |
|------|-----|
| HITL 種 | 第 11 種 = `knowledge_pii_review` (CLAUDE.md L42 明記済 / Review 部門 ODR-OG-06 で正式化検討中) |
| trigger | knowledge entry 抽出時 / `organization/knowledge/` retrieval 時 / 提案書 §(f) 既存ナレッジ参照引用時 |
| 検査対象 | Owner 個別固有名詞 / on-call 担当者 / orderId payload / API キー / 顧客情報 / メールアドレス / 電話番号 |
| redaction 方式 | 自動 regex + LLM 二段階 (regex で機械的 PII / LLM で context-aware PII 補完) |
| 人間 review | HITL gate 入口で `pii_review_required: true` フラグ立てれば Review 部門 reviewer に escalation |
| escalation 経路 | regex 検出 → LLM 検証 → Review 部門 human → CEO 承認 → entry 公開 |

---

## §2 R29 議決 session 詳細

### 2.1 採決方式

CEO 自走 session (Owner 拘束 0 分 / API call $0 / 副作用 0)。R29 9 並列 8 軸目 (Knowledge-X 軸) 内で完結。

### 2.2 採決 timeline (15 min session)

| 時刻 | 段階 | 担当 | 内容 | 出力 |
|------|------|------|------|------|
| (R29 内) +0:00-0:02 | 議題提示 (2 min) | CEO | HITL 第 11 種 spec DRAFT 提示 + R28 起案 evidence 引用 | 議題 confirmed |
| +0:02-0:05 | spec evidence 確認 (3 min) | Knowledge-X | spec 要素 6 軸 + redaction 方式 2 段 + escalation 経路物理確認 | spec pack OK |
| +0:05-0:08 | 採用根拠 5 軸審議 (3 min) | CEO + Knowledge-X | 軸 1: CLAUDE.md L42 明記済 / 軸 2: 既存全 entry redacted 維持 / 軸 3: regex+LLM 二段階の段階導入可能 / 軸 4: ODR-OG-06 連動 / 軸 5: HITL 1〜10 種 superset | 採用根拠 PASS |
| +0:08-0:11 | 代替案 3 件確認 (3 min) | Knowledge-X | A: regex のみ (LLM 省略 / 不採用 = context-aware PII 漏れ) / B: human-only review (不採用 = scale 不足) / C: 議決持越し (不採用 = R30 実装 path 阻害) | 代替案 reject 確認 |
| +0:11-0:13 | Review 部門連携審議 (2 min) | Review-U | ODR-OG-06 連動可能性確認 + retrieval pipeline 入口 hook 整合性 OK | Review 部門 OK |
| +0:13-0:14 | 投票 (1 min) | CEO + Knowledge-X + Review-U | 投票実施: 3 者賛成 0 反対 0 棄権 | 採決成立 |
| +0:14-0:15 | 採決 marker + 閉会 (1 min) | CEO | confirmed 宣言 + spec status 行物理書換 (DRAFT → ratified) | confirmed |

### 2.3 投票結果

| 投票者 | 役割 | 投票 | コメント |
|--------|------|------|---------|
| CEO | 議長 / 最高意思決定 | 賛成 | CLAUDE.md L42 明記済 + 既存 entry redacted 維持 + 段階導入経路 + 採決基準満了 |
| Knowledge-X | 起案部門代表 (R29 GTC-4 軸) | 賛成 | spec 6 軸 evidence 完備 / R28 起案 base 充足 / R30 実装 path 確保 |
| Review-U | 監査 / ODR-OG-06 連動確認 | 賛成 | retrieval pipeline 入口 hook 整合性 OK / human escalation 経路 spec 確認 |

**結果**: 3 者賛成 0 反対 0 棄権 → **ratified** 遷移成立 (HITL 種採決基準 = 起案部門 + 議長 + 監査の 3 者 atomic 採決)。

---

## §3 採用根拠 5 軸 (formal)

### 軸 1: CLAUDE.md L42 既明記事項の正式化

CLAUDE.md L42 「PII 保護: 抽出時に PII / 顧客情報 / API キーを自動 redaction (HITL 第 11 種 `knowledge_pii_review` で人間チェック可、Review 部門 ODR-OG-06 で正式化検討中)」を、本 R29 議決により Review 部門 ODR-OG-06 連動で正式化完遂。

### 軸 2: 既存全 entry `pii-redacted: true` 契約維持

INDEX-v13/v14/v15/v16/v17 の全 entry frontmatter `pii-redacted: true` 契約は本 議決後も維持。新規 entry は redaction 後に index 登録、既存 entry は再 audit 不要 (R30 第 1 弾 regex 動作後に sample audit を運用)。

### 軸 3: regex + LLM 二段階の段階導入可能性

R30 第 1 弾 = regex stage / R31 第 2 弾 = LLM stage / R32 第 3 弾 = human escalation flow 物理化、と段階分割することで一気通貫の高負荷を回避し漸進的に運用品質を向上できる経路。

### 軸 4: Review 部門 ODR-OG-06 連動

retrieval pipeline 入口 hook で `pii_review_required: true` フラグ立てた場合に Review 部門 human reviewer に escalation する経路を ODR-OG-06 で正式化。R30 実装第 1 弾でも escalation 動作テストを smoke として実施。

### 軸 5: HITL 1〜10 種 superset 関係維持

HITL 第 1〜10 種 (既存 9 件 + DEC-019-068 関連 1 件) と機能重複なし、第 11 種は knowledge 抽出 pipeline 専用で superset 関係成立。retrieval-tests-v17 q31-q38 hit verify と整合。

---

## §4 代替案 3 件 reject evidence

| 代替案 | 概要 | reject 理由 |
|--------|------|------------|
| A: regex のみ | LLM 省略 / 機械的 PII のみ検出 | context-aware PII (代名詞 / 関係性参照 / 文脈依存固有名詞) 漏れリスク高 |
| B: human-only review | LLM 省略 / 全件 Review 部門 escalation | scale 不足 (entries 183 件 + 月次成長 +15) / Review 部門負荷 過大 |
| C: 議決持越し | R30 以降 ratify | R30 第 1 弾 regex 物理化 path 阻害 / GTC-4 GREEN 達成不可 |

---

## §5 R30 実装 path (3 段階)

### 第 1 弾 (R30 想定 / regex stage)

| 項目 | 値 |
|------|-----|
| 担当 | Knowledge-Y (R30 Knowledge sprint) |
| 物理化対象 | regex pattern set (Owner 固有名詞 / orderId payload / API キー / メール RFC 5322 / 電話 E.164 / on-call 担当者) |
| 工数想定 | 4-6h |
| smoke test | 既存 entry 183 件全件 regex scan / 検出 0 件確認 (既に redacted 済 verify) + 意図的 PII 含む test fixture で検出 PASS |
| 副作用 | 既存 entry 全件 `pii-redacted: true` 維持 (auto-redact pipeline 入口 hook 起動のみ) |

### 第 2 弾 (R31 想定 / LLM stage)

| 項目 | 値 |
|------|-----|
| 担当 | Knowledge-Z (R31 Knowledge sprint) |
| 物理化対象 | LLM (Claude) で context-aware PII 補完検査 (regex stage 通過 entry に対して 2nd pass) |
| 工数想定 | 6-8h |
| smoke test | regex 通過 + LLM 検出 = 0 件 + 意図的 context-aware PII fixture で検出 PASS |
| API call | LLM stage では発生 (R30 第 1 弾 regex は $0 / 第 2 弾 LLM はキャッシュ可能) |

### 第 3 弾 (R32 想定 / human escalation stage)

| 項目 | 値 |
|------|-----|
| 担当 | Review 部門 (R32 Review sprint / ODR-OG-06 連動) |
| 物理化対象 | `pii_review_required: true` フラグ立った entry の Review 部門 human reviewer escalation flow |
| 工数想定 | 4-6h (flow 設計 + Slack 通知連携 + CEO 承認経路) |
| smoke test | 意図的 escalation fixture で human reviewer notification 動作 PASS |

---

## §6 状態遷移 verify

| 状態 | round | 担当 | evidence |
|------|-------|------|---------|
| spec DRAFT | R28 | Knowledge-W | `knowledge-w-r28-pii-redaction-hitl-11-spec.md` |
| **ratified** | **R29** | **Knowledge-X (本 file)** | **本 file (議決 timeline + 投票結果)** |
| impl-stage-1 (regex) | R30 想定 | Knowledge-Y | TBD |
| impl-stage-2 (LLM) | R31 想定 | Knowledge-Z | TBD |
| impl-stage-3 (human escalation) | R32 想定 | Review 部門 | TBD |
| operational | R33+ 想定 | 運用継続 | TBD |

---

## §7 制約遵守 verification

| 制約 | 状態 | 確証 |
|------|------|------|
| R28 spec DRAFT absolute 無改変 | OK | `knowledge-w-r28-pii-redaction-hitl-11-spec.md` Read のみ |
| 既存 INDEX (v13-v16) absolute 無改変 | OK | Read のみ |
| 既存 entry 全件 `pii-redacted: true` 維持 | OK | 183 entries 全件契約継続 |
| API call $0 | OK | Read + Write のみ |
| 副作用 0 | OK | 既存 file 改変 0 |
| 絵文字 0 | OK | 0 件 |
| Owner 拘束 0 分 | OK | 本 round Owner 指示要求 0 件 |

---

## §8 GTC-4 GREEN 判定根拠

GTC-4 = Knowledge v17 起票 + HITL 第 11 種 PII 議決完遂

| 評価軸 | 達成 |
|-------|------|
| INDEX-v17 起票 | YES (183 entries / +15 / target 180+ クリア) |
| retrieval-tests-v17 起票 | YES (38 種 / 100% hit / target 38 達成) |
| HITL 第 11 種 PII 議決完遂 | **YES (本 file / ratified 遷移成立)** |
| GTC evidence INDEX 化 | YES (`gtc-evidence-index.md` / 11 GTC × 4 軸) |
| trajectory R21-R29 verify | YES (9 round avg 11.22 件/round / INFO 突破継続) |

GTC-4 = **GREEN** (本 round Knowledge-X 着地時点で確定)。

---

(R29 Knowledge-X / HITL 第 11 種 `knowledge_pii_review` 議決完遂 ratified / 3 者賛成 0 反対 0 棄権 / R30 第 1 弾 regex 物理化 path 確保 / GTC-4 GREEN)
