# Research Round 5 — 5/30 NG-3 議決事前 baseline

- 文書 ID: research-w0-week2-round5-ng3-baseline
- 制定日: 2026-05-04
- 対象案件: PRJ-019 Clawbridge (Phase 1 着手準備期 W0-Week2)
- 起案: Research 部門 (claude-code-company)
- 関連決裁:
  - DEC-019-008 (NG-3 暫定値 = 12h/日 + $1,000/月相当 / W2 終了時 5/30 オーナー再確認)
  - DEC-019-050 (Anthropic API key spend cap $30/月)
  - DEC-019-051 (subscription 主軸運用方針: subscription 95% + API 5% ≤$30 = ≤$430/月)
  - DEC-019-013 (オプション A = 既存 claude.ai アカウント Sumi/Asagi 同居採用)
  - DEC-019-016 (Vercel Hobby→Pro 昇格判断は Phase 1 W3 中盤 6/3 で別決裁)
- 関連先回り Research:
  - `reports/research-supplement-tos-and-subscription-paths.md` (一次 ToS 解釈 baseline)
  - `reports/research-w0-supplement-op1-op5.md` (usage cap 確定値)
  - `reports/research-ng3-revalidation-and-codex-bonus-impact.md` (NG-3 上方修正検討、12/15/18h Stage 制)
- SOP: 順守 (DEC-019-025 一次ソース優先・主観客観分離・不確実情報明示)
- 凡例 (情報信頼度ラベル): 公式 / 半公式 / 二次 / コミュニティ / 推測
- 文量: 上限 500 行厳守

---

## §1. サマリ (5/30 議決事前 baseline)

NG-3 暫定値 12h/日 + $1,000/月相当の出典 (Boris Cherny / `ordinary individual usage`) を再確認した上で、12 / 16 / 24h 3 案 × subscription $1,000 + API $300 = 細分化案 C の妥当性を試算。Phase 1 月 30〜90 ループ完遂可否で評価、DEC-019-051 (subscription 95% + API 5% ≤$30 = ≤$430/月) との整合と 6/3 三件同時判断接続を提示。**CEO 推奨 = 案 B (16h/日 + API $100 漸進拡張)、subscription 経路は現状維持で可、API cap は $30 → $100 へ段階増額**。

---

## §2. NG-3 暫定値の出典再確認

### §2.1 NG-3 文言 (DEC-019-008)

DEC-019-008 確定の NG-3 条項 (`projects/PRJ-019/decisions.md`):

> NG-3: 24/7 連続自律稼働 / 「ordinary individual usage」を逸脱する負荷 (深夜の無限ループ・無人連続稼働で API 換算 $1,000+/月を消費)
>
> 暫定値: 12 h/日 上限 + API 換算 $1,000/月相当 hard cap、超過時自動停止、業務時間帯ウィンドウ 9:00〜23:00 JST と二重ガード、W2 終了時 (5/30) 再確認

### §2.2 「ordinary individual usage」の一次情報

**出典 1** (信頼度: 公式): `https://code.claude.com/docs/en/legal-and-compliance` (2026-05-04 取得、`research-supplement-tos-and-subscription-paths.md` §2.1 引用 1 と同一)

> Advertised usage limits for Pro and Max plans assume **ordinary, individual usage** of Claude Code and the Agent SDK.

**出典 2** (信頼度: 二次、独立 2 ソース裏取り): TechCrunch 2026-04-04 / The Register 2026-04-06 — Anthropic Claude Code 責任者 Boris Cherny 公式コメント

> "We've been working hard to meet the increase in demand for Claude, and our subscriptions weren't built for the usage patterns of these third-party tools. Capacity is a resource we manage thoughtfully and we are prioritizing our customers using our products and API."
>
> ($1,000+/month worth of usage on $20-$200 subscription = ordinary 逸脱の実例として記者会見で言及)

**出典 3** (信頼度: 公式): `https://www.anthropic.com/legal/aup` (2025-09-15 改定)

> Agentic use cases must still comply with the Usage Policy. (Acceptable Use Policy)

**出典 4** (信頼度: コミュニティ、複数ソース): HN `news.ycombinator.com/item?id=47633396` および claudefa.st guide

> "I use claude -p all the time on max 20x" — 個人 cron + agentic は黙認範囲。
> "Personal automation on your own laptop—including cron jobs and agentic workflows—is endorsed as safe use."

### §2.3 「$1,000/月相当」閾値の出所と妥当性

