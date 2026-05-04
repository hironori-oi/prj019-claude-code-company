最終更新: 2026-05-04 深夜（Round 7 起動時）/ 起案: 秘書部門 / 配布日: 2026-05-07 EOD（22:00 JST）/ 適用: 2026-05-08 18:00〜18:45 JST（実議事 35-45 分）

# PRJ-019 W0-Week1 検収会議 5/8 配布資料パッケージ v9（Round 5/6/7 反映、層 A+B 16 件先行承認版）

- 案件: PRJ-019「Clawbridge」 — Open Claw を Owner-in-the-loop オーナーとする AI 組織ハーネス基盤
- 文書種別: Owner 配布資料パッケージ最終版（v9 = v7/v8 系列の差分上書き版、5/7 EOD 一括配布）
- 親文書: `secretary-agenda-v7.md`（議題 v7、議決 20 件）/ `secretary-risk-register-v3-1.md`（21 件）/ `pm-phase1-plan-v3.md`（v3、Round 5/6/7 反映）/ `pm-cross-ref-final-v8.md`（41 件監査）
- 根拠決裁: DEC-019-014〜020 / DEC-019-031〜036 / DEC-019-050（$30 cap）/ DEC-019-051（subscription 主軸）/ **DEC-019-052（Marketing tone B + portfolio C + 6/27 朝 09:00 JST + Channel 3）**/ **DEC-019-053（`.env.example` 2-tier）**/ **DEC-019-054（5/8 検収会議 層 A+B 16 件 Owner 先行承認、Round 7 起票予定）**

---

## §0 v7/Final → v9 主要差分 + Owner 5/4 先行承認エビデンス

### §0.1 Owner 5/4 先行承認エビデンス（DEC-019-054 起票根拠）

**2026-05-04 Owner 即決**: 「**オプション 1 で進めて**」（5/8 検収会議 議決 21 件のうち 層 A 11 件 + 層 B 5 件 = 16 件先行承認）

- **Owner 即決の経路**: Round 6 完遂報告（commit `93f3ba2`、19 files / 3,066 insertions、G-01〜G-08 前倒し + Marketing portfolio Section 4-10 + technical-deep-dive vol 1 完遂）受領後、CEO が「Owner 5/8 検収会議の所要時間 90-105 分を 35-45 分に短縮するためのオプション提示」を実施 → Owner 即決「オプション 1 で進めて」受領
- **CEO 起票**: 2026-05-04 深夜、DEC-019-054 として decisions.md に v15.6 / v16 として追加予定（Round 7 commit 時）
- **エビデンス記録先**: 本書 §1 表紙 + §2 議決一覧 + 議事録テンプレ v4（事前承認スタンプ欄）+ DEC-019-054 起票文

### §0.2 議決-25 含む 21 件構造（v7 → v9 差分）

| 区分 | v7 (議決 20 件) | **v9 (議決 21 件、層 A+B+C)** | 増減 |
|---|---|---|---|
| 議決-1〜15（既決路線） | 15 件 / 13.0 分 | 15 件 / **3.7 分**（層 A 7 件 × 0.2 + 層 B 4 件 × 0.5 + 層 C 4 件議論時間別途） | −9.3 分 |
| 議決-20〜24（v7 新規 5 件） | 5 件 / 30.0 分 | 5 件 / **14.7 分**（層 A 1 件 + 層 B 1 件 + 層 C 3 件 × 5-7 分） | −15.3 分 |
| **議決-25 (v9 追加 = DEC-019-052 バンドル)** | — | 1 件 / **0.2 分**（層 A、Owner 5/4 既決事実上の追認） | +0.2 分 |
| **計** | **20 件 / 43.0 分** | **21 件 / 18.6 分**（実時間 35-45 分はバッファ 5-15 分含む） | **+1 件 / −24.4 分** |

注: 層 A 11 件 (議決-1, 6, 9, 11, 12, 13, 14, 15, 22, 24, 25) × 0.2 分 = 2.2 分 / 層 B 5 件 (議決-3, 4, 8, 10, 20) × 0.5 分 = 2.5 分 / 層 C 5 件 (議決-2, 5, 7, 21, 23) × 5-7 分 = 25-35 分 / 合計実時間 = **29.7-39.7 分**、バッファ含めて **35-45 分**目安。

### §0.3 v9 主要追加要素

- **§0 Owner 5/4 先行承認エビデンス**（本節、DEC-019-054 起票根拠の構造化記録）
- **§2.1 議決一覧 3 層分類**（層 A 11 件即断 / 層 B 5 件確認 / 層 C 5 件議論）
- **§2.2 所要時間配分 35-45 分版**（v7 90-105 分 → v9 35-45 分、−55〜60 分短縮）
- **§5 Quick reference card 議決-25 追加**（DEC-019-052 バンドル 4 要素 = tone B + portfolio C + 09:00 JST + Channel 3）
- **§9 議事進行 timeline 35 分標準 + 45 分余裕**版
- **§11 Round 5/6/7 完遂状況 + Phase 1 W1 着手即時化エビデンス**

---

## §1 表紙

