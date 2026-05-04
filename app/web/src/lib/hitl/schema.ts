/**
 * PRJ-019 Clawbridge - HITL payload Zod schemas (11 種)
 *
 * Source of truth: src/types/hitl.ts (静的型) + pm-v4-hitl-gates-9-10-11-wbs.md §2 (DoD)
 * 各 Gate の payload を runtime 検証する。API route の POST /api/hitl で使う。
 */
import { z } from "zod";

// ---- Per-gate payload schemas ----

export const networkExternalSchema = z.object({
  url: z.string().url(),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  reason: z.string().min(1).max(2000),
});

export const costThresholdSchema = z.object({
  scope: z.enum(["monthly", "proposal", "task"]),
  scopeRef: z.string().optional(),
  currentUsd: z.number().nonnegative(),
  thresholdUsd: z.number().positive(),
  projectedUsd: z.number().nonnegative(),
});

export const secretAccessSchema = z.object({
  secretName: z.string().min(1),
  vaultPath: z.string().min(1),
  callerProcess: z.string().min(1),
});

export const prodDeploySchema = z.object({
  targetEnv: z.enum(["prod", "staging-promote"]),
  buildId: z.string().min(1),
  diffSummary: z.string().min(1),
});

export const unsafeCommandSchema = z.object({
  command: z.string().min(1),
  args: z.array(z.string()),
  cwd: z.string().min(1),
});

export const tosGrayReviewSchema = z.object({
  candidate: z.string().min(1),
  evidence: z
    .array(
      z.object({
        url: z.string().url(),
        excerpt: z.string().min(1),
        verdict: z.enum(["white", "gray", "black"]),
      }),
    )
    .min(1),
  recommendation: z.enum(["adopt", "reject", "defer"]),
});

export const externalApiSchema = z.object({
  apiName: z.string().min(1),
  endpoint: z.string().min(1),
  estimatedCallsPerHour: z.number().int().nonnegative(),
});

export const emergencyStopSchema = z.object({
  reason: z.string().min(1),
  source: z.enum(["anomaly_detection", "owner_manual", "operator_manual"]),
});

export const devKickoffApprovalSchema = z.object({
  proposalId: z.string().min(1),
  summary: z.string().min(1),
  targetEffect: z.string().min(1),
  estimatedCostUsd: z.number().nonnegative(),
  tosGrayJudgment: z.object({
    verdict: z.enum(["white", "gray", "black"]),
    evidence: z.array(z.object({ url: z.string().url(), excerpt: z.string().min(1) })),
  }),
  devPeriodDays: z.number().int().positive(),
  knowledgeRefs: z.array(z.string()),
  recommendedAction: z.enum(["adopt", "reject", "defer"]),
});

export const permissionChangeReviewSchema = z.object({
  changeId: z.string().min(1),
  triggerKind: z.enum(["backup_restore", "external_import", "auto_warning_rollback"]),
  category: z.enum(["fs", "command", "network", "hitl", "cost", "time", "genre"]),
  diffJson: z.record(z.unknown()),
  prePolicyVersionId: z.string().min(1),
  postPolicyVersionId: z.string().min(1),
  approverSignature: z.string().optional(),
});

export const knowledgePiiReviewSchema = z.object({
  extractionId: z.string().min(1),
  sourcePath: z.string().min(1),
  extractedContent: z.string().min(1),
  piiRedactedContent: z.string().min(1),
  piiCategories: z
    .array(
      z.enum([
        "email",
        "phone",
        "credit_card",
        "ssn",
        "api_key",
        "customer_name",
        "internal_url",
      ]),
    )
    .min(1),
  targetSubdir: z.enum(["patterns", "decisions", "pitfalls"]),
});

// ---- Discriminated union (gate_kind + payload) ----

export const hitlCreateRequestSchema = z.discriminatedUnion("gateKind", [
  z.object({ gateKind: z.literal("network_external"), payload: networkExternalSchema }),
  z.object({ gateKind: z.literal("cost_threshold"), payload: costThresholdSchema }),
  z.object({ gateKind: z.literal("secret_access"), payload: secretAccessSchema }),
  z.object({ gateKind: z.literal("prod_deploy"), payload: prodDeploySchema }),
  z.object({ gateKind: z.literal("unsafe_command"), payload: unsafeCommandSchema }),
  z.object({ gateKind: z.literal("tos_gray_review"), payload: tosGrayReviewSchema }),
  z.object({ gateKind: z.literal("external_api"), payload: externalApiSchema }),
  z.object({ gateKind: z.literal("emergency_stop"), payload: emergencyStopSchema }),
  z.object({ gateKind: z.literal("dev_kickoff_approval"), payload: devKickoffApprovalSchema }),
  z.object({
    gateKind: z.literal("permission_change_review"),
    payload: permissionChangeReviewSchema,
  }),
  z.object({ gateKind: z.literal("knowledge_pii_review"), payload: knowledgePiiReviewSchema }),
]);

export type HitlCreateRequestInput = z.infer<typeof hitlCreateRequestSchema>;

export const hitlDecisionSchema = z.object({
  decisionReason: z.string().min(1).max(2000).optional(),
});

export type HitlDecisionInput = z.infer<typeof hitlDecisionSchema>;
