/**
 * cli/__tests__/cgroup-linux.test — Round 14 Dev-C 着地 (Task A.1, テスト):
 *   cgroup-linux.ts の syscall layer を mock fs 注入で検証 (10-14 tests 目標)。
 *
 * 検証範囲:
 *   - createMockCgroupFileSystem の挙動
 *   - applyCpuPlanLinux: linux で cpu.max 書込、非 linux で skip
 *   - applyMemoryPlanLinux: linux で memory.max 書込、非 linux で skip
 *   - attachPidToCgroup: cgroup.procs 書込、invalid pid で skip
 *   - attachResourcePlanLinux: 集約 plan の 3 ステップ + 非 linux fallback
 *   - removeCgroupLinux: 非 linux で skip
 *
 * 純関数性: 全 helper は CgroupFileSystem DI 経由で動作、test は実 fs を一切触らない。
 */
import { describe, it, expect } from 'vitest'

import {
  applyCpuPlanLinux,
  applyMemoryPlanLinux,
  attachPidToCgroup,
  attachResourcePlanLinux,
  removeCgroupLinux,
  createMockCgroupFileSystem,
  createNodeCgroupFileSystem,
} from '../cgroup-linux.js'
import {
  applyCpuLimit,
  applyMemoryLimit,
  applyTimeLimit,
  buildResourceConstraintsPlan,
} from '../resource-constraints.js'

describe('cgroup-linux / createMockCgroupFileSystem (R14 Dev-C)', () => {
  it('1. mock fs: writeFile / mkdir 履歴を記録、exists で path 検証', async () => {
    const fs = createMockCgroupFileSystem()
    await fs.mkdir('/sys/fs/cgroup/test', { recursive: true })
    await fs.writeFile('/sys/fs/cgroup/test/cpu.max', '50000 100000')
    expect(fs.mkdirs).toContain('/sys/fs/cgroup/test')
    expect(fs.writes).toEqual([
      { path: '/sys/fs/cgroup/test/cpu.max', data: '50000 100000' },
    ])
    expect(await fs.exists('/sys/fs/cgroup/test/cpu.max')).toBe(true)
    expect(await fs.exists('/sys/fs/cgroup/none')).toBe(false)
  })
})

describe('cgroup-linux / createNodeCgroupFileSystem (R14 Dev-C)', () => {
  it('2. node fs: 非 linux platform では mkdir/writeFile が即時 no-op', async () => {
    if (process.platform === 'linux') {
      // Linux 上ではこの test を skip (実 fs を触ると副作用が発生するため)
      expect(true).toBe(true)
      return
    }
    const fs = createNodeCgroupFileSystem()
    // 非 Linux では throw しない (no-op)
    await expect(
      fs.writeFile('/sys/fs/cgroup/should-not-write', 'x'),
    ).resolves.toBeUndefined()
    await expect(
      fs.mkdir('/sys/fs/cgroup/should-not-mkdir', { recursive: true }),
    ).resolves.toBeUndefined()
    expect(await fs.exists('/sys/fs/cgroup/anything')).toBe(false)
  })
})

describe('cgroup-linux / applyCpuPlanLinux (R14 Dev-C)', () => {
  it('3. linux + apply plan: cpu.max への書込が記録される', async () => {
    const fs = createMockCgroupFileSystem()
    const plan = applyCpuLimit(200, {
      pid: 1234,
      platformOverride: 'linux',
      linuxCgroupBase: '/sys/fs/cgroup',
      linuxCgroupScope: 'r14c-test',
    })
    const r = await applyCpuPlanLinux(plan, fs, 'linux')
    expect(r.applied).toBe(true)
    expect(r.skipped).toBe(false)
    expect(r.path).toBe('/sys/fs/cgroup/r14c-test/cpu.max')
    expect(r.data).toBe('200000 100000')
    expect(fs.writes).toHaveLength(1)
  })

  it('4. 非 linux platform 指定で skip (writeFile 呼ばれない)', async () => {
    const fs = createMockCgroupFileSystem()
    const plan = applyCpuLimit(100, {
      pid: 1,
      platformOverride: 'linux',
      linuxCgroupScope: 's',
    })
    const r = await applyCpuPlanLinux(plan, fs, 'win32')
    expect(r.skipped).toBe(true)
    expect(r.applied).toBe(false)
    expect(r.skipReason).toMatch(/non-linux/)
    expect(fs.writes).toHaveLength(0)
  })

  it('5. plan.fallback != apply (例: darwin 由来 warn) なら skip', async () => {
    const fs = createMockCgroupFileSystem()
    const plan = applyCpuLimit(100, {
      pid: 1,
      platformOverride: 'darwin',
    })
    const r = await applyCpuPlanLinux(plan, fs, 'linux')
    expect(r.skipped).toBe(true)
    expect(r.skipReason).toMatch(/fallback=warn/)
    expect(fs.writes).toHaveLength(0)
  })
})

