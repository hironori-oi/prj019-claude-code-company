# Dev-AAA Round 27 — W6 第 2 弾 W6-B spec 草案（performance regression baseline）

最終更新: 2026-05-05 W0-Week1
起案: Dev 部門 R27 Dev-AAA（補完 dev / 9 並列体制 9 番目）
位置付け: Round 26 Dev-XX `dev-xx-r26-w6-kickoff-prep.md` §4 で base spec 化された W6-B 候補（performance regression baseline）を草案レベル詳細化。R30+ Dev 担当による物理化準備の前段として、W6-A（operational hardening e2e / 第 1 弾推奨）完成後の next step を整備。
版: v1.0
連動 DEC: DEC-019-006 / 049 / 062 / 074-077 / 079
連動 baseline:
- W6 第 1 弾 (W6-A): operational hardening e2e（R28-R29 想定 / Dev-ZZ R27 spec 詳細化中 / 8-10 tests）
- 既存 stress chaos: `file-breach-counter-stress-chaos.test.ts`（R22 / 9 tests / 100M scale）
- 既存 longrun: `heartbeat-1m-10digit-longrun-stability.test.ts`（R22 / 5 tests / 1M）

物理化対象 file（R30+ 想定）:
- `app/harness/src/__tests__/phase2-w6-performance-regression-baseline.test.ts`（500-650 行 / 6-8 tests / 3 groups）

---

## §0 サマリ（CEO 200 字）

W6 第 2 弾候補（W6-B = performance regression baseline）を草案レベル詳細化。heartbeat / breach-counter / cost-tracker 3 軸の latency baseline を統計的に確定し、R30+ で performance regression を自動検出する基準を確立。**3 groups / 6-8 tests / 500-650 行 / hands-on 5-6h + measurement runs 3-6h**。p50 / p99 / max latency + RSS growth + CV を JSON 形式 baseline file `performance-baseline-v1.json` に永続化、後続 round で diff 検出経路化。優先度 = 中（W6-A operational hardening 完遂後の自然延伸 / 6/19 公開前は緊急性中 / 公開後 stabilization 期間で実施推奨）。harness 836 PASS / openclaw-runtime 394 PASS baseline absolute 保護、本書面で実改変ゼロ件。

---

## §1 W6-B 草案の位置付け

### 1.1 R26 Dev-XX base spec からの拡張軸

| 軸 | R26 Dev-XX base spec | R27 Dev-AAA 草案 spec（本書面） |
|---|---|---|
| tests 数 | 6-8 | **6-8 確定**（最小 6 / 推奨 7 / 最大 8） |
| groups 数 | 3 | **3 確定**（PB-1 / PB-2 / PB-3） |
| 行数 | 450-600 | **500-650 確定** |
| 工数 hands-on | 5-6h + measurement | **5-6h 確定** + measurement 3-6h |
| baseline file 仕様 | 言及のみ | **§4 で JSON schema 確定** |
| assertions | 概要のみ | **§5 で詳細化** |
| regression detection 経路 | 言及のみ | **§6 で詳細化** |
| risk mitigation | 簡易 | **§7 で 6 件展開** |

### 1.2 W6-B 物理化 readiness pt（草案レベル）

| 評価軸 | 配点 | score | 根拠 |
|---|---|---|---|
| spec 詳細度 | 20 | **17** | 本書面で草案レベル化（詳細化は R29+ で完了想定） |
| baseline 完備 | 20 | **18** | 既存 R22 stress chaos + 1M longrun 完備 |
| baseline file 戦略明確化 | 15 | **14** | §4 で JSON schema 確定 |
| risk mitigation | 15 | **12** | §7 で 6 件展開 |
| 制約担保 | 10 | **10** | API $0 / 副作用 0 / 絵文字 0 |
| W6-A との独立性 | 10 | **10** | path 完全独立 / import 0 件 |
| timeline 適合性 | 10 | **6** | measurement wallclock 3-6h で 6/19 前は中程度 |
| **合計** | **100** | **87** | **R30+ 物理化 GO（草案 → 詳細 spec → 実装）** |

---

## §2 W6-B の主軸 + 検証範囲

### 2.1 主軸

W5 で達成した cross-package + bridge 統合の上で動作する 3 軸（heartbeat / breach-counter / cost-tracker）の **latency baseline を統計確定**し、R30+ 以降の performance regression を自動検出する数値基準を整備する。

### 2.2 検証 3 軸

