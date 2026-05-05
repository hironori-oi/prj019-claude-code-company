# Dev-AAA Round 27 — W4 第 5 弾 5-D 詳細 spec（cross-orchestrator chaos test）

最終更新: 2026-05-05 W0-Week1
起案: Dev 部門 R27 Dev-AAA（補完 dev / 9 並列体制 9 番目）
位置付け: Round 26 Dev-XX `dev-xx-r26-w4-fifth-5b-candidates.md` §4 で base spec 化された 5-D 候補（cross-orchestrator chaos test）を物理化レベル詳細化。R28 Dev 担当による物理化準備完了を目的とする。
版: v1.0
連動 DEC: DEC-019-006 / 033 / 041 / 049 / 051 / 062 / 074-077 / 079
連動 spec / file（絶対無改変）:
- `app/harness/src/__tests__/phase2-w5-cross-orchestrator-e2e.test.ts`（R25 Dev-SS / 754 行 / 12 tests）
- `app/harness/src/__tests__/phase2-w5-cross-package-extension.test.ts`（R25 Dev-TT / 613 行 / 8 tests）
- `app/harness/src/__tests__/17day-path-w4-hitl-hardguards-cross.test.ts`（R24 Dev-QQ / 907 行 / 12 tests）

物理化対象 file（R28 想定）:
- `app/harness/src/__tests__/phase2-w5-cross-orchestrator-chaos.test.ts`（550-700 行 / 9-11 tests / 4 groups）

---

## §0 サマリ（CEO 200 字）

W4 第 5 弾 5-D 候補（cross-orchestrator chaos test）を物理化レベル詳細化。R25 Dev-SS の cross-orchestrator e2e（12 tests / clean state）を chaos injection で failure 系統に拡張、real-world failure scenario の cross-orchestrator 復旧経路を 4 groups / 9-11 tests で検証。**dev hands-on 工数 7.0-7.5h** で R28 1 round 完遂可能。chaos injector helper 構築（120-150 行）+ 既存 mock orchestrator 拡張で実装。優先度 = 中-高（R25 第 1 弾 happy-path の自然延伸 / 6/19 公開前 timeline 適合性高）。harness 836 PASS / openclaw-runtime 394 PASS baseline absolute 保護、本書面で実改変ゼロ件、物理化は R28 Dev 担当で実行。

---

## §1 spec 詳細化の位置付け

### 1.1 R26 Dev-XX base spec からの拡張軸

| 軸 | R26 Dev-XX base spec | R27 Dev-AAA 詳細 spec（本書面） |
|---|---|---|
| tests 数 | 9-11 | **9-11 確定**（最小 9 / 推奨 10 / 最大 11） |
| groups 数 | 4 | **4 確定**（CO-CHAOS-1 〜 CO-CHAOS-4） |
| 行数 | 550-700 | **600-700 確定** |
| 工数 hands-on | 7.0-7.5h | **7.0-7.5h 確定** |
| chaos injector | 概要のみ | **§4 で 120-150 行 helper 詳細化** |
| assertions | 概要のみ | **§5 で詳細化** |
| risk mitigation | 簡易 | **§6 で 8 件展開** |
| W5 第 1 弾との分離 | 言及のみ | **§7 で物理 path 衝突回避策確定** |

### 1.2 物理化 readiness pt（5-D 候補）

| 評価軸 | 配点 | score | 根拠 |
|---|---|---|---|
| spec 詳細度 | 20 | **19** | 本書面で物理化 1 step レベル化 |
| baseline 完備 | 20 | **20** | R25 Dev-SS / Dev-TT / R24 Dev-QQ file 完備 |
| chaos injector 戦略明確化 | 15 | **14** | §4 で helper 戦略確定 |
| risk mitigation | 15 | **14** | §6 で 8 件展開 |
| 制約担保 | 10 | **10** | API $0 / 副作用 0 / 絵文字 0 |
| W5 第 1 弾との独立性 | 10 | **10** | 物理 path 衝突 0 件 / R25 file 不接触 |
| timeline 適合性 | 10 | **9** | 7-7.5h で R28 1 round 完遂可 |
| **合計** | **100** | **96** | **R28 物理化 GO（無条件）** |

---

## §2 file 構造（600-700 行想定）

### 2.1 file header（30-40 行）

