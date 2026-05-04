/**
 * isolation-guard-wiring.test — Round 12 Dev-B (DEC-019-057).
 *
 * FileAuditLogStore.append への PidGuard 配線を検証する.
 *   - pid match: append 通常通り成功
 *   - pid mismatch: AuditLogStoreError('isolation_violation') throw
 *   - guard 未設定: 既存挙動 (no-op)
 *   - shutdown signal: append 後の pid mismatch も検知
 *   - guard.checkPid throws non-isolation error: 同様に isolation_violation に正規化
 *   - 8-10 tests
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  FileAuditLogStore,
  AuditLogStoreError,
  type PidGuard,
} from '../audit-store.js'

function tmpFile(): string {
  return join(
    tmpdir(),
    `clawbridge-isoguard-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    'audit-events.jsonl',
  )
}

class StubGuard implements PidGuard {
  private expectedPid: number
  /** check 呼び出し回数 (append 1 回で 2 増える前提). */
  public callCount = 0
  /** simulate mid-append mismatch: 2 回目だけ throw. */
  public throwOnSecondCheck = false
  constructor(expectedPid: number) {
    this.expectedPid = expectedPid
  }
  checkPid(currentPid: number): void {
    this.callCount += 1
    if (this.throwOnSecondCheck && this.callCount === 2) {
      throw new Error(`mid-append pid drift expected=${this.expectedPid} got=${currentPid}`)
    }
    if (currentPid !== this.expectedPid) {
      throw new Error(`pid mismatch expected=${this.expectedPid} got=${currentPid}`)
    }
  }
  setExpected(p: number): void {
    this.expectedPid = p
  }
}

describe('FileAuditLogStore — PidGuard wiring (Round 12 Dev-B / DEC-019-057)', () => {
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

  it('guard 未設定: append 通常成功 (既存挙動互換)', async () => {
    const store = new FileAuditLogStore({ filePath: path })
    const r = await store.append({
      type: 'spawn',
      source: 'harness',
      payload: { hello: 'world' },
    })
    expect(r.id).toBe(1)
    expect(typeof r.hash).toBe('string')
  })

  it('pid match: append 成功 + guard.checkPid が前後 2 回呼ばれる', async () => {
    const guard = new StubGuard(1234)
    const store = new FileAuditLogStore({
      filePath: path,
      pidGuard: guard,
      pidProvider: () => 1234,
    })
    await store.append({ type: 'spawn', source: 'harness', payload: {} })
    expect(guard.callCount).toBe(2)
  })

  it('pid mismatch: AuditLogStoreError("isolation_violation") throw', async () => {
    const guard = new StubGuard(1111)
    const store = new FileAuditLogStore({
      filePath: path,
      pidGuard: guard,
      pidProvider: () => 9999, // mismatch
    })
    await expect(
      store.append({ type: 'spawn', source: 'harness', payload: {} }),
    ).rejects.toBeInstanceOf(AuditLogStoreError)
    try {
      await store.append({ type: 'spawn', source: 'harness', payload: {} })
    } catch (e) {
      const err = e as AuditLogStoreError
      expect(err.code).toBe('isolation_violation')
      expect(err.message).toContain('pid')
    }
  })

  it('pid mismatch: append 前 guard が即時 reject (1 回目で停止、entry は書かれない)', async () => {
    const guard = new StubGuard(1111)
    const store = new FileAuditLogStore({
      filePath: path,
      pidGuard: guard,
      pidProvider: () => 9999,
    })
    await expect(
      store.append({ type: 'spawn', source: 'harness', payload: {} }),
    ).rejects.toThrow()
    // 1 回目 (前 check) で throw しているので callCount=1
    expect(guard.callCount).toBe(1)
    // file が作られていないことを確認
    const exists = await fs
      .access(path)
      .then(() => true)
      .catch(() => false)
    expect(exists).toBe(false)
  })

  it('mid-append drift (前 OK / 後 throw): append 後 guard で検知', async () => {
    const guard = new StubGuard(1234)
    guard.throwOnSecondCheck = true
    const store = new FileAuditLogStore({
      filePath: path,
      pidGuard: guard,
      pidProvider: () => 1234,
    })
    await expect(
      store.append({ type: 'spawn', source: 'harness', payload: {} }),
    ).rejects.toBeInstanceOf(AuditLogStoreError)
    expect(guard.callCount).toBe(2)
    // 既に file には書かれている (後 check は書込後)
    const data = await fs.readFile(path, 'utf-8')
    expect(data.length).toBeGreaterThan(0)
  })

  it('shutdown signal: caller 側で AuditLogStoreError を catch して graceful shutdown 経路へ進める', async () => {
    const guard = new StubGuard(1234)
    const store = new FileAuditLogStore({
      filePath: path,
      pidGuard: guard,
      pidProvider: () => 5678,
    })
    let shutdownTriggered = false
    try {
      await store.append({ type: 'spawn', source: 'harness', payload: {} })
    } catch (e) {
      if (e instanceof AuditLogStoreError && e.code === 'isolation_violation') {
        shutdownTriggered = true
      }
    }
    expect(shutdownTriggered).toBe(true)
  })

  it('pidProvider default: process.pid を使う', async () => {
    const guard = new StubGuard(process.pid)
    const store = new FileAuditLogStore({
      filePath: path,
      pidGuard: guard,
      // pidProvider 未指定 → default process.pid
    })
    await store.append({ type: 'spawn', source: 'harness', payload: {} })
    expect(guard.callCount).toBe(2)
  })

  it('guard が non-Error を throw しても isolation_violation に正規化', async () => {
    const customGuard: PidGuard = {
      checkPid(_currentPid: number): void {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw 'string error'
      },
    }
    const store = new FileAuditLogStore({
      filePath: path,
      pidGuard: customGuard,
      pidProvider: () => 1,
    })
    try {
      await store.append({ type: 'spawn', source: 'harness', payload: {} })
      throw new Error('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(AuditLogStoreError)
      expect((e as AuditLogStoreError).code).toBe('isolation_violation')
    }
  })

  it('guard 通過時の append 結果は既存挙動と完全互換 (id/hash 連番性)', async () => {
    const guard = new StubGuard(42)
    const store = new FileAuditLogStore({
      filePath: path,
      pidGuard: guard,
      pidProvider: () => 42,
    })
    const r1 = await store.append({ type: 'spawn', source: 'harness', payload: { n: 1 } })
    const r2 = await store.append({ type: 'spawn', source: 'harness', payload: { n: 2 } })
    expect(r1.id).toBe(1)
    expect(r2.id).toBe(2)
    expect(r1.hash).not.toBe(r2.hash)
    const verify = await store.verifyHashChain()
    expect(verify.valid).toBe(true)
  })

  it('cause field: 元の Error を AuditLogStoreError.cause に保持', async () => {
    const original = new Error('root cause: pid drift')
    const customGuard: PidGuard = {
      checkPid(): void {
        throw original
      },
    }
    const store = new FileAuditLogStore({
      filePath: path,
      pidGuard: customGuard,
      pidProvider: () => 1,
    })
    try {
      await store.append({ type: 'spawn', source: 'harness', payload: {} })
      throw new Error('expected throw')
    } catch (e) {
      expect(e).toBeInstanceOf(AuditLogStoreError)
      expect((e as AuditLogStoreError).cause).toBe(original)
    }
  })
})
