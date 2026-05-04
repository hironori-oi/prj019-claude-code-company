# PRJ-019 Clawbridge — W0 1 週目 実装報告 (dev)

- 案件: PRJ-019 Clawbridge (Open Claw 駆動の自律 AI 組織ハーネス基盤)
- 担当: 開発 (`/dev`)
- 対象期間: 2026-05-02 〜 2026-05-08 (Phase 1 / W0 / 1 週目)
- 報告日: 2026-05-03
- 報告先: CEO (経由でオーナー)

---

## 1. 着地サマリ

| 項目 | 状況 |
|------|------|
| Monorepo セットアップ (TypeScript + pnpm workspaces 7 packages) | 完了 |
| Harness 制御層 (cost-tracker / kill-switch / hitl-gate / circuit-breaker / usage-monitor) | 完了・全 38 ユニットテスト緑 |
| claude-bridge (spawn / stream-json-parser / auth-detector) | 完了・全 29 ユニットテスト緑 |
| pnpm install / typecheck / vitest 全通過 | 通過 (8 ファイル / 67 テスト緑) |
| openclaw-runtime ラッパ実装 | 未着手 (W0 2 週目に持ち越し) |
| docs/architecture-w0.md / docs/security-w0.md / app/README 更新 | 未着手 (W0 2 週目に持ち越し) |
| Live integration test (実機 Claude Code) | 雛形のみ未配置 (W0 2 週目で実機 1 回検証予定) |

**合計テスト**: 8 ファイル / 67 ケース / 全緑 (Windows 11 / Node 24.11.1 / pnpm 9.12.0 上で確認)。

NG-W0-01 (claude-bridge spawn 不在で W0 完了は不可) は **解消済み**。NG-1 (OAuth 自動起動) は仕様レベル / 実装レベル両方で回避設計を確認済み。

---

## 2. 成果物 (ファイルパス)

### 2.1 Monorepo ルート

- `projects/PRJ-019/app/package.json` — `@clawbridge/root` (pnpm workspace, Node >=22.14.0, pnpm@9.12.0)
- `projects/PRJ-019/app/pnpm-workspace.yaml` — 7 ワークスペース定義 (harness / claude-bridge / openclaw-runtime / orchestrator / sandbox / audit / notify)
- `projects/PRJ-019/app/tsconfig.base.json` — TypeScript strict (NodeNext / ES2022 / `noUncheckedIndexedAccess` / `noImplicitReturns` 等)
- `projects/PRJ-019/app/eslint.config.mjs` — Flat config + `@typescript-eslint/no-explicit-any: error`
- `projects/PRJ-019/app/vitest.config.ts` — workspace alias (`@clawbridge/harness` 等を src 直結) + live test 除外
- `projects/PRJ-019/app/.gitignore` — `.clawbridge/` (実行時 state) / `openclaw-runtime/upstream/` 等を除外
- `projects/PRJ-019/app/.editorconfig`, `.prettierrc`

### 2.2 Harness 制御層 (`@clawbridge/harness`)

実装:
- `app/harness/src/paths.ts` — `~/.clawbridge/` 配下の全 state path 集約 (CLAWBRIDGE_ROOT / COST_LEDGER_PATH / USAGE_LEDGER_PATH / KILL_SIGNAL_PATH / HITL_PENDING_DIR / HARNESS_BOOT_PATH / KILL_HISTORY_PATH 等)
- `app/harness/src/fs-store.ts` — `loadJson<T>` / `saveJson<T>` (atomic write: tmp + rename) / `ensureDir` / `fileExists`
- `app/harness/src/cost-tracker.ts` — `FileCostTracker` (4 層ハードキャップ: session $5 / project $50 / day $30 / month $300, JSON ledger append-only)
- `app/harness/src/kill-switch.ts` — `FileKillSwitch` (`~/.clawbridge/STOP` ファイル fs.watch + 1s polling fallback、handler 5s timeout、history JSON 追記)
- `app/harness/src/hitl-gate.ts` — `FileHitlGate` (5 アクション種別 / 24h timeout で default reject / `~/.clawbridge/pending-approvals/<uuid>.{approved|rejected}` ファイルポーリング)
- `app/harness/src/circuit-breaker.ts` — `CircuitBreaker` (closed / open / half-open ステート、`now()` 注入で test 容易化)
- `app/harness/src/usage-monitor.ts` — `FileUsageMonitor` (12h 連続稼働検知 / 401・403・429 が 60s 窓 5 件超で kill-switch 自動発火 / 5h ローリング集計対応)
- `app/harness/src/index.ts` — `Harness` クラス (init/shutdown/guardedRun/status) で 4 コンポーネント統合

テスト (5 ファイル / 38 ケース):
- `circuit-breaker.test.ts` (8 ケース)
- `cost-tracker.test.ts` (12 ケース)
- `kill-switch.test.ts` (8 ケース)
- `hitl-gate.test.ts` (5 ケース)
- `usage-monitor.test.ts` (5 ケース)

