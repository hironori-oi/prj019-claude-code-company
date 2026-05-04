# PRJ-019 MS-2 5/15 trial scenario — needs_scout 起動 + JSON IF dispatch + Owner 通知 + 結果集約 実装可能 spec（Round 11 PM-D deliverable 2）

| 項目 | 内容 |
|---|---|
| 文書 ID | pm-round11-ms2-5-15-trial-scenario |
| 制定日 | 2026-05-04（Round 11 PM-D dispatch 起案） |
| 起票 | PM 部門（PM-D 独立 Agent、general-purpose 経由 dispatch、DEC-019-025 SOP 準拠） |
| 区分 | **MS-2 5/15 trial scenario v1** — PM-ε case-C timeline §2.2 提案を実装可能レベルへ展開（needs_scout 起動 → JSON IF dispatch → Owner 通知 → 結果集約 = 実 needs 1-2 件抽出） |
| 上位決裁（既存維持） | DEC-019-007 / 025 / 050 / 052 / 053 / 055 / 056 / 057 |
| 親文書（破壊しない、差分追加） | `pm-case-c-timeline-final.md`（Round 10 PM-ε deliverable 2、§2.2 MS-2 trial 提案、547 行） |
| 範囲 | 5/13 W1 着手 → 5/15 trial 着手の 2 日間タスク分解 + trial 当日分単位 timeline + 失敗時 immediate rollback 手順 |
| ステータス | **draft v1**（Owner 5/7 朝判断-4 即決時に MS-2 採用判断連動） |

---

## §0 Executive Summary（CEO 向け 200 字以内）

PRJ-019 MS-2 5/15 trial 実装可能 spec。PM-ε case-C timeline §2.2 提案（5/22 公式着手 → 5/15 trial 着手の 7 日前倒し検討、確度 70%）を実装可能レベルへ展開。trial 内容: ① needs_scout 起動 (mock 中心、HN/PH/GitHub Trending fetch) → ② JSON IF dispatch (round-trip 通信成立) → ③ Owner 通知 (Slack push + 中間報告 v1) → ④ 結果集約 (実 needs 1-2 件抽出 + audit log 整合)。失敗ペナルティ 0 担保: trial 失敗時 5/22 公式着手で完全吸収、組織コスト 0。5/13-5/15 2 日間タスク 6 件分解 + 5/15 trial 当日 60 分単位 timeline + 5 失敗パターン rollback 手順。Round 10 末 確度 70% → Round 11 末 80% 押上見込み（drill #2 5/8 朝 Pass + minor 16 補完で）。

---

## §1 MS-2 trial 採用判断と前提

### §1.1 trial 採用判断（Owner 5/7 朝判断-4 即決時）

| 判断要素 | 内容 |
|---|---|
| Owner 5/4 即決「徹底前倒し / 最短スケジュール」 | 5/22 公式着手 → 5/15 trial で **10 日前倒し相当** の即応化 |
| PM-ε case-C timeline §6.2 推奨選択肢 A | 案 C + MS-2 trial 採用 (Lv 4+) = 本命推奨 |
| CEO Round 10 v11 §4 推奨 | MS-2 5/15 trial 採用で「徹底前倒し」要求への即応化 + 失敗ペナルティ 0 |
| 5/7 朝 Owner 即決必要選択肢 | 選択肢 A（案 C + MS-2 trial 採用）= CEO Lv 4+ 推奨 |

### §1.2 前提（Round 10 末確定値）

| 前提 | Round 10 末状態 | 5/13 想定 |
|---|---|---|
| Dev-α needs_scout 49 ギャップ | critical 7 + major 26 = 33 patch 完遂 | minor 16 件 Round 11 Dev-A で補完予定（5/12 EOD） |
| Dev-β tos-monitor | 660 → 1,344 行（4 偽陽性セル抑止 + drill #2 instrumentation 4 export） | 5/12 drill #2 5/8 朝実機検証 Pass 後 PASS 化見込み |
| Dev-γ mock-claw e2e | Full Pass 5 cases (7 段 round-trip + dry-run G-12) | 5/13 W1 着手時点で本番統合確認完遂 |
| 必須コントロール 50 | 35/50 = 70% Conditional Pass | Round 7-A + Round 11 完遂で 78% 見込み |
| API 累積消費 | $0 (Round 10 末) | $0 維持（mock 中心の trial で追加 ≤$2） |

### §1.3 trial 採用前提条件 5 件

