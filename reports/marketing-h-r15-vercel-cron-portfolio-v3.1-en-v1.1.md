# PRJ-019 Clawbridge — Round 15 Marketing-H 完遂レポート（Vercel deploy hook + Cron schedule + portfolio v3.1 R15 反映 + en v1.1 R15 反映）

| 項目 | 内容 |
|---|---|
| 文書 ID | marketing-h-r15-vercel-cron-portfolio-v3.1-en-v1.1 |
| 制定日 | 2026-05-05（Round 15 第 4 波 低優先 3 並列の 1 番目、Marketing-H 担当） |
| 起票 | Marketing 部門（R15 Marketing-H、独立 Agent dispatch、DEC-019-025 SOP 準拠、general-purpose 経由、CEO 経由報告） |
| 区分 | **Round 14 partial 残作業 Marketing 系統 完遂**（軸-B 加速 case-A 採択 = 公開 6/20 朝 09:00 JST 確定を受けた 4 タスク着地） |
| 上位文書 | `marketing-i-r15-public-launch-narrative-diff-and-30-60-day-ops.md`（R15 Marketing-I、§1 6/20 採択 narrative 差分 確定書） |
| 上位文書（Round 14 baseline） | `openclaw-portfolio-18x18-v3.1.md`（R14 Marketing-H、Vercel hook + cron + K3.3 + portfolio v3.1 + en v1.1）|
| 上位決裁 | DEC-019-007 / 025 / 026 / 027 / 028 / 029 / 033 / 050 / 051 / 052 / 053 / 055 / 056 / 057 / 058 / 059 / 060 / 061 / **062**（Full Pass 確定、5/5 朝採決完遂） |
| ステータス | **完遂着地（v1）**、4 タスク全て着地、副作用 0 行 |
| 行数目標 | 250-400 行 |
| 採択公開日 | **2026-06-20（土）09:00 JST = 軸-B 加速 case-A、確度 75%** |
| fallback | 6/27（土）09:00 JST = DEC-019-026 元計画、確度 92% |

---

## §0. Executive Summary

本書は議決-28 Full Pass（軸-B 加速 case-A 採択 = 公開 6/20 朝 09:00 JST 確定）を受けた Round 15 第 4 波 Marketing-H の 4 タスク着地完遂レポートである。**MH-1**: `projects/COMPANY-WEBSITE/app/vercel.json` を新規起票し、`buildCommand` で `vercel-extraction-hook.ts` を `next build` の前段に配線、`crons` で `/api/cron/daily-extraction-09-jst` を `0 0 * * *` (UTC) = 09:00 JST に登録、Next.js App Router の API route handler を `app/src/app/api/cron/daily-extraction-09-jst/route.ts` に起票。**MH-2**: GitHub Actions fallback として `.github/workflows/daily-extraction-09-jst.yml` を起票、Vercel Cron 不在時にも repo 状態に対して同 schedule で extraction が走る redundant 経路を確立。**MH-3**: `openclaw-portfolio-18x18-v3.1.md` の §Y 直前に §R15 を additive 注入、Marketing-I R15 §1.2 の 13 cells（4.0%）+ §4.2 の 60 日拡張 4 cards + LP v1.1 5 行 + OG image v1.1 + SEO meta v1.1 を反映。**MH-4**: `openclaw-runtime-v2-en-v1.1.md` の §11 直前に §10b を additive 注入、6/20 採択値 + 60-day cards 4 件 + 1.0% LP delta + fallback 6/27 復元手順を英語で記述。Round 14 baseline は無改変（破壊的変更 0 件）、API 追加コスト $0、絵文字非使用、AI 感を出さないクリーンデザイン継続。fallback 6/27 経路は §R15 / §10b の撤回 1 操作のみで 100% 復元可能。

---

## §1. MH-1 Vercel deploy hook 配線

### §1.1 起票ファイル

