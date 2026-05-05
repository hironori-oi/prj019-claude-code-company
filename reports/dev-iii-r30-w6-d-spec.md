# Dev-III R30 — W6-D spec: 異常検知 → automatic rollback trigger 連動

最終更新: 2026-05-06 W0-Week1
起案: Dev 部門 R30 Dev-III（9 並列 5 軸目 / Dev 軸 / W6 拡張 spec）
位置付け: W6-A canary (Vercel Edge Config) + W6-B alert-router (severity routing) の延長として、異常検知信号を rollback trigger に連動させる W6-D module の spec を起票。R30+ 物理化引継。
版: v1.0
連動 DEC: DEC-019-080 (Sentry 実発火必須化) / DEC-019-081 (月次予算 alert) / DEC-019-076 (alerting SoT 確立) / DEC-019-079
連動 runsheet: `runsheets/w6b-production-ga-sop.md` §4 alert 3 severity / §5 rollback procedure (想定)

---

## §0 サマリ (CEO 250 字)

W6-D = **異常検知 → automatic rollback trigger 連動 module**。W6-A canary (Edge Config phased flag rollout) + W6-B alert-router (severity → channel routing) の延長として、emergency severity alert または canary failure threshold 突破時に Edge Config を即時 100% old-release に巻き戻す **rollback orchestrator** を提供。設計方針: 純粋 decision 関数 + 注入式 actuator パターン継続、API call $0 (test 段階)、severity threshold + 連続 N 回 + cooldown の 3 条件 AND で誤発火抑止。物理化想定 LOC: src 約 90-130 行 + unit test 約 130-180 行 = 計 220-310 行。R30+ Dev で物理化想定 (DEC-019-080+081 採決連動)。

---

## §1 動機 / 既存 W6 module gap 分析

### 1.1 W6-A canary 既存実装 (R29 Dev-FFF)

| file | 行数 | 役割 |
|---|---|---|
| `app/openclaw-runtime/src/canary/edge-config-canary.ts` | 117 | Edge Config phased rollout helper (`evaluateCanary`, `recordOutcome`) |
| 関連 unit test | 109 | canary 0%→25%→50%→100% phase progression |

→ **gap**: 失敗 outcome を多数記録 (例 `canary_failure_threshold` 突破) しても、phased rollout を即時逆方向 (50% → 0%) に巻き戻す機構なし。manual rollback 想定で operator 介入待ち。

### 1.2 W6-B alert-router 既存実装 (R29 Dev-FFF)

| file | 行数 | 役割 |
|---|---|---|
| `app/openclaw-runtime/src/alerting/alert-router.ts` | 67 | severity → channels routing |
| 関連 unit test | 92 | warning/critical/emergency routing + dedup + dispatcher + schema |

→ **gap**: emergency severity alert を 3 channel (slack+pagerduty+email) に送信できるが、自動的に rollback action を起動する経路なし。alert は通知 only、rollback は operator 手動。

### 1.3 W6-D が埋める gap

emergency 級 alert および canary failure 信号を input とし、**Edge Config を rollout phase 0 (=old release 100%) に即時巻き戻す orchestration layer**。decision 関数 + 注入式 actuator で純粋実装、$0 API call で unit test 完備、ESC condition (連続 N 回 + cooldown) で誤発火抑止。

---

## §2 W6-D 設計要点

### 2.1 module 構成 (想定)

```
app/openclaw-runtime/src/rollback/
  ├── auto-rollback-orchestrator.ts     (90-130 行)
  └── __tests__/
      └── auto-rollback-orchestrator.test.ts  (130-180 行)
```

### 2.2 主要型 (TypeScript)

