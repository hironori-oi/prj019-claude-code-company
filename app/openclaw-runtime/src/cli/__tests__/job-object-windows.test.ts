/**
 * cli/__tests__/job-object-windows.test — Round 14 Dev-C 着地 (Task A.2, テスト):
 *   job-object-windows.ts の syscall layer を mock binding 注入で検証 (8-14 tests 目標)。
 *
 * 検証範囲:
 *   - createMockJobObjectBinding: 履歴記録
 *   - applyCpuPlanWindows: win32 で CpuRate 設定、非 win32 で skip
 *   - applyExtendedLimitsWindows: memory + time の集約 set
 *   - assignPidToJobWindows: assign 実行 + invalid pid skip
 *   - attachResourcePlanWindows: 4-5 ステップ集約
 *   - loadNativeJobObjectBinding: 非 windows で unsupported / windows で mock fallback
 *   - closeJobObjectWindows: 非 windows で skip
 *
 * 純関数性: 全 helper は JobObjectBinding DI 経由で動作、test は実 syscall を一切呼ばない。
 */
import { describe, it, expect } from 'vitest'

import {
  applyCpuPlanWindows,
  applyExtendedLimitsWindows,
  assignPidToJobWindows,
  attachResourcePlanWindows,
  closeJobObjectWindows,
  createMockJobObjectBinding,
  loadNativeJobObjectBinding,
} from '../job-object-windows.js'
import {
  applyCpuLimit,
  applyMemoryLimit,
  applyTimeLimit,
  buildResourceConstraintsPlan,
} from '../resource-constraints.js'

describe('job-object-windows / createMockJobObjectBinding (R14 Dev-C)', () => {
  it('1. mock binding: createJobObject が unique handle を返し履歴記録', async () => {
    const b = createMockJobObjectBinding()
    const j1 = await b.createJobObject('clawbridge-1')
    const j2 = await b.createJobObject('clawbridge-2')
    expect(j1).not.toBe(j2)
    expect(b.created).toEqual([
      { job: j1, name: 'clawbridge-1' },
      { job: j2, name: 'clawbridge-2' },
    ])
  })

  it('2. mock binding: assign / extended / cpu / close を全履歴記録', async () => {
    const b = createMockJobObjectBinding()
    const j = await b.createJobObject('test')
    await b.assignProcessToJobObject(j, 9999)
    await b.setExtendedLimitInformation(j, {
      processMemoryLimitBytes: 1024,
      userTimeLimit100ns: 100,
    })
    await b.setCpuRateControlInformation(j, { cpuRate: 5000, hardCap: true })
    await b.closeJobObject(j)
    expect(b.assigned).toEqual([{ job: j, pid: 9999 }])
    expect(b.extendedSets).toHaveLength(1)
    expect(b.cpuSets).toEqual([{ job: j, cpuRate: 5000, hardCap: true }])
    expect(b.closed).toEqual([j])
  })
})

describe('job-object-windows / applyCpuPlanWindows (R14 Dev-C)', () => {
  it('3. win32 + apply: setCpuRateControlInformation 呼出、cpuRate 反映', async () => {
    const b = createMockJobObjectBinding()
    const j = await b.createJobObject('cpu-test')
    const plan = applyCpuLimit(50, { pid: 1, platformOverride: 'windows' })
    const r = await applyCpuPlanWindows(j, plan, b, 'win32')
    expect(r.applied).toBe(true)
    expect(b.cpuSets).toEqual([{ job: j, cpuRate: 5000, hardCap: true }])
  })

  it('4. 非 win32 platform で skip', async () => {
    const b = createMockJobObjectBinding()
    const plan = applyCpuLimit(50, { pid: 1, platformOverride: 'windows' })
    const r = await applyCpuPlanWindows(0xdead, plan, b, 'linux')
    expect(r.skipped).toBe(true)
    expect(b.cpuSets).toHaveLength(0)
  })

  it('5. plan.fallback != apply (linux 由来) で skip', async () => {
    const b = createMockJobObjectBinding()
    const plan = applyCpuLimit(50, { pid: 1, platformOverride: 'linux' })
    // linux plan を windows module に渡す → windowsCpuRate null で skip
    const r = await applyCpuPlanWindows(0xdead, plan, b, 'win32')
    expect(r.skipped).toBe(true)
  })
})

