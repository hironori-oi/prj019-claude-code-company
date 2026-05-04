/**
 * PRJ-019 Clawbridge — HITL-8 evidence_review notification template
 *
 * Source: dev-w0-week2-t2-hitl-template-design.md §3.2 HITL-8
 * Origin: DEC-020-003 (PRJ-020 owner_input_review rebrand)
 * Urgency: LOW-MEDIUM (default low、urgencyOverride で escalate 可)
 * Channel: hitl / SLA: 24h default reject
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
  type HitlGate8Context,
  type HitlNotificationTemplate,
  type HitlSlackBlock,
} from './types';

const gate8ContextSchema = hitlGateContextBaseSchema.extend({
  inputKind: z.string().min(1),
  inputSummary: z.string().min(1),
  validationStatus: z.enum(['pending', 'partial', 'verified', 'rejected']),
  actionRequired: z.string().min(1),
  urgencyOverride: z.enum(['low', 'medium', 'high', 'critical']).optional(),
}) as unknown as z.ZodType<HitlGate8Context>;

export const gate8Template: HitlNotificationTemplate<HitlGate8Context> = {
  gateNumber: 8,
  gateName: 'evidence_review',
  urgency: 'low',
  channel: 'hitl',
  approvalLinkPath: '/dashboard/hitl/8/approve',
  rejectLinkPath: '/dashboard/hitl/8/reject',
  defaultRejectAfterMs: TIMEOUT_24H_MS,
  contextSchema: gate8ContextSchema,

  buildTitle(ctx) {
    return truncate(`[HITL-8] evidence_review: ${ctx.inputKind} (${ctx.validationStatus})`, 150);
  },

  buildBody(ctx) {
    return [
      `*Gate*: HITL-8 evidence_review (${(ctx.urgencyOverride ?? 'low').toUpperCase()})`,
      `*Input Kind*: ${escapeMrkdwn(ctx.inputKind)}`,
      `*Input Summary*: ${escapeMrkdwn(truncate(ctx.inputSummary, 1500))}`,
      `*Validation Status*: ${ctx.validationStatus}`,
      `*Action Required*: ${escapeMrkdwn(truncate(ctx.actionRequired, 800))}`,
      `*Actor*: ${escapeMrkdwn(ctx.actor)}`,
      `*Timestamp*: ${ctx.timestamp}`,
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
            text: { type: 'plain_text', text: 'Verify', emoji: false },
            value: `approve:${ctx.requestId}`,
            url: buildApprovalPath(8, ctx.requestId),
            style: 'primary',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Reject', emoji: false },
            value: `reject:${ctx.requestId}`,
            url: buildRejectPath(8, ctx.requestId),
            style: 'danger',
          },
        ],
      },
    ] satisfies HitlSlackBlock[];
  },
};
