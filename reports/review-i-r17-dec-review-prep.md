# PRJ-019 — Review-I R17 5/19 + 5/26 DEC review 補強

最終更新: 2026-05-05 / 起案: Review 部門 R17 Review-I
位置付け: DEC-019-065（PM-I, 5/19 review）/ DEC-019-066（Sec-K, 5/26 review）/ DEC-019-067（PM-J, 5/26 review）の 3 件起案中 DEC に対し、Review 部門視点の **review 観点 + 横断統合観点** を事前準備。CEO レビュー判断材料として 5/18 EOD までに CEO に提出想定。
版: v1.0 read-only / 連動: pm-i-r16-dec-065-draft.md / sec-k-r16-dec-066-draft.md / decisions.md DEC-065〜067

---

## §1 DEC-019-065 review 観点（9 並列構成最適化評価 / 5/19 期限）

### §1.1 measurable success criteria 検証 5 軸

| ID | criterion | 5/19 時点 review 観点 | PASS 判定基準 |
|---|---|---|---|
| M-1 | 第 1 波 4 部署すべて T+50 内 dispatch 完了 | Round 16 dispatch log 4/4 verify | T+50 ± 30 内 4/4 で PASS |
| M-2 | API 追加コスト累計 = $0 | Round 16 cost dashboard 集計 | $0 維持で PASS |
| M-3 | tests 影響 = 0 維持 | workspace 791 PASS baseline 比較 | 791 ± 0 で PASS |
| M-4 | DEC-019-062 SOP 適合率 ≥ 80% | Round 16 dispatch 間隔分布 | 9 件中 8 件 T+50 ± 30 内 |
| M-5 | 軸-E 到達指標 達成度 | E-1〜E-4 の 0/4 〜 4/4 報告 | 3/4 以上で confirmed 切替推奨 |

### §1.2 review 補強観点 4 件

1. **9 並列の安全側内側性検証**: Round 15 11 並列実績比 -2 部署で rate limit 余裕確保が事実か（API spike 検知 0 件で OK）
2. **第 1 波 4 部署内訳の妥当性**: PM-I + Sec-K + Dev-K + Review-G = 部門均衡 4 軸（PM/Sec/Dev/Review）が成立しているか
3. **stagger T+50 SOP 連続適用効果**: Round 15 → 16 の 2 round 連続で SOP 改訂材料が蓄積されたか（DEC-019-062 v2 改訂条件 trigger）
4. **軸-E 追加余力検証**: 9 並列 -2 部署分の管理余力が Knowledge INDEX v5 + Runbook 物理化に振り向けられたか（Knowledge-K 報告書で確認）

### §1.3 5/19 CEO レビュー判断パターン推奨

- A（M-1〜M-5 全 PASS）: confirmed 切替 + Round 17 軸-E 本格運用 → 推奨 80% / B（M-1〜M-3 PASS, M-4/M-5 partial）: confirmed + Round 17 軸-E 再評価 → 15% / C（M-4 < 80%）: draft 継続 + DEC-062 v2 別起案 → 5%

---

## §2 DEC-019-066 review 観点（Sec hardening 4 項目実装到達度 / 5/26 期限）

### §2.1 Sec hardening 4 項目検証マトリクス

| 項目 | 内容 | 5/26 時点到達指標 | review 観点 |
|---|---|---|---|
| (1) API spike 検知 | 過去 3 round 平均 + 2σ trigger | R16/R17/R18 で 1+ 回検知動作 verify | false positive 率 < 5% |
| (2) 副作用 0 自動検証 | Read/Edit/Write 限定 + git status 差分 | 全 dispatch で git status 差分 = 想定 artifact | 不正差分 0 件 |
| (3) 絵文字 0 自動チェック | NFKC + 35 ペア多言語フィルタ | 検出件数 + redaction 完了率 100% | redaction skip 0 件 |
| (4) tests PASS gate | 791 baseline 維持 | regress 0 件 + revert 不要 | baseline ± 0 |

### §2.2 stagger 圧縮 SOP 数値化検証

- 第 1 波 T+0〜T+50: R16/R17/R18 の 3 round で達成率 80%+（R-1）
- 第 2 波 T+0〜T+150: 3 round で達成率 90%+（R-1）
- hard limit T+180 超過: 0 件（CEO 強制 ack 0 件）
- 例外発動: (a) Owner directive 緊急 / (b) drill #2 連動 / (c) API spike → 各発動回数 + 妥当性検証

### §2.3 review 補強観点 3 件

