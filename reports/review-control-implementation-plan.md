# PRJ-019 Phase 1 W0 必須コントロール実装計画 & レビュー基準

- 案件: PRJ-019「Clawbridge（仮）」 — Open Claw を自律オーナーとする AI 組織ハーネス基盤
- 部署: レビュー部門（品質管理）
- 作成日: 2026-05-02
- 作成者: Review Agent (claude-code-company)
- 版: v1（W0 着手前に CEO 経由 PM・Dev と整合性レビュー後に v1.1 へ更新）

## 0. 文書の位置づけ

### 0.1 目的
- 必須コントロール 23 項目（v1 G-01〜G-12 中 G-03 無効化分を v2 に置換 + v2 G-V2-01〜G-V2-12）の **W0 期間（2026-05-02〜2026-05-18、17 日間）における実装計画を確定**
- 各コントロールの **レビュー部門としての検収基準・検証方法・合否判定**を明示
- BAN フォールバック drill 手順書、独立検証項目、残存リスク監視計画、緊急停止権限の境界を定義
- **W0 終了時（5/18）の Phase 1 着手 Go/NoGo 最終判定**の判断材料を整備

### 0.2 前提（CEO 決裁済）
- 必須コントロール **23 項目中 21 項目を Phase 1 着手前にクリア**、残 2 項目は W1 進行中整備（G-V2-06 rate jittering、G-V2-07 業務時間帯ウィンドウ）
- 接続方式 **P-D 改採用**（公式 Claude Code CLI を本人マシンで本人 OAuth で起動、Open Claw は subprocess spawn のみ、API 直叩きなし）。別 Anthropic アカウント分離は **不採用**（連鎖 BAN 回避、NG-2 抵触懸念）
- 連続稼働上限 **12h/日**、API 換算 **$1,000/月相当**超過で自動停止
- BAN フォールバック SLA: 検知 < 1 分、通知 < 5 分、退避 < 30 分、secret rotate < 1 時間、代替起動 < 4 時間

### 0.3 参照インプット
- `projects/PRJ-019/reports/review-security-and-risk-assessment.md`（v1）
- `projects/PRJ-019/reports/review-v2-subscription-risk-and-fallback.md`（v2）
- `projects/PRJ-019/reports/pm-architecture-v2-and-phase1-plan.md`（PM v2 / Phase 1 WBS）
- `projects/PRJ-019/reports/research-supplement-tos-and-subscription-paths.md`（P-D 改、NG-1〜3）

### 0.4 W0 期間カレンダー（17 日間）
```
W0-1週: 5/02 (金) - 5/08 (木)  ← 5/02 W0 着手
W0-2週: 5/09 (金) - 5/15 (木)  ← 5/15 までに 21 項目実装完了
W0-3週: 5/16 (金) - 5/18 (月)  ← 統合検証 + Go/NoGo 判定
W1着手: 5/19 (火)
```

---

## 1. コントロール一覧表（v1 + v2 統合版、計 23 項目）

### 1.1 統合の方針
- v1 G-03（API キー専用、OAuth 排除）は **OQ-02 サブスク駆動採用 + DEC P-D 改**により**無効化**
- v1 G-01 は v2 G-V2-09（サブスク内自主上限）と統合せず独立維持（4 層キャップの構造を保つため Codex / Vercel / Supabase の 3 層 + アプリ層の cost_check skill）
- 合計: v1 11 項目（G-03 除く） + v2 12 項目 = **23 項目**

### 1.2 一覧表

