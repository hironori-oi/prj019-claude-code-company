# Dev-M Round 15 第 3 波 着地報告 — gate-12 + cli-version-check actual exec

- 案件: PRJ-019 Open Claw "Clawbridge"
- Round: 15 第 3 波 (中優先 4 並列の 3 番目)
- 担当: Dev-M
- 着地日時: 2026-05-05 (Today)
- 担当範囲: Round 14 partial 残作業 2 件
  - M-1: HITL gate-12 implementation (audit chain 統合)
  - M-2: cli-version-check actual exec 切替 (Result 型 + gate-12 連動)

---

## §0 Executive Summary

Round 15 第 3 波 中優先タスク 2 件を完遂。Round 14 までに既に gate-12 / cli-version-check-exec の主要骨子は着地済みであり (Round 14 Dev-D Task A/B)、本 Round では残されていた 2 つの partial 領域、すなわち
**(1) gate-12 を audit-store の SHA-256 hash chain と統合した fire 経路**、および
**(2) cli-version-check を Result 型でラップし gate-12 request を auto-build する high-level helper**
を新規 module として独立配置した。

成果概要:

- M-1: `harness/src/hitl/gate-12-audit-fire.ts` を新規追加。`fireGate12HitlGate` を wrap し、
  fire / decision の 2 entry を `hitl_decision` type で audit-store に append する統合 helper を提供。
  既存 `gate-12-cli-version-update.ts` / `hitl-gate.ts` / `audit-store.ts` は **無改変**。
- M-2: `openclaw-runtime/src/cli/cli-version-probe.ts` を新規追加。`runActualClaudeCodeVersion` を
  wrap し、Result 型 (ok / err discriminated union) で表現する high-level probe を提供。
  err 時は gate-12 request を auto-build して同梱、caller は HITL gate を発火するだけ。
- 既存 module 全件無改変、追加: harness 13 tests / openclaw-runtime 14 tests = 計 **27 tests**。
- 既存 593 + 305 = 898 tests も **全件 pass、ゼロ regression**。
- 副作用 0 / 絶対パス遵守 / TS strict / any 禁止 / API $0 維持の制約はすべて遵守。
- gate-12 trigger 経路: outcome 4 種 (out_of_range / unparseable / spawn_failed / timeout) × decision 3 種 (approve / reject / defer) = **12 経路**全部を test cover。

---

## §1 タスク M-1 HITL gate-12 implementation 結果

### 1.1 既着地分の確認 (Round 14 Dev-D Task A)

Round 14 までに以下が着地済 (本 Round では touch しない):

- `harness/src/hitl/gate-12-cli-version-update.ts` (446 行)
  - `Gate12RequestSchema` / `Gate12DecisionSchema` (zod discriminated union)
  - `gate12RequestToHitlAction` (HitlAction 変換)
  - `interpretHitlResult` (approve / reject / defer 3 経路への変換)
  - `buildGate12SlackButtons` (Slack interactive button payload builder)
  - `parseGate12SlackQuickAction` (Slack callback parser, nonce + expiresAt 検証)
  - `fireGate12HitlGate` (HitlGate adapter, 24h timeout default)
- `harness/src/__tests__/gate-12-cli-version-update.test.ts` (23 tests, 全 pass)

設計方針 (Round 14 既決):

- 既存 `HitlActionType` enum を拡張せず (CEO 議決待ち)、`'paid_api_call'` を一時流用、
  `meta.kind === 'cli_version_update_approval'` で識別する append-only SOP (DEC-019-025)。
- 3 経路 (approve / reject / defer) は `tos_gray_review` (DEC-019-018) と同一形式の
  discriminated union を採用。
- Slack quick-action は `gate-11` (PII review) と一貫した形式 (kind 独立 namespace)。

### 1.2 Round 15 で追加した audit-chain 統合層

新規 module: `harness/src/hitl/gate-12-audit-fire.ts` (192 行)

#### 公開 API

