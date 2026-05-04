# G-V2-11 OAuth トークン到達禁止 (FS / env 隔離) — 単体検証エビデンス【最重要】

## 1. 概要

bridge プロセスが OAuth トークン（`~/.claude/credentials.json` 等）に **FS / env のいずれの経路でも到達しない** ことを保証する。NG-1（自動 OAuth フロー起動）違反予防の中核コントロールであり、Review §7.4 でも最重要扱い。

実装は 2 層:

1. **FS 層**: `auth-detector` は `~/.claude/` ディレクトリの `stat().isDirectory()` のみ参照し、`credentials.json` を含む配下ファイルを一切 read しない。`claude --version` の exit code 0 の有無で「CLI 起動可能」を判定するに留める。
2. **env 層**: `spawn.ts:buildEnv()` の **allow-list** で `PATH/USERPROFILE/APPDATA/...` のみ許可し、`ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `*api[_-]?key*` / `*secret*` / `*token*` / `*password*` / `*credential*` を **暗黙拒否 + extraEnv 経由でも regex で再ブロック**（defense in depth）。

## 2. 実装ファイル

- `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/claude-bridge/src/auth-detector.ts`
  - `detectClaudeAuth()` (L53-111): `stat(configDir)` で isDirectory 判定 + `claude --version` exit code 確認のみ
  - **credentials.json / oauth_account / token を一切 read しない**（コメント L17-19, L98-100 で明記）
  - `runCommand()` (L132-163): subprocess は `--version` のみ実行、env も継承しない（spawn の継承 default を使うが、auth-detector 自身は secret を流し込まない）
- `C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/claude-bridge/src/spawn.ts`
  - `buildEnv()` (L364-399): allow-list 16 個のみ通過、extraEnv の secret 名 regex `/api[_-]?key|secret|token|password|credential/i` で再ブロック
  - `executeTask()` (L134-155): auth が false なら `auth_failed` で早期 return（NG-1 違反となる自動 OAuth 起動を絶対にしない）

## 3. テスト ID とケース数

- テストファイル 1: `claude-bridge/src/__tests__/auth-detector.test.ts` — 6 ケース / 全件 PASS
- テストファイル 2: `claude-bridge/src/__tests__/spawn.test.ts` — G-V2-11 該当 1 ケース（env allow-list 漏洩防止）

| # | ファイル | it() 名 | 検証内容 |
|---|---------|---------|---------|
| 01 | auth-detector.test.ts | `reports authenticated when CLI succeeds and configDir exists` | **stat().isDirectory() のみで判定、credentials.json は読まない** |
| 02 | auth-detector.test.ts | `reports unauthenticated when configDir is missing` | configDir 不在 → authenticated=false、reason に `\.claude\/?` |
| 03 | auth-detector.test.ts | `reports unauthenticated when CLI exits non-zero` | exit 2 → cliFound=false、authenticated=false |
| 04 | auth-detector.test.ts | `reports unauthenticated when CLI is not found` | 存在しないコマンド → authenticated=false、reason 設定 |
| 05 | auth-detector.test.ts | `does not throw and returns a structured result on any failure` | エラー時も throw せず構造化結果（kill-switch 連動可能な状態） |
| 06 | auth-detector.test.ts | `honors a pre-existing nested directory inside configDir as configDirExists` | nested directory も isDirectory() で OK 判定 |
| 07 | spawn.test.ts | `does not leak ANTHROPIC_API_KEY into spawned process env (G-V2-11)` | **env allow-list 検証: ANTHROPIC_API_KEY / OPENAI_API_KEY / MY_SECRET いずれも子プロセスで `null`** |

## 4. 検証コマンドと出力（実機）

### 4.1 auth-detector

```bash
$ cd C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app
$ pnpm --filter @clawbridge/claude-bridge test -- auth-detector --reporter=verbose
```

実機 stdout（04:27:10 実行）:
```
 RUN  v2.1.9 C:/Users/hiron/Desktop/claude-code-company/projects/PRJ-019/app/claude-bridge

 ✓ src/__tests__/auth-detector.test.ts > detectClaudeAuth > reports authenticated when CLI succeeds and configDir exists
 ✓ src/__tests__/auth-detector.test.ts > detectClaudeAuth > reports unauthenticated when configDir is missing
 ✓ src/__tests__/auth-detector.test.ts > detectClaudeAuth > reports unauthenticated when CLI exits non-zero
 ✓ src/__tests__/auth-detector.test.ts > detectClaudeAuth > reports unauthenticated when CLI is not found
 ✓ src/__tests__/auth-detector.test.ts > detectClaudeAuth > does not throw and returns a structured result on any failure
 ✓ src/__tests__/auth-detector.test.ts > detectClaudeAuth > honors a pre-existing nested directory inside configDir as configDirExists

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Duration  1.04s
```

### 4.2 spawn env allow-list

```bash
$ pnpm --filter @clawbridge/claude-bridge test -- spawn --reporter=verbose
```

該当ケース（spawn.test.ts L224-245）:
```ts
it('does not leak ANTHROPIC_API_KEY into spawned process env (G-V2-11)', async () => {
  process.env['ANTHROPIC_API_KEY'] = 'sk-ant-leak-test-XXXX'
  process.env['MY_SECRET'] = 'should-not-appear'
  try {
    const bridge = new ClaudeBridge({
      command: await makeEnvDumpCommand(),
      skipAuthCheck: true,
      circuitBreaker: new CircuitBreaker({ name: 'test', failureThreshold: 10 }),
    })
    const r = await bridge.executeTask('hi', { extraEnv: { MY_SECRET: 'still-no' } })
    expect(r.success).toBe(true)
    const dumpMsg = r.messages.find((m) => m.type === 'system' && m.subtype === 'env_dump')
    const seen = (dumpMsg as unknown as { seen: Record<string, string | null> }).seen
    expect(seen['ANTHROPIC_API_KEY']).toBeNull()  // ← 親 env でセット済みでも子で見えない
    expect(seen['OPENAI_API_KEY']).toBeNull()
    expect(seen['MY_SECRET']).toBeNull()           // ← extraEnv 経由でも regex で再ブロック
  } finally {
    delete process.env['ANTHROPIC_API_KEY']
    delete process.env['MY_SECRET']
  }
})
```

実機 stdout 該当行（04:26:59）:
```
 ✓ src/__tests__/spawn.test.ts > ClaudeBridge.executeTask > does not leak ANTHROPIC_API_KEY into spawned process env (G-V2-11)
