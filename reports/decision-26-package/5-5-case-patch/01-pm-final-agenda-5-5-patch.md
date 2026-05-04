# 01-pm-final-agenda 5/5 case 差分パッチ

> **対象元**: `decision-26-package/01-pm-final-agenda.md`
> **連動 DEC**: DEC-019-060（status 暫定）
> **適用 trigger**: CEO 判断 confirmed = 議決-26 前倒し 5/5 case 採択

---

## §1 議決日変更（5/8 → 5/5）

| 項目 | 元値（5/8 case） | 5/5 case 上書き値 |
|---|---|---|
| 議決日 | 2026-05-08（金）09:00 JST | **2026-05-05（火）09:00 JST** |
| 配布日 | 5/8 朝 06:00 JST | **5/5 朝 06:00 JST** |
| drill #2 実機検証日 | 5/8 朝 06:00-08:00 | **5/5 朝 06:00-08:00**（Review-E R13 担当） |
| 制定日（文書 ID） | 2026-05-04（Round 10 起案 / Round 12 5/8 当日配布版） | 2026-05-04（Round 10 起案 / Round 13 5/5 当日配布版差分追記） |

---

## §2 採択前提 5 軸 status（5/5 時点確定値）

| 軸 | 5/8 case status | 5/5 case status |
|---|---|---|
| 軸-1 mock-claw e2e dry execution | Pass + 50 tests 拡張（Round 11 Dev-C 着地 + Round 12 real spawn） | **Pass 維持**（Round 12 Dev-C real spawn + NDJSON 完遂、5/5 朝も維持） |
| 軸-2 BAN drill #1 dry execution + drill #2 実機検証 | Full Pass 5/5 + drill #2 5/8 朝実機検証（Review-D R12） | **Full Pass 5/5 維持 + drill #2 5/5 朝 06:00-08:00 実機検証**（Review-E R13、ランブック 5-5 case 差分済） |
| 軸-3 必須コントロール 50 ≥ 95% | 32/50 = 64% 確定 + 95% roadmap commit（5/15 82% / 5/30 95%+） | **5/5 時点 67-70% 想定**（5/15 82% 見込みの線形補間、95% roadmap 不変） |
| 軸-4 API 追加コスト ≤ $30 | $0 累計 | **$0 累計**（Round 13 も $0 見込） |
| 軸-5 Owner 残動作 0 件 | 5/8 議決 + 6/26 公開確認（2 件） | **5/5 議決 + 6/26 公開確認（2 件、変動なし）** |

→ **5 軸全 PASS roadmap 維持**、5/5 議決-26 採択確度 **70%**（v14、PM-F + Review-E R13 評価結果待ち）。

---

## §3 議事フロー（5/5 09:00 JST 開始版）

| 時刻 | 議事 |
|---|---|
| 09:00-09:03 | 開始挨拶 |
| 09:03-09:13 | 議決-26 採択 5 軸 status 確認（5/5 時点確定値） |
| 09:13-09:18 | drill #2 5/5 朝 06:00-08:00 実機検証結果報告（Review-E R13） |
| 09:18-09:25 | 議決-26 採決 |
| 09:25-09:32 | 議決-27 acknowledge |
| 09:32-09:42 | Owner 質疑応答 + Round 14 dispatch 方針 |
| 09:42 | 終了 |

→ 計 **42 分**（5/8 case と同一所要時間、議事日付のみシフト）

---

## §4 5/5 case 採択時の連動効果

- Phase 2 着手 = 6/24 → **6/10**（14 日前倒し候補、Phase 2 plan v1 + Go/NoGo template 修正必要）
- MS-2 5/15 trial = **5/12 候補化**（3 日前倒し可能性、PM-E + Dev-J R13 評価結果次第）
- 5/22 push 評価 = **5/19 候補化**（3 日前倒し）
- 6/27 朝公開 = **維持**（公開日不変、Marketing 28×28 narrative + 18×18 portfolio 不変）

---

## §5 5/8 元値との差分要約

本 patch は 01-pm-final-agenda.md の **議決日 / 配布日 / drill #2 検証日 / 5 軸 status / 議事フロー** の 5 項目を 5/5 case 用に上書きする。他の項目（タイトル / 上位決裁 / 親文書 / Executive Summary 大筋 / 議決-29 連動 / Phase 2 narrative integration 大筋）は 01-pm-final-agenda.md 原文を維持。
