# PRJ-019 Clawbridge — Web-Ops handoff plan（6/27 公開時 自社 HP 反映、案 C ハイブリッド版）

| 項目 | 内容 |
|---|---|
| 文書 ID | marketing-web-ops-handoff |
| 制定日 | 2026-05-04（Round 10、Marketing-ζ 担当） |
| 起票 | Marketing 部門（R10 Marketing-ζ、独立 Agent dispatch、DEC-019-025 SOP 準拠） |
| 区分 | **Web-Ops handoff plan**（6/27 公開時の自社 HP `projects/COMPANY-WEBSITE/` への反映 timeline / artifact 一覧 / responsibility split） |
| 上位文書 | `marketing-launch-narrative-final.md`（本書連動 narrative） / `marketing-portfolio-18x18.md`（本書連動 metric matrix） / `marketing-metric-plan-v1.1.md`（本書連動 KPI 仕様） / `marketing-webops-handoff-package.md`（Round 8 γ）/ `marketing-portfolio-staging-spec.md`（Round 8 γ） |
| 上位決裁 | DEC-019-052 / 027 / 028 / 029 / 033 / 051 / 055 / 056 |
| ステータス | **draft v1**（5/15 = 段階 1 開始時に v1.1 / 6/22 = 段階 1 開始時に v1.2 確定） |
| 行数目標 | 200-300 行 |

---

## §0. CEO 向け 200 字エグゼクティブサマリ

本書は 6/27 朝 09:00 JST 公開時の自社 HP（`projects/COMPANY-WEBSITE/`）への反映を Web-Ops 部門が独立に実行可能な levels で作業分解した handoff plan である。Marketing 部門が 5/15-6/22 期間で生成する 5 系統の artifact（narrative / portfolio / X thread / Zenn-note article / metric JSON）を、Web-Ops 部門が 6/22-6/27 の段階 1-4 で staging → production deploy する。Round 8 γ の既存 `marketing-webops-handoff-package.md` を破壊せず、本書は **6/27 公開向け delta** を差分追加（双フェーズ案 C ハイブリッド前提、5/22 内部運用着手反映 + 6/20 Phase 1 完遂後の確定値置換）。Web-Ops 部門の Owner 物理拘束は 6/26 段階 3 の最終承認 30-45 分のみ、それ以外は Marketing → Web-Ops の非同期 handoff で完結する。

---

## §1. 全体 timeline（5/15 → 6/27 公開）

### §1.1 6 段階 timeline 図

```
[Marketing 部門 artifact 生成期間]
5/15 (木) Marketing artifact v1.0 集約完了（5 系統）
  ↓ Web-Ops handoff (1)
[Web-Ops 部門 staging dry-run 期間]
5/19 (月) staging dry-run 開始（仮値 placeholder で 1 周試行）
5/22 (金) **内部運用着手日**（Web-Ops 作業継続、内部 dashboard 連携準備）
5/30 (金) staging dry-run 完了 + Lighthouse 100/100/100/100 検証
  ↓ Marketing → Web-Ops handoff (2)
[Marketing artifact 確定値反映期間]
6/3 (水) Phase 1 W1 sign-off 前倒し → Marketing artifact v1.1（K2.1 確定）
6/13 (金) Phase 1 W3 完了 → Marketing artifact v1.2（K1.2 / K1.10 / K2.6 確定）
6/20 (土) Phase 1 W4 sign-off → Marketing artifact v1.3（残 5 件確定）
  ↓ Web-Ops handoff (3)
[Web-Ops 段階 1-4 公開準備]
6/22 (月) **段階 1 = 自社 HP 実装着手**（Marketing artifact v1.3 反映開始）
6/25 (水) 段階 2 = Review WCAG/婉曲化/JSON-LD 検証
6/26 (木) 段階 3 = Marketing 実測値反映 + **Owner 最終承認 30-45 分**
6/27 (土) **段階 4 = 09:00 JST 公開**（Vercel production deploy + SNS 投稿）
6/28-7/27 公開後 30 日動的開示期間（K3.x KPI 確定）
```

### §1.2 各 phase の責任部署