describe('job-object-windows / applyExtendedLimitsWindows (R14 Dev-C)', () => {
  it('6. memory + time 両方 apply で setExtendedLimitInformation 1 call', async () => {
    const b = createMockJobObjectBinding()
    const j = await b.createJobObject('ext-test')
    const memory = applyMemoryLimit(256 * 1024 * 1024, {
      pid: 1,
      platformOverride: 'windows',
    })
    const time = applyTimeLimit(5000, { pid: 1, platformOverride: 'windows' })
    const r = await applyExtendedLimitsWindows(j, memory, time, b, 'win32')
    expect(r.applied).toBe(true)
    expect(b.extendedSets).toEqual([
      {
        job: j,
        processMemoryLimitBytes: 256 * 1024 * 1024,
        userTimeLimit100ns: 50_000_000,
      },
    ])
  })

  it('7. memory / time 双方 skip 状態 (linux plan を windows module へ) → skip', async () => {
    const b = createMockJobObjectBinding()
    const memory = applyMemoryLimit(0, { pid: 1, platformOverride: 'windows' })
    const time = applyTimeLimit(0, { pid: 1, platformOverride: 'windows' })
    const r = await applyExtendedLimitsWindows(0xdead, memory, time, b, 'win32')
    expect(r.skipped).toBe(true)
    expect(b.extendedSets).toHaveLength(0)
  })

  it('8. 非 win32 platform で skip', async () => {
    const b = createMockJobObjectBinding()
    const memory = applyMemoryLimit(100, {
      pid: 1,
      platformOverride: 'windows',
    })
    const time = applyTimeLimit(100, { pid: 1, platformOverride: 'windows' })
    const r = await applyExtendedLimitsWindows(0xdead, memory, time, b, 'darwin')
    expect(r.skipped).toBe(true)
    expect(r.skipReason).toMatch(/non-windows/)
  })
})

describe('job-object-windows / assignPidToJobWindows (R14 Dev-C)', () => {
  it('9. valid pid: assignProcessToJobObject 呼出', async () => {
    const b = createMockJobObjectBinding()
    const j = await b.createJobObject('assign-test')
    const r = await assignPidToJobWindows(j, 4321, b, 'win32')
    expect(r.applied).toBe(true)
    expect(b.assigned).toEqual([{ job: j, pid: 4321 }])
  })

  it('10. invalid pid (0/負/NaN) で skip', async () => {
    const b = createMockJobObjectBinding()
    expect((await assignPidToJobWindows(1, 0, b, 'win32')).skipped).toBe(true)
    expect((await assignPidToJobWindows(1, -1, b, 'win32')).skipped).toBe(true)
    expect((await assignPidToJobWindows(1, NaN, b, 'win32')).skipped).toBe(true)
    expect(b.assigned).toHaveLength(0)
  })
})