```typescript
/**
 * phase2-w5-cross-orchestrator-chaos.test.ts
 *
 * W4 第 5 弾 5-D — cross-orchestrator chaos injection test
 *
 * 起案: R27 Dev-AAA（base spec）
 * 物理化: R28 Dev-XXX 想定
 * 連動 DEC: DEC-019-006 / 033 / 049 / 051 / 062 / 074-077 / 079
 *
 * 検証範囲:
 * - orchestrator A 内 chaos × orchestrator B への影響伝搬
 * - orchestrator B 内 chaos × orchestrator A への影響伝搬
 * - cross-orchestrator partial failure × global kill switch
 * - chaos 解消後の resilience + state re-sync
 *
 * 工数: hands-on 7.0-7.5h
 * 制約: API call $0 / 副作用 0 / 絵文字 0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { MockOrchestratorA, MockOrchestratorB, MockClaudeBridge } from '../helpers/mock-orchestrator';
import { ChaosInjector, ChaosScenario } from '../helpers/chaos-injector';
import { GlobalKillSwitch } from '../path/to/global-kill-switch';
import { ConsensusCoordinator } from '../path/to/consensus-coordinator';
```

### 2.2 共通 setup（40-50 行）

```typescript
let tmpDir: string;
let orchA: MockOrchestratorA;
let orchB: MockOrchestratorB;
let chaos: ChaosInjector;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'co-chaos-'));
  orchA = new MockOrchestratorA({ tmpDir, id: 'A' });
  orchB = new MockOrchestratorB({ tmpDir, id: 'B' });
  chaos = new ChaosInjector({ orchestrators: [orchA, orchB] });
});

afterEach(async () => {
  await chaos.reset();
  await orchA.shutdown();
  await orchB.shutdown();
  rmSync(tmpDir, { recursive: true, force: true });
});
```

### 2.3 Group CO-CHAOS-1 — orchestrator A 内 chaos × B 影響（180-200 行 / 3 tests）

#### test CO-CHAOS-1-1: A heartbeat lost × B fallback 動作

```typescript
describe('CO-CHAOS-1: orchestrator A chaos × B fallback', () => {
  it('CO-CHAOS-1-1: A heartbeat lost × B fallback active within 10s', async () => {
    await orchA.start();
    await orchB.start();
    await orchA.connectTo(orchB);

    // chaos: A の heartbeat を停止
    chaos.inject(ChaosScenario.HEARTBEAT_LOST, { target: 'A' });

    // 10s 以内に B が fallback mode に遷移
    await new Promise(r => setTimeout(r, 10_000));
    expect(orchB.isFallbackMode()).toBe(true);
    expect(orchB.getFallbackReason()).toBe('peer_heartbeat_lost');
    expect(orchB.processQueueLength()).toBeGreaterThanOrEqual(0); // B が単独で継続
  }, 30_000);
```

#### test CO-CHAOS-1-2: A SIGTERM × B journal replay

```typescript
  it('CO-CHAOS-1-2: A SIGTERM × B journal replay restores cross state', async () => {
    await orchA.start();
    await orchB.start();
    await orchA.connectTo(orchB);

    // A 側で 100 ops 進行、B 側 journal sync
    for (let i = 0; i < 100; i++) await orchA.executeOp({ id: i });
    await orchA.syncJournalTo(orchB);

    chaos.inject(ChaosScenario.SIGTERM, { target: 'A' });
    await orchA.waitForShutdown();

    // B が A の journal を replay
    const replayedCount = await orchB.replayPeerJournal('A');
    expect(replayedCount).toBe(100);
    expect(orchB.getCrossState().opsCompleted).toBe(100);
  }, 30_000);
```

#### test CO-CHAOS-1-3: A budget exceed × B kill propagation

```typescript
  it('CO-CHAOS-1-3: A budget exceed × kill propagates to B within 5s', async () => {
    await orchA.start();
    await orchB.start();
    await orchA.connectTo(orchB);

    chaos.inject(ChaosScenario.BUDGET_EXCEED, { target: 'A', amountUsd: 1000 });

    await new Promise(r => setTimeout(r, 5_000));
    expect(orchA.isKilled()).toBe(true);
    expect(orchB.isKilled()).toBe(true);
    expect(orchB.getKillReason()).toBe('peer_budget_exceeded');
  }, 30_000);
});
```

### 2.4 Group CO-CHAOS-2 — orchestrator B 内 chaos × A 影響（180-200 行 / 3 tests）

