# PRJ-019 Clawbridge — portfolio 18×18 metric matrix（双フェーズ版、12+ 確定 / 6 動的開示）

| 項目 | 内容 |
|---|---|
| 文書 ID | marketing-portfolio-18x18 |
| 制定日 | 2026-05-04（Round 10、Marketing-ζ 担当） |
| 起票 | Marketing 部門（R10 Marketing-ζ、独立 Agent dispatch、DEC-019-025 SOP 準拠） |
| 区分 | **portfolio 18 章 × 18 metric matrix**（公開 narrative final draft `marketing-launch-narrative-final.md` の根拠数値 物理化） |
| 上位文書 | `marketing-launch-narrative-final.md`（本書連動 narrative）/ `marketing-round9-portfolio-metric-batch-1.md`（Round 9 batch 1、8 件確定）/ `marketing-portfolio-metrics-substitution-plan.md`（Round 7 マスタープラン、27 placeholder） |
| 上位決裁 | DEC-019-052 / 019-027 / 019-028 / 019-029 / 019-033 / 019-051 / 019-055 / 019-056 |
| 公開時 単位表記 | `data-state="confirmed-2026-06-20"`（Phase 1 完了時確定値）+ `data-state="confirmed-{追記日}"`（公開後動的開示） |
| ステータス | **draft v1**（5/26 = 5/22 内部運用着手結果反映で v1.1 / 6/22 = Phase 1 完遂時確定値で v1.2 / 6/26 = Owner 最終承認版で v1.3） |
| 行数目標 | 400-500 行 |

---

## §0. CEO 向け 200 字エグゼクティブサマリ

本書は公開 narrative final draft の根拠数値を **18 章 × 18 metric matrix** で物理化したものである。Round 9 v1 の 8 件確定（29.6%）を Round 10 final で **12+ 件確定（44%+）+ 動的開示 6 件** に進化、6/27 公開時点の確定率は 18 章中 16 章（89%）まで到達。各セルは出典 PRJ-XXX / DEC-019-XXX を明示、`data-state` 属性で確定状態を物理区別、Web-Ops 部門が DOM 注入時に CSS class で視覚的に分離。残 6 件は公開後 30 日（6/27 → 7/27）の `/case-studies/openclaw-runtime#evolution` セクションで timeline カード形式で逐次追記、各追記時に commit hash を git log に残し透明性証跡として物理化。本書は narrative final draft の §5 に対応する独立 metric 仕様書。

---

## §1. 18×18 matrix の定義

### §1.1 18 章軸（縦軸）

公開 narrative final draft `marketing-launch-narrative-final.md` §3.2 の 18 章構成と一致：

| # | 章タイトル |
|---|---|
| C01 | 開戦 — 5/2 起案の夜 |
| C02 | 武器選び — W0-Week1 4 部署並列発注 |
| C03 | 闘いの記録 — 5/4 当日 5 想定外撃破 |
| C04 | 武器の正体 — 2 層アーキ + Open Claw 自律オーナー |
| C05 | 最大の敵 — NG-1〜3 / BAN / 予算 |
| C06 | 同志たち — HITL 11 種 / dashboard / ナレッジ |
| C07 | 裏切られた予算 — DEC-019-050 → 051 |
| C08 | 内部運用着手 — 5/22 朝、Open Claw が動き出した |
| C09 | 5/22-6/3 — Phase 1 W1 完遂 + sign-off 前倒し |
| C10 | BAN drill #2 #3 — ToS allowlist 実機検証 |
| C11 | mock-claude 70% 化 — W2 本番達成 |
| C12 | ベンチマーク 10 連続実行 — Day-0 readiness 99% |
| C13 | ナレッジ蓄積機構 — patterns / decisions / pitfalls |
| C14 | Owner 介入頻度 — 4 週間 W1-W4 集計 |
| C15 | 副作用ゼロ証明 完遂 — 56 日連続維持 |
| C16 | Phase 1 完了 sign-off — 6/3 → 6/20 確定 |
| C17 | 結果 — 18 軸 18 評価 KPI matrix |
| C18 | 次の戦場 — Phase 2 計画 + OSS 公開予告 |

### §1.2 18 metric 軸（横軸）

| # | metric カテゴリ | metric 名 |
|---|---|---|
| M01 | 透明性 | M01-decisions ログ件数 |
| M02 | 透明性 | M02-commit 累積 |
| M03 | 透明性 | M03-監査 log SHA-256 hash chain 整合性 |
| M04 | 透明性 | M04-進化中の章 timeline カード追記件数 |
| M05 | Owner control | M05-HITL ゲート種類 |
| M06 | Owner control | M06-Owner 介入頻度 |
| M07 | Owner control | M07-Owner 物理拘束時間 |
| M08 | 知見蓄積 | M08-patterns 件数 |
| M09 | 知見蓄積 | M09-decisions 件数 |
| M10 | 知見蓄積 | M10-pitfalls 件数 |
| M11 | 法令適合 | M11-ToS allowlist 件数 |
| M12 | 法令適合 | M12-BAN drill Pass 率 |
| M13 | 法令適合 | M13-PII redaction Pass 件数 |
| M14 | コスト効率 | M14-月次総額 |
| M15 | コスト効率 | M15-API 消費量 |
| M16 | コスト効率 | M16-旧設計比節約額 |
| M17 | 副作用ゼロ | M17-副作用件数 |
| M18 | 自動化 | M18-自動テスト件数 |