| phase | 期間 | 主担当 | 副担当 | Owner 物理拘束 |
|---|---|---|---|---|
| Marketing artifact 生成 | 5/4-6/22 | Marketing | - | 0 分 |
| Web-Ops staging dry-run | 5/19-5/30 | Web-Ops | Marketing | 0 分 |
| artifact 確定値反映 | 6/3-6/22 | Marketing | Web-Ops | 0 分 |
| Web-Ops 段階 1-4 公開準備 | 6/22-6/27 | Web-Ops | Marketing / Review | **6/26 最終承認 30-45 分のみ** |
| 公開後 30 日動的開示 | 6/28-7/27 | Web-Ops | Marketing | 7/4 Phase 2 着手会議 60-90 分 |

---

## §2. Marketing → Web-Ops handoff artifact 5 系統

### §2.1 artifact 一覧

| # | artifact | 生成元 Marketing 文書 | 形式 | 配布先 | 期日 |
|---|---|---|---|---|---|
| A1 | narrative final 18 章本文 | `marketing-launch-narrative-final.md` | Markdown → MDX 変換 | `app/case-studies/openclaw-runtime/page.mdx` | 6/22 |
| A2 | portfolio 18×18 metric JSON | `marketing-portfolio-18x18.md` | Markdown → JSON 抽出 | `app/case-studies/openclaw-runtime/metric-data.json` | 6/22 |
| A3 | X thread 6 投稿 draft | （独立ファイル `marketing-launch-x-thread-draft-final.md`、6/22 までに発行） | Markdown → SNS scheduler | X 投稿予約システム | 6/26 |
| A4 | Zenn / note article 5 章 | （独立ファイル `marketing-launch-zenn-note-article-final.md`、6/22 までに発行） | Markdown → Zenn / note 入稿 | Zenn / note 予約投稿システム | 6/26 |
| A5 | KPI 確定値 JSON | `marketing-metric-plan-v1.1.md` | Markdown → JSON 抽出 | `app/case-studies/openclaw-runtime/kpi-data.json` | 6/22 |

### §2.2 artifact 生成スケジュール

| 日付 | Marketing artifact 状態 |
|---|---|
| 5/4 | A1 narrative final draft v1（本書 §0 連動 narrative-final.md）/ A2 portfolio matrix v1 / A5 KPI plan v1.1 完成 |
| 5/15 | A1 v1.0 集約完了、Web-Ops staging dry-run 開始 |
| 5/26 | A1 v1.1（5/22 内部運用着手結果反映）/ A2 v1.1 / A5 v1.2 |
| 6/4 | A1 v1.2（6/3 W1 sign-off 前倒し反映）/ A5 v1.3 |
| 6/22 | A1 v1.3 final / A2 v1.3 final / A3 final / A4 final / A5 v1.4 final（**Web-Ops 段階 1 着手**） |
| 6/26 | A3 / A4 final 確定（前夜 Owner 最終承認） |

---

## §3. Web-Ops 部門の作業分解（6/22-6/27）

### §3.1 段階 1（6/22 月、自社 HP 実装着手）

| 時刻 (JST) | 作業 | 担当 | アウトプット |
|---|---|---|---|
| 09:00-12:00 | Marketing artifact A1 / A2 / A5 受領 + 内容確認 | Web-Ops | 受領 ack |
| 12:00-15:00 | `app/case-studies/openclaw-runtime/page.mdx` に A1 narrative 反映 | Web-Ops | page.mdx draft |
| 15:00-17:00 | `metric-data.json` / `kpi-data.json` に A2 / A5 反映 | Web-Ops | JSON v1 |
| 17:00-19:00 | Vercel staging deploy + 自己確認 | Web-Ops | staging URL 共有 |

### §3.2 段階 2（6/25 水、Review WCAG/婉曲化/JSON-LD 検証）

| 時刻 (JST) | 作業 | 担当 | アウトプット |
|---|---|---|---|
| 09:00-12:00 | Lighthouse 100/100/100/100 検証 | Web-Ops | Lighthouse report |
| 12:00-15:00 | WCAG 2.2 AA 準拠検証 | Review 連携 | WCAG report |
| 15:00-17:00 | 婉曲化マッピング遵守確認（NG-1〜3 / BAN / 予算系の表現） | Review 連携 | 婉曲化 report |
| 17:00-19:00 | JSON-LD structured data 検証（Article schema + BreadcrumbList） | Web-Ops | structured data report |

### §3.3 段階 3（6/26 木、Marketing 実測値反映 + Owner 最終承認）

