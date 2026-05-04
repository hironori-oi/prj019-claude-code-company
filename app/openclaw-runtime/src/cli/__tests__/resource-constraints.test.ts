/**
 * cli/__tests__/resource-constraints.test — Round 13 Dev-C 着地 (Task A):
 *   resource-constraints.ts の純関数 plan 構築を platform 別に検証 (12-18 tests 目標、実装 18)。
 *
 * 検証範囲:
 *   - detectPlatform: process.platform 推論 + override
 *   - buildLinuxCgroupPath: path traversal 不可 / 末尾 / trim
 *   - applyCpuLimit / applyMemoryLimit / applyTimeLimit:
 *       linux / windows / darwin / other 4 platform × 各 limit
 *   - 0 / 負数 / NaN / Infinity の noop 動作
 *   - buildResourceConstraintsPlan: 集約 plan + fullySupported 判定
 *
 * 純関数性: 全 export は frozen plan を返却、本 test は OS state を一切変更しない。
 */
import { describe, it, expect } from 'vitest'

import {
  detectPlatform,
  buildLinuxCgroupPath,
  applyCpuLimit,
  applyMemoryLimit,
  applyTimeLimit,
  buildResourceConstraintsPlan,
} from '../resource-constraints.js'

describe('resource-constraints / detectPlatform (R13 Dev-C)', () => {
  it('1. override 指定で常にその platform を返す', () => {
    expect(detectPlatform('linux')).toBe('linux')
    expect(detectPlatform('windows')).toBe('windows')
    expect(detectPlatform('darwin')).toBe('darwin')
    expect(detectPlatform('other')).toBe('other')
  })

  it('2. override 無しなら process.platform を 4 種に正規化', () => {
    const p = detectPlatform()
    expect(['linux', 'windows', 'darwin', 'other']).toContain(p)
  })
})

describe('resource-constraints / buildLinuxCgroupPath (R13 Dev-C)', () => {
  it('3. 末尾 / は trim、scope は /\\ 等 sanitize', () => {
    expect(buildLinuxCgroupPath('/sys/fs/cgroup', 'clawbridge-abc')).toBe(
      '/sys/fs/cgroup/clawbridge-abc',
    )
    expect(buildLinuxCgroupPath('/sys/fs/cgroup/', 'foo')).toBe(
      '/sys/fs/cgroup/foo',
    )
    expect(buildLinuxCgroupPath('/sys/fs/cgroup', '../etc/passwd')).toBe(
      '/sys/fs/cgroup/___etc_passwd',
    )
  })
})

describe('resource-constraints / applyCpuLimit (R13 Dev-C)', () => {
  it('4. linux: cpu.max 形式 quota/period を計算 (200% → 200000/100000)', () => {
    const plan = applyCpuLimit(200, {
      pid: 1234,
      platformOverride: 'linux',
      linuxCgroupBase: '/sys/fs/cgroup',
      linuxCgroupScope: 'test-scope',
    })
    expect(plan.kind).toBe('cpu')
    expect(plan.platform).toBe('linux')
    expect(plan.fallback).toBe('apply')
    expect(plan.linuxQuotaUs).toBe(200_000)
    expect(plan.linuxPeriodUs).toBe(100_000)
    expect(plan.linuxCgroupPath).toBe('/sys/fs/cgroup/test-scope')
    expect(plan.windowsCpuRate).toBeNull()
    expect(plan.attachToPid).toBe(1234)
    expect(Object.isFrozen(plan)).toBe(true)
  })

  it('5. windows: CpuRate を 1/100 of 1% で設定 (50% → 5000)', () => {
    const plan = applyCpuLimit(50, {
      pid: 5678,
      platformOverride: 'windows',
    })
    expect(plan.platform).toBe('windows')
    expect(plan.fallback).toBe('apply')
    expect(plan.windowsCpuRate).toBe(5000)
    expect(plan.linuxQuotaUs).toBeNull()
    expect(plan.linuxCgroupPath).toBeNull()
  })

  it('6. windows: CpuRate は最大 10000 (100%) に clamp', () => {
    const plan = applyCpuLimit(150, {
      pid: 1,
      platformOverride: 'windows',
    })
    expect(plan.windowsCpuRate).toBe(10_000)
  })

  it('7. darwin: warn fallback (cpu hard limit 不可)', () => {
    const plan = applyCpuLimit(100, { pid: 1, platformOverride: 'darwin' })
    expect(plan.fallback).toBe('warn')
    expect(plan.warnMessage).toMatch(/darwin: cpu hard limit unsupported/)
  })

  it('8. other platform → unsupported fallback', () => {
    const plan = applyCpuLimit(100, { pid: 1, platformOverride: 'other' })
    expect(plan.fallback).toBe('unsupported')
    expect(plan.warnMessage).toMatch(/cpu limit unsupported/)
  })

  it('9. 0 / 負 / NaN → noop', () => {
    const a = applyCpuLimit(0, { pid: 1, platformOverride: 'linux' })
    const b = applyCpuLimit(-10, { pid: 1, platformOverride: 'linux' })
    const c = applyCpuLimit(NaN, { pid: 1, platformOverride: 'linux' })
    expect(a.fallback).toBe('noop')
    expect(b.fallback).toBe('noop')
    expect(c.fallback).toBe('noop')
    expect(a.linuxCgroupPath).toBeNull()
  })
})

