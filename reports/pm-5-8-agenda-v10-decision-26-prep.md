最終更新: 2026-05-04 深夜（Round 9 起動時）/ 起案: PM 部門 / 実施責任: PM Agent (PM-C 担当) / 版: v1（5/8 議題 v9 → v10 update + 議決-26 追加準備）

# PRJ-019 5/8 議題 v9 → v10 update（議決-26「実運用着手 Go」追加準備、Owner 5/7 朝最終提示版）

- 案件: PRJ-019「Clawbridge」 — Open Claw を Owner-in-the-loop オーナーとする AI 組織ハーネス基盤
- 部署: PM 部門（Round 9 PM-C 担当 deliverable 3）
- 作成日: 2026-05-04 深夜（Round 9 案 9-C 起動時）
- 版: **v1（v9 議題 21 件構造に議決-26 = 「実運用着手 Go」を追加する v10 案、Round 9-10 完遂結果次第で正式追加 / 見送り判断）**
- 入力資料（必読、本書冒頭の優先順）:
  - `pm-round9-10-2day-sprint-plan.md`（本日同 Round 9 起案、deliverable 1）
  - `pm-phase1-transition-plan-v1.md`（本日同 Round 9 起案、deliverable 2）
  - `secretary-5-8-meeting-package-v9.md`（Round 7 着地、議題 21 件 35-45 分版、500 行）
  - `secretary-agenda-v7.md`（議題 v7、議決 20 件原本）
  - `pm-phase1-plan-v3.md`（Round 7 着地、Phase 1 計画 v3）
- 反映決裁:
  - DEC-019-007 / 033 / 050 / 051 / 052 / 053 / 054 / 055
  - **DEC-019-056（起票予定）**: Round 9-10 集中スプリント採択 + 案 C 採択 + 5/22 朝公開前倒し可否評価条項

---

## §0 本書の目的（一行サマリ）

**「議題 v9 (35-45 分版、DEC-019-054 採択済 21 議決) に議決-26『実運用着手 Go』を追加する形で v10 案を作成し、Owner 5/7 朝に最終提示する版を準備する。Round 9-10 完遂結果次第で正式追加 or 見送りを判断する仕組み付き」**。

---

## §1 議決-26 議題文案（200-400 字、Round 9-10 成果反映、DEC-019-056 起票根拠への参照）

### §1.1 議決-26 タイトル

**「議決-26: Phase 1 W1 実運用着手 Go (5/13 前倒し採択 + 案 C ハイブリッド timeline 採用)」**

### §1.2 議題文案（300 字）

```
PRJ-019 Clawbridge Phase 1 W1 実運用着手を 2026-05-13（火）へ前倒し採択する。
Round 9-10 集中スプリント (5/4-5/6) 完遂で Phase 1 W2/W3/W4 想定スコープの
prefetch 比率が 50-55% に到達し、必須コントロール 50 中 30-33 件達成 + mock-claw
end-to-end run + dry-run 副作用ゼロ証明 + BAN drill harness dry execution の 4 点
が実装検証完了済となる。これらを根拠に W1 着手 5/19 → 5/13 への 6 日前倒し +
Phase 1 sign-off 6/20 → 6/3 への 17 日前倒し + Marketing 公開 6/27 朝維持の
案 C ハイブリッド timeline を採択する。DEC-019-056 として 5/6 夜起票予定。
議決-26 採択前提条件 5 軸全 PASS 確認: ① mock-claw dry execution Pass
② BAN drill #1 dry execution Pass ③ 必須コントロール 50 達成度 ≥ 95%
④ API 消費 ≤$30 維持 ⑤ Owner 残動作 0 件継続。
```

### §1.3 議題文案の根拠 cross-ref

- 案 C ハイブリッド = `pm-phase1-transition-plan-v1.md` §6 + §7
- prefetch 50-55% = 同 §3.2
- 必須コントロール 50 中 30-33 件 = 同 §4.4
- mock-claw end-to-end + dry-run + BAN drill harness = `pm-round9-10-2day-sprint-plan.md` §2 + §3
- DEC-019-056 = 同 §11.1

### §1.4 起票部署 + 推奨

