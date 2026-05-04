# PRJ-019 Phase 1 着手キックオフ — 秘書部門サマリレポート

- 案件: PRJ-019「Clawbridge（仮）」 — Open Claw を自律オーナーとする AI 組織ハーネス基盤
- 部署: 秘書部門
- 報告日: 2026-05-02
- 報告者: Secretary Agent (claude-code-company)
- 提出先: CEO

---

## 1. 本セッションのアクション

オーナー → CEO の Phase 1 着手承認を受けて、秘書部門が Phase 0 完了 + Phase 1 着手承認の組織管理を以下の通り実施した。

### 1.1 更新したファイル一覧

| ファイル | 更新内容 |
|---|---|
| `projects/PRJ-019/decisions.md` | DEC-019-005〜008 を追記（4 件）／ Phase 0 完了 DoD を全件チェック ／ Phase 1 着手承認時点情報セクション追加 |
| `projects/PRJ-019/progress.md` | 現在 Phase を「Phase 1 着手準備（W0）」に更新 ／ 全体進捗 5% → 15% ／ マイルストーン表を Phase 0 完了 + W0〜W4 + Phase 2 決裁の 11 行に拡張 ／ Phase 0 成果物 7 ファイル列挙 ／ CEO 決裁 4 件の要約を追記 |
| `projects/PRJ-019/tasks.md` | Phase 0 ステータス完了に更新 ／ Phase 1 タスク 53 件追加（W0 12 件 + W1 10 件 + W2 13 件 + W3 10 件 + W4 8 件）／ ID 採番 (`CB-D-XX` 開発、`CB-R-XX` リサーチ、`CB-S-XX` レビュー、`CB-O-XX` オーナー、`CB-PM-XX` PM、`CB-SC-XX` 秘書) ／ 各タスクに担当・工数・期限・依存・成果物を明記 |
| `projects/PRJ-019/risks.md` | R-019-01〜05 のステータスを 5 件全て更新（解消 2 / 緩和済残存 1 / 緩和 1 / 残存 1）／ 新規リスク R-019-06〜09 を 4 件追加 ／ 重大度サマリを Phase 1 着手承認時点 v2 に再構成 |
| `dashboard/active-projects.md` | PRJ-019 行を Phase 1 着手準備に更新（5% → 15%）／ DEC-019-005〜008、W0 タスク 12 件、W1〜W4 WBS 41 件、新規リスク 4 件、P-D 改採用、月次予算 $300、BAN リスク承認済を反映 |
| `projects/PRJ-019/reports/secretary-phase1-kickoff-summary.md` | 本レポート（新規） |

### 1.2 DEC-019-005〜008 追記件数

**4 件**（DEC-019-005 / 006 / 007 / 008）。すべて 2026-05-02 決裁、CEO 決裁、根拠レポートを decisions.md に明示。

| DEC ID | 主旨 | 根拠レポート |
|---|---|---|
| DEC-019-005 | OQ-01〜05 オーナー判断全面受容（Codex Pro $100 = Plus 比 5x / Claude Code はサブスク駆動 / OpenAI ToS オーナー直確認 / 自前ハーネス確定 / PRJ-018 並走） | `research-supplement-tos-and-subscription-paths.md` §4.2 / §6.1、`pm-architecture-v2-and-phase1-plan.md` §1.1 / §3.4 |
| DEC-019-006 | サブスク駆動接続方式 = P-D 改（公式 Claude Code CLI 常駐 + Open Claw subprocess spawn）／ 別 Anthropic アカウント分離は不採用（NG-2 連鎖 BAN 回避優先）、FS/env 隔離 + P-E 即時 fallback で代替 | `research-supplement-tos-and-subscription-paths.md` §6.2 / §9.1 / §9.2、`review-v2-subscription-risk-and-fallback.md` §5 / §6.1 / §7.1 |
| DEC-019-007 | Phase 1 強い条件付き Go（4 週間、月次予算 $300、DoD = 自動ループ完遂、必須コントロール 21/23 着手前クリア、BAN リスク ¥500k〜¥2M 承認） | `review-v2-subscription-risk-and-fallback.md` §7.1 / §8.2 / §8.5 / §9.1、`pm-architecture-v2-and-phase1-plan.md` §3.1 / §3.3 / §5.3 |
| DEC-019-008 | NG-3 24/7 連続稼働回避方針 CEO 暫定値（12 h/日 上限 + API 換算 $1,000/月相当で停止、W2 終了時 2026-05-30 に再確認） | `research-supplement-tos-and-subscription-paths.md` §2.7、`review-v2-subscription-risk-and-fallback.md` §2.1 / §4.1 |

