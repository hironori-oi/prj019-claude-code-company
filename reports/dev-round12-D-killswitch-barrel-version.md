# PRJ-019 Round 12 Dev-D 完了レポート — kill-switch wiring + cli barrel + version-check layer

最終更新: 2026-05-04 W0-Week1 深夜 / 起案: Dev 部門 R12 Dev-D
位置付け: Owner formal「最速で進めよ」directive 継続中の Round 12、Dev-D 担当 4 タスク完遂。general-purpose Agent dispatch (DEC-019-025 SOP) で独立稼働、並列 R12 他 Agent と file conflict 0。
連動 DEC: DEC-019-007 / 010 / 025 / 050 / 051 / 053 / 054 / 055 / 056 / 057
連動レポート:
- Round 11 Dev-A: dev-round11-A-denylist-subprocess.md (skill-adapter/subprocess.ts 410 行 / 5 動作分岐)
- Round 11 Dev-D: dev-round11-D-subscription-cli.md (cli/ 雛形 3 module = spawn-claude-code 464 / session-controller 247 / subscription-router 228)

連動コード:
- `app/harness/src/kill-switch.ts` (extend、append-only)
- `app/harness/src/index.ts` (export 追加)
- `app/openclaw-runtime/src/cli/spawn-claude-code.ts` (extend、append-only — wiring helper 追加)
- `app/openclaw-runtime/src/cli/subscription-router.ts` (extend、append-only — spawnFromDecision 追加)
- `app/openclaw-runtime/src/cli/cli-version-check.ts` (新規)
- `app/openclaw-runtime/src/cli/index.ts` (新規 barrel)
- `app/openclaw-runtime/src/index.ts` (cli namespace export 追加)
- `app/harness/src/__tests__/kill-switch-subprocess-wiring.test.ts` (新規 15 tests)
- `app/openclaw-runtime/src/cli/__tests__/cli-barrel-export.test.ts` (新規 8 tests)
- `app/openclaw-runtime/src/cli/__tests__/cli-version-check.test.ts` (新規 14 tests)

---

## CEO 向け 200 字以内 summary

Round 12 Dev-D 着地: A) kill-switch.registerSubprocessKill を KillToken 戻り値 + Set ベース 256 件上限 + 並列 SIGTERM→200ms grace→残存 SIGKILL に拡張、KillSwitchError + auto-unregister 配線、B) cli/index.ts barrel + runtime root cli namespace export 統合 (alias 衝突 0)、C) cli-version-check.ts (parseClaudeCodeVersion 純関数 + checkClaudeCodeVersion DI 統合、5 outcome 分岐) 新規、D) +37 tests 全 pass (kill-switch wiring 15 + cli barrel 8 + version-check 14)。openclaw-runtime 174 / harness 230 / workspace 全 668 tests 全 PASS、regression 0、TypeScript strict 合格、追加コスト $0、既存 import path 完全互換、append-only 編集厳守。

---

## §1 担当タスクと DoD

### §1.1 担当 4 件

| # | タスク | 着地 |
|---|---|---|
| A | kill-switch.registerSubprocessKill wiring (KillToken + 256 上限 + auto-register/unregister) | 完遂 |
| B | cli/index.ts barrel export 統合 + runtime root cli namespace export | 完遂 |
| C | ライセンス/版数確認 layer (cli-version-check.ts、parse 純関数 + DI 統合) | 完遂 |
| D | テスト追加 (+12-15 / +5-8 / +4-6 = 22-29 件目標、実績 +37 件) | 完遂 |

### §1.2 DoD 確認

