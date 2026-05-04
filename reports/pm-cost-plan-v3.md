# PRJ-019 コスト計画 v3 — オプションA採用反映 + 既契約反映

- 案件: PRJ-019「Clawbridge（仮）」 — Open Claw を自律オーナーとする AI 組織ハーネス基盤
- 部署: PM 部門
- 作成日: 2026-05-03
- 作成者: PM Agent (claude-code-company)
- 版: v3（v2 = `pm-architecture-v2-and-phase1-plan.md` §5 を破棄、本書で全置換）
- 入力:
  - PM v2: `projects/PRJ-019/reports/pm-architecture-v2-and-phase1-plan.md`
  - リサーチ補追: `projects/PRJ-019/reports/research-supplement-tos-and-subscription-paths.md`
  - レビュー v2: `projects/PRJ-019/reports/review-v2-subscription-risk-and-fallback.md`
- 確定インプット（CEO 決裁 DEC-019-009〜013、2026-05-02）:
  - **DEC-019-009**: ChatGPT Pro **$200**（v2 想定の Pro $100 ではなく上位 tier）が既契約
  - **DEC-019-010**: Claude Max **$200** が既契約（既存 claude.ai アカウント、Sumi/Asagi 同居）
  - **DEC-019-011**: 月次予算 $300 = **Phase 1 で追加発生する月額の上限** として再定義
  - **DEC-019-012**: **オプションA採用** — 既存 claude.ai アカウントを Phase 1 でもそのまま使用、別アカウント分離は不採用
  - **DEC-019-013**: BAN 時の Sumi/Asagi 巻き添えリスクは緩和策 C-A-01〜05 で対処（レビュー部門が仕様化中）

---

## A1. v2 → v3 変更点

### A1.1 想定コストの差分

| 項目 | v2 想定 | v3 確定 | 差分 |
|---|---|---|---|
| ChatGPT Codex プラン | Pro **$100**（5x usage、新規購入想定）| Pro **$200**（既契約、追加ゼロ）| **既契約化**、追加 $0 |
| Claude プラン | Max $200（新規購入 or 既存利用）| Max $200（**既契約**、Sumi/Asagi と同居）| **既契約化**、追加 $0 |
| Anthropic アカウント分離 | 別 email/別 Pro $20 か別 Max $200（v2 案 + レビュー G-V2-05）| **不採用**（オプションA、追加コストゼロ）| **追加 $0**（巻き添えリスクは C-A-01〜05 で緩和） |
| Vercel ホスティング/Sandbox | Hobby 無料枠想定 | 既存 Hobby 維持、Sandbox は無料枠内 | 同 |
| Doppler / Sentry / Supabase / GitHub | v2 で計上（合算 $50-$80/月想定）| 全 Free tier 開始、必要時のみ昇格 | Phase 1 は基本ゼロ |
| 周辺ツール | 1Password CLI $3-$8、Resend 無料 | Doppler Free / GitHub Free / Sentry Free 構成に再設計 | 月次変動部のみ計上 |

### A1.2 v3 の根本転換

- v2 は **「Codex Pro $100 + Claude Max $200 + 周辺 = 月額 $250〜$500」** を「総コスト」として扱い、CEO 月次予算 $300 と整合させる構造だった。
- v3 は **「ChatGPT Pro $200 + Claude Max $200 = $400」が既契約 = Phase 1 サンクコスト** として位置づけ、Phase 1 月次予算 $300 は **「追加発生分のみ」** に再定義（DEC-019-011）。
- これにより Phase 1 の真の追加コストは **Vercel Sandbox 従量 + Supabase + Sentry + ドメイン + 通知系** の小額構成に縮減され、月次予算 $300 に対して大きな余裕を生む。

### A1.3 Phase 1 追加発生月額の真の内訳（結論先出し）

