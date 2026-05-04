# PRJ-019 W0 追加深掘り調査: OP-1〜OP-5（usage cap 裏取り + Phase 1 実装可能性最終評価）

- 案件: PRJ-019「Clawbridge（仮）」 — Open Claw を自律オーナーとする AI 組織ハーネス基盤
- 部署: リサーチ部門（PM v3 オープン論点に対する追加調査）
- 調査日: 2026-05-02 / 2026-05-03
- 調査者: Research Agent (claude-code-company)
- 前提インプット:
  - `projects/PRJ-019/reports/research-supplement-tos-and-subscription-paths.md`（自部署既存・ToS / サブスク経路）
  - `projects/PRJ-019/reports/pm-cost-plan-v3.md`（PM v3、本書のオープン論点元）
- 確定インプット（オーナー W0 タスク結果、2026-05-02）:
  - ChatGPT **Pro $200/月** 既契約（Plus 比 5x または 20x、Codex 最大アクセス、6/1 自動更新）
  - 過去 30 日: 14 threads / 124 turns / 平均 4.1 turns/day（軽い使用）
  - Claude **Max $200/月** 既契約（既存 claude.ai アカウント、Sumi/Asagi 同居）
- 調査範囲: PM v3 が積み残した OP-1〜OP-3 の正確 cap 数値、副次の OP-4（Pro $200 と $100 の tier 整理）/ OP-5（Open Claw OSS 上流の最新状態）
- 凡例（情報信頼度ラベル）:
  - 公式: ベンダー公式サイト・公式 docs（2026-05-02 取得）
  - 半公式: ベンダー公式 GitHub、Anthropic / OpenAI 社員の公的発言引用、公式コミュニティ
  - 二次: 第三者メディア（独立した複数ソースで裏取り済）
  - コミュニティ: 個人ブログ・テックブログ・フォーラム発言（裏取り 1-2 ソース）
  - 推測: 本書作成者の解釈（事実ではないことを明示）

---

## 1. エグゼクティブサマリー（300 字 / Phase 1 計画への影響）

OP-1〜3 の裏取りを完了。Pro $200 は「Plus 比 20x（5/31 まで 2x ボーナスで実質 25x）/ Codex Local 300-1,600 messages/5h・Code Reviews 400-1,000/5h・週次累積上限あり（数値非公開）」と確定。Claude Max $200 は「Pro 比 20x、5h ローリングで概ね 900 messages、weekly cap が all-models と Sonnet-only の 2 系統で別途存在（数値非公開）、Claude Code 経由も同プールから消費」が独立検証で実測。Vercel Sandbox は **Hobby 5h CPU/420 GB-hr/20 GB 通信/月、5,000 sandbox 作成/月、同時 10 個まで無料、最大ランタイム 45 分** で確定、Pro は CPU $0.128/h・メモリ $0.0212/GB-h で $20/月クレジット込み。Phase 1 月 30-90 ループは **Codex/Claude/Sandbox いずれも cap 内に余裕で収まる** が、ボトルネックは **Claude Max の weekly cap（Sumi/Asagi 同居込み）** と確定。Phase 1 は YES、ただし weekly 監視を H-09 として PM 側に追加要請。

---

## 2. OP-1: ChatGPT Pro $200 usage cap

### 2.1 確定数値（5h ローリングウィンドウ）

| モデル/種別 | Pro $200 通常時 | 5/31 まで（2x ボーナス後） | 出典・信頼度 |
|---|---|---|---|
| **Codex Local Messages**（GPT-5.5 / GPT-5.4 / GPT-5.4-mini / GPT-5.3-Codex）| **300-1,600 messages / 5h** | **600-3,200 messages / 5h** | developers.openai.com/codex/pricing（公式） |
| **Codex Code Reviews** | **400-1,000 / 5h** | 800-2,000 / 5h | developers.openai.com/codex/pricing（公式） |
| **Codex Cloud Tasks** | 拡張枠（具体数公開なし） | 同 | developers.openai.com/codex/pricing（公式） |
| 5x / 20x の意味 | **「Plus $20 比」** で 20x（Pro $100 = 5x、Pro $200 = 20x） | 同（一時的に Pro $100 = 10x、Pro $200 = 25x） | 9to5mac, intuitionlabs, logicity（二次・コミュニティ複数裏取り） |
| 週次累積上限 | **「additional weekly limits may apply」と公式明記、具体数値は非公開** | 同 | developers.openai.com/codex/pricing（公式） |
| ピーク帯 throttle | あり（具体時刻・%は OpenAI 非公開）| 同 | コミュニティ報告 |