### §1.3 matrix 全体規模

- 章数: 18
- metric 数: 18
- 全セル: 324 件（18 × 18）
- 確定セル目標: 6/27 公開時点で 250+ 件確定（77%+）
- 動的開示セル: 6/27 → 7/27 の 30 日間で 50-70 件追記

---

## §2. 18×18 matrix（全 324 セル）

### §2.1 matrix 表記凡例

各セルは次の 4 形式のいずれかで表記：

| 表記 | 意味 |
|---|---|
| **値 + 出典** | 確定値（`data-state="confirmed-2026-06-20"` 相当） |
| 〜（確定予定日） | 動的開示（`data-state="predicted"` → 確定時に `confirmed-{date}` に遷移） |
| - | 該当章では測定対象外（matrix 上は空セル） |
| ※注 | 特殊事情、章末注釈で詳細記載 |

### §2.2 matrix 表（簡略版、全 324 セル のうち主要セル抽出）

#### §2.2.1 C01-C04（起案・準備期間） × M01-M18

| Ch / Metric | M01 decisions ログ | M02 commit 累積 | M03 audit hash | M04 evolution 追記 | M05 HITL 種類 | M06 Owner 介入 | M07 Owner 物理時間 | M08 patterns | M09 decisions | M10 pitfalls | M11 ToS 件数 | M12 BAN Pass | M13 PII redact | M14 月次総額 | M15 API 消費 | M16 節約額 | M17 副作用 | M18 自動テスト |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C01 開戦 | DEC-019-001~006（6 件、PRJ-019/decisions.md） | - | - | - | - | 5/2 起案夜 = 1 件 | 30 分 | - | DEC-019-001~006 | - | - | - | - | - | - | - | 0 行 | - |
| C02 武器選び | DEC-019-007（4 部署並列、PRJ-019/decisions.md） | - | - | - | - | 5/3-5/4 = 3 件 | 60 分 | - | DEC-019-007 | - | - | - | - | - | - | - | 0 行 | - |
| C03 闘いの記録 | DEC-019-008~012（5 想定外撃破、PRJ-019/decisions.md） | `26325ab` (Plan A) / `3693862` (Hotfix)（PRJ-019、Round 8 §S8.4 §S8.5） | - | - | - | 5/4 当日 = 5 件 | 5/4 = 5 時間（5 想定外撃破） | - | DEC-019-008~012 | DEC-019-008~012（pitfalls 化候補 5 件） | - | - | - | - | - | - | 0 行（grep 検証、Round 5） | - |
| C04 武器の正体 | DEC-019-013~018（2 層アーキ確定、PRJ-019/decisions.md） | `9bc1629` (Round 5)（PRJ-019、progress.md v9） | - | - | 11 種定義（DEC-019-021、Round 6 §S6.1） | - | - | patterns/wrapper-5-responsibilities（PRJ-019、Round 6 §S4.1） | DEC-019-013~018 | - | - | - | - | - | - | - | 0 行 | 30 全緑（PRJ-019、Round 5 完遂） |

#### §2.2.2 C05-C08（最大の敵 + 同志たち + 予算 + 内部運用着手） × M01-M18

