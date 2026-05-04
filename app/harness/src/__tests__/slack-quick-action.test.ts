/**
 * slack-quick-action.test — Round 11 Dev-B (DEC-019-057).
 *
 * DoD: 4+ tests for 3 button payload + parser + edge cases.
 *
 * coverage:
 *   - kill_switch button build / parse / 期限切れ拒否
 *   - cost_cap button confirm dialog 必須化
 *   - drill_start button (dry-run / 本番) build
 *   - parse: invalid JSON / action_id mismatch / expired
 *   - metadata builder default 5min TTL
 */
import { describe, it, expect } from 'vitest'
import {
  ACTION_ID_COST_CAP,
  ACTION_ID_DRILL_START,
  ACTION_ID_KILL_SWITCH,
  buildSlackQuickActionButton,
  buildSlackQuickActionMetadata,
  parseSlackQuickAction,
  type SlackQuickActionPayload,
} from '../slack-quick-action.js'

const FIXED_NOW = Date.parse('2026-05-04T18:00:00Z')

function makeMeta(opts?: Partial<Parameters<typeof buildSlackQuickActionMetadata>[0]>) {
  return buildSlackQuickActionMetadata({
    projectId: opts?.projectId ?? 'PRJ-019',
    channelId: opts?.channelId ?? 'C0DEADBEEF',
    actorUserId: opts?.actorUserId ?? 'U0CEO',
    nowMs: opts?.nowMs ?? FIXED_NOW,
    ttlMs: opts?.ttlMs,
    nonce: opts?.nonce ?? 'test-nonce-1234',
  })
}

// ============================================================================
// build — kill_switch
// ============================================================================

describe('buildSlackQuickActionButton — kill_switch', () => {
  it('kill_switch button: danger style + confirm dialog 必須', () => {
    const btn = buildSlackQuickActionButton({
      kind: 'kill_switch',
      metadata: makeMeta(),
      reason: 'NG-3 12h breach',
      graceSeconds: 30,
    })
    expect(btn.type).toBe('button')
    expect(btn.style).toBe('danger')
    expect(btn.action_id).toBe(ACTION_ID_KILL_SWITCH)
    expect(btn.confirm).toBeDefined()
    expect(btn.confirm?.text.text).toContain('30s')
    // value は JSON serialize 可能な payload
    const re = JSON.parse(btn.value) as SlackQuickActionPayload
    expect(re.kind).toBe('kill_switch')
  })

  it('kill_switch: graceSeconds out-of-range で zod throw', () => {
    expect(() =>
      buildSlackQuickActionButton({
        kind: 'kill_switch',
        metadata: makeMeta(),
        reason: 'test',
        graceSeconds: 999, // > 120 max
      }),
    ).toThrow()
    expect(() =>
      buildSlackQuickActionButton({
        kind: 'kill_switch',
        metadata: makeMeta(),
        reason: 'test',
        graceSeconds: 0, // < 1 min
      }),
    ).toThrow()
  })
})

// ============================================================================
// build — cost_cap
// ============================================================================

describe('buildSlackQuickActionButton — cost_cap', () => {
  it('cost_cap button: primary style + confirm dialog (requiresConfirmation=true default)', () => {
    const btn = buildSlackQuickActionButton({
      kind: 'cost_cap',
      metadata: makeMeta(),
      newCapUsd: 100,
      reason: 'plan_a → plan_b 切替',
      requiresConfirmation: true,
    })
    expect(btn.style).toBe('primary')
    expect(btn.action_id).toBe(ACTION_ID_COST_CAP)
    expect(btn.confirm).toBeDefined()
    expect(btn.text.text).toContain('$100')
  })

  it('cost_cap: requiresConfirmation=false で confirm 省略', () => {
    const btn = buildSlackQuickActionButton({
      kind: 'cost_cap',
      metadata: makeMeta(),
      newCapUsd: 30,
      reason: 'rollback',
      requiresConfirmation: false,
    })
    expect(btn.confirm).toBeUndefined()
  })

  it('cost_cap: newCapUsd > 1300 (DEC-019-051 上限) で zod throw', () => {
    expect(() =>
      buildSlackQuickActionButton({
        kind: 'cost_cap',
        metadata: makeMeta(),
        newCapUsd: 5_000,
        reason: 'over',
      }),
    ).toThrow()
  })
})

// ============================================================================
// build — drill_start
// ============================================================================

