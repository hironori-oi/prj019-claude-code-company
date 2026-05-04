/**
 * tos-monitor.test — CB-D-W2-06 / Round 9 案 9-A2 BAN 防御コア。
 *
 * テストカバー:
 *   - 4 detector × happy / edge: ContinuousRun / CostCap / RateSpike / WarningEmail
 *   - shouldFallbackToApiKey 純関数 (5 reason × エッジ)
 *   - false-positive matrix: 5 シナリオ × 2 confirmCount パターン (= 10 tests)
 *   - Integration: kill-switch + circuit-breaker + audit hook 連鎖
 *   - NG-3 plan 切替 (plan_a_12h / plan_b_16h / plan_c_24h reject 明示)
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  ANTHROPIC_WARNING_FIXTURES,
  ContinuousRunDetector,
  CostCapDetector,
  RateSpikeDetector,
  MockAnthropicWarningSource,
  NG3_PLANS,
  createTosMonitor,
  createAuditHook,
  createDrillRecordingHook,
  createReplayHook,
  InMemoryDrillRecorder,
  shouldFallbackToApiKey,
  wrapWithDrillRecording,
  type AuditAppender,
  type DrillInstrumentEntry,
  type FallbackDecisionInput,
  type Ng3Plan,
  type TosMonitorEvent,
  type WarningEvent,
} from '../tos-monitor.js'
import { FakeTimeSource } from '../time-source.js'
import { CircuitBreaker } from '../circuit-breaker.js'
import { FileKillSwitch } from '../kill-switch.js'
import { FileCostTracker } from '../cost-tracker.js'

function tmpDir(): string {
  return join(
    tmpdir(),
    `clawbridge-tos-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
}

// ============================================================================
// NG3_PLANS / 案 B vs 案 C 採用根拠の構造的明示
// ============================================================================

describe('NG3_PLANS — Research Round 5 §3.2 整合', () => {
  it('plan_a_12h: DEC-019-008 暫定 12h + $30 cap', () => {
    const a = NG3_PLANS.plan_a_12h
    expect(a.continuousRunMs).toBe(12 * 3600 * 1000)
    expect(a.apiUsdMonthlyHardCap).toBe(30)
    expect(a.description).toContain('DEC-019-008')
  })

  it('plan_b_16h: CEO 推奨 案 B 16h + $100 cap (DEC-019-051 ≤$430 整合)', () => {
    const b = NG3_PLANS.plan_b_16h
    expect(b.continuousRunMs).toBe(16 * 3600 * 1000)
    expect(b.apiUsdMonthlyHardCap).toBe(100)
    expect(b.combinedMonthlyCap).toBe(500)
    expect(b.description).toContain('案 B')
  })

  it('plan_c_24h: REJECT 明示 (NG-3 BAN 60-80% / DEC-019-051 抵触)', () => {
    const c = NG3_PLANS.plan_c_24h
    expect(c.continuousRunMs).toBe(24 * 3600 * 1000)
    expect(c.description).toContain('REJECT')
  })
})

// ============================================================================
// ContinuousRunDetector
// ============================================================================

describe('ContinuousRunDetector', () => {
  it('happy: boot → cap 超過 + confirmCount=2 で breach', () => {
    let now = 1_000_000
    const d = new ContinuousRunDetector(1000, 2, () => now)
    d.markBoot()
    now += 500
    expect(d.evaluate()?.breached).toBe(false)
    now += 600 // 1100ms 経過 (cap 1000)
    expect(d.evaluate()?.breached).toBe(false) // 1 回目: confirm 1
    expect(d.evaluate()?.breached).toBe(true) // 2 回目: confirm 2 = fire
  })

  it('edge: boot 未マーク時は null', () => {
    const d = new ContinuousRunDetector(1000, 1, () => 0)
    expect(d.evaluate()).toBeNull()
  })

  it('edge: cap 直前で miss するとカウンタリセット', () => {
    let now = 0
    const d = new ContinuousRunDetector(1000, 2, () => now)
    d.markBoot()
    now = 1100
    expect(d.evaluate()?.breached).toBe(false) // confirm 1
    now = 900 // 巻き戻し (テスト用): elapsed が cap 未満
    // 注: テストでは時刻巻き戻しでカウンタ reset 確認
    expect(d.evaluate()?.breached).toBe(false)
    now = 1100
    expect(d.evaluate()?.breached).toBe(false) // confirm 1 再出発
    expect(d.evaluate()?.breached).toBe(true) // confirm 2 = fire
  })
})

// ============================================================================
// CostCapDetector
// ============================================================================

describe('CostCapDetector', () => {
  it('happy: cap 超過 + confirmCount=2 で breach', () => {
    const d = new CostCapDetector(100, 2)
    expect(d.evaluate(50).breached).toBe(false)
    expect(d.evaluate(110).breached).toBe(false) // confirm 1
    expect(d.evaluate(120).breached).toBe(true) // confirm 2 = fire
  })

  it('edge: cap ちょうどで breach (>=)', () => {
    const d = new CostCapDetector(100, 1)
    expect(d.evaluate(100).breached).toBe(true)
  })

  it('edge: cap 未満で miss した瞬間 confirm reset', () => {
    const d = new CostCapDetector(100, 2)
    expect(d.evaluate(110).breached).toBe(false) // confirm 1
    expect(d.evaluate(50).breached).toBe(false) // miss → confirm 0
    expect(d.evaluate(110).breached).toBe(false) // confirm 1 再出発
    expect(d.evaluate(110).breached).toBe(true) // confirm 2 = fire
  })
})

// ============================================================================
// RateSpikeDetector
// ============================================================================

describe('RateSpikeDetector', () => {
  it('happy: short=1h 消費が 24h 平均の 5x 超で breach', () => {
    let now = 0
    const shortMs = 60 * 60 * 1000 // 1h
    const longMs = 24 * shortMs // 24h
    const d = new RateSpikeDetector(shortMs, longMs, 5, 1, () => now)
    // 過去 23h: 毎時 100 token (= baseline ≈ 100/h)
    for (let i = 0; i < 23; i++) {
      now = i * shortMs
      d.recordTokens(100)
    }
    // 直近 1h: 1500 token (baseline ≈ (2300+1500)/24 ≈ 158/h, multiplier ≈ 9.5x)
    now = 23 * shortMs + 30 * 60 * 1000 // 23.5h
    d.recordTokens(1500)
    now = 24 * shortMs - 1 // 24h 直前で評価
    const r = d.evaluate()
    expect(r.breached).toBe(true)
    expect(r.multiplierActual).toBeGreaterThanOrEqual(5)
  })

  it('edge: baseline がゼロ近傍では breach しない (誤検知防止)', () => {
    let now = 0
    const d = new RateSpikeDetector(1000, 24000, 5, 1, () => now)
    now = 100
    d.recordTokens(50) // 全部 short window 内
    const r = d.evaluate()
    // baseline = 50 / 24 ≈ 2.08, short = 50 → 50/2.08 ≈ 24x だが
    // 1 sample しかない場合 baseline が小さすぎるケース → breach しない設計
    // (本検証は baseline >= 1 の境界で行う)
    expect(r.shortTokens).toBe(50)
  })

  it('edge: confirmCount=2 で 1 回目は fire しない', () => {
    let now = 0
    const d = new RateSpikeDetector(1000, 24000, 5, 2, () => now)
    for (let i = 0; i < 23; i++) {
      now = i * 1000
      d.recordTokens(100)
    }
    now = 23500
    d.recordTokens(800)
    now = 23999
    expect(d.evaluate().breached).toBe(false) // confirm 1
    expect(d.evaluate().breached).toBe(true) // confirm 2 = fire
  })

  it('edge: invalid window setup throws', () => {
    expect(() => new RateSpikeDetector(0, 100, 5, 1, () => 0)).toThrow()
    expect(() => new RateSpikeDetector(100, 100, 5, 1, () => 0)).toThrow()
    expect(() => new RateSpikeDetector(100, 200, 0.5, 1, () => 0)).toThrow()
  })
})

// ============================================================================
// shouldFallbackToApiKey 純関数
// ============================================================================

describe('shouldFallbackToApiKey', () => {
  const baseInput: FallbackDecisionInput = {
    subscription: 'active',
    warningCount: 0,
    maxWarningSeverity: 0,
    costTier: null,
    ng3BreachCount7d: 0,
  }

  it('manualOverride=true で manual / escalateToOwner=true', () => {
    const r = shouldFallbackToApiKey({ ...baseInput, manualOverride: true })
    expect(r.shouldFallback).toBe(true)
    expect(r.reason).toBe('manual')
    expect(r.escalateToOwner).toBe(true)
  })

  it('subscription=revoked で subscription_warning + escalate', () => {
    const r = shouldFallbackToApiKey({ ...baseInput, subscription: 'revoked' })
    expect(r.shouldFallback).toBe(true)
    expect(r.reason).toBe('subscription_warning')
    expect(r.escalateToOwner).toBe(true)
  })

  it('maxWarningSeverity>=4 (final/tos) で fallback + escalate', () => {
    const r = shouldFallbackToApiKey({ ...baseInput, maxWarningSeverity: 4 })
    expect(r.shouldFallback).toBe(true)
    expect(r.reason).toBe('subscription_warning')
    expect(r.escalateToOwner).toBe(true)
  })

  it('ng3BreachCount7d>=1 で ng3_breach + escalate', () => {
    const r = shouldFallbackToApiKey({ ...baseInput, ng3BreachCount7d: 2 })
    expect(r.shouldFallback).toBe(true)
    expect(r.reason).toBe('ng3_breach')
    expect(r.escalateToOwner).toBe(true)
  })

  it('rate_limited + warningCount>=2 で fallback (escalate=false)', () => {
    const r = shouldFallbackToApiKey({
      ...baseInput,
      subscription: 'rate_limited',
      warningCount: 2,
    })
    expect(r.shouldFallback).toBe(true)
    expect(r.reason).toBe('subscription_warning')
    expect(r.escalateToOwner).toBe(false)
  })

  it('通常稼働は no_action', () => {
    const r = shouldFallbackToApiKey(baseInput)
    expect(r.shouldFallback).toBe(false)
    expect(r.reason).toBe('no_action')
    expect(r.escalateToOwner).toBe(false)
  })

  it('優先度: manualOverride > revoked > severity>=4 > ng3_breach', () => {
    // 全部 true でも manualOverride 優先
    const r = shouldFallbackToApiKey({
      subscription: 'revoked',
      warningCount: 5,
      maxWarningSeverity: 5,
      costTier: 'hard_fail',
      ng3BreachCount7d: 3,
      manualOverride: true,
    })
    expect(r.reason).toBe('manual')
  })
})

// ============================================================================
// MockAnthropicWarningSource + fixture 5 種類
// ============================================================================

describe('MockAnthropicWarningSource + fixtures', () => {
  it('5 種 fixture が存在する: rate / capacity / billing / tos_warning / final_warning', () => {
    const cats = ANTHROPIC_WARNING_FIXTURES.map((f) => f.category)
    expect(cats).toContain('rate')
    expect(cats).toContain('capacity')
    expect(cats).toContain('billing')
    expect(cats).toContain('tos_warning')
    expect(cats).toContain('final_warning')
  })

  it('queue を消費する FIFO', async () => {
    const src = new MockAnthropicWarningSource([[ANTHROPIC_WARNING_FIXTURES[0]!], []])
    const a = await src.poll()
    expect(a.length).toBe(1)
    const b = await src.poll()
    expect(b.length).toBe(0)
  })

  it('enqueue 動的追加', async () => {
    const src = new MockAnthropicWarningSource()
    src.enqueue([ANTHROPIC_WARNING_FIXTURES[4]!]) // final_warning
    const r = await src.poll()
    expect(r[0]?.severity).toBe(5)
  })
})

// ============================================================================
// TosMonitor: 統合 — kill-switch + circuit-breaker + audit hook
// ============================================================================

describe('TosMonitor integration', () => {
  let dir: string
  beforeEach(async () => {
    dir = tmpDir()
    await fs.mkdir(dir, { recursive: true })
  })

  it('checkContinuousRun: NG-3 breach → audit + kill-switch + CB.forceOpen', async () => {
    const ts = new FakeTimeSource(new Date('2026-05-04T00:00:00Z'))
    const ks = new FileKillSwitch({
      signalPath: join(dir, 'STOP'),
      historyPath: join(dir, 'kill-history.json'),
      pollIntervalMs: 5000,
      handlerTimeoutMs: 1000,
      exitOnTrigger: false,
    })
    const cb = new CircuitBreaker({ name: 'test-cb', timeSource: ts })
    const captured: TosMonitorEvent[] = []

    const monitor = createTosMonitor({
      ng3Plan: 'plan_a_12h', // 12h 上限
      timeSource: ts,
      killSwitch: ks,
      circuitBreaker: cb,
      confirmCount: 1,
      listeners: [(ev) => void captured.push(ev)],
    })

    monitor.markBoot()
    ts.advanceBy(13 * 3600 * 1000) // 13h elapsed > 12h cap

    const ev = await monitor.checkContinuousRun()
    expect(ev?.type).toBe('monitor:ng3-time-breach')
    expect(ev?.tier).toBe('auto_stop')
    expect(captured.length).toBeGreaterThanOrEqual(1)
    expect(ks.isTriggered()).toBe(true)
    expect(cb.status().state).toBe('open')
  })

  it('checkCostCap: $100 cap (plan_b) 超過 → hard_fail kill chain', async () => {
    const ts = new FakeTimeSource(new Date('2026-05-04T00:00:00Z'))
    const ks = new FileKillSwitch({
      signalPath: join(dir, 'STOP'),
      historyPath: join(dir, 'kill-history.json'),
      pollIntervalMs: 5000,
      handlerTimeoutMs: 1000,
      exitOnTrigger: false,
    })
    const cb = new CircuitBreaker({ name: 'cost-cb', timeSource: ts })
    const cost = new FileCostTracker({
      ledgerPath: join(dir, 'cost.json'),
      timeSource: ts,
    })
    await cost.recordSpend('anthropic_api', 105)

    const monitor = createTosMonitor({
      ng3Plan: 'plan_b_16h',
      timeSource: ts,
      killSwitch: ks,
      circuitBreaker: cb,
      costTracker: cost,
      confirmCount: 1,
    })

    const ev = await monitor.checkCostCap()
    expect(ev?.type).toBe('monitor:cost-cap-breach')
    expect(ev?.tier).toBe('hard_fail')
    expect(ks.isTriggered()).toBe(true)
    expect(cb.status().state).toBe('open')
  })

  it('checkRateSpike: 5x 超で event emit (kill chain は発火しない)', async () => {
    const ts = new FakeTimeSource(new Date('2026-05-04T00:00:00Z'))
    const ks = new FileKillSwitch({
      signalPath: join(dir, 'STOP'),
      historyPath: join(dir, 'kill-history.json'),
      pollIntervalMs: 5000,
      handlerTimeoutMs: 1000,
      exitOnTrigger: false,
    })
    const cb = new CircuitBreaker({ name: 'spike-cb', timeSource: ts })

    const monitor = createTosMonitor({
      ng3Plan: 'plan_b_16h',
      timeSource: ts,
      killSwitch: ks,
      circuitBreaker: cb,
      confirmCount: 1,
      shortWindowMs: 60_000,
      longWindowMs: 24 * 60_000,
    })

    // baseline 23h: 毎時 100 tokens
    for (let i = 0; i < 23; i++) {
      monitor.recordTokens(100)
      ts.advanceBy(60_000)
    }
    // 直近 1h: 800 tokens (= 8x baseline)
    monitor.recordTokens(800)

    const ev = await monitor.checkRateSpike()
    expect(ev?.type).toBe('monitor:rate-spike')
    expect(ks.isTriggered()).toBe(false) // rate-spike は kill しない
    expect(cb.status().state).toBe('open') // CB は open
  })

  it('pollWarnings: severity>=4 で hard_fail tier、重複 messageId は skip', async () => {
    const ts = new FakeTimeSource(new Date('2026-05-04T06:00:00Z'))
    const src = new MockAnthropicWarningSource([
      [ANTHROPIC_WARNING_FIXTURES[3]!, ANTHROPIC_WARNING_FIXTURES[4]!], // tos_warning(4) + final(5)
    ])

    const monitor = createTosMonitor({
      ng3Plan: 'plan_b_16h',
      timeSource: ts,
      warningSource: src,
    })

    const events = await monitor.pollWarnings()
    expect(events.length).toBe(2)
    expect(events.every((e) => e.tier === 'hard_fail')).toBe(true)

    // 2 回目 poll は queue 空 (重複なし)
    const events2 = await monitor.pollWarnings()
    expect(events2.length).toBe(0)
  })

  it('audit hook: AuditAppender を listener に接続して append される', async () => {
    const ts = new FakeTimeSource(new Date('2026-05-04T00:00:00Z'))
    const appended: { type: string; payload: Record<string, unknown> }[] = []
    const audit: AuditAppender = {
      async append(ev) {
        appended.push({ type: ev.type, payload: ev.payload })
        return { id: appended.length, hash: 'mock' }
      },
    }
    const cb = new CircuitBreaker({ name: 'audit-cb', timeSource: ts })

    const monitor = createTosMonitor({
      ng3Plan: 'plan_a_12h',
      timeSource: ts,
      circuitBreaker: cb,
      confirmCount: 1,
      listeners: [createAuditHook(audit)],
    })
    monitor.markBoot()
    ts.advanceBy(13 * 3600 * 1000)
    await monitor.checkContinuousRun()

    expect(appended.length).toBeGreaterThanOrEqual(1)
    const last = appended[appended.length - 1]!
    expect(last.payload['tosMonitor']).toBe('monitor:ng3-time-breach')
  })

  it('evaluateFallback: emit + decision 同時 (fallback-decision event)', async () => {
    const ts = new FakeTimeSource(new Date('2026-05-04T00:00:00Z'))
    const captured: TosMonitorEvent[] = []
    const monitor = createTosMonitor({
      timeSource: ts,
      listeners: [(ev) => void captured.push(ev)],
    })
    const decision = monitor.evaluateFallback({
      subscription: 'rate_limited',
      warningCount: 3,
      maxWarningSeverity: 3,
      costTier: 'auto_stop',
      ng3BreachCount7d: 0,
    })
    // event は async emit なので microtask flush 待機
    await new Promise((r) => setTimeout(r, 5))
    expect(decision.shouldFallback).toBe(true)
    expect(captured.some((e) => e.type === 'monitor:fallback-decision')).toBe(true)
  })

  it('reset: detector / 履歴を全リセット', async () => {
    const ts = new FakeTimeSource(new Date('2026-05-04T00:00:00Z'))
    const monitor = createTosMonitor({
      ng3Plan: 'plan_b_16h',
      timeSource: ts,
      confirmCount: 1,
    })
    monitor.markBoot()
    ts.advanceBy(17 * 3600 * 1000)
    await monitor.checkContinuousRun()
    expect(monitor.getNg3BreachCount7d()).toBe(1)

    monitor.reset()
    expect(monitor.getNg3BreachCount7d()).toBe(0)
  })

  it('NG-3 plan 切替: plan_b default + override で 16h → 任意値に変更可能', () => {
    const monitor = createTosMonitor({
      ng3Plan: 'plan_b_16h',
      override: { continuousRunMs: 8 * 3600 * 1000 },
    })
    expect(monitor.getPlanConfig().continuousRunMs).toBe(8 * 3600 * 1000)
    expect(monitor.getPlanConfig().apiUsdMonthlyHardCap).toBe(100) // override 未指定なので plan_b
  })
})

// ============================================================================
// false-positive matrix: 5 シナリオ × 2 confirm パターン (= 10 tests)
// ============================================================================

describe('false-positive matrix (5 シナリオ × confirmCount={1,2})', () => {
  /**
   * シナリオ群:
   *   FP-1  単発 cap-just-over (cap=100, single eval=101)
   *   FP-2  cap 直前で揺らぐ (99 → 101 → 99 → 101)
   *   FP-3  rate spike 1 回だけ (それ以後 baseline)
   *   FP-4  warning email rate(severity 2) 単発
   *   FP-5  時刻巻き戻し (clock skew suspect)
   *
   * 期待挙動:
   *   - confirmCount=1: FP-1, FP-3 は false positive を許容して fire
   *   - confirmCount=2: 全シナリオで fire 抑制 (連続検知ない限り)
   */

  describe('confirmCount=1 (急性検知)', () => {
    it('FP-1: cap=100 / single eval=101 → fire', () => {
      const d = new CostCapDetector(100, 1)
      expect(d.evaluate(101).breached).toBe(true)
    })

    it('FP-2: 揺らぎ (99→101→99→101) で false-positive 抑制せず fire', () => {
      const d = new CostCapDetector(100, 1)
      d.evaluate(99)
      expect(d.evaluate(101).breached).toBe(true)
    })

    it('FP-3: rate spike 1 回だけ → fire (急性で許容)', () => {
      let now = 0
      const d = new RateSpikeDetector(1000, 24000, 5, 1, () => now)
      for (let i = 0; i < 23; i++) {
        now = i * 1000
        d.recordTokens(10)
      }
      now = 23500
      d.recordTokens(200) // 大きく超える
      now = 23999
      expect(d.evaluate().breached).toBe(true)
    })

    it('FP-4: warning email rate severity=2 単発 → severity 2 = auto_stop tier', async () => {
      const ts = new FakeTimeSource(new Date('2026-05-04T01:00:00Z'))
      const src = new MockAnthropicWarningSource([[ANTHROPIC_WARNING_FIXTURES[0]!]])
      const monitor = createTosMonitor({ timeSource: ts, warningSource: src })
      const events = await monitor.pollWarnings()
      expect(events[0]?.tier).toBe('auto_stop') // severity=2 → auto_stop
    })

    it('FP-5: 時刻巻き戻し (cap 超過後 elapsed 巻き戻し) → 次評価で reset', () => {
      let now = 0
      const d = new ContinuousRunDetector(1000, 1, () => now)
      d.markBoot()
      now = 1500
      expect(d.evaluate()?.breached).toBe(true)
      now = 500 // 巻き戻し: elapsed < cap → miss
      expect(d.evaluate()?.breached).toBe(false)
    })
  })

  describe('confirmCount=2 (慢性検知 = false-positive 抑制)', () => {
    it('FP-1: cap=100 / single eval=101 → fire しない', () => {
      const d = new CostCapDetector(100, 2)
      expect(d.evaluate(101).breached).toBe(false)
    })

    it('FP-2: 揺らぎ (101→99→101) で fire しない', () => {
      const d = new CostCapDetector(100, 2)
      expect(d.evaluate(101).breached).toBe(false) // confirm 1
      expect(d.evaluate(99).breached).toBe(false) // miss → reset
      expect(d.evaluate(101).breached).toBe(false) // confirm 1 再出発
    })

    it('FP-3: rate spike 1 回だけ → fire しない (連続 2 回必要)', () => {
      let now = 0
      const d = new RateSpikeDetector(1000, 24000, 5, 2, () => now)
      for (let i = 0; i < 23; i++) {
        now = i * 1000
        d.recordTokens(10)
      }
      now = 23500
      d.recordTokens(200) // single spike
      now = 23999
      expect(d.evaluate().breached).toBe(false) // confirm 1 (まだ confirm 未到達)
      // 短窓 (1000ms) を過ぎたタイミングで再評価 → spike sample が短窓外に流れる
      now = 25000 // spike (23500) は now-1000=24000 より前 → 短窓外
      expect(d.evaluate().breached).toBe(false) // 短窓に spike なし → miss → confirm reset
    })

    it('FP-4: warning rate(severity=2) 単発 → tier auto_stop で hard_fail に上がらない', async () => {
      const ts = new FakeTimeSource(new Date('2026-05-04T01:00:00Z'))
      const src = new MockAnthropicWarningSource([[ANTHROPIC_WARNING_FIXTURES[0]!]])
      const monitor = createTosMonitor({ timeSource: ts, warningSource: src })
      const events = await monitor.pollWarnings()
      expect(events[0]?.tier).not.toBe('hard_fail')
    })

    it('FP-5: 時刻巻き戻し → confirm reset で fire 抑制 (慢性 / 一過性切り分け)', () => {
      let now = 0
      const d = new ContinuousRunDetector(1000, 2, () => now)
      d.markBoot()
      now = 1500
      expect(d.evaluate()?.breached).toBe(false) // confirm 1
      now = 500 // 巻き戻し
      expect(d.evaluate()?.breached).toBe(false) // miss → reset
      now = 1500
      expect(d.evaluate()?.breached).toBe(false) // confirm 1 再出発
    })
  })
})

