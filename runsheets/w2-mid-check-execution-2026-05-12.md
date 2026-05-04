# PRJ-019 — 5/12 W2 trial mid-check 実施 runsheet（Review-G operator 即時実行用）

最終更新: 2026-05-05 / 起案: Review 部門 R17 Review-I
位置付け: 5/12 (火) 14:00-14:30 JST に Review-G が実施する W2 trial mid-check を、`review-h-r16-w2-mid-check-plan.md`（計画）から **operator 即時実行可能な運用ガイド** に落とし込む runsheet。Review-H が定義した 5 軸 10 項目マトリクスに対し、check 手順 + ログテンプレ + critical FAIL 時 escalation flow を物理化。
版: v1.0 read-only / 連動: review-h-r16-w2-mid-check-plan.md / abort-gate-ms2-2026-05-15.md

---

## §0 起動条件・前提

| 項目 | 値 |
|---|---|
| 起動 | 2026-05-12 (火) 14:00 JST 自動起動（Review-G） |
| 前提 1 | 5/10 (土) Phase 1 W1 着手済（DEC-019-064 SOP 連動） |
| 前提 2 | 5/11 EOD まで Review-G が staging-w2 dashboard に 10 項目紐付け済 |
| 前提 3 | report テンプレ `review-g-r16-5-12-w2-trial-mid-check.md` 下書き済 |
| 副作用 | 0（read-only metrics 観測のみ） |
| Owner 拘束 | 0 分（Slack post 1 通のみ、abort 時のみ DM 100 字） |

---

## §1 10 check 項目 PASS/FAIL 判定基準（運用ガイド版）

| ID | 軸 | check 内容 | dashboard 参照先 | PASS 基準 | FAIL 基準 | 取得手段 |
|---|---|---|---|---|---|---|
| P-1 | 性能 | API p95 latency | staging-w2 APM `/api/*` 5m window | < 500ms | ≥ 500ms or timeout | dashboard read-only |
| P-2 | 性能 | スループット req/s | staging-w2 metrics 5m avg | ≥ 50 req/s | < 30 req/s | dashboard read-only |
| R-1 | 信頼性 | 5xx error rate | error log 5m window | < 0.5% | ≥ 1.0% | log query read-only |
| R-2 | 信頼性 | HITL gate 11 種 round-trip | gate trace 24h aggregate | 11/11 PASS | 1+ 件 FAIL | trace log read-only |
| S-1 | セキュリティ | PII redaction（HITL-11） | redaction audit log 24h | 100% mask | 1 件以上 leak | audit log read-only |
| S-2 | セキュリティ | budget guard $30/run 強制 | budget guard config + 24h log | 強制有効 | 強制無効 / bypass | config inspect |
| O-1 | 運用性 | log + Slack alert routing | `#clawbridge-alerts` 24h | 全 routing OK | 1+ 件 routing fail | Slack history |
| O-2 | 運用性 | rollback procedure 30 秒 | dry-run 1 回（5/11 事前実施） | ≤ 30s | > 30s or fail | dry-run 計測値 |
| C-1 | コスト | 1 run あたり API cost | cost dashboard 24h avg | ≤ $0.50 | > $0.80 | dashboard read-only |
| C-2 | コスト | 1 日累計 API cost（trial） | cost dashboard 24h sum | ≤ $5.00 | > $8.00 | dashboard read-only |

**累積判定**（review-h-r16-w2-mid-check-plan §2.1 準拠）:
- 10/10 = production-ready 確定 → 5/15 MS-2 trial 計画通り続行
- 9/10 = conditional PASS → 5/15 続行 + 軽微 1 件 72h 内修正監視
- 8/10 = conditional FAIL → 5/15 一時延期検討 + 5/14 EOD 再 check
- ≤ 7/10 = FAIL → abort gate runsheet `abort-gate-ms2-2026-05-15.md` 起動

---

## §2 ログテンプレート（mid-check 当日記録用）

下記を 5/12 14:00-14:30 中に Review-G が逐次記入し、14:30 時点で 1-pager 完遂。出力先 `reports/review-g-r16-5-12-w2-trial-mid-check.md`。

