# Marketing-N Round 20 第 2 波 報告書 — Launch Dry-Run Rehearsal (D-24 mock)

## 0. サマリ

- 案件: PRJ-019 Open Claw "Clawbridge"
- Round: 20 第 2 波 / Agent: Marketing-N (独立稼働)
- 実施日: 2026-05-26 (D-24 mock rehearsal)
- 公開予定: 2026-06-19 09:00 JST (確度 75% → **76%** に微増 / 詳細 §6)
- fallback: 2026-06-27 09:00 JST (確度 92%)
- 出力 4 ファイル + 行数:
  1. `launch-dry-run-rehearsal-report-2026-05-26.md` (約 257 行)
  2. `launch-dry-run-anomaly-cases.md` (約 230 行)
  3. `launch-dry-run-sop-machine-executable-v2.md` (約 250 行)
  4. 本書 `marketing-n-r20-launch-dry-run-rehearsal.md` (約 105 行)
- 副作用 0 / 絵文字 0 / API 追加コスト $0 / Heroicons 参照のみ
- DEC-019-025 (background dispatch SOP 順守) **17 件目** 達成

## 1. rehearsal 実施範囲

D-24 (5/26) 時点で SOP v1 (Round 19 Marketing-M / 198 行) の **5 段階 40 step** を全て mock 実行:

| 段階 | step 数 | 実行担当 |
|---|---|---|
| §SOP 1 T-24h (Section A) | 9 step | Marketing-N (mock 単独) |
| §SOP 2 T-2h (Section B) | 9 step | Marketing-N (mock 単独) |
| §SOP 3 T-0 (Section C) | 10 step | Marketing-N (mock 単独) |
| §SOP 4 T+1h (Section D) | 6 step | Marketing-N (mock 単独) |
| §SOP 5 T+24h (Section E) | 5 step | Marketing-N (mock 単独) |
| 異常系 case A-E | 5 case | Marketing-N (mock walk-through) |
| **合計** | **40 step + 5 case** | |

mock 実行ルール:
- console echo + dry-run flag + log template 記入のみ
- 実 cron 起動 0 / 実 Slack 投稿 0 / 実 deploy 0 / 実 DNS 変更 0
- 実 SQL/curl/dig/sha256 のシェル形は記述、実行は mock skip

## 2. PASS/FAIL count (D-24 mock 実行結果)

| 段階 | PASS | FAIL (D-24 想定内) | SKIP (env 未設定) | N/A (D-24) |
|---|---|---|---|---|
| §SOP 1 T-24h | 0 | 3 | 3 | 3 |
| §SOP 2 T-2h | 1 | 3 | 5 | 0 |
| §SOP 3 T-0 | 0 | 6 | 4 | 0 |
| §SOP 4 T+1h | 0 | 0 | 6 | 0 |
| §SOP 5 T+24h | 1 | 0 | 4 | 0 |
| **合計** | **2** | **12** | **22** | **3** |
| 異常系 case A-E 検証充足度 | A=90% / B=85% / C=80% / D=95% / E=60% (平均 82%) | | | |

D-24 期待結果との照合:
- D-24 では env / file / Slack 連携が未揃いのため SKIP / FAIL が大半 (想定通り)
- 重要なのは **D-7 (6/12) 本 rehearsal で全 PASS** (予想 38 件以上 / SKIP 2 件以内)
- D-24 mock の意義は SOP gap を **物理リスト化** したことにあり、達成

## 3. SOP 改善提案 6-10 件 (実 rehearsal で見えた gap)

10 件の gap を抽出 (詳細は `launch-dry-run-rehearsal-report-2026-05-26.md` §7):

| # | gap | 優先度 | v2 反映先 |
|---|---|---|---|
| 1 | Owner GO 遅延時 CEO 代行 GO escalation tree が SOP 未記載 | 高 | v2 §SOP 3 末尾 + §異常系 case E |
| 2 | `vercel login` 認証経路が SOP 未記載 | 高 | v2 §Pre-condition CARD E |
| 3 | smoke 8 endpoint が bash inline 列挙で保守性低 | 中 | v2 §SOP 2 / §SOP 4 (yml 抽出) |
| 4 | T+1h と T+24h で TARGET_URL 切替 flag 未明示 | 高 | v2 §Pre-condition + §SOP 4/5 |
| 5 | 4 部門 OK reply Slack post テンプレ未明示 | 中 | v2 §SOP 2 末尾 (T02-08 step 新設) |
| 6 | TP1-02 Sentry stats fixed window vs rolling 未明示 | 中 | v2 §SOP 4 TP1-02 |
| 7 | TP1-03 GA OAuth token refresh 未記載 | 中 | v2 §Pre-condition CARD F + §SOP 4 |
| 8 | T24P-01 GA timezone JST/UTC 未明示 | 中 | v2 §SOP 5 T24P-01 |
| 9 | T24P-02 event taxonomy 固定列挙なし | 中 | v2 §SOP 5 T24P-02 |
| 10 | T24P-03 psql 比較日付ハードコード (6/27 baseline) | 高 | v2 §Pre-condition CARD G + §SOP 5 T24P-03 |

10 件全て v2 SOP に反映済 (`launch-dry-run-sop-machine-executable-v2.md` 約 250 行 / v1 baseline 不変保持)。

新設 CARD (Pre-condition):
- CARD E (Web-Ops): `vercel login` + team 確認
- CARD F (Dev): GA OAuth token 取得 + refresh 手順
- CARD G (CEO): `$LAUNCH_DATE_JST` env export
- CARD H (Owner): backup contact 1 名 CEO 共有 (case E 再発防止)

## 4. 異常系 5 件 deep-dive 結果