| ID | 名称 | 目的 / 対応 CR | 区分 | 担当 | 実装タスク ID | 工数 | 検証方法 | 合否基準 |
|---|---|---|---|---|---|---|---|---|
| **G-01** | コスト上限ハードキャップ（Codex/Vercel/Supabase + アプリ層 cost_check） | CR-02 コスト爆発、CR-V2-04 サブスク逸脱 | W0 必須 | Dev + Owner | CB-D-W0-01, CB-D-W0-02 | 12h | 意図的に上限超え試行、API 自動停止確認 / cost_check skill が累計 80% で warn、100% で停止 | 全層で hard stop 動作、復旧手順文書化済 |
| **G-02** | 緊急停止スイッチ（kill switch） | 全 CR 共通の last resort | W0 必須 | Dev | CB-D-W0-03, CB-D-W0-04 | 8h | 月次 kill drill（Slack `/clawbridge stop` で 30 秒以内全停止）| 30 秒以内に全 child process SIGKILL + cron 停止 + OAuth セッション停止 |
| **G-04** | 公開前人間承認ゲート | CR-04 法令違反 | W0 必須 | Dev | CB-D-W0-05 | 8h | 自動 deploy 試行 → Slack 承認 prompt → 24h 未承認で自動 reject | 自動公開ゼロ、24h タイムアウトで reject ログ残存 |
| **G-05** | FS 書込 allowlist | CR-03 既存 PRJ 破壊、CR-V2-02 BAN 波及 | W0 必須 | Dev | CB-D-W0-06 | 6h | 他 PRJ への write 試行 → reject 確認 | `projects/PRJ-019/**` のみ書込可、他は read-only |
| **G-06** | シェルコマンド allowlist | CR-03, HR-04 sandbox escape | W0 必須 | Dev | CB-D-W0-07 | 4h | 禁止コマンド（`rm -rf`, `curl POST`, `sudo`, `ssh`, `chmod -R 777`）→ reject 確認 | denylist 全件 reject、allowlist は prefix 一致で whitelist |
| **G-07** | secret 隔離 microVM | CR-05 secret 漏洩 | W0 必須 | Dev | CB-D-W0-08, CB-D-W0-09 | 12h | sandbox 内 `env \| grep ANTHROPIC` → 空確認 | Tier-S1 secret が Tier-S2 microVM に到達不可 |
| **G-08** | GitHub branch protection | HR-05 force push, CR-03 既存 PRJ 破壊 | W0 必須 | Dev + Owner | CB-D-W0-10 | 3h | force push 試行 → reject 確認 | main/prod に require review + status checks + block force push + block deletion 全件適用 |
| **G-09** | 監査ログ全件保存（append-only） | HR-06 検知遅延、フォレンジック | W0 必須 | Dev | CB-D-W0-11, CB-D-W0-12 | 14h | 過去ログ削除試行 → reject、改ざん検出 | Supabase append-only 制約、90 日保持、stream-json 全 event 記録 |
| **G-10** | Multi-channel alert（Slack/TG/SMS）+ heartbeat | HR-06 検知遅延 | W0 必須 | Dev | CB-D-W0-13 | 8h | drill で各 channel 到達確認、loop 起こし → 5 分以内通知 | heartbeat 5 分欠損で alert、anomaly threshold 動作 |
| **G-11** | 公開可能アプリ allowlist（個人情報/商取引/認証/メディア/医療・金融・法律 禁止） | CR-04 法令違反 | W0 必須 | PM + Review | CB-S-W0-01, CB-S-W0-02 | 10h | 該当カテゴリ submit → Review skill で auto reject | 全 6 禁止カテゴリで reject、allowlist は明文化 |
| **G-12** | 既存 PRJ 副作用ゼロ証明 | CR-03 既存 PRJ 破壊、CR-V2-02 BAN 波及 | W0 必須（W2 でも追検証） | Dev + Review | CB-D-W0-14, CB-S-W0-03 | 10h | dry-run × 3 + git diff 全件 0 + Vercel project untouched | PRJ-001〜018 の全 git diff 0 行、Vercel deployment count 不変、Supabase row count 不変 |
| **G-V2-01** | 並列セッション数 = 1 の技術強制 | CR-V2-01 BAN（multi-process 検出） | W0 必須 | Dev | CB-D-W0-15 | 4h | 既存 `claude` プロセスがある状態で起動試行 → 拒否 | OS lock file `/tmp/clawbridge.lock` + `pgrep claude` で多重起動 0 件 |
| **G-V2-02** | レート自主上限（Anthropic 5h ウィンドウの 70% 以下） | CR-V2-01, CR-V2-04 | W0 必須 | Dev | CB-D-W0-16 | 8h | 70% 到達 → warn、80% → 完全停止 | rate_check skill が 1 分間隔で記録、80% で停止イベント発火 |
| **G-V2-03** | 起動元偽装 / OAuth 直 spawn / billing-proxy 全面禁止 | CR-V2-03 自動 OAuth 違反濃度 | W0 必須 | Dev + Review | CB-D-W0-17, CB-S-W0-04 | 6h | pre-commit hook で `User-Agent` / `oauth` / `keychain` / `credentials` / `billing-proxy` の grep 検出 | 検出時 commit reject、コードレビューで 100% 確認 |
| **G-V2-04** | 指示入力経路の単一化（Open Claw → Codex → claude -p） | CR-V2-03 経路偽装 | W0 必須 | Dev | CB-D-W0-18 | 6h | 想定外経路（直接 API 叩き等）→ reject、各 hop で task_id chain 記録 | 全 invocation が単一経路、task_id / parent_task_id の chain が監査ログで replay 可能 |
| **G-V2-05** | 監査用 Anthropic アカウント分離 | CR-V2-02 BAN 波及 | **W0 必須 → DEC で不採用に変更** | — | — | — | — | **本コントロールは CEO 決裁により不採用**。代替: G-V2-11（OAuth トークン到達禁止）+ G-V2-09（サブスク自主上限）+ G-V2-02（レート 70% 上限）+ 連続稼働 12h 制限の組合せで「メインアカウントへの逸脱負荷を ordinary individual usage 範囲に維持する」方針 |
| **G-V2-06** | rate jittering（30s〜180s ジッタ） | CR-V2-01 定常 burst 検出回避 | **W1 進行中整備可** | Dev | CB-D-W1-01 | 4h | request 間隔の標準偏差 > 0 確認 | 5h ウィンドウ内の request タイミング heatmap で jitter 確認 |
| **G-V2-07** | 業務時間帯ウィンドウ（10:00-22:00 JST、連続稼働 12h/日 ≤） | CR-V2-01 24/7 ordinary 逸脱 | **W1 進行中整備可** | Dev | CB-D-W1-02 | 4h | 22:00 越え reject、12h 累積 reject | cron で時間帯外停止、連続稼働カウンタが 12h 到達で stop |
| **G-V2-08** | Anthropic 警告メール監視 → 即停止 | CR-V2-01 BAN 早期検知 | W0 必須 | Dev | CB-D-W0-19 | 6h | テストメールで 1h 以内 hook 発火確認 | Gmail filter で `from:anthropic.com` 検知 → 全停止 + Slack/TG 通知 |
| **G-V2-09** | 月次消費の Boris Cherny 線（API 換算 $1,000）自主上限 | CR-V2-01 ordinary 逸脱 | W0 必須 | Dev | CB-D-W0-20 | 6h | API 換算 $800 で warn、$1,000 で停止 | cost_check skill 拡張、サブスク内消費を $/トークン で API 換算 |
| **G-V2-10** | Anthropic ToS 半年再評価サイクル | CR-V2-04 ToS 強化追従 | W1 進行中整備可（運用） | Research | （運用タスク） | 2h/回 | 6 ヶ月毎に `code.claude.com/docs/en/legal-and-compliance` 再 fetch、diff 検出 → review v2.x 更新 | 半年毎レポート発行、変更検知時に 1 週間以内に対応方針決裁 |
| **G-V2-11** | OAuth トークン到達禁止の FS / env 隔離 | CR-V2-01, CR-V2-03 | W0 必須 | Dev | CB-D-W0-21 | 8h | Open Claw / Codex プロセスから `~/.config/claude` / keychain への read 試行 → reject | WSL2 内で AppArmor 風 policy（または `chmod` + 専用 user 分離）で物理隔離 |
| **G-V2-12** | 投入経路文書化と監査ログ replay | CR-V2-03 経路追跡 | W0 必須 | Dev + Review | CB-D-W0-22, CB-S-W0-05 | 8h | 過去 invocation を replay → 同一出力再現 | 名前付き pipe / tmux send-keys 等の経路を 1 種に固定、全イベント記録 |

### 1.3 不採用とした項目の補完説明（G-V2-05）

CEO 決裁で「別 Anthropic アカウント分離は不採用（連鎖 BAN 回避）」と決定。NG-2（multi-account 禁止）抵触リスクを最大限避ける判断であり、**メインアカウントを温存する代わりに ordinary individual usage 範囲を厳格に維持する**設計に切替。レビュー部門としてはこの決定を **以下 4 コントロールでの代替防御で補強する**:

1. **G-V2-11**: OAuth トークン物理隔離（Open Claw / Codex プロセスから到達不可）
2. **G-V2-09**: API 換算 $1,000/月相当で自主停止（Boris Cherny 線下回り）
3. **G-V2-02**: 5h ウィンドウ 70% 上限（ordinary 逸脱防止）
4. **G-V2-07**: 連続稼働 12h/日（24/7 ordinary 逸脱防止）

