最終更新: 2026-05-04 / 起案: Review 部門 / 対象期間: 2026-05-09 〜 2026-05-22 (W0-Week2)

# PRJ-019 — W0-Week2 中間 Checkpoint 3 回 + Risk Monitor 設計書

## 位置付け

2026-05-04 Owner 「CEO 推奨案で進めて下さい」明示承認 (DEC-019-051 議決-24 仮採択方針) を受け、Review 部門が起案した `review-mock-claude-70pct-acceptance-criteria.md` (481 行 / AC 37 件 / 5/22 検収用) の **5/22 当日検収失敗リスクを最小化する** ための W0-Week2 14 日間 (5/9 着手 → 5/22 検収) 中間監視枠組み設計書。Dev 部門 5 必須施策 (T1-T6 = 42 SP / 22 人日) の burndown を中間 3 checkpoint (5/13 / 5/16 / 5/19) で 5 日間隔監視し、各 checkpoint の Pass/Fail 判定 + Fail 時の即時 mitigation アクションを定義。並走して Risk Register v3.1 21 件のうち W0-Week2 動向監視必須 5 件 (R-019-15 / 19 / 20 / 21 / 22) の daily monitor 項目 + 閾値 + アラート発火条件を整理。本書は CEO §8.1 即時発令タスク #5 (mock 70% AC) の delivery プロセス保証文書であり、5/22 検収結果文書 (`review-mock-claude-70pct-acceptance-result.md`、5/22 EOD 起案予定) と対をなす。

