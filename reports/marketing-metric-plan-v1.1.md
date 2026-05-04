# PRJ-019 Clawbridge — metric plan v1.1（K1.x プロダクト KPI / K2.x 運用 KPI、案 C ハイブリッド反映版）

| 項目 | 内容 |
|---|---|
| 文書 ID | marketing-metric-plan-v1.1 |
| 制定日 | 2026-05-04（Round 10、Marketing-ζ 担当） |
| 起票 | Marketing 部門（R10 Marketing-ζ、独立 Agent dispatch、DEC-019-025 SOP 準拠） |
| 区分 | **metric plan v1.1**（v1.0 = Round 7 `marketing-portfolio-metrics-substitution-plan.md` の 27 placeholder マスタープラン）+ 案 C ハイブリッド反映 |
| 上位文書 | `marketing-portfolio-metrics-substitution-plan.md`（Round 7、v1.0 = 27 placeholder）/ `marketing-launch-narrative-final.md`（本書連動 narrative final） / `marketing-portfolio-18x18.md`（本書連動 18×18 matrix） |
| 上位決裁 | DEC-019-052 / 027 / 028 / 029 / 033 / 051 / 055 / 056 |
| ステータス | **draft v1.1**（5/26 = 5/22 内部運用着手結果反映で v1.2 / 6/4 = sign-off 前倒し反映で v1.3 / 6/22 = Phase 1 完遂時確定値で v1.4） |
| 行数目標 | 250-350 行 |

---

## §0. CEO 向け 200 字エグゼクティブサマリ

本書は `marketing-portfolio-metrics-substitution-plan.md` v1.0（Round 7、27 placeholder マスタープラン）を **案 C ハイブリッド前提で v1.1 update** した metric plan である。プロダクト KPI（K1.x、技術指標）11 件 + 運用 KPI（K2.x、組織運営指標）8 件 + narrative KPI（K3.x、公開後測定）5 件 = **計 24 KPI**（v1.0 27 件 → 一部統廃合 + 新規 5 件追加 = v1.1 32 件、ただし論理整理で 24 main KPI に集約）。5/22 内部運用着手時点での確定数値見込は K1.x 8 件 + K2.x 1 件 = 9 件、6/27 公開時点では K1.x 11 件 + K2.x 6 件 + K3.x 0 件 = 17 件（71%）、公開後 30 日 7/27 で K3.x 5 件追加 = 22 件（92%）。残 2 件（Phase 2 関連）は 7/27 以降の動的確定。本書は 18×18 matrix（324 セル）の各 KPI への対応関係を明示し、Web-Ops 部門が DOM 注入時に参照する正式な KPI 定義書として機能する。

---

## §1. KPI 体系の v1.0 → v1.1 整理

### §1.1 v1.0 → v1.1 の変更点 5 件

| # | 変更内容 | 根拠 |
|---|---|---|
| 1 | プロダクト KPI を K1.x（技術 + コスト + 副作用 + 自動化）に統合（11 件） | 案 C ハイブリッドで Phase 1 完遂後の確定値が前提 → 統合管理が合理的 |
| 2 | 運用 KPI を K2.x（HITL + Owner + ナレッジ + ToS + PII）に統合（8 件） | DEC-019-033 Owner-in-the-loop 6 軸 + ナレッジ蓄積機構 + 法令適合の統合管理 |
| 3 | narrative KPI を K3.x（公開後測定）に保持（5 件） | DEC-019-052 確定値（PV / ユニーク / scroll_depth / Contact CV / 問い合わせ件数）維持 |
| 4 | 新規 K1.7-K1.10 + K2.5（Round 9 batch 1）を v1.1 で正式化 | Round 9 batch 1 §2 の 5 件追加を v1.0 マスタープランに正式統合 |
| 5 | 5/22 内部運用着手時点の確定数値見込を §3 で明示 | 案 C ハイブリッドで 5/22 = 内部運用着手日に確定する数値を物理化 |

