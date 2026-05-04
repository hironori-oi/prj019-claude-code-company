# PRJ-019 W0-1週終了時 レビュー会議アジェンダ v2 ドラフト（5/8 18:00 想定）

- 案件: PRJ-019「Clawbridge（仮）」
- 部署: レビュー部門（品質管理）
- 作成日: 2026-05-03
- 版: v2 ドラフト（v1 上書き不可、本書は **§5 / §6 / §7 への差分パッチ**）
- 親文書: `projects/PRJ-019/reports/review-w0-week1-meeting-agenda.md` v1
- 本書の位置づけ: v1 を上書きせず、5/8 議題 §5 (ToS allowlist DoD 統合) / §6 (次マイルストーン) / §7 (Go/NoGo 判定) の進捗を反映する**差分提案**。CEO レビュー後、5/8 当日 v1.1 として正式版に転記

## 0. 差分の総括

| 議題 | v1 状態 | v2 ドラフト変更点 |
|---|---|---|
| §5 ToS allowlist DoD 統合 | (1) 完成 / (2)〜(5) 未完 | (1) + (2)(3)(4)(5) **すべて完成（review-tos-allowlist-dod-integration-v1.md として統合提出）** |
| §6.2 5/13 BAN drill 1 回目 | アクション 3 項目のみ | **drill #1 シナリオ書（review-ban-drill-1-scenario.md）完成、ハッピーパス + 異常パス 5 種** 反映 |
| §7 Go/NoGo 判定 | 7 基準のうち #6 が「ToS allowlist DoD 統合 5/10 期限を守れる進捗」だった | #6 を「**ToS allowlist DoD 統合 5/10 期限完了済（5/3 時点）**」に進捗反映、ただし Dev 側の `tos_gray_review` HITL 種別追加実装は W0-Week2 着手 |

---

## 1. 議題 4 (§5 ToS allowlist DoD 統合状況) 差分パッチ

### 1.1 v1 §5.1 5/10 期限項目 → v2 ドラフト

#### 提案 diff（v1 §5.1 をそのまま置換）

```diff
 ## 5. 議題 4: ToS ホワイトリスト DoD 統合状況（10 分）

 ### 5.1 5/10 期限項目
-- 公開可能アプリ allowlist の v1 確定（`projects/PRJ-019/reports/review-tos-domain-allowlist-blocklist.md` v1 採用）
-- ニーズ判定スコアリング関数へのジャンル分類器組込（PM v2 §4.1 と整合）
-- DoD パスでの「ブラックリスト即棄却 / グレー HITL 必須 / ホワイトリスト 自動公開」の 3 分岐実装方針確定
+- (1) 公開可能アプリ allowlist の v1 確定（`projects/PRJ-019/reports/review-tos-domain-allowlist-blocklist.md` v1）— **5/3 完成済**
+- (2) ジャンル分類器 prompt 仕様（zod 互換 schema + few-shot 6 件）— **5/3 完成（review-tos-allowlist-dod-integration-v1.md §1）**
+- (3) DoD 3 分岐実装方針（whitelist 自動公開 / gray HITL / blocklist 即棄却）— **5/3 完成（同 §2）**
+- (4) FN-Black 評価方法（≤ 10%、HN 60 件 × 3 レビュア、W3/W4 ローテ）— **5/3 完成（同 §3）**
+- (5) CEO 個別承認の運用ルール（G-Top-1〜4）— **5/3 完成（同 §4）**
+
+**5/10 期限項目 5 / 5 すべて完成**（5/3 時点）。
+次の Dev 連携タスク: hitl_gate.ts の tos_gray_review 第 6 種実装（W0-Week2 着手、5/15 完了予定）
```

### 1.2 v1 §5.2 進捗確認項目 → v2 ドラフト（実測値で更新）

#### 提案 diff

```diff
 ### 5.2 進捗確認項目
 | # | 項目 | 状態（5/8 時点） | 5/10 完成見込み |
 |---|---|---|---|
-| 1 | allowlist v1 文書 | 完成 (5/3) | ✓ |
-| 2 | ジャンル分類器 prompt 仕様 | 進行中 | __% |
-| 3 | DoD 3 分岐実装方針 ドラフト | 進行中 | __% |
-| 4 | FN-Black 評価方法ドラフト | 未着手 | 5/10 着手 |
-| 5 | CEO 個別承認の運用ルール（G-Top-1〜4） | 未着手 | 5/10 着手 |
+| 1 | allowlist v1 文書 | **完成 (5/3)** | ✓ |
+| 2 | ジャンル分類器 prompt 仕様 | **完成 (5/3)** | ✓ |
+| 3 | DoD 3 分岐実装方針 ドラフト | **完成 (5/3)** | ✓ |
+| 4 | FN-Black 評価方法ドラフト | **完成 (5/3)** | ✓ |
+| 5 | CEO 個別承認の運用ルール（G-Top-1〜4） | **完成 (5/3)** | ✓ |
+| 6 | Dev tos_gray_review HITL 種別実装 | **未着手 (W0-Week2 着手予定)** | 5/15 完了予定 |
```

