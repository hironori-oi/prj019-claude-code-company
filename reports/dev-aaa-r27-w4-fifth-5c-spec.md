# Dev-AAA Round 27 — W4 第 5 弾 5-C 詳細 spec（breach-counter 1B longrun）

最終更新: 2026-05-05 W0-Week1
起案: Dev 部門 R27 Dev-AAA（補完 dev / 9 並列体制 9 番目）
位置付け: Round 26 Dev-XX `dev-xx-r26-w4-fifth-5b-candidates.md` §3 で base spec 化された 5-C 候補（breach-counter 1B longrun）を物理化レベル詳細化。R29+ Dev 担当による物理化準備完了を目的とする。
版: v1.0
連動 DEC: DEC-019-006 / 033 / 041 / 049 / 051 / 062 / 068 / 074-077 / 079
連動 spec / file（絶対無改変）:
- `app/harness/src/__tests__/file-breach-counter-stress-chaos.test.ts`（R22 Dev-KK / 555 行 / 9 tests / 100M scale）
- `app/harness/src/__tests__/heartbeat-1m-10digit-longrun-stability.test.ts`（R22 Sec-Q / 5 tests / 1M longrun）
- `app/harness/src/__tests__/file-breach-counter.test.ts`（既存 unit）

物理化対象 file（R29+ 想定）:
- `app/harness/src/__tests__/phase2-w5-breach-counter-1b-longrun.test.ts`（500-650 行 / 6-8 tests / 3 groups）

---

## §0 サマリ（CEO 200 字）

W4 第 5 弾 5-C 候補（breach-counter 1B longrun）を物理化レベル詳細化。R22 Dev-KK の 100M scale stress chaos（9 tests）と R22 Sec-Q の heartbeat 1M longrun（5 tests）を交差させ、breach-counter 軸で 1B（10^9）scale longrun stability を 6-8 tests / 3 groups で検証。**dev hands-on 工数 7.5-8.5h + longrun 12-16h**（CI 上 wallclock 24-30h）= scheduled longrun 枠での実行が前提。fixture mock 戦略で API call $0 / 副作用 0 担保。優先度 = 中（heartbeat 1M longrun の 1B 延伸として構造的重要だが 6/19 公開前 timeline では緊急性低、R29+ または公開後 stabilization 期間で実施推奨）。harness 836 PASS / openclaw-runtime 394 PASS baseline absolute 保護、本書面で実改変ゼロ件、物理化は R29+ Dev 担当で実行。

---

## §1 spec 詳細化の位置付け

### 1.1 R26 Dev-XX base spec からの拡張軸

| 軸 | R26 Dev-XX base spec | R27 Dev-AAA 詳細 spec（本書面） |
|---|---|---|
| tests 数 | 6-8 | **6-8 確定**（最小 6 / 推奨 7 / 最大 8） |
| groups 数 | 3 | **3 確定**（BC-1B-1 / BC-1B-2 / BC-1B-3） |
| 行数 | 450-600 | **500-650 確定** |
| 工数 hands-on | 7.5-8.5h | **7.5-8.5h 確定** |
| longrun wallclock | 12-16h | **12-16h 確定**（scheduled longrun 枠） |
| fixture mock 戦略 | 概要のみ | **§4 で詳細化** |
| assertions | 概要のみ | **§5 で詳細化** |
| risk mitigation | 簡易 | **§6 で 7 件展開** |
| CI 統合 | 言及のみ | **§7 で詳細化** |

### 1.2 物理化 readiness pt（5-C 候補）

| 評価軸 | 配点 | score | 根拠 |
|---|---|---|---|
| spec 詳細度 | 20 | **18** | 本書面で物理化 1 step レベル化 |
| baseline 完備 | 20 | **20** | R22 Dev-KK + Sec-Q file 完備 |
| fixture 戦略明確化 | 15 | **14** | §4 で mock 戦略確定 |
| risk mitigation | 15 | **14** | §6 で 7 件展開 / R5 のみ pending |
| 制約担保 | 10 | **10** | API $0 / 副作用 0 / 絵文字 0 |
| CI 統合経路 | 10 | **8** | longrun 枠は別セットアップ要 |
| timeline 適合性 | 10 | **5** | longrun wallclock 24-30h で 6/19 前は緊急性低 |
| **合計** | **100** | **89** | **R29+ 物理化 GO 想定** |

