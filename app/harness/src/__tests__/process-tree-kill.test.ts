/**
 * process-tree-kill.test — Round 7 W0-Week1 prefetch (G-03'):
 *   killProcessTree (子孫プロセス全列挙 → 全 SIGTERM → 5 秒 grace → SIGKILL)
 *   の単体テスト。
 *
 * Windows / Linux / macOS 全 platform 対応。テストは mock deps で実 spawn 不要。
 *
 * カバー範囲:
 *   1. 親 + 子孫 3 階層に SIGTERM が一斉送信され、grace 内に die すれば SIGKILL ゼロ
 *   2. 残存プロセスは grace 経過で SIGKILL に escalate
 *   3. platform 上書きで win32 / linux / darwin 全環境を deps 経由で扱える
 */
import { describe, it, expect } from 'vitest'
import {
  killProcessTree,
  type KillProcessTreeDeps,
} from '../kill-switch.js'

interface FakeProc {
  pid: number
  ppid: number
  alive: boolean
  /** SIGTERM 受信後 die するか */
  dieOnSigterm: boolean
}

function buildDeps(
  procs: FakeProc[],
  platform: NodeJS.Platform = 'linux',
): {
  deps: KillProcessTreeDeps
  signalLog: { pid: number; sig: 'SIGTERM' | 'SIGKILL' }[]
} {
  const signalLog: { pid: number; sig: 'SIGTERM' | 'SIGKILL' }[] = []
  const deps: KillProcessTreeDeps = {
    platform,
    async enumerateTree(parentPid: number): Promise<number[]> {
      const out = new Set<number>([parentPid])
      let added = true
      while (added) {
        added = false
        for (const p of procs) {
          if (out.has(p.ppid) && !out.has(p.pid)) {
            out.add(p.pid)
            added = true
          }
        }
      }
      return [...out]
    },
    signal(pid: number, sig: 'SIGTERM' | 'SIGKILL'): void {
      signalLog.push({ pid, sig })
      const p = procs.find((x) => x.pid === pid)
      if (!p) return
      if (sig === 'SIGKILL') p.alive = false
      if (sig === 'SIGTERM' && p.dieOnSigterm) p.alive = false
    },
    isAlive(pid: number): boolean {
      return procs.find((x) => x.pid === pid)?.alive ?? false
    },
    async sleep(ms: number): Promise<void> {
      await new Promise((r) => setTimeout(r, ms))
    },
  }
  return { deps, signalLog }
}

describe("G-03': killProcessTree", () => {
  it('全階層 SIGTERM 一斉送信で grace 内に die すれば SIGKILL は不要 (linux)', async () => {
    const procs: FakeProc[] = [
      { pid: 100, ppid: 1, alive: true, dieOnSigterm: true },
      { pid: 101, ppid: 100, alive: true, dieOnSigterm: true },
      { pid: 102, ppid: 100, alive: true, dieOnSigterm: true },
      { pid: 103, ppid: 101, alive: true, dieOnSigterm: true },
      { pid: 999, ppid: 1, alive: true, dieOnSigterm: false }, // 無関係 — kill 対象外
    ]
    const { deps, signalLog } = buildDeps(procs, 'linux')
    const r = await killProcessTree(100, deps, { gracePeriodMs: 100 })
    expect(r.platform).toBe('linux')
    // parent + 子孫 3 個 = 4 PID
    expect(r.pids.sort((a, b) => a - b)).toEqual([100, 101, 102, 103])
    expect(r.sigtermSent.sort((a, b) => a - b)).toEqual([100, 101, 102, 103])
    expect(r.sigkillSent).toEqual([])
    // 999 (無関係) には何も送らない
    expect(signalLog.find((s) => s.pid === 999)).toBeUndefined()
    // すべて死んでいる
    expect(procs.find((p) => p.pid === 100)?.alive).toBe(false)
  })

  it('SIGTERM を無視するプロセスは grace 経過で SIGKILL に escalate (darwin)', async () => {
    const procs: FakeProc[] = [
      { pid: 200, ppid: 1, alive: true, dieOnSigterm: false }, // stubborn
      { pid: 201, ppid: 200, alive: true, dieOnSigterm: true }, // graceful
    ]
    const { deps, signalLog } = buildDeps(procs, 'darwin')
    const r = await killProcessTree(200, deps, { gracePeriodMs: 80 })
    expect(r.platform).toBe('darwin')
    expect(r.pids.sort((a, b) => a - b)).toEqual([200, 201])
    expect(r.sigtermSent.sort((a, b) => a - b)).toEqual([200, 201])
    // 201 は SIGTERM で死ぬので残るのは 200 のみ → SIGKILL 1 件
    expect(r.sigkillSent).toEqual([200])
    expect(procs.every((p) => !p.alive)).toBe(true)
    // SIGKILL は SIGTERM の後に送られる
    const lastSigterm = signalLog.findLastIndex((s) => s.sig === 'SIGTERM')
    const firstSigkill = signalLog.findIndex((s) => s.sig === 'SIGKILL')
    expect(firstSigkill).toBeGreaterThan(lastSigterm)
  })

  it('platform=win32 でも同等に動作する (deps 経由 = taskkill 相当呼び出し可)', async () => {
    const procs: FakeProc[] = [
      { pid: 300, ppid: 1, alive: true, dieOnSigterm: true },
      { pid: 301, ppid: 300, alive: true, dieOnSigterm: false }, // SIGKILL 必要
    ]
    const { deps } = buildDeps(procs, 'win32')
    const r = await killProcessTree(300, deps, { gracePeriodMs: 60 })
    expect(r.platform).toBe('win32')
    expect(r.pids.sort((a, b) => a - b)).toEqual([300, 301])
    expect(r.sigtermSent.sort((a, b) => a - b)).toEqual([300, 301])
    expect(r.sigkillSent).toEqual([301])
  })
})