| 項目 | Phase 1 追加月額（中央値）| 範囲 |
|---|---|---|
| ChatGPT Pro $200 | **$0**（既契約） | $0 |
| Claude Max $200 | **$0**（既契約） | $0 |
| Vercel Sandbox（Firecracker microVM）| **$5** | $0（Hobby 無料枠内）〜 $20 |
| Vercel ホスティング（preview deploy のみ）| **$0** | $0（Hobby 無料）〜 $20（Pro 昇格時） |
| Doppler（secret 管理）| **$0** | $0（Free / 5 user 1 project）〜 $7（Team 昇格時、Phase 2 で検討）|
| Sentry（監視）| **$0** | $0（Developer Free 5k errors/月）〜 $26（Team 昇格は Phase 2 以降）|
| GitHub | **$0** | $0（個人 Free、private repo 無制限）|
| Supabase（監査基盤）| **$0** | $0（Free 500MB DB）〜 $25（Pro 昇格は Phase 2 以降）|
| ドメイン | **$0** | Phase 1 では取得不要 |
| Resend / Telegram / Slack（通知系）| **$0** | 全 Free tier |
| OpenAI API（embeddings 別途、リサーチ §2.3）| **$5** | $0〜$20（needs_scout の埋め込み量次第）|
| 1Password CLI（secret 隔離、レビュー G-V2-11）| **$3** | $3-$8（Individual or 既存契約と統合）|
| **Phase 1 追加発生月額（中央値）** | **約 $13** | **$3〜$73** |

→ **Phase 1 追加月額 $13（中央値）/ 上限ケース $73**、いずれも DEC-019-011 の上限 $300 に **大幅な余裕** を確保。

---

## A2. Phase 1 / 2 / 3 の月額再計算

### A2.1 Phase 別マトリクス

| カテゴリ | Phase 1 (W0-W4, 2026-05〜06) | Phase 2 (8 週、2026-07〜08) | Phase 3 (12 週、2026-09〜11) |
|---|---|---|---|
| ChatGPT Pro | $200 既契約・追加 0 | $200 既契約・追加 0 | $200 既契約・追加 0 |
| Claude Max | $200 既契約・追加 0 | $200 既契約・追加 0 | $200 既契約・追加 0 |
| Vercel Sandbox | **$0〜$20**（Hobby 5h CPU/月内、超過時従量）| **$20〜$80**（並列ループ増加で従量増）| **$100〜$300**（並列 3 案件 + ベンチ常時稼働）|
| Vercel ホスティング | **$0**（Hobby preview のみ）| **$20**（Pro 昇格、prod deploy 開始）| **$20-$100**（複数 site）|
| Doppler | $0（Free）| $0〜$7（Team 必要なら）| $7〜$15（Team 確定）|
| Sentry | $0（Free 5k errors）| $0〜$26（Team 必要なら）| $26〜$80（並列 errors 増、Business 検討）|
| GitHub | $0（個人 Free）| $0 | $0（人数増で Team $4/seat 検討）|
| Supabase | **$0〜$25**（監査ログ量による、Free 500MB の維持狙い）| $25（Pro 確定、append-only retention 90 日）| $25〜$120（Pro+ アドオン、複数 project）|
| ドメイン | $0 | $12/年（年額換算 $1/月）| $12/年 × N 件（並列案件分） |
| 通知系（Slack/Telegram/Resend）| $0 | $0〜$20（Resend 100 mails/day 超過時）| $20〜$50 |
| OpenAI API（embeddings）| $5〜$20 | $20〜$50 | $50〜$100 |
| 1Password CLI | $3〜$8 | $3〜$8 | $3〜$8 |
| **追加発生月額（中央値）** | **$13** | **$95** | **$280** |
| **追加発生月額（上限）** | **$73** | **$211** | **$793** |
| **総月額（既契約 $400 込み・中央値）** | **$413** | **$495** | **$680** |
| **総月額（既契約 $400 込み・上限）** | **$473** | **$611** | **$1,193** |
| 月次予算 ($300 追加分上限) との関係 | **大幅余裕**（中央値 4%、上限ケース 24%）| **概ね余裕**（中央値 32%、上限ケース 70%）| **超過リスクあり**（上限ケース $793 で $300 を $493 超過）|

### A2.2 各カテゴリの想定根拠