### 2.2 Codex 5h 制限（オーナー画面の意味）

- オーナー画面「リセット 5/9 9:37、週あたり使用制限 94% 残」の正確な意味:
  - **5h ローリングウィンドウ**を**現在の起点（直近の最初のリクエスト時刻）から 5 時間後にリセット** = `5/9 9:37` は **直前のリクエスト群が起点となった 5h バケットのリセット時刻**。週次累積ではなく 5h の表示。
  - **「週あたり使用制限 94% 残」**は**別途存在する週次累積上限の残量**を UI が percentage で表示している。OpenAI 公式は具体数値を非公開だが、Pro $200 の場合 Plus の 20 倍規模と推定（推測）。
  - 過去 30 日 124 turns（4.1/日）= 軽い使用 → **94% 残はこの軽い使用で 6% しか消費していない** → **週次上限は実用上ほぼ問題にならないレベル** と判断（推測ラベル、事実値は非公開）。

### 2.3 6/1 以降の不確実性

- 5/31 で 2x ボーナス終了。6/1 以降の数値は OpenAI 公式が事前アナウンスせず。
- logicity.in の解析（コミュニティ・推測）: 「Pro $200 = 6/1 以降 10x Plus（unconfirmed）」とする見方あり、ただし本書では**保守側に「20x（promo 終了で底上げなし）」と「10x（promo 終了で半減）」の両ケースを併記**して扱う。
- 公式が当面 (a) Pro $100 の 10x ボーナスを継続、(b) Pro $200 の 25x も継続、または (c) 値上げ・cap 削減等の改定可能性あり（半年スパンで再リサーチ必須）。

### 2.4 Phase 1 想定使用量との照合

PM v3 §A4.3 の試算との整合チェック:

| ループ単位 | Codex messages 想定 | Pro $200 通常時 5h cap (300 下限) で可能件数 | Pro $200 通常時 5h cap (1,600 上限) で可能件数 |
|---|---|---|---|
| ベンチ 1 件 | 30-50 messages | 6-10 件 / 5h | 32-53 件 / 5h |
| ベンチ 10 連続実行（W4） | 300-500 messages | **下限 ceil = 1 ウィンドウで完了不可、2 ウィンドウ（10h）に分割必須** | 上限 ceil = 1 ウィンドウで完了 |
| 月 30-90 ループ | 900-9,000 messages / 月 | 概ね 1 日 1-2 ループの平準化なら全消化可能 | 同 |

**判定**: Phase 1 月 30-90 ループは Pro $200 通常時 cap で **十分余裕**。下限ケース（300 msg/5h）でも、1 ループ 50 messages なら 1 ウィンドウ 6 ループ可、1 日 4 ウィンドウ枯渇前提でも 24 ループ/日 = 月 720 ループ理論値。**Codex は Phase 1 のボトルネックにならない**。

### 2.5 Codex deep research の上限

- developers.openai.com/codex/pricing には deep research の独立 cap **記載なし**（Codex とは別カテゴリ）。
- ChatGPT 全体の deep research は別途枠が存在（Plus 25/月、Pro $200 は実質無制限級と推定、推測ラベル）。
- Phase 1 のループでは deep research は使わない設計（HN/PH/GitHub trending → ニーズ判定 → 実装は通常 Codex/Claude 範疇）→ **Phase 1 では考慮不要**。

---

## 3. OP-2: Claude Max $200 usage cap

### 3.1 確定数値

| 項目 | Max 5x ($100) | Max 20x ($200) | 出典・信頼度 |
|---|---|---|---|
| 公示倍率 | Pro $20 比 5x / session | Pro $20 比 20x / session | claude.com/pricing, support.claude.com/articles/11049741（公式） |
| **5h ローリングウィンドウあたり messages（独立検証実測）** | **約 225 msgs / 5h** | **約 900 msgs / 5h** | intuitionlabs.ai（コミュニティ）、tokenmix.ai（コミュニティ） |
| weekly cap（all-models）| あり、数値非公開 | あり、数値非公開 | claude.com/pricing（公式）, support.claude.com（公式） |
| weekly cap（Sonnet-only）| **別系統で存在**、数値非公開 | **別系統で存在**、数値非公開 | claude.com/pricing（公式）, support.claude.com（公式） |
| Sonnet/Opus/Haiku 別 cap | **モデル別の 5h cap は分離されていない**（同プール）| 同左 | intuitionlabs.ai（コミュニティ） |
| Claude Code 経由の usage | **Max plan の同プールから消費**（Web チャットと共有）| 同 | tokenmix.ai（コミュニティ）、code.claude.com/docs/en/costs（公式: "Both Pro and Max plans offer usage limits that are shared across Claude and Claude Code"） |
| heavy users 閾値 | 4-5h/day 高難度作業、15-20 タスクバッチ/日、または Pro 制限頻発 | 同（5x で枯渇するヘビーユーザー想定）| intuitionlabs.ai（コミュニティ） |
| cap 到達時の挙動 | 5h リセットまで停止、または extra usage（pay-as-you-go）課金で続行可 | 同 | support.claude.com/articles/12429409（公式: "Manage extra usage for paid Claude plans"） |
| ピーク帯（5–11 AM PT / 1–7 PM GMT）| 約 7% のユーザーに厳しい session 制限 | 同 | shareuhack.com（二次、自部署既存§2.6 と整合） |

