# PRJ-019 W0-1週終了時 レビュー会議アジェンダ（5/8 18:00 想定）

- 案件: PRJ-019「Clawbridge（仮）」
- 部署: レビュー部門（品質管理）起案
- 作成日: 2026-05-03
- 開催想定: **2026-05-08 (木) 18:00 JST**
- 出席: CEO（議長）/ PM / Dev / Review / Owner（オブザーバー）
- 所要: 90 分目安
- 関連: `review-w0-week1-verification-checklist.md` / `review-w0-week1-pentest-scenarios.md`

## 0. 会議の目的

W0-1週（5/02〜5/08）で開発部門が並列実装した**ハードガード基盤 7 項目**（G-01 / G-04 / G-05 / G-06 / G-08 / G-V2-03 / G-V2-11）の検収結果を確認し、**W0-2週（5/09〜5/15）への進行 Go / NoGo を判定**する。

## 0.1 入力資料
| # | 資料 | 提出元 | 提出期限 |
|---|---|---|---|
| 1 | 7 項目の単体検証ログ (`reports/control-evidence/G-XX-evidence.md`) | Dev | 5/8 12:00 |
| 2 | ペネトレーション風シナリオ B1〜B6 結果 (`reports/control-evidence/pentest/`) | Review | 5/8 17:00 |
| 3 | 副作用ゼロ確認スクリプト最新ログ | Dev | 5/8 17:00 |
| 4 | C-A-04 使用量モニタリング進捗 (5/12 期限の中間レポート) | Dev | 5/8 17:00 |
| 5 | ToS allowlist DoD 統合進捗 (5/10 期限) | Review (起案) + Dev (組込) | 5/8 17:00 |
| 6 | 開発部門の残課題リスト (W0-2 週へ持ち越し分) | Dev | 5/8 17:00 |

---

## 1. アジェンダ（90 分）

### 1.1 タイムテーブル
| 時刻 | 議題 | 主担当 | 所要 |
|---|---|---|---|
| 18:00-18:05 | 開会、本会議の目的・進行確認 | CEO | 5 分 |
| 18:05-18:25 | **議題 1**: 7 項目の単体検証結果報告 | Dev → Review 検収 | 20 分 |
| 18:25-18:40 | **議題 2**: ペネトレーション B1〜B6 結果 | Review | 15 分 |
| 18:40-18:50 | **議題 3**: W0-2週で残課題と対応 | Dev + PM | 10 分 |
| 18:50-19:00 | **議題 4**: ToS ホワイトリスト DoD 統合状況確認（5/10 期限） | Review | 10 分 |
| 19:00-19:10 | **議題 5**: 次マイルストーン確認（5/12 / 5/13） | PM | 10 分 |
| 19:10-19:25 | **議題 6**: W0-2週進行 Go/NoGo 判定 | CEO 主導、全員 | 15 分 |
| 19:25-19:30 | 開会、決議内容の `decisions.md` 反映確認 | Secretary | 5 分 |

---

## 2. 議題 1: 7 項目の単体検証結果報告（20 分）

### 2.1 報告フォーマット（各項目 2 分目安）
各 ID について Dev が以下を報告:
1. 実装完了日 / 単体テスト件数 / PASS 件数
2. Review 部門の検収結果（Critical / Major / Minor 指摘件数）
3. 残存課題（あれば）
4. W0-2 週への持ち越し有無

### 2.2 検収マトリクス（5/8 17:00 までに Review 起票、会議で確認）
| ID | 単体テスト | コードレビュー | ペネトレーション | 統合可能性 | Review 判定 |
|---|---|---|---|---|---|
| G-01 コスト 4 層 | __/__ PASS | C:__ M:__ m:__ | B1: P/F | OK / NG | **Pass / Conditional / Reject** |
| G-04 HITL 5 ゲート | __/__ PASS | C:__ M:__ m:__ | B4: P/F | OK / NG | Pass / Conditional / Reject |
| G-05 FS allowlist | __/__ PASS | C:__ M:__ m:__ | B2: P/F | OK / NG | Pass / Conditional / Reject |
| G-06 月次予算 | __/__ PASS | C:__ M:__ m:__ | B1: P/F | OK / NG | Pass / Conditional / Reject |
| G-08 secret 隔離 | __/__ PASS | C:__ M:__ m:__ | B3: P/F | OK / NG | Pass / Conditional / Reject |
| G-V2-03 サーキットブレーカ | __/__ PASS | C:__ M:__ m:__ | B6: P/F | OK / NG | Pass / Conditional / Reject |
| G-V2-11 緊急停止 | __/__ PASS | C:__ M:__ m:__ | B5: P/F | OK / NG | Pass / Conditional / Reject |

