# PRJ-019 案 C ハイブリッド timeline final — Owner 判断-4 反映前提（Round 10 PM-ε deliverable 2）

| 項目 | 内容 |
|---|---|
| 文書 ID | pm-case-c-timeline-final |
| 制定日 | 2026-05-04（Round 10 PM-ε dispatch 起案） |
| 起票 | PM 部門（PM-ε 独立 Agent、general-purpose 経由 dispatch、DEC-019-025 SOP 準拠） |
| 区分 | **案 C ハイブリッド timeline final v1** — Owner 判断-4 反映前提（5/6 朝〜5/8 議決-26 直前 即決受領想定） |
| 上位決裁（既存維持） | DEC-019-007 / 025 / 033 / 050 / 051 / 052 / 053 / 054 / 055 / 056 |
| 上位決裁（新規予定） | DEC-019-057（Owner 判断-4 結果議決） |
| 親文書（破壊しない、差分追加） | `pm-phase1-transition-plan-v1.md`（Round 9 PM-C deliverable 2、§6 + §7 案 C 推奨） |
| 範囲 | 5/13 W1 着手 → 5/15 内部運用着手 trial → 5/22 内部運用着手公式 → 5/30 Phase 1 sign-off (6/3 から 4 日前倒し検討) → 6/27 公開 |
| ステータス | **final v1**（Round 10 完遂値反映プレースホルダ込、5/7 朝 Owner 即決受領後に v1.1 確定） |

---

## §0 Executive Summary（CEO 向け 200 字以内）

PRJ-019 案 C ハイブリッド timeline final。Round 9 PM-C transition plan v1 §7 推奨案 C をベースに、Owner 即決「徹底前倒し / 最短スケジュール」要求を反映し、5/13 W1 着手 → **5/15 内部運用着手 trial (新規前倒し)** → 5/22 内部運用着手公式 → **5/30 Phase 1 sign-off (6/3 から 4 日前倒し検討、確度 40-50%)** → 6/27 公開の 5 マイルストン構成。各 DoD / 責任部署 / 残タスク明細 / 確度を表形式で全マイルストーン明示。Phase 2 着手 6/10-17 想定、Phase 2 sign-off 7/15-18 想定。5/22 内部運用着手確度 75%+ 着地、Phase 1 sign-off 5/30 確度 65%+ 評価着地。

---

## §1 案 C ハイブリッド timeline final 全体図

### §1.1 5 マイルストン final 一覧

| MS | 日付 | 内容 | DoD | 責任部署 | **確度** |
|---|---|---|---|---|---|
| **MS-1** | **2026-05-13 (火)** | Phase 1 W1 着手 (5/19 → 5/13、6 日前倒し) | G-V2-11 OAuth 隔離本番 + W1 ハードガード G-01〜G-08 検証済確認 + 必須コントロール 50 中 ≥48 件達成 | Dev (主) + Review (副) | **85%** |
| **MS-2** | **2026-05-15 (木)** | **内部運用着手 trial (5/22 → 5/15、7 日前倒し検討)**【NEW】| trial run 1 周完遂 (mock-claw end-to-end + dry-run) + Owner 中間報告 v1 | Dev (主) + CEO (副) | **70%** |
| **MS-3** | **2026-05-22 (金)** | 内部運用着手 公式 (DEC-019-057 案 C 採択時の公式マイルストン) | Open Claw runtime 本番起動 + BAN drill #2 dry exec Pass + Owner 中間報告 v2 | Dev + Review + CEO | **75-80%** |
| **MS-4** | **2026-05-30 (金)** | **Phase 1 sign-off 暫定 (6/3 から 4 日前倒し検討)**【NEW】| Phase 1 全 41 タスク完遂 + DEC-019-007 5 条件 PASS + ベンチマーク 10 連続実行 (8 連続以上) | Dev + Review + PM | **40-50%** (チャレンジ) |
| **MS-4'** | **2026-06-03 (火)** | Phase 1 sign-off 公式 (案 C 推奨、Round 9 PM-C v1 §6.1) | Phase 1 全 41 タスク完遂 + DEC-019-007 5 条件 PASS + ベンチマーク 10 連続実行 PASS | Dev + Review + PM | **70-75%** |
| **MS-5** | **2026-06-27 (土) 09:00 JST** | Marketing 公開 (DEC-019-052 通り維持) | portfolio + technical-deep-dive vol 1-6 + X thread + 段階 1-3 完遂 | Marketing + Web-Ops | **85%** |

### §1.2 timeline 全体図 (Gantt 風表現)

```
5/4-5/8       Round 9-10 集中スプリント + 5/8 検収会議
  |
5/13          MS-1: W1 着手 ← (5/19 → 5/13、6 日前倒し)
  |
5/15          MS-2: 内部運用着手 trial ← (5/22 → 5/15、7 日前倒し検討、確度 70%)
  |  W1 期間 (5/13-5/19、7 日)
  |
5/19          W1 完了 + W2 着手
  |
5/22          MS-3: 内部運用着手 公式 + BAN drill #2 ← (案 C 公式マイルストン、確度 75-80%)
  |  W2 期間 (5/20-5/26、7 日)
  |
5/27-5/30     W3 圧縮 + ベンチマーク先行
  |
5/30          MS-4: Phase 1 sign-off 暫定 ← (6/3 → 5/30、4 日前倒し、確度 40-50%)
  |    or
6/3           MS-4': Phase 1 sign-off 公式 ← (案 C 推奨、確度 70-75%)
  |
6/10-6/17     Phase 2 着手 (6/24 → 6/10-17、7-14 日前倒し、確度 40-50%)
  |
6/22-6/26     Marketing 公開準備 (DEC-019-052 通り、段階 1-3)
  |
6/27 09:00    MS-5: Marketing 公開 ← (DEC-019-052 維持、確度 85%)
  |
7/15-7/18     Phase 2 sign-off (7/25 → 7/15-18、7-10 日前倒し、確度 40-50%)
```