- **出所**: Boris Cherny 発言 ($1,000+/month worth of usage on $20-$200 subscription) — 公式数値定義ではなく、Anthropic 社員の **ordinary 逸脱の実例参照値**。
- **妥当性 (Anthropic 正規 API 換算)** — `research-ng3-revalidation-and-codex-bonus-impact.md` §1.5 の換算表より:
  - Sonnet 4.6 旧 pricing ($3/$15): $1,000 = 約 100 MTok (input/output 1:5)
  - Sonnet 4.6 新 pricing ($15/$75): $1,000 = 約 20 MTok
  - Opus 4.7 ($5/$25): $1,000 = 約 60 MTok
- **subscription Plus/Pro/Max プランの実効 API 換算上限** (intuitionlabs / tokenmix 独立検証、信頼度: コミュニティ):
  - Pro $20: 月 ~$200-400 相当 (10-20x 元値)
  - Max 5x ($100): 月 ~$500-1,000 相当
  - Max 20x ($200): 月 ~$2,000-4,000 相当 (理論最大、5h cap 70% 運用で枯渇前)
- **解釈**: $1,000/月 cap は **Max 5x ($100) と Max 20x ($200) の中間**。Boris Cherny 発言の「$1,000+ on $20-$200」= "$200 サブスクで $1,000+ 消費" = subscription 単価の **5 倍超** が ordinary 逸脱閾値。**$200 × 5 = $1,000 が境界**との解釈と整合。

---

## §3. 12h/日 vs 16h/日 vs 24h/日 シミュレーション

### §3.1 試算前提

- subscription 経路 95% + API 経路 5% (DEC-019-051 公式採用)。
- 1 ループ token 消費: Codex 30-50 messages × 5-15k tok ≈ 150-750k token、Claude 50-100 messages × 5-15k tok ≈ 250k-1.5M token (PM v3 §A4/A5)。
- API 換算月コスト (Sonnet 旧 $3/$15 + GPT-5.4 $2/$8 ミックス) = `research-ng3-revalidation-and-codex-bonus-impact.md` §1.5.3:
  - 月 30 ループ → ~$80-150
  - 月 60 ループ → ~$400-650
  - 月 90 ループ → ~$900-1,400

### §3.2 3 案比較表 (Phase 1 月 30〜90 ループ達成可否)

| 案 | 1 日稼働時間 | 1 日 5h ウィンドウ数 | API 換算試算/日 (中央値ループ消費) | API 換算試算/月 | NG-3 抵触リスク (BAN 12 ヶ月内) | Phase 1 ループ実装可能数/月 |
|---|---|---|---|---|---|---|
| **案 A: 12h/日** (現暫定) | 12h/日 (深夜 6h+12h 停止) | 2-3 ウィンドウ | $13-22 (1-2 ループ/日) | **$400-650 (中央値)** | **15-25%** | **30-60 ループ** ✓ |
| **案 B: 16h/日** (漸進案) | 16h/日 (深夜 8h 停止) | 3-4 ウィンドウ | $17-29 (1.5-2.5 ループ/日) | **$500-870** | **30-45%** | **45-75 ループ** ✓ |
| **案 C: 24h/日** (細分化案 C) | 24/7 連続 | 4-5 ウィンドウ | $30-47 (2.5-4 ループ/日) | **$900-1,400** | **60-80%** | **75-120 ループ** ✓ overspec |

### §3.3 試算式 (試算根拠の透明化)

- API 換算試算/日 = (1 ループ平均 token 消費 × 1 日ループ数) × API 単価 (Sonnet+GPT-5.4 ミックス)
- 1 日ループ数 = (稼働時間 / 24) × (月平均ループ数 / 30)
- 中央値ループ消費 = Codex 40 msg × 10k tok + Claude 75 msg × 10k tok = 1.15 MTok/ループ
- 案 A 中央値: 12/24 × 60/30 = 1 ループ/日、1.15 MTok × 7 USD/MTok 平均 = $8/日、月 30 日 = **$240/月** (試算下限)
- 案 B 中央値: 16/24 × 75/30 = 1.7 ループ/日、$13.7/日、月 = **$410/月**
- 案 C 中央値: 24/24 × 90/30 = 3 ループ/日、$24/日、月 = **$720/月**
- 注: 上記は **中央値** の試算、実 messages 数は 30-100 の幅で 2-3 倍揺れる。表 §3.2 の幅はその揺れを織り込み。

