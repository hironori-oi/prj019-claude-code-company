/**
 * kill-chain.test — Round 6 W0-Week2 4 日前倒し:
 *   G-05 (subprocess kill SIGTERM → SIGKILL fallback) と
 *   G-06 (circuit-breaker open 連動) の統合テスト。
 *
 * 関連:
 *   - DEC-019-006 P-D 改 (subprocess spawn 経由)
 *   - 議決-25 採択前提 Phase 1 W1 ハードガード前倒し
 *
 * カバー範囲:
 *   1. trigger 検知時 → CB open → subprocess kill の順序が保たれる
 *   2. SIGTERM で gracefully 終了する場合は SIGKILL を発射しない
 *   3. SIGTERM 後も alive な場合は gracePeriodMs 経過後 SIGKILL に escalate する
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  CircuitBreaker,
  CircuitOpenError,
  FileKillSwitch,
  type SubprocessKillTarget,
} from '../index.js'

function tmpDir(): string {
  return join(tmpdir(), `clawbridge-killchain-${Date.now()}-${Math.random().toString(36).slice(2)}`)
}

/** SIGTERM で素直に死ぬ fake subprocess */
class FakeGracefulSubprocess implements SubprocessKillTarget {
  name: string
  private aliveFlag = true
  signals: ('SIGTERM' | 'SIGKILL')[] = []
  gracePeriodMs = 100

  constructor(name = 'fake-graceful') {
    this.name = name
  }

  alive(): boolean {
    return this.aliveFlag
  }

  signal(sig: 'SIGTERM' | 'SIGKILL'): void {
    this.signals.push(sig)
    if (sig === 'SIGTERM') {
      // grace 期間内に die する
      this.aliveFlag = false
    }
    if (sig === 'SIGKILL') {
      this.aliveFlag = false
    }
  }
}

/** SIGTERM を無視し SIGKILL でしか死なない fake subprocess */
class FakeStubbornSubprocess implements SubprocessKillTarget {
  name: string
  private aliveFlag = true
  signals: ('SIGTERM' | 'SIGKILL')[] = []
  gracePeriodMs = 100

  constructor(name = 'fake-stubborn') {
    this.name = name
  }

  alive(): boolean {
    return this.aliveFlag
  }

  signal(sig: 'SIGTERM' | 'SIGKILL'): void {
    this.signals.push(sig)
    if (sig === 'SIGKILL') {
      this.aliveFlag = false
    }
    // SIGTERM は無視 (alive のまま)
  }
}

describe('G-05/G-06: kill-chain 統合', () => {
  let dir: string
  let signalPath: string
  let historyPath: string
  let ks: FileKillSwitch

  beforeEach(async () => {
    dir = tmpDir()
    await fs.mkdir(dir, { recursive: true })
    signalPath = join(dir, 'STOP')
    historyPath = join(dir, 'kill-history.json')
    ks = new FileKillSwitch({
      signalPath,
      historyPath,
      pollIntervalMs: 5000,
      handlerTimeoutMs: 1000,
      exitOnTrigger: false,
    })
  })

  afterEach(async () => {
    await ks.disarm()
    try {
      await fs.rm(dir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  })

  it('trigger 検知時に circuit-breaker が open に強制遷移する (G-06)', async () => {
    const cb = new CircuitBreaker({ name: 'openclaw-spawn', failureThreshold: 5 })
    expect(cb.status().state).toBe('closed')

    ks.registerCircuitBreakerOpen(cb)
    await ks.arm()
    await ks.trigger('budget exceeded', { source: 'budget' })

    expect(cb.status().state).toBe('open')
    // open 状態では fire が CircuitOpenError で即拒否
    await expect(cb.fire(async () => 'should-not-run')).rejects.toBeInstanceOf(CircuitOpenError)
  })

  it('subprocess が SIGTERM で gracefully 終了する場合 SIGKILL は発射されない (G-05)', async () => {
    const sub = new FakeGracefulSubprocess()
    ks.registerSubprocessKill(sub)
    await ks.arm()
    await ks.trigger('test', { source: 'manual' })

    expect(sub.signals).toEqual(['SIGTERM'])
    expect(sub.alive()).toBe(false)
  })

  it('subprocess が SIGTERM を無視する場合 gracePeriodMs 経過後 SIGKILL に escalate (G-05)', async () => {
    const sub = new FakeStubbornSubprocess()
    sub.gracePeriodMs = 50 // テスト時間短縮
    ks.registerSubprocessKill(sub)
    await ks.arm()
    await ks.trigger('test', { source: 'manual' })

    expect(sub.signals).toEqual(['SIGTERM', 'SIGKILL'])
    expect(sub.alive()).toBe(false)
  })

  it('CB open → subprocess kill の順序: 連鎖統合', async () => {
    const cb = new CircuitBreaker({ name: 'openclaw-spawn', failureThreshold: 5 })
    const sub = new FakeGracefulSubprocess()

    const order: string[] = []
    const originalForceOpen = cb.forceOpen.bind(cb)
    cb.forceOpen = (reason?: string) => {
      order.push('cb-open')
      originalForceOpen(reason)
    }
    const originalSignal = sub.signal.bind(sub)
    sub.signal = (sig: 'SIGTERM' | 'SIGKILL') => {
      order.push(`signal:${sig}`)
      originalSignal(sig)
    }

    ks.registerCircuitBreakerOpen(cb)
    ks.registerSubprocessKill(sub)
    await ks.arm()
    await ks.trigger('chain test', { source: 'budget' })

    // CB open が subprocess kill より先
    expect(order[0]).toBe('cb-open')
    expect(order).toContain('signal:SIGTERM')
    expect(cb.status().state).toBe('open')
    expect(sub.alive()).toBe(false)
  })

  it('複数 subprocess を登録した場合、全件に SIGTERM が送られる (G-05)', async () => {
    const sub1 = new FakeGracefulSubprocess('sub1')
    const sub2 = new FakeGracefulSubprocess('sub2')
    const sub3 = new FakeGracefulSubprocess('sub3')
    ks.registerSubprocessKill(sub1)
    ks.registerSubprocessKill(sub2)
    ks.registerSubprocessKill(sub3)
    await ks.arm()
    await ks.trigger('multi test', { source: 'manual' })

    expect(sub1.signals).toEqual(['SIGTERM'])
    expect(sub2.signals).toEqual(['SIGTERM'])
    expect(sub3.signals).toEqual(['SIGTERM'])
  })
})