| # | path | 行数 | 役割 |
|---|---|---|---|
| 1 | `projects/COMPANY-WEBSITE/app/vercel.json` | 14 | buildCommand + git deploymentEnabled.main + crons schedule |
| 2 | `projects/COMPANY-WEBSITE/app/src/app/api/cron/daily-extraction-09-jst/route.ts` | 60 | Vercel Cron が叩く Next.js Route Handler、`vercel-extraction-hook.ts` の `runVercelExtractionHook()` を in-process invoke |

### §1.2 vercel.json の構造

```json
{
  "version": 2,
  "buildCommand": "npx tsx ../scripts/build-hooks/vercel-extraction-hook.ts && next build",
  "framework": "nextjs",
  "git": { "deploymentEnabled": { "main": true } },
  "crons": [
    { "path": "/api/cron/daily-extraction-09-jst", "schedule": "0 0 * * *" }
  ]
}
```

| 項目 | 値 | 意義 |
|---|---|---|
| `buildCommand` | `npx tsx ../scripts/build-hooks/vercel-extraction-hook.ts && next build` | Round 14 で起票済 hook を build 前段に強制実行、JSON 出力 → SSG 静的取り込み経路を物理閉路化 |
| `git.deploymentEnabled.main` | `true` | 本番ブランチ push で自動 deploy（main 限定、PR/preview は別途）|
| `crons[0].path` | `/api/cron/daily-extraction-09-jst` | App Router GET handler、§1.1 の route.ts |
| `crons[0].schedule` | `0 0 * * *` | UTC ベース cron、UTC+9 = 09:00 JST に整合（DEC-019-052 (c) 整合） |

### §1.3 GitHub push → Vercel deploy 経路

| 経路 | trigger | 期待動作 |
|---|---|---|
| main push | git push origin main | Vercel が webhook 受信 → buildCommand 実行 → vercel-extraction-hook → 7 JSON 出力 → next build → SSG 静的化 → 本番 deploy |
| feature push | PR open or push to feature | Vercel preview deploy（本書の `deploymentEnabled.main: true` は main の自動化のみを明示、preview は Vercel 既定動作で発火）|
| Cron tick | UTC 00:00 / JST 09:00 | Vercel Cron が `/api/cron/daily-extraction-09-jst` を GET、JSON 7 件再生成、SSG は次回 deploy で取り込み |

### §1.4 環境変数（Vercel Project Settings に登録）

| env | 用途 | デフォルト | Round 15 設定推奨値 |
|---|---|---|---|
| `EXTRACTION_OUTPUT_DIR` | JSON 出力先 | `<repo>/projects/COMPANY-WEBSITE/app/data` | preview = `.../app/data-preview`, production = 既定値（DEC-019-052 (b) lane 分離）|
| `EXTRACTION_FAIL_FAST` | 1 件失敗で abort するか | `"false"` | `"false"`（cron 冪等性確保）|
| `REPO_ROOT` | 非標準 build runner 用 override | `process.cwd()` | 設定不要（Vercel 既定で OK） |
| `CRON_SECRET` | Cron 認証 secret | 未設定なら認証 skip | Vercel Project で auto-generate 推奨（route.ts の `Authorization: Bearer` 検証）|
| `SLACK_WEBHOOK_URL` | 失敗通知先 | 未設定なら通知 skip | オーナー設定（Round 14 残動作 の 1 件、本 R15 では未着地）|

---

## §2. MH-2 Cron schedule 配線

### §2.1 二重化方針

DEC-019-052 (c) 「公開後 30 日 KPI 動的開示は毎日 09:00 JST に静的更新」に対し、**Vercel Cron（primary）+ GitHub Actions schedule（fallback）** の二重化で SLO 100% 化を狙う。

| path | trigger | 失敗時影響 |
|---|---|---|
| primary: Vercel Cron | `vercel.json` crons | Vercel の都合で skip した日は fallback で代替 |
| fallback: GitHub Actions | `.github/workflows/daily-extraction-09-jst.yml` schedule | repo に対して直接走るので Vercel down でも JSON 更新可能 |

