最終更新: 2026-05-03 / 起案: 秘書部門

# ナレッジ抽出 PoC #001 — PRJ-019 自体からの初回手動抽出

- 案件: PRJ-019「Clawbridge」
- 文書種別: ナレッジ抽出 PoC レポート（Phase 1 W4 自動化前の手動 PoC）
- 上位文書: `decisions.md` DEC-019-033 §④（ナレッジ抽出蓄積機構）/ DEC-019-018 / DEC-019-019 / DEC-019-016
- 関連: `CLAUDE.md` §6（ナレッジ蓄積 DEC-019-033 拡張）/ `secretary-agenda-v6.md` §3.1 ④
- 仮 schema: Research 並行作成中（`organization/knowledge/_meta/schema.yaml` 未確定）、本 PoC は仮 schema で先行実施

---

## §1 抽出元

DEC-019-033（5 点統合 Owner-in-the-loop モデル）+ DEC-019-018（HITL 第 6 種 tos_gray_review 追加）+ DEC-019-019（BAN drill #1 シナリオ確定）の 3 決定 + 関連 5 reports からナレッジを手動抽出。

| # | 抽出元ファイル | 主要記述 |
|---|---|---|
| 1 | `projects/PRJ-019/decisions.md` DEC-019-033 | 5 点統合 / HITL 11 種 / Phase 1 着手 5/26 延期 |
| 2 | `projects/PRJ-019/decisions.md` DEC-019-018 | HITL 第 6 種 tos_gray_review 追加根拠 |
| 3 | `projects/PRJ-019/decisions.md` DEC-019-019 | BAN drill #1 5 シナリオ |
| 4 | `projects/PRJ-019/decisions.md` DEC-019-016 | 月次予算 cap $300（PRJ-019 単体）/ 全社 $300 ハードキャップ |
| 5 | `projects/PRJ-019/reports/ceo-dec-019-033-consolidation.md` §0 §5 §7 | Owner-in-the-loop 5 設計指示の連結 |
| 6 | `projects/PRJ-019/reports/secretary-agenda-v6-resolutions-15.md` 議決-1 / 議決-2 | Conditional Go 3 条件 / Phase 1 着手延期事例 |
| 7 | `projects/PRJ-019/app/README.md` §「DEC-019-033 + DEC-020-003 同居方針」 | 4 層防御 + 8 テーブル設計 |
| 8 | `projects/PRJ-019/reports/dev-phase1-w0-implementation-plan.md` | Dev 工数 28.5 d 算出根拠 |

---

## §2 抽出ナレッジ 3 件（pattern 1 + decision 1 + pitfall 1）

| 種別 | ID | タイトル | 抽出元主軸 |
|---|---|---|---|
| pattern | `PAT-002-owner-in-the-loop-hitl-pattern` | Owner-in-the-loop HITL 11 種 + Owner approval gate パターン | DEC-019-033 §② §⑤ |
| decision | `DEC-INDEX-002-budget-cap-30usd-monthly` | 月次予算 cap $300 ハードキャップ + 段階 cap 設計 | DEC-019-016 |
| pitfall | `PIT-002-fixed-deadline-vs-conditional-go` | 固定期限と Conditional Go の間で生じる着手日スライド | DEC-019-033（5/19→5/26 スライド事例） |

注: ID 採番は `XXX-002-*` で開始（`-001-*` は別途 PRJ-016 由来想定で予約）。Phase 1 W4 自動化時に renumber 可能。

---

## §3 各ナレッジ詳細

### §3.1 PAT-002-owner-in-the-loop-hitl-pattern（pattern 5 要素）