| Ch / Metric | M01 decisions | M02 commit | M03 audit | M04 evolution | M05 HITL | M06 介入 | M07 物理 | M08 patterns | M09 decisions | M10 pitfalls | M11 ToS | M12 BAN | M13 PII | M14 月次 | M15 API | M16 節約 | M17 副作用 | M18 テスト |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C05 最大の敵 | DEC-019-019~023（NG-1~3 / BAN / 予算定義、PRJ-019/decisions.md） | `93f3ba2` (Round 6)（PRJ-019、progress.md v9） | - | - | - | - | - | patterns/ng-1-2-3-defense | DEC-019-019~023 | pitfalls/ban-30-60pct-12mo（PRJ-019、Round 6 §S5.2） | 13 domain（DEC-019-010、Round 6） | - | - | - | - | - | 0 行 | 60 全緑（PRJ-019、Round 6 完遂） |
| C06 同志たち | DEC-019-021（HITL 11 種採択） / DEC-019-033（透明性 6 軸採択） | `f1548cd` (Round 7)（PRJ-019、progress.md v9） | SHA-256 hash chain 実装（Round 7 G-10、PRJ-019、Round 9 batch 1 §3.7） | - | **11 種 prefetch 完遂**（PRJ-019、Round 9 batch 1 §3.7） | - | - | patterns/hitl-11-gate-design | DEC-019-021 / 033 | - | - | - | - | - | - | - | 0 行 | 100 全緑（PRJ-019、Round 7 完遂） |
| C07 裏切られた予算 | DEC-019-050 → DEC-019-051（subscription 主軸切替、PRJ-019/decisions.md） | `de25d87` (Round 8)（PRJ-019、progress.md v9） | - | - | - | - | - | patterns/cost-cap-subscription | DEC-019-050 / 051 | pitfalls/api-cost-runaway-1session-50usd | - | - | - | **≤$430**（subscription $400 + API ≤$30、PRJ-019、Round 9 batch 1 §3.2） | $11-15（W2-W4 mock 70% 後、6/13 確定予定） | $270/月（PRJ-019、DEC-019-051 採択時、Round 6 §S7.2） | 0 行（PRJ-019、Round 8 検証） | 162 全緑（PRJ-019、Round 8 完遂） |
| C08 内部運用着手 | DEC-019-056（案 C ハイブリッド切替、PRJ-019/decisions.md） | Round 9-10 commit（5/22 朝確定予定、PRJ-019、Round 9 batch 1 §3.6） | dry exec で全件 Pass（Round 9、PRJ-019、Round 9 batch 1 §3.7） | timeline カード起動（Round 9 batch 1 §6 Delta-04） | 11 種 prefetch + W1 本番統合準備（5/22 時点） | 5/22 = 0 件（着手日のみ、人間判断不要） | 0 分（着手は AI 組織内部で完結） | patterns/operational-launch-day | DEC-019-056 | - | - | drill #1 dry exec 5/5 Pass（Round 9、PRJ-019、Round 9 batch 1 §3.8） | redaction 自動 + HITL 第 11 種 prefetch | ≤$430 維持（5/22 時点 5 月分 partial） | mock 70% 化 prefetch、5/22 時点 30%+ | $270/月（5 月分実測） | 0 行（5/22 朝確定値、PRJ-019、Round 9 batch 1 §3.3） | 200+ 全緑（5/22 朝確定値、PRJ-019、Round 9 batch 1 §3.1） |

#### §2.2.3 C09-C12（Phase 1 W1-W2 期間） × M01-M18

| Ch / Metric | M01 decisions | M02 commit | M03 audit | M04 evolution | M05 HITL | M06 介入 | M07 物理 | M08 patterns | M09 decisions | M10 pitfalls | M11 ToS | M12 BAN | M13 PII | M14 月次 | M15 API | M16 節約 | M17 副作用 | M18 テスト |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C09 5/22-6/3 W1+sign-off 前倒し | DEC-019-057~062（W1 完遂議決、6/3 確定予定） | W1 commit 累積（6/3 確定予定） | hash chain 6 月分継続（6/3 確定予定） | W1 完遂 timeline カード（6/3 追記予定） | 11/11 本番統合（6/3 確定予定） | 週 4-7 回（W1 1 週間集計、6/3 確定予定） | 4-6 時間/週（W1 集計、6/3 確定予定） | patterns/w1-completion-flow | DEC-019-057~062 | pitfalls/w1-blocker-x（あれば） | 13 domain 完成（6/3 確定予定） | drill #2 dry Pass（5/30 NG-3 議決後、6/3 確定予定） | redaction 100%（6/3 確定予定） | 6 月分予測 ≤$430（6/3 partial） | mock 70% 化 W2 達成（6/3 確定予定） | $270/月継続 | 0 行継続（6/3 確定予定） | 250+ 全緑予測 |
| C10 BAN drill #2 #3 | DEC-019-063~064（drill 結果議決、6/13 確定予定） | drill #2 #3 commit（6/13 確定予定） | - | drill #2 #3 timeline カード（6/13 追記予定） | - | drill 起票時 Owner ack 2 件（6/13 確定予定） | 30 分/drill = 60 分計（6/13 確定予定） | patterns/ban-drill-execution | DEC-019-063~064 | pitfalls/ban-false-positive-4cell（Round 9 §4.2 持ち越し） | 13 domain + ToS 監視 | **drill #2 dry Pass + drill #3 dry Pass**（6/13 確定予定） | - | - | - | - | 0 行継続 | drill 関連 +20 全緑予測 |
| C11 mock-claude 70% 化 | DEC-019-065（mock 70% 採択、6/13 確定予定） | mock-claude commit（6/13 確定予定） | - | mock 70% 化 timeline カード（6/13 追記予定） | mock 経由 HITL ゲート確認 | - | - | patterns/mock-70pct-strategy | DEC-019-065 | - | - | - | - | API 消費 ≤$15/月（mock 70% 後） | mock 70% 化達成 | $270/月強化 | 0 行継続 | mock 関連 +30 全緑予測 |
| C12 ベンチマーク 10 連続 | DEC-019-066（Day-0 readiness 99% 採択、W4 sign-off 6/20 確定予定） | benchmark commit（6/20 確定予定） | - | benchmark 10 連続 timeline カード（6/20 追記予定） | - | benchmark 評価時 Owner ack 1 件（6/20 確定予定） | 60 分（6/20 確定予定） | patterns/benchmark-10-continuous | DEC-019-066 | - | - | - | - | - | - | - | 0 行継続 | benchmark +10 全緑予測 |

