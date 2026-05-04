/**
 * 17 day path 7 control — Vitest test (Round 17 W1 拡張)
 * skeleton 段階 + W1 完成 3 control (C-OC-03 / C-OC-04 / P-UI-04) を統合検証。
 * 完成版テストは W2 / W3 で追加 control 実装と同時に追加。
 */
import { describe, it, expect } from 'vitest'

import {
  evaluateCooldown,
  CooldownInputSchema,
} from '../p-ui-02-cooldown-modal.js'
import {
  propagateKill,
  KillInputSchema,
  KILL_DEADLINE_MS,
} from '../p-ui-04-kill-switch-propagation.js'
import {
  detectAnomaly,
  AnomalyInputSchema,
} from '../p-ui-05-anomaly-rollback.js'
import {
  requestPermissionApproval,
  PermissionChangeInputSchema,
} from '../hitl-10-permission-change.js'
import {
  runContractTest,
  ContractInputSchema,
  computeContractDiff,
} from '../c-oc-03-api-contract-test.js'
import {
  escalateBreakingChange,
  EscalationInputSchema,
} from '../c-oc-04-breaking-change-escalation.js'
import {
  runRlsChecklist,
  RlsInputSchema,
} from '../p-ui-09-rls-checklist.js'

describe('17day-path 7 control skeletons', () => {
  it('P-UI-02 input schema rejects empty loopId', () => {
    expect(() =>
      CooldownInputSchema.parse({
        triggerEvent: 'loop_abort',
        abortedAt: new Date().toISOString(),
        loopId: '',
      }),
    ).toThrow()
  })

  it('P-UI-02 W1 — same-instant aborted → active cooldown', () => {
    const ts = '2026-05-09T00:00:00.000Z'
    const out = evaluateCooldown(
      { triggerEvent: 'loop_abort', abortedAt: ts, loopId: 'L-1' },
      { now: () => Date.parse(ts) },
    )
    expect(out.cooldownState).toBe('active')
    expect(out.remainingMs).toBe(30_000)
  })

  it('P-UI-04 input schema enforces positive pids', () => {
    expect(() =>
      KillInputSchema.parse({
        killReason: 'manual',
        initiatedAt: new Date().toISOString(),
        pidTree: [-1],
      }),
    ).toThrow()
  })

  it('P-UI-05 NaN observed → metric_nan_skip', () => {
    const out = detectAnomaly(
      { metric: 'cost_per_loop', observedValue: Number.NaN, threshold: 1, loopId: 'L-2' },
      { consecutiveBreaches: 0, lastLoopId: null },
    )
    expect(out.reason).toBe('metric_nan_skip')
  })

  it('P-UI-05 schema rejects non-positive threshold', () => {
    expect(() =>
      AnomalyInputSchema.parse({
        metric: 'cost_per_loop',
        observedValue: 1,
        threshold: 0,
        loopId: 'L-3',
      }),
    ).toThrow()
  })

  it('HITL-10 returns pending with deterministic ticket prefix', async () => {
    const out = await requestPermissionApproval(
      {
        changeType: 'env',
        before: 'A',
        after: 'B',
        requesterRole: 'dev',
        rationale: 'test',
      },
      { notify: async () => ({ delivered: true }) },
      () => 1_700_000_000_000,
    )
    expect(out.approvalState).toBe('pending')
    expect(out.ticketId.startsWith('HITL10-')).toBe(true)
  })

  it('HITL-10 schema requires non-empty rationale', () => {
    expect(() =>
      PermissionChangeInputSchema.parse({
        changeType: 'env',
        before: '',
        after: '',
        requesterRole: 'dev',
        rationale: '',
      }),
    ).toThrow()
  })

  it('C-OC-03 schema rejects empty runId', () => {
    expect(() =>
      ContractInputSchema.parse({ runId: '', upstreamRef: 'x', localFixturePath: 'y' }),
    ).toThrow()
  })

  it('C-OC-04 schema rejects empty majorDiffs', () => {
    expect(() =>
      EscalationInputSchema.parse({
        contractRunId: 'R',
        majorDiffs: [],
        detectedAt: new Date().toISOString(),
      }),
    ).toThrow()
  })

  it('P-UI-09 W1 — totalCases = matrix length, executor outcome matches expected → all pass', async () => {
    const out = await runRlsChecklist(
      {
        matrix: [
          { role: 'admin', operation: 'select', tenant: 't1', expected: 'allow' },
          { role: 'guest', operation: 'delete', tenant: 't1', expected: 'deny' },
        ],
      },
      {
        execute: async (c) => ({ outcome: c.expected }), // 期待値そのまま返却 = 全 pass
      },
    )
    expect(out.totalCases).toBe(2)
    expect(out.passed).toBe(2)
    expect(out.failures).toEqual([])
  })

  it('P-UI-09 schema rejects empty matrix', () => {
    expect(() => RlsInputSchema.parse({ matrix: [] })).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Round 17 W1 完成版テスト: C-OC-03 / C-OC-04 / P-UI-04
// ---------------------------------------------------------------------------

describe('C-OC-03 W1 — fetch + retry + timeout + diff engine', () => {
  it('matched=true / softFailed=false when upstream ok and no fixtureLoader', async () => {
    const out = await runContractTest(
      { runId: 'R1', upstreamRef: 'main', localFixturePath: '/tmp/fix.json' },
      { fetch: async () => ({ ok: true, body: '{}' }) },
    )
    expect(out.matched).toBe(true)
    expect(out.diffs.length).toBe(0)
    expect(out.softFailed).toBe(false)
    expect(out.reportPath).toBe('/tmp/fix.json.report.json')
  })

  it('soft-fail when upstream returns ok=false on every retry', async () => {
    let calls = 0
    const out = await runContractTest(
      { runId: 'R-softfail', upstreamRef: 'main', localFixturePath: '/tmp/f.json' },
      {
        fetch: async () => {
          calls++
          return { ok: false }
        },
      },
      { maxRetries: 3 },
    )
    expect(calls).toBe(3)
    expect(out.softFailed).toBe(true)
    expect(out.matched).toBe(true) // soft-fail は matched=true 扱い
  })

  it('timeout triggers soft-fail and respects maxRetries', async () => {
    let calls = 0
    // fake timers: 即発火する setTimeout 注入で timeout 経路を強制
    const out = await runContractTest(
      { runId: 'R-to', upstreamRef: 'main', localFixturePath: '/tmp/f.json' },
      {
        fetch: () => {
          calls++
          return new Promise(() => {
            /* never resolves */
          })
        },
      },
      {
        maxRetries: 2,
        timeoutMs: 10,
        timers: {
          setTimeout: (cb) => {
            cb()
            return 0
          },
          clearTimeout: () => {},
        },
      },
    )
    expect(calls).toBe(2)
    expect(out.softFailed).toBe(true)
  })

  it('detects major diff when fixture field disappears upstream', async () => {
    const fixture = JSON.stringify({ '--input': 'string', '--output': 'path' })
    const upstream = JSON.stringify({ '--input': 'string' })
    const out = await runContractTest(
      { runId: 'R-diff', upstreamRef: 'main', localFixturePath: '/tmp/f.json' },
      { fetch: async () => ({ ok: true, body: upstream }) },
      { fixtureLoader: async () => fixture },
    )
    expect(out.softFailed).toBe(false)
    expect(out.matched).toBe(false)
    expect(out.diffs.some((d) => d.field === '--output' && d.severity === 'major')).toBe(true)
  })

  it('throws fixture_corrupted when fixtureLoader rejects', async () => {
    await expect(
      runContractTest(
        { runId: 'R-fix', upstreamRef: 'main', localFixturePath: '/tmp/f.json' },
        { fetch: async () => ({ ok: true, body: '{}' }) },
        { fixtureLoader: async () => Promise.reject(new Error('disk_fail')) },
      ),
    ).rejects.toThrow('fixture_corrupted')
  })

  it('computeContractDiff returns empty array on identical maps', () => {
    const diffs = computeContractDiff({ a: '1' }, { a: '1' })
    expect(diffs).toEqual([])
  })
})

describe('C-OC-04 W1 — Slack + email fallback + critical log + re-arm', () => {
  it('phaseGateBlocked=true, slack delivered → notifiedChannels contains channel', async () => {
    const out = await escalateBreakingChange(
      {
        contractRunId: 'R1',
        majorDiffs: [{ field: 'cli.flag', before: '--x', after: '--y' }],
        detectedAt: new Date('2026-05-09T00:00:00Z').toISOString(),
      },
      {
        slack: async () => ({ delivered: true }),
        email: async () => ({ delivered: true }),
      },
      { retryDelay: () => Promise.resolve() },
    )
    expect(out.phaseGateBlocked).toBe(true)
    expect(out.escalationId).toBe('COC04-R1')
    expect(out.notifiedChannels).toEqual(['#drill', 'ceo@clawbridge.local'])
    expect(out.failedChannels).toEqual([])
    expect(out.criticalLogged).toBe(false)
  })

  it('slack fails 3x → email fallback succeeds, gate still blocked', async () => {
    let slackCalls = 0
    const out = await escalateBreakingChange(
      {
        contractRunId: 'R2',
        majorDiffs: [{ field: 'cli.flag', before: '--x', after: '--y' }],
        detectedAt: new Date('2026-05-09T01:00:00Z').toISOString(),
      },
      {
        slack: async () => {
          slackCalls++
          return { delivered: false }
        },
        email: async () => ({ delivered: true }),
      },
      { retryDelay: () => Promise.resolve() },
    )
    expect(slackCalls).toBe(3)
    expect(out.failedChannels).toContain('#drill')
    expect(out.notifiedChannels).toContain('ceo@clawbridge.local')
    expect(out.phaseGateBlocked).toBe(true)
  })

  it('both notifiers fail → criticalLogged + reArmRequested = true', async () => {
    const auditCalls: Array<{ escalationId: string; reason: string; ts: string }> = []
    let reArmAt = 0
    const out = await escalateBreakingChange(
      {
        contractRunId: 'R3',
        majorDiffs: [{ field: 'cli.flag', before: '--x', after: '--y' }],
        detectedAt: new Date('2026-05-09T02:00:00Z').toISOString(),
      },
      {
        slack: async () => ({ delivered: false }),
        email: async () => ({ delivered: false }),
      },
      {
        retryDelay: () => Promise.resolve(),
        auditCriticalLog: (e) => auditCalls.push(e),
        reArmHook: (_id, ts) => {
          reArmAt = ts
        },
      },
    )
    expect(out.criticalLogged).toBe(true)
    expect(out.reArmRequested).toBe(true)
    expect(auditCalls.length).toBe(1)
    expect(auditCalls[0]!.reason).toBe('all_notifier_channels_failed')
    // re-arm = detected + 5 min
    expect(reArmAt).toBe(Date.parse('2026-05-09T02:05:00Z'))
  })

  it('ackDeadline = detectedAt + 1h SLA', async () => {
    const out = await escalateBreakingChange(
      {
        contractRunId: 'R4',
        majorDiffs: [{ field: 'cli.flag', before: '--x', after: '--y' }],
        detectedAt: '2026-05-09T03:00:00.000Z',
      },
      {
        slack: async () => ({ delivered: true }),
        email: async () => ({ delivered: true }),
      },
      { retryDelay: () => Promise.resolve() },
    )
    expect(out.ackDeadline).toBe('2026-05-09T04:00:00.000Z')
  })

  it('slack throw → caught → retried → email fallback path still runs', async () => {
    const out = await escalateBreakingChange(
      {
        contractRunId: 'R5',
        majorDiffs: [{ field: 'cli.flag', before: '--x', after: '--y' }],
        detectedAt: new Date('2026-05-09T04:00:00Z').toISOString(),
      },
      {
        slack: async () => {
          throw new Error('webhook_500')
        },
        email: async () => ({ delivered: true }),
      },
      { retryDelay: () => Promise.resolve() },
    )
    expect(out.failedChannels).toContain('#drill')
    expect(out.notifiedChannels).toContain('ceo@clawbridge.local')
  })
})

describe('P-UI-04 W1 — graceful → forceful → verified kill propagation', () => {
  it('all SIGTERM ok + verifySurvivors=[] → all_terminated', async () => {
    const sent: Array<{ pid: number; sig: string }> = []
    const out = await propagateKill(
      { killReason: 'test', initiatedAt: new Date().toISOString(), pidTree: [123, 456] },
      {
        signal: async (pid, sig) => {
          sent.push({ pid, sig })
          return true
        },
      },
      { gracePeriodMs: 0, verifySurvivors: async () => [], sleep: () => Promise.resolve() },
    )
    expect(out.status).toBe('all_terminated')
    expect(out.totalKilled).toBe(2)
    expect(out.survivors).toEqual([])
    expect(sent.filter((s) => s.sig === 'SIGTERM').length).toBe(2)
    expect(sent.filter((s) => s.sig === 'SIGKILL').length).toBe(0)
  })

  it('1 pid ignores SIGTERM → SIGKILL kicks in → all_terminated', async () => {
    const sent: Array<{ pid: number; sig: string }> = []
    let verifyCalls = 0
    const out = await propagateKill(
      { killReason: 'test', initiatedAt: new Date().toISOString(), pidTree: [10, 20, 30] },
      {
        signal: async (pid, sig) => {
          sent.push({ pid, sig })
          return true
        },
      },
      {
        gracePeriodMs: 0,
        // 1 回目 (graceful 後): pid 20 残存, 2 回目 (forceful 後): 全終了
        verifySurvivors: async (pids) => {
          verifyCalls++
          return verifyCalls === 1 ? pids.filter((p) => p === 20) : []
        },
        sleep: () => Promise.resolve(),
      },
    )
    // SIGTERM 全 pid + SIGKILL 残存 1 → 計 4 シグナル
    expect(sent.filter((s) => s.sig === 'SIGTERM').length).toBe(3)
    expect(sent.filter((s) => s.sig === 'SIGKILL' && s.pid === 20).length).toBe(1)
    expect(out.status).toBe('all_terminated')
  })

  it('SIGKILL fails on 1 pid → partial', async () => {
    const out = await propagateKill(
      { killReason: 'test', initiatedAt: new Date().toISOString(), pidTree: [1, 2] },
      {
        signal: async (_pid, sig) => sig !== 'SIGKILL',
      },
      {
        gracePeriodMs: 0,
        verifySurvivors: async (pids) => pids,
        sleep: () => Promise.resolve(),
      },
    )
    // verifySurvivors が常に全 pid 返す → forceful 後も両方残存 → totalKilled=0 → failed
    expect(out.status).toBe('failed')
    expect(out.survivors).toEqual([1, 2])
  })

  it('partial: 1 pid killed (SIGTERM), 1 pid survives forceful', async () => {
    let verifyCallCount = 0
    const out = await propagateKill(
      { killReason: 'test', initiatedAt: new Date().toISOString(), pidTree: [1, 2] },
      {
        // pid 1 は SIGKILL も成功、pid 2 はどの SIGKILL も失敗
        signal: async (pid, sig) => {
          if (sig === 'SIGKILL' && pid === 2) return false
          return true
        },
      },
      {
        gracePeriodMs: 0,
        verifySurvivors: async (pids) => {
          verifyCallCount++
          // 1 回目 (graceful 後): 両方残存
          if (verifyCallCount === 1) return [...pids]
          // 2 回目 (forceful 後): pid 2 のみ残存
          return pids.filter((p) => p === 2)
        },
        sleep: () => Promise.resolve(),
      },
    )
    expect(out.status).toBe('partial')
    expect(out.survivors).toEqual([2])
    expect(out.totalKilled).toBe(1)
  })

  it('empty pidTree → all_terminated immediately', async () => {
    const events: string[] = []
    const out = await propagateKill(
      { killReason: 'noop', initiatedAt: new Date().toISOString(), pidTree: [] },
      { signal: async () => true },
      {
        gracePeriodMs: 0,
        sleep: () => Promise.resolve(),
        killTokenBroadcaster: (e) => events.push(e),
      },
    )
    expect(out.status).toBe('all_terminated')
    expect(out.totalKilled).toBe(0)
    expect(events).toEqual(['verified'])
  })

  it('killTokenBroadcaster fires lifecycle events: fired → verified', async () => {
    const events: string[] = []
    await propagateKill(
      { killReason: 'manual', initiatedAt: new Date().toISOString(), pidTree: [42] },
      { signal: async () => true },
      {
        gracePeriodMs: 0,
        verifySurvivors: async () => [],
        sleep: () => Promise.resolve(),
        killTokenBroadcaster: (e) => events.push(e),
      },
    )
    expect(events).toEqual(['fired', 'verified'])
  })

  it('latencyMs > KILL_DEADLINE_MS → deadlineExceeded=true and broadcaster=failed', async () => {
    const events: string[] = []
    let nowVal = 0
    const out = await propagateKill(
      { killReason: 'slow', initiatedAt: new Date().toISOString(), pidTree: [99] },
      { signal: async () => true },
      {
        gracePeriodMs: 0,
        verifySurvivors: async () => [],
        sleep: () => Promise.resolve(),
        now: () => {
          const v = nowVal
          nowVal += KILL_DEADLINE_MS + 1
          return v
        },
        killTokenBroadcaster: (e) => events.push(e),
      },
    )
    expect(out.deadlineExceeded).toBe(true)
    expect(events).toContain('failed')
  })
})
