/**
 * dispatcher.test — Round 9 案 9-A1 前倒し (CB-D-W3-03):
 *   Open Claw → CEO dispatcher の単体テスト。
 *
 * カバー範囲 (8+ tests):
 *   1. happy path - 全 sink 成功 → status='all_succeeded'
 *   2. retry - sink throw 1 回 → 2 回目で成功 → ok:true / attempts=2
 *   3. retry exhaustion - 全 retry throw → ok:false / attempts=3
 *   4. invalid schema - 即座に 'invalid' return / sinkOutcomes 空
 *   5. partial failure - audit 成功 / dashboard 失敗 → 'partial_failure'
 *   6. no_sinks - sinks 全部未注入 → 'no_sinks'
 *   7. audit log injection - audit sink が deliver 受信内容を保持
 *   8. TimeSource decoupling - FakeTimeSource で sleep を 0ms に圧縮
 *   9. fixed sink ordering - auditLog → hitlGate → slackNotify → dashboard → extras 順
 *   10. sink ok:false 戻り - retry 対象、最終的に ok:false で報告
 */
import { describe, it, expect } from 'vitest'

import {
  dispatchToCeo,
  type DispatcherTimeSource,
  type DispatchSink,
  type DispatchSinks,
} from '../dispatcher.js'
import type { OpenclawToCeoMessage } from '../openclaw-to-ceo.schema.js'

const baseHeader = {
  messageId: 'msg-001',
  sentAt: '2026-05-04T12:00:00.000Z',
  openclawTraceId: 'trace-001',
}

function validProgressMessage(): OpenclawToCeoMessage {
  return {
    ...baseHeader,
    messageType: 'progress_update',
    progressPercent: 50,
    phase: 'running',
    costSoFarUsd: 1.0,
    summary: 'halfway',
  }
}

function validProposalMessage(): OpenclawToCeoMessage {
  return {
    ...baseHeader,
    messageType: 'needs_proposal',
    proposal: {
      proposalId: 'kickoff-001',
      projectSummary:
        'TypeScript SaaS のためのニッチ B2B ツールを Phase 1 で構築する案件',
      estimatedValue: 'B2B 中小企業 100 社獲得想定',
      estimatedCostUsd: 12.5,
      estimatedEffortDays: 14,
      knowledgeRefs: ['PRJ-019'],
      riskAssessment: 'ToS gray 領域 30-60% リスク',
      ownerQuestions: ['Q1?'],
    },
    scoutRef: {
      scoutRunId: 'scout-1',
      candidateId: 'c-1',
      candidateScore: 80,
      licenseCheckRequired: true,
    },
  }
}

/** TimeSource を 0ms 圧縮した fake (テスト高速化) */
const fastTimeSource: DispatcherTimeSource = {
  sleep: () => Promise.resolve(),
}

/** 成功 sink factory */
function successSink(name: string, meta?: Record<string, unknown>): DispatchSink & {
  received: OpenclawToCeoMessage[]
} {
  const received: OpenclawToCeoMessage[] = []
  return {
    name,
    received,
    deliver: async (msg) => {
      received.push(msg)
      return { ok: true, ...(meta !== undefined && { meta }) }
    },
  }
}

/** N 回 throw した後成功する sink */
function flakySink(
  name: string,
  throwCount: number,
): DispatchSink & { attempts: number } {
  const wrapper: DispatchSink & { attempts: number } = {
    name,
    attempts: 0,
    deliver: async () => {
      wrapper.attempts += 1
      if (wrapper.attempts <= throwCount) {
        throw new Error(`flaky-sink-${name} attempt ${wrapper.attempts}`)
      }
      return { ok: true }
    },
  }
  return wrapper
}

/** 常に throw する sink */
function alwaysThrowSink(name: string): DispatchSink & { attempts: number } {
  const wrapper: DispatchSink & { attempts: number } = {
    name,
    attempts: 0,
    deliver: async () => {
      wrapper.attempts += 1
      throw new Error(`always-throw-${name}`)
    },
  }
  return wrapper
}

/** 常に ok:false を返す sink */
function alwaysFalseSink(name: string): DispatchSink & { attempts: number } {
  const wrapper: DispatchSink & { attempts: number } = {
    name,
    attempts: 0,
    deliver: async () => {
      wrapper.attempts += 1
      return { ok: false, meta: { reason: 'simulated failure' } }
    },
  }
  return wrapper
}