### 1.3 Phase 1 W0 着手タスク数

**12 件**（W0 期間: 2026-05-02〜2026-05-18）。

| 区分 | タスク数 | 主要タスク |
|---|---|---|
| オーナー直接作業 (CB-O-01〜05) | 5 件 | OpenAI ToS 直確認、Anthropic Max $200 契約、Codex Pro $100 確認、Vercel Sandbox 設定、1Password Vault 4 系統 |
| Dev (CB-D-01〜04) | 4 件 | clawbridge 専用 GitHub リポ + Vercel project + Supabase 監査基盤 + OAuth 隔離方針 |
| PM (CB-PM-01) | 1 件 | W1 キックオフ計画書 |
| Review (CB-S-W0-01) | 1 件 | W0 完了レビュー + W1 着手 Go/NoGo |
| 秘書 (CB-SC-W0-01) | 1 件 | dashboard 反映 + 並走対照表整備 |
| **合計** | **12 件** | **約 32h** |

最優先タスク: **CB-O-01 OpenAI Service Terms オーナー直接確認**（期限 2026-05-09、OQ-03 帰着、最終的なグレー黙認妥当性の判定）。

---

## 2. リソース競合週の特定（PRJ-018 M1 と PRJ-019 W1〜W4 の対照）

PM v2 §3.4.1 配分マトリクスに基づき、週次の Dev / Review 稼働配分を以下の通り対照する。

### 2.1 週次対照表

| 週 | 期間 | PRJ-019 状態 | PRJ-018 状態 | Dev 配分 (PRJ-019/PRJ-018/その他) | Review 配分 (PRJ-019/PRJ-018/その他) | 競合度 |
|---|---|---|---|---|---|---|
| W0 | 2026-05-02〜2026-05-18 | Phase 1 着手準備 | M1 Real impl 進行中（AS-140〜145、5〜7 営業日見込） | 30% / 60% / 10% (W0 は契約 + リポ整備中心、PRJ-018 が M1 Critical Path) | 20% / 70% / 10% | **中**（PRJ-018 M1 完了優先） |
| W1 | 2026-05-19〜2026-05-23 | ハードガード前倒し | **M1 完了見込み（W0 内 5〜7 営業日でクローズ）** or M1 末整備 | 50% / 40% / 10% | 30% / 60% / 10% | **中**（PRJ-018 M1 末週で Review 競合） |
| W2 | 2026-05-26〜2026-05-30 | 監視・隔離 + tos_monitor | M2 設計 or M1 後処理（DEC-018-024 bundle target） | 60% / 30% / 10% | 30% / 60% / 10% | **中** |
| W3 | 2026-06-02〜2026-06-06 | ニーズ判定 + 公開ガード | M2 着手（F1〜F8 想定） | 50% / 40% / 10% | 40% / 50% / 10% | **中** |
| W4 | 2026-06-09〜2026-06-13 | 副作用ゼロ証明 + ベンチマーク 10 連続 | M2 進行中 | 70% / 20% / 10% (PRJ-019 Phase 1 終盤集中) | 60% / 30% / 10% (Phase 1 完了レビュー集中) | **高**（Phase 1 完了週 + M2 進行中） |

### 2.2 競合する週の特定結果

- **明確に競合する週**: **W1（5/19〜5/23）** と **W4（6/09〜6/13）**
  - **W1**: PRJ-019 ハードガード実装期 × PRJ-018 M1 完了直前 / 完了直後の Review 集中（POC 通過後の M1 Real impl 完了レビュー、AS-140 / AS-150 / DEC-018-024 起票）
  - **W4**: PRJ-019 Phase 1 完了週（ベンチマーク 10 連続実行 + 完了レポート + Phase 2 Go/NoGo 判定資料） × PRJ-018 M2 進行中（M2 Quick Win 順序 QW1 F3 1.0d → QW2 F1 1.5d → QW3 F4 idle 0.5d）
- **比較的余裕**: W2 と W3（PRJ-018 M1 完了後の M2 設計 / 着手期、Critical Path 軽め）

### 2.3 競合する場合の優先順位ルール案（CEO 決裁待ち）

PM v2 §3.4.2 に準拠し、以下を秘書部門から CEO に提案する。