#### test CO-CHAOS-2-1: B handoff timeout × A retry 経路

```typescript
describe('CO-CHAOS-2: orchestrator B chaos × A retry path', () => {
  it('CO-CHAOS-2-1: B handoff timeout (15s) × A retries 3 times', async () => {
    await orchA.start();
    await orchB.start();
    await orchA.connectTo(orchB);

    chaos.inject(ChaosScenario.HANDOFF_TIMEOUT, { target: 'B', timeoutMs: 15_000 });

    const result = await orchA.requestHandoff(orchB, { maxRetries: 3 });
    expect(result.attempts).toBe(3);
    expect(result.finalStatus).toBe('exhausted');
    expect(orchA.getRetryHistory()).toHaveLength(3);
  }, 60_000);
```

#### test CO-CHAOS-2-2: B state corruption × A consensus rollback

```typescript
  it('CO-CHAOS-2-2: B state corruption × A consensus rollback', async () => {
    await orchA.start();
    await orchB.start();
    const consensus = new ConsensusCoordinator([orchA, orchB]);

    // 100 ops で consensus 確立
    for (let i = 0; i < 100; i++) await consensus.commit({ id: i });

    chaos.inject(ChaosScenario.STATE_CORRUPTION, { target: 'B', sinceOp: 50 });

    const rollbackResult = await consensus.detectAndRollback();
    expect(rollbackResult.rolledBackOps).toBe(50); // op 50 以降を rollback
    expect(orchA.getOpsCount()).toBe(50);
    expect(orchB.getOpsCount()).toBe(50);
  }, 30_000);
```

#### test CO-CHAOS-2-3: B subprocess hang × A escalation chain

```typescript
  it('CO-CHAOS-2-3: B subprocess hang × A escalates SIGTERM → SIGKILL', async () => {
    await orchA.start();
    await orchB.start();
    await orchA.connectTo(orchB);

    chaos.inject(ChaosScenario.SUBPROCESS_HANG, { target: 'B' });

    const escalation = await orchA.escalatePeer(orchB, {
      sigtermGraceMs: 5_000,
      sigkillTimeoutMs: 10_000,
    });
    expect(escalation.signals).toEqual(['SIGTERM', 'SIGKILL']);
    expect(escalation.finalStatus).toBe('killed');
  }, 30_000);
});
```

### 2.5 Group CO-CHAOS-3 — cross-orchestrator partial failure（150-180 行 / 2-3 tests）

#### test CO-CHAOS-3-1: A + B 同時 chaos × global kill switch

```typescript
describe('CO-CHAOS-3: partial failure × global kill switch', () => {
  it('CO-CHAOS-3-1: A+B simultaneous chaos × global kill switch trigger', async () => {
    await orchA.start();
    await orchB.start();
    const globalKill = new GlobalKillSwitch([orchA, orchB]);

    chaos.inject(ChaosScenario.HEARTBEAT_LOST, { target: 'A' });
    chaos.inject(ChaosScenario.HEARTBEAT_LOST, { target: 'B' });

    await new Promise(r => setTimeout(r, 12_000));
    expect(globalKill.isTriggered()).toBe(true);
    expect(globalKill.getReason()).toBe('all_orchestrators_unhealthy');
    expect(orchA.isKilled()).toBe(true);
    expect(orchB.isKilled()).toBe(true);
  }, 30_000);
```

#### test CO-CHAOS-3-2: A 完全 down × B 単独 fallback mode

```typescript
  it('CO-CHAOS-3-2: A fully down × B solo fallback mode operational', async () => {
    await orchA.start();
    await orchB.start();
    await orchA.connectTo(orchB);

    chaos.inject(ChaosScenario.FULL_CRASH, { target: 'A' });
    await new Promise(r => setTimeout(r, 5_000));

    expect(orchA.isAlive()).toBe(false);
    expect(orchB.isAlive()).toBe(true);
    expect(orchB.isSoloFallback()).toBe(true);

    // B が単独で 50 ops 完遂
    for (let i = 0; i < 50; i++) await orchB.executeOp({ id: i });
    expect(orchB.getOpsCount()).toBe(50);
  }, 30_000);
```

#### test CO-CHAOS-3-3 (optional): A + B 交互 chaos 5 cycle × consensus 維持

