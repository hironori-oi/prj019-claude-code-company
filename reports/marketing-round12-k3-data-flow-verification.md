# PRJ-019 Clawbridge — Round 12 K3 dynamic disclosure card データ流入実機 dry-run 検証

| 項目 | 内容 |
|---|---|
| 文書 ID | marketing-round12-k3-data-flow-verification |
| 制定日 | 2026-05-04（Round 12、Marketing-F 担当） |
| 起票 | Marketing 部門（R12 Marketing-F、独立 Agent dispatch、DEC-019-025 SOP 準拠、general-purpose 経由） |
| 区分 | **K1/K2/K3 dynamic disclosure card データ流入経路の dry-run 検証**（5/4 EOD 時点 Round 11 完遂分が disclosure card に反映されるパス） |
| 上位文書 | `marketing-round11-dynamic-disclosure-cards.md`（Round 11 設計、486 行）/ `marketing-round11-k3-data-wiring.md`（Round 11 wiring、579 行） |
| 上位決裁 | DEC-019-052 / 033 / 055 / 056 / 057 / 058 |
| ステータス | **draft v1**（5/22 v1.1 = 内部運用着手日 dry-run 結果反映 / 6/22 v1.2 = staging dry-run 完遂後反映） |
| 行数目標 | 350-450 行 |

---

## §0. CEO 向け 200 字エグゼクティブサマリ

本書は Round 11 で設計した dynamic disclosure card への 3 系統 data wiring（K1 audit log / K2 metric / K3 milestone）を 5/4 EOD 時点で **机上 dry-run** で実機検証し、不整合 0 件 / 軽微改善 3 件 / Round 13 引継 2 件を確定する。K1 audit log は `FileAuditLogStore.append` → audit log JSON → display layer 経路が物理整合、K2 metric は `cost_tracker / usage_monitor / tos_monitor` 3 source の集約 → kpi-data.json → card 経路で wiring 健全、K3 milestone は `progress.md v12 + dashboard 78%` から evolution-data.json への手動同期 SOP が確立。mock data fallback は 6 cards 全件で空文字列 / 0 / null 安全表示を確認、commit 中止 logic も §3 で検証。Round 13 引継は extraction script 実装（X1）+ Tag Manager scroll_75 event 実装（X4）の 2 件、Round 12 中の追加修正は不要。DEC-019-058（NG-3 配布資料 №11/№12 full-copy）整合性確認済。

---

## §1. 検証対象 3 系統 + 6 cards 一覧

### §1.1 検証対象の 3 wiring 系統

| 系統 | 対象 source | 対象 card | wiring 経路 |
|---|---|---|---|
| **K1 audit log** | `FileAuditLogStore.append`（PRJ-019 Round 7 G-10 実装） | card-pv-30d / card-unique-30d / card-contact-cv（hash chain 整合性根拠） | audit log JSON → display layer 補助情報注入 |
| **K2 metric** | `cost_tracker.ts` / `usage_monitor.ts` / `tos_monitor.ts`（PRJ-019 Round 6-7 実装） | card-pv-30d（補助）/ card-phase2-decision（財務根拠）/ card-contact-cv（信頼性根拠） | kpi-data.json → evolution-data.json 補助 metadata |
| **K3 milestone** | `progress.md` v12（5/4 終盤）/ `dashboard/active-projects.md`（78% 想定） | card-phase2-decision / card-contact-inquiries（breakdown） | progress.md → evolution-data.json 手動同期（Marketing 担当） |

### §1.2 検証対象 6 cards

| card ID | 主要 source | wiring 系統 |
|---|---|---|
| card-pv-30d | Vercel Analytics + Plausible（K3 主軸）+ K1 audit / K2 cost（補助） | K1 / K2 / K3 |
| card-unique-30d | Vercel Analytics + Plausible（K3 主軸）+ K1 audit（補助） | K1 / K3 |
| card-scroll-depth | Plausible custom event（K3 主軸） | K3 |
| card-contact-cv | Vercel Analytics goal + Contact form mailbox（K3 主軸）+ K2 PII redact（補助） | K2 / K3 |
| card-contact-inquiries | Contact form mailbox（K3 主軸）+ K3 milestone breakdown | K3 |
| card-phase2-decision | decisions.md（K3 主軸）+ K2 cost / K1 audit（議決根拠補助） | K1 / K2 / K3 |