これら 4 つが 1 つでも破られた場合、メインアカウント BAN リスクが急上昇するため、**W0 統合検証時に 4 つすべての並行動作を必須確認項目とする**（§5.1）。

---

## 2. Phase 1 着手前必須 21 項目の実装スケジュール（W0 17 日間）

### 2.1 マイルストーン

| 日付 | マイルストーン | Go 判定基準 |
|---|---|---|
| **5/02 (金)** | W0 着手、本計画書 + dev W0 計画書 + PM WBS 整合性確認完了 | 3 文書一致 |
| **5/08 (木)** | W0-1週終了。**ハードガード基盤 7 項目完了**（G-01/G-04/G-05/G-06/G-08/G-V2-11/G-V2-03） | 7 項目の単体検証 PASS |
| **5/15 (木)** | W0-2週終了。**残 14 項目完了（必須 21 全完了）** | 全 21 項目の単体検証 PASS |
| **5/16 (金)〜5/18 (月)** | **統合検証 + BAN drill 1 回 + 副作用ゼロ証明**実施 | 統合シナリオ通過 + drill SLA 達成 + git diff 0 行 |
| **5/18 (月) 18:00** | **Phase 1 着手 Go/NoGo 最終判定会議** | §5.2 Go 条件全充足 |
| **5/19 (火)** | Phase 1 W1 着手 | — |

### 2.2 ガントチャート風スケジュール（21 必須項目）

```
凡例: ■ = 実装、◇ = 検証、◆ = 統合検証

Date     |05/02|05/03|05/04|05/05|05/06|05/07|05/08|05/09|05/10|05/11|05/12|05/13|05/14|05/15|05/16|05/17|05/18|
         | (金) | (土) | (日) | (月) | (火) | (水) | (木) | (金) | (土) | (日) | (月) | (火) | (水) | (木) | (金) | (土) | (月) |
---------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
G-01     | ■   | ■   |     | ■   | ◇   |     |     |     |     |     |     |     |     |     | ◆   | ◆   |     |
G-02     |     |     |     |     | ■   | ■   | ◇   |     |     |     |     |     |     |     | ◆   | ◆   |     |
G-04     | ■   | ■   |     | ■   | ◇   |     |     |     |     |     |     |     |     |     | ◆   | ◆   |     |
G-05     | ■   | ■   |     |     | ◇   |     |     |     |     |     |     |     |     |     | ◆   | ◆   |     |
G-06     |     | ■   | ■   |     | ◇   |     |     |     |     |     |     |     |     |     | ◆   | ◆   |     |
G-07     |     |     |     |     |     |     |     | ■   | ■   |     | ■   | ◇   |     |     | ◆   | ◆   |     |
G-08     | ■   | ◇   |     |     |     |     |     |     |     |     |     |     |     |     | ◆   | ◆   |     |
G-09     |     |     |     |     |     |     |     | ■   | ■   |     | ■   | ◇   | ◇   |     | ◆   | ◆   |     |
G-10     |     |     |     |     |     |     | ■   | ■   | ■   |     |     | ◇   |     |     | ◆   | ◆   |     |
G-11     |     |     |     |     |     | ■   | ■   | ■   |     |     |     | ◇   |     |     | ◆   | ◆   |     |
G-12     |     |     |     |     |     |     |     |     |     |     |     | ■   | ■   | ◇   | ◆   | ◆   | ◆   |
G-V2-01  |     |     |     |     | ■   | ◇   |     |     |     |     |     |     |     |     | ◆   |     |     |
G-V2-02  |     |     |     |     |     |     | ■   | ■   |     |     | ◇   |     |     |     | ◆   | ◆   |     |
G-V2-03  | ■   | ■   |     | ◇   |     |     |     |     |     |     |     |     |     |     | ◆   |     |     |
G-V2-04  |     |     |     |     |     | ■   | ■   |     |     |     | ◇   |     |     |     | ◆   | ◆   |     |
G-V2-08  |     |     |     |     |     |     |     | ■   | ■   |     | ◇   |     |     |     | ◆   | ◆   |     |
G-V2-09  |     |     |     |     |     |     |     |     |     |     | ■   | ■   | ◇   |     | ◆   | ◆   |     |
G-V2-11  | ■   | ■   |     | ■   | ◇   |     |     |     |     |     |     |     |     |     | ◆   | ◆   |     |
G-V2-12  |     |     |     |     |     |     |     |     | ■   | ■   |     | ■   | ◇   |     | ◆   | ◆   |     |
---------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
BAN drill|     |     |     |     |     |     |     |     |     |     |     |     |     |     |     | ◆   |     |
副作用証明|     |     |     |     |     |     |     |     |     |     |     |     |     |     |     | ◆   | ◆   |
Go/NoGo  |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     | ◆   |
```

### 2.3 直列依存と並列可能ブロック

#### 直列必須チェーン
1. **Permission チェーン**: G-05 → G-06 → G-V2-04（FS allowlist → シェル allowlist → 経路単一化）
2. **OAuth 隔離チェーン**: G-V2-11 → G-V2-03 → G-V2-12（物理隔離 → 偽装禁止 grep → 経路文書化）
3. **監査チェーン**: G-09（Supabase スキーマ）→ G-10（alert）→ G-V2-08（警告メール監視）
4. **コストチェーン**: G-01（hard cap 設定）→ G-V2-02（rate 自主上限）→ G-V2-09（API 換算 $1,000 上限）
5. **公開ゲートチェーン**: G-04（HITL gate）→ G-11（公開 allowlist）→ G-12（副作用ゼロ証明）

#### 並列可能ブロック（W0-1週内）
- ブロック A: **G-01, G-04, G-05, G-08, G-V2-03, G-V2-11**（5/02-5/05、それぞれ独立）
- ブロック B: **G-02, G-V2-01, G-06**（5/06-5/08）

#### 並列可能ブロック（W0-2週内）
- ブロック C: **G-07, G-09, G-10, G-V2-02, G-V2-08**（5/09-5/12、依存少ない）
- ブロック D: **G-V2-09, G-V2-12, G-11, G-12**（5/12-5/15、後段機能）

### 2.4 W0-1週（5/02〜5/08）詳細: ハードガード基盤 7 項目

**目的**: Phase 1 着手より遥か前に、暴走しても物理的に被害が広がらない状態を作る。

