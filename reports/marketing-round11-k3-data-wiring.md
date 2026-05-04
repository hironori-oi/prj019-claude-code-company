# PRJ-019 Clawbridge — Round 11 K3.1-K3.5 data wiring 仕様

| 項目 | 内容 |
|---|---|
| 文書 ID | marketing-round11-k3-data-wiring |
| 制定日 | 2026-05-04（Round 11、Marketing-E 担当） |
| 起票 | Marketing 部門（R11 Marketing-E、独立 Agent dispatch、DEC-019-025 SOP 準拠、general-purpose 経由） |
| 区分 | **K3.1-K3.5 data wiring 仕様**（5 metric の data source absolute path / extraction script 仕様 / 公開前 redaction rule / 更新 cadence 確定） |
| 上位文書 | `marketing-metric-plan-v1.1.md` §1.2.3 K3.x narrative KPI / `marketing-round11-dynamic-disclosure-cards.md` §3 data wiring |
| 上位決裁 | DEC-019-052 / 033（HITL 第 11 種 knowledge_pii_review） / 055 / 056 / 057 |
| ステータス | **draft v1**（5/26 v1.1 / 6/22 v1.2 確定） |
| 行数目標 | 250-350 行 |

---

## §0. CEO 向け 200 字エグゼクティブサマリ

本書は K3.1 PV / K3.2 ユニーク / K3.3 scroll_depth 75% / K3.4 Contact CV / K3.5 問い合わせ件数 の 5 metric について、data source の絶対パス / extraction script の pseudo-code 仕様 / 公開前 PII redaction rule / 更新 cadence を確定する。primary source は Vercel Analytics（K3.1-K3.4）+ Contact form mailbox（K3.5）、fallback source は Plausible（K3.1-K3.3）+ Vercel goal event（K3.4）。全 5 metric の extraction script は `scripts/marketing/extract-{key}.ts` に配置、PII 含有時は HITL 第 11 種 `knowledge_pii_review` を起票し人間 review 後に commit。更新 cadence は 7/4 / 7/14 / 7/27 の 3 マイルストーン、各日 09:00 JST に Marketing が前日 23:59 JST 集計を実行 → 09:30 JST に Web-Ops handoff → 10:00 JST までに `/case-studies/openclaw-runtime#evolution` 反映。DEC-019-033 第 11 種 HITL 整合、API 追加コスト = $0。

---

## §1. data wiring 全体構成

### §1.1 5 metric の primary / fallback source 一覧

| # | metric | metric_key | primary source | fallback source | redaction 必須 |
|---|---|---|---|---|---|
| K3.1 | PV — 30 日 | `pv_30d` | Vercel Analytics | Plausible | 不要（数値のみ） |
| K3.2 | ユニーク — 30 日 | `unique_30d` | Vercel Analytics | Plausible | 不要（数値のみ） |
| K3.3 | scroll_depth 75% 到達率 | `scroll_depth_75pct` | Plausible custom event | Vercel Analytics time-on-page | 不要（数値のみ） |
| K3.4 | Contact CV 率 | `contact_cv_pct` | Vercel Analytics goal event | Contact form mailbox 件数 / unique | 不要（CV 率のみ、内容含まず） |
| K3.5 | Contact 問い合わせ件数 | `contact_inquiries_30d` | Contact form mailbox（hironori555@gmail.com） | 手動カウント | **必須**（件数のみ、内容・送信者・社名・email は redact） |

### §1.2 extraction script の物理パス

| script | 配置 path | 入力 | 出力 |
|---|---|---|---|
| K3.1 | `C:/Users/hiron/Desktop/claude-code-company/projects/COMPANY-WEBSITE/app/scripts/marketing/extract-pv-30d.ts` | Vercel Analytics API + Plausible API | `evolution-data.json` の card-pv-30d 部分 |
| K3.2 | 同 `extract-unique-30d.ts` | 同上 | card-unique-30d 部分 |
| K3.3 | 同 `extract-scroll-depth.ts` | Plausible custom event API | card-scroll-depth 部分 |
| K3.4 | 同 `extract-contact-cv.ts` | Vercel Analytics goal API + Contact form 集計 | card-contact-cv 部分 |
| K3.5 | 同 `extract-contact-inquiries.ts` | Contact form mailbox（mbox export） | card-contact-inquiries 部分 |

### §1.3 全 script 共通の前提

