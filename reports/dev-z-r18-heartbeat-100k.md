# PRJ-019 Round 18 Dev-Z — heartbeat 100,000 件 load test 実装完遂 (Round 17 Dev-U 50k baseline scale-up)

最終更新: 2026-05-05 W0-Week1 / 起案: Dev 部門 R18 第 2 波 Dev-Z（DEC-019-025 SOP 準拠）
位置付け: PRJ-019 公開 6/20 or 6/27 に向け、Round 17 Dev-U 着地の 50,000 件 load test を 2x スケールアップした **100,000 件 load test** を新規実装し、heartbeat hardening の数学的境界 + thundering herd 否定を 100k 規模で実機検証する。
版: v1.0
連動 DEC: DEC-019-025 / 049 / 053 v15.5 / 054 / 055 / 057 / 062
連動レポート: `dev-u-r17-heartbeat-50k-load.md`（R17 着地 295 行）/ `dev-s-r16-heartbeat-hardening.md`
連動コード変更:
- `projects/PRJ-019/app/harness/src/__tests__/heartbeat-load-100k.test.ts` — 新規（339 行 / 10 ケース実装 / vitest pickup 対象）
- 既存 `heartbeat-load-50k.test.ts` は **無改変**（Round 17 着地の regression baseline 維持）
- `heartbeat-gap-primitive.ts` / `tos-monitor.ts` は **無改変**（test-only 制約遵守）

---

## §0 200 字 CEO サマリ

Round 18 第 2 波 Dev-Z は heartbeat 100,000 件 load test を新規実装し全 10 ケース PASS で完遂。Round 17 Dev-U 着地の 50,000 件 baseline (295 行) を 2x スケールアップした 339 行 / 10 ケース構成で、`mulberry32(0xfeedface 系列)` を新 PRNG seed として採用しトラフィックパターンを 50k と独立化。50k 既存 test は **無改変** で regression baseline 維持。新ケースとして #2 で 1024 bin histogram + max-cluster-density 検証を追加し thundering herd を統計的に否定（max bin < 2x mean / 空 bin <5%）。perf 100k tick 同期実行 < 2s 制約に対し 81ms 観測（25x マージン）、メモリ <100MB 制約に対し heap delta 1.5MB 観測（66x マージン）、circuit fail-fast 99,990 件 wall < 200ms 制約に対し O(1) 応答維持。harness 全体 43 file / 621 tests → 44 file / 631 tests に拡張、Dev-Z 寄与 +10 tests / +1 file の純増のみで既存 test は完全 PASS 継続。副作用 0 / API $0 / TypeScript strict pass。

---

## §1 タスク受領と前提確認

Round 17 Dev-U 着地の `heartbeat-load-50k.test.ts` (295 行 / 10 ケース / 132ms 観測) と primitive `heartbeat-gap-primitive.ts` (416 行 / 無改変) を引継。Dev-Z の責務は (a) 100k スケールの新 test file 起票、(b) 50k と独立した PRNG seed 系列でトラフィックパターン分離、(c) thundering herd 統計検証の追加、(d) harness 全 PASS の 4 点。前提として harness baseline を Dev-U 報告通り 43 file / 621 tests と確認、Dev-Z 完遂後は 44 file / 631 tests に着地（+1 file / +10 tests = Dev-Z 寄与のみの純増）。

---

## §2 50k → 100k 設計差分

50k test との設計差分を 5 点に集約:

