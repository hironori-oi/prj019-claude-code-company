# PRJ-019 Round 20 Sec-O — ContinuousRunDetector 8 → 10 桁完全一致拡張 spec

最終更新: 2026-05-05 W0-Week1 / 起案: Sec 部門 R20 第 1 波 Sec-O / DEC-019-025 SOP 準拠
位置付け: 1M heartbeat load test 拡張 (`sec-o-r20-heartbeat-1m-feasibility.md` §6 / §8 / §9.2 ケース #6 #10) で要請される ContinuousRunDetector の completeness 桁拡張を spec 化。物理化は Round 21 Dev 後続。
版: v1.0
連動 spec: `sec-o-r20-heartbeat-1m-feasibility.md` / `sec-ci-integration-spec.md`

---

## §0 概要

Round 17 Dev-U / Round 18 Dev-Z / Round 19 Dev-CC で 50k / 100k / 500k tick の 8 桁完全一致が確認済の `ContinuousRunDetector` を、1M スケールでの偽陽性確率低減のため 10 桁完全一致オプションに拡張する。**backward compat 必須** (50k/100k/500k 既存 test は 8 桁 default 維持) とし、1M 新規 test のみ 10 桁明示指定する設計。

## §1 既存 8 桁完全一致 baseline

| Round | 規模 | test file | mismatch 件数 | 衝突期待値 |
|-------|------|---------|------------|---------|
| R17 Dev-U | 50k | `heartbeat-load-50k.test.ts` | 0 | 1.16 × 10^-5 |
| R18 Dev-Z | 100k | `heartbeat-load-100k.test.ts` | 0 | 2.33 × 10^-5 |
| R19 Dev-CC | 500k | `heartbeat-load-500k.test.ts` (#10) | 0 | 1.16 × 10^-4 |

衝突期待値 = サンプル数 × (1 / 4_294_967_296) で算出。実測 mismatch=0 と整合 (期待値が 1 以下 = 衝突観測なしが統計的に正常)。

`heartbeat-load-500k.test.ts` ケース #10 (lines 329-367) で 3 経路 (`ContinuousRunDetector` / `HeartbeatGapTracker` / `trackHeartbeatStateless`) の 500k tick 数値完全一致を `mismatchTrk=0` / `mismatchStateless=0` で verify 済。

## §2 1M 件想定の桁拡張 (8 → 10 桁)

mulberry32 PRNG の出力は 32bit unsigned int (max 4_294_967_295)。完全一致桁数を以下 mapping で拡張:

| 桁数 | 一致範囲 | 範囲 | 偽陽性確率 (per pair) |
|----|--------|------|------------------|
| 8 桁 | 32bit 全体 | 0 〜 4_294_967_295 | 1 / 4.29G ≈ 2.33 × 10^-10 |
| **10 桁** | **40bit 相当** | **0 〜 1_099_511_627_775** | **1 / 1.1T ≈ 9.09 × 10^-13** |

10 桁拡張の実装方法 2 案:

### 案 A: mulberry32 を 2 回 call して 64bit hash 化 (採用候補)

```ts
// ContinuousRunDetector の比較部分 (擬似コード)
function hash40bit(rand: () => number): bigint {
  const hi = BigInt(Math.floor(rand() * 0x100)) << 32n  // 上位 8bit
  const lo = BigInt(Math.floor(rand() * 0x100000000))   // 下位 32bit
  return hi | lo  // 40bit
}
```

利点: 既存 mulberry32 実装無改変 / 純粋 wrapper / 8 桁との完全独立
欠点: rand() 呼出が 2x → seed 進行速度 2x で 8 桁系列との binary compat 喪失 (1M 専用 seed `0xcafebabe` で吸収)

### 案 B: ContinuousRunDetector internal state に 40bit accumulator 追加 (拒否)

理由: ContinuousRunDetector の state 構造変更 = `tos-monitor.ts` 改変規模拡大、副作用 0 制約に違反する可能性。test-only 制約遵守には案 A が適切。

**採用案: A** (rand call 2x で 40bit hash / 8 桁系列との完全独立)

## §3 偽陽性確率 (8 桁 = 1/4M / 10 桁 = 1/1B 相当 / per-pair)

per-pair (= 比較 1 回あたり) の偽陽性確率を「1 / 4M / 1 / 1B」表現で平易化:

| 桁数 | 偽陽性確率 平易表現 | 1M サンプルでの期待衝突件数 |
|----|-----------------|------------------|
| 8 桁 | **1 / 4 万兆** (per random pair) | 2.33 × 10^-4 件 |
| 10 桁 | **1 / 1 兆** (per random pair) | 9.09 × 10^-7 件 |

衝突確率低減比: 9.09 × 10^-7 / 2.33 × 10^-4 = 1 / 256 → **256 倍低減**（約 2.4 桁）。

formal SLO 観点では、1M サンプルで 9.09 × 10^-7 件の期待値は「衝突観測 = 真の bug」と統計的に断定可能なレベル (8 桁の 2.33 × 10^-4 件は「偶発衝突か bug か微妙」のグレーゾーン)。

## §4 メモリ影響評価 (state size +25%)

ContinuousRunDetector 1 instance あたりの state size:

| field | 8 桁 default | 10 桁 拡張 | 差分 |
|-------|-----------|---------|----|
| boot timestamp (ms) | 8 byte (Number) | 8 byte | 0 |
| last heartbeat (ms) | 8 byte (Number) | 8 byte | 0 |
| accumulated sleep (ms) | 8 byte (Number) | 8 byte | 0 |
| 比較用 hash | 4 byte (32bit Number) | 5 byte (40bit BigInt) | +1 byte |
| BigInt overhead (V8) | — | ~16 byte (object header + small int 表現) | +16 byte |
| **計** | **28 byte** | **40 byte** | **+12 byte (+43%)** |

※ V8 内部の BigInt 表現は実装依存だが、保守見積で +43% (state ≈ 40 byte) を採用。spec §0 で言及した "+25%" は「実用 state field のみの増加分 (4→5 byte = +25%)」を指し、BigInt overhead 込では +43%。

1M tick × 40 byte = **40MB** (1M 並列 tracker 想定時)。Round 21 Dev 後続が 1M ケース #4 (10,000 並列 tracker × 100 attempt = 1M retry) で実装する場合、tracker 数 10,000 × 40 byte = **400KB** で memory 影響無視可能。

判定: **memory 観点では桁拡張を許容**（上記試算で memory cap 100MB に対し 0.4% / 0.04%）。

## §5 backward compat (50k/100k/500k は 8 桁維持、1M は 10 桁)

`ContinuousRunDetector` constructor に digit option を追加:

```ts
// 拡張後 API (擬似コード)
class ContinuousRunDetector {
  constructor(
    limitMs: number,
    maxRetries: number,
    now: () => number,
    options?: { matchDigits?: 8 | 10 }  // default: 8
  ) { ... }
}
```

backward compat 担保ポイント:

1. **50k/100k/500k test 既存 file は無改変** (matchDigits 未指定 = 8 default)
2. **1M test 新規 file のみ `{ matchDigits: 10 }` 明示指定**
3. **既存 PASS baseline (harness 674 tests) regression なし**
4. **TypeScript strict pass 維持** (option 追加のみで既存型は壊さない)
5. **`tos-monitor.ts` の 8 桁経路は test-only 制約下で実装 → primitive 配下の他 caller には影響なし**

regression 確認手順:
- Round 21 Dev 実装時に `bun test` で harness 674 tests + 1M 12 tests = 686 tests PASS を verify
- 8 桁 default 経路の 50k/100k/500k 3 file で mismatch=0 維持
- 10 桁拡張 1M file で mismatch=0 + 偽陽性確率 9.09 × 10^-7 達成

## §6 Round 21 Dev 後続実装 spec

### 6.1 ファイル変更範囲

| ファイル | 変更内容 | 想定行数 |
|---------|--------|------|
| `app/harness/src/tos-monitor.ts` | ContinuousRunDetector に matchDigits option 追加 / 案 A 実装 | ~30 行 patch |
| `app/harness/src/__tests__/heartbeat-load-1m.test.ts` (新規) | 1M test #6 #10 で `{ matchDigits: 10 }` 指定 | 既存 spec §9.1 内 |
| `app/harness/src/__tests__/heartbeat-load-50k.test.ts` | **無改変** (8 桁 default 維持) | 0 |
| `app/harness/src/__tests__/heartbeat-load-100k.test.ts` | **無改変** (8 桁 default 維持) | 0 |
| `app/harness/src/__tests__/heartbeat-load-500k.test.ts` | **無改変** (8 桁 default 維持) | 0 |
| `app/harness/vitest.config.ts` | **無改変** | 0 |

### 6.2 実装ステップ

1. `tos-monitor.ts` に `matchDigits` option 追加 + 40bit hash 計算 path 実装 (案 A)
2. unit test 追加: 8 桁経路 / 10 桁経路の path 分岐確認 (~5 ケース)
3. `heartbeat-load-1m.test.ts` 起票 (12 ケース / matchDigits=10 を #6 #10 で指定 / `sec-o-r20-heartbeat-1m-feasibility.md` §9.2 連動)
4. `bun test` で harness 全 PASS verify (基準 674 tests + 12 新規 + 5 unit = 691 tests想定)
5. determinism mismatch=0 (10 桁) / SLO 全 PASS verify
6. 報告書 `dev-dd-r21-heartbeat-1m.md` (~200 行) 起票

### 6.3 検証 SLO

- **8 桁 default 経路**: mismatch=0 (50k/100k/500k regression 維持)
- **10 桁拡張経路**: mismatch=0 (1M / 偽陽性確率 9.09 × 10^-7)
- **TypeScript strict pass**: matchDigits option 追加で型エラー 0
- **memory**: 40 byte/tracker × 10,000 並列 = 400KB / 100MB cap に対し 0.4% (誤差範囲)
- **API $0 / 副作用 0**: timer / fs / fetch / network 触らず純 in-memory

## §7 quality gate (Sec-O 自身)

- 副作用 0: spec ファイルのみ / 実装は Round 21 引継
- 絵文字 0: 本ファイル内絵文字使用なし
- API 追加コスト $0: 外部 API 呼出なし
- backward compat: 50k/100k/500k 既存 file 無改変宣言
- PII redaction: spec は数学・ハッシュ範囲のみで PII 該当なし
- 報告書 60 行+ 制約: 本ファイル ~135 行（要件達成）

—— Sec-O / 2026-05-05 W0-Week1 / Round 20 第 1 波 / DEC-019-025 SOP 実証 17 件目