| 項目 | 内容 |
|---|---|
| 会議名 | PRJ-019「Clawbridge」 W0-Week1 検収会議（議題 v7+v9 / 議決 21 件 / 層 A+B 16 件先行承認版） |
| 日時 | 2026-05-08（金）18:00〜18:45 JST（最大 60 分枠、実議事 **35-45 分**想定） |
| 場所 | オンライン（Zoom）+ 議事録同期取得（Slack `#prj019-meeting`）|
| 議長 | CEO（claude-code-company） |
| 書記 | 秘書部門（リアルタイム議事録、議事録テンプレ v4 使用） |
| 出席者 | Owner（議決権者）/ CEO（議事進行）/ PM 部門 / Dev 部門 / Research 部門 / Marketing 部門 / Review 部門 / 秘書部門 / 広報 Web 運営部門 |
| 配布日 | 2026-05-07 EOD（22:00 JST）— Slack DM + 1Password Vault 経由 |
| 採決方式 | 層 A 11 件 = 採決報告 + sign-off スタンプ（各 0.2 分）/ 層 B 5 件 = 補足質疑 + sign-off（各 0.5 分）/ 層 C 5 件 = 本格議論 + 採決（各 5-7 分） |
| **Owner 先行承認** | **層 A+B 16 件 = 2026-05-04 即決「オプション 1 で進めて」受領、CEO 起票 DEC-019-054（本 Round 7 起票予定）** |
| 通信規約 | 全部署 → CEO → Owner（直接報告禁止、CLAUDE.md ルール準拠）|
| 議事録配布 | 5/8 22:00 までに Owner + 全部署配布、5/9 EOD までに Owner 承認受領 → 公式議事録化 |

---

## §2 議題サマリ（議決 21 件 + 3 層分類 + 35-45 分配分）

### §2.1 議決一覧（21 件、層 A 11 + 層 B 5 + 層 C 5）

| # | 議決 | 議題名（1 行サマリ） | 起案 | 推奨 | **層** | 配分 | 5/4 先行承認 |
|---|---|---|---|---|---|---|---|
| 1 | 議決-1 | DEC-019-033 5 点統合採用（提案生成 2 段階 / HITL 第9種 / 透明性 / ナレッジ / 権限） | CEO | YES | **A** | 0.2 分 | **済** |
| 2 | 議決-2 | Phase 1 着手 5/26 Conditional Go（3 条件付き、確度 **93%**）| PM | YES | **C** | **5.0 分** | 議論 |
| 3 | 議決-3 | Phase 1 完了 6/20 + Marketing 公開 6/27 朝 09:00 JST | PM | YES | **B** | 0.5 分 | **済** |
| 4 | 議決-4 | KPI 提案承認率 ≥ 30% + TR-4 ジャンル切替 | PM | YES | **B** | 0.5 分 | **済** |
| 5 | 議決-5 | 必須コントロール 50 項目採用（既存 34 + DEC-019-033 追加 16）| PM + Review | YES | **C** | **5.0 分** | 議論 |
| 6 | 議決-6 | HITL 第 9・10・11 種正式追加 | Dev + Review | YES | **A** | 0.2 分 | **済** |
| 7 | 議決-7 | BAN drill #3（5/29）実施承認（mock 70% 化条件付き）| Review | YES | **C** | **5.0 分** | 議論 |
| 8 | 議決-8 | R-019-15 priviledge escalation 赤格付け公式化（第 6 補助層 cap 注記）| Review | YES | **B** | 0.5 分 | **済** |
| 9 | 議決-9 | Heading A 補強表記 A1 採用（「AI 組織が AI 組織を運営する」）| Marketing | YES | **A** | 0.2 分 | **済** |
| 10 | 議決-10 | Dev 2 名体制 Phase 1 全期間確保 | PM + Review | YES | **B** | 0.5 分 | **済** |
| 11 | 議決-11 | 外部 policy import 機能 Phase 1 完全無効化 | Review | YES | **A** | 0.2 分 | **済** |
| 12 | 議決-12 | 1Password TOTP Owner 二要素認証採用 | Review | YES | **A** | 0.2 分 | **済** |
| 13 | 議決-13 | DEC-019-034 P-D 改 維持 + 微修正 C-OC-06/07/08 採択 | Research | YES | **A** | 0.2 分 | **済** |
| 14 | 議決-14 | DEC-019-035 Issue/changelog 監視運用 SOP 採択（月 $0）| Research | YES | **A** | 0.2 分 | **済** |
| 15 | 議決-15 | DEC-019-036 上流 pivot に伴う Phase 2 機能候補 3 件登録 | Research | YES | **A** | 0.2 分 | **済** |
| 16 | 議決-20 | PM 月次予算 v2（$430/月構造）正式採用 | PM | YES | **B** | 0.5 分 | **済** |
| 17 | 議決-21 | Risk Register v3.1（R-019-19/20/21/22 新規 + R-019-09 緑化）正式採用 | Review + PM + Research | YES | **C** | **7.0 分** | 議論 |
| 18 | 議決-22 | 既存 5 reports 差分修正（drill-3 / test-strategy / r019-15 / readiness / risk-register）正式採用 | Review | YES | **A** | 0.2 分 | **済** |
| 19 | 議決-23 | mock-claude 70% 化 SOP + Anthropic Console 同期チェック SOP 正式採用 | Review + Dev | YES | **C** | **7.0 分** | 議論 |
| 20 | 議決-24 | DEC-019-051 = subscription plan 主軸方針 Phase 1 正式採用 | CEO + Research | YES | **A** | 0.2 分 | **済** |
| **21** | **議決-25 (v9 追加)** | **DEC-019-052 = Marketing tone B + portfolio C 両方併用 + 6/27 朝 09:00 JST + Channel 3 (Zenn + note) 一括採択** | **CEO + Marketing + Web-Ops** | **YES** | **A** | **0.2 分** | **済** |
| **計** | **21 件** | — | — | YES 全件 | A=11/B=5/C=5 | **A+B=16 件先行承認** |

