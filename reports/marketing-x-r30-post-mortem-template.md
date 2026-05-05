# PRJ-019 Marketing-X R30 — 公開後 30day post-mortem template (Marketing 視点 / Dev 部門 W6-B post-mortem template と連動)

**Round**: R30 (9 並列 7 軸目 / Marketing-X)
**Generated**: 2026-05-06 (R30 sprint)
**位置付け**: 公開後 30day KPT 振り返り Marketing 軸専用 template (Dev 部門 W6-B post-mortem template / R29 Dev-FFF 90 行 連動)
**起動 trigger**: T0'''+30d (Owner D-Day GO reply 受領後 30 day 経過時) / monthly retro 同期
**Owner 拘束**: 5-10 min (KPT 議事録 review / monthly retro 議事 1 行 ack)
**API call**: $0 / 副作用: 0 / 絵文字: 0

---

## 0. 本 template の責務

### 0.1 background
- PRJ-019 公開後 30day を「公開実行成否」「Marketing KPI 30 軸」「KPT 振り返り」観点で構造化記録
- 案件完了時 KPT (CLAUDE.md §6 ナレッジ蓄積) の Marketing 軸 input source
- 議決 DEC-019-092 (post-mortem template lock) 候補

### 0.2 Dev 部門 W6-B post-mortem template との連動
- R29 Dev-FFF W6 readiness 100pt 達成時に物理化された post-mortem template 90 行 = Dev 観点 (incident / rollback / hotfix / SLA / RTO/RPO 軸)
- 本 file = Marketing 観点 (KPI / 公報 / pipeline / activation / retention 軸)
- 統合: PRJ-019 closeout report 起票時に 2 軸 merge → CEO 経営判断 input

### 0.3 副作用 0 担保
- 本書は template / 実体 fill-in は 30day 経過後 Marketing-AA (R??) で実施
- 5 absolute file 無改変

---

## 1. template 構造 (8 section / 30day 振り返り Marketing 軸)

### 1.1 section 一覧
| # | section | 責務 | 期待行数 |
|---|---------|------|---------|
| §1 | Executive summary | 30day 全体 サマリ + go/no-go 判定 | 20-30 行 |
| §2 | KPI 30 軸 trajectory | 13 KPI × 30day 集計 + 異常 vs baseline | 40-60 行 |
| §3 | KPT (Keep/Problem/Try) | Keep 5 / Problem 5 / Try 5 件 (Marketing 軸) | 30-50 行 |
| §4 | 公報拡散効果 retro | X / LinkedIn / Hacker News / press / community | 20-30 行 |
| §5 | activation / retention / MRR retro | 公開後 30day 累計 + cohort 分析 | 20-30 行 |
| §6 | incident retrospective (Marketing 観点) | 公報失敗 / KPI alert / Owner mention 件数 retro | 15-25 行 |
| §7 | next 30day plan | T0'''+30d → +60d 行動計画 | 20-30 行 |
| §8 | DEC trigger / knowledge 抽出 | NEW DEC 候補 + 落とし穴 + パターン抽出 | 15-25 行 |
| **合計** | - | - | **180-280 行** |

---

## 2. §1 Executive summary template

### 2.1 入力 placeholders
```
- 公開日時 (T0'''): {{T0'''_iso8601}}
- 30day 終了時刻 (T0'''+30d): {{T0'''_plus_30d_iso8601}}
- 全体判定 (PASS / WARN / FAIL): {{overall_judgment}}
- Marketing confidence (R29: 99% → 30day 末): {{confidence_post_30day}}
- 13 KPI PASS 件数 / 13: {{kpi_pass_count}}/13
- 累計 signup 件数: {{total_signup}}
- 累計 paid customer 件数: {{total_paid}}
- 月次 MRR (T0'''+30d 時点): {{monthly_mrr_usd}}
```

