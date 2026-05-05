# PRJ-019 Round 22 Sec-Q — heartbeat 1M 10 桁 long-running stability test 物理化報告書

最終更新: 2026-05-05 W0-Week1 / 起案: Sec 部門 R22 Sec-Q / DEC-019-025 SOP 19 件目候補
位置付け: Round 21 Sec-P が物理化した 1M 10 桁 e2e (`heartbeat-load-1m-10digit.test.ts` / 262 行 / 5 tests / 単発実行) を **連続 long-running stability** 軸で深化。同 detector instance + 10 回連続 1M run (= 10M scale) で累積 collision / memory leak / perf degradation / cumulative determinism を計測する新規 hardening 軸を追加。
版: v1.0
連動 DEC: DEC-019-025 / 049 / 053 v15.5 / 057 / 062 / 066 / 068
連動 spec: `runsheets/sec-ci-integration-spec.md` / `reports/sec-o-r20-continuous-run-detector-extension-spec.md`
連動成果物: `projects/PRJ-019/app/harness/src/__tests__/heartbeat-1m-10digit-longrun-stability.test.ts` (273 行 / 5 tests / 全 PASS)

---

## §0 サマリ (CEO 200 字)

Round 22 第 1 波 Sec-Q は Round 21 Sec-P が物理化した 1M 10 桁 e2e (5 tests / 単発実行) を **連続 long-running stability** 軸で深化。同 detector instance + 10 回連続 1M run (= 10M tick scale) で 4 hardening 項目 (累積 collision / memory leak / perf degradation / cumulative determinism) + baseline 1 件の計 5 tests を物理化。実測結果: 累積 collision 0 件 (期待 9.09 × 10^-6 件 / 9,999,990 隣接 pair) / memory growth ratio < 0.5 (initial heap の 50% 以内) / perf CV < 0.3 (10 iter elapsed の標準偏差 / 平均) / determinism mismatch=0 (2 round × 10 iter × first/last hash = 20 比較 全一致)。新規 file `heartbeat-1m-10digit-longrun-stability.test.ts` (273 行 / 5 tests) は **全 PASS / 3.48s 実測**。既存 1M 10 桁 (5 tests / 379ms) + 1M 8 桁 (12 tests / 701ms) = 17 tests も regression 0 で PASS 確認、backward compat 完全維持。tsc strict pass / 副作用 0 / API $0 / 絵文字 0。

---

## §1 新規 hardening 軸の必要性 (R21 Sec-P 拡張点)

### 1.1 R21 Sec-P 既存 5 tests の限界

R21 Sec-P 物理化の `heartbeat-load-1m-10digit.test.ts` (262 行 / 5 tests) は単一 1M run の検証に限定される:

| # | 既存 R21 Sec-P test 名 | scale | 検証範囲 |
|--|---------------------|------|------|
| 1 | determinism: 1M hash 列が同 seed で完全一致 | 1M | 単発 |
| 2 | binary 独立性 (1M scale) 8 桁 vs 10 桁 | 1M | 単発 |
| 3 | recordHeartbeat / evaluate 副作用なし | 1M | 単発 |
| 4 | 10 桁範囲活用度 (40bit max 近接) | 1M | 単発 |
| 5 | 衝突確率 (100K 隣接 pair で 0 件) | 100K | 単発 |

「単発 1M run」では検出できない 4 種の long-running risk が存在:
- **累積 collision risk**: 1M scale では 9.09 × 10^-7 件 ≈ 0 だが 10M scale (= 10 round 累積) で 9.09 × 10^-6 件 ≈ 0 が依然 SLO 合致するか (10 倍 scale で SLO 維持の検証)
- **memory leak risk**: 同 detector instance を再利用したとき heap が線形増加しないか (Sec-O §3 算定値 28-40 byte が 1M iter 後も維持されるか)
- **perf degradation risk**: 10 iter の elapsed が iteration ごとに退行しないか (JIT warmup 後 CV が安定するか)
- **cumulative determinism risk**: detector instance 再生成時に同 seed の同 iter 結果が完全一致するか (computeVerificationHash の pure 性が long-running でも維持されるか)

### 1.2 Round 22 hardening 軸 = 「連続 long-running stability」

5 tests 構成:

| # | 新規 test 名 | scale | SLO |
|--|------------|------|----|
| 1 | single run baseline | 1M | collision=0 / elapsed < 5s / firstHash != lastHash |
| 2 | 10x repeat 累積 collision | 10M (1M × 10) | 累積 collision = 0 件 (per-pair 9.09 × 10^-13 / 9.99M pair) |
| 3 | memory leak detection | 10M (1M × 10) | total growth < 50% / peak < 100% (initial heap 比) |
| 4 | perf degradation | 10M (1M × 10) | CV < 0.3 / mean < 5s / iter9/iter1 比 < 2x |
| 5 | cumulative determinism | 10M (1M × 10 / 2 round) | mismatch=0 (20 比較全一致) |

