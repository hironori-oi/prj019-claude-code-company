/**
 * PRJ-019 Clawbridge — HITL-3 cost_breach notification template
 *
 * Source: dev-w0-week2-t2-hitl-template-design.md §3.2 HITL-3
 * Origin: DEC-019-007 / DEC-019-050 (cost cap breach)
 * Urgency: HIGH / channel: drill / SLA: 1h pause (cost_threshold)
 */
import { z } from 'zod';
import {
  buildApprovalPath,
  buildRejectPath,
  escapeMrkdwn,
  hitlGateContextBaseSchema,
  truncate,
  TIMEOUT_1H_MS,
  type HitlGate3Context,
  type HitlNotificationTemplate,
  type HitlSlackBlock,
} from './types';

const gate3ContextSchema = hitlGateContextBaseSchema.extend({
  tier: z.enum(['warn', 'cap', 'hard']),
  spentUsd: z.number().nonnegative(),
  capUsd: z.number().positive(),
  recommendedAction: z.string().min(1),
  nextResetAt: z.string().min(1),
}) as unknown as z.ZodType<HitlGate3Context>;

export const gate3Template: HitlNotificationTemplate<HitlGate3Context> = {
  gateNumber: 3,
  gateName: 'cost_breach',
  urgency: 'high',
  channel: 'drill',
  approvalLinkPath: '/dashboard/hitl/3/approve',
  rejectLinkPath: '/dashboard/hitl/3/reject',
  defaultRejectAfterMs: TIMEOUT_1H_MS,
  contextSchema: gate3ContextSchema,

  buildTitle(ctx) {
    return truncate(
      `[HITL-3] cost_breach: $${ctx.spentUsd.toFixed(2)} / $${ctx.capUsd.toFixed(2)} (${ctx.tier})`,
      150,
    );
  },

  buildBody(ctx) {
    const remaining = (ctx.capUsd - ctx.spentUsd).toFixed(2);
    return [
      `*Gate*: HITL-3 cost_breach (HIGH)`,
      `*Tier*: ${ctx.tier}`,
      `*Spent*: $${ctx.spentUsd.toFixed(2)}`,
      `*Cap*: $${ctx.capUsd.toFixed(2)}`,
      `*Remaining*: $${remaining}`,
      `*Recommended Action*: ${escapeMrkdwn(truncate(ctx.recommendedAction, 1000))}`,
      `*Reset At*: ${ctx.nextResetAt}`,
      `*Actor*: ${escapeMrkdwn(ctx.actor)}`,
      `*Timestamp*: ${ctx.timestamp}`,
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
            text: { type: 'plain_text', text: 'Approve (raise cap)', emoji: false },
            value: `approve:${ctx.requestId}`,
            url: buildApprovalPath(3, ctx.requestId),
            style: 'primary',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Reject (pause)', emoji: false },
            value: `reject:${ctx.requestId}`,
            url: buildRejectPath(3, ctx.requestId),
            style: 'danger',
          },
        ],
      },
    ] satisfies HitlSlackBlock[];
  },
};
