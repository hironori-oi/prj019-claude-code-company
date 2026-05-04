/**
 * PRJ-019 Clawbridge — HITL-5 tos_strict notification template
 *
 * Source: dev-w0-week2-t2-hitl-template-design.md §3.2 HITL-5
 * Origin: DEC-019-010 (13 prohibited categories, 即拒否)
 * Urgency: CRITICAL (high in template enum) / channel: drill
 *
 * 即拒否 = approval link 不要、Owner action 不要 (audit log のみ)
 * defaultRejectAfterMs = 0 (即適用)
 */
import { z } from 'zod';
import {
  escapeMrkdwn,
  hitlGateContextBaseSchema,
  nvl,
  truncate,
  type HitlGate5Context,
  type HitlNotificationTemplate,
  type HitlSlackBlock,
} from './types';

const gate5ContextSchema = hitlGateContextBaseSchema.extend({
  blocklistCategory: z.string().min(1),
  candidateId: z.string().min(1),
}) as unknown as z.ZodType<HitlGate5Context>;

export const gate5Template: HitlNotificationTemplate<HitlGate5Context> = {
  gateNumber: 5,
  gateName: 'tos_strict',
  urgency: 'critical',
  channel: 'drill',
  // tos_strict は Owner approval 不要 (即拒否、通知のみ)
  approvalLinkPath: '',
  rejectLinkPath: '',
  defaultRejectAfterMs: 0,
  contextSchema: gate5ContextSchema,

  buildTitle(ctx) {
    return truncate(
      `[HITL-5] tos_strict: IMMEDIATE REJECT (${ctx.blocklistCategory})`,
      150,
    );
  },

  buildBody(ctx) {
    return [
      `*Gate*: HITL-5 tos_strict (CRITICAL — auto-reject)`,
      `*Category Hit*: ${escapeMrkdwn(ctx.blocklistCategory)} (DEC-019-010 13 prohibited)`,
      `*Candidate*: ${escapeMrkdwn(truncate(ctx.candidateId, 200))}`,
      `*Auto-Reject*: applied at ${ctx.timestamp}`,
      `*No Owner Action Required* — Audit log appended`,
      `*Actor*: ${escapeMrkdwn(ctx.actor)}`,
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
      // 即拒否 = action button なし (通知のみ)
    ] satisfies HitlSlackBlock[];
  },
};