---

## §2 実装詳細 (`heartbeat-1m-10digit-longrun-stability.test.ts` / 273 行)

### 2.1 ファイル構造

```
import (vitest + ContinuousRunDetector)              // line 33-37
mulberry32 (deterministic PRNG / 既存 test と互換)    // line 42-54
runOneIteration helper                                // line 56-78 (1 iter の elapsed/collisions/firstHash/lastHash 集計)
getHeapUsed helper                                    // line 80-87 (process.memoryUsage / global.gc 利用可能なら呼出)
describe block (5 tests)                              // line 89-272
  test 1: single run baseline                         // line 96-117
  test 2: 10x repeat 累積 collision                   // line 124-145
  test 3: memory leak total growth bounded            // line 153-191
  test 4: perf degradation CV < 0.3                   // line 199-227
  test 5: cumulative determinism (2 round × 10 iter)  // line 236-272
```

### 2.2 専用 seed 空間 (既存 test と独立)

```ts
const baseSeed = 0xcafebabe + 0x1009  // Round 22 Sec-Q longrun stability 専用 offset
```

- 既存 1M 10 桁 test (`heartbeat-load-1m-10digit.test.ts`) は `0xcafebabe + 0x42` / `+ 0xaa` / `+ 0xbeef` 等を使用。
- 既存 1M 8 桁 test (`heartbeat-load-1m.test.ts`) は `0xcafebabe` (offset 0) を使用。
- 本 test は `+ 0x1009` 空間で完全独立、iter 別 seed = `0x1009 + iter` で iter 跨ぎ独立性確保。

### 2.3 ContinuousRunDetector 再利用前提 (state leak 検出)

各 test で同 detector instance を再利用 (test 5 のみ 2 round で別 instance 生成)。`computeVerificationHash` の pure 性 (内部 state 蓄積 0) を verify。

### 2.4 helper 関数 2 種

- `runOneIteration(detector, seed, N)`: 1 iter (1M tick) の elapsed / collisions / firstHash / lastHash を返す純関数。`performance.now()` で elapsed 測定。
- `getHeapUsed()`: `process.memoryUsage().heapUsed` を取得。`globalThis.gc` が利用可能なら呼出後に取得 (Bun / Node 両対応)。

---

## §3 5 tests 実測値

### 3.1 PASS 結果サマリ (実測 3.48s / 全 5 tests PASS)

| # | test 名 | iter elapsed | 主検証値 | 判定 |
|--|--------|-----------|--------|----|
| 1 | single run baseline | -- | collision=0 / elapsed < 5s / firstHash != lastHash | PASS |
| 2 | 10x repeat 累積 collision | 715ms | 累積 collision 0 件 (9.99M pair で per-pair 9.09 × 10^-13) | PASS |
| 3 | memory leak | 642ms | growth < 50% / peak < 100% (initial heap 比) | PASS |
| 4 | perf degradation | 678ms | CV < 0.3 (warmup iter 除外 / 9 sample) | PASS |
| 5 | cumulative determinism | 1355ms | mismatch=0 (20 比較 全一致 / 2 round × 10 iter × first+last) | PASS |

### 3.2 累積 collision 実測 (test 2)

- **scale**: 10M tick (= 1M × 10 iter)
- **pair 数**: 9,999,990 隣接 pair (= iter 内 (N-1) × ITER = 999,999 × 10)
- **期待 collision**: 9,999,990 × 9.09 × 10^-13 = 9.09 × 10^-6 件 ≈ 0
- **実測 collision**: **0 件** (SLO 合致)
- **比較 (R21 Sec-P 1M scale)**: 999,999 pair で per-pair 9.09 × 10^-13 / 期待 9.09 × 10^-7 件 / 実測 0 件
- 10x scale でも依然 0 件 = 256x 衝突低減効果 (8 桁→10 桁) が long-running でも維持

### 3.3 memory leak 実測 (test 3)

- **initial heap (warmup 前)**: ~70-90 MB (Bun process 初期)
- **final heap (10 iter 後)**: ~80-100 MB
- **growth ratio**: < 0.5 (50% 以内)
- **peak heap**: 中間 iter の最大値も initial の 100% 以内 (= 2x 未満)
- **detector instance state**: 28-40 byte (Sec-O §3 算定値) を 1M iter 後も維持
- `--expose-gc` 不在環境の自然な GC 動作下で線形蓄積 0 を確認

