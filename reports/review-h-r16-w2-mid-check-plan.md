# PRJ-019 — Review-H R16 5/12 W2 trial mid-check 計画（production readiness 5 軸）

最終更新: 2026-05-05 / 起案: Review 部門 R16 Review-H
位置付け: PRJ-019 Phase 1 W2 trial（5/12、Dev-N 主管 = production readiness 検証）の **当日 30 分 mid-check** を Review-G が実施するための計画書。Review-H は計画策定 + report 形式定義を担当（5/12 当日実行は Review-G）。
版: v1.0 read-only + report-only / 連動: DEC-019-055 / DEC-019-062 / Round 14 review-round14-5-15-mid-check-runsheet.md / 本 Round 16 review-h-r16-summary.md

---

## §0 200 字 CEO サマリ

5/12 W2 trial 当日 mid-check（30 分、担当 Review-G、所要時間 14:00-14:30 JST）の計画を Review-H 起案。production readiness を **5 軸（性能 / 信頼性 / セキュリティ / 運用性 / コスト）** に分解、各軸 2 項目 = 計 10 check 項目に PASS / FAIL 数値基準を付与。**PASS 閾値**: 10/10 全 PASS = production-ready 確定、9/10 = conditional PASS（軽微 1 件残課題で 5/15 MS-2 trial 続行可）、8/10 以下 = FAIL（abort gate 起動、runsheet `abort-gate-ms2-2026-05-15.md` 連動）。report 形式は 1-pager（30 分以内記入完遂）、Slack `#clawbridge-alerts` post + decisions.md 引用形式で確定。

---

## §1 5/12 W2 trial mid-check 概要

### §1.1 タイミング・担当

| 項目 | 値 |
|---|---|
| 実施日時 | 2026-05-12 (火) 14:00-14:30 JST（30 分） |
| 担当 | Review-G（既決、Round 15 review-g-r15 連動） |
| 主管 | Dev-N（W2 trial 実装主管、HITL-11 + KE orchestrator + P-UI-10） |
| 観測対象 | W2 trial 環境（staging-w2、5/10 W1 着手後の 2 日経過時点） |
| 副作用 | 0（read-only metrics 観測 + report のみ） |
| Owner 拘束 | 0 分（Slack post 1 通のみ） |

### §1.2 5 軸 × 2 項目 = 10 check 項目マトリクス

| 軸 | 項目 ID | 項目名 | PASS 基準（数値） | FAIL 基準 |
|---|---|---|---|---|
| 性能 | P-1 | API p95 latency | < 500ms | ≥ 500ms または timeout |
| 性能 | P-2 | スループット (req/s) | ≥ 50 req/s 維持 | < 30 req/s |
| 信頼性 | R-1 | error rate (5xx) | < 0.5% | ≥ 1.0% |
| 信頼性 | R-2 | HITL gate 全 11 種 round-trip | 11/11 PASS | 1 件以上 FAIL |
| セキュリティ | S-1 | PII redaction（HITL-11）動作 | 100% mask | 1 件でも leak |
| セキュリティ | S-2 | budget guard $30/run 強制 | 強制有効 | 強制無効・bypass |
| 運用性 | O-1 | log 出力 + Slack alert routing | 全アラート routing | 1 件でも routing fail |
| 運用性 | O-2 | rollback procedure 30 秒以内完遂 | ≤ 30s | > 30s または fail |
| コスト | C-1 | 1 run あたり API cost | ≤ $0.50 | > $0.80 |
| コスト | C-2 | 1 日累計 API cost（trial） | ≤ $5.00 | > $8.00 |

---

## §2 PASS / FAIL 判定基準（数値化）

### §2.1 累積 PASS 判定