- 起票部署: PM + Review 連名
- 推奨: **YES**（採択）
- 推奨度: Lv 4「強く推奨、ただし条件付き」（条件 = §2 採択前提条件 5 軸全 PASS）

---

## §2 議決-26 採択条件 5 軸

### §2.1 採択条件 5 軸の定義

| 軸 | 条件 | 検証時刻 | 検証主体 |
|---|---|---|---|
| **軸-1** | mock-claw dry execution Pass | 5/6 夜 (Round 10 R10-2 完遂時) | Dev + Review |
| **軸-2** | BAN drill #1 dry execution Pass | 5/6 夜 (Round 9 G-07 検証時) | Review |
| **軸-3** | 必須コントロール 50 達成度 ≥ 95% | 5/8 朝 (Review 部門 final 検証) | Review |
| **軸-4** | API 消費 ≤$30 維持 | 5/8 朝 (cost-tracker.ts watchdog 確認) | Dev |
| **軸-5** | Owner 残動作 0 件継続 | 5/8 朝 (Spend Cap 設定 + Round 9-10 期間 Owner 物理拘束 23 分以内確認) | CEO |

### §2.2 軸-1: mock-claw dry execution Pass の詳細

- **検証内容**: Round 10 R10-2 で「needs_scout (mock) → 提案生成 (mock) → CEO 判定 → Dev 実装 (mock) → review (mock) → audit log」の end-to-end 5 phase が wall-clock < 60min / cost < $5 / 副作用 0 件で完走
- **Pass 基準**: 5 phase 全 PASS + audit log SHA-256 hash chain 整合 + dry-run mode 兼用での副作用 0 確認
- **Fail 時影響**: 議決-26 採択不可、案 C → 案 B (現行) へ fallback

### §2.3 軸-2: BAN drill #1 dry execution Pass の詳細

- **検証内容**: Round 7 で実装完遂済の BAN drill harness 3 シナリオを dry execution（実 BAN なし、mock BAN 検知 → emergency_stop → P-E フォールバック → 復旧の 3 段階）で完走
- **Pass 基準**: 3 シナリオ全 PASS + RTO < 4h 想定値達成
- **Fail 時影響**: 議決-26 採択不可 + 5/13 BAN drill #1 実 drill 実施延期

### §2.4 軸-3: 必須コントロール 50 達成度 ≥ 95% の詳細

- **検証内容**: `review-mandatory-controls-50-final.md` (Round 7 起案、501 行) の 50 件中、Round 9-10 完遂時点で達成済 件数を Review 部門が再検証
- **想定達成率**: 5/8 朝時点で 47-48 件 (94-96%) = ≥ 95% 基準達成可能
- **Pass 基準**: ≥ 95% (= 48 件以上達成)
- **Fail 時影響**: 議決-26 採択不可 + 残 件数を W0-Week2 5/9-5/18 で消化後再評価

### §2.5 軸-4: API 消費 ≤$30 維持 の詳細

- **検証内容**: cost-tracker.ts watchdog (Round 6 G-04 実装) の三段階閾値 ($24/$28.5/$30) で月次 API 消費を確認
- **想定消費額**: 5/4-5/8 期間 = $5-10 想定 (Round 9-10 mock 中心、実 API 消費少)
- **Pass 基準**: 6/1 リセットまでの累積 ≤ $30 + 三段階閾値全 GREEN
- **Fail 時影響**: 議決-26 採択不可 + W1 着手 5/13 前倒し → 5/19 維持

### §2.6 軸-5: Owner 残動作 0 件継続 の詳細

- **検証内容**: Round 9-10 期間 Owner 物理拘束 23 分以内 + Spend Cap 設定 (Anthropic Hard $50 / OpenAI Hard $20) 5/6 夜までに完了
- **Pass 基準**: Owner 23 分以内 + Spend Cap 設定完了
- **Fail 時影響**: 議決-26 採択不可 + W1 着手 5/13 前倒し再評価

### §2.7 5 軸採択判定マトリクス

| シナリオ | 軸-1 | 軸-2 | 軸-3 | 軸-4 | 軸-5 | 結果 |
|---|---|---|---|---|---|---|
| 全 PASS | PASS | PASS | PASS | PASS | PASS | **議決-26 採択 + 案 C 推奨** |
| 1 軸 FAIL | PASS | PASS | PASS | PASS | FAIL | **議決-26 見送り (§3 fallback)** |
| 2 軸以上 FAIL | — | — | — | — | — | **議決-26 見送り + 案 B 維持** |