| # | 前提条件 | 検証主体 | 期限 |
|---|---|---|---|
| 1 | Owner 5/7 朝判断-4 = 案 C + MS-2 trial 採用（選択肢 A） | Owner | 5/7 09:00 |
| 2 | 5/8 議決-26 Conditional 採択（Lv 4+） | Owner + 全部署 | 5/8 18:00 |
| 3 | MS-1 W1 着手 5/13 達成（確度 85%） | Dev + Review | 5/13 09:00 |
| 4 | 5/13-5/15 W1 期間内 trial 環境構築完遂 | Dev | 5/14 EOD |
| 5 | drill #2 5/8 朝実機検証 Pass で軸-2 +1pt | Review-C (Round 11) | 5/8 EOD |

→ 5 件全件達成時に MS-2 trial 5/15 朝実施。

---

## §2 trial 内容 4 段階（needs_scout → JSON IF → Owner 通知 → 結果集約）

### §2.1 段階 1: needs_scout 起動

#### §2.1.1 needs_scout 起動 spec

| 項目 | 内容 |
|---|---|
| 起動 mode | **mock 中心 + 限定 live fetch**（HN top 10 + PH top 5 + GitHub Trending top 5 = 計 20 record fetch） |
| 起動契機 | trial run 開始時に手動 trigger（Dev による npm script 実行）|
| 13-domain denylist 適用 | DEC-019-010 Object.freeze 完全準拠（critical 7 + major 26 補完済み + minor 16 = 全 49 件適用） |
| HITL 第 9 種 dev_kickoff_approval 直前 needs_scout 起動 | DEC-019-007 整合（mock mode で本番 HITL 起動はしない） |
| API コスト | mock 中心で $0、限定 live fetch で +$0.5-1 想定（DEC-019-050 cap $30 残量フル維持） |
| 出力 | `projects/PRJ-019/app/needs-scout/output/trial-5-15-raw.json`（raw 20 record） |

#### §2.1.2 needs_scout 起動 procedure（Dev 担当）

```
T-0:    npm run needs-scout:trial -- --mode=mock-with-limited-live --output=trial-5-15-raw.json
T-1:    HN top 10 fetch (mock + 5 件 limited live)
T-2:    PH top 5 fetch (mock + 2 件 limited live)
T-3:    GitHub Trending top 5 fetch (mock + 3 件 limited live)
T-4:    13-domain denylist filter 適用 (49 件全件)
T-5:    raw output `trial-5-15-raw.json` 書出
T-6:    audit log SHA-256 hash chain 整合性検証 (DEC-019-054)
T-end:  needs_scout 起動完遂 (想定 wall-clock 5-10 分)
```

#### §2.1.3 needs_scout 起動 DoD

| # | DoD 項目 | 検証主体 |
|---|---|---|
| 1 | 20 record fetch 完遂（mock 12 件 + limited live 8 件） | Dev |
| 2 | 13-domain denylist filter 適用済（filter 後の出力件数明示） | Dev + Review |
| 3 | audit log SHA-256 hash chain 整合 | Review |
| 4 | wall-clock ≤ 10 分 | Dev |
| 5 | API 追加コスト ≤ $1 | Dev |

### §2.2 段階 2: JSON IF dispatch（round-trip 通信成立）

#### §2.2.1 JSON IF dispatch spec

| 項目 | 内容 |
|---|---|
| dispatch 経路 | needs_scout output → JSON IF (Round 9 Dev-A1 着地版) → mock-claw (Dev-γ Round 10 e2e Full Pass 版) → audit log |
| 通信形式 | JSON 形式（Round 9 案 9-B Dev `dev-round9-needs-scout-and-json-if.md` 整合） |
| round-trip 検証 | needs_scout → mock-claw response → needs_scout 受信 = round-trip 通信成立 |
| 失敗時 fallback | dispatch 失敗時 trial 中止 → 5/22 公式着手で完全吸収 |
| 出力 | `projects/PRJ-019/app/json-if/output/trial-5-15-dispatch.json`（dispatch ログ）|

#### §2.2.2 JSON IF dispatch procedure（Dev 担当）

```
T-0:    npm run json-if:dispatch -- --input=trial-5-15-raw.json --target=mock-claw --output=trial-5-15-dispatch.json
T-1:    needs_scout output (20 record - denylist filter 後 約 15 record) → JSON IF へ
T-2:    JSON IF が mock-claw へ dispatch (Dev-γ e2e Full Pass 版 7 段 round-trip)
T-3:    mock-claw が evaluate (mock-claude シナリオ 5 種で評価)
T-4:    mock-claw response → JSON IF → needs_scout
T-5:    round-trip 通信成立確認 (timestamp + hash chain 整合)
T-6:    dispatch ログ `trial-5-15-dispatch.json` 書出
T-end:  JSON IF dispatch 完遂 (想定 wall-clock 10-15 分)
```

#### §2.2.3 JSON IF dispatch DoD

