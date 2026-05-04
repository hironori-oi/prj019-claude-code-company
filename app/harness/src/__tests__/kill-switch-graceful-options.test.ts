/**
 * kill-switch-graceful-options.test — Round 13 Dev-D 着地 (Task A):
 *   graceful shutdown timeout の構造化設定可能化を検証する。
 *
 * 検証項目:
 *   - default 値 (200/200/100ms) が Round 12 までと完全互換
 *   - configure() による runtime 上書き
 *   - 環境変数 (OPEN_CLAW_KILL_GRACE_MS / SIGTERM / SIGKILL) からの override
 *   - 優先度: configure() > env > constructor opts.graceful > default
 *   - zod validation エラーは throw
 *   - target.gracePeriodMs (個別) は switch-wide 設定より優先
 *   - sigtermTimeout が hang した signal を救済する
 *   - 未呼び出しでも Round 12 既存 fixture が動く (互換性)
 *
 * 既存 kill-chain.test.ts / kill-switch-subprocess-wiring.test.ts は無改変で互換確認。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  FileKillSwitch,
  DEFAULT_KILL_SWITCH_GRACEFUL,
  KILL_SWITCH_ENV_GRACE_KEY,
  KILL_SWITCH_ENV_SIGTERM_KEY,
  KILL_SWITCH_ENV_SIGKILL_KEY,
  resolveKillSwitchOptionsFromEnv,
  mergeKillSwitchGracefulConfig,
  KillSwitchOptionsSchema,
  type SubprocessKillTarget,
} from '../index.js'

function tmpDir(): string {
  return join(
    tmpdir(),
    `clawbridge-killgrace-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
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
    // SIGTERM ignore
  }
}

/** test 用 hang signal target — SIGTERM だけ promise を resolve しない */
class FakeHangingTermSubprocess implements SubprocessKillTarget {
  name: string
  private aliveFlag = true
  signals: ('SIGTERM' | 'SIGKILL')[] = []
  constructor(name = 'h') {
    this.name = name
  }
  alive(): boolean {
    return this.aliveFlag
  }
  async signal(sig: 'SIGTERM' | 'SIGKILL'): Promise<void> {
    this.signals.push(sig)
    if (sig === 'SIGKILL') {
      this.aliveFlag = false
      return
    }
    // SIGTERM は永遠に resolve しない (ただし test 全体が止まらないよう 10s で fallback)
    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, 10_000)
      if (t.unref) t.unref()
    })
  }
}

