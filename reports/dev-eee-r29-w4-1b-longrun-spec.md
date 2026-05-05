# Dev-EEE Round 29 — W4 1B longrun spec (12-18h wallclock / breach-counter overflow / mulberry32 distribution / MonotonicClock skew)

最終更新: 2026-05-06 W0-Week2
担当: Dev 部門 R29 Dev-EEE (17 件目 dev sprint)
位置付け: PRJ-019 Open Claw Round 29 9 並列の 9 軸目 (Dev) / 公開後 30day 監視向け継続改善 / R28 Dev-BBB scope 圧縮判断 = 1B longrun (12-18h wallclock) は R30+ scheduled CI に引継明示 を物理 spec 化。
本書 role: 1B longrun test scenario の **spec のみ起案** (R30+ 物理化前提) / 4 条件 (events / breach overflow / mulberry32 distribution / MonotonicClock skew) / scheduled CI workflow yaml fragment 設計 / 既存 absolute file 全件無改変。

---

## 0. 概要

### 0.1 派生元

- R26 Dev-VV 5a: `phase2-w5-claude-bridge-integration-e2e.test.ts` (13 tests / 836 PASS baseline)
- R27 Dev-YY 5b: `w4-fifth-hitl-hardguards-extended.test.ts` (1031 行 / 15 tests / 5 groups)
- R27 Dev-AAA 起案 5c spec (HG-6 SLA recovery / readiness 89/100)
- R28 Dev-BBB 物理化: 5c (388 行 / 6 tests) + 5d (374 行 / 6 tests) → harness 836→876 PASS
- R28 引継 1: 1B longrun 物理化は scheduled CI に分離

### 0.2 本書 scope

- 1B longrun = **1 billion (10^9) events** を 12-18h wallclock で連続流入させ 4 条件 invariants を維持できるか検証する spec
- 物理 deploy 0 件 / 物理 test 実行 0 件 / API call $0 / Owner 拘束 0 分
- 4 条件: (a) breach-counter overflow / (b) mulberry32 PRNG distribution / (c) MonotonicClock skew accumulation / (d) memory growth bounded
- scheduled CI workflow `.github/workflows/w4-1b-longrun.yml` 手動 trigger only / production 影響 0

### 0.3 既存 absolute file 無改変宣言

| file | 行数 | 状態 |
|---|---:|---|
| `app/harness/src/__tests__/phase2-w5-claude-bridge-integration-e2e.test.ts` (5a) | 既存 | **無改変** |
| `app/harness/src/__tests__/w4-fifth-hitl-hardguards-extended.test.ts` (5b) | 1031 | **無改変** |
| `app/harness/src/__tests__/w4-fifth-hg6-sla-recovery.test.ts` (5c) | 388 | **無改変** |
| `app/harness/src/__tests__/w4-fifth-hg7-bridge-reconnect.test.ts` (5d) | 374 | **無改変** |

本 spec は新 file `app/harness/src/__tests__/w4-1b-longrun.test.ts` の起案のみ。

---

## 1. 4 条件 invariants 詳細

### 1.1 条件 (a) breach-counter overflow

**問題意識**: HG-6 SLA recovery で実装済 `breachCount: number` が 1B events scale で overflow しないか検証。

**実装現状** (5c absolute):
```ts
// w4-fifth-hg6-sla-recovery.test.ts L142
let breachCount = 0;
function onBreach(): void { breachCount += 1; }
```

JS Number は IEEE 754 double / safe integer は 2^53 - 1 = 9_007_199_254_740_991。1B (10^9) は `Number.MAX_SAFE_INTEGER` の 0.011% 程度のため理論上 overflow しないが、**累積的 floating point error の検証** が longrun 唯一の判定経路。