### 1.3 v1 §5.3 アクション → v2 ドラフト

#### 提案 diff

```diff
 ### 5.3 アクション
-- 5/10 までに 5 項目すべて完成、Review が CEO 経由で PM・Dev に提出
-- 完成しない場合は **W0-2 週中盤（5/13）に必達**、それでも未完成なら G-11 全体を W0-3 週に押し出す（W0 全体スケジュールは維持）
+- **5/10 期限 5 項目すべて 5/3 完成、CEO 経由で PM/Dev に既に提出済**
+- 残課題: Dev による tos_gray_review HITL 種別第 6 種実装（W0-Week2 5/12 着手 → 5/15 完了）
+- CEO 起票候補（review-tos-allowlist-dod-integration-v1.md §6 より）:
+  - DEC-019-018: FN-Black / FP-Black 用語整合（allowlist v1.1 改訂）
+  - DEC-019-019: whitelist 自動公開の境界（preview deploy のみか、本番 deploy も含むか）
+  - DEC-019-020: HITL 第 6 種 tos_gray_review 追加承認
+  - DEC-019-021: G-Top-1 Phase 1 デモ枠 1 件承認
+- 5/8 会議で上記 4 件を CEO 専決 / 担当判定
```

---

## 2. 議題 5 (§6 次マイルストーン) 差分パッチ

### 2.1 v1 §6.2 5/13 BAN drill 1 回目 → v2 ドラフト

#### 提案 diff

```diff
 ### 6.2 5/13 (水) BAN drill 1 回目 (C-A-03 Drill 1)
 | # | アクション |
 |---|---|
 | 1 | PRJ-019 単独 drill (Sumi/Asagi はアイドル) |
 | 2 | 5 ステップ SLA 達成: 検知 < 1 分 / 通知 < 5 分 / 退避 < 30 分 / rotate < 60 分 / 代替起動 < 4 時間 |
 | 3 | drill 不合格時は 3 日以内に再 drill、再 drill も不合格なら Phase 1 着手 1 週間延期 |
+| 4 | **シナリオ書完成** (`projects/PRJ-019/reports/review-ban-drill-1-scenario.md` v1, 5/3) |
+| 5 | **ハッピーパス + 異常パス 5 種**（A: 警告メール先着 / B: silent revocation / C: 429 誤検知 / D: 通知 SLA 違反 / E: P-E 起動失敗）を実施 |
+| 6 | **副作用ゼロ確認スクリプト**で drill 開始前 baseline 取得 + 終了後 verification |
+| 7 | drill 用 mock-claude スタブが Dev タスク 2 で整備中、5/12 までに完成必須 |
+| 8 | drill master = Dev / observer = Review / CEO / Owner / PM 立会 |
+| 9 | drill 中 Sumi/Asagi 完全停止（Owner / CEO 共同確認、5/13 09:00 まで） |
+| 10 | drill 後レポート (`reports/ban-drill-1-result.md`) を Dev が当日中に起票 |
```

### 2.2 v1 §6 全体に 1 項目追加 → v2 ドラフト

#### 提案 diff（§6.2 と §6.3 の間に挿入）

```diff
 ### 6.2 5/13 (水) BAN drill 1 回目 (C-A-03 Drill 1)
 ...
+
+### 6.2.1 5/14 (木) drill #2 シナリオ起案
+| # | アクション |
+|---|---|
+| 1 | `projects/PRJ-019/reports/review-ban-drill-2-scenario.md` を Review が起案 |
+| 2 | drill #1 実測値（SLA / 副作用 / 異常パス結果）を反映 |
+| 3 | Sumi (PRJ-012) / Asagi (PRJ-018) 同時稼働中の BAN シナリオ追加検証項目を設計 |
+| 4 | アカウント分離状況（review-v2 §5）の事前確認結果を組込 |
 
 ### 6.3 5/15 (木) W0-2 週終了
```

---