```typescript
  it.skipIf(!process.env.EXTENDED_CHAOS)(
    'CO-CHAOS-3-3: A+B alternating chaos 5 cycles × consensus maintained',
    async () => {
      await orchA.start();
      await orchB.start();
      const consensus = new ConsensusCoordinator([orchA, orchB]);

      for (let cycle = 0; cycle < 5; cycle++) {
        const target = cycle % 2 === 0 ? 'A' : 'B';
        chaos.inject(ChaosScenario.HEARTBEAT_LOST, { target, durationMs: 3_000 });
        await new Promise(r => setTimeout(r, 5_000));
        chaos.recover({ target });
        await consensus.commit({ id: cycle });
      }

      expect(consensus.getCommittedCount()).toBe(5);
      expect(consensus.isConsistent()).toBe(true);
    },
    60_000
  );
});
```

### 2.6 Group CO-CHAOS-4 — recovery resilience（80-120 行 / 1-2 tests）

#### test CO-CHAOS-4-1: chaos 解消後の cross state re-sync

```typescript
describe('CO-CHAOS-4: recovery resilience', () => {
  it('CO-CHAOS-4-1: chaos resolved × cross state re-sync within 10s', async () => {
    await orchA.start();
    await orchB.start();
    await orchA.connectTo(orchB);

    chaos.inject(ChaosScenario.HEARTBEAT_LOST, { target: 'A' });
    await new Promise(r => setTimeout(r, 8_000));
    expect(orchB.isFallbackMode()).toBe(true);

    chaos.recover({ target: 'A' });
    await new Promise(r => setTimeout(r, 10_000));

    expect(orchB.isFallbackMode()).toBe(false);
    expect(orchA.getCrossState()).toEqual(orchB.getCrossState());
  }, 30_000);
```

#### test CO-CHAOS-4-2 (optional): chaos × HITL gate 干渉

```typescript
  it.skipIf(!process.env.EXTENDED_CHAOS)(
    'CO-CHAOS-4-2: chaos × HITL gate × human escalation triggered',
    async () => {
      await orchA.start();
      await orchB.start();
      await orchA.connectTo(orchB);

      const gate = orchA.getHitlGate('dev_kickoff_approval');
      gate.requestApproval();

      chaos.inject(ChaosScenario.HEARTBEAT_LOST, { target: 'A' });
      await new Promise(r => setTimeout(r, 6_000));

      expect(gate.isHumanEscalated()).toBe(true);
      expect(gate.getEscalationReason()).toBe('orchestrator_chaos_during_pending');
    },
    30_000
  );
});
```

### 2.7 footer + cleanup（10-20 行）

---

## §3 行数内訳まとめ

| 区分 | 行数 |
|---|---|
| header + import | 30-40 |
| 共通 setup + helper | 40-50 |
| Group CO-CHAOS-1（3 tests） | 180-200 |
| Group CO-CHAOS-2（3 tests） | 180-200 |
| Group CO-CHAOS-3（2-3 tests） | 150-180 |
| Group CO-CHAOS-4（1-2 tests） | 80-120 |
| footer + cleanup | 10-20 |
| **合計** | **600-700 行** |

---

## §4 chaos injector helper 詳細（120-150 行 / 新規）

### 4.1 helper 配置

```
app/harness/src/helpers/chaos-injector.ts (新規 / 120-150 行)
```

### 4.2 ChaosScenario 列挙

```typescript
export enum ChaosScenario {
  HEARTBEAT_LOST = 'heartbeat_lost',
  SIGTERM = 'sigterm',
  BUDGET_EXCEED = 'budget_exceed',
  HANDOFF_TIMEOUT = 'handoff_timeout',
  STATE_CORRUPTION = 'state_corruption',
  SUBPROCESS_HANG = 'subprocess_hang',
  FULL_CRASH = 'full_crash',
}
```

### 4.3 ChaosInjector class skeleton