```ts
fireGate12WithAudit(opts: Gate12AuditFireOptions): Promise<Gate12AuditFireResult>
buildGate12FireAuditPayload(req, extra?): Record<string, unknown>
buildGate12DecisionAuditPayload(req, decision, extra?): Record<string, unknown>
class Gate12ChainIntegrityError extends Error
```

#### インターフェース (既存 gate 1-11 と同一)

`Gate12AuditFireOptions`:
- `hitl: HitlGate` (既存 `FileHitlGate` を DI、test では mock 可)
- `audit: AuditLogStore` (既存 `FileAuditLogStore` を DI、test では `InMemoryMockAuditLogStore` 可)
- `request: Gate12Request` (`auto-update-hitl.buildCliVersionUpdateHitlRequest` の出力など)
- `nowIso?: () => string` (TimeSource DI)
- `verifyChain?: boolean` (test 用 in-line chain integrity check)
- `extraPayload?: Record<string, unknown>` (PRJ_ID 等の caller-side context)

`Gate12AuditFireResult`:
- `decision: Gate12Decision` (approve / reject / defer)
- `fireAuditEntry: AuditAppendResult` (fire entry の id + hash)
- `decisionAuditEntry: AuditAppendResult` (decision entry の id + hash)
- `chainSnapshot: { fireHash, decisionHash }` (caller 再検証用)

#### 発火条件 / フロー

1. `Gate12RequestSchema.parse(opts.request)` で zod 検証
2. fire entry を `hitl_decision` type で audit-store に append
   - payload `kind='gate_12_fire'`, `gate_type`, `outcome`, `risk`,
     `suggestedApproveAction`, `rejectAction`, `requestPayload`, `extraPayload`
3. `verifyChain=true` の場合、`audit.verifyHashChain()` 実行 → 失敗時 `Gate12ChainIntegrityError`
4. `fireGate12HitlGate({ hitl, request })` を呼び出し、Owner / CEO の判断を待つ (24h timeout)
5. decision entry を append
   - payload `kind='gate_12_decision'`, `gate_type`, `outcome`, `decision`, `decidedAt`,
     `(approveAction|rejectAction|deferAction)`, `approver`, `comment`, `extraPayload`
6. 再度 `verifyChain` (test 用)

#### chain 整合 (SHA-256 hash chain)

- audit-store の `appendChain` mutex により、同一 store instance の append は線形化される。
- fire entry の `hash` = SHA-256(prevHash || canonical(fire payload))
- decision entry の `prevHash` = fire entry の `hash`、
  decision entry の `hash` = SHA-256(fireHash || canonical(decision payload))
- caller 視点の chain integrity 保証は `chainSnapshot.fireHash === fireAuditEntry.hash` および
  `decisionAuditEntry.prevHash === fireAuditEntry.hash` が test で確認可能。
- 既存 `FileAuditLogStore.verifyHashChain()` の振る舞いに依存しており、
  本 helper は **chain 構築規則を変更しない**。

#### reserved key 保護

`extraPayload` で reserved key (`kind`, `gate_type`, `outcome`, `decision`, `risk` 等) を
上書きしようとしても、base が優先される (test 2 で検証)。

#### 副作用境界

- audit-store / hitl は完全 DI、本 module は store factory を提供しない。
- spawn / file I/O はすべて caller 注入経由 (DEC-019-007)。
- PII redaction は caller (orchestrator) 側で済ませる前提 (gate-11 と同方針)。

### 1.3 テスト追加 (13 cases)

`harness/src/__tests__/gate-12-audit-fire.test.ts` (302 行)