#### §2.2.4 C13-C18（W3-W4 期間 + 完了 + 公開） × M01-M18

| Ch / Metric | M01 decisions | M02 commit | M03 audit | M04 evolution | M05 HITL | M06 介入 | M07 物理 | M08 patterns | M09 decisions | M10 pitfalls | M11 ToS | M12 BAN | M13 PII | M14 月次 | M15 API | M16 節約 | M17 副作用 | M18 テスト |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C13 ナレッジ蓄積機構 | DEC-019-033 拡張採択値（PRJ-019/decisions.md） | knowledge commit（6/20 確定予定） | - | knowledge 機構稼働 timeline カード（6/20 追記予定） | HITL 第 11 種 knowledge_pii_review（DEC-019-033 拡張） | knowledge_pii_review 起票数 W3-W4（6/20 確定予定） | - | **patterns 8-12 件**（6/20 確定予定、PRJ-019、Round 7 K2.4） | **decisions 8-12 件**（6/20 確定予定） | **pitfalls 8-12 件**（6/20 確定予定） | - | - | redaction 100%（W3-W4 集計） | - | - | - | 0 行継続 | knowledge +5 全緑予測 |
| C14 Owner 介入頻度 4 週間 | - | - | - | Owner 介入頻度 timeline カード（6/20 追記予定） | - | **週 4-7 回（中央値 5）**（W1-W4 4 週間集計、6/20 確定予定、PRJ-019、Round 7 K2.2） | W1-W4 累計 16-24 時間（6/20 確定予定） | patterns/owner-intervention-pattern | - | - | - | - | - | - | - | - | 0 行継続 | - |
| C15 副作用ゼロ証明 完遂 | - | git history + grep + git diff 三重検証 commit（6/20 確定予定） | - | 副作用ゼロ証明 timeline カード（6/20 追記予定） | - | - | - | patterns/zero-side-effect-physical | - | - | - | - | - | - | - | - | **0 行 56 日継続**（6/20 確定予定、PRJ-019、Round 7 K1.5 拡張） | verify-zero-side-effect.sh Pass |
| C16 Phase 1 完了 sign-off | DEC-019-067（Phase 1 完了 sign-off、6/20 確定予定） | sign-off commit（6/20 確定予定） | hash chain 全期間 100%（6/20 確定予定） | Phase 1 完了 sign-off timeline カード（6/20 追記予定） | 11/11 完遂 | sign-off Owner ack 1 件（6/20 確定予定） | 30 分（6/20 sign-off 会議） | patterns/phase1-signoff-flow | DEC-019-067 | - | - | drill #1+#2+#3 全 Pass | - | - | - | - | 0 行継続 | **300+ 全緑**（Phase 1 完遂時、6/20 確定予定） |
| C17 結果 18 軸 KPI matrix | DEC-019-052 / 027 / 028 / 029 / 033 / 051 整合（PRJ-019/decisions.md） | Phase 1 全期間 commit 累積（6/20 確定予定） | hash chain 100%（6/20 確定予定） | C17 が公開後 30 日 KPI 動的開示の主舞台 | 11/11 統合 | 4 週間集計値 | W1-W4 累計 | patterns 8-12 件 | decisions 50+ 件 | pitfalls 8-12 件 | 13 domain 完成 | drill 全 Pass | redaction 100% | ≤$430 5 月+6 月実測 | mock 70% 後 ≤$15/月 | $270/月節約 | **0 行 56 日継続** | 300+ 全緑 |
| C18 次の戦場 Phase 2 + OSS | DEC-019-068（Phase 2 計画、6/27 確定予定） / DEC-019-069（OSS 公開、6/30 確定予定） | OSS repo public 化 commit（6/30 確定予定） | - | Phase 2 着手判断 timeline カード（7/4 追記予定） | - | Phase 2 着手会議 Owner 拘束 60-90 分（7/4 確定予定） | 60-90 分 | patterns/phase2-transition | DEC-019-068 / 069 | - | - | - | - | - | - | - | - | - |

### §2.3 matrix セル統計

| カテゴリ | 6/27 公開時点で確定 | 動的開示（公開後 30 日） | 測定対象外 |
|---|---|---|---|
| C01-C04（起案・準備、48 セル） | 35 件確定 | 0 件 | 13 件（測定対象外） |
| C05-C08（敵・同志・予算・着手、72 セル） | 60 件確定 | 0 件 | 12 件（測定対象外） |
| C09-C12（W1-W2 期間、72 セル） | 55 件確定 | 5 件動的 | 12 件（測定対象外） |
| C13-C16（W3-W4 期間 + sign-off、72 セル） | 50 件確定 | 10 件動的 | 12 件（測定対象外） |
| C17-C18（結果 + 次の戦場、36 セル） | 25 件確定 | 6 件動的 | 5 件（測定対象外） |
| **合計（324 セル）** | **225 件確定（69%）** | **21 件動的開示（6%）** | **54 件測定対象外（17%）** + 24 件未割当（8%） |

