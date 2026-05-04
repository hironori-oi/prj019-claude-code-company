/**
 * PRJ-019 Clawbridge - HITL Gate 11 種 TypeScript Interface
 *
 * Source of truth: pm-v4-hitl-gates-9-10-11-wbs.md §1.2
 *                  DEC-019-033 §② / §③ / §④ / §⑤
 *                  DEC-020-003 (HITL 8 owner_input_review)
 *
 * 設計原則:
 *   - すべての payload は zod でランタイム検証 (本ファイルは型のみ)
 *   - default action はすべて 'reject' か 'pause' (fail-closed)
 *   - SLA 超過時の自動遷移は HITL ワーカー側が責任を持つ
 *   - audit_log への hash chain INSERT は status 遷移ごとに実施
 */

export type HitlGateKind =
  | "network_external"          // 1
  | "cost_threshold"            // 2
  | "secret_access"             // 3
  | "prod_deploy"               // 4
  | "unsafe_command"            // 5
  | "tos_gray_review"           // 6  (DEC-019-018)
  | "external_api"              // 7
  | "emergency_stop"            // 8  (DEC-020-003 owner_input_review にも対応する派生)
  | "dev_kickoff_approval"      // 9  (DEC-019-033 §②)
  | "permission_change_review"  // 10 (DEC-019-033 §⑤)
  | "knowledge_pii_review";     // 11 (DEC-019-033 §④ + ODR-OG-06)

export type HitlStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "timeout"
  | "cancelled";

export type HitlDefaultAction = "reject" | "pause" | "approve";

export interface HitlRequestBase {
  id: string;
  tenantId: string;
  gateKind: HitlGateKind;
  proposalId?: string;
  status: HitlStatus;
  defaultAction: HitlDefaultAction;
  slaDeadline: string; // ISO 8601
  requestedBy?: string;
  approvedBy?: string;
  decisionAt?: string;
  decisionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Payloads (per gate) ---

export interface HitlPayloadNetworkExternal {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  reason: string;
}

export interface HitlPayloadCostThreshold {
  scope: "monthly" | "proposal" | "task";
  scopeRef?: string;
  currentUsd: number;
  thresholdUsd: number;
  projectedUsd: number;
}

export interface HitlPayloadSecretAccess {
  secretName: string;
  vaultPath: string;
  callerProcess: string;
}

export interface HitlPayloadProdDeploy {
  targetEnv: "prod" | "staging-promote";
  buildId: string;
  diffSummary: string;
}

export interface HitlPayloadUnsafeCommand {
  command: string;
  args: string[];
  cwd: string;
}

export interface HitlPayloadTosGrayReview {
  candidate: string;
  evidence: { url: string; excerpt: string; verdict: "white" | "gray" | "black" }[];
  recommendation: "adopt" | "reject" | "defer";
}

export interface HitlPayloadExternalApi {
  apiName: string;
  endpoint: string;
  estimatedCallsPerHour: number;
}

export interface HitlPayloadEmergencyStop {
  reason: string;
  source: "anomaly_detection" | "owner_manual" | "operator_manual";
}

/**
 * HITL 9: dev_kickoff_approval
 * 提案書テンプレ {(a) 概要 (b) ターゲット効果 (c) 想定コスト (d) ToS gray 判定
 *                  (e) 開発期間 (f) 既存ナレッジ参照 (g) 推奨採否}
 */
export interface HitlPayloadDevKickoffApproval {
  proposalId: string;
  summary: string;
  targetEffect: string;
  estimatedCostUsd: number;
  tosGrayJudgment: {
    verdict: "white" | "gray" | "black";
    evidence: { url: string; excerpt: string }[];
  };
  devPeriodDays: number;
  knowledgeRefs: string[];
  recommendedAction: "adopt" | "reject" | "defer";
}

/**
 * HITL 10: permission_change_review
 * 3 trigger ケース: backup_restore / external_import / auto_warning_rollback
 */
export interface HitlPayloadPermissionChangeReview {
  changeId: string;
  triggerKind: "backup_restore" | "external_import" | "auto_warning_rollback";
  category: "fs" | "command" | "network" | "hitl" | "cost" | "time" | "genre";
  diffJson: Record<string, unknown>;
  prePolicyVersionId: string;
  postPolicyVersionId: string;
  approverSignature?: string;
}

/**
 * HITL 11: knowledge_pii_review
 * 自動 redaction 後の二重チェック
 */
export interface HitlPayloadKnowledgePiiReview {
  extractionId: string;
  sourcePath: string;
  extractedContent: string;
  piiRedactedContent: string;
  piiCategories: Array<
    "email" | "phone" | "credit_card" | "ssn" | "api_key" | "customer_name" | "internal_url"
  >;
  targetSubdir: "patterns" | "decisions" | "pitfalls";
}

// --- Discriminated union ---

export type HitlRequest =
  | (HitlRequestBase & { gateKind: "network_external"; payload: HitlPayloadNetworkExternal })
  | (HitlRequestBase & { gateKind: "cost_threshold"; payload: HitlPayloadCostThreshold })
  | (HitlRequestBase & { gateKind: "secret_access"; payload: HitlPayloadSecretAccess })
  | (HitlRequestBase & { gateKind: "prod_deploy"; payload: HitlPayloadProdDeploy })
  | (HitlRequestBase & { gateKind: "unsafe_command"; payload: HitlPayloadUnsafeCommand })
  | (HitlRequestBase & { gateKind: "tos_gray_review"; payload: HitlPayloadTosGrayReview })
  | (HitlRequestBase & { gateKind: "external_api"; payload: HitlPayloadExternalApi })
  | (HitlRequestBase & { gateKind: "emergency_stop"; payload: HitlPayloadEmergencyStop })
  | (HitlRequestBase & { gateKind: "dev_kickoff_approval"; payload: HitlPayloadDevKickoffApproval })
  | (HitlRequestBase & { gateKind: "permission_change_review"; payload: HitlPayloadPermissionChangeReview })
  | (HitlRequestBase & { gateKind: "knowledge_pii_review"; payload: HitlPayloadKnowledgePiiReview });

// --- SLA / default action lookup table (single source of truth) ---

export const HITL_GATE_DEFAULTS: Record<
  HitlGateKind,
  { slaHours: number; defaultAction: HitlDefaultAction }
> = {
  network_external:         { slaHours: 24,  defaultAction: "reject" },
  cost_threshold:           { slaHours: 1,   defaultAction: "pause"  },
  secret_access:            { slaHours: 24,  defaultAction: "reject" },
  prod_deploy:              { slaHours: 24,  defaultAction: "reject" },
  unsafe_command:           { slaHours: 24,  defaultAction: "reject" },
  tos_gray_review:          { slaHours: 24,  defaultAction: "reject" },
  external_api:             { slaHours: 24,  defaultAction: "reject" },
  emergency_stop:           { slaHours: 0.5, defaultAction: "pause"  },
  dev_kickoff_approval:     { slaHours: 72,  defaultAction: "reject" },
  permission_change_review: { slaHours: 24,  defaultAction: "reject" },
  knowledge_pii_review:     { slaHours: 48,  defaultAction: "reject" },
};

export function isTerminalStatus(s: HitlStatus): boolean {
  return s !== "pending";
}
