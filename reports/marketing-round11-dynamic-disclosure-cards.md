# PRJ-019 Clawbridge — Round 11 dynamic disclosure timeline cards 設計（K3.1-K3.5 + Phase 2 GO/NoGo）

| 項目 | 内容 |
|---|---|
| 文書 ID | marketing-round11-dynamic-disclosure-cards |
| 制定日 | 2026-05-04（Round 11、Marketing-E 担当） |
| 起票 | Marketing 部門（R11 Marketing-E、独立 Agent dispatch、DEC-019-025 SOP 準拠、general-purpose 経由） |
| 区分 | **dynamic disclosure timeline cards 設計**（`/case-studies/openclaw-runtime#evolution` 公開後 30 日 disclosure schedule） |
| 上位文書 | `marketing-launch-narrative-final.md` §14 動的開示 / `marketing-portfolio-18x18.md` §4 動的開示 6 件 / `marketing-metric-plan-v1.1.md` K3.x / `marketing-web-ops-handoff.md` §5.3 timeline カード data 構造 |
| 上位決裁 | DEC-019-007 / 025 / 033 / 050 / 052 / 053 / 055 / 056 / 057（DEC-019-052 (a)(b)(c) 完全保持） |
| 関連 Round 11 並列 | PM-D MS-2 5/15 trial / Secretary-F 配布資料 / Dev-D subscription CLI |
| ステータス | **draft v1**（5/26 v1.1 = 5/22 内部運用着手結果反映 / 6/22 v1.2 = 6/27 公開直前確定 / 7/4 v1.3 / 7/14 v1.4 / 7/27 v1.5 確定） |
| 行数目標 | 350-450 行 |

---

## §0. CEO 向け 200 字エグゼクティブサマリ

本書は 6/27 朝 09:00 JST 公開後 30 日（6/27 → 7/27）の dynamic disclosure timeline cards 設計である。`/case-studies/openclaw-runtime#evolution` セクションに 6 cards（K3.1 PV / K3.2 ユニーク / K3.3 scroll_depth / K3.4 Contact CV / K3.5 問い合わせ件数 / Phase 2 GO/NoGo）を配置、各カードに card title / 公開タイミング / data source / 数値表示形式 / 失敗時 fallback message を確定。data wiring は Round 10 Dev-γ benchmarks + Round 10 Review-δ 50-control 監査 + Round 11 Dev-D subscription CLI + Round 11 Review-C drill #2 の 4 系統から接続。Markdown 表 + JSON schema 併記で Web-Ops が SSG 再ビルド可能なレベルまで確定。28×28 圧縮回避維持、18 章自然形連動、DEC-019-052 (a)(b)(c) 完全保持。

---

## §1. timeline cards 全体設計

### §1.1 配置 anchor + h2 構造

| 項目 | 仕様 |
|---|---|
| Anchor ID | `#evolution` |
| h2 | 「進化中の章 — 6/27 → 7/27 の動き」 |
| h3 サブヘッダ | 「公開後 30 日の動的測定値」 |
| 紹介文 | 「5/22 内部運用着手から、運用は止まらず続いている。本セクションでは、公開後 30 日（6/27 → 7/27）の動的測定値を timeline カード形式で逐次追記する。各カードには確定日付と commit hash が付記される。透明性とは、完成形を見せることではない。動いている現場をそのまま見せることである。」 |
| カード列数 | mobile 1 列 / tablet 2 列 / desktop 3 列 |
| カード状態 | `progressing`（点滅 dot indicator + 灰色 dashed border） / `completed`（チェックマーク + 緑 solid border + commit link） / `failed`（赤 solid border + fallback message） |

### §1.2 card 全体一覧（6 件）