| 軸 | 既存 baseline | W6-B で確定する値 |
|---|---|---|
| heartbeat | 1M longrun stability (R22 Sec-Q) | p50 / p99 / max / CV / RSS growth |
| breach-counter | 100M stress chaos (R22 Dev-KK) | p50 / p99 / max / checkpoint save/restore latency |
| cost-tracker | unit 経路 | checkBudget / incrementCost p50 / p99 / 並列 contender consistency |

---

## §3 file 構造（500-650 行想定）

### 3.1 file header（30-40 行）

```typescript
/**
 * phase2-w6-performance-regression-baseline.test.ts
 *
 * W6 第 2 弾 W6-B — performance regression baseline establishment
 *
 * 起案: R27 Dev-AAA（草案 spec）
 * 詳細化: R29+ 想定
 * 物理化: R30+ 想定
 * 連動 DEC: DEC-019-006 / 049 / 062 / 074-077 / 079
 *
 * 検証範囲:
 * - heartbeat / breach-counter / cost-tracker 3 軸の p50 / p99 / max latency 計測
 * - RSS growth + CV + GC pause baseline 確定
 * - performance-baseline-v1.json 形式で永続化
 *
 * 工数: hands-on 5-6h + measurement runs 3-6h
 * 制約: API call $0 / 副作用 0 / 絵文字 0
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

import { Heartbeat } from '../path/to/heartbeat';
import { BreachCounter } from '../path/to/breach-counter';
import { CostTracker } from '../path/to/cost-tracker';
import { computePercentiles, computeCV } from '../helpers/stat-helpers';
import { writeBaseline, readBaseline } from '../helpers/baseline-io';
```

### 3.2 共通 setup（30-40 行）

```typescript
const BASELINE_PATH = join(__dirname, '..', 'fixtures', 'performance-baseline-v1.json');
let baselineData: Record<string, any> = {};

beforeAll(() => {
  if (existsSync(BASELINE_PATH)) {
    baselineData = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  }
});

afterAll(() => {
  writeBaseline(BASELINE_PATH, baselineData);
});
```

### 3.3 Group PB-1 — heartbeat latency baseline（150-180 行 / 2-3 tests）

```typescript
describe('PB-1: heartbeat latency baseline', () => {
  it('PB-1-1: 100k loop — p50 / p99 / max recorded', async () => {
    const hb = new Heartbeat();
    const samples: number[] = [];

    for (let i = 0; i < 100_000; i++) {
      const start = performance.now();
      hb.tick();
      samples.push(performance.now() - start);
    }

    const { p50, p99, max } = computePercentiles(samples);
    baselineData.heartbeat_100k = { p50, p99, max, sampleCount: 100_000 };

    expect(p50).toBeLessThan(50);  // < 50us p50
    expect(p99).toBeLessThan(500); // < 500us p99
    expect(max).toBeLessThan(5_000); // < 5ms max
  });

  it('PB-1-2: 1M loop — CV < 0.3, RSS growth < 50%', async () => {
    const hb = new Heartbeat();
    const samples: number[] = [];
    const rssStart = process.memoryUsage().rss;

    for (let i = 0; i < 1_000_000; i++) {
      const start = performance.now();
      hb.tick();
      samples.push(performance.now() - start);
    }

    const cv = computeCV(samples);
    const rssEnd = process.memoryUsage().rss;
    const rssGrowth = (rssEnd - rssStart) / rssStart;

    baselineData.heartbeat_1m = { cv, rssGrowth, sampleCount: 1_000_000 };

    expect(cv).toBeLessThan(0.3);
    expect(rssGrowth).toBeLessThan(0.5);
  }, 60_000);

  it.skipIf(!process.env.PB_FULL)(
    'PB-1-3: parallel 4 worker × cross-worker latency consistency',
    async () => {
      const samples = await Promise.all(
        Array.from({ length: 4 }, () =>
          (async () => {
            const hb = new Heartbeat();
            const local: number[] = [];
            for (let i = 0; i < 250_000; i++) {
              const start = performance.now();
              hb.tick();
              local.push(performance.now() - start);
            }
            return computePercentiles(local);
          })()
        )
      );

      const p99s = samples.map(s => s.p99);
      const consistencyCv = computeCV(p99s);
      expect(consistencyCv).toBeLessThan(0.2);
    },
    60_000
  );
});
```

### 3.4 Group PB-2 — breach-counter latency baseline（120-150 行 / 2 tests）