| # | DoD 項目 | 検証主体 |
|---|---|---|
| 1 | round-trip 通信成立 (request + response 両方記録) | Dev |
| 2 | mock-claw evaluate 成功 (5 種シナリオ全完遂) | Dev + Review |
| 3 | audit log hash chain 整合 (DEC-019-054 + Dev-γ Round 10 integrity) | Review |
| 4 | wall-clock ≤ 15 分 | Dev |
| 5 | dispatch 失敗 0 件 (全 record の round-trip 完遂) | Dev |

### §2.3 段階 3: Owner 通知（Slack push + 中間報告 v1）

#### §2.3.1 Owner 通知 spec

| 項目 | 内容 |
|---|---|
| 通知形式 | Slack push (Owner DM) + 中間報告 v1 (Markdown 5 行 サマリ + 詳細リンク) |
| 通知タイミング | 5/15 21:00 JST（trial 結果集約後） |
| Owner 物理拘束 | **5 分**（中間報告 v1 read + acknowledge 即決 or 中止判断） |
| 通知 channel | DEC-019-052 (c) Channel 3 整合（Slack #prj019-owner-trial 想定） |
| 通知内容（5 行サマリ）| ① trial 実施日時、② needs_scout 出力件数、③ 実 needs 抽出件数（1-2 件）、④ JSON IF round-trip 成立有無、⑤ Owner 即決依頼（acknowledge or 中止）|

#### §2.3.2 Owner 通知 procedure（CEO 担当）

```
T-0:    trial 結果集約レポート (本書 §2.4 参照) を CEO が起案 (60 分以内)
T-1:    中間報告 v1 (5 行サマリ + 詳細リンク) を Slack #prj019-owner-trial へ post
T-2:    Owner Slack push 受信
T-3:    Owner 5 分以内に read + acknowledge or 中止判断
T-4:    acknowledge 時: 「OK、5/22 公式着手へ進めて」即決 → MS-3 続行
T-5:    中止判断時: 「trial 課題発見、5/22 公式着手で再 trial」即決 → MS-3 fallback
T-end:  Owner 通知完遂 (想定 wall-clock Owner 物理拘束 5 分)
```

#### §2.3.3 Owner 通知 DoD

| # | DoD 項目 | 検証主体 |
|---|---|---|
| 1 | Slack push 配信成功 | CEO + Owner |
| 2 | 中間報告 v1 5 行サマリ + 詳細リンク 形式整備 | CEO |
| 3 | Owner 5 分以内 acknowledge or 中止判断受領 | Owner |
| 4 | acknowledge 時: MS-3 5/22 公式着手 GO 確定 | CEO |
| 5 | 中止判断時: MS-3 5/22 fallback 確定（組織コスト 0） | CEO |

### §2.4 段階 4: 結果集約（実 needs 1-2 件抽出 + audit log 整合）

#### §2.4.1 結果集約 spec

| 項目 | 内容 |
|---|---|
| 集約対象 | needs_scout output (20 record) + JSON IF dispatch ログ + mock-claw response |
| 実 needs 抽出基準 | mock-claw evaluate 結果が「viable」かつ 13-domain denylist filter PASS かつ HITL 第 9 種 mock approval (mock mode で trial 内自動 approve) |
| 抽出目標件数 | **1-2 件**（DoD 達成基準） |
| 集約レポート | `projects/PRJ-019/reports/dev-trial-5-15-result.md`（200-300 行 想定）|
| audit log 整合 | DEC-019-054 hash chain + Dev-γ Round 10 integrity 検証 |

#### §2.4.2 結果集約 procedure（Dev + PM 担当）

```
T-0:    needs_scout output + JSON IF dispatch ログ + mock-claw response を Dev が集約
T-1:    実 needs 抽出 (mock-claw "viable" + denylist PASS + HITL mock approve)
T-2:    抽出件数 = 1-2 件想定 (target met 判定)
T-3:    集約レポート起案 (Dev + PM)
T-4:    audit log 整合性検証 (Review)
T-5:    集約レポート CEO へ提出 (中間報告 v1 詳細リンク用)
T-end:  結果集約完遂 (想定 wall-clock 60-90 分)
```

#### §2.4.3 結果集約 DoD

| # | DoD 項目 | 検証主体 |
|---|---|---|
| 1 | 実 needs 抽出件数 ≥ 1 件 (DoD 達成基準) | Dev + PM |
| 2 | audit log hash chain 整合 (1 周分) | Review |
| 3 | 集約レポート 200-300 行 + 抽出 needs 詳細記述 | Dev + PM |
| 4 | wall-clock ≤ 90 分 | Dev |
| 5 | 副作用 0 件 (本番 system への影響無) | Review |

---

## §3 5/13-5/15 2 日間タスク分解（W1 着手後 → 5/15 trial 着手まで）

