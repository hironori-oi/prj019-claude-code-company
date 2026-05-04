# PRJ-019 W0-1週 単体検証チェックリスト（必須コントロール 7 項目）

- 案件: PRJ-019「Clawbridge（仮）」 — Open Claw を自律オーナーとする AI 組織ハーネス基盤
- 部署: レビュー部門（品質管理）
- 作成日: 2026-05-03
- 作成者: Review Agent (claude-code-company)
- 期間: W0-1週 = 2026-05-02 (金) 〜 2026-05-08 (木)
- 対象: ハードガード基盤 7 項目（G-01 / G-04 / G-05 / G-06 / G-08 / G-V2-03 / G-V2-11）
- 関連: `review-control-implementation-plan.md` v1 / `review-option-a-additional-controls.md` v1 / `dev-phase1-w0-implementation-plan.md` v1

## 0. 文書の位置づけ

### 0.1 目的
- 開発部門が並列実装中の W0-1週ハードガード基盤 7 項目に対して、**実装が出揃った時点で即座に検証を開始できる**よう、検証手順 / 合否基準 / 検収方法を事前確定する。
- 各検証項目を 「実装非依存（先行可能）／ 実装後（コードレビュー級）／ 結合後（統合検証）」 の 3 区分に分けて、**検証着手のタイミング**を明示する。

### 0.2 注意
- 開発部門の実装成果物 (`projects/PRJ-019/app/harness/src/`) の存在を**前提にしない**。各項目は「実装到着 → 即時発動できる手順書」として書く。
- レビュー部門は実装に直接手を入れない。指摘のみ起票し、修正は開発部門が行う（review.md ロール定義準拠）。

### 0.3 W0-1 週開発スケジュールとの対応
| Day | Dev 実装到達点 | Review 検証着手 |
|---|---|---|
| 5/02 (金) | G-01 / G-04 / G-05 / G-V2-03 / G-V2-11 設計開始、G-08 着手 | 文書レビューのみ（IND-DOC-01〜04） |
| 5/05 (月) | G-08 完了、G-V2-11 完了、G-V2-03 hook 実装、G-04 HITL 5 ゲート完了 | A2 / A3 / A4 / A6 / A7 着手（先行検証可能項目から） |
| 5/06 (火) | G-06 シェル allowlist 完成 (※Dev 計画では G-V2-01) | 同上継続 |
| 5/07 (水) | G-02 emergency_stop skill 着手 (G-V2-11 = kill-switch 観点では本書 A8 と連動) | A8 動作確認準備 |
| 5/08 (木) | 7 項目すべての単体検証目処 | A1〜A8 全項目 PASS / FAIL 判定、§C のレビュー会議へ |

---

## 1. A1. 各コントロール項目の検証手順表

### 1.1 7 項目サマリ

