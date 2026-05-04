# PRJ-019 Clawbridge — Round 15 Marketing-I 完遂レポート（公開前倒し case 別 narrative 差分 + 公開後 30 日 → 60 日運用準備計画）

| 項目 | 内容 |
|---|---|
| 文書 ID | marketing-i-r15-public-launch-narrative-diff-and-30-60-day-ops |
| 制定日 | 2026-05-05（Round 15 第 2 波、Marketing-I 担当、議決-28 Full Pass 採択直後） |
| 起票 | Marketing 部門（R15 Marketing-I、独立 Agent dispatch、DEC-019-025 SOP 準拠、general-purpose 経由） |
| 区分 | **公開前倒し case 別 narrative 差分**（軸-B 加速 case-A = 6/20 公開採択を受けた 3 系統 narrative 差分）+ **公開後 30 日 → 60 日運用準備計画**（K1-K3 metric 流入 + dynamic disclosure card 連動）+ **Web-Ops B handoff 仕様**（HP / LP / 事例ページ / OG image / 取り下げ Runbook） |
| 上位文書 | `ceo-acceleration-plan-v16-prep.md` §1.2 軸-B / `ceo-dec-019-062-prep.md` §2.2 / `MINUTES-FINAL-2026-05-05.md` §3.0 Q4 / `marketing-launch-runbook-2026-06-20.md` / `marketing-launch-narrative-final.md` / `marketing-portfolio-18x18.md` v3 / `marketing-metric-plan-v1.1.md` / `marketing-round11-dynamic-disclosure-cards.md` / `marketing-webops-handoff-package.md` / `marketing-round13-extraction-portfolio-v3-en.md` |
| 上位決裁 | DEC-019-007 / 025 / 026 / 027 / 028 / 029 / 030 / 033 / 050 / 051 / 052 / 053 / 055 / 056 / 057 / 058 / 059 / 060 / 061 / **062**（Full Pass 確定、5/5 朝採決完遂） |
| ステータス | **draft v1（完遂着地）** |
| 行数目標 | 350-500 行 |
| 採択公開日 | **2026-06-20（土）09:00 JST = 軸-B 加速 case-A、確度 75%** |
| fallback | 6/27（土）09:00 JST = DEC-019-026 元計画、確度 92% |
| 補助 case | 6/13（土）09:00 JST = case-B、確度 45%（採択せず、参考評価のみ） |

---

## §0. CEO 向け 200 字エグゼクティブサマリ

本書は議決-28 Full Pass（軸-B 加速 case-A 採択 = 公開 6/20 朝 09:00 JST 確定）を受けた、公開前倒し case 別 narrative 差分（6/20 採択 vs 6/13 補助 vs 6/27 fallback）と、公開後 30 日 → 60 日運用準備計画、Web-Ops B との handoff 仕様を確定する Round 15 Marketing-I 完遂レポートである。**§1**: 6/20 採択 narrative 差分（baseline 6/27 から 7 日前倒し時の portfolio / LP / 事例ページ / OG image / SEO meta 差分を確定、Heading A 完全継承）。**§2**: 6/13 補助 narrative 差分（14 日前倒し時の薄調整窓 1.5 週間下のリスク評価、case-B reject 根拠の補強）。**§3**: 6/27 fallback narrative（議決-28 reject 時の元計画維持、ロールバック手順）。**§4**: 公開後 30 日（6/20 → 7/20）運用 → 60 日（7/20 → 8/19）運用拡張計画、K1-K3 metric 流入 + dynamic disclosure card 6 件 + 新規 60 日 card 4 件 連動。**§5**: Web-Ops B handoff 仕様（HP / LP / 事例ページ / OG image / 取り下げ Runbook）。**§6**: Marketing 法務調整 + SEO momentum + 取り下げ Runbook の case 別タイムライン。API 追加コスト $0、絵文字非使用、Heroicons 標準、shadcn/ui 準拠、AI 感を出さないクリーンデザイン継続。

---

## §1. 6/20 採択 narrative 差分（baseline 6/27 → 7 日前倒し時の差分明示）

### §1.1 公開日付差分の影響範囲（5 系統 × 3 媒体 = 15 セル）

| 媒体 | datePublished | dateModified | timeline 起点 | metric 確定タイミング | OG image cap |
|---|---|---|---|---|---|
| portfolio v3（事例ページ /works/clawbridge）| 2026-06-20 | 2026-06-20 | 6/20 → 7/20（30 日）/ 8/19（60 日）| 6/20 朝 placeholder 差替 | 「2026-06-20 公開」明記 |
| LP（/lp/clawbridge）| 2026-06-20 | 2026-06-20 | 6/20 → 7/20 | 6/20 朝 placeholder 差替 | 「2026-06-20 公開」明記 |
| HP トップ（/）| 2026-06-20 | 2026-06-20 | 6/20 → 7/20 | 6/20 朝 placeholder 差替 | 「2026-06-20 公開」明記 |
| 技術ブログ vol1-6（/blog/）| 2026-06-20 〜 7/4 段階公開 | 各記事ごと | 6/20 → 8/19 | vol1 = 6/20、vol2-6 = 6/27 / 7/4 / 7/11 / 7/18 / 7/25 段階 | vol1 のみ「launch day」表記 |
| 28×28 narrative（事例ページ §4）| 2026-06-20 | 2026-06-20 | 6/20 起点 | 6/20 朝 placeholder 差替 | 28 行縦並び維持、章区切り 5 維持 |

### §1.2 portfolio v3（18×18 matrix）差分（13 cells 影響）

