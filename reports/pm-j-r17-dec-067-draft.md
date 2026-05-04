# PM-J Round 17 起案報告書 — DEC-019-067 draft

- **担当**: PM-J（PM 部門 / Round 17 第 1 波）
- **起案日**: 2026-05-05
- **対象議決**: DEC-019-067（status: draft）
- **レビュー期限**: 2026-05-26（DEC-019-066 と同期レビュー）
- **関連議決**: DEC-019-058 / -062 / -064 / -065 / -066

---

## 1. 起案概要

DEC-019-067 = **Round 17 9 並列構成 + 17 日 path W1 kickoff 同期 + stagger 圧縮 SOP 連続 3 round 適用**。
Round 16 完遂着地（9 並列実績）と Owner formal「Round 17 9 並列 GO」directive を受け、Round 17 を 9 並列で起動し、stagger 圧縮 SOP（DEC-019-062）を R15 / R16 / R17 連続 3 round 適用、17 日 path W1 kickoff（5/9）を Round 17 と同期させる構成案件。

加速 5 軸 case-B（軸-E に Knowledge INDEX + Runbook 物理化追加）を本格運用化、軸-E 到達指標 E-1〜E-4 を Round 17 で継続評価し、5/26 formal レビューで DEC-019-065 + 066 + 067 の 3 件統合採択を目指す。

---

## 2. Round 17 構成（9 並列 = 第 1 波 4 + 第 2 波 5）

### 第 1 波（T+0〜T+50、4 部署）
- **Knowledge-L**: INDEX v5→v6 ロードマップ + 5 月末 60 entries 着地評価
- **Dev-T**: Phase 1 W1 5/9 kickoff 連動 / 17 日 path 整合検証
- **Dev-U**: drill #2 R17 連続検証 + KillToken regress 監視
- **PM-J**（本起案）: Round 17 進捗管理 + 5/19 + 5/26 統合レビュー連携

### 第 2 波（T+0〜T+150、5 部署）
- **Dev-V**: 5/22 push 評価第 2 巡 / 必要稼働率 19.8-23.4% 再検証
- **Dev-W**: heartbeat hardening Round 16 着地差分反映
- **Review-I**: Round 17 mid-check + 50 ctrl 95% 加速
- **Marketing-K**: 公開 30 日運用評価 + 60 day plan 第 2 版
- **Sec-L**: Sec hardening 4 項目 R17 適合率検証 + DEC-019-066 数値整合

### Hard limit / 例外条件
- 全波完遂 hard limit: T+180（DEC-019-066 軸-② 準拠）
- 例外 3 件: Owner directive 緊急 / drill #2 連動 / API spike 検知（DEC-019-066 軸-② (a)(b)(c) 継承）

---

## 3. 採択 3 軸サマリ

1. **9 並列構成**: Round 16 実績準拠、第 1 波 4 + 第 2 波 5 で T+50 / T+150 適合率 80%+ 再現
2. **17 日 path W1 5/9 同期**: Phase 1 W1 着手 5/10 → 5/9 1 日前倒し case 検証兼用、failure 時 5/10 元計画復帰
3. **stagger 圧縮 SOP 連続 3 round 適用**: R15 / R16 / R17 累積データ取得 → 5/26 formal レビュー confirmed 切替判断

---

## 4. 代替案 + 採用根拠

| 案 | 内容 | 判定 |
|----|------|------|
| ① | 7 並列 conservative | 却下（Round 16 で 9 並列再現性確認済 → スループット低下不要） |
| ② | 11 並列 / Round 15 同等 | 却下（API spike risk + T+150 hard limit 超過リスク） |
| ③ | **9 並列 / Round 16 実績準拠** | **採用** |

**採用根拠 6 件**:
(a) Round 16 9 並列完遂実績 / (b) Owner formal「Round 17 9 並列 GO」directive / (c) 17 日 path 5/9 kickoff 同期で前倒し case 検証兼用 / (d) 連続 3 round データ厚み確保 / (e) API $0 維持整合 / (f) 軸-E 本格運用化機会

---

## 5. measurable success criteria

- (M-1) 第 1 波 4 部署 T+50 内 dispatch 完了
- (M-2) API 追加コスト = $0 維持
- (M-3) tests 影響 = 0（workspace 791 PASS baseline 維持）
- (M-4) DEC-019-062 SOP 適合率連続 3 round 累計 80%+
- (M-5) 17 日 path W1 5/9 kickoff 成立 / fallback / 未達
- (M-6) 軸-E 到達指標 E-1〜E-4 累積達成度（0/4〜4/4）

---

## 6. DEC-019-065 + 066 + 067 統合レビュー連携（5/19 中間 + 5/26 formal）

### 5/19 中間レビュー
- Round 16 完遂着地データ（DEC-019-065 / 066 measurable success criteria 達成度）+ Round 17 第 1 波 4 部署 dispatch 結果を CEO 統合報告で確認
- DEC-019-067 status: draft 維持判断、軸-E 到達指標 E-1〜E-4 第 1 巡評価
- Round 17 第 2 波（5/19 以降）配分微調整余地確認

### 5/26 formal レビュー（3 件同期採択想定）
- **DEC-019-065**（PM-I / Round 16 9 並列構成）: Round 16 実績で confirmed 切替判定
- **DEC-019-066**（Sec-K / Round 16 SOP formal 化 + Sec hardening 4 項目）: 連続 3 round（R16/R17/R18）SOP 適合率データ集計後 confirmed 切替判定
- **DEC-019-067**（PM-J / 本起案）: 連続 3 round R15/R16/R17 SOP 適合率 + 17 日 path 5/9 kickoff 検証結果 + 軸-E 到達指標累積達成度を統合判断
- 3 件統合採択 → Round 18 以降 Phase 1 W4 完遂（6/20 想定）まで運用 SOP 定着

---

## 7. リスクと対策

- **R1（中）**: 17 日 path 5/9 kickoff failure → fallback 5/10 復帰（DEC-019-064 SOP 例外条項）
- **R2（低）**: 連続 3 round 9 並列疲労蓄積 → Review-I mid-check + tests gate（DEC-019-066 軸-③(4)）
- **R3（低）**: 軸-E E-2 Runbook 4 件最小未達 → R18 追加配分で補完
- **R4（低）**: API spike 誤検知 → 平均 + 2σ 閾値（DEC-019-066 軸-③(1)）

---

## 8. 制約遵守

- API 消費: $0（PM-J は Read + Edit + Write のみ）
- 副作用: 0（decisions.md 追記 + 本報告書新規のみ、既存 DEC 改変禁止）
- 絵文字: 0 / tests 影響: 0（baseline 791 PASS 維持）
- 起案行数: 約 75 行（60-100 制約内）/ 報告書行数: 約 110 行（80-120 制約内）

---

## 9. フォローアップ案件（提案）

- DEC-019-068: 連続 3 round 80%+ 達成時の R18 以降 SOP confirmed 切替 + Phase 1 W4 完遂運用 SOP 定着
- DEC-019-069: 17 日 path W1 5/9 kickoff 成立時の Phase 1/2 全 timeline 1 日前倒し連鎖評価 + 6/19 公開 case 評価着手
- DEC-019-070: 軸-E 4/4 達成時の Knowledge INDEX v6→v7 + Runbook 物理化 PRJ-018 / PRJ-012 横展開ロードマップ

---

**起案者**: PM-J / **起案日**: 2026-05-05 / **次回更新**: Round 17 完遂着地時 + 5/19 中間レビュー時 + 5/26 formal レビュー時