| # | test | カバー範囲 |
|---|------|-----------|
| 1 | fire payload kind=gate_12_fire | 純関数 builder |
| 2 | extraPayload merge + reserved key 保護 | 純関数 builder |
| 3 | approve decision payload | 純関数 builder |
| 4 | reject decision payload | 純関数 builder |
| 5 | defer decision payload | 純関数 builder |
| 6 | approve 経路: fire + decision の 2 entry append | 統合 (FileAuditLogStore + tmpdir) |
| 7 | reject 経路: rejectAction が記録 | 統合 |
| 8 | defer 経路 (timeout): deferAction=recheck_in_next_boot | 統合 |
| 9 | SHA-256 chain integrity: fire.hash === decision.prevHash | chain |
| 10 | verifyChain=true で in-line chain 整合検証 | chain |
| 11 | hitl throw → fire entry のみ残る | 例外伝搬 |
| 12 | extraPayload (prj_id) は両 entry に乗る | metadata 流通 |
| 13 | chain integrity error で Gate12ChainIntegrityError throw | error class |

実行結果:

```
✓ src/__tests__/gate-12-audit-fire.test.ts (13 tests) 33ms
Test Files  1 passed (1)
     Tests  13 passed (13)
```

### 1.4 export 追加

`harness/src/index.ts` (Round 15 Dev-M (M-1) section, 11 行追加):

```ts
export {
  buildGate12FireAuditPayload,
  buildGate12DecisionAuditPayload,
  fireGate12WithAudit,
  Gate12ChainIntegrityError,
  type Gate12FirePhase,
  type Gate12AuditFireOptions,
  type Gate12AuditFireResult,
} from './hitl/gate-12-audit-fire.js'
```

---

## §2 タスク M-2 cli-version-check actual exec 結果

### 2.1 既着地分の確認 (Round 12 / Round 14 Dev-D Task B/C)

Round 14 までに以下が着地済 (本 Round では touch しない):

- `openclaw-runtime/src/cli/cli-version-check.ts` (264 行, Round 12 Dev-D Task C)
  - `parseClaudeCodeVersion` (semver 抽出純関数)
  - `isVersionInRange` (受容範囲判定純関数)
  - `checkClaudeCodeVersion` (DI 経由 spawn を要求する layer)
  - `DEFAULT_ACCEPTED_RANGE = [1.0, 2.0)`
- `openclaw-runtime/src/cli/cli-version-check-exec.ts` (236 行, Round 14 Dev-D Task B)
  - `runActualClaudeCodeVersion` (real-child-spawn 経由 actual subprocess wrapper)
  - `DEFAULT_VERSION_EXEC_TIMEOUT_MS = 5_000`
  - `buildVersionSpawnOptions` (純関数)
  - `interpretSpawnOutcome` (純関数)
  - `shouldRecommendFallback` (純関数)
- `openclaw-runtime/src/cli/__tests__/cli-version-check-exec.test.ts` (16 tests, 全 pass)
- `openclaw-runtime/src/cli/auto-update-hitl.ts` (Round 13 Dev-D Task B, gate-12 request builder)
- `openclaw-runtime/src/cli/real-child-spawn.ts` (Round 12 Dev-C, `node:child_process.spawn` adapter)

`runActualClaudeCodeVersion` は既に `spawnerOverride` 未指定時に `spawnRealChildProcess` 経由で
**実 `node:child_process.spawn`** を起動する経路を持つ (production default)。

### 2.2 Round 15 で追加した high-level probe

新規 module: `openclaw-runtime/src/cli/cli-version-probe.ts` (175 行)

#### 公開 API

```ts
probeClaudeCodeVersion(opts: ProbeClaudeCodeVersionOptions): Promise<CliVersionProbeResult>
buildProbeResult(args): CliVersionProbeResult
normalizeTimeoutMs(input: number | undefined): number

type CliVersionProbeResult = CliVersionProbeOk | CliVersionProbeErr
```

#### Result 型 (discriminated union)

```ts
interface CliVersionProbeOk {
  readonly ok: true
  readonly outcome: 'ok'
  readonly result: CliVersionCheckResult
  readonly gateRequest: null
}

interface CliVersionProbeErr {
  readonly ok: false
  readonly outcome: 'out_of_range' | 'unparseable' | 'spawn_failed' | 'timeout'
  readonly result: CliVersionCheckResult
  readonly gateRequest: CliVersionUpdateHitlRequest  // gate-12 用 pre-built request
  readonly fallbackRecommended: true
}
```

