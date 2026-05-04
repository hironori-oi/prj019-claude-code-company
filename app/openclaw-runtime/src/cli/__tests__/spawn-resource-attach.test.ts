/**
 * cli/__tests__/spawn-resource-attach.test — Round 15 Dev-L 着地 (Task L-1, テスト):
 *   spawn-resource-attach + resource-quota-constants の統合動作を検証 (7 tests)。
 *
 * 検証範囲:
 *   1. resource-quota-constants の MIN/DEFAULT/MAX export 値の整合性
 *   2. clampResourceQuotaSpec — in-range / clamped-to-min / clamped-to-max / default-applied
 *   3. attachResourcePlanCrossPlatform — linux 経路 (mock fs)
 *   4. attachResourcePlanCrossPlatform — windows 経路 (mock binding)
 *   5. attachResourcePlanCrossPlatform — darwin 経路 (noop+warn)
 *   6. attachResourcePlanCrossPlatform — other 経路 (noop+warn)
 *   7. defaultQuotaForPlatform — 全 platform でデフォルト推奨値を返す
 *
 * 純関数性: 全 helper は DI 経由で動作、test は実 fs / native binding を一切触らない。
 */
import { describe, it, expect } from 'vitest'

import {
  CPU_DEFAULT_PERCENT,
  CPU_MAX_PERCENT,
  CPU_MIN_PERCENT,
  DRILL_2_RECOMMENDED_QUOTA,
  KILL_GRACE_DEFAULT_MS,
  KILL_GRACE_MAX_MS,
  KILL_GRACE_MIN_MS,
  MEMORY_DEFAULT_BYTES,
  MEMORY_MAX_BYTES,
  MEMORY_MIN_BYTES,
  TIME_DEFAULT_MS,
  TIME_MAX_MS,
  TIME_MIN_MS,
  clampNumeric,
  clampResourceQuotaSpec,
  defaultQuotaForPlatform,
} from '../resource-quota-constants.js'
import {
  attachResourcePlanCrossPlatform,
  createMockAttachOptions,
  detectPlatformForAttach,
} from '../spawn-resource-attach.js'

describe('resource-quota-constants / MIN/DEFAULT/MAX 整合 (R15 Dev-L)', () => {
  it('1. MIN < DEFAULT < MAX が全 quota 軸で成立', () => {
    expect(MEMORY_MIN_BYTES).toBeLessThan(MEMORY_DEFAULT_BYTES)
    expect(MEMORY_DEFAULT_BYTES).toBeLessThan(MEMORY_MAX_BYTES)
    expect(CPU_MIN_PERCENT).toBeLessThan(CPU_DEFAULT_PERCENT)
    expect(CPU_DEFAULT_PERCENT).toBeLessThan(CPU_MAX_PERCENT)
    expect(TIME_MIN_MS).toBeLessThan(TIME_DEFAULT_MS)
    expect(TIME_DEFAULT_MS).toBeLessThan(TIME_MAX_MS)
    expect(KILL_GRACE_MIN_MS).toBeLessThan(KILL_GRACE_DEFAULT_MS)
    expect(KILL_GRACE_DEFAULT_MS).toBeLessThan(KILL_GRACE_MAX_MS)

    // DRILL_2_RECOMMENDED_QUOTA は全フィールドが DEFAULT 値と一致
    expect(DRILL_2_RECOMMENDED_QUOTA.cpuPercent).toBe(CPU_DEFAULT_PERCENT)
    expect(DRILL_2_RECOMMENDED_QUOTA.memoryBytes).toBe(MEMORY_DEFAULT_BYTES)
    expect(DRILL_2_RECOMMENDED_QUOTA.maxMs).toBe(TIME_DEFAULT_MS)
    expect(DRILL_2_RECOMMENDED_QUOTA.killGraceMs).toBe(KILL_GRACE_DEFAULT_MS)
  })
})

