# Web-Ops-T R33 → R34 引継 spec

## 0. メタ情報
- Round: 33 → 34 引継
- 担当: Web-Ops-T → Web-Ops-U
- 制約: ≤150 行厳守 / date-free / 副作用 0 / Owner 拘束 0 分 / 絵文字 0
- 行数 budget: 本書 約 140 行想定

## 1. R33 着地サマリ
- post-30day operational SOP expansion (Phase β/γ/δ spec 確立) 完遂
- portfolio v4 公開 actual (T0'''+14d / 5 file simulated published) 完遂
- GTC-11 D-Day post-record 30day longrun integration 完遂
- 17 trigger continuous monitoring 30day record actual 完遂
- R32 SOP 無改変保持
- KPI 5 軸 30d 累計 8/8 PASS 維持

## 2. R34 引継タスク

### 2.1 Phase β/γ/δ active 化判定
- T0'''+30d 時点で Phase α → β 移行判定実施
- 条件: 17 trigger 30d 累計 breach ≤ 2 件 + KPI 5 軸 8/8 PASS 維持
- 担当: Web-Ops-U
- 参照: web-ops-t-r33-post-30day-sop-expansion.md §5

### 2.2 portfolio v4 物理 deploy
- client 許可確認起票 (CEO 経由 Owner)
- 5 file 物理 deploy (`projects/COMPANY-WEBSITE/portfolio/`)
- Owner testimonial interview (CEO + Web-Ops 共同 / 10 分以内 / opt-in)
- SEO 検証 (deploy 後 7d / Search Console index 確認)
- 担当: Web-Ops-U + CEO
- 参照: web-ops-t-r33-portfolio-v4-publish-record.md §5

### 2.3 30day closeout 物理化
- T-30d-1: `organization/knowledge/retrospectives/prj-019-month-1.md` 生成
- T-30d-2: CEO 経由 Owner 戦略レビュー配信
- T-30d-3: `organization/knowledge/prj-019-lessons-learned.md` 起票
- T-30d-4: DEC-087 closeout 採決動議 (PM-Z 連動)
- 担当: Web-Ops-U + PM
- 参照: web-ops-t-r33-17-trigger-continuous-record.md §4

### 2.4 longrun integration W4 物理化
- 30d 累計値 W1〜W4 4 ウィンドウ aggregation 実体化
- Dev-NNN 4 module (post-launch-30day / memory-leak-detector / env-gate-audit / cost-forecast) 連動確認
- INDEX-v21 連動 (R34 ナレッジ統合候補)
- 担当: Web-Ops-U + Dev 部門
- 参照: web-ops-t-r33-30day-longrun-integration.md §6

### 2.5 60day Phase β 計画詳細化
- 週次 KPI レビュー 4 経路 (KPI サマリ / cost / regression / feedback) の active rotation 確立
- alert routing severity 段階移行 (Phase α warn → Phase β info 降格判定)
- 60day cost forecast 4 週 MA threshold 監視
- 担当: Web-Ops-U
- 参照: web-ops-t-r33-post-30day-sop-expansion.md §2

## 3. 引継 file index (R33 6 file)

| file | 行数 (概算) | 主内容 |
|------|------------|--------|
| web-ops-t-r33-post-30day-sop-expansion.md | 約 150 | Phase β/γ/δ spec |
| web-ops-t-r33-portfolio-v4-publish-record.md | 約 165 | T0'''+14d 公開 actual |
| web-ops-t-r33-30day-longrun-integration.md | 約 140 | GTC-11 D-Day 30day longrun |
| web-ops-t-r33-17-trigger-continuous-record.md | 約 175 | 17 trigger 30day record |
| web-ops-t-r33-r34-handover-spec.md | 本書 ≤150 | R34 引継 |
| web-ops-t-r33-summary.md | 約 60 | R33 完遂サマリ |

## 4. 制約継承事項
- R32 SOP file 無改変保持
- R32 17 trigger active 化 spec 無改変保持
- R32 portfolio v4 起票 spec 無改変保持
- date-free 方針継承 (T0''' / +14d / +30d / +60d / +90d 相対表記)
- 副作用 0 / API call $0 / Owner 拘束 0 分継承
- 絵文字 0 件継承

## 5. R34 期待成果

| 項目 | R33 着地 | R34 期待 |
|------|----------|----------|
| Phase active | α | α → β 移行判定 |
| portfolio v4 | simulated published | 物理 deploy |
| 30day closeout | record 完遂 | knowledge file 物理化 |
| longrun integration | spec + W1-W4 simulated | W4 物理化 |
| INDEX entries | 230 (v20) | 245 想定 (v21) |
| GTC GREEN | 11/11 維持 | 11/11 維持 |
| confidence | 100% lock 確定継承 | 100% lock 維持 + 30day actual evidence |

## 6. R34 リスク警戒
- portfolio v4 物理 deploy 前の client 許可確認漏れ → CEO escalation matrix 維持
- T-30d-4 DEC-087 closeout 動議の incident 条件再確認 (R34 採決前)
- Phase β alert threshold 緩和判定の早計化リスク → 60d 累計データ蓄積優先

## 7. 副作用 0 確認
- R32 / R33 既存 file 無改変保持
- 物理 deploy 0 件 (引継 spec 文書のみ)
- API call $0
- date-free 厳守

## 8. 完遂宣言
R33 Web-Ops-T Task 5 (R34 引継 spec) 完遂。5 引継タスク確立 / 制約継承明示 / 期待成果定義 / リスク警戒明示。行数 ≤150 厳守。