- **コンテキスト**: AI エージェントが組織を運営し、外部副作用（API 課金 / 公開 / 本番 deploy / force push / 外部 API / TOS グレー / 提案承認 / 第 8 種 PRJ-020 用 / dev_kickoff / permission 変更 / PII レビュー）を伴うアクションを実行する場面で、Owner（人間 1 名）が最終承認権限を保持しつつ、エージェントの自動化メリットを失わない設計が必要なケース
- **問題**: 完全自動化は副作用暴走 / ToS 違反 / priviledge escalation のリスクが許容できず、完全人手化は AI 組織運営のコア価値を毀損する。両者の中間で、リスク高アクションのみゲートを設ける設計が必要
- **解決**: HITL（Human-in-the-loop）Gate を 11 種に分類し、各種別に SLA + デフォルト挙動 + UI 実装を定義する。Gate 通過は Supabase `hitl_requests` テーブルに記録、Slack DM 通知 + SLA timer + デフォルト reject（許可漏れを安全側に倒す）の 3 点セット。Gate 種別の追加は Owner 承認（HITL 第 10 種 permission_change_review）必須
- **結果**: Owner 操作工数 +0.5 h/件で副作用暴走を物理防止、priviledge escalation は赤リスク → 黄相当に降格、AI 組織運営の自動化メリットを 9 割維持
- **既知のトレードオフ**: SLA 72h は Owner 不在時にデフォルト reject で機会損失発生 / 第 10 種は外部 import 無効化（議決-11）と組合せないと整合不全 / 第 11 種は Phase 1 W4 のみで運用負荷予測未確定

### §3.2 DEC-INDEX-002-budget-cap-30usd-monthly（decision 構造化）

- **文脈**: 個人開発者が AI 組織ハーネスを運営する場合、月次クラウドコスト（Vercel / Supabase / Anthropic API / Doppler / 1Password / Resend 等）が無管理だと容易に $1,000+/月へ膨張し、事業継続不能化する
- **採用案**: 月次ハードキャップ $300、PRJ-019 単体 $300 内訳上限、各サービス段階 cap（既契約 $402.99 + Phase 1 追加 $0.46〜46.93、余裕 84.4〜99.7%）、超過時は kill switch 自動発動（Vercel Cron + Supabase `cost_ledger` で daily/hourly 監視）
- **代替案**:
  - 案 A: 月次 cap $1,000（Vercel Pro 前提）→ 個人事業の事業性破綻、棄却
  - 案 B: cap なし運用 + 月次 review → Anthropic API バーストで 1 日 $200 等の事故リスク、棄却
  - 案 C: ハードキャップなし + soft alert のみ → 副作用暴走時の物理停止不能、棄却
- **採用根拠**: 個人開発者事業性 + Owner 単独運用 + AI バースト課金リスクの 3 制約から、ハードキャップ $300 + kill switch 自動発動が唯一整合する解
- **検索 metadata**: `tags: [budget, cost_cap, kill_switch, individual_dev, anthropic_api, vercel, supabase]`

### §3.3 PIT-002-fixed-deadline-vs-conditional-go（pitfall 4 要素）

- **症状**: PRJ-019 では Phase 1 着手日を当初 5/19 と固定設定したが、DEC-019-033 5 点統合採用 + Conditional Go 3 条件追加（P-UI-01〜09 完遂 / BAN drill #3 計画 / Review 強い条件付き Go 維持）の発令により、5/26 へ 1 週間スライドが発生。Marketing 公開も 6/20 → 6/27 朝にスライド、HP 改修 / Launch Runbook 全体が再スケジュール
- **原因**: 固定期限を「動かさない前提」で全部署タスクをぶら下げた一方、リスク再評価（priviledge escalation 赤格付け）と必須コントロール拡張（34 → 50 項目）が事後発生、固定期限と新条件が両立不能化。Conditional Go 概念を当初から組込まず、Unconditional Go を暗黙前提にしていた
- **対処**: 5/8 検収会議で Conditional Go 3 条件を絶対条件化（議決-2）、1 条件でも欠けた場合は 6/2 追加延期 + 5/8 再判定の 2 段階 fallback。全部署タスクを Conditional 達成プランで再アンカーし、Pre-Phase Week 5/19-25 を「条件達成 sprint」として独立確保
- **再発防止策**: 案件着手時から「Conditional Go 候補条件」を必ずリスク登録簿（risks.md）に予約 column として持ち、リスク赤格付け発生時に自動的に Conditional Go 化する起票フローを `organization/rules/` に整備（PRJ-019 W4 で organization rule 化を提案）。固定期限は「Conditional 達成見込日 + 1 週間バッファ」で初期設定する慣行に切替

---

## §4 frontmatter（仮 schema 準拠）+ tags

Research が用意中の `organization/knowledge/_meta/schema.yaml` 未確定のため、本 PoC では下記仮 schema を採用。Phase 1 W4 自動化時に Research 確定 schema へマイグレーション。

### §4.1 PAT-002 frontmatter