- **Vercel Sandbox**: リサーチ §5.3 / PM v2 §2.4 引用、Hobby 無料枠 5 CPU 時間 / 420 GB-hr / 5,000 sandbox/月。Phase 1 の 10 連続ベンチで 1 件 < 30min × 10 = 5h 内に収束見込み。Phase 2 以降、並列稼働で従量超過。
- **Doppler**: Free tier = 5 user / 1 project / unlimited secrets。Phase 1 は 1 project（PRJ-019 専用）で完結、Free で十分。Phase 2 で複数 project 必要なら Team plan $7/seat。
- **Sentry**: Developer Free = 5,000 errors/月、1 user。Phase 1 は実エラー発生量が小さく Free で十分。Phase 2 で Team $26/月（50k errors）昇格判断。
- **Supabase**: Free = 500MB DB / 1GB Storage / 50K MAU。Phase 1 監査ログ量見込み = 1 件 × stream-json 全 event ≒ 100KB × 10 件 / 日 = 1MB/日 = 30MB/月、Free 内で 90 日 retention 可能。Phase 2 並列ループで Pro $25 必須。
- **OpenAI API（embeddings）**: needs_scout で HN/PH/GitHub の trending 抽出に embedding 利用。Phase 1 は 1 日 30 件程度の embed → 月 1,000 件 × `text-embedding-3-small` $0.02/1M tokens で月 $5 以内。
- **1Password CLI**: レビュー G-V2-11 で OAuth トークン FS/env 隔離に使用。既存契約と統合可能なら追加ゼロ、新規 Individual $3/月。

### A2.3 Phase 1 で月次予算 $300（追加分）に収まる構成（確定）

- **採用構成**: Vercel Hobby + Doppler Free + Sentry Free + GitHub Free + Supabase Free + 1Password Individual $3 + OpenAI API $5
- **追加月額中央値**: **$13/月**（DEC-019-011 上限 $300 に対し 4.3%）
- **上限ケース**: $73/月（24%）
- **判断**: Phase 1 期間中は **Free tier の維持** を最優先方針とし、超過兆候があれば原因（暴走 / バグ / generated code 異常）を即特定して停止。

---

## A3. ベンチマークタスク（DoD）あたりのコスト試算

PM v2 §3.1.1 の Phase 1 ベンチマークタスク 1 件のコスト内訳。

### A3.1 タスク内訳と想定コスト

| ステップ | 駆動エンジン | 課金経路 | 想定コスト/件 |
|---|---|---|---|
| 1. オーナー Slack コマンド受付 | Open Claw（waiting）| サブスク内 | $0 |
| 2. HN trending top 10 取得 | Open Claw（HTTP fetch + embedding）| OpenAI API embeddings | $0.001（10 件 × 数百 token）|
| 3. /new-project 起票（Open Claw 駆動 + Codex 使用）| Codex（Local Messages）| **既契約 $200 内**（5h ローリングで 5-10 messages 消費）| **$0**（既契約内）|
| 4. CEO/秘書/PM 経由でドキュメント雛形 5 点生成 | Claude Code 駆動（Max OAuth）| **既契約 $200 内**（10-30 messages 消費）| **$0**（既契約内）|
| 5. Dev → Next.js 雛形生成（Claude Code 駆動、Max 使用）| Claude Code（Max）| **既契約 $200 内**（30-100 messages 消費）| **$0**（既契約内）|
| 6. Sandbox テスト（npm install + npm test）| Vercel Sandbox（Firecracker microVM）| Vercel Sandbox 従量 | **$0.05〜$0.20**（CPU 時間 5-15min、Hobby 無料枠内なら $0）|
| 7. Review（Claude Code 駆動）| Claude Code（Max）| **既契約 $200 内**（10-30 messages 消費）| **$0**（既契約内）|
| 8. preview deploy（Vercel）| Vercel ホスティング | Hobby 無料枠 | **$0** |
| 9. Slack 通知 | Open Claw → Slack webhook | 無料 | $0 |
| 10. 監査ログ書込（全 step）| Supabase | Free tier | $0 |
| **合計（中央値）** | | | **約 $0.05〜$0.20/件** |
| **合計（Sandbox 無料枠超過時）**| | | **約 $0.50/件**（Phase 1 後半の 10 連続実行時）|