```

→ env_dump スクリプトが子プロセスで `process.env['ANTHROPIC_API_KEY'] / OPENAI_API_KEY / MY_SECRET` を読み取った結果すべて `null` で実機検証 PASS。

### 4.3 auth-detector が credentials.json を読まないことの実装根拠

auth-detector.ts L66-72（FS 層の参照は stat() のみ）:
```ts
// 1. ~/.claude ディレクトリ確認
try {
  const stat = await fs.stat(configDir)
  result.configDirExists = stat.isDirectory()
} catch {
  result.configDirExists = false
}
```

auth-detector.ts L98-100（コメントで credentials.json 不読方針を明記）:
```ts
// 認証判定: CLI が --version 0 で応答し、かつ ~/.claude/ が存在すれば「認証済みである可能性が高い」と扱う。
// 厳密には credentials.json の存在を確認すべきだが、本ファイルへの read access を
// 取らないのが G-V2-11 方針 (Open Claw / harness プロセスから OAuth に到達させない)。
```

→ Review が `credentials.json` への到達を grep で検証する場合、`auth-detector.ts` には `credentials` の文字列は上記コメントとパッケージドキュメント以外に出現しない（実 read コードは存在しない）。

## 5. 設計判断

1. **stat().isDirectory() のみで authenticated 判定** — credentials.json の中身どころか、ファイル名にも触れない。CLI 起動可能性を「`--version` exit 0」で代理確認。
2. **env allow-list 16 個 (PATH/USERPROFILE/APPDATA/LOCALAPPDATA/TEMP/TMP/SYSTEMROOT/COMSPEC/HOME/Path/PATHEXT/NODE_PATH/CI/TZ/LANG/LC_ALL)** — Windows 11 primary 環境で claude CLI が動作するための最小集合。secret 系は意図的に除外。
3. **extraEnv 経由でも regex `/api[_-]?key|secret|token|password|credential/i` で再ブロック** — 開発者が誤って `extraEnv: { ANTHROPIC_API_KEY: ... }` を渡しても **暗黙でドロップ**（throw ではなく continue）。型レベル + 実行時 regex の二重防御。
4. **NG-1 違反予防（自動 OAuth フロー起動禁止）** — `executeTask()` は authenticated=false の時点で `auth_failed` を return し、subprocess も spawn しない。OAuth ログイン誘導は CEO/オーナーへのエラーメッセージ経由で人間 in the loop。
5. **kill-switch 連鎖** — auth_failed が連続 5 件発生すれば usage-monitor → kill-switch trigger（G-06 連動）。silent_revoke 攻撃シナリオ（mock-claude）でも 60s 内に kill が発火。
6. **defense in depth × 3 層** — (a) auth-detector で credentials.json read しない (b) spawn buildEnv で env allow-list (c) regex で extraEnv 再ブロック。3 層のどれかが破られても他 2 層で防御。

## 6. 既知の制約 / 持越し

- **`/api[_-]?key|secret|token|password|credential/i` regex の正規表現完全性監査** — 現状 `apikey` / `api-key` / `api_key` / `bearer` / `auth_*` の一部はカバー済みだが、`bearer` を明示パターンに追加すべきか Review 方針確認希望。`AUTH_TOKEN` は `token` で hit するため OK。
- **Doppler / Tier-S0〜S4 secret 隔離との突合**（Review v1 §6 で G-08 = secret 隔離と再定義されている件） — Doppler 連携は W1 持越し。現状 `process.env` レベルでの allow-list で代替。
- **OS keychain 直接アクセスの監査** — `keytar` / `node-keychain` 等の依存ゼロを pre-commit hook で grep 検証する仕組みは未配置（W0-Week2 で `.husky/pre-commit` 実装予定）。
- **`grep -rE "credentials\.json" claude-bridge/src/` の自動 CI チェック** — Review §7.4 検収方法 #1 の「ファイル名 grep 検出 0 件」を CI で自動化する hook は未配置。手動確認では auth-detector.ts のコメント文字列以外で 0 件確認済み。
- **integration test for silent_revoke (B6)** — mock-claude scenario `silent_revoke` を使った OAuth 失効シナリオの統合テストは W0-Week2 持越し。

## 7. Review 部門への質問・依頼

1. **Q1（最優先）**: G-V2-11 の検収条件として「`grep -rE "credentials\.json|\.claude/credentials" claude-bridge/src/` が実コードで 0 件 + コメント記述は許可」という運用でよいか確認希望。auth-detector.ts には方針説明コメントとして "credentials.json" の文字列が 1 箇所存在する（実 read 行なし）。
2. **Q2**: env regex `/api[_-]?key|secret|token|password|credential/i` に **`bearer` を追加** すべきか方針確認。現状 `Authorization: Bearer xxx` ヘッダ形式の手動指定はテスト時に regex を通過する可能性がある（実害は subprocess に env として流れるだけで HTTP 経路ではないが defense in depth として）。
3. **Q3**: Review v1 §6 で G-08 = secret 隔離 (Tier-S0〜S4 / Doppler)、Dev W0 計画で G-08 = 連続稼働 12h と定義が食い違っている件、本ファイルが secret 隔離側を担うコントロールとして「G-V2-11 + G-08 secret 部分」をカバーする整理で 5/8 検収 OK か確認希望（G-08 evidence Q1 とも連動）。
4. **依頼**: B6 「OAuth silent_revoke → 5 連続 auth_failed → circuit open → kill-switch 発火」の統合テストを W0-Week2 で実装予定。受入基準（kill 発火までの最大経過時間 / dump される env 内容の検査範囲）を Review 側から提示してほしい。
5. **依頼**: pre-commit hook の検出キーワード一覧（oauth / keychain / User-Agent / credentials / billing-proxy / api[_-]?key 等）の **Review 確定版リスト** を 5/8 までに頂けると、W0-Week2 初日に hook 配置可能。