### §3.1 5/13 (火) W1 着手 day 1 タスク

| Slot | 時間 | 担当 | タスク | 工数 | 完遂条件 |
|---|---|---|---|---|---|
| AM-1 | 09:00-10:00 | CEO + Owner | W1 着手 GO 確認会議（Owner 5 分） | 1h | Owner 「OK」即決 |
| AM-2 | 10:00-12:00 | Dev | G-V2-11 OAuth 隔離本番統合 + W1 ハードガード G-01〜G-08 検証 | 2h | 8 件全件本番統合 PASS |
| PM-1 | 13:00-15:00 | Dev | trial 環境構築 (mock-claw mode + dry-run mode + audit log 設定) | 2h | 環境変数 + secret + log 配置完遂 |
| PM-2 | 15:00-17:00 | Dev | needs_scout MVP (Round 9 Dev-A1 着地版) trial mode 動作確認 | 2h | mock fetch 20 record 成功 |
| PM-3 | 17:00-18:00 | Review | W1 着手 day 1 進捗 sign-off + 5/14 残務確認 | 1h | sign-off 完遂 |
| 累計 | 5/13 | — | — | **8h** | day 1 完遂 |

### §3.2 5/14 (水) W1 期間 day 2 タスク（trial 着手前日）

| Slot | 時間 | 担当 | タスク | 工数 | 完遂条件 |
|---|---|---|---|---|---|
| AM-1 | 09:00-11:00 | Dev | JSON IF dispatch trial mode 動作確認（Round 9 案 9-B 着地版） | 2h | round-trip 通信 dummy data Pass |
| AM-2 | 11:00-12:00 | Dev | mock-claw e2e Round 10 Dev-γ Full Pass 5 cases trial mode 動作確認 | 1h | 5 cases 全 PASS |
| PM-1 | 13:00-15:00 | Dev + Review | tos-monitor (Round 10 Dev-β 1,344 行) trial mode 起動確認 | 2h | 4 detector + 2 hooks 起動 OK |
| PM-2 | 15:00-17:00 | Dev | trial run rehearsal (dummy data で全 4 段階 1 周完遂) | 2h | rehearsal 1 周 wall-clock ≤ 60 min |
| PM-3 | 17:00-18:00 | PM + CEO | trial 5/15 朝実施 GO 判定 + 失敗時 rollback 手順 final 確認 | 1h | GO 判定 + rollback 手順 acknowledge |
| 累計 | 5/14 | — | — | **8h** | day 2 完遂 |

### §3.3 5/13-5/14 2 日間タスク 6 件 サマリ

| # | タスク | 担当 | 工数 | 期限 |
|---|---|---|---|---|
| 1 | W1 期間 (5/13-5/15) 内 G-01〜G-08 本番統合検証 | Dev | 2h | 5/13 12:00 |
| 2 | trial run 環境構築 (mock-claw mode + dry-run mode + audit log) | Dev | 2h | 5/13 EOD |
| 3 | needs_scout + JSON IF + mock-claw + tos-monitor の trial mode 動作確認 | Dev + Review | 7h | 5/14 17:00 |
| 4 | trial run rehearsal (dummy data 1 周) | Dev | 2h | 5/14 17:00 |
| 5 | trial 5/15 朝実施 GO 判定会議 | PM + CEO | 1h | 5/14 18:00 |
| 6 | 失敗時 rollback 手順 final 確認 | PM + Dev + Review | 1h | 5/14 18:00 |

→ 計 15h 工数（Dev 12h + Review 2h + PM 1h）/ 5/13-5/14 2 日間で完遂可能。

---

## §4 5/15 (木) trial 当日 60 分単位 timeline（分単位 timeline）

### §4.1 5/15 trial 当日 timeline final（120 分版）

