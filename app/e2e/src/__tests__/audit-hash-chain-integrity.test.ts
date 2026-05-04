/**
 * audit-hash-chain-integrity.test — Round 11 R11 Dev-C 拡張 (DEC-019-057):
 *   既存 audit パッケージ (Round 7 着地) の hash chain (G-10) を e2e 7 段で順次 append し、
 *   chain integrity 検証 + tampering detection を網羅する。
 *
 * 関連必須コントロール:
 *   G-09 (HITL gate enforcement の audit 連携)
 *   G-10 (90 日 retention + SHA-256 hash chain)
 *
 * 設計原則:
 *   - audit パッケージ無改変。FileAuditLogStore.append / verifyHashChain / list を import で利用。
 *   - 各 stage の outcome を 1 entry として append し、最終段で chain 全体を検証。
 *   - tampering test では物理ファイルを直接書換、verifyHashChain.brokenAt で検出を確認。
 *   - 副作用は tmp dir 内に閉じる (G-12 dry-run 原則の e2e 適用)。
 *
 * カバー範囲 (8 tests):
 *   1. 7 段順次 append → chain valid / totalChecked=7
 *   2. genesis entry (id=1) prevHash="" / 残りは前段 hash と一致
 *   3. computeHash recompute = stored hash (全 entry)
 *   4. mid-chain tampering (id=4 payload 改竄) → brokenAt=4
 *   5. tail tampering (id=7 hash 改竄) → brokenAt=7
 *   6. genesis tampering (id=1 type 改竄) → brokenAt=1
 *   7. list filter by source (orchestrator のみ抽出) で 7 件保持
 *   8. 同一入力 2 回実行で同一 hash 列 (determinism)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  FileAuditLogStore,
  computeHash,
  type AuditEvent,
  type AuditEventType,
  type AuditEventSource,
} from '../../../audit/src/index.js'
import { runMockClawE2eFlow } from '../flow/run-mock-claw-flow.js'

let auditPath: string
let scratchDir: string

beforeEach(async () => {
  scratchDir = join(
    tmpdir(),
    `clawbridge-r11c-audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
  await fs.mkdir(scratchDir, { recursive: true })
  auditPath = join(scratchDir, 'audit-events.jsonl')
})

afterEach(async () => {
  try {
    await fs.rm(scratchDir, { recursive: true, force: true })
  } catch {
    // ignore
  }
})

/**
 * 7 stage の outcome を順次 append する helper。
 * audit パッケージは変更せず、新規 store instance に対して append のみ呼ぶ。
 */
async function appendStageOutcomes(
  store: FileAuditLogStore,
  ts0Iso: string,
): Promise<readonly { stage: string; id: number; hash: string }[]> {
  const baseMs = Date.parse(ts0Iso)
  const stageNames = [
    'needs_scout',
    'dispatch',
    'ceo_receive',
    'tos_check',
    'kill_switch',
    'audit_chain',
    'recovery',
  ] as const
  const out: { stage: string; id: number; hash: string }[] = []
  for (let i = 0; i < stageNames.length; i += 1) {
    const stage = stageNames[i] as string
    // stage を audit event type にマップ (5 種許容: spawn/spawn_timeout/kill_switch/hitl_decision/ban_drill/other)
    const type: AuditEventType =
      stage === 'kill_switch' ? 'kill_switch' : stage === 'recovery' ? 'hitl_decision' : 'other'
    const source: AuditEventSource = 'orchestrator'
    const ts = new Date(baseMs + i * 1000).toISOString()
    const r = await store.append({
      type,
      source,
      payload: { stage, idx: i + 1, ok: true },
      ts,
    })
    out.push({ stage, id: r.id, hash: r.hash })
  }
  return out
}