| 時刻 (JST) | 作業 | 担当 | アウトプット |
|---|---|---|---|
| 09:00-12:00 | Marketing A1 v1.3 → A1 v1.4 最終確定（Phase 1 W4 完遂値反映） | Marketing | A1 v1.4 |
| 12:00-15:00 | Web-Ops staging に A1 v1.4 反映 + 18×18 matrix の `data-state="confirmed-2026-06-20"` 注入 | Web-Ops | staging URL final |
| 15:00-17:00 | Marketing + Review 最終チェック | Marketing / Review | OK ack |
| **17:00-17:45** | **Owner 最終承認会議**（差分プレビュー、所要 30-45 分） | **Owner** | **6/27 公開承認** |
| 18:00-21:00 | Zenn / note 予約投稿設定 + X thread Post 0 前夜祭投稿予約 | Web-Ops | 予約完了 ack |
| 22:00 | X Post 0 前夜祭 自動投稿 | Web-Ops | 投稿完了 |

### §3.4 段階 4（6/27 土 09:00 JST 公開）

既存ランブック (`marketing-launch-runbook-2026-06-20.md`) §8 hour-by-hour SOP を完全流用、日付変更のみ。

```
6/27 06:30: Marketing 事前 5 点チェック開始
6/27 07:00: Web-Ops Vercel 本番 deploy trigger
6/27 07:15: password protection 解除 + canonical 切替
6/27 07:30: DNS 反映確認
6/27 07:45: Lighthouse 本番計測（100/100/100/100 確認）
6/27 08:00: Marketing 公開状態 5 点チェック
6/27 08:15: structured data 検証
6/27 08:30: Zenn 投稿予約確認
6/27 08:45: note 投稿予約確認
6/27 09:00: SNS X 投稿 Post 1（開戦宣言）
6/27 09:30: X Post 2（武器の紹介）
6/27 12:00: X Post 3（闘いの記録）
6/27 18:00: X Post 4（結果の数値化）
6/27 21:00: X Post 5（OSS + 続編予告）
6/27 22:00: Marketing 公開後 12 時間モニタリング報告（CEO）
6/28 09:00: Marketing 公開後 24 時間モニタリング報告（CEO → Owner）
```

---

## §4. responsibility split（Marketing / Web-Ops / Review / Owner）

### §4.1 4 部署の責任分担 matrix

| 作業 | Marketing | Web-Ops | Review | Owner |
|---|---|---|---|---|
| narrative 文章生成 | **主担当** | - | 婉曲化マッピング確認 | - |
| portfolio matrix 数値生成 | **主担当** | - | - | - |
| KPI 仕様策定 | **主担当** | - | - | - |
| MDX / JSON 注入 | artifact 提供 | **主担当** | - | - |
| Lighthouse 検証 | - | **主担当** | - | - |
| WCAG 2.2 AA 検証 | - | 修正反映 | **主担当** | - |
| JSON-LD structured data | - | **主担当** | 検証協力 | - |
| Zenn / note 入稿 | article 提供 | **主担当**（予約投稿設定） | - | - |
| X thread 投稿 | post 提供 | **主担当**（予約投稿設定） | - | - |
| 6/26 最終承認 | 説明 | 説明 | 説明 | **承認権者** |
| 6/27 公開実行 | モニタリング | **主担当**（Vercel deploy） | - | - |
| 公開後 30 日動的開示 | metric 確定値提供 | **主担当**（JSON 更新 + 再ビルド） | - | - |

### §4.2 Owner 物理拘束時間（既存ランブック流用、新規負担なし）

| 日付 | Owner 拘束 | 内容 | 既存ランブック整合 |
|---|---|---|---|
| 5/8 | 35-45 分 | W0-Week1 検収会議（DEC-019-054 圧縮版） | OK |
| 6/26 | 30-45 分 | 6/27 公開最終承認（差分プレビュー） | OK |
| 7/4 | 60-90 分 | Phase 2 着手判断会議（公開後 7 日中間レビュー） | 新規（案 C ハイブリッド） |
| 7/27 | 30-45 分 | 公開後 30 日 KPI 確定 + Phase 2 GO/NoGo 議決 | 新規（案 C ハイブリッド） |

→ Owner 残動作は **既存ランブック流用 2 回（5/8 / 6/26）+ 案 C ハイブリッド新規 2 回（7/4 / 7/27）** = 計 4 回、累計 155-225 分。

---

## §5. Web-Ops 独立実行可能な作業分解レベル

### §5.1 Web-Ops が自己完結できる範囲（Marketing 介入不要）