| Slot | 分単位時刻 | 担当 | タスク | 完遂条件 |
|---|---|---|---|---|
| **段階 0: 準備 (15 分)** | | | | |
| 0-1 | 09:00-09:05 | Dev + Review | trial run 開始前 環境変数 + secret 確認 | 環境正常 |
| 0-2 | 09:05-09:10 | Dev | trial run 開始 GO 宣言 + audit log 開始 | log timestamp 開始 |
| 0-3 | 09:10-09:15 | PM | trial run 起動 trigger acknowledge | trigger 配信 |
| **段階 1: needs_scout 起動 (10 分)** | | | | |
| 1-1 | 09:15-09:20 | Dev | npm run needs-scout:trial 実行 | mock + limited live fetch 開始 |
| 1-2 | 09:20-09:23 | Dev | HN top 10 fetch + denylist filter | filter 後出力件数記録 |
| 1-3 | 09:23-09:25 | Dev | PH top 5 fetch + denylist filter | filter 後出力件数記録 |
| 1-4 | 09:25-09:25 | Dev | GitHub Trending top 5 fetch + denylist filter | filter 後出力件数記録 |
| 1-5 | 09:25-09:25 | Dev | raw output `trial-5-15-raw.json` 書出 + hash chain | output ファイル整合 |
| **段階 2: JSON IF dispatch (15 分)** | | | | |
| 2-1 | 09:25-09:30 | Dev | npm run json-if:dispatch 実行 | dispatch 開始 |
| 2-2 | 09:30-09:35 | Dev | mock-claw 7 段 round-trip × 15 record | round-trip 全成功 |
| 2-3 | 09:35-09:40 | Dev | mock-claw evaluate 5 種シナリオ × 15 record | evaluate 全成功 |
| 2-4 | 09:40-09:40 | Dev | dispatch ログ `trial-5-15-dispatch.json` 書出 + hash chain | log 整合 |
| **段階 3: 結果集約 (60 分)** | | | | |
| 3-1 | 09:40-10:10 | Dev | 実 needs 抽出 (viable + denylist PASS + HITL mock approve) | 抽出件数 ≥ 1 件 |
| 3-2 | 10:10-10:30 | Dev + PM | 集約レポート起案 (200-300 行) | レポート draft 完成 |
| 3-3 | 10:30-10:40 | Review | audit log hash chain 整合性検証 (1 周分) | 整合 PASS |
| **段階 4: Owner 通知 (20 分、Owner 物理拘束 5 分のみ)** | | | | |
| 4-1 | 10:40-10:50 | CEO | 中間報告 v1 (5 行サマリ + 詳細リンク) 起案 | サマリ完成 |
| 4-2 | 10:50-10:55 | CEO | Slack #prj019-owner-trial post | post 配信 |
| 4-3 | 10:55-11:00 | Owner | 5 行サマリ read + 詳細リンク確認 | Owner read 完遂 |
| 4-4 | 11:00-11:00 | Owner | acknowledge or 中止判断即決 | 即決受領 |
| **段階 5: trial 終了 (5 分)** | | | | |
| 5-1 | 11:00-11:05 | CEO + PM | trial 結果 acknowledge + 5/22 MS-3 GO 確定 (or fallback) | acknowledge 完遂 |
| **計** | **09:00-11:05** | — | — | **wall-clock 125 分（バッファ込 120-130 分）** |

### §4.2 trial 当日 主要 KPI

| KPI | 目標値 | Round 10 末確度 | 達成判定基準 |
|---|---|---|---|
| needs_scout 出力件数 | 20 record fetch + denylist filter 後 ≥ 12 件 | 95% | 20 record × 80% denylist Pass = 16 件 |
| JSON IF round-trip 成立 | 全 record 成功 | 90% | 15 record × 100% = 15 件 |
| 実 needs 抽出件数 | 1-2 件 | 75% | mock-claw "viable" 判定 ≥ 1 件 |
| audit log hash chain 整合 | 1 周分整合 | 95% | hash chain 不整合 0 件 |
| Owner 物理拘束 | 5 分以内 | 95% | Slack push → acknowledge 5 分以内 |
| trial wall-clock | ≤ 120 分 | 80% | 125 分以内（5 分バッファ込み）|
| API 追加コスト | ≤ $2 | 95% | mock 中心 + limited live |
| 副作用 0 件 | 本番 system への影響 0 | 95% | dry-run mode + mock-claw mode |

---

## §5 失敗時 immediate rollback 手順（5 失敗パターン）

### §5.1 失敗パターン 1: needs_scout 起動失敗

| 失敗内容 | wall-clock 09:15-09:25 で fetch 失敗 (5 record 未満) |
|---|---|
| 検出 | Dev による wall-clock 監視（09:25 時点で fetch < 5 件） |
| **immediate rollback (5 分)** | trial 中止 → trial run 終了 → audit log timestamp 終了 → 中間報告 v1 を「trial 中止 - needs_scout fetch 失敗」で起案 |
| Owner 通知 | 中間報告 v1 で「needs_scout 起動課題、5/22 公式着手で再評価」即決依頼 |
| 5/22 fallback | MS-3 5/22 公式着手で needs_scout 完遂を吸収（組織コスト 0） |

### §5.2 失敗パターン 2: JSON IF dispatch round-trip 失敗

| 失敗内容 | wall-clock 09:30-09:40 で round-trip 通信失敗 (5 record 未満で round-trip 成立) |
|---|---|
| 検出 | Dev による wall-clock 監視（09:40 時点で round-trip 成立 < 5 件） |
| **immediate rollback (5 分)** | trial 中止 → JSON IF dispatch 中断 → audit log timestamp 終了 → mock-claw process kill |
| Owner 通知 | 中間報告 v1 で「JSON IF round-trip 課題、5/22 公式着手で再 trial」即決依頼 |
| 5/22 fallback | MS-3 5/22 公式着手で JSON IF + mock-claw 完遂を吸収 |