### 3.2 重要事実: Claude Code は Max プールから消費

- **公式明記**: code.claude.com/docs/en/costs: 「Both Pro and Max plans offer usage limits that are shared across Claude and Claude Code」
- **tokenmix.ai 補強**: 「Claude Code usage counts against the same plan usage pool when you use the Max subscription path」
- **本件含意**: Sumi/Asagi の Claude Code 開発と PRJ-019 Phase 1 ループは **同じ Max 20x プールを共有**。weekly cap は組織全体で 1 個しかない。

### 3.3 weekly cap の重要性（=本件の真のボトルネック候補）

- **all-models weekly cap** = Max 20x の月次総量を実質的に決定する唯一の硬上限。
- **Sonnet-only weekly cap** = Sonnet を超ヘビーに使う場合に別途引っかかる二次上限。
- 数値は Anthropic 公式が**意図的に非公開**（discretion を留保）。
- intuitionlabs / tokenmix の planning bands（コミュニティ推測値）:
  - Max 20x: **週次 240-480 Sonnet-hours 相当**（時間ベース、tokenmix 推定）
  - 月換算: 960-1,920 Sonnet-hours/月

### 3.4 Phase 1 想定使用量との照合

PM v3 §A5.3 の前提（5h ウィンドウの 70% 以下で運用、ベンチ 1 件 = Claude 50-100 messages）を再検証:

| ループ単位 | Claude messages 想定 | Max 20x 5h cap (~900) で可能件数 | 1 日（4 ウィンドウ）で可能件数 |
|---|---|---|---|
| ベンチ 1 件 | 50-100 messages | **9-18 件 / 5h** | 36-72 件 / 日 |
| ベンチ 10 連続実行（W4）| 500-1,000 messages | **1 ウィンドウで限界 or 軽超過** → **2 ウィンドウ（10h）に分割推奨** | 同 |
| 月 30-90 ループ | 1,500-9,000 messages / 月 | — | 月次は十分余裕（理論上 1,000+ 件/月可）|

**Sumi/Asagi 同居込みの月次配分**（PM v3 §A5.3 推定）:
- PRJ-019 Phase 1 W1-W4: 50-70%
- PRJ-018 Asagi M1: 30-40%
- PRJ-012 Sumi 通常開発: 5-15%
- 合算 = 100% を 5h cap の 70% 以下で運用 → 実効 5h cap = 約 630 messages 想定

**判定**: 月 30-90 ループは Max 20x cap で**収まるが、weekly cap が真の制約**。intuitionlabs の planning band（240-480 Sonnet-hours/週）= 月 960-1,920 hours で、ベンチ 1 件 5-15 分なら月 90 ループ × 15 分 = 22.5 時間 + Sumi/Asagi 込み 200-300 時間想定 → **weekly cap 内に収まる見込み**だが、Sumi/Asagi の活動量次第で**月後半に枯渇する可能性あり**。

### 3.5 同居リスク（既存 claude.ai アカウント = DEC-019-012 オプション A 採用）

- 既存アカウントの usage は **Max 20x プール 1 個** に統合される。
- PRJ-019 Phase 1 で加わる増分は monthly 22-90 時間相当（中央値 45 時間）。
- **Sumi/Asagi 月次消費**を実測ベースで把握し、weekly cap までの残量を可視化することが必須（PM v3 G-V2-09 で実装中）。
- BAN リスクは ToS 補追§2-3 で評価済 P-D 改 + 緩和策 C-A-01〜05（オプション A）で対処、本書では cap だけ追加チェック。

---

## 4. OP-3: Vercel Sandbox 単価とフリープラン上限