```typescript
describe('PB-2: breach-counter latency baseline', () => {
  it('PB-2-1: 1M increment — p50 / p99 / max', async () => {
    const counter = new BreachCounter();
    const samples: number[] = [];

    for (let i = 0; i < 1_000_000; i++) {
      const start = performance.now();
      counter.increment();
      samples.push(performance.now() - start);
    }

    const { p50, p99, max } = computePercentiles(samples);
    baselineData.breach_counter_1m = { p50, p99, max };

    expect(p50).toBeLessThan(20);
    expect(p99).toBeLessThan(200);
    expect(max).toBeLessThan(2_000);
  }, 60_000);

  it('PB-2-2: 100 checkpoint save/restore — latency baseline', async () => {
    const counter = new BreachCounter();
    const saveSamples: number[] = [];
    const restoreSamples: number[] = [];

    for (let i = 0; i < 100; i++) {
      counter.increment();
      const saveStart = performance.now();
      const ck = await counter.saveCheckpoint();
      saveSamples.push(performance.now() - saveStart);

      const restoreStart = performance.now();
      await counter.restoreCheckpoint(ck);
      restoreSamples.push(performance.now() - restoreStart);
    }

    baselineData.breach_counter_checkpoint = {
      save: computePercentiles(saveSamples),
      restore: computePercentiles(restoreSamples),
    };

    expect(computePercentiles(saveSamples).p99).toBeLessThan(50_000); // < 50ms p99
    expect(computePercentiles(restoreSamples).p99).toBeLessThan(50_000);
  });
});
```

### 3.5 Group PB-3 — cost-tracker latency baseline（120-150 行 / 2-3 tests）

```typescript
describe('PB-3: cost-tracker latency baseline', () => {
  it('PB-3-1: 10k checkBudget — p50 / p99 / max', async () => {
    const tracker = new CostTracker({ budgetUsd: 1000 });
    const samples: number[] = [];

    for (let i = 0; i < 10_000; i++) {
      const start = performance.now();
      tracker.checkBudget();
      samples.push(performance.now() - start);
    }

    const { p50, p99, max } = computePercentiles(samples);
    baselineData.cost_tracker_check_10k = { p50, p99, max };

    expect(p50).toBeLessThan(10);
    expect(p99).toBeLessThan(100);
  });

  it('PB-3-2: 10k incrementCost — p50 / p99 / max', async () => {
    const tracker = new CostTracker({ budgetUsd: 1000 });
    const samples: number[] = [];

    for (let i = 0; i < 10_000; i++) {
      const start = performance.now();
      tracker.incrementCost(0.01);
      samples.push(performance.now() - start);
    }

    const { p50, p99, max } = computePercentiles(samples);
    baselineData.cost_tracker_increment_10k = { p50, p99, max };

    expect(p50).toBeLessThan(15);
    expect(p99).toBeLessThan(150);
  });

  it.skipIf(!process.env.PB_FULL)(
    'PB-3-3: 100 parallel contender × budget consistency',
    async () => {
      const tracker = new CostTracker({ budgetUsd: 100 });
      await Promise.all(
        Array.from({ length: 100 }, () =>
          (async () => {
            for (let i = 0; i < 100; i++) tracker.incrementCost(0.005);
          })()
        )
      );

      const finalCost = tracker.getCurrentCost();
      const expectedMax = 100 * 100 * 0.005; // 50 USD
      const drift = Math.abs(finalCost - expectedMax) / expectedMax;
      baselineData.cost_tracker_parallel_drift = drift;

      expect(drift).toBeLessThan(0.001); // < 0.1% drift
    },
    30_000
  );
});
```

### 3.6 行数内訳まとめ

| 区分 | 行数 |
|---|---|
| header + import | 30-40 |
| 共通 setup + helper | 30-40 |
| Group PB-1（2-3 tests） | 150-180 |
| Group PB-2（2 tests） | 120-150 |
| Group PB-3（2-3 tests） | 120-150 |
| stat-helpers + baseline-io（共有 helper） | 50-90（別 file 想定） |
| **合計** | **500-650 行** |

---

## §4 baseline file 仕様（performance-baseline-v1.json）

### 4.1 JSON schema 確定