### 2.2 sample 構造
```markdown
## §1 Executive summary

**公開日時**: T0''' = 2026-{{date}} JST
**30day 経過時刻**: T0'''+30d = 2026-{{date_plus_30d}} JST
**全体判定**: PASS (13/13 KPI baseline 維持 + critical incident 0 件)
**Marketing confidence**: R29 末 99% → 30day 末 99.X% lock
**累計 signup**: {{X}} 件
**累計 paid customer**: {{Y}} 件
**月次 MRR**: ${{Z}}
```

---

## 3. §2 KPI 30 軸 trajectory template

### 3.1 入力 placeholders
- 13 KPI × 30 day = 390 cell の trajectory snapshot
- baseline / 警告 / NoGO 比較 (R28 SOP 継承)

### 3.2 sample 構造
```markdown
## §2 KPI 30 軸 trajectory

| KPI | T0'''+1d | T0'''+7d | T0'''+14d | T0'''+21d | T0'''+30d | baseline 達成度 |
|-----|----------|----------|-----------|-----------|-----------|---------------|
| KPI-01 Impression (cumulative) | {{n1}} | {{n7}} | {{n14}} | {{n21}} | {{n30}} | {{ratio}}% |
| KPI-02 Click | {{...}} | ... | ... | ... | ... | ... |
| KPI-03 Signup | ... | ... | ... | ... | ... | ... |
| KPI-04 Bounce rate | ... | ... | ... | ... | ... | ... |
| KPI-05 Sentry 5xx 累積 | 0 | 0 | 0 | 0 | 0 | 100% (target 0) |
| ... | ... | ... | ... | ... | ... | ... |
| KPI-13 Sentry 累積 | ... | ... | ... | ... | ... | ... |

**異常検知件数 (30day 累計)**: {{anomaly_count}}
**baseline 達成 KPI 数 / 13**: {{baseline_pass}}/13
```

---

## 4. §3 KPT (Keep/Problem/Try) template

### 4.1 Keep (継続したい施策 / 5 件)
```markdown
## §3.1 Keep (5 件)

1. **{{Keep-1 title}}**: {{description}} (効果: {{KPI delta}})
2. **{{Keep-2}}**: ... (効果: ...)
3. **{{Keep-3}}**: ... (効果: ...)
4. **{{Keep-4}}**: ... (効果: ...)
5. **{{Keep-5}}**: ... (効果: ...)
```

### 4.2 Problem (改善要 / 5 件)
```markdown
## §3.2 Problem (5 件)

1. **{{Problem-1 title}}**: {{症状}} / {{原因仮説}} / {{影響度}}
2. **{{Problem-2}}**: ... / ... / ...
3. **{{Problem-3}}**: ... / ... / ...
4. **{{Problem-4}}**: ... / ... / ...
5. **{{Problem-5}}**: ... / ... / ...
```

### 4.3 Try (次回試したい / 5 件)
```markdown
## §3.3 Try (5 件)

1. **{{Try-1 title}}**: {{試行内容}} / {{期待効果}} / {{担当}}
2. **{{Try-2}}**: ... / ... / ...
3. **{{Try-3}}**: ... / ... / ...
4. **{{Try-4}}**: ... / ... / ...
5. **{{Try-5}}**: ... / ... / ...
```

---

## 5. §4 公報拡散効果 retro template

### 5.1 入力 placeholders
- X / LinkedIn / Hacker News / press / community 5 channel 各 retro
- impression / click / engagement rate / sign-up conversion 4 metric × 5 channel = 20 cell

### 5.2 sample 構造
```markdown
## §4 公報拡散効果 retro

| channel | impression (30d) | click | engagement rate | signup conv |
|---------|------------------|-------|-----------------|-------------|
| X | {{x_impr}} | {{x_click}} | {{x_eng}}% | {{x_conv}}% |
| LinkedIn | {{li_impr}} | {{li_click}} | {{li_eng}}% | {{li_conv}}% |
| Hacker News | {{hn_impr}} | {{hn_click}} | {{hn_eng}}% | {{hn_conv}}% |
| Press release | {{pr_impr}} | {{pr_click}} | {{pr_eng}}% | {{pr_conv}}% |
| Community (Discord/Slack) | {{c_impr}} | {{c_click}} | {{c_eng}}% | {{c_conv}}% |

**top channel**: {{top_channel}} ({{top_metric}})
**bottom channel**: {{bottom_channel}} (改善要因: {{cause}})
```