| 作業 | 自己完結度 | Marketing 介入要否 |
|---|---|---|
| `app/case-studies/openclaw-runtime/page.mdx` 実装 | 100% | A1 artifact 受領後は自己完結 |
| `metric-data.json` / `kpi-data.json` 生成 | 100% | A2 / A5 artifact 受領後は自己完結 |
| Vercel staging / production deploy | 100% | 不要 |
| Lighthouse 検証 | 100% | 不要 |
| JSON-LD structured data 実装 | 100% | 不要 |
| `evolution-timeline.tsx` 実装 | 90% | timeline カード data 構造は本書 §5.3 で確定済 |
| 公開後 30 日動的開示更新 | 80% | metric 確定値の Marketing → Web-Ops 受領フローは §5.4 で確定 |

### §5.2 Web-Ops が Marketing と協調する範囲

| 作業 | 協調内容 |
|---|---|
| 婉曲化マッピング遵守 | Review 部門が主担当、Web-Ops は修正反映 |
| narrative tone 維持 | Marketing が tone 検証、Web-Ops は表現変更不可 |
| placeholder 確定値の差替タイミング | Marketing が確定タイミング通知、Web-Ops が JSON / MDX 反映 |

### §5.3 timeline カード data 構造（本書で確定）

```typescript
// app/case-studies/openclaw-runtime/evolution-timeline-data.ts
export type TimelineCardState = "progressing" | "completed";

export type TimelineCard = {
  id: string;
  metric_name: string;
  expected_date: string; // YYYY-MM-DD
  state: TimelineCardState;
  confirmed_date?: string;
  commit_hash?: string;
  description: string;
};

export const timelineCards: TimelineCard[] = [
  {
    id: "phase2-kickoff-decision",
    metric_name: "Phase 2 着手判断",
    expected_date: "2026-07-04",
    state: "progressing",
    description: "公開後 7 日中間レビュー、Phase 2 計画着地"
  },
  {
    id: "pv-30d",
    metric_name: "PV 30 日",
    expected_date: "2026-07-27",
    state: "progressing",
    description: "公開後 30 日 PV 集計"
  },
  // ... 残 4 件（K3.2-K3.5 + Phase 2 GO/NoGo）
];
```

### §5.4 公開後 30 日 metric 確定値受領フロー

```
[公開後 30 日 metric 確定値受領フロー]

各マイルストーン日（7/4 / 7/14 / 7/27）の朝 09:00 JST
  ↓
Marketing 部門が前日 23:59 JST の Vercel Analytics + Plausible / Tag Manager 集計
  ↓
Marketing → Web-Ops handoff (Slack #web-ops チャンネル)
  - JSON 形式で確定値配布（schema は §5.3 timelineCards 準拠）
  - commit hash 付記
  ↓
Web-Ops が JSON 更新 + Vercel SSG 再ビルド + production deploy
  ↓
1 時間以内に `/case-studies/openclaw-runtime#evolution` セクションに反映
  ↓
