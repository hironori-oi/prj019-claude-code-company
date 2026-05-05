# PM-U R28 DEC-019-083 formal 起案レポート

- 起案者: PM-U (Round 28 / 10 件目 PM sprint)
- 起案日時: 2026-05-06
- 対象: PRJ-019 Phase 2 W6 production GA 入口条件 + rollout/monitoring/rollback SOP

## 1. 起案サマリ
W6 production GA への入口条件 4 項目 AND を確定し、rollout SOP / 1week monitoring SOP / rollback 経路を decisions.md 末尾に物理起案（line 1949-2067 相当 / +120 行）。

## 2. 入口条件 4 項目 AND
| # | 項目 | R28 着地条件 |
|---|------|--------------|
| 1 | W6a 物理化完遂 | spec → impl atomic / harness +5 PASS |
| 2 | W6b 物理化完遂 | spec draft → impl / canary stage gating 実装 |
| 3 | ARCH-01 Phase B-3 PA-01-03 完遂 | OpenClaw runtime PA 公開 readiness 物理化 |
| 4 | DEC-068 v2 議決完遂 | R28 議決 timeline 80-100 min |

## 3. rollout SOP（5 stage）
- stage 0: internal canary N=2 / 2 日
- stage 1: 1% canary（N=2）/ 48h / error rate < 0.5%
- stage 2: 10% canary（N=20）/ 72h / p95 < 800ms / 5xx < 0.1%
- stage 3: 50% canary（N=100）/ 168h / 全 SLO 緑
- stage 4: 100% rollout（N=200）= W6 GA 達成
- 最短 14 日 / 異常時自動 hold

## 4. 1week monitoring SOP
- D+1: 1h sampling / Sentry + budget alert 連動
- D+2-3: 4h sampling / D1 retention > 60%
- D+4-7: 8h sampling / CSAT > 4.0 / budget < 80%/7day
- D+7: 統括レポート → CEO → Owner / W6 confirmed 遷移

## 5. rollback 経路
- trigger 1（即時）: error > 2% / p95 > 2000ms / 5xx > 1% 5min 連続
- trigger 2（hold + 検証）: D1 retention < 50% / CSAT < 3.5 / budget burn > 100%/7day
- 手順: stage 巻戻し → Vercel alias 切替 < 60s → feature flag 無効化 → Slack/email 通知 → 1h 以内 closeout
- post-mortem: 7 day 以内に DEC-019-XXX 追記議決で再発防止

## 6. 代替案比較サマリ
- A（4 項目 → 2 項目縮小）: production 事故 risk 高 → **不採用**
- B（big bang rollout）: blast radius 過大 / PRJ-007 lessons 違反 → **不採用**
- C（rollback コミュニケーションのみ）: 技術的実体性欠落 → **不採用**

## 7. 影響範囲
- decisions.md: 1947 → 2067 想定（実着地 1991 行、空行調整含む）
- 議決数: 45 → 46（+1）
- 既存 DEC 改変: 0
- 副作用 / 絵文字 / API: 全 0
- Owner 拘束: 0 分

## 8. R29 引継候補
- W6a/W6b/PA-01-03 物理化進捗 verification
- canary stage gating の harness 化（SLO check 自動化）
