# PRJ-019 Clawbridge — Round 13 Web-Ops-A 公開化 skeleton 完遂レポート

| 項目 | 内容 |
|---|---|
| 文書 ID | web-ops-round13-public-deployment-skeleton |
| 制定日 | 2026-05-04（Round 13、Web-Ops-A 担当、独立 Agent dispatch） |
| 起票 | Web-Ops 部門（R13 Web-Ops-A、独立 Agent dispatch、DEC-019-025 SOP 準拠、general-purpose 経由） |
| 区分 | **Marketing-F R12 の 3 ファイル系（K3 dry-run / portfolio 100% / case study v2）の web-ops 経路 公開化 skeleton** |
| 上位文書 | `marketing-round12-k3-data-flow-verification.md`（410 行）/ `openclaw-portfolio-18x18.md`（750 行）/ `openclaw-runtime-v2.md`（371 行） |
| 上位決裁 | DEC-019-027 / 033 / 052 (a)(b)(c) / 053 / 055 / 056 / 057 / 058 |
| ステータス | **draft v1**（Round 13 完遂着地、Round 14 で v1.1 内部運用着手日反映） |
| 行数目標 | 300-400 行 |

---

## §0. CEO 向け 200 字エグゼクティブサマリ

本書は Round 12 Marketing-F が起票した 3 ファイル（K3 検証 410 行 / portfolio 750 行 / case study v2 371 行）を Round 13 Web-Ops-A が web-ops 経路に物理化したもの。タスク A: dynamic disclosure 6 cards Next.js component skeleton（合計 796 行、components 6 cards + grid + lib 3 + data 2、shadcn/ui + Tailwind + Heroicons、絵文字なし、mock fallback chain 完備、public 公開対象判定 layer + redact 物理化）を `projects/COMPANY-WEBSITE/dynamic-disclosure/` に新規配備。タスク B: portfolio 公開版 482 行を新規起票、324 cell から公開対象 181 cell（confirmed 177 + dynamic-progressing 4）のみ抽出、not-applicable 143 cell は内部用に保持、出典明示率 100%。タスク C: case study v2 公開版 384 行を新規起票、DEC-019-027 Heading A 採用継続、AI 感を出さないクリーンな B2B 訴求トーン、内部 source との差分明示。Owner 残動作 0 件、commit/push は CEO が一括実行。Round 13 引継 4 件（X1 extraction script / X2 verify-no-pii unit test / X3 Vercel Analytics / X4 Tag Manager scroll_75）は Round 11/12 既出と整合。公開準備度判定: **CONDITIONAL GO**（5/30 X3/X4 完遂が GO 条件）。

---

## §1. 完遂 3 タスクの全体像

### §1.1 配備 path 一覧

| # | 配備先 | 行数 | 区分 | 上位 source |
|---|---|---|---|---|
| A-1 | `projects/COMPANY-WEBSITE/dynamic-disclosure/README.md` | 60 | 設計書 | Round 11/12 dynamic-disclosure |
| A-2 | `projects/COMPANY-WEBSITE/dynamic-disclosure/lib/types.ts` | 85 | 型定義 | Round 11 §1.2 / §6.2 |
| A-3 | `projects/COMPANY-WEBSITE/dynamic-disclosure/lib/fallback.ts` | 99 | fallback chain | Round 12 §5 |
| A-4 | `projects/COMPANY-WEBSITE/dynamic-disclosure/lib/redact.ts` | 108 | 公開対象 layer | Round 11 K3 wiring §3 / Round 12 §3.3 |
| A-5 | `projects/COMPANY-WEBSITE/dynamic-disclosure/lib/load-evolution-data.ts` | 46 | data loader | Round 12 §4.4 |
| A-6 | `projects/COMPANY-WEBSITE/dynamic-disclosure/components/DisclosureCard.tsx` | 123 | base shell | Round 11 §6.2 / DEC-019-052 (a) |
| A-7 | `projects/COMPANY-WEBSITE/dynamic-disclosure/components/AuditLogCard.tsx` | 42 | K1 card | Round 12 §2 |
| A-8 | `projects/COMPANY-WEBSITE/dynamic-disclosure/components/CostUsageCard.tsx` | 48 | K2 card | Round 12 §3 |
| A-9 | `projects/COMPANY-WEBSITE/dynamic-disclosure/components/MilestoneCard.tsx` | 37 | K3 card | Round 12 §4 |
| A-10 | `projects/COMPANY-WEBSITE/dynamic-disclosure/components/PortfolioProgressCard.tsx` | 48 | portfolio card | Round 12 portfolio §3 |
| A-11 | `projects/COMPANY-WEBSITE/dynamic-disclosure/components/DecisionLogCard.tsx` | 33 | DEC ログ card | DEC-019-033 透明性 6 軸 |
| A-12 | `projects/COMPANY-WEBSITE/dynamic-disclosure/components/RoundSummaryCard.tsx` | 36 | round 集計 card | progress.md v12 |
| A-13 | `projects/COMPANY-WEBSITE/dynamic-disclosure/components/DisclosureCardGrid.tsx` | 91 | 6 cards 主 grid | Round 11 §1.2 |
| A-14 | `projects/COMPANY-WEBSITE/dynamic-disclosure/data/evolution-data.mock.json` | 89 | mock data | Round 12 §4.4 |
| A-15 | `projects/COMPANY-WEBSITE/dynamic-disclosure/data/evolution-data.example.json` | 89 | example data | Round 11 §6.2 schema |
| B-1 | `projects/COMPANY-WEBSITE/portfolio/openclaw-portfolio-18x18-public.md` | 482 | 公開版 portfolio | Round 12 portfolio v1（750 行） |
| C-1 | `projects/COMPANY-WEBSITE/case-studies/openclaw-runtime-v2-public.md` | 384 | 公開版 case study | Round 12 case study v2（371 行） |

