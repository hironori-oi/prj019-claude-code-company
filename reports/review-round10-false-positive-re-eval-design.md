# PRJ-019 — Round 10 tos-monitor 偽陽性 matrix re-evaluation 設計（Dev-β 着地後）

最終更新: 2026-05-04 W0-Week1 深夜 / 起案: Review 部門 R10 Review-δ
位置付け: Round 9 で Dev-A2 が `app/harness/src/tos-monitor.ts` 660 行を着地（41 cases 緑化）。Round 9 偽陽性 matrix（4×5 = 20 セル、high 4 / medium 9 / low 7）は実装完成前の設計レビュー版だったため、Round 10-11 の Dev-β 着地（残実装 = high 4 セル対応プリミティブ + extended flag + Owner escalation Slack quick-action button）後に matrix を再評価する必要がある。本書はその再評価方式 + 各セル新規 PASS 基準 + 再評価実行 timeline を確立する。
版: v1.0（Round 10 Review-δ 起案、read-only + report-only）
連動 DEC: DEC-019-007 / DEC-019-008（NG-3 暫定値）/ DEC-019-025（Agent dispatch SOP）/ DEC-019-050（API cap $30）/ DEC-019-052（案 C）/ DEC-019-054 / DEC-019-055 / DEC-019-056（Round 9 前倒し）
連動レポート: `review-round9-tos-monitor-false-positive-matrix.md`（Round 9 設計レビュー版 4×5 matrix）/ `review-round10-ban-drill-2-prep.md`（drill #2 5/8 朝版 9 シナリオ）/ `dev-round9-tos-monitor-impl.md`（Dev-A2 660 行 着地報告）

---

## §0 200 字 CEO サマリ

Round 9 偽陽性 matrix（4 detector × 5 シナリオ = 20 セル、high 4 / medium 9 / low 7）の実装後 re-evaluation 設計を起案。Dev-A2 着地（660 行）で 4 detector + 2 hook + 1 stub source は緑化済（41 cases）、残 Dev-β 着地は high 4 セル対応プリミティブ 3 種（extended flag / Slack quick-action / debounce 60s）+ monotonic clock 採用 + tolerance 60s 追加。再評価方式は 4 段階（Dev-β 着地確認 → 20 セル実機注入 → high 4 セル新規 PASS 基準達成判定 → matrix v2.0 起案）、各セル新規 PASS 基準は high 4 セルすべてで「false-positive 月次発生確率 < 1%」+「manual override 30min SLA 内応答」+「audit log 完全記録」。再評価 timeline は 5/8 18:00（議決-23 採択直後）+ 5/17 drill #2 当初実施日 + 5/30 W2 完遂時の 3 回。議決-26 採択 5 軸のうち「Phase 1 W2 tos_monitor hooks 完遂」軸に直接寄与（+5pt 押上見込み 85→90%）。

---

## 目次

| § | 題目 |
|---|------|
| §1 | re-evaluation の目的と Dev-β 残実装範囲 |
| §2 | 再評価方式（4 段階フロー） |
| §3 | 20 セル新規 PASS 基準（high 4 / medium 9 / low 7） |
| §4 | 再評価実行 timeline（3 回スケジュール） |
| §5 | matrix v2.0 起案の構造 |
| §6 | 議決-26 採択 5 軸への寄与判定 |
| §7 | Round 11 引継 TODO + Owner 観察ポイント |

---

## §1 re-evaluation の目的と Dev-β 残実装範囲

### §1.1 Round 9 設計レビュー版 matrix の限界

Round 9 起案版 matrix は Dev-A2 実装完成前の **設計レビュー** であり、以下 3 点で実装後再評価が必須:

1. **Dev-A2 着地（660 行、41 cases）の品質確証**: 設計レビュー時点で「実装完成見込み」と仮定した 4 detector + 1 stub source の動作を実機で検証
2. **high 4 セル対応プリミティブの動作確認**: 設計レビュー時点で「Dev-β で実装」と仮定した 3 プリミティブ（extended flag / Slack quick-action / debounce 60s）の動作を実機で検証
3. **multi-process interaction 5 セルの実機検証**: 設計レビュー時点で「drill #2 で確証」と仮定した 3 アプリ独立性を実機で検証

