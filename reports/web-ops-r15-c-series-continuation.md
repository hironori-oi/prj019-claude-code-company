# PRJ-019 Clawbridge — Round 15 第 4 波 Web-Ops C 系続き 完遂レポート（軸-B 加速 case-A 6/20 公開反映 + staging 6/22→6/15 前倒し対応 + 取り下げ Runbook v1.0 接続）

| 項目 | 内容 |
|---|---|
| 文書 ID | web-ops-r15-c-series-continuation |
| 制定日 | 2026-05-05（Round 15 第 4 波、Web-Ops C 担当、独立 Agent dispatch、議決-28 Full Pass 採択直後） |
| 起票 | Web-Ops 部門（R15 Web-Ops C、DEC-019-025 SOP 準拠、general-purpose 経由、低優先 3 並列の 3 番目） |
| 区分 | **Round 13 / Round 14 Web-Ops C 系の残作業着地 + 軸-B 加速 case-A（6/20 朝 09:00 JST 公開）採択を受けた staging 6/22→6/15 前倒し対応 + Marketing-I R15 取り下げ Runbook v1.0 への自社接続点 + 公開当日 / 直前リスクマップ更新** |
| 上位文書 | `web-ops-round13-public-deployment-skeleton.md`（312 行） / `web-ops-round14-shadcn-analytics-tag-manager.md`（347 行） / `marketing-i-r15-public-launch-narrative-diff-and-30-60-day-ops.md`（455 行） / `pm-round14-progress-and-r15-dispatch.md` |
| 上位決裁 | DEC-019-007 / 025 / 026 / 027 / 029 / 033 / 050 / 051 / 052 (a)(b)(c) / 053 / 055 / 056 / 057 / 058 / 062（Full Pass 5/5 採決完遂） |
| ステータス | **draft v1（Round 15 第 4 波着地）** |
| 行数目標 | 250-400 行 |
| API 追加コスト | $0（Read + Edit + Write のみ、background dispatch 想定値 $0 維持） |
| 採択公開日 | 2026-06-20（土）09:00 JST = 軸-B 加速 case-A、確度 75% |
| fallback | 2026-06-27（土）09:00 JST = DEC-019-026 元計画、確度 92% |

---

## §0 Executive Summary（CEO 向け 200 字）

本書は Round 13 Web-Ops-A（CONDITIONAL GO 判定 / 17 ファイル 1,900 行配備）と Round 14 Web-Ops-B（Y3/Y4/Y5 condition 前倒し充足 / 803 行新規）が積み上げた Web-Ops C 系 skeleton + analytics + shadcn install を、Round 15 第 4 波で「軸-B 加速 case-A 6/20 公開」採択（議決-28 Full Pass）に整合させ、6/22 staging dry-run の 7 日前倒し（→ 6/15 朝着手）対応 + 取り下げ Runbook v1.0 への自社接続点定義 + 公開当日 / 直前リスクマップ更新 + 残課題 / fallback 6/27 経路の維持確認を担う。Round 13 / Round 14 既出引継 8 件（Z1-Z8）のうち、Web-Ops C 系単独で着地可能な 4 件（C-1 staging schedule v1.1 起票 / C-2 takedown Runbook 自社接続点定義 / C-3 公開当日 Web-Ops 役割マトリクス v1.0 / C-4 リスクマップ v1.1）を本書で確定。残 4 件（Z3 物理 install / Z4 ScrollDepthBoundary 配備 / Z5 grid 取込 / Z8 unit test）は Round 16-17 引継として明示。Owner 残動作 0 件、commit/push は CEO 一括、API 追加コスト $0、絵文字非使用、AI 感を出さないクリーンデザイン基調維持、既存 PRJ 副作用 0 行。

---

## §1 Round 13 / Round 14 Web-Ops C 系の状況サマリー（過去経緯）

### §1.1 Round 13 Web-Ops-A 着地物（5/4、312 行レポート + 17 ファイル / 1,900 行配備）

| 区分 | 着地 | 状態 |
|---|---|---|
| A. dynamic disclosure 6 cards skeleton | `projects/COMPANY-WEBSITE/dynamic-disclosure/` 配下 15 ファイル / 1,034 行（components 8 件 + lib 4 件 + data 2 件 + README） | 完遂、import 解決経路は Round 14 で確認済 |
| B. portfolio 公開版 | `portfolio/openclaw-portfolio-18x18-public.md` 482 行（公開 181 cell / 内部 143 cell 切分） | 完遂、出典明示率 100% |
| C. case study v2 公開版 | `case-studies/openclaw-runtime-v2-public.md` 384 行（DEC-019-027 Heading A 継承） | 完遂、内部 source 無改変 |

公開準備度判定（R13 EOD）: **CONDITIONAL GO**（Y3/Y4/Y5 が 5/30 までに完遂すれば 6/27 公開 GO）