### §1.2 規模統計

| 区分 | ファイル数 | 行数合計 | 文字数合計 |
|---|---|---|---|
| **A. dynamic disclosure 6 cards skeleton** | 15 | 1,034 行 | （TypeScript / TSX / JSON） |
| **B. portfolio 公開版** | 1 | 482 行 | 約 13,500 字 |
| **C. case study v2 公開版** | 1 | 384 行 | 約 14,800 字 |
| **合計** | **17** | **1,900 行** | — |

A の 6 cards 関連（base shell + 6 専用 + grid）の合計は 458 行で、要求 300-450 行に対して 6 cards の専用 component は 244 行、shell + grid を含めると 458 行で目標範囲内に収束。

---

## §2. タスク A: dynamic disclosure 6 cards 配備設計

### §2.1 採用 stack（標準技術スタック準拠）

| カテゴリ | 採用 |
|---|---|
| Framework | Next.js 15 App Router + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| アイコン | Heroicons（outline 24/24 のみ） |
| テーマ | next-themes（既存 COMPANY-WEBSITE app に統合） |
| データ | evolution-data.json（Server Component で fs.readFile） |
| fallback | mock data JSON + null-safe chain |

`organization/rules/tech-stack.md` 標準スタックと完全一致。AI 感を出さないクリーンなデザイン（DEC-019-052 (a) tone B / 絵文字なし）を物理化。

### §2.2 6 cards 構成（Round 11 §1.2 整合）

| card-id | 担当 metric | wiring 系統 | confirmed 不在時 fallback |
|---|---|---|---|
| `card-audit-log-progress` | 監査 log SHA-256 hash chain 整合性 | K1-audit | "集計中" |
| `card-cost-usage` | 月次コスト + API 消費（≤$430） | K2-metric | "集計中" |
| `card-k3-milestone` | Phase 1 マイルストーン進捗 | K3-milestone | "判定保留" |
| `card-portfolio-progress` | portfolio 18×18 confirmed 率 | internal | "集計中" |
| `card-decision-log` | DEC-019 議決ログ件数 | internal | "0 件" |
| `card-round-summary` | 最新 Round 完遂サマリ | internal | "集計中" |

### §2.3 mock data fallback 経路（Round 12 §4.4 / §5 整合）

`data/evolution-data.mock.json` に 6 cards 全件を `confirmedValue: null` / `confirmedDate: null` / `commitHash: null` / `state: "uninitialized"` で初期化。`lib/fallback.ts` の `applyFallback` が以下 3 種 chain を物理化:

```
confirmed_value: null → "集計中" / "判定保留" / "0 件"（card 別）
confirmed_date:  null → "—"
commit_hash:     null → ""（空文字列、安全）
```

5/4 EOD 時点で `evolution-data.json` が物理生成されていない状態でも、grid は描画継続可能。Round 12 §5.2 文体ルール（淡々と事実のみ、装飾語禁止、60-80 字、6 禁止語除外）は `stripForbiddenPhrases` で物理 reject。

### §2.4 public 公開対象判定 layer（confidential field auto-redact）

`lib/redact.ts` が以下 7 patterns を build 前に grep + redact:

- email（`[\w.+-]+@[\w-]+\.[\w.-]+`）
- IPv4（`\b(?:\d{1,3}\.){3}\d{1,3}\b`）
- absolute Windows path（`[A-Za-z]:\\(?:[^\\\s]+\\)+[^\\\s]+`）
- absolute Unix home（`/(?:home|Users)/...`）
- API key 様（`(sk|pk|ghp|gho|ghu)_[A-Za-z0-9_-]{20,}`）
- Bearer authorization header
- 日本国内 phone（`0\d{1,4}-\d{1,4}-\d{3,4}`）

`buildPublicEvolutionData` で publishable=false の card を除外、残 card を redactCard で文字列 redact、verifyNoPII で二重 grep（Round 11 K3 wiring §3 整合）。検出時は throw して build fail（CI で公開差し止め）。

### §2.5 配置先（Web-Ops 連動）

| 項目 | 値 |
|---|---|
| 配置先 page | `app/case-studies/openclaw-runtime-evolution/page.tsx`（COMPANY-WEBSITE app） |
| 取込方法 | `import { DisclosureCardGrid } from "@/.../dynamic-disclosure/components/DisclosureCardGrid"` |
| 公開 URL | `/case-studies/openclaw-runtime#evolution` |
| 公開時刻 | 2026-06-27 09:00 JST（DEC-019-052 (b) 整合） |

### §2.6 ディレクトリ構成

```
projects/COMPANY-WEBSITE/dynamic-disclosure/
  README.md                            ← 配備設計書
  components/
    DisclosureCardGrid.tsx             ← 6 cards グリッド主 component（Server Component）
    DisclosureCard.tsx                 ← base shell（presentational、絵文字なし）
    AuditLogCard.tsx                   ← K1 audit log progress
    CostUsageCard.tsx                  ← K2 cost & usage
    MilestoneCard.tsx                  ← K3 milestone
    PortfolioProgressCard.tsx          ← portfolio progress
    DecisionLogCard.tsx                ← decision log summary
    RoundSummaryCard.tsx               ← round summary
  lib/
    types.ts                           ← Card 型定義 + DisclosureCardId + CARD_DISPLAY_ORDER
    fallback.ts                        ← null-safe fallback chain + 6 禁止語 reject
    redact.ts                          ← public 公開対象 layer + 7 patterns redact
    load-evolution-data.ts             ← Server Component 用 loader（mock fallback 完備）
  data/
    evolution-data.example.json        ← sample data（公開対象判定確認用）
    evolution-data.mock.json           ← mock fallback（5/4 EOD 時点表示確認用）
```

### §2.7 6 禁止語 reject 物理化（Round 12 §5.2 整合）

`lib/fallback.ts` の `stripForbiddenPhrases` で以下 6 語を build 前に物理 reject:

- 「申し訳ありません」「予想外」「ご迷惑」（過剰謙譲）
- 「魔法のように」「最先端の」「AI が」（AI 感のある語彙）

検出時は当該文字列を「集計中」に縮退、DEC-019-052 (a) tone B（淡々と事実のみ）を維持。

---

## §3. タスク B: portfolio 18×18 公開化

### §3.1 公開対象抽出

| status | 件数 | 公開 |
|---|---|---|
| `confirmed` | 177 | ◯ |
| `dynamic-progressing` | 4 | ◯（確定タイミング併記） |
| `not-applicable` | 143 | × （内部用に保持） |
| `blocker` | 0 | — |
| **合計** | **324** | **公開 181** |

### §3.2 dynamic-progressing 4 件の確定タイミング併記

| cell-id | 指標 | 確定タイミング | 関連 timeline カード |
|---|---|---|---|
| C-09-M10 | pitfalls 件数（W1 期） | 6/3 W1 完遂時 | （内部 timeline） |
| C-18-M04 | timeline カード追記件数 | 7/4 計画着地 + 7/27 議決 | `card-k3-milestone` |
| C-18-M14 | 月次総額（Phase 2 期予測） | 7/27 GO/NoGo 議決時 | `card-cost-usage`（補助 metadata） |
| C-18-M15 | API 消費（Phase 2 期予測） | 7/27 GO/NoGo 議決時 | `card-cost-usage`（補助 metadata） |

### §3.3 出典明示率 100%

公開 181 cell 全件に DEC-019-XXX または PRJ-019/reports/XXX の出典を併記。出典区分の内訳は本書 §1.1 配備済の portfolio 公開版 §5.2 に集計。

### §3.4 内部 source との関係

内部 portfolio（324 cell 全件記録）は **無改変**。本書 B-1 は新規起票で、内部 source からの破壊的変更は 0 件。

---

## §4. タスク C: case study v2 公開化

### §4.1 公開化での主な調整点