| ID | 名称 | 対応開発実装（想定パス） | 単体テスト合否基準 | 統合シミュレーション合否基準 | ペネトレーション風シナリオ | レビュー部門の検収方法 | W0-1週達成必須 / W1 進行可 |
|---|---|---|---|---|---|---|---|
| **G-01** | コスト上限 4 層ハードキャップ | `harness/src/cost-tracker.ts` (※Dev 計画では `cost_check.ts`) | 各層の境界値前後で `checkBudget()` が想定通り stop / warn を返す | 4 層同時稼働時に最も低いキャップが先に発火 | B1 暴走 API 呼び出し | コードレビュー + Vitest 実行 + シミュレーション | **W0-1週達成必須** |
| **G-04** | 公開前人間承認ゲート (HITL) | `harness/src/hitl-gate.ts` (Dev 計画では `hitl_gate.ts`) | 5 種 action すべてで未承認 → block、24h timeout で reject | Slack 承認連携時の race condition なし | B4 HITL バイパス試行 | コードレビュー + 動作確認 (テスト Slack ch) + audit log 検証 | **W0-1週達成必須** |
| **G-05** | FS 書込 allowlist | `harness/src/fs_allowlist.ts` + `harness/config/fs_allowlist.json` | `projects/PRJ-019/app/**` 以外への write 試行が block | 既存 PRJ-001〜018 への副作用ゼロ確認 | B2 FS 破壊試行 | 動作確認 + git diff + パストラバーサル試行 | **W0-1週達成必須** |
| **G-06** | 月次予算 ($300 hard cap) | Anthropic Console / OpenAI Platform / Vercel spend cap 設定 + `harness/src/cost-tracker.ts` | $300 cap が Console 側で実設定済、80% で warn、100% で stop | cost-tracker からの 3 サービス cap 集計が一致 | B1 と同じ | Console screenshot + 実消費ログ照合 | **W0-1週達成必須**（Console 設定はオーナー残タスク） |
| **G-08** | secret 隔離 (Tier-S0〜S4 / Doppler) | `harness/src/secret_isolation.ts` + Doppler 統合 | ハーネス層の env / process / FS から secret が読めない設計確認、ダミー secret で動作確認 | sandbox 内 `env \| grep ANTHROPIC` で空 | B3 secret 漏洩試行 | コードレビュー + ペネトレーション試行 + git-secrets / truffleHog スキャン | **W0-1週達成必須** |
| **G-V2-03** | サーキットブレーカ + OAuth 直 spawn 禁止 grep | `harness/src/circuit-breaker.ts` + pre-commit hook | open → cooldown → half-open → closed の遷移、grep hook で `oauth` / `keychain` 等を検出 | 401/403/429 連続検知時 → open 状態で kill-switch 触発 | B6 BAN 模倣 → フォールバック | コードレビュー + Vitest + pre-commit hook 動作確認 | **W0-1週達成必須** |
| **G-V2-11** | 緊急停止スイッチ + OAuth トークン到達禁止 | `harness/src/kill-switch.ts` + `harness/src/usage-monitor.ts` + OS ユーザー隔離 (C-A-05 と連動) | ファイル signal `~/.clawbridge/STOP` 発動、12h 連続稼働で自動触発、cleanup hook 実行 | 全 child process SIGKILL 確認、< 30 秒 SLA | B5 連続稼働超過 + B6 BAN 触発 | 動作確認 (kill drill) + 子プロセス監視 + ペネトレーション (OAuth 到達不可) | **W0-1週達成必須** |

### 1.2 検証区分（実装依存度）

| 区分 | 対象 | 検証着手タイミング |
|---|---|---|
| **先行可能（実装非依存）** | 仕様レビュー / 文書レビュー / シミュレーション設計 | 5/03 (土) から着手可 |
| **コードレビュー級（実装後）** | スケルトン到着で着手可、Critical/Major 指摘起票 | 各実装到着後 24h 以内 |
| **結合後（統合検証）** | 7 項目同時稼働、ペネトレーション、kill drill | 5/07 (水) 〜 5/08 (木) に集中 |

---

## 2. A2. G-01 コスト上限 4 層ハードキャップ 検証手順

### 2.1 仕様確認
- 4 層: **(L1) $5/セッション、(L2) $50/案件、(L3) $30/日、(L4) $300/月**
- 各層の境界値前後で `checkBudget()` が想定通り stop / warn を返すこと
- 同時複数セッションでの集計の整合性
- 月境界をまたぐケース（5/31 23:59 → 6/01 00:00）の counter リセット
- データ永続化 `~/.clawbridge/cost-ledger.json` の整合性 (read-modify-write race condition なし)

### 2.2 単体テスト合否基準（Dev 提出 `cost-tracker.test.ts` の確認項目）
| # | テストケース | 期待動作 |
|---|---|---|
| UT-G01-01 | L1 $4.99 → $5.00 → $5.01 | $4.99 OK / $5.00 stop / $5.01 stop |
| UT-G01-02 | L2 $49.99 → $50.00 → $50.01 | $49.99 OK / $50.00 stop / $50.01 stop |
| UT-G01-03 | L3 $24.00 (80%) → $30.00 → $30.01 | $24.00 warn / $30.00 stop / $30.01 stop |
| UT-G01-04 | L4 $240.00 (80%) → $300.00 → $300.01 | $240.00 warn / $300.00 stop / $300.01 stop |
| UT-G01-05 | 同時 3 セッションで合計 $51 | L2 で stop |
| UT-G01-06 | 5/31 23:59 で $29 → 6/01 00:00 で $1 | L3 / L4 とも reset 後 $1 のみ計上 |
| UT-G01-07 | cost-ledger.json への並行書込 (10 並列) | race condition なし、合計値が正しい |
| UT-G01-08 | cost-ledger.json 不在時の起動 | 自動初期化、初期値 $0 |
| UT-G01-09 | cost-ledger.json 壊れ JSON | 壊れ検出 → backup → 初期化 + alert |

