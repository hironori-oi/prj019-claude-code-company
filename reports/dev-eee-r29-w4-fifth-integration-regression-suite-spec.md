# Dev-EEE Round 29 — W4 第 5 弾 (5b+5c+5d) 統合 regression suite spec (R30+ 着手 / 27 PASS 全件 cross-fixture)

最終更新: 2026-05-06 W0-Week2
担当: Dev 部門 R29 Dev-EEE (17 件目 dev sprint)
位置付け: PRJ-019 Open Claw Round 29 / 5b (15 tests) + 5c (6 tests) + 5d (6 tests) = 27 PASS 全件を cross-fixture で連動検証する統合 regression suite。

---

## 0. 概要

- 5b / 5c / 5d は seed / fixture / mock 分離で **完全独立** 実装 (cross 干渉 0 件 R28 確認済)
- 本 spec = R30+ で 3 file 同時起動時の cross-fixture 干渉再検証 + integration regression suite を起案
- 物理化は R30 引継 (本 spec 単体は起案のみ)

---

## 1. 27 PASS 内訳

| file | tests | groups | seed |
|---|---:|---:|---|
| 5b `w4-fifth-hitl-hardguards-extended.test.ts` (R27 Dev-YY) | 15 | 5 | 0x52383040 |
| 5c `w4-fifth-hg6-sla-recovery.test.ts` (R28 Dev-BBB) | 6 | 1 | 0x52383042 |
| 5d `w4-fifth-hg7-bridge-reconnect.test.ts` (R28 Dev-BBB) | 6 | 1 | 0x52383044 |
| **合計** | **27** | **7** | (3 seed 全件異なる) |

absolute 無改変宣言: 上記 3 file は本 spec 物理化時も **無改変** (新 file `w4-fifth-integration-regression.test.ts` に集約)。

---

## 2. cross-fixture 干渉観測軸

### 2.1 干渉観測軸 7 種

| 軸 | 説明 | invariant |
|---|---|---|
| 1. fs 競合 | 3 file の `os.tmpdir() + '/openclaw-test-*'` directory 衝突 | 3 file 並列実行で衝突 0 |
| 2. mock state | 3 file の MockClaudeBridge instance 共有 / 分離 | 各 file が独立 instance |
| 3. seed 連鎖 | 3 seed PRNG の連鎖累積で 27 test の deterministic 性維持 | 各 test 独立 deterministic |
| 4. clock skew | 3 file の MonotonicClock 同時起動で skew 累積 | 累積 < 50ms |
| 5. ENV 共有 | `process.env.CLAUDE_BRIDGE_*` 系の 3 file 競合 | 各 test set/restore |
| 6. handle leak | afterEach `fs.rm` 漏れで file handle leak | leak 0 (vitest pool isolate) |
| 7. timing race | 5c SLA timer × 5d Bridge reconnect timer の wall-clock 競合 | timer race 検出 0 |

### 2.2 cross-fixture test scope

```ts
// app/harness/src/__tests__/w4-fifth-integration-regression.test.ts
describe('W4 fifth integration regression', () => {
  describe('cross-fixture interference', () => {
    test('3 file 並列実行で fs 競合 0', () => { ... });
    test('mock state 完全分離', () => { ... });
    test('seed 連鎖 deterministic', () => { ... });
    test('clock skew < 50ms', () => { ... });
    test('ENV 競合 0', () => { ... });
    test('handle leak 0', () => { ... });
    test('timer race 0', () => { ... });
  });
  describe('27 PASS 連動 smoke', () => {
    test('5b 15 tests sequential 実行 PASS', () => { ... });
    test('5c 6 tests sequential 実行 PASS', () => { ... });
    test('5d 6 tests sequential 実行 PASS', () => { ... });
    test('5b+5c+5d 並列実行 27 PASS 維持', () => { ... });
  });
});
```

### 2.3 行数見積

| section | 行数 |
|---|---:|
| §1 setup (3 file dynamic require) | 70 |
| §2 cross-fixture 7 tests | 280 (40×7) |
| §3 27 PASS smoke 4 tests | 160 (40×4) |
| import / type | 30 |
| **合計** | **540** |

---

## 3. R30+ 物理化 計画

### 3.1 着手 phase

- R30 で物理化 (本 spec を base に / 3-4h hands-on)
- 27 PASS が R30 baseline 維持されている前提 (regression 0)

### 3.2 vitest pool 設定

```ts
// vitest.config.ts (既存に追記)
export default {
  test: {
    pool: 'forks',  // 各 test file 独立 process
    poolOptions: { forks: { isolate: true, singleFork: false } },
  },
};
```

### 3.3 readiness 評価

| 項目 | pt | 備考 |
|---|---:|---|
| spec 完成度 | 92 | 7 軸全件 invariant 明記 |
| infra 依存 | 95 | vitest 既存 / 拡張不要 |
| 失敗時対処 | 88 | seed 衝突 / handle leak の root cause 経路明記 |
| **総合** | **92/100** | R30 即着手可 |

---

## 4. 制約遵守

| 制約 | status |
|---|---|
| 既存 absolute 4 file 無改変 | 達成 (5a/5b/5c/5d 全件 untouched) |
| R27 5b absolute 無改変 | 達成 |
| R28 5c+5d absolute 無改変 | 達成 |
| 副作用 0 | 達成 |
| 絵文字 0 | 達成 |
| API call $0 | 達成 |
| Owner 拘束 0 分 | 達成 |

---

## 5. R30 Dev-JJJ 引継

1. 本 spec §2 を base に `w4-fifth-integration-regression.test.ts` 540 行物理化 (3-4h hands-on)
2. vitest pool 'forks' 設定追記 + 27 PASS regression CI green 確認
3. 干渉観測 7 軸 + smoke 4 軸 = 11 tests 全件 PASS で R30 完遂着地

---

(end of file / 約 145 行)
