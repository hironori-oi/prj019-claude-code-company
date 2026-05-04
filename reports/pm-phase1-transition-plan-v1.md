最終更新: 2026-05-04 深夜（Round 9 起動時）/ 起案: PM 部門 / 実施責任: PM Agent (PM-C 担当) / 版: v1（Phase 1 W0 → 運用 MVP 着地 transition plan）

# PRJ-019 Phase 1 W0 → 運用 MVP 着地 transition plan v1（Round 9-10 完遂前提の前倒し可否評価）

- 案件: PRJ-019「Clawbridge」 — Open Claw を Owner-in-the-loop オーナーとする AI 組織ハーネス基盤
- 部署: PM 部門（Round 9 PM-C 担当 deliverable 2）
- 作成日: 2026-05-04 深夜（Round 9 案 9-C 起動時）
- 版: **v1（初版、W1 着手 5/19 → 5/7 への 12 日前倒し可否 + 公開 6/27 → 5/22 への 35 日前倒し可否評価）**
- 入力資料（必読、本書冒頭の優先順）:
  - `pm-round9-10-2day-sprint-plan.md`（本日同 Round 9 起案、deliverable 1）
  - `pm-phase1-plan-v3.md`（Round 7 着地、Phase 1 計画 v3、402 行）
  - `pm-cross-ref-final-v8.md`（Round 7 着地、41 件 cross-ref final、305 行）
  - `pm-phase2-plan-v1.md`（Round 8 β 着地、Phase 2 v1 素案、496 行）
  - `tasks.md`（Phase 1 W0/W1/W2/W3/W4 全 61 件タスク）
  - `risks.md`（Risk Register v3.2、21 件）
- 反映決裁:
  - DEC-019-007（Phase 1 強い条件付き Go、5 条件）
  - DEC-019-033（Owner-in-the-loop 透明 AI 組織モデル）
  - DEC-019-050/051/052/053/054/055
  - **DEC-019-056（起票予定）**: Round 9-10 集中スプリント採択 + 5/22 朝公開前倒し可否評価条項

---

## §0 本書の目的（一行サマリ）

**「Round 9-10 完遂時に W1 着手 5/19 → 5/7 への 12 日前倒し可否 + 公開 6/27 → 5/22 への 35 日前倒し可否を 5 軸で構造的に評価し、推奨 timeline 3 案を CEO 提示用の trade-off 表として整理し、5/8 議決-26 (実運用着手 Go) の前提条件と否決時 fallback を明文化する」**。

---

## §1 現行 Phase 1 計画の再描画（Round 7 v3 + Round 8 β 反映）

### §1.1 Phase 1 全体タイムライン（再描画）

| 期 | 期間 | 主タスク | DoD | Round 5/6/7/8 prefetch 状態 |
|---|---|---|---|---|
| **W0** | 2026-05-02 〜 2026-05-18（17 日間） | 環境準備 / 契約 / オーナー直接確認 + Round 5/6/7/8 prefetch | W0 全タスク完遂 + Owner Vault + Slack live smoke + workflow 緑 | **進捗 70%、Round 8 完遂着地済** |
| W1 | 2026-05-19 〜 2026-05-23（5 日間） | ハードガード G-01/04/05/06/08（前倒し済）+ G-V2-11 OAuth 隔離 | G-01〜G-08 + G-V2-11 動作確認 | **G-01/04/05/06/08 = Round 6 で前倒し完遂、5 件 SP 12.5d 圧縮** |
| W2 | 2026-05-26 〜 2026-05-30（5 日間） | 監視・隔離 G-02/03'/07/09/10 + tos_monitor + 既存 skill 非対話化 + Slack alert | G-02/03'/07/09/10 動作確認 + tos_monitor 起動 + skill 非対話化完遂 | **G-09 audit log SHA-256 + G-02 spawn timeout + G-03' process tree kill = Round 7 で実装検証完遂、22 new tests + 140/140 pass** |
| W3 | 2026-06-02 〜 2026-06-06（5 日間） | needs_scout + 構造化 JSON IF + 評価関数 v0 + 公開ガード G-11 + ベンチマーク準備 | G-11 完遂 + 必須コントロール 23/23 + ベンチ準備完了 | 部分: HITL gate enforcer + dashboard MVP は Round 7/8 で着地 |
| W4 | 2026-06-09 〜 2026-06-13（5 日間） | dry-run + 副作用ゼロ証明 + ベンチ 10 連続 + Phase 2 設計 + 完了レポート | G-12 完遂 + Phase 1 PoC DoD 達成 + Phase 2 Go/NoGo 判定材料 | 部分: verify-zero-side-effect.sh = Round 5 で前倒し完遂、Phase 2 plan v1 = Round 8 β |
| **sign-off** | **2026-06-20** | Phase 1 sign-off（Round 7 で 6/13 → 6/20 に統一） | DEC-019-007 5 条件 PASS | — |
| **公開** | **2026-06-27 朝 09:00 JST** | Marketing 公開（DEC-019-052 portfolio + technical-deep-dive vol 1-6 + X thread） | 6/22-26 段階 1-3 + 6/27 朝公開 | Round 5/6 で portfolio Section 1-10 + technical-deep-dive vol 1 + X thread 草稿完備 |

### §1.2 W0 内のキーミルストン（既経過）