### 2.3 統合シミュレーション合否基準
- **シナリオ G01-INT-01**: 4 層同時稼働。低い cap が先に発火することを確認。
  - $4.50 (L1 90%) / $45 (L2 90%) / $27 (L3 90%) / $270 (L4 90%) 同時状態で 1 タスク追加 $0.51 → L1 stop が最先
- **シナリオ G01-INT-02**: cost-tracker と Anthropic Console / OpenAI Platform / Vercel spend cap の集計差分が ±5% 以内
- **シナリオ G01-INT-03**: G-V2-11 kill-switch との連動。L4 100% 到達 → kill-switch 自動触発 → 全 child SIGKILL

### 2.4 検収方法
1. Dev 提出の `cost-tracker.ts` をコードレビュー（Critical/Major 指摘ゼロ確認）
2. Dev 提出の `cost-tracker.test.ts` を Review 環境で `vitest run` 実行、UT-G01-01〜09 全 PASS 確認
3. Review 独自シミュレーション スクリプト（合成 cost log 流し込み）で再検証
4. cost-ledger.json の append-only 性 (chmod 644 + 暗号化 hash chain) の確認

---

## 3. A3. G-04 HITL ゲート 検証手順

### 3.1 仕様確認
- 5 種 action: **(1) public_release, (2) paid_api_call, (3) force_push, (4) prod_deploy, (5) external_api**
- 24h timeout でデフォルト reject の動作
- file based 承認 (`~/.clawbridge/approvals/<request_id>.json`) の race condition なし
- 承認・却下の audit log 記録 (Supabase append-only `hitl_events`)

### 3.2 単体テスト合否基準
| # | テストケース | 期待動作 |
|---|---|---|
| UT-G04-01 | 5 種 action それぞれで未承認 request 生成 | block、Slack 通知発火、approval ファイル作成待ち |
| UT-G04-02 | 5 種 action それぞれで approval ファイル投入 | proceed、audit log 記録 |
| UT-G04-03 | 24h timeout（時刻偽装で 24h+1s 経過） | デフォルト reject、reject ログ記録 |
| UT-G04-04 | approval ファイル race（同時 2 プロセスから approve / reject） | どちらか一方が確定、もう一方は audit log にエラー記録 |
| UT-G04-05 | 不正な approval ファイル（schema 違反、署名なし） | block、tampering alert |
| UT-G04-06 | 承認者 ID + 承認理由 + 承認時刻が必須記録 | 全項目記録、欠損時は invalid 扱い |

### 3.3 統合シミュレーション合否基準
- **シナリオ G04-INT-01**: Slack 経由 approve → 1 分以内にハーネス側で proceed
- **シナリオ G04-INT-02**: 5 種 action を同時に発生させ、5 件の Slack 通知が分離して届くこと
- **シナリオ G04-INT-03**: B4 バイパス試行（後述 §B.B4）で必ず block

### 3.4 検収方法
1. `hitl_gate.ts` コードレビュー
2. テスト Slack channel で 5 種 action の手動 approve / reject 動作確認
3. 24h timeout は時刻偽装テスト（`SystemTime` mock）で確認
4. audit log の append-only RLS 確認 (Supabase 別アカウントで delete 試行 → 拒否)

---

## 4. A4. G-05 FS 書込 allowlist 検証手順

### 4.1 仕様確認
- ハーネス層は **`projects/PRJ-019/app/**`** と **`~/.clawbridge/`** にのみ write 可
- `projects/PRJ-001〜018/`、`organization/`、`dashboard/`（PRJ-019 関連追記を除く）は read-only
- パストラバーサル攻撃（`../../etc/passwd`、symlink 経由、`%2e%2e/` 等の URL encode）を block

### 4.2 単体テスト合否基準
| # | テストケース | 期待動作 |
|---|---|---|
| UT-G05-01 | `projects/PRJ-019/app/test.txt` への write | OK |
| UT-G05-02 | `~/.clawbridge/state.json` への write | OK |
| UT-G05-03 | `projects/PRJ-005/test.txt` への write 試行 | block + audit log |
| UT-G05-04 | `organization/roles/dev.md` への write 試行 | block |
| UT-G05-05 | `../../etc/passwd` への write 試行 | block (パストラバーサル検知) |
| UT-G05-06 | `projects/PRJ-019/app/../PRJ-005/test.txt` | block (正規化後 PRJ-005 と判定) |
| UT-G05-07 | symlink 経由の書込 (`projects/PRJ-019/app/link → /etc/`) | block (symlink 解決後判定) |
| UT-G05-08 | `%2e%2e%2fPRJ-005%2ftest.txt` URL encode | block |
| UT-G05-09 | `.env`, `.env.local` 等 secret ファイル | 全パスで block |

