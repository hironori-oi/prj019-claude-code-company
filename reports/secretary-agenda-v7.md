最終更新: 2026-05-04 / 起案: 秘書部門 / 配布期限: 5/7 22:00

# PRJ-019 W0-Week1 検収会議 議題 v7（2026-05-08）

- 案件: PRJ-019「Clawbridge」 — Open Claw を Owner-in-the-loop オーナーとする AI 組織ハーネス基盤
- 文書種別: 検収会議議題（v6 → v7 改訂版、DEC-019-050/-051 統合反映）
- 根拠: DEC-019-014〜020 / DEC-019-031〜036 / **DEC-019-050（$30/月 API Hard cap 採択）** / **DEC-019-051（subscription 主軸方針 Phase 1 正式採用）** / `reports/ceo-owner-consolidated-v7.md` §3〜§4
- 配布: 5/7 22:00 までに Owner / 全部署リーダーへ送付（事前合意 24h 確保）
- 関連添付: `secretary-agenda-v6-resolutions-15.md`（議決-1〜15 詳細）/ `secretary-risk-register-v3-1.md`（Risk Register v3.1 = 21 件）/ `ceo-owner-consolidated-v7.md`（CEO 連結報告 v7）/ 4 部署成果物（PM v2 / Dev guard / Review cap impact / Research subscription validation）

---

## §0 v6 → v7 主要差分サマリー

| # | 区分 | v6 | v7 | 根拠 |
|---|---|---|---|---|
| 1 | 議決事項総数 | 15 件 | **20 件**（+5） | DEC-019-050/-051 採択 + 4 部署並列発注成果統合により議決-20〜24 を新設 |
| 2 | 所要時間（実議事） | 120 分 | **90〜105 分（圧縮再均衡）** | §2 進捗 −5 / §5 PM −7 / §7 質疑 +5 / §6 議決枠 +10〜25（議決-20〜24 配分） |
| 3 | §6 議決事項一覧 | 15 件 / 13 分 | **20 件 / 28〜35 分** | 議決-20〜24 を 5〜7 分配分（重要度高、subscription 主軸 = Phase 1 構造変更）|
| 4 | §3 Owner-in-the-loop | 25 分 | **20 分（−5）**（Conditional Go 3 条件は §6 議決-2 に統合）| 重複削減 |
| 5 | §5 PM 議題 | 42 分 | **35 分（−7）**（PM v2 = 議決-20 単独枠化、PM v4 公式承認は §5.1 維持）| 構造再編 |
| 6 | §2 W0-Week1 進捗報告 | 15 分 | **10 分（−5）** | 4 部署成果物を事前資料配布で短縮 |
| 7 | §7 質疑応答 | 10 分 | **15 分（+5）** | 議決 20 件全体 + Phase 1 月次予算 ≤$430 構造への質疑吸収 |
| 8 | §8 締め | 5 分 | **5 分（不変）** | — |
| 9 | 既存議決-2/-3/-7/-8 への影響 | — | **条件付き YES 維持 + 補注追加** | $30 cap 確度上昇 + 第 6 補助層 cap 注記 |

**v6 → v7 差分件数: 9 件**（議決 +5、§2/§3/§5/§6/§7 時間変更 5 件、既存議決-2/-3/-7/-8 への補注 1 件、合計 11 変更点 → 主要差分 9 件として整理）

---

## §1 開催情報

| 項目 | 内容 |
|---|---|
| 日時 | 2026-05-08（金）18:00〜20:00 JST（最大 120 分枠、実議事 90〜105 分想定）|
| 所要時間 | **90〜105 分**（議決 20 件、超過時は §7 質疑応答を圧縮）|
| 形式 | オンライン（Zoom）+ 議事録同期取得 |
| 出席者 | Owner（議決権者）、CEO（議事進行）、PM 部門、Dev 部門、Research 部門、Marketing 部門、Review 部門、秘書部門（議事録）|
| 議事進行 | CEO |
| 議事録 | 秘書部門（リアルタイム記録、終了 24h 以内に配布）|
| 採決方式 | 議決 1〜20 を逐次、Owner 最終承認、CEO 推奨案提示後に賛否確認 |
| 配布資料 | 本議題 v7 + 議決 15 件詳細（v6 添付）+ Risk Register v3.1 + CEO 連結報告 v7 + 4 部署成果物 |
| 事前回答期限 | 5/7 22:00（議決 1〜20 賛成 / 反対 / 保留）|