describe('cgroup-linux / applyMemoryPlanLinux (R14 Dev-C)', () => {
  it('6. linux + apply plan: memory.max への書込が記録される', async () => {
    const fs = createMockCgroupFileSystem()
    const plan = applyMemoryLimit(512 * 1024 * 1024, {
      pid: 1,
      platformOverride: 'linux',
      linuxCgroupScope: 'mem-r14c',
    })
    const r = await applyMemoryPlanLinux(plan, fs, 'linux')
    expect(r.applied).toBe(true)
    expect(r.path).toBe('/sys/fs/cgroup/mem-r14c/memory.max')
    expect(r.data).toBe(String(512 * 1024 * 1024))
  })

  it('7. windows plan を linux module に渡すと skip (linuxCgroupPath null)', async () => {
    const fs = createMockCgroupFileSystem()
    const plan = applyMemoryLimit(128 * 1024 * 1024, {
      pid: 1,
      platformOverride: 'windows',
    })
    // plan.linuxCgroupPath は null だが fallback==='apply' のため、null 判定で skip する
    const r = await applyMemoryPlanLinux(plan, fs, 'linux')
    expect(r.skipped).toBe(true)
    expect(fs.writes).toHaveLength(0)
  })
})

describe('cgroup-linux / attachPidToCgroup (R14 Dev-C)', () => {
  it('8. valid pid: cgroup.procs 書込', async () => {
    const fs = createMockCgroupFileSystem()
    const r = await attachPidToCgroup(
      '/sys/fs/cgroup/test',
      4321,
      fs,
      'linux',
    )
    expect(r.applied).toBe(true)
    expect(r.path).toBe('/sys/fs/cgroup/test/cgroup.procs')
    expect(r.data).toBe('4321')
  })

  it('9. invalid pid (0 / NaN / 負): skip', async () => {
    const fs = createMockCgroupFileSystem()
    expect(
      (await attachPidToCgroup('/sys/fs/cgroup/test', 0, fs, 'linux'))
        .skipped,
    ).toBe(true)
    expect(
      (await attachPidToCgroup('/sys/fs/cgroup/test', -1, fs, 'linux'))
        .skipped,
    ).toBe(true)
    expect(
      (await attachPidToCgroup('/sys/fs/cgroup/test', NaN, fs, 'linux'))
        .skipped,
    ).toBe(true)
    expect(fs.writes).toHaveLength(0)
  })

  it('10. 非 linux platform: skip + skipReason に platform 名', async () => {
    const fs = createMockCgroupFileSystem()
    const r = await attachPidToCgroup(
      '/sys/fs/cgroup/test',
      1234,
      fs,
      'darwin',
    )
    expect(r.skipped).toBe(true)
    expect(r.skipReason).toMatch(/non-linux platform=darwin/)
  })
})