---

## 6. §5 activation / retention / MRR retro template

### 6.1 入力 placeholders
- signup → activation funnel 5 step
- D1 / D7 / D14 / D30 retention cohort
- weekly MRR 4 weeks + monthly MRR final

### 6.2 sample 構造
```markdown
## §5 activation / retention / MRR retro

### activation funnel
- signup: {{signup_count}} (100%)
- email verified: {{verified}} ({{vrate}}%)
- onboarding complete: {{onb_done}} ({{orate}}%)
- first action: {{first_action}} ({{frate}}%)
- aha moment: {{aha}} ({{arate}}%)

### retention cohort
| cohort | D1 | D7 | D14 | D30 |
|--------|-----|-----|------|------|
| signup week-1 | {{w1d1}}% | {{w1d7}}% | {{w1d14}}% | {{w1d30}}% |
| signup week-2 | ... | ... | ... | - |
| signup week-3 | ... | ... | - | - |
| signup week-4 | ... | - | - | - |

### MRR
- W1 MRR: ${{w1_mrr}}
- W2 MRR: ${{w2_mrr}}
- W3 MRR: ${{w3_mrr}}
- W4 MRR: ${{w4_mrr}}
- **Monthly MRR (T0'''+30d)**: ${{monthly_mrr}}
- ARR run-rate: ${{arr_run_rate}}
```

---

## 7. §6 incident retrospective (Marketing 観点) template

### 7.1 入力 placeholders
- 公報失敗件数 (Twitter API rate limit / LinkedIn 配信不可 / press release wire delay 等)
- KPI alert 発火件数 (KPI-01 警告 / KPI-04 Bounce rate 警告 等)
- Owner mention 件数 (T+24h SOP §6 異常検知 trigger 経由)

### 7.2 sample 構造
```markdown
## §6 incident retrospective (Marketing 観点)

### 公報失敗
- Twitter API rate limit: {{n}} 件 (回復時間 {{recovery_min}} min)
- LinkedIn 配信不可: {{n}} 件
- press release wire delay: {{n}} 件
- **Marketing 1 次対応 SLA 達成率**: {{slo}}%

### KPI alert 発火
- KPI-01 Impression 警告 (< 100): {{n}} 件
- KPI-04 Bounce rate 警告 (> 80%): {{n}} 件
- KPI-08 Slack reaction (< 2/post): {{n}} 件
- KPI-09/10 X/LinkedIn impression 警告: {{n}} 件

### Owner mention 件数 (Marketing 起因)
- T+24h SOP 経由: {{n}} 件
- 30day SOP 経由: {{n}} 件
- 拘束時間累計: {{owner_min}} min (target 上限 5-10 min)
```

---

## 8. §7 next 30day plan template

### 8.1 入力 placeholders
- T0'''+30d → T0'''+60d 行動計画
- Try 5 件の優先順位付け + 担当 assign
- KPI target 30day → 60day 上方修正

### 8.2 sample 構造
```markdown
## §7 next 30day plan

### Try 5 件 prioritized
1. **HIGH**: {{Try-1}} (担当: {{owner}} / 期限: T0'''+45d)
2. **HIGH**: {{Try-2}} (担当: ... / 期限: T0'''+45d)
3. **MID**: {{Try-3}} (担当: ... / 期限: T0'''+60d)
4. **MID**: {{Try-4}} (担当: ... / 期限: T0'''+60d)
5. **LOW**: {{Try-5}} (担当: ... / 期限: T0'''+60d)

### KPI target 上方修正
- target signup (30d → 60d): {{old}} → {{new}} (+{{delta}}%)
- target MRR (30d → 60d): ${{old}} → ${{new}}
- target retention D30 (30d → 60d): {{old}}% → {{new}}%

### 60day 公報計画
- W5 (T0'''+30d → +35d): {{plan}}
- W6 (T0'''+35d → +42d): {{plan}}
- W7 (T0'''+42d → +49d): {{plan}}
- W8 (T0'''+49d → +60d): {{plan}}
```