| # | card ID | card title | 公開タイミング | data source 系統 |
|---|---|---|---|---|
| 1 | `card-pv-30d` | PV — 公開後 30 日 | 7/4 中間値 / 7/14 中間値 / 7/27 確定 | Vercel Analytics + Plausible |
| 2 | `card-unique-30d` | ユニーク訪問者 — 公開後 30 日 | 7/4 中間値 / 7/14 中間値 / 7/27 確定 | Vercel Analytics + Plausible |
| 3 | `card-scroll-depth` | scroll_depth 75% 到達率 | 7/14 中間値 / 7/27 確定 | Plausible custom event + Tag Manager |
| 4 | `card-contact-cv` | Contact form CV 率 | 7/14 中間値 / 7/27 確定 | Vercel Analytics goal + Contact form 集計 |
| 5 | `card-contact-inquiries` | Contact form 問い合わせ件数 | 7/14 中間値 / 7/27 確定 | Contact form 受信 mailbox 集計 |
| 6 | `card-phase2-decision` | Phase 2 着手 GO/NoGo 判定 | 7/4 計画着地 / 7/27 議決 | Owner 議決議事録 |

### §1.3 全体 timeline 開示スケジュール

```
6/27 (土) 09:00 JST 公開（6 cards 全件 progressing で初期表示）
  ↓
6/30 (火) OSS 公開（C18 OSS 公開 timeline カード confirmed = 6 cards 補助に追加）
  ↓
7/4 (土) 公開後 7 日 速報 + Phase 2 着手判断会議
  - card-pv-30d → 7 日中間値追記
  - card-unique-30d → 7 日中間値追記
  - card-phase2-decision → 「Phase 2 計画着地」追記（progressing 維持）
  ↓
7/14 (火) 公開後 14 日 中間レビュー
  - card-pv-30d → 14 日中間値追記
  - card-unique-30d → 14 日中間値追記
  - card-scroll-depth → 14 日中間値追記
  - card-contact-cv → 14 日中間値追記
  - card-contact-inquiries → 14 日中間値追記
  ↓
7/27 (日) 公開後 30 日 KPI 確定
  - card-pv-30d → 30 日確定値 + state="completed"
  - card-unique-30d → 30 日確定値 + state="completed"
  - card-scroll-depth → 30 日確定値 + state="completed"
  - card-contact-cv → 30 日確定値 + state="completed"
  - card-contact-inquiries → 30 日確定値 + state="completed"
  - card-phase2-decision → 議決結果 + state="completed"
```

---

## §2. 6 cards 個別仕様

### §2.1 card-pv-30d（PV — 公開後 30 日）

| 項目 | 仕様 |
|---|---|
| card title | 「PV — 公開後 30 日」 |
| 公開タイミング | 7/4 朝 09:30 JST（7 日中間値）/ 7/14 朝 09:30 JST（14 日中間値）/ 7/27 朝 09:30 JST（30 日確定値） |
| data source | Vercel Analytics（自社 HP）+ Plausible（補完）/ extraction script は `marketing-round11-k3-data-wiring.md` §2.1 |
| 数値表示形式 | 「PV {value} / 30 日（前日 23:59 集計）」、value はカンマ区切り 4 桁、target 6,000 |
| 進捗 indicator | 7 日（progressing）→ 14 日（progressing）→ 30 日（completed）|
| 失敗時 fallback message | 「Vercel Analytics 集計遅延中（前日 23:59 取得失敗）。次回 24 時間以内に追記、commit hash 別途公開」 |
| state 遷移 | `progressing` → 7 日中間値表示後も `progressing` 維持 → 7/27 確定値で `completed` |
| commit hash 表示 | confirmed 時に `git log` link を `https://github.com/{owner}/clawbridge/commit/{hash}` 形式で表示 |
| target との差分表示 | `actual vs target = +X.Y%` を緑（達成）/ 赤（未達）で表示、tooltip で計算式 |

JSON schema:

```json
{
  "id": "card-pv-30d",
  "metric_name": "PV — 公開後 30 日",
  "metric_key": "pv_30d",
  "target_value": 6000,
  "target_unit": "PV",
  "expected_date": "2026-07-27",
  "milestones": [
    { "date": "2026-07-04", "label": "7 日中間値", "state": "progressing" },
    { "date": "2026-07-14", "label": "14 日中間値", "state": "progressing" },
    { "date": "2026-07-27", "label": "30 日確定値", "state": "progressing" }
  ],
  "data_source": {
    "primary": "vercel-analytics",
    "fallback": "plausible",
    "extraction_script": "scripts/marketing/extract-pv-30d.ts"
  },
  "fallback_message": "Vercel Analytics 集計遅延中。次回 24 時間以内に追記、commit hash 別途公開",
  "state": "progressing",
  "confirmed_value": null,
  "confirmed_date": null,
  "commit_hash": null
}
```

### §2.2 card-unique-30d（ユニーク訪問者 — 公開後 30 日）

| 項目 | 仕様 |
|---|---|
| card title | 「ユニーク訪問者 — 公開後 30 日」 |
| 公開タイミング | 7/4 朝 09:30 JST / 7/14 朝 09:30 JST / 7/27 朝 09:30 JST |
| data source | Vercel Analytics（unique visitor）+ Plausible（補完、cookie-less）/ extraction script は `marketing-round11-k3-data-wiring.md` §2.2 |
| 数値表示形式 | 「ユニーク {value} / 30 日（前日 23:59 集計）」、target 3,500 |
| 進捗 indicator | 7 日（progressing）→ 14 日（progressing）→ 30 日（completed） |
| 失敗時 fallback message | 「ユニーク集計が両 source で乖離（>10%）。Plausible 値を採択、Vercel Analytics 値を併記、24 時間以内に root cause 報告」 |
| state 遷移 | `progressing` → 7/27 確定値で `completed` |
| 特殊事項 | Plausible の cookie-less 集計と Vercel Analytics の認証 visitor ID で乖離が出る可能性、§5.2 で integrity 検証ロジック明示 |

JSON schema:

```json
{
  "id": "card-unique-30d",
  "metric_name": "ユニーク訪問者 — 公開後 30 日",
  "metric_key": "unique_30d",
  "target_value": 3500,
  "target_unit": "unique",
  "expected_date": "2026-07-27",
  "milestones": [
    { "date": "2026-07-04", "label": "7 日中間値", "state": "progressing" },
    { "date": "2026-07-14", "label": "14 日中間値", "state": "progressing" },
    { "date": "2026-07-27", "label": "30 日確定値", "state": "progressing" }
  ],
  "data_source": {
    "primary": "vercel-analytics",
    "fallback": "plausible",
    "integrity_check": "両 source 乖離 ≤10%",
    "extraction_script": "scripts/marketing/extract-unique-30d.ts"
  },
  "fallback_message": "ユニーク集計が両 source で乖離（>10%）。Plausible 値を採択、Vercel Analytics 値を併記、24 時間以内に root cause 報告",
  "state": "progressing"
}
```

### §2.3 card-scroll-depth（scroll_depth 75% 到達率）

| 項目 | 仕様 |
|---|---|
| card title | 「scroll_depth 75% 到達率 — 公開後 30 日」 |
| 公開タイミング | 7/14 朝 09:30 JST（14 日中間値）/ 7/27 朝 09:30 JST（30 日確定値、7 日中間値はスキップ） |
| data source | Plausible custom event（scroll_75）+ Tag Manager 連動 / extraction script は `marketing-round11-k3-data-wiring.md` §2.3 |
| 数値表示形式 | 「scroll_depth 75% 到達率 {value}%（30 日間 unique visitor 中）」、target 60% 以上 |
| 進捗 indicator | 14 日（progressing）→ 30 日（completed） |
| 失敗時 fallback message | 「Plausible custom event 取得失敗（scroll_75 event 未着信）。Vercel Analytics の time-on-page > 90 秒 で代替集計、24 時間以内に修正」 |
| state 遷移 | `progressing` → 7/27 確定値で `completed` |
| 特殊事項 | 7 日中間値はスキップ（unique visitor 母数が少なすぎて統計的有意性なし）、14 日から開始 |

