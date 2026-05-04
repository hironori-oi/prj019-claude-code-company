# G-V2-03 起動元偽装 / OAuth 直 spawn 全面禁止 — 単体検証エビデンス

## 1. 概要

`ClaudeBridge.executeTask()` は **公式 Claude Code CLI を改変なし subprocess として spawn** する。OAuth フローは CLI 自身に委譲し、bridge 側は OAuth トークンを一切ハンドリングしない（P-D 改方針）。`buildArgs()` で `-p <prompt> --output-format=stream-json --verbose` を組み立てて起動し、Windows では `shell:true + windowsHide:true + taskkill /T /F` で安全な subprocess 終了を担保。`circuit-breaker` でラップし、auth-detector で初回 `~/.claude/` 存在 + `claude --version` exit 0 を確認、未認証なら `auth_failed` で即座に return（自動 OAuth フロー起動はしない、NG-1 違反予防）。

## 2. 実装ファイル

- `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/claude-bridge/src/spawn.ts`
  - `ClaudeBridge.executeTask()` (L134-155): auth-detector → circuit-breaker → spawnClaude のパイプライン
  - `spawnClaude()` (L170-321): subprocess spawn + stream-json parse + cost/usage 記録 + timeout 制御
  - `buildArgs()` (L338-353): CLI 引数組み立て（**`--api-key` / `--token` 等は一切付与しない**）
  - `buildEnv()` (L364-399): env allow-list（G-V2-11 と連動）
  - `killProcessTree()` (L406-423): Windows taskkill /T /F による プロセスツリー終了
  - `detectErrorType()` (L425-437): stderr regex で auth_failed / rate_limited / spawn_failed / unknown に分類
- 認証層: `claude-bridge/src/auth-detector.ts` — `claude --version` のみ実行、credentials.json は読まない（G-V2-11 連動）
- 統合先: harness の `CostTracker` / `UsageMonitor` / `CircuitBreaker` を依存注入

## 3. テスト ID とケース数

- テストファイル: `claude-bridge/src/__tests__/spawn.test.ts`
- 対象テスト: 10 ケース / 全件 PASS

| # | it() 名 | 検証内容 |
|---|---------|---------|
| 01 | `returns success and parses stream-json output` | 正常系: stream-json 3 行 (system/assistant/result) を全 parse、token usage 集計、cost 集計 |
| 02 | `records cost and usage when harness components are wired` | CostTracker / UsageMonitor 統合、`anthropic_subscription` カテゴリで monthly/session 集計 |
| 03 | `returns auth_failed when auth check fails (skipAuthCheck=false)` | 存在しない command で auth-detector 失敗 → `auth_failed` 即時 return（自動 OAuth 起動しない） |
| 04 | `classifies non-zero exit with 429 stderr as rate_limited` | stderr に "429" → `error.type='rate_limited'` |
| 05 | `detects 401 stderr as auth_failed` | stderr に "401 Unauthorized" → `error.type='auth_failed'` |
| 06 | `returns circuit_open when circuit-breaker is already open` | open 状態の CircuitBreaker → `error.type='circuit_open'`（subprocess spawn しない） |
| 07 | `handles timeout and returns error` | `timeoutMs=500` で hang script → SIGTERM → 5s 後 SIGKILL（taskkill /T /F） |
| 08 | `status() reflects skipAuthCheck behaviour` | skipAuthCheck=true で authChecked が触らない、circuit state=closed |
| 09 | `does not leak ANTHROPIC_API_KEY into spawned process env (G-V2-11)` | **env allow-list 検証（G-V2-11 と相互参照）** |
| 10 | `passes options through (smoke test for permissionMode/sessionId/etc.)` | `--allowedTools / --permission-mode / --resume / --append-system-prompt` の正常 pass-through |

## 4. 検証コマンドと出力（実機）

```bash
$ cd C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app
$ pnpm --filter @clawbridge/claude-bridge test -- spawn --reporter=verbose
```

実機 stdout（04:26:59 実行）:
```
 RUN  v2.1.9 C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/claude-bridge

 ✓ src/__tests__/spawn.test.ts > ClaudeBridge.executeTask > returns success and parses stream-json output
 ✓ src/__tests__/spawn.test.ts > ClaudeBridge.executeTask > records cost and usage when harness components are wired
 ✓ src/__tests__/spawn.test.ts > ClaudeBridge.executeTask > returns auth_failed when auth check fails (skipAuthCheck=false)
 ✓ src/__tests__/spawn.test.ts > ClaudeBridge.executeTask > classifies non-zero exit with 429 stderr as rate_limited
 ✓ src/__tests__/spawn.test.ts > ClaudeBridge.executeTask > detects 401 stderr as auth_failed
 ✓ src/__tests__/spawn.test.ts > ClaudeBridge.executeTask > returns circuit_open when circuit-breaker is already open
 ✓ src/__tests__/spawn.test.ts > ClaudeBridge.executeTask > handles timeout and returns error 6221ms
 ✓ src/__tests__/spawn.test.ts > ClaudeBridge.executeTask > status() reflects skipAuthCheck behaviour
 ✓ src/__tests__/spawn.test.ts > ClaudeBridge.executeTask > does not leak ANTHROPIC_API_KEY into spawned process env (G-V2-11)
 ✓ src/__tests__/spawn.test.ts > ClaudeBridge.executeTask > passes options through (smoke test for permissionMode/sessionId/etc.)

 Test Files  1 passed (1)
      Tests  10 passed (10)
   Duration  7.63s
```