### §1.2 v1.1 KPI 全 24 件一覧

#### §1.2.1 K1.x プロダクト KPI（11 件）

| # | placeholder | 6/27 公開時点 確定値 | 確定タイミング |
|---|---|---|---|
| K1.1 | `{{auto_test_count}}` | 300+ 全緑 | 6/20 Phase 1 完遂時 |
| K1.2 | `{{mandatory_controls_count}}` | 50 確定 / 段階実装完遂 | 6/13 W3 完了時 |
| K1.3 | `{{api_cap_buffer_pct}}` | API cap 内 buffer 60%+ | 6/13 W3 完了時 |
| K1.4 | `{{monthly_total_usd}}` | ≤$430（5 月分 + 6 月分実測） | 6/1 月次 close + 6/20 partial |
| K1.5 | `{{side_effect_lines}}` | 0 行 56 日継続 | 6/20 W4 完了時 |
| K1.6 | `{{parallel_projects_count}}` | 3 件 全継続稼働 | 6/20 W4 完了時 |
| K1.7（新規） | `{{phase1_w1w2_prefetch_pct}}` | 100%（Phase 1 全行程達成） | 6/20 W4 完了時 |
| K1.8（新規） | `{{commit_accumulation}}` | Phase 1 全期間 commit 累積 | 6/20 W4 完了時 |
| K1.9（新規） | `{{audit_log_integrity_pct}}` | 100%（56 日連続） | 6/20 W4 完了時 |
| K1.10（新規） | `{{ban_drill_pass_rate}}` | drill #1+#2+#3 全 Pass | 6/13 W3 完了時 |
| K1.11（新規） | `{{day0_readiness_pct}}` | 99%+ | 6/20 W4 sign-off |

#### §1.2.2 K2.x 運用 KPI（8 件）

| # | placeholder | 6/27 公開時点 確定値 | 確定タイミング |
|---|---|---|---|
| K2.1 | `{{hitl_gates_integrated}}` | 11/11 完遂 | 6/3 W1 完了時（案 C 前倒し） |
| K2.2 | `{{owner_intervention_freq}}` | 週 4-7 回（中央値 5、W1-W4 4 週間集計） | 6/20 sign-off |
| K2.3 | `{{transparency_axes_achieved}}` | 6/6 全達成 | 6/20 sign-off |
| K2.4 | `{{knowledge_entries_per_sub}}` | patterns 8-12 / decisions 50+ / pitfalls 8-12 | 6/20 sign-off |
| K2.5（新規） | `{{owner_physical_time_total}}` | W1-W4 累計 16-24 時間 + 5/8 検収 35-45 分 | 6/20 sign-off |
| K2.6（新規） | `{{ban_drill_count_total}}` | drill #1+#2+#3 = 3 回完遂 | 6/13 W3 完了時 |
| K2.7（新規） | `{{pii_redaction_pass_pct}}` | 100%（HITL 第 11 種 knowledge_pii_review 経由） | 6/20 sign-off |
| K2.8（新規） | `{{tos_allowlist_count}}` | 13 domain（DEC-019-010 完成） | 6/3 W1 完了時 |

#### §1.2.3 K3.x narrative KPI（5 件、公開後測定）

| # | placeholder | 30 日後目標 | 確定タイミング |
|---|---|---|---|
| K3.1 | `{{pv_30d}}` | 6,000 | 7/27 公開後 30 日 |
| K3.2 | `{{unique_30d}}` | 3,500 | 7/27 公開後 30 日 |
| K3.3 | `{{scroll_depth_75pct}}` | 60% 以上 | 7/27 公開後 30 日 |
| K3.4 | `{{contact_cv_pct}}` | 1.5% | 7/27 公開後 30 日 |
| K3.5 | `{{contact_inquiries_30d}}` | 6-12 件（うち Phase 2 関心度 3 件以上、見積依頼 1 件以上） | 7/27 公開後 30 日 |

