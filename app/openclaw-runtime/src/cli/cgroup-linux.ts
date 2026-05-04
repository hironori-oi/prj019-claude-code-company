/**
 * cli/cgroup-linux — Round 14 Dev-C 着地 (Task A.1):
 *   Round 13 Dev-C で plan 純関数化した resource-constraints.ts に対し、
 *   Linux cgroup v2 unified hierarchy への post-spawn attach を行う syscall layer。
 *
 * 設計方針 (DEC-019-006 / 051 / 053-057 整合):
 *   - **Linux only**: process.platform === 'linux' 以外では mock fallback (no-op + warn)。
 *     非 Linux 環境で import しても本 module は throw しない (CI 想定で 3 platform 同時動作)。
 *   - **post-spawn attach**: spawn options に組み込まず、子 PID 確定後に
 *     cgroup ディレクトリを作成し cgroup.procs に PID 書込で参加させる。
 *   - **cgroup v2 unified hierarchy**: kernel >= 4.5、systemd >= 232 推奨。
 *     `cpu.max` / `memory.max` / `cgroup.procs` を直接 fs.writeFile で操作。
 *   - **fileSystem DI**: 実 fs を default、test では mock fs を注入可能 (純関数性確保)。
 *   - **副作用ゼロ要件**: 本 module は Linux 上の cgroup ディレクトリのみを操作し、
 *     Sumi/Asagi の Claude Code session には一切影響しない。
 *
 * 関連:
 *   - cli/resource-constraints.ts (Round 13 Dev-C / plan 構築 純関数)
 *   - cli/job-object-windows.ts (Round 14 Dev-C / Windows 対応)
 *   - cli/real-child-spawn.ts (Round 12 Dev-C / spawn adapter)
 *   - DEC-019-007 (副作用ゼロ要件)
 *   - DEC-019-051 (subscription-driven 中核手段)
 *   - 本 Round 引継元: Round 13 Dev-C (plan 構築) → Round 14 Dev-C (syscall 実装)
 */
import type {
  CpuLimitPlan,
  MemoryLimitPlan,
  ResourceConstraintsPlan,
} from './resource-constraints.js'

/**
 * cgroup-linux 操作の最小 file system interface。
 * 実 fs を default、test では mock を注入する。
 */
export interface CgroupFileSystem {
  /** ディレクトリ再帰作成 (mkdir -p)。既存なら no-op。 */
  mkdir(path: string, opts: { recursive: boolean }): Promise<void>
  /** ファイル書込 (上書き、utf8)。 */
  writeFile(path: string, data: string): Promise<void>
  /** パス存在確認 (ENOENT で false)。 */
  exists(path: string): Promise<boolean>
}

/**
 * Linux 以外で使うための mock fallback file system。
 * 全操作 no-op、warn のみ記録する。
 */
export interface MockCgroupFileSystem extends CgroupFileSystem {
  readonly writes: ReadonlyArray<{ readonly path: string; readonly data: string }>
  readonly mkdirs: readonly string[]
}

/**
 * 実 fs を使う本番用 cgroup file system。process.platform === 'linux' 以外では
 * 各操作が即時 no-op + warn を返す (mock fallback と同等)。
 */
export function createNodeCgroupFileSystem(): CgroupFileSystem {
  return {
    async mkdir(path: string, opts: { recursive: boolean }): Promise<void> {
      if (process.platform !== 'linux') {
        return
      }
      const fs = await import('node:fs/promises')
      await fs.mkdir(path, opts)
    },
    async writeFile(path: string, data: string): Promise<void> {
      if (process.platform !== 'linux') {
        return
      }
      const fs = await import('node:fs/promises')
      await fs.writeFile(path, data, 'utf8')
    },
    async exists(path: string): Promise<boolean> {
      if (process.platform !== 'linux') {
        return false
      }
      const fs = await import('node:fs/promises')
      try {
        await fs.access(path)
        return true
      } catch {
        return false
      }
    },
  }
}

/**
 * test / 非 Linux 用 mock fs。in-memory に書込操作を記録する。
 */
