# PM-K Round 18 報告書 — DEC-019-067 fix-up + DEC-019-068 DRAFT 起案

- **担当**: PM-K（PM 部門 / Round 18 第 1 波）
- **起案日**: 2026-05-05
- **対象議決**: DEC-019-067 (fix forward-only polish) / DEC-019-068 (DRAFT 起案)
- **レビュー期限**: DEC-067 = 2026-05-26 (PM-J 起案継承) / DEC-068 = 2026-06-02 (Round 19 正式議決時)
- **関連議決**: DEC-019-058 / -062 / -064 / -065 / -066 / -067

---

## 1. 任務概要

PM-J が Round 17 で起案した DEC-019-067（Round 17 9 並列構成 + 17 日 path W1 同期 + stagger 圧縮 SOP 連続 3 round 適用）を **fix forward-only** で正式議決 form に整え、Round 18 着地宣言として DEC-019-068（連続 4 round 適用効果評価 + デフォルト運用フロー昇格判断）を DRAFT 起案。

PM-J 起案の本文は削除せず、decisions.md 行 283-353 の起案 form がそのまま正式議決 form として利用可能であることを確認（background / 意思決定内容 / 代替案 / 採用根拠 / 連携 / measurable success criteria / フォローアップ / 制約遵守 = 7 セクション完備）。本報告書は **構造完備性確認 + Round 18 後継議決 DRAFT 起案** の 2 役割。

---

## 2. DEC-019-067 fix forward-only 整理結果

### 2.1 構造完備性 7 セクションマッピング

| 正式議決必須項目 | DEC-019-067 該当箇所 | 完備度 |
|---|---|---|
| background / context | decisions.md L287-292（Round 15-17 連続経緯 + Owner directive） | OK |
| 意思決定内容（採択 3 軸） | L294-308（① 9 並列構成 / ② 17 日 path 同期 / ③ SOP 連続 3 round） | OK |
| 代替案 | L310-313（7 並列 / 11 並列 / 9 並列採用） | OK |
| 採用根拠 | L315-321（(a)〜(f) 6 件） | OK |
| 連携 | L329-334（DEC-065/066 連動 + 5/19+5/26 review） | OK |
| measurable success criteria | L336-342（M-1〜M-6） | OK |
| next-actions / フォローアップ | L344-347（DEC-068/069/070） | OK |
| 制約遵守 | L349-351（API $0 / 副作用 0 / 絵文字 0 / tests 0） | OK |

### 2.2 verification 観点（5/26 formal レビュー時）

- Round 16/17 の M-1〜M-6 計測値を pm-j-r17-dec-067-draft §5 と review-i-r17 §1.1 表で照合
- DEC-019-065 / -066 / -067 統合採択時の重複条項解消は review-i-r17 §2.4 に既決（DEC-065 = 部署配分優先、DEC-066 = dispatch 順序優先）
- 連続 3 round（R15/R16/R17）SOP 適合率 80%+ 達成 → DEC-019-068 の DRAFT 確定 trigger 成立

### 2.3 fix forward-only 確認

- PM-J 起案テキストは **無改変**（削除 / 改変 / 追記 すべて 0 件）
- 本 PM-K 作業は decisions.md 末尾に DEC-068 DRAFT を追記したのみ
- PM-J 起案の status: draft は 5/26 formal レビュー後 confirmed/revised へ遷移、PM-K 起案範囲外

---

## 3. DEC-019-068 DRAFT 起案サマリ

### 3.1 起案動機

DEC-019-067 フォローアップ案件 (a) として明示済：「連続 3 round SOP 適合率 80%+ 達成時の Round 18 以降 SOP confirmed 切替 + Phase 1 W4 完遂までの運用 SOP 定着」。Round 18 = 連続 **4 round** 目の SOP 適用機会、n=36 で statistical significance 担保可能、5/26 formal 採択（DEC-065+066+067）直後の Round として最適。

### 3.2 採択 3 軸（DRAFT）

1. **Round 18 9 並列構成 + SOP 連続 4 round 適用継続**：枠組のみ規定、部署配分は Round 19 PM 起案時に確定
2. **デフォルト運用フロー昇格判断 trigger 4 条件**：
   - T-1 連続 4 round 累計 SOP 適合率 ≥ 80%（n=36 中 ≥29）
   - T-2 API 累計 $0 維持
   - T-3 tests 791 PASS baseline ± 0
   - T-4 Owner 拘束 0 分維持
   - 4/4 達成 → Round 19 で昇格議決、PRJ-018/PRJ-012 横展開検討