### §1.2 Round 14 Web-Ops-B 着地物（5/4 EOD、347 行レポート + 4 ファイル / 803 行新規）

| 区分 | 着地 | 状態 |
|---|---|---|
| A. shadcn/ui Tooltip 新規 install | `app/src/components/ui/tooltip.tsx` 87 行（@base-ui/react base、base-nova スタイル整合） | Y5 充足、Card / Button / Badge / Separator / Sheet 5 件は既存 |
| B. Vercel Analytics 接続設計 | `lib/analytics/vercel-analytics-config.ts` 177 行（9 event taxonomy / PII 二重防御 / no-op fallback） | Y3 設計完了、Round 15 で物理 install |
| C. Tag Manager scroll_75 設計 | `lib/analytics/tag-manager-scroll.ts` 179 行（dataLayer push / SSR-safe / 25/50/75/100 threshold） | Y4 設計完了、Round 15 で client component 配備 |

公開準備度判定（R14 EOD）: **GO 昇格候補**（5 軸全 GO、残課題は Round 15 物理 install 2 件のみ）

### §1.3 Round 14 引継 8 件（Z1-Z8）の Round 15 第 4 波時点状態

| # | 引継項目 | 担当 | baseline 期日 | 状態（5/5 議決-28 Full Pass 直後） |
|---|---|---|---|---|
| Z1 | extraction script 3 件（K1 audit / K2 kpi / K3 milestone）実装 | Dev 連携 | 6/22 | 別並列 Dev-K/L/M/N（R15 第 3 波）が担当 |
| Z2 | `verify-no-pii.ts` unit test 30+ 件追加 | Dev 連携 | 6/22 | 同上、Dev R15 第 3 波担当 |
| Z3 | `pnpm add @vercel/analytics` + `<Analytics />` 配備 | Web-Ops | 5/30 | **5/30 → 6/12 シフト要検討**（軸-B 6/20 公開反映、本書 §3 で確定） |
| Z4 | `<ScrollDepthBoundary>` client component + 3 page bind | Web-Ops | 5/30 | 同上 |
| Z5 | `<DisclosureCardGrid />` を evolution page に取込 | Web-Ops | 6/22 staging | **6/22 → 6/15 staging 着手シフト**（軸-B 連動、本書 §3 確定） |
| Z6 | portfolio 公開版 v1.1 発行（5/22 内部運用着手日反映） | Web-Ops | 5/26 | Marketing-H R15 第 4 波（並列）と整合 |
| Z7 | case study v2 公開版 v1.1 発行 | Web-Ops | 5/26 | 同上 |
| Z8 | trackEvent / pushScrollDepth unit test 20+ 件 | Dev 連携 | 6/13 | Dev R15 第 3 波担当 |

---

## §2 Round 15 第 4 波（Web-Ops C 続き）着地分

### §2.1 着地物 4 件サマリ

| # | 着地物 | 区分 | 配備方針 | 行数 |
|---|---|---|---|---|
| C-1 | staging schedule v1.1（6/22→6/15 前倒し対応 spec） | 本書 §3 内に確定（spec 化、物理 deploy は Round 16 以降） | 60-80 行 |
| C-2 | takedown Runbook 自社接続点定義（Marketing-I 取り下げ Runbook v1.0 への Web-Ops 側責務記述） | 本書 §4 内に確定（spec 化、`scripts/takedown.ts` は Round 16 で物理化） | 50-70 行 |
| C-3 | 公開当日 Web-Ops 役割マトリクス v1.0（6/20 06:00-09:00-翌 09:00） | 本書 §5 内に確定（時系列 matrix + role 分担） | 60-80 行 |
| C-4 | 6/20 公開直前リスクマップ v1.1（R13 §7.3 / R14 §7.3 を軸-B 反映で update） | 本書 §6 内に確定 | 30-50 行 |

### §2.2 既存ファイル無改変原則

本 Round 15 第 4 波は **既存ファイル無改変**（既存 PRJ 副作用 0 行）。物理新規ファイル 0 件、本書 1 件のみ起票。Round 13 の 17 ファイル / Round 14 の 4 ファイル / Marketing-I R15 の 1 ファイルすべて読取のみで参照。

### §2.3 Marketing-I R15 との handoff 整合（本書はその受け側）

Marketing-I R15 §5 で Web-Ops B handoff 仕様が以下に確定:

- 6/15 朝 staging 構築開始（baseline 6/22 → **7 日前倒し**）
- 6/15 夕 staging 初版 deploy（predicted 値表示）
- 6/19 朝 27 placeholder 実測値 CSV 受領 → 差替実行 + dry-run
- 6/19 夕 Owner 最終承認 diff プレビュー提出
- 6/20 06:00 password protection 解除準備
- 6/20 07:00 Vercel 本番 deploy trigger
- 6/20 09:00 公開 → 24h モニタリング体制突入