---

## §2 W0-Week1 進捗報告（10 分、−5 分削減）

事前資料配布前提、各部署口頭サマリーのみ。4 部署並列発注成果（5/4 発行）も §6 議決-20〜24 で個別議決のため §2 では概要のみ。

| § | 部署 | 時間 | 内容 |
|---|---|---|---|
| §2.1 | Dev | 3 分 | W0-Week1 完成（67→95 tests 緑、claude-bridge 4 src、scenario-smoke、TimeSource pattern）+ W0-Week2 前倒し成果（dev-w0-week2-prop-gen-and-dashboard.md 1,910 行）+ **5/4 budget guard 9 deliverables（DEC-019-050 採択用）** |
| §2.2 | Research | 2 分 | DEC-019-022 changelog Runbook v1.0 + 3 レポート（P-D 改 / Issue ops / personal AI assistant pivot）+ **5/4 subscription mainline validation（326 行、DEC-019-051 起票根拠）** |
| §2.3 | PM | 2 分 | PM v4 マスタープラン完成 + **5/4 月次予算 v2（3 deliverables / 1,013 行、$430/月構造）** |
| §2.4 | Marketing | 1 分 | Heading A 補強表記 A1 採用提案、Launch Runbook 6/27 朝公開暫定 |
| §2.5 | Review | 2 分 | Conditional Go 3 条件、R-019-15 priviledge escalation 赤格付け、BAN drill #3 計画 + **5/4 $30 cap impact assessment（条件付採択、R-019-09 緑化）** |

---

## §3 Owner-in-the-loop Phase 1 Go/NoGo 議決（20 分、−5 分圧縮）

DEC-019-033 5 点統合採用の最終確認。Conditional Go 3 条件 → §6 議決-2 に統合済（重複削減）。

| § | 議題 | 時間 | 内容 |
|---|---|---|---|
| §3.1 | DEC-019-033 5 点統合の効力確認 | 5 分 | ① 提案生成→承認 2 段階 / ② HITL 第 9 種 / ③ 透明性 Dashboard / ④ ナレッジ抽出 / ⑤ 権限管理 UI |
| §3.2 | 必須コントロール 50 項目（既存 34 + DEC-019-033 追加 16）採用 | 4 分 | P-UI-01〜10 / KE-01〜04 / HITL-9〜11 |
| §3.3 | 月次コスト統合試算（**v7 改訂: $430/月構造**）| 4 分 | (A) subscription $400 + (B) API ≤$30 + (C) インフラ $0、DEC-019-016 充当率 10%、余裕率 90% |
| §3.4 | R-019-13〜16 + R-019-19〜22 リスク登録（赤 1 / 黄 ＋ / 緑 ＋）| 4 分 | Risk Register v3.1 概要、詳細は §6 議決-21 |
| §3.5 | Conditional Go 採用決議（議決-2 への先行合意）| 3 分 | 1 条件でも欠けた場合は 6/2 に追加延期、5/8 再判定 |

---

## §4 BAN drill #1 振り返り + #3 計画（18 分、不変）

drill #1（5/4 完了）+ drill #2（5/8 当日除外）+ drill #3（5/29 新規計画）の三段運用。

| § | 議題 | 時間 | 内容 |
|---|---|---|---|
| §4.1 | drill #1 振り返り（5/4 実施）| 8 分 | 5 シナリオ全 Pass、退避 SOP 動作、Sumi/Asagi 巻き添え影響ゼロ確認 |
| §4.2 | drill #2 当日除外判断 | 2 分 | DEC-019-031 既決事項、live CI 除外確定 |
| §4.3 | drill #3（5/29）計画承認 | 8 分 | 攻撃シナリオ 5 種（PE-01/03/04/06/08）= priviledge escalation 防御検証、**v7 補注: $30 cap 配下で mock 70% 化必須（議決-23 連動）** |