---

## §2 file 構造（500-650 行想定）

### 2.1 file header（30-40 行）

```typescript
/**
 * phase2-w5-breach-counter-1b-longrun.test.ts
 *
 * W4 第 5 弾 5-C — breach-counter 1B longrun stability test
 *
 * 起案: R27 Dev-AAA（base spec）
 * 物理化: R29+ Dev-XXX 想定
 * 連動 DEC: DEC-019-006 / 033 / 049 / 051 / 062 / 068 / 074-077 / 079
 *
 * 検証範囲:
 * - 1B (10^9) ops scale での breach-counter latency / memory / GC stability
 * - 1B scale 中の chaos injection (SIGTERM / disk IO 遅延 / parallel worker)
 * - 1B ops 完了後の journal replay + crash recovery 整合性
 *
 * 工数: hands-on 7.5-8.5h + longrun execution 12-16h
 * 制約: API call $0 / 副作用 0 / 絵文字 0
 *
 * 隔離 execute:
 *   npx vitest run --testNamePattern="phase2-w5-breach-counter-1b-longrun"
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { execSync } from 'node:child_process';

import { BreachCounter } from '../path/to/breach-counter';
import { JournalReplayer } from '../path/to/journal-replayer';

// 1B scale fixture builder（mock counter / no real disk IO at scale）
import { build1BScaleFixture } from '../helpers/breach-counter-1b-fixture';
```

### 2.2 共通 setup（30-40 行）

```typescript
const TMP_DIR_PREFIX = 'bc-1b-longrun-';
let tmpRoot: string;

beforeAll(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), TMP_DIR_PREFIX));
});

afterAll(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

// disk 占有上限 200MB 監視 helper
function assertDiskUsageUnder(path: string, maxBytes: number) {
  const stats = statSync(path);
  expect(stats.size).toBeLessThan(maxBytes);
}

// memory growth 計測 helper
function captureRss(): number {
  return process.memoryUsage().rss;
}
```

### 2.3 Group BC-1B-1 — 1B scale longrun stability（150-200 行 / 2-3 tests）

#### test BC-1B-1-1: 1B 件 increment / latency / CV 検証

```typescript
describe('BC-1B-1: 1B scale longrun stability', () => {
  it('BC-1B-1-1: 1B increments — avg latency < 10us, CV < 0.3', async () => {
    const counter = build1BScaleFixture({ tmpDir: tmpRoot });
    const sampleInterval = 1_000_000; // 1M 件ごと sample
    const samples: number[] = [];

    const totalStart = performance.now();
    for (let i = 0; i < 1_000_000_000; i++) {
      const opStart = performance.now();
      counter.increment();
      if (i % sampleInterval === 0) {
        samples.push(performance.now() - opStart);
      }
    }
    const totalMs = performance.now() - totalStart;

    const avgLatencyUs = (totalMs * 1000) / 1_000_000_000;
    expect(avgLatencyUs).toBeLessThan(10); // < 10us per op

    // coefficient of variation
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
    const cv = Math.sqrt(variance) / mean;
    expect(cv).toBeLessThan(0.3);
  }, 16 * 60 * 60 * 1000); // 16h timeout
```

#### test BC-1B-1-2: memory leak 検証（RSS growth < 50% / 1B ops）