注: ★ Round 7 v9 再分類 = 層 A 11 件 (Owner 5/4 即決済、5/8 当日は採決報告 + sign-off スタンプのみ) + 層 B 5 件 (Owner 5/4 即決済、5/8 当日は補足質疑受付 + sign-off) + 層 C 5 件 (5/8 当日に本格議論 + 採決)。

### §2.2 所要時間配分（35-45 分想定、v7 比 −55〜60 分）

| § | 議題 | v7 配分 | **v9 配分** | 差分 |
|---|---|---|---|---|
| §1 開催情報確認 | 出席確認 / 配布物確認 | 2 分 | 1 分 | −1 |
| §2 W0-Week1 進捗報告 | Dev / Research / PM / Marketing / Review (Round 5/6 完遂報告含む) | 10 分 | **5 分** | −5 |
| §3 Owner-in-the-loop Phase 1 Go/NoGo 議決 | DEC-019-033 5 点統合 + Conditional Go | 20 分 | 議決-2 (層 C 5 分) に統合 | −20 |
| §4 BAN drill #1 振り返り + #3 計画 | drill #1 結果 / drill #3 シナリオ | 18 分 | 議決-7 (層 C 5 分) に統合 | −18 |
| §5 PM 議題 | PM v3 (Round 5/6/7 反映) + DEC-019-021〜024 + CB-CEO-W3-01 + 透明性 + 権限 UI | 35 分 | 層 B/C 議決に分散統合 | −35 |
| §6 議決 21 件採決（A 11 + B 5 + C 5）| 逐次採決 | 43 分 | **30 分** (A 2.2 + B 2.5 + C 25) | −13 |
| §7 質疑応答 | 議決全体への横断質疑 | 15 分 | **5 分** | −10 |
| §8 締め | 議決サマリ / 次回会議予定 / CB-CEO-W3-01 / 議事録 | 5 分 | **2 分** | −3 |
| **合計** | — | **148 分** | **43-48 分**（バッファ含めて 35-45 分目安） | **−100〜103 分** |

注: v9 では §3/§4/§5 の議題内容を §6 議決の層 C 5 件 (議決-2, 5, 7, 21, 23) に集約議論で吸収する設計。Owner 5/4 先行承認 16 件は §6 採決報告のみで通過、議論は層 C 5 件に集中。

---

## §3 配布物リスト（本書を含む 9 ファイル、5/7 EOD 一括配布、v9 で v8 series 1 件追加）

| # | ファイル | 種別 | 行数目安 | 配布優先 |
|---|---|---|---|---|
| 1 | `secretary-5-8-meeting-package-v9.md` | **本書（パッケージ表紙 + 索引、Round 7 反映）** | 約 500 | **必読 #1** |
| 2 | `secretary-agenda-v7.md` | 議題 v7 本書（時間配分 + 議事構成）| 272 | **必読 #2** |
| 3 | `secretary-agenda-v6-resolutions-15.md` | 議決-1〜15 詳細（v6 から継承）| 既存 | 必読 #3 |
| 4 | `secretary-risk-register-v3-1.md` | Risk Register v3.1（21 件統合版）| 380 | 必読 #4 |
| 5 | `ceo-owner-consolidated-v9.md` | CEO 連結報告 v9（Round 5 終了時統合）| 357 | 必読 #5 |
| 6 | `pm-phase1-plan-v3.md` | Phase 1 計画 v3（Round 5/6/7 反映）| 約 400 | 参考 #6 |
| 7 | `secretary-w0-week1-meeting-minutes-template-v4.md` | 議事録テンプレ v4（議決 21 件 + 16 件先行承認エビデンス + 5 件議論欄）| 約 300 | 当日運用 #7 |
| 8 | `secretary-5-8-pre-meeting-checklist.md` | 開会前チェックリスト（30 項目）| 約 300 | 当日運用 #8 |
| **9** | **`pm-cross-ref-final-v8.md`** | **PM cross-ref final 監査（Round 1/5/6/7 = 41 件）** | **約 350** | **参考 #9（v9 追加）** |

参考添付（事前読込推奨、本パッケージ外）:

- `pm-budget-v2-30usd-api-cap.md`（324 行、議決-20 根拠）
- `review-30usd-cap-impact-assessment.md`（336 行、議決-21/22/23 根拠）
- `research-subscription-mainline-validation.md`（326 行、議決-24 根拠）
- `dev-budget-guard-30usd-v1.md`（216 行、二重防御 9 deliverables 報告）
- **Round 5 deliverables**: `dev-w0-week2-round5-prefetch.md` / `research-w0-week2-round5-ng3-baseline.md` / `marketing-portfolio-narrative-section-1-3.md` / `marketing-launch-x-thread-draft.md`
- **Round 6 deliverables**: `dev-w0-week2-round6-w1-hardguards.md` / `research-5-30-ng3-decision-prep.md` / `marketing-portfolio-narrative-section-4-10.md` / `marketing-technical-deep-dive-vol1.md`

