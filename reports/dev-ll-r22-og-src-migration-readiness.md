# Dev-LL R22 OG src migration readiness 総括レポート

- 担当: PRJ-019 Round 22 Dev-LL
- 起票日: 2026-05-05
- 対象: Round 22 OG image src 物理化執行 readiness 判定
- 上長: CEO 経由 Owner 報告

---

## §0 Round 22 task 概要

R21 で Dev-II が起票した 4 spec (合計 1,374 行) を実行可能性 4 段階で評価し、.gitignore 規則調整 + 物理 migration step-by-step 手順 + visual regression baseline 取得 procedure の 3 件を spec 化。実 migration / baseline 取得 / preview deploy は本 Round では実施せず、Round 22 後続 trigger で dev 担当が実行する readiness を確立。

---

## §1 成果物 (4 ファイル)

| # | path | 行数 | 用途 |
|---|---|---|---|
| 1 | `projects/COMPANY-WEBSITE/runbooks/og-gitignore-adjustment-spec.md` | 256 | .gitignore patch 詳細 (案 a 推奨 + 案 b/c 副作用評価) |
| 2 | `projects/COMPANY-WEBSITE/runbooks/og-src-migration-execution-readiness-2026-05-26.md` | 319 | 4 段階 readiness 判定 + 12 step 実行手順 + rollback |
| 3 | `projects/COMPANY-WEBSITE/runbooks/og-visual-regression-baseline-procedure-2026-05-26.md` | 289 | 8 case baseline 取得 (curl 経路) + sha256/pixel diff 比較 |
| 4 | `projects/PRJ-019/reports/dev-ll-r22-og-src-migration-readiness.md` | 本文書 | R22 総括 + readiness 判定 + R23 引継 |

合計 864 行 + 本文書。R21 4 spec (1,374 行) に絶対無改変 (制約遵守)。

---

## §2 物理 migration readiness 判定

### 2.1 4 段階 matrix

| 段階 | 判定 | 根拠 |
|---|---|---|
| (1) design | **GO** | R21 spec 4 件 + 本 Round .gitignore patch spec で全網羅 |
| (2) dev env | **GO with conditions** | path A 14,859 byte 確認済、.gitignore patch 適用が前提 |
| (3) staging | **GO with conditions** | Vercel CLI auth 確認が前提 |
| (4) production | **NO-GO** | Owner formal ack 取得まで保留 |

### 2.2 総合判定

**GO with conditions** (production 段階のみ NO-GO で Owner ack 待ち)

Round 22 当日に step 1-11 を実行可能。step 12 (production deploy) は ack 取得後に実行。

---

## §3 .gitignore 推奨調整案

### 3.1 採用案 = 案 (a) whitelist 追加

```diff
 # プロジェクトアプリケーション（各appは独自gitリポジトリで管理）
 projects/*/app/
+
+# COMPANY-WEBSITE は monorepo 同居の例外
+# Next.js src dir layout の src/ 配下のみ tracked にする
+!projects/COMPANY-WEBSITE/app/src/
+!projects/COMPANY-WEBSITE/app/src/**
+
 .aidesigner/*
```

### 3.2 採用理由

- 副作用最小: 4 行追加のみ
- 既存方針整合: 「各 app 独立 repo」原則は他 PRJ で維持
- 可読性: コメントで COMPANY-WEBSITE 例外を明示
- rollback 容易: 4 行削除のみ

### 3.3 不採用案

- 案 (b) symlink 化: Windows symlink 環境差リスク + Vercel build 保証なし
- 案 (c) submodule 化: 6/19 直前の破壊的変更 + DEC-019-053 と混乱 + Round 22 範囲超過

### 3.4 検証 4 case (適用後)

```bash
git check-ignore -v projects/COMPANY-WEBSITE/app/src/app/api/og/route.tsx
# Expected: ignore 判定なし
git check-ignore -v projects/COMPANY-WEBSITE/app/node_modules/foo
# Expected: projects/*/app/  (= 引き続き ignore)
git check-ignore -v projects/COMPANY-WEBSITE/app/.next/cache/foo
# Expected: projects/*/app/  (= 引き続き ignore)
git check-ignore -v projects/PRJ-004/app/src/foo.ts
# Expected: projects/*/app/  (= 他 PRJ 無影響)
```

---

## §4 visual regression baseline 取得 procedure

### 4.1 採用 path

- 経路: curl 経路 (Round 22)、Playwright 経路 (Round 23+ 移行)
- 保存先: `projects/COMPANY-WEBSITE/test/og-image-baseline/`
- 8 case: variant ∈ {home, service, case, updates} × locale ∈ {ja, en}
- dimension: 1200 × 630 px / 8-bit RGBA / 30-200 KB
- threshold: pixel diff 0.5% / sha256 同一環境では完全一致

