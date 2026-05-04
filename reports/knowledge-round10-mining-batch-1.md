# Knowledge Round 10 Mining Batch 1 — DEC-019-033 機構コンテンツ前倒し投入

- 起票: Knowledge 部門（暫定）/ R10 Knowledge-θ
- 日付: 2026-05-04
- 案件: PRJ-019 Open Claw / Phase 1 W0 / Round 10
- Authority: DEC-019-025 SOP 準拠 / DEC-019-033 機構 W4 → W0 コンテンツ前倒し（pre-emption）
- 投入先: organization/knowledge/{patterns,decisions,pitfalls}/
- コスト: API 0 / subscription 流量内完遂
- Owner action: 不要

---

## CEO 向け 200 字 summary

DEC-019-033 ナレッジ機構（patterns / decisions / pitfalls 3 サブ）への初期コンテンツ 17 件を W0 前倒し投入完了（W4 機構実装は維持）。Round 7-9 の deliverable から再利用可能ナレッジを抽出、全件 YAML frontmatter + Markdown 本文 + PRJ-019 由来明示 + tag 付け 3 原則順守。PII redaction 済（HITL 第 11 種 knowledge_pii_review pending 明記）。次回 PRJ-019 提案生成 §(f) 既存ナレッジ参照の retrieval 母集団として即時利用可。既存ファイル無改変、organization/knowledge 配下のみ新規作成。

---

## 1. 投入結果サマリ

| サブディレクトリ | DoD 目標 | 投入件数 | 充足 |
|---|---|---|---|
| organization/knowledge/patterns/ | 5+ | **6** | OK |
| organization/knowledge/decisions/ | 5+ | **6** | OK |
| organization/knowledge/pitfalls/ | 5+ | **5** | OK |
| **合計** | 15+ | **17** | OK (1.13×) |

すべて新規作成、既存 16 ファイル（PAT-001 / DEC-001 / PIT-001 / PIT-002 / README 群 / lessons-learned 系）には触れていない。

---

## 2. 抽出ソース（Read 済）

| ソース | 用途 |
|---|---|
| `projects/PRJ-019/reports/dev-round9-needs-scout-and-json-if.md` | needs-scout / dispatcher / Object.freeze denylist / TimeSource DI / zod discriminated union |
| `projects/PRJ-019/reports/dev-w2-prefetch-round8-alpha.md` | hitl-kickoff-gate / dashboard MVP / DevKickoffProposalSchema 8 fields / pre-existing failure 2 件 |
| `projects/PRJ-019/reports/review-round9-critical-13-domain-keyword-set.md` | 13 領域 391 keyword 検証セット / 49 件抜け漏れ / ホワイトリスト 247 件 |
| `projects/PRJ-019/reports/review-round9-tos-monitor-false-positive-matrix.md` | 4 detector × 5 シナリオ 20 セル / high 4 件 / confirmCount 抑制不能 |
| `projects/PRJ-019/reports/review-round9-ban-drill-1-dry-exec-result.md` | BAN drill #1 dry exec / Pass 判定 5 項目 / hash chain 整合 |
| `projects/PRJ-019/app/harness/src/tos-monitor.ts` | NG3_PLANS Plan A/B/C / 4 detector 仕様 / TimeSource 注入箇所 |
| `projects/PRJ-019/decisions.md` 抜粋 (DEC-019-010 セクション ほか) | DEC issuance 文脈 |

---

## 3. 投入ファイル各 1 行 summary

### 3.1 patterns/ (6 件)

| # | ファイル | 概要 |
|---|---|---|
| P1 | `hash-chain-audit-pattern.md` | append-only audit log を SHA-256 chain で改竄不可化、canonical drift も検出 |
| P2 | `kill-switch-G05-G06.md` | SIGTERM → 5s grace → SIGKILL の 2 段停止 + circuit-breaker forceOpen 連動 |
| P3 | `dependency-injection-time-source.md` | TimeSource interface DI で 72h SLA / 24h scoring / retry backoff を test 高速化 |
| P4 | `zod-discriminated-union-IF.md` | discriminatedUnion('messageType') で 4 種 message を 1 schema 化 + TS narrow |
| P5 | `object-freeze-denylist.md` | ToS 13 領域 denylist を Object.freeze で runtime 改竄不可化 + 3 軸判定 fail-safe |
| P6 | `spend-cap-watchdog-3-tier.md` | $24 warn / $28.5 auto_stop / $30 hard_fail の 3 段階 + Anthropic console 二段防御 |

### 3.2 decisions/ (6 件)