describe('resource-constraints / applyMemoryLimit (R13 Dev-C)', () => {
  it('10. linux: memory.max 用 bytes 値、cgroup path セット', () => {
    const plan = applyMemoryLimit(512 * 1024 * 1024, {
      pid: 100,
      platformOverride: 'linux',
      linuxCgroupBase: '/sys/fs/cgroup',
      linuxCgroupScope: 'mem-test',
    })
    expect(plan.fallback).toBe('apply')
    expect(plan.memoryBytes).toBe(512 * 1024 * 1024)
    expect(plan.linuxCgroupPath).toBe('/sys/fs/cgroup/mem-test')
    expect(plan.windowsMemoryLimit).toBeNull()
  })

  it('11. windows: ProcessMemoryLimit セット', () => {
    const plan = applyMemoryLimit(256 * 1024 * 1024, {
      pid: 1,
      platformOverride: 'windows',
    })
    expect(plan.fallback).toBe('apply')
    expect(plan.windowsMemoryLimit).toBe(256 * 1024 * 1024)
    expect(plan.linuxCgroupPath).toBeNull()
  })

  it('12. darwin: warn fallback (RSS 制御不可)', () => {
    const plan = applyMemoryLimit(128 * 1024 * 1024, {
      pid: 1,
      platformOverride: 'darwin',
    })
    expect(plan.fallback).toBe('warn')
    expect(plan.warnMessage).toMatch(/RLIMIT_AS/)
    expect(plan.darwinRlimitAs).toBe(128 * 1024 * 1024)
  })

  it('13. 0 / 負 → noop', () => {
    const a = applyMemoryLimit(0, { pid: 1, platformOverride: 'linux' })
    const b = applyMemoryLimit(-1, { pid: 1, platformOverride: 'linux' })
    expect(a.fallback).toBe('noop')
    expect(b.fallback).toBe('noop')
    expect(a.linuxCgroupPath).toBeNull()
  })
})

describe('resource-constraints / applyTimeLimit (R13 Dev-C)', () => {
  it('14. windows: PerProcessUserTimeLimit を 100ns 単位で計算 (5000ms → 50_000_000)', () => {
    const plan = applyTimeLimit(5000, {
      pid: 1,
      platformOverride: 'windows',
    })
    expect(plan.fallback).toBe('apply')
    expect(plan.windowsUserTimeLimit100ns).toBe(50_000_000)
    expect(plan.maxMs).toBe(5000)
  })

  it('15. linux / darwin / other: setTimeout fallback (apply 扱い、windowsUserTime null)', () => {
    const lin = applyTimeLimit(3000, { pid: 1, platformOverride: 'linux' })
    const dar = applyTimeLimit(3000, { pid: 1, platformOverride: 'darwin' })
    const oth = applyTimeLimit(3000, { pid: 1, platformOverride: 'other' })
    for (const p of [lin, dar, oth]) {
      expect(p.fallback).toBe('apply')
      expect(p.windowsUserTimeLimit100ns).toBeNull()
      expect(p.killGraceMs).toBe(200)
    }
  })

  it('16. killGraceMs override が plan に反映', () => {
    const plan = applyTimeLimit(1000, {
      pid: 1,
      platformOverride: 'linux',
      killGraceMs: 500,
    })
    expect(plan.killGraceMs).toBe(500)
  })
})

describe('resource-constraints / buildResourceConstraintsPlan (R13 Dev-C)', () => {
  it('17. 3 制約まとめて plan、linux 全 apply で fullySupported=true', () => {
    const plan = buildResourceConstraintsPlan(
      { cpuPercent: 200, memoryBytes: 512 * 1024 * 1024, maxMs: 60_000 },
      { pid: 99, platformOverride: 'linux', linuxCgroupScope: 's' },
    )
    expect(plan.platform).toBe('linux')
    expect(plan.fullySupported).toBe(true)
    expect(plan.cpu.fallback).toBe('apply')
    expect(plan.memory.fallback).toBe('apply')
    expect(plan.time.fallback).toBe('apply')
    expect(Object.isFrozen(plan)).toBe(true)
  })

  it('18. darwin で memory warn → fullySupported=false', () => {
    const plan = buildResourceConstraintsPlan(
      { cpuPercent: 100, memoryBytes: 128 * 1024 * 1024, maxMs: 1000 },
      { pid: 99, platformOverride: 'darwin' },
    )
    expect(plan.fullySupported).toBe(false)
    // cpu も darwin で warn
    expect(plan.cpu.fallback).toBe('warn')
    expect(plan.memory.fallback).toBe('warn')
    // time は darwin でも setTimeout fallback で apply
    expect(plan.time.fallback).toBe('apply')
  })
})