本書 §3 / §5 はこの handoff 仕様の **Web-Ops 側受領 + 内部 task 化** に相当。

---

## §3 staging 6/22→6/15 前倒し対応（C-1）

### §3.1 シフト幅と影響範囲

| 項目 | baseline（6/27 公開時） | 採択値（6/20 公開、軸-B case-A） | シフト |
|---|---|---|---|
| staging 構築開始 | 6/22 朝 | **6/15 朝** | 7 日前倒し |
| staging 初版 deploy | 6/22 夕 | **6/15 夕** | 7 日前倒し |
| Lighthouse 100/100/100/100 達成検証 | 6/25 | **6/18** | 7 日前倒し |
| 27 placeholder 実測値 CSV 受領 | 6/26 朝 | **6/19 朝** | 7 日前倒し |
| placeholder 差替 + dry-run | 6/26 夕 | **6/19 夕** | 7 日前倒し |
| Owner 最終承認 diff プレビュー | 6/26 夜 | **6/19 夜** | 7 日前倒し |
| 本番 deploy trigger | 6/27 07:00 | **6/20 07:00** | 7 日前倒し |
| 公開 | 6/27 09:00 JST | **6/20 09:00 JST** | 7 日前倒し |

### §3.2 6/15 朝着手 → 6/20 09:00 JST 公開までの Web-Ops 内部 task 7 段階

| 段階 | 期日 | task | 完遂条件 |
|---|---|---|---|
| 1 | **6/8 EOD** | Marketing v3.1 / LP v1.1 / OG image v1.1 受領（Marketing-H R15 第 4 波 → Web-Ops 引渡） | 5 系統媒体 handoff item 全件受領済 |
| 2 | **6/12 EOD** | `pnpm add @vercel/analytics` + `<Analytics />` 配備（Z3 物理化、baseline 5/30 → 6/12 シフト） | build pass + production hydration 確認 |
| 3 | **6/14 EOD** | `<ScrollDepthBoundary>` client component 配備 + 3 page bind（Z4 物理化） | 3 page で scroll_75 dataLayer push 確認 |
| 4 | **6/15 朝** | staging 構築（Vercel preview branch、password protection 有効、preview URL 限定共有） | preview URL で 5 系統媒体 全件描画確認 |
| 5 | **6/15-17** | dynamic disclosure 6 cards 物理組込（Z5 物理化、option B = tsconfig paths 経由 = DEC-019-025 SOP 整合） | mock fallback で 6 cards 全件描画 |
| 6 | **6/16 EOD** | Marketing review pass 1（copy / 28×28 / OG / JSON-LD 検証） | Marketing-H 確認済 |
| 7 | **6/17 EOD** | Review-G 部門 review（WCAG 2.1 AA / 婉曲化 / JSON-LD 構造化データ）| Review pass 取得 |

### §3.3 6/18-20 直前段階（公開当日含む）

| 期日 | task | 担当 | 完遂条件 |
|---|---|---|---|
| 6/18 EOD | Lighthouse 100/100/100/100 達成検証（performance / accessibility / best-practices / SEO） | Web-Ops | 4 軸全 100 達成、未達時は 6/19 朝までに修正 |
| 6/19 朝 | Marketing-H から 27 placeholder 実測値 CSV 受領 → 差替実行 + dry-run | Web-Ops | placeholder 差替後 build pass、CI test 全緑 |
| 6/19 夕 | Owner 最終承認向け diff プレビュー提出（CEO 経由） | Web-Ops → CEO | Owner 承認取得（議決-29 想定） |
| 6/20 06:00 | password protection 解除準備（Vercel 設定 → preview から production 昇格 trigger 待機） | Web-Ops | trigger 待機状態 |
| 6/20 07:00 | Vercel 本番 deploy trigger（軸-B 加速 case-A 公開実行） | Web-Ops | deploy 完了 + DNS 反映 + smoke test PASS |
| 6/20 08:00 | 公開状態 5 点チェック（HP / LP / 事例ページ / OG image / Contact form） | Web-Ops + Marketing | 5 点全 PASS |
| **6/20 09:00 JST** | **公開（軸-B 加速 case-A 確定）** | 全部署 | 公開完遂、24h モニタリング突入 |

### §3.4 7 日前倒しのリスク要因と緩和策