### §1.2 Dev-β 残実装範囲

Round 9 案 9-A2（Dev-A2、660 行着地済）と区別される Dev-β 残実装範囲:

| # | 残実装 | 起源 matrix セル | 配置 W |
|---|---|---|---|
| 1 | continuous_run × sleep boundary 対応: monotonic clock 採用 + tolerance 60s 追加 | セル 1-4 | W1（5/19-25） |
| 2 | cost_cap × spike legit 対応: `--cost-cap-extended` flag + Owner immediate override hook + Anthropic console 二段防御 | セル 2-3 | W1（5/19-25） |
| 3 | rate_spike × boundary 対応: debounce window 60s + sliding window rate calculation + jittering 統合 | セル 3-2 | W1（5/19-25） |
| 4 | rate_spike × spike legit 対応: `--rate-spike-extended` flag + 自動再有効化 hook | セル 3-3 | W1（5/19-25） |
| 5 | Owner escalation Slack quick-action button（30min SLA + 1h cooldown） | high 4 セル共通 | W2（5/26-6/1） |
| 6 | multi-process interaction 5 セル独立性確証 hook | セル 1-5 / 2-5 / 3-5 / 4-5 | drill #2（5/17 or 5/8 朝） |

### §1.3 re-evaluation の最終目的

re-evaluation により以下 3 点を確証:

1. **Round 9 設計レビュー版 matrix（high 4 / medium 9 / low 7）の精度確証**
2. **Dev-β 残実装の動作品質確証**（false-positive 月次発生確率 < 1% を high 4 セル全てで達成）
3. **Phase 1 W2（CB-D-W2-06、5/30 期限）tos_monitor hooks 完遂判定**（議決-26 採択 5 軸の 1 つ）

---

## §2 再評価方式（4 段階フロー）

### §2.1 4 段階フロー全体像

```
[段階 1: Dev-β 着地確認]
   └ Round 11 → Phase 1 W1（5/19-25）で 6 残実装件すべて完遂確認
   ↓
[段階 2: 20 セル実機注入]
   └ Phase 1 W1 末（5/25）で harness/Vitest mock 環境内で全 20 セル注入
   └ 各セルで false-positive 発生件数を 1 週間連続観測（5/19-25）
   ↓
[段階 3: high 4 セル新規 PASS 基準達成判定]
   └ Phase 1 W2 中盤（5/30）で高 4 セルすべて新規 PASS 基準達成確認
   └ manual override 30min SLA 内応答 + audit log 完全記録 + month 換算 < 1%
   ↓
[段階 4: matrix v2.0 起案]
   └ Phase 1 W2 末（5/30 EOD）で matrix v2.0 を Review 部門が起案
   └ 議決-26 採択 5 軸「Phase 1 W2 tos_monitor hooks 完遂」軸の達成判定
```

### §2.2 各段階の詳細

| 段階 | 期限 | 担当 | 完遂条件 |
|---|---|---|---|
| 1: Dev-β 着地確認 | 5/25 EOD | Review + Dev | 6 残実装件すべて commit + テスト緑化 + Review sign-off |
| 2: 20 セル実機注入 | 5/25 EOD | Review | 20 セル全注入実施 + false-positive 件数集計 |
| 3: high 4 セル PASS 基準達成 | 5/30 EOD | Review + Dev | high 4 セルすべて新規 PASS 基準達成 |
| 4: matrix v2.0 起案 | 5/30 EOD | Review | matrix v2.0 + 議決-26 軸達成判定文書化 |

### §2.3 段階間の依存関係と並列化可否