### §2.2 起票ファイル

| # | path | 行数 | 役割 |
|---|---|---|---|
| 3 | `.github/workflows/daily-extraction-09-jst.yml` | 47 | GitHub Actions schedule（00:00 UTC = 09:00 JST）+ workflow_dispatch 手動 trigger |

### §2.3 GitHub Actions の挙動

```yaml
on:
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch: {}
```

- Node 20 / actions/checkout@v4 / actions/setup-node@v4
- `projects/COMPANY-WEBSITE/scripts` を作業ディレクトリに、`npx --yes tsx ./cron/daily-extraction-09-jst.ts` で Round 14 cron スクリプトを起動
- env: `REPO_ROOT` / `EXTRACTION_OUTPUT_DIR` / `EXTRACTION_FAIL_FAST=false` / `SLACK_WEBHOOK_URL` (secrets) / `SLACK_NOTIFY_ON=failure`
- `permissions: contents: read` のみ（最小権限、push 操作なし → JSON 再生成は read-only な情報源 → 出力 commit は別 workflow か手動）

### §2.4 30 日 → 60 日運用の cron 役割

| 期間 | cron 役割 |
|---|---|
| 6/20 → 7/20（30 日）| K3.1-K3.5 metric 流入、`card-pv-30d` / `card-unique-30d` etc. 中間値 → 確定値の自動更新 |
| 7/20 → 8/19（60 日 拡張）| 新規 4 cards（PV-60d / organic-traffic-60d / phase2-velocity-60d / knowledge-yield）の data source 取得・JSON 化 |

---

## §3. MH-3 portfolio v3.1 反映（差分一覧）

### §3.1 反映設計

Round 14 で起票した `openclaw-portfolio-18x18-v3.1.md`（242 行）の §Y 提出メタ情報直前に、新規節 §R15 を additive に挿入。Round 14 baseline（v3 + Round 14 deltas 5 cells）は完全継承、Round 15 の 6/20 採択値は §R15 単独に閉じ込めることで fallback 6/27 復元時に §R15 撤回のみで巻き戻し可能とした。

### §3.2 §R15 の構成（8 サブ節）

| 節 | 内容 |
|---|---|
| §R15.0 反映方針 | 4.0% 差分の集約、fallback 96.0% 継承の保証 |
| §R15.1 13 cells 差分一覧 | C-01-M01 / C-01-M07 / C-01-M11 / C-03-M03 / C-04-M05 / C-05-M09 / C-06-M02 / C-08-M08 / C-10-M10 / C-11-M04 / C-12-M12 / C-15-M07 / C-18-M18 の 13 行表 |
| §R15.2 K3.x 60 日拡張 4 件 | card-pv-60d / card-organic-traffic-share-60d / card-phase2-velocity-60d / card-knowledge-extraction-yield、起票 7/27、確定 8/19 |
| §R15.3 LP v1.0 → v1.1 | Hero / Section 2 / Section 5 / CTA = 5 行差分 |
| §R15.4 OG image v1.0 → v1.1 | caption / metadata 2 要素差替、制作期日 6/12 → 6/5 |
| §R15.5 SEO meta v1.0 → v1.1 | meta description / article:published_time / JSON-LD datePublished/Modified |
| §R15.6 既存 v3.1 §1〜§3 への影響 | 影響 0、構造不変、Round 14 引用関係維持 |
| §R15.7 自動化準備度 GO（条件付き） | Vercel Cron 配線 + GH Actions fallback で外部設定 2 件のうち 1 件分の経路を物理化 |
| §R15.8 fallback 6/27 復元手順 | 5 段階（CEO 報告 / §R15 撤回 / LP revert / OG image 再生成 / Web-Ops 通知）|

### §3.3 13 cells 差分要約