### §2.4 card-contact-cv（Contact form CV 率）

| 項目 | 仕様 |
|---|---|
| card title | 「Contact form CV 率 — 公開後 30 日」 |
| 公開タイミング | 7/14 朝 09:30 JST / 7/27 朝 09:30 JST |
| data source | Vercel Analytics goal event（contact_submit）+ Contact form 受信件数 / extraction script は `marketing-round11-k3-data-wiring.md` §2.4 |
| 数値表示形式 | 「Contact form CV 率 {value}%（unique 訪問者中）」、target 1.5% |
| 進捗 indicator | 14 日（progressing）→ 30 日（completed） |
| 失敗時 fallback message | 「Contact form goal event 未着信。受信 mailbox 件数 / unique で代替集計、24 時間以内に Tag Manager 修正報告」 |
| state 遷移 | `progressing` → 7/27 確定値で `completed` |
| PII 注意 | CV 率の表示には個別の問い合わせ内容を一切含めない（HITL 第 11 種 knowledge_pii_review 整合）|

### §2.5 card-contact-inquiries（Contact form 問い合わせ件数）

| 項目 | 仕様 |
|---|---|
| card title | 「Contact form 問い合わせ件数 — 公開後 30 日」 |
| 公開タイミング | 7/14 朝 09:30 JST / 7/27 朝 09:30 JST |
| data source | Contact form 受信 mailbox（hironori555@gmail.com 経由）+ Marketing 部門集計 / extraction script は `marketing-round11-k3-data-wiring.md` §2.5 |
| 数値表示形式 | 「問い合わせ {value} 件 / 30 日（うち Phase 2 関心度 X 件 / 見積依頼 Y 件）」、target 6-12 件 |
| 進捗 indicator | 14 日（progressing）→ 30 日（completed） |
| 失敗時 fallback message | 「mailbox 集計が間に合わず（受信フォーマット乖離）。次回 48 時間以内に確定値追記、暫定値は表示せず」 |
| state 遷移 | `progressing` → 7/27 確定値で `completed` |
| PII 注意 | **絶対重要** — 件数のみ公開、内容・送信者・メールアドレス・社名は一切公開禁止（HITL 第 11 種 knowledge_pii_review 必須通過）|
| 内訳開示 | 「Phase 2 関心度」「見積依頼」「OSS fork 報告」3 区分で件数のみ集計、各区分が 0 件でも「0 件」と明示 |

### §2.6 card-phase2-decision（Phase 2 着手 GO/NoGo 判定）

| 項目 | 仕様 |
|---|---|
| card title | 「Phase 2 着手判定 — 公開後 30 日 KPI 確定後」 |
| 公開タイミング | 7/4 朝 10:00 JST（Phase 2 計画着地）/ 7/27 夕 18:00 JST（GO/NoGo 議決） |
| data source | Owner + CEO 議決議事録（`projects/PRJ-019/decisions.md` の DEC-019-XXX 番号採番） |
| 数値表示形式 | 「Phase 2 着手 = {GO / NoGo / 条件付き GO}（DEC-019-XXX 議決、{議決日}）」 |
| 進捗 indicator | 7/4 progressing（計画着地）→ 7/27 completed（議決結果） |
| 失敗時 fallback message | 「議決延期（公開後 30 日 KPI 集計の確認継続中）。次回 7 日以内に議決結果追記、Owner + CEO 緊急会議招集予定」 |
| state 遷移 | `progressing` → 7/27 議決後 `completed`（GO / NoGo / 条件付き GO のいずれかに確定） |
| 議決根拠開示 | 議決時の K3.1-K3.5 confirmed_value 全件を併記、判断ロジックを 200 字以内で記載 |

