/**
 * hardguard-g-02.test — Round 14 Dev-F (緊急対応): G-02 process boundary safety + duplicate-launch prevention.
 *
 * DoD: 12-18 tests.
 *
 * coverage:
 *   - canonicalProcessFingerprint: 決定論性 + 異 record の異 fingerprint
 *   - validateProcessBoundary: 5 検査項目すべて
 *   - assertSingleParallel: G-V2-01 並列違反 + token 重複
 *   - DuplicateLaunchDetector: 4 reason 全カバー (first / pid / token / parallel)
 *   - convertViolationsToReasons: 既存 IsolationViolation との互換
 */
import { describe, it, expect } from 'vitest'
import {
  validateProcessBoundary,
  canonicalProcessFingerprint,
  assertSingleParallel,
  DuplicateLaunchDetector,
  convertViolationsToReasons,
  DEFAULT_BOUNDARY_CONTEXT,
} from '../hardguard-g-02.js'
import { buildProcessStartupRecord } from '../multi-process-isolation.js'
import type { ProcessStartupRecord } from '../multi-process-isolation.js'

function mkRecord(opts: {
  projectId?: string
  pid?: number
  token?: string
  parallelAllowed?: boolean
  startedAt?: string
  knownPeerPids?: readonly number[]
}): ProcessStartupRecord {
  return buildProcessStartupRecord({
    projectId: opts.projectId ?? 'PRJ-019',
    pidProvider: () => opts.pid ?? 12345,
    now: () => (opts.startedAt ? Date.parse(opts.startedAt) : Date.parse('2026-05-04T10:00:00Z')),
    token: opts.token ?? 'tok-abcdefghijklmnopqr',
    parallelAllowed: opts.parallelAllowed ?? false,
    knownPeerPids: opts.knownPeerPids ?? [],
  })
}

// ============================================================================
// canonicalProcessFingerprint
// ============================================================================

describe('canonicalProcessFingerprint', () => {
  it('決定論的: 同じ record → 同じ fingerprint', () => {
    const r = mkRecord({ pid: 1234, token: 'fixedtoken1234567890' })
    const f1 = canonicalProcessFingerprint(r)
    const f2 = canonicalProcessFingerprint(r)
    expect(f1).toBe(f2)
    expect(f1).toContain('PRJ-019')
    expect(f1).toContain('000004d2') // 1234 in hex padded
  })

  it('異 record → 異 fingerprint (pid 違い)', () => {
    const a = mkRecord({ pid: 100, token: 'tok-aaaaaaaaaaaaaaaa' })
    const b = mkRecord({ pid: 200, token: 'tok-aaaaaaaaaaaaaaaa' })
    expect(canonicalProcessFingerprint(a)).not.toBe(canonicalProcessFingerprint(b))
  })
})

// ============================================================================
// validateProcessBoundary
// ============================================================================