| 状況 | 優先 | 理由 |
|---|---|---|
| **金銭損失リスク（CR-02）顕在化** | PRJ-019 即時対応 | 1 件 24h で数十万円の損失可能性 |
| **ToS 違反兆候（CR-V2-01 / R-019-06）顕在化** | PRJ-019 即時対応 | アカウント BAN で claude-code-company 全停止 |
| **既存運用中 PRJ への副作用兆候（F-04 / R-019-04）** | PRJ-019 即時対応 | 失敗判定即停止 |
| **PRJ-018 の M1 Critical Path ブロッカー** | PRJ-018 優先 | DEC-018-014 ハイブリッド運用継続 |
| **両方とも通常進捗** | PRJ-018 優先（W0〜W1 は M1 集中） | M1 完遂を最優先 |
| **PRJ-019 Phase 1 締切間近 + PRJ-018 通常** | PRJ-019 優先 | Phase 1 4 週固定（DEC-019-007） |
| **W4 は両方終盤 → CEO 直接判断** | CEO 都度判断 | 競合度高、両方とも完了直前 |

**秘書部門推奨**: 上記ルールを次回 CEO セッションで承認 → DEC-019-XXX として正式化することを提案。

---

## 3. 監視体制

### 3.1 週次対照の運用

- 秘書部門は W0〜W4 の各週末（金曜 PM）に PRJ-019 / PRJ-018 の進捗を `dashboard/active-projects.md` 上で対照する
- 競合徴候があれば即 CEO に escalate
- タスク採番として `CB-SC-W0-01` 〜 `CB-SC-W4-01` を tasks.md に確定済

### 3.2 重要マイルストーン監視

| 日付 | イベント | 監視責任 |
|---|---|---|
| 2026-05-09 | CB-O-01 OpenAI ToS オーナー直確認期限 | 秘書 |
| 2026-05-15 | CB-O-02 / CB-O-03 オーナー契約完了期限 | 秘書 |
| 2026-05-18 | W0 完了 + W1 着手 Go/NoGo (CB-S-W0-01) | 秘書 + PM + Review |
| 2026-05-19 | W1 着手 | 秘書 |
| 2026-05-30 | **DEC-019-008 NG-3 暫定値再確認 (CB-O-W2-01)** | 秘書 + CEO（オーナー再判断） |
| 2026-05-31 | **Codex 2x プロモボーナス終了（R-019-07）** | 秘書（W3 着手前再見積トリガー） |
| 2026-06-13 | Phase 1 完了 + Phase 2 Go/NoGo 別決裁 | 秘書 + CEO |

---

## 4. 残課題 / オーナーへの確認事項

1. **CB-O-01 OpenAI ToS オーナー直接確認**を 2026-05-09 までに完遂してほしい（Phase 1 の OQ-03 帰着の最後のピース）
2. **競合優先順位ルール（§2.3）** を CEO セッションで正式化してほしい
3. **W2 終了時の DEC-019-008 NG-3 暫定値再確認**を 2026-05-30 にスケジュール
4. **PRJ-018 M1 完了タイミング**が PRJ-019 W1 着手前に確定するか W1 期間に重なるかで W1 の Dev / Review 配分が変動するため、PRJ-018 M1 完了予定を W0 中に PM から再見積もりしてほしい

---

## 5. 関連ドキュメント

- 意思決定: `projects/PRJ-019/decisions.md`（DEC-019-005〜008 反映済）
- 進捗: `projects/PRJ-019/progress.md`（Phase 1 着手準備に更新済）
- タスク: `projects/PRJ-019/tasks.md`（W0〜W4 計 53 件追記済）
- リスク: `projects/PRJ-019/risks.md`（R-019-06〜09 追加、既存 5 件ステータス更新済）
- ダッシュボード: `dashboard/active-projects.md`（PRJ-019 行 Phase 1 着手準備 / 進捗 15% / DEC-019-005〜008 反映済）
- リサーチ補追: `projects/PRJ-019/reports/research-supplement-tos-and-subscription-paths.md`
- PM v2: `projects/PRJ-019/reports/pm-architecture-v2-and-phase1-plan.md`
- レビュー v2: `projects/PRJ-019/reports/review-v2-subscription-risk-and-fallback.md`

---

**v1 確定**: 2026-05-02 ／ **次回更新**: W0 完了時（2026-05-18）または CB-O-01 完了時