### 2.3 想定到達点（事前予想、実測で更新）
- **5/8 終了時点で完全 Pass 想定 = 5 項目**: G-04 / G-05 / G-08 / G-V2-03 / G-V2-11
- **条件付き Pass（Console 設定 screenshot 待ち）= 2 項目**: G-01 / G-06
- **Conditional Pass の確定**: 5/12 までに C-A-04 使用量モニタリング検収 + Anthropic Console / OpenAI Platform Spend Cap screenshot 提出（オーナー残タスク）

---

## 3. 議題 2: ペネトレーション B1〜B6 結果（15 分）

### 3.1 報告フォーマット（各シナリオ 2 分目安）
Review が以下を報告:
| シナリオ | 試行件数 | 全件 block | 失敗試行 | 起票 Critical | 起票 Major | W0-2 週へ持ち越し |
|---|---|---|---|---|---|---|
| B1 暴走 API 呼び出し | 5 | __ | __ | __ | __ | — |
| B2 ファイルシステム破壊 | 8 | __ | __ | __ | __ | — |
| B3 secret 漏洩 | 8 | __ | __ | __ | __ | — |
| B4 HITL ゲートバイパス | 8 | __ | __ | __ | __ | — |
| B5 連続稼働超過 | 7 | __ | __ | __ | __ | — |
| B6 BAN 模倣 → フォールバック | 9 (4 必須 + 5 W0-2 へ持越) | __ | __ | __ | __ | B6-06〜B6-09 |

### 3.2 重要判定
- **B2 で 1 件でも書込が成功した場合 → 即時 W0-2 週進行 NoGo**（既存 PRJ への副作用が出た場合は claude-code-company 復旧手順を即発動）
- **B3 で 1 件でも secret 漏洩 → 即時 Critical 起票 + 関連 secret rotate**

---

## 4. 議題 3: W0-2 週で残課題と対応（10 分）

### 4.1 W0-2 週で実装すべき残 14 項目（review-control-implementation-plan §1.2 より）
| ID | 名称 | 担当 | 期限 |
|---|---|---|---|
| G-02 緊急停止スイッチ（kill switch、CLI 統合分） | Dev | 5/15 |
| G-07 secret 隔離 microVM 実装 | Dev | 5/13 |
| G-09 監査ログ全件保存 (Supabase スキーマ + 書込 hook) | Dev | 5/13 |
| G-10 Multi-channel alert + heartbeat | Dev | 5/13 |
| G-11 公開可能アプリ allowlist | PM + Review | 5/13 |
| G-12 既存 PRJ 副作用ゼロ証明 (dry-run × 3) | Dev + Review | 5/15 |
| G-V2-01 並列セッション数 = 1 | Dev | 5/07 (前倒し W0-1 週) |
| G-V2-02 レート自主上限 (5h ウィンドウ 70%) | Dev | 5/12 |
| G-V2-04 指示入力経路の単一化 | Dev | 5/12 |
| G-V2-08 Anthropic 警告メール監視 | Dev | 5/12 |
| G-V2-09 月次 $1,000 自主上限 | Dev | 5/13 |
| G-V2-12 投入経路文書化と監査ログ replay | Dev + Review | 5/13 |
| C-A-01 Sumi/Asagi 完全バックアップ + リストア drill | Dev | 5/15 |
| C-A-02 BAN 検知時退避手順書 + 自動化スクリプト | Review (起案) + Dev (自動化) | 5/15 |
| C-A-05 OAuth 隔離 (OS ユーザー / ACL) | Dev | 5/15 |