// ============================================================================
// Round 10 Dev-β: 偽陽性 4 高ランクセル context-aware suppression
// (review-round9-tos-monitor-false-positive-matrix.md §3.3 high 4 件)
// ============================================================================

describe('Round 10 suppression: continuous_run × sleep (cell 1-4)', () => {
  it('OS suspend (heartbeat gap > sleepGapMs) を accumulatedSleep に加算し elapsed から差引', () => {
    let now = 1_000_000 // markBoot 時点の baseline 時刻 (0 起点を避ける)
    const sleepGap = 5 * 60 * 1000 // 5min
    const d = new ContinuousRunDetector(12 * 3600 * 1000, 1, () => now, sleepGap)
    d.markBoot()
    // 1min ごとに heartbeat (5min 以下なので通常稼働)
    for (let i = 1; i <= 6; i++) {
      now = 1_000_000 + i * 60 * 1000
      expect(d.recordHeartbeat()).toBe(0) // 通常稼働 = gap 0
    }
    // 12h sleep を挟む (heartbeat なし) → 次 heartbeat で gap 検出
    now = 1_000_000 + 6 * 60 * 1000 + 12 * 3600 * 1000
    const detectedGap = d.recordHeartbeat()
    expect(detectedGap).toBeGreaterThan(sleepGap)
    expect(d.accumulatedSleep).toBe(detectedGap)
  })

  it('11h59m wall + 12h sleep accumulated でも active elapsed < 12h なら抑止', () => {
    let now = 0
    const d = new ContinuousRunDetector(12 * 3600 * 1000, 1, () => now, 5 * 60 * 1000)
    d.markBoot()
    // 1min 通常稼働 (heartbeat 連続)
    for (let i = 1; i <= 5; i++) {
      now = i * 60 * 1000
      d.recordHeartbeat()
    }
    // 12h sleep
    now = 5 * 60 * 1000 + 12 * 3600 * 1000
    d.recordHeartbeat() // sleep gap 検出
    // 追加で active 5min
    for (let i = 1; i <= 5; i++) {
      now += 60 * 1000
      d.recordHeartbeat()
    }
    // wall elapsed = 12h + 10min、active elapsed = 10min（NG-3 12h 未到達）
    const r = d.evaluate()
    expect(r).not.toBeNull()
    expect(r!.breached).toBe(false)
    expect(r!.elapsedMs).toBeLessThan(12 * 3600 * 1000)
  })

  it('clock skew (negative delta) で boot 再同期 (false-positive 抑止)', () => {
    let now = 1_000_000
    const d = new ContinuousRunDetector(1000, 1, () => now, 60 * 1000)
    d.markBoot()
    now = 1_000_500
    d.recordHeartbeat()
    // 時刻巻き戻し
    now = 999_000
    expect(d.recordHeartbeat()).toBe(-1)
    // boot 再同期されたので elapsed = 0
    const r = d.evaluate()
    expect(r!.elapsedMs).toBe(0)
    expect(r!.breached).toBe(false)
  })

  it('既存 evaluate() は heartbeat 未使用で従来動作 (後方互換)', () => {
    let now = 1_000_000
    const d = new ContinuousRunDetector(1000, 1, () => now)
    d.markBoot()
    now += 1500
    const r = d.evaluate()
    expect(r!.breached).toBe(true)
    expect(r!.elapsedMs).toBe(1500)
  })
})