### 4.3 統合シミュレーション合否基準
- **シナリオ G05-INT-01**: ベンチマークタスク dry-run 中に PRJ-001〜018 の git diff が全件 0 行
- **シナリオ G05-INT-02**: ハーネス再起動後も allowlist 設定が永続
- **シナリオ G05-INT-03**: `scripts/verify-zero-side-effect.sh` (Dev 提出) と Review 独自実装の結果一致

### 4.4 検収方法
1. `fs_allowlist.json` の policy 内容確認（review v2 §11.2 の検証スクリプト案と整合）
2. `fs_allowlist.ts` コードレビュー（特にパス正規化ロジック、symlink 解決）
3. Review 独自にレビュー部門用テストハーネスで PRJ-005 への write を 10 パターン試行 → 全件 reject 確認
4. git diff for `projects/PRJ-001..018/` 全件 0 行の自動確認スクリプト（独立実装）

---

## 5. A5. G-06 月次予算 検証手順

### 5.1 仕様確認
- 月次 $300 cap (Anthropic Max $200 + Codex Pro $100 + 余力)
- Anthropic Console の Spend Cap 設定 = $200（オーナー残タスク GO-06）
- OpenAI Platform の Spend Cap 設定 = $100
- Vercel Hobby 無料枠 + spend cap = $0（追加課金なし）
- 80% 到達でアラート、100% で停止

### 5.2 単体テスト合否基準
| # | テストケース | 期待動作 |
|---|---|---|
| UT-G06-01 | $240 (80%) 到達 | warn 通知発火、Slack + Telegram |
| UT-G06-02 | $300 (100%) 到達 | hard stop、kill-switch 触発、cron 停止 |
| UT-G06-03 | Anthropic Console から spend cap 達成イベント受信 | usage-monitor が検知、即停止 |
| UT-G06-04 | OpenAI Platform spend cap 達成 | 同上 |
| UT-G06-05 | ログ ($240 / $300 events) と alert の一致 | 1:1 対応、欠落なし |

### 5.3 統合シミュレーション合否基準
- **シナリオ G06-INT-01**: 月次累積 $240 → $300 の合成データ流し込みで warn → stop の遷移
- **シナリオ G06-INT-02**: G-01 (L4 = $300) と G-06 が同一 hard stop を共有することを確認 (二重実装でないこと)

### 5.4 検収方法（実装に依存しない部分）
1. **オーナー残タスク確認**: Anthropic Console で Spend Cap = $200 設定済の screenshot 取得 (5/18 までに完了)
2. **オーナー残タスク確認**: OpenAI Platform で Spend Cap = $100 設定済の screenshot 取得
3. usage-monitor.ts コードレビュー
4. C-A-04 使用量モニタリング検収と統合（5/12 期限）

### 5.5 W0-1週達成範囲
- **W0-1週中達成**: cost-tracker / usage-monitor の実装、$300 cap シミュレーション PASS
- **5/12 まで完成**: Console 設定の screenshot 提出 (オーナー残タスク)、C-A-04 使用量モニタリングと統合

---

## 6. A6. G-08 secret 隔離 検証手順

### 6.1 仕様確認
- ハーネス層の env / process / FS から secret が読めない設計
- Doppler 統合の動作（モック）— Anthropic API キー (フォールバック用) / OpenAI API キー / GitHub PAT / Vercel Token / Supabase service_role を Doppler 一元管理
- **OAuth トークンは Doppler に入れない**（C-A-05 §5.1: OS ユーザー単位の Credman/Keychain 隔離）
- ログ・コミット・公開コードへの secret 混入検出（git-secrets / truffleHog 風スキャン）

### 6.2 単体テスト合否基準
| # | テストケース | 期待動作 |
|---|---|---|
| UT-G08-01 | sandbox 内 `env \| grep -i ANTHROPIC` | 空 |
| UT-G08-02 | sandbox 内 `env \| grep -E 'sk-\|ghp_\|vrcl_'` | 空 |
| UT-G08-03 | sandbox 内 `cat ~/.aws/credentials` | not found / permission denied |
| UT-G08-04 | Doppler から API キー取得 (フォールバック発動時のみ) | 取得成功、それ以外は取得経路自体が無効 |
| UT-G08-05 | git commit に `sk-...` を含めて push 試行 | git-secrets で reject |
| UT-G08-06 | ログ出力に secret 混入 | ログ集約層で redact (`sk-***` 等) |
| UT-G08-07 | OAuth トークンが Doppler dump に含まれていない | dump ファイル grep で 0 件 |