`launch-dry-run-anomaly-cases.md` (約 230 行) で 5 phase (検知 → 判断 → 連絡 → 復旧 → 後始末) 分解:

| case | 推奨判断者 | 連絡 SLA | Owner 拘束 (公開当日) | 検証充足度 |
|---|---|---|---|---|
| A: rollback trigger | Web-Ops + CEO | 検知 → 3 min | 1 min (email) | 90% |
| B: cron fallback 切替 | Web-Ops 単独 | 検知 → 10 min | 0 min | 85% |
| C: Slack alert 不達 | Web-Ops + Marketing | 検知 → 15 min | 1 min (email reply) | 80% |
| D: smoke test FAIL | Web-Ops + CEO | 検知 → 6 min | NoGO 5 min / GO 0 min | 95% |
| E: Owner GO 遅延 15 min | CEO 代行 | T-0 → 15 min | 0 min (Owner 不在中) | 60% |

case E (Owner GO 遅延) の検証充足度 60% は **SOP v1 が escalation tree を持たない gap** に起因。v2 で正式採用提案 → D-7 本 rehearsal で staging 演習 → 6/19 採用判定。

## 5. Round 21 D-7 (6/12) 本 rehearsal 計画

### 5.1 期日 / 構成 (3 時間枠)

- 2026-06-12 (D-7) 09:00-12:00 JST
- Phase 1 (60 min): T-24h 9 step + Pre-condition CARD A-H 実 env 実行
- Phase 2 (45 min): T-2h 9 step 実 env 実行 (Lighthouse 4 score >= 90 実測)
- Phase 3 (15 min): T-0 10 step 副作用 0 mock 実行
- Phase 4 (30 min): T+1h 6 step 実 env 実行
- Phase 5 (15 min): T+24h 5 step 実 env 実行 (read-only)
- Phase 6 (15 min): 異常系 case D / E staging 演習 (A/B/C は SOP review のみ)

### 5.2 完了基準
- 全 step PASS (40 step 中 38 件以上 / SKIP 2 件以内)
- v2 SOP への追加 patch 件数 5 件以下
- 4 部門 + Owner OK reply 全件取得
- 6/19 公開 confidence 80% 以上 (現 76% から +4pt)

### 5.3 不合格時のリカバリ
- D-7 で SKIP > 5 件 or FAIL > 2 件: D-3 (6/16) 再 rehearsal
- D-3 でも不合格: 6/27 fallback (確度 92%) 切替判断 (Owner + CEO / D-3 23:59 JST まで)

### 5.4 Round 21 Marketing-O 引継 task
1. SOP v2 を D-7 で実 env 執行
2. 異常系 case A-C を staging 環境で実演 (副作用 0 維持)
3. social X thread / LinkedIn 素材 6/12 までに起票 (T02-04a/b FAIL 解消)
4. KPI 7/20 30 day review baseline 投入準備

## 6. 6/19 公開 confidence 評価

### Round 19 着地時点: 75%
### Round 20 D-24 mock rehearsal 後: **76% (+1pt)**

評価根拠:
- **+ 加点要素 (+5pt)**:
  - SOP v2 が 10 件 gap 全反映で完成 (+2pt)
  - 異常系 5 case が 5 phase 分解で escalation tree 明示 (+2pt)
  - .env.dryrun 雛形固定で D-7 本 rehearsal 実行可能性向上 (+1pt)
- **− 減点要素 (-4pt)**:
  - D-24 時点で env / file / Slack 連携の SKIP/FAIL が 34 件 / 40 step (-2pt)
  - case E Owner GO 遅延の検証充足度 60% (-1pt)
  - social 素材 / Review sign / template 物理化が D-7 までの未完課題 (-1pt)
- 純増 +1pt → 76%

### 6/19 公開 confidence 80% 達成への必要条件 (D-7 本 rehearsal で確証)
1. 8 CARD (A-H) 全 GREEN
2. PASS 38/40 / SKIP 2 件以内 / FAIL 0 件
3. case D / E staging 演習通過
4. CEO + Owner 承認 sign

達成ならば 6/19 公開実行 / 未達ならば D-3 再判断 → 必要に応じ 6/27 fallback (確度 92%) 切替。

### 誇張回避のための注記
本評価は **D-24 mock 実行で確証された範囲のみ** を反映。実 env / 実 Slack / 実 deploy 検証は D-7 本 rehearsal を待つ。confidence 80% 確定は D-7 PASS 38 件以上の確認後。

---

## 関連 DEC / 引継

- DEC-019-025: background dispatch SOP 順守 17 件目 達成
- DEC-019-033: knowledge 抽出経路 / 本書群 (4 ファイル) を `organization/knowledge/patterns/launch-dry-run-rehearsal.md` 候補化
- DEC-019-054: portfolio v3.0 公開判断 (本 rehearsal で v3.1 deploy hash check 経路確証)
- DEC-019-062: cron 5 本 + CRON_SECRET (CRON_PROD_PR env 化提案)
- DEC-018-047: PRJ-018 hotfix rollback ベストプラクティス継承 (Case A 適用)

DEC 採決候補 (CEO 提案):
- **DEC-019-069 候補**: SOP v2 採用 (D-7 本 rehearsal で確証後 採決)
- **DEC-019-070 候補**: Owner backup contact CARD H 制度化 (case E 再発防止)
- **DEC-019-071 候補**: smoke-endpoints.yml 駆動化 (保守性向上)

---

**最終更新**: 2026-05-26 (Round 20 第 2 波 / Marketing-N D-24 mock rehearsal)
**4 ファイル合計**: 約 842 行 / **40 step + 5 case** 検証 / SOP 改善提案 **10 件** / confidence **75% → 76%**
**次回更新**: 2026-06-12 (D-7 本 rehearsal Marketing-O 引継後) → 6/19 (公開当日)