### 4.2 検証 step

1. `pnpm dev` 起動 → 8 case curl で baseline 生成
2. `file` で dimension 確認 (全 8 件 1200 × 630)
3. `stat -c %s` で size 確認 (1000 byte 超 500 KB 未満)
4. `sha256sum > checksums.txt` で hash 記録
5. 3 回再生成して binary diff 0 を確認 (安定性検証)
6. baseline + checksums.txt を git commit

### 4.3 Vercel preview baseline (補助)

execution-readiness step 11 PASS 後に preview URL から取得し、`test/og-image-baseline-preview/` に並列保存。dev local との checksum diff で Edge runtime 差を可視化。

---

## §5 制約遵守確認

| 制約 | 遵守 | 備考 |
|---|---|---|
| 既存 OG route.tsx (path A) 無改変 | YES | 物理移送は task に含めず spec のみ |
| Dev-II R21 spec 4 件 absolute 無改変 | YES | 全 4 件 read-only 参照のみ |
| API 追加コスト $0 | YES | 採用 tool 全て OSS / 既存 stack |
| 副作用 0 | YES | 本 Round で物理 file 操作なし、.gitignore 編集なし |
| 絵文字 0 | YES | 4 ファイル全文目視確認済 |

---

## §6 R23 引継

### 6.1 Round 22 当日の実行 trigger

- step 1-10: dev 担当が単独実行 (path B 物理化 + import 修正 + build/dev 検証 + path A 削除 + git commit)
- step 11: Vercel CLI auth 後に preview deploy + 8 case curl + cache/fallback 検証
- step 12: Owner ack 取得後に `vercel deploy --prod`

### 6.2 Round 23+ 移行 task

- VRT CI 統合 (`.github/workflows/og-image-vrt.yml` 起票、Playwright + chromium)
- public/ 配下 (font/logo asset) の whitelist 化検討 (`og-gitignore-adjustment-spec.md` §5)
- `*.tsbuildinfo` 追加 ignore (必要時)
- locale segment 化 (`/api/og/[locale]/route.tsx`) 検討
- baseline 更新ポリシー運用開始 (design 変更 PR のみ `--update-snapshots`)

### 6.3 risk register (Round 22 当日 watch)

| risk | likelihood | impact | mitigation |
|---|---|---|---|
| Windows mkdir/cp 動作差 | 低 | 中 | Git Bash で実行 |
| import path 書換漏れ | 中 | 高 | `tsc --noEmit` で検出 |
| Vercel CLI auth 期限切れ | 中 | 中 | step 11 前に `vercel whoami` |
| pnpm lock 不整合 | 低 | 中 | `--frozen-lockfile` |
| baseline 取得時 false positive | 中 | 低 | 3 回再取得で diff 0 確認 |

---

## §7 rollback (短縮版、詳細は readiness §7)

| case | trigger | 手順 |
|---|---|---|
| A | step 1-9 で FAIL | path B 削除 + .gitignore checkout |
| B | step 10 で path A 削除済 後 FAIL | /tmp バックアップから復元 + path B 削除 |
| C | commit 後 push 前 | `git reset --hard HEAD~2` + case A/B |
| D | production deploy 後 | `git revert` 2 件 + 再 deploy |

---

## §8 CEO 報告事項 (要約)

- Round 22 で 4 ファイル (864 行) 起票完了、R21 4 spec (1,374 行) 絶対無改変
- 物理 migration readiness: **GO with conditions** (production のみ Owner ack 待ち NO-GO)
- .gitignore 推奨案: 案 (a) whitelist 追加 (4 行)、副作用最小
- VRT baseline 取得 procedure 確立: 8 case curl 経路、sha256 + 0.5% pixel diff threshold、Round 22 当日実行可
- API 追加コスト $0、副作用 0、絵文字 0 (制約全遵守)
- Round 22 後続 dev 担当への引継 readiness 完了

---

## §9 起票ファイル間整合性確認

- §1 表の 4 ファイル間で path / 行数 / 役割が排他的かつ網羅的
- §3 .gitignore patch は spec (#1) と readiness (#2 step 3-4) で同一表記
- §4 baseline 8 case 定義は procedure (#3) §1 と完全一致
- 全ての cross-reference path (`og-image-src-migration-spec.md` 等 R21 既存 spec) は absolute path 表記で本 Round 起票 file からも追跡可能
- §6.1 step 1-12 は readiness (#2) §6 と 1:1 対応、本報告の要約は readiness 詳細に従属

---

---

EOF