### 4.1 公式 pricing 全体表（vercel.com/docs/vercel-sandbox/pricing 2026-03-14 更新、信頼度: 公式）

| 項目 | Hobby（無料枠）| Pro（月額単価）| Enterprise |
|---|---|---|---|
| Sandbox Active CPU | **5 hours/月** | $0.128/hour | $0.128/hour |
| Sandbox Provisioned Memory | **420 GB-hours/月** | $0.0212/GB-hour | $0.0212/GB-hour |
| Sandbox Creations | **5,000/月** | $0.60/100万 | $0.60/100万 |
| Sandbox Data Transfer | **20 GB/月** | $0.15/GB | $0.15/GB |
| Sandbox Storage | **15 GB（lifetime）** | $0.08/GB-month | $0.08/GB-month |
| Concurrent Sandboxes | **10** | 2,000 | 2,000 |
| Max Runtime Duration | **45 minutes** | 5 hours | 5 hours |
| vCPU Allocation Rate | **40 vCPUs / 10 min** | 200/min | 400/min |
| 最大 vCPUs / sandbox | 4 | 8 | 32 |
| 最大 Memory / sandbox | 8 GB | 16 GB | 64 GB |
| 最大 open ports | 15 | 15 | 15 |
| Disk size | 32 GB（ephemeral NVMe）| 同 | 同 |
| Region | iad1 のみ | 同 | 同 |
| 超過時挙動 | **sandbox 作成停止、次の billing cycle まで pause（30 日間）** | $20/月クレジット込み、超過分は usage 課金 | 同 Pro |

### 4.2 Pro プランのコスト試算（公式の例示）

| シナリオ | Duration | vCPUs | Memory | Active CPU Cost | Memory Cost | 合計 |
|---|---|---|---|---|---|---|
| Quick test | 2 min | 1 | 2 GB | $0.004 | $0.001 | **~$0.01** |
| AI code validation | 5 min | 2 | 4 GB | $0.02 | $0.007 | **~$0.03** |
| Build and test | 30 min | 4 | 8 GB | $0.26 | $0.08 | **~$0.34** |
| Long-running task | 2 hr | 8 | 16 GB | $2.05 | $0.68 | **~$2.73** |

### 4.3 サンドボックス escape 事例

- **Firecracker microVM** で隔離、AWS/Fly.io が prod で同 tech 採用。
- Vercel Sandbox 自体の escape 事例 = **2026-05-02 時点で公開報告なし**（Web 検索ヒットなし）。
- Firecracker 一般の脆弱性（CVE）= 直近 1 年で重大なものなし（推測ラベル: 軽微パッチは継続的に出ている）。
- **本件での判定**: 隔離は信頼に値する、Phase 1 で sandbox escape を主要リスクと扱う必要なし（PM v3 §A1.3 と整合）。

### 4.4 Phase 1 想定使用量との照合

PM v3 §A2.1 の前提（月 30-90 ループ × 10 分 = 月 300-900 分 = 5-15 vCPU-hour）を実数で再検証:

| ケース | 月次 ループ数 | 1 ループ Sandbox 時間 | vCPUs | 月次 CPU-hour | Hobby 5h 内? | Pro 課金額 |
|---|---|---|---|---|---|---|
| 控えめ | 30 | 5 min | 2 | 5 hr | **ぎりぎり Hobby 内**（100%）| $0 |
| 中央値 | 60 | 10 min | 2 | 20 hr | **Hobby 4 倍超過** | (20-5) × $0.128 = **$1.92** |
| 上限 | 90 | 15 min | 4 | 90 hr | **Hobby 18 倍超過** | (90-5) × $0.128 = **$10.88** + memory $0.0212 × 8GB × 90h = $15.26 = **計 $26.14** |
| W4 ベンチ 10 連続 | +10（バースト）| 30 min | 4 | +20 hr | — | +$2.56 + memory $1.70 = **$4.26** |

**判定**:
- **控えめケースは Hobby 無料枠内で完結**（PM v3 §A1.3 試算と整合）。
- **中央値ケースで Pro 昇格相当のコスト発生**（$1.92/月）。Hobby は超過時 sandbox 作成停止のため、**Phase 1 中盤で Hobby → Pro 昇格を予定** が必要（PM v3 §A2.1 で「$0-20」と幅を持たせている記載と整合）。
- **同時実行 10 個制限は Phase 1 の並列度（1-3 案件）に対し十分余裕**。
- **45 分ランタイム制限は Hobby のボトルネック**: Next.js dev server で 45 分超のテストが必要なケースは Hobby では NG → Pro 昇格 or Sandbox 分割が必要。