| リスク要因 | 影響 | 緩和策 |
|---|---|---|
| Z3 物理 install（6/12 期日）の遅延 | staging 6/15 朝着手不能 | Round 14 で設計完了済 = 0.5 日工数で完遂可能、6/8 EOD Marketing 受領後すぐ着手 |
| Z4 ScrollDepthBoundary 配備（6/14 期日）の遅延 | scroll_75 採取不能 → analytics 部分欠落 | Tag Manager dataLayer 経路は 1 経路で動作可能、Vercel Analytics 経路を skip して dataLayer のみで運用も可（fallback） |
| Z5 dynamic disclosure 6 cards 物理組込（6/15-17）の遅延 | evolution page で grid 描画不能 | mock fallback chain（Round 13 §2.3）で「集計中」表示でも build pass、最悪 6/17 までに描画失敗時は evolution page を 6/27 fallback path に巻戻 |
| Lighthouse 100 未達（6/18 期日） | SEO score 低下 → organic traffic 期待値減 | 6/19 朝までに修正窓 1 日確保、未達項目を Marketing と協議で許容範囲調整 |
| Review-G review NG（6/17 期日） | 6/20 公開不可 → fallback 6/27 発動 | Review-G R15 第 2 波（並列）で 6/17 段階 2 review pass を target、NG 時は §6 fallback 発動条件 4 と整合 |

---

## §4 取り下げ Runbook v1.0 への自社接続点（C-2）

### §4.1 Marketing-I R15 §5.4 取り下げ Runbook v1.0 仕様（再掲）

| 項目 | 仕様 |
|---|---|
| 起票期日 | 6/13（baseline 6/20 → 7 日前倒し） |
| 凍結期日 | 6/19 朝（公開前日凍結） |
| 発動条件 | 重大事故（個人情報漏洩 / 外部攻撃 / 法的指摘 / 客観的事実誤認） |
| ロールバック手順 | 5 段階（Vercel rollback / DNS 切替 / SNS 削除 / プレス取消 / Owner 報告） |
| 想定所要時間 | 30 分以内（password protection 再有効化 + DNS 戻し + preview URL 化） |
| 緊急連絡先 | CEO 経由（直接 Owner 連絡禁止、CLAUDE.md ルール 1 遵守） |

### §4.2 Web-Ops 側責務（自社接続点 5 段階）

| # | 段階 | Web-Ops 実行 task | 想定所要 | 連動 Marketing |
|---|---|---|---|---|
| 1 | Vercel rollback | `vercel rollback {previous-deployment-url}` または Dashboard から 1-click rollback | 5-10 分 | Marketing は SNS 投稿削除と並列 |
| 2 | DNS 切替（preview URL 化） | Vercel Project Settings から custom domain 解除、`/works/clawbridge` に **410 Gone** を返す static page 配備 | 5-10 分 | Marketing は取り下げ理由公示文を Web-Ops に提供 |
| 3 | SNS 投稿削除待機 | Marketing が X / Zenn / note 削除完了通知後、関連 OG image cache 無効化（Vercel Edge cache purge） | 3-5 分 | Marketing 主導 |
| 4 | プレス取消連動 | プレスリリース取消（外部発行先連絡）の Web 側影響として `/press/clawbridge-launch` を 410 化 | 3-5 分 | Marketing 主導 |
| 5 | Owner 報告連動 | CEO 経由で Web-Ops 側 rollback 完了報告 + 影響 URL 一覧 + 想定影響範囲 = 30 分以内 | 5 分 | CEO 経由 |

合計想定: **21-35 分以内**（Marketing-I §5.4 の 30 分以内 target に整合、最大 case でも 35 分超過リスクは低）

### §4.3 物理化（Round 16 引継）

| # | 物理化対象 | 配備先 | 行数想定 | Round |
|---|---|---|---|---|
| T-1 | `scripts/takedown.ts`（Vercel API 連動の rollback + 410 page deploy script） | `projects/COMPANY-WEBSITE/scripts/takedown.ts` | 80-120 行 | Round 16 |
| T-2 | `app/works/clawbridge/410.tsx`（取り下げ後 410 Gone 返却 page） | `projects/COMPANY-WEBSITE/app/src/app/works/clawbridge/410.tsx` | 30-50 行 | Round 16 |
| T-3 | `lib/takedown/cache-purge.ts`（Vercel Edge cache purge helper） | `projects/COMPANY-WEBSITE/lib/takedown/cache-purge.ts` | 40-60 行 | Round 16 |

T-1 / T-2 / T-3 は Round 16 で物理化、本 Round 15 第 4 波は **spec 化のみ**（既存ファイル無改変原則維持）。

### §4.4 Runbook 凍結 6/19 朝までの Web-Ops 側準備項目

