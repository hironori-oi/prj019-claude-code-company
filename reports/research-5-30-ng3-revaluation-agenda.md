最終更新: 2026-05-04 / 起案: Research 部門 / 議決対象日: 2026-05-30 W2 終了週次 review

# PRJ-019 5/30 W2 終了 NG-3 再評価議題詳細設計

- 案件: PRJ-019「Clawbridge」 — Open Claw を Owner-in-the-loop オーナーとする AI 組織ハーネス基盤
- 文書種別: 議題設計書 (5/30 W2 終了週次 review 用)
- 関連 DEC: DEC-019-008 (NG-3 暫定値 12h/$1,000) / DEC-019-031 (NG-3 上方修正候補議論) / DEC-019-050 (API spend cap $30/月確定) / DEC-019-051 (subscription plan 主軸運用方針 Phase 1 正式採用) / DEC-019-016 ($300 追加発生上限、余裕率 90%)
- 上位レポート:
  - `projects/PRJ-019/reports/research-subscription-mainline-validation.md` (本書親、§7.4 で 5/30 議題追加推奨)
  - `projects/PRJ-019/reports/research-pd-revised-validation.md` (P-D 改 維持結論)
  - `projects/PRJ-019/reports/research-subscription-baseline-measurement-design.md` (本書姉妹、ベースライン測定設計)
  - `projects/PRJ-019/reports/ceo-owner-consolidated-v7.md` (CEO 統合報告 v12)
- 結論: NG-3 確定値判定 = **案 C 細分化推奨** (subscription 経路 12h/$1,000 維持 + API 経路 12h/$300 補助別建て)、ただし W0-W2 実消費ベースライン次第で案 A or 案 B も合理選択肢
- 議決所要時間: **45 分** (説明 15 分 + 質疑 15 分 + 採決 15 分)、5/30 W2 終了週次 review に組込

---

## 0. エグゼクティブサマリー (300 字)

DEC-019-008 で暫定設定された NG-3 (24/7 連続自律稼働制約) の暫定値 **12h/日 + $1,000/月相当** を、5/30 W2 終了時に確定値へ転換する議決設計を提示する。本議題は ① W0-Week1〜W2 の subscription quota + API key 実消費ベースラインを根拠データに、② 案 A (12h/$1,000 維持) / 案 B (12h/$1,200 上方修正) / 案 C (12h/$1,000 subscription + 12h/$300 API 細分化) の 3 案を比較し、③ Phase 2 着手起案 (8/1 想定) への影響を踏まえて確定値を採決する。Research 推奨は **案 C 細分化**: DEC-019-050 ($30 cap) + DEC-019-051 (subscription 95% / API 5% 流量比) の二経路構造を NG-3 にも反映し、subscription 経路は $1,000 維持 / API 経路は $300 を補助上限として独立計上する。R-019-09 (NG-3 24/7) は Review §3 で既に 12 赤→6 緑へ再評価済、確定値設定により更に深い緑化を見込む。議決所要 45 分、採決方法は CEO 提案 → Owner 即決 (HITL 不要、内部運用基準のため)。

---

## §1 議決の背景

### §1.1 NG-3 暫定値 (DEC-019-008、2026-05-02 制定)

DEC-019-008 で以下が暫定設定された:

- ① **1 日連続稼働時間上限**: 12 h/日 (深夜 0:00〜12:00 JST 帯は完全停止)
- ② **API 換算費用上限**: $1,000/月相当を超えた時点で自動停止 ($800 で warn / $1,000 で全停止、レビュー G-V2-09 と整合)
- ③ **Phase 1 W2 終了時 (2026-05-30) にオーナー再確認** ← 本議題のトリガー
- ④ 業務時間帯ウィンドウ G-V2-07 (9:00〜23:00 JST) と組み合わせて二重ガード

### §1.2 直近の関連 DEC 群との連動

| DEC | 内容 | NG-3 への影響 |
|---|---|---|
| DEC-019-016 | 月次予算 $300 = 「追加発生分の上限」(既契約除外) | NG-3 ② は API 換算 $1,000 で別軸、cap $300 内に収まる前提 |
| DEC-019-031 | NG-3 上方修正候補 ($1,200) を別判断 | 案 B の根拠 |
| DEC-019-050 | API spend cap = $30/月 Hard cap 確定 | NG-3 ② API 換算上限と独立軸、案 C 細分化の根拠 |
| DEC-019-051 | subscription plan 主軸運用方針 Phase 1 正式採用 | 流量比 95:5、NG-3 ② の試算ロジックを subscription + API 両方で集計済 (cost_check skill) |