describe('resource-quota-constants / clampResourceQuotaSpec (R15 Dev-L)', () => {
  it('2. clampNumeric: undefined / NaN / +Inf → default-applied', () => {
    expect(clampNumeric(undefined, 1, 5, 10).outcome).toBe('default-applied')
    expect(clampNumeric(NaN, 1, 5, 10).outcome).toBe('default-applied')
    expect(clampNumeric(Number.POSITIVE_INFINITY, 1, 5, 10).outcome).toBe(
      'default-applied',
    )
    expect(clampNumeric(null, 1, 5, 10).value).toBe(5)
    expect(clampNumeric(0.5, 1, 5, 10).outcome).toBe('clamped-to-min')
    expect(clampNumeric(0.5, 1, 5, 10).value).toBe(1)
    expect(clampNumeric(99, 1, 5, 10).outcome).toBe('clamped-to-max')
    expect(clampNumeric(99, 1, 5, 10).value).toBe(10)
    expect(clampNumeric(7, 1, 5, 10).outcome).toBe('in-range')
  })

  it('3. clampResourceQuotaSpec: 全フィールドの clamp + warnings 集計', () => {
    const r = clampResourceQuotaSpec({
      cpuPercent: 5, // < MIN(25)
      memoryBytes: MEMORY_MAX_BYTES * 100, // > MAX
      maxMs: 500, // < MIN(1000)
      killGraceMs: KILL_GRACE_DEFAULT_MS, // in-range
    })
    expect(r.cpuPercent).toBe(CPU_MIN_PERCENT)
    expect(r.memoryBytes).toBe(MEMORY_MAX_BYTES)
    expect(r.maxMs).toBe(TIME_MIN_MS)
    expect(r.killGraceMs).toBe(KILL_GRACE_DEFAULT_MS)
    expect(r.outcomes.cpuPercent).toBe('clamped-to-min')
    expect(r.outcomes.memoryBytes).toBe('clamped-to-max')
    expect(r.outcomes.maxMs).toBe('clamped-to-min')
    expect(r.outcomes.killGraceMs).toBe('in-range')
    expect(r.warnings.length).toBe(3)
    expect(r.warnings.some((w) => w.includes('cpuPercent'))).toBe(true)
    expect(r.warnings.some((w) => w.includes('memoryBytes'))).toBe(true)
    expect(r.warnings.some((w) => w.includes('maxMs'))).toBe(true)
  })

  it('4. clampResourceQuotaSpec({}) で全 default-applied、warnings 空', () => {
    const r = clampResourceQuotaSpec({})
    expect(r.cpuPercent).toBe(CPU_DEFAULT_PERCENT)
    expect(r.memoryBytes).toBe(MEMORY_DEFAULT_BYTES)
    expect(r.maxMs).toBe(TIME_DEFAULT_MS)
    expect(r.killGraceMs).toBe(KILL_GRACE_DEFAULT_MS)
    expect(r.outcomes.cpuPercent).toBe('default-applied')
    // raw が undefined の場合 warning は出ない仕様
    expect(r.warnings).toHaveLength(0)
  })
})