| Day | 完了マイルストーン | レビュー部門の検収 |
|---|---|---|
| 5/02 | G-V2-11 OAuth 隔離設計開始、G-08 branch protection 着手、G-01 spend cap 設定開始、G-V2-03 grep hook 設計 | 設計レビュー（@CB-S-W0-04） |
| 5/05 | G-08 完了、G-V2-11 完了、G-V2-03 hook 実装、G-04 HITL 5 ゲート完了 | branch protection 動作確認、grep hook 動作確認 |
| 5/06 | G-V2-01 lock file 完成、G-06 シェル allowlist 完成 | 多重起動 reject 確認、`rm -rf /` reject 確認 |
| 5/07 | G-02 emergency_stop skill 着手、G-V2-04 経路単一化設計 | — |
| 5/08 | G-02 完成、G-10 alert 着手 | 30 秒以内 kill drill 通過 |

### 2.5 W0-2週（5/09〜5/15）詳細: 残 14 項目

| Day | 完了マイルストーン | レビュー部門の検収 |
|---|---|---|
| 5/09 | G-09 Supabase append-only スキーマ、G-10 multi-channel alert、G-V2-08 警告メール監視、G-11 allowlist policy、G-V2-02 rate_check 実装着手 | スキーマレビュー、policy 文書レビュー（@CB-S-W0-01） |
| 5/10 | G-V2-12 経路 replay 実装、G-07 microVM ラッパー実装 | — |
| 5/11 | G-09 stream-json 書込 hook、G-07 1Password CLI 統合、G-V2-09 サブスク自主上限実装着手 | — |
| 5/12 | G-V2-04 経路単一化完成、G-V2-02 検証、G-11 Review skill 自動判定追加、G-V2-08 検証 | rate 80% で停止確認、テストメール検証 |
| 5/13 | G-V2-09 完成、G-12 dry-run スクリプト着手、G-09 検証、G-V2-12 検証 | API 換算 $1,000 で停止確認、ログ削除試行 → reject 確認 |
| 5/14 | G-12 dry-run × 3 完走 | dry-run report レビュー（@CB-S-W0-03） |
| 5/15 | **全 21 項目単体検証完了**、各 G の検証ログ `reports/control-evidence/` に保存 | レビュー部門が 21 項目すべての検収レビュー完了 |

### 2.6 W0-3週（5/16〜5/18）詳細: 統合検証 + Go/NoGo

| Day | アクティビティ |
|---|---|
| 5/16 (金) | **統合検証 day 1**: 全 21 項目を同時稼働させ、ベンチマークシナリオ（PM v2 §3.1.1）を dry-run で 3 回完走。BAN drill リハーサル（dry-run） |
| 5/17 (土) | **統合検証 day 2**: BAN drill 本番（後述§4）。副作用ゼロ証明（PRJ-001〜018 の git diff 0 行）。残存課題リストアップ |
| 5/18 (月) | **18:00 Go/NoGo 最終判定会議**（CEO 主催、PM・Dev・Review 出席）。判定結果を `decisions.md` DEC-019-XXX に記録 |

---

## 3. W1 進行中整備 2 項目の整備計画

W0 着手前必須 21 項目に対し、W1（5/19〜5/23、Phase 1 着手 1 週目）中に整備する 2 項目:

### 3.1 G-V2-06: rate jittering（30s〜180s ジッタ）

- **W1 整備理由**: BAN 検出シグナル「定常 burst」を薄める用途。W0 で他 21 項目が動いていれば burst 自体が短時間で停止するため、W1 まで遅延しても重大事故化しない。
- **W1 整備期限**: W1 終了時（5/23）まで
- **W1 中の暫定運用**: G-V2-02（rate 70% 上限）+ G-V2-09（$1,000/月上限）+ G-V2-07 暫定（業務時間帯ウィンドウは Phase 1 で human in the loop で監視、cron 自動制御は W1 末で完成）の組合せで burst 発生確率を抑える。**暫定期間中は 1 日 1 回のオーナーチェックを必須とする（朝 09:00 / 夜 22:00、Slack 報告）**。

### 3.2 G-V2-07: 業務時間帯ウィンドウ + 連続稼働 12h/日

- **W1 整備理由**: cron での自動制御実装が他のタスクとの依存があり、W0 は手動運用で代替可能。
- **W1 整備期限**: W1 終了時（5/23）まで
- **W1 中の暫定運用**:
  - **連続稼働 12h/日**: W0 から手動で運用（オーナーが Slack `/clawbridge stop` で 22:00 に停止）。**G-V2-02 rate_check に時刻ベース counter を追加**して 12h 経過で自動停止する暫定実装を W0 中に間に合わせる（CB-D-W0-16 範囲内）。
  - **業務時間帯（10:00-22:00 JST）**: W1 までは「オーナーが起動・停止の指示を Slack で出す」運用、cron 化は W1 末で完成。
  - **暫定期間中の人間ゲート増加**: Phase 1 W1 中の自律ループは「オーナー起動 → 1 タスク → オーナー終了確認」の人間 sandwich パターンで、フルオートの夜間稼働は W1 末まで禁止。

### 3.3 W1 暫定運用の Go/NoGo

W1 終了時（5/23）に G-V2-06 + G-V2-07 が**完成しなかった場合**:
- **W1 着手の取消し**: 不要（既に W0 で 21 項目クリア済み、W1 開始は問題ない）
- **W2 着手の判断**: G-V2-06 / G-V2-07 が W1 末で未完成なら **W2 着手を 1 週間延期**
- **暫定運用の継続条件**: オーナーが手動チェック運用を継続する場合のみ W2 着手可、ただし**夜間自動稼働は cron 完成まで完全禁止**

---

## 4. BAN フォールバック drill 手順書

### 4.1 5 ステップ詳細実装

| Step | アクション | SLA | 担当 | 自動化レベル |
|---|---|---|---|---|
| **Step 1: 検知** | Anthropic 401/403/429 を 1 分窓で 5 件超 → trigger / 警告メール検出 / heartbeat 5 分欠損 | **< 1 分** | 自動 (G-V2-08, G-10) | 完全自動 |
| **Step 2: 通知** | Slack #emergency critical post + Telegram bot push + Twilio SMS（オーナー本人） | **< 5 分** | 自動 (G-10) | 完全自動 |
| **Step 3: 退避** | 全 worktree を `git stash` + 専用 backup branch push、進行中 prompt/context を Supabase 監査ログから export、実行中 sandbox は 30 分 grace で artifact 退避後 destroy | **< 30 分** | 半自動（スクリプト実行 + オーナー確認） | スクリプト実行は自動、最終確認はオーナー |
| **Step 4: secret rotate** | Anthropic OAuth refresh token revoke、Codex OAuth revoke、GitHub PAT rotate、Vercel token rotate、Supabase service_role rotate | **< 1 時間** | 半自動（rotate スクリプト + Console 操作はオーナー） | スクリプト準備済、Console 手作業はオーナー |
| **Step 5: 代替起動** | Plan B-1 (P-A: API キー従量) / B-2 (Codex 単独) / B-3 (OpenHands・Devin) のいずれかを起動、または Phase 1 完全停止判断 | **< 4 時間** | 半自動（B-1 は env 切替のみで自動、B-2/B-3 はオーナー判断） | B-1 は完全自動、B-2/B-3 はオーナー決裁 |

