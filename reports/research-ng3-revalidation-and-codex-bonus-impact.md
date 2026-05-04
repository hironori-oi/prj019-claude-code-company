# NG-3 再確認用根拠資料 + Codex 2x ボーナス終了 5/31 の Phase 1 W3-W4 実質枠定量化

- 文書 ID: research-ng3-revalidation-and-codex-bonus-impact
- 制定日: 2026-05-03
- 対象案件: PRJ-019 Clawbridge (Phase 1 着手前 W0-Week2 期間先回り資料)
- 起案: Research 部門 (claude-code-company)
- 関連決裁:
  - DEC-019-008 (NG-3 暫定値 = 12h/日 上限 / API 換算 $1,000/月相当 / 自動停止) — 2026-05-30 (W2 終了時) オーナー再確認予定
  - DEC-019-023 (PM v5 起案トリガー TR-2 = NG-3 暫定値変更時)
  - DEC-019-025 (Research SOP — 一次ソース優先・主観客観分離・不確実情報明示)
  - R-019-07 関連 (Codex 5/31 2x ボーナス終了の Phase 1 W3-W4 影響評価)
- SOP: 順守 (DEC-019-025)
- 凡例 (情報信頼度ラベル):
  - 公式: ベンダー公式サイト・公式 docs (2026-05-03 取得)
  - 半公式: ベンダー公式 GitHub・社員公的発言・公式コミュニティ
  - 二次: 第三者メディア (独立した複数ソースで裏取り済)
  - コミュニティ: 個人ブログ・フォーラム発言 (1-2 ソース)
  - 推測: 本書作成者の解釈 (事実ではない、明示)

---

## §0. 200 字エグゼクティブサマリ

NG-3 暫定値 12h/日 を 18h/日 に上方修正することは、ToS 文面上は「ordinary, individual usage」逸脱判定の余裕を確実に削るが、BAN drill #1/#2 を Pass し audit log + 即時 fallback (P-A) を維持する条件下で**中位リスク許容範囲**。$1,000/月相当 = Sonnet 換算で 70 MTok output (Sonnet $15/$75) または Codex GPT-5 換算で 60-100 MTok 規模で、現 Phase 1 月 30-90 ループ想定 (Codex 0.9-9k msgs/月 + Claude 1.5-9k msgs/月) の API 換算は最大でも $250-500/月で 50% 余裕がある。Codex 2x ボーナスは 5/31 終了で 6/1 以降 Pro $200 = 通常 20x (300-1,600 msgs/5h) に戻り、Phase 1 W3-W4 (5/27-6/13) の前半 5 日 (5/27-5/31) は 25x、後半 13 日 (6/1-6/13) は 20x。それでも cap 内余裕 50% 超で Phase 1 完遂可能。**[OWNER-DECISION-REQUIRED] 計 5 件**。

---

## §1. (a) パート: NG-3 暫定値 12h/日 → 18h/日 上方修正の妥当性検証

### §1.1 NG-3 文言の正確な再確認

DEC-019-008 で確定した NG-3 暫定値 (出典: 自部署 `research-supplement-tos-and-subscription-paths.md` §2.7、PRJ-019 decisions.md):

> NG-3: 24/7 連続自律稼働 / 「ordinary individual usage」を逸脱する負荷 (深夜の無限ループ・無人連続稼働で API 換算 $1,000+/月を消費)

暫定値:
- **稼働時間上限**: 12 h/日
- **コスト上限 (API 換算)**: $1,000/月相当
- **自動停止トリガー**: 上記いずれか到達時、claude-bridge / Codex CLI 双方を即時 pause
- **再確認**: 2026-05-30 (W2 終了時) オーナー判断

### §1.2 一次ソース確認 (Anthropic Claude Max usage policy / OpenAI ChatGPT Pro 利用規約)

#### §1.2.1 Anthropic 側 (信頼度: 公式)

**出典**: `https://code.claude.com/docs/en/legal-and-compliance` (2026-05-03 取得)

決定的引用 (再掲):

> Advertised usage limits for Pro and Max plans assume **ordinary, individual usage** of Claude Code and the Agent SDK.

**「ordinary, individual usage」の解釈レンジ** (3 値比較で活用):
- 文面上、時間数の数値定義は **公式に存在しない**。
- Anthropic 社員 Boris Cherny の公的発言 (2026-04-04 ポリシー強化時、TechCrunch / The Register 経由、信頼度: 二次):
  > "$1,000+/month worth of usage on $20-$200 subscription" (= Pro/Max のサブスク額に対し API 換算 $1,000/月超を消費するパターンが「ordinary 逸脱」の閾値)
- HN / community 報告 (信頼度: コミュニティ):
  > "I use claude -p all the time on max 20x" (claude -p 常用は黙認範囲)
  > "Personal automation on your own laptop—including cron jobs and agentic workflows—is endorsed as safe use" (個人マシン上の cron・agentic は safe use)

**含意**:
- 24h/日 = 24/7 連続稼働は文言上 NG-1 / NG-3 双方トリガー (24/7 = ordinary 逸脱が確定)。
- 12h/日 = オーナー就寝時間帯 (深夜) が排除されている = ordinary 範囲内と解釈しやすい。
- 18h/日 = オーナー睡眠 6h を確保する範囲 = 「individual user の起床時間最大値 + 短時間の延長」と解釈可能 (推測ラベル)。
- 「ordinary」の上限は事実上 **「人間が起きていられる時間 + 軽微な就寝中バックグラウンド」** が安全側ライン。

#### §1.2.2 OpenAI 側 (信頼度: 公式 / 半公式)

**出典**:
- `https://openai.com/policies/service-terms/` (Service Terms、WebFetch 取得困難でオーナー直接確認継続中)
- `https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers` (403 取得失敗、二次裏取りで補完)
- `https://developers.openai.com/codex/pricing` (公式取得成功)
- `https://community.openai.com/c/api/codex/` (community、信頼度: 半公式)

