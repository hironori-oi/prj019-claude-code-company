# PRJ-019 Clawbridge — Portfolio 実測値差替準備パッケージ

- **作成日**: 2026-05-04
- **担当**: Marketing 部門
- **対象**: portfolio Section 9「結果」の予測値 → 実測値 差替手順
- **依拠議決**: DEC-019-052 議決-25 (B 主軸 + C 透明性 OSS 補助) / Round 6 portfolio Section 4-10 §9.1 「6/27 朝予測値」明記方針
- **公開予定**: 2026-06-27 09:00 JST (差替最終確認は 6/26 段階 3)
- **本書の役割**: 6/26 段階 3 (Marketing コピー最終確認) に向けた **「placeholder 一覧 + 実測値収集 SOP + Owner 承認向け差分プレビュー作成手順」** の事前準備パッケージ

---

## 1. 200 字エグゼクティブサマリ

本書は portfolio Section 9 の予測値 (例: 「83 全緑」「副作用 0 行」「週 4-7 回介入」) を、Phase 1 完了 6/20 段階の実測値に 6/26 朝段階 3 で差し替える手順を事前準備する。差替対象は §9.1.1 技術 KPI 6 項目 / §9.1.2 組織運営 KPI 4 項目 / §9.1.3 narrative KPI 5 項目 = **計 15 項目**、加えて Section 4-10 各所の予測値箇所 12 件、計 **27 placeholder**。`{{predicted}} → {{actual}}` 形式で命名し、Slack metrics / portfolio analytics / Zenn analytics / Vercel Analytics / GA4 / Supabase Contact form の 6 ソースから収集する SOP を確定。Owner 最終承認は 6/26 19:00 JST までに `git diff` ベースの差分プレビューで実施。

---

## 2. 差替対象 placeholder 一覧

### 2.1 Section 9.1.1 技術 KPI (6 項目)

| # | placeholder | 6/27 朝予測値 (現) | 実測値ソース | 収集 SOP |
| --- | --- | --- | --- | --- |
| K1.1 | `{{auto_test_count}}` | 83 全緑 | Phase 1 W4 完了時 `pnpm test` 結果 | Dev に 6/20 sign-off 時点の最終 count を依頼 |
| K1.2 | `{{mandatory_controls_count}}` | 44 確定 / 段階実装 | `review-mandatory-controls-50-final.md` 最終版 | Review に 6/20 sign-off 時点の確定 list を依頼 |
| K1.3 | `{{api_cap_buffer_pct}}` | API cap 内 buffer 50% | `cost-tracker.ts` 月次サマリ (6/20 時点) | Dev に 6/20 23:59 月次 close 数値を依頼 |
| K1.4 | `{{monthly_total_usd}}` | ≤$430 | 同上 (subscription $400 + API ≤$30) | Dev に 6/20 月次 close 数値を依頼 |
| K1.5 | `{{side_effect_lines}}` | 0 行 | `verify-zero-side-effect.sh` 結果 | Dev に 6/20 sign-off 時点の grep + git history 三重検証結果を依頼 |
| K1.6 | `{{parallel_projects_count}}` | 3 件 全継続稼働 | `dashboard/active-projects.md` (6/20 時点) | 秘書部門に 6/20 dashboard snapshot を依頼 |

### 2.2 Section 9.1.2 組織運営 KPI (4 項目)

| # | placeholder | 6/27 朝予測値 (現) | 実測値ソース | 収集 SOP |
| --- | --- | --- | --- | --- |
| K2.1 | `{{hitl_gates_integrated}}` | 11/11 完遂 | Phase 1 W3 統合検収結果 | Review に 6/20 sign-off 時点の HITL 統合 status を依頼 |
| K2.2 | `{{owner_intervention_freq}}` | 週 4-7 回 (中央値 5) | Slack `#openclaw-alerts` 履歴 (5/26-6/20 4 週間) | Marketing が Slack export → 週次 count を集計 |
| K2.3 | `{{transparency_axes_achieved}}` | 6/6 全達成 | DEC-019-033 §⑤ Owner-in-the-loop dashboard 公開状況 | Web-Ops に 6/20 dashboard 公開 status を依頼 |
| K2.4 | `{{knowledge_entries_per_sub}}` | 各 8-12 (patterns/decisions/pitfalls) | `organization/knowledge/{patterns,decisions,pitfalls}/*.md` 件数 | Marketing が 6/20 23:59 時点の `ls -1` count を集計 |

### 2.3 Section 9.1.3 narrative KPI (5 項目)