### §1.3 議決のスコープと境界

- **In scope**: NG-3 暫定値 12h/$1,000 → 確定値への転換、3 案からの選択
- **Out of scope**:
  - DEC-019-031 の上方修正候補議論は本議題と独立 (上方修正可否は別議題)
  - Phase 2 着手判定 (8/1 想定) は別議題、本議題はあくまで Phase 1 確定値設定
  - HITL 第 X 種新設提案 (subscription_to_api_fallback) は別議題化
- **判定責任者**: CEO 提案 → Owner 即決 (内部運用基準のため HITL 不要)

---

## §2 W0-Week1〜W2 (5/4-5/30) の実消費ベースライン

### §2.1 ベースライン測定対象 (詳細は姉妹レポート参照)

`projects/PRJ-019/reports/research-subscription-baseline-measurement-design.md` で詳細設計済。本議題で参照する指標:

| # | 指標 | 計測対象 | 集計頻度 |
|---|---|---|---|
| 1 | subprocess spawn 回数 / 日 | subscription 経路 (Claude Max $200) | daily |
| 2 | turn 数 / 日 | subscription 経路 | daily |
| 3 | prompt cache hit rate | subscription 経路 + API 経路両方 | daily |
| 4 | weekly cap 充当率 (%) | subscription 経路 (Anthropic Console weekly cap) | weekly |
| 5 | API key 経路実消費 (USD) | API 経路 ($30 cap) | daily |
| 6 | 稼働時間 (h/日) | NG-3 ① 12h 制約検証 | daily |
| 7 | エラー率 (rate limit / timeout / context overflow) | 両経路統合 | daily |

### §2.2 5/30 までに収集される根拠データ (期待値)

- **subscription 経路実消費**: 5/4-5/30 の 27 日間 × subprocess spawn 回数 × turn 数 × 1 turn 平均換算 (Anthropic 内部試算ベース、cap なし)
  - W0-Week1〜2 (5/4-5/16) = ブートストラップ期間、subprocess spawn 少 (推定 5-15 / 日)
  - W2 (5/19-5/30) = Phase 1 W1 着手後、subprocess spawn 増 (推定 30-90 / 日)
  - 27 日間累計 turn 数 × 1 turn 平均 USD 換算 = subscription 経路の API 換算 $X/月相当
- **API key 経路実消費**: 27 日間累計 (Anthropic Console spend / cost_ledger 集計)
  - 期待値: 議決-24 の 5 施策実施後で月次 $11-15、W0-W2 の 27 日間で $10-13 着地 (cap $30 内 buffer 50%以上)
- **NG-3 ① 稼働時間**: 12h/日 制約への抵触頻度 (期間中の上限到達日数)
- **NG-3 ② 換算費用**: 月次 $1,000 換算への接近度 (subscription + API 統合試算)

### §2.3 ベースライン測定の不確実性

- W0-Week1 (5/4-5/8) は scaffold 段階で subprocess spawn 数が低位安定 → Phase 1 W1 着手 (5/19) 以降の本格稼働期間 11 日間 (5/19-5/30) のデータが最も重要
- 27 日間の前半 13 日間 + 後半 14 日間で消費パターンが大きく異なる → trend 推定で Phase 2 拡張 (3 倍規模) 予測モデル構築 (詳細は姉妹レポート §6)
- 不確実性ラベル: 推測 (5/30 議決時点でのデータ蓄積期間 27 日は短く、Phase 2 予測には外挿が必要)

---

## §3 NG-3 確定値の判定軸 (3 案)

### §3.1 案 A: 12h/$1,000 維持 (暫定値そのまま)

| 項目 | 内容 |
|---|---|
| ① 稼働時間上限 | **12 h/日** (深夜 0:00〜12:00 JST 完全停止、暫定値維持) |
| ② API 換算費用上限 | **$1,000/月相当** (subscription + API 統合試算、暫定値維持) |
| ③ 集計ロジック | cost_check skill が両経路統合試算 (既存実装) |
| ④ 警告閾値 | $800 (warn) / $1,000 (auto stop) |

**採用条件**:
- W0-W2 実消費ベースラインが $700-$900/月相当の範囲に収束 (buffer 10-30%)
- subscription 経路の weekly cap 充当率が常時 70% 以下で推移
- 案 B 上方修正 / 案 C 細分化を選ぶ強い根拠 (data) が揃わない場合のデフォルト案