describe('validateProcessBoundary', () => {
  it('全項目 pass で valid=true', () => {
    const r = mkRecord({ pid: 1234, startedAt: '2026-05-04T10:00:00Z' })
    const v = validateProcessBoundary(r, {
      currentPid: 1234,
      nowMs: Date.parse('2026-05-04T10:00:01Z'),
      knownPeerPids: [],
      maxParallel: 1,
    })
    expect(v.valid).toBe(true)
    expect(v.reasons).toHaveLength(0)
    expect(v.fingerprint).toContain('PRJ-019')
  })

  it('pid drift で valid=false + reason に pid_drift', () => {
    const r = mkRecord({ pid: 1234 })
    const v = validateProcessBoundary(r, {
      currentPid: 9999,
      nowMs: Date.parse('2026-05-04T10:00:01Z'),
      knownPeerPids: [],
      maxParallel: 1,
    })
    expect(v.valid).toBe(false)
    expect(v.reasons.some((r) => r.includes('pid_drift'))).toBe(true)
  })

  it('peer collision を検知 (pid が peer に含まれる)', () => {
    const r = mkRecord({ pid: 1234 })
    const v = validateProcessBoundary(r, {
      currentPid: 1234,
      nowMs: Date.parse('2026-05-04T10:00:01Z'),
      knownPeerPids: [1234, 5678],
      maxParallel: 1,
    })
    expect(v.valid).toBe(false)
    expect(v.reasons.some((r) => r.includes('peer_collision'))).toBe(true)
  })

  it('clock_reverse を検知 (startedAt が nowMs より未来)', () => {
    const r = mkRecord({ pid: 1234, startedAt: '2026-05-04T11:00:00Z' })
    const v = validateProcessBoundary(r, {
      currentPid: 1234,
      nowMs: Date.parse('2026-05-04T10:00:00Z'),
      knownPeerPids: [],
      maxParallel: 1,
    })
    expect(v.valid).toBe(false)
    expect(v.reasons.some((r) => r.includes('clock_reverse'))).toBe(true)
  })

  it('parallel_mismatch を検知 (parallelAllowed=false なのに maxParallel != 1)', () => {
    const r = mkRecord({ pid: 1234, parallelAllowed: false })
    const v = validateProcessBoundary(r, {
      currentPid: 1234,
      nowMs: Date.parse('2026-05-04T10:00:01Z'),
      knownPeerPids: [],
      maxParallel: 5,
    })
    expect(v.valid).toBe(false)
    expect(v.reasons.some((r) => r.includes('parallel_mismatch'))).toBe(true)
  })

  it('weak_token を検知 (token < 8 文字)', () => {
    const r = mkRecord({ pid: 1234, token: 'abc' })
    const v = validateProcessBoundary(r, {
      currentPid: 1234,
      nowMs: Date.parse('2026-05-04T10:00:01Z'),
      knownPeerPids: [],
      maxParallel: 1,
    })
    expect(v.valid).toBe(false)
    expect(v.reasons.some((r) => r.includes('weak_token'))).toBe(true)
  })

  it('verdict は frozen (immutable)', () => {
    const r = mkRecord({ pid: 1234 })
    const v = validateProcessBoundary(r, {
      currentPid: 1234,
      nowMs: Date.parse('2026-05-04T10:00:01Z'),
      knownPeerPids: [],
      maxParallel: 1,
    })
    expect(Object.isFrozen(v)).toBe(true)
    expect(Object.isFrozen(v.reasons)).toBe(true)
  })
})

// ============================================================================
// assertSingleParallel
// ============================================================================

describe('assertSingleParallel', () => {
  it('単一 record → violations なし', () => {
    const r = mkRecord({ pid: 1234 })
    const violations = assertSingleParallel([r])
    expect(violations).toHaveLength(0)
  })

  it('同 projectId で parallelAllowed=false × 2 件 → 違反', () => {
    const a = mkRecord({ pid: 100, token: 't0000000000000000aaaa' })
    const b = mkRecord({ pid: 200, token: 't0000000000000000bbbb' })
    const violations = assertSingleParallel([a, b])
    expect(violations.length).toBeGreaterThan(0)
  })

  it('startupToken 重複は違反として検出', () => {
    const a = mkRecord({ pid: 100, token: 'samesametoken1234567890', projectId: 'PRJ-019' })
    const b = mkRecord({ pid: 200, token: 'samesametoken1234567890', projectId: 'PRJ-018' })
    const violations = assertSingleParallel([a, b])
    expect(violations.length).toBeGreaterThan(0)
  })
})

// ============================================================================
// DuplicateLaunchDetector
// ============================================================================

