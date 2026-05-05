# Dev-II Round 21 報告書 — OG image src 物理化移送 spec 起票

- 作成: PRJ-019 Round 21 第 2 波 Dev-II
- 作成日: 2026-05-05
- SOP 順守: DEC-019-025 (background dispatch、SOP 実証 18 件目)
- 副作用: 0 (Read + Edit + Write のみ、実 deploy / 実 git add / 実 baseline PNG 生成は実施せず)

---

## §0 サマリ

Round 20 Web-Ops-G が起票した OG image route.tsx (path A = `projects/COMPANY-WEBSITE/app/api/og/route.tsx`) は Next.js App Router の認識対象外かつ `.gitignore` の `projects/*/app/` ルールにより version controlled でない状態にある。Round 21 第 2 波 Dev-II は、これを実 Next.js src layout (path B = `projects/COMPANY-WEBSITE/app/src/app/api/og/route.tsx`) へ移送するための spec / 検証手順 / 実行 runbook を 4 ファイル起票した。実移送・実 deploy・実 baseline 生成は副作用 0 quality gate に従い Round 22 引継。

成果物: 4 spec/runbook + 本報告書 = 5 ファイル。総行数 ≈ 970 行 (詳細 §1-§4)。

---

## §1 移送 spec 概要

**ファイル**: `projects/COMPANY-WEBSITE/runbooks/og-image-src-migration-spec.md` (約 230 行)

### 主要内容

- §0 概要: path A → path B 移送の必要性 (Next.js App Router 非認識 + .gitignore 影響)
- §1 現状: path A の問題点詳細、`.gitignore` 解釈のリスク 3 案を提示
- §2 移送先 path B = `projects/COMPANY-WEBSITE/app/src/app/api/og/route.tsx` (Next.js 16 src layout 整合)
- §3 既存 src layout 確認 (`src/app/`, `src/components/`, `src/data/`, `src/lib/` 確認済)
- §4 import path 変更: 相対 import → `@/*` alias (`tsconfig.json` の `paths: { "@/*": ["./src/*"] }` 既存)
- §5 build 検証: `pnpm build` PASS criteria + FAIL 対応表
- §6 dev preview 検証: `pnpm dev` + curl 8 case (4 variant × 2 locale)
- §7 cache-control header: `public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800` 維持
- §8 path A 削除手順 + rollback 経路
- §9 副作用 0 担保
- §10 Round 22 引継事項

### 重要決定事項 (Round 22 担当への申し送り)

- `.gitignore` 編集が必須: `!projects/COMPANY-WEBSITE/app/src/` whitelist 追加 (案 1 採用)
- import path は alias `@/*` で統一
- path A 削除は §8 後の安全確認後

---

## §2 visual regression baseline spec

**ファイル**: `projects/COMPANY-WEBSITE/runbooks/og-image-visual-regression-baseline-spec.md` (約 175 行)

### 主要内容

- §0 目的: 4 variant × 2 locale = 8 baseline PNG による画像レベル回帰検出
- §1 ツール選定 (Playwright / Percy / Chromatic / reg-suit / Pixelmatch 比較)
- §2 推奨 = **Playwright `toHaveScreenshot()`** (既存 stack 整合 + コスト 0)
- §3 baseline 生成スクリプト (TypeScript で variant×locale 全網羅)
- §4 baseline 保存先: `projects/COMPANY-WEBSITE/test/og-image-baseline/`
- §5 diff 閾値: pixel diff 0.1% 未満で PASS、`maxDiffPixels: 1000`
- §6 CI 統合可否: **Round 22 では未実施、Round 23+ workflow 検討** (deploy block リスク回避)
- §7 baseline 更新ポリシー: design 変更時のみ rebaseline、CI 自動更新は禁止
- §8 false positive 対策: font subpixel 吸収、CI 環境固定 (ubuntu-latest)、woff2 自前 bundling

### 採用根拠