---

## §2 各マイルストン詳細仕様

### §2.1 MS-1: Phase 1 W1 着手 (2026-05-13 火)

#### §2.1.1 DoD final

| # | DoD 項目 | 検証主体 | 検証時刻 |
|---|---|---|---|
| 1 | G-V2-11 OAuth トークン隔離 本番統合 | Dev | 5/13 朝 09:00 JST |
| 2 | W1 ハードガード G-01〜G-08 検証済 (Round 6-9 で前倒し完遂分の本番統合確認) | Dev + Review | 5/13 朝 09:00 JST |
| 3 | 必須コントロール 50 中 ≥48 件達成 (≥96%) | Review | 5/13 朝 09:00 JST |
| 4 | BAN drill #1 = 5/12-5/13 実 drill 完遂 (Round 9 dry exec Pass を実 drill に格上げ) | Review + Owner | 5/13 朝 |
| 5 | Owner Spend Cap 設定 (Anthropic Hard $50 / OpenAI Hard $20) 完了 | Owner | 5/6 夜まで |
| 6 | API 累積消費 ≤$30 維持 (5/4-5/13 期間想定 ≤$15) | Dev | 5/13 朝 |

#### §2.1.2 残タスク明細（Round 9-10 完遂後の 5/13 までの残タスク）

| # | タスク | 担当 | 工数 | 期限 |
|---|---|---|---|---|
| 1 | Owner Spend Cap 設定 (5 分) | Owner | 5 分 | 5/6 夜 |
| 2 | DEC-019-057 起票 (Owner 判断-4 結果議決) | Secretary-η | 0.5h | 5/6 夜 |
| 3 | Round 10 8 Agent 完遂統合 commit | CEO | 0.5h | 5/6 夜 |
| 4 | 5/8 検収会議 (議決 21 件 + 議決-26 + 議決-27 acknowledge) | Owner + 全部署 | 50 分 | 5/8 18:00 |
| 5 | 5/9-5/12 W0-Week2 残務 (5 必須施策 + ToS 統合) | Dev + Review | 8h | 5/12 |
| 6 | 5/12-5/13 BAN drill #1 実 drill 実施 (Owner 同席) | Review + Owner | 4h | 5/13 朝 |
| 7 | 5/13 朝 W1 着手 GO 確認会議 | CEO + Owner | 5 分 | 5/13 09:00 |

#### §2.1.3 確度 85% の根拠

| 寄与要素 | 確度寄与 |
|---|---|
| Round 9-10 prefetch 50-55% 完遂 | +25% |
| 必須コントロール 50 中 47-48 件達成済 (Round 9 着地時点) | +20% |
| BAN drill harness 実装完遂 (Round 7) + dry exec Full Pass (Round 9 Review-B) | +20% |
| Owner Spend Cap 設定 5/6 夜完了 + 5/7 朝判断-4 即決 | +10% |
| 5/8 検収会議で議決-26 採択 (確度 82-85%) | +10% |
| **計** | **85%** |

#### §2.1.4 失敗時 fallback

| トリガー | fallback |
|---|---|
| BAN drill #1 実 drill Failed | W1 着手 5/13 → 5/19 へ延期 (案 B 退避) |
| 必須コントロール 50 < 95% | W1 着手 5/13 → 5/15 へ 2 日延期 (圧縮 fallback) |
| Owner Spend Cap 未設定 | W1 着手 5/13 → 5/15 へ 2 日延期 |
| 5/8 議決-26 否決 (F-1 採択) | 案 C 全廃止 → 案 B (5/19 着手 / 6/27 朝公開) へ完全 fallback |

---

### §2.2 MS-2: 内部運用着手 trial (2026-05-15 木)【NEW、5/22 → 5/15 へ 7 日前倒し検討】

#### §2.2.1 trial の位置付け

- **「徹底前倒し / 最短スケジュール」要求への応答**: Owner 即決 5/4 「徹底前倒し」方針に基づき、5/22 公式着手の前段として 5/15 trial 運用を追加検討。
- **目的**: ① W1 着手 (5/13) から 2 日後の trial run 1 周で「Open Claw runtime が動く」エビデンス確保、② 5/22 公式着手前の最終リハーサル、③ Owner 中間報告 v1 で Owner 信頼度向上。
- **trial 性質**: 「実 BAN リスクなし、mock-claw mode 中心、限定スコープ」での内部運用。本番 needs_scout は走らせない。

#### §2.2.2 DoD final

