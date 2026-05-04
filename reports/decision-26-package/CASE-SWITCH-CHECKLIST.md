# 議決-26 配布資料 CASE-SWITCH チェックリスト — 5/8 元計画 ↔ 5/5 / 5/6 / 5/7 前倒し case 切替時の影響項目一覧

> **起票日**: 2026-05-04 深夜終盤（Secretary-H Round 13 dispatch、DEC-019-060 起票直後）
> **起票担当**: Secretary-H（PRJ-019 Round 13 並列 dispatch、独立 Agent、DEC-019-025 SOP 完全順守）
> **対象**: 5/8 議決-26 元計画 case ↔ 5/5 / 5/6 / 5/7 前倒し case 切替時の影響項目チェックリスト
> **連動 DEC**: DEC-019-060（議決-26 前倒し可否暫定採択、status 暫定）
> **行数**: 約 180 行

---

## §0 概要

CEO 判断 confirmed 後（DEC-019-060 status 暫定→confirmed 切替後）、議決-26 前倒し case を採択する場合に、既存 13 件配布資料 + patch 適用結果を Owner に配布する前に確認すべき影響項目を 6 軸 × 4 case で網羅的にチェックする。配布資料体系 4 系統（5/8 元計画 + 5/5/6/7 case 別 patch）の整合性を最終保証する目的で設計。

---

## §1 6 軸 case 別差分マトリクス

| 軸 | 5/8 元計画 | 5/5 case | 5/6 case | 5/7 case | 影響範囲 |
|---|---|---|---|---|---|
| **軸-1: 議事日付** | 2026-05-08（金）09:00 JST | 2026-05-05（火）09:00 JST | 2026-05-06（水）09:00 JST | 2026-05-07（木）09:00 JST | INDEX / 01-pm-final-agenda / 12-ceo-integrated 全 patch |
| **軸-2: 議決日（採決完了）** | 2026-05-08 | 2026-05-05 | 2026-05-06 | 2026-05-07 | 同上 + decisions.md DEC-019-060 confirmed 切替 footer 数 |
| **軸-3: drill #2 朝実機検証日** | 2026-05-08 朝 06:00-08:00（Review-D R12） | 2026-05-05 朝 06:00-08:00（Review-E R13） | 2026-05-06 朝 06:00-08:00（Review-E R13） | 2026-05-07 朝 06:00-08:00（Review-E R13） | 08-review-drill-2-prep / 09-review-false-positive-re-eval（軸-2 連動） |
| **軸-4: 5/22 push 評価日** | 2026-05-22（Dev-E R12） | 2026-05-19 候補化（Dev-J R13、3 日前倒し） | 2026-05-20 候補化（Dev-J R13、2 日前倒し） | 2026-05-21 候補化（Dev-J R13、1 日前倒し） | 02-pm-case-c-timeline / 03-pm-phase2-integration |
| **軸-5: Phase 1 sign-off 日** | 2026-05-30（基本）/ 5/22 push | 2026-05-27 / 5/19 push 候補化 | 2026-05-28 / 5/20 push 候補化 | 2026-05-29 / 5/21 push 候補化 | 02-pm-case-c-timeline / 11-dev-round10-summary |
| **軸-6: Phase 2 着手日** | 2026-06-24（基本）/ 6/17 push | 2026-06-10 候補化 | 2026-06-12 候補化 | 2026-06-14 候補化 | 03-pm-phase2-integration / 04-marketing-narrative-final |

→ **不変軸**: 6/27 朝公開（全 case 共通維持）/ Owner 残動作 2 件構造 / API ≤ $30 / Marketing 28×28 narrative + 18×18 portfolio 100% / W3 中核 22 日前倒し既達 / 5 部署 7 経路 cross-validation

---

## §2 4 case 確度比較（v14 v13→v14 更新）

