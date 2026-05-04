最終更新: 2026-05-04 深夜（Round 9 起動時）/ 起案: PM 部門 / 実施責任: PM Agent (PM-C 担当) / 版: v1（2 日間集中スプリント計画書、5/4 深夜 → 5/6 夜）

# PRJ-019 Round 9-10 集中スプリント計画書 — 5/4 深夜 → 5/6 夜（2 日間 6 部署並列発注 + 統合）

- 案件: PRJ-019「Clawbridge」 — Open Claw を Owner-in-the-loop オーナーとする AI 組織ハーネス基盤
- 部署: PM 部門（Round 9 PM-C 担当、本書を deliverable 1 として起案）
- 作成日: 2026-05-04 深夜（Round 9 案 9-C 起動時、Owner GO + DEC-019-056 起票予定下）
- 版: **v1（初版、Round 9 並列発注計画 + Round 10 統合スコープ + 5/8 議事影響評価 + 5/22 公開前倒し確度評価）**
- 入力資料（必読、本書冒頭の優先順）:
  - `pm-phase1-plan-v3.md`（Round 7 着地、Phase 1 W0/W1〜W4 計画 v3、402 行）
  - `pm-cross-ref-final-v8.md`（Round 7 着地、Phase 1 41 件 cross-ref final、305 行）
  - `pm-phase2-plan-v1.md`（Round 8 β 着地、Phase 2 v1 素案、496 行）
  - `secretary-5-8-meeting-package-v9.md`（Round 7 着地、議題 21 件 35-45 分版）
  - `secretary-agenda-v7.md`（議題 v7、議決 20 件原本）
  - `dev-w2-prefetch-round8-alpha.md`（Round 8 α、Phase 1 W2 prefetch）
  - `tasks.md`（W0/W1/W2/W3/W4 全タスク 61 件）
  - `risks.md`（R-019-06/09/10/11/19/20/21/22 = Risk Register v3.2 21 件）
- 反映決裁:
  - DEC-019-007（Phase 1 強い条件付き Go、5 条件）
  - DEC-019-033（Owner-in-the-loop 透明 AI 組織モデル）
  - DEC-019-050（Anthropic API spend cap $30/月）
  - DEC-019-051（subscription plan 主軸方針 Phase 1 正式採用）
  - DEC-019-052（Marketing tone B + portfolio C + 6/27 朝 09:00 JST + Channel 3）
  - DEC-019-053（`.env.example` 2-tier 再設計）
  - DEC-019-054（5/8 検収会議 層 A+B 16 件 Owner 先行承認）
  - DEC-019-055（Round 8 + Plan 8-Full 採択）
  - **DEC-019-056（起票予定）**: Round 9-10 集中スプリント採択 + 5/22 朝公開前倒し可否評価条項

---

## §1 スプリント全体像（5/4 深夜 → 5/6 夜、3 マイルストン）

### §1.1 スプリント概要

Round 8 完遂着地（commit `de25d87`、11 ファイル / 4,035 行）で Phase 1 W1/W2 想定スコープの prefetch が 60%+ に到達した。Round 9-10 は **「W3/W4 想定スコープを W0-Week1 (5/4-5/8) 内に追加で前倒し吸収する 2 日間集中スプリント」** であり、6/27 公開を 5/22 朝公開へ 35 日前倒しできるかを実装側で先行検証することを主目的とする。

### §1.2 3 マイルストン

| MS | タイミング | 内容 | 部署 | DoD |
|---|---|---|---|---|
| **MS-1** | 5/4 深夜 → 5/5 夕方 | Round 9 = 6 部署並列発注（Dev-A1 / Dev-A2 / Review-B / PM-C / Marketing-D / Secretary-E） | 6 部署同時 | 各部署 deliverable 6/6 完遂、commit staged in standalone repo |
| **MS-2** | 5/5 夜 → 5/6 朝 | Round 9 着地確認 + Round 10 統合スコープ確定 | CEO + PM | Round 9 全 6 部署成果統合報告 + Round 10 発注書 6 件起票 |
| **MS-3** | 5/6 朝 → 5/6 夜 | Round 10 = 統合スコープ実施（既存 skill 非対話化 + end-to-end mock-claw run + dry-run 副作用ゼロ証明 + Phase 2 narrative full draft） | Dev / Review / Marketing 主軸 | mock-claw end-to-end Pass + dry-run 副作用 0 件 + Phase 2 narrative 100% draft |

### §1.3 スプリント期間内 commit cadence