JSON schema:

```json
{
  "id": "card-phase2-decision",
  "metric_name": "Phase 2 着手判定",
  "metric_key": "phase2_decision",
  "target_value": "GO（条件付き GO 含む）",
  "target_unit": "decision",
  "expected_date": "2026-07-27",
  "milestones": [
    { "date": "2026-07-04", "label": "Phase 2 計画着地", "state": "progressing" },
    { "date": "2026-07-27", "label": "GO/NoGo 議決", "state": "progressing" }
  ],
  "data_source": {
    "primary": "decisions.md",
    "decision_id_prefix": "DEC-019-",
    "extraction_script": "scripts/marketing/extract-phase2-decision.ts"
  },
  "fallback_message": "議決延期（公開後 30 日 KPI 集計の確認継続中）。次回 7 日以内に議決結果追記",
  "state": "progressing",
  "decision_basis": null
}
```

---

## §3. data wiring 接続（4 系統）

### §3.1 Round 10 Dev-γ benchmarks 接続

| card | 接続内容 | 接続経路 |
|---|---|---|
| card-pv-30d | benchmark で確定した「Day-0 readiness 99%」を補助 KPI として併記 | `projects/PRJ-019/reports/dev-round10-benchmark.md` → KPI JSON 経由 |
| card-unique-30d | benchmark で確定した「200+ 全緑」を Section 12 補助情報として併記 | 同上 |

### §3.2 Round 10 Review-δ 50-control 監査接続

| card | 接続内容 | 接続経路 |
|---|---|---|
| card-contact-cv | 50-control 監査で確定した「PII redaction 100%」を Contact form の信頼性根拠として併記 | `projects/PRJ-019/reports/review-round10-50-control-audit.md` → KPI JSON 経由 |
| card-contact-inquiries | 同上、PII 保護の物理化を訴求 | 同上 |

### §3.3 Round 11 Dev-D subscription CLI 接続

| card | 接続内容 | 接続経路 |
|---|---|---|
| card-pv-30d | subscription CLI 出力の「月次総額 ≤$430」を Section 7 補助情報として併記 | `projects/PRJ-019/reports/dev-round11-subscription-cli.md` → kpi-data.json 経由 |
| card-phase2-decision | subscription CLI 出力の「6 月分実測値」を Phase 2 着手判定の財務根拠として参照 | 同上 |

### §3.4 Round 11 Review-C drill #2 結果接続

| card | 接続内容 | 接続経路 |
|---|---|---|
| card-pv-30d | drill #2 「BAN リスク drill #1+#2 全 Pass」を Section 5 補助情報として併記 | `projects/PRJ-019/reports/review-round11-drill-2.md` → KPI JSON 経由 |
| card-phase2-decision | drill #2 結果が Phase 2 着手の前提条件（drill #2 fail = NoGo 強制） | 同上 |

### §3.5 接続経路の統合 view

```
[Round 10 Dev-γ benchmark]                [Round 10 Review-δ 50-control]
  └→ kpi-data.json（K1.11 / K2.3）          └→ kpi-data.json（K2.7 PII redact）
       │                                          │
       └──────────┬─────────────────────────────┘
                  ↓
         metric-data.json（18×18 matrix）
                  ↓
[Round 11 Dev-D subscription CLI]         [Round 11 Review-C drill #2]
  └→ kpi-data.json（K1.4 6 月実測）         └→ kpi-data.json（K1.10 拡張）
       │                                          │
       └──────────┬─────────────────────────────┘
                  ↓
         evolution-data.json（6 cards、本書定義）
                  ↓
         /case-studies/openclaw-runtime#evolution（Web-Ops 部門 SSG 再ビルド）
```

---

## §4. 失敗時 fallback の運用ルール

### §4.1 fallback の 3 レベル