---

## §5 PM 議題（35 分、−7 分圧縮）

PM v2（議決-20）は §6 単独議決枠化により §5 から分離、PM v4 公式承認 + 既存議題は §5 維持。

| § | 議題 | 時間 | 内容 |
|---|---|---|---|
| §5.1 | PM v4 公式承認 | 6 分 | v3→v4 5 反映（HITL-9/10 統合、Vercel Pro 検討、HITL-6 統合、G-Top 配分、HITL-11 追加）|
| §5.2 | DEC-019-021〜024 再確認 | 5 分 | R-019-12 再格付け / 4 系統 changelog / Vercel Cron 設計 / Hobby→Pro 判断ルート |
| §5.3 | CB-CEO-W3-01 決裁テンプレ | 6 分 | 6/3 三件同時判断（Vercel 昇格 + NG-3 Stage 移行 + Codex 6/1 移行確認）|
| §5.4 | Marketing Runbook プレビュー | 3 分 | 6/27 朝公開暫定、Heading A 補強表記、プレス見出し |
| §5.5 | §5(d'+ε) 透明性 Dashboard + 権限 UI 統合方針 | 10 分 | PRJ-020 ClawDialog 同居実装、Supabase `policy_versions` / `policy_audit_log` 設計、kill switch SSE / 異常検知 4 条件 / hot-reload 60s |
| §5.6 | KPI 提案承認率 ≥ 30% + TR-4 ジャンル切替 | 5 分 | 単一指標化、月次 monitor、< 30% 持続時のジャンル切替トリガー |

---

## §6 議決事項一覧（28〜35 分、議決-20〜24 新設で大幅拡大）

20 議決を逐次採決。各議決 0.5〜7.0 分（CEO 推奨先行 + 賛否確認）。詳細は `secretary-agenda-v6-resolutions-15.md` 参照（議決-1〜15）+ 本書 §6.2（議決-16〜20、ただし v7 で番号は議決-20〜24 に確定）。

### §6.1 議決-1〜15（v6 既存、CEO 推奨 YES 全件、補注追加）

| ID | 議決名 | 起案 | CEO 推奨 | 想定時間 | $30 cap 影響補注 |
|---|---|---|---|---|---|
| 議決-1 | DEC-019-033 5 点統合採用 | CEO | YES | 1.0 分 | — |
| 議決-2 | Phase 1 着手 5/26 Conditional Go（3 条件付き）| PM | YES | 1.0 分 | **確度 84→86%（+2%）に上昇、YES 維持** |
| 議決-3 | Phase 1 完了 6/20 + Marketing 公開 6/27 朝 | PM | YES | 0.5 分 | **scaffold 確度 80→82%、YES 維持** |
| 議決-4 | KPI 提案承認率 ≥ 30% + TR-4 ジャンル切替 | PM | YES | 1.0 分 | — |
| 議決-5 | 必須コントロール 50 項目採用 | PM + Review | YES | 1.0 分 | — |
| 議決-6 | HITL 第 9・10・11 種正式追加 | Dev + Review | YES | 1.0 分 | — |
| 議決-7 | BAN drill #3（5/29）実施承認 | Review | YES | 1.0 分 | **mock 70% 化条件付き、議決-23 連動、YES + 条件追記** |
| 議決-8 | R-019-15 priviledge escalation 赤格付け公式化 | Review | YES | 0.5 分 | **第 6 補助層 cap 物理停止注記追加（cap 独立で +5% 緩和）** |
| 議決-9 | Heading A 補強表記 A1 採用 | Marketing | YES | 0.5 分 | — |
| 議決-10 | Dev 2 名体制 Phase 1 全期間確保 | PM + Review | YES | 1.0 分 | — |
| 議決-11 | 外部 policy import 機能 Phase 1 完全無効化 | Review | YES | 0.5 分 | — |
| 議決-12 | 1Password TOTP Owner 二要素認証採用 | Review | YES | 0.5 分 | — |
| 議決-13 | DEC-019-034 P-D 改 維持 + 微修正 C-OC-06/07/08 採択 | Research | YES | 1.0 分 | — |
| 議決-14 | DEC-019-035 Issue/changelog 監視運用 SOP 採択（月 $0）| Research | YES | 1.0 分 | — |
| 議決-15 | DEC-019-036 上流 pivot に伴う Phase 2 機能候補 3 件登録 | Research | YES | 1.5 分 | — |

**小計**: 13.0 分（議決-1〜15）

### §6.2 議決-20〜24（v7 新規追加、5 件）

#### 議決-20: PM 月次予算 v2（$430/月構造）正式採用

| 項目 | 内容 |
|---|---|
| **起案元** | PM 部門（pm-budget-v2-30usd-api-cap.md / pm-budget-v2-monthly-tracker-template.md / pm-budget-v2-related-decisions-impact.md = 計 1,013 行）|
| **議決内容（要旨）** | Phase 1 月次予算を v1（$300 ハードキャップ単一）から v2（subscription $400 + 新規 API ≤$30 + インフラ $0 = 総額 ≤$430）構造に正式変更する。DEC-019-016 充当率 10%、余裕率 90%、Phase 2 拡張余地 $270。daily/weekly/monthly tracker 雛形（cron 15min + EOD 23:55 JST）を運用化。|
| **CEO 推奨** | **YES 採択** |
| **期待 sign-off** | Owner 承認 → DEC-019-007/-012/-016 整合表確定、PM v4 → v2.2 上書き発令（5/6 朝期限）|
| **所要時間** | **6 分**（cost discipline + tracker SOP の重要度を考慮）|
| **採択時影響** | Phase 1 月次総コスト ≤$430（既契約 + ≤$30 + $0）、R-019-04 cost overrun 12（黄）→ 6（緑）、Phase 1 達成確率 +2% 全帯 |
| **反対意見想定 + 対処** | 「subscription $400 を月次予算に含めるべきでない（既契約のため）」→ 月次総コスト透明化のため明示構造化が CEO 統合判断、議決-23 同期チェック SOP で運用整合 / 「$430 は Phase 2 拡張時に不足」→ Phase 2 計画書起案時（8/1 想定）に別 DEC で増額判断（残存懸念 §9.1 #5 連動）|

#### 議決-21: Risk Register v3.1（R-019-19/20/21/22 新規 + R-019-09 12→6 緑化）正式採用

| 項目 | 内容 |
|---|---|
| **起案元** | Review 部門（review-30usd-cap-impact-assessment.md §5）+ PM 部門（pm-budget-v2 §9.1）+ Research 部門（research-subscription-mainline-validation §6）統合（CEO Risk ID 重複統合判定）|
| **議決内容（要旨）** | Risk Register を v3（17 件）→ v3.1（21 件）に拡張する。新規 4 件: R-019-19（API $30 Hard cap 突破時 Phase 1 中断、黄、PM+Review 統合）/ R-019-20（アプリ層×Console 二重防御 drift、緑、Review）/ R-019-21（subscription quota 突破時 API fallback 急速消費、黄、Review+Research 統合）/ R-019-22（mock/template 遅延で API 消費膨張、緑、Research、元 R-019-23 繰上）。R-019-09 NG-3 24/7 を 12（赤）→ 6（緑）に再評価（cap 縮小により 24/7 監視優先度緩和）。|
| **CEO 推奨** | **YES 採択** |
| **期待 sign-off** | Owner 承認 → Risk Register v3.1 公式化、5/9 朝までに秘書部門が `secretary-risk-register-v3-1.md` 配布実施 |
| **所要時間** | **7 分**（4 件新規 + 1 件再評価 + Risk ID 重複統合経緯説明 + Phase 1 W1〜W4 重点監視追加運用）|
| **採択時影響** | Risk Register v3.1（21 件、赤 2 / 黄 14 / 緑 5）、重点監視 7 件 → 9 件（R-019-19/21 追加）、確度 +2% 押上 |
| **反対意見想定 + 対処** | 「R-019-09 を緑化は早計（12→6 で 50% 緑化は急激）」→ Anthropic Console Hard $30 物理停止 + アプリ層三段階 guard で二重防御確立、24/7 監視必須性が下がったとの Review 評価 / 「R-019-19/21 統合は本来別リスク」→ 統合経緯メモを §6.2 議決時に提示、PM 元提案 = Review 元提案で内容 100% 一致のため統合判定 |

#### 議決-22: 既存 5 reports 差分修正（Review §6 で挙げられたもの）正式採用

| 項目 | 内容 |
|---|---|
| **起案元** | Review 部門（review-30usd-cap-impact-assessment.md §6 差分修正リスト）|
| **議決内容（要旨）** | $30 cap 採択に伴う既存 5 reports の差分修正を承認する: ① review-ban-drill-3-scenario.md（mock 70% 化必須化、$30 cap 配下記載追加）/ ② review-test-strategy-supplement.md（A/B/C/D TimeSource decoupling 追記）/ ③ review-r019-15-mitigation-plan-v2.md（第 6 補助層 cap 物理停止追記）/ ④ review-pre-phase1-readiness-assessment.md（確度 +2% 反映）/ ⑤ review-w0-week1-risk-register-v2.md（v3.1 への拡張通知）。修正期限 5/16 朝。|
| **CEO 推奨** | **YES 採択** |
| **期待 sign-off** | Owner 承認 → Review 部門 5/9 朝着手、5/16 朝までに 5 reports v2 系列を発行（v3.1 連携）|
| **所要時間** | **5 分**（5 reports 概要差分 + 修正期限確認、各 1 分）|
| **採択時影響** | Review 既存資料の cap 影響整合化、Conditional Go 3 採択条件のうち #1（議決-21/22/23 全採択）成立 |
| **反対意見想定 + 対処** | 「5 reports 修正は工数増」→ 各修正 1 ファイル平均 0.3 d、5 reports 計 1.5 d で吸収可能 / 「v3.1 への移行は v2 廃止か」→ v2 は archive、v2.1 系列で並行運用（議事録残存性確保）|

#### 議決-23: mock-claude 70% 化 SOP + Anthropic Console 同期チェック SOP 正式採用

| 項目 | 内容 |
|---|---|
| **起案元** | Review 部門（review-30usd-cap-impact-assessment.md §4 採択条件 #2/#3）+ Dev 部門（dev-budget-guard-30usd-v1.md §3）|
| **議決内容（要旨）** | 2 件の SOP を Phase 1 W0-Week2 末（5/22）までに策定 + 運用開始する: (A) **mock-claude 70% 化 SOP**（drill #3 実 API 消費を $5-10 → $3-5 に圧縮、E ベクトル canned response 50 種 + A/B/C/D TimeSource decoupling、Dev 担当）/ (B) **Anthropic Console（Hard $30 / Soft $25）+ アプリ層 cost-monitor.ts cap value の月次同期チェック SOP**（drift 防止、月次 1 回 PM + Dev 同席、Console screenshot + コード値突合、Dev + PM 共同担当）|
| **CEO 推奨** | **YES 採択** |
| **期待 sign-off** | Owner 承認 → Dev W0-Week2 タスク化（5/9 開始 / 5/22 完遂）、Review 部門 acceptance criteria 起案（5/9 朝期限）|
| **所要時間** | **5 分**（2 SOP 概要 + 期限確認 + acceptance criteria 体制説明）|
| **採択時影響** | drill #3 実 API 消費圧縮（cap $30 の 10-17%）、二重防御 drift 物理防止（R-019-20 緑化根拠）、Conditional Go 3 採択条件のうち #2/#3 成立 |
| **反対意見想定 + 対処** | 「mock 70% は実 API カバレッジ不足リスク」→ 5 シナリオのうち PE-01/03/04 = mock 100%、PE-06/08 = mock 70% + 実 API 30%（cost 配分最適化）、Review acceptance criteria で品質ガード / 「月次同期は頻度不足」→ Phase 1 期間 4 週間で月次 1 回 = 計 1〜2 回、drift 検知時は即時 hotfix（R-019-20 緑運用継続）|

#### 議決-24: DEC-019-051 = subscription plan 主軸方針 Phase 1 正式採用

| 項目 | 内容 |
|---|---|
| **起案元** | CEO + Research 部門（research-subscription-mainline-validation.md = 326 行、CEO 統合判断 ceo-owner-consolidated-v7.md §3）|
| **議決内容（要旨）** | Phase 1 運用方針として **subscription plan 主軸 + API 補助構造** を正式採用する。流量比 = subscription 95% / API 5%。月次総コスト構造 ≤$430（subscription $400 + API ≤$30 + infra $0）。5 必須施策（mock-claude フル活用 / HITL 通知テンプレ化 / E2E staging 限定 / ナレッジ batch caching / drill #3 簡易化）を Dev W0-Week2 内（5/9-5/22）完遂。期待効果: API 消費 $19-31/月 → $11-15/月（cap $30 内 buffer 50% 以上）。DEC-019-006 P-D 改 維持・強化（変更不要、cap 縮小は構造優位を逆に拡大）。|
| **CEO 推奨** | **YES 採択** |
| **期待 sign-off** | Owner 承認 → DEC-019-051 正式採択スタンプ（decisions.md line 86 既起票を公式化）、PM Phase 1 plan v2.2 起案（5/6 朝期限）、Dev 5 必須施策 WBS 細分化（5/5 朝期限）|
| **所要時間** | **7 分**（Phase 1 構造変更 = 重要度最高、流量比根拠 + 5 必須施策 + 期待効果 + DEC-019-006 維持理由 + 反対意見対処）|
| **採択時影響** | Phase 1 達成確率 +2% 全帯（5/22 80→82% / 5/26 84→86% / 6/20 75→77% / 6/27 73→75% / Day-0 95→99%）、Risk Register v3→v3.1 連動採択、議決-7（mock 70% 化条件付）/ 議決-13（DEC-019-034）への補強 |
| **反対意見想定 + 対処** | 「subscription 主軸は上流 OpenClaw / Anthropic 双方の personal/consumer pivot に同調しすぎ」→ Research 評価で pivot は subscription 経路の安定性を**向上**、相対不利化なし / 「subscription quota 突破時の API fallback 急速消費が懸念」→ R-019-21（黄、subscription only fallback 手順事前文書化、PM §9.3）で mitigation、5/22 まで Dev 完遂 / 「P-A 直叩き切替の方が安全では」→ Research 比較で $30 cap 配下では P-A 直叩きは 1-3 日で枯渇 = Phase 1 機能不能、P-D 改の構造優位は cap 縮小で**逆に拡大** |

**小計**: 30 分（議決-20: 6 分 + 議決-21: 7 分 + 議決-22: 5 分 + 議決-23: 5 分 + 議決-24: 7 分）

### §6.3 議決-1〜24 合計時間検算

| 区分 | 件数 | 時間 |
|---|---|---|
| 議決-1〜15（v6 既存）| 15 件 | 13.0 分 |
| 議決-20〜24（v7 新規）| 5 件 | 30.0 分 |
| 議決移行間遷移（0.5 分 × 19 = 含む実時間）| — | 含む |
| **合計** | **20 件** | **43.0 分** |

注: §6 議決枠は v6 13 分 → v7 28〜35 分（議決-20〜24 を 5〜7 分配分）の想定上限を 43 分で実装。実議事 90〜105 分枠内で他 § を圧縮することで吸収（§2 −5 / §3 −5 / §5 −7 = −17 分、§7 +5 で +5、差引 −12 分で §6 +25〜30 分を吸収）。

---

## §7 質疑応答（15 分、+5 分拡張）

- 議決 20 件全体への横断質疑
- Owner からの追加要望受付
- **特記**: 議決-20〜24 の質疑が想定多発（subscription 主軸 = Phase 1 構造変更）、CEO 即決可能項目はその場で決裁、議決済 20 件の修正提案は §7 終了時点で再投票

---

## §8 締め（5 分）

| § | 議題 | 時間 |
|---|---|---|
| §8.1 | 議決結果サマリ（採択 N 件 / 修正 N 件 / 棄却 N 件）| 2 分 |
| §8.2 | 次回会議予定（5/30 W2 終了時 NG-3 再確認 + **subscription 主軸での実消費ベースライン報告**（Research）+ $1,200 上方修正候補議論）| 1 分 |
| §8.3 | 6/3 三件同時判断アジェンダ確認（CB-CEO-W3-01）| 1 分 |
| §8.4 | 議事録配布予定（5/9 18:00 までに Owner + 全部署）| 1 分 |

---

## §9 配布前確認事項（秘書部門）

- [x] 議題 v7 本書（本ファイル、5/4 起案）作成
- [x] 議決-20〜24 詳細を §6.2 内に統合記載（議決-1〜15 詳細は v6 添付資料を継続参照）
- [x] Risk Register v3.1（`secretary-risk-register-v3-1.md`）並行作成
- [x] CEO 連結報告 v7（`ceo-owner-consolidated-v7.md`）添付準備
- [ ] 5/7 22:00 までに Owner / 全部署リーダー配布実行
- [ ] 5/7 23:00 配布完了確認

---

## §10 合計時間検算（v7 確定）

| § | v6 時間 | v7 時間 | 差分 |
|---|---|---|---|
| §1 開催情報（議事冒頭の確認）| 2 分 | 2 分 | — |
| §2 W0-Week1 進捗報告 | 15 分 | **10 分** | −5 |
| §3 Owner-in-the-loop Phase 1 Go/NoGo 議決 | 25 分 | **20 分** | −5 |
| §4 BAN drill #1 振り返り + #3 計画 | 18 分 | 18 分 | — |
| §5 PM 議題 | 42 分 | **35 分** | −7 |
| §6 議決事項一覧（**20 件 = 議決-1〜15 + 20〜24**）| 13 分 | **43 分** | +30 |
| §7 質疑応答 | 10 分 | **15 分** | +5 |
| §8 締め | 5 分 | 5 分 | — |
| **合計** | **130 分** | **148 分** | **+18** |

**v7 圧縮運用**: 実議事 90〜105 分枠内収束のため、§6 議決-1〜15（v6 既決路線）は CEO 推奨 YES 先行 → 異議なき場合 0.3〜0.5 分で進行（13 分 → 8〜10 分に圧縮可能）。議決-20〜24 は新規・重要度高のため 30 分維持。質疑（§7）は超過時 §8.4 議事録配布通知に圧縮。最大 105 分・最小 90 分での運用を CEO 議事進行で調整。

**v7 確定: 90〜105 分（議事運用上の圧縮余地あり）、議決 20 件全件 CEO 推奨 YES、Conditional Go 3 条件 + DEC-019-051 subscription 主軸 5/26 着手確定路線**

---

## §11 v6→v7 改版履歴

| 版 | 日付 | 主な変更 | 起案 |
|---|---|---|---|
| v6 | 2026-05-03 | DEC-019-033 5 点統合 + 議決-13〜15（DEC-019-034/035/036）追加 = 計 15 議決 | 秘書部門 |
| **v7** | **2026-05-04** | **DEC-019-050（$30 API cap）+ DEC-019-051（subscription 主軸）採択受け、議決-20〜24（5 件）新設 = 計 20 議決。所要時間 120→90〜105 分（実議事）に再均衡。既存議決-2/-3/-7/-8 に補注（YES 維持 + 確度上昇 / 条件追記 / cap 注記）。Risk Register v3.1（21 件）並行発行。** | **秘書部門** |

---

## フッタ

- 文書: `projects/PRJ-019/reports/secretary-agenda-v7.md`
- 版: v1.0 (2026-05-04)
- 起案: 秘書部門
- 検収: Owner（5/7 22:00 配布 → 5/8 18:00 検収会議で議決-1〜20 採択）
- 次回更新: 2026-05-08 W0-Week1 検収会議終了後（採択結果反映 + 議事録 v1.0 発行）
- 関連: `secretary-agenda-v6.md`（前版）/ `secretary-agenda-v6-resolutions-15.md`（議決-1〜15 詳細）/ `secretary-risk-register-v3-1.md`（Risk Register v3.1 = 21 件、本書同時起案）/ `ceo-owner-consolidated-v7.md`（CEO 連結報告 v7、本書根拠）
