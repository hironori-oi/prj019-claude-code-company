/**
 * cli/resource-constraints — Round 13 Dev-C 着地 (Task A):
 *   real-child-spawn にアタッチする CPU / Memory / Time の resource 制約を、
 *   OS 抽象化レイヤとして提供する pure-function based design module。
 *
 * 設計方針 (Round 12 Dev-C 引継 #1 への対応 / DEC-019-006 / 051 / 053-057 整合):
 *   - **post-spawn attach**: 実 syscall は本 module では呼ばない (Round 14 で実装)。
 *     spawn options に組み込まず、別 helper (attachResourceLimits) で post-spawn にアタッチする
 *     abstraction layer に留める。
 *   - **3 platform 抽象化**:
 *       Linux  : cgroup v2 (`/sys/fs/cgroup/<scope>` 経由 / cpu.max / memory.max / unified hierarchy)
 *       Windows: Job Object (CreateJobObject + AssignProcessToJobObject + SetInformationJobObject /
 *                 JobObjectExtendedLimitInformation / @types/win32-api 等)
 *       macOS  : sandbox-exec / setrlimit (RLIMIT_CPU / RLIMIT_AS) は限定 (fallback warn)
 *   - **pure function based**: applyCpuLimit / applyMemoryLimit / applyTimeLimit は
 *     plan を返す純関数。実行は executePlan(plan, child) helper が担当 (Round 14)。
 *   - **platform detection + fallback strategy 明記**:
 *       未対応 platform / 権限不足 / cgroup v1 = 'warn' fallback、process は止めない。
 *       Sumi/Asagi 巻き添えゼロ確証のため、強制終了系の制約は明示 opt-in 必須。
 *   - **副作用ゼロ要件**: 本 file の全 export は plan 構築のみで OS 状態を変更しない。
 *     execute は将来 Round 14 で実装、本 Round はテストで plan 構築の純性を検証。
 *
 * 関連:
 *   - cli/real-child-spawn.ts (Round 12 Dev-C / spawn adapter)
 *   - cli/spawn-claude-code.ts (MockChildProcess interface)
 *   - DEC-019-007 (副作用ゼロ要件)
 *   - DEC-019-051 (subscription-driven 中核手段)
 *   - DEC-019-053-057 (W0 前倒し)
 *   - 本 Round 引継: Round 14 で executePlan を syscall 実装、CI では Linux/Windows runner 別 smoke
 */

/**
 * Resource limit プラットフォーム識別。
 *   - linux  : cgroup v2 unified hierarchy (kernel >= 4.5 推奨、systemd >= 232)
 *   - windows: Job Object API (Windows 8 以降の native)
 *   - darwin : macOS。sandbox-exec / setrlimit fallback (限定機能)
 *   - other  : freebsd / openbsd / sunos など (本 module では fallback warn)
 */
export type ResourcePlatform = 'linux' | 'windows' | 'darwin' | 'other'

/**
 * fallback 戦略識別。
 *   - 'apply'         : plan の syscall 実行 (Round 14 で executePlan が利用)
 *   - 'warn'          : 警告 log のみ、syscall は呼ばない (機能不足 platform)
 *   - 'noop'          : 何もしない (limit 値が無効 / 0 の場合)
 *   - 'unsupported'   : platform 完全非対応、caller 側で別経路推奨
 */
export type FallbackStrategy = 'apply' | 'warn' | 'noop' | 'unsupported'

/**
 * 各 limit plan の共通 base。
 */
interface ResourceLimitPlanBase {
  readonly platform: ResourcePlatform
  readonly fallback: FallbackStrategy
  /** 警告メッセージ (fallback==='warn' 時のみ非 null) */
  readonly warnMessage: string | null
  /** 適用対象 PID (post-spawn attach 用、apply 時は必須) */
  readonly attachToPid: number | null
}

/**
 * CPU limit plan (% 換算で 1 core = 100、4 core = 400)。
 *   - linux  : cpu.max への "<quota> <period>" 書込 plan (period=100000 us 固定)
 *   - windows: JobObjectCpuRateControlInformation の CpuRate 設定 plan
 *   - darwin : nice / renice 経由の relative priority のみ (warn fallback)
 */