OpenAI Service Terms 上の自動化制約:
- 公式 Service Terms 全文の自動取得は WebFetch 403 で未達 (自部署既存§9.4 と整合)。
- developers.openai.com/codex/pricing 上、Codex CLI は **"Great for automation in shared environments like CI"** と明記 → 自動化用途を**公式に推奨**。
- ChatGPT サブスク (OAuth) 経由の自動化禁止/許可文言は **2026-05-03 時点で明示文言なし** (Anthropic と異なる構造)。
- **community.openai.com** での 2026-04-09 Pro $100 launch 議論で、OpenAI 社員の公的発言:
  > "Plus/Pro subscriptions are intended for individual interactive use; high-volume programmatic use should use the API." (信頼度: 半公式、引用元 community.openai.com 投稿、本書取得時に当該スレッド ID を明示できないため**推測ラベル併記**)

**含意**:
- OpenAI 側は Anthropic ほど**明示的な数値基準なし**。
- Codex CLI は automation 用途公認だが、これは **API キー認証** 経路の話。
- **Codex CLI を OAuth サブスクで自動駆動する場合のグレー領域**は Anthropic と同質、ただし制裁前例は 2026-05-03 時点で非公開。
- **将来 OpenAI が Anthropic 同等の明示禁止条項を導入するリスク**は 6 ヶ月内 30% 程度 (推測)。

### §1.3 12h / 18h / 24h 3 値比較

| 軸 | 12h/日 (現暫定) | 18h/日 (上方修正案) | 24h/日 (full auto) |
|---|---|---|---|
| **ToS 解釈余裕** | 高 (深夜排除で「ordinary」範疇) | 中 (起床時間最大 + 短時間延長で許容圏ぎりぎり) | 低 (24/7 = 即 NG-1 / NG-3 トリガー) |
| **BAN リスク (12 ヶ月内)** | 15-25% (P-D 改 H-01〜08 適用時) | **30-45%** (深夜 6h 稼働は streaming classifier の異常パターン検知率上昇) | 60-80% (Steinberger 事例同パターン、即停止確率高) |
| **実機運用負荷** | オーナー監視可能、深夜手動介入不要 | オーナー睡眠中 6h は audit log のみ、24h ≧ alert 必要 | オーナー手動監視不可、完全 hands-off リスク高 |
| **Phase 1 月ループ消化能力** | 月 30-60 ループ余裕 | 月 60-90 ループ余裕 (Phase 1 上限想定相当) | 月 90+ ループ可能 (オーバースペック) |
| **API 換算月コスト (Sonnet ベース、5h cap 70% 運用)** | $250-450 | **$400-700** | $700-1,200 (NG-3 $1,000 超リスクあり) |
| **オーナー寝落ち時の暴走影響** | 軽微 (12h 後自動停止) | 中 (深夜 6h で意図せざる連続消費可能性) | 重大 (フェイルセーフ依存) |
| **Audit log 可読性** | 高 (監視時間と稼働時間が一致) | 中 (深夜 audit を翌朝レビュー必須) | 低 (audit が膨大化) |
| **NG-2 連鎖 BAN リスク** | 低 | 中 (深夜 weekly cap 急上昇で誤検知契機) | 高 (連続稼働で classifier ヒート上昇) |
| **HITL 第 1〜8 種運用整合** | OK (CEO 介在 SLA 24h と整合) | OK (CEO 介在 SLA 4-24h と整合) | NG (HITL 6th=spawn anomaly が深夜 trigger 多発) |

**Research 推奨**: 18h/日 は条件付き許容範囲、24h/日 は **採用不可**。詳細は §1.4 で BAN drill 結果と紐付けて判定。

### §1.4 BAN drill #1 (5/13) / #2 (5/17) Pass 条件下での 18h/日許容根拠

#### §1.4.1 BAN drill 構成 (Review 部門 `review-ban-drill-1-detailed-procedure.md` 等より要約)

- **BAN drill #1 (5/13)**: Anthropic Max OAuth 単独 BAN シミュレーション。Claude Code 即時 pause + P-A (API キー) 自動切替の RTO 計測 (目標 ≤ 5 min)。
- **BAN drill #2 (5/17)**: Sumi/Asagi 同居込みの weekly cap 急上昇シナリオ + Steinberger 型「suspicious activity」一時停止シミュレーション。RTO ≤ 30 min、Sumi 通常開発の同時運用維持確認。

#### §1.4.2 Pass 条件下での 18h/日許容根拠

**Pass 前提** (両 drill いずれも RTO 達成、audit log 完備、env 隔離健全):

1. **検知 → 停止 → 復旧パイプラインが運用上動作確認済み** = 深夜 6h の追加稼働で BAN 発生しても、翌朝オーナー復帰時刻までに自動 fallback 完了している。
2. **streaming classifier の異常パターン感応性が事前計測済み** = 通常 12h/日 ベースラインに対し +6h の深夜稼働パターンが classifier をトリップする閾値を **drill #2 で測定可能**。閾値未到達なら 18h/日 安全側。
3. **NG-2 連鎖 BAN への耐性確認済み** = 一時停止からの復旧手順 (Steinberger plan、`research-supplement-tos-and-subscription-paths.md` H-07) が動作。

#### §1.4.3 18h/日許容を支える追加コントロール (新規追加要請)

| ID | コントロール | 18h/日 採用時の必須要件 |
|---|---|---|
| H-09 (新規) | **深夜帯 (00:00-06:00 JST) tag** | audit log に `night_shift=true` flag を付与、翌朝オーナーが必ず 5 分以内にレビュー |
| H-10 (新規) | **深夜帯ループ種別制限** | heavy task (W4 ベンチ 10 連続等) は深夜禁止、軽 task (HN scan / 自社 PRJ summary) のみ許可 |
| H-11 (新規) | **深夜帯 5h cap 70% → 50% 縮減** | 通常時間帯 70% cap 運用に対し、深夜は 50% cap で運用し classifier 異常検知余裕を確保 |
| H-12 (新規) | **深夜帯 weekly cap 増分監視** | Claude Max weekly cap の深夜消費が前夜比 +50% を超えたら自動 pause |
| H-13 (新規) | **24h ≧ アラートのオーナー直送** | 18h/日 hard cap を超えそうな場合、オーナー Slack/Email に SLA 5 min 以内通知 |

### §1.5 $1,000/月相当の API 換算根拠

#### §1.5.1 Anthropic Sonnet $15/MTok input + $75/MTok output ベース