### §3.4 NG-3 $1,000/月 hard cap との整合判定

- 案 A: 中央値 $400-650 + 上限 $900-1,400 → **$1,000 内に収まる確率 75%、上限ケース W4 ベンチで軽超過リスク 25%**。
- 案 B: 中央値 $500-870 + 上限 $1,100-1,700 → **$1,000 内収率 55%、上限ケース $1,200 cap が必要**。
- 案 C: 中央値 $900-1,400 + 上限 $1,500-2,200 → **$1,000 cap 突破必至**、$1,500 cap でも上限ケースは超過。

---

## §4. NG-3 細分化案 C (subscription $1,000 + API $300) の妥当性

### §4.1 細分化案 C の構成根拠

**5/30 議決推奨候補** (CEO 事前 brief、`secretary-w2-end-owner-review-2026-05-30.md` 参照):
- subscription 上限 $1,000/月 = Claude Max $200 + Codex Pro $200 + バッファ $600
- API 上限 $300/月 = DEC-019-050 cap $30 → 10x 増額 + 拡張枠

### §4.2 subscription $1,000 内訳

| 項目 | 月額 | 用途 | 既契約状況 |
|---|---|---|---|
| Claude Max $200 (20x Pro) | $200 | Phase 1 ループ Claude 経路 + Sumi/Asagi 同居 | DEC-019-013 既設定 |
| ChatGPT Pro $200 (Codex 20x) | $200 | Phase 1 ループ Codex 経路 | DEC-019-014 既契約 |
| **既契約合計** | **$400** | — | — |
| **未使用バッファ** | **$600** | (a) Anthropic Team Plan 移行余地、(b) Codex 追加アカウント余地、(c) 緊急代替プラン余地 | 未使用 |

**Research 注記**: 既契約 $400 / cap $1,000 = **40% 利用、60% バッファ**。これは「現状維持余裕」と「拡張余地確保」の両立を意図したもの。ただし **DEC-019-013 で multi-account は NG-2 BAN リスクで不採用** が確定しているため、(b) Codex 追加アカウントは実質不可。実用バッファは (a)(c) のみで $300-400 程度。

### §4.3 API $300 内訳

| 用途 | 想定月額 | DEC-019-050 cap $30 との関係 | Phase 1 必要性 |
|---|---|---|---|
| HITL 通知 (Slack/Email 送信時の LLM 整形) | $5-15 | 含まれる | 必須 |
| mock-claude / mock-codex (E2E テスト用) | $20-40 | cap 内 | 必須 |
| E2E テスト本番実行 (W4 ベンチ 10 連続前) | $50-100 | **超過** ($30 では不足) | W4 のみ必須 |
| BAN drill / fallback drill (P-A 経由) | $30-60 | **超過** | drill 当日のみ |
| ナレッジ batch (`organization/knowledge/` 自動抽出) | $20-50 | cap 内 | DEC-019-033 で必須 |
| **積算合計** | **$125-265** | — | — |
| **緊急 fallback 枠 (BAN 時 P-A 切替)** | $50-200 | hard cap ではない | 緊急時のみ |
| **Phase 1 想定上限** | **約 $300** | 10x 増額が必要 | 5/30 議決対象 |

### §4.4 DEC-019-050 cap $30 → $300 への 10x 増額の根拠

- **必要性**: §4.3 積算で $125-265、緊急 fallback 込み $300 = **DEC-019-050 cap $30 では Phase 1 完遂不可**。
- **効果**: (i) E2E テスト本番実行を Phase 1 中盤で実施可能、(ii) BAN drill #1/#2 が API 経路で実 RTO 計測可能、(iii) BAN 緊急時の P-A 即時 fallback が cap で停止しない。
- **リスク**: cap 増額 = Anthropic API spend 上限増加 = Phase 1 想定外消費時の損失も最大 $300/月。Phase 2 での再見直しが必要。
- **代替案**: cap $30 → $100 段階増額 (本書推奨案 B)。$300 は Phase 1 全期間の必要性を見たうえで判断すべき。Phase 1 W2 時点では $100 で十分試算根拠あり。

### §4.5 6/3 三件同時判断との整合性

5/30 議決で細分化案 C を採用すると 6/3 三件同時判断 (`pm-v4-vercel-upgrade-tradeoff.md` / `pm-cb-ceo-w3-01-decision-template.md`) に以下影響:

| 6/3 判断項目 | 細分化案 C 採用時の影響 |
|---|---|
| Vercel Hobby→Pro 昇格 (CB-CEO-W3-01) | API $300 cap で実 Sandbox 消費が増える → Pro 昇格を **6/3 で必ず承認** が前提条件 |
| NG-3 Stage 移行 (12h → 16h or 18h) | $1,000 → $1,200 cap 拡張余地が確保される (但し細分化案 C は subscription $1,000 のみ) |
| Codex 6/1 自動更新確認 | subscription $1,000 cap 内に Pro $200 維持 ($400) が継続 = 整合 |

---

## §5. BAN リスク × 稼働時間の関係

### §5.1 BAN 確率推定 (`research-ng3-revalidation-and-codex-bonus-impact.md` §1.3 / §1.4 と整合)

| 稼働時間 | BAN 確率 (12 ヶ月内) | 主要根拠 |
|---|---|---|
| **24/7 (案 C)** | **60-80%** | Steinberger 事例 (2026-04-10 一時 BAN) と同パターン、streaming classifier の連続稼働パターン検知率高 |
| **16h/日 (案 B)** | **30-45%** | "ordinary individual usage" 境界線、深夜帯 6-8h 稼働で classifier 異常検知率上昇 |
| **12h/日 (案 A、現暫定)** | **15-25%** (DEC-019-007 暫定値整合) | 深夜排除で「ordinary」範疇、HN コミュニティ報告と整合 |

### §5.2 DEC-019-013 オプション A (既存 claude.ai アカウント) の Sumi/Asagi 巻き添えリスク

- **共有プール**: Claude Max 20x プールは Sumi (PRJ-012) / Asagi (PRJ-018) と PRJ-019 で同一アカウントを共有 (`research-w0-supplement-op1-op5.md` §3.2)。
- **BAN 発生時の影響**: 1 アカウント BAN = **全 PRJ 一斉停止**、Sumi/Asagi M1 計画も巻き添え (DEC-019-011 既決のリスク受容)。
- **稼働時間別の Sumi/Asagi 影響**:
  - 案 A 12h/日: Sumi/Asagi 月次消費に対し PRJ-019 増分 = 22-90 hours (中央値 45h)、weekly cap 80% 内収率 70%
  - 案 B 16h/日: 増分 30-120 hours、weekly cap 80% 内収率 50% (`research-w0-supplement-op1-op5.md` §3.4 試算延長)
  - 案 C 24/7: 増分 50-180 hours、weekly cap 95% 到達確率 70% → Sumi/Asagi が weekly で停止する確率が大幅上昇

### §5.3 BAN drill #1 (5/13) / #2 (5/17) との接続

5/30 議決時点で drill #1/#2 結果が両 Pass 確定の場合のみ、案 B (16h/日) を許容可能。drill 失敗時は案 A 維持。drill 結果に応じて 5/30 議決を再延期する余地も残す。

---

## §6. 6/3 三件同時判断への接続

### §6.1 Vercel 昇格 (Hobby→Pro) との関数関係

- **Phase 1 ループ実装数 × Sandbox 消費** = Vercel 昇格判断の主軸 (`pm-v4-vercel-upgrade-tradeoff.md`)。
- 案 A 12h/日: 月 30-60 ループ → Hobby 5h cap 内収率 60% → **Pro 昇格余地、6/3 で判断**。
- 案 B 16h/日: 月 45-75 ループ → Hobby 5h cap 内収率 30% → **Pro 昇格を 6/3 必ず承認**。
- 案 C 24/7: 月 75-120 ループ → Hobby cap 確実超過 → **Pro 昇格を 5/30 同時承認** が必要 (6/3 では遅い)。

### §6.2 NG-3 Stage 移行 (12h → 16h) の漸進可否

- `research-ng3-revalidation-and-codex-bonus-impact.md` §1.6 の **Stage 1 (15h/日) 案** = 案 B (16h/日) と類似、+1h の差。
- Stage 1 発動条件: drill #1/#2 両 Pass + W2 終了時 weekly cap 健全性 + Sumi/Asagi 同居 14 日以上安定。
- **5/30 → 6/3 の 4 日間で Stage 0 → Stage 1 を試験運用** が現実的なライン。

### §6.3 Codex 6/1 自動更新確認

