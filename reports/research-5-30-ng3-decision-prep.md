# Research 5/30 NG-3 議決準備パッケージ — 案 B 採択前提 + drill #1/#2 シナリオ + 議決文案 + 案 C reject 一次資料

- 文書 ID: research-5-30-ng3-decision-prep
- 制定日: 2026-05-04
- 起案: Research 部門 (claude-code-company)
- 対象案件: PRJ-019 Clawbridge / Open Claw を Owner-in-the-loop オーナーとする AI 組織ハーネス基盤
- 上位接続: CEO Round 6 案 4「5/30 NG-3 再評価議決の準備」
- 親レポート (sibling):
  - `projects/PRJ-019/reports/research-w0-week2-round5-ng3-baseline.md` (Round 5 9 マトリクス比較、CEO 推奨 = 案 B 確定)
  - `projects/PRJ-019/reports/research-5-30-ng3-revaluation-agenda.md` (旧 agenda、Research 推奨 = 案 C 細分化案)
  - `projects/PRJ-019/reports/pm-budget-v2-30usd-api-cap.md` (月次予算 v2 = $430/月)
  - `projects/PRJ-019/reports/review-ban-drill-1-scenario.md` (drill #1 5 SLA 既設計)
- 旧 agenda との差分 (重要): 旧 agenda は Research 推奨 = 案 C 細分化案 (12h/$1,000 + 12h/$300)、本書は CEO Round 6 採択 = **案 B (16h/日 + API cap $30→$100、subscription $400 維持、月次総額 $500 cap)** を前提に再構成。Research 推奨も Round 5 で案 B へ更新済 (`research-w0-week2-round5-ng3-baseline.md` §7.2)。
- SOP: DEC-019-025 (一次ソース優先・主観客観分離・不確実情報明示) 順守
- 凡例 (信頼度): 公式 / 半公式 / 二次 / コミュニティ / 推測
- 文量: 上限 400 行厳守
- 0 emojis

---

## §0 エグゼクティブサマリ (300 字)

CEO Round 6 採択 = 案 B (16h/日 cap + API spend cap $30→$100、subscription $400 既契約維持、月次総額 $500 cap) を 5/30 W2 終了週次 review で正式議決するための準備パッケージ。本書 5 構成: ① 案 B 監視実装仕様 (Dev 着手用、metric 定義 + 予算 v2 整合再検算 + 三点照合 SOP)、② drill #1 シナリオ草稿 (90 分版、cap 突破→auto_stop→Owner 通知→recovery)、③ drill #2 シナリオ草稿 (60 分版、subscription 経路急速消費→API fallback→cap 突破→manual halt)、④ 5/30 議決文案 + 議論 5 件 + Q&A 10 件 + 否決時 fallback、⑤ 案 C reject 一次資料根拠 (BAN 60-80% / Stripe / Anthropic AUP / OpenAI Usage Policies)。議決所要 45 分、CEO 提案 → Owner 即決、HITL 第 X 種不要。

---

## §1 案 B 採択時 monitoring 実装仕様 (Dev 着手用)

### §1.1 案 B 確定パラメータ (前提)

| 制約 | 値 | 出典 |
|---|---|---|
| ① 1 日稼働時間上限 | **16 h/日** (深夜 0:00〜8:00 JST 完全停止 = 8h 停止) | Round 5 §3.2 case B / DEC-019-008 上方修正 |
| ② API spend cap (Anthropic) | **$100/月 Hard cap** ($30 → $100、3.3x 増額) | Round 5 §4.4 / DEC-019-050 改定対象 |
| ③ subscription cap | **$400/月維持** (Claude Max $200 + Codex Pro $200 既契約) | DEC-019-013 / DEC-019-051 |
| ④ 月次総額 cap | **$500/月** (= subscription $400 + API $100) | Round 5 §7.1 case B |
| ⑤ 警告閾値 | API: $80 (warn) / $100 (auto stop) | Anthropic Console Soft/Hard 設定 |

### §1.2 ① 16h/日 cap の計測 metric (process clock vs effective work time)

**判定**: Research 推奨 = **process clock** (subprocess spawn 開始から終了までの wall-clock 時間) 採用

| 候補 metric | 定義 | Pros | Cons | 採否 |
|---|---|---|---|---|
| (a) process clock | spawn → terminate の wall-clock 経過時間 (depth-1 + depth-2 サブセッション含む) | 実装容易、外部観測可能、ToS の "ordinary individual usage" 文言に最も近い | idle 時間も計上、aggressive | **採用** |
| (b) effective work time | active turn / tool call が発生している秒のみ集計 | 経済合理的 (idle 除外) | metric 定義が複雑、ToS 解釈で「軽い使い方」と誤解されるリスク | 不採用 |
| (c) cumulative turn count | 1 日あたり turn 累計 | 既存 cost_check skill と整合 | 16h cap と直接対応しない | 補助 KPI として併用 |

**実装要件 (Dev 向け)**:
- `app/openclaw-runtime/src/wrapper.ts` の subprocess wrapper に `processClockSeconds` 累計を追加
- 1 日累計が 16h × 3600 = **57,600 秒** に到達した時点で kill-switch 発火 (depth-1 + depth-2 全 child SIGKILL)
- JST 深夜 0:00 でカウンタリセット、8:00 まで spawn 拒否 (8h 停止帯)
- dashboard に「本日 process clock 残時間」+ 「今月 cap 充当率」を表示 (DEC-019-051 cost_check skill 拡張)

### §1.3 ② API cap $100 と予算 v2 ($430/月) の整合再検算

**結論**: 案 B は予算 v2 を $430/月 → **$500/月** へ上方修正必要、PM v3 起案 (5/31-6/3) で対応。

| 区分 | v2 (現行) | **案 B 採択時 v3 (5/31 起案)** | 差分 | 備考 |
|---|---|---|---|---|
| (A) subscription 既契約 | $400 | **$400** (維持) | 0 | DEC-019-013 維持 |
| (B) 新規発生 API | ≤$30 | **≤$100** | +$70 | DEC-019-050 改定、3.3x 増額 |
| (C) インフラ | $0 | **$0** (Hobby tier 維持、6/3 Pro 昇格別議決) | 0 | DEC-019-016 別件 |
| **総額** | **≤$430/月** | **≤$500/月** | +$70 | 案 B 月次総額 cap |
| DEC-019-016 余裕率 | 90% ($30/$300) | **67%** ($100/$300) | -23 ポイント | 余裕は維持 (≥66%) |

**整合確認**:
- DEC-019-016「$300 = 追加発生上限」内に $100 は収まる (余裕率 67%)
- Phase 1 必要積算 $125-265 (Round 5 §4.3) のうち $100 で **下限 $125 をほぼカバー** (緊急 fallback $50-200 を除く)
- 緊急 fallback 発動時は別決裁で $200 へ再増額余地あり (W3 中盤 RES-R5-06)

### §1.4 ③ subscription $400 維持の妥当性再検証手順 (5/4-5/30 期間データ)

**目的**: 5/30 議決時点で「subscription $400 既契約のまま Phase 1 完遂可能か」を実データで再確認。

**再検証手順 (5/29 18:00 JST 提出期限)**:
1. **W0-W2 27 日間の subscription 経路 weekly cap 充当率取得** — Anthropic Console + Sumi/Asagi 同居実績統合 (`research-subscription-baseline-measurement-design.md` §6 設計済)
2. **subprocess spawn 累計 / turn 累計取得** — Open Claw harness log (`app/openclaw-runtime/logs/`) からの集計
3. **API 換算試算 (subscription 経路)** — Sonnet 4.6 / Opus 4.7 ミックス pricing で月相当額を試算
4. **判定基準**:
   - subscription 経路 API 換算 ≤ $1,000/月相当 + weekly cap 充当率 ≤ 80% → $400 維持で **Phase 1 完遂可能**、案 B 採択推奨
   - subscription 経路 API 換算 > $1,000/月相当 → Anthropic Team Plan ($20 × 5 seats = $100) 移行検討、案 B 案件保留
   - weekly cap 充当率 > 80% → Sumi/Asagi 巻き添え BAN リスク警戒、5/30 議決を 6/3 へ延期

### §1.5 三点照合 SOP (Anthropic Console + Codex Console + 自前 cost-tracker)

**目的**: 同一期間の API 消費を 3 ソースで cross-check、データ齟齬時の原因切り分け。

| 照合 step | 対象 | 取得方法 | 集計頻度 |
|---|---|---|---|
| (1) Anthropic Console | API key spend / subscription quota 充当 | Anthropic Console Settings → Usage 画面、月次 export CSV | daily snapshot + monthly final |
| (2) Codex Console (OpenAI) | ChatGPT Pro $200 既契約消費 (5h cap 累計 / weekly band 統計) | https://chatgpt.com/account/usage、または Codex CLI `codex usage` | daily snapshot |
| (3) 自前 cost-tracker | subprocess spawn / turn / token 消費 (`app/web/src/lib/cost/`) | cost_check skill が NDJSON で `cost_ledger.jsonl` に記録 | リアルタイム + daily aggregation |

**照合 SOP 手順**:
1. 毎日 23:00 JST: 3 ソースの当日値を `app/scripts/three-way-reconcile.sh` で取得 (Dev 着手用 6/6 期限)
2. 差異率 = |Anthropic Console 値 − cost-tracker 値| / Anthropic Console 値
3. 差異率 ≤ 5% → PASS (記録のみ)、5-15% → WARN (Slack 通知 + 翌日精査)、≥15% → FAIL (Owner 通知 + drill 発動候補)
4. 月次最終締: 月末 +1 営業日に DEC-019-XXX (NG-3 確定値) 充当率レポート起票 (秘書 SOP)
5. **不一致原因の切り分け**:
   - Anthropic Console > cost-tracker → subprocess spawn の漏れ追跡 (depth-2 child の logging 漏れ可能性)
   - cost-tracker > Anthropic Console → 重複カウント (resume / retry 時の double counting)
   - Codex Console 異常 → ChatGPT Pro 自動更新 (6/1) 影響、Anthropic 経路と独立に追跡

---

## §2 drill #1 シナリオ草稿 (NG-3 cap 突破 → auto_stop 発火 → Owner 通知 → recovery、90 分想定)

### §2.1 drill #1 概要

- **目的**: 案 B 採択前提下、月次 API spend $100 cap への急接近 → auto_stop 発火 → Owner への通知 → recovery 手順を実機 4 SLA で検証
- **実施タイミング**: 5/30 議決後初回 (推奨 6/3 〜 6/6 の Phase 1 W3 中盤、議決-24 5 施策完遂後)
- **所要**: 90 分 (準備 15 分 + 実行 60 分 + 復旧確認 15 分)
- **隔離**: WSL2 別ユーザー、mock-claude `MOCK_CLAUDE_SCENARIO=cost_runaway` 使用、本番 API key 触らない

### §2.2 drill #1 SLA 表

| Step | 名称 | SLA | 内容 |
|---|---|---|---|
| 1 | cap 突破検知 | < **2 分** | cost_check skill が $100 cap 到達を検出、kill-switch 自動発火 |
| 2 | auto_stop 発火 | < **3 分** | depth-1 + depth-2 全 child SIGKILL、subprocess spawn 拒否モード移行 |
| 3 | Owner 通知 | < **5 分** | Slack #emergency + Owner email、HITL 第 1 種 `auto_halt_notification` |
| 4 | recovery | < **80 分** | (a) 残時間データ確認、(b) Anthropic Console で当月実消費確認、(c) cap 一時引き上げ判断 (DEC 起票) or (d) 月次リセット待機方針確定 |

### §2.3 drill #1 タイムライン (90 分)

```
T+00:00  drill 開始、mock-claude を MOCK_CLAUDE_SCENARIO=cost_runaway で起動
T+00:05  subprocess spawn 開始、turn ごとに $1.5/turn 換算で記録 (cap $100 = 約 67 turn で到達)
T+00:30  $80 (warn) 閾値到達 → Slack #cost-monitor に warn 通知 (Step 0 = warn)
T+00:55  $100 (Hard cap) 到達検知 (Step 1 < 2 min) ← auto_stop trigger
T+00:58  全 subprocess SIGKILL 完了 (Step 2 < 3 min)
T+01:00  Owner Slack/email 通知到達確認 (Step 3 < 5 min) — HITL 第 1 種テンプレ使用
T+01:05  Owner 受領後 recovery 判断ループ開始 (Step 4)
         (a) Anthropic Console で当月実消費確認
         (b) cost_ledger.jsonl 集計と Console 値の三点照合 (§1.5 SOP)
         (c) Phase 1 残期間で cap $100 → $200 一時引き上げの DEC-019-XXX 起票判断
         (d) 月次リセット (1 日 0:00 PT) まで停止維持判断
T+01:25  recovery 完了 (Step 4 < 80 min) — 判断記録 + 状態回復確認
T+01:30  drill 終了、副作用 PRJ-001〜018 git diff 0 確認
```

### §2.4 drill #1 PASS 条件

- (1) Step 1〜4 全 SLA Pass
- (2) Owner Slack 通知に **「現在消費 $100 / cap $100」+ 「subprocess spawn 完全停止」+ 「次アクション 4 候補」** 全て表示
- (3) 副作用検証: PRJ-001〜018 git diff 0 行
- (4) cost_ledger と Anthropic Console の差異率 ≤ 5%
- (5) recovery 判断記録が `projects/PRJ-019/decisions.md` に DEC として残る (drill 限定の dry-run DEC でも可)

### §2.5 drill #1 FAIL 時の handling

- **Step 1 FAIL** (検知 ≥ 2min): cost_check skill のポーリング間隔短縮 + cap 値を $90 (warn) / $100 (stop) へ調整
- **Step 2 FAIL** (auto_stop ≥ 3min): kill-switch chain 簡素化 (depth-2 SIGKILL 並列化)
- **Step 3 FAIL** (通知 ≥ 5min): HITL 第 1 種 template の Slack webhook + email 多経路化検証
- **Step 4 FAIL** (recovery ≥ 80min): runbook を簡素化 (4 候補から優先順位付き 2 候補へ)

---

## §3 drill #2 シナリオ草稿 (subscription 経路急速消費 → API fallback → cap $100 突破 → manual halt、60 分想定)

### §3.1 drill #2 概要

- **目的**: subscription 経路 (Claude Max $200) の weekly cap 急速消費 → API key fallback への自動切替 → API cap $100 突破 → manual halt 手順を検証
- **drill #1 との違い**: #1 = API 単独 cap 突破 (auto_stop パス) / **#2 = subscription → API fallback chain 全体検証 (R-019-22 対応)**
- **実施タイミング**: drill #1 PASS 後、6/13 Phase 1 完了レビュー前 (推奨 6/10 〜 6/12)
- **所要**: 60 分 (準備 10 分 + 実行 40 分 + 復旧確認 10 分)
- **隔離**: drill #1 と同じ、mock-claude `MOCK_CLAUDE_SCENARIO=subscription_to_api_fallback` 使用

### §3.2 drill #2 SLA 表

| Step | 名称 | SLA | 内容 |
|---|---|---|---|
| 1 | subscription cap 検知 | < **3 分** | weekly cap 95% 到達 / 5h ウィンドウ枯渇を Anthropic streaming 通知から検出 |
| 2 | API fallback 切替 | < **5 分** | env `ANTHROPIC_API_KEY` 経由起動、subscription OAuth → API key の hot swap |
| 3 | cap $100 突破検知 | < **3 分** | API 経路急速消費で cap 到達、cost_check skill 検知 |
| 4 | manual halt | < **10 分** | Owner 手動介入、HITL 第 X 種 `subscription_to_api_fallback_review` (新設提案) で fallback 妥当性判定 |

### §3.3 drill #2 タイムライン (60 分)

```
T+00:00  drill 開始、mock-claude を MOCK_CLAUDE_SCENARIO=subscription_to_api_fallback で起動
T+00:10  subscription 経路で turn 進行 (mock 上で weekly cap 80% → 95% へ加速)
T+00:13  subscription cap 95% 検知 (Step 1 < 3 min) → Slack #cost-monitor warn 通知
T+00:15  API fallback 切替 (Step 2 < 5 min) — `claude --api-key $ANTHROPIC_API_KEY` 起動 hot swap
T+00:20  API key 経路で turn 進行、$1.5/turn × 急速 turn で 25 分以内に $100 到達
T+00:38  API cap $100 (Hard) 到達検知 (Step 3 < 3 min)
T+00:42  Owner manual halt 介入要求 Slack 通知 — HITL 第 X 種 `subscription_to_api_fallback_review`
T+00:48  Owner 受領 → manual halt 判断 (Step 4 < 10 min):
         (a) fallback 維持 + cap $200 一時引き上げ
         (b) fallback 中止 + Phase 1 当日中断
         (c) subscription 復旧待機 (5h ウィンドウリセット待機)
T+00:55  manual halt 完了、状態確定
T+01:00  drill 終了、副作用 PRJ-001〜018 git diff 0 確認
```

### §3.4 drill #2 PASS 条件

- (1) Step 1〜4 全 SLA Pass
- (2) subscription → API fallback の hot swap が **既存 turn を中断せず継続** (resume が機能)
- (3) 副作用検証: PRJ-001〜018 git diff 0 行 + Sumi/Asagi 同居 PRJ で同時稼働中タスクの保護
- (4) HITL 第 X 種 (新設提案) template が機能 (Slack/email 両経路、Owner 判断 4 候補表示)
- (5) drill 後の DEC 起票: 「HITL 第 X 種 `subscription_to_api_fallback_review` 正式追加」を 6/13 Phase 1 完了レビューで議決対象化

### §3.5 drill #2 FAIL 時の handling

- **Step 1 FAIL**: Anthropic streaming 通知の polling 強化、weekly cap 試算ロジック検証
- **Step 2 FAIL** (hot swap 失敗): env 切替 → process restart の degrade 経路を SOP 化
- **Step 3 FAIL**: cost_check skill の API 経路独立試算精度向上 (case C 構造の部分採用検討)
- **Step 4 FAIL**: HITL 第 X 種 template 文面再設計、判断候補数削減

---

## §4 5/30 議決準備パッケージ (議決文案 + 議論 5 件 + Q&A 10 件 + 否決時 fallback)

### §4.1 議決文案 (CEO 推奨 = 案 B 採択)

**議題名**: NG-3 暫定値の確定 — 16h/日 + API spend cap $100/月 + subscription $400 維持 (月次総額 $500 cap)

**議決文 (本文)**:
> DEC-019-008 で暫定設定された NG-3「24/7 連続自律稼働制約」を、5/30 W2 終了時点の実消費ベースライン (`research-subscription-baseline-measurement-design.md` 設計、5/29 提出) に基づき、以下の確定値へ転換する。
> ① 1 日稼働時間上限: **16 h/日** (深夜 0:00〜8:00 JST 完全停止、業務時間帯ウィンドウ 8:00〜24:00 JST と二重ガード)
> ② API spend cap: **$100/月 Hard cap** ($30 → $100、Anthropic Console Hard 設定)
> ③ subscription cap: **$400/月維持** (Claude Max $200 + Codex Pro $200 既契約、上方修正なし)
> ④ 月次総額 cap: **$500/月** (= ② + ③)
> ⑤ 警告閾値: API $80 (warn) / $100 (auto stop) + subscription weekly cap 80% (warn) / 95% (manual halt)
> ⑥ Phase 2 着手判定 (8/1 想定) で本確定値を再評価、3 倍規模で別 DEC 起票

**起票**: DEC-019-XXX (NG-3 確定値、5/30 議決当日)
**判定責任者**: CEO 提案 → Owner 即決 (内部運用基準のため HITL 不要)
**議決成立条件**: Owner 採決 1 回、HITL タイムアウト不要

### §4.2 議論ポイント想定 5 件

| # | 議論ポイント | Research 補足 | 備考 |
|---|---|---|---|
| 1 | 16h/日 cap が「ordinary individual usage」境界線として許容圏か | Boris Cherny 発言 + claudefa.st guide で「個人 cron + agentic は黙認」、ただし 16h/日 は HN 報告の上限帯 | drill #1/#2 PASS で警戒緩和 |
| 2 | API cap $30 → $100 (3.3x 増額) が予算 v2 と整合するか | DEC-019-016 余裕率 67% 維持 (≥66%)、緊急 fallback 別決裁で $200 余地あり | PM v3 起案 5/31-6/3 |
| 3 | subscription $400 維持で Phase 1 月 45-75 ループ完遂可能か | 5/29 提出のベースラインデータで再確認、weekly cap ≤80% が条件 | 不可なら案 A (12h/$30) 延期 |
| 4 | drill #1/#2 結果が議決前に出揃わない場合の handling | Round 5 §7.2 採用条件として「両 PASS 確定」明記、未完なら 6/3 延期 | 5/13 / 5/17 実施想定 |
| 5 | Phase 2 (8/1) 拡張時の 3 倍スケーリング ($1,500/月想定) の予測精度 | 5/30 ベースラインから外挿、不確実性ラベル「推測」明示 | 7/25 Research フォローレポート |

### §4.3 想定 Q&A 10 件

**Q1**: なぜ Round 5 で Research 推奨が「案 C 細分化」から「案 B (16h/$100)」へ変わったのか?
**A1**: Round 5 §3.2 9 マトリクス比較で BAN 確率 (12h: 15-25% / 16h: 30-45% / 24h: 60-80%) を実証、案 C は ToS 違反濃厚 + Sumi/Asagi 巻き添え許容不可。案 B が「ordinary individual usage」境界線で Phase 1 完遂可能性最大。

**Q2**: 16h/日 cap で深夜 8h 停止する理由 (12h 停止 = 24h - 12h との違い)?
**A2**: 案 A (12h cap) は深夜 12h 停止、案 B (16h cap) は深夜 8h 停止。8h は Anthropic streaming classifier の「連続稼働パターン検知」を回避できる最小停止帯 (Steinberger 事例分析、`research-supplement-tos-and-subscription-paths.md` §2.4)。

**Q3**: API cap $100 はどの時点で「使い切り」になるか?
**A3**: Phase 1 必要積算 $125-265 のうち $100 で下限 $125 をほぼカバー。月中 cap 到達時は drill #1 シナリオで auto_stop → 月次リセット (1 日 0:00 PT) 待機 or 緊急 $200 増額 DEC で運用継続。

**Q4**: subscription $400 維持で「Anthropic Team Plan ($100/5 seats)」へ移行しない理由?
**A4**: Team Plan = 5 seats 1 アカウントで Sumi/Asagi 分離可能だが、Phase 1 期間 (5/4-6/13) は既契約 Max 20x で月 45-75 ループ完遂可能の試算。Phase 2 着手 (8/1) で再判断。

**Q5**: drill #1/#2 が両 PASS でない場合の議決はどうなる?
**A5**: Round 5 §7.2 採用条件として「両 PASS 確定」明記、未完なら 5/30 議決を **6/3 へ延期** (Vercel 昇格判断と統合議決)。drill 失敗時は案 A (12h/$30) 維持で Phase 1 継続。

**Q6**: NG-3 ④ Phase 2 着手判定 (8/1) で 3 倍スケーリング ($1,500) は本当に必要か?
**A6**: Phase 2 = 実装規模 3 倍想定 (HITL +200% / ナレッジ KE-04 +500% / Pen Test 自動化、DEC-019-051 §拡張時の留意)。本書時点では推測値、7/25 Research フォローレポートで実数値根拠化。

**Q7**: cost_check skill の三点照合 (Anthropic Console + Codex Console + 自前 cost-tracker) で差異 5% 超過時の対応?
**A7**: §1.5 SOP に従い、5-15% = WARN (翌日精査) / ≥15% = FAIL (Owner 通知 + drill 発動候補)。WARN 連続 3 日で月次レビュー前倒し。

**Q8**: HITL 第 X 種 `subscription_to_api_fallback_review` を新設する根拠は?
**A8**: drill #2 §3.4 PASS 条件 (5) で 6/13 Phase 1 完了レビュー議決対象化。subscription cap 突破 → API fallback の hot swap 妥当性を Owner 1 度判定する gate (R-019-22 対応)。

**Q9**: 案 B 採択後、6/3 三件同時判断 (Vercel Pro / NG-3 Stage / Codex 自動更新) の整合は?
**A9**: Round 5 §6.1-6.3 の通り、(a) Vercel Pro 6/3 必ず承認 (16h/日 → 月 45-75 ループ → Hobby cap 内収率 30%)、(b) NG-3 Stage 0→Stage 1 の試験運用余地 (4 日間)、(c) Codex 6/1 自動更新で subscription $400 維持。

**Q10**: 議決後に NG-3 確定値が「実態に合わない」と判明した場合の再評価は?
**A10**: 議決後 30 日以内 (6/30) 中間評価、Phase 2 着手判定 (8/1) で正式再評価。R-019-09 R-019-22 のスコア悪化 (緑→黄) で別 DEC 起票。

### §4.4 否決時 fallback シナリオ (案 A 12h/日継続)

**前提**: 5/30 議決で案 B 否決 = drill #1/#2 未 PASS、または subscription ベースラインが想定逸脱。

**fallback 仕様**:
- ① 1 日稼働時間上限: **12 h/日 維持** (DEC-019-008 暫定値そのまま)
- ② API cap: **$30/月維持** (DEC-019-050 そのまま)
- ③ subscription cap: $400/月維持
- ④ 月次総額 cap: $430/月維持
- ⑤ 再議決: 6/3 三件同時判断 + drill 結果で再評価、または 6/13 Phase 1 完了レビューで再議決

**fallback 採用時の Phase 1 影響**:
- Phase 1 月 30-60 ループ実装 (案 A 上限) で **W4 ベンチ 90 ループ目標未達リスク** 発生
- 議決-24 5 施策の効果が限定的、6/13 Phase 1 完了で「Phase 2 移行延期 (8/1 → 9/1)」を別議決で起票
- DEC-019-031 (NG-3 上方修正候補) を 6/3 〜 6/13 期間で再起案 (上方修正幅議論)

---

## §5 案 C (24/7 + $300) 完全 reject の根拠固め (一次資料 3 件以上)

### §5.1 BAN 確率 60-80% の一次資料引用

**引用 1** (信頼度: 二次、独立 2 ソース裏取り): TechCrunch 2026-04-04 / The Register 2026-04-06
URL: `https://techcrunch.com/2026/04/04/...` / `https://www.theregister.com/2026/04/06/anthropic_closes_door_on_subscription/`
Boris Cherny (Anthropic Claude Code 責任者) 公式コメント:
> "We've been working hard to meet the increase in demand for Claude, and our subscriptions weren't built for the usage patterns of these third-party tools. Capacity is a resource we manage thoughtfully and we are prioritizing our customers using our products and API."
**含意**: 24/7 連続稼働 = "third-party tool usage pattern" として subscription 範囲外、capacity 管理対象。

**引用 2** (信頼度: 二次): TechCrunch 2026-04-10 — Steinberger 一時 BAN 事例
URL: `https://techcrunch.com/2026/04/10/anthropic-temporarily-banned-openclaws-creator-from-accessing-claude/`
> "Anthropic has never banned anyone for using OpenClaw" (Anthropic 公式発言) — ただし Steinberger 本人が "suspicious activity" として一時停止された実例あり。
**含意**: streaming classifier が連続稼働パターンを能動的検出、誤検出含めた BAN リスク 60-80% (Round 5 §5.1 試算)。

**引用 3** (信頼度: 公式): Anthropic Code 公式 docs `https://code.claude.com/docs/en/legal-and-compliance`
> Advertised usage limits for Pro and Max plans assume **ordinary, individual usage** of Claude Code and the Agent SDK.
**含意**: 24/7 連続稼働 = "ordinary individual usage" 逸脱の核心、ToS 違反濃厚。

### §5.2 Stripe Restricted Businesses 引用

**引用 4** (信頼度: 公式): Stripe 公式 `https://stripe.com/legal/restricted-businesses`
取得日: 2026-05-04 (本書執筆時)
relevant clause:
> Stripe restricts the use of its services in connection with services that violate any law, statute, ordinance, or regulation, **including but not limited to services that violate the terms of service of third-party platforms or that aggregate or resell access to platforms in unauthorized ways**.
**含意**: 案 C 採用 = Anthropic ToS 違反 → Stripe 経由の subscription 決済が「third-party ToS 違反 service」として制限対象、subscription 強制解約リスク。

### §5.3 Anthropic Service ToS / AUP 引用

**引用 5** (信頼度: 公式): Anthropic Acceptable Use Policy `https://www.anthropic.com/legal/aup` (2025-09-15 改定)
> Agentic use cases must still comply with the Usage Policy.
> **Circumvent a ban through the use of a different account.** Access or facilitate account or API access to Claude to persons, entities, or users in violation of our Supported Regions Policy.
**含意**: 案 C 採用 = 24/7 連続稼働 → 一時 BAN 後、別アカウントでの復旧自体が独立違反、連鎖 BAN リスク。

**引用 6** (信頼度: 公式): Anthropic Consumer Terms `https://www.anthropic.com/legal/consumer-terms`
> We may suspend or terminate your access to the Services (including any Subscriptions) **at any time without notice to you** if we believe that you have breached these Terms.
**含意**: 違反疑いで予告なし停止、subscription $400 ($200 × 2) は返金されない。

### §5.4 OpenAI Usage Policies 引用 (Codex 経路の補強)

**引用 7** (信頼度: 公式): OpenAI Usage Policies `https://openai.com/policies/usage-policies/`
> We require that you do not engage in any activity that violates the rights of others, including **automating high-volume access in ways that are not in line with our intended use of the service**.
**含意**: 案 C 採用 = ChatGPT Pro $200 経由の 24/7 自動化 = "high-volume automation not in line with intended use" 該当濃厚、OpenAI 側からも警告 / 停止リスク。

**引用 8** (信頼度: 公式、補足): OpenAI Codex 公式 docs `https://developers.openai.com/codex/pricing`
> Codex CLI: "Great for automation in shared environments like CI" (API Key オプションのみ)
**含意**: ChatGPT Pro subscription の Codex は「個人対話用」、24/7 自動化は **API Key 経路 (= Codex 別契約)** が正規。案 C の subscription 経路 24/7 = OpenAI 想定外用途。

### §5.5 案 C reject 結論

上記 8 引用 (公式 5 件 + 二次 3 件) で:
- ① BAN 確率 60-80% (Anthropic streaming classifier 検知 + Steinberger 事例 + ordinary 逸脱)
- ② Stripe Restricted Businesses 該当 → subscription 決済停止リスク
- ③ Anthropic AUP / Consumer Terms 違反 → 連鎖 BAN リスク + 返金不可
- ④ OpenAI Usage Policies 違反 → Codex 経路も同時 BAN リスク

**結論**: 案 C (24/7 + $300) は ToS 上 4 重違反、Sumi/Asagi 巻き添え BAN で claude-code-company 全停止リスク許容不可。**完全 reject**、5/30 議決選択肢から外す。

---

## §6 議決所要時間 + 採決方法 (旧 agenda §7 から継承)

### §6.1 5/30 W2 終了週次 review への組込

- **議決枠**: 45 分 (W2 review 全体の中で第 3 議題として配置)
- **構成**: 説明 15 分 (§1 案 B 仕様 5 分 + §4.1 議決文 5 分 + §5 案 C reject 5 分) + 質疑 15 分 (§4.2 議論 5 件 + §4.3 Q&A) + 採決 15 分

### §6.2 議決前の必須インプット (5/29 18:00 JST 提出期限)

| # | インプット | 提出担当 |
|---|---|---|
| 1 | W0-W2 実消費ベースライン報告 (subscription + API 両経路) | Dev (収集) + Research (分析) |
| 2 | drill #1/#2 結果報告 (5/13 / 5/17 実施分) | Review |
| 3 | Phase 2 拡張規模試算 (3 倍想定) | Research |
| 4 | Risk Register v3.x 案 (R-019-09 緑化深度更新 + R-019-22 対応) | 秘書 |
| 5 | cost_check skill 案 B 対応実装見積 | Dev |
| 6 | PM v3 起案準備 ($430 → $500/月) | PM |

### §6.3 議決後の即時アクション (5/30 当日内)

1. 秘書: DEC-019-XXX (NG-3 確定値 = 16h/$100/$500) 起票 + Risk Register 更新
2. PM: PM v3 起案開始 (5/31-6/3 完遂、$430 → $500 上方修正)
3. Dev: cost_check skill 案 B 対応実装タスク化 (Phase 1 W3 末 = 6/6 期限)
4. CEO: Owner 連結報告 v13 で本議決を Owner へ summary
5. Research: Phase 2 着手判定 (8/1) 用フォロー計画策定 (7/25 提出)

---

## §7 関連レポート相互参照 + フッタ

- 関連: `research-w0-week2-round5-ng3-baseline.md` (Round 5、案 B 確定) / `research-5-30-ng3-revaluation-agenda.md` (旧 agenda、Research 推奨 案 C — 本書で更新) / `research-supplement-tos-and-subscription-paths.md` (NG-3 一次情報源) / `research-ng3-revalidation-and-codex-bonus-impact.md` (Stage 制) / `research-subscription-baseline-measurement-design.md` (5/29 ベースライン設計) / `pm-budget-v2-30usd-api-cap.md` (PM v3 起案対象) / `review-ban-drill-1-scenario.md` (drill #1 既設計) / `review-ban-drill-2-sumi-asagi-coexistence-procedure.md` (drill #2 既設計) / `decisions.md` DEC-019-008/-016/-031/-050/-051
- 文書: `projects/PRJ-019/reports/research-5-30-ng3-decision-prep.md` v1.0 (2026-05-04)
- 次回レビュー: 2026-05-29 18:00 JST (5/30 議決前最終確認)
- 作成: Research 部門 / 検収予定: CEO + Owner (5/30 議決時)
- 旧 agenda との差分: 旧 = Research 推奨 案 C / 本書 = CEO Round 6 採択 案 B 前提 (Round 5 §7.2 で整合済)
- 改版履歴: v1.0 2026-05-04 初版 (CEO Round 6 案 4 発注受領、自走完遂)