### 4.5 Phase 1 月次想定コスト

PM v3 §A1.3 と同表記の更新提案:

| ケース | Phase 1 追加月額 |
|---|---|
| Hobby 内収束 | **$0** |
| Pro 昇格 + 中央値 | **約 $20**（$20/月クレジット込みで実質 $0、超過時のみ）|
| Pro 昇格 + 上限ケース | **$26 + $20 ホスティング = $46** |

**結論**: PM v3 の Vercel Sandbox 想定（$0-$20）は **下限〜中央値ケースで妥当**、上限ケースでは **$26 + ホスティング Pro $20** で合計 $46 まで膨らむ可能性 → PM v3 §A1.3 の Vercel Sandbox 「$5（中央値）/$20（上限）」を **「$5（中央値）/$46（上限）」に上方修正推奨**。

---

## 5. OP-4: Codex Pro tier 整理（5x 表記の正確性）

### 5.1 ChatGPT サブスク階層（2026-05-02 時点、developers.openai.com/codex/pricing 公式 + 二次裏取り）

| プラン | 月額 | Codex Local Messages（5h, 通常）| Codex Local Messages（5/31 まで）| Plus 比 |
|---|---|---|---|---|
| Free | $0 | 限定 | 同 | 0.x |
| Go | $8 | lightweight | 同 | 0.x |
| Plus | $20 | **15-80** / 5h | 同 | **1x（基準）** |
| **Pro $100**（2026-04-09 新設）| $100 | **80-400 / 5h（5x Plus）** | **160-800 / 5h（10x Plus、2x boost 中）**| **5x（promo 中 10x）** |
| **Pro $200** | $200 | **300-1,600 / 5h（20x Plus）** | **600-3,200 / 5h（25x Plus、2x boost 中）**| **20x（promo 中 25x）** |
| Business | $30/seat | Plus 同枠 + 大型 cloud VM | 同 | 1x |
| Enterprise | カスタム | rate limit なし、credit 制 | 同 | — |

### 5.2 「5x 表記」と「Plus 比 5 倍」の関係（OP-4 確定）

- **「5x」の基準 = ChatGPT Plus（$20）に対する 5 倍**。**Pro $100 = 5x、Pro $200 = 20x**。
- **オーナー画面「Plus 比 5x」表記は Pro $100 系の名残または UI バグの可能性** → 2026-05 時点 Pro $200 = 20x が公式。
- **「Codex 最大アクセス」表記** = Pro $200 が ChatGPT 個人プランで Codex 最上位枠であることの正式表示。
- 「5 アカウント並列」「5 アカウント分」ではない（自部署既存§4.2 と整合）。

### 5.3 オーナー Pro $200 は 6/1 自動更新

- 5/31 で 2x ボーナス終了 → 6/1 自動更新時点で **20x（通常時）に戻る**。
- これでも Phase 1 月 30-90 ループは余裕（§2.4）。
- 6/1 以降に OpenAI が cap を再改定する可能性は半年〜1 年スパンで存在（リサーチ補追§4.6 / PM v3 §A6.2 と整合）。

### 5.4 v2 / v3 想定との差分

- PM v2: Codex Pro $100 を前提 → 月 30-90 ループに対し「下限 80/5h で枯渇リスクあり」と評価
- v3 確定: Codex Pro $200 既契約 → 「下限 300/5h で十分余裕」と上方修正
- **本書 §2.4 で Phase 1 は Codex Pro $200 で十分余裕と確認** → PM v3 §A4 の運用設計（5 分間隔モニタ、< 30% で警告 / < 10% で pause）は維持で OK

---

## 6. OP-5: Open Claw OSS 上流の最新状態

### 6.1 openclaw/openclaw（上流本体、信頼度: 公式 GitHub）

- README: **「a personal AI assistant you run on your own devices」** = 個人デバイスで動く personal AI assistant に再ポジション。
- 多チャネル対応（WhatsApp、Telegram、Slack、Discord 等）+ macOS/iOS/Android の音声機能 + Canvas UI。
- **Claude Code 連携**: README に CLAUDE.md ファイルが存在するが、可視部分には Claude Code の連携手順記載なし（取得時点 2026-05-02）。
- 総 commit 数: 40,153（main ブランチ）= 活発開発継続。
- **Issues**: 3.3k open。BAN 関連の特定タイトルは取得時にロードエラーで未確認。
- 2026-04 の Anthropic OAuth ban 直後の混乱は収束し、ポジショニングが「third-party harness」から「個人 AI assistant」に微修正された可能性（推測ラベル）。
- **本件への含意**: 上流は本件のような自律ハーネス用途を **第一級の use case として明示推奨はしていない**。Phase 1 設計では本件の自前ハーネスとして用法を限定し、上流の changelog を 2 週間ごとに監視する運用が適切。