---

## §4 事前読了対象資料 5 件（縮約版、全部読まなくても会議参加可能）

Owner および各部署リーダーが 5/8 18:00 開会前までに必ず目を通しておくべき 5 件。所要読込時間 = 約 30 分（Owner: 20 分、リーダー: 45 分）。

| 順 | ファイル | 読込時間 | 重点章 |
|---|---|---|---|
| 1 | 本書 §0 Owner 5/4 先行承認エビデンス + §2.1 議決一覧 3 層分類 | 5 分 | 16 件先行承認の構造化記録 |
| 2 | `secretary-agenda-v7.md` | 5 分 | §0 v6→v7 差分 / §6.2 議決-20〜24 詳細（議決-25 は本書 §5 参照） |
| 3 | `ceo-owner-consolidated-v9.md` | 7 分 | §1 エグゼクティブサマリ / §3 CEO 統合判断 / §7 Owner 確認事項 |
| 4 | 本書 §5 Quick reference card（議決-20〜25、6 件）| 5 分 | 60 字以内サマリ × 6 件 |
| 5 | 本書 §8 Owner Q&A 想定 12 件 | 8 分 | Owner 即決判断材料の事前把握（議決-25 含む） |

**Owner が時間が取れない場合の最短経路**: 本書 §1 表紙 → §0 5/4 先行承認エビデンス → §2.1 議決一覧 (層 C 5 件 = 議決-2/5/7/21/23 のみ重点) → §5 Quick reference card 議決-20〜25 → §8 Q&A 想定 = **約 12 分**で 5/8 議事の全骨子を把握可能。

---

## §5 議決-20〜25 Quick reference card（Owner 即決判断用、各 60 字以内サマリ、議決-25 追加）

### 議決-20: PM 月次予算 v2（$430/月構造）正式採用 [層 B、Owner 5/4 先行承認済]

> 月次総コスト = 既契約 subscription $400 + API ≤$30 + インフラ $0 = ≤$430/月。DEC-019-016 上限 $300 の充当率 10%、余裕率 90%。tracker SOP（cron 15min + EOD 23:55）運用化。**CEO 推奨 YES**。

### 議決-21: Risk Register v3.1（21 件）正式採用 [層 C、5/8 当日議論]

> v3 17 件 → v3.1 21 件。新規 4 件（R-019-19 cap 突破 / R-019-20 二重防御 drift / R-019-21 subscription→API fallback / R-019-22 mock 遅延）+ R-019-09 緑化（12→6）。重点監視 7→9 件。**CEO 推奨 YES**、議論 7 分配分。

### 議決-22: 既存 5 reports 差分修正 正式採用 [層 A、Owner 5/4 先行承認済]

> drill-3 シナリオ / test-strategy 補足 / R-019-15 mitigation v2 / pre-phase1 readiness / risk-register v2 の 5 件を $30 cap 反映で修正、5/16 朝までに Review 部門が v2 系列発行。**CEO 推奨 YES**。

### 議決-23: mock-claude 70% 化 SOP + Anthropic Console 同期チェック SOP 正式採用 [層 C、5/8 当日議論]

> (A) drill #3 mock 70% 化（E ベクトル canned 50 種 + TimeSource decoupling、$5-10→$3-5）/ (B) Console Hard $30 と cost-monitor.ts cap value の月次同期 SOP（drift 防止）。5/22 完遂。**CEO 推奨 YES**、議論 7 分配分。

### 議決-24: DEC-019-051 = subscription plan 主軸方針 Phase 1 正式採用 [層 A、Owner 5/4 先行承認済]

> 流量比 subscription 95% / API 5%。5 必須施策（mock-claude / HITL テンプレ / E2E staging / ナレッジ batch / drill 簡易化）で API $19-31→$11-15 圧縮。確度 +2% 全帯。DEC-019-006 P-D 改 維持。**CEO 推奨 YES**。

### **議決-25 (v9 追加): DEC-019-052 バンドル一括採択** [層 A、Owner 5/4 先行承認済]

> Marketing **tone B 主軸** + portfolio 枠 **C 両方併用**（`/case-studies/openclaw-runtime` + `/works/clawbridge/technical-deep-dive` 6 本連載）+ **公開時刻 6/27 09:00 JST** + **Channel 3** (Zenn 主軸 + note サブ)。Round 5/6 で portfolio Section 1-10 + technical-deep-dive vol 1 + X thread 草稿完備、6/22-26 段階 1-3 期間が「実装と差替のみ」化。**CEO 推奨 YES**。

---

## §6 Risk Register v3.1 サマリ（21 件 1 行表、変更なし）