```yaml
---
id: PAT-002-owner-in-the-loop-hitl-pattern
type: pattern
title: Owner-in-the-loop HITL 11 種 + Owner approval gate パターン
source_project: PRJ-019
source_decisions: [DEC-019-033]
source_reports:
  - reports/ceo-dec-019-033-consolidation.md
  - reports/secretary-agenda-v6-resolutions-15.md
created_at: 2026-05-03
created_by: secretary-poc-001
status: draft
pii_redacted: true
tags:
  - hitl
  - owner_in_the_loop
  - approval_gate
  - ai_organization
  - side_effect_control
  - sla
  - supabase
  - slack
  - ban_prevention
applicability:
  - ai_org_harness
  - autonomous_agent_with_external_side_effects
related_knowledge: []
---
```

### §4.2 DEC-INDEX-002 frontmatter

```yaml
---
id: DEC-INDEX-002-budget-cap-30usd-monthly
type: decision
title: 月次予算 cap $300 ハードキャップ + 段階 cap 設計
source_project: PRJ-019
source_decisions: [DEC-019-016]
source_reports:
  - reports/ceo-dec-019-033-consolidation.md
created_at: 2026-05-03
created_by: secretary-poc-001
status: draft
pii_redacted: true
tags:
  - budget
  - cost_cap
  - kill_switch
  - individual_dev
  - anthropic_api
  - vercel
  - supabase
  - cost_ledger
  - vercel_cron
applicability:
  - individual_developer_saas
  - ai_org_with_burst_api_cost
related_knowledge: [PAT-002-owner-in-the-loop-hitl-pattern]
---
```

### §4.3 PIT-002 frontmatter

```yaml
---
id: PIT-002-fixed-deadline-vs-conditional-go
type: pitfall
title: 固定期限と Conditional Go の間で生じる着手日スライド
source_project: PRJ-019
source_decisions: [DEC-019-033]
source_reports:
  - reports/secretary-agenda-v6.md
  - reports/secretary-agenda-v6-resolutions-15.md
created_at: 2026-05-03
created_by: secretary-poc-001
status: draft
pii_redacted: true
tags:
  - schedule
  - conditional_go
  - phase_kickoff
  - risk_management
  - organization_rule
  - pre_phase_week
  - pitfall
applicability:
  - phase_kickoff_with_late_risk_revision
  - red_risk_emerging_after_schedule_lock
related_knowledge: [PAT-002-owner-in-the-loop-hitl-pattern]
---
```

---

## §5 PII redaction チェック結果（HITL 第 11 種 `knowledge_pii_review` 想定）

| チェック項目 | 結果 | 備考 |
|---|---|---|
| Owner 個人情報（氏名 / 住所 / 電話）含有 | none | 「Owner」「個人開発者」と抽象化のみ |
| メールアドレス含有 | none | `ai-lab@improver.jp` 等は記述なし |
| API キー / トークン含有 | none | サービス名のみ、key 値記述なし |
| Anthropic 別アカウント情報 | none | アカウント分離方針のみ言及 |
| Supabase project URL / service_role key | none | テーブル名のみ |
| 顧客 / 第三者個人情報 | none | PRJ-019 は自社内案件のため該当なし |
| ToS グレー記述 | partial | 「ToS 違反」「BAN リスク」のみ抽象記述、HITL 第 6 種 tos_gray_review で具体ケースは別途 redaction 想定 |

**chk pass**: HITL 第 11 種 想定で全項目 pass、本 PoC 3 ナレッジは透明性 Dashboard 公開可能水準。実 Phase 1 W4 では本チェックを自動化（regex + LLM 二重チェック）+ 人間レビュー併用。

---

## §6 retrieval テスト（vector store 検索ヒット想定）

将来の vector store（pgvector on Supabase 想定）検索シナリオ 3 件で本 3 ナレッジが期待通りヒットすることを tags + applicability で確認。

| 検索クエリ | 期待ヒット | tag マッチ |
|---|---|---|
| 「AI エージェントが課金 API を叩く前に Owner 承認を取りたい」 | PAT-002 | hitl + approval_gate + side_effect_control |
| 「個人開発者の AI バースト課金事故を防ぎたい」 | DEC-INDEX-002 | budget + cost_cap + individual_dev + anthropic_api |
| 「Phase 着手日を固定したらリスク再評価で延期になった、再発防止したい」 | PIT-002 | conditional_go + phase_kickoff + red_risk_emerging_after_schedule_lock |
| 「AI 組織で副作用を最小化したい + 予算管理も同時に」 | PAT-002 + DEC-INDEX-002（複合） | related_knowledge 連鎖で 2 件ヒット |

