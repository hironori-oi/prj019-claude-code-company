/**
 * drill-2-real-wireup.test — Round 15 Dev-L 着地 (Task L-2, テスト):
 *   drill-2-real-wireup.ts の wire-up + integrity helper を検証 (8 tests)。
 *
 * 検証範囲:
 *   - createDrillRealWireupContext: audit-mock / audit-real 両モードで初期化成功
 *   - appendScenarioStandardSequence: 2 件 (spawn_start + spawn_exit) を append
 *   - verifyDrillHashChainIntegrity: chain valid / brokenAt null / countsMatch
 *   - tampering 検出: real audit 物理ファイル書換 → brokenAt 検出
 *   - verifyDrillG12NotFiring: 'live' mode で notFiring=true、'dry' mode で fired
 *   - disposeDrillRealWireupContext: scratch dir 削除
 *
 * 純関数性: 全 helper は DI 経由で動作、test は tmp dir に閉じる (drill-2 想定の副作用ゼロ要件)。
 */
import { describe, it, expect } from 'vitest'
import { promises as fs } from 'node:fs'

import {
  appendScenarioStandardSequence,
  createDrillRealWireupContext,
  disposeDrillRealWireupContext,
  verifyDrillG12NotFiring,
  verifyDrillHashChainIntegrity,
} from './drill-2-real-wireup.js'

describe('drill-2-real-wireup / createDrillRealWireupContext (R15 Dev-L)', () => {
  it('1. audit-mock mode: in-memory store + descriptor.mode=mock', async () => {
    const ctx = await createDrillRealWireupContext({ mode: 'audit-mock' })
    try {
      expect(ctx.mode).toBe('audit-mock')
      expect(ctx.auditFilePath).toBeNull()
      expect(ctx.descriptor.mode).toBe('mock')
      expect(ctx.descriptor.bridgeProgress).toBe(1)
      expect(ctx.dryRunGuard.mode).toBe('live')
      expect(ctx.startedAtIso).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    } finally {
      await disposeDrillRealWireupContext(ctx)
    }
  })

  it('2. audit-real mode: FileAuditLogStore + descriptor.mode=drill + filePath 物理生成', async () => {
    const ctx = await createDrillRealWireupContext({ mode: 'audit-real' })
    try {
      expect(ctx.mode).toBe('audit-real')
      expect(ctx.auditFilePath).not.toBeNull()
      expect(ctx.descriptor.mode).toBe('drill')
      expect(ctx.descriptor.filePath).toBe(ctx.auditFilePath)
      // file 自体は append まで作られないが、parent dir は生成済
      const parentDir = ctx.auditFilePath!.replace(/[\\/][^\\/]+$/, '')
      const parentStat = await fs.stat(parentDir)
      expect(parentStat.isDirectory()).toBe(true)
    } finally {
      await disposeDrillRealWireupContext(ctx)
    }
  })
})

describe('drill-2-real-wireup / appendScenarioStandardSequence (R15 Dev-L)', () => {
  it('3. mock mode: spawn_start + spawn_exit の 2 件 append、id 連番', async () => {
    const ctx = await createDrillRealWireupContext({ mode: 'audit-mock' })
    try {
      const ids = await appendScenarioStandardSequence(ctx, 'normal', {
        pid: 1234,
        exitCode: 0,
        exitSignal: null,
        aborted: false,
      })
      expect(ids).toHaveLength(2)
      expect(ids[0]?.id).toBe(1)
      expect(ids[1]?.id).toBe(2)
      const all = await ctx.audit.list({})
      expect(all).toHaveLength(2)
      expect(all[0]?.payload).toMatchObject({
        scenario: 'normal',
        stage: 'spawn_start',
      })
      expect(all[1]?.payload).toMatchObject({
        scenario: 'normal',
        stage: 'spawn_exit',
      })
    } finally {
      await disposeDrillRealWireupContext(ctx)
    }
  })

  it('4. abort 経路: spawn_aborted で type=kill_switch', async () => {
    const ctx = await createDrillRealWireupContext({ mode: 'audit-mock' })
    try {
      await appendScenarioStandardSequence(ctx, 'kill_switch_trigger', {
        pid: 1,
        exitCode: null,
        exitSignal: 'SIGTERM',
        aborted: true,
        note: 'drill timeout',
      })
      const all = await ctx.audit.list({})
      expect(all).toHaveLength(2)
      expect(all[1]?.type).toBe('kill_switch')
      expect(all[1]?.payload).toMatchObject({
        scenario: 'kill_switch_trigger',
        stage: 'spawn_aborted',
        exitSignal: 'SIGTERM',
      })
    } finally {
      await disposeDrillRealWireupContext(ctx)
    }
  })
})