| ID | 名称（1 行） | 色 | スコア | 担当 | 重点監視 |
|---|---|---|---|---|---|
| R-019-01 | Tauri 脆弱性 / supply chain | 黄 | 8 | Dev | — |
| R-019-02 | OpenClaw 上流崩壊 | 黄 | 10 | Research | — |
| R-019-03 | Anthropic ToS 改定 | 黄 | 12 | Research | 週次 |
| R-019-04 | Tauri / Rust skill gap | 黄 | 6 | Dev | — |
| R-019-05 | macOS Notarization 失敗 | 黄 | 8 | Dev | — |
| R-019-06 | Anthropic BAN | 黄 | 10 | CEO + Review | — |
| R-019-07 | Codex agent_session DEPRECATED | 黄 | 12 | Dev | — |
| R-019-08 | LangSmith / OpenTelemetry コスト | 緑 | 6 | Dev | — |
| R-019-09 | コスト爆発（NG-3 24/7 監視）★再評価 | 緑 | 6 | Dev + CEO | — |
| R-019-10 | 重要 13 領域 ToS 違反 | 黄 | 10 | Research + Review | — |
| R-019-11 | Codex OSS ライセンス | 緑 | 6 | Research | — |
| R-019-12 | OpenClaw 上流戦略後退 | 黄 | 6 | Research | — |
| R-019-12-A | OpenClaw API breaking change | 赤 | 16 | Research + Dev | 週次 |
| R-019-12-B | OpenClaw timeout / hang | 黄 | 9 | Dev | — |
| R-019-12-C | Anthropic stream-json schema breaking | 黄 | 8 | Dev + Research | — |
| R-019-13 | 提案承認率 < 30% | 黄 | 9 | PM + Marketing | 週次 |
| R-019-14 | 権限 UI 設定ミス | 黄 | 9 | Dev + Owner | 週次 |
| R-019-15 | Privilege Escalation 攻撃 | 赤 | 15 | Review + Dev | 週次 |
| R-019-16 | ナレッジ PII 漏洩 | 黄 | 9 | Dev + Review | 月次 |
| R-019-19★新 | API $30 Hard cap 突破時 Phase 1 中断 | 黄 | 10 | PM + Review | 週次 |
| R-019-20★新 | アプリ層×Console 二重防御 drift | 緑 | 6 | Review | 月次 |
| R-019-21★新 | subscription quota 突破時 API fallback 急速消費 | 黄 | 8 | Review + Research | 週次 |
| R-019-22★新 | mock/template 遅延で API 消費膨張 | 緑 | 6 | Research | — |

**色別**: 赤 2 件 / 黄 14 件 / 緑 5 件 = **21 件**
**重点監視**: 9 件（v3 7 件 → v3.1 9 件、+R-019-19/21）

---

## §7 確度 dashboard（Round 5/6/7 累積）

### §7.1 マイルストン確度（v9 確定値、Round 7 終了時想定）

| マイルストン | 起点 | DEC-019-050 採択前 | v7 (DEC-019-051 採択後) | Round 5 後 | Round 6 後 | **v9 (Round 7 終了時想定)** | 累積差分 |
|---|---|---|---|---|---|---|---|
| 5/22 scaffold 完全承認確度 | 78% | 80% | 82% | 96% | 97% | **97%** | **+19%** |
| 5/26 Phase 1 着手 Conditional Go 達成確率 | 80% | 84% | 86% | 92% | 93% | **93%** | **+13%** |
| 6/20 Phase 1 完了 sign-off 確度 | 73% | 75% | 77% | 82% | 83% | **83%** | **+10%** |
| 6/27 公開遵守確度 | 70% | 73% | 75% | 81% | 82% | **82%** | **+12%** |
| Day-0 readiness | 95% | 97% | 99% | 99% | 99% | **99%** | **+4%** |

### §7.2 確度トレンド読解

- **5/22（W0-Week2 末）**: 97% — Phase 1 着手 scaffold 完全承認の見込み、5 必須施策 完遂判定（mock 70% 化検収）。
- **5/26（Phase 1 W1 開始）**: 93% — Conditional Go 3 条件達成見込み、Phase 1 公式キックオフ。**Round 6 G-01〜G-08 前倒しで「実装検証済の状態で開始」可能化**。
- **6/20（Phase 1 完了）**: 83% — 全 KPI 達成（subscription 95% / API ≤$15 / mock 70% / 議決-20〜25 全採択）見込み。
- **6/27 朝 09:00 JST（Marketing 公開）**: 82% — Round 5/6 で portfolio Section 1-10 + technical-deep-dive vol 1 + X thread 草稿完備で「実装と差替のみ」化。
- **Day-0**: 99% — Anthropic Console + 1Password + Slack 設定完了済み（Owner setup 5/3 既完了）。

### §7.3 確度押下げトリガー（要監視、変更なし）

| トリガー | 確度影響 | 検知方法 |
|---|---|---|
| W0-Week2 mock 化進捗 < 50%（5/15 時点）| 5/22 −5% | Dev daily standup |
| 議決-20〜25 のいずれかが NO 採択（特に層 C 5 件） | 5/26 −10% | 5/8 議事録 |
| R-019-12-A breaking 発火 | 6/20 −15% | contract test 失敗 |
| R-019-15 Pen Test #2 critical 検出 | 6/20 −10% | Review pentest report |

---

## §8 Owner Q&A 想定 12 件 + CEO 回答案（議決-25 + 5/4 先行承認 関連 2 件追加）

### Q1: 月次総コスト $430 は固定費 $400 を含めるべきか？ [議決-20]