export function createMockCgroupFileSystem(): MockCgroupFileSystem {
  const writes: Array<{ path: string; data: string }> = []
  const mkdirs: string[] = []
  return {
    get writes() {
      return writes
    },
    get mkdirs() {
      return mkdirs
    },
    async mkdir(path: string): Promise<void> {
      mkdirs.push(path)
    },
    async writeFile(path: string, data: string): Promise<void> {
      writes.push({ path, data })
    },
    async exists(path: string): Promise<boolean> {
      // 既存 mkdir / writeFile した path は存在するとみなす
      return mkdirs.includes(path) || writes.some((w) => w.path === path)
    },
  }
}

/**
 * cgroup v2 attach 1 ステップの結果。
 */
export interface CgroupAttachStepResult {
  readonly kind: 'cpu' | 'memory' | 'attach'
  readonly applied: boolean
  readonly skipped: boolean
  readonly skipReason: string | null
  readonly path: string | null
  readonly data: string | null
}

export interface CgroupAttachOutcome {
  readonly platform: NodeJS.Platform
  readonly cgroupPath: string | null
  readonly steps: readonly CgroupAttachStepResult[]
  readonly applied: boolean
  readonly warning: string | null
}

/**
 * Linux 以外で呼ばれた時の outcome (warn fallback)。
 */
function nonLinuxFallback(reason: string): CgroupAttachOutcome {
  return Object.freeze({
    platform: process.platform,
    cgroupPath: null,
    steps: Object.freeze([] as readonly CgroupAttachStepResult[]),
    applied: false,
    warning: reason,
  })
}

/**
 * 単一 plan 用 attach: cpu plan を cpu.max に書込。
 */
export async function applyCpuPlanLinux(
  plan: CpuLimitPlan,
  fs: CgroupFileSystem,
  platformOverride?: NodeJS.Platform,
): Promise<CgroupAttachStepResult> {
  const platform = platformOverride ?? process.platform
  if (platform !== 'linux') {
    return Object.freeze({
      kind: 'cpu',
      applied: false,
      skipped: true,
      skipReason: `non-linux platform=${platform}`,
      path: null,
      data: null,
    })
  }
  if (plan.fallback !== 'apply' || !plan.linuxCgroupPath) {
    return Object.freeze({
      kind: 'cpu',
      applied: false,
      skipped: true,
      skipReason: `cpu plan fallback=${plan.fallback}`,
      path: null,
      data: null,
    })
  }
  const path = `${plan.linuxCgroupPath}/cpu.max`
  const data = `${plan.linuxQuotaUs ?? 0} ${plan.linuxPeriodUs ?? 100_000}`
  await fs.writeFile(path, data)
  return Object.freeze({
    kind: 'cpu',
    applied: true,
    skipped: false,
    skipReason: null,
    path,
    data,
  })
}

/**
 * 単一 plan 用 attach: memory plan を memory.max に書込。
 */
export async function applyMemoryPlanLinux(
  plan: MemoryLimitPlan,
  fs: CgroupFileSystem,
  platformOverride?: NodeJS.Platform,
): Promise<CgroupAttachStepResult> {
  const platform = platformOverride ?? process.platform
  if (platform !== 'linux') {
    return Object.freeze({
      kind: 'memory',
      applied: false,
      skipped: true,
      skipReason: `non-linux platform=${platform}`,
      path: null,
      data: null,
    })
  }
  if (plan.fallback !== 'apply' || !plan.linuxCgroupPath) {
    return Object.freeze({
      kind: 'memory',
      applied: false,
      skipped: true,
      skipReason: `memory plan fallback=${plan.fallback}`,
      path: null,
      data: null,
    })
  }
  const path = `${plan.linuxCgroupPath}/memory.max`
  const data = String(plan.memoryBytes)
  await fs.writeFile(path, data)
  return Object.freeze({
    kind: 'memory',
    applied: true,
    skipped: false,
    skipReason: null,
    path,
    data,
  })
}

/**
 * 子プロセス PID を cgroup.procs に書込で attach。
 */
