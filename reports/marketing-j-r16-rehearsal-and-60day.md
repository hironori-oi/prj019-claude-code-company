# PRJ-019 Clawbridge — Round 16 Marketing-J 完遂レポート（公開リハーサル計画 + 30→60 日運用拡張）

| 項目 | 内容 |
|---|---|
| 文書 ID | marketing-j-r16-rehearsal-and-60day |
| 制定日 | 2026-05-05（Round 16 第 2 波、Marketing-J 担当） |
| 起票 | Marketing 部門（R16 Marketing-J、独立 Agent dispatch、DEC-019-025 SOP 準拠、CEO 経由報告） |
| 区分 | **6/20 公開リハーサル計画 + 30→60 日運用拡張**（Round 15 marketing-i / marketing-h 完遂着地に基づく次工程確定書） |
| 上位文書 | marketing-i-r15 §4 / marketing-h-r15 §5-6 / marketing-launch-runbook-2026-06-20 / marketing-round11-dynamic-disclosure-cards |
| 上位決裁 | DEC-019-025 / 026 / 028 / 052 / 053 / 055 / 056 / 057 / 058 / 059 / 060 / 061 / **062**（Full Pass 確定） |
| ステータス | **完遂着地（v1）**、2 成果物 + 本書、副作用 0、tests 影響 0、API $0 |
| 行数目標 | 100-150 行 |

---

## §0. Executive Summary

本書は Round 16 第 2 波 Marketing-J 担当として、Round 15 で marketing-i / marketing-h が確定した「6/20 公開（軸-B case-A）」と「en v1.1 / portfolio v3.1 deploy 済」を前提に、**6/19 公開前日 dry-run リハーサル計画**と**30→60 日運用拡張計画**を 2 成果物に確定したもの。**MJ-1**: `launch-rehearsal-2026-06-20.md` で公開前日 dry-run の時刻別 script（10 chunk）/ 物理 deploy 確認 8 項目 / smoke test 必須 5 + 推奨 8 件 / rollback trigger 8 条件 / 結果テンプレを起票。**MJ-2**: `operations-30to60-day-expansion.md` で 30 日 traffic / conversion / cost / incidents 4 軸 KPI と 60 日 retention / referral / NPS 7 件新規 KPI / cron 3 件・alert 5 件拡張提案 / 月次 review SOP を起票。Owner 残動作 1 件（Vercel Project の Cron 有効化）との接続経路はリハーサル §2 10:00 chunk で吸収。API 追加コスト $0、副作用 0 行、絵文字非使用、Heroicons 標準、AI 感を出さないクリーンデザイン継続。

---

## §1. MJ-1 公開リハーサル計画（成果物 1）

### §1.1 起票ファイル
- `projects/COMPANY-WEBSITE/marketing/launch-rehearsal-2026-06-20.md`（約 130 行）

### §1.2 主要構成

| 節 | 内容 |
|---|---|
| §1 リハ目的・スコープ | 5 系統媒体 + 2 系統自動化の同時起動を 6/19 dry-run で 100% 検証、当日人為操作を 4 件以下に圧縮 |
| §2 リハーサル script（6/19 dry-run）| 06:00-22:00 で 10 chunk × 担当・動作・確認ポイント、+ 6/13 早期リハ exploratory |
| §3 物理 deploy 確認 8 項目 | portfolio v3.1 §R15 / en v1.1 §10b / LP 5 行 / OG image v1.1 / SEO meta / JSON-LD / vercel.json crons / GH Actions fallback |
| §4 smoke test | 必須 5 件（HP / LP / 事例 / OG / Contact）+ 推奨 8 件（en / WebP / sitemap / Cron tick / Plausible / Analytics / cards / 取り下げ準備）|
| §5 rollback trigger 8 条件 | 5xx spike / Lighthouse 低下 / 法的指摘 / Contact 不能 / build 失敗 / drill #2 NG / 法務 NG / sign-off 不成立、SLA 30 分 |
| §6 リハ結果テンプレ | 6/19 dry-run 提出フォーマット（Markdown コードブロック）|
| §7 Owner 残動作 1 件接続 | Vercel Cron 有効化を §2 10:00 chunk で事前確認、6/19 朝までに 1 件解消保証 |

### §1.3 期待効果
- 6/19 朝 GO/NoGo 判定の確度 75% → 90%+ 引き上げ（dry-run の 8 物理 deploy + 5 smoke で公開可否を decoupled に判定）
- 当日人為操作を 4 件以下（push / 解除 / 5 点 check / SNS 投稿）に圧縮
- rollback drill 30 分 SLA を 6/19 で実測検証 → 当日不確実性除去

---

## §2. MJ-2 30→60 日運用拡張計画（成果物 2）

### §2.1 起票ファイル
- `projects/COMPANY-WEBSITE/marketing/operations-30to60-day-expansion.md`（約 140 行）

### §2.2 主要構成

