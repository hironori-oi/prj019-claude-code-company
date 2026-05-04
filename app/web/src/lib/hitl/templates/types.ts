/**
 * PRJ-019 Clawbridge — HITL 11-gate notification template common types
 *
 * Source of truth:
 *   - dev-w0-week2-t2-hitl-template-design.md §3.1 (interface)
 *   - ceo-owner-consolidated-v8.md §2.3 §3.1 (gate naming canonical)
 *   - DEC-019-051 §施策-2 (template 化、API 90% 削減)
 *
 * 設計原則:
 *   - 全 template は LLM 不要、決定論的 (build* 関数は pure function)
 *   - placeholder = `{{actor}} {{action}} {{timestamp}} {{context}} {{evidence_url}}` 等
 *   - context は zod で runtime 検証 (contextSchema)
 *   - 24h default reject timeout (cost_threshold は 1h、emergency_stop は 0.5h)
 *   - Slack Block Kit 形式の blocks を内部で生成し lib/notify/slack.ts に橋渡し
 */
import { z } from 'zod';

// =============================================================================
// Gate naming (task spec canonical = ceo-owner-consolidated-v8.md §2.3)
// =============================================================================

/**
 * 11 種 HITL Gate name (v8 canonical).
 * 既存 src/types/hitl.ts の HitlGateKind とは命名差分がある (legacy: network_external 等)。
 * dispatcher 統合層で gateNameToKind / gateKindToName マッピングを提供する。
 */
export type HitlGateName =
  | 'tos_review'                  // 1
  | 'permission_review'           // 2
  | 'cost_breach'                 // 3
  | 'ng3_breach'                  // 4
  | 'tos_strict'                  // 5
  | 'tos_gray_review'             // 6
  | 'changelog_external_api'      // 7
  | 'evidence_review'             // 8
  | 'dev_kickoff_approval'        // 9
  | 'permission_change_review'    // 10
  | 'knowledge_pii_review';       // 11

export type HitlUrgency = 'low' | 'medium' | 'high' | 'critical';

/** Slack channel routing (DEC-019-049 / lib/notify/slack.ts SlackChannel と同一) */
export type HitlSlackChannel = 'hitl' | 'monitor' | 'drill';

// =============================================================================
// Gate context (placeholder values, dynamic part)
// =============================================================================

/**
 * 全 Gate 共通の base context (placeholder 動的値).
 * Gate 固有 context は extends で拡張する。
 */
export interface HitlGateContextBase {
  /** {{request_id}} — dispatcher が UUID 生成 */
  requestId: string;
  /** {{actor}} — 'open_claw' | 'system' | 'owner' | 'dev' */
  actor: string;
  /** {{action}} — gate 固有 action_type (例: 'public_release' / 'cost_overrun') */
  action: string;
  /** {{timestamp}} — ISO 8601 UTC */
  timestamp: string;
  /** {{evidence_url}} — optional dashboard link */
  evidenceUrl?: string;
  /** {{sla_deadline}} — optional ISO 8601 (default 24h after timestamp) */
  slaDeadline?: string;
  /** Tenant 識別子 (multi-tenant 用) */
  tenantId?: string;
}

/** HITL-1 tos_review */
export interface HitlGate1Context extends HitlGateContextBase {
  candidateId: string;
  category: string;
  rationale: string;
}

/** HITL-2 permission_review */
export interface HitlGate2Context extends HitlGateContextBase {
  permissionChange: string;
  reason: string;
  riskLevel?: 'low' | 'medium' | 'high';
}

/** HITL-3 cost_breach */
export interface HitlGate3Context extends HitlGateContextBase {
  tier: 'warn' | 'cap' | 'hard';
  spentUsd: number;
  capUsd: number;
  recommendedAction: string;
  nextResetAt: string;
}

/** HITL-4 ng3_breach */
export interface HitlGate4Context extends HitlGateContextBase {
  runtimeHours: number;
  autoPauseStatus: 'pending' | 'applied' | 'failed';
}

/** HITL-5 tos_strict (即拒否、approval link なし) */
export interface HitlGate5Context extends HitlGateContextBase {
  blocklistCategory: string;
  candidateId: string;
}

/** HITL-6 tos_gray_review */
export interface HitlGate6Context extends HitlGateContextBase {
  candidateId: string;
  category: string;
  subcategory: string;
  confidence: number;
  needSummary: string;
  rationale: string;
  blocklistHits: string[];
}

/** HITL-7 changelog_external_api */
export interface HitlGate7Context extends HitlGateContextBase {
  upstream: string;
  semver: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedApis: string[];
  recommendedAdapter: string;
  fallbackPlan: string;
}

/** HITL-8 evidence_review */
export interface HitlGate8Context extends HitlGateContextBase {
  inputKind: string;
  inputSummary: string;
  validationStatus: 'pending' | 'partial' | 'verified' | 'rejected';
  actionRequired: string;
  urgencyOverride?: HitlUrgency;
}

/** HITL-9 dev_kickoff_approval */
export interface HitlGate9Context extends HitlGateContextBase {
  proposalId: string;
  proposalTitle: string;
  needSummary: string;
  effortEstimate: number;
  knowledgeRefs: string[];
  riskSummary?: string;
}