`marketing-portfolio-18x18.md` v3（841 行、Round 13 Marketing-G 完遂着地）からの 6/20 公開反映差分:

| cell | v3 baseline 値（6/27 想定） | v3.1 採択値（6/20 確定）| 差分理由 |
|---|---|---|---|
| (1,1) | 「2026-06-27 公開、56 日連続稼働」| 「2026-06-20 公開、49 日連続稼働」| 7 日前倒し |
| (1,7) | K1.1 `auto_test_count = 300+ 全緑`（6/20 確定）| 同左、ただし「公開 0 日前確定」表記 | timeline 整合 |
| (1,11) | K1.5 `side_effect_lines = 0 行 56 日継続`（6/20 確定）| 同左、ただし「公開当日確定」表記 | timeline 整合 |
| (3,3) | Phase 1 sign-off 5/27 候補 → 6/13 公式完了 buffer 終端 | Phase 1 sign-off 5/22 push（軸-A 連動）→ 5/31 公式完了 buffer 終端 | 軸-A/D 連動 |
| (4,5) | 「6/27 公開、夏のキャンペーン期前公開」| 「6/20 公開、夏のキャンペーン期 14 日前公開」| 競合差別化文言調整 |
| (5,9) | dynamic disclosure card 6/27 起点 30 日 = 7/27 確定 | dynamic disclosure card 6/20 起点 30 日 = 7/20 確定 + 60 日 = 8/19 確定（新規）| 30 日 → 60 日拡張連動 |
| (6,2) | 「公開 1 週間モニタリング 6/27 → 7/3」| 「公開 1 週間モニタリング 6/20 → 6/26」| 7 日前倒し |
| (8,8) | Phase 2 着手 6/24 想定 | Phase 2 着手 **6/3 候補（軸-C case-A）** / 6/10 fallback / 6/24 元計画 | 軸-C 連動 |
| (10,10) | 「公開後 30 日 K3.x 5 件確定」| 「公開後 30 日 K3.x 5 件確定 + 60 日 K3.6-K3.9 4 件追加」| 60 日運用拡張連動 |
| (11,4) | OSS 公開 6/30 想定 | OSS 公開 6/23（公開 3 日後）想定 | 7 日前倒し |
| (12,12) | drill #2 結果反映 7 日窓 | drill #2 結果反映 13 日窓（5/7 朝 → 6/20）| 反映窓拡大 |
| (15,7) | Marketing 14 日調整窓（6/13 → 6/27）| Marketing 7 日調整窓（6/13 → 6/20）| 7 日短縮 |
| (18,18) | 「6/27 公開後の進化中の章」| 「6/20 公開後の進化中の章 + 8/19 第二進化点」| 60 日 milestone 追加 |

**差分カウント**: 13 cells / 324 cells = 4.0% 差分（残 311 cells = 96.0% v3 完全継承）

### §1.3 LP（`/lp/clawbridge`）差分（4 ブロック）

| ブロック | v1.0 baseline（6/27 想定）| v1.1 採択値（6/20 確定）| 差分行数 |
|---|---|---|---|
| Hero | 「2026-06-27 公開、AI 組織が AI 組織を運営する」| 「2026-06-20 公開、AI 組織が AI 組織を運営する」| 1 行 |
| Section 2: 56 日連続稼働 | 「Phase 1 完遂 6/13、56 日連続稼働」| 「Phase 1 完遂 5/31（buffer 終端）、49 日連続稼働」| 2 行 |
| Section 5: ロードマップ | 「Phase 2 着手 6/24」| 「Phase 2 着手 6/3 候補 / 6/10 fallback」| 1 行（採択値次第で確定）|
| CTA | 「6/27 朝公開 → 7 日間問い合わせ受付」| 「6/20 朝公開 → 7 日間問い合わせ受付」| 1 行 |

合計差分行数: **5 行 / 約 480 行 = 1.0%**（LP 全体は v1.0 完全継承）

### §1.4 事例ページ（`/works/clawbridge`）差分（10 sections のうち 3 sections 影響）

| section | 影響 | 差分内容 |
|---|---|---|
| §1 概要 | 中 | 公開日 6/20 反映、Phase 1 期間 5/3 → 5/31（49 日）に修正、56 日 → 49 日 |
| §3 portfolio metrics 27 件 | 大 | placeholder 差替タイミング 6/26 朝 → **6/19 朝**（7 日前倒し）、CSV 提出期限 6/19 朝 |
| §5 Phase 1/2 ロードマップ | 中 | Phase 2 着手 6/24 → 6/3 候補（軸-C 連動）、ロードマップカード 1 枚再描画 |
| §2 / §4 / §6 / §7 / §8 / §9 / §10 | 0 | v3 baseline 完全継承（差分 0） |

**§3 の 27 placeholder への影響**:

| placeholder 群 | 影響 | 対処 |
|---|---|---|
| K1.1-K1.11（プロダクト KPI 11 件）| なし | 全件 6/13 W3 / 6/20 W4 完了で確定済（5/22 push sign-off 成立時は 5/22 確定）|
| K2.1-K2.5（運用 KPI 5 件、6/3 W1 確定）| 軸-C 連動でタイミング前倒し | 6/3 → **5/22 push 確定**（軸-A 連動）|
| K2.6-K2.8（運用 KPI 3 件、6/20 sign-off 確定）| 7 日前倒し | 6/20 sign-off → **5/22 push sign-off** で確定 |
| K3.1-K3.5（narrative KPI 5 件、公開後 30 日確定）| 起点シフト | 6/27 → **6/20 起点**、確定日 7/27 → **7/20** |

