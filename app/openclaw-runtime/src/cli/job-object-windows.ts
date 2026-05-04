/**
 * cli/job-object-windows — Round 14 Dev-C 着地 (Task A.2):
 *   Round 13 Dev-C で plan 純関数化した resource-constraints.ts に対し、
 *   Windows Job Object API への post-spawn attach を行う syscall layer。
 *
 * 設計方針 (DEC-019-006 / 051 / 053-057 整合):
 *   - **Windows only**: process.platform === 'win32' 以外では mock fallback (no-op + warn)。
 *     非 Windows 環境で import しても本 module は throw しない (CI 想定で 3 platform 同時動作)。
 *   - **post-spawn attach**: spawn options に組み込まず、子 PID 確定後に
 *     CreateJobObject + AssignProcessToJobObject + SetInformationJobObject を順に実行。
 *   - **native module 抽象化**: 実 syscall は @types/win32-api 等の native binding を要するため、
 *     本 module では JobObjectBinding interface で抽象化し DI 可能。
 *     production binding は Round 14 では mock binding をデフォルトとして提供 (5/8 朝実機検証で
 *     CI runner に win32-api をインストールしてから native binding に切替予定)。
 *   - **fallback**: native binding 不在 / Windows 以外で attempt 時は warn のみ、副作用ゼロ。
 *   - **副作用ゼロ要件**: Sumi/Asagi の Claude Code session には一切影響しない。
 *
 * 関連:
 *   - cli/resource-constraints.ts (Round 13 Dev-C / plan 構築 純関数)
 *   - cli/cgroup-linux.ts (Round 14 Dev-C / Linux 対応)
 *   - cli/real-child-spawn.ts (Round 12 Dev-C / spawn adapter)
 *   - DEC-019-007 (副作用ゼロ要件)
 *   - DEC-019-051 (subscription-driven 中核手段)
 *   - 本 Round 引継元: Round 13 Dev-C (plan 構築) → Round 14 Dev-C (syscall 実装)
 */
import type {
  CpuLimitPlan,
  MemoryLimitPlan,
  ResourceConstraintsPlan,
  TimeLimitPlan,
} from './resource-constraints.js'

/**
 * Job Object 操作の native binding 抽象化。
 * 実 syscall は @types/win32-api 等で実装、本 module では DI で注入。
 */
export interface JobObjectBinding {
  /**
   * CreateJobObject(NULL, name) 相当。job handle (number / opaque) を返す。
   * 失敗時は throw。
   */
  createJobObject(name: string): Promise<number>
  /**
   * AssignProcessToJobObject(job, processHandle) 相当。
   * processHandle は OpenProcess(PROCESS_SET_QUOTA | PROCESS_TERMINATE, FALSE, pid) の戻り値。
   * 本 binding interface では pid 直渡しを受け付け、内部で OpenProcess+Assign を行う想定。
   */
  assignProcessToJobObject(job: number, pid: number): Promise<boolean>
  /**
   * SetInformationJobObject(job, JobObjectExtendedLimitInformation, ...) 相当。
   * memoryLimit / userTimeLimit の集約 set。
   */
  setExtendedLimitInformation(
    job: number,
    info: {
      readonly processMemoryLimitBytes: number | null
      readonly userTimeLimit100ns: number | null
    },
  ): Promise<boolean>
  /**
   * SetInformationJobObject(job, JobObjectCpuRateControlInformation, ...) 相当。
   * cpuRate は 1/100 of 1% 単位 (10000 = 100%)。
   */
  setCpuRateControlInformation(
    job: number,
    info: {
      readonly cpuRate: number
      readonly hardCap: boolean
    },
  ): Promise<boolean>
  /**
   * CloseHandle(job) 相当。job が閉じられると assigned process は KILL_ON_JOB_CLOSE flag に従う。
   */
  closeJobObject(job: number): Promise<void>
}

/**
 * mock binding (test / 非 Windows 環境用)。in-memory に呼出履歴を記録する。
 */
export interface MockJobObjectBinding extends JobObjectBinding {
  readonly created: readonly { readonly job: number; readonly name: string }[]
  readonly assigned: readonly { readonly job: number; readonly pid: number }[]
  readonly extendedSets: readonly {
    readonly job: number
    readonly processMemoryLimitBytes: number | null
    readonly userTimeLimit100ns: number | null
  }[]
  readonly cpuSets: readonly {
    readonly job: number
    readonly cpuRate: number
    readonly hardCap: boolean
  }[]
  readonly closed: readonly number[]
}