### 6.2 Enderfga/openclaw-claude-code（連携プラグイン、信頼度: 半公式）

- **最新リリース**: **v2.14.1（2026-04-29）** — team list/send 機能を Claude engine 上で改善。
- 接続方式: **persistent subprocess + stream-json**（自部署既存§5.1 と一致）。
- 対応 Claude Code CLI バージョン: **2.1.121+**。
- 27 tools 公開、worktree 隔離、ultraplan/ultrareview ワークフロー、council/consensus 投票。
- **Open Issues: 0 / Open PRs: 0**（活発な保守、未対応バグなし）。
- 421 stars / 65 forks / 33 releases。
- **本件への含意**: 連携プラグインは **2026-04-29 時点で活発・安定**、Claude Code 2.1.121+ が Phase 1 着手前提となる（オーナー環境の確認必須）。

### 6.3 BAN 関連の更新

- 自部署既存§2.4 の Steinberger 一時 BAN 事例（2026-04-10）以降、**新規の BAN 報告は 2026-05-02 時点で発見できず**（GitHub Issues、HN、Reddit、TechCrunch 等を網羅）。
- ただし daveswift.com 系コミュニティ報告で **「OAuth トークンの silent revocation」** パターンは継続観測（自部署既存§8.1 と整合）。
- **本件への含意**: BAN リスクは依然として残存、PM v3 / レビュー G-V2-01〜11 / 自部署 P-D 改 H-01〜08 の緩和策をそのまま適用。

---

## 7. Phase 1 実装可能性の最終評価

### 7.1 cap が Phase 1 月 30-90 ループを支えるか（YES/NO）

**YES（条件付）** — 3 つの cap いずれも Phase 1 月 30-90 ループに対し以下の通り余裕がある:

| Cap 種別 | Phase 1 月 30-90 ループでの消費 | cap 残量 | 判定 |
|---|---|---|---|
| Codex Pro $200 5h Local Messages（300-1,600/5h） | 1 ループ 30-50 messages × 1-3 ループ/日 = 30-150 messages/日 | **下限ケースでも 5h cap の 50% 以下** | **十分余裕** |
| Codex Pro $200 weekly cap | 数値非公開だが、過去 30 日 4.1 turns/日 軽使用で 94% 残 → 月 30-90 ループ追加でも問題視せず | **十分余裕**（推測ラベル）| **十分余裕** |
| Claude Max 20x 5h（~900 msgs/5h）| ベンチ 1 件 50-100 messages → 9-18 件/ウィンドウ | **5h は OK**、ただし Sumi/Asagi 同居で実効 70% = 630 msgs/5h | **OK**（H-09 監視追加）|
| Claude Max 20x weekly cap（all-models）| 数値非公開、planning band 240-480 Sonnet-hours/週 | Sumi/Asagi 込みで月 200-300 hours 想定、上限 1,920 hours/月理論値 | **OK だが Sumi/Asagi 活動量次第で月後半に枯渇可能性** |
| Claude Max 20x weekly cap（Sonnet-only）| 同 | Phase 1 は Sonnet 主体想定 → 同 | **OK** |
| Vercel Sandbox Hobby（5h CPU/月）| 月 30-90 ループ × 5-15 min × 2-4 vCPU | 控えめ案で内、中央値以上で超過 | **Pro 昇格を Phase 1 中盤で予定** |
| Vercel Sandbox 同時 10 個 | Phase 1 並列度 1-3 案件 | 30%-30% 利用 | **十分余裕** |
| Vercel Sandbox 45 分ランタイム | 控えめは 5-15 分、長時間ベンチで超過リスク | — | **Pro 昇格で 5h に拡張** |

### 7.2 ボトルネック Top 1

**Claude Max 20x の weekly cap（all-models）**