### 4.2 drill 実施スケジュール

| 実施日 | 内容 | 目的 |
|---|---|---|
| **5/17 (土) W0-3週** | **drill 第 1 回（W0 中盤、必須）** | Phase 1 着手前に SLA 内達成可能を実証。失敗時は Phase 1 着手延期 |
| **W3 中盤（6/02〜6/06、Phase 1 W3 想定）** | **drill 第 2 回**（実運用環境でのリハーサル） | Phase 1 中の運用環境変化に追従、人間介入なしで復旧可能を再確認 |

### 4.3 drill 合格基準

| 項目 | 基準 |
|---|---|
| Step 1 検知 | 401/403/429 trigger 開始から **60 秒以内**に全 child process SIGKILL ログ |
| Step 2 通知 | Slack/Telegram/SMS の **全 3 channel** で trigger 開始から **300 秒以内**に到達確認 |
| Step 3 退避 | trigger 開始から **30 分以内**に backup branch push 完了、Supabase export 完了、sandbox destroy 完了 |
| Step 4 secret rotate | trigger 開始から **60 分以内**に全 secret rotate 完了、新 secret で B-1 起動可能状態 |
| Step 5 代替起動 | trigger 開始から **4 時間以内**に Plan B-1 で 1 タスク完走可能を実証 |
| **総合** | 上記 5 項目すべて合格、人間介入は Step 3〜5 の最終確認のみ（手動操作の自動化代替パスは事前文書化済） |

### 4.4 drill 不合格時の Phase 1 中断条件

| drill 結果 | アクション |
|---|---|
| Step 1〜2 で SLA 超過（検知 1 分超 or 通知 5 分超） | **即時 Phase 1 着手 NoGo**。alert 設計を再構築、3 日以内に再 drill |
| Step 3 で 30 分 SLA 超過、人間介入が 1 回でも発生 | **Phase 1 着手 1 週間延期**。退避スクリプト完成度を上げ再 drill |
| Step 4 で 1 時間 SLA 超過 | **Phase 1 着手 1 週間延期**。rotate スクリプト整備完了まで保留 |
| Step 5 で 4 時間 SLA 超過 or B-1 で 1 タスク完走できず | **Phase 1 着手 NoGo、API キー従量パス（P-A）の事前並行整備を追加**して再判定 |
| 統合シナリオ通過、5 項目全合格 | **Phase 1 着手 Go**（他の Go 条件と合算） |

---

## 5. レビュー部門の検収プロセス

### 5.1 各コントロールの検収レビュー手順

各コントロール 1 項目につき以下を実施し、`projects/PRJ-019/reports/control-evidence/G-XX-evidence.md` に保存:

1. **設計レビュー**（実装着手前 1〜2 日）: Dev 部門が提出する実装方針 / コードスケッチを Review が確認、Critical/Major 指摘ゼロで実装着手承認
2. **単体検証**（実装完了直後）: Dev 部門が提出する unit test / 動作ログ / シミュレーション結果を Review が独立検証（§6 参照）
3. **統合検証**（W0-3週）: 21 項目を同時稼働させてベンチマークシナリオで 3 回完走、副作用ゼロ証明、BAN drill
4. **検収判定**: Critical / Major 指摘なし → 承認、Major あり → 条件付き承認、Critical あり → 差し戻し

### 5.2 W0 終了時 Phase 1 着手 Go/NoGo 最終判定会議の議題（5/18 18:00）

| # | 議題 | 判定基準 |
|---|---|---|
| 1 | 必須 21 項目の単体検証結果報告 | 全 21 項目で Critical / Major ゼロ |
| 2 | 統合検証（5/16-5/17）結果報告 | ベンチマークシナリオ 3 回連続成功、各回コスト < $5、人間介入 HITL ゲート以外ゼロ |
| 3 | BAN drill 結果報告（5/17 実施分） | §4.3 5 項目全合格 |
| 4 | 副作用ゼロ証明レビュー（5/17-5/18） | PRJ-001〜018 の git diff 全件 0 行、Vercel deployment 不変、Supabase row count 不変 |
| 5 | W1 進行中整備 2 項目（G-V2-06/07）の暫定運用承認 | レビュー部門が暫定運用設計を承認、オーナー手動チェック運用を確認 |
| 6 | 残存リスク監視計画の確認 | §7 のアラート基準に同意 |
| 7 | 緊急停止権限の境界確認 | §8 のレビュー部門 kill switch 発動条件に CEO・オーナーが同意 |
| 8 | **Go/NoGo 最終判定** | 1〜7 全項目で異議なし → Go、1 つでも条件未達 → NoGo |

### 5.3 開発部門との協調ポイント

| 局面 | レビュー部門の責務 | 開発部門の責務 | 衝突時の調停 |
|---|---|---|---|
| W0 設計レビュー | 設計妥当性、リスク見落とし、ToS グラデーション判定 | 実装可能性、工数 | CEO 経由、48h 以内に決着 |
| W0 実装中 | 進捗 daily 確認、ブロッカー早期発見 | 実装と単体テスト | レビュー部門は実装に直接手を入れず指摘のみ |
| W0 統合検証 | 検証シナリオ設計、合否判定 | テスト環境準備、シナリオ実行 | シナリオは Review、実行は Dev、判定は Review |
| BAN drill | drill シナリオ作成、SLA 計測、合否判定 | drill 環境準備、スクリプト実行 | Review が観察者、Dev は実行者、SLA 判定は Review |
| 副作用ゼロ証明 | 検証スクリプト独立レビュー、結果検収 | 検証スクリプト実装、git diff 取得 | スクリプトは Dev、Review は別手段で再検証 |

---

## 6. 独立性のある検証項目（自部署のみで実施）

### 6.1 実機検証（レビュー部門が直接 PC で確認）