| 日時 | commit 想定数 | 内容 |
|---|---|---|
| 5/4 深夜（24:00 JST 前） | 1 commit | Round 9 着手準備（本書 + 6 部署発注書） |
| 5/5 朝〜午後 | 3-4 commits | Round 9 6 部署並列実装、各部署完遂時に staged push |
| 5/5 夜 | 1 commit | Round 9 着地統合報告 + 進捗 70 → 73-75% |
| 5/6 朝 | 1 commit | Round 10 発注書 6 件 |
| 5/6 午後 | 2-3 commits | Round 10 統合実装、mock-claw / dry-run / Phase 2 narrative |
| 5/6 夜 | 1 commit | Round 10 着地統合報告 + 進捗 73-75 → 78-82% |
| **計** | **9-11 commits** | 2 日間で約 1 commit/2-4h ペース |

---

## §2 Round 9 6 部署並列発注内訳（DoD + 完遂判定基準）

### §2.1 Dev-A1 担当: 既存 skill 非対話化 (CB-D-W2-08 前倒し)

**スコープ**: claude-code-company 既存 skill (CEO / Secretary / Dev / Review / Marketing / Web-Ops / Research / PM) を完全非対話モード化し、Open Claw からの subprocess spawn でエラーなく完走できる状態にする。元々 W2 (5/26-5/30) 想定のタスクを W0-Week1 内 (5/5-5/6) に前倒し。

**DoD**:
- 8 ロール skill 全てに `--non-interactive` flag 実装、prompt 待機ゼロ
- mock-claw からの subprocess spawn で 8 skill 全てが exit 0 完走
- skill 内部の `Read-Host` / `prompt` / `confirm` 呼び出しを完全除去
- 各 skill に対する unit test を最低 3 ケース実装（200 行+）

**完遂判定基準**: `pnpm test --filter skills` で全 24 ケース GREEN + commit staged

**工数見積**: 6-8h（Dev 1 名）

### §2.2 Dev-A2 担当: end-to-end mock-claw run (CB-D-W3-03 前倒し)

**スコープ**: Open Claw → CEO 構造化 JSON IF を mock-claw 上で実装し、end-to-end で「needs_scout (mock) → 提案生成 (mock) → CEO 判定 → Dev 実装 (mock) → review (mock) → audit log」の最小ループを 1 周完走させる。元々 W3 (6/2-6/6) 想定のタスクを 5/6 までに前倒し。

**DoD**:
- 構造化 JSON schema 確定（zod schema 採用、5 段階 phase 区分: scout / propose / decide / implement / review）
- mock-claw 上で end-to-end run が 60s 以内に完走
- audit log SHA-256 hash chain への書込確認
- 副作用ゼロ（git diff 全件 0、dry-run mode 兼用）
- e2e test 5 ケース実装

**完遂判定基準**: `pnpm e2e:mock-claw` 5 ケース全 GREEN + 副作用 0 件

**工数見積**: 8-10h（Dev 1 名）

### §2.3 Review-B 担当: dry-run 副作用ゼロ証明 (CB-D-W4-01/02 前倒し)

**スコープ**: dry-run mode を W4 (6/9-6/13) 想定から 5/6 までに前倒し実装し、Dev-A2 の end-to-end mock-claw run と組み合わせて「実モードと dry-run mode で git diff が 100% 一致 → dry-run mode で出力された計画が実モードで実行されることの保証」を Review 部門が公式検証する。

**DoD**:
- dry-run mode flag 実装 + 全副作用操作の dry-run 切替確認
- dry-run × 3 連続実行 + git diff 全件 0 確認
- 実モード × 3 連続実行 + dry-run と git diff 100% 一致確認
- 副作用ゼロ証明レポート 300 行+ 起案
- DEC-019-007 副作用ゼロ DoD 早期達成エビデンス化

**完遂判定基準**: `verify-zero-side-effect.sh` exit 0 + dry-run × 3 + 実モード × 3 = 6 連続全 PASS

**工数見積**: 6-8h（Review + Dev 連携）

### §2.4 PM-C 担当: 集中スプリント計画書 + 移行計画 + 議題 v10 update（本書 deliverable 群）

**スコープ**: 本書 + `pm-phase1-transition-plan-v1.md` + `pm-5-8-agenda-v10-decision-26-prep.md` の 3 deliverable を起案し、Round 9-10 の組織的可視性と 5/8 議事影響評価を確保する。

**DoD**:
- 本書 400-600 行
- `pm-phase1-transition-plan-v1.md` 500-700 行
- `pm-5-8-agenda-v10-decision-26-prep.md` 300-450 行
- 既存議決 21 件構造を破壊しない（議決-26 は追加）
- DEC-019-007/033/050/051/052/053/054/055/056 への cross-ref 全件整合

**完遂判定基準**: 3 ファイル全完遂 + cross-ref 漏れ 0 件 + commit staged

