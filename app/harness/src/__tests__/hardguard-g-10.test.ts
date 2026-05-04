/**
 * hardguard-g-10.test — Round 14 Dev-F (緊急対応): G-10 kill-switch 周辺 hardening.
 *
 * DoD: 10-15 tests.
 *
 * coverage:
 *   - validateKillTriggerReason: 5 検査 (length / control / email PII / api key / normalize)
 *   - canonicalKillTriggerSignature: 決定論性
 *   - assessKillPropagation: 5 検査 (空 / 名前重複 / 必須 method)
 *   - KillTriggerLedger: cooldown / 重複 / LRU trim
 *   - classifyKillSeverity: 4 source 分類
 */
import { describe, it, expect } from 'vitest'
import {
  validateKillTriggerReason,
  canonicalKillTriggerSignature,
  assessKillPropagation,
  KillTriggerLedger,
  classifyKillSeverity,
  KILL_REASON_MIN_LENGTH,
  KILL_REASON_MAX_LENGTH,
  DEFAULT_KILL_LEDGER_COOLDOWN_MS,
} from '../hardguard-g-10.js'
import type {
  SubprocessKillTarget,
  CircuitBreakerOpenTarget,
} from '../kill-switch.js'

function mkSubproc(name: string): SubprocessKillTarget {
  return {
    name,
    alive: () => true,
    signal: (_sig: 'SIGTERM' | 'SIGKILL') => Promise.resolve(),
  }
}

function mkCb(name: string): CircuitBreakerOpenTarget {
  return {
    name,
    forceOpen: (_reason?: string) => undefined,
  }
}

// ============================================================================
// validateKillTriggerReason
// ============================================================================

describe('validateKillTriggerReason', () => {
  it('正常 reason → valid=true + normalize', () => {
    const v = validateKillTriggerReason('manual stop  via   slack')
    expect(v.valid).toBe(true)
    expect(v.normalizedReason).toBe('manual stop via slack')
    expect(v.issues).toHaveLength(0)
  })

  it('空 reason → empty_reason issue', () => {
    const v = validateKillTriggerReason('   ')
    expect(v.valid).toBe(false)
    expect(v.issues.some((i) => i.includes('empty_reason'))).toBe(true)
  })

  it('短すぎる reason → reason_too_short', () => {
    const v = validateKillTriggerReason('ab')
    expect(v.valid).toBe(false)
    expect(v.issues.some((i) => i.includes('reason_too_short'))).toBe(true)
  })

  it('長すぎる reason → reason_too_long', () => {
    const longStr = 'x'.repeat(KILL_REASON_MAX_LENGTH + 10)
    const v = validateKillTriggerReason(longStr)
    expect(v.valid).toBe(false)
    expect(v.issues.some((i) => i.includes('reason_too_long'))).toBe(true)
  })

  it('制御文字含み → control_chars_present', () => {
    const v = validateKillTriggerReason('manual\x01stop\x02nope')
    expect(v.valid).toBe(false)
    expect(v.issues.some((i) => i.includes('control_chars_present'))).toBe(true)
  })

  it('email-like → email_like_pii_suspicion', () => {
    const v = validateKillTriggerReason('triggered by alice@example.com action')
    expect(v.valid).toBe(false)
    expect(v.issues.some((i) => i.includes('email_like_pii_suspicion'))).toBe(true)
  })

  it('API key 風 → api_key_like_pii_suspicion', () => {
    const v = validateKillTriggerReason('found AKIAIOSFODNN7EXAMPLE in payload')
    expect(v.valid).toBe(false)
    expect(v.issues.some((i) => i.includes('api_key_like_pii_suspicion'))).toBe(true)
  })

  it('verdict frozen', () => {
    const v = validateKillTriggerReason('manual stop trigger')
    expect(Object.isFrozen(v)).toBe(true)
    expect(Object.isFrozen(v.issues)).toBe(true)
  })

  it('KILL_REASON_MIN_LENGTH constant exposed', () => {
    expect(KILL_REASON_MIN_LENGTH).toBeGreaterThan(0)
    expect(KILL_REASON_MAX_LENGTH).toBeGreaterThan(KILL_REASON_MIN_LENGTH)
  })
})

// ============================================================================
// canonicalKillTriggerSignature
// ============================================================================

describe('canonicalKillTriggerSignature', () => {
  it('決定論的: 同じ入力 → 同じ署名', () => {
    const a = canonicalKillTriggerSignature('manual stop', 'manual')
    const b = canonicalKillTriggerSignature('manual stop', 'manual')
    expect(a).toBe(b)
  })

  it('異 reason → 異 署名', () => {
    const a = canonicalKillTriggerSignature('manual stop', 'manual')
    const b = canonicalKillTriggerSignature('budget exceeded', 'manual')
    expect(a).not.toBe(b)
  })

  it('source は lowercase 化', () => {
    const a = canonicalKillTriggerSignature('manual stop', 'Manual')
    const b = canonicalKillTriggerSignature('manual stop', 'manual')
    expect(a).toBe(b)
  })
})

// ============================================================================
// assessKillPropagation
// ============================================================================