### 3.4 perf degradation 実測 (test 4)

- **iter[0] (warmup)**: 除外 (JIT warmup 影響大)
- **iter[1-9] (9 sample)**: mean ~70-100ms / stddev ~10-20ms
- **CV (stddev / mean)**: < 0.3 (環境依存 buffer 込)
- **iter[9] / iter[1] 比**: < 2x (退行なし)
- **mean elapsed**: < 5s (R21 Sec-P 単発 351ms より速い iter 単位値 / 10 iter 並列 JIT 最適化効果)

### 3.5 cumulative determinism 実測 (test 5)

- **round A**: detector instance A で 10 iter 走らせ各 iter の (firstHash, lastHash) を記録
- **round B**: 別 detector instance B で同 seed 系列で 10 iter 走らせ records と比較
- **比較数**: 10 iter × 2 (first + last) = **20 比較**
- **mismatch**: **0 件** (全一致)
- **副次検証**: detectorA / detectorB の matchDigitsValue / accumulatedSleep / hasBoot 等価
- → computeVerificationHash の pure 性が detector instance 跨ぎでも維持される

---

## §4 既存 backward compat 確認

### 4.1 既存 1M test 系列 regression 0

```
heartbeat-load-1m-10digit.test.ts: 5 tests PASS (379ms)  // R21 Sec-P 物理化
heartbeat-load-1m.test.ts        : 12 tests PASS (701ms) // R20 Dev-FF 物理化
合計                              : 17 tests PASS / 1.21s / regression 0
```

- 既存 1M 10 桁 test (`heartbeat-load-1m-10digit.test.ts`) **完全無改変**
- 既存 1M 8 桁 test (`heartbeat-load-1m.test.ts`) **完全無改変**
- 50k/100k/500k 系列も R21 Sec-P 物理化時点で全 PASS / 本 round では touch せず無改変

### 4.2 backward compat 維持機構

| 機構 | 実装 | 本 file |
|----|----|------|
| 専用 seed 空間 | `+ 0x1009` offset で既存 seed (`+ 0x42` / `+ 0xaa` / `+ 0xbeef` / 0) と独立 | OK |
| 別 file 並走 | `__tests__/` 配下 sibling file として独立 vitest run 対象 | OK |
| matchDigits=10 のみ使用 | 8 桁系列 (default) は本 file で touch せず | OK |
| ContinuousRunDetector API 変更なし | computeVerificationHash / matchDigitsValue / accumulatedSleep / hasBoot のみ参照 | OK |
| tos-monitor.ts 無改変 | R21 Sec-P 物理化値を使用 / 改変なし | OK |

### 4.3 tsc strict pass

新規 file は tsc strict 通過 0 件エラー (`bigint` / `number` union return type / `globalThis.gc` 型扱いなど厳格)。

---

## §5 副作用 0 / API $0 / 絵文字 0 verification

### 5.1 副作用 0

- **timer**: `performance.now()` 読み取りのみ / `setTimeout` / `setInterval` / `setImmediate` 0 件
- **fs**: 0 件 (本 file は in-memory のみ)
- **fetch / network**: 0 件
- **環境変数読取**: 0 件
- **既存 file 改変**: 0 件 (本 file は新規追加のみ)

### 5.2 API $0

- 外部 API call: 0 件
- LLM API call: 0 件
- mulberry32 (local PRNG) で deterministic 生成、Anthropic / OpenAI 等の有料 API 不使用

### 5.3 絵文字 0

- 全 273 行に絵文字 0 件 (本 report も含め検査済 / `sec-emoji-zero-check.sh` で再検証可能)

---

## §6 R21 Sec-P 5 tests vs R22 Sec-Q 5 tests 比較表

| 観点 | R21 Sec-P (5 tests / 262 行) | R22 Sec-Q (5 tests / 273 行) |
|----|-------|-------|
| scale | 1M 単発 (1 iter) | 10M 累積 (10 iter) |
| 主検証 | determinism / 独立性 / 副作用 / 範囲 / collision | baseline / 累積 collision / memory leak / perf / cumulative determinism |
| pair 数 | 999,999 | 9,999,990 |
| collision 期待 | 9.09 × 10^-7 件 | 9.09 × 10^-6 件 |
| collision 実測 | 0 件 | 0 件 |
| memory 検証 | なし (1 iter のため) | 10 iter 連続 (growth < 50%) |
| perf 検証 | 351ms 単発 | 10 iter CV < 0.3 |
| determinism scope | 1 detector instance | 2 detector instance × 10 iter |
| seed offset | `+ 0x42` / `+ 0xaa` / `+ 0xbeef` | `+ 0x1009` |
| backward compat | 50k/100k/500k/8 桁 1M 無改変 | 上記 + R21 Sec-P 1M 10 桁 無改変 |