**工数見積**: 8-10h（PM 1 名、本書起案中）

### §2.5 Marketing-D 担当: Phase 2 narrative full draft (Phase 2 W5 想定の前倒し)

**スコープ**: Phase 2 (6/24-7/25) の Marketing 第 2 弾公開向け narrative を 5/22 朝公開シナリオに整合させた full draft で起案する。Phase 2 plan v1 §0.2 期間 6/24-7/25 を前提に、5/22 朝公開時点で「Phase 1 完遂 + Phase 2 着手宣言 + 拡張ジャンル予告」narrative 完備を目指す。

**DoD**:
- portfolio Section 11-15（Phase 2 拡張ジャンル予告）500-700 行
- technical-deep-dive vol 7-9（Phase 2 自律化進化、3 編連載構造）900-1,200 行
- launch X thread Phase 2 用（5 launch posts ≤280 chars × 2 set）400 行
- 5/22 朝公開と 6/27 朝公開の両シナリオ対応の差替版（中間案 § 6 ハイブリッド対応）

**完遂判定基準**: 草稿 1,800-2,300 行 完遂 + DEC-019-052 整合 + commit staged

**工数見積**: 8-10h（Marketing 1 名）

### §2.6 Secretary-E 担当: 5/8 配布資料 v10 起案 + minutes-template v5 + dashboard 反映

**スコープ**: 本書 PM-C deliverable 3（議題 v10 update 計画）を受けて、5/8 配布資料 v10 系列を起案する。議決-26 追加 or 見送りの分岐に対応。

**DoD**:
- `secretary-5-8-meeting-package-v10.md` 起案（v9 + 議決-26 議題追加 + Round 9-10 完遂状況反映、500-600 行）
- `secretary-w0-week1-meeting-minutes-template-v5.md` 起案（v4 + 議決-26 sign-off 欄、500 行）
- `dashboard/active-projects.md` 1 行更新（PRJ-019 進捗 70 → 78-82% 想定）
- 議決-26 採択 / 見送り分岐に対応した 2 通り版

**完遂判定基準**: 2 ファイル + dashboard 完遂 + commit staged

**工数見積**: 4-6h（Secretary 1 名）

### §2.7 Round 9 部署別工数集計

| 部署 | 工数 |
|---|---|
| Dev-A1 | 6-8h |
| Dev-A2 | 8-10h |
| Review-B | 6-8h |
| PM-C | 8-10h |
| Marketing-D | 8-10h |
| Secretary-E | 4-6h |
| **計** | **40-52h** |

→ 6 部署並列で 5/4 深夜 → 5/5 夕方 (約 18h) 内に完遂可能（並列度 6、平均 7-9h/部署、ピーク 10h を Dev-A2 / Marketing-D が担当）。

---

## §3 Round 10 統合スコープ（5/6 朝 → 5/6 夜）

### §3.1 Round 10 主要スコープ 4 軸

| 軸 | 内容 | 担当 | DoD |
|---|---|---|---|
| **R10-1** | **既存 skill 非対話化 + 構造化 JSON IF + dry-run** の三位一体統合検証 | Dev + Review | mock-claw end-to-end + dry-run × 3 連続 PASS + 副作用 0 |
| **R10-2** | **end-to-end mock-claw run** での「Phase 1 W3/W4 想定スコープ全消化」の SLA 化検証 | Dev + Review | needs_scout (mock) → 完遂までの全 phase の wall-clock < 60min / 想定 cost < $5 / HITL 100% |
| **R10-3** | **Phase 2 narrative full draft + 5/22 朝公開シナリオ整合** | Marketing | portfolio + technical-deep-dive + X thread 全 v1 草稿完成 |
| **R10-4** | **Round 9-10 統合報告書 + DEC-019-056 起票準備** | PM + CEO | `pm-round9-10-integration-report.md` 起案 + DEC-019-056 起票文 |

### §3.2 Round 10 着地時の進捗想定

- Round 9 完遂時: 進捗 70% → **73-75%**
- Round 10 完遂時: 進捗 73-75% → **78-82%**
- Phase 1 W1/W2/W3/W4 想定スコープ prefetch 比率: 60%+ → **75-85%**

### §3.3 Round 10 部署別工数集計

| 部署 | 工数 |
|---|---|
| Dev (R10-1 + R10-2) | 12-16h |
| Review (R10-1 + R10-2) | 6-8h |
| Marketing (R10-3) | 6-8h |
| PM (R10-4) | 4-6h |
| CEO (R10-4) | 2-4h |
| **計** | **30-42h** |

→ 5/6 朝 → 5/6 夜 (約 12h) 内に完遂可能（並列度 5、平均 6-8h/部署、ピーク 16h を Dev が担当 = 朝開始で夜完遂）。