---

## §3 議決-26 否決時 fallback（5/8 では追加せず、5/30 NG-3 議決とパッケージ化）

### §3.1 否決時 fallback 構造

| F-N | 内容 | 5/8 議事影響 | 後続議決タイミング |
|---|---|---|---|
| **F-1** | **5/8 議決-26 見送り → 5/30 NG-3 議決とパッケージ化（W2 終了時にまとめて議決）** | **議事時間 35-45 分維持 (v9 通り)** | 5/30 W2 終了時 |
| F-2 | Round 9-10 deliverable は staged のまま、Phase 1 W1-W4 で活用するが「実運用着手」自体は 5/19 維持 | 同上 | 5/19 W1 着手で自動評価 |
| F-3 | Phase 2 plan v1 §0.2「最大 1 週間前倒し 6/24 → 6/17 候補」評価のみ Round 9-10 で先行 | 同上 | 6/13 Phase 1 完了時 |

### §3.2 F-1 推奨理由

- 5/30 NG-3 議決 (DEC-019-008 NG-3 暫定値再確認) と議決-26 (実運用着手 Go) は **W2 終了時の運用実績ベース判断** で構造的に近い
- 両議決を 5/30 でまとめて採決することで Owner 物理拘束を 5/8 (35-45 分) + 5/30 (10 分 → 30 分) に集約
- Round 9-10 完遂 deliverable は staged のままで Phase 1 W1-W4 で活用 = 組織コスト無駄なし

### §3.3 F-1 採択時の 5/30 議決パッケージ構造

| 議決 | 内容 | 議事時間 |
|---|---|---|
| 議決-26 (5/30 移送版) | 実運用着手 Go (5/30 → 6/3 までの実績ベース判定) | 10 分 |
| 議決-27 (5/30 議決-NG-3 既存) | DEC-019-008 NG-3 暫定値再確認 | 10 分 |
| **計** | — | **20 分** (Round 6 圧縮効果込) |

---

## §4 5/8 議事時間影響: 35-45 → 50-60 分試算（議決-26 議論 10-15 分追加分の内訳）

### §4.1 v9 → v10 議事時間変動

| 区分 | v9 (現状) | **v10 (議決-26 追加時)** | 差分 |
|---|---|---|---|
| §1 開催情報確認 | 1 分 | 1 分 | 0 |
| §2 W0-Week1 進捗報告 | 5 分 | **6 分** (Round 9-10 完遂報告 +1 分) | +1 |
| §6 議決 21 件採決 (A 11 + B 5 + C 5) | 30 分 | 30 分 | 0 |
| **§6.1 議決-26 (新規追加)** | — | **10-15 分** | **+10〜15** |
| §7 質疑応答 | 5 分 | **5-7 分** (議決-26 関連質疑 +0-2 分) | +0-2 |
| §8 締め | 2 分 | 2 分 | 0 |
| **計** | **43-48 分** (バッファ込 35-45 分目安) | **51-58 分** (バッファ込 50-60 分目安) | **+8-10 分 (実議事) / +15 分 (バッファ込)** |

### §4.2 議決-26 議論 10-15 分の内訳

| 区分 | 時間 | 内容 |
|---|---|---|
| §6.1.1 議題文案読了 (Owner 事前承認エビデンス確認) | 0-1 分 | DEC-019-056 起票根拠 + Round 9-10 完遂報告 |
| §6.1.2 CEO 推奨案提示 | 2 分 | 案 C ハイブリッド推奨 + 採択前提 5 軸全 PASS 確認 |
| §6.1.3 Owner 質疑 | 3-5 分 | 5/13 W1 着手の現実性 + Marketing 6/27 朝公開維持 + Phase 2 着手前倒しメリット |
| §6.1.4 PM/Review 補足 | 2-3 分 | prefetch 50-55% 詳細 + 必須コントロール 50 達成度 + dry-run 副作用ゼロ証明 |
| §6.1.5 採決 + sign-off | 1-2 分 | YES / NO 採決 + 議事録スタンプ |
| §6.1.6 採択時 = DEC-019-056 acknowledge | 1-2 分 | Owner 5/6 夜即決済の DEC-019-056 を 5/8 議事録に追加記録 |
| **計** | **10-15 分** (中央値 12-13 分) | — |