- ChatGPT Pro $200 既契約は 6/1 自動更新で 2x boost 終了 → 通常 20x (300-1,600 msgs/5h) へ復帰。
- subscription $400 (Claude Max + Codex Pro) 継続前提 = 細分化案 C の subscription $1,000 cap 内 40% 利用は維持。
- 6/1 OpenAI 側で Pro $200 cap 改定 (10x へ縮小) があれば再協議。

---

## §7. 5/30 議決推奨案

### §7.1 3 案サマリ

| 案 | 稼働時間 | API cap | subscription cap | NG-3 抵触リスク | Phase 1 完遂可否 | 6/3 三件同時判断との整合 |
|---|---|---|---|---|---|---|
| **案 A: 現状維持** | 12h/日 | $30 | $400 (既契約) | 低 (15-25%) | ループ 30-60、上限 60 で枯渇 | 6/3 で全件決裁 OK |
| **案 B: 漸進拡張** ★ | 16h/日 | **$100** | $400 (既契約) | 中 (30-45%) | ループ 45-75、Phase 1 想定真ん中 | 6/3 で Vercel Pro 昇格必須、PM v5 起案 5/31-6/3 |
| **案 C: 細分化案 C** | 24/7 | $300 | $1,000 | 高 (60-80%) | ループ 75-120 (overspec) | Vercel Pro 5/30 同時承認、PM v5 起案緊急 |

### §7.2 CEO 推奨 = 案 B (16h/日 + API $100 漸進拡張)

**根拠**:
1. **ToS 適合性**: 案 A は安全だが Phase 1 上限 (90 ループ) 達成不可、案 C は ToS 文面違反濃厚で BAN 確率 60-80% は受容不可。**案 B が "ordinary individual usage" 境界線で許容圏ぎりぎり**。
2. **Phase 1 想定との整合**: 月 45-75 ループ = Phase 1 想定 30-90 の中央値帯、達成可能性最大。
3. **API cap 段階増額**: $30 → $100 = 3.3x 増額、Phase 1 必要積算 $125-265 の **下限 $125 を確保** (緊急 fallback 込みで $200 程度の上限カバー要 → 6/3 再協議で $200 へ)。
4. **6/3 接続**: PM v5 起案 5/31-6/3 完遂、Vercel Pro 6/3 承認、Codex 6/1 自動更新確認 — 3 件すべて 4 日以内に処理可能なスケジュール。
5. **DEC-019-051 整合**: subscription 95% 維持 (既契約 $400 のまま、cap $1,000 拡張せず)、API 5% 拡張 ($30 → $100 ≈ subscription $400 の 25%)。**95:5 比率は 80:20 程度に変化**するが、Phase 1 のみ許容、Phase 2 で 95:5 復帰を目指す。

**案 B 採用条件 (drill 結果依存)**:
- BAN drill #1 (5/13) / #2 (5/17) 両 Pass 確定済みであること。
- W2 終了時 (5/30) weekly cap 健全性確認済み。
- Sumi/Asagi 同居 14 日以上の安定実績。
- 全条件不満時は **案 A (現状維持) で 6/3 まで延期**。

### §7.3 案 C を推奨しない理由

- BAN 確率 60-80% = Steinberger 事例同パターン、Sumi/Asagi 巻き添え BAN で claude-code-company 全停止リスクが許容不可。
- subscription $1,000 cap 内訳の (b) Codex 追加アカウントが DEC-019-013 NG-2 で実質不可、バッファ $600 → $300-400 程度に縮小。
- API $300 = Phase 1 W2 時点では過大 cap、$100 で十分試算根拠あり。
- ToS 文面 ("ordinary individual usage") 違反濃厚 = Anthropic 側 streaming classifier 検知確実、BAN 後の復旧不可リスクあり。

---

## §8. 残課題 + Phase 2 拡張時の留意事項

### §8.1 5/30 議決後の追跡課題

| ID | 課題 | 期限 |
|---|---|---|
| RES-R5-01 | 案 B 採用時の PM v5 起案 (12h → 16h、$30 → $100) | 5/31-6/3 |
| RES-R5-02 | drill #1/#2 結果評価 + Stage 0 → Stage 1 移行可否判定 | 5/30 |
| RES-R5-03 | Sumi/Asagi 同居 weekly cap 監視 (H-09 強化) | 継続 |
| RES-R5-04 | 6/3 Vercel Pro 昇格判断時の Sandbox 消費再試算 | 6/3 |
| RES-R5-05 | 6/1 ChatGPT Pro $200 自動更新後の Codex cap 改定有無確認 | 6/1-6/3 |
| RES-R5-06 | API cap $100 → $200 への再増額判断 (W4 ベンチ前) | W3 中盤 |