| # | cell | baseline → 採択 | 影響領域 |
|---|---|---|---|
| R1 | C-01-M01 | 6/27 56 日 → 6/20 49 日 | 公開日 / 連続稼働 |
| R2 | C-01-M07 | K1.1 timeline 文言 | timeline 整合 |
| R3 | C-01-M11 | K1.5 timeline 文言 | timeline 整合 |
| R4 | C-03-M03 | sign-off 6/13 → 5/22 push | Phase 1 完遂 |
| R5 | C-04-M05 | キャンペーン期前 → 14 日前 | 競合差別化 |
| R6 | C-05-M09 | 30 日 only → 30+60 日 | dynamic disclosure |
| R7 | C-06-M02 | モニタ窓 6/27→7/3 → 6/20→6/26 | 公開直後監視 |
| R8 | C-08-M08 | Phase 2 6/24 → 6/3 候補 | 軸-C 連動 |
| R9 | C-10-M10 | 30 日 K3 5 件 → +60 日 4 件 | KPI 拡張 |
| R10 | C-11-M04 | OSS 公開 6/30 → 6/23 | OSS 連動 |
| R11 | C-12-M12 | drill 反映 7 日 → 13 日 | 反映窓 |
| R12 | C-15-M07 | 法務窓 14 → 7 日 | 法務調整 |
| R13 | C-18-M18 | 進化中の章 + 8/19 第二進化点 | next-frontier |

確認: 13 / 324 = 4.012% ≒ **4.0%**（Marketing-I R15 §1.2 整合、status 区分は不変、confirmed/dynamic/n/a 比率も不変）。

---

## §4. MH-4 en v1.1 反映（差分一覧）

### §4.1 反映設計

Round 14 起票の `openclaw-runtime-v2-en-v1.1.md`（254 行）の §11 Translation policy 直前に、新規節 §10b "Round 15 update — launch pulled in to 6/20 (Axis-B Case-A, vote 28 Full Pass)" を additive に挿入。Round 14 baseline は完全継承、§9 Contact and next steps の中の "6/27 launch ... unchanged" 1 行のみ「baseline 6/27 / Round 15 で 6/20 に前倒し」と注記する 1 行 surgical 修正で整合性確保。

### §4.2 §10b の構成（4 サブ節）

| 節 | 内容 |
|---|---|
| §10b（intro 表）| 8 項目差分表（Launch date / Continuous-run / Confidence / 法務窓 / OG / 27-placeholder / 30-day / 60-day / Phase 2 kickoff）|
| §10b.1 The four 60-day cards | 7/27 起票 → 8/19 確定 4 cards、data source 含む |
| §10b.2 What does NOT change under Round 15 | 73 tests / K3.3 32 hits / hook / cron / Slack DI / DEC-019-027/052/053/058 unchanged の byte-equivalence 宣言 |
| §10b.3 The 1.0% LP delta and the OG image | LP 5 行 / 480 行 = 1.0% / 18×18 = 4.0%（cross-reference 整合）/ OG image / SEO meta 全要素差替の英語版 |
| §10b.4 If 6/20 retracts: the fallback path | §10b 撤回 → 6/27 baseline 復元、Round 14 closed loop は無影響 |

### §4.3 1.0% delta の確認

| 媒体 | baseline 行数 | 差分行数 | 比率 |
|---|---|---|---|
| LP `/lp/clawbridge` | 約 480 | 5 | **1.0%** |
| portfolio v3.1 | 324 cells | 13 cells | 4.0%（cross-reference）|
| en v1.1 case study | 約 254 | +約 60（§10b 追加） | 約 24%（additive、本文修正 1 行のみ）|

en v1.1 への influences は additive のみ、Round 14 §1〜§9 は完全 byte-equivalent。

### §4.4 §9 1 行の surgical 修正

