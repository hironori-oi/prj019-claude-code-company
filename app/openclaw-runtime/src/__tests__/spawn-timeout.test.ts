/**
 * spawn-timeout.test — Round 7 W0-Week1 prefetch (G-02):
 *   spawn timeout → SIGTERM → 5 秒 grace → SIGKILL fallback +
 *   circuit-breaker open 連鎖の単体テスト。
 *
 * カバー範囲:
 *   1. timeout 内に自然終了する場合 SIGTERM/SIGKILL は送らず circuit も open しない
 *   2. timeout 経過で SIGTERM 送信、grace 内に die すれば SIGKILL は不要
 *   3. SIGTERM を無視する subprocess は grace 経過で SIGKILL に escalate + circuit open
 */
import { describe, it, expect } from 'vitest'
import {
  buildSpawnContract,
  enforceSpawnTimeout,
  DEFAULT_SPAWN_TIMEOUT_MS,
  DEFAULT_TIMEOUT_GRACE_MS,
  type TimeoutTarget,
  type TimeoutCircuitBreaker,
} from '../index.js'

class FakeProcess implements TimeoutTarget {
  private aliveFlag = true
  private dieAfterSigterm: boolean
  /** ms 後に自然終了 */
  private dieAtMs: number | null
  signals: ('SIGTERM' | 'SIGKILL')[] = []

  constructor(opts: { dieAfterSigterm?: boolean; dieAtMs?: number | null } = {}) {
    this.dieAfterSigterm = opts.dieAfterSigterm ?? false
    this.dieAtMs = opts.dieAtMs ?? null
    if (this.dieAtMs !== null) {
      setTimeout(() => {
        this.aliveFlag = false
      }, this.dieAtMs)
    }
  }

  alive(): boolean {
    return this.aliveFlag
  }

  signal(sig: 'SIGTERM' | 'SIGKILL'): void {
    this.signals.push(sig)
    if (sig === 'SIGKILL') this.aliveFlag = false
    if (sig === 'SIGTERM' && this.dieAfterSigterm) this.aliveFlag = false
  }
}

class FakeBreaker implements TimeoutCircuitBreaker {
  opens: string[] = []
  forceOpen(reason?: string): void {
    this.opens.push(reason ?? '')
  }
}

describe('G-02: enforceSpawnTimeout', () => {
  it('exposes default 10 分 / 5 秒 constants and contract requires both', () => {
    expect(DEFAULT_SPAWN_TIMEOUT_MS).toBe(600_000)
    expect(DEFAULT_TIMEOUT_GRACE_MS).toBe(5_000)
    const c = buildSpawnContract({
      command: '/bin/x',
      envAllowList: [],
      envSource: {},
    })
    expect(c.timeoutMs).toBe(600_000)
    expect(c.timeoutGraceMs).toBe(5_000)
  })

  it('process が timeout 前に終了すれば signal 送信ゼロ + circuit 未 open', async () => {
    const target = new FakeProcess({ dieAtMs: 30 })
    const breaker = new FakeBreaker()
    const contract = buildSpawnContract({
      command: '/bin/x',
      envAllowList: [],
      envSource: {},
      timeoutMs: 500,
      timeoutGraceMs: 100,
    })
    const r = await enforceSpawnTimeout({ contract, target, circuitBreaker: breaker })
    expect(r.outcome).toBe('completed')
    expect(r.signalsSent).toEqual([])
    expect(r.circuitOpened).toBe(false)
    expect(breaker.opens).toEqual([])
  })

  it('SIGTERM で素直に die する場合 SIGKILL は送られないが circuit は open', async () => {
    const target = new FakeProcess({ dieAfterSigterm: true })
    const breaker = new FakeBreaker()
    const contract = buildSpawnContract({
      command: '/bin/x',
      envAllowList: [],
      envSource: {},
      timeoutMs: 60,
      timeoutGraceMs: 100,
    })
    const r = await enforceSpawnTimeout({ contract, target, circuitBreaker: breaker })
    expect(r.outcome).toBe('sigterm')
    expect(r.signalsSent).toEqual(['SIGTERM'])
    expect(r.circuitOpened).toBe(true)
    expect(breaker.opens[0]).toMatch(/spawn-timeout/)
  })

  it('SIGTERM を無視するプロセスは grace 経過で SIGKILL escalate + circuit open', async () => {
    const target = new FakeProcess({ dieAfterSigterm: false })
    const breaker = new FakeBreaker()
    const contract = buildSpawnContract({
      command: '/bin/stubborn',
      envAllowList: [],
      envSource: {},
      timeoutMs: 50,
      timeoutGraceMs: 80,
    })
    const r = await enforceSpawnTimeout({ contract, target, circuitBreaker: breaker })
    expect(r.outcome).toBe('sigkill')
    expect(r.signalsSent).toEqual(['SIGTERM', 'SIGKILL'])
    expect(r.circuitOpened).toBe(true)
    expect(target.alive()).toBe(false)
  })
})
