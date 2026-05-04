# Marketing-L Round 18 — Launch Polish & Content v2.1 / v3.3 推進レポート

## 担当
- Agent: Marketing-L (PRJ-019 Round 18 第 2 波)
- 起票日: 2026-05-05
- 派生: Round 17 Marketing-K 起票 3 文書を baseline とし、Round 18 で polish 推進

## ミッション
1. 6/19 launch dry-run script に 5 つの新セクション (T-24h / T-2h / T-0 / T+1h / T+24h) を append-only で追記
2. EN v2.1 草案 (v2.0 の polish 版) を別ファイルで起票
3. Portfolio v3.3 草案 (v3.2 の polish 版) を別ファイルで起票
4. 本レポート作成 (200 行以内)

## 制約遵守状況
- Marketing-K 起票 3 文書 (launch script 110 行 / en v2.0 / portfolio v3.2) への破壊的変更: 0
- launch script は append-only (既存 110 行不変、Section A-E を末尾追記のみ)
- en v2.1 / portfolio v3.3 は別ファイル起票 (v2.0 / v3.2 は historical baseline)
- 絵文字 0 / Heroicons 以外のアイコン参照 0
- API call $0 / 副作用 0 / DB 変更 0 / cron 変更 0 / DNS 変更 0

## 成果物 (4 ファイル)
1. `projects/COMPANY-WEBSITE/marketing/launch-rehearsal-execution-script-2026-06-19.md` (Marketing-K 110 行 + Marketing-L 追記 約 100 行 = 約 210 行)
2. `projects/COMPANY-WEBSITE/marketing/en-v2.1-draft.md` (新規 / 約 120 行)
3. `projects/COMPANY-WEBSITE/marketing/portfolio-v3.3-draft.md` (新規 / 約 120 行)
4. `projects/PRJ-019/reports/marketing-l-r18-launch-polish.md` (本レポート / 約 130 行)

## 1. Launch script polish: Section A-E 追記

### Section A: T-24h チェックリスト (8 アイテム, Owner 単独実行, 30 分以内)
- Owner inbox / GO/NoGO 判断票 / dry-run 結果再読 / PII 範囲最終確認 / canonical hash 確認 / Slack 通知設定 / スケジュール blocker 確保 / NoGO 連絡 SLA 通達

### Section B: T-2h チェックリスト (7 アイテム, Web-Ops + Marketing 同期, 30 分)
- Lighthouse 4 score / cron PR merge ready / canonical SHA256 / ソーシャル素材予約 / Slack 同期 / smoke test preview 再実行 / Review sign

### Section C: T-0 公開実行 (5 step, 5 分以内)
- 09:00:00 Owner GO 受領明示 → 09:00:30 vercel promote prod → 09:01:00 DNS / CDN purge → 09:01:30 monitoring 3 dashboard open → 09:02:00 全部署 reply
- 異常時の Chunk 09-a rollback への即時切替パス明示

### Section D: T+1h post-launch 検証 (4 カテゴリ, 30 分)
- Lighthouse 本番 / Sentry error rate / GA realtime / smoke test 本番 scope
- 5xx 0 件 / 4xx baseline +/-10% を PASS 条件として明記

### Section E: T+24h KPI snapshot (4 主指標 + 補助 metric, 60 分)
- impression / click / signup / bounce + avg session / pages per session / device 比率
- 出力先: `dashboard/launch-kpi-2026-06-28.md` (本番後新規作成、本草案では予約のみ)
- 7/27 30 日 review への bridge 接続を明示

## 2. EN v2.1 草案 polish 内容

### 3 軸 polish 方針
1. Clearer value prop: 「AI-augmented speed」を「weeks, not quarters」「19 SMB engagements」で計測可能語化
2. Case study integration: PRJ-002 / 007 / 012 / 019 の 4 件 summary 行末を共通 metric 1 行に統一 (Lead time / Stack / Phase)
3. SEO meta improvement: title / description / canonical / hreflang / OG image / structured data (JSON-LD) / sitemap を v1.1 baseline から差分明示

### 主な変更箇所
- Hero 文言改善 (1 行)
- About SMB-focused 表現 (1 行)
- Strengths に「11 HITL gate」明示 + Speed 列に「Median lead-to-launch 4-8w」追記
- Case Studies 4 件 metric 統一 (4 行)
- KPI に benchmark target 併記 (4 行)
- SEO meta 章新設 (新章 約 12 行)

### 不変保証
- Hero image / 章順 / フォント / 配色 / レイアウト 0 変更
- ja 版への差分 transfer なし
- v2.0 / v1.1 への直接編集 0

