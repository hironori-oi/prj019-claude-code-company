/**
 * cli/spawn-resource-attach — Round 15 Dev-L 着地 (Task L-1):
 *   subprocess spawn 経路の post-spawn hook として、
 *   Round 14 Dev-C で実装済の cgroup-linux / job-object-windows を統合する
 *   platform-aware attach helper。
 *
 * 設計方針 (DEC-019-006 / 051 / 053-057 整合):
 *   - **post-spawn attach 一元化**: caller (drill harness / session-controller / tests) は
 *     `attachResourcePlanCrossPlatform(plan, pid)` 1 関数だけを呼べば、
 *     Linux では cgroup v2 / Windows では Job Object / macOS と other では noop+warn を
 *     適用できる。
 *   - **副作用ゼロ要件 (DEC-019-007)**: 非対応 platform では即時 fallback、
 *     Sumi/Asagi 巻き添えゼロ確証。
 *   - **DI**: cgroupFs / jobBinding / platformOverride を inject 可能、test では mock を
 *     渡して実 fs / native binding を一切触らない。
 *   - **constants 連携**: resource-quota-constants.ts の MIN/DEFAULT/MAX で clamp し、
 *     resource-constraints.ts に渡す前に 1 段階の正規化を実施する。
 *
 * 関連:
 *   - cli/cgroup-linux.ts          (Round 14 Dev-C / Linux)
 *   - cli/job-object-windows.ts    (Round 14 Dev-C / Windows)
 *   - cli/resource-constraints.ts  (Round 13 Dev-C / plan 純関数)
 *   - cli/resource-quota-constants.ts (Round 15 Dev-L / 本 Round 同梱)
 *   - DEC-019-007 / 051
 *   - drill #2 5/7 朝 06:00-08:00 JST 検証 (Review-F 担当)
 */
import {
  attachResourcePlanLinux,
  createMockCgroupFileSystem,
  createNodeCgroupFileSystem,
  type CgroupAttachOutcome,
  type CgroupFileSystem,
  type MockCgroupFileSystem,
} from './cgroup-linux.js'
import {
  attachResourcePlanWindows,
  createMockJobObjectBinding,
  type JobAttachOutcome,
  type JobObjectBinding,
  type MockJobObjectBinding,
} from './job-object-windows.js'
import {
  buildResourceConstraintsPlan,
  type ResourceConstraintsPlan,
  type ResourceLimitInput,
  type ResourcePlatform,
} from './resource-constraints.js'
import {
  clampResourceQuotaSpec,
  type ClampedResourceQuota,
  type ResourceQuotaSpec,
} from './resource-quota-constants.js'

/**
 * spawn-resource-attach の 1 試行結果。
 */
export interface CrossPlatformAttachOutcome {
  readonly platform: ResourcePlatform
  /** 実行された syscall 経路: 'linux-cgroup' / 'windows-job' / 'noop-darwin' / 'noop-other' */
  readonly route: 'linux-cgroup' | 'windows-job' | 'noop-darwin' | 'noop-other'
  /** いずれかの step が apply された場合 true */
  readonly applied: boolean
  /** noop / unsupported 時の警告メッセージ */
  readonly warning: string | null
  /** clamp 結果 (resource-quota-constants 経由) */
  readonly clamped: ClampedResourceQuota
  /** Linux 経路時の詳細 outcome (linux 以外では null) */
  readonly linuxOutcome: CgroupAttachOutcome | null
  /** Windows 経路時の詳細 outcome (windows 以外では null) */
  readonly windowsOutcome: JobAttachOutcome | null
  /** 構築された plan (audit / debug 用) */
  readonly plan: ResourceConstraintsPlan
}

/**
 * cross-platform attach options。test では mock を inject。
 */
export interface AttachResourcePlanOptions {
  /** 上書き platform (test 用、default = process.platform から推論) */
  platformOverride?: ResourcePlatform
  /** Linux 用 cgroup file system DI (default = createNodeCgroupFileSystem) */
  cgroupFs?: CgroupFileSystem | MockCgroupFileSystem
  /** Windows 用 Job Object binding DI (default = createMockJobObjectBinding) */
  jobBinding?: JobObjectBinding | MockJobObjectBinding
  /** Linux 用 cgroup base path */
  linuxCgroupBase?: string
  /** Linux 用 cgroup scope name */
  linuxCgroupScope?: string
  /** Windows 用 job name */
  windowsJobName?: string
}

