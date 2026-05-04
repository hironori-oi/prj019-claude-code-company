/**
 * benchmarks/baseline — Round 10 R10 Dev-γ 前倒し (CB-D-W4-02 pre-emption):
 *   harness 既存 4 コンポーネントの latency baseline 計測。
 *
 * 対象:
 *   1. usage-monitor.recordCall          — recordCall + checkAnomalies の 1 cycle
 *   2. cost-tracker.recordSpend + checkBudget — 1 spend + budget check の 1 cycle
 *   3. kill-switch.trigger (mock)        — disarm 状態でも trigger 即時 path を計測
 *   4. tos-monitor.checkContinuousRun + checkRateSpike — 2 detector 1 cycle
 *
 * P50 / P95 / P99 latency を集計し、benchmark-results.json に書出す。
 *
 * 設計原則:
 *   - performance.now() ベース (Mock TimeSource は wall-clock 計測には使わない)。
 *   - 各 cycle は新規 instance を spin up (state 残存による bias 排除)。
 *   - 既存ファイル無改変。新規追加のみ。
 *   - 副作用は benchmark-results.json への書込のみ (出力先 path 注入で test 容易)。
 *
 * 1 回の実行で 1 fixture を生成 (DoD: P50/P95/P99 の表 1 件)。
 */
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { performance } from 'node:perf_hooks'
import { dirname } from 'node:path'

import { FileCostTracker } from '../cost-tracker.js'
import { FileKillSwitch } from '../kill-switch.js'
import { FileUsageMonitor } from '../usage-monitor.js'
import { createTosMonitor } from '../tos-monitor.js'
import type { CostTracker } from '../cost-tracker.js'

export interface BenchmarkLatencySample {
  /** 1 cycle の経過 ms */
  ms: number
}

export interface BenchmarkPercentiles {
  p50: number
  p95: number
  p99: number
  min: number
  max: number
  mean: number
  /** sample 数 */
  n: number
}

export interface BenchmarkComponentResult {
  /** コンポーネント名 (4 種固定) */
  component:
    | 'usage_monitor.recordCall'
    | 'cost_tracker.recordSpend_checkBudget'
    | 'kill_switch.trigger'
    | 'tos_monitor.checkContinuousRun_checkRateSpike'
  percentiles: BenchmarkPercentiles
  /** raw sample (debug 用、JSON dump にも残す) */
  samples: readonly BenchmarkLatencySample[]
}

export interface BenchmarkRunResult {
  /** 実行 ISO8601 */
  ranAt: string
  /** node version (process.version) */
  node: string
  /** 1 component 当たり cycle 回数 (default 100) */
  cyclesPerComponent: number
  components: readonly BenchmarkComponentResult[]
}

export interface RunBaselineBenchmarksOptions {
  /** 1 component 当たり cycle 回数 (default 100) */
  cycles?: number
  /** 出力 JSON path (default = projects/PRJ-019/app/harness/benchmark-results.json 相当を caller が決定) */
  outputPath?: string
  /** ledger / kill-switch / audit が触れる tmp dir 接頭辞 */
  tmpDirPrefix?: string
  /** 注入用 ISO 時刻 */
  ranAtIso?: string
}

const DEFAULT_CYCLES = 100

/**
 * harness 4 コンポーネントの latency baseline を計測する。
 *
 * 戻り値は集計結果 + raw samples。outputPath 指定時は JSON dump も実施。
 */
export async function runBaselineBenchmarks(
  opts: RunBaselineBenchmarksOptions = {},
): Promise<BenchmarkRunResult> {
  const cycles = opts.cycles ?? DEFAULT_CYCLES
  const ranAt = opts.ranAtIso ?? new Date().toISOString()

  const components: BenchmarkComponentResult[] = []
  components.push(await benchUsageMonitor(cycles, opts.tmpDirPrefix))
  components.push(await benchCostTracker(cycles, opts.tmpDirPrefix))
  components.push(await benchKillSwitch(cycles, opts.tmpDirPrefix))
  components.push(await benchTosMonitor(cycles))

  const result: BenchmarkRunResult = {
    ranAt,
    node: process.version,
    cyclesPerComponent: cycles,
    components: Object.freeze(components),
  }

  if (opts.outputPath) {
    await fs.mkdir(dirname(opts.outputPath), { recursive: true })
    await fs.writeFile(opts.outputPath, JSON.stringify(result, null, 2), 'utf-8')
  }

  return result
}

// ---------- bench 個別 ----------