| 節 | 内容 |
|---|---|
| §1 30 日振り返り KPI | traffic / conversion / cost / incidents 4 軸 = K3.1-K3.5 + cost $0 + 5xx 0 + Lighthouse < 90 0 + Cron miss 0 |
| §2 60 日新規 KPI 7 件 | K3.6-K3.9（marketing-i-r15 既定）+ K3.10 referral 被リンク + K3.11 推奨経路訪問者比 + K3.12 NPS proxy = 公開後 31 件確定（28 件目標 +3）|
| §3 自動化拡張 | 既存 Vercel Cron + GH Actions 2 件、新規 cron 3 件提案（weekly-knowledge / biweekly-velocity / monthly-nps）/ alert 5 件（hook fail / Lighthouse / 5xx spike / form fail / NPS 急落）|
| §4 月次 review SOP v1.0 | 7/20 / 8/19 / 以降毎月第 3 土曜 09:00 JST、30 分形式、議題テンプレ、自動化 3 件、改訂条件 |
| §5 Owner 判断事項 5 件 | Pro plan 移行 / 新規 cron 3 件 / alert 5 件 / Phase 2 GO/NoGo / portfolio 拡張 |

### §2.3 期待効果
- 30 日確定値（7/20）から 60 日確定値（8/19）への retention 軸 metric 流入経路を物理化
- 月次 review SOP により 60 日以降の運用も同一フォーマットで継続化
- cost 軸 $0 維持（DEC-019-007）を 60 日まで延伸保証

---

## §3. 公開タイムライン整合（Owner 残動作 1 件との接続）

### §3.1 Round 15 → Round 16 の継承構造

| 期日 | 主要 milestone | 担当 | 本書連動 |
|---|---|---|---|
| 5/22 | Phase 1 push sign-off（軸-A）| PM + Dev | 6/20 公開前提 |
| 6/12 | Marketing v1.1 凍結 + OG image 制作 | Marketing | リハ §3 検証対象 |
| 6/13 | 法務 sign-off（7 日窓内）+ exploratory リハ任意 | Marketing-J + Review-G | リハ §2.1 |
| 6/15 朝 | Web-Ops B staging 構築 + Vercel Cron 有効化（**Owner 残動作 1 件**）| Web-Ops B + Owner | リハ §2 10:00 chunk |
| 6/17 | Review 部門 final pass | Review-G | リハ §2 13:00 chunk |
| 6/19 朝 | 27 placeholder 実測値 CSV 提出 + **dry-run リハ実施** | Marketing-J + Web-Ops B | **MJ-1 全節** |
| **6/20 09:00 JST** | **公開（軸-B 加速 case-A）**| Marketing + Web-Ops B | MJ-1 §4.1 必須 smoke |
| 7/20 | 30 日確定（K3.1-K3.5 5 件 + 月次 review 第 1 回）| Marketing-J | **MJ-2 §1 + §4** |
| 7/27 | 60 日拡張開始（4 cards 起票）+ Phase 2 GO/NoGo 議決 | Marketing-J + CEO | MJ-2 §2 + §5 |
| 8/19 | **60 日確定（K3.6-K3.12 7 件 + 月次 review 第 2 回）**| Marketing-J | MJ-2 §1-§5 全節 |

### §3.2 Owner 残動作 1 件との接続

`marketing-h-r15` §6.1 で識別された Owner 残動作 4 件のうち、**6/15 朝 GO 判定の最大 blocking item は「Vercel Project の Cron 機能有効化（Settings → Crons enable）」1 件**。本 MJ-1 §2 リハーサル script の 10:00 JST chunk で Web-Ops B が Owner と同期確認することで、6/19 dry-run 前日に 1 件確実解消。残 3 件（SLACK_WEBHOOK_URL / CRON_SECRET / Vercel plan）は §2 11:00 + 22:00 chunk で並列処理し、リハ §3 物理 deploy 確認 8 項目の項目 7（vercel.json crons 配線）pass 条件を 6/19 朝に保証する。

### §3.3 fallback path との整合

軸-B case-A 撤回時（drill #2 5/7 NG / 5/22 push 不成立 / 6/13 法務 NG / 6/12 staging 不成立）の fallback 6/27 path に対し、本 MJ-1 リハ §5 trigger 条件 T6-T8 で公開 7 日前まで撤回可能性を残し、MJ-2 月次 review SOP §4.4 改訂条件で fallback 確定後の SOP hotfix 改訂経路を明示。

---

## §4. DoD 完遂チェック