### §3.2 案 B: 上方修正 12h/$1,200 (DEC-019-016 余裕 90% を活用)

| 項目 | 内容 |
|---|---|
| ① 稼働時間上限 | **12 h/日** (案 A と同じ) |
| ② API 換算費用上限 | **$1,200/月相当** ($1,000 → $1,200 へ 20% 上方修正) |
| ③ 集計ロジック | 案 A と同じ |
| ④ 警告閾値 | $960 (warn) / $1,200 (auto stop) |

**採用条件**:
- W0-W2 実消費ベースラインが $900-$1,100/月相当 (暫定値ギリギリの動作実績)
- DEC-019-016 ($300 追加発生上限) の余裕率 90% を NG-3 へ転用する妥当性が示せる
- DEC-019-031 (NG-3 上方修正候補) との連携で別議題化される可能性あり (本議題から外される場合あり)

### §3.3 案 C: 細分化 12h/$1,000 (subscription 経路) + 12h/$300 (API 経路) ★Research 推奨

| 項目 | 内容 |
|---|---|
| ① 稼働時間上限 | **12 h/日** (案 A と同じ、両経路統合) |
| ②-a subscription 経路上限 | **$1,000/月相当** (subscription quota の API 換算試算) |
| ② -b API 経路上限 | **$300/月相当** ($30 cap 物理上限の 10 倍を換算上限に設定 = buffer) |
| ③ 集計ロジック | cost_check skill を 2 経路独立試算へ拡張 (実装増分軽量) |
| ④ 警告閾値 | subscription: $800 (warn) / $1,000 (auto stop) + API: $24 (warn = Anthropic Console Soft) / $30 (auto stop = Anthropic Console Hard) |

**採用条件**:
- DEC-019-051 で確定済の流量比 95:5 を NG-3 にも反映する一貫性
- subscription / API 両経路の実消費ベースライン取得済 (姉妹レポートの実装が前提)
- subscription cap 突破 → API fallback 急速消費 (R-019-22) の検出が独立試算で精緻化される

---

## §4 各案の Pros/Cons + 採択推奨

### §4.1 比較表

| 軸 | 案 A (12h/$1,000 維持) | 案 B (12h/$1,200 上方修正) | 案 C (細分化) ★Research 推奨 |
|---|---|---|---|
| 実装増分 | ゼロ (既存ロジック維持) | 閾値値変更のみ (軽微) | cost_check skill 2 経路独立試算へ拡張 (中) |
| ベースライン適合性 | 暫定値想定に合致 | 上振れ消費を許容 | DEC-019-050/051 構造に合致 |
| Phase 2 拡張時の柔軟性 | 一律スケーリング (3 倍 → $3,000 単純試算) | 上方修正済 → 更なる修正余地 | 経路別独立スケーリング (subscription 3 倍 / API は別議論) |
| R-019-09 緑化深度 | 6 (緑、暫定値確定で 5 へ深化見込) | 6 (緑、ただし上方修正で警戒継続) | 4-5 (緑、二重ガードで最も深い緑化) |
| Risk 監視粒度 | 統合試算のみ | 統合試算のみ | 経路別独立、subscription cap 突破を即検出 |
| 議決容易性 | 高 (シンプル) | 中 (上方修正の合意要) | 中 (細分化説明 15 分要) |

### §4.2 Pros/Cons 詳細

**案 A (12h/$1,000 維持)**:
- Pros: 議決容易、実装ゼロ、暫定値の継続で運用学習コスト最小
- Cons: 実消費が大きく異なる経路を統合試算する一貫性欠如、Phase 2 拡張時に再議論必要

**案 B (12h/$1,200 上方修正)**:
- Pros: 上振れ消費許容、DEC-019-016 余裕率を有効活用
- Cons: 暫定値より緩めるリスク (NG-3 の制約意義が薄まる)、DEC-019-031 と重複議論になる可能性

**案 C (細分化、Research 推奨)**:
- Pros: DEC-019-050/051 構造との完全整合、R-019-22 (subscription → API fallback) の検出精度向上、Phase 2 拡張時の経路別議論が容易
- Cons: cost_check skill 拡張実装 (Dev 工数 0.5-1 日)、議決説明 15 分要 (シンプル案より時間増)

### §4.3 Research 採択推奨: 案 C 細分化