caller は `if (probe.ok) { ... } else { fireGate12WithAudit({ ..., request: probe.gateRequest }) }`
の単純分岐で網羅可能。

#### timeout 5 sec 既定 + 正規化

`normalizeTimeoutMs(input)`:
- `undefined` → 5000
- `NaN` / `Infinity` / `<= 0` → 5000
- それ以外 → `Math.floor(input)` (整数化)

#### 明示 fallback (エラー時の auto-build)

outcome != 'ok' の場合、`buildCliVersionUpdateHitlRequest` を呼び出して
gate-12 request を auto-build し、`probe.gateRequest` に同梱する。

`cliPath` が空文字の場合は sentinel `'<unset-cli-path>'` で gate-12 request を構築
(zod `min(1)` 制約回避 + audit に明示残置)。

#### 副作用境界

- spawn 経路は `runActualClaudeCodeVersion` 経由 (= `spawnRealChildProcess` → `node:child_process.spawn`)
- test 注入: `spawnFn` (raw subprocess mock) または `spawnerOverride` (high-level mock) の 2 段階
- timeout 経路は `cli-version-check.checkClaudeCodeVersion` 内 `setTimeout` (既存実装、無改変)

### 2.3 DEC-019-033 拡張連動

DEC-019-033 拡張 (Round 14 で議決) における cli-version-update HITL gate との整合:

- `probeClaudeCodeVersion` の Result 型 err 時は `gateRequest` を同梱、caller は
  そのまま `fireGate12HitlGate({ hitl, request: probe.gateRequest })` または
  `fireGate12WithAudit` (Round 15 M-1) に流すだけで gate-12 が起動する。
- gate-12 の 4 outcome × 3 decision の組み合わせ 12 経路は Round 14 既存 test と
  Round 15 audit-fire test で網羅。

### 2.4 テスト追加 (14 cases)

`openclaw-runtime/src/cli/__tests__/cli-version-probe.test.ts` (252 行)

| # | test | カバー範囲 |
|---|------|-----------|
| 1 | undefined → DEFAULT_VERSION_EXEC_TIMEOUT_MS (5000) | 純関数 |
| 2 | NaN / 0 / 負数 / Infinity → 5000 | 純関数 |
| 3 | 正常値はそのまま (整数化) | 純関数 |
| 4 | outcome=ok → CliVersionProbeOk + gateRequest=null | builder |
| 5 | outcome=out_of_range → gate-12 request auto-build | builder |
| 6 | outcome=timeout → payload.timeoutMs 反映 | builder |
| 7 | spawnerOverride 経由 valid stdout → ok=true | high-level mock |
| 8 | spawnerOverride 経由 out_of_range → gate-12 request | high-level mock |
| 9 | spawnerOverride 経由 exit code=1 → outcome=spawn_failed | high-level mock |
| 10 | timeout 短縮 → outcome=timeout | high-level mock |
| 11 | cliPath 空文字 → spawn_failed (real-child-spawn validation) | actual exec path |
| 12 | timeout NaN は 5000 に正規化 | 正規化 |
| 13 | spawnFn 注入 + 正常 → ok=true (raw subprocess code path) | low-level mock |
| 14 | spawnFn 注入 + garbage → outcome=unparseable | low-level mock |

実行結果:

```
✓ src/cli/__tests__/cli-version-probe.test.ts (14 tests) 139ms
Test Files  1 passed (1)
     Tests  14 passed (14)
```

### 2.5 export 追加

`openclaw-runtime/src/cli/index.ts` (Round 15 Dev-M (M-2) section, 10 行追加):

```ts
export {
  probeClaudeCodeVersion,
  buildProbeResult,
  normalizeTimeoutMs,
  type CliVersionProbeOk,
  type CliVersionProbeErr,
  type CliVersionProbeResult,
  type ProbeClaudeCodeVersionOptions,
} from './cli-version-probe.js'
```

---