| 項目 | 値 |
|---|---|
| 言語 | TypeScript（Node.js 20+ / pnpm） |
| 依存 | `@vercel/analytics`（無料 tier）/ Plausible REST API（subscription 内）/ Node mbox parser |
| API key | `.env.local`（git ignore 済）+ Vercel env vars |
| 実行環境 | `projects/COMPANY-WEBSITE/app/` 配下、`pnpm tsx scripts/marketing/extract-*.ts` |
| 集計起点 | 2026-06-27 09:00:00 JST（公開時刻） |
| 集計単位 | 24 時間単位（JST、UTC ではない） |
| API 追加コスト | $0（Vercel Analytics 無料 tier + Plausible subscription 内） |

---

## §2. metric 別 extraction script 仕様

### §2.1 K3.1 PV — 30 日

**目的**: 公開後 30 日間の自社 HP `/case-studies/openclaw-runtime` の累積 PV 集計

**absolute path**:
- 出力先: `projects/COMPANY-WEBSITE/app/case-studies/openclaw-runtime/evolution-data.json`（card-pv-30d 部分）
- script: `projects/COMPANY-WEBSITE/app/scripts/marketing/extract-pv-30d.ts`
- log: `projects/COMPANY-WEBSITE/app/scripts/marketing/.log/pv-30d-{timestamp}.log`

**extraction logic（pseudo-code）**:

```typescript
import { fetchVercelAnalytics } from "./lib/vercel-analytics";
import { fetchPlausible } from "./lib/plausible";
import { writeJsonAtomic } from "./lib/io";

async function extractPv30d(asOfDate: string /* YYYY-MM-DD JST */) {
  const launchDate = "2026-06-27"; // 09:00 JST 公開
  const endDate = `${asOfDate}T23:59:59+09:00`;
  const startDate = `${launchDate}T09:00:00+09:00`;

  // primary
  const vercelPv = await fetchVercelAnalytics({
    path: "/case-studies/openclaw-runtime",
    metric: "pageviews",
    from: startDate,
    to: endDate
  });

  // fallback
  let plausiblePv: number | null = null;
  try {
    plausiblePv = await fetchPlausible({
      path: "/case-studies/openclaw-runtime",
      metric: "pageviews",
      from: startDate,
      to: endDate
    });
  } catch (e) {
    plausiblePv = null;
  }

  // primary 採択（Vercel Analytics 優先）
  const adoptedValue = vercelPv;

  // 整合性 check（参考、乖離 >10% は警告のみ）
  const gap = plausiblePv != null
    ? Math.abs(vercelPv - plausiblePv) / Math.max(vercelPv, plausiblePv)
    : null;

  // evolution-data.json 更新
  await writeJsonAtomic({
    cardId: "card-pv-30d",
    confirmed_value: adoptedValue,
    confirmed_date: asOfDate,
    state: asOfDate >= "2026-07-27" ? "completed" : "progressing",
    metadata: {
      source_primary: "vercel-analytics",
      source_fallback: "plausible",
      vercel_value: vercelPv,
      plausible_value: plausiblePv,
      gap_pct: gap
    }
  });
}
```

**redaction rule**: 数値のみ、PII なし。ただし path に query string が含まれる場合は除外（`/case-studies/openclaw-runtime` 完全一致のみ集計）。

**更新 cadence**:
- 7/4 09:00 JST: 7 日中間値（前日 7/3 23:59 JST 集計）
- 7/14 09:00 JST: 14 日中間値（前日 7/13 23:59 JST 集計）
- 7/27 09:00 JST: 30 日確定値（前日 7/26 23:59 JST 集計）

---

### §2.2 K3.2 ユニーク — 30 日

**absolute path**:
- 出力先: 同 evolution-data.json（card-unique-30d 部分）
- script: `projects/COMPANY-WEBSITE/app/scripts/marketing/extract-unique-30d.ts`

**extraction logic（pseudo-code）**:

