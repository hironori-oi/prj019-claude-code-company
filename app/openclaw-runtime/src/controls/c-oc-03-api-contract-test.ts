/**
 * C-OC-03 — API contract test (Round 16 第 2 波 skeleton, W1 完遂予定)
 * 月次で OpenClaw upstream OSS の CLI / config schema 差分検出。
 * Spec: ../../specs/17day-path-7ctrl.md#c-oc-03
 */
import { z } from 'zod'

export const SeveritySchema = z.enum(['major', 'minor', 'patch'])
export type Severity = z.infer<typeof SeveritySchema>

export const ContractDiffSchema = z.object({
  field: z.string().min(1),
  before: z.string(),
  after: z.string(),
  severity: SeveritySchema,
})
export type ContractDiff = z.infer<typeof ContractDiffSchema>

export const ContractInputSchema = z.object({
  runId: z.string().min(1),
  upstreamRef: z.string().min(1),
  localFixturePath: z.string().min(1),
})
export type ContractInput = z.infer<typeof ContractInputSchema>

export const ContractOutputSchema = z.object({
  matched: z.boolean(),
  diffs: z.array(ContractDiffSchema),
  reportPath: z.string().min(1),
})
export type ContractOutput = z.infer<typeof ContractOutputSchema>

export interface UpstreamFetcher {
  fetch(ref: string): Promise<{ ok: boolean; body?: string }>
}

/** skeleton: 完成版は W1 で実装。soft-fail パスのみ stub 返却。 */
export async function runContractTest(
  input: ContractInput,
  _fetcher: UpstreamFetcher,
): Promise<ContractOutput> {
  ContractInputSchema.parse(input)
  // TODO(W1): fixture 読込 + diff engine + severity 推定 + report 出力
  return {
    matched: true,
    diffs: [],
    reportPath: `${input.localFixturePath}.report.json`,
  }
}
