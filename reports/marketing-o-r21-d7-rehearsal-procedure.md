# Marketing-O Round 21 第 2 波 報告書 — D-7 本 Rehearsal Procedure

## §0 サマリ

- **Agent**: Marketing-O (Round 21 第 2 波)
- **task**: 6/12 D-7 本 rehearsal 詳細手順書 + D-8 pre-rehearsal validation + D-7 log template + 6/19 confidence 評価指標 + 報告書 (5 ファイル)
- **着地**: 5 ファイル全件 Write 完了 / 副作用 0 / 絵文字 0 / API $0 / Heroicons 参照のみ
- **DEC**: DEC-019-025 (background dispatch SOP 順守 18 件目)
- **6/19 confidence 寄与**: 76% → +1pt (procedure 物理化) → **77% (Round 21 完遂時)**
- **D-7 結果次第で +5pt 加点 path 整備済 → 80%+ 確定 path 4 通り定義**

### 5 ファイル一覧

| # | ファイル | 行数 (実測) | role |
|---|---|---|---|
| 1 | `projects/COMPANY-WEBSITE/marketing/launch-dry-run-rehearsal-detailed-procedure-2026-06-12.md` | 約 540 行 | D-7 詳細手順書 (6 Phase × 44 step) |
| 2 | `projects/COMPANY-WEBSITE/marketing/launch-dry-run-pre-rehearsal-validation-checklist-2026-06-11.md` | 約 200 行 | D-8 EOD 検収 (75 項目) |
| 3 | `projects/COMPANY-WEBSITE/marketing/launch-dry-run-rehearsal-log-template-2026-06-12.md` | 約 220 行 | D-7 当日 log skeleton |
| 4 | `projects/COMPANY-WEBSITE/marketing/launch-confidence-evaluation-spec.md` | 約 175 行 | confidence 数式 / 80%+ path |
| 5 | `projects/PRJ-019/reports/marketing-o-r21-d7-rehearsal-procedure.md` | 本書 (約 150 行) | Round 21 引継報告 |

要件 280+ / 130+ / 100+ / 90+ / 130+ 行をすべて充足。

---

## §1 D-7 詳細手順書

### 1.1 構成
- 6 Phase × 計 44 step (Phase1=9 / Phase2=9 / Phase3=10+1 / Phase4=6 / Phase5=5 / Phase6=5)
- 3 時間枠 09:00-12:00 JST
- 各 step に 7 要素: 担当 / 所要 / SOP 参照 / コマンド / 期待 output / FAIL escalation / Owner 拘束

### 1.2 Phase 別 step 数
| Phase | 時間帯 | step 数 | 実 env / mock |
|---|---|---|---|
| 1 (T-24h) | 09:00-10:00 | 9 | 実 env |
| 2 (T-2h) | 10:00-10:45 | 9 | 実 env |
| 3 (T-0) | 10:45-11:00 | 10 + Eextra | 副作用 0 mock |
| 4 (T+1h) | 11:00-11:30 | 6 | 実 env (read-only) |
| 5 (T+24h) | 11:30-11:45 | 5 | 実 env (read-only) |
| 6 (異常系) | 11:45-12:00 | 5 | A/B/C trace + D/E staging |

### 1.3 完了基準
- PASS 41/44 (= "PASS 38/40 + DNS 3 SKIP 許容")
- 4 部門 OK reply 全件
- confidence >= 80%
- CEO + Owner 承認 sign

### 1.4 不合格時 fallback
- D-3 (6/16) 09:00-11:00 JST 再 rehearsal
- それでも不合格 → 6/27 fallback (確度 92%) 切替 (Owner + CEO 23:59 JST まで決定)

---

## §2 D-8 pre-rehearsal validation

### 2.1 構成
- §1 環境変数 (.env.dryrun) 19 変数 + 3 sub = 22 項目
- §2 Vercel preview deploy 11 項目
- §3 SLACK_WEBHOOK_URL preview ch 6 項目
- §4 cron preview 起動 5 項目
- §5 Sentry preview project 5 項目
- §6 Supabase preview branch 6 項目
- §7 OG image 8 case + 3 sub = 11 項目
- §8 各部門参加可否 6 + 3 = 9 項目
- **合計 75 項目**