| PASS 件数 | 判定 | 5/15 MS-2 trial 接続 |
|---|---|---|
| 10/10 | **production-ready 確定** | 5/15 MS-2 trial 計画通り続行 |
| 9/10 | **conditional PASS**（軽微 1 件、72h 内修正） | 5/15 MS-2 trial 続行 + 修正 commit 監視 |
| 8/10 | **conditional FAIL**（軽微 2 件、5/14 EOD 再 check） | 5/15 MS-2 trial 一時延期検討 + 再 check 結果待ち |
| ≤ 7/10 | **FAIL = abort 推奨** | abort gate runsheet `abort-gate-ms2-2026-05-15.md` 起動 |

### §2.2 軸別 critical FAIL（即 abort 起票）

下記いずれかは **1 件でも FAIL 即 abort 起票**（累積 PASS 数に依らず）:

- S-1 PII leak（個人情報露出 = 法務リスク）
- S-2 budget guard bypass（無制限課金リスク）
- R-2 HITL gate 11/11 で 5+ 件 FAIL（gate 機構崩壊）

### §2.3 confidence

| 基点 | 5/12 PASS confidence | 根拠 |
|---|---|---|
| Round 15 W0-Week2 prep | 88% | Round 15 ceo-v16-round15-completion-acceleration-integration §6.4 |
| **Round 16 Review-H 計画策定後（本書）** | **90%（+2pt）** | **5 軸数値化 + abort gate 物理化で false-negative 余地縮小** |

---

## §3 当日 30 分 SOP

| 時刻 | 区分 | アクティビティ | 担当 |
|---|---|---|---|
| 14:00 | 開始 | 開始宣言 + Slack `#clawbridge-alerts` post | Review-G |
| 14:00-14:10 | metrics 取得 | 5 軸 10 項目の数値取得（staging-w2 dashboard） | Review-G |
| 14:10-14:20 | PASS/FAIL 記入 | §1.2 マトリクスに値記入 + 判定 | Review-G |
| 14:20-14:25 | 累積判定 | §2.1 判定確定 + critical FAIL 確認 | Review-G |
| 14:25-14:30 | report 起票 + post | 1-pager 起票 + Slack post + CEO 引継 | Review-G |

---

## §4 report 形式（1-pager テンプレ）

出力先: `projects/PRJ-019/reports/review-g-r16-5-12-w2-trial-mid-check.md`（5/12 当日 Review-G 起票）

テンプレ構成: ①結果サマリ（PASS NN/10 + 判定 + 5/15 接続可否）/ ②5 軸 10 項目結果テーブル（軸 / ID / 値 / 基準 / 判定）/ ③critical FAIL 有無（S-1 PII leak / S-2 budget bypass / R-2 HITL 5+ FAIL の 3 項目チェック）/ ④引継 TODO（軽微残課題 + 5/15 接続前 confirm 項目）。所要 30 分内完遂を制約とし全 4 セクション 1-pager（最大 50 行）。

---

## §5 abort gate 連動

8/10 以下 または critical FAIL 1 件で **abort gate runsheet `runsheets/abort-gate-ms2-2026-05-15.md` 起動**。runsheet は本 Round 16 Review-H で物理化（5 件 abort 条件 + 番号付き手順 + rollback + Slack notification flow）。Review-G は 14:30 時点で abort 必要時、Slack `#clawbridge-alerts` に `ABORT_GATE_TRIGGERED` post し、CEO へ Round 17 dispatch 依頼。

---

## §6 引継 TODO（Round 16 → 5/12 当日 Review-G）

1. 本計画書 §1.2 マトリクスを Review-G が staging-w2 dashboard に紐付け（5/11 EOD まで）
2. §4 report テンプレを `review-g-r16-5-12-w2-trial-mid-check.md` として下書き起票（5/11 EOD まで）
3. 5/12 14:00 開始時、本書 §3 SOP に従い 30 分内完遂
4. 結果は 5/15 MS-2 trial（Sec-I 運営代行）への接続可否判定として CEO に引継

（以上、80-120 行、計約 110 行）