| MS | 日付 | 内容 | 状態 |
|---|---|---|---|
| W0-Week1 開始 | 2026-05-02 | Phase 0 完了 + Phase 1 Go 決裁（DEC-019-007） | **完了** |
| W0-Week1 中盤 | 2026-05-04 | Round 1〜8 連続並列発注完遂 | **完了** |
| **W0-Week1 終盤** | **2026-05-04 深夜（本書起案中）** | **Round 9-10 集中スプリント発注 + Phase 1 W3/W4 想定スコープ追加前倒し可否評価** | **進行中** |
| 5/8 検収会議 | 2026-05-08 18:00-18:45 JST | 議決 21（+1 議決-26 = 22）件採決 | 未実施 |
| W0-Week2 着手 | 2026-05-09 | 5 必須施策 + drill 1/2 + ToS 統合 | 未着手 |
| W0 完了 | 2026-05-18 | W1 着手 Go 確認 | 未着手 |

---

## §2 Round 5-8 prefetch 実績の網羅マップ（W1/W2/W3/W4 内タスク完遂状況）

### §2.1 Round 5 (5/4 深夜前段、commit `9bc1629`、3 部署 / 1,719 行)

| 完遂タスク | 元 W | LoC | tests |
|---|---|---|---|
| `verify-zero-side-effect.sh` (DEC-019-007 自動検証) | W4 (CB-D-W4-02) | 173 | mock + 実 monorepo 二段検証 |
| `wrapper.ts` factory pattern + `SubprocessSpawnContract` | W1 (G-01) | +55 | wrapper-contract.test.ts 8 cases |
| `workflow-yaml.test.ts` (DEC-019-053 永続検証) | W0-Week1 | +106 | 6 cases |
| Research NG-3 案 B baseline | W2 (CB-O-W2-01) | 308 行報告 | — |
| Marketing portfolio Section 1-3 + X thread | W4 公開準備 | 738 行 | — |

### §2.2 Round 6 (5/4 深夜中段、commit `93f3ba2`、3 部署 / 4,538 行)

| 完遂タスク | 元 W | LoC | tests |
|---|---|---|---|
| G-01 spawn 副作用ゼロ 3 軸 | W1 (CB-D-W1-08) | wrapper.ts +93 | spawn-isolation.test.ts 10 cases |
| G-04 cost watchdog 三段階 | W1 (CB-D-W1-02) | cost-tracker.ts +62 / usage-monitor.ts +135 | watchdog.test.ts 13 cases |
| G-05 kill-switch SIGTERM/SIGKILL | W1 (CB-D-W1-04 拡張) | kill-switch.ts +93 | kill-chain.test.ts 5 cases |
| G-06 circuit breaker forceOpen | W1 (CB-D-W1-05 拡張) | circuit-breaker.ts +17 | kill-chain.test.ts 同 5 cases |
| G-08 preflight CI fail-fast | W1 (CB-D-W1-06) | preflight-env.ts +40+59 / openclaw-monitor.yml +24 | preflight-ci.test.ts 8+7 cases |
| Research 5/30 NG-3 議決準備 | W2 (CB-O-W2-01) | 388 行 | — |
| Marketing portfolio Section 4-10 + technical-deep-dive vol 1 | W4 公開準備 | 1,084 行 | — |

### §2.3 Round 7 (5/4 深夜終盤、commit `f1548cd`、4 部署 / 6,500+ 行)

| 完遂タスク | 元 W | LoC | tests |
|---|---|---|---|
| G-09 HITL gate enforcer | W2 (CB-D-W2-04) | 338+ 行 | 6 tests |
| G-10 audit log retention SHA-256 hash chain | W2 (CB-D-W2-04 拡張) | 含 | 6 tests |
| G-02 spawn timeout SIGTERM→grace→SIGKILL→CB.forceOpen | W2 (CB-D-W2-01) | 含 | 4 tests |
| G-03' process tree kill cross-platform | W2 (CB-D-W2-02 拡張) | 含 | 3 tests |
| G-07 BAN drill harness 3 シナリオ | W2 (CB-S-W0-04 ベース) | 含 | 3 tests |
| Marketing technical-deep-dive vol 2-6 | W4 公開準備 | 1,710 行 | — |
| Marketing portfolio metrics substitution plan | W4 公開準備 | 295 行 | — |
| PM cross-ref final v8 + Phase 1 plan v3 + secretary 5-8 v9 + minutes-template v4 | W0-Week1 | 1,730+ 行 | — |
| Review mandatory-controls-50 + risk-register v3-2 + ban-drill-3 v2 + mock-claude SOP final + 5-8 q-and-a | W0-Week1 | 2,461 行 | — |

### §2.4 Round 8 (5/4 深夜終盤後段、commit `de25d87`、4 部署 / 4,035 行)

| 完遂タスク | 元 W | LoC | tests |
|---|---|---|---|
| Dev hitl-kickoff-gate.ts + index.ts | W3 (CB-D-W3-03 ベース) | 338+ | 8 tests |
| Dev dashboard README + migration | W3 (DEC-019-033 ④透明性 Dashboard) | 396 行 | — |
| PM phase2-plan-v1 + go-nogo-template | W4 (CB-PM-W4-02) | 996 行 | — |
| Research phase2-genre-expansion baseline | Phase 2 W1 | 468 行 | — |
| Marketing portfolio-staging-spec + webops-handoff-package | W4 公開準備 | 1,051 行 | — |

### §2.5 Round 5-8 累積 prefetch 比率