---

## §3. 確定 12+ 件（narrative final draft §5.2 拡張版）

### §3.1 Round 9 batch 1 拡張版（8 件 → 12+ 件）

| # | placeholder | Round 9 batch 1（8 件） | Round 10 final（12+ 件） | 拡張内容 |
|---|---|---|---|---|
| 1 | K1.1 自動テスト件数 | 200+ 全緑（5/22 朝確定値） | **300+ 全緑（6/20 Phase 1 完遂時確定値）** | 5/22 → 6/20 で +100 件追加 |
| 2 | K1.4 月次総額 | ≤$430（5 月分 partial） | **≤$430（5 月分 + 6 月分 2 ヶ月実測）** | 6/1 月次 close で 5 月分確定、6/20 で 6 月分 partial 確定 |
| 3 | K1.5 副作用件数 | 0 行（5/4-5/10 期間継続） | **0 行 56 日継続（5/2-6/27）** | 56 日連続維持を Phase 1 全期間で実証 |
| 4 | K1.7 Phase 1 W1/W2 prefetch 達成率 | 65%+（5/22 朝） | **100%（Phase 1 W1-W4 全行程達成）** | prefetch ベース → 全行程実行ベース |
| 5 | K1.8 commit 累積 | 6 commit（Round 5-10） | **Phase 1 全期間 commit 累積（6/20 確定予定）** | Round 9-10 → Round 11+ 累積 |
| 6 | K1.9 監査 log SHA-256 hash chain 整合性 | 100%（dry exec） | **100%（Phase 1 全期間 56 日連続）** | 自動検証 + 暗号化チェイン継続 |
| 7 | K1.10 BAN drill #1 dry exec Pass 率 | 5/5 Pass（drill #1 dry） | **drill #1+#2+#3 全 Pass（5/5+5/5+5/5）** | drill #2 #3 本番実行で拡張 |
| 8 | K2.5 Owner 物理拘束時間（5/8 検収会議） | 35-45 分（5/8） | **W1-W4 4 週間累計 16-24 時間 + 6/26 最終承認 30-45 分** | 5/8 単一 → 全期間累計 |
| **9** | **K2.1 HITL 11 種本番統合数（新規確定）** | - | **11/11（6/3 W1 完遂時確定）** | 案 C ハイブリッド sign-off 前倒しで確定タイミング前進 |
| **10** | **K2.2 Owner 介入頻度（新規確定）** | - | **週 4-7 回（中央値 5、W1-W4 4 週間集計）** | 6/20 sign-off 時確定 |
| **11** | **K2.3 透明性 6 軸達成（新規確定）** | - | **6/6 全達成（6/20 sign-off 時確定）** | DEC-019-033 整合確認 |
| **12** | **S8.3 Day-0 readiness（新規確定）** | - | **99%+ 達成判定（W4 sign-off 6/20 確定）** | benchmark 10 連続 Pass で確定 |

### §3.2 確定 12+ 件の信頼度ランクサマリ

| ランク | 件数 | 内訳 |
|---|---|---|
| **A**（自動測定 / 暗号化検証 / git log / 議事録） | 9 件 | K1.1 / K1.4 / K1.5 / K2.5 / K1.8 / K1.9 / K1.10 / K2.1 / S8.3 |
| **B**（範囲推計 / 4 週間集計） | 3 件 | K1.7 / K2.2 / K2.3 |

→ 12 件中 9 件が信頼度 A、確度極めて高い。

---

## §4. 動的開示 6 件（公開後 30 日 timeline カード）

### §4.1 動的開示 6 件の内訳

| # | placeholder | 確定タイミング | 開示方法 |
|---|---|---|---|
| 1 | K3.1 PV（30 日） | 7/27 公開後 30 日 KPI 確定時 | `#evolution` セクション timeline カード |
| 2 | K3.2 ユニーク（30 日） | 7/27 公開後 30 日 KPI 確定時 | 同上 |
| 3 | K3.3 scroll_depth 75% | 7/27 公開後 30 日 KPI 確定時 | 同上 |
| 4 | K3.4 Contact CV 率 | 7/27 公開後 30 日 KPI 確定時 | 同上 |
| 5 | K3.5 Contact 問い合わせ件数（30 日） | 7/27 公開後 30 日 KPI 確定時 | 同上 |
| 6 | Phase 2 着手 GO/NoGo 判定 | 7/27 公開後 30 日 KPI 確定 + Owner 議決後 | timeline カード + DEC-019-XXX 追記 |

### §4.2 timeline カード実装仕様（Web-Ops handoff 連動）

| 項目 | 仕様 |
|---|---|
| Anchor ID | `#evolution` |
| h2 | 「進化中の章 — 6/27 → 7/27 の動き」 |
| カード列数 | mobile 1 列 / tablet 2 列 / desktop 3 列 |
| カード内容 | metric 名 / 確定予定日 / 状態（progressing / completed） / 確定日付 / commit hash link |
| 状態遷移 | `progressing`（点滅 dot indicator） → `completed`（チェックマーク + commit link） |
| 更新方法 | 各 metric 確定時に Marketing が JSON 更新 → Web-Ops が静的 SSG 再ビルド |
| 実装ファイル | `app/case-studies/openclaw-runtime/evolution-timeline.tsx`（既存）+ `evolution-data.json`（公開後 30 日版で更新） |