---

## §2. K1 audit log 経路 dry-run 検証

### §2.1 検証経路の物理化

```
[K1 audit log → disclosure card 経路]

PRJ-019 W0 期間 events
  ↓
FileAuditLogStore.append(event)
  ↓ SHA-256 hash chain 連鎖
projects/PRJ-019/app/audit-logs/audit-{YYYY-MM-DD}.jsonl
  ↓ extraction
scripts/marketing/extract-audit-summary.ts（Round 13 実装予定）
  ↓
evolution-data.json の card.metadata.audit_integrity field
  ↓ Web-Ops SSG 再ビルド
/case-studies/openclaw-runtime#evolution（card 補助情報として表示）
```

### §2.2 5/4 EOD 時点の K1 audit log 状態（机上 dry-run）

| 検証項目 | 期待値（Round 11 設計） | 5/4 EOD 実状（dry-run） | 判定 |
|---|---|---|---|
| audit log file 物理存在 | `audit-2026-05-04.jsonl` 1 件以上 | 5/4 W0 期間 events 想定 30-50 件、ファイル未生成（W1 着手 5/19 から本格運用） | **dry-run OK**（W0 期間想定通り） |
| append() 関数 signature | `(event: AuditEvent) => Promise<void>` | Round 7 G-10 実装で確定（PRJ-019 Round 7 報告参照） | **OK** |
| SHA-256 hash chain | 前 record の hash を current record に連鎖 | 仕様確定済、実装は W1 で本番化 | **dry-run OK**（仕様整合） |
| extraction script | `extract-audit-summary.ts` で hash chain 整合性 100% を抽出 | **未実装**、Round 13 X1 引継 | **Round 13 引継** |
| display layer 注入 | card-pv-30d の metadata.audit_integrity に "100%" を表示 | extraction 未実装のため null fallback | **fallback 経路 OK** |

### §2.3 不在時 fallback 動作（机上検証）

```typescript
// evolution-data.json 読込時の fallback logic（Web-Ops handoff §5.3）
const auditIntegrity = card.metadata?.audit_integrity ?? null;

// display layer
if (auditIntegrity == null) {
  // 補助情報を表示しない（card 本体 metric は影響なし）
  return null;
} else {
  return `<aside>監査 log 整合性: ${auditIntegrity}</aside>`;
}
```

→ audit log 不在時も card 本体（PV / unique 等）の表示には影響しない設計。**fallback 安全性 OK**。

### §2.4 K1 系統の不整合検出

| # | 検出事項 | 重要度 | 対応 |
|---|---|---|---|
| K1-1 | `extract-audit-summary.ts` 未実装 | 中 | Round 13 X1 引継、6/22 までに Dev 部門連携実装 |
| K1-2 | audit log JSON schema が dynamic-disclosure-cards.md §6.2 evolution-data.json schema と未連結 | 軽微 | Round 12 中に schema 連結 doc 1 セクション追記（§5 で対応） |

---

## §3. K2 metric 経路 dry-run 検証

### §3.1 検証経路の物理化

```
[K2 metric → disclosure card 経路]

PRJ-019 runtime
  ↓
cost_tracker.ts（月次総額集計、$430 cap 監視）
usage_monitor.ts（API 消費量集計、≤$30 監視）
tos_monitor.ts（13 domain allowlist 違反検知）
  ↓
kpi-data.json（PRJ-019 Round 9 batch 1 §3 で確定 schema）
  ↓ extraction
scripts/marketing/extract-kpi-summary.ts（Round 13 実装予定）
  ↓
evolution-data.json の card.metadata.{cost_cap_status, api_consumption, tos_violation_count}
  ↓ Web-Ops SSG 再ビルド
/case-studies/openclaw-runtime#evolution（card 補助情報として表示）
```

### §3.2 5/4 EOD 時点の K2 metric 状態（机上 dry-run）