| DoD | 結果 |
|---|---|
| TypeScript strict pass | 達成 (harness / openclaw-runtime いずれも `pnpm typecheck` exit 0) |
| workspace vitest 全 pass | 達成 (audit 16 / harness 230 / openclaw-runtime 174 / claude-bridge 29 / e2e 66 / needs-scout 120 / notify 23 / scripts/openclaw-monitor 10 = **668 tests, all PASS**) |
| 既存 + 新規 +20-30 tests | 達成 (実績 +37 tests = 15 + 8 + 14、目標 22-29 を 8 件超過) |
| 既存 import path 完全互換維持 | 達成 (cli/spawn-claude-code.js / cli/session-controller.js / cli/subscription-router.js 直接 import は無修正で pass、cli-barrel-export.test #5 で reference 同一性を 4 関数 fixture で固定化) |
| 完遂レポート 300-400 行 | 達成 (本 file、目標 300-400 行内) |
| API 追加コスト $0 | 達成 (mock spawner / fake DI のみ、実 spawn 0、network 0) |
| 絵文字なし | 達成 (本レポート + 新規ファイル 4 + 既存 extend 3 全件、絵文字 grep ゼロ) |
| append-only 編集厳守 | 達成 (kill-switch.ts / spawn-claude-code.ts / subscription-router.ts は既存内容を一切 delete せず、新規 section / 拡張 method のみ追加。1 箇所だけ `subprocessTargets: SubprocessKillTarget[]` field を `subprocessEntries: Set<...>` に置換 — これは KillToken unregister の必然要請、Round 6 G-05/G-06 既存 5 tests 全合格で互換性確認済) |

注: subprocessTargets → subprocessEntries field 置換は private field のため public API 互換性維持、kill-chain.test.ts (Round 6 G-05/G-06、5 tests) は無改変で全 pass。

---

## §2 Task A: kill-switch.registerSubprocessKill wiring

### §2.1 拡張内容

**戻り値変更**: `void` → `KillToken`
- 既存呼び出し (Round 6 kill-chain.test.ts 5 件) は戻り値を破棄するため完全互換
- 新規呼び出しは `const token = ks.registerSubprocessKill(target); ... ; token.unregister()` パターンで memory leak 防止可能

**新規 export**:
- `KillSwitchError` (extends Error、code: KillSwitchErrorCode)
- `KillSwitchErrorCode` = `'subprocess_limit_exceeded'`
- `KillToken` interface (id: string + unregister(): void、idempotent)
- `SUBPROCESS_KILL_LIMIT` = 256 (定数)

**動作変更 (内部)**:
1. internal storage: array → Set (entry = { id, target })
2. 登録時に上限 (256) check、超過時 `KillSwitchError('subprocess_limit_exceeded')` throw
3. trigger 時の kill chain (Round 12 改良):
   - **全 alive target に SIGTERM 一斉送信** (Round 11 までは sequential)
   - **max(target.gracePeriodMs ?? 200) ms 待機** (Round 11 までは default 2000ms。Round 12 は default 200ms に短縮)
   - 残存 alive target に **SIGKILL を順次送信**
4. test 用 helper: `getRegisteredSubprocessCount(): number` 追加

### §2.2 既存契約との互換性

| 既存契約 | Round 12 互換性 |
|---|---|
| Round 6 G-05/G-06: SIGTERM → grace → SIGKILL fallback | 維持 (FakeStubbornSubprocess fixture で kill-chain.test.ts #3 / kill-switch-subprocess-wiring.test.ts #5 ともに pass) |
| target.gracePeriodMs を caller が明示すれば優先 | 維持 (kill-chain.test.ts #3 で grace=50 fixture が pass) |
| 戻り値破棄パターン (`ks.registerSubprocessKill(sub)`) | 維持 (kill-chain.test.ts 4 tests + 新規 #15 で固定化) |
| 複数 subprocess 全件に SIGTERM | 維持 (kill-chain.test.ts #5 + 新規 #4 で 3 件並列固定化) |

### §2.3 wiring 配線 (subscription-router + spawn-claude-code adapter 経路)

**spawn-claude-code.ts**:
- 新規 export: `wireSpawnHandleToKillSwitch(handle, registry, name?)` — SpawnHandle を KillSwitch に register、handle.done() で auto-unregister
- 構造的 type: `SpawnKillRegistry` / `SpawnKillTarget` / `SpawnKillRegistryToken` (harness 側 KillSwitch / SubprocessKillTarget / KillToken と完全互換、循環依存回避のため type-only 関係)
- dry-run mode (handle.pid === -1) は no-op で null を返す

**subscription-router.ts**:
- 新規 export: `spawnFromDecision(decision, spawnOptions, registry?)` — selectSpawnMode の decision を spawnClaudeCode に焼き込み、wireSpawnHandleToKillSwitch を auto 配線する一気通貫 helper
- registry 未指定なら kill-switch 配線なしの単純 spawn (W0 段階の柔軟性確保)

---

## §3 Task B: cli/index.ts barrel export 統合

### §3.1 barrel 構成 (約 80 行)

`app/openclaw-runtime/src/cli/index.ts` 新規作成。

**re-export 一覧**:

| 元 module | function/const | type |
|---|---|---|
| spawn-claude-code | spawnClaudeCode / extractJsonEvents / adaptRealChildProcess / wireSpawnHandleToKillSwitch | SpawnMode / MockChildProcess / SpawnClaudeCodeOptions / SpawnHandle / SpawnExitInfo / SpawnDryRunRecord / SpawnKillRegistry / SpawnKillTarget / SpawnKillRegistryToken |
| session-controller | createSessionController / isTransitionAllowed / awaitSessionFinish | SessionState / SessionTransitionRecord / CreateSessionControllerOptions / SessionController |
| subscription-router | selectSpawnMode / decisionToMode / projectRequiredBudgetUsd / isSubscriptionEligible / spawnFromDecision | SubscriptionRouterInput / SubscriptionRouterDecision / EvaluationStep |
| cli-version-check | checkClaudeCodeVersion / parseClaudeCodeVersion / isVersionInRange / DEFAULT_ACCEPTED_RANGE | SemverParts / CliVersionCheckOutcome / CliVersionCheckResult / AcceptedRange / CheckClaudeCodeVersionOptions |

### §3.2 alias 衝突回避

**skill-adapter/subprocess.ts 由来 (Round 11 Dev-A 着地)**:
- `SubprocessHandle` / `SubprocessSpawner` / `SubprocessSpawnInput` / `SubprocessAdapterResult` / `runSubprocessAdapter` / `splitLinesFromChunk` / `detectInteractiveInLines`

これらは cli barrel から **意図的に再 export しない** (cli barrel は cli/ 配下 module 専用 namespace)。caller が必要なら openclaw-runtime root export または `'@clawbridge/openclaw-runtime/skill-adapter/subprocess'` から取得する。

cli-barrel-export.test.ts #7 で「cli barrel に skill-adapter 名前漏れなし」を反証可能な形で固定化。

### §3.3 Dev-C 後発依存への配慮

`real-child-spawn.ts` / `ndjson-parser.ts` (Round 12 Dev-C 着地済 module、cli/__tests__/ に test 確認) の export 命名規約をコメントとして明記:

> 例 (将来):
> ```
> export { createRealChildSpawn, type RealChildSpawnHandle } from './real-child-spawn.js'
> export { parseNdjsonStream, createNdjsonParser, type NdjsonParser } from './ndjson-parser.js'
> ```

実体は本 R12 Dev-D 担当範囲外 (Dev-C 領域)、命名衝突 (SubprocessHandle 等) を避けるため `RealChildSpawn*` / `Ndjson*` prefix 命名で extend する規約のみ提示。

### §3.4 runtime root namespace export

`app/openclaw-runtime/src/index.ts` に `export * as cli from './cli/index.js'` を 1 行追加:

```typescript
import { cli } from '@clawbridge/openclaw-runtime'
cli.spawnClaudeCode({ ... })
cli.selectSpawnMode({ ... })
```

旧 import path も完全互換維持:
```typescript
import { spawnClaudeCode } from '@clawbridge/openclaw-runtime/cli/spawn-claude-code.js' // ok
```

---

## §4 Task C: cli-version-check.ts (約 220 行)

### §4.1 公開 API

| export | 役割 |
|---|---|
| `parseClaudeCodeVersion(stdout: string): SemverParts \| null` | 純関数 — stdout 文字列から semver 抽出 (副作用 0) |
| `isVersionInRange(v, range?): boolean` | 純関数 — semver が AcceptedRange に収まるか |
| `checkClaudeCodeVersion(opts): Promise<CliVersionCheckResult>` | DI 統合 — spawner 経由で起動、5 outcome 分岐で結果返却 |
| `DEFAULT_ACCEPTED_RANGE` | { minMajor: 1, minMinor: 0, maxMajorExclusive: 2 } (= [1.0, 2.0)) |

### §4.2 outcome 5 分岐

| outcome | 条件 | warning | fallbackToDryRun |
|---|---|---|---|
| `ok` | 範囲内 semver | null | false |
| `out_of_range` | 範囲外 (例 2.x / 0.x) | "outside accepted range" | true |
| `unparseable` | parse 失敗 | "could not be parsed as semver" | true |
| `spawn_failed` | exit code != 0 or spawner throw | "exited code=N" or "起動失敗" | true |
| `timeout` | spawn timeout (default 5000ms) | "timed out after Nms" | true |

### §4.3 parse 抽出 regex

```
/(?:^|[^\d])v?(\d+)\.(\d+)\.(\d+)(?:[-+][\w.]*)?(?=$|[^\d])/i
```

- `v` prefix optional ("v1.5.0" / "1.5.0" 双方 OK)
- prerelease/build (`-beta.1+build.5` 等) は parse 時に無視、major.minor.patch のみ抽出
- 行頭 / 非数字直後 から 行末 / 非数字直前 まで 1 件抽出

### §4.4 fallback 候補化

`fallbackToDryRun=true` 時、caller (subscription-router 想定) は SubscriptionRouterInput.forceDryRun=true を渡して dry-run mode への切替判断材料とする。本 layer は警告発火と判断材料提供のみで、自動切替は行わない (副作用ゼロ要件 / DEC-019-007)。

---

## §5 Task D: テスト追加 (+37 tests)

### §5.1 kill-switch-subprocess-wiring.test.ts (15 tests)

| # | 名前 | 検証点 |
|---|---|---|
| 1 | KillToken 戻り値 (id + unregister) | 戻り値型 |
| 2 | unregister() で当該 target のみ skip | Set 削除確認 |
| 3 | unregister() idempotent (二重呼び safe) | 状態安定性 |
| 4 | trigger 時に SIGTERM 一斉送信 (3 件並列) | 並列送信確認 |
| 5 | SIGTERM 後 grace 経過 → SIGKILL fallback (Stubborn) | fallback 動作 |
| 6 | graceful target は SIGTERM only (SIGKILL 不要) | early-exit |
| 7 | mixed (graceful + stubborn) 同時 | 順次評価 |
| 8 | 256 件登録 OK、257 件目で KillSwitchError | 上限 enforcement |
| 9 | unregister 後に再登録可能 | 上限 release |
| 10 | 既に死んでいる target には SIGTERM 送らない | 無駄 signal 抑制 |
| 11 | SUBPROCESS_KILL_LIMIT === 256 | 定数 fix |
| 12 | KillSwitchError は code プロパティ + name='KillSwitchError' | error 構造 |
| 13 | KillToken.id がユニーク (50 件登録で id Set.size=50) | 衝突回避 |
| 14 | getRegisteredSubprocessCount で正しく増減 | 観測 helper |
| 15 | 戻り値破棄パターン (Round 11 互換) | 既存契約維持 |

### §5.2 cli-barrel-export.test.ts (8 tests)

| # | 名前 | 検証点 |
|---|---|---|
| 1 | cli barrel から spawn-claude-code 主要 export | function 4 件 |
| 2 | cli barrel から session-controller 主要 export | function 3 件 |
| 3 | cli barrel から subscription-router 主要 export | function 5 件 |
| 4 | cli barrel から cli-version-check 主要 export | function 3 件 + const 1 件 |
| 5 | 既存 import path 完全互換 (4 関数 reference 同一性) | 旧 path 互換 |
| 6 | runtime root から cli namespace export | namespace export |
| 7 | skill-adapter alias 衝突なし (3 関数を cli barrel に export しないこと) | 衝突回避 |
| 8 | overload export なし (各シンボル distinct origin) | 一意性 |

### §5.3 cli-version-check.test.ts (14 tests)

| # | 名前 | 検証点 |
|---|---|---|
| 1 | "claude-code 1.2.3" → {1,2,3} | 標準 case |
| 2 | "Claude Code CLI v1.5.0" → {1,5,0} | v prefix |
| 3 | "1.2.3-beta.1+build.5" → {1,2,3} | prerelease/build 無視 |
| 4 | 不正 input → null | fallback |
| 5 | range [1.0, 2.0): 1.0 / 1.5.3 / 1.99.99 → true | 境界 |
| 6 | range 範囲外: 0.9.0 / 2.0.0 / 3.5.0 → false | 境界外 |
| 7 | 範囲内 v1.2.3 → outcome=ok / fallback=false | DI 統合 ok |
| 8 | v2.0.0 → out_of_range + warning + fallback=true | DI 統合 oor |
| 9 | parse 失敗 → unparseable + fallback | DI 統合 unparseable |
| 10 | exit code 127 → spawn_failed + fallback | DI 統合 fail |
| 11 | spawner throw → spawn_failed + 起動失敗 warning | DI 統合 throw |
| 12 | timeout (delay 100ms / timeout 30ms) → timeout + fallback | DI 統合 timeout |
| 13 | acceptedRange 上書き [0.5, 1.0): v0.9.0=ok / v0.3.0=out_of_range | range 注入 |
| 14 | DEFAULT_ACCEPTED_RANGE 構造 | const fix |

### §5.4 テスト数集計

| package | baseline | Round 12 Dev-D 寄与 | 合計 |
|---|---|---|---|
| harness | 215 | +15 (kill-switch-subprocess-wiring) | **230** |
| openclaw-runtime | 152 (R11 末 118 + R12 Dev-C ndjson 18 + real-child-spawn 16) | +22 (cli-barrel-export 8 + cli-version-check 14) | **174** |
| **本 R12 Dev-D 寄与** | — | **+37 tests** | — |

### §5.5 workspace 全体 (新規実測)

| package | tests | status |
|---|---|---|
| audit | 16 | PASS |
| needs-scout | 120 | PASS |
| scripts/openclaw-monitor | 10 | PASS |
| harness | **230** (+15) | PASS |
| openclaw-runtime | **174** (+22 D + R12 Dev-C 寄与) | PASS |
| claude-bridge | 29 | PASS |
| e2e | 66 | PASS |
| notify | 23 | PASS |
| **合計** | **668 tests** | **all PASS** |

Round 11 末 507 → Round 12 着地 668 = +161 件 (本 Dev-D 単独寄与 +37 件、他 Round 12 並列 Agent 寄与 +124 件)。

---

## §6 制約遵守

| 制約 | 結果 |
|---|---|
| API 追加コスト = $0 (DEC-019-050 cap $30 残量無消費) | 達成 |
| TypeScript strict | 達成 (harness / openclaw-runtime 両 package で `pnpm typecheck` exit 0、verbatimModuleSyntax / exactOptionalPropertyTypes 違反 0) |
| pnpm workspace + vitest | 達成 (workspace 全 668 tests pass) |
| 並列 R12 他 Agent と file conflict 0 | 達成 (kill-switch.ts は append-only extend、cli/index.ts は新規、cli-version-check.ts は新規、cli/spawn-claude-code.ts と subscription-router.ts は append-only extend、Dev-C real-child-spawn.ts / ndjson-parser.ts は完全無 touch) |
| 既存 import path 完全互換 | 達成 (cli-barrel-export.test #5 で 4 関数の reference 同一性を固定化) |
| append-only 編集厳守 | 達成 (内部 private field の subprocessTargets → subprocessEntries 置換以外、すべて append-only 拡張) |
| Object.freeze 完全準拠 (DEC-019-010) | 維持 (cli-version-check の DEFAULT_ACCEPTED_RANGE は Object.freeze 適用) |
| 絵文字なし | 達成 (新規 4 file + 既存 extend 3 file + 本 report 全件、絵文字 grep ゼロ) |

---

## §7 引継 + Round 13 提案

### §7.1 Round 13 想定 (引継ぎ目論見)

| # | TODO | 担当 | 期限 |
|---|---|---|---|
| 1 | kill-switch の graceful shutdown timeout の設定可能化 (現 200ms 短縮 default → caller 上書き機構) | Dev / Round 13 | Phase 1 W3 |
| 2 | cli-version-check の auto-update prompt (HITL gate 第 12 種候補) | Dev / Round 13 | Phase 1 W3-W4 |
| 3 | wireSpawnHandleToKillSwitch を session-controller.start() に組み込み (現状は orchestrator が明示呼び出し) | Dev / Round 13 | Phase 1 W3 |
| 4 | cli barrel に Dev-C 着地済 real-child-spawn / ndjson-parser を append (alias prefix 命名規約遵守) | Dev / Round 13 | Phase 1 W3 |
| 5 | spawnFromDecision の cost-tracker / tos-monitor 自動連携 (subscription-router 入力の自動収集) | Dev-A1 / Round 13 | Phase 1 W3 |

### §7.2 連動 task の進捗

- **CB-D-W3-04 skill non-interactive mode adapter**: Round 11 Dev-A で完遂、Round 12 Dev-D は kill-switch 配線で kill chain 整合を強化
- **CB-D-W4-01 G-12 dry-run hardguard**: cli-version-check の fallbackToDryRun 候補化で連携準備完了
- **CB-D-W3-XX P-D 改 architecture**: Round 11 Dev-D cli/ 雛形 + Round 12 Dev-D cli barrel + version-check + kill-switch wiring で **5/26 開始予定 → 5/4 着地**、22 日前倒し維持
- **DEC-019-051 月総額 ≤$430 cap**: subscription-driven 中核手段の起動前 health check (cli-version-check) + kill-chain 整合 (256 上限 + auto-unregister) で耐久性向上

### §7.3 risk / open issue

- **pre-existing audit typecheck エラー** (audit-store.ts:44 `override` modifier 不足) は本 Dev-D 範囲外。Round 12 Dev-B / C 領域、別 Agent 引継ぎ。
- **wireSpawnHandleToKillSwitch** は orchestrator が明示呼び出し前提。session-controller.start() に組み込む統合は Round 13 引継ぎ。
- **cli-version-check** は起動時 1 回のみの health check で、ランタイム中の version 変更検出は行わない (CLI hot-update は想定外)。

---

## §8 結論

Round 12 Dev-D は Owner formal「最速で進めよ」directive 継続中の Round 12 を独立 Agent dispatch (DEC-019-025 SOP) で完遂。

**Task A**: kill-switch.registerSubprocessKill を KillToken 戻り値 + 256 件 Set 上限 + KillSwitchError + auto-unregister + 並列 SIGTERM→200ms grace→残存 SIGKILL に拡張、subscription-router / spawn-claude-code adapter 経路で wireSpawnHandleToKillSwitch + spawnFromDecision の auto 配線を実装。Round 6 G-05/G-06 既存 5 tests は無改変で互換維持。

**Task B**: cli/index.ts barrel + runtime root cli namespace export を統合、既存 import path 完全互換維持 + skill-adapter alias 衝突 0、Dev-C 後発依存 (real-child-spawn / ndjson-parser) の命名規約をコメントで明記。

**Task C**: cli-version-check.ts (parseClaudeCodeVersion 純関数 + isVersionInRange 純関数 + checkClaudeCodeVersion DI 統合 + 5 outcome 分岐 + fallbackToDryRun 候補化) を新規実装。

**Task D**: +37 tests (kill-switch-subprocess-wiring 15 + cli-barrel-export 8 + cli-version-check 14) 全 pass、目標 22-29 を 8 件超過。

workspace 全 668 tests 全 PASS、regression 0、TypeScript strict 合格 (harness / openclaw-runtime)、追加コスト $0、append-only 編集厳守、絵文字 0、既存 import path 完全互換。

---

**Sign-off**: 2026-05-04 W0-Week1 深夜 / Dev R12 Dev-D
**次回**: Round 13 で kill-switch graceful shutdown timeout 設定可能化 + cli-version-check auto-update prompt (HITL gate) + wireSpawnHandleToKillSwitch を session-controller.start() に組み込み
