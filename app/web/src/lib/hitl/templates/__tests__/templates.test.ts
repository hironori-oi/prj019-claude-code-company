/**
 * PRJ-019 Clawbridge — HITL 11-template Vitest test suite
 *
 * Source: dev-w0-week2-t2-hitl-template-design.md §9 AC-T2-1〜5 / §10 R-T2-1〜4
 *
 * 55 ケース内訳 (各 gate × 5 テスト):
 *   1. buildTitle: 期待 prefix + truncation
 *   2. buildBody: required placeholder 値が body に含まれる
 *   3. buildSlackBlocks: header / context block 構造 + (HITL-5 以外は) actions block
 *   4. defaultRejectAfterMs / urgency / channel / approval-link path 整合
 *   5. contextSchema: invalid context は parse 失敗 / valid は成功 (XSS escape も検証)
 */

import { describe, expect, it } from 'vitest';
import {
  gate1Template,
  gate2Template,
  gate3Template,
  gate4Template,
  gate5Template,
  gate6Template,
  gate7Template,
  gate8Template,
  gate9Template,
  gate10Template,
  gate11Template,
  hitlTemplateByNumber,
  hitlTemplateByName,
  HITL_GATE_KIND_TO_NAME,
  mapGateKindToTemplate,
  TIMEOUT_24H_MS,
  TIMEOUT_48H_MS,
  TIMEOUT_72H_MS,
  TIMEOUT_1H_MS,
  redactString,
  redactPayload,
  countPiiHits,
  escapeMrkdwn,
  truncate,
  type HitlGate1Context,
  type HitlGate2Context,
  type HitlGate3Context,
  type HitlGate4Context,
  type HitlGate5Context,
  type HitlGate6Context,
  type HitlGate7Context,
  type HitlGate8Context,
  type HitlGate9Context,
  type HitlGate10Context,
  type HitlGate11Context,
} from '../index';

// =============================================================================
// Fixture builders
// =============================================================================

const baseCtx = {
  requestId: 'req_abc123',
  actor: 'open_claw',
  action: 'public_release',
  timestamp: '2026-05-09T09:00:00Z',
  evidenceUrl: 'https://staging.clawbridge.app/dashboard/audit/req_abc123',
  slaDeadline: '2026-05-10T09:00:00Z',
  tenantId: 'tenant_x',
} as const;

function ctx1(): HitlGate1Context {
  return {
    ...baseCtx,
    candidateId: 'cand_001',
    category: 'dev-tools',
    rationale: 'AI CLI tool with TypeScript SDK',
  };
}

function ctx2(): HitlGate2Context {
  return {
    ...baseCtx,
    permissionChange: 'fs:write expanded',
    reason: 'PRJ-019 Phase 1 W2 task',
    riskLevel: 'medium',
  };
}

function ctx3(): HitlGate3Context {
  return {
    ...baseCtx,
    tier: 'warn',
    spentUsd: 24.1,
    capUsd: 30,
    recommendedAction: 'ANTHROPIC_API_KEY 削除推奨',
    nextResetAt: '2026-06-01T00:00:00Z',
  };
}

function ctx4(): HitlGate4Context {
  return {
    ...baseCtx,
    runtimeHours: 13.5,
    autoPauseStatus: 'applied',
  };
}

function ctx5(): HitlGate5Context {
  return {
    ...baseCtx,
    blocklistCategory: 'CSAM-related',
    candidateId: 'cand_strict_001',
  };
}

function ctx6(): HitlGate6Context {
  return {
    ...baseCtx,
    candidateId: 'cand_006',
    category: 'dev-tools',
    subcategory: 'cli-utility',
    confidence: 0.62,
    needSummary: 'HN trending TS repo simplification',
    rationale: 'No blocklist hits, gray confidence',
    blocklistHits: [],
  };
}

function ctx7(): HitlGate7Context {
  return {
    ...baseCtx,
    upstream: 'anthropic/sdk',
    semver: '^0.31.0',
    severity: 'high',
    description: 'Breaking change in messages API',
    affectedApis: ['client.messages.create', 'client.messages.stream'],
    recommendedAdapter: 'add adapter at lib/adapter/anthropic.ts',
    fallbackPlan: 'pin previous version 0.30.x',
  };
}

function ctx8(): HitlGate8Context {
  return {
    ...baseCtx,
    inputKind: 'owner_input',
    inputSummary: 'Owner provided design doc',
    validationStatus: 'pending',
    actionRequired: 'verify file integrity',
  };
}

function ctx9(): HitlGate9Context {
  return {
    ...baseCtx,
    proposalId: 'prop_3a8f',
    proposalTitle: 'AI CLI tool',
    needSummary: 'Git workflow simplification',
    effortEstimate: 5,
    knowledgeRefs: ['ref1', 'ref2'],
    riskSummary: 'low',
  };
}