**CEO 回答案**: subscription $400 は既契約のため追加発生はゼロですが、月次総コスト透明化のため明示構造化する判断（議決-20）。会計区分上は (A) 既契約固定費 と (B) 新規発生 ≤$30 を分離記録、Owner 月次レポートでも 2 行表示。

### Q2: $30 cap が枯渇したら Phase 1 は中断するか？ [議決-21]

**CEO 回答案**: アプリ層三段階 guard（warn$24 / auto_stop$28.5 / hard_fail$30）+ Console Hard $30 物理停止の二重防御で枯渇確率は near-zero。万一発火時は subscription only fallback 手順（PM v3 §9.3、5/22 完遂予定）で Phase 1 継続。R-019-19 黄として週次監視。

### Q3: subscription quota 突破時の対処は？ [議決-21]

**CEO 回答案**: R-019-21（黄）として subscription only fallback 禁止方針を SOP 化。HITL Gate で pause → Owner 判断 → 別 DEC で API 増額（または Phase 1 一時中断）判定。70% 到達時に Owner 通知、自動 fallback は disabled。

### Q4: mock 70% 化が 5/22 に間に合わない場合は？ [議決-23]

**CEO 回答案**: R-019-22（緑）。Dev W0-Week2 SP 配分集中化 + Review 早期 acceptance criteria（5/9 朝）で予防。万一遅延時は drill #3 を 5/24 リハで実 API 30% に縮退、5/29 公式へ持ち越し（Phase 1 着手 5/26 への影響なし）。

### Q5: Anthropic Console と app 層の cap 値が drift したら？ [議決-23]

**CEO 回答案**: R-019-20（緑、議決-23 の同期 SOP で防止）。月次同期チェックで Console screenshot + コード値突合、drift 検知時は Dev 24h hotfix（SLA）。Phase 1 期間 4 週間で同期点 1〜2 回。

### Q6: Phase 2 で cap 増額する場合の判断ルートは？

**CEO 回答案**: 8/1 Phase 2 計画書起案時に別 DEC で増額判断（CEO 統合報告 §9.1 #5、PM Phase 2 拡張余地 $270/月）。HITL +200% / KE-04 +500% / Pen Test 自動化を試算根拠に Owner 決裁。本会議では取り扱わず。

### Q7: 議決-24 subscription 主軸は P-A 直叩きより本当に優位か？ [議決-24]

**CEO 回答案**: Research 比較で $30 cap 配下では P-A 直叩きは 1-3 日で枯渇 = Phase 1 機能不能。subscription（Claude Max $200）= 95% 流量 + API（≤$30）= 5% 補助の構造優位は cap 縮小で**逆に拡大**（research-subscription-mainline-validation §4 結論）。上流 OpenClaw / Anthropic 双方の personal/consumer pivot は subscription 経路の安定性を**向上**させる。

### Q8: Risk ID 重複統合は混乱しないか？ [議決-21]

**CEO 回答案**: PM/Review/Research の 5 提案 → CEO 統合判定で 4 件採番（R-019-19/20/21/22）。元提案の内容 100% 一致部分を統合、Owner sign-off 時点で混乱なし。Risk Register v3.1 §0.2 に統合経緯メモを記載済み（責任ある設計の証左）。

### Q9: 議決 21 件全件 YES 採択時の 5/26 Phase 1 着手は確実か？ [議決-2]

**CEO 回答案**: 確率 **93%**（Round 6 G-01〜G-08 前倒しで +7%）。Conditional Go 3 条件（P-UI-01〜09 完遂 / drill #3 計画承認 / Review 維持判定）+ 5 必須施策 完遂前提。1 条件でも欠ければ 6/2 に 1 週間追加延期 + 5/8 再判定。会議内で進捗を §3 にて確認。

### Q10: Owner 工数は ≤週10h を維持できるか？

**CEO 回答案**: W0-Week2 drill 週 max **7.35h / 週**（充当率 74%、余裕 26%）、非 drill 週 **4.35h / 週**（充当率 44%）。W1〜W4 は 3〜5h / 週（Round 6 効果で W1/W2 で計 3h 圧縮可能）。Phase 1 全期間で ≤週10h 維持確認済（PM v3 §9）。HITL Gate 集中期（W3 KE-01〜03 設計 review）に +1h 想定。

### **Q11 (v9 追加): 議決-25 (DEC-019-052) の 6/27 朝 09:00 JST 公開は確実か？** [議決-25]

**CEO 回答案**: 確率 **82%**（Round 5/6 で portfolio Section 1-10 + technical-deep-dive vol 1 + X thread 全 4 リソース草稿完備）。6/22-26 期間が「実装と差替のみ」に純化、Web-Ops + Marketing + Review の段階 1-3 4 段階公開フローで 6/27 09:00 JST 公開を担保。X thread Engagement window + Vercel deploy 7:00 → 確認 8:00 → SNS 投稿 9:00 リズム確立。

### **Q12 (v9 追加): 5/4 先行承認 16 件は本当に Owner 即決相当か？** [DEC-019-054]

