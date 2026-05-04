/**
 * audit-log-real-impl.test — Round 14 Dev-F (緊急対応): G-09 audit log mock 依存解消.
 *
 * DoD: 15-22 tests.
 *
 * coverage:
 *   - InMemoryMockAuditLogStore: append + list + verifyHashChain + rotate(no-op) + tamper detect
 *   - RealAuditLogAdapter: filePath required + append/list/verify 透過 + activatedAt
 *   - createAuditImpl: mock / real / drill 3 mode + filePath required for real/drill
 *   - bridgeMockToReal: mock → real migration + 進捗計算 + 空 mock 即時完了
 *   - assertCompatibleEvent: known type/source/payload object 検査
 *   - descriptorsEqual: 一致 / 不一致判定
 *   - PidGuard 配線: mock + real 双方
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  InMemoryMockAuditLogStore,
  RealAuditLogAdapter,
  createAuditImpl,
  bridgeMockToReal,
  assertCompatibleEvent,
  descriptorsEqual,
  makeDrillTempAuditPath,
  ensureDrillAuditDir,
  type AuditImplDescriptor,
} from '../audit-log-real-impl.js'
import { AuditLogStoreError, type PidGuard } from '../audit-store.js'

function tmpFile(): string {
  return join(
    tmpdir(),
    `clawbridge-audit-real-impl-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    'audit-events.jsonl',
  )
}

describe('InMemoryMockAuditLogStore', () => {
  it('append 3 entries → monotonic id + valid hash chain', async () => {
    const store = new InMemoryMockAuditLogStore()
    const r1 = await store.append({
      type: 'spawn',
      source: 'openclaw-runtime',
      payload: { binary: '/x' },
    })
    const r2 = await store.append({
      type: 'kill_switch',
      source: 'harness',
      payload: { reason: 'manual' },
    })
    const r3 = await store.append({
      type: 'hitl_decision',
      source: 'harness',
      payload: { actionType: 'public_release' },
    })
    expect([r1.id, r2.id, r3.id]).toEqual([1, 2, 3])
    const verify = await store.verifyHashChain()
    expect(verify.valid).toBe(true)
    expect(verify.totalChecked).toBe(3)
  })

  it('list with query type filter', async () => {
    const store = new InMemoryMockAuditLogStore()
    await store.append({ type: 'spawn', source: 'harness', payload: {} })
    await store.append({ type: 'kill_switch', source: 'harness', payload: {} })
    const spawns = await store.list({ type: 'spawn' })
    expect(spawns).toHaveLength(1)
  })

  it('rotate is no-op for in-memory mock', async () => {
    const store = new InMemoryMockAuditLogStore()
    await store.append({ type: 'spawn', source: 'harness', payload: {} })
    expect(await store.rotate()).toBe(0)
  })

  it('tamperPayload detected by verifyHashChain', async () => {
    const store = new InMemoryMockAuditLogStore()
    await store.append({ type: 'spawn', source: 'harness', payload: { x: 1 } })
    await store.append({ type: 'spawn', source: 'harness', payload: { x: 2 } })
    store.tamperPayload(1, (e) => {
      ;(e.payload as { x: number }).x = 999
    })
    const verify = await store.verifyHashChain()
    expect(verify.valid).toBe(false)
    expect(verify.brokenAt).toBe(1)
  })

  it('PidGuard mismatch → AuditLogStoreError(isolation_violation)', async () => {
    const stub: PidGuard = {
      checkPid(pid: number) {
        if (pid !== 7777) throw new Error('pid drift')
      },
    }
    const store = new InMemoryMockAuditLogStore({
      pidGuard: stub,
      pidProvider: () => 1234,
    })
    await expect(
      store.append({ type: 'spawn', source: 'harness', payload: {} }),
    ).rejects.toThrow(AuditLogStoreError)
  })

  it('seed entries は initial state を構築', () => {
    const seed = [
      {
        id: 1,
        ts: '2026-05-04T00:00:00.000Z',
        type: 'spawn' as const,
        source: 'harness' as const,
        payload: {},
        prevHash: '',
        hash: 'abc123',
      },
    ]
    const store = new InMemoryMockAuditLogStore({ seed })
    expect(store.snapshot()).toHaveLength(1)
  })
})

describe('RealAuditLogAdapter', () => {
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

  it('filePath required → throw without filePath', () => {
    expect(
      () =>
        new RealAuditLogAdapter({
          filePath: '',
        }),
    ).toThrow(AuditLogStoreError)
  })

  it('append + verify が FileAuditLogStore 透過', async () => {
    const adapter = new RealAuditLogAdapter({ filePath: path })
    await adapter.append({ type: 'spawn', source: 'harness', payload: { v: 1 } })
    await adapter.append({
      type: 'kill_switch',
      source: 'harness',
      payload: { reason: 'test' },
    })
    const verify = await adapter.verifyHashChain()
    expect(verify.valid).toBe(true)
    expect(verify.totalChecked).toBe(2)
  })

  it('getActivatedAt + getFilePath を返す', () => {
    const t = new Date('2026-05-05T06:00:00Z')
    const adapter = new RealAuditLogAdapter({
      filePath: path,
      activatedAt: t,
    })
    expect(adapter.getActivatedAt().toISOString()).toBe(t.toISOString())
    expect(adapter.getFilePath()).toBe(path)
  })

  it('rotate は inner FileAuditLogStore に委譲', async () => {
    const adapter = new RealAuditLogAdapter({ filePath: path })
    const result = await adapter.rotate()
    expect(typeof result).toBe('number')
  })
})

describe('createAuditImpl', () => {
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

  it('mode=mock → InMemoryMockAuditLogStore を返す', async () => {
    const { store, descriptor } = await createAuditImpl({ mode: 'mock' })
    expect(store).toBeInstanceOf(InMemoryMockAuditLogStore)
    expect(descriptor.mode).toBe('mock')
    expect(descriptor.filePath).toBeNull()
    expect(descriptor.bridgeProgress).toBe(1)
  })

  it('mode=real → RealAuditLogAdapter を返す', async () => {
    const { store, descriptor } = await createAuditImpl({
      mode: 'real',
      filePath: path,
    })
    expect(store).toBeInstanceOf(RealAuditLogAdapter)
    expect(descriptor.mode).toBe('real')
    expect(descriptor.filePath).toBe(path)
  })

  it('mode=real で filePath なし → throw', async () => {
    await expect(createAuditImpl({ mode: 'real' })).rejects.toThrow(
      AuditLogStoreError,
    )
  })

  it('mode=drill で filePath なし → throw', async () => {
    await expect(createAuditImpl({ mode: 'drill' })).rejects.toThrow(
      AuditLogStoreError,
    )
  })

  it('mode=drill + seedFromMock → bridge 完了 (bridgeProgress=1)', async () => {
    const mock = new InMemoryMockAuditLogStore()
    await mock.append({ type: 'spawn', source: 'harness', payload: { i: 1 } })
    await mock.append({ type: 'spawn', source: 'harness', payload: { i: 2 } })
    const { store, descriptor } = await createAuditImpl({
      mode: 'drill',
      filePath: path,
      seedFromMock: mock,
    })
    expect(descriptor.mode).toBe('drill')
    expect(descriptor.bridgeProgress).toBe(1)
    const verify = await store.verifyHashChain()
    expect(verify.valid).toBe(true)
    expect(verify.totalChecked).toBe(2)
  })

  it('unknown mode → throw', async () => {
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createAuditImpl({ mode: 'invalid' as any }),
    ).rejects.toThrow(AuditLogStoreError)
  })
})

describe('bridgeMockToReal', () => {
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

  it('空 mock → 即時 1.0 を返す (no-op)', async () => {
    const mock = new InMemoryMockAuditLogStore()
    const real = new RealAuditLogAdapter({ filePath: path })
    const ratio = await bridgeMockToReal(mock, real)
    expect(ratio).toBe(1)
  })

  it('mock 3 件 → real 3 件 が同 type で append される', async () => {
    const mock = new InMemoryMockAuditLogStore()
    await mock.append({ type: 'spawn', source: 'harness', payload: { i: 1 } })
    await mock.append({ type: 'kill_switch', source: 'harness', payload: { i: 2 } })
    await mock.append({ type: 'hitl_decision', source: 'harness', payload: { i: 3 } })
    const real = new RealAuditLogAdapter({ filePath: path })
    const ratio = await bridgeMockToReal(mock, real)
    expect(ratio).toBe(1)
    const list = await real.list()
    expect(list).toHaveLength(3)
  })
})

describe('assertCompatibleEvent', () => {
  it('正常 input → throw しない', () => {
    expect(() =>
      assertCompatibleEvent({
        type: 'spawn',
        source: 'harness',
        payload: { x: 1 },
      }),
    ).not.toThrow()
  })

  it('unknown type → throw', () => {
    expect(() =>
      assertCompatibleEvent({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: 'bogus' as any,
        source: 'harness',
        payload: {},
      }),
    ).toThrow(AuditLogStoreError)
  })

  it('unknown source → throw', () => {
    expect(() =>
      assertCompatibleEvent({
        type: 'spawn',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        source: 'bogus' as any,
        payload: {},
      }),
    ).toThrow(AuditLogStoreError)
  })

  it('payload null → throw', () => {
    expect(() =>
      assertCompatibleEvent({
        type: 'spawn',
        source: 'harness',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: null as any,
      }),
    ).toThrow(AuditLogStoreError)
  })
})

describe('descriptorsEqual', () => {
  it('完全一致 → true', () => {
    const d: AuditImplDescriptor = Object.freeze({
      mode: 'mock',
      filePath: null,
      readOnly: false,
      bridgeProgress: 1,
    })
    expect(descriptorsEqual(d, d)).toBe(true)
  })

  it('mode 違い → false', () => {
    const a: AuditImplDescriptor = Object.freeze({
      mode: 'mock',
      filePath: null,
      readOnly: false,
      bridgeProgress: 1,
    })
    const b: AuditImplDescriptor = Object.freeze({
      mode: 'real',
      filePath: null,
      readOnly: false,
      bridgeProgress: 1,
    })
    expect(descriptorsEqual(a, b)).toBe(false)
  })
})

describe('makeDrillTempAuditPath + ensureDrillAuditDir', () => {
  it('makeDrillTempAuditPath は tmpdir 配下のユニークなパスを返す', () => {
    const a = makeDrillTempAuditPath('drill')
    const b = makeDrillTempAuditPath('drill')
    expect(a).not.toBe(b)
    expect(a).toContain('clawbridge-drill-')
    expect(a.endsWith('audit-events.jsonl')).toBe(true)
  })

  it('ensureDrillAuditDir で親 dir が作成される', async () => {
    const path = makeDrillTempAuditPath('test-ensure')
    await ensureDrillAuditDir(path)
    const dir = join(path, '..')
    const stat = await fs.stat(dir)
    expect(stat.isDirectory()).toBe(true)
    await fs.rm(dir, { recursive: true, force: true })
  })
})