**test scenario**:
- T0: `breachCount = 0`
- T0+12h: 1B events 投入完遂 / 想定 breach rate 5% = 50M breach
- assert: `breachCount === 50_000_000 ± 1000` (mulberry32 seed 固定で deterministic / ±1000 は実装許容)
- assert: `Number.isSafeInteger(breachCount) === true`
- assert: `breachCount` を `BigInt` 経由 round-trip しても loss なし

**failure mode**:
- もし `+= 1` を `+= 1.0` 等の float 演算に置換した変更が R30+ 入った場合 → 2^24 = 16.7M event 以上で precision loss → 本 longrun で検出可

### 1.2 条件 (b) mulberry32 PRNG distribution

**問題意識**: 5c / 5d で使用中 mulberry32 seed (0x52383042 / 0x52383044) が 1B sample で uniform 分布を維持するか検証。

**実装** (5c L88-105 想定 absolute):
```ts
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

**test scenario**:
- 1B sample 投入 / 10 bucket histogram (`[0.0, 0.1)`, `[0.1, 0.2)`, ..., `[0.9, 1.0]`)
- 各 bucket 期待値: 100M ± 0.1% (= ±100K)
- chi-square test: `χ² = Σ((observed - expected)² / expected) < 21.67` (df=9, α=0.01)
- assert: 周期 (cycle length) >= 2^31 - 1 (mulberry32 known cycle)

**failure mode**:
- seed XOR mask で偏りが入る変更があれば histogram で即 detect

### 1.3 条件 (c) MonotonicClock skew accumulation

**問題意識**: HG-6 / HG-7 で `Date.now()` 代替の MonotonicClock を使用する場合、12-18h wallclock で skew が累積するか検証。

**実装想定** (R30+ 抽象化予定):
```ts
class MonotonicClock {
  private base = performance.now();
  private epoch = Date.now();
  now(): number { return this.epoch + (performance.now() - this.base); }
}
```

**test scenario**:
- T0: `MonotonicClock.now()` vs `Date.now()` delta 記録 (= delta_0)
- T0+1h, T0+6h, T0+12h, T0+18h: 同様 delta 記録
- assert: `|delta_18h - delta_0| < 100ms` (12-18h で 100ms 以内 skew = production 許容)
- assert: `MonotonicClock.now()` strict monotonic (前 sample より必ず増加)

**failure mode**:
- NTP step 補正 / wall clock 巻き戻し / leap second 等の OS 挙動が test を干渉する可能性 → CI runner の clock source を `CLOCK_MONOTONIC_RAW` に明示 pin 必須

### 1.4 条件 (d) memory growth bounded

**問題意識**: 1B event 投入で heap が線形増加すれば leak / 一定で頭打ちなら問題なし。

**test scenario**:
- T0+1h, T0+6h, T0+12h, T0+18h: `process.memoryUsage().heapUsed` snapshot
- assert: `heap_18h < heap_1h * 1.2` (= 20% 以内増加 / GC 揺らぎ許容)
- 50M event ごと `global.gc()` 強制呼出 (`--expose-gc` flag 必須)

**failure mode**:
- breach-counter 配列化 (history 全保持) 等の変更で線形 leak 発生 → 12h 時点で OOM 想定 → `Node --max-old-space-size=8192` で margin 確保

---

## 2. test 構造 (6-8 tests / 500-650 行 想定)

### 2.1 file 構造

```
app/harness/src/__tests__/w4-1b-longrun.test.ts
├── §1 setup (ENV gate / mulberry32 init / MonotonicClock init)
├── §2 group A: breach-counter overflow (2 tests)
│   ├── test A-1: 1B events / breach 5% / counter precision
│   └── test A-2: BigInt round-trip safety
├── §3 group B: mulberry32 distribution (2 tests)
│   ├── test B-1: 10 bucket histogram chi-square
│   └── test B-2: cycle length >= 2^31
├── §4 group C: MonotonicClock skew (2 tests)
│   ├── test C-1: 18h skew < 100ms
│   └── test C-2: strict monotonic
└── §5 group D: memory growth (2 tests)
    ├── test D-1: heap 1h vs 18h ratio < 1.2
    └── test D-2: global.gc() free 確認