### §1.5 OG image 差分（1200×630 PNG + WebP、ライト / ダーク 2 種）

| 要素 | baseline（6/27 想定） | 採択値（6/20 確定） |
|---|---|---|
| 上部 caption | 「2026.06.27 公開」| 「2026.06.20 公開」 |
| Heading A 中央配置 | 「AI 組織が AI 組織を運営する」維持 | 同左、変更なし |
| 下部 metadata | 「Phase 1: 56 日連続稼働 / API $0」| 「Phase 1: 49 日連続稼働 / API $0」 |
| ライト / ダーク 2 種 | zinc 系ベース、絵文字非使用、Heroicons 補助のみ | 同左、変更なし |
| 制作期日 | 6/12（M3 最終締切）| **6/5（7 日前倒し）** |

### §1.6 SEO meta 差分

| 要素 | baseline（6/27） | 採択値（6/20）|
|---|---|---|
| `<title>` | 「Clawbridge — AI 組織が AI 組織を運営する \| ai-company」（60 字以内）| 同左、変更なし |
| `<meta description>` | 「2026 年 6 月 27 日公開、56 日連続稼働、API 追加コスト $0...」（120 字以内）| 「2026 年 6 月 20 日公開、49 日連続稼働、API 追加コスト $0...」 |
| `<meta property="og:url">` | `https://ai-company-ten.vercel.app/works/clawbridge` | 同左、変更なし |
| `<meta property="article:published_time">` | `2026-06-27T09:00:00+09:00` | `2026-06-20T09:00:00+09:00` |
| Twitter Card | summary_large_image | 同左、変更なし |
| JSON-LD `datePublished` | `2026-06-27` | `2026-06-20` |
| JSON-LD `dateModified` | `2026-06-27` | `2026-06-20`（公開時）→ 動的更新 |

---

## §2. 6/13 補助 case-B narrative 差分（14 日前倒し時の薄調整窓のリスク評価）

**結論**: 議決-28 で **case-B 採択せず**、軸-B case-A（6/20）採択。本節は補助評価として参考のみ。

### §2.1 14 日前倒し時の調整窓圧縮

| 調整作業 | baseline（6/27、調整窓 14 日）| case-B（6/13、調整窓 0 日）| 差分 |
|---|---|---|---|
| Marketing v3 凍結 | 6/12 | 6/12（変化なし）| 6/13 公開なら凍結即公開、調整窓 0 日 |
| 法務最終 review | 6/13 | **NG（窓ゼロ）**| 法務 review 不可 |
| OG image 制作 | 6/12 | 6/5 必須 | 7 日前倒し（更にきつい）|
| SEO momentum 構築 | 6/14-19 | **NG（窓ゼロ）**| momentum 構築不可 |
| Web-Ops staging deploy | 6/22 | **NG（公開後）**| staging skip = 直接本番 deploy で高リスク |
| 取り下げ Runbook 待機 | 6/13 | **NG（窓ゼロ）**| Runbook 起票不可、緊急時即応不可 |
| 27 placeholder 実測値 CSV 提出 | 6/26 朝 | **NG（公開後）**| 公開時点で実測値未収集、predicted のみで公開 |
| drill #2 結果反映 | 5/7 → 6/27（51 日窓）| 5/7 → 6/13（37 日窓）| 14 日短縮、許容範囲内 |

**case-B reject 主因**: 7 項目中 5 項目 NG（法務 / SEO / Web-Ops staging / 取り下げ Runbook / 27 placeholder 実測値）= 公開前提崩壊。

### §2.2 case-B 採択時の narrative 差分（参考、不採択）

| 媒体 | 6/13 公開時の差分 |
|---|---|
| portfolio v3 cell (1,1) | 「2026-06-13 公開、42 日連続稼働」 |
| LP Hero | 「2026-06-13 公開、AI 組織が AI 組織を運営する」 |
| OG image caption | 「2026.06.13 公開」 |
| SEO meta `article:published_time` | `2026-06-13T09:00:00+09:00` |
| Phase 1 sign-off との関係 | 5/22 push sign-off → 6/13 公開まで 22 日（buffer は十分だが法務窓欠落）|
| 27 placeholder | 「**predicted 値のみ表示、6/19 朝に実測値差替再 deploy**」（透明性低下、信頼性損失リスク）|

### §2.3 case-B 不採択判定根拠

1. 法務 review 窓ゼロ = ToS / 配分 / 婉曲化チェック不可 = 公開可否判定 NoGo
2. SEO momentum 構築窓ゼロ = 公開当日 organic traffic 期待値 30% 減
3. Web-Ops staging skip = Lighthouse 100/100/100/100 達成検証不可
4. 取り下げ Runbook 起票窓ゼロ = 緊急時 rollback 30 分以上
5. 27 placeholder 実測値未収集 = 「実測 17 件」表記不可、「predicted 27 件」のみで透明性主張力低下
6. **議決-28 で軸-B case-B reject 確定済**（MINUTES-FINAL §3.2）

---

## §3. 6/27 fallback narrative（議決-28 reject 時の元計画維持、現実は採択）

**結論**: 議決-28 Full Pass 確定により本節は **dormant fallback path**。本節は議決-28 採択結果が逆転した場合 / 6/13-19 期間中の重大事象（drill #2 5/7 朝 NG、Phase 1 sign-off 5/22 push 不成立、Marketing 法務 review NG）発生時のロールバック path として保持。

### §3.1 6/27 fallback narrative の保持要件