| level | 発動条件 | 対応 |
|---|---|---|
| L1 軽微 | 集計遅延 24 時間以内 | card に `state="progressing"` 維持、fallback message 表示なし、24 時間以内に再試行 |
| L2 中度 | 集計遅延 24 時間超 / source 乖離 >10% | card に fallback message 表示、24 時間以内に root cause 報告、48 時間以内に確定値追記 |
| L3 重度 | 集計不能 / source 全停止 | card に `state="failed"` + 赤 border 表示、48 時間以内に Marketing → CEO → Owner 報告、暫定値は表示しない |

### §4.2 fallback message の文体ルール

| 観点 | ルール |
|---|---|
| トーン | 設計通りの障害である旨、淡々と事実のみ記載（謝罪・装飾語禁止） |
| 文字数 | 60-80 字以内（mobile 1 行で読み切れる長さ） |
| 必須要素 | 障害事象 + 暫定対応 + 確定値追記 ETA |
| 禁止語 | 「申し訳ありません」「予想外」「ご迷惑」「魔法のように」「最先端の」「AI が」 |
| 推奨表現 | 「集計遅延中」「次回 X 時間以内に」「commit hash 別途公開」「root cause 報告」 |

### §4.3 fallback 文例集（6 cards）

| card | L2 fallback message（採用） |
|---|---|
| card-pv-30d | 「Vercel Analytics 集計遅延中（前日 23:59 取得失敗）。次回 24 時間以内に追記、commit hash 別途公開」 |
| card-unique-30d | 「ユニーク集計が両 source で乖離（>10%）。Plausible 値を採択、Vercel Analytics 値を併記、24 時間以内に root cause 報告」 |
| card-scroll-depth | 「Plausible custom event 取得失敗（scroll_75 event 未着信）。Vercel Analytics の time-on-page > 90 秒 で代替集計、24 時間以内に修正」 |
| card-contact-cv | 「Contact form goal event 未着信。受信 mailbox 件数 / unique で代替集計、24 時間以内に Tag Manager 修正報告」 |
| card-contact-inquiries | 「mailbox 集計が間に合わず（受信フォーマット乖離）。次回 48 時間以内に確定値追記、暫定値は表示せず」 |
| card-phase2-decision | 「議決延期（公開後 30 日 KPI 集計の確認継続中）。次回 7 日以内に議決結果追記、Owner + CEO 緊急会議招集予定」 |

---

## §5. data integrity 検証ロジック

### §5.1 確定値 commit 直前のチェックリスト

| check 項目 | 対象 card | 検証方法 |
|---|---|---|
| 集計期間整合 | 全 6 cards | 6/27 09:00 JST 起点、24 時間単位、UTC ではなく JST 統一 |
| source 乖離検知 | card-pv-30d / card-unique-30d | Vercel Analytics と Plausible の乖離 ≤10% を確認、超過時は L2 fallback |
| PII 含有検知 | card-contact-cv / card-contact-inquiries | 件数のみ表示、内容・送信者情報の含有を grep で検証、含有時は commit 中止 |
| commit hash 整合 | 全 6 cards | 直前 commit hash を `git log -1 --format=%H` で取得、差替確認 |
| 数値整合 | 全 6 cards | target 値との差分が ±50% を超える場合は Marketing → CEO 確認、commit 保留 |

### §5.2 unique 集計の乖離検証ロジック

```typescript
// scripts/marketing/verify-unique-integrity.ts（pseudo-code）
function verifyUniqueIntegrity(
  vercelUnique: number,
  plausibleUnique: number
): { ok: boolean; adoptedValue: number; gap: number } {
  const gap = Math.abs(vercelUnique - plausibleUnique) /
              Math.max(vercelUnique, plausibleUnique);
  if (gap <= 0.10) {
    return {
      ok: true,
      adoptedValue: vercelUnique, // primary 採択
      gap
    };
  }
  // 乖離 >10% = L2 fallback、Plausible 採択
  return {
    ok: false,
    adoptedValue: plausibleUnique,
    gap
  };
}
```