### §4.3 Owner 物理拘束変動

| 区分 | v9 | **v10** | 差分 |
|---|---|---|---|
| 議事参加 | 0.6-0.75h (35-45 分) | **0.85-1.0h (50-60 分)** | +0.25h |
| 5/7 EOD 事前読了 | 0.25h | **0.30h** (議決-26 + transition plan v1 追加) | +0.05h |
| 5/7 朝即決 (議決-26 追加 / 見送り判断) | 0 | **0.08h (5 分)** | +0.08h |
| **計 (5/5-5/8)** | **0.85-1.0h** | **1.23-1.38h** | **+0.38h** |

→ 増加幅 +0.38h (約 23 分) は ≤ 週 10h の 12-14% 充当、許容範囲。

---

## §5 議決-26 採択時の DEC-019-XXX 起票案（DEC-019-056 を別建てで先行起票し、議決-26 は当日 acknowledge のみとする選択肢含む）

### §5.1 起票方式 2 案

| 方式 | 内容 | メリット | デメリット |
|---|---|---|---|
| **方式 A: 5/6 夜先行起票 + 5/8 議決-26 acknowledge のみ** | DEC-019-056 を 5/6 夜 Owner 即決後に起票。5/8 議決-26 は acknowledge スタンプのみ (1-2 分) | 5/8 議事時間圧縮可能 (議決-26 議論 → 1-2 分に短縮) | Owner 5/6 夜物理拘束 +5-10 分必要 |
| 方式 B: 5/8 議決-26 採択後に DEC-019-056 起票 | 5/8 議決-26 議論 10-15 分 + 採決後に CEO が DEC-019-056 起票 | Owner 5/6 夜の物理拘束削減 | 5/8 議事時間延長 50-60 分 |

### §5.2 推奨方式

- **PM 推奨 = 方式 A (5/6 夜先行起票 + 5/8 acknowledge のみ)**
- 理由: ① DEC-019-054 (5/4 Owner 即決「オプション 1 で進めて」→ 16 件先行承認) と同一パターン、② 5/8 議事時間 50-60 分 → 45-50 分へ圧縮可能、③ Round 9-10 完遂 5/6 夜タイミングで Owner 即決と同期可能

### §5.3 方式 A 採用時の 5/6 夜 Owner 即決フロー

```
5/6 21:00 JST: PM-C deliverable + Round 10 R10-4 完遂報告 → Owner Slack DM
5/6 21:05 JST: CEO 統合 → DEC-019-056 起票文最終版 + 議決-26 議題文案 →
              Owner 即決依頼 (採択前提 5 軸全 PASS 確認 + 議決-26 推奨度 Lv 4)
5/6 21:10 JST: Owner 即決受領 (例: 「方式 A で進めて、5/8 議決-26 は acknowledge のみで OK」)
5/6 21:15 JST: CEO DEC-019-056 起票 (decisions.md v15.7 / v16 として追加)
5/6 21:20 JST: 秘書 5/8 配布資料 v10 最終版起案 (議決-26 = 方式 A 採用版)
5/6 21:30 JST: Round 10 着地 commit + push (DEC-019-056 起票文反映)
```

### §5.4 方式 A 採用時の議決-26 議事構造（圧縮版）

| 区分 | 時間 | 内容 |
|---|---|---|
| §6.1.1 議題文案読了 + DEC-019-056 acknowledge | 1 分 | Owner 5/6 夜即決済の DEC-019-056 を 5/8 議事録に追加記録 |
| §6.1.2 採決 + sign-off | 1 分 | YES 採決 + 議事録スタンプ |
| **計** | **2 分** | (v10 議事時間 50-60 分 → 45-50 分へ圧縮可能) |

---

## §6 5/8 議題 v10 final flow（cover letter / minutes template / Q&A 想定）への影響範囲

### §6.1 配布物リスト v9 → v10 変更点