### §5.3 失敗パターン 3: 実 needs 抽出 0 件（DoD 未達）

| 失敗内容 | wall-clock 10:10 時点で実 needs 抽出件数 = 0 件 (DoD 達成基準 1 件以上 未達) |
|---|---|
| 検出 | Dev による集約結果検証（10:10 時点で抽出 0 件） |
| **immediate rollback (15 分)** | trial 結果を「DoD 未達」と判定 → 中間報告 v1 で「実 needs 抽出 0 件、5/22 公式着手で再 trial」即決依頼 |
| Owner 通知 | 中間報告 v1 で「mock-claw evaluate 結果が viable 判定 0 件、shop list 拡大 or evaluate logic 改善 を 5/22 までに完遂予定」 |
| 5/22 fallback | MS-3 5/22 公式着手で needs_scout 本実装 + evaluate logic 拡張で吸収（needs_scout 本実装は HN/PH/GitHub Trending API 本番化）|

### §5.4 失敗パターン 4: audit log hash chain 不整合

| 失敗内容 | wall-clock 10:30-10:40 で hash chain 不整合検出（DEC-019-054 違反） |
|---|---|
| 検出 | Review による hash chain 整合性検証（10:30 時点で不整合検出） |
| **immediate rollback (10 分)** | trial 結果を「audit log 不整合 = trial 結果無効」と判定 → audit log dump + 不整合箇所特定 → mock-claw process kill |
| Owner 通知 | 中間報告 v1 で「audit log 不整合検出、Dev-γ Round 10 integrity 拡張を 5/22 までに完遂予定、本 trial 結果は無効化」 |
| 5/22 fallback | MS-3 5/22 公式着手で audit log integrity 完全準拠版で再 trial（Dev-C Round 11 hash chain integrity 検証 + recovery e2e 拡張完遂版）|

### §5.5 失敗パターン 5: trial wall-clock 超過（120 分超過）

| 失敗内容 | wall-clock 11:05 時点で trial 未完遂 (≥ 120 分超過) |
|---|---|
| 検出 | PM による wall-clock 監視（11:05 時点で trial 未完遂） |
| **immediate rollback (5 分)** | trial 強制中止 → 進行中 process kill → audit log timestamp 終了 |
| Owner 通知 | 中間報告 v1 で「trial wall-clock 超過、SLA 化検証を 5/22 公式着手まで延期」即決依頼 |
| 5/22 fallback | MS-3 5/22 公式着手で needs_scout 本実装 + JSON IF + mock-claw の SLA 化検証を吸収 |

### §5.6 5 パターン共通: 失敗時組織コスト = 0

| 区分 | 失敗時コスト |
|---|---|
| Owner 物理拘束追加 | 5 分のみ（中間報告 v1 read + 中止判断即決） |
| 5/22 公式着手 fallback | 完全吸収（W1 期間 5/13-5/19 内に課題発見 + W2 5/20-5/26 で吸収可能） |
| 案 C ハイブリッド timeline 影響 | **0 日延期**（MS-3 5/22 公式着手は変更なし） |
| Phase 1 sign-off 6/3 影響 | **0 日延期**（MS-4' 6/3 公式 sign-off は変更なし） |
| Marketing 公開 6/27 朝影響 | **0 日延期**（MS-5 6/27 朝公開は変更なし） |

→ **MS-2 trial 失敗ペナルティ = 0** = 「やめても損しない」設計（PM-ε case-C timeline §2.2.5 整合）。

---

## §6 成功判定 final（DoD 連動）

### §6.1 trial 成功判定基準（3 件全件達成で trial 成功）

| 判定基準 | 内容 | DoD 連動 |
|---|---|---|
| 成功-1 | needs_scout 出力件数 ≥ 1 件（実 needs 抽出 1 件以上、§2.4.3 #1） | DoD #1 |
| 成功-2 | JSON IF round-trip 通信成立（dispatch 成功 ≥ 1 件、§2.2.3 #1） | DoD #1 |
| 成功-3 | audit log 整合（hash chain 整合 + 副作用 0、§2.4.3 #2 + #5） | DoD #1 |

### §6.2 部分成功（成功 2 件中達成）

