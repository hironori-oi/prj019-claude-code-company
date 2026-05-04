# 議決-26 配布資料 5/5 case 差分パッチ INDEX

> **起票日**: 2026-05-04 深夜終盤（Secretary-H Round 13 dispatch、DEC-019-060 起票直後）
> **起票担当**: Secretary-H（PRJ-019 Round 13 並列 dispatch、独立 Agent、DEC-019-025 SOP 完全順守）
> **配布対象**: Owner（5/5 09:00 JST 議決-26 前倒し case 採決時、当日 45-50 分閲覧 + 採決）
> **status**: **5/5 朝 06:00 JST 配布 ready 状態**（CEO 判断 confirmed 後 30 分以内に切替可能）
> **連動 DEC**: DEC-019-060（議決-26 前倒し可否暫定採択、status 暫定）

---

## §0 概要

5/8 元計画 case を 5/5 09:00 JST に 3 日前倒しする case 用差分パッチ。既存 13 件配布資料の日付依存記述を上書きする差分のみを格納し、即時切替可能化する。既存 13 件配布資料は無改変、本 patch を最終 wrap-up 差分として上書き適用。

---

## §1 5/5 case 差分パッチ一覧（5 件）

| № | パッチファイル | 対象元ファイル | 差分内容 | 行数 |
|---|---|---|---|---|
| P-01 | 01-pm-final-agenda-5-5-patch.md | 01-pm-final-agenda.md | 議決日 5/8 → 5/5 / 採択前提 5 軸 status 5/5 時点値 / 議事フロー 5/5 09:00 開始版 | 約 50 行 |
| P-02 | 02-pm-case-c-timeline-5-5-patch.md | 02-pm-case-c-timeline.md | 議決日 5/8 → 5/5 / Phase 2 着手 6/24 → 6/10（14 日前倒し）/ MS-2 trial 5/15 → 5/12 候補化 | 約 40 行 |
| P-03 | 08-review-drill-2-prep-5-5-patch.md | 08-review-drill-2-prep.md | drill #2 朝実機検証 5/8 06:00-08:00 → **5/5 06:00-08:00**（Review-E R13 担当） | 約 45 行 |
| P-04 | 12-ceo-integrated-5-5-patch.md | 12-ceo-round10-integrated-v11.md | CEO 統合判断追記 = 議決-26 前倒し 5/5 case 採択 確度 70% + 5 軸 status 5/5 時点 | 約 40 行 |
| P-05 | INDEX-5-5-patch.md | INDEX.md | 議事日 / 当日読み順所要時間 / KPI チェックリスト 5/5 case 用差分 | 約 35 行 |
| **計** | **5 件** | — | **5/5 case 即時切替 ready** | **約 210 行** |

---

## §2 適用 SOP

1. CEO 判断 confirmed = 議決-26 前倒し 5/5 case 採択 → DEC-019-060 status 暫定→confirmed 切替
2. Secretary 部門が 5/5 朝 05:30 JST に既存 13 件配布資料 + 本 5 件 patch を bundle 化（patch 適用は read-time merge 形式 = 配布資料末尾に patch 添付）
3. Owner 当日 5/5 09:00 JST 着席 → patch 添付済 13 件閲覧（45-50 分）→ 採決 → 議決-27 acknowledge 同時

---

## §3 5/5 case 確度（Round 13 起動時暫定）

- 採択確度: **70%**（PM-F + Review-E R13 評価結果待ち、CEO 判断後 confirmed 切替）
- 5 軸 status:
  - 軸-1 mock-claw e2e: **PASS 維持**（Round 12 Dev-C real spawn + NDJSON 完遂、5/5 朝も維持）
  - 軸-2 BAN drill #1+#2: drill #1 Full Pass 5/5 維持 + **drill #2 5/5 朝 06:00-08:00 実機検証**（Review-E R13 担当）
  - 軸-3 必須 50 ctrl: 70% on-track（5/5 時点 = 5/15 82% 見込みの線形補間で 67-70% 想定）
  - 軸-4 API ≤$30: $0 累計（Round 13 も $0 見込）
  - 軸-5 Owner 残動作 0 件: 維持（5/5 議決 + 6/26 公開確認のみ）

---

## §4 5/5 case 採択時の連動効果

- Phase 2 着手 = 6/24 → **6/10**（14 日前倒し候補）
- 6/27 朝公開 = 維持（公開日不変）
- MS-2 5/15 trial = 5/12 候補化（3 日前倒し可能性）
- 5/22 push 評価 = 5/22 → 5/19 候補化（3 日前倒し）
- Owner 残動作 = 5/5 議決 + 6/26 公開確認の 2 件（変動なし）

---

## §5 否決時 fallback

5/5 case 否決時 = 5/6 / 5/7 / 5/8 元計画への自動繰下げ（DEC-019-060 (a) 暫定採択範囲内）。再 review 不要、配布資料体系 4 系統で即時切替可能。

---

## §6 Footer

- **集約完遂**: 2026-05-04 深夜終盤（Round 13 Secretary-H 担当）
- **配布形式**: `decision-26-package/5-5-case-patch/` 配下 5 件
- **再 review 要否**: **不要**（Round 12 確定値反映済 + 5/5 朝実機検証 Review-E R13 完遂後即配布可能）
- **絵文字**: 不使用（全件遵守）
- **DoD**: ① 5 件 patch 起票完遂 ② PATCH-INDEX 起票完遂 ③ 5/5 朝 06:00 JST 配布 ready 状態達成（CEO confirmed 後 30 min 以内）