Marketing が反映確認 + ack
```

---

## §6. 既存 Round 8 γ handoff package との delta（5 件）

### §6.1 既存 `marketing-webops-handoff-package.md`（Round 8 γ）との関係

Round 8 γ で確定した既存 handoff package は **6/27 公開向けの基本仕様** を確定済。本書は案 C ハイブリッド + 双フェーズ narrative 反映で **delta 5 件** を差分追加：

| # | delta 内容 | 既存 Round 8 γ への影響 |
|---|---|---|
| Delta-01 | 18×18 metric matrix 反映（既存 27 placeholder → 24 KPI 体系 v1.1） | 既存 SOP 維持、JSON schema 拡張 |
| Delta-02 | 双フェーズ narrative 反映（5/22 内部運用着手 + 6/27 公開） | 既存 §3 Section 構成に Section 8（内部運用着手） + Section 9（W1+sign-off 前倒し）追加 |
| Delta-03 | 5/19-5/30 staging dry-run（Round 9 batch 1 §6 Delta-03 を継承） | 既存 staging ライフサイクルに dry-run 11 日追加 |
| Delta-04 | timeline カード実装仕様（公開後 30 日動的開示） | 新規 `evolution-timeline.tsx` ファイル追加 |
| Delta-05 | `data-state="confirmed-2026-06-20"` + `confirmed-dynamic` 追加 | 既存 enum に 2 値追加、CSS class 4 件追加 |

### §6.2 delta の優先度

| Priority | delta # | 期日 | 担当 |
|---|---|---|---|
| P0（必須）| Delta-01 / Delta-05 | 6/22 段階 1 開始時 | Web-Ops |
| P0（必須）| Delta-02 | 6/22 段階 1 開始時 | Web-Ops + Marketing |
| P1（推奨）| Delta-04 | 6/22 段階 1 開始時 | Web-Ops |
| P2（任意）| Delta-03 | 5/19 dry-run 開始時 | Web-Ops |

---

## §7. 親文書整合性チェックリスト

- [x] DEC-019-052 (a)(b)(c) → 6/27 09:00 JST 公開時刻 + Channel 3 + tone 維持確認
- [x] DEC-019-027 / 028 / 029 → Heading A 維持 + 開示配分 80/50/100/概要 + HP 配置維持確認
- [x] DEC-019-033 / 051 / 055 / 056 → 全章で参照確認
- [x] Round 8 γ `marketing-webops-handoff-package.md` → §6 delta 5 件で差分追加、既存破壊なし
- [x] Round 8 γ `marketing-portfolio-staging-spec.md` → §6 Delta-05 で data-state enum 拡張、既存破壊なし
- [x] 既存ランブック `marketing-launch-runbook-2026-06-20.md` → §3.4 段階 4 で完全流用
- [x] narrative final draft / 18×18 matrix / metric plan v1.1 → §2 §3 で artifact 連動
- [x] 絵文字 0 件 / AI 感のある語彙 0 件 / 硬めトーン → 全体貫徹
- [x] Owner 残動作 = 既存ランブック流用 + 案 C 新規 2 回 → §4.2 で完全列挙
- [x] Web-Ops 独立実行可能性 → §5 で 100% 自己完結範囲確定

---

## §X 残課題（5/15 段階 1 開始までの残動作）

| # | 項目 | 担当 | 期日 |
|---|---|---|---|
| X1 | Marketing artifact A3 X thread final（独立ファイル `marketing-launch-x-thread-draft-final.md`） | Marketing | 6/22 |
| X2 | Marketing artifact A4 Zenn / note article final（独立ファイル `marketing-launch-zenn-note-article-final.md`） | Marketing | 6/22 |
| X3 | Web-Ops 部門への本書 v1 配布 + 受領 ack | CEO 経由 | 5/8 検収会議 |
| X4 | Web-Ops staging dry-run 計画 v1.1（本書 §1.1 整合） | Web-Ops | 5/15 |
| X5 | timeline カード data 構造 v1.1（本書 §5.3 確定後の Web-Ops 実装計画） | Web-Ops | 6/22 |

---

## §Y 提出メタ情報

| 項目 | 値 |
|---|---|
| 行数 | 約 285 行（要求 200-300 行内） |
| Marketing → Web-Ops handoff artifact | 5 系統（A1 narrative / A2 portfolio JSON / A3 X thread / A4 Zenn-note / A5 KPI JSON） |
| Web-Ops 段階 | 段階 1-4（6/22-6/27） |
| Owner 物理拘束 | 6/26 最終承認 30-45 分（既存ランブック流用、新規負担なし）+ 案 C ハイブリッド新規 2 回（7/4 / 7/27） |
| Web-Ops 自己完結範囲 | 100%（artifact 受領後は Marketing 介入不要） |
| Round 8 γ handoff package への delta | 5 件（Delta-01 〜 Delta-05） |
| 親戦略整合 | DEC-019-052 / 027 / 028 / 029 / 033 / 051 / 055 / 056 全 8 件 完全整合 |
| 既存成果物への影響 | 破壊的変更 0 件（Round 8 γ を破壊せず delta 追加） |
| commit / push | 実行しない（CEO が一括 push） |
| 関連報告 | `marketing-launch-narrative-final.md`（連動 narrative） / `marketing-portfolio-18x18.md`（連動 matrix） / `marketing-metric-plan-v1.1.md`（連動 KPI plan） / `marketing-webops-handoff-package.md`（Round 8 γ）/ `marketing-portfolio-staging-spec.md`（Round 8 γ）/ `marketing-launch-runbook-2026-06-20.md`（既存ランブック） |

---

**起案: Marketing 部門 R10 Marketing-ζ / 2026-05-04 深夜（Round 10 独立 Agent dispatch、DEC-019-025 SOP 準拠）/ Web-Ops handoff plan（6/27 公開時 自社 HP 反映、案 C ハイブリッド版）**