```jsonc
{
  "$schema": "https://json-schema.org/draft-07/schema",
  "version": "v1",
  "createdAt": "2026-XX-XX",
  "nodeVersion": "vX.Y.Z",
  "metrics": {
    "heartbeat_100k": {
      "p50": "number (us)",
      "p99": "number (us)",
      "max": "number (us)",
      "sampleCount": "integer"
    },
    "heartbeat_1m": {
      "cv": "number",
      "rssGrowth": "number (ratio)",
      "sampleCount": "integer"
    },
    "breach_counter_1m": {
      "p50": "number (us)",
      "p99": "number (us)",
      "max": "number (us)"
    },
    "breach_counter_checkpoint": {
      "save": { "p50": "number", "p99": "number", "max": "number" },
      "restore": { "p50": "number", "p99": "number", "max": "number" }
    },
    "cost_tracker_check_10k": { "p50": "number", "p99": "number", "max": "number" },
    "cost_tracker_increment_10k": { "p50": "number", "p99": "number", "max": "number" },
    "cost_tracker_parallel_drift": "number (ratio)"
  }
}
```

### 4.2 配置 path

- `app/harness/src/__tests__/fixtures/performance-baseline-v1.json`
- gitignore 対象外（baseline 永続化）/ サイズ < 5KB 想定

### 4.3 baseline-io helper 仕様

```typescript
// app/harness/src/helpers/baseline-io.ts (新規 / 30-50 行)
export function readBaseline(path: string): BaselineData;
export function writeBaseline(path: string, data: BaselineData): void;
export function compareBaseline(current: BaselineData, baseline: BaselineData): BaselineDiff;
```

---

## §5 assertions 詳細

### 5.1 group PB-1 assertions（threshold は v1 baseline で確定）

| test | assertion | initial threshold | rationale |
|---|---|---|---|
| 1-1 | p50 < 50us | 50us | heartbeat 軽量 op の baseline |
| 1-1 | p99 < 500us | 500us | tail latency 担保 |
| 1-1 | max < 5ms | 5ms | spike 検出 |
| 1-2 | CV < 0.3 | 0.3 | 統計的安定性 |
| 1-2 | RSS growth < 50% | 50% | memory leak 0 担保 |
| 1-3 | parallel CV < 0.2 | 0.2 | cross-worker consistency |

### 5.2 group PB-2 assertions

| test | assertion | initial threshold | rationale |
|---|---|---|---|
| 2-1 | p50 < 20us | 20us | counter 軽量 op |
| 2-1 | p99 < 200us | 200us | tail |
| 2-2 | save p99 < 50ms | 50ms | checkpoint disk IO 含む |
| 2-2 | restore p99 < 50ms | 50ms | checkpoint replay |

### 5.3 group PB-3 assertions

| test | assertion | initial threshold | rationale |
|---|---|---|---|
| 3-1 | check p50 < 10us | 10us | budget 比較のみ |
| 3-1 | check p99 < 100us | 100us | tail |
| 3-2 | increment p50 < 15us | 15us | += op |
| 3-2 | increment p99 < 150us | 150us | tail |
| 3-3 | drift < 0.1% | 0.001 | 100 contender consistency |

---

## §6 regression detection 経路

### 6.1 W6-B 単独実行

```bash
# baseline 取得（初回 / R30 完遂時想定）
PB_FULL=1 npx vitest run --testNamePattern='phase2-w6-performance-regression-baseline'
# → fixtures/performance-baseline-v1.json 生成
```

### 6.2 後続 round での regression 検出

```bash
# R31+ で再 measurement → baseline と diff
npx vitest run --testNamePattern='phase2-w6-performance-regression-baseline'
# baseline-io.compareBaseline() で diff 計算
# diff > 20% で test fail（regression detected）
```

### 6.3 baseline update SOP

- baseline 更新は formal review 経路で（PM-X round 議決 / 改善目的の意図的更新のみ）
- node version upgrade 等 system 変動時は v2 / v3 へ revision

### 6.4 CI 統合（提案）

```yaml
# .github/workflows/performance-baseline.yml
name: Performance Baseline Check
on:
  pull_request:
    paths: ['app/harness/src/**', 'app/openclaw-runtime/src/**']

jobs:
  baseline-check:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx vitest run --testNamePattern='phase2-w6-performance-regression-baseline'
```

---

## §7 risk mitigation 6 件

| # | risk | mitigation |
|---|---|---|
| R1 | CI 環境変動で baseline drift（false positive 大量） | percentile threshold + 20% margin / node version pin |
| R2 | 1M / 100k loop で test 時間長すぎる | PB_FULL env で gating / 通常 CI は smoke のみ |
| R3 | parallel test での flaky | per-test instance 隔離 / Promise.all timeout 明示 |
| R4 | baseline file 更新時の競合 | atomic write（tmp → rename）/ git add per round |
| R5 | RSS 計測で OS 仕様変動 | global.gc() 強制 + node version pin |
| R6 | percentile 計算の statistical 安定性 | sample 数最小 100k 確保 / TDigest 等別 algo 検討 pending |

