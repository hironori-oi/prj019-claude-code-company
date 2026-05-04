# PM-I Report: DEC-019-065 起案ドラフト完了報告

**起案者**: PM-I（PM 部門 / Round 16 第 1 波）
**起案日**: 2026-05-05
**レビュー期限**: 2026-05-19（CEO レビュー）
**ペア起票**: DEC-019-066（Sec-K 担当 / Round 16 第 1 波）
**status**: draft（CEO レビュー後 confirmed 切替判断）
**API 追加コスト**: $0（Read + Edit + Write のみ）
**副作用**: 0（既存 DEC 改変なし、追記のみ）
**tests 影響**: 0

---

## 1. 起案概要

DEC-019-065「Round 16 9 並列構成（第 1 波 4 + 第 2 波 5）採用 + T+50 着地 stagger 圧縮 SOP 適用 + 加速 5 軸 case-B（軸-E に Knowledge INDEX v5 + Runbook 物理化追加）想定」を、`projects/PRJ-019/decisions.md` に追記する形で起案完了。

起案の構造:
- 起案カタログ行（DEC 表内、DEC-019-031 直前に挿入、1 行）
- 起案詳細セクション（ファイル下部 / v15.14 footer 直前に挿入、71 行）

起案セクション内訳:
- タイトル / status / 背景（既決済 SOP 3 本 = DEC-019-058 / -062 / -064 を前提とする）
- 意思決定内容 3 項目（① 9 並列構成 / ② T+50 着地 SOP 適用 / ③ 軸-E 追加 case-B）
- 代替案 3 案（① 7 並列 / ② 11 並列 / ③ 9 並列 = 採用）
- 採用根拠 5 件（Round 15 実績 / API $0 / Owner 加速 directive / SOP 連続適用機会 / 軸-E 余力）
- リスク 3 件 + 緩和策（rate limit / tests 影響 / stagger 効果検証）
- 第 1 波 4 部署候補（PM-I / Sec-K / Dev-K / Review-G）
- 第 2 波 5 部署候補（Dev-L / Dev-M / Marketing-I / Knowledge-K / PM-J）
- 軸-E 到達指標（E-1〜E-4 = INDEX v5 + Runbook 物理化 4 件最小 + YAML frontmatter + 横展開 readiness）
- 連携セクション（DEC-019-066 ペア起票 + 既決済 SOP 連携 + 5/19 レビュー）
- measurable success criteria 5 件（M-1 stagger 適合 / M-2 API $0 / M-3 tests 0 / M-4 SOP 80%+ / M-5 軸-E 達成度）
- フォローアップ案件 3 件（DEC-019-067 / -068 / -069 想定）

---

## 2. 採用根拠サマリ

| 根拠 ID | 内容 |
|---|---|
| ① | Round 15 で 11 並列 + stagger T+50 着地を完遂、9 並列はその安全側内側 |
| ② | API 追加コスト累計 $0 を Round 15 まで維持、9 並列は規模圧縮で継続見込 |
| ③ | Owner formal「最速」directive + 「議決前倒し」directive 二重継続 |
| ④ | DEC-019-062 SOP の連続適用で改訂材料が Round 15→16 で 2 回分蓄積 |
| ⑤ | 9 並列 = 11 並列比 -2 部署で生じる管理余力を軸-E 追加に振り向け可能 |

---

## 3. リスクと緩和策

| リスク | 緩和策 |
|---|---|
| rate limit | 第 1 波 4 部署で API 同時叩き上限を Round 15 比 -7 に圧縮、Read/Edit/Write 中心構成継続 |
| tests 影響 | 全部署「tests 影響 0」制約継続、副作用 0 / 既存 DEC 改変禁止を Round 16 標準で全 dispatch prompt に明示 |
| stagger 効果検証不確実性 | T+50 不達時のフォールバック = DEC-019-062 SOP の T+80 上限、適合率記録で SOP v2 改訂条件をトリガー化 |

---