export async function attachPidToCgroup(
  cgroupPath: string,
  pid: number,
  fs: CgroupFileSystem,
  platformOverride?: NodeJS.Platform,
): Promise<CgroupAttachStepResult> {
  const platform = platformOverride ?? process.platform
  if (platform !== 'linux') {
    return Object.freeze({
      kind: 'attach',
      applied: false,
      skipped: true,
      skipReason: `non-linux platform=${platform}`,
      path: null,
      data: null,
    })
  }
  if (!Number.isFinite(pid) || pid <= 0) {
    return Object.freeze({
      kind: 'attach',
      applied: false,
      skipped: true,
      skipReason: `invalid pid=${pid}`,
      path: null,
      data: null,
    })
  }
  const path = `${cgroupPath}/cgroup.procs`
  const data = String(Math.floor(pid))
  await fs.writeFile(path, data)
  return Object.freeze({
    kind: 'attach',
    applied: true,
    skipped: false,
    skipReason: null,
    path,
    data,
  })
}

/**
 * 集約 plan を Linux cgroup v2 に post-spawn attach する高レベル helper。
 *
 * 動作:
 *   1. 非 Linux なら nonLinuxFallback (warn のみ、副作用ゼロ)
 *   2. cgroup ディレクトリを mkdir -p
 *   3. cpu.max / memory.max を書込 (各 plan の fallback==='apply' のみ)
 *   4. cgroup.procs に PID 書込 (pid 指定時のみ)
 */
export async function attachResourcePlanLinux(
  plan: ResourceConstraintsPlan,
  pid: number | null,
  fs: CgroupFileSystem = createNodeCgroupFileSystem(),
  platformOverride?: NodeJS.Platform,
): Promise<CgroupAttachOutcome> {
  const platform = platformOverride ?? process.platform
  if (platform !== 'linux') {
    return nonLinuxFallback(
      `cgroup-linux unsupported on platform=${platform} (mock fallback active)`,
    )
  }

  // resource-constraints.ts の plan が darwin/windows/other 用に組まれている可能性
  const cgroupPath =
    plan.cpu.linuxCgroupPath ?? plan.memory.linuxCgroupPath ?? null
  if (!cgroupPath) {
    return Object.freeze({
      platform,
      cgroupPath: null,
      steps: Object.freeze([] as readonly CgroupAttachStepResult[]),
      applied: false,
      warning:
        'no linuxCgroupPath in plan (cpu/memory both null) - plan was built for non-linux platform',
    })
  }

  const steps: CgroupAttachStepResult[] = []
  await fs.mkdir(cgroupPath, { recursive: true })

  // cpu
  steps.push(await applyCpuPlanLinux(plan.cpu, fs, platform))
  // memory
  steps.push(await applyMemoryPlanLinux(plan.memory, fs, platform))
  // attach pid
  if (pid !== null && Number.isFinite(pid) && pid > 0) {
    steps.push(await attachPidToCgroup(cgroupPath, pid, fs, platform))
  }

  const applied = steps.some((s) => s.applied)
  return Object.freeze({
    platform,
    cgroupPath,
    steps: Object.freeze(steps),
    applied,
    warning: null,
  })
}

/**
 * cgroup ディレクトリを後始末で削除する (process exit 後の cleanup)。
 * 注意: cgroup v2 は子プロセスが exit した後でないと rmdir できない。
 *       本 helper は best-effort、失敗時は warn のみで throw しない。
 */
export async function removeCgroupLinux(
  cgroupPath: string,
  platformOverride?: NodeJS.Platform,
): Promise<{ readonly removed: boolean; readonly reason: string | null }> {
  const platform = platformOverride ?? process.platform
  if (platform !== 'linux') {
    return Object.freeze({
      removed: false,
      reason: `non-linux platform=${platform}`,
    })
  }
  try {
    const fs = await import('node:fs/promises')
    // cgroup v2 ディレクトリは rmdir のみ受付 (rm -rf は EBUSY を返すことがある)
    await fs.rmdir(cgroupPath)
    return Object.freeze({ removed: true, reason: null })
  } catch (e) {
    return Object.freeze({
      removed: false,
      reason: e instanceof Error ? e.message : String(e),
    })
  }
}