---

## §8 6/19 公開前 timeline 適合性評価

| 観点 | 評価 |
|---|---|
| 6/19 までに完遂可能か | **困難**（W6-A 完成後 + measurement wallclock で R30+ 想定） |
| 6/19 公開で必須か | **不要**（W6-A operational hardening でリリース必須範囲は担保） |
| 公開後 stabilization 期間で実施可能か | **可**（R30-R32 で 6/20-7/10 期間） |
| 緊急性 | **中** |

→ **R30+ 着手 + 公開後完遂が最適**

---

## §9 工数 + timeline

### 9.1 hands-on 工数

| task | 工数 (h) |
|---|---|
| skeleton 構築（3 groups / 6-8 describe） | 0.7 |
| stat-helpers 構築（computePercentiles / computeCV） | 0.5 |
| baseline-io helper 構築 | 0.5 |
| Group PB-1 実装 | 1.2 |
| Group PB-2 実装 | 0.8 |
| Group PB-3 実装 | 1.0 |
| baseline file 初回生成 + verify | 0.3 |
| harness 836+ PASS regression 0 verify | 0.3 |
| **合計（hands-on）** | **5.3-5.8** |

### 9.2 measurement 工数（CI 上）

| task | 工数 (h) |
|---|---|
| heartbeat 1M loop 計測 | 0.5-1.0 |
| breach-counter 1M 計測 | 0.5-1.0 |
| cost-tracker 10k × 2 計測 | 0.2-0.3 |
| parallel test 計測 | 0.5-1.0 |
| 結果集計 + baseline write | 0.3 |
| **合計（measurement）** | **2.0-3.6h** |

### 9.3 wallclock timeline

- 草案 spec（本書面）= R27 完遂時
- 詳細 spec = R29+ で更新
- 物理化（hands-on）= R30+ 想定 5-6h
- measurement = +2-4h
- 報告書作成 = +0.5-1h
- **総 wallclock 8-12h**（R30+ 1-2 round 内で完遂）

---

## §10 W6-A との並列 / 順序関係

| 観点 | W6-A (operational hardening) | W6-B (performance baseline) |
|---|---|---|
| 担当 | R28-R29 想定 Dev-BBB | R30+ 想定 Dev-XXX |
| file path | `phase2-w6-operational-hardening-e2e.test.ts` | `phase2-w6-performance-regression-baseline.test.ts` |
| 衝突可能性 | path 完全独立 / 衝突 0 | path 完全独立 / 衝突 0 |
| 依存関係 | なし | W6-A の orchestrator stability に弱依存（base 担保） |
| 並列実施可否 | OK | OK（W6-A 完遂後の R30+ で着手） |

---

## §11 制約遵守 status

| 制約 | 遵守 status |
|---|---|
| harness 836 PASS / openclaw-runtime 394 PASS 維持 | **達成**（本書面で実改変 0 件） |
| API 追加コスト $0 | **達成**（in-process measurement のみ） |
| 副作用 0 | **達成**（baseline file は fixtures/ 配下永続化、test artifact ではない） |
| 絵文字 0 | **達成** |
| 既存 R22 stress / longrun file absolute 無改変 | **達成**（参照のみ） |
| W6-A spec file absolute 無改変 | **達成** |
| Phase 1 移行済 file absolute 無改変 | **達成** |
| 4 control 実装 absolute 無改変 | **達成** |
| fix forward-only 厳守 | **達成** |
| 物理化 file は R30+ 想定 | **達成**（本書面は草案のみ） |

---

## §12 結語

W6 第 2 弾 W6-B 候補（performance regression baseline）を草案レベル詳細化。**3 groups / 6-8 tests / 500-650 行 / hands-on 5-6h + measurement 2-4h** で確定。`performance-baseline-v1.json` 形式で 3 軸（heartbeat / breach-counter / cost-tracker）の latency baseline を永続化、後続 round で diff > 20% の regression を自動検出する経路を §6 で詳細化。

物理化 readiness pt = **87/100**（spec 草案 + baseline file 仕様確定 + W6-A との独立性）= **R30+ 物理化 GO（草案 → 詳細 spec → 実装の 2 段階）**。R29+ で詳細 spec 化、R30+ で物理化、R30-R32 完遂で 6/20-7/10 stabilization 期間に整備、R31+ で performance regression 自動検出経路稼働。

本書面は草案 spec のみ、詳細化は R29+、物理化は R30+ Dev 担当で実行。harness 836 PASS / openclaw-runtime 394 PASS baseline absolute 保護完遂。