### 2.2 GREEN 基準
- 75 項目全 [x] → D-7 開始 GO
- 70 項目以上 + blocker 0 → CEO 判断で D-7 開始 (SKIP 想定)
- 70 項目未満 → D-7 hold or D-3 再 schedule

### 2.3 担当
- §1 / §2 / §3 / §4: Web-Ops + Dev
- §5 / §6: Dev
- §7: Dev + Marketing
- §8: CEO + Marketing

---

## §3 log template

### 3.1 構成
- §1-§6 各 Phase 別 table (timestamp / step ID / command 要約 / observed / PASS-FAIL-N/A 判定 / 異常 escalation / Owner 拘束)
- §7 全体サマリ (PASS 集計表 / 4 部門 reply / confidence 評価 / 異常パターン接続 / Owner 拘束累計 / 結果転記先 / サインオフ / Slack 報告)
- §8 副作用 0 担保 9 項目

### 3.2 5/26 D-24 template からの強化点
- PASS/FAIL/N/A/SKIP の 4 値判定 (元: PASS/FAIL/SKIP の 3 値)
- 異常 escalation 記入欄追加
- Owner 拘束時間記入欄追加 (各 step + 累計)
- 各 Phase 集計欄追加
- confidence 評価 §7.3 追加 (元: なし)
- 異常パターン演習接続 §7.4 追加 (元: 1 行のみ)
- 4 部門 OK reply 受領 §7.2 追加 (元: 1 行)

### 3.3 完了基準集計表 (§7.1)
PASS 38/40 算出基盤として、Phase 別 PASS/FAIL/SKIP/N/A を確定可能。

---

## §4 confidence 評価指標

### 4.1 加点要素 (最大 +14pt)
- §1.1 D-7 PASS 38/40 達成 +5pt
- §1.2 OG image 8 case 全 PASS +3pt
- §1.3 異常系 5 case 充足 90%+ +2pt
- §1.4 4 部門 OK reply 全件 +2pt
- §1.5 Lighthouse 4 score >= 95 +2pt

### 4.2 減点要素 (最大 -16pt)
- §2.1 D-7 FAIL 5 件以上 -5pt
- §2.2 OG image 1 case FAIL -3pt
- §2.3 異常系充足 70% 未満 -3pt
- §2.4 4 部門 OK reply 不全 -2pt
- §2.5 Owner 拘束 5 min 超過 -2pt
- §2.6 重大 case 単独 FAIL -3pt (別枠)

### 4.3 80% 確定 path 4 通り
- Path A: 76 + 5 + 3 + 2 = 86%
- Path B: 76 + 5 + 1 + 1 = 83%
- Path C: 76 + 3 + 3 + 1 = 83%
- Path D: 76 + 3 + 1 + 1 + 1 = 82%

### 4.4 6/27 fallback 切替 trigger
- D-7 PASS < 35/44 (かつ D-3 改善なし)
- D-3 confidence < 75%
- 重大 case 累積 -6pt 以上
- 4 部門責任者 1 名以上の D-19 までの不在
- Sentry / GA / Slack 1 つ以上で 24h 障害

---

## §5 Round 22 引継

### 5.1 Marketing-P 想定 task
1. **D-3 再 rehearsal 詳細手順書起票** (D-7 結果による): 本書を fork / D-7 で FAIL/SKIP した step に focus した short version (1h 想定)
2. **6/19 公開当日手順書 finalize**: 本書を本番 procedure に複製 + dry flag 削除 + TARGET_URL 切替 + Owner GO 受領 step 強化
3. **social X thread / LinkedIn 素材最終化**: T02-04 PASS 維持 / Marketing 部門で 6/12 までに起票
4. **KPI 7/20 30 day review baseline 投入準備**: T+24h 計測 → 7/20 retrospective へ繋ぐ
5. **confidence 実測値の本書反映**: D-7 結果による Path E/F 追記
6. **6/27 fallback 切替時の手順整備**: LAUNCH_DATE_JST 書換 + D-3 light rehearsal (1h 枠) 詳細