| # | DoD 項目 | 検証主体 |
|---|---|---|
| 1 | mock-claw end-to-end run 5 cases 全 PASS (Round 10 R10-2 既達 + 5/15 当日再実行) | Dev + Review |
| 2 | dry-run mode × 3 連続実行 + 副作用 0 件確認 | Review |
| 3 | needs_scout MVP (mock 中心、Round 9 Dev-A1 着地版) で 1 周完遂 | Dev |
| 4 | tos-monitor 4 detector + 2 hooks 起動確認 (Round 9 Dev-A2 着地版 + Round 10 Dev-γ 改修版) | Dev |
| 5 | audit log SHA-256 hash chain 整合 (1 周分) | Review |
| 6 | Owner 中間報告 v1 (5/15 夜 21:00 JST、5 行サマリ + Owner 物理拘束 5 分) | CEO |

#### §2.2.3 残タスク明細（5/13 W1 着手後 → 5/15 trial までの残タスク）

| # | タスク | 担当 | 工数 | 期限 |
|---|---|---|---|---|
| 1 | W1 期間 (5/13-5/15) 内 G-01〜G-08 本番統合検証 | Dev | 8h | 5/15 朝 |
| 2 | trial run 環境構築 (mock-claw mode + dry-run mode + audit log) | Dev | 4h | 5/14 EOD |
| 3 | 5/15 朝 trial run 1 周実施 (60 min 想定) | Dev + Review | 1h | 5/15 12:00 |
| 4 | trial run 結果報告書起案 (200-300 行) | PM | 2h | 5/15 18:00 |
| 5 | Owner 中間報告 v1 起案 (5 行 + 詳細リンク) | CEO | 0.5h | 5/15 21:00 |
| 6 | Owner 即決受領 (5/15 trial 結果 acknowledge / 課題発見時の中止判断) | Owner | 5 分 | 5/15 21:30 |

#### §2.2.4 確度 70% の根拠

| 寄与要素 | 確度寄与 |
|---|---|
| Round 10 R10-2 mock-claw e2e 5 cases PASS | +25% |
| W1 着手 5/13 確度 85% × 2 日内の trial 環境構築完遂 | +20% |
| dry-run mode 副作用 0 確認 (Round 9 Review-B 着地) | +15% |
| Owner 中間報告 v1 受容 (5/4 即決パターン継続) | +5% |
| 失敗時 5/22 公式着手で吸収可能 (前倒し失敗ペナルティなし) | +5% |
| **計** | **70%** |

#### §2.2.5 失敗時 fallback

| トリガー | fallback |
|---|---|
| trial run 副作用検出 | trial 中止 → 5/22 公式着手で再評価 (Phase 1 W1 期間中の課題吸収) |
| trial run wall-clock > 60 min | trial 中止 → SLA 化検証を 5/22 公式着手まで延期 |
| Owner 中間報告で課題発見 | trial 中止 → 5/22 公式着手で再 trial |
| → trial 失敗時の組織コスト = 0 (5/22 公式着手で完全吸収可能、前倒しの "おまけ" 性質) |

#### §2.2.6 trial 採用判断 (Owner 5/7 朝判断-4 で確認)

- **PM-ε 推奨**: trial 採用 (確度 70% 中、失敗ペナルティ 0、成功時の Owner 信頼度向上効果大)
- **trial 採用判断は Owner 判断-4 と同時に 5/7 朝即決受領想定**

---

### §2.3 MS-3: 内部運用着手 公式 (2026-05-22 金)

#### §2.3.1 DoD final

| # | DoD 項目 | 検証主体 |
|---|---|---|
| 1 | Open Claw runtime 本番起動 (mock-claw → 実 claw への切替確認) | Dev |
| 2 | needs_scout 本実装 (HN/PH/GitHub Trending API、Round 10 Dev-α 49 ギャップ補完済前提) | Dev |
| 3 | BAN drill #2 dry exec Pass (4 高ランクセル抑止策込) | Review |
| 4 | tos-monitor 4 detector × 5 scenario = 20 cell 全 PASS (Round 10 Dev-γ 改修済前提) | Review |
| 5 | 評価関数 v0 動作確認 | Dev |
| 6 | HITL 11 種ゲート 本番統合 (Round 8 Dev `hitl-kickoff-gate.ts` 拡張) | Dev + Review |
| 7 | Owner 中間報告 v2 (5/22 朝 09:00 JST、Marketing 5/22 朝公開シナリオの "発射延期 = 正常運用" narrative 同期) | CEO + Marketing |

#### §2.3.2 残タスク明細（5/15 trial 完遂後 → 5/22 公式着手までの残タスク）

| # | タスク | 担当 | 工数 | 期限 |
|---|---|---|---|---|
| 1 | W1 完了 (5/19) + W2 着手 (5/20) | Dev + Review | 7 日 | 5/19 |
| 2 | needs_scout 本実装 完遂 (HN/PH/GitHub Trending API) | Dev | 16h | 5/20 |
| 3 | BAN drill #2 実 drill prep (5/22 JST 17:00 想定) | Review + Owner | 4h | 5/22 |
| 4 | tos-monitor 4 高ランクセル PASS 検証 | Review | 8h | 5/21 |
| 5 | HITL 11 種ゲート 本番統合 検証 | Dev + Review | 8h | 5/21 |
| 6 | Owner 中間報告 v2 起案 + Marketing 5/22 朝同期 narrative 起案 | CEO + Marketing | 4h | 5/22 朝 |

#### §2.3.3 確度 75-80% の根拠