/** HITL-10 permission_change_review */
export interface HitlGate10Context extends HitlGateContextBase {
  category: string;
  changeType: string;
  before: string;
  after: string;
  reason: string;
  auditHash: string;
  riskLevel: 'low' | 'medium' | 'high';
  rollbackPlan: string;
}

/** HITL-11 knowledge_pii_review */
export interface HitlGate11Context extends HitlGateContextBase {
  batchId: string;
  source: string;
  prjId: string;
  piiCount: number;
  piiCategories: string[];
  redactionStrategy: string;
}

/** Discriminated union — dispatcher で gate 別 narrowing に使う */
export type HitlGateContext =
  | HitlGate1Context
  | HitlGate2Context
  | HitlGate3Context
  | HitlGate4Context
  | HitlGate5Context
  | HitlGate6Context
  | HitlGate7Context
  | HitlGate8Context
  | HitlGate9Context
  | HitlGate10Context
  | HitlGate11Context;

// =============================================================================
// Slack Block Kit minimal block (template 出力)
// =============================================================================

export interface HitlSlackBlock {
  type: 'header' | 'context' | 'section' | 'actions' | 'divider';
  text?: { type: 'plain_text' | 'mrkdwn'; text: string; emoji?: boolean };
  elements?: Array<Record<string, unknown>>;
  fields?: Array<Record<string, unknown>>;
}

// =============================================================================
// HitlNotificationTemplate — 11 templates が実装すべき interface
// =============================================================================

export interface HitlNotificationTemplate<C extends HitlGateContextBase = HitlGateContextBase> {
  /** 1-11 */
  gateNumber: number;
  /** v8 canonical gate name */
  gateName: HitlGateName;
  /** 通知 urgency (Slack channel routing と integrate) */
  urgency: HitlUrgency;
  /** Slack channel routing (urgency に基づく default + override 可) */
  channel: HitlSlackChannel;
  /** タイトル (Slack header / email subject 共用、≤150 chars) */
  buildTitle: (ctx: C) => string;
  /** 本文 (Slack mrkdwn / fallback text 共用、≤3000 chars) */
  buildBody: (ctx: C) => string;
  /** Slack Block Kit blocks (header + context + actions の 3 block 構成) */
  buildSlackBlocks: (ctx: C) => HitlSlackBlock[];
  /** Owner approval link path (relative to dashboard root) */
  approvalLinkPath: string;
  /** Owner reject link path */
  rejectLinkPath: string;
  /** Default reject timeout (ms). Strict (HITL-5) は 0 (即拒否、Owner action 不要) */
  defaultRejectAfterMs: number;
  /** Context runtime validation (zod schema) */
  contextSchema: z.ZodType<C>;
}

/**
 * Registry 用の type-erased version (gate 種別を跨いで保持するため).
 * 各 template の context は dispatcher で動的 cast する想定 (zod 検証で safety 確保).
 */
export type AnyHitlNotificationTemplate = Omit<
  HitlNotificationTemplate,
  'buildTitle' | 'buildBody' | 'buildSlackBlocks' | 'contextSchema'
> & {
  buildTitle: (ctx: HitlGateContext) => string;
  buildBody: (ctx: HitlGateContext) => string;
  buildSlackBlocks: (ctx: HitlGateContext) => HitlSlackBlock[];
  contextSchema: z.ZodType<HitlGateContext>;
};

// =============================================================================
// Default reject timeout constants
// =============================================================================

export const TIMEOUT_30MIN_MS = 30 * 60 * 1000;
export const TIMEOUT_1H_MS = 60 * 60 * 1000;
export const TIMEOUT_24H_MS = 24 * 60 * 60 * 1000;
export const TIMEOUT_48H_MS = 48 * 60 * 60 * 1000;
export const TIMEOUT_72H_MS = 72 * 60 * 60 * 1000;

// =============================================================================
// Approval / reject link path builder (24h timeout 整合)
// =============================================================================

export function buildApprovalPath(gateNumber: number, requestId: string): string {
  return `/dashboard/hitl/${gateNumber}/approve?id=${encodeURIComponent(requestId)}`;
}

export function buildRejectPath(gateNumber: number, requestId: string): string {
  return `/dashboard/hitl/${gateNumber}/reject?id=${encodeURIComponent(requestId)}`;
}

// =============================================================================
// Common context base zod schema (gate 固有 schema が extend して使う)
// =============================================================================

export const hitlGateContextBaseSchema = z.object({
  requestId: z.string().min(1),
  actor: z.string().min(1),
  action: z.string().min(1),
  timestamp: z.string().min(1),
  evidenceUrl: z.string().url().optional(),
  slaDeadline: z.string().optional(),
  tenantId: z.string().optional(),
});

// =============================================================================
// Slack mrkdwn escape helper (XSS / 表示崩れ防止)
// =============================================================================

/** Slack mrkdwn 用 escape: `<` `>` `&` を entity 化 */
export function escapeMrkdwn(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** 文字列を上限 max で truncate (省略時 …) */
export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}

/** evidence_url etc. の n/a fallback */
export function nvl<T>(value: T | undefined | null, fallback: string = 'n/a'): string {
  if (value === undefined || value === null) return fallback;
  return String(value);
}