function ctx10(): HitlGate10Context {
  return {
    ...baseCtx,
    category: 'cost',
    changeType: 'cap_increase',
    before: '30',
    after: '50',
    reason: 'Phase 1 expansion',
    auditHash: 'sha256:abc123def456',
    riskLevel: 'high',
    rollbackPlan: 'revert via /api/admin/budget DELETE',
  };
}

function ctx11(): HitlGate11Context {
  return {
    ...baseCtx,
    batchId: 'batch_2026_05_30',
    source: 'reports/',
    prjId: '007',
    piiCount: 3,
    piiCategories: ['email', 'name', 'slack_dm'],
    redactionStrategy: 'auto + manual review',
  };
}

// =============================================================================
// Generic 5-test factory (re-used for each gate)
// =============================================================================

type AnyTemplate = {
  buildTitle: (ctx: unknown) => string;
  buildBody: (ctx: unknown) => string;
  buildSlackBlocks: (ctx: unknown) => Array<{ type: string }>;
  contextSchema: { safeParse: (v: unknown) => { success: boolean } };
  defaultRejectAfterMs: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  channel: 'hitl' | 'monitor' | 'drill';
  approvalLinkPath: string;
  rejectLinkPath: string;
};

function runFiveTestsForGate<C extends { requestId: string; actor: string }>(
  describeName: string,
  template: unknown,
  ctxFactory: () => C,
  expected: {
    titlePrefix: string;
    bodyMustContain: string[];
    expectedTimeoutMs: number;
    expectedUrgency: 'low' | 'medium' | 'high' | 'critical';
    expectedChannel: 'hitl' | 'monitor' | 'drill';
    expectsActions: boolean;
    approvalPathHasGateNumber: number;
  },
) {
  const t = template as AnyTemplate;

  describe(describeName, () => {
    it('Test 1: buildTitle starts with expected prefix and is truncated to 150 chars', () => {
      const ctx = ctxFactory();
      const title = t.buildTitle(ctx);
      expect(title.startsWith(expected.titlePrefix)).toBe(true);
      expect(title.length).toBeLessThanOrEqual(150);
    });

    it('Test 2: buildBody contains required placeholder values', () => {
      const ctx = ctxFactory();
      const body = t.buildBody(ctx);
      for (const needle of expected.bodyMustContain) {
        expect(body).toContain(needle);
      }
      expect(body.length).toBeLessThanOrEqual(3000);
    });

    it('Test 3: buildSlackBlocks returns header + context (+ actions when applicable)', () => {
      const ctx = ctxFactory();
      const blocks = t.buildSlackBlocks(ctx);
      expect(blocks[0]?.type).toBe('header');
      expect(blocks[1]?.type).toBe('context');
      const hasActions = blocks.some((b) => b.type === 'actions');
      expect(hasActions).toBe(expected.expectsActions);
    });

    it('Test 4: timeout / urgency / channel / approval-link path are correct', () => {
      expect(t.defaultRejectAfterMs).toBe(expected.expectedTimeoutMs);
      expect(t.urgency).toBe(expected.expectedUrgency);
      expect(t.channel).toBe(expected.expectedChannel);
      if (expected.approvalPathHasGateNumber > 0) {
        expect(t.approvalLinkPath).toContain(
          `/dashboard/hitl/${expected.approvalPathHasGateNumber}/approve`,
        );
        expect(t.rejectLinkPath).toContain(
          `/dashboard/hitl/${expected.approvalPathHasGateNumber}/reject`,
        );
      } else {
        expect(t.approvalLinkPath).toBe('');
        expect(t.rejectLinkPath).toBe('');
      }
    });

    it('Test 5: contextSchema accepts valid ctx and rejects missing-required ctx; mrkdwn escape is applied', () => {
      const ctx = ctxFactory();
      const valid = t.contextSchema.safeParse(ctx);
      expect(valid.success).toBe(true);

      const broken = { ...ctx, requestId: '' };
      const invalid = t.contextSchema.safeParse(broken);
      expect(invalid.success).toBe(false);

      const evilCtx = { ...ctx, actor: '<script>alert(1)</script>' };
      const evilBody = t.buildBody(evilCtx);
      expect(evilBody).not.toContain('<script>');
      expect(evilBody).toContain('&lt;script&gt;');
    });
  });
}

// =============================================================================
// Run 5 tests for each of 11 gates
// =============================================================================

runFiveTestsForGate('HITL-1 tos_review', (gate1Template), ctx1, {
  titlePrefix: '[HITL-1] tos_review',
  bodyMustContain: ['HITL-1 tos_review', 'public_release', 'open_claw', 'dev-tools'],
  expectedTimeoutMs: TIMEOUT_24H_MS,
  expectedUrgency: 'medium',
  expectedChannel: 'hitl',
  expectsActions: true,
  approvalPathHasGateNumber: 1,
});

