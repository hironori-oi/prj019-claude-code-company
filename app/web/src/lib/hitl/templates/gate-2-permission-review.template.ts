/**
 * PRJ-019 Clawbridge — HITL-2 permission_review notification template
 *
 * Source: dev-w0-week2-t2-hitl-template-design.md §3.2 HITL-2
 * Origin: DEC-019-002 (権限変更レビュー)
 * Urgency: MEDIUM / channel: hitl / SLA: 24h default reject
 */
import { z } from 'zod';
import {
  buildApprovalPath,
  buildRejectPath,
  escapeMrkdwn,
  hitlGateContextBaseSchema,
  nvl,
  truncate,
  TIMEOUT_24H_MS,
  type HitlGate2Context,
  type HitlNotificationTemplate,
  type HitlSlackBlock,
} from './types';

const gate2ContextSchema = hitlGateContextBaseSchema.extend({
  permissionChange: z.string().min(1),
  reason: z.string().min(1),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
}) as unknown as z.ZodType<HitlGate2Context>;

export const gate2Template: HitlNotificationTemplate<HitlGate2Context> = {
  gateNumber: 2,
  gateName: 'permission_review',
  urgency: 'medium',
  channel: 'hitl',
  approvalLinkPath: '/dashboard/hitl/2/approve',
  rejectLinkPath: '/dashboard/hitl/2/reject',
  defaultRejectAfterMs: TIMEOUT_24H_MS,
  contextSchema: gate2ContextSchema,

  buildTitle(ctx) {
    const change = truncate(ctx.permissionChange, 50);
    return truncate(`[HITL-2] permission_review: ${ctx.actor} → ${change}`, 150);
  },

  buildBody(ctx) {
    return [
      `*Gate*: HITL-2 permission_review (MEDIUM)`,
      `*Permission*: ${escapeMrkdwn(ctx.permissionChange)}`,
      `*Reason*: ${escapeMrkdwn(truncate(ctx.reason, 1000))}`,
      `*Actor*: ${escapeMrkdwn(ctx.actor)}`,
      `*Risk Level*: ${ctx.riskLevel ?? 'medium'}`,
      `*Timestamp*: ${ctx.timestamp}`,
      `*SLA*: ${nvl(ctx.slaDeadline, 'next 24h')}`,
      `*Evidence*: ${nvl(ctx.evidenceUrl)}`,
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
            text: { type: 'plain_text', text: 'Approve', emoji: false },
            value: `approve:${ctx.requestId}`,
            url: buildApprovalPath(2, ctx.requestId),
            style: 'primary',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Reject', emoji: false },
            value: `reject:${ctx.requestId}`,
            url: buildRejectPath(2, ctx.requestId),
            style: 'danger',
          },
        ],
      },
    ] satisfies HitlSlackBlock[];
  },
};