| 部分成功シナリオ | 帰結 |
|---|---|
| 成功-1 + 成功-2 達成、成功-3 不整合 | trial 結果を「audit log 不整合」と判定 → 5/22 公式着手で再 trial |
| 成功-1 + 成功-3 達成、成功-2 dispatch 失敗 | trial 結果を「JSON IF 課題」と判定 → 5/22 公式着手で再 trial |
| 成功-2 + 成功-3 達成、成功-1 抽出 0 件 | trial 結果を「実 needs 抽出 0 件」と判定 → 5/22 公式着手で needs_scout 本実装で吸収 |

### §6.3 完全成功時の trial 成功 acknowledge

| Step | 内容 | 担当 |
|---|---|---|
| 1 | trial 成功 3 件全件達成 acknowledge | CEO + PM + Review |
| 2 | 中間報告 v1 で「trial 成功、5/22 公式着手 GO 確定」 | CEO |
| 3 | Owner Slack push acknowledge | Owner |
| 4 | MS-3 5/22 公式着手 GO 確定 | CEO |
| 5 | dashboard 更新（MS-2 trial 成功 反映） | Secretary-F |

---

## §7 trial 確度 70% → 80% 押上見込み根拠（Round 10 末 → Round 11 末）

### §7.1 Round 10 末 確度 70% の根拠（PM-ε case-C timeline §2.2.4）

| 寄与要素 | 確度寄与 |
|---|---|
| Round 10 R10-2 mock-claw e2e 5 cases PASS | +25% |
| W1 着手 5/13 確度 85% × 2 日内の trial 環境構築完遂 | +20% |
| dry-run mode 副作用 0 確認 (Round 9 Review-B 着地) | +15% |
| Owner 中間報告 v1 受容 (5/4 即決パターン継続) | +5% |
| 失敗時 5/22 公式着手で吸収可能 (前倒し失敗ペナルティなし) | +5% |
| **計** | **70%** |

### §7.2 Round 11 末 確度 80% 押上見込みの追加寄与要素

| 追加寄与要素 | 確度寄与 (Round 11 末) |
|---|---|
| Round 11 Dev-A: minor 16 件 denylist 補完完遂 (5/12 EOD) | +3% |
| Round 11 Dev-B: tos-monitor high 4 セル primitive + multi-process 独立確証 | +3% |
| Round 11 Dev-C: mock-claw e2e に audit hash chain integrity 検証 + recovery e2e 拡張 | +2% |
| Round 11 Review-C: drill #2 5/8 朝実機検証 Pass + 偽陽性 matrix v2.0 | +2% |
| **小計（Round 11 完遂による追加寄与）** | **+10%** |
| **Round 11 末 確度** | **80%** |

### §7.3 Round 11 完遂後の trial 5/15 朝実施 GO 判定

| 判定要素 | 達成判定基準 |
|---|---|
| Round 11 8 並列 dispatch 完遂 | 5/8 EOD（CEO Round 10 v11 §6 expected） |
| drill #2 5/8 朝実機検証 Pass | 5/8 EOD（軸-2 +1pt 即時 PASS）|
| MS-1 W1 着手 5/13 達成 | 5/13 09:00（確度 85%）|
| 5/13-5/14 2 日間タスク 6 件完遂 | 5/14 18:00 |
| 5/15 朝 GO 判定会議 | 5/14 18:00（PM + CEO）|

→ 5 件全件達成時 = **trial 5/15 朝実施 GO 確定（確度 80%）**。

---

## §8 結論（DoD 達成判定）

1. **trial 内容 4 段階確定** (§2.1-§2.4): needs_scout 起動 → JSON IF dispatch → Owner 通知 → 結果集約 (実 needs 1-2 件抽出 + audit log 整合)。
2. **5/13-5/14 2 日間タスク 6 件分解完遂** (§3): 計 15h 工数で完遂可能。
3. **5/15 trial 当日 120 分単位 timeline 確定** (§4.1): 5 段階 + 主要 KPI 8 件 + Owner 物理拘束 5 分のみ。
4. **失敗時 immediate rollback 手順 5 パターン明文化** (§5.1-§5.5): 失敗ペナルティ 0 担保。
5. **trial 失敗時 5/22 MS-3 公式着手 fallback 完全吸収可能** (§5.6): 案 C ハイブリッド timeline 0 日延期 + Phase 1 sign-off 6/3 0 日延期 + Marketing 公開 6/27 0 日延期。
6. **成功判定 3 件全件達成 = trial 成功** (§6.1): 部分成功時も 5/22 公式着手で吸収。
7. **Round 10 末 確度 70% → Round 11 末 80% 押上見込み根拠明示** (§7.1-§7.3): Round 11 8 並列完遂 + drill #2 5/8 朝 Pass で +10%。
8. **DoD 全件達成判定** = MS-2 trial scenario 実装可能 spec 完遂。

---

## §9 関連決裁・参照

### §9.1 反映決裁