### 4.2 W0-2 週着手の前提条件
- W0-1 週ハードガード基盤 7 項目が **完全 Pass または条件付き Pass** であること
- B2 / B3 のペネトレーションで重大失敗がないこと
- C-A-04 使用量モニタリング (5/12) と C-A-03 BAN drill 1 回目 (5/13) のスケジュール再確認

---

## 5. 議題 4: ToS ホワイトリスト DoD 統合状況（10 分）

### 5.1 5/10 期限項目
- 公開可能アプリ allowlist の v1 確定（`projects/PRJ-019/reports/review-tos-domain-allowlist-blocklist.md` v1 採用）
- ニーズ判定スコアリング関数へのジャンル分類器組込（PM v2 §4.1 と整合）
- DoD パスでの「ブラックリスト即棄却 / グレー HITL 必須 / ホワイトリスト 自動公開」の 3 分岐実装方針確定

### 5.2 進捗確認項目
| # | 項目 | 状態（5/8 時点） | 5/10 完成見込み |
|---|---|---|---|
| 1 | allowlist v1 文書 | 完成 (5/3) | ✓ |
| 2 | ジャンル分類器 prompt 仕様 | 進行中 | __% |
| 3 | DoD 3 分岐実装方針 ドラフト | 進行中 | __% |
| 4 | FN-Black 評価方法ドラフト | 未着手 | 5/10 着手 |
| 5 | CEO 個別承認の運用ルール（G-Top-1〜4） | 未着手 | 5/10 着手 |

### 5.3 アクション
- 5/10 までに 5 項目すべて完成、Review が CEO 経由で PM・Dev に提出
- 完成しない場合は **W0-2 週中盤（5/13）に必達**、それでも未完成なら G-11 全体を W0-3 週に押し出す（W0 全体スケジュールは維持）

---

## 6. 議題 5: 次マイルストーン確認（10 分）

### 6.1 5/12 (火) 使用量モニタリング (C-A-04)
| # | アクション |
|---|---|
| 1 | Anthropic / ChatGPT / 内部 dashboard の 3 系統 daily export 動作確認 |
| 2 | R-01〜R-06 異常検知ルール all green |
| 3 | dashboard が CEO + Owner から閲覧可能 (権限制御済) |
| 4 | R-03 / R-04 到達時の自動停止 実機シミュレーション PASS |
| 5 | export 失敗時の手動入力 UI 整備 |

### 6.2 5/13 (水) BAN drill 1 回目 (C-A-03 Drill 1)
| # | アクション |
|---|---|
| 1 | PRJ-019 単独 drill (Sumi/Asagi はアイドル) |
| 2 | 5 ステップ SLA 達成: 検知 < 1 分 / 通知 < 5 分 / 退避 < 30 分 / rotate < 60 分 / 代替起動 < 4 時間 |
| 3 | drill 不合格時は 3 日以内に再 drill、再 drill も不合格なら Phase 1 着手 1 週間延期 |

### 6.3 5/15 (木) W0-2 週終了
- 必須 21 項目 + C-A-01/02/05 完成
- Review 部門の検収レビュー完了

### 6.4 5/16 (金) 〜 5/18 (月) W0-3 週
- 統合検証、BAN drill 2 回目 (5/17, Sumi/Asagi 同居 drill)
- 副作用ゼロ証明、Phase 1 着手 Go/NoGo 最終判定 (5/18 18:00)

---

## 7. 議題 6: W0-2 週進行 Go/NoGo 判定（15 分）