describe('cgroup-linux / attachResourcePlanLinux (R14 Dev-C)', () => {
  it('11. linux 集約 plan: 3 ステップ全 apply (cpu / memory / attach)', async () => {
    const fs = createMockCgroupFileSystem()
    const plan = buildResourceConstraintsPlan(
      { cpuPercent: 200, memoryBytes: 256 * 1024 * 1024, maxMs: 60_000 },
      { pid: 9999, platformOverride: 'linux', linuxCgroupScope: 'integ' },
    )
    const r = await attachResourcePlanLinux(plan, 9999, fs, 'linux')
    expect(r.applied).toBe(true)
    expect(r.cgroupPath).toBe('/sys/fs/cgroup/integ')
    expect(r.steps).toHaveLength(3)
    expect(r.steps[0]?.kind).toBe('cpu')
    expect(r.steps[1]?.kind).toBe('memory')
    expect(r.steps[2]?.kind).toBe('attach')
    expect(r.steps.every((s) => s.applied)).toBe(true)
    expect(fs.mkdirs).toContain('/sys/fs/cgroup/integ')
    expect(fs.writes).toHaveLength(3)
  })

  it('12. 非 linux: nonLinuxFallback (steps=空、warning 設定、副作用ゼロ)', async () => {
    const fs = createMockCgroupFileSystem()
    const plan = buildResourceConstraintsPlan(
      { cpuPercent: 100, memoryBytes: 100, maxMs: 1000 },
      { pid: 1, platformOverride: 'windows' },
    )
    const r = await attachResourcePlanLinux(plan, 1, fs, 'win32')
    expect(r.applied).toBe(false)
    expect(r.warning).toMatch(/cgroup-linux unsupported/)
    expect(r.steps).toHaveLength(0)
    expect(fs.writes).toHaveLength(0)
    expect(fs.mkdirs).toHaveLength(0)
  })

  it('13. plan に linuxCgroupPath が無い場合 (windows plan を linux で実行): warning', async () => {
    const fs = createMockCgroupFileSystem()
    const plan = buildResourceConstraintsPlan(
      { cpuPercent: 100, memoryBytes: 100, maxMs: 1000 },
      { pid: 1, platformOverride: 'windows' },
    )
    // override で linux に切替 (mismatched plan)
    const r = await attachResourcePlanLinux(plan, 1, fs, 'linux')
    expect(r.applied).toBe(false)
    expect(r.warning).toMatch(/no linuxCgroupPath/)
    expect(r.steps).toHaveLength(0)
  })

  it('14. pid=null で attach step 省略 (cpu/memory のみ)', async () => {
    const fs = createMockCgroupFileSystem()
    const plan = buildResourceConstraintsPlan(
      { cpuPercent: 100, memoryBytes: 100 },
      { pid: null, platformOverride: 'linux', linuxCgroupScope: 'no-pid' },
    )
    const r = await attachResourcePlanLinux(plan, null, fs, 'linux')
    expect(r.steps).toHaveLength(2)
    expect(r.steps.every((s) => s.kind !== 'attach')).toBe(true)
  })
})

describe('cgroup-linux / removeCgroupLinux (R14 Dev-C)', () => {
  it('15. 非 linux: removed=false + reason 設定', async () => {
    const r = await removeCgroupLinux('/tmp/dummy', 'win32')
    expect(r.removed).toBe(false)
    expect(r.reason).toMatch(/non-linux/)
  })
})

describe('cgroup-linux / applyTimeLimit interaction (R14 Dev-C)', () => {
  it('16. time plan は cgroup-linux では使わない (memory/cpu のみ書込)', async () => {
    const fs = createMockCgroupFileSystem()
    const time = applyTimeLimit(5000, {
      pid: 1,
      platformOverride: 'linux',
    })
    expect(time.fallback).toBe('apply')
    // attachResourcePlanLinux は time を直接 fs に書かない (setTimeout fallback)
    const plan = buildResourceConstraintsPlan(
      { cpuPercent: 100, memoryBytes: 100, maxMs: 5000 },
      { pid: 1, platformOverride: 'linux', linuxCgroupScope: 't' },
    )
    const r = await attachResourcePlanLinux(plan, 1, fs, 'linux')
    // cpu / memory / attach の 3 ステップのみ、time は別経路 (setTimeout)
    expect(r.steps).toHaveLength(3)
    expect(r.steps.map((s) => s.kind)).toEqual(['cpu', 'memory', 'attach'])
  })
})

describe('cgroup-linux / multi-platform regression (R14 Dev-C)', () => {
  it('17. all 4 platforms: applied true は linux のみ、他 3 は skipped', async () => {
    const platforms: NodeJS.Platform[] = ['linux', 'darwin', 'win32', 'freebsd']
    const results = await Promise.all(
      platforms.map(async (p) => {
        const fs = createMockCgroupFileSystem()
        const plan = buildResourceConstraintsPlan(
          { cpuPercent: 100, memoryBytes: 100 },
          {
            pid: 1,
            platformOverride: p === 'win32' ? 'windows' : p === 'freebsd' ? 'other' : (p as 'linux' | 'darwin'),
            linuxCgroupScope: 's',
          },
        )
        return {
          p,
          outcome: await attachResourcePlanLinux(plan, 1, fs, p),
          writes: fs.writes.length,
        }
      }),
    )
    const linux = results.find((r) => r.p === 'linux')!
    expect(linux.outcome.applied).toBe(true)
    expect(linux.writes).toBeGreaterThan(0)
    for (const other of results.filter((r) => r.p !== 'linux')) {
      expect(other.outcome.applied).toBe(false)
      expect(other.writes).toBe(0)
    }
  })
})