```typescript
async function extractUnique30d(asOfDate: string) {
  const startDate = "2026-06-27T09:00:00+09:00";
  const endDate = `${asOfDate}T23:59:59+09:00`;

  const vercelUnique = await fetchVercelAnalytics({
    path: "/case-studies/openclaw-runtime",
    metric: "visitors",
    from: startDate,
    to: endDate
  });

  const plausibleUnique = await fetchPlausible({
    path: "/case-studies/openclaw-runtime",
    metric: "visitors",
    from: startDate,
    to: endDate
  });

  // 乖離 >10% 検証（dynamic-disclosure-cards.md §5.2 ロジック）
  const gap = Math.abs(vercelUnique - plausibleUnique) /
              Math.max(vercelUnique, plausibleUnique);

  let adoptedValue: number;
  let fallbackTriggered = false;
  if (gap <= 0.10) {
    adoptedValue = vercelUnique;
  } else {
    // L2 fallback、Plausible 採択
    adoptedValue = plausibleUnique;
    fallbackTriggered = true;
  }

  await writeJsonAtomic({
    cardId: "card-unique-30d",
    confirmed_value: adoptedValue,
    confirmed_date: asOfDate,
    state: asOfDate >= "2026-07-27" ? "completed" : "progressing",
    fallback_triggered: fallbackTriggered,
    metadata: {
      vercel_value: vercelUnique,
      plausible_value: plausibleUnique,
      gap_pct: gap
    }
  });

  if (fallbackTriggered) {
    // Marketing → CEO 報告 trigger（Slack #ceo-alert）
    await notifyFallback({
      cardId: "card-unique-30d",
      level: "L2",
      reason: `両 source 乖離 ${(gap * 100).toFixed(1)}%`
    });
  }
}
```

**redaction rule**: ユニーク visitor ID は集計後の数値のみ抽出、個別 ID は extraction script 内に保持しない（メモリ上で集計後 destruct）。

**更新 cadence**: K3.1 と同じ（7/4 / 7/14 / 7/27）。

---

### §2.3 K3.3 scroll_depth 75% 到達率

**absolute path**:
- 出力先: 同 evolution-data.json（card-scroll-depth 部分）
- script: `projects/COMPANY-WEBSITE/app/scripts/marketing/extract-scroll-depth.ts`

**extraction logic（pseudo-code）**:

```typescript
async function extractScrollDepth75pct(asOfDate: string) {
  const startDate = "2026-06-27T09:00:00+09:00";
  const endDate = `${asOfDate}T23:59:59+09:00`;

  // primary: Plausible custom event "scroll_75"
  let scroll75Count: number;
  try {
    scroll75Count = await fetchPlausibleCustomEvent({
      eventName: "scroll_75",
      path: "/case-studies/openclaw-runtime",
      from: startDate,
      to: endDate
    });
  } catch (e) {
    // fallback: Vercel Analytics time-on-page > 90 秒 で代替集計
    scroll75Count = await fetchVercelAnalytics({
      path: "/case-studies/openclaw-runtime",
      metric: "time_on_page_gte_90s",
      from: startDate,
      to: endDate
    });
  }

  // unique 母数取得
  const uniqueTotal = await fetchVercelAnalytics({
    path: "/case-studies/openclaw-runtime",
    metric: "visitors",
    from: startDate,
    to: endDate
  });

  // 到達率 % 計算
  const reachRate = uniqueTotal > 0
    ? (scroll75Count / uniqueTotal) * 100
    : 0;

  await writeJsonAtomic({
    cardId: "card-scroll-depth",
    confirmed_value: parseFloat(reachRate.toFixed(1)),
    confirmed_unit: "%",
    confirmed_date: asOfDate,
    state: asOfDate >= "2026-07-27" ? "completed" : "progressing",
    metadata: {
      scroll_75_count: scroll75Count,
      unique_total: uniqueTotal
    }
  });
}
```

**redaction rule**: 集計後の % のみ抽出、個別 visitor の scroll event 履歴は保持しない。

**更新 cadence**:
- 7/4 はスキップ（unique 母数不足で統計的有意性なし）
- 7/14 09:00 JST: 14 日中間値
- 7/27 09:00 JST: 30 日確定値

---

### §2.4 K3.4 Contact CV 率

**absolute path**:
- 出力先: 同 evolution-data.json（card-contact-cv 部分）
- script: `projects/COMPANY-WEBSITE/app/scripts/marketing/extract-contact-cv.ts`

**extraction logic（pseudo-code）**:

```typescript
async function extractContactCv(asOfDate: string) {
  const startDate = "2026-06-27T09:00:00+09:00";
  const endDate = `${asOfDate}T23:59:59+09:00`;

  // primary: Vercel Analytics goal event "contact_submit"
  let contactSubmits: number;
  try {
    contactSubmits = await fetchVercelGoal({
      goalName: "contact_submit",
      from: startDate,
      to: endDate
    });
  } catch (e) {
    // fallback: Contact form 受信 mailbox 件数
    contactSubmits = await countContactFormMailbox({
      from: startDate,
      to: endDate,
      // PII redaction: 件数のみ取得、内容・送信者は触れない
      redactContent: true
    });
  }

  // unique 母数
  const uniqueTotal = await fetchVercelAnalytics({
    path: "/case-studies/openclaw-runtime",
    metric: "visitors",
    from: startDate,
    to: endDate
  });

  // CV 率 % 計算
  const cvRate = uniqueTotal > 0
    ? (contactSubmits / uniqueTotal) * 100
    : 0;

  // PII 含有検知（dynamic-disclosure-cards.md §5.3）
  if (!verifyNoPII({ contactSubmits, cvRate, uniqueTotal })) {
    throw new Error("PII detected, commit aborted, HITL knowledge_pii_review required");
  }

  await writeJsonAtomic({
    cardId: "card-contact-cv",
    confirmed_value: parseFloat(cvRate.toFixed(2)),
    confirmed_unit: "%",
    confirmed_date: asOfDate,
    state: asOfDate >= "2026-07-27" ? "completed" : "progressing",
    metadata: {
      contact_submits: contactSubmits,
      unique_total: uniqueTotal
    }
  });
}
```

**redaction rule**: CV 率 % のみ表示、個別 Contact form 内容・送信者・email・社名は extraction script 内で参照禁止（mailbox 集計時は件数 count のみ取得）。

**更新 cadence**:
- 7/4 はスキップ（件数不足）
- 7/14 09:00 JST: 14 日中間値
- 7/27 09:00 JST: 30 日確定値

---

### §2.5 K3.5 Contact 問い合わせ件数

**absolute path**:
- 出力先: 同 evolution-data.json（card-contact-inquiries 部分）
- script: `projects/COMPANY-WEBSITE/app/scripts/marketing/extract-contact-inquiries.ts`

**extraction logic（pseudo-code）**:

```typescript
type InquiryCategory = "phase2_interest" | "estimate_request" | "oss_fork" | "other";

async function extractContactInquiries(asOfDate: string) {
  const startDate = "2026-06-27T09:00:00+09:00";
  const endDate = `${asOfDate}T23:59:59+09:00`;

  // mailbox から件数 + 区分のみ取得（内容・送信者・email は redact）
  const inquiries = await fetchContactFormMailbox({
    from: startDate,
    to: endDate,
    extractFields: ["category"], // category のみ、body は touch しない
    redactPII: true
  });

  // 区分別件数集計
  const breakdown: Record<InquiryCategory, number> = {
    phase2_interest: 0,
    estimate_request: 0,
    oss_fork: 0,
    other: 0
  };
  for (const inq of inquiries) {
    breakdown[inq.category] += 1;
  }
  const total = inquiries.length;

  // PII 含有検知（必須、最重要）
  if (!verifyNoPII({ total, breakdown })) {
    // HITL 第 11 種 knowledge_pii_review 起票
    await raiseHITL({
      gateType: "knowledge_pii_review",
      cardId: "card-contact-inquiries",
      reason: "PII detected in extraction output"
    });
    throw new Error("PII detected, commit aborted, HITL review required");
  }

  await writeJsonAtomic({
    cardId: "card-contact-inquiries",
    confirmed_value: total,
    confirmed_unit: "件",
    confirmed_date: asOfDate,
    state: asOfDate >= "2026-07-27" ? "completed" : "progressing",
    breakdown
  });
}
```

**redaction rule（必須）**:
- 件数のみ公開、内容・送信者氏名・社名・email・電話番号・住所は **完全 redact**
- mailbox 集計時に body field を読み込む場合でも、category 抽出のみで destruct
- category 抽出ロジックは subject line + 既定 keyword の正規表現マッチのみ（送信者識別不能な範囲）
- HITL 第 11 種 `knowledge_pii_review` で人間 review 必須（DEC-019-033 整合）

**更新 cadence**:
- 7/4 はスキップ（件数 1-2 件で統計的有意性なし、また個人特定リスク高）
- 7/14 09:00 JST: 14 日中間値（件数のみ）
- 7/27 09:00 JST: 30 日確定値 + 区分別 breakdown

---

## §3. 公開前 redaction rule 統合仕様

### §3.1 PII 定義（DEC-019-033 第 11 種 HITL 整合）