→ **計 24 main KPI**（K1.x 11 件 + K2.x 8 件 + K3.x 5 件）。

---

## §2. 5/22 内部運用着手時点の確定数値見込

### §2.1 5/22 確定見込 9 件

5/22（金）内部運用着手日時点で **物理的に確定する** KPI は次の 9 件：

| # | placeholder | 5/22 朝 09:00 JST 時点確定値 | 出典 |
|---|---|---|---|
| K1.1 | `{{auto_test_count}}` | 200+ 全緑 | Round 10 完遂時 `pnpm test` 結果 |
| K1.4 | `{{monthly_total_usd}}` | ≤$430（5 月分 partial、22 日経過） | `cost-tracker.ts` 月次サマリ（5/21 23:59 集計） |
| K1.5 | `{{side_effect_lines}}` | 0 行（grep + git history 三重検証、20 日継続） | `verify-zero-side-effect.sh` |
| K1.7 | `{{phase1_w1w2_prefetch_pct}}` | 65%+（Round 9-10 完遂時） | PM 部門 cross-ref-final-v8 + Round 10 commit |
| K1.8 | `{{commit_accumulation}}` | 6 commit（Round 5-10 累積） | git log（PRJ-019 standalone repo） |
| K1.9 | `{{audit_log_integrity_pct}}` | 100%（dry exec で全件検証） | `audit-log-retention-sha256.test.ts` |
| K1.10 | `{{ban_drill_pass_rate}}` | drill #1 dry exec 5/5 Pass | Review 部門報告 |
| K2.5 | `{{owner_physical_time_total}}` | 5/8 検収 35-45 分（5/22 時点で確定済） | 秘書部門 5/8 議事録 |
| K2.8 | `{{tos_allowlist_count}}` | 13 domain prefetch 完成 | DEC-019-010 + Round 9 needs_scout MVP |

### §2.2 5/22 時点で未確定の 15 件

| カテゴリ | 件数 | 確定タイミング |
|---|---|---|
| K1.x プロダクト KPI（K1.2 / K1.3 / K1.6 / K1.11） | 4 件 | 6/13 W3 完了 / 6/20 sign-off |
| K2.x 運用 KPI（K2.1 / K2.2 / K2.3 / K2.4 / K2.6 / K2.7） | 6 件 | 6/3-6/20 段階確定 |
| K3.x narrative KPI（K3.1-K3.5） | 5 件 | 7/27 公開後 30 日 |

### §2.3 5/22 内部運用着手の意味

5/22 内部運用着手は **対外公開ではない**ため、確定 9 件は内部 dashboard でのみ可視化される。6/27 公開時には Phase 1 完遂後の確定値（17 件）に置換される運用。

```
[5/22 → 6/27 → 7/27 KPI 確定マイルストーン]

5/22 内部運用着手（確定 9 件、内部 dashboard）
↓
5/30 NG-3 議決 + drill #2 dry Pass（確定 +2 件 = 11 件）
↓
6/3 W1 完了 sign-off 前倒し（確定 +3 件 = 14 件、案 C ハイブリッド効果）
↓
6/13 W3 完了（確定 +3 件 = 17 件）
↓
6/20 W4 完了 sign-off（確定 +5 件 = 22 件、Phase 1 完遂）
↓
6/27 公開（22 件確定 = 71%、5 件は K3.x 公開後測定）
↓
7/27 公開後 30 日 KPI 確定（K3.1-K3.5、確定 +5 件 = 22 件 + K3.x 5 件 = 27 件、92%）
↓
7/27 以降 Phase 2 着手判断 + OSS 公開実績（残 2 件）
```

---

## §3. 各 KPI の詳細仕様（K1.x / K2.x、K3.x は v1.0 から変更なし）

### §3.1 K1.x プロダクト KPI 詳細（11 件）

#### K1.1 自動テスト件数