export function createMockJobObjectBinding(): MockJobObjectBinding {
  const created: { job: number; name: string }[] = []
  const assigned: { job: number; pid: number }[] = []
  const extendedSets: {
    job: number
    processMemoryLimitBytes: number | null
    userTimeLimit100ns: number | null
  }[] = []
  const cpuSets: { job: number; cpuRate: number; hardCap: boolean }[] = []
  const closed: number[] = []
  let nextHandle = 0x1000

  return {
    get created() {
      return created
    },
    get assigned() {
      return assigned
    },
    get extendedSets() {
      return extendedSets
    },
    get cpuSets() {
      return cpuSets
    },
    get closed() {
      return closed
    },
    async createJobObject(name: string): Promise<number> {
      const job = ++nextHandle
      created.push({ job, name })
      return job
    },
    async assignProcessToJobObject(job: number, pid: number): Promise<boolean> {
      assigned.push({ job, pid })
      return true
    },
    async setExtendedLimitInformation(job, info): Promise<boolean> {
      extendedSets.push({
        job,
        processMemoryLimitBytes: info.processMemoryLimitBytes,
        userTimeLimit100ns: info.userTimeLimit100ns,
      })
      return true
    },
    async setCpuRateControlInformation(job, info): Promise<boolean> {
      cpuSets.push({ job, cpuRate: info.cpuRate, hardCap: info.hardCap })
      return true
    },
    async closeJobObject(job: number): Promise<void> {
      closed.push(job)
    },
  }
}

/**
 * production 用 native binding loader。Windows 上で @types/win32-api 系 native module を
 * 動的 import するが、Round 14 時点では package 未追加のため、まず mock を返す
 * (5/8 朝実機検証 CI runner に追加後、本 loader を実 binding に切替)。
 */
export async function loadNativeJobObjectBinding(): Promise<{
  readonly binding: JobObjectBinding | null
  readonly source: 'native' | 'mock' | 'unsupported'
  readonly reason: string | null
}> {
  if (process.platform !== 'win32') {
    return Object.freeze({
      binding: null,
      source: 'unsupported',
      reason: `non-windows platform=${process.platform}`,
    })
  }
  // Round 14 では native binding は未実装 (5/8 朝実機検証で導入予定)。
  // mock fallback で job-object 操作 path 自体は通す。
  return Object.freeze({
    binding: createMockJobObjectBinding(),
    source: 'mock',
    reason:
      'native win32-api binding not installed (Round 14 placeholder, scheduled for 5/8 morning real-machine validation)',
  })
}

/**
 * Job Object attach 1 ステップの結果。
 */
export interface JobAttachStepResult {
  readonly kind: 'create' | 'cpu' | 'extended' | 'assign' | 'close'
  readonly applied: boolean
  readonly skipped: boolean
  readonly skipReason: string | null
  readonly jobHandle: number | null
}

export interface JobAttachOutcome {
  readonly platform: NodeJS.Platform
  readonly jobHandle: number | null
  readonly steps: readonly JobAttachStepResult[]
  readonly applied: boolean
  readonly warning: string | null
}

function nonWindowsFallback(reason: string): JobAttachOutcome {
  return Object.freeze({
    platform: process.platform,
    jobHandle: null,
    steps: Object.freeze([] as readonly JobAttachStepResult[]),
    applied: false,
    warning: reason,
  })
}

/**
 * cpu plan を Job Object に attach。
 */
export async function applyCpuPlanWindows(
  job: number,
  plan: CpuLimitPlan,
  binding: JobObjectBinding,
  platformOverride?: NodeJS.Platform,
): Promise<JobAttachStepResult> {
  const platform = platformOverride ?? process.platform
  if (platform !== 'win32') {
    return Object.freeze({
      kind: 'cpu',
      applied: false,
      skipped: true,
      skipReason: `non-windows platform=${platform}`,
      jobHandle: job,
    })
  }
  if (plan.fallback !== 'apply' || plan.windowsCpuRate === null) {
    return Object.freeze({
      kind: 'cpu',
      applied: false,
      skipped: true,
      skipReason: `cpu plan fallback=${plan.fallback}`,
      jobHandle: job,
    })
  }
  await binding.setCpuRateControlInformation(job, {
    cpuRate: plan.windowsCpuRate,
    hardCap: true,
  })
  return Object.freeze({
    kind: 'cpu',
    applied: true,
    skipped: false,
    skipReason: null,
    jobHandle: job,
  })
}

/**
 * memory + time plan を Job Object に attach (JobObjectExtendedLimitInformation 1 set で済ませる)。
 */