| # | ファイル | v9 | **v10** | 差分 |
|---|---|---|---|---|
| 1 | `secretary-5-8-meeting-package-v10.md` | (v9) | **新規 v10** (本書 + Round 9-10 + 議決-26 反映) | 全面差替 |
| 2 | `secretary-agenda-v8.md` | (v7) | **新規 v8** (議決 21 → 22 件、議決-26 追加) | 全面差替 |
| 3 | `pm-round9-10-2day-sprint-plan.md` | — | **新規追加** | +1 件 |
| 4 | `pm-phase1-transition-plan-v1.md` | — | **新規追加** | +1 件 |
| 5 | `pm-5-8-agenda-v10-decision-26-prep.md` (本書) | — | **新規追加** | +1 件 |
| 6 | `secretary-w0-week1-meeting-minutes-template-v5.md` | (v4) | **新規 v5** (議決-26 sign-off 欄 + 方式 A 反映) | 全面差替 |
| 7 | 既存 v9 配布物 7 件 | 既存 | 同梱維持 | 0 |
| **計 v10 配布物** | — | — | **12 件** (v9 = 9 件 + 3 件追加) | **+3** |

### §6.2 cover letter v10 構成（Owner 5/7 EOD 配布想定）

```
Owner 様

5/8 検収会議 配布資料 v10 をお届けします。

主要差分 (v9 → v10):
- Round 9-10 集中スプリント (5/4-5/6 完遂) で Phase 1 W2/W3/W4 想定スコープの
  prefetch 比率が 50-55% に到達しました
- 議決-26「実運用着手 Go」を新規追加し、W1 着手 5/19 → 5/13 への 6 日前倒し +
  Phase 1 sign-off 6/20 → 6/3 への 17 日前倒し + Marketing 公開 6/27 朝維持の
  案 C ハイブリッド timeline を提案します
- 5/6 夜 Owner 即決済の DEC-019-056 を 5/8 議決-26 で acknowledge のみとする
  方式 A を採用 (議決-26 議事時間 2 分に圧縮)

5/8 議事時間: v9 35-45 分 → v10 45-50 分 (Owner 物理拘束 +5-10 分)

事前読了お願い (約 18 分):
- 本書 cover letter (3 分)
- pm-round9-10-2day-sprint-plan.md (5 分、§9 5/22 朝公開前倒し確度評価)
- pm-phase1-transition-plan-v1.md (5 分、§7 推奨 timeline 3 案)
- pm-5-8-agenda-v10-decision-26-prep.md (5 分、§1 議決-26 議題文案)

5/7 朝までに「議決-26 = 方式 A 採用 / 議決-26 見送り (F-1) のいずれか」を
即決依頼します。

CEO claude-code-company
```

### §6.3 minutes template v5 主要追加

| 区分 | v4 | **v5** |
|---|---|---|
| 議決-1〜25 sign-off 欄 | 既存 21 件 | 既存 21 件維持 |
| **議決-26 sign-off 欄** | — | **新規追加 (方式 A 採用版 = DEC-019-056 acknowledge エビデンス + Owner 5/6 夜即決スタンプ)** |
| Round 9-10 完遂報告欄 | — | **新規追加 (Round 9 6 部署 + Round 10 4 軸 完遂状況)** |

### §6.4 Q&A 想定（議決-26 関連、5/8 議事時間配分込）

| Q | 想定回答 |
|---|---|
| Q-1: 案 C ハイブリッドの確度 70-80% は十分か | A: §2 採択前提 5 軸全 PASS 確認済 + 残 20-30% リスクは BAN drill #1 (5/13) 実 drill 結果 + W1 着手後の実装ペースで吸収可能 |
| Q-2: Marketing 6/27 朝公開を維持する根拠 | A: portfolio metrics 信頼性確保 (placeholder 27 個全差替可能) + 段階 2 Review 期間 3 日確保 + KPI 計測期間 24 日 = DEC-019-052 通り |
| Q-3: Phase 2 着手 6/24 → 6/10-17 前倒しの組織コスト | A: Round 9-10 集中スプリント完遂で Phase 2 plan v1 §0.2 候補が現実化、組織コストは Round 5-8 同様の並列前倒しパターンで吸収可能 |
| Q-4: 議決-26 否決時 fallback F-1 の意義 | A: 5/30 NG-3 議決とパッケージ化で Owner 物理拘束 5/8 (45-50 分) + 5/30 (30 分) 集約、Round 9-10 deliverable は Phase 1 W1-W4 で活用可能 |
| Q-5: BAN drill #1 = 5/13 実 drill 失敗時 | A: §3 F-1 fallback で Phase 1 W1 着手延期 + 5/30 NG-3 議決とパッケージ化、Phase 2 着手は 6/24 維持 |