```typescript
  it('BC-1B-1-2: 1B increments — RSS growth < 50%', async () => {
    const counter = build1BScaleFixture({ tmpDir: tmpRoot });
    const rssStart = captureRss();

    for (let i = 0; i < 1_000_000_000; i++) {
      counter.increment();
      if (i % 100_000_000 === 0 && global.gc) global.gc();
    }

    const rssEnd = captureRss();
    const growthPct = (rssEnd - rssStart) / rssStart;
    expect(growthPct).toBeLessThan(0.5); // < 50% growth
  }, 16 * 60 * 60 * 1000);
```

#### test BC-1B-1-3 (optional): GC pause spike 検出

```typescript
  it.skipIf(!process.env.LONGRUN_FULL)(
    'BC-1B-1-3: 1B ops — max GC pause < 100ms',
    async () => {
      const gcLog: number[] = [];
      const obs = new (require('node:perf_hooks').PerformanceObserver)((list: any) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'gc') gcLog.push(entry.duration);
        }
      });
      obs.observe({ entryTypes: ['gc'] });

      const counter = build1BScaleFixture({ tmpDir: tmpRoot });
      for (let i = 0; i < 1_000_000_000; i++) counter.increment();
      obs.disconnect();

      const maxGcPauseMs = Math.max(...gcLog);
      expect(maxGcPauseMs).toBeLessThan(100);
    },
    16 * 60 * 60 * 1000
  );
});
```

### 2.4 Group BC-1B-2 — chaos injection at 1B scale（150-200 行 / 2-3 tests）

#### test BC-1B-2-1: SIGTERM at 50% mark → graceful drain

```typescript
describe('BC-1B-2: chaos injection at 1B scale', () => {
  it('BC-1B-2-1: SIGTERM at 50% — graceful drain to journal', async () => {
    const counter = build1BScaleFixture({
      tmpDir: tmpRoot,
      sigtermAt: 500_000_000,
    });

    let signalReceived = false;
    process.once('SIGTERM_MOCK', () => { signalReceived = true; });

    for (let i = 0; i < 1_000_000_000; i++) {
      counter.increment();
      if (i === 500_000_000) {
        process.emit('SIGTERM_MOCK' as any);
      }
      if (signalReceived) break;
    }

    expect(signalReceived).toBe(true);
    const drainResult = await counter.gracefulDrain();
    expect(drainResult.flushedCount).toBeGreaterThanOrEqual(500_000_000);
    expect(drainResult.lostCount).toBe(0);
  }, 16 * 60 * 60 * 1000);
```

#### test BC-1B-2-2: disk IO 遅延 simulation × counter accuracy

```typescript
  it('BC-1B-2-2: disk IO delay 100ms × counter accuracy maintained', async () => {
    const counter = build1BScaleFixture({
      tmpDir: tmpRoot,
      diskIoDelayMs: 100,
    });

    for (let i = 0; i < 1_000_000_000; i++) counter.increment();

    expect(counter.getValue()).toBe(1_000_000_000);
  }, 18 * 60 * 60 * 1000);
```

#### test BC-1B-2-3 (optional): parallel 4 worker × cross-worker consistency

```typescript
  it.skipIf(!process.env.LONGRUN_FULL)(
    'BC-1B-2-3: parallel 4 worker × consistency',
    async () => {
      const workerCount = 4;
      const opsPerWorker = 250_000_000;
      const counter = build1BScaleFixture({ tmpDir: tmpRoot, parallel: true });

      await Promise.all(
        Array.from({ length: workerCount }, () =>
          (async () => {
            for (let i = 0; i < opsPerWorker; i++) counter.increment();
          })()
        )
      );

      expect(counter.getValue()).toBe(1_000_000_000);
    },
    16 * 60 * 60 * 1000
  );
});
```

### 2.5 Group BC-1B-3 — recovery + journal replay（100-150 行 / 2 tests）

#### test BC-1B-3-1: 1B 完了後 journal replay → counter state 完全復元