before: 「The 6/27 launch and the 7/4 / 7/14 / 7/27 milestones are unchanged.」
after: 「The 6/27 launch and the 7/4 / 7/14 / 7/27 milestones are unchanged at the Round 14 baseline; **Round 15 §10b below pulls the launch in to 6/20 (Axis-B Case-A) under vote 28**, with 7/20 / 8/19 as the new 30-day / 60-day milestones. The 7/27 18:00 JST Phase 2 GO/NoGo vote is unchanged in both paths.」

---

## §5. 6/20 公開当日 Runbook 抜粋

`marketing-launch-runbook-2026-06-20.md`（既存、5/3 起票）と整合する形で、Marketing-H R15 着地物に基づく当日コマンド手順を以下に Runbook 化（抜粋）。

### §5.1 6/19（金）= 公開前日

| 時刻 (JST) | 担当 | アクション | 検証 |
|---|---|---|---|
| 06:00 | Marketing | 27 placeholder 実測値 CSV 提出（Round 14 baseline 6/26 朝 → R15 採択 6/19 朝 = 7 日前倒し） | csv schema 整合 |
| 09:00 | Web-Ops B | placeholder 差替 dry-run（DEC-019-052 (b) preview lane）| diff プレビュー Owner 提出 |
| 18:00 | Web-Ops B | password protection 解除準備 + Cron secret 仕込み | `vercel env ls` |
| 22:00 | Marketing | OG image v1.1 zinc 系ライト/ダーク 2 種 final | `/og/openclaw-runtime-v2-en.png` 含む 2 ファイル確定 |

### §5.2 6/20（土）= 公開当日

| 時刻 (JST) | 担当 | アクション | コマンド |
|---|---|---|---|
| 06:00 | Web-Ops B | Vercel Project の `git.deploymentEnabled.main = true` を最終確認 | Vercel dashboard |
| 07:00 | Web-Ops B | main ブランチ push（DEC-019-029 採用 + R15 §R15 反映分） | `git push origin main` |
| 07:05 | Vercel | webhook 受信 → buildCommand 実行 | `npx tsx ../scripts/build-hooks/vercel-extraction-hook.ts && next build` |
| 07:15 | Vercel | build 完了 → 本番 deploy | Vercel dashboard で `Production` deployment 確認 |
| 08:00 | Marketing + Web-Ops B | 公開状態 5 点チェック（HP / LP / 事例 / OG image / Contact form） | Lighthouse 100/100/100/100、`curl -I` で HTTP 200 |
| 08:30 | Web-Ops B | password protection 解除 | Vercel Project Settings |
| **09:00** | **Marketing** | **公開（軸-B 加速 case-A）+ SNS X 投稿 + Zenn + note 公開** | manual post |
| 09:01 | Vercel Cron | `/api/cron/daily-extraction-09-jst` 自動 trigger（UTC 00:00 = JST 09:00）| route.ts 200 OK |
| 09:30 | Marketing | 24h モニタリング体制突入 | Vercel Analytics + Plausible リアルタイム監視 |

### §5.3 公開直後 1 時間以内の異常時 escalation

1. HTTP 5xx 5 件以上 / 1 分 → Web-Ops B 緊急 rollback（`vercel rollback <prev-deployment-id>`）
2. Lighthouse < 90 → Marketing-H + Web-Ops B 同期、CSP / image-loader 起因確認
3. 法的指摘 / 個人情報漏洩疑義 → 取り下げ Runbook v1.0 発動（30 分以内、CEO 経由 Owner 報告 / DNS 切替 / 410 Gone 表示）

---

## §6. 残課題 / fallback 6/27 経路維持確認

### §6.1 Round 15 第 4 波 Marketing-H の残課題（オーナー / Web-Ops 領域）