---

## §7 5/22 朝公開前倒し（DEC-019-056 §3 採択）と議決-26 の連動条件 + Marketing 部門への即時 hand-off list

### §7.1 5/22 朝公開と議決-26 の連動構造

| 議決-26 採択 | 5/22 朝公開 | DEC-019-056 §3 採択 |
|---|---|---|
| YES (案 C 採択) | 維持 (案 C は 6/27 朝公開) | DEC-019-056 §3 = 案 C 採択 |
| NO (議決-26 見送り) | 検討対象外 | DEC-019-056 起票見送り |

→ 案 C は 6/27 朝公開維持なので、5/22 朝公開は議決-26 採択でも実施しない。「5/22 朝公開」議題は別途 議決-27 (将来議題) として将来検討の余地。

### §7.2 案 A' (5/22 朝中間公開 + 6/27 朝完成公開) 採択時の連動条件

- 議決-26 採択前提条件 5 軸全 PASS + Marketing 部門が 5/22 朝中間公開向け差替 narrative 1,800-2,300 行を 5/14-21 期間 (8 日間) で完遂可能
- 案 A' は議決-26 + 議決-27 (5/22 朝中間公開採択) の連動議決構造になる
- 5/8 で議決-27 を追加すると議事時間 50-60 分 → 60-75 分へ + 15 分延長 = Owner 物理拘束限界超過

### §7.3 Marketing 部門への即時 hand-off list (議決-26 採択時)

| Hand-off 項目 | 担当 | 期限 | 内容 |
|---|---|---|---|
| HO-1 | Marketing | 5/8 EOD | Round 9 Marketing-D deliverable (Phase 2 narrative full draft 1,800-2,300 行) を案 C 採択前提で再確認 |
| HO-2 | Marketing | 5/19 | Phase 1 sign-off 6/3 想定での portfolio metrics 27 個差替 SOP 起動 |
| HO-3 | Marketing + Web-Ops | 6/3-6/22 | Phase 1 sign-off 6/3 → 公開 6/27 朝の 24 日間で portfolio + technical-deep-dive vol 7-9 + X thread 草稿差替 |
| HO-4 | Marketing | 6/22-26 | DEC-019-052 通りの段階 1-3 (実装 / Review / Owner 最終承認) |
| HO-5 | Marketing | 6/27 朝 09:00 JST | 公開 |

### §7.4 議決-26 見送り (F-1) 時の Marketing hand-off list

| Hand-off 項目 | 担当 | 期限 | 内容 |
|---|---|---|---|
| HO-1' | Marketing | 5/8 EOD | Round 9 Marketing-D deliverable は staged のまま Phase 1 W1-W4 で活用 |
| HO-2' | Marketing | 6/22-26 | DEC-019-052 通りの段階 1-3 (案 B 維持) |
| HO-3' | Marketing | 6/27 朝 09:00 JST | 公開 (案 B = 現行通り) |

---

## §8 結論

1. **議決-26 議題文案 300 字確定** (§1.2)、CEO + PM 推奨度 Lv 4。
2. **議決-26 採択前提条件 5 軸**: ① mock-claw dry execution Pass ② BAN drill #1 dry execution Pass ③ 必須コントロール 50 達成度 ≥ 95% ④ API 消費 ≤$30 維持 ⑤ Owner 残動作 0 件継続。
3. **議決-26 否決時 fallback F-1 推奨**: 5/30 NG-3 議決とパッケージ化、Round 9-10 deliverable は Phase 1 W1-W4 で活用。
4. **5/8 議事時間影響**: v9 35-45 分 → v10 45-50 分 (方式 A 採用時 議決-26 議事 2 分圧縮)。Owner 物理拘束 +5-10 分。
5. **DEC-019-056 起票方式 A 推奨**: 5/6 夜先行起票 + 5/8 議決-26 acknowledge のみ (DEC-019-054 と同一パターン、5/8 議事時間圧縮)。
6. **5/8 議題 v10 final flow 影響**: 配布物 v9 9 件 → v10 12 件 (+3 件 = sprint plan + transition plan + 本書)。
7. **5/22 朝公開前倒しは議決-26 と連動しない** (案 C は 6/27 朝公開維持)。Marketing 即時 hand-off は議決-26 採択 / 見送り両分岐に対応。
8. **既存議決 21 件構造を破壊しない、議決-26 は追加のみ**。

