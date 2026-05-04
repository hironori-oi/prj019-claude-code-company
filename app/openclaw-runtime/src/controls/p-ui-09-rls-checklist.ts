/**
 * P-UI-09 — RLS checklist (Round 16 第 2 波 skeleton, W3 完遂予定)
 * Supabase RLS policy を ROLE × Operation × Tenant = 105 ケース全数検証。
 * Spec: ../../specs/17day-path-7ctrl.md#p-ui-09
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

export const RlsOutputSchema = z.object({
  totalCases: z.number().int().nonnegative(),
  passed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  failures: z.array(RlsFailureSchema),
})
export type RlsOutput = z.infer<typeof RlsOutputSchema>

export interface RlsExecutor {
  execute(c: RlsCase): Promise<{ outcome: 'allow' | 'deny' | 'inconclusive' }>
}

/** skeleton: 完成版は W3 で実装。matrix 走査 stub のみ (副作用 0)。 */
export async function runRlsChecklist(input: RlsInput, _exec: RlsExecutor): Promise<RlsOutput> {
  RlsInputSchema.parse(input)
  // TODO(W3): 105 ケース実行 + inconclusive abort + Review 部門署名 hook
  return {
    totalCases: input.matrix.length,
    passed: 0,
    failed: 0,
    failures: [],
  }
}