| 段階 | 前提段階 | 並列化可否 | 並列化先 |
|---|---|---|---|
| 1 | （なし） | 可（Dev-β 6 件すべて並列実装） | W1 内に 6 件並列 |
| 2 | 1 完遂後 | 可（20 セル独立注入） | 5/25 当日に 20 セル並列注入 |
| 3 | 2 完遂後 | 可（high 4 セル独立判定） | 5/26-30 期間中に 4 セル並列判定 |
| 4 | 3 完遂後 | 不可（matrix 統合作業のため sequential） | 5/30 EOD に集中作業 |

### §2.4 再評価実行の前提条件

| 前提 | 内容 | 確認時点 |
|---|---|---|
| Dev-A2 着地済 | 660 行、41 cases 緑化 | Round 10 開始時点で確認済 |
| Dev-β 残実装の予算確保 | API 追加コスト = $0、subscription 流量で完遂 | 5/8 議決-23 採択時 |
| Sumi/Asagi 並走中の干渉ゼロ | 3 アプリ独立 audit log + Slack ch 分離 | 5/17 drill #2 で確証 |
| Phase 1 W1 着手 | 5/19 着手承認（議決-2 連動） | 5/8 議決-2 採択時 |

---

## §3 20 セル新規 PASS 基準

### §3.1 全 20 セル新規 PASS 基準サマリ

| detector × シナリオ | Round 9 設計レビュー判定 | 新規 PASS 基準 |
|---|---|---|
| **continuous_run** × typical use | 低 / yes | false-positive 月次発生 0 件、confirmCount default 2 で完全抑制 |
| continuous_run × boundary | 中 / partial | false-positive 月次発生 ≤ 3 件、debounce 60s で抑制 |
| continuous_run × spike legit | 中 / partial | false-positive 月次発生 ≤ 3 件、`--allow-extended-run` flag で抑制 |
| **continuous_run × sleep** | **高 / no** | **false-positive 月次発生 < 1%（< 1 件）、monotonic clock + tolerance 60s で抑制 + manual override 30min SLA** |
| continuous_run × multi-process | 中 / partial | false-positive 月次発生 ≤ 3 件、app_id tag で完全分離 |
| **cost_cap** × typical use | 低 / yes | false-positive 月次発生 0 件、watchdog 3 段階で完全抑制 |
| cost_cap × boundary | 中 / partial | false-positive 月次発生 ≤ 3 件、debounce 5min で抑制 |
| **cost_cap × spike legit** | **高 / no** | **false-positive 月次発生 < 1%、`--cost-cap-extended` flag + Anthropic console 二段防御 + Owner override 30min SLA** |
| cost_cap × sleep | 低 / yes | false-positive 月次発生 0 件、atomic reset で完全抑制 |
| cost_cap × multi-process | 中 / partial | false-positive 月次発生 ≤ 3 件、independent cost-tracker で抑制 |
| **rate_spike** × typical use | 中 / partial | false-positive 月次発生 ≤ 3 件、jittering で抑制 |
| **rate_spike × boundary** | **高 / no** | **false-positive 月次発生 < 1%、debounce 60s + sliding window で抑制 + manual override 30min SLA** |
| **rate_spike × spike legit** | **高 / no** | **false-positive 月次発生 < 1%、`--rate-spike-extended` flag + 自動再有効化 hook + Owner override 30min SLA** |
| rate_spike × sleep | 低 / yes | false-positive 月次発生 0 件、sliding window で完全抑制 |
| rate_spike × multi-process | 中 / partial | false-positive 月次発生 ≤ 3 件、independent rate window で抑制 |
| **ng3_violation** × typical use | 低 / yes | false-positive 月次発生 0 件、AND 条件で完全抑制 |
| ng3_violation × boundary | 中 / partial | false-positive 月次発生 ≤ 3 件、debounce 60s で抑制 |
| ng3_violation × spike legit | 中 / partial | false-positive 月次発生 ≤ 3 件、`--ng3-extended` flag で抑制 |
| ng3_violation × sleep | 中 / partial | false-positive 月次発生 ≤ 3 件、atomic reset + manual override |
| ng3_violation × multi-process | 中 / partial | false-positive 月次発生 ≤ 3 件、independent NG-3 判定 |

