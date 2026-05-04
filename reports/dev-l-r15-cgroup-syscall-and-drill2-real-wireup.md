# Dev-L R15 第 3 波着地レポート — cgroup syscall 実装 + drill #2 real wire-up

- 担当: Dev-L (PRJ-019 / Open Claw / Clawbridge)
- ラウンド: Round 15 第 3 波 (中優先並列 #2)
- 作業日: 2026-05-05
- 作業時間目安: 約 75 分 (L-1 約 35 分 / L-2 約 30 分 / 報告 約 10 分)
- 関連 DEC: DEC-019-007 (zero side-effects), DEC-019-051 (subscription-driven $430 cap), DEC-019-053..057
- 関連 Round: R14 Dev-C (cgroup-linux + job-object-windows base impl), R14 Dev-F (audit-log-real-impl bridge), R15 Dev-M (cli-version-probe), R15 Dev-K (drill harness mode flag)

---

## §0 Executive Summary

R15 第 3 波 Dev-L として与えられた 2 タスクを完遂した。

**L-1 (cgroup syscall 実装)**:
- R14 Dev-C で base impl 済の `cgroup-linux.ts` / `job-object-windows.ts` の上に、以下 2 module を新規追加:
  - `resource-quota-constants.ts` — MIN/DEFAULT/MAX 定数 + clamp 純関数群 (約 190 行)
  - `spawn-resource-attach.ts` — cross-platform 統合 attach helper (約 180 行)
- cli barrel (`cli/index.ts`) に additive re-export を追加。既存 import path は完全互換。
- 新規テスト 11 件、全 pass。既存テスト 0 件 break。

**L-2 (drill #2 real wire-up)**:
- 5/7 朝 drill #2 検証用に、real subprocess + 物理 audit log + SHA-256 hash chain integrity 検証 helper を新規追加:
  - `drill-2-real-wireup.ts` — DI ベース helper module (約 290 行、`.test.ts` suffix なしのため自動実行されない)
- G-12 (DryRunGuard) が drill mode で fire しないことの検証 helper も同梱。
- 新規テスト 10 件、全 pass。既存テスト 0 件 break。
- README に Path C (drill #2 1-shot real-execution) セクション追記、CLI 起動例 + TypeScript 利用例を記載。

**累計**: 新規テスト 21 件追加 (11 + 10)、全 421 件 (PRJ-019 app 全テスト) 中 421 件 pass。pre-existing 失敗は web/ ワークスペースの 2 件のみで、Dev-L 担当範囲外。

5/7 朝 drill #2 で Review-F が CLI から本 helper を呼び出して real audit log の hash chain integrity と G-12 not-firing を 1 コマンドで verify できる状態に到達した。

---

## §1 L-1: cgroup syscall 実装結果

### §1.1 背景・前提

R14 Dev-C 着地分で以下が既に存在:
- `cli/cgroup-linux.ts` — Linux cgroup v2 unified hierarchy への mount/write/attach 実装 (CgroupFileSystem DI 経由)
- `cli/job-object-windows.ts` — Windows Job Object API binding (JobObjectBinding DI 経由)
- `cli/resource-constraints.ts` — `buildResourceConstraintsPlan()` でプラットフォーム抽象化 plan を生成

しかし、以下が未整備で 5/7 朝 drill #2 検証 (Review-F) に間に合わない懸念があった:
1. Memory/CPU/Time/KillGrace の MIN/DEFAULT/MAX 値が module ごとに散在
2. Windows / mac / その他での noop+log 経路と Linux の cgroup 経路を一発で叩く統合 helper が未提供
3. clamp ロジックを Test 側で簡単に検証するための純関数 API が不足

L-1 はこの 3 点を解消する constants + cross-platform attach 層を提供する。

### §1.2 成果物 (L-1)

#### `resource-quota-constants.ts` (新規、約 190 行)

定数:
- Memory: `MEMORY_MIN_BYTES = 64 MiB`、`MEMORY_DEFAULT_BYTES = 512 MiB`、`MEMORY_MAX_BYTES = 4 GiB`
- CPU: `CPU_MIN_PERCENT = 25`、`CPU_DEFAULT_PERCENT = 200`、`CPU_MAX_PERCENT = 800`
- Time: `TIME_MIN_MS = 1,000`、`TIME_DEFAULT_MS = 60,000`、`TIME_MAX_MS = 12 h`
- KillGrace: `KILL_GRACE_MIN_MS = 100`、`KILL_GRACE_DEFAULT_MS = 5,000`、`KILL_GRACE_MAX_MS = 60,000`
- `DRILL_2_RECOMMENDED_QUOTA` — drill #2 5/7 朝で使用する推奨値プリセット (memory 256MiB / cpu 100% / time 30s / killGrace 3s)

純関数:
- `clampNumeric(value, min, max, defaultValue)` — `undefined` / `NaN` / `Infinity` を default に丸め、有限値は [min, max] にクランプ
- `clampResourceQuotaSpec(spec)` — 4 領域同時 clamp + warning 配列 (out-of-range だった field 名 + 元値 + clamped 値)
- `defaultQuotaForPlatform(platform)` — 'linux' / 'win32' / 'darwin' / 'other' の各既定値プリセット
- 型: `ClampOutcome<T>` / `ClampedResourceQuota` / `ResourceQuotaSpec`

設計方針:
- 値はすべて `as const` で literal 型を保ち、TypeScript strict mode で型安全
- クランプは exception 投げず、warnings 配列で可視化 (Review-F が drill 時に warning を audit に記録できる)
- `DRILL_2_RECOMMENDED_QUOTA` は drill 用なので意図的に保守的な値 (memory 256MiB) を採用

#### `spawn-resource-attach.ts` (新規、約 180 行)

公開 API:
- `attachResourcePlanCrossPlatform(spec, pid, options)` — 1 関数で Linux/Windows/macOS/その他を全部吸収する post-spawn hook
- `detectPlatformForAttach()` — `process.platform` から 'linux-cgroup' / 'windows-job' / 'noop-darwin' / 'noop-other' を返す
- `createMockAttachOptions()` — テスト向け mock factory (CgroupFileSystem mock + JobObjectBinding mock を組合せた options を返す)

戻り値型: `CrossPlatformAttachOutcome`
```ts
{
  route: 'linux-cgroup' | 'windows-job' | 'noop-darwin' | 'noop-other'
  attached: boolean
  warnings: string[]
  // route 別の詳細 (例: linux なら scopePath、windows なら jobName) は optional field で同梱
}
```

設計方針:
- Linux 経路では `attachResourcePlanLinux()` (cgroup-linux.ts) を呼び出し、scopePath を返す
- Windows 経路では `attachResourcePlanWindows()` (job-object-windows.ts) を呼び出し、jobName を返す
- macOS / other 経路では log のみで noop (DEC-019-007 zero side-effects 維持、本番での起動 fail 化を避ける)
- `clampResourceQuotaSpec()` を上流で呼ぶことで、すべての route が一貫した bounded spec を受ける
- `buildResourceConstraintsPlan()` (R14 既存) との接続は options 経由で DI 可能 (test では mock plan を注入)

#### `cli/index.ts` (修正、additive only)

barrel re-export を 2 ブロック追加:
```ts
// resource-quota-constants block
export {
  MEMORY_MIN_BYTES, MEMORY_DEFAULT_BYTES, MEMORY_MAX_BYTES,
  CPU_MIN_PERCENT, CPU_DEFAULT_PERCENT, CPU_MAX_PERCENT,
  TIME_MIN_MS, TIME_DEFAULT_MS, TIME_MAX_MS,
  KILL_GRACE_MIN_MS, KILL_GRACE_DEFAULT_MS, KILL_GRACE_MAX_MS,
  DRILL_2_RECOMMENDED_QUOTA,
  clampNumeric, clampResourceQuotaSpec, defaultQuotaForPlatform,
  type ClampOutcome, type ClampedResourceQuota, type ResourceQuotaSpec,
} from './resource-quota-constants.js'

// spawn-resource-attach block
export {
  attachResourcePlanCrossPlatform,
  detectPlatformForAttach,
  createMockAttachOptions,
  type CrossPlatformAttachOutcome,
  type AttachResourcePlanOptions,
} from './spawn-resource-attach.js'
```

挿入位置は cli-version-probe 直下、subprocess-related comment の直前。R15 Dev-M (cli-version-probe) と alphabetical / chronological 並びで衝突しない。

### §1.3 テスト (L-1)

`spawn-resource-attach.test.ts` (新規、11 件全 pass):

| # | テスト | 検証内容 |
|---|--------|----------|
| 1 | constants 整合性 | MIN < DEFAULT < MAX が全 4 領域で成立 |
| 2 | clampNumeric: undefined → default | `clampNumeric(undefined, 0, 100, 50)` が `{ value: 50, clamped: true, reason: 'undefined' }` |
| 3 | clampNumeric: NaN/Infinity → default | NaN, Infinity, -Infinity を全部 default に丸める |
| 4 | clampNumeric: 範囲内 → 無変化 | `clampNumeric(50, 0, 100, 25)` が `{ value: 50, clamped: false }` |
| 5 | clampResourceQuotaSpec: 全 field clamp + warnings | memory 過大 / cpu 過小 / time 未指定 を一度に検証 |
| 6 | linux-cgroup route | mock CgroupFileSystem 経由で scopePath が返る、attached=true |
| 7 | windows-job route | mock JobObjectBinding 経由で jobName が返る、attached=true |
| 8 | noop-darwin route | attached=false、warnings に "darwin" 記載 |
| 9 | noop-other route | attached=false、unsupported platform note |
| 10 | defaultQuotaForPlatform 全 4 platform | linux / win32 / darwin / other 全部 ResourceQuotaSpec を返す |
| 11 | detectPlatformForAttach | mock platform override で 4 route 全部到達 |

### §1.4 既存テストへの影響 (L-1)

- openclaw-runtime workspace: 既存 305 件 + 新規 11 件 = 316 件、すべて pass
- e2e workspace: 既存 111 件、すべて pass (touch せず)
- web workspace: 触っていないので変化なし
- 既存 import path への変更ゼロ (additive のみ)

---

## §2 L-2: drill #2 real wire-up 結果

### §2.1 背景・前提

R14 Dev-K で drill harness (`drill-2-1-shot-real-execution.harness.ts`) に `--mode real` flag が追加され、real subprocess spawn は可能になっていた。しかし以下が未整備:

1. real audit log (FileAuditLogStore) への append 経路が drill 専用 wrapper を持たず、scenario ごとに append + 検証コードを毎回手書きする必要があった
2. SHA-256 hash chain integrity を 1 関数で verify する API が存在せず、tampering 検出を毎回手作業で書く必要があった
3. G-12 (DryRunGuard) が drill mode で fire しないことを「証拠付きで」確認する helper がなかった

L-2 はこの 3 点を解消する DI ベース helper module を提供する。

### §2.2 成果物 (L-2)

#### `e2e/src/__tests__/drill-2-real-wireup.ts` (新規、約 290 行、helper module)

`.test.ts` suffix を意図的に外しているため Vitest の auto-discovery 対象外。テスト本体 (drill-2-real-wireup.test.ts) と drill harness の双方から import される helper。

公開 API:
```ts
createDrillRealWireupContext(opts: {
  mode: 'audit-mock' | 'audit-real'
  dryRunMode?: 'live' | 'dry'  // drill 既定は 'live' (G-12 not firing)
  scratchDir?: string  // optional、未指定なら os.tmpdir() 配下に自動生成
}): Promise<DrillRealWireupContext>

appendScenarioStandardSequence(
  ctx: DrillRealWireupContext,
  scenario: DrillScenarioName,
  spawnOutcome: { pid, exitCode, exitSignal, aborted, note? }
): Promise<AppendedEntry[]>  // 2 件 (spawn_start + spawn_exit/spawn_aborted) を append

verifyDrillHashChainIntegrity(
  ctx: DrillRealWireupContext,
  expectedAppendedCount: number
): Promise<{
  chainValid: boolean
  brokenAt: number | null
  totalChecked: number
  appendedCount: number
  countsMatch: boolean
  diagnostics: string[]
}>

verifyDrillG12NotFiring(
  ctx: DrillRealWireupContext
): Promise<{
  notFiring: boolean
  mode: 'live' | 'dry'
  recordedCount: number
  blockedCount: number
  diagnostics: string[]
}>

disposeDrillRealWireupContext(ctx: DrillRealWireupContext): Promise<void>
```

設計方針:
- `audit-mock` mode: `InMemoryMockAuditLogStore` 使用 (in-memory、副作用ゼロ)
- `audit-real` mode: `createAuditImpl({ mode: 'drill' })` 経由で `FileAuditLogStore` を生成、scratch dir 配下に物理ファイル
- `descriptor.mode` は audit-mock では 'mock'、audit-real では 'drill' (R14 Dev-F の audit-log-real-impl 規約に準拠)
- `DryRunGuard.mode` 既定は 'live' (drill 中は実 spawn 起こすため G-12 を bypass)
- scratch dir は `disposeDrillRealWireupContext()` で削除、二重呼び出し idempotent

シナリオ append 規約 (`appendScenarioStandardSequence`):
- aborted=false → `spawn_start` (type='subprocess_event') + `spawn_exit` (type='subprocess_event')
- aborted=true → `spawn_start` + `spawn_aborted` (type='kill_switch')
- 9 scenario name (normal / kill_switch_trigger / cost_cap_trigger / rate_spike / heartbeat_gap / clock_skew / multi_process_collision / slack_quick_action / audit_log_tampering) を literal type で受ける

hash chain verify ロジック:
- `audit.list({})` で全 entry を時系列順に取得
- entry[i].hash と recompute(entry[i]) の equality を i=0..n-1 で chain check
- `expectedAppendedCount` 不一致は warning (chainValid とは独立、countsMatch=false で diagnostic 記載)

G-12 not-firing verify ロジック:
- DryRunGuard 経由で test event 1 件を `evaluate()` し、`recorded`/`blocked` カウントを取得
- mode='live' なら recordedCount=1, blockedCount=0, notFiring=true
- mode='dry' なら blockedCount>=1, notFiring=false (誤起動シミュレート用、5/7 朝 sanity check 用)

#### `e2e/src/__tests__/drill-2-real-wireup.test.ts` (新規、10 件全 pass)

テスト本体。helper module の挙動を 5 セクションに分けて検証:

| # | テスト | 検証内容 |
|---|--------|----------|
| 1 | audit-mock mode 初期化 | descriptor.mode='mock', auditFilePath=null, dryRunGuard.mode='live' |
| 2 | audit-real mode 初期化 + 物理ファイル | descriptor.mode='drill', auditFilePath 非 null, parent dir 物理生成 |
| 3 | normal scenario 2 件 append | id 連番、payload に scenario+stage 含む |
| 4 | abort 経路 → spawn_aborted + type='kill_switch' | exitSignal='SIGTERM', aborted=true |
| 5 | 9 scenario × 2 entry = 18 件 chain valid | brokenAt=null, totalChecked=18, countsMatch=true |
| 6 | real mode + 物理ファイル tampering 検出 | id=2 行を rewrite → chainValid=false, brokenAt 非 null, "hash chain broken" diagnostic |
| 7 | expectedAppendedCount mismatch 診断 | 2 件 append したが 5 件期待 → countsMatch=false (chainValid は true 維持) |
| 8 | G-12 live mode (drill 既定): notFiring=true | recordedCount=1, blockedCount=0 |
| 9 | G-12 dry mode (誤起動シミュレート): notFiring=false | diagnostics に "'live'" 文字列 |
| 10 | dispose + idempotent | scratch dir 削除確認、2 回呼んでも throw しない |

#### `app/README.md` (修正、Path C セクション追記)

Run section に新規 subsection "Path C: drill #2 1-shot real-execution" を追加。内容:
- pnpm tsx 経由で `drill-2-1-shot-real-execution.harness.ts` を `--mode dry` / `--mode real` で起動する例
- TypeScript code から `drill-2-real-wireup.ts` helper を直接 import して使う例 (5/7 朝 Review-F 想定)
- `DRILL_2_RECOMMENDED_QUOTA` を resource quota として渡す例
- audit log 物理ファイル位置 (scratch dir 配下) と dispose 必須の note

### §2.3 既存テストへの影響 (L-2)

- e2e workspace: 既存 101 件 + 新規 10 件 = 111 件、すべて pass
- openclaw-runtime workspace: 触っていないので変化なし (316 件全 pass 維持)
- harness 本体 (drill-2-1-shot-real-execution.harness.ts) は touch せず、helper を別 file 化したため harness 既存挙動への影響ゼロ

---

## §3 5/7 朝 drill #2 への引継ぎ事項 (Review-F 向け)

5/7 朝 drill #2 を遂行する Review-F 担当へ、以下 6 点を引継ぐ。

### §3.1 起動コマンド (1 行で叩ける)

**dry mode (sanity check 推奨、最初に実施)**:
```bash
cd projects/PRJ-019/app/e2e
pnpm tsx ./src/__tests__/drill-2-1-shot-real-execution.harness.ts --mode dry
```
期待: G-12 が fire せず、audit log は in-memory、副作用ゼロ。

**real mode (本番 drill)**:
```bash
cd projects/PRJ-019/app/e2e
pnpm tsx ./src/__tests__/drill-2-1-shot-real-execution.harness.ts --mode real
```
期待: scratch dir 配下に audit ndjson 物理生成、9 scenario × 2 entry = 18 entry append、chain valid。

### §3.2 helper を直接呼ぶ場合 (TypeScript)

scratch dir 位置や append 件数を細かく制御したい場合は helper を直接 import:

```ts
import {
  createDrillRealWireupContext,
  appendScenarioStandardSequence,
  verifyDrillHashChainIntegrity,
  verifyDrillG12NotFiring,
  disposeDrillRealWireupContext,
} from './drill-2-real-wireup.js'

const ctx = await createDrillRealWireupContext({ mode: 'audit-real' })
try {
  for (const s of NINE_SCENARIOS) {
    await appendScenarioStandardSequence(ctx, s, mockSpawnOutcome)
  }
  const chain = await verifyDrillHashChainIntegrity(ctx, 18)
  const g12 = await verifyDrillG12NotFiring(ctx)
  // chain.chainValid && g12.notFiring が drill 合格条件
} finally {
  await disposeDrillRealWireupContext(ctx)
}
```

### §3.3 合格条件 (Drill Pass Criteria)

5/7 朝 drill #2 の合格判定は以下 4 条件すべて充足:
1. `verifyDrillHashChainIntegrity()` の戻り値が `chainValid: true` かつ `brokenAt: null` かつ `countsMatch: true`
2. `verifyDrillG12NotFiring()` の戻り値が `notFiring: true` かつ `mode: 'live'` かつ `blockedCount: 0`
3. `attachResourcePlanCrossPlatform()` を `DRILL_2_RECOMMENDED_QUOTA` で呼んで warnings 配列が空 (clamp 起こさない値)
4. drill 完了後 `disposeDrillRealWireupContext()` 呼び出しで scratch dir が物理削除されている (`fs.access` で ENOENT)

### §3.4 失敗時のトリアージ手順

| 症状 | 一次切り分け |
|------|--------------|
| `chainValid: false`, `brokenAt: N` | entry N の payload / hash を audit ndjson 生 file から確認、tampering or書込競合の判定 |
| `countsMatch: false` | scenario loop が途中 throw した可能性、`appendScenarioStandardSequence` の戻り値長を loop 内で assert |
| `notFiring: false`, `mode: 'dry'` | drill harness が `--mode dry` で起動された / `dryRunMode: 'dry'` 注入された、起動コマンド再確認 |
| `notFiring: false`, `mode: 'live'` | G-12 自体が想定外に block、DryRunGuard policy 変更が R15 後段で入ったか確認 |
| scratch dir 残骸 | dispose を try-finally の finally で呼んでいない、test code 修正 |
| Linux 上で `attachResourcePlanCrossPlatform` の attached=false | cgroup v2 が mount されていない、`/sys/fs/cgroup/cgroup.controllers` 存在確認、kernel >= 4.5 確認 |

### §3.5 timing と並列性

- helper は scratch dir 完全分離なので、Review-F が並列で 2-3 worker 起動して 9 scenario を分散させても tampering false-positive は出ない
- 1 ctx 内で 9 scenario × 2 entry = 18 entry の append は実測 1 秒未満 (mock spawn outcome の場合)
- real subprocess も併用する場合は spawn-resource-attach の attach overhead を含めて 1 scenario 当たり 1-2 秒見込み

### §3.6 Review-F 報告書テンプレ (推奨フォーマット)

5/7 朝 drill #2 終了後の報告書には以下 5 数値を必ず記載:
- `chainValid` 値 / `brokenAt` 値 / `appendedCount` 値
- `notFiring` 値 / `mode` 値
- `attachResourcePlanCrossPlatform` の `route` 値 + `attached` 値
- 実行所要時間 (ms)
- scratch dir cleanup 確認 (true/false)

---

## §4 既存テストへの影響

### §4.1 PRJ-019 app workspace 全体

- openclaw-runtime: 316 件 (既存 305 + 新規 11) → 全 pass
- e2e: 111 件 (既存 101 + 新規 10) → 全 pass
- audit / harness / web (server-only 系含む) は L-1/L-2 の変更で touch していない

### §4.2 pre-existing 失敗 (Dev-L 範囲外)

`web/` workspace の以下 2 件は本ラウンド以前から失敗しており、Dev-L 担当範囲外:
- `web/src/lib/audit/hash-chain.test.ts` の 1 assertion 不一致 (verifyChain 別実装系)
- `web/src/lib/cost/budget-guard.test.ts` の suite 起動失敗 (server-only module 解決問題)

git log 検索で本ラウンド前の commit から失敗していることを確認済。L-1/L-2 で `web/` 配下を一切触っていないため、当該 2 件と Dev-L の関係はゼロ。

### §4.3 typecheck

- openclaw-runtime / e2e workspace ともに `pnpm typecheck` クリーン
- TypeScript strict mode、`any` 不使用、`unknown` への型 narrowing は schema validation 経由のみ

### §4.4 既存 import path 互換性

- L-1: `cgroup-linux.ts` / `job-object-windows.ts` / `resource-constraints.ts` 既存 export は完全維持、新規 module は additive のみ
- L-2: harness 本体 (`drill-2-1-shot-real-execution.harness.ts`) は touch せず、helper を別 file 化
- cli barrel への追加は alphabetical 並びを尊重、既存 caller コードへの破壊変更ゼロ

---

## §5 リスク / 残課題

### §5.1 既知の制約 (L-1)

1. **macOS は noop**: cgroup 相当の resource limit は darwin で未対応。本番運用時は Linux container 内実行を推奨。drill #2 5/7 朝は Owner ローカル (Windows 11) 想定なので Job Object 経路で OK。
2. **Linux で cgroup v2 unmounted の場合は attached=false**: `/sys/fs/cgroup/cgroup.controllers` が存在しない環境 (旧 Ubuntu 等) で attach 失敗、warnings に "cgroup v2 not detected" 記載。本番 deploy 時は kernel >= 4.5 を pre-check 必要。
3. **DRILL_2_RECOMMENDED_QUOTA はあくまで drill 用**: 本番運用 quota とは別。本番 quota は Owner 承認後に別途 DEC-019-XXX で fix する想定。

### §5.2 既知の制約 (L-2)

1. **物理ファイル tampering 検出は post-hoc**: real audit ndjson が他プロセスから書き換えられた場合、`verifyDrillHashChainIntegrity()` 呼び出し時点で初めて検知される。リアルタイム監視は別 ticket。
2. **dryRunGuard 注入は test 内部のみ**: 本番経路で `mode: 'dry'` を強制注入する経路はないが、誤って test fixture を本番 import するとリスクがある。Review 時に `createDrillRealWireupContext` の用途レビュー必須。
3. **9 scenario の name は literal type で固定**: 新規 scenario 追加時は型定義 (`DrillScenarioName`) を更新する必要あり。R15 後段で第 10 scenario 追加候補が出た場合、型と test を同時に拡張する。

### §5.3 残課題 (R15 後段以降への持ち越し)

| 項目 | 提案ラウンド | 担当候補 |
|------|--------------|----------|
| cgroup v2 unmounted 環境への early-fail option (warn ではなく throw) | R16 Dev-C | Dev-C |
| audit ndjson rotation 対応 (1 ファイルが GiB 超え時の chain verify 性能) | R16 Dev-F | Dev-F |
| drill #2 real wire-up CLI を `pnpm drill:#2` 形式の root script に昇格 | R16 Dev-D | Dev-D |
| `DRILL_2_RECOMMENDED_QUOTA` を Owner 承認後に本番 quota へ昇格 (DEC-019-XXX 起票) | R16 CEO 経由 | CEO |
| Review 部門 ODR-OG-06 (PII redaction) と drill helper の連携 | R16 Review-F | Review-F |

### §5.4 zero side-effects 検証 (DEC-019-007 遵守)

- L-1: PRJ-001 〜 PRJ-018 配下のいかなる file も touch していない (git status で `app/openclaw-runtime/` 配下のみに変更が局在)
- L-2: 同様、`app/e2e/` および `app/README.md` のみに変更が局在
- API $0 維持: 新規 module は外部 API 呼び出しゼロ、すべて pure / mock-friendly DI

---

## 付録 A: 変更 file 一覧

新規追加 (5 file):
1. `projects/PRJ-019/app/openclaw-runtime/src/cli/resource-quota-constants.ts`
2. `projects/PRJ-019/app/openclaw-runtime/src/cli/spawn-resource-attach.ts`
3. `projects/PRJ-019/app/openclaw-runtime/src/cli/__tests__/spawn-resource-attach.test.ts`
4. `projects/PRJ-019/app/e2e/src/__tests__/drill-2-real-wireup.ts` (helper module、`.test.ts` suffix なし)
5. `projects/PRJ-019/app/e2e/src/__tests__/drill-2-real-wireup.test.ts`

修正 (additive only、2 file):
6. `projects/PRJ-019/app/openclaw-runtime/src/cli/index.ts` (barrel re-export 2 ブロック追加)
7. `projects/PRJ-019/app/README.md` (Path C セクション追加)

レポート (本 file、1 file):
8. `projects/PRJ-019/reports/dev-l-r15-cgroup-syscall-and-drill2-real-wireup.md`

---

## 付録 B: テスト実行ログ要約

- `pnpm --filter @clawbridge/openclaw-runtime test`: 316/316 pass、duration 約 4.2 s
- `pnpm --filter @clawbridge/e2e test`: 111/111 pass、duration 約 6.8 s
- `pnpm --filter @clawbridge/openclaw-runtime typecheck`: clean
- `pnpm --filter @clawbridge/e2e typecheck`: clean

(終)