| 媒体 | fallback 内容 |
|---|---|
| portfolio v3 | DEC-019-026 元計画維持、cell 13 件すべて baseline 値復元 |
| LP | v1.0 完全維持（v1.1 = 6/20 採択値は破棄） |
| HP トップ | DEC-019-029 採用「HP トップ + 事例 + Contact form のみ」維持 |
| 技術ブログ vol1-6 | 6/27 起点段階公開復元 |
| 28×28 narrative | timeline 起点 6/27 復元 |
| OG image | caption「2026.06.27 公開」復元、ライト/ダーク 2 種再制作（6/19 までに完遂）|
| SEO meta | `article:published_time = 2026-06-27` 復元 |
| dynamic disclosure card | 起点 6/27、確定日 7/27（30 日）/ 8/26（60 日）|

### §3.2 fallback 発動条件 4 件

1. drill #2 5/7 朝 NG → 議決-28 conditional → 軸-B case-A 撤回
2. Phase 1 sign-off 5/22 push 不成立（軸-A 5/22 95%+ 達成 35-45% 確度の悲観 case）→ 軸-B case-A 撤回
3. Marketing 法務 review 6/13 NG → 6/20 公開不可 → fallback 6/27
4. Web-Ops staging deploy 6/12 までに完遂しない → 6/20 公開不可 → fallback 6/27

### §3.3 fallback 発動時の Marketing アクション 5 段階

1. CEO 経由 Owner 報告（直接 Owner 報告は禁止、CLAUDE.md ルール 1 遵守）
2. portfolio v3 v3.1 採択値を v3 baseline に巻き戻し（git revert by tag）
3. LP v1.1 採択値を v1.0 に巻き戻し
4. OG image v1.1 を v1.0 に巻き戻し（v1.0 ライト/ダーク 2 種を `/og/clawbridge-v1.0/` に保管）
5. Web-Ops B に fallback 通知 + DNS / preview URL / staging deploy schedule 6/22 復元依頼

---

## §4. 公開後 30 日 → 60 日運用準備計画（K1-K3 metric 流入 + dynamic disclosure card 連動）

### §4.1 30 日運用（6/20 → 7/20）

`marketing-round11-dynamic-disclosure-cards.md` の 6 cards 設計を 6/20 起点に shift:

| # | card ID | card title | 公開タイミング（6/20 起点）| data source |
|---|---|---|---|---|
| 1 | `card-pv-30d` | PV — 公開後 30 日 | 6/27 中間値 / 7/4 中間値 / 7/13 中間値 / 7/20 確定 | Vercel Analytics + Plausible |
| 2 | `card-unique-30d` | ユニーク訪問者 — 公開後 30 日 | 6/27 / 7/4 / 7/13 / 7/20 確定 | Vercel Analytics + Plausible |
| 3 | `card-scroll-depth` | scroll_depth 75% 到達率 | 7/4 中間値 / 7/20 確定 | Plausible custom event + Tag Manager |
| 4 | `card-contact-cv` | Contact form CV 率 | 7/4 中間値 / 7/20 確定 | Vercel Analytics goal + Contact form 集計 |
| 5 | `card-contact-inquiries` | Contact form 問い合わせ件数 | 7/4 中間値 / 7/20 確定 | Contact form 受信 mailbox 集計 |
| 6 | `card-phase2-decision` | Phase 2 着手 GO/NoGo 判定 | **6/27 計画着地（前倒し）/ 7/20 議決** | Owner 議決議事録 |

**Phase 2 着手 GO/NoGo 判定の前倒し連動**:
- 軸-C 連動で Phase 2 着手 6/3 候補（case-A、確度 55%）= **公開当日時点で Phase 2 既着手の可能性 55%**
- 公開時点で「Phase 2 着手済」を表示する場合、cell (8,8) を再描画 + card-phase2-decision を「GO 確定（6/3 着手）」に更新

### §4.2 60 日運用拡張（7/20 → 8/19、新規拡張区間）

baseline 30 日（6/27 → 7/27 = `marketing-round11-dynamic-disclosure-cards.md` 設計）+ 30 日拡張（7/20 → 8/19）= **計 60 日運用**

新規追加 dynamic disclosure card 4 件:

| # | card ID | card title | 公開タイミング（6/20 起点）| data source | 60 日運用での意義 |
|---|---|---|---|---|---|
| 7 | `card-pv-60d` | PV — 公開後 60 日（累積）| 7/27 中間値 / 8/12 中間値 / 8/19 確定 | Vercel Analytics + Plausible | 30 日 → 60 日の momentum 持続検証 |
| 8 | `card-organic-traffic-share-60d` | organic traffic 比率 — 60 日 | 8/19 確定 | Plausible referrer分析 | SEO momentum の中期効果検証 |
| 9 | `card-phase2-velocity-60d` | Phase 2 着手後 velocity（commit / week）| 7/27 / 8/12 / 8/19 確定 | git log + GitHub API | Phase 2 早期着手の組織運営価値検証 |
| 10 | `card-knowledge-extraction-yield` | Knowledge 抽出量（patterns + decisions + pitfalls）累計 | 7/27 / 8/12 / 8/19 確定 | `organization/knowledge/` 件数 + DEC-019-033 連動 | Knowledge 蓄積機構の中期実効性検証 |

### §4.3 K1-K3 metric の 30 日 → 60 日流入計画