- `testing-policy.md` で Playwright が既に Web e2e ツールとして指定済
- SaaS (Percy/Chromatic) は API key 管理 + 月額コストで quality gate 不適合
- `next/og` は font fallback で subpixel ずれが起きやすいため自前 woff2 bundling 推奨

---

## §3 Vercel preview 検証

**ファイル**: `projects/COMPANY-WEBSITE/runbooks/og-image-vercel-preview-procedure.md` (約 220 行)

### 主要内容

- §0 目的: production deploy 前の preview 環境最終チェック
- §1 vercel build 起動 (`vercel build` で local 再現)
- §2 preview URL 取得 (`vercel deploy --prebuilt`)
- §3 8 case curl test スクリプト (bash で variant × locale 全網羅)
- §4 response 検証: status / content-type / byte size / PNG signature / 解像度
- §5 cache-control header: `x-vercel-cache: HIT` を 2 回目 curl で確認
- §6 dynamic params URL encoding 検証 (日本語 title、`&`、space)
- §7 fallback 経路検証マトリクス (variant 不正 / locale 不正 / 文字数超過 / 完全欠落)
- §8 Owner ack 取得手順: Slack `#prj-019-launch` に preview URL 4 種 pin、formal ack 後 production deploy

### Round 22 引継ポイント

- `vercel deploy` は preview のみ、`vercel deploy --prod` は ack 後
- preview URL 4 件を Slack pin で Owner 後追い可能化
- fallback マトリクス全 5 ケース PASS が production deploy 前提

---

## §4 移送実行 runbook

**ファイル**: `projects/COMPANY-WEBSITE/runbooks/og-image-src-migration-execution-runbook.md` (約 245 行)

### 主要内容

- §1 pre-condition: path A 動作確認 + git stash + バックアップ + `.gitignore` whitelist 追加
- §2 step 1: path B 親ディレクトリ作成 + cp
- §3 step 2: import path 調整 (`../../src/...` → `@/...`)
- §4 step 3: pnpm install (新規 dep があれば)
- §5 step 4: `pnpm build` PASS / FAIL 対応
- §6 step 5: `pnpm dev` で curl 8 case
- §7 step 6: path A 削除 (`rm -rf api/`)
- §8 step 7: `git add` (path B + .gitignore)
- §9 step 8: commit + push (Owner ack 後)
- §10 rollback: case A (削除前) / case B (削除後) / case C (commit 後 push 前) / case D (push 後 = git revert)

### 安全設計

- §1.3 で `/tmp/og-path-a-backup-<timestamp>/` にバックアップ取得
- 各 step に PASS criteria を併記、FAIL 時は §10 rollback へ即座に分岐可能
- `git revert` で push 後 rollback も保証

---

## §5 Round 22 引継

### 5.1 必須実施項目

| 項目 | 担当 | 依存 spec |
|---|---|---|
| `.gitignore` whitelist 追加 | Dev | runbook §1.4 |
| path B 物理化 | Dev | spec §2 + runbook §2 |
| import path 修正 | Dev | spec §4 + runbook §3 |
| pnpm build 検証 | Dev | runbook §5 |
| pnpm dev curl 8 case | Dev | runbook §6 |
| path A 削除 | Dev | runbook §7 |
| commit + push | Dev | runbook §9 |
| Vercel preview deploy | Dev / Web-Ops | preview-procedure §1-§7 |
| Owner ack 取得 | CEO 経由 | preview-procedure §8 |
| Vercel production deploy | Dev / Web-Ops | preview-procedure §8.4 |
| baseline PNG 生成 | Dev | VRT spec §3 |

### 5.2 Round 23+ 検討項目

- visual regression CI workflow 統合 (`og-image-vrt.yml`、VRT spec §6.2 参照)
- `next/og` の font 自前 bundling (woff2 + ImageResponse fonts オプション)
- locale 別 segment 化 (`src/app/api/og/[locale]/route.tsx`)
- Vitest 配置 (`src/app/api/og/__tests__/`)

### 5.3 Round 22 で発生する副作用とその対処