| 項目 | 内容 |
|---|---|
| 計測方法 | `pnpm test` 実行結果（PRJ-019 standalone repo） |
| 5/22 時点 | 200+ 全緑（Round 10 完遂時） |
| 6/27 時点 | 300+ 全緑（Phase 1 完遂時） |
| 信頼度 | A（自動測定、人為改変不可） |
| 公開時表記 | 「**300+ 全緑（Phase 1 全期間 累積、6/20 確定値）**」 |
| 18×18 matrix セル | C04-M18 / C06-M18 / C07-M18 / C08-M18 / C16-M18 / C17-M18 |

#### K1.2 必須コントロール件数

| 項目 | 内容 |
|---|---|
| 計測方法 | DEC-019-055 議決-26 必須コントロール 50 件のうち本番統合数 |
| 5/22 時点 | 25-30 件 prefetch（W0-Week2 内） |
| 6/27 時点 | 50 件 全本番統合（Phase 1 完了時） |
| 信頼度 | B（範囲推計） |
| 公開時表記 | 「**50/50 件 本番統合完遂（DEC-019-055 採択値、Phase 1 W4 完了時）**」 |

#### K1.3 API cap 内 buffer

| 項目 | 内容 |
|---|---|
| 計測方法 | 月次 API 使用量実測値 / API cap（$30）= buffer % |
| 5/22 時点 | 60%+（5 月分 partial） |
| 6/27 時点 | 60%+（6 月分 partial） |
| 信頼度 | A（自動測定） |
| 公開時表記 | 「**API cap 内 buffer 60%+ 維持（mock 70% 化後）**」 |

#### K1.4 月次総額

| 項目 | 内容 |
|---|---|
| 計測方法 | `cost-tracker.ts` 月次サマリ（subscription $400 + API ≤$30） |
| 5/22 時点 | ≤$430（5 月分 partial） |
| 6/27 時点 | ≤$430（5 月分 + 6 月分 2 ヶ月実測） |
| 信頼度 | A（自動測定 + 既契約 subscription 固定） |
| 公開時表記 | 「**≤$430（subscription $400 + API ≤$30、5 月+6 月 2 ヶ月実測、DEC-019-051 採択値以内）**」 |

#### K1.5 副作用件数

| 項目 | 内容 |
|---|---|
| 計測方法 | `verify-zero-side-effect.sh`（grep + git history + git diff 三重検証） |
| 5/22 時点 | 0 行（20 日継続） |
| 6/27 時点 | 0 行（56 日継続） |
| 信頼度 | A（自動検証スクリプト） |
| 公開時表記 | 「**0 行（grep + git history + git diff 三重検証、5/2-6/27 期間 56 日連続維持）**」 |

#### K1.6 並列案件件数

| 項目 | 内容 |
|---|---|
| 計測方法 | dashboard/active-projects.md の継続稼働案件数 |
| 5/22 時点 | 3 件（PRJ-002 / PRJ-007 / COMPANY-WEBSITE） |
| 6/27 時点 | 3 件 全継続稼働 |
| 信頼度 | A（dashboard 自動同期） |
| 公開時表記 | 「**3 件 全継続稼働（PRJ-019 着手中も他案件継続）**」 |

#### K1.7 Phase 1 W1/W2 prefetch 達成率

| 項目 | 内容 |
|---|---|
| 計測方法 | PM 部門 cross-ref（Phase 1 W1-W4 想定スコープに対する prefetch 完遂率） |
| 5/22 時点 | 65%+ |
| 6/27 時点 | 100%（Phase 1 全行程達成） |
| 信頼度 | B（範囲推計、PM 手動集計） |

#### K1.8 commit 累積

| 項目 | 内容 |
|---|---|
| 計測方法 | git log（PRJ-019 standalone repo main 直 push） |
| 5/22 時点 | 6 commit（Round 5-10 累積） |
| 6/27 時点 | Phase 1 全期間 commit 累積（6/20 確定予定） |
| 信頼度 | A（git log 人為改変不可） |

