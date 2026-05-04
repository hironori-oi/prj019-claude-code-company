/**
 * P-UI-04 — kill switch propagation (Round 16 第 2 波 skeleton, W1 fallback 完遂予定)
 * kill switch 発火 → 30s 内に全子プロセス SIGTERM → SIGKILL 連鎖到達。
 * Spec: ../../specs/17day-path-7ctrl.md#p-ui-04
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
})
export type KillOutput = z.infer<typeof KillOutputSchema>

export interface ProcessKiller {
  signal(pid: number, sig: 'SIGTERM' | 'SIGKILL'): Promise<boolean>
}

/** skeleton: 完成版は W1 fallback で実装。現状 dryRun 相当の no-op。 */
export async function propagateKill(input: KillInput, _killer: ProcessKiller): Promise<KillOutput> {
  KillInputSchema.parse(input)
  // TODO(W1): graceful → forceful → verify pid tree
  return {
    totalKilled: 0,
    survivors: [...input.pidTree],
    latencyMs: 0,
    status: 'failed',
  }
}
