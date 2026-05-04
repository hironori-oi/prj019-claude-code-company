/**
 * PRJ-019 Clawbridge — HITL-7 changelog_external_api notification template
 *
 * Source: dev-w0-week2-t2-hitl-template-design.md §3.2 HITL-7
 * Origin: DEC-019-022 (external API changelog detection)
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
  type HitlGate7Context,
  type HitlNotificationTemplate,
  type HitlSlackBlock,
} from './types';

const gate7ContextSchema = hitlGateContextBaseSchema.extend({
  upstream: z.string().min(1),
  semver: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(1),
  affectedApis: z.array(z.string()),
  recommendedAdapter: z.string().min(1),
  fallbackPlan: z.string().min(1),
}) as unknown as z.ZodType<HitlGate7Context>;

export const gate7Template: HitlNotificationTemplate<HitlGate7Context> = {
  gateNumber: 7,
  gateName: 'changelog_external_api',
  urgency: 'high',
  channel: 'drill',
  approvalLinkPath: '/dashboard/hitl/7/approve',
  rejectLinkPath: '/dashboard/hitl/7/reject',
  defaultRejectAfterMs: TIMEOUT_24H_MS,
  contextSchema: gate7ContextSchema,

  buildTitle(ctx) {
    return truncate(
      `[HITL-7] changelog_external_api: ${ctx.upstream}@${ctx.semver} severity=${ctx.severity}`,
      150,
    );
  },

  buildBody(ctx) {
    const apis =
      ctx.affectedApis.length === 0
        ? 'none'
        : ctx.affectedApis.map((a) => escapeMrkdwn(a)).join(', ');
    return [
      `*Gate*: HITL-7 changelog_external_api (HIGH)`,
      `*Upstream*: ${escapeMrkdwn(ctx.upstream)} (${escapeMrkdwn(ctx.semver)})`,
      `*Severity*: ${ctx.severity}`,
      `*Description*: ${escapeMrkdwn(truncate(ctx.description, 1000))}`,
      `*Affected APIs*: ${apis}`,
      `*Recommended Adapter*: ${escapeMrkdwn(truncate(ctx.recommendedAdapter, 500))}`,
      `*Fallback Plan*: ${escapeMrkdwn(truncate(ctx.fallbackPlan, 500))}`,
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
            text: { type: 'plain_text', text: 'Apply adapter', emoji: false },
            value: `approve:${ctx.requestId}`,
            url: buildApprovalPath(7, ctx.requestId),
            style: 'primary',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Activate fallback', emoji: false },
            value: `reject:${ctx.requestId}`,
            url: buildRejectPath(7, ctx.requestId),
            style: 'danger',
          },
        ],
      },
    ] satisfies HitlSlackBlock[];
  },
};