/**
 * cross-platform attach 1 ステップ helper。
 *
 * 動作:
 *   1. quota spec を MIN/DEFAULT/MAX に clamp
 *   2. resource-constraints.ts で plan を構築
 *   3. platform 分岐:
 *      - linux   → attachResourcePlanLinux
 *      - windows → attachResourcePlanWindows
 *      - darwin  → noop + warn (route='noop-darwin')
 *      - other   → noop + warn (route='noop-other')
 *
 * @param spec   quota spec (cpu / memory / time)
 * @param pid    子プロセス PID (null で attach skip、cpu/memory のみ書込)
 * @param opts   DI / override
 */
export async function attachResourcePlanCrossPlatform(
  spec: ResourceQuotaSpec,
  pid: number | null,
  opts: AttachResourcePlanOptions = {},
): Promise<CrossPlatformAttachOutcome> {
  const platform = detectPlatformForAttach(opts.platformOverride)
  const clamped = clampResourceQuotaSpec(spec)
  const limitInput: ResourceLimitInput = {
    pid,
    platformOverride: platform,
    killGraceMs: clamped.killGraceMs,
  }
  if (opts.linuxCgroupBase !== undefined) {
    limitInput.linuxCgroupBase = opts.linuxCgroupBase
  }
  if (opts.linuxCgroupScope !== undefined) {
    limitInput.linuxCgroupScope = opts.linuxCgroupScope
  }
  const plan = buildResourceConstraintsPlan(
    {
      cpuPercent: clamped.cpuPercent,
      memoryBytes: clamped.memoryBytes,
      maxMs: clamped.maxMs,
    },
    limitInput,
  )

  if (platform === 'linux') {
    const fs = opts.cgroupFs ?? createNodeCgroupFileSystem()
    const linuxOutcome = await attachResourcePlanLinux(plan, pid, fs, 'linux')
    return Object.freeze({
      platform,
      route: 'linux-cgroup' as const,
      applied: linuxOutcome.applied,
      warning: linuxOutcome.warning,
      clamped,
      linuxOutcome,
      windowsOutcome: null,
      plan,
    })
  }
  if (platform === 'windows') {
    const binding = opts.jobBinding ?? createMockJobObjectBinding()
    const jobName = opts.windowsJobName ?? `clawbridge-r15l-${Date.now().toString(36)}`
    const windowsOutcome: JobAttachOutcome = await attachResourcePlanWindows(
      plan,
      pid,
      binding,
      'win32',
      jobName,
    )
    return Object.freeze({
      platform,
      route: 'windows-job' as const,
      applied: windowsOutcome.applied,
      warning: windowsOutcome.warning,
      clamped,
      linuxOutcome: null,
      windowsOutcome,
      plan,
    })
  }
  if (platform === 'darwin') {
    return Object.freeze({
      platform,
      route: 'noop-darwin' as const,
      applied: false,
      warning:
        'spawn-resource-attach: darwin platform — noop fallback (RLIMIT_AS only via setrlimit, RSS uncapped)',
      clamped,
      linuxOutcome: null,
      windowsOutcome: null,
      plan,
    })
  }
  return Object.freeze({
    platform,
    route: 'noop-other' as const,
    applied: false,
    warning: `spawn-resource-attach: platform=${platform} unsupported — noop fallback`,
    clamped,
    linuxOutcome: null,
    windowsOutcome: null,
    plan,
  })
}

/**
 * process.platform → ResourcePlatform の純関数 mapping。
 */
export function detectPlatformForAttach(
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
 * test / drill-harness 用: mock binding/fs を一括で生成する helper。
 */
export function createMockAttachOptions(): {
  readonly cgroupFs: MockCgroupFileSystem
  readonly jobBinding: MockJobObjectBinding
} {
  return Object.freeze({
    cgroupFs: createMockCgroupFileSystem(),
    jobBinding: createMockJobObjectBinding(),
  })
}