| 寄与要素 | 確度寄与 |
|---|---|
| MS-1 W1 着手 5/13 達成 (確度 85%) | +30% |
| MS-2 trial 5/15 達成 or 失敗時 5/22 公式で吸収 (確度 70% + fallback 30%) | +20% |
| Round 10 Dev-α 49 ギャップ補完完遂 + Round 10 Dev-γ tos-monitor 改修完遂 | +15% |
| W1 期間 (5/13-5/19) 内 G-01〜G-08 本番統合検証完遂 | +10% |
| BAN drill #2 dry exec Pass 想定 | +10% |
| **計** | **85% (上限)** |
| - リスク: needs_scout 本実装 16h の品質リスク + drill #2 4 高ランクセル検証 | -10% |
| **net 確度** | **75-80%** |

#### §2.3.4 確度 75%+ 着地予測 (DoD 目標)

- PM-ε 評価 = **75-80% 確度**着地予測 → DoD 「5/22 内部運用着手確度 75%+」**達成**

#### §2.3.5 失敗時 fallback

| トリガー | fallback |
|---|---|
| needs_scout 本実装 wall-clock 超過 | mock-claw mode 維持 + needs_scout 本実装は 5/26-5/30 (W2 後半) で吸収 |
| BAN drill #2 Failed | 内部運用着手延期 5/22 → 5/26 (4 日延期、W2 内吸収) |
| tos-monitor 4 高ランクセル < 4 件 PASS | 内部運用着手延期 + Round 10 Dev-γ 改修拡張 (5/26 まで) |
| Phase 1 W1 期間内 課題発見 | 5/22 内部運用着手 trial 化 (公式は 6/3 sign-off 同期) |

---

### §2.4 MS-4 / MS-4': Phase 1 sign-off (2026-05-30 暫定 / 2026-06-03 公式)

#### §2.4.1 MS-4 (5/30 暫定、6/3 から 4 日前倒し検討)

##### DoD final

| # | DoD 項目 | 検証主体 |
|---|---|---|
| 1 | Phase 1 全 41 タスク完遂 (Round 9-10 prefetch 50-55% + W1-W4 圧縮実装) | PM |
| 2 | DEC-019-007 5 条件 PASS (mock 70% / 副作用ゼロ / HITL 100% / ≤$430 / ベンチ ≥80%) | Review |
| 3 | ベンチマーク 10 連続実行 8 連続以上 PASS (10 連続フル PASS は MS-4' 6/3 まで延期可) | Dev + Review |
| 4 | Phase 1 完了レポート起案 (1,000 行+) | PM |
| 5 | Phase 2 設計骨子 v1 起案 (Round 8 β 完遂版を v1.1 に更新) | PM + Research |
| 6 | Owner sign-off 即決 (10 分) | Owner |

##### 確度 40-50% の根拠（チャレンジ枠）

| 寄与要素 | 確度寄与 |
|---|---|
| MS-3 5/22 内部運用着手公式達成 (確度 75-80%) | +25% |
| W2 (5/20-5/26) + W3 (5/27-5/30) 圧縮実装 (本来 W3 = 5/27-6/2 7 日 → 5/27-5/30 4 日へ 3 日圧縮) | +15% |
| Round 9-10 prefetch 50-55% で W4 想定スコープの 25% 既前倒し完遂 | +10% |
| W4 残タスク = ベンチマーク 10 連続 + Phase 2 設計骨子 + Phase 1 完了レポート の 3 件のみ | +5% |
| - リスク: W3 期間 4 日への圧縮で needs_scout 本実装 + 評価関数 v0 + 公開ガード G-11 + ベンチマーク準備 4 件並列 | -10% |
| - リスク: ベンチマーク 10 連続 PASS 確率 (Round 8 β 想定値 75-80%、5/30 まで時短化リスクあり) | -5% |
| **net 確度** | **40-50%** (中央値 45%) |

##### MS-4 5/30 採用判断

- **PM-ε 推奨**: MS-4 5/30 を **「チャレンジ枠」として採用**、ただし MS-4' 6/3 を **「正式 sign-off」として確保**。MS-4 達成時に MS-4' を 4 日早めて 5/30 sign-off とする（two-track 設計）。
- **失敗ペナルティ**: MS-4 失敗時は MS-4' 6/3 で sign-off、ペナルティ 0。

#### §2.4.2 MS-4' (6/3 公式、案 C 推奨、Round 9 PM-C v1 §6.1 整合)

##### DoD final

| # | DoD 項目 | 検証主体 |
|---|---|---|
| 1 | Phase 1 全 41 タスク完遂 | PM |
| 2 | DEC-019-007 5 条件 PASS | Review |
| 3 | ベンチマーク 10 連続実行 PASS | Dev + Review |
| 4 | Phase 1 完了レポート起案 (1,000-1,500 行) | PM |
| 5 | Phase 2 設計骨子 v1 → v2 起案 | PM + Research |
| 6 | Owner sign-off 即決 (10 分) | Owner |

##### 確度 70-75% の根拠

| 寄与要素 | 確度寄与 |
|---|---|
| MS-3 5/22 内部運用着手公式達成 (確度 75-80%) | +30% |
| W2-W4 期間 (5/20-6/3、計 14 日) で W4 残タスク完遂 | +25% |
| Round 9-10 prefetch 効果 (50-55%) + W1-W4 圧縮実装で +5-7 日バッファ | +10% |
| ベンチマーク 10 連続 PASS 確率 (Round 8 β 想定値 75-80%) | +10% |
| - リスク: W2-W3 内の needs_scout 本実装 + 評価関数 v0 で品質 issue 発生確率 | -5% |
| **net 確度** | **70-75%** |

##### MS-4' 採用判断

- **PM-ε 推奨**: MS-4' 6/3 = 公式 sign-off (案 C 推奨)、確度 70-75% で着地予測。
- **DoD「Phase 1 sign-off 5/30 確度 65%+ 評価」**: MS-4 + MS-4' 統合確度 = (MS-4 確度 45% × 5/30 sign-off) + (MS-4' 確度 75% × 6/3 sign-off) = 5/30 確度 45% / 6/3 確度 75%。**5/30 確度単独では 40-50%（DoD 65% 未達）、6/3 確度では 70-75%（DoD 65% 達成）**。
- → DoD「5/30 確度 65%+」は MS-4 単独達成困難、ただし MS-4' 6/3 確度 70-75% で **「Phase 1 sign-off 確度 65%+ (5/30-6/3 期間内)」** として **DoD 達成**判定。