```ts
// trigger 入力 (3 種統合)
export type RollbackTriggerInput =
  | { kind: 'alert_emergency'; alert: AlertInput; occurredAt: string }
  | { kind: 'canary_failure_threshold'; phase: CanaryPhase; failureRate: number; occurredAt: string }
  | { kind: 'manual_override'; reason: string; operator: string; occurredAt: string }

// 評価結果 (decision)
export type RollbackDecision =
  | { action: 'rollback_immediate'; reason: string; targetPhase: 0 }
  | { action: 'rollback_pending'; consecutiveCount: number; threshold: number }
  | { action: 'noop'; reason: 'cooldown_active' | 'below_threshold' | 'unsupported_kind' }

// 注入式 actuator (Edge Config 実 SDK は test 段階で mock)
export interface RollbackActuator {
  setCanaryPhase(phase: 0): Promise<{ ok: true; previousPhase: number }>
  notifyRollbackDispatched(decision: RollbackDecision): Promise<void>
}

// state (in-memory / 後段 redis 化想定)
export interface AutoRollbackState {
  readonly consecutiveFailures: number
  readonly lastRollbackAt: string | null
  readonly cooldownUntil: string | null
}
```

### 2.3 decision 関数 (純粋)

```ts
export function evaluateRollback(
  input: RollbackTriggerInput,
  state: AutoRollbackState,
  config: { failureThreshold: number; cooldownSec: number; emergencyImmediate: boolean },
  now: Date,
): { decision: RollbackDecision; nextState: AutoRollbackState }
```

- input が `alert_emergency` で `emergencyImmediate=true` → `rollback_immediate`
- input が `canary_failure_threshold` で連続 `failureThreshold` 回到達 → `rollback_immediate`、未達 → `rollback_pending`
- `cooldownUntil > now` → `noop` (`cooldown_active`)
- input が `manual_override` → 認可 check 経由で `rollback_immediate`

### 2.4 actuator 連動 (副作用層)

```ts
export async function dispatchRollback(
  decision: RollbackDecision,
  actuator: RollbackActuator,
): Promise<{ rolledBack: boolean; previousPhase?: number }>
```

- `rollback_immediate` のみ actuator.setCanaryPhase(0) 呼出
- 結果を notifyRollbackDispatched 経由で alert-router に再投入 (循環抑制のため kind=`rollback_completed` 専用 severity 'critical' で投入)
- 失敗時 retry 1 回 → なお失敗で throw

---

## §3 ESC condition (誤発火抑止 3 条件 AND)

| 条件 | 既定値 | 根拠 |
|---|---|---|
| ① severity threshold | emergency or canary_failure_threshold | warning/critical では rollback 自動化しない (operator 判断) |
| ② 連続 N 回 (canary) | 3 | 単発 transient failure での誤発火抑止 |
| ③ cooldown | 600 sec (10 min) | rollback 後の即再 trigger 抑止 (rollout flap 防止) |

emergency severity alert は ② を bypass (1 回で即時) を default、`emergencyImmediate` flag で機構統一。manual_override は cooldown bypass 可だが認可 check 必須。

---

## §4 rollback target 仕様

### 4.1 Edge Config rollback action

W6-A canary が phase 0/25/50/100 を Edge Config key (例 `canary.phase`) で管理する想定 → W6-D は **phase 0 (=old release 100%)** に setCanaryPhase 呼出で巻き戻し。Edge Config write は actuator 注入経由のため unit test では mock、本番では Vercel SDK 実 wire (R30+ Dev-HHH 相当)。

### 4.2 atomic 化保証

actuator.setCanaryPhase(0) は Edge Config の atomic write (SDK 仕様の `update` operation 単発) で実装、partial state 排除。rollback 完了通知は alert-router 経由で 3 channel notify、operator は 1 min 以内に状況把握可能。

### 4.3 rollback 後の再前進 policy

W6-D 自体は forward 前進 (再 rollout) 機能を持たない。`rollback_immediate` 完遂後は `cooldownUntil = now + 600s`、`consecutiveFailures = 0` reset。再前進は operator が manual で W6-A canary phase up flow を再起動する必要あり (DEC-080+081 採決後の SOP §6 で定義想定)。