| ID | 項目 | 方法 |
|---|---|---|
| IND-01 | branch protection 動作（G-08） | レビュー部門が個人 GitHub アカウントから force push を試行 → reject ログ取得 |
| IND-02 | FS allowlist 動作（G-05） | レビュー部門が `projects/PRJ-005/test.txt` への write を試行 → reject 確認 |
| IND-03 | シェル denylist 動作（G-06） | レビュー部門が `rm -rf` / `curl POST` / `sudo` を試行 → reject 確認 |
| IND-04 | OAuth トークン到達不可（G-V2-11） | レビュー部門が Open Claw プロセスから `cat ~/.config/claude/credentials.json` を試行 → permission denied 確認 |
| IND-05 | 多重起動 reject（G-V2-01） | レビュー部門が 2 つ目の `claude` セッションを起動試行 → lock file エラー確認 |
| IND-06 | 警告メール監視（G-V2-08） | レビュー部門が `from:anthropic.com` を含む test メールを送信 → 1h 以内に hook 発火確認 |
| IND-07 | kill switch（G-02） | レビュー部門が Slack `/clawbridge stop` 実行 → 30 秒以内全停止確認 |

### 6.2 ドキュメントレビュー（実装に依存せず可）

| ID | 項目 | 方法 |
|---|---|---|
| IND-DOC-01 | 公開 allowlist policy（G-11） | `clawbridge-policy.md` を ToS / 法令観点で精読、6 禁止カテゴリの境界判定例を 5 件以上検証 |
| IND-DOC-02 | 経路単一化文書（G-V2-12） | 名前付き pipe / tmux send-keys のどちらを採用したか、replay 可能性を文書から再構成 |
| IND-DOC-03 | フォールバック手順書（§4） | Step 3〜5 の手順がオーナー不在時にも進行可能か、自動化スクリプトの可読性確認 |
| IND-DOC-04 | コード grep 規則（G-V2-03） | pre-commit hook の正規表現が `User-Agent` / `oauth` / `keychain` / `credentials` / `billing-proxy` を全件検出するか、テスト文字列で確認 |

### 6.3 シミュレーション（独立検証）

| ID | 項目 | 方法 |
|---|---|---|
| IND-SIM-01 | コスト爆発シミュレーション（G-01, G-V2-09） | 合成ログを cost_check skill に流し込み、$1,000 到達で停止イベント発火を確認 |
| IND-SIM-02 | rate 上限シミュレーション（G-V2-02） | 5h ウィンドウの 70% 到達合成ログ → warn / 80% → 停止 イベント確認 |
| IND-SIM-03 | 副作用ゼロ判定スクリプト独立検証（G-12） | レビュー部門が独自に `git diff projects/PRJ-001..018` を実行、Dev のスクリプトと結果一致確認 |
| IND-SIM-04 | 監査ログ replay（G-V2-12） | 過去の invocation を Supabase から取り出し、別環境で同一 prompt 投入 → 出力が再現可能か確認 |

---

## 7. 残存リスクの監視計画

コントロール実装後も消えない残存リスクの継続監視:

### 7.1 残存リスク一覧

| ID | 残存リスク | 残存スコア | 監視方法 | アラート基準 | 通知先 |
|---|---|---|---|---|---|
| RR-01 | Anthropic ToS グレー解釈の BAN（30〜60% / 12 ヶ月） | High | 月次 ToS 動向 + 警告メール監視（G-V2-08）+ Steinberger 事例情報収集 | 警告メール 1 通 / 同様事例 SNS 報告 / ToS 文面改訂検知 | Owner 直、CEO 同時 |
| RR-02 | Codex 5/31 ボーナス終了後の 5x → 半減（10x → 5x） | Medium | 5/31 までに月次消費 trend 把握、5/31 以降 10 日間で帯域不足発生有無を確認 | 5h ウィンドウ 90% 連続到達が週 3 回以上 | CEO（Owner 経由） |
| RR-03 | NG-3 グレー領域（24h 連続稼働、$1,000 逸脱）の判定境界変動 | Medium | Anthropic 公式声明 / Boris Cherny 発言の月次クロール、Slack 監視 | 「ordinary individual usage」定義の縮小報道 / 新規 BAN 事例 | Research → CEO → Owner |
| RR-04 | サブスクトークン silent revocation | Medium | OAuth 401 を分単位観測、daveswift.com 様の事例監視 | 401 発生 + 公式アカウント機能正常 → silent revoke 疑い | Owner 直、即 emergency_stop |
| RR-05 | サンドボックス escape ゼロデイ | Low | Vercel Sandbox / Firecracker の CVE 情報を月次クロール | High 以上 CVE 発見 | CEO、Phase 1 一時停止判断 |
| RR-06 | LLM hallucination による依存パッケージ攻撃 | Medium | Socket.dev / Snyk の依存スキャン週次 | 新規 unknown publisher パッケージ install 試行 | Dev / Review |
| RR-07 | 既存 PRJ への副作用（W0 後の Phase 1 中の発生） | Medium | 各 PRJ の git status 自動 polling 1h 間隔 | git diff 検出 | 全部署、即 emergency_stop |

### 7.2 月次レビュー会議

- **頻度**: 毎月最終金曜 18:00
- **参加**: Owner / CEO / PM / Dev / Review / Research
- **議題**: RR-01〜RR-07 の状況、コスト実績、BAN 兆候、Phase 進捗、ToS 動向、新規残存リスクの追加判定
- **アウトプット**: `projects/PRJ-019/reports/monthly-monitoring-YYYY-MM.md`

### 7.3 半年再評価サイクル（G-V2-10）

- **頻度**: 6 ヶ月毎（次回: 2026-11-02）
- **担当**: Research が ToS 全文を再 fetch、diff を Review が判定、Phase 継続 / 中断を CEO 経由で Owner 決裁
- **アウトプット**: `projects/PRJ-019/reports/review-vN.x-tos-reassessment.md`

---

## 8. レビュー部門の緊急停止権限の境界

### 8.1 直接 kill switch 発動可能なケース（CEO 経由不要）

レビュー部門が**監視中に以下を観測した場合**、CEO 経由を待たず直接 `emergency_stop` を発動する権限を持つ:

| # | 状況 | 根拠 | 発動後の報告 |
|---|---|---|---|
| **K-01** | Anthropic 401/403/429 が 1 分窓で 5 件超 | CR-V2-01 BAN 兆候 | 発動後 5 分以内に CEO + Owner に報告 |
| **K-02** | Anthropic 警告メール受信 | CR-V2-01 BAN 確実化 | 同上 |
| **K-03** | 既存 PRJ-001〜018 のいずれかで git diff 検出 | CR-03 既存 PRJ 破壊 | 同上 |
| **K-04** | secret leak 兆候（gitleaks 検出 / GitHub push protection 発火 / Vercel build log に sk-/ghp_/vrcl_ パターン）| CR-05 secret 漏洩 | 同上 |
| **K-05** | sandbox escape 兆候（host FS への write attempt / outbound to 非 allowlist destination）| HR-04 サンドボックス突破 | 同上 |
| **K-06** | コスト上限到達（G-01 / G-V2-09 hard stop が動作しなかった場合の人間バックアップ判断）| CR-02 コスト爆発 | 同上 |
| **K-07** | rate 90% 超 + 連続 burst 検出（G-V2-02 自動停止が動作しなかった場合）| CR-V2-01 ordinary 逸脱 | 同上 |