export interface CpuLimitPlan extends ResourceLimitPlanBase {
  readonly kind: 'cpu'
  /** percent 上限 (100 = 1 core 相当)。0 の場合は noop。 */
  readonly cpuPercent: number
  /** linux 用: cpu.max quota 値 (microseconds per period)、非 linux では null */
  readonly linuxQuotaUs: number | null
  /** linux 用: cpu.max period 値 (microseconds)、非 linux では null */
  readonly linuxPeriodUs: number | null
  /** windows 用: JobObjectCpuRateControlInformation.CpuRate (1/100 of 1%)、非 windows では null */
  readonly windowsCpuRate: number | null
  /** linux 用: cgroup v2 のターゲット path (例 '/sys/fs/cgroup/clawbridge-<token>') */
  readonly linuxCgroupPath: string | null
}

/**
 * Memory limit plan。
 *   - linux  : memory.max への bytes 書込 plan
 *   - windows: JobObjectExtendedLimitInformation の ProcessMemoryLimit 設定 plan
 *   - darwin : setrlimit(RLIMIT_AS) で virtual memory 制限 (実 RSS は制御不可)
 */
export interface MemoryLimitPlan extends ResourceLimitPlanBase {
  readonly kind: 'memory'
  /** メモリ上限 bytes。0 の場合は noop。 */
  readonly memoryBytes: number
  /** linux 用 cgroup path */
  readonly linuxCgroupPath: string | null
  /** windows 用 ProcessMemoryLimit (bytes) */
  readonly windowsMemoryLimit: number | null
  /** darwin 用 RLIMIT_AS 値 (bytes) */
  readonly darwinRlimitAs: number | null
}

/**
 * Time limit plan (実時間 wall-clock 上限)。
 *   - linux  : 実装は cgroup ではなく setTimeout + SIGTERM/SIGKILL (cgroup は cpu.max のみ)
 *   - windows: JobObjectExtendedLimitInformation.PerProcessUserTimeLimit (user time)
 *   - darwin : setTimeout + kill fallback
 */
export interface TimeLimitPlan extends ResourceLimitPlanBase {
  readonly kind: 'time'
  /** 上限 ms。0 の場合は noop。 */
  readonly maxMs: number
  /** windows 用 PerProcessUserTimeLimit (100-nanosecond units) */
  readonly windowsUserTimeLimit100ns: number | null
  /** 全 platform 共通: setTimeout fallback の grace ms (default 200ms) */
  readonly killGraceMs: number
}

/**
 * 3 制約をまとめた集約 plan。
 */
export interface ResourceConstraintsPlan {
  readonly cpu: CpuLimitPlan
  readonly memory: MemoryLimitPlan
  readonly time: TimeLimitPlan
  readonly platform: ResourcePlatform
  /** 全制約とも 'apply' なら true、1 つでも warn / unsupported なら false */
  readonly fullySupported: boolean
}

/**
 * applyXxxLimit / buildResourceConstraintsPlan の入力。
 */
export interface ResourceLimitInput {
  /** post-spawn attach 用 pid (Round 14 executePlan が利用) */
  pid: number | null
  /** 上書き platform 判定 (test 用、default = process.platform から推論) */
  platformOverride?: ResourcePlatform
  /** linux cgroup base path (default '/sys/fs/cgroup') */
  linuxCgroupBase?: string
  /** linux cgroup scope name (default 'clawbridge-<random>') */
  linuxCgroupScope?: string
  /** kill grace ms (time limit fallback、default 200) */
  killGraceMs?: number
}

/**
 * platform detect (純関数)。
 */
export function detectPlatform(
  override?: ResourcePlatform,
): ResourcePlatform {
  if (override) return override
  switch (process.platform) {
    case 'linux':
      return 'linux'
    case 'win32':
      return 'windows'
    case 'darwin':
      return 'darwin'
    default:
      return 'other'
  }
}

/**
 * cgroup path 構築 (純関数)。
 */
export function buildLinuxCgroupPath(
  base: string,
  scope: string,
): string {
  // 末尾 / は trim、scope は path traversal 不可
  const cleanBase = base.replace(/\/+$/, '')
  const cleanScope = scope.replace(/[^A-Za-z0-9_\-]/g, '_')
  return `${cleanBase}/${cleanScope}`
}

/**
 * CPU limit plan を構築する純関数。
 *
 * @param cpuPercent 100 = 1 core 相当 (例: 200 で 2 core 等価)
 * @param input platform / pid / cgroup option
 */
