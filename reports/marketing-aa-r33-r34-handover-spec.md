# PRJ-019 Marketing-AA R33 → R34 引継 spec (≤150 行 厳守)

**Round**: R33 (9 並列 7 軸目 / Marketing-AA → 次 R34 Marketing-BB 想定)
**Generated**: R33 sprint
**位置付け**: R33 完遂 → R34 引継 spec
**Owner directive**: 「Round 33 9 並列 GO 引き続き丁寧に進めてください」+ date-free 継承
**行数制約**: ≤150 行 厳守 (R32 PM-Y 174 行超過教訓反映)
**API call**: $0 / 副作用: 0 / 絵文字: 0

---

## 1. R33 Marketing-AA 完遂着地

| 軸 | 成果物 | status |
|---|--------|-------|
| 1 | 30day closeout 公開 actual | 完遂 |
| 2 | KPT v2 反映 (15 → 23 件) | 完遂 |
| 3 | Twitter T0'''+24h+α publish actual | 完遂 |
| 4 | Blog T0'''+7d publish actual | 完遂 |
| 5 | post-mortem v2 (R32+R33 統合) | 完遂 |
| 6 | R34 引継 spec (本 file) | 完遂 |
| 7 | R33 summary | 完遂 |

---

## 2. R34 Marketing-BB タスク候補 (5 件)

### 2.1 portfolio v4 公開 actual verify (Web-Ops-T と連携)
- R33 Web-Ops-T 並走完遂後の verify
- 13 KPI publishing 整合性 check
- 副作用 0 / API call $0

### 2.2 60day longrun KPI publishing
- R33 Dev-QQQ post-launch 60day longrun 物理化と連携
- weekly review #5 〜 #8 (T0'''+36d 〜 T0'''+57d) 想定
- 13 KPI 60day 累計 publishing

### 2.3 KPT v3 反映 (23 → 30 件想定)
- R33 v2 23 件 → R34 v3 30 件想定 (+7 件)
- KPT auto extraction 連携 (Dev-PPP kpt-extractor.ts 物理化済)

### 2.4 W7-D 連続改善 loop publishing
- R33 Dev-RRR W7-D 物理化と連携
- KPT → DEC motion 自動連鎖 publishing

### 2.5 post-mortem v3 (60day 統合)
- R33 v2 + R34 60day publishing 統合
- final 確定 6 条件想定 (5 → 6 拡張)

---

## 3. R33 → R34 引継 absolute 制約

| 制約 | 状態 |
|------|------|
| 6 absolute file 無改変 | R34 も継承 (改変 0 件厳守) |
| date-free 厳守 | R34 も継承 (固定日付 0 件) |
| API call $0 | R34 も継承 |
| 副作用 0 | R34 も継承 (新規 file 追加のみ) |
| 絵文字 0 | R34 も継承 |
| Owner 拘束 0 min | R34 も継承 |
| fix forward-only | R34 も継承 |
| ≤150 行 handover-spec | R34 厳守 |

---

## 4. R33 既存成果物 absolute 無改変保持 list

| file | R33 → R34 |
|------|----------|
| marketing-aa-r33-30day-closeout-actual.md | 無改変保持 |
| marketing-aa-r33-kpt-v2-reflection.md | 無改変保持 |
| marketing-aa-r33-twitter-publish-actual.md | 無改変保持 |
| marketing-aa-r33-blog-publish-actual.md | 無改変保持 |
| marketing-aa-r33-post-mortem-v2.md | 無改変保持 |
| marketing-aa-r33-r34-handover-spec.md (本 file) | 無改変保持 |
| marketing-aa-r33-summary.md | 無改変保持 |

---

## 5. R32 既存成果物 absolute 無改変保持 list (継承)

| file | 状態 |
|------|------|
| marketing-z-r32-confidence-100-lock-actual.md | R32 無改変継承 |
| marketing-z-r32-30day-baseline-actual.md | R32 無改変継承 |
| marketing-z-r32-external-comms-public.md | R32 無改変継承 |
| marketing-z-r32-post-mortem-actual.md | R32 無改変継承 |

---

## 6. R34 推奨 priority

| priority | task | 理由 |
|----------|------|------|
| P0 | portfolio v4 公開 actual verify | R33 Web-Ops-T と整合 |
| P0 | 60day longrun KPI publishing | R33 Dev-QQQ と整合 |
| P1 | KPT v3 反映 | KPT auto extraction 連携 |
| P1 | W7-D 連続改善 loop publishing | R33 Dev-RRR と整合 |
| P2 | post-mortem v3 | 統合最終 |

---

## 7. R34 期待 metrics

| metric | R33 末 | R34 末想定 |
|--------|-------|-----------|
| KPT 件数 | 23 | 30 |
| external comms 媒体 | 4 種 | 5 種 (Newsletter 追加想定) |
| weekly review 累計 | 4 回 (30day) | 8 回 (60day) |
| KPI 累計 | 13 KPI 30day | 13 KPI 60day |
| post-mortem 版 | v2 | v3 |
| DEC ledger | 52 confirmed | 53+ confirmed 想定 |

---

## 8. 結語

R33 Marketing-AA 完遂 → R34 Marketing-BB 引継 spec 完成. ≤150 行制約厳守 (R32 PM-Y 教訓反映). 5 task 候補 / absolute 制約 8 種 / 既存成果物 11 件 無改変保持.

副作用 0 / API call $0 / 絵文字 0 / Owner 拘束 0 min / fix forward-only / date-free 厳守.

—— Marketing-AA / R33 9 並列 7 軸目 / R34 引継 spec 完遂 (約 130 行 / ≤150 行 厳守達成)
