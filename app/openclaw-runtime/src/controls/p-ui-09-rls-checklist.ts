/**
 * P-UI-09 — RLS checklist (Round 17 第 2 波 W1 完成版, Dev-W 担当)
 * Supabase RLS policy を ROLE × Operation × Tenant = 105 ケース全数検証。
 * Spec: ../../specs/17day-path-7ctrl.md#p-ui-09
 *
 * 完成範囲 (Round 17 W1):
 *  - matrix 順次実行 (副作用は executor port 経由)
 *  - inconclusive ≥ 5 で全体 abort (RLS_INCONCLUSIVE_ABORT_THRESHOLD)
 *  - failures は actual≠expected の case のみ
 *  - Review 部門署名 hook (reviewSigner port、署名失敗は output に反映)
 *  - 副作用 0: executor / signer 全て DI port
 */
import { z } from 'zod'

export const RLS_INCONCLUSIVE_ABORT_THRESHOLD = 5

export const RlsOperationSchema = z.enum(['select', 'insert', 'update', 'delete'])
export type RlsOperation = z.infer<typeof RlsOperationSchema>

export const RlsExpectationSchema = z.enum(['allow', 'deny'])
export type RlsExpectation = z.infer<typeof RlsExpectationSchema>

export const RlsCaseSchema = z.object({
  role: z.string().min(1),
  operation: RlsOperationSchema,
  tenant: z.string().min(1),
  expected: RlsExpectationSchema,
})
export type RlsCase = z.infer<typeof RlsCaseSchema>

export const RlsInputSchema = z.object({
  matrix: z.array(RlsCaseSchema).min(1),
})
export type RlsInput = z.infer<typeof RlsInputSchema>

export const RlsFailureSchema = z.object({
  role: z.string(),
  operation: z.string(),
  tenant: z.string(),
  actual: z.string(),
  expected: z.string(),
})
export type RlsFailure = z.infer<typeof RlsFailureSchema>

export const RlsOutputSchema = z.object({
  totalCases: z.number().int().nonnegative(),
  passed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  failures: z.array(RlsFailureSchema),
  inconclusiveCount: z.number().int().nonnegative().optional(),
  aborted: z.boolean().optional(),
  reviewSigned: z.boolean().optional(),
})
export type RlsOutput = z.infer<typeof RlsOutputSchema>

export interface RlsExecutor {
  execute(c: RlsCase): Promise<{ outcome: 'allow' | 'deny' | 'inconclusive' }>
}

export interface ReviewSigner {
  /** Review 部門署名 hook: 全 case 完遂 + failures==0 でのみ呼出 */
  sign(summary: { totalCases: number; passed: number }): Promise<{ signed: boolean }>
}

const NO_OP_SIGNER: ReviewSigner = { sign: async () => ({ signed: false }) }

export async function runRlsChecklist(
  input: RlsInput,
  exec: RlsExecutor,
  signer: ReviewSigner = NO_OP_SIGNER,
): Promise<RlsOutput> {
  RlsInputSchema.parse(input)
  const failures: RlsFailure[] = []
  let passed = 0
  let inconclusive = 0
  let executed = 0

  for (const c of input.matrix) {
    executed += 1
    const r = await exec.execute(c)
    if (r.outcome === 'inconclusive') {
      inconclusive += 1
      if (inconclusive >= RLS_INCONCLUSIVE_ABORT_THRESHOLD) {
        return {
          totalCases: input.matrix.length,
          passed,
          failed: failures.length,
          failures,
          inconclusiveCount: inconclusive,
          aborted: true,
          reviewSigned: false,
        }
      }
      continue
    }
    if (r.outcome === c.expected) {
      passed += 1
    } else {
      failures.push({
        role: c.role,
        operation: c.operation,
        tenant: c.tenant,
        actual: r.outcome,
        expected: c.expected,
      })
    }
  }

  const fullyExecuted = executed === input.matrix.length
  const allGreen = fullyExecuted && failures.length === 0 && inconclusive === 0
  let reviewSigned = false
  if (allGreen) {
    const sig = await signer.sign({ totalCases: input.matrix.length, passed })
    reviewSigned = sig.signed
  }

  return {
    totalCases: input.matrix.length,
    passed,
    failed: failures.length,
    failures,
    inconclusiveCount: inconclusive,
    aborted: false,
    reviewSigned,
  }
}