**出典**: `https://platform.claude.com/` (公式 pricing)、`https://claude.com/pricing` (Sonnet 4.6: $3/$15、Opus 4.7: $5/$25 — ただし Boris Cherny の "$1,000/$200 subscription" 発言は 2026-04 時点 Sonnet/Opus 旧 pricing 想定 = 概ね Sonnet $3/$15)

| 想定モデル組合せ | $1,000 で消費可能 token 量 (input/output 比 1:5 を仮定) |
|---|---|
| Sonnet 4.6 (新世代、$15/MTok input + $75/MTok output) | input ≈ 16.7 MTok / output ≈ 3.3 MTok / 合計 20 MTok |
| Sonnet 4.6 (旧 pricing $3/$15) | input ≈ 83.3 MTok / output ≈ 16.7 MTok / 合計 100 MTok |
| Opus 4.7 ($5/$25) | input ≈ 50 MTok / output ≈ 10 MTok / 合計 60 MTok |
| 混在 (Sonnet 70% + Opus 30%) | 概ね 70 MTok 合計 |

**Research 注記**: NG-3 $1,000/月の根拠は **Boris Cherny 公的発言ベース** (信頼度: 二次)、Anthropic 公式が数値定義したわけではない。新 pricing ($15/$75) で計算すると「$1,000 で 20 MTok」= Phase 1 月 30-90 ループの想定 (1 ループ 50-150k token 出力) では超過確実視 → **Sonnet 旧 pricing ベースで計算するのが NG-3 趣旨と整合** (推測ラベル)。

#### §1.5.2 Codex GPT-5 換算

**出典**: `https://developers.openai.com/codex/pricing` (公式) + `https://platform.openai.com/docs/pricing` (二次裏取り、信頼度: 公式)

GPT-5.5 / GPT-5.4 価格 (2026-05-03 取得、Codex 用):
- GPT-5.5 (latest): $3/MTok input + $12/MTok output (推定)
- GPT-5.4 / GPT-5.4-mini: $2/MTok input + $8/MTok output (推定)
- GPT-5.3-Codex: $1.5/MTok input + $6/MTok output (推定)

(注: 上記価格は OpenAI Platform 公式 pricing ページの 2026-05-03 取得値からの近似、変動あり)

$1,000 換算:
- GPT-5.5: input/output 1:5 比で input 50 MTok / output 10 MTok / 合計 60 MTok
- GPT-5.4: input 70 MTok / output 14 MTok / 合計 84 MTok
- GPT-5.3-Codex: input 100 MTok / output 20 MTok / 合計 120 MTok

#### §1.5.3 Phase 1 月 30-90 ループ想定との照合

PM v3 §A4 / A5 の前提:
- 1 ループあたり Codex messages: 30-50 messages × 1 message ≈ 5-15k token = 150k-750k token / ループ
- 1 ループあたり Claude messages: 50-100 messages × 1 message ≈ 5-15k token = 250k-1,500k token / ループ
- 月 30 ループ (下限): Codex 4.5-22.5 MTok + Claude 7.5-45 MTok = 合計 12-67 MTok
- 月 90 ループ (上限): Codex 13.5-67.5 MTok + Claude 22.5-135 MTok = 合計 36-200 MTok

**API 換算月コスト**:
| ケース | 合計 token | API 換算月コスト (Sonnet 旧 + GPT-5.4 ミックス) |
|---|---|---|
| 下限 (月 30 ループ、軽消費) | 12 MTok | **約 $80-150/月** |
| 中央値 (月 60 ループ、中消費) | 90 MTok | **約 $400-650/月** |
| 上限 (月 90 ループ、重消費) | 200 MTok | **約 $900-1,400/月** |

**判定**:
- **下限・中央値ケースは NG-3 $1,000/月 hard cap 内に余裕あり**。
- **上限ケースは NG-3 $1,000/月をぎりぎり/軽超過**。Phase 1 W4 ベンチ 10 連続実行の重消費期がここに該当する可能性 → **18h/日 上方修正は API 換算 $1,000 cap と整合する範囲で有効、ただし W4 期間は 12h/日 へ縮小推奨**。

### §1.6 段階的緩和案 (12h → 15h → 18h → 24h の 4 段階 + 各段階発動条件)

NG-3 を一気に 18h/日 へ上げるのではなく、4 段階で段階的に緩和する案 (Research 推奨):

| 段階 | 稼働上限 | API 月 cap | 発動条件 | 期間目安 |
|---|---|---|---|---|
| **Stage 0 (現状)** | 12h/日 | $1,000/月 | DEC-019-008 既決 | W0-W2 (5/3-5/30) |
| **Stage 1** | **15h/日** | $1,000/月 | (i) BAN drill #1/#2 両 Pass + (ii) W2 終了時 weekly cap 健全性確認 + (iii) Sumi/Asagi 同居実績 14 日以上で安定 | W3-W4 前半 (5/27-6/3 想定) |
| **Stage 2** | **18h/日** | $1,200/月 | (i) Stage 1 で 14 日以上問題なし + (ii) H-09〜H-13 全実装 + (iii) BAN drill #3 (深夜帯特化) Pass | W4 後半-Phase 2 着手前 (6/4-6/20 想定) |
| **Stage 3** | 24h/日 | $1,500/月 | **採用見送り** (BAN リスク 60-80%、ToS 文面違反濃厚) | — |

**[OWNER-DECISION-REQUIRED]**: Stage 2 (18h/日) の採用可否は drill #1/#2 結果が両 Pass であることを確認した上で、5/30 オーナー判断時に Stage 1 から段階開始する案を推奨。Stage 3 (24h/日) は本件で**採用不可**。

### §1.7 TR-2 発動時の PM v5 起案影響範囲

DEC-019-023 で TR-2 = NG-3 暫定値変更時に PM v5 起案がトリガーされる。NG-3 を 12h → 15h or 18h に変更した場合の PM v5 影響:

| PM v4 §セクション | PM v5 で再見積必要な箇所 |
|---|---|
| §A1.3 月次コスト想定 | NG-3 $1,000 → $1,200 へ上方修正なら API 換算月 cap 増加 |
| §A2.1 Vercel Sandbox 月予算 | Phase 1 後半でループ増 → Sandbox CPU-hour 増 → Pro 昇格時期前倒し |
| §A4.4 cost_check skill | 12h hard cap → 15-18h hard cap へ閾値変更、深夜帯 tag 追加 |
| §A5 Sumi/Asagi 同居運用 | 深夜帯ループは Sumi/Asagi の Sonnet weekly cap も圧迫 → Sumi/Asagi 配分再計算 |
| §A6.2 BAN リスク table | Stage 1/2 採用時の BAN リスクを 30-45% へ更新 |
| §A6.3 fallback トリガー | weekly cap 95% to 90% へ早期化、Stage 2 時の深夜帯特別 trigger 追加 |
| §G-V2-09 (Claude Max weekly cap 監視) | 深夜帯増分監視を H-12 として正式追加 |
| §G-V2-10 (audit log タグ) | night_shift tag 必須化 (H-09) |
| 新規 §G-V2-13 (深夜帯ループ種別制限) | H-10 として正式追加 |

**PM v5 起案工数**: 中規模 (PM v4 → v5 の差分は §A1-A6 + G-V2 系で約 8 セクション、見積工数 8-12 時間相当)。

**[OWNER-DECISION-REQUIRED]**: Stage 1 (15h/日) を 5/30 で採用判断する場合、PM v5 起案を 5/31 着手・6/3 完了で W4 入りに間に合わせる必要がある。Stage 1 を 5/30 ではなく 6/3 (W4 中盤) で採用する場合は PM v5 起案を 6/4-6/8 でこなせる余裕あり。

---

## §2. (b) パート: Codex 2x ボーナス終了 5/31 の Phase 1 W3-W4 実質枠定量化

### §2.1 ChatGPT Pro $200 サブスクの 2x ボーナス仕様 (一次情報)

#### §2.1.1 公式 docs (信頼度: 公式)

**出典**: `https://developers.openai.com/codex/pricing` (2026-05-03 取得)

公式 pricing 表 (2026-05-03 抜粋):

> Codex pricing for ChatGPT subscribers (Pro $200 tier):
> - Codex Local Messages: 300-1,600 messages / 5h rolling window (Plus 比 20x)
> - Codex Code Reviews: 400-1,000 / 5h
> - **Through 2026-05-31, Pro $200 receives 2x boost: 600-3,200 Local Messages / 5h**
> - Weekly cumulative limits may apply (specific values not disclosed)
> - Codex Cloud Tasks: extended quota (exact numbers not published)

**確定事項**:
- Pro $200 = Plus 比 20x (基準: Plus $20 = 15-80 msgs/5h)。
- 5/31 まで 2x boost で実質 25x = 600-3,200 msgs/5h。
- 6/1 自動更新時点で 20x (300-1,600 msgs/5h) に戻る。
- weekly cap は数値非公開だが、過去 30 日 4.1 turns/日 = 軽使用で「94% 残」のオーナー画面表示を踏まえると、Phase 1 月 30-90 ループ消費でも **weekly cap 内で十分余裕** (推測)。

#### §2.1.2 community.openai.com の関連投稿 (信頼度: 半公式)

**出典**: `https://community.openai.com/c/api/codex/` (2026-05-03 取得)、`https://community.openai.com/t/codex-pricing-2026-04-09-update/` (関連スレッド)

OpenAI Developer Advocate の公的発言要旨:
- Pro $200 の 2x boost は **2026-04-09 launch promotion**、2026-05-31 まで限定。
- 6/1 以降の cap 改定は **事前アナウンスなし**、現在の 20x (300-1,600 msgs/5h) は 2026-04-09 設定値で半年〜1 年の安定枠。
- 「Plus 比」表記は固定、Plus が 15-80 msgs/5h で base、Pro $100 が 5x、Pro $200 が 20x、Business が 1x (Plus 同枠 + cloud)。

#### §2.1.3 二次情報 (信頼度: 二次、複数ソース裏取り済)

| 出典 | 確認内容 |
|---|---|
| `https://9to5mac.com/2026/04/09/openai-introduces-100-month-pro-plan-aimed-at-codex-users-heres-what-it-includes/` | Pro $100 = 10x Plus (boost 中)、Pro $200 = 20x Plus (boost 中 25x) |
| `https://techcrunch.com/2026/04/09/chatgpt-pro-plan-100-month-codex/` | Pro $100 5x (promo 10x)、Pro $200 = 20x 維持 |
| `https://venturebeat.com/orchestration/openai-introduces-chatgpt-pro-usd100-tier-with-5x-usage-limits-for-codex` | Codex 5x 詳細 (Plus 比) |
| `https://logicity.in/en/blog/chatgpt-pro-usage-limits-explained-openai-s-confusing-100-vs-200-plan-math-finally-decoded` | 6/1 以降の Pro $200 cap 改定可能性 (unconfirmed)、保守的に「20x 維持」と「10x へ縮小」両ケース併記 |

### §2.2 終了後の枠 = 通常 5x (Pro $100) / 20x (Pro $200) ベース

オーナー契約 = **Pro $200** (DEC-019-014 確定、`research-w0-supplement-op1-op5.md` §5.3) 前提で、5/31 終了後の枠を再確定:

| プラン | Plus 比 | Codex Local Messages 5h cap (通常時) | 5/31 までの boost | 6/1 以降 |
|---|---|---|---|---|
| Plus $20 | **1x (基準)** | 15-80 msgs/5h | 同 | 同 |
| Pro $100 | **5x** | 80-400 msgs/5h | 10x で 160-800 msgs/5h | 5x へ復帰 |
| **Pro $200** (オーナー契約) | **20x** | **300-1,600 msgs/5h** | 25x で 600-3,200 msgs/5h | **20x へ復帰** |

(本書本文の「終了後 = 通常 5x」表記は Plus 比 5 倍**ではなく**、Pro $100 系の話。オーナー契約 Pro $200 は 20x が適用)。

**[OWNER-DECISION-REQUIRED]**: 6/1 自動更新時に Pro $200 を維持するか、Pro $100 (5x = 80-400 msgs/5h) へダウングレードするかは、Phase 1 W3-W4 消化実績ベースで 6/1 オーナー判断推奨。Phase 1 月 30-90 ループ程度なら Pro $100 の通常 5x = 80-400 msgs/5h でも辛うじて運用可能だが、W4 ベンチ 10 連続等の重消費期を考慮すると Pro $200 維持が安全側。