```

### 2.2 ENV gate

```ts
const LONGRUN_FULL = process.env.LONGRUN_FULL === '1';
const LONGRUN_SCALE = Number(process.env.LONGRUN_SCALE ?? '1000');
// default 1000 events で smoke / LONGRUN_FULL=1 で 10^9 events
describe.runIf(LONGRUN_FULL)('1B longrun', () => { ... });
```

通常 `npx vitest run` では skip / scheduled CI のみ `LONGRUN_FULL=1` で実行。

### 2.3 行数見積

| section | 行数 |
|---|---:|
| §1 setup | 80 |
| §2 group A | 110 |
| §3 group B | 130 |
| §4 group C | 90 |
| §5 group D | 80 |
| import / type / helper | 50 |
| **合計** | **540 行** |

---

## 3. scheduled CI workflow

### 3.1 file path

`.github/workflows/w4-1b-longrun.yml`

### 3.2 yaml 内容 (案)

```yaml
name: W4 1B longrun (manual trigger only)

on:
  workflow_dispatch:
    inputs:
      scale:
        description: '1B = 1000000000 / smoke = 1000'
        required: true
        default: '1000000000'

jobs:
  longrun:
    runs-on: ubuntu-latest
    timeout-minutes: 1080  # 18h
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install
        working-directory: ./app/harness
        run: npm ci
      - name: Run longrun
        working-directory: ./app/harness
        env:
          LONGRUN_FULL: '1'
          LONGRUN_SCALE: ${{ github.event.inputs.scale }}
          NODE_OPTIONS: '--expose-gc --max-old-space-size=8192'
        run: npx vitest run __tests__/w4-1b-longrun.test.ts --reporter=verbose
      - name: Upload heap snapshots
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: heap-snapshots
          path: app/harness/.heap-*.json
```

### 3.3 production 影響 0 担保

- `on:` は `workflow_dispatch` のみ (push / PR / schedule trigger 全て無し)
- `timeout-minutes: 1080` で 18h 上限 hard cap
- secrets 不要 (in-process mock / API call $0)
- artifact retention default 90 日 / heap snapshot は debug 用

---

## 4. R30+ 物理化 readiness

| 項目 | 評価 (100pt) | 備考 |
|---|---:|---|
| spec 完成度 | 95 | 4 条件 / 8 tests / yaml fragment 揃 |
| infra 依存 | 85 | GitHub Actions runner 18h timeout 動作未検証 |
| 失敗時対処計画 | 80 | OOM / clock skew / chi-square boundary の rollback 経路は R30 で詳細化 |
| Owner 承認経路 | 90 | scheduled CI の手動 trigger は CEO 承認 unnecessary 設計 |
| **総合** | **88/100** | R30 着手可 (R28 Dev-BBB 評価 89/100 と整合) |

---

## 5. 制約遵守

| 制約 | status |
|---|---|
| 既存 absolute 4 file 無改変 | 達成 (本 spec は新 file 起案のみ) |
| 副作用 0 | 達成 (spec only / 物理 deploy 0 / 物理 test 実行 0) |
| 絵文字 0 | 達成 |
| API call $0 | 達成 (yaml fragment は提案のみ / push 0) |
| Owner 拘束 0 分 | 達成 (本 spec は dev round 内完結) |

---

## 6. R30 Dev-JJJ 引継

1. 本 spec §2 の 540 行を `w4-1b-longrun.test.ts` として物理化 (8 tests / 6-8h hands-on)
2. yaml fragment §3 を `.github/workflows/w4-1b-longrun.yml` として PR 起票 (CEO 承認後 push)
3. 初回 manual trigger は `LONGRUN_SCALE=1_000_000` (1M) で smoke 実行 → GREEN なら 1B 本番

---

(end of file / 約 290 行)