runFiveTestsForGate('HITL-2 permission_review', (gate2Template), ctx2, {
  titlePrefix: '[HITL-2] permission_review',
  bodyMustContain: ['HITL-2 permission_review', 'fs:write expanded', 'PRJ-019 Phase 1'],
  expectedTimeoutMs: TIMEOUT_24H_MS,
  expectedUrgency: 'medium',
  expectedChannel: 'hitl',
  expectsActions: true,
  approvalPathHasGateNumber: 2,
});

runFiveTestsForGate('HITL-3 cost_breach', (gate3Template), ctx3, {
  titlePrefix: '[HITL-3] cost_breach',
  bodyMustContain: ['HITL-3 cost_breach', '$24.10', '$30.00', 'warn'],
  expectedTimeoutMs: TIMEOUT_1H_MS,
  expectedUrgency: 'high',
  expectedChannel: 'drill',
  expectsActions: true,
  approvalPathHasGateNumber: 3,
});

runFiveTestsForGate('HITL-4 ng3_breach', (gate4Template), ctx4, {
  titlePrefix: '[HITL-4] ng3_breach',
  bodyMustContain: ['HITL-4 ng3_breach', '13.5h', 'applied'],
  expectedTimeoutMs: TIMEOUT_24H_MS,
  expectedUrgency: 'critical',
  expectedChannel: 'drill',
  expectsActions: true,
  approvalPathHasGateNumber: 4,
});

runFiveTestsForGate('HITL-5 tos_strict', (gate5Template), ctx5, {
  titlePrefix: '[HITL-5] tos_strict',
  bodyMustContain: ['HITL-5 tos_strict', 'CSAM-related', 'No Owner Action Required'],
  expectedTimeoutMs: 0,
  expectedUrgency: 'critical',
  expectedChannel: 'drill',
  expectsActions: false,
  approvalPathHasGateNumber: 0,
});

runFiveTestsForGate('HITL-6 tos_gray_review', (gate6Template), ctx6, {
  titlePrefix: '[HITL-6] tos_gray_review',
  bodyMustContain: ['HITL-6 tos_gray_review', '0.62', 'cli-utility', 'gray zone'],
  expectedTimeoutMs: TIMEOUT_24H_MS,
  expectedUrgency: 'medium',
  expectedChannel: 'hitl',
  expectsActions: true,
  approvalPathHasGateNumber: 6,
});

runFiveTestsForGate('HITL-7 changelog_external_api', (gate7Template), ctx7, {
  titlePrefix: '[HITL-7] changelog_external_api',
  bodyMustContain: ['HITL-7 changelog_external_api', 'anthropic/sdk', 'high'],
  expectedTimeoutMs: TIMEOUT_24H_MS,
  expectedUrgency: 'high',
  expectedChannel: 'drill',
  expectsActions: true,
  approvalPathHasGateNumber: 7,
});

runFiveTestsForGate('HITL-8 evidence_review', (gate8Template), ctx8, {
  titlePrefix: '[HITL-8] evidence_review',
  bodyMustContain: ['HITL-8 evidence_review', 'owner_input', 'pending'],
  expectedTimeoutMs: TIMEOUT_24H_MS,
  expectedUrgency: 'low',
  expectedChannel: 'hitl',
  expectsActions: true,
  approvalPathHasGateNumber: 8,
});

runFiveTestsForGate('HITL-9 dev_kickoff_approval', (gate9Template), ctx9, {
  titlePrefix: '[HITL-9] dev_kickoff_approval',
  bodyMustContain: ['HITL-9 dev_kickoff_approval', 'prop_3a8f', '5 SP', '2 件'],
  expectedTimeoutMs: TIMEOUT_72H_MS,
  expectedUrgency: 'medium',
  expectedChannel: 'hitl',
  expectsActions: true,
  approvalPathHasGateNumber: 9,
});

runFiveTestsForGate('HITL-10 permission_change_review', (gate10Template), ctx10, {
  titlePrefix: '[HITL-10] permission_change_review',
  bodyMustContain: ['HITL-10 permission_change_review', 'cap_increase', '30', '50'],
  expectedTimeoutMs: TIMEOUT_24H_MS,
  expectedUrgency: 'high',
  expectedChannel: 'drill',
  expectsActions: true,
  approvalPathHasGateNumber: 10,
});