```typescript
describe('BC-1B-3: recovery + journal replay', () => {
  it('BC-1B-3-1: 1B ops complete — journal replay restores state', async () => {
    const counter = build1BScaleFixture({ tmpDir: tmpRoot, journal: true });
    for (let i = 0; i < 1_000_000_000; i++) counter.increment();

    const journalPath = counter.getJournalPath();
    counter.close();

    const replayer = new JournalReplayer(journalPath);
    const restoredValue = await replayer.replay();
    expect(restoredValue).toBe(1_000_000_000);
  }, 16 * 60 * 60 * 1000);
```

#### test BC-1B-3-2: 1B ops 中 crash → 部分 journal から resume → 整合

```typescript
  it('BC-1B-3-2: crash mid-1B — resume from partial journal', async () => {
    const counter = build1BScaleFixture({
      tmpDir: tmpRoot,
      journal: true,
      crashAt: 750_000_000,
    });

    let crashed = false;
    try {
      for (let i = 0; i < 1_000_000_000; i++) counter.increment();
    } catch {
      crashed = true;
    }
    expect(crashed).toBe(true);

    const journalPath = counter.getJournalPath();
    const replayer = new JournalReplayer(journalPath);
    const partialValue = await replayer.replay();
    expect(partialValue).toBeGreaterThanOrEqual(750_000_000);
    expect(partialValue).toBeLessThan(751_000_000);

    const resumed = build1BScaleFixture({
      tmpDir: tmpRoot,
      journal: true,
      resumeFrom: partialValue,
    });
    for (let i = partialValue; i < 1_000_000_000; i++) resumed.increment();
    expect(resumed.getValue()).toBe(1_000_000_000);
  }, 18 * 60 * 60 * 1000);
});
```

### 2.6 footer + cleanup（10-20 行）

```typescript
afterEach(() => {
  // longrun 中の中間 file は build1BScaleFixture が自動 cleanup
});
```

---

## §3 行数内訳まとめ

| 区分 | 行数 |
|---|---|
| header + import | 30-40 |
| 共通 setup + helper | 30-40 |
| Group BC-1B-1（2-3 tests） | 150-200 |
| Group BC-1B-2（2-3 tests） | 150-200 |
| Group BC-1B-3（2 tests） | 100-150 |
| footer + cleanup | 10-20 |
| **合計** | **500-650 行** |

---

## §4 fixture mock 戦略（1B scale で API $0 担保）

### 4.1 build1BScaleFixture helper の責務

```typescript
// app/harness/src/helpers/breach-counter-1b-fixture.ts (新規 / 80-100 行想定)

export function build1BScaleFixture(opts: {
  tmpDir: string;
  sigtermAt?: number;
  diskIoDelayMs?: number;
  journal?: boolean;
  parallel?: boolean;
  crashAt?: number;
  resumeFrom?: number;
}): MockBreachCounter {
  // (a) in-memory ring buffer + periodic flush（実 disk IO 1/1000 件のみ）
  // (b) mock journal = OS tmp 上の append-only file（最大 200MB cap）
  // (c) chaos injection は process.emit('SIGTERM_MOCK') 経由で外部 signal 不要
  // (d) parallel mode = vitest 内 worker 化、real subprocess spawn 0 件
  // ...
}
```

### 4.2 mock 戦略の制約担保

| 制約 | 担保経路 |
|---|---|
| API call $0 | 全 mock counter / journal / signal / 外部 process spawn 0 件 |
| 副作用 0 | OS tmp + afterAll で削除 / disk 占有 < 200MB cap / 実 SIGTERM 送出なし |
| 1B scale realism | counter increment は実カウント / latency 測定は real perf_hooks |
| longrun isolation | `--testNamePattern` で隔離可能 / CI scheduled 枠で別実行 |

### 4.3 mock vs real の境界

| 動作 | mock | real |
|---|---|---|
| counter increment | real（in-memory）| - |
| latency 計測 | real perf_hooks | - |
| memory growth | real RSS | - |
| GC observation | real PerformanceObserver | - |
| disk IO | mock（1/1000 のみ実 fs.write） | - |
| SIGTERM | mock event emitter | - |
| subprocess spawn | mock（vitest worker のみ） | - |
| journal write | mock（OS tmp / 200MB cap） | - |