**推奨根拠 (5 点)**:
1. **構造整合性**: DEC-019-050 (cap $30) + DEC-019-051 (流量比 95:5) を NG-3 にも反映、組織内決裁の一貫性
2. **R-019-22 検出精度**: subscription cap 突破 → API fallback 急速消費を独立試算で即検出可能
3. **R-019-09 深化緑化**: 二重ガード (subscription $1,000 + API $300) で最も深い緑化を実現
4. **Phase 2 拡張柔軟性**: subscription 経路は単純 3 倍スケーリング、API 経路は別議論 (DEC で月次 cap $30→$100 等を別判断)
5. **実装コスト合理**: cost_check skill 拡張は 0.5-1 日で実装可能、Phase 2 までに統合試算追加機能を切替可能

**条件付き案 A への分岐ルール**:
- W0-W2 実消費ベースラインで subscription 経路の API 換算が $200 未満 + API 経路実消費が $10 未満 → 案 A で十分 (細分化のメリット薄)
- 上記条件に該当しない場合は案 C を推奨

---

## §5 議決後のリスク

### §5.1 R-019-09 (NG-3 24/7) の格付け推移

| 段階 | 格付け | スコア | 根拠 |
|---|---|---|---|
| DEC-019-008 暫定値設定時 (5/2) | 赤 | 12 | 24/7 自律稼働の制約未明確化 |
| DEC-019-050 + 051 採択後 (5/4) | 緑 | 6 | Review §3 補助層 (cap 物理停止) + subscription 主軸構造で監視優先度緩和 |
| **本議題確定値 (5/30 議決後)** | **緑** | **4-5 (案 C 採択時) / 5 (案 A 採択時) / 6 (案 B 採択時)** | 確定値設定 + 経路別独立試算 (案 C) で更に深化 |
| Phase 2 着手判定時 (8/1 想定) | 別議題で再評価 | - | Phase 2 拡張規模 (3 倍) で再起算 |

### §5.2 議決後の警戒継続事項

- **R-019-22 (subscription cap 突破 → API fallback 急速消費)**: 案 C 採択でも警戒継続、HITL 第 X 種 `subscription_to_api_fallback` 新設提案は別議題化
- **R-019-23 (旧、現 R-019-22 へ繰上、mock/template 遅延で API 消費膨張)**: 議決-24 5 施策の Dev W0-Week2 完遂 (5/22) が前提
- **DEC-019-031 (NG-3 上方修正候補議論)**: 本議題と独立、別 DEC で判断
- **Phase 2 着手判定 (8/1 想定)**: 本議題確定値を Phase 2 計画書起案時に再評価、3 倍規模で別 DEC 起票

### §5.3 議決後の連動アクション

| # | 種別 | 内容 | 期限 | 担当 |
|---|---|---|---|---|
| 1 | Dev タスク | 案 C 採択時 cost_check skill 拡張 (2 経路独立試算) | 6/6 (Phase 1 W3 末) | Dev |
| 2 | Dev タスク | dashboard 表示更新 (subscription / API 経路別 KPI) | 6/13 (Phase 1 完了レビュー) | Dev |
| 3 | Review タスク | NG-3 確定値の SOP 反映 + 警戒運用記述 | 6/13 | Review |
| 4 | 秘書タスク | DEC-019-XXX (NG-3 確定値) 起票 + Risk Register 更新 | 5/30 議決当日 | 秘書 |
| 5 | Research フォロー | Phase 2 着手判定時 (8/1) NG-3 再評価インプット準備 | 7/25 | Research |

---

## §6 Phase 2 移行判断軸への影響

### §6.1 Phase 2 起案 (2026-08-01 想定) との連動

DEC-019-051 で「Phase 2 拡張時の留意」として明記された内容との連動:
- 実装規模 3 倍想定で API 用途拡大 (HITL +200% / ナレッジ KE-04 +500% / Pen Test 自動化)
- 別 DEC で月次 cap $30→$100 等の増額を Phase 2 計画書起案時に議決

### §6.2 案別 Phase 2 移行判断への影響

| 案 | Phase 2 移行時の再議論コスト | 拡張時の根拠データ精度 |
|---|---|---|
| 案 A (12h/$1,000 維持) | 中 (一律 3 倍 = $3,000 単純試算、ただし subscription / API 比率検証必要) | 統合試算のみで粒度低 |
| 案 B (12h/$1,200 上方修正) | 中 (上方修正幅の継続性議論要) | 統合試算のみで粒度低 |
| 案 C (細分化) | **低** (経路別独立スケーリング、subscription 3 倍 / API 別議論で分離) | **経路別 KPI で粒度高** |

