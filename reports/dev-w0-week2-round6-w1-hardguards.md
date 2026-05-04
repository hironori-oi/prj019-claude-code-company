# Dev W0-Week2 Round 6 — Phase 1 W1 ハードガード前倒し実装レポート

- 案件: PRJ-019 Open Claw / Clawbridge
- 起票日: 2026-05-04 W0-Week1
- 作業者: Dev 部門
- 起票根拠: CEO Round 6 案 4 — 議決-25 採択前提 (否決確率 4% 以下、リスク受容済) で
  Phase 1 W1 ハードガード G-01 / G-04 / G-05 / G-06 / G-08 を W0-Week1 へ前倒し実装

## 1. サマリ

| Task | 範囲 | 実装ファイル | 新規テスト |
|------|------|------------|------------|
| G-01 | subprocess spawn 副作用ゼロ (env / cwd / argv whitelist) | `app/openclaw-runtime/src/wrapper.ts`, `index.ts`, 既存 `wrapper-contract.test.ts` 更新 | `spawn-isolation.test.ts` 10 cases |
| G-04 | usage monitor watchdog $24/$28.5/$30 + Slack hook + injectable interval | `app/harness/src/cost-tracker.ts`, `usage-monitor.ts`, `index.ts` | `watchdog.test.ts` 13 cases |
| G-05/G-06 | kill-switch + circuit-breaker 統合 (SIGTERM → SIGKILL fallback / forceOpen 連鎖) | `app/harness/src/kill-switch.ts`, `circuit-breaker.ts`, `index.ts` | `kill-chain.test.ts` 5 cases |
| G-08 | preflight env check CI 連携 (`preflight:ci` + GitHub Actions step) | `app/scripts/preflight-env.ts`, `app/package.json`, `.github/workflows/openclaw-monitor.yml` | `tests/unit/preflight-ci.test.ts` 8 cases |

合計 新規テスト: 36 cases (要求 11 以上を大幅超過)。

## 2. 各 Task 詳細

### 2.1 G-01 — subprocess spawn 副作用ゼロ

**設計判断**:
- `SubprocessSpawnContract` に `cwd: string` と `argvWhitelist: readonly string[]` を必須フィールド追加。
  既存 env allow-list と合わせて 3 軸 (env / cwd / argv) すべてを契約レベルで強制する。
- `process.env` / `process.cwd()` / `process.argv` を子プロセスに透過しないよう、
  純関数 `buildAllowedEnv(allowList, source)`、`defaultIsolatedCwd()`、`buildSpawnContract(opts)` を導入。
- `defaultIsolatedCwd()` は `os.tmpdir()` を返し、親 monorepo (claude-code-company) や PRJ-019 の path は
  絶対に既定 cwd に出ない (DEC-019-007 副作用ゼロ要件)。
- `buildSpawnContract` 戻り値は `Object.freeze` で完全 immutable 化。
- `createOpenclawRuntime` に第 2 引数 `CreateOpenclawRuntimeOptions` を追加 (cwd / envSource / argvWhitelist 注入)。
  Mock パスでは現状参照しないが、Real 移行時 (W1) に SubprocessSpawnContract 構築時へ流す前提のスロット。

**before / after 行数**:
- `wrapper.ts`: 225 → 318 行 (+93、SpawnIsolation helpers と doc comment が中心)
- `index.ts`: 22 → 26 行 (+4、新規 export)

**テスト結果**:
```
src/__tests__/spawn-isolation.test.ts (10 tests) 5ms
  buildAllowedEnv: secret 混入なし / 空配列 / undefined skip      3 pass
  defaultIsolatedCwd: tmpdir 一致 / monorepo path 不混入            2 pass
  buildSpawnContract: defaults / 全引数尊重 / frozen                3 pass
  createOpenclawRuntime: options 互換 / 後方互換                    2 pass
```

### 2.2 G-04 — usage monitor watchdog 3 段階閾値

**設計判断**:
- 閾値は `BudgetLimits.perDayUsd` を基準にした比率 (warn 0.8 / auto_stop 0.95 / hard_fail 1.0) で算出。
  既定値で $24 / $28.5 / $30 となり、limits 変更時に自動追従する。