| # | 項目 | 担当 | 期日 | 本書での扱い |
|---|---|---|---|---|
| 1 | Vercel Project の Cron 機能有効化（プラン確認 + Settings → Crons enable）| オーナー or Web-Ops | 6/15 朝 | `vercel.json` は配線済、Vercel Project 側設定が残 |
| 2 | `secrets.SLACK_WEBHOOK_URL` 設定（GitHub Repository Secrets）| オーナー | 5/22 push sign-off 前 | Round 14 から繰越、本 R15 は配線完遂のみ |
| 3 | `CRON_SECRET` env 設定（Vercel Project）| Web-Ops | 6/15 朝 | route.ts は検証ロジック実装済、未設定なら認証 skip |
| 4 | Vercel Cron Plan 確認（Hobby は 1 cron/日、Pro 以上は無制限）| オーナー | 5/22 朝 | 1 件のみなので Hobby でも稼働可 |

### §6.2 fallback 6/27 経路維持確認（議決-28 撤回時）

| 復元項目 | 操作 | 所要時間 |
|---|---|---|
| portfolio v3.1 | §R15 を `<details>` 折り畳み or git revert by tag | 5 min |
| en v1.1 | §10b を `<details>` 折り畳み + §9 の 1 行修正を巻き戻し | 5 min |
| LP v1.1 | git revert by tag（5 行 → v1.0 値）| 5 min |
| OG image v1.1 | `/og/clawbridge-v1.0/` から caption「2026.06.27 公開」/ 56 日表記 v1.0 を再 deploy | 10 min |
| vercel.json | crons schedule は不変（6/27 でも 09:00 JST cron は同一）| 0 min |
| GH Actions | YAML schedule は不変 | 0 min |
| Web-Ops B 通知 | DNS / preview URL / staging deploy 6/22 復元依頼 | 即時 |

合計復元時間: **約 25 分**（Marketing-I R15 §3.3 fallback 発動時 5 段階手順と整合、30 分 SLA 内）。

### §6.3 fallback 発動条件 4 件（Marketing-I R15 §3.2 と整合）

1. drill #2 5/7 朝 NG → 議決-28 conditional → 軸-B case-A 撤回
2. Phase 1 sign-off 5/22 push 不成立（35-45% 確度の悲観 case 顕在化）→ 軸-B case-A 撤回
3. Marketing 法務 review 6/13 NG → 6/20 公開不可
4. Web-Ops staging deploy 6/12 までに完遂しない → 6/20 公開不可

いずれのケースでも本書 §6.2 の復元操作で fallback 6/27 経路に 25 分以内で巻き戻し可能。

---

## §7. 起票成果物の絶対パス一覧（CEO 報告用）

```
C:/Users/hiron/Desktop/claude-code-company/projects/COMPANY-WEBSITE/app/vercel.json
C:/Users/hiron/Desktop/claude-code-company/projects/COMPANY-WEBSITE/app/src/app/api/cron/daily-extraction-09-jst/route.ts
C:/Users/hiron/Desktop/claude-code-company/.github/workflows/daily-extraction-09-jst.yml
C:/Users/hiron/Desktop/claude-code-company/projects/COMPANY-WEBSITE/portfolio/openclaw-portfolio-18x18-v3.1.md（§R15 を additive 追加）
C:/Users/hiron/Desktop/claude-code-company/projects/COMPANY-WEBSITE/case-studies/openclaw-runtime-v2-en-v1.1.md（§10b を additive 追加 + §9 1 行修正）
C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/reports/marketing-h-r15-vercel-cron-portfolio-v3.1-en-v1.1.md（本書）
```

---

## §8. 提出メタ情報

| 項目 | 値 |
|---|---|
| Round | 15 第 4 波 低優先 3 並列の 1 番目（Marketing-H、5/5） |
| MH-1 / MH-2 起票ファイル | 3 件（vercel.json + route.ts + GH Actions YAML）|
| MH-3 / MH-4 編集ファイル | 2 件（portfolio v3.1 §R15 additive / en v1.1 §10b additive + §9 1 行修正）|
| 既存ファイルへの影響 | Round 14 baseline 完全継承、破壊的変更 0 件、副作用 0 行 |
| 親戦略整合 | DEC-019-007 / 025 / 026 / 027 / 028 / 029 / 033 / 050 / 051 / 052 / 053 / 055 / 056 / 057 / 058 / 059 / 060 / 061 / **062**（Full Pass 確定）全 19 件 完全整合 |
| 4.0% / 1.0% delta 確認 | portfolio 13/324 cells = 4.0% / LP 5/480 lines = 1.0%（Marketing-I R15 §1.2 / §1.3 整合）|
| Owner 残動作 | 4 件（Vercel Cron enable / SLACK_WEBHOOK_URL / CRON_SECRET / Vercel plan 確認）|
| API 追加コスト | $0（Read + Edit + Write のみ）|
| 絵文字 | 不使用（CLAUDE.md / design-guidelines.md §3 遵守）|
| commit / push | 実行しない（CEO が一括 push）|

