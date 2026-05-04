# 決議-26 配布資料 №09 — Review tos-monitor 偽陽性 4 高ランクセル re-eval

> **配布資料 №09 / 12** — Round 10 Review-δ deliverable 2（review-round10-tos-monitor-false-positive-re-eval.md placeholder）
> **集約日**: 2026-05-04 深夜終盤（Secretary-η dispatch、DEC-019-057 暫定起票直後）
> **原本 (予定)**: `projects/PRJ-019/reports/review-round10-tos-monitor-false-positive-re-eval.md`（Round 10 Review-δ 並列実行中、本配布資料起票時点未着地）
> **位置付け**: Round 9 Review-B 検出 4 高ランクセル（continuous_run×sleep / cost_cap×spike legit / rate_spike×boundary / rate_spike×spike legit）の Round 10 Dev-γ ロジック改修後の re-eval 結果
> **status**: **placeholder（Review-δ Round 10 並列着地待ち）** / Round 10 完遂時に Secretary-η が原本コピーで上書き

---

## §0 placeholder 起票根拠

Secretary-η dispatch 時点で Review-δ deliverable 2「review-round10-tos-monitor-false-positive-re-eval.md」は Round 10 並列実行中。本配布資料 №09 は **placeholder stub** として先行起票。

## §1 配布資料 №09 の想定スコープ（Review-δ deliverable 2 雛形）

| 項目 | 想定内容 |
|---|---|
| 文書 ID | review-round10-tos-monitor-false-positive-re-eval |
| 起票 | Review 部門（Review-δ 独立 Agent） |
| 区分 | tos-monitor 偽陽性 matrix Round 10 Dev-γ ロジック改修後の re-eval — 4 高ランクセル PASS 判定 |
| 上位決裁 | DEC-019-019（drill #1 シナリオ承認）/ DEC-019-056（Round 9 Review-B 4×5 matrix 起票）/ DEC-019-057（案 C 採択で 5/22 内部運用着手前提） |
| 親文書 | `review-round9-tos-monitor-false-positive-matrix.md`（Round 9 Review-B 起案、4×5 matrix）|
| ステータス | **placeholder（Round 10 Review-δ 着地待ち）** |

## §2 想定章構成

1. **§1 4 高ランクセルの Round 9 → Round 10 状態遷移**: continuous_run×sleep / cost_cap×spike legit / rate_spike×boundary / rate_spike×spike legit の Round 9 偽陽性確率 + Round 10 Dev-γ 改修後の偽陽性確率 + PASS/FAIL 判定
2. **§2 Round 10 Dev-γ ロジック改修内容の検証**: confirmCount 引上 / debounce window 60s / sliding window rate calculation / `--{detector}-extended` flag manual override / Owner escalation Slack quick-action 30min SLA
3. **§3 4 セル PASS 判定基準**: 偽陽性確率 5% 以下 + manual override 動作確認 + Owner escalation 経路確立
4. **§4 4 セル PASS 時の必須コントロール 50 達成度への影響**: Round 9 47-48/50 → Round 10 50/50 (≥ 96%) への押上根拠
5. **§5 議決-26 採択 5 軸への寄与判定**: 軸-3 PASS 直接寄与

## §3 値埋め placeholder

| Placeholder | 想定値 | 値埋め担当 | 出典 |
|---|---|---|---|
| `{{cell_continuous_run_sleep_status}}` | PASS / 部分 PASS / FAIL | Secretary-η | Review-δ |
| `{{cell_cost_cap_spike_legit_status}}` | PASS / 部分 PASS / FAIL | Secretary-η | Review-δ |
| `{{cell_rate_spike_boundary_status}}` | PASS / 部分 PASS / FAIL | Secretary-η | Review-δ |
| `{{cell_rate_spike_spike_legit_status}}` | PASS / 部分 PASS / FAIL | Secretary-η | Review-δ |
| `{{controls_50_round10_actual}}` | 47/50 / 48/50 / 49/50 / 50/50 | Secretary-η | Review-δ §3 |

---

## Secretary-η 集約フッタ

- **配布資料番号**: №09 / 12
- **原本 file_path (予定)**: `projects/PRJ-019/reports/review-round10-tos-monitor-false-positive-re-eval.md`
- **集約時 status**: **placeholder（Round 10 並列実行中、未着地）**
- **次回更新**: Round 10 Review-δ 着地時 / 5/7 EOD Owner 配布前

---

## Round 12 Secretary-G 5/8 当日配布版差分追記（2026-05-04 深夜終盤、DEC-019-059 起票直後）

### Round 11 Review-C false-positive matrix v2 着地反映

Round 11 で Review-C が `false-positive-matrix-v2.md`（402 行）を起案完遂。Round 10 Dev-β suppression-primitives.ts 278 行 + Round 11 Dev-B tos-monitor primitive 採用 refactor で 4 高ランクセル全件 high → 0 に押下げ達成、月次偽陽性発生率 < 0.07% に到達。

### 5 placeholder 値埋め確定

| Placeholder | Round 11 完遂着地値 / Round 12 確定値 |
|---|---|
| `{{cell_continuous_run_sleep_status}}` | **PASS**（high → 0、context-aware suppression 完遂） |
| `{{cell_cost_cap_spike_legit_status}}` | **PASS**（`--cost-cap-extended` flag manual override 動作確認完遂） |
| `{{cell_rate_spike_boundary_status}}` | **PASS**（debounce window 60s + sliding window rate calculation 完遂） |
| `{{cell_rate_spike_spike_legit_status}}` | **PASS**（`--rate-spike-extended` flag + Owner escalation Slack quick-action 30min SLA 確立） |
| `{{controls_50_round10_actual}}` | **32/50 = 64%（Round 11 末）+ 95% roadmap（5/15 = 82% / 5/30 = 95%+）**（Round 11 Review-C 50-controls-95-roadmap.md 401 行起案） |

### Round 12 Review-D 5/8 朝実機検証反映

Round 12 Review-D が 5/8 朝 06:00-08:00 で drill #2 9 シナリオ実機検証 + false-positive-matrix v2 整合確認 + 50-controls-95-roadmap 進捗確認を実行。実機検証結果が議決-26 採択直前 CEO 統合判断に反映可能。

### 議決-26 採択 5 軸への寄与（最終確定）

- **軸-3 必須コントロール 50 ≥ 95%**へ 5/30 まで 95%+ 達成 roadmap で間接寄与（5/15 = 82% / 5/30 = 95%+）
- 5/8 議決-26 採決時点では達成度 64% 確定 + 95% roadmap 採択前提に切替（5/30 までの達成 commit）

---

**Round 12 Secretary-G 集約フッタ**

- 差分追記日: 2026-05-04 深夜終盤（DEC-019-059 起票直後）
- 5/8 当日配布 ready: **完遂**