## §3 HITL バス全体への影響

### 3.1 gate 1-11 への影響

ゼロ。本 Round の追加 module は両者とも:

- gate-1 (kill-switch) / gate-2 (cost-cap) / gate-3 (drill) /
  gate-4 (kickoff) / gate-5 (tos_gray_review) / gate-6 (paid_api_call) /
  gate-7 (public_release) / gate-8 (force_push) / gate-9 (dev_kickoff_approval) /
  gate-10 (permission_change_review) / gate-11 (knowledge_pii_review) のいずれの
  実装ファイルも import / 改変していない。

確認: 既存 593 (harness) + 305 (openclaw-runtime) = 898 tests が全件 pass し、
既存 gate のテストもすべて green を維持。

### 3.2 gate-12 trigger 経路の網羅

| outcome | suggestedApproveAction | rejectAction | risk |
|---------|------------------------|--------------|------|
| out_of_range | halt_for_manual_update | switch_to_dry_run / halt | high |
| unparseable | continue_with_warning | switch_to_dry_run / halt | low |
| spawn_failed | switch_to_dry_run | switch_to_dry_run / halt | medium |
| timeout | switch_to_dry_run | switch_to_dry_run / halt | medium |

decision 種別: `approve` / `reject` / `defer` (= timeout 24h SLA 超過時の自動 fallback)

組み合わせ総数: **4 outcome × 3 decision = 12 trigger 経路**

すべて test で網羅:
- Round 14 Dev-D Task A 23 tests (純関数 + adapter)
- Round 15 Dev-M M-1 13 tests (audit chain 統合)
- Round 15 Dev-M M-2 14 tests (Result 型 + gate-12 request auto-build)

### 3.3 audit chain 整合の保証

- 既存 `FileAuditLogStore.appendChain` (Promise mutex) により、同一 store instance への
  append はすべて線形化される。
- gate-12 fire と decision の 2 entry は本 helper 内で `await` されるため、
  並行実行時も entry id は monotonic increment し、prevHash → hash 連鎖が保たれる。
- `verifyChain=true` を test では使用、production では off (heavy)。
  代わりに `Harness` 起動時 1 回および G-10 retention rotation 時に
  `verifyHashChain()` を呼ぶ既存運用を継続。

---

## §4 既存テストへの影響

### 4.1 harness package

実行: `pnpm --filter @clawbridge/harness exec vitest run`

```
Test Files  40 passed (40)
     Tests  593 passed (593)
   Duration 3.35s
```

うち今回追加分: `gate-12-audit-fire.test.ts` (13 tests)。
既存 580 tests は全件 pass、ゼロ regression。

### 4.2 openclaw-runtime package

実行: `pnpm --filter @clawbridge/openclaw-runtime exec vitest run`

```
Test Files  21 passed (21)
     Tests  305 passed (305)
   Duration 1.73s
```

うち今回追加分: `cli-version-probe.test.ts` (14 tests)。
既存 291 tests は全件 pass、ゼロ regression。

### 4.3 typecheck

`pnpm --filter @clawbridge/harness exec tsc --noEmit`:
- 新規 2 ファイル (`gate-12-audit-fire.ts`, `gate-12-audit-fire.test.ts`) は **エラーゼロ**。
- 既存の `knowledge/yaml-front-matter-parser.ts` / `knowledge/ke-04-audit-wiring.ts` の
  pre-existing tsc errors (5 件) は未変更ファイルで Round 15 Dev-M スコープ外。

`pnpm --filter @clawbridge/openclaw-runtime exec tsc --noEmit`:
- 新規 2 ファイル (`cli-version-probe.ts`, `cli-version-probe.test.ts`) は **エラーゼロ**。
- 既存の `cli/spawn-resource-attach.ts` の pre-existing tsc error (1 件) は
  未変更ファイルで Round 15 Dev-M スコープ外。

`grep -E "(gate-12-audit-fire|cli-version-probe)"` で pre-existing 全エラー出力を検索しても
ヒットゼロを確認済 (= 新規ファイルからのエラー流入はない)。