- `cost-tracker.ts` 側に純関数 `computeWatchdogThresholds()` と `classifyWatchdogTier()` を追加。
  これにより Slack 通知ハンドラ単独でも tier 判定が可能。
- `usage-monitor.ts` の `FileUsageMonitor` を拡張し、`costTracker` / `notifySlackMonitor` / `watchIntervalMs` を注入可能に。
  `checkWatchdog()` で 1 サイクル評価、`getWatchdogState()` で現状取得。
- 重複通知抑止のため tier 順序 (warn=1 / auto_stop=2 / hard_fail=3) を内部管理し、
  既に同 or 高 tier で発火済の場合は Slack 通知 + kill 動作をスキップ (冪等性)。
- `auto_stop` tier は `watchdogState.autoStopped=true` をフラグ化するのみで kill しない (Open Claw 自走停止判断に使用)。
- `hard_fail` tier では `killSwitch.trigger(reason, source: 'budget')` を呼ぶ。
- polling interval (`watchIntervalMs`) を injectable に変更 (default 60_000 → テスト時 50ms 等で短縮)。

**before / after 行数**:
- `cost-tracker.ts`: 246 → 308 行 (+62、watchdog tier 純関数 / 型定義)
- `usage-monitor.ts`: 266 → 401 行 (+135、watchdog state / checkWatchdog ロジック)
- `index.ts`: 165 → 173 行 (+8、新規 export)

**テスト結果**:
```
src/__tests__/watchdog.test.ts (13 tests) 175ms
  computeWatchdogThresholds: default $24/$28.5/$30 / 比率追従       2 pass
  classifyWatchdogTier: 4 境界                                      4 pass
  FileUsageMonitor watchdog: warn / auto_stop / hard_fail           3 pass
  冪等性 (同 tier 連続 / 段階昇格)                                  2 pass
  cost-tracker 未注入 no-op / interval injectable                   2 pass
```

### 2.3 G-05 / G-06 — kill-switch + circuit-breaker 統合

**設計判断**:
- `SubprocessKillTarget` interface (G-05): `name / alive() / signal('SIGTERM' | 'SIGKILL') / gracePeriodMs` の 4 メンバ。
  Real 実装は openclaw-runtime 側が担う (W1)。SIGTERM 後 gracePeriodMs (default 2s) 経過しても `alive()` が
  true なら SIGKILL に escalate。
- `CircuitBreakerOpenTarget` interface (G-06): `name / forceOpen(reason?)` の 2 メンバ。
  既存 `CircuitBreaker` クラスに `forceOpen()` と `getName()` を追加して契約適合。
- `FileKillSwitch` に `registerSubprocessKill()` / `registerCircuitBreakerOpen()` を追加。
  `trigger()` 内で順序を厳守: history 書込 → CB forceOpen → subprocess kill → onTrigger handlers → disarm → exit。
  CB を先に open することで新規 fire を即拒否し、既走 subprocess は SIGTERM/SIGKILL で停止する。
- Polling 50ms の sleep ループで grace 監視。time-source は注入していないが、テスト用に gracePeriodMs を 50ms へ短縮できる。

**before / after 行数**:
- `kill-switch.ts`: 215 → 308 行 (+93、register* / killAllSubprocesses / 契約 interface 定義)
- `circuit-breaker.ts`: 148 → 165 行 (+17、forceOpen / getName 追加)
- `index.ts`: +2 行 (export 追加)

**テスト結果**:
```
src/__tests__/kill-chain.test.ts (5 tests) 168ms
  G-06: trigger 検知時 CB が open に強制遷移 + fire が CircuitOpenError    1 pass
  G-05: SIGTERM gracefully → SIGKILL 不要                                 1 pass
  G-05: SIGTERM 無視 stubborn → gracePeriodMs 後 SIGKILL escalate          1 pass
  CB open → subprocess kill 順序 (連鎖統合)                                 1 pass
  複数 subprocess 全件 SIGTERM                                              1 pass
```