| metric 群 | 6/20 公開時点 | 30 日（7/20）| 60 日（8/19）| 流入経路 |
|---|---|---|---|---|
| K1.x プロダクト KPI（11 件）| 11 件全確定（公開時点で全件確定済）| 同左、再評価不要 | 同左、再評価不要 | 静的（Phase 1 完遂時確定）|
| K2.x 運用 KPI（5+3 = 8 件）| 8 件全確定 | 同左、再評価不要 | 同左、再評価不要 | 静的（5/22 push sign-off 確定時）|
| K3.x narrative KPI（5 件）| 0 件 | **5 件確定**（30 日 cards 6 件連動）| 同左 + 4 件追加（合計 9 件）| 動的（Vercel + Plausible + Contact form）|
| 60 日拡張 K3.6-K3.9（新規 4 件）| 0 件 | 0 件 | **4 件確定**（60 日 cards 4 件連動）| 動的（同左 + git log + GitHub API + knowledge dir）|

合計: 公開時点 19 件確定 → 30 日 24 件確定 → 60 日 28 件確定（28 件 = 18×18 matrix の 28×28 narrative と整合）

### §4.4 30 日 → 60 日運用での Marketing アクション

| 期日 | アクション | 担当 | 連動 cards |
|---|---|---|---|
| 6/20 09:00 JST | 公開 + 24h モニタリング体制突入 | Marketing | 6 cards 全件 progressing 表示 |
| 6/27 朝 | 7 日中間値追記（K3.1 / K3.2 部分値）| Marketing + Web-Ops | card-pv-30d / card-unique-30d 中間値 |
| 7/4 朝 | 14 日中間値追記 + Phase 2 着手判断会議（軸-C 連動で既着手の可能性高）| Marketing + CEO | 6 cards 全件中間更新 |
| 7/13 朝 | 23 日中間値追記 | Marketing + Web-Ops | card-pv-30d / card-unique-30d 中間値 |
| 7/20 朝 | **30 日確定値追記**（K3.1-K3.5 全 5 件確定）| Marketing + CEO 議決 | 6 cards 全件 completed 化 |
| 7/27 朝 | 60 日拡張開始（新規 4 cards 起票 + progressing 化）| Marketing + Web-Ops | card-pv-60d / card-organic-traffic-share-60d / card-phase2-velocity-60d / card-knowledge-extraction-yield |
| 8/12 朝 | 60 日中間値追記（53 日中間値）| Marketing + Web-Ops | 4 cards 中間更新 |
| 8/19 朝 | **60 日確定値追記**（K3.6-K3.9 全 4 件確定）| Marketing + CEO 議決 | 4 cards 全件 completed 化 |

---

## §5. Web-Ops B handoff 仕様（HP / LP / 事例ページ / OG image / 取り下げ Runbook）

### §5.1 handoff scope（軸-B 加速 case-A 採択反映版）

`marketing-webops-handoff-package.md`（Round 8 起票、6/22 着手 / 6/27 公開想定）を 6/20 公開反映で更新:

| 範囲 | 担当 | 主要成果物（6/20 採択反映）|
|---|---|---|
| Marketing 担当 | Marketing-I（本書）+ Marketing-H（R15 第 4 波）| portfolio v3.1 / LP v1.1 / HP 段落差替 v1.1 / OG image v1.1（ライト/ダーク 2 種）/ SEO meta v1.1 / 27 placeholder CSV（**6/19 朝提出**）/ 取り下げ Runbook v1.0 |
| Web-Ops B 担当 | Web-Ops B（R15 第 4 波）| Next.js 15 App Router 実装更新 / shadcn/ui 組立 / Tailwind / OG image 動的生成 / Vercel staging + 本番 deploy / Lighthouse 100/100/100/100 / WCAG 2.1 AA / Contact form Supabase 連動 / placeholder 差替自動化 / **6/20 朝 09:00 JST 本番公開実行** / hotfix 待機 |
| Review 担当（並列）| Review-G（R15 第 2 波）| WCAG / 婉曲化 / JSON-LD 検証 review pass（**6/17 段階 2**）|
| Dev 担当（連携）| Dev-K/L/M/N（R15 第 3 波）| Contact form Supabase 接続実装支援（必要時）|

### §5.2 hand-off タイムライン（6/20 公開反映 = 7 日前倒し版）

| 日付 | Marketing | Web-Ops B | Review | 備考 |
|---|---|---|---|---|
| 5/5 | Marketing-I 本書起票 | — | — | R15 第 2 波（即時）|
| 5/26 | M2 中間納品（v0.7 → v1.0 推進）| — | — | 段階 1（既存ルート）|
| 6/5 | OG image v1.1 制作完遂（ライト/ダーク 2 種）| — | — | **7 日前倒し**（baseline 6/12 → 6/5）|
| 6/8 | M3 最終納品（v1.0 凍結、Marketing v3.1）| — | — | **7 日前倒し**（baseline 6/12 → 6/8）|
| 6/15 | 27 placeholder 予測値 CSV 確定 | スタック合意（Next.js 15 + Tailwind + shadcn/ui）| — | — |
| 6/15 朝 | — | staging 構築開始（§1 WBS 着手）| — | **7 日前倒し**（baseline 6/22 → 6/15）|
| 6/15 夕 | — | staging 初版 deploy | — | predicted 値表示 |
| 6/16 | Marketing review pass 1 | — | — | copy / 28x28 / OG / JSON-LD 検証 |
| 6/17 | — | — | Review 部門 review | WCAG / 婉曲化 / JSON-LD（段階 2）|
| 6/18 | — | Lighthouse 100/100/100/100 達成検証 | — | — |
| 6/19 朝 | **27 placeholder 実測値 CSV 提出**（7 日前倒し）| placeholder 差替実行 + dry-run | — | 段階 3 |
| 6/19 夕 | — | Owner 最終承認向け diff プレビュー提出 | — | — |
| 6/20 06:00 | — | password protection 解除準備 | — | — |
| 6/20 07:00 | — | Vercel 本番 deploy trigger | — | — |
| 6/20 08:00 | 公開状態 5 点チェック | — | — | — |
| **6/20 09:00** | SNS X 投稿 + Zenn + note 公開 | 24h モニタリング体制突入 | — | **公開（軸-B 加速 case-A）**|

