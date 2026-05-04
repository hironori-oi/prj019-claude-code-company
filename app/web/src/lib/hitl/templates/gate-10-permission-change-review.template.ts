/**
 * PRJ-019 Clawbridge — HITL-10 permission_change_review notification template
 *
 * Source: dev-w0-week2-t2-hitl-template-design.md §3.2 HITL-10
 * Origin: DEC-019-033 §⑤ (permission change review)
 * Urgency: HIGH / channel: drill / SLA: 24h default reject
 */
import { z } from 'zod';
import {
  buildApprovalPath,
  buildRejectPath,
  escapeMrkdwn,
  hitlGateContextBaseSchema,
  truncate,
  TIMEOUT_24H_MS,
  type HitlGate10Context,
  type HitlNotificationTemplate,
  type HitlSlackBlock,
} from './types';

const gate10ContextSchema = hitlGateContextBaseSchema.extend({
  category: z.string().min(1),
  changeType: z.string().min(1),
  before: z.string().min(1),
  after: z.string().min(1),
  reason: z.string().min(1),
  auditHash: z.string().min(1),
  riskLevel: z.enum(['low', 'medium', 'high']),
  rollbackPlan: z.string().min(1),
}) as unknown as z.ZodType<HitlGate10Context>;

export const gate10Template: HitlNotificationTemplate<HitlGate10Context> = {
  gateNumber: 10,
  gateName: 'permission_change_review',
  urgency: 'high',
  channel: 'drill',
  approvalLinkPath: '/dashboard/hitl/10/approve',
  rejectLinkPath: '/dashboard/hitl/10/reject',
  defaultRejectAfterMs: TIMEOUT_24H_MS,
  contextSchema: gate10ContextSchema,

  buildTitle(ctx) {
    return truncate(
      `[HITL-10] permission_change_review: ${ctx.category} ${ctx.changeType} (risk=${ctx.riskLevel})`,
      150,
    );
  },

  buildBody(ctx) {
    return [
      `*Gate*: HITL-10 permission_change_review (HIGH)`,
      `*Category*: ${escapeMrkdwn(ctx.category)}`,
      `*Change*: ${escapeMrkdwn(ctx.changeType)} (${escapeMrkdwn(truncate(ctx.before, 60))} → ${escapeMrkdwn(truncate(ctx.after, 60))})`,
      `*Reason*: ${escapeMrkdwn(truncate(ctx.reason, 800))}`,
      `*Audit Hash*: \`${escapeMrkdwn(truncate(ctx.auditHash, 80))}\``,
      `*Risk Level*: ${ctx.riskLevel}`,
      `*Rollback Plan*: ${escapeMrkdwn(truncate(ctx.rollbackPlan, 500))}`,
      `*Actor*: ${escapeMrkdwn(ctx.actor)}`,
    ].join('\n');
  },

  buildSlackBlocks(ctx) {
    return [
      {
        type: 'header',
        text: { type: 'plain_text', text: this.buildTitle(ctx), emoji: false },
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: truncate(this.buildBody(ctx), 3000) }],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Approve change', emoji: false },
            value: `approve:${ctx.requestId}`,
            url: buildApprovalPath(10, ctx.requestId),
            style: 'primary',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Rollback', emoji: false },
            value: `reject:${ctx.requestId}`,
            url: buildRejectPath(10, ctx.requestId),
            style: 'danger',
          },
        ],
      },
    ] satisfies HitlSlackBlock[];
  },
};
