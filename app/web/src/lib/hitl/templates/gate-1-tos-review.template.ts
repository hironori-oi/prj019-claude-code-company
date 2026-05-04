/**
 * PRJ-019 Clawbridge — HITL-1 tos_review notification template
 *
 * Source: dev-w0-week2-t2-hitl-template-design.md §3.2 HITL-1
 * Origin: DEC-019-001 (案件初期 ToS レビュー)
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
  type HitlGate1Context,
  type HitlNotificationTemplate,
  type HitlSlackBlock,
} from './types';

const gate1ContextSchema = hitlGateContextBaseSchema.extend({
  candidateId: z.string().min(1),
  category: z.string().min(1),
  rationale: z.string().min(1),
}) as unknown as z.ZodType<HitlGate1Context>;

export const gate1Template: HitlNotificationTemplate<HitlGate1Context> = {
  gateNumber: 1,
  gateName: 'tos_review',
  urgency: 'medium',
  channel: 'hitl',
  approvalLinkPath: '/dashboard/hitl/1/approve',
  rejectLinkPath: '/dashboard/hitl/1/reject',
  defaultRejectAfterMs: TIMEOUT_24H_MS,
  contextSchema: gate1ContextSchema,

  buildTitle(ctx) {
    const candidate = truncate(ctx.candidateId, 30);
    return truncate(`[HITL-1] tos_review: ${ctx.actor} → ${ctx.action} (${candidate})`, 150);
  },

  buildBody(ctx) {
    return [
      `*Gate*: HITL-1 tos_review (MEDIUM)`,
      `*Action*: ${escapeMrkdwn(ctx.action)}`,
      `*Actor*: ${escapeMrkdwn(ctx.actor)}`,
      `*Candidate*: ${escapeMrkdwn(ctx.candidateId)}`,
      `*Category*: ${escapeMrkdwn(ctx.category)}`,
      `*Rationale*: ${escapeMrkdwn(truncate(ctx.rationale, 1500))}`,
      `*Timestamp*: ${ctx.timestamp}`,
      `*SLA*: ${nvl(ctx.slaDeadline, 'next 24h')}`,
      `*Evidence*: ${nvl(ctx.evidenceUrl)}`,
    ].join('\n');
  },

  buildSlackBlocks(ctx) {
    const blocks: HitlSlackBlock[] = [
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
            url: buildApprovalPath(1, ctx.requestId),
            style: 'primary',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Reject', emoji: false },
            value: `reject:${ctx.requestId}`,
            url: buildRejectPath(1, ctx.requestId),
            style: 'danger',
          },
        ],
      },
    ];
    return blocks;
  },
};