### §5.3 OG image handoff 仕様

| 項目 | 仕様 |
|---|---|
| 形式 | 1200×630 PNG（fallback）+ WebP（primary）|
| バリエーション | ライト（zinc-50 ベース）/ ダーク（zinc-950 ベース）2 種 |
| フォント | Geist Sans Bold（Heading A）+ Geist Mono（caption / metadata）|
| 上部 caption | 「2026.06.20 公開」 |
| 中央 Heading A | 「AI 組織が AI 組織を運営する」（DEC-019-027 採用継続）|
| 下部 metadata | 「Phase 1: 49 日連続稼働 / API 追加コスト $0」 |
| 動的生成 | Web-Ops B が `@vercel/og` で `app/works/clawbridge/opengraph-image.tsx` 実装、Marketing は静的 PNG/WebP 提供 + 動的版 fallback |
| 絵文字 | 不使用（design-guidelines.md §3 遵守）|
| Heroicons | 補助のみ使用可、ただし装飾過多禁止 |

### §5.4 取り下げ Runbook v1.0 handoff（6/13 起票 → 6/19 凍結）

| 項目 | 仕様 |
|---|---|
| 起票期日 | **6/13**（baseline 6/20 → 7 日前倒し）|
| 凍結期日 | **6/19 朝**（公開前日凍結）|
| 発動条件 | 重大事故（個人情報漏洩 / 外部攻撃 / 法的指摘 / 客観的事実誤認）|
| ロールバック手順 | 5 段階（Vercel rollback / DNS 切替 / SNS 削除 / プレス取消 / Owner 報告）|
| 想定所要時間 | 30 分以内（password protection 再有効化 + DNS 戻し + preview URL 化）|
| 緊急連絡先 | CEO 経由（直接 Owner 連絡禁止、CLAUDE.md ルール 1 遵守）|
| 取り下げ後 narrative | fallback 6/27 公開 narrative path 復元 / `/works/clawbridge` を 410 Gone + 取り下げ理由公示 |

### §5.5 5 系統媒体 handoff item 一覧（軸-B case-A 採択版）

| 媒体 | Marketing 提供物 | Web-Ops B 実装物 |
|---|---|---|
| HP トップ（`/`）| 段落差替候補 v1.1（Heading A 反映、6/20 公開明記、Phase 2 6/3 着手反映）| Hero section / About 段落 / 事例カード CTA / Contact form |
| LP（`/lp/clawbridge`）| v1.1（5 行差分反映、Hero / Section 2 / Section 5 / CTA）| Next.js 15 App Router 実装、4 breakpoint レスポンシブ |
| 事例ページ（`/works/clawbridge`）| portfolio v3.1（13 cells 差分反映、§3 27 placeholder 実測値 6/19 朝提出）| 10 sections 実装、recharts PieChart、28×28 縦並び CI test、Supabase Contact form |
| OG image | v1.1（caption 6/20 / metadata 49 日 / ライト・ダーク 2 種）| `app/works/clawbridge/opengraph-image.tsx` + 静的 fallback PNG/WebP |
| 取り下げ Runbook | v1.0（5 段階手順、緊急連絡先、想定所要時間 30 分）| 緊急 deploy script（`scripts/takedown.ts`、Vercel API 連動）|

---

## §6. Marketing 法務調整 + SEO momentum + 取り下げ Runbook の case 別タイムライン

### §6.1 case-A（6/20 採択、Full Pass 確定）タイムライン

| 期日 | 法務調整 | SEO momentum | 取り下げ Runbook |
|---|---|---|---|
| 5/5-5/26 | 法務 review v0.5 起票 | SEO meta v0.5 起票 | takedown v0.3 起票 |
| 5/27-6/8 | 法務 review v1.0 凍結 | SEO meta v1.0 凍結 | takedown v0.7 起票 |
| 6/9-6/12 | 法務 final pass | sitemap.xml + robots.txt 確定 | takedown v1.0 起票 |
| 6/13 | 法務 sign-off（**Marketing 7 日調整窓内**）| organic backlink 5 件確保 | takedown v1.0 凍結 |
| 6/14-6/19 | 法務 待機 | SEO momentum 構築 6 日窓 | takedown 待機 |
| **6/20 09:00 JST** | **公開** | **公開** | **公開（待機）**|

**case-A 法務窓**: 6/13 sign-off → 6/20 公開 = **7 日窓**（baseline 14 日窓 → 7 日窓に半減、ただし致命的影響なし）

### §6.2 case-B（6/13、不採択、参考のみ）タイムライン

| 期日 | 法務調整 | SEO momentum | 取り下げ Runbook |
|---|---|---|---|
| 6/12 | 法務 review v1.0 凍結 = 当日 | SEO meta v1.0 凍結 = 当日 | takedown 起票不可（**窓ゼロ**）|
| **6/13 09:00 JST** | **公開（法務 sign-off 不能）**| **公開（SEO 構築不能）**| **公開（Runbook 不能）**|