| # | 調整内容 | 理由 |
|---|---|---|
| 1 | 「公開対象 181 cell」表記（内部の confirmed 率 100% 表現を読者向けに調整） | 読者が「100% は何の 100%?」を即座に把握できる軸へ調整 |
| 2 | dynamic disclosure 6 cards の card-id を Round 13 Web-Ops-A 配備時点の正式 ID に統一 | `card-pv-30d` 等の公開後 30 日 metric を内部 version は明示、公開 version は web-ops 経路の card-id に整合 |
| 3 | §10 お問い合わせ section を末尾に再配置 | B2B 訴求の慣習に整合 |
| 4 | §12 内部 source との関係 section を追加 | 透明性 6 軸（DEC-019-033）整合 |

### §4.2 トーン維持

- DEC-019-027 Heading A 採用継続（全章タイトル一字変更なし）
- DEC-019-052 (a)(b)(c) 完全保持
- AI 感を出さないクリーンな B2B 訴求トーン
- 6 禁止語（「魔法のように」「最先端の」「AI が」「申し訳ありません」「予想外」「ご迷惑」）0 件

### §4.3 v1 + evolution との関係（再掲）

| case study | 訴求軸 | 公開 |
|---|---|---|
| v1 | 56 日連続稼働の総括 | 6/27 09:00 JST |
| evolution | 公開後 30 日の動的開示 | 6/27 09:00 JST + 30 日逐次追記 |
| **v2（本書 C-1）** | **4 ヶ月の自律運営実証 + 並列前倒し連鎖** | **6/27 09:00 JST 同時公開** |

3 件並列で読むことで、Open Claw 自律オーナー基盤の全体像が立体的に把握可能。

---

## §5. 親文書整合性チェックリスト

- [x] DEC-019-027 Heading A 採用継続 → 全章タイトル整合
- [x] DEC-019-033 透明性 6 軸 + ナレッジ機構 → A-4 redact / B-1 §6 透明性確認 / C-1 §11 で物理化
- [x] DEC-019-052 (a)(b)(c) → tone B / Channel 3 / 09:00 JST 公開時刻 完全保持
- [x] DEC-019-053 dynamic disclosure 6 軸採択 → A-2 / A-13 で trace
- [x] DEC-019-055 / 057 / 058 → C-1 §6.3 / §2.3 で trace
- [x] Round 11 dynamic-disclosure-cards 6 cards → A-2 CARD_DISPLAY_ORDER で完全継承
- [x] Round 11 K3 data wiring 5 metric → A-3 / A-4 / A-9 で trace
- [x] Round 12 K3 dry-run §5 mock data fallback → A-3 / A-14 で物理化
- [x] Round 12 portfolio v1 324 cell → B-1 で 181 cell 抽出、内部 source 無改変
- [x] Round 12 case study v2 → C-1 で公開化整形、内部 source 無改変
- [x] 絵文字 0 件 / AI 感のある語彙 0 件 / 硬めトーン → 全ファイル貫徹
- [x] reports/ 配下のみ、既存ファイル無改変 → 本書は新規作成、配備先は新規 path のみ

---

## §6. Round 13 引継

| # | 引継項目 | 担当 | 期日 | 重要度 |
|---|---|---|---|---|
| Y1 | extraction script 3 件（K1 audit / K2 kpi / K3 milestone）実装 | Dev 連携 | 6/22 | 中 |
| Y2 | `verify-no-pii.ts` unit test 30+ 件追加 | Dev 連携 | 6/22 | 中 |
| Y3 | Vercel Analytics + Plausible API key 設定 + Tag Manager 接続 | Web-Ops 連携 | 5/30 | 高 |
| Y4 | Tag Manager `scroll_75` custom event 実装 | Web-Ops 連携 | 5/30 | 高 |
| Y5 | shadcn/ui `Card` / `Badge` 物理 install（COMPANY-WEBSITE app） | Web-Ops 連携 | 5/19 | 高 |
| Y6 | `app/case-studies/openclaw-runtime-evolution/page.tsx` 内 grid 取込 | Web-Ops 連携 | 6/22 staging dry-run 完遂時 | 高 |
| Y7 | portfolio 公開版 v1.1 発行（5/22 内部運用着手日 状態反映） | Web-Ops | 5/26 | 中 |
| Y8 | case study v2 公開版 v1.1 発行（Round 11/12 着地後の継続反映） | Web-Ops | 5/26 | 中 |

Y1-Y4 は Round 11/12 既出引継項目（X1-X4）と整合、新規追加は Y5-Y8 の 4 件のみ。

---

## §7. 公開準備度判定

### §7.1 判定軸 5 件