---

## §5 unit test 想定 (130-180 行)

| # | case | 期待 |
|---|---|---|
| 1 | emergency alert / emergencyImmediate=true | rollback_immediate / actuator 1 回呼出 / cooldownUntil 設定 |
| 2 | canary failure 1/3 | rollback_pending (consecutiveCount=1) / actuator 未呼出 |
| 3 | canary failure 連続 3 回 | rollback_immediate / actuator 1 回呼出 |
| 4 | cooldown active | noop / actuator 未呼出 |
| 5 | cooldown 経過後 emergency | rollback_immediate (新 round) |
| 6 | unsupported kind | noop / 'unsupported_kind' |
| 7 | actuator 失敗 retry 1 回 | retry 後 success / dispatch 完遂 |
| 8 | actuator 2 回失敗 throw | dispatch throw |
| 9 | manual_override 認可成功 | rollback_immediate |
| 10 | manual_override 認可失敗 | noop |
| 11 | dedup notification | alert-router 投入 1 回 (循環抑制) |
| 12 | clock 操作 (state.cooldownUntil) | now 渡しで決定論検証 |

---

## §6 物理化引継 R30+

| step | round | 担当 | 内容 |
|---|---|---|---|
| (a) spec 起案 (本書面) | R30 | **Dev-III (本軸)** | 完遂 |
| (b) 物理化 | R30+ | Dev (DEC-080+081 採決後) | src 90-130 行 + test 130-180 行 |
| (c) 実 actuator wire | R30+ | Dev (Vercel SDK 連動) | edge-config-canary 既存 helper との接続 |
| (d) SOP §5 rollback procedure 起案 | R30+ | Dev + W6 SOP author | runsheets/w6b-production-ga-sop.md §5 追加 |
| (e) DEC-080+081 採決後 R30+ session | R30+ | PM-W + Owner | 物理 wire 着手前提採決 |

---

## §7 制約遵守 (本 spec 段階)

| 制約 | status |
|---|---|
| 既存 absolute 4 file 無改変 | 達成 (本 spec は新規 spec のみ起票) |
| 副作用 0 | 達成 (本書面 spec only / 物理化未実施) |
| API call $0 | 達成 (actuator 注入式・mock test 想定) |
| 既存 W6-A canary + W6-B alert-router 無改変 | 達成 (W6-D は新規 module / 接続点は actuator 注入経由) |
| TS6059 0 件継承 | 達成 (新規 module は composite topology 整合想定) |
| 絵文字 0 | 達成 |
| 物理通知 0 件 | 達成 (mock dispatcher 経由) |

---

## §8 R30+ 依存 DEC 採決一覧

| DEC | 役割 | 採決状況 |
|---|---|---|
| DEC-019-080 (Sentry 実発火必須化) | W6-D の alert input (emergency 検出条件) | R29 Sec-X confirmed (CEO completion report §3) |
| DEC-019-081 (月次予算 alert) | budget alert → emergency 経路の 1 trigger | R29 confirmed |
| DEC-019-076 (alerting SoT) | alert-router の SoT 連動 | confirmed |
| DEC-019-079 (Phase 2 W5 着手 + ARCH-01 supersede) | W6 完遂宣言と並行整合 | R30+ 採決想定 |

---

## §9 結語

W6-D spec 起案完遂。W6-A canary + W6-B alert-router の延長として、異常検知信号を rollback trigger に連動させる decision + actuator 分離設計。3 条件 AND の ESC condition で誤発火抑止、純粋関数 + 注入式 actuator パターン継続で API call $0、unit test 12 case で網羅。物理化 LOC 想定 220-310 行 / R30+ Dev で物理化引継 (DEC-080+081 採決連動)。Edge Config phase 0 atomic rollback で operator 介入待ちの解消、運用安定性向上 + W6 完遂宣言の前提条件確保。