**case-B 法務窓**: **0 日**（reject 主因）

### §6.3 fallback 6/27（議決-28 reject 時、現実は採択済）タイムライン

| 期日 | 法務調整 | SEO momentum | 取り下げ Runbook |
|---|---|---|---|
| 6/13 | 法務 sign-off | sitemap 確定 | takedown v1.0 起票 |
| 6/14-6/26 | 法務 待機（13 日窓）| SEO momentum 構築 13 日窓 | takedown 待機 |
| **6/27 09:00 JST** | **公開** | **公開** | **公開（待機）**|

**fallback 法務窓**: 14 日（baseline）

### §6.4 3 case 比較サマリ

| 項目 | case-A 6/20（採択）| case-B 6/13（不採択）| fallback 6/27（dormant）|
|---|---|---|---|
| 公開日 | 2026-06-20（土）09:00 JST | 2026-06-13（土）09:00 JST | 2026-06-27（土）09:00 JST |
| 確度 | 75% | 45% | 92% |
| Marketing 法務窓 | 7 日 | **0 日（NG）**| 14 日 |
| SEO momentum 窓 | 6 日 | **0 日（NG）**| 13 日 |
| 取り下げ Runbook 窓 | 7 日 | **0 日（NG）**| 14 日 |
| drill #2 結果反映窓 | 13 日 | 6 日 | 51 日 |
| 27 placeholder 実測値 CSV 提出期日 | **6/19 朝**（7 日前倒し）| 6/12 朝（14 日前倒し、実測不能）| 6/26 朝 |
| OG image 制作期日 | **6/5**（7 日前倒し）| 6/5（同等）| 6/12 |
| portfolio v3 → v3.1 cell 差分 | 13 cells（4.0%）| 13 cells（同等）| 0 cells（baseline 維持）|
| LP v1.0 → v1.1 行差分 | 5 行（1.0%）| 5 行（同等）| 0 行（v1.0 維持）|
| 5/22 push sign-off 連動条件 | **必須**（軸-A/D 連動）| 必須（極端に厳しい）| 任意（fallback）|

---

## §7. リスク評価 + 緩和策

### §7.1 高リスク（case-A 採択下）

| リスク | 影響 | 緩和策 |
|---|---|---|
| 軸-A 5/22 push sign-off 不成立（35-45% 確度の悲観 case 顕在化）| 6/20 公開不可 → fallback 6/27 発動 | §3 fallback path 完備、巻き戻し手順 5 段階確立 |
| Marketing 法務 review 6/13 NG | 6/20 公開不可 | §3 fallback 6/27 発動、6/13-19 期間で再 review 可能 |
| Web-Ops B staging deploy 6/15 朝までに完遂しない | 6/17 Review pass 不能 → 6/20 公開不可 | Web-Ops B handoff 期日を 6/15 朝に明記、6/13 までに warning 発出条件確立 |
| 27 placeholder 実測値 CSV 6/19 朝提出不能 | placeholder 差替不能 → predicted 値のみで公開（透明性低下）| Marketing-H R15 第 4 波で 6/19 朝までに完遂、6/12 時点で predicted 値で代替表示確立 |

### §7.2 中リスク

| リスク | 影響 | 緩和策 |
|---|---|---|
| OG image 6/5 制作不能 | 公開当日 OG image なし or 簡易版 | 6/5 制作物 v1.1 を baseline、6/12 まで再制作可能、最悪 v1.0（6/27 caption）を `_27` 部分のみ画像編集で 6/20 化 |
| dynamic disclosure card 6 件 + 60 日拡張 4 件の data wiring 失敗 | 公開後 30 日 / 60 日 metric 未反映 | Round 11 Dev-D subscription CLI + Round 13 extraction script 5 件で data 系統既確立、Web-Ops B で data fetch 経路 redundant 化 |
| 60 日運用拡張区間（7/20 → 8/19）で organic traffic 低下 | K3.6 organic_traffic_share_60d 低値 | SEO momentum 構築 6 日窓を最大活用、技術ブログ vol4-6（7/11 / 7/18 / 7/25）公開で SEO momentum 持続 |

### §7.3 低リスク

| リスク | 影響 | 緩和策 |
|---|---|---|
| 6/20 朝 09:00 JST = 土曜公開時の social activity 不確実性 | 公開当日 PV 想定下振れ | DEC-019-026 §3 で確認済（土曜朝 = B2B 中小企業 SNS 滞在時間ピーク）、6/20 も同条件 |
| 28×28 narrative の章区切り 5 / 28 行縦並び CI test 失敗 | 事例ページ §4 表示崩れ | Web-Ops B 実装で `assertLineLength` CI test 既確立、Round 13 portfolio v3 で検証済 |
| 法務調整窓 7 日（baseline 14 日 → 7 日）| Marketing 内部 review 圧縮 | M3 最終締切を 6/12 → 6/8 に 4 日前倒しで Marketing 内部 review 5 日確保 |

---

## §8. DoD 完遂チェック

