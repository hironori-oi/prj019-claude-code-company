/**
 * cli/resource-quota-constants — Round 15 Dev-L 着地 (Task L-1):
 *   subprocess spawn 時の resource limit (cpu / memory / time) の最低設定値および
 *   デフォルト推奨値を一元管理する constants module。
 *
 * 設計方針 (DEC-019-006 / 051 / 053-057 整合):
 *   - Round 14 Dev-C で実装された cgroup-linux.ts / job-object-windows.ts /
 *     resource-constraints.ts (plan 純関数化) に対して、運用時に
 *     "閾値はどこで定義されているか" を一意化するために constants 化。
 *   - **5/7 朝 drill #2 検証用**: 以下の MIN/DEFAULT 値を drill harness が直接 import し
 *     "実機 spawn しても Sumi/Asagi に影響しない最低かつ十分な" 設定を保証する。
 *   - 数値根拠:
 *       MEMORY_MIN_BYTES        = 64 MiB  — Claude Code CLI が起動可能な最低 (実測 ≈ 50 MiB)
 *       MEMORY_DEFAULT_BYTES    = 512 MiB — drill harness の subscription 1-shot 上限
 *       MEMORY_MAX_BYTES        = 4 GiB   — single subprocess が一時的に確保しうる最大
 *       CPU_MIN_PERCENT         = 25     — 1/4 core (Claude Code の async I/O が滞らない最低)
 *       CPU_DEFAULT_PERCENT     = 200    — 2 core 相当 (drill 並列 9 シナリオの安定値)
 *       CPU_MAX_PERCENT         = 800    — 8 core (CI runner 上限 想定)
 *       TIME_MIN_MS             = 1_000  — 1 秒 (kill drill 想定の最短)
 *       TIME_DEFAULT_MS         = 60_000 — 60 秒 (drill 1-shot timeout 既定)
 *       TIME_MAX_MS             = 12 * 60 * 60 * 1000 — 12h (NG-3 連続稼働 cap)
 *   - **lower-bound clamping**: 構築時に MIN を下回る値が渡された場合、
 *     plan 構築層 (resource-constraints.ts) は受け付けるが、本 module の
 *     `clampResourceQuotaSpec` で警告 + clamp する純関数を提供する。
 *
 * 関連:
 *   - cli/resource-constraints.ts (Round 13 Dev-C / plan 純関数化)
 *   - cli/cgroup-linux.ts          (Round 14 Dev-C / Linux syscall layer)
 *   - cli/job-object-windows.ts    (Round 14 Dev-C / Windows Job Object layer)
 *   - DEC-019-007 (副作用ゼロ要件)
 *   - DEC-019-051 (subscription-driven 中核手段 / 月総額 ≤$430 cap)
 *   - drill #2 5/7 朝 06:00-08:00 JST の実機検証 (Review-F 担当)
 */

/** Memory quota (bytes) bounds. */
export const MEMORY_MIN_BYTES = 64 * 1024 * 1024
export const MEMORY_DEFAULT_BYTES = 512 * 1024 * 1024
export const MEMORY_MAX_BYTES = 4 * 1024 * 1024 * 1024

/** CPU quota (percent, 100 = 1 core) bounds. */
export const CPU_MIN_PERCENT = 25
export const CPU_DEFAULT_PERCENT = 200
export const CPU_MAX_PERCENT = 800

/** Wall-clock time quota (ms) bounds. */
export const TIME_MIN_MS = 1_000
export const TIME_DEFAULT_MS = 60_000
export const TIME_MAX_MS = 12 * 60 * 60 * 1000

/** kill grace period (SIGTERM → SIGKILL) ms. */
export const KILL_GRACE_MIN_MS = 50
export const KILL_GRACE_DEFAULT_MS = 200
export const KILL_GRACE_MAX_MS = 5_000

/** drill #2 1-shot 用の推奨デフォルト集約 (Review-F 5/7 朝検証で参照される値)。 */
export const DRILL_2_RECOMMENDED_QUOTA: ResourceQuotaSpec = Object.freeze({
  cpuPercent: CPU_DEFAULT_PERCENT,
  memoryBytes: MEMORY_DEFAULT_BYTES,
  maxMs: TIME_DEFAULT_MS,
  killGraceMs: KILL_GRACE_DEFAULT_MS,
}) as ResourceQuotaSpec

/**
 * resource quota の入力値。すべて optional で、未指定時は default 推奨値を使う。
 */
export interface ResourceQuotaSpec {
  readonly cpuPercent?: number
  readonly memoryBytes?: number
  readonly maxMs?: number
  readonly killGraceMs?: number
}

/**
 * clamp の結果。1 値ごとに "in-range" / "clamped-to-min" / "clamped-to-max" / "default-applied" を返す。
 */
export type ClampOutcome =
  | 'in-range'
  | 'clamped-to-min'
  | 'clamped-to-max'
  | 'default-applied'

export interface ClampedResourceQuota {
  readonly cpuPercent: number
  readonly memoryBytes: number
  readonly maxMs: number
  readonly killGraceMs: number
  readonly outcomes: Readonly<Record<keyof ResourceQuotaSpec, ClampOutcome>>
  readonly warnings: readonly string[]
}