| # | ファイル | 概要 |
|---|---|---|
| D1 | `dec-019-010-13-domain-rationale.md` | OpenAI ToS 13 領域 denylist 完全 reject + グレーは HITL escalation |
| D2 | `dec-019-050-spend-cap-30usd.md` | Anthropic API key Hard cap $30/月 + 3 段階閾値 + 二段防御 |
| D3 | `dec-019-052-NG3-plan-B-16h-100usd.md` | NG-3 Plan B (16h/$100/$500) default + Plan C 24/7 REJECT |
| D4 | `dec-019-053-2-tier-env.md` | 2-tier env + 1Password CLI + Slack 3 channel + standalone repo |
| D5 | `dec-019-054-hash-chain.md` | Round 7 案 7-D 4 部署並列前倒し採択 + hash chain Pass 判定組込 |
| D6 | `dec-019-056-round9-6-parallel-dispatch.md` | Round 9 6 並列 + 5/22 朝公開前倒し + Round 10 8 並列拡張 |

### 3.3 pitfalls/ (5 件)

| # | ファイル | 概要 |
|---|---|---|
| F1 | `confirm-count-2-suppress-false-positive.md` | confirmCount=2 では high 4 セル false-positive 抑制不能、override flag + debounce 必須 |
| F2 | `13-domain-denylist-49-gap-detection.md` | 13 領域 denylist 49 件抜け漏れ（critical 7 / major 26 / minor 16）の段階追加計画 |
| F3 | `verbatimModuleSyntax-vitest-ESM.md` | server-only モジュール解決失敗の pre-existing failure 共存方針 |
| F4 | `web-budget-guard-server-only.md` | budget-guard が server-only 依存で test 不可 → domain layer 分離方針 |
| F5 | `hash-chain-recovery-edge-case.md` | reason 文言 drift + chain 部分破損 recovery 手順未整備の SOP 化 |

---

## 4. 全件遵守: DEC-019-033 3 原則

| 原則 | 全 17 件遵守 |
|---|---|
| YAML frontmatter + Markdown 本文 | OK（frontmatter 7-9 fields + 本文 6 セクション統一） |
| PRJ-XXX 由来明示 | OK（`source-PRJ: PRJ-019` を全件 frontmatter に記載） |
| tag 付け | OK（各 4-6 tags、検索性確保） |

frontmatter 共通項目:
- `tags: [...]`（4-6 件）
- `source-PRJ: PRJ-019`
- `source-DEC: [DEC-019-XXX, ...]`
- `source-Round: [7|8|9]`
- `created: 2026-05-04`
- `pii-redacted: true`
- `knowledge-pii-review: pending`（HITL 第 11 種対象明示）

本文 6 セクション統一構成:
1. 概要 / 症状
2. 文脈
3. 採用根拠 / 根本原因
4. 代替案 / 関連パターン
5. 再利用方法 / 再発防止策
6. 出典

---

## 5. PII redaction 結果

| カテゴリ | 検出 | redaction |
|---|---|---|
| メールアドレス | 1 件（Owner allowlist 言及） | `[REDACTED-PII]` 置換済（D4 dec-019-053-2-tier-env.md） |
| API キー文字列 | 0 件 | — |
| Owner / hironori 系個人名 | 0 件（直接表記なし、職位 Owner のみ使用） | — |
| 顧客情報 | 0 件 | — |
| 1Password vault item path | サンプルのみ（`op://Vault/Item/field` 一般形） | redaction 不要 |

全件 frontmatter `pii-redacted: true` + `knowledge-pii-review: pending`（HITL 第 11 種人間チェック対象）を明記。

---

## 6. 既存ファイル無改変確認