### 2.3 claude-bridge (`@clawbridge/claude-bridge`)

実装:
- `app/claude-bridge/src/spawn.ts` — `ClaudeBridge.executeTask(prompt, options)` (P-D 改: 公式 `claude` CLI を `-p / --output-format=stream-json` で subprocess 起動。Windows shell:true + `taskkill /T /F` で プロセスツリー kill。env whitelist で ANTHROPIC_API_KEY / OPENAI_API_KEY / `*secret*` 系をブロック。circuit-breaker 内蔵。10 分 default timeout / SIGTERM → 5s grace → SIGKILL。cost-tracker (`anthropic_subscription`) / usage-monitor (`anthropic_oauth`) に自動記録)
- `app/claude-bridge/src/stream-json-parser.ts` — `parseStreamJsonText` / `parseStreamJsonLine` / `parseStreamJsonChunks` (AsyncGenerator + 行境界バッファリング) / `extractUsage` (zod passthrough schema)
- `app/claude-bridge/src/auth-detector.ts` — `detectClaudeAuth()` (`claude --version` exit 0 + `~/.claude/` 存在確認のみ。**credentials.json は読まない**: G-V2-11 OAuth トークン到達禁止)
- `app/claude-bridge/src/index.ts` — public API 再エクスポート

テスト (3 ファイル / 29 ケース):
- `stream-json-parser.test.ts` (13 ケース: chunk 境界 / passthrough / CRLF / unparseable 耐性 / usage 集計)
- `auth-detector.test.ts` (6 ケース: tmp .mjs 経由で fake CLI 注入、shell:true Windows + POSIX 両対応)
- `spawn.test.ts` (10 ケース: 成功 / cost·usage 記録 / auth_failed / 401·429 stderr 分類 / circuit_open / timeout (Windows プロセスツリー kill 検証含む) / **ANTHROPIC_API_KEY 漏洩防止 (G-V2-11)** / option pass-through)

### 2.4 その他ワークスペース

`openclaw-runtime` / `orchestrator` / `sandbox` / `audit` / `notify` は package.json のみ作成 (W0 2 週目以降で中身実装)。pnpm install が通ること、ワークスペース解決が壊れないことを確認。

---

## 3. 達成した必須コントロール (v3 28 項目より)

| ID | 項目 | 実装状況 |
|----|------|---------|
| G-01 | コスト上限ハードキャップ | `FileCostTracker.checkBudget` で 4 層 (session/project/day/month) を判定、超過時 `Harness.guardedRun` が kill-switch 発火 |
| G-02 | 緊急停止 | `FileKillSwitch` (`~/.clawbridge/STOP` 物理ファイル + API 双方で trigger 可) |
| G-04 | HITL ゲート | `FileHitlGate.requestApproval` が 5 種別 (public_release / paid_api_call / force_push / prod_deploy / external_api) を 24h timeout default reject |
| G-05 | サーキットブレーカ | `CircuitBreaker` (closed/open/half-open) を `ClaudeBridge` が内蔵、5 連続失敗で 30s open |
| G-06 | レート異常検知 → kill | `FileUsageMonitor` が 401/403/429 連続発生 (60s 5 件閾値) を検知し `killSwitch.trigger('rate_anomaly')` |
| G-08 | 連続稼働 12h 上限 (NG-3 予防) | `FileUsageMonitor.startRuntimeWatch` で boot 時刻記録 + 12h 経過で kill 発火 |
| G-V2-03 | 起動元偽装 / OAuth 直 spawn 全面禁止 | `claude-bridge` は公式 `claude` CLI のみ subprocess 起動。`spawn` 引数固定、env whitelist で API key 系を遮断 |
| G-V2-08 | 401/403/429 連続検知 → kill | (= G-06) |
| G-V2-11 | OAuth トークン到達禁止 (FS/env 隔離) | `auth-detector` は credentials.json を読まず stat() のみ。`spawn` env から ANTHROPIC_API_KEY / OPENAI_API_KEY / `*secret*` をブロック (テストで実証) |

**未実装 (W0 2 週目以降)**: G-V2-01 (Sandbox 隔離) / G-V2-04 (指示入力経路の単一化エンドツーエンド) / G-V2-12 (投入経路文書化) / G-09 (BAN フォールバック検知 < 1 分) / その他通知系。

---

## 4. ベリフィケーション結果

```bash
$ pnpm install   # OK (Done in 8.4s)
$ pnpm typecheck # OK (harness / claude-bridge / 5 stub workspaces)
$ pnpm test      # OK
  Test Files  8 passed (8)
       Tests  67 passed (67)
    Duration  ~7.5s
```

検証環境: Windows 11 Home (10.0.26200) / Node 24.11.1 / pnpm 9.12.0。