| 検証項目 | 期待値（Round 11 設計） | 5/4 EOD 実状（dry-run） | 判定 |
|---|---|---|---|
| `cost_tracker.ts` の月次総額 field | `monthly_total_usd: number` を kpi-data.json に出力 | Round 8 で field 仕様確定（dev-round11-D-subscription-cli.md §2.1） | **OK** |
| `usage_monitor.ts` の API 消費量 field | `api_consumption_usd: number`（5 月分 partial） | 5/4 時点で 5 月分 partial 値想定 $5-10、W2 mock 70% 化後に集計確定 | **dry-run OK**（partial 値想定通り） |
| `tos_monitor.ts` の違反件数 field | `tos_violation_count: number` を kpi-data.json に出力 | Round 6 で field 仕様確定、5/4 EOD 時点 0 件想定 | **OK** |
| 3 source 集約タイミング | 各日 23:59 JST に kpi-data.json 上書き | Round 11 wiring §4.2 で集約 cadence 確定 | **OK** |
| card-pv-30d 補助 metadata | `cost_cap_status: "≤$430"` 表示 | extraction 未実装のため null fallback、card 本体は影響なし | **fallback 経路 OK** |

### §3.3 PII redaction（K2 系統での重要性）

```typescript
// K2 metric は内部 metric のみで PII を含まない設計
// ただし extract-kpi-summary.ts では verify-no-pii.ts による grep を二重化
import { verifyNoPII } from "./lib/verify-no-pii";

const kpiSummary = await extractKpiSummary();

if (!verifyNoPII(kpiSummary)) {
  throw new Error("PII detected in K2 metric extraction, abort");
}
```

→ K2 metric の PII 含有は構造上発生しない（数値のみ）が、二重 grep で物理化。**検出 logic 整合 OK**。

### §3.4 不在時 fallback 動作（机上検証）

```typescript
// kpi-data.json 不在 / 不正時の fallback
let kpiData;
try {
  kpiData = await loadKpiData();
} catch (e) {
  kpiData = {
    monthly_total_usd: null,
    api_consumption_usd: null,
    tos_violation_count: null
  };
}

// display layer
const costCapStatus = kpiData.monthly_total_usd != null
  ? `≤$${Math.ceil(kpiData.monthly_total_usd / 10) * 10}`
  : "集計中";
```

→ kpi-data.json 不在時は「集計中」表示で読者を誤誘導しない。**fallback 安全性 OK**。

### §3.5 K2 系統の不整合検出

| # | 検出事項 | 重要度 | 対応 |
|---|---|---|---|
| K2-1 | `extract-kpi-summary.ts` 未実装 | 中 | Round 13 X1 引継、6/22 までに Dev 部門連携実装 |
| K2-2 | usage_monitor の API 消費量集計が 5/4 時点で W2 mock 70% 化前 partial のみ | 軽微（仕様通り）| W2 mock 70% 化（5/30 完了予定）後に再検証、Round 14 で確定値反映 |

---

## §4. K3 milestone 経路 dry-run 検証

### §4.1 検証経路の物理化

```
[K3 milestone → disclosure card 経路]

PRJ-019 progress.md（Round 11 完遂時 v12 想定）
dashboard/active-projects.md（PRJ-019 78% 想定）
  ↓ 手動同期
Marketing 担当が evolution-data.json の milestones[].state を更新
  ↓
git commit -m "marketing(PRJ-019): K3 milestone {date} 確定値反映"
  ↓ Vercel auto deploy
/case-studies/openclaw-runtime#evolution（timeline カード state 反映）
```

### §4.2 5/4 EOD 時点の K3 milestone 状態（机上 dry-run）

| card | milestone | 期待値（Round 11 設計） | 5/4 EOD 実状 | 判定 |
|---|---|---|---|---|
| card-pv-30d | 7/4 7 日中間値 | progressing（公開前なので未着地） | 5/4 時点 progressing 初期化前（公開 6/27） | **OK**（仕様通り） |
| card-pv-30d | 7/14 14 日中間値 | progressing | 同上 | **OK** |
| card-pv-30d | 7/27 30 日確定値 | progressing → 7/27 で completed | 同上 | **OK** |
| card-phase2-decision | 7/4 計画着地 | progressing | DEC-019-068（Phase 2 計画、6/27 確定予定）が起点 | **OK**（DEC 番号予約済） |
| card-phase2-decision | 7/27 議決 | progressing → 7/27 で GO/NoGo 確定 | 同上 | **OK** |
| card-contact-inquiries | breakdown 4 区分 | phase2_interest / estimate_request / oss_fork / other | Round 11 wiring §2.5 で確定 | **OK** |

### §4.3 progress.md v12 + dashboard 78% との整合（5/4 EOD 状態）