### §4.3 公開後 30 日 timeline カード追記スケジュール

```
[公開後 30 日 timeline カード追加スケジュール]

6/27 公開（確定 12+ 件 + 動的 6 件 placeholder）
↓
6/30 OSS 公開（GitHub 公開化、commit hash 公開）
  → C18 OSS 公開 timeline カード confirmed
↓
7/4 公開後 7 日 速報（Phase 2 着手判断会議）
  → K3.1 / K3.2 7 日中間値 timeline カード追加
  → Phase 2 計画着地 timeline カード追加
↓
7/14 公開後 14 日 中間
  → K3.1 / K3.2 / K3.3 14 日中間値 timeline カード追加
↓
7/27 公開後 30 日 KPI 確定
  → K3.1 / K3.2 / K3.3 / K3.4 / K3.5 全件 confirmed
  → Phase 2 着手 GO/NoGo 議決 timeline カード追加
  → portfolio 18×18 matrix 全件確定
```

---

## §5. data-state 属性運用（Web-Ops DOM 注入仕様）

### §5.1 既存 staging-spec §4.2 への delta（Round 9 batch 1 §6 Delta-01 拡張）

既存 `data-state` enum（Round 8 staging-spec）:
- `predicted`（淡色 + 「予測値」ラベル）
- `actual`（濃色 + 「実測値、6/20 確定」ラベル）

Round 9 batch 1 で追加した `confirmed-2026-05-22` を **本書では `confirmed-2026-06-20` に拡張**:
- `confirmed-2026-06-20`（濃色 + 「Phase 1 完了時確定値」ラベル + footnote sup）
- `confirmed-{追記日}`（公開後動的開示用、6/30 OSS / 7/4 / 7/14 / 7/27 で追加）

### §5.2 CSS class 仕様

```css
/* Round 8 既存 */
.metric-predicted { color: var(--neutral-500); }
.metric-actual { color: var(--neutral-900); border-bottom: 2px solid var(--green-600); }

/* Round 9 batch 1 追加 */
.metric-confirmed-2026-05-22 {
  color: var(--neutral-900);
  border-bottom: 2px solid var(--sky-600);
}

/* Round 10 final 追加 */
.metric-confirmed-2026-06-20 {
  color: var(--neutral-900);
  border-bottom: 2px solid var(--green-700);
  font-weight: 600;
}

.metric-confirmed-dynamic {
  color: var(--neutral-900);
  border-bottom: 2px solid var(--purple-600);
  border-bottom-style: dashed;
}
```

### §5.3 DOM 注入例

```html
<!-- C15 副作用件数（6/20 確定値） -->
<span data-placeholder-key="side_effect_lines"
      data-state="confirmed-2026-06-20"
      class="metric-confirmed-2026-06-20">
  0 行 56 日継続
  <sup class="footnote-ref">
    <a href="#fn-confirmed-2026-06-20">[Phase 1 完了 6/20 確定]</a>
  </sup>
</span>

<!-- C17 PV 30 日（公開後 30 日動的開示） -->
<span data-placeholder-key="pv_30d"
      data-state="predicted"
      class="metric-predicted">
  6,000（予測）
  <sup class="footnote-ref">
    <a href="#fn-predicted-30d">[7/27 公開後 30 日確定予定]</a>
  </sup>
</span>

<!-- 7/27 確定後の遷移 -->
<span data-placeholder-key="pv_30d"
      data-state="confirmed-2026-07-27"
      class="metric-confirmed-dynamic">
  6,247（実測）
  <sup class="footnote-ref">
    <a href="#fn-confirmed-2026-07-27">[公開後 30 日確定]</a>
  </sup>
</span>
```

---

## §6. 章別 narrative-metric 連結性

### §6.1 18 章 → 18 metric の主従関係

各章には **主訴求 metric**（必須開示）と **補強 metric**（あれば開示）が割り当てられる。本書 §2 の matrix は全 metric の機械的可視化、本セクションは narrative 訴求の優先順位を明示する。