### §6.3 Phase 2 計画書起案 8/1 への inputs

- 5/30 NG-3 確定値 (本議題)
- 6/13 Phase 1 完了レビュー実消費ベースライン (W4 末データ)
- 7/X 案件完了 KPT で蓄積されたナレッジ (Phase 1 期間中の NG-3 抵触履歴)
- 7/25 Research フォローレポート (Phase 2 拡張規模試算 + 別 DEC 起票案)

---

## §7 議決所要時間 + 採決方法

### §7.1 5/30 W2 終了週次 review への組込

- **議決枠**: 45 分 (W2 review 全体の中で第 3 議題として配置想定)
- **構成**:
  - 説明 15 分: §2 ベースライン (5 分) + §3 3 案 (5 分) + §4 採択推奨 (5 分)
  - 質疑 15 分: Owner からの確認質問対応 + Review / Dev / PM からの実装影響確認
  - 採決 15 分: CEO 提案 → Owner 即決 → 秘書議事録記載 → Risk Register 更新指示

### §7.2 採決方法

- **判定責任者**: CEO 提案 → Owner 即決
- **HITL 種別**: 不要 (内部運用基準のため、Owner-in-the-loop の HITL 11 種に該当せず)
- **議決成立条件**: Owner 採決 1 回で確定、HITL タイムアウト不要
- **議事録記載**: 秘書部門が DEC-019-XXX として正式起票 (議決当日)

### §7.3 議決前の必須インプット

| # | 必須インプット | 提出担当 | 期限 |
|---|---|---|---|
| 1 | W0-W2 実消費ベースライン報告 (姉妹レポート設計に基づく実データ) | Dev (収集) + Research (分析) | 5/29 18:00 JST |
| 2 | Phase 2 拡張規模試算 (3 倍想定の予測モデル) | Research | 5/29 18:00 JST |
| 3 | Risk Register v3.1 → v3.2 案 (案 C 採択時の R-019-09 緑化更新) | 秘書 | 5/29 18:00 JST |
| 4 | cost_check skill 拡張実装見積 (案 C 採択時の Dev 工数) | Dev | 5/29 18:00 JST |

### §7.4 議決後の即時アクション (5/30 当日内)

1. 秘書: DEC-019-XXX (NG-3 確定値) 起票 + Risk Register 更新
2. Dev: 案 C 採択時 cost_check skill 拡張タスク化 (Phase 1 W3 末 = 6/6 期限)
3. CEO: Owner 連結報告 v13 にて本議決を Owner へ summary 報告
4. Research: Phase 2 着手判定 (8/1) 用フォロー計画策定

---

## §8 関連レポート相互参照

- `projects/PRJ-019/reports/research-subscription-mainline-validation.md` (本書親、§7.4 で 5/30 議題追加推奨)
- `projects/PRJ-019/reports/research-subscription-baseline-measurement-design.md` (本書姉妹、ベースライン測定設計)
- `projects/PRJ-019/reports/research-pd-revised-validation.md` (P-D 改 維持結論)
- `projects/PRJ-019/reports/research-changelog-monitoring-runbook.md` (4 系統監視 Runbook、cap 突破検知連動)
- `projects/PRJ-019/reports/review-30usd-cap-impact-assessment.md` (Review 影響評価、R-019-09 12 赤 → 6 緑化根拠)
- `projects/PRJ-019/reports/pm-budget-v2-30usd-api-cap.md` (PM 月次予算 v2、余裕率 90% 根拠)
- `projects/PRJ-019/reports/dev-budget-guard-30usd-v1.md` (Dev 二重防御実装、cost_check skill ベース)
- `projects/PRJ-019/decisions.md` DEC-019-008 / DEC-019-016 / DEC-019-031 / DEC-019-050 / DEC-019-051

---

## フッタ

- 文書: `projects/PRJ-019/reports/research-5-30-ng3-revaluation-agenda.md`
- 版: v1.0 (2026-05-04)
- 次回レビュー: 2026-05-29 18:00 JST (5/30 議決前最終確認) / 議決日 2026-05-30 W2 終了週次 review
- 作成: Research 部門 / 検収予定: CEO + Owner (5/30 議決時)
- 改版履歴:
  - v1.0 2026-05-04: 初版 (Owner 「CEO 推奨案で進めて下さい」明示承認受領後、議決-24 連動議題として起案)