### 6.3 統合シミュレーション合否基準
- **シナリオ G08-INT-01**: B3 secret 漏洩試行で全パターン block
- **シナリオ G08-INT-02**: フォールバック発動 (Anthropic 401 連続) → Doppler から API キー注入 → ハーネス層が API キーモードで稼働
- **シナリオ G08-INT-03**: `scripts/verify-zero-side-effect.sh` 実行時に `.env*` 系ファイルへの書込試行が全件 reject

### 6.4 検収方法
1. `secret_isolation.ts` コードレビュー (Tier-S0〜S4 設計)
2. Doppler ダッシュボード確認（OAuth トークン entry が**ない**ことを Review が独立検証、C-A-05 §5.3 #3 と統合）
3. git-secrets / truffleHog 風スキャン スクリプトを Review 独自に走らせ、過去 commit 全件で 0 hit 確認
4. ペネトレーション試行（C-A-05 §5.1.2 の 6 項目）を Review が直接実施、全件 access denied

---

## 7. A7. G-V2-03 サーキットブレーカ 検証手順

### 7.1 仕様確認
- 連続失敗で **closed → open → half-open → closed** の遷移
- 401/403/429 連続検知時 (1 分窓 5 件超) → open
- subprocess (Claude Code CLI) 起動失敗 5 件連続 → open
- API call 連続失敗 (timeout 含む) で発動
- open 状態で 5 分 cooldown 後 half-open に遷移、1 件成功で closed
- pre-commit hook で `User-Agent` / `oauth` / `keychain` / `credentials` / `billing-proxy` の grep 検出

### 7.2 単体テスト合否基準
| # | テストケース | 期待動作 |
|---|---|---|
| UT-V203-01 | 連続 5 件 401 (1 分窓内) | closed → open、kill-switch 触発 |
| UT-V203-02 | 連続 5 件 429 (1 分窓内) | 同上 |
| UT-V203-03 | 連続 4 件 401 + 1 件 200 | 連続性リセット、closed 維持 |
| UT-V203-04 | 連続 5 件 403 で open → 5 分待機 | half-open に遷移 |
| UT-V203-05 | half-open で 1 件成功 | closed に復帰 |
| UT-V203-06 | half-open で 1 件失敗 | open に戻り cooldown 倍化 |
| UT-V203-07 | subprocess spawn 連続 5 件失敗 | open |
| UT-V203-08 | pre-commit hook で `oauth` キーワード commit | reject |
| UT-V203-09 | pre-commit hook で `User-Agent` キーワード commit | reject |
| UT-V203-10 | pre-commit hook で正規表現がフォールスポジティブ | (例: `User-Agent` を含むドキュメント commit) → 許可リスト or 明示的な escape を要する設計を確認 |

### 7.3 統合シミュレーション合否基準
- **シナリオ V203-INT-01**: B6 BAN 模倣で circuit-breaker → kill-switch → BAN drill 手順発動の連鎖確認
- **シナリオ V203-INT-02**: API キーフォールバック切替が circuit-breaker open → 4h 以内完了

### 7.4 検収方法
1. `circuit-breaker.ts` コードレビュー（状態機械の遷移図と一致）
2. Vitest で `vi.useFakeTimers()` 使用、状態遷移を網羅
3. pre-commit hook を Review 独自にテスト文字列 5 種で発火確認

---

## 8. A8. G-V2-11 緊急停止スイッチ 検証手順

### 8.1 仕様確認
- ファイル signal `~/.clawbridge/STOP` 発動 (file watcher で 1 秒以内検知)
- 手動 CLI トリガー (`clawbridge stop` コマンド)
- 予算超過からの自動触発 (G-01 / G-06 連動)
- 連続稼働 12h からの自動触発 (usage-monitor 連動)
- 触発時の cleanup hook 実行確認 (audit log flush, sandbox destroy, lock file release)
- すべての子プロセスが SIGKILL されることの確認 (< 30 秒 SLA)
- OAuth トークン到達禁止 (C-A-05 と統合): ハーネス user から `~/.config/claude/credentials.json` 等が permission denied