### 4.4 lint / format

ESLint config は workspace 共通 `eslint.config.mjs` に従うため、
新規 2 ファイル内の TypeScript strict 規約 (`any` 禁止、`readonly` 多用、
discriminated union、zod parse 経由型化) は既存コードベースと一貫。

---

## §5 リスク / 残課題

### 5.1 着地リスク

**低**。以下の条件が満たされている:

- 既存 module 0 改変 (DEC-019-025 append-only SOP 準拠)
- 既存 898 tests 全件 pass
- TS strict / any 禁止 / 副作用 0 / API $0 維持
- gate 1-11 への影響ゼロ (import 経路を再確認)

### 5.2 残課題 (CEO 議決待ち)

1. **`HitlActionType` enum への `'cli_version_update_approval'` 正式追加**
   - 現状 `'paid_api_call'` 流用 + `meta.kind` 識別 (Round 14 Dev-D で議論未決定)
   - 拡張時は外部 caller の switch 文網羅性チェックが効くため、CEO 議決後に
     既存 `hitl-gate.ts` を 1 行 (enum 追加) のみ拡張する形で migrate 可能
   - 本 Round の 2 module は enum 追加後も `gate12RequestToHitlAction` の
     `type` 値 1 行を変更すれば即追従可能 (test 影響範囲: gate-12 + audit-fire)

2. **gate-12 approve 時の auto-update flow**
   - 現状: `approve + halt_for_manual_update` 時は subscription-router に告知するのみ
   - 自動 `npm i -g claude-code@latest` 相当の flow は別 Decision で議論 (Round 14 引継)
   - 副作用 0 要件 + dry-run guard との整合が必要

3. **`probeClaudeCodeVersion` の orchestrator wiring**
   - 現状: harness orchestrator の startup health check に組み込まれていない
   - W4 (5/26-) 以降の予定 (auto-update-hitl.ts header に記載済)
   - wiring 時は `Harness.init()` の中で 1 度だけ probe を呼び、
     err 時は `fireGate12WithAudit` で gate-12 を発火するパターンが推奨

4. **gate-11 / gate-12 の audit-fire helper パターン共通化**
   - gate-11 (PII review) には類似の `appendAudit` private method があるが、
     hash chain integration は file-based JSON store (`Hitl11AuditFile.entries[]`) に
     依存しており SHA-256 chain ではない (gate-11 spec v1.0 §6 既知制約)
   - gate-11 を `AuditLogStore` 経由に移行すれば、本 Round の gate-12 helper と
     同一パターンで chain 整合保証可能 (Review 部門 ODR-OG-06 検討事項)

### 5.3 Round 16 引継ぎ事項

- `fireGate12WithAudit` を `Harness` クラスに helper method として bind するか検討
- DEC-019-033 拡張の `cli-version-update HITL gate` 仕様書 v1.0 起草 (gate-11 spec と並列)
- `verifyChain=true` の production 運用 (例: G-10 rotation 直後の sanity check)

### 5.4 監視推奨指標

- `audit-events.jsonl` 内の `payload.kind === 'gate_12_fire'` 件数 / 月
- 同 `gate_12_decision` の `decision` 内訳 (approve / reject / defer の比率)
- defer (timeout) 比率が 10% 超なら 24h SLA 短縮検討

---

## 付録 A. 着地ファイル一覧

新規追加 (4 ファイル, 919 行):

| ファイル | 役割 | 行数 |
|---------|------|-----|
| `harness/src/hitl/gate-12-audit-fire.ts` | M-1 audit chain 統合 helper | 192 |
| `harness/src/__tests__/gate-12-audit-fire.test.ts` | M-1 test (13 cases) | 302 |
| `openclaw-runtime/src/cli/cli-version-probe.ts` | M-2 Result 型 probe | 175 |
| `openclaw-runtime/src/cli/__tests__/cli-version-probe.test.ts` | M-2 test (14 cases) | 252 |