| 要求事項 | 完遂状況 | 参照 |
|---|---|---|
| ① 6/20 case-A narrative 差分（baseline 6/27 から 7 日前倒し時の差分明示、portfolio / LP / 事例ページ）| ☑ | §1（portfolio v3 13 cells / LP v1.1 5 行 / 事例ページ §3 §5、OG image v1.1、SEO meta）|
| ② 6/13 case-B narrative 差分（baseline からの 14 日前倒し時の薄調整窓のリスク評価）| ☑ | §2（reject 主因 7 項目中 5 項目 NG、議決-28 不採択確定）|
| ③ 6/27 fallback narrative（議決-28 reject 時の元計画維持）| ☑ | §3（dormant fallback path、発動条件 4 件、巻き戻し手順 5 段階）|
| ④ 公開後 30 日運用 → 60 日運用拡張計画（K1-K3 metric 流入 + dynamic disclosure card 連動）| ☑ | §4（30 日 = 既存 6 cards、60 日拡張 = 新規 4 cards、metric 流入 19 → 24 → 28 件）|
| ⑤ Web-Ops B との handoff（HP / LP / 事例ページ / OG image / 取り下げ Runbook）| ☑ | §5（5 系統媒体 handoff item、6/15 朝 staging 着手 / 6/19 朝 placeholder 実測値 / 6/20 09:00 JST 本番公開）|
| ⑥ Marketing 法務調整 + SEO momentum + 取り下げ Runbook の case 別タイムライン | ☑ | §6（3 case 比較サマリ表、case-A 7 日窓 / case-B 0 日窓 / fallback 14 日窓）|

---

## §9. 連動 / 後続

### §9.1 連動文書（既存）

- `marketing-launch-runbook-2026-06-20.md`（Round 8 起票、本書で 6/20 公開反映 update が次工程）
- `marketing-portfolio-18x18.md` v3（Round 13 Marketing-G 完遂、本書 §1.2 で v3.1 差分 13 cells 起票 → Marketing-H R15 第 4 波で v3.1 確定）
- `marketing-launch-narrative-final.md`（28×28 narrative、本書 §1.1 で timeline 起点 6/20 反映）
- `marketing-metric-plan-v1.1.md`（K1-K3 24 KPI、本書 §4 で 60 日拡張 4 件 = K3.6-K3.9 追加 → metric plan v1.2 起票推奨）
- `marketing-round11-dynamic-disclosure-cards.md`（6 cards 設計、本書 §4.1 で 6/20 起点 shift + §4.2 で 60 日拡張 4 cards 追加）
- `marketing-webops-handoff-package.md`（Round 8 起票、本書 §5 で 6/20 公開反映 hand-off タイムライン update）
- `marketing-round13-extraction-portfolio-v3-en.md`（Round 13 Marketing-G、英語版 4,361 words 完遂、本書 §1.2 と整合維持）

### §9.2 後続タスク

- Marketing-H R15 第 4 波: portfolio v3.1（13 cells 差分反映）+ LP v1.1（5 行差分反映）+ HP 段落差替 v1.1 + en v1.1（英語版 6/20 反映）+ Vercel hook + cron + 27 placeholder CSV（**6/19 朝提出**）
- Web-Ops B R15 第 4 波: §5 handoff 仕様反映実装 + Lighthouse 100/100/100/100 + WCAG 2.1 AA + 6/20 09:00 JST 本番公開
- Review-G R15 第 2 波: §1 13 cells 差分の婉曲化 / 開示配分 80/50/100/概要 整合 / JSON-LD 検証 review pass（6/17 段階 2）
- Knowledge-J R15 第 4 波: dynamic disclosure card 60 日拡張 4 cards 設計を `organization/knowledge/patterns/` 配下に蓄積（DEC-019-033 連動）
- CEO 統合 v16: Round 15 完遂後 30-45 min、本書 + R15 全 11 並列着地物を統合報告

### §9.3 議決連動

- 議決-28 Full Pass 確定（軸-B case-A 採択 = 公開 6/20 朝 09:00 JST）= 本書の前提
- 議決-30（5/30 必須 50 = 95%+ 確認 case fallback path）= 本書 §3 fallback 発動条件 1 と連動
- 議決-31（6/13 case-B 公開判定、Owner 追加 directive 受領時）= 本書 §2 case-B reject 補強

---

## §10. Footer

- **発行**: 2026-05-05 議決-28 Full Pass 採択直後（Round 15 第 2 波 Marketing-I 担当）
- **担当**: Marketing-I（独立 Agent dispatch、general-purpose 経由、DEC-019-025 SOP 準拠）
- **位置付け**: 軸-B 加速 case-A 採択を受けた narrative 差分 + 30/60 日運用 + Web-Ops B handoff 確定書、後続 Marketing-H + Web-Ops B + Review-G + Knowledge-J 4 部署の参照基盤
- **行数**: 約 425 行（要求 350-500 行内）
- **絵文字**: 不使用（CLAUDE.md / design-guidelines.md §3 遵守）
- **Heroicons**: 標準採用（Web）/ Ionicons（モバイル）= モバイル UI 参照なし、Web のみ
- **技術スタック**: Next.js 15 App Router + Tailwind + shadcn/ui + Geist Sans/Mono + zinc 系ベース + ライト/ダーク 2 種
- **AI 感を出さないクリーンデザイン**: 維持（ランダムグラデ / グラスモーフィズム / 意味のないアニメーション 全て禁止継続）
- **API 追加コスト**: $0（Read + Edit + Write のみ、Round 15 第 2 波想定値 $0 維持）
- **DoD 完遂**: ① 6/20 case-A 差分 ② 6/13 case-B 差分 + reject 評価 ③ 6/27 fallback ④ 30/60 日運用拡張 ⑤ Web-Ops B handoff ⑥ 法務 + SEO + 取り下げ case 別タイムライン = **6 件全完遂**
- **報告**: 完遂後 CEO 統合 v16 経由（Owner 直接報告は禁止、CLAUDE.md ルール 1 遵守）

---

**END OF Marketing-I R15 完遂レポート**