---

## §9 関連決裁・参照

### §9.1 反映決裁

- DEC-019-007 / 033 / 050 / 051 / 052 / 053 / 054 / 055
- **DEC-019-056（起票予定）**: Round 9-10 集中スプリント採択 + 案 C 採択 + 5/22 朝公開前倒し可否評価条項

### §9.2 参照書

- `pm-round9-10-2day-sprint-plan.md`（本日同 Round 9 起案、deliverable 1）
- `pm-phase1-transition-plan-v1.md`（本日同 Round 9 起案、deliverable 2）
- `secretary-5-8-meeting-package-v9.md`（Round 7、議題 21 件 35-45 分版）
- `secretary-agenda-v7.md`（議題 v7、議決 20 件原本）
- `pm-phase1-plan-v3.md`（Round 7、Phase 1 計画 v3）
- `pm-cross-ref-final-v8.md`（Round 7、cross-ref final）

### §9.3 Risk Register v3.2 整合性検証

- 議決-26 追加で新規 risk 起票なし
- R-RUSH-01 〜 R-RUSH-04（sprint plan §6）が議決-26 採択時の運用リスクとして関連

### §9.4 6 部署フィードバック条件

| 部署 | 議決-26 関連 feedback |
|---|---|
| Dev | 採択前提 軸-1 (mock-claw dry execution) + 軸-4 (API 消費 ≤$30) を 5/6 夜までに検証 |
| Review | 採択前提 軸-2 (BAN drill #1 dry execution) + 軸-3 (必須コントロール 50 ≥ 95%) を 5/8 朝までに検証 |
| Marketing | 採択 / 見送り両分岐に対応した hand-off 準備 (§7.3 / §7.4) |
| Research | 採択時の Phase 2 着手 6/10-17 前倒し時のジャンル拡張 case-by-case 評価 |
| 秘書 | 配布資料 v10 = 12 件 (本書 + sprint plan + transition plan + 既存 v9 9 件) を 5/7 EOD 配布 + minutes template v5 議決-26 sign-off 欄追加 |
| CEO | DEC-019-056 起票文 5/6 夜まで + Owner 5/7 朝即決準備 |

### §9.5 Phase 2 plan v1 への影響評価

- 議決-26 採択時 (案 C): Phase 2 着手 6/24 → **6/10-17 へ 7-14 日前倒し** 確度 40-50%
- 議決-26 見送り時 (案 B 維持): Phase 2 着手 6/24 維持 確度 95%

---

## フッタ — 改版履歴

| 版 | 日付 | 起案 | 主要変更 |
|---|---|---|---|
| v1 | 2026-05-04 深夜（Round 9 起動時） | PM 部門 | 初版（5/8 議題 v9 → v10 update + 議決-26「実運用着手 Go」追加準備、5 軸採択前提条件 + 否決時 fallback F-1 + 方式 A 推奨） |

**v1 確定**: 2026-05-04 深夜 / **採択予定**: 5/7 朝 Owner 即決 (議決-26 = 方式 A 採用 / 見送り (F-1) ) / **次回更新**: ① 5/6 夜 DEC-019-056 起票後 ② 5/8 議決-26 結果反映後

## フッタ詳細

- 文書: `projects/PRJ-019/reports/pm-5-8-agenda-v10-decision-26-prep.md`
- 版: v1（2026-05-04 深夜、Round 9 PM-C 担当 deliverable 3）
- 起案: PM 部門
- 範囲: 5/8 議題 v9 → v10 update + 議決-26「実運用着手 Go」追加準備
- 検収: CEO（Round 9 commit 時）+ Owner（5/7 朝即決 + 5/8 議事スタンプ）