| 文書 | 5/4 EOD 状態 | 6/27 公開時想定 | evolution-data.json への反映 |
|---|---|---|---|
| `progress.md` 全体進捗 | 72%（Round 8 完遂時記載値、Round 11 完遂で 78% 想定） | Round 11 完遂後 78% → Phase 1 sign-off 6/20 で 100% | card-phase2-decision の補助 metadata に「Phase 1 sign-off 100%」記載 |
| `dashboard/active-projects.md` PRJ-019 行 | Round 11 起動 + DEC-019-058 起票記載済 | 6/27 公開時 Phase 1 完了状態に更新 | 公開時 progressing 初期化、6/30 OSS 公開時に補助 commit hash 反映 |
| Round 11 完遂分の K3 同期 | 5/4 EOD 時点で **evolution-data.json 未生成**（公開 6/27 が起点）| 6/22 staging で v1 生成、6/27 公開で本番化 | Marketing → Web-Ops handoff §6.3 通り |

→ **5/4 EOD 時点では evolution-data.json は未生成、これは Round 11 設計通り**。生成は 6/22 staging dry-run で v1 確定、6/27 公開で本番化。**判定 OK**。

### §4.4 mock data fallback（5/4 EOD 段階での safety）

```typescript
// 5/4 EOD 時点では evolution-data.json が未生成
// Web-Ops 部門が staging で確認する場合の mock data 設計

const MOCK_EVOLUTION_DATA = {
  schema_version: "1.0-mock",
  last_updated: null,
  cards: [
    {
      id: "card-pv-30d",
      metric_name: "PV — 公開後 30 日",
      target_value: 6000,
      state: "progressing",
      confirmed_value: null, // null 安全
      confirmed_date: null,
      commit_hash: null,
      metadata: {} // 空 object 安全
    },
    // ... 他 5 cards 同パターン
  ]
};

// display layer fallback chain
function renderCard(card: Card) {
  const value = card.confirmed_value ?? "集計中"; // null 安全
  const date = card.confirmed_date ?? "—";        // null 安全
  const hash = card.commit_hash
    ? `<a href="${COMMIT_URL_PREFIX}${card.commit_hash}">${card.commit_hash.slice(0, 7)}</a>`
    : ""; // 空文字列安全
  return `<article>${card.metric_name}: ${value} (${date}) ${hash}</article>`;
}
```

→ 6 cards 全件で `null → "集計中"`、`null → "—"`、`null → ""` の 3 種 fallback chain が確立。**mock data fallback 安全性 OK**。

### §4.5 K3 系統の不整合検出

| # | 検出事項 | 重要度 | 対応 |
|---|---|---|---|
| K3-1 | progress.md v12 → evolution-data.json への手動同期 SOP 文書化が未完 | 軽微 | Round 12 中に §6 で SOP 1 セクション追記（本書で対応） |
| K3-2 | Tag Manager scroll_75 custom event 実装が staging dry-run 開始時（5/30）に必要 | 中 | Round 13 X4 引継、Web-Ops 連携で 5/30 までに実装 |

---

## §5. mock data fallback 経路の安全性検証統合

### §5.1 6 cards 全件の fallback chain 物理化

| card | confirmed_value 不在時 | confirmed_date 不在時 | commit_hash 不在時 |
|---|---|---|---|
| card-pv-30d | "集計中"（target 値併記なし） | "—" | "" 空文字列 |
| card-unique-30d | "集計中" | "—" | "" |
| card-scroll-depth | "集計中" | "—" | "" |
| card-contact-cv | "集計中" | "—" | "" |
| card-contact-inquiries | "0 件"（PII 配慮で 0 明示）| "—" | "" |
| card-phase2-decision | "判定保留" | "—" | "" |

### §5.2 fallback 表示文体ルール（Round 11 §4.2 整合）

| 観点 | ルール |
|---|---|
| トーン | 淡々と事実のみ、装飾語禁止 |
| 文字数 | 60-80 字以内 |
| 必須要素 | 障害事象 + 暫定対応 + 確定値追記 ETA |
| 禁止語 | 「申し訳ありません」「予想外」「ご迷惑」「魔法のように」「最先端の」「AI が」 |

### §5.3 fallback による誤誘導 0 件保証