### §3.2 high 4 セル新規 PASS 基準の詳細

#### §3.2.1 セル 1-4 (continuous_run × sleep boundary)

| 観点 | 新規 PASS 基準 | 計測方法 |
|---|---|---|
| false-positive 月次発生確率 | < 1%（< 1 件 / 月） | 5/19-25 1 週間注入 + 当 month 換算 |
| monotonic clock 採用 | performance.now() ベース | Vitest fake timer + monotonic clock spy |
| tolerance 60s 動作 | startTime + 12h + tolerance(60s) | 11h59min59sec で判定なし、12h+1min で判定あり |
| manual override 30min SLA | Slack quick-action button 30min 内応答 | Owner 模擬応答 timestamp |
| audit log 完全記録 | append-only chain で full trace | mock auditStore.replay → SHA-256 verify |

#### §3.2.2 セル 2-3 (cost_cap × spike legit)

| 観点 | 新規 PASS 基準 | 計測方法 |
|---|---|---|
| false-positive 月次発生確率 | < 1% | benchmark 模擬実行で確認 |
| `--cost-cap-extended` flag | 1h 一時引上、自動再有効化 | flag 受理 + 1h 後 detector 再有効化 |
| Owner immediate override hook | Slack quick-action button 30min SLA | Owner 模擬応答 timestamp |
| Anthropic console 二段防御 | console hard cap で物理停止 | mock Anthropic API 呼出 → console reject 確認 |
| audit log 完全記録 | append-only chain | mock auditStore.replay → SHA-256 verify |

#### §3.2.3 セル 3-2 (rate_spike × boundary)

| 観点 | 新規 PASS 基準 | 計測方法 |
|---|---|---|
| false-positive 月次発生確率 | < 1% | 70% 瞬間突破注入で確認 |
| debounce window 60s | 1 サイクル目 strip | debounce 注入で 1 サイクル目スルー確認 |
| sliding window rate calculation | smoothing 動作 | rate window cross-boundary で誤判定なし |
| jittering 統合 | request 間隔 std > 0 | jittering 注入で std 計測 |
| manual override 30min SLA | Slack quick-action button | Owner 模擬応答 timestamp |

#### §3.2.4 セル 3-3 (rate_spike × spike legit)

| 観点 | 新規 PASS 基準 | 計測方法 |
|---|---|---|
| false-positive 月次発生確率 | < 1% | benchmark 5min 持続 spike で確認 |
| `--rate-spike-extended` flag | 1h 一時引上、自動再有効化 hook | flag 受理 + 1h 後 detector 再有効化 |
| Owner immediate override hook | Slack quick-action button 30min SLA | Owner 模擬応答 timestamp |
| 自動再有効化 hook | benchmark 完了時 detector 再有効化 | benchmark 完了 timestamp + detector state 変更 |
| audit log 完全記録 | append-only chain | mock auditStore.replay → SHA-256 verify |

### §3.3 medium 9 セル + low 7 セル新規 PASS 基準のアプローチ

medium 9 セルは「false-positive 月次発生 ≤ 3 件」+ Round 9 設計レビュー版の partial 抑制策（confirmCount 2 + debounce / app_id tag / independent timer）で達成。low 7 セルは「false-positive 月次発生 0 件」+ confirmCount default 2 で完全抑制で達成。実機注入で確認。

---

## §4 再評価実行 timeline（3 回スケジュール）

### §4.1 3 回スケジュールの全体像

| 回 | 実施日時 | 対象 | 担当 |
|---|---|---|---|
| 第 1 回 | 5/8 18:00（議決-23 採択直後） | Round 9 案 9-A2 着地版 660 行で 20 セル全注入、high 4 セル設計レビュー判定再確認 | Review |
| 第 2 回 | 5/17 EOD（drill #2 当初実施日 or 5/8 朝前倒し時は 5/8 09:00） | multi-process interaction 5 セル（1-5 / 2-5 / 3-5 / 4-5 / + ng3 ×multi）実機検証 | Review + Dev |
| 第 3 回 | 5/30 EOD（Phase 1 W2 完遂） | Dev-β 6 残実装件着地後の最終 re-evaluation + matrix v2.0 起案 | Review + Dev |