## 4. DEC-019-066（Sec-K 担当）との連携

DEC-019-065（本起案）と DEC-019-066（Sec-K 担当）はペア起票として Round 16 第 1 波で並行起票。役割分担は以下のとおり:

- **DEC-019-065（PM-I）= Round 16 構成 SOP 起案**: 9 並列構成 + T+50 SOP 適用 + 軸-E 追加 case-B の意思決定根拠と measurable success criteria を提供。CEO レビュー（5/19）後、status: draft → confirmed 切替判断材料となる。
- **DEC-019-066（Sec-K）= Round 16 実 dispatch 駆動 + 配布資料 v17 整備**: Round 16 dispatch authorization の起票 + Round 16 配布資料体系 v17（v16 比 9 並列構成反映 + 軸-E 追加項目反映）整備 + dashboard 86→88% 起動進捗予約。

連携順序の想定:
1. PM-I（本起案）= DEC-019-065 起案セクション + 表内行 追記（本報告完了時点で済）
2. Sec-K = DEC-019-066 起票（同 Round 16 第 1 波内、PM-I と並行 dispatch 想定）
3. CEO = Round 16 統合報告 v17 にて両 DEC を併記、5/19 レビュー前の事前準備材料として整理
4. CEO レビュー（5/19）= status: draft → confirmed 切替 / 軸-E 到達指標の Round 17 以降本格運用化判断
5. Round 16 完遂着地時 = DEC-019-067（Round 17 構成 SOP 起案）への trigger

---

## 5. 5/19 レビュー期限と判断材料

5/19 レビュー時に CEO に提示する材料:
- (a) Round 16 第 1 波 4 部署 dispatch 実績（T+50 SOP 適合率 = M-4 集計値）
- (b) Round 16 完遂着地着実度（M-1 / M-2 / M-3 達成状況）
- (c) 軸-E 到達指標 Round 16 時点進捗（M-5 = 0/4〜4/4）
- (d) 5/22 push 評価 95%+ 進捗（軸-A 連動）
- (e) 6/20 公開準備進捗（軸-B 連動）
- (f) 6/3 Phase 2 着手準備進捗（軸-C 連動）
- (g) DEC-019-066 起票結果（Sec-K 担当、配布資料 v17 整備状況、dashboard 86→88% 反映）

CEO レビュー判断パターン:
- パターン A: 全 measurable criteria PASS → status confirmed 切替 + Round 17 以降軸-E 本格運用
- パターン B: M-1〜M-3 PASS / M-4 partial / M-5 partial → status confirmed 切替（軸-E は Round 17 で再評価）
- パターン C: M-4 不達（SOP 適合率 < 80%）→ status draft 継続、SOP 改訂を DEC-019-062 v2 として別起案

---

## 6. 制約遵守確認

- API 追加コスト $0: PM-I は Read + Edit + Write のみ使用、外部 API 呼び出しなし
- 副作用 0: 既存 DEC（DEC-019-001〜064）への改変なし、追記のみ（decisions.md への 1 行表内追記 + 71 行セクション追記）
- 絵文字 0: 起案セクション + 本報告書とも絵文字未使用を確認
- tests 影響 0: code 変更なし、テストファイル touch なし
- 起案行数: 71 行（要件 60-100 行内）
- 本報告書行数: 約 110 行（要件 80-120 行内）

---

## 7. 後続アクション

- (i) Sec-K による DEC-019-066 起票完了を待ち、Round 16 第 1 波 dispatch 体制確立
- (ii) Dev-K / Review-G 起案担当への dispatch（CEO 判断後）
- (iii) Round 16 完遂着地時の v15.x footer 起票（Sec-K 担当）
- (iv) 5/19 CEO レビュー前の事前資料整備（PM 部門 + Secretary 部門連携）
- (v) DEC-019-067 起案準備（Round 17 構成 SOP / Round 16 完遂着地後 trigger）

以上、PM-I による DEC-019-065 起案ドラフト完了報告。