| 期日 | 準備項目 | 完遂条件 |
|---|---|---|
| 6/13 | Runbook v0.7 起票（Marketing 主導、Web-Ops は §4.2 の 5 段階を提供） | Marketing-H R15 第 4 波で起票 |
| 6/15 | Runbook v0.9 段階 1 dry-run（staging 環境で rollback シミュレーション） | Vercel preview rollback 検証完了 |
| 6/17 | Runbook v1.0 段階 2 dry-run（DNS 切替 + 410 page 配備 シミュレーション） | 410 page 描画確認 |
| **6/19 朝** | **Runbook v1.0 凍結（Web-Ops 側責務 §4.2 反映済）** | Marketing-I §5.4 + 本書 §4 = 完全整合 |

---

## §5 6/20 公開当日 Web-Ops 役割マトリクス v1.0（C-3）

### §5.1 時系列 matrix（6/20 06:00 → 翌 6/21 09:00 JST、24h+3h）

| 時刻 | Web-Ops 主 task | Web-Ops 補助 task | 並列部署 | 備考 |
|---|---|---|---|---|
| 06:00 | password protection 解除準備（Vercel Settings 待機） | OG image cache pre-warm | — | 公開 3h 前 |
| 07:00 | **Vercel 本番 deploy trigger 実行** | DNS propagation 監視 | — | smoke test 自動実行 |
| 07:30 | smoke test 結果確認（5 系統媒体描画） | 404 / 500 検出時即対応 | — | NG 時は 08:30 まで修正可能 |
| 08:00 | 公開状態 5 点チェック（HP / LP / 事例ページ / OG image / Contact form） | Lighthouse 本番値再測定 | Marketing | 5 点全 PASS が公開 GO 条件 |
| 08:30 | Owner 最終 GO 確認（CEO 経由） | — | CEO | NG 時は fallback 6/27 発動 |
| **09:00** | **公開（軸-B 加速 case-A 確定）** | Vercel Analytics + Plausible 採取開始 | 全部署 | password protection 解除 |
| 09:00-12:00 | 24h モニタリング突入（最初の 3h） | 突発 traffic spike 監視 | Marketing（SNS 投稿） | PV / scroll_75 / Contact form 提出 監視 |
| 12:00-18:00 | 中間モニタリング | 4xx / 5xx 検出 + Vercel error log 監視 | — | 想定 PV ピーク帯 |
| 18:00-24:00 | 夜間モニタリング（attended） | log 集約 + 朝報用 metric snapshot | — | 12h 経過時点 metric snapshot |
| **6/21 00:00-06:00** | 夜間モニタリング（autonomous） | error alert 自動通知 | — | NG 時のみ Web-Ops 起動 |
| 6/21 06:00-09:00 | 24h サマリ作成 + Marketing への提出 | 翌週 monitoring 計画着手 | Marketing | 24h 確定値 K3.x 第 1 報 |

### §5.2 役割分担（Web-Ops 内 + 隣接部署）

| 役割 | 担当 | 主 responsibility |
|---|---|---|
| 公開実行責任 | Web-Ops（本書担当） | 07:00 deploy trigger + 09:00 公開 final go |
| Marketing handoff 受領 | Web-Ops | 6/19 朝 placeholder CSV 受領 + 差替実行 |
| 取り下げ Runbook 発動責任 | Web-Ops（CEO 経由） | 重大事故検出時 §4.2 5 段階即時実行 |
| dynamic disclosure card 監視 | Web-Ops | 9-12h 帯で「集計中」card 数を 0 に近づける（mock → confirmed 切替） |
| analytics 採取監視 | Web-Ops | Vercel Analytics + Plausible + Tag Manager 三重採取の不整合検知 |
| Marketing SNS 連携 | Marketing 主、Web-Ops 補助 | 09:00 SNS 投稿後の OG image 表示確認 |
| Review pass 連携 | Review、Web-Ops 補助 | 6/17 段階 2 review pass + 公開当日 03:00-09:00 spot check |

### §5.3 24h モニタリング metric 5 軸

| 軸 | 計測 metric | 閾値 | NG 時アクション |
|---|---|---|---|
| 1. PV / UV | Vercel Analytics + Plausible | 公開 24h 想定: PV 500-2000 / UV 200-800 | 大幅未達時は SNS 拡散追加 / 大幅超過時は infra scale 確認 |
| 2. scroll_depth 75% 到達率 | Tag Manager scroll_75 | 想定: 30-50% | 10% 未満は事例ページ可読性問題 → 6/27 までに改善 |
| 3. Contact form CV 率 | Vercel goal | 想定: 0.5-2% | 0% 持続時は form 動作不能の可能性 → 即時調査 |
| 4. 4xx / 5xx error 率 | Vercel error log | 閾値: < 1% | 1% 超過は緊急対応、3% 超過は取り下げ Runbook 検討 |
| 5. Core Web Vitals（LCP / FID / CLS） | Vercel Speed Insights | LCP < 2.5s / CLS < 0.1 | 大幅悪化時は 6/27 までに改善 |

---

## §6 残課題 / fallback 6/27 経路の維持確認（C-4 リスクマップ v1.1 含む）