### §4.2 第 1 回 5/8 18:00（議決-23 採択直後）

| 項目 | 内容 |
|---|---|
| 目的 | Dev-A2 660 行（41 cases）着地版で 20 セル設計レビュー判定再確認 |
| 期待結果 | high 4 / medium 9 / low 7 の Round 9 判定維持、Dev-β 残実装範囲再確認 |
| 所要時間 | 60 分（mock 注入 30 分 + 集計 + matrix v1.1 起案 30 分） |
| 完遂判定 | 20 セル全注入完遂 + matrix v1.1 起案（差分があれば update） |

### §4.3 第 2 回 5/17 EOD or 5/8 09:00（drill #2 連動）

| 項目 | 内容 |
|---|---|
| 目的 | multi-process interaction 5 セル（1-5 / 2-5 / 3-5 / 4-5 + ng3-5）実機検証 |
| 期待結果 | 5 セルすべて Sumi/Asagi 同居下で false-positive 月次発生 ≤ 3 件 |
| 所要時間 | drill #2 完遂直後 30 分（drill #2 内で実機検証完遂） |
| 完遂判定 | 5 セル全 PASS + drill #2 result v1 への統合 |

### §4.4 第 3 回 5/30 EOD（Phase 1 W2 完遂）

| 項目 | 内容 |
|---|---|
| 目的 | Dev-β 6 残実装件着地後の最終 re-evaluation + matrix v2.0 起案 |
| 期待結果 | high 4 / medium 9 / low 7 → high 0 / medium 7 / low 13（high 4 セル new PASS 基準達成で medium / low に降格） |
| 所要時間 | 240 分（mock 注入 90 分 + 集計 60 分 + matrix v2.0 起案 90 分） |
| 完遂判定 | matrix v2.0 起案 + 議決-26 採択 5 軸「Phase 1 W2 tos_monitor hooks 完遂」軸の達成判定 |

### §4.5 timeline 想定確度

| 回 | 完遂確度 | リスク |
|---|---|---|
| 第 1 回 5/8 18:00 | 95% | 議決-23 採択結果次第（採択遅延時は 5/9 EOD 持越） |
| 第 2 回 drill #2 連動 | 92% | drill #2 自体の実施可否（5/8 朝前倒し or 5/17 当初） |
| 第 3 回 5/30 EOD | 85% | Dev-β 6 残実装件すべて W1 内完遂見込み（W2 持越時は 6/1 期限延長） |

---

## §5 matrix v2.0 起案の構造

### §5.1 matrix v2.0 セクション構成

| § | 題目 | Round 9 v1.0 からの差分 |
|---|---|---|
| §1 | 4 detector の仕様確認（Dev-A2 着地版） | 660 行実装版に更新 |
| §2 | 5 シナリオの定義 | 維持 |
| §3 | 20 セル false-positive matrix v2.0 | 実機注入結果反映、high 4 セル降格 |
| §4-7 | 各 detector × シナリオ詳細 | 実機計測値追加（false-positive 月次発生件数） |
| §8 | high 4 セル new PASS 基準達成判定 | **新規追加** — Dev-β 着地の動作確認 |
| §9 | DEC 整合性確認 | 維持 |
| §10 | Round 11 引継 TODO | 完遂、Round 12+ への引継なし見込み |
| §11 | 結論 + Review 部門 sign-off | 採択推奨度高度化（強い推奨 → 極めて強い推奨） |

### §5.2 matrix v2.0 期待値