async function benchUsageMonitor(
  cycles: number,
  tmpDirPrefix: string | undefined,
): Promise<BenchmarkComponentResult> {
  const samples: BenchmarkLatencySample[] = []
  // ledger 書込を bench に含めるため tmp ledger 1 本を share
  const ledgerPath =
    (tmpDirPrefix ?? tmpdir()) +
    `/clawbridge-bench-usage-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
  for (let i = 0; i < cycles; i += 1) {
    // 各 cycle 新規 instance (state 残存 bias 排除)
    const monitor = new FileUsageMonitor({ ledgerPath })
    const t0 = performance.now()
    await monitor.recordCall('anthropic_api', { status: 200, durationMs: 100, tokens: 100 })
    const t1 = performance.now()
    samples.push({ ms: t1 - t0 })
  }
  try {
    await fs.unlink(ledgerPath)
  } catch {
    // best effort
  }
  return {
    component: 'usage_monitor.recordCall',
    percentiles: computePercentiles(samples),
    samples,
  }
}

async function benchCostTracker(
  cycles: number,
  tmpDirPrefix: string | undefined,
): Promise<BenchmarkComponentResult> {
  const samples: BenchmarkLatencySample[] = []
  // ledger 書込を bench 対象に含めるため tmp ledger 1 本を share
  const ledgerPath =
    (tmpDirPrefix ?? tmpdir()) +
    `/clawbridge-bench-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
  for (let i = 0; i < cycles; i += 1) {
    const tracker = new FileCostTracker({ ledgerPath })
    const t0 = performance.now()
    await tracker.recordSpend('anthropic_api', 0.001, { sessionId: `bench-${i}` })
    await tracker.checkBudget({ sessionId: `bench-${i}` })
    const t1 = performance.now()
    samples.push({ ms: t1 - t0 })
  }
  // cleanup ledger
  try {
    await fs.unlink(ledgerPath)
  } catch {
    // best effort
  }
  return {
    component: 'cost_tracker.recordSpend_checkBudget',
    percentiles: computePercentiles(samples),
    samples,
  }
}

async function benchKillSwitch(
  cycles: number,
  tmpDirPrefix: string | undefined,
): Promise<BenchmarkComponentResult> {
  const samples: BenchmarkLatencySample[] = []
  const base =
    (tmpDirPrefix ?? tmpdir()) + `/clawbridge-bench-kill-${Date.now()}`
  for (let i = 0; i < cycles; i += 1) {
    const ks = new FileKillSwitch({
      signalPath: `${base}-${i}.signal`,
      historyPath: `${base}-${i}.history.json`,
      pollIntervalMs: 60_000,
      handlerTimeoutMs: 1_000,
      exitOnTrigger: false,
    })
    const t0 = performance.now()
    await ks.trigger(`bench-${i}`, { source: 'manual' })
    const t1 = performance.now()
    samples.push({ ms: t1 - t0 })
  }
  return {
    component: 'kill_switch.trigger',
    percentiles: computePercentiles(samples),
    samples,
  }
}

async function benchTosMonitor(cycles: number): Promise<BenchmarkComponentResult> {
  const samples: BenchmarkLatencySample[] = []
  // costTracker stub: getMonthlyTotal が即時 return
  const stubCostTracker: CostTracker = {
    recordSpend: async () => undefined,
    getMonthlyTotal: async () => 5,
    getDailyTotal: async () => 0,
    getSessionTotal: async () => 0,
    getProjectTotal: async () => 0,
    checkBudget: async () => ({ ok: true }),
    reset: async () => undefined,
  }
  for (let i = 0; i < cycles; i += 1) {
    const monitor = createTosMonitor({
      ng3Plan: 'plan_b_16h',
      confirmCount: 1,
      costTracker: stubCostTracker,
    })
    monitor.markBoot()
    monitor.recordTokens(100)
    const t0 = performance.now()
    await monitor.checkContinuousRun()
    await monitor.checkRateSpike()
    const t1 = performance.now()
    samples.push({ ms: t1 - t0 })
  }
  return {
    component: 'tos_monitor.checkContinuousRun_checkRateSpike',
    percentiles: computePercentiles(samples),
    samples,
  }
}

// ---------- percentile helper ----------

export function computePercentiles(samples: readonly BenchmarkLatencySample[]): BenchmarkPercentiles {
  if (samples.length === 0) {
    return { p50: 0, p95: 0, p99: 0, min: 0, max: 0, mean: 0, n: 0 }
  }
  const sorted = samples.map((s) => s.ms).sort((a, b) => a - b)
  const n = sorted.length
  const p50 = pickPercentile(sorted, 0.5)
  const p95 = pickPercentile(sorted, 0.95)
  const p99 = pickPercentile(sorted, 0.99)
  const min = sorted[0]!
  const max = sorted[n - 1]!
  const sum = sorted.reduce((a, b) => a + b, 0)
  const mean = sum / n
  return { p50, p95, p99, min, max, mean, n }
}

function pickPercentile(sortedAsc: readonly number[], p: number): number {
  if (sortedAsc.length === 0) return 0
  // nearest-rank method (k = ceil(p * n) - 1, 0-based)
  const k = Math.min(
    sortedAsc.length - 1,
    Math.max(0, Math.ceil(p * sortedAsc.length) - 1),
  )
  return sortedAsc[k]!
}