3. **Phase 1 W4 完遂（6/20）までの SOP 定着評価**：Round 18→19→20 で n≥45 累積、改訂条件 trigger（5+ round で 70% 割れ）別 DEC で起案

### 3.3 measurable success criteria（M-1〜M-6）

DEC-019-067 を継承しつつ、M-4 を **連続 4 round 累計 SOP 適合率 ≥ 80%（n=36）** に拡張、★ 昇格判断 critical として明示。M-5 は 17 日 path W2/W3 進行整合に更新、M-6 は軸-E 4/4 達成（Knowledge INDEX v6 + Runbook 4 件 + frontmatter + 横展開 readiness）。

### 3.4 DRAFT 維持条項

- Round 18 進行中は status DRAFT 固定、措置案 / 運用方針案として参照のみ
- 確定値（適合率累積、measurable 評価）は Round 18 完遂後 PM-L 等が更新
- Round 19 で初めて正式議決として発議、status: confirmed / rejected / revised へ遷移

---

## 4. 議決 30 → 32 件 trajectory

| 時点 | 累計議決 | 内訳変化 |
|---|---|---|
| Round 16 完遂 | 27 件 | DEC-019-001〜064 ＋ 部分起案 |
| Round 17 起案開始 | 27 件 → 30 件 | + DEC-065（PM-I）/ -066（Sec-K）/ -067（PM-J）= **+3 件** |
| Round 17 完遂着地（本時点） | **30 件** | DEC-019-001〜067 |
| Round 18 着地（DEC-068 DRAFT 確定後） | **31 件** | + DEC-068（PM-K, DRAFT） |
| Round 19 正式議決（DEC-068 confirmed + DEC-069 起案） | **32 件** | + DEC-069（17 日 path 連鎖評価） |

trajectory 整合性確認：DEC-019-067 フォローアップ 3 件（DEC-068/069/070）が R18→R19→R20 で順次起案 → R20 完遂時 33 件着地見込。Phase 1 W4 完遂（6/20）想定までの議決ペース = 約 0.5-1 件/Round 維持で運用 SOP 定着評価との並走可能。

---

## 5. リスクと対策

- **R1（中）**: Round 17 完遂時 SOP 適合率が 80% 未満 → DEC-068 DRAFT trigger T-1 未達 → R18 で SOP v2 改訂議決を別途起案（DEC-019-062 v2）
- **R2（低）**: 5/26 formal レビューで DEC-065+066+067 統合採択が partial（C パターン: M-4<80%）→ DEC-068 起案根拠の (b)(c) 弱体化 → DRAFT 維持期間延長で対応
- **R3（低）**: Phase 1 W4 完遂遅延（6/20→6/27 等）→ DEC-068 M-5 17 日 path W2/W3 整合判定基準を再設定、Round 19 議決時に M-5 update

---

## 6. 制約遵守

- API 消費: $0（PM-K は Read + Edit + Write のみ）
- 副作用: 0（decisions.md 追記 + 本報告書新規のみ、既存 DEC-019-067 改変 0、PM-J draft text 削除 0）
- 絵文字: 0 / tests 影響: 0（baseline 791 PASS 維持）
- 起案行数: DEC-068 約 70 行 / 本報告書: 約 180 行（250 行制約内）
- DEC-019-067 fix forward-only 遵守: 本文無改変、本 PM-K 作業範囲は末尾追記 + 本報告書新規の 2 ファイル touch のみ

---

## 7. 次アクション

- 5/19 中間レビュー: Round 17 第 1 波 4 部署 dispatch 結果 + Round 16 完遂着地データを CEO 統合報告で確認（PM-J 既決事項）
- 5/26 formal レビュー: DEC-019-065 / -066 / -067 の 3 件統合採択 → confirmed/revised 切替判断
- Round 18 起動: 5/26 formal 採択直後、PM-L 等が部署配分確定 + DEC-068 DRAFT を運用方針案として参照
- Round 18 完遂着地: PM-L が DEC-068 measurable update + status DRAFT → 正式議決 form 移行
- Round 19 正式議決（6/2 想定）: DEC-019-068 confirmed/rejected/revised 採択 + 4 条件 4/4 達成時に SOP デフォルト運用フロー昇格

---

**起案者**: PM-K / **起案日**: 2026-05-05 / **次回更新**: Round 18 完遂着地時（PM-L 担当） + 5/26 formal レビュー後 + Round 19 正式議決時