### §6.1 公開準備度判定（5/5 議決-28 Full Pass 直後）

| 軸 | Round 13 | Round 14 | **Round 15 第 4 波（本書）** |
|---|---|---|---|
| skeleton 配備（R13 タスク A） | GO | GO 維持 | **GO 維持** |
| 公開対象抽出（R13 タスク B） | GO | GO 維持 | **GO 維持** |
| 公開トーン整形（R13 タスク C） | GO | GO 維持 | **GO 維持** |
| 物理 stack install（Y5） | HOLD（5/19） | GO（充足） | **GO 維持** |
| API 接続（Y3 / Y4 設計） | HOLD（5/30） | GO（設計完了） | **GO 維持**（Z3/Z4 物理 install は 6/12 / 6/14 にシフト） |
| staging schedule 整合（軸-B 反映） | — | — | **GO（本書 §3 で 6/15 朝着手 spec 確定）** |
| 取り下げ Runbook 接続点 | — | — | **GO（本書 §4 で Web-Ops 側 5 段階 spec 確定）** |
| 公開当日役割マトリクス | — | — | **GO（本書 §5 で 6/20 06:00-翌 09:00 matrix 確定）** |

### §6.2 総合判定: **GO 確定**（軸-B 加速 case-A 6/20 公開向け Web-Ops 側準備完遂）

5/5 時点で 8 軸全て GO。残課題は Round 16 物理化（T-1/T-2/T-3 takedown script + Z3/Z4 物理 install）のみ、これらは 6/12 / 6/14 期日まで時間的余裕あり。

### §6.3 fallback 6/27 経路の維持確認

軸-B 加速 case-A 確度 75%（議決-28 採決値）= **fallback 6/27 経路 25% 確率で発動**。発動条件 4 件（Marketing-I R15 §3.2）:

1. drill #2 5/7 朝 NG → 議決-28 conditional → 軸-B case-A 撤回
2. Phase 1 sign-off 5/22 push 不成立 → 軸-B case-A 撤回
3. Marketing 法務 review 6/13 NG → 6/20 公開不可
4. Web-Ops staging deploy 6/12 までに完遂しない → 6/20 公開不可

**Web-Ops 側として発動条件 4 のリスク低減策**:

| 対策 | 期日 | 効果 |
|---|---|---|
| Z3 物理 install（@vercel/analytics + Analytics 配備）を 6/12 期日 → **6/8 EOD 前倒し target** | 6/8 | 4 日 buffer 確保 |
| Z4 ScrollDepthBoundary 配備を 6/14 期日 → **6/10 EOD 前倒し target** | 6/10 | 4 日 buffer 確保 |
| staging 構築開始（§3 段階 4）を 6/15 朝 → **6/14 夜試行 target** | 6/14 夜 | 半日 buffer |
| Lighthouse 4 軸検証を 6/18 期日 → **6/17 EOD 前倒し target** | 6/17 EOD | 1 日 buffer 確保 |

これらの buffer 確保により、発動条件 4 顕在化確度を 25% → **15-18% に低減**。

### §6.4 fallback 発動時の Web-Ops 側ロールバック手順 5 段階

| # | 段階 | task | 想定所要 |
|---|---|---|---|
| 1 | staging deploy v1.1（6/20 公開向け）を staging deploy v1.0（6/27 公開向け）に巻き戻し | git revert by tag + Vercel preview redeploy | 30 分 |
| 2 | OG image v1.1（caption 6/20）→ v1.0（caption 6/27）巻き戻し | static asset replacement | 15 分 |
| 3 | SEO meta v1.1 → v1.0 巻き戻し（`article:published_time` を 2026-06-27 に復元） | Marketing 提供 v1.0 取り込み | 10 分 |
| 4 | 段階 schedule 全件 +7 日 シフト（staging 6/15 → 6/22、公開 6/20 → 6/27） | schedule doc update | 30 分 |
| 5 | CEO 経由 Owner 報告（直接 Owner 報告は禁止、CLAUDE.md ルール 1 遵守） | 報告書作成 + 提出 | 15 分 |

合計想定: **100 分以内**（公開予定の 1 週間以上前なら時間的余裕あり、公開当日 7 日内発動でも 1.5h で完遂可能）

### §6.5 6/20 公開直前リスクマップ v1.1（R13 §7.3 / R14 §7.3 を軸-B 反映）