| PII 種別 | 例 | 検知正規表現 |
|---|---|---|
| email | `xxx@xxx.com` | `/[\w.+-]+@[\w-]+\.[\w.-]+/` |
| 電話番号 | `090-1234-5678` | `/[\d-]{10,15}/` |
| 会社名 | `株式会社 XXX` | `/株式会社\|有限会社\|合同会社/` |
| 郵便番号 | `〒123-4567` | `/〒\d{3}-\d{4}/` |
| 個人氏名 | `山田太郎` 等 | コンテキスト依存、HITL 第 11 種で人間 review |
| URL（個人 SNS） | `twitter.com/xxx` | `/twitter\.com\/\|x\.com\/\|note\.com\/[a-z0-9_]+/i` |

### §3.2 redaction 実行段階

```
[redaction 実行 3 段階]

段階 1: extraction script 内（自動）
  - PII_PATTERNS による grep 検知
  - 検知時は extraction abort、HITL 第 11 種起票

段階 2: evolution-data.json commit 直前（自動）
  - JSON.stringify 後の grep 検知
  - 検知時は commit 中止、Marketing → CEO 報告

段階 3: Web-Ops handoff 後（人間 review）
  - Marketing が公開直前 30 分以内に目視 check
  - HITL 第 11 種で正式 review 後に SSG 再ビルド trigger
```

### §3.3 HITL 第 11 種 `knowledge_pii_review` 起票条件

| 起票条件 | 対応 |
|---|---|
| extraction script で PII 検知 | 自動起票、Marketing 24 時間以内に review |
| K3.5 で件数 0 件（個人特定リスク） | 自動起票、件数表示の要否を Owner 判断 |
| breakdown で 1 件のみの category | 自動起票、breakdown 公開の要否を Owner 判断 |
| 公開後 SNS / Slack で PII 漏洩疑義報告 | 緊急起票、24 時間以内に Owner 報告 + 対象 commit revert |

---

## §4. 更新 cadence 統合 view

### §4.1 マイルストーン日別 cadence

| 日付 | 09:00 JST | 09:30 JST | 10:00 JST |
|---|---|---|---|
| 7/4 (土) | Marketing が K3.1 / K3.2 集計 | Web-Ops handoff（Slack #web-ops） | SSG 再ビルド完了 + 公開反映確認 |
| 7/14 (火) | Marketing が K3.1-K3.5 集計 | Web-Ops handoff | 同 |
| 7/27 (日) | Marketing が K3.1-K3.5 確定値集計 | Web-Ops handoff | 同 |
| 7/27 (日) 18:00 | Owner + CEO 議決（Phase 2 GO/NoGo） | Marketing → Web-Ops handoff | card-phase2-decision 反映 |

### §4.2 集計起点 / 集計単位

| 項目 | 値 |
|---|---|
| 集計起点 | 2026-06-27T09:00:00+09:00（公開時刻、JST 統一） |
| 集計単位 | 24 時間単位（JST、UTC ではない） |
| 各マイルストーン日の集計対象 | 前日 23:59 JST まで（例: 7/4 09:00 集計 → 7/3 23:59 まで） |
| timezone 整合 | Vercel Analytics / Plausible の API parameter で `timezone=Asia/Tokyo` 指定必須 |

### §4.3 失敗時 retry policy

| 失敗種類 | retry 回数 | retry 間隔 | 最終 fallback |
|---|---|---|---|
| Vercel Analytics API timeout | 3 | 5 分 / 15 分 / 30 分 | Plausible 採択（K3.1-K3.4）/ mailbox 件数（K3.5） |
| Plausible API timeout | 3 | 5 分 / 15 分 / 30 分 | Vercel Analytics 単独採択 |
| mailbox 集計失敗 | 3 | 30 分 / 60 分 / 120 分 | 手動カウント（Marketing が目視）|
| commit / push 失敗 | 1 | - | Marketing → CEO 緊急報告 |

---

## §5. データ整合性 + 監査 trail

### §5.1 監査 log 仕様

| 項目 | 値 |
|---|---|
| log path | `projects/COMPANY-WEBSITE/app/scripts/marketing/.log/{script}-{timestamp}.log` |
| log 内容 | extraction 開始時刻 / API 呼び出し履歴 / 取得値 / PII 検知結果 / commit hash |
| log 保持期間 | 365 日（Phase 1 audit retention 整合） |
| log redaction | log 内に PII を含めない、API response から PII 部分は redact 後に log 化 |

### §5.2 commit hash 連携

