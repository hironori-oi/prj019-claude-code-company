# Web-Ops-E Round 18 第 2 波 完遂報告: 公開前運用設定 + Owner 残動作前さばき

**発信**: Web-Ops 部門（Web-Ops-E agent）
**宛先**: CEO（Round 18 整理レポート用）
**Round**: PRJ-019 Round 18（9 並列、第 2 波）
**起票日**: 2026-05-05
**関連 DEC**: DEC-019-054 / 055 / 062 / 033 / DEC-018-047
**target**: 2026-06-19 09:00 JST 公開

---

## 1. 完遂サマリ

PRJ-019 公開（2026-06-19 09:00 JST）に向け、Owner 残動作 4 件を card 形式に分解し、公開前運用設定 7 項目を 15 分粒度に落とした runbook を新設した。Marketing-L が並行して進める launch rehearsal script とは領域分離（rehearsal は marketing/、運用設定は runbooks/）し、衝突なし。

成果物 2 件を `projects/COMPANY-WEBSITE/runbooks/` に新設、報告 1 件を `projects/PRJ-019/reports/` に提出。production website code（src/ / app/）への変更はゼロ、運用領域 documentation のみ。

## 2. 成果物

- `projects/COMPANY-WEBSITE/runbooks/launch-pre-ops-checklist.md`（NEW、約 130 行）
  - 0. 概要 / 公開日時 / 担当
  - 1. 環境変数（Production / Preview / Development、9 keys 表）
  - 2. ドメイン / DNS（CNAME / TTL 300s / SSL 証明書）
  - 3. CDN / Edge cache（Cache-Control 3 ルール / ISR / purge 権限）
  - 4. monitoring（Sentry DSN / GA4 ID / Vercel Analytics / 閾値）
  - 5. RLS / Supabase（anon select policy / service role server-only / PITR 7 日）
  - 6. backup / rollback（Vercel deploy promote / DB snapshot 5–15 min）
  - 7. Owner 実行アイテム 7 件（OWN-PRE-01〜07、5–15 min 粒度）

- `projects/COMPANY-WEBSITE/runbooks/owner-action-card-2026-06-19.md`（NEW、約 75 行）
  - CARD A: 公開前運用設定（複合 / 7 sub-card / 80 min / 期限 6/12）
  - CARD B: 5/22 case 切替承認（10 min / 期限 5/22）
  - CARD C: 6/19 公開最終確認（15 min / 期限 6/19 09:00）
  - CARD D: Round 18+ authorize（5 min / 期限 R18 着地+24h）

- 本報告（`projects/PRJ-019/reports/web-ops-e-r18-launch-pre-ops.md`）

## 3. 既存資産との接続

既存の 3 runbook（`public-launch-sop.md` / `cron-fallback-switch.md` / `slack-alert-routing.md`）は維持し、新 checklist から相互参照を張った。`public-launch-sop.md` §2 の前提条件「公開前運用設定 4 件」が、本 checklist §7 の 7 件に拡張・粒度向上した形で接続。

公開日時は task brief の 2026-06-19 09:00 JST を採用（既存 SOP の 2026-06-27 / 6-20 case はより前倒しの確定値で上書きされた認識）。差分は CEO Round 18 整理レポートで明示確認推奨。

## 4. CEO への提案

1. **Owner への card 配布タイミング**: Round 18 整理レポート提出時に CARD A〜D を別添として Owner に同時配布
2. **CARD B preview URL の確定**: 5/22 期限のため、Web-Ops が 5/15 までに差替え案 PR を提示する追加 task を Round 19 で発行
3. **公開日時の決裁**: 既存 SOP との日付差分（6/27 / 6/20 / 6/19）を Round 18 で正式採決し、DEC-019-068 想定で確定

## 5. 制約遵守確認

- Marketing-L の launch rehearsal script: 触らず（marketing/ 領域）、checklist §0 で領域分離を明記
- Production website code（web-prod / src/）: 変更ゼロ、runbooks/ documentation のみ
- 絵文字: ゼロ
- Heroicons references: 本書では UI 言及なしのため適用なし（runbook は documentation のみ）

## 6. blocker

なし。Owner 残動作 4 件の card 化は完遂。CARD B の preview URL は 5/15 までに Web-Ops が用意する必要があるが、Round 18 範囲外（Round 19 以降の task）。

## 7. 次手

- Round 18 着地後、CEO 整理レポートに本報告を組み込み
- Round 19 で CARD B preview URL 用意を Web-Ops 部門に発行
- D-7（2026-06-12）に CARD A 全件 green 確認

---

**完遂時刻**: 2026-05-05（Round 18 第 2 波内）
**所要 round 内時間**: 単発 dispatch
**次回 review**: Round 19 起動時 / D-7 / D-Day