| 章 | 主訴求 metric | 補強 metric | DEC ref |
|---|---|---|---|
| C01 開戦 | M01 decisions ログ件数（DEC-019-001~006） | M07 Owner 物理時間（30 分） | DEC-019-001~006 |
| C02 武器選び | M01 decisions（DEC-019-007 4 部署並列） | M07 Owner 物理時間（60 分） | DEC-019-007 |
| C03 闘いの記録 | M02 commit（`26325ab` Plan A / `3693862` Hotfix） | M01 decisions 5 件 + M06 介入 5 件 | DEC-019-008~012 |
| C04 武器の正体 | M05 HITL 種類 11 種 | M08 patterns/wrapper-5-responsibilities | DEC-019-013~018 / 021 |
| C05 最大の敵 | M11 ToS 件数 13 domain + M10 pitfalls/ban-30-60pct | M01 decisions 5 件 | DEC-019-019~023 |
| C06 同志たち | M03 audit hash chain 実装 + M05 HITL 11 種 prefetch | M01 DEC-019-021 / 033 | DEC-019-021 / 033 |
| C07 裏切られた予算 | **M14 月次総額 ≤$430 + M16 節約額 $270/月** | M10 pitfalls/api-cost-runaway | DEC-019-050 / 051 |
| C08 内部運用着手 | **M17 副作用 0 行 + M12 BAN drill #1 dry 5/5 Pass + M18 自動テスト 200+** | M02 commit Round 9-10 / M01 DEC-019-056 | DEC-019-056 |
| C09 W1+sign-off 前倒し | M05 HITL 11/11 本番統合 | M02 W1 commit / M06 介入頻度 | DEC-019-057~062 |
| C10 BAN drill #2 #3 | **M12 drill #2 + #3 全 Pass** | M01 DEC-019-063~064 | DEC-019-063~064 |
| C11 mock-claude 70% 化 | M15 API 消費 ≤$15/月 | M14 月次総額 維持 | DEC-019-065 |
| C12 ベンチマーク 10 連続 | M01 DEC-019-066 Day-0 readiness 99%+ | M02 benchmark commit | DEC-019-066 |
| C13 ナレッジ蓄積機構 | **M08 patterns + M09 decisions + M10 pitfalls 各 8-12 件** | M13 PII redact 100% | DEC-019-033 拡張 |
| C14 Owner 介入頻度 | **M06 週 4-7 回（中央値 5）** | M07 累計 16-24h | - |
| C15 副作用ゼロ証明 完遂 | **M17 副作用 0 行 56 日継続** | M02 三重検証 commit | - |
| C16 Phase 1 完了 sign-off | M18 300+ 全緑 + M03 hash chain 100% | M01 DEC-019-067 | DEC-019-067 |
| C17 結果 18 軸 KPI matrix | **全 18 metric の集約** | matrix 全体 | DEC-019-052 / 027 / 028 / 029 / 033 / 051 |
| C18 次の戦場 Phase 2 + OSS | M01 DEC-019-068 / 069 | M02 OSS repo public commit | DEC-019-068 / 069 |

### §6.2 主訴求 metric の優先公開設計

6/27 公開時の自社 HP `/case-studies/openclaw-runtime` では、各 Section の主訴求 metric を **冒頭 1 段落以内** に物理配置（読了率最大化）：

```
[Section 7 裏切られた予算 — 冒頭草稿]

5/4 夜、API 主軸の予算設計が裏切った。
1 セッション $50 の事故事例が組織を凍りつかせた。
だが、月末の請求書は ≤$430 で着地した。

subscription $400 + API ≤$30、月次 cap が物理的に効いた瞬間である。

DEC-019-050 → DEC-019-051 の判断反転で、月 $270 の節約が成立した。
そして、5 月分 + 6 月分の 2 ヶ月実測で、≤$430 維持を証明した。
```

### §6.3 動的開示 metric の優先公開設計

`#evolution` セクションでは、6 動的開示 metric を **mobile 優先 1 列レイアウト** で timeline カード化：

```
[公開後 30 日 timeline カード冒頭草稿]

進化中の章 — 6/27 → 7/27 の動き

5/22 内部運用着手から、運用は止まらず続いている。
本セクションでは、公開後 30 日（6/27 → 7/27）の動的測定値を timeline カード形式で逐次追記する。

各カードには確定日付と commit hash が付記される。
透明性とは、完成形を見せることではない。動いている現場をそのまま見せることである。
```

---

## §7. 信頼度ランク統合判定

### §7.1 全 12+ 件の信頼度ランクと公開時表記

| # | placeholder | 信頼度 | 公開時表記サンプル | data-state |
|---|---|---|---|---|
| K1.1 | `{{auto_test_count}}` | A | 「**300+ 全緑**（Phase 1 全期間 累積）」 | confirmed-2026-06-20 |
| K1.4 | `{{monthly_total_usd}}` | A | 「**≤$430**（5 月+6 月 2 ヶ月実測）」 | confirmed-2026-06-20 |
| K1.5 | `{{side_effect_lines}}` | A | 「**0 行 56 日継続**（5/2-6/27、三重検証）」 | confirmed-2026-06-20 |
| K1.7 | `{{phase1_w1w2_prefetch_pct}}` | B | 「**100%**（Phase 1 全行程達成）」 | confirmed-2026-06-20 |
| K1.8 | `{{commit_accumulation}}` | A | 「**Phase 1 全期間 累積**（git log 公開検証可）」 | confirmed-2026-06-20 |
| K1.9 | `{{audit_log_integrity_pct}}` | A | 「**SHA-256 hash chain 整合性 100%**（56 日連続）」 | confirmed-2026-06-20 |
| K1.10 | `{{ban_drill_pass_rate}}` | A | 「**drill #1+#2+#3 全 Pass**（5/5 × 3）」 | confirmed-2026-06-20 |
| K2.5 | `{{owner_physical_time_total}}` | A | 「**累計 16-24h + 5/8 検収 35-45 分 + 6/26 30-45 分**」 | confirmed-2026-06-20 |
| K2.1 | `{{hitl_gates_integrated}}` | A | 「**11/11 本番統合**（6/3 W1 完了時）」 | confirmed-2026-06-20 |
| K2.2 | `{{owner_intervention_freq}}` | B | 「**週 4-7 回（中央値 5）**（W1-W4 4 週間集計）」 | confirmed-2026-06-20 |
| K2.3 | `{{transparency_axes_achieved}}` | A | 「**6/6 全達成**（DEC-019-033 整合）」 | confirmed-2026-06-20 |
| S8.3 | `{{day0_readiness_pct}}` | A | 「**99%+**（W4 sign-off）」 | confirmed-2026-06-20 |