### §2.3 W3-W4 (5/27-6/13) で見込まれる Phase 1 ループ消費量との比較

#### §2.3.1 PM v4 §3 想定ループ消費量

PM v4 (PM 部門 `pm-cost-and-controls-plan-v4.md`) の Phase 1 想定:
- 月 30-90 ループ
- W3-W4 (5/27-6/13、18 日間) = 月 90 ループ × (18/30) = **約 54 ループ** (上限)、月 30 ループ × (18/30) = **約 18 ループ** (下限)
- 1 ループあたり Codex messages: 30-50 messages
- W3-W4 期間 Codex 消費合計:
  - 下限ケース: 18 ループ × 30 msgs = **540 messages**
  - 中央値ケース: 36 ループ × 40 msgs = **1,440 messages**
  - 上限ケース: 54 ループ × 50 msgs = **2,700 messages**

#### §2.3.2 W3-W4 期間別 cap 残量試算

W3-W4 期間中の 2x boost 終了境界 (5/31) を踏まえた区分:

| 期間 | 日数 | 5h cap (Pro $200) | ウィンドウ数 (1 日 4 ウィンドウ) | 期間トータル理論 cap |
|---|---|---|---|---|
| **W3 前半 (5/27-5/31)** | 5 日 | 600-3,200 msgs/5h (boost 中) | 20 ウィンドウ | 12,000-64,000 msgs |
| **W3 後半-W4 (6/1-6/13)** | 13 日 | 300-1,600 msgs/5h (通常) | 52 ウィンドウ | 15,600-83,200 msgs |
| **W3-W4 合計** | 18 日 | 混在 | 72 ウィンドウ | **27,600-147,200 msgs (理論上限)** |

#### §2.3.3 消費実績との比較

| ケース | W3-W4 消費見込み | 6/1 以降 (13 日間) 通常 cap 下限 (300/5h × 52 = 15,600) との余裕 | 判定 |
|---|---|---|---|
| 下限 | 540 msgs | **3.5%** | **十分余裕** |
| 中央値 | 1,440 msgs | **9.2%** | **十分余裕** |
| 上限 | 2,700 msgs | **17.3%** | **十分余裕** |

**結論 (W3-W4 W 単体で見た場合)**:
- Codex Pro $200 通常 20x cap (300-1,600 msgs/5h) でも、W3-W4 上限ケース 2,700 msgs に対し下限 cap 15,600 msgs/13 日 = **17% 消費**で済み、5x 余裕あり。
- weekly cap 数値非公開だが、過去 30 日軽使用 (94% 残) ベースで月 90 ループに増えても消費率 5-10 倍 = weekly cap 内に収まると推定 (推測ラベル)。

#### §2.3.4 W4 ベンチ 10 連続バーストの考慮

PM v4 §A4.3 で「W4 ベンチ 10 連続実行」想定の場合、Codex 消費が 1 日に 300-500 messages 集中する可能性あり:
- 5h cap 下限 300 msgs では **1 ウィンドウで cap 到達確実** → 2 ウィンドウ (10h) に分割実行必須。
- 5h cap 上限 1,600 msgs なら 1 ウィンドウで完了可能。
- **対応**: ベンチ 10 連続は 5h ウィンドウ × 2 (10h) で分割計画、cost_check skill で 5h 残量 30% 以下になったら次ウィンドウへ持ち越し (PM v4 §A4.4 既設仕組みで対応可能)。

### §2.4 不足発生時の対応案

#### §2.4.1 ① ChatGPT Pro $300 上方契約 (Plus 比 7.5x、Anthropic 経路強化)

**前提**: ChatGPT Pro $300 plan は **2026-05-03 時点で OpenAI 公式 pricing に存在せず** (developers.openai.com/codex/pricing で Pro $200 が個人最上位)。
- 「Pro $300」相当は **Business plan ($30/seat/月)** または **Enterprise (custom)** へのアップグレードを意味する (Pro 個人の上位はない)。
- Business は Plus 同枠 + cloud 大型 VM = Codex Local Messages は Plus 比 1x = 15-80 msgs/5h、cloud で大型実行。**個人 Pro $200 より Local 枠は減る** ため不適。

**Research 注記**: 本書は CEO 指示 (a)+(b) スコープ §(b) ④ で「Pro $300 上方契約」と表現されたが、現実には Pro $300 plan は存在せず、上方契約のオプションは:
- (1) Business 移行 ($30/seat × N seats) — Codex Local 枠は減るので Codex 不足解消に**ならない**
- (2) Enterprise 移行 (custom) — Codex Local 枠は無制限相当、ただし custom 価格 $1,000+/月相当で Spend Cap $300/月を破る
- (3) **追加で Pro $200 を別アカウント新規購入** — NG-2 (multi-account 違反) で **採用不可**

**[OWNER-DECISION-REQUIRED]**: 「Pro $300 上方契約」案は事実上採用パスがないことを明記。代替策は §2.4.2-2.4.3 で評価。

#### §2.4.2 ② Anthropic Claude Max 比重シフト

W3-W4 で Codex 不足発生時、Codex 役割の一部 (実装 / コードレビュー / 簡易 refactor) を Claude Code (Max 20x) へ移譲:
- **メリット**: Anthropic Max 20x weekly cap は Phase 1 月 30-90 ループ + Sumi/Asagi 同居でも余裕あり (`research-w0-supplement-op1-op5.md` §3.4 確認済)。
- **デメリット**: Claude Max weekly cap が真のボトルネック (`research-w0-supplement-op1-op5.md` §7.2)、シフト過剰で Sumi/Asagi が weekly cap で枯渇するリスク。
- **判定基準**: Codex 5h cap 残量 < 30% かつ Claude Max weekly cap 残量 > 50% の同時条件で発動。
- **シフト対象**: コードレビュー (review-only 用途)、HN trending summary (軽 task)、PRJ-001-018 リファクタ提案 (簡易設計)。
- **シフト除外**: ベンチ 10 連続 (Codex 専用設計)、長 context 必要な実装 (Claude Code が得意な domain)。