1. **PRNG seed 系列分離** — 50k は `mulberry32(0xdeadbeef / 1 / 0xc0ffee01 / 42 / 99 / 7 / 0xabcdef)`。100k は `mulberry32(0xfeedface / +1 / +0x42 / +0x99 / +0xaa / +0x07 / +0xbeef)` で base seed 完全分離。同一 algorithm / 異なる seed 系列でトラフィック重複を防ぎ、両 test の独立性を担保。
2. **thundering herd 統計の追加** — 50k は CV ≈ 0.577 のみ。100k は CV ±10% に加えて **1024 bin histogram の max-cluster-density** で max bin < 2x mean (uniform 期待値) を検証し、jitter='full' が thundering を回避していることを統計的に積極証明。空 bin <5% 制約も追加し uniform spread の最低条件を verify。
3. **並列 tracker 数の倍化** — 50k は 5,000 tracker × 10 attempt = 50,000 retry。100k は 10,000 tracker × 10 attempt = 100,000 retry で「tracker 数」次元でも 2x スケール。10k インスタンス独立保持で cross-talk 0 を再確認。
4. **circuit fail-fast 件数倍化** — 50k は 49,990 件 / wall < 100ms。100k は 99,990 件 / wall < 200ms で O(1) per-call dispatch の線形性を verify。
5. **memory cap 倍化** — 50k は <50MB。100k は <100MB（比例配分 +2x cap）。実測 1.5MB で大幅マージンあり（後述 §5.4）。

---

## §3 10 ケース実装内容と数学的境界

| # | ケース名 | 数学的境界 | 検証値 |
|---|---------|----------|-------|
| 1 | perf 100k tick | 同期 100,000 tick < 2s | accumulatedSleep=0 / lastHeartbeat=1_000_000 + 100,000×60_000 |
| 2 | jitter dispersion CV + 1024 bin histogram | uniform(0, exp) → CV = 1/√3 ≈ 0.5774 / max bin < 2× mean | CV ∈ (0.5197, 0.6351) / maxBin < 2×meanBin / emptyBins < 5% |
| 3 | circuit fail-fast (99,990 件) | circuitOpen=true で sleep スキップ / O(1) per-call | 99,990/99,990 件 fail-fast / wall < 200ms |
| 4 | 10,000 並列 cross-talk 0 | 各 tracker 独立 now / 他 tracker への副作用 0 | 各 i の lastHeartbeat = i×1_000_000 + 10×60_000 完全一致 |
| 5 | memory <= 100MB | tracker 1 個 + 3 fields のみ | heap delta < 100MB / state shape verify |
| 6 | determinism (8 桁) | mulberry32(seed) で 2 回実行 → exact 一致 | mismatch=0 / firstNonZero > 0 |
| 7 | cap (max wait = capMs) | attempt=20 で exp ≈ 1G ms → cap=16_000 に丸め | overCap=0 / maxWait > cap×0.99 ∧ ≤ cap |
| 8 | decorrelated 安定 | prev*3 で増加 → cap で飽和 / unbounded grow なし | 100,000 件 overCap=0 / |max−mean| ≤ 3σ + cap |
| 9 | max-retries fail-fast | attempt > maxRetries (=5) で fail-fast | 100,000 件全件 fail-fast / 境界 attempt=5 で sleep |
| 10 | ContinuousRunDetector 8 桁一致 | 100,000 tick 3 経路 (ref / trk / stateless) 数値完全一致 | mismatchTrk=0 / mismatchStateless=0 / suspendCount > 0 |

50k と比較した cap 接近度の境界強化（#7）: 50k は cap*0.95 接近、100k は cap*0.99 接近を要求（サンプル数倍化で max → cap の収束加速を活用）。

---

## §4 検証結果

### 4.1 新規 test file 単独実行

```
Tests       10 passed (10)
Duration    81ms (test 実行のみ / 50k 132ms と比較しても線形未満で完遂)
            全 10 ケース 200ms 以内目標 → 平均 8.1ms (24 倍以上余裕)
            合計 2s 以内目標 → 81ms (合格)
```

### 4.2 harness 全テスト実行

```
Test Files  44 passed (44)
Tests       631 passed (631)
Duration    4.50s (Round 17 Dev-U baseline 3.78s から +0.72s / +10s 制約内)
```

baseline 621 + Dev-Z 10 = 631 で完全一致（並走 Dev エージェント追加なし）。Dev-Z 寄与 +10 tests / +1 file の純増のみ。

### 4.3 TypeScript strict / 副作用 0 / API $0