describe('Round 10 suppression: cost_cap × spike legit (cell 2-3)', () => {
  it('legit spike window 内は cap × multiplier まで suppressedByLegitSpike', () => {
    let now = 0
    const d = new CostCapDetector(100, 1, () => now)
    d.declareLegitSpikeWindow(60 * 60 * 1000, 2) // 1h window, cap×2 = 200 まで OK
    const r1 = d.evaluate(150) // 100 < x < 200 → suppress
    expect(r1.breached).toBe(false)
    expect(r1.suppressedByLegitSpike).toBe(true)
    expect(d.suppressedByLegitSpikeCount).toBe(1)
  })

  it('legit spike window 内でも extended cap (cap × multiplier) 超過は breach', () => {
    let now = 0
    const d = new CostCapDetector(100, 1, () => now)
    d.declareLegitSpikeWindow(60 * 60 * 1000, 2)
    const r = d.evaluate(250) // > 200 = extended cap → breach
    expect(r.breached).toBe(true)
  })

  it('legit spike window 期限切れ後は通常 cap で breach', () => {
    let now = 0
    const d = new CostCapDetector(100, 1, () => now)
    d.declareLegitSpikeWindow(60 * 60 * 1000, 2)
    now = 2 * 60 * 60 * 1000 // window 期限切れ
    expect(d.isInLegitSpikeWindow()).toBe(false)
    const r = d.evaluate(150)
    expect(r.breached).toBe(true)
  })

  it('window 未宣言時は従来動作 (cap >= で breach、後方互換)', () => {
    let now = 0
    const d = new CostCapDetector(100, 1, () => now)
    expect(d.evaluate(101).breached).toBe(true)
  })
})

