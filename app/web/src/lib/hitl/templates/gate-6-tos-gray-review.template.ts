/**
 * PRJ-019 Clawbridge — HITL-6 tos_gray_review notification template
 *
 * Source: dev-w0-week2-t2-hitl-template-design.md §3.2 HITL-6
 * Origin: DEC-019-018 (gray zone 0.5-0.85 review)
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
  type HitlGate6Context,
  type HitlNotificationTemplate,
  type HitlSlackBlock,
} from './types';

const gate6ContextSchema = hitlGateContextBaseSchema.extend({
  candidateId: z.string().min(1),
  category: z.string().min(1),
  subcategory: z.string().min(1),
  confidence: z.number().min(0).max(1),
  needSummary: z.string().min(1),
  rationale: z.string().min(1),
  blocklistHits: z.array(z.string()),
}) as unknown as z.ZodType<HitlGate6Context>;

export const gate6Template: HitlNotificationTemplate<HitlGate6Context> = {
  gateNumber: 6,
  gateName: 'tos_gray_review',
  urgency: 'medium',
  channel: 'hitl',
  approvalLinkPath: '/dashboard/hitl/6/approve',
  rejectLinkPath: '/dashboard/hitl/6/reject',
  defaultRejectAfterMs: TIMEOUT_24H_MS,
  contextSchema: gate6ContextSchema,

  buildTitle(ctx) {
    return truncate(
      `[HITL-6] tos_gray_review: confidence=${ctx.confidence.toFixed(2)} (${ctx.category}/${ctx.subcategory})`,
      150,
    );
  },

  buildBody(ctx) {
    const blocklistText =
      ctx.blocklistHits.length === 0
        ? 'none'
        : ctx.blocklistHits.map((h) => escapeMrkdwn(h)).join(', ');
    return [
      `*Gate*: HITL-6 tos_gray_review (MEDIUM)`,
      `*Candidate*: ${escapeMrkdwn(truncate(ctx.candidateId, 100))}`,
      `*Category*: ${escapeMrkdwn(ctx.category)} / ${escapeMrkdwn(ctx.subcategory)}`,
      `*Confidence*: ${ctx.confidence.toFixed(2)} (gray zone 0.5-0.85)`,
      `*Need Summary*: ${escapeMrkdwn(truncate(ctx.needSummary, 800))}`,
      `*Rationale*: ${escapeMrkdwn(truncate(ctx.rationale, 800))}`,
      `*Blocklist Hits*: ${blocklistText}`,
      `*Actor*: ${escapeMrkdwn(ctx.actor)}`,
      `*SLA*: ${nvl(ctx.slaDeadline, 'next 24h')}`,
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
            text: { type: 'plain_text', text: 'Adopt', emoji: false },
            value: `approve:${ctx.requestId}`,
            url: buildApprovalPath(6, ctx.requestId),
            style: 'primary',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Reject', emoji: false },
            value: `reject:${ctx.requestId}`,
            url: buildRejectPath(6, ctx.requestId),
            style: 'danger',
          },
        ],
      },
    ] satisfies HitlSlackBlock[];
  },
};
