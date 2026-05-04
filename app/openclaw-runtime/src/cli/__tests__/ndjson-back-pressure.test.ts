/**
 * cli/__tests__/ndjson-back-pressure.test — Round 13 Dev-C 着地 (Task B):
 *   ndjson-parser.ts への back-pressure 拡張 (BackPressureError + createBackPressureNdjsonParser)
 *   の動作検証 (15-22 tests 目標、実装 19)。
 *
 * 検証範囲:
 *   - mode='throw' / mode='event' 双方の queue overflow 動作
 *   - paused / resumed / drain / pause / overflow event 発火順序
 *   - AbortSignal 連携 (external abort で feed 拒否、queue clear)
 *   - async iterator API (for await...of)
 *   - high/low water mark の自動 pause/resume
 *   - 既存 createNdjsonStreamParser の 18 tests に加えて 19 tests 追加
 */
import { describe, it, expect, vi } from 'vitest'

import {
  BackPressureError,
  createBackPressureNdjsonParser,
} from '../ndjson-parser.js'

describe('ndjson-back-pressure / overflow modes (R13 Dev-C)', () => {
  it('1. mode=event: queue overflow で overflow event 発火、event は drop', () => {
    const events: Array<[string, unknown]> = []
    const p = createBackPressureNdjsonParser({
      maxQueueSize: 3,
      mode: 'event',
      highWaterMark: 1.0,
      lowWaterMark: 0.0,
    })
    p.onBackPressure((ev, meta) => events.push([ev, meta]))
    p.feed('{"a":1}\n{"a":2}\n{"a":3}\n{"a":4}\n')
    expect(p.queuedCount).toBe(3)
    expect(p.droppedCount).toBe(1)
    expect(events.some(([n]) => n === 'overflow')).toBe(true)
  })

  it('2. mode=throw: queue overflow で BackPressureError throw', () => {
    const p = createBackPressureNdjsonParser({
      maxQueueSize: 2,
      mode: 'throw',
      highWaterMark: 1.0,
      lowWaterMark: 0.0,
    })
    expect(() => {
      p.feed('{"a":1}\n{"a":2}\n{"a":3}\n')
    }).toThrowError(BackPressureError)
  })

  it('3. BackPressureError は code/meta を保持', () => {
    const p = createBackPressureNdjsonParser({
      maxQueueSize: 1,
      mode: 'throw',
    })
    try {
      p.feed('{"a":1}\n{"a":2}\n')
      expect.fail('should throw')
    } catch (e) {
      expect(e).toBeInstanceOf(BackPressureError)
      const err = e as BackPressureError
      expect(err.code).toBe('queue_overflow')
      expect(err.meta).toBeDefined()
      expect(err.name).toBe('BackPressureError')
    }
  })

  it('4. high/low water mark で自動 pause / resume', () => {
    const events: string[] = []
    const p = createBackPressureNdjsonParser({
      maxQueueSize: 10,
      mode: 'event',
      highWaterMark: 0.8,
      lowWaterMark: 0.3,
    })
    p.onBackPressure((ev) => events.push(ev))
    // 8 件で 80% 到達 → pause 発火 (8 >= 0.8 * 10)
    for (let i = 0; i < 8; i++) p.feed(`{"i":${i}}\n`)
    expect(events.includes('pause')).toBe(true)
    expect(p.isPaused()).toBe(true)
    // pull で drain → 3 件まで減らす (30% 以下) → resume
    for (let i = 0; i < 6; i++) p.pull()
    expect(p.queuedCount).toBe(2)
    expect(p.isPaused()).toBe(false)
    expect(events.includes('resume')).toBe(true)
  })
})

describe('ndjson-back-pressure / pause / resume / abort (R13 Dev-C)', () => {
  it('5. paused 中の feed は拒否、event mode で overflow 発火', () => {
    const events: string[] = []
    const p = createBackPressureNdjsonParser({ mode: 'event' })
    p.onBackPressure((ev) => events.push(ev))
    p.pause()
    expect(p.isPaused()).toBe(true)
    const out = p.feed('{"a":1}\n')
    expect(out).toEqual([])
    expect(events.includes('overflow')).toBe(true)
    expect(p.parsedCount).toBe(0)
  })

  it('6. paused 中の feed は throw mode で BackPressureError(paused_overflow)', () => {
    const p = createBackPressureNdjsonParser({ mode: 'throw' })
    p.pause()
    try {
      p.feed('{"a":1}\n')
      expect.fail('should throw')
    } catch (e) {
      const err = e as BackPressureError
      expect(err.code).toBe('paused_overflow')
    }
  })

  it('7. resume() で再 feed 可能', () => {
    const p = createBackPressureNdjsonParser({ mode: 'event' })
    p.pause()
    p.feed('{"a":1}\n') // dropped
    p.resume()
    p.feed('{"b":2}\n')
    expect(p.parsedCount).toBe(1)
    expect(p.queuedCount).toBe(1)
  })

  it('8. AbortSignal が abort されると feed 拒否、queue clear', () => {
    const ctrl = new AbortController()
    const p = createBackPressureNdjsonParser({
      mode: 'event',
      abortSignal: ctrl.signal,
    })
    p.feed('{"a":1}\n{"a":2}\n')
    expect(p.queuedCount).toBe(2)
    ctrl.abort()
    expect(p.isAborted()).toBe(true)
    expect(p.queuedCount).toBe(0)
    const out = p.feed('{"a":3}\n')
    expect(out).toEqual([])
  })

  it('9. AbortSignal pre-aborted の場合 feed 即拒否', () => {
    const ctrl = new AbortController()
    ctrl.abort()
    const p = createBackPressureNdjsonParser({
      mode: 'event',
      abortSignal: ctrl.signal,
    })
    expect(p.isAborted()).toBe(true)
    const out = p.feed('{"a":1}\n')
    expect(out).toEqual([])
  })

  it('10. abort 後 throw mode で feed → BackPressureError(aborted)', () => {
    const ctrl = new AbortController()
    const p = createBackPressureNdjsonParser({
      mode: 'throw',
      abortSignal: ctrl.signal,
    })
    ctrl.abort()
    try {
      p.feed('{"a":1}\n')
      expect.fail('should throw')
    } catch (e) {
      expect((e as BackPressureError).code).toBe('aborted')
    }
  })
})