---

## §4 5/6 中の Owner Daily 報告 v10 構成

### §4.1 報告タイミング

| 時刻 | 報告内容 | 配布先 |
|---|---|---|
| 5/5 夜 21:00 JST | Round 9 着地報告（6 部署 deliverable 6/6 完遂、進捗 70 → 73-75%） | Owner Slack DM |
| 5/6 昼 13:00 JST | Round 10 中間報告（R10-1/R10-2 進行中、R10-3/R10-4 着手） | Owner Slack DM |
| 5/6 夜 21:00 JST | Round 10 着地報告 + DEC-019-056 起票文最終版 | Owner Slack DM |

### §4.2 5/6 夜 21:00 報告 (Daily 報告 v10) 構成

```
PRJ-019 Daily 報告 v10 — 2026-05-06 夜（Round 9-10 集中スプリント完遂着地）

§1 Round 9-10 完遂サマリ
- Round 9 6 部署並列: 6/6 完遂、計 X ファイル / Y 行
- Round 10 統合スコープ: R10-1〜R10-4 全完遂

§2 Phase 1 W3/W4 想定スコープ prefetch 状況
- 既存 skill 非対話化: 100% (元 W2 想定タスク前倒し)
- end-to-end mock-claw run: 100% (元 W3 想定タスク前倒し)
- dry-run 副作用ゼロ証明: 100% (元 W4 想定タスク前倒し)
- 計: W2 + W3 + W4 想定スコープの 50%+ を W0-Week1 内に吸収

§3 5/22 朝公開前倒し確度評価
- §9 推奨 timeline 3 案（PM-C deliverable 2 §7 参照）
- 確度: 案 A (5/22 朝公開) 35-45% / 案 B (6/27 朝公開維持) 95% / 案 C (ハイブリッド = 5/22 内部運用着手 + 6/27 朝公開) 80-85%

§4 議決-26 採択推奨度
- Lv 1-5 の Lv 4「強く推奨、ただし条件付き」想定（Round 9-10 完遂時）

§5 Owner 5/8 検収会議所要時間影響
- 議決-26 追加で 35-45 分 → 50-60 分（議論 10-15 分追加）
- Owner 物理拘束 +15 分許容判断を 5/7 朝までに依頼

§6 残動作
- Owner: 5/8 検収会議出席のみ（35-45 → 50-60 分）
- 全部署: Round 10 commit push 完了、5/8 議事準備のみ
```

### §4.3 報告様式

絵文字なし、Markdown 構造、各セクション 5-7 行以内、Owner 即読了 5 分以内目標。

---

## §5 Owner 残動作 0 件継続条件

### §5.1 Round 9-10 期間中の Owner 残動作

| 動作 | 想定 | 回避策 |
|---|---|---|
| Round 9 発注書承認 | 0 件想定 | CEO 一任、Owner 事後報告のみ |
| Round 10 発注書承認 | 0 件想定 | CEO 一任、Owner 事後報告のみ |
| 議決-26 起票判断 | 5/7 朝に Owner 確認 1 件 | 5/7 朝 09:00 JST までに「議決-26 追加 / 見送り」を Owner 即決受領 |
| DEC-019-056 起票承認 | 5/6 夜に Owner 即決 1 件 | Round 10 着地報告と同時に DEC-019-056 起票文を提示、即決受領 |

### §5.2 0 件継続のための Owner 物理拘束時間

| タイミング | 時間 | 内容 |
|---|---|---|
| 5/5 夜 | 5 分 | Round 9 着地報告読了 |
| 5/6 昼 | 3 分 | Round 10 中間報告読了 |
| 5/6 夜 | 10 分 | Round 10 着地報告 + DEC-019-056 即決 |
| 5/7 朝 | 5 分 | 議決-26 追加 / 見送り即決 |
| **計** | **23 分** | 2 日間で 23 分のみ |

→ Owner 残動作 = 「読了 + 即決」のみ 0 件継続維持可能（DEC-019-054 「オプション 1 で進めて」と同様パターン）。

### §5.3 Owner Spend Cap 設定残課題（既存）

- Anthropic Spend Cap Hard $50/月（5/18 期限） — Round 9-10 期間外、影響なし
- OpenAI Spend Cap Hard $20/月（5/18 期限） — 同上

---

## §6 リスク 4 件と緩和策

### §6.1 R-RUSH-01: Round 9 6 部署並列での deliverable 取りこぼし

- **確率**: 中（並列度 6 + 工数 40-52h を 18h で完遂は前例なし）
- **影響**: 中（Round 10 着手遅延 1-2h）
- **緩和策**: ① CEO による 5/5 朝・午後 2 回の進捗中間確認、② 各部署 DoD 明確化（本書 §2 参照）、③ 完遂困難時の優先順位 = Dev-A1 > Dev-A2 > Review-B > PM-C > Marketing-D > Secretary-E