### 8.2 単体テスト合否基準
| # | テストケース | 期待動作 |
|---|---|---|
| UT-V211-01 | `~/.clawbridge/STOP` 作成 | 1 秒以内に kill-switch 発動 |
| UT-V211-02 | `clawbridge stop` 手動実行 | 即時発動 |
| UT-V211-03 | G-01 L4 hard stop イベント受信 | 自動触発 |
| UT-V211-04 | usage-monitor から「12h 連続稼働」通知 | 自動触発 |
| UT-V211-05 | 子プロセス 5 件存在状態で発動 | 全 5 件が 30 秒以内に SIGKILL |
| UT-V211-06 | 発動時に audit log flush hook が実行 | flush 完了まで kill 待機 |
| UT-V211-07 | 発動時に Vercel Sandbox destroy が実行 | sandbox 全件 destroy |
| UT-V211-08 | OAuth credentials への read 試行（ハーネス user） | permission denied |
| UT-V211-09 | OAuth credentials への read 試行（オーナー本人 user） | OK (隔離が user 単位で動作) |

### 8.3 統合シミュレーション合否基準
- **シナリオ V211-INT-01**: B5 連続稼働超過 (時刻偽装で 12h+1s) → kill-switch 自動触発 → 全停止 < 30 秒
- **シナリオ V211-INT-02**: B6 BAN 模倣 → circuit-breaker open → kill-switch 触発 → BAN drill Step 1〜2 SLA 達成
- **シナリオ V211-INT-03**: 月次 kill drill（review-control-implementation-plan §1.2 G-02）で 30 秒以内全停止 + cron 停止 + OAuth セッション停止

### 8.4 検収方法
1. `kill-switch.ts` + `usage-monitor.ts` コードレビュー
2. Review が直接 `~/.clawbridge/STOP` を作成 → タイマー計測 (1 秒以内検知 / 30 秒以内全停止)
3. C-A-05 ペネトレーション試行 6 項目（review-option-a-additional-controls §5.3 #2）を Review が独立検証
4. cleanup hook の実行ログを Review が独立確認

---

## 9. W0-1週終了時 (5/8 18:00) 想定検収サマリ

### 9.1 PASS 想定の項目数
- **5/8 終了時に PASS 想定 = 5 項目** （G-04, G-05, G-08, G-V2-03, G-V2-11）
- **5/8 時点で部分 PASS（W0-2 週で確定）= 2 項目**
  - G-01: 単体テスト PASS、ただし $300 月次キャップ実消費との突合は C-A-04 (5/12) 後
  - G-06: コードレビュー PASS、ただし Console Spend Cap screenshot 提出はオーナー残タスク (5/18 まで)

### 9.2 W0-2 週への持ち越し（PASS 不要、確定はその後）
- G-01 / G-06 の Console 設定 screenshot 提出（オーナー）→ C-A-04 と同期
- G-08 の Doppler 実 secret 投入（W0-2 週で本実装、W0-1 週はモックで検証）
- G-V2-03 pre-commit hook の本番 repo 適用（W0-1 週末に実施推奨）

### 9.3 検収判定マトリクス
| 5/8 時点の状態 | レビュー判定 |
|---|---|
| 7 項目すべて Critical/Major ゼロ | **W0-1 週 検収 PASS**、W0-2 週へ進行 Go |
| 1〜2 項目で Major 残存、Critical なし | **条件付き Pass**（修正後再レビュー不要、W0-2 週で対応） |
| 1 項目でも Critical 残存 | **差し戻し**、W0-2 週への進行を 3 日延期し再レビュー |
| 3 項目以上で Major | **差し戻し**、W0-2 週進行 NoGo |

---

## 10. 関連ドキュメント

- 必須コントロール実装計画: `projects/PRJ-019/reports/review-control-implementation-plan.md`
- オプション A 追加コントロール: `projects/PRJ-019/reports/review-option-a-additional-controls.md`
- ToS allowlist/blocklist: `projects/PRJ-019/reports/review-tos-domain-allowlist-blocklist.md`
- 開発部門 W0 計画: `projects/PRJ-019/reports/dev-phase1-w0-implementation-plan.md`
- ペネトレーション風シナリオ: `projects/PRJ-019/reports/review-w0-week1-pentest-scenarios.md`
- W0-1週レビュー会議アジェンダ: `projects/PRJ-019/reports/review-w0-week1-meeting-agenda.md`

---

**v1 確定**: 2026-05-03 / **次回更新**: 5/8 W0-1 週終了時に v1.1 で実績反映
