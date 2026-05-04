/**
 * kill-switch-subprocess-wiring.test — Round 12 Dev-D 着地 (Task A):
 *   registerSubprocessKill の KillToken 戻り値 + unregister + SIGTERM/SIGKILL fallback +
 *   limit 超過の検証。
 *
 * 既存 kill-chain.test.ts (Round 6 G-05/G-06) は無改変で互換維持を確認すべく、
 * 本 test は新規 fixture のみで構成 (FakeGracefulSubprocess / FakeStubbornSubprocess
 * は再定義し、Round 12 default gracePeriodMs=200ms 短縮を検証)。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  FileKillSwitch,
  KillSwitchError,
  SUBPROCESS_KILL_LIMIT,
  type SubprocessKillTarget,
  type KillToken,
} from '../index.js'

function tmpDir(): string {
  return join(tmpdir(), `clawbridge-killwiring-${Date.now()}-${Math.random().toString(36).slice(2)}`)
}

class FakeGraceful implements SubprocessKillTarget {
  name: string
  private aliveFlag = true
  signals: ('SIGTERM' | 'SIGKILL')[] = []
  gracePeriodMs?: number
  constructor(name = 'g', grace?: number) {
    this.name = name
    if (grace !== undefined) this.gracePeriodMs = grace
  }
  alive(): boolean {
    return this.aliveFlag
  }
  signal(sig: 'SIGTERM' | 'SIGKILL'): void {
    this.signals.push(sig)
    this.aliveFlag = false
  }
}

class FakeStubborn implements SubprocessKillTarget {
  name: string
  private aliveFlag = true
  signals: ('SIGTERM' | 'SIGKILL')[] = []
  gracePeriodMs?: number
  constructor(name = 's', grace?: number) {
    this.name = name
    if (grace !== undefined) this.gracePeriodMs = grace
  }
  alive(): boolean {
    return this.aliveFlag
  }
  signal(sig: 'SIGTERM' | 'SIGKILL'): void {
    this.signals.push(sig)
    if (sig === 'SIGKILL') this.aliveFlag = false
    // SIGTERM は無視
  }
}

describe('Round 12 Dev-D Task A: registerSubprocessKill wiring', () => {
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

  it('1. registerSubprocessKill が KillToken (id + unregister) を返す', () => {
    const t = ks.registerSubprocessKill(new FakeGraceful('a'))
    expect(typeof t.id).toBe('string')
    expect(t.id.startsWith('kt-')).toBe(true)
    expect(typeof t.unregister).toBe('function')
  })

  it('2. KillToken.unregister() で当該 target が以後の trigger で kill されない', async () => {
    const a = new FakeGraceful('a')
    const b = new FakeGraceful('b')
    const ta: KillToken = ks.registerSubprocessKill(a)
    ks.registerSubprocessKill(b)
    ta.unregister()

    await ks.arm()
    await ks.trigger('test', { source: 'manual' })

    expect(a.signals).toEqual([]) // 解除済
    expect(b.signals).toEqual(['SIGTERM'])
  })

  it('3. KillToken.unregister() は 二重呼び safe (idempotent)', () => {
    const t = ks.registerSubprocessKill(new FakeGraceful('a'))
    expect(() => t.unregister()).not.toThrow()
    expect(() => t.unregister()).not.toThrow()
    expect(() => t.unregister()).not.toThrow()
    expect(ks.getRegisteredSubprocessCount()).toBe(0)
  })

  it('4. trigger 時に登録済全 SpawnHandle へ SIGTERM 一斉送信', async () => {
    const a = new FakeGraceful('a')
    const b = new FakeGraceful('b')
    const c = new FakeGraceful('c')
    ks.registerSubprocessKill(a)
    ks.registerSubprocessKill(b)
    ks.registerSubprocessKill(c)

    await ks.arm()
    await ks.trigger('chain', { source: 'manual' })

    expect(a.signals).toEqual(['SIGTERM'])
    expect(b.signals).toEqual(['SIGTERM'])
    expect(c.signals).toEqual(['SIGTERM'])
  })

  it('5. SIGTERM 後 200ms grace 経過しても alive な target に SIGKILL fallback', async () => {
    const stubborn = new FakeStubborn('s', 50) // grace 50ms (test 短縮)
    ks.registerSubprocessKill(stubborn)
    await ks.arm()
    await ks.trigger('test', { source: 'manual' })
    expect(stubborn.signals).toEqual(['SIGTERM', 'SIGKILL'])
  })

  it('6. graceful target は SIGTERM のみで完了 (SIGKILL 不要)', async () => {
    const g = new FakeGraceful('g', 50)
    ks.registerSubprocessKill(g)
    await ks.arm()
    await ks.trigger('test', { source: 'manual' })
    expect(g.signals).toEqual(['SIGTERM'])
  })

  it('7. mixed (graceful + stubborn) は順次 graceful=SIGTERM only / stubborn=SIGTERM+SIGKILL', async () => {
    const g = new FakeGraceful('g', 50)
    const s = new FakeStubborn('s', 50)
    ks.registerSubprocessKill(g)
    ks.registerSubprocessKill(s)
    await ks.arm()
    await ks.trigger('test', { source: 'manual' })
    expect(g.signals).toEqual(['SIGTERM'])
    expect(s.signals).toEqual(['SIGTERM', 'SIGKILL'])
  })

  it('8. 同時 256 subprocess 登録は OK、257 件目で KillSwitchError throw', () => {
    const tokens: KillToken[] = []
    for (let i = 0; i < SUBPROCESS_KILL_LIMIT; i++) {
      tokens.push(ks.registerSubprocessKill(new FakeGraceful(`t${i}`)))
    }
    expect(ks.getRegisteredSubprocessCount()).toBe(SUBPROCESS_KILL_LIMIT)
    expect(() => ks.registerSubprocessKill(new FakeGraceful('over'))).toThrow(KillSwitchError)
    try {
      ks.registerSubprocessKill(new FakeGraceful('over2'))
    } catch (err) {
      expect(err).toBeInstanceOf(KillSwitchError)
      expect((err as KillSwitchError).code).toBe('subprocess_limit_exceeded')
    }
  })

  it('9. limit 超過後 unregister すれば再登録可能', () => {
    const tokens: KillToken[] = []
    for (let i = 0; i < SUBPROCESS_KILL_LIMIT; i++) {
      tokens.push(ks.registerSubprocessKill(new FakeGraceful(`t${i}`)))
    }
    expect(() => ks.registerSubprocessKill(new FakeGraceful('over'))).toThrow(KillSwitchError)

    // 1 件 unregister
    tokens[0]!.unregister()
    expect(ks.getRegisteredSubprocessCount()).toBe(SUBPROCESS_KILL_LIMIT - 1)
    // 再登録 OK
    expect(() => ks.registerSubprocessKill(new FakeGraceful('after-unregister'))).not.toThrow()
    expect(ks.getRegisteredSubprocessCount()).toBe(SUBPROCESS_KILL_LIMIT)
  })

  it('10. 既に死んでいる target には SIGTERM を送らない', async () => {
    const dead = new FakeGraceful('dead')
    // simulate already-dead
    dead.signal('SIGTERM') // 直前に手動で死んだ状態を作る
    expect(dead.alive()).toBe(false)
    dead.signals.length = 0 // reset signal log

    ks.registerSubprocessKill(dead)
    await ks.arm()
    await ks.trigger('test', { source: 'manual' })
    expect(dead.signals).toEqual([]) // 死んでいるので signal 送られない
  })

  it('11. SUBPROCESS_KILL_LIMIT 定数が 256', () => {
    expect(SUBPROCESS_KILL_LIMIT).toBe(256)
  })

  it('12. KillSwitchError は code プロパティを持つ', () => {
    const e = new KillSwitchError('subprocess_limit_exceeded')
    expect(e.code).toBe('subprocess_limit_exceeded')
    expect(e.name).toBe('KillSwitchError')
    expect(e).toBeInstanceOf(Error)
  })

  it('13. KillToken.id が登録ごとにユニーク', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 50; i++) {
      const t = ks.registerSubprocessKill(new FakeGraceful(`t${i}`))
      ids.add(t.id)
    }
    expect(ids.size).toBe(50)
  })

  it('14. getRegisteredSubprocessCount は register/unregister で正しく増減', () => {
    expect(ks.getRegisteredSubprocessCount()).toBe(0)
    const t1 = ks.registerSubprocessKill(new FakeGraceful('a'))
    expect(ks.getRegisteredSubprocessCount()).toBe(1)
    const t2 = ks.registerSubprocessKill(new FakeGraceful('b'))
    expect(ks.getRegisteredSubprocessCount()).toBe(2)
    t1.unregister()
    expect(ks.getRegisteredSubprocessCount()).toBe(1)
    t2.unregister()
    expect(ks.getRegisteredSubprocessCount()).toBe(0)
  })

  it('15. 既存 kill-chain.test.ts 互換: void として戻り値破棄しても従来通り動作', async () => {
    // 戻り値を変数に bind しない (Round 11 までの慣習)
    const sub = new FakeGraceful('legacy', 50)
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    ks.registerSubprocessKill(sub) // 戻り値破棄
    await ks.arm()
    await ks.trigger('legacy compat', { source: 'manual' })
    expect(sub.signals).toEqual(['SIGTERM'])
  })
})
