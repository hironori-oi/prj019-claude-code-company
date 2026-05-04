/**
 * PRJ-019 Clawbridge — HITL-9 dev_kickoff_approval notification template
 *
 * Source: dev-w0-week2-t2-hitl-template-design.md §3.2 HITL-9
 * Origin: DEC-019-033 §② (dev kickoff approval, Open Claw 提案 → Owner 承認)
 * Urgency: MEDIUM / channel: hitl / SLA: 72h default reject
 *
 * 注: injection scan (proposal_title 等) は LLM 残置 — 本 template は scan 後の通知のみ。
 *     scan 経路は app/web/src/lib/hitl/scan.ts で別 export として分離維持。
 */
import { z } from 'zod';
import {
  buildApprovalPath,
  buildRejectPath,
  escapeMrkdwn,
  hitlGateContextBaseSchema,
  truncate,
  TIMEOUT_72H_MS,
  type HitlGate9Context,
  type HitlNotificationTemplate,
  type HitlSlackBlock,
} from './types';

const gate9ContextSchema = hitlGateContextBaseSchema.extend({
  proposalId: z.string().min(1),
  proposalTitle: z.string().min(1),
  needSummary: z.string().min(1),
  effortEstimate: z.number().nonnegative(),
  knowledgeRefs: z.array(z.string()),
  riskSummary: z.string().optional(),
}) as unknown as z.ZodType<HitlGate9Context>;

export const gate9Template: HitlNotificationTemplate<HitlGate9Context> = {
  gateNumber: 9,
  gateName: 'dev_kickoff_approval',
  urgency: 'medium',
  channel: 'hitl',
  approvalLinkPath: '/dashboard/hitl/9/approve',
  rejectLinkPath: '/dashboard/hitl/9/reject',
  defaultRejectAfterMs: TIMEOUT_72H_MS,
  contextSchema: gate9ContextSchema,

  buildTitle(ctx) {
    const id = truncate(ctx.proposalId, 24);
    return truncate(`[HITL-9] dev_kickoff_approval: ${id} (${ctx.effortEstimate} SP)`, 150);
  },

  buildBody(ctx) {
    return [
      `*Gate*: HITL-9 dev_kickoff_approval (MEDIUM)`,
      `*Proposal ID*: ${escapeMrkdwn(ctx.proposalId)}`,
      `*Title*: ${escapeMrkdwn(truncate(ctx.proposalTitle, 200))}`,
      `*Need Summary*: ${escapeMrkdwn(truncate(ctx.needSummary, 1000))}`,
      `*Estimated Effort*: ${ctx.effortEstimate} SP`,
      `*Knowledge References*: ${ctx.knowledgeRefs.length} 件 (organization/knowledge/ 由来)`,
      `*Risk*: ${escapeMrkdwn(truncate(ctx.riskSummary ?? 'low', 500))}`,
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
            text: { type: 'plain_text', text: 'Adopt', emoji: false },
            value: `approve:${ctx.requestId}`,
            url: buildApprovalPath(9, ctx.requestId),
            style: 'primary',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Defer / Reject', emoji: false },
            value: `reject:${ctx.requestId}`,
            url: buildRejectPath(9, ctx.requestId),
            style: 'danger',
          },
        ],
      },
    ] satisfies HitlSlackBlock[];
  },
};
