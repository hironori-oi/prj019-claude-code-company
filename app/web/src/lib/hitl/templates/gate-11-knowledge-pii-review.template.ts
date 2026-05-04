/**
 * PRJ-019 Clawbridge — HITL-11 knowledge_pii_review notification template
 *
 * Source: dev-w0-week2-t2-hitl-template-design.md §3.2 HITL-11
 * Origin: DEC-019-033 §④ + ODR-OG-06 (knowledge PII review)
 * Urgency: MEDIUM / channel: hitl / SLA: 48h default reject
 */
import { z } from 'zod';
import {
  buildApprovalPath,
  buildRejectPath,
  escapeMrkdwn,
  hitlGateContextBaseSchema,
  truncate,
  TIMEOUT_48H_MS,
  type HitlGate11Context,
  type HitlNotificationTemplate,
  type HitlSlackBlock,
} from './types';

const gate11ContextSchema = hitlGateContextBaseSchema.extend({
  batchId: z.string().min(1),
  source: z.string().min(1),
  prjId: z.string().min(1),
  piiCount: z.number().int().nonnegative(),
  piiCategories: z.array(z.string()),
  redactionStrategy: z.string().min(1),
}) as unknown as z.ZodType<HitlGate11Context>;

export const gate11Template: HitlNotificationTemplate<HitlGate11Context> = {
  gateNumber: 11,
  gateName: 'knowledge_pii_review',
  urgency: 'medium',
  channel: 'hitl',
  approvalLinkPath: '/dashboard/hitl/11/approve',
  rejectLinkPath: '/dashboard/hitl/11/reject',
  defaultRejectAfterMs: TIMEOUT_48H_MS,
  contextSchema: gate11ContextSchema,

  buildTitle(ctx) {
    return truncate(
      `[HITL-11] knowledge_pii_review: batch=${truncate(ctx.batchId, 30)} (PII=${ctx.piiCount})`,
      150,
    );
  },

  buildBody(ctx) {
    const categories =
      ctx.piiCategories.length === 0
        ? 'none'
        : ctx.piiCategories.map((c) => escapeMrkdwn(c)).join(', ');
    return [
      `*Gate*: HITL-11 knowledge_pii_review (MEDIUM)`,
      `*Batch ID*: ${escapeMrkdwn(ctx.batchId)}`,
      `*Source*: ${escapeMrkdwn(ctx.source)} (PRJ-${escapeMrkdwn(ctx.prjId)})`,
      `*PII Findings*: ${ctx.piiCount} 件 (categories: ${categories})`,
      `*Redaction Strategy*: ${escapeMrkdwn(truncate(ctx.redactionStrategy, 500))}`,
      `*Owner Action*: PII 検出箇所を確認後 approve / 追加 redaction を要する場合 reject`,
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
            text: { type: 'plain_text', text: 'Approve redaction', emoji: false },
            value: `approve:${ctx.requestId}`,
            url: buildApprovalPath(11, ctx.requestId),
            style: 'primary',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Re-redact', emoji: false },
            value: `reject:${ctx.requestId}`,
            url: buildRejectPath(11, ctx.requestId),
            style: 'danger',
          },
        ],
      },
    ] satisfies HitlSlackBlock[];
  },
};