カバレッジ: harness 4 主要モジュール + claude-bridge 3 主要モジュールに対し、正常系・異常系・タイムアウト系・並行系を網羅。レビュー部 (`review-w0-week1-verification-checklist.md`) のチェック項目との突合は W0 2 週目で実施予定。

---

## 5. 主要な設計判断

1. **Windows プロセスツリー kill (`taskkill /T /F`)** を `claude-bridge/spawn.ts` に組み込んだ。shell:true で起動した cmd.exe に SIGTERM を送るだけでは grandchild の node が残る問題を回避。timeout テストが Windows 上で 6 秒以内に完了することを確認。
2. **vitest workspace alias** (`@clawbridge/harness` を harness/src/index.ts に解決) で dist/ ビルド不要のテスト実行を実現。CI が高速。
3. **auth-detector の non-zero exit 扱い変更** — exit code != 0 は `cliFound=false` 扱いとし `authenticated=false` を確実にした (実装時に発見したロジック穴を修正)。
4. **env allow-list 方式** — secret 系を block-list で除外する代わりに、PATH / USERPROFILE 等の必要 env のみを allow list で渡す方式。defense-in-depth で extraEnv にも secret 名チェックを重ねがけ。
5. **cost-tracker のカテゴリ分離** — `anthropic_api` / `anthropic_subscription` / `openai_api` / `openai_subscription` を区別。サブスク経由は `total_cost_usd` を「参考値」として記録 (実課金とは独立)。

---

## 6. ブロッカ / リスク (上位 3 件)

1. **実機 Claude CLI による live integration test 未実施**
   - 影響: stream-json の現行公式仕様 (msg type / 追加フィールド) との乖離検知が未確認。
   - 緩和: zod schema を `.passthrough()` で緩く設計済 → 即時クラッシュは避けられる。
   - 対応: W0 2 週目に `tests/integration/claude-bridge-live.test.ts` を 1 回手動実行 (オーナー OAuth 利用、$0.10 上限)。

2. **HITL gate の通知経路未接続**
   - 影響: pending approval 発生時、現状はファイル出現のみで Slack/メール通知が無い → オーナーが気付かないまま 24h timeout で reject される恐れ。
   - 緩和: W0 段階は HITL ゲート発動頻度が低い前提。
   - 対応: `notify/` ワークスペースで Slack/Discord webhook 実装 (W1 上旬予定、`pm-phase1-plan-v2.1.md` 線表通り)。

3. **openclaw-runtime upstream 未調査**
   - 影響: OpenClaw OSS 本体の API surface が判明しておらず、wrapper interface が実装まで到達していない。
   - 緩和: vendor/ ディレクトリは作成済、`UPSTREAM-NOTES.md` で clone 手順を記載予定。
   - 対応: W0 2 週目にリサーチ部と連携して OpenClaw OSS の clone + `loop.run()` 等の主要 API を確認、mock + skeleton を実装。

---

## 7. W0 2 週目 (2026-05-09 〜 05-15) 持越タスク

優先順位順:
1. **claude-bridge live integration test の 1 回実行** (オーナー OAuth で実機 `claude -p` を呼び、stream-json schema を実証)
2. **openclaw-runtime ラッパ skeleton + mock** (`src/wrapper.ts` / `src/__tests__/wrapper.test.ts`)
3. **`app/docs/architecture-w0.md`** (Mermaid アーキ図 + W0 vs W1+ scope)
4. **`app/docs/security-w0.md`** (G-01/G-04/G-05/G-06/G-08/G-V2-03/G-V2-11 の実装エビデンス + BAN フォールバック手順)
5. **`app/README.md`** 更新 (monorepo セットアップ手順 / 各 workspace 進捗 / W0 完了基準)
6. **review-w0-week1-verification-checklist.md** との突合 + 不足分 fill in
7. **HITL gate Slack 通知** (notify/ ワークスペースで webhook 実装)
8. **scripts/verify-zero-side-effect.sh** (副作用なし起動の自動検証)

---

## 8. 既存 PRJ への影響

- 既存 PRJ-001 〜 PRJ-018 のコード・ドキュメント・成果物に **一切の変更なし** を確認 (zero modification 原則遵守)。
- `dashboard/active-projects.md` への PRJ-019 進捗反映は秘書 / PM の領分のため本報告では実施せず、CEO 判断に委ねる。

---

## 9. 添付参照

- 実装計画 (元): `projects/PRJ-019/reports/dev-phase1-w0-implementation-plan.md`
- 受領した検証チェックリスト: `projects/PRJ-019/reports/review-w0-week1-verification-checklist.md`
- アーキ v2 plan: `projects/PRJ-019/reports/pm-architecture-v2-and-phase1-plan.md`

以上、W0 1 週目の最重要モジュール (cost-tracker / kill-switch / hitl-gate / claude-bridge spawn / auth-detector / monorepo) は **必ず動く形** で実装完了。残タスクは W0 2 週目で計画通り消化予定。