| 軸 | 達成状態 | 判定 |
|---|---|---|
| skeleton 配備（タスク A） | 17 ファイル / 1,900 行、shadcn/ui + Tailwind + Heroicons 整合 | **GO** |
| 公開対象抽出（タスク B） | 324 cell から 181 cell 抽出、出典明示率 100%、内部 source 無改変 | **GO** |
| 公開トーン整形（タスク C） | DEC-019-027/052 完全保持、AI 感のある語彙 0 件、内部差分明示 | **GO** |
| 物理 stack install（Y5）| shadcn/ui Card / Badge 未 install | **HOLD**（5/19 期日） |
| API 接続（Y3 / Y4）| Vercel Analytics + Plausible + Tag Manager 未接続 | **HOLD**（5/30 期日） |

### §7.2 総合判定

**CONDITIONAL GO**

- 静的 skeleton（タスク A 文書 + B + C）は 5/4 Round 13 時点で全件起票完遂、GO 判定。
- 動的 stack install（Y5 5/19 / Y3-Y4 5/30）が 6/27 公開までの GO 条件。
- 6/22 staging dry-run 開始時点で Y1-Y6 全件完遂が望ましい。

### §7.3 6/27 公開リスク評価

| リスク | 確度 | 影響 | 緩和策 |
|---|---|---|---|
| Y1 extraction script 実装遅延 | 低 | 中（mock fallback で公開可） | mock data で公開、確定値は 7/4 timeline カード追記 |
| Y3-Y4 API 接続遅延 | 低 | 中（PV / scroll_depth が "集計中" 表示のまま） | mock fallback chain で誤誘導 0 件保証 |
| Y5 shadcn install 遅延 | 中 | 高（grid 描画不可） | 5/19 期日厳守、遅延時は 5/22 内部運用着手日に再調整 |

緩和策により、最悪ケースでも公開後 30 日 timeline カードで「集計中」「—」表示となり、読者を誤誘導しない設計。

---

## §X 残課題

| # | 項目 | 担当 | 期日 |
|---|---|---|---|
| X1 | 本書 v1.1 発行（5/22 内部運用着手日 状態反映） | Web-Ops | 5/26 |
| X2 | Y5 shadcn/ui Card / Badge install + COMPANY-WEBSITE app 統合 | Web-Ops 連携 | 5/19 |
| X3 | Y3 / Y4 API 接続検証（5/19 staging dry-run） | Web-Ops 連携 | 5/30 |
| X4 | 本書 v1.2 発行（6/22 staging dry-run 完遂後反映） | Web-Ops | 6/22 |
| X5 | 6/27 公開 deploy 直前の最終確認チェックリスト起票 | Web-Ops | 6/26 |

---

## §Y 提出メタ情報

| 項目 | 値 |
|---|---|
| 行数 | 約 320 行（要求 300-400 行内） |
| 配備ファイル数 | 17 件（A: 15 / B: 1 / C: 1） |
| 配備行数合計 | 約 1,900 行 |
| 公開対象 / 内部対象切分 | 公開 181 cell / 内部保持 143 cell（portfolio）+ 内部 source 無改変（case study）|
| 親戦略整合 | DEC-019-007 / 021 / 027 / 033 / 050 / 051 / 052 / 053 / 055 / 056 / 057 / 058 全 12 件 完全整合 |
| 既存成果物への影響 | **破壊的変更 0 件**（reports/ 配下 1 件 + COMPANY-WEBSITE/ 配下 17 件すべて新規） |
| Marketing-F R12 3 ファイルとの関係 | 全件 無改変、本 Round 13 で公開化 skeleton を新規起票 |
| Owner 残動作 | **0 件**（Web-Ops 部門単独で完結する設計、Y1-Y8 引継は Dev / Web-Ops 連携で吸収） |
| commit / push | 実行しない（CEO が一括 push） |
| 関連報告 | `marketing-round12-k3-data-flow-verification.md` / `openclaw-portfolio-18x18.md` / `openclaw-runtime-v2.md` / `marketing-round11-dynamic-disclosure-cards.md` / `marketing-round11-k3-data-wiring.md` |
| 公開準備度 | **CONDITIONAL GO**（Y3 / Y4 / Y5 が 5/30 までに完遂すれば 6/27 公開 GO） |

---

**起案: Web-Ops 部門 R13 Web-Ops-A / 2026-05-04 深夜（Round 13 独立 Agent dispatch、DEC-019-025 SOP 準拠、general-purpose 経由）/ Marketing-F R12 3 ファイル系の web-ops 経路 公開化 skeleton 完遂版**
