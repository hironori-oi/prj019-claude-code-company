最終更新: 2026-05-03 / 起案: 秘書部門

# PRJ-019 5/8 検収会議 Dev デモ進行台本（10 分枠 / 1 分粒度）

- 案件: PRJ-019「Clawbridge」
- 文書種別: 進行台本（運営現場用、議事進行 = 秘書 / 操作 = Dev）
- 上位文書: `secretary-agenda-v6.md` §2 / §5(d'+ε)、`decisions.md` DEC-019-039（Dev scaffold 実機デモ 10 分枠採択）
- 関連文書: `secretary-agenda-v6-resolutions-15.md` 議決-3 / 議決-7 / 議決-8、`app/README.md`（W0-Week1/Week2 scaffold 範囲）
- 配布: 5/7 22:00 同梱配布、Dev には 5/7 18:00 dry-run 実施

---

## §1 タイミング配置

| 項目 | 内容 |
|---|---|
| 全体枠 | 5/8 18:00-20:00 検収会議 120 分 |
| 本デモ枠 | **5/8 18:35-18:45 JST（10 分厳守）** |
| 直前 | §2 W0-Week1 進捗報告（18:00-18:15、Dev 5 分パートを §2.1 で完了） |
| 直後 | §3 Owner-in-the-loop Phase 1 Go/NoGo 議決 25 分（18:45-19:10） |
| 議題 v6 上の位置付け | §2 と §3 の遷移時間に「§2.5 Dev scaffold 実機デモ」を新規挿入。§5(d'+ε) 透明性 Dashboard 12 分の前置確認として機能 |
| 時間オーバ時の対処 | 9:30 時点で進捗未達なら §6 質疑応答に持ち越し、デモは 10 分で必ず切り上げ |

注: 議題 v6 §10 合計時間検算の「128 分内に圧縮」運用枠を本デモで使用。120 分以内厳守は維持。

---

## §2 デモ目標（3 つ）

1. **scaffold 完成度可視化**: W0-Week1/Week2 で実装済みの 4 層防御 + 8 テーブル + 95 tests 緑を Owner に物理視認させ、Phase 1 着手 5/26 Conditional Go 条件 (1) P-UI-01〜09 5/25 完遂の地ならしを可視化する。
2. **Phase 1 W1 前倒し進捗**: dev-w0-week2-prop-gen-and-dashboard.md 1,910 行の前倒し成果を実機で確認し、W1 着手後の Dev 工数 28.5 d が 4 週間 × 2 名で収束可能であることを Owner に体感させる。
3. **5 部署統合性証明**: Dev / Research / PM / Marketing / Review が DEC-019-033 5 点統合で同一 scaffold に収束していることを示し、議決-1（5 点統合採用）への Owner 承認を心理的に後押しする。

---

## §3 進行台本（1 分単位）

進行担当 = 秘書、操作担当 = Dev。秒読みは秘書が行い、Dev は事前合意のシナリオ通り操作のみ実行する。

### 0:00-0:30 イントロ（30 秒）
- **秘書**: 「§2.5 Dev scaffold 実機デモを始めます。10 分枠、進行は秘書、操作は Dev、目標 3 点（scaffold 完成度 / W1 前倒し / 5 部署統合性）です」
- 共有画面切替: Zoom にて Dev が画面共有開始、秘書はストップウォッチを 10:00 でスタート
- Owner / 各部署リーダーに「割り込み質疑は §6 質疑応答にまとめて吸収」と事前合意

### 0:30-2:00 Next.js 初期化 + 起動（90 秒）
- **Dev**: ターミナルで `cd projects/PRJ-019/app && pnpm install` を事前完了済の状態から `pnpm --filter web dev` 実行
- **Dev**: ブラウザで `http://localhost:3000` を表示、App Router の placeholder ページ確認
- **Dev**: package.json / tsconfig.json / next.config.ts を VSCode で順次表示し monorepo 構成を 30 秒で説明
- **秘書**: 「2:00 経過、次セクションへ」と読み上げ
- 想定リスク: pnpm 初期化失敗 → §5 ブロッカー対応 SOP L1 へ

### 2:00-3:30 Supabase 8 テーブル + RLS Policy 確認（90 秒）
- **Dev**: `supabase/migrations/` 配下 8 ファイル（hitl_requests / audit_log / policy_versions / policy_audit_log / proposals / cost_ledger / runtime_wrapper_state / knowledge_extraction_queue）を順次表示
- **Dev**: `supabase/policies/` 配下 RLS policy SQL 8 ファイルを表示、`hitl_requests` の RLS で「Owner のみ insert/update 可」を強調
- **Dev**: Supabase ダッシュボード（local supabase または preview env）で 8 テーブル存在と RLS Enabled を視認
- **秘書**: 「3:30 経過、Casbin policy へ」

### 3:30-5:00 Casbin policy + 13 prohibited domains 永遠 deny envelope 実演（90 秒）
- **Dev**: `policies/casbin/model.conf` 表示（RBAC + ABAC モデル）
- **Dev**: `policies/casbin/policy.csv` を表示し、13 prohibited domains の deny envelope 行（評価最優先）を強調
- **Dev**: ターミナルで `pnpm --filter harness test casbin-deny-envelope` を実行、13 ドメイン全件 deny + Owner override 不可（議決-11 外部 import 無効化との整合）を Pass で確認
- **秘書**: 「5:00 経過、audit_log hash chain へ」
- 想定リスク: テスト failure → §5 SOP L2 へ

### 5:00-7:00 audit_log SHA-256 hash chain 動作デモ + 改ざん検知（120 秒）
- **Dev**: `web/src/lib/audit/hash-chain.ts` の verify 関数を表示
- **Dev**: ターミナルで `pnpm --filter web test hash-chain` を実行、正常系の hash chain Pass を確認（10 件連結検証）
- **Dev**: 改ざん検知シナリオ: ローカル DB の 5 件目 `payload` を 1 文字書き換え → verify 関数で「chain broken at index 5」エラー出力を視認
- **Dev**: Postgres trigger `audit_log_compute_hash` の自動 hash 生成も併せて表示（service_role key を subprocess に渡さない方針との整合）
- **秘書**: 「7:00 経過、UI 巡回へ」
- これは議決-8 R-019-15 priviledge escalation 赤格付け公式化への直接対応エビデンス

### 7:00-8:30 Dashboard / Permissions UI 巡回（90 秒）
- **Dev**: 透明性 Dashboard（PRJ-020 同居実装の placeholder）を表示、policy_versions / cost_ledger / hitl_requests の 3 panel を視認
- **Dev**: Permissions UI（7 カテゴリ細粒度、Owner のみ変更可）を表示、TOTP 二要素認証モーダル（議決-12 連動）を実演
- **Dev**: kill switch ボタン（TOTP 省略許可）と通常 policy 変更（TOTP + 5 秒 cool-down + 確認モーダル三重ガード）の差を視認
- **秘書**: 「8:30 経過、Open Issue 解決状況へ」

### 8:30-9:30 Open Issue 3 件解決状況（60 秒）
- **Dev**: 3 件の Open Issue を 1 件 20 秒で報告
  1. CB-D-W0-03 ADR 4 件起票: 5/7 中に 4 件起票完了見込（うち 2 件 draft）
  2. CB-D-W0-06 `claude -p` 本人 OAuth 動作確認: 5/9（W0-Week2 中盤）スケジュール、Pre-Phase Week 5/19 までに完遂
  3. verify-zero-side-effect.sh 完成: W0-Week2 末（5/15）完成、既存 PRJ-001〜018 への副作用ゼロ継続検証
- **秘書**: 「9:30 経過、結論と質疑へ」

### 9:30-10:00 質疑応答 + 結論（30 秒）
- **秘書**: 「scaffold 完成度 / W1 前倒し / 5 部署統合性の 3 目標すべて達成。詳細質疑は §6 で吸収します。デモを終了します」
- **Dev**: 画面共有停止
- **秘書**: ストップウォッチ停止、議事録に「Dev デモ 10:00 完遂、目標 3/3 達成」を記録
- 即時 §3 Owner-in-the-loop Phase 1 Go/NoGo 議決へ遷移

---

## §4 デモ前環境準備（5/8 8:30 までに Dev が完了）

| # | 項目 | 担当 | 完了期限 |
|---|---|---|---|
| 1 | `pnpm install` 完了 + node_modules キャッシュ済 | Dev | 5/8 7:00 |
| 2 | `pnpm typecheck && pnpm test && pnpm lint` 全件緑（95 tests 想定） | Dev | 5/8 7:30 |
| 3 | Supabase local stack 起動 + 8 migration 適用済 | Dev | 5/8 8:00 |
| 4 | ブラウザ事前 warmup（`http://localhost:3000` 1 度表示） | Dev | 5/8 8:15 |
| 5 | VSCode 該当ファイル 8 件をタブ open 済 | Dev | 5/8 8:20 |
| 6 | Zoom 画面共有テスト（音声含む） | Dev + 秘書 | 5/8 8:30 |
| 7 | バックアップ録画端末（スマホ）準備 | 秘書 | 5/8 8:30 |
| 8 | dry-run（5/7 18:00、所要 10 分、本台本通り通し） | Dev + 秘書 | 5/7 19:00 |

dry-run 結果は 5/7 22:00 配布前に CEO に報告、議題 v6 配布最終確認に組み込む。

---

## §5 デモ中ブロッカー対応 SOP（3 段階 escalation）

| Lv | トリガー | 対応 | 所要 |
|---|---|---|---|
| **L1** | コマンド失敗 / UI 表示遅延 | Dev が 30 秒以内に再試行 1 回。秘書はタイマー継続、Owner には「軽微な再実行」のみ口頭通知 | 30 秒 |
| **L2** | 再試行も失敗 / テスト 1 件 failure | Dev が screenshot / 録画済デモ動画にフォールバック。秘書は「事前録画に切替えます」を読み上げ。CEO に Slack DM `#prj-019-demo` で 1 行報告 | 60 秒 |
| **L3** | 環境壊滅 / Supabase 接続不能 / 録画動画も再生不能 | デモ即中断、秘書が「§6 質疑応答に持ち越し」を宣言、§3 議決へ即遷移。Dev は別途 5/8 21:00 までに復旧報告 + 翌 5/9 朝に Owner へ補完デモ動画送付 | 即時 |

L2 / L3 は議事録に「ブロッカー Lv X 発生、対応完了 / 持ち越し」と明記。議決-1 / 議決-2 採決には L3 でも影響させない（scaffold 物理存在は事前確認済のため、デモ実演失敗 ≠ 採決根拠喪失）。

---

## §6 デモ後 5 部署クロスチェック確認事項

デモ終了後、§3 議決前に以下 3 議決への影響を秘書が口頭サマリで確認する。

| 議決 | 確認事項 | 確認担当 | 想定回答 |
|---|---|---|---|
| 議決-3（Phase 1 完了 6/20 + Marketing 公開 6/27 朝） | scaffold 進捗から 6/20 完遂が現実的か | PM + Dev | YES（W0-Week1 95 tests / W2 前倒し 1,910 行で順調） |
| 議決-7（BAN drill #3 5/29 実施承認） | scaffold 上で 5 シナリオ（PE-01/03/04/06/08）動作前提が満たされているか | Review + Dev | YES（hash chain + RLS + Casbin deny envelope 全実装済） |
| 議決-8（R-019-15 priviledge escalation 赤格付け公式化） | 4 層防御物理実装が scaffold で確認できたか | Review | YES（L1 deny envelope / L2 FeatureFlag / L3 HITL-10 / L4 hash chain 視認済） |

3 件いずれも YES 確認後に §3 議決開始。NO が 1 件でもあった場合は CEO 即決ルートで §6 質疑応答時に再評価。

---

## §7 録画 / 議事録方針（DEC-019-033 透明性ダッシュボード公開対象）

| 項目 | 方針 |
|---|---|
| 録画 | Zoom cloud recording 有効化、デモ枠（10 分）は分離 chapter として保存。バックアップは秘書のスマホで物理録画 |
| 議事録 | 秘書がリアルタイム記録、`projects/PRJ-019/reports/secretary-58-minutes.md` に 5/9 18:00 までに配布 |
| 公開対象 | 議決-1 採決後、透明性 Dashboard（DEC-019-033 §③）に Phase 1 W1 公開予定。PII redaction（HITL 第 11 種 `knowledge_pii_review` 想定）を経て公開 |
| 非公開部分 | Owner 個人情報 / Anthropic 別アカウント情報 / Supabase service_role key 関連の発話は redaction（`[REDACTED]` 化） |
| 改ざん防止 | 議事録は audit_log SHA-256 hash chain（デモ §3 5:00-7:00 で実演したもの）に登録、改竄検知可能化 |
| 視聴期限 | 録画は Phase 2 完了（8/1 想定）まで保持、以降は議事録のみ恒久保存 |

公開可否の最終判断は CEO + Owner、議決-1 採択時に「録画公開を含む透明性 Dashboard 運用」が同時承認される構造。

---

## §8 配布前確認事項（秘書部門）

- [x] 進行台本（本ファイル）作成
- [ ] 5/7 18:00 Dev dry-run 実施 + 結果反映
- [ ] 5/7 22:00 議題 v6 + 議決詳細 + 本台本 + ブロッカー SOP の 4 点同梱配布
- [ ] 5/8 8:30 Dev 環境準備完了確認
- [ ] 5/8 18:35 デモ枠開始合図（CEO 進行から秘書へ）

---

**台本確定**: 10 分枠厳守、ブロッカー L3 でも §3 議決に影響させない設計、5 部署クロスチェック 3 議決連動。