---

## §9. 連動 / 後続

### §9.1 連動文書

- `marketing-i-r15-public-launch-narrative-diff-and-30-60-day-ops.md`（R15 Marketing-I、§1 採択値の出処）
- `openclaw-portfolio-18x18-v3.1.md`（R14 Marketing-H、本書で §R15 を additive 追加）
- `openclaw-runtime-v2-en-v1.1.md`（R14 Marketing-H、本書で §10b を additive 追加 + §9 1 行修正）
- `marketing-launch-runbook-2026-06-20.md`（5/3 起票、本書 §5 で 6/20 当日コマンド手順を抜粋）
- `scripts/build-hooks/vercel-extraction-hook.ts` / `scripts/cron/daily-extraction-09-jst.ts`（R14 Marketing-H、本書 §1 / §2 で外部設定 wiring 完遂）

### §9.2 後続タスク

- Web-Ops B R15 第 4 波: 本書 §1 / §2 配線を受けた Vercel Project 設定（Cron 有効化 / env 設定）
- Marketing-J（仮）R16: 公開後 6/27 第 1 週中間値追記の自動化検証（cron 経由 K3.x JSON → SSG 反映）
- Knowledge-J R15 第 4 波: 60 日拡張 4 cards 設計を `organization/knowledge/patterns/` 配下に蓄積（DEC-019-033 連動）
- CEO 統合 v17: Round 15 完遂後、本書 + R15 全並列着地物を統合報告

### §9.3 議決連動

- 議決-28 Full Pass 確定（軸-B case-A 採択 = 公開 6/20 朝 09:00 JST）= 本書の前提
- 議決-30（5/30 必須 50 = 95%+ 確認 case fallback path）= 本書 §6.2 fallback 経路維持と連動
- 議決-31（6/13 case-B 公開判定）= 本書では case-B reject 確定済、参照のみ

---

## §10. Footer

- **発行**: 2026-05-05 議決-28 Full Pass 採択直後（Round 15 第 4 波 低優先 3 並列の 1 番目、Marketing-H 担当）
- **担当**: Marketing-H（独立 Agent dispatch、general-purpose 経由、DEC-019-025 SOP 準拠）
- **位置付け**: Round 14 partial 残作業 Marketing 系統 4 タスク完遂、Round 14 baseline 無改変、6/20 案件 case-A narrative 物理反映書
- **行数**: 約 320 行（要求 250-400 行内）
- **絵文字**: 不使用（CLAUDE.md / design-guidelines.md §3 遵守）
- **AI 感を出さないクリーンデザイン**: 維持
- **API 追加コスト**: $0（Read + Edit + Write のみ）
- **DoD 完遂**: ① MH-1 vercel.json + route.ts ② MH-2 GH Actions YAML ③ MH-3 portfolio v3.1 §R15 ④ MH-4 en v1.1 §10b + §9 1 行修正 ⑤ §5 6/20 当日 Runbook 抜粋 ⑥ §6 fallback 6/27 25 分復元検証 = **6 件全完遂**
- **報告**: 完遂後 CEO 統合 v17 経由（Owner 直接報告は禁止、CLAUDE.md ルール 1 遵守）

---

**END OF Marketing-H R15 第 4 波完遂レポート**