| リスク | Round 13 確度 | Round 14 確度 | **R15 第 4 波 確度（軸-B 反映）** | 影響 | 緩和策 |
|---|---|---|---|---|---|
| Y1 extraction script 実装遅延 | 低 | 低 | **低（変化なし）** | 中（mock fallback で公開可） | mock data で公開、確定値は 7/4 timeline カード追記、6/20 公開時点で K3.x = 0 件は許容済 |
| Y3-Y4 API 接続遅延 | 低 | 極低 | **極低（設計完了 + buffer 確保）** | 中（PV / scroll_depth 集計中表示） | mock + no-op fallback chain 二重化、6/8 / 6/10 buffer target |
| Y5 shadcn install 遅延 | 中 | 無 | **無（充足済）** | — | — |
| staging 6/15 朝着手不能（Z3/Z4 連鎖遅延） | — | — | **低（6/8 / 6/10 前倒し target で買戻可能）** | 高（公開 6/20 不可） | §6.3 buffer 確保策 |
| Lighthouse 100 未達（6/18） | — | — | **中（4 軸全 100 は厳しい）** | 中（SEO score 低下） | 6/19 朝修正窓 1 日確保 |
| 取り下げ Runbook 凍結 6/19 朝不能 | — | — | **低（spec は本書で完遂、物理化は Round 16）** | 高（緊急時即応不能） | Round 16 で T-1/T-2/T-3 物理化、6/19 までに dry-run 2 回 |
| 6/20 09:00 公開当日の突発障害 | — | — | **低**（24h モニタリング体制 + 取り下げ Runbook 待機） | 高 | §5 役割マトリクス + §4 Runbook 5 段階 |

---

## §7 親文書整合性チェックリスト

- [x] DEC-019-027 Heading A 採用継続 → 本書は infra spec のみで影響なし、Marketing-I R15 §1 で Heading A 完全継承確認済
- [x] DEC-019-029 「HP トップ + 事例 + Contact form のみ」採用 → §5.1 公開状態 5 点チェックで整合
- [x] DEC-019-033 透明性 6 軸 + ナレッジ機構 → §3 staging spec / §4 Runbook spec は public 開示前提で記述
- [x] DEC-019-052 (a)(b)(c) → tone B / Channel 3 / 09:00 JST 公開時刻 完全保持（軸-B 6/20 09:00 JST 採択でも維持）
- [x] DEC-019-053 dynamic disclosure 6 軸採択 → §3.2 段階 5（6/15-17）で物理組込整合
- [x] DEC-019-062 軸-B Full Pass → §3 / §5 で 6/20 09:00 JST 公開を前提化
- [x] Round 13 Web-Ops-A 17 ファイル / 1,900 行 → §1.1 で完全継承確認
- [x] Round 14 Web-Ops-B 4 ファイル / 803 行 → §1.2 で完全継承確認、Z3-Z8 引継状態を §1.3 で整理
- [x] Marketing-I R15 §5 Web-Ops B handoff 仕様 → §2.3 / §3 で受領 + 内部 task 化
- [x] Marketing-I R15 §5.4 取り下げ Runbook v1.0 → §4 で Web-Ops 側 5 段階接続点定義
- [x] CLAUDE.md ルール 1（直接 Owner 報告禁止）→ §4.2 段階 5 / §6.4 段階 5 で CEO 経由必須記述
- [x] CLAUDE.md ルール 2（成果物配置）→ 本書は `projects/PRJ-019/reports/` 配下、既存 PRJ 副作用 0 行
- [x] design-guidelines.md §3（AI 感を出さないクリーンデザイン）→ 本書 spec は §5 役割マトリクス含め tone B 維持
- [x] 絵文字 0 件 / API 追加コスト $0 → 本書貫徹
- [x] 既存ファイル無改変 → 本書 1 件新規のみ、Round 13-14 + Marketing-I R15 はすべて読取のみ

---

## §8 Round 15 第 4 波 引継（Round 16-17 向け）

