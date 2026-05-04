# P-E API キーフォールバック Runbook (CB-D-W2-10)

- 文書 ID: `app/docs/fallback-runbook.md`
- 起案日: 2026-05-04 (Round 9 案 9-A2)
- 関連タスク: CB-D-W2-10 P-E フォールバック手順整備 (Plan B-1, 24h 以内切替可能化)
- 関連実装: `harness/src/tos-monitor.ts` (`shouldFallbackToApiKey`, `FileTosMonitor`)
- 関連決裁: DEC-019-008 (NG-3 暫定値) / DEC-019-050 (API key cap $30) / DEC-019-051 (subscription 95% + API 5% ≤$430) / DEC-019-055 (Round 8 完遂着地) / DEC-019-056 (5/22 朝公開前倒し起票予定)
- 関連リスク: R-019-06 (BAN 30〜60% / 12 ヶ月、オプション A で Sumi/Asagi 巻き添え)

## 1. 目的と適用範囲

P-D 改 (subscription 経由 Claude Code OAuth) で BAN / 警告メール / NG-3 抵触を検知した時に、**24h 以内に P-E (Anthropic API key 従量) へ全面切替**するための SOP。Sumi (PRJ-012) / Asagi (PRJ-018) の業務継続を最優先。

本 runbook は `tos-monitor.ts` の出力 (4 種 trigger + 1 manual) を起点に、orchestrator / claude-bridge / wrapper.ts の差替手順を集約する。

## 2. Trigger 条件 (4 種)

`shouldFallbackToApiKey(input): FallbackDecision` の出力に対応する 4 つの reason + 1 つの `no_action` を以下に整理。

| # | Trigger | 検出元 | reason | escalateToOwner | 切替判断 SLA |
|---|---|---|---|---|---|
| T-1 | Owner 手動 | manualOverride=true | `manual` | true | 即時 (< 1 分) |
| T-2 | subscription session = revoked | claude-bridge auth-detector | `subscription_warning` | true | 即時 (< 5 分、kill chain 連鎖) |
| T-3 | Anthropic 警告メール severity ≥ 4 (final_warning / tos_warning) | `tos-monitor.pollWarnings()` (Mock W2 → Gmail API W2 後半) | `subscription_warning` | true | 4h 以内 |
| T-4 | NG-3 breach 7d ≥ 1 件 | `tos-monitor.checkContinuousRun()` / `checkCostCap()` | `ng3_breach` | true | 24h 以内 |
| T-5 | rate_limited + warning 2 件以上 (一過性) | session state + `tos-monitor.pollWarnings()` | `subscription_warning` | false (escalate 不要) | 24h 以内 |
| - | (上記以外) | - | `no_action` | false | 通常稼働継続 |

## 3. 切替手順 (5 step、各 step ≤ 30 秒目標)

切替操作は orchestrator から `wrapper.ts` factory 経由で実行する。subprocess spawn 契約 `SubprocessSpawnContract` の env / args を差し替える設計のため、**コード変更ゼロで Mock→API key spawner に切替可能** (DEC-019-051 施策-1 整合)。

### Step 1: emergency_stop 発動 (≤ 5 秒)

```
~/.clawbridge/STOP を touch    # kill-switch.ts が即検知
```
または harness 経由:
```ts
await harness.kill.trigger('p-e fallback initiated', { source: 'manual' })
```

期待動作:
- circuit-breaker `forceOpen` 全 instance
- 登録済 subprocess SIGTERM → 5 秒 grace → SIGKILL
- audit/ に `kill_switch` event append

### Step 2: 1Password Vault 切替 (≤ 10 秒)

`Clawbridge-Dev` Vault から `Anthropic-API-Key-Production` を取得:
```
op run --env-file=.env.api-key -- pnpm start
```

注意:
- subscription OAuth トークンは `Clawbridge-Master` Vault に隔離 (G-V2-11)、API キー切替時に絶対に同時 expose しない
- API key spend cap = $30/月 (DEC-019-050) を Anthropic Console で再確認 (case 必要なら $100 案 B 移行)

### Step 3: spawn 契約差替 (≤ 5 秒)

`openclaw-runtime/wrapper.ts` factory に対し、orchestrator から:
```ts
import { createWrapper } from './openclaw-runtime/wrapper.js'
const wrapper = createWrapper({
  spawn: realApiKeySpawner,  // ← Mock or P-D 改 spawner と差替
  envAllowList: ['ANTHROPIC_API_KEY'],
})
```

env allow-list に **subscription トークン名は含めない** (G-07 厳格)。

### Step 4: TosMonitor reconfigure (≤ 5 秒)