### A3.2 DoD 目標 < $5/件（PM v2 §3.1.3 KPI）の達成可能性

- **中央値 $0.05〜$0.20/件 で目標 $5 の 1〜4% 内に収束** → **目標達成可能**。
- **既契約サブスクのコストを件あたりに按分する場合**:
  - 既契約 $400/月 ÷ 月次タスク件数想定（Phase 1: ベンチ 10 件 + drill 数件 + 開発作業多数 = 月 50 件以上）= **約 $8/件**
  - 既契約は元々 Sumi/Asagi 開発でも消費中 → PRJ-019 純按分は実態より過大評価
  - **既契約コスト按分の純粋な追加負担はゼロ**（既に支払済）と扱うのが合理的
- **したがって件あたり追加コストは $0.05〜$0.50** で、DoD < $5 を **十分余裕で達成**。

### A3.3 KPI F-02（4 週間で $300 超過は失敗判定）への影響

- ベンチ 10 件 × $0.50 = $5 + drill / 開発時 sandbox 消費 = 月 $20-$50 上限想定
- DEC-019-011 の $300（追加分）に対し **大幅余裕**
- **F-02 失敗判定の発火条件**: generated code 異常 / 暴走ループ / Sandbox 内 fork bomb 等の障害が起きた場合のみ

---

## A4. Codex 使用量制約の組み込み

### A4.1 ChatGPT Pro $200 の使用枠（リサーチ補追 §4.1 より）

| 項目 | 値（Pro $200）|
|---|---|
| Codex Local Messages（5h ウィンドウ、GPT-5.5）| **300〜1,600**（Plus の 20x 枠）|
| Cloud Tasks | 拡張枠（具体数公開なし）|
| 5/31 までの 2x ボーナス後 | 600〜3,200（25x）|
| 週次累積上限 | 別途存在（公開なし）|
| 並列ジョブ数 | 公式明示なし（推測：1 アカウントで実質 1 並列）|

### A4.2 オーナー報告「Codex 5h/週使用制限」との照合

- オーナー報告: **Codex 5h/週使用制限**
- リサーチ補追情報: **5h ローリングウィンドウあたり 300-1,600 メッセージ**
- 解釈: オーナー報告の「5h/週」は **「5 時間ローリングウィンドウ」を週単位の運用枠として実体験している** と解釈（厳密な仕様は OpenAI 公式非公表）。
- **本書では保守側に倒し、「5h ウィンドウあたり 300 messages を実効上限」として運用設計**。

### A4.3 Phase 1 のループ頻度（再計算）

| ループ単位 | 想定 messages 消費 | 1 ウィンドウ（5h）あたり可能件数 | 1 日（24h）の見込み |
|---|---|---|---|
| ベンチマーク 1 件（HN 取得 + /new-project + Next.js 雛形 + Sandbox + Review + deploy）| Codex: 30-50 / Claude: 50-100 | Codex 5-10 件 / Claude 3-6 件 | Codex 24-48 件 / Claude 14-29 件 |
| ベンチ 10 連続実行（W4 CB-1-W4-03）| Codex 300-500 / Claude 500-1,000 | 1 ウィンドウで 1 セット完結（300 上限の場合は分割）| 5h-10h で完了 |
| 開発作業（Dev タスク、Sumi/Asagi 並走）| Codex 50-100 / Claude 100-300（PM v2 §3.4 で月次半分強）| - | - |

### A4.4 上限近接時の制御

- **PM v2 §3.4.4 を踏襲**: cost_check skill が Codex 残量を 5 分間隔で記録、< 30% で警告、< 10% で **PRJ-019 自律ループ自動 pause**（PRJ-018 開発を優先）
- **追加（v3）**: Claude Max 残量も同等に監視、< 30% で警告、< 10% で同様 pause
- **W4 ベンチ 10 連続**: **平日朝の Codex/Claude 両 5h ウィンドウの残量 80% 以上を確認してから開始**、不足見込みなら 1 日ずらす
- **ピーク時間帯（5–11 AM PT / 1–7 PM GMT、リサーチ補追 §2.6）**: Claude Max 側で約 7% のユーザーに厳しいセッション制限が適用 → 日本時間の 21-3 時 / 22-4 時頃を回避