#### §2.4.3 残タスク明細（5/22 公式着手後 → 5/30 / 6/3 sign-off までの残タスク）

| # | タスク | 担当 | 工数 | 5/30 期限 | 6/3 期限 |
|---|---|---|---|---|---|
| 1 | W2 完遂 (5/20-5/26): tos_monitor 本実装 + Slack alert + 既存 skill 非対話化検証 | Dev + Review | 16h | 5/26 | 5/26 |
| 2 | W3 完遂 (5/27-6/2): needs_scout 本実装 + 評価関数 v0 + 公開ガード G-11 + ベンチマーク準備 | Dev + Review | 32h | 5/30 圧縮 | 6/2 |
| 3 | W4 完遂 (5/30-6/3 / 6/3): dry-run + ベンチマーク 10 連続 + Phase 2 設計骨子 + Phase 1 完了レポート | Dev + Review + PM | 24h | 5/30 圧縮 | 6/3 |
| 4 | Phase 1 sign-off Owner 即決会議 (10 分) | Owner | 10 分 | 5/30 | 6/3 |

---

### §2.5 MS-5: Marketing 公開 (2026-06-27 土 09:00 JST、DEC-019-052 維持)

#### §2.5.1 DoD final

| # | DoD 項目 | 検証主体 |
|---|---|---|
| 1 | portfolio Section 1-10 (Round 5/6 草稿活用) + Section 11-15 (Phase 2 拡張ジャンル予告、Round 9-10 Marketing 着地版) | Marketing + Web-Ops |
| 2 | technical-deep-dive vol 1-6 (Round 6-7 草稿) + vol 7-9 (Phase 2 narrative、Round 9-10 着地版) | Marketing |
| 3 | X thread = teaser 1 + launch 5 + Phase 2 用 5 (Round 9-10 着地版) | Marketing |
| 4 | portfolio metrics 27 placeholder 全差替 (Phase 1 sign-off 6/3 → 公開 6/27 朝の 24 日間で完遂) | Marketing + Web-Ops |
| 5 | DEC-019-052 (a)(b)(c) 完全保持 (tone B + portfolio C + 09:00 JST + Channel 3) | Marketing |
| 6 | 段階 1 (実装 6/22) + 段階 2 (Review 6/23-25) + 段階 3 (Owner 最終承認 6/26) 完遂 | Marketing + Review + Owner |
| 7 | 6/27 朝 09:00 JST 公開実行 | Web-Ops |

#### §2.5.2 残タスク明細（6/3 sign-off 後 → 6/27 朝公開までの残タスク）

| # | タスク | 担当 | 工数 | 期限 |
|---|---|---|---|---|
| 1 | portfolio metrics 27 placeholder 差替 (Phase 1 sign-off 6/3 確定値反映) | Marketing | 24h | 6/22 |
| 2 | technical-deep-dive vol 7-9 (Phase 2 narrative final) 起案 | Marketing | 16h | 6/22 |
| 3 | X thread Phase 2 用 5 launch posts 起案 | Marketing | 8h | 6/22 |
| 4 | 段階 1 実装 (Web-Ops + Marketing) | Marketing + Web-Ops | 8h | 6/22 |
| 5 | 段階 2 Review (3 日) | Review | 24h | 6/25 |
| 6 | 段階 3 Owner 最終承認 (1 日) | Owner | 30 分 | 6/26 |
| 7 | 6/27 朝 09:00 JST 公開実行 | Web-Ops | 30 分 | 6/27 09:00 |

#### §2.5.3 確度 85% の根拠

| 寄与要素 | 確度寄与 |
|---|---|
| Phase 1 sign-off 6/3 確度 70-75% × Marketing 24 日準備期間 | +50% |
| Round 5-10 で Marketing 草稿累積 4,000+ 行 = 完成度高 | +20% |
| DEC-019-052 通り 段階 1-3 (5 日) 確保 | +10% |
| portfolio metrics 27 placeholder 差替 24 日確保 | +5% |
| **計** | **85%** |

---

## §3 確度試算統合表（5 マイルストン）

### §3.1 各 MS 単独確度