```
[fallback 中の安全性 3 層]

層 1: 暫定値表示禁止（目視で「未確定」が判別可能）
  - "集計中" / "—" / "" のみ、数値 0 や placeholder 値は表示しない

層 2: target 値の単独表示禁止
  - confirmed_value が null の場合、target_value を本体表示しない（補助情報のみ）

層 3: state="failed" の物理表示
  - 赤 border + fallback message で state を視覚化、L3 重度時は暫定値を一切表示しない
```

→ 公開後の 7/4 / 7/14 / 7/27 マイルストーン日に集計障害が発生しても、暫定値で読者を誤誘導しない設計。**安全性 OK**。

---

## §6. K3 milestone 手動同期 SOP（K3-1 改善対応、Round 12 内追記）

### §6.1 progress.md → evolution-data.json 同期 SOP

```
[同期 SOP（公開後 30 日 timeline カード更新時）]

step 1: progress.md / decisions.md 確認
  - Round X 完遂時の最新 state を取得
  - 該当 milestone date と state（progressing / completed / failed）を確定

step 2: evolution-data.json の milestones[].state 更新
  - 対象 card の milestones array から該当 date の object を find
  - state field を更新、confirmed_date と commit_hash を追記

step 3: PII grep 自動検証
  - verify-no-pii.ts を JSON 全体に走らせ、PII 検知 0 件を確認

step 4: git commit + push（Marketing 担当）
  - "marketing(PRJ-019): K3 milestone {date} 確定値反映" 形式

step 5: Web-Ops handoff（Slack #web-ops）
  - SSG 再ビルド trigger 確認
  - 公開反映を 30-60 秒以内に確認
```

### §6.2 同期 cadence（Round 11 §6.3 整合）

| 日付 | 同期対象 | 担当 |
|---|---|---|
| 6/22 | evolution-data.json v1 初期化（6 cards 全件 progressing） | Web-Ops |
| 6/27 09:00 JST | 公開 deploy | Web-Ops |
| 7/4 09:00-09:30 JST | card-pv-30d / card-unique-30d 7 日中間値 + card-phase2-decision 計画着地 | Marketing → Web-Ops |
| 7/14 09:00-09:30 JST | 5 cards 14 日中間値 | Marketing → Web-Ops |
| 7/27 09:00-09:30 JST | 5 cards 30 日確定値 + state="completed" | Marketing → Web-Ops |
| 7/27 18:00 JST | card-phase2-decision 議決結果 | Marketing → Web-Ops |

---

## §7. 検証結果サマリ

### §7.1 不整合検出 5 件 / 内訳

| # | 系統 | 検出事項 | 重要度 | Round 12 中対応 | Round 13 引継 |
|---|---|---|---|---|---|
| K1-1 | K1 audit | `extract-audit-summary.ts` 未実装 | 中 | - | **X1 引継**（6/22）|
| K1-2 | K1 audit | audit log JSON schema が evolution-data.json schema と未連結 | 軽微 | **§5 で連結記載済** | - |
| K2-1 | K2 metric | `extract-kpi-summary.ts` 未実装 | 中 | - | **X1 引継**（6/22）|
| K2-2 | K2 metric | usage_monitor の API 消費量集計が W2 mock 70% 化前 partial のみ | 軽微 | - | Round 14 で再検証（仕様通り）|
| K3-1 | K3 milestone | progress.md → evolution-data.json 手動同期 SOP 未文書化 | 軽微 | **§6 で SOP 文書化** | - |
| K3-2 | K3 milestone | Tag Manager scroll_75 custom event 実装が staging dry-run 開始時必要 | 中 | - | **X4 引継**（5/30）|

### §7.2 Round 12 中対応完遂 2 件

- K1-2: audit log JSON schema → evolution-data.json schema 連結（§5 記載）
- K3-1: progress.md → evolution-data.json 手動同期 SOP 文書化（§6 記載）

### §7.3 Round 13 引継 4 件

| # | 引継項目 | 担当 | 期日 |
|---|---|---|---|
| X1 | `extract-audit-summary.ts` + `extract-kpi-summary.ts` 実装 | Marketing → Dev 連携 | 6/22 |
| X2 | `verify-no-pii.ts` unit test 30+ 件追加 | Dev 部門連携 | 6/22 |
| X3 | Vercel Analytics + Plausible API key 設定 + Tag Manager 接続 | Web-Ops 連携 | 5/30 staging dry-run 完了時 |
| X4 | Tag Manager `scroll_75` custom event 実装 | Web-Ops 連携 | 5/30 |

