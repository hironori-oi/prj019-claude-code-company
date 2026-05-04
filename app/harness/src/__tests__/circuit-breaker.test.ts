import { describe, it, expect } from 'vitest'
import { CircuitBreaker, CircuitOpenError } from '../circuit-breaker.js'

describe('CircuitBreaker', () => {
  it('starts in closed state', () => {
    const cb = new CircuitBreaker({ name: 'test' })
    expect(cb.status().state).toBe('closed')
  })

  it('passes through successful calls', async () => {
    const cb = new CircuitBreaker({ name: 'test' })
    const r = await cb.fire(async () => 42)
    expect(r).toBe(42)
    expect(cb.status().state).toBe('closed')
  })

  it('opens after failureThreshold consecutive failures', async () => {
    const cb = new CircuitBreaker({ name: 'test', failureThreshold: 3 })
    for (let i = 0; i < 3; i++) {
      await expect(cb.fire(async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom')
    }
    expect(cb.status().state).toBe('open')
  })

  it('rejects fast when open with CircuitOpenError', async () => {
    const cb = new CircuitBreaker({ name: 'test', failureThreshold: 1 })
    await expect(cb.fire(async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom')
    expect(cb.status().state).toBe('open')
    await expect(cb.fire(async () => 1)).rejects.toBeInstanceOf(CircuitOpenError)
  })

  it('transitions to half-open after cooldown', async () => {
    let now = 0
    const cb = new CircuitBreaker({
      name: 'test',
      failureThreshold: 1,
      cooldownMs: 1000,
      now: () => now,
    })
    await expect(cb.fire(async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom')
    expect(cb.status().state).toBe('open')
    now += 1500
    const r = await cb.fire(async () => 'recovered')
    expect(r).toBe('recovered')
    expect(cb.status().state).toBe('closed')
  })

  it('half-open back to open on failure', async () => {
    let now = 0
    const cb = new CircuitBreaker({
      name: 'test',
      failureThreshold: 1,
      cooldownMs: 100,
      now: () => now,
    })
    await expect(cb.fire(async () => Promise.reject(new Error('boom')))).rejects.toThrow()
    now += 200
    await expect(cb.fire(async () => Promise.reject(new Error('still bad')))).rejects.toThrow(
      'still bad',
    )
    expect(cb.status().state).toBe('open')
  })

  it('resets state', async () => {
    const cb = new CircuitBreaker({ name: 'test', failureThreshold: 1 })
    await expect(cb.fire(async () => Promise.reject(new Error('x')))).rejects.toThrow()
    cb.reset()
    expect(cb.status().state).toBe('closed')
  })

  it('successThreshold > 1 keeps half-open until enough successes', async () => {
    let now = 0
    const cb = new CircuitBreaker({
      name: 'test',
      failureThreshold: 1,
      successThreshold: 2,
      cooldownMs: 100,
      now: () => now,
    })
    await expect(cb.fire(async () => Promise.reject(new Error('x')))).rejects.toThrow()
    now += 200
    await cb.fire(async () => 'ok1')
    expect(cb.status().state).toBe('half-open')
    await cb.fire(async () => 'ok2')
    expect(cb.status().state).toBe('closed')
  })
})