**CEO 回答案**: Round 6 完遂報告（commit `93f3ba2`、19 files / 3,066 insertions、G-01〜G-08 前倒し + Marketing portfolio Section 4-10 + technical-deep-dive vol 1 完遂）受領後、CEO が「Owner 5/8 検収会議所要時間 90-105 分を 35-45 分に短縮するためのオプション提示」を実施 → Owner 即決「オプション 1 で進めて」受領。CEO 起票 DEC-019-054 として 2026-05-04 深夜 decisions.md 追加予定（Round 7 commit 時）。5/8 当日は層 A 11 件 = 採決報告 + sign-off スタンプ / 層 B 5 件 = 補足質疑 + sign-off で通過、Owner 異議受付は層 C 5 件議論前に 5/7 EOD 配布から 5/8 開会までの間に随時受付。

---

## §9 議事進行 timeline（35-45 分の分単位スケジュール、v7 90-105 分から大幅短縮）

### §9.1 標準運用（実議事 35 分）

| 時刻 | 経過 | § | 議題 | 担当 | 主動作 |
|---|---|---|---|---|---|
| 18:00 | 0 分 | §1 | 開催情報確認 | CEO | 出席確認 / 配布物確認 / 議事録テンプレ v4 起動 |
| 18:01 | 1 分 | §2 | W0-Week1 進捗報告 + Round 5/6 完遂報告 | 5 部署 | Dev/Research/PM/Mkt/Review 各部署口頭サマリ (各 1 分) |
| 18:06 | 6 分 | §6 | 層 A 11 件採決報告 + sign-off スタンプ | CEO | 議決-1, 6, 9, 11, 12, 13, 14, 15, 22, 24, 25 各 0.2 分 (計 2.2 分) |
| 18:08 | 8 分 | §6 | 層 B 5 件補足質疑 + sign-off | CEO | 議決-3, 4, 8, 10, 20 各 0.5 分 (計 2.5 分) |
| 18:11 | 11 分 | §6 | 層 C 議決-2 議論 + 採決 | CEO + PM | Phase 1 着手 Conditional Go (5 分) |
| 18:16 | 16 分 | §6 | 層 C 議決-5 議論 + 採決 | CEO + PM + Review | 必須コントロール 50 項目 (5 分) |
| 18:21 | 21 分 | §6 | 層 C 議決-7 議論 + 採決 | CEO + Review | BAN drill #3 計画 (5 分) |
| 18:26 | 26 分 | §6 | 層 C 議決-21 議論 + 採決 | CEO + Review + PM + Research | Risk Register v3.1 (7 分) |
| 18:33 | 33 分 | §6 | 層 C 議決-23 議論 + 採決 | CEO + Review + Dev | mock 70% 化 + Console 同期 SOP (7 分) |
| 18:40 | 40 分 | §7 | 質疑応答 | Owner + 全部署 | 議決全体への横断質疑 + Owner 追加要望受付 (5 分) |
| 18:43 | 43 分 | §8 | 締め | CEO + 秘書 | 議決サマリ / 5/30 W2 終了時会議予告 / CB-CEO-W3-01 / 議事録配布 (2 分) |
| 18:45 | 45 分 | — | 終了宣言 | CEO | — |

### §9.2 余裕運用（実議事 45 分、層 C 5 件で各 +2 分余裕時）

- 層 C 5 件議論を各 7 分（議決-2/5/7 = 7 分 / 議決-21/23 = 7 分維持）→ 計 35 分で消化
- §7 質疑応答 5 分維持
- 終了時刻 = 18:45 想定

### §9.3 タイムキーピング

- 秘書部門が 5 分単位で残り時間を Slack `#prj019-meeting` にアナウンス
- 層 A/B 議題超過時（各 0.2/0.5 分超）は CEO が「持ち越し」or「投票委任」を即決
- 層 C 5 件の超過時は CEO 推奨 YES 即決（異議受付 30 秒）

---

## §10 配布日 + 配布方法

### §10.1 配布日

| イベント | 日時 | 状態 |
|---|---|---|
| パッケージ最終化（本書 v9） | 2026-05-04 深夜 | **完了**（本日 Round 7） |
| 9 ファイル一括配布 | 2026-05-07 EOD（22:00 JST） | 予定 |
| 配布完了確認 | 2026-05-07 23:00 JST | 予定 |
| Owner 事前読了 | 2026-05-08 12:00 JST | 推奨 |
| 検収会議開会 | 2026-05-08 18:00 JST | 確定 |

### §10.2 配布方法

1. **Slack DM**（主要経路）:
   - `#prj019-meeting` channel に 9 ファイルパッケージリンクを post
   - Owner / CEO / 全部署リーダー 9 名に DM で個別通知（受領確認返信を 5/7 23:00 までに収集）
2. **1Password Vault**（バックアップ経路）:
   - PRJ-019 vault に 9 ファイルを store（TOTP 二要素認証必須、議決-12 既決）
   - 5/8 当日の参照経路としても運用
3. **Slack `#prj019-monitor`**（議事用 channel）:
   - 5/8 17:30 に開会前リマインダー post（チェックリスト §5/§6 連動）
   - 5/8 18:00 開会時に議事録テンプレ v4 起動通知

### §10.3 配布前最終確認（5/7 EOD まで）