describe('ndjson-back-pressure / pull / drain (R13 Dev-C)', () => {
  it('11. pull() で先頭 event 取得、queue 空で drain event', () => {
    const events: string[] = []
    const p = createBackPressureNdjsonParser({ mode: 'event' })
    p.onBackPressure((ev) => events.push(ev))
    p.feed('{"a":1}\n{"b":2}\n')
    expect(p.pull()).toEqual({ a: 1 })
    expect(p.pull()).toEqual({ b: 2 })
    expect(p.pull()).toBeUndefined()
    expect(events.includes('drain')).toBe(true)
  })

  it('12. droppedCount は overflow 件数を正確に記録', () => {
    const p = createBackPressureNdjsonParser({
      maxQueueSize: 2,
      mode: 'event',
    })
    p.feed('{"a":1}\n{"b":2}\n{"c":3}\n{"d":4}\n')
    expect(p.droppedCount).toBe(2)
    expect(p.queuedCount).toBe(2)
  })
})

describe('ndjson-back-pressure / async iterator (R13 Dev-C)', () => {
  it('13. iterator() で for await 消費可能', async () => {
    const p = createBackPressureNdjsonParser({ mode: 'event' })
    p.feed('{"a":1}\n{"b":2}\n')
    const it = p.iterator()
    const a = await it.next()
    expect(a.done).toBe(false)
    expect(a.value).toEqual({ a: 1 })
    const b = await it.next()
    expect(b.value).toEqual({ b: 2 })
  })

  it('14. iterator: queue 空で待機、後続 feed で resolve', async () => {
    const p = createBackPressureNdjsonParser({ mode: 'event' })
    const it = p.iterator()
    const pending = it.next()
    // microtask 1 周回す
    await Promise.resolve()
    p.feed('{"x":1}\n')
    const r = await pending
    expect(r.done).toBe(false)
    expect(r.value).toEqual({ x: 1 })
  })

  it('15. iterator.return() で aborted、後続 next は done', async () => {
    const p = createBackPressureNdjsonParser({ mode: 'event' })
    const it = p.iterator()
    if (it.return) await it.return(undefined)
    expect(p.isAborted()).toBe(true)
    const r = await it.next()
    expect(r.done).toBe(true)
  })

  it('16. AbortSignal 発火で iterator pending が done 解決', async () => {
    const ctrl = new AbortController()
    const p = createBackPressureNdjsonParser({
      mode: 'event',
      abortSignal: ctrl.signal,
    })
    const it = p.iterator()
    const pending = it.next()
    await Promise.resolve()
    ctrl.abort()
    const r = await pending
    expect(r.done).toBe(true)
  })
})

describe('ndjson-back-pressure / setMaxQueueSize / listener cleanup (R13 Dev-C)', () => {
  it('17. setMaxQueueSize で動的に queue 上限変更可能', () => {
    const p = createBackPressureNdjsonParser({
      maxQueueSize: 100,
      mode: 'event',
    })
    p.feed('{"a":1}\n')
    p.setMaxQueueSize(2)
    expect(() => p.setMaxQueueSize(0)).toThrow()
    expect(() => p.setMaxQueueSize(-1)).toThrow()
  })

  it('18. onBackPressure 戻り値 unsubscribe で listener 解除', () => {
    const p = createBackPressureNdjsonParser({
      maxQueueSize: 1,
      mode: 'event',
    })
    const listener = vi.fn()
    const unsub = p.onBackPressure(listener)
    p.feed('{"a":1}\n{"b":2}\n')
    expect(listener).toHaveBeenCalled()
    listener.mockClear()
    unsub()
    p.feed('{"c":3}\n{"d":4}\n')
    expect(listener).not.toHaveBeenCalled()
  })

  it('19. buffer overflow (改行なし long line) は throw mode で BackPressureError(buffer_overflow)', () => {
    const p = createBackPressureNdjsonParser({
      maxBufferLength: 8,
      skipMalformed: false,
      mode: 'throw',
    })
    try {
      p.feed('x'.repeat(32))
      expect.fail('should throw')
    } catch (e) {
      expect((e as BackPressureError).code).toBe('buffer_overflow')
    }
  })
})