| 既存ファイル種別 | 件数 | 改変 |
|---|---|---|
| `organization/knowledge/patterns/` 既存（PAT-001 / README / 3 ガイド） | 5 件 | 無改変 |
| `organization/knowledge/decisions/` 既存（DEC-001 / README） | 2 件 | 無改変 |
| `organization/knowledge/pitfalls/` 既存（PIT-001 / PIT-002 / README） | 3 件 | 無改変 |
| `organization/knowledge/` ルート（INDEX / README / EXTRACTION-ROADMAP / CLAUDE.md / lessons-learned 系） | 9 件 | 無改変 |
| projects/PRJ-019/* 全般 | — | 無改変 |

新規作成のみ 17 件、既存 19 件は touch せず。DEC-019-025 SOP「書込事故ゼロ」要件順守。

---

## 7. retrieval 試験例（次回 PRJ-019 提案生成での想定検索クエリ）

PRJ-019 Open Claw 提案生成（HITL 第 9 種 dev_kickoff_approval 直前）での `knowledgeRefs` field 候補抽出シミュレーション:

### 7.1 検索クエリ例 1: "BAN 防御 cost cap 設計"

期待 hit 順:
1. `decisions/dec-019-050-spend-cap-30usd.md`（tag: spend-cap, hard-cap, cost-control）
2. `patterns/spend-cap-watchdog-3-tier.md`（tag: cost-watchdog, 3-tier-threshold）
3. `decisions/dec-019-052-NG3-plan-B-16h-100usd.md`（tag: NG-3, plan-B, ban-defense）
4. `patterns/kill-switch-G05-G06.md`（tag: BAN-defense, runtime-guard）
5. `pitfalls/confirm-count-2-suppress-false-positive.md`（tag: tos-monitor, detector）

### 7.2 検索クエリ例 2: "HITL 提案 schema 設計"

期待 hit 順:
1. `patterns/zod-discriminated-union-IF.md`（tag: zod, discriminated-union, json-IF）
2. `decisions/dec-019-056-round9-6-parallel-dispatch.md`（tag: agents, knowledge-mining）
3. `patterns/hash-chain-audit-pattern.md`（tag: audit, integrity）

### 7.3 検索クエリ例 3: "ToS 抵触 keyword denylist"

期待 hit 順:
1. `decisions/dec-019-010-13-domain-rationale.md`（tag: OpenAI-ToS, denylist, regulatory）
2. `patterns/object-freeze-denylist.md`（tag: object-freeze, denylist, fail-safe）
3. `pitfalls/13-domain-denylist-49-gap-detection.md`（tag: false-negative, ToS-compliance, coverage-gap）

### 7.4 retrieval 実装方針提案（W4 機構実装担当へ）

- frontmatter `tags` を primary index、source-PRJ / source-DEC を secondary filter
- 本文 ## 概要 セクションを embedding 対象（短文集約）
- 提案書テンプレ §(f) `knowledgeRefs` field（max 50 件）に上位 3-5 件を自動引用
- `knowledge-pii-review: pending` のものは「HITL 第 11 種未承認」マーカーを提案書に併記

---

## 8. Phase 1 W4 機構実装への引継 TODOs

W4 (5/26-6/20) で Dev 部門が機構実装を行う際、本 batch 1 を retrieval 母集団として即時利用可。
追加で実装に必要な機構レイヤ:

| TODO | 担当想定 | 期限 |
|---|---|---|
| `tags` 索引化（YAML parse + inverted index） | Dev | W4 |
| 本文 embedding 化（OpenAI / local model） | Dev / Research | W4 |
| `knowledge-pii-review` HITL 第 11 種 UI（Owner approve flow） | Dev / Review | W4 |
| 提案書 §(f) 自動引用（dispatchToCeo 連動） | Dev | W4 後半 |
| Knowledge mining 自動化（案件完了時の trigger） | Dev / Knowledge | Phase 2 |
| batch 2 mining（Round 10 完遂後の追加抽出） | Knowledge | Round 11 |

---

## 9. コスト実績

| 項目 | 実績 | 想定上限 |
|---|---|---|
| API 課金 | $0.00 | $1.00 |
| 実時間 | ~25 分（Read + Write 並列） | — |
| 外部 API | なし | — |

---

## 10. 確度押上推定（次回 retrieval 連動効果）

| マイルストーン | 期日 | Round 9 完遂時 baseline | batch 1 投入後推定 | 押上 |
|---|---|---|---|---|
| Phase 1 W4 機構実装着地 | 6/20 | 70% | **72%** | +2pt（コンテンツ先行で機構実装の retrieval test 可能化） |
| Phase 1 完了 | 6/27 | 64% | **65%** | +1pt（提案書 §(f) 充実で Owner 判断質向上） |
| Phase 2 移行（Knowledge 部門 ODR-OG-06 正式化） | Phase 2 | — | retrieval 母集団 17 件で実装着手可 | — |

---

## 11. Round 10 並列他 Agent との file conflict 確認

| 並列 Agent | 投入 path | 本 θ との conflict |
|---|---|---|
| R10-α〜η（7 Agent） | projects/PRJ-019/reports/* / app/* (各 Agent scoping) | なし（本 θ は organization/knowledge 配下に閉じる） |
| 本 θ Knowledge | organization/knowledge/{patterns,decisions,pitfalls}/ + projects/PRJ-019/reports/knowledge-round10-mining-batch-1.md | 単独占有 |

DEC-019-025 SOP 「並列 Agent 間 file conflict 禁止」順守、本 θ 投入は他 7 Agent と物理的に非競合。

---

## 12. CEO 報告事項

1. **DEC-019-033 機構の W4 → W0 コンテンツ前倒し投入を完了**（17 件、DoD 15+ を超過 1.13×）
2. **3 原則（YAML frontmatter / PRJ-XXX 由来 / tag 付け）全件遵守**
3. **PII redaction 済 + HITL 第 11 種 pending 明記**で Owner レビュー待機状態
4. **既存ファイル無改変**で書込事故ゼロ、DEC-019-025 SOP 順守
5. **Round 11 引継**: batch 2 mining（Round 10 完遂後の Marketing / PM / Web-Ops 系 deliverable から追加抽出）+ W4 機構実装担当への retrieval 仕様 handoff

---

**起案者**: R10 Knowledge-θ（Knowledge 部門 暫定）
**起案日時**: 2026-05-04 W0-Week1
**Review 部門 oversight**: Round 10 batch 完遂後（HITL 第 11 種 knowledge_pii_review で 17 件人間チェック予定）
**次回 update**: Round 11 batch 2 投入時、または Phase 1 W4 機構実装着手時の retrieval 仕様協議時