---

## A5. Claude Max 使用量制約の組み込み

### A5.1 Claude Max $200 の usage cap（リサーチ補追 §2.6 より）

| 項目 | 値 |
|---|---|
| 公示倍率 | 「20x Pro」枠 |
| ウィンドウ | 5 時間ローリングウィンドウ + 7 日累積上限 |
| 具体メッセージ数 | **公式非公表**（HN 等のコミュニティ報告では Pro の 20 倍） |
| ピーク時間帯制限 | 5–11 AM PT / 1–7 PM GMT（約 7% のユーザーに適用） |
| 並列セッション | 公式非公表（1 アカウント 1 並列の暗黙前提） |
| heavy users 閾値 | 100+ prompts/day → 公式が API 推奨 |

### A5.2 暫定値 DEC-019-008（1 日 12h 上限 / 月 $1,000 相当 API 換算）との整合

- DEC-019-008 暫定運用基準：
  - 「1 日 12 時間以上の連続稼働を避ける」
  - 「月次トータル消費を API 換算 $1,000 以下に保つ」
- v3 整合：
  - **G-V2-09（レビュー部門 §4 必須コントロール）** で「月次消費を Boris Cherny 線（$1,000 計算消費）の 80% で warn / 100% で停止」を実装 → DEC-019-008 と完全整合
  - **G-V2-07** 業務時間帯ウィンドウ（09:00〜23:00 JST 稼働、深夜停止）→ 24h 連続稼働回避、ピーク時間帯（日本時間 21:00-3:00）と一部重なるが、レート jitter（G-V2-06）で平準化
  - **DEC-019-013 オプションA採用** に伴い、Sumi/Asagi の Claude Max 消費も同枠で監視 → C-A-04（使用量モニタリング）が監視対象を 3 重化（Sumi/Asagi/Clawbridge）

### A5.3 Phase 1 のループ頻度との整合

- ベンチマーク 1 件で Claude 50-100 messages 消費（PM v2 §3.4.1 工数配分から推算）
- Sumi/Asagi 開発でも同 Max 消費を共有
- **W1-W4 期間中の Claude Max 利用配分（推定）**:
  - PRJ-019 Phase 1 W1-W4: 50-70%（PM v2 §3.4.1）
  - PRJ-018 Asagi M1: 30-40%
  - PRJ-012 Sumi 通常開発: 5-15%
- **5h ウィンドウの 70% 以下で運用（G-V2-02）** → 1 ウィンドウあたり Claude Max 余裕枠 = 公示の 70% × 20x = 約 14x Pro 相当を確保
- **ベンチ 10 連続（W4）は 1 ウィンドウ × 2 セット（朝 + 夕）で分割実行**、安全マージン十分

---

## A6. リスク

### A6.1 Phase 3 で予算超過の可能性

- A2.1 表より、Phase 3 上限ケース $793/月（追加分）が DEC-019-011 の $300 を **$493 超過**
- 主要因: 並列 3 案件で Sandbox 費用が $300/月、Sentry $80、Supabase $120 など、有料 tier 移行が複合
- **対応方針**:
  - Phase 2 終盤に Phase 3 予算枠を **$300 → $800** に拡張する DEC を CEO 経由でオーナー決裁
  - または並列度を 2 案件に抑え、Sandbox 費用を $200 内に維持
  - **Phase 3 着手前に再度コスト計画 v4 を策定** することを本書で推奨

### A6.2 Codex/Claude のサブスク値上げ・仕様変更リスク