describe('dispatchToCeo (CB-D-W3-03)', () => {
  it('1. happy path - 全 sink 成功 → status=all_succeeded', async () => {
    const auditLog = successSink('audit', { auditId: 42 })
    const dashboard = successSink('dashboard')
    const sinks: DispatchSinks = { auditLog, dashboard }
    const result = await dispatchToCeo(validProgressMessage(), sinks, {
      timeSource: fastTimeSource,
    })
    expect(result.status).toBe('all_succeeded')
    expect(result.messageType).toBe('progress_update')
    expect(result.sinkOutcomes).toHaveLength(2)
    expect(result.sinkOutcomes[0]?.sinkName).toBe('audit')
    expect(result.sinkOutcomes[0]?.ok).toBe(true)
    expect(result.sinkOutcomes[0]?.attempts).toBe(1)
    expect(result.sinkOutcomes[0]?.ackMeta).toEqual({ auditId: 42 })
    expect(auditLog.received).toHaveLength(1)
    expect(dashboard.received).toHaveLength(1)
  })

  it('2. retry - sink throw 1 回 → 2 回目で成功', async () => {
    const flaky = flakySink('audit', 1)
    const sinks: DispatchSinks = { auditLog: flaky }
    const result = await dispatchToCeo(validProgressMessage(), sinks, {
      timeSource: fastTimeSource,
    })
    expect(result.status).toBe('all_succeeded')
    expect(result.sinkOutcomes[0]?.ok).toBe(true)
    expect(result.sinkOutcomes[0]?.attempts).toBe(2)
    expect(flaky.attempts).toBe(2)
  })

  it('3. retry exhaustion - 全 retry throw → ok:false / attempts=3', async () => {
    const dead = alwaysThrowSink('audit')
    const sinks: DispatchSinks = { auditLog: dead }
    const result = await dispatchToCeo(validProgressMessage(), sinks, {
      maxRetries: 3,
      timeSource: fastTimeSource,
    })
    expect(result.status).toBe('all_failed')
    expect(result.sinkOutcomes[0]?.ok).toBe(false)
    expect(result.sinkOutcomes[0]?.attempts).toBe(3)
    expect(result.sinkOutcomes[0]?.errorMessage).toMatch(/always-throw/)
    expect(dead.attempts).toBe(3)
  })

  it('4. invalid schema - 即座に invalid return / sinkOutcomes 空', async () => {
    const audit = successSink('audit')
    const sinks: DispatchSinks = { auditLog: audit }
    const result = await dispatchToCeo(
      { messageType: 'unknown_type', foo: 'bar' },
      sinks,
      { timeSource: fastTimeSource },
    )
    expect(result.status).toBe('invalid')
    expect(result.schemaErrors).toBeDefined()
    expect(result.schemaErrors!.length).toBeGreaterThan(0)
    expect(result.sinkOutcomes).toHaveLength(0)
    expect(audit.received).toHaveLength(0)
  })

  it('5. partial_failure - audit 成功 / dashboard 失敗', async () => {
    const audit = successSink('audit')
    const dashboard = alwaysThrowSink('dashboard')
    const sinks: DispatchSinks = { auditLog: audit, dashboard }
    const result = await dispatchToCeo(validProgressMessage(), sinks, {
      maxRetries: 2,
      timeSource: fastTimeSource,
    })
    expect(result.status).toBe('partial_failure')
    expect(result.sinkOutcomes).toHaveLength(2)
    expect(result.sinkOutcomes.find((o) => o.sinkName === 'audit')?.ok).toBe(true)
    expect(result.sinkOutcomes.find((o) => o.sinkName === 'dashboard')?.ok).toBe(false)
  })

  it('6. no_sinks - 何も注入しない → no_sinks', async () => {
    const result = await dispatchToCeo(validProgressMessage(), {}, {
      timeSource: fastTimeSource,
    })
    expect(result.status).toBe('no_sinks')
    expect(result.sinkOutcomes).toHaveLength(0)
  })

  it('7. audit log injection - audit sink が deliver 受信内容を保持', async () => {
    const audit = successSink('audit', { auditId: 99 })
    const sinks: DispatchSinks = { auditLog: audit }
    const proposal = validProposalMessage()
    await dispatchToCeo(proposal, sinks, { timeSource: fastTimeSource })
    expect(audit.received).toHaveLength(1)
    expect(audit.received[0]?.messageType).toBe('needs_proposal')
    if (audit.received[0]?.messageType === 'needs_proposal') {
      expect(audit.received[0].proposal.proposalId).toBe('kickoff-001')
    }
  })

  it('8. TimeSource decoupling - FakeTimeSource で sleep 呼出回数を捕捉', async () => {
    let sleepCalls = 0
    const fake: DispatcherTimeSource = {
      sleep: () => {
        sleepCalls += 1
        return Promise.resolve()
      },
    }
    const flaky = flakySink('audit', 2) // 2 回 throw → 3 回目で成功
    const sinks: DispatchSinks = { auditLog: flaky }
    const result = await dispatchToCeo(validProgressMessage(), sinks, {
      maxRetries: 3,
      timeSource: fake,
    })
    expect(result.status).toBe('all_succeeded')
    // 失敗 attempt 後に 1 回ずつ sleep するので 2 回 sleep
    expect(sleepCalls).toBe(2)
  })

  it('9. fixed sink ordering - auditLog → hitlGate → slackNotify → dashboard → extras', async () => {
    const callOrder: string[] = []
    const make = (name: string): DispatchSink => ({
      name,
      deliver: async () => {
        callOrder.push(name)
        return { ok: true }
      },
    })
    const sinks: DispatchSinks = {
      auditLog: make('audit'),
      hitlGate: make('hitl'),
      slackNotify: make('slack'),
      dashboard: make('dashboard'),
      extras: [make('extra-1'), make('extra-2')],
    }
    await dispatchToCeo(validProgressMessage(), sinks, {
      timeSource: fastTimeSource,
    })
    expect(callOrder).toEqual([
      'audit',
      'hitl',
      'slack',
      'dashboard',
      'extra-1',
      'extra-2',
    ])
  })

  it('10. sink ok:false 戻り - retry 対象、最終的に ok:false', async () => {
    const stub = alwaysFalseSink('audit')
    const sinks: DispatchSinks = { auditLog: stub }
    const result = await dispatchToCeo(validProgressMessage(), sinks, {
      maxRetries: 2,
      timeSource: fastTimeSource,
    })
    expect(result.status).toBe('all_failed')
    expect(result.sinkOutcomes[0]?.ok).toBe(false)
    expect(result.sinkOutcomes[0]?.attempts).toBe(2)
    expect(result.sinkOutcomes[0]?.ackMeta).toEqual({ reason: 'simulated failure' })
    expect(stub.attempts).toBe(2)
  })
})