| 観点 | Round 9 v1.0 | matrix v2.0 期待値 |
|---|---|---|
| high 確率セル | 4 / 20 | **0 / 20**（Dev-β 着地で全降格） |
| medium 確率セル | 9 / 20 | 7 / 20（high 4 → medium に降格、ただし 6 件は medium → low に降格で総数減） |
| low 確率セル | 7 / 20 | **13 / 20**（多数のセルで完全抑制達成） |
| confirmCount 抑制可 | low 7 セル | low 13 セル |
| manual override 必要 | high 4 セル | medium 0 セル（high 4 セルが low に降格すれば不要） |

### §5.3 matrix v2.0 起案期限と採択

- 起案: 5/30 EOD（Phase 1 W2 完遂時）
- 採択: 6/2 W3 月曜日 検収会議（Owner sign-off）
- 議決-26 採択 5 軸「Phase 1 W2 tos_monitor hooks 完遂」軸: matrix v2.0 採択で軸 PASS 判定確定

---

## §6 議決-26 採択 5 軸への寄与判定

### §6.1 5 軸現在値（Round 10 開始時点）と re-eval 寄与

| 議決-26 採択 5 軸 | 現在値 | re-eval 寄与 |
|---|---|---|
| 必須 50 ≥ 95% | 60% → 議決-5 採択で 86% | +5pt（matrix v2.0 採択で G-V2-06 / G-V2-08 / NG-3 系コントロール完遂判定） |
| BAN 防御演習 PASS | drill #1 dry 5/5 PASS | 間接寄与（drill #2 実機検証で multi-process 5 セル確証） |
| Phase 1 着手 5/26 Conditional Go ≥ 95% | 93% | +2pt（Phase 1 W1 着手 + W2 完遂見込みで 95%） |
| 議決-7 drill #3 5/29 採択ライン | drill #1 dry 5/5 PASS で +3pt | 間接寄与 |
| Phase 1 W2 tos_monitor hooks 完遂 | 85% | **+5pt（matrix v2.0 採択で 90%）** |

### §6.2 5 軸全 PASS 見込み判定

re-eval 完遂時、5 軸のうち 5/5 軸が PASS 見込み:

| 軸 | PASS 見込み | 達成見込み時期 |
|---|---|---|
| 必須 50 ≥ 95% | Yes | 5/30（議決-5 採択 + W2 完遂） |
| BAN 防御演習 PASS | Yes | 5/8 朝 or 5/17（drill #2 完遂） |
| Phase 1 Go ≥ 95% | Yes | 5/26（着手承認） |
| 議決-7 drill #3 採択ライン | Yes | 5/29（drill #3 実施） |
| W2 tos_monitor hooks 完遂 | **Yes**（re-eval 完遂後） | 5/30（matrix v2.0 採択） |

**議決-26 採択推奨度判定**: 5/5 軸 PASS 見込みで「**極めて強い推奨で無条件採択**」を建議可能。

---

## §7 Round 11 引継 TODO + Owner 観察ポイント

### §7.1 Round 11 引継 TODO 3 件

| # | TODO | 担当 | 期限 | 完遂条件 |
|---|---|---|---|---|
| 1 | 第 1 回 re-eval（5/8 18:00）実施 | Review | 5/8 18:00 | matrix v1.1 起案 + 20 セル設計レビュー判定再確認 |
| 2 | Dev-β 6 残実装件 W1 並列着手 | Dev | 5/19 着手 - 5/25 EOD 完遂 | 6 件すべて commit + テスト緑化 |
| 3 | matrix v2.0 起案準備（5/30 EOD 期限） | Review | 5/30 EOD | matrix v2.0 + 議決-26 軸 5/5 達成判定 |

### §7.2 Owner 観察ポイント prep（議決-26 採択時、3 箇所）

| 観察ポイント | 期待挙動 | Owner 判断 |
|---|---|---|
| 1. high 4 セル全降格（high 0 件達成） | Dev-β 6 残実装件着地で達成 | high 0 / medium 7 / low 13 で ◎ |
| 2. manual override 30min SLA 動作 | high 4 セルすべてで Slack quick-action button 動作 | Owner 模擬応答 30min SLA 内達成で ◎ |
| 3. Phase 1 W2 tos_monitor hooks 完遂 | matrix v2.0 採択で議決-26 軸 PASS 判定 | 5/30 EOD 採択で ◎ |