export function applyCpuLimit(
  cpuPercent: number,
  input: ResourceLimitInput,
): CpuLimitPlan {
  const platform = detectPlatform(input.platformOverride)
  const base = input.linuxCgroupBase ?? '/sys/fs/cgroup'
  const scope = input.linuxCgroupScope ?? `clawbridge-${defaultScopeToken()}`
  const cgroupPath = buildLinuxCgroupPath(base, scope)

  // 0 / 負数は noop
  if (cpuPercent <= 0 || !Number.isFinite(cpuPercent)) {
    return Object.freeze({
      kind: 'cpu',
      platform,
      fallback: 'noop',
      warnMessage: null,
      attachToPid: input.pid,
      cpuPercent: 0,
      linuxQuotaUs: null,
      linuxPeriodUs: null,
      windowsCpuRate: null,
      linuxCgroupPath: null,
    }) as CpuLimitPlan
  }

  if (platform === 'linux') {
    // cpu.max format: "<quota> <period>"
    // period = 100000 (100ms) 固定、quota = period * (cpuPercent / 100)
    const period = 100_000
    const quota = Math.floor((period * cpuPercent) / 100)
    return Object.freeze({
      kind: 'cpu',
      platform,
      fallback: 'apply',
      warnMessage: null,
      attachToPid: input.pid,
      cpuPercent,
      linuxQuotaUs: quota,
      linuxPeriodUs: period,
      windowsCpuRate: null,
      linuxCgroupPath: cgroupPath,
    }) as CpuLimitPlan
  }
  if (platform === 'windows') {
    // CpuRate は 1/100 of 1% 単位、ただし single core 換算 (100% = 10000)
    // multi-core では JOB_OBJECT_CPU_RATE_CONTROL_HARD_CAP + WeightBased が必要 (Round 14)
    // 本 plan では cpuPercent (100 = 1 core) を 100 倍した値を CpuRate として記録
    const rate = Math.min(10_000, Math.max(1, Math.floor(cpuPercent * 100)))
    return Object.freeze({
      kind: 'cpu',
      platform,
      fallback: 'apply',
      warnMessage: null,
      attachToPid: input.pid,
      cpuPercent,
      linuxQuotaUs: null,
      linuxPeriodUs: null,
      windowsCpuRate: rate,
      linuxCgroupPath: null,
    }) as CpuLimitPlan
  }
  if (platform === 'darwin') {
    return Object.freeze({
      kind: 'cpu',
      platform,
      fallback: 'warn',
      warnMessage:
        'darwin: cpu hard limit unsupported (use nice/renice priority only)',
      attachToPid: input.pid,
      cpuPercent,
      linuxQuotaUs: null,
      linuxPeriodUs: null,
      windowsCpuRate: null,
      linuxCgroupPath: null,
    }) as CpuLimitPlan
  }
  // other
  return Object.freeze({
    kind: 'cpu',
    platform,
    fallback: 'unsupported',
    warnMessage: `platform=${platform}: cpu limit unsupported`,
    attachToPid: input.pid,
    cpuPercent,
    linuxQuotaUs: null,
    linuxPeriodUs: null,
    windowsCpuRate: null,
    linuxCgroupPath: null,
  }) as CpuLimitPlan
}

/**
 * Memory limit plan を構築する純関数。
 *
 * @param memoryBytes バイト単位上限 (例: 512 * 1024 * 1024 で 512 MiB)
 */