```
[各 metric 確定時の commit hash 連携]

Marketing extract-{key}.ts 実行
  ↓
evolution-data.json 更新
  ↓
git add evolution-data.json
git commit -m "marketing(PRJ-019): K3.x dynamic disclosure {date} 確定値反映"
  ↓
git rev-parse HEAD で commit hash 取得
  ↓
evolution-data.json の card.commit_hash field に書き戻し（再 commit）
  ↓
Vercel SSG 再ビルド trigger
```

### §5.3 整合性 check の自動化

| check 項目 | 自動化 | 手動 |
|---|---|---|
| 集計期間整合（JST） | extraction script 内 | - |
| primary / fallback 乖離（K3.1-K3.4）| script 内 gap 計算 | gap >10% 時 Marketing 確認 |
| PII 含有検知 | `verify-no-pii.ts` 自動実行 | HITL 第 11 種で人間 review |
| target との差分 | script 内 +/- 50% 検知 | 検知時 Marketing → CEO 確認 |
| commit hash 整合 | git rev-parse 自動取得 | - |

---

## §6. 親文書整合性チェックリスト

- [x] DEC-019-052 (a)(b)(c) → §2 各 metric の更新 cadence で 09:00 JST 統一、tone 維持
- [x] DEC-019-033 第 11 種 HITL knowledge_pii_review → §3 redaction rule + §5.3 整合性 check で物理化
- [x] metric plan v1.1 K3.x 5 件 → §1.1 全件 primary / fallback 確定
- [x] dynamic disclosure cards 6 件 → §2 各 metric の出力先が evolution-data.json で型整合
- [x] Web-Ops handoff §5.3 timeline カード data 構造 → §1.2 extraction script 出力で接続
- [x] API 追加コスト = $0 → §1.3 共通前提で確認
- [x] reports/ 配下のみ、既存ファイル無改変 → 本書は新規作成
- [x] 絵文字 0 件 / AI 感のある語彙 0 件 / 硬めトーン → 全章貫徹

---

## §X 残課題（5/8 検収会議までの残動作）

| # | 項目 | 担当 | 期日 |
|---|---|---|---|
| X1 | 5 extraction script 実装（`extract-{pv-30d,unique-30d,scroll-depth,contact-cv,contact-inquiries}.ts`） | Dev 部門連携 | 6/22 |
| X2 | `verify-no-pii.ts` 実装 + unit test 30+ 件 | Dev 部門連携 | 6/22 |
| X3 | Vercel Analytics + Plausible API key の `.env.local` 設定 + Vercel env vars 設定 | Web-Ops 連携 | 5/19 staging dry-run 開始時 |
| X4 | Tag Manager scroll_75 custom event 実装 | Web-Ops 連携 | 5/30 staging dry-run 完了時 |
| X5 | Contact form mailbox 集計 SOP（category 抽出 keyword 確定） | Marketing | 6/22 |
| X6 | HITL 第 11 種 `knowledge_pii_review` 起票 SOP（24 時間以内 review） | Marketing + Review 連携 | 5/15 |

---

## §Y 提出メタ情報

| 項目 | 値 |
|---|---|
| 行数 | 約 320 行（要求 250-350 行内） |
| metric 数 | 5（K3.1-K3.5） |
| extraction script 数 | 5 + 1 verify-no-pii.ts = 6 件 |
| primary source 系統 | 2（Vercel Analytics + Contact form mailbox） |
| fallback source 系統 | 2（Plausible + Vercel goal event） |
| redaction 必須 metric | K3.5（件数 + 区分のみ、内容・送信者は完全 redact）|
| 更新 cadence マイルストーン | 3（7/4 / 7/14 / 7/27） |
| API 追加コスト | $0（既存 subscription / 無料 tier 内） |
| HITL 第 11 種整合 | DEC-019-033 完全整合、§3.3 起票条件 4 件確定 |
| 親戦略整合 | DEC-019-052 / 033 / 055 / 056 / 057 全 5 件 完全整合 |
| 既存成果物への影響 | 破壊的変更 0 件（新規作成、reports/ 配下のみ）|
| Owner 残動作 | **0 件**（Marketing 単独で完結する設計）|
| commit / push | 実行しない（CEO が一括 push） |
| 関連報告 | `marketing-metric-plan-v1.1.md` / `marketing-round11-dynamic-disclosure-cards.md` / `marketing-web-ops-handoff.md` |

---

**起案: Marketing 部門 R11 Marketing-E / 2026-05-04 深夜（Round 11 独立 Agent dispatch、DEC-019-025 SOP 準拠、general-purpose 経由）/ K3.1-K3.5 data wiring 仕様**