### §5.3 PII 含有検知ロジック

```typescript
// scripts/marketing/verify-no-pii.ts（pseudo-code）
const PII_PATTERNS = [
  /[\w.+-]+@[\w-]+\.[\w.-]+/, // email
  /[\d-]{10,15}/,             // phone
  /株式会社|有限会社|合同会社/, // 会社名
  /〒\d{3}-\d{4}/             // 郵便番号
];

function verifyNoPII(cardJson: object): boolean {
  const json = JSON.stringify(cardJson);
  return !PII_PATTERNS.some(pattern => pattern.test(json));
}
// 含有時は commit 中止、HITL 第 11 種 knowledge_pii_review 起票
```

---

## §6. Web-Ops handoff 仕様

### §6.1 evolution-data.json の物理パス

| 項目 | 値 |
|---|---|
| repo | `projects/COMPANY-WEBSITE/app` |
| 実装ファイル | `app/case-studies/openclaw-runtime/evolution-data.json` |
| 実装 component | `app/case-studies/openclaw-runtime/evolution-timeline.tsx`（Web-Ops handoff §5.3 で type 定義済） |
| 更新責任 | Marketing → Web-Ops handoff（各マイルストーン日の朝 09:00 JST） |
| SSG 再ビルド | Vercel auto deploy（main push 時 30-60 秒）|

### §6.2 evolution-data.json の構造（6 cards）

```json
{
  "schema_version": "1.0",
  "last_updated": "2026-06-27T09:00:00+09:00",
  "cards": [
    { /* card-pv-30d、§2.1 schema */ },
    { /* card-unique-30d、§2.2 schema */ },
    { /* card-scroll-depth、§2.3 schema */ },
    { /* card-contact-cv、§2.4 schema */ },
    { /* card-contact-inquiries、§2.5 schema */ },
    { /* card-phase2-decision、§2.6 schema */ }
  ]
}
```

### §6.3 Web-Ops 段階別作業

| 日付 | 作業 | 担当 |
|---|---|---|
| 6/22 | 6 cards 全件 progressing で初期化、evolution-data.json v1 commit | Web-Ops |
| 6/27 09:00 | 公開 deploy（cards 表示開始） | Web-Ops |
| 7/4 09:00 | Marketing → Web-Ops handoff（card-pv-30d / card-unique-30d 7 日中間値）→ JSON 更新 → SSG 再ビルド | Marketing → Web-Ops |
| 7/14 09:00 | 同（5 cards 14 日中間値） | Marketing → Web-Ops |
| 7/27 09:00 | 同（5 cards 30 日確定値、state="completed"） | Marketing → Web-Ops |
| 7/27 18:00 | card-phase2-decision 議決結果反映、state="completed" | Marketing → Web-Ops |

---

## §7. DEC-019-052 (a)(b)(c) 整合確認

| DEC-019-052 採択値 | 本書 timeline cards との整合 |
|---|---|
| (a) tone B 物語型 主軸 | 各 card の表現は「動いている現場の記録」物語 arc を維持、装飾語禁止で淡々とした事実記載 |
| (a) C 透明性 OSS 補助 | 全 6 cards に commit hash + 確定日付付記、failed 時も fallback message で透明性維持 |
| (a) A 技術深堀り 別枠連載 | scroll_depth / Contact CV の集計ロジックは別枠 vol1-6 で技術深堀り解説可 |
| (b) Channel 3 Zenn 主軸 + note.com サブ | timeline cards 自体は自社 HP のみ、Zenn / note は cards への link で誘導 |
| (c) 09:00 JST 公開時刻 | 全 cards 更新タイミング 09:00 JST または 09:30 JST 統一、夜間更新禁止 |

→ DEC-019-052 (a)(b)(c) 完全保持、一字変更なし。

---

## §8. 親文書整合性チェックリスト