`buildArgs()` が OAuth/API キー関連フラグを付与しないことの実証（spawn.ts L338-353 抜粋）:
```ts
function buildArgs(prompt: string, options: ClaudeExecuteOptions): string[] {
  const args: string[] = ['-p', prompt, '--output-format', 'stream-json', '--verbose']
  if (options.allowedTools && options.allowedTools.length > 0) {
    args.push('--allowedTools', options.allowedTools.join(','))
  }
  if (options.permissionMode) args.push('--permission-mode', options.permissionMode)
  if (options.sessionId) args.push('--resume', options.sessionId)
  if (options.appendSystemPrompt) args.push('--append-system-prompt', options.appendSystemPrompt)
  return args
}
```
→ `--api-key` / `--token` / `--auth-*` 系のオプションは型レベルでも値レベルでも一切受け付けない構造。

## 5. 設計判断

1. **公式 CLI 改変なし方針** — Claude Code CLI を fork / patch せず、`spawn(this.command, args)` でそのまま起動。改変があると "third-party tool" 該当判定リスクが上がるため。
2. **OAuth トークン直接ハンドル禁止** — bridge プロセスでは OAuth トークン（`~/.claude/credentials.json` 内など）を一切 read/write しない。CLI 内部の OAuth クライアントに完全委譲。auth-detector も `--version` の exit code とディレクトリ stat() のみ参照（G-V2-11 と連動）。
3. **fresh session 原則** — `--resume <sessionId>` は呼び出し元が明示指定した場合のみ使用。default は新規セッション。
4. **Windows shell:true + windowsHide:true** — `claude.cmd` を解決するために shell:true 必須。代わりに `taskkill /T /F` でプロセスツリー丸ごと終了して孫プロセス残留を防ぐ。
5. **circuit-breaker first** — auth-detector → circuit-breaker → spawnClaude の順。circuit が open なら subprocess を spawn しない（cost を発生させない）。
6. **stderr 文字列 regex で error type 分類** — Claude CLI の stderr は構造化されていないため正規表現で auth/rate/spawn を判別。テスト 04 / 05 で実証。
7. **timeout 後 SIGTERM → 5s grace → SIGKILL** — テスト 07 で動作実証（6.2s で完了）。

## 6. 既知の制約 / 持越し

- **G-V2-03 統合シナリオ V203-INT-01〜03**（mock-claude `silent_revoke` シナリオ → BAN 模倣 → API キーフォールバック切替）は W0-Week2 持越し。今回は単体 + mock-claude scenario-smoke のみカバー。
- **API キーフォールバック切替（4h 以内）** — circuit-breaker 開時に OAuth → API key 自動切替する実装は spawn.ts に未実装。Review §7.3 G-V2-03 V203-INT-02 で要求されているが W0-Week2 で対応予定。
- **pre-commit hook for grep `oauth` / `keychain` / `User-Agent`** — Review §7.2 UT-V203-08〜10。現状未配置、5/8 検収までに `.husky/pre-commit` で実装するか W0-Week2 持越しか要確認。
- **stderr 構造化ログ化** — debug フラグは保持のみで W0 stub 状態。W1 で notify/ workspace と連携してログ flush 予定。

## 7. Review 部門への質問・依頼

1. **Q1**: pre-commit hook（`oauth` / `keychain` / `User-Agent` / `credentials` / `billing-proxy` の grep 検出）は 5/8 検収必須か W0-Week2 でよいか確認希望（G-05 evidence Q1 と同質問）。
2. **Q2**: API キーフォールバック切替の SLA「4 時間以内完了」は claude-bridge と Sumi/Asagi/Clawbridge 統合層のどちらの責務か。bridge 側で OAuth → API key 切替を実装する場合 spawn.ts の env allow-list 拡張（ANTHROPIC_API_KEY を allow 化する flag）が必要、Review 方針確認希望。
3. **依頼**: mock-claude `silent_revoke` シナリオ → 5 連続 `auth_failed` → circuit open の連鎖統合テストを W0-Week2 で `tests/integration/auth-revoke-flow.test.ts` として実装予定。事前に受入基準を Review 側で提示してほしい。