describe('drill-2-real-wireup / verifyDrillHashChainIntegrity (R15 Dev-L)', () => {
  it('5. mock mode: 9 シナリオ × 2 件 = 18 entry append → chain valid + countsMatch', async () => {
    const ctx = await createDrillRealWireupContext({ mode: 'audit-mock' })
    try {
      const scenarios = [
        'normal',
        'kill_switch_trigger',
        'cost_cap_trigger',
        'rate_spike',
        'heartbeat_gap',
        'clock_skew',
        'multi_process_collision',
        'slack_quick_action',
        'audit_log_tampering',
      ] as const
      for (const s of scenarios) {
        await appendScenarioStandardSequence(ctx, s, {
          pid: 100,
          exitCode: 0,
          exitSignal: null,
          aborted: false,
        })
      }
      const r = await verifyDrillHashChainIntegrity(ctx, 18)
      expect(r.chainValid).toBe(true)
      expect(r.brokenAt).toBeNull()
      expect(r.totalChecked).toBe(18)
      expect(r.appendedCount).toBe(18)
      expect(r.countsMatch).toBe(true)
      expect(r.diagnostics).toHaveLength(0)
    } finally {
      await disposeDrillRealWireupContext(ctx)
    }
  })

  it('6. real mode + 物理ファイル tampering: brokenAt が null 以外', async () => {
    const ctx = await createDrillRealWireupContext({ mode: 'audit-real' })
    try {
      // 4 件 append (2 シナリオ x 2 entry)
      await appendScenarioStandardSequence(ctx, 'normal', {
        pid: 1,
        exitCode: 0,
        exitSignal: null,
        aborted: false,
      })
      await appendScenarioStandardSequence(ctx, 'cost_cap_trigger', {
        pid: 2,
        exitCode: null,
        exitSignal: 'SIGTERM',
        aborted: true,
      })
      // chain 健全性確認
      const ok = await verifyDrillHashChainIntegrity(ctx, 4)
      expect(ok.chainValid).toBe(true)
      expect(ok.appendedCount).toBe(4)

      // 物理ファイル直書換で 2 行目を tampering (id=2 の payload を改竄)
      const raw = await fs.readFile(ctx.auditFilePath!, 'utf8')
      const lines = raw.split('\n')
      // id=2 の行を find して payload を rewrite
      const lineIndex = lines.findIndex((l) => l.includes('"id":2'))
      expect(lineIndex).toBeGreaterThanOrEqual(0)
      lines[lineIndex] = lines[lineIndex]!.replace(
        '"stage":"spawn_exit"',
        '"stage":"TAMPERED"',
      )
      await fs.writeFile(ctx.auditFilePath!, lines.join('\n'), 'utf8')

      const broken = await verifyDrillHashChainIntegrity(ctx, 4)
      expect(broken.chainValid).toBe(false)
      expect(broken.brokenAt).not.toBeNull()
      expect(broken.diagnostics.some((d) => d.includes('hash chain broken'))).toBe(
        true,
      )
    } finally {
      await disposeDrillRealWireupContext(ctx)
    }
  })

  it('7. expectedAppendedCount mismatch を診断', async () => {
    const ctx = await createDrillRealWireupContext({ mode: 'audit-mock' })
    try {
      await appendScenarioStandardSequence(ctx, 'normal', {
        pid: 1,
        exitCode: 0,
        exitSignal: null,
        aborted: false,
      })
      // 2 件 append したが 5 件期待で呼ぶ
      const r = await verifyDrillHashChainIntegrity(ctx, 5)
      expect(r.chainValid).toBe(true)
      expect(r.countsMatch).toBe(false)
      expect(
        r.diagnostics.some((d) => d.includes('appended count mismatch')),
      ).toBe(true)
    } finally {
      await disposeDrillRealWireupContext(ctx)
    }
  })
})

describe('drill-2-real-wireup / verifyDrillG12NotFiring (R15 Dev-L)', () => {
  it('8. live mode (drill 既定): notFiring=true、blockedCount=0', async () => {
    const ctx = await createDrillRealWireupContext({ mode: 'audit-mock' })
    try {
      const r = await verifyDrillG12NotFiring(ctx)
      expect(r.notFiring).toBe(true)
      expect(r.mode).toBe('live')
      expect(r.recordedCount).toBe(1)
      expect(r.blockedCount).toBe(0)
      expect(r.diagnostics).toHaveLength(0)
    } finally {
      await disposeDrillRealWireupContext(ctx)
    }
  })

  it('9. dry mode (誤起動シミュレート): notFiring=false、警告 diagnostics + blockedCount>0', async () => {
    // dryRunMode='dry' を強制注入 (drill モード逸脱検出のシミュレート)
    const ctx = await createDrillRealWireupContext({
      mode: 'audit-mock',
      dryRunMode: 'dry',
    })
    try {
      const r = await verifyDrillG12NotFiring(ctx)
      expect(r.notFiring).toBe(false)
      expect(r.mode).toBe('dry')
      expect(r.diagnostics.length).toBeGreaterThan(0)
      expect(r.diagnostics.some((d) => d.includes("'live'"))).toBe(true)
    } finally {
      await disposeDrillRealWireupContext(ctx)
    }
  })
})

describe('drill-2-real-wireup / disposeDrillRealWireupContext (R15 Dev-L)', () => {
  it('10. scratch dir 削除 + idempotent (2 回呼んで throw しない)', async () => {
    const ctx = await createDrillRealWireupContext({ mode: 'audit-mock' })
    const sd = ctx.scratchDir
    await fs.access(sd)
    await disposeDrillRealWireupContext(ctx)
    await expect(fs.access(sd)).rejects.toThrow()
    // 2 回目: throw しない
    await expect(disposeDrillRealWireupContext(ctx)).resolves.toBeUndefined()
  })
})