```ts
const monitor = createTosMonitor({
  ng3Plan: 'plan_b_16h',  // P-E でも案 B 採用継続
  override: { apiUsdMonthlyHardCap: 100 },  // $100 cap (案 B 漸進)
  costTracker: harness.cost,
  killSwitch: harness.kill,
  circuitBreaker: harness.cb,
  warningSource: gmailWarningSource,  // 警告メール監視も継続
  listeners: [createAuditHook(audit)],
})
monitor.markBoot()
```

API キー経由でも NG-3 連続稼働上限は維持 (P-E では BAN リスクは下がるが、コスト暴走防御は同等に必要)。

### Step 5: smoke test 1 ループ (≤ 5 秒)

dry-run モード (PR-16 / G-12) で 1 ループ実行、API キー経由で Claude Code 応答確認。
```
pnpm clawbridge dry-run --once --provider=anthropic-api-key
```

完了後 audit/ に `spawn` event が記録されていることを確認。失敗時は **手順 1 に戻り再試行** (3 回失敗で Owner 報告)。

## 4. 切替後 24h 観測 SOP

切替後 24h は以下を 1h 間隔で確認する:

| 項目 | 観測手段 | 異常閾値 |
|---|---|---|
| API key 月次消費 | `cost-tracker.getMonthlyTotal('anthropic_api')` | ≥ $80 (cap $100 の 80%) で warn |
| 401/403/429 連続 | usage-monitor 既存 60s 窓 5 件 | 既存 G-V2-08 で kill chain 自動 |
| ループ完走率 | orchestrator success_rate | < 80% で Owner 報告 |
| 警告メール再受信 | tos-monitor.pollWarnings() | severity ≥ 3 で Owner 報告 |
| Sumi (PRJ-012) / Asagi (PRJ-018) 業務再開可否 | manual check + git push 試験 | 業務不能 4h 超で Owner 緊急報告 |

24h 観測完了後、`monitor:fallback-decision` audit event をレビュー部門が verify (hash chain 整合性確認込み)、completion-report に追記。

## 5. Rollback 条件 (P-E → P-D 改復帰)

以下を **全て** 満たす場合のみ P-D 改 (subscription) へ復帰:

1. 警告メール 0 件 / 7 日連続
2. Anthropic Console の subscription session = `active` (revoked / suspended でない)
3. NG-3 breach 7d count = 0
4. Owner 明示承認 (`manualOverride=false` 解除 + 復帰承認)
5. BAN drill 1 回完遂 (review 部門 BAN drill #1 dry exec 経由)

復帰手順は本 runbook の Step 1〜5 を逆順に適用する (factory 差替が起点)。

## 6. drill #1 結果反映欄 (Review Round 9 BAN drill #1 dry exec の出力で更新)

> **TODO**: Review 部門 Round 9 BAN drill #1 dry exec の `reports/review-ban-drill-1-dry-exec.md` 完成後、以下を埋める。
>
> - drill 完遂時間: ___ 分 (目標 < 30 分)
> - emergency_stop → P-E 切替の各 step 計測時間 (Step 1: ___ s / Step 2: ___ s / ... / Step 5: ___ s)
> - 観測された false-positive: ___ 件 (`tos-monitor` confirmCount=2 で抑制された件数)
> - rollback 条件のうち N=___ 件達成 (5 件中)
> - 改善 TODO 抽出: 3 項目以内

## 7. W2 後半 本番化引継 TODO

- [ ] CB-D-W2-09 Gmail API 1h polling 実装 (`MockAnthropicWarningSource` → `GmailAnthropicWarningSource`)
- [ ] 警告メール filter regex 確定 (Anthropic 公式 from-address + 件名 pattern)
- [ ] $100 cap (案 B) Anthropic Console 設定切替手順 (現 $30 → $100、増額承認 Owner 直)
- [ ] BAN drill #2 (Sumi/Asagi 同居前提) で本 runbook 適用妥当性検証

## 8. 関連ファイル

- 実装: `app/harness/src/tos-monitor.ts` (`FileTosMonitor`, `shouldFallbackToApiKey`, `MockAnthropicWarningSource`)
- テスト: `app/harness/src/__tests__/tos-monitor.test.ts` (41 tests)
- 既存 kill chain: `app/harness/src/kill-switch.ts` (G-05/06 SIGTERM→SIGKILL)
- 既存 watchdog: `app/harness/src/usage-monitor.ts` + `cost-tracker.ts` (G-04 三段階)
- 上位 audit hook: `app/audit/src/audit-store.ts` (SHA-256 hash chain + 90 日 retention)
- 関連レポート: `projects/PRJ-019/reports/dev-round9-tos-monitor-impl.md`