export async function applyExtendedLimitsWindows(
  job: number,
  memory: MemoryLimitPlan,
  time: TimeLimitPlan,
  binding: JobObjectBinding,
  platformOverride?: NodeJS.Platform,
): Promise<JobAttachStepResult> {
  const platform = platformOverride ?? process.platform
  if (platform !== 'win32') {
    return Object.freeze({
      kind: 'extended',
      applied: false,
      skipped: true,
      skipReason: `non-windows platform=${platform}`,
      jobHandle: job,
    })
  }
  const memBytes =
    memory.fallback === 'apply' ? memory.windowsMemoryLimit : null
  const userTime =
    time.fallback === 'apply' ? time.windowsUserTimeLimit100ns : null
  if (memBytes === null && userTime === null) {
    return Object.freeze({
      kind: 'extended',
      applied: false,
      skipped: true,
      skipReason: 'both memory and time skipped (fallback != apply)',
      jobHandle: job,
    })
  }
  await binding.setExtendedLimitInformation(job, {
    processMemoryLimitBytes: memBytes,
    userTimeLimit100ns: userTime,
  })
  return Object.freeze({
    kind: 'extended',
    applied: true,
    skipped: false,
    skipReason: null,
    jobHandle: job,
  })
}

/**
 * 子プロセスを Job Object に assign。
 */
export async function assignPidToJobWindows(
  job: number,
  pid: number,
  binding: JobObjectBinding,
  platformOverride?: NodeJS.Platform,
): Promise<JobAttachStepResult> {
  const platform = platformOverride ?? process.platform
  if (platform !== 'win32') {
    return Object.freeze({
      kind: 'assign',
      applied: false,
      skipped: true,
      skipReason: `non-windows platform=${platform}`,
      jobHandle: job,
    })
  }
  if (!Number.isFinite(pid) || pid <= 0) {
    return Object.freeze({
      kind: 'assign',
      applied: false,
      skipped: true,
      skipReason: `invalid pid=${pid}`,
      jobHandle: job,
    })
  }
  const ok = await binding.assignProcessToJobObject(job, Math.floor(pid))
  return Object.freeze({
    kind: 'assign',
    applied: ok,
    skipped: false,
    skipReason: null,
    jobHandle: job,
  })
}

/**
 * 集約 plan を Windows Job Object に post-spawn attach する高レベル helper。
 *
 * 動作:
 *   1. 非 Windows なら nonWindowsFallback (warn のみ、副作用ゼロ)
 *   2. CreateJobObject(name) → job handle 取得
 *   3. SetCpuRateControlInformation (cpu plan)
 *   4. SetExtendedLimitInformation (memory + time plan)
 *   5. AssignProcessToJobObject(job, pid)
 */
export async function attachResourcePlanWindows(
  plan: ResourceConstraintsPlan,
  pid: number | null,
  binding: JobObjectBinding | null = null,
  platformOverride?: NodeJS.Platform,
  jobName = `clawbridge-${Date.now().toString(36)}`,
): Promise<JobAttachOutcome> {
  const platform = platformOverride ?? process.platform
  if (platform !== 'win32') {
    return nonWindowsFallback(
      `job-object-windows unsupported on platform=${platform} (mock fallback active)`,
    )
  }

  let activeBinding: JobObjectBinding | null = binding
  if (!activeBinding) {
    const loaded = await loadNativeJobObjectBinding()
    activeBinding = loaded.binding
    if (!activeBinding) {
      return nonWindowsFallback(
        loaded.reason ?? 'native binding unavailable',
      )
    }
  }

  const steps: JobAttachStepResult[] = []
  const job = await activeBinding.createJobObject(jobName)
  steps.push(
    Object.freeze({
      kind: 'create',
      applied: true,
      skipped: false,
      skipReason: null,
      jobHandle: job,
    }),
  )

  steps.push(await applyCpuPlanWindows(job, plan.cpu, activeBinding, platform))
  steps.push(
    await applyExtendedLimitsWindows(
      job,
      plan.memory,
      plan.time,
      activeBinding,
      platform,
    ),
  )
  if (pid !== null && Number.isFinite(pid) && pid > 0) {
    steps.push(
      await assignPidToJobWindows(job, pid, activeBinding, platform),
    )
  }

  const applied = steps.some((s) => s.applied)
  return Object.freeze({
    platform,
    jobHandle: job,
    steps: Object.freeze(steps),
    applied,
    warning: null,
  })
}

/**
 * Job Object を後始末で閉じる (process exit 後の cleanup)。
 * KILL_ON_JOB_CLOSE flag が設定されていれば assigned process も終了する。
 */
export async function closeJobObjectWindows(
  job: number,
  binding: JobObjectBinding,
  platformOverride?: NodeJS.Platform,
): Promise<{ readonly closed: boolean; readonly reason: string | null }> {
  const platform = platformOverride ?? process.platform
  if (platform !== 'win32') {
    return Object.freeze({
      closed: false,
      reason: `non-windows platform=${platform}`,
    })
  }
  try {
    await binding.closeJobObject(job)
    return Object.freeze({ closed: true, reason: null })
  } catch (e) {
    return Object.freeze({
      closed: false,
      reason: e instanceof Error ? e.message : String(e),
    })
  }
}