- DEC-019-007 (HITL 11 種、第 9 種 dev_kickoff_approval 直前 needs_scout 起動)
- DEC-019-010 (13-domain denylist Object.freeze、Round 10 Dev-α + Round 11 Dev-A 完全準拠)
- DEC-019-025 (Agent tool permissions SOP、本書も general-purpose 経由 dispatch 遵守)
- DEC-019-050 (Anthropic spend cap $30、trial 追加コスト ≤$2 維持)
- DEC-019-052 (c) (Channel 3、Slack #prj019-owner-trial)
- DEC-019-053 (2-tier env、trial mode は dev tier)
- DEC-019-054 (Round 7 ハッシュチェイン、trial audit log 整合性検証)
- DEC-019-055 (Round 8 Plan 8-Full、prefetch 50-55% 完遂前提)
- DEC-019-056 (Round 9 起票済、trial は議決-26 採択前提で起動)
- DEC-019-057 (Owner 判断-4 結果議決、trial 採用判断連動)

### §9.2 参照書

- `pm-case-c-timeline-final.md`（Round 10 PM-ε deliverable 2、§2.2 MS-2 trial 提案、547 行）
- `pm-round11-decision-26-final-confirmation.md`（Round 11 PM-D deliverable 1、本書と同 dispatch）
- `ceo-round10-integrated-report-v11.md`（CEO Round 10 統合報告 v11、200 行）
- `dev-round9-needs-scout-and-json-if.md`（Round 9 案 9-B Dev、needs_scout MVP + JSON IF 着地）
- `dev-round10-mock-claw-e2e-report.md`（Round 10 Dev-γ、mock-claw e2e Full Pass 5 cases）

### §9.3 Risk Register v3.2 整合

- R-019-06 (BAN 30-60% / 12 ヶ月): trial mock 中心で BAN リスクなし
- R-019-09 (NG-3 24/7 監視): tos-monitor 1,344 行で trial 期間中 24/7 監視継続
- R-019-10 (重要分野ホワイトリスト未確定): trial で minor 16 件 denylist 検証可能
- R-RUSH-01〜04: trial 失敗時組織コスト 0 で R-RUSH 系発動なし

### §9.4 並列他 7 Agent との整合

| Agent | 接続点 | 整合状態 |
|---|---|---|
| Dev-A (Round 11) | minor 16 件 denylist 補完 → trial denylist filter 完全準拠 | 整合 |
| Dev-B (Round 11) | Dev-β 残実装 → trial tos-monitor + multi-process 独立確証 | 整合 |
| Dev-C (Round 11) | mock-claw e2e audit hash chain integrity → trial audit log 整合 | **整合（重要、§5.4 失敗パターン直結）** |
| Review-C (Round 11) | drill #2 5/8 朝実機検証 → trial 起動前提軸-2 PASS | 整合 |
| **PM-D (本書担当)** | trial scenario 実装可能化 | — |
| Marketing-E (Round 11) | timeline cards 設計 → trial 成功 narrative 反映 | 整合 |
| Secretary-F (Round 11) | DEC-019-058 起票 → trial 成功 acknowledge | 整合 |
| Knowledge-G (Round 11) | patterns / pitfalls 追加抽出 → trial 失敗パターン 5 件 知見化 | 整合 |

---

## フッタ — 改版履歴

| 版 | 日付 | 起案 | 主要変更 |
|---|---|---|---|
| v1 | 2026-05-04（Round 11 PM-D dispatch 起案） | PM 部門（PM-D 独立 Agent） | 初版（MS-2 5/15 trial scenario 実装可能化、4 段階 + 5/13-5/14 2 日間タスク 6 件分解 + 5/15 当日 120 分 timeline + 失敗時 rollback 5 パターン + 確度 70% → 80% 押上見込み）|

**v1 確定**: 2026-05-04（Round 11 PM-D dispatch 完遂時） / **採用判断**: 5/7 朝 Owner 判断-4（選択肢 A）+ 5/8 議決-26 Conditional 採択時 / **次回更新**: 5/13 W1 着手後 v1.1（trial 環境構築完遂反映） / 5/15 trial 完遂後 v1.2（trial 結果反映）

## フッタ詳細

- 文書: `projects/PRJ-019/reports/pm-round11-ms2-5-15-trial-scenario.md`
- 版: v1（2026-05-04、Round 11 PM-D 担当 deliverable 2）
- 起案: PM 部門（PM-D 独立 Agent）
- 範囲: MS-2 5/15 trial 実装可能 spec + 2 日間タスク分解 + 当日 120 分 timeline + 失敗時 rollback + 確度押上見込み
- 検収: CEO（Round 11 commit 時）+ Owner（5/7 朝判断-4 即決時）+ Dev/Review（5/13 W1 着手 + 5/15 trial 実施時）