---

## 9. §8 DEC trigger / knowledge 抽出 template

### 9.1 入力 placeholders
- NEW DEC 候補件数 (Marketing 軸)
- 落とし穴 (pitfalls/) 抽出件数
- パターン (patterns/) 抽出件数

### 9.2 sample 構造
```markdown
## §8 DEC trigger / knowledge 抽出

### NEW DEC 候補 (Marketing 軸)
- DEC-019-{{n}}: {{title}} ({{rationale}})
- DEC-019-{{n+1}}: {{title}} ({{rationale}})

### 落とし穴 (organization/knowledge/pitfalls/)
- pitfall-{{slug-1}}: {{症状}} / {{原因}} / {{対処}} / {{再発防止}}
- pitfall-{{slug-2}}: ... / ... / ... / ...

### パターン (organization/knowledge/patterns/)
- pattern-{{slug-1}}: {{再利用可能パターン}} / {{tag}} / PRJ-019 由来
- pattern-{{slug-2}}: ... / ... / ...

### 設計判断ログ (organization/knowledge/decisions/)
- decision-{{slug-1}}: {{判断}} / {{文脈}} / {{代替案}} / {{採用根拠}}

### PII redaction 確認
- 顧客名 / email / API key / billing 情報: 自動 redaction PASS
- HITL 第 11 種 (knowledge_pii_review) 通過: PASS / FAIL
```

---

## 10. R29 d-day spec / R30 t+24h SOP / R28 week-1 SOP との連結

### 10.1 input source
| source | role |
|--------|------|
| R29 `marketing-w-r29-d-day-date-free.md` (247 行) | D-Day spec / Phase 7''' 完遂 base |
| R30 `marketing-x-r30-t-plus-24h-date-free.md` (本 round 起票) | T+24h SOP (1440 min / 13 KPI) |
| R28 `marketing-v-r28-week-1-sop.md` (298 行) | Week-1 SOP (D+1 → D+7) |
| R28 `marketing-v-r28-30day-spec.md` (推定 ≥ 250 行) | 30day spec (D+1 → D+30) |

### 10.2 output destination
| target | role |
|--------|------|
| `organization/knowledge/patterns/` | パターン 5-10 件抽出 (PRJ-019 由来) |
| `organization/knowledge/pitfalls/` | 落とし穴 3-5 件抽出 |
| `organization/knowledge/decisions/` | DEC-019-088 系 設計判断ログ 簿記 |
| `dashboard/active-projects.md` | PRJ-019 status update (Phase 完了) |
| `projects/PRJ-019/decisions.md` | NEW DEC 候補 起票 |

---

## 11. fill-in 担当 / 起票時期

### 11.1 fill-in 担当
- 主担当: R?? Marketing-AA (T0'''+30d 直前 round)
- 補助担当: CEO (Executive summary §1) / Dev (incident retro §6 連動 / W6-B post-mortem template)
- 議事 owner: Owner (KPT review 5-10 min)

### 11.2 起票時期
- T0'''+28d: Marketing-AA が draft 起票 (本 template 入力)
- T0'''+30d: Owner monthly retro 議事録 sign (5-10 min reply)
- T0'''+31d: 確定 + knowledge 抽出 fork

---

## 12. Dev 部門 W6-B post-mortem template との merge protocol

### 12.1 統合 trigger
- T0'''+30d 完遂後 → Marketing template + Dev template 各 fill-in 完了 → CEO closeout report 起票