export function applyMemoryLimit(
  memoryBytes: number,
  input: ResourceLimitInput,
): MemoryLimitPlan {
  const platform = detectPlatform(input.platformOverride)
  const base = input.linuxCgroupBase ?? '/sys/fs/cgroup'
  const scope = input.linuxCgroupScope ?? `clawbridge-${defaultScopeToken()}`
  const cgroupPath = buildLinuxCgroupPath(base, scope)

  if (memoryBytes <= 0 || !Number.isFinite(memoryBytes)) {
    return Object.freeze({
      kind: 'memory',
      platform,
      fallback: 'noop',
      warnMessage: null,
      attachToPid: input.pid,
      memoryBytes: 0,
      linuxCgroupPath: null,
      windowsMemoryLimit: null,
      darwinRlimitAs: null,
    }) as MemoryLimitPlan
  }

  if (platform === 'linux') {
    return Object.freeze({
      kind: 'memory',
      platform,
      fallback: 'apply',
      warnMessage: null,
      attachToPid: input.pid,
      memoryBytes: Math.floor(memoryBytes),
      linuxCgroupPath: cgroupPath,
      windowsMemoryLimit: null,
      darwinRlimitAs: null,
    }) as MemoryLimitPlan
  }
  if (platform === 'windows') {
    return Object.freeze({
      kind: 'memory',
      platform,
      fallback: 'apply',
      warnMessage: null,
      attachToPid: input.pid,
      memoryBytes: Math.floor(memoryBytes),
      linuxCgroupPath: null,
      windowsMemoryLimit: Math.floor(memoryBytes),
      darwinRlimitAs: null,
    }) as MemoryLimitPlan
  }
  if (platform === 'darwin') {
    // RLIMIT_AS は virtual memory のみ、RSS 制御は不可。warn fallback とする。
    return Object.freeze({
      kind: 'memory',
      platform,
      fallback: 'warn',
      warnMessage:
        'darwin: memory hard limit only via setrlimit(RLIMIT_AS) - virtual memory only, RSS uncapped',
      attachToPid: input.pid,
      memoryBytes: Math.floor(memoryBytes),
      linuxCgroupPath: null,
      windowsMemoryLimit: null,
      darwinRlimitAs: Math.floor(memoryBytes),
    }) as MemoryLimitPlan
  }
  return Object.freeze({
    kind: 'memory',
    platform,
    fallback: 'unsupported',
    warnMessage: `platform=${platform}: memory limit unsupported`,
    attachToPid: input.pid,
    memoryBytes: Math.floor(memoryBytes),
    linuxCgroupPath: null,
    windowsMemoryLimit: null,
    darwinRlimitAs: null,
  }) as MemoryLimitPlan
}

/**
 * Time limit plan を構築する純関数 (wall-clock 上限)。
 *
 * @param maxMs 上限 ms
 */
export function applyTimeLimit(
  maxMs: number,
  input: ResourceLimitInput,
): TimeLimitPlan {
  const platform = detectPlatform(input.platformOverride)
  const killGraceMs = input.killGraceMs ?? 200

  if (maxMs <= 0 || !Number.isFinite(maxMs)) {
    return Object.freeze({
      kind: 'time',
      platform,
      fallback: 'noop',
      warnMessage: null,
      attachToPid: input.pid,
      maxMs: 0,
      windowsUserTimeLimit100ns: null,
      killGraceMs,
    }) as TimeLimitPlan
  }

  if (platform === 'windows') {
    // PerProcessUserTimeLimit は 100-nanosecond units (1 ms = 10000 100ns)
    const userTime = Math.floor(maxMs * 10_000)
    return Object.freeze({
      kind: 'time',
      platform,
      fallback: 'apply',
      warnMessage: null,
      attachToPid: input.pid,
      maxMs: Math.floor(maxMs),
      windowsUserTimeLimit100ns: userTime,
      killGraceMs,
    }) as TimeLimitPlan
  }
  // linux / darwin / other は setTimeout + SIGTERM/SIGKILL fallback
  return Object.freeze({
    kind: 'time',
    platform,
    fallback: 'apply',
    warnMessage: null,
    attachToPid: input.pid,
    maxMs: Math.floor(maxMs),
    windowsUserTimeLimit100ns: null,
    killGraceMs,
  }) as TimeLimitPlan
}

/**
 * 3 制約をまとめて build (純関数)。
 */
export function buildResourceConstraintsPlan(
  spec: {
    cpuPercent?: number
    memoryBytes?: number
    maxMs?: number
  },
  input: ResourceLimitInput,
): ResourceConstraintsPlan {
  const cpu = applyCpuLimit(spec.cpuPercent ?? 0, input)
  const memory = applyMemoryLimit(spec.memoryBytes ?? 0, input)
  const time = applyTimeLimit(spec.maxMs ?? 0, input)
  const platform = detectPlatform(input.platformOverride)
  const allApplyOrNoop = [cpu, memory, time].every(
    (p) => p.fallback === 'apply' || p.fallback === 'noop',
  )
  return Object.freeze({
    cpu,
    memory,
    time,
    platform,
    fullySupported: allApplyOrNoop,
  }) as ResourceConstraintsPlan
}

/**
 * scope token のデフォルト生成 (純関数性は保つため、ts ベース + Math.random)。
 * test では platformOverride / linuxCgroupScope を渡して deterministic にする。
 */
function defaultScopeToken(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