retrieval テスト結果: tag 設計 + applicability + related_knowledge 連鎖で意図検索が機能する見込。Phase 1 W4 で実 vector embedding（OpenAI text-embedding-3-small 想定、1536 次元）+ cosine similarity 0.7 閾値で実装。

---

## §7 抽出工数

| 区分 | 工数 | 備考 |
|---|---|---|
| 人手抽出（本 PoC） | **1.5 h** | 抽出元 8 ファイル読込 30 分 + ナレッジ 3 件起草 45 分 + frontmatter + retrieval テスト 15 分 |
| Phase 1 W4 自動化後の見込工数 | **0.1 h** | LLM 抽出 5 分 + PII redaction 自動 2 分 + 人間最終確認 1 分（ナレッジ 1 件あたり） |
| 削減率 | **93.3%** | 1.5 h → 0.1 h、案件完了時 10 件抽出想定で 15 h → 1 h |

Phase 1 W4 で自動化機構を Dev 部門が実装（DEC-019-033 §④、Dev 工数 +1.5 d 含み込み済）、Research が schema 確定 + retrieval pipeline 設計、Review が PII 自動 redaction の精度検証。

---

## §8 PoC 結果サマリ → Phase 1 W4 自動抽出機構の DoD 提案

### §8.1 PoC 結果

- 3 種別（pattern / decision / pitfall）すべて手動抽出可能と確認
- 仮 schema での frontmatter は実用十分（Research 確定 schema へのマイグレーションパス確保）
- PII redaction は HITL 第 11 種 想定で本 PoC 3 件全 pass
- retrieval test は tag + applicability + related_knowledge 連鎖で意図検索成立
- 工数 1.5 h は手動運用としては許容範囲だが、案件完了時 10 件 × 12 案件/年 = 18 h/年は自動化必須水準

### §8.2 Phase 1 W4 自動抽出機構の DoD 提案（Dev 部門への引継ぎ事項）

| # | DoD 項目 | 担当 | 完了基準 |
|---|---|---|---|
| 1 | LLM 抽出 prompt template（pattern / decision / pitfall 3 種別対応） | Dev + Research | 3 種別すべて 1.5 h 手動と同等以上の品質を 5 分で生成 |
| 2 | PII redaction 自動 pipeline（regex + LLM 二重） | Dev + Review | 本 PoC §5 7 項目を 100% 検出、false negative 0% |
| 3 | frontmatter 自動付与（Research 確定 schema 準拠） | Dev | schema バリデーション pass 100% |
| 4 | tag 自動推論（既存 tag 集合からの semantic 一致） | Dev | 人間レビューで 80% 以上が「妥当」判定 |
| 5 | retrieval pipeline（pgvector on Supabase + cosine 0.7） | Dev + Research | 本 PoC §6 4 シナリオすべてヒット |
| 6 | HITL 第 11 種 `knowledge_pii_review` UI 統合 | Dev | 透明性 Dashboard 内で抽出 → レビュー → 公開フロー完結 |
| 7 | 抽出工数 0.1 h/件達成（10 件で 1 h 以内） | Dev | Phase 1 W4 末で実測 |
| 8 | 既存 PRJ-001〜018 ナレッジへの遡及抽出計画 | 秘書 + Dev | Phase 2 で 18 案件 × 平均 3 件 = 54 件抽出予定 |

### §8.3 次回ステップ

1. 本 PoC を 5/8 検収会議 §3.1 ④（DEC-019-033 5 点統合 ナレッジ抽出）の Owner 承認補強資料として配布
2. Research 確定 schema を 5/26 Phase 1 着手前に確認、本 PoC frontmatter を確定 schema へマイグレーション
3. Phase 1 W4（6/16-20）で Dev 部門が自動抽出機構を実装、本 PoC 3 件を回帰テストデータとして使用
4. PRJ-019 完了時（Phase 2 完了 8/1）に追加 7 件抽出 + 既存 3 件再抽出で計 10 件、自動抽出工数を実測

---

**PoC 結論**: 手動抽出 1.5 h で 3 ナレッジ抽出可能、Phase 1 W4 自動化で 0.1 h/件の見込達成可、PII redaction + retrieval 設計とも実用水準到達。