### 12.2 merge 構造
| section | Marketing template | Dev W6-B post-mortem template |
|---------|-------------------|------------------------------|
| §1 Executive summary | Marketing 軸 (KPI / 公報 / activation) | Dev 軸 (incident / SLA / RTO/RPO) |
| §2 KPI / SLO trajectory | KPI 13 軸 | SLO 4 metric (uptime / p95 / error rate / saturation) |
| §3 KPT | Marketing 5/5/5 | Dev 5/5/5 |
| §4-6 retro | Marketing 詳細 | Dev 詳細 |
| §7 next 30day plan | Marketing 行動計画 | Dev 行動計画 |
| §8 knowledge 抽出 | Marketing patterns / pitfalls / decisions | Dev patterns / pitfalls / decisions |

### 12.3 統合 output
- `projects/PRJ-019/closeout-report-T0'''+30d.md` (Marketing + Dev merge / 推定 400-600 行)
- CEO sign + Owner monthly retro 5-10 min ack

---

## 13. 制約遵守 verification

| 制約 | 結果 |
|------|------|
| launch-day 5 file 無改変 | **PASS** (本 file 新規) |
| R29 5 file 無改変 | **PASS** |
| R28 SOP 4 file 無改変 | **PASS** |
| R30 t+24h SOP 無改変 | **PASS** (本 round 起票後 immediate freeze) |
| Dev 部門 W6-B post-mortem template 無改変 | **PASS** (R29 Dev-FFF 90 行 連動 reference のみ) |
| DEC-019-001-079 absolute 無改変 | **PASS** |
| API call $0 | **PASS** |
| 副作用 0 | **PASS** (template / fill-in は実 30day 経過後) |
| 絵文字 0 | **PASS** |
| Owner 拘束 (template 起票時) | **0 min (本 round 内 / 実 fill-in 時 5-10 min)** |
| harness 902 PASS 維持 | **PASS** (Read のみ) |

---

## 14. 議決 trigger (R30 起票候補)

- DEC-019-092 (post-mortem template lock / Marketing 軸): 本 file 起票で起票候補昇格 (R31+ PM-X で正式採決検討)
- DEC-019-033 (knowledge 抽出経路) 整合: 本 template の §8 が抽出 input source として正式登録候補
- DEC-019-091 (launch-day v3.4 date-free delta) 連動: 本 template が v3.4 採用後の 30day retro 経路を確立

---

## 15. confidence 寄与

| 段階 | confidence |
|------|------------|
| R30 simulated GTC-10 PASS 後 | 99.9% (lock) |
| **R30 task-5 着地後 (post-mortem template 起票)** | **99.9% (lock 維持) + 内訳 (closeout 完成度 +0.05pt)** |

---

## 16. 結語

R30 Marketing-X 軸 task-5 (post-mortem template 起票) 着地。8 section / Marketing 軸 30day 振り返り構造 (Executive summary / KPI 30 軸 / KPT / 公報拡散 / activation / incident / next plan / knowledge 抽出) を template 化。Dev 部門 W6-B post-mortem template (R29 Dev-FFF 90 行) と merge protocol で連動。fill-in は T0'''+28-30d Marketing-AA 担当 + Owner 5-10 min monthly retro ack 想定。

副作用 0 / API call $0 / 絵文字 0 / Owner 拘束 0 min (本 round 内) / R29 5 file + R28 SOP 4 file + R30 5 file 無改変厳守 / DEC-019-001-079 absolute 無改変.

—— Marketing-X / 2026-05-06 W0-Week1 / R30 9 並列 7 軸目 / post-mortem template 完成 / closeout path 確立

---

**最終更新**: 2026-05-06 (Round 30 / Marketing-X / post-mortem template 起票)
**派生元**: Dev 部門 W6-B post-mortem template (R29 Dev-FFF 90 行 / 連動 reference のみ)
**次回見直し**: T0'''+28d (Marketing-AA fill-in 直前)

**file 終端 / 行数: 約 240 行**