### 7.1 Go 判定基準（全充足要）
| # | 基準 | 5/8 時点充足 |
|---|---|---|
| 1 | 7 項目すべて Critical 指摘ゼロ | Y / N |
| 2 | 7 項目のうち Major 指摘合計 5 件以下、すべて W0-2 週中に修正可能 | Y / N |
| 3 | ペネトレーション B1〜B5 すべて Pass、B6 は W0-1 週分 Pass | Y / N |
| 4 | 副作用ゼロ確認スクリプトが PRJ-001〜018 / organization/ への diff 全件 0 行 | Y / N |
| 5 | C-A-04 (5/12) / C-A-03 Drill 1 (5/13) のリードタイム確保可能 | Y / N |
| 6 | ToS allowlist DoD 統合の 5/10 期限を守れる進捗 | Y / N |
| 7 | 開発部門の残工数試算が現実的 (Dev 2 名相当 × 7 日 で残 14 項目 + α が完了見込み) | Y / N |

### 7.2 Conditional Go 条件
- 1〜2 項目で Major あり、ただし W0-2 週初日（5/9）に修正可能 → **Conditional Go**
- C-A-04 / Drill 1 が 1 日遅延見込み（5/13 / 5/14）→ **Conditional Go**（W0-2 週末 5/15 に再判定）

### 7.3 NoGo 条件
- B2 で 1 件でも書込成功（既存 PRJ への副作用）
- B3 で 1 件でも本物 secret 漏洩
- 7 項目で Critical 指摘 1 件以上残存
- 副作用ゼロ確認で 1 行でも diff 検出

### 7.4 NoGo 時の対応
- W0-2 週進行を **3 日延期**（5/12 まで）
- 原因究明 + 修正完了 + 再ペネトレーション PASS で再判定会議
- 再判定で再 NoGo の場合は **Phase 1 着手 1 週間延期**（W0 終了 5/18 → 5/25）

---

## 8. 決議内容の記録

### 8.1 想定 Decision ID
- **DEC-019-XXX**: W0-1 週検収結果 (Pass / Conditional / Reject)
- **DEC-019-XXX+1**: W0-2 週進行 Go / NoGo 判定
- **DEC-019-XXX+2**: 残課題の優先度・期限調整

### 8.2 議事録保存先
- `projects/PRJ-019/reports/meeting-minutes/2026-05-08-w0-week1-review.md`（Secretary が当日中に作成）

### 8.3 報告ライン
- 議事録ドラフト → 5/8 22:00 までに CEO 経由で Owner 報告
- 翌 5/9 朝に Owner からのフィードバックを反映、確定版を `decisions.md` に転記

---

## 9. 事前準備チェックリスト（5/8 17:00 まで）

| # | 担当 | アクション |
|---|---|---|
| 1 | Dev | 7 項目の単体検証ログ (control-evidence/) 提出 |
| 2 | Dev | 副作用ゼロ確認スクリプト最新実行ログ提出 |
| 3 | Dev | C-A-04 進捗中間レポート提出 |
| 4 | Dev | W0-2 週残課題と工数試算 提出 |
| 5 | Review | ペネトレーション B1〜B6 結果集計提出 |
| 6 | Review | 検収マトリクス（議題 1）入力済 |
| 7 | Review | ToS allowlist DoD 統合進捗チェックリスト 提出 |
| 8 | PM | 5/12 / 5/13 / 5/15 マイルストーンの依存関係マップ 更新 |
| 9 | Secretary | 会議資料の取りまとめ + 招集通知 5/8 12:00 |
| 10 | CEO | 議事進行の事前確認 + 決議事項案の承認準備 |

---

## 10. 関連ドキュメント

- 検証チェックリスト: `projects/PRJ-019/reports/review-w0-week1-verification-checklist.md`
- ペネトレーション風シナリオ: `projects/PRJ-019/reports/review-w0-week1-pentest-scenarios.md`
- 必須コントロール実装計画: `projects/PRJ-019/reports/review-control-implementation-plan.md`
- オプション A 追加コントロール: `projects/PRJ-019/reports/review-option-a-additional-controls.md`
- ToS allowlist/blocklist: `projects/PRJ-019/reports/review-tos-domain-allowlist-blocklist.md`
- 開発部門 W0 計画: `projects/PRJ-019/reports/dev-phase1-w0-implementation-plan.md`

---

**v1 起案**: 2026-05-03 / **次回更新**: 5/8 18:00 会議結果を v1.1 で確定版として反映
