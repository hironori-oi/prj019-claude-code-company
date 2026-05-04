/**
 * audit-store.test — Round 7 W0-Week1 prefetch (G-10):
 *   FileAuditLogStore = append-only + SHA-256 hash chain + 90 日 rotation の単体テスト。
 *
 * 関連:
 *   - DEC-019-006 (audit retention)
 *   - 議決-25 採択前提 Phase 1 W2 ハードガード前倒し
 *
 * カバー範囲:
 *   1. append → list で順序保証 + hash chain が破綻していない
 *   2. verifyHashChain は改ざんを検出する (中間 entry の payload 改竄)
 *   3. rotate は cutoff 以前の entry を archive に移動し active を切り詰める
 *   4. spawn / kill_switch / hitl_decision の 3 種をすべて記録できる
 *   5. concurrent append 100 件で id/hash が monotonic (race-free serialization)
 *   6. computeHash は同じ入力で同じ hash を返し、入力が変われば hash が変わる
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FileAuditLogStore, computeHash } from '../audit-store.js'

function tmpFile(): string {
  return join(
    tmpdir(),
    `clawbridge-audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    'audit-events.jsonl',
  )
}

describe('FileAuditLogStore (G-10 append-only + hash chain)', () => {
  let path: string

  beforeEach(() => {
    path = tmpFile()
  })

  afterEach(async () => {
    try {
      await fs.rm(join(path, '..'), { recursive: true, force: true })
    } catch {
      // ignore
    }
  })

  it('appends 3 entries with monotonic id and a valid hash chain', async () => {
    const store = new FileAuditLogStore({ filePath: path })
    const r1 = await store.append({
      type: 'spawn',
      source: 'openclaw-runtime',
      payload: { binary: '/bin/openclaw' },
    })
    const r2 = await store.append({
      type: 'kill_switch',
      source: 'harness',
      payload: { reason: 'manual' },
    })
    const r3 = await store.append({
      type: 'hitl_decision',
      source: 'harness',
      payload: { actionType: 'public_release', approved: true },
    })
    expect([r1.id, r2.id, r3.id]).toEqual([1, 2, 3])

    const list = await store.list()
    expect(list).toHaveLength(3)
    expect(list[0]?.prevHash).toBe('')
    expect(list[1]?.prevHash).toBe(list[0]?.hash)
    expect(list[2]?.prevHash).toBe(list[1]?.hash)

    const verify = await store.verifyHashChain()
    expect(verify.valid).toBe(true)
    expect(verify.totalChecked).toBe(3)
  })

  it('verifyHashChain detects payload tampering at the broken entry', async () => {
    const store = new FileAuditLogStore({ filePath: path })
    await store.append({
      type: 'spawn',
      source: 'openclaw-runtime',
      payload: { binary: '/bin/x' },
    })
    await store.append({
      type: 'spawn',
      source: 'openclaw-runtime',
      payload: { binary: '/bin/y' },
    })
    await store.append({
      type: 'spawn',
      source: 'openclaw-runtime',
      payload: { binary: '/bin/z' },
    })
    // tamper: id=2 の payload.binary を /bin/EVIL に書換 (hash は元のまま)
    const raw = await fs.readFile(path, 'utf-8')
    const lines = raw.trim().split('\n')
    const e2 = JSON.parse(lines[1] ?? '{}') as Record<string, unknown>
    e2['payload'] = { binary: '/bin/EVIL' }
    lines[1] = JSON.stringify(e2)
    await fs.writeFile(path, lines.join('\n') + '\n', 'utf-8')

    const verify = await store.verifyHashChain()
    expect(verify.valid).toBe(false)
    expect(verify.brokenAt).toBe(2)
  })

  it('rotate moves expired entries to archive and keeps fresh ones active', async () => {
    let nowMs = Date.UTC(2026, 0, 1, 0, 0, 0)
    const store = new FileAuditLogStore({
      filePath: path,
      rotation: { retentionMs: 1000, rotateOnAppend: false },
      now: () => new Date(nowMs),
    })
    await store.append({ type: 'spawn', source: 'harness', payload: { i: 1 } })
    await store.append({ type: 'spawn', source: 'harness', payload: { i: 2 } })
    nowMs += 5000 // 5s 進める → 上 2 件は cutoff 越え
    await store.append({ type: 'spawn', source: 'harness', payload: { i: 3 } })
    const moved = await store.rotate()
    expect(moved).toBe(2)
    const remaining = await store.list()
    expect(remaining).toHaveLength(1)
    expect(remaining[0]?.payload['i']).toBe(3)
    // archive ファイル が存在し、削除されていない
    const dir = join(path, '..')
    const files = await fs.readdir(dir)
    expect(files.some((f) => f.includes('archive-'))).toBe(true)
  })

  it('list filters by type / source / time range', async () => {
    const store = new FileAuditLogStore({
      filePath: path,
      rotation: { retentionMs: 1000_000_000, rotateOnAppend: false },
    })
    await store.append({
      type: 'spawn',
      source: 'openclaw-runtime',
      payload: { i: 1 },
      ts: '2026-05-01T00:00:00.000Z',
    })
    await store.append({
      type: 'kill_switch',
      source: 'harness',
      payload: { i: 2 },
      ts: '2026-05-02T00:00:00.000Z',
    })
    await store.append({
      type: 'hitl_decision',
      source: 'harness',
      payload: { i: 3 },
      ts: '2026-05-03T00:00:00.000Z',
    })
    const onlySpawn = await store.list({ type: 'spawn' })
    expect(onlySpawn).toHaveLength(1)
    const onlyHarness = await store.list({ source: 'harness' })
    expect(onlyHarness).toHaveLength(2)
    const may2 = await store.list({
      fromTs: '2026-05-02T00:00:00.000Z',
      toTs: '2026-05-02T23:59:59.999Z',
    })
    expect(may2).toHaveLength(1)
    expect(may2[0]?.type).toBe('kill_switch')
  })

  it('serialises concurrent appends with monotonic id and chain integrity', async () => {
    const store = new FileAuditLogStore({
      filePath: path,
      rotation: { rotateOnAppend: false },
    })
    const ps = Array.from({ length: 30 }, (_v, i) =>
      store.append({
        type: 'spawn',
        source: 'harness',
        payload: { idx: i },
      }),
    )
    const results = await Promise.all(ps)
    const ids = results.map((r) => r.id).sort((a, b) => a - b)
    expect(ids).toEqual(Array.from({ length: 30 }, (_v, i) => i + 1))
    const verify = await store.verifyHashChain()
    expect(verify.valid).toBe(true)
    expect(verify.totalChecked).toBe(30)
  })

  it('computeHash is deterministic and changes on input mutation', () => {
    const a = computeHash({
      prevHash: '',
      ts: '2026-05-04T00:00:00.000Z',
      type: 'spawn',
      source: 'harness',
      payload: { x: 1 },
      id: 1,
    })
    const b = computeHash({
      prevHash: '',
      ts: '2026-05-04T00:00:00.000Z',
      type: 'spawn',
      source: 'harness',
      payload: { x: 1 },
      id: 1,
    })
    const c = computeHash({
      prevHash: '',
      ts: '2026-05-04T00:00:00.000Z',
      type: 'spawn',
      source: 'harness',
      payload: { x: 2 },
      id: 1,
    })
    expect(a).toBe(b)
    expect(a).not.toBe(c)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
  })
})