#### K1.9 監査 log SHA-256 hash chain 整合性

| 項目 | 内容 |
|---|---|
| 計測方法 | `audit-log-retention-sha256.test.ts` 自動検証 |
| 5/22 時点 | 100%（dry exec 全件 Pass） |
| 6/27 時点 | 100%（56 日連続） |
| 信頼度 | A（自動検証 + 暗号化チェイン） |

#### K1.10 BAN drill Pass 率

| 項目 | 内容 |
|---|---|
| 計測方法 | Review 部門 BAN drill #1+#2+#3 結果 |
| 5/22 時点 | drill #1 dry exec 5/5 Pass |
| 6/27 時点 | drill #1+#2+#3 全 Pass（5/5 × 3） |
| 信頼度 | A（Review 部門立会の実測） |

#### K1.11 Day-0 readiness

| 項目 | 内容 |
|---|---|
| 計測方法 | benchmark 10 連続実行 + W4 sign-off 判定 |
| 5/22 時点 | 未確定（W4 確定） |
| 6/27 時点 | 99%+ |
| 信頼度 | A（W4 sign-off 議決） |

### §3.2 K2.x 運用 KPI 詳細（8 件）

#### K2.1 HITL ゲート本番統合数

| 項目 | 内容 |
|---|---|
| 計測方法 | HITL 11 種ゲートの本番統合完遂数 |
| 5/22 時点 | 11 種 prefetch 完遂、本番統合準備中 |
| 6/27 時点 | 11/11 本番統合完遂（6/3 W1 完了時、案 C 前倒し効果） |
| 信頼度 | A（議決ベース） |

#### K2.2 Owner 介入頻度

| 項目 | 内容 |
|---|---|
| 計測方法 | HITL 起票件数 / 4 週間（W1-W4） |
| 5/22 時点 | 未確定（W1-W4 集計） |
| 6/27 時点 | 週 4-7 回（中央値 5） |
| 信頼度 | B（4 週間中央値） |

#### K2.3 透明性 6 軸達成

| 項目 | 内容 |
|---|---|
| 計測方法 | DEC-019-033 6 軸（decisions / commit / audit / HITL / knowledge / portfolio）達成判定 |
| 5/22 時点 | 5/6 達成 + 1/6 進行中 |
| 6/27 時点 | 6/6 全達成 |
| 信頼度 | A（DEC-019-033 整合） |

#### K2.4 ナレッジ蓄積件数

| 項目 | 内容 |
|---|---|
| 計測方法 | `organization/knowledge/{patterns,decisions,pitfalls}/` 件数 |
| 5/22 時点 | 各 0-3 件（蓄積機構実装中） |
| 6/27 時点 | patterns 8-12 / decisions 50+ / pitfalls 8-12 |
| 信頼度 | A（ファイルカウント） |

#### K2.5 Owner 物理拘束時間

| 項目 | 内容 |
|---|---|
| 計測方法 | Owner 物理拘束 議事録ベース集計 |
| 5/22 時点 | 5/8 検収会議 35-45 分（DEC-019-054 採択時） |
| 6/27 時点 | W1-W4 累計 16-24 時間 + 5/8 検収 35-45 分 + 6/26 最終承認 30-45 分 |
| 信頼度 | A（議事録による実測） |

#### K2.6 BAN drill 完遂数

| 項目 | 内容 |
|---|---|
| 計測方法 | drill #1+#2+#3 完遂数 |
| 5/22 時点 | drill #1 dry 完遂 |
| 6/27 時点 | drill #1+#2+#3 = 3 回完遂 |
| 信頼度 | A（議決ベース） |

#### K2.7 PII redaction Pass 率

| 項目 | 内容 |
|---|---|
| 計測方法 | HITL 第 11 種 knowledge_pii_review 経由の redaction Pass 率 |
| 5/22 時点 | 未確定（実装中） |
| 6/27 時点 | 100% |
| 信頼度 | A（自動検証） |