describe('DuplicateLaunchDetector', () => {
  it('first_launch: 初回登録は accepted=true', () => {
    const d = new DuplicateLaunchDetector()
    const r = mkRecord({ pid: 1234, token: 'tok-firstaaaaaaaaaaaa' })
    const a = d.record(r)
    expect(a.accepted).toBe(true)
    expect(a.reason).toBe('first_launch')
    expect(d.size()).toBe(1)
  })

  it('duplicate_token: 同 token 再登録 → reject', () => {
    const d = new DuplicateLaunchDetector()
    const r1 = mkRecord({ pid: 100, token: 'tok-samesametoken123456' })
    const r2 = mkRecord({ pid: 200, token: 'tok-samesametoken123456' })
    d.record(r1)
    const a = d.record(r2)
    expect(a.accepted).toBe(false)
    expect(a.reason).toBe('duplicate_token')
    expect(a.conflictingFingerprint).not.toBeNull()
  })

  it('duplicate_pid: 同 pid + parallelAllowed=false → reject', () => {
    const d = new DuplicateLaunchDetector()
    const r1 = mkRecord({ pid: 100, token: 'tok-pid-aaaaaaaaaaaaaa' })
    const r2 = mkRecord({ pid: 100, token: 'tok-pid-bbbbbbbbbbbbbb' })
    d.record(r1)
    const a = d.record(r2)
    expect(a.accepted).toBe(false)
    expect(a.reason).toBe('duplicate_pid')
  })

  it('parallel_exceeded: 同 projectId で maxParallel=1 を超過 → reject', () => {
    const d = new DuplicateLaunchDetector({ maxParallelPerProject: 1 })
    const r1 = mkRecord({ pid: 100, token: 'tok-prjaaaaaaaaaaaaaaa', projectId: 'PRJ-019' })
    const r2 = mkRecord({ pid: 200, token: 'tok-prjbbbbbbbbbbbbbbb', projectId: 'PRJ-019' })
    d.record(r1)
    const a = d.record(r2)
    expect(a.accepted).toBe(false)
    expect(a.reason).toBe('parallel_exceeded')
  })

  it('release: fingerprint 指定で削除 → 再登録可能', () => {
    const d = new DuplicateLaunchDetector({ maxParallelPerProject: 1 })
    const r1 = mkRecord({ pid: 100, token: 'tok-rel-1aaaaaaaaaaaaa' })
    const a1 = d.record(r1)
    expect(a1.accepted).toBe(true)
    const removed = d.release(a1.fingerprint)
    expect(removed).toBe(1)
    expect(d.size()).toBe(0)
    // 再登録可能
    const r2 = mkRecord({ pid: 100, token: 'tok-rel-2aaaaaaaaaaaaa' })
    const a2 = d.record(r2)
    expect(a2.accepted).toBe(true)
  })

  it('parallelAllowed=true なら同 pid でも accept', () => {
    const d = new DuplicateLaunchDetector()
    const r1 = mkRecord({ pid: 100, token: 'tok-par-1aaaaaaaaaaaaa', parallelAllowed: true })
    const r2 = mkRecord({ pid: 100, token: 'tok-par-2aaaaaaaaaaaaa', parallelAllowed: true })
    expect(d.record(r1).accepted).toBe(true)
    expect(d.record(r2).accepted).toBe(true)
  })

  it('countForProject: parallelAllowed=false のみカウント', () => {
    const d = new DuplicateLaunchDetector({ maxParallelPerProject: 5 })
    d.record(mkRecord({ pid: 1, token: 'tok-cf-1aaaaaaaaaaaaaaa' }))
    d.record(mkRecord({ pid: 2, token: 'tok-cf-2aaaaaaaaaaaaaaa' }))
    d.record(mkRecord({ pid: 3, token: 'tok-cf-3aaaaaaaaaaaaaaa', parallelAllowed: true }))
    expect(d.countForProject('PRJ-019')).toBe(2)
  })
})

// ============================================================================
// convertViolationsToReasons
// ============================================================================

describe('convertViolationsToReasons', () => {
  it('IsolationViolation 配列 → reason 文字列配列に変換', () => {
    const reasons = convertViolationsToReasons([
      { type: 'pid_duplicate', detail: 'pid 100 found' },
      { type: 'token_duplicate', detail: 'token X duplicated' },
    ])
    expect(reasons).toHaveLength(2)
    expect(reasons[0]).toContain('pid_duplicate')
    expect(reasons[1]).toContain('token_duplicate')
  })

  it('空配列 → 空配列 + frozen', () => {
    const reasons = convertViolationsToReasons([])
    expect(reasons).toHaveLength(0)
    expect(Object.isFrozen(reasons)).toBe(true)
  })
})

// ============================================================================
// DEFAULT_BOUNDARY_CONTEXT
// ============================================================================

describe('DEFAULT_BOUNDARY_CONTEXT', () => {
  it('frozen + maxParallel=1 (G-V2-01 default)', () => {
    expect(Object.isFrozen(DEFAULT_BOUNDARY_CONTEXT)).toBe(true)
    expect(DEFAULT_BOUNDARY_CONTEXT.maxParallel).toBe(1)
  })
})