describe('audit hash chain integrity (R11 Dev-C / DEC-019-057 / G-10)', () => {
  it('1. 7 段順次 append → chain valid / totalChecked=7', async () => {
    const store = new FileAuditLogStore({
      filePath: auditPath,
      rotation: { rotateOnAppend: false },
    })
    const stages = await appendStageOutcomes(store, '2026-05-04T12:00:00.000Z')
    expect(stages).toHaveLength(7)
    expect(stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7])

    const verify = await store.verifyHashChain()
    expect(verify.valid).toBe(true)
    expect(verify.brokenAt).toBeNull()
    expect(verify.totalChecked).toBe(7)
  })

  it('2. genesis entry prevHash="" / 後続 entry prevHash = 前段 hash', async () => {
    const store = new FileAuditLogStore({
      filePath: auditPath,
      rotation: { rotateOnAppend: false },
    })
    await appendStageOutcomes(store, '2026-05-04T12:00:00.000Z')
    const list = await store.list()
    expect(list).toHaveLength(7)
    expect(list[0]?.prevHash).toBe('')
    for (let i = 1; i < list.length; i += 1) {
      expect(list[i]?.prevHash).toBe(list[i - 1]?.hash)
    }
  })

  it('3. computeHash 再計算 = stored hash (全 7 entry)', async () => {
    const store = new FileAuditLogStore({
      filePath: auditPath,
      rotation: { rotateOnAppend: false },
    })
    await appendStageOutcomes(store, '2026-05-04T12:00:00.000Z')
    const list = await store.list()
    let prev = ''
    for (const e of list) {
      const recomputed = computeHash({
        prevHash: prev,
        ts: e.ts,
        type: e.type,
        source: e.source,
        payload: e.payload,
        id: e.id,
      })
      expect(recomputed).toBe(e.hash)
      prev = e.hash
    }
  })

  it('4. mid-chain tampering (id=4 payload 改竄) → brokenAt=4', async () => {
    const store = new FileAuditLogStore({
      filePath: auditPath,
      rotation: { rotateOnAppend: false },
    })
    await appendStageOutcomes(store, '2026-05-04T12:00:00.000Z')
    // physical 書換: id=4 の payload を改竄
    const raw = await fs.readFile(auditPath, 'utf-8')
    const lines = raw.trim().split('\n')
    const e4 = JSON.parse(lines[3] ?? '{}') as AuditEvent
    e4.payload = { stage: 'tos_check', idx: 4, ok: false, tampered: true }
    lines[3] = JSON.stringify(e4)
    await fs.writeFile(auditPath, lines.join('\n') + '\n', 'utf-8')

    const verify = await store.verifyHashChain()
    expect(verify.valid).toBe(false)
    expect(verify.brokenAt).toBe(4)
    expect(verify.totalChecked).toBe(7)
  })

  it('5. tail tampering (id=7 hash 改竄) → brokenAt=7', async () => {
    const store = new FileAuditLogStore({
      filePath: auditPath,
      rotation: { rotateOnAppend: false },
    })
    await appendStageOutcomes(store, '2026-05-04T12:00:00.000Z')
    const raw = await fs.readFile(auditPath, 'utf-8')
    const lines = raw.trim().split('\n')
    const e7 = JSON.parse(lines[6] ?? '{}') as AuditEvent
    // hash 改竄 (prevHash 整合は壊れないが recompute と差異)
    e7.hash = '0'.repeat(64)
    lines[6] = JSON.stringify(e7)
    await fs.writeFile(auditPath, lines.join('\n') + '\n', 'utf-8')

    const verify = await store.verifyHashChain()
    expect(verify.valid).toBe(false)
    expect(verify.brokenAt).toBe(7)
  })

  it('6. genesis tampering (id=1 type 改竄) → brokenAt=1', async () => {
    const store = new FileAuditLogStore({
      filePath: auditPath,
      rotation: { rotateOnAppend: false },
    })
    await appendStageOutcomes(store, '2026-05-04T12:00:00.000Z')
    const raw = await fs.readFile(auditPath, 'utf-8')
    const lines = raw.trim().split('\n')
    const e1 = JSON.parse(lines[0] ?? '{}') as AuditEvent
    e1.type = 'spawn'
    lines[0] = JSON.stringify(e1)
    await fs.writeFile(auditPath, lines.join('\n') + '\n', 'utf-8')

    const verify = await store.verifyHashChain()
    expect(verify.valid).toBe(false)
    expect(verify.brokenAt).toBe(1)
  })

  it('7. list filter by source (orchestrator) で 7 件保持', async () => {
    const store = new FileAuditLogStore({
      filePath: auditPath,
      rotation: { rotateOnAppend: false },
    })
    await appendStageOutcomes(store, '2026-05-04T12:00:00.000Z')
    const filtered = await store.list({ source: 'orchestrator' })
    expect(filtered).toHaveLength(7)
    const otherSource = await store.list({ source: 'harness' })
    expect(otherSource).toHaveLength(0)
  })

  it('8. 同一入力 2 回実行で同一 hash 列 (determinism)', async () => {
    const path1 = join(scratchDir, 'a.jsonl')
    const path2 = join(scratchDir, 'b.jsonl')
    const store1 = new FileAuditLogStore({
      filePath: path1,
      rotation: { rotateOnAppend: false },
    })
    const store2 = new FileAuditLogStore({
      filePath: path2,
      rotation: { rotateOnAppend: false },
    })
    const r1 = await appendStageOutcomes(store1, '2026-05-04T12:00:00.000Z')
    const r2 = await appendStageOutcomes(store2, '2026-05-04T12:00:00.000Z')
    expect(r1.map((s) => s.hash)).toEqual(r2.map((s) => s.hash))
  })
})

describe('audit hash chain integration with mock-claw e2e flow', () => {
  it('9. e2e flow 経由 audit append → verify pass (1 sink fan-out)', async () => {
    // run-mock-claw-flow が dispatch sink 経由で audit 1 件 append する基本ケース。
    // 既存 mock-claw-flow.test の chain integrity 確認を補強する独立 fixture。
    const r = await runMockClawE2eFlow({ auditFilePath: auditPath })
    expect(r.overallOk).toBe(true)
    expect(r.auditVerify.valid).toBe(true)
    expect(r.auditVerify.brokenAt).toBeNull()
    // dispatch sinks のうち audit-log 経由で 1 件以上 append されている
    expect(r.auditVerify.totalChecked).toBeGreaterThanOrEqual(1)

    // 改めて新 store instance で reload しても同じ verify 結果になる
    const reloadStore = new FileAuditLogStore({
      filePath: auditPath,
      rotation: { rotateOnAppend: false },
    })
    const reverify = await reloadStore.verifyHashChain()
    expect(reverify.valid).toBe(true)
    expect(reverify.totalChecked).toBe(r.auditVerify.totalChecked)
  })
})