### §6.2 R-RUSH-02: Round 10 mock-claw end-to-end run の副作用検出

- **確率**: 低（Dev-A2 で副作用ゼロ実装済前提）
- **影響**: 高（dry-run 副作用ゼロ証明の信頼性毀損 → 議決-26 採択困難化）
- **緩和策**: ① dry-run mode を default に設定、② Round 9 Dev-A2 deliverable 段階で副作用 0 確認済前提、③ 検出時は即座に Round 10 中断 + 5/8 議決-26 見送り fallback

### §6.3 R-RUSH-03: 5/8 議事時間 35-45 → 50-60 分への再延長で Owner 物理拘束限界超過

- **確率**: 中（議決-26 議論 10-15 分追加で +33% 増加）
- **影響**: 中（Owner 集中力 / 議決品質低下）
- **緩和策**: ① 5/7 朝 Owner 即決で議決-26 採択条件 5 軸の事前承認（先行承認パターン）、② 議決-26 議事時間を実 7-10 分に圧縮、③ 採択時は Owner 即決のみで議論なし

### §6.4 R-RUSH-04: Marketing-D Phase 2 narrative full draft の 5/22 朝公開シナリオ整合エラー

- **確率**: 中（5/22 と 6/27 の二択 narrative draft で混乱発生可能性）
- **影響**: 低（Marketing 6/27 朝公開準備に影響なし、5/22 朝公開時のみ追加修正必要）
- **緩和策**: ① 5/22 朝公開シナリオ用 narrative を「optional」扱い、② 6/27 朝公開準備は DEC-019-052 通り維持、③ 5/22 朝公開採択時のみ Round 11 で integration

### §6.5 リスク総合評価

- **総合スコア**: 中（4 件中 1 件中、3 件低-中）
- **発動確率合計**: 約 30-40%（少なくとも 1 件発動）
- **発動時 fallback**: Round 9 のみ完遂で Round 10 縮小実施（mock-claw end-to-end のみ + dry-run 副作用ゼロ証明見送り）

---

## §7 5/8 検収会議への影響（議事時間 35-45 → 50-60 分への再延長受容判断）

### §7.1 影響の構造

| 区分 | v9 (現状) | **v10 (議決-26 追加時)** | 差分 |
|---|---|---|---|
| 議決件数 | 21 件（A 11 + B 5 + C 5） | 22 件（A 11 + B 5 + C 5 + 議決-26） | +1 件 |
| 所要時間 | 35-45 分 | **50-60 分** | +15 分 |
| Owner 物理拘束 | 0.6-0.75h | **0.85-1.0h** | +0.25h |
| 採決方式 | A=スタンプ / B=確認 / C=議論 | 議決-26 = 議論 + 採決（10-15 分） | +議決-26 議論枠 |

### §7.2 受容判断 3 軸

| 軸 | 評価 | 受容可否 |
|---|---|---|
| **Owner 物理拘束 +15 分** | 50-60 分は通常の検収会議 60-90 分の下限内 | **受容可** |
| **議事品質維持** | 議決-26 議論 10-15 分 = 層 C 同等の議論時間 | **受容可** |
| **5/22 朝公開前倒し採択時のメリット** | Round 9-10 完遂による 35 日前倒しの可否評価が議決-26 で確定 | **受容推奨** |

### §7.3 推奨判断

**議決-26 追加 = 推奨**。Owner 物理拘束 +15 分は 5/22 朝公開前倒し可否評価という戦略的価値に対して妥当。ただし Round 9-10 完遂結果次第で「採択推奨度 Lv 1-5」が変動し、Lv 1-2 (採択推奨弱) なら見送り fallback (5/30 NG-3 議決とパッケージ化) を選択。

### §7.4 議決-26 議事構造（試案、PM-C deliverable 3 §1 参照）

- 議題文案 200-400 字
- CEO 推奨案提示 2 分
- Owner 質疑 3-5 分
- 採決 + sign-off 1-2 分
- 計 7-10 分（バッファ +5 分で最大 15 分想定）

---

## §8 commit cadence + push runbook

### §8.1 Round 9 commit cadence