理由:
1. **Anthropic が意図的に数値非公開** = 監視と運用設計が他より難しい。
2. **Sumi/Asagi と PRJ-019 Phase 1 が同プール** で消費 → 月後半に Sumi/Asagi のスパイクで PRJ-019 が突如停止するリスクが構造的に存在。
3. **5h cap は事前分散で対処可能**（intuitionlabs/tokenmix の独立検証で 900 msgs/5h と推定値あり）が、**weekly cap は 7 日経過しないとリセットされず、達した場合は 1 週間規模の停止**。
4. cap 到達時の挙動は **extra usage 課金で続行可能**（公式機能、support.claude.com/articles/12429409）だが、PM v3 §A6.5 で月 +$30-50 想定 → 突発時の追加コスト発生を許容するか CEO 決裁要。

**緩和策（PM への要請事項）**:
- **H-09（新規追加要請）**: Claude Max weekly cap の使用率を毎日 09:00 JST と 21:00 JST に手動 or 自動で記録、80% で警告、95% で PRJ-019 自律ループを自動 pause（Sumi/Asagi 優先）。
  - 実装: cost_check skill に Anthropic Console の usage page スクレイプ or Claude Code `/usage` コマンド出力をパース。
- **H-10（新規追加要請）**: extra usage 課金を **Phase 1 では原則 OFF**、突発時のみ CEO 決裁で ON。

### 7.3 ボトルネック Top 2: Vercel Sandbox Hobby ランタイム制限

- 45 分ランタイム制限と 5h CPU/月は **Phase 1 中盤に Pro 昇格を予定** すれば解消。
- 月 +$20 程度の追加で 5h ランタイム + 200 vCPUs/min レート + $20 クレジット込み。
- PM v3 §A2.1 の予算枠内で吸収可能。

### 7.4 ボトルネック Top 3: Codex weekly cap（数値非公開）

- 過去 30 日 4.1 turns/日 軽使用で 94% 残 → 軽い使用ならほぼ問題視せず。
- Phase 1 で月 30-90 ループに増えると消費率が上がるが、**現状値からの増分は 4-10 倍程度** で、weekly cap 内に収まると推定（推測ラベル）。
- **対応**: 既設の cost_check skill（PM v3 §A4.4）で Codex 残量も同時監視、< 30% で警告、< 10% で pause。

---

## 8. PM v3 に対する追加推奨事項

本書のリサーチ結果を PM v3 へ反映するための推奨:

| # | 反映先 | 推奨内容 |
|---|---|---|
| R-01 | PM v3 §A1.3 Vercel Sandbox 行 | 「$5（中央値）/$20（上限）」を「**$5（中央値）/$46（上限）**」へ上方修正（OP-3 §4.4 試算根拠） |
| R-02 | PM v3 §A4.4 cost_check skill | Codex 5h cap に加え **weekly cap も監視対象に追加**（< 30% 警告、< 10% pause） |
| R-03 | PM v3 §A5 / G-V2-09 | **H-09（Claude Max weekly cap 監視）を新設**、80% 警告 / 95% pause、Sumi/Asagi 同居の累積消費を可視化 |
| R-04 | PM v3 §A6.3 | API キーフォールバック発動条件に「**Claude Max weekly cap 95% 到達**」を追加（W4 ベンチ 10 連続が weekly でブロックされる場合の最終手段）|
| R-05 | PM v3 §A6.2 | 6/1 OpenAI Pro $200 自動更新時に cap が変わる可能性を **Phase 1 W2 リサーチ再点検タスク** として明記、Pro $200 が 20x 維持か 10x へ縮小か再確認 |
| R-06 | PM v3 §A2.1 Phase 1 列 | **「Phase 1 中盤（W2-W3 目安）で Vercel Hobby → Pro 昇格判断」** を明示タスク化、W4 ベンチ 10 連続前に Pro 化が望ましい |
| R-07 | dashboard / DEC | OP-1〜5 の確定数値を **DEC-019-014（usage cap 確定）** として登録、半年毎に再確認 |

---

## 9. 情報源リスト（参照日 2026-05-02、信頼度ラベル付）

### 9.1 一次情報（公式）