連動 DEC: DEC-019-051 (subscription 主軸 Phase 1 採用) / DEC-019-050 ($30 cap) / DEC-019-020 (mock-claude) / DEC-019-042 (5/22 期限) / DEC-019-033 (Owner-in-the-loop 5 点) / DEC-019-015 (R-019-15 赤格付け公式化候補)
連動レポート: `review-mock-claude-70pct-acceptance-criteria.md` (481 行 / AC 37 件) / `review-30usd-cap-impact-assessment.md` §1.4 §8.2 / `dev-w0-week2-mandatory-5-tasks-wbs.md` (T1-T6 / 42 SP) / `review-ban-drill-3-scenario.md` (5 シナリオ) / `review-risk-register-v3.md` (v3.1 21 件) / `review-pre-phase1-readiness-assessment.md`
連動 ODR: OG-04 (drill #3 承認) / OG-05 (R-019-15 赤格付け)

---

## 目次

| § | 題目 |
|---|------|
| §1 | 設計の前提と全体像 (W0-Week2 14 日間 burndown) |
| §2 | Checkpoint 1 (5/13 火、着手 +5 日 / 中盤) |
| §3 | Checkpoint 2 (5/16 金、着手 +8 日 / 後半開始) |
| §4 | Checkpoint 3 (5/19 月、着手 +11 日 / 終盤 3 日前) |
| §5 | 5/22 当日検収プロセス (4 段階タイムライン) |
| §6 | Risk Monitor (W0-Week2 全期間、5 リスク daily 監視) |
| §7 | Owner 通知レベル (LOW / MEDIUM / HIGH) |
| §8 | 4 段階 Fallback (mock-70% AC §11/§12 連動) |
| §9 | 結論 + Review 部門 5/22 検収体制宣言 |

---

## §1 設計の前提と全体像 (W0-Week2 14 日間 burndown)

### §1.1 W0-Week2 14 日間 タイムライン

| 日付 | 曜日 | 主要イベント | Burndown 想定 (Dev WBS §8.2) | Review 部門アクション |
|------|------|-------------|------------------------------|----------------------|
| 5/9 | 金 | Dev T2 完遂 (HITL テンプレ化) | 5 SP / 88% remain | T2 受領レビュー + checkpoint 1 準備 |
| 5/10-12 | 土〜月 | Dev T1/T5 着手 (mock + TimeSource) | 着手フェーズ | review-ban-drill-3-scenario.md §3.1 mock 義務化追記 (議決-22 連動、5/12) |
| **5/13** | **火** | drill #1 立会 + **Checkpoint 1** | 5 SP (進行のみ) | **CP1 判定 (T2 完了 + T1 25% 検証)** |
| 5/14-15 | 水〜木 | Dev T1/T5 中盤、T3 着手準備 | 進捗加速 | T1 中間レビュー (E ベクトル 12-15 種品質チェック) |
| **5/16** | **金** | T1 中間 50% (E ベクトル 25 種) + T5 50% | 17 SP / 60% remain | **CP2 判定 (T1 50% + T5 25%)** |
| 5/17-18 | 土〜日 | Dev 進捗 (週末作業任意) | — | (待機) |
| **5/19** | **月** | T3 完遂 + T5 100% | 26 SP / 38% remain | **CP3 判定 (T1 80% + T5 50% + T6 60%)** |
| 5/20-21 | 火〜水 | Review 部門 acceptance 検証 dry-run (drill #3 実走 + mock 比率実測) | T1/T5/T6 仕上げ | drill #3 リハ dry-run 立会 + AC 37 件 pre-check |
| **5/22** | **木** | **Dev → Review 引渡し + AC 37 件検収 + 結果通知** | 42 SP / 7% (T4 のみ残) | **5/22 検収プロセス (§5 参照)** |

### §1.2 Checkpoint 設計の根拠

`review-mock-claude-70pct-acceptance-criteria.md` §11.1 の 4 段階 fallback (軽微 / 中規模 / 重大 / 致命的) のうち、**5/22 当日に Fail 判定が出た場合の修正リードタイムは最短で 5/23-24 (土日 2 日)** しかなく、Critical 級の問題 (例: シナリオ B 1 操作通過) では **5/29 公式 drill 1〜2 週間延期 + Phase 1 着手 1〜2 週間延期** に直結する。これを未然防止するため、5/22 の 9 日前 / 6 日前 / 3 日前の 3 段階で Dev 進捗を強制可視化し、Fail 兆候を **5/22 より 3〜9 日早く検知 + mitigation** する設計とした。

### §1.3 各 Checkpoint の運用ルール (共通)

- 実施時刻: 各日 14:00-15:00 JST (1h)、Slack `#prj019-monitor` で Dev → Review に進捗報告 + Q&A
- 立会: Review 主担当 1 名 + Dev-A + Dev-B (CEO は report で受領、Owner には HIGH 時のみ通知)
- 成果物: 簡易 checkpoint レポート (本書 §2-§4 各 Pass/Fail 判定 + 根拠記録、`projects/PRJ-019/reports/review-w0-week2-checkpoint-N.md` で日次起案)
- Fail 時: 翌日 EOD までに Dev → Review に mitigation 計画提出 (24h SLA)、Review が承認後 Slack で CEO + Owner (HIGH 時のみ Owner) に通知

---

## §2 Checkpoint 1 (5/13 火、着手 +5 日 / 中盤)

### §2.1 検証対象タスク

| Task | 担当 | 5/13 時点期待状態 |
|------|------|-------------------|
| **T2** (HITL テンプレ化、5/9 期限) | Dev-B | **完遂** (HITL 11 種 template 動作 + Slack 通知発火 5/5 success) |
| **T1** (mock-claude 70% 化、5/22 期限) | Dev-A 主 + Dev-B レビュー | 進行中、E ベクトル canned response 50 種のうち **12-15 種完成** (24-30%) |
| **T5** (TimeSource decoupling、5/22 期限) | Dev-A + Dev-B 協働 | (5/13 は drill #1 立会優先で Dev 作業除外、進捗ゼロ許容) |

### §2.2 検証項目 (詳細)

| ID | 検証項目 | 検証方法 | Pass 条件 |
|----|----------|----------|-----------|
| CP1-A | T2 完了確認 | `app/harness/src/notifications/templates/hitl-{9,10,11}.ts` 3 ファイル存在 + Vitest +5 ケース全緑 | 100% Pass |
| CP1-B | T2 通知発火 success rate | Slack `#prj019-monitor` test channel に 11 種テンプレ × 5 回 = 55 回 dispatch 実行、success ≥ 53 (96%) | success ≥ 96% |
| CP1-C | T2 PII redaction | HITL-11 knowledge_pii_review template render で PII (Owner email / 客先名) を含む input 20 ケース全 redacted | 100% redacted |
| CP1-D | T1 進捗率 | E ベクトル canned response file (`canned-responses-e-vector.ts`) 内 export 件数 ≥ 12 (24%) | ≥ 12 種 |
| CP1-E | T1 品質サンプル check | Dev-B が完成 12 種のうち 5 種ランダム抽出、injection pattern signature と expected reply の対応性 review | 5/5 Acceptable |
| CP1-F | 既存 budget-guard test 13 ケース regression | `npm test -- budget-guard` 全緑維持 | 100% Pass |
| CP1-G | API 消費 cumulative (5/9 着手以降) | Anthropic Console screenshot + `cost-watcher.ts` log 双方で確認 | ≤ $2.00 |

### §2.3 Pass 条件 (CP1 集約)

- **Pass**: CP1-A 〜 CP1-G の **7 項目全 Pass** + Dev-A から「T1 5/16 中間 50% 達成見込」明言
- **Conditional Pass**: 1 項目 Minor 未達 (例: CP1-D が 10 種で 24% 未達も 20% 達成) → 5/14 EOD までに +2 種追加で recovery 可能
- **Fail**: 2 項目以上未達、または T2 未完 (HITL 通知発火 success < 90%) → §2.4 mitigation 即発動

### §2.4 Fail 時の対応 (詳細 mitigation)

| Fail パターン | 即時アクション | 期限 | 追加 escalation |
|---------------|---------------|------|----------------|
| **T2 未完 (HITL 通知発火 < 90%)** | Dev-B が 5/14 中に template render bug 修正、5/14 EOD 再 dispatch test 100% pass 確認 | 5/14 EOD | CEO に MEDIUM 通知 |
| **T2 PII redaction 漏れ** | redaction filter を template module の上流に強制挿入、HITL-11 review template を rerun | 5/14 EOD | Owner に HIGH 通知 (HITL-11 review fail = PII 漏洩リスク) |
| **T1 進捗 < 20%** | Dev-A の T1 工数を増やすため、Dev-B から **T3 (E2E staging) を Dev-A に再配分しない** 代わりに **T1 を Dev-A 100% 専任 / Dev-B が T3 + T5 兼務** へタスク再割当 | 5/14 09:00 朝会 | CEO に MEDIUM 通知 |
| **T1 品質 5/5 中 2 件以上 NG** | Review が Dev-B に NG 2 件の改修指示書 (具体 pattern + variant 例) を 5/14 09:00 までに送付、Dev-A は他 25 種着手前に 2 件 rework | 5/15 EOD | (内部対応のみ) |
| **API 消費 > $3** | Hard $30 cap までの buffer は十分だが、想定 burn rate ($0.40/日) 超過 → Anthropic Console + cost-watcher 突合で漏洩検知 | 5/14 中 | Owner に LOW 通知 (情報共有) |
| **既存 budget-guard regression** | regression 内容に応じて **DEC-019-050 の二重防御自体が不安定** = 5/22 検収全停止リスク → 即 Critical 扱い | 即時 | Owner + CEO に **HIGH 通知 + 5/22 検収計画再考** |

### §2.5 想定 5/13 報告書テンプレ (Slack `#prj019-monitor` 投稿)

```
[CP1 結果 / 5/13 14:00 JST]
- T2 完了: ✓ (Vitest +5 緑 / Slack 通知 55/55 success)
- T1 進捗: 14/50 種 (28%) ✓
- T5: 進捗ゼロ (drill #1 立会優先、設計通り)
- API 消費: $1.80 ($30 cap の 6%) ✓
- 既存 regression: なし ✓
- 判定: Pass / Conditional Pass / Fail
- 次回 CP2 まで: T1 25 種 (5/16) + T5 50% 着手
```

---

## §3 Checkpoint 2 (5/16 金、着手 +8 日 / 後半開始)

### §3.1 検証対象タスク

| Task | 5/16 時点期待状態 |
|------|-------------------|
| T1 (mock 70% 化) | **50% 進捗** (E ベクトル 25/50 種完成 + A/B/C/D mock skeleton 1-2 個着手) |
| T5 (TimeSource decoupling) | **25% 進捗** (LLMSource interface + MockLLMSource 実装、A/B/C/D 4 mock のうち 2 つに DI 適用済) |
| T6 (Console 同期 SOP) | 着手 (要件整理 + SOP outline ドラフト 30%) |
| 全体 burndown | 17 SP / 25 SP remain (60% remain、計画整合) |

### §3.2 検証項目

| ID | 検証項目 | 検証方法 | Pass 条件 |
|----|----------|----------|-----------|
| CP2-A | E ベクトル canned response 数 | export 件数 count | ≥ 25 種 (50% 進捗) |
| CP2-B | E ベクトル品質サンプル check | Review が 25 種のうち 8 種ランダム抽出 review | 8/8 Acceptable (or 7/8 with 1 minor revision) |
| CP2-C | A/B/C/D mock skeleton | `mock-claude-privilege-escalation-{a,b,c,d}.ts` のうち 2+ ファイル存在 + BaseMockClaude 継承 | ≥ 2 ファイル |
| CP2-D | TimeSource 適用率 | A/B/C/D 4 mock のうち LLMSource DI 経由で test pass する数 | ≥ 2 / 4 (50%) |
| CP2-E | 現時点 mock 比率推定 | 現時点完成 mock 経由 turn 数 / (mock + live 合計) を dry-run で計測 | 推定 mock 比率 ≥ 60% |
| CP2-F | API 消費 cumulative (5/9〜5/16) | Anthropic Console + cost-watcher 突合 | ≤ $4.00 (cap $30 の 13%) |
| CP2-G | T6 SOP outline | `dev-anthropic-console-sync-sop-v1.md` ドラフト存在 + outline 5 セクション以上 | ≥ 5 セクション outline |
| CP2-H | drill #1 振返り反映 | 5/13 drill #1 で発見された改善点 (もしあれば) が T1/T5 に組込済 | 反映済 or 不要判定 |

### §3.3 Pass 条件 (CP2 集約)

- **Pass**: CP2-A 〜 CP2-H の **8 項目全 Pass** + Dev-A から「5/19 CP3 で T1 80% 達成見込」明言
- **Conditional Pass**: 1-2 項目 Minor 未達 (例: CP2-D が 1/4 = 25%、CP2-E が 55%) → §3.4 軽微 mitigation で recovery
- **Fail**: 3 項目以上未達、または **T1 進捗 < 40%** または **mock 比率推定 < 50%** → §3.4 重大 mitigation 即発動

### §3.4 Fail 時の対応

| Fail パターン | 即時アクション | 期限 | escalation |
|---------------|---------------|------|------------|
| **T1 < 40%** (canned response < 20 種) | **5/22 までに 50 種完遂は不可能と判定** → canned response 数を **50 種 → 35 種に下方修正** + AC-T1-1 を threshold 緩和 (acceptance criteria §3.1 で `35/35 OK` を Conditional Pass 条件に組込み)、Review 部門が AC 改訂版を 5/17 までに発行 | 5/17 EOD | **CEO に MEDIUM + Owner に MEDIUM 通知** |
| **T5 < 25%** (DI 適用 0-1 mock) | T5 を **5/22 から 5/26 (Phase 1 W1 開始日) 後ろに持越判定** + T1 で A/B/C/D mock を一時的に live integration ベースで運用 (mock 比率は E ベクトル単独で 70% 達成) | 5/17 EOD | CEO に MEDIUM 通知 |
| **mock 比率推定 < 50%** | drill #3 dry-run の mock 経路強制化、live integration test の頻度を週 1 → drill 当日 1 回限定に再縮小 | 5/17 中 | Owner に MEDIUM 通知 |
| **API 消費 > $5** ($30 cap の 17%) | **DEC-019-050 二重防御が機能不全の疑い** → cost-watcher / budget-guard / Anthropic Console 3 経路 audit 実施、原因特定まで Dev は live test 全停止 | 即時 | **Owner に HIGH 通知** |
| **CP2-B 品質 8/8 中 3 件以上 NG** | E ベクトル 50 種を全て Review 部門品質 review 必須に変更、Dev-B レビューだけでは 5/22 検収通過不可と判定 | 5/17 EOD | CEO に MEDIUM 通知 |

### §3.5 5/16 時点での 5/22 検収確度予測

| CP2 結果 | 5/22 検収 Pass 確度 | Phase 1 着手 5/26 確度影響 |
|----------|--------------------|---------------------------|
| Pass | 86% (DEC-019-051 整合維持) | 86% 維持 |
| Conditional Pass | 80% | 84% (-2%) |
| Fail (T1 < 40%) | 60% | 78% (-8%) |
| Fail (mock 比率 < 50%) | 55% | 75% (-11%) |

---

## §4 Checkpoint 3 (5/19 月、着手 +11 日 / 終盤 3 日前)

### §4.1 検証対象タスク

| Task | 5/19 時点期待状態 |
|------|-------------------|
| T1 (mock 70% 化) | **80% 進捗** (E ベクトル 40-45 種完成 + A/B/C/D mock 4 個全完成) |
| T5 (TimeSource decoupling) | **50% 進捗** (A/B/C/D 4 mock 全てに LLMSource DI 適用済 + Vitest +6 のうち 3-4 ケース緑) |
| T6 (Console 同期 SOP) | **60% 進捗** (SOP ドラフト初版完成 + console-sync-checker.ts 実装 50%) |
| T3 (E2E staging 限定) | **完遂** (5/19 期限、Dev-B 単独タスク) |
| 全体 burndown | 26 SP / 16 SP remain (38% remain) |

### §4.2 検証項目 (検収本番に近い濃度)

| ID | 検証項目 | 検証方法 | Pass 条件 |
|----|----------|----------|-----------|
| CP3-A | E ベクトル canned response 数 | export 件数 count | ≥ 40 種 (80% 進捗) |
| CP3-B | E ベクトル品質サンプル check (本番想定) | Review が 40 種のうち 15 種ランダム抽出 + 10 系統 × 5 variant の偏り audit | 15/15 Acceptable + 系統偏り ≤ 2 系統 |
| CP3-C | A/B/C/D mock 4 個完成 + DI 適用 | 4 ファイル全存在 + LLMSource DI 経由で Vitest pass | 4/4 |
| CP3-D | drill #3 dry-run 実走 (リハ前のリハ) | `app/scripts/drill-3/run-all.sh` で 5 シナリオ通し実行、mock 比率実測 | mock 比率 ≥ 70% (本番 AC 整合) |
| CP3-E | 5/22 検収 mock 比率達成見込 | CP3-D 実測 + 残作業 (5/20-21) で完成見込線引き | 70% 達成 「確実」 |
| CP3-F | API 消費 cumulative (5/9〜5/19) | Anthropic Console + cost-watcher 突合 | ≤ $5.00 (cap $30 の 17%) |
| CP3-G | T3 完遂 | `app/.github/workflows/e2e-staging-weekly.yml` 存在 + Vitest CI から live test 切離確認 + dry-run 1 回成功 | 全 Pass |
| CP3-H | T6 SOP ドラフト初版 | `dev-anthropic-console-sync-sop-v1.md` 完成 (≥ 200 行 + 表 1 件以上 + drift 24h SLA 是正手順記載) | 全 Pass |
| CP3-I | TimeSource pattern 整合 (T5 50%) | `review-test-strategy-phase1.md` §6.4 と DI 設計 mermaid 整合 | 整合 OK |
| CP3-J | 既存 budget-guard 13 ケース + 5/3 prep 11 ケース regression | 全 24 ケース緑 | 100% Pass |

### §4.3 Pass 条件 (CP3 集約) — 5/22 検収の前哨戦

- **Pass**: CP3-A 〜 CP3-J の **10 項目全 Pass** + drill #3 dry-run mock 比率 ≥ 70% 実測 → **5/22 検収 Pass 確度 90%+**
- **Conditional Pass**: 1-2 項目 Minor 未達 (例: CP3-A が 38 種、CP3-D が mock 比率 68%) → 5/20-21 で recovery 可能、5/22 検収 Pass 確度 80-85%
- **Fail**: 3 項目以上未達、または **CP3-D mock 比率 < 65%** または **T3 未完** → §4.4 重大 mitigation 即発動 + 5/22 検収 fallback 切替準備

### §4.4 Fail 時の対応 (5/22 検収切替判断)

| Fail パターン | 即時アクション | 5/22 検収結果切替 |
|---------------|---------------|--------------------|
| **mock 比率 < 65%** | 5/20-21 で Dev-A + Dev-B が **canned response 5-10 種を緊急追加** + drill #3 dry-run 再実行で 70% 確認 | Pass 維持 (recovery 成功時) / Conditional Pass (recovery 失敗時) |
| **T1 < 70%** (canned 35 種未満) | 5/22 検収を **「条件付き Pass」へ pre-切替決定** + 5/23-24 を recovery 期間として正式確保、5/29 公式 drill 通常実施は維持 | **Conditional Pass 確定 → 5/23-24 修正期間** |
| **T1 < 60% + T5 < 30%** | 5/22 検収を **Fail 確実視** → 5/29 公式 drill **1 週間延期 (5/29 → 6/5)** + Phase 1 着手 **5/26 → 6/2** 事前 escalation | **Fail 確定 → §8 段階 3 起動** |
| **T3 未完** | Dev-B が 5/20 中に GitHub Actions workflow + cron 設定完遂、Vitest filter は 5/21 朝までに完成 | T3 5/21 完遂時は 5/22 影響軽微 (Phase 1 W1 着手前に間に合えば良い) |
| **T6 SOP < 60%** | PM + Dev-A 協働密度を 5/20-21 で倍増、SOP は Review 5/22 検収で文書 review が中心なので分量 200 行 → 300 行までは 1.5 日で達成可能 | 5/22 影響軽微 |
| **既存 regression 発生** | DEC-019-050 二重防御の信頼性が問われる重大事態 → Dev は他作業全停止し regression 修正専念、5/22 検収を 5/23 に 1 日延期判定 | **5/22 検収 5/23 延期 + Owner に HIGH 通知** |

### §4.5 5/19 時点での 5/22 検収確度確定

| CP3 結果 | 5/22 検収 Pass 確度 | 5/22 当日想定判定 |
|----------|---------------------|--------------------|
| Pass | 90%+ | Pass (35-37/37) |
| Conditional Pass | 80-85% | Pass or Conditional Pass (32-36/37) |
| Fail (T1 < 70%) | 65% | Conditional Pass + 5/23-24 修正 |
| Fail (T1 < 60% + T5 < 30%) | 45% | Fail + 5/29 drill 1 週間延期 |

---

## §5 5/22 当日検収プロセス (4 段階タイムライン)

### §5.1 5/22 09:00-18:00 JST 詳細タイムライン

| 時刻 | フェーズ | 内容 (1h 単位) | 担当 | 成果物 |
|------|---------|----------------|------|--------|
| **09:00-12:00 (3h)** | **Dev → Review 引渡し** | (a) 09:00-09:30 Dev W0-Week2 5 必須施策完遂宣言 + 全成果物コミットハッシュ提示 / (b) 09:30-11:00 `app/scripts/drill-3/run-all.sh` で 5 シナリオ通し実行デモ (mock 比率実測 + API 消費実測 + Vitest 全緑確認) / (c) 11:00-12:00 Review 部門 sandbox 環境で再現確認 + AC 37 件 pre-check の異常検知有無 | Dev-A + Dev-B (主) + Review 主担当 (受け) | 引渡し log + デモ録画 + Vitest report |
| **(休憩 12:00-13:00)** | — | 昼食 + 検収準備 (Review が AC checklist 印刷) | — | — |
| **13:00-16:00 (3h)** | **AC 37 件検収** | (a) 13:00-14:30 (1.5h) シナリオ別 AC 27 件 (A=5 / B=5 / C=4 / D=6 / E=7) を順次判定 / (b) 14:30-15:30 (1h) TimeSource AC 3 件 + 総合 cross-cutting AC 7 件 = 10 件判定 / (c) 15:30-16:00 (0.5h) 全 37 件再点検 + 不明箇所 Dev へ Q&A | Review 主担当 + Review 立会 (2 名体制) | AC checklist (37 件 OK/NG/部分 OK) |
| **16:00-17:00 (1h)** | **検収結果集計 + 4 段階 fallback 判定** | (a) 16:00-16:30 集計: OK 件数 / NG 件数 / 部分 OK 件数 / mock 比率実測 / API 消費実測 / cross-cutting G-1〜G-7 / (b) 16:30-17:00 §8 4 段階 fallback マトリクスで判定 (Pass / Conditional Pass / Fail (segment) / Fail (severe)) + 根拠記録 | Review 主担当 (主) + Review 立会 (検算) | 判定書ドラフト |
| **17:00-18:00 (1h)** | **CEO + Owner 通知 + 5/29 公式 drill #3 Go/NoGo 判定** | (a) 17:00-17:30 CEO に判定書 + 根拠 + 5/29 影響を Slack DM 通知、CEO 即時 review / (b) 17:30-18:00 Owner に最終結果通知 (HIGH レベル相当)、5/29 公式 drill 公式実施 Go/NoGo + Phase 1 着手 5/26 Conditional Go 維持/再考 を 18:00 確定 | Review (起案) → CEO (review) → Owner (通知) | `review-mock-claude-70pct-acceptance-result.md` (5/22 18:00 起案完了) |

### §5.2 5/22 当日 SLA + リスク

- **9 時間枠 (09:00-18:00) 厳守**: 上記 4 段階のいずれかで超過した場合、検収結果通知を 5/22 21:00 まで延長 (Owner には 17:00 時点で「結果遅延 (理由)」中間通知)
- **検収中断シナリオ**:
  - シナリオ B で DELETE/UPDATE 1 操作通過判明 → 即時 drill #3 全停止、§8 段階 4 (致命的) 発動、5/22 17:00 Owner HIGH escalation
  - mock 比率実測 < 50% → 検収継続不可、Conditional Pass + 5/23-24 修正で確定
  - Dev 側で引渡し時点 (12:00 まで) に T1 < 70% 判明 → 検収プロセスを 5/23 に 1 日延期、5/22 当日は Dev 残作業優先

### §5.3 検収成果物 (5/22 18:00 までに納品)

| 成果物 | 形式 | 場所 |
|--------|------|------|
| 検収判定結果 (Pass/Conditional Pass/Fail) | Markdown | `projects/PRJ-019/reports/review-mock-claude-70pct-acceptance-result.md` |
| AC checklist 全項目記録 | Table (37 項目 + 検証方法 + 結果) | 同上 §2 |
| mock 比率 + API 消費 実測値 | Table | 同上 §3 |
| 失敗時 修正項目リスト | Table | 同上 §4 |
| 5/29 公式 drill 進行可否 sign-off | Markdown | 同上 §5 |
| 5/26 Phase 1 着手 Conditional Go 維持/再考 判定 | Markdown | 同上 §6 |

---

## §6 Risk Monitor (W0-Week2 全期間、5 リスク daily 監視)

### §6.1 監視対象 5 リスク (Risk Register v3.1 21 件のうち W0-Week2 動向監視必須)

| ID | リスク | スコア (現時点) | 色 | W0-Week2 動向監視必須理由 |
|----|--------|-----------------|----|---------------------------|
| **R-019-15** | Privilege Escalation 攻撃 | 15 | **赤** | drill #3 mock 70% 化が R-019-15 mitigation v2 の中核、5/22 検収結果で赤→黄化判定が左右される |
| **R-019-19** | API $30 Hard cap 突破時の Phase 1 中断 | 8-12 想定 | **黄** | W0-Week2 中の API 消費が cap 接近 (Soft $25) に近づく場合 Phase 1 着手が制約される |
| **R-019-20** | アプリ層 × Anthropic Console 二重防御 drift | 4-6 想定 | **緑** | T6 SOP 策定中に drift が顕在化すれば再設計、5/22 SOP 検収で緑維持 vs 黄昇格判定 |
| **R-019-21** | subscription quota 突破時 API fallback 急速消費 | 8-10 想定 | **黄** | W0-Week2 中 Owner が Claude Max $200 を W0-Week1 比 2 倍消費する兆候があれば Phase 1 着手前に fallback SOP 強化必要 |
| **R-019-22** | mock/template 遅延で API 消費膨張 | 4-6 想定 | **緑** | T1/T2/T5 のいずれか遅延 → mock 比率未達 → live integration test 増加 → API 消費膨張、本書 Checkpoint と直結 |

### §6.2 R-019-15 daily monitor (Privilege Escalation、最重要)

| 監視項目 | 計測方法 | 閾値 (alert 発火) | アラート発火時の対応 |
|----------|---------|-------------------|---------------------|
| PE 試行検知件数 (audit log) | 過去 24h の `/audit/privilege-escalation-attempt` log count | **5 件/週超 → 即 CEO escalation** / **2 件/日超 → Review に通知** | drill #3 シナリオ B/C/D の即時 dry-run 確認 + L1〜L4 防御 health check |
| drill #3 dry-run 失敗回数 (Dev 側内部) | Dev daily report の dry-run section | **3 回連続 dry-run でシナリオ A or B 1 操作通過** | drill #3 設計再点検、5/29 公式 drill 延期検討、§8 段階 4 (致命的) 起動準備 |
| HITL-9/10/11 通知発火 success | Slack 通知 health check | **success rate < 95% / 24h** | T2 template engine 緊急 fix、5/22 検収にも影響 |
| Pen Test #1 準備状況 | 5/30 実施に向けた Dev 進捗 | **5/22 時点で攻撃シナリオ 36 件の skeleton 未着手** | (W0-Week2 終了前は緊急性なし、CP3 で確認すれば良) |

### §6.3 R-019-19 daily monitor (API $30 cap 突破リスク)

| 監視項目 | 計測方法 | 閾値 | アラート発火時の対応 |
|----------|---------|------|---------------------|
| API 消費 cumulative (月初〜現時点) | `cost-watcher.ts` daily cron + Anthropic Console | **$3 cross → LOW 通知** / **$24 cross (warn) → MEDIUM** / **$25 cross (Soft 警告メール) → HIGH** / **$28.5 cross (auto_stop) → 即時 Phase 1 stop 検討** / **$30 cross (hard_fail) → drill 全停止** | 各 threshold で §7 Owner 通知レベル発動 |
| daily burn rate (1 日あたり消費) | 直近 3 日平均 | **$1.0/日超 = 月次 $30 突破ペース** | Dev W0-Week2 タスクで mock 経由比率が想定より低い疑い、CP1/CP2 mock 比率実測値の前倒し検証 |
| live integration test 実行回数 | Vitest log で `LIVE_INTEGRATION=true` flag run 数 | **5 回/週超** | T3 (E2E staging 限定) の filter 漏れ疑い、Dev-B に即時 audit 依頼 |

### §6.4 R-019-20 daily monitor (二重防御 drift、緑)

| 監視項目 | 計測方法 | 閾値 | アラート発火時の対応 |
|----------|---------|------|---------------------|
| Anthropic Console 設定値 | Owner 月次 1 回 screenshot (5/9 + 6/9) | Hard $30 / Soft $25 と内部 cap value diff > $0.50 | T6 SOP の drift 24h SLA 起動、Owner と PM で Console 値修正 |
| `cost-watcher.ts` health | daily cron 成功率 | **success < 100% (cron 失敗)** | Dev-A が 24h 以内に修復、再実行で過去 1 日分の消費再計測 |

### §6.5 R-019-21 daily monitor (subscription quota 突破)

| 監視項目 | 計測方法 | 閾値 | アラート発火時の対応 |
|----------|---------|------|---------------------|
| Claude Max $200 消費率 (Owner) | Owner 自己申告 (Slack daily 1 行報告) | **W0-Week1 比 +50% 急増** | subscription only fallback SOP (PM §9.3) 起動準備、Phase 1 W1 で Owner 工数縮小要否検討 |
| Sumi (PRJ-012) 経由 Claude Code 利用率 | mcp-sumi-bridge log | **drill #3 リハ期間中に subscription 経由実行が 0** | T1/T5 で subscription pathway が正しく組込まれていない疑い、Dev に確認 |

### §6.6 R-019-22 daily monitor (mock/template 遅延、緑)

| 監視項目 | 計測方法 | 閾値 | アラート発火時の対応 |
|----------|---------|------|---------------------|
| T1 progress vs 計画 | CP1/CP2/CP3 結果 + 中間 daily | **計画 -10% (例: 5/16 時点 40% 未達)** | §3.4 mitigation 起動 |
| T2 progress (5/9 期限) | 5/9 EOD 完遂確認 | **5/9 EOD 未完** | §2.4 mitigation 起動、CP1 対象前倒し |
| T5 progress vs 計画 | CP2/CP3 結果 | **5/16 時点 < 25% / 5/19 時点 < 50%** | §3.4 / §4.4 mitigation 起動 |
| API 消費 vs 想定 burn (mock 削減効果) | weekly | **想定 $4/週 を $6 超過** | mock 経由率の Vitest spy 検証、Dev-A に経路調査依頼 |

### §6.7 daily monitor 報告フロー

- 毎日 18:00 JST、Dev-A が Slack `#prj019-monitor` に **1 行 daily** で投稿: `[5/13] T1 28% / T5 0% / API $1.80 / 異常なし`
- Review 主担当が 19:00 までに目視 + cost-watcher log 突合、閾値超過時は **22:00 までに Owner 通知レベル判定 + escalation**
- 週次 (毎週金曜 EOD): Risk Register v3.1 5 リスクの色更新を Review が起案、CEO に共有

---

## §7 Owner 通知レベル

### §7.1 3 レベル定義

| レベル | 用途 | 通知経路 | Owner 期待アクション |
|--------|------|---------|---------------------|
| **LOW (情報共有)** | 監視値の note、緊急性なし | Slack `#prj019-monitor` 1 投稿 + 週次 KPI report に集約 | (確認のみ、判断不要) |
| **MEDIUM (確認)** | 計画 deviation あり、Owner の認識共有が望ましい | Slack `#prj019-monitor` + Slack DM (Owner) | 24h 以内に確認返信 |
| **HIGH (即時判断)** | Phase 1 着手影響 / セキュリティ重大 / 予算重大 | Slack DM (Owner) + email + 必要時電話 | **2h 以内 (営業時間内) に判断応答必須** |

### §7.2 各レベルの発火条件 (具体)

| 発火条件 | レベル | 補足 |
|----------|--------|------|
| mock 比率現時点 50% 以下 (CP1/CP2 で実測) | **LOW** | CP3 までに recovery 計画提示で解消 |
| API 消費 $3 cross (5/9 着手から) | **LOW** | 想定 burn rate $0.40/日 の上振れ |
| CP1/CP2 1 項目 Minor 未達 | **LOW** | mitigation 自動起動、Owner 認識共有のみ |
| Checkpoint 2 (5/16) Fail (3 項目以上未達) | **MEDIUM** | 5/22 検収 80% 確度予測、Owner 認識共有 |
| mock 比率 60% 未達 (CP2 実測) | **MEDIUM** | recovery 計画妥当性 Owner レビュー |
| T1 < 40% (CP2) → canned 50→35 下方修正検討 | **MEDIUM** | AC 改訂版 5/17 までに Review が発行、Owner 承認 |
| API 消費 $24 (warn) cross | **MEDIUM** | DEC-019-050 二重防御の warn 発動、Phase 1 着手影響なし |
| Checkpoint 3 (5/19) Fail | **HIGH** | 5/22 検収 Conditional Pass / Fail 確定、5/29 drill 影響判断必要 |
| API 消費 $25 (Soft 警告メール) cross | **HIGH** | Anthropic 公式メール到着、Owner 即判断 |
| API 消費 $28.5 (auto_stop) cross | **HIGH** | Phase 1 stop 検討、subscription only fallback 起動判断 |
| API 消費 $30 (hard_fail) cross | **HIGH** | drill 全停止、6/1 リセットまで全タスク subscription 主軸切替 |
| R-019-15 動向: PE 試行 5 件/週超 | **HIGH** | drill #3 設計緊急再点検、5/29 公式 drill 延期検討 |
| R-019-15 動向: drill #3 dry-run でシナリオ B 1 操作通過 | **HIGH** | §8 段階 4 (致命的) 即時起動 |
| 5/22 検収 Fail (severe) | **HIGH** | Phase 1 着手 5/26 → 6/2 (1-2 週間延期) 確定 |

### §7.3 通知文テンプレ (HIGH レベル)

```
[PRJ-019 W0-Week2 HIGH alert / {日時} JST]
発火条件: {条件}
現在状態: {実測値 or 観測事実}
影響: {Phase 1 着手 / 予算 / セキュリティ}
推奨アクション: {Owner 判断選択肢 A/B/C}
判断 SLA: 2h 以内
連絡先: Review 主担当 + CEO
```

---

## §8 4 段階 Fallback (mock-70% AC §11/§12 連動)

### §8.1 段階定義 (review-mock-claude-70pct-acceptance-criteria.md §11.1 §12.3 整合)

| 段階 | 5/22 検収結果 | AC OK 件数 | 内容 | 5/29 drill #3 | Phase 1 着手 5/26 |
|------|---------------|-----------|------|---------------|-------------------|
| **段階 1 (軽微)** | **Pass + minor 修正** | 35-37/37 | 1-2 件 minor を 5/23-24 で軽微修正、5/29 drill 通常実施 | **通常実施** | **Conditional Go 維持 (確度 84-86%)** |
| **段階 2 (中規模)** | **Conditional Pass + 5/23-24 修正** | 30-34/37 | 3-7 件 mid を 5/23-26 で修正 + 5/27 再検収、5/29 通常実施 (該当シナリオのみ部分実施可) | **通常 or 部分実施** | Conditional Go 維持 (確度 80%、再考検討) |
| **段階 3 (重大)** | **5/22 Fail + 5/29 drill 1 週間延期** | 25-29/37 (Critical 1 件含む) | 5/23-28 全力修正 + 5/28 EOD 再検収、5/29 公式 drill **5/29 → 6/5 リハ → 6/12 公式** に 1-2 週間延期 | **延期 (6/5 リハ → 6/12 公式)** | **5/26 → 6/2 (1 週間延期、TR-1 ルール準用、確度 75%)** |
| **段階 4 (致命的)** | **scaffold review v2 起案 + Phase 1 着手 2 週間延期** | < 25/37 or シナリオ B Critical | drill #3 全停止 + R-019-15 = 赤格付け維持確定 + DB スナップショット復元 + L3 hash chain 再設計 + Pen Test #1/#2 シナリオ拡張 (47 → 60) | **全延期 (5/29 → 6/12 リハ → 6/19 公式)** | **5/26 → 6/9 (2 週間延期、確度 65% 以下)** |

### §8.2 段階別の Review 部門アクション (5/22 18:00 以降)

| 段階 | Review 部門アクション (5/22 18:00 以降) | 期限 | 関連議決 |
|------|----------------------------------------|------|----------|
| **段階 1** | (a) minor 修正 2 件の改修指示書を Dev に発行 / (b) 5/24 EOD で再検収完了 sign-off / (c) 5/29 drill #3 進行 GO 通知 | 5/24 EOD | 議決-7 (drill #3) YES 採択 |
| **段階 2** | (a) mid 修正 3-7 件の改修指示書を Dev に発行 / (b) 5/27 再検収 + 5/29 drill 進行範囲決定 / (c) Phase 1 着手 5/26 Conditional Go 維持判定 | 5/27 EOD | 議決-7 + 議決-22/23 全 YES 維持 |
| **段階 3** | (a) Critical 1 件の改修指示書 + 5/28 EOD 再検収 / (b) 5/29 公式 drill 延期通知 + 6/5 リハ・6/12 公式の新スケジュール起案 / (c) Phase 1 着手 5/26 → 6/2 escalation を CEO + Owner に HIGH 通知 / (d) 議題-7 (5/8 議決済) を 5/22 緊急 ad-hoc で見直し議決準備 | 5/28 EOD | 議決-7 / 22 / 23 / 24 部分撤回検討 |
| **段階 4** | (a) drill #3 全停止公式宣言 / (b) DB スナップショット復元手順起動 (Dev + Owner 立会) / (c) L3 hash chain 再設計 5/23-28 / (d) Pen Test 拡張 47 → 60 設計 / (e) **scaffold code review v2 起案** (新規文書) / (f) Phase 1 着手 5/26 → 6/9 escalation を Owner に HIGH 通知 | 6/9 (Phase 1 新着手日) | 議決-7 / 22 / 23 / 24 全撤回 + DEC-019-051 再考 |

### §8.3 段階間遷移ルール (5/23-24 recovery 期間中)

- 段階 1 → 段階 2 への悪化: 5/23-24 で minor 修正中に新規 Critical 発見 → 段階 2 切替、5/27 再検収にスライド
- 段階 2 → 段階 3 への悪化: 5/27 再検収で Critical 残存 → 段階 3 切替、5/29 公式 drill 延期確定
- 段階 3 → 段階 4 への悪化: 5/28 再検収でシナリオ B 1 操作通過判明 → 段階 4 切替、scaffold review v2 即起案
- 段階 4 からの recovery: 6/9 着手日確保のため 5/23-6/8 で全力修正、6/9 Phase 1 着手前に 100% recovery 必須

---

## §9 結論 + Review 部門 5/22 検収体制宣言

### §9.1 本書の効果

- **5/22 検収失敗リスクの早期検知**: 5/13 / 5/16 / 5/19 の 3 checkpoint で 5/22 より 9 / 6 / 3 日前に Fail 兆候を検知し、`segmentwise mitigation` が可能
- **W0-Week2 期間の透明性**: daily monitor + checkpoint レポートで CEO + Owner が常時状態把握可能、Owner-in-the-loop モデル整合
- **Risk Register v3.1 21 件のうち重要 5 件 daily 監視**: R-019-15 (赤) を中心に R-019-19/20/21/22 の挙動を可視化、Phase 1 着手 5/26 直前まで mitigation 強化
- **Owner 通知 3 レベル明確化**: HIGH のみ Owner 即時応答必須、LOW/MEDIUM は集約 → Owner 工数 ≤ 週 10h 維持

### §9.2 5/22 検収 Pass 確度予測 (本書反映後)

| 時点 | 5/22 Pass 確度 | 根拠 |
|------|---------------|------|
| 本日 5/4 (本書起案時) | 78% | DEC-019-051 採用 + AC 37 件起案 + WBS 確定 (全部署整合) |
| CP1 (5/13) Pass 後 | 82% | T2 完遂 + T1 25% 確認、計画整合 |
| CP2 (5/16) Pass 後 | 86% | T1 50% + T5 25% + mock 比率 60% 達成 |
| CP3 (5/19) Pass 後 | **90%+** | mock 比率 70% 達成見込確実、T3 完遂 |
| 5/22 検収当日 | (実測) | Pass 判定 → Phase 1 着手 5/26 Conditional Go 86% 確度維持 |

### §9.3 Review 部門 5/22 検収体制宣言

- 検収主担当: Review 部門主任 (本書起案者)
- 検収立会: Review 部門副担当 (2 名体制で AC 37 件 cross-check)
- 検収準備期間: 5/9〜5/21 (毎日 daily monitor + 3 checkpoint)
- 検収当日 (5/22): 09:00-18:00 JST 9 時間枠厳守
- 5/29 公式 drill #3 進行可否 sign-off は 5/22 18:00 までに発行
- Phase 1 着手 5/26 Conditional Go 維持/再考 判定は 5/22 18:00 までに CEO へ起案

### §9.4 次回更新

- 2026-05-13 (CP1 結果反映、本書 §2.5 結果記入 + 確度予測更新)
- 2026-05-16 (CP2 結果反映)
- 2026-05-19 (CP3 結果反映、5/22 検収最終予測確定)
- 2026-05-22 (検収結果反映、`review-mock-claude-70pct-acceptance-result.md` への移行宣言)

---

## フッタ

- 文書: `projects/PRJ-019/reports/review-w0-week2-checkpoint-and-risk-monitor.md`
- 版: v1.0 (2026-05-04)
- 起案: Review 部門 (CEO 推奨案 Owner 承認 2026-05-04 を受けた delivery プロセス保証)
- 対象期間: 2026-05-09 〜 2026-05-22 (W0-Week2 14 日間)
- 中間 checkpoint: **3 回** (5/13 / 5/16 / 5/19、各 14:00-15:00 JST)
- 5/22 検収プロセス: **4 段階タイムライン** (引渡し 3h + AC 検収 3h + 集計 1h + 通知 1h = 9h 枠)
- Risk monitor: **5 リスク** (R-019-15 / 19 / 20 / 21 / 22) daily 監視
- Owner 通知レベル: **3 段階** (LOW / MEDIUM / HIGH)
- Fallback: **4 段階** (軽微 / 中規模 / 重大 / 致命的)、最悪ケースで Phase 1 着手 5/26 → 6/9 (2 週間延期) + scaffold review v2 起案
- 連動 AC 件数: 37 件 (`review-mock-claude-70pct-acceptance-criteria.md`)
- 連動 SP 監視: 42 SP / 22 人日 (`dev-w0-week2-mandatory-5-tasks-wbs.md`)
- 次回更新: 2026-05-13 (CP1 結果反映)