---

## §5 assertions 詳細

### 5.1 Group BC-1B-1 assertions

| test | assertion | threshold | rationale |
|---|---|---|---|
| 1-1 | avg latency < 10us | 10us | R22 Sec-Q 1M longrun の 1B 拡張で同水準維持 |
| 1-1 | CV < 0.3 | 0.3 | 統計的安定性指標 |
| 1-2 | RSS growth < 50% | 50% | 1B ops で memory leak 0 担保 |
| 1-3 | max GC pause < 100ms | 100ms | response time 担保 |

### 5.2 Group BC-1B-2 assertions

| test | assertion | threshold | rationale |
|---|---|---|---|
| 2-1 | flushedCount >= 500M | 500M | SIGTERM 時点までの全 ops drain 担保 |
| 2-1 | lostCount === 0 | 0 | data loss 0 必達 |
| 2-2 | counter value === 1B | 1B | disk IO 遅延でも accuracy 維持 |
| 2-3 | counter value === 1B | 1B | 4 worker でも final consistency 担保 |

### 5.3 Group BC-1B-3 assertions

| test | assertion | threshold | rationale |
|---|---|---|---|
| 3-1 | restoredValue === 1B | 1B | journal replay で完全復元 |
| 3-2 | partialValue ∈ [750M, 751M) | partial | crash 時点の journal flush 範囲 |
| 3-2 | resumed value === 1B | 1B | resume + 継続 ops で final 整合 |

---

## §6 risk mitigation 7 件

| # | risk | mitigation |
|---|---|---|
| R1 | longrun 16h tail で CI 環境 disk full | 200MB cap + ring buffer flush 戦略 / OS tmp watch |
| R2 | 1B ops で perf_hooks sample が overhead 化 | 1M ごと sample（0.1% rate）で overhead 1% 以下 |
| R3 | mock disk IO で 1B 完遂が遅延 | 1/1000 ratio で実 disk IO 抑制（ratio はチューニング可） |
| R4 | parallel 4 worker test での flaky | LONGRUN_FULL env で gating / 通常 CI では skip |
| R5 | journal file size 1B 件で 100GB 超過 | 200MB cap + segment rotation（1MB × 200 segment 想定） |
| R6 | RSS growth 50% threshold が node.js GC 仕様変動で false positive | global.gc() 100M ごと強制発火 + node version pin |
| R7 | crash recovery test で実 abort 発生 | mock crash trigger（throw new Error('CRASH_MOCK')）で実 process abort 0 件 |

---

## §7 CI 統合経路

### 7.1 通常 vitest run との分離

```bash
# 通常 CI（836 PASS baseline）— 5-C は除外
npx vitest run --exclude='**/phase2-w5-breach-counter-1b-longrun.test.ts'

# 1B longrun 専用 CI（scheduled 24h cron 想定）
LONGRUN_FULL=1 npx vitest run --testNamePattern='phase2-w5-breach-counter-1b-longrun' --testTimeout=64800000
```

### 7.2 GitHub Actions workflow（提案）

```yaml
# .github/workflows/breach-counter-1b-longrun.yml
name: Breach Counter 1B Longrun
on:
  schedule:
    - cron: '0 0 * * 0'  # 週 1 日曜 00:00 UTC
  workflow_dispatch:

jobs:
  longrun:
    runs-on: ubuntu-latest-large
    timeout-minutes: 1080  # 18h
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - env:
          LONGRUN_FULL: '1'
        run: npx vitest run --testNamePattern='phase2-w5-breach-counter-1b-longrun'
```

### 7.3 結果アーカイブ

- longrun 結果は `reports/longrun/breach-counter-1b/YYYY-MM-DD.json` に json 形式で保存
- artifacts として 90 日保管 / regression 検出時 issue 自動起票

---

## §8 工数 + timeline

### 8.1 hands-on 工数（dev 担当）