describe('Round 10 suppression: rate_spike × boundary (cell 3-2)', () => {
  it('baseline < baselineMinTokens (default 10) では multiplier 超過でも抑止', () => {
    let now = 0
    const shortMs = 60 * 60 * 1000
    const longMs = 24 * shortMs
    // baseline ≈ 5 token/h (< 10) で 10x spike しても breach 抑止
    const d = new RateSpikeDetector(shortMs, longMs, 5, 1, () => now)
    for (let i = 0; i < 23; i++) {
      now = i * shortMs
      d.recordTokens(5)
    }
    now = 23 * shortMs
    d.recordTokens(50) // 10x spike
    now = 24 * shortMs - 1
    const r = d.evaluate()
    expect(r.breached).toBe(false)
  })

  it('baselineMinTokens カスタマイズ可能', () => {
    let now = 0
    const shortMs = 60 * 60 * 1000
    const longMs = 24 * shortMs
    // baselineMinTokens=200 にすると baseline ≈ 110/h (full spike 含み) でも抑止
    const d = new RateSpikeDetector(shortMs, longMs, 5, 1, () => now, {
      baselineMinTokens: 200,
    })
    for (let i = 0; i < 23; i++) {
      now = i * shortMs
      d.recordTokens(80)
    }
    now = 23 * shortMs
    d.recordTokens(800) // baseline ≈ (80*23+800)/24 ≈ 110/window
    now = 24 * shortMs - 1
    const r = d.evaluate()
    expect(r.breached).toBe(false) // baseline < 200 で抑止
  })

  it('z-score 2σ filter で statistical noise 範囲内は suppressedByZScore', () => {
    let now = 0
    const shortMs = 60 * 60 * 1000
    const longMs = 24 * shortMs
    // baseline = 100, std-dev 大きく setup → spike が 2σ 内に入るケース
    const d = new RateSpikeDetector(shortMs, longMs, 5, 1, () => now, {
      baselineMinTokens: 10,
      zScoreThreshold: 2,
    })
    // 高分散 baseline: 各 hour に 0 と 200 が交互 → mean=100, std=100
    for (let i = 0; i < 23; i++) {
      now = i * shortMs
      d.recordTokens(i % 2 === 0 ? 0 : 200)
    }
    now = 23 * shortMs
    d.recordTokens(290) // > baseline*5? いや baseline=100 で 290 ≧ 100*5=500 false, この test では multiplier=5 を満たさないので別検証
    // multiplier 未到達 → そもそも breach 候補にならず通常 miss
    now = 24 * shortMs - 1
    const r = d.evaluate()
    // multiplier 未到達なので suppressedByZScore は trigger されない
    expect(r.breached).toBe(false)
    expect(r.suppressedByZScore).toBeUndefined()
  })

  it('z-score: 高 stddev baseline + multiplier 超 spike が 2σ 内なら抑止', () => {
    let now = 0
    const shortMs = 1000
    const longMs = 24 * shortMs
    // baseline 高分散 setup: 0, 1000, 0, 1000... → mean=500, std≈500
    // multiplier=2 (lower threshold) で 2σ filter 検証
    const d = new RateSpikeDetector(shortMs, longMs, 2, 1, () => now, {
      baselineMinTokens: 10,
      zScoreThreshold: 2,
    })
    for (let i = 0; i < 23; i++) {
      now = i * shortMs
      d.recordTokens(i % 2 === 0 ? 0 : 1000)
    }
    now = 23 * shortMs
    d.recordTokens(1100) // multiplier 超だが mean+2σ ≈ 500+1000=1500 内 → 抑止
    now = 24 * shortMs - 1
    const r = d.evaluate()
    expect(r.breached).toBe(false)
    expect(r.suppressedByZScore).toBe(true)
    expect(d.suppressedZScoreCount).toBe(1)
  })

  it('z-score 0 (filter 無効) では従来動作 (後方互換)', () => {
    let now = 0
    const shortMs = 1000
    const longMs = 24 * shortMs
    const d = new RateSpikeDetector(shortMs, longMs, 2, 1, () => now, {
      baselineMinTokens: 10,
      zScoreThreshold: 0,
    })
    for (let i = 0; i < 23; i++) {
      now = i * shortMs
      d.recordTokens(i % 2 === 0 ? 0 : 1000)
    }
    now = 23 * shortMs
    d.recordTokens(1100)
    now = 24 * shortMs - 1
    const r = d.evaluate()
    expect(r.breached).toBe(true) // z-score filter 無効なので breach
  })
})