describe('buildSlackQuickActionButton — drill_start', () => {
  it('drill_start dry-run: text に dry-run 含む', () => {
    const btn = buildSlackQuickActionButton({
      kind: 'drill_start',
      metadata: makeMeta(),
      scenarioId: 'drill-2',
      dryRun: true,
    })
    expect(btn.action_id).toBe(ACTION_ID_DRILL_START)
    expect(btn.text.text).toContain('drill-2')
    expect(btn.text.text).toContain('dry-run')
    expect(btn.confirm).toBeUndefined()
  })

  it('drill_start 本番: text に dry-run 含まない', () => {
    const btn = buildSlackQuickActionButton({
      kind: 'drill_start',
      metadata: makeMeta(),
      scenarioId: 'drill-1',
      dryRun: false,
    })
    expect(btn.text.text).toContain('drill-1')
    expect(btn.text.text).not.toContain('dry-run')
  })
})

// ============================================================================
// parse
// ============================================================================

describe('parseSlackQuickAction', () => {
  it('round-trip: build → parse で同じ payload', () => {
    const btn = buildSlackQuickActionButton({
      kind: 'kill_switch',
      metadata: makeMeta(),
      reason: 'test',
      graceSeconds: 30,
    })
    const parsed = parseSlackQuickAction(btn.value, btn.action_id, FIXED_NOW + 1_000)
    expect(parsed.kind).toBe('kill_switch')
    if (parsed.kind === 'kill_switch') {
      expect(parsed.reason).toBe('test')
      expect(parsed.graceSeconds).toBe(30)
    }
  })

  it('parse fail: invalid JSON throw', () => {
    expect(() =>
      parseSlackQuickAction('not-json', ACTION_ID_KILL_SWITCH, FIXED_NOW),
    ).toThrow(/invalid JSON/)
  })

  it('parse fail: action_id mismatch (cost_cap payload to kill_switch action_id)', () => {
    const btn = buildSlackQuickActionButton({
      kind: 'cost_cap',
      metadata: makeMeta(),
      newCapUsd: 100,
      reason: 'test',
    })
    expect(() =>
      parseSlackQuickAction(btn.value, ACTION_ID_KILL_SWITCH, FIXED_NOW + 1_000),
    ).toThrow(/action_id mismatch/)
  })

  it('parse fail: 期限切れ payload reject', () => {
    const btn = buildSlackQuickActionButton({
      kind: 'drill_start',
      metadata: makeMeta({ ttlMs: 1_000 }),
      scenarioId: 'drill-3',
      dryRun: true,
    })
    // FIXED_NOW + 5min 後で期限切れ (ttl=1s)
    expect(() =>
      parseSlackQuickAction(btn.value, ACTION_ID_DRILL_START, FIXED_NOW + 60_000),
    ).toThrow(/expired/)
  })

  it('parse fail: schema violation (missing reason for kill_switch)', () => {
    const meta = makeMeta()
    const bogus = JSON.stringify({ kind: 'kill_switch', metadata: meta })
    expect(() =>
      parseSlackQuickAction(bogus, ACTION_ID_KILL_SWITCH, FIXED_NOW + 1_000),
    ).toThrow()
  })
})

// ============================================================================
// metadata builder
// ============================================================================

describe('buildSlackQuickActionMetadata', () => {
  it('default TTL 5min, issuedAt < expiresAt', () => {
    const m = buildSlackQuickActionMetadata({
      projectId: 'PRJ-019',
      channelId: 'C1',
      actorUserId: 'U1',
      nowMs: FIXED_NOW,
    })
    const issued = Date.parse(m.issuedAt)
    const expires = Date.parse(m.expiresAt)
    expect(expires - issued).toBe(5 * 60 * 1000)
  })

  it('custom TTL 適用', () => {
    const m = buildSlackQuickActionMetadata({
      projectId: 'PRJ-019',
      channelId: 'C1',
      actorUserId: 'U1',
      nowMs: FIXED_NOW,
      ttlMs: 30_000,
    })
    expect(Date.parse(m.expiresAt) - Date.parse(m.issuedAt)).toBe(30_000)
  })

  it('nonce 自動生成: 32 字 hex (16 byte)', () => {
    const m = buildSlackQuickActionMetadata({
      projectId: 'PRJ-019',
      channelId: 'C1',
      actorUserId: 'U1',
      nowMs: FIXED_NOW,
    })
    expect(m.nonce).toMatch(/^[0-9a-f]{32}$/)
  })
})