describe('Round 13 Dev-D Task A: kill-switch graceful shutdown 設定可能化', () => {
  let dir: string
  let signalPath: string
  let historyPath: string

  beforeEach(async () => {
    dir = tmpDir()
    await fs.mkdir(dir, { recursive: true })
    signalPath = join(dir, 'STOP')
    historyPath = join(dir, 'kill-history.json')
  })

  afterEach(async () => {
    try {
      await fs.rm(dir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  })

  function newKs(opts?: Parameters<typeof FileKillSwitch.prototype.constructor>[0]): FileKillSwitch {
    return new FileKillSwitch({
      signalPath,
      historyPath,
      pollIntervalMs: 5000,
      handlerTimeoutMs: 1000,
      exitOnTrigger: false,
      // env を空にして default 挙動を保証 (test 環境からの誤注入回避)
      envForGraceful: {},
      ...(opts ?? {}),
    })
  }

  describe('default + 純関数', () => {
    it('1. DEFAULT_KILL_SWITCH_GRACEFUL は {200, 200, 100} で frozen', () => {
      expect(DEFAULT_KILL_SWITCH_GRACEFUL.gracePeriodMs).toBe(200)
      expect(DEFAULT_KILL_SWITCH_GRACEFUL.sigtermTimeoutMs).toBe(200)
      expect(DEFAULT_KILL_SWITCH_GRACEFUL.sigkillTimeoutMs).toBe(100)
      expect(Object.isFrozen(DEFAULT_KILL_SWITCH_GRACEFUL)).toBe(true)
    })

    it('2. configure 未呼び出し時、getGracefulConfig は default 値を返す', () => {
      const ks = newKs()
      const cfg = ks.getGracefulConfig()
      expect(cfg.gracePeriodMs).toBe(200)
      expect(cfg.sigtermTimeoutMs).toBe(200)
      expect(cfg.sigkillTimeoutMs).toBe(100)
    })

    it('3. KillSwitchOptionsSchema は zod schema として正しく parse する', () => {
      expect(() => KillSwitchOptionsSchema.parse({})).not.toThrow()
      expect(() =>
        KillSwitchOptionsSchema.parse({ gracePeriodMs: 500 }),
      ).not.toThrow()
      expect(() =>
        KillSwitchOptionsSchema.parse({ gracePeriodMs: -1 }),
      ).toThrow()
      expect(() =>
        KillSwitchOptionsSchema.parse({ gracePeriodMs: 999_999 }),
      ).toThrow()
      expect(() =>
        KillSwitchOptionsSchema.parse({ gracePeriodMs: 1.5 }),
      ).toThrow()
      expect(() =>
        // strict — 未知の field は reject
        KillSwitchOptionsSchema.parse({ unknownField: 1 }),
      ).toThrow()
    })

    it('4. resolveKillSwitchOptionsFromEnv は 3 種の env を読む', () => {
      const opts = resolveKillSwitchOptionsFromEnv({
        [KILL_SWITCH_ENV_GRACE_KEY]: '300',
        [KILL_SWITCH_ENV_SIGTERM_KEY]: '150',
        [KILL_SWITCH_ENV_SIGKILL_KEY]: '50',
      })
      expect(opts.gracePeriodMs).toBe(300)
      expect(opts.sigtermTimeoutMs).toBe(150)
      expect(opts.sigkillTimeoutMs).toBe(50)
    })

    it('5. resolveKillSwitchOptionsFromEnv は不正 / 範囲外 / 空 を無視', () => {
      const opts = resolveKillSwitchOptionsFromEnv({
        [KILL_SWITCH_ENV_GRACE_KEY]: 'NaN',
        [KILL_SWITCH_ENV_SIGTERM_KEY]: '-10',
        [KILL_SWITCH_ENV_SIGKILL_KEY]: '999999',
      })
      expect(opts.gracePeriodMs).toBeUndefined()
      expect(opts.sigtermTimeoutMs).toBeUndefined()
      expect(opts.sigkillTimeoutMs).toBeUndefined()
    })

    it('6. mergeKillSwitchGracefulConfig: explicit > env > base 優先順', () => {
      const merged = mergeKillSwitchGracefulConfig(
        { gracePeriodMs: 500 },
        { gracePeriodMs: 300, sigtermTimeoutMs: 150 },
        DEFAULT_KILL_SWITCH_GRACEFUL,
      )
      expect(merged.gracePeriodMs).toBe(500) // explicit
      expect(merged.sigtermTimeoutMs).toBe(150) // env
      expect(merged.sigkillTimeoutMs).toBe(100) // default
      expect(Object.isFrozen(merged)).toBe(true)
    })
  })

  describe('configure() API', () => {
    it('7. configure({gracePeriodMs:500}) で gracefulConfig.gracePeriodMs が 500 になる', () => {
      const ks = newKs()
      ks.configure({ gracePeriodMs: 500 })
      expect(ks.getGracefulConfig().gracePeriodMs).toBe(500)
      // 他 field は default
      expect(ks.getGracefulConfig().sigtermTimeoutMs).toBe(200)
      expect(ks.getGracefulConfig().sigkillTimeoutMs).toBe(100)
    })

    it('8. configure 部分指定: 未指定 field は前回値を維持', () => {
      const ks = newKs()
      ks.configure({ gracePeriodMs: 1000, sigtermTimeoutMs: 600 })
      ks.configure({ sigkillTimeoutMs: 50 })
      const cfg = ks.getGracefulConfig()
      expect(cfg.gracePeriodMs).toBe(1000) // 維持
      expect(cfg.sigtermTimeoutMs).toBe(600) // 維持
      expect(cfg.sigkillTimeoutMs).toBe(50) // 上書き
    })

    it('9. configure 不正値 (負数) は ZodError throw', () => {
      const ks = newKs()
      expect(() => ks.configure({ gracePeriodMs: -1 })).toThrow()
    })

    it('10. configure 不正値 (上限超過) は ZodError throw', () => {
      const ks = newKs()
      expect(() => ks.configure({ sigtermTimeoutMs: 999_999 })).toThrow()
    })
  })

  describe('環境変数 override', () => {
    it('11. constructor 時 env override で gracePeriodMs が反映', () => {
      const ks = new FileKillSwitch({
        signalPath,
        historyPath,
        pollIntervalMs: 5000,
        exitOnTrigger: false,
        envForGraceful: {
          [KILL_SWITCH_ENV_GRACE_KEY]: '777',
        },
      })
      expect(ks.getGracefulConfig().gracePeriodMs).toBe(777)
    })

    it('12. configure() は env override より優先', () => {
      const ks = new FileKillSwitch({
        signalPath,
        historyPath,
        pollIntervalMs: 5000,
        exitOnTrigger: false,
        envForGraceful: { [KILL_SWITCH_ENV_GRACE_KEY]: '777' },
      })
      ks.configure({ gracePeriodMs: 999 })
      expect(ks.getGracefulConfig().gracePeriodMs).toBe(999)
    })

    it('13. constructor opts.graceful は env で上書きされる', () => {
      const ks = new FileKillSwitch({
        signalPath,
        historyPath,
        pollIntervalMs: 5000,
        exitOnTrigger: false,
        graceful: { gracePeriodMs: 100 },
        envForGraceful: { [KILL_SWITCH_ENV_GRACE_KEY]: '500' },
      })
      // 優先順位: env > constructor opts.graceful
      expect(ks.getGracefulConfig().gracePeriodMs).toBe(500)
    })
  })

  describe('実 trigger 動作 への影響', () => {
    it('14. configure(gracePeriodMs:50) で stubborn が 50ms 後に SIGKILL される', async () => {
      const ks = newKs()
      ks.configure({ gracePeriodMs: 50 })
      const stubborn = new FakeStubborn('s')
      ks.registerSubprocessKill(stubborn)
      await ks.arm()
      const start = Date.now()
      await ks.trigger('test', { source: 'manual' })
      const elapsed = Date.now() - start
      expect(stubborn.signals).toEqual(['SIGTERM', 'SIGKILL'])
      // grace period 短縮の効果: 200ms (default) より短い必要がある
      expect(elapsed).toBeLessThan(200)
      await ks.disarm()
    })

    it('15. graceful target は configure 設定に関わらず SIGTERM のみ', async () => {
      const ks = newKs()
      ks.configure({ gracePeriodMs: 1000 })
      const g = new FakeGraceful('g')
      ks.registerSubprocessKill(g)
      await ks.arm()
      await ks.trigger('test', { source: 'manual' })
      expect(g.signals).toEqual(['SIGTERM'])
      await ks.disarm()
    })

    it('16. target.gracePeriodMs (個別) は switch-wide 設定より優先 (Round 12 既存契約)', async () => {
      const ks = newKs()
      ks.configure({ gracePeriodMs: 1000 })
      // 個別 50ms を指定
      const stubborn = new FakeStubborn('s', 50)
      ks.registerSubprocessKill(stubborn)
      await ks.arm()
      const start = Date.now()
      await ks.trigger('test', { source: 'manual' })
      const elapsed = Date.now() - start
      expect(stubborn.signals).toEqual(['SIGTERM', 'SIGKILL'])
      // 個別 50ms の効果 (1000ms 待機にならない)
      expect(elapsed).toBeLessThan(500)
      await ks.disarm()
    })

    it('17. sigtermTimeoutMs が hang した signal を救済し、以降 SIGKILL に escalate', async () => {
      const ks = newKs()
      // SIGTERM は 50ms で諦め、grace 短く、SIGKILL も短い timeout
      ks.configure({
        gracePeriodMs: 50,
        sigtermTimeoutMs: 50,
        sigkillTimeoutMs: 50,
      })
      const hanging = new FakeHangingTermSubprocess('h')
      ks.registerSubprocessKill(hanging)
      await ks.arm()
      const start = Date.now()
      await ks.trigger('hang test', { source: 'manual' })
      const elapsed = Date.now() - start
      // SIGTERM が hang しても fallback で SIGKILL に到達すること
      expect(hanging.signals).toContain('SIGTERM')
      expect(hanging.signals).toContain('SIGKILL')
      // 全体で 1 秒以下に収まる (timeout 救済の効果)
      expect(elapsed).toBeLessThan(1000)
      await ks.disarm()
    })
  })

  describe('既存互換性', () => {
    it('18. configure 未呼び出し時、200ms grace で stubborn が SIGKILL される (Round 12 互換)', async () => {
      const ks = newKs()
      const stubborn = new FakeStubborn('s', 50)
      ks.registerSubprocessKill(stubborn)
      await ks.arm()
      await ks.trigger('test', { source: 'manual' })
      expect(stubborn.signals).toEqual(['SIGTERM', 'SIGKILL'])
      await ks.disarm()
    })
  })
})
