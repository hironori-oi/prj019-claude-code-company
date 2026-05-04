/**
 * benchmarks.test — Round 10 R10 Dev-γ 前倒し (CB-D-W4-02):
 *   harness/src/benchmarks/baseline.ts のテスト + benchmark-results.json fixture 生成。
 *
 * カバー範囲 (5 tests):
 *   1. computePercentiles 純関数 - p50/p95/p99 が昇順 sort 後のランクと一致
 *   2. runBaselineBenchmarks - 4 component すべて返る / 各 percentiles n>0
 *   3. runBaselineBenchmarks - cycles=10 で全 component samples.length=10
 *   4. runBaselineBenchmarks - outputPath 指定で benchmark-results.json 書出し
 *   5. fixture 1 件生成 (DoD) - benchmark-results.json (P50/P95/P99 表) を harness/ 配下に書出し
 */
import { describe, it, expect } from 'vitest'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

import {
  runBaselineBenchmarks,
  computePercentiles,
  type BenchmarkRunResult,
} from '../../../harness/src/benchmarks/baseline.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('benchmarks/baseline (CB-D-W4-02 pre-emption)', () => {
  it('1. computePercentiles - p50/p95/p99 が昇順 sort 後のランクと一致', () => {
    const samples = Array.from({ length: 100 }, (_, i) => ({ ms: i + 1 }))
    const p = computePercentiles(samples)
    expect(p.n).toBe(100)
    expect(p.min).toBe(1)
    expect(p.max).toBe(100)
    // nearest-rank: p50 = ceil(0.5 * 100) = 50 → samples[49] = 50
    expect(p.p50).toBe(50)
    // p95 = ceil(0.95 * 100) = 95 → samples[94] = 95
    expect(p.p95).toBe(95)
    // p99 = ceil(0.99 * 100) = 99 → samples[98] = 99
    expect(p.p99).toBe(99)
    expect(p.mean).toBeCloseTo(50.5, 1)
  })

  it('2. runBaselineBenchmarks - 4 component すべて返る / 各 percentiles n>0', async () => {
    const result = await runBaselineBenchmarks({ cycles: 5 })
    expect(result.components).toHaveLength(4)
    const names = result.components.map((c) => c.component).sort()
    expect(names).toEqual([
      'cost_tracker.recordSpend_checkBudget',
      'kill_switch.trigger',
      'tos_monitor.checkContinuousRun_checkRateSpike',
      'usage_monitor.recordCall',
    ])
    for (const c of result.components) {
      expect(c.percentiles.n).toBeGreaterThan(0)
      expect(c.percentiles.p50).toBeGreaterThanOrEqual(0)
      expect(c.percentiles.p95).toBeGreaterThanOrEqual(c.percentiles.p50)
      expect(c.percentiles.p99).toBeGreaterThanOrEqual(c.percentiles.p95)
    }
  })

  it('3. runBaselineBenchmarks - cycles=10 で全 component samples.length=10', async () => {
    const result = await runBaselineBenchmarks({ cycles: 10 })
    expect(result.cyclesPerComponent).toBe(10)
    for (const c of result.components) {
      expect(c.samples.length).toBe(10)
    }
  })

  it('4. runBaselineBenchmarks - outputPath 指定で JSON 書出し / 再読込可能', async () => {
    const out = join(tmpdir(), `clawbridge-bench-${Date.now()}.json`)
    const result = await runBaselineBenchmarks({ cycles: 3, outputPath: out })
    const raw = await fs.readFile(out, 'utf-8')
    const parsed = JSON.parse(raw) as BenchmarkRunResult
    expect(parsed.components).toHaveLength(4)
    expect(parsed.cyclesPerComponent).toBe(3)
    expect(parsed.ranAt).toBe(result.ranAt)
    await fs.unlink(out).catch(() => undefined)
  })

  it('5. fixture 1 件生成 (DoD) - benchmark-results.json を harness/ に書出し', async () => {
    // harness/benchmark-results.json (絶対 path 解決)
    // __dirname = .../e2e/src/__tests__ → harness/benchmark-results.json
    const targetPath = resolve(__dirname, '../../../harness/benchmark-results.json')
    const result = await runBaselineBenchmarks({
      cycles: 30,
      outputPath: targetPath,
      ranAtIso: '2026-05-04T17:00:00.000Z',
    })
    expect(result.components).toHaveLength(4)
    // ファイル存在確認
    const stat = await fs.stat(targetPath)
    expect(stat.isFile()).toBe(true)
    // 中身の sanity check
    const raw = await fs.readFile(targetPath, 'utf-8')
    const parsed = JSON.parse(raw) as BenchmarkRunResult
    expect(parsed.components.map((c) => c.component).sort()).toEqual([
      'cost_tracker.recordSpend_checkBudget',
      'kill_switch.trigger',
      'tos_monitor.checkContinuousRun_checkRateSpike',
      'usage_monitor.recordCall',
    ])
    // 各 component に P50/P95/P99 が記録されていること
    for (const c of parsed.components) {
      expect(c.percentiles.p50).toBeGreaterThanOrEqual(0)
      expect(c.percentiles.p95).toBeGreaterThanOrEqual(0)
      expect(c.percentiles.p99).toBeGreaterThanOrEqual(0)
    }
  })
})