## 3. 議題 6 (§7 Go/NoGo 判定) 差分パッチ

### 3.1 v1 §7.1 Go 判定基準 → v2 ドラフト

#### 提案 diff

```diff
 ### 7.1 Go 判定基準（全充足要）
 | # | 基準 | 5/8 時点充足 |
 |---|---|---|
 | 1 | 7 項目すべて Critical 指摘ゼロ | Y / N |
 | 2 | 7 項目のうち Major 指摘合計 5 件以下、すべて W0-2 週中に修正可能 | Y / N |
 | 3 | ペネトレーション B1〜B5 すべて Pass、B6 は W0-1 週分 Pass | Y / N |
 | 4 | 副作用ゼロ確認スクリプトが PRJ-001〜018 / organization/ への diff 全件 0 行 | Y / N |
 | 5 | C-A-04 (5/12) / C-A-03 Drill 1 (5/13) のリードタイム確保可能 | Y / N |
-| 6 | ToS allowlist DoD 統合の 5/10 期限を守れる進捗 | Y / N |
+| 6 | **ToS allowlist DoD 統合 5/10 期限の 5 項目すべて完成済（5/3 完了）** | **Y（実績）** |
 | 7 | 開発部門の残工数試算が現実的 (Dev 2 名相当 × 7 日 で残 14 項目 + α が完了見込み) | Y / N |
+| 8 | **BAN drill #1 シナリオ書（5/13 用）完成済、Dev mock-claude スタブ進捗確認可** | **Y / N** |
+| 9 | **DEC-019-018〜025 候補（v2 ドラフト連動）の CEO 専決進捗** | **Y / N** |
```

### 3.2 v1 §7.2 Conditional Go 条件 → v2 ドラフト

#### 提案 diff

```diff
 ### 7.2 Conditional Go 条件
 - 1〜2 項目で Major あり、ただし W0-2 週初日（5/9）に修正可能 → **Conditional Go**
 - C-A-04 / Drill 1 が 1 日遅延見込み（5/13 / 5/14）→ **Conditional Go**（W0-2 週末 5/15 に再判定）
+- mock-claude スタブが 5/12 までに未完成 → **Conditional Go**（drill #1 を 5/14 に 1 日延期）
+- DEC-019-018〜021（ToS allowlist DoD 統合関連 4 件）の一部が 5/8 会議で未決裁 → **Conditional Go**（5/9 の追加決裁会議で確定）
```

### 3.3 v1 §7.3 NoGo 条件 → v2 ドラフト

#### 提案 diff

```diff
 ### 7.3 NoGo 条件
 - B2 で 1 件でも書込成功（既存 PRJ への副作用）
 - B3 で 1 件でも本物 secret 漏洩
 - 7 項目で Critical 指摘 1 件以上残存
 - 副作用ゼロ確認で 1 行でも diff 検出
+- DEC-019-018〜021（ToS allowlist DoD 統合関連）のうち **DEC-019-020（HITL 第 6 種）**が 5/9 までに未決裁 → Phase 1 ループ DoD 設計が成立しないため NoGo
+- **drill #1 シナリオの Sumi/Asagi アイドル運用** (本書 §1.4) に Owner が同意しない → NoGo（drill #1 設計の前提崩壊）
```

---

## 4. 入力資料追加（§0.1）の提案

v1 §0.1 入力資料表に、以下 2 件を追加:

#### 提案 diff

```diff
 ## 0.1 入力資料
 | # | 資料 | 提出元 | 提出期限 |
 |---|---|---|---|
 | 1 | 7 項目の単体検証ログ (`reports/control-evidence/G-XX-evidence.md`) | Dev | 5/8 12:00 |
 | 2 | ペネトレーション風シナリオ B1〜B6 結果 (`reports/control-evidence/pentest/`) | Review | 5/8 17:00 |
 | 3 | 副作用ゼロ確認スクリプト最新ログ | Dev | 5/8 17:00 |
 | 4 | C-A-04 使用量モニタリング進捗 (5/12 期限の中間レポート) | Dev | 5/8 17:00 |
 | 5 | ToS allowlist DoD 統合進捗 (5/10 期限) | Review (起案) + Dev (組込) | 5/8 17:00 |
 | 6 | 開発部門の残課題リスト (W0-2 週へ持ち越し分) | Dev | 5/8 17:00 |
+| 7 | **ToS allowlist DoD 統合 v1 完成版** (`reports/review-tos-allowlist-dod-integration-v1.md`) | Review | **5/3 提出済** |
+| 8 | **BAN drill #1 シナリオ書 v1** (`reports/review-ban-drill-1-scenario.md`) | Review | **5/3 提出済** |
```