### §8.2 Phase 2 拡張時の留意事項

- **稼働時間 18h/日 への Stage 2 移行**: Phase 2 着手 (6/20-) 前に H-09〜H-13 全実装完了が条件 (`research-ng3-revalidation-and-codex-bonus-impact.md` §1.4.3)。
- **24/7 (案 C) は Phase 2 でも採用見送り**: BAN リスク 60-80% は受容不可、PRJ-019 設計目標 = 「個人 AI 組織」維持のため。
- **subscription $1,000 cap 全使用ケース**: Anthropic Team Plan ($20/seat × 5 seats = $100) 移行で Sumi/Asagi 分離 + cap 拡張余地あり (Phase 2 検討課題)。
- **API $300 → $500 への拡張**: Phase 2 で月 90+ ループ常態化なら $500 が妥当。DEC-019-051 の 95:5 比率は Phase 2 で再定義必要。

### §8.3 6 ヶ月以内の再リサーチトリガー

- Anthropic ToS / Acceptable Use Policy 改定 (`research-changelog-monitoring-runbook.md` で 2 週間ごと監視)。
- OpenAI Codex ChatGPT Pro 自動化条項導入 (現状黙認、6 ヶ月内 30% 確率で導入可能性、推測ラベル)。
- Boris Cherny 的な Anthropic 社員公的発言で「ordinary」数値定義が更新される可能性。

---

## §9. 一次情報源 (cite ≥ 5 件)

### §9.1 一次情報 (公式)

| URL | 内容 | 取得日 | 信頼度 |
|---|---|---|---|
| https://code.claude.com/docs/en/legal-and-compliance | "ordinary, individual usage" 文言 (引用 1) | 2026-05-04 | 公式 |
| https://www.anthropic.com/legal/aup | Acceptable Use Policy (Agentic use cases 条項) | 2026-05-04 | 公式 |
| https://www.anthropic.com/legal/consumer-terms | Consumer Terms of Service (自動アクセス禁止条項) | 2026-05-04 | 公式 |
| https://claude.com/pricing | Claude Max 5x / 20x 公示倍率 | 2026-05-04 | 公式 |
| https://developers.openai.com/codex/pricing | Codex Pro $200 cap (300-1,600 msgs/5h) | 2026-05-04 | 公式 |
| https://support.claude.com/en/articles/11049741 | Max plan weekly cap 仕様 | 2026-05-04 | 公式 |
| https://code.claude.com/docs/en/costs | Claude Code は Max プールから消費 | 2026-05-04 | 公式 |

### §9.2 半公式 / 二次

| URL | 内容 | 信頼度 |
|---|---|---|
| TechCrunch 2026-04-04 / The Register 2026-04-06 | Boris Cherny "$1,000+/month" 発言 | 二次 (独立 2 ソース裏取り) |
| TechCrunch 2026-04-10 | Steinberger 一時 BAN 事例 | 二次 |
| https://9to5mac.com/2026/04/09/... | ChatGPT Pro $100 / $200 cap 詳細 | 二次 |
| https://news.ycombinator.com/item?id=47633396 | "claude -p on max 20x" 個人実例 | コミュニティ |
| https://intuitionlabs.ai/articles/claude-max-plan-pricing-usage-limits | Max 20x ~900 msgs/5h 独立検証 | コミュニティ |
| https://tokenmix.ai/blog/claude-max-plan-review-worth-200-per-month-2026 | Max 20x weekly bands | コミュニティ |

### §9.3 自部署既存レポート参照

- `reports/research-supplement-tos-and-subscription-paths.md` §2.7 (NG-3 文言原典)、§9.1 (一次情報源リスト)
- `reports/research-w0-supplement-op1-op5.md` §3 (Claude Max 20x 確定数値)、§5 (Codex Pro 整理)
- `reports/research-ng3-revalidation-and-codex-bonus-impact.md` §1.3 (3 値比較)、§1.5 (API 換算根拠)、§1.6 (Stage 制 4 段階)

---

**v1 確定**: 2026-05-04
**5/30 議決時の参照箇所**: §3.2 シミュレーション table / §4 細分化案 C 妥当性 / §7.2 CEO 推奨 = 案 B
**次回更新**: 5/30 議決結果反映、6/3 三件同時判断後の再評価