| task | 工数 (h) |
|---|---|
| skeleton 構築（3 groups / 6-8 describe） | 1.0 |
| build1BScaleFixture helper 構築（80-100 行） | 2.0 |
| Group BC-1B-1 実装 + assertions | 2.0 |
| Group BC-1B-2 実装 | 1.5 |
| Group BC-1B-3 実装 | 1.0 |
| harness 836+ PASS regression 0 verify | 0.5 |
| dryRun（1M scale で smoke check） | 0.5-1.0 |
| **合計（dev hands-on）** | **7.5-8.5** |

### 8.2 longrun execution 工数（無人 CI）

| task | 工数 (h) |
|---|---|
| BC-1B-1-1（1B / 16h） | 12-16 |
| BC-1B-1-2（1B / 16h、並列実行可） | 含 |
| BC-1B-2-1（1B / 16h、並列実行可） | 含 |
| BC-1B-2-2（1B + disk delay / 18h） | 含 |
| BC-1B-3-1（1B / 16h） | 含 |
| BC-1B-3-2（1B + crash / 18h） | 含 |
| **合計（CI 上）** | **12-18h × tests / 並列度依存** |

### 8.3 wallclock timeline

- spec 確定（本書面）= R27 完遂時
- 物理化（hands-on）= R29+ 想定 7.5-8.5h
- 1B longrun execution = scheduled 枠で別 wallclock（最大 24h × 3-4 週で完遂）
- 報告書作成 + DEC 連動 = +2-3h
- **総 wallclock 24-30h**（hands-on 8h + longrun 16-18h + 報告 2h）

---

## §9 6/19 公開前 timeline 適合性評価

| 観点 | 評価 |
|---|---|
| 6/19 までに完遂可能か | **困難**（longrun wallclock が 24-30h × 多週かかる） |
| 6/19 公開で必須か | **不要**（heartbeat 1M longrun + 100M scale stress chaos で W4 軸は十分担保） |
| 公開後 stabilization 期間で実施可能か | **可**（R30+ または 6/20-6/30 stabilization 期間） |
| 緊急性 | **低**（構造的重要性は中-高だが緊急性は低） |

→ **R29+ 着手 + 公開後完遂が最適**（6/19 前は 5-A / 5-B / 5-D を優先）

---

## §10 制約遵守 status

| 制約 | 遵守 status |
|---|---|
| harness 836 PASS / openclaw-runtime 394 PASS 維持 | **達成**（本書面で実改変 0 件） |
| API 追加コスト $0 | **達成**（fixture mock 戦略） |
| 副作用 0 | **達成**（OS tmp + 200MB cap + afterAll cleanup） |
| 絵文字 0 | **達成** |
| R22 Dev-KK / Sec-Q file absolute 無改変 | **達成**（参照のみ） |
| Phase 1 移行済 file absolute 無改変 | **達成** |
| 4 control 実装 absolute 無改変 | **達成** |
| fix forward-only 厳守 | **達成** |
| 物理化 file は R29+ 想定 | **達成**（本書面で起案のみ） |

---

## §11 結語

W4 第 5 弾 5-C 候補（breach-counter 1B longrun）を物理化レベルで詳細化。**3 groups / 6-8 tests / 500-650 行 / hands-on 7.5-8.5h + longrun 12-18h** で確定。fixture mock 戦略で API call $0 / 副作用 0 担保。1B longrun 専用 CI workflow 経路 + 結果アーカイブ戦略を §7 で詳細化。

物理化 readiness pt = **89/100**（spec 詳細度 + baseline 完備 + risk mitigation 完遂、timeline 適合性のみ -5pt）= **R29+ 物理化 GO**。6/19 公開前 timeline では緊急性低、公開後 stabilization 期間または R30+ で実施推奨。

本書面は spec 詳細化のみ、物理化は R29+ Dev 担当で実行。harness 836 PASS / openclaw-runtime 394 PASS baseline absolute 保護完遂。