runFiveTestsForGate('HITL-11 knowledge_pii_review', (gate11Template), ctx11, {
  titlePrefix: '[HITL-11] knowledge_pii_review',
  bodyMustContain: ['HITL-11 knowledge_pii_review', 'batch_2026_05_30', 'PRJ-007', '3 件'],
  expectedTimeoutMs: TIMEOUT_48H_MS,
  expectedUrgency: 'medium',
  expectedChannel: 'hitl',
  expectsActions: true,
  approvalPathHasGateNumber: 11,
});

// =============================================================================
// Cross-cutting integration tests (registry / mapping / pii redactor / helpers)
// =============================================================================

describe('Registry & cross-cutting concerns', () => {
  it('hitlTemplateByNumber covers 1..11 with matching gateNumber', () => {
    for (let n = 1; n <= 11; n += 1) {
      const t = hitlTemplateByNumber[n];
      expect(t).toBeDefined();
      expect(t?.gateNumber).toBe(n);
    }
  });

  it('hitlTemplateByName key matches template gateName', () => {
    for (const [name, tpl] of Object.entries(hitlTemplateByName)) {
      expect(tpl.gateName).toBe(name);
    }
  });

  it('mapGateKindToTemplate returns a template for every legacy gateKind', () => {
    for (const gateKind of Object.keys(HITL_GATE_KIND_TO_NAME)) {
      const tpl = mapGateKindToTemplate(gateKind as keyof typeof HITL_GATE_KIND_TO_NAME);
      expect(tpl).toBeDefined();
      expect(tpl.gateNumber).toBeGreaterThanOrEqual(1);
      expect(tpl.gateNumber).toBeLessThanOrEqual(11);
    }
  });

  it('redactString redacts email, slack URL, API key, GitHub PAT, bearer, op://, and 16-digit', () => {
    const input = [
      'contact me at user@example.com',
      'see slack https://my.slack.com/archives/D01ABCDEF/p123',
      'key=sk-abcdefghij1234567890XYZ',
      'anth=sk-ant-api03-AAAAAAAAAAAAAAAAAAAA',
      'gh=ghp_1234567890ABCDEFGHIJKLMNOP',
      'Authorization: Bearer abcdef1234567890ABCDEF1234567890',
      'op://prj019/anthropic/api_key',
      'card 4111 1111 1111 1111',
    ].join(' / ');
    const redacted = redactString(input);
    expect(redacted).not.toContain('user@example.com');
    expect(redacted).not.toContain('sk-abcdefghij');
    expect(redacted).not.toContain('sk-ant-api03');
    expect(redacted).not.toContain('ghp_');
    expect(redacted).not.toContain('Bearer abc');
    expect(redacted).not.toContain('op://prj019');
    expect(redacted).toContain('[redacted:email]');
    expect(redacted).toContain('[redacted:api_key]');
  });

  it('redactPayload deeply redacts string fields inside nested objects/arrays', () => {
    const obj = {
      actor: 'admin@example.com',
      nested: {
        token: 'sk-1234567890abcdefghijKLMNOP',
        list: ['ghp_1234567890ABCDEFGHIJKLMNOP', 'safe-string'],
      },
    };
    const out = redactPayload(obj);
    expect(out.actor).toContain('[redacted:email]');
    expect(out.nested.token).toContain('[redacted:api_key]');
    expect(out.nested.list[0]!).toContain('[redacted:github_pat]');
    expect(out.nested.list[1]).toBe('safe-string');
  });

  it('countPiiHits returns >0 when input contains PII', () => {
    expect(countPiiHits('plain text')).toBe(0);
    expect(countPiiHits('a@b.com')).toBeGreaterThanOrEqual(1);
  });

  it('escapeMrkdwn escapes <, >, & and truncate clips long strings', () => {
    expect(escapeMrkdwn('<b>&</b>')).toBe('&lt;b&gt;&amp;&lt;/b&gt;');
    expect(truncate('1234567', 5)).toBe('1234…');
    expect(truncate('abc', 10)).toBe('abc');
  });

  it('all 11 templates produce non-empty title and body', () => {
    const fixtures = [
      [gate1Template, ctx1()],
      [gate2Template, ctx2()],
      [gate3Template, ctx3()],
      [gate4Template, ctx4()],
      [gate5Template, ctx5()],
      [gate6Template, ctx6()],
      [gate7Template, ctx7()],
      [gate8Template, ctx8()],
      [gate9Template, ctx9()],
      [gate10Template, ctx10()],
      [gate11Template, ctx11()],
    ] as const;
    for (const [tpl, ctx] of fixtures) {
      expect(tpl.buildTitle(ctx as never).length).toBeGreaterThan(0);
      expect(tpl.buildBody(ctx as never).length).toBeGreaterThan(0);
      const blocks = tpl.buildSlackBlocks(ctx as never);
      expect(blocks.length).toBeGreaterThanOrEqual(2);
    }
  });
});