describe('spawn-resource-attach / attachResourcePlanCrossPlatform (R15 Dev-L)', () => {
  it('5. linux 経路: cgroup mock fs に cpu.max / memory.max / cgroup.procs が書込まれる', async () => {
    const mock = createMockAttachOptions()
    const r = await attachResourcePlanCrossPlatform(
      DRILL_2_RECOMMENDED_QUOTA,
      4242,
      {
        platformOverride: 'linux',
        cgroupFs: mock.cgroupFs,
        linuxCgroupBase: '/sys/fs/cgroup',
        linuxCgroupScope: 'r15l-test',
      },
    )
    expect(r.platform).toBe('linux')
    expect(r.route).toBe('linux-cgroup')
    expect(r.applied).toBe(true)
    expect(r.warning).toBe(null)
    expect(r.linuxOutcome).not.toBeNull()
    expect(r.linuxOutcome?.cgroupPath).toBe('/sys/fs/cgroup/r15l-test')
    expect(r.linuxOutcome?.steps).toHaveLength(3)
    expect(mock.cgroupFs.writes.some((w) => w.path.endsWith('/cpu.max'))).toBe(
      true,
    )
    expect(
      mock.cgroupFs.writes.some((w) => w.path.endsWith('/memory.max')),
    ).toBe(true)
    expect(
      mock.cgroupFs.writes.some((w) => w.path.endsWith('/cgroup.procs')),
    ).toBe(true)
    expect(r.windowsOutcome).toBeNull()
    expect(r.clamped.cpuPercent).toBe(CPU_DEFAULT_PERCENT)
  })

  it('6. windows 経路: Job Object mock binding に CreateJobObject + cpu/extended/assign の 4 step が記録', async () => {
    const mock = createMockAttachOptions()
    const r = await attachResourcePlanCrossPlatform(
      DRILL_2_RECOMMENDED_QUOTA,
      9999,
      {
        platformOverride: 'windows',
        jobBinding: mock.jobBinding,
        windowsJobName: 'r15l-test-job',
      },
    )
    expect(r.platform).toBe('windows')
    expect(r.route).toBe('windows-job')
    expect(r.applied).toBe(true)
    expect(r.windowsOutcome).not.toBeNull()
    expect(r.linuxOutcome).toBeNull()
    expect(mock.jobBinding.created).toHaveLength(1)
    expect(mock.jobBinding.created[0]?.name).toBe('r15l-test-job')
    expect(mock.jobBinding.assigned).toHaveLength(1)
    expect(mock.jobBinding.assigned[0]?.pid).toBe(9999)
    expect(mock.jobBinding.cpuSets.length + mock.jobBinding.extendedSets.length).toBeGreaterThan(0)
  })

  it('7. darwin 経路: noop-darwin route + warning、syscall 一切呼ばれず', async () => {
    const mock = createMockAttachOptions()
    const r = await attachResourcePlanCrossPlatform(
      DRILL_2_RECOMMENDED_QUOTA,
      1,
      {
        platformOverride: 'darwin',
        cgroupFs: mock.cgroupFs,
        jobBinding: mock.jobBinding,
      },
    )
    expect(r.route).toBe('noop-darwin')
    expect(r.applied).toBe(false)
    expect(r.warning).toMatch(/darwin/)
    expect(mock.cgroupFs.writes).toHaveLength(0)
    expect(mock.cgroupFs.mkdirs).toHaveLength(0)
    expect(mock.jobBinding.created).toHaveLength(0)
    expect(mock.jobBinding.assigned).toHaveLength(0)
  })

  it('8. other 経路 (例 freebsd): noop-other route + warning', async () => {
    const r = await attachResourcePlanCrossPlatform(
      DRILL_2_RECOMMENDED_QUOTA,
      1,
      {
        platformOverride: 'other',
      },
    )
    expect(r.route).toBe('noop-other')
    expect(r.applied).toBe(false)
    expect(r.warning).toMatch(/unsupported/)
  })

  it('9. defaultQuotaForPlatform は全 platform で DRILL_2_RECOMMENDED_QUOTA を返す', () => {
    const platforms: NodeJS.Platform[] = ['linux', 'darwin', 'win32', 'freebsd']
    for (const p of platforms) {
      const q = defaultQuotaForPlatform(p)
      expect(q).toEqual(DRILL_2_RECOMMENDED_QUOTA)
    }
  })

  it('10. detectPlatformForAttach: override 優先 / process.platform fallback', () => {
    expect(detectPlatformForAttach('linux')).toBe('linux')
    expect(detectPlatformForAttach('windows')).toBe('windows')
    expect(detectPlatformForAttach('darwin')).toBe('darwin')
    expect(detectPlatformForAttach('other')).toBe('other')
    // override 未指定: process.platform から推論
    const inferred = detectPlatformForAttach()
    expect(['linux', 'windows', 'darwin', 'other']).toContain(inferred)
  })

  it('11. linux 経路 + clamping: 過小 quota 渡しても MIN にクランプされて attach 成功', async () => {
    const mock = createMockAttachOptions()
    const r = await attachResourcePlanCrossPlatform(
      {
        cpuPercent: 1, // < MIN
        memoryBytes: 1, // < MIN
        maxMs: 1, // < MIN
      },
      111,
      {
        platformOverride: 'linux',
        cgroupFs: mock.cgroupFs,
        linuxCgroupScope: 'clamp-test',
      },
    )
    expect(r.applied).toBe(true)
    expect(r.clamped.cpuPercent).toBe(CPU_MIN_PERCENT)
    expect(r.clamped.memoryBytes).toBe(MEMORY_MIN_BYTES)
    expect(r.clamped.maxMs).toBe(TIME_MIN_MS)
    expect(r.clamped.warnings.length).toBeGreaterThanOrEqual(3)
  })
})