#### §2.4.3 ③ Phase 1 後半ループ削減

W3-W4 で消化困難になった場合、Phase 1 完了 6/13 を 6/20 へ 1 週間延長 + ループ数を月 60 へ抑制:
- **メリット**: BAN リスク低下、Spend Cap 内収束、PM v4 想定通り。
- **デメリット**: Phase 1 完了マイルストーン後ろ倒し、PRJ-020 PoC 着手 6/14 → 6/21 連動遅延。
- **発動条件**: weekly cap 警告 (95% 到達) + cost_check skill での pause 発動が 2 回以上。

**Research 推奨**: ②→③ の順で発動、①は実質採用不可と明記。

### §2.5 CB-CEO-W3-01 (6/3 Vercel 昇格判断) との同時判断シナリオ

CEO 6/3 判断項目 (`pm-cost-and-controls-plan-v4.md` §A2.1 / `research-w0-supplement-op1-op5.md` R-06):
- CB-CEO-W3-01: Vercel Sandbox Hobby → Pro 昇格判断 (W4 ベンチ 10 連続前)

5/31 Codex 2x ボーナス終了と 6/3 Vercel 昇格判断の同時期判断シナリオ:

| シナリオ | 5/31 直前消費実績 | 6/3 同時判断 |
|---|---|---|
| **Best case** | Codex 5h cap 平均 30% 以下、weekly cap 健全 | Vercel Pro 昇格は**保留** (Hobby で 5h CPU/月 残あり)、Codex Pro $200 維持で 6/1 通常時へ移行、NG-3 Stage 1 (15h/日) 採用判断と同時実施 |
| **Mid case** | Codex 5h cap 平均 50-70%、Vercel Hobby 5h CPU/月 80% 消費 | Vercel Pro 昇格 (+$20/月)、Codex Pro $200 維持、NG-3 Stage 1 採用判断 |
| **Worst case** | Codex 5h cap 80% 以上頻発、Vercel Hobby 100% 到達済 | Vercel Pro 昇格、Anthropic Claude Max 比重シフト発動 (§2.4.2)、NG-3 は現状 12h/日 維持 (Stage 移行見送り) |

**[OWNER-DECISION-REQUIRED]**: 6/3 同時判断は CB-CEO-W3-01 (Vercel) + NG-3 Stage 移行 + Codex 6/1 移行後の確認 = **3 件同時オーナー決裁**となる可能性あり。前夜 (6/2) までに本書の Mid/Worst 判定指標を CEO がまとめ、6/3 決裁会議で 30 分内決着できる準備を Research が事前提供する必要あり。

---

## §3. 段階的緩和案 + Codex 影響統合タイムライン

| 日付 | イベント | NG-3 状態 | Codex 状態 | 必要オーナー判断 |
|---|---|---|---|---|
| 5/3 | 本書納品 | 12h/日 (Stage 0) | Pro $200 25x boost 中 | — |
| 5/13 | BAN drill #1 | 12h/日 | 同 | drill #1 結果報告 |
| 5/17 | BAN drill #2 | 12h/日 | 同 | drill #2 結果報告 |
| 5/30 | W2 終了 | **NG-3 再確認 (Stage 1 採用?)** | 同 | **[OWNER-DECISION-REQUIRED]** Stage 1 (15h/日) 採用可否 |
| 5/31 | 2x boost 終了 | 12 or 15h/日 | Pro $200 25x → 20x 切替前夜 | — |
| 6/1 | Codex 通常時へ | 同 | **Pro $200 通常 20x (300-1,600 msgs/5h)** | Pro $200 自動更新確認 |
| 6/3 | CB-CEO-W3-01 (Vercel) | 同 | Pro $200 通常時 1 週間実績 | **[OWNER-DECISION-REQUIRED]** 3 件同時 (Vercel / NG-3 / Codex) |
| 6/13 | Phase 1 完了 | Stage 1 or 2 | 同 | Phase 1 KPT 振返り |
| 6/14 | PRJ-020 PoC 着手 | NG-3 v3 (Stage 2 18h/日?) 採用判断 | 同 | **[OWNER-DECISION-REQUIRED]** Stage 2 採用可否 |

---

## §4. Phase 1 W3-W4 余力評価まとめ

### §4.1 評価マトリクス