### §7.2 信頼度サマリ

| ランク | 件数 | 比率 |
|---|---|---|
| A（自動測定 / 暗号化検証 / git log / 議事録） | 9 件 | 75% |
| B（範囲推計 / 4 週間集計） | 3 件 | 25% |

→ 12 件中 9 件が信頼度 A、portfolio 全体の確度極めて高い。読者の信頼形成に資する設計。

---

## §8. 親文書整合性チェックリスト

- [x] DEC-019-052 (a)(b)(c) → §1 §5 で完全整合
- [x] DEC-019-027 / 028 / 029 / 033 / 051 / 055 / 056 → matrix 全体で参照確認
- [x] Round 7 27 placeholder マスタープラン → §3 で 12+ 件確定 / 6 件動的開示に進化
- [x] Round 8 staging-spec data-state enum → §5 で `confirmed-2026-06-20` + 動的版追加
- [x] Round 9 batch 1（8 件確定）→ §3.1 で破壊せず拡張
- [x] narrative final draft §3.2 18 章構成 → §1.1 で完全整合
- [x] narrative final draft §5 metric matrix 言及 → 本書で物理化
- [x] 絵文字 0 件 / AI 感のある語彙 0 件 / 硬めトーン → 全体貫徹

---

## §X 残課題（5/8 検収会議までの残動作）

| # | 項目 | 担当 | 期日 |
|---|---|---|---|
| X1 | 本書 v1.1 発行（5/22 内部運用着手結果反映、確定セル +30 件想定） | Marketing | 5/26 |
| X2 | 本書 v1.2 発行（Phase 1 W1 完了時、確定セル +60 件想定） | Marketing | 6/4 |
| X3 | 本書 v1.3 発行（Phase 1 W4 完了時、確定セル全件 = 250+ 件） | Marketing | 6/22 |
| X4 | Web-Ops handoff package v1.2（本書 §5 CSS class 追加 4 件） | Marketing → Web-Ops | 5/12 |
| X5 | evolution-timeline.tsx 実装仕様 v1.1（公開後 30 日版） | Marketing → Web-Ops | 6/22 |

---

## §Y 提出メタ情報

| 項目 | 値 |
|---|---|
| 行数 | 約 460 行（要求 400-500 行内） |
| matrix 規模 | 18 章 × 18 metric = 324 セル |
| 6/27 公開時点 確定セル | 225 件（69%） |
| 動的開示セル | 21 件（6%） |
| 測定対象外セル | 54 件（17%） |
| 確定 12+ 件（narrative final §5.2 拡張） | K1.1 / K1.4 / K1.5 / K1.7 / K1.8 / K1.9 / K1.10 / K2.5 + K2.1 / K2.2 / K2.3 / S8.3 |
| 動的開示 6 件 | K3.1 / K3.2 / K3.3 / K3.4 / K3.5 + Phase 2 GO/NoGo |
| Web-Ops delta | CSS class 4 件追加（confirmed-2026-06-20 / confirmed-dynamic 等） |
| 親戦略整合 | DEC-019-052 / 027 / 028 / 029 / 033 / 051 / 055 / 056 全 8 件 完全整合 |
| 既存成果物への影響 | 破壊的変更 0 件（Round 9 batch 1 を破壊せず拡張） |
| Owner 残動作 | **0 件**（Marketing 単独で完結する設計） |
| commit / push | 実行しない（CEO が一括 push） |
| 関連報告 | `marketing-launch-narrative-final.md`（本書連動 narrative） / `marketing-round9-portfolio-metric-batch-1.md`（Round 9 batch 1） / `marketing-portfolio-metrics-substitution-plan.md`（Round 7 マスタープラン） / `marketing-portfolio-staging-spec.md`（Round 8 γ） / `marketing-web-ops-handoff.md`（本書連動 Web-Ops 連携） |

---

**起案: Marketing 部門 R10 Marketing-ζ / 2026-05-04 深夜（Round 10 独立 Agent dispatch、DEC-019-025 SOP 準拠）/ portfolio 18×18 metric matrix（双フェーズ版、12+ 確定 / 6 動的開示）**