### §7.3 確度押上推定

| 観点 | Round 9 完遂時 | Round 10 完遂時（本書） | re-eval 完遂時 | デルタ |
|---|---|---|---|---|
| Phase 1 W2 tos_monitor hooks 完遂確度 | 85% | 85% | **90%** | +5pt |
| Phase 1 着手 5/26 Conditional Go 確度 | 93% | 93% | **95%** | +2pt |
| 議決-26 採択推奨度 | 強い推奨 | 強い推奨 | **極めて強い推奨** | +1 段階 |
| 5/22 朝公開前倒し（DEC-019-056）確度 | 81% | 81% | **84%** | +3pt |

---

## §8 結論 + Review 部門 sign-off

### §8.1 結論

Round 9 偽陽性 matrix v1.0（4×5 = 20 セル、high 4 / medium 9 / low 7）の Dev-β 着地後 re-evaluation 設計を起案。再評価方式は 4 段階フロー（Dev-β 着地確認 → 20 セル実機注入 → high 4 セル新規 PASS 基準達成判定 → matrix v2.0 起案）、各セル新規 PASS 基準は high 4 セルすべてで「false-positive 月次発生 < 1%」+「manual override 30min SLA」+「audit log 完全記録」。再評価 timeline は 3 回（5/8 18:00 / drill #2 連動 / 5/30 EOD）。matrix v2.0 期待値は high 0 / medium 7 / low 13、議決-26 採択 5 軸「Phase 1 W2 tos_monitor hooks 完遂」軸に直接寄与（+5pt）。read-only 厳守、コード一切無改変。

### §8.2 Review 部門 sign-off

| 観点 | sign-off |
|---|---|
| Dev-β 残実装範囲（6 件）の特定 | sign-off |
| 4 段階フロー設計 | sign-off |
| 20 セル新規 PASS 基準（high 4 / medium 9 / low 7） | sign-off |
| 再評価 timeline 3 回スケジュール | sign-off |
| matrix v2.0 セクション構成 | sign-off |
| 議決-26 採択 5 軸寄与判定 | sign-off |
| Round 11 引継 TODO 3 件 | sign-off |

### §8.3 関連 DEC / リスク参照

- **DEC-019-008**: NG-3 暫定値 — Dev-β 残実装の根拠、case A/B/C plan override 統合
- **DEC-019-050**: API cap $30 — cost_cap detector の Anthropic console 二段防御根拠
- **DEC-019-051**: subscription 主軸 95:5 — cost_cap detector subscription 駆動 default 根拠
- **DEC-019-055**: Round 8 完遂 — 本前倒しの起点
- **R-019-06**: BAN 30-60% / 12 ヶ月 — re-eval 完遂で mitigation +10%（high 4 セル降格効果）
- **R-019-09**: NG-3 24/7 監視 — re-eval 完遂で +5%
- **R-019-19**: API $30 Hard cap 突破 — Anthropic console 二段防御確立で +5%
- **R-019-21**: subscription quota 突破時 API fallback 急速消費 — extended flag 動作確認で +5%

### §8.4 次回更新

- 5/8 18:00（第 1 回 re-eval 結果反映 → matrix v1.1 起案）
- 5/17 EOD or 5/8 09:00（drill #2 連動 multi-process interaction 5 セル実機検証反映）
- 5/30 EOD（第 3 回 re-eval 結果反映 → matrix v2.0 起案）

---

**v1 起案**: 2026-05-04 W0-Week1 深夜 Review 部門 R10 Review-δ / 案 C ハイブリッド暫定運用前提
**正式採択**: 2026-05-08 W0-Week1 検収会議（議決-23 連動採択、Owner sign-off 予定）
**v1 確定差分**: re-eval 4 段階フロー + 20 セル新規 PASS 基準 + 3 回スケジュール + matrix v2.0 起案構造 + 議決-26 採択 5 軸寄与判定
