/**
 * mock-claw-flow.test — Round 10 R10 Dev-γ 前倒し:
 *   mock-claw e2e full flow scaffold (1 round-trip) のテスト。
 *
 * カバー範囲 (8 tests):
 *   1. happy path - 全 stage ok=true、overallOk=true、audit chain valid
 *   2. ceo inbox accumulation - dispatch 後 inbox.size >= 1, lastMessageType='needs_proposal'
 *   3. audit chain integrity - 2 sink fan-out (audit + dashboard)、verifyHashChain valid
 *   4. force kill trigger - cost cap > $30 driven kill-switch.trigger / monitor:cost-cap-breach event
 *   5. ceo sink retry - failNthAttempt=1 (1 回目失敗 → 2 回目成功) で attempts=2、status='all_succeeded'
 *   6. recovery - kill 発火後 disarm + reset で canResume=true / monitorResetVerified=true
 *   7. needs_scout reject path - rejected[] が含まれても dispatch 続行 (top-1 採用)
 *   8. determinism - 同一入力で 2 回実行して dispatchResult.status / inbox.size が一致
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promises as fs } from 'node:fs'

import { runMockClawE2eFlow } from '../flow/run-mock-claw-flow.js'
import { HN_FIXTURE_HITS } from '../fixtures/hn-fixture.js'

let auditPath: string

beforeEach(async () => {
  auditPath = join(tmpdir(), `clawbridge-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`)
  // pre-clean if exists
  try {
    await fs.unlink(auditPath)
  } catch {
    // not exist OK
  }
})

describe('mock-claw e2e full flow (R10 Dev-γ / CB-D-W4-01 統合)', () => {
  it('1. happy path - 全 stage ok=true / overallOk=true / audit chain valid', async () => {
    const r = await runMockClawE2eFlow({ auditFilePath: auditPath })
    expect(r.overallOk).toBe(true)
    expect(r.stages).toHaveLength(7)
    for (const s of r.stages) {
      expect(s.ok, `stage ${s.stage} failed: ${s.errorMessage ?? '<none>'}`).toBe(true)
    }
    expect(r.auditVerify.valid).toBe(true)
    expect(r.auditVerify.totalChecked).toBeGreaterThan(0)
    expect(r.scoutResult.meta.licenseCheckRequired).toBe(true)
  })

  it('2. ceo inbox accumulation - dispatch 後 inbox.size >= 1', async () => {
    const r = await runMockClawE2eFlow({ auditFilePath: auditPath })
    expect(r.ceoInbox.size).toBeGreaterThanOrEqual(1)
    const last = r.ceoInbox.last()
    expect(last).toBeDefined()
    expect(last!.message.messageType).toBe('needs_proposal')
    expect(last!.ackId).toBeGreaterThan(0)
  })

  it('3. audit chain integrity - 2 sink fan-out / verifyHashChain valid', async () => {
    const r = await runMockClawE2eFlow({ auditFilePath: auditPath })
    expect(r.dispatchResult.status).toBe('all_succeeded')
    // 2 sinks: auditLog + dashboard
    expect(r.dispatchResult.sinkOutcomes.length).toBe(2)
    const names = r.dispatchResult.sinkOutcomes.map((o) => o.sinkName).sort()
    expect(names).toEqual(['audit-log', 'ceo-mock-inbox'])
    expect(r.auditVerify.valid).toBe(true)
    expect(r.auditVerify.brokenAt).toBeNull()
  })

  it('4. force kill trigger - cost cap > $30 → monitor:cost-cap-breach event + kill triggered', async () => {
    const r = await runMockClawE2eFlow({
      auditFilePath: auditPath,
      forceKillTrigger: true,
      evaluateCostCap: true,
    })
    expect(r.killTriggered).toBe(true)
    const killStage = r.stages.find((s) => s.stage === 'kill_switch')
    expect(killStage).toBeDefined()
    expect(killStage!.ok).toBe(true)
    // tos-monitor が cost-cap-breach event を emit していること
    const types = r.tosEvents.map((e) => e.type)
    expect(types).toContain('monitor:cost-cap-breach')
  })

  it('5. ceo sink retry - failNthAttempt=1 → 2 回目成功 / attempts=2 / status=all_succeeded', async () => {
    const r = await runMockClawE2eFlow({
      auditFilePath: auditPath,
      ceoSinkFailNthAttempt: 1,
    })
    expect(r.dispatchResult.status).toBe('all_succeeded')
    const ceo = r.dispatchResult.sinkOutcomes.find((o) => o.sinkName === 'ceo-mock-inbox')
    expect(ceo).toBeDefined()
    expect(ceo!.ok).toBe(true)
    expect(ceo!.attempts).toBe(2)
  })

  it('6. recovery - kill 発火後 disarm + reset で canResume=true', async () => {
    const r = await runMockClawE2eFlow({
      auditFilePath: auditPath,
      forceKillTrigger: true,
    })
    expect(r.recovery.canResume).toBe(true)
    expect(r.recovery.monitorResetVerified).toBe(true)
    const recoveryStage = r.stages.find((s) => s.stage === 'recovery')
    expect(recoveryStage!.ok).toBe(true)
  })

  it('7. needs_scout reject path - 13 領域候補が rejected[] でも dispatch 続行', async () => {
    const r = await runMockClawE2eFlow({
      auditFilePath: auditPath,
      hnHits: [
        ...HN_FIXTURE_HITS,
        {
          objectID: 'medical-reject-1',
          title: 'AI clinical diagnosis assistant',
          url: 'https://example.com/diag',
          points: 999,
          num_comments: 999,
          created_at: '2026-05-04T11:00:00.000Z',
          story_text: 'ai diagnosis tool for clinical decision medical',
        },
      ],
    })
    expect(r.scoutResult.rejected.length).toBeGreaterThanOrEqual(1)
    expect(r.scoutResult.accepted.length).toBeGreaterThanOrEqual(1)
    expect(r.dispatchResult.status).toBe('all_succeeded')
    expect(r.overallOk).toBe(true)
  })

  it('8. determinism - 同一入力で 2 回実行して dispatch status / inbox size 一致', async () => {
    const auditPath1 = auditPath + '-a'
    const auditPath2 = auditPath + '-b'
    const r1 = await runMockClawE2eFlow({ auditFilePath: auditPath1 })
    const r2 = await runMockClawE2eFlow({ auditFilePath: auditPath2 })
    expect(r1.dispatchResult.status).toBe(r2.dispatchResult.status)
    expect(r1.ceoInbox.size).toBe(r2.ceoInbox.size)
    expect(r1.scoutResult.accepted.length).toBe(r2.scoutResult.accepted.length)
    expect(r1.scoutResult.accepted[0]?.id).toBe(r2.scoutResult.accepted[0]?.id)
  })
})