- `npx tsc --noEmit | grep heartbeat-load-100k` → 出力 0 件（strict pass）
- pre-existing TS errors（src/knowledge/ 配下）は本 Dev-Z と無関係（Dev-U / Dev-S 報告で既知）
- timer / fs / fetch / network 触らず純 in-memory（`process.memoryUsage()` 1 回のみが副作用に近いが state read-only / Round 15-17 と同方針継承）
- API call 0 / 課金 0

### 4.4 数学的境界の実測値（参考）

- jitter dispersion CV: 0.577 ±10% 範囲内 → uniform 分布の理論値と一致（50k と同水準）
- 1024 bin histogram: max bin < 2×mean / 空 bin <5% を 100,000 サンプルで verify（thundering herd 否定）
- cap maxWait: 16,000 に対して 0.99×16,000 = 15,840 を超える max が 100,000 サンプル中で観測（50k は 0.95 = 15,200 が境界）
- decorrelated 後半 50,000 件 stddev: cap 飽和により 0 でない値で stable
- ContinuousRunDetector vs HeartbeatGapTracker vs trackHeartbeatStateless: 100,000 件すべて exact 数値一致 / suspendCount > 0（mix 1/100 動作確認）
- memory heap delta: 観測 1.5MB（100MB cap に対し 66x マージン）

---

## §5 Round 18 sign-off + 次 Round 引継

### sign-off

| 項目 | 状態 |
|------|------|
| 100k test file 新規作成 | OK (heartbeat-load-100k.test.ts / 339 行) |
| 10 ケース実装 | OK (全 PASS / 81ms) |
| 50k test 無改変 (regression baseline) | OK (file 無変更) |
| heartbeat impl 無改変 (test only) | OK (heartbeat-gap-primitive.ts / tos-monitor.ts 無変更) |
| harness 全 PASS | OK (631/631 / Dev-Z 寄与 +10) |
| 1 ケース 200ms 以内 | OK (平均 8.1ms / 最大 file 全体 81ms) |
| 合計 2s 以内 | OK (81ms) |
| API $0 / 副作用 0 / TS strict | OK |
| PRNG seed 50k と分離 | OK (0xfeedface 系列) |
| 報告書 200 行以内 | 本ファイル 約 130 行 |

### 次 Round 引継

1. **500k スケールへの拡張可否**: 100k で perf 81ms / memory 1.5MB の余裕は十分大きい。500k は perf 線形外挿で 405ms 想定（2s 制約内）。必要性が顕在化した段階で別 Dev エージェントが起案推奨（緊急性なし、本 Round で proactive 拡張は禁止事項違反のため見送り）。
2. **vitest config 整備の検討**: Round 17 Dev-U が引継事項として記録した `.spec.ts` pickup 問題は本 Round で再発せず（Dev-Z は最初から `.test.ts` 命名で起案）。明示 vitest config 整備は Round 18 以降の Dev 部門会議で議論継続推奨。
3. **histogram bin 検証の他 jitter mode 適用**: 本 Round で full jitter のみ 1024 bin 検証を追加。equal_jitter / decorrelated については 50k 既存検証で十分との判断で本 Round では追加せず。caller 側で jitter mode 切替 e2e テストが必要になった段階で別 Round 起案。
4. **thundering herd 検出 SLO 化**: max-cluster-density < 2× mean を 100k で実機 verify。本数値は将来的に runtime ガード（production 監視 metric）に昇格可能だが SLO 化は別 Round の責務（PRJ-019 monitoring 設計の拡張範囲）。

### Dev-Z 完遂宣言

Round 17 Dev-U 50k baseline → Round 18 Dev-Z 100k scale-up のリレーで heartbeat hardening の数学的境界が **2 段階 (50k / 100k) で実機検証着地**。`heartbeat-load-50k.test.ts` (regression baseline) + `heartbeat-load-100k.test.ts` (scale-up + thundering herd 統計) の 2 file 体制で primitive load 検証の網羅性が拡張。harness 全 PASS 維持 (631/631)、副作用 0、API $0、TypeScript strict pass、報告書範囲内（130 行 / 200 行制約内）。

— Dev-Z / 2026-05-05 W0-Week1 / Round 18 第 2 波