### 2.4 G-08 — preflight env check CI 連携

**設計判断**:
- 既存 `preflight-env.ts` に `--ci` flag を追加。`isCiMode(argv)` 純関数で判定。
- CI mode は exit code を区別 (0=PASS / 2=FAIL fail-fast)。dev mode は exit 1 を維持し後方互換確保。
- ESM トップレベルで `process.exit()` を呼んでいたため、`isDirectInvocation()` (= `import.meta.url` と `process.argv[1]` の case-insensitive 比較) で守る。
  これにより vitest からの import が `process.exit` で落ちる問題を解消。
- `package.json` に `preflight:ci` script を追加。
- `.github/workflows/openclaw-monitor.yml` の Run check step 直前に Preflight env check (G-08) step を挿入。
  Tier 1 真の secret 9 fields を env で流し込み、`pnpm run preflight:ci` を実行。
  exit 2 fail-fast で workflow が止まり、誤った Slack post を確実に防ぐ。

**before / after 行数**:
- `preflight-env.ts`: 299 → 339 行 (+40、CI mode + isDirectInvocation guard)
- `package.json`: +2 行 (script + comment)
- `openclaw-monitor.yml`: +24 行 (Preflight step 1 つ追加)

**テスト結果**:
```
tests/unit/preflight-ci.test.ts (8 tests) 5ms
  isCiMode flag parser                                       2 pass
  TIER1_FIELDS 9 / 全 resolved 時 / op:// 全 unresolved      3 pass
  classify: missing / unresolved / resolved                   3 pass
```

CI mode 動作確認 (実機):
```
$ pnpm tsx scripts/preflight-env.ts --ci > /dev/null 2>&1; echo $?
2  (= unresolved 9 fields → fail-fast)

$ pnpm tsx scripts/preflight-env.ts > /dev/null 2>&1; echo $?
1  (= dev mode、後方互換維持)
```

## 3. テスト全体集計

| Package | 前 | 後 | 増分 |
|---------|----|----|------|
| `@clawbridge/openclaw-runtime` | 14 | 24 | +10 |
| `@clawbridge/harness` | 61 | 79 | +18 |
| `app/tests/unit/preflight-ci` | 0 | 8 | +8 |
| **合計** | **75** | **111** | **+36** |

要求 ≥ 11 cases に対し +36 cases (3.3 倍)。regression 0 (両 package 全 pass)。

## 4. typecheck / lint

- `pnpm --filter @clawbridge/openclaw-runtime typecheck`: 0 errors
- `pnpm --filter @clawbridge/harness typecheck`: 0 errors
- lint warnings: 既存 (`harness/src/index.ts:117 unused eslint-disable`、
  `harness/src/__tests__/kill-switch.test.ts:123 Array<T>` 等) のみ、
  本件で新規導入したものは無し。

## 5. 議決-25 否決時 rollback 手順

議決-25 (Round 6 案 4 採択) が否決された場合の rollback は以下:

### 5.1 Git レベル

本件は単一コミットで提供 (CEO 側が staged を確認後 commit) するため、否決時は

```
git reset --soft HEAD~1   # commit を戻す (staged 維持)
git restore --staged .    # staged を unstaged 化
git checkout --           # 全 local 変更を破棄
```

の手順で完全に戻せる (tag / branch を切るのが安全)。

### 5.2 ファイル単位の rollback

以下を逆操作すれば完全に W0 baseline へ戻る:

| ファイル | 戻し方 |
|---------|--------|
| `app/openclaw-runtime/src/wrapper.ts` | `cwd` / `argvWhitelist` フィールドおよび `buildAllowedEnv` / `buildSpawnContract` / `defaultIsolatedCwd` / `CreateOpenclawRuntimeOptions` を削除。`SubprocessSpawnContract` を 5 フィールドへ縮小。 |
| `app/openclaw-runtime/src/index.ts` | `buildAllowedEnv` / `buildSpawnContract` / `defaultIsolatedCwd` / `BuildSpawnContractOptions` / `CreateOpenclawRuntimeOptions` の export を削除。 |
| `app/openclaw-runtime/src/__tests__/wrapper-contract.test.ts` | `cwd` / `argvWhitelist` 行を削除し 5 フィールドへ戻す。 |
| `app/openclaw-runtime/src/__tests__/spawn-isolation.test.ts` | ファイル削除。 |
| `app/harness/src/cost-tracker.ts` | `WatchdogTier` / `WatchdogThreshold` / `DEFAULT_WATCHDOG_RATIOS` / `computeWatchdogThresholds` / `classifyWatchdogTier` を削除。 |
| `app/harness/src/usage-monitor.ts` | `costTracker` / `watchdogLimits` / `notifySlackMonitor` / `watchIntervalMs` / `getWatchdogState` / `checkWatchdog` / `WatchdogState` / `SlackMonitorNotify` を削除。`startRuntimeWatch` の interval を 60_000 リテラルに戻す。 |
| `app/harness/src/kill-switch.ts` | `SubprocessKillTarget` / `CircuitBreakerOpenTarget` / `registerSubprocessKill` / `registerCircuitBreakerOpen` / `killAllSubprocesses` を削除。`trigger()` 内の CB open 連鎖と subprocess kill 行を除去。 |
| `app/harness/src/circuit-breaker.ts` | `forceOpen` / `getName` を削除。 |
| `app/harness/src/index.ts` | watchdog / kill-chain 関連 export を削除。 |
| `app/harness/src/__tests__/watchdog.test.ts` | ファイル削除。 |
| `app/harness/src/__tests__/kill-chain.test.ts` | ファイル削除。 |
| `app/scripts/preflight-env.ts` | `isCiMode` / CI mode 分岐 / `isDirectInvocation` guard を削除。トップレベル `process.exit()` を元の形に戻す。 |
| `app/tests/unit/preflight-ci.test.ts` | ファイル削除。 |
| `app/package.json` | `preflight:ci` script と関連コメントを削除。 |
| `.github/workflows/openclaw-monitor.yml` | `Preflight env check (G-08)` step を削除。 |

すべて削除/縮小のみ (新規 import 依存無し) のため、rollback で他コードに影響しない。

### 5.3 リスク

- 否決時 rollback のシナリオ確率は事前評価で 4% 以下と提示済 (CEO Round 5/6)。
- rollback 所要時間: ファイル単位 git revert なら 5 分以内、commit 全戻しなら 1 分以内。
- 副作用ゼロ要件 (DEC-019-007) は「親 monorepo PRJ-001..018 を変更しない」点で本実装も維持
  (`verify-zero-side-effect.sh` の対象外 path = `projects/PRJ-019/app/...` 内に閉じている)。

## 6. 完了基準チェック

- [x] `pnpm --filter @clawbridge/openclaw-runtime test` 全 24 件 pass
- [x] `pnpm --filter @clawbridge/harness test` 全 79 件 pass
- [x] `pnpm --filter @clawbridge/openclaw-runtime typecheck` 0 errors
- [x] `pnpm --filter @clawbridge/harness typecheck` 0 errors
- [x] 新規テスト 11 cases 以上 (実績 36 cases)
- [x] regression 0 (target 両 package + preflight unit tests とも前 baseline 同等以上)
- [x] TypeScript strict mode 維持
- [x] 0 emojis (CLAUDE.md `feedback_no_emoji`)
- [x] staged で報告 (commit / push なし、CEO 側で確認後に実施)

## 7. 残課題 / 次アクション

- W1 (5/19-) Real OpenclawRuntime 実装時に `buildSpawnContract` を経由して `child_process.spawn` を呼ぶ
  実装を追加 (CB-D-W1-XX)。本件で土台が整ったため Real 実装は wrapper パターンのみで完結する。
- Slack #monitor 通知 hook の実装は本件では noop default。`notify` パッケージの実装が landed したら
  `FileUsageMonitor` に注入する。
- `preflight:ci` step は GitHub Actions Secrets 登録 (RC-Vault-* 完了後) で初めて全 9 resolved になる。
  それまで CI ジョブは preflight で fail-fast し、誤発火を防ぐ。