| 時刻 | commit 種別 | commit message 例 |
|---|---|---|
| 5/4 深夜 24:00 | 起動 commit | `pm(PRJ-019): Round 9 起動 — 6 部署並列発注 + 集中スプリント計画 v1` |
| 5/5 朝 09:00 | Dev-A1 完遂 | `dev(PRJ-019): Round 9 Dev-A1 既存 skill 非対話化 8/8 完遂 + 24 unit tests GREEN` |
| 5/5 昼 13:00 | Dev-A2 完遂 | `dev(PRJ-019): Round 9 Dev-A2 end-to-end mock-claw run 5 cases GREEN + 副作用 0` |
| 5/5 午後 16:00 | Review-B 完遂 | `review(PRJ-019): Round 9 Review-B dry-run 副作用ゼロ証明 6 連続 PASS` |
| 5/5 午後 17:00 | PM-C 完遂 | `pm(PRJ-019): Round 9 PM-C 3 deliverable 完遂 + cross-ref 整合 100%` |
| 5/5 夕方 18:00 | Marketing-D 完遂 | `marketing(PRJ-019): Round 9 Marketing-D Phase 2 narrative full draft 1,800+ 行完遂` |
| 5/5 夕方 19:00 | Secretary-E 完遂 | `secretary(PRJ-019): Round 9 Secretary-E 5/8 配布資料 v10 起案 + minutes-template v5` |
| 5/5 夜 21:00 | 着地統合 | `dashboard(PRJ-019): Round 9 完遂着地反映 70→73-75%` |

### §8.2 Round 10 commit cadence

| 時刻 | commit 種別 | commit message 例 |
|---|---|---|
| 5/6 朝 09:00 | 起動 commit | `pm(PRJ-019): Round 10 起動 — 統合スコープ 4 軸発注` |
| 5/6 午後 14:00 | R10-1 完遂 | `dev(PRJ-019): Round 10 R10-1 三位一体統合検証 PASS` |
| 5/6 午後 16:00 | R10-2 完遂 | `dev+review(PRJ-019): Round 10 R10-2 mock-claw end-to-end SLA 化検証 PASS` |
| 5/6 午後 18:00 | R10-3 完遂 | `marketing(PRJ-019): Round 10 R10-3 Phase 2 narrative + 5/22 朝公開シナリオ整合` |
| 5/6 夜 20:00 | R10-4 完遂 | `pm+ceo(PRJ-019): Round 10 R10-4 統合報告 + DEC-019-056 起票文` |
| 5/6 夜 21:00 | 着地統合 | `dashboard(PRJ-019): Round 10 完遂着地反映 73-75→78-82%` |

### §8.3 push runbook

- **対象 repo**: PRJ-019 standalone repo `hironori-oi/prj019-claude-code-company` (DEC-019-053 v15.2 Plan A)
- **branch**: `main` (direct push、branch protection は 5/15 期限の CB-D-W1-06 で適用予定 = Round 9-10 期間外)
- **push 単位**: 各 commit 完遂後即 push（並列発注の独立性確保）
- **競合解消**: 同時 push 衝突発生時は CEO 統合判断で merge order 確定

### §8.4 parent repo dashboard reconcile

- Round 9 着地時: parent repo `claude-code-company/dashboard/active-projects.md` 1 行更新（70 → 73-75%）
- Round 10 着地時: 同上（73-75 → 78-82%）
- 既存 commit `de25d87` (Round 8) 系列の追記。

---

## §9 5/22 朝公開前倒しの確度評価（Round 9-10 完遂時の追加情報を踏まえた 6/27 → 5/22 timeline 試算）

### §9.1 現行 timeline (DEC-019-052) の構造

- Phase 1 sign-off: 6/20（金）
- Marketing 公開準備: 6/22-26（5 日間 = 段階 1 実装 + 段階 2 Review + 段階 3 Owner 最終承認）
- 公開: 6/27 朝 09:00 JST

### §9.2 5/22 朝公開前倒しシナリオの構造変化

- Phase 1 sign-off: ~~6/20~~ → **5/19 夜 (W2 想定スコープ前倒し完遂時)**
- Marketing 公開準備: ~~6/22-26~~ → **5/14-21 (8 日間)** or **5/19-21 (3 日間圧縮)**
- 公開: ~~6/27 朝~~ → **5/22 朝 09:00 JST**

### §9.3 Marketing 準備期間 35 → 16 日 圧縮の現実性

| 区分 | 6/27 朝公開 (現行) | 5/22 朝公開 (前倒し) | 圧縮幅 |
|---|---|---|---|
| Phase 1 完了から公開まで | 6/20 → 6/27 = 7 日 | 5/19 → 5/22 = 3 日 | 4 日 |
| Phase 1 着手から公開まで | 5/26 → 6/27 = 32 日 | 5/26 → 5/22 = ~~−4 日~~ (Phase 1 着手前公開不可) | 不可 |
| Phase 0 完了 (5/2) から公開まで | 5/2 → 6/27 = 56 日 | 5/2 → 5/22 = 20 日 | 36 日 |
| Marketing 草稿完備から公開まで | 5/4 (Round 5/6) → 6/27 = 54 日 | 5/4 → 5/22 = 18 日 | 36 日 |