---

## 5. 議題タイムテーブル微調整（§1.1）の提案

§5（10 分）が ToS allowlist 完了済になったため、議題 5 を **5 分短縮**して議題 6（Go/NoGo 判定）を **5 分延長**することを提案:

#### 提案 diff

```diff
 ### 1.1 タイムテーブル
 | 時刻 | 議題 | 主担当 | 所要 |
 |---|---|---|---|
 | 18:00-18:05 | 開会、本会議の目的・進行確認 | CEO | 5 分 |
 | 18:05-18:25 | **議題 1**: 7 項目の単体検証結果報告 | Dev → Review 検収 | 20 分 |
 | 18:25-18:40 | **議題 2**: ペネトレーション B1〜B6 結果 | Review | 15 分 |
 | 18:40-18:50 | **議題 3**: W0-2週で残課題と対応 | Dev + PM | 10 分 |
-| 18:50-19:00 | **議題 4**: ToS ホワイトリスト DoD 統合状況確認（5/10 期限） | Review | 10 分 |
-| 19:00-19:10 | **議題 5**: 次マイルストーン確認（5/12 / 5/13） | PM | 10 分 |
-| 19:10-19:25 | **議題 6**: W0-2週進行 Go/NoGo 判定 | CEO 主導、全員 | 15 分 |
-| 19:25-19:30 | 開会、決議内容の `decisions.md` 反映確認 | Secretary | 5 分 |
+| 18:50-18:55 | **議題 4**: ToS ホワイトリスト DoD 統合（5/3 完了報告 + DEC-019-018〜021 決裁） | Review + CEO | **5 分** |
+| 18:55-19:10 | **議題 5**: 次マイルストーン確認（5/12 / 5/13 drill #1 / 5/14 drill #2 起案） | PM + Review | **15 分** |
+| 19:10-19:25 | **議題 6**: W0-2週進行 Go/NoGo 判定 | CEO 主導、全員 | 15 分 |
+| 19:25-19:30 | 閉会、決議内容の `decisions.md` 反映確認 | Secretary | 5 分 |
```

---

## 6. v1 → v1.1 への昇格手順（5/8 当日）

1. **5/8 18:00 会議直前** に Secretary が本書 v2 ドラフトを確認、CEO 承認
2. CEO 承認済の差分を v1 ファイル `review-w0-week1-meeting-agenda.md` に転記して **v1.1** として保存（本書 v2 ドラフトは履歴として残す）
3. v1.1 の確定情報で会議運営、決議内容を 5/8 22:00 までに `decisions.md` に反映
4. 本書 v2 ドラフトは **5/9 以降アーカイブ**、`reports/archive/` への移動は不要（参考資料として残置）

---

## 7. 既存 review-* との整合性チェック（自検）

| 既存ファイル | 整合性 |
|---|---|
| `review-w0-week1-meeting-agenda.md` v1 | 本書は v1 を上書きせず、§5/§6/§7 への差分提案のみ。v1.1 への転記は CEO 承認後 |
| `review-tos-allowlist-dod-integration-v1.md` | 本書 §1 で完成事実を反映、DEC-019-018〜021 起票候補を §1.3 で議題化 |
| `review-ban-drill-1-scenario.md` | 本書 §2.1 で drill 設計反映、Sumi/Asagi アイドル運用を §3.3 NoGo 条件に追加 |
| `review-w0-week1-pentest-scenarios.md` | drill #1 が pentest B6 と重複連動するため §6.2 に整理 |
| `review-control-implementation-plan.md` | C-A-03 BAN drill 1 回目の 5/13 期日と整合 |

---

## 8. 関連ドキュメント

- 親文書（v1）: `projects/PRJ-019/reports/review-w0-week1-meeting-agenda.md`
- 連動: `projects/PRJ-019/reports/review-tos-allowlist-dod-integration-v1.md`（5/3 完成）
- 連動: `projects/PRJ-019/reports/review-ban-drill-1-scenario.md`（5/3 完成）
- 上流: `projects/PRJ-019/reports/review-w0-week1-pentest-scenarios.md`
- 意思決定: `projects/PRJ-019/decisions.md`（DEC-019-018〜025 起票候補）

---

**v2 ドラフト**: 2026-05-03 / **CEO 承認後 v1.1 へ転記**: 2026-05-08 18:00 直前 / **以降本書はアーカイブ**