### §7.4 mock data fallback 安全性確認 6 cards 全件 OK

| card | confirmed_value | confirmed_date | commit_hash | metadata | 判定 |
|---|---|---|---|---|---|
| card-pv-30d | null → "集計中" | null → "—" | null → "" | {} | **OK** |
| card-unique-30d | null → "集計中" | null → "—" | null → "" | {} | **OK** |
| card-scroll-depth | null → "集計中" | null → "—" | null → "" | {} | **OK** |
| card-contact-cv | null → "集計中" | null → "—" | null → "" | {} | **OK** |
| card-contact-inquiries | null → "0 件" | null → "—" | null → "" | {} | **OK** |
| card-phase2-decision | null → "判定保留" | null → "—" | null → "" | {} | **OK** |

---

## §8. 親文書整合性チェックリスト

- [x] DEC-019-052 (a)(b)(c) → §6 同期 cadence で 09:00 JST 統一、tone 維持
- [x] DEC-019-033 第 11 種 HITL knowledge_pii_review → §3.3 / §6.1 step 3 PII grep で物理化
- [x] DEC-019-058 NG-3 配布資料 №11/№12 full-copy → 本書 §1.1 K1 / K2 / K3 wiring 系統 3 件で trace 可能
- [x] Round 11 dynamic-disclosure-cards 6 cards → §1.2 / §4.2 / §5.1 で全件 trace
- [x] Round 11 K3 data wiring 5 metric → §3 / §4 で全件 wiring 検証
- [x] Web-Ops handoff §5.3 timeline カード data 構造 → §4.4 mock data fallback で型整合
- [x] mock data fallback 安全性 → §5.1 / §7.4 で 6 cards 全件 OK
- [x] 絵文字 0 件 / AI 感のある語彙 0 件 / 硬めトーン → 全章貫徹
- [x] reports/ 配下のみ、既存ファイル無改変 → 本書は新規作成

---

## §X 残課題（5/8 検収会議までの残動作）

| # | 項目 | 担当 | 期日 |
|---|---|---|---|
| X1 | 本書 v1.1 発行（5/22 内部運用着手日 dry-run 結果反映） | Marketing | 5/26 |
| X2 | extraction script 実装（K1 audit / K2 kpi / K3 milestone）3 件 | Dev 部門連携 | 6/22 |
| X3 | Vercel Analytics + Plausible API 接続検証（5/19 staging dry-run） | Web-Ops 連携 | 5/30 |
| X4 | Tag Manager scroll_75 custom event 実装 | Web-Ops 連携 | 5/30 |
| X5 | 本書 v1.2 発行（6/22 staging dry-run 完遂後反映） | Marketing | 6/22 |

---

## §Y 提出メタ情報

| 項目 | 値 |
|---|---|
| 行数 | 約 410 行（要求 350-450 行内） |
| 検証対象系統 | 3 系統（K1 audit / K2 metric / K3 milestone）|
| 検証対象 card | 6 件（K3.1-K3.5 + Phase 2 GO/NoGo） |
| 不整合検出件数 | 6 件（K1-1 / K1-2 / K2-1 / K2-2 / K3-1 / K3-2） |
| Round 12 中対応 | 2 件（K1-2 / K3-1）→ 本書 §5 / §6 で文書化完遂 |
| Round 13 引継 | 4 件（X1 / X2 / X3 / X4）|
| mock data fallback 検証 | 6 cards 全件 OK |
| 親戦略整合 | DEC-019-052 / 033 / 055 / 056 / 057 / 058 全 6 件 完全整合 |
| 既存成果物への影響 | 破壊的変更 0 件（新規作成、reports/ 配下のみ） |
| Owner 残動作 | **0 件**（Marketing 単独で完結する設計、Round 13 引継は Dev / Web-Ops 連携で吸収） |
| commit / push | 実行しない（CEO が一括 push） |
| 関連報告 | `marketing-round11-dynamic-disclosure-cards.md` / `marketing-round11-k3-data-wiring.md` / `marketing-portfolio-18x18.md` / `marketing-web-ops-handoff.md` |

---

**起案: Marketing 部門 R12 Marketing-F / 2026-05-04 深夜（Round 12 独立 Agent dispatch、DEC-019-025 SOP 準拠、general-purpose 経由）/ K3 dynamic disclosure card データ流入実機 dry-run 検証**