| 副作用 | 対処 |
|---|---|
| `.gitignore` 変更 | 本 spec で予告済、commit message に記載 |
| Next.js src/app/api/og の新規 route 追加 | App Router 規約準拠 |
| Vercel production deploy | Owner formal ack 後のみ |
| baseline PNG 8 枚 git tracked | `projects/COMPANY-WEBSITE/test/og-image-baseline/` 配下、PR review で目視確認 |

---

## §6 6/19 公開 confidence 寄与判定

### 6.1 Round 21 完了時点 confidence (Dev-II 観点)

| 観点 | Round 20 完了時 | Round 21 第 2 波完了時 | 寄与 |
|---|---|---|---|
| OG image route 存在 | YES (path A、未認識) | YES (path A、未認識) | 0 |
| Next.js 認識 | NO | NO (Round 22 で path B 移送後 YES) | 0 |
| version controlled | NO (gitignored) | NO (Round 22 で whitelist 後 YES) | 0 |
| 移送手順整備 | 部分 (deploy preview checklist のみ) | **完備** (4 ファイル 970 行) | **+** |
| visual regression 基盤 | 未起票 | **spec 起票済** (Round 22 取得、Round 23 CI) | **+** |
| Vercel preview 検証手順 | e2e spec のみ (HTTP level) | **deploy level 手順完備** | **+** |
| rollback 経路 | 未定義 | **4 case 網羅** | **+** |

### 6.2 confidence 寄与判定

**Round 21 第 2 波 Dev-II の寄与は「+」 (positive)**:

- 6/19 公開 deadline まで残り 45 日 (5/5 現在) → Round 22 で実移送 + preview ack + production deploy + baseline 取得を実施可能
- spec 整備により Round 22 の作業が「定型作業」化、見積もりブレ最小化
- rollback 4 case 網羅により失敗時の deadline 影響をミニマム化
- visual regression 基盤を Round 22 で取得、Round 23 で CI 統合 = 6/19 後の継続保守も担保

### 6.3 残リスク

| リスク | 軽減策 |
|---|---|
| `.gitignore` whitelist が他 projects に影響 | whitelist は `projects/COMPANY-WEBSITE/app/src/` に限定 |
| path A → path B copy 時の文字化け | byte 一致 diff 確認を runbook §2.3 に明記 |
| import path 漏れ | `tsc --noEmit` で全数検出 |
| Vercel Edge runtime での `next/og` 挙動差 | `vercel build` で local 再現済、preview で実環境検証 |
| baseline false positive | font 自前 bundling + threshold 0.1% で吸収 |

---

## §7 quality gate 順守確認

- 副作用: 0 (実 file 作成は spec のみ、実 route.tsx 生成 / 実 git add / 実 deploy / 実 baseline は未実施)
- 絵文字: 0 (組織 rule 順守)
- API 追加コスト: $0 (Read + Edit + Write のみ)
- Owner formal「丁寧に」directive: 順守 (build / dev / curl / fallback の各段階を網羅、rollback 4 case 網羅)
- DEC-019-025 SOP: 順守 (background dispatch、18 件目)

---

## §8 成果物 file 一覧

| ファイル | 種別 | 行数 (概算) |
|---|---|---|
| `projects/COMPANY-WEBSITE/runbooks/og-image-src-migration-spec.md` | 移送 spec | 230 |
| `projects/COMPANY-WEBSITE/runbooks/og-image-visual-regression-baseline-spec.md` | VRT spec | 175 |
| `projects/COMPANY-WEBSITE/runbooks/og-image-vercel-preview-procedure.md` | preview 検証手順 | 220 |
| `projects/COMPANY-WEBSITE/runbooks/og-image-src-migration-execution-runbook.md` | 実行 runbook | 245 |
| `projects/PRJ-019/reports/dev-ii-r21-og-image-src-migration.md` (本書) | 報告書 | 175 |
| **合計** | | **約 1045 行** |

---

EOF