→ **5/22 朝公開は Phase 1 着手 5/26 より前 → Phase 1 W1 実装が走る前に公開する構造になり、DEC-019-007 5 条件 (mock 70% / 副作用ゼロ / HITL 100% / ≤$430 / ベンチ 10 連続 ≥ 80%) のうち 5 条件中 0 件が達成不可** = **5/22 朝公開は Phase 1 完遂前公開 = ToS / リスク 観点から不可**。

### §9.4 5/22 朝公開可能性の再定義

実装前公開は不可だが、Round 9-10 完遂時に **「5/22 朝に Phase 1 W1 着手前 prefetch 状態の中間公開」を実施する代替シナリオ** は検討可能。具体構造:

| シナリオ | 公開内容 | DEC-019-007 整合 | Marketing 整合 |
|---|---|---|---|
| 案 A: 5/22 朝公開 (Phase 1 完遂版) | 完成プロダクト | **不可** (Phase 1 未着手) | DEC-019-052 違反 |
| **案 A': 5/22 朝公開 (中間公開、Round 9-10 prefetch 50%+ 状態)** | 「Phase 1 W1 着手予告 + W2/W3/W4 想定スコープの 50%+ 前倒し完遂宣言」narrative | **可** (Phase 1 完遂宣言ではない、prefetch 進捗のみ) | DEC-019-052 6/27 朝公開と並立可能（中間公開 + 完成公開の 2 段構造） |
| 案 B: 6/27 朝公開維持 | 完成プロダクト | **可** | DEC-019-052 通り |
| 案 C: 6/27 朝公開 + 5/22 内部運用着手のみ | Marketing 公開なし | **可** | DEC-019-052 通り |

### §9.5 確度試算

| 案 | 確度 | 根拠 |
|---|---|---|
| **案 A' (5/22 朝中間公開 + 6/27 朝完成公開)** | 35-45% | Round 9-10 完遂で prefetch 50%+ 達成 + 中間公開 narrative 整合 + Marketing 16 日準備期間で 1,800-2,300 行 草稿 → 段階 1-3 圧縮可 |
| **案 B (6/27 朝完成公開のみ、現行)** | 95% | Round 5/6/7/8 完遂で portfolio + technical-deep-dive vol 1-6 + X thread 草稿完備、6/22-26 段階 1-3 通り |
| **案 C (6/27 朝完成公開 + 5/22 内部運用着手のみ)** | 80-85% | Phase 1 W1 着手 5/26 → 5/19 へ 7 日前倒し（Round 9-10 prefetch 効果）、Marketing は 6/27 通り維持 |

### §9.6 推奨

- **PM 部門推奨 = 案 C (6/27 朝公開維持 + 5/22 内部運用着手 + Marketing 6/22-26 段階 1-3 維持)**
- 理由: ① 案 A' の中間公開は Marketing 部門の追加工数 6-8h 必要（5/22 朝公開向け差替版）、② 案 B は確度 95% で安全、③ 案 C は Phase 1 着手 7 日前倒しで内部スケジュール余裕創出 + Marketing は変更なし
- 議決-26 採択推奨度 = **Lv 4 (強く推奨、ただし条件付き)**（PM-C deliverable 3 §1 参照）

---

## §10 結論

1. **Round 9 = 6 部署並列発注（Dev-A1 / Dev-A2 / Review-B / PM-C / Marketing-D / Secretary-E）、5/4 深夜 → 5/5 夕方 18h 内完遂**、Round 10 = 統合スコープ（4 軸）、5/6 朝 → 5/6 夜 12h 内完遂。
2. **Round 9-10 完遂で進捗 70 → 78-82%、Phase 1 W1/W2/W3/W4 想定スコープ prefetch 60% → 75-85%**。
3. **5/22 朝公開前倒しは案 A (Phase 1 完遂公開) では不可、案 A' (中間公開 + 6/27 完成公開) 確度 35-45%、案 B (現行維持) 確度 95%、案 C (6/27 維持 + 5/22 内部運用着手) 確度 80-85%。PM 推奨 = 案 C**。
4. **議決-26 = 「実運用着手 Go (5/22)」追加で 5/8 議事時間 35-45 → 50-60 分、Owner 物理拘束 +15 分**（受容可）。
5. **Owner 残動作 0 件継続維持**（読了 + 即決のみ、計 23 分 / 2 日間）。
6. **DEC-019-056 起票予定**: Round 9-10 集中スプリント採択 + 5/22 朝公開前倒し可否評価条項 + 案 C 推奨採択。