更新 (2 ファイル, 21 行追加):

| ファイル | 変更内容 | 行数 |
|---------|---------|-----|
| `harness/src/index.ts` | Round 15 Dev-M (M-1) re-export 追加 | +11 |
| `openclaw-runtime/src/cli/index.ts` | Round 15 Dev-M (M-2) re-export 追加 | +10 |

無改変 (関連既存ファイル):

- `harness/src/hitl/gate-12-cli-version-update.ts` (446 行, Round 14 Dev-D Task A)
- `harness/src/hitl-gate.ts` (既存無改変)
- `harness/src/__tests__/gate-12-cli-version-update.test.ts` (23 tests pass 維持)
- `openclaw-runtime/src/cli/cli-version-check.ts` (Round 12 Dev-D Task C)
- `openclaw-runtime/src/cli/cli-version-check-exec.ts` (Round 14 Dev-D Task B)
- `openclaw-runtime/src/cli/auto-update-hitl.ts` (Round 13 Dev-D Task B)
- `openclaw-runtime/src/cli/real-child-spawn.ts` (Round 12 Dev-C)
- `audit/src/audit-store.ts` (G-10 SHA-256 hash chain 既存実装)

## 付録 B. テスト実行ログ要約

```
[harness]
✓ src/__tests__/gate-12-cli-version-update.test.ts (23 tests) 11ms
✓ src/__tests__/gate-12-audit-fire.test.ts (13 tests) 33ms     ← Round 15 M-1 新規
... 残り 38 ファイル
Test Files  40 passed (40)
     Tests  593 passed (593)

[openclaw-runtime]
✓ src/cli/__tests__/cli-version-check.test.ts (14 tests) 62ms
✓ src/cli/__tests__/cli-version-check-exec.test.ts (16 tests) 86ms
✓ src/cli/__tests__/cli-version-probe.test.ts (14 tests) 141ms ← Round 15 M-2 新規
... 残り 18 ファイル
Test Files  21 passed (21)
     Tests  305 passed (305)
```

## 付録 C. 設計判断の根拠

### C.1 なぜ既存 `gate-12-cli-version-update.ts` を直接拡張しなかったか

**append-only SOP (DEC-019-025)** 厳守。Round 14 Dev-D Task A の既存 module は
23 tests に対して稼働実績があり、本 Round で追加した audit chain 統合機能は
直交する責務 (gate fire + chain integrity) であるため、新規 module として独立配置。

これにより:
- 既存 23 tests のいずれも変更不要 (無回帰保証が容易)
- gate-12 fire の純関数 layer (Round 14) と audit-integrated layer (Round 15) を
  論理的に分離 (caller が必要な層を選択可能)
- CEO 議決で `HitlActionType` enum が拡張された際、既存 module を 1 行修正するだけで
  両 layer が即追従

### C.2 なぜ M-2 で Result 型を採用したか

caller の網羅分岐を強制するため。既存 `runActualClaudeCodeVersion` は
`{ result: CliVersionCheckResult, fallbackRecommended: boolean }` を返すが、
caller は `result.outcome` で 5 値分岐する必要があり、抜け漏れ (`'ok'` 以外を
忘れる等) のリスクがあった。

Result 型 (`ok: true | false` の discriminated union) にすることで、
TypeScript exhaustive check が caller 側に強制でき、err 時は `gateRequest` が
必ず存在する型保証が得られる (`gateRequest: CliVersionUpdateHitlRequest` non-null)。

### C.3 なぜ 5 sec timeout を default に固定したか

- `claude-code --version` は通常 < 1 秒で返る (Round 14 Dev-D 既測定)
- binary が hang した場合の保護として 5_000ms は十分 (10 sec だと harness 起動が遅い)
- caller override 可能 (`timeoutMs` option) により柔軟性は担保
- `normalizeTimeoutMs` で異常値 (NaN / 0 / Infinity) を 5000 に強制丸めるため、
  caller の type-safety が破られても production が hang しない

---

# 報告終了