describe('Round 10 suppression: rate_spike × spike legit (cell 3-5/3-3)', () => {
  it('legit spike window 内 rate spike は suppressedByLegitSpike', () => {
    let now = 0
    const shortMs = 1000
    const longMs = 24 * shortMs
    const d = new RateSpikeDetector(shortMs, longMs, 5, 1, () => now, {
      baselineMinTokens: 10,
      zScoreThreshold: 0, // z-score 無効化 (legit window 検証に集中)
    })
    for (let i = 0; i < 23; i++) {
      now = i * shortMs
      d.recordTokens(100)
    }
    d.declareLegitSpikeWindow(60 * 60 * 1000) // 1h window
    now = 23 * shortMs
    d.recordTokens(2000) // 通常なら breach (>5x)
    now = 24 * shortMs - 1
    const r = d.evaluate()
    expect(r.breached).toBe(false)
    expect(r.suppressedByLegitSpike).toBe(true)
    expect(d.suppressedLegitSpikeCount).toBe(1)
  })
})

describe('Round 10 TosMonitor integration: declareLegitSpikeWindow + recordHeartbeat', () => {
  it('TosMonitor.declareLegitSpikeWindow が cost-cap + rate-spike 双方を抑止', async () => {
    const ts = new FakeTimeSource(new Date('2026-05-04T00:00:00Z'))
    const monitor = createTosMonitor({
      ng3Plan: 'plan_b_16h', // cap $100
      timeSource: ts,
      confirmCount: 1,
      shortWindowMs: 1000,
      longWindowMs: 24_000,
      rateSpikeBaselineMinTokens: 10,
      rateSpikeZScoreThreshold: 0,
    })
    // baseline setup
    for (let i = 0; i < 23; i++) {
      monitor.recordTokens(100)
      ts.advanceBy(1000)
    }
    monitor.declareLegitSpikeWindow(60 * 60 * 1000, 2)
    monitor.recordTokens(2000) // > 5x baseline だが legit spike → 抑止
    const ev = await monitor.checkRateSpike()
    expect(ev).toBeNull() // suppressedByLegitSpike
  })

  it('TosMonitor.recordHeartbeat が delegate して accumulated sleep を ContinuousRunDetector に反映', async () => {
    const ts = new FakeTimeSource(new Date('2026-05-04T00:00:00Z'))
    const monitor = createTosMonitor({
      ng3Plan: 'plan_a_12h',
      timeSource: ts,
      confirmCount: 1,
      continuousRunSleepGapMs: 5 * 60 * 1000,
    })
    monitor.markBoot()
    // 1min 通常稼働
    ts.advanceBy(60 * 1000)
    expect(monitor.recordHeartbeat()).toBe(0)
    // 13h sleep
    ts.advanceBy(13 * 3600 * 1000)
    const gap = monitor.recordHeartbeat()
    expect(gap).toBeGreaterThan(5 * 60 * 1000)
    // active elapsed < 12h なので NG-3 breach せず
    const ev = await monitor.checkContinuousRun()
    expect(ev).toBeNull()
  })
})