- [x] DEC-019-052 (a)(b)(c) → §7 で完全整合確認
- [x] DEC-019-033 透明性 6 軸 + HITL 第 11 種 knowledge_pii_review → §5.3 PII 含有検知で物理化
- [x] narrative final §14 動的開示 6 軸 → §1.2 6 cards で完全反映
- [x] portfolio 18×18 §4 動的開示 6 件 → §2 個別仕様で完全反映
- [x] metric plan v1.1 K3.x → §2 各 card data source で完全連動
- [x] Web-Ops handoff §5.3 timeline カード data 構造 → §6 evolution-data.json で型整合
- [x] Round 10 Dev-γ benchmark / Review-δ 50-control / Round 11 Dev-D / Review-C → §3 4 系統で接続明示
- [x] 28×28 圧縮回避維持 → 18 章自然形連動、§1.2 6 cards は各章補助
- [x] 絵文字 0 件 / AI 感のある語彙 0 件 / 硬めトーン → 全章貫徹
- [x] reports/ 配下のみ、既存ファイル無改変 → 本書は新規作成

---

## §X 残課題（5/8 検収会議までの残動作）

| # | 項目 | 担当 | 期日 |
|---|---|---|---|
| X1 | 本書 v1.1 発行（5/22 内部運用着手結果反映、cards 初期化検証） | Marketing | 5/26 |
| X2 | 本書 v1.2 発行（6/22 段階 1 開始時、Web-Ops handoff 反映） | Marketing | 6/22 |
| X3 | extraction script 実装（`scripts/marketing/extract-{pv,unique,scroll,cv,inquiries,phase2}.ts` 6 件） | Dev 部門連携 | 6/22 |
| X4 | PII 含有検知 script 実装（`scripts/marketing/verify-no-pii.ts`） | Dev 部門連携 | 6/22 |
| X5 | Vercel Analytics + Plausible + Tag Manager 接続検証（5/19 staging dry-run 内） | Web-Ops 連携 | 5/30 |
| X6 | Contact form mailbox 集計 SOP 確定 | Marketing | 6/22 |

---

## §Y 提出メタ情報

| 項目 | 値 |
|---|---|
| 行数 | 約 410 行（要求 350-450 行内） |
| timeline cards | 6 件（K3.1-K3.5 + Phase 2 GO/NoGo） |
| 公開タイミング | 6/27 公開時 progressing 初期化 / 7/4 / 7/14 / 7/27 マイルストーン更新 |
| data source 系統 | 4 系統（Vercel Analytics + Plausible + Contact form mailbox + decisions.md） |
| Round 10-11 接続 | 4 件（Dev-γ benchmark / Review-δ 50-control / Dev-D subscription CLI / Review-C drill #2） |
| fallback level | 3 段階（L1 軽微 / L2 中度 / L3 重度） |
| PII 保護 | §5.3 検知ロジック + HITL 第 11 種 knowledge_pii_review 整合 |
| 親戦略整合 | DEC-019-007 / 025 / 033 / 050 / 052 / 053 / 055 / 056 / 057 全 9 件 完全整合 |
| 既存成果物への影響 | 破壊的変更 0 件（新規作成、reports/ 配下のみ） |
| Owner 残動作 | **0 件**（Marketing 単独で完結する設計、6/26 最終承認に includes） |
| commit / push | 実行しない（CEO が一括 push） |
| 関連報告 | `marketing-launch-narrative-final.md` / `marketing-portfolio-18x18.md` / `marketing-metric-plan-v1.1.md` / `marketing-web-ops-handoff.md` / `marketing-round11-k3-data-wiring.md`（本書並行）|

---

**起案: Marketing 部門 R11 Marketing-E / 2026-05-04 深夜（Round 11 独立 Agent dispatch、DEC-019-025 SOP 準拠、general-purpose 経由）/ dynamic disclosure timeline cards 設計（K3.1-K3.5 + Phase 2 GO/NoGo）**