| # | placeholder | 30 日後目標 (現) | 実測値ソース | 収集 SOP |
| --- | --- | --- | --- | --- |
| K3.1 | `{{pv_30d}}` | 6,000 | Vercel Analytics + GA4 | Web-Ops が 6/26 朝に過去 30 日 PV を取得 (公開前なので "公開直前 baseline = 0" を記録) |
| K3.2 | `{{unique_30d}}` | 3,500 | GA4 | 同上 |
| K3.3 | `{{scroll_depth_75pct}}` | 60% 以上 | GA4 scroll event | 同上 |
| K3.4 | `{{contact_cv_pct}}` | 1.5% | Supabase Contact form | 同上 |
| K3.5 | `{{contact_inquiries_30d}}` | 6 件 (Phase 2 関心 3+ / 見積依頼 1+) | Supabase Contact form 内訳 | 同上 |

> 注: K3.x は **公開前 (6/26 朝) は "0 / baseline" を記録** し、公開後 30 日経過した 7/27 に再収集する。本 portfolio ページには「目標値」として表示し続ける。

### 2.4 Section 4-10 各所の予測値箇所 (12 件)

| # | placeholder | 出現箇所 | 6/27 朝予測値 (現) | 実測値ソース |
| --- | --- | --- | --- | --- |
| S4.1 | `{{wrapper_responsibilities_count}}` | §4.3 | 5 責務 | `app/openclaw-runtime/src/wrapper.ts` 実装確認 |
| S5.1 | `{{ng3_hours_per_day}}` | §5.2 | 16h/日 (案 B) | DEC-019-008 改定後の確定値 |
| S5.2 | `{{ban_probability_case_b}}` | §5.2 | 30-45% | Research 6/20 時点の最終試算 |
| S6.1 | `{{hitl_gates_total}}` | §6.2 | 11 種 | Review 6/20 確定 |
| S6.2 | `{{transparency_axes_total}}` | §6.3 | 6 軸 | DEC-019-033 確定 |
| S7.1 | `{{api_consumption_actual}}` | §7.4 | $11-15 (5 必須施策後) | Dev 6/20 月次 close |
| S7.2 | `{{cost_savings_vs_old}}` | §7.5 | $270 節約 ($700 → ≤$430) | Dev 6/20 月次 close |
| S8.1 | `{{tests_at_w1_start}}` | §8.1 | 14 tests pass (wrapper-contract) | Dev 6/2 W1 開始日記録 |
| S8.2 | `{{mock_70_pct_acceptance_confidence}}` | §8.2 | 96% (W2 段階) | Dev 6/8 W2 完了時記録 |
| S8.3 | `{{day0_readiness_pct}}` | §8.4 | 99% | Review 6/20 sign-off 数値 |
| S8.4 | `{{plan_a_initial_commit}}` | §8.5 | `26325ab` | git log 確認 |
| S8.5 | `{{plan_a_hotfix_commit}}` | §8.5 | `3693862` | git log 確認 |

### 2.5 placeholder 計数

| 範囲 | placeholder 数 |
| --- | --- |
| Section 9.1.1 技術 KPI | 6 |
| Section 9.1.2 組織運営 KPI | 4 |
| Section 9.1.3 narrative KPI | 5 |
| Section 4-10 各所 | 12 |
| **合計** | **27** |

---

## 3. 6/26 朝の実測値収集 SOP

### 3.1 タイムライン

| 時刻 (JST) | 担当 | 作業 |
| --- | --- | --- |
| 6/26 06:00 | 秘書部門 | `dashboard/active-projects.md` snapshot 取得 (K1.6) |
| 6/26 07:00 | Dev 部門 | 月次 close 数値 (K1.3 / K1.4 / S7.1 / S7.2) を CEO 提出 |
| 6/26 07:30 | Dev 部門 | テスト最終 count (K1.1) / 副作用検証結果 (K1.5) / commit hash 確認 (S8.4 / S8.5) を CEO 提出 |
| 6/26 08:00 | Review 部門 | 必須コントロール確定 list (K1.2) / HITL 統合 status (K2.1) / Day-0 readiness (S8.3) を CEO 提出 |
| 6/26 08:30 | Web-Ops 部門 | dashboard 公開 status (K2.3) / Vercel + GA4 baseline (K3.1-K3.5) を CEO 提出 |
| 6/26 09:00 | Marketing 部門 | Slack export → Owner 介入頻度集計 (K2.2) / `organization/knowledge/` 件数集計 (K2.4) を CEO 提出 |
| 6/26 09:30 | Research 部門 | NG-3 確定値 + BAN 確率最終試算 (S5.1 / S5.2) を CEO 提出 |
| 6/26 10:00 | Marketing 部門 | 全 27 placeholder の `{{predicted}} → {{actual}}` 差替を Section 4-10 文書に反映、git diff で差分プレビュー作成 |
| 6/26 12:00 | Marketing 部門 | CEO に diff プレビュー提出 |
| 6/26 14:00 | CEO | Owner に最終確認依頼 (差分付き) |
| 6/26 19:00 JST | Owner | 最終承認 (approve / reject) |
| 6/26 21:00 | Web-Ops 部門 | 承認反映後、Vercel staging deploy |
| 6/27 07:00 | Web-Ops 部門 | Vercel production deploy (本公開) |
| 6/27 09:00 | Marketing + Web-Ops | SNS 投稿 (X thread / note publish) |