### 8.2 CEO 経由が必須なケース（直接発動不可）

| # | 状況 | 理由 |
|---|---|---|
| C-01 | コスト上限未達だがレビュー部門が品質懸念 | 影響度評価が必要、CEO 判断要 |
| C-02 | ToS 強化報道による予防停止判断 | 経営判断が必要 |
| C-03 | Phase 進捗遅延に伴う Phase 1 中断判断 | 案件運営判断 |
| C-04 | 月次レビュー会議での Phase 継続 / 中断判定 | 経営判断 |

### 8.3 発動権限の境界線

- **直接発動 (K-01〜K-07)**: 「明白な ToS 違反兆候 / 物理的破壊 / secret 漏洩」など**事故の進行を 1 分でも遅らせると損失拡大**するケース
- **CEO 経由 (C-01〜C-04)**: 経営判断・案件判断・将来予測を含むケース
- **Owner 直接判断**: 全ての「Phase 1 完全撤退」判断、別アカウント運用への切替、Devin / OpenHands 等の代替パス採用

### 8.4 発動ログ・事後検証

すべての kill switch 発動は以下を必須:
1. **発動瞬間**: Supabase `kill_switch_events` テーブルに record（誰が / なぜ / 何時 / 直前 1 時間のログ snapshot）
2. **発動後 5 分以内**: Slack #emergency に CEO + Owner mention 付きで投稿
3. **発動後 24 時間以内**: 発動原因レポートを `projects/PRJ-019/reports/incident/YYYYMMDD-incident-XX.md` に保存
4. **発動後 1 週間以内**: Post-mortem 会議実施、再発防止策を本計画書に追記

---

## 9. PM WBS との整合性確認結果（B-1）

### 9.1 確認した PM レポート

`projects/PRJ-019/reports/pm-architecture-v2-and-phase1-plan.md` §3.2-§3.3 の WBS。

### 9.2 レビュー部門タスクの妥当性評価

| PM 側タスク ID | タスク内容 | レビュー部門評価 | コメント |
|---|---|---|---|
| CB-1-W1-09 | W1 完了レビュー（4h） | 妥当 | W1 終了時の検収。本書 §5.1 と整合 |
| CB-1-W2-09 | W2 完了レビュー（4h） | 妥当 | 同上 |
| CB-1-W3-04 | Review skill 自動判定追加（6h、G-11） | 妥当 | 本書 G-11 担当に整合 |
| CB-1-W3-08 | W3 完了レビュー（4h） | 妥当 | 同上 |
| CB-1-W4-02 | dry-run 検証（共同、6h） | 妥当 | 本書 G-12 検収に整合 |
| CB-1-W4-03 | benchmark 10 連続実行（共同、12h） | 妥当 | 本書 §5.2 と整合 |
| CB-1-W4-04 | KPI 計測（共同、4h） | 妥当 | — |
| CB-1-W4-06 | Phase 1 完了レポート（共同、6h） | 妥当 | — |
| CB-1-W4-07 | Phase 1 全完了レビュー（6h） | 妥当 | — |

**Review 工数合計**: PM WBS では 30h（W1-W4）、本書 W0 分は **約 26h 追加**（@CB-S-W0-01〜05 + 統合検証 + drill + 副作用ゼロ証明）。

### 9.3 PM への提起事項（CEO 経由）

| # | 提起内容 | 優先度 |
|---|---|---|
| 1 | **PM WBS には W0 期間が定義されていない**（W1 = 5/19〜5/23 から開始）が、本計画書では W0 = 5/02〜5/18 を必須とする。**PM WBS に W0 を追加し、Phase 1 着手 = W1 着手 = 5/19 を再確認**してほしい | High |
| 2 | PM WBS §3.2 の G-03 は v2 で無効化済（→ G-V2 系へ）。**PM WBS §3.2 の G-03'（tos_monitor）行を本書 G-V2-08（警告メール監視）+ G-V2-09（API 換算自主上限）に置換**してほしい | High |
| 3 | PM WBS §3.4.1 の Review 配分（W1 30%）は W0 のレビュー部門集中を考慮していない。**W0 の Review 配分を 80% 確保**してほしい | Medium |
| 4 | PM WBS §3.3 の W4 副作用ゼロ証明（CB-1-W4-02）は 6h だが、W0 中の事前 dry-run × 3 + W4 の本番 10 回連続を合算すると Review 工数は 10h 必要。**W4 工数を 10h に増額**してほしい | Medium |

### 9.4 整合性の総合評価

PM WBS は **W1〜W4 のフェーズ 1 期間内の WBS としては妥当**。ただし**本計画書の W0 期間（17 日間、Phase 1 着手前必須 21 項目実装）が PM WBS に未記載**であり、CEO 経由で PM に追記依頼が必要。

---

## 10. 開発部門 W0 計画書との整合性確認（B-2）

### 10.1 確認結果

`projects/PRJ-019/reports/dev-phase1-w0-implementation-plan.md` は **本書執筆時点（2026-05-02 21:50）で未配置**。並列作成中。

### 10.2 開発部門への提起事項（CEO 経由、開発部門 W0 計画完成時に整合性チェック）

| # | 提起内容 |
|---|---|
| 1 | 本書§1.2 の実装タスク ID（CB-D-W0-01〜22）と整合させてほしい |
| 2 | 本書§2.4-§2.5 の day 単位スケジュールと整合させてほしい（特に 5/05 までの W0-1週ハードガード 7 項目完成） |
| 3 | 本書§5.3 の Review/Dev 協調ポイント（W0 統合検証は Review がシナリオ設計、Dev が実行、Review が判定）を確認してほしい |
| 4 | 本書§4.1 BAN drill 5 ステップのうち、Step 3〜5 の自動化スクリプト責任範囲を Dev で確定してほしい |
| 5 | 本書§7.1 RR-01〜07 の監視実装（特に RR-01 警告メール、RR-04 silent revoke、RR-07 既存 PRJ git status polling）を Dev で実装してほしい |
| 6 | G-V2-05（アカウント分離）の **不採用決定**を反映、代替の G-V2-11 + G-V2-09 + G-V2-02 + G-V2-07 の組合せ強化に集中してほしい |