- **2026-04-04 OpenAI Codex 価格改定**（リサーチ §4.1）と **同時期の Anthropic ToS 強化**（レビュー §2.4 引用）が直近で発生
- 半年〜1 年スパンで **同種の改定が再発する可能性** あり
- **対応方針（レビュー G-V2-10 と整合）**:
  - 6 ヶ月毎にリサーチ部門が ToS / 価格改定を再 fetch
  - 値上げ検知時は CEO に即報告、Phase 計画再策定
  - 既契約料金が上昇した場合、$200 → $300 への昇格 or 別 tier 検討（ただし DEC-019-011 月次予算上限の見直しが必要）

### A6.3 フォールバック発動時の API 課金（最大 $50/月）

- **CR-V2-01（OAuth BAN）顕在化時**、PM v2 §6.3 P-E（API キー従量併用）にフォールバック
- **API 課金見積もり（Phase 1 PoC レベル）**:
  - Anthropic API（Sonnet 4.6 $3/$15、Opus 4.7 $5/$25）× ベンチ 10 件 × Claude messages 100/件 × 想定 token 数
  - 概算: 月 **$30〜$50**（Phase 1 PoC レベル、フォールバック発動から復旧までの最大 1 週間想定）
- **DEC-019-011 月次予算 $300 内で吸収可能**（最悪ケース $73 + $50 = $123 で余裕）

### A6.4 オプションA採用に伴う巻き添え BAN リスク（DEC-019-013 に対する補足）

- 既存 claude.ai アカウントを Phase 1 でもそのまま使用（オプションA採用）
- **CR-V2-02（BAN 波及）が顕在化した場合の損失レンジ**: ¥500k〜¥2M（レビュー §2.2 試算）
- **緩和策 C-A-01〜05**（レビュー部門が仕様化中）でリスク許容範囲に収める前提
- **Phase 1 着手前必須**:
  - C-A-01 Sumi/Asagi 作業データ完全バックアップ（5/15 までに完了）
  - C-A-02 BAN 検知時 Sumi/Asagi 退避手順書（5/15 までに完了）
  - C-A-03 BAN drill 2 回実施（5/13、5/17）
  - C-A-04 使用量モニタリング動作確認（5/12 までに完了）
  - C-A-05 OAuth トークン保管隔離検証（5/15 までに完了）

### A6.5 リスクサマリー（Phase 1 月次コスト視点）

| リスク | 確率 | コスト影響レンジ | DEC-019-011 内吸収可否 |
|---|---|---|---|
| Vercel Sandbox 従量超過 | M | +$20-$80/月 | ◯ |
| Sentry / Supabase 早期昇格必要 | L | +$26-$50/月 | ◯ |
| OpenAI embeddings 想定超過 | L | +$15-$30/月 | ◯ |
| API キーフォールバック発動 | M | +$30-$50/月 | ◯ |
| BAN 巻き添えで Sumi/Asagi 停止損失 | L-M | ¥500k-¥2M（機会損失）| **金銭外損失、Phase 1 月次予算と別枠**、DEC-019-013 緩和策で抑制 |
| サブスク値上げ | L（半年内）| +$50-$100/月（既契約分の値上げ）| △（要 DEC 再発行） |

---

## 結論

- **Phase 1 追加発生月額**: **中央値 $13 / 上限 $73**、いずれも DEC-019-011 上限 $300 に **大幅余裕**
- **既契約 $400 込みの総月額**: 中央値 $413 / 上限 $473
- **DoD ベンチマークタスクあたりコスト**: **$0.05〜$0.50/件**、KPI 目標 < $5/件を **十分余裕で達成**
- **Phase 2 / 3 の総月額**: 中央値で $495 / $680、上限ケースで Phase 3 は $1,193 → 予算超過リスクあり、Phase 3 着手前にコスト計画 v4 策定推奨
- **オープン論点**:
  - ChatGPT Pro $200 と Claude Max $200 の正確な usage cap（リサーチ部門に追加調査要請）
  - Vercel Sandbox 単価とフリープラン上限（リサーチ部門に追加調査要請）

---

**v3 確定**: 2026-05-03  
**次回更新**: ① ToS ホワイトリスト/ブラックリスト確定（5/9）② Phase 1 W2 終了時の実コスト実測 ③ Phase 3 着手前
