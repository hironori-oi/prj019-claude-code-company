/**
 * P-UI-04 — kill switch propagation (Round 17 W1 完成版, 5/9 kickoff)
 * kill switch 発火 → 30s 内に全子プロセス SIGTERM → SIGKILL 連鎖到達。
 * Spec: ../../specs/17day-path-7ctrl.md#p-ui-04
 *
 * Round 17 W1 で I/O port 注入: subprocess kill token broadcaster + verify port +
 * graceful → forceful → verified ステートマシン。本ファイルは process.kill を直接呼ばない。
 */
import { z } from 'zod'

export const KILL_DEADLINE_MS = 30_000
export const SIGTERM_GRACE_MS = 5_000

export const KillInputSchema = z.object({
  killReason: z.string().min(1),
  initiatedAt: z.string().datetime(),
  pidTree: z.array(z.number().int().positive()).max(1024),
})
export type KillInput = z.infer<typeof KillInputSchema>

export const KillStatusSchema = z.enum(['all_terminated', 'partial', 'failed'])
export type KillStatus = z.infer<typeof KillStatusSchema>

export const KillOutputSchema = z.object({
  totalKilled: z.number().int().nonnegative(),
  survivors: z.array(z.number().int().positive()),
  latencyMs: z.number().int().nonnegative(),
  status: KillStatusSchema,
  deadlineExceeded: z.boolean(),
})
export type KillOutput = z.infer<typeof KillOutputSchema>

export interface ProcessKiller {
  /** SIGTERM / SIGKILL を pid に送る port。成功時 true。 */
  signal(pid: number, sig: 'SIGTERM' | 'SIGKILL'): Promise<boolean>
}

/** Round 17 W1: subprocess kill token 統合用の追加 port。 */
export interface KillBroadcasterOptions {
  /**
   * graceful 後 / forceful 前の待機時間 (default: SIGTERM_GRACE_MS)。
   * test 注入で 0 にできる。
   */
  gracePeriodMs?: number
  /** harness の registerSubprocessKill 経由で取得した kill token を broadcast する port。 */
  killTokenBroadcaster?: (event: 'fired' | 'verified' | 'failed', killReason: string) => void
  /** 残存 pid 検証 port (graceful 後 / forceful 後)。default: 全 false (= 全終了相当)。 */
  verifySurvivors?: (pidTree: readonly number[]) => Promise<readonly number[]>
  /** Round 17 W1: 注入可能な sleep + 経過時間取得 (test 用)。 */
  sleep?: (ms: number) => Promise<void>
  now?: () => number
  /**
   * Round 18 W2: kill switch terminal latch sink。fired 時 / verified 時に最終
   * 状態を sink に書き込み、p-ui-05 rollback 抑止 + p-ui-09 audit へ伝搬する。
   * sink は cross-control invariant: kill = terminal (rollback 起動禁止)。
   */
  killTerminalSink?: KillTerminalSink
}

/**
 * Round 18 W2 cross-control sink。
 *  - p-ui-04 が fire/verified した最終 kill 状態を保持
 *  - p-ui-05 evaluateAndAct が rollback 起動前に isActive() で問い合わせ
 *  - p-ui-09 audit trail が kill 経由 RLS 検証時に snapshot 参照
 */
export interface KillTerminalSink {
  /** 端末状態 (fired || verified) なら true。 */
  isActive(): boolean
  /** kill が fire したことを記録。terminal latch (一度 true にしたら戻さない)。 */
  markFired(reason: string): void
  /** verified 完遂を記録 (terminal を維持)。 */
  markVerified(reason: string): void
  /** 最後の kill 理由 (ない場合は null)。 */
  lastReason(): string | null
}

/** インメモリ実装 (test/runtime 共通)。 */
export function createKillTerminalSink(): KillTerminalSink {
  let active = false
  let reason: string | null = null
  return {
    isActive: () => active,
    markFired: (r) => {
      active = true
      reason = r
    },
    markVerified: (r) => {
      active = true
      reason = r
    },
    lastReason: () => reason,
  }
}

/** Round 17 W1 完成版: graceful → forceful → verified の 3 段階 kill propagation。 */
export async function propagateKill(
  input: KillInput,
  killer: ProcessKiller,
  opts: KillBroadcasterOptions = {},
): Promise<KillOutput> {
  KillInputSchema.parse(input)
  const grace = opts.gracePeriodMs ?? SIGTERM_GRACE_MS
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)))
  const now = opts.now ?? (() => Date.now())
  const verifySurvivors = opts.verifySurvivors ?? (async () => [])
  const t0 = now()

  if (input.pidTree.length === 0) {
    opts.killTokenBroadcaster?.('verified', input.killReason)
    opts.killTerminalSink?.markVerified(input.killReason)
    return {
      totalKilled: 0,
      survivors: [],
      latencyMs: Math.max(0, now() - t0),
      status: 'all_terminated',
      deadlineExceeded: false,
    }
  }

  opts.killTokenBroadcaster?.('fired', input.killReason)
  opts.killTerminalSink?.markFired(input.killReason)

  // graceful: 全 pid に SIGTERM
  const sigtermFailures: number[] = []
  for (const pid of input.pidTree) {
    try {
      const ok = await killer.signal(pid, 'SIGTERM')
      if (!ok) sigtermFailures.push(pid)
    } catch {
      sigtermFailures.push(pid)
    }
  }

  await sleep(grace)

  // 残存検証 1 回目
  let survivors = [...(await verifySurvivors(input.pidTree))]
  // SIGTERM 自体が失敗した pid も併合 (重複排除)
  for (const pid of sigtermFailures) {
    if (!survivors.includes(pid)) survivors.push(pid)
  }

  // forceful: 残存に SIGKILL
  if (survivors.length > 0) {
    const stillSurvivors: number[] = []
    for (const pid of survivors) {
      try {
        const ok = await killer.signal(pid, 'SIGKILL')
        if (!ok) stillSurvivors.push(pid)
      } catch {
        stillSurvivors.push(pid)
      }
    }
    // 残存検証 2 回目 (forceful 後の最終確認)
    const verifiedFinal = await verifySurvivors(input.pidTree)
    survivors = Array.from(new Set([...stillSurvivors, ...verifiedFinal])).filter((pid) =>
      input.pidTree.includes(pid),
    )
  }

  const latencyMs = Math.max(0, now() - t0)
  const deadlineExceeded = latencyMs > KILL_DEADLINE_MS
  const totalKilled = input.pidTree.length - survivors.length
  let status: 'all_terminated' | 'partial' | 'failed'
  if (survivors.length === 0) status = 'all_terminated'
  else if (totalKilled > 0) status = 'partial'
  else status = 'failed'

  if (status === 'all_terminated' && !deadlineExceeded) {
    opts.killTokenBroadcaster?.('verified', input.killReason)
    opts.killTerminalSink?.markVerified(input.killReason)
  } else {
    opts.killTokenBroadcaster?.('failed', input.killReason)
    // partial / failed は markFired 維持 (terminal latch は markFired で立つ)
  }

  return { totalKilled, survivors, latencyMs, status, deadlineExceeded }
}