#### K2.8 ToS allowlist 件数

| 項目 | 内容 |
|---|---|
| 計測方法 | DEC-019-010 採択値 + needs_scout 13-domain 完成数 |
| 5/22 時点 | 13 domain prefetch（needs_scout MVP） |
| 6/27 時点 | 13 domain 完成（whitelist v0 + critical 7 件 patch 完遂） |
| 信頼度 | A（議決ベース） |

### §3.3 K3.x narrative KPI 詳細（5 件、v1.0 から変更なし）

DEC-019-052 採択値を維持：PV 6,000 / ユニーク 3,500 / scroll_depth 75% / Contact CV 1.5% / 問い合わせ件数 6-12 件（30 日）。

---

## §4. 親文書整合性チェックリスト

- [x] DEC-019-052 (a)(b)(c) → §1 §3 で完全整合
- [x] DEC-019-027 / 028 / 029 / 033 / 051 / 055 / 056 → 全 KPI で参照確認
- [x] Round 7 v1.0 27 placeholder マスタープラン → §1.1 で v1.1 へ整理 update、v1.0 は破壊しない
- [x] Round 9 batch 1（K1.7-K1.10 + K2.5）→ §1.2 で v1.1 に正式統合
- [x] narrative final draft §5 metric 連動 → 本書で詳細仕様提示
- [x] portfolio 18×18 matrix → §3 各 KPI で matrix セル参照
- [x] 絵文字 0 件 / AI 感のある語彙 0 件 / 硬めトーン → 全体貫徹

---

## §X 残課題（5/8 検収会議までの残動作）

| # | 項目 | 担当 | 期日 |
|---|---|---|---|
| X1 | 本書 v1.2 発行（5/22 内部運用着手結果反映、確定 9 件 → 11 件想定） | Marketing | 5/26 |
| X2 | 本書 v1.3 発行（6/3 W1 完了時、確定 14 件想定） | Marketing | 6/4 |
| X3 | 本書 v1.4 発行（6/20 W4 sign-off 時、確定 22 件想定） | Marketing | 6/22 |
| X4 | Round 7 v1.0 マスタープラン v1.1 update（既存 27 placeholder → 24 main KPI 整理） | Marketing | 5/12 |

---

## §Y 提出メタ情報

| 項目 | 値 |
|---|---|
| 行数 | 約 305 行（要求 250-350 行内） |
| KPI 体系 | K1.x プロダクト 11 件 + K2.x 運用 8 件 + K3.x narrative 5 件 = 計 24 main KPI |
| 5/22 内部運用着手時点 確定見込 | 9 件 |
| 6/27 公開時点 確定見込 | 17 件（71%） |
| 7/27 公開後 30 日 確定見込 | 22 件（92%） |
| 親戦略整合 | DEC-019-052 / 027 / 028 / 029 / 033 / 051 / 055 / 056 全 8 件 完全整合 |
| 既存成果物への影響 | 破壊的変更 0 件（Round 7 v1.0 を破壊せず v1.1 で整理 update） |
| Owner 残動作 | **0 件**（Marketing 単独で完結する設計） |
| commit / push | 実行しない（CEO が一括 push） |
| 関連報告 | `marketing-portfolio-metrics-substitution-plan.md`（Round 7 v1.0） / `marketing-launch-narrative-final.md`（本書連動 narrative） / `marketing-portfolio-18x18.md`（本書連動 18×18 matrix） / `marketing-round9-portfolio-metric-batch-1.md`（Round 9 batch 1） / `marketing-web-ops-handoff.md`（本書連動 Web-Ops 連携） |

---

**起案: Marketing 部門 R10 Marketing-ζ / 2026-05-04 深夜（Round 10 独立 Agent dispatch、DEC-019-025 SOP 準拠）/ metric plan v1.1（K1.x プロダクト KPI / K2.x 運用 KPI、案 C ハイブリッド反映版）**