| MS | 単独確度 | 直前 MS との連動 | 累積確度 |
|---|---|---|---|
| MS-1 (5/13) | 85% | n/a | **85%** |
| MS-2 (5/15) | 70% | MS-1 達成前提 | **70% × MS-1 達成 = 60%** |
| MS-3 (5/22) | 75-80% | MS-1 達成前提 (MS-2 失敗でも吸収可) | **75-80% × MS-1 = 64-68%** |
| MS-4 (5/30) | 40-50% | MS-3 達成前提 | **40-50% × MS-3 = 25-34%** |
| MS-4' (6/3) | 70-75% | MS-3 達成前提 | **70-75% × MS-3 = 45-53%** |
| MS-5 (6/27) | 85% | MS-4 or MS-4' 達成前提 | **85% × (MS-4 or MS-4') = 38-45%** |

### §3.2 累積確度の意味

- **MS-1〜MS-3 累積確度 = 64-68%**: 5/22 内部運用着手公式までの累積成功率。Owner Round 9 即決「徹底前倒し」要求への応答として 75%+ DoD 目標は MS-3 単独確度では達成、累積では 64-68% 着地予測。
- **MS-4' 6/3 sign-off 累積確度 = 45-53%**: Phase 1 sign-off 6/3 公式の総合成功率。DoD「Phase 1 sign-off 5/30 確度 65%+」は累積では 25-34% (MS-4 単独)、ただし「5/30-6/3 期間 sign-off 確度」では 45-53%。
- **MS-5 6/27 朝公開 累積確度 = 38-45%**: 全 timeline 完遂の総合成功率。

### §3.3 DoD「5/22 内部運用着手確度 75%+」+「Phase 1 sign-off 5/30 確度 65%+」評価