## 3. Portfolio v3.3 草案 polish 内容

### 3 軸 polish 方針
1. PRJ-019 entry 詳細化: SMB 移植可能性 + Phase 2 ロードマップを 1 sentence 追記
2. Metrics table 統一: 13 件全体を 1 枚の table に集約 (PRJ-002/007/012/019 highlight + 残 9 件集約行)
3. Tech stack badges: 各 Case 見出し直下に共通形式 badge 1 行配置 (Heroicons `tag` icon 想定)

### 主な変更箇所
- Case 13 PRJ-019 summary 90-110 words 化 + key metrics +1 (parallel agent waves)
- Metrics overview table 新設 (5 行 + header / 13 件集約)
- Round 16 / 17 / 18 成果物の反映 1 sentence (Round 18 launch script 5-stage cadence を追記)
- Stack badge 構造設計のみ (physical CSS は Web-Ops 担当)

### 不変保証
- Case 01-11 の文言・metric 0 変更
- thumbnail 差し替え 0
- 章順入れ替え 0
- v3.2 / v3.1 への直接編集 0

## 整合性

### Round 17 Marketing-K 起票との連続性
- launch script: Marketing-K Chunk 01-10 は不変、Marketing-L Section A-E は append-only で 1:1 対応 (A → Chunk 10-b、C → Chunk 07、D → Chunk 08、E → 30 日 review bridge)
- en: v2.0 → v2.1 で 3 軸 polish (value prop / case integration / SEO)、v2.0 不変
- portfolio: v3.2 → v3.3 で 3 軸 polish (PRJ-019 詳細 / metrics table / tech stack badges)、v3.2 不変

### 6/19 dry-run / 6/27 公開との接続
- 6/19 dry-run: 本草案 3 文書 (script / v2.1 / v3.3) の方向性 OK 確認のみ (Owner 5 分以内)
- 6/27 公開: v1.1 / v3.1 を canonical deploy、v2.1 / v3.3 草案は据え置き
- 7/27 30 日 review: KPI 実数値 + SEO meta + tech stack badges を反映した v2.1 final / v3.3 final を physical deploy 候補化

### Owner 残動作との接続
- T-24h (Section A): 8 アイテム / 30 分以内
- T-2h (Section B): 7 アイテム / 30 分 (Web-Ops + Marketing 主導、Owner 監視のみ)
- T-0 (Section C): 5 step / 5 分以内 (CEO 経由 GO 受領明示)
- T+1h (Section D): 4 カテゴリ / 30 分 (Web-Ops 主導、Owner 報告受信のみ)
- T+24h (Section E): 4 主指標 / 60 分 (Marketing 主導、Owner 報告受信のみ)
- 累積 Owner 操作時間: 6/27 当日 約 60 分 + 6/26 T-24h 約 30 分 = 1.5 時間以内

## blocker / 懸念点
- 0 blocker: 物理 deploy 0 / API 0 / DB 0 のため、本 Round 内で阻害要因なし
- 1 懸念: Section E の `dashboard/launch-kpi-2026-06-28.md` は本番後新規作成のため、6/27 dryrun-result.md と命名衝突しないかを Round 19 で確認推奨
- 1 確認事項: en v2.1 SEO meta 章の OG image (`/og/launch-2026-06-27.png`) を Web-Ops が 6/26 までに制作するか、CEO 承認経由で確認推奨

## KPI / 評価軸 (Round 18 完遂判定)
- launch script 5 セクション追加: 完了
- en v2.1 草案 110-130 行: 約 120 行で達成
- portfolio v3.3 草案 110-130 行: 約 120 行で達成
- 本レポート 200 行以内: 約 130 行で達成
- v2.0 / v3.2 不変保証: 完了 (Marketing-K 文書 0 編集)
- 絵文字 0 / Heroicons 専用: 完了
- API $0 / 副作用 0: 完了

## 次 Round (Round 19) への引き継ぎ
- launch script Section A-E と Marketing-J `launch-rehearsal-2026-06-20.md` の chunk 整合性再確認
- en v2.1 SEO meta 章の Web-Ops 側実装観点レビュー (CSS / structured data validation)
- portfolio v3.3 metrics table の visual モック化 (Web-Ops 担当領域)
- 6/19 dry-run 後の `dashboard/launch-dryrun-2026-06-19-result.md` 起票 (本草案では予約のみ)

## 副作用 0 最終担保
- 編集ファイル: 1 件 (launch script append-only)
- 新規ファイル: 3 件 (en v2.1 / portfolio v3.3 / 本レポート)
- DB / cron / DNS / API / 外部送信: すべて 0
- Marketing-K 文書への破壊的変更: 0
