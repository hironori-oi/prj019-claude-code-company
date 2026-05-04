/**
 * PRJ-019 Clawbridge — HITL-4 ng3_breach notification template
 *
 * Source: dev-w0-week2-t2-hitl-template-design.md §3.2 HITL-4
 * Origin: DEC-019-008 (NG-3 24/7 / 12h cap)
 * Urgency: CRITICAL (high in template enum) / channel: drill / SLA: 24h
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
  type HitlGate4Context,
  type HitlNotificationTemplate,
  type HitlSlackBlock,
} from './types';

const gate4ContextSchema = hitlGateContextBaseSchema.extend({
  runtimeHours: z.number().nonnegative(),
  autoPauseStatus: z.enum(['pending', 'applied', 'failed']),
}) as unknown as z.ZodType<HitlGate4Context>;

export const gate4Template: HitlNotificationTemplate<HitlGate4Context> = {
  gateNumber: 4,
  gateName: 'ng3_breach',
  urgency: 'critical',
  channel: 'drill',
  approvalLinkPath: '/dashboard/hitl/4/approve',
  rejectLinkPath: '/dashboard/hitl/4/reject',
  defaultRejectAfterMs: TIMEOUT_24H_MS,
  contextSchema: gate4ContextSchema,

  buildTitle(ctx) {
    return truncate(
      `[HITL-4] ng3_breach: runtime=${ctx.runtimeHours}h cap=12h (auto_pause=${ctx.autoPauseStatus})`,
      150,
    );
  },

  buildBody(ctx) {
    return [
      `*Gate*: HITL-4 ng3_breach (CRITICAL)`,
      `*Runtime*: ${ctx.runtimeHours}h (NG-3 cap = 12h/day)`,
      `*Detected At*: ${ctx.timestamp}`,
      `*Auto-Pause Status*: ${ctx.autoPauseStatus}`,
      `*Actor*: ${escapeMrkdwn(ctx.actor)}`,
      `*Owner Action*: BAN drill 移行判断 + 24h cooldown 確認`,
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
            text: { type: 'plain_text', text: 'Acknowledge & continue', emoji: false },
            value: `approve:${ctx.requestId}`,
            url: buildApprovalPath(4, ctx.requestId),
            style: 'primary',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Trigger BAN drill', emoji: false },
            value: `reject:${ctx.requestId}`,
            url: buildRejectPath(4, ctx.requestId),
            style: 'danger',
          },
        ],
      },
    ] satisfies HitlSlackBlock[];
  },
};