/**
 * 1 値を MIN/DEFAULT/MAX に clamp する純関数。
 *
 * @param raw    入力値 (undefined / null / NaN / 非有限 → default)
 * @param minV   下限
 * @param defV   未指定 / 不正値時のデフォルト
 * @param maxV   上限
 * @returns clamp 結果 + outcome
 */
export function clampNumeric(
  raw: number | undefined | null,
  minV: number,
  defV: number,
  maxV: number,
): { readonly value: number; readonly outcome: ClampOutcome } {
  if (raw === undefined || raw === null || !Number.isFinite(raw)) {
    return { value: defV, outcome: 'default-applied' }
  }
  if (raw < minV) {
    return { value: minV, outcome: 'clamped-to-min' }
  }
  if (raw > maxV) {
    return { value: maxV, outcome: 'clamped-to-max' }
  }
  return { value: raw, outcome: 'in-range' }
}

/**
 * resource quota spec を clamp する純関数。spec 中の各 field を MIN/DEFAULT/MAX に
 * 沿って正規化し、clamp 結果と warnings を返す。
 *
 * 使用例 (drill harness):
 *   const clamped = clampResourceQuotaSpec({ memoryBytes: 32 * 1024 * 1024 })
 *   // clamped.memoryBytes === MEMORY_MIN_BYTES
 *   // clamped.outcomes.memoryBytes === 'clamped-to-min'
 *   // clamped.warnings includes 'memoryBytes: clamped to MIN ...'
 */
export function clampResourceQuotaSpec(
  spec: ResourceQuotaSpec = {},
): ClampedResourceQuota {
  const cpu = clampNumeric(
    spec.cpuPercent,
    CPU_MIN_PERCENT,
    CPU_DEFAULT_PERCENT,
    CPU_MAX_PERCENT,
  )
  const mem = clampNumeric(
    spec.memoryBytes,
    MEMORY_MIN_BYTES,
    MEMORY_DEFAULT_BYTES,
    MEMORY_MAX_BYTES,
  )
  const time = clampNumeric(
    spec.maxMs,
    TIME_MIN_MS,
    TIME_DEFAULT_MS,
    TIME_MAX_MS,
  )
  const grace = clampNumeric(
    spec.killGraceMs,
    KILL_GRACE_MIN_MS,
    KILL_GRACE_DEFAULT_MS,
    KILL_GRACE_MAX_MS,
  )
  const warnings: string[] = []
  const reportField = (
    name: keyof ResourceQuotaSpec,
    raw: number | undefined,
    outcome: ClampOutcome,
    minV: number,
    maxV: number,
  ): void => {
    if (outcome === 'clamped-to-min') {
      warnings.push(`${name}: clamped to MIN ${minV} (raw=${String(raw)})`)
    } else if (outcome === 'clamped-to-max') {
      warnings.push(`${name}: clamped to MAX ${maxV} (raw=${String(raw)})`)
    } else if (outcome === 'default-applied' && raw !== undefined) {
      warnings.push(`${name}: invalid value (raw=${String(raw)}), default applied`)
    }
  }
  reportField('cpuPercent', spec.cpuPercent, cpu.outcome, CPU_MIN_PERCENT, CPU_MAX_PERCENT)
  reportField('memoryBytes', spec.memoryBytes, mem.outcome, MEMORY_MIN_BYTES, MEMORY_MAX_BYTES)
  reportField('maxMs', spec.maxMs, time.outcome, TIME_MIN_MS, TIME_MAX_MS)
  reportField('killGraceMs', spec.killGraceMs, grace.outcome, KILL_GRACE_MIN_MS, KILL_GRACE_MAX_MS)

  return Object.freeze({
    cpuPercent: cpu.value,
    memoryBytes: mem.value,
    maxMs: time.value,
    killGraceMs: grace.value,
    outcomes: Object.freeze({
      cpuPercent: cpu.outcome,
      memoryBytes: mem.outcome,
      maxMs: time.outcome,
      killGraceMs: grace.outcome,
    }) as Readonly<Record<keyof ResourceQuotaSpec, ClampOutcome>>,
    warnings: Object.freeze(warnings) as readonly string[],
  })
}

/**
 * platform-aware なデフォルト quota を生成する純関数。
 *   - Linux  : DRILL_2_RECOMMENDED_QUOTA (cgroup v2 で完全適用)
 *   - Windows: DRILL_2_RECOMMENDED_QUOTA (Job Object で完全適用)
 *   - macOS  : DRILL_2_RECOMMENDED_QUOTA (warn fallback だが値は同等)
 *   - other  : DRILL_2_RECOMMENDED_QUOTA (unsupported fallback)
 *
 * platform 分岐は plan 構築層 (resource-constraints.ts) に委譲し、本 module は
 * "値の決定" のみを担当する。
 */
export function defaultQuotaForPlatform(
  platform: NodeJS.Platform = process.platform,
): ResourceQuotaSpec {
  // 現状全 platform で同一の値を返すが、将来 platform 別 tuning が必要になった場合の
  // 拡張点として関数を分離する。
  void platform
  return DRILL_2_RECOMMENDED_QUOTA
}
