/**
 * ban-drill.test — Round 7 W0-Week1 prefetch (G-07):
 *   BAN drill harness の単体テスト。
 *
 * カバー範囲:
 *   1. 3 シナリオ skeleton (id / durationMs / steps[]) が定義されている
 *   2. executeScenario が dryRun=true で全 step pass + audit log に 1 件記録される
 *   3. step 失敗 / SLA 違反でも後続 step は実行され、passed=false で集約される
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  banDrillScenario1,
  banDrillScenario2,
  banDrillScenario3,
  banDrillScenarios,
  executeScenario,
  type BanDrillScenario,
} from '../index.js'
import { FileAuditLogStore } from '@clawbridge/audit'

function tmpFile(): string {
  return join(
    tmpdir(),
    `clawbridge-bandrill-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    'audit-events.jsonl',
  )
}

describe('G-07: BAN drill scenarios skeleton', () => {
  it('3 scenarios are exported with correct ids and SLA-bearing steps', () => {
    expect(banDrillScenarios).toHaveLength(3)
    expect(banDrillScenario1.id).toBe('ban-drill-1')
    expect(banDrillScenario1.durationMs).toBe(90 * 60 * 1000)
    expect(banDrillScenario1.steps.length).toBeGreaterThanOrEqual(5)
    expect(banDrillScenario2.id).toBe('ban-drill-2')
    expect(banDrillScenario2.durationMs).toBe(60 * 60 * 1000)
    expect(banDrillScenario3.id).toBe('ban-drill-3')
    expect(banDrillScenario3.durationMs).toBe(45 * 60 * 1000)
    // 全 step が slaMs を持つ
    for (const sc of banDrillScenarios) {
      for (const st of sc.steps) {
        expect(typeof st.slaMs).toBe('number')
      }
    }
  })

  it('executeScenario in dryRun=true passes all steps + records 1 audit entry', async () => {
    const path = tmpFile()
    const audit = new FileAuditLogStore({
      filePath: path,
      rotation: { rotateOnAppend: false },
    })
    const r = await executeScenario(banDrillScenario1, { dryRun: true, audit })
    expect(r.passed).toBe(true)
    expect(r.steps).toHaveLength(banDrillScenario1.steps.length)
    expect(r.steps.every((s) => s.ok)).toBe(true)
    expect(r.steps.every((s) => s.slaViolated !== true)).toBe(true)
    const events = await audit.list({ type: 'ban_drill' })
    expect(events).toHaveLength(1)
    expect(events[0]?.payload['scenarioId']).toBe('ban-drill-1')
    expect(events[0]?.payload['passed']).toBe(true)
    try {
      await fs.rm(join(path, '..'), { recursive: true, force: true })
    } catch {
      // ignore
    }
  })

  it('step throw + SLA violation leave passed=false but later steps still run', async () => {
    const failingScenario: BanDrillScenario = {
      id: 'ban-drill-1',
      name: 'fail injection',
      durationMs: 60_000,
      steps: [
        {
          name: 'step-a-throws',
          run: async () => {
            throw new Error('boom')
          },
        },
        {
          name: 'step-b-sla-violation',
          slaMs: 1, // 1ms — 必ず違反
          run: async () => {
            await new Promise((r) => setTimeout(r, 30))
            return { ok: true }
          },
        },
        {
          name: 'step-c-passes',
          run: async () => true,
        },
      ],
    }
    const r = await executeScenario(failingScenario, { dryRun: true })
    expect(r.passed).toBe(false)
    expect(r.steps).toHaveLength(3)
    expect(r.steps[0]?.ok).toBe(false)
    expect(r.steps[0]?.error).toBe('boom')
    expect(r.steps[1]?.slaViolated).toBe(true)
    expect(r.steps[2]?.ok).toBe(true) // 後続も実行される
  })
})