```
# W2 trial mid-check 実施ログ — 2026-05-12
## 実施情報: 開始 14:00 / 終了 __:__ JST / 担当 Review-G / 主管 Dev-N / staging-w2 / 副作用 0 / Owner 拘束 0
## 10 項目結果（ID / 取得値 / 基準 / 判定）
| ID | 取得値 | 基準 | 判定 |
|---|---|---|---|
| P-1 | __ms | <500ms | PASS/FAIL | / | P-2 | __req/s | ≥50 | PASS/FAIL |
| R-1 | __% | <0.5% | PASS/FAIL | / | R-2 | __/11 | 11/11 | PASS/FAIL |
| S-1 | __% mask | 100% | PASS/FAIL | / | S-2 | enforced=__ | 有効 | PASS/FAIL |
| O-1 | __fail | 0 | PASS/FAIL | / | O-2 | __s | ≤30s | PASS/FAIL |
| C-1 | $__ | ≤$0.50 | PASS/FAIL | / | C-2 | $__ | ≤$5.00 | PASS/FAIL |
## 累積判定: PASS __/10 → production-ready / conditional PASS / conditional FAIL / FAIL
## critical FAIL チェック: [ ] S-1 PII leak / [ ] S-2 budget bypass / [ ] R-2 HITL 5+ FAIL
## 5/15 MS-2 trial 接続: 続行 / 一時延期 / abort gate 起動
## 引継 TODO: 1. ... 2. ...
```

---

## §3 critical FAIL 時 Owner DM 即時連絡 SOP

### §3.1 trigger 条件

下記いずれか 1 件 → 14:30 までに Owner DM 即時送信:
- S-1 PII leak（個人情報露出 = 法務リスク）
- S-2 budget guard bypass（無制限課金リスク）
- R-2 HITL gate 11/11 で 5+ 件 FAIL（gate 機構崩壊）
- 累積 ≤ 7/10 PASS（abort gate 起動）

### §3.2 escalation 手順（5 ステップ、合計 ≤ 5 分）

| 手順 | 所要 | アクション | 出力先 |
|---|---|---|---|
| 1 | 30s | Slack `#clawbridge-alerts` post（`MID_CHECK_CRITICAL_FAIL reason=<ID>`） | Slack |
| 2 | 60s | Owner DM 100 字（trigger ID + 14:30 時点状況 + abort 起動有無） | Owner Slack DM |
| 3 | 60s | abort gate runsheet 起動判定（critical 1+ 件 or ≤7/10 で必須） | Sec-I 連絡 |
| 4 | 60s | CEO 引継（dispatch 依頼: Round 17 緊急 abort 体制） | CEO Slack |
| 5 | 30s | report 1-pager に「critical FAIL escalation 完遂」追記 | review-g-r16-5-12-w2-trial-mid-check.md |

### §3.3 Owner DM テンプレ（100 字以内）

```
[PRJ-019 W2 mid-check critical FAIL] trigger=<ID> 累積<NN>/10 abort=<起動/未起動> 詳細 review-g-r16-5-12-w2-trial-mid-check.md。判断 escalation は CEO 一任、Owner 拘束 0 維持。
```

### §3.4 conditional PASS / 通常 PASS 時の post（critical 不該当）

- 通常: `#clawbridge-alerts` 1 通（`MID_CHECK_COMPLETED 10/10 production-ready`）/ Owner DM 不要
- conditional: `#clawbridge-alerts` 1 通 + 軽微残課題明示 / Owner DM 不要

---

## §4 引継・備考

本 runsheet は `review-h-r16-w2-mid-check-plan.md` の「計画」を Review-G の operator 視点で物理化。5/12 14:00-14:30 の 30 分内完遂を制約として、§1 判定基準 + §2 ログテンプレ + §3 escalation SOP の 3 点を 1-pager 化。critical FAIL 時の abort gate 連動は `abort-gate-ms2-2026-05-15.md` §0 起動条件 1〜2 と直結。Round 17 完遂時に本書実施実績を Review-I が 5/19 + 5/26 review 補強材料に流用。

（以上、80-120 行、計約 110 行）