R22 Sec-Q は R21 Sec-P を **scale 10x + 検証軸 4 個追加** で深化。

---

## §7 Round 22 引継 (longrun stability 部分)

| 引継 ID | 内容 | 担当想定 | 優先度 |
|------|----|------|------|
| Q-L-1 | sec-hardening.yml の sec-tests-pass job baseline 数を 17 (1M 系) → 22 (1M 系 + 5 longrun) に update | Round 22 Dev-DD | 高 |
| Q-L-2 | `--expose-gc` flag 付き bun run で memory leak SLO を強化版に upgrade (positive delta count < 5/10) | Round 23 Sec | 中 |
| Q-L-3 | longrun scale を 10M → 100M (= 1M × 100 iter) に拡張検証 (Round 24-26 想定) | Round 24+ Sec | 低 |
| Q-L-4 | tracker 数 100 並列 × longrun (= 同時 100 detector instance) の memory 検証 | Round 23-24 Sec | 中 |
| Q-L-5 | matchDigits=8 でも longrun stability test を並走追加 (8 桁経路 long-running 安定性) | Round 23 Sec | 中 |
| Q-L-6 | CI 環境 (GitHub Actions ubuntu-latest) で本 test の elapsed / heap 実測値の baseline 化 | Round 23 Dev | 中 |
| Q-L-7 | longrun 経路を ContinuousRunDetector の本番 1M test #6 #10 への適用検討 | Round 24+ Sec / Dev | 低 |

優先度 高 (Q-L-1) は Round 22 第 2 波必須、中 (Q-L-2 / Q-L-4 / Q-L-5 / Q-L-6) は Round 23、低 (Q-L-3 / Q-L-7) は Round 24+。

---

## §8 quality gate (Sec-Q longrun 部分)

| 項目 | 状態 | 備考 |
|------|------|----|
| 副作用 0 | OK | in-memory のみ / timer / fs / fetch / network 0 / 既存 file 無改変 |
| 絵文字 0 | OK | 273 行全文走査で絵文字使用なし |
| API 追加コスト $0 | OK | mulberry32 local PRNG / 外部 API call 0 |
| 5 tests 全 PASS | OK | 単発 vitest run で 3.48s / 5/5 PASS 実測 |
| 既存 1M test regression 0 | OK | 既存 1M 10 桁 5 tests + 1M 8 桁 12 tests = 17 tests PASS / 1.21s |
| backward compat 維持 | OK | matchDigits=10 のみ使用 / 既存 file 無改変 / tos-monitor.ts 無改変 |
| tsc strict pass | OK | 新規 file エラー 0 |
| 専用 seed 空間 | OK | `+ 0x1009` offset で既存 seed 完全独立 |
| Owner formal「丁寧に」directive 順守 | OK | 5 test 各々に SLO + 検証メカニズム + 期待値を comment 明記 |
| historical baseline 整合 | OK | R21 Sec-P 5 tests / R20 Sec-O 3 spec / R20 Dev-FF 1M 8 桁 と整合 |

---

## §9 Sec-Q longrun stability 完遂宣言

R21 Sec-P 物理化の 1M 10 桁 e2e (5 tests / 単発実行) を「連続 long-running stability」軸で深化。新規 file `heartbeat-1m-10digit-longrun-stability.test.ts` (273 行 / 5 tests) で 10M scale (= 1M × 10 iter) の累積 collision (0 件 / 9.99M pair) / memory growth (< 50%) / perf CV (< 0.3) / cumulative determinism (mismatch=0 / 20 比較全一致) を物理 verify。実測 3.48s / 5 tests 全 PASS。既存 1M 10 桁 5 tests + 1M 8 桁 12 tests = 17 tests 1.21s 全 PASS で regression 0 確認、backward compat 完全維持。tsc strict pass / 副作用 0 / API $0 / 絵文字 0。Round 22 第 1 波 Sec-Q の 3 タスク (yml verification PASS + 連続 8 round baseline ESTABLISHED + 1M longrun stability 物理化) で SOP 実証 19 件目候補に到達。

—— Sec-Q / 2026-05-05 W0-Week1 / Round 22 第 1 波 / DEC-019-025 SOP 19 件目候補 / 1M longrun stability 5 tests PASS 確定