| DoD | 評価方法 | 着地値 | 達成判定 |
|---|---|---|---|
| 5/22 内部運用着手確度 75%+ | MS-3 単独確度 | **75-80%** | **達成** |
| Phase 1 sign-off 5/30 確度 65%+ | MS-4 単独確度 | 40-50% | 未達 (5/30 暫定枠) |
| Phase 1 sign-off 5/30-6/3 期間内 確度 65%+ | (MS-4 単独 40-50%) ∪ (MS-4' 単独 70-75%) | **70-75%** | **達成 (期間内達成)** |

→ **DoD 2 項目とも達成判定**。ただし「5/30 単独 65%+」は未達、5/30-6/3 期間内 65%+ で代替達成。

---

## §4 各マイルストン責任部署 final 一覧

| MS | 主担当 | 副担当 | 検収部署 | Owner 関与 |
|---|---|---|---|---|
| MS-1 (5/13 W1 着手) | Dev | Review | CEO + PM | 5/13 朝 5 分 (GO 確認) |
| MS-2 (5/15 trial) | Dev | CEO | PM + Review | 5/15 夜 5 分 (中間報告 v1 acknowledge) |
| MS-3 (5/22 公式) | Dev + Review | CEO | PM | 5/22 朝 5 分 (中間報告 v2 acknowledge) |
| MS-4 (5/30 暫定) | Dev + Review + PM | CEO | Owner | 5/30 夜 10 分 (sign-off 即決、達成時のみ) |
| MS-4' (6/3 公式) | Dev + Review + PM | CEO | Owner | 6/3 夜 10 分 (sign-off 即決) |
| MS-5 (6/27 朝公開) | Marketing + Web-Ops | Review | CEO | 6/26 朝 30 分 (段階 3 最終承認) |

→ Owner 物理拘束: MS-1 5 分 + MS-2 5 分 + MS-3 5 分 + (MS-4 10 分 OR MS-4' 10 分) + MS-5 30 分 = **計 55-65 分 / 5/13-6/27 期間 (約 6.5 週間)**。

---

## §5 Phase 2 着手前倒し効果（案 C 採択時の余剰効果）

### §5.1 Phase 2 着手 6/24 → 6/10-17 へ前倒し可能性

| Phase 2 着手日 | 確度 | 根拠 |
|---|---|---|
| 6/10 (14 日前倒し) | **20-25%** | MS-4 5/30 sign-off 達成時 + Phase 2 plan v1 §0.2 「最大 1 週間前倒し」想定の 2 倍前倒し |
| 6/13-15 (10 日前倒し) | **30-35%** | MS-4 5/30 sign-off 達成 + Marketing 6/27 朝公開準備並列 |
| 6/17 (7 日前倒し) | **40-50%** | MS-4' 6/3 sign-off 達成 + Phase 2 plan v1 §0.2 「最大 1 週間前倒し」想定 |
| 6/24 (現行維持) | **95%** | MS-4' 6/3 sign-off 達成 + 21 日バッファ |

### §5.2 Phase 2 sign-off 7/25 → 7/15-18 へ前倒し可能性

| Phase 2 sign-off 日 | 確度 | 根拠 |
|---|---|---|
| 7/15 (10 日前倒し) | **30-35%** | Phase 2 着手 6/10 + 5 週間 (35 日) |
| 7/18 (7 日前倒し) | **40-50%** | Phase 2 着手 6/17 + 4-5 週間 |
| 7/25 (現行維持) | **80%** | Phase 2 着手 6/24 + 31 日 |

### §5.3 Phase 2 narrative integration plan (deliverable 3) との連動

- Phase 2 narrative integration plan (本書と並行起案) で詳細化
- 5/22 内部運用着手シナリオ整合 + Marketing-D 5/22 narrative draft v1 + Marketing-ζ Round 10 final draft との接続を deliverable 3 で明文化

---

## §6 Owner 即決パッケージ（5/7 朝判断-4 即決依頼の最終形）

### §6.1 Owner 即決選択肢 final（CEO Round 9 v10 §7.3 拡張）

| 選択肢 | 帰結 | PM-ε 推奨 |
|---|---|---|
| **A. 案 C ハイブリッド + MS-2 trial 採用 (5/15 trial)** | Round 10 dispatch 案 C 前提 + 5/15 trial 追加、最短スケジュール | **本命推奨** (DoD 達成 + 徹底前倒し要求応答) |
| **A'. 案 C ハイブリッド (MS-2 trial なし、5/22 公式着手のみ)** | Round 10 dispatch 案 C 前提、Round 9 PM-C v1 §6.1 通り | サブ推奨 (MS-2 trial 失敗ペナルティを最小化) |
| **B. 判断-3 維持 (5/22 公式公開前倒し、Round 9 から判断切替なし)** | Marketing 28×28 → 18×18 圧縮継続、品質トレードオフ受容 | 非推奨 (確度 35-45%、Marketing narrative 整合悪化) |
| **C. 5/8 議決-26 で再判定** | Round 10 dispatch を案 A' / C 両 path 並列準備、コスト 1.4× | 非推奨 (組織コスト過大) |
| **D. F-1 fallback (議決-26 見送り)** | Round 10 deliverable は staged のまま Phase 1 W1-W4 で活用、5/19 W1 着手維持 | 緊急回避用 |

### §6.2 PM-ε 推奨 = 選択肢 A (案 C + MS-2 trial 採用)

#### 推奨理由

1. CEO Round 9 v10 §7.2 推奨 = 案 C ハイブリッド (Lv 4) と整合
2. MS-2 trial 採用で「徹底前倒し / 最短スケジュール」要求への応答 (Round 9 即決)
3. MS-2 trial 失敗時の組織コスト = 0 (5/22 公式着手で完全吸収)
4. MS-2 trial 成功時の Owner 信頼度向上効果大
5. DoD 「5/22 内部運用着手確度 75%+」達成可能 (MS-3 単独 75-80%)
6. DoD 「Phase 1 sign-off 5/30 確度 65%+」= MS-4 + MS-4' 統合で 5/30-6/3 期間内 70-75% 達成

#### Owner 即決 5/7 朝想定文面

```
判断-4: 案 C + MS-2 trial 採用 (選択肢 A) で進めて。
- MS-1 5/13 W1 着手
- MS-2 5/15 trial (新規)
- MS-3 5/22 公式着手
- MS-4 5/30 暫定 sign-off (チャレンジ) / MS-4' 6/3 公式 sign-off
- MS-5 6/27 朝 09:00 JST 公開
- Spend Cap (Anthropic Hard $50 / OpenAI Hard $20) は 5/6 夜までに設定 OK
```

---

## §7 並列他 7 Agent との整合性検証

### §7.1 Marketing-ζ narrative final と timeline 整合

| 整合点 | 内容 | 整合状態 |
|---|---|---|
| 5/22 朝 narrative | MS-3 内部運用着手 公式と同期、Owner 中間報告 v2 と Marketing 5/22 朝発射延期 narrative 同期 | **整合** |
| 6/27 朝公開 narrative | MS-5 と同期、DEC-019-052 維持 | **整合** |
| portfolio metrics 27 placeholder 差替 | Phase 1 sign-off 6/3 確定値反映、§2.5.2 タスク #1 で明文化 | **整合** |
| 5/15 trial narrative | MS-2 trial 成功時の Owner 中間報告 v1 と Marketing が連動可能 | **整合可** |

### §7.2 Secretary-η DEC-019-057 配布資料収集と命名整合

| 整合点 | 内容 | 整合状態 |
|---|---|---|
| 配布物 12 件命名 | deliverable 1 §4.2 で明文化、本書は #7 として位置付け | **整合** |
| DEC-019-057 起票 (Owner 判断-4 結果議決) | 本書 §6 Owner 即決パッケージで判断-4 内容 final 化 | **整合** |
| Secretary-η 値埋め担当 (5 placeholder) | deliverable 1 §1.3 で明文化、本書は値埋め対象外 (案 C timeline は確定済) | **整合** |

### §7.3 Review-δ 50 control 再監査結果プレースホルダで参照

| 整合点 | 内容 | 整合状態 |
|---|---|---|
| 必須コントロール 50 中 ≥48 件達成 | MS-1 DoD #3 + MS-3 DoD (tos-monitor 4 高ランクセル PASS で軸-3 ≥95%) | **整合** |
| Review-δ Round 10 再監査結果 | 本書 §1.1 MS-1/MS-3 確度寄与に反映 | **整合** |

### §7.4 Dev-α/β/γ Round 10 結果プレースホルダで参照

| 整合点 | 内容 | 整合状態 |
|---|---|---|
| Dev-α (needs_scout 49 ギャップ補完) | MS-3 DoD #2 needs_scout 本実装の前提 | **整合** |
| Dev-β (mock-claw e2e + dry-run 統合) | MS-2 trial DoD #1 の前提 | **整合** |
| Dev-γ (tos-monitor 4 高ランクセル改修) | MS-3 DoD #4 の前提 | **整合** |

---

## §8 結論（DoD 達成判定）

1. **案 C ハイブリッド timeline final 5 マイルストン確定** (§1.1): MS-1 5/13 → MS-2 5/15 trial → MS-3 5/22 → MS-4/4' 5/30/6/3 → MS-5 6/27 朝。
2. **各 MS DoD / 責任部署 / 残タスク明細 / 確度 全項目明文化** (§2.1-§2.5)。
3. **DoD「5/22 内部運用着手確度 75%+」着地予測 = 75-80% (MS-3 単独)** = **達成**。
4. **DoD「Phase 1 sign-off 5/30 確度 65%+」評価 = 5/30 単独 40-50% (未達)、5/30-6/3 期間内 70-75% (達成)** = **期間内達成**。
5. **Phase 2 着手 6/10-17 前倒し可能性 確度 20-50%** + **Phase 2 sign-off 7/15-18 前倒し可能性 確度 30-50%** = 余剰効果。
6. **Owner 即決選択肢 A (案 C + MS-2 trial 採用) PM-ε 推奨**: CEO Round 9 v10 §7 推奨と整合 + 徹底前倒し要求応答。
7. **並列他 7 Agent との整合性検証完了** (§7): Marketing-ζ + Secretary-η + Review-δ + Dev-α/β/γ + CEO 全件整合。
8. **Owner 物理拘束 5/13-6/27 期間 計 55-65 分** = Owner 残動作最小化維持。

---

## §9 関連決裁・参照

### §9.1 反映決裁

- DEC-019-007 / 025 / 033 / 050 / 051 / 052 / 053 / 054 / 055 / **056**
- DEC-019-057 (Round 10 Secretary-η 起票予定、Owner 判断-4 結果議決)

### §9.2 参照書

- `pm-phase1-transition-plan-v1.md` (Round 9 PM-C deliverable 2、§6 + §7 案 C 推奨、554 行)
- `pm-round9-10-2day-sprint-plan.md` (Round 9 PM-C deliverable 1、507 行)
- `pm-round10-decision-26-final-agenda.md` (Round 10 PM-ε deliverable 1、本書と同 dispatch)
- `ceo-round9-integrated-report-v10.md` (CEO Round 9 統合報告 v10、186 行)
- `marketing-launch-5-22-narrative-draft-v1.md` (Round 9 Marketing-D deliverable、723 行)
- `pm-phase2-plan-v1.md` (Round 8 β、Phase 2 v1 素案、496 行)

### §9.3 Risk Register v3.2 整合

- R-019-06 (BAN 30-60% / 12 ヶ月): MS-1 BAN drill #1 + MS-3 BAN drill #2 完遂で残存確率低減
- R-019-09 (NG-3 暫定値とオーナー要望不整合): MS-3 5/22 公式着手で 5/30 NG-3 議決と並行検証
- R-019-10 (重要分野ホワイトリスト未確定): MS-3 needs_scout 本実装 (Round 10 Dev-α 49 ギャップ補完済) で緑化
- R-019-11 (Codex 出力 OSS ライセンス検証フロー未整備): Phase 2 で扱い (Phase 1 範囲外)

### §9.4 既存議決 cross-ref 整合性

- DEC-019-052 (a)(b)(c): MS-5 6/27 朝公開で完全保持 (本書 §2.5.1 #5)
- DEC-019-051 (subscription 主軸 ≤$430): MS-1 〜 MS-5 全期間で維持
- DEC-019-050 (API ≤$30): MS-1 〜 MS-3 で重点監視 (mock 中心、本実装期間に+$10/月想定許容)

### §9.5 Phase 2 plan v1 への影響評価

- 案 C + MS-2 trial 採用時: Phase 2 着手 6/24 → **6/10-17 へ 7-14 日前倒し** 確度 20-50%
- Phase 2 sign-off 7/25 → **7/15-18 へ 7-10 日前倒し** 確度 30-50%
- Phase 2 narrative integration plan (deliverable 3) で詳細化

---

## フッタ — 改版履歴

| 版 | 日付 | 起案 | 主要変更 |
|---|---|---|---|
| v1 | 2026-05-04 (Round 10 PM-ε dispatch 起案) | PM 部門 (PM-ε 独立 Agent) | 初版 (案 C ハイブリッド timeline final、5 マイルストン MS-1〜MS-5、MS-2 5/15 trial 新規追加 + MS-4 5/30 暫定 / MS-4' 6/3 公式 two-track 設計、確度試算 + Owner 即決選択肢 A 推奨)|

**v1 確定**: 2026-05-04 (Round 10 PM-ε dispatch 完遂時) / **採択予定**: 5/7 朝 Owner 判断-4 即決受領 + 5/8 議決-26 採択 / **次回更新**: ① 5/7 朝 Owner 即決後 v1.1 ② Round 10 完遂時 確度値最新化 ③ 5/13 MS-1 達成後 v1.2

## フッタ詳細

- 文書: `projects/PRJ-019/reports/pm-case-c-timeline-final.md`
- 版: v1（2026-05-04、Round 10 PM-ε 担当 deliverable 2）
- 起案: PM 部門（PM-ε 独立 Agent）
- 範囲: 案 C ハイブリッド timeline final + 5 マイルストン (MS-1〜MS-5) + MS-2 trial 新規 + MS-4/4' two-track + 確度試算 + Owner 即決パッケージ
- 検収: CEO（Round 10 commit 時）+ Owner（5/7 朝判断-4 即決 + 5/8 議決-26 採決）