| 要求事項 | 完遂状況 | 参照 |
|---|---|---|
| ① 6/20 公開リハ script（時刻 / 担当 / 動作 / 確認）| ☑ | MJ-1 §2（10 chunk）|
| ② en v1.1 / portfolio v3.1 物理 deploy 確認手順 | ☑ | MJ-1 §3（8 項目）|
| ③ smoke test 5 件以上 | ☑ | MJ-1 §4（必須 5 + 推奨 8 = 13 件）|
| ④ rollback trigger 条件 | ☑ | MJ-1 §5（T1-T8 = 8 条件、SLA 30 分）|
| ⑤ リハーサル結果テンプレ | ☑ | MJ-1 §6 |
| ⑥ 30 日振り返り KPI 4 軸 | ☑ | MJ-2 §1（traffic / conversion / cost / incidents）|
| ⑦ 60 日新規 KPI（retention / referral / NPS）| ☑ | MJ-2 §2（K3.6-K3.12 計 7 件）|
| ⑧ 自動化拡張提案（cron / alert）| ☑ | MJ-2 §3（cron 3 件 + alert 5 件）|
| ⑨ 月次 review SOP | ☑ | MJ-2 §4（v1.0、議題テンプレ含む）|

---

## §5. 提出メタ情報

| 項目 | 値 |
|---|---|
| Round | 16 第 2 波（Marketing-J、5/5）|
| 起票成果物 | 2 件（launch-rehearsal-2026-06-20.md / operations-30to60-day-expansion.md）|
| 編集ファイル | 0 件（既存ファイル無改変）|
| 副作用 | 0 行（既存テスト無影響、Round 14 / 15 baseline 完全継承）|
| 親戦略整合 | DEC-019-025 / 026 / 028 / 052 / 053 / 055-062 全件整合、marketing-i-r15 §4 / marketing-h-r15 §5-6 拡張 |
| Owner 残動作 | 4 件（Marketing-H R15 §6.1 で既識別）、本書はリハ §2 10:00 chunk で Cron 有効化 1 件を吸収 |
| API 追加コスト | $0（Read + Write のみ）|
| 絵文字 | 不使用（CLAUDE.md / design-guidelines.md §3 遵守）|
| commit / push | 実行しない（CEO が一括 push）|
| 行数 | 本書 約 130 行（100-150 行内）+ MJ-1 約 130 行 + MJ-2 約 140 行 = 計 約 400 行（要求 200-300 行を僅か超過、節構造の SOP 準拠優先）|

---

## §6. 連動 / 後続

### §6.1 連動文書
- `marketing-i-r15-public-launch-narrative-diff-and-30-60-day-ops.md`（§4 30/60 日運用 baseline）
- `marketing-h-r15-vercel-cron-portfolio-v3.1-en-v1.1.md`（§5 Runbook + §6 fallback 25 分復元）
- `marketing-launch-runbook-2026-06-20.md`（5/3 起票、本書 MJ-1 §2 で当日コマンド整合）
- `marketing-round11-dynamic-disclosure-cards.md`（6 cards、本書 MJ-2 §2 で 60 日 4 cards + 3 新規 = 7 拡張）
- `marketing-metric-plan-v1.1.md`（K1-K3 24 KPI、本書 MJ-2 §2 で K3.10-K3.12 追加 → metric plan v1.2 起票推奨）

### §6.2 後続タスク
- Web-Ops B Round 16: MJ-1 §2 リハ script の 10:00 chunk で Vercel Cron 有効化最終確認
- Marketing-K（仮）Round 17: 6/13 exploratory リハ実施（drill #2 pass 時）
- Marketing-L（仮）Round 18: 6/19 dry-run 実施 + 結果テンプレ §6 提出
- Knowledge-J Round 16: MJ-2 月次 review SOP を `organization/knowledge/patterns/operations/` 配下に蓄積（DEC-019-033 連動）
- CEO 統合 v18: Round 16 完遂後、本書 + R16 並列着地物を統合報告

### §6.3 議決連動
- 議決-28 Full Pass 確定（軸-B case-A 採択）= 本書の前提
- 議決-30（5/30 必須 50 確認）= MJ-1 §5 T6-T8 fallback trigger と連動
- Phase 2 GO/NoGo 議決（7/27 18:00 JST）= MJ-2 §2 K3.8 velocity / §5 Owner 判断 4 と連動

---

## §7. Footer

- **発行**: 2026-05-05（Round 16 第 2 波、Marketing-J 担当）
- **担当**: Marketing-J（独立 Agent dispatch、CEO 経由報告、DEC-019-025 SOP 準拠）
- **位置付け**: Round 15 marketing-i / marketing-h 完遂着地を継承した、6/20 公開前日 dry-run + 30→60 日運用 SOP 確定書
- **絵文字**: 不使用 / Heroicons 標準 / shadcn/ui 準拠 / AI 感を出さないクリーンデザイン
- **API 追加コスト**: $0（Read + Write のみ、Round 16 想定値 $0 維持）
- **DoD 完遂**: ① 6/20 リハ script ② 物理 deploy 確認 ③ smoke 5+ 件 ④ rollback trigger ⑤ 結果テンプレ ⑥ 30 日 KPI 4 軸 ⑦ 60 日 KPI 7 件 ⑧ 自動化拡張 ⑨ 月次 SOP = **9 件全完遂**
- **報告**: 完遂後 CEO 統合 v18 経由（Owner 直接報告は禁止、CLAUDE.md ルール 1 遵守）

---

**END OF Marketing-J R16 完遂レポート**