describe('job-object-windows / attachResourcePlanWindows (R14 Dev-C)', () => {
  it('11. win32 集約 plan: create→cpu→extended→assign の 4 ステップ', async () => {
    const b = createMockJobObjectBinding()
    const plan = buildResourceConstraintsPlan(
      { cpuPercent: 100, memoryBytes: 256 * 1024 * 1024, maxMs: 60_000 },
      { pid: 9999, platformOverride: 'windows' },
    )
    const r = await attachResourcePlanWindows(
      plan,
      9999,
      b,
      'win32',
      'r14c-test-job',
    )
    expect(r.applied).toBe(true)
    expect(r.steps.map((s) => s.kind)).toEqual([
      'create',
      'cpu',
      'extended',
      'assign',
    ])
    expect(b.created).toEqual([{ job: r.jobHandle, name: 'r14c-test-job' }])
    expect(b.cpuSets).toHaveLength(1)
    expect(b.extendedSets).toHaveLength(1)
    expect(b.assigned).toEqual([{ job: r.jobHandle, pid: 9999 }])
  })

  it('12. 非 win32: nonWindowsFallback (steps=空、warning 設定、副作用ゼロ)', async () => {
    const b = createMockJobObjectBinding()
    const plan = buildResourceConstraintsPlan(
      { cpuPercent: 100, memoryBytes: 100, maxMs: 1000 },
      { pid: 1, platformOverride: 'linux' },
    )
    const r = await attachResourcePlanWindows(plan, 1, b, 'linux')
    expect(r.applied).toBe(false)
    expect(r.warning).toMatch(/job-object-windows unsupported/)
    expect(r.steps).toHaveLength(0)
    expect(b.created).toHaveLength(0)
  })

  it('13. pid=null で assign step 省略 (create + cpu + extended のみ)', async () => {
    const b = createMockJobObjectBinding()
    const plan = buildResourceConstraintsPlan(
      { cpuPercent: 100, memoryBytes: 100 },
      { pid: null, platformOverride: 'windows' },
    )
    const r = await attachResourcePlanWindows(
      plan,
      null,
      b,
      'win32',
      'no-pid',
    )
    expect(r.steps.map((s) => s.kind)).toEqual(['create', 'cpu', 'extended'])
    expect(b.assigned).toHaveLength(0)
  })
})

describe('job-object-windows / loadNativeJobObjectBinding (R14 Dev-C)', () => {
  it('14. 非 windows: source=unsupported, binding=null', async () => {
    if (process.platform === 'win32') {
      // Windows 上では不適用 (Round 14 では mock fallback が返るため)
      expect(true).toBe(true)
      return
    }
    const r = await loadNativeJobObjectBinding()
    expect(r.source).toBe('unsupported')
    expect(r.binding).toBeNull()
    expect(r.reason).toMatch(/non-windows/)
  })

  it('15. windows: source=mock, binding 取得可 (Round 14 placeholder)', async () => {
    if (process.platform !== 'win32') {
      // 非 Windows では unsupported になるため skip
      expect(true).toBe(true)
      return
    }
    const r = await loadNativeJobObjectBinding()
    expect(r.source).toBe('mock')
    expect(r.binding).not.toBeNull()
    expect(r.reason).toMatch(/native win32-api binding not installed/)
  })
})

describe('job-object-windows / closeJobObjectWindows (R14 Dev-C)', () => {
  it('16. win32: closeJobObject 呼出、closed=true', async () => {
    const b = createMockJobObjectBinding()
    const j = await b.createJobObject('close-test')
    const r = await closeJobObjectWindows(j, b, 'win32')
    expect(r.closed).toBe(true)
    expect(b.closed).toEqual([j])
  })

  it('17. 非 win32: skip + reason 設定', async () => {
    const b = createMockJobObjectBinding()
    const r = await closeJobObjectWindows(0xdead, b, 'linux')
    expect(r.closed).toBe(false)
    expect(r.reason).toMatch(/non-windows/)
    expect(b.closed).toHaveLength(0)
  })
})

describe('job-object-windows / multi-platform regression (R14 Dev-C)', () => {
  it('18. all 4 platforms: applied true は win32 のみ、他は skip', async () => {
    const platforms: NodeJS.Platform[] = ['win32', 'linux', 'darwin', 'freebsd']
    const results = await Promise.all(
      platforms.map(async (p) => {
        const b = createMockJobObjectBinding()
        const plan = buildResourceConstraintsPlan(
          { cpuPercent: 100, memoryBytes: 100, maxMs: 1000 },
          {
            pid: 1,
            platformOverride:
              p === 'win32'
                ? 'windows'
                : p === 'linux'
                ? 'linux'
                : p === 'darwin'
                ? 'darwin'
                : 'other',
          },
        )
        return {
          p,
          outcome: await attachResourcePlanWindows(plan, 1, b, p),
          createCount: b.created.length,
        }
      }),
    )
    const win = results.find((r) => r.p === 'win32')!
    expect(win.outcome.applied).toBe(true)
    expect(win.createCount).toBe(1)
    for (const other of results.filter((r) => r.p !== 'win32')) {
      expect(other.outcome.applied).toBe(false)
      expect(other.createCount).toBe(0)
    }
  })
})