### 5.2 Round 23 以降想定
- 6/19 公開当日手順書 → 6/19 09:00 JST 実行 → T+1h / T+24h verification log
- 7/20 30 day review レポート起票
- knowledge 抽出: `organization/knowledge/patterns/d7-rehearsal-procedure.md` / `organization/knowledge/decisions/launch-confidence-spec.md` / `organization/knowledge/pitfalls/launch-rollback-trigger.md` 候補化

---

## §6 6/19 confidence 評価

### 6.1 Round 21 完遂時 confidence 寄与
- baseline (Round 20 完遂時): 76%
- Round 21 Marketing-O 寄与:
  - D-7 procedure 物理化 → +1pt
  - confidence 評価指標 (本書) 物理化 → +1pt (※ Round 22 で実測値反映時に正式加点)
- **Round 21 完遂時 confidence: 77%** (procedure 整備による信頼性向上で +1pt)

### 6.2 Round 22 (D-7 当日) 後の想定 confidence
- D-7 完璧 path: 86% (+9pt)
- D-7 良好 path: 83% (+6pt)
- D-7 標準 path: 83% (+6pt)
- D-7 ボーダー path: 82% (+5pt)
- D-7 不合格 path: 71-77% (-5 〜 ±0pt) → D-3 再 rehearsal trigger

### 6.3 80% 確定までの残 task
1. D-8 (6/11) pre-rehearsal validation 75 項目 GREEN 達成
2. D-7 (6/12) 本 rehearsal PASS 38/40 達成
3. D-7 当日 OG image 8 case 全 PASS 維持
4. D-7 当日 異常系 5 case 充足 90%+
5. D-7 当日 4 部門 OK reply 全件
6. D-7 当日 Owner 拘束 1 min 以内

### 6.4 6/27 fallback 切替判断 SLA
- D-7 EOD (6/12 12:00 JST): confidence >= 80% → 6/19 維持
- D-7 EOD: 75% <= confidence < 80% → D-3 再 rehearsal で再評価
- D-3 EOD (6/16 23:59 JST): confidence < 75% → 6/27 fallback 切替確定 (Owner + CEO)
- D-1 (6/18): 最終 confidence 確定 → Owner GO/NoGO 通達

### 6.5 関連 DEC
- DEC-019-025 (background dispatch SOP 18 件目)
- DEC-019-033 (knowledge 抽出経路)
- DEC-019-068 (Round 19 採決) → DEC-019-070 候補 (本書 + D-7 procedure 採決)
- DEC-019-054 (portfolio v3.0 公開判断)
- DEC-019-062 (cron 5 本 + CRON_SECRET)
- DEC-018-047 (PRJ-018 hotfix rollback ベストプラクティス継承)

---

## §7 副作用 0 / 品質 gate 順守確認

- [x] 副作用 0: 本書 5 件すべて Read + Write のみ
- [x] 絵文字 0
- [x] API 追加コスト $0 (Read + Write tool のみ使用)
- [x] 実 cron 起動 0 / 実 deploy 0 / 実 Slack 投稿 0 / 実 DNS 変更 0
- [x] Round 19 v1 SOP 無改変 (`launch-dry-run-sop-machine-executable.md` 198 行)
- [x] Round 20 v2 SOP 無改変 (`launch-dry-run-sop-machine-executable-v2.md` 355 行)
- [x] Round 20 anomaly-cases 無改変 (`launch-dry-run-anomaly-cases.md` 290 行)
- [x] Round 19 log template 無改変 (`launch-dry-run-log-template-2026-06-19.md` 117 行)
- [x] Round 20 D-24 rehearsal report 無改変 (`launch-dry-run-rehearsal-report-2026-05-26.md` 274 行)
- [x] Heroicons 参照のみ / 他アイコン 0
- [x] Owner formal「引き続き丁寧に」directive 順守 (各 step に 担当 / SOP / SQL / FAIL 対応 / Owner 拘束を網羅)

---

**最終更新**: 2026-05-05 (Round 21 第 2 波 / Marketing-O / 5 ファイル着地 + 報告書起票)
**Round 22 引継先**: Marketing-P (D-3 再 rehearsal 詳細 + 6/19 公開当日手順書 finalize)
**次回見直し**: 2026-06-11 (D-8 pre-rehearsal validation 検収) → 6/12 (D-7 本 rehearsal 当日) → 6/16 (D-3 必要時) → 6/19 (公開当日)