### 3.2 Slack metrics 集計手順 (K2.2 Owner 介入頻度)

```bash
# Slack export を CSV で取得
slack-export --channel '#openclaw-alerts' \
  --start 2026-05-26 --end 2026-06-20 \
  --format csv > slack-alerts-w1-w4.csv

# Owner reaction (approve / reject) のみ抽出
awk -F',' '$5 == "owner" && ($6 == "approve" || $6 == "reject") {print $1}' \
  slack-alerts-w1-w4.csv | sort | uniq -c

# 週次 count 集計
python3 scripts/weekly-aggregate.py slack-alerts-w1-w4.csv \
  --output weekly-intervention-count.json
```

期待形式:
```json
{
  "w1": 5, "w2": 4, "w3": 7, "w4": 6,
  "total": 22, "median": 5.5, "min": 4, "max": 7
}
```

### 3.3 ナレッジ件数集計手順 (K2.4)

```bash
cd /path/to/prj019-claude-code-company

# 各サブディレクトリの件数
for sub in patterns decisions pitfalls; do
  count=$(ls -1 organization/knowledge/$sub/*.md 2>/dev/null | wc -l)
  echo "$sub: $count"
done

# 期待出力例:
# patterns: 9
# decisions: 11
# pitfalls: 8
```

### 3.4 portfolio analytics baseline 取得 (K3.1-K3.5)

公開前 (6/26 朝) は「baseline = 0」を記録する。これは "公開前なので 0、公開後 30 日で目標達成見込み" の透明性開示として portfolio に明記。

```ts
// scripts/collect-baseline-metrics.ts
const baseline = {
  pv_30d_baseline_at_2026_06_26: 0,
  unique_30d_baseline_at_2026_06_26: 0,
  scroll_depth_75pct_baseline: null,  // event 蓄積前
  contact_cv_pct_baseline: null,
  contact_inquiries_30d_baseline: 0,
};
fs.writeFileSync('reports/portfolio-baseline-2026-06-26.json', JSON.stringify(baseline, null, 2));
```

**Phase 2 W1 (= 公開後 30 日後 = 7/27) に再収集して、別 commit で update する**。

### 3.5 Zenn / note analytics (連載 #1 公開分)

連載 #1 (Vol.1 subprocess spawn) の 6/27 朝同時公開分について:

| ソース | 取得内容 |
| --- | --- |
| Zenn analytics | 公開直後の view / like / comment count |
| note dashboard | 公開直後の view / like / コメント count |

これらは Section 9.1.3 narrative KPI とは別軸の **「連載併走 KPI」** として、`reports/marketing-zenn-note-baseline-2026-06-26.json` に記録。本 portfolio Section 9 には含めず、内部レポートのみとする。

---

## 4. Owner 最終承認向け差分プレビュー作成手順

### 4.1 git diff ベースの差分プレビュー

```bash
# 差替前 (現状) を baseline として stash
cd /path/to/prj019-claude-code-company
git stash push -m "portfolio baseline before substitution 2026-06-26"

# 差替作業 (Marketing が手動 + script 併用で実施)
python3 scripts/substitute-placeholders.py \
  --input projects/PRJ-019/reports/marketing-portfolio-narrative-section-4-10.md \
  --measurements reports/measurements-2026-06-20.json \
  --output projects/PRJ-019/reports/marketing-portfolio-narrative-section-4-10.md

# diff を生成
git diff --stat HEAD > /tmp/portfolio-substitution-diff-stat.txt
git diff HEAD -- projects/PRJ-019/reports/marketing-portfolio-narrative-section-4-10.md \
  > /tmp/portfolio-substitution-diff.patch
```

### 4.2 Owner 提示用フォーマット

CEO は次の形式で Owner にメール / Slack DM:

```
件名: [PRJ-019] portfolio 実測値差替 最終承認依頼 (6/26 19:00 JST 期限)

本文:
Owner 様

PRJ-019 Clawbridge portfolio Section 9 + Section 4-10 各所の
予測値 27 placeholder を、Phase 1 完了 6/20 時点の実測値に差替しました。

【主な差替】
- 自動テスト件数: 83 → {actual: ${actual_test_count}}
- 月次総額: ≤$430 → {actual: ${actual_monthly_total}}
- HITL 11 種統合: 11/11 → {actual: ${actual_hitl_status}}
- Owner 介入頻度: 週 4-7 回 → {actual: median ${actual_intervention_median}}
- ナレッジ件数: 各 8-12 → {actual: patterns ${pattern_count} / decisions ${decision_count} / pitfalls ${pitfall_count}}

【全 27 placeholder の差分】
- git diff stat: 添付 portfolio-substitution-diff-stat.txt
- 詳細 diff: 添付 portfolio-substitution-diff.patch

【承認の仕方】
- approve → CEO へ「OK」と返信、6/27 朝 09:00 公開へ進む
- reject → CEO へ「reject」+ 修正点を返信、Marketing が再差替

期限: 6/26 19:00 JST
```

### 4.3 reject 時の rollback 手順

Owner が reject した場合の rollback:

```bash
# stashed baseline を復元
git stash pop

# 修正点を反映して再差替
# (Marketing が CEO 経由で Owner 修正点を受領、再 substitute-placeholders.py 実行)

# 再 diff 生成 → CEO → Owner ループ (最大 2 周まで、3 周目以降は公開延期判断)
```

### 4.4 公開延期判断のトリガー

3 周以上 reject が続いた場合、または 6/26 23:00 JST までに承認が得られなかった場合:

1. CEO 緊急判断で「公開延期 7 日」を決定
2. Marketing + Web-Ops が Vercel deploy を hold
3. 6/27 朝 09:00 SNS 投稿予定を取消
4. 翌週 7/4 朝 09:00 へリスケ

これは **Day-0 readiness 99%** のうち残り 1% の安全弁である。

---

## 5. 残タスク (5/4 - 6/26 期間)

| # | タスク | 担当 | 期日 |
| --- | --- | --- | --- |
| T-01 | `scripts/substitute-placeholders.py` 実装 | Dev + Marketing | 6/15 |
| T-02 | `scripts/weekly-aggregate.py` 実装 (Slack metrics 集計) | Dev | 6/15 |
| T-03 | `scripts/collect-baseline-metrics.ts` 実装 | Web-Ops | 6/15 |
| T-04 | 27 placeholder の検索精度確認 (Section 4-10 全文 grep) | Marketing | 6/22 |
| T-05 | 6/26 朝 SOP の dry run (mock 数値で 1 周回す) | Marketing + 全部署 | 6/24 |
| T-06 | Owner 提示メールテンプレ確定 | Marketing + CEO | 6/24 |
| T-07 | reject 時の rollback シミュレーション | Marketing + Web-Ops | 6/24 |

---

## 6. 完了基準 (6/26 段階 3 終了時)

- [ ] 27 placeholder 全件で `{{predicted}} → {{actual}}` 差替完了
- [ ] git diff stat / diff patch 生成完了
- [ ] CEO → Owner 最終承認メール送信完了
- [ ] Owner 「OK」または修正点受領 (6/26 19:00 JST 期限)
- [ ] 修正反映完了 (reject 時)
- [ ] Vercel staging deploy 完了 (6/26 21:00 JST)
- [ ] 6/27 07:00 production deploy への準備完了

---

## 7. 提出メタ情報

| 項目 | 値 |
| --- | --- |
| 行数 | 約 240 行 (上限 250 行以内) |
| 対象 | portfolio Section 9 + Section 4-10 各所、計 27 placeholder |
| 収集ソース | Slack metrics / portfolio analytics / Zenn analytics / Vercel Analytics / GA4 / Supabase Contact form |
| 整合先 | `web-ops-prj019-portfolio-design.md` (515 行) §1.3 SEO meta + §6 公開フロー |
| Owner 承認期限 | 6/26 19:00 JST |
| 公開予定 | 6/27 09:00 JST |
| commit / push | **実行しない** (CEO が一括 push) |
| 関連報告 | `marketing-portfolio-narrative-section-4-10.md` (差替対象) / `marketing-portfolio-narrative-section-1-3.md` (差替対象外) / `web-ops-prj019-portfolio-design.md` (公開フロー設計) / `marketing-launch-runbook-2026-06-20.md` (launch SOP) |

---

**作成: Marketing 部門 / 2026-05-04 / Round 7 案 7-D Marketing 担当 portfolio 実測値差替準備パッケージ**