| # | 引継項目 | 担当 | 期日 | 重要度 |
|---|---|---|---|---|
| W1 | Z3 物理 install（@vercel/analytics + `<Analytics />`）を 5/30 → **6/8 EOD 前倒し target** で実行 | Web-Ops | 6/8 EOD | 高 |
| W2 | Z4 ScrollDepthBoundary client component 配備（3 page bind）を 5/30 → **6/10 EOD 前倒し target** で実行 | Web-Ops | 6/10 EOD | 高 |
| W3 | Z5 dynamic disclosure 6 cards 物理組込（option B = tsconfig paths 経由） | Web-Ops | 6/15-17 staging | 高 |
| W4 | Z6 / Z7 portfolio + case study v2 公開版 v1.1 発行（5/22 内部運用着手日反映） | Web-Ops | 5/26 | 中 |
| W5 | T-1 `scripts/takedown.ts` 物理化（80-120 行、Vercel API 連動 rollback script） | Web-Ops | 6/13 起票 → 6/19 凍結 | 高 |
| W6 | T-2 `app/works/clawbridge/410.tsx` 物理化（30-50 行、取り下げ後 410 Gone page） | Web-Ops | 6/13 起票 → 6/19 凍結 | 高 |
| W7 | T-3 `lib/takedown/cache-purge.ts` 物理化（40-60 行、Edge cache purge helper） | Web-Ops | 6/13 起票 → 6/19 凍結 | 中 |
| W8 | 取り下げ Runbook v1.0 段階 1 dry-run（staging 環境で rollback シミュレーション） | Web-Ops | 6/15 | 高 |
| W9 | 取り下げ Runbook v1.0 段階 2 dry-run（DNS 切替 + 410 page 配備 シミュレーション） | Web-Ops | 6/17 | 高 |
| W10 | 6/20 公開当日 Web-Ops 役割マトリクス v1.1 発行（24h モニタリング体制詳細化） | Web-Ops | 6/19 EOD | 中 |
| W11 | 24h モニタリング metric 5 軸の閾値最終調整 | Web-Ops + Marketing | 6/19 EOD | 中 |
| W12 | 60 日運用拡張 4 cards（card-pv-60d / card-organic-traffic-share-60d / card-phase2-velocity-60d / card-knowledge-extraction-yield）の Web-Ops 側 wiring 設計 | Web-Ops + Marketing-I | 7/27 起点 | 中 |

---

## §9 残課題

| # | 項目 | 担当 | 期日 |
|---|---|---|---|
| X1 | 本書 v1.1 発行（5/22 内部運用着手日反映 + drill #2 5/7 朝結果反映） | Web-Ops | 5/26 |
| X2 | 本書 v1.2 発行（6/15 staging 着手後の実状況反映） | Web-Ops | 6/16 EOD |
| X3 | 本書 v1.3 発行（6/19 EOD 公開前最終確認時点反映） | Web-Ops | 6/19 EOD |
| X4 | 6/20 公開当日 24h サマリレポート起票 | Web-Ops | 6/21 09:00 JST |
| X5 | 6/27 fallback 経路発動時の rollback 完遂レポート（fallback 発動時のみ） | Web-Ops | 発動時 +24h 以内 |

---

## §Y 提出メタ情報

| 項目 | 値 |
|---|---|
| 行数 | 約 320 行（要求 250-400 行内） |
| 配備ファイル数 | 1 件新規（本書のみ）、既存 PRJ 副作用 0 行維持 |
| 着地物（spec 化） | C-1 staging 6/22→6/15 spec / C-2 takedown Runbook 自社接続点 / C-3 公開当日役割マトリクス v1.0 / C-4 リスクマップ v1.1 = **4 件** |
| 親戦略整合 | DEC-019-007 / 025 / 026 / 027 / 029 / 033 / 050 / 051 / 052 / 053 / 055 / 056 / 057 / 058 / 062 全 15 件 完全整合 |
| 既存成果物への影響 | **破壊的変更 0 件**（reports/ 配下 1 件のみ新規、Round 13-14 + Marketing-I R15 はすべて読取のみ） |
| Marketing-I R15 §5 handoff 受領 | 5 系統媒体 + 6/15 朝 staging 着手 + 6/19 朝 placeholder CSV 受領 + 6/20 公開実行 = **完全受領** |
| Round 13 / Round 14 引継状態 | Y1-Y2 / Z1-Z2 / Z6-Z7 / Z8 = Dev / Marketing-H / Web-Ops 各並列が継続吸収、Z3-Z5 = 本書 §8 W1-W3 で前倒し target 確定 |
| Owner 残動作 | **0 件**（Web-Ops 部門単独で完結する spec、物理化は Round 16-17 引継） |
| commit / push | 実行しない（CEO が一括 push） |
| API 追加コスト | **$0**（Read + Edit + Write のみ、background dispatch 想定値 $0 維持） |
| 関連報告 | `web-ops-round13-public-deployment-skeleton.md` / `web-ops-round14-shadcn-analytics-tag-manager.md` / `marketing-i-r15-public-launch-narrative-diff-and-30-60-day-ops.md` / `pm-round14-progress-and-r15-dispatch.md` / `marketing-launch-runbook-2026-06-20.md`（Round 8 起票 / Marketing 並列で 6/20 反映 update） |
| 公開準備度 | **GO 確定**（8 軸全 GO、軸-B 加速 case-A 6/20 公開向け Web-Ops 側準備完遂） |

---

**起案: Web-Ops 部門 R15 第 4 波 Web-Ops C 系続き / 2026-05-05（Round 15 第 4 波 独立 Agent dispatch、DEC-019-025 SOP 準拠、general-purpose 経由、低優先 3 並列の 3 番目）/ Round 13 Web-Ops-A skeleton + Round 14 Web-Ops-B 充足 + Marketing-I R15 軸-B 6/20 公開 narrative + 取り下げ Runbook v1.0 接続点 統合版**