| 項目 | 5/5 case | 5/6 case | 5/7 case | 5/8 元計画 case |
|---|---|---|---|---|
| 議決-26 採択確度 | 70% | 80% | 87% | 90→92% |
| 5/12 production readiness | 98% | 98% | 98% | 98% |
| MS-2 trial 日 | 5/12 | 5/13 | 5/14 | 5/15 |
| MS-2 trial 確度 | 88% | 88% | 88% | 88% |
| 内部運用着手公式 日 | 5/19 | 5/20 | 5/21 | 5/22 |
| 内部運用着手公式 確度 | 88% | 88% | 88% | 88% |
| 必須 50 ctrl 5/30 | 94% | 94% | 94% | 94% |
| Phase 1 公式完了 buffer 終端 日 | 5/31 | 6/1 | 6/2 | 6/3 |
| 同 確度 | 95% | 95% | 95% | 95% |
| 6/27 朝公開 | 92% | 92% | 92% | 92% |
| Phase 2 前倒し日数（基本） | 14 日 | 12 日 | 10 日 | 0 日（基本） |

---

## §3 配布資料 13 件への case 別影響度

| № | ファイル | 5/5 case 影響度 | 5/6 case 影響度 | 5/7 case 影響度 | 5/8 元計画 |
|---|---|---|---|---|---|
| INDEX | INDEX.md | **大**（patch 必須）| **大**（patch 必須）| **大**（patch 必須）| 不変 |
| 01 | pm-final-agenda.md | **大**（patch 必須）| **大**（patch 必須）| **大**（patch 必須）| 不変 |
| 02 | pm-case-c-timeline.md | **大**（patch 必須）| **大**（patch 必須）| **大**（patch 必須）| 不変 |
| 03 | pm-phase2-integration.md | 中（patch 不要、本体内 Phase 2 着手日候補のみ参照差分）| 中 | 中 | 不変 |
| 04 | marketing-narrative-final.md | 小（不変、6/27 公開維持で narrative 整合）| 小 | 小 | 不変 |
| 05 | marketing-portfolio-18x18.md | 不変（324/324 cell 100%）| 不変 | 不変 | 不変 |
| 06 | marketing-metric-v1.1.md | 不変 | 不変 | 不変 | 不変 |
| 07 | marketing-web-ops-handoff.md | 不変 | 不変 | 不変 | 不変 |
| 08 | review-drill-2-prep.md | **大**（patch 必須）| **大**（patch 必須）| **大**（patch 必須）| 不変 |
| 09 | review-false-positive-re-eval.md | 中（軸-2 連動、本体不変）| 中 | 中 | 不変 |
| 10 | review-50-controls-re-audit.md | 中（軸-3 数値補間、本体不変）| 中 | 中 | 不変 |
| 11 | dev-round10-summary.md | 不変（Round 10/11/12 着地累計、5/8 元計画と完全同一）| 不変 | 不変 | 不変 |
| 12 | ceo-round10-integrated-v11.md | **大**（patch 必須、CEO 統合判断追記）| **大**（patch 必須）| **大**（patch 必須）| 不変 |

→ **patch 必須 = 5 件（INDEX + 01 + 02 + 08 + 12）**、ただし 5/6 / 5/7 case patch は 4 件（INDEX patch 簡略化のため、配布時に CEO 判断で同等品質保証）

---

## §4 切替手順 SOP（CEO 判断 confirmed 後 30 分以内）

### §4.1 5/5 case 採択時

1. CEO confirmed → DEC-019-060 status 暫定→confirmed 切替（decisions.md edit、5 分以内）
2. Secretary 部門が `decision-26-package/5-5-case-patch/` 配下 5 件 patch を既存 13 件配布資料に bundle 化（10 分以内）
3. INDEX.md + INDEX-5-5-patch.md / 01 + 01-pm-final-agenda-5-5-patch.md / 02 + 02-pm-case-c-timeline-5-5-patch.md / 08 + 08-review-drill-2-prep-5-5-patch.md / 12 + 12-ceo-integrated-5-5-patch.md の 5 セット bundle（10 分以内）
4. Owner 配布（5/5 朝 06:00 JST、配布完了まで 5 分以内）
5. 計 30 分以内（CEO confirmed → Owner 配布完了）

### §4.2 5/6 case 採択時