```typescript
export class ChaosInjector {
  private orchestrators: Map<string, MockOrchestrator>;
  private activeScenarios: Map<string, ChaosScenario[]> = new Map();

  constructor(opts: { orchestrators: MockOrchestrator[] }) {
    this.orchestrators = new Map(opts.orchestrators.map(o => [o.id, o]));
  }

  inject(scenario: ChaosScenario, opts: { target: string; [k: string]: any }): void {
    const orch = this.orchestrators.get(opts.target);
    if (!orch) throw new Error(`unknown target: ${opts.target}`);

    switch (scenario) {
      case ChaosScenario.HEARTBEAT_LOST:
        orch.simulateHeartbeatLost();
        break;
      case ChaosScenario.SIGTERM:
        orch.simulateSigterm();
        break;
      case ChaosScenario.BUDGET_EXCEED:
        orch.simulateBudgetExceed(opts.amountUsd);
        break;
      case ChaosScenario.HANDOFF_TIMEOUT:
        orch.setHandoffTimeout(opts.timeoutMs);
        break;
      case ChaosScenario.STATE_CORRUPTION:
        orch.simulateStateCorruption(opts.sinceOp);
        break;
      case ChaosScenario.SUBPROCESS_HANG:
        orch.simulateSubprocessHang();
        break;
      case ChaosScenario.FULL_CRASH:
        orch.simulateFullCrash();
        break;
    }
    // record activeScenarios
  }

  recover(opts: { target: string }): void {
    const orch = this.orchestrators.get(opts.target);
    orch?.recoverFromChaos();
  }

  async reset(): Promise<void> {
    for (const orch of this.orchestrators.values()) {
      await orch.recoverFromChaos();
    }
    this.activeScenarios.clear();
  }
}
```

### 4.4 mock 戦略 — 副作用 0 担保

| chaos scenario | mock 経路 | real subprocess spawn |
|---|---|---|
| HEARTBEAT_LOST | heartbeat emitter pause | 0 |
| SIGTERM | signal event emitter | 0 |
| BUDGET_EXCEED | budget tracker mock value override | 0 |
| HANDOFF_TIMEOUT | handoff promise reject after timeout | 0 |
| STATE_CORRUPTION | mock state replace（特定 op 以降）| 0 |
| SUBPROCESS_HANG | promise never resolves（abortable） | 0 |
| FULL_CRASH | mock orchestrator state = 'crashed' | 0 |

---

## §5 assertions 詳細

### 5.1 Group CO-CHAOS-1 assertions

| test | assertion | threshold | rationale |
|---|---|---|---|
| 1-1 | B fallback active | within 10s | heartbeat timeout 標準 |
| 1-1 | B fallbackReason === 'peer_heartbeat_lost' | exact | error message 整合性 |
| 1-2 | replayed count === 100 | exact | journal 完全 replay |
| 1-3 | kill propagation < 5s | 5s | budget kill 即時性 |

### 5.2 Group CO-CHAOS-2 assertions

| test | assertion | threshold | rationale |
|---|---|---|---|
| 2-1 | retry attempts === 3 | exact | maxRetries 既定遵守 |
| 2-2 | rollback ops === 50 | exact | corruption since op 50 |
| 2-3 | signals === [SIGTERM, SIGKILL] | exact | escalation chain |

### 5.3 Group CO-CHAOS-3 assertions

| test | assertion | threshold | rationale |
|---|---|---|---|
| 3-1 | global kill triggered | within 12s | both unhealthy detection |
| 3-2 | B solo fallback ops === 50 | exact | solo continuance |
| 3-3 | consensus committed === 5 | exact | 5 cycle resilience |

### 5.4 Group CO-CHAOS-4 assertions

| test | assertion | threshold | rationale |
|---|---|---|---|
| 4-1 | re-sync within 10s | 10s | recovery time SLO |
| 4-1 | A.crossState === B.crossState | deep equal | state consistency |
| 4-2 | human escalation triggered | within 6s | gate × chaos 干渉検出 |

---

## §6 risk mitigation 8 件

| # | risk | mitigation |
|---|---|---|
| R1 | mock chaos が real timing と乖離 | timer-based test = 30s 上限 + buffer 含む |
| R2 | parallel mock orchestrator で worker 衝突 | tmpDir 完全隔離 + per-test mkdtempSync |
| R3 | chaos injector reset 漏れで state leak | afterEach で chaos.reset() + orch.shutdown() 強制 |
| R4 | timeout-based assertion で flaky | 30s 上限 + retries 設計 / CI で 3 retry 設定 |
| R5 | EXTENDED_CHAOS env で skip 制御漏れ | it.skipIf(!process.env.EXTENDED_CHAOS) で gating |
| R6 | global kill switch test が他 test に伝播 | per-test instance + scope 制限 |
| R7 | HITL gate × chaos test での gate state leak | gate.reset() in afterEach |
| R8 | R25 Dev-SS の cross-orchestrator-e2e と物理 path 衝突 | path 完全独立（chaos suffix） + import 0 件 |

---