| Phase 1 期 | 元タスク数 | Round 5-8 で前倒し完遂 | prefetch 比率 |
|---|---|---|---|
| W1 (5 日 / 10 タスク) | 10 | 5 (G-01/04/05/06/08) | **50%** |
| W2 (5 日 / 13 タスク) | 13 | 5 (G-02/03'/07/09/10) | **38%** |
| W3 (5 日 / 10 タスク) | 10 | 2 (HITL gate enforcer + dashboard MVP) | 20% |
| W4 (5 日 / 8 タスク) | 8 | 2 (verify-zero-side-effect.sh + Phase 2 設計骨子 v1) | 25% |
| **計 (Phase 1 全 41 タスク中)** | **41** | **14** | **34%** |

→ Phase 1 W1/W2 は半分前後を前倒し完遂、W3/W4 は 20-25%、Phase 1 全体平均 **34%**。

---

## §3 Round 9-10 で吸収予定のスコープ（W3/W4 想定スコープを W0-Week1 内追加吸収）

### §3.1 Round 9-10 で吸収する W2/W3/W4 タスク

| Round | タスク | 元 W | 元タスク ID | 想定 LoC |
|---|---|---|---|---|
| Round 9 Dev-A1 | 既存 skill 非対話化 (8 ロール) | W2 | CB-D-W2-08 | 800-1,200 |
| Round 9 Dev-A2 | 構造化 JSON IF + end-to-end mock-claw run | W3 | CB-D-W3-03 | 600-1,000 |
| Round 9 Review-B | dry-run mode + 副作用ゼロ証明 | W4 | CB-D-W4-01 + CB-D-W4-02 | 400-600 + report 300+ |
| Round 9 Dev-A2 内 (派生) | needs_scout 最小実装 (mock 化) | W3 | CB-D-W3-01 ベース | 200-400 |
| Round 9 Dev-A2 内 (派生) | tos_monitor hooks 最小実装 | W2 | CB-D-W2-06 | 200-400 |
| Round 10 R10-1 | 既存 skill 非対話化 + JSON IF + dry-run 三位一体検証 | W2 + W3 + W4 統合 | 統合 | (検証のみ、追加 LoC 少) |
| Round 10 R10-2 | mock-claw end-to-end SLA 化検証 | W3 + W4 統合 | 統合 | 検証 + benchmark 整備 200+ |
| Round 10 R10-3 | Phase 2 narrative + 5/22 朝公開シナリオ整合 | Phase 2 W5 公開準備 | — | 1,800-2,300 |

### §3.2 Round 9-10 完遂時の Phase 1 prefetch 想定

| Phase 1 期 | Round 5-8 prefetch | Round 9-10 追加 prefetch | **計 prefetch 比率** |
|---|---|---|---|
| W1 | 50% | +0% (既前倒し完遂) | **50%** |
| W2 | 38% | +30-40% (skill 非対話化 + tos_monitor) | **70-80%** |
| W3 | 20% | +30-40% (JSON IF + needs_scout 最小) | **50-60%** |
| W4 | 25% | +25% (dry-run mode 検証) | **50%** |
| **計** | **34%** | **+15-20%** | **50-55%** |

→ Round 9-10 完遂で Phase 1 全体 prefetch 比率 **50-55%** = 残作業 45-50% を Phase 1 W1-W4 で実装。

### §3.3 Phase 1 W3/W4 残作業（Round 9-10 後）

| 期 | 残タスク | 期間 |
|---|---|---|
| W2 残 | tos_monitor 本実装 + Slack alert + Anthropic 警告メール監視 + P-E フォールバック手順 + DEC-019-008 NG-3 再確認 | 5/26-5/30（5 日 → 2-3 日へ圧縮可能） |
| W3 残 | needs_scout 本実装 (HN/PH/GitHub Trending API) + 評価関数 v0 + 公開可能アプリ allowlist + Review skill 自動判定 + ベンチマーク spec | 6/2-6/6（5 日 → 3 日へ圧縮可能） |
| W4 残 | ベンチマーク 10 連続実行 + KPI 計測 + Phase 2 設計骨子 + Phase 1 完了レポート | 6/9-6/13（5 日 → 3-4 日へ圧縮可能） |

---

## §4 W1 着手 5/19 → 5/7 前倒し可否評価（5 軸）

### §4.1 5 軸定義

| 軸 | 内容 | 評価方法 |
|---|---|---|
| **軸-1** | Owner 残動作 0 件継続 | Round 9-10 期間中の Owner 物理拘束 |
| **軸-2** | BAN drill #1 完了 | drill #1 (5/13 期限) の前倒し可否 |
| **軸-3** | 必須コントロール 50 完遂率 | mandatory-controls-50 (Review final v3) の達成度 |
| **軸-4** | mock 70% 検収 | mock-claude 70% 化 acceptance criteria (5/22 検収) の前倒し可否 |
| **軸-5** | Sumi/Asagi backup | CB-D-W0-05 (5/15 期限) の前倒し可否 |

### §4.2 軸-1: Owner 残動作 0 件継続

- Round 9-10 期間中: Owner 残動作 = 0 件継続維持可能（読了 + 即決のみ、計 23 分 / 2 日間 = sprint plan §5 参照）
- W1 着手 5/7 時点: Owner Spend Cap 設定 (Anthropic Hard $50 / OpenAI Hard $20) は 5/18 期限 → 5/7 着手前に Owner 即決必要 = **新規残動作 1 件発生**
- **評価**: 5/7 着手は Owner Spend Cap 設定が 5/7 までに完了しないと不可。Owner 即決 1 件 (5 分 + 5 分) を 5/6 夜までに完遂する必要 = **可（条件付き）**

### §4.3 軸-2: BAN drill #1 完了

- BAN drill #1 期限: 5/13 (CB-S-W0-04 1 回目)
- BAN drill harness は Round 7 で前倒し実装完遂済 (3 シナリオ + 3 tests)
- 実 drill 実施は Owner 同席必要 + 実 BAN リスク評価 5 分 + 復旧時間測時 = **5/7 前倒し不可**（Owner 同席 + drill 実施時間で最低 1 日分は 5/9-5/13 の中で確保必要）
- **評価**: 5/7 着手前に drill #1 完了は **不可**。

### §4.4 軸-3: 必須コントロール 50 完遂率

- Round 7 で `review-mandatory-controls-50-final.md` 起案完遂済
- Phase 1 着手前クリア要件: 50 中 23 (W0 までに) → Round 5-8 で約 30-32 件達成済想定
- W1 着手 5/19 時点での想定達成率: 50 中 35-38 件（70-76%）
- W1 着手 5/7 時点での達成率: 50 中 30-33 件（60-66%） = **DEC-019-007「Phase 1 着手前 21/23 クリア」基準は 5/7 でも達成可能**
- **評価**: 5/7 着手は **可（必須コントロール 50 中 30-33 件 = 21/23 クリア基準 OK）**

### §4.5 軸-4: mock 70% 検収

- mock-claude 70% 化 acceptance criteria: 5/22 検収予定 (議決-23 採択前提)
- mock 70% 化実装: 5/22 期限 (CB-D-W2-08 = W2 残務、Round 9-10 で skill 非対話化のみ前倒し)
- 5/7 着手時点で mock 70% 化未達 → Phase 1 W1 ハードガード検証は実 API で実施せざるを得ない = API 消費 +$5-10/月 上振れリスク
- **評価**: 5/7 着手は mock 70% 化未達のままで **可だが、API 消費 +$5-10/月 リスクあり** = DEC-019-050 cap $30/月 内に収まる想定だが余裕薄

### §4.6 軸-5: Sumi/Asagi backup

- CB-D-W0-05: Sumi (PRJ-012) / Asagi (PRJ-018) 作業データ完全バックアップ、5/15 期限
- 既存 git push + Anthropic セッション履歴 export = 4h 工数
- Round 9-10 で前倒し可能（Round 9 内で Dev 1 名が 4h 確保可能）
- **評価**: 5/7 着手は Sumi/Asagi backup を Round 9-10 内 (5/5-5/6) に前倒し完遂可能 = **可**

### §4.7 軸-1〜5 総合評価

| 軸 | 5/7 着手可否 | 条件 |
|---|---|---|
| 軸-1 | 可 | Owner Spend Cap 設定 5/6 夜まで完了 |
| 軸-2 | **不可** | BAN drill #1 = 5/9-5/13 内実施必要 |
| 軸-3 | 可 | 必須コントロール 50 中 30-33 件達成済 |
| 軸-4 | 可 (リスクあり) | mock 70% 未達で API 消費 +$5-10/月 |
| 軸-5 | 可 | Round 9-10 内前倒し可能 |

→ **5/7 着手は軸-2 (BAN drill #1) で不可**。軸-2 を満たすには 5/13 以降の着手が必要 = **W1 着手 5/19 → 5/13 への 6 日前倒しが現実上限**。

### §4.8 W1 着手 5/13 への前倒し可否

- 5/13 着手時点: BAN drill #1 = 5/13 完了直後 + 必須コントロール 50 = 35-38 件達成 + Sumi/Asagi backup 完遂 + Owner Spend Cap 設定完了 = **5 軸全 PASS**
- **5/13 着手は可、5/19 → 5/13 への 6 日前倒しが Round 9-10 完遂時の現実推奨タイミング**

---

## §5 公開 6/27 → 5/22 前倒し可否評価

### §5.1 Marketing 準備期間 35 → 16 日 圧縮の影響

(参考: deliverable 1 §9.3)

| 区分 | 6/27 朝公開 (現行) | 5/22 朝公開 (前倒し) |
|---|---|---|
| 草稿完備 → 公開 | 5/4 → 6/27 = 54 日 | 5/4 → 5/22 = 18 日 |
| Phase 1 完了 → 公開 | 6/20 → 6/27 = 7 日 | 5/19 → 5/22 = 3 日（W1 着手 5/13 前倒し時の Phase 1 完了 5/19 想定）|
| 段階 1-3 期間 | 6/22-26 (5 日) | 5/19-21 (3 日) |

### §5.2 portfolio metric substitution の影響

- portfolio metrics substitution plan (Round 7 Marketing) = 27 placeholder 差替 SOP、295 行
- 5/22 朝公開時点で「Phase 1 完了直後 = ベンチマーク 10 連続実行データ未確定」 → metric 27 個中 15-20 個は placeholder のまま公開 or「Phase 2 で更新」表記
- **影響**: portfolio narrative の信頼性低下リスク中程度

### §5.3 段階公開フロー圧縮の影響

| 段階 | 6/27 朝公開 | 5/22 朝公開 | 圧縮影響 |
|---|---|---|---|
| 段階 1 (実装) | 6/22 (1 日) | 5/19 (1 日) | 影響なし |
| 段階 2 (Review) | 6/23-25 (3 日) | 5/20 (1 日) | **2 日圧縮** = Review 部門完遂困難 |
| 段階 3 (Owner 最終承認) | 6/26 (1 日) | 5/21 (1 日) | 影響なし |
| 公開 | 6/27 朝 09:00 | 5/22 朝 09:00 | — |

→ 段階 2 (Review) の 3 日 → 1 日への圧縮が公開品質維持の最大ボトルネック。

### §5.4 KPI 計測期間短縮の影響

- 6/27 朝公開: 公開後 KPI 計測 30 日 (6/27-7/27) で Phase 2 Go/NoGo 決裁材料化
- 5/22 朝公開: 公開後 KPI 計測 35 日 (5/22-6/26) → むしろ +5 日延長で Phase 2 着手 6/24 直前まで KPI 計測完遂
- **影響**: KPI 計測期間は 5/22 朝公開の方が +5 日延長されて好影響

### §5.5 公開 6/27 → 5/22 前倒し可否総合評価

| 軸 | 5/22 朝公開可否 | 評価 |
|---|---|---|
| Phase 1 完了タイミング | 5/19 (W1 着手 5/13 + 14 日想定) | 可（Round 9-10 完遂前提）|
| Marketing 準備期間 16 日 | Round 5-8 で草稿 1,084 行 + Round 9-10 で +1,800-2,300 行追加可能 | 可 |
| portfolio metrics 信頼性 | placeholder 15-20 個残存 | **品質低下リスク** |
| 段階 2 Review 期間 1 日 | 既存 review-mandatory-controls + risk-register v3-2 等で 5 reports 既存 → review 工数圧縮可能 | 可（条件付き） |
| KPI 計測期間 | +5 日延長で好影響 | 可 |

→ **5/22 朝公開は条件付き可、ただし portfolio metrics 信頼性 + 段階 2 Review 期間 1 日 が品質低下リスク**。確度: **35-45%** (sprint plan §9.5 案 A')。

---

## §6 中間案: 公開 6/27 維持 + 内部運用着手 5/7 + Marketing 6/22-27 段階フロー維持 のハイブリッド可否

### §6.1 ハイブリッド案の構造

| 区分 | 内容 |
|---|---|
| W1 着手 (内部運用着手) | 5/13 (5/19 → 5/13 へ 6 日前倒し、§4.8 推奨) |
| Phase 1 完了 | 5/27 (W1-W4 5 日 × 4 = 20 日 + 残務 7 日 = W2/W3/W4 圧縮効果反映で 14 日) → 5/19 + 14 日 = 5/27 想定 |
| Phase 1 sign-off | 6/3 (5/27 + 7 日バッファ) → ~~6/20~~ から **17 日前倒し** |
| Marketing 準備 (DEC-019-052 通り) | 6/22-26 段階 1-3 維持 |
| 公開 | 6/27 朝 09:00 JST 維持 |
| KPI 計測期間 | 6/3 → 6/27 = 24 日 (Phase 1 sign-off 後の品質安定期間 + Marketing 公開準備期間 = 余裕創出) |

### §6.2 ハイブリッド案メリット

| メリット | 内容 |
|---|---|
| Phase 1 sign-off 17 日前倒し | 6/3 sign-off で Phase 2 着手 6/24 → 6/10-17 へ 7-14 日前倒し可能 |
| Marketing 6/27 朝公開維持 | DEC-019-052 通りで信頼性維持 |
| portfolio metrics 信頼性確保 | Phase 1 sign-off 6/3 + ベンチマーク完遂 5/27 で 27 placeholder 差替 100% 化可能 |
| KPI 計測期間 24 日 | 公開前 KPI 計測完備で公開後の信頼性向上 |
| Phase 2 着手前倒し | 6/10-17 着手で Phase 2 sign-off 7/15 想定 → 7/25 → 7/15-18 へ 7-10 日前倒し |

### §6.3 ハイブリッド案デメリット

| デメリット | 内容 |
|---|---|
| W1 着手 5/13 前倒しの組織コスト | Round 9-10 集中スプリント 2 日間 + W0 後半圧縮の組織負荷 |
| BAN drill #1 = 5/13 同日着手 | drill #1 結果で W1 着手判断 = リスクあり、drill 失敗時 W1 着手延期 |
| Marketing 草稿差替工数 | Phase 1 sign-off 6/3 → 公開 6/27 の 24 日間で portfolio metrics 差替 + technical-deep-dive 追補 必要 |

### §6.4 ハイブリッド案推奨度

**推奨度 Lv 4 (強く推奨、ただし条件付き)**: Round 9-10 完遂 + BAN drill #1 結果が drill harness 検証で十分な場合に推奨。

---

## §7 推奨 timeline 3 案 + CEO 提示用 trade-off 表

### §7.1 推奨 timeline 3 案

| 案 | W1 着手 | Phase 1 sign-off | 公開 | Phase 2 着手 |
|---|---|---|---|---|
| **案 A: 5/22 朝公開前倒し** | 5/13 | 5/19 | **5/22 朝 09:00** | 5/26 |
| **案 B: 6/27 朝公開維持 (現行)** | 5/19 | 6/20 | 6/27 朝 09:00 | 6/24 |
| **案 C: ハイブリッド (推奨)** | 5/13 | 6/3 | 6/27 朝 09:00 維持 | 6/10-17 |

### §7.2 trade-off 表（CEO 提示用、5/8 議決-26 議事用）

| 評価軸 | 案 A | 案 B | **案 C (推奨)** |
|---|---|---|---|
| 確度 | **35-45%** | **95%** | **70-80%** |
| 公開タイミング | 5/22 朝 (35 日前倒し) | 6/27 朝 (現行) | 6/27 朝 (現行維持) |
| Phase 1 完了 | 5/19 (32 日前倒し) | 6/20 | 6/3 (17 日前倒し) |
| Phase 2 着手前倒し | 29 日前倒し (5/26) | 0 日 (6/24) | 7-14 日前倒し (6/10-17) |
| portfolio metrics 信頼性 | **低** (placeholder 15-20 個) | 高 | 高 (差替 24 日確保) |
| Marketing 段階 2 Review | **1 日 (圧縮)** | 3 日 (DEC-019-052 通り) | 3 日 (DEC-019-052 通り) |
| Owner 物理拘束変動 | +5 分 (Spend Cap 5/6 即決) | 0 分 | +5 分 (Spend Cap 5/6 即決) |
| BAN drill #1 完了タイミング | 5/13 (W1 着手前) | 5/13 | 5/13 (W1 着手前) |
| API 消費リスク | +$5-10/月 (mock 70% 未達 W1 着手) | $30 cap 内 | +$3-5/月 (mock 70% 化 5/22 検収) |
| 組織負荷 | 高 (2 日 sprint + W1 急進) | 低 (現行) | 中 (2 日 sprint + 段階圧縮) |
| 推奨度 (Lv 1-5) | **Lv 2-3** | **Lv 5** | **Lv 4** |

### §7.3 推奨

- **PM 部門推奨 = 案 C (ハイブリッド)**
- 理由: ① 案 A は portfolio metrics 信頼性低下 + 段階 2 Review 圧縮で品質リスク、② 案 B は安全だが Round 9-10 集中スプリントの戦略的価値を活かせない、③ 案 C は Phase 1 sign-off 17 日前倒し + Phase 2 着手 7-14 日前倒し + Marketing 6/27 朝公開維持で品質確保 + KPI 計測期間 24 日確保

---

## §8 5/8 検収議決-26 (実運用着手 Go) の前提条件 + 否決時 fallback

### §8.1 議決-26 採択前提条件 5 軸

| 軸 | 条件 | 検証時刻 |
|---|---|---|
| 1 | Round 9-10 mock-claw end-to-end run dry execution Pass | 5/6 夜 (Round 10 R10-2 完遂時) |
| 2 | BAN drill harness による drill #1 dry execution Pass | 5/6 夜 (Round 9 G-07 検証時) |
| 3 | 必須コントロール 50 達成度 ≥ 95% | 5/8 朝 (Review 部門 final 検証) |
| 4 | API 消費 ≤$30 維持 | 5/8 朝 (cost-tracker.ts 確認) |
| 5 | Owner 残動作 0 件継続 | 5/8 朝 (Spend Cap 設定確認) |

### §8.2 採択時の DEC-019-XXX 起票

- DEC-019-056 として「Round 9-10 集中スプリント採択 + 5/22 朝公開前倒し可否評価条項 + 案 C ハイブリッド推奨採択」を 5/6 夜 Owner 即決後に起票
- 議決-26 = 5/8 当日採決のみで 5/6 夜の DEC-019-056 を acknowledge

### §8.3 否決時 fallback

| fallback 案 | 内容 |
|---|---|
| F-1 | 5/8 議決-26 見送り → 5/30 NG-3 議決とパッケージ化（W2 終了時にまとめて議決）|
| F-2 | Round 9-10 deliverable は staged のまま、Phase 1 W1-W4 で活用するが「実運用着手」自体は 5/19 維持 |
| F-3 | Phase 2 plan v1 の §0.2 「最大 1 週間前倒し 6/24 → 6/17 候補」評価のみ Round 9-10 で先行 |

### §8.4 推奨

- **議決-26 採択推奨度 = Lv 4 (強く推奨、ただし条件付き)**（PM-C deliverable 3 §1 参照）
- 否決時は F-1 (5/30 NG-3 議決とパッケージ化) を推奨

---

## §9 結論

1. **Round 5-8 で Phase 1 全 41 タスク中 14 件 (34%) prefetch 完遂**、Round 9-10 で **+15-20% 追加 prefetch** で計 50-55% 達成見込。
2. **W1 着手 5/19 → 5/7 への 12 日前倒しは BAN drill #1 (5/13) で不可**。**5/19 → 5/13 への 6 日前倒しが現実上限**。
3. **公開 6/27 → 5/22 への 35 日前倒しは確度 35-45%**（portfolio metrics 信頼性低下 + 段階 2 Review 圧縮で品質リスク）。
4. **推奨 timeline 3 案中 案 C (ハイブリッド = W1 着手 5/13 + Phase 1 sign-off 6/3 + 公開 6/27 朝維持) 推奨度 Lv 4**。
5. **議決-26 (実運用着手 Go) 採択前提条件 5 軸**: ① mock-claw dry execution Pass ② BAN drill #1 dry execution Pass ③ 必須コントロール 50 ≥ 95% ④ API 消費 ≤$30 ⑤ Owner 残動作 0 件継続。
6. **議決-26 採択時 = DEC-019-056 起票 + 案 C 採択 + Phase 1 sign-off 17 日前倒し + Phase 2 着手 7-14 日前倒し**。
7. **議決-26 否決時 = F-1 (5/30 NG-3 議決とパッケージ化) 推奨**。

---

## §10 関連決裁・参照

### §10.1 反映決裁

- DEC-019-007: Phase 1 強い条件付き Go（5 条件）
- DEC-019-033: Owner-in-the-loop 透明 AI 組織モデル
- DEC-019-050: Anthropic API spend cap $30/月
- DEC-019-051: subscription plan 主軸方針 Phase 1 正式採用
- DEC-019-052: Marketing tone B + portfolio C + 6/27 朝 09:00 JST + Channel 3
- DEC-019-053: `.env.example` 2-tier 再設計
- DEC-019-054: 5/8 検収会議 層 A+B 16 件 Owner 先行承認
- DEC-019-055: Round 8 + Plan 8-Full 採択
- **DEC-019-056（起票予定）**: Round 9-10 集中スプリント採択 + 案 C 採択 + 5/22 朝公開前倒し可否評価条項

### §10.2 参照書

- `pm-round9-10-2day-sprint-plan.md`（本日同 Round 9 起案、deliverable 1）
- `pm-phase1-plan-v3.md`（Round 7、Phase 1 計画 v3）
- `pm-cross-ref-final-v8.md`（Round 7、cross-ref final）
- `pm-phase2-plan-v1.md`（Round 8 β、Phase 2 v1 素案）
- `tasks.md`（Phase 1 W0/W1/W2/W3/W4 全 61 件）
- `risks.md`（Risk Register v3.2、21 件）
- `dev-w2-prefetch-round8-alpha.md`（Round 8 α、W2 prefetch）

### §10.3 Risk Register v3.2 整合性検証

- Round 9-10 で新規 risk 起票なし（sprint plan §11.3 参照）
- 既存 R-019-06/09/10/11/19/20/21/22 全件影響なし

### §10.4 6 部署フィードバック条件

| 部署 | 本書を踏まえた要 feedback 事項 |
|---|---|
| Dev | Round 9 Dev-A1 / Dev-A2 完遂 + Round 10 R10-1 / R10-2 完遂で「W1 着手 5/13 前倒し」可否最終判定 |
| Review | 必須コントロール 50 中 30-33 件達成度の Round 9-10 完遂時更新 + dry-run 副作用ゼロ証明 6 連続 PASS 検証 |
| Marketing | Phase 2 narrative full draft 1,800-2,300 行 + 5/22 朝公開シナリオ + 案 C 採択時の portfolio 草稿差替 |
| Research | Phase 2 着手 6/24 → 6/10-17 前倒し時のジャンル拡張準備期間圧縮 (case-by-case 評価) |
| 秘書 | 議決-26 議題 + 5/8 議事時間 35-45 → 50-60 分 + 議事録テンプレ v5 |
| CEO | DEC-019-056 起票文 5/6 夜まで + Owner 即決準備 |

### §10.5 Phase 2 plan v1 への影響評価

- Round 9-10 完遂 + 案 C 採択時: Phase 2 着手 6/24 → **6/10-17 へ 7-14 日前倒し** 確度: **40-50%**
- Phase 2 sign-off 7/25 → **7/15-18 へ 7-10 日前倒し** 確度: 同上
- Phase 2 plan v1 §0.2 「最大 1 週間前倒し 6/24 → 6/17 候補」評価が Round 9-10 完遂時に正式評価可能化

---

## §11 部署別詳細 hand-off（Round 9-10 完遂時の Phase 1 W1 着手準備）

### §11.1 Dev 部門 hand-off

| 項目 | 内容 | 期限 |
|---|---|---|
| Round 9 Dev-A1 deliverable | 既存 skill 8 ロール非対話化 + 24 unit tests | 5/5 朝 |
| Round 9 Dev-A2 deliverable | 構造化 JSON IF + end-to-end mock-claw run + 5 e2e tests | 5/5 昼 |
| Round 10 R10-1 統合検証 | 三位一体 (skill 非対話化 + JSON IF + dry-run) 統合検証 | 5/6 午後 |
| Round 10 R10-2 SLA 化検証 | wall-clock < 60min / cost < $5 / HITL 100% | 5/6 午後 |
| W1 着手 5/13 前倒し時の準備 | G-V2-11 OAuth トークン隔離 (CB-D-W1-08) のみ Round 10 で前倒し検討 | 5/6 夜 |
| W1 着手後の SP 圧縮効果 | Round 6 既前倒し 12.5d + Round 9-10 追加 3-5d = 計 15.5-17.5d | 5/19 想定 |

### §11.2 Review 部門 hand-off

| 項目 | 内容 | 期限 |
|---|---|---|
| Round 9 Review-B deliverable | dry-run 副作用ゼロ証明 6 連続 PASS + report 300+ 行 | 5/5 午後 |
| Round 10 R10-1 検証 | 三位一体統合検証の Review 部門公式 sign-off | 5/6 午後 |
| 必須コントロール 50 達成度更新 | 47-48 件 (94-96%) 達成想定の最終確認 | 5/8 朝 |
| BAN drill #1 (5/13) 実 drill 計画書 | drill harness 検証結果を反映した実 drill 計画 | 5/12 |
| 議決-26 採択前提 軸-2/3 検証 | 5/6 夜 + 5/8 朝の 2 回検証 | 5/8 朝 |

### §11.3 Marketing 部門 hand-off

| 項目 | 内容 | 期限 |
|---|---|---|
| Round 9 Marketing-D deliverable | Phase 2 narrative full draft 1,800-2,300 行 | 5/5 夕方 |
| 案 C 採択時の portfolio 草稿 | 6/3 sign-off → 公開 6/27 朝 24 日間で portfolio metrics 27 個差替 | 6/3-6/22 |
| 案 C 採択時の technical-deep-dive vol 7-9 | Phase 2 narrative を 6/3-6/22 で本実装版に差替 | 6/22 |
| 案 B 維持時の portfolio | DEC-019-052 通り (Round 5/6 草稿活用) | 6/22-26 |

### §11.4 Research 部門 hand-off

| 項目 | 内容 | 期限 |
|---|---|---|
| Phase 2 ジャンル拡張準備 | Round 8 β `research-phase2-genre-expansion-baseline.md` (468 行) を案 C 採択時の前倒しシナリオに更新 | 5/19 |
| 5/30 NG-3 議決準備 | Round 6 で完遂済 (388 行)、議決-26 と同時 採決時の影響評価 | 5/30 |
| 案 C 採択時の Phase 2 着手 6/10-17 | ジャンル拡張準備期間 5/30 → 6/10-17 = 11-18 日確保 | 5/30-6/10 |

### §11.5 PM 部門 hand-off

| 項目 | 内容 | 期限 |
|---|---|---|
| Round 9 PM-C deliverable | 本書 + sprint plan + 議題 v10 prep の 3 件 | 5/5 午後 |
| Round 10 R10-4 統合報告 | `pm-round9-10-integration-report.md` 起案 | 5/6 夜 |
| W1 着手 5/13 前倒し時の Phase 1 plan v4 起案 | Round 10 着地後に Phase 1 plan v3 → v4 改訂検討 | 5/8 議決-26 後 |
| Phase 2 plan v1 → v2 起案 | Phase 1 sign-off 6/3 想定での Phase 2 着手前倒し反映 | 6/3-10 |

### §11.6 秘書部門 hand-off

| 項目 | 内容 | 期限 |
|---|---|---|
| Round 9 Secretary-E deliverable | 5/8 配布資料 v10 + minutes-template v5 + dashboard 反映 | 5/5 夕方 |
| 5/7 EOD 配布実行 | v10 配布物 12 件 (本書含) を Owner + 全部署へ配布 | 5/7 22:00 |
| 5/8 議事録リアルタイム記録 | 議決-26 sign-off 欄 + Round 9-10 完遂報告欄を新規追加 | 5/8 18:00-19:00 |
| 議決-26 採択 / 見送り両分岐対応 | 配布資料 v10 を 2 通り版で起案 | 5/7 EOD |

### §11.7 CEO hand-off

| 項目 | 内容 | 期限 |
|---|---|---|
| Round 9 着地統合判断 | 6 部署 deliverable 6/6 完遂確認 | 5/5 夜 |
| Round 10 着地統合判断 | 4 軸 全完遂確認 | 5/6 夜 |
| DEC-019-056 起票文最終版 | 5/6 夜 Owner 即決後の起票文確定 | 5/6 21:15 JST |
| Owner 5/7 朝即決依頼 | 議決-26 = 方式 A 採用 / 見送り (F-1) のいずれか即決 | 5/7 09:00 JST |
| 5/8 議事進行 | 議決-26 = 方式 A acknowledge (1-2 分) or 議決-26 議論 (10-15 分) | 5/8 18:00 |

---

## §12 議決-26 採択時の Phase 1 sign-off 6/3 への確度試算

### §12.1 W1 着手 5/13 → Phase 1 sign-off 6/3 の組み立て

| 期 | 期間 | 想定タスク完遂 |
|---|---|---|
| W1 (5/13-5/19) | 7 日 | G-01〜G-08 検証済 + G-V2-11 OAuth 隔離実装、5 日想定 → 4-5 日完遂 |
| W2 (5/20-5/26) | 7 日 | G-02/03'/07/09/10 検証済 + tos_monitor 本実装 + 既存 skill 非対話化 検証済 | 5 日想定 → 3-4 日完遂 |
| W3 (5/27-6/2) | 7 日 | needs_scout 本実装 + 評価関数 v0 + 公開ガード G-11 + ベンチマーク準備 | 5 日想定 → 4-5 日完遂 |
| W4 (5/27-6/3 中の 5 日 + 6/3 sign-off) | 7 日 | dry-run 検証済 + ベンチマーク 10 連続 + Phase 2 設計骨子 + 完了レポート | 5 日想定 → 4-5 日完遂 |
| **計** | **22 日 (W1 5/13 開始 → sign-off 6/3)** | 4 期 全 完遂 + 7 日バッファ | — |

### §12.2 Phase 1 sign-off 6/3 確度

| 軸 | 評価 | 確度寄与 |
|---|---|---|
| Round 9-10 prefetch 50-55% | W2/W3/W4 で 1-2 日圧縮可能 | +20% |
| BAN drill #1 (5/13) 結果 | drill harness 検証で実 drill 高 PASS 確率 | +15% |
| 必須コントロール 50 達成 | 5/8 時点 47-48 件 → W1-W4 で 50 件完遂 | +15% |
| Phase 1 W1-W4 内タスク残作業 | 約 45-50% を 22 日で完遂 (1 日 2-3 タスクペース) | +20% |
| バッファ 7 日 | W1-W4 期間内に組込 | +10% |
| **計** | — | **80%** |

→ Phase 1 sign-off 6/3 確度 **80%** = 案 C 推奨度 Lv 4 の根拠。

### §12.3 Phase 1 sign-off 6/3 失敗時の fallback

| fallback 案 | sign-off タイミング | Marketing 公開 |
|---|---|---|
| F-A1 | 6/10 (7 日延期) | 6/27 朝公開維持 (準備期間 17 日) |
| F-A2 | 6/13 (10 日延期) | 6/27 朝公開維持 (準備期間 14 日) |
| F-A3 | 6/20 (DEC-019-052 通り) | 6/27 朝公開維持 (案 B 完全移行) |

→ 案 C 採択でも sign-off 6/3 失敗時は F-A1/A2/A3 で 6/27 朝公開を確保。

---

## フッタ — 改版履歴

| 版 | 日付 | 起案 | 主要変更 |
|---|---|---|---|
| v1 | 2026-05-04 深夜（Round 9 起動時） | PM 部門 | 初版（Phase 1 W0 → 運用 MVP 着地 transition plan、5 軸前倒し可否評価 + 推奨 timeline 3 案 + 議決-26 前提条件） |

**v1 確定**: 2026-05-04 深夜 / **採択予定**: 5/8 議決-26 結果次第 / **次回更新**: ① Round 10 着地後（5/6 夜）② 5/8 議決-26 結果反映後

## フッタ詳細

- 文書: `projects/PRJ-019/reports/pm-phase1-transition-plan-v1.md`
- 版: v1（2026-05-04 深夜、Round 9 PM-C 担当 deliverable 2）
- 起案: PM 部門
- 範囲: Phase 1 W0 → 運用 MVP 着地 transition + 5/22 朝公開前倒し可否評価 + 議決-26 前提条件
- 検収: CEO（Round 9 commit 時）+ Owner（5/8 議決-26 採択 / 見送り）
