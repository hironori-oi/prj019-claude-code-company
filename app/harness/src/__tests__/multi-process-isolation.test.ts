/**
 * multi-process-isolation.test — Round 11 Dev-B (DEC-019-057).
 *
 * DoD: 4+ tests for process.pid + 起動 token + audit record.
 *
 * coverage:
 *   - buildProcessStartupRecord: 必須フィールド + 衝突検出
 *   - buildProcessShutdownRecord: durationMs 算出 + clock skew reject
 *   - IsolationGuard: start/stop lifecycle / 重複 start reject
 *   - detectIsolationViolations: 3 violation type 全カバー
 */
import { describe, it, expect } from 'vitest'
import {
  IsolationGuard,
  buildProcessShutdownRecord,
  buildProcessStartupRecord,
  detectIsolationViolations,
  type ProcessStartupRecord,
} from '../multi-process-isolation.js'

// ============================================================================
// buildProcessStartupRecord
// ============================================================================

describe('buildProcessStartupRecord', () => {
  it('必須フィールド + DI pidProvider / now', () => {
    const r = buildProcessStartupRecord({
      projectId: 'PRJ-019',
      pidProvider: () => 12345,
      now: () => Date.parse('2026-05-04T10:00:00Z'),
      token: 'fixed-token-abc',
    })
    expect(r.kind).toBe('isolation:start')
    expect(r.projectId).toBe('PRJ-019')
    expect(r.pid).toBe(12345)
    expect(r.startupToken).toBe('fixed-token-abc')
    expect(r.startedAt).toBe('2026-05-04T10:00:00.000Z')
    expect(r.parentPid).toBeNull()
    expect(r.parallelAllowed).toBe(false) // G-V2-01 default
    expect(r.knownPeerPids).toEqual([])
  })

  it('parallelAllowed=true / parentPid / knownPeerPids 指定', () => {
    const r = buildProcessStartupRecord({
      projectId: 'PRJ-019',
      pidProvider: () => 100,
      now: () => 0,
      parentPid: 1,
      parallelAllowed: true,
      knownPeerPids: [200, 300],
      token: 'tok',
    })
    expect(r.parentPid).toBe(1)
    expect(r.parallelAllowed).toBe(true)
    expect(r.knownPeerPids).toEqual([200, 300])
  })

  it('self pid が knownPeerPids に紛れている → throw (drill 設計エラー)', () => {
    expect(() =>
      buildProcessStartupRecord({
        projectId: 'PRJ-019',
        pidProvider: () => 12345,
        now: () => 0,
        knownPeerPids: [100, 12345, 200],
        token: 't',
      }),
    ).toThrow(/self pid/)
  })

  it('invalid input: projectId 空 / pid 負値 で throw', () => {
    expect(() =>
      buildProcessStartupRecord({
        projectId: '',
        pidProvider: () => 1,
        now: () => 0,
      }),
    ).toThrow(/projectId required/)
    expect(() =>
      buildProcessStartupRecord({
        projectId: 'PRJ-019',
        pidProvider: () => -5,
        now: () => 0,
      }),
    ).toThrow(/invalid pid/)
  })

  it('default pidProvider: process.pid を取得 (Node.js 環境)', () => {
    const r = buildProcessStartupRecord({
      projectId: 'PRJ-019',
      now: () => 0,
      token: 't',
    })
    expect(r.pid).toBe(process.pid)
    expect(r.pid).toBeGreaterThan(0)
  })
})

// ============================================================================
// buildProcessShutdownRecord
// ============================================================================

describe('buildProcessShutdownRecord', () => {
  it('durationMs 算出 OK', () => {
    const start = buildProcessStartupRecord({
      projectId: 'PRJ-019',
      pidProvider: () => 1,
      now: () => Date.parse('2026-05-04T10:00:00Z'),
      token: 't',
    })
    const stop = buildProcessShutdownRecord({
      startupRecord: start,
      now: () => Date.parse('2026-05-04T10:00:30Z'),
      exitReason: 'normal',
    })
    expect(stop.kind).toBe('isolation:stop')
    expect(stop.startupToken).toBe('t')
    expect(stop.durationMs).toBe(30_000)
    expect(stop.exitReason).toBe('normal')
  })

  it('clock skew (end < start) → throw', () => {
    const start = buildProcessStartupRecord({
      projectId: 'PRJ-019',
      pidProvider: () => 1,
      now: () => 1_000_000,
      token: 't',
    })
    expect(() =>
      buildProcessShutdownRecord({
        startupRecord: start,
        now: () => 999_000,
      }),
    ).toThrow(/before start/)
  })

  it('exitReason 未指定 → null', () => {
    const start = buildProcessStartupRecord({
      projectId: 'PRJ-019',
      pidProvider: () => 1,
      now: () => 0,
      token: 't',
    })
    const stop = buildProcessShutdownRecord({
      startupRecord: start,
      now: () => 1_000,
    })
    expect(stop.exitReason).toBeNull()
  })
})

// ============================================================================
// IsolationGuard lifecycle
// ============================================================================