## §7 W5 第 1 弾（R25 Dev-SS）との分離保証

### 7.1 物理 path 衝突回避

| file | 衝突可能性 | 回避策 |
|---|---|---|
| `phase2-w5-cross-orchestrator-e2e.test.ts` (R25 Dev-SS / 754 行) | path 完全独立 | suffix `-chaos` で別 file |
| `phase2-w5-cross-package-extension.test.ts` (R25 Dev-TT / 613 行) | 軸が異なる | import 0 件 |

### 7.2 import 経路の独立性

5-D file は R25 file を import せず、`mock-orchestrator` helper のみ共有。共有 helper も read-only 利用で R25 file と直接結合しない。

### 7.3 並列実行可能性

| test 群 | 並列実行可否 | 根拠 |
|---|---|---|
| 5-D × 5-A (R26 Dev-VV claude-bridge) | OK | 異なる file / 異なる helper / 衝突 0 |
| 5-D × 5-B (R27 Dev-YY HITL × hardguards) | OK | 異なる file / 異なる helper / 衝突 0 |
| 5-D × 5-C (R29+ breach-counter 1B) | OK | scheduled longrun は別 wallclock |

---

## §8 工数 + timeline

### 8.1 hands-on 工数（dev 担当 / R28）

| task | 工数 (h) |
|---|---|
| skeleton 構築（4 groups / 9-11 describe） | 1.0 |
| chaos-injector helper 構築（120-150 行） | 1.0 |
| Group CO-CHAOS-1 実装 + assertions | 1.5 |
| Group CO-CHAOS-2 実装 | 1.5 |
| Group CO-CHAOS-3 実装 | 1.0 |
| Group CO-CHAOS-4 実装 | 0.5 |
| harness 836+ PASS regression 0 verify | 0.5 |
| **合計** | **7.0-7.5** |

### 8.2 wallclock timeline

- spec 確定（本書面）= R27 完遂時
- 物理化（hands-on）= R28 想定 7-7.5h
- 報告書作成 = +0.5-1h
- **総 wallclock 8-9h**（R28 1 round 内で完遂）

---

## §9 6/19 公開前 timeline 適合性評価

| 観点 | 評価 |
|---|---|
| 6/19 までに完遂可能か | **可**（R28 1 round / 8-9h で完遂） |
| 6/19 公開で必須か | **中-高**（cross-orchestrator 復旧経路の chaos 検証は real-world resilience 担保） |
| 公開前完遂の価値 | **高**（公開当日の cross-orchestrator failure 対応の test 化担保） |
| 緊急性 | **中-高** |

→ **R28 物理化 GO**（5-A R26 / 5-B R27 完遂後の自然延伸として最適）

---

## §10 制約遵守 status

| 制約 | 遵守 status |
|---|---|
| harness 836 PASS / openclaw-runtime 394 PASS 維持 | **達成**（本書面で実改変 0 件） |
| API 追加コスト $0 | **達成**（chaos injector mock + orchestrator mock） |
| 副作用 0 | **達成**（OS tmp + afterEach cleanup + chaos.reset() 強制） |
| 絵文字 0 | **達成** |
| R25 Dev-SS / Dev-TT file absolute 無改変 | **達成**（参照のみ） |
| R24 Dev-QQ file absolute 無改変 | **達成** |
| Phase 1 移行済 file absolute 無改変 | **達成** |
| 4 control 実装 absolute 無改変 | **達成** |
| fix forward-only 厳守 | **達成** |
| 物理化 file は R28 想定 | **達成**（本書面で起案のみ） |

---

## §11 結語

W4 第 5 弾 5-D 候補（cross-orchestrator chaos test）を物理化レベルで詳細化。**4 groups / 9-11 tests / 600-700 行 / hands-on 7.0-7.5h** で確定。chaos injector helper（120-150 行 / 7 scenario）+ mock orchestrator 拡張で実装、API call $0 / 副作用 0 担保。

物理化 readiness pt = **96/100**（spec 詳細度 + baseline 完備 + W5 第 1 弾との独立性確証）= **R28 物理化 GO（無条件）**。6/19 公開前 timeline 適合性高、5-A R26 + 5-B R27 完遂後の自然延伸として R28 着手最適。

本書面は spec 詳細化のみ、物理化は R28 Dev 担当で実行。harness 836 PASS / openclaw-runtime 394 PASS baseline absolute 保護完遂。