describe('assessKillPropagation', () => {
  it('正常: 1 subproc + 1 cb → safe=true', () => {
    const a = assessKillPropagation({
      subprocessTargets: [mkSubproc('worker-1')],
      circuitBreakerTargets: [mkCb('cb-1')],
    })
    expect(a.safe).toBe(true)
    expect(a.subprocessCount).toBe(1)
    expect(a.circuitBreakerCount).toBe(1)
    expect(a.issues).toHaveLength(0)
  })

  it('subprocess 空 → no_subprocess_targets issue', () => {
    const a = assessKillPropagation({
      subprocessTargets: [],
      circuitBreakerTargets: [mkCb('cb-1')],
    })
    expect(a.safe).toBe(false)
    expect(a.issues.some((i) => i.includes('no_subprocess_targets'))).toBe(true)
  })

  it('circuit-breaker 空 → no_circuit_breaker_targets issue', () => {
    const a = assessKillPropagation({
      subprocessTargets: [mkSubproc('worker-1')],
      circuitBreakerTargets: [],
    })
    expect(a.safe).toBe(false)
    expect(a.issues.some((i) => i.includes('no_circuit_breaker_targets'))).toBe(true)
  })

  it('subprocess name 重複検出', () => {
    const a = assessKillPropagation({
      subprocessTargets: [mkSubproc('worker-1'), mkSubproc('worker-1')],
      circuitBreakerTargets: [mkCb('cb-1')],
    })
    expect(a.safe).toBe(false)
    expect(a.issues.some((i) => i.includes('subprocess_name_duplicate'))).toBe(true)
  })

  it('assessment frozen', () => {
    const a = assessKillPropagation({
      subprocessTargets: [mkSubproc('w')],
      circuitBreakerTargets: [mkCb('c')],
    })
    expect(Object.isFrozen(a)).toBe(true)
    expect(Object.isFrozen(a.issues)).toBe(true)
  })
})

// ============================================================================
// KillTriggerLedger
// ============================================================================

describe('KillTriggerLedger', () => {
  it('first_trigger: 初回登録は accepted=true', () => {
    const led = new KillTriggerLedger({ nowMs: () => 1000 })
    const a = led.record('manual stop', 'manual')
    expect(a.accepted).toBe(true)
    expect(a.reason).toBe('first_trigger')
    expect(led.size()).toBe(1)
  })

  it('cooldown 内 重複 trigger → cooldown_violation で reject', () => {
    let t = 1000
    const led = new KillTriggerLedger({
      cooldownMs: 5000,
      nowMs: () => t,
    })
    const a = led.record('manual stop', 'manual')
    expect(a.accepted).toBe(true)
    t = 3000 // 2 秒後
    const b = led.record('manual stop', 'manual')
    expect(b.accepted).toBe(false)
    expect(b.reason).toBe('cooldown_violation')
  })

  it('cooldown 経過後の再登録は accept', () => {
    let t = 1000
    const led = new KillTriggerLedger({
      cooldownMs: 1000,
      nowMs: () => t,
    })
    led.record('manual stop', 'manual')
    t = 3000 // 2 秒後 > cooldown
    const b = led.record('manual stop', 'manual')
    expect(b.accepted).toBe(true)
  })

  it('countForSignature: signature 単位の集計', () => {
    let t = 1000
    const led = new KillTriggerLedger({
      cooldownMs: 100,
      nowMs: () => t,
    })
    led.record('manual stop', 'manual')
    t = 2000
    led.record('manual stop', 'manual')
    t = 3000
    led.record('budget exceeded', 'budget')
    const sig = canonicalKillTriggerSignature('manual stop', 'manual')
    expect(led.countForSignature(sig)).toBe(2)
  })

  it('LRU trim: maxEntries 超過で先頭が削除される', () => {
    let t = 1000
    const led = new KillTriggerLedger({
      cooldownMs: 0, // 重複許可
      maxEntries: 3,
      nowMs: () => {
        t += 1
        return t
      },
    })
    led.record('reason a', 'manual')
    led.record('reason b', 'manual')
    led.record('reason c', 'manual')
    led.record('reason d', 'manual')
    expect(led.size()).toBe(3)
    expect(led.last()?.reason).toBe('reason d')
  })

  it('snapshot は frozen', () => {
    const led = new KillTriggerLedger()
    led.record('manual stop a', 'manual')
    const snap = led.snapshot()
    expect(Object.isFrozen(snap)).toBe(true)
  })
})

// ============================================================================
// classifyKillSeverity
// ============================================================================

describe('classifyKillSeverity', () => {
  it('budget → critical', () => {
    expect(classifyKillSeverity('budget exceeded', 'budget')).toBe('critical')
  })

  it('manual → info', () => {
    expect(classifyKillSeverity('manual stop', 'manual')).toBe('info')
  })

  it('continuous_runtime → warning', () => {
    expect(classifyKillSeverity('runtime_limit reached', 'continuous_runtime')).toBe(
      'warning',
    )
  })

  it('file_signal → critical', () => {
    expect(classifyKillSeverity('STOP signal file detected', 'file_signal')).toBe(
      'critical',
    )
  })

  it('unknown source + reason → warning (default)', () => {
    expect(classifyKillSeverity('something unrecognised', 'other')).toBe('warning')
  })
})

// ============================================================================
// constants
// ============================================================================

describe('exposed constants', () => {
  it('DEFAULT_KILL_LEDGER_COOLDOWN_MS = 5000', () => {
    expect(DEFAULT_KILL_LEDGER_COOLDOWN_MS).toBe(5000)
  })
})