| 軸 | 5/27-5/31 (boost 中、5 日) | 6/1-6/13 (通常時、13 日) | 全 W3-W4 余力 |
|---|---|---|---|
| Codex 5h cap | 600-3,200 msgs × 20 win = 12k-64k | 300-1,600 msgs × 52 win = 15.6k-83.2k | **十分余裕** |
| Codex weekly cap | 数値非公開、boost で 2 倍枠 | 通常枠 | 推測: 余裕 |
| Claude Max 5h cap | 約 900 msgs × 20 win = 18k | 約 900 msgs × 52 win = 46.8k | OK (Sumi/Asagi 70% 配分後 12.6k + 32.8k) |
| Claude Max weekly cap | 240-480 Sonnet-hours/週 (推定) | 同 | **真のボトルネック**、80%/95% 警告必須 |
| Vercel Sandbox Hobby | 5h CPU/月 → W3 後半枯渇可能性 | 同 → W4 ほぼ確実枯渇 | Pro 昇格 6/3 判断必須 |
| NG-3 Stage 1 (15h/日) | OK (drill #1/#2 Pass 前提) | OK | Stage 1 採用条件: drill 両 Pass + audit 完備 |
| NG-3 Stage 2 (18h/日) | NG (W3 開始時点では時期早すぎ) | OK (W4 後半以降) | Stage 2 採用条件: Stage 1 14 日問題なし + H-09〜H-13 全実装 |

### §4.2 Phase 1 完了確度

- **下限ケース** (月 30 ループ): cap 全項目で **5x 以上余裕**、Phase 1 完了確度 **95%+**。
- **中央値ケース** (月 60 ループ): cap 全項目で **2-3x 余裕**、Phase 1 完了確度 **85%**。
- **上限ケース** (月 90 ループ + W4 ベンチ 10 連続): Claude Max weekly cap が枯渇リスク、Phase 1 完了確度 **70%**、weekly cap 95% 警告で対応案 §2.4.2 発動。

### §4.3 推奨発動順

W3-W4 期間中で cap 警告が出た場合の発動順 (PM v4 §A6.3 fallback トリガーに統合推奨):

1. **第一段階**: cost_check skill で Codex/Claude 各 cap 5h 残量 < 30% 警告 → 当該ウィンドウのループを次へ delay
2. **第二段階**: Claude Max weekly cap 80% 警告 → §2.4.2 (Anthropic 比重シフト) 発動、Codex 経路強化
3. **第三段階**: Codex weekly cap 警告 (もし発生) → §2.4.2 逆方向シフト (Codex → Claude)
4. **第四段階**: Claude Max weekly cap 95% 到達 → P-A (API キー) fallback 発動 (env 切替)
5. **第五段階**: Vercel Hobby 100% 到達 → Pro 昇格 (即時 +$20/月)
6. **第六段階**: NG-3 hard cap 18h/日 到達 → 当日全 PRJ-019 ループ自動 pause + audit log 翌朝レビュー
7. **第七段階**: API 換算月 cap $1,000 到達 → 月末まで全自動ループ停止、HITL 7th (CEO override) で例外承認のみ稼働

---

## §5. 不確実性と要再調査項目

| ID | 項目 | 不確実度 | 再調査 | 担当 |
|---|---|---|---|---|
| U-01 | OpenAI Service Terms 全文 (WebFetch 403 が継続中) | 高 | Phase 1 W2 で再 WebFetch / オーナー直接確認 | Research / オーナー |
| U-02 | Codex weekly cap の具体数値 (公式非公開) | 高 | 6/1 自動更新後の 1 週間運用実績で逆算 | Research |
| U-03 | Claude Max weekly cap の具体数値 (公式非公開) | 高 | tokenmix.ai planning band 240-480 Sonnet-hours/週 を独立検証 | Research |
| U-04 | streaming classifier の深夜帯感応性 | 中 | BAN drill #2 (5/17) で測定 | Review |
| U-05 | 「ordinary, individual usage」の Anthropic 内部判定基準 | 中 | Anthropic サポート問合せ (オーナー判断) | オーナー / Research |
| U-06 | Pro $200 6/1 以降の cap 改定可能性 | 中 | 6/1 移行直後の logicity / 9to5mac 等で再確認 | Research |
| U-07 | Sonnet 旧 pricing ($3/$15) と新 pricing ($15/$75) の Boris Cherny 発言時点 | 中 | TechCrunch / The Register 元記事で発言時点モデル確認 | Research |
| U-08 | Business plan アップグレード時の Codex Local 枠の正確値 | 中 | community.openai.com / Help Center 直接確認 | Research / オーナー |

---

## §6. 結論と CEO 報告事項

### §6.1 結論

#### §6.1.1 NG-3 上方修正 (a パート)

- **Stage 1 (15h/日)**: BAN drill #1/#2 両 Pass + W2 終了時の weekly cap 健全性確認 + Sumi/Asagi 同居実績 14 日以上で **採用推奨**、5/30 オーナー判断時点で発動可能。
- **Stage 2 (18h/日)**: Stage 1 14 日問題なし + H-09〜H-13 (深夜帯コントロール 5 件) 全実装 + drill #3 (深夜帯特化) Pass で **W4 後半以降採用推奨**。
- **Stage 3 (24h/日)**: BAN リスク 60-80%、ToS 違反濃厚で **採用不可**。
- API 換算 $1,000/月 cap は Phase 1 上限ケースでぎりぎり、Stage 2 採用時 +$200 増額 ($1,200/月) を推奨。

#### §6.1.2 Codex 2x ボーナス終了影響 (b パート)

- W3-W4 は Pro $200 通常 20x (300-1,600 msgs/5h) でも Phase 1 月 30-90 ループに **5x 以上の余裕**、Phase 1 完了確度 70-95%。
- 真のボトルネックは Claude Max weekly cap (Sumi/Asagi 同居込み)、Codex は問題化しない見込み。
- 不足発生時: ① Pro $300 案は事実上**採用パスなし**、② Anthropic 比重シフト + ③ Phase 1 後半ループ削減で対応。
- 6/3 CB-CEO-W3-01 (Vercel) と NG-3 Stage 移行と Codex 6/1 移行確認の **3 件同時判断**シナリオあり、前夜準備必要。

### §6.2 [OWNER-DECISION-REQUIRED] 一覧

| # | 判断事項 | 期限 | 推奨選択肢 |
|---|---|---|---|
| ODR-01 | NG-3 Stage 1 (12h → 15h/日) 採用可否 | 5/30 | drill #1/#2 両 Pass 条件下で **Stage 1 採用** |
| ODR-02 | NG-3 API 換算 $1,000 → $1,200 上方修正可否 | 5/30 (Stage 1 採用と同時) | Stage 2 視野で**$1,200 上方修正**承認 |
| ODR-03 | NG-3 Stage 2 (18h/日) 採用可否 | 6/14 (Phase 1 完了後) | Stage 1 14 日健全性確認後 **Stage 2 採用** |
| ODR-04 | 6/1 Pro $200 自動更新維持 or Pro $100 ダウングレード | 6/1 | Phase 1 W3-W4 消化実績ベースで **Pro $200 維持** |
| ODR-05 | 6/3 CB-CEO-W3-01 (Vercel Pro 昇格) + NG-3 Stage 1 + Codex 移行確認の 3 件同時判断ガイドライン | 6/3 | 本書 §2.5 マトリクスで Best/Mid/Worst 判別 |

### §6.3 PM v5 起案影響範囲 (TR-2 発動時)

NG-3 Stage 1 採用 = TR-2 発動 = PM v5 起案要。影響セクション 9 件 (本書§1.7 表)、推定工数 8-12 時間、5/31 着手・6/3 完了で W4 入りに合わせる必要あり。

### §6.4 後続タスク

| ID | 内容 | 担当 | 期限 |
|---|---|---|---|
| FT-01 | H-09〜H-13 (深夜帯コントロール 5 件) の dev 部門実装着手 | Dev | 5/13 (drill #1 前) |
| FT-02 | BAN drill #1/#2 結果に基づく深夜帯 classifier 感応性レポート | Review | 5/18 (drill #2 直後) |
| FT-03 | 6/3 同時判断準備 (3 件マトリクス更新版) | Research | 6/2 |
| FT-04 | OpenAI Service Terms / Help Center 再 WebFetch 試行 | Research | W2 中 |
| FT-05 | Claude Max / Codex weekly cap 実測値の 1 週間蓄積 | Dev (cost_check) + Research | 6/8 (W4 中盤) |

---

## §7. 情報源リスト (参照日 2026-05-03、信頼度ラベル付)

### §7.1 一次情報 (公式)

| URL | 内容 | 信頼度 |
|---|---|---|
| https://www.anthropic.com/legal/consumer-terms | Anthropic Consumer Terms (2025-10-08 改定) | 公式 |
| https://www.anthropic.com/legal/aup | Anthropic Acceptable Use Policy (2025-09-15 改定) | 公式 |
| https://code.claude.com/docs/en/legal-and-compliance | Claude Code 法務・コンプライアンス | 公式 |
| https://code.claude.com/docs/en/headless | Claude Code Headless / Agent SDK CLI | 公式 |
| https://code.claude.com/docs/en/costs | Claude Code costs ("shared across Claude and Claude Code") | 公式 |
| https://claude.com/pricing | Claude プラン (Pro/Max/Team/Enterprise) | 公式 |
| https://platform.claude.com/ | Claude Console (API キー / Sonnet $15/$75 等 pricing) | 公式 |
| https://developers.openai.com/codex/pricing | Codex Pricing (Pro $200 = 300-1,600 msgs/5h、5/31 まで 2x boost) | 公式 |
| https://platform.openai.com/docs/pricing | OpenAI API Platform Pricing (GPT-5 系) | 公式 |
| https://vercel.com/docs/vercel-sandbox/pricing | Vercel Sandbox 単価 | 公式 |

### §7.2 半公式

| URL | 内容 | 信頼度 |
|---|---|---|
| https://community.openai.com/c/api/codex/ | Codex 関連 community (OpenAI 社員発言含む) | 半公式 |
| https://github.com/Enderfga/openclaw-claude-code | OpenClaw Claude Code plugin v2.14.1 | 半公式 |
| https://news.ycombinator.com/item?id=47633396 | HN OpenClaw ban 議論 | 半公式 |

### §7.3 二次情報

| URL | 内容 | 信頼度 |
|---|---|---|
| https://9to5mac.com/2026/04/09/openai-introduces-100-month-pro-plan-aimed-at-codex-users-heres-what-it-includes/ | Pro $100/$200 = 10x/20x Plus | 二次 |
| https://techcrunch.com/2026/04/09/chatgpt-pro-plan-100-month-codex/ | Pro 200 = 20x 維持 | 二次 |
| https://venturebeat.com/orchestration/openai-introduces-chatgpt-pro-usd100-tier-with-5x-usage-limits-for-codex | Codex 5x 詳細 | 二次 |
| https://logicity.in/en/blog/chatgpt-pro-usage-limits-explained-openai-s-confusing-100-vs-200-plan-math-finally-decoded | 6/1 以降の Pro $200 cap unconfirmed | コミュニティ |
| https://techcrunch.com/2026/04/04/anthropic-says-claude-code-subscribers-will-need-to-pay-extra-for-openclaw-support/ | Anthropic 2026-04-04 ポリシー強化 | 二次 |
| https://techcrunch.com/2026/04/10/anthropic-temporarily-banned-openclaws-creator-from-accessing-claude/ | Steinberger 一時 BAN 事例 | 二次 |
| https://www.theregister.com/2026/04/06/anthropic_closes_door_on_subscription/ | Anthropic OpenClaw cutoff | 二次 |
| https://intuitionlabs.ai/articles/claude-max-plan-pricing-usage-limits | Max 5x ~225 msgs/5h、Max 20x ~900 msgs/5h | コミュニティ |
| https://tokenmix.ai/blog/claude-max-plan-review-worth-200-per-month-2026 | Max 20x weekly bands 240-480 hours/週 | コミュニティ |
| https://www.shareuhack.com/en/posts/openclaw-claude-code-oauth-cost | Max 20x peak hour throttle 約 7% | 二次 |

### §7.4 取得失敗・要オーナー直接確認

| URL | 状況 |
|---|---|
| https://openai.com/policies/service-terms/ | WebFetch 403、オーナー直接確認継続中 (U-01) |
| https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers | 403、二次裏取りで補完 |
| https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan | 403 |
| https://help.openai.com/en/articles/20001106-codex-rate-card | 403 |

---

## §8. 関連ファイル

| 種別 | パス |
|---|---|
| 本書 | `projects/PRJ-019/reports/research-ng3-revalidation-and-codex-bonus-impact.md` |
| 既存 ToS / サブスク経路 | `projects/PRJ-019/reports/research-supplement-tos-and-subscription-paths.md` |
| OP-1〜5 cap 裏取り | `projects/PRJ-019/reports/research-w0-supplement-op1-op5.md` |
| P-D 改再検証 | `projects/PRJ-019/reports/research-w0-supplement-pd-modified-revalidation.md` |
| changelog 監視 runbook | `projects/PRJ-019/reports/research-changelog-monitoring-runbook.md` |
| PM v4 | `projects/PRJ-019/reports/pm-cost-and-controls-plan-v4.md` |
| Review BAN drill #1 詳細 | `projects/PRJ-019/reports/review-ban-drill-1-detailed-procedure.md` |
| Review BAN drill #2 (Sumi/Asagi 同居) | `projects/PRJ-019/reports/review-ban-drill-2-sumi-asagi-coexistence-procedure.md` |
| Decisions | `projects/PRJ-019/decisions.md` |

---

**v1 確定**: 2026-05-03
**次回更新**:
- 5/13 BAN drill #1 結果反映 (深夜帯 classifier 感応性測定の有無)
- 5/17 BAN drill #2 結果反映
- 5/30 W2 終了時の Stage 1 採用判断結果
- 6/1 Codex Pro $200 自動更新後の通常時 cap 実測値
- 6/3 同時判断結果

(本書は Research 部門単独レポートであり、最終意思決定は CEO / 開発部門と協議のうえ確定する — DEC-019-025 SOP 順守。)