---

## §11 関連決裁・参照

### §11.1 反映決裁

- DEC-019-007: Phase 1 強い条件付き Go（5 条件）
- DEC-019-033: Owner-in-the-loop 透明 AI 組織モデル
- DEC-019-050: Anthropic API spend cap $30/月
- DEC-019-051: subscription plan 主軸方針 Phase 1 正式採用
- DEC-019-052: Marketing tone B + portfolio C + 6/27 朝 09:00 JST + Channel 3
- DEC-019-053: `.env.example` 2-tier 再設計
- DEC-019-054: 5/8 検収会議 層 A+B 16 件 Owner 先行承認
- DEC-019-055: Round 8 + Plan 8-Full 採択
- **DEC-019-056（起票予定）**: Round 9-10 集中スプリント採択 + 5/22 朝公開前倒し可否評価条項

### §11.2 参照書

- `pm-phase1-plan-v3.md`（Round 7、Phase 1 計画 v3）
- `pm-cross-ref-final-v8.md`（Round 7、cross-ref final）
- `pm-phase2-plan-v1.md`（Round 8 β、Phase 2 v1 素案）
- `secretary-5-8-meeting-package-v9.md`（Round 7、議題 21 件 35-45 分版）
- `dev-w2-prefetch-round8-alpha.md`（Round 8 α、W2 prefetch）
- `tasks.md`（Phase 1 W0/W1/W2/W3/W4 全 61 件）
- `risks.md`（Risk Register v3.2、21 件）

### §11.3 Risk Register v3.2 整合性検証

| Risk ID | 概要 | Round 9-10 影響 |
|---|---|---|
| R-019-06 | BAN 確率 30-60% / 12 ヶ月 | Round 9-10 で API 消費追加なし（mock-claw 中心） → 影響なし |
| R-019-09 | NG-3 暫定値とオーナー要望不整合 | 緑化済 (Round 6)、Round 9-10 で変動なし |
| R-019-10 | 重要分野ホワイトリスト未確定 | Round 9-10 で needs_scout 実装なし → 影響なし |
| R-019-11 | Codex 出力 OSS ライセンス検証フロー未整備 | Round 9-10 で codex 出力なし（mock 中心） → 影響なし |
| R-019-19 | （v3.1 新規） | Round 9-10 で対象範囲外 |
| R-019-20 | （v3.1 新規） | 同上、Round 6 で `--scope=workflow` 緑化済 |
| R-019-21 | （v3.1 新規） | Round 9-10 で対象範囲外 |
| R-019-22 | （v3.1 新規） | 同上 |

→ Risk Register v3.2 全件 Round 9-10 で新規発動なし。

### §11.4 Phase 2 plan v1 への影響評価

- **Round 9-10 が Phase 2 着手 6/24 → 6/17 へどう影響するか**:
  - Round 10 R10-2 = mock-claw end-to-end SLA 化検証 完遂時、Phase 1 W3/W4 想定スコープの 50%+ 吸収。
  - Phase 1 W4 (6/16-6/20) 内タスク 8 件中 4-5 件が Round 9-10 で前倒し完遂 → Phase 1 sign-off 6/20 → 6/13-15 へ 5-7 日前倒し可能。
  - Phase 2 着手 6/24 → **6/17 へ 7 日前倒し**確度: **40-50%**（Round 9-10 完遂 + Phase 1 W1-W3 順調進捗の両条件下）。
  - Phase 2 plan v1 §0.2 「最大 1 週間前倒し 6/24 → 6/17 候補」の可否が Round 9-10 完遂時に正式評価可能化。

---

## フッタ — 改版履歴

| 版 | 日付 | 起案 | 主要変更 |
|---|---|---|---|
| v1 | 2026-05-04 深夜（Round 9 起動時） | PM 部門 | 初版（2 日間集中スプリント計画 + Round 9 6 部署並列発注 + Round 10 統合スコープ + 5/22 朝公開前倒し確度評価） |

**v1 確定**: 2026-05-04 深夜 / **採択予定**: Round 9 着地 commit 時 (5/5 夜想定) / **次回更新**: ① Round 9 着地後（5/5 夜）② Round 10 着地後（5/6 夜）③ 5/8 議決-26 結果反映後（5/8 夜）

## フッタ詳細

- 文書: `projects/PRJ-019/reports/pm-round9-10-2day-sprint-plan.md`
- 版: v1（2026-05-04 深夜、Round 9 PM-C 担当 deliverable 1）
- 起案: PM 部門
- 範囲: 5/4 深夜 → 5/6 夜 2 日間スプリント全体計画
- 検収: CEO（Round 9 commit 時）+ Owner（5/8 議決-26 採択 / 見送り）