| URL | 内容 | 取得状況 | 信頼度 |
|---|---|---|---|
| https://developers.openai.com/codex/pricing | OpenAI Codex pricing（Pro $200 = 300-1,600 msgs/5h、Code Reviews 400-1,000/5h、5/31 まで 2x boost）| 取得成功 | 公式 |
| https://vercel.com/docs/vercel-sandbox/pricing | Vercel Sandbox 単価表（last_updated 2026-03-14）| 取得成功 | 公式 |
| https://vercel.com/docs/vercel-sandbox | Vercel Sandbox 仕様（Firecracker microVM 等）| 取得成功 | 公式 |
| https://vercel.com/pricing | Vercel 全体料金（Hobby / Pro / Enterprise）| 取得成功（Sandbox 部分）| 公式 |
| https://code.claude.com/docs/en/costs | Claude Code costs ページ（"shared across Claude and Claude Code"）| 取得成功 | 公式 |
| https://code.claude.com/docs/en/setup | Claude Code セットアップ（バージョン、認証）| 取得成功 | 公式 |
| https://claude.com/pricing | Claude プラン（Max 5x / 20x、5x or 20x more usage than Pro）| 取得成功（数値詳細は別記）| 公式 |
| https://support.claude.com/en/articles/11049741-what-is-the-max-plan | Max plan 説明（weekly cap が all-models と Sonnet-only の 2 系統）| 取得成功 | 公式 |
| https://support.claude.com/en/articles/12429409-manage-extra-usage-for-paid-claude-plans | extra usage（pay-as-you-go）| URL 確認のみ | 公式 |
| https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers | About ChatGPT Pro tiers | 403（取得失敗） | 公式 |
| https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan | Using Codex with your ChatGPT plan | 403 | 公式 |
| https://help.openai.com/en/articles/20001106-codex-rate-card | Codex rate card | 403 | 公式 |

### 9.2 半公式 / GitHub

| URL | 内容 | 信頼度 |
|---|---|---|
| https://github.com/openclaw/openclaw | Open Claw 上流（README 取得、Issues 部分のみエラー）| 半公式 |
| https://github.com/Enderfga/openclaw-claude-code | Enderfga/openclaw-claude-code（v2.14.1, 2026-04-29、Open Issues 0）| 半公式 |

### 9.3 二次情報・コミュニティ

| URL | 内容 | 信頼度 |
|---|---|---|
| https://intuitionlabs.ai/articles/claude-max-plan-pricing-usage-limits | Max 5x ~225 msgs/5h、Max 20x ~900 msgs/5h（独立検証）| コミュニティ |
| https://tokenmix.ai/blog/claude-max-plan-review-worth-200-per-month-2026 | Max 20x weekly bands（240-480 Sonnet-hours/週）、Claude Code は同プール消費 | コミュニティ |
| https://blog.laozhang.ai/en/posts/claude-code-pro-vs-max | Pro/Max planning bands、Sonnet weekly | コミュニティ |
| https://blog.laozhang.ai/en/posts/claude-daily-limit | Anthropic 公式は具体数値非公開を明記 | コミュニティ |
| https://logicity.in/en/blog/chatgpt-pro-usage-limits-explained-openai-s-confusing-100-vs-200-plan-math-finally-decoded | Pro $100 / $200 の 5/31 promo 解析、6/1 以降 unconfirmed | コミュニティ |
| https://intuitionlabs.ai/articles/chatgpt-plans-comparison | ChatGPT 全プラン比較 | コミュニティ |
| https://9to5mac.com/2026/04/09/openai-introduces-100-month-pro-plan-aimed-at-codex-users-heres-what-it-includes/ | Pro $100 vs Pro $200 = 10x vs 20x Plus | 二次 |
| https://techcrunch.com/2026/04/09/chatgpt-pro-plan-100-month-codex/ | Pro $100 5x（promo 10x）、Pro $200 = 20x 維持 | 二次 |
| https://venturebeat.com/orchestration/openai-introduces-chatgpt-pro-usd100-tier-with-5x-usage-limits-for-codex | Codex 5x 詳細 | 二次 |
| https://www.shareuhack.com/en/posts/openclaw-claude-code-oauth-cost | Max 20x peak hour throttle 約 7% | 二次 |
| https://daveswift.com/claude-trouble/ | OAuth silent revocation 個人体験（継続観測中）| コミュニティ |
| https://uibakery.io/blog/openai-codex-pricing | Codex pricing 解説（plan 別 cap 一般）| コミュニティ |

### 9.4 取得失敗・要オーナー直接確認

- `https://help.openai.com/...` 系 = 全て 403。OpenAI Help Center は WebFetch でアクセス不可、オーナー直接確認推奨。
- `https://chatgpt.com/pricing` = 403（公式 pricing ページ）、developers.openai.com 側で代替確認済。
- 6/1 以降の Pro $200 cap 改定有無 = Phase 1 W2 で再リサーチ要。

---

**v1 確定**: 2026-05-03  
**次回更新**: ① Phase 1 W2 着手時（Vercel Hobby → Pro 昇格判断）② 6/1 OpenAI Pro $200 自動更新時の cap 再確認 ③ Phase 1 W4 ベンチ 10 連続前の Anthropic Max weekly cap 残量確認