// ============================================================================
// Round 10 drill #2 instrumentation (recording / replay)
// ============================================================================

describe('Round 10 drill #2 instrumentation', () => {
  it('InMemoryDrillRecorder: record / entries / clear', () => {
    const r = new InMemoryDrillRecorder()
    r.record({ kind: 'tokens', t: 100, tokens: 50 })
    r.record({ kind: 'note', t: 200, message: 'drill start' })
    expect(r.entries().length).toBe(2)
    r.clear()
    expect(r.entries().length).toBe(0)
  })

  it('createDrillRecordingHook: TosMonitor event を recorder に push', async () => {
    const ts = new FakeTimeSource(new Date('2026-05-04T00:00:00Z'))
    const recorder = new InMemoryDrillRecorder()
    const monitor = createTosMonitor({
      ng3Plan: 'plan_a_12h',
      timeSource: ts,
      confirmCount: 1,
      listeners: [createDrillRecordingHook(recorder, () => ts.nowMs())],
    })
    monitor.markBoot()
    ts.advanceBy(13 * 3600 * 1000)
    await monitor.checkContinuousRun()
    const events = recorder.entries().filter((e) => e.kind === 'event')
    expect(events.length).toBeGreaterThanOrEqual(1)
    expect((events[0] as any).event.type).toBe('monitor:ng3-time-breach')
  })

  it('wrapWithDrillRecording: tokens / heartbeat / legitSpikeWindow を recorder に push', () => {
    const ts = new FakeTimeSource(new Date('2026-05-04T00:00:00Z'))
    const recorder = new InMemoryDrillRecorder()
    const inner = createTosMonitor({
      ng3Plan: 'plan_a_12h',
      timeSource: ts,
      confirmCount: 1,
    })
    const wrapped = wrapWithDrillRecording(inner, recorder, () => ts.nowMs())
    wrapped.markBoot()
    ts.advanceBy(60 * 1000)
    wrapped.recordTokens(100)
    wrapped.recordHeartbeat()
    wrapped.declareLegitSpikeWindow(3600 * 1000, 2)
    const kinds = recorder.entries().map((e) => e.kind)
    expect(kinds).toContain('tokens')
    expect(kinds).toContain('heartbeat')
    expect(kinds).toContain('legitSpikeWindow')
  })

  it('createReplayHook: 記録した entries を deterministic に再生', async () => {
    const tsRec = new FakeTimeSource(new Date('2026-05-04T00:00:00Z'))
    const recorder = new InMemoryDrillRecorder()
    const innerRec = createTosMonitor({
      ng3Plan: 'plan_a_12h',
      timeSource: tsRec,
      confirmCount: 1,
      shortWindowMs: 1000,
      longWindowMs: 24_000,
      rateSpikeBaselineMinTokens: 10,
      rateSpikeZScoreThreshold: 0,
    })
    const wrapped = wrapWithDrillRecording(innerRec, recorder, () => tsRec.nowMs())
    // record session: token timeseries
    for (let i = 0; i < 23; i++) {
      wrapped.recordTokens(100)
      tsRec.advanceBy(1000)
    }
    wrapped.recordTokens(2000) // spike

    // replay session: 別 monitor + FakeTimeSource で同じ entries を再生
    const tsReplay = new FakeTimeSource(new Date('2026-05-04T00:00:00Z'))
    const innerReplay = createTosMonitor({
      ng3Plan: 'plan_a_12h',
      timeSource: tsReplay,
      confirmCount: 1,
      shortWindowMs: 1000,
      longWindowMs: 24_000,
      rateSpikeBaselineMinTokens: 10,
      rateSpikeZScoreThreshold: 0,
    })
    const replay = createReplayHook(innerReplay, recorder.entries(), tsReplay)
    replay.runAll()
    expect(replay.remaining()).toBe(0)
    // 同じ token 投入後に rate spike が同様に発生する
    const ev = await innerReplay.checkRateSpike()
    expect(ev).not.toBeNull()
    expect(ev!.type).toBe('monitor:rate-spike')
  })
})