1. **R1 リスク（T+50 再現性 60% 留まり）の実績検証**: R16/R17/R18 で 3 round 累計 9 件中何件が T+50 内か
2. **代替案 A（T+30）却下根拠の継続妥当性**: API spike risk 高評価が 5/26 時点で覆らないか
3. **Phase 2 範囲送り（token rotation）の現状評価**: subscription plan 主軸（DEC-019-051）下で 5/26 時点 Phase 2 範囲明確化進捗

### §2.4 5/26 統合採択（DEC-065 + 066）整合性

DEC-065 = 9 並列構成 + 部署配分 + 軸-E / DEC-066 = dispatch 順序 + Sec hardening + stagger 数値化。重複は第 1/2 波構成のみ（DEC-065 = 部署配分、DEC-066 = dispatch 順序で優先既決）。OK 条件: M-1〜M-5 + Sec hardening 4/4 + stagger 達成率すべて PASS。

---

## §3 DEC-019-067 review 観点（Round 17 構成 SOP 整合性 / 5/26 期限）

### §3.1 起案範囲（PM-J 担当想定）

DEC-019-067 = Round 16 完遂着地後の status 暫定→confirmed 切替 trigger + Round 17 構成 SOP 起案。Round 16 完遂時 trigger（pm-i-r16-dec-065-draft §7-(v) 連動）で起案開始。

### §3.2 review 観点 4 件

1. **Round 16 完遂着地条件の客観化**: 9 並列 9/9 + M-1〜M-5 PASS / 軸-E E-1〜E-4 達成度 が判定に反映されるか
2. **Round 17 構成案の SOP 連続性**: DEC-019-058 / -062 / -064 / -065 / -066 の連続適用が Round 17 で継続するか
3. **stagger 圧縮の Round 17 適用 case**: Round 16 で T+50 SOP 適合率 80%+ 達成時、Round 17 で T+30 試行を起案するか / T+50 維持か
4. **Round 17 第 1 波 / 第 2 波構成**: CEO 自走 4 件 + Owner formal 5 件（ceo-v17-round16-9parallel-completion §8.3）の構成が DEC-067 で確定するか

### §3.3 SOP 整合性 cross-check 表

| 連動 DEC | DEC-067 への影響 | review 観点 |
|---|---|---|
| DEC-019-058 | Owner formal authorize SOP | Round 17 でも Owner 介入は SOP 例外時のみ維持 |
| DEC-019-062 | stagger 圧縮 T+50 SOP | Round 17 で v2 改訂か維持か判断 |
| DEC-019-064 | Phase 1 W1 SOP | W2 / W3 SOP として継承するか |
| DEC-019-065 | 9 並列構成 + 軸-E | Round 17 で軸-E 本格運用するか |
| DEC-019-066 | Sec hardening 4 項目 | Round 17 で 4 項目維持 + 拡張検討 |

---

## §4 統合 review メモ（3 DEC 横断観点）

### §4.1 横断テーマ 4 件

1. **API $0 維持**: 3 DEC とも制約明記、Round 16/17/18 累計 $0 維持が pre-condition、5/26 時点 $0 break 0 件必須
2. **tests 791 baseline 維持**: 3 DEC とも tests 影響 0 制約、R16/17/18 で baseline ± 0 集計
3. **絵文字 0 + NFKC + 35 ペア辞書（Sec-J 既決）**: 3 DEC とも流用、重複実装 0 件で運用効率化
4. **Owner 拘束 0 分維持**: 3 DEC とも CEO authorize 完結、Round 16-18 累計 0 分維持確認

### §4.2 5/19 + 5/26 review 連結 timeline 推奨

- 5/19 = DEC-065 単独レビュー → confirmed 切替判断
- 5/22 = 必須 50 = 95%+ 達成判定（軸-A 連動、DEC-065 M-5 軸-E 進捗にも影響）
- 5/26 = DEC-066 + DEC-067 同時レビュー（065 結果 + R16/17/18 実績 3 round 統合）
- 5/26 → confirmed 切替後 Round 19 以降 formal SOP として固定運用 → Phase 1 W4 完遂（6/20）まで継続

### §4.3 critical 横断リスク 3 件

| リスク | 影響 DEC | 緩和 |
|---|---|---|
| R16 9 並列で M-4 < 80% | DEC-065 / 067 | DEC-019-062 v2 別起案、Round 17 で T+80 fallback 維持 |
| Sec hardening 4 項目で false positive 多発 | DEC-066 | CEO ack 即解除 SOP 整備 |
| Round 17 構成変更で SOP 連続性 break | DEC-067 | DEC-058/062/064/065/066 全条項 carry-over 明示 |

---

## §5 制約遵守確認

API $0 / 副作用 0 / 絵文字 0 / tests 影響 0 / 行数 80-120 内 → 全 OK。新規 1 ファイル、既存 DEC 改変 0、code touch 0。

（以上、80-120 行内）
