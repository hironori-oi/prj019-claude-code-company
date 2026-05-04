# Sec SOP — 副作用 0 自動検証（DEC-019-066 §3.2 連動）

**起案**: Sec-L / Round 17 / 2026-05-05 / **対象 script**: `projects/PRJ-019/scripts/sec-side-effect-zero-check.sh`
**目的**: Round 完遂直後の git diff から「想定 artifact 以外の副作用候補」を機械的に検出し、PASS/FAIL gate を確立する。

---

## §1 適用範囲
- 全 Round 完遂時（dispatch 終了 → CEO 統合報告 起票前）
- Dev 部門 dispatch を含む round では mandatory、文書のみの round では optional
- CI integration: GitHub Actions `pull_request` event / pre-push hook の両系統で実行

## §2 実行手順
1. Round 開始 commit (= base) を `BASE_REF` 環境変数で指定（既定: `HEAD~1`）
2. `bash projects/PRJ-019/scripts/sec-side-effect-zero-check.sh` を実行
3. exit code 0 = PASS / exit code 1 = FAIL（違反詳細は `reports/_sec-automation/side-effect-zero-*.log`）
4. FAIL 時は CEO 通知 → 違反 commit を `git revert` または該当 hunk のみ patch revert

## §3 検出カテゴリ（4 種）
| ID | 検出条件 | 既定動作 |
|---|---|---|
| (a) | `*.test.ts` / `*.spec.ts` の DELETE / RENAME | FAIL |
| (b) | `*.sql` / `prisma/schema.prisma` / `supabase/migrations/` 改変 | FAIL |
| (c) | `package-lock.json` / `pnpm-lock.yaml` / `bun.lockb` / `yarn.lock` 改変 | FAIL |
| (d) | `.env*` / `credentials.json` / `*.pem` / `*.key` の追加・改変 | FAIL |

## §4 例外運用
- (b)(c) は「明示 DEC + Owner formal authorize」併存時のみ FAIL を override 可（CEO が `SEC_OVERRIDE=1` 環境変数指定）
- override 実行時は理由を `reports/_sec-automation/override-*.log` に追記して 5/26 review 対象に含める

## §5 CI integration（GitHub Actions 例）
```yaml
- name: Sec / side-effect zero gate
  run: |
    BASE_REF=${{ github.event.pull_request.base.sha }} \
    HEAD_REF=${{ github.event.pull_request.head.sha }} \
    bash projects/PRJ-019/scripts/sec-side-effect-zero-check.sh
```

## §6 5/26 review 連携
- 集計対象: violation 件数 / override 件数 / FAIL から PASS 復帰までの中央値時間
- 目標値: violation 0 件 / override < 1 件 / round / 復帰時間 < 30 分