describe('IsolationGuard', () => {
  it('start → stop lifecycle 正常', () => {
    let now = 1_000_000
    const g = new IsolationGuard({
      projectId: 'PRJ-019',
      pidProvider: () => 100,
      now: () => now,
    })
    expect(g.isActive()).toBe(false)
    const startRec = g.start({ token: 'tok-1' })
    expect(g.isActive()).toBe(true)
    expect(startRec.pid).toBe(100)
    now += 5_000
    const stopRec = g.stop('completed')
    expect(g.isActive()).toBe(false)
    expect(stopRec.durationMs).toBe(5_000)
    expect(stopRec.startupToken).toBe('tok-1')
  })

  it('重複 start → throw', () => {
    const g = new IsolationGuard({
      projectId: 'PRJ-019',
      pidProvider: () => 1,
      now: () => 0,
    })
    g.start({ token: 't1' })
    expect(() => g.start({ token: 't2' })).toThrow(/already started/)
  })

  it('start 前 stop → throw', () => {
    const g = new IsolationGuard({
      projectId: 'PRJ-019',
      pidProvider: () => 1,
      now: () => 0,
    })
    expect(() => g.stop()).toThrow(/not started/)
  })

  it('current() snapshot は immutable copy', () => {
    const g = new IsolationGuard({
      projectId: 'PRJ-019',
      pidProvider: () => 1,
      now: () => 0,
    })
    g.start({ token: 't1' })
    const a = g.current()
    const b = g.current()
    expect(a).not.toBe(b) // 別オブジェクト
    expect(a).toEqual(b)
  })
})

// ============================================================================
// detectIsolationViolations — drill #2 Sumi/Asagi 巻き添えゼロ確証
// ============================================================================

describe('detectIsolationViolations', () => {
  function rec(
    over: Partial<ProcessStartupRecord> & { projectId: string; pid: number; token: string },
  ): ProcessStartupRecord {
    return {
      kind: 'isolation:start',
      projectId: over.projectId,
      pid: over.pid,
      startupToken: over.token,
      startedAt: over.startedAt ?? '2026-05-04T10:00:00.000Z',
      parentPid: over.parentPid ?? null,
      parallelAllowed: over.parallelAllowed ?? false,
      knownPeerPids: over.knownPeerPids ?? [],
    }
  }

  it('違反なし: 異 pid + 異 token + 異 projectId', () => {
    const r1 = rec({ projectId: 'PRJ-019', pid: 100, token: 't1' })
    const r2 = rec({ projectId: 'PRJ-012', pid: 200, token: 't2' })
    const r3 = rec({ projectId: 'PRJ-018', pid: 300, token: 't3' })
    expect(detectIsolationViolations([r1, r2, r3])).toEqual([])
  })

  it('pid_duplicate: 同 pid × 2 案件 (両方 parallelAllowed=false)', () => {
    const r1 = rec({ projectId: 'PRJ-019', pid: 999, token: 't1' })
    const r2 = rec({ projectId: 'PRJ-012', pid: 999, token: 't2' })
    const v = detectIsolationViolations([r1, r2])
    expect(v.length).toBeGreaterThanOrEqual(1)
    expect(v.some((x) => x.type === 'pid_duplicate')).toBe(true)
  })

  it('token_duplicate: 同 token (実装バグ示唆)', () => {
    const r1 = rec({ projectId: 'PRJ-019', pid: 100, token: 'same-token' })
    const r2 = rec({ projectId: 'PRJ-012', pid: 200, token: 'same-token' })
    const v = detectIsolationViolations([r1, r2])
    expect(v.some((x) => x.type === 'token_duplicate')).toBe(true)
  })

  it('parallel_violation: 同 projectId × 2 record × parallelAllowed=false', () => {
    const r1 = rec({ projectId: 'PRJ-019', pid: 100, token: 't1' })
    const r2 = rec({ projectId: 'PRJ-019', pid: 200, token: 't2' })
    const v = detectIsolationViolations([r1, r2])
    expect(v.some((x) => x.type === 'parallel_violation')).toBe(true)
  })

  it('parallelAllowed=true 同士は pid 重複でも違反扱いしない (テスト harness で許容)', () => {
    const r1 = rec({
      projectId: 'PRJ-019',
      pid: 100,
      token: 't1',
      parallelAllowed: true,
    })
    const r2 = rec({
      projectId: 'PRJ-012',
      pid: 100,
      token: 't2',
      parallelAllowed: true,
    })
    const v = detectIsolationViolations([r1, r2])
    expect(v.filter((x) => x.type === 'pid_duplicate')).toEqual([])
  })

  it('drill #2 Sumi/Asagi 巻き添えゼロ確証シナリオ: 3 案件異 pid + 異 token = 違反なし', () => {
    // PRJ-019 Open Claw + PRJ-012 Sumi + PRJ-018 Asagi
    const records = [
      rec({ projectId: 'PRJ-019', pid: 11111, token: 'tok-019' }),
      rec({ projectId: 'PRJ-012', pid: 22222, token: 'tok-012' }),
      rec({ projectId: 'PRJ-018', pid: 33333, token: 'tok-018' }),
    ]
    expect(detectIsolationViolations(records)).toEqual([])
  })
})
