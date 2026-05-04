/**
 * PRJ-019 Clawbridge — HITL 11-template registry & aggregated exports
 *
 * Source: dev-w0-week2-t2-hitl-template-design.md §4 (file structure)
 *
 * 提供:
 *   - 各 gate template の named export
 *   - hitlTemplateByNumber: Record<1..11, template>
 *   - hitlTemplateByName: Record<HitlGateName, template>
 *   - mapGateKindToTemplate: 既存 HitlGateKind (legacy 命名) → template マッピング
 *   - mapGateKindToName / mapNameToGateKind: 双方向 lookup
 */
import type { HitlGateKind } from '@/types/hitl';
import { gate1Template } from './gate-1-tos-review.template';
import { gate2Template } from './gate-2-permission-review.template';
import { gate3Template } from './gate-3-cost-breach.template';
import { gate4Template } from './gate-4-ng3-breach.template';
import { gate5Template } from './gate-5-tos-strict.template';
import { gate6Template } from './gate-6-tos-gray-review.template';
import { gate7Template } from './gate-7-changelog-external-api.template';
import { gate8Template } from './gate-8-evidence-review.template';
import { gate9Template } from './gate-9-dev-kickoff-approval.template';
import { gate10Template } from './gate-10-permission-change-review.template';
import { gate11Template } from './gate-11-knowledge-pii-review.template';
import type { AnyHitlNotificationTemplate, HitlGateName } from './types';

export {
  gate1Template,
  gate2Template,
  gate3Template,
  gate4Template,
  gate5Template,
  gate6Template,
  gate7Template,
  gate8Template,
  gate9Template,
  gate10Template,
  gate11Template,
};

export * from './types';
export { redactString, redactPayload, countPiiHits } from './pii-redactor';

// =============================================================================
// Registry
// =============================================================================

/** Number 1..11 → template (HITL-N の N で lookup, type-erased registry) */
export const hitlTemplateByNumber: Record<number, AnyHitlNotificationTemplate> = {
  1: gate1Template as unknown as AnyHitlNotificationTemplate,
  2: gate2Template as unknown as AnyHitlNotificationTemplate,
  3: gate3Template as unknown as AnyHitlNotificationTemplate,
  4: gate4Template as unknown as AnyHitlNotificationTemplate,
  5: gate5Template as unknown as AnyHitlNotificationTemplate,
  6: gate6Template as unknown as AnyHitlNotificationTemplate,
  7: gate7Template as unknown as AnyHitlNotificationTemplate,
  8: gate8Template as unknown as AnyHitlNotificationTemplate,
  9: gate9Template as unknown as AnyHitlNotificationTemplate,
  10: gate10Template as unknown as AnyHitlNotificationTemplate,
  11: gate11Template as unknown as AnyHitlNotificationTemplate,
};

/** v8 canonical gate name → template (例: 'tos_review' → gate1Template) */
export const hitlTemplateByName: Record<HitlGateName, AnyHitlNotificationTemplate> = {
  tos_review: gate1Template as unknown as AnyHitlNotificationTemplate,
  permission_review: gate2Template as unknown as AnyHitlNotificationTemplate,
  cost_breach: gate3Template as unknown as AnyHitlNotificationTemplate,
  ng3_breach: gate4Template as unknown as AnyHitlNotificationTemplate,
  tos_strict: gate5Template as unknown as AnyHitlNotificationTemplate,
  tos_gray_review: gate6Template as unknown as AnyHitlNotificationTemplate,
  changelog_external_api: gate7Template as unknown as AnyHitlNotificationTemplate,
  evidence_review: gate8Template as unknown as AnyHitlNotificationTemplate,
  dev_kickoff_approval: gate9Template as unknown as AnyHitlNotificationTemplate,
  permission_change_review: gate10Template as unknown as AnyHitlNotificationTemplate,
  knowledge_pii_review: gate11Template as unknown as AnyHitlNotificationTemplate,
};

// =============================================================================
// Legacy HitlGateKind ↔ HitlGateName mapping
// =============================================================================

/**
 * 既存 src/types/hitl.ts の HitlGateKind (legacy 命名) を v8 canonical
 * HitlGateName にマッピング。dispatcher 統合層で使用。
 *
 * 1:1 が成立しない一部 (network_external / secret_access / prod_deploy /
 * unsafe_command / external_api / emergency_stop) は近接 gate にマッピング:
 *   - network_external      → tos_review (T2 範囲外 — 既存 1-8 SOP 維持、template 1 を再利用)
 *   - secret_access         → permission_review (権限系として近接)
 *   - prod_deploy           → permission_review
 *   - unsafe_command        → permission_review
 *   - external_api          → changelog_external_api
 *   - emergency_stop        → ng3_breach (CRITICAL drill 系として近接)
 *
 * これは「11 種 template の整理 = task 仕様 = v8 canonical」優先 / 既存 11 種
 * payload を活かす方針。Review 部門 5/22 検収で正式 reconciliation を行う。
 */
export const HITL_GATE_KIND_TO_NAME: Record<HitlGateKind, HitlGateName> = {
  network_external: 'tos_review',
  cost_threshold: 'cost_breach',
  secret_access: 'permission_review',
  prod_deploy: 'permission_review',
  unsafe_command: 'permission_review',
  tos_gray_review: 'tos_gray_review',
  external_api: 'changelog_external_api',
  emergency_stop: 'ng3_breach',
  dev_kickoff_approval: 'dev_kickoff_approval',
  permission_change_review: 'permission_change_review',
  knowledge_pii_review: 'knowledge_pii_review',
};

/** legacy gateKind → template */
export function mapGateKindToTemplate(gateKind: HitlGateKind): AnyHitlNotificationTemplate {
  const name = HITL_GATE_KIND_TO_NAME[gateKind];
  return hitlTemplateByName[name];
}

/** v8 canonical name → legacy gateKind (1:1 ではないため reverse lookup は first-match) */
const REVERSE_MAP: Partial<Record<HitlGateName, HitlGateKind>> = {
  tos_review: 'network_external',
  permission_review: 'secret_access',
  cost_breach: 'cost_threshold',
  ng3_breach: 'emergency_stop',
  tos_strict: 'network_external',
  tos_gray_review: 'tos_gray_review',
  changelog_external_api: 'external_api',
  evidence_review: 'emergency_stop',
  dev_kickoff_approval: 'dev_kickoff_approval',
  permission_change_review: 'permission_change_review',
  knowledge_pii_review: 'knowledge_pii_review',
};

export function mapNameToGateKind(name: HitlGateName): HitlGateKind | undefined {
  return REVERSE_MAP[name];
}