1-5: 5/5 case と同一 SOP、対象が `5-6-case-patch/` 配下 4 件に変更（INDEX patch を 5/5 case patch から借用 + ヘッダ日付差替）。

### §4.3 5/7 case 採択時

1-5: 5/5 case と同一 SOP、対象が `5-7-case-patch/` 配下 4 件に変更（INDEX patch を 5/5 case patch から借用 + ヘッダ日付差替）。

### §4.4 5/8 元計画維持時

1. CEO confirmed → DEC-019-060 status 暫定→confirmed 切替 = **5/8 元計画維持**（前倒し case 不採択）
2. 既存 13 件配布資料を patch なしで Owner 配布（5/8 朝 06:00 JST）
3. 計 10 分以内（CEO confirmed → Owner 配布完了、最も簡素）

---

## §5 切替時 KPI チェックリスト（Secretary 部門 self-check）

- [ ] 議決-26 前倒し case = 5/5 / 5/6 / 5/7 / 5/8 元計画 のいずれか CEO confirmed 受領
- [ ] DEC-019-060 status 暫定→confirmed 切替完遂（decisions.md edit）
- [ ] 採択 case の patch ディレクトリ全 4-5 ファイル確認
- [ ] PATCH-INDEX.md ヘッダの「status: 5/X 朝 06:00 JST 配布 ready 状態」確認
- [ ] 議事日付 / 議決日 / drill #2 検証日 / 5/22 push 評価日 / Phase 1 sign-off 日 / Phase 2 着手日 の 6 軸の case 別値が patch 内記述と一致
- [ ] dashboard 81% 反映確認
- [ ] progress.md v14 セクション append 確認
- [ ] weekly digest 5/4 EOD updated 配布
- [ ] Round 13 完遂レポート (`secretary-round13-dec-060-and-pre-emption-prep.md`) 完備
- [ ] CEO 統合報告 v14 受領（Round 13 完遂後 30-45 min 想定）

---

## §6 fallback 連鎖（前倒し case 否決時）

| 採択 case | 否決時 fallback |
|---|---|
| 5/5 case 否決 | → 5/6 case / 5/7 case / 5/8 元計画 のいずれか自動繰下げ（CEO 再判断、配布資料体系 4 系統で即時切替可能）|
| 5/6 case 否決 | → 5/7 case / 5/8 元計画 のいずれか自動繰下げ |
| 5/7 case 否決 | → 5/8 元計画への自動繰下げ（最も自然な fallback）|
| 5/8 元計画 case 否決 | → F-1 fallback 発動（5/30 NG-3 議決とパッケージ化、6/27 朝公開維持で confidence 90% 安全着地）|

---

## §7 Owner 残動作の case 別変動

| Owner 残動作 | 5/5 case | 5/6 case | 5/7 case | 5/8 元計画 |
|---|---|---|---|---|
| 議決-26 採決出席 | 5/5 09:00 JST 45-50 分 | 5/6 09:00 JST 45-50 分 | 5/7 09:00 JST 45-50 分 | 5/8 09:00 JST 45-50 分 |
| 6/27 公開最終確認 | 6/26 30-45 分（不変）| 6/26 30-45 分（不変）| 6/26 30-45 分（不変）| 6/26 30-45 分（不変）|
| 計 | **2 件 / 75-95 分**（不変）| 同左 | 同左 | 同左 |

→ Owner 残動作 = 全 4 case で **2 件 / 75-95 分**（変動なし）

---

## §8 Footer

- **集約完遂**: 2026-05-04 深夜終盤（Round 13 Secretary-H 担当）
- **配布形式**: `decision-26-package/CASE-SWITCH-CHECKLIST.md`（本ファイル）
- **再 review 要否**: **不要**（Round 12 確定値反映済 + 5/5/6/7 case patch 整合確認済）
- **絵文字**: 不使用（全件遵守）
- **DoD**: ① 6 軸 case 別差分マトリクス完備 ② 4 case 確度比較完備 ③ 配布資料 13 件への case 別影響度完備 ④ 切替手順 SOP 完備 ⑤ KPI チェックリスト完備 ⑥ fallback 連鎖完備 ⑦ Owner 残動作不変確認完備