- [ ] 本書 §3 の 9 ファイルすべて存在確認（`projects/PRJ-019/reports/` 配下）
- [ ] 議決-1〜25 のうち 21 件番号整合性確認（議題 v7+v9 / 本書 §2.1 / 議事録テンプレ v4 で一致）
- [ ] CEO 推奨 = YES 全件確認（5/8 当日のブレ防止）
- [ ] Owner 事前回答テンプレ（cover letter v3 §6）配布済確認
- [ ] 1Password Vault PRJ-019 への 9 ファイル store 完了
- [ ] **DEC-019-054 起票文 decisions.md 反映確認（CEO 統合判断 commit 後）**
- [ ] **3 層分類整合確認（層 A 11 / 層 B 5 / 層 C 5 = 21 件）**

---

## §11 Round 5/6/7 完遂状況 + Phase 1 W1 着手即時化エビデンス（v9 新規追加）

### §11.1 Round 5 完遂（commit `9bc1629`、9 files / 1,719 insertions）

| 部署 | 成果 | LoC |
|---|---|---|
| Dev | `verify-zero-side-effect.sh` (DEC-019-007 自動検証) + `wrapper.ts` factory pattern + `workflow-yaml.test.ts` (DEC-019-053 永続検証) | 432 行 + 14 new tests pass |
| Research | `research-w0-week2-round5-ng3-baseline.md` (NG-3 12/16/24h × A/B/C 9 マトリクス + CEO 推奨案 B 16h/$100/$500) | 308 行 |
| Marketing | `marketing-portfolio-narrative-section-1-3.md` (B 主軸 + C 補助 hard tone 草稿) + `marketing-launch-x-thread-draft.md` (X thread teaser + 5 launch posts) | 738 行 |

### §11.2 Round 6 完遂（commit `93f3ba2`、19 files / 3,066 insertions + CEO hotfix）

| 部署 | 成果 | LoC |
|---|---|---|
| Dev | G-01 (spawn 副作用ゼロ 3 軸) + G-04 (cost watchdog 三段階 $24/$28.5/$30) + G-05+G-06 (kill-chain) + G-08 (preflight CI fail-fast) + CEO hotfix `--scope=workflow` 7 fields | 3,066 行 + 36 new tests (75→111) |
| Research | `research-5-30-ng3-decision-prep.md` (5/30 議決準備 + 一次資料 8 件 + Q&A 10 件 + 否決時 fallback) | 388 行 |
| Marketing | `marketing-portfolio-narrative-section-4-10.md` (Section 4-10 + §11 自己検証 B/C/A 7/7/7) + `marketing-technical-deep-dive-vol1.md` (Zenn/note frontmatter + §2.1〜2.11 アーキ) | 1,084 行 |

### §11.3 Round 7 起動中（PM + 秘書 統合、本書 staged）

| 部署 | 成果 | 状態 |
|---|---|---|
| PM | `pm-cross-ref-final-v8.md` (Round 1/5/6/7 = 41 件 cross-ref final 監査) + `pm-phase1-plan-v3.md` (W1 ハードガード前倒し済反映) | **staged 中** |
| 秘書 | 本書 (`secretary-5-8-meeting-package-v9.md`) + `secretary-w0-week1-meeting-minutes-template-v4.md` + `dashboard/active-projects.md` PRJ-019 行 | **staged 中** |

### §11.4 Phase 1 W1 着手即時化エビデンス

- W1 ハードガード G-01/04/05/06/08 前倒し完遂で W1 5/19-23 SP 圧縮効果 = **12.5d**（W1 全期間 25d の **50%**）
- Round 5 prefetch 4 件で W4 副作用ゼロ証明 + W1 wrapper.ts factory 利用即時化
- Marketing portfolio Section 1-10 + technical-deep-dive vol 1 + X thread 草稿完備で 6/22-26 段階 1-3 期間が「実装と差替のみ」に純化
- Research 5/30 NG-3 議決準備完了で 5/30 議事時間 30 → 10 分に圧縮可能

---

## §12 関連資料

- 議題 v7: `secretary-agenda-v7.md`
- 議決-1〜15 詳細: `secretary-agenda-v6-resolutions-15.md`
- Risk Register v3.1: `secretary-risk-register-v3-1.md`
- CEO 連結報告 v9: `ceo-owner-consolidated-v9.md`
- Phase 1 計画 v3: `pm-phase1-plan-v3.md`
- PM cross-ref final v8: `pm-cross-ref-final-v8.md`
- 議事録テンプレ v4: `secretary-w0-week1-meeting-minutes-template-v4.md`
- 開会前チェックリスト: `secretary-5-8-pre-meeting-checklist.md`
- 配布カバーレター v3: `secretary-cover-letter-v3.md`
- Round 5 deliverables (Dev / Research / Marketing 4 件)
- Round 6 deliverables (Dev / Research / Marketing 6 件 + CEO hotfix)

---

## フッタ

- 文書: `projects/PRJ-019/reports/secretary-5-8-meeting-package-v9.md`
- 版: v9 (2026-05-04 深夜、Round 7 起動時)
- 起案: 秘書部門
- 検収: Owner（5/7 EOD 配布 → 5/8 18:00 検収会議で議決-1〜25 のうち 21 件採択、層 A+B 16 件先行承認 + 層 C 5 件議論）
- 次回更新: 2026-05-08 W0-Week1 検収会議後（採択結果反映 + 議事録 v1.0 発行 + DEC-019-054 公式採択スタンプ）