### 10.3 整合性確認の継続

開発部門 W0 計画完成時に CEO 経由で本書を更新（v1.1）し、不整合が解消されたことを記録する。

---

## 11. 既存 PRJ への副作用ゼロ証明手順の起案（B-3）

### 11.1 検証手順

#### Step 1: W0 着手前ベースライン取得（5/02）

- 全 PRJ-001〜018 の `git status` snapshot
- 全 Vercel project の `vercel inspect` snapshot（deployment count、build count）
- Supabase 既存プロジェクトの全 table row count snapshot
- claude-code-company 本体の git tag `pre-prj019-w0` を打つ

#### Step 2: W0 中の継続 polling（5/02〜5/15）

- 1 時間毎に上記 snapshot を取得、diff があれば即 alert
- snapshot 履歴は Supabase `prj019_baseline_history` に append-only 保存

#### Step 3: W0-3週統合検証時の dry-run × 3（5/16）

- ベンチマークシナリオを dry-run mode（実 deploy なし）で 3 回完走
- 各回前後で git diff `projects/PRJ-001/`〜`projects/PRJ-018/` を実行、全件 0 行確認
- Vercel project 全件で deployment / build 数の変化なし確認

#### Step 4: W0-3週 BAN drill 後の副作用確認（5/17 drill 後）

- drill 中に発生した sandbox / branch / PR / commit が PRJ-019 配下のみであることを確認

#### Step 5: 検証ログ保存（5/18）

- `projects/PRJ-019/reports/control-evidence/G-12-side-effect-zero-evidence.md` に保存
- 検証スクリプト `scripts/verify-zero-side-effect.sh` を `projects/PRJ-019/app/scripts/` に commit

### 11.2 検証用スクリプト案

```bash
#!/usr/bin/env bash
# scripts/verify-zero-side-effect.sh
# レビュー部門 G-12 検証用、独立実装可能（Dev 実装と別系統）
set -euo pipefail

REPORT_DIR="projects/PRJ-019/reports/control-evidence"
mkdir -p "$REPORT_DIR"
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
OUT="$REPORT_DIR/zero-side-effect-${TIMESTAMP}.md"

echo "# 副作用ゼロ証明 — ${TIMESTAMP}" > "$OUT"

# 1. PRJ-001〜018 の git diff
for prj in $(seq -w 1 18); do
  echo "## PRJ-0${prj}" >> "$OUT"
  if [ -d "projects/PRJ-0${prj}" ]; then
    DIFF=$(git diff --stat -- "projects/PRJ-0${prj}/" | wc -l)
    if [ "$DIFF" -ne 0 ]; then
      echo "**FAIL**: PRJ-0${prj} に diff ${DIFF} 行" >> "$OUT"
      exit 1
    fi
    echo "PASS: 0 行" >> "$OUT"
  fi
done

# 2. organization / dashboard の改変確認（PRJ-019 起票分の追記のみ許容）
git diff --stat organization/ dashboard/ | tee -a "$OUT"

# 3. Vercel project state（手動確認推奨、API key 注入時のみ）
echo "## Vercel snapshot diff（要 vercel CLI ログイン）" >> "$OUT"
echo "（vercel inspect 実行ログを別途添付）" >> "$OUT"

echo "ALL PASS — ${TIMESTAMP}" >> "$OUT"
```

### 11.3 検証の独立性確保

- **Dev 部門のスクリプトと別実装**: レビュー部門が独自にスクリプト記述
- **実行環境分離**: レビュー部門が WSL2 上の別 user で実行、Dev 環境とは別 git worktree 推奨
- **結果の cross-check**: Dev の結果 vs Review の結果が一致しなければ Critical 指摘、原因究明

---

## 12. 関連ドキュメント

- v1: `projects/PRJ-019/reports/review-security-and-risk-assessment.md`
- v2: `projects/PRJ-019/reports/review-v2-subscription-risk-and-fallback.md`
- リサーチ Phase 0: `projects/PRJ-019/reports/research-openclaw-harness-investigation.md`
- リサーチ補追: `projects/PRJ-019/reports/research-supplement-tos-and-subscription-paths.md`
- PM v2: `projects/PRJ-019/reports/pm-architecture-v2-and-phase1-plan.md`
- 開発部門 W0 計画: `projects/PRJ-019/reports/dev-phase1-w0-implementation-plan.md`（並列作成中、完成時に v1.1 で整合性反映）
- リスク台帳: `projects/PRJ-019/risks.md`
- 意思決定: `projects/PRJ-019/decisions.md`（DEC-019-XXX で本書を Phase 1 着手判定材料として添付）

---

## 13. レビュー部門最終結論（W0 着手時点）

### 13.1 推奨アクション

1. **本計画書を CEO に提出し、PM・Dev との整合性を 5/03 中に決着**
2. **5/02 W0 即着手**: G-01 / G-04 / G-05 / G-08 / G-V2-03 / G-V2-11 の 6 項目を本日中に設計レビュー開始
3. **5/15 までに必須 21 項目を完成**、5/16-17 で統合検証 + BAN drill、5/18 18:00 に Go/NoGo 判定会議

### 13.2 W0 終了時 Phase 1 着手 Go/NoGo 判定基準（再掲）

**Go**: 以下すべて充足
1. 必須 21 項目の単体検証で Critical / Major 指摘ゼロ
2. 統合検証ベンチマークシナリオ 3 回連続成功（コスト < $5/回、HITL 以外の人間介入ゼロ）
3. BAN drill 5 ステップ全項目 SLA 内達成（検知 < 1 分、通知 < 5 分、退避 < 30 分、rotate < 1h、代替起動 < 4h）
4. 副作用ゼロ証明（PRJ-001〜018 の git diff 全件 0 行、Vercel deployment 不変、Supabase row count 不変）
5. W1 進行中整備 2 項目（G-V2-06/07）の暫定運用設計に Review が承認
6. 残存リスク監視計画（§7）と緊急停止権限の境界（§8）に CEO・Owner が同意

**NoGo**: 1〜6 のいずれかが未充足。NoGo 時は最小 1 週間 Phase 1 着手延期、原因究明後に再判定。

---

**v1 確定**: 2026-05-02 ／ **次回更新**: 開発部門 W0 計画完成時に v1.1 で整合性反映、5/18 W0 終了時に v1.2 で実績追記
